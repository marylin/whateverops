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
    userCount?: number
  }>
  stats: {
    events24h: number
  }
  crashFreeRate: number | null
  errorTrend: Array<{ timestamp: number; count: number }>
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
    userCount: number
  }>
  crashFreeRate: number | null
  errorTrend: Array<{ date: string; count: number }>
  errorTrendDirection: 'up' | 'down' | 'stable'
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = `https://sentry.io/api/0/projects/${config.org}/${config.project}`

  const orgBase = `https://sentry.io/api/0/organizations/${config.org}`

  const [issuesRes, statsRes, sessionsRes, errorVolumeRes] = await Promise.all([
    fetch(`${base}/issues/?query=is:unresolved&limit=5&sort=date`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${base}/stats/?stat=received&resolution=1d`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(
      `${orgBase}/sessions/?project=${config.project}&field=crash_free_rate(session)&statsPeriod=24h`,
      { headers, signal: AbortSignal.timeout(10_000) },
    ),
    fetch(
      `${orgBase}/stats_v2/?project=${config.project}&category=error&interval=1d&statsPeriod=7d`,
      { headers, signal: AbortSignal.timeout(10_000) },
    ),
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

  // Crash-free rate
  let crashFreeRate: number | null = null
  if (sessionsRes.ok) {
    const sessionsBody = (await sessionsRes.json()) as {
      groups?: Array<{ totals?: { 'crash_free_rate(session)'?: number } }>
    }
    const rate = sessionsBody.groups?.[0]?.totals?.['crash_free_rate(session)']
    if (rate != null) crashFreeRate = Math.round(rate * 10000) / 100
  }

  // Error volume trend (7 days)
  let errorTrend: Array<{ timestamp: number; count: number }> = []
  if (errorVolumeRes.ok) {
    const errorBody = (await errorVolumeRes.json()) as {
      intervals?: string[]
      groups?: Array<{ series?: { 'sum(quantity)'?: number[] } }>
    }
    const intervals = errorBody.intervals ?? []
    const quantities = errorBody.groups?.[0]?.series?.['sum(quantity)'] ?? []
    errorTrend = intervals.map((ts, i) => ({
      timestamp: new Date(ts).getTime(),
      count: quantities[i] ?? 0,
    }))
  }

  return {
    unresolvedIssues: issues.length,
    latestIssues: issues,
    stats: { events24h },
    crashFreeRate,
    errorTrend,
  }
}

export function parsePanel(raw: RawData): PanelData {
  const trend = raw.errorTrend ?? []
  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (trend.length >= 2) {
    const recent = trend.slice(-2)
    const prev = recent[0]!.count
    const curr = recent[1]!.count
    if (curr > prev * 1.2) direction = 'up'
    else if (curr < prev * 0.8) direction = 'down'
  }

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
      userCount: i.userCount ?? 0,
    })),
    crashFreeRate: raw.crashFreeRate ?? null,
    errorTrend: trend.map((t) => ({
      date: new Date(t.timestamp).toISOString().split('T')[0]!,
      count: t.count,
    })),
    errorTrendDirection: direction,
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

  // Crash-free rate below 99% → error; below 99.5% → warn
  if (raw.crashFreeRate != null) {
    if (raw.crashFreeRate < 99) return 'error'
    if (raw.crashFreeRate < 99.5) return 'warn'
  }

  const hasError = raw.latestIssues.some((i) => i.level === 'error' || i.level === 'fatal')
  if (hasError) return 'warn'
  return 'ok'
}
