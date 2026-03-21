const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface IntegrationResult {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  data: Record<string, unknown> | null
  error: string | null
  cached: boolean
  lastUpdated: string
  ttl: number
}

export interface DashboardResponse {
  panels: IntegrationResult[]
  globalHealth: 'ok' | 'warn' | 'error'
  lastRefresh: string
  configured: number
  total: number
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${API_URL}/api/dashboard`)
  if (!res.ok) throw new Error(`Dashboard API error: ${res.status}`)
  return res.json() as Promise<DashboardResponse>
}

export interface StatusEntry {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  lastChecked: string
}

export interface StatusResponse {
  services: StatusEntry[]
  globalHealth: 'ok' | 'warn' | 'error'
  lastRefresh: string
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status`)
  if (!res.ok) throw new Error(`Status API error: ${res.status}`)
  return res.json() as Promise<StatusResponse>
}
