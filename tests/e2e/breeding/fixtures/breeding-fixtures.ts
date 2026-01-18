// tests/e2e/breeding/fixtures/breeding-fixtures.ts
// Playwright fixtures for breeding tests with auto-cleanup

import { test as base, Page, APIRequestContext } from '@playwright/test';
import { getHogwartsConfig, HogwartsConfig } from '../config/hogwarts-config';

// Worker-scoped fixtures (created once per worker, reused across tests)
interface BreedingWorkerFixtures {
  hogwartsConfig: HogwartsConfig;
  apiContext: APIRequestContext;
}

// Test-scoped fixtures (created fresh for each test)
interface BreedingTestFixtures {
  authenticatedPage: Page;
  testPlanIds: number[];
  testAnimalIds: number[];
}

export const test = base.extend<BreedingTestFixtures, BreedingWorkerFixtures>({
  // Worker-scoped: config is shared across all tests in a worker
  hogwartsConfig: [async ({}, use) => {
    const config = getHogwartsConfig();
    await use(config);
  }, { scope: 'worker' }],

  // Track created breeding plans for cleanup
  testPlanIds: async ({ apiContext, hogwartsConfig }, use) => {
    const planIds: number[] = [];
    await use(planIds);

    // Cleanup: delete all breeding plans created during test
    if (planIds.length > 0) {
      console.log(`[Cleanup] Deleting ${planIds.length} test breeding plans...`);
      for (const id of planIds) {
        try {
          await apiContext.delete(
            `${hogwartsConfig.apiBaseUrl}/api/v1/breeding/plans/${id}`
          );
          console.log(`[Cleanup] Deleted plan ${id}`);
        } catch (err) {
          console.log(`[Cleanup] Failed to delete plan ${id}:`, err);
        }
      }
    }
  },

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

  // Worker-scoped: API context is created once per worker and reused
  // This prevents hitting rate limits when running multiple tests
  apiContext: [async ({ playwright, hogwartsConfig }, use) => {
    // Create initial API request context for login
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
      console.error(`[ApiContext] Request URL: ${hogwartsConfig.apiBaseUrl}/api/v1/auth/login`);
      await loginContext.dispose();
      throw new Error(`Login failed: ${loginResponse.status()} ${body}`);
    }

    // Extract CSRF token from response cookies
    const cookies = await loginContext.storageState();
    const xsrfCookie = cookies.cookies.find(c => c.name === 'XSRF-TOKEN');
    const csrfToken = xsrfCookie?.value || '';

    if (!csrfToken) {
      console.warn(`[ApiContext] No XSRF-TOKEN cookie found after login`);
    } else {
      console.log(`[ApiContext] Got CSRF token: ${csrfToken.slice(0, 20)}...`);
    }

    // Create new context with CSRF header included
    const apiContext = await playwright.request.newContext({
      baseURL: hogwartsConfig.apiBaseUrl,
      extraHTTPHeaders: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      storageState: cookies, // Preserve session cookies
    });

    console.log(`[ApiContext] Login successful (worker-scoped)`);
    await loginContext.dispose();
    await use(apiContext);

    // Dispose API context when worker is done
    console.log(`[ApiContext] Disposing worker-scoped context`);
    await apiContext.dispose();
  }, { scope: 'worker' }],

  // Authenticated page fixture with auto-login
  authenticatedPage: async ({ page, hogwartsConfig }, use) => {
    // Navigate to login
    await page.goto(`${hogwartsConfig.frontendUrl}/login`);

    // Fill credentials
    await page.fill('input[type="email"], input[name="email"]', hogwartsConfig.email);
    await page.fill('input[type="password"], input[name="password"]', hogwartsConfig.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL(/\/(dashboard|platform|breeding)/, { timeout: 10000 });

    console.log(`[Auth] Logged in as ${hogwartsConfig.email}`);

    await use(page);

    await page.close();
  },
});

export { expect } from '@playwright/test';
