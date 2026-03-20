import { runIntegration, type IntegrationResult } from './run-integration.js'

import * as github from '../integrations/github.js'
import * as linear from '../integrations/linear.js'
import * as vercel from '../integrations/vercel.js'
import * as railway from '../integrations/railway.js'
import * as posthog from '../integrations/posthog.js'
import * as resend from '../integrations/resend.js'
import * as anthropic from '../integrations/anthropic.js'
import * as openai from '../integrations/openai.js'
import * as cloudflare from '../integrations/cloudflare.js'
import * as supabaseManagement from '../integrations/supabase-management.js'
import * as supabaseAuth from '../integrations/supabase-auth.js'
import * as neon from '../integrations/neon.js'
import * as sentry from '../integrations/sentry.js'
import * as stripe from '../integrations/stripe.js'
import * as selfMonitoring from '../integrations/self-monitoring.js'

export function envOrSkip(key: string): string | null {
  return process.env[key] || null
}

/**
 * Returns the numeric suffixes (1..5) for which the given env var has a value.
 * Suffix 1 means the base var (e.g. GITHUB_PAT itself).
 * Suffix 2..5 means the numbered variant (e.g. GITHUB_PAT_2 … GITHUB_PAT_5).
 *
 * Always returns at least [] — the caller is responsible for checking the base var first.
 *
 * @param baseEnvVar - e.g. 'GITHUB_PAT'
 * @returns array of instance numbers (2..5) that have values set
 */
function getExtraInstances(baseEnvVar: string): number[] {
  const extras: number[] = []
  for (let i = 2; i <= 5; i++) {
    if (process.env[`${baseEnvVar}_${i}`]) extras.push(i)
  }
  return extras
}

/**
 * Override a module's INTEGRATION_ID and INTEGRATION_NAME for a numbered instance.
 * Returns a patched module proxy so runIntegration uses the right id/name.
 */
export function withInstance<T extends { INTEGRATION_ID: string; INTEGRATION_NAME: string }>(
  mod: T,
  instanceNum: number,
): T {
  return {
    ...mod,
    INTEGRATION_ID: `${mod.INTEGRATION_ID}-${instanceNum}`,
    INTEGRATION_NAME: `${mod.INTEGRATION_NAME} (${instanceNum})`,
  }
}

/**
 * Build all configured integration promises based on environment variables.
 * Called by both dashboard and status routes — single source of truth.
 *
 *   ENV VARS ──▶ buildConfiguredIntegrations() ──▶ Promise<IntegrationResult>[]
 *       │                                                │
 *       ▼                                                ▼
 *   Skip if missing                              runIntegration() per service
 */
