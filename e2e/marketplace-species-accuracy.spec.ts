import { test, expect } from 'playwright/test';

/**
 * Marketplace Species Accuracy E2E Tests
 *
 * Tests verify that only supported species are shown in the marketplace.
 * Supported species per database schema: DOG, CAT, HORSE, GOAT, RABBIT, SHEEP
 * NOT supported: Birds, Fish, Reptiles, Exotic pets
 */

const VALID_SPECIES = ['Dogs', 'Cats', 'Horses', 'Rabbits', 'Goats', 'Sheep'];
const INVALID_SPECIES = ['Birds', 'Fish', 'Reptiles', 'Exotic'];

test.describe('Homepage Category Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/');
    await page.waitForLoadState('networkidle');
  });

  test('does NOT show "Birds" category', async ({ page }) => {
    // Birds should not appear anywhere on the homepage
    const birdsText = page.locator('text=Birds');
    await expect(birdsText).not.toBeVisible();
  });

  test('does NOT mention "exotic" pets', async ({ page }) => {
    // "Exotic" should not appear in any category description
    const exoticText = page.locator('text=/exotic/i');
    await expect(exoticText).not.toBeVisible();
  });

  test('shows "Rabbits" category instead of Birds', async ({ page }) => {
    // Rabbits should be a category option (may be "Rabbits" or "Rabbit")
    const rabbitsCategory = page.locator('text=/Rabbit/i');
    await expect(rabbitsCategory.first()).toBeVisible();
  });

  test('"Other Animals" description mentions actual supported species', async ({ page }) => {
    // Find the "Other Animals" card
    const otherAnimalsCard = page.locator('text=Other Animals').locator('..');

    if (await otherAnimalsCard.isVisible()) {
      // Check description mentions actual species like goats, sheep
      const cardText = await otherAnimalsCard.textContent();
      const hasValidDescription =
        cardText?.toLowerCase().includes('goat') ||
        cardText?.toLowerCase().includes('sheep') ||
        cardText?.toLowerCase().includes('more');
      expect(hasValidDescription).toBe(true);

      // Should NOT mention exotic
      expect(cardText?.toLowerCase()).not.toContain('exotic');
    }
  });

  test('category cards link to species filtered pages', async ({ page }) => {
    // Category links should use species filter parameter
    // Dogs category should link to /animals?species=dog
    const dogsLink = page.locator('a[href*="species=dog"]');
    const dogsVisible = await dogsLink.isVisible().catch(() => false);

    // Cats category should link to /animals?species=cat
    const catsLink = page.locator('a[href*="species=cat"]');
    const catsVisible = await catsLink.isVisible().catch(() => false);

    // Rabbits category should link to /animals?species=rabbit
    const rabbitsLink = page.locator('a[href*="species=rabbit"]');
    const rabbitsVisible = await rabbitsLink.isVisible().catch(() => false);

    // At least one species link should be present
    expect(dogsVisible || catsVisible || rabbitsVisible).toBe(true);
  });
});

test.describe('Animals Page Species Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/animals');
    await page.waitForLoadState('networkidle');
  });

  test('species dropdown only contains valid species', async ({ page }) => {
    // Find species filter dropdown
    const speciesSelect = page.locator('select').first();

    if (await speciesSelect.isVisible()) {
      const options = await speciesSelect.locator('option').allTextContents();

      // Check valid species are present
      expect(options.some(o => o.includes('Dogs') || o.includes('Dog'))).toBe(true);
      expect(options.some(o => o.includes('Cats') || o.includes('Cat'))).toBe(true);
      expect(options.some(o => o.includes('Horses') || o.includes('Horse'))).toBe(true);
      expect(options.some(o => o.includes('Rabbits') || o.includes('Rabbit'))).toBe(true);
      expect(options.some(o => o.includes('Goats') || o.includes('Goat'))).toBe(true);
      expect(options.some(o => o.includes('Sheep'))).toBe(true);

      // Check invalid species are NOT present
      expect(options.some(o => o.includes('Bird'))).toBe(false);
      expect(options.some(o => o.includes('Fish'))).toBe(false);
      expect(options.some(o => o.includes('Reptile'))).toBe(false);
      expect(options.some(o => o.includes('Exotic'))).toBe(false);
    }
  });
});

test.describe('Breeders Page Species Filter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://marketplace.breederhq.test:6172/breeders');
    await page.waitForLoadState('networkidle');
  });

  test('species dropdown only contains valid species', async ({ page }) => {
    // Find species filter dropdown
    const speciesSelect = page.locator('select').first();

    if (await speciesSelect.isVisible()) {
      const options = await speciesSelect.locator('option').allTextContents();

      // Check valid species are present
      expect(options.some(o => o.includes('Dogs') || o.includes('Dog'))).toBe(true);
      expect(options.some(o => o.includes('Cats') || o.includes('Cat'))).toBe(true);

      // Check invalid species are NOT present
      expect(options.some(o => o.includes('Bird'))).toBe(false);
      expect(options.some(o => o.includes('Reptile'))).toBe(false);
      expect(options.some(o => o.includes('Exotic'))).toBe(false);
    }
  });
});
