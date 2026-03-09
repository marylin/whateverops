import { z } from 'zod'
import { quickHash } from '../lib/hash.js'

export const INTEGRATION_ID = 'openai' as const
export const INTEGRATION_NAME = 'OpenAI'
export const DEFAULT_TTL = 300

export const CONFIG_SCHEMA = z.object({
  apiKey: z.string().min(1, 'OpenAI API key required'),
  orgId: z.string().default(''),
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
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
  }
  if (config.orgId) headers['OpenAI-Organization'] = config.orgId

  const res = await fetch('https://api.openai.com/v1/models', {
    headers,
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    if (res.status === 401) return { models: [], keyValid: false }
    throw new Error(`OpenAI API error: ${res.status}`)
  }

  const body = (await res.json()) as { data?: Array<{ id?: string }> }
  const models = (body.data ?? [])
    .map((m) => m.id ?? '')
    .filter(Boolean)
    .sort()

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
  const hash = quickHash(config.apiKey + config.orgId)
    .toString(36)
    .slice(0, 8)
  return `integration:${INTEGRATION_ID}:${hash}`
}

export function getHealthStatus(raw: RawData): 'ok' | 'warn' | 'error' {
  if (!raw.keyValid) return 'error'
  return 'ok'
}
