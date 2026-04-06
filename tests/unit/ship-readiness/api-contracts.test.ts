/**
 * Layer 1 — Backend API Contract Tests
 *
 * Verify every API endpoint returns the correct response shape.
 * These are "ship readiness" tests: written against the code AS-IS.
 * If a test fails, that is a real bug found — do NOT modify source code.
 */
import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test'
import { Hono } from 'hono'

// ---------------------------------------------------------------------------
// Mock integration-registry so dashboard/status routes resolve instantly
// without hitting real APIs or waiting for retries/timeouts.
// ---------------------------------------------------------------------------
const mockResults = [
  {
    id: 'self-monitoring',
    name: 'WhateverOPS',
    status: 'ok' as const,
    data: { healthy: true },
    error: null,
    cached: false,
    lastUpdated: new Date().toISOString(),
    ttl: 60,
  },
]

mock.module('../../../backend/src/lib/integration-registry.js', () => ({
  buildConfiguredIntegrations: () => mockResults.map((r) => Promise.resolve(r)),
  computeGlobalHealth: (results: { status: string }[]) => {
    if (results.some((r) => r.status === 'error')) return 'error'
    if (results.some((r) => r.status === 'warn')) return 'warn'
    return 'ok'
  },
}))

// Import routes AFTER mocking so they pick up the mocked registry
import dashboard from '../../../backend/src/routes/dashboard.js'
import settings from '../../../backend/src/routes/settings.js'
import status from '../../../backend/src/routes/status.js'
import webhooks from '../../../backend/src/routes/webhooks.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Hono app that mirrors index.ts route mounting. */
function buildApp() {
  const app = new Hono()
  app.get('/health', (c) =>
    c.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  )
  app.route('/api/dashboard', dashboard)
  app.route('/api/settings', settings)
  app.route('/api/webhooks', webhooks)
  app.route('/api/status', status)
  return app
}

// ---------------------------------------------------------------------------
// Save / restore env vars that settings reads
// ---------------------------------------------------------------------------
const envKeys = ['NEON_DATABASE_URL', 'CREDENTIAL_ENCRYPTION_KEY', 'N8N_WEBHOOK_SECRET']
const savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const key of envKeys) savedEnv[key] = process.env[key]
})

afterEach(() => {
  for (const key of envKeys) {
    if (savedEnv[key] === undefined) delete process.env[key]
    else process.env[key] = savedEnv[key]
  }
})

// ===================================================================
// GET /api/dashboard
// ===================================================================
describe('GET /api/dashboard', () => {
  const app = buildApp()

  test('returns 200 with correct top-level shape', async () => {
    const res = await app.request('/api/dashboard')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('panels')
    expect(body).toHaveProperty('globalHealth')
    expect(body).toHaveProperty('lastRefresh')
    expect(body).toHaveProperty('configured')
    expect(body).toHaveProperty('total')
  })

  test('panels is an array', async () => {
    const res = await app.request('/api/dashboard')
    const body = await res.json()
    expect(Array.isArray(body.panels)).toBe(true)
  })

  test('globalHealth is a string', async () => {
    const res = await app.request('/api/dashboard')
    const body = await res.json()
    expect(typeof body.globalHealth).toBe('string')
    expect(['ok', 'warn', 'error']).toContain(body.globalHealth)
  })

  test('lastRefresh is an ISO 8601 timestamp', async () => {
    const res = await app.request('/api/dashboard')
    const body = await res.json()
    expect(typeof body.lastRefresh).toBe('string')
    // Quick sanity: parseable as a date
    expect(Number.isNaN(Date.parse(body.lastRefresh))).toBe(false)
  })

  test('configured and total are numbers', async () => {
    const res = await app.request('/api/dashboard')
    const body = await res.json()
    expect(typeof body.configured).toBe('number')
    expect(typeof body.total).toBe('number')
  })
})

// ===================================================================
// GET /api/settings
// ===================================================================
describe('GET /api/settings', () => {
  const app = buildApp()

  test('returns 200 with correct top-level shape', async () => {
    const res = await app.request('/api/settings')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('deploymentMode')
    expect(body).toHaveProperty('storageMode')
    expect(body).toHaveProperty('version')
    expect(body).toHaveProperty('dbAvailable')
    expect(body).toHaveProperty('encryptionKeySet')
    expect(body).toHaveProperty('integrations')
  })

  test('integrations is an array', async () => {
    const res = await app.request('/api/settings')
    const body = await res.json()
    expect(Array.isArray(body.integrations)).toBe(true)
  })

  test('deploymentMode is selfhosted or hosted', async () => {
    const res = await app.request('/api/settings')
    const body = await res.json()
    expect(['selfhosted', 'hosted']).toContain(body.deploymentMode)
  })

  test('dbAvailable and encryptionKeySet are booleans', async () => {
    const res = await app.request('/api/settings')
    const body = await res.json()
    expect(typeof body.dbAvailable).toBe('boolean')
    expect(typeof body.encryptionKeySet).toBe('boolean')
  })

  test('version is a string', async () => {
    const res = await app.request('/api/settings')
    const body = await res.json()
    expect(typeof body.version).toBe('string')
  })
})

