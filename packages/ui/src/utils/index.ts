// packages/ui/src/utils/index.ts
// Single-source barrel to avoid duplicate re-exports that break DTS builds.

export * as reproEngine from "./reproEngine";
export { expectedMilestonesFromLocked } from "./reproEngine/timelineFromSeed";

// Re-export toast for backward compatibility
export { toast } from "../atoms/Toast";

// Stub exports for legacy code compatibility (used in breeding module)
// These are accessed defensively with optional chaining and fallbacks
export const session = undefined;
export const currentUser = undefined;

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


// Temporary helper until all expected-date shapes are unified across apps.
// Accepts either a Plan-like object or an expected-milestones object.
export function pickPlacementCompletedAny(x: any): any {
  if (!x) return null;

  return (
    x.expectedPlacementCompletedDate ??
    x.expectedPlacementCompleted ??
    x.placementCompletedDateExpected ??
    x.placement_completed_expected ??
    x.placementExpectedEnd ??
    x.placement_expected_end ??
    x.placementExtendedEnd ??
    x.placement_extended_end ??
    (Array.isArray(x.placement_extended_full) ? x.placement_extended_full[1] : null) ??
    null
  );
}

// Species helpers and a few focused types
export { SPECIES_UI, toApiSpecies, toUiSpecies } from "./species";
export type { BreedHit, SpeciesUI, SpeciesAPI } from "./types";
