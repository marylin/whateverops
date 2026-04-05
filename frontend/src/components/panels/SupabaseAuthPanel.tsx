import { useState } from 'react'
import { Metric } from '../ui/Metric'
import { MiniBar } from '../ui/MiniBar'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber } from '../../lib/format'

interface SupabaseAuthPanelData {
  totalUsers: number
  recentSignups: number
  activeRecently: number
  providerBreakdown: Record<string, number>
  signupsTrend: 'up' | 'down' | 'flat'
  dauPct: number
  daysSinceLastSignup: number | null
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
  const [showProviders, setShowProviders] = useState(false)

  const providers = Object.entries(data.providerBreakdown)
  const providerSegments = providers.map(([name, count]) => ({
    value: count,
    color: PROVIDER_COLORS[name.toLowerCase()] ?? '#6B7280',
    label: name,
  }))

  const hasUsers = data.totalUsers > 0
  const signupBadgeColor =
    data.signupsTrend === 'up'
      ? 'bg-[#10B98120] text-[#10B981]'
      : data.signupsTrend === 'down'
        ? 'bg-[#EF444420] text-[#EF4444]'
        : 'bg-[#1E1E2E] text-[#9090A0]'

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
          View in Supabase
        </ExternalLink>
      </div>

      {/* Hero: total users with weekly signup badge */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-[#E2E2E8]">{smartNumber(data.totalUsers)}</p>
            {data.recentSignups > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${signupBadgeColor}`}>
                +{data.recentSignups} this week
              </span>
            )}
          </div>
          <p className="text-xs text-[#606070]">Total users</p>
        </div>
      </div>

      {/* Alert row */}
      {data.daysSinceLastSignup !== null && data.daysSinceLastSignup > 3 && (
        <div className="flex items-center gap-2 text-xs bg-[#F59E0B10] border border-[#F59E0B15] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-[#F59E0B]">
            No new signups in {data.daysSinceLastSignup} day
            {data.daysSinceLastSignup !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {hasUsers && data.dauPct < 5 && (
        <div className="flex items-center gap-2 text-xs bg-[#F59E0B10] border border-[#F59E0B15] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-[#F59E0B]">DAU at {data.dauPct}% — low daily engagement</span>
        </div>
      )}

      {/* Empty state */}
      {!hasUsers && (
        <p className="text-xs text-[#606070]">No users yet — auth is configured and ready</p>
      )}

      {/* Supporting: Active today | Signups this week (with trend) | DAU % */}
      {hasUsers && (
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Active (24h)" value={data.activeRecently} />
          <Metric
            label="Signups (7d)"
            value={data.recentSignups}
            subValue={
              data.signupsTrend === 'up'
                ? 'Trending up'
                : data.signupsTrend === 'down'
                  ? 'Trending down'
                  : undefined
            }
            trend={
              data.signupsTrend === 'up' ? 'up' : data.signupsTrend === 'down' ? 'down' : undefined
            }
          />
          <Metric label="DAU %" value={`${data.dauPct}%`} />
        </div>
      )}

      {/* De-emphasized: provider breakdown (expandable) */}
      {providerSegments.length > 0 && providerSegments.some((s) => s.value > 0) && (
        <div className="pt-1 border-t border-[#1E1E2E]">
          <button
            onClick={() => setShowProviders(!showProviders)}
            className="flex items-center gap-1.5 text-[10px] text-[#606070] hover:text-[#9090A0] transition-colors"
          >
            <span className={`transition-transform ${showProviders ? 'rotate-90' : ''}`}>
              &#9658;
            </span>
            Auth providers ({providers.length})
          </button>
          {showProviders && (
            <div className="mt-1.5">
              <MiniBar segments={providerSegments} height={8} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
