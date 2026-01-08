import { test, expect, Page } from 'playwright/test';

// Test user credentials - override with environment variables
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'luke.skywalker@tester.local',
  password: process.env.TEST_USER_PASSWORD || 'soKpY9yUPoWeLwcRL16ONA',
};

// Helper to select option by partial text match
async function selectOptionByText(page: Page, selectLocator: ReturnType<Page['locator']>, searchText: string) {
  // Get all options from the select
  const options = await selectLocator.locator('option').all();
  for (const option of options) {
    const text = await option.textContent();
    if (text && text.toLowerCase().includes(searchText.toLowerCase())) {
      const value = await option.getAttribute('value');
      if (value) {
        await selectLocator.selectOption(value);
        return;
      }
    }
  }
  throw new Error(`No option found containing: ${searchText}`);
}

test.describe('Genetics Lab', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for login to complete - look for Dashboard text or sidebar
    await page.waitForSelector('text=Dashboard', { timeout: 15000 });

    // Navigate to Genetics Lab via sidebar
    await page.click('text=Breeding');
    await page.waitForTimeout(500);
    await page.click('text=Genetics Lab');
    await page.waitForSelector('text=Analyze genetic compatibility', { timeout: 10000 });
  });

  test('Lethal White Overo Warning - Horse pairing should show danger warning', async ({ page }) => {
    // Accept disclaimer if shown
    const disclaimerButton = page.locator('button:has-text("I Understand")');
    if (await disclaimerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerButton.click();
    }

    // Select Dam: Painted Lady (Frame Overo Mare)
    const damSelect = page.locator('select').first();
    await selectOptionByText(page, damSelect, 'Painted Lady');

    // Select Sire: Storm Chaser (Frame Overo Stallion)
    const sireSelect = page.locator('select').nth(1);
    await selectOptionByText(page, sireSelect, 'Storm Chaser');

    // Click Calculate button
    await page.click('button:has-text("Calculate")');

    // Handle disclaimer modal if it appears after clicking calculate
    const disclaimerModal = page.locator('button:has-text("I Understand")');
    if (await disclaimerModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerModal.click();
      await page.waitForTimeout(500);
      // Click calculate again after accepting
      await page.click('button:has-text("Calculate")');
    }

    // Wait for results
    await page.waitForSelector('text=Offspring Predictions', { timeout: 10000 });

    // Verify warning is displayed
    const warningElement = page.locator('text=LETHAL WHITE OVERO').first();
    await expect(warningElement).toBeVisible();

    // Verify score is 0 (100 point penalty)
    const scoreElement = page.locator('text=0/100').first();
    await expect(scoreElement).toBeVisible();

    // Take a screenshot for verification
    await page.screenshot({ path: 'e2e/screenshots/lethal-white-overo-warning.png', fullPage: true });
  });

  test('Double Merle Warning - Dog pairing should show danger warning', async ({ page }) => {
    // Accept disclaimer if shown
    const disclaimerButton = page.locator('button:has-text("I Understand")');
    if (await disclaimerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerButton.click();
    }

    // Select Dam: Luna (Merle Carrier Female)
    const damSelect = page.locator('select').first();
    await selectOptionByText(page, damSelect, 'Luna (Merle');

    // Select Sire: Maverick (Merle Carrier Male)
    const sireSelect = page.locator('select').nth(1);
    await selectOptionByText(page, sireSelect, 'Maverick');

    // Click Calculate
    await page.click('button:has-text("Calculate")');

    // Handle disclaimer if it appears
    const disclaimerModal = page.locator('button:has-text("I Understand")');
    if (await disclaimerModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerModal.click();
      await page.waitForTimeout(500);
      await page.click('button:has-text("Calculate")');
    }

    // Wait for results
    await page.waitForSelector('text=Offspring Predictions', { timeout: 10000 });

    // Verify Double Merle warning
    const warningElement = page.locator('text=DOUBLE MERLE').first();
    await expect(warningElement).toBeVisible();

    // Score should be 50 (100 - 50 penalty)
    const scoreElement = page.locator('text=50/100').first();
    await expect(scoreElement).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/double-merle-warning.png', fullPage: true });
  });

  test('Safe Merle Breeding - No warning should appear', async ({ page }) => {
    // Accept disclaimer if shown
    const disclaimerButton = page.locator('button:has-text("I Understand")');
    if (await disclaimerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerButton.click();
    }

    // Select Dam: Luna (Merle Carrier Female)
    const damSelect = page.locator('select').first();
    await selectOptionByText(page, damSelect, 'Luna (Merle');

    // Select Sire: Shadow (Non-Merle Male)
    const sireSelect = page.locator('select').nth(1);
    await selectOptionByText(page, sireSelect, 'Shadow (Non-Merle');

    // Click Calculate
    await page.click('button:has-text("Calculate")');

    // Handle disclaimer if it appears
    const disclaimerModal = page.locator('button:has-text("I Understand")');
    if (await disclaimerModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerModal.click();
      await page.waitForTimeout(500);
      await page.click('button:has-text("Calculate")');
    }

    // Wait for results
    await page.waitForSelector('text=Offspring Predictions', { timeout: 10000 });

    // Verify NO Double Merle warning appears
    const warningElement = page.locator('text=DOUBLE MERLE');
    await expect(warningElement).not.toBeVisible();

    // Score should be 100 (no penalties)
    const scoreElement = page.locator('text=100/100').first();
    await expect(scoreElement).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/safe-merle-breeding.png', fullPage: true });
  });

  test('Polled x Polled Warning - Goat pairing should show danger warning', async ({ page }) => {
    // Accept disclaimer if shown
    const disclaimerButton = page.locator('button:has-text("I Understand")');
    if (await disclaimerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerButton.click();
    }

    // Select Dam: Buttercup (Polled Doe)
    const damSelect = page.locator('select').first();
    await selectOptionByText(page, damSelect, 'Buttercup');

    // Select Sire: Thunder (Polled Buck)
    const sireSelect = page.locator('select').nth(1);
    await selectOptionByText(page, sireSelect, 'Thunder');

    // Click Calculate
    await page.click('button:has-text("Calculate")');

    // Handle disclaimer if it appears
    const disclaimerModal = page.locator('button:has-text("I Understand")');
    if (await disclaimerModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await disclaimerModal.click();
      await page.waitForTimeout(500);
      await page.click('button:has-text("Calculate")');
    }

    // Wait for results
    await page.waitForSelector('text=Offspring Predictions', { timeout: 10000 });

    // Verify Polled warning (look for the warning message, not the dropdown option)
    const warningElement = page.locator('text=POLLED x POLLED');
    await expect(warningElement).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/polled-warning.png', fullPage: true });
  });
});
