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
