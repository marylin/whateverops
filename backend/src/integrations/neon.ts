import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'neon' as const
export const INTEGRATION_NAME = 'Neon'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Neon API key required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface BranchInfo {
  id: string
  name: string
  primary: boolean
  currentState: string
  logicalSize: number | null
}

export interface EndpointInfo {
  id: string
  branchId: string
  type: string
  currentState: string
  host: string
  autoscalingMinCu: number
  autoscalingMaxCu: number
}

export interface ConsumptionData {
  activeTimeSeconds: number
  computeTimeSeconds: number
  dataStorageBytesHour: number
  writtenDataBytes: number
  dataTransferBytes: number
}

export interface RawData {
  projects: Array<{
    id: string
    name: string
    region_id: string
    created_at: string
    updated_at: string
    pg_version: number
  }>
  branches: Record<string, BranchInfo[]>
  endpoints: Record<string, EndpointInfo[]>
  consumption: Record<string, ConsumptionData>
}

export interface PanelData {
  projectCount: number
  projects: Array<{
    name: string
    region: string
    pgVersion: number
    updatedAt: string
    branchCount: number
    primaryBranch: string | null
    endpointCount: number
    endpointStatus: string | null
    activeTimeSec: number
    computeTimeSec: number
    storageMB: number
  }>
  totalBranches: number
  totalEndpoints: number
  allEndpointsActive: boolean
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const orgId = process.env.NEON_ORG_ID
  const url = orgId
    ? `https://console.neon.tech/api/v2/projects?org_id=${encodeURIComponent(orgId)}`
    : 'https://console.neon.tech/api/v2/projects'
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok)
    throw new Error(
      apiError(res.status, {
        400: 'Bad request — verify your NEON_API_KEY format in .env',
        401: 'Authentication failed — regenerate key at console.neon.tech → Settings → API Keys',
      }),
    )

  const body = (await res.json()) as { projects?: RawData['projects'] }
  const projects = body.projects ?? []
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    Accept: 'application/json',
  }
  const base = 'https://console.neon.tech/api/v2'

  // Fetch branches, endpoints, and consumption per project (max 5)
  const branches: Record<string, BranchInfo[]> = {}
  const endpoints: Record<string, EndpointInfo[]> = {}
  const consumption: Record<string, ConsumptionData> = {}

  await Promise.all(
    projects.slice(0, 5).map(async (project) => {
      const [branchRes, endpointRes, consumptionRes] = await Promise.all([
        fetch(`${base}/projects/${project.id}/branches`, {
          headers,
          signal: AbortSignal.timeout(10_000),
        }).catch(() => null),
        fetch(`${base}/projects/${project.id}/endpoints`, {
          headers,
          signal: AbortSignal.timeout(10_000),
        }).catch(() => null),
        fetch(`${base}/projects/${project.id}/consumption`, {
          headers,
          signal: AbortSignal.timeout(10_000),
        }).catch(() => null),
      ])

      if (branchRes?.ok) {
        const branchBody = (await branchRes.json()) as {
          branches?: Array<{
            id: string
            name: string
            primary: boolean
            current_state: string
            logical_size?: number | null
          }>
        }
        branches[project.id] = (branchBody.branches ?? []).map((b) => ({
          id: b.id,
          name: b.name,
          primary: b.primary,
          currentState: b.current_state,
          logicalSize: b.logical_size ?? null,
        }))
      }

      if (endpointRes?.ok) {
        const endpointBody = (await endpointRes.json()) as {
          endpoints?: Array<{
            id: string
            branch_id: string
            type: string
            current_state: string
            host: string
            autoscaling_limit_min_cu?: number
            autoscaling_limit_max_cu?: number
          }>
        }
        endpoints[project.id] = (endpointBody.endpoints ?? []).map((e) => ({
          id: e.id,
          branchId: e.branch_id,
          type: e.type,
          currentState: e.current_state,
          host: e.host,
          autoscalingMinCu: e.autoscaling_limit_min_cu ?? 0,
          autoscalingMaxCu: e.autoscaling_limit_max_cu ?? 0,
        }))
      }

      if (consumptionRes?.ok) {
        const consumptionBody = (await consumptionRes.json()) as {
          active_time_seconds?: number
          compute_time_seconds?: number
          data_storage_bytes_hour?: number
          written_data_bytes?: number
          data_transfer_bytes?: number
        }
        consumption[project.id] = {
          activeTimeSeconds: consumptionBody.active_time_seconds ?? 0,
          computeTimeSeconds: consumptionBody.compute_time_seconds ?? 0,
          dataStorageBytesHour: consumptionBody.data_storage_bytes_hour ?? 0,
          writtenDataBytes: consumptionBody.written_data_bytes ?? 0,
          dataTransferBytes: consumptionBody.data_transfer_bytes ?? 0,
        }
      }
    }),
  )

  return { projects, branches, endpoints, consumption }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = raw.projects ?? []
  const branchMap = raw.branches ?? {}
  const endpointMap = raw.endpoints ?? {}
  const consumptionMap = raw.consumption ?? {}

  let totalBranches = 0
  let totalEndpoints = 0
  let allEndpointsActive = true

  const parsedProjects = projects.slice(0, 5).map((p) => {
    const pBranches = branchMap[p.id] ?? []
    const pEndpoints = endpointMap[p.id] ?? []
    const pConsumption = consumptionMap[p.id]
    const primaryBranch = pBranches.find((b) => b.primary)

    totalBranches += pBranches.length
    totalEndpoints += pEndpoints.length

    const endpointStatus = pEndpoints[0]?.currentState ?? null
    if (pEndpoints.some((e) => e.currentState !== 'active' && e.currentState !== 'idle')) {
      allEndpointsActive = false
    }

    const storageMB = pConsumption
      ? Math.round(pConsumption.dataStorageBytesHour / (1024 * 1024))
      : 0

    return {
      name: p.name,
      region: p.region_id,
      pgVersion: p.pg_version,
      updatedAt: p.updated_at,
      branchCount: pBranches.length,
      primaryBranch: primaryBranch?.name ?? null,
      endpointCount: pEndpoints.length,
      endpointStatus,
      activeTimeSec: pConsumption?.activeTimeSeconds ?? 0,
      computeTimeSec: pConsumption?.computeTimeSeconds ?? 0,
      storageMB,
    }
  })

  return {
    projectCount: projects.length,
    projects: parsedProjects,
    totalBranches,
    totalEndpoints,
    allEndpointsActive: totalEndpoints === 0 || allEndpointsActive,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.projects) return 'error'
  if (raw.projects.length === 0) return 'warn'

  // Check for endpoints in error state
  for (const projectEndpoints of Object.values(raw.endpoints ?? {})) {
    for (const ep of projectEndpoints) {
      if (ep.currentState === 'error') return 'error'
    }
  }

  return 'ok'
}
