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
  }>
  allServicesHealthy: boolean
}

export function RailwayPanel({ data }: { data: RailwayPanelData }) {
  const unhealthyCount = data.services.filter((s) => !s.healthy).length

  return (
    <div className="space-y-4">
      {/* Hero: service health */}
      <div className="flex items-center justify-between">
        <div>
          {data.allServicesHealthy ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00D46A]" />
              <p className="text-sm font-semibold text-white">All services healthy</p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF4545]" />
              <p className="text-sm font-semibold text-white">
                {unhealthyCount} service{unhealthyCount !== 1 ? 's' : ''} need attention
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            <ExternalLink href="https://railway.app/dashboard" className="text-gray-500">
              {data.projectCount} project{data.projectCount !== 1 ? 's' : ''}
            </ExternalLink>
            {' · '}
            {data.serviceCount} service{data.serviceCount !== 1 ? 's' : ''}
          </p>
        </div>
        {data.lastDeployTime && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Last deploy</p>
            <p className="text-xs text-gray-400">{timeAgo(data.lastDeployTime)}</p>
          </div>
        )}
      </div>

      {/* Services */}
      {data.services.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Services</span>
          <div className="mt-1.5 space-y-1.5">
            {data.services.map((svc) => (
              <div
                key={`${svc.project}-${svc.name}`}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${svc.healthy ? 'bg-[#00D46A]' : 'bg-[#FF4545]'}`}
                  />
                  <span className="text-gray-300 truncate">{svc.name}</span>
                  <span className="text-gray-600 truncate">{svc.project}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {svc.restartCount > 0 && (
                    <span className="text-[10px] text-[#FFB800]">{svc.restartCount} restarts</span>
                  )}
                  {svc.latestDeployStatus && <StatusBadge status={svc.latestDeployStatus} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent deploys */}
      {data.recentDeploys.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Recent Deploys</span>
          <div className="mt-1.5 space-y-1">
            {data.recentDeploys.slice(0, 4).map((deploy) => (
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
