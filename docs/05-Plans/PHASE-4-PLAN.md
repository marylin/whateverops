# Phase 4 — Hosted Beta

Timeline: Months 2–3
Gate required: Gate 2 (20 self-hosters)
Branch: `feature/phase-4-hosted-beta`
Gate: Gate 3 (60% WAU 2wks) + Gate 4 (40% Sean Ellis)

## New Infrastructure
- Neon PostgreSQL (Drizzle ORM)
- Lucia Auth v3 + Arctic (GitHub + Google OAuth)
- AES-256-GCM credential encryption
- Supabase Storage (avatars, exports)
- Resend Pro (welcome sequences)

## DB Schema (Drizzle)
Tables: `users`, `sessions`, `integrations` (encrypted_config), `preferences`,
`survey_responses`, `email_log`, `cancellation_reasons`

## Key Features
- GitHub + Google OAuth (Arctic)
- Email/password with Resend verification
- Password reset flow
- AES-256-GCM credential encryption at rest
- Connection wizard per integration (<10 min to first panel)
- Panel drag-to-reorder (persisted to Neon)
- Admin panel: DAU/WAU chart, retention, Sean Ellis results
- Welcome sequence: Day 0/3/7 Resend emails
- AUTO-6: 7-day inactive re-engagement email
- AUTO-7: Onboarding sequence
- Sean Ellis survey: Day 14 → admin shows % very disappointed
- Account deletion: full GDPR purge within 60s

## Required Tests
- Auth flow E2E: register → verify → connect integration → see panel
- Multi-tenant isolation: User A data never accessible to User B
- Credential encryption: stored values are always ciphertext
- Account deletion: all rows purged, storage cleaned
