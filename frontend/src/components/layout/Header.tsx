import { HealthIndicator } from './HealthIndicator'
import type { DashboardResponse } from '../../lib/api'

interface HeaderProps {
  dashboard: DashboardResponse | null
  onRefresh: () => void
}

export function Header({ dashboard, onRefresh }: HeaderProps) {
  return (
    <header className="border-b border-[#1E1E2E] bg-[#0A0A0F]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#7C3AED]">WhateverOPS</h1>
        </div>

        <div className="flex items-center gap-3">
          {dashboard && (
            <HealthIndicator
              globalHealth={dashboard.globalHealth}
              panels={dashboard.panels}
              configured={dashboard.configured}
              total={dashboard.total}
            />
          )}
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-1.5 bg-[#1E1E2E] hover:bg-[#2A2A3E] text-gray-300 rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </header>
  )
}
