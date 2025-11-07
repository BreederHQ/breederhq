// packages/ui/src/utils/availability.ts
import { z } from "zod";
import type { StageWindows, Range, StageKey } from "./breedingMath";
import { BIO } from "./breedingMath";

/* ───────────────── Canonical breeding date keys ───────────────── */

export type BreedingExpectedKey =
  | "expectedCycleStart"
  | "expectedHormoneTestingStart"
  | "expectedBreedDate"
  | "expectedBirthDate"
  | "expectedWeaned"
  | "expectedPlacementStart"
  | "expectedPlacementCompleted";

export type BreedingActualKey =
  | "cycleStartDateActual"
  | "hormoneTestingStartDateActual"
  | "breedDateActual"
  | "birthDateActual"
  | "weanedDateActual"
  | "placementStartDateActual"
  | "placementCompletedDateActual"
  | "completedDateActual";

export type BreedingDateKey = BreedingExpectedKey | BreedingActualKey;

export const BREEDING_EXPECTED_KEYS: readonly BreedingExpectedKey[] = Object.freeze([
  "expectedCycleStart",
  "expectedHormoneTestingStart",
  "expectedBreedDate",
  "expectedBirthDate",
  "expectedWeaned",
  "expectedPlacementStart",
  "expectedPlacementCompleted",
]);

export const BREEDING_ACTUAL_KEYS: readonly BreedingActualKey[] = Object.freeze([
  "cycleStartDateActual",
  "hormoneTestingStartDateActual",
  "breedDateActual",
  "birthDateActual",
  "weanedDateActual",
  "placementStartDateActual",
  "placementCompletedDateActual",
  "completedDateActual",
]);

export const BREEDING_DATE_LABELS: Readonly<Record<BreedingDateKey, string>> = Object.freeze({
  // Expected
  expectedCycleStart: "Cycle Start (Exp)",
  expectedHormoneTestingStart: "Testing Start (Exp)",
  expectedBreedDate: "Breeding (Exp)",
  expectedBirthDate: "Birth (Exp)",
  expectedWeaned: "Weaned (Exp)",
  expectedPlacementStart: "Placement Start (Exp)",
  expectedPlacementCompleted: "Placement Completed (Exp)",
  // Actuals
  cycleStartDateActual: "Cycle Start (Actual)",
  hormoneTestingStartDateActual: "Testing Start (Actual)",
  breedDateActual: "Breeding (Actual)",
  birthDateActual: "Birthed",
  weanedDateActual: "Weaned",
  placementStartDateActual: "Placement Start (Actual)",
  placementCompletedDateActual: "Placement Completed (Actual)",
  completedDateActual: "Plan Completed (Actual)",
});

/** A normalized snapshot of all canonical breeding dates pulled from any row or API payload. */
export type BreedingDateSnapshot = Partial<Record<BreedingDateKey, Date | null>> & {
  // Convenience mirrors for common anchors used by availability math
  // These are resolved using actual then expected then null
  _anchors?: {
    cycleStart?: Date | null;
    testingStart?: Date | null;
    breedingDate?: Date | null;
    birthDate?: Date | null;
    weanedDate?: Date | null;
    placementStart?: Date | null;
    placementCompleted?: Date | null;
    planCompleted?: Date | null;
  };
};

