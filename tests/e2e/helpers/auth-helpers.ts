// tests/e2e/helpers/auth-helpers.ts
// Authentication helper functions for E2E tests

import { Page, BrowserContext } from '@playwright/test';

export interface LoginOptions {
  email: string;
  password: string;
}

/**
 * Logs in a user via the UI
 */
export async function loginViaUI(page: Page, options: LoginOptions): Promise<void> {
  await page.goto('/login');

  await page.fill('input[type="email"]', options.email);
  await page.fill('input[type="password"]', options.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete - be lenient about the URL
  try {
    await page.waitForURL(/\/(dashboard|platform|portal|contracts|contacts|animals)/, { timeout: 10000 });
  } catch {
    // If specific URL not reached, just wait for any navigation away from login
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 5000 });
  }
}

/**
 * Logs in as a platform user (breeder)
 */
export async function loginAsBreeder(page: Page): Promise<void> {
  await loginViaUI(page, {
    email: process.env.TEST_BREEDER_EMAIL || 'test.breeder@example.com',
    password: process.env.TEST_BREEDER_PASSWORD || 'TestPassword123!',
  });
}

/**
 * Logs in as a portal user (buyer)
 */
export async function loginAsPortalUser(page: Page): Promise<void> {
  await loginViaUI(page, {
    email: process.env.TEST_PORTAL_EMAIL || 'test.buyer@example.com',
    password: process.env.TEST_PORTAL_PASSWORD || 'TestPassword123!',
  });
}

/**
 * Saves authentication state for reuse
 */
export async function saveAuthState(
  context: BrowserContext,
  path: string
): Promise<void> {
  await context.storageState({ path });
}

/**
 * Logs out the current user
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"], [aria-label="User menu"]');

  // Click logout
  await page.click('button:has-text("Logout"), a:has-text("Logout")');

  // Wait for redirect to login
  await page.waitForURL(/\/login/, { timeout: 5000 });
}
