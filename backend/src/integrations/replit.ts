import { z } from 'zod'
import { quickHash } from '../lib/hash.js'

export const INTEGRATION_ID = 'replit' as const
export const INTEGRATION_NAME = 'Replit'
export const DEFAULT_TTL = 300

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Replit API key required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  repls: Array<{
    id: string
    title: string
    language: string
    isPrivate: boolean
    timeUpdated: string
  }>
  keyValid: boolean
}

export interface PanelData {
  keyValid: boolean
  replCount: number
  recentRepls: Array<{
    title: string
    language: string
    lastUpdated: string
  }>
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  // Replit GraphQL API
  const res = await fetch('https://replit.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'replit',
      Cookie: `connect.sid=${config.apiKey}`,
    },
    body: JSON.stringify({
      query: `query { currentUser { repls(limit: 10) { items { id title language timeUpdated isPrivate } } } }`,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    if (res.status === 401) return { repls: [], keyValid: false }
    throw new Error(`Replit API error: ${res.status}`)
  }

  const body = (await res.json()) as {
    data?: { currentUser?: { repls?: { items?: RawData['repls'] } } }
  }

  const repls = body.data?.currentUser?.repls?.items ?? []
  return { repls, keyValid: true }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    keyValid: raw.keyValid ?? false,
    replCount: raw.repls?.length ?? 0,
    recentRepls: (raw.repls ?? []).slice(0, 5).map((r) => ({
      title: r.title,
      language: r.language,
      lastUpdated: r.timeUpdated,
    })),
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.keyValid) return 'error'
  return 'ok'
}
