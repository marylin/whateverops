import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'supabase-auth' as const
export const INTEGRATION_NAME = 'Supabase Auth'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Supabase service key required'),
  supabaseUrl: z.string().url(),
  projectRef: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  users: Array<{
    id: string
    created_at: string
    last_sign_in_at: string | null
    email: string
    app_metadata?: { providers?: string[] }
  }>
  totalUsers: number
}

export interface PanelData {
  totalUsers: number
  recentSignups: number
  activeRecently: number
  providerBreakdown: Record<string, number>
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    apikey: config.apiKey,
  }

  const res = await fetch(`${config.supabaseUrl}/auth/v1/admin/users?per_page=50`, {
    headers,
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok)
    throw new Error(
      apiError(res.status, {
        401: 'Service key invalid — check SUPABASE_SERVICE_KEY in .env (must be the service_role key)',
        404: 'Project not found — verify SUPABASE_URL in .env',
      }),
    )

  // Supabase Admin API returns total count in x-total-count header, not in JSON body
  const totalFromHeader = parseInt(res.headers.get('x-total-count') ?? '', 10)

  const body = (await res.json()) as {
    users?: RawData['users']
  }

  return {
    users: body.users ?? [],
    totalUsers: Number.isFinite(totalFromHeader) ? totalFromHeader : (body.users?.length ?? 0),
  }
}

export function parsePanel(raw: RawData): PanelData {
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const oneDayAgo = now - 24 * 60 * 60 * 1000

  const users = raw.users ?? []
  const recentSignups = users.filter((u) => new Date(u.created_at).getTime() > sevenDaysAgo).length
  const activeRecently = users.filter(
    (u) => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > oneDayAgo,
  ).length

  const providerBreakdown: Record<string, number> = {}
  for (const u of users) {
    for (const p of u.app_metadata?.providers ?? ['email']) {
      providerBreakdown[p] = (providerBreakdown[p] ?? 0) + 1
    }
  }

  return {
    totalUsers: raw.totalUsers ?? 0,
    recentSignups,
    activeRecently,
    providerBreakdown,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.projectRef)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.totalUsers == null) return 'error'
  return 'ok'
}
