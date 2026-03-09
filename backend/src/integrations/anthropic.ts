import { z } from 'zod'
import { quickHash } from '../lib/hash.js'
import { apiError } from '../lib/api-error.js'

export const INTEGRATION_ID = 'anthropic' as const
export const INTEGRATION_NAME = 'Anthropic'
export const DEFAULT_TTL = 300

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'Anthropic API key required'),
})

export type IntegrationConfig = z.infer<typeof CONFIG_SCHEMA>

export interface RawData {
  models: string[]
  keyValid: boolean
}

export interface PanelData {
  keyValid: boolean
  availableModels: string[]
  modelCount: number
}

export async function fetchData(config: IntegrationConfig): Promise<RawData> {
  // Anthropic doesn't have a usage API — validate key by listing models
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    if (res.status === 401) return { models: [], keyValid: false }
    throw new Error(
      apiError(res.status, {
        403: 'API key lacks permissions — check key settings at console.anthropic.com',
      }),
    )
  }

  const body = (await res.json()) as { data?: Array<{ id?: string }> }
  const models = (body.data ?? []).map((m) => m.id ?? '').filter(Boolean)

  return { models, keyValid: true }
}

export function parsePanel(raw: RawData): PanelData {
  return {
    keyValid: raw.keyValid ?? false,
    availableModels: raw.models ?? [],
    modelCount: raw.models?.length ?? 0,
  }
}

export function getCacheKey(config: IntegrationConfig): string {
  const hash = quickHash(config.apiKey).toString(36).slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.keyValid) return 'error'
  return 'ok'
}
