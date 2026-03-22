interface ProgressBarProps {
  /** 0-100 */
  value: number
  /** Color based on context: green for good rates, red for errors */
  color?: 'green' | 'red' | 'yellow' | 'purple' | 'blue'
  label?: string
  showValue?: boolean
  size?: 'sm' | 'md'
}

const COLOR_MAP = {
  green: 'bg-[#10B981]',
  red: 'bg-[#EF4444]',
  yellow: 'bg-[#F59E0B]',
  purple: 'bg-[#0EA5E9]',
  blue: 'bg-[#3B82F6]',
}

export function ProgressBar({
  value,
  color = 'green',
  label,
  showValue = true,
  size = 'sm',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-xs text-gray-500">{label}</span>}
          {showValue && <span className="text-xs text-gray-400">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className={`w-full ${height} bg-[#1E1E2E] rounded-full overflow-hidden`}>
        <div
          className={`${height} ${COLOR_MAP[color]} rounded-full transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