/** Extract and normalize every canonical breeding date from any plan row or API payload. */
export function extractBreedingDates<T extends Record<string, any>>(row: T | null | undefined): BreedingDateSnapshot {
  const out: BreedingDateSnapshot = {};
  if (!row) return out;

  function toDate(v: any): Date | null {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // Expected fields
  for (const k of BREEDING_EXPECTED_KEYS) {
    out[k] = toDate((row as any)[k]);
  }
  // Actual fields
  for (const k of BREEDING_ACTUAL_KEYS) {
    out[k] = toDate((row as any)[k]);
  }

  // Resolve anchor conveniences using actual then expected priority
  const pick = (a?: Date | null, e?: Date | null) => a ?? e ?? null;

  const cycleStart = pick(out.cycleStartDateActual, out.expectedCycleStart);
  const testingStart = pick(out.hormoneTestingStartDateActual, out.expectedHormoneTestingStart);
  const breedingDate = pick(out.breedDateActual, out.expectedBreedDate);
  const birthDate = pick(out.birthDateActual, out.expectedBirthDate);
  const weanedDate = pick(out.weanedDateActual, out.expectedWeaned);
  const placementStart = pick(out.placementStartDateActual, out.expectedPlacementStart);
  const placementCompleted = pick(out.placementCompletedDateActual, out.expectedPlacementCompleted);
  const planCompleted = out.completedDateActual ?? null;

  out._anchors = {
    cycleStart,
    testingStart,
    breedingDate,
    birthDate,
    weanedDate,
    placementStart,
    placementCompleted,
    planCompleted,
  };

  return out;
}

/* ───────────────── Availability preferences ───────────────── */

export type AvailabilityKind = "risky" | "unlikely";

export type AvailabilityBand = {
  kind: AvailabilityKind;
  label: string;
  range: Range;
};

/**
 * Span wraps between stage windows. Backward compatible with existing UI.
 * Also holds your General program defaults and the Placement Start bands toggle.
 * Defaults pull from breedingMath.BIO where available.
 */
export const AvailabilityPrefsSchema = z.object({
  // Phase span wraps
  // Old testing→breeding keys kept for back compat. New cycle→breeding keys replace them.
  testing_risky_from_full_start: z.number().int().min(-365).max(365),
  testing_risky_to_full_end: z.number().int().min(-365).max(365),
  testing_unlikely_from_likely_start: z.number().int().min(-365).max(365),
  testing_unlikely_to_likely_end: z.number().int().min(-365).max(365),

  // New preferred band: Cycle Start → Breeding
  cycle_breeding_risky_from_full_start: z.number().int().min(-365).max(365),
  cycle_breeding_risky_to_full_end: z.number().int().min(-365).max(365),
  cycle_breeding_unlikely_from_likely_start: z.number().int().min(-365).max(365),
  cycle_breeding_unlikely_to_likely_end: z.number().int().min(-365).max(365),

  // Post birth → placement
  post_risky_from_full_start: z.number().int().min(-365).max(365),
  post_risky_to_full_end: z.number().int().min(-365).max(365),
  post_unlikely_from_likely_start: z.number().int().min(-365).max(365),
  post_unlikely_to_likely_end: z.number().int().min(-365).max(365),

  /**
   * Per date wraps for each expected anchor. Two offsets per kind.
   * Keys are symmetric so the Settings UI can render them as a table.
   */
  date_cycle_risky_from: z.number().int().min(-365).max(365).default(0),
  date_cycle_risky_to: z.number().int().min(-365).max(365).default(0),
  date_cycle_unlikely_from: z.number().int().min(-365).max(365).default(0),
  date_cycle_unlikely_to: z.number().int().min(-365).max(365).default(0),

  date_testing_risky_from: z.number().int().min(-365).max(365).default(0),
  date_testing_risky_to: z.number().int().min(-365).max(365).default(0),
  date_testing_unlikely_from: z.number().int().min(-365).max(365).default(0),
  date_testing_unlikely_to: z.number().int().min(-365).max(365).default(0),

  date_breeding_risky_from: z.number().int().min(-365).max(365).default(0),
  date_breeding_risky_to: z.number().int().min(-365).max(365).default(0),
  date_breeding_unlikely_from: z.number().int().min(-365).max(365).default(0),
  date_breeding_unlikely_to: z.number().int().min(-365).max(365).default(0),

  date_birth_risky_from: z.number().int().min(-365).max(365).default(0),
  date_birth_risky_to: z.number().int().min(-365).max(365).default(0),
  date_birth_unlikely_from: z.number().int().min(-365).max(365).default(0),
  date_birth_unlikely_to: z.number().int().min(-365).max(365).default(0),

  date_weaned_risky_from: z.number().int().min(-365).max(365).default(0),
  date_weaned_risky_to: z.number().int().min(-365).max(365).default(0),
  date_weaned_unlikely_from: z.number().int().min(-365).max(365).default(0),
  date_weaned_unlikely_to: z.number().int().min(-365).max(365).default(0),

  date_placement_start_risky_from: z.number().int().min(-365).max(365).default(0),
  date_placement_start_risky_to: z.number().int().min(-365).max(365).default(0),
  date_placement_start_unlikely_from: z.number().int().min(-365).max(365).default(0),
  date_placement_start_unlikely_to: z.number().int().min(-365).max(365).default(0),

  date_placement_completed_risky_from: z.number().int().min(-365).max(365).default(0),
  date_placement_completed_risky_to: z.number().int().min(-365).max(365).default(0),
  date_placement_completed_unlikely_from: z.number().int().min(-365).max(365).default(0),
  date_placement_completed_unlikely_to: z.number().int().min(-365).max(365).default(0),

  /**
   * General program defaults and Placement Start bands toggle
   */
  placement_start_from_birth_weeks: z.number().int().min(0).max(52).default(BIO.puppyCareWeeks),
  weaned_from_birth_days: z.number().int().min(0).max(365).default(BIO.weanFromBirthDays),
  testing_from_cycle_start_days: z.number().int().min(0).max(60).default(7),
  placement_start_enable_bands: z.boolean().default(false),
});
export type AvailabilityPrefs = z.infer<typeof AvailabilityPrefsSchema>;

export const DEFAULT_AVAILABILITY_PREFS: Readonly<AvailabilityPrefs> = Object.freeze(
  AvailabilityPrefsSchema.parse({
    testing_risky_from_full_start: 0,
    testing_risky_to_full_end: 0,
    testing_unlikely_from_likely_start: 0,
    testing_unlikely_to_likely_end: 0,

    cycle_breeding_risky_from_full_start: 0,
    cycle_breeding_risky_to_full_end: 0,
    cycle_breeding_unlikely_from_likely_start: 0,
    cycle_breeding_unlikely_to_likely_end: 0,

    post_risky_from_full_start: 0,
    post_risky_to_full_end: 0,
    post_unlikely_from_likely_start: 0,
    post_unlikely_to_likely_end: 0,

    date_cycle_risky_from: 0,
    date_cycle_risky_to: 0,
    date_cycle_unlikely_from: 0,
    date_cycle_unlikely_to: 0,

    date_testing_risky_from: 0,
    date_testing_risky_to: 0,
    date_testing_unlikely_from: 0,
    date_testing_unlikely_to: 0,

    date_breeding_risky_from: 0,
    date_breeding_risky_to: 0,
    date_breeding_unlikely_from: 0,
    date_breeding_unlikely_to: 0,

    date_birth_risky_from: 0,
    date_birth_risky_to: 0,
    date_birth_unlikely_from: 0,
    date_birth_unlikely_to: 0,

    date_weaned_risky_from: 0,
    date_weaned_risky_to: 0,
    date_weaned_unlikely_from: 0,
    date_weaned_unlikely_to: 0,

    date_placement_start_risky_from: 0,
    date_placement_start_risky_to: 0,
    date_placement_start_unlikely_from: 0,
    date_placement_start_unlikely_to: 0,

    date_placement_completed_risky_from: 0,
    date_placement_completed_risky_to: 0,
    date_placement_completed_unlikely_from: 0,
    date_placement_completed_unlikely_to: 0,

    placement_start_from_birth_weeks: BIO.puppyCareWeeks,
    weaned_from_birth_days: BIO.weanFromBirthDays,
    testing_from_cycle_start_days: 7,
    placement_start_enable_bands: false,
  })
);
export function getDefaultAvailabilityPrefs(): Readonly<AvailabilityPrefs> {
  return DEFAULT_AVAILABILITY_PREFS;
}

/* ───────────────── Helpers ───────────────── */
function toDate(d: Date | string | undefined | null): Date | null {
  if (!d) return null;
  const v = d instanceof Date ? d : new Date(d);
  return Number.isFinite(v.getTime()) ? v : null;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function mkRange(a: Date, b: Date): Range {
  return { start: a, end: b };
}
function byKey(stages: ReadonlyArray<StageWindows>, k: StageKey) {
  return stages.find((s) => s.key === k);
}

const LABELS = Object.freeze({
  risky: "Availability: Risky",
  unlikely: "Availability: Unlikely",
} as const);

const PER_DATE_ANCHOR_LABELS = Object.freeze({
  cycle: "Cycle Start",
  testing: "Testing Start",
  breeding: "Breeding",
  birth: "Birth",
  weaned: "Weaned",
  placement_start: "Placement Start",
  placement_completed: "Placement Completed",
} as const);
export type PerDateAnchorKey = keyof typeof PER_DATE_ANCHOR_LABELS;

/* ───────────────── Stage span based availability (updated) ─────────────────
   Replaced Testing→Breeding with Cycle Start→Breeding.
   Back compat shim maps testing_* offsets into cycle_breeding_* when unset.
   If you pass the optional `dates`, anchors are preferred over stage windows.
*/
export function computeAvailabilityBands(
  stages: ReadonlyArray<StageWindows>,
  prefs: Readonly<Partial<AvailabilityPrefs>> = {},
  dates?: BreedingDateSnapshot | null
): AvailabilityBand[] {
  const P = { ...DEFAULT_AVAILABILITY_PREFS, ...AvailabilityPrefsSchema.partial().parse(prefs) };
  // Back compat shim
  if (
    P.cycle_breeding_risky_from_full_start === 0 &&
    P.cycle_breeding_risky_to_full_end === 0 &&
    P.cycle_breeding_unlikely_from_likely_start === 0 &&
    P.cycle_breeding_unlikely_to_likely_end === 0 &&
    (
      P.testing_risky_from_full_start !== 0 ||
      P.testing_risky_to_full_end !== 0 ||
      P.testing_unlikely_from_likely_start !== 0 ||
      P.testing_unlikely_to_likely_end !== 0
    )
  ) {
    (P as any).cycle_breeding_risky_from_full_start = P.testing_risky_from_full_start;
    (P as any).cycle_breeding_risky_to_full_end = P.testing_risky_to_full_end;
    (P as any).cycle_breeding_unlikely_from_likely_start = P.testing_unlikely_from_likely_start;
    (P as any).cycle_breeding_unlikely_to_likely_end = P.testing_unlikely_to_likely_end;
  }

  const D = dates ?? {};

  const PRE = byKey(stages, "preBreeding");
  const HT = byKey(stages, "hormoneTesting");
  const BR = byKey(stages, "breeding");
  const WH = byKey(stages, "birth");
  const PC = byKey(stages, "puppyCare");
  const PL = byKey(stages, "PlacementNormal");
  const PLE = byKey(stages, "PlacementExtended");

  // prefer actual then expected then stage window
  const prefer = (...candidates: Array<Date | string | null | undefined>): Date | null => {
    for (const v of candidates) {
      const d = toDate(v as any);
      if (d) return d;
    }
    return null;
  };

  const out: AvailabilityBand[] = [];

  // Cycle Start to Breeding (risky)
  const cycleFullStart = prefer(
    D._anchors?.cycleStart,
    (D as any).cycleStartDateActual,
    (D as any).expectedCycleStart,
    PRE?.full?.start
  );
  const breedingFullEnd = prefer(
    D._anchors?.breedingDate,
    D.breedDateActual,
    D.expectedBreedDate,
    BR?.full?.end
  );
  if (cycleFullStart && breedingFullEnd) {
    const a = addDays(cycleFullStart, P.cycle_breeding_risky_from_full_start);
    const b = addDays(breedingFullEnd, P.cycle_breeding_risky_to_full_end);
    if (a <= b) out.push({ kind: "risky", label: LABELS.risky, range: mkRange(a, b) });
  }

  // Cycle Start to Breeding (unlikely)
  const cycleLikelyStart = prefer(
    D._anchors?.cycleStart,
    (D as any).cycleStartDateActual,
    (D as any).expectedCycleStart,
    PRE?.likely?.start,
    PRE?.full?.start
  );
  const breedingLikelyEnd = prefer(
    D._anchors?.breedingDate,
    D.breedDateActual,
    D.expectedBreedDate,
    BR?.likely?.end,
    BR?.full?.end
  );
  if (cycleLikelyStart && breedingLikelyEnd) {
    const a = addDays(cycleLikelyStart, P.cycle_breeding_unlikely_from_likely_start);
    const b = addDays(breedingLikelyEnd, P.cycle_breeding_unlikely_to_likely_end);
    if (a <= b) out.push({ kind: "unlikely", label: LABELS.unlikely, range: mkRange(a, b) });
  }

  // Post birth to placement end (risky)
  const birthFullStart = prefer(D._anchors?.birthDate, D.birthDateActual, D.expectedBirthDate, WH?.full.start);
  const placementEnd = prefer(
    D._anchors?.placementCompleted,
    D.placementCompletedDateActual,
    D.expectedPlacementCompleted,
    PLE?.full?.end,
    PL?.full?.end
  );
  if (birthFullStart && placementEnd) {
    const a = addDays(birthFullStart, P.post_risky_from_full_start);
    const b = addDays(placementEnd, P.post_risky_to_full_end);
    if (a <= b) out.push({ kind: "risky", label: LABELS.risky, range: mkRange(a, b) });
  }

  // Puppy care to placement start (unlikely)
  const puppyLikelyStart = prefer(D._anchors?.weanedDate, D.weanedDateActual, D.expectedWeaned, PC?.likely?.start, PC?.full?.start);
  const placementLikelyStart = prefer(
    D._anchors?.placementStart,
    D.placementStartDateActual,
    D.expectedPlacementStart,
    PL?.likely?.start,
    PL?.full?.start
  );
  if (puppyLikelyStart && placementLikelyStart) {
    const a = addDays(puppyLikelyStart, P.post_unlikely_from_likely_start);
    const b = addDays(placementLikelyStart, P.post_unlikely_to_likely_end);
    if (a <= b) out.push({ kind: "unlikely", label: LABELS.unlikely, range: mkRange(a, b) });
  }

  return out.sort((x, y) => x.range.start.getTime() - y.range.start.getTime());
}

/* ───────────────── Per date availability bands (existing) ───────────────── */

export function computePerDateAvailabilityBands(
  stages: ReadonlyArray<StageWindows>,
  prefs: Readonly<Partial<AvailabilityPrefs>> = {},
  dates?: BreedingDateSnapshot | null
): AvailabilityBand[] {
  const P = { ...DEFAULT_AVAILABILITY_PREFS, ...AvailabilityPrefsSchema.partial().parse(prefs) };
  const D = dates ?? {};

  const PRE = byKey(stages, "preBreeding");
  const HT = byKey(stages, "hormoneTesting");
  const BR = byKey(stages, "breeding");
  const WH = byKey(stages, "birth");
  const PC = byKey(stages, "puppyCare");
  const PL = byKey(stages, "PlacementNormal");
  const PLE = byKey(stages, "PlacementExtended");

  // pick a single representative date for each anchor
  const center = (r: { start: Date; end: Date } | undefined | null) =>
    r ? new Date((r.start.getTime() + r.end.getTime()) / 2) : null;

  const anchors: Record<PerDateAnchorKey, Date | null> = {
    cycle: D._anchors?.cycleStart ?? PRE?.likely?.start ?? PRE?.full.start ?? null,
    testing: D._anchors?.testingStart ?? HT?.likely?.start ?? HT?.full.start ?? null,
    breeding: D._anchors?.breedingDate ?? BR?.likely?.start ?? center(BR?.full) ?? null,
    birth: D._anchors?.birthDate ?? (WH?.likely ? center(WH.likely) : center(WH?.full)) ?? null,
    weaned: D._anchors?.weanedDate ?? PC?.likely?.end ?? PC?.full.end ?? null,
    placement_start: D._anchors?.placementStart ?? PL?.likely?.start ?? PL?.full.start ?? null,
    placement_completed:
      D._anchors?.placementCompleted ?? PLE?.full?.end ?? PL?.full?.end ?? null,
  };

  const out: AvailabilityBand[] = [];

  const addFor = (key: PerDateAnchorKey, base: Date | null) => {
    if (!base) return;

    // Skip Placement Start if bands are disabled
    if (key === "placement_start" && !P.placement_start_enable_bands) return;

    // risky
    const rf = (P as any)[`date_${key}_risky_from`] as number;
    const rt = (P as any)[`date_${key}_risky_to`] as number;
    const ra = addDays(base, rf);
    const rb = addDays(base, rt);
    if (ra <= rb) {
      out.push({
        kind: "risky",
        label: `${LABELS.risky}: ${PER_DATE_ANCHOR_LABELS[key]}`,
        range: mkRange(ra, rb),
      });
    }
    // unlikely
    const uf = (P as any)[`date_${key}_unlikely_from`] as number;
    const ut = (P as any)[`date_${key}_unlikely_to`] as number;
    const ua = addDays(base, uf);
    const ub = addDays(base, ut);
    if (ua <= ub) {
      out.push({
        kind: "unlikely",
        label: `${LABELS.unlikely}: ${PER_DATE_ANCHOR_LABELS[key]}`,
        range: mkRange(ua, ub),
      });
    }
  };

  (Object.keys(anchors) as PerDateAnchorKey[]).forEach((k) => addFor(k, anchors[k]));

  return out.sort((x, y) => x.range.start.getTime() - y.range.start.getTime());
}

/* ───────────────── Wrap summary (for UI and debug) ───────────────── */
type Dateish = Date | null | undefined;
const iso = (d: Dateish) => (d ? d.toISOString().slice(0, 10) : "—");

export type AvailabilityWrapSummary = {
  band: "cycle:risky" | "cycle:unlikely" | "post:risky" | "post:unlikely";
  label: string;
  fromLabel: string;
  fromBase: string;
  fromOffset: number;
  toLabel: string;
  toBase: string;
  toOffset: number;
  resultStart: string;
  resultEnd: string;
};

export function summarizeAvailabilityWraps(
  stages: ReadonlyArray<StageWindows>,
  prefs: Readonly<Partial<AvailabilityPrefs>> = {},
  dates?: BreedingDateSnapshot | null
): AvailabilityWrapSummary[] {
  const P = { ...DEFAULT_AVAILABILITY_PREFS, ...AvailabilityPrefsSchema.partial().parse(prefs) };
  // Back compat shim
  if (
    P.cycle_breeding_risky_from_full_start === 0 &&
    P.cycle_breeding_risky_to_full_end === 0 &&
    P.cycle_breeding_unlikely_from_likely_start === 0 &&
    P.cycle_breeding_unlikely_to_likely_end === 0 &&
    (
      P.testing_risky_from_full_start !== 0 ||
      P.testing_risky_to_full_end !== 0 ||
      P.testing_unlikely_from_likely_start !== 0 ||
      P.testing_unlikely_to_likely_end !== 0
    )
  ) {
    (P as any).cycle_breeding_risky_from_full_start = P.testing_risky_from_full_start;
    (P as any).cycle_breeding_risky_to_full_end = P.testing_risky_to_full_end;
    (P as any).cycle_breeding_unlikely_from_likely_start = P.testing_unlikely_from_likely_start;
    (P as any).cycle_breeding_unlikely_to_likely_end = P.testing_unlikely_to_likely_end;
  }

  const D = dates ?? {};

  const PRE = byKey(stages, "preBreeding");
  const BR = byKey(stages, "breeding");
  const WH = byKey(stages, "birth");
  const PC = byKey(stages, "puppyCare");
  const PL = byKey(stages, "PlacementNormal");
  const PLE = byKey(stages, "PlacementExtended");

  const prefer = (...cands: Array<Date | string | null | undefined>): Date | null => {
    for (const v of cands) {
      const d = toDate(v as any);
      if (d) return d;
    }
    return null;
  };

  const cycleFullStart = prefer(
    D._anchors?.cycleStart,
    (D as any).cycleStartDateActual,
    (D as any).expectedCycleStart,
    PRE?.full.start
  );
  const breedingFullEnd = prefer(D._anchors?.breedingDate, D.breedDateActual, D.expectedBreedDate, BR?.full.end);
  const cycleLikelyStart = prefer(
    D._anchors?.cycleStart,
    (D as any).cycleStartDateActual,
    (D as any).expectedCycleStart,
    PRE?.likely?.start,
    PRE?.full.start
  );
  const breedingLikelyEnd = prefer(
    D._anchors?.breedingDate,
    D.breedDateActual,
    D.expectedBreedDate,
    BR?.likely?.end,
    BR?.full.end
  );
  const birthFullStart = prefer(D._anchors?.birthDate, D.birthDateActual, D.expectedBirthDate, WH?.full.start);
  const placementEnd = prefer(
    D._anchors?.placementCompleted,
    D.placementCompletedDateActual,
    D.expectedPlacementCompleted,
    PLE?.full?.end,
    PL?.full?.end
  );
  const puppyLikelyStart = prefer(D._anchors?.weanedDate, D.weanedDateActual, D.expectedWeaned, PC?.likely?.start, PC?.full?.start);
  const placementLikelyStart = prefer(
    D._anchors?.placementStart,
    D.placementStartDateActual,
    D.expectedPlacementStart,
    PL?.likely?.start,
    PL?.full?.start
  );

  const out: AvailabilityWrapSummary[] = [];
  if (cycleFullStart && breedingFullEnd) {
    const a = addDays(cycleFullStart, P.cycle_breeding_risky_from_full_start);
    const b = addDays(breedingFullEnd, P.cycle_breeding_risky_to_full_end);
    out.push({
      band: "cycle:risky",
      label: LABELS.risky,
      fromLabel: "Cycle full start",
      fromBase: iso(cycleFullStart),
      fromOffset: P.cycle_breeding_risky_from_full_start,
      toLabel: "Breeding full end",
      toBase: iso(breedingFullEnd),
      toOffset: P.cycle_breeding_risky_to_full_end,
      resultStart: iso(a),
      resultEnd: iso(b),
    });
  }
  if (cycleLikelyStart && breedingLikelyEnd) {
    const a = addDays(cycleLikelyStart, P.cycle_breeding_unlikely_from_likely_start);
    const b = addDays(breedingLikelyEnd, P.cycle_breeding_unlikely_to_likely_end);
    out.push({
      band: "cycle:unlikely",
      label: LABELS.unlikely,
      fromLabel: "Cycle likely start",
      fromBase: iso(cycleLikelyStart),
      fromOffset: P.cycle_breeding_unlikely_from_likely_start,
      toLabel: "Breeding likely end",
      toBase: iso(breedingLikelyEnd),
      toOffset: P.cycle_breeding_unlikely_to_likely_end,
      resultStart: iso(a),
      resultEnd: iso(b),
    });
  }
  if (birthFullStart && placementEnd) {
    const a = addDays(birthFullStart, P.post_risky_from_full_start);
    const b = addDays(placementEnd, P.post_risky_to_full_end);
    out.push({
      band: "post:risky",
      label: LABELS.risky,
      fromLabel: "Birth full start",
      fromBase: iso(birthFullStart),
      fromOffset: P.post_risky_from_full_start,
      toLabel: "Placement end",
      toBase: iso(placementEnd),
      toOffset: P.post_risky_to_full_end,
      resultStart: iso(a),
      resultEnd: iso(b),
    });
  }
  if (puppyLikelyStart && placementLikelyStart) {
    const a = addDays(puppyLikelyStart, P.post_unlikely_from_likely_start);
    const b = addDays(placementLikelyStart, P.post_unlikely_to_likely_end);
    out.push({
      band: "post:unlikely",
      label: LABELS.unlikely,
      fromLabel: "Puppy care likely start",
      fromBase: iso(puppyLikelyStart),
      fromOffset: P.post_unlikely_from_likely_start,
      toLabel: "Placement likely start",
      toBase: iso(placementLikelyStart),
      toOffset: P.post_unlikely_to_likely_end,
      resultStart: iso(a),
      resultEnd: iso(b),
    });
  }
  return out;
}

/* ───────────────── Client hook kept as is ───────────────── */

import * as React from "react";
export type { AvailabilityPrefs as TenantAvailabilityPrefs };

type UseAvailabilityOpts = { tenantId: number };

export function useAvailabilityPrefs(opts: UseAvailabilityOpts) {
  const { tenantId } = opts;
  const [prefs, setPrefsState] = React.useState<AvailabilityPrefs>(DEFAULT_AVAILABILITY_PREFS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/tenants/${tenantId}/availability`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : r.text().then((t) => Promise.reject(t))))
      .then((j) => {
        if (alive) {
          // Merge with defaults to tolerate older server payloads
          setPrefsState({ ...DEFAULT_AVAILABILITY_PREFS, ...j });
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(String(e));
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [tenantId]);

  const save = async (next: Partial<AvailabilityPrefs>) => {
    const merged = { ...prefs, ...next };
    setPrefsState(merged);
    const res = await fetch(`/tenants/${tenantId}/availability`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      setError(`Save failed: ${res.status}`);
    } else {
      const j = await res.json();
      setPrefsState({ ...DEFAULT_AVAILABILITY_PREFS, ...j });
    }
  };

  return { prefs, setPrefs: save, loading, error };
}
