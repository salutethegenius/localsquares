# Running Migrations in Supabase

Supabase is connected via tools (Dashboard SQL Editor, Supabase CLI, MCP, or other integrations). Run migrations in order against your linked project.

## Migration order

Run these files **in order** (each depends on the previous):

| Order | File | Purpose |
|-------|------|--------|
| 1 | `backend/migrations/001_initial_schema.sql` | Tables: users, boards, pins, pin_slots, impressions, clicks, payments, reports |
| 2 | `backend/migrations/002_rls_policies.sql` | RLS policies for all tables |
| 3 | `backend/migrations/003_storage_policies.sql` | Storage RLS for `pin-images` bucket |
| 4 | `backend/migrations/004_monetization_schema.sql` | subscriptions, featured_bookings, email_logs |
| 5 | `backend/migrations/005_islands_structure.sql` | islands table, boards.island_id, RLS |
| 6 | `backend/migrations/006_fix_supabase_linter_issues.sql` | Security definer view, search_path, initplan fixes |
| 7 | `backend/migrations/007_consolidate_multiple_permissive_policies.sql` | Single RLS policy per (table, action) |
| 8 | `backend/migrations/008_fix_assessment_leads_rls.sql` | Optional: only if you have `public.assessment_leads` |

## Option A: Supabase Dashboard or connected tool

1. Open your Supabase project (Dashboard → SQL Editor, or your connected tool).
2. For each migration file above, run its full contents (paste or execute file).
3. Run them in order; wait for each to finish before the next.

## Option B: Supabase CLI

If the project is linked (`supabase link`):

- **Run files from this repo:** Use your tool or CLI to execute each `backend/migrations/*.sql` file in order (e.g. `psql` with connection string, or a script that runs each file).
- **Use Supabase migration flow:** Copy the contents of each file into new files under `supabase/migrations/` with timestamped names (e.g. `20240101000000_initial_schema.sql`), then run:
  ```bash
  supabase db push
  ```

## Verification

After migrations:

- **Table Editor:** Check that `users`, `boards`, `pins`, `pin_slots`, `impressions`, `clicks`, `payments`, `reports`, `subscriptions`, `featured_bookings`, `email_logs`, `islands` exist.
- **Storage:** Ensure bucket `pin-images` exists and has the expected policies (or run 003 if you use it for storage RLS).

## Common issues

- **"relation already exists"**: Table or object already created; safe to skip that statement or run idempotent migrations only.
- **"permission denied"**: Run as database owner or with a role that can create objects.
- **008 fails**: Expected if `public.assessment_leads` does not exist; skip 008 or run it only in projects that have that table.
