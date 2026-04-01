# Ship Readiness Tests — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write 15 test files across 4 layers to find real bugs before OSS launch. Tests run against code as-is — failures are bugs, not tests to fix.

**Architecture:** Layer 1 (backend contracts) → Layer 2 (frontend smoke) → Layer 3 (error states) → Layer 4 (E2E). Each layer runs independently. Test code was drafted by architect agents and should be adapted based on actual source file reading.

**Tech Stack:** Bun test (backend), Vitest + React Testing Library (frontend), Playwright (E2E)

**Spec:** `docs/superpowers/specs/2026-04-01-ship-readiness-test-plan-design.md`

**Architect drafts:** Saved in `.claude/projects/` tool-results — but implementers should read actual source files and write tests accordingly.

---

## File Map

### New Files (15 test files)
| File | Layer | Purpose |
|------|-------|---------|
| `tests/unit/ship-readiness/api-contracts.test.ts` | 1 | Backend API response shapes |
| `tests/unit/ship-readiness/cors-and-headers.test.ts` | 1 | CORS, X-Request-ID, Content-Type |
| `tests/unit/ship-readiness/error-responses.test.ts` | 1 | 404, 400, 429 error shapes |
| `frontend/src/components/panels/__tests__/all-panels-smoke.test.tsx` | 2 | All 17 panels render with valid data |
| `frontend/src/components/layout/__tests__/layout-smoke.test.tsx` | 2 | Header, DailyDigest render |
| `frontend/src/components/ui/__tests__/ui-smoke.test.tsx` | 2 | ExternalLink, Metric, MiniBar, ProgressBar, StatusDot |
| `frontend/src/pages/__tests__/pages-smoke.test.tsx` | 2 | SettingsPage, StatusPage render |
| `frontend/src/lib/__tests__/format.test.ts` | 2 | format.ts utility edge cases |
| `frontend/src/components/panels/__tests__/panel-error-states.test.tsx` | 3 | All panels with error/loading/null data |
| `tests/e2e/ship-readiness/dashboard-flow.spec.ts` | 4 | Dashboard loads, panels render, refresh works |
| `tests/e2e/ship-readiness/settings-flow.spec.ts` | 4 | Settings page navigation and interaction |
| `tests/e2e/ship-readiness/status-flow.spec.ts` | 4 | Status page loads and displays |
| `tests/e2e/ship-readiness/navigation.spec.ts` | 4 | All routes, unknown routes, nav links |
| `tests/e2e/ship-readiness/empty-and-error.spec.ts` | 4 | Degraded states, backend down |
| `tests/e2e/ship-readiness/responsive.spec.ts` | 4 | 375px, 768px, 1440px viewports |

---

## Task 1: Layer 1 — Backend API Contract Tests (3 files)

**Files:**
- Create: `tests/unit/ship-readiness/api-contracts.test.ts`
- Create: `tests/unit/ship-readiness/cors-and-headers.test.ts`
- Create: `tests/unit/ship-readiness/error-responses.test.ts`

**Approach:** Import route modules from `backend/src/routes/`, mount on test Hono apps, test with `app.request()`. Follow the pattern from existing `tests/unit/backend/settings.test.ts`.

- [ ] **Step 1: Read source files to understand exact response shapes**

Read: `backend/src/routes/dashboard.ts`, `backend/src/routes/settings.ts`, `backend/src/routes/status.ts`, `backend/src/routes/webhooks.ts`, `backend/src/middleware/error.ts`, `backend/src/lib/logger.ts`, `backend/src/index.ts`

- [ ] **Step 2: Create test directory**

Run: `mkdir -p tests/unit/ship-readiness`

- [ ] **Step 3: Write api-contracts.test.ts**

Test all endpoints:
- GET /api/dashboard — verify `{ panels, globalHealth, lastRefresh, configured, total }` shape
- GET /api/settings — verify `{ deploymentMode, storageMode, version, dbAvailable, encryptionKeySet, integrations }` shape
- POST /api/settings/storage-mode — verify success/error responses
- GET /api/status — verify `{ services, globalHealth, lastRefresh }` shape
- GET /health — verify `{ status, uptime, timestamp }` shape
- POST /api/webhooks/n8n/:event — verify auth and response shape

Key: Import routes with `.js` extension (ESM). Mock integration-registry to avoid real API calls. Use `bun:test` imports.

- [ ] **Step 4: Write cors-and-headers.test.ts**

Test: CORS on OPTIONS requests, X-Request-ID on every response (generated + echoed), Content-Type: application/json on all endpoints.

