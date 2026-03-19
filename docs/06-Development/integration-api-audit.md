# Integration API Audit: What We Fetch vs. What's Available

**Date:** 2026-03-18
**Purpose:** Research-only audit of each integration's API surface vs. current usage.
**Goal:** Identify high-value data we're leaving on the table for daily ops monitoring.

---

## 1. GitHub

**Currently fetched:**

- `GET /user/repos` (list repos, sorted by updated)
- `GET /repos/{owner}/{repo}` (repo details)
- `GET /search/issues?type:pr+state:open` (open PR count)
- `GET /repos/{owner}/{repo}/issues` (open issues)
- `GET /repos/{owner}/{repo}/commits` (most recent commit)
- `GET /repos/{owner}/{repo}/actions/runs` (workflow runs)
- `GET /repos/{owner}/{repo}/dependabot/alerts` (security alerts)
- `GET /repos/{owner}/{repo}/traffic/views` (traffic views)
- `GET /repos/{owner}/{repo}/traffic/clones` (traffic clones)
- Per-repo: `GET /repos/{full}/pulls` and `GET /repos/{full}/actions/runs` (activity)

**Currently displayed:**

- Multi-repo list (stars, issues, language, last push, visibility)
- Primary repo stats (stars, issues, PRs, forks, watchers)
- Open issues with labels
- Last commit (sha, message, date, author)
- CI/CD runs (status, conclusion, branch, success rate)
- Dependabot alerts (count, severity, package)
- Traffic (views, unique visitors, clones, unique cloners)
- Per-repo activity summaries (PRs, CI status)

**Available but not used:**

| Endpoint                                              | Data                          | Why useful for ops                                   | Effort |
| ----------------------------------------------------- | ----------------------------- | ---------------------------------------------------- | ------ |
| `GET /repos/{owner}/{repo}/code-scanning/alerts`      | Code scanning (CodeQL) alerts | See security vulns beyond deps -- actual code issues | S      |
| `GET /repos/{owner}/{repo}/secret-scanning/alerts`    | Leaked secrets detected       | Critical security: know if a key leaked in a commit  | S      |
| `GET /repos/{owner}/{repo}/releases`                  | Release history               | Track deploy cadence, see latest release tag/notes   | S      |
| `GET /repos/{owner}/{repo}/actions/runs/{id}/logs`    | Workflow run logs (zip)       | Debug failed CI without leaving dashboard (heavy)    | L      |
| `GET /repos/{owner}/{repo}/traffic/popular/referrers` | Top traffic referrers         | See where visitors come from (HN, Reddit, etc.)      | S      |
| `GET /repos/{owner}/{repo}/traffic/popular/paths`     | Top visited pages             | Know which docs/pages get traffic                    | S      |
| `GET /repos/{owner}/{repo}/environments`              | Deployment environments       | See prod/staging env protection rules                | S      |
| `GET /repos/{owner}/{repo}/deployments`               | Deployment status             | Track deploy state per environment                   | M      |
| `GET /repos/{owner}/{repo}/contributors`              | Contributor stats             | Less useful for solo dev                             | S      |
| `GET /repos/{owner}/{repo}/community/profile`         | Community health metrics      | README, CONTRIBUTING, CODE_OF_CONDUCT presence       | S      |

**Verdict:** **Rich enough for core ops, but missing key security data.** Code scanning and secret scanning alerts are critical gaps. Release tracking and traffic referrers are easy wins.

---

## 2. Vercel

**Currently fetched:**

- `GET /v6/deployments?limit=10` (recent deployments)
- `GET /v9/projects?limit=100` (project list)
- `GET /v9/projects/{id}/domains` (per-project domains)

**Currently displayed:**

- Project count
- Recent deploys (status, commit message, target, build duration, error, checks)
- Success rate
- Domain health (verified, SSL, misconfigured)

**Available but not used:**

