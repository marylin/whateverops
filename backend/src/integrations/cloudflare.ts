import { z } from 'zod'

export const INTEGRATION_ID = 'cloudflare' as const
export const INTEGRATION_NAME = 'Cloudflare'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Cloudflare API token required'),
  zoneId: z.string().min(1),
  accountId: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  totals: {
    requests: number
    bandwidth: number
    threats: number
    cachedRequests: number
    cachedBandwidth: number
  }
  zoneName: string
  zoneStatus: string
}

export interface PanelData {
  requests24h: number
  bandwidth24h: string
  threatsBlocked: number
  cacheHitRatio: number
  zoneName: string
  zoneStatus: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = 'https://api.cloudflare.com/client/v4'

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [zoneRes, analyticsRes] = await Promise.all([
    fetch(`${base}/zones/${config.zoneId}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(
      `${base}/zones/${config.zoneId}/analytics/dashboard?since=${since}&continuous=true`,
      { headers, signal: AbortSignal.timeout(10_000) },
    ),
  ])

  if (!zoneRes.ok) throw new Error(`Cloudflare API error: ${zoneRes.status}`)

  const zoneBody = (await zoneRes.json()) as {
    result?: { name?: string; status?: string }
  }
  const analyticsBody = analyticsRes.ok
    ? ((await analyticsRes.json()) as {
        result?: {
          totals?: {
            requests?: { all?: number; cached?: number }
            bandwidth?: { all?: number; cached?: number }
            threats?: { all?: number }
          }
        }
      })
    : { result: { totals: {} } }

  const totals = analyticsBody.result?.totals ?? {}

  return {
    totals: {
      requests: totals.requests?.all ?? 0,
      bandwidth: totals.bandwidth?.all ?? 0,
      threats: totals.threats?.all ?? 0,
      cachedRequests: totals.requests?.cached ?? 0,
      cachedBandwidth: totals.bandwidth?.cached ?? 0,
    },
    zoneName: zoneBody.result?.name ?? '',
    zoneStatus: zoneBody.result?.status ?? 'unknown',
  }
}

export function parsePanel(raw: RawData): PanelData {
  const totalReqs = raw.totals?.requests ?? 0
  const cachedReqs = raw.totals?.cachedRequests ?? 0
  const cacheHitRatio = totalReqs > 0 ? Math.round((cachedReqs / totalReqs) * 100) : 0

  return {
    requests24h: totalReqs,
    bandwidth24h: formatBytes(raw.totals?.bandwidth ?? 0),
    threatsBlocked: raw.totals?.threats ?? 0,
    cacheHitRatio,
    zoneName: raw.zoneName ?? '',
    zoneStatus: raw.zoneStatus ?? 'unknown',
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = Bun.hash(config.apiKey + config.zoneId)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.zoneStatus === 'deactivated') return 'error'
  if (raw.zoneStatus !== 'active') return 'warn'
  if ((raw.totals?.threats ?? 0) > 100) return 'warn'
  return 'ok'
}
