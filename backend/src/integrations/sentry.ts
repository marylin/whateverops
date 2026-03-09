import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'sentry' as const
export const INTEGRATION_NAME = 'Sentry'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Sentry auth token required'),
  org: z.string().min(1),
  project: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  unresolvedIssues: number
  latestIssues: Array<{
    id: string
    title: string
    culprit: string
    count: string
    firstSeen: string
    lastSeen: string
    level: string
  }>
  stats: {
    events24h: number
  }
}

export interface PanelData {
  unresolvedCount: number
  events24h: number
  latestIssues: Array<{
    id: string
    title: string
    culprit: string
    count: number
    level: string
    lastSeen: string
  }>
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = `https://sentry.io/api/0/projects/${config.org}/${config.project}`

  const [issuesRes, statsRes] = await Promise.all([
    fetch(`${base}/issues/?query=is:unresolved&limit=5&sort=date`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${base}/stats/?stat=received&resolution=1d`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ])

  if (!issuesRes.ok)
    throw new Error(
      apiError(issuesRes.status, {
        401: 'Authentication failed — check your SENTRY_AUTH_TOKEN',
        403: 'Token lacks project:read scope — update at sentry.io → Settings → Auth Tokens',
        404: 'Project not found — check SENTRY_ORG and SENTRY_PROJECT in .env',
      }),
    )

  const issues = (await issuesRes.json()) as RawData['latestIssues']
  const statsData = statsRes.ok ? ((await statsRes.json()) as Array<[number, number]>) : []
  const events24h = statsData.length > 0 ? (statsData[statsData.length - 1]![1] ?? 0) : 0

  return {
    unresolvedIssues: issues.length,
    latestIssues: issues,
    stats: { events24h },
  }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    unresolvedCount: raw.unresolvedIssues ?? 0,
    events24h: raw.stats?.events24h ?? 0,
    latestIssues: (raw.latestIssues ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      culprit: i.culprit,
      count: parseInt(i.count, 10) || 0,
      level: i.level,
      lastSeen: i.lastSeen,
    })),
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.org + config.project)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.latestIssues) return 'error'
  const hasError = raw.latestIssues.some((i) => i.level === 'error' || i.level === 'fatal')
  if (hasError) return 'warn'
  return 'ok'
}
