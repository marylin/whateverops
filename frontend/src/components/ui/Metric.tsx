interface MetricProps {
  label: string
  value: string | number
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function Metric({ label, value, subValue, trend }: MetricProps) {
  const trendColor =
    trend === 'up' ? 'text-[#10B981]' : trend === 'down' ? 'text-[#EF4444]' : 'text-[#9090A0]'

  return (
    <div>
      <p className="text-xs text-[#606070] mb-1">{label}</p>
      <p className="text-lg font-semibold text-[#E2E2E8]">{value}</p>
      {subValue && <p className={`text-xs mt-0.5 ${trendColor}`}>{subValue}</p>}
    </div>
  )
}
