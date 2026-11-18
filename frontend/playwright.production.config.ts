import { defineConfig, devices } from '@playwright/test';

if (!process.env.PRODUCTION_WEB_URL || !process.env.PRODUCTION_API_URL) {
  throw new Error('Set PRODUCTION_WEB_URL and PRODUCTION_API_URL to the published application.');
}

export default defineConfig({
  testDir: './test-production',
  outputDir: './test-results/production',
  fullyParallel: false,
  workers: 1,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: 'list',
  use: {
    baseURL: process.env.PRODUCTION_WEB_URL,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    { name: 'desktop', testMatch: 'desktop.spec.ts', use: devices['Desktop Chrome'] },
    {
      name: 'mobile',
      testMatch: 'mobile.spec.ts',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
});
