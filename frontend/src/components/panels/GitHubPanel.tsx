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
  const [showIssues, setShowIssues] = useState(false)
  const [showPRs, setShowPRs] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(SELECTED_REPO_KEY)
    } catch {
      return null
    }
  })
  const [showRepoList, setShowRepoList] = useState(false)
  const hasTraffic = data.traffic.views > 0 || data.traffic.clones > 0
  const hasDependabot =
    data.dependabot.openAlerts > 0 ||
    data.dependabot.criticalCount > 0 ||
    data.dependabot.highCount > 0
  const activities = data.repoActivities ?? []

  // Find activity for selected repo, or show all
  const selectedActivity = selectedRepo ? activities.find((a) => a.name === selectedRepo) : null

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
    <div className="space-y-4">
      {/* Hero: last commit on primary repo */}
      {data.lastCommit && (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">
              {data.lastCommit.url ? (
                <ExternalLink href={data.lastCommit.url} className="text-white">
                  {commitMsg(data.lastCommit.message, 60)}
                </ExternalLink>
              ) : (
                commitMsg(data.lastCommit.message, 60)
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {data.lastCommit.author} · {shortSha(data.lastCommit.sha)} ·{' '}
              {timeAgo(data.lastCommit.date)}
            </p>
          </div>
        </div>
      )}

      {/* Primary repo stats */}
      <div className="grid grid-cols-4 gap-3">
        <button onClick={() => setShowIssues(!showIssues)} className="text-left">
          <Metric
            label="Open Issues"
            value={data.openIssues}
            trend={data.openIssues > 10 ? 'down' : undefined}
          />
        </button>
        <button onClick={() => setShowPRs(!showPRs)} className="text-left">
          <Metric label="Open PRs" value={data.openPRs} />
        </button>
        <Metric label="Stars" value={data.stars} />
        <Metric label="Forks" value={data.forks} />
      </div>

      {/* Expandable issues list */}
      {showIssues && (data.issues ?? []).length > 0 && (
        <div className="border border-[#1E1E2E] rounded-lg px-3 py-2 space-y-1">
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">Open Issues</span>
          {(data.issues ?? []).map((issue) => (
            <div key={issue.number} className="flex items-center justify-between text-xs">
              <ExternalLink href={issue.url} className="text-gray-400 truncate max-w-[65%]">
                #{issue.number} {issue.title}
              </ExternalLink>
              <div className="flex items-center gap-1.5 shrink-0">
                {issue.labels.slice(0, 2).map((l) => (
                  <span
                    key={l}
                    className="text-[10px] px-1 py-0.5 bg-[#1E1E2E] text-gray-500 rounded"
                  >
                    {l}
                  </span>
                ))}
                <span className="text-gray-600">{timeAgo(issue.updated)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {showIssues && (data.issues ?? []).length === 0 && (
        <p className="text-[10px] text-gray-600">No open issues</p>
      )}

      {/* Expandable PRs list */}
      {showPRs &&
        (() => {
          const primaryActivity = activities.find((a) =>
            data.repos.some((r) => r.isPrimary && r.name === a.name),
          )
          const prs = primaryActivity?.openPRs ?? []
          return prs.length > 0 ? (
            <div className="border border-[#1E1E2E] rounded-lg px-3 py-2 space-y-1">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">
                Open Pull Requests
              </span>
              {prs.map((pr) => (
                <div key={pr.number} className="flex items-center justify-between text-xs">
                  <ExternalLink href={pr.url} className="text-gray-400 truncate max-w-[70%]">
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
          ) : (
            <p className="text-[10px] text-gray-600">No open pull requests</p>
          )
        })()}

      {/* CI/CD */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 font-medium">CI/CD</span>
          {data.cicd.lastRunConclusion && <StatusBadge status={data.cicd.lastRunConclusion} />}
        </div>
        <ProgressBar
          value={data.cicd.successRate}
          color={
            data.cicd.successRate >= 90 ? 'green' : data.cicd.successRate >= 70 ? 'yellow' : 'red'
          }
          label={`${Math.round(data.cicd.successRate)}% pass rate`}
          showValue={false}
        />
        {data.cicd.recentRuns.length > 0 && (
          <div className="mt-2 space-y-1">
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
        )}
      </div>

      {/* Dependabot */}
      {hasDependabot && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Security Alerts</span>
          <div className="flex gap-2 mt-1.5">
            {data.dependabot.criticalCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-[#FF454520] text-[#FF4545] rounded font-semibold">
                {data.dependabot.criticalCount} critical
              </span>
            )}
            {data.dependabot.highCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 bg-[#FFB80020] text-[#FFB800] rounded font-semibold">
                {data.dependabot.highCount} high
              </span>
            )}
            {data.dependabot.openAlerts >
              data.dependabot.criticalCount + data.dependabot.highCount && (
              <span className="text-[10px] px-2 py-0.5 bg-[#1E1E2E] text-gray-400 rounded">
                {data.dependabot.openAlerts -
                  data.dependabot.criticalCount -
                  data.dependabot.highCount}{' '}
                other
              </span>
            )}
          </div>
          {data.dependabot.alerts.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {data.dependabot.alerts.slice(0, 3).map((alert) => (
                <div key={alert.number} className="text-xs">
                  <ExternalLink href={alert.url} className="text-gray-400">
                    {alert.package}: {alert.summary.slice(0, 50)}
                  </ExternalLink>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!hasDependabot && (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#00D46A]" />
          <span className="text-xs text-gray-400">No security alerts</span>
        </div>
      )}

      {/* Traffic */}
      {hasTraffic && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Traffic (14d)</span>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            <Metric
              label="Views"
              value={data.traffic.views.toLocaleString()}
              subValue={`${data.traffic.uniqueVisitors} unique`}
            />
            <Metric
              label="Clones"
              value={data.traffic.clones.toLocaleString()}
              subValue={`${data.traffic.uniqueCloners} unique`}
            />
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

          {/* Repo list dropdown */}
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
                      {repo.language && (
                        <span className="text-[10px] text-gray-600">{repo.language}</span>
                      )}
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

          {/* Selected repo detail */}
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
                  ✕
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

          {/* Quick activity summary for most active repos (when no repo selected) */}
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
