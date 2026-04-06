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
          <h1 className="text-xl sm:text-2xl font-semibold tracking-[-0.5px] text-[#0EA5E9]">
            WhateverOPS
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 relative">
          {dashboard && (
            <HealthIndicator
              globalHealth={dashboard.globalHealth}
              panels={dashboard.panels}
              configured={dashboard.configured}
              total={dashboard.total}
            />
          )}
          <Link
            to="/settings"
            className="text-sm px-2 sm:px-3 py-1.5 min-h-[44px] flex items-center text-[#9090A0] hover:text-[#E2E2E8] transition-colors"
            aria-label="Settings"
          >
            <svg
              className="w-4 h-4 sm:hidden"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <Link
            to="/status"
            className="text-sm px-2 sm:px-3 py-1.5 min-h-[44px] flex items-center text-[#9090A0] hover:text-[#E2E2E8] transition-colors"
            aria-label="Status"
          >
            <svg
              className="w-4 h-4 sm:hidden"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="hidden sm:inline">Status</span>
          </Link>
          <button
            onClick={onRefresh}
            aria-label="Refresh dashboard"
            className="text-sm px-2 sm:px-3 py-1.5 min-h-[44px] bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#E2E2E8] rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4 sm:hidden"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  )
}
