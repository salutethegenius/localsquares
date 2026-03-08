# LocalSquares

A visual neighborhood billboard platform optimized for mobile, sunlight readability, and Bahamian context. Think Instagram meets a town corkboard.

## Architecture

- **Frontend**: Next.js 14 (App Router) with Tailwind + custom design system
- **Backend**: FastAPI (Python) with Supabase integration
- **Auth / DB / Storage**: Supabase (Postgres + Auth + Storage) + Cloudflare Images
- **Infrastructure**: Vercel (frontend), Railway/Fly.io (backend), Docker

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Python 3.11+
- Supabase account
- Cloudflare account (for images)

### Development Setup

1. **Clone and install dependencies:**

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Set up environment variables:**

```bash
# Frontend — copy and fill in values
cp frontend/env.example frontend/.env.local

# Backend — copy and fill in values
cp backend/env.example backend/.env
```

See the [Environment Variables](#environment-variables) section below for the full list.

3. **Run database migrations:**

With Supabase connected via tools (Dashboard, CLI, or MCP), apply migrations from `backend/migrations/` in order (001 → 008). See **backend/scripts/run_migrations.md** for the list and how to run them.

4. **Start development servers:**

```bash
# Frontend (from frontend/)
npm run dev

# Backend (from backend/)
uvicorn app.main:app --reload
```

### Run with Docker

Run both frontend and backend with a single command:

```bash
docker-compose up --build
```

Frontend will be at `http://localhost:3000`, backend at `http://localhost:8000`. Set env vars in a root `.env` file or export them in your shell (see `frontend/env.example` and `backend/env.example` for the required keys).

## Project Structure

```
localsquares/
├── frontend/           # Next.js 14 app (TypeScript + Tailwind)
├── backend/            # FastAPI application (Python)
├── docs/               # Architecture docs, API specs
└── docker-compose.yml  # Full-stack local development
```

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default `http://localhost:8000`) |
| `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID for image hosting |
| `NEXT_PUBLIC_REGION_SCOPE` | Region filter (e.g. `freeport`) |

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase settings |
| `ENVIRONMENT` | `development` or `production` |
| `DEBUG` | `true` / `false` (set `false` in production) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `HSTS_MAX_AGE` | HSTS max-age in seconds (production only) |
| `REGION_SCOPE` | Region filter (e.g. `freeport`) |
| `CURRENT_ISLAND_SLUG` | Island slug (e.g. `grand-bahama`) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_TRIAL` | Stripe Price ID for trial |
| `STRIPE_PRICE_MONTHLY` | Stripe Price ID for monthly plan |
| `STRIPE_PRICE_ANNUAL` | Stripe Price ID for annual plan |
| `RESEND_API_KEY` | Resend email API key |
| `EMAIL_FROM` | Sender address for transactional email |
| `LLM_API_KEY` | LLM provider API key (optional) |
| `QDRANT_URL` | Qdrant vector DB URL (optional) |
| `QDRANT_API_KEY` | Qdrant API key (optional) |

## Design Philosophy

- Big typography, bold captions, legible outdoors
- Tap-first UX, zero precision clicking
- Visual dominance, images over text
- Extremely low cognitive load
- Fast on weak mobile data
- Works beautifully on cheap Androids and iPhones alike

## License

MIT

