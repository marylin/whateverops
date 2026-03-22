import { describe, it, expect } from 'bun:test'

// Test the status entry shape and health logic
// Mirrors the status route's StatusEntry interface
interface StatusEntry {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  lastChecked: string
}

function computeGlobalHealth(entries: StatusEntry[]): 'ok' | 'warn' | 'error' {
  if (entries.some((e) => e.status === 'error')) return 'error'
  if (entries.some((e) => e.status === 'warn')) return 'warn'
  return 'ok'
}

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-emerald-500',
  warn: 'bg-amber-500',
  error: 'bg-red-500',
}

describe('status page logic', () => {
  it('maps ok status to green color', () => {
    expect(STATUS_COLORS['ok']).toBe('bg-emerald-500')
  })

  it('maps warn status to amber color', () => {
    expect(STATUS_COLORS['warn']).toBe('bg-amber-500')
  })

  it('maps error status to red color', () => {
    expect(STATUS_COLORS['error']).toBe('bg-red-500')
  })

  it('computes global health as ok when all services ok', () => {
    const entries: StatusEntry[] = [
      { id: 'github', name: 'GitHub', status: 'ok', lastChecked: '2026-03-10T12:00:00Z' },
      { id: 'vercel', name: 'Vercel', status: 'ok', lastChecked: '2026-03-10T12:00:00Z' },
    ]
    expect(computeGlobalHealth(entries)).toBe('ok')
  })

  it('computes global health as warn when any service warns', () => {
    const entries: StatusEntry[] = [
      { id: 'github', name: 'GitHub', status: 'ok', lastChecked: '2026-03-10T12:00:00Z' },
      { id: 'vercel', name: 'Vercel', status: 'warn', lastChecked: '2026-03-10T12:00:00Z' },
    ]
    expect(computeGlobalHealth(entries)).toBe('warn')
  })

  it('computes global health as error when any service errors', () => {
    const entries: StatusEntry[] = [
      { id: 'github', name: 'GitHub', status: 'ok', lastChecked: '2026-03-10T12:00:00Z' },
      { id: 'vercel', name: 'Vercel', status: 'error', lastChecked: '2026-03-10T12:00:00Z' },
    ]
    expect(computeGlobalHealth(entries)).toBe('error')
  })

  it('error takes precedence over warn in global health', () => {
    const entries: StatusEntry[] = [
      { id: 'github', name: 'GitHub', status: 'warn', lastChecked: '2026-03-10T12:00:00Z' },
      { id: 'vercel', name: 'Vercel', status: 'error', lastChecked: '2026-03-10T12:00:00Z' },
    ]
    expect(computeGlobalHealth(entries)).toBe('error')
  })

  it('computes global health as ok for empty entries', () => {
    expect(computeGlobalHealth([])).toBe('ok')
  })

  it('status entry has required fields', () => {
    const entry: StatusEntry = {
      id: 'self-monitoring',
      name: 'WhateverOPS',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    }
    expect(entry.id).toBeTruthy()
    expect(entry.name).toBeTruthy()
    expect(['ok', 'warn', 'error']).toContain(entry.status)
    expect(entry.lastChecked).toBeTruthy()
  })
})
