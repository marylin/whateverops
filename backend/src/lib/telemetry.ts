import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { logger } from './logger.js'

const HEARTBEAT_URL = 'https://dxruinyzdbwgxfucvygx.supabase.co/functions/v1/telemetry-heartbeat'
const HEARTBEAT_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24 hours
const STARTUP_DELAY_MS = 60_000 // 60 seconds
const INSTANCE_ID_FILE = resolve(process.cwd(), '..', '.whateverops-instance-id')

function getOrCreateInstanceId(): string {
  try {
    if (existsSync(INSTANCE_ID_FILE)) {
      const id = readFileSync(INSTANCE_ID_FILE, 'utf-8').trim()
      if (id) return id
    }
  } catch {
    // File read failed — generate new ID
  }

  const id = randomUUID()
  try {
    writeFileSync(INSTANCE_ID_FILE, id, 'utf-8')
  } catch {
    // Write failed (read-only fs, Docker, etc.) — use ephemeral ID
  }
  return id
}

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'))
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

async function sendHeartbeat(
  instanceId: string,
  version: string,
  configuredCount: number,
): Promise<void> {
  await fetch(HEARTBEAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instanceId,
      version,
      configuredCount,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => {})
}

export function startTelemetry(configuredCount: number): void {
  const instanceId = getOrCreateInstanceId()
  const version = getVersion()

  logger.debug({ instanceId }, 'Telemetry initialized')

  // First heartbeat after 60s delay
  setTimeout(() => {
    sendHeartbeat(instanceId, version, configuredCount)

    // Then every 24 hours
    setInterval(() => {
      sendHeartbeat(instanceId, version, configuredCount)
    }, HEARTBEAT_INTERVAL_MS)
  }, STARTUP_DELAY_MS)
}
