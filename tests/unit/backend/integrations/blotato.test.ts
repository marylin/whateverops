// tests/unit/backend/integrations/blotato.test.ts
import { describe, it, expect } from 'bun:test'
import {
  parsePanel,
  getHealthStatus,
  getCacheKey,
} from '../../../../backend/src/integrations/blotato'
import fixture from '../../../fixtures/mock-responses/blotato.json'

type RawParam = Parameters<typeof parsePanel>[0]
type HealthParam = Parameters<typeof getHealthStatus>[0]

describe('blotato integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as RawParam)
    expect(panel.subscriptionStatus).toBe('active')
    expect(panel.connectedAccounts).toHaveLength(3)
    expect(panel.platformCount).toBe(3)
    expect(panel.queuedCount).toBe(8)
    expect(panel.nextPosts).toHaveLength(2)
    expect(panel.nextPosts[0].platform).toBe('twitter')
    expect(panel.nextPosts[0].text.length).toBeLessThanOrEqual(80)
    expect(panel.totalSlots).toBe(4)
    expect(panel.slotsByDay['monday']).toBe(2)
    expect(panel.slotsByDay['wednesday']).toBe(1)
    expect(panel.slotsByDay['friday']).toBe(1)
  })

  it('parsePanel() handles empty queue', () => {
    const panel = parsePanel(fixture.empty as RawParam)
    expect(panel.connectedAccounts).toHaveLength(1)
    expect(panel.queuedCount).toBe(0)
    expect(panel.nextPosts).toHaveLength(0)
  })

  it('parsePanel() handles no accounts', () => {
    const panel = parsePanel(fixture.error as RawParam)
    expect(panel.connectedAccounts).toHaveLength(0)
    expect(panel.platformCount).toBe(0)
    expect(panel.queuedCount).toBe(0)
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as HealthParam)).toBe('ok')
  })

  it('getHealthStatus() returns error for no accounts', () => {
    expect(getHealthStatus(fixture.error as HealthParam)).toBe('error')
  })

  it('getHealthStatus() returns warn for empty queue', () => {
    expect(getHealthStatus(fixture.empty as HealthParam)).toBe('warn')
  })

  it('getCacheKey() is stable for same config', () => {
    const key1 = getCacheKey({ apiKey: 'test-key' })
    const key2 = getCacheKey({ apiKey: 'test-key' })
    expect(key1).toBe(key2)
  })

  it('getCacheKey() differs for different configs', () => {
    const key1 = getCacheKey({ apiKey: 'key-a' })
    const key2 = getCacheKey({ apiKey: 'key-b' })
    expect(key1).not.toBe(key2)
  })
})
