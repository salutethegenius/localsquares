# LocalSquares

A visual neighborhood billboard platform optimized for mobile, sunlight readability, and Bahamian context. Think Instagram meets a town corkboard.

## Architecture

- **Frontend**: Next.js 14 (App Router) with Tailwind + custom design system
- **Backend**: FastAPI (Python) with Supabase integration
- **Infrastructure**: Vercel (frontend), Railway/Fly.io (backend), Supabase (auth/DB), Cloudflare (images)

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

Copy `.env.example` to `.env` and fill in your values.

3. **Run database migrations:**

Apply migrations from `backend/migrations/` in your Supabase project.

4. **Start development servers:**

```bash
# Frontend (from frontend/)
npm run dev

# Backend (from backend/)
uvicorn app.main:app --reload
```

## Project Structure

```
localsquares/
├── frontend/           # Next.js 14 app
├── backend/           # FastAPI application
├── shared/            # Shared types/schemas
└── docs/              # Architecture docs, API specs
```

## Design Philosophy

- Big typography, bold captions, legible outdoors
- Tap-first UX, zero precision clicking
- Visual dominance, images over text
- Extremely low cognitive load
- Fast on weak mobile data
- Works beautifully on cheap Androids and iPhones alike

## License

MIT

