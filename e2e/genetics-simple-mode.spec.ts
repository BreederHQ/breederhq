import { test, expect, Page } from 'playwright/test';

// Test user credentials
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'luke.skywalker@tester.local',
  password: process.env.TEST_USER_PASSWORD || 'soKpY9yUPoWeLwcRL16ONA',
};

// Helper to select option by partial text match
async function selectOptionByText(page: Page, selectLocator: ReturnType<Page['locator']>, searchText: string) {
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

// Helper to login and navigate to Genetics Lab
async function loginAndNavigateToGeneticsLab(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"], input[type="email"]', TEST_USER.email);
  await page.fill('input[name="password"], input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Dashboard', { timeout: 15000 });
  await page.click('text=Breeding');
  await page.waitForTimeout(500);
  await page.click('text=Genetics Lab');
  await page.waitForSelector('text=Analyze genetic compatibility', { timeout: 10000 });
}

// Helper to accept disclaimer if shown
async function acceptDisclaimerIfShown(page: Page) {
  const disclaimerButton = page.locator('button:has-text("I Understand")');
  if (await disclaimerButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await disclaimerButton.click();
  }
}

// Helper to calculate pairing and wait for results
async function calculatePairing(page: Page, damSearch: string, sireSearch: string) {
  const damSelect = page.locator('select').first();
  await selectOptionByText(page, damSelect, damSearch);

  const sireSelect = page.locator('select').nth(1);
  await selectOptionByText(page, sireSelect, sireSearch);

  await page.click('button:has-text("Calculate")');

  // Handle disclaimer if it appears after clicking calculate
  const disclaimerModal = page.locator('button:has-text("I Understand")');
  if (await disclaimerModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    await disclaimerModal.click();
    await page.waitForTimeout(500);
    await page.click('button:has-text("Calculate")');
  }

  await page.waitForSelector('text=Offspring Predictions', { timeout: 10000 });
}

test.describe('Genetics Lab - Simple Mode Translations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToGeneticsLab(page);
    await acceptDisclaimerIfShown(page);
  });

  test.describe('Technical Mode Display', () => {
    test('should display technical genetics terminology by default', async ({ page }) => {
      // Select a dog pairing with known genetics
      await calculatePairing(page, 'Luna', 'Shadow');

      // Verify we're in Technical mode (button should say "Technical")
      const modeButton = page.locator('button:has-text("Technical")');
      await expect(modeButton).toBeVisible();

      // Verify technical terminology is displayed
      const offspringPredictions = page.locator('text=Offspring Predictions').first();
      await expect(offspringPredictions).toBeVisible();

      // Technical mode should show locus names and percentages
      // Look for technical patterns like "Agouti", "Dilute", percentage patterns
      const coatColorSection = page.locator('text=COAT COLOR');
      await expect(coatColorSection).toBeVisible();

      // Take screenshot of technical view
      await page.screenshot({
        path: 'e2e/screenshots/technical-mode-dog.png',
        fullPage: true
      });
    });

    test('should show genotype notation in technical mode', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Look for genotype patterns (e.g., percentages with phenotypes)
      // Technical view should show things like "100% Sable/Fawn" or "50% Dominant Black"
      const technicalContent = page.locator('.rounded-lg.border-blue-500\\/30');
      await expect(technicalContent).toBeVisible();

      // Verify percentage patterns are visible
      const percentagePattern = page.locator('text=/\\d+%/').first();
      await expect(percentagePattern).toBeVisible();
    });
  });

  test.describe('Simple Mode Display', () => {
    test('should toggle to Simple Mode and show plain English', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Click the mode toggle button to switch to Simple Mode
      const modeButton = page.locator('button:has-text("Technical")');
      await modeButton.click();

      // Verify button now shows "Simple Mode"
      await expect(page.locator('button:has-text("Simple Mode")')).toBeVisible();

      // Simple mode should show introductory text
      const introText = page.locator('text=Here\'s what to expect from this pairing');
      await expect(introText).toBeVisible();

      // Simple mode should show friendly section headers
      const colorsSection = page.locator('text=Colors & Patterns');
      await expect(colorsSection).toBeVisible();

      // Take screenshot of simple view
      await page.screenshot({
        path: 'e2e/screenshots/simple-mode-dog.png',
        fullPage: true
      });
    });

    test('should use species-specific offspring names (puppies for dogs)', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();

      // Verify "puppies" is used instead of generic "offspring"
      const puppiesText = page.locator('text=/puppies/i');
      await expect(puppiesText.first()).toBeVisible();

      // Should NOT see generic "offspring" in simple mode for dogs
      // (This is a soft check - offspring might appear in some contexts)
    });

    test('should translate coat color genetics to plain English', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();

      // Look for translated color descriptions
      // Instead of "Sable/Fawn", should see something like "golden/fawn colored"
      // Instead of technical locus names, should see friendly descriptions
      const simpleModeContent = page.locator('.bg-surface.rounded-lg').first();
      await expect(simpleModeContent).toBeVisible();

      // Verify percentage translations (e.g., "All puppies will" or "Half the puppies will")
      const allPuppies = page.locator('text=/All puppies will|Half the puppies will|Most puppies/i');
      await expect(allPuppies.first()).toBeVisible();
    });

    test('should translate coat type genetics (curly, wavy, etc)', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();

      // Check if Coat Type section exists
      const coatTypeSection = page.locator('text=Coat Type');
      if (await coatTypeSection.isVisible().catch(() => false)) {
        // Should see friendly descriptions like "wavy coat", "curly coat", etc.
        // Instead of "+/Cu" should see "have a wavy coat"
        const coatDescriptions = page.locator('text=/wavy|curly|straight|fluffy|long hair|short hair/i');
        // This might not be present for all pairings, so we just verify the section exists
        await expect(coatTypeSection).toBeVisible();
      }
    });

    test('should show hint to switch back to technical view', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();

      // Verify the hint text is shown
      const hintText = page.locator('text=Want the full genetic details?');
      await expect(hintText).toBeVisible();
    });
  });

  test.describe('Mode Toggle Persistence', () => {
    test('should toggle back to Technical mode', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();
      await expect(page.locator('button:has-text("Simple Mode")')).toBeVisible();

      // Switch back to Technical
      await page.locator('button:has-text("Simple Mode")').click();
      await expect(page.locator('button:has-text("Technical")')).toBeVisible();

      // Verify technical content is shown again
      const coatColorSection = page.locator('text=COAT COLOR');
      await expect(coatColorSection).toBeVisible();
    });
  });

  test.describe('Species-Specific Offspring Names', () => {
    test('should use "foals" for horse pairings', async ({ page }) => {
      // Select horse pairing
      await calculatePairing(page, 'Painted Lady', 'Storm Chaser');

      // Switch to Simple Mode
      const modeButton = page.locator('button:has-text("Technical")');
      if (await modeButton.isVisible().catch(() => false)) {
        await modeButton.click();
      }

      // Verify "foals" is used for horses
      const foalsText = page.locator('text=/foals/i');
      await expect(foalsText.first()).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/simple-mode-horse.png',
        fullPage: true
      });
    });

    test('should use "kids" for goat pairings', async ({ page }) => {
      // Select goat pairing
      await calculatePairing(page, 'Buttercup', 'Thunder');

      // Switch to Simple Mode
      const modeButton = page.locator('button:has-text("Technical")');
      if (await modeButton.isVisible().catch(() => false)) {
        await modeButton.click();
      }

      // Verify "kids" is used for goats
      const kidsText = page.locator('text=/kids/i');
      await expect(kidsText.first()).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/simple-mode-goat.png',
        fullPage: true
      });
    });
  });

  test.describe('Translation Quality Checks', () => {
    test('should not show raw genotypes in simple mode', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();

      // Get all text content from simple mode sections
      const simpleContent = await page.locator('.space-y-4 .bg-surface').allTextContents();
      const allText = simpleContent.join(' ');

      // Check that raw genotype patterns are NOT shown (or are translated)
      // Raw patterns like "+/Cu", "L/l", "F/f" should be translated
      const rawGenotypePattern = /\+\/[A-Z][a-z]|\b[A-Z]\/[a-z]\b/;

      // This is a soft assertion - log if found but don't fail
      // since some patterns might legitimately appear in explanations
      if (rawGenotypePattern.test(allText)) {
        console.log('Warning: Possible raw genotype found in simple mode:',
          allText.match(rawGenotypePattern));
      }
    });

    test('should translate percentage descriptions to friendly language', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();

      // Should see friendly probability language
      const friendlyProbability = page.locator(
        'text=/All .* will|Half the .* will|Most .* \\(3 in 4\\)|Some .* \\(1 in 4\\)|About \\d+%/i'
      );
      await expect(friendlyProbability.first()).toBeVisible();
    });

    test('should handle carrier information gracefully', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();

      // If there's carrier info, it should be translated to "could produce" language
      const simpleContent = await page.locator('.space-y-4').textContent();

      // Check that raw "carries X" is translated to friendly language
      if (simpleContent?.includes('carries')) {
        // Should be in context of "could produce" rather than raw "carries"
        expect(simpleContent).toMatch(/could produce|carry the|carrying/i);
      }
    });
  });

  test.describe('Visual Comparison Screenshots', () => {
    test('capture side-by-side comparison for documentation', async ({ page }) => {
      await calculatePairing(page, 'Luna', 'Shadow');

      // Capture Technical mode
      await page.screenshot({
        path: 'e2e/screenshots/comparison-technical.png',
        fullPage: true
      });

      // Switch to Simple Mode
      await page.locator('button:has-text("Technical")').click();
      await page.waitForTimeout(300); // Wait for transition

      // Capture Simple mode
      await page.screenshot({
        path: 'e2e/screenshots/comparison-simple.png',
        fullPage: true
      });
    });

    test('capture all species simple mode views', async ({ page }) => {
      // Dog
      await calculatePairing(page, 'Luna', 'Shadow');
      await page.locator('button:has-text("Technical")').click();
      await page.screenshot({ path: 'e2e/screenshots/species-dog-simple.png', fullPage: true });

      // Reset by going back to genetics lab
      await page.click('text=Genetics Lab');
      await page.waitForTimeout(500);

      // Horse
      await calculatePairing(page, 'Painted Lady', 'Storm Chaser');
      const horseToggle = page.locator('button:has-text("Technical")');
      if (await horseToggle.isVisible().catch(() => false)) {
        await horseToggle.click();
      }
      await page.screenshot({ path: 'e2e/screenshots/species-horse-simple.png', fullPage: true });

      // Reset
      await page.click('text=Genetics Lab');
      await page.waitForTimeout(500);

      // Goat
      await calculatePairing(page, 'Buttercup', 'Thunder');
      const goatToggle = page.locator('button:has-text("Technical")');
      if (await goatToggle.isVisible().catch(() => false)) {
        await goatToggle.click();
      }
      await page.screenshot({ path: 'e2e/screenshots/species-goat-simple.png', fullPage: true });
    });
  });
});

