# I Built a Single Dashboard for All 15 Services I Use as a Solo Founder

**Slug:** `whateverops-launch`
**Target:** whateverops.io/blog, Dev.to, Hacker News, Indie Hackers
**Status:** Draft — publish on launch day

---

## The Problem

Every morning I open the same 15 tabs:

- Vercel — did anything fail to deploy?
- Railway — are my services still running?
- Stripe — any new revenue? Failed payments?
- Sentry — errors I need to fix before users notice?
- PostHog — is anyone actually using this feature?
- GitHub — PRs, issues, stars?
- Linear — what did I plan vs what actually happened?

Repeat for Neon, Cloudflare, Supabase, Resend, Anthropic, OpenAI, Replit.

Each service has its own dashboard. Some send email alerts. None of them talk to each other. I'm spending 20 minutes every morning just _checking_ things before I can start _building_ things.

## The Solution

WhateverOPS is a single dashboard that pulls metrics from all 15 services in real time. One glance tells me if something is broken.

- **15 integrations** — GitHub, Linear, Vercel, Railway, PostHog, Resend, Anthropic, OpenAI, Cloudflare, Replit, Supabase (x2), Neon, Sentry, Stripe
- **Parallel fetching** — all APIs called via `Promise.all()`, no waterfall
- **Self-hosted** — deploy to your own Railway + Vercel in 15 minutes
- **Opt-in** — only add the API keys you care about
- **Open source** — MIT license, fork it, extend it

## How It Works

The architecture is intentionally simple:

1. **React + Vite frontend** on Vercel — auto-refreshes each panel on its own TTL
2. **Hono.js backend** on Railway — fetches all configured APIs in parallel
3. **Cache layer** — in-memory for dev, Upstash Redis for production
4. **Staleness indicators** — green/amber/red dots show you how fresh each panel's data is

Every integration follows the same contract: `fetchData()`, `parsePanel()`, `getCacheKey()`, `getHealthStatus()`. Adding a new one takes ~30 minutes if you follow the template in CONTRIBUTING.md.

## Building in Public

This project comes with 5 n8n automation workflows for building in public:

1. **Deploy changelog** — every Vercel deploy auto-generates a social post with what changed
2. **Stars milestone** — celebrates 10, 25, 50, 100+ GitHub stars
3. **Weekly digest** — Monday morning metrics summary for your audience
4. **First payment** — auto-posts when you get your first Stripe payment
5. **Error transparency** — publicly shares when things break (and when they're fixed)

## What's Next

- **Phase 4:** Multi-user hosted version with Lucia Auth + Neon DB
- **Phase 5:** Paid tier with Stripe Checkout for teams
- **Phase 6:** Custom integrations marketplace

## Try It

```bash
git clone https://github.com/whateverops-dev/whateverops.git
cd whateverops && pnpm install
cp .env.example .env
# Add your API keys
pnpm dev
```

GitHub: https://github.com/whateverops-dev/whateverops

---

_Built by a solo founder, for solo founders. Star it if you find it useful._
