import { describe, it, expect } from 'bun:test'
import { parsePanel, getHealthStatus, getCacheKey } from '../../../../backend/src/integrations/sentry'
import fixture from '../../../fixtures/mock-responses/sentry.json'

describe('sentry integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.unresolvedCount).toBe(3)
    expect(panel.events24h).toBe(150)
    expect(panel.latestIssues.length).toBe(2)
    expect(panel.latestIssues[0]!.count).toBe(42)
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.unresolvedCount).toBe(0)
    expect(panel.latestIssues.length).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.empty as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns warn for response with errors', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('warn')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key', org: 'myorg', project: 'myproj' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', org: 'myorg', project: 'myproj' })
    const b = getCacheKey({ apiKey: 'key-b', org: 'myorg', project: 'myproj' })
    expect(a).not.toBe(b)
  })
})
