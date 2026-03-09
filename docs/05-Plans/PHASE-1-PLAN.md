# Phase 1 — Personal Dashboard

Timeline: Days 3–7
Branch: `feature/phase-1-integrations`
Gate: Gate 0 — 7 consecutive days personal daily use

## Goal
All 15 integrations showing real data against personal credentials.
No auth, no DB, hardcoded config from env vars.
Dashboard is useful enough to open first every morning.

---

## 1.1 Integration Framework
`feat(backend): add integration runner, cache layer, dashboard route`

`backend/src/cache/index.ts` — in-memory Map with TTL.
`backend/src/lib/run-integration.ts` — wraps fetchData() with try/catch + cache.
`backend/src/routes/dashboard.ts` — calls all 15 in `Promise.all()`.

**Never sequential. Always `Promise.all()`.**

---

## 1.2–1.16 All 15 Integrations

Build order (easiest → hardest for momentum):
1. GitHub, 2. Linear, 3. Vercel, 4. Railway, 5. PostHog,
6. Resend, 7. Anthropic, 8. OpenAI, 9. Cloudflare, 10. Replit,
11. Supabase Management, 12. Supabase Auth, 13. Neon, 14. Sentry, 15. Stripe

Each integration requires:
- `backend/src/integrations/[name].ts` — full contract (see INTEGRATION-PATTERN.md)
- `frontend/src/components/panels/[Name]Panel.tsx` — data/error/loading/empty states
- `tests/unit/backend/integrations/[name].test.ts` — 6 test cases
- `tests/fixtures/mock-responses/[name].json` — ok/error/empty responses

Commit per integration:
```
feat(integration): add [name] fetching and panel
test([name]): add unit tests and mock fixture
```

### Stripe — Special attention (1.13)
Required panel data:
- MRR (calculated from active subscriptions, normalized monthly)
- MRR delta 30d
- Active subscription count
- New subscriptions 24h
- Canceled subscriptions 30d
- Failed payments 24h + amount
- Last 5 payment events
- Currency

Use restricted API key with read-only permissions.

---

## 1.17 Dashboard Layout
`feat(frontend): dark grid dashboard with panel skeleton states`

- CSS Grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`
- Stripe panel: 2 columns wide (most important)
- Dark theme using Tailwind custom colors
- Panel skeleton on load (not blank)
- Staggered load animation

---

## 1.18 Global Health Indicator
`feat(frontend): header health indicator with per-integration status`

- Green: all panels returning data
- Amber: 1+ panels stale (> 2× TTL)
- Red: 1+ panels erroring
- Click → modal with per-integration status list

---

## 1.19 Auto-Refresh
`feat(frontend): per-panel auto-refresh by TTL`

useRefresh hook polls every 10s, refetches expired panels.
Subtle pulse animation on panels actively refreshing.

---

## 1.20 Error States
`feat(frontend): actionable error states for all panels`

Error card shows:
- Integration name + icon
- Error type (auth / rate-limited / down / timeout)
- Last successful data timestamp
- Retry button
- Link to integration status page

---

## 1.21–1.22 Tests + Fixtures
All 15 integrations must have 6 tests each (see INTEGRATION-PATTERN.md).
Fixtures: `tests/fixtures/mock-responses/[name].json` with ok/error/empty.

---

## Acceptance Criteria
- [ ] All 15 panels show real data with valid credentials
- [ ] All 15 panels show error state (not blank) with invalid creds
- [ ] `Promise.all()` confirmed — all 15 calls parallel
- [ ] `bun test tests/unit/` — all integration tests pass
- [ ] Dashboard usable on mobile (no horizontal scroll)
- [ ] Cold start: all panels load < 5s
- [ ] Warm start: all panels load < 1s

## PMF Gate 0 Tracking
`docs/08-Feedback/DAILY-USE-LOG.md` — mark each day you open WhateverOPS first.
Do not start Phase 2 until 7 consecutive days.
