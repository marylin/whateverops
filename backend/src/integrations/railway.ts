import { z } from 'zod'
import { quickHash } from '../lib/hash.js'

export const INTEGRATION_ID = 'railway' as const
export const INTEGRATION_NAME = 'Railway'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Railway token required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  projects: Array<{
    id: string
    name: string
    services: Array<{
      id: string
      name: string
    }>
    environments: Array<{
      id: string
      name: string
    }>
  }>
  deployments: Array<{
    id: string
    status: string
    createdAt: string
    serviceName: string
  }>
}

export interface PanelData {
  projectCount: number
  serviceCount: number
  recentDeploys: Array<{
    id: string
    status: string
    createdAt: string
    serviceName: string
  }>
  lastDeployTime: string | null
  activeServices: number
}

async function gql(apiKey: string, query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`Railway API error: ${res.status}`)
  const body = (await res.json()) as { data?: Record<string, unknown>; errors?: unknown[] }
  if (body.errors) throw new Error(`Railway GraphQL error: ${JSON.stringify(body.errors)}`)
  return body.data
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const data = (await gql(
    config.apiKey,
    `query {
      me {
        projects {
          edges {
            node {
              id
              name
              services { edges { node { id name } } }
              environments { edges { node { id name } } }
            }
          }
        }
      }
    }`,
  )) as {
    me?: {
      projects?: {
        edges?: Array<{
          node?: {
            id?: string
            name?: string
            services?: { edges?: Array<{ node?: { id?: string; name?: string } }> }
            environments?: { edges?: Array<{ node?: { id?: string; name?: string } }> }
          }
        }>
      }
    }
  }

  const projects = (data?.me?.projects?.edges ?? []).map((e) => ({
    id: e.node?.id ?? '',
    name: e.node?.name ?? '',
    services: (e.node?.services?.edges ?? []).map((s) => ({
      id: s.node?.id ?? '',
      name: s.node?.name ?? '',
    })),
    environments: (e.node?.environments?.edges ?? []).map((env) => ({
      id: env.node?.id ?? '',
      name: env.node?.name ?? '',
    })),
  }))

  return { projects, deployments: [] }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = raw.projects ?? []
  const serviceCount = projects.reduce((sum, p) => sum + (p.services?.length ?? 0), 0)
  const deploys = raw.deployments ?? []

  return {
    projectCount: projects.length,
    serviceCount,
    recentDeploys: deploys.slice(0, 5),
    lastDeployTime: deploys.length > 0 ? deploys[0]!.createdAt : null,
    activeServices: serviceCount,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.projects || raw.projects.length === 0) return 'warn'
  const latestDeploy = raw.deployments?.[0]
  if (latestDeploy?.status === 'FAILED' || latestDeploy?.status === 'CRASHED') return 'error'
  return 'ok'
}
