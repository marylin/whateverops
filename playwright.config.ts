import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'npx tsx src/index.ts',
      cwd: './backend',
      port: 3099,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        PORT: '3099',
        CACHE_BACKEND: 'memory',
        FRONTEND_URL: 'http://localhost:5199',
      },
    },
    {
      command: 'npx vite --port 5199',
      cwd: './frontend',
      port: 5199,
      reuseExistingServer: false,
      env: {
        VITE_API_URL: 'http://localhost:3099',
      },
    },
  ],
})
