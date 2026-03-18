import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'vercel' as const
export const INTEGRATION_NAME = 'Vercel'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Vercel token required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  deployments: Array<{
    uid: string
    name: string
    state: string
    created: number
    url: string | null
    meta?: { githubCommitMessage?: string }
  }>
  projects: Array<{ id: string; name: string }>
}

export interface PanelData {
  projectCount: number
  recentDeploys: Array<{
    display: string
    url: string | null
  }>
  lastDeployTime: string | null
  successRate: number
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const headers = { Authorization: `Bearer ${config.apiKey}` }
  const base = 'https://api.vercel.com'

  const [deploysRes, projectsRes] = await Promise.all([
    fetch(`${base}/v6/deployments?limit=10`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${base}/v9/projects?limit=100`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ])

  if (!deploysRes.ok)
    throw new Error(
      apiError(deploysRes.status, {
        401: 'Token is invalid or expired — regenerate at vercel.com → Settings → Tokens',
        403: 'Token lacks deployment access — check token scope at vercel.com',
      }),
    )

  const deploysBody = (await deploysRes.json()) as { deployments?: RawData['deployments'] }
  const projectsBody = projectsRes.ok
    ? ((await projectsRes.json()) as { projects?: RawData['projects'] })
    : { projects: [] }

  return {
    deployments: deploysBody.deployments ?? [],
    projects: projectsBody.projects ?? [],
  }
}

function deployAgo(createdMs: number): string {
  const seconds = Math.floor((Date.now() - createdMs) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function parsePanel(raw: RawData): PanelData {
  const deploys = raw.deployments ?? []
  const successCount = deploys.filter((d) => d.state === 'READY').length
  const successRate = deploys.length > 0 ? Math.round((successCount / deploys.length) * 100) : 100

  return {
    projectCount: raw.projects?.length ?? 0,
    recentDeploys: deploys.slice(0, 5).map((d) => ({
      display: `${d.name} (${d.state}) · ${deployAgo(d.created)}`,
      url: d.url ? `https://${d.url}` : null,
    })),
    lastDeployTime: deploys.length > 0 ? new Date(deploys[0]!.created).toISOString() : null,
    successRate,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  const deploys = raw.deployments ?? []
  if (deploys.length === 0) return 'ok'
  const latest = deploys[0]
  if (latest?.state === 'ERROR') return 'error'
  if (latest?.state === 'BUILDING' || latest?.state === 'INITIALIZING') return 'warn'
  return 'ok'
}
