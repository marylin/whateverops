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
import * as replit from '../integrations/replit.js'
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

  // GitHub
  const githubPat = envOrSkip('GITHUB_PAT')
  if (githubPat) {
    integrations.push(
      runIntegration(github, {
        apiKey: githubPat,
        owner: process.env.GITHUB_REPO_OWNER ?? '',
        repo: process.env.GITHUB_REPO_NAME ?? '',
      }),
    )
  }

  // Linear
  const linearKey = envOrSkip('LINEAR_API_KEY')
  if (linearKey) {
    integrations.push(
      runIntegration(linear, {
        apiKey: linearKey,
        teamId: process.env.LINEAR_TEAM_ID ?? '',
      }),
    )
  }

  // Vercel
  const vercelToken = envOrSkip('VERCEL_TOKEN')
  if (vercelToken) {
    integrations.push(runIntegration(vercel, { apiKey: vercelToken }))
  }

  // Railway
  const railwayToken = envOrSkip('RAILWAY_TOKEN')
  if (railwayToken) {
    integrations.push(runIntegration(railway, { apiKey: railwayToken }))
  }

  // PostHog
  const posthogKey = envOrSkip('POSTHOG_PROJECT_API_KEY')
  if (posthogKey) {
    integrations.push(
      runIntegration(posthog, {
        apiKey: posthogKey,
        host: process.env.POSTHOG_HOST ?? 'https://app.posthog.com',
        projectId: process.env.POSTHOG_PROJECT_ID ?? '',
      }),
    )
  }

  // Resend
  const resendKey = envOrSkip('RESEND_API_KEY')
  if (resendKey) {
    integrations.push(runIntegration(resend, { apiKey: resendKey }))
  }

  // Anthropic
  const anthropicKey = envOrSkip('ANTHROPIC_API_KEY')
  if (anthropicKey) {
    integrations.push(
      runIntegration(anthropic, {
        apiKey: anthropicKey,
        adminApiKey: process.env.ANTHROPIC_ADMIN_API_KEY ?? '',
      }),
    )
  }

  // OpenAI
  const openaiKey = envOrSkip('OPENAI_API_KEY')
  if (openaiKey) {
    integrations.push(
      runIntegration(openai, {
        apiKey: openaiKey,
        orgId: process.env.OPENAI_ORG_ID ?? '',
      }),
    )
  }

  // Cloudflare
  const cfToken = envOrSkip('CLOUDFLARE_API_TOKEN')
  if (cfToken) {
    integrations.push(
      runIntegration(cloudflare, {
        apiKey: cfToken,
        zoneId: process.env.CLOUDFLARE_ZONE_ID ?? '',
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
      }),
    )
  }

  // Replit
  const replitKey = envOrSkip('REPLIT_API_KEY')
  if (replitKey) {
    integrations.push(runIntegration(replit, { apiKey: replitKey }))
  }

  // Supabase Management — uses an Access Token (api.supabase.com/v1), NOT service_role
  const supabaseManagementKey = envOrSkip('SUPABASE_MANAGEMENT_KEY')
  if (supabaseManagementKey) {
    integrations.push(
      runIntegration(supabaseManagement, {
        apiKey: supabaseManagementKey,
        projectRef: process.env.SUPABASE_PROJECT_REF ?? '',
      }),
    )
  }

  // Supabase Auth — uses service_role key for Auth admin API
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
  }

  // Neon
  const neonKey = envOrSkip('NEON_API_KEY')
  if (neonKey) {
    integrations.push(runIntegration(neon, { apiKey: neonKey }))
  }

  // Sentry
  const sentryToken = envOrSkip('SENTRY_AUTH_TOKEN')
  if (sentryToken) {
    integrations.push(
      runIntegration(sentry, {
        apiKey: sentryToken,
        org: process.env.SENTRY_ORG ?? '',
        project: process.env.SENTRY_PROJECT ?? '',
      }),
    )
  }

  // Stripe
  const stripeKey = envOrSkip('STRIPE_SECRET_KEY')
  if (stripeKey) {
    integrations.push(runIntegration(stripe, { apiKey: stripeKey }))
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
