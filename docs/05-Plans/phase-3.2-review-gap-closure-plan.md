# Phase 3.2 — Review Gap Closure Plan

<!-- linear: WHA-73 -->

## Summary

Close all gaps identified by three reviews (CEO, Eng, Design) before OSS launch. 20 tasks: 1 DRY refactor, 2 bug fixes, 2 security hardening, 2 frontend resilience, 10 design polish, 2 CI improvements, 1 test addition. See `docs/08-Feedback/{oss-launch-gap-analysis,eng-review-phase-3.1,design-review-phase-3.1}.md` for full context.

## Tasks

### Backend — Architecture & Security

1. [M] Extract `backend/src/lib/integration-registry.ts` — shared `buildConfiguredIntegrations()` function called by both `dashboard.ts` and `status.ts`; eliminates ~120 duplicated lines; move `envOrSkip()` here; both routes shrink to <30 lines each
2. [S] Fix `total: 15` → `results.length` in dashboard.ts — header shows correct "X of 16" count
3. [S] Add rate limiting middleware — `hono-rate-limiter` or equivalent; `/api/dashboard` 60 req/min/IP, `/api/status` 120 req/min/IP, `/api/webhooks` 30 req/min/IP; return 429 on exceed
4. [S] Add security headers — `hono/secure-headers` middleware in `index.ts`; CSP, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security

### Frontend — Resilience & Routing

5. [S] Add React ErrorBoundary — per-panel boundary in Dashboard.tsx; on error show "This panel encountered an error" + retry button; top-level boundary in App.tsx as fallback
6. [S] Add 404 catch-all route — `<Route path="*">` in App.tsx; redirect to `/` or show minimal "page not found" with link to dashboard

### CI — Correctness

7. [S] Fix CI branch mismatch — change `ci.yml` triggers from `branches: [main, staging]` to `branches: [master, staging]`
8. [S] Add integration tests to CI — add `bun test tests/integration/` step after unit tests in `ci.yml`

### Design — HIGH Impact

9. [S] Increase touch targets to 44px — all buttons/links in Header.tsx and PanelCard.tsx get `min-h-[44px]` or equivalent padding
10. [S] Bump heading sizes — H1 "WhateverOPS" to 24px (text-2xl), H3 panel titles to 16px (text-base); maintain weight hierarchy
11. [S] Format timestamps human-readable — add `formatTimestamp()` utility in `frontend/src/lib/format.ts`; use relative ("2h ago") for <24h, absolute ("Mar 18, 5:38 AM") for older; apply in GenericPanel, StripePanel, StatusPage, PanelCard

### Design — MEDIUM Impact

12. [S] Fix Vercel deploy display — show project name + status badge + relative time; truncate/hide deploy ID hash
13. [S] Remove redundant "cached" badge — staleness dot + timestamp is sufficient; remove "cached" text from PanelCard.tsx
14. [S] Standardize error panel layout — all error panels follow: [error message] → [hint if available] → [last success] → [Retry | Status page] buttons
15. [S] Fix metric label casing — audit `parsePanel()` outputs: "Api" → "API", "P Rs" → "PRs", "Response Time Ms" → "Response Time"; unit suffixes after value not in label
16. [S] Fix footer contrast + count — bump footer text from gray-600/700 to gray-400; uses dynamic count from task #2

### Design — Polish

17. [S] Page title differentiation — Status page sets `document.title = 'Status | WhateverOPS'` via useEffect
18. [S] Status page footer text — bump from `text-[10px]` to `text-xs` (12px)
19. [S] Add favicon — simple "W" SVG or ops-themed icon in `frontend/public/`

### Tests

20. [S] Add status page E2E test — navigate to `/status`, verify service list renders, check loading state, verify error state + retry

## Dependencies

- Task 1 (DRY extract) MUST complete before tasks 2, 3, 4, 14, 15 — it restructures the files those tasks touch
- Task 11 (timestamp utility) should complete before task 12 (Vercel display) — Vercel display uses the same formatter
- All other tasks are independent and can be parallelized

## Open Questions

None — all requirements traced directly to approved review decisions.
