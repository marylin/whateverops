# OSS Ship Readiness Test Plan — Design Spec

**Date:** 2026-04-01
**Branch:** feature/phase-3.6-quality-polish
**Goal:** Write honest tests against the current codebase. Run them. Every failure is a real bug. No test gets modified to pass — failures are the deliverable.

## Scope

4 test layers, ~80-100 test cases across 14 new test files. Focused on ship-blocking bugs, not coverage numbers.

## Non-Goals

- Individual integration API correctness (already covered by 15 existing test files)
- CSS visual regression (not worth the flakiness)
- Performance benchmarks (separate concern)
- Internal utility functions that are exercised by higher-level tests
- Modifying source code to make tests pass

---

## Layer 1: Backend API Contract Tests

**Purpose:** "Does the backend return what the frontend expects?"

Test every API endpoint against the real Hono app instance with `app.request()`. No mocks of the app itself — test the real routing, middleware, and response shapes.

### File: `tests/unit/ship-readiness/api-contracts.test.ts`

**`GET /api/dashboard`**
- Returns 200 with JSON array
- Each item has required fields: `id: string`, `name: string`, `status: 'ok' | 'error' | 'loading'`, `data: object | null`, `error: string | null`, `lastUpdated: string`, `cached: boolean`, `ttl: number`
- `id` matches one of the 14 known integration IDs (github, linear, vercel, railway, posthog, resend, anthropic, openai, cloudflare, supabase-auth, supabase-management, neon, sentry, stripe) plus `self-monitoring`
- `ttl` is a positive number
- `lastUpdated` is a valid ISO 8601 string when status is 'ok'
- `data` is non-null when status is 'ok'
- `error` is non-null when status is 'error'

**`GET /api/settings`**
- Returns 200 with JSON object
- Response has `storageMode: string` field
- Response has `configured: string[]` field (array of integration IDs)
- Response has `available: string[]` field (array of integration IDs)

**`POST /api/settings/storage-mode`**
- Returns 200 with valid body `{ mode: 'memory' }`
- Returns 400 with invalid body `{ mode: 'invalid_thing' }`
- Returns 400 with empty body
- Returns 400 with missing `mode` field

**`GET /api/status`**
- Returns 200 with JSON object
- Response has `status: string`, `uptime: number`, `version: string` fields
- `uptime` is a non-negative number
- `version` matches semver pattern

**`POST /api/webhooks/n8n`**
- Returns 200 with valid webhook payload `{ event: 'test', payload: {} }`
- Returns 400 with missing `event` field
- Returns 400 with empty body

### File: `tests/unit/ship-readiness/cors-and-headers.test.ts`

**CORS headers**
- `OPTIONS /api/dashboard` returns CORS headers (Access-Control-Allow-Origin, Access-Control-Allow-Methods)
- Response includes `X-Request-ID` header on every endpoint (dashboard, settings, status)
- `X-Request-ID` is a valid UUID format
- If request includes `X-Request-ID`, response echoes it back

**Content-Type**
- All JSON endpoints return `Content-Type: application/json`
- Error responses also return `Content-Type: application/json`

### File: `tests/unit/ship-readiness/error-responses.test.ts`

**Error shape consistency**
- `GET /api/nonexistent` returns 404 with JSON error shape
- Verify 404 response has `{ error: string }` or `{ message: string }` — whichever pattern is used, it should be consistent
- `POST /api/settings/storage-mode` with bad input returns error with same JSON shape as 404
- Rate-limited request returns 429 with JSON body (not plain text)
- All error responses include `X-Request-ID` header

---

## Layer 2: Frontend Rendering Smoke Tests

**Purpose:** "Does every component render without crashing?"

Render each component with realistic props derived from actual fixture data. Assert it doesn't throw and renders expected content. Uses Vitest + React Testing Library.

### File: `frontend/src/components/panels/__tests__/all-panels-smoke.test.tsx`

For each of the 17 panel components, test with two data scenarios:
1. **OK state** — render with `status: 'ok'` and fixture data from `tests/fixtures/mock-responses/{service}.json`
2. **Null data** — render with `status: 'ok'` but `data: null` (edge case: what if API returns ok but no data?)

Panel components to test:
- AIProviderPanel
- AnthropicPanel
- CloudflarePanel
- GenericPanel
- GitHubPanel
- LinearPanel
- NeonPanel
- OpenAIPanel
- PostHogPanel
- RailwayPanel
- ResendPanel
- SelfMonitoringPanel
- SentryPanel
- StripePanel
- SupabaseAuthPanel
- SupabaseMgmtPanel
- VercelPanel

Each test: `render(<XPanel data={fixtureData} />)` — assert no throw, assert component renders (container has child nodes).

**Important:** Read each panel component's actual props interface before writing tests. Don't assume — check what props each panel expects. Some may take `data` directly, others may take the full `IntegrationResult`. The test must use the real interface.

### File: `frontend/src/components/layout/__tests__/layout-smoke.test.tsx`

**Header**
- Renders without crashing
- Contains the app name / logo text
- Refresh button is present with aria-label

**DailyDigest**
- Renders with mock panel data array (mix of ok/error/loading)
- Renders with empty panel array
- Doesn't crash when all panels are in error state

**Dashboard**
- Requires mocking `useDashboard` hook (returns panels array)
- Renders with mock data — panels appear
- Renders with empty data — shows empty state or no crash

### File: `frontend/src/components/ui/__tests__/ui-smoke.test.tsx`

Test remaining untested UI components:

**ExternalLink**
- Renders with href and children
- Has `target="_blank"` and `rel="noopener noreferrer"`

**Metric**
- Renders label and value
- Renders with value=0 (falsy but valid)

