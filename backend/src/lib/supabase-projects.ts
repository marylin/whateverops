import { cacheGet, cacheSet } from '../cache/index.js'

export interface SupabaseProject {
  ref: string
  name: string
  status: string
  region: string
  dbVersion: string
  serviceKey: string | null
}

interface ApiProject {
  id: string
  ref: string
  name: string
  region: string
  status: string
  database?: { version?: string }
}

interface ApiKey {
  name: string
  api_key: string
}

const CACHE_KEY = 'supabase:projects-with-keys'
const CACHE_TTL = 300 // 5 minutes

async function sbFetch(url: string, token: string): Promise<Response> {
  return fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  })
}

async function fetchServiceKey(ref: string, token: string): Promise<string | null> {
  try {
    const res = await sbFetch(`https://api.supabase.com/v1/projects/${ref}/api-keys`, token)
    if (!res.ok) return null
    const keys = (await res.json()) as ApiKey[]
    return keys.find((k) => k.name === 'service_role')?.api_key ?? null
  } catch {
    return null
  }
}

export async function fetchProjectsWithKeys(managementKey: string): Promise<SupabaseProject[]> {
  const cached = await cacheGet<SupabaseProject[]>(CACHE_KEY)
  if (cached) return cached

  const res = await sbFetch('https://api.supabase.com/v1/projects', managementKey)
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Authentication failed — check SUPABASE_ACCESS_TOKEN'
        : `Supabase API error: ${res.status}`,
    )
  }

  const apiProjects = (await res.json()) as ApiProject[]

  const excludeRefs = new Set(
    (process.env.SUPABASE_EXCLUDE_PROJECTS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  )

  const projects: SupabaseProject[] = await Promise.all(
    apiProjects
      .filter((p) => !excludeRefs.has(p.ref))
      .map(async (p) => {
        const isActive = p.status === 'ACTIVE_HEALTHY' || p.status === 'ACTIVE_UNHEALTHY'
        const serviceKey = isActive ? await fetchServiceKey(p.ref, managementKey) : null

        return {
          ref: p.ref,
          name: p.name,
          status: p.status,
          region: p.region,
          dbVersion: p.database?.version ?? 'unknown',
          serviceKey,
        }
      }),
  )

  await cacheSet(CACHE_KEY, projects, CACHE_TTL)
  return projects
}
