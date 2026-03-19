# PRD Gap Analysis — Phases 0–4 vs What's Built

## Summary

Cross-referenced all PRD business requirements (BR-0.x through BR-4.x) against the codebase and progress files. Phases 0–1 are fully met. Phases 2–3 have minor gaps (mostly marketing/ops tasks, not code). Phase 4 has 8 code gaps and 3 testing gaps that should be closed before moving to Phase 5.

---

## Phase 0 — Foundation

**Status: FULLY MET** — All 8 BR-0.x requirements satisfied.

No gaps.

---

## Phase 1 — Personal Dashboard

**Status: FULLY MET** — All 8 BR-1.x requirements satisfied.

No gaps.

---

## Phase 2 — Polish & Launch Prep

**Status: CODE COMPLETE, minor ops gaps**

| BR ID  | Requirement                              | Status | Gap                                                       |
| ------ | ---------------------------------------- | ------ | --------------------------------------------------------- |
| BR-2.1 | Self-hosting guide tested by outsider    | ⚠️     | SETUP.md exists but no verified external test documented  |
| BR-2.2 | Demo GIF/video in README                 | ⚠️     | Script exists but no actual GIF/video generated yet       |
| BR-2.5 | Build-in-public social content (6 posts) | ❌     | Marketing task — not code, but PRD requires it pre-launch |
| BR-2.6 | Email approval inbox workflow E2E        | ⚠️     | n8n workflow JSON exists; E2E test not verified           |
| BR-2.9 | BetaList/Uneed submissions               | ❌     | Marketing task — no submissions tracked                   |

**Code tasks: 0 — All gaps are ops/marketing, not engineering.**

---

## Phase 3 — OSS Launch

**Status: CODE COMPLETE, marketing/ops gaps**

| BR ID   | Requirement                            | Status | Gap                                                     |
| ------- | -------------------------------------- | ------ | ------------------------------------------------------- |
| BR-3.1  | Anchor blog article published          | ❌     | Marketing — draft exists but not published              |
| BR-3.2  | Product Hunt page with assets          | ❌     | Marketing — not created                                 |
| BR-3.3  | Launch day X thread                    | ❌     | Marketing — not drafted                                 |
| BR-3.4  | HN Show HN post                        | ❌     | Marketing — not drafted                                 |
| BR-3.5  | Launch email for pre-signups           | ❌     | Marketing — no signups collected yet                    |
| BR-3.6  | Railway auto-scaling for traffic spike | ⚠️     | numReplicas=1 set, no auto-scale config                 |
| BR-3.7  | Repo goes public                       | ❌     | Ops — repo still private                                |
| BR-3.16 | Self-monitoring + public status page   | ❌     | Code gap — no status.whateverops.io, no self-monitoring |

**Code tasks: 2 (auto-scaling config + self-monitoring/status page).**

---

## Phase 4 — Hosted Beta

**Status: Core complete, 8 feature gaps + 3 testing gaps**

### Feature Gaps

| BR ID   | Requirement                                                | Status | Gap Detail                                                                                             | Size |
| ------- | ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ | ---- |
| BR-4.12 | Onboarding checklist shown until 3+ integrations connected | ❌     | No checklist component exists. Setup wizard is separate, not a persistent tracker                      | M    |
| BR-4.17 | In-app banner for 3+ integrations active 5+ days           | ❌     | No banner component. No logic tracking signup age + integration count                                  | M    |
| BR-4.19 | Panel reorder persisted to Neon (not just localStorage)    | ⚠️     | Drag-drop works via localStorage. Backend PUT endpoint exists but frontend doesn't call it on drag end | S    |
| BR-4.21 | Daily digest email (opt-in, 7AM)                           | ❌     | PRD says "daily", UI has "weekly" preference toggle. No n8n workflow sends either. No email template   | L    |
| BR-4.22 | Dark/light mode toggle with system preference default      | ⚠️     | Backend stores theme pref (dark/light/system). No frontend toggle UI. App hardcoded dark               | S    |
| BR-4.23 | Keyboard shortcut Cmd/Ctrl+R to refresh all panels         | ❌     | No keyboard event listener. Refresh button exists but no shortcut                                      | S    |
| BR-4.20 | Global health indicator click → detail modal               | ✅     | Implemented — noting for completeness                                                                  | —    |
| BR-4.9  | Empty state actionable with "Connect" CTA                  | ✅     | Implemented via inline connect in IntegrationsTab                                                      | —    |

### Testing Gaps

| Gap                          | Severity | Detail                                                                            | Size |
| ---------------------------- | -------- | --------------------------------------------------------------------------------- | ---- |
| Auth flow E2E tests          | High     | No E2E tests for register → verify → login → OAuth flows                          | M    |
| Multi-tenant isolation tests | Critical | No tests proving User A can't access User B's data via any API endpoint           | M    |
| Account deletion tests       | High     | Backend DELETE endpoint exists, no tests verify all rows purged across all tables | S    |

---

## Tasks — Phase 4 Completion (code gaps only)

### A. Missing Features

1. [S] Keyboard shortcut — add `useEffect` in Dashboard.tsx listening for Cmd/Ctrl+R → call `onRefresh()`; show hint in UI near refresh button
2. [S] Dark/light mode toggle — add theme toggle to Settings header or profile menu; read `preferences.theme` from API; apply Tailwind dark class based on value (dark/light/system); respect `prefers-color-scheme` for system
3. [S] Panel reorder persistence to Neon — on drag end in Dashboard.tsx, call `PUT /api/me/preferences/panel-order` with new order; load order from API on mount instead of only localStorage
4. [M] Onboarding checklist — sidebar or top-bar progress component: "Connect 3 integrations to unlock the full dashboard" with progress bar (X/3); show until user connects 3+ or explicitly dismisses; dismiss state stored in preferences
5. [M] In-app engagement banner — when user has 3+ integrations AND account age >= 5 days, show dismissible top banner: "WhateverOPS is helping founders stay on top of their stack. Paid plans launching soon." Show max once, dismiss stored in preferences
6. [L] Daily digest email — create React Email template (overnight errors, MRR delta, deploy count, key metrics); add opt-in toggle to NotificationsTab (rename or add alongside weekly); create n8n workflow or backend cron job to send at 7AM per user timezone

### B. Missing Tests

7. [M] Auth E2E tests — Playwright tests: email register → verify → login → see dashboard; OAuth mock flow; password reset flow; invalid credentials rejected
8. [M] Multi-tenant isolation tests — create 2 test users, connect same integration to both, verify: GET /api/me/dashboard returns only own data; GET /api/me/integrations returns only own; PUT /api/me/preferences only affects own; DELETE /api/me/account only purges own rows
9. [S] Account deletion tests — call DELETE /api/me/account, verify: user row gone, sessions cleared, integrations purged, preferences purged, survey responses purged, email log purged, audit log entries remain (for compliance)

### C. Phase 3 Code Gaps (optional — can defer to pre-launch)

10. [M] Self-monitoring integration — WhateverOPS checks its own /health endpoint as an integration; results visible in dashboard
11. [M] Public status page — simple /status route showing integration health summary; could be static page updated by n8n cron

---

## Dependencies

- Tasks 1–3 are independent (can be parallelized)
- Tasks 4–5 are independent of each other but both need preferences API (already exists)
- Task 6 depends on Resend email templates (already in codebase)
- Tasks 7–9 are independent test tasks (can be parallelized)
- Tasks 10–11 are optional Phase 3 gaps, independent of Phase 4 work

## Open Questions

None — all requirements are clearly defined in the PRD. The gaps are straightforward implementations.
