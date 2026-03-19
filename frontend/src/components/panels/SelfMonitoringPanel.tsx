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
    color: 'bg-[#00D46A]',
    badgeColor: 'bg-[#00D46A20] text-[#00D46A]',
  },
  error: {
    label: 'System Error',
    color: 'bg-[#FF4545]',
    badgeColor: 'bg-[#FF454520] text-[#FF4545]',
  },
}

const RESPONSE_TIME_CONFIG = {
  fast: { label: 'Fast', color: 'text-[#00D46A]' },
  normal: { label: 'Normal', color: 'text-gray-400' },
  slow: { label: 'Slow', color: 'text-[#FFB800]' },
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
        <div className="flex items-center gap-2 text-xs bg-[#FF454510] border border-[#FF454515] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#FF4545] shrink-0 animate-pulse" />
          <span className="text-[#FF6B6B]">
            System health check failing — investigate immediately
          </span>
        </div>
      )}
      {data.status === 'ok' && data.responseTime_ms > 3000 && (
        <div className="flex items-center gap-2 text-xs bg-[#FFB80010] border border-[#FFB80015] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#FFB800] shrink-0" />
          <span className="text-[#FFB800]">
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
      <div className="text-[10px] text-gray-600 pt-1 border-t border-[#1E1E2E]">
        Last checked: {formatTimestamp(data.lastChecked)}
      </div>
    </div>
  )
}
