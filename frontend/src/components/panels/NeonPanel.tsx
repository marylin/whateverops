import { Metric } from '../ui/Metric'
import { ExternalLink } from '../ui/ExternalLink'

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
}

export function NeonPanel({ data }: { data: NeonPanelData }) {
  return (
    <div className="space-y-4">
      {/* Hero: endpoint status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.allEndpointsActive ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#00D46A]" />
              <span className="text-sm font-semibold text-white">All endpoints active</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />
              <span className="text-sm font-semibold text-white">Some endpoints inactive</span>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {data.projectCount} project{data.projectCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Branches" value={data.totalBranches} />
        <Metric label="Endpoints" value={data.totalEndpoints} />
        <Metric label="Projects" value={data.projectCount} />
      </div>

      {/* Project list */}
      {data.projects.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Projects</span>
          <div className="mt-1.5 space-y-1.5">
            {data.projects.slice(0, 5).map((proj) => (
              <div key={proj.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <ExternalLink href="https://console.neon.tech" className="text-gray-300 truncate">
                    {proj.name}
                  </ExternalLink>
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#1E1E2E] text-gray-500 rounded shrink-0">
                    {proj.region}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {proj.storageMB > 0 && (
                    <span className="text-gray-600">
                      {proj.storageMB < 1 ? '< 1' : Math.round(proj.storageMB)} MB
                    </span>
                  )}
                  <span className="text-gray-600">PG {proj.pgVersion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
