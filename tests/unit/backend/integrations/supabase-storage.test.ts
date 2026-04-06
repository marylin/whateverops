import { describe, it, expect } from 'bun:test'
import {
  parsePanel,
  getHealthStatus,
  getCacheKey,
} from '../../../../backend/src/integrations/supabase-storage'
import fixture from '../../../fixtures/mock-responses/supabase-storage.json'

describe('supabase-storage integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.projects).toHaveLength(1)
    expect(panel.projects[0].buckets).toHaveLength(2)
    expect(panel.summary.totalBuckets).toBe(2)
    expect(panel.summary.publicBuckets).toBe(1)
    expect(panel.summary.privateBuckets).toBe(1)
  })

  it('parsePanel() handles empty buckets', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.projects).toHaveLength(1)
    expect(panel.projects[0].bucketCount).toBe(0)
    expect(panel.summary.totalBuckets).toBe(0)
  })

  it('parsePanel() handles missing projects', () => {
    const panel = parsePanel(fixture.error as Parameters<typeof parsePanel>[0])
    expect(panel.projects).toHaveLength(0)
    expect(panel.summary.totalBuckets).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for empty projects', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const key1 = getCacheKey({ managementKey: 'test-key' })
    const key2 = getCacheKey({ managementKey: 'test-key' })
    expect(key1).toBe(key2)
  })

  it('getCacheKey() differs for different configs', () => {
    const key1 = getCacheKey({ managementKey: 'key-a' })
    const key2 = getCacheKey({ managementKey: 'key-b' })
    expect(key1).not.toBe(key2)
  })
})