| Endpoint                           | Data                                       | Why useful for ops                                    | Effort |
| ---------------------------------- | ------------------------------------------ | ----------------------------------------------------- | ------ |
| `GET /v6/deployments/{id}/events`  | Build logs (streaming or JSON)             | Debug failed deploys without opening Vercel dashboard | M      |
| `GET /v9/projects/{id}/env`        | Environment variables (names only)         | Audit env var config drift between projects           | S      |
| `GET /v1/edge-config/{id}/items`   | Edge Config values                         | Monitor feature flags / config changes                | M      |
| Speed Insights Intake API          | Core Web Vitals (LCP, FID, CLS, TTFB)      | Performance regression detection                      | M      |
| Vercel Drains API                  | Export logs, traces, analytics             | Forward to external monitoring (advanced)             | L      |
| `GET /v6/deployments/{id}/aliases` | Deployment aliases / URLs                  | Track which URLs point to which deploy                | S      |
| `GET /v9/projects/{id}` (detailed) | Project settings, framework, build command | Audit configuration consistency                       | S      |

**Verdict:** **Missing key data.** No Web Analytics or Speed Insights data (though Analytics API is not yet public). Build logs for failed deployments would be the highest-value addition. Core Web Vitals via Speed Insights API is a strong opportunity.

---

## 3. Railway

**Currently fetched:**

- GraphQL: `projects { id, name, services, environments }` (project/service list)
- GraphQL: `deployments(input)` per service (recent deploys)
- GraphQL: `serviceInstance(envId, serviceId)` (instance status, health, replicas, restarts, uptime)

**Currently displayed:**

- Project/service counts
- Recent deploys (status, created, service name)
- Per-service health (deploy status, healthcheck path, replicas, restart count, uptime)
- All-services-healthy aggregate

**Available but not used:**

| Endpoint                               | Data                             | Why useful for ops                            | Effort |
| -------------------------------------- | -------------------------------- | --------------------------------------------- | ------ |
| GraphQL: `metrics(serviceId)`          | CPU, memory, network, disk usage | See resource utilization, detect memory leaks | M      |
| GraphQL: `deploymentLogs`              | Build/runtime logs               | Debug crashes without leaving dashboard       | M      |
| GraphQL: `usage`                       | Billing usage / cost data        | Track Railway spend trends                    | S      |
| GraphQL: `variables(serviceId, envId)` | Env var names (not values)       | Audit config drift                            | S      |
| GraphQL: `observabilityDashboard`      | Alert thresholds, notifications  | Show configured alert rules                   | S      |
| GraphQL: `project.volumes`             | Persistent volume info           | Monitor disk usage for stateful services      | S      |
| GraphQL: `deployment.buildLogs`        | Build output                     | Diagnose build failures                       | M      |
| HTTP request logs (via dashboard API)  | Per-endpoint request logs        | Identify slow endpoints, error rates          | L      |

**Verdict:** **Missing key data.** CPU/memory metrics are the biggest gap -- a service could be OOMing and we'd only know after it crashes and restarts. Usage/cost tracking is an easy win.

---

## 4. Stripe

**Currently fetched:**

- `GET /v1/subscriptions?limit=100&status=all` (all subscriptions)
- `GET /v1/charges?limit=10&created[gte]=30d` (recent charges)
- `GET /v1/balance` (current balance)
- `GET /v1/refunds?limit=25&created[gte]=30d` (recent refunds)
- `GET /v1/balance_transactions?limit=100&type=charge&created[gte]=30d` (net revenue)
- `GET /v1/customers?limit=1` (customer count only)

**Currently displayed:**

- MRR (with interval normalization), MRR delta 30d
- Active subscriptions, new subs 24h, canceled subs 30d
- Failed payments 24h (count + amount)
- Recent charges (amount, currency, status, description)
- Churn rate 30d
- Refund count/amount 30d
- Net revenue 30d
- Customer count

**Available but not used:**

