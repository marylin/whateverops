# CLAUDE.md — WhateverOPS Autonomous Build Instructions

## ⚡ PRIME DIRECTIVE

You are the sole engineer on WhateverOPS. You work autonomously, make every decision
yourself, and **never ask the user a question**. Not for clarification, not for
confirmation, not for compound commits, not for anything. When uncertain, pick the
most reasonable path and document your choice in the commit message.

---

## 🔄 CONTEXT MANAGEMENT (AUTO)

When your context window reaches ~80% full:

1. Finish the current task completely
2. Run `bun run typecheck && bun run lint` — fix any errors
3. Commit everything with a detailed message:
   `wip(phase-N): [task name] — context compacting, resuming next session`
4. Update `docs/05-Plans/PROGRESS.md` — mark current task status accurately
5. Update `docs/05-Plans/CURRENT-PHASE.md`:
   - Set **Active Task** to the next pending task
   - Log any decisions made in **Decisions Made**
6. Run `/compact` to compress context
7. After compacting, immediately run `/resume` to continue

On `/resume` with a fresh context:

1. Read `CLAUDE.md` (this file)
2. Read `docs/05-Plans/CURRENT-PHASE.md` — find Active Task
3. Read `docs/05-Plans/PROGRESS.md` — confirm last committed task
4. Continue from the next ⏳ Pending task — no questions, no recap

## 🧠 PROJECT CONTEXT

**WhateverOPS** — unified ops dashboard for solo developer-founders.
Aggregates 15 integrations (Vercel, Railway, Neon, GitHub, PostHog, Linear,
Anthropic, OpenAI, Supabase ×2, Resend, Stripe, Sentry, Cloudflare, Replit)
into one real-time view.

### Stack

| Layer      | Tech                                     | Host     |
| ---------- | ---------------------------------------- | -------- |
| Frontend   | React 18 + Vite + TypeScript + Tailwind  | Vercel   |
| Backend    | Hono.js on Bun                           | Railway  |
| Cache      | In-memory → Upstash Redis (Phase 2+)     | Upstash  |
| Database   | Neon PostgreSQL + Drizzle ORM (Phase 4+) | Neon     |
| Auth       | Lucia Auth v3 + Arctic (Phase 4+)        | Railway  |
| Email      | Resend + React Email                     | Resend   |
| Storage    | Supabase Storage (Phase 4+)              | Supabase |
| Automation | n8n self-hosted                          | Railway  |
| Payments   | Stripe Checkout + Portal (Phase 5+)      | Stripe   |
| Monitoring | Sentry + BetterStack (Phase 5+)          | SaaS     |

### Monorepo layout

```
/
├── frontend/                   React + Vite SPA
│   └── src/
│       ├── components/
│       │   ├── panels/         One component per integration
│       │   ├── layout/         Dashboard shell, header, nav
│       │   └── ui/             Shared primitives
│       ├── hooks/
│       ├── lib/
│       └── pages/
├── backend/                    Hono.js on Bun
│   └── src/
│       ├── integrations/       One file per integration
│       ├── cache/              Cache abstraction layer
│       ├── routes/             API handlers
│       ├── middleware/         Auth, rate-limit, CORS, error
│       ├── db/                 Drizzle schema + client (Phase 4+)
│       └── lib/
├── packages/
│   └── types/                  Shared TypeScript types
├── n8n/
│   └── workflows/              n8n workflow JSON exports
├── tests/
│   ├── unit/
│   │   ├── backend/
│   │   │   └── integrations/   Mirrors backend/src/integrations/
│   │   └── frontend/
│   │       └── components/
│   ├── integration/
│   │   ├── cache/
│   │   └── webhooks/
│   ├── e2e/
│   │   └── flows/
│   ├── fixtures/
│   │   └── mock-responses/     One JSON per integration
│   └── reports/                Auto-generated — do not edit
├── docs/
│   ├── 01-Discovery/
│   ├── 02-Requirements/
│   ├── 03-Architecture/
│   │   └── ADR/
│   ├── 04-Design/
│   ├── 05-Plans/               ← Progress lives here
│   ├── 06-Development/
│   ├── 07-Testing/
│   ├── 08-Feedback/
│   └── 09-Archive/
├── scripts/                    Build, changelog, load-test utils
├── .github/
│   ├── workflows/
│   │   └── ci.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── .env.example
├── .gitignore
└── CLAUDE.md                   ← This file
```

**Current phase:** `docs/05-Plans/CURRENT-PHASE.md`

---

## 📋 SLASH COMMANDS

### `/plan [request]`

1. Read `CURRENT-PHASE.md` + relevant `PHASE-N-PLAN.md`
2. Break request into tasks (S/M/L)
3. Write plan to `CURRENT-PHASE.md` under `## Pending Plan`
4. Output summary to user
5. **Wait for user to type `go` before executing**
6. On `go`: execute each task → commit → update progress

### `/status [feature]`

Output only:

```
✅ Done: [list]
🔄 In Progress: [current]
⏳ Pending: [list]
🚫 Blocked: [if any]
📊 Tests: [X/Y passing]
```

### `/resume [feature]`

1. Read `PROGRESS.md` → find last completed task
2. Read `CURRENT-PHASE.md` → find active task
3. Continue from next pending task — no questions

### `/test [target]`

1. Run: `unit` | `integration` | `e2e` | specific file
2. Fix implementation failures silently
3. Re-run until green
4. Save report → `tests/reports/[target]-[timestamp].md`
5. Update `PROGRESS.md` test column
6. Report: `✅ 47/47 passing` or `❌ 3 failing — see tests/reports/`

