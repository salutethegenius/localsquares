# LocalSquares Setup Verification Checklist

## ✅ Database Setup

Check in Supabase Dashboard → Table Editor:
- [ ] `users` table exists
- [ ] `boards` table exists
- [ ] `pins` table exists
- [ ] `pin_slots` table exists
- [ ] `impressions` table exists
- [ ] `clicks` table exists
- [ ] `payments` table exists
- [ ] `reports` table exists

## ✅ Storage Setup

Check in Supabase Dashboard → Storage:
- [ ] `pin-images` bucket exists
- [ ] Bucket is marked as **Public**
- [ ] File size limit is set (5MB recommended)
- [ ] Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

## ✅ Row-Level Security (RLS)

Check in Supabase Dashboard → Authentication → Policies:
- [ ] RLS is enabled on all tables
- [ ] Policies are created for users, boards, pins, etc.

## ✅ Storage Policies

Check in Supabase Dashboard → Storage → Policies:
- [ ] "Users can upload pin images" policy exists
- [ ] "Users can update own pin images" policy exists
- [ ] "Users can delete own pin images" policy exists
- [ ] "Public can view pin images" policy exists

## ✅ Authentication Setup

Check in Supabase Dashboard → Authentication → Providers:
- [ ] Email provider is enabled
- [ ] Phone provider is enabled (optional)
- [ ] Site URL is configured: `http://localhost:3000`
- [ ] Redirect URLs include: `http://localhost:3000/**`

## ✅ Servers Running

- [ ] Frontend: http://localhost:3000 (should load)
- [ ] Backend: http://localhost:8000/health (should return `{"status": "healthy"}`)
- [ ] Backend API Docs: http://localhost:8000/docs (should show Swagger UI)

## ✅ Environment Variables

Check that `.env` files exist:
- [ ] `backend/.env` exists with Supabase credentials
- [ ] `frontend/.env.local` exists with Supabase credentials

## 🎉 Ready to Use!

If all items above are checked, LocalSquares is fully configured!

### Test the Setup

1. **Visit Frontend**: http://localhost:3000
   - Should see the landing page with board selector

2. **Test API**: http://localhost:8000/docs
   - Should see FastAPI interactive documentation
   - Try the `/health` endpoint

3. **Create a Test Board** (optional):
   ```sql
   INSERT INTO public.boards (neighborhood, slug, display_name, description, grid_cols)
   VALUES ('downtown-nassau', 'downtown-nassau', 'Downtown Nassau', 'Bay Street area', 3);
   ```

4. **Test Authentication**:
   - Go to http://localhost:3000/claim
   - Try signing up with email (magic link)

