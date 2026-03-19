# Phase 4.1D — PRD Gap Closure (Phase 4)

## Summary

Closes all remaining Phase 4 PRD gaps: 6 missing features and 3 missing test suites. Phase 2–3 gaps moved to `phase-3.1-prd-gap-closure-plan.md`.

Branch: `feature/phase-4-hosted-beta` (continues current branch)

---

## Tasks

### A. Feature Completion

1. [S] Keyboard shortcut Cmd/Ctrl+R — add `useEffect` keydown listener in Dashboard.tsx; prevent default browser reload; call `onRefresh()`; show "Ctrl+R to refresh" hint near refresh button (BR-4.23)
2. [S] Dark/light mode toggle — add toggle component to header or Settings profile menu; read `preferences.theme` from API on mount; apply Tailwind `dark` class on `<html>` based on value; respect `prefers-color-scheme` when set to "system" (BR-4.22)
3. [S] Panel reorder persistence to Neon — on drag end in Dashboard.tsx, call existing `PUT /api/me/preferences/panel-order` with updated order array; on mount, load order from API response instead of localStorage-only; keep localStorage as offline fallback (BR-4.19)
4. [M] Onboarding checklist — persistent top-bar or sidebar component: "Get started: connect 3 integrations" with progress bar (X/3 connected); visible on dashboard until user connects 3+ or clicks dismiss; dismiss state stored in `preferences` table via existing API (BR-4.12)
5. [M] In-app engagement banner — dismissible top banner on dashboard for users with 3+ integrations AND account created >= 5 days ago: "Paid plans launching soon — join the waitlist for early access."; shown max once; dismiss stored in preferences (BR-4.17)
6. [L] Daily digest email — create React Email template showing overnight errors, MRR delta, deploy count, top metric per connected integration; add "Daily digest" opt-in toggle to NotificationsTab alongside existing weekly toggle; create n8n workflow (or backend cron) to send at 7AM per user timezone; skip users with no integrations connected (BR-4.21)

### B. Missing Tests

7. [M] Auth flow E2E tests — Playwright tests covering: email register → verify email → login → see dashboard; OAuth mock flow (GitHub callback); password reset request → reset → login with new password; invalid credentials return error (BR-4.1, BR-4.5)
8. [M] Multi-tenant isolation tests — integration tests: create 2 users, connect same integration type to both; verify GET `/api/me/dashboard` returns only own panels; GET `/api/me/integrations` returns only own configs; PUT `/api/me/preferences` only affects own record; one user's delete doesn't touch the other (BR-4.3)
9. [S] Account deletion tests — integration test: create user with integrations + preferences + sessions + survey responses + email log entries; call DELETE `/api/me/account`; verify all rows purged from every table; verify audit log entries remain for compliance (BR-4.6)

---

## Dependencies

- Tasks 1–3 (small features) are fully independent — can parallelize
- Tasks 4–5 both use preferences API but are independent of each other
- Task 6 depends on Resend templates (already in codebase) and n8n (already deployed)
- Tasks 7–9 (tests) are fully independent — can parallelize

## Open Questions

None — all requirements traced directly to PRD acceptance criteria.
