import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { MiniBar } from '../ui/MiniBar'
import { ExternalLink } from '../ui/ExternalLink'

interface LinearPanelData {
  openIssues: number
  inProgress: number
  completedThisCycle: number
  cycleTotalIssues: number
  backlog: number
  teamName: string
  cycleName: string | null
  cycleProgress: number | null
  cycleStartsAt: string | null
  cycleEndsAt: string | null
}

export function LinearPanel({ data }: { data: LinearPanelData }) {
  const totalIssues = data.openIssues + data.inProgress + data.completedThisCycle + data.backlog

  const issueSegments = [
    { value: data.completedThisCycle, color: '#00D46A', label: 'Done' },
    { value: data.inProgress, color: '#3B82F6', label: 'In Progress' },
    { value: data.openIssues, color: '#FFB800', label: 'Open' },
    { value: data.backlog, color: '#4B5563', label: 'Backlog' },
  ]

  return (
    <div className="space-y-4">
      {/* Hero: cycle progress or team overview */}
      {data.cycleName && data.cycleProgress !== null ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-white">
              <ExternalLink href="https://linear.app" className="text-white">
                {data.cycleName}
              </ExternalLink>
            </p>
            <p className="text-xs text-gray-400">
              <ExternalLink href="https://linear.app" className="text-gray-400">
                {data.teamName}
              </ExternalLink>
            </p>
          </div>
          <ProgressBar value={data.cycleProgress} color="purple" label="Cycle progress" size="md" />
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-white">
            <ExternalLink href="https://linear.app" className="text-white">
              {data.teamName}
            </ExternalLink>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">No active cycle</p>
        </div>
      )}

      {/* Issue breakdown bar */}
      {totalIssues > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium mb-1.5 block">Issues</span>
          <MiniBar segments={issueSegments} height={8} />
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="In Progress" value={data.inProgress} />
        <Metric label="Open" value={data.openIssues} />
        <Metric
          label="Done"
          value={data.completedThisCycle}
          subValue={data.cycleTotalIssues > 0 ? `of ${data.cycleTotalIssues}` : undefined}
        />
      </div>
    </div>
  )
}
