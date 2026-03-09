import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'resend' as const
export const INTEGRATION_NAME = 'Resend'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Resend API key required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  domains: Array<{
    id: string
    name: string
    status: string
    created_at: string
  }>
  apiKeys: Array<{
    id: string
    name: string
  }>
}

export interface PanelData {
  domainCount: number
  domains: Array<{
    name: string
    status: string
  }>
  apiKeyCount: number
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = 'https://api.resend.com'

  const [domainsRes, keysRes] = await Promise.all([
    fetch(`${base}/domains`, { headers, signal: AbortSignal.timeout(10_000) }),
    fetch(`${base}/api-keys`, { headers, signal: AbortSignal.timeout(10_000) }),
  ])

  if (!domainsRes.ok)
    throw new Error(
      apiError(domainsRes.status, {
        401: 'Authentication failed — check your RESEND_API_KEY',
      }),
    )

  const domainsBody = (await domainsRes.json()) as { data?: RawData['domains'] }
  const keysBody = keysRes.ok
    ? ((await keysRes.json()) as { data?: RawData['apiKeys'] })
    : { data: [] }

  return {
    domains: domainsBody.data ?? [],
    apiKeys: keysBody.data ?? [],
  }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    domainCount: raw.domains?.length ?? 0,
    domains: (raw.domains ?? []).map((d) => ({
      name: d.name,
      status: d.status,
    })),
    apiKeyCount: raw.apiKeys?.length ?? 0,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.domains) return 'error'
  const hasUnverified = raw.domains.some((d) => d.status !== 'verified')
  if (hasUnverified) return 'warn'
  return 'ok'
}
