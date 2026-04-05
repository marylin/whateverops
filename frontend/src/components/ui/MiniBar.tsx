interface MiniBarSegment {
  value: number
  color: string
  label?: string
}

interface MiniBarProps {
  segments: MiniBarSegment[]
  height?: number
}

/** Horizontal stacked bar chart for breakdowns (response codes, issue states, etc.) */
export function MiniBar({ segments, height = 6 }: MiniBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total === 0) return null

  return (
    <div className="w-full">
      <div className="w-full bg-[#1E1E2E] rounded-full overflow-hidden flex" style={{ height }}>
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={i}
              className="transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={seg.label ? `${seg.label}: ${seg.value}` : `${seg.value}`}
            />
          )
        })}
      </div>
      <div className="flex gap-3 mt-1.5">
        {segments.map(
          (seg, i) =>
            seg.value > 0 && (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="text-[10px] text-[#606070]">
                  {seg.label ?? ''} {seg.value.toLocaleString()}
                </span>
              </div>
            ),
        )}
      </div>
    </div>
  )
}
