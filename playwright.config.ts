import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  // Global timeout for tests (includes hooks)
  timeout: 60000, // 1 minute per test
  // Global setup/teardown hook timeout
  globalTimeout: 300000, // 5 minutes for full suite
  use: {
    baseURL: 'http://localhost:6170',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Don't start dev server automatically - assume it's already running
});
