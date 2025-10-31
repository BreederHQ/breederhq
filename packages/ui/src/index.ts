// packages/ui/src/index.ts
export * from "./components";
export * as hooks from "./hooks";
export * as utils from "./utils";

// Re-export breeding math (the file lives under utils/)
export * as breedingMath from "./utils/breedingMath";

// Canonical types (these live under utils/)
export type { BreedHit, SpeciesUI, SpeciesAPI } from "./utils/types";

// Species helpers (also under utils/)
export { SPECIES_UI, toApiSpecies, toUiSpecies } from "./utils/species";
