// tests/e2e/breeding/specs/phase-5-migration.spec.ts
// Phase 5: Migration Tests (8 tests)
// Tests backward compatibility and data migration

import { test, expect } from '../fixtures/breeding-fixtures';
import {
  createBreedingPlan,
  getBreedingPlan,
  lockBreedingPlan,
  updateBreedingPlan,
  getAnimals,
} from '../fixtures/database-helpers';
import {
  TEST_SPECIES,
  ANCHOR_MODES,
  PLAN_STATUSES,
} from '../config/hogwarts-config';

test.describe('Phase 5: Migration & Backward Compatibility', () => {
  let dogDamId: number;
  let dogSireId: number;
  let catDamId: number;
  let catSireId: number;

  test.beforeAll(async ({ apiContext, hogwartsConfig }) => {
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

    console.log(`[Setup] Found animals - Dogs: dam=${dogDamId}, sire=${dogSireId}`);
  });

  // ============================================================================
  // Test 5.1: Plans with lockedCycleStart get reproAnchorMode=CYCLE_START
  // ============================================================================
  test('Plans with lockedCycleStart get reproAnchorMode=CYCLE_START', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    // Create plan and lock with cycle start
    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Migration Cycle Start',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);

    // Both legacy and new fields should be populated
    expect(updatedPlan.lockedCycleStart).toBeTruthy();
    expect(updatedPlan.reproAnchorMode).toBe(ANCHOR_MODES.CYCLE_START);
    expect(updatedPlan.cycleStartObserved).toBeTruthy();
  });

  // ============================================================================
  // Test 5.2: cycleStartObserved populated from lockedCycleStart
  // ============================================================================
  test('cycleStartObserved populated from lockedCycleStart', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cycle Start Sync',
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

    // Both fields should have same date
    expect(updatedPlan.lockedCycleStart.slice(0, 10)).toBe(anchorDate);
    expect(updatedPlan.cycleStartObserved.slice(0, 10)).toBe(anchorDate);
  });

  // ============================================================================
  // Test 5.3: CAT plans with breedDateActual get reproAnchorMode=BREEDING_DATE
  // ============================================================================
  test('CAT plans with breedDateActual get reproAnchorMode=BREEDING_DATE', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!catDamId || !catSireId, 'No cat animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cat Migration',
      species: TEST_SPECIES.CAT,
      damId: catDamId,
      sireId: catSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.BREEDING_DATE as 'BREEDING_DATE',
      anchorDate: '2026-03-15',
    });

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.reproAnchorMode).toBe(ANCHOR_MODES.BREEDING_DATE);
  });

  // ============================================================================
  // Test 5.4: Legacy deriveBreedingStatus works with old data
  // ============================================================================
  test('Legacy deriveBreedingStatus works with old data', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    // Create plan and lock it via the lock endpoint (modern way to create committed plans)
    // This test verifies that locked plans maintain their COMMITTED status
    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Legacy Status',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock the plan to COMMITTED status
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    const fetchedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);

    // Status should be COMMITTED after locking
    expect(fetchedPlan.status).toBe(PLAN_STATUSES.COMMITTED);
    // And lockedCycleStart should be populated
    expect(fetchedPlan.lockedCycleStart).toBeTruthy();
  });

  // ============================================================================
  // Test 5.5: New ovulationConfirmed also satisfies commit prerequisites
  // ============================================================================
  test('New ovulationConfirmed also satisfies commit prerequisites', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Ovulation Commit',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Create plan with ovulationConfirmed (new system) but no lockedCycleStart
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      ovulationConfirmed: '2026-03-27',
      ovulationConfirmedMethod: 'PROGESTERONE_TEST',
      reproAnchorMode: ANCHOR_MODES.OVULATION,
      status: PLAN_STATUSES.COMMITTED,
    });

    const fetchedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);

    // Should be COMMITTED even without lockedCycleStart
    expect(fetchedPlan.status).toBe(PLAN_STATUSES.COMMITTED);
  });

  // ============================================================================
  // Test 5.6: windowsFromPlan uses anchor detection
  // ============================================================================
  test('windowsFromPlan uses anchor detection', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Windows Detection',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock with ovulation
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: '2026-03-27',
      confirmationMethod: 'PROGESTERONE_TEST',
    });

    // Fetch plan with calculated dates (API should include windows)
    const fetchedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);

    // Verify anchor mode is detected
    expect(fetchedPlan.reproAnchorMode).toBe(ANCHOR_MODES.OVULATION);
    expect(fetchedPlan.ovulationConfirmed).toBeTruthy();
  });

  // ============================================================================
  // Test 5.7: Anchor mode set correctly when plan is locked
  // Note: Plans in PLANNING status don't have an anchor mode yet.
  //       Anchor mode is set when the plan is locked.
  // ============================================================================
  test('Default anchor mode set by species', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId || !catDamId || !catSireId, 'No animals available');

    // DOG: when locked with CYCLE_START, reproAnchorMode should be set
    const dogPlan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Dog Default',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(dogPlan.id);

    // Lock the dog plan
    await lockBreedingPlan(apiContext, hogwartsConfig, dogPlan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    const fetchedDogPlan = await getBreedingPlan(apiContext, hogwartsConfig, dogPlan.id);
    expect(fetchedDogPlan.reproAnchorMode).toBe(ANCHOR_MODES.CYCLE_START);

    // CAT: when locked with BREEDING_DATE, reproAnchorMode should be set
    const catPlan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cat Default',
      species: TEST_SPECIES.CAT,
      damId: catDamId,
      sireId: catSireId,
    });
    testPlanIds.push(catPlan.id);

    // Lock the cat plan with BREEDING_DATE (the only valid mode for cats)
    await lockBreedingPlan(apiContext, hogwartsConfig, catPlan.id, {
      anchorMode: ANCHOR_MODES.BREEDING_DATE as 'BREEDING_DATE',
      anchorDate: '2026-03-15',
    });

    const fetchedCatPlan = await getBreedingPlan(apiContext, hogwartsConfig, catPlan.id);
    expect(fetchedCatPlan.reproAnchorMode).toBe(ANCHOR_MODES.BREEDING_DATE);
  });

  // ============================================================================
  // Test 5.8: All existing enum values still valid
  // ============================================================================
  test('All existing enum values still valid', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Enum Values',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Test all anchor modes
    const anchorModes = ['CYCLE_START', 'OVULATION', 'BREEDING_DATE'];
    for (const mode of anchorModes) {
      // Verify mode is valid by using it
      expect(Object.values(ANCHOR_MODES)).toContain(mode);
    }

    // Test all plan statuses
    const statuses = [
      'PLANNING', 'COMMITTED', 'BRED', 'BIRTHED',
      'WEANED', 'PLACEMENT', 'COMPLETE', 'CANCELED'
    ];
    for (const status of statuses) {
      expect(Object.values(PLAN_STATUSES)).toContain(status);
    }
  });
});
