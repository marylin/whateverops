import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'

interface AIProviderRateLimits {
  tokensRemaining: number | null
  tokensLimit: number | null
  tokensUsedPct: number | null
  requestsRemaining: number | null
  requestsLimit: number | null
  requestsUsedPct: number | null
  tokensReset?: string | null
}

interface AIProviderData {
  keyValid: boolean
  availableModels: string[]
  modelCount: number
  rateLimits: AIProviderRateLimits
}

export function AIProviderPanel({ data }: { data: AIProviderData }) {
  if (!data) return null
  const rl = data.rateLimits
  const hasTokenLimits = rl.tokensUsedPct !== null
  const hasRequestLimits = rl.requestsUsedPct !== null

  return (
    <div className="space-y-4">
      {/* Hero: rate limit status */}
      {!data.keyValid && (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
          <span className="text-sm font-semibold text-[#EF4444]">Invalid API key</span>
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
        <p className="text-[10px] text-[#606070]">
          Resets: {new Date(rl.tokensReset).toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
