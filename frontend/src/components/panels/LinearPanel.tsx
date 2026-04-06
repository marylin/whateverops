import { useState } from 'react'
import { ExternalLink } from '../ui/ExternalLink'
import { ProgressBar } from '../ui/ProgressBar'

interface LinearIssue {
  identifier: string
  title: string
  priority: number
  priorityLabel: string
  stateName: string
  labels: string[]
  projectName: string | null
  url: string
}

interface LinearProject {
  name: string
  state: string
  progress: number
}

interface LinearPanelData {
  teamName: string
  teamKey: string
  totalIssues: number
  openCount: number
  inProgressIssues: LinearIssue[]
  inProgressCount: number
  priorityBreakdown: Record<string, number>
  labelBreakdown: Record<string, number>
  projects: LinearProject[]
  bugsInProgress: number
  featuresInProgress: number
  cycleName: string | null
  cycleProgress: number | null
  daysLeftInCycle: number | null
  completedThisCycle: number
  cycleTotalIssues: number
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-[#EF4444]', // Urgent
  2: 'bg-[#F59E0B]', // High
  3: 'bg-[#0EA5E9]', // Medium
  4: 'bg-[#606070]', // Low
}

const PRIORITY_TEXT: Record<number, string> = {
  1: 'text-[#EF4444]',
  2: 'text-[#F59E0B]',
  3: 'text-[#38BDF8]',
  4: 'text-[#606070]',
}

export function LinearPanel({ data }: { data: LinearPanelData }) {
  if (!data) return null
  const [issuesExpanded, setIssuesExpanded] = useState(false)
  const [projectsExpanded, setProjectsExpanded] = useState(false)

  const issues = data.inProgressIssues ?? []
  const hasIssues = issues.length > 0

  // Collapsed: hero (index 0) + 2 more = 3 total visible; expanded: all
  const ISSUES_COLLAPSED_COUNT = 3
  const visibleIssues = issuesExpanded ? issues.slice(1) : issues.slice(1, ISSUES_COLLAPSED_COUNT)
  const hiddenIssueCount = issues.length - ISSUES_COLLAPSED_COUNT

  const PROJECTS_COLLAPSED_COUNT = 2
  const projects = data.projects ?? []
  const visibleProjects = projectsExpanded ? projects : projects.slice(0, PROJECTS_COLLAPSED_COUNT)
  const hiddenProjectCount = projects.length - PROJECTS_COLLAPSED_COUNT

  return (
    <div className="space-y-3">
      {/* Hero: what you're working on */}
      <div className="flex items-center justify-between">
        <div>
          {hasIssues ? (
            <>
              <p className="text-[10px] text-[#606070] uppercase tracking-wider">Working on</p>
              <ExternalLink href={issues[0]!.url} className="text-sm font-semibold text-[#E2E2E8]">
                {issues[0]!.identifier}: {issues[0]!.title}
              </ExternalLink>
            </>
          ) : (
            <p className="text-sm text-[#9090A0]">No issues in progress</p>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#E2E2E8] font-medium">
          {data.inProgressCount} in progress
        </span>
        <span className="text-xs text-[#606070]">·</span>
        <span className="text-xs text-[#9090A0]">{data.openCount} open</span>
        {data.bugsInProgress > 0 && (
          <>
            <span className="text-xs text-[#606070]">·</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EF444420] text-[#EF4444]">
              {data.bugsInProgress} bug{data.bugsInProgress !== 1 ? 's' : ''}
            </span>
          </>
        )}
        {data.featuresInProgress > 0 && (
          <>
            <span className="text-xs text-[#606070]">·</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38BDF820] text-[#38BDF8]">
              {data.featuresInProgress} feature{data.featuresInProgress !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* In-progress issue list */}
      {issues.length > 1 && (
        <div className="space-y-1">
          {visibleIssues.map((issue) => (
            <div
              key={issue.identifier}
              className="flex items-center justify-between py-1.5 border-b border-[#252535] last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_COLORS[issue.priority] ?? 'bg-[#606070]'}`}
                />
                <ExternalLink href={issue.url} className="text-xs text-[#E2E2E8] truncate">
                  <span className="text-[#606070] mr-1">{issue.identifier}</span>
                  {issue.title}
                </ExternalLink>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {issue.labels.slice(0, 1).map((label) => (
                  <span
                    key={label}
                    className={`text-[9px] px-1 py-0.5 rounded ${
                      label.toLowerCase() === 'bug'
                        ? 'bg-[#EF444415] text-[#EF4444]'
                        : label.toLowerCase() === 'feature'
                          ? 'bg-[#38BDF815] text-[#38BDF8]'
                          : 'bg-[#ffffff10] text-[#606070]'
                    }`}
                  >
                    {label}
                  </span>
                ))}
                <span className={`text-[9px] ${PRIORITY_TEXT[issue.priority] ?? 'text-[#606070]'}`}>
                  {issue.priorityLabel}
                </span>
              </div>
            </div>
          ))}
          {hiddenIssueCount > 0 && (
            <button
              onClick={() => setIssuesExpanded(!issuesExpanded)}
              className="text-[10px] text-[#606070] hover:text-[#9090A0] flex items-center gap-1"
            >
              <span>{issuesExpanded ? '▼' : '►'}</span>
              {issuesExpanded ? 'Show less' : `Show all (${issues.length})`}
            </button>
          )}
        </div>
      )}

      {/* Cycle progress (only if active) */}
      {data.cycleName && data.cycleProgress != null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[#9090A0]">{data.cycleName}</span>
            {data.daysLeftInCycle != null && (
              <span className="text-[10px] text-[#606070]">{data.daysLeftInCycle}d left</span>
            )}
          </div>
          <ProgressBar
            value={data.cycleProgress}
            color="purple"
            label={`${data.completedThisCycle}/${data.cycleTotalIssues}`}
            size="sm"
          />
        </div>
      )}

      {/* Active projects */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-[#606070] uppercase tracking-wider">Active Projects</p>
            {hiddenProjectCount > 0 && (
              <button
                onClick={() => setProjectsExpanded(!projectsExpanded)}
                className="text-[10px] text-[#606070] hover:text-[#9090A0] flex items-center gap-1"
              >
                <span>{projectsExpanded ? '▼' : '►'}</span>
                {projectsExpanded ? 'Show less' : `Show all (${projects.length})`}
              </button>
            )}
          </div>
          <div className="space-y-1">
            {visibleProjects.map((project) => (
              <div key={project.name} className="flex items-center justify-between text-xs">
                <span className="text-[#E2E2E8] truncate">{project.name}</span>
                <span className="text-[#606070] shrink-0 ml-2">{project.progress}%</span>
              </div>
            ))}
            {!projectsExpanded && hiddenProjectCount > 0 && (
              <span className="text-[10px] text-[#606070]">... +{hiddenProjectCount} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