| Endpoint                             | Data                              | Why useful for ops                                       | Effort |
| ------------------------------------ | --------------------------------- | -------------------------------------------------------- | ------ |
| `GET /v1/invoices?status=open`       | Open/unpaid invoices              | Cash flow: see outstanding receivables                   | S      |
| `GET /v1/invoices/upcoming`          | Upcoming invoice amounts          | Forecast next billing cycle revenue                      | S      |
| `GET /v1/disputes?limit=10`          | Active disputes/chargebacks       | Critical: disputes need response within days or you lose | S      |
| `GET /v1/payouts?limit=10`           | Recent payouts to bank            | Track when money actually hits your bank account         | S      |
| `GET /v1/events?type=charge.failed`  | Failed charge events with details | More detail on why payments fail (card declined, etc.)   | S      |
| `GET /v1/products`                   | Product catalog                   | Context for subscription display                         | S      |
| `GET /v1/prices`                     | Price list                        | Show plan names alongside MRR breakdown                  | S      |
| `GET /v1/customers?limit=100` (full) | Customer details, emails          | See who your customers are (solo founder needs this)     | M      |
| `GET /v1/subscription_schedules`     | Upcoming plan changes             | Know about downgrades/upgrades before they happen        | M      |

**Verdict:** **Missing key data.** Disputes/chargebacks are a critical blind spot -- a solo founder could lose a dispute simply by not responding in time. Open invoices and payouts are important for cash flow visibility.

---

## 5. Sentry

**Currently fetched:**

- `GET /api/0/projects/{org}/{project}/issues/?query=is:unresolved&limit=5` (unresolved issues)
- `GET /api/0/projects/{org}/{project}/stats/?stat=received&resolution=1d` (event stats)
- `GET /api/0/organizations/{org}/sessions/?field=crash_free_rate(session)` (crash-free rate)
- `GET /api/0/organizations/{org}/stats_v2/?category=error&interval=1d&statsPeriod=7d` (error trend)

**Currently displayed:**

- Unresolved issue count, events in 24h
- Latest issues (title, culprit, count, level, last seen, user count)
- Crash-free rate
- 7-day error trend with direction indicator

**Available but not used:**

| Endpoint                                                    | Data                          | Why useful for ops                                        | Effort |
| ----------------------------------------------------------- | ----------------------------- | --------------------------------------------------------- | ------ |
| `GET /api/0/organizations/{org}/releases/`                  | Release list with deploy info | Correlate errors to deploys: "errors spiked after v1.2.3" | M      |
| `GET /api/0/projects/{org}/{project}/issues/{id}/events/`   | Events for a specific issue   | See stack traces, user impact per issue                   | M      |
| Performance/transactions API                                | P50/P75/P95 response times    | Detect endpoint performance regressions                   | L      |
| Uptime Monitoring API                                       | URL uptime checks             | Know if your site is down before users tell you           | M      |
| `GET /api/0/organizations/{org}/monitors/`                  | Cron monitors                 | Track scheduled job health (did the cron run?)            | M      |
| Alerts API                                                  | Configured alert rules        | Show which alerts are active/firing                       | S      |
| `GET /api/0/projects/{org}/{project}/stats/?stat=generated` | Rate-limited event count      | Know if you're hitting Sentry quota limits                | S      |

**Verdict:** **Missing key data.** Release correlation is the highest-value gap -- without it, you can't quickly answer "did the last deploy cause this error spike?" Uptime monitoring and cron monitors would add significant value for a solo founder who can't watch everything.

---

## 6. PostHog

**Currently fetched:**

- `GET /api/projects/{id}/feature_flags/?limit=1` (feature flag count only)
- `GET /api/projects/{id}/insights/?limit=1` (insight count only)

**Currently displayed:**

- Active users 24h (hardcoded to 0 -- NOT actually fetched)
- Events today (hardcoded to 0 -- NOT actually fetched)
- Feature flag count
- Insight count

**Available but not used:**

