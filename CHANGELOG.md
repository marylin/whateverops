# Changelog

All notable changes to WhateverOPS are documented here.
Generated from git history using conventional commits.

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