Key: Must replicate the middleware stack from index.ts (CORS, requestLogger, errorHandler).

- [ ] **Step 5: Write error-responses.test.ts**

Test: 404 returns JSON (not HTML), 400 validation errors have consistent shape, 429 rate limit returns JSON body. All errors include timestamp.

Key: Rate limiter stores are shared in-memory — use unique storeIds to avoid test interference.

- [ ] **Step 6: Run Layer 1 tests**

Run: `cd D:/Repos/whateverops && bun test tests/unit/ship-readiness/`

Record all failures — these are bugs found, not tests to fix.

- [ ] **Step 7: Commit**

```bash
git add tests/unit/ship-readiness/
git commit -m "test(ship-readiness): add Layer 1 backend API contract tests"
```

---

## Task 2: Layer 2 — Frontend Panel Smoke Tests (1 file)

**Files:**
- Create: `frontend/src/components/panels/__tests__/all-panels-smoke.test.tsx`

- [ ] **Step 1: Read all 17 panel component files (first 30 lines each) to confirm props interfaces**

All panels follow `{ data: XPanelData }` pattern. Read each to get the exact required fields.

- [ ] **Step 2: Write all-panels-smoke.test.tsx**

For each of the 17 panels:
- Create minimal valid mock data matching its interface
- `render(<XPanel data={mockData} />)` — assert container has children
- Test with `data` containing null optional fields where applicable

Panels: AIProviderPanel, AnthropicPanel, CloudflarePanel, GenericPanel, GitHubPanel, LinearPanel, NeonPanel, OpenAIPanel, PostHogPanel, RailwayPanel, ResendPanel, SelfMonitoringPanel, SentryPanel, StripePanel, SupabaseAuthPanel, SupabaseMgmtPanel, VercelPanel

- [ ] **Step 3: Run tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`

Record failures.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/panels/__tests__/all-panels-smoke.test.tsx
git commit -m "test(ship-readiness): add Layer 2 panel smoke tests"
```

---

## Task 3: Layer 2 — Layout, UI, Pages, and Format Smoke Tests (4 files)

**Files:**
- Create: `frontend/src/components/layout/__tests__/layout-smoke.test.tsx`
- Create: `frontend/src/components/ui/__tests__/ui-smoke.test.tsx`
- Create: `frontend/src/pages/__tests__/pages-smoke.test.tsx`
- Create: `frontend/src/lib/__tests__/format.test.ts`

- [ ] **Step 1: Read source files**

Read: Header.tsx, DailyDigest.tsx, ExternalLink.tsx, Metric.tsx, MiniBar.tsx, ProgressBar.tsx, StatusDot.tsx, SettingsPage.tsx, StatusPage.tsx, format.ts, settings-api.ts, api.ts

- [ ] **Step 2: Write layout-smoke.test.tsx**

Test Header with mock DashboardResponse and onRefresh. Test DailyDigest with mock panels and empty array. Test DailyDigestSkeleton renders.

Note: Header requires `react-router-dom` context — wrap in `<MemoryRouter>`.

- [ ] **Step 3: Write ui-smoke.test.tsx**

Test ExternalLink (href, target, rel), Metric (label, value, value=0), MiniBar (segments, empty segments), ProgressBar (0, 50, 100), StatusDot (all status variants).

- [ ] **Step 4: Write pages-smoke.test.tsx**

Mock the API modules with `vi.mock()` before importing pages. Test SettingsPage and StatusPage render without crashing.

Note: Both pages use `react-router-dom` — wrap in `<MemoryRouter>`. Both fetch data on mount — mock the fetch functions to return resolved promises with valid shapes.

- [ ] **Step 5: Write format.test.ts**

Read format.ts, test every exported function with: normal input, null, undefined, 0, empty string, boundary values.

- [ ] **Step 6: Run tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`

Record failures.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/layout/__tests__/layout-smoke.test.tsx frontend/src/components/ui/__tests__/ui-smoke.test.tsx frontend/src/pages/__tests__/pages-smoke.test.tsx frontend/src/lib/__tests__/format.test.ts
git commit -m "test(ship-readiness): add Layer 2 layout, UI, pages, and format smoke tests"
```

---

## Task 4: Layer 3 — Panel Error States Tests (1 file)

**Files:**
- Create: `frontend/src/components/panels/__tests__/panel-error-states.test.tsx`

- [ ] **Step 1: Understand how panels receive error/loading state**

