import { Metric } from '../ui/Metric'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber } from '../../lib/format'

interface PostHogPanelData {
  activeUsers24h: number
  eventsToday: number
  featureFlags: number
  insights: number
}

export function PostHogPanel({ data }: { data: PostHogPanelData }) {
  const hasActivity = data.activeUsers24h > 0 || data.eventsToday > 0

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExternalLink href="https://app.posthog.com" className="text-xs text-gray-500">
          View in PostHog
        </ExternalLink>
      </div>
      {hasActivity ? (
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Active Users (24h)" value={smartNumber(data.activeUsers24h)} />
          <Metric label="Events Today" value={smartNumber(data.eventsToday)} />
        </div>
      ) : (
        <div>
          <p className="text-xs text-gray-500">No user activity data yet</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Feature Flags" value={data.featureFlags} />
        <Metric label="Insights" value={data.insights} />
      </div>
    </div>
  )
}
