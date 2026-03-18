import { Hono } from 'hono'
import { buildConfiguredIntegrations, computeGlobalHealth } from '../lib/integration-registry.js'

const status = new Hono()

export interface StatusEntry {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  lastChecked: string
}

status.get('/', async (c) => {
  const results = await Promise.all(buildConfiguredIntegrations())

  // Return minimal health summary — no panel data exposed publicly
  const entries: StatusEntry[] = results.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    lastChecked: r.lastUpdated,
  }))

  return c.json({
    services: entries,
    globalHealth: computeGlobalHealth(entries),
    lastRefresh: new Date().toISOString(),
  })
})

export default status
