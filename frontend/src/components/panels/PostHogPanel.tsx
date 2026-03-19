import { Metric } from '../ui/Metric'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber } from '../../lib/format'

interface TrendPoint {
  date: string
  count: number
}

interface TopEvent {
  event: string
  count: number
}

interface PostHogPanelData {
  dau: number
  wau: number
  eventsToday: number
  eventsTrend: TrendPoint[]
  topEvents: TopEvent[]
  dauTrend: TrendPoint[]
  dauChangePercent: number
}

/** Mini sparkline rendered inline via SVG */
function Sparkline({ data, color = '#0EA5E9' }: { data: TrendPoint[]; color?: string }) {
  if (data.length < 2) return null

  const max = Math.max(...data.map((d) => d.count), 1)
  const w = 120
  const h = 28

  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - (d.count / max) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  )
}

export function PostHogPanel({ data }: { data: PostHogPanelData }) {
  const trendDir = data.dauChangePercent > 0 ? 'up' : data.dauChangePercent < 0 ? 'down' : 'neutral'
  const trendLabel =
    data.dauChangePercent > 0
      ? `+${data.dauChangePercent}%`
      : data.dauChangePercent < 0
        ? `${data.dauChangePercent}%`
        : '0%'

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExternalLink href="https://app.posthog.com" className="text-xs text-gray-500">
          View in PostHog
        </ExternalLink>
      </div>

      {/* Hero: DAU */}
      <div className="flex items-end justify-between">
        <Metric
          label="Daily Active Users"
          value={smartNumber(data.dau)}
          subValue={`${trendLabel} vs yesterday`}
          trend={trendDir}
        />
        <Sparkline data={data.dauTrend} />
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="WAU" value={smartNumber(data.wau)} />
        <Metric label="Events Today" value={smartNumber(data.eventsToday)} />
        <div>
          <p className="text-xs text-gray-500 mb-1">Events (14d)</p>
          <Sparkline data={data.eventsTrend} color="#10B981" />
        </div>
      </div>

      {/* Top events */}
      {data.topEvents.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Top Events Today</span>
          <div className="mt-1.5 space-y-1">
            {data.topEvents.map((evt) => (
              <div key={evt.event} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 truncate">{evt.event}</span>
                <span className="text-gray-500 shrink-0 ml-2">{smartNumber(evt.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
