import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'
import { timeAgo } from '../../lib/format'

interface RailwayPanelData {
  projectCount: number
  serviceCount: number
  recentDeploys: Array<{
    id: string
    status: string
    createdAt: string
    serviceName: string
  }>
  lastDeployTime: string | null
  activeServices: number
  services: Array<{
    name: string
    project: string
    latestDeployStatus: string | null
    healthcheckPath: string | null
    replicas: number
    restartCount: number
    upSince: string | null
    healthy: boolean
    restartLooping: boolean
  }>
  allServicesHealthy: boolean
  unhealthyServiceCount: number
  longestUptime: string | null
  deployInProgress: boolean
}

export function RailwayPanel({ data }: { data: RailwayPanelData }) {
  const unhealthyCount = data.unhealthyServiceCount
  const restartLoopingCount = data.services.filter((s) => s.restartLooping).length

  const hasAlerts = unhealthyCount > 0 || restartLoopingCount > 0 || data.deployInProgress

  return (
    <div className="space-y-4">
      {/* Hero: health badge */}
      <div className="flex items-start justify-between">
        <div>
          {data.allServicesHealthy ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#10B98120]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-sm font-bold text-[#10B981]">All Services Healthy</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EF444420]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-sm font-bold text-[#EF4444]">
                {unhealthyCount} Service{unhealthyCount !== 1 ? 's' : ''} Down
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1.5">
            <ExternalLink href="https://railway.app/dashboard" className="text-gray-500">
              {data.serviceCount} service{data.serviceCount !== 1 ? 's' : ''}
            </ExternalLink>
          </p>
        </div>
        <div className="text-right">
          {data.lastDeployTime && (
            <>
              <p className="text-xs text-gray-500">Last deploy</p>
              <p className="text-xs text-gray-400">{timeAgo(data.lastDeployTime)}</p>
            </>
          )}
          {data.longestUptime && (
            <p className="text-[10px] text-gray-600 mt-1">Uptime: {data.longestUptime}</p>
          )}
        </div>
      </div>

      {/* Alert row */}
      {hasAlerts && (
        <div className="space-y-1">
          {unhealthyCount > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#EF444415] border border-[#EF444430]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
              <span className="text-xs text-[#EF4444]">
                {unhealthyCount} service{unhealthyCount !== 1 ? 's' : ''} unhealthy
              </span>
            </div>
          )}
          {restartLoopingCount > 0 && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#F59E0B15] border border-[#F59E0B30]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="text-xs text-[#F59E0B]">
                {restartLoopingCount} service{restartLoopingCount !== 1 ? 's' : ''} restart-looping
              </span>
            </div>
          )}
          {data.deployInProgress && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#F59E0B15] border border-[#F59E0B30]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="text-xs text-[#F59E0B]">Deploy in progress</span>
            </div>
          )}
        </div>
      )}

      {/* Services grouped by project */}
      {data.services.length > 0 &&
        (() => {
          // Build ordered map: projectName → services[]
          const projectMap = new Map<string, typeof data.services>()
          for (const svc of data.services) {
            const bucket = projectMap.get(svc.project) ?? []
            bucket.push(svc)
            projectMap.set(svc.project, bucket)
          }
          const projectEntries = Array.from(projectMap.entries())
          const showProjectHeaders = projectEntries.length > 1

          return (
            <div className="space-y-3">
              {projectEntries.map(([projectName, svcs]) => (
                <div key={projectName}>
                  {showProjectHeaders && (
                    <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide mb-1">
                      {projectName}
                    </p>
                  )}
                  {!showProjectHeaders && (
                    <span className="text-xs text-gray-500 font-medium">Services</span>
                  )}
                  <div className="mt-1 space-y-1.5">
                    {svcs.map((svc) => (
                      <div
                        key={`${svc.project}-${svc.name}`}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${svc.healthy ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
                          />
                          <span className="text-gray-300 truncate">{svc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {svc.restartLooping && (
                            <span className="text-[10px] text-[#F59E0B]">restart loop</span>
                          )}
                          {svc.restartCount > 0 && !svc.restartLooping && (
                            <span className="text-[10px] text-gray-600">
                              {svc.restartCount} restart{svc.restartCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {svc.upSince && (
                            <span className="text-[10px] text-gray-600">
                              up {timeAgo(svc.upSince)}
                            </span>
                          )}
                          {svc.latestDeployStatus && (
                            <StatusBadge status={svc.latestDeployStatus} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

      {/* Recent deploys (compact, max 3) */}
      {data.recentDeploys.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Recent Deploys</span>
          <div className="mt-1.5 space-y-1">
            {data.recentDeploys.slice(0, 3).map((deploy) => (
              <div key={deploy.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusBadge status={deploy.status} />
                  <span className="text-gray-400 truncate">{deploy.serviceName}</span>
                </div>
                <span className="text-gray-600 shrink-0 ml-2">{timeAgo(deploy.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
