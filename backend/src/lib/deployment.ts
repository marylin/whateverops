import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Detect whether the backend is running in selfhosted or hosted mode.
 * Selfhosted: no NEON_DATABASE_URL (env-only credential storage).
 * Hosted: NEON_DATABASE_URL is set (DB-backed credential storage available).
 */
export function getDeploymentMode(): 'selfhosted' | 'hosted' {
  return process.env.NEON_DATABASE_URL ? 'hosted' : 'selfhosted'
}

/**
 * Read the version from the nearest package.json, falling back to 'dev'.
 */
export function getVersion(): string {
  try {
    const pkgPath = resolve(import.meta.dirname ?? __dirname, '../../package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string }
    return pkg.version ?? 'dev'
  } catch {
    return 'dev'
  }
}
