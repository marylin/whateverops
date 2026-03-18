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
  replit: 'https://status.replit.com',
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
        className={`bg-[#111118] border border-[#FF454520] rounded-xl p-5 ${wide ? 'md:col-span-2' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusDot status="error" />
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#FF454515] text-[#FF4545] rounded">
            error
          </span>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-[#FF454508] border border-[#FF454515] px-3 py-2.5">
            <p className="text-sm text-[#FF6B6B] leading-relaxed">{errorTitle}</p>
            {errorHint && (
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{errorHint}</p>
            )}
          </div>
          {lastUpdated && (
            <p className="text-xs text-gray-500">Last success: {formatTimestamp(lastUpdated)}</p>
          )}
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs px-3 py-1.5 min-h-[44px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-gray-300 rounded-md transition-colors"
              >
                Retry
              </button>
            )}
            {statusPage && (
              <a
                href={statusPage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 min-h-[44px] flex items-center bg-[#1E1E2E] hover:bg-[#2A2A3E] text-gray-300 rounded-md transition-colors"
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
        className={`bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 animate-pulse ${wide ? 'md:col-span-2' : ''}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-gray-700" />
          <div className="h-4 w-24 bg-gray-700 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-8 w-20 bg-gray-700 rounded" />
          <div className="h-3 w-full bg-gray-800 rounded" />
          <div className="h-3 w-3/4 bg-gray-800 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-[#111118] border border-[#1E1E2E] rounded-xl p-5 hover:border-[#2A2A3E] transition-colors ${wide ? 'md:col-span-2' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && ttl && (
            <StaleDot lastUpdated={lastUpdated} ttl={ttl} error={error ?? null} />
          )}
          {lastUpdated && (
            <span className="text-[10px] text-gray-600">{formatTimestamp(lastUpdated)}</span>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
