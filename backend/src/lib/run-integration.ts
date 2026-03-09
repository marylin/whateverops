import { cacheGet, cacheSet } from '../cache/index.js'
import { withRetry } from './retry.js'

export interface IntegrationResult<T = unknown> {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  data: T | null
  error: string | null
  cached: boolean
  lastUpdated: string
  ttl: number
}

interface IntegrationModule<TConfig, TRaw, TPanel> {
  INTEGRATION_ID: string
  INTEGRATION_NAME: string
  DEFAULT_TTL: number
  fetchData: (config: TConfig) => Promise<TRaw>
  parsePanel: (raw: TRaw) => TPanel
  getCacheKey: (config: TConfig) => string
  getHealthStatus: (raw: TRaw) => 'ok' | 'warn' | 'error'
}

export async function runIntegration<TConfig, TRaw, TPanel>(
  mod: IntegrationModule<TConfig, TRaw, TPanel>,
  config: TConfig,
): Promise<IntegrationResult<TPanel>> {
  const cacheKey = mod.getCacheKey(config)

  const cached = await cacheGet<{
    panel: TPanel
    health: 'ok' | 'warn' | 'error'
    fetchedAt: string
  }>(cacheKey)
  if (cached) {
    return {
      id: mod.INTEGRATION_ID,
      name: mod.INTEGRATION_NAME,
      status: cached.health,
      data: cached.panel,
      error: null,
      cached: true,
      lastUpdated: cached.fetchedAt,
      ttl: mod.DEFAULT_TTL,
    }
  }

  try {
    // 10s timeout per attempt, 2 retries (3 total), exponential backoff
    const raw = await withRetry(() => mod.fetchData(config), {
      maxAttempts: 3,
      timeoutMs: 10_000,
      baseDelayMs: 1_000,
    })
    const panel = mod.parsePanel(raw)
    const health = mod.getHealthStatus(raw)

    const fetchedAt = new Date().toISOString()
    await cacheSet(cacheKey, { panel, health, fetchedAt }, mod.DEFAULT_TTL)

    return {
      id: mod.INTEGRATION_ID,
      name: mod.INTEGRATION_NAME,
      status: health,
      data: panel,
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: mod.DEFAULT_TTL,
    }
  } catch (err) {
    // Never throw — always return error result
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      id: mod.INTEGRATION_ID,
      name: mod.INTEGRATION_NAME,
      status: 'error',
      data: null,
      error: message,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: mod.DEFAULT_TTL,
    }
  }
}
