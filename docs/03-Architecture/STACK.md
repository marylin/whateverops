# Stack Decisions

## Hono.js on Bun (not Express/Node)
Bun is 3–5× faster than Node for API workloads — critical for 15 parallel
integration calls. Hono has zero dependencies, runs on Bun natively, and
is typed end-to-end. Railway (not Vercel Functions) because we need persistent
connections for WebSocket (Phase 6) and n8n is already there.

## Neon PostgreSQL + Drizzle ORM (not Supabase DB, not PlanetScale)
Neon's branching is critical for safe migrations on a solo-operated product.
Drizzle has first-class TypeScript types and works with Neon's serverless driver.
Supabase is used for Storage only — no redundant DB.

## Lucia Auth v3 + Arctic (not Clerk, not Auth0)
Framework-agnostic, runs on Hono with zero magic. $0 cost vs Clerk/Auth0 monthly
fees. Arctic provides typed OAuth handlers for GitHub and Google.

## Upstash Redis (not self-hosted Redis)
HTTP-based — works in Bun with zero native deps. PAYG pricing = $0 until real
users. Vercel KV is Vercel-only; we run on Railway.

## Stripe Checkout (not custom billing UI)
Handles PCI, 3DS, Apple/Google Pay, billing address. Customer Portal handles
subscription management with zero backend code.

## n8n (not Zapier, not Make)
Self-hosted = $0 per workflow execution. Full programmability (any API + JS +
Claude Haiku). Workflows committed to git as JSON. Runs on Railway.
