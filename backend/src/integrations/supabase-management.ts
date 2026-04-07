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
    const res = await sbFetch(`https://api.supabase.com/v1/projects/${ref}/advisors/${type}`, token)
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

async function fetchEdgeFunctions(ref: string, token: string): Promise<EdgeFunctionItem[]> {
  try {
    const res = await sbFetch(`https://api.supabase.com/v1/projects/${ref}/functions`, token)
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
  if (process.env.MOCK_PREVIEW === 'true') {
    const healthChecks = [
      { name: 'auth', status: 'ACTIVE_HEALTHY' },
      { name: 'realtime', status: 'ACTIVE_HEALTHY' },
      { name: 'rest', status: 'ACTIVE_HEALTHY' },
      { name: 'storage', status: 'ACTIVE_HEALTHY' },
    ]
    return {
      projects: [
        {
          project: {
            ref: 'ref_prod',
            name: 'prod-app',
            status: 'ACTIVE_HEALTHY',
            region: 'us-east-1',
            dbVersion: '15.1.1.131',
            serviceKey: 'mock-service-key-prod',
          },
          health: healthChecks,
          readOnly: false,
          advisors: {
            performance: [
              {
                name: 'Missing index on foreign key',
                description: 'Table orders.user_id has no index',
              },
              {
                name: 'Sequential scan on large table',
                description: 'Consider adding index to events.created_at',
              },
            ],
            security: [
              {
                name: 'RLS not enabled on table',
                description: 'Table user_sessions has no Row Level Security policy',
              },
            ],
          },
          edgeFunctions: [
            { name: 'send-email', status: 'ACTIVE' },
            { name: 'process-webhook', status: 'ACTIVE' },
            { name: 'resize-image', status: 'ACTIVE' },
          ],
        },
        {
          project: {
            ref: 'ref_stg',
            name: 'staging-app',
            status: 'ACTIVE_HEALTHY',
            region: 'us-east-1',
            dbVersion: '15.1.1.131',
            serviceKey: 'mock-service-key-stg',
          },
          health: healthChecks,
          readOnly: false,
          advisors: { performance: [], security: [] },
          edgeFunctions: [],
        },
        {
          project: {
            ref: 'ref_dev',
            name: 'dev-sandbox',
            status: 'ACTIVE_HEALTHY',
            region: 'us-east-1',
            dbVersion: '15.1.1.131',
            serviceKey: 'mock-service-key-dev',
          },
          health: healthChecks,
          readOnly: false,
          advisors: { performance: [], security: [] },
          edgeFunctions: [],
        },
      ],
    }
  }

  const projects = await fetchProjectsWithKeys(config.managementKey)

  const enriched = await Promise.all(
    projects.map(async (p) => {
      const isActive = p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE_UNHEALTHY'

      if (!isActive) {
        return {
          project: p,
          health: [],
          readOnly: false,
          advisors: { performance: [], security: [] },
          edgeFunctions: [],
        }
      }

      const [health, perfAdvisors, secAdvisors, edgeFunctions] = await Promise.all([
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
      (pd.advisors?.performance?.length ?? 0) + (pd.advisors?.security?.length ?? 0)
    if (advisorCount > 0) hasWarn = true
  }

  return hasWarn ? 'warn' : 'ok'
}
