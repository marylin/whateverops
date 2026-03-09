import { describe, it, expect } from 'bun:test'
import { parsePanel, getHealthStatus, getCacheKey } from '../../../../backend/src/integrations/railway'
import fixture from '../../../fixtures/mock-responses/railway.json'

describe('railway integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.projectCount).toBe(1)
    expect(panel.serviceCount).toBe(1)
    expect(panel.recentDeploys.length).toBe(1)
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.projectCount).toBe(0)
    expect(panel.serviceCount).toBe(0)
    expect(panel.lastDeployTime).toBeNull()
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns warn for degraded response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('warn')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a' })
    const b = getCacheKey({ apiKey: 'key-b' })
    expect(a).not.toBe(b)
  })
})
