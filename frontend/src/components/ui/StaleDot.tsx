interface StaleDotProps {
  lastUpdated: string
  ttl: number
  error: string | null
}

function getStaleness(
  lastUpdated: string,
  ttl: number,
  error: string | null,
): { color: string; label: string } {
  if (error) {
    return { color: 'bg-[#EF4444]', label: 'Last call failed' }
  }

  const ageMs = Date.now() - new Date(lastUpdated).getTime()
  const ttlMs = ttl * 1000
  const staleFactor = ageMs / ttlMs

  if (staleFactor <= 1) {
    return { color: 'bg-[#10B981]', label: 'Fresh data' }
  }
  if (staleFactor <= 2) {
    return { color: 'bg-[#F59E0B]', label: 'Data is aging' }
  }
  return { color: 'bg-[#EF4444]', label: 'Stale data' }
}

export function StaleDot({ lastUpdated, ttl, error }: StaleDotProps) {
  const { color, label } = getStaleness(lastUpdated, ttl, error)
  const time = new Date(lastUpdated).toLocaleTimeString()

  return (
    <span
      role="status"
      className="relative group inline-flex"
      title={`${label} · Updated: ${time}`}
    >
      <span className={`rounded-full w-2 h-2 ${color}`} />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-[10px] bg-[#1E1E2E] text-[#E2E2E8] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {label} · {time}
      </span>
    </span>
  )
}
