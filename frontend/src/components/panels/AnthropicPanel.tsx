import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrency } from '../../lib/format'

interface AnthropicPanelData {
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

export function AnthropicPanel({ data }: { data: AnthropicPanelData }) {
  const rl = data.rateLimits
  const usage = data.usage
  const hasUsage = usage?.hasAdminKey && (usage.totalCost30d > 0 || usage.modelUsage.length > 0)
  const trendPct = data.costTrendPct
  const trendUp = trendPct !== null && trendPct > 0
  const trendDown = trendPct !== null && trendPct < 0
  const rateLimitPct = rl.tokensUsedPct ?? rl.requestsUsedPct ?? null
  const projectedSpend = data.projectedMonthlySpend ?? 0

  // Alert conditions
  const projectedHigh = projectedSpend > 2 * usage.totalCost30d && usage.totalCost30d > 0
  const rateLimitCritical = rateLimitPct !== null && rateLimitPct > 90

  if (!data.keyValid) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span className="text-sm font-semibold text-[#EF4444]">Invalid API key</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Hero: cost this month with trend arrow */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{formatCurrency(usage.totalCost30d)}</p>
          <p className="text-xs text-gray-500">This month</p>
        </div>
        <div className="text-right">
          {trendPct !== null && (
            <div className="flex items-center gap-1 justify-end">
              <span
                className={`text-sm font-semibold ${trendDown ? 'text-[#10B981]' : trendUp ? 'text-[#EF4444]' : 'text-gray-400'}`}
              >
                {trendDown ? '\u2193' : trendUp ? '\u2191' : '\u2192'} {Math.abs(trendPct)}%
              </span>
            </div>
          )}
          <p className="text-[10px] text-gray-600">vs last week</p>
        </div>
      </div>

      {/* Alert row */}
      {(projectedHigh || rateLimitCritical) && (
        <div className="flex flex-wrap gap-1.5">
          {projectedHigh && (
            <span className="text-[10px] px-2 py-0.5 bg-[#F59E0B20] text-[#F59E0B] rounded font-semibold">
              Projected spend {formatCurrency(projectedSpend)}
            </span>
          )}
          {rateLimitCritical && (
            <span className="text-[10px] px-2 py-0.5 bg-[#EF444420] text-[#EF4444] rounded font-semibold">
              Rate limit &gt;90%
            </span>
          )}
        </div>
      )}

      {/* Daily cost sparkline */}
      {hasUsage && usage.dailyCosts.length > 1 && (
        <div className="flex items-end gap-0.5 h-6">
          {usage.dailyCosts.slice(-14).map((day, i) => {
            const max = Math.max(...usage.dailyCosts.slice(-14).map((d) => d.cost), 0.01)
            const height = Math.max((day.cost / max) * 100, 4)
            return (
              <div
                key={i}
                className="flex-1 bg-[#0EA5E960] rounded-sm"
                style={{ height: `${height}%` }}
                title={`${day.date}: ${formatCurrency(day.cost)}`}
              />
            )
          })}
        </div>
      )}

      {/* Supporting metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Projected" value={formatCurrency(projectedSpend)} />
        <Metric label="Top Model" value={data.highestCostModel?.replace('claude-', '') ?? 'N/A'} />
        <Metric
          label="Rate Limit"
          value={rateLimitPct !== null ? `${rateLimitPct}%` : 'N/A'}
          trend={rateLimitCritical ? 'down' : undefined}
        />
      </div>

      {/* Rate limit bar */}
      {rl.tokensUsedPct !== null && (
        <ProgressBar
          value={rl.tokensUsedPct}
          color={rl.tokensUsedPct >= 90 ? 'red' : rl.tokensUsedPct >= 70 ? 'yellow' : 'blue'}
          label="Token usage"
          size="sm"
        />
      )}

      {/* No admin key hint */}
      {usage && !usage.hasAdminKey && (
        <div className="text-xs text-gray-600 bg-[#1E1E2E] rounded-lg px-3 py-2">
          Add <code className="text-gray-400">ANTHROPIC_ADMIN_API_KEY</code> for usage &amp; cost
          tracking
        </div>
      )}

      {/* Token reset */}
      {rl.tokensReset && (
        <p className="text-[10px] text-gray-600">
          Resets: {new Date(rl.tokensReset).toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
