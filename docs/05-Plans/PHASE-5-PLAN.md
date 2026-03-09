# Phase 5 — Paid Launch

Timeline: Months 3–4
Gate required: Gate 3 + Gate 4 confirmed
Branch: `feature/phase-5-billing`
Gate: First $100 MRR

## Stripe Products
- Hobby: $19/month
- Builder: $39/month
- Hobby Annual: $182/year (20% off)
- Builder Annual: $374/year (20% off)
- Lifetime: $149 one-time (30-day window flag)

## Key Implementations
- Stripe Checkout + webhook handler
- Webhook idempotency: `stripe_events` dedup table (event_id unique)
- Customer Portal for self-serve plan management
- Free plan: hard limit 3 integrations (enforced backend + UI)
- Pricing page with annual/monthly toggle
- Beta user 40% discount via Stripe coupon
- Contextual upgrade prompts (not generic modals)

## New Automations
- AUTO-8: Failed payment → 3-email recovery (Day 1/3/7)
- AUTO-9: Cancel → survey → store in `cancellation_reasons`
- AUTO-10: MRR milestone posts ($100/$500/$1K/$2K)

## Infrastructure
- Railway Hobby → Pro ($20/mo, always-on, zero-downtime)
- Sentry added (frontend + backend, PII scrubbing)
- Staging env (Railway staging + Neon branch)

## Required Tests
- Billing E2E (Stripe test mode): checkout → webhook → tier updated → enforced
- Webhook idempotency: same event ID twice → second is no-op
- Plan enforcement: free user adds 4th integration → upgrade modal
