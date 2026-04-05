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
