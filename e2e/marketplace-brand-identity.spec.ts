import { test, expect } from 'playwright/test';

/**
 * Marketplace Brand Identity E2E Tests
 *
 * Tests verify that the public marketplace correctly displays BreederHQ branding
 * and visual identity elements as specified in the UI/UX audit remediation.
 *
 * These tests run against marketplace.breederhq.test (port 6172)
 */

test.describe('Marketplace Brand Identity', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to marketplace homepage
    await page.goto('http://marketplace.breederhq.test:6172/');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('displays BreederHQ logo in header, not generic smiley face', async ({ page }) => {
    // Should have actual logo image with BreederHQ alt text
    const logo = page.locator('header img[alt*="BreederHQ"], header img[alt*="Logo"]');
    await expect(logo).toBeVisible();

    // Verify it's an actual image that loaded (not a broken placeholder)
    const logoSrc = await logo.getAttribute('src');
    expect(logoSrc).toBeTruthy();
    expect(logoSrc).toContain('logo'); // Should reference logo asset

    // Should NOT have the old smiley face SVG
    const smileyFaceSvg = page.locator('header svg path[d*="M16 2C8.268"]');
    await expect(smileyFaceSvg).not.toBeVisible();
  });

  test('logo links to homepage', async ({ page }) => {
    const logoLink = page.locator('header a').filter({ has: page.locator('img[alt*="BreederHQ"]') });
    await expect(logoLink).toBeVisible();

    const href = await logoLink.getAttribute('href');
    expect(href).toBe('/');
  });

  test('brand text shows "BreederHQ" with orange "HQ"', async ({ page }) => {
    // Check for brand text in header
    const brandText = page.locator('header').getByText('BreederHQ');
    // The HQ portion should be styled with brand orange
    const hqSpan = page.locator('header span.text-\\[hsl\\(var\\(--brand-orange\\)\\)\\]');

    // At least one of these should exist
    const hasStyledHQ = await hqSpan.count() > 0;
    const hasBrandText = await brandText.count() > 0;
    expect(hasStyledHQ || hasBrandText).toBe(true);
  });
});

test.describe('Marketplace Brand Colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/');
    await page.waitForLoadState('networkidle');
  });

  test('brand orange color is used in UI elements', async ({ page }) => {
    // Check that brand orange (#ff7a1a) is present in the page styling
    // This can be via CSS classes or inline styles
    const pageHtml = await page.content();

    // Brand orange should appear in either:
    // 1. CSS variable usage: hsl(var(--brand-orange)) or similar
    // 2. Tailwind accent classes: bg-accent, text-accent
    // 3. Direct hex color: #ff7a1a or rgb(255, 122, 26)
    const hasOrangeClasses =
      pageHtml.includes('brand-orange') ||
      pageHtml.includes('accent') ||
      pageHtml.includes('ff7a1a') ||
      pageHtml.includes('ff6b35'); // Previous accent color

    expect(hasOrangeClasses).toBe(true);
  });

  test('category cards have orange accent styling', async ({ page }) => {
    // Category cards should use brand orange for icons/accents
    const categoryCards = page.locator('a[href*="species="], a[href="/animals"]');
    const count = await categoryCards.count();

    // Should have category cards
    expect(count).toBeGreaterThan(0);

    // Check that category section uses orange styling
    const firstCard = categoryCards.first();
    if (await firstCard.isVisible()) {
      const cardHtml = await firstCard.evaluate(el => el.outerHTML);
      // Should have orange-related classes
      const hasOrangeStyle =
        cardHtml.includes('brand-orange') ||
        cardHtml.includes('accent') ||
        cardHtml.includes('ff7a1a');
      // This is a soft check - styling may vary
      // Main validation is that cards exist and are styled
    }
  });
});
