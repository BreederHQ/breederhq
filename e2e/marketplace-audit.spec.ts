import { test, expect } from 'playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR_BREEDER = path.join(__dirname, '../docs/marketplace/audit/screenshots/breeder-portal');
const SCREENSHOT_DIR_MARKETPLACE = path.join(__dirname, '../docs/marketplace/audit/screenshots/marketplace-public');

// Credentials
const BREEDER_CREDENTIALS = {
  email: 'luke.skywalker@tester.local',
  password: 'soKpY9yUPoWeLwcRL16ONA'
};

const MARKETPLACE_CREDENTIALS = {
  email: 'marketplace-access@bhq.local',
  password: 'Marketplace2026!'
};

/**
 * Breeder Portal Audit (app.breederhq.test)
 * This is the styled version with platform integration
 */
test.describe('Breeder Portal Audit (app.breederhq.test)', () => {
  test.beforeEach(async ({ page }) => {
    // Login to breeder portal
    await page.goto('https://app.breederhq.test/auth');
    await page.fill('input[type="email"]', BREEDER_CREDENTIALS.email);
    await page.fill('input[type="password"]', BREEDER_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 30000 });
  });

  test('01-dashboard-overview', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_BREEDER, '01-dashboard-overview.png'),
      fullPage: true
    });
  });

  test('02-navigate-to-marketplace-section', async ({ page }) => {
    // Look for marketplace link in sidebar
    const marketplaceLink = page.locator('a:has-text("Marketplace")').first();
    if (await marketplaceLink.isVisible()) {
      await marketplaceLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_BREEDER, '02-marketplace-section.png'),
        fullPage: true
      });
    } else {
      // Screenshot whatever is visible
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_BREEDER, '02-no-marketplace-link-found.png'),
        fullPage: true
      });
    }
  });

  test('03-sidebar-navigation', async ({ page }) => {
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_BREEDER, '03-sidebar-navigation.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 300, height: 800 }
    });
  });

  test('04-header-design-system', async ({ page }) => {
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_BREEDER, '04-header-design-system.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1400, height: 80 }
    });
  });

  test('05-random-page-animals', async ({ page }) => {
    await page.goto('https://app.breederhq.test/dashboard/animals');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_BREEDER, '05-animals-page.png'),
      fullPage: true
    });
  });

  test('06-random-page-breeding', async ({ page }) => {
    await page.goto('https://app.breederhq.test/dashboard/breeding');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_BREEDER, '06-breeding-page.png'),
      fullPage: true
    });
  });

  test('07-random-page-settings', async ({ page }) => {
    await page.goto('https://app.breederhq.test/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_BREEDER, '07-settings-page.png'),
      fullPage: true
    });
  });
});

/**
 * Public Marketplace Audit (marketplace.breederhq.test)
 * This is the standalone marketplace that may have styling issues
 */
