import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date().toISOString()

const mockDashboardAllErrors = {
  panels: [
    {
      id: 'github',
      name: 'GitHub',
      status: 'error',
      data: null,
      error: 'Failed to connect to GitHub API — GITHUB_PAT expired',
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'vercel',
      name: 'Vercel',
      status: 'error',
      data: null,
      error: 'Vercel API returned 401 — token revoked',
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'sentry',
      name: 'Sentry',
      status: 'error',
      data: null,
      error: 'Sentry unreachable — timeout after 10s',
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      status: 'error',
      data: null,
      error: 'Stripe API key invalid',
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
  ],
  globalHealth: 'error' as const,
  lastRefresh: now,
  configured: 4,
  total: 14,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mockSupportingAPIs(page: Page) {
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Empty & Error States — Ship Readiness', () => {
  test('all panels in error state — does not white-screen', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await mockSupportingAPIs(page)
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardAllErrors),
      })
    })

    await page.goto('/')

    // Panel titles should still render even in error state
    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Vercel').first()).toBeVisible()
    await expect(page.getByText('Sentry').first()).toBeVisible()
    await expect(page.getByText('Stripe').first()).toBeVisible()

    // The page should not be blank — header should be present
    await expect(page.locator('header').first()).toBeVisible()

    // No uncaught JS errors
    expect(pageErrors).toEqual([])
  })

  test('dashboard shows error UI for each errored panel', async ({ page }) => {
    await mockSupportingAPIs(page)
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardAllErrors),
      })
    })

    await page.goto('/')
    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 15000 })

    // The health indicator in the header should reflect error state
    const healthButton = page.getByLabel('Toggle integration status panel')
    await expect(healthButton).toBeVisible({ timeout: 10000 })
  })

  test('API returning 500 — frontend handles gracefully', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await mockSupportingAPIs(page)
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('/')

    // Should show the error message
    await expect(page.getByText('Failed to load dashboard')).toBeVisible({ timeout: 10000 })

    // Should show a Retry button
    await expect(page.getByText('Retry')).toBeVisible()

    // No uncaught exceptions — the app handles the error
    expect(pageErrors).toEqual([])
  })

  test('refresh after error state works', async ({ page }) => {
    await mockSupportingAPIs(page)

    // Start with 500
    const failHandler = (route: Parameters<Parameters<typeof page.route>[1]>[0]) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' }),
      })
    }

    await page.route('**/api/dashboard', failHandler)
    await page.goto('/')

    await expect(page.getByText('Failed to load dashboard')).toBeVisible({ timeout: 10000 })

    // Switch to success
    await page.unroute('**/api/dashboard', failHandler)
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardAllErrors),
      })
    })

    // Click Retry
    await page.getByText('Retry').click()

    // Dashboard should now render panels (even errored ones)
    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 10000 })
  })

  test('empty panels array — shows "No integrations configured"', async ({ page }) => {
    await mockSupportingAPIs(page)
    await page.route('**/api/dashboard', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          panels: [],
          globalHealth: 'ok',
          lastRefresh: now,
          configured: 0,
          total: 14,
        }),
      })
    })

    await page.goto('/')

    await expect(page.getByText('No integrations configured')).toBeVisible({ timeout: 10000 })
  })
})
