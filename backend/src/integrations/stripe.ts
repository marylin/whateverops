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

export interface RefundData {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  reason: string | null
}

export interface DisputeData {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  reason: string | null
}

export interface InvoiceData {
  id: string
  amount_due: number
  currency: string
  status: string
  created: number
  customer_email: string | null
}

export interface PayoutData {
  id: string
  amount: number
  currency: string
  status: string
  arrival_date: number
  created: number
}

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
  refunds: RefundData[]
  netRevenue: number
  customerCount: number
  disputes: DisputeData[]
  openInvoices: InvoiceData[]
  recentPayouts: PayoutData[]
}

export interface PanelData {
  mrr: number
  mrrDelta30d: number
  mrrGrowthPct: number
  projectedAnnualRevenue: number
  arpu: number
  activeSubscriptions: number
  newSubscriptions24h: number
  daysSinceLastNewSub: number | null
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
  churnRate30d: number
  currency: string
  refundCount30d: number
  refundAmount30d: number
  netRevenue30d: number
  customerCount: number
  disputes: { count: number; totalAmount: number }
  openInvoices: { count: number; totalAmount: number }
  recentPayouts: Array<{ amount: number; arrivalDate: string; status: string }>
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
  // TODO: Remove mock data — temporary for card preview
  if (process.env.MOCK_PREVIEW === 'true') {
    const now = Math.floor(Date.now() / 1000)
    return {
      subscriptions: [
        {
          id: 'sub_1',
          status: 'active',
          plan: { amount: 29900, interval: 'month', currency: 'usd' },
          created: now - 90 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_2',
          status: 'active',
          plan: { amount: 29900, interval: 'month', currency: 'usd' },
          created: now - 60 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_3',
          status: 'active',
          plan: { amount: 49900, interval: 'month', currency: 'usd' },
          created: now - 45 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_4',
          status: 'active',
          plan: { amount: 29900, interval: 'month', currency: 'usd' },
          created: now - 20 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_5',
          status: 'active',
          plan: { amount: 49900, interval: 'month', currency: 'usd' },
          created: now - 5 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_6',
          status: 'active',
          plan: { amount: 29900, interval: 'month', currency: 'usd' },
          created: now - 3 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_7',
          status: 'active',
          plan: { amount: 49900, interval: 'month', currency: 'usd' },
          created: now - 2 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_8',
          status: 'active',
          plan: { amount: 29900, interval: 'month', currency: 'usd' },
          created: now - 1 * 86400,
          canceled_at: null,
        },
        {
          id: 'sub_9',
          status: 'active',
          plan: { amount: 29900, interval: 'month', currency: 'usd' },
          created: now - 80 * 86400,
          canceled_at: null,
        },
      ],
      recentCharges: [
        {
          id: 'ch_1',
          amount: 29900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 86400,
          description: 'Subscription renewal',
        },
        {
          id: 'ch_2',
          amount: 49900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 86400,
          description: 'Subscription renewal',
        },
        {
          id: 'ch_3',
          amount: 29900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 2 * 86400,
          description: 'Subscription renewal',
        },
        {
          id: 'ch_4',
          amount: 49900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 3 * 86400,
          description: 'Subscription renewal',
        },
        {
          id: 'ch_5',
          amount: 29900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 4 * 86400,
          description: 'New subscription',
        },
        {
          id: 'ch_6',
          amount: 29900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 5 * 86400,
          description: 'Subscription renewal',
        },
        {
          id: 'ch_7',
          amount: 49900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 7 * 86400,
          description: 'Subscription renewal',
        },
        {
          id: 'ch_8',
          amount: 29900,
          currency: 'usd',
          status: 'succeeded',
          created: now - 10 * 86400,
          description: 'New subscription',
        },
      ],
      balance: 299200,
      currency: 'usd',
      refunds: [],
      netRevenue: 299200,
      customerCount: 23,
      disputes: [],
      openInvoices: [],
      recentPayouts: [
        {
          id: 'po_1',
          amount: 15600,
          arrival_date: now + 2 * 86400,
          status: 'in_transit',
          currency: 'usd',
          created: now - 86400,
        },
      ],
    }
  }

  const now = Math.floor(Date.now() / 1000)
  const thirtyDaysAgo = now - 30 * 86400

  const [
    subsRes,
    chargesRes,
    balanceRes,
    refundsRes,
    balanceTxRes,
    customersRes,
    disputesRes,
    invoicesRes,
    payoutsRes,
  ] = await Promise.all([
    stripeGet(config.apiKey, '/subscriptions', {
      limit: '100',
      status: 'all',
    }),
    stripeGet(config.apiKey, '/charges', {
      limit: '10',
      'created[gte]': thirtyDaysAgo.toString(),
    }),
    stripeGet(config.apiKey, '/balance'),
    stripeGet(config.apiKey, '/refunds', {
      limit: '25',
      'created[gte]': thirtyDaysAgo.toString(),
    }),
    stripeGet(config.apiKey, '/balance_transactions', {
      limit: '100',
      'created[gte]': thirtyDaysAgo.toString(),
      type: 'charge',
    }),
    stripeGet(config.apiKey, '/customers', { limit: '1' }),
    stripeGet(config.apiKey, '/disputes', { limit: '10' }),
    stripeGet(config.apiKey, '/invoices', { status: 'open', limit: '10' }),
    stripeGet(config.apiKey, '/payouts', { limit: '5' }),
  ])

