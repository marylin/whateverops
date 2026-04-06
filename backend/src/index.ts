import { env } from './lib/env.js'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { cors } from 'hono/cors'
import { logger, requestLogger } from './lib/logger.js'
import { secureHeaders } from 'hono/secure-headers'
import { rateLimit } from './middleware/rate-limit.js'
import dashboard from './routes/dashboard.js'
import settings from './routes/settings.js'
import webhooks from './routes/webhooks.js'
import status from './routes/status.js'
import adminTelemetry from './routes/admin-telemetry.js'
import { startTelemetry } from './lib/telemetry.js'
import { INTEGRATION_ENV_MAP } from './lib/integration-env-map.js'

type AppEnv = { Variables: { requestId: string } }

const app = new Hono<AppEnv>()

app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow any localhost origin in development
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return origin
      return env.FRONTEND_URL ?? 'http://localhost:5173'
    },
  }),
)
// Security headers — applied after CORS so CORS headers are not overwritten
app.use('*', secureHeaders())
app.use('*', requestLogger())

// Route-level rate limits (sliding window, in-memory)
app.use('/api/dashboard/*', rateLimit('dashboard', { limit: 60, windowMs: 60_000 }))
app.use('/api/status/*', rateLimit('status', { limit: 120, windowMs: 60_000 }))
app.use('/api/webhooks/*', rateLimit('webhooks', { limit: 30, windowMs: 60_000 }))

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
)

app.route('/api/dashboard', dashboard)
app.route('/api/settings', settings)
app.route('/api/webhooks', webhooks)
app.route('/api/status', status)
app.route('/api/admin/telemetry', adminTelemetry)

app.notFound((c) =>
  c.json({ error: 'Not found', status: 404, timestamp: new Date().toISOString() }, 404),
)

app.onError((err, c) => {
  const message = err instanceof Error ? err.message : 'Internal server error'
  const status = (err as { status?: number }).status ?? 500
  logger.error(
    { method: c.req.method, path: c.req.path, status, requestId: c.get('requestId') },
    message,
  )
  return c.json(
    { error: message, status, timestamp: new Date().toISOString() },
    status as ContentfulStatusCode,
  )
})

const port = env.PORT

serve({ fetch: app.fetch, port }, () => {
  logger.info({ port }, 'Backend running')
  startTelemetry(
    Object.keys(INTEGRATION_ENV_MAP).filter((id) => {
      const fields = INTEGRATION_ENV_MAP[id]
      return (
        id === 'self-monitoring' ||
        (fields != null && Object.values(fields).some((envVar) => Boolean(process.env[envVar])))
      )
    }).length,
  )
})
