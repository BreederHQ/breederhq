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
 * Logs in as a portal user (buyer) on the client portal
 * Portal is accessed via portal.breederhq.test (or configured PORTAL_URL)
 */
export async function loginAsPortalUser(page: Page): Promise<void> {
  const portalUrl = process.env.PORTAL_URL || 'http://portal.breederhq.test';

  await page.goto(`${portalUrl}/login`);

  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });

  await page.fill('input[type="email"]', process.env.TEST_PORTAL_EMAIL || 'dumbledore.portal.dev@hogwarts.local');
  await page.fill('input[type="password"]', process.env.TEST_PORTAL_PASSWORD || 'LemonDrop123!');

  // Click sign in button - try multiple selectors
  const signInButton = page.locator('button[type="submit"], button:has-text("Sign in")').first();
  await signInButton.click();

  // Wait for portal to fully load after login - longer timeout for API call
  // Wait until we're no longer on the login page (could be dashboard, agreements, etc.)
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 });

  // Additional wait for page to stabilize
  await page.waitForLoadState('networkidle', { timeout: 10000 });
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
  // Try direct logout button first (visible in header)
  const directLogout = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  const isDirectLogoutVisible = await directLogout.isVisible().catch(() => false);

  if (isDirectLogoutVisible) {
    await directLogout.click();
  } else {
    // Fall back to user menu approach
    await page.click('[data-testid="user-menu"], [aria-label="User menu"]');
    await page.click('button:has-text("Logout"), a:has-text("Logout")');
  }

  // Wait for redirect to login
  await page.waitForURL(/\/login/, { timeout: 5000 });
}
