-- LocalSquares Initial Database Schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'merchant' CHECK (role IN ('merchant', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Merchant-specific fields
    business_name TEXT,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    CONSTRAINT users_email_unique UNIQUE(email),
    CONSTRAINT users_phone_unique UNIQUE(phone)
);

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_verified ON public.users(verified);

-- Boards table (neighborhood boards)
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    neighborhood TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    
    -- Board configuration
    grid_cols INTEGER DEFAULT 3, -- Grid columns (mobile-first)
    grid_rows INTEGER, -- Auto-calculated, can be null
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible metadata for future features
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT boards_neighborhood_unique UNIQUE(neighborhood),
    CONSTRAINT boards_slug_unique UNIQUE(slug)
);

CREATE INDEX idx_boards_slug ON public.boards(slug);
CREATE INDEX idx_boards_neighborhood ON public.boards(neighborhood);

-- Pins table (business listings/cards)
CREATE TABLE IF NOT EXISTS public.pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Visual content (required)
    image_url TEXT NOT NULL,
    thumbnail_url TEXT, -- Optimized thumbnail
    
    -- Core information
    title TEXT NOT NULL,
    caption TEXT, -- Short, bold caption
    
    -- Flexible metadata (JSONB for extensibility)
    metadata JSONB DEFAULT '{}'::jsonb,
    -- Example metadata structure:
    -- {
    --   "hours": {"monday": "9am-5pm", ...},
    --   "contact": {"phone": "+1242...", "whatsapp": "+1242...", "email": "..."},
    --   "location": {"address": "...", "lat": 0.0, "lng": 0.0},
    --   "tags": ["restaurant", "outdoor"],
    --   "website": "https://..."
    -- }
    
    -- Status and moderation
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'archived', 'reported')),
    featured BOOLEAN DEFAULT FALSE,
    
    -- Analytics (denormalized for quick access)
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- Optional expiration for paid slots
    
    -- Indexes
    CONSTRAINT pins_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

CREATE INDEX idx_pins_board_id ON public.pins(board_id);
CREATE INDEX idx_pins_user_id ON public.pins(user_id);
CREATE INDEX idx_pins_status ON public.pins(status);
CREATE INDEX idx_pins_featured ON public.pins(featured);
CREATE INDEX idx_pins_created_at ON public.pins(created_at DESC);
CREATE INDEX idx_pins_board_status ON public.pins(board_id, status);
CREATE INDEX idx_pins_metadata_gin ON public.pins USING GIN(metadata); -- For JSONB queries

-- Pin slots table (grid position management)
CREATE TABLE IF NOT EXISTS public.pin_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    pin_id UUID REFERENCES public.pins(id) ON DELETE SET NULL,
    
    -- Grid position (1-indexed)
    row_position INTEGER NOT NULL,
    col_position INTEGER NOT NULL,
    
    -- Slot metadata
    slot_type TEXT DEFAULT 'standard' CHECK (slot_type IN ('standard', 'featured', 'sponsored')),
    reserved_until TIMESTAMPTZ, -- For temporary reservations
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT pin_slots_position_unique UNIQUE(board_id, row_position, col_position),
    CONSTRAINT pin_slots_pin_unique UNIQUE(pin_id) -- One pin = one slot
);

CREATE INDEX idx_pin_slots_board_id ON public.pin_slots(board_id);
CREATE INDEX idx_pin_slots_pin_id ON public.pin_slots(pin_id);
CREATE INDEX idx_pin_slots_position ON public.pin_slots(board_id, row_position, col_position);

-- Impressions table (view tracking)
CREATE TABLE IF NOT EXISTS public.impressions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    
    -- User tracking (anonymous)
    session_id TEXT, -- Client-side session identifier
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- If logged in
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_impressions_pin_id ON public.impressions(pin_id);
CREATE INDEX idx_impressions_board_id ON public.impressions(board_id);
CREATE INDEX idx_impressions_created_at ON public.impressions(created_at DESC);
CREATE INDEX idx_impressions_session ON public.impressions(session_id, created_at);

-- Clicks table (interaction tracking)
CREATE TABLE IF NOT EXISTS public.clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    
    -- Click type
    click_type TEXT NOT NULL DEFAULT 'pin' CHECK (click_type IN ('pin', 'contact', 'website', 'map', 'share')),
    
    -- User tracking
    session_id TEXT,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Request metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clicks_pin_id ON public.clicks(pin_id);
CREATE INDEX idx_clicks_board_id ON public.clicks(board_id);
CREATE INDEX idx_clicks_type ON public.clicks(click_type);
CREATE INDEX idx_clicks_created_at ON public.clicks(created_at DESC);
CREATE INDEX idx_clicks_session ON public.clicks(session_id, created_at);

-- Payments table (for future payment integration)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pin_id UUID REFERENCES public.pins(id) ON DELETE SET NULL,
    
    -- Payment details
    amount_cents INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Payment provider
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'local', 'crypto')),
    provider_payment_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT payments_provider_id_unique UNIQUE(provider, provider_payment_id)
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_pin_id ON public.payments(pin_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- Reports table (moderation)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Reporter (can be anonymous)
    
    -- Report details
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Indexes
    CONSTRAINT reports_reason_not_empty CHECK (LENGTH(TRIM(reason)) > 0)
);

CREATE INDEX idx_reports_pin_id ON public.reports(pin_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON public.boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pins_updated_at BEFORE UPDATE ON public.pins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_slots_updated_at BEFORE UPDATE ON public.pin_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment pin view count
CREATE OR REPLACE FUNCTION increment_pin_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.pins
    SET view_count = view_count + 1
    WHERE id = NEW.pin_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-increment view count
CREATE TRIGGER increment_pin_views
    AFTER INSERT ON public.impressions
    FOR EACH ROW EXECUTE FUNCTION increment_pin_view_count();

-- Function to increment pin click count
CREATE OR REPLACE FUNCTION increment_pin_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.pins
    SET click_count = click_count + 1
    WHERE id = NEW.pin_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-increment click count
CREATE TRIGGER increment_pin_clicks
    AFTER INSERT ON public.clicks
    FOR EACH ROW EXECUTE FUNCTION increment_pin_click_count();

