import { Metric } from '../ui/Metric'
import { ProgressBar } from '../ui/ProgressBar'
import { MiniBar } from '../ui/MiniBar'
import { ExternalLink } from '../ui/ExternalLink'
import { smartNumber } from '../../lib/format'

interface CloudflarePanelData {
  requests24h: number
  bandwidth24h: string
  threatsBlocked: number
  cacheHitRatio: number
  zoneName: string
  zoneStatus: string
  sslStatus: string
  sslCertCount: number
  responseBreakdown: { status2xx: number; status3xx: number; status4xx: number; status5xx: number }
  firewallEventsCount: number
}

export function CloudflarePanel({ data }: { data: CloudflarePanelData }) {
  const responseSegments = [
    { value: data.responseBreakdown.status2xx, color: '#00D46A', label: '2xx' },
    { value: data.responseBreakdown.status3xx, color: '#3B82F6', label: '3xx' },
    { value: data.responseBreakdown.status4xx, color: '#FFB800', label: '4xx' },
    { value: data.responseBreakdown.status5xx, color: '#FF4545', label: '5xx' },
  ]

  return (
    <div className="space-y-4">
      {/* Hero: requests + bandwidth */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Requests (24h)" value={smartNumber(data.requests24h)} />
        <Metric label="Bandwidth" value={data.bandwidth24h} />
        <Metric
          label="Threats Blocked"
          value={data.threatsBlocked}
          trend={data.threatsBlocked > 0 ? 'down' : 'neutral'}
        />
      </div>

      {/* Cache hit ratio */}
      <ProgressBar
        value={data.cacheHitRatio}
        color={data.cacheHitRatio >= 80 ? 'green' : data.cacheHitRatio >= 50 ? 'yellow' : 'red'}
        label="Cache hit ratio"
        size="md"
      />

      {/* Response breakdown */}
      <div>
        <span className="text-xs text-gray-500 font-medium mb-1.5 block">Response Codes</span>
        <MiniBar segments={responseSegments} height={8} />
      </div>

      {/* Zone + SSL info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Zone:</span>
          <ExternalLink
            href={`https://dash.cloudflare.com/?search=${data.zoneName}`}
            className="text-gray-300"
          >
            {data.zoneName}
          </ExternalLink>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              data.zoneStatus === 'active'
                ? 'bg-[#00D46A20] text-[#00D46A]'
                : 'bg-[#FFB80020] text-[#FFB800]'
            }`}
          >
            {data.zoneStatus}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">SSL:</span>
          <span className={data.sslStatus === 'active' ? 'text-[#00D46A]' : 'text-[#FFB800]'}>
            {data.sslStatus}
          </span>
          {data.firewallEventsCount > 0 && (
            <span className="text-[10px] text-[#FFB800] ml-2">
              {data.firewallEventsCount} FW events
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
