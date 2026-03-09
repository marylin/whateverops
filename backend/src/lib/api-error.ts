const DEFAULT_HINTS: Record<number, string> = {
  400: 'Bad request — verify your API key format in .env',
  401: 'Authentication failed — API key or token is invalid or expired',
  403: 'Access denied — token may lack required permissions',
  404: 'Resource not found — check your configuration in .env',
  422: 'Invalid request — check configuration parameters',
  429: 'Rate limited — too many requests, will retry automatically',
  500: 'Internal server error — the service may be experiencing issues',
  502: 'Bad gateway — the service may be temporarily down',
  503: 'Service unavailable — try again later',
  504: 'Gateway timeout — the service is not responding',
}

export function apiError(status: number, overrides?: Record<number, string>): string {
  return overrides?.[status] ?? DEFAULT_HINTS[status] ?? `Unexpected error (HTTP ${status})`
}

export function graphQLError(errors: unknown[]): string {
  if (!Array.isArray(errors) || errors.length === 0) return 'Unknown GraphQL error'
  const messages = errors
    .map((e) =>
      typeof e === 'object' && e !== null && 'message' in e
        ? (e as { message: string }).message
        : null,
    )
    .filter(Boolean)
  return messages.length > 0 ? messages.join('; ') : 'Unknown GraphQL error'
}
