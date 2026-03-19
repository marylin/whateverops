**WHATEVEROPS**

Product Requirements Document

Full-scope PRD across 6 phases — from first commit to $2K+ MRR. Every business requirement, user story, technical constraint, PMF gate, and acceptance criterion defined.

**Document scope.** This PRD covers all six phases of WhateverOPS from initial build through growth. Each phase has a PMF gate that must pass before proceeding. Business requirements are written as testable acceptance criteria. All technical decisions are constrained to the defined stack: Hono.js (Railway), React + Vite + Tailwind (Vercel), Neon (PostgreSQL), Lucia Auth, Supabase Storage, Resend, n8n automation.

**How to use this document.** Read sequentially through phases. Before starting each phase, verify the PMF gate from the previous phase has been met. Each phase's feature requirements are the minimum to proceed — you may build more, but the listed requirements are the definition of 'done' for that phase. Never start Phase N+1 infrastructure before Phase N PMF gate passes.

# **Product Vision & Strategic Context**

## **Problem Statement**

A solo developer-founder running a SaaS product in 2025 touches 10–15 different dashboards every single day. After a deploy, they check Railway for build status, Vercel for edge function performance, Neon for query health, PostHog for event spikes, Stripe for revenue impact, Resend for email delivery, Linear for linked issues, GitHub for CI status, Anthropic for API cost, and Sentry for new errors. This context-switching costs 30–60 minutes per day and creates a fragmented mental model of product health.

No tool unifies this. Datadog is too expensive and complex. Better Stack monitors infrastructure only. Grafana requires assembly. PostHog is product analytics only. The solo founder's operational reality — deployments + revenue + errors + AI costs + email delivery + code pipeline — has no single view.

## **Solution**

WhateverOPS is a unified ops dashboard for solo developer-founders. It aggregates data from the 15 most common tools in the indie SaaS stack into a single, opinionated, real-time view. Built for one person who runs the entire product. No agents to install. No usage-based billing surprises. API keys only.

## **Primary Persona**

| **Attribute**          | **Definition**                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Who they are           | Solo developer-founder building and running a SaaS product alone. Technical background (mid-to-senior developer). No dedicated DevOps, no team.                                                              |
| Their stack            | Vercel (frontend), Railway (backend), Neon or Supabase (database), Stripe (billing), PostHog (analytics), Resend (email), GitHub (source), Linear (issues), Anthropic/OpenAI (AI features), Sentry (errors). |
| Their daily pain       | 10+ dashboard tabs open after every deploy. No single answer to 'is my product healthy right now?' Mental fatigue from context-switching between tools.                                                      |
| What they value        | Speed to information. Flat predictable pricing. No setup friction. Open source credibility. Built by someone who uses it daily.                                                                              |
| Willingness to pay     | $19–39/month if it saves 30+ min/day. Will self-host free before paying. Lifetime deal at launch if priced right ($99–149).                                                                                  |
| Where they live online | X/Twitter (build-in-public), GitHub, Indie Hackers, HackerNews, r/SideProject, r/SaaS.                                                                                                                       |

## **Competitive Positioning**

WhateverOPS occupies a white space: no direct competitor unifies deployment + revenue + errors + AI costs + email + code pipeline in one dashboard designed for solo founders. Better Stack (closest) monitors infrastructure only. Datadog (largest) is enterprise-only and too expensive. Grafana requires DIY assembly. The positioning is: 'Datadog for one person who builds and runs everything alone — flat pricing, no agents, open source.'

## **Business Model**

| **Revenue stream**            | **Phase**             | **Price**                | **Target**                                        |
| ----------------------------- | --------------------- | ------------------------ | ------------------------------------------------- |
| Open source (self-hosted)     | Phase 3               | Free (MIT)               | Community building, stars, trust                  |
| Hosted free tier              | Phase 4               | Free (3 integrations)    | Acquisition, conversion funnel                    |
| Hobby plan                    | Phase 5               | $19/month                | Solo founders with 1-5 integrations active        |
| Builder plan                  | Phase 5               | $39/month                | Power users with full stack (all 15 integrations) |
| Lifetime deal (launch window) | Phase 5 only, 30 days | $149 one-time            | Cash flow, lifetime ambassadors                   |
| Integration partnerships      | Phase 6               | Revenue share / flat fee | Railway, Vercel, Neon marketplace listings        |

## **PMF Gates — Overview**

**Gate philosophy.** Each PMF gate is binary: it either passes or it doesn't. If a gate doesn't pass within the expected time window, you diagnose with the kill criteria framework before proceeding. Never invest Phase N+1 effort until Phase N gate passes.

| **Gate**                | **Condition**                                                          | **Validates**                                    | **Unlocks**                   |
| ----------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------- |
| Gate 0 — Daily use      | 7 consecutive days of personal daily use                               | You've built something you need yourself         | Phase 2: Make it public       |
| Gate 1 — Pull demand    | 10+ unprompted DMs/GitHub issues asking to try it                      | Real demand outside your own head                | Phase 3: Open source          |
| Gate 2 — Self-hosters   | 20+ known instances running in the wild                                | Installation experience is good enough to deploy | Phase 4: Build hosted version |
| Gate 3 — Retention      | 60%+ weekly active rate among beta users for 2+ consecutive weeks      | Product is sticky, not just interesting          | Phase 5: Add billing          |
| Gate 4 — Disappointment | 40%+ 'very disappointed' on Sean Ellis survey (send at Day 14 of beta) | PMF is real, not imagined                        | Phase 6: Invest in growth     |

**PHASE 0**

**Foundation — Monorepo Setup & Stack Bootstrap**

Timeline: Days 1–2

# **Phase 0: Foundation**

**Goal.** Before writing any integration or dashboard code, establish the full monorepo structure, tooling, deployment pipelines, and CLAUDE.md context file. This investment pays back in Claude Code velocity for all subsequent phases.

## **Business Requirements**

