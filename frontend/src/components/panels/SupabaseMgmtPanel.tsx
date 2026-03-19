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
      {/* Hero: project healthy badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${allHealthy ? 'bg-[#00D46A]' : 'bg-[#FF4545]'}`} />
          <ExternalLink
            href={`https://supabase.com/dashboard/project/${project.id}`}
            className="text-sm font-semibold text-white"
          >
            {project.projectName}
          </ExternalLink>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              allHealthy ? 'bg-[#00D46A20] text-[#00D46A]' : 'bg-[#FF454520] text-[#FF4545]'
            }`}
          >
            {allHealthy ? 'Healthy' : 'Unhealthy'}
          </span>
        </div>
      </div>

      {/* Alert row: read-only is critical */}
      {project.readOnly && (
        <div className="flex items-center gap-2 text-xs bg-[#FF454510] border border-[#FF454515] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#FF4545] shrink-0 animate-pulse" />
          <span className="text-[#FF6B6B] font-medium">
            DATABASE IN READ-ONLY MODE — immediate action needed
          </span>
        </div>
      )}
      {hasAdvisors && (
        <div className="flex items-center gap-2 text-xs bg-[#FFB80010] border border-[#FFB80015] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#FFB800] shrink-0" />
          <span className="text-[#FFB800]">
            {project.advisorCount} performance advisor
            {project.advisorCount !== 1 ? 's' : ''} — review recommended
          </span>
        </div>
      )}

      {/* Supporting: Health checks X/Y passing | Advisor count */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Health Checks</p>
          <p className="text-lg font-semibold text-white">
            {project.healthyCount}/{project.totalChecks}
            <span className="text-xs text-gray-500 ml-1">passing</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Advisors</p>
          <p className={`text-lg font-semibold ${hasAdvisors ? 'text-[#FFB800]' : 'text-white'}`}>
            {project.advisorCount}
          </p>
        </div>
      </div>

      {/* Health check grid */}
      {project.healthChecks.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
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
      )}

      {/* De-emphasized: region, DB version, project status */}
      <div className="flex items-center gap-3 text-[10px] text-gray-600 pt-1 border-t border-[#1E1E2E]">
        <StatusBadge status={project.projectStatus} />
        <span>{project.region}</span>
        <span>PG {project.dbVersion}</span>
      </div>

      {/* Advisor details */}
      {hasAdvisors && (
        <div className="space-y-1">
          {project.advisors.slice(0, 3).map((advisor, i) => (
            <div key={i} className="text-xs">
              <span className="text-[10px] px-1.5 py-0.5 bg-[#FFB80015] text-[#FFB800] rounded mr-1.5">
                {advisor.type}
              </span>
              <span className="text-gray-400">{advisor.reason}</span>
            </div>
          ))}
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
