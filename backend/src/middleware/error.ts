import type { Context, Next } from 'hono'

/**
 * Global error handler — catches any unhandled errors in routes
 * and returns a consistent JSON error response. Never crashes the server.
 */
export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = (err as { status?: number }).status ?? 500

    console.error(`[error] ${c.req.method} ${c.req.path}:`, message)

    return c.json(
      {
        error: message,
        status,
        timestamp: new Date().toISOString(),
      },
      status as 500,
    )
  }
}
