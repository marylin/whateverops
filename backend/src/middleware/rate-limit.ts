import type { Context, MiddlewareHandler, Next } from 'hono'

interface RateLimitOptions {
  /** Maximum requests allowed within the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

interface WindowEntry {
  timestamps: number[]
}

// One store per rate-limit rule (keyed by route prefix).
// Outer key: IP address. Inner value: sliding-window timestamps.
const stores = new Map<string, Map<string, WindowEntry>>()
const storeWindows = new Map<string, number>()

function getStore(id: string): Map<string, WindowEntry> {
  let store = stores.get(id)
  if (!store) {
    store = new Map()
    stores.set(id, store)
  }
  return store
}

function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? 'unknown'
  )
}

/**
 * Sliding-window in-memory rate limiter for Hono.
 *
 * @param storeId  Unique identifier for this rule's store (e.g. 'dashboard').
 * @param options  limit + windowMs
 */
export function rateLimit(storeId: string, options: RateLimitOptions): MiddlewareHandler {
  const { limit, windowMs } = options
  const store = getStore(storeId)
  storeWindows.set(storeId, windowMs)

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c)
    const now = Date.now()
    const windowStart = now - windowMs

    // Retrieve or create window entry for this IP
    let entry = store.get(ip)
    if (!entry) {
      entry = { timestamps: [] }
      store.set(ip, entry)
    }

    // Evict timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart)

    if (entry.timestamps.length >= limit) {
      const retryAfter = Math.ceil(windowMs / 1000)
      c.res = c.newResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((windowStart + windowMs) / 1000)),
          },
        },
      )
      return
    }

    // Record this request
    entry.timestamps.push(now)

    // Expose rate-limit headers on successful responses too
    c.header('X-RateLimit-Limit', String(limit))
    c.header('X-RateLimit-Remaining', String(limit - entry.timestamps.length))
    c.header('X-RateLimit-Reset', String(Math.ceil((windowStart + windowMs) / 1000)))

    await next()
  }
}

const CLEANUP_INTERVAL_MS = 60_000

setInterval(() => {
  const now = Date.now()
  for (const [storeId, store] of stores) {
    const windowMs = storeWindows.get(storeId) ?? CLEANUP_INTERVAL_MS
    for (const [ip, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs)
      if (entry.timestamps.length === 0) store.delete(ip)
    }
  }
}, CLEANUP_INTERVAL_MS).unref()
