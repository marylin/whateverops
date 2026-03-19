import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'supabase-management' as const
export const INTEGRATION_NAME = 'Supabase'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Supabase service key required'),
  projectRef: z.string().default(''),
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
    error: string
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

  // If a specific projectRef is provided, fetch only that project (backward compatible)
  // Otherwise, fetch all projects
  let projectRefs: string[]

  if (config.projectRef) {
    projectRefs = [config.projectRef]
  } else {
    const listRes = await sbFetch(`${base}/projects`, headers)
    if (!listRes.ok)
      throw new Error(
        apiError(listRes.status, {
          401: 'Authentication failed — check SUPABASE_ACCESS_TOKEN (generate at supabase.com/dashboard → Account → Access Tokens)',
        }),
      )
    const projectsList = (await listRes.json()) as Array<{ ref: string }>
    projectRefs = projectsList.map((p) => p.ref)
  }

  // Fetch details for each project in parallel
  const projects = await Promise.all(
    projectRefs.map(async (ref) => {
      const [projectRes, healthRes, readOnlyRes, advisorsRes] = await Promise.all([
        sbFetch(`${base}/projects/${ref}`, headers),
        sbFetch(`${base}/projects/${ref}/health`, headers),
        sbFetch(`${base}/projects/${ref}/readonly`, headers),
        sbFetch(`${base}/projects/${ref}/advisors/performance`, headers),
      ])

      if (!projectRes.ok) {
        // Skip projects that fail to load
        return {
          project: null,
          health: [],
          readOnly: false,
          advisors: [],
        } as ProjectDetail
      }

      const project = (await projectRes.json()) as ProjectData
      const healthBody = healthRes.ok
        ? ((await healthRes.json()) as Array<{ name: string; status: string; error: string }>)
        : []

      const readOnlyBody = readOnlyRes.ok
        ? ((await readOnlyRes.json()) as { enabled?: boolean })
        : { enabled: false }

      const advisorsRaw = advisorsRes.ok ? await advisorsRes.json() : []
      // API may return a bare array or { advisors: [...] } depending on version
      const advisorsBody: Array<{ id: string; reason: string; type: string }> = Array.isArray(
        advisorsRaw,
      )
        ? advisorsRaw
        : Array.isArray((advisorsRaw as Record<string, unknown>)?.advisors)
          ? ((advisorsRaw as Record<string, unknown>).advisors as typeof advisorsBody)
          : []

      return {
        project,
        health: healthBody ?? [],
        readOnly: readOnlyBody.enabled ?? false,
        advisors: advisorsBody ?? [],
      } as ProjectDetail
    }),
  )

  return {
    projects: projects.filter((p) => p.project !== null),
    apiRequestCount: null,
  }
}

export function parsePanel(raw: RawData): PanelData {
  const projectDetails = (raw.projects ?? []).map((pd) => {
    const health = pd.health ?? []
    const healthyCount = health.filter((h) => h.status === 'HEALTHY').length
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
    if (pd.project.status !== 'ACTIVE_HEALTHY') hasWarn = true
    const unhealthy = (pd.health ?? []).filter((h) => h.status !== 'HEALTHY')
    if (unhealthy.length > 0) hasWarn = true
    if (pd.readOnly) hasWarn = true
    if ((pd.advisors ?? []).length > 0) hasWarn = true
  }

  return hasWarn ? 'warn' : 'ok'
}
