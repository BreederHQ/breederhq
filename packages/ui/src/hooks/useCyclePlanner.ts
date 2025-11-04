// packages/ui/src/hooks/useCyclePlanner.ts
import * as React from "react";
import { SPECIES_DEFAULTS, computeCycleSummary, type BioSpecies, type ISODate } from "../utils/repro";
import { BIO } from "../utils/breedingMath"; // ← centralize constants

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
  puppy_care_full: [ISODate, ISODate];
  placement_normal_full: [ISODate, ISODate];
  placement_extended_full: [ISODate, ISODate];
  pre_breeding_likely: [ISODate, ISODate];
  hormone_testing_likely: [ISODate, ISODate];
  breeding_likely: [ISODate, ISODate];
  birth_likely: [ISODate, ISODate];
  puppy_care_likely: [ISODate, ISODate];
  placement_normal_likely: [ISODate, ISODate];
};

/** Availability kinds normalized to lowercase "risky" | "unlikely" */
export type TravelBand = { kind: "risky" | "unlikely"; start: ISODate; end: ISODate; label: string };

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
  travel: TravelBand[];
};

// ────────── small date helpers ──────────
const toISO = (d: Date) => d.toISOString().slice(0, 10) as ISODate;
function parseISODate(iso: ISODate): Date { const d = new Date(iso); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDaysISO(iso: ISODate, days: number): ISODate { const d = parseISODate(iso); d.setDate(d.getDate() + days); return toISO(d); }

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

/** Species default for placement window start (weeks after birth). */
function speciesHomingStartWeeksDefault(species: Species): number {
  // BIO.puppyCareWeeks is our canonical; horses override via BIO_BY_SPECIES if needed
  return species === "Horse" ? (BIO.puppyCareWeeks /* overridden in BIO_BY_SPECIES */) : BIO.puppyCareWeeks;
}

/** Species default for weaning (days after birth). */
function speciesWeaningDaysDefault(species: Species): number {
  // Centralized to BIO.weanFromBirthDays; horses override via BIO_BY_SPECIES if needed
  return BIO.weanFromBirthDays;
}

// ────────── learned cycle length (avg of last 3 intervals) ──────────
export function femaleCycleAvgLen(heatStartsAsc: ISODate[]): number | null {
  if (!Array.isArray(heatStartsAsc) || heatStartsAsc.length < 3) return null;
  const s = computeCycleSummary(heatStartsAsc, { lastN: 3, species: "OTHER", rounding: "nearest" });
  return s.avgLastN ?? s.avgAll ?? null;
}

// ────────── project cycles with precedence: learned → per-female override → baseline ──────────
export function projectUpcomingCycles(opts: {
  species: Species;
  lastActualHeatStart?: ISODate | null;
  allActualHeatStartsAsc?: ISODate[];
  count?: number;
  femaleCycleLenOverrideDays?: number | null;
}): ISODate[] {
  const { species, lastActualHeatStart, allActualHeatStartsAsc = [], count = 8, femaleCycleLenOverrideDays } = opts;
  const d = pickDefaults(species);

  const learned = femaleCycleAvgLen(allActualHeatStartsAsc);
  const effectiveLen =
    (learned && learned > 0 ? learned : null) ??
    (femaleCycleLenOverrideDays && femaleCycleLenOverrideDays > 0 ? Math.round(femaleCycleLenOverrideDays) : null) ??
    d.cycle_len_days;

  const seed: ISODate =
    lastActualHeatStart ??
    (allActualHeatStartsAsc.length ? allActualHeatStartsAsc[allActualHeatStartsAsc.length - 1] : null) ??
    toISO(new Date(new Date().setDate(new Date().getDate() + d.start_buffer_days)));

  const out: ISODate[] = [];
  let cur = seed;
  for (let i = 1; i <= count; i++) { cur = addDaysISO(cur, effectiveLen); out.push(cur); }
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
  const d = pickDefaults(species);

  const homingWeeks =
    (typeof homingStartWeeksOverride === "number" && homingStartWeeksOverride > 0
      ? Math.round(homingStartWeeksOverride)
      : null) ??
    (typeof homingStartWeeksDefault === "number" && homingStartWeeksDefault > 0
      ? Math.round(homingStartWeeksDefault)
      : null) ??
    speciesHomingStartWeeksDefault(species);

  const cycle = cycleStart;
  const ovulation = addDaysISO(cycle, d.ovulation_day_from_heat_start);

  // Birth windows
  const birthLikelyStart = addDaysISO(ovulation, BIO.whelpingDaysFromOvulation - 1);
  const birthLikelyEnd   = addDaysISO(ovulation, BIO.whelpingDaysFromOvulation + 1);
  const birthFullStart   = addDaysISO(ovulation, BIO.whelpingDaysFromOvulation - 2);
  const birthFullEnd     = addDaysISO(ovulation, BIO.whelpingDaysFromOvulation + 2);

  const birth_expected = addDaysISO(ovulation, BIO.whelpingDaysFromOvulation);

  // Weaning
  const weaning_expected = addDaysISO(birth_expected, speciesWeaningDaysDefault(species));

  const homingDays = homingWeeks * 7;

  // Puppy care and placement windows (stage keys preserved)
  const puppyCareFullStart = birthFullStart;
  const puppyCareFullEnd   = addDaysISO(birthFullEnd, homingDays);

  const placementFullStart = addDaysISO(birthFullStart, homingDays);
  const placementFullEnd   = addDaysISO(birthFullEnd, homingDays);

  const placementExtendedFullStart = placementFullEnd;
  const placementExtendedFullEnd   = addDaysISO(placementExtendedFullStart, 7 * BIO.placementExtendedWeeks);

  const breedingFullStart = addDaysISO(cycle, d.ovulation_day_from_heat_start - BIO.breedingPreOvulationDays);
  const breedingFullEnd   = addDaysISO(cycle, d.ovulation_day_from_heat_start + BIO.breedingPostOvulationDays);
  const breedingLikelyStart = ovulation;
  const breedingLikelyEnd   = addDaysISO(ovulation, 1);

  const preBreedingFullStart = cycle;
  const preBreedingFullEnd   = addDaysISO(cycle, d.ovulation_day_from_heat_start - BIO.breedingPreOvulationDays);

  const hormoneTestingFullStart = addDaysISO(cycle, BIO.hormoneTestingFromCycleStartDays);
  const hormoneTestingFullEnd   = ovulation;

  const puppyCareLikelyStart = birthLikelyStart;
  const puppyCareLikelyEnd   = addDaysISO(puppyCareLikelyStart, homingDays);

  const placementLikelyStart = addDaysISO(birthLikelyStart, homingDays - 1);
  const placementLikelyEnd   = addDaysISO(birthLikelyEnd,   homingDays + 1);

  // Availability bands with normalized kinds
  const travel: TravelBand[] = [
    { kind: "risky",    start: hormoneTestingFullStart, end: breedingFullEnd,         label: "" },
    { kind: "risky",    start: birthFullStart,          end: placementExtendedFullEnd, label: "" },
    { kind: "unlikely", start: preBreedingFullEnd,      end: breedingLikelyEnd,       label: "" },
    { kind: "unlikely", start: puppyCareLikelyStart,    end: placementLikelyEnd,      label: "" },
  ];

  // New placement milestones + legacy aliases
  const placement_start_expected = addDaysISO(birthLikelyStart, homingDays);
  const placement_completed_expected = placementExtendedFullEnd;

  const placement_expected = placement_start_expected;
  const placement_extended_end_expected = placement_completed_expected;

  return {
    cycle_start: cycle,
    ovulation,
    breed_expected: ovulation,
    birth_expected,
    weaning_expected,

    placement_start_expected,
    placement_completed_expected,

    placement_expected,
    placement_extended_end_expected,

    last_offspring_placement_expected: placementFullEnd,

    windows: {
      pre_breeding_full:   [preBreedingFullStart,   preBreedingFullEnd],
      hormone_testing_full:[hormoneTestingFullStart,hormoneTestingFullEnd],
      breeding_full:       [breedingFullStart,      breedingFullEnd],
      birth_full:          [birthFullStart,         birthFullEnd],
      puppy_care_full:     [puppyCareFullStart,     puppyCareFullEnd],
      placement_normal_full:  [placementFullStart,  placementFullEnd],
      placement_extended_full:[placementExtendedFullStart,placementExtendedFullEnd],
      pre_breeding_likely: [preBreedingFullStart,   preBreedingFullEnd],
      hormone_testing_likely:[preBreedingFullEnd,   hormoneTestingFullEnd],
      breeding_likely:     [breedingLikelyStart,    breedingLikelyEnd],
      birth_likely:        [birthLikelyStart,       birthLikelyEnd],
      puppy_care_likely:   [puppyCareLikelyStart,   puppyCareLikelyEnd],
      placement_normal_likely:[placementLikelyStart, placementLikelyEnd],
    },
    travel,
  };
}

// ────────── The hook (unchanged API, now returns placement fields via compute) ──────────
export function useCyclePlanner(params: {
  species: Species;
  reproAsc?: ReproEvent[];
  lastActualHeatStart?: ISODate | null;
  futureCount?: number;

  femaleCycleLenOverrideDays?: number | null;
  homingStartWeeksDefault?: number | null;
  homingStartWeeksOverride?: number | null;
}) {
  const {
    species, reproAsc = [], lastActualHeatStart, futureCount = 12,
    femaleCycleLenOverrideDays, homingStartWeeksDefault, homingStartWeeksOverride,
  } = params;

  const heatAsc = React.useMemo(
    () => reproAsc.filter(e => e.kind === "heat_start" && e.date).map(e => e.date).sort(),
    [reproAsc]
  );

  const defaults = React.useMemo(() => pickDefaults(species), [species]);
  const avgLen = React.useMemo(() => femaleCycleAvgLen(heatAsc), [heatAsc]);

  const effectiveCycleLen =
    (avgLen ?? null) ??
    (Number.isFinite(femaleCycleLenOverrideDays || NaN) ? Math.round(femaleCycleLenOverrideDays!) : null) ??
    defaults.cycle_len_days;

  const projectedCycles = React.useMemo(() => {
    const seed: ISODate =
      lastActualHeatStart ??
      toISO(new Date(new Date().setDate(new Date().getDate() + defaults.start_buffer_days)));
    const out: ISODate[] = [];
    let cur = seed;
    const count = futureCount;
    for (let i = 1; i <= count; i++) {
      cur = addDaysISO(cur, effectiveCycleLen);
      out.push(cur);
    }
    return out;
  }, [lastActualHeatStart, defaults.start_buffer_days, effectiveCycleLen, futureCount]);

  const computeFromLocked = React.useCallback(
    (cycleStart: ISODate) => {
      const resolvedHomingStartWeeks =
        Number.isFinite(homingStartWeeksOverride ?? NaN) && (homingStartWeeksOverride as number) > 0
          ? (homingStartWeeksOverride as number)
          : Number.isFinite(homingStartWeeksDefault ?? NaN) && (homingStartWeeksDefault as number) > 0
            ? (homingStartWeeksDefault as number)
            : BIO.puppyCareWeeks; // ← centralized default

      return computeExpectedFromCycle({
        species,
        cycleStart,
        homingStartWeeksOverride: resolvedHomingStartWeeks,
      });
    },
    [species, homingStartWeeksDefault, homingStartWeeksOverride]
  );

  return { defaults, averageCycleLen: avgLen, effectiveCycleLen, projectedCycles, computeFromLocked };
}

export default useCyclePlanner;
