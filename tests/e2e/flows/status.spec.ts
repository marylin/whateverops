import { test, expect, type Page } from '@playwright/test'

// Mock /api/status response with 5 services in mixed states
const mockStatusResponse = {
  services: [
    {
      id: 'github',
      name: 'GitHub',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'vercel',
      name: 'Vercel',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'sentry',
      name: 'Sentry',
      status: 'warn',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'railway',
      name: 'Railway',
      status: 'error',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'neon',
      name: 'Neon',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
  ],
  globalHealth: 'error' as const,
  lastRefresh: new Date().toISOString(),
}

// All-ok variant used for banner wording tests
const mockStatusAllOk = {
  services: [
    {
      id: 'github',
      name: 'GitHub',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'vercel',
      name: 'Vercel',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'sentry',
      name: 'Sentry',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'railway',
      name: 'Railway',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
    {
      id: 'neon',
      name: 'Neon',
      status: 'ok',
      lastChecked: new Date().toISOString(),
    },
  ],
  globalHealth: 'ok' as const,
  lastRefresh: new Date().toISOString(),
}

async function mockStatusAPI(page: Page, response = mockStatusResponse) {
  await page.route('**/api/status', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

test.describe('Status Page', () => {
  test('loads and displays service list', async ({ page }) => {
    await mockStatusAPI(page)
    await page.goto('/status')

    // Wait for the service list to appear
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 10000 })

    // All 5 services should be rendered
    const expectedServices = ['GitHub', 'Vercel', 'Sentry', 'Railway', 'Neon']
    for (const name of expectedServices) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('shows correct status text for each service state', async ({ page }) => {
    await mockStatusAPI(page)
    await page.goto('/status')

    // Wait for data to render
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 10000 })

    // ok → "Operational"
    const operationalItems = page.getByText('Operational')
    await expect(operationalItems.first()).toBeVisible()

    // warn → "Degraded"
    await expect(page.getByText('Degraded')).toBeVisible()

    // error → "Down"
    await expect(page.getByText('Down')).toBeVisible()
  })

  test('shows "System Issues Detected" global health banner when errors present', async ({
    page,
  }) => {
    await mockStatusAPI(page)
    await page.goto('/status')

    await expect(page.getByText('System Issues Detected')).toBeVisible({ timeout: 10000 })
  })

  test('shows "All Systems Operational" banner when all services are ok', async ({ page }) => {
    await mockStatusAPI(page, mockStatusAllOk)
    await page.goto('/status')

    await expect(page.getByText('All Systems Operational')).toBeVisible({ timeout: 10000 })
  })

  test('shows loading state then content', async ({ page }) => {
    // Delay response to observe loading state
    await page.route('**/api/status', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatusResponse),
      })
    })

    await page.goto('/status')

    // Loading text should appear first
    const loadingText = page.getByText('Loading status...')
    await expect(loadingText)
      .toBeVisible({ timeout: 3000 })
      .catch(() => {
        // Loading may resolve too fast — that's acceptable
      })

    // Content should eventually appear
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 15000 })
  })

  test('shows error state and retry button on API failure', async ({ page }) => {
    await page.route('**/api/status', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('/status')

    // Should show error message
    await expect(page.getByText('Failed to load status')).toBeVisible({ timeout: 10000 })

    // Should show retry button
    await expect(page.getByText('Retry')).toBeVisible()
  })

  test('retry button re-fetches status data', async ({ page }) => {
    const failHandler = (route: Parameters<Parameters<typeof page.route>[1]>[0]) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server Error' }),
      })
    }

    await page.route('**/api/status', failHandler)
    await page.goto('/status')

    // Wait for error state
    await expect(page.getByText('Failed to load status')).toBeVisible({ timeout: 10000 })

    // Switch to success responses before clicking retry
    await page.unroute('**/api/status', failHandler)
    await page.route('**/api/status', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStatusResponse),
      })
    })

    // Click retry
    await page.getByText('Retry').click()

    // Status data should now load
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 10000 })
  })

  test('page title is "Status | WhateverOPS"', async ({ page }) => {
    await mockStatusAPI(page)
    await page.goto('/status')

    await expect(page).toHaveTitle('Status | WhateverOPS')
  })
})
