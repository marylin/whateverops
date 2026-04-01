# Ship Readiness Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 6 findings from ship readiness test results, then re-run 291 tests to verify all pass.

**Architecture:** 6 independent fixes executed sequentially, followed by a full test verification. Backend fixes first (error handling), then frontend fixes (responsive + panels).

**Tech Stack:** Hono.js (backend), React 19 + Tailwind 4 (frontend), Bun test / Vitest / Playwright (testing)

**Spec:** `docs/superpowers/specs/2026-04-01-ship-readiness-fixes-design.md`

---

## File Map

### Modified Files
| File | Fix | Changes |
|------|-----|---------|
| `backend/src/index.ts` | 3, 4 | Replace errorHandler middleware with `app.onError()` + add `app.notFound()` |
| `backend/src/middleware/rate-limit.ts` | 2 | Add `status` and `timestamp` to 429 response |
| `backend/src/routes/settings.ts` | 2 | Add `status` and `timestamp` to 400/422 responses |
| `backend/src/routes/webhooks.ts` | 2 | Add `status` and `timestamp` to 401 response |
| `frontend/src/components/layout/Header.tsx` | 1 | Hide nav text at mobile, add SVG icons |
| `frontend/src/components/layout/HealthIndicator.tsx` | 1 | Responsive modal width |
| `frontend/src/components/panels/VercelPanel.tsx` | 5 | Optional chaining on `domains` and `recentDeploys` |
| `frontend/src/components/panels/AIProviderPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/AnthropicPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/CloudflarePanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/GenericPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/GitHubPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/LinearPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/NeonPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/OpenAIPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/PostHogPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/RailwayPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/ResendPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/SelfMonitoringPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/SentryPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/StripePanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/SupabaseAuthPanel.tsx` | 6 | Add null guard |
| `frontend/src/components/panels/SupabaseMgmtPanel.tsx` | 6 | Add null guard |

---

## Task 1: Fix errorHandler + add JSON 404 (Fixes 3 & 4)

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Replace errorHandler middleware with app.onError()**

In `backend/src/index.ts`, remove the `errorHandler` import and `app.use('*', errorHandler)` line. Add `app.onError()` and `app.notFound()` after the route definitions.

Replace:
```typescript
import { errorHandler } from './middleware/error.js'
```
with nothing (delete the line).

Replace:
```typescript
app.use('*', errorHandler)
```
with nothing (delete the line).

After line 49 (`app.route('/api/status', status)`), add:

```typescript
app.notFound((c) =>
  c.json({ error: 'Not found', status: 404, timestamp: new Date().toISOString() }, 404),
)

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Internal server error'
  const status = (err as { status?: number }).status ?? 500
  logger.error(
    { method: c.req.method, path: c.req.path, status, requestId: c.get?.('requestId') },
    message,
  )
  return c.json({ error: message, status, timestamp: new Date().toISOString() }, status as 500)
})
```

- [ ] **Step 2: Verify backend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck`
Expected: No errors

- [ ] **Step 3: Run backend tests**

Run: `cd D:/Repos/whateverops && bun test tests/unit/`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add backend/src/index.ts
git commit -m "fix(backend): replace errorHandler middleware with app.onError + add JSON 404"
```

---

## Task 2: Error response shape consistency (Fix 2)

**Files:**
- Modify: `backend/src/middleware/rate-limit.ts`
- Modify: `backend/src/routes/settings.ts`
- Modify: `backend/src/routes/webhooks.ts`

- [ ] **Step 1: Add status and timestamp to rate limiter 429 response**

In `backend/src/middleware/rate-limit.ts`, find the 429 response (around line 62-68):

```typescript
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
```

Replace with:

```typescript
        JSON.stringify({
          error: 'Too Many Requests',
          status: 429,
          timestamp: new Date().toISOString(),
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
```

- [ ] **Step 2: Add status and timestamp to settings error responses**

