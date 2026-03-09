import { useDashboard } from '../../hooks/useDashboard'
import { Header } from './Header'
import { PanelCard } from '../ui/PanelCard'
import { GenericPanel } from '../panels/GenericPanel'
import { StripePanel } from '../panels/StripePanel'
import type { IntegrationResult } from '../../lib/api'

function renderPanelContent(panel: IntegrationResult) {
  if (!panel.data) return <p className="text-sm text-gray-500">No data</p>

  if (panel.id === 'stripe') {
    return <StripePanel data={panel.data as unknown as Parameters<typeof StripePanel>[0]['data']} />
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && !data && <LoadingSkeleton />}
          {data?.panels.map((panel) => (
            <PanelCard
              key={panel.id}
              title={panel.name}
              status={panel.status}
              cached={panel.cached}
              lastUpdated={panel.lastUpdated}
              wide={panel.id === 'stripe'}
              error={panel.error}
              onRetry={refresh}
            >
              {renderPanelContent(panel)}
            </PanelCard>
          ))}
        </div>

        {data && (
          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-700">
              {data.configured} of {data.total} integrations configured
              {data.lastRefresh && ` · Last refresh: ${new Date(data.lastRefresh).toLocaleTimeString()}`}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
