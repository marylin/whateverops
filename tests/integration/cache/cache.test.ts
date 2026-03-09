import { describe, test, expect, beforeEach } from 'bun:test'
import { MemoryCache } from '../../../backend/src/cache/memory'

describe('Cache integration', () => {
  let cache: MemoryCache

  beforeEach(() => {
    cache = new MemoryCache()
  })

  test('cache hit: returns stored value within TTL', async () => {
    await cache.set('test:key', { value: 42 }, 60)
    const result = await cache.get<{ value: number }>('test:key')
    expect(result).toEqual({ value: 42 })
  })

  test('cache miss: returns null for unknown key', async () => {
    const result = await cache.get('test:unknown')
    expect(result).toBeNull()
  })

  test('TTL expiry: returns null after TTL elapses', async () => {
    await cache.set('test:expire', { value: 'temp' }, 0.01) // 10ms TTL
    // Wait for expiry
    await new Promise((r) => setTimeout(r, 50))
    const result = await cache.get('test:expire')
    expect(result).toBeNull()
  })

  test('overwrite: updating a key replaces the value', async () => {
    await cache.set('test:overwrite', { v: 1 }, 60)
    await cache.set('test:overwrite', { v: 2 }, 60)
    const result = await cache.get<{ v: number }>('test:overwrite')
    expect(result).toEqual({ v: 2 })
  })

  test('clear: removes all entries', async () => {
    await cache.set('test:a', 1, 60)
    await cache.set('test:b', 2, 60)
    expect(await cache.size()).toBe(2)
    await cache.clear()
    expect(await cache.size()).toBe(0)
    expect(await cache.get('test:a')).toBeNull()
  })

  test('size: tracks number of entries', async () => {
    expect(await cache.size()).toBe(0)
    await cache.set('test:1', 'a', 60)
    expect(await cache.size()).toBe(1)
    await cache.set('test:2', 'b', 60)
    expect(await cache.size()).toBe(2)
  })

  test('different types: stores various data shapes', async () => {
    await cache.set('test:string', 'hello', 60)
    await cache.set('test:number', 42, 60)
    await cache.set('test:array', [1, 2, 3], 60)
    await cache.set('test:nested', { a: { b: { c: true } } }, 60)

    expect(await cache.get('test:string')).toBe('hello')
    expect(await cache.get('test:number')).toBe(42)
    expect(await cache.get('test:array')).toEqual([1, 2, 3])
    expect(await cache.get('test:nested')).toEqual({ a: { b: { c: true } } })
  })

  test('fallback behavior: memory cache works without Redis', async () => {
    // This test verifies the memory backend works standalone
    // Redis fallback is tested by RedisCache automatically when Redis is unavailable
    const backend = new MemoryCache()
    await backend.set('fallback:key', 'value', 60)
    expect(await backend.get('fallback:key')).toBe('value')
  })
})
