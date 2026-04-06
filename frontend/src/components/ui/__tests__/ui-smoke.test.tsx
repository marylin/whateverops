import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ExternalLink } from '../ExternalLink'
import { Metric } from '../Metric'
import { MiniBar } from '../MiniBar'
import { ProgressBar } from '../ProgressBar'
import { StatusDot } from '../StatusDot'

// ---------------------------------------------------------------------------
// ExternalLink
// ---------------------------------------------------------------------------

describe('ExternalLink', () => {
  it('renders children and sets href', () => {
    render(<ExternalLink href="https://example.com">Visit</ExternalLink>)
    const link = screen.getByRole('link', { name: /visit/i })
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('opens in a new tab with security attributes', () => {
    render(<ExternalLink href="https://example.com">Link</ExternalLink>)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('applies custom className', () => {
    render(
      <ExternalLink href="https://example.com" className="text-red-500">
        Styled
      </ExternalLink>,
    )
    const link = screen.getByRole('link')
    expect(link.className).toContain('text-red-500')
  })
})

// ---------------------------------------------------------------------------
// Metric
// ---------------------------------------------------------------------------

describe('Metric', () => {
  it('renders label and string value', () => {
    render(<Metric label="Revenue" value="$1,000" />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })

  it('renders with value=0 (falsy but valid)', () => {
    render(<Metric label="Errors" value={0} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Errors')).toBeInTheDocument()
  })

  it('renders subValue when provided', () => {
    render(<Metric label="Users" value={42} subValue="+5% this week" />)
    expect(screen.getByText('+5% this week')).toBeInTheDocument()
  })

  it('does not render subValue when omitted', () => {
    const { container } = render(<Metric label="Users" value={42} />)
    // Only label and value paragraphs, no sub-value
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs.length).toBe(2) // label + value
  })

  it('applies trend color for up/down/neutral', () => {
    const { container: upContainer } = render(
      <Metric label="A" value={1} subValue="up" trend="up" />,
    )
    const upSub = upContainer.querySelectorAll('p')[2]
    expect(upSub?.className).toContain('text-[#10B981]')

    const { container: downContainer } = render(
      <Metric label="B" value={2} subValue="down" trend="down" />,
    )
    const downSub = downContainer.querySelectorAll('p')[2]
    expect(downSub?.className).toContain('text-[#EF4444]')
  })
})

// ---------------------------------------------------------------------------
// MiniBar
// ---------------------------------------------------------------------------

describe('MiniBar', () => {
  it('renders segments with correct aria-labels', () => {
    render(
      <MiniBar
        segments={[
          { value: 70, color: '#10B981', label: 'Success' },
          { value: 30, color: '#EF4444', label: 'Failure' },
        ]}
      />,
    )
    expect(screen.getByLabelText('Success: 70')).toBeInTheDocument()
    expect(screen.getByLabelText('Failure: 30')).toBeInTheDocument()
  })

  it('returns null when all segment values are 0', () => {
    const { container } = render(<MiniBar segments={[{ value: 0, color: '#10B981' }]} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null for empty segments array', () => {
    const { container } = render(<MiniBar segments={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('accepts a custom height', () => {
    const { container } = render(
      <MiniBar segments={[{ value: 50, color: '#10B981' }]} height={12} />,
    )
    const bar = container.querySelector('[style*="height"]')
    expect(bar).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

describe('ProgressBar', () => {
  it('renders 0% correctly', () => {
    render(<ProgressBar value={0} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders 50% correctly', () => {
    render(<ProgressBar value={50} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('renders 100% correctly', () => {
    render(<ProgressBar value={100} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('clamps values above 100', () => {
    render(<ProgressBar value={150} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('clamps values below 0', () => {
    render(<ProgressBar value={-10} />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders a label when provided', () => {
    render(<ProgressBar value={80} label="Uptime" />)
    expect(screen.getByText('Uptime')).toBeInTheDocument()
  })

  it('hides value display when showValue is false', () => {
    render(<ProgressBar value={50} showValue={false} />)
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// StatusDot
// ---------------------------------------------------------------------------

describe('StatusDot', () => {
  const statuses = ['ok', 'warn', 'error', 'loading', 'offline'] as const

  it.each(statuses)('renders %s status without crashing', (status) => {
    const { container } = render(<StatusDot status={status} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('applies pulse animation for ok status when pulse=true', () => {
    const { container } = render(<StatusDot status="ok" pulse />)
    expect(container.querySelector('.animate-ping')).not.toBeNull()
  })

  it('applies pulse animation for warn status when pulse=true', () => {
    const { container } = render(<StatusDot status="warn" pulse />)
    expect(container.querySelector('.animate-ping')).not.toBeNull()
  })

  it('does NOT pulse for error status even when pulse=true', () => {
    const { container } = render(<StatusDot status="error" pulse />)
    expect(container.querySelector('.animate-ping')).toBeNull()
  })

  it('renders different sizes', () => {
    const { container: sm } = render(<StatusDot status="ok" size="sm" />)
    expect(sm.querySelector('.w-2')).not.toBeNull()

    const { container: lg } = render(<StatusDot status="ok" size="lg" />)
    expect(lg.querySelector('.w-4')).not.toBeNull()
  })
})
