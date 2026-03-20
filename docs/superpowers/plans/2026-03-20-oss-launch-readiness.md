# OSS Launch Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the WhateverOPS repo for public OSS release by closing gitignore gaps, adding missing OSS files, fixing broken doc links, and removing n8n workflows from tracking.

**Architecture:** All changes are repo-level hygiene — no source code, no tests, no new dependencies. Files are either gitignored/untracked, created (SECURITY.md, issue templates), or edited in place (README, CONTRIBUTING, .env.example, .gitignore).

**Tech Stack:** Git, Markdown, YAML (GitHub issue templates)

**Spec:** `docs/superpowers/specs/2026-03-20-oss-launch-readiness-design.md`

---

## File Structure

| File                                 | Action | Responsibility                                                               |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------- |
| `.gitignore`                         | Modify | Add `docs/` and `n8n/` ignore patterns                                       |
| `frontend/public/logo.svg`           | Create | Copy logo from docs/assets/ before untracking                                |
| `SECURITY.md`                        | Create | Vulnerability reporting policy                                               |
| `.github/ISSUE_TEMPLATE/bug.yml`     | Create | Bug report structured form                                                   |
| `.github/ISSUE_TEMPLATE/feature.yml` | Create | Feature request structured form                                              |
| `.github/ISSUE_TEMPLATE/config.yml`  | Create | Redirect questions to Discussions                                            |
| `README.md`                          | Modify | Inline self-hosting, fix logo path, update n8n section, fix integration link |
| `CONTRIBUTING.md`                    | Modify | Remove dead docs/ link, add contract rules                                   |
| `.env.example`                       | Modify | Remove N8N_WEBHOOK_SECRET, update header                                     |

---

### Task 1: Copy logo and untrack docs/ and n8n/

**Files:**

- Copy: `docs/assets/logo.svg` → `frontend/public/logo.svg`
- Modify: `.gitignore`
- Untrack: `docs/`, `n8n/`

- [ ] **Step 1: Copy logo.svg to frontend/public/ before untracking**

```bash
cp docs/assets/logo.svg frontend/public/logo.svg
```

- [ ] **Step 2: Add docs/ and n8n/ to .gitignore**

Append to `.gitignore` before the "Editor temps" section:

```gitignore
# Documentation (internal — keep locally)
docs/

# n8n workflows (local-only automation)
n8n/
```

- [ ] **Step 3: Untrack docs/ and n8n/ from git**

```bash
git rm --cached -r docs/
git rm --cached -r n8n/
```

Expected: lists all previously tracked files under `docs/` and `n8n/` as "rm '...'"

- [ ] **Step 4: Stage and commit**

```bash
git add .gitignore frontend/public/logo.svg
git commit -m "chore(oss): gitignore docs/ and n8n/, copy logo to frontend/public"
```

---

### Task 2: Create SECURITY.md

**Files:**

- Create: `SECURITY.md`

- [ ] **Step 1: Create SECURITY.md at repo root**

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Email: security@whateverops.dev (or marylin-alarcon@live.com)

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

- [ ] **Step 2: Commit**

```bash
git add SECURITY.md
git commit -m "docs(oss): add SECURITY.md with vulnerability reporting policy"
```

---

### Task 3: Create GitHub issue templates

**Files:**

- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create .github/ISSUE_TEMPLATE/ directory**

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

- [ ] **Step 2: Create bug.yml**

```yaml
name: Bug Report
description: Report a bug or unexpected behavior
labels: ['bug']
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: What happened?
      placeholder: A clear description of the bug
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      description: How can we reproduce this?
      placeholder: |
        1. Go to '...'
        2. Click on '...'
        3. See error
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      description: What should have happened?
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Your setup
      placeholder: |
        - OS: [e.g. macOS 14, Ubuntu 22.04]
        - Bun/Node version: [e.g. Bun 1.1.0]
        - Browser: [e.g. Chrome 120]
    validations:
      required: true
  - type: dropdown
    id: integration
    attributes:
      label: Integration affected
      description: Which integration is this related to?
      options:
        - N/A
        - GitHub
        - Linear
        - Vercel
        - Railway
        - PostHog
        - Resend
        - Anthropic
        - OpenAI
        - Cloudflare
        - Replit
        - Supabase
        - Neon
        - Sentry
        - Stripe
    validations:
      required: false
  - type: textarea
    id: logs
    attributes:
      label: Logs / screenshots
      description: Paste relevant logs or attach screenshots
    validations:
      required: false
```

- [ ] **Step 3: Create feature.yml**

```yaml
name: Feature Request
description: Suggest a new feature or improvement
labels: ['enhancement']
body:
  - type: textarea
    id: use-case
    attributes:
      label: Use case
      description: Why do you need this? What problem does it solve?
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Proposed solution
      description: How should this work?
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
      description: Any other approaches you've thought about?
    validations:
      required: false
  - type: dropdown
    id: integration
    attributes:
      label: Integration
      description: Is this specific to an integration?
      options:
        - N/A
        - GitHub
        - Linear
        - Vercel
        - Railway
        - PostHog
        - Resend
        - Anthropic
        - OpenAI
        - Cloudflare
        - Replit
        - Supabase
        - Neon
        - Sentry
        - Stripe
        - New integration
    validations:
      required: false
```

