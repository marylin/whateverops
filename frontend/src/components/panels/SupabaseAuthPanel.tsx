import { useState } from 'react'
import { MiniBar } from '../ui/MiniBar'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber } from '../../lib/format'

interface ProjectAuth {
  name: string
  ref: string
  projectStatus: 'active' | 'inactive'
  totalUsers: number
  recentSignups: number
  activeRecently: number
  signupsTrend: 'up' | 'down' | 'flat'
  dauPct: number
  providerBreakdown: Record<string, number>
  daysSinceLastSignup: number | null
}

interface SupabaseAuthPanelData {
  projects: ProjectAuth[]
  summary: {
    totalUsersAllProjects: number
    totalActiveRecently: number
    activeProjectCount: number
  }
}

const PROVIDER_COLORS: Record<string, string> = {
  email: '#3B82F6',
  google: '#34A853',
  github: '#9CA3AF',
  apple: '#A2AAAD',
  twitter: '#1DA1F2',
  discord: '#5865F2',
  facebook: '#1877F2',
}

function ProjectAuthRow({ project }: { project: ProjectAuth }) {
  const [showProviders, setShowProviders] = useState(false)

  if (project.projectStatus === 'inactive') {
    return (
      <div className="flex items-center justify-between py-2 px-3 border border-[#252535] rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#606070] shrink-0" />
          <span className="text-sm text-[#9090A0]">{project.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B15] text-[#F59E0B]">
            Paused
          </span>
        </div>
      </div>
    )
  }

  const providers = Object.entries(project.providerBreakdown)
  const providerSegments = providers.map(([name, count]) => ({
    value: count,
    color: PROVIDER_COLORS[name.toLowerCase()] ?? '#6B7280',
    label: name,
  }))

  const trendColor =
    project.signupsTrend === 'up'
      ? 'bg-[#10B98120] text-[#10B981]'
      : project.signupsTrend === 'down'
        ? 'bg-[#EF444420] text-[#EF4444]'
        : 'bg-[#1E1E2E] text-[#9090A0]'

  return (
    <div className="border border-[#252535] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
          <span className="text-sm font-medium text-[#E2E2E8] truncate">{project.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-[#E2E2E8]">
            {smartNumber(project.totalUsers)}
          </span>
          {project.recentSignups > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${trendColor}`}>
              +{project.recentSignups}
            </span>
          )}
        </div>
      </div>

      {/* Expandable details */}
      <div className="px-3 pb-2 space-y-2">
        <div className="flex items-center gap-4 text-[10px] text-[#606070]">
          <span>Active (24h): {project.activeRecently}</span>
          <span>DAU: {project.dauPct}%</span>
          {project.daysSinceLastSignup !== null && project.daysSinceLastSignup > 3 && (
            <span className="text-[#F59E0B]">No signups in {project.daysSinceLastSignup}d</span>
          )}
        </div>

        {providerSegments.length > 0 && providerSegments.some((s) => s.value > 0) && (
          <div>
            <button
              onClick={() => setShowProviders(!showProviders)}
              className="flex items-center gap-1.5 text-[10px] text-[#606070] hover:text-[#9090A0] transition-colors"
            >
              <span className={`transition-transform ${showProviders ? 'rotate-90' : ''}`}>
                &#9658;
              </span>
              Providers ({providers.length})
            </button>
            {showProviders && (
              <div className="mt-1.5">
                <MiniBar segments={providerSegments} height={8} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function SupabaseAuthPanel({ data }: { data: SupabaseAuthPanelData }) {
  if (!data) return null

  const projects = data.projects ?? []
  const activeProjects = projects.filter((p) => p.projectStatus === 'active')
  const pausedProjects = projects.filter((p) => p.projectStatus === 'inactive')
  const sorted = [...activeProjects, ...pausedProjects]

  if (sorted.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
            View in Supabase
          </ExternalLink>
        </div>
        <p className="text-xs text-[#606070]">No projects found</p>
      </div>
    )
  }

  const summary = data.summary

  const allActive = pausedProjects.length === 0
  const hasUsers = summary.totalUsersAllProjects > 0
  const statusLabel = !allActive ? 'Degraded' : hasUsers ? 'Operational' : 'No Users'
  const statusColor = !allActive ? 'bg-[#F59E0B]' : hasUsers ? 'bg-[#10B981]' : 'bg-[#606070]'
  const statusTextColor = !allActive
    ? 'text-[#F59E0B]'
    : hasUsers
      ? 'text-[#10B981]'
      : 'text-[#606070]'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <span className={`text-sm font-bold ${statusTextColor}`}>{statusLabel}</span>
        </div>
        <ExternalLink href="https://supabase.com/dashboard" className="text-xs text-[#606070]">
          View in Supabase
        </ExternalLink>
      </div>

      {/* Summary row — hidden if only 1 active project */}
      {activeProjects.length > 1 && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-[#E2E2E8]">
              {smartNumber(summary.totalUsersAllProjects)}
            </p>
            <p className="text-xs text-[#606070]">
              Total users across {summary.activeProjectCount} projects
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#E2E2E8]">{summary.totalActiveRecently}</p>
            <p className="text-xs text-[#606070]">Active (24h)</p>
          </div>
        </div>
      )}

      {/* Per-project rows */}
      <div className="space-y-1.5">
        {sorted.map((project) => (
          <ProjectAuthRow key={project.ref} project={project} />
        ))}
      </div>

      <div className="text-[10px] text-[#606070]">
        {projects.length} project{projects.length !== 1 ? 's' : ''} · {activeProjects.length} active
      </div>
    </div>
  )
}
