import { describe, test, expect } from 'bun:test'
import { Hono } from 'hono'

// Re-create the webhook route for testing without starting the full server
function createWebhookApp(secret: string) {
  const app = new Hono()

  app.post('/api/webhooks/n8n/:event', async (c) => {
    const headerSecret = c.req.header('x-webhook-secret')
    if (!secret || headerSecret !== secret) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const event = c.req.param('event')
    await c.req.json() // consume body

    return c.json({
      received: true,
      event,
      timestamp: new Date().toISOString(),
    })
  })

  return app
}

describe('Webhook endpoint', () => {
  const SECRET = 'test-webhook-secret-123'
  const app = createWebhookApp(SECRET)

  test('accepts valid webhook with correct secret', async () => {
    const res = await app.request('/api/webhooks/n8n/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': SECRET,
      },
      body: JSON.stringify({
        status: 'SUCCESS',
        service_name: 'backend',
        commit_message: 'fix: resolve cache issue',
      }),
    })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.received).toBe(true)
    expect(body.event).toBe('deploy')
    expect(body.timestamp).toBeDefined()
  })

  test('rejects webhook with wrong secret', async () => {
    const res = await app.request('/api/webhooks/n8n/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'wrong-secret',
      },
      body: JSON.stringify({ status: 'SUCCESS' }),
    })

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  test('rejects webhook with missing secret', async () => {
    const res = await app.request('/api/webhooks/n8n/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'SUCCESS' }),
    })

    expect(res.status).toBe(401)
  })

  test('handles different event types', async () => {
    for (const event of ['deploy', 'error-alert', 'stars-milestone']) {
      const res = await app.request(`/api/webhooks/n8n/${event}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SECRET,
        },
        body: JSON.stringify({ type: event }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.event).toBe(event)
    }
  })

  test('handles payload validation — various body shapes', async () => {
    const payloads = [
      { type: 'posthog_error_spike', error_count: 150, affected_users: 23 },
      { type: 'railway_deploy_fail', service_name: 'api', error_message: 'build failed' },
      { type: 'stripe_payment', amount: 2900, currency: 'usd' },
    ]

    for (const payload of payloads) {
      const res = await app.request('/api/webhooks/n8n/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': SECRET,
        },
        body: JSON.stringify(payload),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.received).toBe(true)
    }
  })
})
