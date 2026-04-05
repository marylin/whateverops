# Supabase Cards Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the management card (advisors + edge functions), make auth multi-project with auto-discovery, and add a new storage card — all powered by a single `SUPABASE_ACCESS_TOKEN`.

**Architecture:** Shared project discovery utility (`supabase-projects.ts`) caches all projects + service keys. Three integrations (management, auth, storage) import it and add their own data on top. Registry simplified to single token registration.

**Tech Stack:** Hono.js (backend), React 19 + Tailwind 4 (frontend), Bun test / Vitest (testing)

**Spec:** `docs/superpowers/specs/2026-04-05-supabase-cards-redesign-design.md`

---

## File Map

### New Files
| File | Purpose |
|------|---------|
| `backend/src/lib/supabase-projects.ts` | Shared project discovery + key cache |
| `backend/src/integrations/supabase-storage.ts` | Storage integration |
| `frontend/src/components/panels/SupabaseStoragePanel.tsx` | Storage panel component |

### Modified Files
| File | Changes |
|------|---------|
| `backend/src/integrations/supabase-management.ts` | Use shared utility, add advisors + edge functions |
| `backend/src/integrations/supabase-auth.ts` | Rewrite: multi-project via shared utility |
| `backend/src/lib/integration-registry.ts` | Simplify Supabase to single token, add storage |
| `backend/src/lib/integration-env-map.ts` | Add storage, update auth/management mappings |
| `frontend/src/components/panels/SupabaseMgmtPanel.tsx` | Add advisors + edge functions UI |
| `frontend/src/components/panels/SupabaseAuthPanel.tsx` | Multi-project layout with summary |
| `frontend/src/components/layout/Dashboard.tsx` | Register storage panel, add to Health group |

---

## Task 1: Shared project discovery utility

**Files:**
- Create: `backend/src/lib/supabase-projects.ts`

- [ ] **Step 1: Create the shared utility**

```typescript
// backend/src/lib/supabase-projects.ts
import { cacheGet, cacheSet } from '../cache/index.js'

export interface SupabaseProject {
  ref: string
  name: string
  status: string
  region: string
  dbVersion: string
  serviceKey: string | null
}

interface ApiProject {
  id: string
  ref: string
  name: string
  region: string
  status: string
  database?: { version?: string }
}

interface ApiKey {
  name: string
  api_key: string
}

const CACHE_KEY = 'supabase:projects-with-keys'
const CACHE_TTL = 300 // 5 minutes

async function sbFetch(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  })
}

async function fetchServiceKey(
  ref: string,
  token: string,
): Promise<string | null> {
  try {
    const res = await sbFetch(
      `https://api.supabase.com/v1/projects/${ref}/api-keys`,
      token,
    )
    if (!res.ok) return null
    const keys = (await res.json()) as ApiKey[]
    return keys.find((k) => k.name === 'service_role')?.api_key ?? null
  } catch {
    return null
  }
}

export async function fetchProjectsWithKeys(
  managementKey: string,
): Promise<SupabaseProject[]> {
  const cached = await cacheGet<SupabaseProject[]>(CACHE_KEY)
  if (cached) return cached

  const res = await sbFetch('https://api.supabase.com/v1/projects', managementKey)
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Authentication failed — check SUPABASE_ACCESS_TOKEN'
        : `Supabase API error: ${res.status}`,
    )
  }

  const apiProjects = (await res.json()) as ApiProject[]

  const projects: SupabaseProject[] = await Promise.all(
    apiProjects.map(async (p) => {
      const isActive =
        p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE_UNHEALTHY'
      const serviceKey = isActive
        ? await fetchServiceKey(p.ref, managementKey)
        : null

      return {
        ref: p.ref,
        name: p.name,
        status: p.status,
        region: p.region,
        dbVersion: p.database?.version ?? 'unknown',
        serviceKey,
      }
    }),
  )

  await cacheSet(CACHE_KEY, projects, CACHE_TTL)
  return projects
}
```

- [ ] **Step 2: Verify backend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add backend/src/lib/supabase-projects.ts
git commit -m "feat(backend): add shared Supabase project discovery utility"
```

---

## Task 2: Enrich Supabase Management integration

**Files:**
- Modify: `backend/src/integrations/supabase-management.ts`

- [ ] **Step 1: Rewrite supabase-management.ts to use shared utility and add advisors + edge functions**

Replace the entire file. Key changes:
- Config changes from `{ apiKey, projectRef? }` to `{ managementKey }`
- Uses `fetchProjectsWithKeys()` for project list
- Adds `/advisors/performance`, `/advisors/security`, `/functions` per active project
- Adds `advisors.performance[]`, `advisors.security[]`, `edgeFunctions` to `ProjectPanelData`

