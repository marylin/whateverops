/**
 * Maps each integration ID to its config fields and the environment variable
 * names that back them. Used by the settings API to report which env vars
 * are configured without exposing their values.
 *
 * Shape: { [integrationId]: { [configField]: 'ENV_VAR_NAME' } }
 */
export const INTEGRATION_ENV_MAP: Record<string, Record<string, string>> = {
  github: {
    apiKey: 'GITHUB_PAT',
    owner: 'GITHUB_REPO_OWNER',
    repo: 'GITHUB_REPO_NAME',
  },
  linear: {
    apiKey: 'LINEAR_API_KEY',
    teamId: 'LINEAR_TEAM_ID',
  },
  vercel: {
    apiKey: 'VERCEL_TOKEN',
  },
  railway: {
    apiKey: 'RAILWAY_TOKEN',
  },
  posthog: {
    apiKey: 'POSTHOG_PERSONAL_API_KEY',
    host: 'POSTHOG_HOST',
    projectId: 'POSTHOG_PROJECT_ID',
  },
  resend: {
    apiKey: 'RESEND_API_KEY',
  },
  anthropic: {
    apiKey: 'ANTHROPIC_API_KEY',
    adminApiKey: 'ANTHROPIC_ADMIN_API_KEY',
  },
  openai: {
    apiKey: 'OPENAI_API_KEY',
    orgId: 'OPENAI_ORG_ID',
  },
  cloudflare: {
    apiKey: 'CLOUDFLARE_API_TOKEN',
    zoneId: 'CLOUDFLARE_ZONE_ID',
  },
  'supabase-management': {
    managementKey: 'SUPABASE_ACCESS_TOKEN',
  },
  'supabase-auth': {
    managementKey: 'SUPABASE_ACCESS_TOKEN',
  },
  'supabase-storage': {
    managementKey: 'SUPABASE_ACCESS_TOKEN',
  },
  neon: {
    apiKey: 'NEON_API_KEY',
  },
  sentry: {
    apiKey: 'SENTRY_AUTH_TOKEN',
    org: 'SENTRY_ORG',
    project: 'SENTRY_PROJECT',
  },
  stripe: {
    apiKey: 'STRIPE_SECRET_KEY',
  },
  blotato: {
    apiKey: 'BLOTATO_API_KEY',
  },
  'self-monitoring': {
    apiKey: 'SELF_MONITOR_URL',
    healthUrl: 'SELF_MONITOR_URL',
  },
}

/** Human-readable display names, keyed by integration ID */
export const INTEGRATION_NAMES: Record<string, string> = {
  github: 'GitHub',
  linear: 'Linear',
  vercel: 'Vercel',
  railway: 'Railway',
  posthog: 'PostHog',
  resend: 'Resend',
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  cloudflare: 'Cloudflare',
  'supabase-management': 'Supabase',
  'supabase-auth': 'Supabase Auth',
  'supabase-storage': 'Supabase Storage',
  neon: 'Neon',
  sentry: 'Sentry',
  stripe: 'Stripe',
  blotato: 'Blotato',
  'self-monitoring': 'WhateverOPS',
}
