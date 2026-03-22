import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PanelCard } from '../PanelCard'

describe('PanelCard', () => {
  it('renders title and children in ok state', () => {
    render(
      <PanelCard title="GitHub" status="ok">
        <p>Some metrics</p>
      </PanelCard>,
    )
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Some metrics')).toBeInTheDocument()
  })

  it('shows loading skeleton when status is loading', () => {
    const { container } = render(
      <PanelCard title="GitHub" status="loading">
        <p>Content</p>
      </PanelCard>,
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('shows error state with error message', () => {
    render(
      <PanelCard title="Stripe" status="error" error="API key invalid — check dashboard">
        <p>Content</p>
      </PanelCard>,
    )
    expect(screen.getByText('API key invalid')).toBeInTheDocument()
    expect(screen.getByText('check dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders retry button when onRetry provided in error state', () => {
    render(
      <PanelCard title="Stripe" status="error" error="Failed" onRetry={() => {}}>
        <p>Content</p>
      </PanelCard>,
    )
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('applies wide class when wide prop is true', () => {
    const { container } = render(
      <PanelCard title="GitHub" status="ok" wide>
        <p>Wide content</p>
      </PanelCard>,
    )
    expect(container.firstChild).toHaveClass('md:col-span-2')
  })
})
