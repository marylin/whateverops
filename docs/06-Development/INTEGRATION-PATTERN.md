# Integration Pattern

Every integration follows this exact contract. No exceptions.

## File: `backend/src/integrations/[name].ts`

```typescript
import { z } from 'zod'

export const INTEGRATION_ID = 'name' as const      // kebab-case, stable forever
export const INTEGRATION_NAME = 'Display Name'      // shown in UI
export const DEFAULT_TTL = 60                        // cache TTL in seconds

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'API key required'),
  // add integration-specific fields
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData { /* exact shape from API */ }
export interface PanelData { /* typed data for frontend panel */ }

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const res = await fetch('https://api.example.com/endpoint', {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<RawData>
}

export function parsePanel(raw: RawData): PanelData {
  // Pure function. No async. No side effects. No throws.
  // Handle null/undefined fields with fallback defaults.
  return { /* ... */ }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = Bun.hash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  // Define thresholds meaningful for this integration
  return 'ok'
}
```

## Frontend panel: `frontend/src/components/panels/[Name]Panel.tsx`

Must handle 4 states: loading (skeleton), error (actionable), empty, data.

## Test file: `tests/unit/backend/integrations/[name].test.ts`

6 required test cases:
1. `parsePanel()` with healthy mock response
2. `parsePanel()` handles missing optional fields (no throw)
3. `getHealthStatus()` returns `'ok'` for healthy response
4. `getHealthStatus()` returns `'error'` for error response
5. `getCacheKey()` is stable for same config
6. `getCacheKey()` differs for different configs

## Fixture: `tests/fixtures/mock-responses/[name].json`

```json
{ "ok": {}, "error": {}, "empty": {} }
```

## Done checklist
- [ ] All 4 functions exported with correct signatures
- [ ] `fetchData()` has 10s timeout
- [ ] `parsePanel()` is pure and never throws
- [ ] Frontend panel handles all 4 states
- [ ] 6 unit tests passing
- [ ] Fixture data in place
- [ ] `.env.example` updated