In `backend/src/routes/settings.ts`, find the three error responses:

Line 64: `return c.json({ error: 'Invalid JSON body' }, 400)`
Replace with: `return c.json({ error: 'Invalid JSON body', status: 400, timestamp: new Date().toISOString() }, 400)`

Line 73: `return c.json({ error: 'Body must be { mode: "env" | "db" }' }, 400)`
Replace with: `return c.json({ error: 'Body must be { mode: "env" | "db" }', status: 400, timestamp: new Date().toISOString() }, 400)`

Line 81: `return c.json({ error: message }, 422)`
Replace with: `return c.json({ error: message, status: 422, timestamp: new Date().toISOString() }, 422)`

- [ ] **Step 3: Add status and timestamp to webhook 401 response**

In `backend/src/routes/webhooks.ts`, line 15:

```typescript
    return c.json({ error: 'Unauthorized' }, 401)
```

Replace with:

```typescript
    return c.json({ error: 'Unauthorized', status: 401, timestamp: new Date().toISOString() }, 401)
```

- [ ] **Step 4: Verify backend builds and tests pass**

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck && bun test tests/unit/`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/rate-limit.ts backend/src/routes/settings.ts backend/src/routes/webhooks.ts
git commit -m "fix(backend): standardize error response shape with status and timestamp"
```

---

## Task 3: Fix mobile viewport overflow (Fix 1)

**Files:**
- Modify: `frontend/src/components/layout/Header.tsx`
- Modify: `frontend/src/components/layout/HealthIndicator.tsx`

- [ ] **Step 1: Update Header.tsx — hide nav text at mobile, add icons**

Replace the entire content of `frontend/src/components/layout/Header.tsx` with:

```tsx
import { Link } from 'react-router-dom'
import { HealthIndicator } from './HealthIndicator'
import type { DashboardResponse } from '../../lib/api'

interface HeaderProps {
  dashboard: DashboardResponse | null
  onRefresh: () => void
}

export function Header({ dashboard, onRefresh }: HeaderProps) {
  return (
    <header className="border-b border-[#252535] bg-[#0C0C14]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.5px] text-[#0EA5E9]">WhateverOPS</h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 relative">
          {dashboard && (
            <HealthIndicator
              globalHealth={dashboard.globalHealth}
              panels={dashboard.panels}
              configured={dashboard.configured}
              total={dashboard.total}
            />
          )}
          <Link
            to="/settings"
            className="text-sm px-2 sm:px-3 py-1.5 min-h-[44px] flex items-center text-[#9090A0] hover:text-[#E2E2E8] transition-colors"
            aria-label="Settings"
          >
            <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <Link
            to="/status"
            className="text-sm px-2 sm:px-3 py-1.5 min-h-[44px] flex items-center text-[#9090A0] hover:text-[#E2E2E8] transition-colors"
            aria-label="Status"
          >
            <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="hidden sm:inline">Status</span>
          </Link>
          <button
            onClick={onRefresh}
            aria-label="Refresh dashboard"
            className="text-sm px-2 sm:px-3 py-1.5 min-h-[44px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#E2E2E8] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}
```

Key changes:
- Title: `text-xl sm:text-2xl` (smaller at mobile)
- Nav gaps: `gap-1 sm:gap-3` (tighter at mobile)
- Padding: `px-2 sm:px-3` per button
- Icons: SVG icons visible only below `sm:` (`sm:hidden`)
- Text: `hidden sm:inline` (hidden below 640px)
- All three nav items (Settings, Status, Refresh) get the icon+text pattern

- [ ] **Step 2: Fix HealthIndicator modal width**

In `frontend/src/components/layout/HealthIndicator.tsx`, find line 92:

```
w-80 max-h-[70vh]
```

Replace `w-80` with `w-[min(20rem,calc(100vw-2rem))]`:

```
w-[min(20rem,calc(100vw-2rem))] max-h-[70vh]
```