**MiniBar**
- Renders with segments array
- Renders with empty segments array

**ProgressBar**
- Renders with value between 0-100
- Renders with value=0
- Renders with value=100

**StatusDot**
- Renders correct color class for each status (ok, error, loading, unknown)

### File: `frontend/src/pages/__tests__/pages-smoke.test.tsx`

**SettingsPage**
- Mock `settings-api.ts` fetch calls
- Renders without crashing
- Shows storage mode section
- Shows configured integrations list

**StatusPage**
- Mock `api.ts` fetch calls
- Renders without crashing
- Shows integration status list

### File: `tests/unit/ship-readiness/format-utils.test.ts`

Test `frontend/src/lib/format.ts` utility functions:
- Read the file first to discover all exported functions
- Test each function with: normal input, edge cases (0, empty string, null, undefined), boundary values
- Date formatting: valid ISO string, invalid string, future date, epoch
- Number formatting: 0, negative, very large, decimal

---

## Layer 3: Error Boundary & Graceful Degradation

**Purpose:** "What happens when things go wrong?"

### File: `frontend/src/components/panels/__tests__/panel-error-states.test.tsx`

For each panel component:
- Render with `status: 'error'` and `error: 'API key invalid'` — should show error UI, not crash
- Render with `status: 'loading'` — should show loading state, not crash
- Render with `data: undefined` — should not throw

**Dashboard degraded states:**
- All panels in error state — dashboard still renders, health indicator shows error
- Mix of ok/error/loading — dashboard renders all, no crash
- Zero configured integrations — renders meaningful empty state

### Verified via Layer 1 (backend):
- 429 rate limit response has correct shape
- 404/500 responses are JSON, not HTML or plain text

---

## Layer 4: E2E Critical Paths (Playwright)

**Purpose:** "Can a real user actually use this?"

All E2E tests use Playwright against running frontend + backend. Mock external API calls at the network level (intercept fetch to external services) so tests don't need real API keys.

### File: `tests/e2e/ship-readiness/dashboard-flow.spec.ts`

- Page loads without console errors
- Header renders with app name and refresh button
- Health indicator is visible and shows a status
- At least one panel card renders (even if in error state due to no API keys)
- Clicking refresh triggers a data reload (network request fires)
- Panel cards show title, status badge, and stale dot
- No uncaught JS exceptions in console

### File: `tests/e2e/ship-readiness/settings-flow.spec.ts`

- Navigate to /settings via header link
- Settings page loads without error
- Storage mode section is visible
- Available integrations are listed
- Can interact with storage mode controls (click/select)
- Navigate back to dashboard — dashboard loads

### File: `tests/e2e/ship-readiness/status-flow.spec.ts`

- Navigate to /status
- Status page loads without error
- Integration list is visible
- Each integration shows name and status indicator
- Health summary is displayed

### File: `tests/e2e/ship-readiness/navigation.spec.ts`

- Dashboard (/) loads
- Settings (/settings) loads
- Status (/status) loads
- Unknown route (/nonexistent) — doesn't crash (shows 404 or redirects to dashboard)
- Header nav links work for all routes
- Browser back/forward between routes works
- Direct URL navigation works for each route

### File: `tests/e2e/ship-readiness/empty-and-error.spec.ts`

- Dashboard with no API keys configured — shows panels in error/unconfigured state, no crash
- If backend is unreachable — frontend shows error state, doesn't white-screen
- Refresh after error — attempts recovery

### File: `tests/e2e/ship-readiness/responsive.spec.ts`

- Dashboard renders at 375px width (mobile) — no horizontal overflow, panels stack
- Dashboard renders at 768px width (tablet) — panels in grid
- Dashboard renders at 1440px width (desktop) — full layout
- Settings page renders at 375px — form elements accessible
- No elements overflow viewport at any size

---

## Test Infrastructure

### Backend contract tests (Layer 1)
- Runner: Bun (`bun test`)
- Location: `tests/unit/ship-readiness/`
- Import the Hono app directly, use `app.request()` for in-process HTTP testing
- No external services needed — integrations will return errors (no API keys), which is fine for contract testing

### Frontend smoke tests (Layers 2 & 3)
- Runner: Vitest with jsdom
- Location: `frontend/src/` (co-located with components)
- Use React Testing Library `render()` 
- Mock API calls via `vi.mock()` on the api/settings-api modules
- Import fixture data from `tests/fixtures/mock-responses/` for realistic props

### E2E tests (Layer 4)
- Runner: Playwright
- Location: `tests/e2e/ship-readiness/`
- Uses existing `playwright.config.ts` (backend: 3099, frontend: 5199)
- Mock external API calls via `page.route()` interceptors
- No real API keys needed

### Running the full suite
```bash
# Layer 1: Backend contracts
bun test tests/unit/ship-readiness/

# Layers 2 & 3: Frontend smoke + error states
pnpm --filter frontend test

# Layer 4: E2E
npx playwright test tests/e2e/ship-readiness/
```

---

## Acceptance Criteria

- All test files written and runnable without source code modifications
- Every test failure is documented as a bug/gap in a results report
- Results report categorizes failures by severity:
  - **P0 (ship blocker)**: Crashes, white screens, broken routes, data contract mismatches
  - **P1 (should fix)**: Missing error handling, accessibility gaps, inconsistent error shapes  
  - **P2 (nice to have)**: Edge case rendering, cosmetic issues at unusual viewports
- Zero test files require changes to source code to run (imports resolve, fixtures exist)

---

## Out of Scope

- Fixing bugs found (separate task after results)
- Integration API mocking correctness (existing tests cover this)
- Load/stress testing
- Security testing (separate audit)
- Visual regression screenshots
