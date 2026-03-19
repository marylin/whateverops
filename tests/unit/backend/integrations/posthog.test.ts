import { describe, it, expect } from 'bun:test'
import {
  parsePanel,
  getHealthStatus,
  getCacheKey,
} from '../../../../backend/src/integrations/posthog'
import fixture from '../../../fixtures/mock-responses/posthog.json'

describe('posthog integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.dau).toBe(150)
    expect(panel.wau).toBe(620)
    expect(panel.eventsToday).toBe(3200)
    expect(panel.topEvents.length).toBe(5)
    expect(panel.topEvents[0]!.event).toBe('$pageview')
    expect(panel.dauTrend.length).toBe(14)
    expect(panel.eventsTrend.length).toBe(14)
  })

  it('parsePanel() computes dauChangePercent correctly', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    // Last two DAU trend entries: 100 -> 150, so (150-100)/100 = 50%
    expect(panel.dauChangePercent).toBe(50)
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.dau).toBe(0)
    expect(panel.wau).toBe(0)
    expect(panel.eventsToday).toBe(0)
    expect(panel.topEvents.length).toBe(0)
    expect(panel.dauChangePercent).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for null data', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getHealthStatus() returns warn when dau and events are both zero', () => {
    expect(getHealthStatus(fixture.empty as Parameters<typeof getHealthStatus>[0])).toBe('warn')
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
