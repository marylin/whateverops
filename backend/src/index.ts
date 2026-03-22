import { config } from 'dotenv'
config({ path: '../.env' })
import { env } from './lib/env.js'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger, requestLogger } from './lib/logger.js'
import { secureHeaders } from 'hono/secure-headers'
import { errorHandler } from './middleware/error.js'
import { rateLimit } from './middleware/rate-limit.js'
import dashboard from './routes/dashboard.js'
import webhooks from './routes/webhooks.js'
import status from './routes/status.js'

const app = new Hono()

app.use('*', errorHandler)
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
app.route('/api/webhooks', webhooks)
app.route('/api/status', status)

const port = env.PORT

serve({ fetch: app.fetch, port }, () => {
  logger.info({ port }, 'Backend running')
})
