# OSS Launch Readiness — Design Spec

**Date:** 2026-03-20
**Branch:** feature/phase-3.1-launch-readiness
**Target:** Merge to master as a clean public OSS repo

## Goal

Prepare WhateverOPS for public open-source release by closing hygiene gaps:
gitignore cleanup, missing OSS files, broken doc links, and n8n workflow removal from tracking.

## Decisions Made

- **n8n workflows:** Remove from git tracking, keep local-only (gitignored). Simplify to auto-post (remove approval step) — local change only.
- **docs/ folder:** Gitignore entirely. Internal planning, architecture, and development docs stay local.
- **pnpm-lock.yaml:** Keep tracked (some deploy targets need it).
- **SECURITY.md:** Add. CODE_OF_CONDUCT.md skipped for now.
- **Issue templates:** Add bug.yml + feature.yml + config.yml.
- **Broken links:** Inline essential content from docs/ into README and CONTRIBUTING, not full rewrite.

---

## Change 1: .gitignore Updates

Add to `.gitignore`:

```gitignore
# Documentation (internal — keep locally)
docs/

# n8n workflows (local-only automation)
n8n/
```

The existing granular `docs/05-Plans/*` and `docs/08-Feedback/` patterns become redundant but harmless — `docs/` covers them all.

## Change 2: Untrack docs/ and n8n/ Files

```bash
git rm --cached -r docs/
git rm --cached -r n8n/workflows/
```

This removes them from git tracking without deleting local files.

## Change 3: Move logo.svg

README references `docs/assets/logo.svg`. Since `docs/` is now gitignored, move the logo:

```bash
cp docs/assets/logo.svg frontend/public/logo.svg
```

Update README line 2: `src="docs/assets/logo.svg"` → `src="frontend/public/logo.svg"`

## Change 4: SECURITY.md

Create `SECURITY.md` at repo root:

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Email: [maintainer email from package.json or repo]

### What to expect

- Acknowledgment within 48 hours
- Status update within 7 days
- Coordinated disclosure after fix is released

### What to include

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

## Scope

- Backend API (Hono.js)
- Frontend (React SPA)
- Integration credential handling
- Cache layer

Out of scope: third-party services (Vercel, Railway, Stripe, etc.)
```

## Change 5: Issue Templates

### `.github/ISSUE_TEMPLATE/bug.yml`

YAML-based structured form:

- **Title** (required)
- **Description** — what happened (required)
- **Steps to reproduce** (required)
- **Expected behavior** (required)
- **Environment** — OS, Bun/Node version, browser (required)
- **Logs / screenshots** (optional)
- **Integration affected** — dropdown of all 15 integrations + "N/A" (optional)

### `.github/ISSUE_TEMPLATE/feature.yml`

YAML-based structured form:

- **Title** (required)
- **Use case** — why you need this (required)
- **Proposed solution** (required)
- **Alternatives considered** (optional)
- **Integration** — dropdown if integration-specific (optional)

### `.github/ISSUE_TEMPLATE/config.yml`

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Support
    url: https://github.com/whateverops-dev/whateverops/discussions
    about: Ask questions and get help in Discussions
```

## Change 6: README.md Updates

### Self-Hosting section (replace link with inline content)

Remove: `See the full [Self-Hosting Guide](docs/06-Development/SETUP.md)`

Replace with inlined content from SETUP.md — the essential deployment steps:

```markdown
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

- **No panels?** Check at least one API key is set and backend is reachable
- **CORS errors?** Ensure `FRONTEND_URL` matches your frontend origin exactly
- **Cache not persisting?** Set `CACHE_BACKEND=redis` with Upstash credentials
```

### Adding an Integration section

Remove: `See [Integration Pattern docs](docs/06-Development/INTEGRATION-PATTERN.md) for the full spec`

The link text already says "See CONTRIBUTING.md" which has the full template inlined. Just remove the dead docs/ link. The sentence becomes:

```markdown
Every integration follows a strict contract. See [CONTRIBUTING.md](CONTRIBUTING.md) for the template and required files checklist.
```

### Building in Public section

Update to reflect n8n workflows are not included:

```markdown
## Building in Public

WhateverOPS is built with automation for building in public — deploy changelogs,
star milestones, weekly metrics digests, payment celebrations, and error transparency posts.

These automations run on a self-hosted [n8n](https://n8n.io) instance and are not
included in the repository. See the [n8n docs](https://docs.n8n.io/hosting/) to
set up your own instance.
```

## Change 7: CONTRIBUTING.md Updates

### Integration pattern reference

Remove line 7: `See docs/06-Development/INTEGRATION-PATTERN.md for the full spec.`

The contributing guide already has the full template inlined (lines 10-57). Add the missing pieces from INTEGRATION-PATTERN.md that aren't in CONTRIBUTING.md:

After the "Required Files Checklist" section, add:

```markdown
### Integration Contract Rules

- `INTEGRATION_ID`: kebab-case, stable forever (never rename after merge)
- `fetchData()`: must have 10s timeout via `AbortSignal.timeout(10_000)`
- `parsePanel()`: pure function — no async, no side effects, no throws. Handle null/undefined with fallback defaults.
- Frontend panel: must handle 4 states — loading (skeleton), error (actionable message), empty, data
- 6 required unit tests (see test template above)
```

## Change 8: .env.example Cleanup

Remove `N8N_WEBHOOK_SECRET` from the "Auth Secrets (Phase 4+)" section since n8n is now local-only and not part of the OSS repo.

Also remove the `docs/06-Development/ENV-VARS.md` reference on line 3: `# Full docs: docs/06-Development/ENV-VARS.md`

Replace with: `# See each section for where to get API keys.`

---

## Files Changed Summary

| File                                 | Action                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `.gitignore`                         | Add `docs/` and `n8n/` patterns                                           |
| `docs/*` (tracked)                   | `git rm --cached -r`                                                      |
| `n8n/workflows/*` (tracked)          | `git rm --cached -r`                                                      |
| `frontend/public/logo.svg`           | New (copied from docs/assets/)                                            |
| `SECURITY.md`                        | New                                                                       |
| `.github/ISSUE_TEMPLATE/bug.yml`     | New                                                                       |
| `.github/ISSUE_TEMPLATE/feature.yml` | New                                                                       |
| `.github/ISSUE_TEMPLATE/config.yml`  | New                                                                       |
| `README.md`                          | Update self-hosting, integration, building-in-public sections + logo path |
| `CONTRIBUTING.md`                    | Remove docs/ link, add contract rules                                     |
| `.env.example`                       | Remove N8N_WEBHOOK_SECRET, update header comment                          |

## Out of Scope

- No source code changes
- No test changes
- No GitHub Actions changes
- No new dependencies
- No n8n workflow modifications (those stay local, untracked)