```typescript
// backend/src/integrations/supabase-management.ts
import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { fetchProjectsWithKeys, type SupabaseProject } from '../lib/supabase-projects.js'

export const INTEGRATION_ID = 'supabase-management' as const
export const INTEGRATION_NAME = 'Supabase'
export const DEFAULT_TTL = 120
export const FETCH_TIMEOUT_MS = 30_000

export const CONFIG_SCHEMA = z.object({
  managementKey: z.string().min(1, 'Supabase access token required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

interface AdvisorItem {
  name: string
  description: string
}

interface EdgeFunctionItem {
  name: string
  status: string
}

export interface ProjectPanelData {
  id: string
  projectName: string
  projectStatus: string
  region: string
  dbVersion: string
  healthChecks: Array<{ name: string; status: string }>
  healthyCount: number
  totalChecks: number
  readOnly: boolean
  advisors: {
    performance: AdvisorItem[]
    security: AdvisorItem[]
    totalCount: number
  }
  edgeFunctions: {
    total: number
    active: number
    items: EdgeFunctionItem[]
  }
}

export interface RawData {
  projects: Array<{
    project: SupabaseProject
    health: Array<{ name: string; status: string }>
    readOnly: boolean
    advisors: {
      performance: AdvisorItem[]
      security: AdvisorItem[]
    }
    edgeFunctions: EdgeFunctionItem[]
  }>
}

export interface PanelData {
  projectCount: number
  projects: ProjectPanelData[]
}

async function sbFetch(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  })
}

async function fetchAdvisors(
  ref: string,
  token: string,
  type: 'performance' | 'security',
): Promise<AdvisorItem[]> {
  try {
    const res = await sbFetch(
      `https://api.supabase.com/v1/projects/${ref}/advisors/${type}`,
      token,
    )
    if (!res.ok) return []
    const body = await res.json()
    const items = Array.isArray(body) ? body : []
    return items.map((a: Record<string, string>) => ({
      name: a.name ?? a.title ?? type,
      description: a.reason ?? a.description ?? a.message ?? '',
    }))
  } catch {
    return []
  }
}

async function fetchEdgeFunctions(
  ref: string,
  token: string,
): Promise<EdgeFunctionItem[]> {
  try {
    const res = await sbFetch(
      `https://api.supabase.com/v1/projects/${ref}/functions`,
      token,
    )
    if (!res.ok) return []
    const body = (await res.json()) as Array<{ name?: string; slug?: string; status?: string }>
    return body.map((f) => ({
      name: f.name ?? f.slug ?? 'unknown',
      status: f.status ?? 'UNKNOWN',
    }))
  } catch {
    return []
  }
}

async function fetchHealth(
  ref: string,
  token: string,
): Promise<Array<{ name: string; status: string }>> {
  try {
    const res = await sbFetch(
      `https://api.supabase.com/v1/projects/${ref}/health?services=auth,realtime,rest,storage`,
      token,
    )
    if (!res.ok) return []
    const body = (await res.json()) as Array<{ name: string; status: string; healthy?: boolean }>
    return body.map((h) => ({
      name: h.name,
      status: h.healthy ? 'ACTIVE_HEALTHY' : (h.status ?? 'UNKNOWN'),
    }))
  } catch {
    return []
  }
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const projects = await fetchProjectsWithKeys(config.managementKey)

  const enriched = await Promise.all(
    projects.map(async (p) => {
      const isActive =
        p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE_UNHEALTHY'

      if (!isActive) {
        return {
          project: p,
          health: [],
          readOnly: false,
          advisors: { performance: [], security: [] },
          edgeFunctions: [],
        }
      }

      const [health, perfAdvisors, secAdvisors, edgeFunctions] =
        await Promise.all([
          fetchHealth(p.ref, config.managementKey),
          fetchAdvisors(p.ref, config.managementKey, 'performance'),
          fetchAdvisors(p.ref, config.managementKey, 'security'),
          fetchEdgeFunctions(p.ref, config.managementKey),
        ])

      return {
        project: p,
        health,
        readOnly: false,
        advisors: { performance: perfAdvisors, security: secAdvisors },
        edgeFunctions,
      }
    }),
  )

  return { projects: enriched }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = (raw.projects ?? []).map((pd) => {
    const health = pd.health ?? []
    const healthyCount = health.filter(
      (h) => h.status === 'HEALTHY' || h.status === 'ACTIVE_HEALTHY',
    ).length
    const perf = pd.advisors?.performance ?? []
    const sec = pd.advisors?.security ?? []
    const funcs = pd.edgeFunctions ?? []

    return {
      id: pd.project.ref,
      projectName: pd.project.name,
      projectStatus: pd.project.status,
      region: pd.project.region,
      dbVersion: pd.project.dbVersion,
      healthChecks: health.map((h) => ({ name: h.name, status: h.status })),
      healthyCount,
      totalChecks: health.length,
      readOnly: pd.readOnly ?? false,
      advisors: {
        performance: perf.slice(0, 5),
        security: sec.slice(0, 5),
        totalCount: perf.length + sec.length,
      },
      edgeFunctions: {
        total: funcs.length,
        active: funcs.filter((f) => f.status === 'ACTIVE').length,
        items: funcs,
      },
    } as ProjectPanelData
  })

  return { projectCount: projects.length, projects }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.managementKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  const projects = raw.projects ?? []
  if (projects.length === 0) return 'error'

  let hasWarn = false
  for (const pd of projects) {
    if (pd.project.status === 'ACTIVE_UNHEALTHY') hasWarn = true
    const unhealthy = (pd.health ?? []).filter(
      (h) => h.status !== 'HEALTHY' && h.status !== 'ACTIVE_HEALTHY',
    )
    if (unhealthy.length > 0) hasWarn = true
    if (pd.readOnly) hasWarn = true
    const advisorCount =
      (pd.advisors?.performance?.length ?? 0) +
      (pd.advisors?.security?.length ?? 0)
    if (advisorCount > 0) hasWarn = true
  }

  return hasWarn ? 'warn' : 'ok'
}
```

- [ ] **Step 2: Verify backend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck`
Expected: May fail on registry (still passing old config) — that's expected, will fix in Task 5

