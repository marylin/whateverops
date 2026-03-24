import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, afterAll } from 'vitest'
import { ErrorBoundary } from '../ErrorBoundary'

const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error')
  return <div>Child content</div>
}

describe('ErrorBoundary', () => {
  afterEach(() => consoleSpy.mockClear())
  afterAll(() => consoleSpy.mockRestore())

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary title="GitHub">
        <ThrowingChild shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('This panel encountered an error')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('retry button resets error state', () => {
    let shouldThrow = true
    const { rerender } = render(
      <ErrorBoundary title="Test">
        <ThrowingChild shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('This panel encountered an error')).toBeInTheDocument()

    shouldThrow = false
    rerender(
      <ErrorBoundary title="Test">
        <ThrowingChild shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    )
    fireEvent.click(screen.getByText('Retry'))
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })
})
