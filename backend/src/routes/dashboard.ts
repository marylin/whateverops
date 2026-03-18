import { Hono } from 'hono'
import { buildConfiguredIntegrations, computeGlobalHealth } from '../lib/integration-registry.js'

const dashboard = new Hono()

dashboard.get('/', async (c) => {
  // All integrations run in parallel — never sequential
  const results = await Promise.all(buildConfiguredIntegrations())

  return c.json({
    panels: results,
    globalHealth: computeGlobalHealth(results),
    lastRefresh: new Date().toISOString(),
    configured: results.length,
    total: results.length,
  })
})

export default dashboard
