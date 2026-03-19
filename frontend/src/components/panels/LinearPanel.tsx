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
  1: 'bg-[#FF4545]', // Urgent
  2: 'bg-[#FFB800]', // High
  3: 'bg-[#7C3AED]', // Medium
  4: 'bg-gray-600', // Low
}

const PRIORITY_TEXT: Record<number, string> = {
  1: 'text-[#FF4545]',
  2: 'text-[#FFB800]',
  3: 'text-[#A78BFA]',
  4: 'text-gray-500',
}

export function LinearPanel({ data }: { data: LinearPanelData }) {
  const issues = data.inProgressIssues ?? []
  const hasIssues = issues.length > 0
  const teamUrl = `https://linear.app/${data.teamKey?.toLowerCase() || 'team'}`

  return (
    <div className="space-y-3">
      {/* Hero: what you're working on */}
      <div className="flex items-center justify-between">
        <div>
          {hasIssues ? (
            <>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">Working on</p>
              <ExternalLink href={issues[0]!.url} className="text-sm font-semibold text-white">
                {issues[0]!.identifier}: {issues[0]!.title}
              </ExternalLink>
            </>
          ) : (
            <p className="text-sm text-gray-400">No issues in progress</p>
          )}
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white font-medium">{data.inProgressCount} in progress</span>
        <span className="text-xs text-gray-500">·</span>
        <span className="text-xs text-gray-400">{data.openCount} open</span>
        {data.bugsInProgress > 0 && (
          <>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF454520] text-[#FF4545]">
              {data.bugsInProgress} bug{data.bugsInProgress !== 1 ? 's' : ''}
            </span>
          </>
        )}
        {data.featuresInProgress > 0 && (
          <>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#BB87FC20] text-[#BB87FC]">
              {data.featuresInProgress} feature{data.featuresInProgress !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      {/* In-progress issue list */}
      {issues.length > 1 && (
        <div className="space-y-1">
          {issues.slice(1, 6).map((issue) => (
            <div
              key={issue.identifier}
              className="flex items-center justify-between py-1.5 border-b border-[#2A2A3E] last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_COLORS[issue.priority] ?? 'bg-gray-600'}`}
                />
                <ExternalLink href={issue.url} className="text-xs text-gray-300 truncate">
                  <span className="text-gray-500 mr-1">{issue.identifier}</span>
                  {issue.title}
                </ExternalLink>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {issue.labels.slice(0, 1).map((label) => (
                  <span
                    key={label}
                    className={`text-[9px] px-1 py-0.5 rounded ${
                      label.toLowerCase() === 'bug'
                        ? 'bg-[#FF454515] text-[#FF4545]'
                        : label.toLowerCase() === 'feature'
                          ? 'bg-[#BB87FC15] text-[#BB87FC]'
                          : 'bg-[#ffffff10] text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                ))}
                <span className={`text-[9px] ${PRIORITY_TEXT[issue.priority] ?? 'text-gray-600'}`}>
                  {issue.priorityLabel}
                </span>
              </div>
            </div>
          ))}
          {issues.length > 6 && (
            <ExternalLink href={teamUrl} className="text-[10px] text-gray-600 pt-1 block">
              +{issues.length - 6} more in progress
            </ExternalLink>
          )}
        </div>
      )}

      {/* Cycle progress (only if active) */}
      {data.cycleName && data.cycleProgress != null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{data.cycleName}</span>
            {data.daysLeftInCycle != null && (
              <span className="text-[10px] text-gray-600">{data.daysLeftInCycle}d left</span>
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
      {data.projects.length > 0 && (
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Active Projects</p>
          <div className="space-y-1">
            {data.projects.slice(0, 4).map((project) => (
              <div key={project.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-300 truncate">{project.name}</span>
                <span className="text-gray-500 shrink-0 ml-2">{project.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
