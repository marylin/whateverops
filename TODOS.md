# TODOS

## Testing

**Priority:** P2

- Fix Playwright E2E config (test.describe outside suite context)
- Add route handler tests for settings.ts and status.ts

**Priority:** P3

- Add frontend component unit tests (vitest + testing-library)
- Add rate limiter memory cleanup for long-running servers

## Infra

- Update CI workflows to match current branch strategy
- Clean up stale remote branches from merged features

## Completed

- Add unit tests for crypto.ts (encrypt/decrypt round-trip, invalid key, empty string)
- Add unit tests for rate-limit.ts (sliding window, burst, 429 response, cleanup)
- Add unit tests for integration-registry.ts (multi-instance, partial env vars, health computation)
