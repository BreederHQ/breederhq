// packages/ui/src/hooks/useCyclePlanner.ts
import * as React from "react";
import { SPECIES_DEFAULTS, computeCycleSummary, type BioSpecies, type ISODate } from "../utils/repro";
import {
  BIO,
  type Species as BioSpeciesCode,
  type ProgramDefaultsLike,
  fromPlan,
  expectedMilestonesFromLocked,
  computeWindows,
} from "../utils/breedingMath";


export type Species = "Dog" | "Cat" | "Horse";

export type CycleDefaults = {
  cycle_len_days: number;
  start_buffer_days: number;
  ovulation_day_from_heat_start: number;
};

export type ReproEvent = { kind: "heat_start" | "ovulation" | "insemination" | "whelp"; date: ISODate; note?: string };

/** Window keys remain unchanged to preserve stage keys */
export type ExpectedWindows = {
  pre_breeding_full: [ISODate, ISODate];
  hormone_testing_full: [ISODate, ISODate];
  breeding_full: [ISODate, ISODate];
  birth_full: [ISODate, ISODate];
  post_birth_care_full: [ISODate, ISODate];
  placement_normal_full: [ISODate, ISODate];
  placement_extended_full: [ISODate, ISODate];
  pre_breeding_likely: [ISODate, ISODate];
  hormone_testing_likely: [ISODate, ISODate];
  breeding_likely: [ISODate, ISODate];
  birth_likely: [ISODate, ISODate];
  post_birth_care_likely: [ISODate, ISODate];
  placement_normal_likely: [ISODate, ISODate];
};

/** Returned milestone keys include new placement names and legacy aliases */
export type ExpectedDates = {
  cycle_start: ISODate;
  ovulation: ISODate;
  breed_expected: ISODate;
  birth_expected: ISODate;
  /** Canonical standardized key that already existed in your draft */
  weaning_expected: ISODate;

  /** NEW canonical names */
  placement_start_expected: ISODate;
  placement_completed_expected: ISODate;

  /** Legacy aliases kept for back-compat */
  placement_expected: ISODate;
  placement_extended_end_expected: ISODate;

  last_offspring_placement_expected: ISODate;
  windows: ExpectedWindows;
};

// ────────── small date helpers ──────────
const toISO = (input: Date | ISODate): ISODate => {
  const d = input instanceof Date ? input : parseISODate(input);

  if (!Number.isFinite(d.getTime())) {
    return "" as ISODate;
  }
  return d.toISOString().slice(0, 10) as ISODate;
};

