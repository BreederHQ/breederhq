// packages/ui/src/index.ts
export * from "./components";
export * as hooks from "./hooks";
export * as utils from "./utils";

// Re-export canonical types so apps can import from "@bhq/ui"
export type { BreedHit, SpeciesUI, SpeciesAPI } from "./utils/types";