| Endpoint                                         | Data                                           | Why useful for ops                              | Effort |
| ------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------- | ------ |
| `POST /api/projects/{id}/query` (HogQL)          | Any analytics query: events, persons, sessions | This is the key endpoint -- can get everything  | M      |
| `POST /api/projects/{id}/query` (TrendsQuery)    | Event trends over time                         | Daily active users, key event counts            | M      |
| `POST /api/projects/{id}/query` (FunnelsQuery)   | Funnel conversion rates                        | Track signup-to-activation conversion           | M      |
| `POST /api/projects/{id}/query` (RetentionQuery) | User retention cohorts                         | Are users coming back?                          | M      |
| `GET /api/projects/{id}/events/?limit=10`        | Recent raw events                              | See real-time user activity                     | S      |
| `GET /api/projects/{id}/persons/?limit=10`       | Recent persons/users                           | See who's active                                | S      |
| `GET /api/projects/{id}/feature_flags/` (full)   | Feature flag details + status                  | See which flags are on/off, rollout percentages | S      |
| `GET /api/projects/{id}/session_recordings/`     | Session recording list                         | See recent recordings for debugging             | M      |
| `GET /api/projects/{id}/annotations/`            | Annotations (deploy markers, etc.)             | Correlate events to deploys                     | S      |
| Endpoints API                                    | Pre-built query endpoints                      | Expose saved insights as API calls              | M      |

**Verdict:** **Severely underutilized.** This is the weakest integration by far. Active users and events are hardcoded to 0. The PostHog Query API (HogQL) can provide everything a founder needs -- DAU, event trends, funnel metrics, retention -- but none of it is being used. This needs a complete overhaul.

---

## 7. Anthropic

**Currently fetched:**

- `GET /v1/models` (model list + rate limit headers)
- `GET /v1/organizations/cost_report` (30-day daily costs, requires admin key)
- `GET /v1/organizations/usage_report/messages` (7-day usage by model, requires admin key)

**Currently displayed:**

- Key validity, available models, model count
- Rate limits (tokens remaining/limit/%, requests remaining/limit/%)
- 30-day cost (total + daily breakdown)
- Usage by model (input/output/cached tokens)

**Available but not used:**

| Endpoint                            | Data                              | Why useful for ops                                     | Effort |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------ | ------ |
| Admin API: workspace management     | Workspace list, members, API keys | Multi-workspace cost allocation                        | M      |
| Admin API: spend limits             | Workspace spend/rate limits       | See if approaching configured limits                   | S      |
| Usage report: group_by=api_key      | Per-key usage breakdown           | Track which app/service uses most tokens               | S      |
| Usage report: group_by=service_tier | Usage by tier (standard vs batch) | Cost optimization: are you using batch where possible? | S      |
| Cost report: group_by=workspace     | Per-workspace costs               | See which project costs the most                       | S      |

**Verdict:** **Rich enough.** This is one of the best-covered integrations. The admin API provides solid cost/usage data. Minor improvements would be per-key and per-workspace breakdowns for cost attribution.

---

## 8. OpenAI

**Currently fetched:**

- `GET /v1/models` (model list + rate limit headers)
- `GET /v1/organization/costs` (30-day daily costs)
- `GET /v1/organization/usage/completions` (7-day usage by model)

**Currently displayed:**

- Key validity, available models, model count
- Rate limits (tokens remaining/limit/%, requests remaining/limit/%)
- 30-day cost (total + daily breakdown)
- Usage by model (input/output tokens)

**Available but not used:**

