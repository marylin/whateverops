import { randomUUID } from 'crypto'
import pino from 'pino'
import type { Context, MiddlewareHandler, Next } from 'hono'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
})

export function requestLogger(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const requestId = c.req.header('x-request-id') ?? randomUUID()
    c.set('requestId', requestId)
    c.header('X-Request-ID', requestId)

    const start = Date.now()
    const method = c.req.method
    const path = c.req.path

    logger.info({ requestId, method, path }, 'request start')

    await next()

    const duration = Date.now() - start
    const status = c.res.status

    logger.info({ requestId, method, path, status, duration }, 'request end')
  }
}
