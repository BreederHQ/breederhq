import * as React from "react";
import { SPECIES_DEFAULTS, computeCycleSummary, type BioSpecies, type ISODate } from "../utils/repro";

export type Species = "Dog" | "Cat" | "Horse";

export type CycleDefaults = {
  cycle_len_days: number;
  start_buffer_days: number;
  ovulation_day_from_heat_start: number;
};

export type ReproEvent = { kind: "heat_start" | "ovulation" | "insemination" | "whelp"; date: ISODate; note?: string };

export type ExpectedWindows = {
  pre_breeding_full: [ISODate, ISODate];
  hormone_testing_full: [ISODate, ISODate];
  breeding_full: [ISODate, ISODate];
  whelping_full: [ISODate, ISODate];
  puppy_care_full: [ISODate, ISODate];
  gohome_normal_full: [ISODate, ISODate];
  gohome_extended_full: [ISODate, ISODate];
  pre_breeding_likely: [ISODate, ISODate];
  hormone_testing_likely: [ISODate, ISODate];
  breeding_likely: [ISODate, ISODate];
  whelping_likely: [ISODate, ISODate];
  puppy_care_likely: [ISODate, ISODate];
  gohome_normal_likely: [ISODate, ISODate];
};

export type TravelBand = { kind: "Risky" | "Unlikely"; start: ISODate; end: ISODate; label: string };
export type ExpectedDates = {
  cycle_start: ISODate;
  ovulation: ISODate;
  breed_expected: ISODate;
  birth_expected: ISODate;
  gohome_expected: ISODate;
  last_offspring_gohome_expected: ISODate;
  windows: ExpectedWindows;
  travel: TravelBand[];
};