- [ ] **Step 3: Also hide HealthIndicator text labels at mobile**

In `frontend/src/components/layout/HealthIndicator.tsx`, find lines 85-88 (the health label and count inside the toggle button):

```tsx
        <span className="text-xs text-[#9090A0]">{healthLabels[globalHealth]}</span>
        <span className="text-[10px] text-[#606070]">
          {configured}/{total}
        </span>
```

Add `hidden sm:inline` to both spans:

```tsx
        <span className="hidden sm:inline text-xs text-[#9090A0]">{healthLabels[globalHealth]}</span>
        <span className="hidden sm:inline text-[10px] text-[#606070]">
          {configured}/{total}
        </span>
```

- [ ] **Step 4: Verify frontend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend build`
Expected: Build succeeds

- [ ] **Step 5: Run frontend tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/layout/Header.tsx frontend/src/components/layout/HealthIndicator.tsx
git commit -m "fix(frontend): responsive header — icon-only nav at mobile, fix modal width"
```

---

## Task 4: Fix VercelPanel crash (Fix 5)

**Files:**
- Modify: `frontend/src/components/panels/VercelPanel.tsx`

- [ ] **Step 1: Add optional chaining to unguarded property accesses**

In `frontend/src/components/panels/VercelPanel.tsx`:

Line 81: `const hasMisconfiguredDomain = data.domains.some((d) => d.misconfigured)`
Replace with: `const hasMisconfiguredDomain = (data.domains ?? []).some((d) => d.misconfigured)`

Line 103: `data.recentDeploys.length > 0`
Replace with: `(data.recentDeploys ?? []).length > 0`

Line 106: `data.recentDeploys[0]!.status`
Replace with: `data.recentDeploys[0]?.status ?? 'UNKNOWN'`

Line 108: `data.recentDeploys[0]!.status`
Replace with: `data.recentDeploys[0]?.status ?? 'UNKNOWN'`

Line 111: `data.recentDeploys[0]!.created`
Replace with: `data.recentDeploys[0]?.created ?? ''`

Line 144: `data.domains.filter((d) => d.misconfigured).length`
Replace with: `(data.domains ?? []).filter((d) => d.misconfigured).length`

Line 145: `data.domains.filter((d) => d.misconfigured).length !== 1`
Replace with: `(data.domains ?? []).filter((d) => d.misconfigured).length !== 1`

Line 220: `data.recentDeploys.length > 0`
Replace with: `(data.recentDeploys ?? []).length > 0`

Line 227: `data.recentDeploys.length`
Replace with: `(data.recentDeploys ?? []).length`

Line 231: `data.recentDeploys.slice(0, 5)`
Replace with: `(data.recentDeploys ?? []).slice(0, 5)`

