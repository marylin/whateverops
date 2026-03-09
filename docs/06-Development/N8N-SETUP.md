# n8n Setup on Railway

## Service config
- Image: `docker.n8n.io/n8nio/n8n`
- Port: 5678

## Required env vars
```
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=[strong password]
N8N_HOST=n8n.yourdomain.com
WEBHOOK_URL=https://n8n.yourdomain.com
N8N_PROTOCOL=https
```

## Phase 0–3: SQLite persistence
Add Railway Volume → mount at `/data`, then:
```
N8N_DATA_FOLDER=/data
```

## Phase 4+: Neon Postgres
```
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=[neon host]
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=[user]
DB_POSTGRESDB_PASSWORD=[password]
DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED=false
```
Remove Railway Volume when migrated.

## Workflow files
Committed to `n8n/workflows/` as JSON exports.

Import: n8n editor → Workflows → Import from file
Export: ⋮ menu → Download → save to `n8n/workflows/[name].json`

Credentials are NOT committed — store in n8n's encrypted credential store.

## Required credentials in n8n
- HTTP Request (Anthropic API key) — for Claude Haiku
- Resend API key
- Buffer API key
- GitHub Personal Access Token
- Stripe API key
- PostHog API key
