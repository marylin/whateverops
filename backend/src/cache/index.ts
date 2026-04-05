import { MemoryCache } from './memory.js'
import { RedisCache } from './redis.js'
import { logger } from '../lib/logger.js'

export interface CacheBackend {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, data: T, ttlSeconds: number): Promise<void>
  clear(): Promise<void>
  size(): Promise<number>
}

let backend: CacheBackend | null = null

function getBackend(): CacheBackend {
  if (backend) return backend

  const cacheType = process.env.CACHE_BACKEND ?? 'memory'
  if (cacheType === 'redis') {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    if (!url || !token) {
      logger.warn(
        'CACHE_BACKEND=redis but missing UPSTASH_REDIS_REST_URL/TOKEN — falling back to memory',
      )
      backend = new MemoryCache()
    } else {
      backend = new RedisCache(url, token)
    }
  } else {
    backend = new MemoryCache()
  }

  return backend
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  return getBackend().get<T>(key)
}

export async function cacheSet<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  return getBackend().set(key, data, ttlSeconds)
}

export async function cacheClear(): Promise<void> {
  return getBackend().clear()
}

export async function cacheSize(): Promise<number> {
  return getBackend().size()
}

/** Reset the backend instance (for testing) */
export function resetCacheBackend(): void {
  backend = null
}
