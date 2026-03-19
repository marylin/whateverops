import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError, graphQLError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'linear' as const
export const INTEGRATION_NAME = 'Linear'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Linear API key required'),
  teamId: z.string().min(1),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  openIssues: number
  inProgressIssues: number
  completedThisCycle: number
  cycleTotalIssues: number
  backlogCount: number
  teamName: string
  activeCycleName: string | null
  activeCycleProgress: number | null
  cycleStartsAt: string | null
  cycleEndsAt: string | null
  topPriorityIssueTitle: string | null
  overdueCount: number
  blockedCount: number
}

export interface PanelData {
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
  const today = new Date().toISOString().slice(0, 10)
  const query = `
    query TeamStats($teamId: String!, $today: TimelessDate!) {
      team(id: $teamId) {
        name
        activeCycle {
          name
          progress
          startsAt
          endsAt
          issues { nodes { state { type } } }
        }
        issues(filter: { state: { type: { in: ["backlog"] } } }) { nodes { id } }
      }
      openIssues: issues(filter: { team: { id: { eq: $teamId } }, state: { type: { in: ["unstarted", "triage"] } } }) {
        nodes { id }
      }
      inProgress: issues(filter: { team: { id: { eq: $teamId } }, state: { type: { eq: "started" } } }) {
        nodes { id priority title }
      }
      overdueIssues: issues(filter: { team: { id: { eq: $teamId } }, dueDate: { lt: $today }, state: { type: { nin: ["completed", "canceled"] } } }) {
        nodes { id }
      }
      blockedIssues: issues(filter: { team: { id: { eq: $teamId } }, state: { name: { containsIgnoreCase: "blocked" } } }) {
        nodes { id }
      }
      topPriority: issues(filter: { team: { id: { eq: $teamId } }, state: { type: { in: ["started", "unstarted"] } }, priority: { gte: 1 } }, first: 1, orderBy: priority) {
        nodes { title priority }
      }
    }
  `

  const data = (await gql(config.apiKey, query, { teamId: config.teamId, today })) as {
    team?: {
      name?: string
      activeCycle?: {
        name?: string
        progress?: number
        startsAt?: string
        endsAt?: string
        issues?: { nodes?: Array<{ state?: { type?: string } }> }
      }
      issues?: { nodes?: unknown[] }
    }
    openIssues?: { nodes?: unknown[] }
    inProgress?: { nodes?: Array<{ id?: string; priority?: number; title?: string }> }
    overdueIssues?: { nodes?: unknown[] }
    blockedIssues?: { nodes?: unknown[] }
    topPriority?: { nodes?: Array<{ title?: string; priority?: number }> }
  }

  const cycleIssues = data?.team?.activeCycle?.issues?.nodes ?? []
  const completedThisCycle = cycleIssues.filter(
    (i: { state?: { type?: string } }) => i.state?.type === 'completed',
  ).length

  const topPriorityNode = data?.topPriority?.nodes?.[0]

  return {
    openIssues: data?.openIssues?.nodes?.length ?? 0,
    inProgressIssues: data?.inProgress?.nodes?.length ?? 0,
    completedThisCycle,
    cycleTotalIssues: cycleIssues.length,
    backlogCount: data?.team?.issues?.nodes?.length ?? 0,
    teamName: data?.team?.name ?? 'Unknown',
    activeCycleName: data?.team?.activeCycle?.name ?? null,
    activeCycleProgress: data?.team?.activeCycle?.progress ?? null,
    cycleStartsAt: data?.team?.activeCycle?.startsAt ?? null,
    cycleEndsAt: data?.team?.activeCycle?.endsAt ?? null,
    topPriorityIssueTitle: topPriorityNode?.title ?? null,
    overdueCount: data?.overdueIssues?.nodes?.length ?? 0,
    blockedCount: data?.blockedIssues?.nodes?.length ?? 0,
  }
}

export function parsePanel(raw: RawData): PanelData {
  // Compute daysLeftInCycle
  let daysLeftInCycle: number | null = null
  if (raw.cycleEndsAt) {
    const endsAt = new Date(raw.cycleEndsAt).getTime()
    const now = Date.now()
    if (!isNaN(endsAt)) {
      daysLeftInCycle = Math.max(0, Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24)))
    }
  }

  // Compute cycleOnTrack based on progress vs time elapsed
  let cycleOnTrack: 'ahead' | 'behind' | 'on-track' | null = null
  if (raw.cycleStartsAt && raw.cycleEndsAt && raw.activeCycleProgress != null) {
    const startsAt = new Date(raw.cycleStartsAt).getTime()
    const endsAt = new Date(raw.cycleEndsAt).getTime()
    const now = Date.now()
    const totalDuration = endsAt - startsAt
    if (totalDuration > 0 && !isNaN(startsAt) && !isNaN(endsAt)) {
      const elapsed = Math.max(0, now - startsAt)
      const timeElapsedPct = Math.min(1, elapsed / totalDuration)
      const progressPct = raw.activeCycleProgress / 100
      const diff = progressPct - timeElapsedPct
      if (diff > 0.05) cycleOnTrack = 'ahead'
      else if (diff < -0.05) cycleOnTrack = 'behind'
      else cycleOnTrack = 'on-track'
    }
  }

  return {
    openIssues: raw.openIssues ?? 0,
    inProgress: raw.inProgressIssues ?? 0,
    completedThisCycle: raw.completedThisCycle ?? 0,
    cycleTotalIssues: raw.cycleTotalIssues ?? 0,
    backlog: raw.backlogCount ?? 0,
    teamName: raw.teamName ?? 'Unknown',
    cycleName: raw.activeCycleName ?? null,
    cycleProgress: raw.activeCycleProgress ?? null,
    cycleStartsAt: raw.cycleStartsAt ?? null,
    cycleEndsAt: raw.cycleEndsAt ?? null,
    topPriorityIssue: raw.topPriorityIssueTitle ?? null,
    overdueCount: raw.overdueCount ?? 0,
    blockedCount: raw.blockedCount ?? 0,
    daysLeftInCycle,
    cycleOnTrack,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.teamId)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.openIssues == null && raw.inProgressIssues == null) return 'error'
  if (raw.inProgressIssues > 10) return 'warn'
  return 'ok'
}
