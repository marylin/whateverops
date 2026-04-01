# Ship Readiness Test Results

**Date:** 2026-04-01
**Branch:** feature/phase-3.6-quality-polish
**Methodology:** 4-layer test suite written against code as-is. Failures = real bugs.

## Summary

| Layer | Tests | Passed | Failed | Bugs Found |
|-------|-------|--------|--------|------------|
| Layer 1: Backend Contracts | 50 | 50 | 0 | 3 (design issues, not test failures) |
| Layer 2: Frontend Smoke | 155 | 155 | 0 | 0 |
| Layer 3: Error States | 52 | 52 | 0 | 17 (panels crash on null data) |
| Layer 4: E2E Flows | 34 | 32 | 2 | 3 (responsive + VercelPanel) |
| **Total** | **291** | **289** | **2** | **23 findings** |

---

## P0 — Ship Blockers

### 1. Mobile viewport overflow (375px)
**Source:** `responsive.spec.ts` — 2 failing tests
**Impact:** Dashboard content overflows horizontally on narrow mobile screens. Users on phones will see a broken layout with horizontal scrolling.
**Root cause:** Header flex layout (Settings/Status/Refresh buttons) or panel card minimum widths don't collapse at small viewports.
**Fix:** Add responsive breakpoints — collapse header buttons into a menu or wrap them, ensure panel grid is `grid-cols-1` at mobile widths.

---

## P1 — Should Fix Before Launch

### 2. Error response shape inconsistency
**Source:** `error-responses.test.ts` — observed across 3 error sources
**Impact:** API consumers get different JSON shapes depending on where the error originates:
- Route-level errors: `{ error: string }`
- Rate limiter (429): `{ error, message, retryAfter }`
- Error middleware (500): `{ error, status, timestamp }` (intended but broken — see #3)
**Fix:** Standardize on one error envelope, e.g., `{ error: string, status: number, timestamp: string }`.

### 3. errorHandler middleware doesn't produce JSON responses
**Source:** `api-contracts.test.ts` — observed during 500 error testing
**Impact:** Unhandled exceptions return `text/plain "Internal Server Error"` instead of the intended JSON envelope `{ error, status, timestamp }`. Hono's internal error handler intercepts before the middleware's catch block returns.
**Fix:** Use `app.onError()` callback instead of middleware-based try/catch, or move to Hono's built-in error handler pattern.

### 4. No JSON 404 handler
**Source:** `error-responses.test.ts`
**Impact:** Unknown routes return `text/plain "404 Not Found"` instead of JSON. API consumers expecting `Content-Type: application/json` on all responses will break.
**Fix:** Add `app.notFound((c) => c.json({ error: 'Not found' }, 404))` to index.ts.

### 5. VercelPanel crashes on missing `recentDeploys` structure
**Source:** `empty-and-error.spec.ts` — observed in WebServer console logs
**Impact:** When VercelPanel receives mock data without the expected `recentDeploys` array subfield (or with `lastProductionDeploy` undefined), it throws `Cannot read properties of undefined (reading 'some')`. The ErrorBoundary catches it, so no white screen, but the panel shows an error state instead of gracefully degrading.
**Fix:** Add optional chaining: `data.recentDeploys?.some(...)` or guard at the top of the component.

---

## P2 — Systematic Gap (Not Ship-Blocking)

### 6. All 17 panels crash on null/undefined data
**Source:** `panel-error-states.test.tsx` — 17/17 panels crash on null, 17/17 on undefined, 14/17 on empty object
**Impact:** Currently mitigated by Dashboard.tsx's null guard (`if (!panel.data) return <p>No data</p>`) and ErrorBoundary wrappers. Not a ship blocker because the guard works in production. However, it's a systematic defensive coding gap — if the guard is ever removed or bypassed, every panel crashes.
**Recommendation:** Add `if (!data) return null` guard at the top of each panel component. Low priority but good hygiene.

| Panel | null | undefined | {} |
|-------|------|-----------|-----|
| AIProviderPanel | CRASH | CRASH | CRASH |
| AnthropicPanel | CRASH | CRASH | CRASH |
| CloudflarePanel | CRASH | CRASH | CRASH |
| GenericPanel | CRASH | CRASH | ok |
| GitHubPanel | CRASH | CRASH | CRASH |
| LinearPanel | CRASH | CRASH | ok |
| NeonPanel | CRASH | CRASH | CRASH |
| OpenAIPanel | CRASH | CRASH | CRASH |
| PostHogPanel | CRASH | CRASH | CRASH |
| RailwayPanel | CRASH | CRASH | CRASH |
| ResendPanel | CRASH | CRASH | CRASH |
| SelfMonitoringPanel | CRASH | CRASH | CRASH |
| SentryPanel | CRASH | CRASH | CRASH |
| StripePanel | CRASH | CRASH | CRASH |
| SupabaseAuthPanel | CRASH | CRASH | CRASH |
| SupabaseMgmtPanel | CRASH | CRASH | ok |
| VercelPanel | CRASH | CRASH | CRASH |

---

## What Passed (No Issues Found)

- **All 17 panels render correctly** with valid mock data (22 tests)
- **All layout components** (Header, DailyDigest, DailyDigestSkeleton) render correctly (8 tests)
- **All UI components** (ExternalLink, Metric, MiniBar, ProgressBar, StatusDot) render correctly (20 tests)
- **Both pages** (SettingsPage, StatusPage) load and display content (8 tests)
- **All 11 format utilities** handle normal input, null, undefined, zero, and edge cases (66 tests)
- **All API contract tests pass** — response shapes match frontend expectations (50 tests)
- **CORS headers** present and correct
- **X-Request-ID** generated and echoed on all responses
- **All E2E flows work** — dashboard, settings, status, navigation, error recovery (32/34 tests)
- **Tablet and desktop layouts** render without overflow

---

## Test Infrastructure Created

```
tests/unit/ship-readiness/           # Layer 1 (Bun)
├── api-contracts.test.ts            # 30 tests
├── cors-and-headers.test.ts         # 10 tests
└── error-responses.test.ts          # 10 tests

frontend/src/                        # Layers 2+3 (Vitest)
├── components/panels/__tests__/
│   ├── all-panels-smoke.test.tsx    # 22 tests
│   └── panel-error-states.test.tsx  # 52 tests
├── components/layout/__tests__/
│   └── layout-smoke.test.tsx        # 8 tests
├── components/ui/__tests__/
│   └── ui-smoke.test.tsx            # 20 tests
├── pages/__tests__/
│   └── pages-smoke.test.tsx         # 8 tests
└── lib/__tests__/
    └── format.test.ts               # 66 tests

tests/e2e/ship-readiness/           # Layer 4 (Playwright)
├── dashboard-flow.spec.ts           # 6 tests
├── settings-flow.spec.ts            # 6 tests
├── status-flow.spec.ts              # 5 tests
├── navigation.spec.ts               # 7 tests
├── empty-and-error.spec.ts          # 5 tests
└── responsive.spec.ts               # 5 tests
```

## Running the Full Suite

```bash
# Layer 1: Backend contracts (50 tests, ~100ms)
bun test tests/unit/ship-readiness/

# Layers 2+3: Frontend (207 tests, ~1.7s)
pnpm --filter frontend test

# Layer 4: E2E (34 tests, ~7s)
npx playwright test tests/e2e/ship-readiness/
```
