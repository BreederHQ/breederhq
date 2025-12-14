// packages/ui/src/utils/breedingMath.ts
// Pure util: biology math + windows for Gantt and Calendar

export type Species = "DOG" | "CAT" | "HORSE" | "GOAT" | "RABBIT";
export type DateLike = Date | string | number;

export type Range = { start: Date; end: Date }; // inclusive end-date math for bars

export type StageKey =
  | "preBreeding"
  | "hormoneTesting"
  | "breeding"
  | "birth"
  | "postBirthCare"
  | "PlacementNormal"    // internal key retained for compatibility
  | "PlacementExtended"; // internal key retained for compatibility

export type StageWindows = {
  key: StageKey;
  full: Range;
  likely?: Range;
};

/** Canonical name going forward */
export type AvailabilityBand = {
  kind: "risky" | "unlikely";
  range: Range;
  label: string;
};

/** Back-compat name, retained so existing import sites do not break */
export type TravelBand = {
  kind: "risky" | "unlikely";
  range: Range;
  label: string;
};

export type WindowsResult = {
  stages: StageWindows[];
  /** Canonical going forward */
  availability: AvailabilityBand[];
  /** Back-compat alias. Mirrors `availability`. Prefer not to use. */
  travel: TravelBand[];
  today: Date;
  horizon: Range;
};

/* ───────────────── Biological constants: single source of truth ─────────────────
   DOG defaults live in BIO. Species overrides for CAT, HORSE, GOAT, RABBIT below.
*/

// Use a proper interface so values are typed as numbers (not numeric literals)
export interface Biology {
  /** Average cycle length used for planning windows (days) */
  cycleLenDays: number;

  /** Guard days before we assume a cycle started if only an approximate window exists (days) */
  startBufferDays: number;

  /** Default ovulation day relative to heat start (days) */
  ovulationOffsetDays: number;

  /** Hormone testing anchor relative to cycle start (days) */
  hormoneTestingFromCycleStartDays: number;

  /** Gestation from ovulation to birth (days) */
  whelpingDaysFromOvulation: number;

  /** Jitter used to construct "full" and "likely" birth windows (days) */
  whelpingJitterFullDays: number;
  whelpingJitterLikelyDays: number;

  /** Likely window half width around heat center for preBreeding (days) */
  preBreedingLikelyHalfWidthDays: number;

  /** Breeding window padding relative to ovulation (days) */
  breedingPreOvulationDays: number; // full start is ovulationOffset - this
  breedingPostOvulationDays: number; // full end is ovulationOffset + this

  /** Offspring care duration after birth that drives placement timing (weeks) */
  careWeeks: number;

  /** Weaning default in days after birth */
  weanFromBirthDays: number;

  /** Extra weeks for the extended placement window */
  placementExtendedWeeks: number;
}

export const BIO: Biology = {
  cycleLenDays: 180,                // Dog baseline (about 6 months)
  startBufferDays: 14,
  ovulationOffsetDays: 12,
  hormoneTestingFromCycleStartDays: 7,
  whelpingDaysFromOvulation: 63,
  whelpingJitterFullDays: 2,
  whelpingJitterLikelyDays: 1,
  preBreedingLikelyHalfWidthDays: 5,
  breedingPreOvulationDays: 1,
  breedingPostOvulationDays: 2,
  careWeeks: 8,
  weanFromBirthDays: 42,
  placementExtendedWeeks: 3,
};

