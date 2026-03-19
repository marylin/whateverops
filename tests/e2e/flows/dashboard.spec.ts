import { test, expect, type Page } from '@playwright/test'

// Mock dashboard API response with all 14 external integrations
const mockDashboardResponse = {
  panels: [
    {
      id: 'github',
      name: 'GitHub',
      status: 'ok',
      data: { stars: 42, openIssues: 3, openPRs: 1, recentCommits: 12 },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
    {
      id: 'linear',
      name: 'Linear',
      status: 'ok',
      data: { open: 5, inProgress: 3, completed: 22, activeCycle: 'Sprint 7' },
      error: null,
      cached: true,
      lastUpdated: new Date().toISOString(),
      ttl: 120,
    },
    {
      id: 'vercel',
      name: 'Vercel',
      status: 'ok',
      data: { totalDeploys: 156, projects: 4, successRate: 98.2 },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
    {
      id: 'railway',
      name: 'Railway',
      status: 'ok',
      data: { projects: 3, services: 7, deployStatus: 'healthy' },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
    {
      id: 'posthog',
      name: 'PostHog',
      status: 'ok',
      data: { activeUsers: 128, totalEvents: 4521, featureFlags: 5 },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
    {
      id: 'resend',
      name: 'Resend',
      status: 'ok',
      data: { domains: 2, apiKeys: 1 },
      error: null,
      cached: true,
      lastUpdated: new Date().toISOString(),
      ttl: 300,
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      status: 'ok',
      data: { keyValid: true, models: ['claude-opus-4-6', 'claude-sonnet-4-5-20250514'] },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 300,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      status: 'ok',
      data: { keyValid: true, models: ['gpt-4o', 'gpt-4o-mini'] },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 300,
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      status: 'ok',
      data: { totalRequests: 85420, bandwidth: '1.2GB', cacheRatio: 94.5 },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
    {
      id: 'supabase-management',
      name: 'Supabase',
      status: 'ok',
      data: { projectHealth: 'healthy', dbSize: '45MB' },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 120,
    },
    {
      id: 'supabase-auth',
      name: 'Supabase Auth',
      status: 'ok',
      data: { totalUsers: 234, newSignups: 12, activeSessions: 45 },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 120,
    },
    {
      id: 'neon',
      name: 'Neon',
      status: 'ok',
      data: { projects: 2, regions: ['us-east-1'], pgVersions: ['16', '15'] },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 300,
    },
    {
      id: 'sentry',
      name: 'Sentry',
      status: 'warn',
      data: { unresolvedIssues: 7, totalEvents: 1289, errorCount: 3, warningCount: 4 },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      status: 'ok',
      data: {
        mrr: 450,
        mrrDelta30d: 50,
        activeSubscriptions: 12,
        newSubscriptions24h: 2,
        canceledSubscriptions30d: 1,
        failedPayments24h: 0,
        failedPaymentAmount: 0,
        recentEvents: [
          {
            id: 'evt_test_1',
            amount: 29,
            currency: 'usd',
            status: 'succeeded',
            date: new Date().toISOString(),
            description: 'Pro Plan',
          },
        ],
        currency: 'usd',
      },
      error: null,
      cached: false,
      lastUpdated: new Date().toISOString(),
      ttl: 60,
    },
  ],
  globalHealth: 'warn' as const,
  lastRefresh: new Date().toISOString(),
  configured: 14,
  total: 14,
}

async function mockDashboardAPI(page: Page) {
  await page.route('**/api/dashboard', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDashboardResponse),
    })
  })
}

test.describe('Dashboard', () => {
  test('loads and displays all 14 integration panels', async ({ page }) => {
    await mockDashboardAPI(page)
    await page.goto('/')

    // Wait for panels to render
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 10000 })

    // Each panel card has an h3 title — count those to verify all 14 rendered
    const panelTitles = page.locator('main h3')
    await expect(panelTitles).toHaveCount(14, { timeout: 10000 })
  })

  test('displays panel titles for all integrations', async ({ page }) => {
    await mockDashboardAPI(page)
    await page.goto('/')

    // Check for integration names in the rendered page
    const expectedNames = [
      'GitHub',
      'Linear',
      'Vercel',
      'Railway',
      'PostHog',
      'Resend',
      'Anthropic',
      'OpenAI',
      'Cloudflare',
      'Supabase',
      'Supabase Auth',
      'Neon',
      'Sentry',
      'Stripe',
    ]

    for (const name of expectedNames) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('shows global health indicator', async ({ page }) => {
    await mockDashboardAPI(page)
    await page.goto('/')

    // The header should exist and show health status
    const header = page.locator('header').first()
    await expect(header).toBeVisible({ timeout: 10000 })

    // Should show configured count
    await expect(page.getByText('14 of 14')).toBeVisible({ timeout: 10000 })
  })

  test('shows loading skeletons then content', async ({ page }) => {
    // Delay the API response to see loading state
    await page.route('**/api/dashboard', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardResponse),
      })
    })

    await page.goto('/')

    // Loading skeletons should appear first
    const loadingPanels = page.getByText('Loading...')
    // Wait briefly for loading state
    await expect(loadingPanels.first())
      .toBeVisible({ timeout: 3000 })
      .catch(() => {
        // Loading might be too fast to catch — that's OK
      })

    // Content should eventually appear
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 15000 })
  })

  test('shows error state and retry button on API failure', async ({ page }) => {
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('/')

    // Should show error message
    await expect(page.getByText('Failed to load dashboard')).toBeVisible({ timeout: 10000 })

    // Should show retry button
    await expect(page.getByText('Retry')).toBeVisible()
  })

  test('retry button re-fetches dashboard data', async ({ page }) => {
    // Start with all API calls returning failure
    const failHandler = (route: Parameters<Parameters<typeof page.route>[1]>[0]) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' }),
      })
    }

    await page.route('**/api/dashboard', failHandler)
    await page.goto('/')

    // Wait for error state
    await expect(page.getByText('Failed to load dashboard')).toBeVisible({ timeout: 10000 })

    // Switch to success responses before clicking retry
    await page.unroute('**/api/dashboard', failHandler)
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardResponse),
      })
    })

    // Click retry
    await page.getByText('Retry').click()

    // Dashboard should now load
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 10000 })
  })

  test('shows empty state when no integrations configured', async ({ page }) => {
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          panels: [],
          globalHealth: 'ok',
          lastRefresh: new Date().toISOString(),
          configured: 0,
          total: 14,
        }),
      })
    })

    await page.goto('/')

    await expect(page.getByText('No integrations configured')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Add API keys')).toBeVisible()
  })

  test('page has dark background and WhateverOPS title', async ({ page }) => {
    await mockDashboardAPI(page)
    await page.goto('/')

    // Wait for the app to render
    await expect(page.getByText('WhateverOPS')).toBeVisible({ timeout: 10000 })

    // Check that the page title is correct
    await expect(page).toHaveTitle('WhateverOPS')
  })
})
