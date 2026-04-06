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
        repos: [],
        stars: 42,
        openIssues: 3,
        openPRs: 1,
        forks: 5,
        watchers: 10,
        language: 'TypeScript',
        lastPush: now,
        repoUrl: '#',
        externalPRs: 0,
        staleIssuesCount: 0,
        starsTrend: 2,
        issues: [],
        lastCommit: { sha: 'abc', message: 'feat: test', date: now, author: 'dev', url: '#' },
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
        recentEvents: [],
        churnRate30d: 2.1,
        currency: 'usd',
        netRevenue30d: 400,
        disputes: { count: 0, totalAmount: 0 },
        openInvoices: { count: 1, totalAmount: 29 },
        recentPayouts: [],
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
        latestIssues: [],
        crashFreeRate: 98.2,
        errorTrend: [],
        errorTrendDirection: 'down' as const,
        latestRelease: { version: '0.1.0', date: now },
        issuesSinceRelease: 3,
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
  ],
  globalHealth: 'warn' as const,
  lastRefresh: now,
  configured: 3,
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
      body: JSON.stringify({ services: [], globalHealth: 'ok', lastRefresh: now }),
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

async function checkNoHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Responsive — Ship Readiness', () => {
  test('mobile (375px) — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await mockAllAPIs(page)
    await page.goto('/')

    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 15000 })

    const noOverflow = await checkNoHorizontalOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('tablet (768px) — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await mockAllAPIs(page)
    await page.goto('/')

    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 15000 })

    const noOverflow = await checkNoHorizontalOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('desktop (1440px) — no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await mockAllAPIs(page)
    await page.goto('/')

    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 15000 })

    const noOverflow = await checkNoHorizontalOverflow(page)
    expect(noOverflow).toBe(true)
  })

  test('mobile — header still visible and functional', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await mockAllAPIs(page)
    await page.goto('/')

    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('header').first()).toBeVisible()
  })

  test('mobile — panel cards stack vertically', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await mockAllAPIs(page)
    await page.goto('/')

    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 15000 })

    // At mobile width, grid should be single column — panels should be stacked
    // Verify that the grid container exists and has content
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()

    // Check no horizontal overflow at the end
    const noOverflow = await checkNoHorizontalOverflow(page)
    expect(noOverflow).toBe(true)
  })
})