function parseISODate(iso: ISODate): Date {
  const d = new Date(iso as any);
  if (!Number.isFinite(d.getTime())) {
    return new Date(NaN);
  }
  // strip time to force date only
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDaysISO(iso: ISODate, days: number): ISODate {
  const base = parseISODate(iso);
  if (!Number.isFinite(base.getTime())) {
    // propagate the original, do not crash the planner
    return iso;
  }
  base.setDate(base.getDate() + days);
  return toISO(base);
}

// ────────── species mapping & defaults ──────────
function uiToBio(species: Species): BioSpecies {
  switch (species) { case "Dog": return "DOG"; case "Cat": return "CAT"; case "Horse": return "HORSE"; default: return "OTHER"; }
}

export function pickDefaults(species: Species): CycleDefaults {
  const key = uiToBio(species);
  const cycle_len_days = SPECIES_DEFAULTS[key] ?? SPECIES_DEFAULTS.OTHER;
  return species === "Dog"
    ? { cycle_len_days, start_buffer_days: BIO.startBufferDays, ovulation_day_from_heat_start: BIO.ovulationOffsetDays }
    : species === "Cat"
      ? { cycle_len_days, start_buffer_days: 7, ovulation_day_from_heat_start: 3 }
      : species === "Horse"
        ? { cycle_len_days, start_buffer_days: 7, ovulation_day_from_heat_start: 5 }
        : { cycle_len_days, start_buffer_days: BIO.startBufferDays, ovulation_day_from_heat_start: BIO.ovulationOffsetDays };
}

// ────────── learned cycle length (avg of last 3 intervals) ──────────
export function femaleCycleAvgLen(heatStartsAsc: ISODate[]): number | null {
  if (!Array.isArray(heatStartsAsc) || heatStartsAsc.length < 3) return null;

  // Collapse identical heat_start dates so we do not see 0-day intervals
  const unique = Array.from(new Set(heatStartsAsc)).sort();
  if (unique.length < 3) return null;

  const s = computeCycleSummary(unique, {
    lastN: 3,
    species: "OTHER",
    rounding: "nearest",
  });

  const base = s.avgLastN ?? s.avgAll ?? null;

  // If we somehow get 0 or 1, treat it as invalid so callers fall back to overrides/defaults
  if (base == null || base <= 1) return null;

  return base;
}

// ────────── project cycles with precedence: learned → per-female override → baseline ──────────
export function projectUpcomingCycles(opts: {
  species: Species;
  lastActualHeatStart?: ISODate | null;
  allActualHeatStartsAsc?: ISODate[];
  count?: number;
  femaleCycleLenOverrideDays?: number | null;
}): ISODate[] {
  const {
    species,
    lastActualHeatStart,
    allActualHeatStartsAsc = [],
    count = 8,
    femaleCycleLenOverrideDays,
  } = opts;

  const d = pickDefaults(species);

  // Normalize and dedupe breeder recorded cycle starts
  const heatAsc = Array.from(
    new Set(
      (allActualHeatStartsAsc ?? [])
        .filter(Boolean)
        .map((iso) => toISO(iso)) // force ISO date only
    )
  ).sort();

  const learned = femaleCycleAvgLen(heatAsc);

  const overrideLen =
    Number.isFinite(femaleCycleLenOverrideDays ?? NaN) && (femaleCycleLenOverrideDays as number) > 0
      ? Math.round(femaleCycleLenOverrideDays as number)
      : null;

  const effectiveLen =
    (learned && learned > 0 ? learned : null) ??
    overrideLen ??
    d.cycle_len_days;

  // Seed precedence:
  // 1) last breeder recorded cycle start from history
  // 2) explicit lastActualHeatStart param
  // 3) synthetic seed = today + start_buffer_days
  const seed: ISODate =
    (heatAsc.length ? (heatAsc[heatAsc.length - 1] as ISODate) : null) ??
    (lastActualHeatStart as ISODate | null) ??
    toISO(new Date(new Date().setDate(new Date().getDate() + d.start_buffer_days)));

  const out: ISODate[] = [];
  let cur = seed;

  for (let i = 1; i <= count; i++) {
    cur = addDaysISO(cur, effectiveLen);
    out.push(cur);
  }

  return out;
}

// ────────── expected windows + dates; placement start weeks precedence ──────────
export function computeExpectedFromCycle(opts: {
  species: Species;
  cycleStart: ISODate;
  homingStartWeeksOverride?: number | null;
  homingStartWeeksDefault?: number | null;
}): ExpectedDates {
  const { species, cycleStart, homingStartWeeksOverride, homingStartWeeksDefault } = opts;

  const cycleDate = parseISODate(cycleStart);
  if (!Number.isFinite(cycleDate.getTime())) {
    // Defensive guard, return a shell instead of crashing
    const empty: ExpectedWindows = {
      pre_breeding_full: [cycleStart, cycleStart],
      hormone_testing_full: [cycleStart, cycleStart],
      breeding_full: [cycleStart, cycleStart],
      birth_full: [cycleStart, cycleStart],
      post_birth_care_full: [cycleStart, cycleStart],
      placement_normal_full: [cycleStart, cycleStart],
      placement_extended_full: [cycleStart, cycleStart],
      pre_breeding_likely: [cycleStart, cycleStart],
      hormone_testing_likely: [cycleStart, cycleStart],
      breeding_likely: [cycleStart, cycleStart],
      birth_likely: [cycleStart, cycleStart],
      post_birth_care_likely: [cycleStart, cycleStart],
      placement_normal_likely: [cycleStart, cycleStart],
    };
    return {
      cycle_start: cycleStart,
      ovulation: cycleStart,
      breed_expected: cycleStart,
      birth_expected: cycleStart,
      weaning_expected: cycleStart,
      placement_start_expected: cycleStart,
      placement_completed_expected: cycleStart,
      placement_expected: cycleStart,
      placement_extended_end_expected: cycleStart,
      last_offspring_placement_expected: cycleStart,
      windows: empty,
    };
  }

  // Map UI species ("Dog" | "Cat" | "Horse") to biology species code ("DOG" | "CAT" | "HORSE")
  const speciesCode = species.toUpperCase() as any;

  // Normalize homing weeks into program defaults for the biology layer
  let placementWeeks: number | null = null;
  if (typeof homingStartWeeksOverride === "number" && homingStartWeeksOverride > 0) {
    placementWeeks = Math.round(homingStartWeeksOverride);
  } else if (typeof homingStartWeeksDefault === "number" && homingStartWeeksDefault > 0) {
    placementWeeks = Math.round(homingStartWeeksDefault);
  }

  const programDefaults =
    placementWeeks != null
      ? { placement_start_from_birth_weeks: placementWeeks }
      : undefined;

  // Canonical milestones from biology
  const milestones = expectedMilestonesFromLocked(
    cycleDate,
    speciesCode,
    programDefaults
  );

  // Canonical windows from biology
  const windowsResult = computeWindows({
    species: speciesCode,
    heat: {
      earliestHeatStart: cycleDate,
      latestHeatStart: cycleDate,
    },
  });

  type StageWindowPair = {
    full: { start: Date; end: Date };
    likely: { start: Date; end: Date };
  };

  const getStage = (key: string): StageWindowPair => {
    const found = windowsResult.stages.find((s: any) => s.key === key);
    if (!found) {
      throw new Error(`computeExpectedFromCycle: missing stage ${key}`);
    }

    return {
      full: (found as any).full,
      likely: (found as any).likely,
    } as StageWindowPair;
  };

  const preBreeding = getStage("preBreeding");
  const hormoneTesting = getStage("hormoneTesting");
  const breeding = getStage("breeding");
  const birth = getStage("birth");
  const postBirthCare = getStage("postBirthCare");
  const placementNormal = getStage("PlacementNormal");
  const placementExtended = getStage("PlacementExtended");

  const windows: ExpectedWindows = {
    pre_breeding_full: [toISO(preBreeding.full.start), toISO(preBreeding.full.end)],
    hormone_testing_full: [toISO(hormoneTesting.full.start), toISO(hormoneTesting.full.end)],
    breeding_full: [toISO(breeding.full.start), toISO(breeding.full.end)],
    birth_full: [toISO(birth.full.start), toISO(birth.full.end)],
    post_birth_care_full: [toISO(postBirthCare.full.start), toISO(postBirthCare.full.end)],
    placement_normal_full: [toISO(placementNormal.full.start), toISO(placementNormal.full.end)],
    placement_extended_full: [toISO(placementExtended.full.start), toISO(placementExtended.full.end)],

    pre_breeding_likely: [toISO(preBreeding.likely.start), toISO(preBreeding.likely.end)],
    hormone_testing_likely: [toISO(hormoneTesting.likely.start), toISO(hormoneTesting.likely.end)],
    breeding_likely: [toISO(breeding.likely.start), toISO(breeding.likely.end)],
    birth_likely: [toISO(birth.likely.start), toISO(birth.likely.end)],
    post_birth_care_likely: [toISO(postBirthCare.likely.start), toISO(postBirthCare.likely.end)],
    placement_normal_likely: [toISO(placementNormal.likely.start), toISO(placementNormal.likely.end)],
  };

  const weaningExpected = milestones.weaned_expected as ISODate;
  const placementStartExpected = milestones.placement_start_expected as ISODate;
  const placementCompletedExpected =
    milestones.placement_completed_expected as ISODate | null;

  const placementExpectedAlias = milestones.Placement_expected as ISODate;
  const placementExtendedAlias =
    milestones.Placement_extended_end_expected as ISODate | null;

  return {
    cycle_start: cycleStart,
    ovulation: milestones.ovulation as ISODate,
    breed_expected: milestones.breeding_expected as ISODate,
    birth_expected: milestones.birth_expected as ISODate,
    weaning_expected: weaningExpected,
    placement_start_expected: placementStartExpected,
    placement_completed_expected: placementCompletedExpected ?? placementStartExpected,
    placement_expected: placementExpectedAlias,
    placement_extended_end_expected:
      placementExtendedAlias ?? placementCompletedExpected ?? placementStartExpected,
    last_offspring_placement_expected:
      placementCompletedExpected ?? placementExtendedAlias ?? placementStartExpected,
    windows,
  };
}

// ────────── The hook (unchanged API, now returns placement fields via compute) ──────────
export function useCyclePlanner(params: {
  species: Species;
  reproAsc?: ReproEvent[];
  lastActualHeatStart?: ISODate | null;
  futureCount?: number;

  // optional explicit seed when breeder manually schedules next heat
  manualProjectedNextHeatStart?: ISODate | null;

  femaleCycleLenOverrideDays?: number | null;
  homingStartWeeksDefault?: number | null;
  homingStartWeeksOverride?: number | null;
}) {

  const {
    species,
    reproAsc = [],
    lastActualHeatStart,
    futureCount = 12,
    manualProjectedNextHeatStart,
    femaleCycleLenOverrideDays,
    homingStartWeeksDefault,
    homingStartWeeksOverride,
  } = params;

  const heatAsc = React.useMemo(
    () => reproAsc.filter(e => e.kind === "heat_start" && e.date).map(e => e.date).sort(),
    [reproAsc]
  );

  const defaults = React.useMemo(() => pickDefaults(species), [species]);
  const avgLen = React.useMemo(() => femaleCycleAvgLen(heatAsc), [heatAsc]);

  const hasHistory = heatAsc.length > 0 || !!lastActualHeatStart;
  const hasManualSeed = !!manualProjectedNextHeatStart;

  type CycleState = "no_data" | "manual" | "tracked";
  const cycleState: CycleState = hasHistory
    ? "tracked"
    : hasManualSeed
      ? "manual"
      : "no_data";


  const effectiveCycleLen =
    (avgLen ?? null) ??
    (Number.isFinite(femaleCycleLenOverrideDays || NaN) ? Math.round(femaleCycleLenOverrideDays!) : null) ??
    defaults.cycle_len_days;

  const projectedCycles = React.useMemo(() => {
    // No history, no manual seed: do not invent cycles
    if (cycleState === "no_data") return [];

    // For tracked cycles, prefer lastActualHeatStart if provided,
    // otherwise fall back to the last heat_start entry
    const trackedSeed: ISODate | null =
      lastActualHeatStart ?? (heatAsc.length ? heatAsc[heatAsc.length - 1] : null);

    const manualSeed: ISODate | null = manualProjectedNextHeatStart ?? null;

    const seed: ISODate | null =
      cycleState === "tracked" ? trackedSeed : manualSeed;

    if (!seed) return [];

    const out: ISODate[] = [];
    let cur = seed;
    const count = futureCount;
    for (let i = 1; i <= count; i++) {
      cur = addDaysISO(cur, effectiveCycleLen);
      out.push(cur);
    }
    return out;
  }, [
    cycleState,
    heatAsc,
    lastActualHeatStart,
    manualProjectedNextHeatStart,
    effectiveCycleLen,
    futureCount,
  ]);

  const computeFromLocked = React.useCallback(
    (cycleStart: ISODate) => {
      return computeExpectedFromCycle({
        species,
        cycleStart,
        homingStartWeeksOverride,
        homingStartWeeksDefault,
      });
    },
    [species, homingStartWeeksDefault, homingStartWeeksOverride]
  );

  return {
    defaults,
    averageCycleLen: avgLen,
    effectiveCycleLen,
    projectedCycles,
    computeFromLocked,
    hasHistory,
    hasManualSeed,
    cycleState,
  };
}

export default useCyclePlanner;
