import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'

describe('health endpoint', () => {
  const app = new Hono()
  app.get('/health', (c) =>
    c.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  )

  it('returns ok status with uptime and timestamp', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(typeof body.uptime).toBe('number')
    expect(typeof body.timestamp).toBe('string')
  })
})
