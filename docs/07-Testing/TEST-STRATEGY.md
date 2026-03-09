# Test Strategy

## Layers

| Layer | Location | Runner | Runs on |
|-------|----------|--------|---------|
| Unit | `tests/unit/` | `bun test` | Pre-commit + CI |
| Integration | `tests/integration/` | `bun test` | CI (every PR) |
| E2E | `tests/e2e/` | Playwright | CI (PRs to main/staging) |
| Security | CI step | `bun audit` + grep | CI (every PR) |
| Load | `scripts/load-test.ts` | custom | Before Phase 3 launch |

## Coverage requirements
- Every `fetchData()` — at minimum one mock-response test
- Every `parsePanel()` — 100% branch coverage
- Every `getHealthStatus()` — ok/warn/error states tested
- Every auth route (Phase 4+) — E2E test
- Every billing webhook (Phase 5+) — integration test

## Naming convention
Test files mirror source files:
```
backend/src/integrations/stripe.ts
  → tests/unit/backend/integrations/stripe.test.ts

frontend/src/components/panels/StripePanel.tsx
  → tests/unit/frontend/components/StripePanel.test.tsx

tests/e2e/flows/auth-signup.spec.ts
tests/e2e/flows/dashboard-load.spec.ts
tests/e2e/flows/billing-checkout.spec.ts
```

## Fixture format
`tests/fixtures/mock-responses/[integration].json`:
```json
{ "ok": {}, "error": {}, "empty": {} }
```

## Reports
Auto-saved to `tests/reports/[type]-[YYYY-MM-DD].md` after every `/test` command.
Reports are in `.gitignore` — never committed.
