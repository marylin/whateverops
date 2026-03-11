# Phase 3.1 — OSS Launch Gap Closure

## Summary

Phase 3 was marked complete but several PRD requirements remain unmet — primarily self-monitoring, a public status page, and Railway auto-scaling for launch-day traffic. These must be closed before the hosted beta goes live to ensure operational readiness.

Branch: `feature/phase-3.1-launch-readiness`

---

## Tasks

### A. Self-Monitoring & Status Page (BR-3.16)

1. [M] Self-monitoring integration — add WhateverOPS as its own integration following the standard contract (`fetchData`, `parsePanel`, `getCacheKey`, `getHealthStatus`); poll own `/health` endpoint every 60s; show uptime, response time, and service status in a dashboard panel
2. [M] Public status page — add `/status` frontend route (no auth required); show per-integration health summary with colored dots (green/amber/red) + last-checked timestamps; link from README footer and dashboard header
3. [S] Status page unit tests — test status route renders correctly with mock health data; test health states map to correct colors; test unauthenticated access works

### B. Infrastructure (BR-3.6)

4. [S] Railway auto-scaling config — update `railway.toml` with auto-scaling rules: min 1 / max 3 replicas, scale on CPU > 70% or memory > 80%; document config in `docs/06-Development/MONITORING.md`
5. [S] Load test validation — run existing `scripts/load-test` against auto-scaling config; verify P99 < 5s under 1,000 concurrent connections; save results to `tests/reports/`

### C. Launch Prep Gaps (marketing/ops — tracked for completeness)

6. [S] Demo GIF/video — record dashboard walkthrough with all panels loaded; embed in README replacing placeholder (BR-2.2, carried from Phase 2)
7. [S] Self-hosting guide external validation — have one outside dev follow SETUP.md from git clone to running dashboard; document time-to-run, fix friction (BR-2.1, carried from Phase 2)
8. [S] n8n email-approval workflow E2E verification — trigger AUTO-1 manually, confirm email arrives with Y/N options, confirm approved post queues correctly (BR-2.6, carried from Phase 2)

---

## Dependencies

- Task 1 (self-monitoring) must complete before task 2 (status page consumes its data)
- Task 3 depends on task 2
- Tasks 4–5 are independent of tasks 1–3
- Tasks 6–8 are independent manual/ops tasks

## Open Questions

None — all requirements traced directly to PRD acceptance criteria.