const toISO = (d: Date) => d.toISOString().slice(0, 10) as ISODate;
function parseISODate(iso: ISODate): Date { const d = new Date(iso); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDaysISO(iso: ISODate, days: number): ISODate { const d = parseISODate(iso); d.setDate(d.getDate() + days); return toISO(d); }

function uiToBio(species: Species): BioSpecies {
  switch (species) { case "Dog": return "DOG"; case "Cat": return "CAT"; case "Horse": return "HORSE"; default: return "OTHER"; }
}

export function pickDefaults(species: Species): CycleDefaults {
  const key = uiToBio(species);
  const cycle_len_days = SPECIES_DEFAULTS[key] ?? SPECIES_DEFAULTS.OTHER;
  return species === "Dog"
    ? { cycle_len_days, start_buffer_days: 14, ovulation_day_from_heat_start: 12 }
    : species === "Cat"
    ? { cycle_len_days, start_buffer_days: 7, ovulation_day_from_heat_start: 3 }
    : species === "Horse"
    ? { cycle_len_days, start_buffer_days: 7, ovulation_day_from_heat_start: 5 }
    : { cycle_len_days, start_buffer_days: 14, ovulation_day_from_heat_start: 12 };
}

export function femaleCycleAvgLen(heatStartsAsc: ISODate[]): number | null {
  if (!Array.isArray(heatStartsAsc) || heatStartsAsc.length < 3) return null;
  const s = computeCycleSummary(heatStartsAsc, { lastN: 3, species: "OTHER", rounding: "nearest" });
  return s.avgLastN ?? s.avgAll ?? null;
}

export function projectUpcomingCycles(opts: {
  species: Species; lastActualHeatStart?: ISODate | null; allActualHeatStartsAsc?: ISODate[]; count?: number;
}): ISODate[] {
  const { species, lastActualHeatStart, allActualHeatStartsAsc = [], count = 8 } = opts;
  const d = pickDefaults(species);
  const avg = femaleCycleAvgLen(allActualHeatStartsAsc) ?? d.cycle_len_days;
  const seed: ISODate = lastActualHeatStart ?? toISO(new Date(new Date().setDate(new Date().getDate() + d.start_buffer_days)));
  const out: ISODate[] = []; let cur = seed;
  for (let i = 1; i <= count; i++) { cur = addDaysISO(cur, avg); out.push(cur); }
  return out;
}

export function computeExpectedFromCycle(opts: { species: Species; cycleStart: ISODate }): ExpectedDates {
  const d = pickDefaults(opts.species);
  const cycle = opts.cycleStart;
  const ovulation = addDaysISO(cycle, d.ovulation_day_from_heat_start);
  const whelpLikelyStart = addDaysISO(ovulation, 63 - 1);
  const whelpLikelyEnd = addDaysISO(ovulation, 63 + 1);
  const whelpFullStart = addDaysISO(ovulation, 63 - 2);
  const whelpFullEnd = addDaysISO(ovulation, 63 + 2);
  const eightWeeks = 7 * 8;
  const puppyCareFullStart = whelpFullStart;
  const puppyCareFullEnd = addDaysISO(whelpFullEnd, eightWeeks);
  const goHomeNormalFullStart = addDaysISO(whelpFullStart, eightWeeks);
  const goHomeNormalFullEnd = addDaysISO(whelpFullEnd, eightWeeks);
  const goHomeExtendedFullStart = goHomeNormalFullEnd;
  const goHomeExtendedFullEnd = addDaysISO(goHomeExtendedFullStart, 7 * 3);
  const preBreedingFullStart = cycle;
  const preBreedingFullEnd = addDaysISO(cycle, d.ovulation_day_from_heat_start - 1);
  const hormoneTestingFullStart = addDaysISO(cycle, 7);
  const hormoneTestingFullEnd = ovulation;
  const breedingFullStart = addDaysISO(cycle, d.ovulation_day_from_heat_start - 1);
  const breedingFullEnd = addDaysISO(cycle, d.ovulation_day_from_heat_start + 2);
  const breedingLikelyStart = ovulation;
  const breedingLikelyEnd = addDaysISO(ovulation, 1);
  const puppyCareLikelyStart = whelpLikelyStart;
  const puppyCareLikelyEnd = addDaysISO(puppyCareLikelyStart, eightWeeks);
  const goHomeLikelyStart = addDaysISO(whelpLikelyStart, eightWeeks - 1);
  const goHomeLikelyEnd = addDaysISO(whelpLikelyEnd, eightWeeks + 1);
  const travel: TravelBand[] = [
    { kind: "Risky", start: hormoneTestingFullStart, end: breedingFullEnd, label: "" },
    { kind: "Risky", start: whelpFullStart, end: goHomeExtendedFullEnd, label: "" },
    { kind: "Unlikely", start: preBreedingFullEnd, end: breedingLikelyEnd, label: "" },
    { kind: "Unlikely", start: puppyCareLikelyStart, end: goHomeLikelyEnd, label: "" },
  ];

  return {
    cycle_start: cycle,
    ovulation,
    breed_expected: ovulation,
    birth_expected: addDaysISO(ovulation, 63),
    gohome_expected: addDaysISO(whelpLikelyStart, eightWeeks),
    last_offspring_gohome_expected: goHomeNormalFullEnd,
    windows: {
      pre_breeding_full: [preBreedingFullStart, preBreedingFullEnd],
      hormone_testing_full: [hormoneTestingFullStart, hormoneTestingFullEnd],
      breeding_full: [breedingFullStart, breedingFullEnd],
      whelping_full: [whelpFullStart, whelpFullEnd],
      puppy_care_full: [puppyCareFullStart, puppyCareFullEnd],
      gohome_normal_full: [goHomeNormalFullStart, goHomeNormalFullEnd],
      gohome_extended_full: [goHomeExtendedFullStart, goHomeExtendedFullEnd],
      pre_breeding_likely: [preBreedingFullStart, preBreedingFullEnd],
      hormone_testing_likely: [preBreedingFullEnd, hormoneTestingFullEnd],
      breeding_likely: [breedingLikelyStart, breedingLikelyEnd],
      whelping_likely: [whelpLikelyStart, whelpLikelyEnd],
      puppy_care_likely: [puppyCareLikelyStart, puppyCareLikelyEnd],
      gohome_normal_likely: [goHomeLikelyStart, goHomeLikelyEnd],
    },
    travel,
  };
}

export function useCyclePlanner(params: {
  species: Species; reproAsc?: ReproEvent[]; lastActualHeatStart?: ISODate | null; futureCount?: number;
}) {
  const { species, reproAsc = [], lastActualHeatStart, futureCount = 12 } = params;
  const heatAsc = React.useMemo(() => reproAsc.filter(e => e.kind === "heat_start" && e.date).map(e => e.date).sort(), [reproAsc]);
  const defaults = React.useMemo(() => pickDefaults(species), [species]);
  const avgLen = React.useMemo(() => femaleCycleAvgLen(heatAsc), [heatAsc]);
  const effectiveCycleLen = avgLen ?? defaults.cycle_len_days;
  const projectedCycles = React.useMemo(() => projectUpcomingCycles({
    species, lastActualHeatStart: lastActualHeatStart ?? (heatAsc.length ? heatAsc[heatAsc.length - 1] : null),
    allActualHeatStartsAsc: heatAsc, count: futureCount,
  }), [species, lastActualHeatStart, heatAsc, futureCount]);
  const computeFromLocked = React.useCallback((cycleStart: ISODate) => computeExpectedFromCycle({ species, cycleStart }), [species]);
  return { defaults, averageCycleLen: avgLen, effectiveCycleLen, projectedCycles, computeFromLocked };
}

export default useCyclePlanner;
