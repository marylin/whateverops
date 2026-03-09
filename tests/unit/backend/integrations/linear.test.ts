import { describe, it, expect } from 'bun:test'
import { parsePanel, getHealthStatus, getCacheKey } from '../../../../backend/src/integrations/linear'
import fixture from '../../../fixtures/mock-responses/linear.json'

describe('linear integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.openIssues).toBe(8)
    expect(panel.inProgress).toBe(3)
    expect(panel.completedThisCycle).toBe(12)
    expect(panel.teamName).toBe('Engineering')
    expect(panel.cycleName).toBe('Sprint 5')
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.openIssues).toBe(0)
    expect(panel.cycleName).toBeNull()
    expect(panel.cycleProgress).toBeNull()
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key', teamId: 'team-1' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', teamId: 'team-1' })
    const b = getCacheKey({ apiKey: 'key-b', teamId: 'team-1' })
    expect(a).not.toBe(b)
  })
})
