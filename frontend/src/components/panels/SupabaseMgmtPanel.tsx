import { useState } from 'react'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'

interface SupabaseProjectPanelData {
  id: string
  projectName: string
  projectStatus: string
  region: string
  dbVersion: string
  healthChecks: Array<{ name: string; status: string }>
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
  healthChecks: Array<{ name: string; status: string }>
  healthyCount: number
  totalChecks: number
  readOnly: boolean
  advisorCount: number
  advisors: Array<{ reason: string; type: string }>
  apiRequestCount: number | null
}

function ProjectRow({
  project,
  isExpanded,
  onToggle,
}: {
  project: SupabaseProjectPanelData
  isExpanded: boolean
  onToggle: () => void
}) {
  const allHealthy = project.healthyCount === project.totalChecks && project.totalChecks > 0
  const isInactive = project.projectStatus === 'INACTIVE'

  return (
    <div className="border border-[#2A2A3E] rounded-lg overflow-hidden">
      {/* Clickable row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#2A2A3E30] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isInactive ? 'bg-gray-600' : allHealthy ? 'bg-[#00D46A]' : 'bg-[#FF4545]'
            }`}
          />
          <span className="text-sm font-medium text-white truncate">{project.projectName}</span>
          {isInactive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">
              paused
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isInactive && (
            <span className="text-xs text-gray-500">
              {project.healthyCount}/{project.totalChecks}
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && !isInactive && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#2A2A3E]">
          {/* Alert row */}
          {project.readOnly && (
            <div className="flex items-center gap-2 text-xs bg-[#FF454510] border border-[#FF454515] rounded px-2.5 py-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#FF4545] shrink-0 animate-pulse" />
              <span className="text-[#FF6B6B] font-medium">
                READ-ONLY MODE — immediate action needed
              </span>
            </div>
          )}
          {project.advisorCount > 0 && (
            <div className="flex items-center gap-2 text-xs bg-[#FFB80010] border border-[#FFB80015] rounded px-2.5 py-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#FFB800] shrink-0" />
              <span className="text-[#FFB800]">
                {project.advisorCount} performance recommendation
                {project.advisorCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Health check dots */}
          {project.healthChecks.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              {project.healthChecks.map((check) => (
                <div key={check.name} className="flex items-center gap-1.5 text-xs">
                  <div
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      check.status === 'ok' || check.status === 'ACTIVE_HEALTHY'
                        ? 'bg-[#00D46A]'
                        : 'bg-[#FF4545]'
                    }`}
                  />
                  <span className="text-gray-400">{check.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer: region, version, link */}
          <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.projectStatus} />
              <span>{project.region}</span>
              <span>PG {project.dbVersion}</span>
            </div>
            <ExternalLink
              href={`https://supabase.com/dashboard/project/${project.id}`}
              className="text-gray-600 hover:text-gray-400"
            >
              Dashboard
            </ExternalLink>
          </div>
        </div>
      )}
    </div>
  )
}

export function SupabaseMgmtPanel({ data }: { data: SupabaseMgmtPanelData }) {
  const projects = data.projects ?? []
  const activeProjects = projects.filter((p) => p.projectStatus !== 'INACTIVE')
  const allHealthy = activeProjects.every(
    (p) => p.healthyCount === p.totalChecks && p.totalChecks > 0,
  )
  const totalHealthy = activeProjects.reduce((s, p) => s + p.healthyCount, 0)
  const totalChecks = activeProjects.reduce((s, p) => s + p.totalChecks, 0)
  const hasReadOnly = projects.some((p) => p.readOnly)

  // Expand first project by default, or any unhealthy one
  const defaultExpanded = projects.findIndex(
    (p) =>
      p.readOnly || p.advisorCount > 0 || (p.healthyCount < p.totalChecks && p.totalChecks > 0),
  )
  const [expandedIndex, setExpandedIndex] = useState(defaultExpanded >= 0 ? defaultExpanded : 0)

  return (
    <div className="space-y-3">
      {/* Hero: aggregate health */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${hasReadOnly ? 'bg-[#FF4545] animate-pulse' : allHealthy ? 'bg-[#00D46A]' : 'bg-[#FF4545]'}`}
          />
          <span className="text-lg font-bold text-white">
            {hasReadOnly ? 'Action Required' : allHealthy ? 'All Healthy' : 'Issues Detected'}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {totalHealthy}/{totalChecks} checks passing
        </span>
      </div>

      {/* Project accordion list */}
      <div className="space-y-1.5">
        {projects.map((project, i) => (
          <ProjectRow
            key={project.id}
            project={project}
            isExpanded={expandedIndex === i}
            onToggle={() => setExpandedIndex(expandedIndex === i ? -1 : i)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-[10px] text-gray-600">
        {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
      </div>
    </div>
  )
}