| Endpoint                                 | Data                            | Why useful for ops                             | Effort |
| ---------------------------------------- | ------------------------------- | ---------------------------------------------- | ------ |
| `GET /v1/organization/audit_logs`        | Audit log of org actions        | Security: track who changed API keys, settings | M      |
| `GET /v1/organization/usage/embeddings`  | Embedding usage                 | Track embedding costs separately               | S      |
| `GET /v1/organization/usage/images`      | Image generation usage          | Track DALL-E costs                             | S      |
| `GET /v1/organization/usage/audio`       | Audio (Whisper/TTS) usage       | Track audio API costs                          | S      |
| `GET /v1/organization/usage/moderations` | Moderation API usage            | Track moderation volume                        | S      |
| `GET /v1/organization/projects`          | Project list                    | See org structure                              | S      |
| `GET /v1/organization/users`             | Org member list                 | Audit access                                   | S      |
| `GET /v1/organization/invites`           | Pending invites                 | Security: see outstanding access grants        | S      |
| `GET /v1/organization/rate_limits`       | Configured rate limits by model | Know your exact limits per model               | S      |

**Verdict:** **Rich enough.** Similar to Anthropic -- good cost/usage coverage. Adding per-endpoint usage (embeddings, images, audio) would give a fuller cost picture, and audit logs would add security value.

---

## 9. Neon

**Currently fetched:**

- `GET /api/v2/projects` (project list)
- `GET /api/v2/projects/{id}/branches` (branches per project)
- `GET /api/v2/projects/{id}/endpoints` (compute endpoints per project)
- `GET /api/v2/projects/{id}/consumption` (resource consumption per project)

**Currently displayed:**

- Project count, per-project details (region, PG version, updated at)
- Branch count + primary branch
- Endpoint count + status
- Consumption (active time, compute time, storage MB)
- All-endpoints-active health check

**Available but not used:**

| Endpoint                                                  | Data                                       | Why useful for ops                                        | Effort |
| --------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------- | ------ |
| `GET /api/v2/projects/{id}/operations`                    | Operation history (create, suspend, start) | Track endpoint wake/sleep cycles, detect issues           | M      |
| `GET /api/v2/consumption_history/account`                 | Account-level consumption over time        | Track overall Neon spend trends across projects           | S      |
| `GET /api/v2/consumption_history/projects`                | Per-project consumption time series        | Track consumption trends, spot anomalies                  | M      |
| `GET /api/v2/projects/{id}/databases`                     | Database list per branch                   | Show actual database names and sizes                      | S      |
| `GET /api/v2/projects/{id}/roles`                         | Database roles                             | Audit database access                                     | S      |
| Query performance monitoring (pg_stat_statements via SQL) | Slow queries, query frequency              | Identify performance bottlenecks (requires DB connection) | L      |
| `GET /api/v2/projects/{id}/connection_uri`                | Connection details                         | Verify connectivity config                                | S      |

**Verdict:** **Rich enough for basic monitoring.** The consumption data covers the core use case. The biggest gap is consumption history over time (trending) and operation history (to detect flapping endpoints). Query performance monitoring would be the dream feature but requires a DB connection, not just the management API.

---

## 10. Cloudflare

**Currently fetched:**

- `GET /client/v4/zones/{zoneId}` (zone details)
- `GET /client/v4/zones/{zoneId}/analytics/dashboard` (24h analytics)
- `GET /client/v4/zones/{zoneId}/ssl/certificate_packs` (SSL certs)

**Currently displayed:**

- Requests 24h, bandwidth 24h, threats blocked
- Cache hit ratio
- Zone name + status
- SSL status + cert count
- Response status breakdown (2xx/3xx/4xx/5xx)
- Firewall events count

**Available but not used:**

