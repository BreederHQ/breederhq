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

  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });

  await page.fill('input[type="email"]', options.email);
  await page.fill('input[type="password"]', options.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete with longer timeout
  try {
    await page.waitForURL(/\/(dashboard|platform|portal|contracts|contacts|animals)/, { timeout: 15000 });
  } catch {
    // If specific URL not reached, just wait for any navigation away from login
    try {
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10000 });
    } catch {
      // Check if we're still on login page with an error message
      const errorMessage = await page.locator('.text-red-500, .text-red-400, [class*="error"]').textContent().catch(() => null);
      if (errorMessage) {
        throw new Error(`Login failed: ${errorMessage}`);
      }
      throw new Error(`Login timed out - still on ${page.url()}`);
    }
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
 * Clears cookies and navigates to login page
 */
export async function logout(page: Page): Promise<void> {
  const currentUrl = page.url();
  const isPortal = currentUrl.includes('portal.breederhq') || currentUrl.includes('/t/');
  const context = page.context();

  // Clear all cookies for the current domain
  await context.clearCookies();

  if (isPortal) {
    // Portal: navigate to portal login page
    const tenantMatch = currentUrl.match(/\/t\/([^/]+)/);
    const tenantSlug = tenantMatch ? tenantMatch[1] : 'dev-hogwarts';
    const portalUrl = process.env.PORTAL_URL || 'http://portal.breederhq.test';
    await page.goto(`${portalUrl}/t/${tenantSlug}/login`);
  } else {
    // Platform: navigate to platform login page
    const baseUrl = process.env.BASE_URL || 'http://localhost:6170';
    await page.goto(`${baseUrl}/login`);
  }

  // Wait for login page to load
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });
}
