// tests/e2e/breeding/specs/phase-3-upgrade-anchor.spec.ts
// Phase 3: Upgrade Anchor Tests (15 tests)
// Tests the /upgrade-to-ovulation endpoint

import { test, expect } from '../fixtures/breeding-fixtures';
import {
  createBreedingPlan,
  getBreedingPlan,
  lockBreedingPlan,
  upgradeToOvulation,
  getAnimals,
} from '../fixtures/database-helpers';
import {
  TEST_SPECIES,
  ANCHOR_MODES,
  OVULATION_METHODS,
  CONFIDENCE_LEVELS,
} from '../config/hogwarts-config';
import {
  SPECIES_DEFAULTS,
  SPECIES_BEHAVIOR,
  UPGRADE_TEST_SCENARIOS,
} from '../fixtures/anchor-test-data';

test.describe('Phase 3: Upgrade Anchor', () => {
  let dogDamId: number;
  let dogSireId: number;
  let horseDamId: number;
  let horseSireId: number;
  let catDamId: number;
  let catSireId: number;
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
      const cats = await getAnimals(apiContext, hogwartsConfig, { species: 'CAT' });
      catDamId = cats.find((a: any) => a.sex === 'FEMALE')?.id;
      catSireId = cats.find((a: any) => a.sex === 'MALE')?.id;
      console.log(`[Setup] Cats: dam=${catDamId}, sire=${catSireId}`);
    } catch (e) {
      console.log('[Setup] No cat animals found or error fetching cats');
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
  // Test 3.1: DOG - Upgrade from CYCLE_START to OVULATION (on-time)
  // ============================================================================
  test('DOG - Upgrade from CYCLE_START to OVULATION (on-time)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const scenario = UPGRADE_TEST_SCENARIOS.dogOnTime;

    // Create and lock plan with cycle start
    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Upgrade On-Time',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: scenario.initialAnchorDate,
    });

    // Upgrade to ovulation
    const result = await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: scenario.ovulationDate,
      confirmationMethod: scenario.confirmationMethod,
    });

    expect(result.success).toBe(true);
    expect(result.upgrade.from).toBe(ANCHOR_MODES.CYCLE_START);
    expect(result.upgrade.to).toBe(ANCHOR_MODES.OVULATION);
    expect(result.variance.variance).toBe(scenario.expectedVariance);
    expect(result.variance.analysis).toBe(scenario.expectedAnalysis);
  });

  // ============================================================================
  // Test 3.2: DOG - Upgrade with late ovulation (+2 days variance)
  // ============================================================================
  test('DOG - Upgrade with late ovulation (+2 days variance)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const scenario = UPGRADE_TEST_SCENARIOS.dogLate;

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Upgrade Late Ovulation',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: scenario.initialAnchorDate,
    });

    const result = await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: scenario.ovulationDate,
      confirmationMethod: scenario.confirmationMethod,
    });

    expect(result.success).toBe(true);
    expect(result.variance.variance).toBe(scenario.expectedVariance);
    expect(result.variance.analysis).toBe(scenario.expectedAnalysis);
    expect(result.variance.actualOffset).toBe(14); // Day 14 from cycle start
  });

  // ============================================================================
  // Test 3.3: DOG - Upgrade with early ovulation (-3 days variance)
  // ============================================================================
  test('DOG - Upgrade with early ovulation (-3 days variance)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const scenario = UPGRADE_TEST_SCENARIOS.dogEarly;

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Upgrade Early Ovulation',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: scenario.initialAnchorDate,
    });

    const result = await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: scenario.ovulationDate,
      confirmationMethod: scenario.confirmationMethod,
    });

    expect(result.success).toBe(true);
    expect(result.variance.variance).toBe(scenario.expectedVariance);
    expect(result.variance.analysis).toBe(scenario.expectedAnalysis);
    expect(result.variance.actualOffset).toBe(9); // Day 9 from cycle start
  });

  // ============================================================================
  // Test 3.4: Variance tracking fields are populated
  // ============================================================================
  test('Variance tracking fields are populated', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Variance Fields',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: '2026-03-29', // +2 days late
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);

    // Verify variance tracking fields
    expect(updatedPlan.expectedOvulationOffset).toBe(12); // Expected for dogs
    expect(updatedPlan.actualOvulationOffset).toBe(14); // Actual (29-15)
    expect(updatedPlan.varianceFromExpected).toBe(2); // +2 days late
  });

  // ============================================================================
  // Test 3.5: Anchor mode changes from CYCLE_START to OVULATION
  // ============================================================================
  test('Anchor mode changes from CYCLE_START to OVULATION', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Anchor Mode Change',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    // Verify initial anchor mode
    let currentPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(currentPlan.reproAnchorMode).toBe(ANCHOR_MODES.CYCLE_START);

    await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: '2026-03-27',
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Verify anchor mode changed
    currentPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(currentPlan.reproAnchorMode).toBe(ANCHOR_MODES.OVULATION);
  });

  // ============================================================================
  // Test 3.6: Confidence upgrades from MEDIUM to HIGH
  // ============================================================================
  test('Confidence upgrades from MEDIUM to HIGH', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Confidence Upgrade',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    const lockResult = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });
    expect(lockResult.confidence).toBe(CONFIDENCE_LEVELS.MEDIUM);

    const upgradeResult = await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: '2026-03-27',
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Confidence should now be HIGH
    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.ovulationConfidence).toBe(CONFIDENCE_LEVELS.HIGH);
  });

  // ============================================================================
  // Test 3.7: Expected dates recalculated after upgrade
  // ============================================================================
  test('Expected dates recalculated after upgrade', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Date Recalculation',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock with cycle start
    const lockResult = await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });
    const originalDueDate = lockResult.calculatedDates.dueDate;

    // Upgrade with late ovulation (2 days later than expected)
    const upgradeResult = await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: '2026-03-29', // Day 14 instead of Day 12
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Due date should shift by 2 days
    const newDueDate = upgradeResult.calculatedDates.dueDate;
    const originalDate = new Date(originalDueDate);
    const newDate = new Date(newDueDate);
    const shiftDays = Math.round((newDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));

    expect(shiftDays).toBe(2); // Shifted 2 days later
    expect(upgradeResult.placementShift).toBe(2);
  });

  // ============================================================================
  // Test 3.8: Cannot upgrade BREEDING_DATE anchor (cats)
  // ============================================================================
  test('Cannot upgrade BREEDING_DATE anchor (cats)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!catDamId || !catSireId, 'No cat animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Cat No Upgrade',
      species: TEST_SPECIES.CAT,
      damId: catDamId,
      sireId: catSireId,
    });
    testPlanIds.push(plan.id);

    // Lock with breeding date (cats are induced ovulators)
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.BREEDING_DATE as 'BREEDING_DATE',
      anchorDate: '2026-03-15',
    });

    // Upgrade should fail
    try {
      await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
        ovulationDate: '2026-03-15',
        confirmationMethod: OVULATION_METHODS.BREEDING_INDUCED,
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toMatch(/cannot.*upgrade|not.*supported|induced/i);
    }
  });

  // ============================================================================
  // Test 3.9: Cannot upgrade species without testing (goats)
  // ============================================================================
  test('Cannot upgrade species without testing (goats)', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!goatDamId || !goatSireId, 'No goat animals available for testing');

    expect(SPECIES_BEHAVIOR.GOAT.supportsUpgrade).toBe(false);

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Goat No Upgrade',
      species: TEST_SPECIES.GOAT,
      damId: goatDamId,
      sireId: goatSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-09-15',
    });

    try {
      await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
        ovulationDate: '2026-09-17',
        confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/not.*available|not.*supported/i);
    }
  });

  // ============================================================================
  // Test 3.10: Cannot upgrade plan already at OVULATION
  // ============================================================================
  test('Cannot upgrade plan already at OVULATION', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Already Ovulation',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Lock directly with ovulation
    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.OVULATION as 'OVULATION',
      anchorDate: '2026-03-27',
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    });

    // Upgrade should fail (already at ovulation)
    try {
      await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
        ovulationDate: '2026-03-28',
        confirmationMethod: OVULATION_METHODS.LH_TEST,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/already.*ovulation|cannot.*upgrade/i);
    }
  });

  // ============================================================================
  // Test 3.11: Cannot upgrade PLANNING status plan
  // ============================================================================
  test('Cannot upgrade PLANNING status plan', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Still Planning',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    // Try to upgrade without locking first
    try {
      await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
        ovulationDate: '2026-03-27',
        confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/not.*committed|must.*lock|planning/i);
    }
  });

  // ============================================================================
  // Test 3.12: HORSE - Upgrade with ultrasound confirmation
  // ============================================================================
  test('HORSE - Upgrade with ultrasound confirmation', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!horseDamId || !horseSireId, 'No horse animals available for testing');

    const scenario = UPGRADE_TEST_SCENARIOS.horseUpgrade;

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Horse Upgrade',
      species: TEST_SPECIES.HORSE,
      damId: horseDamId,
      sireId: horseSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: scenario.initialAnchorDate,
    });

    const result = await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: scenario.ovulationDate,
      confirmationMethod: scenario.confirmationMethod,
    });

    expect(result.success).toBe(true);
    expect(result.upgrade.to).toBe(ANCHOR_MODES.OVULATION);

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.ovulationConfirmedMethod).toBe(OVULATION_METHODS.ULTRASOUND);
  });

  // ============================================================================
  // Test 3.13: Upgrade with notes
  // ============================================================================
  test('Upgrade with notes', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Upgrade with Notes',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    const notes = 'Progesterone 6.2 ng/mL at 10:30am, confirmed ovulation';
    const result = await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
      ovulationDate: '2026-03-27',
      confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
      notes,
    });

    expect(result.success).toBe(true);

    const updatedPlan = await getBreedingPlan(apiContext, hogwartsConfig, plan.id);
    expect(updatedPlan.dateSourceNotes).toContain('Progesterone');
  });

  // ============================================================================
  // Test 3.14: Cannot upgrade with invalid ovulation date
  // ============================================================================
  test('Cannot upgrade with invalid ovulation date', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Invalid Ovulation Date',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    try {
      await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
        ovulationDate: 'invalid-date',
        confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toMatch(/invalid.*date|format/i);
    }
  });

  // ============================================================================
  // Test 3.15: Ovulation date must be after cycle start
  // ============================================================================
  test('Ovulation date must be after cycle start', async ({
    apiContext,
    hogwartsConfig,
    testPlanIds,
  }) => {
    test.skip(!dogDamId || !dogSireId, 'No dog animals available for testing');

    const plan = await createBreedingPlan(apiContext, hogwartsConfig, {
      name: 'Test Plan - Ovulation Before Cycle',
      species: TEST_SPECIES.DOG,
      damId: dogDamId,
      sireId: dogSireId,
    });
    testPlanIds.push(plan.id);

    await lockBreedingPlan(apiContext, hogwartsConfig, plan.id, {
      anchorMode: ANCHOR_MODES.CYCLE_START as 'CYCLE_START',
      anchorDate: '2026-03-15',
    });

    try {
      // Ovulation before cycle start should fail
      await upgradeToOvulation(apiContext, hogwartsConfig, plan.id, {
        ovulationDate: '2026-03-10', // Before cycle start
        confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      // API returns: "Ovulation date must be after cycle start date"
      expect(error.message).toMatch(/ovulation.*after.*cycle|invalid_ovulation_date/i);
    }
  });
});