/** Species overrides (authoritative) */
export const BIO_BY_SPECIES: Partial<Record<Species, Partial<Biology>>> = {
  CAT: {
    cycleLenDays: 60,
    ovulationOffsetDays: 3,
    whelpingDaysFromOvulation: 63,
    weanFromBirthDays: 56,          // 8 weeks
    careWeeks: 8,                   // homing about 8 to 10 weeks
  },
  HORSE: {
    cycleLenDays: 21,
    ovulationOffsetDays: 5,
    whelpingDaysFromOvulation: 340, // about 11 months
    weanFromBirthDays: 150,         // about 5 months
    careWeeks: 36,                  // about 8+ months after birth
  },
  GOAT: {
    cycleLenDays: 21,
    ovulationOffsetDays: 1,
    whelpingDaysFromOvulation: 150,
    weanFromBirthDays: 70,          // about 10 weeks
    careWeeks: 10,
  },
  RABBIT: {
    cycleLenDays: 14,
    ovulationOffsetDays: 0,
    whelpingDaysFromOvulation: 31,
    weanFromBirthDays: 42,          // around 6 weeks
    careWeeks: 8,
  },
};

export function bioFor(species: Species | undefined): Biology {
  const o = species ? BIO_BY_SPECIES[species] : undefined;
  return { ...BIO, ...(o || {}) };
}

/* ───────────────── Legacy defaults kept for signature compatibility ───────────────── */

export type CycleDefaults = {
  cycleLenDays: number;
  startBufferDays: number;
  ovulationDayFromHeatStart: number;
};

export const DEFAULTS: CycleDefaults = {
  cycleLenDays: BIO.cycleLenDays,
  startBufferDays: BIO.startBufferDays,
  ovulationDayFromHeatStart: BIO.ovulationOffsetDays,
};

/* ───────────────── helpers ───────────────── */

// --- UTC day helpers (avoid TZ drift/DST) ---
const DAY_MS = 86_400_000;

/** Parse to a UTC "date-only" (00:00:00Z). Preserves only the calendar day. */
function toUtcDateOnly(x: DateLike): Date {
  if (x instanceof Date) {
    return new Date(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()));
  }
  if (typeof x === "string") {
    // If 'YYYY-MM-DD' -> build in UTC
    const m = x.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  }
  const d = new Date(x as any);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function toDate(d: DateLike): Date {
  return toUtcDateOnly(d);
}
export function addDays(d: DateLike, n: number): Date {
  const base = toUtcDateOnly(d);
  return new Date(base.getTime() + n * DAY_MS);
}
export function clampRange(r: Range, min: Date, max: Date): Range {
  return {
    start: new Date(Math.max(r.start.getTime(), min.getTime())),
    end: new Date(Math.min(r.end.getTime(), max.getTime())),
  };
}
export function makeRange(start: DateLike, end: DateLike): Range {
  return { start: toUtcDateOnly(start), end: toUtcDateOnly(end) };
}
export function daysBetweenInclusive(a: DateLike, b: DateLike): number {
  const A = Date.UTC(toDate(a).getUTCFullYear(), toDate(a).getUTCMonth(), toDate(a).getUTCDate());
  const B = Date.UTC(toDate(b).getUTCFullYear(), toDate(b).getUTCMonth(), toDate(b).getUTCDate());
  return Math.floor((B - A) / DAY_MS) + 1;
}

/** Return a new Date at UTC midnight for stable day math. */
export function clampDay(dt: Date): Date {
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}

/** Inclusive one-day range for milestone-like bars. */
export function oneDayRange(d: Date): Range {
  const s = clampDay(d);
  return { start: s, end: s };
}

/** Inclusive count of calendar months spanned by start..end. */
export function monthsBetween(start: Date, end: Date): number {
  // Month math is calendar-based; still safe to use UTC getters.
  const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const e = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  const m =
    (e.getUTCFullYear() - s.getUTCFullYear()) * 12 +
    (e.getUTCMonth() - s.getUTCMonth()) +
    1;
  return Math.max(1, m);
}

/** Pad a span by one empty calendar month on both ends. */
export function padByOneMonth(r: Range): Range {
  const a = new Date(Date.UTC(r.start.getUTCFullYear(), r.start.getUTCMonth() - 1, 1));
  const b = new Date(Date.UTC(r.end.getUTCFullYear(), r.end.getUTCMonth() + 2, 0));
  return { start: a, end: b };
}

