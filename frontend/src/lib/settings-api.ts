const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface IntegrationEnvVar {
  field: string
  varName: string
  set: boolean
}

export interface IntegrationSummary {
  id: string
  name: string
  configured: boolean
  envVars: IntegrationEnvVar[]
}

export interface SettingsResponse {
  deploymentMode: 'selfhosted' | 'hosted'
  storageMode: 'env' | 'db'
  version: string
  dbAvailable: boolean
  encryptionKeySet: boolean
  integrations: IntegrationSummary[]
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetch(`${API_URL}/api/settings`)
  if (!res.ok) throw new Error(`Settings API error: ${res.status}`)
  return res.json() as Promise<SettingsResponse>
}

export async function setStorageMode(mode: 'env' | 'db'): Promise<{ storageMode: 'env' | 'db' }> {
  const res = await fetch(`${API_URL}/api/settings/storage-mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Failed to set storage mode: ${res.status}`)
  }
  return res.json() as Promise<{ storageMode: 'env' | 'db' }>
}
