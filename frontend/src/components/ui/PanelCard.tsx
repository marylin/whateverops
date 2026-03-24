import { type ReactNode } from 'react'
import { StatusDot } from './StatusDot'
import { StaleDot } from './StaleDot'
import { formatTimestamp } from '../../lib/format'

interface PanelCardProps {
  title: string
  status: 'ok' | 'warn' | 'error' | 'loading' | 'offline'
  cached?: boolean
  lastUpdated?: string | null
  ttl?: number
  wide?: boolean
  children: ReactNode
  onRetry?: () => void
  error?: string | null
}

const STATUS_PAGES: Record<string, string> = {
  github: 'https://www.githubstatus.com',
  vercel: 'https://www.vercel-status.com',
  railway: 'https://status.railway.app',
  stripe: 'https://status.stripe.com',
  cloudflare: 'https://www.cloudflarestatus.com',
  sentry: 'https://status.sentry.io',
  openai: 'https://status.openai.com',
  supabase: 'https://status.supabase.com',
  neon: 'https://neonstatus.com',
  posthog: 'https://status.posthog.com',
  resend: 'https://resend-status.com',
  linear: 'https://linearstatus.com',
  anthropic: 'https://status.anthropic.com',
}

function getStatusPage(title: string): string | undefined {
  const key = title.toLowerCase().replace(/\s+/g, '-')
  return STATUS_PAGES[key] ?? STATUS_PAGES[key.split('-')[0] ?? '']
}

export function PanelCard({
  title,
  status,
  lastUpdated,
  ttl,
  wide,
  children,
  onRetry,
  error,
}: PanelCardProps) {
  const statusPage = getStatusPage(title)

  if (status === 'error' && error) {
    const dashIdx = error.indexOf(' — ')
    const errorTitle = dashIdx !== -1 ? error.slice(0, dashIdx) : error
    const errorHint = dashIdx !== -1 ? error.slice(dashIdx + 3) : null

    return (
      <div
        className={`bg-[#161622] border border-[#EF444420] rounded-xl p-5 ${wide ? 'md:col-span-2' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusDot status="error" />
            <h3 className="text-base font-semibold text-[#E2E2E8]">{title}</h3>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#EF444415] text-[#EF4444] rounded">
            error
          </span>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-[#EF444408] border border-[#EF444415] px-3 py-2.5">
            <p className="text-sm text-[#F87171] leading-relaxed">{errorTitle}</p>
            {errorHint && (
              <p className="text-xs text-[#9090A0] mt-1.5 leading-relaxed">{errorHint}</p>
            )}
          </div>
          {lastUpdated && (
            <p className="text-xs text-[#606070]">Last success: {formatTimestamp(lastUpdated)}</p>
          )}
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm px-3 py-1.5 min-h-[44px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#E2E2E8] rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
            {statusPage && (
              <a
                href={statusPage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 min-h-[44px] flex items-center bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#E2E2E8] rounded-lg transition-colors"
              >
                Status page
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div
        className={`bg-[#161622] border border-[#252535] rounded-xl p-5 animate-pulse ${wide ? 'md:col-span-2' : ''}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#252535]" />
          <div className="h-4 w-24 bg-[#252535] rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-8 w-20 bg-[#252535] rounded" />
          <div className="h-3 w-full bg-[#1E1E2E] rounded" />
          <div className="h-3 w-3/4 bg-[#1E1E2E] rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-[#161622] border border-[#252535] rounded-xl p-5 hover:border-[#353550] transition-colors ${wide ? 'md:col-span-2' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <h3 className="text-base font-semibold text-[#E2E2E8]">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && ttl && (
            <StaleDot lastUpdated={lastUpdated} ttl={ttl} error={error ?? null} />
          )}
          {lastUpdated && (
            <span className="text-[10px] text-[#606070]">{formatTimestamp(lastUpdated)}</span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