test.describe('Public Marketplace Audit (marketplace.breederhq.test)', () => {

  test('01-homepage-unauthenticated', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_MARKETPLACE, '01-homepage-unauthenticated.png'),
      fullPage: true
    });
  });

  test('02-homepage-header-closeup', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_MARKETPLACE, '02-homepage-header.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1400, height: 150 }
    });
  });

  test('03-homepage-above-fold', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_MARKETPLACE, '03-homepage-above-fold.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1400, height: 800 }
    });
  });

  test.describe('Authenticated User Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Login to marketplace
      await page.goto('https://marketplace.breederhq.test/auth/login');
      await page.waitForLoadState('networkidle');

      // Screenshot login page first
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '04-login-page.png'),
        fullPage: true
      });

      // Fill login form
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      if (await emailInput.isVisible()) {
        await emailInput.fill(MARKETPLACE_CREDENTIALS.email);
        await passwordInput.fill(MARKETPLACE_CREDENTIALS.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
      }
    });

    test('05-homepage-authenticated', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '05-homepage-authenticated.png'),
        fullPage: true
      });
    });

    test('06-browse-animals-page', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/animals');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '06-browse-animals.png'),
        fullPage: true
      });
    });

    test('07-browse-animals-filters', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/animals');
      await page.waitForLoadState('networkidle');

      // Look for species filter
      const speciesFilter = page.locator('text=Species, text=Category, select, [data-testid*="filter"]').first();
      if (await speciesFilter.isVisible()) {
        await speciesFilter.click();
        await page.waitForTimeout(500);
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '07-animals-filters-open.png'),
        fullPage: true
      });
    });

    test('08-browse-breeders-page', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/breeders');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '08-browse-breeders.png'),
        fullPage: true
      });
    });

    test('09-browse-services-page', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/services');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '09-browse-services.png'),
        fullPage: true
      });
    });

    test('10-breeder-detail-page', async ({ page }) => {
      // First go to breeders list and click first one
      await page.goto('https://marketplace.breederhq.test/breeders');
      await page.waitForLoadState('networkidle');

      // Find and click first breeder card
      const breederLink = page.locator('a[href*="/breeders/"]').first();
      if (await breederLink.isVisible()) {
        await breederLink.click();
        await page.waitForLoadState('networkidle');
      }

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '10-breeder-detail.png'),
        fullPage: true
      });
    });

    test('11-inquiries-page', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/inquiries');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '11-inquiries-page.png'),
        fullPage: true
      });
    });

    test('12-saved-listings-page', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/saved');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '12-saved-listings.png'),
        fullPage: true
      });
    });

    test('13-waitlist-positions-page', async ({ page }) => {
      await page.goto('https://marketplace.breederhq.test/waitlist');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '13-waitlist-positions.png'),
        fullPage: true
      });
    });

    test('14-mobile-homepage', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('https://marketplace.breederhq.test/');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '14-mobile-homepage.png'),
        fullPage: true
      });
    });

    test('15-mobile-browse-animals', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('https://marketplace.breederhq.test/animals');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '15-mobile-animals.png'),
        fullPage: true
      });
    });

    test('16-tablet-homepage', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('https://marketplace.breederhq.test/');
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR_MARKETPLACE, '16-tablet-homepage.png'),
        fullPage: true
      });
    });
  });
});

/**
 * Brand Identity Verification
 */
test.describe('Brand Identity Verification', () => {
  test('verify-logo-presence-marketplace', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/');
    await page.waitForLoadState('networkidle');

    // Check for logo
    const logo = page.locator('img[alt*="logo" i], img[src*="logo" i], img[alt*="breederhq" i]').first();
    const logoVisible = await logo.isVisible();

    // Screenshot to document
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_MARKETPLACE, 'brand-logo-check.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 400, height: 100 }
    });

    console.log(`Logo visible on marketplace homepage: ${logoVisible}`);
  });

  test('check-color-scheme-marketplace', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/');
    await page.waitForLoadState('networkidle');

    // Get computed styles of key elements
    const bodyBgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    console.log(`Body background color: ${bodyBgColor}`);

    // Screenshot header for color analysis
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_MARKETPLACE, 'brand-color-header.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1400, height: 100 }
    });
  });

  test('check-navigation-prominence', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/');
    await page.waitForLoadState('networkidle');

    // Check for Animals | Breeders | Services navigation
    const animalsNav = page.locator('a:has-text("Animals"), button:has-text("Animals")').first();
    const breedersNav = page.locator('a:has-text("Breeders"), button:has-text("Breeders")').first();
    const servicesNav = page.locator('a:has-text("Services"), button:has-text("Services")').first();

    const animalsVisible = await animalsNav.isVisible();
    const breedersVisible = await breedersNav.isVisible();
    const servicesVisible = await servicesNav.isVisible();

    console.log(`Navigation visibility - Animals: ${animalsVisible}, Breeders: ${breedersVisible}, Services: ${servicesVisible}`);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR_MARKETPLACE, 'brand-navigation-check.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1400, height: 200 }
    });
  });
});
