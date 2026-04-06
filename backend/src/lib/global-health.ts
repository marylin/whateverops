/**
 * Compute aggregate health from integration results.
 * error > warn > ok
 */
export function computeGlobalHealth(
  results: { status: 'ok' | 'warn' | 'error' }[],
): 'ok' | 'warn' | 'error' {
  if (results.some((r) => r.status === 'error')) return 'error'
  if (results.some((r) => r.status === 'warn')) return 'warn'
  return 'ok'
}
