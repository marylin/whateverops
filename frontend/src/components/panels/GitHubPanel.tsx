import { useState, useEffect } from 'react'
import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { StatusBadge } from '../ui/StatusBadge'
import { ExternalLink } from '../ui/ExternalLink'
import { timeAgo, commitMsg, shortSha } from '../../lib/format'

interface GitHubPanelData {
  repos: Array<{
    name: string
    fullName: string
    htmlUrl: string
    stars: number
    openIssues: number
    language: string | null
    lastPush: string
    visibility: string
    isPrimary: boolean
  }>
  stars: number
  openIssues: number
  openPRs: number
  forks: number
  watchers: number
  language: string | null
  lastPush: string
  repoUrl: string
  externalPRs: number
  staleIssuesCount: number
  starsTrend: number
  issues: Array<{
    number: number
    title: string
    user: string
    labels: string[]
    url: string
    created: string
    updated: string
  }>
  lastCommit: {
    sha: string
    message: string
    date: string
    author: string
    url: string
  } | null
  cicd: {
    recentRuns: Array<{
      id: number
      name: string
      status: string
      conclusion: string | null
      branch: string
      created: string
      url: string
      event: string
    }>
    successRate: number
    lastRunConclusion: string | null
  }
  dependabot: {
    openAlerts: number
    criticalCount: number
    highCount: number
    alerts: Array<{
      number: number
      severity: string
      summary: string
      package: string
      created: string
      url: string
    }>
  }
  traffic: {
    views: number
    uniqueVisitors: number
    clones: number
    uniqueCloners: number
  }
  repoActivities: Array<{
    name: string
    fullName: string
    htmlUrl: string
    openPRs: Array<{
      number: number
      title: string
      user: string
      url: string
      draft: boolean
      updated: string
    }>
    recentRuns: Array<{
      id: number
      name: string
      conclusion: string | null
      url: string
      created: string
    }>
    activitySummary: string
  }>
}

const SELECTED_REPO_KEY = 'github-selected-repo'

