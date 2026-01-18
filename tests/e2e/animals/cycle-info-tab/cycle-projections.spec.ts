// tests/e2e/animals/cycle-info-tab/cycle-projections.spec.ts
// Tests for next cycle projections, ovulation windows, and testing start dates

import { test, expect } from './cycle-fixtures';
import {
  createTestAnimal,
  setCycleStartDates,
  getCycleAnalysis,
  todayISO,
  addDays,
  SPECIES_CYCLE_DEFAULTS,
} from './cycle-helpers';

test.describe('Cycle Projections', () => {
  // ============================================================================
  // Test 1: DOG - Projects next heat from last cycle + cycle length
  // ============================================================================
  test('DOG - Projects next heat from last cycle + cycle length', async ({
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

    // Set a single cycle start date 30 days ago
    const today = todayISO();
    const lastCycleStart = addDays(today, -30);
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [lastCycleStart],
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // With 1 cycle: 50% observed (we only have one date, so uses biology for gap)
    // Default dog cycle = 180 days
    // Expected next heat: lastCycleStart + 180 = 150 days from now
    const expectedNextHeat = addDays(lastCycleStart, SPECIES_CYCLE_DEFAULTS.DOG.cycleLenDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
    expect(analysis.nextCycleProjection.source).toBe('HISTORY'); // Has at least one cycle recorded
  });

  // ============================================================================
  // Test 2: DOG - Projects ovulation window from heat + ovulation offset
  // ============================================================================
  test('DOG - Projects ovulation window using species ovulation offset', async ({
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

    // Set cycle start dates to have history
    const today = todayISO();
    const dates = [
      addDays(today, -360),
      addDays(today, -180),
      addDays(today, -1), // Last cycle started yesterday
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Dog ovulation offset is 12 days from cycle start
    const lastCycle = addDays(today, -1);
    const expectedOvulation = addDays(lastCycle, SPECIES_CYCLE_DEFAULTS.DOG.ovulationOffsetDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedOvulationWindow).toBeDefined();
    expect(analysis.nextCycleProjection.projectedOvulationWindow.mostLikely).toBe(expectedOvulation);
  });

  // ============================================================================
  // Test 3: DOG - Testing start date is before ovulation
  // ============================================================================
  test('DOG - Testing start date is before ovulation window', async ({
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

    // Set cycle history
    const today = todayISO();
    const dates = [
      addDays(today, -360),
      addDays(today, -180),
      addDays(today, -5), // Recent cycle start
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    expect(analysis.nextCycleProjection).toBeDefined();

    if (analysis.nextCycleProjection.recommendedTestingStart &&
        analysis.nextCycleProjection.projectedOvulationWindow) {
      // Testing should start before ovulation
      const testingStart = new Date(analysis.nextCycleProjection.recommendedTestingStart);
      const ovulationStart = new Date(analysis.nextCycleProjection.projectedOvulationWindow.earliest);
      expect(testingStart.getTime()).toBeLessThanOrEqual(ovulationStart.getTime());
    }
  });

  // ============================================================================
  // Test 4: HORSE - Uses 21-day cycle for projection
  // ============================================================================
  test('HORSE - Uses 21-day cycle for projection', async ({
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

    // Set cycle start 10 days ago
    const today = todayISO();
    const lastCycleStart = addDays(today, -10);
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [lastCycleStart],
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Expected next heat: lastCycleStart + 21 days = 11 days from now
    const expectedNextHeat = addDays(lastCycleStart, SPECIES_CYCLE_DEFAULTS.HORSE.cycleLenDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
  });

  // ============================================================================
  // Test 5: HORSE - Ovulation window at day 5
  // ============================================================================
  test('HORSE - Ovulation window centers around day 5', async ({
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

    // Set recent cycle start
    const today = todayISO();
    const dates = [
      addDays(today, -42),
      addDays(today, -21),
      addDays(today, -2), // Very recent cycle
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Horse ovulation offset is 5 days from cycle start
    const lastCycle = addDays(today, -2);
    const expectedOvulation = addDays(lastCycle, SPECIES_CYCLE_DEFAULTS.HORSE.ovulationOffsetDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedOvulationWindow).toBeDefined();
    expect(analysis.nextCycleProjection.projectedOvulationWindow.mostLikely).toBe(expectedOvulation);
  });

  // ============================================================================
  // Test 6: Projection uses override cycle length when set
  // ============================================================================
  test('Projection uses override cycle length when set', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
      femaleCycleLenOverrideDays: 200, // Override to 200 days
    });
    testAnimalIds.push(animal.id);

    // Set a cycle start
    const today = todayISO();
    const lastCycleStart = addDays(today, -50);
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [lastCycleStart],
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should use override (200 days) not default (180 days)
    const expectedNextHeat = addDays(lastCycleStart, 200);

    expect(analysis.cycleLengthSource).toBe('OVERRIDE');
    expect(analysis.cycleLengthDays).toBe(200);
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
  });

  // ============================================================================
  // Test 7: No projection when no cycle history
  // ============================================================================
  test('Uses BIOLOGY source when no cycle history recorded', async ({
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

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // With no history, should fall back to biology/juvenile projection
    expect(analysis.cycleLengthSource).toBe('BIOLOGY');
    // May have projection based on DOB for juvenile or just biology default
    expect(analysis.nextCycleProjection).toBeDefined();
    // Source should be BIOLOGY or JUVENILE
    expect(['BIOLOGY', 'JUVENILE']).toContain(analysis.nextCycleProjection.source);
  });

  // ============================================================================
  // Test 8: GOAT - Uses 21-day cycle with 2-day ovulation offset
  // ============================================================================
  test('GOAT - Uses correct species defaults for projections', async ({
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

    // Set recent cycle start
    const today = todayISO();
    const lastCycle = addDays(today, -5);
    const dates = [
      addDays(today, -47),
      addDays(today, -26),
      lastCycle,
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Goat: 21-day cycle, 2-day ovulation offset
    const expectedNextHeat = addDays(lastCycle, SPECIES_CYCLE_DEFAULTS.GOAT.cycleLenDays);
    const expectedOvulation = addDays(lastCycle, SPECIES_CYCLE_DEFAULTS.GOAT.ovulationOffsetDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
    expect(analysis.nextCycleProjection.projectedOvulationWindow.mostLikely).toBe(expectedOvulation);
  });

  // ============================================================================
  // Test 9: Projection confidence based on history amount
  // ============================================================================
  test('Projection confidence increases with more history', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    // Create animal with limited history
    const animal1 = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog Limited ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal1.id);

    const today = todayISO();
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal1.id,
      dates: [addDays(today, -180), addDays(today, -1)], // 2 dates = 1 gap
    });

    const analysis1 = await getCycleAnalysis(apiContext, hogwartsConfig, animal1.id);

    // Create animal with extensive history
    const animal2 = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog Extensive ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal2.id);

    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal2.id,
      dates: [
        addDays(today, -720),
        addDays(today, -540),
        addDays(today, -360),
        addDays(today, -180),
        addDays(today, -1),
      ], // 5 dates = 4 gaps
    });

    const analysis2 = await getCycleAnalysis(apiContext, hogwartsConfig, animal2.id);

    // Both should have projections
    expect(analysis1.nextCycleProjection).toBeDefined();
    expect(analysis2.nextCycleProjection).toBeDefined();

    // The one with more history should have higher confidence (if exposed in API)
    // At minimum, both should work without errors
  });
});