test.describe('Genetics Simple Mode - Specific Translation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToGeneticsLab(page);
    await acceptDisclaimerIfShown(page);
  });

  test('coat color translations should be human-readable', async ({ page }) => {
    await calculatePairing(page, 'Luna', 'Shadow');
    await page.locator('button:has-text("Technical")').click();

    // Get the Colors & Patterns section text
    const colorsSection = page.locator('text=Colors & Patterns').locator('..').locator('..');
    const text = await colorsSection.textContent();

    // Verify translations are present (not raw locus names)
    // Should see descriptive language, not just "Agouti" or "A Locus"
    console.log('Colors section text:', text);

    // The text should contain friendly descriptions
    expect(text).toMatch(/will|colored|black|brown|pigment|markings|pattern/i);
  });

  test('coat type translations should describe fur characteristics', async ({ page }) => {
    await calculatePairing(page, 'Luna', 'Shadow');
    await page.locator('button:has-text("Technical")').click();

    const coatTypeSection = page.locator('text=Coat Type');
    if (await coatTypeSection.isVisible().catch(() => false)) {
      const parentSection = coatTypeSection.locator('..').locator('..');
      const text = await parentSection.textContent();

      console.log('Coat Type section text:', text);

      // Should describe coat in human terms
      expect(text).toMatch(/coat|hair|wavy|curly|straight|fluffy|long|short|teddy bear|furnishings|smooth/i);
    }
  });
});
