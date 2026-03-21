/**
 * Storage mode manager — controls where integration credentials are read from.
 *
 * 'env'  — credentials read directly from environment variables (default, selfhosted)
 * 'db'   — credentials stored encrypted in Neon PostgreSQL (requires NEON_DATABASE_URL
 *           and CREDENTIAL_ENCRYPTION_KEY to be set)
 */

type StorageMode = 'env' | 'db'

let currentMode: StorageMode = 'env'

/** Returns the active credential storage mode. */
export function getStorageMode(): StorageMode {
  return currentMode
}

/**
 * Switches the credential storage mode.
 * Throws if switching to 'db' without the required environment variables.
 */
export function setStorageMode(mode: StorageMode): void {
  if (mode === 'db') {
    const missingVars: string[] = []

    if (!process.env.NEON_DATABASE_URL) {
      missingVars.push('NEON_DATABASE_URL')
    }
    if (!process.env.CREDENTIAL_ENCRYPTION_KEY) {
      missingVars.push('CREDENTIAL_ENCRYPTION_KEY')
    }

    if (missingVars.length > 0) {
      throw new Error(
        `Cannot switch to DB storage mode — missing required env vars: ${missingVars.join(', ')}`,
      )
    }
  }

  currentMode = mode
}
