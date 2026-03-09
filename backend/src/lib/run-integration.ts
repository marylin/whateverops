import { cacheGet, cacheSet } from '../cache/index.js'

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

  const cached = cacheGet<{ panel: TPanel; health: 'ok' | 'warn' | 'error' }>(cacheKey)
  if (cached) {
    return {
      id: mod.INTEGRATION_ID,
      name: mod.INTEGRATION_NAME,
      status: cached.health,
      data: cached.panel,
      error: null,
      cached: true,
      lastUpdated: new Date().toISOString(),
      ttl: mod.DEFAULT_TTL,
    }
  }

  try {
    const raw = await mod.fetchData(config)
    const panel = mod.parsePanel(raw)
    const health = mod.getHealthStatus(raw)

    cacheSet(cacheKey, { panel, health }, mod.DEFAULT_TTL)

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
