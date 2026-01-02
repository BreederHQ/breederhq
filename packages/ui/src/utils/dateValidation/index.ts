// packages/ui/src/utils/dateValidation/index.ts
// Date validation module for breeding plans

// Types
export type {
  SpeciesCode,
  MilestoneKey,
  SpeciesBiologyRules,
  SequenceValidationRules,
  BusinessValidationRules,
  DateValidationConfig,
  ValidationError,
  ValidationWarning,
  ValidationResult,
  ValidationContext,
  PlanActualDates,
  WarningOverride,
} from "./types";

export { MILESTONE_SEQUENCE } from "./types";

// Defaults
export {
  SPECIES_BIOLOGY_DEFAULTS,
  DEFAULT_SEQUENCE_RULES,
  DEFAULT_BUSINESS_RULES,
  DEFAULT_VALIDATION_CONFIG,
  getSpeciesBiologyRules,
  getValidationConfig,
  MILESTONE_LABELS,
  getMilestoneLabel,
} from "./defaults";

// Validation functions
export { validateBreedingDates, validateSingleDate } from "./validate";

// API utilities
export {
  fetchValidationConfig,
  saveValidationConfig,
  logWarningOverride,
  fetchWarningOverrides,
} from "./api";

// Audit logging
export type { AuditLogContext, AuditLogEntry } from "./auditLog";
export {
  logValidationOverrides,
  createOverrideLogger,
  fetchPlanOverrides,
  planHasOverrides,
  retryPendingOverrides,
  useValidationAuditLog,
} from "./auditLog";
