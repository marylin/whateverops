import { z } from 'zod'

export const INTEGRATION_ID = 'supabase-management' as const
export const INTEGRATION_NAME = 'Supabase'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Supabase service key required'),
  projectRef: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  project: {
    id: string
    name: string
    status: string
    region: string
    database: {
      host: string
      version: string
    }
  } | null
  health: Array<{
    name: string
    status: string
    error: string
  }>
}

export interface PanelData {
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
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = 'https://api.supabase.com/v1'

  const [projectRes, healthRes] = await Promise.all([
    fetch(`${base}/projects/${config.projectRef}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${base}/projects/${config.projectRef}/health`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ])

  if (!projectRes.ok) throw new Error(`Supabase API error: ${projectRes.status}`)

  const project = (await projectRes.json()) as RawData['project']
  const healthBody = healthRes.ok ? ((await healthRes.json()) as RawData['health']) : []

  return { project, health: healthBody ?? [] }
}

export function parsePanel(raw: RawData): PanelData {
  const health = raw.health ?? []
  const healthyCount = health.filter((h) => h.status === 'HEALTHY').length

  return {
    projectName: raw.project?.name ?? 'Unknown',
    projectStatus: raw.project?.status ?? 'unknown',
    region: raw.project?.region ?? '',
    dbVersion: raw.project?.database?.version ?? '',
    healthChecks: health.map((h) => ({ name: h.name, status: h.status })),
    healthyCount,
    totalChecks: health.length,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = Bun.hash(config.apiKey + config.projectRef)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.project) return 'error'
  if (raw.project.status !== 'ACTIVE_HEALTHY') return 'warn'
  const unhealthy = (raw.health ?? []).filter((h) => h.status !== 'HEALTHY')
  if (unhealthy.length > 0) return 'warn'
  return 'ok'
}
