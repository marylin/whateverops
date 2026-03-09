# Phase 3 — OSS Launch

Timeline: Weeks 4–6
Gate required: Gate 1 (10+ requests)
Branch: `feature/phase-3-oss-launch`
Gate: Gate 2 — 20 confirmed self-hosted instances

## Pre-Launch (T-7 days)
- **3.1** README final: hero GIF, 5-min setup, integration badges
- **3.2** Anchor article published to whateverops.io/blog
- **3.3** GitHub Discussions enabled + 3 pinned threads
- **3.4** CHANGELOG auto-gen: `scripts/generate-changelog.ts` from git log
- **3.5** Railway always-on: `RAILWAY_RUN_AS_SERVICE=true`, disable sleep
- **3.6** Issue auto-labeler GitHub Action (bug/feature/integration/question)

## Launch Day
- **3.7** Repo goes public
- **3.8** Launch email via Resend to BetaList/Uneed list

## Testing
- **3.7** Load test: `scripts/load-test.ts` — 1000 concurrent, P99 < 5s
- **3.8** E2E Playwright: full dashboard load with all APIs mocked

## Acceptance Criteria
- [ ] Repo public, README final, all docs clean
- [ ] CI green on public repo
- [ ] Load test: 1000 concurrent, P99 < 5s
- [ ] E2E tests passing
- [ ] CHANGELOG auto-generation working
- [ ] Self-hoster log started: `docs/08-Feedback/SELF-HOSTERS.md`