/* ───────────────── biology rules ───────────────── */

export type HeatWindow = {
  earliestHeatStart: Date;
  latestHeatStart: Date;
};
export type PlanAnchors = {
  species: Species;
  heat: HeatWindow;
  ovulationDate?: Date | null;
};

// Use Placement labels by default
export type StageLabels = Record<StageKey, string>;
export const DEFAULT_STAGE_LABELS: StageLabels = {
  preBreeding: "Cycle",
  hormoneTesting: "Hormone Testing",
  breeding: "Breeding",
  birth: "Birth",
  postBirthCare: "Post birth care",
  PlacementNormal: "Placement",
  PlacementExtended: "Placement (Extended)",
};

// default order top to bottom
export const DEFAULT_STAGE_ORDER: StageKey[] = [
  "preBreeding",
  "hormoneTesting",
  "breeding",
  "birth",
  "postBirthCare",
  "PlacementNormal",
  "PlacementExtended",
];

export function computeWindows(
  anchors: PlanAnchors,
  opts?: Partial<CycleDefaults>
): WindowsResult {
  // Merge legacy opts to keep signature stable, but prefer species-aware biology
  const legacy = { ...DEFAULTS, ...opts };
  const b = bioFor(anchors.species);

  const { earliestHeatStart, latestHeatStart } = anchors.heat;
  const ovulationOffset = legacy.ovulationDayFromHeatStart ?? b.ovulationOffsetDays;
  const today = new Date();

  const earliestOvulation = addDays(earliestHeatStart, ovulationOffset);
  const latestOvulation = addDays(latestHeatStart, ovulationOffset);

  const ovulationCenter =
    anchors.ovulationDate ??
    new Date(Math.round((earliestOvulation.getTime() + latestOvulation.getTime()) / 2));

  // Pre-breeding Heat
  const preBreedingFull = makeRange(
    earliestHeatStart,
    addDays(latestHeatStart, ovulationOffset - b.breedingPreOvulationDays)
  );
  const heatCenter = new Date(
    Math.round((earliestHeatStart.getTime() + latestHeatStart.getTime()) / 2)
  );
  const preBreedingLikelyRaw = makeRange(
    addDays(heatCenter, -b.preBreedingLikelyHalfWidthDays),
    addDays(heatCenter, +b.preBreedingLikelyHalfWidthDays)
  );

  // Hormone Testing
  const hormoneFull = makeRange(
    addDays(earliestHeatStart, b.hormoneTestingFromCycleStartDays),
    latestOvulation
  );
  const hormoneLikelyRaw = makeRange(
    addDays(preBreedingLikelyRaw.end, 1),
    addDays(preBreedingLikelyRaw.end, 7)
  );

  // Breeding
  const breedingFull = makeRange(
    addDays(earliestHeatStart, ovulationOffset - b.breedingPreOvulationDays),
    addDays(latestHeatStart, ovulationOffset + b.breedingPostOvulationDays)
  );
  const breedingLikely = makeRange(ovulationCenter, addDays(ovulationCenter, 1));

  // Birth windows from ovulation biology
  const birthFull = makeRange(
    addDays(ovulationCenter, b.whelpingDaysFromOvulation - b.whelpingJitterFullDays),
    addDays(ovulationCenter, b.whelpingDaysFromOvulation + b.whelpingJitterFullDays)
  );
  const birthLikely = makeRange(
    addDays(ovulationCenter, b.whelpingDaysFromOvulation - b.whelpingJitterLikelyDays),
    addDays(ovulationCenter, b.whelpingDaysFromOvulation + b.whelpingJitterLikelyDays)
  );

  // Post birth care
  const postBirthCareFull = makeRange(
    birthFull.start,
    addDays(birthFull.end, b.careWeeks * 7)
  );
  const postBirthCareLikely = makeRange(
    birthLikely.start,
    addDays(birthLikely.end, b.careWeeks * 7)
  );

  // Placement
  const PlacementNormalFull = makeRange(
    addDays(birthFull.start, b.careWeeks * 7),
    addDays(birthFull.end, b.careWeeks * 7)
  );
  const PlacementNormalLikely = makeRange(
    addDays(birthLikely.start, b.careWeeks * 7 - 1),
    addDays(birthLikely.end, b.careWeeks * 7 + 1)
  );

  const PlacementExtendedFull = makeRange(
    addDays(PlacementNormalFull.end, 1),
    addDays(PlacementNormalFull.end, b.placementExtendedWeeks * 7)
  );

  // Cap likely windows into full windows
  const preBreedingLikely = clampRange(preBreedingLikelyRaw, preBreedingFull.start, preBreedingFull.end);
  const hormoneLikely = clampRange(hormoneLikelyRaw, hormoneFull.start, hormoneFull.end);

  // Availability bands
  const availability: AvailabilityBand[] = [
    { kind: "risky",     range: makeRange(hormoneFull.start, breedingFull.end),                label: "Availability: Risky" },
    { kind: "risky",     range: makeRange(birthFull.start, PlacementExtendedFull.end),         label: "Availability: Risky" },
    { kind: "unlikely",  range: makeRange(hormoneLikely.start, breedingLikely.end),            label: "Availability: Unlikely" },
    { kind: "unlikely",  range: makeRange(postBirthCareLikely.start, PlacementNormalLikely.end), label: "Availability: Unlikely" },
  ];

  // Horizon: 18 months from first stage start
  const minStart = preBreedingFull.start;
  const horizon = makeRange(minStart, addDays(minStart, 18 * 30 + 8)); // nominal 548 days

  const stages: StageWindows[] = [
    { key: "preBreeding",    full: preBreedingFull,    likely: preBreedingLikely },
    { key: "hormoneTesting", full: hormoneFull,        likely: hormoneLikely },
    { key: "breeding",       full: breedingFull,       likely: breedingLikely },
    { key: "birth",          full: birthFull,          likely: birthLikely },
    { key: "postBirthCare",  full: postBirthCareFull,  likely: postBirthCareLikely },
    { key: "PlacementNormal",  full: PlacementNormalFull,  likely: PlacementNormalLikely },
    { key: "PlacementExtended", full: PlacementExtendedFull },
  ];

  const travel: TravelBand[] = availability.map(a => ({ ...a })); // back compat alias

  return { stages, availability, travel, today, horizon };
}

