# Contributing to WhateverOPS

Thanks for your interest! WhateverOPS is built for solo developer-founders who want a single dashboard for all their ops.

## Adding a New Integration

Each integration follows a strict contract defined below.

### Quick Template

1. Create `backend/src/integrations/your-service.ts`:

```typescript
import { z } from 'zod'
import { quickHash } from '../lib/hash.js'

export const INTEGRATION_ID = 'your-service' as const
export const INTEGRATION_NAME = 'Your Service'
export const DEFAULT_TTL = 60 // seconds

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1),
  // add extra config fields as needed
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  // shape of raw API response
}

export interface PanelData {
  // shape of parsed panel metrics
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const res = await fetch('https://api.yourservice.com/v1/data', {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<RawData>
}

export function parsePanel(raw: RawData): PanelData {
  // Pure function — transform raw data to panel metrics
  return {} as PanelData
}

export function getCacheKey(config: IntegrationConfig): string {
  return `integration:${INTEGRATION_ID}:${quickHash(config.apiKey).toString(36).slice(0, 8)}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  return 'ok'
}
```

2. Add to `backend/src/routes/dashboard.ts` (follow the existing pattern)
3. Add env vars to `.env.example`
4. Create test: `tests/unit/backend/integrations/your-service.test.ts`
5. Create fixture: `tests/fixtures/mock-responses/your-service.json`

### Required Files Checklist

- [ ] `backend/src/integrations/your-service.ts` — exports all 7 contract items
- [ ] `tests/unit/backend/integrations/your-service.test.ts` — 6+ tests
- [ ] `tests/fixtures/mock-responses/your-service.json` — ok, error, empty fixtures
- [ ] `.env.example` updated with new env vars
- [ ] `backend/src/routes/dashboard.ts` updated to include integration

### Integration Contract Rules

- `INTEGRATION_ID`: kebab-case, stable forever (never rename after merge)
- `fetchData()`: must have 10s timeout via `AbortSignal.timeout(10_000)`
- `parsePanel()`: pure function — no async, no side effects, no throws. Handle null/undefined with fallback defaults.
- Frontend panel: must handle 4 states — loading (skeleton), error (actionable message), empty, data
- 6 required unit tests (see test template above)

## Development Workflow

```bash
# Setup
pnpm install
cp .env.example .env

# Development
pnpm dev            # runs frontend + backend concurrently

# Quality checks (must pass before PR)
pnpm typecheck      # 0 TypeScript errors
pnpm lint           # 0 ESLint errors
pnpm test           # all tests passing
```

## Pull Request Process

1. Fork the repo and branch from `master`
2. Follow commit format: `type(scope): description`
   - `feat(stripe)`, `fix(cache)`, `test(github)`, `docs(setup)`
3. Fill out the PR template (`.github/PULL_REQUEST_TEMPLATE.md`)
4. Ensure all checks pass:
   - `pnpm typecheck` — 0 errors
   - `pnpm lint` — 0 errors
   - `pnpm test` — all passing

## Code Style

- TypeScript strict mode
- ESLint + Prettier (auto-formatted on commit via lint-staged)
- Tailwind CSS for frontend
- No inline styles or CSS modules

## Questions?

Open an issue or start a discussion. We're a small project and happy to help.
