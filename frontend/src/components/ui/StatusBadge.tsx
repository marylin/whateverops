interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_COLORS: Record<string, string> = {
  // Deploy statuses
  success: 'bg-[#00D46A20] text-[#00D46A]',
  succeeded: 'bg-[#00D46A20] text-[#00D46A]',
  ready: 'bg-[#00D46A20] text-[#00D46A]',
  completed: 'bg-[#00D46A20] text-[#00D46A]',
  active: 'bg-[#00D46A20] text-[#00D46A]',
  healthy: 'bg-[#00D46A20] text-[#00D46A]',
  verified: 'bg-[#00D46A20] text-[#00D46A]',
  delivered: 'bg-[#00D46A20] text-[#00D46A]',
  resolved: 'bg-[#00D46A20] text-[#00D46A]',

  // Warning statuses
  building: 'bg-[#FFB80020] text-[#FFB800]',
  queued: 'bg-[#FFB80020] text-[#FFB800]',
  pending: 'bg-[#FFB80020] text-[#FFB800]',
  in_progress: 'bg-[#FFB80020] text-[#FFB800]',
  warning: 'bg-[#FFB80020] text-[#FFB800]',
  initializing: 'bg-[#FFB80020] text-[#FFB800]',

  // Error statuses
  failed: 'bg-[#FF454520] text-[#FF4545]',
  error: 'bg-[#FF454520] text-[#FF4545]',
  crashed: 'bg-[#FF454520] text-[#FF4545]',
  cancelled: 'bg-[#FF454520] text-[#FF4545]',
  canceled: 'bg-[#FF454520] text-[#FF4545]',
  bounced: 'bg-[#FF454520] text-[#FF4545]',
  unresolved: 'bg-[#FF454520] text-[#FF4545]',

  // Neutral
  removed: 'bg-[#1E1E2E] text-gray-500',
  inactive: 'bg-[#1E1E2E] text-gray-500',
}

const DEFAULT_COLOR = 'bg-[#1E1E2E] text-gray-400'

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_')
  const colorClass = STATUS_COLORS[normalized] ?? DEFAULT_COLOR
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span className={`${colorClass} ${sizeClass} rounded font-medium inline-block`}>{status}</span>
  )
}
