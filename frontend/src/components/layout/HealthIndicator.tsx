import { useState, useEffect, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!showModal) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowModal(false)
      }
    }
    // Delay to avoid the opening click from immediately closing
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
    }
  }, [showModal])

  // Close on Escape
  useEffect(() => {
    if (!showModal) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowModal(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showModal])

  function scrollToPanel(panelId: string) {
    // Find the card by looking for an h3 with the panel name, or use data attribute
    const cards = document.querySelectorAll('[data-panel-id]')
    for (const card of cards) {
      if ((card as HTMLElement).dataset.panelId === panelId) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Brief highlight
        card.classList.add('ring-2', 'ring-[#0EA5E9]', 'ring-opacity-50')
        setTimeout(() => card.classList.remove('ring-2', 'ring-[#0EA5E9]', 'ring-opacity-50'), 2000)
        setShowModal(false)
        return
      }
    }
    // Fallback: search by heading text
    const headings = document.querySelectorAll('h3')
    const panel = panels.find((p) => p.id === panelId)
    if (!panel) return
    for (const h3 of headings) {
      if (h3.textContent?.trim() === panel.name) {
        const card = h3.closest('[class*="rounded"]')
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' })
          setShowModal(false)
          return
        }
      }
    }
  }

  return (
    <div ref={containerRef}>
      <button
        onClick={() => setShowModal(!showModal)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#1E1E2E] transition-colors"
      >
        <StatusDot status={globalHealth} pulse={globalHealth !== 'ok'} />
        <span className="text-xs text-gray-400">{healthLabels[globalHealth]}</span>
        <span className="text-[10px] text-gray-600">
          {configured}/{total}
        </span>
      </button>

      {showModal && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-[#111118] border border-[#252535] rounded-xl p-4 w-80 max-h-[70vh] flex flex-col shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h2 className="text-sm font-semibold text-white">Integration Status</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-white text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-[#1E1E2E]"
            >
              &times;
            </button>
          </div>
          <div className="space-y-1.5 overflow-y-auto min-h-0">
            {panels.map((panel) => (
              <button
                key={panel.id}
                onClick={() => scrollToPanel(panel.id)}
                className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-[#0C0C14] hover:bg-[#1E1E2E] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={panel.status} size="sm" />
                  <span className="text-xs text-white">{panel.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {panel.status === 'ok' && (
                    <span className="text-[10px] text-[#10B981]">operational</span>
                  )}
                  {panel.status === 'warn' && (
                    <span className="text-[10px] text-[#F59E0B]">warning</span>
                  )}
                  {panel.status === 'error' && (
                    <span
                      className="text-[10px] text-[#EF4444] max-w-[140px] truncate"
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
              </button>
            ))}
            {panels.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-4">No integrations configured</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
