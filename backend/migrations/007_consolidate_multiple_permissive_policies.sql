-- Migration 007: Consolidate Multiple Permissive RLS Policies
-- Resolves Supabase linter "multiple_permissive_policies" performance warnings
-- by merging overlapping permissive policies into one policy per (table, action).
-- Run after 006_fix_supabase_linter_issues.sql

-- ============================================
-- BOARDS: SELECT has two policies (everyone + admins)
-- Keep one SELECT; restrict admin policy to INSERT/UPDATE/DELETE only
-- ============================================

DROP POLICY IF EXISTS "Admins can manage boards" ON public.boards;
CREATE POLICY "Admins can insert boards"
    ON public.boards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
CREATE POLICY "Admins can update boards"
    ON public.boards FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
CREATE POLICY "Admins can delete boards"
    ON public.boards FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
-- "Boards are viewable by everyone" remains the only SELECT policy

-- ============================================
-- PINS: Multiple policies per action (everyone/merchant/admin)
-- Single policy per action with OR conditions
-- ============================================

DROP POLICY IF EXISTS "Active pins are viewable by everyone" ON public.pins;
DROP POLICY IF EXISTS "Merchants can view own pins" ON public.pins;
DROP POLICY IF EXISTS "Admins can manage all pins" ON public.pins;
DROP POLICY IF EXISTS "Merchants can create pins" ON public.pins;
DROP POLICY IF EXISTS "Merchants can update own pins" ON public.pins;
DROP POLICY IF EXISTS "Merchants can delete own pins" ON public.pins;

CREATE POLICY "Pins SELECT"
    ON public.pins FOR SELECT
    USING (
        status = 'active'
        OR (select auth.uid()) = user_id
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

CREATE POLICY "Pins INSERT"
    ON public.pins FOR INSERT
    WITH CHECK (
        (
            (select auth.uid()) = user_id
            AND EXISTS (
                SELECT 1 FROM public.users
                WHERE id = (select auth.uid()) AND role = 'merchant'
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

CREATE POLICY "Pins UPDATE"
    ON public.pins FOR UPDATE
    USING (
        (select auth.uid()) = user_id
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    )
    WITH CHECK (
        (select auth.uid()) = user_id
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

CREATE POLICY "Pins DELETE"
    ON public.pins FOR DELETE
    USING (
        (select auth.uid()) = user_id
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- ============================================
-- PIN_SLOTS: SELECT has two (everyone + admins)
-- ============================================

DROP POLICY IF EXISTS "Admins can manage pin slots" ON public.pin_slots;
CREATE POLICY "Admins can insert pin slots"
    ON public.pin_slots FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
CREATE POLICY "Admins can update pin slots"
    ON public.pin_slots FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
CREATE POLICY "Admins can delete pin slots"
    ON public.pin_slots FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
-- "Pin slots are viewable by everyone" remains the only SELECT policy

-- ============================================
-- PAYMENTS: Two SELECT policies (own + admins)
-- ============================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Payments SELECT"
    ON public.payments FOR SELECT
    USING (
        (select auth.uid()) = user_id
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- ============================================
-- REPORTS: Two SELECT policies (own + admins)
-- ============================================

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Reports SELECT"
    ON public.reports FOR SELECT
    USING (
        (select auth.uid()) = user_id
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );

-- ============================================
-- SUBSCRIPTIONS: Two SELECT (own + service_role)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Subscriptions SELECT"
    ON public.subscriptions FOR SELECT
    USING (
        (select auth.uid()) = user_id
        OR (select auth.role()) = 'service_role'
    );
CREATE POLICY "Subscriptions INSERT"
    ON public.subscriptions FOR INSERT
    WITH CHECK ((select auth.role()) = 'service_role');
CREATE POLICY "Subscriptions UPDATE"
    ON public.subscriptions FOR UPDATE
    USING ((select auth.role()) = 'service_role');
CREATE POLICY "Subscriptions DELETE"
    ON public.subscriptions FOR DELETE
    USING ((select auth.role()) = 'service_role');

-- ============================================
-- FEATURED_BOOKINGS: Multiple per action
-- ============================================

DROP POLICY IF EXISTS "Anyone can view featured bookings" ON public.featured_bookings;
DROP POLICY IF EXISTS "Users can create their own featured bookings" ON public.featured_bookings;
DROP POLICY IF EXISTS "Users can manage their own featured bookings" ON public.featured_bookings;
DROP POLICY IF EXISTS "Service role can manage featured bookings" ON public.featured_bookings;

CREATE POLICY "Featured bookings SELECT"
    ON public.featured_bookings FOR SELECT
    USING (true);

CREATE POLICY "Featured bookings INSERT"
    ON public.featured_bookings FOR INSERT
    WITH CHECK (
        (select auth.uid()) = user_id
        OR (select auth.role()) = 'service_role'
    );

CREATE POLICY "Featured bookings UPDATE"
    ON public.featured_bookings FOR UPDATE
    USING (
        (select auth.uid()) = user_id
        OR (select auth.role()) = 'service_role'
    );

CREATE POLICY "Featured bookings DELETE"
    ON public.featured_bookings FOR DELETE
    USING ((select auth.role()) = 'service_role');

-- ============================================
-- EMAIL_LOGS: Two SELECT (own + service_role)
-- ============================================

DROP POLICY IF EXISTS "Users can view their own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Service role can manage email logs" ON public.email_logs;
CREATE POLICY "Email logs SELECT"
    ON public.email_logs FOR SELECT
    USING (
        (select auth.uid()) = user_id
        OR (select auth.role()) = 'service_role'
    );
CREATE POLICY "Email logs INSERT"
    ON public.email_logs FOR INSERT
    WITH CHECK ((select auth.role()) = 'service_role');
CREATE POLICY "Email logs UPDATE"
    ON public.email_logs FOR UPDATE
    USING ((select auth.role()) = 'service_role');
CREATE POLICY "Email logs DELETE"
    ON public.email_logs FOR DELETE
    USING ((select auth.role()) = 'service_role');

-- ============================================
-- ISLANDS: SELECT has two (everyone + admins)
-- ============================================

DROP POLICY IF EXISTS "Admins can manage islands" ON public.islands;
CREATE POLICY "Admins can insert islands"
    ON public.islands FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
CREATE POLICY "Admins can update islands"
    ON public.islands FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
CREATE POLICY "Admins can delete islands"
    ON public.islands FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
-- "Anyone can view islands" remains the only SELECT policy
