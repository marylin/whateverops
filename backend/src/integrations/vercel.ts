import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'vercel' as const
export const INTEGRATION_NAME = 'Vercel'
export const DEFAULT_TTL = 60
export const FETCH_TIMEOUT_MS = 20_000 // per-project deploy + domain fetches

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

interface RawDeployment {
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
}

export interface RawData {
  deployments: RawDeployment[]
  projects: Array<{
    id: string
    name: string
    framework?: string | null
    latestUrl?: string | null
  }>
  /** Latest production deployment per project — keyed by project id */
  projectDeployments: Record<string, RawDeployment | null>
  domains: DomainInfo[]
}

export interface PanelData {
  projectCount: number
  /** Per-project summary with latest production deploy */
  projects: Array<{
    id: string
    name: string
    framework: string | null
    url: string | null
    latestDeploy: {
      status: string
      created: string
      commitMessage: string | null
      buildDurationSec: number | null
      errorMessage: string | null
    } | null
  }>
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

  const deploysBody = (await deploysRes.json()) as { deployments?: RawDeployment[] }
  type ProjectsApiProject = {
    id: string
    name: string
    framework?: string | null
    latestDeployments?: Array<{ url?: string }>
  }
  const projectsBody = projectsRes.ok
    ? ((await projectsRes.json()) as { projects?: ProjectsApiProject[] })
    : { projects: [] as ProjectsApiProject[] }

  const projects = (projectsBody.projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework ?? null,
    latestUrl: p.latestDeployments?.[0]?.url ? `https://${p.latestDeployments[0].url}` : null,
  }))

  // Fetch per-project latest production deploy + domains in parallel
  const [projectDeployResults, domainResults] = await Promise.all([
    // Latest production deploy per project
    Promise.all(
      projects.map(async (project) => {
        try {
          const res = await fetch(
            `${base}/v6/deployments?projectId=${project.id}&limit=1&target=production`,
            { headers, signal: AbortSignal.timeout(10_000) },
          )
          if (!res.ok) return { id: project.id, deploy: null }
          const body = (await res.json()) as { deployments?: RawDeployment[] }
          const deploy = body.deployments?.[0] ?? null
          return { id: project.id, deploy }
        } catch {
          return { id: project.id, deploy: null }
        }
      }),
    ),
    // Domains for first 5 projects
    Promise.all(
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
    ),
  ])

  const projectDeployments: Record<string, RawDeployment | null> = {}
  for (const { id, deploy } of projectDeployResults) {
    projectDeployments[id] = deploy
  }

  return {
    deployments: deploysBody.deployments ?? [],
    projects,
    projectDeployments,
    domains: domainResults.flat(),
  }
}

function buildDuration(d: RawDeployment): number | null {
  return d.buildingAt && d.ready ? Math.round((d.ready - d.buildingAt) / 1000) : null
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

  // Build per-project summaries using the dedicated per-project deploy fetches
  const projects = (raw.projects ?? []).map((p) => {
    const d = raw.projectDeployments?.[p.id] ?? null
    return {
      id: p.id,
      name: p.name,
      framework: p.framework ?? null,
      url: p.latestUrl ?? null,
      latestDeploy: d
        ? {
            status: d.state,
            created: new Date(d.created).toISOString(),
            commitMessage: d.meta?.githubCommitMessage ?? null,
            buildDurationSec: buildDuration(d),
            errorMessage: d.errorMessage ?? null,
          }
        : null,
    }
  })

  // Find last production deploy across all projects (most recent by created timestamp)
  const allProdDeploys = Object.values(raw.projectDeployments ?? {}).filter(
    (d): d is RawDeployment => d !== null,
  )
  const latestProdDeploy =
    allProdDeploys.length > 0
      ? allProdDeploys.reduce((best, d) => (d.created > best.created ? d : best))
      : (deploys.find((d) => d.target === 'production') ?? null)

  const lastProductionDeploy = latestProdDeploy
    ? {
        id: latestProdDeploy.uid,
        project: latestProdDeploy.name,
        status: latestProdDeploy.state,
        created: new Date(latestProdDeploy.created).toISOString(),
        url: latestProdDeploy.url ? `https://${latestProdDeploy.url}` : null,
        commitMessage: latestProdDeploy.meta?.githubCommitMessage ?? null,
        buildDurationSec: buildDuration(latestProdDeploy),
        errorMessage: latestProdDeploy.errorMessage ?? null,
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
    projects,
    recentDeploys: deploys.slice(0, 5).map((d) => ({
      id: d.uid,
      project: d.name,
      status: d.state,
      created: new Date(d.created).toISOString(),
      url: d.url ? `https://${d.url}` : null,
      commitMessage: d.meta?.githubCommitMessage ?? null,
      target: d.target ?? null,
      buildDurationSec: buildDuration(d),
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
  // Any project with a failed production deploy → error
  const projectDeploys = Object.values(raw.projectDeployments ?? {})
  if (projectDeploys.some((d) => d?.state === 'ERROR')) return 'error'
  if (projectDeploys.some((d) => d?.state === 'BUILDING' || d?.state === 'INITIALIZING'))
    return 'warn'

  // Fall back to global recent deploys list
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
