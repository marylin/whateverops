import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'anthropic' as const
export const INTEGRATION_NAME = 'Anthropic'
export const DEFAULT_TTL = 300

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Anthropic API key required'),
  adminApiKey: z.string().default(''),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RateLimitInfo {
  tokensRemaining: number | null
  tokensLimit: number | null
  tokensReset: string | null
  requestsRemaining: number | null
  requestsLimit: number | null
  requestsReset: string | null
}

export interface UsageBucket {
  model: string
  inputTokens: number
  outputTokens: number
  cachedInputTokens: number
  cacheCreationTokens: number
}

export interface CostBucket {
  date: string
  costUsd: number
}

export interface UsageData {
  totalCost30d: number
  dailyCosts: CostBucket[]
  modelUsage: UsageBucket[]
}

export interface RawData {
  models: string[]
  keyValid: boolean
  rateLimits: RateLimitInfo
  usage: UsageData | null
}

export interface PanelData {
  keyValid: boolean
  availableModels: string[]
  modelCount: number
  rateLimits: {
    tokensRemaining: number | null
    tokensLimit: number | null
    tokensUsedPct: number | null
    requestsRemaining: number | null
    requestsLimit: number | null
    requestsUsedPct: number | null
    tokensReset: string | null
  }
  usage: {
    totalCost30d: number
    dailyCosts: Array<{ date: string; cost: number }>
    modelUsage: Array<{
      model: string
      inputTokens: number
      outputTokens: number
      cachedInputTokens: number
    }>
    hasAdminKey: boolean
  }
  projectedMonthlySpend: number
  costTrendPct: number | null
  highestCostModel: string | null
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  // TODO: Remove mock data — temporary for card preview
  if (process.env.MOCK_PREVIEW === 'true') {
    return {
      keyValid: true,
      models: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5-20251001'],
      rateLimits: {
        tokensRemaining: 850000,
        tokensLimit: 1000000,
        tokensReset: null,
        requestsRemaining: 3800,
        requestsLimit: 4000,
        requestsReset: null,
      },
      usage: {
        totalCost30d: 127.43,
        dailyCosts: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 86400_000).toISOString().split('T')[0]!,
          costUsd: 2.0 + Math.random() * 6,
        })),
        modelUsage: [
          {
            model: 'claude-sonnet-4-6',
            inputTokens: 4200000,
            outputTokens: 1800000,
            cachedInputTokens: 500000,
            cacheCreationTokens: 100000,
          },
          {
            model: 'claude-opus-4-6',
            inputTokens: 800000,
            outputTokens: 400000,
            cachedInputTokens: 200000,
            cacheCreationTokens: 50000,
          },
          {
            model: 'claude-haiku-4-5-20251001',
            inputTokens: 12000000,
            outputTokens: 3000000,
            cachedInputTokens: 2000000,
            cacheCreationTokens: 300000,
          },
        ],
      },
    }
  }

  // Validate key by listing models
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    if (res.status === 401)
      return {
        models: [],
        keyValid: false,
        rateLimits: {
          tokensRemaining: null,
          tokensLimit: null,
          tokensReset: null,
          requestsRemaining: null,
          requestsLimit: null,
          requestsReset: null,
        },
        usage: null,
      }
    throw new Error(
      apiError(res.status, {
        403: 'API key lacks permissions — check key settings at console.anthropic.com',
      }),
    )
  }

  // Capture rate limit headers
  const rateLimits: RateLimitInfo = {
    tokensRemaining: parseIntHeader(res.headers.get('anthropic-ratelimit-tokens-remaining')),
    tokensLimit: parseIntHeader(res.headers.get('anthropic-ratelimit-tokens-limit')),
    tokensReset: res.headers.get('anthropic-ratelimit-tokens-reset'),
    requestsRemaining: parseIntHeader(res.headers.get('anthropic-ratelimit-requests-remaining')),
    requestsLimit: parseIntHeader(res.headers.get('anthropic-ratelimit-requests-limit')),
    requestsReset: res.headers.get('anthropic-ratelimit-requests-reset'),
  }

  const body = (await res.json()) as { data?: Array<{ id?: string }> }
  const models = (body.data ?? []).map((m) => m.id ?? '').filter(Boolean)

  // Fetch usage data if admin API key is provided
  let usage: UsageData | null = null
  if (config.adminApiKey) {
    usage = await fetchUsageData(config.adminApiKey)
  }

  return { models, keyValid: true, rateLimits, usage }
}

