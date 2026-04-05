import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'cloudflare' as const
export const INTEGRATION_NAME = 'Cloudflare'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Cloudflare API token required'),
  zoneId: z.string().min(1),
  accountId: z.string().optional(),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface SslCertPack {
  id: string
  type: string
  status: string
  hosts: string[]
}

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
  sslCerts: SslCertPack[]
  responseStatusCounts: Record<string, number>
  firewallEventsCount: number
}

export interface PanelData {
  requests24h: number
  bandwidth24h: string
  threatsBlocked: number
  cacheHitRatio: number
  zoneName: string
  zoneStatus: string
  sslStatus: string
  sslCertCount: number
  responseBreakdown: { status2xx: number; status3xx: number; status4xx: number; status5xx: number }
  firewallEventsCount: number
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
    fetch(`${base}/graphql`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query {
      viewer {
        zones(filter: { zoneTag: "${config.zoneId}" }) {
          httpRequests1dGroups(
            filter: { date_geq: "${since.split('T')[0]}" }
            limit: 1
          ) {
            sum {
              requests
              cachedRequests
              bytes
              cachedBytes
              threats
              responseStatusMap {
                edgeResponseStatus
                requests
              }
            }
          }
        }
      }
    }`,
      }),
      signal: AbortSignal.timeout(10_000),
    }),
  ])

  if (!zoneRes.ok)
    throw new Error(
      apiError(zoneRes.status, {
        400: 'Bad request — verify CLOUDFLARE_ZONE_ID in .env',
        403: 'Token lacks Zone read permissions — update at dash.cloudflare.com → API Tokens',
        404: 'Zone not found — check CLOUDFLARE_ZONE_ID in .env',
      }),
    )

  const zoneBody = (await zoneRes.json()) as {
    result?: { name?: string; status?: string }
  }
  const gqlBody = analyticsRes.ok ? await analyticsRes.json() : { data: null }
  const groups = gqlBody?.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? []
  const sum = groups[0]?.sum ?? {}

  const totals = {
    requests: { all: sum.requests ?? 0, cached: sum.cachedRequests ?? 0 },
    bandwidth: { all: sum.bytes ?? 0, cached: sum.cachedBytes ?? 0 },
    threats: { all: sum.threats ?? 0 },
  }

  // Fetch SSL cert packs
  let sslCerts: SslCertPack[] = []
  try {
    const sslRes = await fetch(`${base}/zones/${config.zoneId}/ssl/certificate_packs?status=all`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    })
    if (sslRes.ok) {
      const sslBody = (await sslRes.json()) as {
        result?: Array<{ id: string; type: string; status: string; hosts: string[] }>
      }
      sslCerts = (sslBody.result ?? []).map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        hosts: c.hosts,
      }))
    }
  } catch {
    // graceful fallback
  }

  // Extract response status codes from analytics
  const statusCounts: Record<string, number> = {}
  for (const entry of sum.responseStatusMap ?? []) {
    statusCounts[String(entry.edgeResponseStatus)] = entry.requests
  }

  // Firewall events count from threats
  const firewallEventsCount = totals.threats?.all ?? 0

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
    sslCerts,
    responseStatusCounts: statusCounts,
    firewallEventsCount,
  }
}

export function parsePanel(raw: RawData): PanelData {
  const totalReqs = raw.totals?.requests ?? 0
  const cachedReqs = raw.totals?.cachedRequests ?? 0
  const cacheHitRatio = totalReqs > 0 ? Math.round((cachedReqs / totalReqs) * 100) : 0

  const statusCounts = raw.responseStatusCounts ?? {}
  const sumRange = (min: number, max: number) =>
    Object.entries(statusCounts)
      .filter(([code]) => Number(code) >= min && Number(code) <= max)
      .reduce((sum, [, count]) => sum + count, 0)

  const activeCerts = (raw.sslCerts ?? []).filter((c) => c.status === 'active')
  const sslStatus =
    raw.sslCerts?.length === 0 ? 'none' : activeCerts.length > 0 ? 'active' : 'pending'

  return {
    requests24h: totalReqs,
    bandwidth24h: formatBytes(raw.totals?.bandwidth ?? 0),
    threatsBlocked: raw.totals?.threats ?? 0,
    cacheHitRatio,
    zoneName: raw.zoneName ?? '',
    zoneStatus: raw.zoneStatus ?? 'unknown',
    sslStatus,
    sslCertCount: (raw.sslCerts ?? []).length,
    responseBreakdown: {
      status2xx: sumRange(200, 299),
      status3xx: sumRange(300, 399),
      status4xx: sumRange(400, 499),
      status5xx: sumRange(500, 599),
    },
    firewallEventsCount: raw.firewallEventsCount ?? 0,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.zoneId)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.zoneStatus === 'deactivated') return 'error'
  if (raw.zoneStatus !== 'active') return 'warn'
  if ((raw.totals?.threats ?? 0) > 100) return 'warn'
  // SSL certs all pending/expired → warn
  if ((raw.sslCerts ?? []).length > 0 && (raw.sslCerts ?? []).every((c) => c.status !== 'active'))
    return 'warn'
  return 'ok'
}