- [ ] **Step 4: Create config.yml**

```yaml
blank_issues_enabled: false
contact_links:
  - name: Questions & Support
    url: https://github.com/whateverops-dev/whateverops/discussions
    about: Ask questions and get help in Discussions
```

- [ ] **Step 5: Commit**

```bash
git add .github/ISSUE_TEMPLATE/
git commit -m "docs(oss): add GitHub issue templates (bug, feature, config)"
```

---

### Task 4: Update README.md

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Update logo path**

Line 2: change `src="docs/assets/logo.svg"` → `src="frontend/public/logo.svg"`

- [ ] **Step 2: Remove commented-out demo GIF reference**

Delete line 29 (the HTML comment referencing `docs/assets/demo.gif`):

```
<!-- ![WhateverOPS Dashboard](docs/assets/demo.gif) -->
```

- [ ] **Step 3: Replace Self-Hosting section**

Replace lines 95-104 (the current Self-Hosting section) with the inlined content:

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

- [ ] **Step 4: Fix "Adding an Integration" link**

Replace line 130:

```
Every integration follows a strict contract. See [CONTRIBUTING.md](CONTRIBUTING.md) for the template and the [Integration Pattern docs](docs/06-Development/INTEGRATION-PATTERN.md) for the full spec.
```

With:

```
Every integration follows a strict contract. See [CONTRIBUTING.md](CONTRIBUTING.md) for the template and required files checklist.
```

- [ ] **Step 5: Update "Building in Public" section**

Replace lines 106-116 with:

```markdown
## Building in Public

WhateverOPS is built with automation for building in public — deploy changelogs, star milestones, weekly metrics digests, payment celebrations, and error transparency posts.

These automations run on a self-hosted [n8n](https://n8n.io) instance and are not included in the repository. See the [n8n docs](https://docs.n8n.io/hosting/) to set up your own instance.
```

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs(readme): inline self-hosting guide, fix broken docs/ links, update n8n section"
```

---

### Task 5: Update CONTRIBUTING.md

**Files:**

- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Remove dead docs/ link**

Replace line 7:

```
Each integration follows a strict contract. See `docs/06-Development/INTEGRATION-PATTERN.md` for the full spec.
```

With:

```
Each integration follows a strict contract defined below.
```

- [ ] **Step 2: Add Integration Contract Rules section**

After the "Required Files Checklist" section (after line 69), add:

```markdown
### Integration Contract Rules

- `INTEGRATION_ID`: kebab-case, stable forever (never rename after merge)
- `fetchData()`: must have 10s timeout via `AbortSignal.timeout(10_000)`
- `parsePanel()`: pure function — no async, no side effects, no throws. Handle null/undefined with fallback defaults.
- Frontend panel: must handle 4 states — loading (skeleton), error (actionable message), empty, data
- 6 required unit tests (see test template above)
```

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs(contributing): remove dead docs/ link, add integration contract rules"
```

---

### Task 6: Clean up .env.example

**Files:**

- Modify: `.env.example`

- [ ] **Step 1: Update header comment**

Replace line 3:

```
# Full docs: docs/06-Development/ENV-VARS.md
```

With:

```
# See each section for where to get API keys.
```

- [ ] **Step 2: Remove N8N_WEBHOOK_SECRET**

Delete line 78:

```
N8N_WEBHOOK_SECRET=
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(env): remove N8N_WEBHOOK_SECRET, fix dead docs link in header"
```

---

### Task 7: Final verification

- [ ] **Step 1: Verify no docs/ or n8n/ files are tracked**

```bash
git ls-files docs/ n8n/
```

Expected: empty output (nothing tracked)

- [ ] **Step 2: Verify logo.svg is tracked**

```bash
git ls-files frontend/public/logo.svg
```

Expected: `frontend/public/logo.svg`

- [ ] **Step 3: Verify new files are tracked**

```bash
git ls-files SECURITY.md .github/ISSUE_TEMPLATE/
```

Expected:

```
.github/ISSUE_TEMPLATE/bug.yml
.github/ISSUE_TEMPLATE/config.yml
.github/ISSUE_TEMPLATE/feature.yml
SECURITY.md
```

- [ ] **Step 4: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: 0 errors on both

- [ ] **Step 5: Verify .env.example has no N8N_WEBHOOK_SECRET**

```bash
grep -c "N8N_WEBHOOK_SECRET" .env.example
```

Expected: `0`

- [ ] **Step 6: Verify README has no docs/ links**

```bash
grep -c "docs/" README.md
```

Expected: `0`

- [ ] **Step 7: Verify CONTRIBUTING has no docs/ links**

```bash
grep -c "docs/" CONTRIBUTING.md
```

Expected: `0`
