# Setting Up Storage Bucket in Supabase

Follow these steps to create the `pin-images` storage bucket:

## Steps

1. **Go to Supabase Dashboard**
   - Open your Supabase project at https://supabase.com/dashboard
   - Navigate to your LocalSquares project

2. **Open Storage**
   - Click on "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket" button
   - Fill in the form:
     - **Name**: `pin-images`
     - **Public bucket**: ✅ **Yes** (toggle this ON - images need to be publicly accessible)
     - **File size limit**: `5242880` (5MB in bytes, or just type "5" and select MB)
     - **Allowed MIME types**: 
       - `image/jpeg`
       - `image/png`
       - `image/webp`
     - Click "Create bucket"

4. **Set Storage Policies** (Important!)

   After creating the bucket, you need to set up storage policies. Go to SQL Editor and run:

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

5. **Verify Bucket**
   - Go back to Storage
   - You should see `pin-images` bucket listed
   - It should show as "Public"

## Testing

After setup, you can test by:
- Trying to upload an image through your app
- Checking that the image URL is publicly accessible

