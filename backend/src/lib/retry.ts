/**
 * Retry wrapper with exponential backoff and timeout.
 * Used by runIntegration to make all integrations resilient.
 */

export interface RetryOptions {
  /** Maximum number of attempts (default: 3 = 1 initial + 2 retries) */
  maxAttempts?: number
  /** Timeout per attempt in ms (default: 10000) */
  timeoutMs?: number
  /** Base delay between retries in ms (default: 1000) */
  baseDelayMs?: number
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  timeoutMs: 10_000,
  baseDelayMs: 1_000,
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    promise.then(
      (val) => {
        clearTimeout(timer)
        resolve(val)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

export async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const controller = new AbortController()

    try {
      const result = await withTimeout(fn(controller.signal), opts.timeoutMs)
      return result
    } catch (err) {
      controller.abort()
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't delay after the last attempt
      if (attempt < opts.maxAttempts) {
        const delay = opts.baseDelayMs * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError ?? new Error('All retry attempts failed')
}
