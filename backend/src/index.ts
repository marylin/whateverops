import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

app.use('*', cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use('*', logger())

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
)

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
}
