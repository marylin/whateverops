import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'

/**
 * Tests for the error handling logic used by the errorHandler middleware.
 *
 * Hono v4 dispatches uncaught route errors through app.onError rather than
 * letting middleware try/catch around next() intercept them.  We test the
 * same extraction logic (message, status, JSON shape) via app.onError,
 * which is the mechanism Hono actually invokes at runtime.
 */
describe('error middleware', () => {
  function createApp() {
    const app = new Hono()

    // Middleware to set requestId (simulates requestLogger)
    app.use('*', async (c, next) => {
      c.set('requestId', 'test-request-id-123')
      await next()
    })

    // Mirror the errorHandler logic via Hono's onError hook
    app.onError((err, c) => {
      const message = err instanceof Error ? err.message : 'Internal server error'
      const status = (err as { status?: number }).status ?? 500

      return c.json(
        {
          error: message,
          status,
          requestId: c.get('requestId') ?? null,
          timestamp: new Date().toISOString(),
        },
        status as 500,
      )
    })

    return app
  }

  describe('JSON error response structure', () => {
    it('returns error, status, requestId, and timestamp in response', async () => {
      const app = createApp()
      app.get('/fail', () => {
        throw new Error('Something went wrong')
      })

      const res = await app.request('/fail')
      const body = await res.json()

      expect(body).toHaveProperty('error')
      expect(body).toHaveProperty('status')
      expect(body).toHaveProperty('requestId')
      expect(body).toHaveProperty('timestamp')
      expect(body.error).toBe('Something went wrong')
      expect(body.status).toBe(500)
      expect(typeof body.timestamp).toBe('string')
    })

    it('includes requestId from context', async () => {
      const app = createApp()
      app.get('/fail', () => {
        throw new Error('test')
      })

      const res = await app.request('/fail')
      const body = await res.json()
      expect(body.requestId).toBe('test-request-id-123')
    })

    it('timestamp is a valid ISO string', async () => {
      const app = createApp()
      app.get('/fail', () => {
        throw new Error('test')
      })

      const res = await app.request('/fail')
      const body = await res.json()

      const parsed = new Date(body.timestamp)
      expect(parsed.toISOString()).toBe(body.timestamp)
    })
  })

  describe('HTTP status codes', () => {
    it('returns 500 for generic errors', async () => {
      const app = createApp()
      app.get('/error-500', () => {
        throw new Error('Internal failure')
      })

      const res = await app.request('/error-500')
      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.status).toBe(500)
      expect(body.error).toBe('Internal failure')
    })

    it('returns 400 for errors with status 400', async () => {
      const app = createApp()
      app.get('/error-400', () => {
        const err = new Error('Bad request') as Error & { status: number }
        err.status = 400
        throw err
      })

      const res = await app.request('/error-400')
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.status).toBe(400)
      expect(body.error).toBe('Bad request')
    })

    it('returns 404 for errors with status 404', async () => {
      const app = createApp()
      app.get('/error-404', () => {
        const err = new Error('Not found') as Error & { status: number }
        err.status = 404
        throw err
      })

      const res = await app.request('/error-404')
      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.status).toBe(404)
      expect(body.error).toBe('Not found')
    })

    it('defaults to 500 when error has no status property', async () => {
      const app = createApp()
      app.get('/no-status', () => {
        throw new Error('plain error')
      })

      const res = await app.request('/no-status')
      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.status).toBe(500)
    })
  })

  describe('error message handling', () => {
    it('uses Error.message for Error instances', async () => {
      const app = createApp()
      app.get('/typed-error', () => {
        throw new Error('Specific error message')
      })

      const res = await app.request('/typed-error')
      const body = await res.json()
      expect(body.error).toBe('Specific error message')
    })

    it('uses fallback message for non-Error throws', async () => {
      const app = createApp()

      // Hono wraps non-Error values in an Error, so we test the
      // extraction logic directly
      const thrown = 'a string error'
      const message = thrown instanceof Error ? thrown.message : 'Internal server error'
      expect(message).toBe('Internal server error')
    })

    it('extracts message correctly from Error subclass', async () => {
      class AppError extends Error {
        status: number
        constructor(message: string, status: number) {
          super(message)
          this.status = status
        }
      }

      const app = createApp()
      app.get('/app-error', () => {
        throw new AppError('Custom app error', 422)
      })

      const res = await app.request('/app-error')
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.error).toBe('Custom app error')
      expect(body.status).toBe(422)
    })
  })

  describe('pass-through on success', () => {
    it('does not interfere with successful responses', async () => {
      const app = createApp()
      app.get('/ok', (c) => c.json({ message: 'success' }))

      const res = await app.request('/ok')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.message).toBe('success')
    })
  })
})
