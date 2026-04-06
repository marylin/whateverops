import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatTimestamp,
  timeAgo,
  formatDuration,
  smartNumber,
  formatCurrency,
  truncate,
  shortSha,
  commitMsg,
  shortDate,
  formatBytes,
  formatPct,
  emptyOr,
} from '../format'

// ---------------------------------------------------------------------------
// formatTimestamp
// ---------------------------------------------------------------------------

describe('formatTimestamp', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for a timestamp < 60s ago', () => {
    const now = new Date()
    expect(formatTimestamp(now.toISOString())).toBe('just now')
  })

  it('returns "Xm ago" for a timestamp < 60m ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    expect(formatTimestamp(fiveMinAgo)).toBe('5m ago')
  })

  it('returns "Xh ago" for a timestamp < 24h ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatTimestamp(twoHoursAgo)).toBe('2h ago')
  })

  it('returns formatted date for timestamps > 24h ago', () => {
    const oldDate = new Date('2024-03-18T10:38:00Z').toISOString()
    const result = formatTimestamp(oldDate)
    // Should contain month abbreviation and day
    expect(result).toMatch(/Mar\s+18/)
  })

  it('returns "N/A" for null', () => {
    expect(formatTimestamp(null)).toBe('N/A')
  })

  it('returns "N/A" for undefined', () => {
    expect(formatTimestamp(undefined)).toBe('N/A')
  })

  it('returns "N/A" for invalid date string', () => {
    expect(formatTimestamp('not-a-date')).toBe('N/A')
  })

  it('returns "N/A" for empty string', () => {
    expect(formatTimestamp('')).toBe('N/A')
  })
})

// ---------------------------------------------------------------------------
// timeAgo (alias)
// ---------------------------------------------------------------------------

describe('timeAgo', () => {
  it('is an alias for formatTimestamp', () => {
    expect(timeAgo).toBe(formatTimestamp)
  })
})

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe('formatDuration', () => {
  it('formats seconds < 60 as "Xs"', () => {
    expect(formatDuration(45)).toBe('45s')
  })

  it('formats seconds in minutes range as "Xm Ys"', () => {
    expect(formatDuration(135)).toBe('2m 15s')
  })

  it('formats seconds in hours range as "Xh Ym"', () => {
    expect(formatDuration(3780)).toBe('1h 3m')
  })

  it('handles 0 seconds', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('returns "N/A" for null', () => {
    expect(formatDuration(null)).toBe('N/A')
  })

  it('returns "N/A" for undefined', () => {
    expect(formatDuration(undefined)).toBe('N/A')
  })

  it('returns "N/A" for NaN', () => {
    expect(formatDuration(NaN)).toBe('N/A')
  })
})

// ---------------------------------------------------------------------------
// smartNumber
// ---------------------------------------------------------------------------

describe('smartNumber', () => {
  it('returns "0" for null', () => {
    expect(smartNumber(null)).toBe('0')
  })

  it('returns "0" for undefined', () => {
    expect(smartNumber(undefined)).toBe('0')
  })

  it('returns "0" for NaN', () => {
    expect(smartNumber(NaN)).toBe('0')
  })

  it('returns locale string for numbers < 1000', () => {
    expect(smartNumber(42)).toBe('42')
  })

  it('formats thousands with K suffix', () => {
    expect(smartNumber(1234)).toBe('1.2K')
  })

  it('formats millions with M suffix', () => {
    expect(smartNumber(1_500_000)).toBe('1.5M')
  })

  it('handles 0', () => {
    expect(smartNumber(0)).toBe('0')
  })

  it('handles negative numbers with K suffix', () => {
    expect(smartNumber(-2500)).toBe('-2.5K')
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    const result = formatCurrency(1234.5)
    expect(result).toBe('$1,234.50')
  })

  it('formats 0', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats with a different currency', () => {
    const result = formatCurrency(1000, 'EUR')
    // Intl formats EUR with the euro sign
    expect(result).toContain('1,000.00')
  })
})

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------

