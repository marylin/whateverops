import { z } from 'zod'

export const INTEGRATION_ID = 'github' as const
export const INTEGRATION_NAME = 'GitHub'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'GitHub PAT required'),
  owner: z.string().min(1),
  repo: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  repo: {
    stargazers_count: number
    open_issues_count: number
    forks_count: number
    watchers_count: number
    language: string | null
    pushed_at: string
    default_branch: string
  }
  pullRequests: { total_count: number }
  recentCommit: {
    sha: string
    message: string
    date: string
    author: string
  } | null
}

export interface PanelData {
  stars: number
  openIssues: number
  openPRs: number
  forks: number
  watchers: number
  language: string | null
  lastPush: string
  lastCommit: {
    sha: string
    message: string
    date: string
    author: string
  } | null
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    Accept: 'application/vnd.github.v3+json',
  }
  const base = 'https://api.github.com'

  const [repoRes, prRes, commitsRes] = await Promise.all([
    fetch(`${base}/repos/${config.owner}/${config.repo}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(
      `${base}/search/issues?q=repo:${config.owner}/${config.repo}+type:pr+state:open&per_page=1`,
      { headers, signal: AbortSignal.timeout(10_000) },
    ),
    fetch(`${base}/repos/${config.owner}/${config.repo}/commits?per_page=1`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ])

  if (!repoRes.ok) throw new Error(`GitHub API error: ${repoRes.status}`)

  const repo = (await repoRes.json()) as RawData['repo']
  const prData = prRes.ok ? ((await prRes.json()) as { total_count: number }) : { total_count: 0 }
  const commits = commitsRes.ok ? ((await commitsRes.json()) as Array<Record<string, unknown>>) : []

  const firstCommit = commits[0] as
    | {
        sha?: string
        commit?: { message?: string; author?: { date?: string; name?: string } }
      }
    | undefined
  const recentCommit = firstCommit
    ? {
        sha: String(firstCommit.sha ?? '').slice(0, 7),
        message: String(firstCommit.commit?.message ?? '').split('\n')[0] ?? '',
        date: String(firstCommit.commit?.author?.date ?? ''),
        author: String(firstCommit.commit?.author?.name ?? ''),
      }
    : null

  return { repo, pullRequests: prData, recentCommit }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    stars: raw.repo?.stargazers_count ?? 0,
    openIssues: raw.repo?.open_issues_count ?? 0,
    openPRs: raw.pullRequests?.total_count ?? 0,
    forks: raw.repo?.forks_count ?? 0,
    watchers: raw.repo?.watchers_count ?? 0,
    language: raw.repo?.language ?? null,
    lastPush: raw.repo?.pushed_at ?? '',
    lastCommit: raw.recentCommit ?? null,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = Bun.hash(config.apiKey + config.owner + config.repo)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.repo) return 'error'
  const lastPush = new Date(raw.repo.pushed_at).getTime()
  const daysSinceLastPush = (Date.now() - lastPush) / (1000 * 60 * 60 * 24)
  if (daysSinceLastPush > 30) return 'warn'
  return 'ok'
}
