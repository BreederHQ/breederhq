// tests/e2e/breeding/specs/phase-1-lock-cycle-start.spec.ts
// Phase 1: Lock Cycle Start Tests (18 tests)
// Tests the /lock endpoint with CYCLE_START anchor mode

import { test, expect } from '../fixtures/breeding-fixtures';
import {
  createBreedingPlan,
  getBreedingPlan,
  lockBreedingPlan,
  getAnimals,
  addDays,
} from '../fixtures/database-helpers';
import {
  TEST_SPECIES,
  ANCHOR_MODES,
  CONFIDENCE_LEVELS,
  PLAN_STATUSES,
} from '../config/hogwarts-config';
import {
  SPECIES_DEFAULTS,
  SPECIES_BEHAVIOR,
  LOCK_TEST_SCENARIOS,
  calculateExpectedDueDate,
} from '../fixtures/anchor-test-data';

test.describe('Phase 1: Lock Cycle Start', () => {
  // Store animal IDs for test setup
  let dogDamId: number;
  let dogSireId: number;
  let catDamId: number;
  let catSireId: number;
  let horseDamId: number;
  let horseSireId: number;
  let goatDamId: number;
  let goatSireId: number;

  test.beforeAll(async ({ apiContext, hogwartsConfig }) => {
    // Find existing test animals from Hogwarts tenant
    console.log('[Setup] Finding test animals...');

    try {
      const dogs = await getAnimals(apiContext, hogwartsConfig, { species: 'DOG' });
      dogDamId = dogs.find((a: any) => a.sex === 'FEMALE')?.id;
      dogSireId = dogs.find((a: any) => a.sex === 'MALE')?.id;
      console.log(`[Setup] Dogs: dam=${dogDamId}, sire=${dogSireId}`);
    } catch (e) {
      console.log('[Setup] No dog animals found or error fetching dogs');
    }

    try {
      const cats = await getAnimals(apiContext, hogwartsConfig, { species: 'CAT' });
      catDamId = cats.find((a: any) => a.sex === 'FEMALE')?.id;
      catSireId = cats.find((a: any) => a.sex === 'MALE')?.id;
      console.log(`[Setup] Cats: dam=${catDamId}, sire=${catSireId}`);
    } catch (e) {
      console.log('[Setup] No cat animals found or error fetching cats');
    }

    try {
      const horses = await getAnimals(apiContext, hogwartsConfig, { species: 'HORSE' });
      horseDamId = horses.find((a: any) => a.sex === 'FEMALE')?.id;
      horseSireId = horses.find((a: any) => a.sex === 'MALE')?.id;
      console.log(`[Setup] Horses: dam=${horseDamId}, sire=${horseSireId}`);
    } catch (e) {
      console.log('[Setup] No horse animals found or error fetching horses');
    }

    try {
      const goats = await getAnimals(apiContext, hogwartsConfig, { species: 'GOAT' });
      goatDamId = goats.find((a: any) => a.sex === 'FEMALE')?.id;
      goatSireId = goats.find((a: any) => a.sex === 'MALE')?.id;
      console.log(`[Setup] Goats: dam=${goatDamId}, sire=${goatSireId}`);
    } catch (e) {
      console.log('[Setup] No goat animals found or error fetching goats');
    }

    console.log(`[Setup] Found animals - Dogs: dam=${dogDamId}, sire=${dogSireId}`);
  });

  // ============================================================================
  // Test 1.1: DOG - Lock plan with cycle start anchor
  // ============================================================================
  test('DOG - Lock plan with cycle start anchor', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    // Create test plan
    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Dog Cycle Start Lock',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock with cycle start
    const scenario = LOCK_TEST_SCENARIOS.dogCycleStart;
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: scenario.anchorMode as 'CYCLE_START',
      anchorDate: scenario.anchorDate,
    });

    // Assertions
    expect(result.success).toBe(true);
    expect(result.anchorMode).toBe(ANCHOR_MODES.CYCLE_START);
    expect(result.confidence).toBe(CONFIDENCE_LEVELS.MEDIUM);
    expect(result.calculatedDates).toBeDefined();
    expect(result.calculatedDates.dueDate).toBe(scenario.expectedDueDate);

    // Verify in database
    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.reproAnchorMode).toBe(ANCHOR_MODES.CYCLE_START);
    expect(updatedPlan.status).toBe(PLAN_STATUSES.COMMITTED);
  });

  // ============================================================================
  // Test 1.2: DOG - Verify expected birth date calculation (~75 days from cycle start)
  // ============================================================================
  test('DOG - Verify expected birth date ~75 days from cycle start', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Dog Birth Date Calculation',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const cycleStartDate = '2026-03-15';
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: cycleStartDate,
    });

    // Expected: 2026-03-15 + 12 days (ovulation) + 63 days (gestation) = 2026-05-29
    const expectedDueDate = calculateExpectedDueDate('DOG', ANCHOR_MODES.CYCLE_START, cycleStartDate);
    expect(result.calculatedDates.dueDate).toBe(expectedDueDate);

    // Verify calculation is correct: 75 days total
    const start = new Date(cycleStartDate);
    const due = new Date(result.calculatedDates.dueDate);
    const diffDays = Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(SPECIES_DEFAULTS.DOG.expectedBirthFromCycleStart);
  });

  // ============================================================================
  // Test 1.3: DOG - Verify confidence is MEDIUM for cycle start anchor
  // ============================================================================
  test('DOG - Verify confidence is MEDIUM for cycle start anchor', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Dog Confidence Check',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    expect(result.confidence).toBe(CONFIDENCE_LEVELS.MEDIUM);

    // Verify stored in database
    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.cycleStartConfidence).toBe(CONFIDENCE_LEVELS.MEDIUM);
  });

  // ============================================================================
  // Test 1.4: DOG - Status changes to COMMITTED after lock
  // ============================================================================
  test('DOG - Status changes to COMMITTED after lock', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Status Change',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
      status: PLAN_STATUSES.PLANNING,
    });
    testPlanIds.push(plan.id);

    // Verify initial status
    expect(plan.status).toBe(PLAN_STATUSES.PLANNING);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Verify status changed
    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.status).toBe(PLAN_STATUSES.COMMITTED);
  });

  // ============================================================================
  // Test 1.5: DOG - cycleStartObserved field is populated
  // ============================================================================
  test('DOG - cycleStartObserved field is populated', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cycle Start Observed',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const anchorDate = '2026-03-15';
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate,
    });

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.cycleStartObserved).toBeTruthy();
    // Compare date portion only (ignore time)
    expect(updatedPlan.cycleStartObserved.slice(0, 10)).toBe(anchorDate);
  });

  // ============================================================================
  // Test 1.6: HORSE - Lock plan with cycle start anchor
  // ============================================================================
  test('HORSE - Lock plan with cycle start anchor', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!horseDamId || !horseSireId, 'No horse animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Horse Cycle Start Lock',
      species: TEST_SPECIES.HORSE,
      damId: horseDamId,
      sireId: horseSireId,
    });
    testPlanIds.push(plan.id);

    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    expect(result.success).toBe(true);
    expect(result.anchorMode).toBe(ANCHOR_MODES.CYCLE_START);
    expect(result.confidence).toBe(CONFIDENCE_LEVELS.MEDIUM);
  });

  // ============================================================================
  // Test 1.7: HORSE - Verify expected birth date calculation (~345 days from cycle start)
  // ============================================================================
  test('HORSE - Verify expected birth date ~345 days from cycle start', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!horseDamId || !horseSireId, 'No horse animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Horse Birth Date Calculation',
      species: TEST_SPECIES.HORSE,
      damId: horseDamId,
      sireId: horseSireId,
    });
    testPlanIds.push(plan.id);

    const cycleStartDate = '2026-03-15';
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: cycleStartDate,
    });

    // Verify calculation (345 days = 5 ovulation + 340 gestation)
    const start = new Date(cycleStartDate);
    const due = new Date(result.calculatedDates.dueDate);
    const diffDays = Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(SPECIES_DEFAULTS.HORSE.expectedBirthFromCycleStart);
  });

  // ============================================================================
  // Test 1.8: GOAT - Lock plan with cycle start anchor
  // ============================================================================
  test('GOAT - Lock plan with cycle start anchor', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!goatDamId || !goatSireId, 'No goat animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Goat Cycle Start Lock',
      species: TEST_SPECIES.GOAT,
      damId: goatDamId,
      sireId: goatSireId,
    });
    testPlanIds.push(plan.id);

    const scenario = LOCK_TEST_SCENARIOS.goatCycleStart;
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: scenario.anchorMode as 'CYCLE_START',
      anchorDate: scenario.anchorDate,
    });

    expect(result.success).toBe(true);
    expect(result.anchorMode).toBe(ANCHOR_MODES.CYCLE_START);

    // Verify goats don't support ovulation upgrade
    const behavior = SPECIES_BEHAVIOR.GOAT;
    expect(behavior.supportsUpgrade).toBe(false);
  });

  // ============================================================================
  // Test 1.9: CAT - Cannot use CYCLE_START anchor (induced ovulator)
  // ============================================================================
  test('CAT - Cannot use CYCLE_START anchor (induced ovulator)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!catDamId || !catSireId, 'No cat animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cat Cycle Start (Should Fail)',
      species: TEST_SPECIES.CAT,
      damId: catDamId,
      sireId: catSireId,
    });
    testPlanIds.push(plan.id);

    // Attempt to lock with CYCLE_START should fail or auto-convert to BREEDING_DATE
    try {
      const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
        anchorDate: '2026-03-15',
      });

      // If it doesn't fail, it should have been converted to BREEDING_DATE
      expect(result.anchorMode).toBe(ANCHOR_MODES.BREEDING_DATE);
    } catch (error: any) {
      // Expected: should fail with invalid anchor mode for species
      expect(error.message).toMatch(/invalid.*anchor|not supported|breeding.*date/i);
    }
  });

  // ============================================================================
  // Test 1.10: CAT - Uses BREEDING_DATE anchor instead
  // ============================================================================
  test('CAT - Uses BREEDING_DATE anchor instead', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!catDamId || !catSireId, 'No cat animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cat Breeding Date Lock',
      species: TEST_SPECIES.CAT,
      damId: catDamId,
      sireId: catSireId,
    });
    testPlanIds.push(plan.id);

    const scenario = LOCK_TEST_SCENARIOS.catBreeding;
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: scenario.anchorMode as 'BREEDING_DATE',
      anchorDate: scenario.anchorDate,
    });

    expect(result.success).toBe(true);
    expect(result.anchorMode).toBe(ANCHOR_MODES.BREEDING_DATE);

    // Verify birth calculation (63 days from breeding for cats)
    const start = new Date(scenario.anchorDate);
    const due = new Date(result.calculatedDates.dueDate);
    const diffDays = Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(SPECIES_DEFAULTS.CAT.expectedBirthFromBreeding);
  });

  // ============================================================================
  // Test 1.11: Verify calculatedDates includes all expected fields
  // ============================================================================
  test('Verify calculatedDates includes all expected fields', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Calculated Dates Fields',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Verify all expected fields are present
    expect(result.calculatedDates).toHaveProperty('cycleStart');
    expect(result.calculatedDates).toHaveProperty('ovulation');
    expect(result.calculatedDates).toHaveProperty('dueDate');
    expect(result.calculatedDates).toHaveProperty('weanedDate');
    expect(result.calculatedDates).toHaveProperty('placementStart');
    expect(result.calculatedDates).toHaveProperty('placementCompleted');
  });

  // ============================================================================
  // Test 1.12: Lock with notes field
  // ============================================================================
  test('Lock with notes field', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Lock with Notes',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const notes = 'Heat observed with minimal bleeding, temperature drop confirmed';
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
      notes,
    });

    expect(result.success).toBe(true);

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.dateSourceNotes).toBe(notes);
  });

  // ============================================================================
  // Test 1.13: Cannot lock already committed plan
  // ============================================================================
  test('Cannot lock already committed plan', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Already Committed',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // First lock
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Second lock attempt should fail
    try {
      await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
        anchorDate: '2026-03-20',
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/already.*locked|committed|cannot.*lock/i);
    }
  });

  // ============================================================================
  // Test 1.14: Lock requires dam and sire
  // ============================================================================
  test('Lock requires dam and sire', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId, 'No dog animals available for testing');

    // Create plan without sire (null sire)
    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - No Sire',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      // sireId omitted - plan should be created without sire
    });
    testPlanIds.push(plan.id);

    try {
      await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
        anchorDate: '2026-03-15',
      });
      // Should not reach here - locking without sire should fail
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/sire.*required|dam.*sire.*required|missing/i);
    }
  });

  // ============================================================================
  // Test 1.15: Lock with invalid date format fails gracefully
  // ============================================================================
  test('Lock with invalid date format fails gracefully', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Invalid Date',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    try {
      await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
        anchorDate: 'invalid-date',
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/invalid.*date|format|parse/i);
    }
  });

  // ============================================================================
  // Test 1.16: Lock with future date more than 6 months away warns
  // ============================================================================
  test('Lock with date far in future succeeds with valid data', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Future Date',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock with date 8 months in future
    const futureDate = addDays(new Date().toISOString().slice(0, 10), 240);
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: futureDate,
    });

    // Should still succeed (just a warning in UI)
    expect(result.success).toBe(true);
  });

  // ============================================================================
  // Test 1.17: Lock with past date succeeds
  // ============================================================================
  test('Lock with past date succeeds', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Past Date',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock with date 30 days in past
    const pastDate = addDays(new Date().toISOString().slice(0, 10), -30);
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: pastDate,
    });

    expect(result.success).toBe(true);
  });

  // ============================================================================
  // Test 1.18: Verify backward compatibility with lockedCycleStart field
  // ============================================================================
  test('Verify backward compatibility with lockedCycleStart field', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Backward Compatibility',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const anchorDate = '2026-03-15';
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate,
    });

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);

    // Both old and new fields should be populated
    expect(updatedPlan.lockedCycleStart).toBeTruthy();
    expect(updatedPlan.cycleStartObserved).toBeTruthy();
    expect(updatedPlan.lockedCycleStart.slice(0, 10)).toBe(anchorDate);
    expect(updatedPlan.cycleStartObserved.slice(0, 10)).toBe(anchorDate);
  });
});