/* ───────────────── Convenience: derive from a plan slice ───────────────── */

export type MinimalPlan = {
  species: Species;
  earliestHeatStart: DateLike;
  latestHeatStart: DateLike;
  ovulationDate?: DateLike | null;
};

export function fromPlan(plan: MinimalPlan, opts?: Partial<CycleDefaults>): WindowsResult {
  return computeWindows(
    {
      species: plan.species,
      heat: {
        earliestHeatStart: toDate(plan.earliestHeatStart),
        latestHeatStart: toDate(plan.latestHeatStart),
      },
      ovulationDate: plan.ovulationDate ? toDate(plan.ovulationDate) : null,
    },
    opts
  );
}

/* ───────────────── Calendar events helper ───────────────── */

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date; // exclusive for FullCalendar
  allDay?: boolean;
  meta?: Record<string, unknown>;
};

export function windowsToCalendarEvents(
  planId: string,
  labels: StageLabels,
  windows: WindowsResult
): CalendarEvent[] {
  const add1 = (d: Date) => addDays(d, 1); // exclusive end
  const events: CalendarEvent[] = [];
  for (const s of windows.stages) {
    events.push({
      id: `${planId}:${s.key}:full`,
      title: `${labels[s.key]} (Full)`,
      start: s.full.start,
      end: add1(s.full.end),
      allDay: true,
      meta: { stage: s.key, type: "full", planId },
    });
    if (s.likely) {
      events.push({
        id: `${planId}:${s.key}:likely`,
        title: `${labels[s.key]} (Likely)`,
        start: s.likely.start,
        end: add1(s.likely.end),
        allDay: true,
        meta: { stage: s.key, type: "likely", planId },
      });
    }
  }

  const avail = windows.availability?.length ? windows.availability : windows.travel ?? [];
  for (const t of avail) {
    events.push({
      id: `${planId}:availability:${t.kind}:${t.range.start.toISOString()}`,
      title: t.label,
      start: t.range.start,
      end: add1(t.range.end),
      allDay: true,
      meta: { stage: "availability", type: t.kind, planId },
    });
  }
  return events;
}

