/**
 * Layer 1 — Error Response Tests
 *
 * Verify error paths return consistent JSON error shapes:
 * - 404 for unknown routes
 * - 400 for bad input
 * - 429 for rate-limited requests
 * - 500 from errorHandler middleware
 *
 * FINDINGS documented inline where actual behavior differs from expected.
 */
import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'

// ---------------------------------------------------------------------------
// Mock integration-registry
// ---------------------------------------------------------------------------
mock.module('../../../backend/src/lib/integration-registry.js', () => ({
  buildConfiguredIntegrations: () => [
    Promise.resolve({
      id: 'self-monitoring',
      name: 'WhateverOPS',
      status: 'ok',
      data: null,
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    }),
  ],
  computeGlobalHealth: () => 'ok',
}))

import { errorHandler } from '../../../backend/src/middleware/error.js'
import { rateLimit } from '../../../backend/src/middleware/rate-limit.js'
import dashboard from '../../../backend/src/routes/dashboard.js'
import settings from '../../../backend/src/routes/settings.js'
import status from '../../../backend/src/routes/status.js'

// ===================================================================
// 404 — Unknown Routes
// ===================================================================
describe('404 for unknown routes', () => {
  const app = new Hono()
  app.use('*', errorHandler)
  app.route('/api/dashboard', dashboard)
  app.route('/api/settings', settings)
  app.route('/api/status', status)

  test('GET /api/nonexistent returns 404', async () => {
    const res = await app.request('/api/nonexistent')
    expect(res.status).toBe(404)
  })

  test('FINDING: 404 response is plain text, not JSON — Hono default', async () => {
    // Hono's built-in 404 returns text/plain "404 Not Found".
    // The errorHandler middleware only catches thrown errors, not Hono's 404.
    // FINDING: No notFound() handler is registered, so unknown routes
    // return text/plain instead of a JSON error envelope.
    const res = await app.request('/api/nonexistent')
    const ct = res.headers.get('Content-Type')
    const text = await res.text()

    // Document the actual behavior: plain text, not JSON
    expect(text).toBe('404 Not Found')
    expect(ct?.toLowerCase()).toContain('text/plain')
  })
})

// ===================================================================
// 400 — Bad Input
// ===================================================================
describe('400 for bad input', () => {
  const app = new Hono()
  app.route('/api/settings', settings)

  test('POST /api/settings/storage-mode with invalid mode returns 400 JSON', async () => {
    const res = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'invalid' }),
    })
    expect(res.status).toBe(400)

    const ct = res.headers.get('Content-Type')
    expect(ct?.toLowerCase()).toContain('json')

    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(typeof body.error).toBe('string')
  })

  test('POST /api/settings/storage-mode with invalid JSON returns 400', async () => {
    const res = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json',
    })
    expect(res.status).toBe(400)

    const body = await res.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  test('POST /api/settings/storage-mode with empty object returns 400', async () => {
    const res = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})

