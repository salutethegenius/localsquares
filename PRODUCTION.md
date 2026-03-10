# Freeport Squares — Production

## Status

🟢 Live + Stable



## Overview

- **Client / Owner:** Freeport Squares (Built by Kemis Digital)
- **Type:** Client Project (SaaS — neighborhood billboard / local business discovery)
- **Date Deployed:** *(fill when first deployed)*
- **Last Updated:** March 10, 2026

---

## Deployment


| Platform          | URL                                                          | Notes                               |
| ----------------- | ------------------------------------------------------------ | ----------------------------------- |
| Vercel (Frontend) | `https://freeportsquares.com` *(or your Vercel preview URL)* | Next.js 14, root: `frontend`        |
| Railway (Backend) | `https://your-backend.railway.app` *(fill API URL)*          | FastAPI (Nixpacks), root: `backend` |
| Supabase          | (project in Supabase Dashboard)                              | Postgres + Auth + Storage           |
| Domain Registrar  | `freeportsquares.com` *(check registrar)*                    | Custom domain on Vercel             |
| GitHub Repo       | `https://github.com/salutethegenius/freeportsquares`         | Branch: `main`                      |


---

## Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** FastAPI (Python), separate service on Railway
- **Database:** Supabase (PostgreSQL) — production DB + RLS
- **Storage:** Supabase Storage (+ optional Cloudflare Images)
- **Auth:** Supabase Auth (magic link, phone OTP); JWT from Supabase
- **Payments:** Stripe (subscriptions, one-time activation)
- **Other:** Sentry (org: `kgc-dr`, project: `freeport-squares`), Vercel Speed Insights

---

## Credentials

> All passwords and API keys stored in Bitwarden. Reference the entry name below — never paste credentials here.

- **Bitwarden Entry:** `freeport-squares-credentials`
- **Vercel Account Email:** *(Kemis Digital / project owner)*
- **Railway Account Email:** *(Kemis Digital Railway email)*
- **GitHub Account:** `salutethegenius`
- **Domain Account:** *(registrar for freeportsquares.com)*
- **Other Accounts:** Sentry (org: `kgc-dr`, project: `freeport-squares`), Supabase (project ref: *in Supabase URL*), Stripe, Resend (email)

---

## Environment Variables

> Full .env stored in Bitwarden entry above. List variable names only — not values.

**Frontend (Vercel)**

- NEXT_PUBLIC_SUPABASE_URL=
- NEXT_PUBLIC_SUPABASE_ANON_KEY=
- NEXT_PUBLIC_API_URL=
- NEXT_PUBLIC_REGION_SCOPE=freeport
- NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID= *(optional)*
- SENTRY_DSN= *(if using server-side Sentry)*
- NEXT_PUBLIC_SENTRY_DSN=
- SENTRY_AUTH_TOKEN=

**Backend (Railway)**

- SUPABASE_URL=
- SUPABASE_SERVICE_ROLE_KEY=
- SUPABASE_JWT_SECRET=
- ENVIRONMENT=production
- DEBUG=false
- CORS_ORIGINS=
- HSTS_MAX_AGE=
- REGION_SCOPE=freeport
- CURRENT_ISLAND_SLUG=grand-bahama
- CLOUDFLARE_ACCOUNT_ID= *(optional)*
- CLOUDFLARE_API_TOKEN= *(optional)*
- STRIPE_SECRET_KEY=
- STRIPE_PUBLISHABLE_KEY=
- STRIPE_WEBHOOK_SECRET=
- STRIPE_PRICE_TRIAL=
- STRIPE_PRICE_MONTHLY=
- STRIPE_PRICE_ANNUAL=
- RESEND_API_KEY=
- EMAIL_FROM=
- REDIS_URL= *(optional — falls back to in-memory rate limiting)*
- BLOCKED_IPS= *(optional — comma-separated)*
- MAX_REQUEST_BODY_SIZE= *(optional — default 10 MB)*
- REQUIRE_CLOUDFLARE_PROXY= *(optional — default false)*
- TRUSTED_PROXIES= *(optional — comma-separated IP ranges)*

---

## Monitoring

- **UptimeRobot Monitor:** Not configured *(optional)*
- **Sentry Project:** `freeport-squares` (org: `kgc-dr`) — includes `/monitoring` tunnel route to bypass ad-blockers
- **Vercel Analytics / Speed Insights:** Enabled in root layout

---

## Known Issues

> Track all bugs in Linear. Link the project below. Never rely on memory — log it, even if you won't fix it today.

- **Linear Project Link:** *(add Linear project link)*


| #   | Issue | Severity         | Status                    |
| --- | ----- | ---------------- | ------------------------- |
| 1   |       | Low / Med / High | Open / In Progress / Done |
| 2   |       |                  |                           |


---

## Manual follow-ups

1. **Domain Registrar** — Confirm where `freeportsquares.com` (or production domain) is registered.
2. **Railway Account Email** — Kemis Digital email used for Railway.
3. **Bitwarden Entry** — Use `freeport-squares-credentials` or update if named differently.
4. **Linear Project Link** — Add once created.
5. **Vercel & Railway URLs** — Replace placeholders above with live frontend and backend URLs after first deploy.

---

## Pre-Demo Checklist

Run through this before showing anyone the project.

- Open the live URL — confirm it loads
- Check Linear backlog — know what's broken before they see it
- Test the main user flow end to end (explore → claim → pay → pin live)
- Check UptimeRobot — no recent downtime alerts (if configured)
- Confirm any demo data or accounts are set up

---

## Security Hardening

The backend includes layered API security (added March 2026):

- **Rate Limiting** — slowapi with per-endpoint + per-user (JWT) + per-IP limits; optional Redis backing store; global 300 req/min DDoS net
- **Firewall Middleware** — blocks scanner UAs, suspicious paths, oversized bodies, blocklisted IPs, optional Cloudflare-only enforcement
- **CSRF Protection** — double-submit cookie on all state-changing requests; Stripe webhooks exempt; frontend `apiFetch()` wrapper auto-attaches token
- **Input Sanitization** — Pydantic validators strip null bytes, control chars, SQL injection patterns; bleach strips HTML tags
- **Security Headers** — HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, CSP (form-action, base-uri)
- **CORS Lockdown** — production locked to `freeportsquares.com` / `www.freeportsquares.com`

---

## Notes & History

- **YYYY-MM-DD** — Deployed initial version
- **2026-03-08** — Production template created; home page UX (header, login, admin route), Sentry, Speed Insights committed and pushed
- **2026-03-10** — API security hardening: rate limiting, firewall middleware, CSRF, input sanitization, XSS/CSP, proxy awareness. Backend deployed to Railway and connected to Vercel frontend.

