import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'posthog' as const
export const INTEGRATION_NAME = 'PostHog'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'PostHog API key required'),
  host: z.string().url().default('https://app.posthog.com'),
  projectId: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface TrendPoint {
  date: string
  count: number
}

export interface TopEvent {
  event: string
  count: number
}

export interface RawData {
  dau: number
  wau: number
  eventsToday: number
  eventsTrend: TrendPoint[]
  topEvents: TopEvent[]
  dauTrend: TrendPoint[]
}

export interface PanelData {
  dau: number
  wau: number
  eventsToday: number
  eventsTrend: TrendPoint[]
  topEvents: TopEvent[]
  dauTrend: TrendPoint[]
  dauChangePercent: number
}

interface HogQLResult {
  results?: unknown[][]
}

interface HogQLResponse {
  results?: unknown[][]
  error?: string
}

async function hogqlQuery(
  base: string,
  headers: Record<string, string>,
  query: string,
): Promise<HogQLResult> {
  const res = await fetch(`${base}/query`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: { kind: 'HogQLQuery', query },
    }),
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(
      apiError(res.status, {
        401: 'Authentication failed — check your POSTHOG_API_KEY',
        404: 'Project not found — verify POSTHOG_PROJECT_ID in .env',
      }),
    )
  }

  const body = (await res.json()) as HogQLResponse
  if (body.error) throw new Error(`PostHog query error: ${body.error}`)
  return { results: body.results ?? [] }
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = `${config.host}/api/projects/${config.projectId}`

  const [
    dauResult,
    wauResult,
    eventsTodayResult,
    topEventsResult,
    dauTrendResult,
    eventsTrendResult,
  ] = await Promise.all([
    // 1. DAU — unique persons in last 24h
    hogqlQuery(
      base,
      headers,
      `SELECT count(DISTINCT person_id) FROM events WHERE timestamp >= now() - INTERVAL 1 DAY`,
    ),
    // 2. WAU — unique persons in last 7 days
    hogqlQuery(
      base,
      headers,
      `SELECT count(DISTINCT person_id) FROM events WHERE timestamp >= now() - INTERVAL 7 DAY`,
    ),
    // 3. Events today — total event count in last 24h
    hogqlQuery(
      base,
      headers,
      `SELECT count() FROM events WHERE timestamp >= now() - INTERVAL 1 DAY`,
    ),
    // 4. Top events — top 5 event names by volume today
    hogqlQuery(
      base,
      headers,
      `SELECT event, count() as cnt FROM events WHERE timestamp >= now() - INTERVAL 1 DAY GROUP BY event ORDER BY cnt DESC LIMIT 5`,
    ),
    // 5. DAU trend — daily unique persons for last 14 days
    hogqlQuery(
      base,
      headers,
      `SELECT toDate(timestamp) as day, count(DISTINCT person_id) as cnt FROM events WHERE timestamp >= now() - INTERVAL 14 DAY GROUP BY day ORDER BY day`,
    ),
    // 6. Events trend — daily event count for last 14 days
    hogqlQuery(
      base,
      headers,
      `SELECT toDate(timestamp) as day, count() as cnt FROM events WHERE timestamp >= now() - INTERVAL 14 DAY GROUP BY day ORDER BY day`,
    ),
  ])

  const dau = Number(dauResult.results?.[0]?.[0] ?? 0)
  const wau = Number(wauResult.results?.[0]?.[0] ?? 0)
  const eventsToday = Number(eventsTodayResult.results?.[0]?.[0] ?? 0)

  const topEvents: TopEvent[] = (topEventsResult.results ?? []).map((row) => ({
    event: String(row[0] ?? ''),
    count: Number(row[1] ?? 0),
  }))

  const dauTrend: TrendPoint[] = (dauTrendResult.results ?? []).map((row) => ({
    date: String(row[0] ?? ''),
    count: Number(row[1] ?? 0),
  }))

  const eventsTrend: TrendPoint[] = (eventsTrendResult.results ?? []).map((row) => ({
    date: String(row[0] ?? ''),
    count: Number(row[1] ?? 0),
  }))

  return { dau, wau, eventsToday, eventsTrend, topEvents, dauTrend }
}

export function parsePanel(raw: RawData): PanelData {
  const trend = raw.dauTrend ?? []
  let dauChangePercent = 0

  if (trend.length >= 2) {
    const today = trend[trend.length - 1]!.count
    const yesterday = trend[trend.length - 2]!.count
    if (yesterday > 0) {
      dauChangePercent = Math.round(((today - yesterday) / yesterday) * 100)
    } else if (today > 0) {
      dauChangePercent = 100
    }
  }

  return {
    dau: raw.dau ?? 0,
    wau: raw.wau ?? 0,
    eventsToday: raw.eventsToday ?? 0,
    eventsTrend: raw.eventsTrend ?? [],
    topEvents: raw.topEvents ?? [],
    dauTrend: raw.dauTrend ?? [],
    dauChangePercent,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.projectId)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.dau == null && raw.eventsToday == null) return 'error'
  if (raw.dau === 0 && raw.eventsToday === 0) return 'warn'
  return 'ok'
}
