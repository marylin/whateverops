import { describe, it, expect } from 'bun:test'
import {
  parsePanel,
  getHealthStatus,
  getCacheKey,
} from '../../../../backend/src/integrations/supabase-management'
import fixture from '../../../fixtures/mock-responses/supabase-management.json'

describe('supabase-management integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.projects[0]?.projectName).toBe('my-project')
    expect(panel.projects[0]?.projectStatus).toBe('ACTIVE_HEALTHY')
    expect(panel.projects[0]?.healthyCount).toBe(2)
    expect(panel.projects[0]?.totalChecks).toBe(2)
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.projects[0]?.projectName).toBe('empty-project')
    expect(panel.projects[0]?.totalChecks).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { managementKey: 'test-key' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ managementKey: 'key-a' })
    const b = getCacheKey({ managementKey: 'key-b' })
    expect(a).not.toBe(b)
  })
})