/* ───────────────── Expected milestones from a locked cycle ───────────────── */

export type SpeciesRules = {
  ovulationFromHeatStartDays: number;
  gestationDays: number;
  weanFromBirthDays: number;
  PlacementFromBirthDays: number;
};

function rulesFor(species: Species): SpeciesRules {
  const b = bioFor(species);
  return {
    ovulationFromHeatStartDays: b.ovulationOffsetDays,
    gestationDays: b.whelpingDaysFromOvulation,
    weanFromBirthDays: b.weanFromBirthDays,
    PlacementFromBirthDays: b.careWeeks * 7,
  };
}

/** ISO date (YYYY-MM-DD) from Date — using UTC parts */
function isoDay(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Baseline average cycle length by species (derived from bioFor) */
export const SPECIES_BASELINE_CYCLE_LEN_DAYS: Record<Species, number> = {
  DOG: bioFor("DOG").cycleLenDays,
  CAT: bioFor("CAT").cycleLenDays,
  HORSE: bioFor("HORSE").cycleLenDays,
  GOAT: bioFor("GOAT").cycleLenDays,
  RABBIT: bioFor("RABBIT").cycleLenDays,
};

export type CycleHistory = { heatStarts: DateLike[] };

export function resolveCycleLengthDays(
  species: Species,
  history: CycleHistory | null | undefined,
  femaleOverrideDays: number | null | undefined
): { days: number; source: "learned" | "override" | "baseline" } {
  const starts = (history?.heatStarts ?? [])
    .map(toDate)
    .filter(d => Number.isFinite(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (starts.length >= 3) {
    const gaps: number[] = [];
    for (let i = 1; i < starts.length; i++) {
      const prev = starts[i - 1];
      const cur = starts[i];
      const delta = Math.max(1, Math.round((cur.getTime() - prev.getTime()) / DAY_MS));
      gaps.push(delta);
    }
    if (gaps.length >= 2) {
      const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
      if (avg > 0) return { days: avg, source: "learned" };
    }
  }
  if (femaleOverrideDays && Number.isFinite(femaleOverrideDays) && femaleOverrideDays > 0) {
    return { days: Math.round(femaleOverrideDays), source: "override" };
  }
  const base = SPECIES_BASELINE_CYCLE_LEN_DAYS[species] ?? SPECIES_BASELINE_CYCLE_LEN_DAYS.DOG;
  return { days: base, source: "baseline" };
}

export function projectUpcomingCycles(
  lastHeatStart: DateLike,
  cycleLenDays: number,
  count: number
): string[] {
  const out: string[] = [];
  let cur = toDate(lastHeatStart);
  for (let i = 0; i < count; i++) {
    cur = addDays(cur, cycleLenDays);
    out.push(isoDay(cur));
  }
  return out;
}

/**
 * Program default helpers without importing availability to avoid cycles.
 * Pass whatever you have from tenant prefs. All fields are optional.
 */
export type ProgramDefaultsLike = Partial<{
  placement_start_from_birth_weeks: number;
  weaned_from_birth_days: number;
  testing_from_cycle_start_days: number;
}>;

export function expectedPlacementStartFromBirth(
  birthDate: Date,
  prefs?: ProgramDefaultsLike
): Date;
export function expectedPlacementStartFromBirth(
  birthDate: Date,
  species: Species,
  prefs?: ProgramDefaultsLike
): Date;
export function expectedPlacementStartFromBirth(
  birthDate: Date,
  speciesOrPrefs?: Species | ProgramDefaultsLike,
  maybePrefs?: ProgramDefaultsLike
): Date {
  let species: Species | undefined;
  let prefs: ProgramDefaultsLike | undefined;

  if (typeof speciesOrPrefs === "string") {
    species = speciesOrPrefs;
    prefs = maybePrefs;
  } else {
    prefs = speciesOrPrefs;
  }

  const b = bioFor(species);
  const weeks = Number(
    prefs?.placement_start_from_birth_weeks ?? b.careWeeks
  );
  return addDays(birthDate, weeks * 7);
}


export function expectedWeanedFromBirth(
  birthDate: Date,
  prefs?: ProgramDefaultsLike
): Date;
export function expectedWeanedFromBirth(
  birthDate: Date,
  species: Species,
  prefs?: ProgramDefaultsLike
): Date;
export function expectedWeanedFromBirth(
  birthDate: Date,
  speciesOrPrefs?: Species | ProgramDefaultsLike,
  maybePrefs?: ProgramDefaultsLike
): Date {
  let species: Species | undefined;
  let prefs: ProgramDefaultsLike | undefined;

  if (typeof speciesOrPrefs === "string") {
    species = speciesOrPrefs;
    prefs = maybePrefs;
  } else {
    prefs = speciesOrPrefs;
  }

  const b = bioFor(species);
  const days = Number(
    prefs?.weaned_from_birth_days ?? b.weanFromBirthDays
  );
  return addDays(birthDate, days);
}

export function expectedTestingFromCycleStart(
  cycleStart: Date,
  prefs?: ProgramDefaultsLike
): Date {
  const days = Number(prefs?.testing_from_cycle_start_days ?? BIO.hormoneTestingFromCycleStartDays);
  return addDays(cycleStart, days);
}

/**
 * Expected milestone dates from a locked heat start.
 * Uses species rules, with optional program defaults to override
 * weaned and placement start anchors.
 */
export function expectedMilestonesFromLocked(
  lockedHeatStart: DateLike,
  species: Species,
  programDefaults?: ProgramDefaultsLike
): {
  ovulation: string;
  breeding_expected: string;
  birth_expected: string;
  weaned_expected: string;
  placement_start_expected: string;
  placement_completed_expected: string | null;
  // legacy aliases
  Placement_expected: string;
  Placement_extended_end_expected: string | null;
} {
  const rules = rulesFor(species);

  const heat = toDate(lockedHeatStart);
  const ovulation = addDays(heat, rules.ovulationFromHeatStartDays);
  const birth = addDays(ovulation, rules.gestationDays);

  const weaned = programDefaults
    ? expectedWeanedFromBirth(birth, species, programDefaults)
    : addDays(birth, rules.weanFromBirthDays);

  const placementStart = programDefaults
    ? expectedPlacementStartFromBirth(birth, species, programDefaults)
    : addDays(birth, rules.PlacementFromBirthDays);

  const bio = bioFor(species);
  const placementExtendedEnd = addDays(
    placementStart,
    bio.placementExtendedWeeks * 7
  );

  // placementCompleted stays null for now, it is intended to be learned
  // from actual placement history rather than pure biology
  const placementCompleted: string | null = null;

  return {
    ovulation: isoDay(ovulation),
    breeding_expected: isoDay(ovulation),
    birth_expected: isoDay(birth),
    weaned_expected: isoDay(weaned),
    placement_start_expected: isoDay(placementStart),
    placement_completed_expected: placementCompleted,
    // legacy aliases for consumers not yet migrated
    Placement_expected: isoDay(placementStart),
    Placement_extended_end_expected: isoDay(placementExtendedEnd),
  };
}
