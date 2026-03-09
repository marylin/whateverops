import { describe, test, expect, mock } from 'bun:test'
import { withRetry } from '../../../backend/src/lib/retry'

describe('withRetry', () => {
  test('returns result on first success', async () => {
    const fn = mock(() => Promise.resolve('ok'))
    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('retries on failure and succeeds', async () => {
    let calls = 0
    const fn = mock(() => {
      calls++
      if (calls < 3) throw new Error('fail')
      return Promise.resolve('recovered')
    })

    const result = await withRetry(fn, { baseDelayMs: 10 })
    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('throws after all attempts exhausted', async () => {
    const fn = mock(() => Promise.reject(new Error('always fails')))

    await expect(withRetry(fn, { maxAttempts: 2, baseDelayMs: 10 })).rejects.toThrow('always fails')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('respects timeout per attempt', async () => {
    const fn = mock(() => new Promise((resolve) => setTimeout(() => resolve('too late'), 5000)))

    await expect(
      withRetry(fn, { maxAttempts: 1, timeoutMs: 50, baseDelayMs: 10 }),
    ).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('uses exponential backoff between retries', async () => {
    const timestamps: number[] = []
    let calls = 0
    const fn = mock(() => {
      timestamps.push(Date.now())
      calls++
      if (calls < 3) throw new Error('fail')
      return Promise.resolve('ok')
    })

    await withRetry(fn, { maxAttempts: 3, baseDelayMs: 50 })

    // First retry should wait ~50ms, second ~100ms
    if (timestamps.length >= 2) {
      const firstGap = timestamps[1]! - timestamps[0]!
      expect(firstGap).toBeGreaterThanOrEqual(30) // Allow some tolerance
    }
    if (timestamps.length >= 3) {
      const secondGap = timestamps[2]! - timestamps[1]!
      expect(secondGap).toBeGreaterThanOrEqual(60) // ~100ms with tolerance
    }
  })

  test('passes abort signal to function', async () => {
    let receivedSignal: AbortSignal | undefined
    const fn = mock((signal: AbortSignal) => {
      receivedSignal = signal
      return Promise.resolve('ok')
    })

    await withRetry(fn)
    expect(receivedSignal).toBeDefined()
    expect(receivedSignal!.aborted).toBe(false)
  })
})