- [ ] **Step 3: Commit**

```bash
git add backend/src/integrations/supabase-management.ts
git commit -m "feat(backend): enrich supabase management with advisors + edge functions"
```

---

## Task 3: Rewrite Supabase Auth for multi-project

**Files:**
- Modify: `backend/src/integrations/supabase-auth.ts`

- [ ] **Step 1: Rewrite supabase-auth.ts for multi-project auto-discovery**

Replace the entire file. Key changes:
- Config changes from `{ apiKey, supabaseUrl, projectRef }` to `{ managementKey }`
- Uses `fetchProjectsWithKeys()` to discover all projects
- Fetches user count via `x-total-count` header (efficient)
- Returns array of per-project auth data + summary

```typescript
// backend/src/integrations/supabase-auth.ts
import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { fetchProjectsWithKeys, type SupabaseProject } from '../lib/supabase-projects.js'

export const INTEGRATION_ID = 'supabase-auth' as const
export const INTEGRATION_NAME = 'Supabase Auth'
export const DEFAULT_TTL = 120
export const FETCH_TIMEOUT_MS = 30_000

export const CONFIG_SCHEMA = z.object({
  managementKey: z.string().min(1, 'Supabase access token required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

interface UserRecord {
  id: string
  created_at: string
  last_sign_in_at: string | null
  email: string
  app_metadata?: { providers?: string[] }
}

interface ProjectAuthRaw {
  project: SupabaseProject
  totalUsers: number
  users: UserRecord[]
  projectStatus: 'active' | 'inactive'
}

export interface RawData {
  projects: ProjectAuthRaw[]
}

interface ProjectAuthPanel {
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
}

export interface PanelData {
  projects: ProjectAuthPanel[]
  summary: {
    totalUsersAllProjects: number
    totalActiveRecently: number
    activeProjectCount: number
  }
}

async function fetchAuthForProject(
  project: SupabaseProject,
): Promise<ProjectAuthRaw> {
  if (!project.serviceKey) {
    return { project, totalUsers: 0, users: [], projectStatus: 'inactive' }
  }

  const baseUrl = `https://${project.ref}.supabase.co`
  const headers = {
    Authorization: `Bearer ${project.serviceKey}`,
    apikey: project.serviceKey,
  }

  // Efficient total count — fetch 1 user, read x-total-count header
  let countRes: Response
  try {
    countRes = await fetch(`${baseUrl}/auth/v1/admin/users?per_page=1`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return { project, totalUsers: 0, users: [], projectStatus: 'inactive' }
  }

  if (!countRes.ok) {
    if (countRes.status === 521) {
      return { project, totalUsers: 0, users: [], projectStatus: 'inactive' }
    }
    // Non-fatal — skip this project
    return { project, totalUsers: 0, users: [], projectStatus: 'active' }
  }

  const totalUsers = parseInt(countRes.headers.get('x-total-count') ?? '0', 10)

  // If no users, skip the full fetch
  if (totalUsers === 0) {
    return { project, totalUsers: 0, users: [], projectStatus: 'active' }
  }

  // Fetch first page for trend/provider analysis
  let users: UserRecord[] = []
  try {
    const usersRes = await fetch(
      `${baseUrl}/auth/v1/admin/users?per_page=50`,
      { headers, signal: AbortSignal.timeout(10_000) },
    )
    if (usersRes.ok) {
      const body = (await usersRes.json()) as { users?: UserRecord[] }
      users = body.users ?? []
    }
  } catch {
    // Non-fatal — we still have the count
  }

  return { project, totalUsers, users, projectStatus: 'active' }
}

