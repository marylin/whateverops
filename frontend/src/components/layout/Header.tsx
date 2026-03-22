import { Link } from 'react-router-dom'
import { HealthIndicator } from './HealthIndicator'
import type { DashboardResponse } from '../../lib/api'

interface HeaderProps {
  dashboard: DashboardResponse | null
  onRefresh: () => void
}

export function Header({ dashboard, onRefresh }: HeaderProps) {
  return (
    <header className="border-b border-[#252535] bg-[#0C0C14]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.5px] text-[#0EA5E9]">WhateverOPS</h1>
        </div>

        <div className="flex items-center gap-3 relative">
          {dashboard && (
            <HealthIndicator
              globalHealth={dashboard.globalHealth}
              panels={dashboard.panels}
              configured={dashboard.configured}
              total={dashboard.total}
            />
          )}
          <Link
            to="/status"
            className="text-sm px-3 py-1.5 min-h-[44px] flex items-center text-gray-400 hover:text-white transition-colors"
          >
            Status
          </Link>
          <button
            onClick={onRefresh}
            aria-label="Refresh dashboard"
            className="text-sm px-3 py-1.5 min-h-[44px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-gray-300 rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </header>
  )
}
