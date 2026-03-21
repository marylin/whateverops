import { describe, it, expect } from 'bun:test'
import {
  parsePanel,
  getHealthStatus,
  getCacheKey,
} from '../../../../backend/src/integrations/github'
import fixture from '../../../fixtures/mock-responses/github.json'

describe('github integration', () => {
  it('parsePanel() with healthy mock response', () => {
    const panel = parsePanel(fixture.ok as Parameters<typeof parsePanel>[0])
    expect(panel.stars).toBe(42)
    expect(panel.openIssues).toBe(5)
    expect(panel.openPRs).toBe(2)
    expect(panel.forks).toBe(3)
    expect(panel.language).toBe('TypeScript')
  })

  it('parsePanel() handles missing optional fields', () => {
    const panel = parsePanel(fixture.empty as Parameters<typeof parsePanel>[0])
    expect(panel.stars).toBe(0)
    expect(panel.lastCommit).toBeNull()
    expect(panel.language).toBeNull()
  })

  it('getHealthStatus() returns ok for healthy response', () => {
    expect(getHealthStatus(fixture.ok as Parameters<typeof getHealthStatus>[0])).toBe('ok')
  })

  it('getHealthStatus() returns error for error response', () => {
    expect(getHealthStatus(fixture.error as Parameters<typeof getHealthStatus>[0])).toBe('error')
  })

  it('getCacheKey() is stable for same config', () => {
    const config = { apiKey: 'test-key', owner: 'user', repo: 'repo' }
    expect(getCacheKey(config)).toBe(getCacheKey(config))
  })

  it('getCacheKey() differs for different configs', () => {
    const a = getCacheKey({ apiKey: 'key-a', owner: 'user', repo: 'repo' })
    const b = getCacheKey({ apiKey: 'key-b', owner: 'user', repo: 'repo' })
    expect(a).not.toBe(b)
  })
})
