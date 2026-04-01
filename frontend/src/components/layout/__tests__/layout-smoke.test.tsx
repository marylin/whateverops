import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Header } from '../Header'
import { DailyDigest, DailyDigestSkeleton } from '../DailyDigest'
import type { DashboardResponse, IntegrationResult } from '../../../lib/api'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockDashboard: DashboardResponse = {
  panels: [
    {
      id: 'github',
      name: 'GitHub',
      status: 'ok',
      data: null,
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
  ],
  globalHealth: 'ok',
  lastRefresh: new Date().toISOString(),
  configured: 1,
  total: 14,
}

const mockPanels: IntegrationResult[] = [
  {
    id: 'stripe-1',
    name: 'Stripe',
    status: 'ok',
    data: { mrr: 4200, mrrGrowthPct: 8 },
    error: null,
    cached: false,
    lastUpdated: new Date().toISOString(),
    ttl: 60,
  },
  {
    id: 'sentry-1',
    name: 'Sentry',
    status: 'ok',
    data: { newIssues24h: 0 },
    error: null,
    cached: false,
    lastUpdated: new Date().toISOString(),
    ttl: 60,
  },
]

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

describe('Header', () => {
  it('renders with a valid DashboardResponse', () => {
    render(
      <MemoryRouter>
        <Header dashboard={mockDashboard} onRefresh={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByText('WhateverOPS')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders with null dashboard (no HealthIndicator)', () => {
    render(
      <MemoryRouter>
        <Header dashboard={null} onRefresh={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByText('WhateverOPS')).toBeInTheDocument()
    // HealthIndicator should not render
    expect(screen.queryByText('All systems operational')).not.toBeInTheDocument()
  })

  it('shows a refresh button with accessible label', () => {
    const handleRefresh = vi.fn()
    render(
      <MemoryRouter>
        <Header dashboard={null} onRefresh={handleRefresh} />
      </MemoryRouter>,
    )
    const btn = screen.getByRole('button', { name: /refresh dashboard/i })
    expect(btn).toBeInTheDocument()
  })

  it('has navigable Settings and Status links', () => {
    render(
      <MemoryRouter>
        <Header dashboard={null} onRefresh={() => {}} />
      </MemoryRouter>,
    )
    const settingsLink = screen.getByText('Settings').closest('a')
    expect(settingsLink).toHaveAttribute('href', '/settings')
    const statusLink = screen.getByText('Status').closest('a')
    expect(statusLink).toHaveAttribute('href', '/status')
  })
})

// ---------------------------------------------------------------------------
// DailyDigest
// ---------------------------------------------------------------------------

describe('DailyDigest', () => {
  it('renders metric tiles when given panels', () => {
    const { container } = render(<DailyDigest panels={mockPanels} />)
    // Should have the 5 metric labels: MRR (or Revenue), Health, Users, AI Costs, Attention
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.getByText('Attention')).toBeInTheDocument()
    // Container should not be empty
    expect(container.firstChild).not.toBeNull()
  })

  it('returns null for an empty panels array', () => {
    const { container } = render(<DailyDigest panels={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows "All clear" when no attention items exist', () => {
    render(<DailyDigest panels={mockPanels} />)
    expect(screen.getByText('All clear')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// DailyDigestSkeleton
// ---------------------------------------------------------------------------

describe('DailyDigestSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<DailyDigestSkeleton />)
    expect(container.firstChild).not.toBeNull()
    // Should have the pulse animation class
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })
})
