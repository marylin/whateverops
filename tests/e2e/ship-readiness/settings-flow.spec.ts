import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date().toISOString()

const mockSettingsResponse = {
  deploymentMode: 'selfhosted',
  storageMode: 'env',
  version: '0.1.0',
  dbAvailable: false,
  encryptionKeySet: false,
  integrations: [
    {
      id: 'github',
      name: 'GitHub',
      configured: true,
      envVars: [{ field: 'pat', varName: 'GITHUB_PAT', set: true }],
    },
    {
      id: 'vercel',
      name: 'Vercel',
      configured: true,
      envVars: [{ field: 'token', varName: 'VERCEL_TOKEN', set: true }],
    },
    {
      id: 'sentry',
      name: 'Sentry',
      configured: false,
      envVars: [{ field: 'auth_token', varName: 'SENTRY_AUTH_TOKEN', set: false }],
    },
    {
      id: 'stripe',
      name: 'Stripe',
      configured: true,
      envVars: [{ field: 'secret_key', varName: 'STRIPE_SECRET_KEY', set: true }],
    },
  ],
}

const mockDashboardResponse = {
  panels: [],
  globalHealth: 'ok' as const,
  lastRefresh: now,
  configured: 0,
  total: 14,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function mockAllAPIs(page: Page) {
  await page.route('**/api/settings', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSettingsResponse),
    })
  })
  await page.route('**/api/dashboard', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDashboardResponse),
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

test.describe('Settings Flow — Ship Readiness', () => {
  test('settings page loads when navigated directly', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/settings')

    // Page should have the Settings title
    await expect(page).toHaveTitle('Settings | WhateverOPS', { timeout: 10000 })
  })

  test('navigate to settings via header link', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/')

    // Wait for dashboard to load
    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })

    // Click the Settings link in the header
    const settingsLink = page.getByRole('link', { name: 'Settings' })
    await settingsLink.click()

    // Should be on /settings
    await expect(page).toHaveURL(/\/settings/)
    await expect(page).toHaveTitle('Settings | WhateverOPS', { timeout: 10000 })
  })

  test('storage mode section is visible', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/settings')

    // The SectionCard with title "Credential Storage" should be visible
    await expect(page.getByRole('heading', { name: 'Credential Storage' })).toBeVisible({
      timeout: 10000,
    })

    // The two radio options should be present
    await expect(page.getByText('Environment Variables')).toBeVisible()
    await expect(page.getByText('Database (Encrypted)')).toBeVisible()
  })

  test('integration list is visible', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/settings')

    // The Integrations section card
    await expect(page.getByText('Integrations').first()).toBeVisible({ timeout: 10000 })

    // Individual integration names
    for (const name of ['GitHub', 'Vercel', 'Sentry', 'Stripe']) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 10000 })
    }

    // Connected / Not set badges
    await expect(page.getByText('Connected').first()).toBeVisible()
    await expect(page.getByText('Not set').first()).toBeVisible()
  })

  test('system info section displays correctly', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/settings')

    // System Info section
    await expect(page.getByText('System Info')).toBeVisible({ timeout: 10000 })

    // Key values from mock
    await expect(page.getByText('Self-hosted', { exact: true })).toBeVisible()
    await expect(page.getByText('Env vars', { exact: true })).toBeVisible()
    await expect(page.getByText('0.1.0')).toBeVisible()
  })

  test('navigate back to dashboard from settings', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: 'Credential Storage' })).toBeVisible({
      timeout: 10000,
    })

    // Click the WhateverOPS logo link which navigates to /
    const homeLink = page.locator('header').getByRole('link', { name: 'WhateverOPS' })
    await homeLink.click()

    // Should be on root
    await expect(page).toHaveURL(/\/$/)
    await expect(page).toHaveTitle('WhateverOPS', { timeout: 10000 })
  })
})
