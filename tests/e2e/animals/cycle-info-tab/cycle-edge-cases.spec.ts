// tests/e2e/animals/cycle-info-tab/cycle-edge-cases.spec.ts
// Negative tests and edge cases for cycle info functionality

import { test, expect } from './cycle-fixtures';
import {
  createTestAnimal,
  updateAnimal,
  setCycleStartDates,
  getCycleAnalysis,
  navigateToCycleTab,
  todayISO,
  addDays,
  SPECIES_CYCLE_DEFAULTS,
} from './cycle-helpers';

// Run tests serially to avoid overwhelming the API
test.describe.configure({ mode: 'serial' });

test.describe('Cycle Info - Edge Cases & Negative Tests', () => {
  // ============================================================================
  // NEGATIVE TEST 1: Male animals should not have cycle tracking
  // ============================================================================
  test('MALE animals - API returns no cycle projections', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Male Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'MALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // API should still return something, but no cycle projection makes sense for males
    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Analysis might be empty/null or have no meaningful projections for males
    // The exact behavior depends on API implementation, but there should be no
    // nextCycleProjection with meaningful dates
    if (analysis && analysis.nextCycleProjection) {
      // If projection exists, it shouldn't have heat/ovulation dates
      expect(analysis.nextCycleProjection.projectedHeatStart).toBeFalsy();
    }
  });

  // ============================================================================
  // NEGATIVE TEST 2: Induced ovulator (CAT) - Cycle Info tab not available
  // ============================================================================
  test('CAT (induced ovulator) - Cycle Info tab should not be visible', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Cat ${Date.now()}`,
      species: 'CAT',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Navigate to the animal
    await authenticatedPage.goto(`${hogwartsConfig.frontendUrl}/animals?animalId=${animal.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for tabs to load
    await authenticatedPage.waitForSelector('[role="tablist"], [data-testid="animal-tabs"]', {
      timeout: 15000,
    }).catch(() => {
      // Wait fallback
    });

    await authenticatedPage.waitForTimeout(1000);

    // Cycle Info tab should NOT be visible for induced ovulators
    const cycleTab = authenticatedPage.locator('button, a, [role="tab"]').filter({ hasText: /cycle\s*info/i });
    await expect(cycleTab).not.toBeVisible();
  });

  // ============================================================================
  // NEGATIVE TEST 3: Male DOG - Cycle Info tab not available
  // ============================================================================
  test('MALE DOG - Cycle Info tab should not be visible', async ({
    authenticatedPage,
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Male Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'MALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    await authenticatedPage.goto(`${hogwartsConfig.frontendUrl}/animals?animalId=${animal.id}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await authenticatedPage.waitForSelector('[role="tablist"], [data-testid="animal-tabs"]', {
      timeout: 15000,
    }).catch(() => {});

    await authenticatedPage.waitForTimeout(1000);

    // Cycle Info tab should NOT be visible for males
    const cycleTab = authenticatedPage.locator('button, a, [role="tab"]').filter({ hasText: /cycle\s*info/i });
    await expect(cycleTab).not.toBeVisible();
  });

  // ============================================================================
  // EDGE CASE 1: Override with boundary values
  // ============================================================================
  test('Override at minimum boundary (1 day) should be accepted', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Try setting override to 1 day (minimum reasonable value)
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: 1,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    expect(analysis.cycleLengthSource).toBe('OVERRIDE');
    expect(analysis.cycleLengthDays).toBe(1);
  });

  // ============================================================================
  // EDGE CASE 2: Override with large value
  // ============================================================================
  test('Override with large value (365 days) should be accepted', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set override to 365 days (1 year - unusual but valid)
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: 365,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    expect(analysis.cycleLengthSource).toBe('OVERRIDE');
    expect(analysis.cycleLengthDays).toBe(365);
  });

  // ============================================================================
  // EDGE CASE 3: Cycle dates in the future should be handled gracefully
  // ============================================================================
  test('Future cycle start date should still work for projections', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    const today = todayISO();
    // Set a cycle start date 5 days in the future
    const futureCycleStart = addDays(today, 5);
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [futureCycleStart],
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should still calculate projection based on the future date
    expect(analysis.nextCycleProjection).toBeDefined();
    const expectedNextHeat = addDays(futureCycleStart, SPECIES_CYCLE_DEFAULTS.DOG.cycleLenDays);
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
  });

  // ============================================================================
  // EDGE CASE 4: Very old cycle dates
  // ============================================================================
  test('Cycle dates from years ago should still calculate correctly', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2015-01-01',
    });
    testAnimalIds.push(animal.id);

    const today = todayISO();
    // Set cycle dates from 5 years ago
    const dates = [
      addDays(today, -1825), // ~5 years ago
      addDays(today, -1645), // ~4.5 years ago (180 day gap)
      addDays(today, -1465), // ~4 years ago
      addDays(today, -1285), // etc.
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should use HISTORY source with these old dates
    expect(analysis.cycleLengthSource).toBe('HISTORY');
    // With 180-day gaps, cycle length should be 180
    expect(analysis.cycleLengthDays).toBe(180);
  });

  // ============================================================================
  // EDGE CASE 5: Single cycle date (minimum for projections)
  // ============================================================================
  test('Single cycle date provides projection with biology weighting', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    const today = todayISO();
    const singleCycleDate = addDays(today, -30);
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [singleCycleDate],
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // With only 1 date (0 gaps), should fall back to BIOLOGY
    // or possibly HISTORY with heavy biology weighting
    expect(analysis.nextCycleProjection).toBeDefined();
    // Next heat should be based on cycle length from the single date
    const expectedNextHeat = addDays(singleCycleDate, analysis.cycleLengthDays);
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
  });

  // ============================================================================
  // EDGE CASE 6: Irregular cycle gaps should use most recent 3
  // ============================================================================
  test('Irregular cycle gaps use most recent 3 gaps only', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal.id);

    const today = todayISO();
    // Intentionally irregular gaps:
    // Gap 1 (oldest, ignored): 100 days (very short)
    // Gap 2: 150 days
    // Gap 3: 160 days
    // Gap 4 (newest): 170 days
    const dates = [
      addDays(today, -580), // oldest
      addDays(today, -480), // gap 1: 100 days (should be ignored)
      addDays(today, -330), // gap 2: 150 days
      addDays(today, -170), // gap 3: 160 days
      addDays(today, -0),   // gap 4: 170 days (most recent)
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should use most recent 3 gaps: 150, 160, 170 = average 160
    // NOT include the 100 day gap
    expect(analysis.cycleLengthSource).toBe('HISTORY');
    expect(analysis.cycleLengthDays).toBe(160);
  });
});
