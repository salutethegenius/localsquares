-- Row-Level Security (RLS) Policies for LocalSquares
-- Run this migration after 001_initial_schema.sql

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Anyone can read user profiles (for displaying merchant info)
CREATE POLICY "Users are viewable by everyone"
    ON public.users FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Only authenticated users can insert (via trigger from auth.users)
CREATE POLICY "Authenticated users can create profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- BOARDS POLICIES
-- ============================================

-- Everyone can read boards (public)
CREATE POLICY "Boards are viewable by everyone"
    ON public.boards FOR SELECT
    USING (true);

-- Only admins can create/update/delete boards
CREATE POLICY "Admins can manage boards"
    ON public.boards FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PINS POLICIES
-- ============================================

-- Everyone can read active pins
CREATE POLICY "Active pins are viewable by everyone"
    ON public.pins FOR SELECT
    USING (status = 'active');

-- Merchants can read their own pins (any status)
CREATE POLICY "Merchants can view own pins"
    ON public.pins FOR SELECT
    USING (auth.uid() = user_id);

-- Merchants can create pins
CREATE POLICY "Merchants can create pins"
    ON public.pins FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'merchant'
        )
    );

-- Merchants can update their own pins
CREATE POLICY "Merchants can update own pins"
    ON public.pins FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Merchants can delete their own pins
CREATE POLICY "Merchants can delete own pins"
    ON public.pins FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can do everything with pins
CREATE POLICY "Admins can manage all pins"
    ON public.pins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PIN SLOTS POLICIES
-- ============================================

-- Everyone can read pin slots
CREATE POLICY "Pin slots are viewable by everyone"
    ON public.pin_slots FOR SELECT
    USING (true);

-- Only admins can manage pin slots (grid management)
CREATE POLICY "Admins can manage pin slots"
    ON public.pin_slots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- IMPRESSIONS POLICIES
-- ============================================

-- Anyone can create impressions (tracking views)
CREATE POLICY "Anyone can create impressions"
    ON public.impressions FOR INSERT
    WITH CHECK (true);

-- Only admins and pin owners can read impressions (analytics)
CREATE POLICY "Admins and pin owners can view impressions"
    ON public.impressions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.pins
            WHERE id = impressions.pin_id AND user_id = auth.uid()
        )
    );

-- ============================================
-- CLICKS POLICIES
-- ============================================

-- Anyone can create clicks (tracking interactions)
CREATE POLICY "Anyone can create clicks"
    ON public.clicks FOR INSERT
    WITH CHECK (true);

-- Only admins and pin owners can read clicks (analytics)
CREATE POLICY "Admins and pin owners can view clicks"
    ON public.clicks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.pins
            WHERE id = clicks.pin_id AND user_id = auth.uid()
        )
    );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================

-- Users can read their own payments
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

-- Authenticated users can create payments
CREATE POLICY "Authenticated users can create payments"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own payments (limited - usually handled by webhooks)
CREATE POLICY "Users can update own payments"
    ON public.payments FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can read all payments
CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- REPORTS POLICIES
-- ============================================

-- Anyone can create reports (moderation)
CREATE POLICY "Anyone can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (true);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update reports (review, resolve, dismiss)
CREATE POLICY "Admins can update reports"
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- HELPER FUNCTION: Get current user role
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.users
        WHERE id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

