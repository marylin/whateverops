import { describe, it, expect } from 'bun:test'
import { rateLimit } from '../../../backend/src/middleware/rate-limit'

// ─── Minimal Hono Context mock ────────────────────────────────────────────────

interface MockHeaders {
  [key: string]: string | undefined
}

function makeContext(ip: string, extraHeaders: MockHeaders = {}) {
  const reqHeaders: MockHeaders = {
    'x-forwarded-for': ip,
    ...extraHeaders,
  }

  // Collect headers set via c.header()
  const responseHeaders: Record<string, string> = {}

  const ctx = {
    req: {
      header: (name: string) => reqHeaders[name.toLowerCase()],
    },
    // c.res is assigned directly when rate-limited
    res: undefined as Response | undefined,
    // Records response headers set on pass-through
    _responseHeaders: responseHeaders,
    newResponse: (body: string, init: ResponseInit) => new Response(body, init),
    header: (name: string, value: string) => {
      responseHeaders[name] = value
    },
  }

  return ctx
}

// next() stub that resolves immediately
const next = () => Promise.resolve()

// ─── Unique storeId generator (isolates module-level stores map per test) ────

let storeCounter = 0
function uniqueStore() {
  return `test-store-${++storeCounter}`
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('rateLimit middleware', () => {
  describe('allows requests within the limit', () => {
    it('does not set c.res for requests under the limit', async () => {
      const store = uniqueStore()
      const middleware = rateLimit(store, { limit: 5, windowMs: 60_000 })
      const ctx = makeContext('1.2.3.4')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx as any, next)

      expect(ctx.res).toBeUndefined()
    })

    it('allows exactly `limit` requests before blocking', async () => {
      const store = uniqueStore()
      const middleware = rateLimit(store, { limit: 3, windowMs: 60_000 })

      for (let i = 0; i < 3; i++) {
        const ctx = makeContext('10.0.0.1')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await middleware(ctx as any, next)
        expect(ctx.res).toBeUndefined()
      }
    })
  })

  describe('returns 429 when limit is exceeded', () => {
    it('sets c.res with status 429 on the request after the limit', async () => {
      const store = uniqueStore()
      const middleware = rateLimit(store, { limit: 2, windowMs: 60_000 })
      const ip = '5.6.7.8'

      // Exhaust the limit
      for (let i = 0; i < 2; i++) {
        const ctx = makeContext(ip)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await middleware(ctx as any, next)
      }

      // Next request should be blocked
      const blockedCtx = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(blockedCtx as any, next)

      expect(blockedCtx.res).toBeDefined()
      expect(blockedCtx.res!.status).toBe(429)
    })

    it('response body contains error and retryAfter fields', async () => {
      const store = uniqueStore()
      const windowMs = 30_000
      const middleware = rateLimit(store, { limit: 1, windowMs })
      const ip = '9.9.9.9'

      // Exhaust limit then check body
      const ctx1 = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx1 as any, next)

      const blockedCtx = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(blockedCtx as any, next)

      const body = await blockedCtx.res!.json()
      expect(body.error).toBe('Too Many Requests')
      expect(body.retryAfter).toBe(Math.ceil(windowMs / 1000))
    })
  })

  describe('sets correct rate limit headers', () => {
    it('sets X-RateLimit-Limit on allowed requests', async () => {
      const store = uniqueStore()
      const limit = 10
      const middleware = rateLimit(store, { limit, windowMs: 60_000 })
      const ctx = makeContext('2.3.4.5')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx as any, next)

      expect(ctx._responseHeaders['X-RateLimit-Limit']).toBe(String(limit))
    })

    it('sets X-RateLimit-Remaining correctly as requests are consumed', async () => {
      const store = uniqueStore()
      const limit = 5
      const middleware = rateLimit(store, { limit, windowMs: 60_000 })
      const ip = '3.4.5.6'

      const ctx1 = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx1 as any, next)
      expect(ctx1._responseHeaders['X-RateLimit-Remaining']).toBe('4')

      const ctx2 = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx2 as any, next)
      expect(ctx2._responseHeaders['X-RateLimit-Remaining']).toBe('3')
    })

    it('sets X-RateLimit-Remaining to 0 on 429 response header', async () => {
      const store = uniqueStore()
      const middleware = rateLimit(store, { limit: 1, windowMs: 60_000 })
      const ip = '4.5.6.7'

      const ctx1 = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx1 as any, next)

      const blockedCtx = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(blockedCtx as any, next)

      expect(blockedCtx.res!.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('sets Retry-After header on 429 response', async () => {
      const store = uniqueStore()
      const windowMs = 60_000
      const middleware = rateLimit(store, { limit: 1, windowMs })
      const ip = '6.7.8.9'

      const ctx1 = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx1 as any, next)

      const blockedCtx = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(blockedCtx as any, next)

      expect(blockedCtx.res!.headers.get('Retry-After')).toBe(String(Math.ceil(windowMs / 1000)))
    })

    it('sets X-RateLimit-Limit header on 429 response', async () => {
      const store = uniqueStore()
      const limit = 2
      const middleware = rateLimit(store, { limit, windowMs: 60_000 })
      const ip = '7.8.9.10'

      for (let i = 0; i < limit; i++) {
        const ctx = makeContext(ip)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await middleware(ctx as any, next)
      }

      const blockedCtx = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(blockedCtx as any, next)

      expect(blockedCtx.res!.headers.get('X-RateLimit-Limit')).toBe(String(limit))
    })
  })

  describe('resets after the window expires', () => {
    it('allows requests again after timestamps fall outside the window', async () => {
      const store = uniqueStore()
      const windowMs = 100 // 100ms window
      const middleware = rateLimit(store, { limit: 2, windowMs })
      const ip = '20.20.20.20'

      // Exhaust the limit
      for (let i = 0; i < 2; i++) {
        const ctx = makeContext(ip)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await middleware(ctx as any, next)
      }

      // Confirm it's blocked
      const blockedCtx = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(blockedCtx as any, next)
      expect(blockedCtx.res!.status).toBe(429)

      // Wait for the window to expire
      await new Promise((resolve) => setTimeout(resolve, windowMs + 20))

      // Should be allowed again
      const afterCtx = makeContext(ip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(afterCtx as any, next)
      expect(afterCtx.res).toBeUndefined()
    })
  })

  describe('tracks different IPs independently', () => {
    it('blocking one IP does not affect another IP', async () => {
      const store = uniqueStore()
      const middleware = rateLimit(store, { limit: 1, windowMs: 60_000 })
      const ipA = '100.0.0.1'
      const ipB = '100.0.0.2'

      // Exhaust ipA
      const ctxA1 = makeContext(ipA)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctxA1 as any, next)
      const ctxABlocked = makeContext(ipA)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctxABlocked as any, next)
      expect(ctxABlocked.res!.status).toBe(429)

      // ipB is still within its own limit
      const ctxB = makeContext(ipB)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctxB as any, next)
      expect(ctxB.res).toBeUndefined()
    })

    it('each IP has its own independent remaining count', async () => {
      const store = uniqueStore()
      const limit = 5
      const middleware = rateLimit(store, { limit, windowMs: 60_000 })
      const ipA = '200.0.0.1'
      const ipB = '200.0.0.2'

      // Use 3 requests from ipA
      for (let i = 0; i < 3; i++) {
        const ctx = makeContext(ipA)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await middleware(ctx as any, next)
      }

      // ipB's first request should still show full limit - 1
      const ctxB = makeContext(ipB)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctxB as any, next)
      expect(ctxB._responseHeaders['X-RateLimit-Remaining']).toBe(String(limit - 1))
    })
  })

  describe('extracts IP from x-forwarded-for header', () => {
    it('uses the first IP from a comma-separated x-forwarded-for list', async () => {
      const store = uniqueStore()
      const limit = 1
      const middleware = rateLimit(store, { limit, windowMs: 60_000 })

      // First request with the real client IP as the first entry in x-forwarded-for
      const clientIp = '55.66.77.88'
      const proxyChain = `${clientIp}, 192.168.1.1, 10.0.0.1`

      const ctx1 = makeContext('ignored', { 'x-forwarded-for': proxyChain })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx1 as any, next)

      // Second request from same real client IP — should be blocked
      const ctx2 = makeContext('ignored', { 'x-forwarded-for': proxyChain })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctx2 as any, next)

      expect(ctx2.res!.status).toBe(429)
    })

    it('a different client IP via x-forwarded-for is treated as a different client', async () => {
      const store = uniqueStore()
      const limit = 1
      const middleware = rateLimit(store, { limit, windowMs: 60_000 })

      const ipA = '55.66.77.88'
      const ipB = '99.88.77.66'

      // Exhaust limit for ipA
      const ctxA = makeContext('ignored', { 'x-forwarded-for': `${ipA}, 192.168.1.1` })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctxA as any, next)
      const ctxABlocked = makeContext('ignored', { 'x-forwarded-for': `${ipA}, 192.168.1.1` })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctxABlocked as any, next)
      expect(ctxABlocked.res!.status).toBe(429)

      // ipB via x-forwarded-for should still be allowed
      const ctxB = makeContext('ignored', { 'x-forwarded-for': `${ipB}, 192.168.1.1` })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await middleware(ctxB as any, next)
      expect(ctxB.res).toBeUndefined()
    })
  })
})
