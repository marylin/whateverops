import { useState, useEffect, useCallback } from 'react'
import { fetchStatus, type StatusResponse } from '../lib/api'
import { formatTimestamp } from '../lib/format'

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  error: 'bg-red-500',
}

const STATUS_TEXT: Record<string, string> = {
  ok: 'Operational',
  warn: 'Degraded',
  error: 'Down',
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-500'}`}
    />
  )
}

export function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await fetchStatus()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Status | WhateverOPS'
    return () => {
      document.title = 'WhateverOPS'
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <header className="border-b border-[#1E1E2E] bg-[#0A0A0F]/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-lg font-bold text-[#7C3AED] hover:text-[#6D28D9]">
              WhateverOPS
            </a>
            <span className="text-sm text-gray-500">Status</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {loading && !data && (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading status...</p>
          </div>
        )}

        {error && !data && (
          <div className="text-center py-20">
            <p className="text-[#FF4545] mb-2">Failed to load status</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {data && (
          <>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E1E2E]">
                <StatusDot status={data.globalHealth} />
                <span className="text-sm font-medium text-white">
                  {data.globalHealth === 'ok'
                    ? 'All Systems Operational'
                    : data.globalHealth === 'warn'
                      ? 'Some Systems Degraded'
                      : 'System Issues Detected'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {data.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#1E1E2E] border border-[#2A2A3E]"
                >
                  <div className="flex items-center gap-3">
                    <StatusDot status={service.status} />
                    <span className="text-sm font-medium text-white">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(service.lastChecked)}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        service.status === 'ok'
                          ? 'text-emerald-400'
                          : service.status === 'warn'
                            ? 'text-amber-400'
                            : 'text-red-400'
                      }`}
                    >
                      {STATUS_TEXT[service.status] ?? 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Last refresh: {formatTimestamp(data.lastRefresh)}
                {' · '}
                Auto-refreshes every 30s
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