| **ID** | **Requirement**                                                           | **Acceptance Criteria**                                                                                                                                                 | **Priority** |
| ------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-0.1 | Monorepo initialized with clearly separated frontend and backend packages | Running \`pnpm install\` at root installs all dependencies. \`pnpm dev\` starts both frontend and backend concurrently.                                                 | Critical     |
| BR-0.2 | Backend deployable to Railway on every push to main                       | A commit to main auto-deploys backend to Railway. Health endpoint responds 200 within 60 seconds of push.                                                               | Critical     |
| BR-0.3 | Frontend deployable to Vercel on every push to main                       | A commit to main auto-deploys frontend to Vercel. Preview URL generated for every PR.                                                                                   | Critical     |
| BR-0.4 | CLAUDE.md context file in repo root with full stack context               | Claude Code can be started cold in a new session and immediately understand the project structure, conventions, and integration pattern without additional explanation. | Critical     |
| BR-0.5 | Environment variable management defined across dev/staging/prod           | \`.env.example\` documents every required variable. Developer can spin up local environment in < 10 minutes using the setup guide.                                      | Critical     |
| BR-0.6 | GitHub repository public, MIT license, README stub in place               | Repo is publicly accessible. \`git clone\` + \`pnpm install\` + copy \`.env.example\` → \`.env\` → first dashboard load works.                                          | Critical     |
| BR-0.7 | CI pipeline runs on every PR                                              | GitHub Actions runs lint + type check on every PR. Red CI blocks merge (configurable by dev).                                                                           | High         |
| BR-0.8 | n8n instance deployed and accessible                                      | n8n running on Railway, accessible at internal URL. At least one test webhook workflow fires successfully.                                                              | High         |

## **Technical Specifications — Stack**

| **Layer**                 | **Technology**                                       | **Hosting**                | **Config key**                                      |
| ------------------------- | ---------------------------------------------------- | -------------------------- | --------------------------------------------------- |
| Frontend                  | React 18 + Vite + TypeScript + Tailwind CSS 3        | Vercel (Hobby → Pro)       | SPA, no SSR in Phase 0-3                            |
| Backend / API             | Hono.js on Bun runtime                               | Railway (Hobby)            | REST API, all integration data proxied through here |
| Database (Phase 4+)       | Neon PostgreSQL (serverless)                         | Neon                       | Drizzle ORM, migration files committed              |
| Auth (Phase 4+)           | Lucia Auth v3 + Arctic (OAuth providers)             | Railway (same service)     | Session-based, no JWT in cookies                    |
| File storage              | Supabase Storage                                     | Supabase                   | For screenshots, exports, avatars                   |
| Email                     | Resend + React Email                                 | Resend                     | Transactional only in Phase 0-4                     |
| Automation                | n8n (self-hosted)                                    | Railway (separate service) | All webhook-to-post workflows                       |
| Cache                     | In-memory (Phase 0-3) → Redis via Upstash (Phase 4+) | Railway / Upstash          | 60s TTL default per integration                     |
| Payments (Phase 5+)       | Stripe Checkout + Billing + Webhooks                 | Stripe                     | Checkout for new, Portal for manage                 |
| Error tracking (Phase 4+) | Sentry (already supported as integration)            | Sentry free tier           | Also use Sentry to monitor WhateverOPS itself       |

## **CLAUDE.md — Required Contents**

The CLAUDE.md file is the single most important non-code file in the repo. It gives Claude Code full context on every cold start. It must include:

- Project overview: what WhateverOPS is, who it's for, one-sentence purpose
- Full monorepo structure with each directory's role
- The integration pattern: every integration exports exactly fetchData(), parsePanel(), getCacheKey() from /backend/src/integrations/{name}.ts
- Current phase and what's being worked on
- Stack decisions and WHY (e.g., Hono on Railway because Railway supports long-running servers unlike Vercel functions)
- API credential locations and naming conventions
- UI conventions: dark industrial aesthetic, panel grid layout, specific color palette
- What NOT to do: never commit credentials, all API calls proxy through Hono, no direct client-side API calls to third-party services
- Phase 0-completed work, what's currently broken or in-progress

## **Integration Pattern — Standard Contract**

Every integration MUST follow this exact contract for Claude Code consistency across all 15 integrations:

| **Export**        | **Signature**                                | **Returns**                    | **Notes**                                      |
| ----------------- | -------------------------------------------- | ------------------------------ | ---------------------------------------------- | ------------- | ------------------------------- |
| fetchData()       | async (config: IntegrationConfig) => RawData | Raw API response, typed        | Called by cache layer. Never called directly.  |
| parsePanel()      | (rawData: RawData) => PanelData              | Typed panel data for frontend  | Pure function — no async, no side effects      |
| getCacheKey()     | (config: IntegrationConfig) => string        | Unique string cache key        | Used by Redis/in-memory cache. Must be stable. |
| getHealthStatus() | (rawData: RawData) => 'ok'                   | 'warn'                         | 'error'                                        | Health string | Used by header health indicator |
| INTEGRATION_ID    | const string                                 | e.g., 'vercel', 'stripe'       | Used for routing, DB storage, config lookup    |
| INTEGRATION_NAME  | const string                                 | e.g., 'Vercel', 'Stripe'       | Used for display in UI                         |
| CONFIG_SCHEMA     | zod schema                                   | Validates user-supplied config | Checked at connection wizard step              |

**PHASE 1**

**Personal Build — All 15 Integrations, Personal Dashboard Live**

Timeline: Days 3–7 (target)

# **Phase 1: Personal Build**

**Goal.** Build the complete personal dashboard with all 15 integrations running against your real data. No auth, no multi-tenant, no database — just hardcoded personal config and a working dashboard you genuinely use every day. PMF Gate 0 (7 days personal daily use) starts the moment this is live.

| **3–5 days** Target build time | **15** Integrations to ship | **Gate 0** PMF gate | **7-day streak** Gate condition |
| ------------------------------ | --------------------------- | ------------------- | ------------------------------- |

## **Business Requirements**

| **ID** | **Requirement**                                                                                   | **Acceptance Criteria**                                                                                                                                               | **Priority** |
| ------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-1.1 | Dashboard loads and shows live data from all configured integrations within 30 seconds of opening | All panels display real data or a meaningful error state. No panel shows a blank/loading state for > 10 seconds with valid credentials.                               | Critical     |
| BR-1.2 | Each integration has its own panel with the most important 3–5 metrics surfaced                   | Panel is self-explanatory to a developer. Metrics are chosen for daily ops relevance, not completeness.                                                               | Critical     |
| BR-1.3 | Data refreshes every 60 seconds without page reload                                               | In-memory cache TTL = 60s. Visible refresh indicator in each panel. No API rate-limit violations on any integration.                                                  | Critical     |
| BR-1.4 | Error states are visible and actionable                                                           | If an API call fails, the panel shows which integration failed, the HTTP status, and a retry button. It does not show a generic error.                                | Critical     |
| BR-1.5 | Dashboard is visually coherent and 'dark industrial' aesthetic is consistent                      | All 15 panels use the same visual language: dark background, monospace metrics, color-coded status indicators (green/amber/red).                                      | High         |
| BR-1.6 | Mobile-responsive layout for at least 3 breakpoints                                               | Dashboard is usable on laptop, tablet, and mobile. No horizontal scroll on any standard screen size.                                                                  | High         |
| BR-1.7 | Credentials loaded from environment variables only                                                | Zero credentials hardcoded in source. \`.env.example\` documents every required variable. App fails gracefully if any credential is missing.                          | Critical     |
| BR-1.8 | All 15 integrations are functional                                                                | Vercel, Railway, Neon, GitHub, PostHog, Linear, Anthropic, OpenAI, Replit, Supabase (Management + Auth), Resend, Stripe, Sentry, Cloudflare — each returns live data. | Critical     |

## **Integration Requirements — All 15 Panels**

| **Integration**       | **Required metrics**                                                                        | **Panel type**                     | **API / auth method**                     | **Cache TTL** |
| --------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------- | ------------- |
| Vercel                | Latest deployments (state, duration, URL), error rate per function, edge network status     | List + status bar                  | Vercel API token                          | 60s           |
| Railway               | Services status, latest deploy, memory/CPU usage, deploy history (last 5)                   | Grid cards                         | Railway API token                         | 60s           |
| Neon                  | DB connections (active/max), query latency p99, storage used, recent slow queries           | Metrics + trend                    | Neon API key + connection string          | 60s           |
| GitHub                | Open PRs, CI status on main, stars (delta), recent commits (last 3)                         | Activity feed                      | GitHub PAT (read-only)                    | 120s          |
| PostHog               | DAU (7-day trend), active sessions, top events (last 24h), error event count                | Trend line + event list            | PostHog Project API key                   | 300s          |
| Linear                | Open issues (by priority), in-progress count, overdue items, recent updates                 | Kanban summary                     | Linear API key                            | 120s          |
| Anthropic             | API usage (tokens today/month), cost today, cost MTD, model breakdown, rate limit proximity | Cost gauge + model table           | Anthropic API key                         | 300s          |
| OpenAI                | API usage (tokens today/month), cost today, cost MTD, model breakdown                       | Cost gauge + model table           | OpenAI API key                            | 300s          |
| Supabase (Management) | DB health, connection pool, active queries, table sizes                                     | DB metrics panel                   | Supabase management API key               | 120s          |
| Supabase (Auth)       | New signups (24h), active sessions, auth provider breakdown                                 | Auth metrics                       | Supabase service key                      | 300s          |
| Resend                | Emails sent (24h), delivery rate, bounce rate, open rate, recent failures                   | Delivery health                    | Resend API key                            | 300s          |
| Stripe                | MRR (live), new subscriptions (24h), churn (30d), failed payments, ARR projection           | Revenue panel — the killer feature | Stripe secret key (restricted: read-only) | 300s          |
| Sentry                | Error count (24h), new issues (24h), performance score, top error by count                  | Error feed                         | Sentry auth token                         | 120s          |
| Cloudflare            | Requests (24h), bandwidth, WAF blocks, cache hit rate, top blocked IPs                      | Traffic panel                      | Cloudflare API token                      | 300s          |
| Replit                | Running repls, active deployments, compute usage                                            | Deploy status                      | Replit API key                            | 120s          |

## **Phase 1 Non-Requirements (explicitly out of scope)**

- Authentication — no login, no auth. This is personal-use only.
- Database — no persistence. All state is in memory and env vars.
- Multi-user support — single user only in Phase 1.
- Alerts or notifications — no alerting system in Phase 1.
- User-configurable panels — layout is hardcoded in Phase 1.
- Mobile app — web only.
- Deployment documentation — self-hosting guide written in Phase 2, not Phase 1.

## **PMF Gate 0 — Definition of Pass**

**Gate 0 passes when:** You open WhateverOPS first (before any other tab) after a deploy for 7 consecutive days. Not because you're testing it — because it genuinely replaced the 9-tab habit. You stop using the individual dashboards as your first check. This is behavioral, not metric-based.

### **Gate 0 Diagnostic — if not passing after 14 days**

| **Symptom**                               | **Diagnosis**                                                   | **Fix**                                                                            |
| ----------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Still opening individual dashboards first | A panel doesn't show the data you actually care about first     | Audit which tab you open first — that's what's missing in the panel                |
| Dashboard feels slow / laggy              | TTL is too long or API calls are sequential instead of parallel | Make all 15 integration calls parallel (Promise.all). Reduce Neon/PostHog TTL.     |
| One integration keeps erroring            | API credential expired or integration is flaky                  | Add exponential backoff. Show 'last good data' with staleness indicator.           |
| Panel data not meaningful enough          | Too much raw data, not enough insight synthesis                 | Add computed metrics: 'deploy success rate', 'revenue growth rate', 'error trend'. |

**PHASE 2**

**Polish & Launch Prep — OSS-Ready, Automation Live**

Timeline: Week 2–3

# **Phase 2: Polish & Launch Prep**

**Goal.** Gate 0 has passed. You use WhateverOPS daily. Now prepare everything needed for a credible open-source launch: production-grade error handling, self-hosting documentation, n8n automation stack, and a compelling README with a demo GIF. Build the audience before the launch.

| **✓** Gate 0 required | **1–2 weeks** Target duration | **Gate 1** PMF gate | **10 DMs asking to try** Gate condition |
| --------------------- | ----------------------------- | ------------------- | --------------------------------------- |

## **Business Requirements**

| **ID**  | **Requirement**                                                                                          | **Acceptance Criteria**                                                                                                                                           | **Priority** |
| ------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-2.1  | Self-hosting guide is complete and tested by at least one person who isn't you                           | A developer with zero prior WhateverOPS knowledge can go from git clone to running dashboard with real data in < 15 minutes following only the README.            | Critical     |
| BR-2.2  | Demo GIF or video embedded in README shows real dashboard with real data                                 | GIF/video shows all major panels with data visible. No placeholder states. Captures the visual appeal of the 'unified view' in < 30 seconds.                      | Critical     |
| BR-2.3  | All 15 integrations have documented environment variables with explanation and where to find credentials | Each integration has: 1) exact variable name, 2) where to get the value, 3) minimum required permissions, 4) what breaks if missing.                              | Critical     |
| BR-2.4  | n8n automation stack is deployed and running all 5 core workflows                                        | Deploy-to-post, weekly metrics, stars milestone, first payment, and error transparency workflows all successfully complete a test run.                            | Critical     |
| BR-2.5  | Build-in-public social content has begun on X at least 2 weeks before OSS launch                         | At minimum 6 posts published before launch day: 1 teaser, 2 progress updates, 1 technical detail post, 1 'why I built this', 1 'launching OSS next week'.         | High         |
| BR-2.6  | Email approval inbox workflow is tested end-to-end                                                       | A test deploy triggers n8n, Claude Haiku generates a draft, email arrives with Y/N/edit options, approval posts to Buffer queue.                                  | High         |
| BR-2.7  | Integration health indicator visible in dashboard header                                                 | Header shows colored dot per integration: green (fresh data), amber (stale > 2x TTL), red (last call failed). Clicking dots shows last successful call timestamp. | High         |
| BR-2.8  | Graceful degradation when integrations are unavailable                                                   | If Stripe is unreachable, only the Stripe panel shows error. All other panels continue functioning normally. Dashboard does not crash.                            | Critical     |
| BR-2.9  | BetaList and Uneed submissions live                                                                      | Product listing created on both platforms. Email capture form linked from both listings. At least 20 pre-launch email signups collected.                          | Medium       |
| BR-2.10 | Contributing guide written                                                                               | CONTRIBUTING.md explains: how to add a new integration (with template), how to run tests, PR process, code style guide.                                           | Medium       |

## **n8n Automation Requirements — 5 Core Workflows**

| **Workflow ID**            | **Trigger**                                               | **Action chain**                                                                                                                                                                                                                                                    | **Acceptance criteria**                                                                                                    |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| AUTO-1: Deploy-to-post     | Railway webhook on deploy SUCCESS                         | 1\. Fetch commit message + changed files from GitHub API. 2. Send to Claude Haiku with persona prompt. 3. Receive 3 draft posts (technical/founder/question). 4. Email 3 drafts to you. 5. On Y approval: post chosen draft to X via Buffer at next scheduled time. | End-to-end completes in < 3 minutes. Email arrives reliably. Approved posts reach Buffer.                                  |
| AUTO-2: Stars milestone    | n8n cron — hourly GitHub stars check                      | 1\. Compare current stars vs stored milestone map. 2. If milestone crossed (100/250/500/1K/2.5K/5K): generate Claude draft. 3. Email approval. 4. On Y: post immediately.                                                                                           | No duplicate posts. State persists across n8n restarts. All 6 milestones defined.                                          |
| AUTO-3: Weekly metrics     | Monday 8AM cron                                           | 1\. Fetch: GitHub stars (delta), WhateverOPS users (from admin panel), Stripe MRR (delta), PostHog DAU, Resend emails sent. 2. Claude generates weekly post from template. 3. Email approval. 4. On Y: post at 9AM Monday.                                          | All data sources reachable. Template produces a coherent, non-robotic post. Fallback if Stripe not yet connected.          |
| AUTO-4: First payment      | Stripe payment_intent.succeeded webhook — first ever only | 1\. Verify this is the first payment (check state flag). 2. Claude generates celebration post (< 240 chars). 3. Auto-post immediately (no approval needed — this is a once-ever event).                                                                             | Posts only once, ever. Posts within 60 seconds of payment.                                                                 |
| AUTO-5: Error transparency | PostHog error rate spike OR Railway deploy failure        | 1\. Detect: PostHog error event count > threshold OR Railway deploy status = FAILED. 2. Claude generates transparency post (< 200 chars: what happened, what you're doing). 3. Email approval. 4. On Y: post.                                                       | Fires within 5 minutes of event. Email arrives. Never auto-posts without approval (transparency posts need human context). |

## **PMF Gate 1 — Definition of Pass**

**Gate 1 passes when:** 10 or more people have sent you an unprompted DM on X, a GitHub Issue, or a direct message elsewhere asking to try WhateverOPS. The key word is UNPROMPTED — they found it themselves and reached out. This validates real pull demand, not just polite interest from people you know.

**PHASE 3**

**OSS Launch — Public GitHub, Community, Organic Growth**

Timeline: Week 4–6

# **Phase 3: Open Source Launch**

**Goal.** Gate 1 has passed. There is real pull demand. Launch publicly on GitHub + HN Show HN + Indie Hackers + Reddit + Product Hunt in a coordinated single day. Maximize stars, self-hosters, and early user conversations. Gate 2 (20 self-hosters) starts the clock for Phase 4.

| **✓** Gate 1 required | **5** Launch day channels | **Gate 2** PMF gate | **20 self-hosters** Gate target |
| --------------------- | ------------------------- | ------------------- | ------------------------------- |

## **Business Requirements — Pre-Launch (T-7 days)**

| **ID** | **Requirement**                                                 | **Acceptance Criteria**                                                                                                                                               | **Priority** |
| ------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-3.1 | Anchor blog article written and published                       | 'I was tired of 9 tabs — so I built a unified ops dashboard' article. Minimum 1,500 words. Full integration breakdown. Screenshots. Published at whateverops.io/blog. | Critical     |
| BR-3.2 | Product Hunt product page created with all assets               | 90-second demo video, 3 product screenshots, tagline, first comment (maker's comment) drafted. Hunter identified and briefed.                                         | Critical     |
| BR-3.3 | Launch day X post thread drafted and scheduled                  | 5-tweet thread explaining what it is, what problem it solves, link to GitHub and blog, tagging relevant integration accounts (@vercel @railway etc.).                 | Critical     |
| BR-3.4 | HN Show HN post drafted and tested for HN guidelines compliance | Post title follows 'Show HN: WhateverOPS — \[description\]' format. Body is technical, honest, invites feedback. No marketing language.                               | Critical     |
| BR-3.5 | Launch announcement email drafted for pre-launch signups        | Email drafted in Resend/React Email. Subject is clear, body is personal, includes direct GitHub link and 3 reasons to self-host.                                      | High         |
| BR-3.6 | Railway deploy scaled to handle traffic spike                   | Railway service configured with auto-scaling. Load tested for 1,000 concurrent connections. Health endpoint responds in < 200ms under load.                           | High         |

## **Business Requirements — Launch Day**

| **ID**  | **Requirement**                                                                 | **Acceptance Criteria**                                                                                                        | **Priority** |
| ------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| BR-3.7  | GitHub repo goes public at 9AM ET on launch day                                 | Repo visibility changed from private to public. README, license, contributing guide, and self-hosting docs all in final state. | Critical     |
| BR-3.8  | HN Show HN posted at 9AM ET                                                     | Post live on HN. All comments responded to within 4 hours. Engaged personally for full launch day.                             | Critical     |
| BR-3.9  | Product Hunt listing goes live at 12:01 AM PT                                   | Product live on PH at midnight PT for full 24-hour count. Maker's first comment posted immediately.                            | Critical     |
| BR-3.10 | X launch thread posted at 9AM ET                                                | Thread live, all integration accounts tagged, pinned to profile for 24 hours.                                                  | Critical     |
| BR-3.11 | Indie Hackers launch post at 12PM ET                                            | Post published on both IH forum and r/indiehackers. Milestone format. Links to GitHub and blog article.                        | High         |
| BR-3.12 | Reddit posts to r/SideProject and r/webdev at 2PM ET                            | Unique posts per subreddit (not copy-paste). Story-first format. Responding to all comments same day.                          | High         |
| BR-3.13 | Launch email sent to pre-signup list                                            | Email sent to all BetaList/Uneed signups. Open rate > 30% target. At minimum a working self-host guide link is in the email.   | High         |
| BR-3.14 | GitHub Discussions thread 'I got WhateverOPS running — share your setup' posted | Thread live on launch day. Invite self-hosters to share which integrations they connected and what they're monitoring.         | Medium       |

## **Business Requirements — Post-Launch (Week 2–4 of Phase 3)**

| **ID**  | **Requirement**                                       | **Acceptance Criteria**                                                                                                                                    | **Priority** |
| ------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-3.15 | GitHub Issues triaged within 48h of filing            | Every filed issue has a label (bug/feature/integration/question) and a response within 48 hours. Bugs with workarounds get comment + milestone assignment. | Critical     |
| BR-3.16 | Integration health self-monitoring added to dashboard | WhateverOPS monitors its own API uptime as an integration. Status visible on a public status page at status.whateverops.io.                                | High         |
| BR-3.17 | Weekly metrics post goes out every Monday (automated) | AUTO-3 workflow fires every Monday. Post reaches X by 9AM. Metrics reflect real GitHub stars, users, and content growth.                                   | High         |
| BR-3.18 | Stars milestone posts fire correctly                  | AUTO-2 fires correctly at 100, 250 stars. Posts go live within 10 minutes of milestone crossing.                                                           | Medium       |
| BR-3.19 | CHANGELOG.md maintained automatically on releases     | Claude Code generates CHANGELOG entry from git log on every GitHub Release tag. No manual changelog writing.                                               | Medium       |

## **PMF Gate 2 — Definition of Pass**

**Gate 2 passes when:** 20 or more distinct known self-hosted instances are running. Known means: they appeared in GitHub Discussions, filed an Issue, DM'd you, starred the repo AND commented, or you can otherwise verify they're running it. Anonymous star-only counts are not sufficient. This validates that the installation experience is good enough for people to get it running without hand-holding.

### **Gate 2 Diagnostic — tracking self-hosters**

- Ask in GitHub Discussions: 'If you self-hosted WhateverOPS, please drop a comment with which integrations you connected' — this surfaces real users
- Watch GitHub Issues for setup questions — these are self-hosters who hit a problem
- Watch forks — not all forks are self-hosters but it's a proxy metric
- Track the GitHub Discussions 'share your setup' thread you created on launch day

**PHASE 4**

**Hosted Beta — Multi-tenant, Auth, Onboarding, Retention Measurement**

Timeline: Month 2–3

# **Phase 4: Hosted Beta**

**Goal.** Gate 2 has passed. The OSS version works. Now build the hosted multi-tenant SaaS. This is the biggest engineering phase: adding auth, encrypted credential storage, per-user config, onboarding wizard, admin retention panel, and the full beta user experience. Gate 3 (60% WAU retention) is what unlocks billing.

| **✓** Gate 2 required | **30–50** Beta users target | **Gate 3** PMF gate | **60% WAU 2+ weeks** Gate condition |
| --------------------- | --------------------------- | ------------------- | ----------------------------------- |

## **Business Requirements — Auth & Multi-tenancy**

| **ID** | **Requirement**                                                        | **Acceptance Criteria**                                                                                                                                                       | **Priority** |
| ------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-4.1 | User registration via email + password and OAuth (GitHub, Google)      | New user can sign up with email/password or OAuth. Email verification required for email signups. OAuth completes in < 3 clicks.                                              | Critical     |
| BR-4.2 | Session management is secure — no sensitive data in JWT or cookies     | Sessions stored in Neon DB via Lucia Auth. Session cookie is HttpOnly, Secure, SameSite=Lax. No credentials or tokens stored in session.                                      | Critical     |
| BR-4.3 | Each user has a fully isolated dashboard — no data cross-contamination | User A can never see or access any data belonging to User B. Verified by automated test: create 2 users, connect same integration to both, verify API responses are isolated. | Critical     |
| BR-4.4 | Integration credentials encrypted at rest                              | User API keys encrypted with AES-256 before storing in Neon. Decryption key stored in Railway environment, never in DB. Credentials never logged.                             | Critical     |
| BR-4.5 | Password reset via email flow                                          | Forgot password → Resend email with reset link → set new password. Reset links expire in 1 hour and are single-use.                                                           | Critical     |
| BR-4.6 | Account deletion removes all user data including stored credentials    | Delete account → all user rows, credential rows, session rows, and preference rows deleted within 60 seconds. GDPR-compliant.                                                 | High         |

## **Business Requirements — Onboarding & Connection Wizard**

| **ID**  | **Requirement**                                                                                          | **Acceptance Criteria**                                                                                                                                                  | **Priority** |
| ------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| BR-4.7  | Connection wizard for each integration — guides user to credential with no external documentation needed | Wizard shows: step-by-step screenshots for where to find the API key on the integration's own dashboard. Explains required permissions. Tests connection before saving.  | Critical     |
| BR-4.8  | Time-to-first-panel < 10 minutes from signup                                                             | From account creation to first live dashboard panel loading: < 10 minutes following the onboarding wizard. Measured with screen recording of new user flow.              | Critical     |
| BR-4.9  | Empty state for disconnected integrations is actionable, not blank                                       | A panel with no connected integration shows: integration name, what data it will show, a 'Connect \[Integration\]' button that opens the wizard.                         | High         |
| BR-4.10 | Integration connection test runs before saving credentials                                               | Wizard calls integration API with provided credentials before storing. If test fails: shows exact error (invalid key, wrong permissions, rate limited) and suggests fix. | Critical     |
| BR-4.11 | Users can disconnect integrations and credentials are immediately purged                                 | Disconnect button removes encrypted credentials from DB and clears that integration's cache entries. Panel reverts to empty state.                                       | High         |
| BR-4.12 | Onboarding checklist shown until user connects 3+ integrations                                           | On first login, sidebar shows progress bar: 'Connect 3 integrations to see the full picture'. Dismissed after 3 connections or explicit user close.                      | Medium       |

## **Business Requirements — Retention & Admin**

| **ID**  | **Requirement**                                                                       | **Acceptance Criteria**                                                                                                                                                                   | **Priority** |
| ------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-4.13 | Admin panel shows retention metrics in real-time                                      | Admin route (protected) shows: total users, DAU/WAU ratio, integration connection rate, time-to-first-value median, 7-day retention, 30-day retention.                                    | Critical     |
| BR-4.14 | DAU/WAU ratio panel visible in admin at all times                                     | DAU/WAU calculated from login events stored in Neon. Chart shows 30-day trend. Target: > 0.3.                                                                                             | Critical     |
| BR-4.15 | n8n churn warning fires for users inactive > 7 days                                   | AUTO-6 workflow: daily cron checks last_seen in DB. Users inactive 7+ days get re-engagement email via Resend. Email includes one personalized insight from their connected integrations. | High         |
| BR-4.16 | Welcome email sequence fires on signup (Day 0, 3, 7)                                  | AUTO-7: Signup event triggers 3-email sequence. Day 0: welcome + setup guide. Day 3: tip on getting most from Stripe panel. Day 7: 'what's working for you?' ask.                         | High         |
| BR-4.17 | In-app banner triggers when user connects 3+ integrations and has been active 5+ days | Banner: 'WhateverOPS is helping 300+ founders stay on top of their stack. Paid plans launching soon — join the waitlist for 40% off.' Dismissed on close, shown max once.                 | Medium       |
| BR-4.18 | Sean Ellis survey sent to all beta users at Day 14                                    | Day 14 from first login: Resend sends 3-question survey email. Responses stored in Neon. Admin shows % 'very disappointed' in real time.                                                  | Critical     |

## **Business Requirements — Dashboard Features (Phase 4 additions)**

| **ID**  | **Requirement**                                                       | **Acceptance Criteria**                                                                                                                  | **Priority** |
| ------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-4.19 | Panel layout is user-configurable (drag to reorder, hide/show panels) | User can drag panels to reorder. Preferences saved to Neon and restored on next login. 'Reset layout' option available.                  | High         |
| BR-4.20 | Global health indicator in header                                     | Header shows aggregate health: green (all panels ok), amber (1+ warnings), red (1+ errors). Clicking opens health detail modal.          | High         |
| BR-4.21 | Daily digest email option (opt-in)                                    | Users can opt in to a 7AM daily email showing: overnight errors, MRR delta, deploy count, key metric per integration. Powered by Resend. | Medium       |
| BR-4.22 | Dark/light mode toggle with system preference default                 | App respects prefers-color-scheme on first load. Toggle in user settings. Preference saved to Neon.                                      | Medium       |
| BR-4.23 | Keyboard shortcut to refresh all panels                               | Pressing Cmd/Ctrl + R refreshes all panels. Visible shortcut hint in UI.                                                                 | Low          |

## **PMF Gate 3 — Definition of Pass**

**Gate 3 passes when:** 60% or more of your beta users have logged in at least once in the last 7 days for 2 consecutive weeks. This is measured from the admin retention panel. 60% WAU is a strong retention signal for a B2B SaaS tool — it means people made it part of their workflow, not just tried it once.

### **Gate 3 Diagnostic — if retention is stuck below 60%**

| **Retention problem**                                       | **Likely cause**                                             | **Fix**                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users sign up but never connect an integration              | Onboarding wizard too complex or confusing                   | Watch recordings of failed onboarding. Simplify to: 1 integration in 5 minutes. Only show 3 integrations on first session.                                              |
| Users connect integrations but stop logging in after week 1 | Dashboard data not compelling enough after novelty wears off | Survey churned users. Add computed insights: 'Your error rate dropped 20% after last Monday's deploy.' Make the dashboard feel like it's watching so you don't have to. |
| Users log in but for < 30 seconds each visit                | Not enough reason to stay / data density is low              | Add the daily digest email — this creates a habit loop where users come back to investigate something the email surfaced.                                               |
| High dropout on specific panel                              | That panel's data is not actionable enough                   | Identify which panel has highest 'viewed but never opened' rate. Either improve it or move it below the fold.                                                           |

**PHASE 5**

**Paid Launch — Billing, Pricing, Revenue**

Timeline: Month 3–4

# **Phase 5: Paid Launch**

**Goal.** Gate 3 has passed. Retention is real. Now add billing, launch paid plans, run the lifetime deal window for 30 days, and build the revenue engine. Gate 4 (Sean Ellis 40% score) is validated by data collected since Phase 4. If Gate 4 passes, scale confidently. If not, keep iterating.

| **✓** Gate 3 required | **$200–350** Target MRR at launch | **30 days** Lifetime deal window | **Gate 4** PMF gate |
| --------------------- | --------------------------------- | -------------------------------- | ------------------- |

## **Business Requirements — Billing**

| **ID** | **Requirement**                                                                                                       | **Acceptance Criteria**                                                                                                                                                  | **Priority** |
| ------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| BR-5.1 | Stripe Checkout integration for all paid plans                                                                        | User clicks 'Upgrade' → Stripe Checkout opens with correct plan and price. On success, user tier updated in Neon DB within 30 seconds via webhook.                       | Critical     |
| BR-5.2 | Stripe Customer Portal for subscription management                                                                    | Logged-in user can access Stripe Customer Portal to: update card, cancel subscription, view billing history. Accessible from settings.                                   | Critical     |
| BR-5.3 | Plan enforcement: free tier limited to 3 integrations                                                                 | If free user tries to connect 4th integration: shown upgrade modal with plan comparison. Cannot proceed without upgrading.                                               | Critical     |
| BR-5.4 | Stripe webhook events handled: checkout.completed, subscription.updated, subscription.deleted, invoice.payment_failed | Each event handled idempotently (deduped by event ID). User tier updates within 60 seconds of event. Failed payment triggers email sequence.                             | Critical     |
| BR-5.5 | Failed payment recovery automation (AUTO-8)                                                                           | invoice.payment_failed event → n8n → Resend email within 1 hour with payment retry link. If still failed after 3 days, second email. After 7 days, access downgraded.    | High         |
| BR-5.6 | Lifetime deal implementation (30-day window)                                                                          | Lifetime deal purchasable via one-time Stripe payment ($149). On purchase: user flagged as lifetime in DB. Never charged again. Shown in settings as 'Lifetime Builder'. | Critical     |
| BR-5.7 | Cancellation survey automation (AUTO-9)                                                                               | subscription.deleted event → n8n → Resend plain-text email: 'What made you cancel? We read every response.' Responses stored in Neon cancellation_reasons table.         | High         |
| BR-5.8 | MRR displayed in admin panel, updated in real time                                                                    | Admin shows: current MRR, active subscribers by plan, churn rate (30d), new subscribers (7d), LTV projection. Updates within 5 minutes of Stripe webhook.                | High         |
| BR-5.9 | Stripe MRR milestone automation fires correctly (AUTO-10)                                                             | When Stripe MRR crosses $100/$500/$1K/$2K: n8n fires → Claude generates celebration post draft → email approval → post. Never fires twice for same milestone.            | Medium       |

## **Business Requirements — Pricing Page & Plan Comparison**

| **ID**  | **Requirement**                                    | **Acceptance Criteria**                                                                                                                                                                                            | **Priority** |
| ------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| BR-5.10 | Public pricing page at /pricing                    | Shows all three plans: Free, Hobby ($19/mo), Builder ($39/mo), Lifetime ($149 one-time during window). Feature comparison table. FAQ section.                                                                      | Critical     |
| BR-5.11 | Plan feature matrix is accurate and maintained     | Feature matrix matches actual plan enforcement code. If Builder gets a new feature, matrix is updated same sprint. No false advertising.                                                                           | Critical     |
| BR-5.12 | In-app upgrade prompts are contextual, not generic | When free user hits integration limit: 'Connect Stripe for revenue tracking — Builder plan includes all 15 integrations at $39/mo.' When approaching API rate limit: similar. Never shows generic 'upgrade' popup. | High         |
| BR-5.13 | Annual pricing option (20% discount)               | Hobby annual: $182/yr ($15.17/mo equivalent). Builder annual: $374/yr ($31.17/mo equivalent). Shown on pricing page as toggle.                                                                                     | Medium       |

## **Business Requirements — Launch Coordination**

| **ID**  | **Requirement**                                                       | **Acceptance Criteria**                                                                                                                                               | **Priority** |
| ------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-5.14 | Beta users get exclusive 40% lifetime discount before public launch   | All current beta users emailed 3 days before public launch: 'You helped build this. Get 40% off any plan forever — first 72 hours only.' Applied as Stripe coupon.    | Critical     |
| BR-5.15 | Product Hunt second launch (paid product)                             | Full PH launch coordinated for paid launch day. New assets: updated demo video showing billing, pricing page, integration wizard. Maker comment references OSS roots. | High         |
| BR-5.16 | dev.to and Indie Hackers launch post published on paid launch day     | Post: 'WhateverOPS just launched paid plans — here's what changed, what I learned from beta, and the numbers so far.' Transparent with MRR if reasonable.             | High         |
| BR-5.17 | First revenue auto-post fires on first payment (AUTO-4, already live) | AUTO-4 fires on first ever Stripe payment. Celebration post reaches X within 60 seconds.                                                                              | Critical     |

## **PMF Gate 4 — Definition of Pass**

**Gate 4 passes when:** 40% or more of surveyed beta users answer 'Very disappointed' to the Sean Ellis question: 'How would you feel if you could no longer use WhateverOPS?' Survey sent at Day 14 of beta. The 40% threshold is the widely-accepted PMF signal — companies above this threshold consistently grow, below it consistently struggle.

**What if Gate 4 doesn't pass before paid launch?** Paid launch can still proceed if Gate 3 (retention) has passed — retention is a harder signal than survey scores. However: don't invest in paid acquisition, SEO campaigns, or partnerships until Gate 4 passes. Keep iterating on the product based on 'somewhat disappointed' users' feedback.

**PHASE 6**

**Growth — SEO, Partnerships, Scale**

Timeline: Month 4–6+

# **Phase 6: Growth**

**Goal.** Gate 4 has passed. PMF is validated. Now scale what's working: SEO content, integration partnerships (Vercel/Railway/Neon marketplace listings), referral program, and pricing optimization. This phase has no fixed end date — it is the sustainable growth engine.

| **✓** Gate 4 required | **$2K+** Target MRR Month 6 | **15+** SEO articles target | **2–3** Partnerships target |
| --------------------- | --------------------------- | --------------------------- | --------------------------- |

## **Business Requirements — SEO**

| **ID** | **Requirement**                                         | **Acceptance Criteria**                                                                                                                                        | **Priority** |
| ------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-6.1 | One SEO article per integration published (15 total)    | Each article: 1,500+ words, real API examples, published at whateverops.io/blog, cross-posted to dev.to and Hashnode. Targets one primary keyword per article. | Critical     |
| BR-6.2 | Three comparison pages live                             | 'WhateverOPS vs Better Stack', 'WhateverOPS vs Datadog for solo founders', 'Best developer ops dashboard for solopreneurs'. Each targets a high-intent query.  | Critical     |
| BR-6.3 | Blog sitemap submitted to Google Search Console         | All blog URLs indexed in GSC. Core Web Vitals all green. Largest Contentful Paint < 2.5s.                                                                      | High         |
| BR-6.4 | Internal linking between blog articles and landing page | Each integration article links to the pricing page and at least 2 other related articles. Anchor text is descriptive.                                          | Medium       |

## **Business Requirements — Integration Partnerships**

| **ID** | **Requirement**                                                   | **Acceptance Criteria**                                                                                                                                                                                      | **Priority** |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ |
| BR-6.5 | WhateverOPS listed on Railway marketplace                         | Railway has a marketplace/integrations directory. Submit WhateverOPS as a 'deploy alongside Railway' integration. Requires: technical integration (optional one-click deploy template), listing page assets. | High         |
| BR-6.6 | WhateverOPS listed on Vercel marketplace or integration directory | Submit to Vercel integration marketplace. Requires: OAuth app registration (Vercel supports OAuth-based integrations), integration guide, technical review.                                                  | High         |
| BR-6.7 | WhateverOPS listed on Neon ecosystem page                         | Neon has a partner ecosystem page. Submit for listing. Requires: technical integration (Neon connection string works), use case description, logo.                                                           | Medium       |
| BR-6.8 | Co-marketing executed with at least one integration partner       | At least one partner (Railway, Vercel, or Neon) publishes a blog post, tweet, or newsletter mention about WhateverOPS. This constitutes validated co-marketing.                                              | High         |

## **Business Requirements — Referral & Retention**

| **ID**  | **Requirement**                                                        | **Acceptance Criteria**                                                                                                                                       | **Priority** |
| ------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-6.9  | Referral program: give 1 month free, get 1 month free                  | User gets a unique referral link. When referred user converts to paid: both get 1 month free applied as Stripe credit. Tracked in Neon referral_events table. | High         |
| BR-6.10 | Annual plan conversion campaign for monthly subscribers at 90-day mark | Users on monthly plan for 90+ days get email: 'You've saved $X in context-switching time. Upgrade to annual and get 2 months free.' A/B test subject lines.   | Medium       |
| BR-6.11 | Churned user winback sequence at 30 and 90 days post-cancellation      | 30 days after cancel: email with 1 new feature highlight. 90 days: email with 'what's changed' — list 3 improvements since they left.                         | Medium       |

## **Business Requirements — Product Expansion**

| **ID**  | **Requirement**                                                  | **Acceptance Criteria**                                                                                                                                                      | **Priority** |
| ------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| BR-6.12 | Slack / Discord alert integration (user-configurable thresholds) | User can set alert rules: 'If Stripe MRR drops > 10% in 24h, send Slack message'. Alert engine evaluates rules every 5 minutes against cached data.                          | High         |
| BR-6.13 | Mobile-optimized view for core panels                            | Core 5 panels (Stripe, PostHog, GitHub, Railway, errors) display correctly on iPhone SE screen (375px). Not a native app — responsive web.                                   | Medium       |
| BR-6.14 | 'Share ops snapshot' public URL feature                          | User can generate a public URL showing selected panels with anonymized or real data. URL works without login. Powers 'build in public' Twitter/X posts with branded visuals. | High         |
| BR-6.15 | New integration requests tracked and prioritized by demand       | GitHub Discussions 'next integration' thread has automated weekly report: sorted by thumbs-up count. Top-voted integration gets scheduled in next sprint if > 10 votes.      | Medium       |
| BR-6.16 | Monthly public metrics dashboard published                       | Automatically generated public page at whateverops.io/metrics showing: user count, MRR, GitHub stars, integrations supported. Updated monthly via n8n AUTO-11 workflow.      | Medium       |

## **Revenue Projections by Phase — Target vs Minimum**

| **Milestone**              | **Timeline**             | **Paying users** | **Target MRR** | **Minimum viable MRR**              |
| -------------------------- | ------------------------ | ---------------- | -------------- | ----------------------------------- |
| Paid launch                | End of Phase 5 (Month 3) | 10–15            | $200–350       | $100 (validates willingness to pay) |
| Post-lifetime-deal window  | Month 3.5                | 25–40            | $500–750       | $300                                |
| Partnership active         | Month 4                  | 50–70            | $950–1,400     | $600                                |
| SEO + referral compounding | Month 5                  | 80–110           | $1,500–2,200   | $1,000                              |
| Sustainable growth mode    | Month 6                  | 100–150          | $2,000–3,000+  | $1,500                              |

## **Kill Criteria — When to Pause or Pivot**

**If 2+ of these apply: pause and diagnose. If 3+: consider sunsetting, open-sourcing remaining features, and moving on.** 991B1B

| **Kill criterion**                                                          | **What it signals**                                                              | **Investigation first**                                                                                 |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| You personally stop using WhateverOPS daily for 3+ consecutive days         | Product doesn't solve your own problem convincingly enough                       | Which integration is most painful? Fix that first.                                                      |
| Zero self-hosters after 2 weeks of OSS promotion (Gate 2 fails)             | Installation experience is broken or the problem isn't painful enough for others | Watch someone try to self-host live on Zoom. Find the exact step they drop off.                         |
| Beta users are polite but don't log in — 'interesting' is the word they use | Nice-to-have, not must-have. PMF will never come.                                | Ask one honest user: 'Would you cancel your Datadog/Better Stack for this?' If no, find out why.        |
| < 100 GitHub stars after 3 months of genuine promotion                      | Either the product has no visual appeal or the problem isn't widely felt         | Check Uptime Kuma (60K stars). Your product should reach 200+ stars with a great README and HN Show HN. |
| 0 paid conversions after 30 days of beta (before any billing is added)      | No intent to pay = no business, regardless of star count                         | Run 5 user interviews. Ask: 'What would you pay for this? What would make it worth $19/month to you?'   |
