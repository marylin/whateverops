import { ProgressBar } from '../ui/ProgressBar'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'
import { timeAgo, formatDuration } from '../../lib/format'

interface VercelPanelData {
  projectCount: number
  recentDeploys: Array<{
    id: string
    project: string
    status: string
    created: string
    url: string | null
    commitMessage: string | null
    target: string | null
    buildDurationSec: number | null
    errorMessage: string | null
    checksStatus: string | null
    source: string | null
  }>
  lastDeployTime: string | null
  successRate: number
  domains: Array<{
    name: string
    project: string
    healthy: boolean
    sslReady: boolean
    misconfigured: boolean
  }>
  domainHealthy: boolean
}

export function VercelPanel({ data }: { data: VercelPanelData }) {
  return (
    <div className="space-y-4">
      {/* Hero: deploy success rate */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-white">{Math.round(data.successRate)}%</p>
          <p className="text-xs text-gray-500">Deploy success rate</p>
        </div>
        <div className="text-right">
          <ExternalLink href="https://vercel.com/dashboard" className="text-sm text-white">
            {data.projectCount} project{data.projectCount !== 1 ? 's' : ''}
          </ExternalLink>
          {data.lastDeployTime && (
            <p className="text-xs text-gray-500">Last deploy {timeAgo(data.lastDeployTime)}</p>
          )}
        </div>
      </div>

      <ProgressBar
        value={data.successRate}
        color={data.successRate >= 90 ? 'green' : data.successRate >= 70 ? 'yellow' : 'red'}
        showValue={false}
      />

      {/* Recent deploys */}
      {data.recentDeploys.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Recent Deploys</span>
          <div className="mt-1.5 space-y-1.5">
            {data.recentDeploys.slice(0, 4).map((deploy) => (
              <div key={deploy.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <StatusBadge status={deploy.status} />
                  <span className="text-gray-400 truncate">
                    {deploy.url ? (
                      <ExternalLink href={`https://${deploy.url}`} className="text-gray-400">
                        {deploy.project}
                      </ExternalLink>
                    ) : (
                      deploy.project
                    )}
                    {deploy.commitMessage && (
                      <span className="text-gray-600">
                        {' '}
                        — {deploy.commitMessage.split('\n')[0]?.slice(0, 30)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {deploy.buildDurationSec !== null && (
                    <span className="text-gray-600">{formatDuration(deploy.buildDurationSec)}</span>
                  )}
                  <span className="text-gray-600">{timeAgo(deploy.created)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domains */}
      {data.domains.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Domains</span>
          <div className="mt-1.5 space-y-1">
            {data.domains.slice(0, 4).map((domain) => (
              <div key={domain.name} className="flex items-center justify-between text-xs">
                <ExternalLink href={`https://${domain.name}`} className="text-gray-400">
                  {domain.name}
                </ExternalLink>
                <div className="flex items-center gap-1.5">
                  {domain.healthy ? (
                    <span className="text-[#00D46A]">✓</span>
                  ) : (
                    <span className="text-[#FF4545]">✗</span>
                  )}
                  {domain.sslReady ? (
                    <span className="text-[10px] text-gray-600">SSL</span>
                  ) : (
                    <span className="text-[10px] text-[#FFB800]">No SSL</span>
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
