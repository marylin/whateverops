import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber, formatCurrency } from '../../lib/format'

interface OpenAIPanelData {
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
}

export function OpenAIPanel({ data }: { data: OpenAIPanelData }) {
  const rl = data.rateLimits
  const hasTokenLimits = rl.tokensUsedPct !== null
  const hasRequestLimits = rl.requestsUsedPct !== null
  const usage = data.usage
  const hasUsage = usage?.hasData && (usage.totalCost30d > 0 || usage.modelUsage.length > 0)

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
        <ExternalLink href="https://platform.openai.com" className="text-xs text-gray-400">
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
                    className="flex-1 bg-[#10A37F60] rounded-sm"
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
                  <span className="text-gray-400 truncate max-w-[50%]">{m.model}</span>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>{smartNumber(m.inputTokens)} in</span>
                    <span>{smartNumber(m.outputTokens)} out</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  )
}
