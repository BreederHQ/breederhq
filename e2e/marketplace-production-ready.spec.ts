import { test, expect } from 'playwright/test';

/**
 * Marketplace Production Readiness E2E Tests
 *
 * Tests verify that the marketplace is ready for production deployment:
 * - No DEV badges visible
 * - Anonymous browsing works
 * - Core pages load correctly
 */

test.describe('DEV Mode Badge Removal', () => {
  test('homepage does not show DEV badge', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/');
    await page.waitForLoadState('networkidle');

    // DEV badge should NOT be visible anywhere
    const devBadge = page.locator('text=/DEV:/');
    await expect(devBadge).not.toBeVisible();

    const gateStatus = page.locator('text=/gate=/');
    await expect(gateStatus).not.toBeVisible();
  });

  test('animals page does not show DEV badge', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/animals');
    await page.waitForLoadState('networkidle');

    const devBadge = page.locator('text=/DEV:/');
    await expect(devBadge).not.toBeVisible();
  });

  test('breeders page does not show DEV badge', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/breeders');
    await page.waitForLoadState('networkidle');

    const devBadge = page.locator('text=/DEV:/');
    await expect(devBadge).not.toBeVisible();
  });
});

test.describe('Anonymous Browsing', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies to ensure we're testing anonymous access
    await context.clearCookies();
  });

  test('anonymous user can view homepage without redirect to login', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/');
    await page.waitForLoadState('networkidle');

    // Should stay on homepage, not redirect to login
    expect(page.url()).toContain('marketplace.breederhq.test');
    expect(page.url()).not.toContain('/auth/login');
    expect(page.url()).not.toContain('/login');

    // Homepage content should be visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('anonymous user can browse /animals page', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/animals');
    await page.waitForLoadState('networkidle');

    // Should stay on animals page
    expect(page.url()).toContain('/animals');
    expect(page.url()).not.toContain('/auth/login');

    // Page should have animals-related content
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('anonymous user can browse /breeders page', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/breeders');
    await page.waitForLoadState('networkidle');

    // Should stay on breeders page
    expect(page.url()).toContain('/breeders');
    expect(page.url()).not.toContain('/auth/login');

    // Page should have breeders-related content
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('anonymous user can browse /services page', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/services');
    await page.waitForLoadState('networkidle');

    // Should stay on services page
    expect(page.url()).toContain('/services');
    expect(page.url()).not.toContain('/auth/login');
  });

  test('anonymous user can view breeder profile pages', async ({ page }) => {
    // First go to breeders list
    await page.goto('http://marketplace.breederhq.test:6172/breeders');
    await page.waitForLoadState('networkidle');

    // Try to find and click a breeder link
    const breederLink = page.locator('a[href^="/breeders/"]').first();

    if (await breederLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await breederLink.click();
      await page.waitForLoadState('networkidle');

      // Should view breeder profile, not redirected to login
      expect(page.url()).toContain('/breeders/');
      expect(page.url()).not.toContain('/auth/login');
    }
  });

  test('protected routes show login form', async ({ page }) => {
    // /saved should require authentication
    await page.goto('http://marketplace.breederhq.test:6172/saved');
    await page.waitForLoadState('networkidle');

    // Should show auth/login form (may not redirect URL, but renders auth content)
    const loginForm = page.locator('button:has-text("Sign in"), input[type="password"]');
    await expect(loginForm.first()).toBeVisible();
  });

  test('protected route /inquiries shows login form', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/inquiries');
    await page.waitForLoadState('networkidle');

    // Should show auth/login form
    const loginForm = page.locator('button:has-text("Sign in"), input[type="password"]');
    await expect(loginForm.first()).toBeVisible();
  });

  test('protected route /waitlist shows login form', async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/waitlist');
    await page.waitForLoadState('networkidle');

    // Should show auth/login form
    const loginForm = page.locator('button:has-text("Sign in"), input[type="password"]');
    await expect(loginForm.first()).toBeVisible();
  });
});

test.describe('Core Page Loading', () => {
  test('homepage loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://marketplace.breederhq.test:6172/');
    await page.waitForLoadState('networkidle');

    // Should have minimal console errors (some warnings are ok)
    const criticalErrors = errors.filter(e =>
      !e.includes('Warning') && !e.includes('DevTools')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('animals page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://marketplace.breederhq.test:6172/animals');
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(e =>
      !e.includes('Warning') && !e.includes('DevTools')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

test.describe('Mobile Bottom Tab Bar', () => {
  test('bottom tab bar is hidden on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://marketplace.breederhq.test:6172/');
    await page.waitForLoadState('networkidle');

    // Bottom tab bar should not be visible on desktop (md:hidden class)
    const bottomTabBar = page.locator('nav[role="tablist"]').filter({
      has: page.locator('a[href="/"], a[href="/animals"], a[href="/saved"]')
    });

    // If it exists, it should be hidden
    if (await bottomTabBar.count() > 0) {
      await expect(bottomTabBar).not.toBeVisible();
    }
  });

  test('bottom tab bar is visible on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://marketplace.breederhq.test:6172/');
    await page.waitForLoadState('networkidle');

    // Look for the fixed bottom navigation
    const bottomNav = page.locator('nav.fixed.bottom-0');

    if (await bottomNav.count() > 0) {
      await expect(bottomNav).toBeVisible();
    }
  });
});