### `/align`

1. Audit structure vs this file
2. Move misplaced files
3. Fix broken imports
4. Commit: `chore: align project structure to conventions`

---

## 🔄 GIT WORKFLOW

### Branch strategy

```
main                           Production — PR merges only
staging                        Pre-production integration
feature/phase-N-[name]         Per-phase feature work
fix/[description]              Bug fixes
chore/[description]            Deps, tooling, maintenance
```

### Branch rules

- Start any Phase N work → `git checkout -b feature/phase-N-[name]`
- Any change touching > 1 file of core logic → branch
- Any new integration → branch
- Any schema change → branch

### Commit rules

- **Commit after every completed task — never batch**
- **Never ask for compound commit confirmation — just commit**
- Only commit code that compiles without errors
- Format: `type(scope): description`
  - `feat(stripe): add MRR panel with live subscription metrics`
  - `fix(cache): handle Redis timeout with memory fallback`
  - `test(stripe): add unit tests for MRR calculation logic`
  - `chore(deps): add @upstash/redis`
  - `docs(setup): update Railway deploy instructions`
- Body: what changed + why (2–3 lines)

### PR rules

Create PR when feature branch is complete. Use `.github/PULL_REQUEST_TEMPLATE.md`.
Required before merge:

- `bun run typecheck` → 0 errors
- `bun run lint` → 0 errors
- `bun test tests/unit/` → all passing
- `bun test tests/integration/` → all passing
- `bun audit` → 0 high/critical

---

## 🔒 SECURITY CHECKLIST (run before every PR)

```bash
# 1. Dependency vulnerabilities
bun audit

# 2. No secrets in source
grep -rn "sk_live\|sk_test\|AKIA[0-9A-Z]\|-----BEGIN\|api_key\s*=" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.git \
  frontend/src backend/src packages/
# Must return 0 results

# 3. TypeScript strict
bun run typecheck
# Must pass with 0 errors

# 4. .env not tracked
git status --short | grep "\.env$"
# Must return nothing
```

Save scan results → `tests/reports/security-[timestamp].md`

---

## 🔗 INTEGRATION CONTRACT (mandatory for all 15)

Every integration: `backend/src/integrations/[name].ts`

Must export exactly:

```typescript
export const INTEGRATION_ID = 'name' as const
export const INTEGRATION_NAME = 'Display Name'
export const DEFAULT_TTL = 60 // seconds

export const CONFIG_SCHEMA = z.object({ apiKey: z.string().min(1) })
export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface PanelData {
  /* typed panel data for frontend */
}

export async function fetchData(config: IntegrationConfig): Promise<RawData>
export function parsePanel(raw: RawData): PanelData // pure, no async
export function getCacheKey(config: IntegrationConfig): string
export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error'
```

Test file: `tests/unit/backend/integrations/[name].test.ts`
Fixture: `tests/fixtures/mock-responses/[name].json`

Full spec: `docs/06-Development/INTEGRATION-PATTERN.md`

---

## 📊 PROGRESS FILE FORMAT

`docs/05-Plans/PROGRESS.md` — update after every task:

```markdown
Last updated: [ISO timestamp]
Current phase: Phase N
Overall: X% complete

## Phase N

| Task ID | Task | Status         | Branch          | Commit  | Tests | Evidence |
| ------- | ---- | -------------- | --------------- | ------- | ----- | -------- |
| N.1     | name | ✅ Done        | feature/phase-N | abc1234 | ✅    | link     |
| N.2     | name | 🔄 In Progress | feature/phase-N | —       | ⏳    | —        |
```

Icons: ✅ Done · 🔄 In Progress · ⏳ Pending · 🚫 Blocked · ❌ Failed · 🧪 Testing

---

## 🎯 CURRENT-PHASE.md FORMAT

`docs/05-Plans/CURRENT-PHASE.md` — update at start/end of every session:

```markdown
# Current Phase: Phase N — [Name]

Branch: feature/phase-N-[name]
PMF Gate: [condition]

## Active Task

[Task ID] — [name] (started [timestamp])

## Completed This Phase

- [ID] [name] — [commit hash]

## Remaining

- [ID] [name] — [S/M/L]

## Decisions Made

- [decision + rationale]
```

---

## ⚙️ RULES

### Never

- Commit `.env` or any file with real credentials
- Hardcode API keys, secrets, or tokens in source
- Commit code with TypeScript errors
- Merge to `main` without tests passing
- Ask the user a question — decide and document

### Always

- `bun run typecheck` before every commit
- `bun run lint` before every commit
- `bun test` before every PR
- Update `PROGRESS.md` after every task
- Update `CURRENT-PHASE.md` each session
- Write tests before marking ✅ Done
- Handle all integration errors — never crash the dashboard
- All 15 `fetchData()` calls in `Promise.all()` — never sequential

---

## 🎨 DESIGN SYSTEM

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

Key decisions:

- Font: JetBrains Mono everywhere (mono-first identity)
- Accent: #0EA5E9 (sky blue, NOT purple)
- Neutrals: Warm slate (#0C0C14 bg, #161622 cards, #252535 borders)
- Aesthetic: Industrial/utilitarian — control room, not marketing page

---

## 🧩 CONTEXT PROTOCOL

On session start: read `CLAUDE.md` + `CURRENT-PHASE.md` + `PROGRESS.md`

When context fills up:

1. Complete current task
2. Commit with full context in message body
3. Update `PROGRESS.md` + `CURRENT-PHASE.md`
4. Next session: `/resume` uses progress file as source of truth
