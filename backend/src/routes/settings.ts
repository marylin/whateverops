import { Hono } from 'hono'
import { getDeploymentMode, getVersion } from '../lib/deployment.js'
import { getStorageMode, setStorageMode } from '../lib/storage-mode.js'
import { INTEGRATION_ENV_MAP, INTEGRATION_NAMES } from '../lib/integration-env-map.js'

const settings = new Hono()

/** Build the per-integration summary used by the GET / response. */
function buildIntegrationSummary() {
  return Object.entries(INTEGRATION_ENV_MAP).map(([id, fieldMap]) => {
    const envVars = Object.entries(fieldMap).map(([field, varName]) => ({
      field,
      varName,
      set: Boolean(process.env[varName]),
    }))

    // An integration is "configured" when its primary apiKey env var is set.
    // Self-monitoring is always considered configured (it uses its own health URL).
    const configured =
      id === 'self-monitoring' ? true : Boolean(process.env[fieldMap['apiKey'] ?? ''])

    return {
      id,
      name: INTEGRATION_NAMES[id] ?? id,
      configured,
      envVars,
    }
  })
}

/**
 * GET /api/settings
 * Returns deployment mode, storage mode, version, DB/encryption availability,
 * and a per-integration configuration summary.
 */
settings.get('/', (c) => {
  const deploymentMode = getDeploymentMode()
  const storageMode = getStorageMode()
  const version = getVersion()
  const dbAvailable = Boolean(process.env.NEON_DATABASE_URL)
  const encryptionKeySet = Boolean(process.env.CREDENTIAL_ENCRYPTION_KEY)
  const integrations = buildIntegrationSummary()

  return c.json({
    deploymentMode,
    storageMode,
    version,
    dbAvailable,
    encryptionKeySet,
    integrations,
  })
})

/**
 * POST /api/settings/storage-mode
 * Body: { mode: 'env' | 'db' }
 * Validates preconditions and switches the in-memory storage mode.
 */
settings.post('/storage-mode', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json(
      { error: 'Invalid JSON body', status: 400, timestamp: new Date().toISOString() },
      400,
    )
  }

  if (
    !body ||
    typeof body !== 'object' ||
    !('mode' in body) ||
    (body.mode !== 'env' && body.mode !== 'db')
  ) {
    return c.json(
      {
        error: 'Body must be { mode: "env" | "db" }',
        status: 400,
        timestamp: new Date().toISOString(),
      },
      400,
    )
  }

  try {
    setStorageMode(body.mode as 'env' | 'db')
    return c.json({ storageMode: body.mode })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to set storage mode'
    return c.json({ error: message, status: 422, timestamp: new Date().toISOString() }, 422)
  }
})

export default settings
