# Environment Variables

Full reference for all env vars. See `.env.example` for the template.

## How to generate secret keys
```bash
openssl rand -hex 32
```

## Backend (Railway)

| Variable | Where to get it | Phase |
|----------|----------------|-------|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens | 0+ |
| `RAILWAY_TOKEN` | railway.app → Account → Tokens | 0+ |
| `NEON_API_KEY` | console.neon.tech → API Keys | 0+ |
| `GITHUB_PAT` | github.com/settings/tokens (repo:read) | 0+ |
| `POSTHOG_PROJECT_API_KEY` | app.posthog.com → Project Settings | 0+ |
| `LINEAR_API_KEY` | linear.app → Settings → API | 0+ |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | 0+ |
| `OPENAI_API_KEY` | platform.openai.com → API keys | 0+ |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → service_role | 0+ |
| `RESEND_API_KEY` | resend.com → API Keys | 0+ |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers (use restricted key) | 0+ |
| `SENTRY_AUTH_TOKEN` | sentry.io → Settings → Auth Tokens | 0+ |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens | 0+ |
| `REPLIT_API_KEY` | replit.com → Account Settings | 0+ |
| `UPSTASH_REDIS_REST_URL` | console.upstash.com | 2+ |
| `CREDENTIAL_ENCRYPTION_KEY` | `openssl rand -hex 32` | 4+ |
| `DATABASE_URL` | Neon → Connection string (pooled) | 4+ |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing secret | 5+ |

## Frontend (Vercel — VITE_ prefix required)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Railway backend URL |
| `VITE_POSTHOG_KEY` | PostHog project API key |
| `VITE_SENTRY_DSN` | WhateverOPS frontend Sentry DSN (Phase 5+) |
