/**
 * Format an ISO timestamp string into a human-readable relative or absolute time.
 *
 * - < 60s:  "just now"
 * - < 60m:  "Xm ago"
 * - < 24h:  "Xh ago"
 * - else:   "Mar 18, 5:38 AM"
 */
export function formatTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A'

  const date = new Date(isoString)
  if (isNaN(date.getTime())) return 'N/A'

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/** Alias for formatTimestamp — used by panel components */
export const timeAgo = formatTimestamp

/** Format a duration in seconds to human-readable (e.g., "2m 15s", "1h 3m") */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds)) return 'N/A'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

/** Format large numbers with K/M suffixes (e.g., 1234 → "1.2K") */
export function smartNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '0'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

/** Format currency values (e.g., 1234.5 → "$1,234.50") */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

/** Truncate a string to maxLen with ellipsis */
export function truncate(str: string, maxLen = 40): string {
  if (!str) return ''
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '\u2026' : str
}

/** Shorten a git SHA to 7 chars */
export function shortSha(sha: string | null | undefined): string {
  return sha ? sha.slice(0, 7) : ''
}

/** Extract first line of a commit message, truncated */
export function commitMsg(msg: string | null | undefined, maxLen = 50): string {
  if (!msg) return ''
  const first = msg.split('\n')[0] ?? ''
  return truncate(first, maxLen)
}

/** Format an ISO date to short form (e.g., "Mar 18") */
export function shortDate(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
}

/** Format bytes to human-readable (e.g., 1048576 → "1.0 MB") */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || isNaN(bytes)) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let b = bytes
  while (b >= 1024 && i < units.length - 1) {
    b /= 1024
    i++
  }
  return `${b.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/** Format a percentage (e.g., 0.945 → "94.5%") */
export function formatPct(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '0%'
  return `${(value * 100).toFixed(1)}%`
}

/** Return fallback if value is null/undefined/empty */
export function emptyOr<T>(value: T | null | undefined, fallback: string = 'N/A'): T | string {
  if (value == null) return fallback
  if (typeof value === 'string' && value.trim() === '') return fallback
  return value
}
