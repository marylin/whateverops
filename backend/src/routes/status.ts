import { Hono } from 'hono'
import { runIntegration } from '../lib/run-integration.js'

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

const status = new Hono()

function envOrSkip(key: string): string | null {
  return process.env[key] || null
}

export interface StatusEntry {
  id: string
  name: string
  status: 'ok' | 'warn' | 'error'
  lastChecked: string
}

status.get('/', async (c) => {
  const integrations = []

  // Same config logic as dashboard but only returns health summary
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

  const linearKey = envOrSkip('LINEAR_API_KEY')
  if (linearKey) {
    integrations.push(
      runIntegration(linear, { apiKey: linearKey, teamId: process.env.LINEAR_TEAM_ID ?? '' }),
    )
  }

  const vercelToken = envOrSkip('VERCEL_TOKEN')
  if (vercelToken) {
    integrations.push(runIntegration(vercel, { apiKey: vercelToken }))
  }

  const railwayToken = envOrSkip('RAILWAY_TOKEN')
  if (railwayToken) {
    integrations.push(runIntegration(railway, { apiKey: railwayToken }))
  }

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

  const resendKey = envOrSkip('RESEND_API_KEY')
  if (resendKey) {
    integrations.push(runIntegration(resend, { apiKey: resendKey }))
  }

  const anthropicKey = envOrSkip('ANTHROPIC_API_KEY')
  if (anthropicKey) {
    integrations.push(runIntegration(anthropic, { apiKey: anthropicKey }))
  }

  const openaiKey = envOrSkip('OPENAI_API_KEY')
  if (openaiKey) {
    integrations.push(
      runIntegration(openai, { apiKey: openaiKey, orgId: process.env.OPENAI_ORG_ID ?? '' }),
    )
  }

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

  const replitKey = envOrSkip('REPLIT_API_KEY')
  if (replitKey) {
    integrations.push(runIntegration(replit, { apiKey: replitKey }))
  }

  const supabaseServiceKey = envOrSkip('SUPABASE_SERVICE_KEY')
  if (supabaseServiceKey) {
    integrations.push(
      runIntegration(supabaseManagement, {
        apiKey: supabaseServiceKey,
        projectRef: process.env.SUPABASE_PROJECT_REF ?? '',
      }),
    )
  }

  const supabaseUrl = envOrSkip('SUPABASE_URL')
  if (supabaseUrl && supabaseServiceKey) {
    integrations.push(
      runIntegration(supabaseAuth, {
        apiKey: supabaseServiceKey!,
        supabaseUrl,
        projectRef: process.env.SUPABASE_PROJECT_REF ?? '',
      }),
    )
  }

  const neonKey = envOrSkip('NEON_API_KEY')
  if (neonKey) {
    integrations.push(runIntegration(neon, { apiKey: neonKey }))
  }

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

  const stripeKey = envOrSkip('STRIPE_SECRET_KEY')
  if (stripeKey) {
    integrations.push(runIntegration(stripe, { apiKey: stripeKey }))
  }

  // Self-monitoring — always included
  const selfMonitorUrl =
    process.env.SELF_MONITOR_URL ?? `http://localhost:${process.env.PORT ?? 3000}/health`
  integrations.push(runIntegration(selfMonitoring, { apiKey: 'self', healthUrl: selfMonitorUrl }))

  const results = await Promise.all(integrations)

  // Return minimal health summary — no panel data exposed publicly
  const entries: StatusEntry[] = results.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    lastChecked: r.lastUpdated,
  }))

  const globalHealth = entries.some((e) => e.status === 'error')
    ? 'error'
    : entries.some((e) => e.status === 'warn')
      ? 'warn'
      : 'ok'

  return c.json({
    services: entries,
    globalHealth,
    lastRefresh: new Date().toISOString(),
  })
})

export default status
