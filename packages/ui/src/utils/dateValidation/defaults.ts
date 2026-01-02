// packages/ui/src/utils/dateValidation/defaults.ts
// Default validation rules and species-specific biology constants

import type {
  SpeciesCode,
  SpeciesBiologyRules,
  SequenceValidationRules,
  BusinessValidationRules,
  DateValidationConfig,
} from "./types";

/**
 * Species-specific biology defaults for validation.
 * These can be overridden at the tenant level via Settings.
 */
export const SPECIES_BIOLOGY_DEFAULTS: Record<SpeciesCode, SpeciesBiologyRules> = {
  DOG: {
    // Gestation: typically 63 days, range 58-68
    gestationMinDays: 58,
    gestationTypicalDays: 63,
    gestationMaxDays: 68,

    // Breeding window: typically days 9-15 from cycle start (heat)
    cycleToBreedingMinDays: 9,
    cycleToBreedingMaxDays: 15,

    // Weaning: minimum 6 weeks, typical 7 weeks
    birthToWeaningMinDays: 42,
    birthToWeaningTypicalDays: 49,

    // Placement: minimum 8 weeks per most regulations
    birthToPlacementMinDays: 56,
    birthToPlacementTypicalDays: 63,

    // Female age: minimum 18-24 months recommended
    femaleMinBreedingAgeMonths: 18,
    femaleMaxBreedingAgeYears: 8,

    // Recovery: minimum 1 heat cycle skipped (roughly 6 months)
    postpartumRecoveryMinDays: 90,

    // Lifetime: responsible breeding limits
    maxLifetimeLitters: 6,
    minCyclesBetweenLitters: 1,
  },

  CAT: {
    // Gestation: typically 63-65 days, range 58-70
    gestationMinDays: 58,
    gestationTypicalDays: 63,
    gestationMaxDays: 70,

    // Breeding: cats are induced ovulators, shorter window
    cycleToBreedingMinDays: 2,
    cycleToBreedingMaxDays: 7,

    // Weaning: minimum 6 weeks, typical 8 weeks
    birthToWeaningMinDays: 42,
    birthToWeaningTypicalDays: 56,

    // Placement: minimum 8 weeks, many recommend 12 weeks
    birthToPlacementMinDays: 56,
    birthToPlacementTypicalDays: 84,

    // Female age
    femaleMinBreedingAgeMonths: 12,
    femaleMaxBreedingAgeYears: 8,

    // Recovery
    postpartumRecoveryMinDays: 60,

    // Lifetime limits
    maxLifetimeLitters: 5,
    minCyclesBetweenLitters: 1,
  },

  HORSE: {
    // Gestation: typically 340 days, range 320-370
    gestationMinDays: 320,
    gestationTypicalDays: 340,
    gestationMaxDays: 370,

    // Breeding: typically days 3-7 of estrus
    cycleToBreedingMinDays: 3,
    cycleToBreedingMaxDays: 7,

    // Weaning: typically 4-6 months
    birthToWeaningMinDays: 120,
    birthToWeaningTypicalDays: 180,

    // Placement: varies widely, often 6-12 months
    birthToPlacementMinDays: 180,
    birthToPlacementTypicalDays: 365,

    // Female age: minimum 3 years
    femaleMinBreedingAgeMonths: 36,
    femaleMaxBreedingAgeYears: 20,

    // Recovery: foal heat at ~9 days, but many skip it
    postpartumRecoveryMinDays: 30,

    // Lifetime: mares can produce many foals
    maxLifetimeLitters: 15,
    minCyclesBetweenLitters: 0,
  },

  GOAT: {
    // Gestation: typically 150 days, range 145-157
    gestationMinDays: 145,
    gestationTypicalDays: 150,
    gestationMaxDays: 157,

    // Breeding: short window
    cycleToBreedingMinDays: 1,
    cycleToBreedingMaxDays: 3,

    // Weaning: typically 8-12 weeks
    birthToWeaningMinDays: 56,
    birthToWeaningTypicalDays: 84,

    // Placement
    birthToPlacementMinDays: 56,
    birthToPlacementTypicalDays: 84,

    // Female age
    femaleMinBreedingAgeMonths: 8,
    femaleMaxBreedingAgeYears: 10,

    // Recovery
    postpartumRecoveryMinDays: 60,

    // Lifetime limits
    maxLifetimeLitters: 8,
    minCyclesBetweenLitters: 0,
  },

  RABBIT: {
    // Gestation: typically 31 days, range 28-35
    gestationMinDays: 28,
    gestationTypicalDays: 31,
    gestationMaxDays: 35,

    // Breeding: induced ovulators, can breed anytime receptive
    cycleToBreedingMinDays: 0,
    cycleToBreedingMaxDays: 1,

    // Weaning: typically 4-6 weeks
    birthToWeaningMinDays: 28,
    birthToWeaningTypicalDays: 42,

    // Placement: typically 8 weeks
    birthToPlacementMinDays: 56,
    birthToPlacementTypicalDays: 56,

    // Female age
    femaleMinBreedingAgeMonths: 6,
    femaleMaxBreedingAgeYears: 4,

    // Recovery: can breed very quickly but not recommended
    postpartumRecoveryMinDays: 14,

    // Lifetime limits
    maxLifetimeLitters: 6,
    minCyclesBetweenLitters: 0,
  },

  SHEEP: {
    // Gestation: typically 147 days, range 142-155
    gestationMinDays: 142,
    gestationTypicalDays: 147,
    gestationMaxDays: 155,

    // Breeding
    cycleToBreedingMinDays: 1,
    cycleToBreedingMaxDays: 3,

    // Weaning: typically 8-12 weeks
    birthToWeaningMinDays: 60,
    birthToWeaningTypicalDays: 90,

    // Placement
    birthToPlacementMinDays: 60,
    birthToPlacementTypicalDays: 90,

    // Female age
    femaleMinBreedingAgeMonths: 12,
    femaleMaxBreedingAgeYears: 10,

    // Recovery
    postpartumRecoveryMinDays: 60,

    // Lifetime limits
    maxLifetimeLitters: 8,
    minCyclesBetweenLitters: 0,
  },
};

