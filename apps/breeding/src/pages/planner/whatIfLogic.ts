// apps/breeding/src/pages/planner/whatIfLogic.ts
// What If logic - synthetic plan composition

import type { ID, WhatIfRow, SpeciesUi, NormalizedPlan } from "./whatIfTypes";

/**
 * Convert wire species to UI species
 */
export function toUiSpecies(wire: string | null | undefined): SpeciesUi {
  if (!wire) return "Dog";
  const s = wire.toUpperCase();
  if (s === "CAT") return "Cat";
  if (s === "HORSE") return "Horse";
  if (s === "GOAT") return "Goat" as SpeciesUi;
  if (s === "RABBIT") return "Rabbit" as SpeciesUi;
  return "Dog";
}

/**
 * Create synthetic plans from What If rows
 */
export function createSyntheticPlans(
  whatIfRows: WhatIfRow[],
  computeExpected: (params: { species: SpeciesUi; lockedCycleStart: string | null; femaleCycleLenOverrideDays?: number | null }) => any
): NormalizedPlan[] {
  return whatIfRows
    .filter(r => r.showOnChart && r.damId != null && r.cycleStartIso)
    .map((r): NormalizedPlan => {
      const id = `whatif-${r.id}`;
      const speciesUi = toUiSpecies(r.species);

      // Compute expected dates
      const expectedDates = computeExpected({
        species: speciesUi,
        lockedCycleStart: r.cycleStartIso,
        femaleCycleLenOverrideDays: r.femaleCycleLenOverrideDays,
      });

      return {
        id,
        name: r.damName ? `${r.damName} - What If` : `What If - ${String(r.damId)}`,
        species: speciesUi,
        lockedCycleStart: r.cycleStartIso,
        expectedCycleStart: expectedDates?.cycleStart ?? r.cycleStartIso,
        expectedHormoneTestingStart: expectedDates?.hormoneTestingStart ?? null,
        expectedBreedDate: expectedDates?.breedDate ?? null,
        expectedBirthDate: expectedDates?.birthDate ?? null,
        expectedWeaned: expectedDates?.weanedDate ?? null,
        expectedPlacementStartDate: expectedDates?.placementStart ?? null,
        expectedPlacementCompleted: expectedDates?.placementCompleted ?? null,
        placementCompletedDateExpected: expectedDates?.placementCompleted ?? null,
        isSynthetic: true,
      };
    });
}

/**
 * Compose base plans with synthetic What If plans
 */
export function composeWithSynthetic(
  basePlans: NormalizedPlan[],
  syntheticPlans: NormalizedPlan[]
): NormalizedPlan[] {
  return [...basePlans, ...syntheticPlans];
}

/**
 * Build selected keys that include synthetic plans when showOnChart is enabled
 */
export function buildSelectedKeysWithWhatIf(
  baseSelectedKeys: Set<ID>,
  whatIfRows: WhatIfRow[]
): Set<string> {
  const result = new Set<string>(Array.from(baseSelectedKeys).map(String));

  for (const r of whatIfRows) {
    if (r.showOnChart && r.damId != null && r.cycleStartIso) {
      result.add(`whatif-${r.id}`);
    }
  }

  return result;
}

/**
 * Create an empty What If row
 */
export function createEmptyWhatIfRow(species?: string | null): WhatIfRow {
  return {
    id: `whatif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    damId: null,
    damName: null,
    species: species as any ?? null,
    cycleStartIso: null,
    showOnChart: true,
    femaleCycleLenOverrideDays: null,
  };
}