function computeProjectStats(raw: ProjectAuthRaw): ProjectAuthPanel {
  if (raw.projectStatus === 'inactive') {
    return {
      name: raw.project.name,
      ref: raw.project.ref,
      projectStatus: 'inactive',
      totalUsers: 0,
      recentSignups: 0,
      activeRecently: 0,
      signupsTrend: 'flat',
      dauPct: 0,
      providerBreakdown: {},
      daysSinceLastSignup: null,
    }
  }

  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000
  const oneDayAgo = now - 24 * 60 * 60 * 1000
  const users = raw.users ?? []

  const recentSignups = users.filter(
    (u) => new Date(u.created_at).getTime() > sevenDaysAgo,
  ).length
  const lastWeekSignups = users.filter((u) => {
    const t = new Date(u.created_at).getTime()
    return t > fourteenDaysAgo && t <= sevenDaysAgo
  }).length
  const signupsTrend: 'up' | 'down' | 'flat' =
    recentSignups > lastWeekSignups
      ? 'up'
      : recentSignups < lastWeekSignups
        ? 'down'
        : 'flat'

  const activeRecently = users.filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > oneDayAgo,
  ).length

  const dauPct =
    raw.totalUsers > 0
      ? Math.round((activeRecently / raw.totalUsers) * 1000) / 10
      : 0

  let daysSinceLastSignup: number | null = null
  if (users.length > 0) {
    const sorted = [...users].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    if (sorted[0]) {
      daysSinceLastSignup = Math.floor(
        (now - new Date(sorted[0].created_at).getTime()) / 86_400_000,
      )
    }
  }

  const providerBreakdown: Record<string, number> = {}
  for (const u of users) {
    for (const p of u.app_metadata?.providers ?? ['email']) {
      providerBreakdown[p] = (providerBreakdown[p] ?? 0) + 1
    }
  }

  return {
    name: raw.project.name,
    ref: raw.project.ref,
    projectStatus: 'active',
    totalUsers: raw.totalUsers,
    recentSignups,
    activeRecently,
    signupsTrend,
    dauPct,
    providerBreakdown,
    daysSinceLastSignup,
  }
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const allProjects = await fetchProjectsWithKeys(config.managementKey)
  const results = await Promise.all(allProjects.map(fetchAuthForProject))
  return { projects: results }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = (raw.projects ?? []).map(computeProjectStats)
  const active = projects.filter((p) => p.projectStatus === 'active')

  return {
    projects,
    summary: {
      totalUsersAllProjects: active.reduce((s, p) => s + p.totalUsers, 0),
      totalActiveRecently: active.reduce((s, p) => s + p.activeRecently, 0),
      activeProjectCount: active.length,
    },
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.managementKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  const projects = raw.projects ?? []
  if (projects.length === 0) return 'error'
  if (projects.every((p) => p.projectStatus === 'inactive')) return 'warn'
  return 'ok'
}
```

- [ ] **Step 2: Verify backend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck`
Expected: May still fail on registry — expected

- [ ] **Step 3: Commit**

```bash
git add backend/src/integrations/supabase-auth.ts
git commit -m "feat(backend): rewrite supabase auth for multi-project auto-discovery"
```

---

## Task 4: Create Supabase Storage integration

**Files:**
- Create: `backend/src/integrations/supabase-storage.ts`

- [ ] **Step 1: Create the storage integration**

```typescript
// backend/src/integrations/supabase-storage.ts
import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { fetchProjectsWithKeys, type SupabaseProject } from '../lib/supabase-projects.js'

export const INTEGRATION_ID = 'supabase-storage' as const
export const INTEGRATION_NAME = 'Supabase Storage'
export const DEFAULT_TTL = 120
export const FETCH_TIMEOUT_MS = 30_000

export const CONFIG_SCHEMA = z.object({
  managementKey: z.string().min(1, 'Supabase access token required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

interface BucketRaw {
  id: string
  name: string
  public: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
  created_at: string
}

interface ProjectStorageRaw {
  project: SupabaseProject
  buckets: BucketRaw[]
  projectStatus: 'active' | 'inactive'
}

export interface RawData {
  projects: ProjectStorageRaw[]
}

interface BucketPanel {
  name: string
  public: boolean
  fileSizeLimit: number | null
  allowedMimeTypes: string[] | null
}

interface ProjectStoragePanel {
  name: string
  ref: string
  projectStatus: 'active' | 'inactive'
  buckets: BucketPanel[]
  bucketCount: number
}

export interface PanelData {
  projects: ProjectStoragePanel[]
  summary: {
    totalBuckets: number
    publicBuckets: number
    privateBuckets: number
    activeProjectCount: number
  }
}

async function fetchStorageForProject(
  project: SupabaseProject,
): Promise<ProjectStorageRaw> {
  if (!project.serviceKey) {
    return { project, buckets: [], projectStatus: 'inactive' }
  }

  const baseUrl = `https://${project.ref}.supabase.co`
  const headers = {
    Authorization: `Bearer ${project.serviceKey}`,
    apikey: project.serviceKey,
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}/storage/v1/bucket`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return { project, buckets: [], projectStatus: 'inactive' }
  }

  if (!res.ok) {
    if (res.status === 521) {
      return { project, buckets: [], projectStatus: 'inactive' }
    }
    return { project, buckets: [], projectStatus: 'active' }
  }

  const buckets = (await res.json()) as BucketRaw[]
  return { project, buckets: Array.isArray(buckets) ? buckets : [], projectStatus: 'active' }
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const allProjects = await fetchProjectsWithKeys(config.managementKey)
  const results = await Promise.all(allProjects.map(fetchStorageForProject))
  return { projects: results }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = (raw.projects ?? []).map((pd) => {
    const buckets = (pd.buckets ?? []).map((b) => ({
      name: b.name,
      public: b.public,
      fileSizeLimit: b.file_size_limit,
      allowedMimeTypes: b.allowed_mime_types,
    }))

    return {
      name: pd.project.name,
      ref: pd.project.ref,
      projectStatus: pd.projectStatus,
      buckets,
      bucketCount: buckets.length,
    } as ProjectStoragePanel
  })

  const active = projects.filter((p) => p.projectStatus === 'active')
  const allBuckets = active.flatMap((p) => p.buckets)

  return {
    projects,
    summary: {
      totalBuckets: allBuckets.length,
      publicBuckets: allBuckets.filter((b) => b.public).length,
      privateBuckets: allBuckets.filter((b) => !b.public).length,
      activeProjectCount: active.length,
    },
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.managementKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  const projects = raw.projects ?? []
  if (projects.length === 0) return 'error'
  if (projects.every((p) => p.projectStatus === 'inactive')) return 'warn'
  return 'ok'
}
```

