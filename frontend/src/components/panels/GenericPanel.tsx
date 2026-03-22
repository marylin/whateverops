import { Metric } from '../ui/Metric'

interface GenericPanelProps {
  data: Record<string, unknown>
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return `${value.length} items`
  return String(value)
}

// Abbreviations that should stay uppercase in labels
const ABBREVS = new Set(['api', 'url', 'id', 'pr', 'prs', 'mrr', 'ttl', 'ip', 'mrr'])

function formatLabel(key: string): string {
  // Handle _ms suffix specially: "responseTime_ms" → "Response Time (ms)"
  const normalized = key.replace(/_ms$/, ' (ms)')

  // Split on: transitions from lowercase→uppercase, sequences of uppercase→lowercase,
  // underscores, and hyphens — then filter empty tokens
  const tokens = normalized
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase split: openPRs → open PRs
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // consecutive caps: PRCount → PR Count
    .replace(/[_-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return tokens
    .map((word) => {
      const lower = word.toLowerCase()
      if (ABBREVS.has(lower)) return lower.toUpperCase()
      // Preserve parenthesized units like "(ms)"
      if (word.startsWith('(') && word.endsWith(')')) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

export function GenericPanel({ data }: GenericPanelProps) {
  const entries = Object.entries(data).filter(([_, v]) => !Array.isArray(v) || v.length <= 5)

  const metrics = entries.filter(
    ([_, v]) => typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string',
  )
  const arrays = entries.filter(([_, v]) => Array.isArray(v))

  return (
    <div className="space-y-3">
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {metrics.slice(0, 6).map(([key, value]) => (
            <Metric key={key} label={formatLabel(key)} value={formatValue(value)} />
          ))}
        </div>
      )}
      {arrays.map(([key, value]) => (
        <div key={key}>
          <p className="text-xs text-gray-500 mb-1">{formatLabel(key)}</p>
          <div className="space-y-1">
            {(value as Array<Record<string, unknown>>).slice(0, 3).map((item, i) => (
              <div key={i} className="text-xs text-gray-400 truncate">
                {Object.values(item)
                  .filter((v) => typeof v === 'string' || typeof v === 'number')
                  .slice(0, 3)
                  .join(' - ')}
              </div>
            ))}
          </div>
        </div>
      ))}
      {metrics.length === 0 && arrays.length === 0 && (
        <p className="text-sm text-gray-500">No data available</p>
      )}
    </div>
  )
}
