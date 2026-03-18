import { z } from 'zod'
import { quickHash } from '../lib/hash.js'

export const INTEGRATION_ID = 'self-monitoring' as const
export const INTEGRATION_NAME = 'WhateverOPS'
export const DEFAULT_TTL = 60

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Self-monitoring key required'),
  healthUrl: z.string().url('Health URL must be a valid URL'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  status: 'ok' | 'error'
  uptime: number
  timestamp: string
  responseTimeMs: number
}

export interface PanelData {
  status: 'ok' | 'error'
  uptime: string
  lastChecked: string
  responseTime_ms: number
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  const start = Date.now()
  const res = await fetch(config.healthUrl, {
    signal: AbortSignal.timeout(10_000),
    headers: { 'X-Self-Monitor': config.apiKey },
  })

  const responseTimeMs = Date.now() - start

  if (!res.ok) {
    return {
      status: 'error',
      uptime: 0,
      timestamp: new Date().toISOString(),
      responseTimeMs,
    }
  }

  const body = (await res.json()) as { status?: string; uptime?: number; timestamp?: string }

  return {
    status: body.status === 'ok' ? 'ok' : 'error',
    uptime: body.uptime ?? 0,
    timestamp: body.timestamp ?? new Date().toISOString(),
    responseTimeMs,
  }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    status: raw.status ?? 'error',
    uptime: formatUptime(raw.uptime ?? 0),
    lastChecked: raw.timestamp ?? new Date().toISOString(),
    responseTime_ms: raw.responseTimeMs ?? 0,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey + config.healthUrl)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (raw.status !== 'ok') return 'error'
  if (raw.responseTimeMs > 5000) return 'warn'
  return 'ok'
}
