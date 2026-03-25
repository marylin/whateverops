import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchSettings, setStorageMode, type SettingsResponse } from '../lib/settings-api'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#161622] border border-[#252535] p-6">
      <h2 className="text-sm font-semibold text-[#E2E2E8] uppercase tracking-wider mb-4">
        {title}
      </h2>
      {children}
    </div>
  )
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
        ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#252535]/50 text-[#606070]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-[#606070]'}`} />
      {ok ? 'Connected' : 'Not set'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Credential Storage section
// ---------------------------------------------------------------------------

interface StorageSelectorProps {
  current: 'env' | 'db'
  dbAvailable: boolean
  encryptionKeySet: boolean
  onSwitch: (mode: 'env' | 'db') => Promise<void>
}

function StorageSelector({
  current,
  dbAvailable,
  encryptionKeySet,
  onSwitch,
}: StorageSelectorProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(mode: 'env' | 'db') {
    if (mode === current) return
    setSaving(true)
    setError(null)
    try {
      await onSwitch(mode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change storage mode')
    } finally {
      setSaving(false)
    }
  }

  const dbDisabled = !dbAvailable || !encryptionKeySet

  return (
    <div role="radiogroup" aria-labelledby="storage-mode-label" className="space-y-3">
      <span id="storage-mode-label" className="sr-only">
        Credential storage mode
      </span>
      {/* Env option */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="radio"
          name="storage-mode"
          value="env"
          checked={current === 'env'}
          onChange={() => void handleChange('env')}
          disabled={saving}
          className="mt-0.5 accent-[#0EA5E9]"
        />
        <div>
          <span className="text-sm font-medium text-[#E2E2E8]">Environment Variables</span>
          <p className="text-xs text-[#606070] mt-0.5">
            Credentials are read directly from server env vars. Default for self-hosted deployments.
          </p>
        </div>
      </label>

      {/* DB option */}
      <label
        className={`flex items-start gap-3 ${dbDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="radio"
          name="storage-mode"
          value="db"
          checked={current === 'db'}
          onChange={() => void handleChange('db')}
          disabled={saving || dbDisabled}
          className="mt-0.5 accent-[#0EA5E9]"
        />
        <div>
          <span className="text-sm font-medium text-[#E2E2E8]">Database (Encrypted)</span>
          <p className="text-xs text-[#606070] mt-0.5">
            Credentials stored AES-256-GCM encrypted in Neon PostgreSQL. Required for multi-user
            hosted mode.
          </p>
          {dbDisabled && (
            <p className="text-xs text-amber-400 mt-1">
              {!dbAvailable
                ? 'NEON_DATABASE_URL is not set.'
                : 'CREDENTIAL_ENCRYPTION_KEY is not set.'}{' '}
              Configure it to enable DB storage.
            </p>
          )}
        </div>
      </label>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      {saving && <p className="text-xs text-[#606070] mt-2">Saving…</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// System Info section
// ---------------------------------------------------------------------------

function SystemInfo({ settings }: { settings: SettingsResponse }) {
  const configured = settings.integrations.filter((i) => i.configured).length
  const total = settings.integrations.length

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {[
        { label: 'Mode', value: settings.deploymentMode === 'hosted' ? 'Hosted' : 'Self-hosted' },
        { label: 'Storage', value: settings.storageMode === 'db' ? 'Database' : 'Env vars' },
        { label: 'Version', value: settings.version },
        { label: 'Integrations', value: `${configured} / ${total} connected` },
        { label: 'DB Available', value: settings.dbAvailable ? 'Yes' : 'No' },
        { label: 'Encryption Key', value: settings.encryptionKeySet ? 'Set' : 'Not set' },
      ].map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1">
          <dt className="text-xs text-[#606070]">{label}</dt>
          <dd className="text-sm font-medium text-[#E2E2E8]">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ---------------------------------------------------------------------------
// Integrations grid section
// ---------------------------------------------------------------------------

function IntegrationsGrid({ settings }: { settings: SettingsResponse }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {settings.integrations.map((integration) => (
        <div
          key={integration.id}
          className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0C0C14] border border-[#252535]"
        >
          <span className="text-sm font-medium text-[#E2E2E8]">{integration.name}</span>
          <StatusBadge ok={integration.configured} />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchSettings()
      setSettings(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Settings | WhateverOPS'
    return () => {
      document.title = 'WhateverOPS'
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleStorageSwitch(mode: 'env' | 'db') {
    await setStorageMode(mode)
    // Reload settings to reflect the new state
    await load()
  }

  return (
    <div className="min-h-screen bg-[#0C0C14]">
      {/* Header */}
      <header className="border-b border-[#252535] bg-[#0C0C14]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-lg font-bold text-[#0EA5E9] hover:text-[#38BDF8] transition-colors"
            >
              WhateverOPS
            </Link>
            <span className="text-sm text-[#606070]">Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/status"
              className="text-xs px-3 py-1.5 text-[#9090A0] hover:text-[#E2E2E8] transition-colors"
            >
              Status
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {loading && !settings && (
          <div className="animate-pulse space-y-6">
            {/* Credential Storage skeleton */}
            <div className="rounded-xl bg-[#161622] border border-[#252535] p-6">
              <div className="h-4 w-36 bg-[#252535] rounded mb-4" />
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#252535] mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-40 bg-[#252535] rounded" />
                    <div className="h-3 w-64 bg-[#1E1E2E] rounded" />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#252535] mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-36 bg-[#252535] rounded" />
                    <div className="h-3 w-72 bg-[#1E1E2E] rounded" />
                  </div>
                </div>
              </div>
            </div>
            {/* System Info skeleton */}
            <div className="rounded-xl bg-[#161622] border border-[#252535] p-6">
              <div className="h-4 w-24 bg-[#252535] rounded mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="h-3 w-16 bg-[#1E1E2E] rounded" />
                    <div className="h-4 w-24 bg-[#252535] rounded" />
                  </div>
                ))}
              </div>
            </div>
            {/* Integrations skeleton */}
            <div className="rounded-xl bg-[#161622] border border-[#252535] p-6">
              <div className="h-4 w-28 bg-[#252535] rounded mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#0C0C14] border border-[#252535]"
                  >
                    <div className="h-4 w-24 bg-[#252535] rounded" />
                    <div className="h-5 w-20 bg-[#1E1E2E] rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && !settings && (
          <div className="text-center py-20">
            <p className="text-[#EF4444] mb-2">Failed to load settings</p>
            <p className="text-sm text-[#606070] mb-4">{error}</p>
            <button
              onClick={() => void load()}
              className="text-sm px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {settings && (
          <>
            {/* Credential Storage */}
            <SectionCard title="Credential Storage">
              <StorageSelector
                current={settings.storageMode}
                dbAvailable={settings.dbAvailable}
                encryptionKeySet={settings.encryptionKeySet}
                onSwitch={handleStorageSwitch}
              />
            </SectionCard>

            {/* System Info */}
            <SectionCard title="System Info">
              <SystemInfo settings={settings} />
            </SectionCard>

            {/* Integrations */}
            <SectionCard title="Integrations">
              <IntegrationsGrid settings={settings} />
            </SectionCard>
          </>
        )}
      </main>
    </div>
  )
}
