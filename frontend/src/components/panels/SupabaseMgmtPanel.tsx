import { useState } from 'react'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'

interface AdvisorItem {
  name: string
  description: string
}

interface EdgeFunctionItem {
  name: string
  status: string
}

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
  advisors: {
    performance: AdvisorItem[]
    security: AdvisorItem[]
    totalCount: number
  }
  edgeFunctions: {
    total: number
    active: number
    items: EdgeFunctionItem[]
  }
}

interface SupabaseMgmtPanelData {
  projectCount: number
  projects: SupabaseProjectPanelData[]
}

function AdvisorSection({ title, items }: { title: string; items: AdvisorItem[] }) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return null

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>&#9658;</span>
        {title} ({items.length})
      </button>
      {expanded && (
        <ul className="mt-1 space-y-1 ml-3">
          {items.map((a, i) => (
            <li key={i} className="text-[10px] text-[#9090A0]">
              <span className="text-[#E2E2E8]">{a.name}</span>
              {a.description && <span> — {a.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
    <div className="border border-[#252535] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[#2A2A3E30] transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isInactive ? 'bg-[#606070]' : allHealthy ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}
          />
          <span className="text-sm font-medium text-[#E2E2E8] truncate">{project.projectName}</span>
          {isInactive && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1E1E2E] text-[#606070]">
              paused
            </span>
          )}
          {project.advisors.totalCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B15] text-[#F59E0B]">
              {project.advisors.totalCount} advisor{project.advisors.totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!isInactive && (
            <span className="text-xs text-[#606070]">
              {project.healthyCount}/{project.totalChecks}
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-[#606070] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && !isInactive && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#252535]">
          {project.readOnly && (
            <div className="flex items-center gap-2 text-xs bg-[#EF444410] border border-[#EF444415] rounded px-2.5 py-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0 animate-pulse" />
              <span className="text-[#F87171] font-medium">
                READ-ONLY MODE — immediate action needed
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
                        ? 'bg-[#10B981]'
                        : 'bg-[#EF4444]'
                    }`}
                  />
                  <span className="text-[#9090A0]">{check.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Edge Functions */}
          {project.edgeFunctions.total > 0 && (
            <div className="flex items-center gap-2 text-xs mt-1">
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  project.edgeFunctions.active === project.edgeFunctions.total
                    ? 'bg-[#10B981]'
                    : 'bg-[#EF4444]'
                }`}
              />
              <span className="text-[#9090A0]">
                {project.edgeFunctions.total} edge function
                {project.edgeFunctions.total !== 1 ? 's' : ''}
                {project.edgeFunctions.active < project.edgeFunctions.total &&
                  ` (${project.edgeFunctions.active} active)`}
              </span>
            </div>
          )}

          {/* Advisors */}
          {project.advisors.totalCount > 0 && (
            <div className="space-y-1 mt-1">
              <AdvisorSection title="Performance" items={project.advisors.performance} />
              <AdvisorSection title="Security" items={project.advisors.security} />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-[#606070] pt-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.projectStatus} />
              <span>{project.region}</span>
              <span>PG {project.dbVersion}</span>
            </div>
            <ExternalLink
              href={`https://supabase.com/dashboard/project/${project.id}`}
              className="text-[#606070] hover:text-[#9090A0]"
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
  if (!data) return null
  const projects = data.projects ?? []
  const activeProjects = projects.filter((p) => p.projectStatus !== 'INACTIVE')
  const allHealthy = activeProjects.every(
    (p) => p.healthyCount === p.totalChecks && p.totalChecks > 0,
  )
  const totalHealthy = activeProjects.reduce((s, p) => s + p.healthyCount, 0)
  const totalChecks = activeProjects.reduce((s, p) => s + p.totalChecks, 0)
  const hasReadOnly = projects.some((p) => p.readOnly)

  const defaultExpanded = projects.findIndex(
    (p) =>
      p.readOnly ||
      p.advisors.totalCount > 0 ||
      (p.healthyCount < p.totalChecks && p.totalChecks > 0),
  )
  const [expandedIndex, setExpandedIndex] = useState(defaultExpanded >= 0 ? defaultExpanded : 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${hasReadOnly ? 'bg-[#EF4444] animate-pulse' : allHealthy ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}
          />
          <span className="text-lg font-bold text-[#E2E2E8]">
            {hasReadOnly ? 'Action Required' : allHealthy ? 'All Healthy' : 'Issues Detected'}
          </span>
        </div>
        <span className="text-xs text-[#606070]">
          {totalHealthy}/{totalChecks} checks passing
        </span>
      </div>

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

      <div className="text-[10px] text-[#606070]">
        {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
      </div>
    </div>
  )
}