- [ ] **Step 2: Verify backend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck`

- [ ] **Step 3: Commit**

```bash
git add backend/src/integrations/supabase-storage.ts
git commit -m "feat(backend): add supabase storage integration"
```

---

## Task 5: Update registry and env map

**Files:**
- Modify: `backend/src/lib/integration-registry.ts`
- Modify: `backend/src/lib/integration-env-map.ts`

- [ ] **Step 1: Update integration-registry.ts — simplify Supabase registration**

Replace the entire Supabase Management section (lines 224-247) and Supabase Auth section (lines 249-265) with a single unified block. Add storage import at the top alongside the existing imports.

Add to imports (after line 17):
```typescript
import * as supabaseStorage from '../integrations/supabase-storage.js'
```

Replace lines 224-265 (the management + auth blocks) with:
```typescript
  // Supabase — single access token powers management, auth, and storage
  const supabaseToken = envOrSkip('SUPABASE_ACCESS_TOKEN')
  if (supabaseToken) {
    integrations.push(
      runIntegration(supabaseManagement, { managementKey: supabaseToken }),
      runIntegration(supabaseAuth, { managementKey: supabaseToken }),
      runIntegration(supabaseStorage, { managementKey: supabaseToken }),
    )
  }
```

- [ ] **Step 2: Update integration-env-map.ts**

Replace the `supabase-management` and `supabase-auth` entries and add `supabase-storage`:

```typescript
  'supabase-management': {
    managementKey: 'SUPABASE_ACCESS_TOKEN',
  },
  'supabase-auth': {
    managementKey: 'SUPABASE_ACCESS_TOKEN',
  },
  'supabase-storage': {
    managementKey: 'SUPABASE_ACCESS_TOKEN',
  },
```

Add to `INTEGRATION_NAMES`:
```typescript
  'supabase-storage': 'Supabase Storage',
```

- [ ] **Step 3: Update settings route configured check**

In `backend/src/routes/settings.ts`, find the line that special-cases `self-monitoring` for the configured check. Verify it doesn't break with the new Supabase config shape. The check uses `INTEGRATION_ENV_MAP` to look up env vars — since we changed the map entries to use `SUPABASE_ACCESS_TOKEN`, it should work (that var is set).

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck`
Expected: Clean — all integrations now use compatible config shapes

- [ ] **Step 4: Run backend tests**

Run: `cd D:/Repos/whateverops && bun test tests/unit/`
Expected: All pass. Some ship-readiness tests may need minor updates if they assert on the old Supabase config shape.

- [ ] **Step 5: Commit**

```bash
git add backend/src/lib/integration-registry.ts backend/src/lib/integration-env-map.ts
git commit -m "refactor(backend): simplify Supabase to single access token, add storage"
```

---

## Task 6: Update Management panel frontend

**Files:**
- Modify: `frontend/src/components/panels/SupabaseMgmtPanel.tsx`

- [ ] **Step 1: Update the panel data interface and ProjectRow component**

Replace the entire file. Key changes:
- Remove backward-compat primary project fields from `SupabaseMgmtPanelData`
- Add `advisors: { performance, security, totalCount }` and `edgeFunctions: { total, active, items }` to project data
- Add expandable advisors section in ProjectRow
- Add edge functions line in ProjectRow