async function fetchUsageData(adminKey: string): Promise<UsageData | null> {
  try {
    const adminHeaders = {
      'x-api-key': adminKey,
      'anthropic-version': '2023-06-01',
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const start30d = thirtyDaysAgo.toISOString()
    const start7d = sevenDaysAgo.toISOString()
    const end = now.toISOString()

    const [costRes, usageRes] = await Promise.all([
      fetch(
        `https://api.anthropic.com/v1/organizations/cost_report?starting_at=${start30d}&ending_at=${end}&bucket_width=1d`,
        { headers: adminHeaders, signal: AbortSignal.timeout(10_000) },
      ).catch(() => null),
      fetch(
        `https://api.anthropic.com/v1/organizations/usage_report/messages?starting_at=${start7d}&ending_at=${end}&bucket_width=1d&group_by=model`,
        { headers: adminHeaders, signal: AbortSignal.timeout(10_000) },
      ).catch(() => null),
    ])

    const dailyCosts: CostBucket[] = []
    let totalCost30d = 0

    if (costRes?.ok) {
      const costBody = (await costRes.json()) as {
        data?: Array<{
          date?: string
          cost_usd?: number
          total_cost_usd?: number
        }>
      }
      for (const bucket of costBody.data ?? []) {
        const cost = bucket.cost_usd ?? bucket.total_cost_usd ?? 0
        dailyCosts.push({ date: bucket.date ?? '', costUsd: cost })
        totalCost30d += cost
      }
    }

    const modelUsage: UsageBucket[] = []
    if (usageRes?.ok) {
      const usageBody = (await usageRes.json()) as {
        data?: Array<{
          model?: string
          input_tokens?: number
          output_tokens?: number
          cache_read_input_tokens?: number
          cache_creation_input_tokens?: number
        }>
      }
      for (const bucket of usageBody.data ?? []) {
        modelUsage.push({
          model: bucket.model ?? 'unknown',
          inputTokens: bucket.input_tokens ?? 0,
          outputTokens: bucket.output_tokens ?? 0,
          cachedInputTokens: bucket.cache_read_input_tokens ?? 0,
          cacheCreationTokens: bucket.cache_creation_input_tokens ?? 0,
        })
      }
    }

    return { totalCost30d, dailyCosts, modelUsage }
  } catch {
    return null
  }
}

function parseIntHeader(value: string | null): number | null {
  if (value == null) return null
  const n = parseInt(value, 10)
  return isNaN(n) ? null : n
}

export function parsePanel(raw: RawData): PanelData {
  const rl = raw.rateLimits ?? ({} as RateLimitInfo)
  const tokensUsedPct =
    rl.tokensLimit && rl.tokensRemaining != null
      ? Math.round(((rl.tokensLimit - rl.tokensRemaining) / rl.tokensLimit) * 100)
      : null
  const requestsUsedPct =
    rl.requestsLimit && rl.requestsRemaining != null
      ? Math.round(((rl.requestsLimit - rl.requestsRemaining) / rl.requestsLimit) * 100)
      : null

  const usageData = raw.usage
  const dailyCosts = (usageData?.dailyCosts ?? []).map((c) => ({
    date: c.date,
    cost: c.costUsd,
  }))

  // Compute projected monthly spend
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const totalCost = usageData?.totalCost30d ?? 0
  const dailyAvg = dayOfMonth > 0 ? totalCost / Math.min(dayOfMonth, 30) : 0
  const daysRemaining = daysInMonth - dayOfMonth
  const projectedMonthlySpend = totalCost + dailyAvg * daysRemaining

  // Compute cost trend pct
  let costTrendPct: number | null = null
  if (dailyCosts.length >= 7) {
    const thisWeek = dailyCosts.slice(-7).reduce((sum, d) => sum + d.cost, 0)
    const lastWeek = dailyCosts.slice(-14, -7).reduce((sum, d) => sum + d.cost, 0)
    if (lastWeek > 0) {
      costTrendPct = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    }
  }

  // Compute highest cost model
  const modelUsageList = usageData?.modelUsage ?? []
  let highestCostModel: string | null = null
  if (modelUsageList.length > 0) {
    const sorted = [...modelUsageList].sort(
      (a, b) => b.inputTokens + b.outputTokens - (a.inputTokens + a.outputTokens),
    )
    highestCostModel = sorted[0]?.model ?? null
  }

  return {
    keyValid: raw.keyValid ?? false,
    availableModels: raw.models ?? [],
    modelCount: raw.models?.length ?? 0,
    rateLimits: {
      tokensRemaining: rl.tokensRemaining ?? null,
      tokensLimit: rl.tokensLimit ?? null,
      tokensUsedPct,
      requestsRemaining: rl.requestsRemaining ?? null,
      requestsLimit: rl.requestsLimit ?? null,
      requestsUsedPct,
      tokensReset: rl.tokensReset ?? null,
    },
    usage: {
      totalCost30d: usageData?.totalCost30d ?? 0,
      dailyCosts,
      modelUsage: modelUsageList.map((m) => ({
        model: m.model,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
        cachedInputTokens: m.cachedInputTokens,
      })),
      hasAdminKey: usageData !== null,
    },
    projectedMonthlySpend,
    costTrendPct,
    highestCostModel,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + (config.adminApiKey ?? ''))
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.keyValid) return 'error'

  // Warn if >90% of rate limit consumed
  const rl = raw.rateLimits
  if (rl?.tokensLimit && rl.tokensRemaining != null) {
    const used = (rl.tokensLimit - rl.tokensRemaining) / rl.tokensLimit
    if (used > 0.9) return 'warn'
  }

  return 'ok'
}
