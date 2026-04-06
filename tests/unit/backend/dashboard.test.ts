import { describe, it, expect } from 'bun:test'
import { computeGlobalHealth } from '../../../backend/src/lib/global-health'

// The dashboard route calls buildConfiguredIntegrations() which depends on
// live env vars and external modules. We test the response shape logic and
// globalHealth computation directly, matching the pattern in status.test.ts.

interface PanelResult {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  data: unknown
  error: string | null
  cached: boolean
  lastUpdated: string
  ttl: number
}

function makePanelResult(overrides: Partial<PanelResult> = {}): PanelResult {
  return {
    id: 'test-integration',
    name: 'Test Integration',
    status: 'ok',
    data: { metric: 42 },
    error: null,
    cached: false,
    lastUpdated: new Date().toISOString(),
    ttl: 60,
    ...overrides,
  }
}

describe('dashboard route logic', () => {
  describe('response shape', () => {
    it('builds expected dashboard response from panel results', () => {
      const panels = [
        makePanelResult({ id: 'github', name: 'GitHub', status: 'ok' }),
        makePanelResult({ id: 'vercel', name: 'Vercel', status: 'ok' }),
      ]

      // Mirror the dashboard route's response construction
      const response = {
        panels,
        globalHealth: computeGlobalHealth(panels),
        lastRefresh: new Date().toISOString(),
        configured: panels.length,
        total: panels.length,
      }

      expect(response).toHaveProperty('panels')
      expect(response).toHaveProperty('globalHealth')
      expect(response).toHaveProperty('lastRefresh')
      expect(response).toHaveProperty('configured')
      expect(response).toHaveProperty('total')
      expect(Array.isArray(response.panels)).toBe(true)
      expect(response.configured).toBe(2)
      expect(response.total).toBe(2)
    })

    it('panel results include required fields', () => {
      const panel = makePanelResult()
      expect(panel.id).toBeTruthy()
      expect(panel.name).toBeTruthy()
      expect(['ok', 'warn', 'error']).toContain(panel.status)
      expect(panel.lastUpdated).toBeTruthy()
      expect(typeof panel.cached).toBe('boolean')
      expect(typeof panel.ttl).toBe('number')
    })

    it('empty panels array produces valid response', () => {
      const panels: PanelResult[] = []
      const response = {
        panels,
        globalHealth: computeGlobalHealth(panels),
        lastRefresh: new Date().toISOString(),
        configured: panels.length,
        total: panels.length,
      }

      expect(response.panels).toEqual([])
      expect(response.configured).toBe(0)
      expect(response.globalHealth).toBe('ok')
    })
  })

  describe('globalHealth computation from panel data', () => {
    it('returns ok when all panels are ok', () => {
      const panels = [
        makePanelResult({ status: 'ok' }),
        makePanelResult({ status: 'ok' }),
        makePanelResult({ status: 'ok' }),
      ]
      expect(computeGlobalHealth(panels)).toBe('ok')
    })

    it('returns warn when any panel warns', () => {
      const panels = [
        makePanelResult({ status: 'ok' }),
        makePanelResult({ status: 'warn' }),
        makePanelResult({ status: 'ok' }),
      ]
      expect(computeGlobalHealth(panels)).toBe('warn')
    })

    it('returns error when any panel errors', () => {
      const panels = [
        makePanelResult({ status: 'ok' }),
        makePanelResult({ status: 'error' }),
        makePanelResult({ status: 'ok' }),
      ]
      expect(computeGlobalHealth(panels)).toBe('error')
    })

    it('error takes precedence over warn', () => {
      const panels = [
        makePanelResult({ status: 'warn' }),
        makePanelResult({ status: 'error' }),
        makePanelResult({ status: 'ok' }),
      ]
      expect(computeGlobalHealth(panels)).toBe('error')
    })

    it('returns ok for empty panels', () => {
      expect(computeGlobalHealth([])).toBe('ok')
    })

    it('returns error when all panels error', () => {
      const panels = [makePanelResult({ status: 'error' }), makePanelResult({ status: 'error' })]
      expect(computeGlobalHealth(panels)).toBe('error')
    })

    it('returns warn when mix of ok and warn only', () => {
      const panels = [
        makePanelResult({ status: 'ok' }),
        makePanelResult({ status: 'warn' }),
        makePanelResult({ status: 'warn' }),
      ]
      expect(computeGlobalHealth(panels)).toBe('warn')
    })
  })
})
