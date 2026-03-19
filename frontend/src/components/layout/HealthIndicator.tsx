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
  warn: 'Needs attention',
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
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowModal(false)} />
          {/* Dropdown panel — positioned below the navbar button */}
          <div
            className="absolute right-0 top-full mt-2 z-50 bg-[#111118] border border-[#2A2A3E] rounded-xl p-4 w-80 max-h-[70vh] flex flex-col shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="text-sm font-semibold text-white">Integration Status</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-[#2A2A3E]"
              >
                &times;
              </button>
            </div>
            <div className="space-y-1.5 overflow-y-auto min-h-0 styled-scrollbar">
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#0A0A0F]"
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={panel.status} size="sm" />
                    <span className="text-xs text-white">{panel.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {panel.status === 'ok' && (
                      <span className="text-[10px] text-[#00D46A]">operational</span>
                    )}
                    {panel.status === 'warn' && (
                      <span className="text-[10px] text-[#FFB800]">warning</span>
                    )}
                    {panel.status === 'error' && (
                      <span
                        className="text-[10px] text-[#FF4545] max-w-[140px] truncate"
                        title={panel.error ?? undefined}
                      >
                        {panel.error
                          ? panel.error.includes(' — ')
                            ? panel.error.slice(0, panel.error.indexOf(' — '))
                            : panel.error
                          : 'error'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {panels.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No integrations configured</p>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