```tsx
// frontend/src/components/panels/SupabaseMgmtPanel.tsx
import { useState } from 'react'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'

interface AdvisorItem {
  name: string
  description: string
}

interface EdgeFunctionItem {
  name: string
  status: string
}

interface SupabaseProjectPanelData {
  id: string
  projectName: string
  projectStatus: string
  region: string
  dbVersion: string
  healthChecks: Array<{ name: string; status: string }>
  healthyCount: number
  totalChecks: number
  readOnly: boolean
  advisors: {
    performance: AdvisorItem[]
    security: AdvisorItem[]
    totalCount: number
  }
  edgeFunctions: {
    total: number
    active: number
    items: EdgeFunctionItem[]
  }
}

interface SupabaseMgmtPanelData {
  projectCount: number
  projects: SupabaseProjectPanelData[]
}

function AdvisorSection({ title, items }: { title: string; items: AdvisorItem[] }) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9658;</span>
        {title} ({items.length})
      </button>
      {expanded && (
        <ul className="mt-1 space-y-1 ml-3">
          {items.map((a, i) => (
            <li key={i} className="text-[10px] text-[#9090A0]">
              <span className="text-[#E2E2E8]">{a.name}</span>
              {a.description && <span> — {a.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProjectRow({
  project,
  isExpanded,
  onToggle,
}: {
  project: SupabaseProjectPanelData
  isExpanded: boolean
  onToggle: () => void
}) {
  const allHealthy = project.healthyCount === project.totalChecks && project.totalChecks > 0
  const isInactive = project.projectStatus === 'INACTIVE'

  return (
    <div className="border border-[#252535] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#2A2A3E30] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isInactive ? 'bg-[#606070]' : allHealthy ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}
          />
          <span className="text-sm font-medium text-[#E2E2E8] truncate">{project.projectName}</span>
          {isInactive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1E1E2E] text-[#606070]">paused</span>
          )}
          {project.advisors.totalCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B15] text-[#F59E0B]">
              {project.advisors.totalCount} advisor{project.advisors.totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isInactive && (
            <span className="text-xs text-[#606070]">
              {project.healthyCount}/{project.totalChecks}
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-[#606070] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && !isInactive && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#252535]">
          {project.readOnly && (
            <div className="flex items-center gap-2 text-xs bg-[#EF444410] border border-[#EF444415] rounded px-2.5 py-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0 animate-pulse" />
              <span className="text-[#F87171] font-medium">READ-ONLY MODE — immediate action needed</span>
            </div>
          )}

          {/* Health check dots */}
          {project.healthChecks.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              {project.healthChecks.map((check) => (
                <div key={check.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      check.status === 'ok' || check.status === 'ACTIVE_HEALTHY'
                        ? 'bg-[#10B981]'
                        : 'bg-[#EF4444]'
                    }`}
                  />
                  <span className="text-[#9090A0]">{check.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Edge Functions */}
          {project.edgeFunctions.total > 0 && (
            <div className="flex items-center gap-2 text-xs mt-1">
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  project.edgeFunctions.active === project.edgeFunctions.total
                    ? 'bg-[#10B981]'
                    : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-[#9090A0]">
                {project.edgeFunctions.total} edge function{project.edgeFunctions.total !== 1 ? 's' : ''}
                {project.edgeFunctions.active < project.edgeFunctions.total &&
                  ` (${project.edgeFunctions.active} active)`}
              </span>
            </div>
          )}

          {/* Advisors */}
          {project.advisors.totalCount > 0 && (
            <div className="space-y-1 mt-1">
              <AdvisorSection title="Performance" items={project.advisors.performance} />
              <AdvisorSection title="Security" items={project.advisors.security} />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-[#606070] pt-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.projectStatus} />
              <span>{project.region}</span>
              <span>PG {project.dbVersion}</span>
            </div>
            <ExternalLink
              href={`https://supabase.com/dashboard/project/${project.id}`}
              className="text-[#606070] hover:text-[#9090A0]"
            >
              Dashboard
            </ExternalLink>
          </div>
        </div>
      )}
    </div>
  )
}

