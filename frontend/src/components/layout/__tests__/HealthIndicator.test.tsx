import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HealthIndicator } from '../HealthIndicator'

const mockPanels = [
  {
    id: 'github',
    name: 'GitHub',
    status: 'ok' as const,
    data: null,
    error: null,
    lastUpdated: new Date().toISOString(),
    cached: false,
    ttl: 60,
  },
  {
    id: 'stripe',
    name: 'Stripe',
    status: 'error' as const,
    data: null,
    error: 'API error',
    lastUpdated: new Date().toISOString(),
    cached: false,
    ttl: 60,
  },
]

describe('HealthIndicator', () => {
  it('shows "All systems operational" for ok health', () => {
    render(<HealthIndicator globalHealth="ok" panels={mockPanels} configured={2} total={14} />)
    expect(screen.getByText('All systems operational')).toBeInTheDocument()
  })

  it('shows "Needs attention" for warn health', () => {
    render(<HealthIndicator globalHealth="warn" panels={mockPanels} configured={2} total={14} />)
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
  })

  it('shows "Service issues detected" for error health', () => {
    render(<HealthIndicator globalHealth="error" panels={mockPanels} configured={2} total={14} />)
    expect(screen.getByText('Service issues detected')).toBeInTheDocument()
  })

  it('displays configured/total count', () => {
    render(<HealthIndicator globalHealth="ok" panels={mockPanels} configured={2} total={14} />)
    expect(screen.getByText('2/14')).toBeInTheDocument()
  })
})
