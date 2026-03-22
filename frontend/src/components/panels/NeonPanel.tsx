import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { ExternalLink } from '../ui/ExternalLink'
import { formatDuration } from '../../lib/format'

interface NeonPanelData {
  projectCount: number
  projects: Array<{
    name: string
    region: string
    pgVersion: number
    updatedAt: string
    branchCount: number
    primaryBranch: string | null
    endpointCount: number
    endpointStatus: string | null
    activeTimeSec: number
    computeTimeSec: number
    storageMB: number
  }>
  totalBranches: number
  totalEndpoints: number
  allEndpointsActive: boolean
  primaryEndpointStatus: string | null
  storageUsedPct: number | null
}

export function NeonPanel({ data }: { data: NeonPanelData }) {
  const epStatus = data.primaryEndpointStatus ?? 'unknown'
  const isActive = epStatus === 'active' || epStatus === 'idle'
  const hasError = data.projects.some(
    (p) => p.endpointStatus === 'error' || p.endpointStatus === 'failed',
  )
  const storageHigh = data.storageUsedPct !== null && data.storageUsedPct > 80

  // Aggregate compute hours across projects
  const totalComputeSec = data.projects.reduce((sum, p) => sum + p.computeTimeSec, 0)
  const totalStorageMB = data.projects.reduce((sum, p) => sum + p.storageMB, 0)

  return (
    <div className="space-y-3">
      {/* Hero: DB status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasError ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-sm font-semibold text-[#EF4444]">Endpoint Error</span>
            </>
          ) : isActive ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-sm font-semibold text-[#E2E2E8]">Active</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="text-sm font-semibold text-[#E2E2E8]">{epStatus}</span>
            </>
          )}
        </div>
        <ExternalLink href="https://console.neon.tech" className="text-[10px] text-[#606070]">
          {data.projectCount} project{data.projectCount !== 1 ? 's' : ''}
        </ExternalLink>
      </div>

      {/* Alert row */}
      {(hasError || storageHigh) && (
        <div className="flex flex-wrap gap-1.5">
          {hasError && (
            <span className="text-[10px] px-2 py-0.5 bg-[#EF444420] text-[#EF4444] rounded font-semibold">
              Endpoint in error state
            </span>
          )}
          {storageHigh && (
            <span className="text-[10px] px-2 py-0.5 bg-[#F59E0B20] text-[#F59E0B] rounded font-semibold">
              Storage &gt;80% ({data.storageUsedPct}%)
            </span>
          )}
        </div>
      )}

      {/* Supporting metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Metric
          label="Storage"
          value={totalStorageMB < 1 ? '< 1 MB' : `${Math.round(totalStorageMB)} MB`}
        />
        <Metric label="Compute" value={formatDuration(totalComputeSec)} />
        <Metric
          label="Endpoints"
          value={data.totalEndpoints}
          subValue={data.allEndpointsActive ? 'all active' : 'some inactive'}
          trend={data.allEndpointsActive ? 'up' : 'down'}
        />
      </div>

      {/* Storage bar if pct known */}
      {data.storageUsedPct !== null && (
        <ProgressBar
          value={Math.min(data.storageUsedPct, 100)}
          color={data.storageUsedPct > 80 ? 'red' : data.storageUsedPct > 60 ? 'yellow' : 'green'}
          label="Storage usage (est.)"
          size="sm"
        />
      )}

      {/* Project list (de-emphasized) */}
      {data.projects.length > 1 && (
        <div>
          <span className="text-xs text-[#606070] font-medium">Projects</span>
          <div className="mt-1.5 space-y-1">
            {data.projects.slice(0, 5).map((proj) => (
              <div key={proj.name} className="flex items-center justify-between text-xs">
                <ExternalLink href="https://console.neon.tech" className="text-[#9090A0] truncate">
                  {proj.name}
                </ExternalLink>
                <div className="flex items-center gap-2 shrink-0 ml-2 text-[#606070]">
                  <span>{proj.endpointCount} ep</span>
                  {proj.storageMB > 0 && (
                    <span>{proj.storageMB < 1 ? '< 1' : Math.round(proj.storageMB)} MB</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
