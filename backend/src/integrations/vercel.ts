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

export interface DomainInfo {
  name: string
  projectId: string
  projectName: string
  configured: boolean
  verified: boolean
  sslReady: boolean
  misconfigured: boolean
}

export interface RawData {
  deployments: Array<{
    uid: string
    name: string
    state: string
    created: number
    buildingAt?: number
    ready?: number
    url: string | null
    target?: string | null
    errorCode?: string
    errorMessage?: string
    checksState?: string
    checksConclusion?: string
    source?: string
    meta?: { githubCommitMessage?: string }
  }>
  projects: Array<{ id: string; name: string }>
  domains: DomainInfo[]
}

export interface PanelData {
  projectCount: number
  recentDeploys: Array<{
    id: string
    project: string
    status: string
    created: string
    url: string | null
    commitMessage: string | null
    target: string | null
    buildDurationSec: number | null
    errorMessage: string | null
    checksStatus: string | null
    source: string | null
  }>
  lastDeployTime: string | null
  successRate: number
  domains: Array<{
    name: string
    project: string
    healthy: boolean
    sslReady: boolean
    misconfigured: boolean
  }>
  domainHealthy: boolean
  lastProductionDeploy: {
    id: string
    project: string
    status: string
    created: string
    url: string | null
    commitMessage: string | null
    buildDurationSec: number | null
    errorMessage: string | null
  } | null
  timeSinceLastDeploy: string | null
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
    ? ((await projectsRes.json()) as { projects?: Array<{ id: string; name: string }> })
    : { projects: [] as Array<{ id: string; name: string }> }

  const projects = projectsBody.projects ?? []

  // Fetch domains for each project (max 5 projects to avoid rate limits)
  const domainResults = await Promise.all(
    projects.slice(0, 5).map(async (project) => {
      try {
        const res = await fetch(`${base}/v9/projects/${project.id}/domains`, {
          headers,
          signal: AbortSignal.timeout(10_000),
        })
        if (!res.ok) return []
        const body = (await res.json()) as {
          domains?: Array<{
            name: string
            verified: boolean
            configured?: boolean
            misconfigured?: boolean
            certs?: Array<{ id: string }>
          }>
        }
        return (body.domains ?? []).map((d) => ({
          name: d.name,
          projectId: project.id,
          projectName: project.name,
          configured: d.configured ?? true,
          verified: d.verified,
          sslReady: (d.certs ?? []).length > 0,
          misconfigured: d.misconfigured ?? false,
        }))
      } catch {
        return []
      }
    }),
  )

  return {
    deployments: deploysBody.deployments ?? [],
    projects,
    domains: domainResults.flat(),
  }
}

export function parsePanel(raw: RawData): PanelData {
  const deploys = raw.deployments ?? []
  const successCount = deploys.filter((d) => d.state === 'READY').length
  const successRate = deploys.length > 0 ? Math.round((successCount / deploys.length) * 100) : 100

  const domains = (raw.domains ?? []).map((d) => ({
    name: d.name,
    project: d.projectName,
    healthy: d.configured && d.verified && !d.misconfigured,
    sslReady: d.sslReady,
    misconfigured: d.misconfigured,
  }))
  const domainHealthy = domains.length === 0 || domains.every((d) => d.healthy)

  // Find last production deploy
  const prodDeploy = deploys.find((d) => d.target === 'production') ?? null
  const lastProductionDeploy = prodDeploy
    ? {
        id: prodDeploy.uid,
        project: prodDeploy.name,
        status: prodDeploy.state,
        created: new Date(prodDeploy.created).toISOString(),
        url: prodDeploy.url ? `https://${prodDeploy.url}` : null,
        commitMessage: prodDeploy.meta?.githubCommitMessage ?? null,
        buildDurationSec:
          prodDeploy.buildingAt && prodDeploy.ready
            ? Math.round((prodDeploy.ready - prodDeploy.buildingAt) / 1000)
            : null,
        errorMessage: prodDeploy.errorMessage ?? null,
      }
    : null

  // Human-readable time since last deploy
  let timeSinceLastDeploy: string | null = null
  if (deploys.length > 0) {
    const diffMs = Date.now() - deploys[0]!.created
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 60) timeSinceLastDeploy = 'just now'
    else if (diffSec < 3600) timeSinceLastDeploy = `${Math.floor(diffSec / 60)}m ago`
    else if (diffSec < 86400) timeSinceLastDeploy = `${Math.floor(diffSec / 3600)}h ago`
    else timeSinceLastDeploy = `${Math.floor(diffSec / 86400)}d ago`
  }

  return {
    projectCount: raw.projects?.length ?? 0,
    recentDeploys: deploys.slice(0, 5).map((d) => ({
      id: d.uid,
      project: d.name,
      status: d.state,
      created: new Date(d.created).toISOString(),
      url: d.url ? `https://${d.url}` : null,
      commitMessage: d.meta?.githubCommitMessage ?? null,
      target: d.target ?? null,
      buildDurationSec:
        d.buildingAt && d.ready ? Math.round((d.ready - d.buildingAt) / 1000) : null,
      errorMessage: d.errorMessage ?? null,
      checksStatus: d.checksConclusion ?? d.checksState ?? null,
      source: d.source ?? null,
    })),
    lastDeployTime: deploys.length > 0 ? new Date(deploys[0]!.created).toISOString() : null,
    successRate,
    domains,
    domainHealthy,
    lastProductionDeploy,
    timeSinceLastDeploy,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  const deploys = raw.deployments ?? []
  if (deploys.length > 0) {
    const latest = deploys[0]
    if (latest?.state === 'ERROR') return 'error'
    if (latest?.state === 'BUILDING' || latest?.state === 'INITIALIZING') return 'warn'
  }

  // Domain misconfiguration → warn
  const misconfigured = (raw.domains ?? []).some((d) => d.misconfigured || !d.verified)
  if (misconfigured) return 'warn'

  return 'ok'
}
