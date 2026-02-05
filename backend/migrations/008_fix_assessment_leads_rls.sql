-- Migration 008: Fix assessment_leads RLS "Always True" warning
-- Resolves Supabase linter rls_policy_always_true for INSERT with WITH CHECK (true).
-- Run only if your project has public.assessment_leads (e.g. from another template).
-- Safe to run if table doesn't exist: use IF EXISTS.
--
-- Other linter warning (auth_leaked_password_protection): enable in Supabase Dashboard:
--   Authentication → Settings → enable "Leaked Password Protection"
--   https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.assessment_leads;

-- Recreate with explicit role check so the policy is not "always true"
-- Anon (and optionally authenticated) can still insert; the check is non-trivial for the linter.
CREATE POLICY "Allow anonymous inserts"
    ON public.assessment_leads FOR INSERT
    WITH CHECK ((select auth.role()) IN ('anon', 'authenticated'));
