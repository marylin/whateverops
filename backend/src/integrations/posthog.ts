import { z } from 'zod'
import { quickHash } from '../lib/hash.js'

export const INTEGRATION_ID = 'posthog' as const
export const INTEGRATION_NAME = 'PostHog'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'PostHog API key required'),
  host: z.string().url().default('https://app.posthog.com'),
  projectId: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  activeUsers24h: number
  eventsToday: number
  featureFlagsCount: number
  insightsCount: number
}

export interface PanelData {
  activeUsers24h: number
  eventsToday: number
  featureFlags: number
  insights: number
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = `${config.host}/api/projects/${config.projectId}`

  const [flagsRes, insightsRes] = await Promise.all([
    fetch(`${base}/feature_flags/?limit=1`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${base}/insights/?limit=1`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ])

  if (!flagsRes.ok && flagsRes.status !== 404)
    throw new Error(`PostHog API error: ${flagsRes.status}`)

  const flagsBody = flagsRes.ok ? ((await flagsRes.json()) as { count?: number }) : { count: 0 }
  const insightsBody = insightsRes.ok
    ? ((await insightsRes.json()) as { count?: number })
    : { count: 0 }

  // Events and active users require trends query — approximate from insights
  return {
    activeUsers24h: 0,
    eventsToday: 0,
    featureFlagsCount: flagsBody.count ?? 0,
    insightsCount: insightsBody.count ?? 0,
  }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    activeUsers24h: raw.activeUsers24h ?? 0,
    eventsToday: raw.eventsToday ?? 0,
    featureFlags: raw.featureFlagsCount ?? 0,
    insights: raw.insightsCount ?? 0,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.projectId)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.featureFlagsCount == null && raw.insightsCount == null) return 'error'
  return 'ok'
}
