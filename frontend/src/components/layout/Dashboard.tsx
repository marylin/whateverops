import { useEffect, useState } from 'react'
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
import { SupabaseStoragePanel } from '../panels/SupabaseStoragePanel'
import { SelfMonitoringPanel } from '../panels/SelfMonitoringPanel'
import { DailyDigest, DailyDigestSkeleton } from './DailyDigest'
import type { IntegrationResult } from '../../lib/api'

/** Wide panels that span 2 columns on xl (3-col) desktop layout */
const WIDE_PANELS = new Set([
  'stripe',
  'github',
  'sentry',
  'supabase-management',
  'supabase-storage',
])

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
  'supabase-storage': SupabaseStoragePanel,
  'self-monitoring': SelfMonitoringPanel,
}

function renderPanelContent(panel: IntegrationResult) {
  if (!panel.data) return <p className="text-sm text-[#606070]">No data</p>

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

/**
 * Cards grouped by the 5 solopreneur questions:
 *   1. "Is my product making money?"
 *   2. "Is anything broken right now?"
 *   3. "Are people using it?"
 *   4. "Am I burning too much?"
 *   5. "What needs my attention today?"
 */
const FOUNDER_GROUPS: Array<{
  id: string
  label: string
  question: string
  integrations: string[]
}> = [
  {
    id: 'money',
    label: 'Revenue',
    question: 'Is my product making money?',
    integrations: ['stripe'],
  },
  {
    id: 'health',
    label: 'Health',
    question: 'Is anything broken right now?',
    integrations: [
      'sentry',
      'vercel',
      'railway',
      'neon',
      'supabase-management',
      'supabase-storage',
      'cloudflare',
      'self-monitoring',
    ],
  },
  {
    id: 'users',
    label: 'Users',
    question: 'Are people using it?',
    integrations: ['posthog', 'supabase-auth'],
  },
  {
    id: 'costs',
    label: 'Costs',
    question: 'Am I burning too much?',
    integrations: ['anthropic', 'openai'],
  },
  {
    id: 'attention',
    label: 'Attention',
    question: 'What needs my attention today?',
    integrations: ['linear', 'github', 'resend'],
  },
]

function GroupedPanels({
  panels,
  onRefresh,
}: {
  panels: IntegrationResult[]
  onRefresh: () => void
}) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dashboard-collapsed-groups')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  function toggleGroup(groupId: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      localStorage.setItem('dashboard-collapsed-groups', JSON.stringify([...next]))
      return next
    })
  }

  // Build a map of panel ID (stripping instance suffix) → panel
  const panelMap = new Map<string, IntegrationResult[]>()
  for (const panel of panels) {
    const baseId = panel.id.replace(/-\d+$/, '')
    if (!panelMap.has(baseId)) panelMap.set(baseId, [])
    panelMap.get(baseId)!.push(panel)
  }

  // Track which panels are assigned to a group
  const assigned = new Set<string>()

  return (
    <div className="space-y-6 mt-4">
      {FOUNDER_GROUPS.map((group) => {
        // Collect panels for this group
        const groupPanels: IntegrationResult[] = []
        for (const intId of group.integrations) {
          const instances = panelMap.get(intId) ?? []
          for (const p of instances) {
            groupPanels.push(p)
            assigned.add(p.id)
          }
        }

        if (groupPanels.length === 0) return null

        const isCollapsed = collapsedGroups.has(group.id)
        const errorCount = groupPanels.filter((p) => p.status === 'error').length
        const warnCount = groupPanels.filter((p) => p.status === 'warn').length

        return (
          <section key={group.id} role="region" aria-label={`${group.label} group`}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${group.label} group`}
              aria-expanded={!isCollapsed}
              className="w-full flex items-center justify-between mb-3 group"
            >
              <div className="flex items-center gap-3">
                <svg
                  className={`w-4 h-4 text-[#606070] transition-transform ${isCollapsed ? '-rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <h2 className="text-sm font-semibold text-[#E2E2E8] uppercase tracking-wider">
                  {group.label}
                </h2>
                <span className="text-xs text-[#606070] font-normal normal-case">
                  {group.question}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {errorCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EF444420] text-[#EF4444]">
                    {errorCount} error{errorCount !== 1 ? 's' : ''}
                  </span>
                )}
                {warnCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B20] text-[#F59E0B]">
                    {warnCount} warning{warnCount !== 1 ? 's' : ''}
                  </span>
                )}
                {errorCount === 0 && warnCount === 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B98120] text-[#10B981]">
                    all ok
                  </span>
                )}
                <span className="text-[10px] text-[#606070]">
                  {groupPanels.length} card{groupPanels.length !== 1 ? 's' : ''}
                </span>
              </div>
            </button>

            {/* Collapsed summary */}
            {isCollapsed ? null : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupPanels.map((panel) => {
                  const wide = WIDE_PANELS.has(panel.id.replace(/-\d+$/, ''))
                  return (
                    <ErrorBoundary key={panel.id} title={panel.name}>
                      <div className={wide ? 'xl:col-span-2' : ''} data-panel-id={panel.id}>
                        <PanelCard
                          title={panel.name}
                          status={panel.status}
                          cached={panel.cached}
                          lastUpdated={panel.lastUpdated}
                          ttl={panel.ttl}
                          wide={wide}
                          error={panel.error}
                          onRetry={onRefresh}
                        >
                          {renderPanelContent(panel)}
                        </PanelCard>
                      </div>
                    </ErrorBoundary>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}

      {/* Ungrouped panels (future integrations not yet categorized) */}
      {(() => {
        const ungrouped = panels.filter((p) => !assigned.has(p.id))
        if (ungrouped.length === 0) return null
        return (
          <section>
            <h2 className="text-sm font-semibold text-[#E2E2E8] uppercase tracking-wider mb-3">
              Other
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {ungrouped.map((panel) => (
                <ErrorBoundary key={panel.id} title={panel.name}>
                  <div data-panel-id={panel.id}>
                    <PanelCard
                      title={panel.name}
                      status={panel.status}
                      cached={panel.cached}
                      lastUpdated={panel.lastUpdated}
                      ttl={panel.ttl}
                      error={panel.error}
                      onRetry={onRefresh}
                    >
                      {renderPanelContent(panel)}
                    </PanelCard>
                  </div>
                </ErrorBoundary>
              ))}
            </div>
          </section>
        )
      })()}
    </div>
  )
}

export function Dashboard() {
  const { data, loading, error, refresh } = useDashboard()

  useEffect(() => {
    document.title = 'WhateverOPS'
  }, [])

  return (
    <div className="min-h-screen bg-[#0C0C14]">
      <Header dashboard={data} onRefresh={refresh} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && !data && (
          <div className="text-center py-20">
            <p className="text-[#EF4444] mb-2">Failed to load dashboard</p>
            <p className="text-sm text-[#606070] mb-4">{error}</p>
            <button
              onClick={refresh}
              className="text-sm px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {data && data.panels.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-[#E2E2E8] mb-2">
              No integrations configured
            </h2>
            <p className="text-sm text-[#9090A0]">
              Add API keys to your .env file to see your integrations here.
            </p>
          </div>
        )}

        {data && data.panels.length > 0 && <DailyDigest panels={data.panels} />}

        {loading && !data && <DailyDigestSkeleton />}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && !data && <LoadingSkeleton />}
        </div>

        {data && data.panels.length > 0 && (
          <GroupedPanels panels={data.panels} onRefresh={refresh} />
        )}

        {data && (
          <div className="mt-6 text-center">
            <p className="text-[10px] text-[#9090A0]">
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
