// backend/src/integrations/blotato.ts
import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'blotato' as const
export const INTEGRATION_NAME = 'Blotato'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Blotato API key required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

interface ApiAccount {
  id: string
  platform: string
  fullname: string
  username: string
}

interface ApiScheduleItem {
  id: string
  scheduledAt: string
  account: {
    name: string
    username: string
    platform: string
  } | null
  draft: {
    content: {
      text: string
      platform: string
    }
  } | null
}

export interface RawData {
  subscriptionStatus: string | null
  accounts: ApiAccount[]
  schedules: {
    items: ApiScheduleItem[]
    count: number
  }
}

export interface PanelData {
  subscriptionStatus: string | null
  connectedAccounts: Array<{ platform: string; username: string }>
  platformCount: number
  queuedCount: number
  nextPosts: Array<{
    platform: string
    username: string
    text: string
    scheduledAt: string
  }>
}

const BASE_URL = 'https://backend.blotato.com/v2'

async function blotatoFetch(path: string, apiKey: string): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    headers: { 'blotato-api-key': apiKey },
    signal: AbortSignal.timeout(10_000),
  })
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const [userRes, accountsRes, schedulesRes] = await Promise.all([
    blotatoFetch('/users/me', config.apiKey),
    blotatoFetch('/users/me/accounts', config.apiKey),
    blotatoFetch('/schedules?limit=10', config.apiKey),
  ])

  if (!userRes.ok) {
    throw new Error(
      apiError(userRes.status, {
        401: 'Authentication failed — check BLOTATO_API_KEY in .env',
      }),
    )
  }

  const user = (await userRes.json()) as {
    subscriptionStatus?: string | null
  }

  const accounts: ApiAccount[] = accountsRes.ok
    ? (((await accountsRes.json()) as { items?: ApiAccount[] }).items ?? [])
    : []

  const schedulesBody = schedulesRes.ok
    ? ((await schedulesRes.json()) as {
        items?: ApiScheduleItem[]
        count?: number | string
      })
    : { items: [], count: 0 }

  return {
    subscriptionStatus: user.subscriptionStatus ?? null,
    accounts,
    schedules: {
      items: schedulesBody.items ?? [],
      count: Number(schedulesBody.count) || 0,
    },
  }
}

export function parsePanel(raw: RawData): PanelData {
  const connectedAccounts = (raw.accounts ?? []).map((a) => ({
    platform: a.platform,
    username: a.username,
  }))

  const platforms = new Set(connectedAccounts.map((a) => a.platform))

  const nextPosts = (raw.schedules?.items ?? []).slice(0, 5).map((item) => ({
    platform: item.account?.platform ?? item.draft?.content?.platform ?? 'unknown',
    username: item.account?.username ?? '',
    text: (item.draft?.content?.text ?? '').slice(0, 80),
    scheduledAt: item.scheduledAt ?? '',
  }))

  return {
    subscriptionStatus: raw.subscriptionStatus ?? null,
    connectedAccounts,
    platformCount: platforms.size,
    queuedCount: raw.schedules?.count ?? 0,
    nextPosts,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if ((raw.accounts ?? []).length === 0) return 'error'
  if (
    raw.subscriptionStatus != null &&
    raw.subscriptionStatus !== 'active' &&
    raw.subscriptionStatus !== 'trialing'
  )
    return 'error'
  if ((raw.schedules?.count ?? 0) === 0) return 'warn'
  return 'ok'
}