describe('truncate', () => {
  it('returns string unchanged when shorter than maxLen', () => {
    expect(truncate('hello', 40)).toBe('hello')
  })

  it('truncates with ellipsis when longer than maxLen', () => {
    const long = 'a'.repeat(50)
    const result = truncate(long, 10)
    expect(result.length).toBe(10)
    expect(result.endsWith('\u2026')).toBe(true)
  })

  it('returns empty string for empty input', () => {
    expect(truncate('')).toBe('')
  })

  it('returns empty string for falsy input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(truncate(null as any)).toBe('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(truncate(undefined as any)).toBe('')
  })
})

// ---------------------------------------------------------------------------
// shortSha
// ---------------------------------------------------------------------------

describe('shortSha', () => {
  it('returns first 7 characters of a SHA', () => {
    expect(shortSha('abc1234567890def')).toBe('abc1234')
  })

  it('returns empty string for null', () => {
    expect(shortSha(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(shortSha(undefined)).toBe('')
  })

  it('handles SHAs shorter than 7 chars', () => {
    expect(shortSha('abc')).toBe('abc')
  })
})

// ---------------------------------------------------------------------------
// commitMsg
// ---------------------------------------------------------------------------

describe('commitMsg', () => {
  it('returns first line of a multi-line message', () => {
    expect(commitMsg('First line\nSecond line')).toBe('First line')
  })

  it('truncates long first lines', () => {
    const long = 'a'.repeat(60)
    const result = commitMsg(long, 50)
    expect(result.length).toBe(50)
    expect(result.endsWith('\u2026')).toBe(true)
  })

  it('returns empty string for null', () => {
    expect(commitMsg(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(commitMsg(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(commitMsg('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// shortDate
// ---------------------------------------------------------------------------

describe('shortDate', () => {
  it('formats an ISO date to short form', () => {
    // Use midday UTC to avoid timezone shifts changing the day
    const result = shortDate('2024-03-18T12:00:00Z')
    expect(result).toMatch(/Mar\s+18/)
  })

  it('returns "N/A" for null', () => {
    expect(shortDate(null)).toBe('N/A')
  })

  it('returns "N/A" for undefined', () => {
    expect(shortDate(undefined)).toBe('N/A')
  })

  it('returns "N/A" for invalid date', () => {
    expect(shortDate('garbage')).toBe('N/A')
  })
})

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------

describe('formatBytes', () => {
  it('returns "0 B" for null', () => {
    expect(formatBytes(null)).toBe('0 B')
  })

  it('returns "0 B" for undefined', () => {
    expect(formatBytes(undefined)).toBe('0 B')
  })

  it('returns "0 B" for NaN', () => {
    expect(formatBytes(NaN)).toBe('0 B')
  })

  it('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats bytes < 1024 without suffix', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB')
  })

  it('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB')
  })
})

// ---------------------------------------------------------------------------
// formatPct
// ---------------------------------------------------------------------------

describe('formatPct', () => {
  it('formats a decimal as percentage', () => {
    expect(formatPct(0.945)).toBe('94.5%')
  })

  it('formats 0', () => {
    expect(formatPct(0)).toBe('0.0%')
  })

  it('formats 1 (100%)', () => {
    expect(formatPct(1)).toBe('100.0%')
  })

  it('returns "0%" for null', () => {
    expect(formatPct(null)).toBe('0%')
  })

  it('returns "0%" for undefined', () => {
    expect(formatPct(undefined)).toBe('0%')
  })

  it('returns "0%" for NaN', () => {
    expect(formatPct(NaN)).toBe('0%')
  })
})

// ---------------------------------------------------------------------------
// emptyOr
// ---------------------------------------------------------------------------

describe('emptyOr', () => {
  it('returns the value when it is a non-empty string', () => {
    expect(emptyOr('hello')).toBe('hello')
  })

  it('returns fallback for null', () => {
    expect(emptyOr(null)).toBe('N/A')
  })

  it('returns fallback for undefined', () => {
    expect(emptyOr(undefined)).toBe('N/A')
  })

  it('returns fallback for empty string', () => {
    expect(emptyOr('')).toBe('N/A')
  })

  it('returns fallback for whitespace-only string', () => {
    expect(emptyOr('   ')).toBe('N/A')
  })

  it('returns number 0 as-is (not fallback)', () => {
    expect(emptyOr(0)).toBe(0)
  })

  it('uses custom fallback', () => {
    expect(emptyOr(null, 'none')).toBe('none')
  })

  it('returns boolean false as-is', () => {
    expect(emptyOr(false)).toBe(false)
  })
})
