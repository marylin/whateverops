import { describe, it, expect } from 'bun:test'
import { withInstance } from '../../../backend/src/lib/integration-registry'

describe('withInstance', () => {
  const baseMod = {
    INTEGRATION_ID: 'github',
    INTEGRATION_NAME: 'GitHub',
    someOtherProp: 42,
  }

  it('patches INTEGRATION_ID with a dash-separated suffix', () => {
    const patched = withInstance(baseMod, 2)
    expect(patched.INTEGRATION_ID).toBe('github-2')
  })

  it('patches INTEGRATION_NAME with instance number in parentheses', () => {
    const patched = withInstance(baseMod, 3)
    expect(patched.INTEGRATION_NAME).toBe('GitHub (3)')
  })

  it('preserves all other module properties unchanged', () => {
    const patched = withInstance(baseMod, 2)
    expect(patched.someOtherProp).toBe(42)
  })

  it('does not mutate the original module', () => {
    withInstance(baseMod, 2)
    expect(baseMod.INTEGRATION_ID).toBe('github')
    expect(baseMod.INTEGRATION_NAME).toBe('GitHub')
  })
})
