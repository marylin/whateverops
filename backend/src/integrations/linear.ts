import { z } from 'zod'

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
  backlogCount: number
  teamName: string
  activeCycleName: string | null
  activeCycleProgress: number | null
}

export interface PanelData {
  openIssues: number
  inProgress: number
  completedThisCycle: number
  backlog: number
  teamName: string
  cycleName: string | null
  cycleProgress: number | null
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
  if (!res.ok) throw new Error(`Linear API error: ${res.status}`)
  const body = (await res.json()) as { data?: Record<string, unknown>; errors?: unknown[] }
  if (body.errors) throw new Error(`Linear GraphQL error: ${JSON.stringify(body.errors)}`)
  return body.data
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const query = `
    query TeamStats($teamId: String!) {
      team(id: $teamId) {
        name
        activeCycle {
          name
          progress
          issues { nodes { state { type } } }
        }
        issues(filter: { state: { type: { in: ["backlog"] } } }) { nodes { id } }
      }
      openIssues: issues(filter: { team: { id: { eq: $teamId } }, state: { type: { in: ["unstarted", "triage"] } } }) {
        nodes { id }
      }
      inProgress: issues(filter: { team: { id: { eq: $teamId } }, state: { type: { eq: "started" } } }) {
        nodes { id }
      }
    }
  `

  const data = (await gql(config.apiKey, query, { teamId: config.teamId })) as {
    team?: {
      name?: string
      activeCycle?: {
        name?: string
        progress?: number
        issues?: { nodes?: Array<{ state?: { type?: string } }> }
      }
      issues?: { nodes?: unknown[] }
    }
    openIssues?: { nodes?: unknown[] }
    inProgress?: { nodes?: unknown[] }
  }

  const cycleIssues = data?.team?.activeCycle?.issues?.nodes ?? []
  const completedThisCycle = cycleIssues.filter(
    (i: { state?: { type?: string } }) => i.state?.type === 'completed',
  ).length

  return {
    openIssues: data?.openIssues?.nodes?.length ?? 0,
    inProgressIssues: data?.inProgress?.nodes?.length ?? 0,
    completedThisCycle,
    backlogCount: data?.team?.issues?.nodes?.length ?? 0,
    teamName: data?.team?.name ?? 'Unknown',
    activeCycleName: data?.team?.activeCycle?.name ?? null,
    activeCycleProgress: data?.team?.activeCycle?.progress ?? null,
  }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    openIssues: raw.openIssues ?? 0,
    inProgress: raw.inProgressIssues ?? 0,
    completedThisCycle: raw.completedThisCycle ?? 0,
    backlog: raw.backlogCount ?? 0,
    teamName: raw.teamName ?? 'Unknown',
    cycleName: raw.activeCycleName ?? null,
    cycleProgress: raw.activeCycleProgress ?? null,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = Bun.hash(config.apiKey + config.teamId)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.openIssues === undefined && raw.inProgressIssues === undefined) return 'error'
  if (raw.inProgressIssues > 10) return 'warn'
  return 'ok'
}
