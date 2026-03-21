import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError, graphQLError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'linear' as const
export const INTEGRATION_NAME = 'Linear'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Linear API key required'),
  teamId: z.string().optional(),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface LinearIssue {
  identifier: string
  title: string
  priority: number
  priorityLabel: string
  stateName: string
  labels: string[]
  projectName: string | null
  url: string
}

export interface LinearProject {
  name: string
  state: string
  progress: number
}

export interface RawData {
  teamName: string
  teamKey: string
  totalIssues: number
  openCount: number
  inProgressIssues: LinearIssue[]
  priorityBreakdown: Record<string, number>
  labelBreakdown: Record<string, number>
  projects: LinearProject[]
  // Cycle (optional — not all teams use sprints)
  activeCycleName: string | null
  activeCycleProgress: number | null
  cycleStartsAt: string | null
  cycleEndsAt: string | null
  completedThisCycle: number
  cycleTotalIssues: number
}

export interface PanelData {
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
  // Cycle
  cycleName: string | null
  cycleProgress: number | null
  daysLeftInCycle: number | null
  completedThisCycle: number
  cycleTotalIssues: number
}

async function gql(apiKey: string, query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok)
    throw new Error(
      apiError(res.status, {
        401: 'Authentication failed — check your LINEAR_API_KEY',
        404: 'Team not found — verify LINEAR_TEAM_ID in .env',
      }),
    )
  const body = (await res.json()) as { data?: Record<string, unknown>; errors?: unknown[] }
  if (body.errors) throw new Error(graphQLError(body.errors))
  return body.data
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  // Auto-detect team if not specified
  let teamId = config.teamId
  if (!teamId) {
    const teamsData = (await gql(config.apiKey, `{ teams { nodes { id name } } }`)) as {
      teams?: { nodes?: Array<{ id: string; name: string }> }
    }
    teamId = teamsData?.teams?.nodes?.[0]?.id
    if (!teamId) throw new Error('No teams found in your Linear workspace')
  }

  const tid = teamId

  // Query 1: Team info + cycle + in-progress issues with details
  const query = `
    query TeamStats($teamId: String!) {
      team(id: $teamId) {
        name
        key
        issueCount
        activeCycle {
          name
          progress
          startsAt
          endsAt
          issues { nodes { state { type } } }
        }
      }
      openIssues: issues(filter: { team: { id: { eq: "${tid}" } }, state: { type: { in: ["unstarted", "triage"] } } }) {
        nodes { id }
      }
      inProgress: issues(filter: { team: { id: { eq: "${tid}" } }, state: { type: { eq: "started" } } }, first: 10, orderBy: updatedAt) {
        nodes {
          identifier
          title
          priority
          priorityLabel
          state { name }
          labels { nodes { name } }
          project { name }
        }
      }
    }
  `

  // Query 2: Projects
  const projectsQuery = `{ projects(first: 15, orderBy: updatedAt) { nodes { name state progress } } }`

  const [teamData, projectsData] = await Promise.all([
    gql(config.apiKey, query, { teamId: tid }) as Promise<{
      team?: {
        name?: string
        key?: string
        issueCount?: number
        activeCycle?: {
          name?: string
          progress?: number
          startsAt?: string
          endsAt?: string
          issues?: { nodes?: Array<{ state?: { type?: string } }> }
        }
      }
      openIssues?: { nodes?: unknown[] }
      inProgress?: {
        nodes?: Array<{
          identifier?: string
          title?: string
          priority?: number
          priorityLabel?: string
          state?: { name?: string }
          labels?: { nodes?: Array<{ name?: string }> }
          project?: { name?: string }
        }>
      }
    }>,
    gql(config.apiKey, projectsQuery) as Promise<{
      projects?: {
        nodes?: Array<{ name?: string; state?: string; progress?: number }>
      }
    }>,
  ])

  // Parse in-progress issues
  const inProgressIssues: LinearIssue[] = (teamData?.inProgress?.nodes ?? []).map((n) => ({
    identifier: n.identifier ?? '',
    title: n.title ?? '',
    priority: n.priority ?? 4,
    priorityLabel: n.priorityLabel ?? 'No priority',
    stateName: n.state?.name ?? 'In Progress',
    labels: (n.labels?.nodes ?? []).map((l) => l.name ?? '').filter(Boolean),
    projectName: n.project?.name ?? null,
    url: `https://linear.app/${teamData?.team?.key?.toLowerCase() ?? 'team'}/issue/${n.identifier ?? ''}`,
  }))

  // Priority breakdown
  const priorityBreakdown: Record<string, number> = {}
  for (const issue of inProgressIssues) {
    const key = issue.priorityLabel
    priorityBreakdown[key] = (priorityBreakdown[key] ?? 0) + 1
  }

  // Label breakdown
  const labelBreakdown: Record<string, number> = {}
  for (const issue of inProgressIssues) {
    for (const label of issue.labels) {
      labelBreakdown[label] = (labelBreakdown[label] ?? 0) + 1
    }
  }

  // Projects
  const projects: LinearProject[] = (projectsData?.projects?.nodes ?? [])
    .filter((p) => p.state === 'started' || p.state === 'planned')
    .map((p) => ({
      name: p.name ?? '',
      state: p.state ?? '',
      progress: Math.round((p.progress ?? 0) * 100),
    }))

  // Cycle
  const cycleIssues = teamData?.team?.activeCycle?.issues?.nodes ?? []
  const completedThisCycle = cycleIssues.filter((i) => i.state?.type === 'completed').length

  return {
    teamName: teamData?.team?.name ?? 'Unknown',
    teamKey: teamData?.team?.key ?? '',
    totalIssues: teamData?.team?.issueCount ?? 0,
    openCount: teamData?.openIssues?.nodes?.length ?? 0,
    inProgressIssues,
    priorityBreakdown,
    labelBreakdown,
    projects,
    activeCycleName: teamData?.team?.activeCycle?.name ?? null,
    activeCycleProgress: teamData?.team?.activeCycle?.progress
      ? Math.round(teamData.team.activeCycle.progress * 100)
      : null,
    cycleStartsAt: teamData?.team?.activeCycle?.startsAt ?? null,
    cycleEndsAt: teamData?.team?.activeCycle?.endsAt ?? null,
    completedThisCycle,
    cycleTotalIssues: cycleIssues.length,
  }
}

