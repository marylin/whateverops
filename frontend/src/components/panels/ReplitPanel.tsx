import { timeAgo } from '../../lib/format'
import { ExternalLink } from '../ui/ExternalLink'

interface ReplitPanelData {
  keyValid: boolean
  replCount: number
  recentRepls: Array<{
    title: string
    language: string
    lastUpdated: string
  }>
}

export function ReplitPanel({ data }: { data: ReplitPanelData }) {
  return (
    <div className="space-y-4">
      {/* Hero: status + repl count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data.keyValid ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#00D46A]" />
              <span className="text-sm font-semibold text-white">Connected</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF4545]" />
              <span className="text-sm font-semibold text-[#FF4545]">Invalid key</span>
            </>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {data.replCount} repl{data.replCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Recent repls */}
      {data.recentRepls.length > 0 && (
        <div>
          <span className="text-xs text-gray-500 font-medium">Recent Repls</span>
          <div className="mt-1.5 space-y-1.5">
            {data.recentRepls.slice(0, 5).map((repl) => (
              <div key={repl.title} className="flex items-center justify-between text-xs">
                <ExternalLink href="https://replit.com" className="text-gray-300 truncate">
                  {repl.title}
                </ExternalLink>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#1E1E2E] text-gray-500 rounded">
                    {repl.language}
                  </span>
                  <span className="text-gray-600">{timeAgo(repl.lastUpdated)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
