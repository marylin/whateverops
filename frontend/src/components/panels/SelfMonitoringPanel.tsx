import { Metric } from '../ui/Metric'
import { formatTimestamp } from '../../lib/format'

interface SelfMonitoringPanelData {
  status: 'ok' | 'error'
  uptime: string
  lastChecked: string
  responseTime_ms: number
  responseTimeStatus: 'fast' | 'normal' | 'slow'
}

const STATUS_CONFIG = {
  ok: {
    label: 'All Systems OK',
    color: 'bg-[#10B981]',
    badgeColor: 'bg-[#10B98120] text-[#10B981]',
  },
  error: {
    label: 'System Error',
    color: 'bg-[#EF4444]',
    badgeColor: 'bg-[#EF444420] text-[#EF4444]',
  },
}

const RESPONSE_TIME_CONFIG = {
  fast: { label: 'Fast', color: 'text-[#10B981]' },
  normal: { label: 'Normal', color: 'text-gray-400' },
  slow: { label: 'Slow', color: 'text-[#F59E0B]' },
}

export function SelfMonitoringPanel({ data }: { data: SelfMonitoringPanelData }) {
  const statusCfg = STATUS_CONFIG[data.status] ?? STATUS_CONFIG.error
  const rtCfg = RESPONSE_TIME_CONFIG[data.responseTimeStatus] ?? RESPONSE_TIME_CONFIG.normal

  return (
    <div className="space-y-4">
      {/* Hero: system status OK badge with response time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusCfg.color}`} />
          <span className="text-sm font-semibold text-white">{statusCfg.label}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusCfg.badgeColor}`}>
            {data.status.toUpperCase()}
          </span>
        </div>
        <span className={`text-xs font-medium ${rtCfg.color}`}>{data.responseTime_ms}ms</span>
      </div>

      {/* Alert row */}
      {data.status === 'error' && (
        <div className="flex items-center gap-2 text-xs bg-[#EF444410] border border-[#EF444415] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0 animate-pulse" />
          <span className="text-[#F87171]">
            System health check failing — investigate immediately
          </span>
        </div>
      )}
      {data.status === 'ok' && data.responseTime_ms > 3000 && (
        <div className="flex items-center gap-2 text-xs bg-[#F59E0B10] border border-[#F59E0B15] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-[#F59E0B]">
            Response time {data.responseTime_ms}ms — above 3s threshold
          </span>
        </div>
      )}

      {/* Supporting: Uptime | Response time | Status */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Uptime" value={data.uptime} />
        <Metric
          label="Response Time"
          value={`${data.responseTime_ms}ms`}
          subValue={rtCfg.label}
          trend={
            data.responseTimeStatus === 'slow'
              ? 'down'
              : data.responseTimeStatus === 'fast'
                ? 'up'
                : 'neutral'
          }
        />
        <Metric label="Status" value={data.status === 'ok' ? 'Healthy' : 'Error'} />
      </div>

      {/* Last checked */}
      <div className="text-[10px] text-gray-600 pt-1 border-t border-[#252535]">
        Last checked: {formatTimestamp(data.lastChecked)}
      </div>
    </div>
  )
}