// ===================================================================
// 429 — Rate Limiting
// ===================================================================
describe('429 rate limiting', () => {
  // Use unique storeIds to avoid cross-contamination with other tests

  test('returns 429 after exceeding limit', async () => {
    const app = new Hono()
    app.use('/api/test-rl/*', rateLimit('ship-readiness-rl-test', { limit: 2, windowMs: 60_000 }))
    app.get('/api/test-rl/endpoint', (c) => c.json({ ok: true }))

    // First two requests should succeed
    const res1 = await app.request('/api/test-rl/endpoint')
    expect(res1.status).toBe(200)

    const res2 = await app.request('/api/test-rl/endpoint')
    expect(res2.status).toBe(200)

    // Third request should be rate-limited
    const res3 = await app.request('/api/test-rl/endpoint')
    expect(res3.status).toBe(429)
  })

  test('429 response is JSON with expected shape', async () => {
    const app = new Hono()
    app.use('/api/test-rl2/*', rateLimit('ship-readiness-rl-shape', { limit: 1, windowMs: 60_000 }))
    app.get('/api/test-rl2/endpoint', (c) => c.json({ ok: true }))

    // Exhaust the limit
    await app.request('/api/test-rl2/endpoint')

    // This should be 429
    const res = await app.request('/api/test-rl2/endpoint')
    expect(res.status).toBe(429)

    const ct = res.headers.get('Content-Type')
    expect(ct?.toLowerCase()).toContain('json')

    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toBe('Too Many Requests')
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('retryAfter')
    expect(typeof body.retryAfter).toBe('number')
  })

  test('429 response includes Retry-After header', async () => {
    const app = new Hono()
    app.use(
      '/api/test-rl3/*',
      rateLimit('ship-readiness-rl-header', { limit: 1, windowMs: 60_000 }),
    )
    app.get('/api/test-rl3/endpoint', (c) => c.json({ ok: true }))

    await app.request('/api/test-rl3/endpoint')
    const res = await app.request('/api/test-rl3/endpoint')
    expect(res.status).toBe(429)

    expect(res.headers.get('Retry-After')).toBeTruthy()
    expect(res.headers.get('X-RateLimit-Limit')).toBe('1')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  test('successful responses include rate-limit headers', async () => {
    const app = new Hono()
    app.use(
      '/api/test-rl4/*',
      rateLimit('ship-readiness-rl-success', { limit: 10, windowMs: 60_000 }),
    )
    app.get('/api/test-rl4/endpoint', (c) => c.json({ ok: true }))

    const res = await app.request('/api/test-rl4/endpoint')
    expect(res.status).toBe(200)

    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy()
  })
})

// ===================================================================
// Error response consistency
// ===================================================================
describe('error response consistency', () => {
  test('route-level 400 errors have an "error" field', async () => {
    const app = new Hono()
    app.route('/api/settings', settings)

    // 400 from invalid mode
    const res400 = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'bad' }),
    })
    const body400 = await res400.json()
    expect(body400).toHaveProperty('error')
    expect(typeof body400.error).toBe('string')

    // 400 from invalid JSON
    const res400b = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'nope',
    })
    const body400b = await res400b.json()
    expect(body400b).toHaveProperty('error')
    expect(typeof body400b.error).toBe('string')
  })

  test('FINDING: errorHandler middleware does not produce JSON for thrown errors', async () => {
    // The errorHandler middleware uses a try/catch pattern with `return c.json()`
    // inside the catch block. However, Hono's internal error handling intercepts
    // the thrown error before the middleware's return value is used, resulting in
    // Hono's built-in 500 "Internal Server Error" (text/plain) response.
    //
    // FINDING: The errorHandler middleware at backend/src/middleware/error.ts
    // catches errors and logs them, but its `return c.json(...)` is never
    // delivered to the client. The app should use `app.onError()` instead.
    const app = new Hono()
    app.use('*', errorHandler)
    app.get('/api/boom', () => {
      throw new Error('Intentional test explosion')
    })

    const res = await app.request('/api/boom')
    expect(res.status).toBe(500)

    // Actual behavior: Hono returns text/plain, not the JSON from errorHandler
    const ct = res.headers.get('Content-Type')
    expect(ct?.toLowerCase()).toContain('text/plain')

    const text = await res.text()
    expect(text).toBe('Internal Server Error')
  })

  test('rate limiter 429 errors have consistent shape', async () => {
    const app = new Hono()
    app.use(
      '/api/test-rl5/*',
      rateLimit('ship-readiness-rl-consistent', { limit: 1, windowMs: 60_000 }),
    )
    app.get('/api/test-rl5/endpoint', (c) => c.json({ ok: true }))

    // Exhaust limit
    await app.request('/api/test-rl5/endpoint')
    const res = await app.request('/api/test-rl5/endpoint')

    expect(res.status).toBe(429)
    const body = await res.json()

    // 429 uses { error, message, retryAfter } — different from route-level { error }
    // This inconsistency is a minor finding.
    expect(body).toHaveProperty('error')
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('retryAfter')
  })
})