Read Dashboard.tsx to see how PANEL_MAP and PanelCard interact. Panels receive `data` only when status is 'ok'. PanelCard handles error/loading display. So Layer 3 tests should verify: panels don't crash if data is null/undefined (defensive rendering).

- [ ] **Step 2: Write panel-error-states.test.tsx**

For each panel: render with `data` as `null as any` and `undefined as any`. Assert component doesn't throw (wrap in ErrorBoundary or try/catch the render). This tests defensive coding — if a panel doesn't guard against null data, it's a real bug.

- [ ] **Step 3: Run tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`

Record failures — each failure is a panel that crashes on null data.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/panels/__tests__/panel-error-states.test.tsx
git commit -m "test(ship-readiness): add Layer 3 panel error state tests"
```

---

## Task 5: Layer 4 — E2E Critical Path Tests (6 files)

**Files:**
- Create: `tests/e2e/ship-readiness/dashboard-flow.spec.ts`
- Create: `tests/e2e/ship-readiness/settings-flow.spec.ts`
- Create: `tests/e2e/ship-readiness/status-flow.spec.ts`
- Create: `tests/e2e/ship-readiness/navigation.spec.ts`
- Create: `tests/e2e/ship-readiness/empty-and-error.spec.ts`
- Create: `tests/e2e/ship-readiness/responsive.spec.ts`

- [ ] **Step 1: Read existing E2E tests for patterns**

Read: `tests/e2e/flows/dashboard.spec.ts` and `tests/e2e/flows/status.spec.ts` for mock data patterns and page selectors.

Also read: `frontend/src/App.tsx` (routes), `frontend/src/components/layout/Header.tsx` (nav selectors), `frontend/src/pages/SettingsPage.tsx` (key elements), `frontend/src/pages/StatusPage.tsx` (key elements).

- [ ] **Step 2: Create test directory**

Run: `mkdir -p tests/e2e/ship-readiness`

- [ ] **Step 3: Write dashboard-flow.spec.ts**

Mock /api/dashboard with full panel data. Test: page loads, header visible, health indicator visible, panel cards render, refresh fires network request, no console errors.

- [ ] **Step 4: Write settings-flow.spec.ts**

Mock /api/settings. Test: navigate to /settings, page loads, storage mode visible, integration list visible, navigate back to dashboard.

- [ ] **Step 5: Write status-flow.spec.ts**

Mock /api/status. Test: navigate to /status, page loads, services listed, health summary visible.

- [ ] **Step 6: Write navigation.spec.ts**

Mock all API endpoints. Test: all 3 routes load, unknown route doesn't crash, header nav links work, back/forward works, direct URL navigation works.

- [ ] **Step 7: Write empty-and-error.spec.ts**

Test with all panels in error state. Test with backend returning 500. Test refresh after error.

- [ ] **Step 8: Write responsive.spec.ts**

Test dashboard at 375px, 768px, 1440px — no horizontal overflow. Test settings at 375px.

- [ ] **Step 9: Install Playwright browsers if needed**

Run: `npx playwright install chromium`

- [ ] **Step 10: Run E2E tests**

Run: `cd D:/Repos/whateverops && npx playwright test tests/e2e/ship-readiness/`

Record failures.

- [ ] **Step 11: Commit**

```bash
git add tests/e2e/ship-readiness/
git commit -m "test(ship-readiness): add Layer 4 E2E critical path tests"
```

---

## Task 6: Compile Results Report

- [ ] **Step 1: Run full suite and capture output**

```bash
# Layer 1
bun test tests/unit/ship-readiness/ 2>&1 | tee /tmp/layer1-results.txt

# Layers 2+3
pnpm --filter frontend test 2>&1 | tee /tmp/layer2-3-results.txt

# Layer 4
npx playwright test tests/e2e/ship-readiness/ 2>&1 | tee /tmp/layer4-results.txt
```

- [ ] **Step 2: Write results report**

Create `docs/superpowers/specs/2026-04-01-ship-readiness-results.md` with:

```markdown
# Ship Readiness Test Results

## Summary
- Total tests: X
- Passed: X
- Failed: X (these are bugs)

## P0 — Ship Blockers
[Crashes, white screens, broken routes, contract mismatches]

## P1 — Should Fix
[Missing error handling, inconsistent error shapes]

## P2 — Nice to Have
[Edge case rendering, cosmetic issues]

## Raw Results
[Test output for each layer]
```

- [ ] **Step 3: Commit report**

```bash
git add -f docs/superpowers/specs/2026-04-01-ship-readiness-results.md
git commit -m "docs: add ship readiness test results report"
```
