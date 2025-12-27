# Quick Setup Guide

## Step 1: Run Database Migrations

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor** → Click **New query**
3. Copy and paste the contents of `backend/migrations/001_initial_schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for success message
6. Create a new query, copy and paste `backend/migrations/002_rls_policies.sql`
7. Click **Run** again

**Verify**: Go to **Table Editor** - you should see: users, boards, pins, pin_slots, impressions, clicks, payments, reports

## Step 2: Create Storage Bucket

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Configure:
   - **Name**: `pin-images`
   - **Public bucket**: ✅ **Yes** (toggle ON)
   - **File size limit**: 5MB
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/webp`
4. Click **Create bucket**

## Step 3: Set Storage Policies

1. Go to **SQL Editor** → **New query**
2. Paste and run this SQL:

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

## Step 4: Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Enable **Phone** provider (optional, requires SMS setup)
4. Go to **Authentication** → **URL Configuration**
   - Set **Site URL**: `http://localhost:3000` (for dev)
   - Add **Redirect URLs**: `http://localhost:3000/**`

## Step 5: Seed Initial Data (Optional)

Run this in SQL Editor to create initial Nassau boards:

```sql
INSERT INTO public.boards (neighborhood, slug, display_name, description, grid_cols)
VALUES
  ('downtown-nassau', 'downtown-nassau', 'Downtown Nassau', 'Bay Street and surrounding area', 3),
  ('cable-beach', 'cable-beach', 'Cable Beach', 'Cable Beach strip and resorts', 3),
  ('paradise-island', 'paradise-island', 'Paradise Island', 'Paradise Island businesses', 3),
  ('eastern-nassau', 'eastern-nassau', 'Eastern Nassau', 'Eastern Road and beyond', 3),
  ('western-nassau', 'western-nassau', 'Western Nassau', 'West Bay Street area', 3)
ON CONFLICT (slug) DO NOTHING;
```

## Done! 🎉

Your LocalSquares setup is complete. The servers should already be running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

