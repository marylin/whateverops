# Local Setup Guide

Target: first panel showing real data in under 15 minutes.

## Prerequisites
- Bun ≥ 1.0: `curl -fsSL https://bun.sh/install | bash`
- pnpm ≥ 8: `npm i -g pnpm`
- Git

## Steps

```bash
git clone https://github.com/[you]/whateverops.git
cd whateverops
pnpm install
cp .env.example .env
```

Fill in at least one integration in `.env` (e.g. `GITHUB_PAT`), then:

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3000/health

## Running tests
```bash
pnpm test               # all
bun test tests/unit/    # unit only
bun test tests/integration/  # integration only
bunx playwright test    # e2e (requires running app)
```

## Self-hosting
See Railway + Vercel instructions in `docs/06-Development/N8N-SETUP.md`
and the deploy configs (`railway.toml`, `vercel.json`) in each workspace.
