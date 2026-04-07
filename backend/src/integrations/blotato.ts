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

interface ApiSlot {
  id: string
  hour: number
  minute: number
  day: string
  selectedTargets: Array<{ platform: string; accountId: string }>
}

export interface RawData {
  subscriptionStatus: string | null
  accounts: ApiAccount[]
  schedules: {
    items: ApiScheduleItem[]
    count: number
  }
  slots: ApiSlot[]
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
  slotsByDay: Record<string, number>
  totalSlots: number
}

const BASE_URL = 'https://backend.blotato.com/v2'

async function blotatoFetch(path: string, apiKey: string): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    headers: { 'blotato-api-key': apiKey },
    signal: AbortSignal.timeout(10_000),
  })
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const [userRes, accountsRes, schedulesRes, slotsRes] = await Promise.all([
    blotatoFetch('/users/me', config.apiKey),
    blotatoFetch('/users/me/accounts', config.apiKey),
    blotatoFetch('/schedules?limit=10', config.apiKey),
    blotatoFetch('/schedule/slots', config.apiKey),
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

  const slots: ApiSlot[] = slotsRes.ok ? (((await slotsRes.json()) as ApiSlot[]) ?? []) : []

  // TODO: Remove mock data — temporary for card preview while Blotato account is empty
  if (process.env.MOCK_PREVIEW === 'true') {
    return {
      subscriptionStatus: user.subscriptionStatus ?? 'active',
      accounts:
        accounts.length > 0
          ? accounts
          : [
              {
                id: 'mock-1',
                platform: 'twitter',
                fullname: 'Alex Founder',
                username: 'alexfounder',
              },
              {
                id: 'mock-2',
                platform: 'threads',
                fullname: 'Alex Founder',
                username: 'alexfounder.dev',
              },
              {
                id: 'mock-3',
                platform: 'linkedin',
                fullname: 'Alex Founder',
                username: 'alex-founder',
              },
            ],
      schedules: {
        items: [
          {
            id: 'mock-s1',
            scheduledAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
            account: { name: 'Alex Founder', username: 'alexfounder', platform: 'twitter' },
            draft: {
              content: {
                text: 'Just shipped a new feature — 16 integrations in one ops dashboard',
                platform: 'twitter',
              },
            },
          },
          {
            id: 'mock-s2',
            scheduledAt: new Date(Date.now() + 5 * 3600_000).toISOString(),
            account: { name: 'Alex Founder', username: 'alexfounder.dev', platform: 'threads' },
            draft: {
              content: {
                text: 'Building in public update: Supabase cards redesign is live',
                platform: 'threads',
              },
            },
          },
          {
            id: 'mock-s3',
            scheduledAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
            account: { name: 'Alex Founder', username: 'alex-founder', platform: 'linkedin' },
            draft: {
              content: {
                text: 'How I built a unified ops dashboard as a solo founder — lessons from 6 months of shipping',
                platform: 'linkedin',
              },
            },
          },
          {
            id: 'mock-s4',
            scheduledAt: new Date(Date.now() + 48 * 3600_000).toISOString(),
            account: { name: 'Alex Founder', username: 'alexfounder', platform: 'twitter' },
            draft: {
              content: {
                text: 'Telemetry is live — anonymous heartbeats to understand adoption without tracking users',
                platform: 'twitter',
              },
            },
          },
          {
            id: 'mock-s5',
            scheduledAt: new Date(Date.now() + 72 * 3600_000).toISOString(),
            account: { name: 'Alex Founder', username: 'alexfounder.dev', platform: 'threads' },
            draft: {
              content: {
                text: 'New integration dropped: social media queue right on your ops dashboard',
                platform: 'threads',
              },
            },
          },
        ],
        count: 12,
      },
      slots: [
        {
          id: 'mock-sl1',
          hour: 9,
          minute: 0,
          day: 'monday',
          selectedTargets: [{ platform: 'twitter', accountId: 'mock-1' }],
        },
        {
          id: 'mock-sl2',
          hour: 14,
          minute: 0,
          day: 'monday',
          selectedTargets: [{ platform: 'linkedin', accountId: 'mock-3' }],
        },
        {
          id: 'mock-sl3',
          hour: 9,
          minute: 0,
          day: 'tuesday',
          selectedTargets: [{ platform: 'threads', accountId: 'mock-2' }],
        },
        {
          id: 'mock-sl4',
          hour: 9,
          minute: 0,
          day: 'wednesday',
          selectedTargets: [{ platform: 'twitter', accountId: 'mock-1' }],
        },
        {
          id: 'mock-sl5',
          hour: 14,
          minute: 0,
          day: 'wednesday',
          selectedTargets: [{ platform: 'threads', accountId: 'mock-2' }],
        },
        {
          id: 'mock-sl6',
          hour: 9,
          minute: 0,
          day: 'thursday',
          selectedTargets: [{ platform: 'linkedin', accountId: 'mock-3' }],
        },
        {
          id: 'mock-sl7',
          hour: 9,
          minute: 0,
          day: 'friday',
          selectedTargets: [{ platform: 'twitter', accountId: 'mock-1' }],
        },
        {
          id: 'mock-sl8',
          hour: 14,
          minute: 0,
          day: 'friday',
          selectedTargets: [{ platform: 'threads', accountId: 'mock-2' }],
        },
      ],
    }
  }

  return {
    subscriptionStatus: user.subscriptionStatus ?? null,
    accounts,
    schedules: {
      items: schedulesBody.items ?? [],
      count: Number(schedulesBody.count) || 0,
    },
    slots: Array.isArray(slots) ? slots : [],
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

  const slotsByDay: Record<string, number> = {}
  for (const slot of raw.slots ?? []) {
    slotsByDay[slot.day] = (slotsByDay[slot.day] ?? 0) + 1
  }

  return {
    subscriptionStatus: raw.subscriptionStatus ?? null,
    connectedAccounts,
    platformCount: platforms.size,
    queuedCount: raw.schedules?.count ?? 0,
    nextPosts,
    slotsByDay,
    totalSlots: (raw.slots ?? []).length,
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
