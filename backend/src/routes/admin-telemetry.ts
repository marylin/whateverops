import { Hono } from 'hono'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

const SUPABASE_URL = 'https://jgjzbgwmkiqcitszlodf.supabase.co'

function getClient() {
  const key = process.env.SUPABASE_ADMIN_SERVICE_KEY
  if (!key) throw new Error('SUPABASE_ADMIN_SERVICE_KEY not set')
  return createClient(SUPABASE_URL, key)
}

app.get('/', async (c) => {
  const supabase = getClient()

  // Active instances (heartbeat in last 48h)
  const { data: activeInstances } = await supabase
    .from('telemetry_heartbeats')
    .select('instance_id')
    .gte('received_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())

  const uniqueActive = new Set(activeInstances?.map((r) => r.instance_id) ?? [])

  // All instances (first seen, last seen, heartbeat count)
  const { data: allHeartbeats } = await supabase
    .from('telemetry_heartbeats')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(500)

  const rows = allHeartbeats ?? []

  // Instance timeline
  const instanceMap = new Map<
    string,
    {
      firstSeen: string
      lastSeen: string
      heartbeats: number
      version: string
      platform: string
      configuredCount: number
      lastUptime: number
    }
  >()

  for (const row of rows) {
    const existing = instanceMap.get(row.instance_id)
    if (!existing) {
      instanceMap.set(row.instance_id, {
        firstSeen: row.received_at,
        lastSeen: row.received_at,
        heartbeats: 1,
        version: row.version,
        platform: row.platform ?? 'unknown',
        configuredCount: row.configured_count,
        lastUptime: row.uptime_seconds,
      })
    } else {
      existing.heartbeats++
      if (row.received_at < existing.firstSeen) existing.firstSeen = row.received_at
      if (row.received_at > existing.lastSeen) {
        existing.lastSeen = row.received_at
        existing.version = row.version
        existing.platform = row.platform ?? 'unknown'
        existing.configuredCount = row.configured_count
        existing.lastUptime = row.uptime_seconds
      }
    }
  }

  // Version distribution
  const versionCounts: Record<string, number> = {}
  for (const inst of instanceMap.values()) {
    versionCounts[inst.version] = (versionCounts[inst.version] ?? 0) + 1
  }

  // Platform distribution
  const platformCounts: Record<string, number> = {}
  for (const inst of instanceMap.values()) {
    platformCounts[inst.platform] = (platformCounts[inst.platform] ?? 0) + 1
  }

  // Average uptime (from latest heartbeat per instance)
  const uptimes = [...instanceMap.values()].map((i) => i.lastUptime)
  const avgUptimeHours =
    uptimes.length > 0
      ? Math.round((uptimes.reduce((a, b) => a + b, 0) / uptimes.length / 3600) * 10) / 10
      : 0

  // Average configured integrations
  const configs = [...instanceMap.values()].map((i) => i.configuredCount)
  const avgConfigured =
    configs.length > 0
      ? Math.round((configs.reduce((a, b) => a + b, 0) / configs.length) * 10) / 10
      : 0

  // Weekly trend (heartbeats per week)
  const weeklyMap: Record<string, Set<string>> = {}
  for (const row of rows) {
    const week = row.received_at.slice(0, 10) // date only
    if (!weeklyMap[week]) weeklyMap[week] = new Set()
    weeklyMap[week].add(row.instance_id)
  }
  const dailyTrend = Object.entries(weeklyMap)
    .map(([date, ids]) => ({ date, instances: ids.size }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Instances detail
  const instances = [...instanceMap.entries()]
    .map(([id, data]) => ({
      instanceId: id.slice(0, 8) + '...',
      ...data,
      lastUptimeFormatted: formatUptime(data.lastUptime),
      isActive: uniqueActive.has(id),
    }))
    .sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0))

  return c.json({
    summary: {
      totalInstances: instanceMap.size,
      activeInstances: uniqueActive.size,
      totalHeartbeats: rows.length,
      avgUptimeHours,
      avgConfiguredIntegrations: avgConfigured,
    },
    versionDistribution: versionCounts,
    platformDistribution: platformCounts,
    dailyTrend,
    instances,
  })
})

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default app
