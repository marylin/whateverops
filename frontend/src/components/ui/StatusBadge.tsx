interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_COLORS: Record<string, string> = {
  // Deploy statuses
  success: 'bg-[#10B98120] text-[#10B981]',
  succeeded: 'bg-[#10B98120] text-[#10B981]',
  ready: 'bg-[#10B98120] text-[#10B981]',
  completed: 'bg-[#10B98120] text-[#10B981]',
  active: 'bg-[#10B98120] text-[#10B981]',
  healthy: 'bg-[#10B98120] text-[#10B981]',
  verified: 'bg-[#10B98120] text-[#10B981]',
  delivered: 'bg-[#10B98120] text-[#10B981]',
  resolved: 'bg-[#10B98120] text-[#10B981]',

  // Warning statuses
  building: 'bg-[#F59E0B20] text-[#F59E0B]',
  queued: 'bg-[#F59E0B20] text-[#F59E0B]',
  pending: 'bg-[#F59E0B20] text-[#F59E0B]',
  in_progress: 'bg-[#F59E0B20] text-[#F59E0B]',
  warning: 'bg-[#F59E0B20] text-[#F59E0B]',
  initializing: 'bg-[#F59E0B20] text-[#F59E0B]',

  // Error statuses
  failed: 'bg-[#EF444420] text-[#EF4444]',
  error: 'bg-[#EF444420] text-[#EF4444]',
  crashed: 'bg-[#EF444420] text-[#EF4444]',
  cancelled: 'bg-[#EF444420] text-[#EF4444]',
  canceled: 'bg-[#EF444420] text-[#EF4444]',
  bounced: 'bg-[#EF444420] text-[#EF4444]',
  unresolved: 'bg-[#EF444420] text-[#EF4444]',

  // Neutral
  removed: 'bg-[#1E1E2E] text-[#606070]',
  inactive: 'bg-[#1E1E2E] text-[#606070]',
}

const DEFAULT_COLOR = 'bg-[#1E1E2E] text-[#9090A0]'

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, '_')
  const colorClass = STATUS_COLORS[normalized] ?? DEFAULT_COLOR
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span className={`${colorClass} ${sizeClass} rounded font-medium inline-block`}>{status}</span>
  )
}
