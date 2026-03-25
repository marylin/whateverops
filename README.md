<p align="center">
  <img src="frontend/public/logo.svg" alt="WhateverOPS" width="80" />
</p>

<h1 align="center">WhateverOPS</h1>

<p align="center">
  <strong>Unified ops dashboard for solo developer-founders.</strong><br/>
  14 integrations. One real-time view. Self-host in 5 minutes.
</p>

<p align="center">
  <a href="https://github.com/whateverops-dev/whateverops/actions"><img src="https://img.shields.io/github/actions/workflow/status/whateverops-dev/whateverops/ci.yml?branch=master&label=CI&style=flat-square" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
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
| **Supabase**   | Project health, database, auth users                | ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)       |
| **Neon**       | Projects, regions, PG versions                      | ![Neon](https://img.shields.io/badge/Neon-00E5A0?style=flat-square&logoColor=black)                             |
| **Sentry**     | Unresolved issues, events, error levels             | ![Sentry](https://img.shields.io/badge/Sentry-362D59?style=flat-square&logo=sentry&logoColor=white)             |
| **Stripe**     | MRR, active subs, failed payments                   | ![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)             |

All 14 integrations are fetched in parallel via `Promise.all()` — no waterfall, no slow dashboards.

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
│  14 integrations via Promise.all()          │
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

Target: first panel showing real data in under 15 minutes.

### Prerequisites

- Bun >= 1.0 (or Node.js >= 18)
- pnpm >= 8
- Git

### Deploy Backend (Railway)

1. Install Railway CLI: `npm i -g @railway/cli && railway login`
2. Create project: `railway init && railway add`
3. Set env vars: `railway variables set PORT=3000 CACHE_BACKEND=memory`
4. Add integration API keys (see `.env.example`)
5. Deploy: `railway up`

**Optional:** Add [Upstash Redis](https://console.upstash.com) for persistent cache:
`railway variables set CACHE_BACKEND=redis UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=...`

### Deploy Frontend (Vercel)

1. Install Vercel CLI: `npm i -g vercel && vercel login`
2. Deploy: `cd frontend && vercel`
3. Set API URL: `vercel env add VITE_API_URL` (enter your Railway backend URL)

### Troubleshooting

| Problem              | Cause                              | Fix                                          |
| -------------------- | ---------------------------------- | -------------------------------------------- |
| No panels showing    | No API keys configured             | Add at least one key to `.env`               |
| CORS errors          | `FRONTEND_URL` mismatch            | Set to exact frontend origin (with port)     |
| Railway deploy fails | Missing required env vars          | Check `railway variables` includes PORT      |
| Health check timeout | Backend not listening on PORT      | Verify PORT matches Railway config           |
| Docker won't start   | Port 3000 already in use           | Change PORT in `.env` or docker-compose      |
| Panels show "error"  | Invalid API key or rate limited    | Check key validity in provider dashboard     |
| Cache not persisting | Using in-memory (default)          | Set `CACHE_BACKEND=redis` with Upstash creds |
| Stale data (red dot) | Integration fetch failing silently | Check backend logs for errors                |

### Production Hardening

For production use, we recommend:

- **HTTPS**: Use a reverse proxy like [Caddy](https://caddyserver.com) (automatic TLS) or nginx with Let's Encrypt
- **Process manager**: Run via Docker with `restart: unless-stopped` or use Railway/Fly.io managed hosting

## Building in Public

WhateverOPS is built with automation for building in public — deploy changelogs, star milestones, weekly metrics digests, payment celebrations, and error transparency posts.

These automations run on a self-hosted [n8n](https://n8n.io) instance and are not included in the repository. See the [n8n docs](https://docs.n8n.io/hosting/) to set up your own instance.

## Development

```bash
pnpm install          # install all dependencies
pnpm dev              # frontend + backend concurrently
pnpm typecheck        # TypeScript strict check
pnpm lint             # ESLint
pnpm test             # all tests (unit + integration)
```

### Adding an Integration

Every integration follows a strict contract. See [CONTRIBUTING.md](CONTRIBUTING.md) for the template and required files checklist.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Integration template with full code example
- Required files checklist
- Pull request process

## License

[MIT](LICENSE)