  const subs = subsRes as { data?: RawData['subscriptions'] }
  const charges = chargesRes as { data?: RawData['recentCharges'] }
  const balance = balanceRes as {
    available?: Array<{ amount?: number; currency?: string }>
  }
  const refundsBody = refundsRes as {
    data?: Array<{
      id: string
      amount: number
      currency: string
      status: string
      created: number
      reason: string | null
    }>
  }
  const balanceTxBody = balanceTxRes as {
    data?: Array<{ net: number }>
  }
  const customersBody = customersRes as { total_count?: number }
  const disputesBody = disputesRes as {
    data?: Array<{
      id: string
      amount: number
      currency: string
      status: string
      created: number
      reason: string | null
    }>
  }
  const invoicesBody = invoicesRes as {
    data?: Array<{
      id: string
      amount_due: number
      currency: string
      status: string
      created: number
      customer_email: string | null
    }>
  }
  const payoutsBody = payoutsRes as {
    data?: Array<{
      id: string
      amount: number
      currency: string
      status: string
      arrival_date: number
      created: number
    }>
  }

  const netRevenue = (balanceTxBody.data ?? []).reduce((sum, tx) => sum + tx.net, 0)

  return {
    subscriptions: subs.data ?? [],
    recentCharges: charges.data ?? [],
    balance: balance.available?.[0]?.amount ?? 0,
    currency: balance.available?.[0]?.currency ?? 'usd',
    refunds: (refundsBody.data ?? []).map((r) => ({
      id: r.id,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      created: r.created,
      reason: r.reason,
    })),
    netRevenue,
    customerCount: customersBody.total_count ?? 0,
    disputes: (disputesBody.data ?? []).map((d) => ({
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      status: d.status,
      created: d.created,
      reason: d.reason,
    })),
    openInvoices: (invoicesBody.data ?? []).map((inv) => ({
      id: inv.id,
      amount_due: inv.amount_due,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      customer_email: inv.customer_email,
    })),
    recentPayouts: (payoutsBody.data ?? []).map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      arrival_date: p.arrival_date,
      created: p.created,
    })),
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

  // MRR growth percentage: mrrDelta / previousMrr
  const previousMrr = mrr - mrrDelta30d
  const mrrGrowthPct = previousMrr > 0 ? Math.round((mrrDelta30d / previousMrr) * 1000) / 10 : 0

  // ARPU: MRR / active subs
  const arpu = activeSubs.length > 0 ? Math.round(mrr / activeSubs.length) / 100 : 0

  // Days since last new subscription
  const newestSub = activeSubs
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .sort((a, b) => b.created - a.created)[0]
  const daysSinceLastNewSub = newestSub ? Math.floor((now - newestSub.created) / 86400) : null

  // Disputes summary
  const activeDisputes = (raw.disputes ?? []).filter(
    (d) =>
      d.status === 'needs_response' ||
      d.status === 'warning_needs_response' ||
      d.status === 'under_review',
  )
  const disputeCount = activeDisputes.length
  const disputeTotalAmount = activeDisputes.reduce((sum, d) => sum + d.amount, 0) / 100

  // Open invoices summary
  const openInvs = raw.openInvoices ?? []
  const openInvoiceCount = openInvs.length
  const openInvoiceTotalAmount = openInvs.reduce((sum, inv) => sum + inv.amount_due, 0) / 100

  // Recent payouts
  const recentPayouts = (raw.recentPayouts ?? []).slice(0, 5).map((p) => ({
    amount: p.amount / 100,
    arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
    status: p.status,
  }))

  return {
    mrr: Math.round(mrr) / 100,
    mrrDelta30d: Math.round(mrrDelta30d) / 100,
    mrrGrowthPct,
    projectedAnnualRevenue: Math.round(mrr * 12) / 100,
    arpu,
    activeSubscriptions: activeSubs.length,
    newSubscriptions24h,
    daysSinceLastNewSub,
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
    churnRate30d:
      activeSubs.length + canceledSubs30d.length > 0
        ? Math.round(
            (canceledSubs30d.length / (activeSubs.length + canceledSubs30d.length)) * 1000,
          ) / 10
        : 0,
    currency: raw.currency ?? 'usd',
    refundCount30d: (raw.refunds ?? []).length,
    refundAmount30d: (raw.refunds ?? []).reduce((sum, r) => sum + r.amount, 0) / 100,
    netRevenue30d: (raw.netRevenue ?? 0) / 100,
    customerCount: raw.customerCount ?? 0,
    disputes: { count: disputeCount, totalAmount: disputeTotalAmount },
    openInvoices: { count: openInvoiceCount, totalAmount: openInvoiceTotalAmount },
    recentPayouts,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.subscriptions) return 'error'

  // Active disputes are critical
  const activeDisputes = (raw.disputes ?? []).filter(
    (d) => d.status === 'needs_response' || d.status === 'warning_needs_response',
  )
  if (activeDisputes.length > 0) return 'error'

  const now = Math.floor(Date.now() / 1000)
  const oneDayAgo = now - 86400
  const recentFailed = (raw.recentCharges ?? []).filter(
    (c) => c.status === 'failed' && c.created > oneDayAgo,
  )
  if (recentFailed.length > 0) return 'warn'
  return 'ok'
}
