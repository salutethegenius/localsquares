# Development Setup Guide

This guide will help you set up LocalSquares for local development.

## Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Python** 3.11+
- **Git**
- **Supabase account** (free tier works)
- **Docker** (optional, for local backend)

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd localsquares
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start development server:

```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 3. Set Up Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

Start development server:

```bash
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`

### 4. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run migrations (see [supabase-setup.md](./supabase-setup.md))
3. Configure authentication providers
4. Create storage bucket for images

### 5. Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Copy and run `backend/migrations/001_initial_schema.sql`
3. Copy and run `backend/migrations/002_rls_policies.sql`

## Development Workflow

### Frontend Development

```bash
cd frontend
npm run dev
```

- Hot reload enabled
- TypeScript type checking
- ESLint for code quality

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

- Auto-reload on code changes
- FastAPI automatic API documentation at `/docs`
- OpenAPI schema at `/openapi.json`

### Testing API

Visit `http://localhost:8000/docs` for interactive API documentation.

## Project Structure

```
localsquares/
├── frontend/              # Next.js application
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and helpers
│   └── styles/           # Global styles
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # Pydantic models
│   │   ├── services/     # Business logic
│   │   └── core/         # Configuration
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
└── shared/               # Shared types/schemas
```

## Environment Variables

### Frontend (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Cloudflare Images
NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID=xxx
```

### Backend (.env)

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Application
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Optional: Cloudflare
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_API_TOKEN=xxx
```

## Common Tasks

### Create a New Migration

1. Create file in `backend/migrations/`
2. Name it `003_description.sql`
3. Add SQL statements
4. Run in Supabase SQL Editor

### Add a New API Endpoint

1. Create route in `backend/app/api/v1/`
2. Add to `backend/app/api/v1/__init__.py`
3. Create service in `backend/app/services/` if needed
4. Document in OpenAPI schema (automatic with FastAPI)

### Add a New Frontend Page

1. Create file in `frontend/app/`
2. Use App Router conventions
3. Add to navigation if needed

### Run Linters

**Frontend:**
```bash
cd frontend
npm run lint
```

**Backend:**
```bash
cd backend
# Install linters
pip install black flake8 mypy
# Run
black app/
flake8 app/
mypy app/
```

## Troubleshooting

### Frontend Issues

**Module not found:**
- Run `npm install` again
- Delete `node_modules` and reinstall

**TypeScript errors:**
- Check `tsconfig.json` paths
- Restart TypeScript server in IDE

**Supabase connection fails:**
- Verify `.env.local` variables are correct
- Check Supabase project is active

### Backend Issues

**Import errors:**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

**Database connection fails:**
- Verify Supabase credentials in `.env`
- Check network connectivity

**Port already in use:**
- Change port: `uvicorn app.main:app --port 8001`
- Or kill process using port 8000

### Database Issues

**Migration errors:**
- Check Supabase logs
- Verify SQL syntax
- Ensure previous migrations ran successfully

**RLS policy issues:**
- Check policies in Supabase Dashboard
- Verify user roles and permissions

## Next Steps

- Read [architecture.md](./architecture.md) for system design
- Read [deployment.md](./deployment.md) for production setup
- Read [supabase-setup.md](./supabase-setup.md) for database configuration
- Read [auth-setup.md](./auth-setup.md) for authentication setup
- Read [image-storage.md](./image-storage.md) for image handling