- [ ] **Step 2: Run frontend tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/panels/VercelPanel.tsx
git commit -m "fix(frontend): add optional chaining to VercelPanel for resilient rendering"
```

---

## Task 5: Add null data guards to all 17 panels (Fix 6)

**Files:**
- Modify: all 17 panel files in `frontend/src/components/panels/`

- [ ] **Step 1: Add null guard to each panel**

For every panel component, add `if (!data) return null` as the first line inside the function body.

The pattern for each file — find the export function line, and add the guard right after it:

**AIProviderPanel.tsx:** After `export function AIProviderPanel({ data }: { data: AIProviderData }) {`
Add: `  if (!data) return null`

**AnthropicPanel.tsx:** After `export function AnthropicPanel({ data }: { data: AnthropicPanelData }) {`
Add: `  if (!data) return null`

**CloudflarePanel.tsx:** After `export function CloudflarePanel({ data }: { data: CloudflarePanelData }) {`
Add: `  if (!data) return null`

**GenericPanel.tsx:** After `export function GenericPanel(props: GenericPanelProps) {` (or whatever signature)
Add: `  if (!props.data) return null` (or `if (!data) return null` if destructured)

**GitHubPanel.tsx:** After `export function GitHubPanel({ data }: { data: GitHubPanelData }) {`
Add: `  if (!data) return null`

**LinearPanel.tsx:** After `export function LinearPanel({ data }: { data: LinearPanelData }) {`
Add: `  if (!data) return null`

**NeonPanel.tsx:** After `export function NeonPanel({ data }: { data: NeonPanelData }) {`
Add: `  if (!data) return null`

**OpenAIPanel.tsx:** After `export function OpenAIPanel({ data }: { data: OpenAIPanelData }) {`
Add: `  if (!data) return null`

**PostHogPanel.tsx:** After `export function PostHogPanel({ data }: { data: PostHogPanelData }) {`
Add: `  if (!data) return null`

**RailwayPanel.tsx:** After `export function RailwayPanel({ data }: { data: RailwayPanelData }) {`
Add: `  if (!data) return null`

**ResendPanel.tsx:** After `export function ResendPanel({ data }: { data: ResendPanelData }) {`
Add: `  if (!data) return null`

**SelfMonitoringPanel.tsx:** After `export function SelfMonitoringPanel({ data }: { data: SelfMonitoringPanelData }) {`
Add: `  if (!data) return null`

**SentryPanel.tsx:** After `export function SentryPanel({ data }: { data: SentryPanelData }) {`
Add: `  if (!data) return null`

**StripePanel.tsx:** After `export function StripePanel({ data }: { data: StripePanelData }) {`
Add: `  if (!data) return null`

**SupabaseAuthPanel.tsx:** After `export function SupabaseAuthPanel({ data }: { data: SupabaseAuthPanelData }) {`
Add: `  if (!data) return null`

**SupabaseMgmtPanel.tsx:** After `export function SupabaseMgmtPanel({ data }: { data: SupabaseMgmtPanelData }) {`
Add: `  if (!data) return null`

**VercelPanel.tsx:** After `export function VercelPanel({ data }: { data: VercelPanelData }) {`
Add: `  if (!data) return null`

**IMPORTANT:** Read each file first to confirm the exact function signature. Some panels may use `props` instead of destructured `{ data }`. Adapt the guard accordingly (e.g., `if (!props.data) return null`).

- [ ] **Step 2: Run frontend tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`
Expected: All pass, including panel-error-states.test.tsx (null/undefined tests should now show no crashes)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/panels/
git commit -m "fix(frontend): add null data guards to all 17 panel components"
```

---

## Task 6: Full verification — re-run all ship readiness tests

- [ ] **Step 1: Run Layer 1 backend contract tests**

Run: `cd D:/Repos/whateverops && bun test tests/unit/ship-readiness/`
Expected: 50 pass, 0 fail

Note: Some error shape assertions in the contract tests may need updating since we changed the error response format. If tests fail because they assert the OLD shape (missing `status`/`timestamp`), that means the tests correctly detected our change. Update those specific assertions to expect the new shape.

- [ ] **Step 2: Run all backend tests**

Run: `cd D:/Repos/whateverops && bun test tests/unit/ && bun test tests/integration/`
Expected: All pass

- [ ] **Step 3: Run all frontend tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`
Expected: All pass (207+ tests)

- [ ] **Step 4: Run E2E tests**

Run: `cd D:/Repos/whateverops && npx playwright test tests/e2e/ship-readiness/`
Expected: 34/34 pass (the 2 previously failing responsive tests should now pass)

- [ ] **Step 5: Build both packages**

Run: `cd D:/Repos/whateverops && pnpm build`
Expected: Both frontend and backend build successfully

- [ ] **Step 6: Update test results report if all pass**

Update the summary in `docs/superpowers/specs/2026-04-01-ship-readiness-results.md` to note that all 6 findings have been fixed and all 291+ tests now pass.

- [ ] **Step 7: Commit any test updates**

```bash
git add tests/ frontend/ docs/
git commit -m "test: update ship readiness tests for new error response format"
```
