# Phase 0 — Foundation

Timeline: Days 1–2
Branch: `feature/phase-0-foundation`
Gate: CI green + `pnpm dev` starts both services

## Goal
A clean, working monorepo. Both services start locally. CI passes. n8n deployed.
Every subsequent phase builds on this without structural surprises.

---

## Tasks

### 0.1 Init pnpm monorepo
`chore: init pnpm monorepo with workspace config`

Root `package.json`:
```json
{
  "name": "whateverops",
  "private": true,
  "workspaces": ["frontend", "backend", "packages/*"],
  "scripts": {
    "dev": "concurrently \"pnpm --filter backend dev\" \"pnpm --filter frontend dev\"",
    "build": "pnpm --filter backend build && pnpm --filter frontend build",
    "test": "bun test tests/",
    "test:unit": "bun test tests/unit/",
    "test:integration": "bun test tests/integration/",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint"
  }
}
```
Done when: `pnpm install` at root succeeds.

---

### 0.2 Scaffold frontend
`chore(frontend): scaffold React + Vite + TypeScript + Tailwind`

- `vite create` with React + TypeScript template
- Install: `tailwindcss @tailwindcss/vite`
- Tailwind config: dark mode `class`, custom colors:
  - `ops-bg: #0A0A0F` — dashboard background
  - `ops-panel: #111118` — panel cards
  - `ops-border: #1E1E2E` — panel borders
  - `ops-green: #00D46A` — healthy
  - `ops-amber: #FFB800` — warning
  - `ops-red: #FF4545` — error
  - `ops-volt: #7C3AED` — brand accent
- Delete Vite boilerplate (App.css, vite.svg, counter)

Done when: `pnpm --filter frontend dev` opens localhost:5173, 0 console errors.

---

### 0.3 Scaffold backend
`chore(backend): scaffold Hono.js on Bun`

`backend/src/index.ts`:
```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()
app.use('*', cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use('*', logger())
app.get('/health', (c) => c.json({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}))

export default { port: Number(process.env.PORT ?? 3000), fetch: app.fetch }
```

Done when: `curl localhost:3000/health` returns `{"status":"ok",...}`.

---

### 0.4 Shared TypeScript config
`chore(ts): strict mode shared tsconfig`

`packages/tsconfig/base.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "skipLibCheck": true
  }
}
```
Both frontend and backend `tsconfig.json` extend this.

---

### 0.5 ESLint + Prettier
`chore(lint): ESLint + Prettier shared config`

- Root `.eslintrc.json`: `@typescript-eslint/recommended`
- Root `.prettierrc`: single quotes, no semicolons, 2-space indent, 100 char width
- `lint-staged` + `husky` pre-commit: lint + typecheck on staged files

---

### 0.6 Bun test runner + smoke test
`test: add Bun test runner and first smoke test`

`tests/unit/backend/health.test.ts`:
```typescript
import { describe, it, expect } from 'bun:test'
describe('health endpoint', () => {
  it('returns ok', async () => {
    const res = await fetch('http://localhost:3000/health')
    expect((await res.json()).status).toBe('ok')
  })
})
```

---

### 0.7 Railway deploy config
`chore(infra): add railway.toml for backend`

`backend/railway.toml`:
```toml
[build]
builder = "nixpacks"
buildCommand = "bun install"

[deploy]
startCommand = "bun run src/index.ts"
healthcheckPath = "/health"
healthcheckTimeout = 60
restartPolicyType = "on_failure"
```

---

### 0.8 Vercel deploy config
`chore(infra): add vercel.json for frontend`

`frontend/vercel.json`:
```json
{
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "installCommand": "bun install",
  "framework": "vite"
}
```

---

### 0.9 /health endpoint
Already in 0.3. Confirm it includes `uptime` and `timestamp`.

---

### 0.10 Shared types package
`chore(packages): add packages/types with shared type definitions`

`packages/types/src/index.ts` — IntegrationId union, PanelStatus, API shapes.

---

### 0.11 n8n Railway deployment
`chore(infra): document n8n Railway setup`

Create `docs/06-Development/N8N-SETUP.md`.
Export placeholder JSONs to `n8n/workflows/`:
- `AUTO-1-deploy-to-post.json`
- `AUTO-2-stars-milestone.json`
- `AUTO-3-weekly-metrics.json`
- `AUTO-4-first-payment.json`
- `AUTO-5-error-transparency.json`

---

### 0.12 GitHub Actions CI
`ci: add CI pipeline (lint, typecheck, test, audit, secret scan)`

See `.github/workflows/ci.yml`.

---

### 0.13 Docs initialized
`docs: initialize all doc directories with README files`

Add `README.md` to each `docs/0N-*/` directory.

---

## Acceptance Criteria
- [ ] `pnpm install` — 0 errors
- [ ] `pnpm dev` — both services start
- [ ] `curl localhost:3000/health` — `{"status":"ok"}`
- [ ] `localhost:5173` — blank page, 0 console errors
- [ ] `bun test tests/unit/` — smoke test passes
- [ ] `pnpm typecheck` — 0 errors
- [ ] `pnpm lint` — 0 errors
- [ ] CI passes on a test PR
- [ ] `.env.example` has all 15 integrations documented
