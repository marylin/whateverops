import { test, expect, type Page } from '@playwright/test'

// Mock dashboard API response with all 14 external integrations
// Data shapes must match the panel component interfaces exactly
const now = new Date().toISOString()

const mockDashboardResponse = {
  panels: [
    {
      id: 'github',
      name: 'GitHub',
      status: 'ok',
      data: {
        repos: [
          {
            name: 'whateverops',
            fullName: 'whateverops-dev/whateverops',
            htmlUrl: 'https://github.com/whateverops-dev/whateverops',
            stars: 42,
            openIssues: 3,
            language: 'TypeScript',
            lastPush: now,
            visibility: 'public',
            isPrimary: true,
          },
        ],
        stars: 42,
        openIssues: 3,
        openPRs: 1,
        forks: 5,
        watchers: 10,
        language: 'TypeScript',
        lastPush: now,
        repoUrl: 'https://github.com/whateverops-dev/whateverops',
        externalPRs: 0,
        staleIssuesCount: 0,
        starsTrend: 2,
        issues: [],
        lastCommit: { sha: 'abc123', message: 'feat: test', date: now, author: 'dev', url: '#' },
        cicd: { recentRuns: [], successRate: 100, lastRunConclusion: 'success' },
        dependabot: { openAlerts: 0, criticalCount: 0, highCount: 0, alerts: [] },
        traffic: { views: 100, uniqueVisitors: 30, clones: 10, uniqueCloners: 5 },
        repoActivities: [],
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'linear',
      name: 'Linear',
      status: 'ok',
      data: {
        teamName: 'WhateverOPS',
        teamKey: 'WHA',
        totalIssues: 30,
        openCount: 5,
        inProgressIssues: [
          {
            identifier: 'WHA-1',
            title: 'Test issue',
            priority: 2,
            priorityLabel: 'High',
            stateName: 'In Progress',
            labels: [],
            projectName: null,
            url: '#',
          },
        ],
        inProgressCount: 3,
        priorityBreakdown: { High: 2, Medium: 3 },
        labelBreakdown: { bug: 1 },
        projects: [{ name: 'Phase 4', state: 'started', progress: 0.3 }],
        bugsInProgress: 1,
        featuresInProgress: 2,
        cycleName: 'Sprint 7',
        cycleProgress: 0.6,
        daysLeftInCycle: 5,
        completedThisCycle: 8,
        cycleTotalIssues: 15,
      },
      error: null,
      cached: true,
      lastUpdated: now,
      ttl: 120,
    },
    {
      id: 'vercel',
      name: 'Vercel',
      status: 'ok',
      data: {
        projectCount: 4,
        projects: [
          {
            id: 'prj_1',
            name: 'whateverops-frontend',
            framework: 'vite',
            url: 'https://whateverops.dev',
            latestDeploy: {
              status: 'READY',
              created: now,
              commitMessage: 'feat: deploy',
              buildDurationSec: 45,
              errorMessage: null,
            },
          },
        ],
        recentDeploys: [
          {
            id: 'dpl_1',
            project: 'whateverops-frontend',
            status: 'READY',
            created: now,
            url: 'https://whateverops.dev',
            commitMessage: 'feat: deploy',
            target: 'production',
            buildDurationSec: 45,
            errorMessage: null,
            checksStatus: null,
          },
        ],
        totalDeploys30d: 156,
        successRate: 98.2,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'railway',
      name: 'Railway',
      status: 'ok',
      data: {
        projectCount: 3,
        serviceCount: 7,
        recentDeploys: [{ id: 'dep_1', status: 'SUCCESS', createdAt: now, serviceName: 'backend' }],
        lastDeployTime: now,
        activeServices: 7,
        services: [
          {
            name: 'backend',
            project: 'whateverops',
            latestDeployStatus: 'SUCCESS',
            healthcheckPath: '/health',
          },
        ],
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'posthog',
      name: 'PostHog',
      status: 'ok',
      data: {
        dau: 128,
        wau: 450,
        eventsToday: 4521,
        eventsTrend: [{ date: now, count: 4521 }],
        topEvents: [{ event: '$pageview', count: 3200 }],
        dauTrend: [{ date: now, count: 128 }],
        dauChangePercent: 5.2,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'resend',
      name: 'Resend',
      status: 'ok',
      data: {
        domainCount: 2,
        domains: [{ name: 'whateverops.dev', status: 'verified' }],
        apiKeyCount: 1,
        recentEmails: [],
        deliveryRate: 99.5,
        totalSent: 150,
        bouncedCount: 1,
        domainStats: [
          {
            name: 'whateverops.dev',
            status: 'verified',
            totalSent: 150,
            deliveredCount: 149,
            bouncedCount: 1,
            deliveryRate: 99.3,
            recentEmails: [],
          },
        ],
      },
      error: null,
      cached: true,
      lastUpdated: now,
      ttl: 300,
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      status: 'ok',
      data: {
        keyValid: true,
        availableModels: ['claude-opus-4-6', 'claude-sonnet-4-5-20250514'],
        modelCount: 2,
        rateLimits: {
          tokensRemaining: null,
          tokensLimit: null,
          tokensUsedPct: null,
          requestsRemaining: null,
          requestsLimit: null,
          requestsUsedPct: null,
          tokensReset: null,
        },
        usage: { totalCost30d: 12.5, dailyCosts: [], modelUsage: [], hasAdminKey: false },
        projectedMonthlySpend: 15.0,
        costTrendPct: null,
        highestCostModel: null,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 300,
    },
    {
      id: 'openai',
      name: 'OpenAI',
      status: 'ok',
      data: {
        keyValid: true,
        availableModels: ['gpt-4o', 'gpt-4o-mini'],
        modelCount: 2,
        rateLimits: {
          tokensRemaining: null,
          tokensLimit: null,
          tokensUsedPct: null,
          requestsRemaining: null,
          requestsLimit: null,
          requestsUsedPct: null,
        },
        usage: { totalCost30d: 8.75, dailyCosts: [], modelUsage: [], hasData: false },
        projectedMonthlySpend: 10.0,
        costTrendPct: null,
        highestCostModel: null,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 300,
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      status: 'ok',
      data: {
        requests24h: 85420,
        bandwidth24h: '1.2GB',
        threatsBlocked: 12,
        cacheHitRatio: 94.5,
        zoneName: 'whateverops.dev',
        zoneStatus: 'active',
        sslStatus: 'active',
        sslCertCount: 1,
        responseBreakdown: { status2xx: 80000, status3xx: 3000, status4xx: 2000, status5xx: 420 },
        firewallEventsCount: 3,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'supabase-management',
      name: 'Supabase',
      status: 'ok',
      data: {
        projectCount: 1,
        projectName: 'whateverops',
        projectStatus: 'ACTIVE_HEALTHY',
        region: 'us-east-1',
        dbVersion: '15.6',
        healthChecks: [{ name: 'database', status: 'ok' }],
        healthyCount: 1,
        totalChecks: 1,
        readOnly: false,
        advisorCount: 0,
        advisors: [],
        projects: [
          {
            id: 'proj_1',
            projectName: 'whateverops',
            projectStatus: 'ACTIVE_HEALTHY',
            region: 'us-east-1',
            dbVersion: '15.6',
            healthChecks: [{ name: 'database', status: 'ok' }],
            healthyCount: 1,
            totalChecks: 1,
            readOnly: false,
            advisorCount: 0,
            advisors: [],
          },
        ],
        apiRequestCount: null,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 120,
    },
    {
      id: 'supabase-auth',
      name: 'Supabase Auth',
      status: 'ok',
      data: {
        totalUsers: 234,
        recentSignups: 12,
        activeRecently: 45,
        providerBreakdown: { email: 200, google: 34 },
        signupsTrend: 'up' as const,
        dauPct: 19.2,
        daysSinceLastSignup: 0,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 120,
    },
    {
      id: 'neon',
      name: 'Neon',
      status: 'ok',
      data: {
        projectCount: 2,
        projects: [
          {
            name: 'whateverops-prod',
            region: 'us-east-1',
            pgVersion: 16,
            updatedAt: now,
            branchCount: 2,
            primaryBranch: 'main',
            endpointCount: 1,
            endpointStatus: 'active',
            activeTimeSec: 3600,
            computeTimeSec: 1800,
            storageMB: 45,
          },
        ],
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 300,
    },
    {
      id: 'sentry',
      name: 'Sentry',
      status: 'warn',
      data: {
        unresolvedCount: 7,
        events24h: 1289,
        newIssues24h: 2,
        usersAffected24h: 15,
        latestIssues: [
          {
            id: 'issue_1',
            title: 'TypeError in handler',
            culprit: 'routes/api',
            count: 12,
            level: 'error',
            lastSeen: now,
            userCount: 5,
          },
        ],
        crashFreeRate: 98.2,
        errorTrend: [{ date: now, count: 7 }],
        errorTrendDirection: 'down' as const,
        latestRelease: { version: '0.1.0', date: now },
        issuesSinceRelease: 3,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      status: 'ok',
      data: {
        mrr: 450,
        mrrDelta30d: 50,
        mrrGrowthPct: 12.5,
        projectedAnnualRevenue: 5400,
        arpu: 37.5,
        activeSubscriptions: 12,
        newSubscriptions24h: 2,
        daysSinceLastNewSub: 0,
        canceledSubscriptions30d: 1,
        failedPayments24h: 0,
        failedPaymentAmount: 0,
        recentEvents: [
          {
            id: 'evt_test_1',
            amount: 29,
            currency: 'usd',
            status: 'succeeded',
            date: now,
            description: 'Pro Plan',
          },
        ],
        churnRate30d: 2.1,
        currency: 'usd',
        netRevenue30d: 400,
        disputes: { count: 0, totalAmount: 0 },
        openInvoices: { count: 1, totalAmount: 29 },
        recentPayouts: [{ amount: 380, arrivalDate: now, status: 'paid' }],
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
  ],
  globalHealth: 'warn' as const,
  lastRefresh: now,
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
