import { Metric } from '../ui/Metric'
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
  const totalResponses =
    data.responseBreakdown.status2xx +
    data.responseBreakdown.status3xx +
    data.responseBreakdown.status4xx +
    data.responseBreakdown.status5xx
  const error5xxRate =
    totalResponses > 0 ? (data.responseBreakdown.status5xx / totalResponses) * 100 : 0
  const zoneActive = data.zoneStatus === 'active'

  const responseSegments = [
    { value: data.responseBreakdown.status2xx, color: '#10B981', label: '2xx' },
    { value: data.responseBreakdown.status3xx, color: '#3B82F6', label: '3xx' },
    { value: data.responseBreakdown.status4xx, color: '#F59E0B', label: '4xx' },
    { value: data.responseBreakdown.status5xx, color: '#EF4444', label: '5xx' },
  ]

  return (
    <div className="space-y-4">
      {/* Hero: zone status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${zoneActive ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
          <ExternalLink
            href={`https://dash.cloudflare.com/?search=${data.zoneName}`}
            className="text-sm font-semibold text-[#E2E2E8]"
          >
            {data.zoneName}
          </ExternalLink>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              zoneActive ? 'bg-[#10B98120] text-[#10B981]' : 'bg-[#EF444420] text-[#EF4444]'
            }`}
          >
            {zoneActive ? 'Active' : data.zoneStatus}
          </span>
        </div>
      </div>

      {/* Alert row */}
      {!zoneActive && (
        <div className="flex items-center gap-2 text-xs bg-[#EF444410] border border-[#EF444415] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
          <span className="text-[#F87171]">Zone is not active — site may be unreachable</span>
        </div>
      )}
      {error5xxRate > 1 && (
        <div className="flex items-center gap-2 text-xs bg-[#EF444410] border border-[#EF444415] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] shrink-0" />
          <span className="text-[#F87171]">
            5xx error rate at {error5xxRate.toFixed(1)}% — check origin server
          </span>
        </div>
      )}
      {data.threatsBlocked > 100 && (
        <div className="flex items-center gap-2 text-xs bg-[#F59E0B10] border border-[#F59E0B15] rounded-lg px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
          <span className="text-[#F59E0B]">
            {smartNumber(data.threatsBlocked)} threats blocked — review firewall rules
          </span>
        </div>
      )}

      {/* Supporting: Requests 24h | 5xx error rate | Threats blocked */}
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Requests (24h)" value={smartNumber(data.requests24h)} />
        <Metric
          label="5xx Error Rate"
          value={`${error5xxRate.toFixed(1)}%`}
          trend={error5xxRate > 1 ? 'down' : 'neutral'}
        />
        <Metric
          label="Threats Blocked"
          value={smartNumber(data.threatsBlocked)}
          trend={data.threatsBlocked > 100 ? 'down' : 'neutral'}
        />
      </div>

      {/* Response breakdown */}
      {totalResponses > 0 && (
        <div>
          <span className="text-xs text-[#606070] font-medium mb-1.5 block">Response Codes</span>
          <MiniBar segments={responseSegments} height={8} />
        </div>
      )}

      {/* De-emphasized: bandwidth, cache hit ratio, SSL */}
      <div className="flex items-center justify-between text-[10px] text-[#606070] pt-1 border-t border-[#252535]">
        <span>Bandwidth: {data.bandwidth24h}</span>
        <span>Cache hit: {data.cacheHitRatio}%</span>
        <span>SSL: {data.sslStatus}</span>
      </div>
    </div>
  )
}
