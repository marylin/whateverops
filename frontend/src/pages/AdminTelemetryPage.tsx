import { useEffect, useState } from 'react'

interface TelemetryData {
  summary: {
    totalInstances: number
    activeInstances: number
    totalHeartbeats: number
    avgUptimeHours: number
    avgConfiguredIntegrations: number
  }
  versionDistribution: Record<string, number>
  platformDistribution: Record<string, number>
  dailyTrend: Array<{ date: string; instances: number }>
  instances: Array<{
    instanceId: string
    firstSeen: string
    lastSeen: string
    heartbeats: number
    version: string
    platform: string
    configuredCount: number
    lastUptimeFormatted: string
    isActive: boolean
  }>
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export function AdminTelemetryPage() {
  const [data, setData] = useState<TelemetryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/telemetry`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-[#9090A0]">Loading telemetry...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[#E2E2E8] mb-4">Telemetry Admin</h1>
        <div className="bg-[#EF444410] border border-[#EF444415] rounded-lg px-4 py-3">
          <p className="text-[#EF4444]">Failed to load: {error}</p>
          <p className="text-xs text-[#606070] mt-1">
            Make sure SUPABASE_ADMIN_SERVICE_KEY is set in .env
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, versionDistribution, platformDistribution, dailyTrend, instances } = data

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E2E2E8]">Telemetry Admin</h1>
        <span className="text-xs text-[#606070]">Private — not part of the product</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryCard label="Total Instances" value={summary.totalInstances} />
        <SummaryCard
          label="Active (48h)"
          value={summary.activeInstances}
          accent={summary.activeInstances > 0}
        />
        <SummaryCard label="Heartbeats" value={summary.totalHeartbeats} />
        <SummaryCard label="Avg Uptime" value={`${summary.avgUptimeHours}h`} />
        <SummaryCard label="Avg Integrations" value={summary.avgConfiguredIntegrations} />
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DistributionCard title="Version Distribution" data={versionDistribution} />
        <DistributionCard title="Platform Distribution" data={platformDistribution} />
      </div>

      {/* Daily trend */}
      {dailyTrend.length > 0 && (
        <div className="border border-[#252535] rounded-lg p-4">
          <h2 className="text-sm font-medium text-[#E2E2E8] mb-3">Daily Active Instances</h2>
          <div className="flex items-end gap-1 h-24">
            {dailyTrend.map((day) => {
              const max = Math.max(...dailyTrend.map((d) => d.instances), 1)
              const height = (day.instances / max) * 100
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-[#0EA5E9] rounded-sm min-h-[2px]"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.instances} instances`}
                  />
                  <span className="text-[8px] text-[#606070] rotate-45 origin-left">
                    {day.date.slice(5)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Instances table */}
      <div className="border border-[#252535] rounded-lg overflow-hidden">
        <h2 className="text-sm font-medium text-[#E2E2E8] px-4 py-3 border-b border-[#252535]">
          Instances ({instances.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[#606070] border-b border-[#252535]">
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Instance</th>
                <th className="text-left px-4 py-2">Version</th>
                <th className="text-left px-4 py-2">Platform</th>
                <th className="text-right px-4 py-2">Integrations</th>
                <th className="text-right px-4 py-2">Uptime</th>
                <th className="text-right px-4 py-2">Heartbeats</th>
                <th className="text-left px-4 py-2">First Seen</th>
                <th className="text-left px-4 py-2">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((inst) => (
                <tr
                  key={inst.instanceId}
                  className="border-b border-[#1E1E2E] hover:bg-[#1E1E2E30]"
                >
                  <td className="px-4 py-2">
                    <div
                      className={`w-2 h-2 rounded-full ${inst.isActive ? 'bg-[#10B981]' : 'bg-[#606070]'}`}
                    />
                  </td>
                  <td className="px-4 py-2 text-[#E2E2E8] font-mono">{inst.instanceId}</td>
                  <td className="px-4 py-2 text-[#9090A0]">{inst.version}</td>
                  <td className="px-4 py-2 text-[#9090A0]">{inst.platform}</td>
                  <td className="px-4 py-2 text-right text-[#9090A0]">{inst.configuredCount}</td>
                  <td className="px-4 py-2 text-right text-[#9090A0]">
                    {inst.lastUptimeFormatted}
                  </td>
                  <td className="px-4 py-2 text-right text-[#9090A0]">{inst.heartbeats}</td>
                  <td className="px-4 py-2 text-[#606070]">{formatDate(inst.firstSeen)}</td>
                  <td className="px-4 py-2 text-[#606070]">{formatDate(inst.lastSeen)}</td>
                </tr>
              ))}
              {instances.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#606070]">
                    No heartbeats received yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div className="border border-[#252535] rounded-lg p-4">
      <p className={`text-2xl font-bold ${accent ? 'text-[#10B981]' : 'text-[#E2E2E8]'}`}>
        {value}
      </p>
      <p className="text-xs text-[#606070] mt-1">{label}</p>
    </div>
  )
}

function DistributionCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)

  return (
    <div className="border border-[#252535] rounded-lg p-4">
      <h2 className="text-sm font-medium text-[#E2E2E8] mb-3">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-xs text-[#606070]">No data</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, count]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-[#9090A0] w-20 truncate">{key}</span>
              <div className="flex-1 h-2 bg-[#1E1E2E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0EA5E9] rounded-full"
                  style={{ width: `${(count / total) * 100}%` }}
                />
              </div>
              <span className="text-xs text-[#606070] w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
