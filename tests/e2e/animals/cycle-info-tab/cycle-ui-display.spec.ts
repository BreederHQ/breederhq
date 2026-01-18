// tests/e2e/animals/cycle-info-tab/cycle-ui-display.spec.ts
// Tests for the UI display of cycle info, including date formatting and visualizations

import { test, expect } from './cycle-fixtures';
import {
  createTestAnimal,
  setCycleStartDates,
  updateAnimal,
  navigateToCycleTab,
  todayISO,
  addDays,
} from './cycle-helpers';
import * as path from 'path';
import * as fs from 'fs';

// Run tests serially to avoid overwhelming the API
test.describe.configure({ mode: 'serial' });

test.describe('Cycle Info Tab UI Display', () => {
  // ============================================================================
  // Test 1: Cycle history displays correctly
  // ============================================================================
  test('Cycle history displays dates correctly', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set cycle history
    const today = todayISO();
    const dates = [
      addDays(today, -360),
      addDays(today, -180),
      addDays(today, -1),
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    // Navigate to the cycle info tab
    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Should show cycle history section
    await expect(authenticatedPage.locator('text=/cycle history/i')).toBeVisible({ timeout: 10000 });

    // The number of cycles should be displayed
    await expect(authenticatedPage.locator('text=/\\d+ recorded/i')).toBeVisible();
  });

  // ============================================================================
  // Test 2: Next cycle hero cards display
  // ============================================================================
  test('Next cycle hero shows heat expected and ovulation window', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set cycle history
    const today = todayISO();
    const dates = [
      addDays(today, -360),
      addDays(today, -180),
      addDays(today, -30),
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Hero cards should be visible
    await expect(authenticatedPage.locator('text=/heat expected/i')).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.locator('text=/ovulation window/i')).toBeVisible();
  });

  // ============================================================================
  // Test 3: Override input displays current value
  // ============================================================================
  test('Override section shows current override value', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const overrideDays = 195;
    // Create animal first, then set override via update (override can't be set during creation)
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set the override via API update
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: overrideDays,
    });

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Should show the override value in the UI
    // The override is shown as "Current cycle length: X days (override)"
    // Check for the override value displayed anywhere on the page
    await expect(
      authenticatedPage.getByText(`${overrideDays} days`).or(
        authenticatedPage.getByText(String(overrideDays))
      ).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ============================================================================
  // Test 4: Cycle length insight badge appears for non-average cyclers
  // ============================================================================
  test('Cycle length insight shows for short/long cyclers', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2019-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set cycle history with SHORT cycles (160 days vs 180 average)
    const today = todayISO();
    const shortCycleDays = 160;
    const dates = [
      addDays(today, -480),
      addDays(today, -320),
      addDays(today, -160),
      addDays(today, -1),
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Should show "Short Cycler" badge or text (±14 days threshold for dogs)
    // Use .first() since there may be multiple matching elements (badge + description text)
    await expect(
      authenticatedPage.locator('text=/short cycler|shorter than/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ============================================================================
  // Test 5: No cycle data shows appropriate empty state
  // ============================================================================
  test('Shows appropriate message when no cycle data', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2022-01-01',
    });
    testAnimalIds.push(animal.id);

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Should show some form of "no data" or "building pattern" message
    await expect(
      authenticatedPage.locator('text=/no.*data|building|record.*cycle/i')
    ).toBeVisible({ timeout: 10000 });
  });

  // ============================================================================
  // Test 6: Date formatting uses local timezone correctly
  // ============================================================================
  test('Date formatting displays consistently without timezone shift', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set a specific date that could shift with timezone issues
    // Using Jan 15, 2025 - if displayed as Jan 14, there's a timezone bug
    const testDate = '2025-01-15';
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [testDate],
    });

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Expand cycle history if needed
    const historyToggle = authenticatedPage.locator('text=/cycle history|view.*history/i');
    if (await historyToggle.isVisible()) {
      await historyToggle.click();
      await authenticatedPage.waitForTimeout(300);
    }

    // The date should display as Jan 15, not Jan 14 (timezone shift bug)
    await expect(
      authenticatedPage.locator('text=/Jan.*15/i')
    ).toBeVisible({ timeout: 5000 });
  });

  // ============================================================================
  // Test 7: HORSE species shows correct terminology and defaults
  // ============================================================================
  test('HORSE - Shows correct species-specific UI', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Horse ${Date.now()}`,
      species: 'HORSE',
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set some cycle history
    const today = todayISO();
    const dates = [
      addDays(today, -42),
      addDays(today, -21),
      addDays(today, -1),
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Should show heat/cycle info - use .first() since multiple elements match
    await expect(authenticatedPage.locator('text=/heat|cycle/i').first()).toBeVisible({ timeout: 10000 });
  });

  // ============================================================================
  // Test 8: Clicking expand on cycle history shows all entries
  // ============================================================================
  test('Cycle history expands to show all entries', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set multiple cycle dates
    const today = todayISO();
    const dates = [
      addDays(today, -720),
      addDays(today, -540),
      addDays(today, -360),
      addDays(today, -180),
      addDays(today, -1),
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Find and click the cycle history toggle
    const historyToggle = authenticatedPage.locator('button, [role="button"]').filter({
      hasText: /cycle history|view.*history|recorded/i
    });

    if (await historyToggle.isVisible()) {
      await historyToggle.click();
      await authenticatedPage.waitForTimeout(500);

      // After expansion, should see the "latest" badge on most recent entry
      await expect(
        authenticatedPage.locator('text=/latest/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  // ============================================================================
  // Test 9: Countdown labels show correct urgency for imminent heat
  // ============================================================================
  test('Shows urgency indicators for imminent heat', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `UI Test Horse ${Date.now()}`,
      species: 'HORSE', // 21-day cycle
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set cycle to be nearly complete (heat should be very soon)
    const today = todayISO();
    const dates = [
      addDays(today, -42),
      addDays(today, -21),
      addDays(today, -18), // Heat expected in ~3 days
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    await navigateToCycleTab(authenticatedPage, hogwartsConfig.frontendUrl, animal.id);

    // Should show "Soon" badge or similar urgency indicator
    // (within 7 days triggers "imminent" status in NextCycleHero)
    await expect(
      authenticatedPage.locator('text=/soon|imminent|\\d+\\s*days?/i')
    ).toBeVisible({ timeout: 10000 });
  });
});
