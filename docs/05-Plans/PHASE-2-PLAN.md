# Phase 2 — Polish & OSS Prep

Timeline: Weeks 2–3
Gate required: Gate 0 (7-day streak)
Branch: `feature/phase-2-polish`
Gate: Gate 1 — 10+ unprompted requests to try WhateverOPS

## Tasks

### Production Hardening
- **2.1** Production error handler: 10s timeout, 2× retry with backoff, return `{ data: null, error: string }` — never throw
- **2.2** Upstash Redis cache replacing in-memory. Feature flag: `CACHE_BACKEND=redis|memory`. Cache survives restarts.
- **2.3** Per-panel staleness dot: green (fresh) / amber (>2× TTL) / red (last call failed). Timestamp tooltip on hover.

### n8n Automations (export JSON to `n8n/workflows/`)
- **2.4** AUTO-1: Railway webhook → commit msg → Claude Haiku (3 drafts) → Resend approval → Buffer
- **2.5** AUTO-2: Hourly cron → GitHub stars → milestone check → Claude draft → Resend → on approval: post
- **2.6** AUTO-3: Monday 8AM → all metrics → Claude weekly post → Resend approval → post 9AM
- **2.7** AUTO-4: Stripe first-ever payment → auto-post (no approval, once-only)
- **2.8** AUTO-5: PostHog error spike OR Railway deploy fail → Claude transparency draft → Resend approval
- **2.9** Test email approval end-to-end: deploy → email → approve → Buffer post

### OSS Preparation
- **2.10** BetterStack: 3 monitors + `status.whateverops.io` custom domain
- **2.11** Self-hosting guide: `docs/06-Development/SETUP.md` tested by someone unfamiliar. Target: <15 min.
- **2.12** `CONTRIBUTING.md` with integration template + PR process
- **2.13** Demo GIF: all 15 panels with real data. Embed in README.
- **2.14** BetaList + Uneed listings live with email capture

### Tests
- **2.14** Cache layer integration tests: Redis hit/miss, TTL expiry, fallback
- **2.15** n8n webhook endpoint tests: payload validation, auth check

## Acceptance Criteria
- [ ] All 15 integrations handle errors without crashing
- [ ] Redis cache persists across Railway redeployments
- [ ] All 5 n8n workflows complete a test run
- [ ] Self-hosting: independent tester confirms <15 min
- [ ] Demo GIF in README with real data visible
