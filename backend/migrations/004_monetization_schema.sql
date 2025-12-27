-- LocalSquares Monetization Schema
-- Run this migration in your Supabase SQL editor

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('trial', 'monthly', 'annual')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired')),
    
    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_payment_method_id TEXT,
    
    -- Billing periods
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    trial_end TIMESTAMPTZ,
    
    -- Lifecycle
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT subscriptions_user_unique UNIQUE(user_id)
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_trial_end ON public.subscriptions(trial_end) WHERE trial_end IS NOT NULL;

-- Featured bookings table (1 per board per day)
CREATE TABLE IF NOT EXISTS public.featured_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Booking details
    featured_date DATE NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 500, -- $5.00
    
    -- Payment
    stripe_payment_intent_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints: one featured spot per board per day
    CONSTRAINT featured_bookings_unique_per_day UNIQUE(board_id, featured_date)
);

CREATE INDEX idx_featured_bookings_pin_id ON public.featured_bookings(pin_id);
CREATE INDEX idx_featured_bookings_board_id ON public.featured_bookings(board_id);
CREATE INDEX idx_featured_bookings_date ON public.featured_bookings(featured_date);
CREATE INDEX idx_featured_bookings_board_date ON public.featured_bookings(board_id, featured_date);

-- Add subscription_id to pins (links pin to active subscription)
ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Add impression tracking fields to pins for rotation algorithm
ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS impressions_24h INTEGER DEFAULT 0;
ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS last_impression_reset TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.pins ADD COLUMN IF NOT EXISTS content_updated_at TIMESTAMPTZ;

CREATE INDEX idx_pins_subscription_id ON public.pins(subscription_id);
CREATE INDEX idx_pins_impressions_24h ON public.pins(impressions_24h);

-- Email logs table (for tracking sent emails)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL, -- 'welcome', 'trial_warning', 'weekly_stats', etc.
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);

-- Apply updated_at trigger to subscriptions
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to reset 24h impression counts (called by scheduled job)
CREATE OR REPLACE FUNCTION reset_daily_impressions()
RETURNS void AS $$
BEGIN
    UPDATE public.pins
    SET impressions_24h = 0,
        last_impression_reset = NOW()
    WHERE last_impression_reset < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to increment 24h impression count
CREATE OR REPLACE FUNCTION increment_pin_impressions_24h()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.pins
    SET impressions_24h = impressions_24h + 1
    WHERE id = NEW.pin_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track 24h impressions
CREATE TRIGGER track_pin_impressions_24h
    AFTER INSERT ON public.impressions
    FOR EACH ROW EXECUTE FUNCTION increment_pin_impressions_24h();

-- RLS Policies for new tables

-- Subscriptions: Users can read their own subscription
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Featured bookings: Users can view all, but only create/manage their own
ALTER TABLE public.featured_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view featured bookings"
    ON public.featured_bookings FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own featured bookings"
    ON public.featured_bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own featured bookings"
    ON public.featured_bookings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage featured bookings"
    ON public.featured_bookings FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Email logs: Users can view their own
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs"
    ON public.email_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage email logs"
    ON public.email_logs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');


