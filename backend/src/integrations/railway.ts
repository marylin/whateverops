import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError, graphQLError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'railway' as const
export const INTEGRATION_NAME = 'Railway'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Railway token required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface ServiceInstance {
  serviceId: string
  serviceName: string
  projectName: string
  latestDeployStatus: string | null
  healthcheckPath: string | null
  numReplicas: number
  restartCount: number
  upSince: string | null
}

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
  serviceInstances: ServiceInstance[]
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
  services: Array<{
    name: string
    project: string
    latestDeployStatus: string | null
    healthcheckPath: string | null
    replicas: number
    restartCount: number
    upSince: string | null
    healthy: boolean
    restartLooping: boolean
  }>
  allServicesHealthy: boolean
  unhealthyServiceCount: number
  longestUptime: string | null
  deployInProgress: boolean
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
  if (!res.ok)
    throw new Error(
      apiError(res.status, {
        401: 'Token is invalid or expired — regenerate at railway.app → Account → Tokens',
        403: 'Token lacks permissions — regenerate at railway.app → Account → Tokens',
      }),
    )
  const body = (await res.json()) as { data?: Record<string, unknown>; errors?: unknown[] }
  if (body.errors) throw new Error(graphQLError(body.errors))
  return body.data
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  if (process.env.MOCK_PREVIEW === 'true') {
    const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString()
    return {
      projects: [
        {
          id: 'proj_1',
          name: 'Production',
          services: [
            { id: 'svc_1', name: 'api-server' },
            { id: 'svc_2', name: 'worker' },
            { id: 'svc_3', name: 'redis' },
          ],
          environments: [{ id: 'env_1', name: 'production' }],
        },
        {
          id: 'proj_2',
          name: 'Staging',
          services: [{ id: 'svc_4', name: 'api-server' }],
          environments: [{ id: 'env_2', name: 'staging' }],
        },
      ],
      deployments: [
        { id: 'dpl_1', status: 'SUCCESS', createdAt: d(0), serviceName: 'api-server' },
        { id: 'dpl_2', status: 'SUCCESS', createdAt: d(1), serviceName: 'worker' },
        { id: 'dpl_3', status: 'SUCCESS', createdAt: d(2), serviceName: 'redis' },
      ],
      serviceInstances: [
        {
          serviceId: 'svc_1',
          serviceName: 'api-server',
          projectName: 'Production',
          latestDeployStatus: 'SUCCESS',
          healthcheckPath: '/health',
          numReplicas: 2,
          restartCount: 0,
          upSince: d(14),
        },
        {
          serviceId: 'svc_2',
          serviceName: 'worker',
          projectName: 'Production',
          latestDeployStatus: 'SUCCESS',
          healthcheckPath: null,
          numReplicas: 1,
          restartCount: 0,
          upSince: d(14),
        },
        {
          serviceId: 'svc_3',
          serviceName: 'redis',
          projectName: 'Production',
          latestDeployStatus: 'SUCCESS',
          healthcheckPath: null,
          numReplicas: 1,
          restartCount: 0,
          upSince: d(30),
        },
        {
          serviceId: 'svc_4',
          serviceName: 'api-server',
          projectName: 'Staging',
          latestDeployStatus: 'SUCCESS',
          healthcheckPath: '/health',
          numReplicas: 1,
          restartCount: 0,
          upSince: d(7),
        },
      ],
    }
  }

  const data = (await gql(
    config.apiKey,
    `query {
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
    }`,
  )) as {
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

  const projects = (data?.projects?.edges ?? []).map((e) => ({
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

  // Fetch recent deployments per project
  const deployments: RawData['deployments'] = []
  for (const project of projects.slice(0, 5)) {
    const envId = project.environments[0]?.id
    if (!envId) continue
    for (const service of project.services) {
      try {
        const deplData = (await gql(
          config.apiKey,
          `query($input: DeploymentListInput!) {
            deployments(input: $input, first: 3) {
              edges { node { id status createdAt } }
            }
          }`,
          { input: { projectId: project.id, serviceId: service.id, environmentId: envId } },
        )) as {
          deployments?: {
            edges?: Array<{ node?: { id?: string; status?: string; createdAt?: string } }>
          }
        }
        for (const edge of deplData?.deployments?.edges ?? []) {
          deployments.push({
            id: edge.node?.id ?? '',
            status: edge.node?.status ?? '',
            createdAt: edge.node?.createdAt ?? '',
            serviceName: service.name,
          })
        }
      } catch {
        // skip if deployments query fails for a service
      }
    }
  }
  deployments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // Fetch service instance status per service
  const serviceInstances: ServiceInstance[] = []
  for (const project of projects.slice(0, 5)) {
    const envId = project.environments[0]?.id
    if (!envId) continue
    for (const service of project.services) {
      try {
        const instData = (await gql(
          config.apiKey,
          `query($envId: String!, $serviceId: String!) {
            serviceInstance(environmentId: $envId, serviceId: $serviceId) {
              latestDeployment { status createdAt }
              healthcheckPath
              numReplicas
              serviceName
              domains { serviceDomains { domain } }
            }
          }`,
          { envId, serviceId: service.id },
        )) as {
          serviceInstance?: {
            latestDeployment?: { status?: string; createdAt?: string }
            healthcheckPath?: string | null
            numReplicas?: number
            serviceName?: string
            domains?: { serviceDomains?: Array<{ domain: string }> }
          }
        }
        const inst = instData?.serviceInstance
        serviceInstances.push({
          serviceId: service.id,
          serviceName: inst?.serviceName ?? service.name,
          projectName: project.name,
          latestDeployStatus: inst?.latestDeployment?.status ?? null,
          healthcheckPath: inst?.healthcheckPath ?? null,
          numReplicas: inst?.numReplicas ?? 0,
          restartCount: 0,
          upSince: inst?.latestDeployment?.createdAt ?? null,
        })
      } catch {
        // If the serviceInstance query fails entirely, still push a stub so the
        // service name appears in the panel (with unknown status)
        serviceInstances.push({
          serviceId: service.id,
          serviceName: service.name,
          projectName: project.name,
          latestDeployStatus: null,
          healthcheckPath: null,
          numReplicas: 0,
          restartCount: 0,
          upSince: null,
        })
      }
    }
  }

  return { projects, deployments, serviceInstances }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = raw.projects ?? []
  const serviceCount = projects.reduce((sum, p) => sum + (p.services?.length ?? 0), 0)
  const deploys = raw.deployments ?? []

  const services = (raw.serviceInstances ?? []).map((si) => {
    // A service is healthy if latest deploy succeeded. numReplicas can be null
    // (Railway uses auto-scaling or defaults), so don't require > 0.
    const healthy = si.latestDeployStatus === 'SUCCESS' || si.latestDeployStatus === 'DEPLOYING'

    // Restart looping: restartCount > 3 AND upSince < 1 hour ago
    let restartLooping = false
    if (si.restartCount > 3 && si.upSince) {
      const upSinceMs = new Date(si.upSince).getTime()
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      restartLooping = upSinceMs > oneHourAgo
    }

    return {
      name: si.serviceName,
      project: si.projectName,
      latestDeployStatus: si.latestDeployStatus,
      healthcheckPath: si.healthcheckPath,
      replicas: si.numReplicas,
      restartCount: si.restartCount,
      upSince: si.upSince,
      healthy,
      restartLooping,
    }
  })

  const unhealthyServiceCount = services.filter((s) => !s.healthy).length

  // Longest uptime across all services
  let longestUptime: string | null = null
  const uptimes = services
    .filter((s) => s.upSince)
    .map((s) => Date.now() - new Date(s.upSince!).getTime())
    .filter((ms) => ms > 0)
  if (uptimes.length > 0) {
    const maxMs = Math.max(...uptimes)
    const days = Math.floor(maxMs / 86400000)
    const hours = Math.floor((maxMs % 86400000) / 3600000)
    if (days > 0) longestUptime = `${days}d ${hours}h`
    else if (hours > 0) longestUptime = `${hours}h`
    else longestUptime = `${Math.floor(maxMs / 60000)}m`
  }

  // Check if any deploy is in progress
  const deployInProgress = deploys.some(
    (d) => d.status === 'BUILDING' || d.status === 'DEPLOYING' || d.status === 'INITIALIZING',
  )

  return {
    projectCount: projects.length,
    serviceCount,
    recentDeploys: deploys.slice(0, 5),
    lastDeployTime: deploys.length > 0 ? deploys[0]!.createdAt : null,
    activeServices: serviceCount,
    services,
    allServicesHealthy: services.length === 0 || services.every((s) => s.healthy),
    unhealthyServiceCount,
    longestUptime,
    deployInProgress,
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

  // Check service instances for crashes or excessive restarts
  for (const si of raw.serviceInstances ?? []) {
    if (si.latestDeployStatus === 'FAILED' || si.latestDeployStatus === 'CRASHED') return 'error'
    if (si.restartCount >= 5) return 'warn'
  }

  return 'ok'
}
