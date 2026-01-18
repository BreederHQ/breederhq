// tests/e2e/animals/cycle-info-tab/cycle-fixtures.ts
// Playwright fixtures for cycle info tab tests with auto-cleanup

import { test as base, Page, APIRequestContext } from '@playwright/test';
import { getHogwartsConfig, HogwartsConfig } from '../../breeding/config/hogwarts-config';

// Worker-scoped fixtures (created once per worker, reused across tests)
interface CycleWorkerFixtures {
  hogwartsConfig: HogwartsConfig;
  apiContext: APIRequestContext;
}

// Test-scoped fixtures (created fresh for each test)
interface CycleTestFixtures {
  authenticatedPage: Page;
  testAnimalIds: number[];
  screenshotPaths: string[];
}

export const test = base.extend<CycleTestFixtures, CycleWorkerFixtures>({
  // Worker-scoped: config is shared across all tests in a worker
  hogwartsConfig: [async ({}, use) => {
    const config = getHogwartsConfig();
    await use(config);
  }, { scope: 'worker' }],

  // Track created test animals for cleanup
  testAnimalIds: async ({ apiContext, hogwartsConfig }, use) => {
    const animalIds: number[] = [];
    await use(animalIds);

    // Cleanup: delete all animals created during test
    if (animalIds.length > 0) {
      console.log(`[Cleanup] Deleting ${animalIds.length} test animals...`);
      for (const id of animalIds) {
        try {
          await apiContext.delete(
            `${hogwartsConfig.apiBaseUrl}/api/v1/animals/${id}`
          );
          console.log(`[Cleanup] Deleted animal ${id}`);
        } catch (err) {
          console.log(`[Cleanup] Failed to delete animal ${id}:`, err);
        }
      }
    }
  },

  // Track screenshot paths for cleanup
  screenshotPaths: async ({}, use, testInfo) => {
    const paths: string[] = [];
    await use(paths);

    // Cleanup: delete all screenshots taken during test
    if (paths.length > 0) {
      console.log(`[Cleanup] Deleting ${paths.length} test screenshots...`);
      const fs = await import('fs');
      for (const p of paths) {
        try {
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            console.log(`[Cleanup] Deleted screenshot ${p}`);
          }
        } catch (err) {
          console.log(`[Cleanup] Failed to delete screenshot ${p}:`, err);
        }
      }
    }
  },

  // Worker-scoped: API context is created once per worker and reused
  apiContext: [async ({ playwright, hogwartsConfig }, use) => {
    console.log(`[ApiContext] Creating WORKER-SCOPED context for ${hogwartsConfig.apiBaseUrl}`);
    const loginContext = await playwright.request.newContext({
      baseURL: hogwartsConfig.apiBaseUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
      },
    });

    // Login to get auth cookie and CSRF token
    console.log(`[ApiContext] Logging in as ${hogwartsConfig.email}...`);
    const loginResponse = await loginContext.post('/api/v1/auth/login', {
      data: {
        email: hogwartsConfig.email,
        password: hogwartsConfig.password,
      },
    });

    if (!loginResponse.ok()) {
      const body = await loginResponse.text();
      console.error(`[ApiContext] Login failed: status=${loginResponse.status()}, body=${body}`);
      await loginContext.dispose();
      throw new Error(`Login failed: ${loginResponse.status()} ${body}`);
    }

    // Extract CSRF token from response cookies
    const cookies = await loginContext.storageState();
    const xsrfCookie = cookies.cookies.find(c => c.name === 'XSRF-TOKEN');
    const csrfToken = xsrfCookie?.value || '';

    // Create new context with CSRF header included
    const apiContext = await playwright.request.newContext({
      baseURL: hogwartsConfig.apiBaseUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      storageState: cookies,
    });

    console.log(`[ApiContext] Login successful (worker-scoped)`);
    await loginContext.dispose();
    await use(apiContext);

    console.log(`[ApiContext] Disposing worker-scoped context`);
    await apiContext.dispose();
  }, { scope: 'worker' }],

  // Authenticated page fixture with auto-login and retry on server errors
  authenticatedPage: async ({ page, hogwartsConfig }, use) => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Navigate to login
        await page.goto(`${hogwartsConfig.frontendUrl}/login`);

        // Wait for the login form to be visible
        await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

        // Fill credentials
        await page.fill('input[type="email"], input[name="email"]', hogwartsConfig.email);
        await page.fill('input[type="password"], input[name="password"]', hogwartsConfig.password);

        // Submit
        await page.click('button[type="submit"]');

        // Wait for either navigation away from login OR an error message
        const result = await Promise.race([
          page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 })
            .then(() => 'success' as const),
          page.locator('text=/login failed|error|500/i').waitFor({ state: 'visible', timeout: 5000 })
            .then(() => 'error' as const)
            .catch(() => null), // Ignore if error message doesn't appear
        ]);

        if (result === 'error') {
          throw new Error('Login failed - server error displayed on page');
        }

        console.log(`[Auth] Logged in as ${hogwartsConfig.email} (attempt ${attempt})`);
        await use(page);
        return; // Success - exit the retry loop
      } catch (err) {
        lastError = err as Error;
        console.log(`[Auth] Login attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          // Wait before retrying to allow server to recover
          console.log(`[Auth] Waiting 2s before retry...`);
          await page.waitForTimeout(2000);
        }
      }
    }

    // All retries exhausted
    throw lastError || new Error('Login failed after all retries');
  },
});

export { expect } from '@playwright/test';
