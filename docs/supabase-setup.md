# Supabase Setup Guide

This guide covers setting up Supabase for LocalSquares, including authentication, database, and storage configuration.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region closest to your users (or use default)
3. Wait for the project to finish provisioning

## 2. Run Database Migrations

1. Go to **SQL Editor** in your Supabase dashboard
2. Run `backend/migrations/001_initial_schema.sql` first
3. Then run `backend/migrations/002_rls_policies.sql`

These migrations will create all tables, indexes, triggers, and RLS policies.

## 3. Configure Authentication

### Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if needed (magic links)
4. Set **Site URL** to your frontend URL (e.g., `http://localhost:3000` for dev)

### Enable Phone Authentication

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable **Phone** provider
3. Configure SMS provider (Twilio recommended for Bahamas)
   - You'll need Twilio credentials (Account SID, Auth Token, Phone Number)
   - For development, you can use Twilio's test credentials

### Authentication Settings

1. Go to **Authentication** → **Settings**
2. Configure:
   - **Site URL**: Your frontend URL
   - **Redirect URLs**: Add your allowed redirect URLs
   - **Email Rate Limits**: Adjust if needed
   - **Phone Rate Limits**: Adjust if needed

## 4. Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Create bucket named `pin-images` with these settings:
   - **Public bucket**: Yes (images need to be publicly accessible)
   - **File size limit**: 5MB (adjust as needed)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### Storage Policies

Run this SQL in the SQL Editor to set up storage policies:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Users can upload pin images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pin-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own images
CREATE POLICY "Users can update own pin images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pin-images' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own pin images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pin-images' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to images
CREATE POLICY "Public can view pin images"
ON storage.objects FOR SELECT
USING (bucket_id = 'pin-images');
```

## 5. Get API Keys

1. Go to **Settings** → **API** in Supabase dashboard
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (for client-side access)
   - **service_role key** (for backend/server-side access - keep secret!)

Add these to your `.env` files:
- Frontend: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Backend: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## 6. Seed Initial Data (Optional)

You may want to create some initial boards for Nassau neighborhoods:

```sql
INSERT INTO public.boards (neighborhood, slug, display_name, description, grid_cols)
VALUES
  ('downtown-nassau', 'downtown-nassau', 'Downtown Nassau', 'Bay Street and surrounding area', 3),
  ('cable-beach', 'cable-beach', 'Cable Beach', 'Cable Beach strip and resorts', 3),
  ('paradise-island', 'paradise-island', 'Paradise Island', 'Paradise Island businesses', 3),
  ('eastern-nassau', 'eastern-nassau', 'Eastern Nassau', 'Eastern Road and beyond', 3),
  ('western-nassau', 'western-nassau', 'Western Nassau', 'West Bay Street area', 3);
```

## 7. Create Admin User (Optional)

To create an admin user, first sign up via the app, then run:

```sql
-- Replace 'user-email@example.com' with the actual email
UPDATE public.users
SET role = 'admin'
WHERE email = 'user-email@example.com';
```

## Notes

- **RLS (Row-Level Security)**: All tables have RLS enabled. Policies are defined in `002_rls_policies.sql`
- **Storage**: Images are stored in Supabase Storage, then can be processed/optimized via Cloudflare Images
- **Auth**: Both email (magic links) and phone verification are supported
- **Database**: Uses PostgreSQL with JSONB for flexible metadata on pins

## Testing

Test authentication flows:
1. Email signup with magic link
2. Phone signup with SMS verification
3. User profile creation (should auto-create in `users` table via trigger)

Test storage:
1. Upload an image via the app
2. Verify it appears in the `pin-images` bucket
3. Verify public URLs work

