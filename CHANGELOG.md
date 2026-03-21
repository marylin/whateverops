# Changelog

All notable changes to WhateverOPS are documented here.
Generated from git history using conventional commits.

## [0.1.0.0] - 2026-03-20

### Added

- **integrations:** rich panel data for all 15 integrations (GitHub, Linear, Vercel, Railway, PostHog, Resend, Anthropic, OpenAI, Cloudflare, Supabase Auth, Supabase Management, Neon, Sentry, Stripe, self-monitoring)
- **integrations:** multi-instance support — monitor multiple accounts per service (e.g., `GITHUB_PAT_2`)
- **integration-registry:** centralized integration loader with global health computation
- **status page:** public `/status` endpoint with per-integration health
- **settings page:** storage mode selector and integration configuration overview
- **rate limiting:** in-memory sliding window middleware with proper 429 responses
- **crypto:** AES-256-GCM encryption utilities for future credential storage
- **frontend:** 15 custom panel components with staleness indicators
- **frontend:** daily digest, health indicator, error boundary components
- **frontend:** format utilities (timestamps, currency, bytes, percentages)
- **design:** DESIGN.md — mono-first control room aesthetic (JetBrains Mono, sky blue accent)
- **email:** launch announcement React Email template
- **ci:** comprehensive CI pipeline with secret scanning, CodeQL, deploy checks
- **oss:** MIT LICENSE, SECURITY.md, CONTRIBUTING.md, GitHub issue templates
- **oss:** inline self-hosting guide in README (Railway + Vercel)

### Changed

- **dashboard:** founder-first card grouping (What's broken → What shipped → What's growing)
- **panels:** collapsible tall cards, wide layout, health modal from navbar
- **readme:** inline self-hosting content, remove dead docs/ links, update n8n section
- **contributing:** inline integration contract rules, remove external doc references
- **gitignore:** exclude docs/ and n8n/ from OSS repo (local-only)

### Removed

- **replit:** removed Replit integration (API deprecated)
- **n8n workflows:** moved to local-only (not tracked in git)
- **docs/:** internal planning and development docs excluded from OSS repo

### Fixed

- **linear:** auto-detect team when LINEAR_TEAM_ID not set
- **supabase:** fetch all projects, fix health checks, split Management/Auth env vars
- **anthropic:** correct Admin API parameter names
- **email:** remove hardcoded domain, read from RESEND_FROM_EMAIL
- **timeout:** configurable per-integration fetch timeout

### Tests

- unit tests for all 15 integration contracts (parsePanel, getHealthStatus, getCacheKey)
- unit tests for crypto encrypt/decrypt (11 tests)
- unit tests for rate limiter middleware (14 tests)
- unit tests for integration registry (9 tests)
- unit tests for status page health logic
- E2E tests for dashboard and status page flows
- cache integration and webhook endpoint tests

---

## 2026-03-09

### Features

- **n8n:** implement all 5 automation workflows + webhook endpoint (`e800d8e`)
- **frontend:** add per-panel staleness dot with hover tooltip (`3af4995`)
- **cache:** add Upstash Redis cache with memory fallback (`4c08ab7`)
- **backend:** production error handler + Node-compat fixes for Phase 2 (`97be59e`)
- Phase 1 — Personal Dashboard (15 integrations) (#1) (`3e360d8`)

### Tests

- add cache integration and webhook endpoint tests (`e7f1f84`)

### Documentation

- **community:** add GitHub Discussions templates and pinned thread content (`c73305d`)
- **blog:** add anchor launch article for OSS launch day (`e007008`)
- **readme:** polish README for OSS launch — hero, badges, architecture (`4334038`)
- update progress — Phase 2 complete (15/15 tasks) (`445308d`)
- add monitoring setup, self-hosting guide, CONTRIBUTING, and README (`da16888`)

## 2026-03-08

### Tests

- add Bun test runner and health endpoint smoke test (`0dcfe66`)

### Documentation

- update progress — Phase 0 complete (13/13 tasks) (`3f09d5a`)
- initialize all doc directories with README files (`2388dba`)

### Chores

- **infra:** add n8n placeholder workflow JSONs (`495d741`)
- **infra:** add vercel.json for frontend (`b172774`)
- **infra:** add railway.toml for backend (`a7912b7`)
- **lint:** add ESLint + Prettier + lint-staged + husky (`8719093`)
- **ts:** add shared base tsconfig with strict mode (`7dcabe6`)
- **packages:** add shared types package (`1e7c6df`)
- **backend:** scaffold Hono.js on Bun with health endpoint (`68d89f0`)
- **frontend:** scaffold React + Vite + TypeScript + Tailwind v4 (`e28c9e2`)
- init pnpm monorepo with workspace config (`b51b16a`)
- initial project structure with docs and planning (`75e66ec`)

### CI/CD

- update CI pipeline for pnpm monorepo (`65ba8f2`)
