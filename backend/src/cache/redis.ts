import { Redis } from '@upstash/redis'
import type { CacheBackend } from './index.js'
import { MemoryCache } from './memory.js'
import { logger } from '../lib/logger.js'

const KEY_PREFIX = 'wops:'

export class RedisCache implements CacheBackend {
  private redis: Redis
  private fallback = new MemoryCache()

  constructor(url: string, token: string) {
    this.redis = new Redis({ url, token })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<T>(KEY_PREFIX + key)
      return value ?? null
    } catch (err) {
      logger.error({ err, op: 'GET' }, 'Redis cache operation failed, falling back to memory')
      return this.fallback.get<T>(key)
    }
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(KEY_PREFIX + key, JSON.stringify(data), { ex: ttlSeconds })
    } catch (err) {
      logger.error({ err, op: 'SET' }, 'Redis cache operation failed, falling back to memory')
      await this.fallback.set(key, data, ttlSeconds)
    }
  }

  private async scanAll(): Promise<string[]> {
    const allKeys: string[] = []
    let cursor = '0'
    let done = false
    while (!done) {
      const result: [string, string[]] = await this.redis.scan(cursor, {
        match: KEY_PREFIX + '*',
        count: 100,
      })
      cursor = result[0]
      allKeys.push(...result[1])
      if (cursor === '0') done = true
    }
    return allKeys
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.scanAll()
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (err) {
      logger.error({ err, op: 'CLEAR' }, 'Redis cache operation failed')
    }
  }

  async size(): Promise<number> {
    try {
      const keys = await this.scanAll()
      return keys.length
    } catch (err) {
      logger.error({ err, op: 'SIZE' }, 'Redis cache operation failed')
      return 0
    }
  }
}
