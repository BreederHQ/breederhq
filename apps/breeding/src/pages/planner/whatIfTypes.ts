// apps/breeding/src/pages/planner/whatIfTypes.ts
// What If types for planner components

export type ID = number | string;

export type SpeciesWire = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT" | (string & {});
export type SpeciesUi = "Dog" | "Cat" | "Horse" | "Goat" | "Rabbit";

export type WhatIfRow = {
  id: string;
  damId: ID | null;
  damName: string | null;
  species: SpeciesWire | null;
  cycleStartIso: string | null;
  showOnChart: boolean;
  femaleCycleLenOverrideDays?: number | null;
};

export type WhatIfFemale = {
  id: ID;
  name: string;
  species: SpeciesWire | null;
  femaleCycleLenOverrideDays?: number | null;
};

// Normalized plan shape for Rollup
export type NormalizedPlan = {
  id: string;
  name: string;
  species: string;
  lockedCycleStart?: string | null;
  expectedCycleStart?: string | null;
  expectedHormoneTestingStart?: string | null;
  expectedBreedDate?: string | null;
  expectedBirthDate?: string | null;
  expectedWeaned?: string | null;
  expectedPlacementStartDate?: string | null;
  expectedPlacementCompleted?: string | null;
  placementCompletedDateExpected?: string | null;
  isSynthetic?: boolean;
  [key: string]: any;
};
