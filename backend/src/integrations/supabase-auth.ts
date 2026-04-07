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

async function fetchAuthForProject(project: SupabaseProject): Promise<ProjectAuthRaw> {
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

    // 500 often means auth DB schema issue (common after project pause/resume).
    // Try the health endpoint to distinguish "service down" from "DB issue".
    if (countRes.status === 500) {
      const baseUrl = `https://${project.ref}.supabase.co`
      const healthRes = await fetch(`${baseUrl}/auth/v1/health`, {
        headers: { apikey: project.serviceKey! },
        signal: AbortSignal.timeout(5_000),
      }).catch(() => null)

      if (healthRes?.ok) {
        // Auth service is running but can't query users — likely DB schema issue.
        return { project, totalUsers: 0, users: [], projectStatus: 'active' }
      }
      // Service is actually down
      return { project, totalUsers: 0, users: [], projectStatus: 'inactive' }
    }

    // Other non-fatal errors — skip this project
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
    const usersRes = await fetch(`${baseUrl}/auth/v1/admin/users?per_page=50`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    })
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

  const recentSignups = users.filter((u) => new Date(u.created_at).getTime() > sevenDaysAgo).length
  const lastWeekSignups = users.filter((u) => {
    const t = new Date(u.created_at).getTime()
    return t > fourteenDaysAgo && t <= sevenDaysAgo
  }).length
  const signupsTrend: 'up' | 'down' | 'flat' =
    recentSignups > lastWeekSignups ? 'up' : recentSignups < lastWeekSignups ? 'down' : 'flat'

  const activeRecently = users.filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > oneDayAgo,
  ).length

  const dauPct = raw.totalUsers > 0 ? Math.round((activeRecently / raw.totalUsers) * 1000) / 10 : 0

  let daysSinceLastSignup: number | null = null
  if (users.length > 0) {
    const sorted = [...users].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
  if (process.env.MOCK_PREVIEW === 'true') {
    const now = new Date()
    const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86400_000).toISOString()
    const prodProject: SupabaseProject = {
      ref: 'ref_prod',
      name: 'prod-app',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      dbVersion: '15.1.1.131',
      serviceKey: 'mock-service-key-prod',
    }
    const stgProject: SupabaseProject = {
      ref: 'ref_stg',
      name: 'staging-app',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      dbVersion: '15.1.1.131',
      serviceKey: 'mock-service-key-stg',
    }
    const devProject: SupabaseProject = {
      ref: 'ref_dev',
      name: 'dev-sandbox',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      dbVersion: '15.1.1.131',
      serviceKey: 'mock-service-key-dev',
    }
    // Build 1,247 total users with a sample of 50 for trend analysis
    const prodUsers: UserRecord[] = Array.from({ length: 23 }, (_, i) => ({
      id: `user_${i + 1}`,
      created_at: d(i % 7),
      last_sign_in_at: i < 12 ? d(0) : d(3),
      email: `user${i + 1}@example.com`,
      app_metadata: { providers: i % 3 === 0 ? ['google'] : ['email'] },
    }))
    return {
      projects: [
        { project: prodProject, totalUsers: 1247, users: prodUsers, projectStatus: 'active' },
        {
          project: stgProject,
          totalUsers: 45,
          users: Array.from({ length: 45 }, (_, i) => ({
            id: `stg_user_${i + 1}`,
            created_at: d(i * 2),
            last_sign_in_at: i < 5 ? d(1) : null,
            email: `stg${i + 1}@example.com`,
            app_metadata: { providers: ['email'] },
          })),
          projectStatus: 'active',
        },
        {
          project: devProject,
          totalUsers: 3,
          users: [
            {
              id: 'dev_user_1',
              created_at: d(10),
              last_sign_in_at: d(1),
              email: 'dev1@example.com',
              app_metadata: { providers: ['email'] },
            },
            {
              id: 'dev_user_2',
              created_at: d(20),
              last_sign_in_at: d(5),
              email: 'dev2@example.com',
              app_metadata: { providers: ['email'] },
            },
            {
              id: 'dev_user_3',
              created_at: d(30),
              last_sign_in_at: null,
              email: 'dev3@example.com',
              app_metadata: { providers: ['email'] },
            },
          ],
          projectStatus: 'active',
        },
      ],
    }
  }

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
