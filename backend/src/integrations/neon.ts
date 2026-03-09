import { z } from 'zod'
import { quickHash } from '../lib/hash.js'

export const INTEGRATION_ID = 'neon' as const
export const INTEGRATION_NAME = 'Neon'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Neon API key required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  projects: Array<{
    id: string
    name: string
    region_id: string
    created_at: string
    updated_at: string
    pg_version: number
  }>
}

export interface PanelData {
  projectCount: number
  projects: Array<{
    name: string
    region: string
    pgVersion: number
    updatedAt: string
  }>
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const res = await fetch('https://console.neon.tech/api/v2/projects', {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`Neon API error: ${res.status}`)

  const body = (await res.json()) as { projects?: RawData['projects'] }
  return { projects: body.projects ?? [] }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = raw.projects ?? []
  return {
    projectCount: projects.length,
    projects: projects.slice(0, 5).map((p) => ({
      name: p.name,
      region: p.region_id,
      pgVersion: p.pg_version,
      updatedAt: p.updated_at,
    })),
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.projects) return 'error'
  if (raw.projects.length === 0) return 'warn'
  return 'ok'
}
