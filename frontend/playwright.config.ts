import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '../backend/.env' });
const databaseUrl = process.env.TEST_DATABASE_URL;
if (
  !databaseUrl ||
  !new URL(databaseUrl).pathname.endsWith('_test') ||
  databaseUrl === process.env.DATABASE_URL
) {
  throw new Error('UI tests require a dedicated TEST_DATABASE_URL ending in _test.');
}

export default defineConfig({
  testDir: './test',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  globalSetup: './test/setup.ts',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: 'npm run start -w backend',
      cwd: '..',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: false,
      env: {
        DATABASE_URL: databaseUrl,
        PORT: '3001',
        JWT_SECRET: 'ui-test-secret-at-least-32-characters-long',
        FRONTEND_URL: 'http://127.0.0.1:5174',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false,
      env: { VITE_API_URL: 'http://localhost:3001/api' },
    },
  ],
});
