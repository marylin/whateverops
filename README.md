# WhateverOPS

Unified ops dashboard for solo developer-founders. Aggregates 15 integrations into one real-time view.

<!-- TODO: Replace with actual demo GIF once recorded -->
<!-- ![WhateverOPS Dashboard](docs/assets/demo.gif) -->

## Integrations

| Service         | Metrics                             | Status  |
| --------------- | ----------------------------------- | ------- |
| GitHub          | Stars, issues, PRs, commits         | Working |
| Linear          | Open/in-progress/completed, cycles  | Working |
| Vercel          | Deploys, projects, success rate     | Working |
| Railway         | Projects, services, deploy status   | Working |
| PostHog         | Users, events, feature flags        | Working |
| Resend          | Domains, API keys, email stats      | Working |
| Anthropic       | API key validation, models          | Working |
| OpenAI          | API key validation, models          | Working |
| Cloudflare      | Requests, bandwidth, cache ratio    | Working |
| Replit          | Repls, languages                    | Working |
| Supabase (Mgmt) | Project health, database            | Working |
| Supabase (Auth) | Users, signups, sessions            | Working |
| Neon            | Projects, regions, PG versions      | Working |
| Sentry          | Issues, events, error levels        | Working |
| Stripe          | MRR, subscriptions, failed payments | Working |

## Quick Start

```bash
git clone https://github.com/whateverops-dev/whateverops.git
cd whateverops
pnpm install
cp .env.example .env
# Add at least one API key
pnpm dev
```

Frontend: http://localhost:5173 | Backend: http://localhost:3000/health

## Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind
- **Backend:** Hono.js on Bun/Node
- **Cache:** In-memory or Upstash Redis
- **Automations:** n8n (5 workflows for building-in-public)

## Self-Hosting

See [Self-Hosting Guide](docs/06-Development/SETUP.md) — target: first panel in under 15 minutes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the integration template and PR process.

## License

MIT