| Endpoint                                              | Data                                      | Why useful for ops                                       | Effort |
| ----------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------- | ------ |
| `GET /client/v4/zones/{zoneId}/dns_records`           | DNS record list                           | Audit DNS config, detect missing records                 | S      |
| `GET /client/v4/accounts/{accountId}/workers/scripts` | Workers list + status                     | Monitor Worker deployments                               | M      |
| Workers Analytics API                                 | Worker invocation count, errors, CPU time | Track Worker health and performance                      | M      |
| DNS Analytics API                                     | DNS query volume, processing time         | Monitor DNS resolution performance                       | M      |
| `GET /client/v4/zones/{zoneId}/firewall/events`       | Detailed firewall events                  | See what's being blocked and why (IPs, rules, countries) | M      |
| `GET /client/v4/accounts/{accountId}/logs/audit`      | Audit logs                                | Security: track config changes                           | M      |
| Speed Test API                                        | Performance scores (like Lighthouse)      | Automated performance monitoring                         | L      |
| `GET /client/v4/zones/{zoneId}/settings`              | Zone settings                             | Audit security settings (always HTTPS, min TLS, etc.)    | S      |
| Page Rules / Redirect Rules                           | Active rules list                         | Verify redirect/rewrite config                           | S      |

**Verdict:** **Missing key data.** If you use Cloudflare Workers, the Workers analytics gap is significant. DNS records audit is an easy security win. Detailed firewall events would help understand attack patterns.

---

## 11. Linear

**Currently fetched:**

- GraphQL: `team(id)` with `activeCycle` (name, progress, dates, issues)
- GraphQL: `team.issues` filtered to backlog state
- GraphQL: `issues` filtered to unstarted/triage state (open)
- GraphQL: `issues` filtered to started state (in-progress)

**Currently displayed:**

- Open issues count, in-progress count
- Completed this cycle, cycle total issues
- Backlog count
- Team name
- Cycle name, progress, start/end dates

**Available but not used:**

| Endpoint                               | Data                                     | Why useful for ops                             | Effort |
| -------------------------------------- | ---------------------------------------- | ---------------------------------------------- | ------ |
| GraphQL: `projects`                    | Project list with status, progress, lead | Track project health across all projects       | M      |
| GraphQL: `initiatives`                 | Strategic initiatives with progress      | High-level roadmap visibility                  | M      |
| GraphQL: `team.cycles` (all)           | Historical cycle data                    | Track velocity trends over time                | M      |
| GraphQL: `issues` with priority filter | High-priority/urgent issues              | Surface urgent items that need attention today | S      |
| GraphQL: `issues` with SLA data        | Issues approaching SLA breach            | Critical for customer-facing teams             | M      |
| GraphQL: `projectUpdates`              | Project status updates                   | See latest project health narratives           | S      |
| GraphQL: `team.members`                | Team member list                         | Context for issue assignment                   | S      |
| GraphQL: `documents`                   | Team documents                           | Quick access to specs and notes                | S      |
| GraphQL: `issue.comments` (recent)     | Recent issue comments                    | See latest discussion without opening Linear   | M      |

**Verdict:** **Missing key data.** For a solo dev-founder, high-priority/urgent issues should be front and center. Project-level tracking would show the bigger picture beyond just the current cycle. Historical cycle velocity would help answer "am I getting faster or slower?"

---

## 12. Resend

**Currently fetched:**

- `GET /domains` (domain list)
- `GET /api-keys` (API key list)
- `GET /emails` (recent emails, up to 50)

**Currently displayed:**

- Domain count + status
- API key count
- Recent emails (to, subject, status, sent date)
- Delivery rate, total sent, bounced count
- Per-domain stats (sent, delivered, bounced, delivery rate, recent emails)

**Available but not used:**

| Endpoint                       | Data                                             | Why useful for ops                                | Effort |
| ------------------------------ | ------------------------------------------------ | ------------------------------------------------- | ------ |
| `GET /audiences`               | Audience list with contact counts                | Track subscriber growth                           | S      |
| `GET /audiences/{id}/contacts` | Contact list with properties                     | See subscriber details                            | S      |
| `GET /broadcasts`              | Broadcast list (campaigns)                       | Track email campaign status                       | S      |
| `POST /broadcasts/{id}/send`   | Send broadcasts                                  | Not for monitoring, skip                          | -      |
| `GET /emails/{id}`             | Individual email details with full event history | Debug delivery issues (bounced, complained, etc.) | S      |
| `GET /domains/{id}/verify`     | Domain verification status details               | Get specific DNS records needed for verification  | S      |

