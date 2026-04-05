# Supabase Cards Redesign — Design Spec

**Date:** 2026-04-05
**Branch:** feature/phase-3.6-quality-polish
**Goal:** Enrich the management card, make auth multi-project with auto-discovery, add a new storage card. All powered by a single `SUPABASE_ACCESS_TOKEN` — no per-project env vars.

---

## Problem

1. **Management card** shows project list + health dots but ignores advisors, edge functions, and compute tier — data the API provides for free.
2. **Auth card** is single-project, requires manual `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` per project. Should auto-discover all projects and show per-project auth stats on one card.
3. **No storage card** exists. Users with Supabase Storage have no visibility into buckets or usage.
4. **Paused projects** crash the auth card instead of showing "inactive" (fixed separately, but the multi-project redesign supersedes the single-project approach).

## Architecture

### Shared Project Discovery

**New file: `backend/src/lib/supabase-projects.ts`**

Exports `fetchProjectsWithKeys(managementKey: string)` which:

1. Calls `GET https://api.supabase.com/v1/projects` — lists all projects
2. For each project with status containing `ACTIVE`, calls `GET /v1/projects/{ref}/api-keys` — retrieves the `service_role` key
3. Paused/inactive projects get `serviceKey: null` (skip key fetch)
4. Returns:

```typescript
interface SupabaseProject {
  ref: string
  name: string
  status: string          // e.g. 'ACTIVE_HEALTHY', 'INACTIVE'
  region: string
  dbVersion: string
  serviceKey: string | null  // null for paused projects
}
```

**Caching:** In-memory, 5 min TTL. Projects and keys don't change often. All three integrations share this cache — one fetch serves management, auth, and storage.

**Auth header:** `Authorization: Bearer {managementKey}` for all management API calls.

### Integration Config Changes

All three Supabase integrations receive `{ managementKey: string }` instead of per-project config.

**Registry changes (`integration-registry.ts`):**

Remove:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_PROJECT_REF` and all `_2..5` variants for auth
- `SUPABASE_MANAGEMENT_KEY` alias (standardize on `SUPABASE_ACCESS_TOKEN`)

Keep:
- `SUPABASE_ACCESS_TOKEN` — the single PAT that powers all three cards

Registration:
```typescript
const supabaseToken = envOrSkip('SUPABASE_ACCESS_TOKEN')
if (supabaseToken) {
  integrations.push(
    runIntegration(supabaseManagement, { managementKey: supabaseToken }),
    runIntegration(supabaseAuth, { managementKey: supabaseToken }),
    runIntegration(supabaseStorage, { managementKey: supabaseToken }),
  )
}
```

---

## Card 1: Supabase Management (enriched)

The management integration currently has its own project-fetching logic. It should migrate to use `fetchProjectsWithKeys()` for the project list, then add its own enrichment calls on top. This avoids duplicate `/v1/projects` calls.

### New API Calls (per active project)

- `GET /v1/projects/{ref}/advisors/performance` — performance recommendations
- `GET /v1/projects/{ref}/advisors/security` — security recommendations
- `GET /v1/projects/{ref}/functions` — edge functions list

Each call is wrapped in try/catch — failure doesn't block the card, just omits that section.

### Updated RawData

```typescript
interface ProjectData {
  // existing
  name: string
  status: string
  region: string
  dbVersion: string
  healthChecks: Array<{ name: string; status: string }>
  healthyCount: number
  totalChecks: number

  // new
  advisors: {
    performance: Array<{ name: string; description: string }>
    security: Array<{ name: string; description: string }>
    totalCount: number
  }
  edgeFunctions: {
    total: number
    active: number
    items: Array<{ name: string; status: string }>
  }
}
```

### Panel Changes

- **Advisors:** Orange badge "N advisors" next to project name if any exist. Expandable section showing each recommendation (name + one-line description). Performance and security grouped separately.
- **Edge Functions:** Line below health checks: "N edge functions" with status dot (green = all active, red = any non-active, gray = none deployed). Expandable to list function names + status.
- Both sections collapsed by default to keep the card compact.

---

## Card 2: Supabase Auth (multi-project)

### Data Fetching

Uses shared `fetchProjectsWithKeys()`. For each active project with a service key:

1. `GET https://{ref}.supabase.co/auth/v1/admin/users?per_page=1` — read `x-total-count` response header for efficient total user count
2. If `totalUsers > 0`: `GET /auth/v1/admin/users?per_page=50` — first page for trend analysis, provider breakdown, active-recently calculation
3. If `totalUsers === 0`: skip the second call, return zeroed stats

Headers for auth calls:
```
Authorization: Bearer {serviceKey}
apikey: {serviceKey}
```

Paused projects: return `{ projectStatus: 'inactive' }`, no auth API calls.

Connection failures (ECONNREFUSED, timeout, HTTP 521): return `{ projectStatus: 'inactive' }`.

### Updated PanelData

```typescript
interface AuthPanelData {
  projects: Array<{
    name: string
    ref: string
    projectStatus: 'active' | 'inactive'
    totalUsers: number
    recentSignups: number
    activeRecently: number
    signupsTrend: 'up' | 'down' | 'flat'
    dauPct: number
    providerBreakdown: Record<string, number>
    daysSinceLastSignup: number | null
  }>
  summary: {
    totalUsersAllProjects: number
    totalActiveRecently: number
    activeProjectCount: number
  }
}
```

### Panel Changes

- **Summary row** (top): total users across all projects, total active (24h), count of active projects. Hidden if only 1 active project (no summary needed).
- **Per-project rows:** Project name with status dot, user count, "+N this week" signup badge, trend arrow. Expandable for provider breakdown (reuses existing MiniBar UI).
- **Paused projects:** Yellow "Paused" badge, no stats, sorted to bottom.
- **Empty state:** "No active projects with users" if all projects are paused or have 0 users.

