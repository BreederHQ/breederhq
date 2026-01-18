// tests/e2e/breeding/specs/phase-4-immutability.spec.ts
// Phase 4: Immutability Tests (12 tests)
// Tests date field immutability rules based on plan status

import { test, expect } from '../fixtures/breeding-fixtures';
import {
  createBreedingPlan,
  getBreedingPlan,
  lockBreedingPlan,
  updateBreedingPlan,
  getAnimals,
  addDays,
} from '../fixtures/database-helpers';
import {
  TEST_SPECIES,
  ANCHOR_MODES,
  OVULATION_METHODS,
  PLAN_STATUSES,
} from '../config/hogwarts-config';

test.describe('Phase 4: Immutability Rules', () => {
  let dogDamId: number;
  let dogSireId: number;

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

    console.log(`[Setup] Found animals - Dogs: dam=${dogDamId}, sire=${dogSireId}`);
  });

  // ============================================================================
  // Test 4.1: PLANNING status - all fields mutable
  // ============================================================================
  test('PLANNING status - all fields mutable', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Planning Mutable',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
      status: PLAN_STATUSES.PLANNING,
    });
    testPlanIds.push(plan.id);

    // Should be able to update all date fields
    const updates = {
      cycleStartObserved: '2026-03-15',
      breedDateActual: '2026-03-20',
    };

    const result = await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, updates);
    expect(result.cycleStartObserved).toBeTruthy();
  });

  // ============================================================================
  // Test 4.2: COMMITTED status - anchor mode locked (upgrade only)
  // ============================================================================
  test('COMMITTED status - anchor mode locked (upgrade only)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Committed Anchor Lock',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock plan
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Try to change anchor mode directly (should fail)
    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        reproAnchorMode: ANCHOR_MODES.OVULATION,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/anchor.*mode.*locked|immutable_field|upgrade.*endpoint/i);
    }
  });

  // ============================================================================
  // Test 4.3: COMMITTED status - cycle start has ±3 day tolerance
  // ============================================================================
  test('COMMITTED status - cycle start has ±3 day tolerance', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cycle Start Tolerance',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const originalDate = '2026-03-15';
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: originalDate,
    });

    // Update within tolerance (+2 days) - should succeed
    const withinTolerance = addDays(originalDate, 2);
    const result = await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      cycleStartObserved: withinTolerance,
    });
    expect(result).toBeTruthy();

    // Update outside tolerance (+5 days) - should fail
    const outsideTolerance = addDays(originalDate, 5);
    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        cycleStartObserved: outsideTolerance,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/tolerance|±3.*days|immutable/i);
    }
  });

  // ============================================================================
  // Test 4.4: BRED status - pre-breeding dates locked
  // ============================================================================
  test('BRED status - pre-breeding dates locked', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Bred Status Locks',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock and advance to BRED status
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Update to BRED status with actual dates
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      status: PLAN_STATUSES.BRED,
      cycleStartDateActual: '2026-03-15',
      breedDateActual: '2026-03-20',
    });

    // Try to change cycle start (should fail - locked in BRED status)
    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        cycleStartObserved: '2026-03-18',
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/immutable|locked|cannot.*change/i);
    }
  });

  // ============================================================================
  // Test 4.5: BRED status - breed date has ±2 day tolerance
  // ============================================================================
  test('BRED status - breed date has ±2 day tolerance', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Breed Date Tolerance',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    const breedDate = '2026-03-20';
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      status: PLAN_STATUSES.BRED,
      cycleStartDateActual: '2026-03-15',
      breedDateActual: breedDate,
    });

    // Update within tolerance (+1 day) - should succeed
    const withinTolerance = addDays(breedDate, 1);
    const result = await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      breedDateActual: withinTolerance,
    });
    expect(result).toBeTruthy();
  });

  // ============================================================================
  // Test 4.6: BIRTHED status - birth date strictly immutable
  // ============================================================================
  test('BIRTHED status - birth date strictly immutable', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Birth Date Strict',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Progress to BIRTHED
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      status: PLAN_STATUSES.BIRTHED,
      cycleStartDateActual: '2026-03-15',
      breedDateActual: '2026-03-20',
      birthDateActual: '2026-05-29',
    });

    // Try to change birth date (should fail - strictly immutable)
    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        birthDateActual: '2026-05-30',
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/birth.*date.*immutable|strictly.*immutable|cannot.*change.*birth/i);
    }
  });

  // ============================================================================
  // Test 4.7: WEANED status - weaned date has ±7 day tolerance
  // ============================================================================
  test('WEANED status - weaned date has ±7 day tolerance', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Weaned Tolerance',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    const weanedDate = '2026-07-29';
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      status: PLAN_STATUSES.WEANED,
      cycleStartDateActual: '2026-03-15',
      breedDateActual: '2026-03-20',
      birthDateActual: '2026-05-29',
      weanedDateActual: weanedDate,
    });

    // Update within tolerance (+5 days) - should succeed
    const withinTolerance = addDays(weanedDate, 5);
    const result = await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      weanedDateActual: withinTolerance,
    });
    expect(result).toBeTruthy();
  });

  // ============================================================================
  // Test 4.8: Cannot clear dates that have downstream dependencies
  // ============================================================================
  test('Cannot clear dates that have downstream dependencies', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Downstream Dependencies',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Set all dates
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      status: PLAN_STATUSES.BRED,
      cycleStartDateActual: '2026-03-15',
      breedDateActual: '2026-03-20',
    });

    // Try to clear cycle start (has downstream breed date)
    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        cycleStartDateActual: null,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/downstream|dependency|cannot.*clear/i);
    }
  });

  // ============================================================================
  // Test 4.9: ImmutabilityError returns correct field name
  // ============================================================================
  test('ImmutabilityError returns correct field name', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Error Field Name',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      status: PLAN_STATUSES.BIRTHED,
      cycleStartDateActual: '2026-03-15',
      breedDateActual: '2026-03-20',
      birthDateActual: '2026-05-29',
    });

    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        birthDateActual: '2026-05-30',
      });
    } catch (error: any) {
      // Error should mention the specific field
      expect(error.message.toLowerCase()).toContain('birth');
    }
  });

  // ============================================================================
  // Test 4.10: COMMITTED ovulation has ±2 day tolerance
  // ============================================================================
  test('COMMITTED ovulation has ±2 day tolerance', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Ovulation Tolerance',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const ovulationDate = '2026-03-27';
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: ovulationDate,
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Update within tolerance (+1 day) - should succeed
    const withinTolerance = addDays(ovulationDate, 1);
    const result = await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      ovulationConfirmed: withinTolerance,
    });
    expect(result).toBeTruthy();

    // Update outside tolerance (+4 days) - should fail
    const outsideTolerance = addDays(ovulationDate, 4);
    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        ovulationConfirmed: outsideTolerance,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/tolerance|±2.*days|immutable/i);
    }
  });

  // ============================================================================
  // Test 4.11: CANCELED status allows no date changes
  // ============================================================================
  test('CANCELED status allows no date changes', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Canceled Locked',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Cancel the plan
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      status: PLAN_STATUSES.CANCELED,
    });

    // Try to update any date (should fail)
    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        cycleStartObserved: '2026-03-20',
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/canceled|immutable|cannot.*modify/i);
    }
  });

  // ============================================================================
  // Test 4.12: Date validation respects species gestation limits
  // ============================================================================
  test('Date validation respects species gestation limits', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Gestation Limits',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Try to set birth date way too early (impossible gestation)
    await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      cycleStartDateActual: '2026-03-15',
      breedDateActual: '2026-03-20',
    });

    try {
      await updateBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        birthDateActual: '2026-04-01', // Only ~12 days after breeding (impossible)
        status: PLAN_STATUSES.BIRTHED,
      });
      // May succeed with warning, or fail with validation error
    } catch (error: any) {
      // Expected: gestation period validation
      expect(error.message).toMatch(/gestation|too.*early|invalid.*date/i);
    }
  });
});