/**
 * Default sequence validation rules.
 * Sequence validation is enabled by default to prevent impossible date orders.
 */
export const DEFAULT_SEQUENCE_RULES: SequenceValidationRules = {
  enforceSequenceOrder: true,
  requirePriorMilestone: false, // Warn but don't block
  allowFutureActuals: false,
};

/**
 * Default business/operational validation rules.
 */
export const DEFAULT_BUSINESS_RULES: BusinessValidationRules = {
  maxPlanDurationMonths: 24,
  maxFutureCycleStartMonths: 18,
  maxPastCycleStartMonths: 24,
  requireBreedingBeforeDeposits: false,
  warnOnMissingIntermediateActuals: true,
};

/**
 * Default validation configuration for new tenants.
 */
export const DEFAULT_VALIDATION_CONFIG: DateValidationConfig = {
  enableSequenceValidation: true,
  enableBiologyWarnings: true,
  enableBusinessWarnings: true,
  sequenceRules: DEFAULT_SEQUENCE_RULES,
  businessRules: DEFAULT_BUSINESS_RULES,
  speciesOverrides: {},
};

/**
 * Get biology rules for a species, with optional tenant overrides applied.
 */
export function getSpeciesBiologyRules(
  species: SpeciesCode,
  tenantOverrides?: Partial<Record<SpeciesCode, Partial<SpeciesBiologyRules>>>
): SpeciesBiologyRules {
  // Start with defaults, fallback to DOG if species not found
  const defaults = SPECIES_BIOLOGY_DEFAULTS[species] ?? SPECIES_BIOLOGY_DEFAULTS.DOG;

  // Apply tenant overrides if present
  const overrides = tenantOverrides?.[species];
  if (!overrides) {
    return defaults;
  }

  return {
    ...defaults,
    ...overrides,
  };
}

/**
 * Get the full validation config with defaults merged.
 */
export function getValidationConfig(
  tenantConfig?: Partial<DateValidationConfig>
): DateValidationConfig {
  if (!tenantConfig) {
    return DEFAULT_VALIDATION_CONFIG;
  }

  return {
    enableSequenceValidation:
      tenantConfig.enableSequenceValidation ?? DEFAULT_VALIDATION_CONFIG.enableSequenceValidation,
    enableBiologyWarnings:
      tenantConfig.enableBiologyWarnings ?? DEFAULT_VALIDATION_CONFIG.enableBiologyWarnings,
    enableBusinessWarnings:
      tenantConfig.enableBusinessWarnings ?? DEFAULT_VALIDATION_CONFIG.enableBusinessWarnings,
    sequenceRules: {
      ...DEFAULT_SEQUENCE_RULES,
      ...tenantConfig.sequenceRules,
    },
    businessRules: {
      ...DEFAULT_BUSINESS_RULES,
      ...tenantConfig.businessRules,
    },
    speciesOverrides: tenantConfig.speciesOverrides ?? {},
  };
}

/**
 * Human-readable labels for milestone keys.
 */
export const MILESTONE_LABELS: Record<string, string> = {
  cycleStart: "Cycle Start",
  hormoneTesting: "Hormone Testing",
  breeding: "Breeding",
  birth: "Birth",
  weaning: "Weaning",
  placementStart: "Placement Start",
  placementCompleted: "Placement Completed",
  planCompleted: "Plan Completed",
};

/**
 * Get a human-readable label for a milestone key.
 */
export function getMilestoneLabel(key: string): string {
  return MILESTONE_LABELS[key] ?? key;
}
