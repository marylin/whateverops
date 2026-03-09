interface StatusDotProps {
  status: 'ok' | 'warn' | 'error' | 'loading' | 'offline'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
}

const colorMap = {
  ok: 'bg-[#00D46A]',
  warn: 'bg-[#FFB800]',
  error: 'bg-[#FF4545]',
  loading: 'bg-gray-400',
  offline: 'bg-gray-600',
}

const sizeMap = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
}

export function StatusDot({ status, size = 'md', pulse = false }: StatusDotProps) {
  return (
    <span className="relative inline-flex">
      <span className={`rounded-full ${colorMap[status]} ${sizeMap[size]}`} />
      {pulse && (status === 'ok' || status === 'warn') && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${colorMap[status]} opacity-40 animate-ping`}
        />
      )}
    </span>
  )
}
