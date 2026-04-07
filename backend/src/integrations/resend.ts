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

export interface RecentEmail {
  id: string
  to: string[]
  from: string
  subject: string
  status: string
  created_at: string
}

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
  recentEmails: RecentEmail[]
}

export interface DomainStats {
  name: string
  status: string
  totalSent: number
  deliveredCount: number
  bouncedCount: number
  deliveryRate: number
  recentEmails: Array<{
    id: string
    to: string
    subject: string
    status: string
    sent: string
  }>
}

export interface PanelData {
  domainCount: number
  domains: Array<{
    name: string
    status: string
  }>
  apiKeyCount: number
  recentEmails: Array<{
    to: string
    subject: string
    status: string
    sent: string
  }>
  deliveryRate: number
  totalSent: number
  bouncedCount: number
  // Per-domain breakdown
  domainStats: DomainStats[]
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  // TODO: Remove mock data — temporary for card preview
  if (process.env.MOCK_PREVIEW === 'true') {
    // Use explicit dates anchored to local today/yesterday to match frontend's midnight cutoff
    const todayNoon = new Date()
    todayNoon.setHours(12, 0, 0, 0)
    const yesterdayNoon = new Date(todayNoon)
    yesterdayNoon.setDate(yesterdayNoon.getDate() - 1)
    const twoDaysAgo = new Date(todayNoon)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    return {
      domains: [
        {
          id: 'd1',
          name: 'mail.acme.dev',
          status: 'verified',
          created_at: new Date(Date.now() - 30 * 86400_000).toISOString(),
        },
        {
          id: 'd2',
          name: 'updates.acme.dev',
          status: 'verified',
          created_at: new Date(Date.now() - 20 * 86400_000).toISOString(),
        },
      ],
      apiKeys: [
        { id: 'k1', name: 'Production' },
        { id: 'k2', name: 'Development' },
      ],
      recentEmails: [
        // 7 emails today
        {
          id: 'e1',
          to: ['user@example.com'],
          from: 'hi@mail.acme.dev',
          subject: 'Welcome to the app',
          status: 'delivered',
          created_at: new Date(todayNoon.getTime() - 1800_000).toISOString(),
        },
        {
          id: 'e2',
          to: ['dev@company.io'],
          from: 'updates@updates.acme.dev',
          subject: 'Your weekly digest',
          status: 'delivered',
          created_at: new Date(todayNoon.getTime() - 3600_000).toISOString(),
        },
        {
          id: 'e3',
          to: ['founder@startup.co'],
          from: 'updates@updates.acme.dev',
          subject: 'New feature: storage integration',
          status: 'delivered',
          created_at: new Date(todayNoon.getTime() - 5400_000).toISOString(),
        },
        {
          id: 'e4',
          to: ['sarah@corp.io'],
          from: 'hi@mail.acme.dev',
          subject: 'Your trial is ending soon',
          status: 'delivered',
          created_at: new Date(todayNoon.getTime() - 7200_000).toISOString(),
        },
        {
          id: 'e5',
          to: ['mike@devshop.io'],
          from: 'hi@mail.acme.dev',
          subject: 'Invoice #1042 - $299.00',
          status: 'delivered',
          created_at: new Date(todayNoon.getTime() - 9000_000).toISOString(),
        },
        {
          id: 'e6',
          to: ['team@bigcorp.com'],
          from: 'updates@updates.acme.dev',
          subject: 'Dashboard redesign is live',
          status: 'delivered',
          created_at: new Date(todayNoon.getTime() - 10800_000).toISOString(),
        },
        {
          id: 'e7',
          to: ['alex@freelance.dev'],
          from: 'hi@mail.acme.dev',
          subject: 'Welcome to the app',
          status: 'delivered',
          created_at: new Date(todayNoon.getTime() - 12600_000).toISOString(),
        },
        // 4 emails yesterday
        {
          id: 'e8',
          to: ['chris@devtools.com'],
          from: 'hi@mail.acme.dev',
          subject: 'Password reset',
          status: 'delivered',
          created_at: new Date(yesterdayNoon.getTime()).toISOString(),
        },
        {
          id: 'e9',
          to: ['beta@tester.dev'],
          from: 'updates@updates.acme.dev',
          subject: 'Beta access granted',
          status: 'delivered',
          created_at: new Date(yesterdayNoon.getTime() - 3600_000).toISOString(),
        },
        {
          id: 'e10',
          to: ['jen@startup.co'],
          from: 'updates@updates.acme.dev',
          subject: 'Q1 changelog',
          status: 'delivered',
          created_at: new Date(yesterdayNoon.getTime() - 7200_000).toISOString(),
        },
        {
          id: 'e11',
          to: ['luke@indie.dev'],
          from: 'hi@mail.acme.dev',
          subject: 'Your API key is ready',
          status: 'delivered',
          created_at: new Date(yesterdayNoon.getTime() - 10800_000).toISOString(),
        },
      ],
    }
  }

  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = 'https://api.resend.com'

