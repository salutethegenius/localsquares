-- Storage Policies for pin-images bucket
-- Run this AFTER creating the pin-images bucket in Supabase Storage

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
