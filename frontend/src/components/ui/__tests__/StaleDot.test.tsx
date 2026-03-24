import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StaleDot } from '../StaleDot'

describe('StaleDot', () => {
  it('renders green dot for fresh data (within TTL)', () => {
    const now = new Date().toISOString()
    const { container } = render(<StaleDot lastUpdated={now} ttl={60} error={null} />)
    const dot = container.querySelector('span span')
    expect(dot?.className).toContain('bg-[#10B981]')
  })

  it('renders amber dot for aging data (1-2x TTL)', () => {
    const staleTime = new Date(Date.now() - 90_000).toISOString()
    const { container } = render(<StaleDot lastUpdated={staleTime} ttl={60} error={null} />)
    const dot = container.querySelector('span span')
    expect(dot?.className).toContain('bg-[#F59E0B]')
  })

  it('renders red dot for very stale data (>2x TTL)', () => {
    const veryStale = new Date(Date.now() - 180_000).toISOString()
    const { container } = render(<StaleDot lastUpdated={veryStale} ttl={60} error={null} />)
    const dot = container.querySelector('span span')
    expect(dot?.className).toContain('bg-[#EF4444]')
  })

  it('renders red dot when error is present regardless of staleness', () => {
    const now = new Date().toISOString()
    const { container } = render(<StaleDot lastUpdated={now} ttl={60} error="API failed" />)
    const dot = container.querySelector('span span')
    expect(dot?.className).toContain('bg-[#EF4444]')
  })

  it('shows tooltip with label and time', () => {
    const now = new Date().toISOString()
    const { container } = render(<StaleDot lastUpdated={now} ttl={60} error={null} />)
    const wrapper = container.querySelector('[title]')
    expect(wrapper?.getAttribute('title')).toContain('Fresh data')
  })
})
