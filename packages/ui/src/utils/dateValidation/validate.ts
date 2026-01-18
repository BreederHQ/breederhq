// packages/ui/src/utils/dateValidation/validate.ts
// Core validation functions for breeding plan dates

import type {
  MilestoneKey,
  ValidationContext,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PlanActualDates,
  SpeciesBiologyRules,
} from "./types";
import { MILESTONE_SEQUENCE } from "./types";
import { getSpeciesBiologyRules, getMilestoneLabel } from "./defaults";

// ============================================================================
// Date Utilities
// ============================================================================

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(earlier: Date, later: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / DAY_MS);
}

function monthsBetween(earlier: Date, later: Date): number {
  return (
    (later.getFullYear() - earlier.getFullYear()) * 12 +
    (later.getMonth() - earlier.getMonth())
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================================
// Milestone Mapping
// ============================================================================

/**
 * Map milestone keys to their corresponding actual date field names.
 */
const MILESTONE_TO_ACTUAL_FIELD: Record<MilestoneKey, keyof PlanActualDates> = {
  cycleStart: "cycleStartActual",
  hormoneTesting: "hormoneTestingActual",
  breeding: "breedingActual",
  birth: "birthActual",
  weaning: "weaningActual",
  placementStart: "placementStartActual",
  placementCompleted: "placementCompletedActual",
  planCompleted: "planCompletedActual",
};

/**
 * Get the actual date for a milestone from plan data.
 */
function getActualDate(
  milestone: MilestoneKey,
  actuals: PlanActualDates
): string | null | undefined {
  const field = MILESTONE_TO_ACTUAL_FIELD[milestone];
  return actuals[field];
}

// ============================================================================
// Sequence Validation (Hard Blocks)
// ============================================================================

/**
 * Validate that milestone dates follow the correct sequence.
 * Returns errors for any date that precedes a date that should come before it.
 */
function validateSequence(
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationError[] {
  if (!ctx.config.enableSequenceValidation) return [];
  if (!ctx.config.sequenceRules.enforceSequenceOrder) return [];

  const errors: ValidationError[] = [];
  const dates: Array<{ milestone: MilestoneKey; date: Date }> = [];

  // Collect all actual dates that exist
  for (const milestone of MILESTONE_SEQUENCE) {
    const value = getActualDate(milestone, actuals);
    const date = parseDate(value);
    if (date) {
      dates.push({ milestone, date });
    }
  }

  // Check each pair in sequence order
  for (let i = 1; i < dates.length; i++) {
    const prev = dates[i - 1];
    const curr = dates[i];

    // Find sequence indices
    const prevIdx = MILESTONE_SEQUENCE.indexOf(prev.milestone);
    const currIdx = MILESTONE_SEQUENCE.indexOf(curr.milestone);

    // If current milestone should come after previous but date is earlier
    if (currIdx > prevIdx && curr.date < prev.date) {
      errors.push({
        field: curr.milestone,
        code: "SEQUENCE_VIOLATION",
        message: `${getMilestoneLabel(curr.milestone)} (${formatDate(curr.date)}) cannot be before ${getMilestoneLabel(prev.milestone)} (${formatDate(prev.date)})`,
        expected: `After ${formatDate(prev.date)}`,
        actual: formatDate(curr.date),
      });
    }
  }

  return errors;
}

/**
 * Validate that prior milestones exist when entering later ones.
 */
function validatePriorMilestones(
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationError[] {
  if (!ctx.config.enableSequenceValidation) return [];
  if (!ctx.config.sequenceRules.requirePriorMilestone) return [];

  const errors: ValidationError[] = [];

  // Check each milestone that has a value
  for (let i = 1; i < MILESTONE_SEQUENCE.length; i++) {
    const milestone = MILESTONE_SEQUENCE[i];
    const value = getActualDate(milestone, actuals);

    if (value) {
      // Check that the immediately prior milestone exists
      const priorMilestone = MILESTONE_SEQUENCE[i - 1];
      const priorValue = getActualDate(priorMilestone, actuals);

      if (!priorValue) {
        errors.push({
          field: milestone,
          code: "MISSING_REQUIRED_PRIOR",
          message: `Cannot enter ${getMilestoneLabel(milestone)} without ${getMilestoneLabel(priorMilestone)}`,
          expected: `${getMilestoneLabel(priorMilestone)} date required first`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate that actual dates are not in the future.
 */
function validateNotFuture(
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableSequenceValidation) return [];
  if (ctx.config.sequenceRules.allowFutureActuals) return [];

  const warnings: ValidationWarning[] = [];
  const today = parseDate(ctx.today ?? todayIso())!;

  for (const milestone of MILESTONE_SEQUENCE) {
    const value = getActualDate(milestone, actuals);
    const date = parseDate(value);

    if (date && date > today) {
      warnings.push({
        field: milestone,
        code: "ACTUAL_IN_FUTURE",
        message: `${getMilestoneLabel(milestone)} is in the future. Did you mean to enter an Expected date?`,
        severity: "caution",
        canOverride: true,
        details: {
          actual: formatDate(date),
          expected: `On or before ${formatDate(today)}`,
        },
      });
    }
  }

  return warnings;
}

// ============================================================================
// Biology Validation (Soft Warnings)
// ============================================================================

/**
 * Validate gestation period (breeding to birth).
 */
function validateGestation(
  actuals: PlanActualDates,
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];

  const warnings: ValidationWarning[] = [];
  const breedDate = parseDate(actuals.breedingActual);
  const birthDate = parseDate(actuals.birthActual);

  if (breedDate && birthDate) {
    const days = daysBetween(breedDate, birthDate);

    if (days < rules.gestationMinDays) {
      warnings.push({
        field: "birth",
        code: "GESTATION_TOO_SHORT",
        message: `Gestation of ${days} days is shorter than minimum of ${rules.gestationMinDays} days for this species`,
        severity: "serious",
        canOverride: true,
        details: {
          actual: `${days} days`,
          expected: `${rules.gestationMinDays}-${rules.gestationMaxDays} days`,
          speciesDefault: rules.gestationTypicalDays,
        },
      });
    } else if (days > rules.gestationMaxDays) {
      warnings.push({
        field: "birth",
        code: "GESTATION_TOO_LONG",
        message: `Gestation of ${days} days exceeds maximum of ${rules.gestationMaxDays} days for this species`,
        severity: "serious",
        canOverride: true,
        details: {
          actual: `${days} days`,
          expected: `${rules.gestationMinDays}-${rules.gestationMaxDays} days`,
          speciesDefault: rules.gestationTypicalDays,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate breeding timing from cycle start.
 */
function validateBreedingTiming(
  actuals: PlanActualDates,
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];

  const warnings: ValidationWarning[] = [];
  const cycleDate = parseDate(actuals.cycleStartActual);
  const breedDate = parseDate(actuals.breedingActual);

  if (cycleDate && breedDate) {
    const days = daysBetween(cycleDate, breedDate);

    if (days < rules.cycleToBreedingMinDays) {
      warnings.push({
        field: "breeding",
        code: "BREEDING_TOO_EARLY",
        message: `Breeding at ${days} days from cycle start is earlier than typical minimum of ${rules.cycleToBreedingMinDays} days`,
        severity: "caution",
        canOverride: true,
        details: {
          actual: `${days} days from cycle`,
          expected: `${rules.cycleToBreedingMinDays}-${rules.cycleToBreedingMaxDays} days`,
        },
      });
    } else if (days > rules.cycleToBreedingMaxDays) {
      warnings.push({
        field: "breeding",
        code: "BREEDING_TOO_LATE",
        message: `Breeding at ${days} days from cycle start is later than typical maximum of ${rules.cycleToBreedingMaxDays} days`,
        severity: "caution",
        canOverride: true,
        details: {
          actual: `${days} days from cycle`,
          expected: `${rules.cycleToBreedingMinDays}-${rules.cycleToBreedingMaxDays} days`,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate weaning timing from birth.
 */
function validateWeaningTiming(
  actuals: PlanActualDates,
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];

  const warnings: ValidationWarning[] = [];
  const birthDate = parseDate(actuals.birthActual);
  const weanDate = parseDate(actuals.weaningActual);

  if (birthDate && weanDate) {
    const days = daysBetween(birthDate, weanDate);

    if (days < rules.birthToWeaningMinDays) {
      warnings.push({
        field: "weaning",
        code: "WEANING_TOO_EARLY",
        message: `Weaning at ${days} days (${Math.round(days / 7)} weeks) is earlier than recommended minimum of ${rules.birthToWeaningMinDays} days (${Math.round(rules.birthToWeaningMinDays / 7)} weeks)`,
        severity: "serious",
        canOverride: true,
        details: {
          actual: `${days} days (${Math.round(days / 7)} weeks)`,
          expected: `Minimum ${rules.birthToWeaningMinDays} days (${Math.round(rules.birthToWeaningMinDays / 7)} weeks)`,
          speciesDefault: rules.birthToWeaningTypicalDays,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate placement timing from birth.
 */
function validatePlacementTiming(
  actuals: PlanActualDates,
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];

  const warnings: ValidationWarning[] = [];
  const birthDate = parseDate(actuals.birthActual);
  const placementDate = parseDate(actuals.placementStartActual);

  if (birthDate && placementDate) {
    const days = daysBetween(birthDate, placementDate);

    if (days < rules.birthToPlacementMinDays) {
      warnings.push({
        field: "placementStart",
        code: "PLACEMENT_TOO_EARLY",
        message: `Placement at ${days} days (${Math.round(days / 7)} weeks) is earlier than minimum of ${rules.birthToPlacementMinDays} days (${Math.round(rules.birthToPlacementMinDays / 7)} weeks)`,
        severity: "serious",
        canOverride: true,
        details: {
          actual: `${days} days (${Math.round(days / 7)} weeks)`,
          expected: `Minimum ${rules.birthToPlacementMinDays} days (${Math.round(rules.birthToPlacementMinDays / 7)} weeks)`,
          speciesDefault: rules.birthToPlacementTypicalDays,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate placement does not exceed maximum allowed age (e.g., rabbits must be placed by 10 weeks).
 */
function validatePlacementMaxTiming(
  actuals: PlanActualDates,
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];
  // Only check if species has a max placement age defined
  if (!rules.birthToPlacementMaxDays) return [];

  const warnings: ValidationWarning[] = [];
  const birthDate = parseDate(actuals.birthActual);
  const placementDate = parseDate(actuals.placementStartActual);

  if (birthDate && placementDate) {
    const days = daysBetween(birthDate, placementDate);

    if (days > rules.birthToPlacementMaxDays) {
      const weeks = Math.round(rules.birthToPlacementMaxDays / 7);
      warnings.push({
        field: "placementStart",
        code: "PLACEMENT_TOO_LATE",
        message: `Placement at ${days} days (${Math.round(days / 7)} weeks) exceeds maximum of ${rules.birthToPlacementMaxDays} days (${weeks} weeks) - must place before ${weeks} weeks to prevent fighting/aggression`,
        severity: "serious",
        canOverride: true,
        details: {
          actual: `${days} days (${Math.round(days / 7)} weeks)`,
          expected: `Maximum ${rules.birthToPlacementMaxDays} days (${weeks} weeks)`,
          speciesDefault: rules.birthToPlacementTypicalDays,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate female age at breeding.
 */
function validateFemaleAge(
  actuals: PlanActualDates,
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];
  if (!ctx.femaleDob) return [];

  const warnings: ValidationWarning[] = [];
  const dob = parseDate(ctx.femaleDob);
  const breedDate = parseDate(actuals.breedingActual ?? actuals.cycleStartActual);

  if (dob && breedDate) {
    const ageMonths = monthsBetween(dob, breedDate);
    const ageYears = ageMonths / 12;

    if (ageMonths < rules.femaleMinBreedingAgeMonths) {
      warnings.push({
        field: "breeding",
        code: "FEMALE_TOO_YOUNG",
        message: `Female is ${ageMonths} months old at breeding. Minimum recommended age is ${rules.femaleMinBreedingAgeMonths} months`,
        severity: "serious",
        canOverride: true,
        details: {
          actual: `${ageMonths} months`,
          expected: `Minimum ${rules.femaleMinBreedingAgeMonths} months`,
        },
      });
    } else if (ageYears > rules.femaleMaxBreedingAgeYears) {
      warnings.push({
        field: "breeding",
        code: "FEMALE_TOO_OLD",
        message: `Female is ${ageYears.toFixed(1)} years old. Consider retirement after ${rules.femaleMaxBreedingAgeYears} years`,
        severity: "caution",
        canOverride: true,
        details: {
          actual: `${ageYears.toFixed(1)} years`,
          expected: `Retirement recommended after ${rules.femaleMaxBreedingAgeYears} years`,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate postpartum recovery period.
 */
function validatePostpartumRecovery(
  actuals: PlanActualDates,
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];
  if (!ctx.femaleLastBirthDate) return [];

  const warnings: ValidationWarning[] = [];
  const lastBirth = parseDate(ctx.femaleLastBirthDate);
  const newCycle = parseDate(actuals.cycleStartActual);

  if (lastBirth && newCycle) {
    const days = daysBetween(lastBirth, newCycle);

    if (days < rules.postpartumRecoveryMinDays) {
      warnings.push({
        field: "cycleStart",
        code: "POSTPARTUM_TOO_SOON",
        message: `New cycle is ${days} days after previous birth. Minimum recovery period is ${rules.postpartumRecoveryMinDays} days`,
        severity: "serious",
        canOverride: true,
        details: {
          actual: `${days} days since last birth`,
          expected: `Minimum ${rules.postpartumRecoveryMinDays} days recovery`,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate lifetime litter count.
 */
function validateLitterCount(
  rules: SpeciesBiologyRules,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBiologyWarnings) return [];
  if (ctx.femaleLitterCount === undefined) return [];

  const warnings: ValidationWarning[] = [];

  if (ctx.femaleLitterCount >= rules.maxLifetimeLitters) {
    warnings.push({
      field: "cycleStart",
      code: "EXCEEDS_LITTER_LIMIT",
      message: `Female has had ${ctx.femaleLitterCount} litters. Recommended maximum is ${rules.maxLifetimeLitters}`,
      severity: "serious",
      canOverride: true,
      details: {
        actual: `${ctx.femaleLitterCount} litters`,
        expected: `Maximum ${rules.maxLifetimeLitters} litters`,
      },
    });
  }

  return warnings;
}

// ============================================================================
// Business Validation (Soft Warnings)
// ============================================================================

/**
 * Validate plan duration.
 */
function validatePlanDuration(
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBusinessWarnings) return [];

  const warnings: ValidationWarning[] = [];
  const cycleDate = parseDate(actuals.cycleStartActual);
  const completedDate = parseDate(actuals.planCompletedActual ?? actuals.placementCompletedActual);

  if (cycleDate && completedDate) {
    const months = monthsBetween(cycleDate, completedDate);

    if (months > ctx.config.businessRules.maxPlanDurationMonths) {
      warnings.push({
        field: "planCompleted",
        code: "PLAN_TOO_LONG",
        message: `Plan duration of ${months} months exceeds typical maximum of ${ctx.config.businessRules.maxPlanDurationMonths} months`,
        severity: "info",
        canOverride: true,
        details: {
          actual: `${months} months`,
          expected: `Maximum ${ctx.config.businessRules.maxPlanDurationMonths} months`,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate cycle start date is within reasonable range.
 */
function validateCycleStartRange(
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBusinessWarnings) return [];

  const warnings: ValidationWarning[] = [];
  const cycleDate = parseDate(actuals.cycleStartActual);
  const today = parseDate(ctx.today ?? todayIso())!;

  if (cycleDate) {
    const months = monthsBetween(today, cycleDate);

    if (months > ctx.config.businessRules.maxFutureCycleStartMonths) {
      warnings.push({
        field: "cycleStart",
        code: "CYCLE_TOO_FAR_FUTURE",
        message: `Cycle start is ${months} months in the future. Are you sure?`,
        severity: "info",
        canOverride: true,
        details: {
          actual: `${months} months ahead`,
          expected: `Within ${ctx.config.businessRules.maxFutureCycleStartMonths} months`,
        },
      });
    } else if (months < -ctx.config.businessRules.maxPastCycleStartMonths) {
      warnings.push({
        field: "cycleStart",
        code: "CYCLE_TOO_FAR_PAST",
        message: `Cycle start is ${Math.abs(months)} months in the past. Are you sure?`,
        severity: "info",
        canOverride: true,
        details: {
          actual: `${Math.abs(months)} months ago`,
          expected: `Within ${ctx.config.businessRules.maxPastCycleStartMonths} months`,
        },
      });
    }
  }

  return warnings;
}

/**
 * Validate that intermediate milestones aren't skipped.
 */
function validateIntermediateMilestones(
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationWarning[] {
  if (!ctx.config.enableBusinessWarnings) return [];
  if (!ctx.config.businessRules.warnOnMissingIntermediateActuals) return [];

  const warnings: ValidationWarning[] = [];

  // Find the first and last milestones with dates
  let firstIdx = -1;
  let lastIdx = -1;

  for (let i = 0; i < MILESTONE_SEQUENCE.length; i++) {
    const value = getActualDate(MILESTONE_SEQUENCE[i], actuals);
    if (value) {
      if (firstIdx === -1) firstIdx = i;
      lastIdx = i;
    }
  }

  // Check for gaps between first and last
  if (firstIdx !== -1 && lastIdx > firstIdx) {
    for (let i = firstIdx + 1; i < lastIdx; i++) {
      const milestone = MILESTONE_SEQUENCE[i];
      const value = getActualDate(milestone, actuals);

      if (!value) {
        warnings.push({
          field: milestone,
          code: "MISSING_INTERMEDIATE_ACTUAL",
          message: `${getMilestoneLabel(milestone)} is missing between ${getMilestoneLabel(MILESTONE_SEQUENCE[firstIdx])} and ${getMilestoneLabel(MILESTONE_SEQUENCE[lastIdx])}`,
          severity: "info",
          canOverride: true,
        });
      }
    }
  }

  return warnings;
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate all dates for a breeding plan.
 *
 * @param actuals - The actual dates from the plan
 * @param ctx - Validation context including species, config, and female info
 * @returns ValidationResult with errors and warnings
 */
export function validateBreedingDates(
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Get species-specific biology rules with tenant overrides
  const bioRules = getSpeciesBiologyRules(ctx.species, ctx.config.speciesOverrides);

  // Sequence validation (hard blocks)
  errors.push(...validateSequence(actuals, ctx));
  errors.push(...validatePriorMilestones(actuals, ctx));

  // Future date warnings
  warnings.push(...validateNotFuture(actuals, ctx));

  // Biology validation (soft warnings)
  warnings.push(...validateGestation(actuals, bioRules, ctx));
  warnings.push(...validateBreedingTiming(actuals, bioRules, ctx));
  warnings.push(...validateWeaningTiming(actuals, bioRules, ctx));
  warnings.push(...validatePlacementTiming(actuals, bioRules, ctx));
  warnings.push(...validatePlacementMaxTiming(actuals, bioRules, ctx));
  warnings.push(...validateFemaleAge(actuals, bioRules, ctx));
  warnings.push(...validatePostpartumRecovery(actuals, bioRules, ctx));
  warnings.push(...validateLitterCount(bioRules, ctx));

  // Business validation (soft warnings)
  warnings.push(...validatePlanDuration(actuals, ctx));
  warnings.push(...validateCycleStartRange(actuals, ctx));
  warnings.push(...validateIntermediateMilestones(actuals, ctx));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single date field change.
 * Useful for inline validation as user types.
 *
 * @param field - The milestone being changed
 * @param value - The new value
 * @param actuals - All current actual dates
 * @param ctx - Validation context
 * @returns ValidationResult for just this field
 */
export function validateSingleDate(
  field: MilestoneKey,
  value: string | null,
  actuals: PlanActualDates,
  ctx: ValidationContext
): ValidationResult {
  // Create a copy with the new value
  const updatedActuals = {
    ...actuals,
    [MILESTONE_TO_ACTUAL_FIELD[field]]: value,
  };

  // Run full validation
  const result = validateBreedingDates(updatedActuals, ctx);

  // Filter to only errors/warnings for this field
  return {
    valid: result.errors.filter((e) => e.field === field).length === 0,
    errors: result.errors.filter((e) => e.field === field),
    warnings: result.warnings.filter((w) => w.field === field),
  };
}
