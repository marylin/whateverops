import { describe, it, expect } from 'bun:test'
import { parsePanel, getHealthStatus, getCacheKey } from '../../../../backend/src/integrations/cloudflare'
import fixture from '../../../fixtures/mock-responses/cloudflare.json'

describe('cloudflare integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.requests24h).toBe(50000)
    expect(panel.cacheHitRatio).toBe(70)
    expect(panel.zoneName).toBe('example.com')
    expect(panel.bandwidth24h).toContain('GB')
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.requests24h).toBe(0)
    expect(panel.cacheHitRatio).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key', zoneId: 'z1', accountId: 'a1' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', zoneId: 'z1', accountId: 'a1' })
    const b = getCacheKey({ apiKey: 'key-b', zoneId: 'z1', accountId: 'a1' })
    expect(a).not.toBe(b)
  })
})
