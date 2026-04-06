import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Mocks — must be before component imports
// ---------------------------------------------------------------------------

vi.mock('@/lib/settings-api', () => ({
  fetchSettings: vi.fn().mockResolvedValue({
    deploymentMode: 'selfhosted',
    storageMode: 'env',
    version: '1.0.0',
    dbAvailable: false,
    encryptionKeySet: false,
    integrations: [
      { id: 'github', name: 'GitHub', configured: true, envVars: [] },
      { id: 'stripe', name: 'Stripe', configured: false, envVars: [] },
    ],
  }),
  setStorageMode: vi.fn().mockResolvedValue({ storageMode: 'env' }),
}))

vi.mock('@/lib/api', () => ({
  fetchDashboard: vi.fn().mockResolvedValue({
    panels: [],
    globalHealth: 'ok',
    lastRefresh: new Date().toISOString(),
    configured: 0,
    total: 0,
  }),
  fetchStatus: vi.fn().mockResolvedValue({
    services: [
      { id: 'github', name: 'GitHub', status: 'ok', lastChecked: new Date().toISOString() },
      { id: 'stripe', name: 'Stripe', status: 'warn', lastChecked: new Date().toISOString() },
    ],
    globalHealth: 'ok',
    lastRefresh: new Date().toISOString(),
  }),
}))

// Import components after mocks
import { SettingsPage } from '../SettingsPage'
import { StatusPage } from '../StatusPage'

// ---------------------------------------------------------------------------
// SettingsPage
// ---------------------------------------------------------------------------

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state then settings content', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    // After data loads, should show settings sections
    await waitFor(() => {
      expect(screen.getByText('Credential Storage')).toBeInTheDocument()
    })

    expect(screen.getByText('System Info')).toBeInTheDocument()
    // "Integrations" appears both as a section heading and a system info label
    expect(screen.getAllByText('Integrations').length).toBeGreaterThanOrEqual(1)
  })

  it('displays integration names from mock data', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('GitHub')).toBeInTheDocument()
    })
    expect(screen.getByText('Stripe')).toBeInTheDocument()
  })

  it('shows system info fields', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Self-hosted')).toBeInTheDocument()
    })
    expect(screen.getByText('Env vars')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })

  it('has a link back to the home page', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('WhateverOPS')).toBeInTheDocument()
    })
    const homeLink = screen.getByText('WhateverOPS').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })
})

// ---------------------------------------------------------------------------
// StatusPage
// ---------------------------------------------------------------------------

describe('StatusPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  it('renders loading state then service list', async () => {
    vi.useRealTimers()
    render(<StatusPage />)

    await waitFor(() => {
      expect(screen.getByText('GitHub')).toBeInTheDocument()
    })
    expect(screen.getByText('Stripe')).toBeInTheDocument()
  })

  it('shows global health status banner', async () => {
    vi.useRealTimers()
    render(<StatusPage />)

    await waitFor(() => {
      expect(screen.getByText('All Systems Operational')).toBeInTheDocument()
    })
  })

  it('shows per-service operational status', async () => {
    vi.useRealTimers()
    render(<StatusPage />)

    await waitFor(() => {
      expect(screen.getByText('Operational')).toBeInTheDocument()
    })
    // Stripe is warn, so should show "Degraded"
    expect(screen.getByText('Degraded')).toBeInTheDocument()
  })

  it('displays auto-refresh info text', async () => {
    vi.useRealTimers()
    render(<StatusPage />)

    await waitFor(() => {
      expect(screen.getByText(/auto-refreshes every 30s/i)).toBeInTheDocument()
    })
  })
})
