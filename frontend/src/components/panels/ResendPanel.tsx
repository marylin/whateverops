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
  const domainStats = data.domainStats ?? []
  const hasMultipleDomains = domainStats.length > 1
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Hero: delivery rate */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{Math.round(data.deliveryRate)}%</p>
          <p className="text-xs text-gray-500">Delivery rate</p>
        </div>
        <div className="text-right">
          <Metric
            label="Total Sent"
            value={data.totalSent > 0 ? data.totalSent.toLocaleString() : 'None yet'}
          />
        </div>
      </div>

      {data.totalSent > 0 && (
        <ProgressBar
          value={data.deliveryRate}
          color={data.deliveryRate >= 95 ? 'green' : data.deliveryRate >= 80 ? 'yellow' : 'red'}
          showValue={false}
        />
      )}

      {/* Bounce alert */}
      {data.bouncedCount > 0 && (
        <div className="flex items-center gap-2 text-xs bg-[#FF454510] border border-[#FF454515] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#FF4545] shrink-0" />
          <span className="text-[#FF6B6B]">
            {data.bouncedCount} bounced email{data.bouncedCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Per-domain breakdown */}
      {hasMultipleDomains && domainStats.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Domains</span>
          <div className="mt-1.5 space-y-1">
            {domainStats.map((ds) => {
              const isExpanded = expandedDomain === ds.name
              return (
                <div key={ds.name} className="border border-[#1E1E2E] rounded-lg">
                  <button
                    onClick={() => setExpandedDomain(isExpanded ? null : ds.name)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#1E1E2E20] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`transition-transform text-gray-600 ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        ▸
                      </span>
                      <ExternalLink
                        href={`https://resend.com/domains/${ds.name}`}
                        className="text-gray-300"
                      >
                        {ds.name}
                      </ExternalLink>
                      <StatusBadge status={ds.status} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-gray-600">{ds.totalSent} sent</span>
                      <span
                        className={
                          ds.deliveryRate >= 95
                            ? 'text-[#00D46A]'
                            : ds.deliveryRate >= 80
                              ? 'text-[#FFB800]'
                              : 'text-[#FF4545]'
                        }
                      >
                        {ds.deliveryRate}%
                      </span>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-2 border-t border-[#1E1E2E]">
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <Metric label="Sent" value={ds.totalSent} />
                        <Metric label="Delivered" value={ds.deliveredCount} />
                        <Metric
                          label="Bounced"
                          value={ds.bouncedCount}
                          trend={ds.bouncedCount > 0 ? 'down' : 'neutral'}
                        />
                      </div>
                      {ds.recentEmails.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {ds.recentEmails.slice(0, 3).map((email) => (
                            <div
                              key={email.id}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-400 truncate max-w-[60%]">
                                {truncate(email.subject || '(no subject)', 25)}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <StatusBadge status={email.status} />
                                <span className="text-gray-600">{timeAgo(email.sent)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Single domain or no domain stats: show flat domain list */}
      {!hasMultipleDomains && data.domains.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Domains</span>
          <div className="mt-1.5 space-y-1">
            {data.domains.map((domain) => (
              <div key={domain.name} className="flex items-center justify-between text-xs">
                <ExternalLink
                  href={`https://resend.com/domains/${domain.name}`}
                  className="text-gray-300"
                >
                  {domain.name}
                </ExternalLink>
                <StatusBadge status={domain.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent emails */}
      {data.recentEmails.length > 0 && !hasMultipleDomains && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Recent Emails</span>
          <div className="mt-1.5 space-y-1.5">
            {data.recentEmails.slice(0, 4).map((email, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="min-w-0">
                  <span className="text-gray-300 truncate block">
                    {truncate(email.subject || '(no subject)', 30)}
                  </span>
                  <span className="text-gray-600">{email.to}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <StatusBadge status={email.status} />
                  <span className="text-gray-600">{timeAgo(email.sent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
