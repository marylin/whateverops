import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'openai' as const
export const INTEGRATION_NAME = 'OpenAI'
export const DEFAULT_TTL = 300

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'OpenAI API key required'),
  orgId: z.string().default(''),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RateLimitInfo {
  tokensRemaining: number | null
  tokensLimit: number | null
  requestsRemaining: number | null
  requestsLimit: number | null
  resetTokens: string | null
  resetRequests: string | null
}

export interface UsageBucket {
  model: string
  inputTokens: number
  outputTokens: number
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
  }
  usage: {
    totalCost30d: number
    dailyCosts: Array<{ date: string; cost: number }>
    modelUsage: Array<{
      model: string
      inputTokens: number
      outputTokens: number
    }>
    hasData: boolean
  }
  projectedMonthlySpend: number
  costTrendPct: number | null
  highestCostModel: string | null
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
  }
  if (config.orgId) headers['OpenAI-Organization'] = config.orgId

  const res = await fetch('https://api.openai.com/v1/models', {
    headers,
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
          requestsRemaining: null,
          requestsLimit: null,
          resetTokens: null,
          resetRequests: null,
        },
        usage: null,
      }
    throw new Error(
      apiError(res.status, {
        403: 'API key lacks permissions — check key at platform.openai.com',
        429: 'Rate limited or quota exceeded — check usage at platform.openai.com',
      }),
    )
  }

  // Capture rate limit headers
  const rateLimits: RateLimitInfo = {
    tokensRemaining: parseIntHeader(res.headers.get('x-ratelimit-remaining-tokens')),
    tokensLimit: parseIntHeader(res.headers.get('x-ratelimit-limit-tokens')),
    requestsRemaining: parseIntHeader(res.headers.get('x-ratelimit-remaining-requests')),
    requestsLimit: parseIntHeader(res.headers.get('x-ratelimit-limit-requests')),
    resetTokens: res.headers.get('x-ratelimit-reset-tokens'),
    resetRequests: res.headers.get('x-ratelimit-reset-requests'),
  }

  const body = (await res.json()) as { data?: Array<{ id?: string }> }
  const models = (body.data ?? [])
    .map((m) => m.id ?? '')
    .filter(Boolean)
    .sort()

  // Fetch usage and cost data
  const usage = await fetchUsageData(config.apiKey, config.orgId)

  return { models, keyValid: true, rateLimits, usage }
}

async function fetchUsageData(apiKey: string, orgId: string): Promise<UsageData | null> {
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    if (orgId) headers['OpenAI-Organization'] = orgId

    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60
    const sevenDaysAgo = now - 7 * 24 * 60 * 60

    const [costsRes, usageRes] = await Promise.all([
      fetch(
        `https://api.openai.com/v1/organization/costs?start_time=${thirtyDaysAgo}&end_time=${now}&bucket_width=1d`,
        { headers, signal: AbortSignal.timeout(10_000) },
      ).catch(() => null),
      fetch(
        `https://api.openai.com/v1/organization/usage/completions?start_time=${sevenDaysAgo}&end_time=${now}&bucket_width=1d&group_by=model`,
        { headers, signal: AbortSignal.timeout(10_000) },
      ).catch(() => null),
    ])

    const dailyCosts: CostBucket[] = []
    let totalCost30d = 0

    if (costsRes?.ok) {
      const costBody = (await costsRes.json()) as {
        data?: Array<{
          start_time?: number
          results?: Array<{
            amount?: { value?: number }
          }>
        }>
      }
      for (const bucket of costBody.data ?? []) {
        const totalAmount = (bucket.results ?? []).reduce(
          (sum, r) => sum + (r.amount?.value ?? 0),
          0,
        )
        // Convert cents to dollars
        const costUsd = totalAmount / 100
        const date = bucket.start_time
          ? new Date(bucket.start_time * 1000).toISOString().slice(0, 10)
          : ''
        dailyCosts.push({ date, costUsd })
        totalCost30d += costUsd
      }
    }

    // Aggregate usage by model
    const modelMap = new Map<string, { inputTokens: number; outputTokens: number }>()
    if (usageRes?.ok) {
      const usageBody = (await usageRes.json()) as {
        data?: Array<{
          results?: Array<{
            model?: string
            input_tokens?: number
            output_tokens?: number
          }>
        }>
      }
      for (const bucket of usageBody.data ?? []) {
        for (const result of bucket.results ?? []) {
          const model = result.model ?? 'unknown'
          const existing = modelMap.get(model) ?? { inputTokens: 0, outputTokens: 0 }
          existing.inputTokens += result.input_tokens ?? 0
          existing.outputTokens += result.output_tokens ?? 0
          modelMap.set(model, existing)
        }
      }
    }

    const modelUsage: UsageBucket[] = Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
    }))

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
    },
    usage: {
      totalCost30d: usageData?.totalCost30d ?? 0,
      dailyCosts,
      modelUsage: modelUsageList.map((m) => ({
        model: m.model,
        inputTokens: m.inputTokens,
        outputTokens: m.outputTokens,
      })),
      hasData: usageData !== null,
    },
    projectedMonthlySpend,
    costTrendPct,
    highestCostModel,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.orgId)
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
