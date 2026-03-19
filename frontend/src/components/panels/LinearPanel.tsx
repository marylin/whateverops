import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
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
  topPriorityIssue: string | null
  overdueCount: number
  blockedCount: number
  daysLeftInCycle: number | null
  cycleOnTrack: 'ahead' | 'behind' | 'on-track' | null
}

export function LinearPanel({ data }: { data: LinearPanelData }) {
  const hasOverdue = (data.overdueCount ?? 0) > 0
  const hasBlocked = (data.blockedCount ?? 0) > 0
  const isBehind = data.cycleOnTrack === 'behind'

  return (
    <div className="space-y-3">
      {/* Hero: top priority issue title */}
      <div>
        {data.topPriorityIssue ? (
          <div>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">
              Top Priority
            </p>
            <p className="text-sm font-semibold text-white truncate">
              <ExternalLink href="https://linear.app" className="text-white">
                {data.topPriorityIssue}
              </ExternalLink>
            </p>
          </div>
        ) : (
          <p className="text-sm font-semibold text-white">
            <ExternalLink href="https://linear.app" className="text-white">
              {data.teamName}
            </ExternalLink>
          </p>
        )}
      </div>

      {/* Alert row */}
      {(hasOverdue || hasBlocked || isBehind) && (
        <div className="flex flex-wrap gap-1.5">
          {hasOverdue && (
            <span className="text-[10px] px-2 py-0.5 bg-[#FF454520] text-[#FF4545] rounded font-semibold">
              {data.overdueCount} overdue
            </span>
          )}
          {hasBlocked && (
            <span className="text-[10px] px-2 py-0.5 bg-[#FFB80020] text-[#FFB800] rounded font-semibold">
              {data.blockedCount} blocked
            </span>
          )}
          {isBehind && (
            <span className="text-[10px] px-2 py-0.5 bg-[#FFB80020] text-[#FFB800] rounded font-semibold">
              Cycle behind schedule
            </span>
          )}
        </div>
      )}

      {/* Cycle progress bar */}
      {data.cycleName && data.cycleProgress !== null && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">{data.cycleName}</span>
            <span className="text-xs text-gray-500">
              {data.daysLeftInCycle !== null ? `${data.daysLeftInCycle}d left` : ''}
            </span>
          </div>
          <ProgressBar
            value={data.cycleProgress}
            color={isBehind ? 'yellow' : data.cycleOnTrack === 'ahead' ? 'green' : 'purple'}
            label={`${data.completedThisCycle}/${data.cycleTotalIssues} done`}
            size="md"
          />
        </div>
      )}

      {!data.cycleName && <p className="text-xs text-gray-500">No active cycle</p>}

      {/* Supporting metrics */}
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
