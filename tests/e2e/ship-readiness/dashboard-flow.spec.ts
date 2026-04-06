import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

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
        recentDeploys: [],
        totalDeploys30d: 156,
        successRate: 98.2,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mockAllAPIs(page: Page) {
  await page.route('**/api/dashboard', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDashboardResponse),
    })
  })
  await page.route('**/api/settings', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        deploymentMode: 'selfhosted',
        storageMode: 'env',
        version: '0.1.0',
        dbAvailable: false,
        encryptionKeySet: false,
        integrations: [],
      }),
    })
  })
  await page.route('**/api/status', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        services: [],
        globalHealth: 'ok',
        lastRefresh: now,
      }),
    })
  })
  await page.route('**/health', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok', uptime: 12345, timestamp: now }),
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Dashboard Flow — Ship Readiness', () => {
  test('page loads without console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await mockAllAPIs(page)
    await page.goto('/')

    // Wait for content to render
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 15000 })

    expect(errors).toEqual([])
  })

  test('header is visible with app name', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/')

    const header = page.locator('header').first()
    await expect(header).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })
  })

  test('health indicator is visible', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/')

    // HealthIndicator renders a button with a StatusDot and health label
    // The button has aria-label "Toggle integration status panel"
    const healthButton = page.getByLabel('Toggle integration status panel')
    await expect(healthButton).toBeVisible({ timeout: 10000 })
  })

  test('panel cards render with titles', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/')

    // We have 4 panels — check each name is visible
    const expectedNames = ['GitHub', 'Vercel', 'Sentry', 'Stripe']
    for (const name of expectedNames) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 10000 })
    }

    // Panel cards use h3 elements for titles — at least 4 should render
    const panelTitles = page.locator('main h3')
    const count = await panelTitles.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('clicking refresh triggers network request', async ({ page }) => {
    let requestCount = 0
    await page.route('**/api/dashboard', (route) => {
      requestCount++
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardResponse),
      })
    })
    // Mock other endpoints so nothing breaks
    await page.route('**/api/settings', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })
    await page.route('**/api/status', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })
    await page.route('**/health', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"ok"}' })
    })

    await page.goto('/')
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 15000 })

    const initialCount = requestCount

    // Click the Refresh button
    const refreshBtn = page.getByRole('button', { name: 'Refresh dashboard' })
    await refreshBtn.click()

    // Wait for the new request to fire
    await page.waitForTimeout(1000)
    expect(requestCount).toBeGreaterThan(initialCount)
  })

  test('no uncaught exceptions during full page lifecycle', async ({ page }) => {
    const exceptions: string[] = []
    page.on('pageerror', (err) => exceptions.push(err.message))

    await mockAllAPIs(page)
    await page.goto('/')
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 15000 })

    // Interact with the page — click health indicator, scroll, etc.
    const healthButton = page.getByLabel('Toggle integration status panel')
    if (await healthButton.isVisible()) {
      await healthButton.click()
      await page.waitForTimeout(500)
    }

    expect(exceptions).toEqual([])
  })
})
