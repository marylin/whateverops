# Ship Readiness Fixes — Design Spec

**Date:** 2026-04-01
**Branch:** feature/phase-3.6-quality-polish
**Goal:** Fix all 6 findings from ship readiness test results. Re-run tests to verify.
**Source:** `docs/superpowers/specs/2026-04-01-ship-readiness-results.md`

---

## Fix 1: Mobile viewport overflow (P0)

**Root cause:** Header nav buttons (HealthIndicator, Settings, Status, Refresh) are laid out in a single flex row with no responsive collapsing. At 375px, the combined width (~440px) exceeds the viewport. Additionally, the HealthIndicator dropdown modal uses `w-80` (320px fixed width).

### Header changes (`frontend/src/components/layout/Header.tsx`)

Hide nav link text below `sm:` breakpoint (640px). Settings and Status links become icon-only at mobile. The buttons already have `aria-label` attributes for accessibility.

- Settings link: wrap text in `<span className="hidden sm:inline">Settings</span>`, keep an icon visible at all sizes
- Status link: same pattern
- Use Tailwind's `hidden sm:inline` to toggle text visibility

### HealthIndicator modal (`frontend/src/components/layout/HealthIndicator.tsx`)

Change `w-80` to `w-[min(20rem,calc(100vw-2rem))]` so the dropdown fits within the viewport with 1rem margin on each side.

### Acceptance
- `responsive.spec.ts` mobile tests pass (no horizontal overflow at 375px)
- Header still looks correct at `sm:` (640px+) with full text labels

---

## Fix 2: Error response shape consistency (P1)

**Root cause:** Three different error sources produce three different JSON shapes:
- Route-level: `{ error: string }`
- Rate limiter: `{ error, message, retryAfter }`
- Error handler: `{ error, status, timestamp }`

### Standard error envelope

All error responses use:
```typescript
{
  error: string,      // Human-readable message
  status: number,     // HTTP status code
  timestamp: string   // ISO 8601
}
```

Extra fields (like `retryAfter` on 429) are allowed alongside the standard ones.

### Changes

**`backend/src/middleware/rate-limit.ts`:** Add `status: 429` and `timestamp: new Date().toISOString()` to the 429 response body. Keep existing `retryAfter` field.

**`backend/src/routes/settings.ts`:** Add `status: 400` and `timestamp` to validation error responses. Add `status: 422` and `timestamp` to setStorageMode error response.

**`backend/src/routes/webhooks.ts`:** Add `status: 401` and `timestamp` to unauthorized response.

### Acceptance
- All error responses from any source include `error`, `status`, `timestamp`
- `error-responses.test.ts` passes with consistent shape assertions

---

## Fix 3: errorHandler middleware broken (P1)

**Root cause:** Hono's internal error handling intercepts thrown errors before the middleware's `return c.json(...)` reaches the client. Result: 500 errors return `text/plain "Internal Server Error"` instead of JSON.

### Change

In `backend/src/index.ts`, replace:
```typescript
app.use('*', errorHandler)
```

With Hono's built-in error handler:
```typescript
app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Internal server error'
  const status = (err as { status?: number }).status ?? 500
  logger.error({ method: c.req.method, path: c.req.path, status, requestId: c.get?.('requestId') }, message)
  return c.json({ error: message, status, timestamp: new Date().toISOString() }, status as 500)
})
```

Delete or deprecate `backend/src/middleware/error.ts` (keep the file but remove the import from index.ts).

### Acceptance
- Unhandled exceptions return `Content-Type: application/json` with `{ error, status, timestamp }`
- Existing error middleware tests still conceptually pass (may need import path update)

---

## Fix 4: JSON 404 handler (P1)

**Root cause:** No `notFound` handler registered. Unknown routes return `text/plain "404 Not Found"`.

### Change

In `backend/src/index.ts`, add after routes:
```typescript
app.notFound((c) =>
  c.json({ error: 'Not found', status: 404, timestamp: new Date().toISOString() }, 404)
)
```

### Acceptance
- `GET /api/nonexistent` returns `Content-Type: application/json` with `{ error: 'Not found', status: 404, timestamp }`

---

## Fix 5: VercelPanel crash (P1)

**Root cause:** `VercelPanel.tsx` accesses `recentDeploys` array methods without optional chaining. When the array or sub-properties are undefined, it throws `Cannot read properties of undefined (reading 'some')`.

### Change

Read the full `VercelPanel.tsx` and add optional chaining (`?.`) or nullish coalescing (`?? []`) wherever `recentDeploys`, `projects`, or nested properties are accessed without guards.

### Acceptance
- VercelPanel renders without throwing when `recentDeploys` is empty or has entries with missing sub-fields
- No console errors from VercelPanel in E2E tests

---

## Fix 6: Panel null data guards (P2)

**Root cause:** All 17 panel components crash when `data` is null or undefined. Currently mitigated by Dashboard.tsx guard + ErrorBoundary, but lacks defense-in-depth.

### Change

Add `if (!data) return null` as the first line of every panel component's function body (17 files):

```typescript
export function XPanel({ data }: { data: XPanelData }) {
  if (!data) return null  // ← add this line
  // ... rest of component
}
```

Files to modify:
- AIProviderPanel.tsx
- AnthropicPanel.tsx
- CloudflarePanel.tsx
- GenericPanel.tsx
- GitHubPanel.tsx
- LinearPanel.tsx
- NeonPanel.tsx
- OpenAIPanel.tsx
- PostHogPanel.tsx
- RailwayPanel.tsx
- ResendPanel.tsx
- SelfMonitoringPanel.tsx
- SentryPanel.tsx
- StripePanel.tsx
- SupabaseAuthPanel.tsx
- SupabaseMgmtPanel.tsx
- VercelPanel.tsx

### Acceptance
- `panel-error-states.test.tsx` shows no crashes for null/undefined data
- All existing panel smoke tests still pass

---

## Verification

After all fixes:
1. `bun test tests/unit/ship-readiness/` — all 50 pass (update error shape assertions if needed)
2. `pnpm --filter frontend test` — all tests pass, including error state tests showing no crashes
3. `npx playwright test tests/e2e/ship-readiness/` — all 34 pass (including the 2 previously failing responsive tests)
4. `pnpm build` — both packages build successfully

---

## Out of Scope

- Full mobile-first redesign (this is a targeted overflow fix)
- Hamburger menu or mobile navigation patterns
- Additional error codes or error handling beyond what exists
- Panel component refactoring beyond the null guard
