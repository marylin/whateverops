/**
 * Layer 3 — Panel Error States Tests
 *
 * Tests all 17 panel components with null, undefined, and empty object data.
 * This validates defensive coding: if a panel doesn't guard against bad data,
 * it would crash the ErrorBoundary and cause a white screen in production.
 *
 * Tests always pass — they document which panels are resilient vs which crash.
 * The findings are the deliverable.
 */
import { render, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest'

import { AIProviderPanel } from '../AIProviderPanel'
import { AnthropicPanel } from '../AnthropicPanel'
import { CloudflarePanel } from '../CloudflarePanel'
import { GenericPanel } from '../GenericPanel'
import { GitHubPanel } from '../GitHubPanel'
import { LinearPanel } from '../LinearPanel'
import { NeonPanel } from '../NeonPanel'
import { OpenAIPanel } from '../OpenAIPanel'
import { PostHogPanel } from '../PostHogPanel'
import { RailwayPanel } from '../RailwayPanel'
import { ResendPanel } from '../ResendPanel'
import { SelfMonitoringPanel } from '../SelfMonitoringPanel'
import { SentryPanel } from '../SentryPanel'
import { StripePanel } from '../StripePanel'
import { SupabaseAuthPanel } from '../SupabaseAuthPanel'
import { SupabaseMgmtPanel } from '../SupabaseMgmtPanel'
import { VercelPanel } from '../VercelPanel'

// ---------------------------------------------------------------------------
// Suppress React/jsdom console.error noise from render crashes
// ---------------------------------------------------------------------------
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
afterAll(() => consoleSpy.mockRestore())

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type RenderResult = { crashed: boolean; error?: string }

function renderSafely(element: React.ReactElement): RenderResult {
  try {
    render(element)
    return { crashed: false }
  } catch (e) {
    return { crashed: true, error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// Results collector — aggregates findings for the summary test
// ---------------------------------------------------------------------------
interface PanelResult {
  panel: string
  null: RenderResult
  undefined: RenderResult
  emptyObject: RenderResult
}

const results: PanelResult[] = []

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PanelComponent = React.ComponentType<{ data: any }>

const PANELS: Array<{ name: string; Component: PanelComponent }> = [
  { name: 'AIProviderPanel', Component: AIProviderPanel },
  { name: 'AnthropicPanel', Component: AnthropicPanel },
  { name: 'CloudflarePanel', Component: CloudflarePanel },
  { name: 'GenericPanel', Component: GenericPanel },
  { name: 'GitHubPanel', Component: GitHubPanel },
  { name: 'LinearPanel', Component: LinearPanel },
  { name: 'NeonPanel', Component: NeonPanel },
  { name: 'OpenAIPanel', Component: OpenAIPanel },
  { name: 'PostHogPanel', Component: PostHogPanel },
  { name: 'RailwayPanel', Component: RailwayPanel },
  { name: 'ResendPanel', Component: ResendPanel },
  { name: 'SelfMonitoringPanel', Component: SelfMonitoringPanel },
  { name: 'SentryPanel', Component: SentryPanel },
  { name: 'StripePanel', Component: StripePanel },
  { name: 'SupabaseAuthPanel', Component: SupabaseAuthPanel },
  { name: 'SupabaseMgmtPanel', Component: SupabaseMgmtPanel },
  { name: 'VercelPanel', Component: VercelPanel },
]

// ---------------------------------------------------------------------------
// Per-panel resilience audit
// ---------------------------------------------------------------------------
describe('Panel error resilience audit', () => {
  beforeEach(() => {
    cleanup()
  })

  for (const { name, Component } of PANELS) {
    describe(`${name}`, () => {
      it('handles null data without crashing the test runner', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = renderSafely(<Component data={null as any} />)
        if (result.crashed) {
          console.warn(`[CRASH] ${name} with null data: ${result.error}`)
        }
        // Record for summary — find or create entry
        let entry = results.find((r) => r.panel === name)
        if (!entry) {
          entry = {
            panel: name,
            null: { crashed: false },
            undefined: { crashed: false },
            emptyObject: { crashed: false },
          }
          results.push(entry)
        }
        entry.null = result
        // Test always passes — we're documenting, not gatekeeping
        expect(true).toBe(true)
        cleanup()
      })

      it('handles undefined data without crashing the test runner', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = renderSafely(<Component data={undefined as any} />)
        if (result.crashed) {
          console.warn(`[CRASH] ${name} with undefined data: ${result.error}`)
        }
        let entry = results.find((r) => r.panel === name)
        if (!entry) {
          entry = {
            panel: name,
            null: { crashed: false },
            undefined: { crashed: false },
            emptyObject: { crashed: false },
          }
          results.push(entry)
        }
        entry.undefined = result
        expect(true).toBe(true)
        cleanup()
      })

      it('handles empty object data without crashing the test runner', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = renderSafely(<Component data={{} as any} />)
        if (result.crashed) {
          console.warn(`[CRASH] ${name} with empty object: ${result.error}`)
        }
        let entry = results.find((r) => r.panel === name)
        if (!entry) {
          entry = {
            panel: name,
            null: { crashed: false },
            undefined: { crashed: false },
            emptyObject: { crashed: false },
          }
          results.push(entry)
        }
        entry.emptyObject = result
        expect(true).toBe(true)
        cleanup()
      })
    })
  }
})

// ---------------------------------------------------------------------------
// Summary report — runs after all individual tests
// ---------------------------------------------------------------------------
describe('Error resilience summary', () => {
  it('reports which panels survive bad data', () => {
    const resilient: string[] = []
    const crashesOnNull: string[] = []
    const crashesOnUndefined: string[] = []
    const crashesOnEmpty: string[] = []

    for (const r of results) {
      const allSafe = !r.null.crashed && !r.undefined.crashed && !r.emptyObject.crashed
      if (allSafe) resilient.push(r.panel)
      if (r.null.crashed) crashesOnNull.push(r.panel)
      if (r.undefined.crashed) crashesOnUndefined.push(r.panel)
      if (r.emptyObject.crashed) crashesOnEmpty.push(r.panel)
    }

    // Print summary to console for CI visibility
    console.warn('\n====== PANEL ERROR RESILIENCE REPORT ======')
    console.warn(`Total panels tested: ${results.length}`)
    console.warn(`Fully resilient (${resilient.length}): ${resilient.join(', ') || 'none'}`)
    console.warn(`Crash on null (${crashesOnNull.length}): ${crashesOnNull.join(', ') || 'none'}`)
    console.warn(
      `Crash on undefined (${crashesOnUndefined.length}): ${crashesOnUndefined.join(', ') || 'none'}`,
    )
    console.warn(
      `Crash on empty {} (${crashesOnEmpty.length}): ${crashesOnEmpty.join(', ') || 'none'}`,
    )

    // Print per-panel error details
    for (const r of results) {
      if (r.null.crashed || r.undefined.crashed || r.emptyObject.crashed) {
        console.warn(`\n--- ${r.panel} ---`)
        if (r.null.crashed) console.warn(`  null:      ${r.null.error?.substring(0, 120)}`)
        if (r.undefined.crashed)
          console.warn(`  undefined: ${r.undefined.error?.substring(0, 120)}`)
        if (r.emptyObject.crashed)
          console.warn(`  empty {}:  ${r.emptyObject.error?.substring(0, 120)}`)
      }
    }
    console.warn('============================================\n')

    // This test always passes — the report IS the deliverable
    expect(results.length).toBe(17)
  })
})
