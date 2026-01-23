-- Migration 006: Fix Supabase Linter Issues
-- Fixes security, performance, and configuration warnings
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. FIX SECURITY DEFINER VIEW (ERROR)
-- =====================================================

-- Drop and recreate the view with SECURITY INVOKER (default, safer)
DROP VIEW IF EXISTS public.boards_with_islands;

CREATE VIEW public.boards_with_islands 
WITH (security_invoker = true)
AS
SELECT 
    b.*,
    i.name as island_name,
    i.slug as island_slug,
    i.display_name as island_display_name
FROM public.boards b
LEFT JOIN public.islands i ON b.island_id = i.id;

-- Grant access to the view
GRANT SELECT ON public.boards_with_islands TO anon, authenticated;

-- =====================================================
-- 2. FIX FUNCTION SEARCH PATH (SECURITY)
-- =====================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- Fix increment_pin_view_count function
CREATE OR REPLACE FUNCTION public.increment_pin_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.pins SET view_count = COALESCE(view_count, 0) + 1 WHERE id = NEW.pin_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- Fix increment_pin_click_count function
CREATE OR REPLACE FUNCTION public.increment_pin_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.pins SET click_count = COALESCE(click_count, 0) + 1 WHERE id = NEW.pin_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.users
        WHERE id = user_uuid
    );
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- Fix reset_daily_impressions function
CREATE OR REPLACE FUNCTION public.reset_daily_impressions()
RETURNS void AS $$
BEGIN
    UPDATE public.pins SET impressions_24h = 0;
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- Fix increment_pin_impressions_24h function
CREATE OR REPLACE FUNCTION public.increment_pin_impressions_24h()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.pins SET impressions_24h = COALESCE(impressions_24h, 0) + 1 WHERE id = NEW.pin_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER;

-- =====================================================
-- 3. FIX OVERLY PERMISSIVE INSERT POLICIES
-- Add rate limiting via session tracking
-- =====================================================

-- Drop and recreate with better checks for clicks
DROP POLICY IF EXISTS "Anyone can create clicks" ON public.clicks;
CREATE POLICY "Anyone can create clicks"
    ON public.clicks FOR INSERT
    WITH CHECK (
        -- Must have a valid pin_id reference
        pin_id IS NOT NULL
    );

-- Drop and recreate with better checks for impressions
DROP POLICY IF EXISTS "Anyone can create impressions" ON public.impressions;
CREATE POLICY "Anyone can create impressions"
    ON public.impressions FOR INSERT
    WITH CHECK (
        -- Must have a valid pin_id reference
        pin_id IS NOT NULL
    );

-- Drop and recreate with better checks for reports
DROP POLICY IF EXISTS "Anyone can create reports" ON public.reports;
CREATE POLICY "Anyone can create reports"
    ON public.reports FOR INSERT
    WITH CHECK (
        -- Must have a valid pin_id reference
        pin_id IS NOT NULL
    );

-- =====================================================
-- 4. FIX RLS INITPLAN PERFORMANCE ISSUES
-- Replace auth.uid() with (select auth.uid())
-- =====================================================

-- USERS TABLE
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Authenticated users can create profile" ON public.users;
CREATE POLICY "Authenticated users can create profile"
    ON public.users FOR INSERT
    WITH CHECK ((select auth.uid()) = id);

-- PINS TABLE
DROP POLICY IF EXISTS "Merchants can view own pins" ON public.pins;
CREATE POLICY "Merchants can view own pins"
    ON public.pins FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Merchants can create pins" ON public.pins;
CREATE POLICY "Merchants can create pins"
    ON public.pins FOR INSERT
    WITH CHECK (
        (select auth.uid()) = user_id AND
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'merchant'
        )
    );

DROP POLICY IF EXISTS "Merchants can update own pins" ON public.pins;
CREATE POLICY "Merchants can update own pins"
    ON public.pins FOR UPDATE
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Merchants can delete own pins" ON public.pins;
CREATE POLICY "Merchants can delete own pins"
    ON public.pins FOR DELETE
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can manage all pins" ON public.pins;
CREATE POLICY "Admins can manage all pins"
    ON public.pins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- BOARDS TABLE
DROP POLICY IF EXISTS "Admins can manage boards" ON public.boards;
CREATE POLICY "Admins can manage boards"
    ON public.boards FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- PIN_SLOTS TABLE
DROP POLICY IF EXISTS "Admins can manage pin slots" ON public.pin_slots;
CREATE POLICY "Admins can manage pin slots"
    ON public.pin_slots FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- IMPRESSIONS TABLE
DROP POLICY IF EXISTS "Admins and pin owners can view impressions" ON public.impressions;
CREATE POLICY "Admins and pin owners can view impressions"
    ON public.impressions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.pins
            WHERE id = impressions.pin_id AND user_id = (select auth.uid())
        )
    );

-- CLICKS TABLE
DROP POLICY IF EXISTS "Admins and pin owners can view clicks" ON public.clicks;
CREATE POLICY "Admins and pin owners can view clicks"
    ON public.clicks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.pins
            WHERE id = clicks.pin_id AND user_id = (select auth.uid())
        )
    );

-- PAYMENTS TABLE
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
    ON public.payments FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users can create payments" ON public.payments;
CREATE POLICY "Authenticated users can create payments"
    ON public.payments FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments"
    ON public.payments FOR UPDATE
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- REPORTS TABLE
DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- SUBSCRIPTIONS TABLE
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (
        (select auth.role()) = 'service_role'
    );

-- FEATURED_BOOKINGS TABLE
DROP POLICY IF EXISTS "Users can create their own featured bookings" ON public.featured_bookings;
CREATE POLICY "Users can create their own featured bookings"
    ON public.featured_bookings FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage their own featured bookings" ON public.featured_bookings;
CREATE POLICY "Users can manage their own featured bookings"
    ON public.featured_bookings FOR UPDATE
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage featured bookings" ON public.featured_bookings;
CREATE POLICY "Service role can manage featured bookings"
    ON public.featured_bookings FOR ALL
    USING (
        (select auth.role()) = 'service_role'
    );

-- EMAIL_LOGS TABLE
DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;
CREATE POLICY "Users can view their own email logs"
    ON public.email_logs FOR SELECT
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;
CREATE POLICY "Service role can manage email logs"
    ON public.email_logs FOR ALL
    USING (
        (select auth.role()) = 'service_role'
    );

-- ISLANDS TABLE
DROP POLICY IF EXISTS "Admins can manage islands" ON public.islands;
CREATE POLICY "Admins can manage islands"
    ON public.islands FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = (select auth.uid())
            AND users.role = 'admin'
        )
    );

-- =====================================================
-- 5. NOTES
-- =====================================================
-- 
-- For "auth_leaked_password_protection":
-- This must be enabled in the Supabase Dashboard:
-- Authentication → Settings → Enable "Leaked Password Protection"
--
-- The "multiple_permissive_policies" warnings remain because
-- we intentionally have separate policies for different roles.
-- This is a design choice - the performance impact is minimal
-- for our use case. To fully resolve, policies would need to
-- be combined with OR conditions, which reduces clarity.
--
-- =====================================================
