import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'github' as const
export const INTEGRATION_NAME = 'GitHub'
export const DEFAULT_TTL = 60
export const FETCH_TIMEOUT_MS = 30_000 // multi-repo + issues + traffic + CI

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'GitHub PAT required'),
  owner: z.string().min(1),
  repo: z.string().optional().default(''),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface WorkflowRun {
  id: number
  name: string
  status: string
  conclusion: string | null
  head_branch: string
  created_at: string
  updated_at: string
  html_url: string
  run_number: number
  event: string
}

export interface DependabotAlert {
  number: number
  state: string
  severity: string
  summary: string
  package_name: string
  created_at: string
  html_url: string
}

export interface TrafficData {
  views: { count: number; uniques: number }
  clones: { count: number; uniques: number }
}

export interface PullRequestSummary {
  number: number
  title: string
  state: string
  user: string
  created_at: string
  updated_at: string
  html_url: string
  draft: boolean
}

interface RepoSummary {
  name: string
  full_name: string
  html_url: string
  stargazers_count: number
  open_issues_count: number
  forks_count: number
  language: string | null
  pushed_at: string
  visibility: string
  default_branch: string
}

export interface RepoActivity {
  name: string
  fullName: string
  htmlUrl: string
  openPRs: PullRequestSummary[]
  recentRuns: WorkflowRun[]
}

export interface IssueSummary {
  number: number
  title: string
  state: string
  user: string
  labels: string[]
  created_at: string
  updated_at: string
  html_url: string
}

export interface RawData {
  repos: RepoSummary[]
  primaryRepo: string | null
  repo: {
    stargazers_count: number
    open_issues_count: number
    forks_count: number
    watchers_count: number
    language: string | null
    pushed_at: string
    default_branch: string
    html_url: string
  }
  issues: IssueSummary[]
  pullRequests: { total_count: number }
  recentCommit: {
    sha: string
    message: string
    date: string
    author: string
    url: string
  } | null
  workflowRuns: WorkflowRun[]
  dependabotAlerts: DependabotAlert[]
  traffic: TrafficData
  repoActivities: RepoActivity[]
}

export interface PanelData {
  // Multi-repo overview
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
  // Primary repo details (most recently updated, or configured one)
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
  // Per-repo activity for expandable view
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

async function ghFetch(url: string, headers: Record<string, string>): Promise<Response> {
  return fetch(url, { headers, signal: AbortSignal.timeout(10_000) })
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    Accept: 'application/vnd.github.v3+json',
  }
  const base = 'https://api.github.com'

  // Step 1: Fetch user's repos via authenticated endpoint (includes private repos, proper sort)
  let reposRes = await ghFetch(
    `${base}/user/repos?sort=updated&direction=desc&per_page=20&affiliation=owner`,
    headers,
  )
  // Fallback to public endpoint if authenticated endpoint fails (e.g. fine-grained PAT without user scope)
  if (!reposRes.ok) {
    console.warn(
      `[github] /user/repos failed (${reposRes.status}), falling back to /users/${config.owner}/repos (public only)`,
    )
    reposRes = await ghFetch(
      `${base}/users/${config.owner}/repos?sort=updated&direction=desc&per_page=20&type=owner`,
      headers,
    )
  }
  const reposList: RepoSummary[] = reposRes.ok ? ((await reposRes.json()) as RepoSummary[]) : []

  // Step 2: Determine the primary repo for detailed data
  const primaryRepo = config.repo
    ? `${config.owner}/${config.repo}`
    : reposList[0]
      ? `${config.owner}/${reposList[0].name}`
      : null

  if (!primaryRepo) {
    throw new Error('No repositories found — check GITHUB_REPO_OWNER in .env')
  }

  // Step 3: Fetch detailed data for the primary repo
  const [repoRes, prRes, issuesRes, commitsRes, runsRes, alertsRes, viewsRes, clonesRes] =
    await Promise.all([
      ghFetch(`${base}/repos/${primaryRepo}`, headers),
      ghFetch(`${base}/search/issues?q=repo:${primaryRepo}+type:pr+state:open&per_page=1`, headers),
      ghFetch(
        `${base}/repos/${primaryRepo}/issues?state=open&sort=updated&direction=desc&per_page=10`,
        headers,
      ),
      ghFetch(`${base}/repos/${primaryRepo}/commits?per_page=1`, headers),
      ghFetch(`${base}/repos/${primaryRepo}/actions/runs?per_page=10`, headers),
      ghFetch(`${base}/repos/${primaryRepo}/dependabot/alerts?state=open&per_page=25`, headers),
      ghFetch(`${base}/repos/${primaryRepo}/traffic/views`, headers),
      ghFetch(`${base}/repos/${primaryRepo}/traffic/clones`, headers),
    ])