export function SupabaseMgmtPanel({ data }: { data: SupabaseMgmtPanelData }) {
  if (!data) return null
  const projects = data.projects ?? []
  const activeProjects = projects.filter((p) => p.projectStatus !== 'INACTIVE')
  const allHealthy = activeProjects.every(
    (p) => p.healthyCount === p.totalChecks && p.totalChecks > 0,
  )
  const totalHealthy = activeProjects.reduce((s, p) => s + p.healthyCount, 0)
  const totalChecks = activeProjects.reduce((s, p) => s + p.totalChecks, 0)
  const hasReadOnly = projects.some((p) => p.readOnly)

  const defaultExpanded = projects.findIndex(
    (p) =>
      p.readOnly ||
      p.advisors.totalCount > 0 ||
      (p.healthyCount < p.totalChecks && p.totalChecks > 0),
  )
  const [expandedIndex, setExpandedIndex] = useState(defaultExpanded >= 0 ? defaultExpanded : 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${hasReadOnly ? 'bg-[#EF4444] animate-pulse' : allHealthy ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
          />
          <span className="text-lg font-bold text-[#E2E2E8]">
            {hasReadOnly ? 'Action Required' : allHealthy ? 'All Healthy' : 'Issues Detected'}
          </span>
        </div>
        <span className="text-xs text-[#606070]">
          {totalHealthy}/{totalChecks} checks passing
        </span>
      </div>

      <div className="space-y-1.5">
        {projects.map((project, i) => (
          <ProjectRow
            key={project.id}
            project={project}
            isExpanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(expandedIndex === i ? -1 : i)}
          />
        ))}
      </div>

      <div className="text-[10px] text-[#606070]">
        {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/panels/SupabaseMgmtPanel.tsx
git commit -m "feat(frontend): add advisors + edge functions to supabase management panel"
```

---

## Task 7: Update Auth panel frontend for multi-project

**Files:**
- Modify: `frontend/src/components/panels/SupabaseAuthPanel.tsx`

- [ ] **Step 1: Rewrite SupabaseAuthPanel for multi-project layout**

Replace the entire file. Key changes:
- New data shape with `projects[]` and `summary`
- Summary row at top (hidden if 1 active project)
- Per-project rows with expandable provider breakdown
- Paused projects sorted to bottom

```tsx
// frontend/src/components/panels/SupabaseAuthPanel.tsx
import { useState } from 'react'
import { MiniBar } from '../ui/MiniBar'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber } from '../../lib/format'

interface ProjectAuth {
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
}

interface SupabaseAuthPanelData {
  projects: ProjectAuth[]
  summary: {
    totalUsersAllProjects: number
    totalActiveRecently: number
    activeProjectCount: number
  }
}

const PROVIDER_COLORS: Record<string, string> = {
  email: '#3B82F6',
  google: '#34A853',
  github: '#9CA3AF',
  apple: '#A2AAAD',
  twitter: '#1DA1F2',
  discord: '#5865F2',
  facebook: '#1877F2',
}

function ProjectAuthRow({ project }: { project: ProjectAuth }) {
  const [showProviders, setShowProviders] = useState(false)

  if (project.projectStatus === 'inactive') {
    return (
      <div className="flex items-center justify-between py-2 px-3 border border-[#252535] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#606070] shrink-0" />
          <span className="text-sm text-[#9090A0]">{project.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B15] text-[#F59E0B]">Paused</span>
        </div>
      </div>
    )
  }

  const providers = Object.entries(project.providerBreakdown)
  const providerSegments = providers.map(([name, count]) => ({
    value: count,
    color: PROVIDER_COLORS[name.toLowerCase()] ?? '#6B7280',
    label: name,
  }))

  const trendColor =
    project.signupsTrend === 'up'
      ? 'bg-[#10B98120] text-[#10B981]'
      : project.signupsTrend === 'down'
        ? 'bg-[#EF444420] text-[#EF4444]'
        : 'bg-[#1E1E2E] text-[#9090A0]'

  return (
    <div className="border border-[#252535] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-sm font-medium text-[#E2E2E8] truncate">{project.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-[#E2E2E8]">{smartNumber(project.totalUsers)}</span>
          {project.recentSignups > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${trendColor}`}>
              +{project.recentSignups}
            </span>
          )}
        </div>
      </div>

      {/* Expandable details */}
      <div className="px-3 pb-2 space-y-2">
        <div className="flex items-center gap-4 text-[10px] text-[#606070]">
          <span>Active (24h): {project.activeRecently}</span>
          <span>DAU: {project.dauPct}%</span>
          {project.daysSinceLastSignup !== null && project.daysSinceLastSignup > 3 && (
            <span className="text-[#F59E0B]">No signups in {project.daysSinceLastSignup}d</span>
          )}
        </div>

        {providerSegments.length > 0 && providerSegments.some((s) => s.value > 0) && (
          <div>
            <button
              onClick={() => setShowProviders(!showProviders)}
              className="flex items-center gap-1.5 text-[10px] text-[#606070] hover:text-[#9090A0] transition-colors"
            >
              <span className={`transition-transform ${showProviders ? 'rotate-90' : ''}`}>&#9658;</span>
              Providers ({providers.length})
            </button>
            {showProviders && (
              <div className="mt-1.5">
                <MiniBar segments={providerSegments} height={8} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function SupabaseAuthPanel({ data }: { data: SupabaseAuthPanelData }) {
  if (!data) return null

  const projects = data.projects ?? []
  const activeProjects = projects.filter((p) => p.projectStatus === 'active')
  const pausedProjects = projects.filter((p) => p.projectStatus === 'inactive')
  const sorted = [...activeProjects, ...pausedProjects]

  if (sorted.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
            View in Supabase
          </ExternalLink>
        </div>
        <p className="text-xs text-[#606070]">No projects found</p>
      </div>
    )
  }

  const summary = data.summary

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
          View in Supabase
        </ExternalLink>
      </div>

      {/* Summary row — hidden if only 1 active project */}
      {activeProjects.length > 1 && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-[#E2E2E8]">
              {smartNumber(summary.totalUsersAllProjects)}
            </p>
            <p className="text-xs text-[#606070]">Total users across {summary.activeProjectCount} projects</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#E2E2E8]">{summary.totalActiveRecently}</p>
            <p className="text-xs text-[#606070]">Active (24h)</p>
          </div>
        </div>
      )}

      {/* Per-project rows */}
      <div className="space-y-1.5">
        {sorted.map((project) => (
          <ProjectAuthRow key={project.ref} project={project} />
        ))}
      </div>

      <div className="text-[10px] text-[#606070]">
        {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify frontend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend build`

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/panels/SupabaseAuthPanel.tsx
git commit -m "feat(frontend): multi-project supabase auth panel with summary"
```

---

## Task 8: Create Storage panel + register in Dashboard

**Files:**
- Create: `frontend/src/components/panels/SupabaseStoragePanel.tsx`
- Modify: `frontend/src/components/layout/Dashboard.tsx`

- [ ] **Step 1: Create SupabaseStoragePanel component**

```tsx
// frontend/src/components/panels/SupabaseStoragePanel.tsx
import { ExternalLink } from '../ui/ExternalLink'

interface BucketPanel {
  name: string
  public: boolean
  fileSizeLimit: number | null
  allowedMimeTypes: string[] | null
}

interface ProjectStorage {
  name: string
  ref: string
  projectStatus: 'active' | 'inactive'
  buckets: BucketPanel[]
  bucketCount: number
}

interface SupabaseStoragePanelData {
  projects: ProjectStorage[]
  summary: {
    totalBuckets: number
    publicBuckets: number
    privateBuckets: number
    activeProjectCount: number
  }
}

function formatFileSize(bytes: number | null): string | null {
  if (bytes == null) return null
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(0)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`
  return `${bytes} B`
}

function ProjectStorageRow({ project }: { project: ProjectStorage }) {
  if (project.projectStatus === 'inactive') {
    return (
      <div className="flex items-center justify-between py-2 px-3 border border-[#252535] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#606070] shrink-0" />
          <span className="text-sm text-[#9090A0]">{project.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B15] text-[#F59E0B]">Paused</span>
        </div>
      </div>
    )
  }

  if (project.buckets.length === 0) {
    return (
      <div className="flex items-center justify-between py-2 px-3 border border-[#252535] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-sm text-[#E2E2E8]">{project.name}</span>
        </div>
        <span className="text-[10px] text-[#606070]">No buckets</span>
      </div>
    )
  }

  return (
    <div className="border border-[#252535] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-sm font-medium text-[#E2E2E8]">{project.name}</span>
        </div>
        <span className="text-xs text-[#606070]">
          {project.bucketCount} bucket{project.bucketCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="px-3 pb-2 space-y-1">
        {project.buckets.map((bucket) => (
          <div key={bucket.name} className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <span className="text-[#E2E2E8]">{bucket.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  bucket.public
                    ? 'bg-[#10B98115] text-[#10B981]'
                    : 'bg-[#1E1E2E] text-[#606070]'
                }`}
              >
                {bucket.public ? 'Public' : 'Private'}
              </span>
            </div>
            {bucket.fileSizeLimit && (
              <span className="text-[10px] text-[#606070]">
                {formatFileSize(bucket.fileSizeLimit)} max
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SupabaseStoragePanel({ data }: { data: SupabaseStoragePanelData }) {
  if (!data) return null

  const projects = data.projects ?? []
  const activeProjects = projects.filter((p) => p.projectStatus === 'active')
  const pausedProjects = projects.filter((p) => p.projectStatus === 'inactive')
  const sorted = [...activeProjects, ...pausedProjects]

  if (sorted.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
            View in Supabase
          </ExternalLink>
        </div>
        <p className="text-xs text-[#606070]">No projects found</p>
      </div>
    )
  }

  const summary = data.summary

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
          View in Supabase
        </ExternalLink>
      </div>

      {/* Summary — hidden if only 1 project */}
      {activeProjects.length > 1 && (
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-[#E2E2E8]">{summary.totalBuckets}</p>
            <p className="text-xs text-[#606070]">Total buckets</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#606070]">
            <span className="text-[#10B981]">{summary.publicBuckets} public</span>
            <span>·</span>
            <span>{summary.privateBuckets} private</span>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {sorted.map((project) => (
          <ProjectStorageRow key={project.ref} project={project} />
        ))}
      </div>

      <div className="text-[10px] text-[#606070]">
        {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Register in Dashboard.tsx**

Add import (after line 20):
```tsx
import { SupabaseStoragePanel } from '../panels/SupabaseStoragePanel'
```

Add to `WIDE_PANELS` set:
```tsx
const WIDE_PANELS = new Set(['stripe', 'github', 'sentry', 'supabase-management', 'supabase-storage'])
```

Add to `PANEL_MAP` (after `supabase-auth` entry):
```tsx
  'supabase-storage': SupabaseStoragePanel,
```

Add `'supabase-storage'` to the Health group integrations array (after `'supabase-management'`):
```tsx
  integrations: [
    'sentry',
    'vercel',
    'railway',
    'neon',
    'supabase-management',
    'supabase-storage',
    'cloudflare',
    'self-monitoring',
  ],
```

- [ ] **Step 3: Verify frontend builds**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend build`
Expected: Build succeeds

- [ ] **Step 4: Run frontend tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`
Expected: All pass (existing panel smoke tests may need a mock data update for the new panel data shape)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/panels/SupabaseStoragePanel.tsx frontend/src/components/layout/Dashboard.tsx
git commit -m "feat(frontend): add supabase storage panel + register in dashboard"
```

---

## Task 9: Full verification

- [ ] **Step 1: Run backend typecheck**

Run: `cd D:/Repos/whateverops && pnpm --filter backend typecheck`
Expected: Clean

- [ ] **Step 2: Run all backend tests**

Run: `cd D:/Repos/whateverops && bun test tests/unit/`
Expected: All pass. If ship-readiness tests fail due to changed Supabase config/data shapes, update mock data in those tests to match new shapes.

- [ ] **Step 3: Run all frontend tests**

Run: `cd D:/Repos/whateverops && pnpm --filter frontend test`
Expected: All pass. Update panel smoke test mock data if needed for new data shapes.

- [ ] **Step 4: Build both packages**

Run: `cd D:/Repos/whateverops && pnpm build`
Expected: Both succeed

- [ ] **Step 5: Start dev server and verify live**

Run: `cd D:/Repos/whateverops && pnpm dev`

Verify in browser:
- Management card shows projects with advisors badges + edge functions line
- Auth card shows all projects with per-project user counts
- Storage card appears in Health group with bucket listing
- Paused projects show yellow badges in all three cards

- [ ] **Step 6: Commit any test fixes**

```bash
git add tests/ frontend/src/
git commit -m "test: update mocks for new supabase data shapes"
```
