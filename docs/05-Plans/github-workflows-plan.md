# GitHub Workflows & Actions Plan

## Summary

Add the missing CI/CD workflows and GitHub automation that a production-quality OSS project needs. The repo already has `ci.yml` (lint/typecheck/test/audit/e2e) and `auto-label.yml` (issue labeling). This plan fills the gaps: dependency management, release automation, Docker self-hosting, PR labeling, stale issue cleanup, and security scanning.

## Tasks

### Dependency Management

1. [S] Add `.github/dependabot.yml` — weekly pnpm updates for root + frontend + backend, grouped by ecosystem, auto-label `dependencies`
2. [S] Add `.github/workflows/dependabot-auto-merge.yml` — auto-merge patch/minor Dependabot PRs after CI passes (require `quality` check green)

### Release Automation

3. [M] Add `.github/workflows/release.yml` — on tag push (`v*`): build frontend + backend, generate changelog from conventional commits (`scripts/generate-changelog.ts`), create GitHub Release with assets and changelog body
4. [S] Add `.github/workflows/docker-publish.yml` — on release published: build multi-arch Docker image (backend), push to GHCR (`ghcr.io/whateverops-dev/whateverops`)
5. [M] Create `Dockerfile` + `docker-compose.yml` — single-container backend (Bun runtime) + compose with frontend nginx, for self-hosters who prefer Docker over Railway/Vercel

### PR Automation

6. [S] Add `.github/workflows/pr-labeler.yml` — auto-label PRs by changed paths: `frontend/**` → `frontend`, `backend/**` → `backend`, `tests/**` → `tests`, `docs/**` → `documentation`, `packages/**` → `shared-types`
7. [S] Add PR labels to `.github/labels.yml` — `frontend`, `backend`, `tests`, `shared-types`, `dependencies`, `release`, `size/S`, `size/M`, `size/L`
8. [S] Add `.github/workflows/pr-size.yml` — label PRs by diff size: S (<100 lines), M (100-500), L (500+) to encourage small PRs

### Community Management

9. [S] Add `.github/workflows/stale.yml` — mark issues stale after 30 days of inactivity, close after 7 more days, exempt `bug` + `enhancement` + `good first issue` labels
10. [S] Add `.github/workflows/welcome.yml` — greet first-time contributors on their first issue/PR with setup links and contribution guide

### Security

11. [S] Add `.github/workflows/codeql.yml` — weekly CodeQL analysis for JavaScript/TypeScript, also runs on PRs to main
12. [S] Enhance `ci.yml` secret scan — add patterns for common JWT secrets, Supabase keys (`sbp_`), Neon connection strings, Upstash tokens

### Deployment Checks

13. [S] Add `.github/workflows/deploy-check.yml` — on push to `main`: hit Railway health endpoint, post result as commit status (smoke test after merge)

## Dependencies

- Task 5 (Dockerfile) must complete before task 4 (docker-publish) can be tested
- Task 7 (labels) should complete before task 6 (pr-labeler) to ensure labels exist
- All other tasks are independent

## Open Questions

1. **Docker strategy**: Single image with both frontend+backend, or separate images? I'm leaning single image with nginx reverse proxy for simplicity — self-hosters run one container. Want to confirm this direction.
2. **GHCR vs Docker Hub**: Plan uses GHCR (free for public repos, no rate limits for authenticated pulls). Is Docker Hub also needed for discoverability?
3. **Release cadence**: Should releases be manual (push tag) or automated (e.g., on merge to main with conventional commit analysis)? Plan assumes manual tag push — simple and explicit.