  if (!repoRes.ok)
    throw new Error(
      apiError(repoRes.status, {
        401: 'Authentication failed — check your GITHUB_PAT',
        403: 'Token lacks permissions — ensure repo scope is enabled',
        404: 'Repository not found — check GITHUB_REPO_OWNER and GITHUB_REPO_NAME in .env',
      }),
    )

  const repo = (await repoRes.json()) as RawData['repo']
  const prData = prRes.ok ? ((await prRes.json()) as { total_count: number }) : { total_count: 0 }

  // Parse open issues (GitHub's issues endpoint includes PRs, so filter them out)
  const issuesRaw = issuesRes.ok
    ? ((await issuesRes.json()) as Array<{
        number: number
        title: string
        state: string
        user?: { login?: string }
        labels?: Array<{ name?: string }>
        created_at: string
        updated_at: string
        html_url: string
        pull_request?: unknown
      }>)
    : []
  const issues: IssueSummary[] = issuesRaw
    .filter((i) => !i.pull_request) // Exclude PRs from issues list
    .map((i) => ({
      number: i.number,
      title: i.title,
      state: i.state,
      user: i.user?.login ?? '',
      labels: (i.labels ?? []).map((l) => l.name ?? '').filter(Boolean),
      created_at: i.created_at,
      updated_at: i.updated_at,
      html_url: i.html_url,
    }))

  const commits = commitsRes.ok ? ((await commitsRes.json()) as Array<Record<string, unknown>>) : []

  const firstCommit = commits[0] as
    | {
        sha?: string
        html_url?: string
        commit?: { message?: string; author?: { date?: string; name?: string } }
      }
    | undefined
  const recentCommit = firstCommit
    ? {
        sha: String(firstCommit.sha ?? '').slice(0, 7),
        message: String(firstCommit.commit?.message ?? '').split('\n')[0] ?? '',
        date: String(firstCommit.commit?.author?.date ?? ''),
        author: String(firstCommit.commit?.author?.name ?? ''),
        url: String(firstCommit.html_url ?? ''),
      }
    : null

