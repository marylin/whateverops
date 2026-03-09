import type { CacheBackend } from './index.js'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export class MemoryCache implements CacheBackend {
  private store = new Map<string, CacheEntry<unknown>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  async size(): Promise<number> {
    return this.store.size
  }
}
