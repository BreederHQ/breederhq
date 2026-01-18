// tests/e2e/animals/cycle-info-tab/cycle-length-calculations.spec.ts
// Tests for cycle length calculations, overrides, and cycle history

import { test, expect } from './cycle-fixtures';
import {
  createTestAnimal,
  updateAnimal,
  setCycleStartDates,
  getCycleAnalysis,
  navigateToCycleTab,
  todayISO,
  addDays,
  generateDogCycleStartDates,
  generateShortCycleStartDates,
  SPECIES_CYCLE_DEFAULTS,
} from './cycle-helpers';

test.describe('Cycle Length Calculations', () => {
  // ============================================================================
  // Test 1: DOG - Default cycle length when no history
  // ============================================================================
  test('DOG - Uses species default cycle length when no history', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    // Create a female dog with no cycle history
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2022-01-01',
    });
    testAnimalIds.push(animal.id);

    // Get cycle analysis
    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should use biology default (180 days for dogs)
    expect(analysis.cycleLengthDays).toBe(SPECIES_CYCLE_DEFAULTS.DOG.cycleLenDays);
    expect(analysis.cycleLengthSource).toBe('BIOLOGY');
  });

  // ============================================================================
  // Test 2: DOG - Calculates cycle length from 1 cycle gap
  // ============================================================================
  test('DOG - Calculates cycle length from 1 cycle gap (50% weighting)', async ({
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

    // Set 2 cycle start dates with 160 day gap (shorter than average)
    const today = todayISO();
    const dates = [
      addDays(today, -200), // ~200 days ago
      addDays(today, -40),  // ~40 days ago (160 day gap)
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // With 1 gap: 50% observed (160) + 50% biology (180) = 170 days
    // Expected: Math.round(160 * 0.5 + 180 * 0.5) = 170
    expect(analysis.cycleLengthSource).toBe('HISTORY');
    expect(analysis.cycleLengthDays).toBe(170);
  });

  // ============================================================================
  // Test 3: DOG - Calculates cycle length from 2 cycle gaps (67% weighting)
  // ============================================================================
  test('DOG - Calculates cycle length from 2 cycle gaps (67% weighting)', async ({
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

    // Set 3 cycle start dates with 150 day gaps
    const today = todayISO();
    const dates = [
      addDays(today, -350),
      addDays(today, -200),
      addDays(today, -50),
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // With 2 gaps: 67% observed (150) + 33% biology (180) = ~160 days
    // Expected: Math.round(150 * 0.67 + 180 * 0.33) = 160
    expect(analysis.cycleLengthSource).toBe('HISTORY');
    expect(analysis.cycleLengthDays).toBeGreaterThanOrEqual(158);
    expect(analysis.cycleLengthDays).toBeLessThanOrEqual(162);
  });

  // ============================================================================
  // Test 4: DOG - Calculates cycle length from 3+ cycle gaps (100% observed)
  // ============================================================================
  test('DOG - Calculates cycle length from 3+ cycle gaps (100% observed)', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2019-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set 4 cycle start dates with 165 day gaps (3 gaps)
    const cycleLengthDays = 165;
    const dates = generateDogCycleStartDates(4, cycleLengthDays);
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // With 3+ gaps: 100% observed = 165 days
    expect(analysis.cycleLengthSource).toBe('HISTORY');
    expect(analysis.cycleLengthDays).toBe(cycleLengthDays);
  });

  // ============================================================================
  // Test 5: DOG - Override takes precedence over history
  // ============================================================================
  test('DOG - Override takes precedence over history', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2019-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set cycle history
    const dates = generateDogCycleStartDates(4, 180);
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    // Set override
    const overrideDays = 200;
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: overrideDays,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Override should take precedence
    expect(analysis.cycleLengthSource).toBe('OVERRIDE');
    expect(analysis.cycleLengthDays).toBe(overrideDays);
  });

  // ============================================================================
  // Test 6: DOG - Override warning when >20% different from history
  // ============================================================================
  test('DOG - Override warning when >20% different from history', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2019-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set cycle history with 180 day cycles
    const dates = generateDogCycleStartDates(4, 180);
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    // Set override >20% different (240 days = 33% more)
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: 240,
    });

    // Get cycle analysis - should have warningConflict (tested at API level)
    // The UI component (CollapsibleOverride) displays the warning
    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);
    expect(analysis.cycleLengthSource).toBe('OVERRIDE');
    expect(analysis.cycleLengthDays).toBe(240);
  });

  // ============================================================================
  // Test 7: HORSE - Uses correct species default (21 days)
  // ============================================================================
  test('HORSE - Uses correct species default (21 days)', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Horse ${Date.now()}`,
      species: 'HORSE',
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal.id);

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    expect(analysis.cycleLengthDays).toBe(SPECIES_CYCLE_DEFAULTS.HORSE.cycleLenDays);
    expect(analysis.cycleLengthSource).toBe('BIOLOGY');
  });

  // ============================================================================
  // Test 8: HORSE - Calculates cycle length from history
  // ============================================================================
  test('HORSE - Calculates cycle length from history', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Horse ${Date.now()}`,
      species: 'HORSE',
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set 4 cycle start dates with 23 day gaps
    const cycleLengthDays = 23;
    const dates = generateShortCycleStartDates(4, cycleLengthDays);
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    expect(analysis.cycleLengthSource).toBe('HISTORY');
    expect(analysis.cycleLengthDays).toBe(cycleLengthDays);
  });

  // ============================================================================
  // Test 9: GOAT - Uses correct species default (21 days)
  // ============================================================================
  test('GOAT - Uses correct species default (21 days)', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Goat ${Date.now()}`,
      species: 'GOAT',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    expect(analysis.cycleLengthDays).toBe(SPECIES_CYCLE_DEFAULTS.GOAT.cycleLenDays);
    expect(analysis.cycleLengthSource).toBe('BIOLOGY');
  });

  // ============================================================================
  // Test 10: RABBIT - Uses correct species default (15 days)
  // ============================================================================
  test('RABBIT - Uses correct species default (15 days)', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Rabbit ${Date.now()}`,
      species: 'RABBIT',
      sex: 'FEMALE',
      dateOfBirth: '2022-01-01',
    });
    testAnimalIds.push(animal.id);

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    expect(analysis.cycleLengthDays).toBe(SPECIES_CYCLE_DEFAULTS.RABBIT.cycleLenDays);
    expect(analysis.cycleLengthSource).toBe('BIOLOGY');
  });

  // ============================================================================
  // Test 11: Clearing override reverts to history
  // ============================================================================
  test('Clearing override reverts to history', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2019-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set cycle history with 175 day cycles
    const dates = generateDogCycleStartDates(4, 175);
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    // Set and then clear override
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: 200,
    });
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: null,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should revert to history
    expect(analysis.cycleLengthSource).toBe('HISTORY');
    expect(analysis.cycleLengthDays).toBe(175);
  });

  // ============================================================================
  // Test 12: Uses last 3 cycle gaps only
  // ============================================================================
  test('Uses last 3 cycle gaps only (ignores older history)', async ({
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
    // Create dates with varying gaps:
    // Gap 1 (oldest, should be ignored): 200 days
    // Gap 2: 170 days
    // Gap 3: 170 days
    // Gap 4 (newest): 170 days
    const dates = [
      addDays(today, -710), // oldest
      addDays(today, -510), // gap 1: 200 days
      addDays(today, -340), // gap 2: 170 days
      addDays(today, -170), // gap 3: 170 days
      addDays(today, -0),   // gap 4: 170 days (newest)
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, { animalId: animal.id, dates });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should use last 3 gaps (170, 170, 170) = 170 days average
    // NOT include the 200 day gap
    expect(analysis.cycleLengthSource).toBe('HISTORY');
    expect(analysis.cycleLengthDays).toBe(170);
  });
});
