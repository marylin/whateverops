import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders the status label', () => {
    render(<StatusBadge status="success" />)
    expect(screen.getByText('success')).toBeInTheDocument()
  })

  it('applies success color for known success statuses', () => {
    const { container } = render(<StatusBadge status="ready" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-[#10B981]')
  })

  it('applies warning color for pending statuses', () => {
    const { container } = render(<StatusBadge status="building" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-[#F59E0B]')
  })

  it('applies error color for failed statuses', () => {
    const { container } = render(<StatusBadge status="failed" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-[#EF4444]')
  })

  it('applies default color for unknown statuses', () => {
    const { container } = render(<StatusBadge status="unknown_thing" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-[#9090A0]')
  })

  it('normalizes status with spaces and mixed case', () => {
    const { container } = render(<StatusBadge status="In Progress" />)
    const badge = container.querySelector('span')
    expect(badge?.className).toContain('text-[#F59E0B]')
  })
})
