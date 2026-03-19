import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { ExternalLink } from '../ui/ExternalLink'
import { timeAgo, smartNumber } from '../../lib/format'

interface SentryPanelData {
  unresolvedCount: number
  events24h: number
  latestIssues: Array<{
    id: string
    title: string
    culprit: string
    count: number
    level: string
    lastSeen: string
    userCount: number
  }>
  crashFreeRate: number | null
  errorTrend: Array<{ date: string; count: number }>
  errorTrendDirection: 'up' | 'down' | 'stable'
}

const TREND_LABELS: Record<string, string> = {
  up: '\u2191 Increasing',
  down: '\u2193 Decreasing',
  stable: '\u2192 Stable',
}

const TREND_COLORS: Record<string, 'up' | 'down' | 'neutral'> = {
  up: 'down', // errors going up = bad
  down: 'up', // errors going down = good
  stable: 'neutral',
}

export function SentryPanel({ data }: { data: SentryPanelData }) {
  const trendLabel = TREND_LABELS[data.errorTrendDirection] ?? '\u2192 Stable'
  const trendColor = TREND_COLORS[data.errorTrendDirection] ?? 'neutral'

  return (
    <div className="space-y-4">
      {/* Hero: unresolved count + trend */}
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-3xl font-bold ${data.unresolvedCount > 0 ? 'text-[#FF4545]' : 'text-white'}`}
          >
            {data.unresolvedCount}
          </p>
          <p className="text-xs text-gray-500">Unresolved issues</p>
        </div>
        <div className="text-right">
          <Metric
            label="Events (24h)"
            value={smartNumber(data.events24h)}
            subValue={trendLabel}
            trend={trendColor}
          />
        </div>
      </div>

      {/* Crash-free rate */}
      {data.crashFreeRate !== null && (
        <ProgressBar
          value={data.crashFreeRate}
          color={data.crashFreeRate >= 99 ? 'green' : data.crashFreeRate >= 95 ? 'yellow' : 'red'}
          label="Crash-free rate"
        />
      )}

      {/* Error trend mini chart */}
      {data.errorTrend.length > 1 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">7-day trend</span>
          <div className="flex items-end gap-1 mt-1.5 h-8">
            {data.errorTrend.map((point, i) => {
              const max = Math.max(...data.errorTrend.map((p) => p.count), 1)
              const height = Math.max((point.count / max) * 100, 4)
              return (
                <div
                  key={i}
                  className="flex-1 bg-[#FF454560] rounded-sm transition-all"
                  style={{ height: `${height}%` }}
                  title={`${point.date}: ${point.count} events`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Latest issues */}
      {data.latestIssues.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Latest Issues</span>
          <div className="mt-1.5 space-y-1.5">
            {data.latestIssues.slice(0, 4).map((issue) => (
              <div key={issue.id} className="text-xs">
                <div className="flex items-center justify-between">
                  <ExternalLink
                    href={`https://sentry.io/issues/${issue.id}/`}
                    className="text-gray-300 truncate max-w-[70%]"
                  >
                    {issue.title}
                  </ExternalLink>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-gray-600">{issue.count}×</span>
                    {issue.level === 'error' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF4545]" />
                    )}
                    {issue.level === 'warning' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                    )}
                  </div>
                </div>
                <p className="text-gray-600 truncate">
                  {issue.culprit} · {timeAgo(issue.lastSeen)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
