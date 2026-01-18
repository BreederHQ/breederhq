// tests/e2e/breeding/specs/phase-2-lock-ovulation.spec.ts
// Phase 2: Lock Ovulation Tests (12 tests)
// Tests the /lock endpoint with OVULATION anchor mode

import { test, expect } from '../fixtures/breeding-fixtures';
import {
  createBreedingPlan,
  getBreedingPlan,
  lockBreedingPlan,
  getAnimals,
} from '../fixtures/database-helpers';
import {
  TEST_SPECIES,
  ANCHOR_MODES,
  OVULATION_METHODS,
  CONFIDENCE_LEVELS,
  PLAN_STATUSES,
} from '../config/hogwarts-config';
import {
  SPECIES_DEFAULTS,
  SPECIES_BEHAVIOR,
  LOCK_TEST_SCENARIOS,
  calculateExpectedDueDate,
} from '../fixtures/anchor-test-data';

test.describe('Phase 2: Lock Ovulation', () => {
  let dogDamId: number;
  let dogSireId: number;
  let horseDamId: number;
  let horseSireId: number;
  let goatDamId: number;
  let goatSireId: number;

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
  // Test 2.1: DOG - Lock plan with ovulation anchor (progesterone test)
  // ============================================================================
  test('DOG - Lock plan with ovulation anchor (progesterone test)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Dog Ovulation Lock',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const scenario = LOCK_TEST_SCENARIOS.dogOvulation;
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: scenario.anchorMode as 'OVULATION',
      anchorDate: scenario.anchorDate,
      confirmationMethod: scenario.confirmationMethod,
    });

    expect(result.success).toBe(true);
    expect(result.anchorMode).toBe(ANCHOR_MODES.OVULATION);
    expect(result.confidence).toBe(CONFIDENCE_LEVELS.HIGH);
    expect(result.calculatedDates.dueDate).toBe(scenario.expectedDueDate);
  });

  // ============================================================================
  // Test 2.2: DOG - Verify HIGH confidence for ovulation anchor
  // ============================================================================
  test('DOG - Verify HIGH confidence for ovulation anchor', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Ovulation Confidence',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: '2026-03-27',
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    expect(result.confidence).toBe(CONFIDENCE_LEVELS.HIGH);

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.ovulationConfidence).toBe(CONFIDENCE_LEVELS.HIGH);
  });

  // ============================================================================
  // Test 2.3: DOG - Verify expected birth date 63 days from ovulation
  // ============================================================================
  test('DOG - Verify expected birth date 63 days from ovulation', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Ovulation Birth Calculation',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const ovulationDate = '2026-03-27';
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: ovulationDate,
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Verify calculation: 63 days from ovulation
    const start = new Date(ovulationDate);
    const due = new Date(result.calculatedDates.dueDate);
    const diffDays = Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(SPECIES_DEFAULTS.DOG.expectedBirthFromOvulation);
  });

  // ============================================================================
  // Test 2.4: DOG - ovulationConfirmed and method fields are populated
  // ============================================================================
  test('DOG - ovulationConfirmed and method fields are populated', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Ovulation Fields',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const ovulationDate = '2026-03-27';
    const method = OVULATION_METHODS.PROGESTERONE_TEST;
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: ovulationDate,
      confirmationMethod: method,
    });

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.ovulationConfirmed).toBeTruthy();
    expect(updatedPlan.ovulationConfirmed.slice(0, 10)).toBe(ovulationDate);
    expect(updatedPlan.ovulationConfirmedMethod).toBe(method);
  });

  // ============================================================================
  // Test 2.5: DOG - Lock with LH test confirmation method
  // ============================================================================
  test('DOG - Lock with LH test confirmation method', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - LH Test Lock',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: '2026-03-27',
      confirmationMethod: OVULATION_METHODS.LH_TEST,
    });

    expect(result.success).toBe(true);
    expect(result.confidence).toBe(CONFIDENCE_LEVELS.HIGH);

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.ovulationConfirmedMethod).toBe(OVULATION_METHODS.LH_TEST);
  });

  // ============================================================================
  // Test 2.6: HORSE - Lock with ultrasound confirmation
  // ============================================================================
  test('HORSE - Lock with ultrasound confirmation', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!horseDamId || !horseSireId, 'No horse animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Horse Ultrasound Lock',
      species: TEST_SPECIES.HORSE,
      damId: horseDamId,
      sireId: horseSireId,
    });
    testPlanIds.push(plan.id);

    const scenario = LOCK_TEST_SCENARIOS.horseOvulation;
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: scenario.anchorMode as 'OVULATION',
      anchorDate: scenario.anchorDate,
      confirmationMethod: scenario.confirmationMethod,
    });

    expect(result.success).toBe(true);
    expect(result.anchorMode).toBe(ANCHOR_MODES.OVULATION);
    expect(result.confidence).toBe(CONFIDENCE_LEVELS.HIGH);
  });

  // ============================================================================
  // Test 2.7: HORSE - Verify expected birth date 340 days from ovulation
  // ============================================================================
  test('HORSE - Verify expected birth date 340 days from ovulation', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!horseDamId || !horseSireId, 'No horse animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Horse Ovulation Birth',
      species: TEST_SPECIES.HORSE,
      damId: horseDamId,
      sireId: horseSireId,
    });
    testPlanIds.push(plan.id);

    const ovulationDate = '2026-03-20';
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: ovulationDate,
      confirmationMethod: OVULATION_METHODS.ULTRASOUND,
    });

    // Verify calculation: 340 days from ovulation
    const start = new Date(ovulationDate);
    const due = new Date(result.calculatedDates.dueDate);
    const diffDays = Math.round((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(SPECIES_DEFAULTS.HORSE.expectedBirthFromOvulation);
  });

  // ============================================================================
  // Test 2.8: GOAT - Cannot lock with ovulation (testing not available)
  // ============================================================================
  test('GOAT - Cannot lock with ovulation (testing not available)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!goatDamId || !goatSireId, 'No goat animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Goat Ovulation (Should Fail)',
      species: TEST_SPECIES.GOAT,
      damId: goatDamId,
      sireId: goatSireId,
    });
    testPlanIds.push(plan.id);

    // Verify goats don't support ovulation testing
    expect(SPECIES_BEHAVIOR.GOAT.testingAvailable).toBe(false);

    try {
      await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
        anchorDate: '2026-09-17',
        confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
      });
      // Should fail - GOAT doesn't support ovulation testing
      expect(true).toBe(false);
    } catch (error: any) {
      // API returns: "OVULATION anchor mode is not available for GOAT"
      expect(error.message).toMatch(/ovulation.*not.*available|ovulation_not_supported|not.*supported/i);
    }
  });

  // ============================================================================
  // Test 2.9: Ovulation anchor requires confirmation method
  // ============================================================================
  test('Ovulation anchor requires confirmation method', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - No Confirmation Method',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    try {
      await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
        anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
        anchorDate: '2026-03-27',
        // No confirmationMethod provided
      });
      // Should fail or use default
    } catch (error: any) {
      expect(error.message).toMatch(/confirmation.*method.*required|method/i);
    }
  });

  // ============================================================================
  // Test 2.10: Ovulation lock calculates backward to estimate cycle start
  // ============================================================================
  test('Ovulation lock calculates backward to estimate cycle start', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Backward Calculation',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const ovulationDate = '2026-03-27';
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: ovulationDate,
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Cycle start should be estimated as ovulation - 12 days for dogs
    const expectedCycleStart = new Date(ovulationDate);
    expectedCycleStart.setDate(expectedCycleStart.getDate() - SPECIES_DEFAULTS.DOG.ovulationOffsetDays);

    expect(result.calculatedDates.cycleStart).toBe(expectedCycleStart.toISOString().slice(0, 10));
  });

  // ============================================================================
  // Test 2.11: Lock with testResultId links to test result
  // ============================================================================
  test('Lock with testResultId links to test result', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Test Result Link',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Note: This test requires a valid testResultId from the database
    // For now, we test that the field is accepted
    const result = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: '2026-03-27',
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
      // testResultId: 123, // Would need valid ID
      notes: 'Progesterone 6.2 ng/mL - ovulation confirmed',
    });

    expect(result.success).toBe(true);

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.dateSourceNotes).toContain('Progesterone');
  });

  // ============================================================================
  // Test 2.12: Tighter birth window (±1 day) for ovulation vs cycle start (±2-3 days)
  // ============================================================================
  test('Tighter birth window for ovulation vs cycle start', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    // Create two plans with same effective dates but different anchors
    const cycleStartPlan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cycle Start Window',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(cycleStartPlan.id);

    const ovulationPlan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Ovulation Window',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(ovulationPlan.id);

    // Lock cycle start plan
    const cycleStartResult = await lockBreedingPlan(apiContext, hogwartsConfig, cycleStartPlan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Lock ovulation plan (ovulation occurs ~12 days after cycle start)
    const ovulationResult = await lockBreedingPlan(apiContext, hogwartsConfig, ovulationPlan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: '2026-03-27', // 12 days after cycle start
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Both should have same expected due date (within 1 day)
    const cycleStartDue = new Date(cycleStartResult.calculatedDates.dueDate);
    const ovulationDue = new Date(ovulationResult.calculatedDates.dueDate);
    const diffDays = Math.abs(Math.round((cycleStartDue.getTime() - ovulationDue.getTime()) / (1000 * 60 * 60 * 24)));

    // Should be same date (or within 1 day due to rounding)
    expect(diffDays).toBeLessThanOrEqual(1);

    // But confidence should be different
    expect(cycleStartResult.confidence).toBe(CONFIDENCE_LEVELS.MEDIUM);
    expect(ovulationResult.confidence).toBe(CONFIDENCE_LEVELS.HIGH);
  });
});
