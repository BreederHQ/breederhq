import type { SpeciesCode } from "./types";

export type SpeciesReproDefaults = {
  cycleLenDays: number;
  ovulationOffsetDays: number;
  startBufferDays: number;

  gestationDays: number;

  // Placement rules. Use weeks to stay consistent with existing UI logic.
  placementStartWeeksDefault: number;
  placementExtendedWeeks: number;

  // Juvenile first-cycle expectations, DOB based.
  juvenileFirstCycleMinDays: number;
  juvenileFirstCycleLikelyDays: number;
  juvenileFirstCycleMaxDays: number;

  // Postpartum return-to-cycle expectations.
  postpartumMinDays: number;
  postpartumLikelyDays: number;
  postpartumMaxDays: number;
};

const DEFAULTS_BY_SPECIES: Record<string, SpeciesReproDefaults> = {

  DOG: {
    cycleLenDays: 180,
    ovulationOffsetDays: 12,
    startBufferDays: 14,
    gestationDays: 63,
    placementStartWeeksDefault: 8,
    placementExtendedWeeks: 3,
    juvenileFirstCycleMinDays: 180,
    juvenileFirstCycleLikelyDays: 270,
    juvenileFirstCycleMaxDays: 420,
    postpartumMinDays: 90,
    postpartumLikelyDays: 120,
    postpartumMaxDays: 210,
  },

CAT: {
  cycleLenDays: 21,
  ovulationOffsetDays: 3,
  startBufferDays: 7,
  gestationDays: 63,

  placementStartWeeksDefault: 8,
  placementExtendedWeeks: 3,

  juvenileFirstCycleMinDays: 150,     // 5 months
  juvenileFirstCycleLikelyDays: 210,  // 7 months
  juvenileFirstCycleMaxDays: 300,     // 10 months

  postpartumMinDays: 45,
  postpartumLikelyDays: 90,
  postpartumMaxDays: 180,
},

HORSE: {
  cycleLenDays: 21,
  ovulationOffsetDays: 5,
  startBufferDays: 7,
  gestationDays: 340,

  placementStartWeeksDefault: 0, // explicitly unused for horses
  placementExtendedWeeks: 0,

  juvenileFirstCycleMinDays: 365,
  juvenileFirstCycleLikelyDays: 450,
  juvenileFirstCycleMaxDays: 540,

  postpartumMinDays: 30,
  postpartumLikelyDays: 45,
  postpartumMaxDays: 120,
},

GOAT: {
  cycleLenDays: 21,
  ovulationOffsetDays: 2,
  startBufferDays: 7,
  gestationDays: 150,

  placementStartWeeksDefault: 8,
  placementExtendedWeeks: 3,

  juvenileFirstCycleMinDays: 150,
  juvenileFirstCycleLikelyDays: 210,
  juvenileFirstCycleMaxDays: 300,

  postpartumMinDays: 45,
  postpartumLikelyDays: 90,
  postpartumMaxDays: 150,
},

RABBIT: {
  // NOTE: Rabbits are induced ovulators. These values model receptivity windows,
  // not true estrous cycles.
  cycleLenDays: 15,
  ovulationOffsetDays: 0,
  startBufferDays: 3,
  gestationDays: 31,

  placementStartWeeksDefault: 8,
  placementExtendedWeeks: 3,

  juvenileFirstCycleMinDays: 120,
  juvenileFirstCycleLikelyDays: 150,
  juvenileFirstCycleMaxDays: 180,

  postpartumMinDays: 14,
  postpartumLikelyDays: 21,
  postpartumMaxDays: 60,
},

};

export function getSpeciesDefaults(species: SpeciesCode): SpeciesReproDefaults {
  const d = DEFAULTS_BY_SPECIES[String(species)];
  if (d) return d;
  return DEFAULTS_BY_SPECIES.DOG;
}

// Optional: allow runtime extension for new species later without refactors.
export function registerSpeciesDefaults(species: SpeciesCode, defaults: SpeciesReproDefaults): void {
  DEFAULTS_BY_SPECIES[String(species)] = defaults;
}
