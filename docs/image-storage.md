# Image Storage Setup Guide

LocalSquares uses a two-layer image storage strategy:
1. **Supabase Storage** - Primary storage for uploaded images
2. **Cloudflare Images** (optional) - CDN optimization and image processing

## Supabase Storage Setup

1. **Create Storage Bucket** (if not already done):
   - Go to Supabase Dashboard → Storage
   - Create bucket named `pin-images`
   - Set as public bucket
   - Set file size limit to 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

2. **Storage Policies** (already in Supabase setup):
   - Users can upload their own images
   - Public read access for all images
   - Users can update/delete their own images

## Cloudflare Images Setup (Optional)

Cloudflare Images provides:
- Global CDN delivery
- Automatic image optimization
- Variant generation (thumbnails, sizes)
- Better performance on weak mobile networks

### Setup Steps

1. **Create Cloudflare Account** (if you don't have one)
   - Go to [cloudflare.com](https://cloudflare.com)

2. **Enable Cloudflare Images**
   - Go to Cloudflare Dashboard → Images
   - Enable the service
   - Note your Account ID

3. **Create API Token**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create token with `Cloudflare Images:Edit` permission
   - Save the token securely

4. **Configure Environment Variables**

   **Frontend** (`.env.local`):
   ```bash
   NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your_account_id
   ```

   **Backend** (`.env`):
   ```bash
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_API_TOKEN=your_api_token
   ```

### Using Cloudflare Images

When Cloudflare Images is configured:

1. Images are uploaded to Supabase Storage first (for backup/management)
2. Images can be processed through Cloudflare Images API for optimization
3. Optimized URLs are stored in the database
4. Thumbnails are generated automatically via Cloudflare variants

**Note**: Full Cloudflare Images integration requires server-side processing (backend API) due to API token security. The current implementation uses Supabase Storage URLs directly. To enable Cloudflare optimization, implement the upload endpoint in the backend API.

## Image Upload Flow

1. User selects image in frontend
2. Image is validated (size, type)
3. Image is uploaded to Supabase Storage
4. Public URL is generated
5. (Optional) Image is processed via Cloudflare Images
6. URLs (original + thumbnail) are stored in database

## Image Optimization Tips

- **Recommended sizes**:
  - Pin images: 1200x1200px (1:1 aspect ratio)
  - Thumbnails: 400x400px
  
- **File formats**:
  - WebP preferred (better compression)
  - JPEG fallback
  - PNG for transparency needs

- **File size limits**:
  - Max 5MB per image
  - Target 500KB-1MB after optimization

## Future Enhancements

- Automatic image resizing/optimization on upload
- Multiple variant sizes (mobile, tablet, desktop)
- Lazy loading with blur placeholders
- Image compression before upload