**Verdict:** **Rich enough.** Email delivery monitoring is solid with per-domain stats. The main gap is audience/contact tracking (subscriber growth) and broadcast campaign visibility, but these are less "daily ops" and more "marketing ops."

---

## 13. Supabase Management

**Currently fetched:**

- `GET /v1/projects` or `GET /v1/projects/{ref}` (project list/detail)
- `GET /v1/projects/{ref}/health` (health checks)
- `GET /v1/projects/{ref}/readonly` (read-only mode check)
- `GET /v1/projects/{ref}/advisors/performance` (performance advisors)

**Currently displayed:**

- Project count + per-project details (name, status, region, DB version)
- Health checks (name, status, healthy count)
- Read-only mode flag
- Performance advisors (reason, type)

**Available but not used:**

| Endpoint                                          | Data                                          | Why useful for ops                                    | Effort |
| ------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------- | ------ |
| `GET /v1/projects/{ref}/functions`                | Edge Function list                            | See deployed functions                                | S      |
| `GET /v1/projects/{ref}/functions/{slug}`         | Edge Function details (status, version)       | Monitor function health                               | S      |
| `POST /v1/projects/{ref}/database/query`          | Execute SQL (read-only)                       | Run pg_stat_statements, table sizes, connection count | L      |
| Log query endpoints                               | Postgres logs, Edge Function logs, Auth logs  | Debug issues across all Supabase services             | M      |
| `GET /v1/projects/{ref}/config/database/postgres` | Postgres config                               | Audit DB configuration                                | S      |
| Billing/usage endpoints                           | Storage size, bandwidth, function invocations | Track Supabase spend and usage                        | M      |
| `GET /v1/projects/{ref}/storage/buckets`          | Storage bucket list                           | Monitor storage usage                                 | S      |
| `GET /v1/projects/{ref}/secrets`                  | Secret names (not values)                     | Audit configured secrets                              | S      |
| `GET /v1/projects/{ref}/pgsodium`                 | Encryption config                             | Security audit                                        | S      |

**Verdict:** **Missing key data.** Edge Function monitoring is a significant gap if you use them. Database query capability (even just connection count and table sizes) would provide much deeper DB health visibility. Usage/billing data would help track spend.

---

## 14. Supabase Auth

**Currently fetched:**

- `GET /auth/v1/admin/users?per_page=50` (user list with x-total-count header)

**Currently displayed:**

- Total user count
- Recent signups (7-day)
- Active recently (24h sign-ins)
- Provider breakdown (email, Google, GitHub, etc.)

**Available but not used:**

| Endpoint                                     | Data                                      | Why useful for ops                                   | Effort |
| -------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- | ------ |
| `GET /auth/v1/admin/users/{id}`              | Individual user details                   | Debug specific user auth issues                      | S      |
| `GET /auth/v1/admin/users/{id}/factors`      | MFA factors for a user                    | Audit MFA adoption                                   | M      |
| Auth audit logs (via Supabase dashboard/SQL) | Login attempts, failures, password resets | Security: detect brute force attacks, auth anomalies | L      |
| Session management API                       | Active sessions per user                  | See concurrent sessions, force logout if needed      | M      |
| `GET /auth/v1/admin/generate_link`           | Magic link generation                     | Not for monitoring, skip                             | -      |
| Management API: auth config                  | Auth provider settings                    | Audit which providers are enabled                    | S      |

**Verdict:** **Rich enough for basic auth ops.** The user count, signup rate, and provider breakdown cover the essentials. The biggest gap is auth audit logging (failed logins, suspicious activity), which would be critical security data. However, that requires the Supabase logs API rather than the auth admin API directly.

---

## 15. Replit

**Currently fetched:**

- GraphQL: `currentUser { repls(limit: 10) { items { id title language timeUpdated isPrivate } } }` (repl list)

**Currently displayed:**