  const [domainsRes, keysRes, emailsRes] = await Promise.all([
    fetch(`${base}/domains`, { headers, signal: AbortSignal.timeout(10_000) }),
    fetch(`${base}/api-keys`, { headers, signal: AbortSignal.timeout(10_000) }),
    fetch(`${base}/emails`, { headers, signal: AbortSignal.timeout(10_000) }),
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
  const emailsBody = emailsRes.ok
    ? ((await emailsRes.json()) as {
        data?: Array<{
          id: string
          to: string[]
          from: string
          subject: string
          last_event: string
          created_at: string
        }>
      })
    : { data: [] }

  const recentEmails: RecentEmail[] = (emailsBody.data ?? []).slice(0, 50).map((e) => ({
    id: e.id,
    to: e.to,
    from: e.from ?? '',
    subject: e.subject,
    status: e.last_event,
    created_at: e.created_at,
  }))

  return {
    domains: domainsBody.data ?? [],
    apiKeys: keysBody.data ?? [],
    recentEmails,
  }
}

function extractDomain(from: string): string {
  // Extract domain from "Name <email@domain.com>" or "email@domain.com"
  const match = from.match(/@([^>\s]+)/)
  return match?.[1] ?? ''
}

export function parsePanel(raw: RawData): PanelData {
  const emails = raw.recentEmails ?? []
  const totalSent = emails.length
  const bouncedCount = emails.filter(
    (e) => e.status === 'bounced' || e.status === 'complained',
  ).length
  const deliveredCount = emails.filter(
    (e) => e.status === 'delivered' || e.status === 'opened' || e.status === 'clicked',
  ).length
  const deliveryRate = totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100

  // Build per-domain breakdown
  const domainNames = (raw.domains ?? []).map((d) => d.name)
  const domainStatsMap = new Map<
    string,
    {
      totalSent: number
      deliveredCount: number
      bouncedCount: number
      emails: RecentEmail[]
    }
  >()

  // Initialize all domains
  for (const name of domainNames) {
    domainStatsMap.set(name, { totalSent: 0, deliveredCount: 0, bouncedCount: 0, emails: [] })
  }

  // Assign emails to domains based on from address
  for (const email of emails) {
    const domain = extractDomain(email.from)
    const stats = domainStatsMap.get(domain)
    if (stats) {
      stats.totalSent++
      stats.emails.push(email)
      if (email.status === 'delivered' || email.status === 'opened' || email.status === 'clicked') {
        stats.deliveredCount++
      }
      if (email.status === 'bounced' || email.status === 'complained') {
        stats.bouncedCount++
      }
    }
  }

  const domainStats: DomainStats[] = (raw.domains ?? []).map((d) => {
    const stats = domainStatsMap.get(d.name) ?? {
      totalSent: 0,
      deliveredCount: 0,
      bouncedCount: 0,
      emails: [],
    }
    return {
      name: d.name,
      status: d.status,
      totalSent: stats.totalSent,
      deliveredCount: stats.deliveredCount,
      bouncedCount: stats.bouncedCount,
      deliveryRate:
        stats.totalSent > 0 ? Math.round((stats.deliveredCount / stats.totalSent) * 100) : 100,
      recentEmails: stats.emails.slice(0, 5).map((e) => ({
        id: e.id,
        to: e.to[0] ?? '',
        subject: e.subject,
        status: e.status,
        sent: e.created_at,
      })),
    }
  })

  return {
    domainCount: raw.domains?.length ?? 0,
    domains: (raw.domains ?? []).map((d) => ({
      name: d.name,
      status: d.status,
    })),
    apiKeyCount: raw.apiKeys?.length ?? 0,
    recentEmails: emails.slice(0, 10).map((e) => ({
      to: e.to[0] ?? '',
      subject: e.subject,
      status: e.status,
      sent: e.created_at,
    })),
    deliveryRate,
    totalSent,
    bouncedCount,
    domainStats,
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

  // High bounce rate → warn
  const emails = raw.recentEmails ?? []
  if (emails.length >= 5) {
    const bounced = emails.filter((e) => e.status === 'bounced' || e.status === 'complained').length
    if (bounced / emails.length > 0.1) return 'warn'
  }

  return 'ok'
}