---

## Card 3: Supabase Storage (new)

### New Files

- `backend/src/integrations/supabase-storage.ts`
- `frontend/src/components/panels/SupabaseStoragePanel.tsx`

### Data Fetching

Uses shared `fetchProjectsWithKeys()`. For each active project with a service key:

1. `GET https://{ref}.supabase.co/storage/v1/bucket` — list all buckets

Headers:
```
Authorization: Bearer {serviceKey}
apikey: {serviceKey}
```

Returns per bucket: `id`, `name`, `public`, `file_size_limit`, `allowed_mime_types`, `created_at`.

Paused projects: skip, return `{ projectStatus: 'inactive' }`.

**Not fetched:** Object counts (would require listing all objects per bucket — too expensive). Storage sizes (requires SQL, not available via API).

### PanelData

```typescript
interface StoragePanelData {
  projects: Array<{
    name: string
    ref: string
    projectStatus: 'active' | 'inactive'
    buckets: Array<{
      name: string
      public: boolean
      fileSizeLimit: number | null
      allowedMimeTypes: string[] | null
    }>
    bucketCount: number
  }>
  summary: {
    totalBuckets: number
    publicBuckets: number
    privateBuckets: number
    activeProjectCount: number
  }
}
```

### Panel UI

- **Summary row** (top): total buckets, public vs private count. Hidden if only 1 project.
- **Per-project sections:** Project name, bucket list.
- **Per bucket:** Name, visibility badge (green "Public" / gray "Private"), file size limit if configured (e.g. "50 MB max").
- **Paused projects:** Yellow "Paused" badge, sorted to bottom.
- **Empty state:** "No storage buckets configured".
- **No size data notice:** Not shown — absence of size data is implicit. If size visibility is needed later, it requires a DB connection (out of scope).

### Registration

- Add to `PANEL_MAP` in `Dashboard.tsx` as `'supabase-storage': SupabaseStoragePanel`
- Add to Health group integrations array
- Add to `integration-env-map.ts`
- Add to `WIDE_PANELS` set (multi-project layout benefits from width)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Management key invalid/missing | All three cards show error (no fallback) |
| Project list fetch fails | All three cards error |
| API key fetch fails for one project | Skip that project, log warning, other projects unaffected |
| Auth fetch fails for active project | Show error row for that project, others render normally |
| Storage fetch fails for active project | Same — error row, others unaffected |
| Paused project | Yellow "Paused" badge, no API calls, no error |
| Project has 0 buckets | Show project row with "No buckets" |
| Project has 0 users | Show project row with 0 users, empty provider breakdown |

---

## Cache Strategy

| Layer | TTL | Rationale |
|-------|-----|-----------|
| Shared project list + keys | 300s (5 min) | Projects/keys rarely change |
| Management card data | 120s | Health can change, advisors are stable |
| Auth card data | 120s | User counts shift slowly |
| Storage card data | 120s | Bucket config is stable |

---

## Env Var Changes

**Before:**
```
SUPABASE_ACCESS_TOKEN=...          # management API
SUPABASE_MANAGEMENT_KEY=...        # alias (redundant)
SUPABASE_URL=...                   # per-project auth
SUPABASE_SERVICE_KEY=...           # per-project auth
SUPABASE_PROJECT_REF=...           # per-project auth
SUPABASE_URL_2=...                 # multi-instance
SUPABASE_SERVICE_KEY_2=...         # multi-instance
```

**After:**
```
SUPABASE_ACCESS_TOKEN=...          # single key, powers everything
```

All other `SUPABASE_*` env vars become unused. The registry ignores them. No breaking change — they're just not read anymore.

---

## Out of Scope

- Storage sizes (requires SQL / direct DB connection)
- Object counts per bucket (expensive list-all operation)
- Plan tier detection (not available via API)
- Usage quotas / billing data (dashboard-only, not API-accessible)
- Compute tier / billing addons (poorly documented response shape)
- Prometheus metrics endpoint (separate auth mechanism, better suited for Grafana)
- Auth audit log (high volume, better suited for dedicated logging)

---

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `backend/src/lib/supabase-projects.ts` | Shared project discovery + key cache |
| `backend/src/integrations/supabase-storage.ts` | Storage integration |
| `frontend/src/components/panels/SupabaseStoragePanel.tsx` | Storage panel component |

### Modified Files
| File | Changes |
|------|---------|
| `backend/src/integrations/supabase-management.ts` | Add advisors + edge functions fetching |
| `backend/src/integrations/supabase-auth.ts` | Multi-project via shared utility, remove per-project config |
| `backend/src/lib/integration-registry.ts` | Simplify Supabase registration to single token, add storage |
| `backend/src/lib/integration-env-map.ts` | Add storage, simplify auth mapping |
| `frontend/src/components/panels/SupabaseMgmtPanel.tsx` | Add advisors + edge functions sections |
| `frontend/src/components/panels/SupabaseAuthPanel.tsx` | Multi-project layout with summary row |
| `frontend/src/components/layout/Dashboard.tsx` | Register storage panel, add to Health group |

### Deleted / Unused
| File | Status |
|------|--------|
| `SUPABASE_URL` env var | No longer read |
| `SUPABASE_SERVICE_KEY` env var | No longer read |
| `SUPABASE_PROJECT_REF` env var | No longer read |
| `SUPABASE_MANAGEMENT_KEY` env var | No longer read (use `SUPABASE_ACCESS_TOKEN`) |
