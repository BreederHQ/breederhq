// tests/e2e/fixtures/base-fixtures.ts
// Base Playwright fixtures with auto-cleanup

import { test as base, Page } from '@playwright/test';
import * as crypto from 'crypto';

type TestFixtures = {
  authenticatedPage: Page;
  testContractIds: number[];
};

export const test = base.extend<TestFixtures>({
  // Array to track created contracts for cleanup
  testContractIds: async ({}, use) => {
    const contractIds: number[] = [];
    await use(contractIds);

    // Cleanup: delete all contracts created during test
    if (contractIds.length > 0 && process.env.API_BASE_URL) {
      console.log(`Cleaning up ${contractIds.length} test contracts...`);
      for (const id of contractIds) {
        try {
          await fetch(`${process.env.API_BASE_URL}/api/v1/contracts/${id}`, {
            method: 'DELETE',
          }).catch(() => {
            // Ignore errors during cleanup
          });
        } catch {
          // Ignore
        }
      }
    }
  },

  // Authenticated page fixture (auto-login)
  authenticatedPage: async ({ page }, use) => {
    // Perform login before each test
    const email = process.env.TEST_BREEDER_EMAIL || 'test.breeder@example.com';
    const password = process.env.TEST_BREEDER_PASSWORD || 'TestPassword123!';

    // Navigate to login
    await page.goto('/login');

    // Fill login form
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/(dashboard|platform|contracts)/, { timeout: 10000 }).catch(() => {
      // If navigation doesn't happen, we might already be logged in
    });

    // Use the authenticated page
    await use(page);

    // Cleanup after test
    await page.close();
  },
});

export { expect } from '@playwright/test';
