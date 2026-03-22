interface MetricProps {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function Metric({ label, value, subValue, trend }: MetricProps) {
  const trendColor =
    trend === 'up' ? 'text-[#10B981]' : trend === 'down' ? 'text-[#EF4444]' : 'text-gray-400'

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
      {subValue && <p className={`text-xs mt-0.5 ${trendColor}`}>{subValue}</p>}
    </div>
  )
}
