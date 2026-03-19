import { Metric } from '../ui/Metric'
import { MiniBar } from '../ui/MiniBar'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber } from '../../lib/format'

interface SupabaseAuthPanelData {
  totalUsers: number
  recentSignups: number
  activeRecently: number
  providerBreakdown: Record<string, number>
}

const PROVIDER_COLORS: Record<string, string> = {
  email: '#3B82F6',
  google: '#34A853',
  github: '#9CA3AF',
  apple: '#A2AAAD',
  twitter: '#1DA1F2',
  discord: '#5865F2',
  facebook: '#1877F2',
}

export function SupabaseAuthPanel({ data }: { data: SupabaseAuthPanelData }) {
  const providers = Object.entries(data.providerBreakdown)
  const providerSegments = providers.map(([name, count]) => ({
    value: count,
    color: PROVIDER_COLORS[name.toLowerCase()] ?? '#6B7280',
    label: name,
  }))

  const hasUsers = data.totalUsers > 0

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-gray-500">
          View in Supabase
        </ExternalLink>
      </div>
      {/* Hero: total users */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{smartNumber(data.totalUsers)}</p>
          <p className="text-xs text-gray-500">Total users</p>
        </div>
        {hasUsers && (
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Signups (7d)" value={data.recentSignups} />
            <Metric label="Active (24h)" value={data.activeRecently} />
          </div>
        )}
      </div>

      {/* Empty state */}
      {!hasUsers && (
        <p className="text-xs text-gray-500">No users yet — auth is configured and ready</p>
      )}

      {/* Provider breakdown */}
      {providerSegments.length > 0 && providerSegments.some((s) => s.value > 0) && (
        <div>
          <span className="text-xs text-gray-500 font-medium mb-1.5 block">Auth Providers</span>
          <MiniBar segments={providerSegments} height={8} />
        </div>
      )}
    </div>
  )
}
