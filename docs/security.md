# Security Overview

Concise summary of security controls and operational practices for LocalSquares / Freeport Squares.

## Authentication and Authorization

- **Auth**: Supabase Auth (magic link, OTP). Backend verifies JWTs via JWKS (ES256) or JWT secret (HS256). Invalid tokens return a generic "Invalid token" in production (no exception details).
- **API**: Protected routes require `Authorization: Bearer <token>`. Admin-only routes use `require_admin` (role from JWT). Analytics pin stats are restricted to pin owner or admin.
- **RLS**: Supabase Row-Level Security is enabled on all tables. Frontend uses anon key; backend uses service role only server-side. RLS policies enforce owner/admin checks for pins, users, payments, reports.

## Webhooks and Payments

- **Stripe**: Webhook handler verifies `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET`. Invalid or missing signature returns 400. Webhook endpoint is rate-limited (60/min per IP).
- **Secrets**: Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_WEBHOOK_SECRET` to the frontend. Use platform secrets (Vercel, Railway, Fly.io) in production.

## Rate Limiting

- **Webhooks**: 60 requests/minute per IP.
- **Analytics** (impressions, clicks): 200 requests/minute per IP.
- **Subscription** (setup-intent, trial): 30 requests/minute per IP.
- Implemented with slowapi (in-memory store). Exempt or tune limits for health/read-only endpoints as needed.

## Headers and Hardening

- **Backend**: X-Content-Type-Options, X-Frame-Options, HSTS (production), explicit CORS methods/headers.
- **Frontend**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, Content-Security-Policy (script/connect/frame sources restricted).
- **Deployment**: Set `DEBUG=false` and `CORS_ORIGINS` to trusted frontend only. See [deployment.md](deployment.md) Security subsection.

## Input and Output

- **Pin metadata**: Contact, hours, location, tags, and website are size-limited and validated (see `backend/app/models/pin.py`). Website must be http(s) URL.
- **API**: Pydantic validates all request bodies. Webhook responses return only status (no sensitive data).

## Operational Maintenance

- **Dependencies**: Pin versions in `backend/requirements.txt` and `frontend/package.json`. Run `pip audit` and `npm audit` before releases; fix or document exceptions.
- **Rotation**: Rotate `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_WEBHOOK_SECRET` if ever exposed.
- **RLS**: Keep RLS enabled; do not rely on client-side checks alone. Backend service role bypasses RLS; API layer enforces region and ownership.
