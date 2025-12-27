# Deployment Guide

This guide covers deploying LocalSquares to production.

## Architecture Overview

- **Frontend**: Vercel (Next.js)
- **Backend**: Railway or Fly.io (FastAPI)
- **Database & Auth**: Supabase
- **Images & CDN**: Cloudflare Images (optional)

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Railway or Fly.io account
- Supabase account
- Cloudflare account (optional, for images)

## 1. Frontend Deployment (Vercel)

### Setup Steps

1. **Connect Repository to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `frontend` directory as the root directory

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

3. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id (optional)
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll get a URL like `localsquares.vercel.app`

5. **Custom Domain** (optional):
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS as instructed

## 2. Backend Deployment (Railway)

### Setup Steps

1. **Connect Repository to Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Service**:
   - Set Root Directory to `backend`
   - Railway will auto-detect Python

3. **Set Environment Variables**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ENVIRONMENT=production
   DEBUG=false
   CORS_ORIGINS=https://your-frontend-url.vercel.app
   CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id (optional)
   CLOUDFLARE_API_TOKEN=your-cloudflare-api-token (optional)
   ```

4. **Configure Port**:
   - Railway automatically sets `PORT` environment variable
   - Update `railway.json` start command to use `$PORT`

5. **Deploy**:
   - Railway will automatically deploy on push to main
   - You'll get a URL like `localsquares-api.railway.app`

6. **Custom Domain** (optional):
   - Go to Settings → Networking
   - Add custom domain
   - Configure DNS

## 2b. Backend Deployment (Fly.io Alternative)

### Setup Steps

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login to Fly**:
   ```bash
   fly auth login
   ```

3. **Initialize App**:
   ```bash
   cd backend
   fly launch
   ```
   - Follow prompts
   - Use existing `fly.toml` if prompted

4. **Set Secrets (Environment Variables)**:
   ```bash
   fly secrets set SUPABASE_URL=https://your-project.supabase.co
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   fly secrets set ENVIRONMENT=production
   fly secrets set DEBUG=false
   fly secrets set CORS_ORIGINS=https://your-frontend-url.vercel.app
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

6. **Check Status**:
   ```bash
   fly status
   fly logs
   ```

## 3. Supabase Configuration

### Update Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add production URLs:
   - Site URL: `https://your-frontend-url.vercel.app`
   - Redirect URLs:
     - `https://your-frontend-url.vercel.app/**`
     - `https://your-custom-domain.com/**`

### Update API CORS (if needed)

If using Supabase client directly (not through backend), ensure CORS is configured for your frontend domain.

## 4. Environment Variables Summary

### Frontend (Vercel)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=xxx (optional)
```

### Backend (Railway/Fly.io)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=https://your-frontend.vercel.app
CLOUDFLARE_ACCOUNT_ID=xxx (optional)
CLOUDFLARE_API_TOKEN=xxx (optional)
```

## 5. Database Migrations

Run migrations in Supabase before deploying:

1. Go to Supabase Dashboard → SQL Editor
2. Run `backend/migrations/001_initial_schema.sql`
3. Run `backend/migrations/002_rls_policies.sql`
4. Verify tables are created

## 6. Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and health check passes
- [ ] Database migrations applied
- [ ] Environment variables set correctly
- [ ] Supabase redirect URLs updated
- [ ] CORS configured correctly
- [ ] Authentication flow works (email + phone)
- [ ] Image upload works
- [ ] Analytics tracking works
- [ ] Custom domains configured (if applicable)

## 7. Monitoring

### Vercel Analytics

- Built-in analytics available in Vercel dashboard
- Enable in Project Settings → Analytics

### Railway Monitoring

- View logs in Railway dashboard
- Set up alerts for errors

### Fly.io Monitoring

```bash
# View logs
fly logs

# Check metrics
fly status
```

## 8. Continuous Deployment

Both Vercel and Railway/Fly.io support automatic deployments:

- **Vercel**: Deploys on push to main branch automatically
- **Railway**: Deploys on push to main branch automatically
- **Fly.io**: Run `fly deploy` manually or set up CI/CD

## Troubleshooting

### Frontend Issues

**Build fails:**
- Check Node.js version (should be 18+)
- Verify all environment variables are set
- Check build logs in Vercel dashboard

**API calls fail:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings on backend
- Check browser console for errors

### Backend Issues

**Server won't start:**
- Check Python version (should be 3.11+)
- Verify all environment variables are set
- Check logs for errors

**Database connection fails:**
- Verify Supabase credentials are correct
- Check network connectivity
- Verify RLS policies are set up

### Authentication Issues

**Magic links not working:**
- Verify Site URL and Redirect URLs in Supabase
- Check email delivery settings
- Verify frontend URL matches Supabase settings

**SMS not working:**
- Verify Twilio credentials in Supabase
- Check Twilio account has credits
- Verify phone number format

