# Self-Hosting Guide

Target: first panel showing real data in under 15 minutes.

## Prerequisites

- Node.js >= 18 or Bun >= 1.0
- pnpm >= 8: `npm i -g pnpm`
- Git

## Quick Start (Local)

```bash
# 1. Clone and install
git clone https://github.com/whateverops-dev/whateverops.git
cd whateverops
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — add at least one integration API key (e.g. GITHUB_PAT)

# 3. Run
pnpm dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000/health
- Dashboard: http://localhost:5173 (shows configured panels)

## Running Tests

```bash
pnpm test                    # all tests
pnpm test:unit               # unit only
pnpm test:integration        # integration only
bunx playwright test         # e2e (requires running app)
```

## Deploy to Railway (Backend)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli
railway login

# 2. Create project
railway init
railway add

# 3. Set environment variables
railway variables set PORT=3000
railway variables set CACHE_BACKEND=memory
# Add your integration API keys (see .env.example for full list)

# 4. Deploy
railway up
```

The `railway.toml` in the repo root configures the build command.

### Upstash Redis (optional, recommended for production)

```bash
# Create a free Redis database at https://console.upstash.com
# Then add to Railway:
railway variables set CACHE_BACKEND=redis
railway variables set UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
railway variables set UPSTASH_REDIS_REST_TOKEN=your-token
```

## Deploy to Vercel (Frontend)

```bash
# 1. Install Vercel CLI
npm i -g vercel
vercel login

# 2. Deploy from frontend directory
cd frontend
vercel

# 3. Set environment variable
vercel env add VITE_API_URL  # enter your Railway backend URL
```

The `vercel.json` in `frontend/` configures the build output.

## n8n Self-Hosted (Automations)

See `docs/06-Development/N8N-SETUP.md` for Railway deploy instructions.

Import workflows from `n8n/workflows/`:

- AUTO-1: Deploy changelog → social
- AUTO-2: GitHub stars milestone posts
- AUTO-3: Weekly metrics digest
- AUTO-4: First payment celebration
- AUTO-5: Error transparency posts

## Environment Variables Reference

See `.env.example` for the complete list. Minimum required:

| Variable           | Required | Description                      |
| ------------------ | -------- | -------------------------------- |
| `PORT`             | Yes      | Backend port (default: 3000)     |
| `FRONTEND_URL`     | Yes      | Frontend origin for CORS         |
| At least 1 API key | Yes      | e.g. `GITHUB_PAT` to see a panel |

### Cache Configuration

| Variable                   | Values             | Description                     |
| -------------------------- | ------------------ | ------------------------------- |
| `CACHE_BACKEND`            | `memory` / `redis` | Cache backend (default: memory) |
| `UPSTASH_REDIS_REST_URL`   | URL                | Required if CACHE_BACKEND=redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token              | Required if CACHE_BACKEND=redis |

## Architecture

```
Browser → Vercel (React SPA) → Railway (Hono API) → 15 integration APIs
                                       ↓
                              Upstash Redis (cache)
                                       ↓
                              n8n (automations) → Resend (email) → Buffer (social)
```

## Troubleshooting

**No panels showing?** Check that at least one API key is set in `.env` and the backend is reachable.

**CORS errors?** Ensure `FRONTEND_URL` matches your frontend origin exactly.

**Cache not persisting?** Set `CACHE_BACKEND=redis` with valid Upstash credentials.

**n8n workflows not triggering?** Check `N8N_WEBHOOK_SECRET` matches between n8n and backend.
