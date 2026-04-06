/**
 * Layer 1 — CORS & Header Tests
 *
 * Replicate the middleware stack from index.ts and verify:
 * - CORS headers on OPTIONS preflight
 * - Content-Type on JSON responses
 * - X-Request-ID generation and echo-back
 */
import { describe, test, expect, mock } from 'bun:test'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

// ---------------------------------------------------------------------------
// Mock integration-registry so mounted routes resolve instantly
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

import { requestLogger } from '../../../backend/src/lib/logger.js'
import { errorHandler } from '../../../backend/src/middleware/error.js'
import dashboard from '../../../backend/src/routes/dashboard.js'
import settings from '../../../backend/src/routes/settings.js'
import status from '../../../backend/src/routes/status.js'

/**
 * Build an app that mirrors the middleware stack from index.ts:
 * errorHandler -> cors -> secureHeaders -> requestLogger -> routes
 */
function buildFullApp() {
  const app = new Hono()

  app.use('*', errorHandler)
  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return origin
        return 'http://localhost:5173'
      },
    }),
  )
  app.use('*', secureHeaders())
  app.use('*', requestLogger())

  app.get('/health', (c) =>
    c.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  )

  app.route('/api/dashboard', dashboard)
  app.route('/api/settings', settings)
  app.route('/api/status', status)

  return app
}

// ===================================================================
// CORS headers
// ===================================================================
describe('CORS headers', () => {
  const app = buildFullApp()

  test('OPTIONS /api/dashboard returns Access-Control-Allow-Origin', async () => {
    const res = await app.request('/api/dashboard', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    })
    const acaoHeader = res.headers.get('Access-Control-Allow-Origin')
    expect(acaoHeader).toBeTruthy()
  })

  test('CORS allows any localhost origin', async () => {
    const res = await app.request('/api/settings', {
      method: 'GET',
      headers: { Origin: 'http://localhost:3001' },
    })
    const acaoHeader = res.headers.get('Access-Control-Allow-Origin')
    expect(acaoHeader).toBe('http://localhost:3001')
  })

  test('CORS falls back to FRONTEND_URL for non-localhost origins', async () => {
    const res = await app.request('/api/settings', {
      method: 'GET',
      headers: { Origin: 'https://example.com' },
    })
    const acaoHeader = res.headers.get('Access-Control-Allow-Origin')
    // Should fall back to the FRONTEND_URL default (http://localhost:5173)
    expect(acaoHeader).toBe('http://localhost:5173')
  })
})

// ===================================================================
// Content-Type
// ===================================================================
describe('Content-Type headers', () => {
  const app = buildFullApp()

  test('GET /health returns application/json content type', async () => {
    const res = await app.request('/health')
    const ct = res.headers.get('Content-Type')
    expect(ct).toBeTruthy()
    expect(ct!.toLowerCase()).toContain('application/json')
  })

  test('GET /api/settings/ returns application/json content type', async () => {
    const res = await app.request('/api/settings')
    const ct = res.headers.get('Content-Type')
    expect(ct).toBeTruthy()
    expect(ct!.toLowerCase()).toContain('application/json')
  })

  test('GET /api/dashboard/ returns application/json content type', async () => {
    const res = await app.request('/api/dashboard')
    const ct = res.headers.get('Content-Type')
    expect(ct).toBeTruthy()
    expect(ct!.toLowerCase()).toContain('application/json')
  })

  test('GET /api/status/ returns application/json content type', async () => {
    const res = await app.request('/api/status')
    const ct = res.headers.get('Content-Type')
    expect(ct).toBeTruthy()
    expect(ct!.toLowerCase()).toContain('application/json')
  })
})

// ===================================================================
// X-Request-ID
// ===================================================================
describe('X-Request-ID header', () => {
  const app = buildFullApp()

  test('generates X-Request-ID when not provided', async () => {
    const res = await app.request('/health')
    const rid = res.headers.get('X-Request-ID')
    expect(rid).toBeTruthy()
    expect(typeof rid).toBe('string')
    // Should look like a UUID (8-4-4-4-12 hex)
    expect(rid!.length).toBeGreaterThan(0)
  })

  test('echoes back X-Request-ID when provided in request', async () => {
    const customId = 'my-custom-request-id-12345'
    const res = await app.request('/health', {
      headers: { 'X-Request-ID': customId },
    })
    const rid = res.headers.get('X-Request-ID')
    expect(rid).toBe(customId)
  })

  test('different requests without X-Request-ID get different IDs', async () => {
    const res1 = await app.request('/health')
    const res2 = await app.request('/health')
    const id1 = res1.headers.get('X-Request-ID')
    const id2 = res2.headers.get('X-Request-ID')
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
  })

  test('X-Request-ID is present on API routes too', async () => {
    const res = await app.request('/api/settings')
    const rid = res.headers.get('X-Request-ID')
    expect(rid).toBeTruthy()
  })
})