- Key validity
- Repl count
- Recent repls (title, language, last updated)

**Available but not used:**

| Endpoint                     | Data                               | Why useful for ops             | Effort |
| ---------------------------- | ---------------------------------- | ------------------------------ | ------ |
| GraphQL: `repl.hosting`      | Hosting/deployment status          | See if deployed repls are live | M      |
| GraphQL: `repl.analytics`    | Repl usage analytics (views, runs) | Track repl popularity/usage    | M      |
| GraphQL: `repl.files`        | File listing                       | Not useful for ops, skip       | -      |
| GraphQL: `currentUser.teams` | Team info                          | Not relevant for solo dev      | -      |
| GraphQL: `repl.multiplayers` | Active collaborators               | Not useful for ops monitoring  | -      |

**Verdict:** **Severely underutilized, but limited API.** Replit's API is not well-documented publicly and relies on cookie-based auth (fragile). The key gaps are deployment/hosting status and analytics. However, Replit's API stability is questionable -- this integration may always be the weakest link. If Replit is primarily used for prototyping rather than production, the current coverage may be sufficient.

---

## 16. Self-Monitoring (WhateverOPS)

**Currently fetched:**

- `GET {healthUrl}` (health endpoint with response time measurement)

**Currently displayed:**

- Status (ok/error)
- Uptime (formatted)
- Last checked timestamp
- Response time (ms)

**Available but not used:**

| Endpoint                                     | Data                                         | Why useful for ops                                 | Effort |
| -------------------------------------------- | -------------------------------------------- | -------------------------------------------------- | ------ |
| Internal: integration status aggregation     | Per-integration last-fetch time, error count | "Meta-monitoring": which integrations are failing? | M      |
| Internal: cache hit/miss rates               | Cache performance metrics                    | Optimize refresh intervals                         | M      |
| Internal: API response times per integration | Latency per data source                      | Detect slow integrations                           | M      |
| Internal: error log tail                     | Recent errors from the backend               | Quick debugging without SSH                        | M      |
| Internal: memory/CPU (process.memoryUsage)   | Backend resource usage                       | Detect memory leaks in the dashboard itself        | S      |
| Internal: uptime history                     | Historical uptime data points                | Show uptime trend graph, not just current status   | M      |

**Verdict:** **Missing key data.** The self-monitoring integration only checks if the health endpoint responds. It should also surface meta-health: which integrations are currently failing, cache stats, and per-integration latency. This is the "ops dashboard for the ops dashboard."

---

## Summary: Priority Matrix

### Critical gaps (fix first)

1. **PostHog** -- Severely underutilized. Active users and events are hardcoded to 0. Needs Query API (HogQL) integration for DAU, event trends, basic analytics.
2. **Stripe disputes** -- A missed dispute can cost real money. Add `GET /v1/disputes` immediately.
3. **Sentry releases** -- Can't correlate errors to deploys. Add release tracking.
4. **Railway metrics** -- No CPU/memory visibility. Services could be resource-starved.

### High-value easy wins (small effort, big impact)

5. **GitHub code scanning + secret scanning alerts** -- Critical security data, simple GET endpoints.
6. **GitHub traffic referrers + popular paths** -- Useful for OSS/marketing visibility.
7. **Stripe open invoices + payouts** -- Cash flow visibility.
8. **Linear high-priority issues** -- Surface urgent work.
9. **Neon consumption history** -- Trending data for cost tracking.
10. **Cloudflare DNS records** -- Security audit.

### Nice-to-have (Phase 2+)

11. Vercel build logs for failed deploys
12. Sentry uptime monitoring + cron monitors
13. OpenAI per-endpoint usage breakdown
14. Supabase Edge Function monitoring
15. Supabase auth audit logs
16. Cloudflare Workers analytics
17. Self-monitoring meta-health enrichment
18. Linear project + initiative tracking
19. Replit deployment status (if API stabilizes)
20. GitHub releases + deployments
