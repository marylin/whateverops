import { describe, it, expect } from 'bun:test'
import { parsePanel, getHealthStatus, getCacheKey } from '../../../../backend/src/integrations/openai'
import fixture from '../../../fixtures/mock-responses/openai.json'

describe('openai integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.keyValid).toBe(true)
    expect(panel.modelCount).toBe(4)
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.keyValid).toBe(true)
    expect(panel.modelCount).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key', orgId: '' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', orgId: '' })
    const b = getCacheKey({ apiKey: 'key-b', orgId: '' })
    expect(a).not.toBe(b)
  })
})
