// packages/ui/src/index.ts
export * from "./components";
export * from "./atoms";
export * as hooks from "./hooks";
export * as utils from "./utils";

// Re-export commonly used hooks directly for convenience
export { useViewMode } from "./hooks/useViewMode";

export type { BreedHit, SpeciesUI, SpeciesAPI } from "./utils/types";
export { SPECIES_UI, toApiSpecies, toUiSpecies } from "./utils/species";
export { exportToCsv } from "./utils/csvExport";
export type { CsvColumn, CsvExportOptions } from "./utils/csvExport";

// Species Terminology System (STS) - Direct exports for convenience
export { useSpeciesTerminology } from "./hooks/useSpeciesTerminology";
export type { UseSpeciesTerminologyReturn } from "./hooks/useSpeciesTerminology";
export {
  getSpeciesTerminology,
  getOffspringName,
  getOffspringNameCap,
  getBirthProcess,
  getBirthVerb,
  getGroupName,
  getParentName,
  speciesUsesCollars,
  speciesEmphasizesCounts,
  speciesShowsGroupConcept,
  speciesUsesLitterWaitlist,
} from "./utils/speciesTerminology";
export type { SpeciesCode, SpeciesTerminology } from "./utils/speciesTerminology";

// atoms
export { Spinner } from "./atoms/Spinner";
export type { SpinnerProps } from "./atoms/Spinner";
export { toast, useToast, ToastViewport } from "./atoms/Toast";

// assets - animal placeholders
export {
  DogPlaceholder,
  CatPlaceholder,
  HorsePlaceholder,
  GoatPlaceholder,
  RabbitPlaceholder,
} from "./assets/placeholders";

// legal
export {
  CURRENT_TOS_VERSION,
  TOS_EFFECTIVE_DATE,
  TOS_EFFECTIVE_DATE_DISPLAY,
  needsTosAcceptance,
  createTosAcceptancePayload,
} from "./legal";
export type { TosAcceptanceRecord, TosAcceptancePayload } from "./legal";
export { TermsContent } from "./legal/TermsContent";