  // Workflow runs
  const runsBody = runsRes.ok
    ? ((await runsRes.json()) as {
        workflow_runs?: Array<{
          id: number
          name: string
          status: string
          conclusion: string | null
          head_branch: string
          created_at: string
          updated_at: string
          html_url: string
          run_number: number
          event: string
        }>
      })
    : { workflow_runs: [] }
  const workflowRuns: WorkflowRun[] = (runsBody.workflow_runs ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    conclusion: r.conclusion,
    head_branch: r.head_branch,
    created_at: r.created_at,
    updated_at: r.updated_at,
    html_url: r.html_url,
    run_number: r.run_number,
    event: r.event,
  }))

  // Dependabot alerts
  const alertsBody = alertsRes.ok
    ? ((await alertsRes.json()) as Array<{
        number: number
        state: string
        security_advisory?: { severity?: string; summary?: string }
        security_vulnerability?: { package?: { name?: string } }
        created_at: string
        html_url: string
      }>)
    : []
  const dependabotAlerts: DependabotAlert[] = alertsBody.map((a) => ({
    number: a.number,
    state: a.state,
    severity: a.security_advisory?.severity ?? 'unknown',
    summary: a.security_advisory?.summary ?? '',
    package_name: a.security_vulnerability?.package?.name ?? '',
    created_at: a.created_at,
    html_url: a.html_url,
  }))

  // Traffic
  const viewsBody = viewsRes.ok
    ? ((await viewsRes.json()) as { count?: number; uniques?: number })
    : { count: 0, uniques: 0 }
  const clonesBody = clonesRes.ok
    ? ((await clonesRes.json()) as { count?: number; uniques?: number })
    : { count: 0, uniques: 0 }
  const traffic: TrafficData = {
    views: { count: viewsBody.count ?? 0, uniques: viewsBody.uniques ?? 0 },
    clones: { count: clonesBody.count ?? 0, uniques: clonesBody.uniques ?? 0 },
  }

  // Step 4: Fetch activity (PRs + runs) for top repos, then sort by activity score
  const activityRepos = reposList.slice(0, 10) // Fetch activity for top 10 by recency
  const rawActivities: RepoActivity[] = await Promise.all(
    activityRepos.map(async (r) => {
      const fullName = r.full_name ?? `${config.owner}/${r.name}`
      const [prsRes, actionsRes] = await Promise.all([
        ghFetch(
          `${base}/repos/${fullName}/pulls?state=open&sort=updated&per_page=5`,
          headers,
        ).catch(() => null),
        ghFetch(`${base}/repos/${fullName}/actions/runs?per_page=5`, headers).catch(() => null),
      ])

      const prs: PullRequestSummary[] = prsRes?.ok
        ? (
            (await prsRes.json()) as Array<{
              number: number
              title: string
              state: string
              user?: { login?: string }
              created_at: string
              updated_at: string
              html_url: string
              draft?: boolean
            }>
          ).map((p) => ({
            number: p.number,
            title: p.title,
            state: p.state,
            user: p.user?.login ?? '',
            created_at: p.created_at,
            updated_at: p.updated_at,
            html_url: p.html_url,
            draft: p.draft ?? false,
          }))
        : []

      const runs: WorkflowRun[] = actionsRes?.ok
        ? (((await actionsRes.json()) as { workflow_runs?: WorkflowRun[] }).workflow_runs
            ?.slice(0, 5)
            ?.map((wr) => ({
              id: wr.id,
              name: wr.name,
              status: wr.status,
              conclusion: wr.conclusion,
              head_branch: wr.head_branch,
              created_at: wr.created_at,
              updated_at: wr.updated_at,
              html_url: wr.html_url,
              run_number: wr.run_number,
              event: wr.event,
            })) ?? [])
        : []

      return {
        name: r.name,
        fullName,
        htmlUrl: r.html_url ?? `https://github.com/${fullName}`,
        openPRs: prs,
        recentRuns: runs,
      }
    }),
  )

  // Sort by activity score: open PRs + recent runs (+ failed runs weighted higher)
  const repoActivities = rawActivities.sort((a, b) => {
    const scoreA =
      a.openPRs.length * 2 +
      a.recentRuns.length +
      a.recentRuns.filter((r) => r.conclusion === 'failure').length
    const scoreB =
      b.openPRs.length * 2 +
      b.recentRuns.length +
      b.recentRuns.filter((r) => r.conclusion === 'failure').length
    return scoreB - scoreA
  })

  return {
    repos: reposList,
    primaryRepo,
    repo,
    issues,
    pullRequests: prData,
    recentCommit,
    workflowRuns,
    dependabotAlerts,
    traffic,
    repoActivities,
  }
}

