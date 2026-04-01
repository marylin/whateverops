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
        stars: 0,
        openIssues: 0,
        openPRs: 0,
        forks: 0,
        watchers: 0,
        language: 'TypeScript',
        lastPush: now,
        repoUrl: '#',
        externalPRs: 0,
        staleIssuesCount: 0,
        starsTrend: 0,
        issues: [],
        lastCommit: { sha: 'abc', message: 'init', date: now, author: 'dev', url: '#' },
        cicd: { recentRuns: [], successRate: 100, lastRunConclusion: 'success' },
        dependabot: { openAlerts: 0, criticalCount: 0, highCount: 0, alerts: [] },
        traffic: { views: 0, uniqueVisitors: 0, clones: 0, uniqueCloners: 0 },
        repoActivities: [],
      },
      error: null,
      cached: false,
      lastUpdated: now,
      ttl: 60,
    },
  ],
  globalHealth: 'ok' as const,
  lastRefresh: now,
  configured: 1,
  total: 14,
}

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
  ],
}

const mockStatusResponse = {
  services: [{ id: 'github', name: 'GitHub', status: 'ok', lastChecked: now }],
  globalHealth: 'ok' as const,
  lastRefresh: now,
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
      body: JSON.stringify(mockSettingsResponse),
    })
  })
  await page.route('**/api/status', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStatusResponse),
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

test.describe('Navigation — Ship Readiness', () => {
  test('dashboard route (/) loads', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/')

    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveTitle('WhateverOPS')
  })

  test('settings route (/settings) loads', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/settings')

    await expect(page).toHaveTitle('Settings | WhateverOPS', { timeout: 10000 })
    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })
  })

  test('status route (/status) loads', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/status')

    await expect(page).toHaveTitle('Status | WhateverOPS', { timeout: 10000 })
    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })
  })

  test('unknown route (/nonexistent) does not crash — renders 404', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await mockAllAPIs(page)
    await page.goto('/nonexistent')

    // The NotFound component renders "404" and "Page not found"
    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Page not found')).toBeVisible()

    // "Back to dashboard" link should be present
    await expect(page.getByText('Back to dashboard')).toBeVisible()

    // No JS errors
    expect(errors).toEqual([])
  })

  test('header nav links work — dashboard to settings to status', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/')

    // Wait for dashboard header
    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })

    // Navigate to Settings via header link
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings/)
    await expect(page.getByRole('heading', { name: 'Credential Storage' })).toBeVisible({
      timeout: 10000,
    })

    // From Settings, navigate to Status via the Status link in Settings header
    await page.getByRole('link', { name: 'Status' }).click()
    await expect(page).toHaveURL(/\/status/)
    await expect(page.getByText('GitHub').first()).toBeVisible({ timeout: 10000 })
  })

  test('direct URL navigation works for all routes', async ({ page }) => {
    await mockAllAPIs(page)

    // Navigate directly to /status
    await page.goto('/status')
    await expect(page).toHaveTitle('Status | WhateverOPS', { timeout: 10000 })

    // Navigate directly to /settings (new navigation, not SPA)
    await page.goto('/settings')
    await expect(page).toHaveTitle('Settings | WhateverOPS', { timeout: 10000 })

    // Navigate directly to /
    await page.goto('/')
    await expect(page).toHaveTitle('WhateverOPS', { timeout: 10000 })
  })

  test('404 page "Back to dashboard" link navigates home', async ({ page }) => {
    await mockAllAPIs(page)
    await page.goto('/nonexistent')

    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 })

    // Click the back to dashboard link
    await page.getByText('Back to dashboard').click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('WhateverOPS').first()).toBeVisible({ timeout: 10000 })
  })
})
