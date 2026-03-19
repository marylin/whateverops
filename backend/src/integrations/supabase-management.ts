import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'supabase-management' as const
export const INTEGRATION_NAME = 'Supabase'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Supabase service key required'),
  projectRef: z.string().optional(),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface PerformanceAdvisor {
  id: string
  reason: string
  type: string
}

export interface ProjectData {
  id: string
  name: string
  status: string
  region: string
  database: {
    host: string
    version: string
  }
  organization_id?: string
}

export interface ProjectDetail {
  project: ProjectData | null
  health: Array<{
    name: string
    status: string
    error?: string
  }>
  readOnly: boolean
  advisors: PerformanceAdvisor[]
}

export interface RawData {
  projects: ProjectDetail[]
  apiRequestCount: number | null
}

export interface ProjectPanelData {
  id: string
  projectName: string
  projectStatus: string
  region: string
  dbVersion: string
  healthChecks: Array<{
    name: string
    status: string
  }>
  healthyCount: number
  totalChecks: number
  readOnly: boolean
  advisorCount: number
  advisors: Array<{ reason: string; type: string }>
}

export interface PanelData {
  projectCount: number
  projects: ProjectPanelData[]
  // Primary project fields for backward compatibility
  projectName: string
  projectStatus: string
  region: string
  dbVersion: string
  healthChecks: Array<{
    name: string
    status: string
  }>
  healthyCount: number
  totalChecks: number
  readOnly: boolean
  advisorCount: number
  advisors: Array<{ reason: string; type: string }>
  apiRequestCount: number | null
}

async function sbFetch(url: string, headers: Record<string, string>): Promise<Response> {
  return fetch(url, { headers, signal: AbortSignal.timeout(10_000) })
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = 'https://api.supabase.com/v1'

  // Always list ALL projects — a solopreneur typically has multiple.
  // projectRef is kept for backward compat but we fetch everything.
  {
    const listRes = await sbFetch(`${base}/projects`, headers)
    if (!listRes.ok)
      throw new Error(
        apiError(listRes.status, {
          401: 'Authentication failed — check SUPABASE_ACCESS_TOKEN (generate at supabase.com/dashboard → Account → Access Tokens)',
        }),
      )
    const projectsList = (await listRes.json()) as Array<{
      id: string
      ref: string
      name: string
      region: string
      status: string
      database?: { version?: string }
    }>
    // Use list data directly — avoids per-project detail calls (rate limit friendly).
    // Only fetch health for ACTIVE projects (skip paused/inactive).
    const activeRefs = projectsList
      .filter((p) => p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE_UNHEALTHY')
      .map((p) => p.ref)

    const healthResults = await Promise.all(
      activeRefs.map(async (ref) => {
        const res = await sbFetch(
          `${base}/projects/${ref}/health?services=auth,realtime,rest,storage`,
          headers,
        ).catch(() => null)
        const body = res?.ok
          ? ((await res.json()) as Array<{ name: string; status: string; healthy?: boolean }>)
          : []
        return { ref, health: body }
      }),
    )

    const healthMap = new Map(healthResults.map((h) => [h.ref, h.health]))

    const projects: ProjectDetail[] = projectsList.map((p) => {
      const health = healthMap.get(p.ref) ?? []
      return {
        project: {
          id: p.id,
          name: p.name,
          status: p.status,
          region: p.region,
          database: p.database ?? { version: 'unknown' },
        } as ProjectData,
        health: health.map((h) => ({
          name: h.name,
          status: h.healthy ? 'ACTIVE_HEALTHY' : (h.status ?? 'UNKNOWN'),
        })),
        readOnly: false,
        advisors: [],
      } as ProjectDetail
    })

    return { projects, apiRequestCount: null }
  }
}

export function parsePanel(raw: RawData): PanelData {
  const projectDetails = (raw.projects ?? []).map((pd) => {
    const health = pd.health ?? []
    const healthyCount = health.filter(
      (h) => h.status === 'HEALTHY' || h.status === 'ACTIVE_HEALTHY',
    ).length
    const advisors = (pd.advisors ?? []).map((a) => ({ reason: a.reason, type: a.type }))

    return {
      id: pd.project?.id ?? '',
      projectName: pd.project?.name ?? 'Unknown',
      projectStatus: pd.project?.status ?? 'unknown',
      region: pd.project?.region ?? '',
      dbVersion: pd.project?.database?.version ?? '',
      healthChecks: health.map((h) => ({ name: h.name, status: h.status })),
      healthyCount,
      totalChecks: health.length,
      readOnly: pd.readOnly ?? false,
      advisorCount: advisors.length,
      advisors: advisors.slice(0, 5),
    } as ProjectPanelData
  })

  // Primary = first project for backward compat
  const primary = projectDetails[0]

  return {
    projectCount: projectDetails.length,
    projects: projectDetails,
    projectName: primary?.projectName ?? 'Unknown',
    projectStatus: primary?.projectStatus ?? 'unknown',
    region: primary?.region ?? '',
    dbVersion: primary?.dbVersion ?? '',
    healthChecks: primary?.healthChecks ?? [],
    healthyCount: primary?.healthyCount ?? 0,
    totalChecks: primary?.totalChecks ?? 0,
    readOnly: primary?.readOnly ?? false,
    advisorCount: primary?.advisorCount ?? 0,
    advisors: primary?.advisors ?? [],
    apiRequestCount: raw.apiRequestCount ?? null,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + (config.projectRef ?? ''))
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  const projects = raw.projects ?? []
  if (projects.length === 0) return 'error'

  let hasWarn = false
  for (const pd of projects) {
    if (!pd.project) continue
    // INACTIVE is intentional (paused projects) — only warn on truly unhealthy
    if (pd.project.status === 'ACTIVE_UNHEALTHY') hasWarn = true
    const unhealthy = (pd.health ?? []).filter(
      (h) => h.status !== 'HEALTHY' && h.status !== 'ACTIVE_HEALTHY',
    )
    if (unhealthy.length > 0) hasWarn = true
    if (pd.readOnly) hasWarn = true
    if ((pd.advisors ?? []).length > 0) hasWarn = true
  }

  return hasWarn ? 'warn' : 'ok'
}
