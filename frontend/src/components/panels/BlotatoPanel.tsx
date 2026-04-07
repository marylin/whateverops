// frontend/src/components/panels/BlotatoPanel.tsx
import { ExternalLink } from '../ui/ExternalLink'

interface BlotatoPanelData {
  subscriptionStatus: string | null
  connectedAccounts: Array<{ platform: string; username: string }>
  platformCount: number
  queuedCount: number
  nextPosts: Array<{
    platform: string
    username: string
    text: string
    scheduledAt: string
  }>
  slotsByDay: Record<string, number>
  totalSlots: number
}

function formatScheduledTime(iso: string): string {
  const date = new Date(iso)
  const now = Date.now()
  const diffMs = date.getTime() - now

  if (diffMs < 0) return 'past'
  if (diffMs < 60 * 60 * 1000) return `in ${Math.round(diffMs / 60_000)}m`
  if (diffMs < 24 * 60 * 60 * 1000) return `in ${Math.round(diffMs / 3_600_000)}h`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    instagram: 'Instagram',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    pinterest: 'Pinterest',
    threads: 'Threads',
    bluesky: 'Bluesky',
    youtube: 'YouTube',
  }
  return labels[platform] ?? platform
}

export function BlotatoPanel({ data }: { data: BlotatoPanelData }) {
  if (!data) return null

  const hasAccounts = data.connectedAccounts.length > 0
  const isActive = data.subscriptionStatus === 'active' || data.subscriptionStatus === 'trialing'
  const hasQueue = data.queuedCount > 0

  const statusLabel =
    !hasAccounts || !isActive ? 'Inactive' : hasQueue ? 'Active' : 'No Posts Queued'
  const statusColor =
    !hasAccounts || !isActive ? 'bg-[#EF4444]' : hasQueue ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
  const statusTextColor =
    !hasAccounts || !isActive ? 'text-[#EF4444]' : hasQueue ? 'text-[#10B981]' : 'text-[#F59E0B]'

  const uniquePlatforms = [...new Set(data.connectedAccounts.map((a) => a.platform))]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <span className={`text-sm font-bold ${statusTextColor}`}>{statusLabel}</span>
        </div>
        <ExternalLink href="https://app.blotato.com" className="text-xs text-[#606070]">
          View in Blotato
        </ExternalLink>
      </div>

      {!hasAccounts && <p className="text-xs text-[#606070]">No social accounts connected</p>}

      {hasAccounts && (
        <>
          <div className="text-xs text-[#9090A0]">
            {uniquePlatforms.map((p) => platformLabel(p)).join(', ')} — {data.platformCount}{' '}
            connected
          </div>

          {/* Weekly schedule slots */}
          {data.totalSlots > 0 && (
            <div className="flex items-center gap-1">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(
                (day) => {
                  const count = data.slotsByDay[day] ?? 0
                  return (
                    <div key={day} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[8px] text-[#606070] uppercase">{day.slice(0, 2)}</span>
                      <div
                        className={`w-full h-1.5 rounded-full ${
                          count > 0 ? 'bg-[#0EA5E9]' : 'bg-[#1E1E2E]'
                        }`}
                        title={`${day}: ${count} slot${count !== 1 ? 's' : ''}`}
                      />
                      {count > 0 && <span className="text-[8px] text-[#9090A0]">{count}</span>}
                    </div>
                  )
                },
              )}
              <span className="text-[10px] text-[#606070] ml-2">{data.totalSlots} slots/wk</span>
            </div>
          )}

          {hasQueue ? (
            <div className="space-y-2">
              <p className="text-xs text-[#606070]">{data.queuedCount} posts queued</p>
              <div className="space-y-1">
                {data.nextPosts.map((post, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-[#161622] border border-[#252535] rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-[#9090A0] shrink-0 w-16">
                        {platformLabel(post.platform)}
                      </span>
                      {post.username && (
                        <span className="text-[10px] text-[#606070] shrink-0">
                          @{post.username}
                        </span>
                      )}
                      <span className="text-xs text-[#E2E2E8] truncate">
                        {post.text || 'No text'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#606070] shrink-0">
                      {formatScheduledTime(post.scheduledAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#606070]">No posts scheduled — queue is empty</p>
          )}
        </>
      )}
    </div>
  )
}
