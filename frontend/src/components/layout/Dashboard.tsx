import { useEffect } from 'react'
import { useDashboard } from '../../hooks/useDashboard'
import { Header } from './Header'
import { PanelCard } from '../ui/PanelCard'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { GenericPanel } from '../panels/GenericPanel'
import { StripePanel } from '../panels/StripePanel'
import { SentryPanel } from '../panels/SentryPanel'
import { VercelPanel } from '../panels/VercelPanel'
import { RailwayPanel } from '../panels/RailwayPanel'
import { GitHubPanel } from '../panels/GitHubPanel'
import { AnthropicPanel } from '../panels/AnthropicPanel'
import { OpenAIPanel } from '../panels/OpenAIPanel'
import { NeonPanel } from '../panels/NeonPanel'
import { LinearPanel } from '../panels/LinearPanel'
import { CloudflarePanel } from '../panels/CloudflarePanel'
import { ResendPanel } from '../panels/ResendPanel'
import { PostHogPanel } from '../panels/PostHogPanel'
import { SupabaseMgmtPanel } from '../panels/SupabaseMgmtPanel'
import { SupabaseAuthPanel } from '../panels/SupabaseAuthPanel'
import { SelfMonitoringPanel } from '../panels/SelfMonitoringPanel'
import { DailyDigest } from './DailyDigest'
import type { IntegrationResult } from '../../lib/api'

/** Wide panels that span 2 columns on xl (3-col) desktop layout */
const WIDE_PANELS = new Set(['stripe', 'github', 'sentry'])

/* eslint-disable @typescript-eslint/no-explicit-any */
const PANEL_MAP: Record<string, React.ComponentType<{ data: any }>> = {
  stripe: StripePanel,
  sentry: SentryPanel,
  vercel: VercelPanel,
  railway: RailwayPanel,
  github: GitHubPanel,
  anthropic: AnthropicPanel,
  openai: OpenAIPanel,
  neon: NeonPanel,
  linear: LinearPanel,
  cloudflare: CloudflarePanel,
  resend: ResendPanel,
  posthog: PostHogPanel,
  'supabase-management': SupabaseMgmtPanel,
  'supabase-auth': SupabaseAuthPanel,
  'self-monitoring': SelfMonitoringPanel,
}

function renderPanelContent(panel: IntegrationResult) {
  if (!panel.data) return <p className="text-sm text-gray-500">No data</p>

  const baseId = panel.id.replace(/-\d+$/, '')
  const PanelComponent = PANEL_MAP[baseId]

  if (PanelComponent) {
    return <PanelComponent data={panel.data} />
  }

  return <GenericPanel data={panel.data as Record<string, unknown>} />
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <PanelCard key={i} title="Loading..." status="loading">
          <div />
        </PanelCard>
      ))}
    </>
  )
}

export function Dashboard() {
  const { data, loading, error, refresh } = useDashboard()

  useEffect(() => {
    document.title = 'WhateverOPS'
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Header dashboard={data} onRefresh={refresh} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && !data && (
          <div className="text-center py-20">
            <p className="text-[#FF4545] mb-2">Failed to load dashboard</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {data && data.panels.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-white mb-2">No integrations configured</h2>
            <p className="text-sm text-gray-400">
              Add API keys to your .env file to see your integrations here.
            </p>
          </div>
        )}

        {data && data.panels.length > 0 && <DailyDigest panels={data.panels} />}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && !data && <LoadingSkeleton />}
          {data?.panels.map((panel) => {
            const wide = WIDE_PANELS.has(panel.id.replace(/-\d+$/, ''))
            return (
              <ErrorBoundary key={panel.id} title={panel.name}>
                <div className={wide ? 'xl:col-span-2' : ''}>
                  <PanelCard
                    title={panel.name}
                    status={panel.status}
                    cached={panel.cached}
                    lastUpdated={panel.lastUpdated}
                    ttl={panel.ttl}
                    wide={wide}
                    error={panel.error}
                    onRetry={refresh}
                  >
                    {renderPanelContent(panel)}
                  </PanelCard>
                </div>
              </ErrorBoundary>
            )
          })}
        </div>

        {data && (
          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-400">
              {data.configured} of {data.total} integrations configured
              {data.lastRefresh &&
                ` · Last refresh: ${new Date(data.lastRefresh).toLocaleTimeString()}`}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
