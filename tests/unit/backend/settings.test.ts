import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { Hono } from 'hono'
import settings from '../../../backend/src/routes/settings.js'

describe('settings route', () => {
  const app = new Hono()
  app.route('/api/settings', settings)

  // Save and restore env vars that settings reads
  const savedEnv: Record<string, string | undefined> = {}
  const envKeys = [
    'NEON_DATABASE_URL',
    'CREDENTIAL_ENCRYPTION_KEY',
    'GITHUB_PAT',
    'LINEAR_API_KEY',
    'VERCEL_TOKEN',
  ]

  beforeEach(() => {
    for (const key of envKeys) {
      savedEnv[key] = process.env[key]
    }
  })

  afterEach(() => {
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = savedEnv[key]
      }
    }
  })

  describe('GET /api/settings', () => {
    it('returns expected response shape', async () => {
      const res = await app.request('/api/settings')
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body).toHaveProperty('deploymentMode')
      expect(body).toHaveProperty('storageMode')
      expect(body).toHaveProperty('version')
      expect(body).toHaveProperty('integrations')
      expect(Array.isArray(body.integrations)).toBe(true)
    })

    it('returns deploymentMode as selfhosted when NEON_DATABASE_URL is not set', async () => {
      delete process.env.NEON_DATABASE_URL
      const res = await app.request('/api/settings')
      const body = await res.json()
      expect(body.deploymentMode).toBe('selfhosted')
    })

    it('returns deploymentMode as hosted when NEON_DATABASE_URL is set', async () => {
      process.env.NEON_DATABASE_URL = 'postgres://test:test@localhost:5432/test'
      const res = await app.request('/api/settings')
      const body = await res.json()
      expect(body.deploymentMode).toBe('hosted')
    })

    it('includes dbAvailable and encryptionKeySet flags', async () => {
      const res = await app.request('/api/settings')
      const body = await res.json()
      expect(typeof body.dbAvailable).toBe('boolean')
      expect(typeof body.encryptionKeySet).toBe('boolean')
    })

    it('integrations array entries have expected shape', async () => {
      const res = await app.request('/api/settings')
      const body = await res.json()

      // There should be at least one integration (self-monitoring is always present)
      expect(body.integrations.length).toBeGreaterThan(0)

      const entry = body.integrations[0]
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('name')
      expect(entry).toHaveProperty('configured')
      expect(entry).toHaveProperty('envVars')
      expect(typeof entry.id).toBe('string')
      expect(typeof entry.name).toBe('string')
      expect(typeof entry.configured).toBe('boolean')
      expect(Array.isArray(entry.envVars)).toBe(true)
    })

    it('version is a string', async () => {
      const res = await app.request('/api/settings')
      const body = await res.json()
      expect(typeof body.version).toBe('string')
    })
  })

  describe('POST /api/settings/storage-mode', () => {
    it('accepts valid env mode', async () => {
      const res = await app.request('/api/settings/storage-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'env' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.storageMode).toBe('env')
    })

    it('rejects invalid mode value', async () => {
      const res = await app.request('/api/settings/storage-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'invalid' }),
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error).toBeDefined()
    })

    it('rejects missing mode field', async () => {
      const res = await app.request('/api/settings/storage-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foo: 'bar' }),
      })
      expect(res.status).toBe(400)
    })

    it('rejects invalid JSON body', async () => {
      const res = await app.request('/api/settings/storage-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
      expect(res.status).toBe(400)

      const body = await res.json()
      expect(body.error).toBe('Invalid JSON body')
    })

    it('rejects db mode when required env vars are missing', async () => {
      delete process.env.NEON_DATABASE_URL
      delete process.env.CREDENTIAL_ENCRYPTION_KEY

      const res = await app.request('/api/settings/storage-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'db' }),
      })
      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.error).toContain('missing required env vars')
    })

    it('accepts db mode when required env vars are set', async () => {
      process.env.NEON_DATABASE_URL = 'postgres://test:test@localhost:5432/test'
      process.env.CREDENTIAL_ENCRYPTION_KEY = 'test-key-32-chars-long-xxxxxxxxx'

      const res = await app.request('/api/settings/storage-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'db' }),
      })
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.storageMode).toBe('db')
    })
  })
})
