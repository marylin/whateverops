import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date().toISOString()

const mockStatusResponse = {
  services: [
    { id: 'github', name: 'GitHub', status: 'ok', lastChecked: now },
    { id: 'vercel', name: 'Vercel', status: 'ok', lastChecked: now },
    { id: 'sentry', name: 'Sentry', status: 'warn', lastChecked: now },
    { id: 'railway', name: 'Railway', status: 'error', lastChecked: now },
    { id: 'neon', name: 'Neon', status: 'ok', lastChecked: now },
  ],
  globalHealth: 'error' as const,
  lastRefresh: now,
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
  await page.route('**/api/status', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStatusResponse),
    })
  })
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

test.describe('Status Flow — Ship Readiness', () => {
  test('status page loads', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/status')

    await expect(page).toHaveTitle('Status | WhateverOPS', { timeout: 10000 })
  })

  test('service list is visible with all services', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/status')

    const expectedServices = ['GitHub', 'Vercel', 'Sentry', 'Railway', 'Neon']
    for (const name of expectedServices) {
      await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('health summary banner is displayed', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/status')

    // Global health is 'error' so should show "System Issues Detected"
    await expect(page.getByText('System Issues Detected')).toBeVisible({ timeout: 10000 })
  })

  test('shows correct status labels for each state', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/status')

    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 10000 })

    // ok -> Operational, warn -> Degraded, error -> Down
    await expect(page.getByText('Operational').first()).toBeVisible()
    await expect(page.getByText('Degraded')).toBeVisible()
    await expect(page.getByText('Down')).toBeVisible()
  })

  test('last refresh info is shown', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/status')

    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 10000 })

    // Footer shows "Last refresh:" and "Auto-refreshes every 30s"
    await expect(page.getByText('Auto-refreshes every 30s')).toBeVisible()
  })
})