export function parsePanel(raw: RawData): PanelData {
  const bugs = raw.inProgressIssues.filter((i) =>
    i.labels.some((l) => l.toLowerCase() === 'bug'),
  ).length
  const features = raw.inProgressIssues.filter((i) =>
    i.labels.some((l) => l.toLowerCase() === 'feature'),
  ).length

  let daysLeftInCycle: number | null = null
  if (raw.cycleEndsAt) {
    const endsAt = new Date(raw.cycleEndsAt).getTime()
    if (!isNaN(endsAt)) {
      daysLeftInCycle = Math.max(0, Math.ceil((endsAt - Date.now()) / 86_400_000))
    }
  }

  return {
    teamName: raw.teamName,
    teamKey: raw.teamKey,
    totalIssues: raw.totalIssues,
    openCount: raw.openCount,
    inProgressIssues: raw.inProgressIssues,
    inProgressCount: raw.inProgressIssues.length,
    priorityBreakdown: raw.priorityBreakdown,
    labelBreakdown: raw.labelBreakdown,
    projects: raw.projects,
    bugsInProgress: bugs,
    featuresInProgress: features,
    cycleName: raw.activeCycleName,
    cycleProgress: raw.activeCycleProgress,
    daysLeftInCycle,
    completedThisCycle: raw.completedThisCycle,
    cycleTotalIssues: raw.cycleTotalIssues,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + (config.teamId ?? 'auto'))
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.teamName || raw.teamName === 'Unknown') return 'error'
  if (raw.inProgressIssues.length > 10) return 'warn'
  return 'ok'
}