export function parsePanel(raw: RawData): PanelData {
  const runs = raw.workflowRuns ?? []
  const completedRuns = runs.filter((r) => r.status === 'completed')
  const successRuns = completedRuns.filter((r) => r.conclusion === 'success')
  const ciSuccessRate =
    completedRuns.length > 0 ? Math.round((successRuns.length / completedRuns.length) * 100) : 100

  const alerts = raw.dependabotAlerts ?? []
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const highCount = alerts.filter((a) => a.severity === 'high').length

  const traffic = raw.traffic ?? {
    views: { count: 0, uniques: 0 },
    clones: { count: 0, uniques: 0 },
  }

  const primaryName = raw.primaryRepo?.split('/')[1] ?? ''
  const repoSummaries = (raw.repos ?? []).map((r) => ({
    name: r.name,
    fullName: r.full_name ?? `${r.name}`,
    htmlUrl: r.html_url ?? `https://github.com/${r.full_name ?? r.name}`,
    stars: r.stargazers_count ?? 0,
    openIssues: r.open_issues_count ?? 0,
    language: r.language,
    lastPush: r.pushed_at ?? '',
    visibility: r.visibility ?? 'public',
    isPrimary: r.name === primaryName,
  }))

  // Build per-repo activity summaries
  const repoActivities = (raw.repoActivities ?? []).map((ra) => {
    const failedRuns = ra.recentRuns.filter(
      (r) => r.status === 'completed' && r.conclusion === 'failure',
    )
    const parts: string[] = []
    if (ra.openPRs.length > 0)
      parts.push(`${ra.openPRs.length} PR${ra.openPRs.length !== 1 ? 's' : ''}`)
    if (failedRuns.length > 0) parts.push(`${failedRuns.length} failed`)
    else if (ra.recentRuns.length > 0) parts.push('CI passing')
    const activitySummary = parts.join(', ') || 'No recent activity'

    return {
      name: ra.name,
      fullName: ra.fullName,
      htmlUrl: ra.htmlUrl,
      openPRs: ra.openPRs.map((pr) => ({
        number: pr.number,
        title: pr.title,
        user: pr.user,
        url: pr.html_url,
        draft: pr.draft,
        updated: pr.updated_at,
      })),
      recentRuns: ra.recentRuns.slice(0, 3).map((r) => ({
        id: r.id,
        name: r.name,
        conclusion: r.conclusion,
        url: r.html_url,
        created: r.created_at,
      })),
      activitySummary,
    }
  })

  // Compute externalPRs: PRs where user !== repo owner
  const owner = raw.primaryRepo?.split('/')[0] ?? ''
  const allOpenPRs =
    (raw.repoActivities ?? []).find((ra) => ra.fullName === raw.primaryRepo)?.openPRs ?? []
  const externalPRs = allOpenPRs.filter((pr) => pr.user !== owner).length

  // Compute staleIssuesCount: open issues with no activity >30 days
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const staleIssuesCount = (raw.issues ?? []).filter((i) => {
    const updated = new Date(i.updated_at).getTime()
    return !isNaN(updated) && updated < thirtyDaysAgo
  }).length

  // starsTrend: placeholder (GitHub API lacks weekly star history)
  const starsTrend = 0

  // Map issues for panel
  const issuesList = (raw.issues ?? []).map((i) => ({
    number: i.number,
    title: i.title,
    user: i.user,
    labels: i.labels,
    url: i.html_url,
    created: i.created_at,
    updated: i.updated_at,
  }))

  return {
    repos: repoSummaries,
    stars: raw.repo?.stargazers_count ?? 0,
    openIssues: raw.repo?.open_issues_count ?? 0,
    openPRs: raw.pullRequests?.total_count ?? 0,
    externalPRs,
    staleIssuesCount,
    starsTrend,
    issues: issuesList,
    forks: raw.repo?.forks_count ?? 0,
    watchers: raw.repo?.watchers_count ?? 0,
    language: raw.repo?.language ?? null,
    lastPush: raw.repo?.pushed_at ?? '',
    repoUrl: raw.repo?.html_url ?? '',
    lastCommit: raw.recentCommit ?? null,
    cicd: {
      recentRuns: runs.slice(0, 5).map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        branch: r.head_branch,
        created: r.created_at,
        url: r.html_url,
        event: r.event,
      })),
      successRate: ciSuccessRate,
      lastRunConclusion: runs[0]?.conclusion ?? null,
    },
    dependabot: {
      openAlerts: alerts.length,
      criticalCount,
      highCount,
      alerts: alerts.slice(0, 10).map((a) => ({
        number: a.number,
        severity: a.severity,
        summary: a.summary,
        package: a.package_name,
        created: a.created_at,
        url: a.html_url,
      })),
    },
    traffic: {
      views: traffic.views.count,
      uniqueVisitors: traffic.views.uniques,
      clones: traffic.clones.count,
      uniqueCloners: traffic.clones.uniques,
    },
    repoActivities,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.owner + (config.repo ?? ''))
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.repo) return 'error'

  const criticals = (raw.dependabotAlerts ?? []).filter((a) => a.severity === 'critical')
  if (criticals.length > 0) return 'error'

  const latestRun = (raw.workflowRuns ?? [])[0]
  if (latestRun?.status === 'completed' && latestRun.conclusion === 'failure') return 'error'

  const highs = (raw.dependabotAlerts ?? []).filter((a) => a.severity === 'high')
  if (highs.length > 0) return 'warn'
  if (latestRun?.status === 'completed' && latestRun.conclusion === 'cancelled') return 'warn'

  const lastPush = new Date(raw.repo.pushed_at).getTime()
  const daysSinceLastPush = (Date.now() - lastPush) / (1000 * 60 * 60 * 24)
  if (daysSinceLastPush > 30) return 'warn'

  return 'ok'
}