export function GitHubPanel({ data }: { data: GitHubPanelData }) {
  const [showDetails, setShowDetails] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SELECTED_REPO_KEY)
    } catch {
      return null
    }
  })
  const [showRepoList, setShowRepoList] = useState(false)
  const activities = data.repoActivities ?? []
  const selectedActivity = selectedRepo ? activities.find((a) => a.name === selectedRepo) : null

  const ciPassing = data.cicd.lastRunConclusion === 'success'
  const ciFailing = data.cicd.lastRunConclusion === 'failure'

  useEffect(() => {
    try {
      if (selectedRepo) sessionStorage.setItem(SELECTED_REPO_KEY, selectedRepo)
      else sessionStorage.removeItem(SELECTED_REPO_KEY)
    } catch {
      // sessionStorage unavailable
    }
  }, [selectedRepo])

  const selectRepo = (name: string) => {
    setSelectedRepo(name === selectedRepo ? null : name)
    setShowRepoList(false)
  }

  return (
    <div className="space-y-3">
      {/* Hero: CI status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {ciFailing ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF4545]" />
              <span className="text-sm font-semibold text-[#FF4545]">CI Failing</span>
            </>
          ) : ciPassing ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#00D46A]" />
              <span className="text-sm font-semibold text-white">CI Passing</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]" />
              <span className="text-sm font-semibold text-white">
                {data.cicd.lastRunConclusion ?? 'No CI runs'}
              </span>
            </>
          )}
        </div>
        {data.lastCommit && (
          <span className="text-xs text-gray-500 truncate max-w-[50%]">
            {shortSha(data.lastCommit.sha)} · {timeAgo(data.lastCommit.date)}
          </span>
        )}
      </div>

      {/* Alert row */}
      {(ciFailing || data.dependabot.criticalCount > 0 || (data.externalPRs ?? 0) > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {ciFailing && (
            <span className="text-[10px] px-2 py-0.5 bg-[#FF454520] text-[#FF4545] rounded font-semibold">
              CI failing
            </span>
          )}
          {data.dependabot.criticalCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-[#FF454520] text-[#FF4545] rounded font-semibold">
              {data.dependabot.criticalCount} critical alert
              {data.dependabot.criticalCount !== 1 ? 's' : ''}
            </span>
          )}
          {(data.externalPRs ?? 0) > 0 && (
            <span className="text-[10px] px-2 py-0.5 bg-[#FFB80020] text-[#FFB800] rounded font-semibold">
              {data.externalPRs} external PR{data.externalPRs !== 1 ? 's' : ''} waiting
            </span>
          )}
        </div>
      )}

      {/* Supporting metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Metric
          label="Stars"
          value={data.stars}
          subValue={
            (data.starsTrend ?? 0) !== 0
              ? `${data.starsTrend > 0 ? '+' : ''}${data.starsTrend}/wk`
              : undefined
          }
          trend={data.starsTrend > 0 ? 'up' : data.starsTrend < 0 ? 'down' : undefined}
        />
        <Metric label="Open PRs" value={data.openPRs} />
        <Metric
          label="Alerts"
          value={data.dependabot.openAlerts}
          subValue={
            data.dependabot.criticalCount > 0
              ? `${data.dependabot.criticalCount} critical`
              : undefined
          }
          trend={data.dependabot.criticalCount > 0 ? 'down' : undefined}
        />
      </div>

      {/* CI pass rate bar */}
      <ProgressBar
        value={data.cicd.successRate}
        color={
          data.cicd.successRate >= 90 ? 'green' : data.cicd.successRate >= 70 ? 'yellow' : 'red'
        }
        label={`${Math.round(data.cicd.successRate)}% CI pass rate`}
        showValue={false}
      />

      {/* Expandable details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
      >
        {showDetails ? 'Hide details' : 'Show details'}
      </button>

      {showDetails && (
        <div className="space-y-3">
          {/* Last commit */}
          {data.lastCommit && (
            <div className="border border-[#1E1E2E] rounded-lg px-3 py-2">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                Last Commit
              </span>
              <p className="text-xs text-gray-300 mt-1">
                {data.lastCommit.url ? (
                  <ExternalLink href={data.lastCommit.url} className="text-gray-300">
                    {commitMsg(data.lastCommit.message, 60)}
                  </ExternalLink>
                ) : (
                  commitMsg(data.lastCommit.message, 60)
                )}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {data.lastCommit.author} · {shortSha(data.lastCommit.sha)} ·{' '}
                {timeAgo(data.lastCommit.date)}
              </p>
            </div>
          )}

          {/* Recent CI runs */}
          {data.cicd.recentRuns.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 font-medium">Recent CI Runs</span>
              <div className="mt-1 space-y-1">
                {data.cicd.recentRuns.slice(0, 3).map((run) => (
                  <div key={run.id} className="flex items-center justify-between text-xs">
                    <ExternalLink href={run.url} className="text-gray-400 truncate max-w-[50%]">
                      {run.name}
                    </ExternalLink>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{run.branch}</span>
                      <StatusBadge status={run.conclusion ?? run.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependabot alerts detail */}
          {data.dependabot.alerts.length > 0 && (
            <div>
              <span className="text-xs text-gray-500 font-medium">Security Alerts</span>
              <div className="mt-1 space-y-1">
                {data.dependabot.alerts.slice(0, 3).map((alert) => (
                  <div key={alert.number} className="text-xs">
                    <ExternalLink href={alert.url} className="text-gray-400">
                      {alert.package}: {alert.summary.slice(0, 50)}
                    </ExternalLink>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* De-emphasized info */}
          <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-600">
            <div>
              <span className="block text-gray-700">Watchers</span>
              {data.watchers}
            </div>
            <div>
              <span className="block text-gray-700">Forks</span>
              {data.forks}
            </div>
            <div>
              <span className="block text-gray-700">Last push</span>
              {timeAgo(data.lastPush)}
            </div>
          </div>
        </div>
      )}

      {/* Repository Browser */}
      {data.repos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 font-medium">
              Repositories ({data.repos.length})
            </span>
            <button
              onClick={() => setShowRepoList(!showRepoList)}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showRepoList ? 'Hide' : 'Browse All'}
            </button>
          </div>

          {showRepoList && (
            <div className="mb-2 max-h-48 overflow-y-auto border border-[#1E1E2E] rounded-lg divide-y divide-[#1E1E2E]">
              {data.repos.map((repo) => {
                const activity = activities.find((a) => a.name === repo.name)
                const isSelected = selectedRepo === repo.name
                return (
                  <button
                    key={repo.fullName}
                    onClick={() => selectRepo(repo.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#1E1E2E40] transition-colors ${isSelected ? 'bg-[#1E1E2E60]' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-300 truncate">{repo.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activity && (
                        <span className="text-[10px] text-gray-600">
                          {activity.activitySummary}
                        </span>
                      )}
                      <span className="text-gray-600 text-[10px]">{timeAgo(repo.lastPush)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedActivity && (
            <div className="border border-[#1E1E2E] rounded-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1E1E2E]">
                <ExternalLink
                  href={selectedActivity.htmlUrl}
                  className="text-xs text-gray-300 font-medium"
                >
                  {selectedActivity.fullName}
                </ExternalLink>
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="text-[10px] text-gray-600 hover:text-gray-400"
                >
                  x
                </button>
              </div>
              <div className="px-3 pb-2 space-y-2">
                {selectedActivity.openPRs.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                      Pull Requests
                    </span>
                    <div className="mt-1 space-y-1">
                      {selectedActivity.openPRs.map((pr) => (
                        <div key={pr.number} className="flex items-center justify-between text-xs">
                          <ExternalLink
                            href={pr.url}
                            className="text-gray-400 truncate max-w-[70%]"
                          >
                            #{pr.number} {pr.title}
                          </ExternalLink>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {pr.draft && (
                              <span className="text-[10px] px-1 py-0.5 bg-[#1E1E2E] text-gray-500 rounded">
                                draft
                              </span>
                            )}
                            <span className="text-gray-600">{timeAgo(pr.updated)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedActivity.recentRuns.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                      Actions
                    </span>
                    <div className="mt-1 space-y-1">
                      {selectedActivity.recentRuns.map((run) => (
                        <div key={run.id} className="flex items-center justify-between text-xs">
                          <ExternalLink href={run.url} className="text-gray-400 truncate">
                            {run.name}
                          </ExternalLink>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={run.conclusion ?? 'pending'} />
                            <span className="text-gray-600">{timeAgo(run.created)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedActivity.openPRs.length === 0 &&
                  selectedActivity.recentRuns.length === 0 && (
                    <p className="text-[10px] text-gray-600 pt-2">No recent activity</p>
                  )}
              </div>
            </div>
          )}

          {!selectedActivity && activities.length > 0 && (
            <div className="space-y-1">
              {activities.slice(0, 4).map((repo) => (
                <button
                  key={repo.fullName}
                  onClick={() => selectRepo(repo.name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs border border-[#1E1E2E] rounded-lg hover:bg-[#1E1E2E20] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ExternalLink href={repo.htmlUrl} className="text-gray-300 truncate">
                      {repo.name}
                    </ExternalLink>
                  </div>
                  <span className="text-gray-600 shrink-0 ml-2">{repo.activitySummary}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
