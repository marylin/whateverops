<p align="center">
  <img src="docs/assets/logo.svg" alt="WhateverOPS" width="80" />
</p>

<h1 align="center">WhateverOPS</h1>

<p align="center">
  <strong>Unified ops dashboard for solo developer-founders.</strong><br/>
  15 integrations. One real-time view. Self-host in 5 minutes.
</p>

<p align="center">
  <a href="https://github.com/whateverops-dev/whateverops/actions"><img src="https://img.shields.io/github/actions/workflow/status/whateverops-dev/whateverops/ci.yml?branch=main&label=CI&style=flat-square" alt="CI" /></a>
  <a href="https://github.com/whateverops-dev/whateverops/blob/main/LICENSE"><img src="https://img.shields.io/github/license/whateverops-dev/whateverops?style=flat-square" alt="License" /></a>
  <a href="https://github.com/whateverops-dev/whateverops/stargazers"><img src="https://img.shields.io/github/stars/whateverops-dev/whateverops?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/whateverops-dev/whateverops/issues"><img src="https://img.shields.io/github/issues/whateverops-dev/whateverops?style=flat-square" alt="Issues" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#integrations">Integrations</a> •
  <a href="#self-hosting">Self-Hosting</a> •
  <a href="#contributing">Contributing</a>
</p>

---

<!-- TODO: Replace with actual demo GIF once recorded -->
<!-- ![WhateverOPS Dashboard](docs/assets/demo.gif) -->

## Why WhateverOPS?

You're a solo founder. You have 15 tabs open: Vercel, Railway, Stripe, Sentry, PostHog, GitHub, Linear... You check each one every morning. Some have dashboards, some have email alerts, none of them talk to each other.

WhateverOPS pulls all 15 services into a single, real-time dashboard. One glance tells you if something is broken. One API key per service — no OAuth dance, no hosted SaaS dependency. Self-host it on your own infra and own your data.

## Quick Start

```bash
git clone https://github.com/whateverops-dev/whateverops.git
cd whateverops
pnpm install
cp .env.example .env
# Add at least one API key to .env
pnpm dev
```

**Frontend:** http://localhost:5173 — **Backend:** http://localhost:3000/health

That's it. Add more API keys to `.env` to light up more panels. Each integration is opt-in — only configured services appear on the dashboard.

## Integrations

| Service        | What You See                                        | Badge                                                                                                           |
| -------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **GitHub**     | Stars, open issues, PRs, recent commits             | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)             |
| **Linear**     | Open / in-progress / completed issues, active cycle | ![Linear](https://img.shields.io/badge/Linear-5E6AD2?style=flat-square&logo=linear&logoColor=white)             |
| **Vercel**     | Deployments, projects, success rate                 | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)             |
| **Railway**    | Projects, services, deploy status                   | ![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)          |
| **PostHog**    | Active users, events, feature flags                 | ![PostHog](https://img.shields.io/badge/PostHog-F9BD2B?style=flat-square&logo=posthog&logoColor=black)          |
| **Resend**     | Domains, API keys, email stats                      | ![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square&logoColor=white)                         |
| **Anthropic**  | API key status, available models                    | ![Anthropic](https://img.shields.io/badge/Anthropic-191919?style=flat-square&logoColor=white)                   |
| **OpenAI**     | API key status, available models                    | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)             |
| **Cloudflare** | Requests, bandwidth, cache hit ratio                | ![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white) |
| **Replit**     | Repls, languages                                    | ![Replit](https://img.shields.io/badge/Replit-F26207?style=flat-square&logo=replit&logoColor=white)             |
| **Supabase**   | Project health, database, auth users                | ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)       |
| **Neon**       | Projects, regions, PG versions                      | ![Neon](https://img.shields.io/badge/Neon-00E5A0?style=flat-square&logoColor=black)                             |
| **Sentry**     | Unresolved issues, events, error levels             | ![Sentry](https://img.shields.io/badge/Sentry-362D59?style=flat-square&logo=sentry&logoColor=white)             |
| **Stripe**     | MRR, active subs, failed payments                   | ![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)             |

All 15 integrations are fetched in parallel via `Promise.all()` — no waterfall, no slow dashboards.

## Architecture

```
┌─────────────────────────────────────────────┐
│  React + Vite + Tailwind (Vercel)           │
│  Auto-refresh per panel TTL                 │
│  Staleness indicators (green/amber/red)     │
└──────────────────┬──────────────────────────┘
                   │ REST
┌──────────────────▼──────────────────────────┐
│  Hono.js on Bun (Railway)                   │
│  15 integrations via Promise.all()          │
│  Error retry (2x backoff, 10s timeout)      │
│  Cache: in-memory or Upstash Redis          │
└──────────────────┬──────────────────────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   External    Upstash      n8n
    APIs       Redis       Automations
```

## Self-Hosting

See the full [Self-Hosting Guide](docs/06-Development/SETUP.md) — target: first panel live in under 15 minutes.

**TL;DR:**

1. Deploy backend to [Railway](https://railway.app) (or any Bun/Node host)
2. Deploy frontend to [Vercel](https://vercel.com) (or any static host)
3. Set env vars per service you want to monitor
4. Optional: add Upstash Redis for persistent cache

## Building in Public

WhateverOPS ships with 5 [n8n automation workflows](n8n/workflows/) for building in public:

| Workflow           | Trigger                             | Output                         |
| ------------------ | ----------------------------------- | ------------------------------ |
| Deploy Changelog   | New Vercel deploy                   | Twitter/blog post with changes |
| Stars Milestone    | GitHub stars hit 10/25/50/100…      | Celebration post               |
| Weekly Digest      | Every Monday 9am                    | Metrics summary thread         |
| First Payment      | Stripe `checkout.session.completed` | Auto thank-you post            |
| Error Transparency | Sentry spike detected               | Public incident update         |

## Development

```bash
pnpm install          # install all dependencies
pnpm dev              # frontend + backend concurrently
pnpm typecheck        # TypeScript strict check
pnpm lint             # ESLint
pnpm test             # all tests (unit + integration)
```

### Adding an Integration

Every integration follows a strict contract. See [CONTRIBUTING.md](CONTRIBUTING.md) for the template and the [Integration Pattern docs](docs/06-Development/INTEGRATION-PATTERN.md) for the full spec.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Integration template with full code example
- Required files checklist
- Pull request process

## License

[MIT](LICENSE)
