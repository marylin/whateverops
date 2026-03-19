# Phase 3.4 — Card Data Overhaul + Founder-First Redesign

<!-- linear: WHA-81 -->

## Summary

Restructure all integration cards around 5 founder questions: making money? anything broken? people using it? burning too much? what needs attention? Fix PostHog (broken — shows zeros), remove Replit (API deprecated), add cross-integration daily digest row, and redesign every card to lead with actionable hero metrics instead of vanity counts.

## Tasks

### Critical Fixes

1. [M] Rewrite PostHog integration — replace stub with Query API (HogQL); fetch DAU, WAU, top 5 events, events today, week-1 retention %; card shows DAU hero metric with 14-day sparkline
2. [S] Remove Replit integration — delete `backend/src/integrations/replit.ts`, panel component, test file, mock fixture; remove from integration-registry; remove from category grouping; update integration count

### Card Hero Metric Restructuring (each card leads with status/action, not counts)

3. [M] Stripe card overhaul — hero: MRR with % change arrow; add disputes endpoint (`GET /v1/disputes`), open invoices (`GET /v1/invoices?status=open`), payouts (`GET /v1/payouts?limit=5`); add `projectedRevenue` (MRR x 12), `arpu` (MRR / active subs), `daysSinceLastNewSub`; alert row for disputes + failed payments
4. [M] Sentry card overhaul — hero: crash-free rate badge (green >99.5%, yellow >99%, red <99%); add `newIssues24h` (firstSeen < 24h), `usersAffected24h`, release correlation via `GET /api/0/organizations/{org}/releases/`; alert for new errors since last deploy
5. [S] Vercel card overhaul — hero: last production deploy status badge (READY/ERROR) with time ago; filter deploys to target=production; surface checks conclusion; alert on failed deploy with error message
6. [S] Railway card overhaul — hero: "All Services Healthy" yes/no badge; add resource metrics via GraphQL `metrics` query (CPU %, memory %); add monthly usage/cost; alert on restart-looping (restartCount > 3) or high memory
7. [S] GitHub card overhaul — hero: CI status badge (last run pass/fail); add `externalPRs` count (PRs from non-owner), `staleIssuesCount` (no activity >30d), `starsTrend` (this week vs last); alert on CI failing, critical Dependabot, external PRs waiting
8. [S] Anthropic card overhaul — hero: "$XX spent this month" with trend arrow; add `projectedMonthlySpend` (daily avg x days remaining), `costTrendPct` (this week vs last), `highestCostModel`; alert when projected > budget or rate limit >90%
9. [S] OpenAI card overhaul — same structure as Anthropic; hero: monthly spend with trend
10. [S] Neon card overhaul — hero: DB status badge (Active/Error); add storage % used vs plan limit, compute hours vs plan, connection count if available; alert on storage >80% or endpoint errors
11. [S] Linear card overhaul — hero: top priority issue title (not count); add `overdueCount`, `blockedCount`, `daysLeftInCycle`, `cycleOnTrack` (ahead/behind/on-track); alert on overdue items or blocked issues
12. [S] Cloudflare card overhaul — hero: zone status badge; compute `error5xxRate` (5xx/total as %); alert on 5xx >1% or elevated threats
13. [S] Resend card overhaul — hero: delivery rate % badge; add `emailsSentToday` vs yesterday comparison; alert on delivery rate <90% or bounce spike
14. [S] Supabase Management card overhaul — hero: project healthy yes/no; alert on read-only mode (critical) or advisor warnings
15. [S] Supabase Auth card overhaul — hero: total users with weekly signup badge (+X this week); add `signupsTrend` (this week vs last), `dauPct` (active/total); alert on zero signups for 3+ days
16. [S] Self-Monitoring card overhaul — hero: system OK + "X/15 integrations healthy" summary; add per-integration error count, avg response time, cache stats via internal metrics

### Dashboard-Level Features

17. [M] Daily Digest row — 5 summary metrics above the card grid: Money (MRR + trend) | Health (X/Y services green) | Users (DAU + trend) | Costs (total AI + infra today) | Attention (N items need you); pulls data from already-fetched integration results
18. [S] Combined AI Costs view — merge Anthropic + OpenAI into single "AI Spend" category or show combined total in digest row; keep individual cards but add combined spend summary

### Cleanup

19. [S] Remove vanity metrics from all cards — audit every PanelData for fields that don't trigger action (projectCount, modelCount, domainCount, keyValid, replCount, etc.); de-emphasize or remove; ensure every visible field answers one of the 5 founder questions
20. [S] Update tests — fix broken tests from Replit removal; update PostHog fixture and tests for new Query API response shape

## Dependencies

- Task 1 (PostHog) and task 2 (Replit removal) are independent, do first
- Tasks 3-16 (card overhauls) are independent of each other, can parallelize
- Task 17 (digest row) depends on tasks 3-16 being done (reads their data)
- Task 18 (AI costs merge) depends on tasks 8+9
- Tasks 19-20 can run last as cleanup

## Open Questions

None — all API endpoints verified in `docs/06-Development/integration-api-audit.md`.
