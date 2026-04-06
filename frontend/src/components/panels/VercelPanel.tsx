import { useState } from 'react'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'
import { timeAgo, formatDuration } from '../../lib/format'

interface LatestDeploy {
  status: string
  created: string
  commitMessage: string | null
  buildDurationSec: number | null
  errorMessage: string | null
}

interface ProjectSummary {
  id: string
  name: string
  framework: string | null
  url: string | null
  latestDeploy: LatestDeploy | null
}

interface VercelPanelData {
  projectCount: number
  projects: ProjectSummary[]
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
  lastProductionDeploy: {
    id: string
    project: string
    status: string
    created: string
    url: string | null
    commitMessage: string | null
    buildDurationSec: number | null
    errorMessage: string | null
  } | null
  timeSinceLastDeploy: string | null
}

function deployStatusBadgeClass(status: string): string {
  const s = status.toUpperCase()
  if (s === 'READY') return 'bg-[#10B98120] text-[#10B981]'
  if (s === 'ERROR') return 'bg-[#EF444420] text-[#EF4444]'
  if (s === 'BUILDING' || s === 'INITIALIZING') return 'bg-[#F59E0B20] text-[#F59E0B]'
  return 'bg-[#1E1E2E] text-[#9090A0]'
}

function statusDot(status: string): string {
  const s = status.toUpperCase()
  if (s === 'READY') return 'bg-[#10B981]'
  if (s === 'ERROR') return 'bg-[#EF4444]'
  if (s === 'BUILDING' || s === 'INITIALIZING') return 'bg-[#F59E0B]'
  return 'bg-[#606070]'
}

export function VercelPanel({ data }: { data: VercelPanelData }) {
  if (!data) return null
  const [activityExpanded, setActivityExpanded] = useState(false)

  const prodDeploy = data.lastProductionDeploy
  const hasMisconfiguredDomain = (data.domains ?? []).some((d) => d.misconfigured)

  // Projects with a failed latest deploy
  const failedProjects = (data.projects ?? []).filter((p) => p.latestDeploy?.status === 'ERROR')
  const hasAlerts = failedProjects.length > 0 || hasMisconfiguredDomain

  return (
    <div className="space-y-4">
      {/* Hero: last production deploy status */}
      <div className="flex items-start justify-between">
        <div>
          {prodDeploy ? (
            <>
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xl font-bold ${deployStatusBadgeClass(prodDeploy.status)}`}
              >
                {prodDeploy.status}
              </div>
              <p className="text-xs text-[#606070] mt-1">
                Production &middot; {timeAgo(prodDeploy.created)}
              </p>
            </>
          ) : (data.recentDeploys ?? []).length > 0 ? (
            <>
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xl font-bold ${deployStatusBadgeClass(data.recentDeploys[0]?.status ?? 'UNKNOWN')}`}
              >
                {data.recentDeploys[0]?.status ?? 'UNKNOWN'}
              </div>
              <p className="text-xs text-[#606070] mt-1">
                Latest deploy &middot; {timeAgo(data.recentDeploys[0]?.created ?? '')}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#606070]">No deploys</p>
          )}
        </div>
        <div className="text-right">
          {data.timeSinceLastDeploy && (
            <p className="text-xs text-[#606070]">{data.timeSinceLastDeploy}</p>
          )}
        </div>
      </div>

      {/* Alert row */}
      {hasAlerts && (
        <div className="space-y-1">
          {failedProjects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#EF444415] border border-[#EF444430]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />
              <span className="text-xs text-[#EF4444] truncate">
                {p.name} deploy failed
                {p.latestDeploy?.errorMessage ? `: ${p.latestDeploy.errorMessage}` : ''}
              </span>
            </div>
          ))}
          {hasMisconfiguredDomain && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-[#F59E0B15] border border-[#F59E0B30]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0" />
              <span className="text-xs text-[#F59E0B]">
                {(data.domains ?? []).filter((d) => d.misconfigured).length} domain
                {(data.domains ?? []).filter((d) => d.misconfigured).length !== 1 ? 's' : ''}{' '}
                misconfigured
              </span>
            </div>
          )}
        </div>
      )}

      {/* Supporting: commit message, build time, project name for hero deploy */}
      {prodDeploy && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#9090A0] truncate max-w-[60%]">
            {prodDeploy.commitMessage
              ? prodDeploy.commitMessage.split('\n')[0]?.slice(0, 50)
              : prodDeploy.project}
          </span>
          <div className="flex items-center gap-3 shrink-0 text-[#606070]">
            {prodDeploy.buildDurationSec !== null && (
              <span>{formatDuration(prodDeploy.buildDurationSec)}</span>
            )}
            <span>{prodDeploy.project}</span>
          </div>
        </div>
      )}

      {/* Project list: each project with latest deploy status */}
      {data.projects && data.projects.length > 0 && (
        <div>
          <span className="text-xs text-[#606070] font-medium">Projects</span>
          <div className="mt-1.5 space-y-1.5">
            {data.projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {project.latestDeploy ? (
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(project.latestDeploy.status)}`}
                    />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#252535]" />
                  )}
                  <span className="text-[#E2E2E8] truncate">
                    {project.url ? (
                      <ExternalLink href={project.url} className="text-[#E2E2E8]">
                        {project.name}
                      </ExternalLink>
                    ) : (
                      project.name
                    )}
                  </span>
                  {project.framework && (
                    <span className="text-[#606070] shrink-0">{project.framework}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {project.latestDeploy ? (
                    <>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${deployStatusBadgeClass(project.latestDeploy.status)}`}
                      >
                        {project.latestDeploy.status}
                      </span>
                      <span className="text-[#606070]">
                        {timeAgo(project.latestDeploy.created)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#606070]">no deploys</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent deploys activity feed — collapsed by default */}
      {(data.recentDeploys ?? []).length > 0 && (
        <div>
          <button
            onClick={() => setActivityExpanded(!activityExpanded)}
            className="text-[10px] text-[#606070] hover:text-[#9090A0] flex items-center gap-1"
          >
            <span>{activityExpanded ? '▼' : '►'}</span>
            {activityExpanded
              ? 'Show less'
              : `Recent Activity (${(data.recentDeploys ?? []).length})`}
          </button>
          {activityExpanded && (
            <div className="mt-1.5 space-y-1.5">
              {(data.recentDeploys ?? []).slice(0, 5).map((deploy) => (
                <div key={deploy.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusBadge status={deploy.status} />
                    <span className="text-[#9090A0] truncate">
                      {deploy.url ? (
                        <ExternalLink href={deploy.url} className="text-[#9090A0]">
                          {deploy.project}
                        </ExternalLink>
                      ) : (
                        deploy.project
                      )}
                      {deploy.commitMessage && (
                        <span className="text-[#606070]">
                          {' '}
                          &mdash; {deploy.commitMessage.split('\n')[0]?.slice(0, 30)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {deploy.target && (
                      <span className="text-[10px] text-[#606070]">{deploy.target}</span>
                    )}
                    {deploy.buildDurationSec !== null && (
                      <span className="text-[#606070]">
                        {formatDuration(deploy.buildDurationSec)}
                      </span>
                    )}
                    <span className="text-[#606070]">{timeAgo(deploy.created)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