// ===================================================================
// POST /api/settings/storage-mode
// ===================================================================
describe('POST /api/settings/storage-mode', () => {
  const app = buildApp()

  test('accepts valid mode "env"', async () => {
    const res = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'env' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.storageMode).toBe('env')
  })

  test('rejects invalid mode with 400', async () => {
    const res = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'invalid' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(typeof body.error).toBe('string')
  })

  test('rejects empty / missing body with 400', async () => {
    const res = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  test('rejects mode "memory" with 400 (only env|db allowed)', async () => {
    const res = await app.request('/api/settings/storage-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'memory' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})

// ===================================================================
// GET /api/status
// ===================================================================
describe('GET /api/status', () => {
  const app = buildApp()

  test('returns 200 with correct top-level shape', async () => {
    const res = await app.request('/api/status')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('services')
    expect(body).toHaveProperty('globalHealth')
    expect(body).toHaveProperty('lastRefresh')
  })

  test('services is an array', async () => {
    const res = await app.request('/api/status')
    const body = await res.json()
    expect(Array.isArray(body.services)).toBe(true)
  })

  test('globalHealth is ok | warn | error', async () => {
    const res = await app.request('/api/status')
    const body = await res.json()
    expect(['ok', 'warn', 'error']).toContain(body.globalHealth)
  })

  test('lastRefresh is a parseable timestamp', async () => {
    const res = await app.request('/api/status')
    const body = await res.json()
    expect(typeof body.lastRefresh).toBe('string')
    expect(Number.isNaN(Date.parse(body.lastRefresh))).toBe(false)
  })

  test('each service entry has id, name, status, lastChecked', async () => {
    const res = await app.request('/api/status')
    const body = await res.json()
    for (const svc of body.services) {
      expect(svc).toHaveProperty('id')
      expect(svc).toHaveProperty('name')
      expect(svc).toHaveProperty('status')
      expect(svc).toHaveProperty('lastChecked')
      expect(['ok', 'warn', 'error']).toContain(svc.status)
    }
  })
})

// ===================================================================
// GET /health
// ===================================================================
describe('GET /health', () => {
  const app = buildApp()

  test('returns 200 with status, uptime, timestamp', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toHaveProperty('status')
    expect(body).toHaveProperty('uptime')
    expect(body).toHaveProperty('timestamp')
  })

  test('status is "ok"', async () => {
    const res = await app.request('/health')
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  test('uptime is a number', async () => {
    const res = await app.request('/health')
    const body = await res.json()
    expect(typeof body.uptime).toBe('number')
  })

  test('timestamp is a parseable ISO date', async () => {
    const res = await app.request('/health')
    const body = await res.json()
    expect(typeof body.timestamp).toBe('string')
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false)
  })
})

// ===================================================================
// POST /api/webhooks/n8n/:event
// ===================================================================
describe('POST /api/webhooks/n8n/:event', () => {
  const app = buildApp()

  test('returns 401 when x-webhook-secret is missing and N8N_WEBHOOK_SECRET is set', async () => {
    process.env.N8N_WEBHOOK_SECRET = 'test-secret-123'
    const res = await app.request('/api/webhooks/n8n/test-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foo: 'bar' }),
    })
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toBe('Unauthorized')
  })

  test('returns 401 when x-webhook-secret does not match', async () => {
    process.env.N8N_WEBHOOK_SECRET = 'test-secret-123'
    const res = await app.request('/api/webhooks/n8n/test-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'wrong-secret',
      },
      body: JSON.stringify({ foo: 'bar' }),
    })
    expect(res.status).toBe(401)
  })

  test('returns 401 when N8N_WEBHOOK_SECRET is not set (no expected secret)', async () => {
    // When there's no expected secret, the check `!expected || secret !== expected`
    // means it always rejects — this is intentional (fail-closed)
    delete process.env.N8N_WEBHOOK_SECRET
    const res = await app.request('/api/webhooks/n8n/test-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'anything',
      },
      body: JSON.stringify({ foo: 'bar' }),
    })
    expect(res.status).toBe(401)
  })

  test('returns 200 with correct shape when secret matches', async () => {
    process.env.N8N_WEBHOOK_SECRET = 'valid-secret'
    const res = await app.request('/api/webhooks/n8n/test-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'valid-secret',
      },
      body: JSON.stringify({ action: 'deploy' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('received')
    expect(body.received).toBe(true)
    expect(body).toHaveProperty('event')
    expect(body.event).toBe('test-event')
    expect(body).toHaveProperty('timestamp')
    expect(typeof body.timestamp).toBe('string')
  })
})
