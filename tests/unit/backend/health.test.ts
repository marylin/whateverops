import { describe, it, expect } from 'bun:test'

describe('health endpoint', () => {
  it('returns ok status with uptime and timestamp', async () => {
    const res = await fetch('http://localhost:3000/health')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(typeof body.uptime).toBe('number')
    expect(typeof body.timestamp).toBe('string')
  })
})
