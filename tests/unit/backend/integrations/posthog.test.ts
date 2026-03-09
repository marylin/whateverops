import { describe, it, expect } from 'bun:test'
import { parsePanel, getHealthStatus, getCacheKey } from '../../../../backend/src/integrations/posthog'
import fixture from '../../../fixtures/mock-responses/posthog.json'

describe('posthog integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.activeUsers24h).toBe(150)
    expect(panel.featureFlags).toBe(8)
    expect(panel.insights).toBe(12)
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.activeUsers24h).toBe(0)
    expect(panel.featureFlags).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key', host: 'https://app.posthog.com', projectId: 'p1' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', host: 'https://app.posthog.com', projectId: 'p1' })
    const b = getCacheKey({ apiKey: 'key-b', host: 'https://app.posthog.com', projectId: 'p1' })
    expect(a).not.toBe(b)
  })
})
