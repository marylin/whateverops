import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchDashboard, type DashboardResponse } from '../lib/api'

export function useDashboard(pollIntervalMs = 10_000) {
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(async () => {
    try {
      const result = await fetchDashboard()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, pollIntervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refresh, pollIntervalMs])

  return { data, loading, error, refresh }
}