export function buildConfiguredIntegrations(): Promise<IntegrationResult>[] {
  const integrations: Promise<IntegrationResult>[] = []

  // GitHub — supports GITHUB_PAT, GITHUB_PAT_2 … GITHUB_PAT_5
  const githubPat = envOrSkip('GITHUB_PAT')
  if (githubPat) {
    integrations.push(
      runIntegration(github, {
        apiKey: githubPat,
        owner: process.env.GITHUB_REPO_OWNER ?? '',
        repo: process.env.GITHUB_REPO_NAME ?? '',
      }),
    )
    for (const n of getExtraInstances('GITHUB_PAT')) {
      integrations.push(
        runIntegration(withInstance(github, n), {
          apiKey: process.env[`GITHUB_PAT_${n}`]!,
          owner: process.env[`GITHUB_REPO_OWNER_${n}`] ?? process.env.GITHUB_REPO_OWNER ?? '',
          repo: process.env[`GITHUB_REPO_NAME_${n}`] ?? '',
        }),
      )
    }
  }

  // Linear — supports LINEAR_API_KEY, LINEAR_API_KEY_2 … LINEAR_API_KEY_5
  const linearKey = envOrSkip('LINEAR_API_KEY')
  if (linearKey) {
    integrations.push(
      runIntegration(linear, {
        apiKey: linearKey,
        teamId: process.env.LINEAR_TEAM_ID ?? '',
      }),
    )
    for (const n of getExtraInstances('LINEAR_API_KEY')) {
      integrations.push(
        runIntegration(withInstance(linear, n), {
          apiKey: process.env[`LINEAR_API_KEY_${n}`]!,
          teamId: process.env[`LINEAR_TEAM_ID_${n}`] ?? '',
        }),
      )
    }
  }

  // Vercel — supports VERCEL_TOKEN, VERCEL_TOKEN_2 … VERCEL_TOKEN_5
  const vercelToken = envOrSkip('VERCEL_TOKEN')
  if (vercelToken) {
    integrations.push(runIntegration(vercel, { apiKey: vercelToken }))
    for (const n of getExtraInstances('VERCEL_TOKEN')) {
      integrations.push(
        runIntegration(withInstance(vercel, n), { apiKey: process.env[`VERCEL_TOKEN_${n}`]! }),
      )
    }
  }

  // Railway — supports RAILWAY_TOKEN, RAILWAY_TOKEN_2 … RAILWAY_TOKEN_5
  const railwayToken = envOrSkip('RAILWAY_TOKEN')
  if (railwayToken) {
    integrations.push(runIntegration(railway, { apiKey: railwayToken }))
    for (const n of getExtraInstances('RAILWAY_TOKEN')) {
      integrations.push(
        runIntegration(withInstance(railway, n), { apiKey: process.env[`RAILWAY_TOKEN_${n}`]! }),
      )
    }
  }

  // PostHog — supports POSTHOG_PROJECT_API_KEY, POSTHOG_PROJECT_API_KEY_2 … _5
  const posthogKey = envOrSkip('POSTHOG_PROJECT_API_KEY')
  if (posthogKey) {
    integrations.push(
      runIntegration(posthog, {
        apiKey: posthogKey,
        host: process.env.POSTHOG_HOST ?? 'https://app.posthog.com',
        projectId: process.env.POSTHOG_PROJECT_ID ?? '',
      }),
    )
    for (const n of getExtraInstances('POSTHOG_PROJECT_API_KEY')) {
      integrations.push(
        runIntegration(withInstance(posthog, n), {
          apiKey: process.env[`POSTHOG_PROJECT_API_KEY_${n}`]!,
          host:
            process.env[`POSTHOG_HOST_${n}`] ??
            process.env.POSTHOG_HOST ??
            'https://app.posthog.com',
          projectId: process.env[`POSTHOG_PROJECT_ID_${n}`] ?? '',
        }),
      )
    }
  }

  // Resend — supports RESEND_API_KEY, RESEND_API_KEY_2 … RESEND_API_KEY_5
  const resendKey = envOrSkip('RESEND_API_KEY')
  if (resendKey) {
    integrations.push(runIntegration(resend, { apiKey: resendKey }))
    for (const n of getExtraInstances('RESEND_API_KEY')) {
      integrations.push(
        runIntegration(withInstance(resend, n), { apiKey: process.env[`RESEND_API_KEY_${n}`]! }),
      )
    }
  }

  // Anthropic — supports ANTHROPIC_API_KEY, ANTHROPIC_API_KEY_2 … _5
  const anthropicKey = envOrSkip('ANTHROPIC_API_KEY')
  if (anthropicKey) {
    integrations.push(
      runIntegration(anthropic, {
        apiKey: anthropicKey,
        adminApiKey: process.env.ANTHROPIC_ADMIN_API_KEY ?? '',
      }),
    )
    for (const n of getExtraInstances('ANTHROPIC_API_KEY')) {
      integrations.push(
        runIntegration(withInstance(anthropic, n), {
          apiKey: process.env[`ANTHROPIC_API_KEY_${n}`]!,
          adminApiKey: process.env[`ANTHROPIC_ADMIN_API_KEY_${n}`] ?? '',
        }),
      )
    }
  }

  // OpenAI — supports OPENAI_API_KEY, OPENAI_API_KEY_2 … OPENAI_API_KEY_5
  const openaiKey = envOrSkip('OPENAI_API_KEY')
  if (openaiKey) {
    integrations.push(
      runIntegration(openai, {
        apiKey: openaiKey,
        orgId: process.env.OPENAI_ORG_ID ?? '',
      }),
    )
    for (const n of getExtraInstances('OPENAI_API_KEY')) {
      integrations.push(
        runIntegration(withInstance(openai, n), {
          apiKey: process.env[`OPENAI_API_KEY_${n}`]!,
          orgId: process.env[`OPENAI_ORG_ID_${n}`] ?? '',
        }),
      )
    }
  }

  // Cloudflare — supports CLOUDFLARE_API_TOKEN, CLOUDFLARE_API_TOKEN_2 … _5
  const cfToken = envOrSkip('CLOUDFLARE_API_TOKEN')
  if (cfToken) {
    integrations.push(
      runIntegration(cloudflare, {
        apiKey: cfToken,
        zoneId: process.env.CLOUDFLARE_ZONE_ID ?? '',
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
      }),
    )
    for (const n of getExtraInstances('CLOUDFLARE_API_TOKEN')) {
      integrations.push(
        runIntegration(withInstance(cloudflare, n), {
          apiKey: process.env[`CLOUDFLARE_API_TOKEN_${n}`]!,
          zoneId: process.env[`CLOUDFLARE_ZONE_ID_${n}`] ?? '',
          accountId: process.env[`CLOUDFLARE_ACCOUNT_ID_${n}`] ?? '',
        }),
      )
    }
  }

  // Supabase Management — supports SUPABASE_MANAGEMENT_KEY or SUPABASE_ACCESS_TOKEN (fallback)
  // projectRef is optional: if omitted (or empty), all projects under the account are fetched.
  // Set SUPABASE_PROJECT_REF to restrict to a single project.
  const supabaseManagementKey =
    envOrSkip('SUPABASE_MANAGEMENT_KEY') ?? envOrSkip('SUPABASE_ACCESS_TOKEN')
  if (supabaseManagementKey) {
    integrations.push(
      runIntegration(supabaseManagement, {
        apiKey: supabaseManagementKey,
        ...(process.env.SUPABASE_PROJECT_REF
          ? { projectRef: process.env.SUPABASE_PROJECT_REF }
          : {}),
      }),
    )
    for (const n of getExtraInstances('SUPABASE_MANAGEMENT_KEY')) {
      const refN = process.env[`SUPABASE_PROJECT_REF_${n}`]
      integrations.push(
        runIntegration(withInstance(supabaseManagement, n), {
          apiKey: process.env[`SUPABASE_MANAGEMENT_KEY_${n}`]!,
          ...(refN ? { projectRef: refN } : {}),
        }),
      )
    }
  }

  // Supabase Auth — supports SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_KEY_2 … _5
  const supabaseUrl = envOrSkip('SUPABASE_URL')
  const supabaseServiceKey = envOrSkip('SUPABASE_SERVICE_KEY')
  if (supabaseUrl && supabaseServiceKey) {
    integrations.push(
      runIntegration(supabaseAuth, {
        apiKey: supabaseServiceKey,
        supabaseUrl,
        projectRef: process.env.SUPABASE_PROJECT_REF ?? '',
      }),
    )
    for (const n of getExtraInstances('SUPABASE_SERVICE_KEY')) {
      const extraUrl = process.env[`SUPABASE_URL_${n}`] ?? supabaseUrl
      integrations.push(
        runIntegration(withInstance(supabaseAuth, n), {
          apiKey: process.env[`SUPABASE_SERVICE_KEY_${n}`]!,
          supabaseUrl: extraUrl,
          projectRef: process.env[`SUPABASE_PROJECT_REF_${n}`] ?? '',
        }),
      )
    }
  }

  // Neon — supports NEON_API_KEY, NEON_API_KEY_2 … NEON_API_KEY_5
  const neonKey = envOrSkip('NEON_API_KEY')
  if (neonKey) {
    integrations.push(runIntegration(neon, { apiKey: neonKey }))
    for (const n of getExtraInstances('NEON_API_KEY')) {
      integrations.push(
        runIntegration(withInstance(neon, n), { apiKey: process.env[`NEON_API_KEY_${n}`]! }),
      )
    }
  }

  // Sentry — supports SENTRY_AUTH_TOKEN, SENTRY_AUTH_TOKEN_2 … SENTRY_AUTH_TOKEN_5
  const sentryToken = envOrSkip('SENTRY_AUTH_TOKEN')
  if (sentryToken) {
    integrations.push(
      runIntegration(sentry, {
        apiKey: sentryToken,
        org: process.env.SENTRY_ORG ?? '',
        project: process.env.SENTRY_PROJECT ?? '',
      }),
    )
    for (const n of getExtraInstances('SENTRY_AUTH_TOKEN')) {
      integrations.push(
        runIntegration(withInstance(sentry, n), {
          apiKey: process.env[`SENTRY_AUTH_TOKEN_${n}`]!,
          org: process.env[`SENTRY_ORG_${n}`] ?? process.env.SENTRY_ORG ?? '',
          project: process.env[`SENTRY_PROJECT_${n}`] ?? '',
        }),
      )
    }
  }

  // Stripe — supports STRIPE_SECRET_KEY, STRIPE_SECRET_KEY_2 … STRIPE_SECRET_KEY_5
  const stripeKey = envOrSkip('STRIPE_SECRET_KEY')
  if (stripeKey) {
    integrations.push(runIntegration(stripe, { apiKey: stripeKey }))
    for (const n of getExtraInstances('STRIPE_SECRET_KEY')) {
      integrations.push(
        runIntegration(withInstance(stripe, n), {
          apiKey: process.env[`STRIPE_SECRET_KEY_${n}`]!,
        }),
      )
    }
  }

  // Self-monitoring — always enabled, polls own /health
  const selfMonitorUrl =
    process.env.SELF_MONITOR_URL ?? `http://localhost:${process.env.PORT ?? 3000}/health`
  integrations.push(
    runIntegration(selfMonitoring, {
      apiKey: 'self',
      healthUrl: selfMonitorUrl,
    }),
  )

  return integrations
}

/**
 * Compute aggregate health from integration results.
 * error > warn > ok
 */
export function computeGlobalHealth(
  results: { status: 'ok' | 'warn' | 'error' }[],
): 'ok' | 'warn' | 'error' {
  if (results.some((r) => r.status === 'error')) return 'error'
  if (results.some((r) => r.status === 'warn')) return 'warn'
  return 'ok'
}
