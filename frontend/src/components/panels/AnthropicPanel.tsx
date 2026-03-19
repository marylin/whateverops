import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber, formatCurrency } from '../../lib/format'

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
}

export function AnthropicPanel({ data }: { data: AnthropicPanelData }) {
  const rl = data.rateLimits
  const hasTokenLimits = rl.tokensUsedPct !== null
  const hasRequestLimits = rl.requestsUsedPct !== null
  const usage = data.usage
  const hasUsage = usage?.hasAdminKey && (usage.totalCost30d > 0 || usage.modelUsage.length > 0)

  return (
    <div className="space-y-4">
      {/* Hero: key status + model count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.keyValid ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#00D46A]" />
              <span className="text-sm font-semibold text-white">API key active</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF4545]" />
              <span className="text-sm font-semibold text-[#FF4545]">Invalid API key</span>
            </>
          )}
        </div>
        <ExternalLink href="https://console.anthropic.com" className="text-xs text-gray-400">
          {data.modelCount} models
        </ExternalLink>
      </div>

      {/* Usage & Cost section */}
      {hasUsage && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 font-medium">Usage (30d)</span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(usage.totalCost30d)}
            </span>
          </div>

          {/* Daily cost sparkline */}
          {usage.dailyCosts.length > 1 && (
            <div className="flex items-end gap-0.5 h-6 mb-2">
              {usage.dailyCosts.slice(-14).map((day, i) => {
                const max = Math.max(...usage.dailyCosts.slice(-14).map((d) => d.cost), 0.01)
                const height = Math.max((day.cost / max) * 100, 4)
                return (
                  <div
                    key={i}
                    className="flex-1 bg-[#7C3AED60] rounded-sm"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${formatCurrency(day.cost)}`}
                  />
                )
              })}
            </div>
          )}

          {/* Model breakdown */}
          {usage.modelUsage.length > 0 && (
            <div className="space-y-1">
              {usage.modelUsage.slice(0, 4).map((m) => (
                <div key={m.model} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 truncate max-w-[50%]">
                    {m.model.replace('claude-', '')}
                  </span>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>{smartNumber(m.inputTokens)} in</span>
                    <span>{smartNumber(m.outputTokens)} out</span>
                    {m.cachedInputTokens > 0 && (
                      <span className="text-[#00D46A]">
                        {smartNumber(m.cachedInputTokens)} cached
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No admin key hint */}
      {usage && !usage.hasAdminKey && data.keyValid && (
        <div className="text-xs text-gray-600 bg-[#1E1E2E] rounded-lg px-3 py-2">
          Add <code className="text-gray-400">ANTHROPIC_ADMIN_API_KEY</code> for usage &amp; cost
          tracking
        </div>
      )}

      {/* Rate limits as progress bars */}
      {hasTokenLimits && (
        <ProgressBar
          value={rl.tokensUsedPct!}
          color={rl.tokensUsedPct! >= 90 ? 'red' : rl.tokensUsedPct! >= 70 ? 'yellow' : 'blue'}
          label="Token usage"
          size="md"
        />
      )}

      {hasRequestLimits && (
        <ProgressBar
          value={rl.requestsUsedPct!}
          color={rl.requestsUsedPct! >= 90 ? 'red' : rl.requestsUsedPct! >= 70 ? 'yellow' : 'blue'}
          label="Request usage"
          size="md"
        />
      )}

      {/* Remaining details */}
      <div className="grid grid-cols-2 gap-3">
        {rl.tokensRemaining !== null && (
          <Metric label="Tokens Remaining" value={rl.tokensRemaining.toLocaleString()} />
        )}
        {rl.requestsRemaining !== null && (
          <Metric label="Requests Remaining" value={rl.requestsRemaining.toLocaleString()} />
        )}
      </div>

      {/* Token reset */}
      {rl.tokensReset && (
        <p className="text-[10px] text-gray-600">
          Resets: {new Date(rl.tokensReset).toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
