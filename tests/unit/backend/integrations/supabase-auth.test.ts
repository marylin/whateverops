import { describe, it, expect } from 'bun:test'
import { parsePanel, getHealthStatus, getCacheKey } from '../../../../backend/src/integrations/supabase-auth'
import fixture from '../../../fixtures/mock-responses/supabase-auth.json'

describe('supabase-auth integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.totalUsers).toBe(50)
    expect(panel.recentSignups).toBeGreaterThanOrEqual(0)
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.totalUsers).toBe(0)
    expect(panel.recentSignups).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key', supabaseUrl: 'https://x.supabase.co', projectRef: 'p1' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', supabaseUrl: 'https://x.supabase.co', projectRef: 'p1' })
    const b = getCacheKey({ apiKey: 'key-b', supabaseUrl: 'https://x.supabase.co', projectRef: 'p1' })
    expect(a).not.toBe(b)
  })
})
