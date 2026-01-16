import { defineConfig, devices } from 'playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, 'tests/e2e/.env') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? 'github' : 'html',

  // Global setup and teardown
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),

  // Global timeout for tests (includes hooks)
  timeout: parseInt(process.env.TIMEOUT || '60000'),

  // Global setup/teardown hook timeout
  globalTimeout: 300000, // 5 minutes for full suite

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:6170',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Slower actions for debugging
    ...(process.env.SLOW_MO && { slowMo: parseInt(process.env.SLOW_MO) }),
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Run headless in CI, headed locally by default
        headless: process.env.CI ? true : (process.env.HEADLESS === 'true'),
      },
    },

    // Optional: test on multiple browsers
    // Uncomment to enable Firefox and WebKit testing
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Don't start dev server automatically - assume it's already running
  // If you want Playwright to start the dev server, uncomment below:
  // webServer: {
  //   command: 'npm run dev',
  //   port: 5173,
  //   reuseExistingServer: !process.env.CI,
  // },
});
