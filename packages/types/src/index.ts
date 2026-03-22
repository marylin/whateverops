export const INTEGRATION_IDS = [
  'vercel',
  'railway',
  'neon',
  'github',
  'posthog',
  'linear',
  'anthropic',
  'openai',
  'supabase-management',
  'supabase-auth',
  'resend',
  'stripe',
  'sentry',
  'cloudflare',
] as const

export type IntegrationId = (typeof INTEGRATION_IDS)[number]

export type PanelStatus = 'ok' | 'warn' | 'error' | 'loading' | 'offline'

export interface PanelMeta {
  id: IntegrationId
  name: string
  status: PanelStatus
  lastUpdated: string | null
  ttl: number
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  uptime: number
  timestamp: string
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export interface DashboardState {
  panels: PanelMeta[]
  globalHealth: PanelStatus
  lastRefresh: string
}
