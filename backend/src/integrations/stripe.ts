import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'stripe' as const
export const INTEGRATION_NAME = 'Stripe'
export const DEFAULT_TTL = 120

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Stripe secret key required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  subscriptions: Array<{
    id: string
    status: string
    plan: {
      amount: number
      interval: string
      currency: string
    }
    created: number
    canceled_at: number | null
  }>
  recentCharges: Array<{
    id: string
    amount: number
    currency: string
    status: string
    created: number
    description: string | null
  }>
  balance: number
  currency: string
}

export interface PanelData {
  mrr: number
  mrrDelta30d: number
  activeSubscriptions: number
  newSubscriptions24h: number
  canceledSubscriptions30d: number
  failedPayments24h: number
  failedPaymentAmount: number
  recentEvents: Array<{
    id: string
    amount: number
    currency: string
    status: string
    date: string
    description: string | null
  }>
  currency: string
}

async function stripeGet(
  apiKey: string,
  path: string,
  params: Record<string, string> = {},
): Promise<unknown> {
  const url = new URL(`https://api.stripe.com/v1${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Basic ${btoa(apiKey + ':')}` },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok)
    throw new Error(
      apiError(res.status, {
        401: 'Authentication failed — check your STRIPE_SECRET_KEY (must start with sk_)',
        403: 'Key lacks permissions — ensure you are using the correct Stripe secret key',
      }),
    )
  return res.json()
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const now = Math.floor(Date.now() / 1000)
  const thirtyDaysAgo = now - 30 * 86400

  const [subsRes, chargesRes, balanceRes] = await Promise.all([
    stripeGet(config.apiKey, '/subscriptions', {
      limit: '100',
      status: 'all',
    }),
    stripeGet(config.apiKey, '/charges', {
      limit: '10',
      'created[gte]': thirtyDaysAgo.toString(),
    }),
    stripeGet(config.apiKey, '/balance'),
  ])

  const subs = subsRes as { data?: RawData['subscriptions'] }
  const charges = chargesRes as { data?: RawData['recentCharges'] }
  const balance = balanceRes as {
    available?: Array<{ amount?: number; currency?: string }>
  }

  return {
    subscriptions: subs.data ?? [],
    recentCharges: charges.data ?? [],
    balance: balance.available?.[0]?.amount ?? 0,
    currency: balance.available?.[0]?.currency ?? 'usd',
  }
}

export function parsePanel(raw: RawData): PanelData {
  const now = Math.floor(Date.now() / 1000)
  const oneDayAgo = now - 86400
  const thirtyDaysAgo = now - 30 * 86400

  const subs = raw.subscriptions ?? []
  const activeSubs = subs.filter((s) => s.status === 'active' || s.status === 'trialing')

  // Calculate MRR: normalize all intervals to monthly
  const mrr = activeSubs.reduce((sum, s) => {
    const amount = s.plan?.amount ?? 0
    const interval = s.plan?.interval ?? 'month'
    switch (interval) {
      case 'year':
        return sum + amount / 12
      case 'week':
        return sum + amount * 4.33
      case 'day':
        return sum + amount * 30
      default:
        return sum + amount
    }
  }, 0)

  // MRR delta: subs created in last 30 days minus canceled
  const newSubs30d = activeSubs.filter((s) => s.created > thirtyDaysAgo)
  const canceledSubs30d = subs.filter((s) => s.canceled_at && s.canceled_at > thirtyDaysAgo)

  const newMrr = newSubs30d.reduce((sum, s) => sum + (s.plan?.amount ?? 0), 0)
  const lostMrr = canceledSubs30d.reduce((sum, s) => sum + (s.plan?.amount ?? 0), 0)
  const mrrDelta30d = newMrr - lostMrr

  const newSubscriptions24h = subs.filter(
    (s) => s.created > oneDayAgo && (s.status === 'active' || s.status === 'trialing'),
  ).length

  const charges = raw.recentCharges ?? []
  const failedCharges24h = charges.filter((c) => c.status === 'failed' && c.created > oneDayAgo)

  return {
    mrr: Math.round(mrr) / 100,
    mrrDelta30d: Math.round(mrrDelta30d) / 100,
    activeSubscriptions: activeSubs.length,
    newSubscriptions24h,
    canceledSubscriptions30d: canceledSubs30d.length,
    failedPayments24h: failedCharges24h.length,
    failedPaymentAmount: failedCharges24h.reduce((sum, c) => sum + c.amount, 0) / 100,
    recentEvents: charges.slice(0, 5).map((c) => ({
      id: c.id,
      amount: c.amount / 100,
      currency: c.currency,
      status: c.status,
      date: new Date(c.created * 1000).toISOString(),
      description: c.description,
    })),
    currency: raw.currency ?? 'usd',
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.subscriptions) return 'error'
  const now = Math.floor(Date.now() / 1000)
  const oneDayAgo = now - 86400
  const recentFailed = (raw.recentCharges ?? []).filter(
    (c) => c.status === 'failed' && c.created > oneDayAgo,
  )
  if (recentFailed.length > 0) return 'warn'
  return 'ok'
}
