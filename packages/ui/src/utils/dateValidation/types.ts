// packages/ui/src/utils/dateValidation/types.ts
// Types for breeding plan date validation rules

import type { SpeciesCode } from "../reproEngine/types";

export type { SpeciesCode };

/**
 * The milestone sequence for breeding plans.
 * Each milestone must occur after the previous one in the sequence.
 */
export const MILESTONE_SEQUENCE = [
  "cycleStart",
  "hormoneTesting",
  "breeding",
  "birth",
  "weaning",
  "placementStart",
  "placementCompleted",
  "planCompleted",
] as const;

export type MilestoneKey = (typeof MILESTONE_SEQUENCE)[number];

/**
 * Biology rules per species - soft warnings, configurable per tenant
 */
export interface SpeciesBiologyRules {
  // Gestation period bounds
  gestationMinDays: number;
  gestationTypicalDays: number;
  gestationMaxDays: number;

  // Breeding timing from cycle start
  cycleToBreedingMinDays: number;
  cycleToBreedingMaxDays: number;

  // Weaning timing from birth
  birthToWeaningMinDays: number;
  birthToWeaningTypicalDays: number;

  // Placement timing from birth
  birthToPlacementMinDays: number;
  birthToPlacementTypicalDays: number;

  // Female age requirements (for breeding)
  femaleMinBreedingAgeMonths: number;
  femaleMaxBreedingAgeYears: number;

  // Recovery between litters
  postpartumRecoveryMinDays: number;

  // Lifetime limits
  maxLifetimeLitters: number;
  minCyclesBetweenLitters: number;
}

/**
 * Sequence rules - hard blocks for impossible date orders
 */
export interface SequenceValidationRules {
  /** Master toggle - if false, sequence validation is disabled */
  enforceSequenceOrder: boolean;

  /** If true, entering an actual requires the prior milestone actual to exist */
  requirePriorMilestone: boolean;

  /** If false, warns when actual dates are in the future */
  allowFutureActuals: boolean;
}

/**
 * Business/operational rules - configurable warnings
 */
export interface BusinessValidationRules {
  /** Warn if plan duration exceeds this (months) */
  maxPlanDurationMonths: number;

  /** Warn if cycle start is more than this many months in the future */
  maxFutureCycleStartMonths: number;

  /** Warn if cycle start is more than this many months in the past */
  maxPastCycleStartMonths: number;

  /** Warn if deposits exist but no breeding date recorded */
  requireBreedingBeforeDeposits: boolean;

  /** Warn if actual dates skip intermediate milestones */
  warnOnMissingIntermediateActuals: boolean;
}

/**
 * Full tenant-level validation configuration
 */
export interface DateValidationConfig {
  // Master toggles
  enableSequenceValidation: boolean;
  enableBiologyWarnings: boolean;
  enableBusinessWarnings: boolean;

  // Rule sets
  sequenceRules: SequenceValidationRules;
  businessRules: BusinessValidationRules;

  // Per-species overrides (null/undefined = use defaults)
  speciesOverrides: Partial<Record<SpeciesCode, Partial<SpeciesBiologyRules>>>;
}

/**
 * Validation error - hard block, prevents save
 */
export interface ValidationError {
  /** The field/milestone with the error */
  field: MilestoneKey | string;

  /** Machine-readable error code */
  code:
    | "SEQUENCE_VIOLATION"
    | "MISSING_REQUIRED_PRIOR"
    | "INVALID_DATE_FORMAT"
    | "DATE_IN_FUTURE";

  /** Human-readable error message */
  message: string;

  /** The expected value or constraint that was violated */
  expected?: string;

  /** The actual value that caused the error */
  actual?: string;
}

/**
 * Validation warning - soft warning, can be overridden with confirmation
 */
export interface ValidationWarning {
  /** The field/milestone with the warning */
  field: MilestoneKey | string;

  /** Machine-readable warning code */
  code:
    | "GESTATION_TOO_SHORT"
    | "GESTATION_TOO_LONG"
    | "BREEDING_TOO_EARLY"
    | "BREEDING_TOO_LATE"
    | "WEANING_TOO_EARLY"
    | "PLACEMENT_TOO_EARLY"
    | "FEMALE_TOO_YOUNG"
    | "FEMALE_TOO_OLD"
    | "POSTPARTUM_TOO_SOON"
    | "EXCEEDS_LITTER_LIMIT"
    | "PLAN_TOO_LONG"
    | "CYCLE_TOO_FAR_FUTURE"
    | "CYCLE_TOO_FAR_PAST"
    | "MISSING_INTERMEDIATE_ACTUAL"
    | "DEPOSITS_WITHOUT_BREEDING"
    | "ACTUAL_IN_FUTURE";

  /** Human-readable warning message */
  message: string;

  /** Severity level for UI styling */
  severity: "info" | "caution" | "serious";

  /** Whether the user can override this warning */
  canOverride: boolean;

  /** Additional context for the warning */
  details?: {
    expected?: string;
    actual?: string;
    speciesDefault?: number;
    tenantOverride?: number;
  };
}

/**
 * Result of validating a breeding plan's dates
 */
export interface ValidationResult {
  /** Overall validity - false if any errors exist */
  valid: boolean;

  /** Hard errors that prevent save */
  errors: ValidationError[];

  /** Soft warnings that can be overridden */
  warnings: ValidationWarning[];
}

/**
 * Context required for validation
 */
export interface ValidationContext {
  /** The species being bred */
  species: SpeciesCode;

  /** Tenant's validation configuration */
  config: DateValidationConfig;

  /** Female's date of birth (for age calculations) */
  femaleDob?: string | null;

  /** Female's previous litter count */
  femaleLitterCount?: number;

  /** Date of female's last birth (for postpartum calculations) */
  femaleLastBirthDate?: string | null;

  /** Today's date for future/past calculations */
  today?: string;
}

/**
 * The actual dates from a breeding plan
 */
export interface PlanActualDates {
  cycleStartActual?: string | null;
  hormoneTestingActual?: string | null;
  breedingActual?: string | null;
  birthActual?: string | null;
  weaningActual?: string | null;
  placementStartActual?: string | null;
  placementCompletedActual?: string | null;
  planCompletedActual?: string | null;
}

/**
 * Override acknowledgment record for audit trail
 */
export interface WarningOverride {
  /** The warning code that was overridden */
  warningCode: ValidationWarning["code"];

  /** The field that triggered the warning */
  field: string;

  /** When the override was acknowledged */
  acknowledgedAt: string;

  /** User who acknowledged the override */
  acknowledgedBy: string;

  /** The warning message that was shown */
  message: string;

  /** The value that was entered despite the warning */
  valueEntered: string;
}
