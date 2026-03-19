import { useState } from 'react'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'

interface SupabaseProjectPanelData {
  id: string
  projectName: string
  projectStatus: string
  region: string
  dbVersion: string
  healthChecks: Array<{
    name: string
    status: string
  }>
  healthyCount: number
  totalChecks: number
  readOnly: boolean
  advisorCount: number
  advisors: Array<{ reason: string; type: string }>
}

interface SupabaseMgmtPanelData {
  projectCount: number
  projects: SupabaseProjectPanelData[]
  projectName: string
  projectStatus: string
  region: string
  dbVersion: string
  healthChecks: Array<{
    name: string
    status: string
  }>
  healthyCount: number
  totalChecks: number
  readOnly: boolean
  advisorCount: number
  advisors: Array<{ reason: string; type: string }>
  apiRequestCount: number | null
}

function ProjectSection({ project }: { project: SupabaseProjectPanelData }) {
  const allHealthy = project.healthyCount === project.totalChecks && project.totalChecks > 0
  const hasAdvisors = project.advisorCount > 0

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <ExternalLink
            href={`https://supabase.com/dashboard/project/${project.id}`}
            className="text-sm font-semibold text-white"
          >
            {project.projectName}
          </ExternalLink>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={project.projectStatus} />
            <span className="text-xs text-gray-500">{project.region}</span>
            <span className="text-xs text-gray-600">PG {project.dbVersion}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${allHealthy ? 'bg-[#00D46A]' : 'bg-[#FFB800]'}`}
            />
            <span className="text-xs text-gray-400">
              {project.healthyCount}/{project.totalChecks} checks pass
            </span>
          </div>
        </div>
      </div>

      {/* Health checks */}
      {project.healthChecks.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Health Checks</span>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            {project.healthChecks.map((check) => (
              <div key={check.name} className="flex items-center gap-1.5 text-xs">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    check.status === 'ok' || check.status === 'ACTIVE_HEALTHY'
                      ? 'bg-[#00D46A]'
                      : 'bg-[#FF4545]'
                  }`}
                />
                <span className="text-gray-400 truncate">{check.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advisors */}
      {hasAdvisors && (
        <div>
          <span className="text-xs text-gray-500 font-medium">
            Performance Advisors ({project.advisorCount})
          </span>
          <div className="mt-1.5 space-y-1">
            {project.advisors.slice(0, 3).map((advisor, i) => (
              <div key={i} className="text-xs">
                <span className="text-[10px] px-1.5 py-0.5 bg-[#FFB80015] text-[#FFB800] rounded mr-1.5">
                  {advisor.type}
                </span>
                <span className="text-gray-400">{advisor.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {project.readOnly && (
        <div className="flex items-center gap-1.5 text-xs bg-[#FFB80010] border border-[#FFB80015] rounded-lg px-3 py-2">
          <span className="text-[#FFB800]">Database is in read-only mode</span>
        </div>
      )}
    </div>
  )
}

export function SupabaseMgmtPanel({ data }: { data: SupabaseMgmtPanelData }) {
  const projects = data.projects ?? []
  const hasMultiple = projects.length > 1
  const [activeTab, setActiveTab] = useState(0)

  // Single project: show directly
  if (!hasMultiple) {
    const singleProject = projects[0] ?? {
      id: '',
      projectName: data.projectName,
      projectStatus: data.projectStatus,
      region: data.region,
      dbVersion: data.dbVersion,
      healthChecks: data.healthChecks,
      healthyCount: data.healthyCount,
      totalChecks: data.totalChecks,
      readOnly: data.readOnly,
      advisorCount: data.advisorCount,
      advisors: data.advisors,
    }
    return (
      <div className="space-y-4">
        <ProjectSection project={singleProject} />
      </div>
    )
  }

  // Multiple projects: tabbed view
  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto">
        {projects.map((proj, i) => (
          <button
            key={proj.id}
            onClick={() => setActiveTab(i)}
            className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              i === activeTab
                ? 'bg-[#7C3AED20] text-[#A78BFA] font-medium'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#1E1E2E]'
            }`}
          >
            {proj.projectName}
          </button>
        ))}
      </div>

      {/* Active project */}
      {projects[activeTab] && <ProjectSection project={projects[activeTab]} />}

      {/* Summary footer */}
      <div className="text-[10px] text-gray-600 pt-1 border-t border-[#1E1E2E]">
        {projects.length} database{projects.length !== 1 ? 's' : ''} connected
      </div>
    </div>
  )
}
