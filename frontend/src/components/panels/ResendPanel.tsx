import { useState } from 'react'
import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'
import { timeAgo, truncate } from '../../lib/format'

interface ResendPanelData {
  domainCount: number
  domains: Array<{
    name: string
    status: string
  }>
  apiKeyCount: number
  recentEmails: Array<{
    to: string
    subject: string
    status: string
    sent: string
  }>
  deliveryRate: number
  totalSent: number
  bouncedCount: number
  domainStats: Array<{
    name: string
    status: string
    totalSent: number
    deliveredCount: number
    bouncedCount: number
    deliveryRate: number
    recentEmails: Array<{
      id: string
      to: string
      subject: string
      status: string
      sent: string
    }>
  }>
}

export function ResendPanel({ data }: { data: ResendPanelData }) {
  if (!data) return null
  const [showDomains, setShowDomains] = useState(false)
  const [showRecentEmails, setShowRecentEmails] = useState(false)

  const deliveryColor =
    data.deliveryRate >= 95
      ? 'bg-[#10B98120] text-[#10B981]'
      : data.deliveryRate >= 90
        ? 'bg-[#F59E0B20] text-[#F59E0B]'
        : 'bg-[#EF444420] text-[#EF4444]'

  const bounceRate = data.totalSent > 0 ? (data.bouncedCount / data.totalSent) * 100 : 0

  // Compute emails sent today from recentEmails
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const emailsSentToday = data.recentEmails.filter((e) => new Date(e.sent) >= today).length
  const emailsSentYesterday = data.recentEmails.filter((e) => {
    const sent = new Date(e.sent)
    return sent >= yesterday && sent < today
  }).length

  const todayComparison =
    emailsSentYesterday > 0
      ? emailsSentToday >= emailsSentYesterday
        ? `+${emailsSentToday - emailsSentYesterday} vs yesterday`
        : `${emailsSentToday - emailsSentYesterday} vs yesterday`
      : undefined

  const primaryDomain = data.domains[0]

  return (
    <div className="space-y-4">
      {/* Hero: delivery rate badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold text-[#E2E2E8]">{Math.round(data.deliveryRate)}%</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${deliveryColor}`}>
            {data.deliveryRate >= 95 ? 'Healthy' : data.deliveryRate >= 90 ? 'Warning' : 'Critical'}
          </span>
        </div>
        <p className="text-xs text-[#606070]">Delivery rate</p>
      </div>

      {data.totalSent > 0 && (
        <ProgressBar
          value={data.deliveryRate}
          color={data.deliveryRate >= 95 ? 'green' : data.deliveryRate >= 90 ? 'yellow' : 'red'}
          showValue={false}
        />
      )}

      {/* Alert row */}
      {data.deliveryRate < 90 && (
        <div className="flex items-center gap-2 text-xs bg-[#EF444410] border border-[#EF444415] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
          <span className="text-[#F87171]">
            Delivery rate below 90% — check bounces and domain reputation
          </span>
        </div>
      )}
      {bounceRate > 5 && data.deliveryRate >= 90 && (
        <div className="flex items-center gap-2 text-xs bg-[#F59E0B10] border border-[#F59E0B15] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-[#F59E0B]">
            Bounce rate at {bounceRate.toFixed(1)}% — exceeds 5% threshold
          </span>
        </div>
      )}

      {/* Supporting: Emails sent today | Bounces | Domain status */}
      <div className="grid grid-cols-3 gap-3">
        <Metric
          label="Sent Today"
          value={emailsSentToday}
          subValue={todayComparison}
          trend={
            todayComparison ? (emailsSentToday >= emailsSentYesterday ? 'up' : 'down') : undefined
          }
        />
        <Metric
          label="Bounced"
          value={data.bouncedCount}
          trend={data.bouncedCount > 0 ? 'down' : 'neutral'}
        />
        {primaryDomain && (
          <div>
            <p className="text-xs text-[#606070] mb-1">Domain</p>
            <StatusBadge status={primaryDomain.status} />
          </div>
        )}
      </div>

      {/* De-emphasized: expandable domain details */}
      {data.domains.length > 0 && (
        <div className="pt-1 border-t border-[#1E1E2E]">
          <button
            onClick={() => setShowDomains(!showDomains)}
            className="flex items-center gap-1.5 text-[10px] text-[#606070] hover:text-[#9090A0] transition-colors"
          >
            <span className={`transition-transform ${showDomains ? 'rotate-90' : ''}`}>
              &#9658;
            </span>
            {data.domains.length} domain{data.domains.length !== 1 ? 's' : ''} configured
          </button>
          {showDomains && (
            <div className="mt-1.5 space-y-1">
              {data.domains.map((domain) => (
                <div key={domain.name} className="flex items-center justify-between text-xs">
                  <ExternalLink
                    href={`https://resend.com/domains/${domain.name}`}
                    className="text-[#9090A0]"
                  >
                    {domain.name}
                  </ExternalLink>
                  <StatusBadge status={domain.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* De-emphasized: recent emails — collapsed by default */}
      {data.recentEmails.length > 0 && (
        <div>
          <button
            onClick={() => setShowRecentEmails(!showRecentEmails)}
            className="text-[10px] text-[#606070] hover:text-[#9090A0] flex items-center gap-1"
          >
            <span>{showRecentEmails ? '▼' : '►'}</span>
            {showRecentEmails ? 'Show less' : `Recent (${Math.min(data.recentEmails.length, 3)})`}
          </button>
          {showRecentEmails && (
            <div className="mt-1 space-y-1">
              {data.recentEmails.slice(0, 3).map((email, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-[#606070] truncate max-w-[60%]">
                    {truncate(email.subject || '(no subject)', 30)}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={email.status} />
                    <span className="text-[#606070]">{timeAgo(email.sent)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
