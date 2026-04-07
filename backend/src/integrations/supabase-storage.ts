// backend/src/integrations/supabase-storage.ts
import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { fetchProjectsWithKeys, type SupabaseProject } from '../lib/supabase-projects.js'

export const INTEGRATION_ID = 'supabase-storage' as const
export const INTEGRATION_NAME = 'Supabase Storage'
export const DEFAULT_TTL = 120
export const FETCH_TIMEOUT_MS = 30_000

export const CONFIG_SCHEMA = z.object({
  managementKey: z.string().min(1, 'Supabase access token required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

interface BucketRaw {
  id: string
  name: string
  public: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
  created_at: string
}

interface ProjectStorageRaw {
  project: SupabaseProject
  buckets: BucketRaw[]
  projectStatus: 'active' | 'inactive'
}

export interface RawData {
  projects: ProjectStorageRaw[]
}

interface BucketPanel {
  name: string
  public: boolean
  fileSizeLimit: number | null
  allowedMimeTypes: string[] | null
}

interface ProjectStoragePanel {
  name: string
  ref: string
  projectStatus: 'active' | 'inactive'
  buckets: BucketPanel[]
  bucketCount: number
}

export interface PanelData {
  projects: ProjectStoragePanel[]
  summary: {
    totalBuckets: number
    publicBuckets: number
    privateBuckets: number
    activeProjectCount: number
  }
}

async function fetchStorageForProject(project: SupabaseProject): Promise<ProjectStorageRaw> {
  if (!project.serviceKey) {
    return { project, buckets: [], projectStatus: 'inactive' }
  }

  const baseUrl = `https://${project.ref}.supabase.co`
  const headers = {
    Authorization: `Bearer ${project.serviceKey}`,
    apikey: project.serviceKey,
  }

  let res: Response
  try {
    res = await fetch(`${baseUrl}/storage/v1/bucket`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    return { project, buckets: [], projectStatus: 'inactive' }
  }

  if (!res.ok) {
    if (res.status === 521) {
      return { project, buckets: [], projectStatus: 'inactive' }
    }
    return { project, buckets: [], projectStatus: 'active' }
  }

  const buckets = (await res.json()) as BucketRaw[]
  return { project, buckets: Array.isArray(buckets) ? buckets : [], projectStatus: 'active' }
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  if (process.env.MOCK_PREVIEW === 'true') {
    const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString()
    const prodProject: SupabaseProject = {
      ref: 'ref_prod',
      name: 'prod-app',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      dbVersion: '15.1.1.131',
      serviceKey: 'mock-service-key-prod',
    }
    const stgProject: SupabaseProject = {
      ref: 'ref_stg',
      name: 'staging-app',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      dbVersion: '15.1.1.131',
      serviceKey: 'mock-service-key-stg',
    }
    const devProject: SupabaseProject = {
      ref: 'ref_dev',
      name: 'dev-sandbox',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      dbVersion: '15.1.1.131',
      serviceKey: 'mock-service-key-dev',
    }
    return {
      projects: [
        {
          project: prodProject,
          buckets: [
            {
              id: 'bkt_1',
              name: 'avatars',
              public: true,
              file_size_limit: 2097152,
              allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp'],
              created_at: d(60),
            },
            {
              id: 'bkt_2',
              name: 'documents',
              public: false,
              file_size_limit: 10485760,
              allowed_mime_types: null,
              created_at: d(45),
            },
            {
              id: 'bkt_3',
              name: 'exports',
              public: false,
              file_size_limit: null,
              allowed_mime_types: null,
              created_at: d(14),
            },
          ],
          projectStatus: 'active',
        },
        {
          project: stgProject,
          buckets: [
            {
              id: 'bkt_4',
              name: 'test-uploads',
              public: true,
              file_size_limit: null,
              allowed_mime_types: null,
              created_at: d(30),
            },
          ],
          projectStatus: 'active',
        },
        {
          project: devProject,
          buckets: [],
          projectStatus: 'active',
        },
      ],
    }
  }

  const allProjects = await fetchProjectsWithKeys(config.managementKey)
  const results = await Promise.all(allProjects.map(fetchStorageForProject))
  return { projects: results }
}

export function parsePanel(raw: RawData): PanelData {
  const projects = (raw.projects ?? []).map((pd) => {
    const buckets = (pd.buckets ?? []).map((b) => ({
      name: b.name,
      public: b.public,
      fileSizeLimit: b.file_size_limit,
      allowedMimeTypes: b.allowed_mime_types,
    }))

    return {
      name: pd.project.name,
      ref: pd.project.ref,
      projectStatus: pd.projectStatus,
      buckets,
      bucketCount: buckets.length,
    } as ProjectStoragePanel
  })

  const active = projects.filter((p) => p.projectStatus === 'active')
  const allBuckets = active.flatMap((p) => p.buckets)

  return {
    projects,
    summary: {
      totalBuckets: allBuckets.length,
      publicBuckets: allBuckets.filter((b) => b.public).length,
      privateBuckets: allBuckets.filter((b) => !b.public).length,
      activeProjectCount: active.length,
    },
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.managementKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  const projects = raw.projects ?? []
  if (projects.length === 0) return 'error'
  if (projects.every((p) => p.projectStatus === 'inactive')) return 'warn'
  return 'ok'
}
