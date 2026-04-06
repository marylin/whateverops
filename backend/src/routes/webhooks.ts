import { Hono } from 'hono'
import { logger } from '../lib/logger.js'

const webhooks = new Hono()

/**
 * n8n sends webhooks here for deploy events, error alerts, etc.
 * Validates the webhook secret header before processing.
 */
webhooks.post('/n8n/:event', async (c) => {
  const secret = c.req.header('x-webhook-secret')
  const expected = process.env.N8N_WEBHOOK_SECRET

  if (!expected || secret !== expected) {
    return c.json({ error: 'Unauthorized', status: 401, timestamp: new Date().toISOString() }, 401)
  }

  const event = c.req.param('event')
  const payload = await c.req.json()

  logger.info({ event, payload: JSON.stringify(payload).slice(0, 200) }, 'n8n webhook received')

  return c.json({
    received: true,
    event,
    timestamp: new Date().toISOString(),
  })
})

export default webhooks
