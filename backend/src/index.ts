import { config } from 'dotenv'
config({ path: '../.env' })
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { errorHandler } from './middleware/error.js'
import dashboard from './routes/dashboard.js'

const app = new Hono()

app.use('*', errorHandler)
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow any localhost origin in development
      if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return origin
      return process.env.FRONTEND_URL ?? 'http://localhost:5173'
    },
  }),
)
app.use('*', logger())

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
)

app.route('/api/dashboard', dashboard)

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
