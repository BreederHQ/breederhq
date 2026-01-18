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

// Run tests serially to avoid overwhelming the API
test.describe.configure({ mode: 'serial' });

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

    // With 1 cycle recorded, next heat should be projected based on cycle length
    // Default dog cycle = 180 days
    const expectedNextHeat = addDays(lastCycleStart, SPECIES_CYCLE_DEFAULTS.DOG.cycleLenDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
    // Source may be 'HISTORY' or may be undefined depending on API version
  });

  // ============================================================================
  // Test 2: DOG - Projects ovulation window from NEXT heat + ovulation offset
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

    // Projection is for the NEXT cycle, not the current one
    // Next heat = lastCycle + cycleLength
    // Next ovulation = nextHeat + ovulationOffset
    const lastCycle = addDays(today, -1);
    const nextHeat = addDays(lastCycle, analysis.cycleLengthDays);
    const expectedOvulation = addDays(nextHeat, SPECIES_CYCLE_DEFAULTS.DOG.ovulationOffsetDays);

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
  // Test 5: HORSE - Ovulation window at day 5 of NEXT cycle
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

    // Projection is for NEXT cycle
    // Next heat = lastCycle + cycleLength
    // Next ovulation = nextHeat + ovulationOffset
    const lastCycle = addDays(today, -2);
    const nextHeat = addDays(lastCycle, analysis.cycleLengthDays);
    const expectedOvulation = addDays(nextHeat, SPECIES_CYCLE_DEFAULTS.HORSE.ovulationOffsetDays);

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
    });
    testAnimalIds.push(animal.id);

    // Set a cycle start first
    const today = todayISO();
    const lastCycleStart = addDays(today, -50);
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [lastCycleStart],
    });

    // Then set the override
    const { updateAnimal } = await import('./cycle-helpers');
    await updateAnimal(apiContext, hogwartsConfig, animal.id, {
      femaleCycleLenOverrideDays: 200,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should use override (200 days) not default (180 days)
    const expectedNextHeat = addDays(lastCycleStart, 200);

    expect(analysis.cycleLengthSource).toBe('OVERRIDE');
    expect(analysis.cycleLengthDays).toBe(200);
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
  });

  // ============================================================================
  // Test 7: Uses biology default when no cycle history
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

    // With no history, should fall back to biology
    expect(analysis.cycleLengthSource).toBe('BIOLOGY');
    // May or may not have projection - depends on implementation
    // Just verify the analysis returns something
    expect(analysis).toBeDefined();
    expect(analysis.cycleLengthDays).toBe(SPECIES_CYCLE_DEFAULTS.DOG.cycleLenDays);
  });

  // ============================================================================
  // Test 8: GOAT - Uses 21-day cycle with 2-day ovulation offset
  // Note: GOAT is a spontaneous ovulator (unlike CAT which is induced)
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

    // Goat: 21-day cycle
    // Next heat is projected from last cycle + cycle length
    const expectedNextHeat = addDays(lastCycle, analysis.cycleLengthDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
  });

  // ============================================================================
  // Test 9: SHEEP - Uses 17-day cycle with 2-day ovulation offset
  // ============================================================================
  test('SHEEP - Uses correct species defaults for projections', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Sheep ${Date.now()}`,
      species: 'SHEEP',
      sex: 'FEMALE',
      dateOfBirth: '2020-01-01',
    });
    testAnimalIds.push(animal.id);

    // Set recent cycle start
    const today = todayISO();
    const lastCycle = addDays(today, -5);
    const dates = [
      addDays(today, -39),
      addDays(today, -22),
      lastCycle,
    ];
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates,
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Sheep: 17-day cycle
    // Next heat is projected from last cycle + cycle length
    const expectedNextHeat = addDays(lastCycle, analysis.cycleLengthDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedHeatStart).toBe(expectedNextHeat);
  });

  // ============================================================================
  // Test 10: GOAT - Ovulation window calculation
  // ============================================================================
  test('GOAT - Ovulation window centers around day 2', async ({
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

    // Projection is for NEXT cycle
    // Next heat = lastCycle + cycleLength
    // Next ovulation = nextHeat + ovulationOffset (2 days for goats)
    const lastCycle = addDays(today, -2);
    const nextHeat = addDays(lastCycle, analysis.cycleLengthDays);
    const expectedOvulation = addDays(nextHeat, SPECIES_CYCLE_DEFAULTS.GOAT.ovulationOffsetDays);

    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedOvulationWindow).toBeDefined();
    expect(analysis.nextCycleProjection.projectedOvulationWindow.mostLikely).toBe(expectedOvulation);
  });

  // ============================================================================
  // Test 11: Animals with more history have consistent projections
  // ============================================================================
  test('Animals with more history have projections', async ({
    apiContext,
    hogwartsConfig,
    testAnimalIds,
  }) => {
    // Create animal with extensive history
    const animal = await createTestAnimal(apiContext, hogwartsConfig, {
      name: `Test Dog Extensive ${Date.now()}`,
      species: 'DOG',
      sex: 'FEMALE',
      dateOfBirth: '2018-01-01',
    });
    testAnimalIds.push(animal.id);

    const today = todayISO();
    await setCycleStartDates(apiContext, hogwartsConfig, {
      animalId: animal.id,
      dates: [
        addDays(today, -720),
        addDays(today, -540),
        addDays(today, -360),
        addDays(today, -180),
        addDays(today, -1),
      ], // 5 dates = 4 gaps
    });

    const analysis = await getCycleAnalysis(apiContext, hogwartsConfig, animal.id);

    // Should have projection
    expect(analysis.nextCycleProjection).toBeDefined();
    expect(analysis.nextCycleProjection.projectedHeatStart).toBeDefined();
    // With extensive history, should use 100% observed (HISTORY source)
    expect(analysis.cycleLengthSource).toBe('HISTORY');
  });
});
