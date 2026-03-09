import { useState } from 'react'
import { StatusDot } from '../ui/StatusDot'
import type { IntegrationResult } from '../../lib/api'

interface HealthIndicatorProps {
  globalHealth: 'ok' | 'warn' | 'error'
  panels: IntegrationResult[]
  configured: number
  total: number
}

const healthLabels = {
  ok: 'All systems operational',
  warn: 'Some services degraded',
  error: 'Service issues detected',
}

export function HealthIndicator({ globalHealth, panels, configured, total }: HealthIndicatorProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1E1E2E] transition-colors"
      >
        <StatusDot status={globalHealth} pulse={globalHealth !== 'ok'} />
        <span className="text-xs text-gray-400">{healthLabels[globalHealth]}</span>
        <span className="text-[10px] text-gray-600">
          {configured}/{total}
        </span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#111118] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Integration Status</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white text-lg"
              >
                x
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#0A0A0F]"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={panel.status} size="sm" />
                    <span className="text-sm text-white">{panel.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {panel.cached && <span className="text-[10px] text-gray-600">cached</span>}
                    {panel.error && (
                      <span
                        className="text-[10px] text-[#FF4545] max-w-[180px] truncate"
                        title={panel.error}
                      >
                        {panel.error.includes(' — ')
                          ? panel.error.slice(0, panel.error.indexOf(' — '))
                          : panel.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {panels.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No integrations configured</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
