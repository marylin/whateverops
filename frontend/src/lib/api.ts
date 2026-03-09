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
