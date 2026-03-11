import { describe, it, expect } from 'bun:test'
import {
  parsePanel,
  getHealthStatus,
  getCacheKey,
} from '../../../../backend/src/integrations/self-monitoring'
import fixture from '../../../fixtures/mock-responses/self-monitoring.json'

describe('self-monitoring integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.status).toBe('ok')
    expect(panel.uptime).toBe('1d 0h 2m')
    expect(panel.responseTimeMs).toBe(42)
    expect(panel.lastChecked).toBe('2026-03-10T12:00:00Z')
  })

  it('parsePanel() handles error response', () => {
    const panel = parsePanel(fixture.error as Parameters<typeof parsePanel>[0])
    expect(panel.status).toBe('error')
    expect(panel.responseTimeMs).toBe(10001)
  })

  it('parsePanel() handles empty response', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.status).toBe('error')
    expect(panel.uptime).toBe('0m')
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'self', healthUrl: 'http://localhost:3000/health' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', healthUrl: 'http://localhost:3000/health' })
    const b = getCacheKey({ apiKey: 'key-b', healthUrl: 'http://localhost:3000/health' })
    expect(a).not.toBe(b)
  })
})
