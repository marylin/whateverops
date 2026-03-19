import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { ExternalLink } from '../ui/ExternalLink'
import { timeAgo, smartNumber } from '../../lib/format'

interface SentryPanelData {
  unresolvedCount: number
  events24h: number
  newIssues24h: number
  usersAffected24h: number
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
  latestRelease: { version: string; date: string } | null
  issuesSinceRelease: number
}

const TREND_COLORS: Record<string, 'up' | 'down' | 'neutral'> = {
  up: 'down', // errors going up = bad
  down: 'up', // errors going down = good
  stable: 'neutral',
}

function crashFreeColor(rate: number | null): 'green' | 'yellow' | 'red' {
  if (rate == null) return 'green'
  if (rate >= 99.5) return 'green'
  if (rate >= 99) return 'yellow'
  return 'red'
}

function crashFreeBadgeClass(rate: number | null): string {
  if (rate == null) return 'bg-[#1E1E2E] text-gray-400'
  if (rate >= 99.5) return 'bg-[#00D46A20] text-[#00D46A]'
  if (rate >= 99) return 'bg-[#FFB80020] text-[#FFB800]'
  return 'bg-[#FF454520] text-[#FF4545]'
}

export function SentryPanel({ data }: { data: SentryPanelData }) {
  const trendColor = TREND_COLORS[data.errorTrendDirection] ?? 'neutral'
  const hasAlerts =
    data.newIssues24h > 0 ||
    (data.crashFreeRate !== null && data.crashFreeRate < 99) ||
    data.errorTrendDirection === 'up'

  return (
    <div className="space-y-4">
      {/* Hero: crash-free rate badge */}
      <div className="flex items-start justify-between">
        <div>
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xl font-bold ${crashFreeBadgeClass(data.crashFreeRate)}`}
          >
            {data.crashFreeRate !== null ? `${data.crashFreeRate}%` : 'N/A'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Crash-free rate (24h)</p>
        </div>
        {data.latestRelease && (
          <div className="text-right">
            <p className="text-xs text-gray-400 font-mono">
              {data.latestRelease.version.slice(0, 12)}
            </p>
            <p className="text-[10px] text-gray-600">Latest release</p>
          </div>
        )}
      </div>

      {data.crashFreeRate !== null && (
        <ProgressBar
          value={data.crashFreeRate}
          color={crashFreeColor(data.crashFreeRate)}
          showValue={false}
        />
      )}

      {/* Alert row */}
      {hasAlerts && (
        <div className="space-y-1">
          {data.newIssues24h > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#FF454515] border border-[#FF454530]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4545] shrink-0" />
              <span className="text-xs text-[#FF4545]">
                {data.newIssues24h} NEW error{data.newIssues24h !== 1 ? 's' : ''} since last deploy
              </span>
            </div>
          )}
          {data.crashFreeRate !== null && data.crashFreeRate < 99 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#FF454515] border border-[#FF454530]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF4545] shrink-0" />
              <span className="text-xs text-[#FF4545]">
                Crash-free rate below 99% ({data.crashFreeRate}%)
              </span>
            </div>
          )}
          {data.errorTrendDirection === 'up' && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#FFB80015] border border-[#FFB80030]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800] shrink-0" />
              <span className="text-xs text-[#FFB800]">Error trend is increasing</span>
            </div>
          )}
        </div>
      )}

      {/* Supporting metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Metric
          label="Users affected"
          value={smartNumber(data.usersAffected24h)}
          subValue="today"
        />
        <Metric label="Unresolved" value={data.unresolvedCount} trend={trendColor} />
        <Metric label="Events (24h)" value={smartNumber(data.events24h)} />
      </div>

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

      {/* Latest issues (compact) */}
      {data.latestIssues.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Latest Issues</span>
          <div className="mt-1.5 space-y-1.5">
            {data.latestIssues.slice(0, 3).map((issue) => (
              <div key={issue.id} className="text-xs">
                <div className="flex items-center justify-between">
                  <ExternalLink
                    href={`https://sentry.io/issues/${issue.id}/`}
                    className="text-gray-300 truncate max-w-[70%]"
                  >
                    {issue.title}
                  </ExternalLink>
                  <div className="flex items-center gap-2 shrink-0">
                    {issue.userCount > 0 && (
                      <span className="text-gray-600">
                        {issue.userCount} user{issue.userCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-gray-600">{issue.count}&times;</span>
                    {issue.level === 'error' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF4545]" />
                    )}
                    {issue.level === 'warning' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]" />
                    )}
                  </div>
                </div>
                <p className="text-gray-600 truncate">
                  {issue.culprit} &middot; {timeAgo(issue.lastSeen)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
