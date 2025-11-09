// packages/ui/src/utils/index.ts
// Single-source barrel to avoid duplicate re-exports that break DTS builds.

// Biology math (canonical source for these types and helpers)
export type { Species, DateLike, Range, StageWindows } from "./breedingMath";
export {
  fromPlan as windowsFromPlan,
  monthsBetween,
  padByOneMonth,
  oneDayRange,
  addDays,
} from "./breedingMath";

export {
  computeWindows,
  expectedMilestonesFromLocked,
  expectedTestingFromCycleStart,
  projectUpcomingCycles,
  bioFor,
} from "./breedingMath";

// Settings
export type { BreederSettings } from "./breederSettings";
export { loadSettings, saveSettings } from "./breederSettings";

// The rest should not collide; keep them wildcarded
export * from "./availability";
export * from "./breedingProgram";
export * from "./breedsApi";
export * from "./cn";
export * from "./hosts";
export * from "./medicationReminders";
export * from "./medications";
export * from "./ownership";
export * from "./repro";
export * from "./sort";
export * from "./tenant";
export * from "./weights";


export { pickPlacementCompletedAny } from "./expected";

// Species helpers and a few focused types
export { SPECIES_UI, toApiSpecies, toUiSpecies } from "./species";
export type { BreedHit, SpeciesUI, SpeciesAPI } from "./types";

