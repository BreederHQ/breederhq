// packages/ui/src/utils/availability.ts
import { z } from "zod";
import type { StageWindows, Range, StageKey } from "./breedingMath";

/** Kinds for availability overlays */
export type AvailabilityKind = "risky" | "unlikely";

/** Narrow band type used by UI layers (Gantt + Calendar) */
export type AvailabilityBand = {
  kind: AvailabilityKind;
  label: string;
  range: Range;
};

export const AvailabilityPrefsSchema = z.object({
  testing_risky_from_full_start: z.number().int().min(-365).max(365),
  testing_risky_to_full_end: z.number().int().min(-365).max(365),
  testing_unlikely_from_likely_start: z.number().int().min(-365).max(365),
  testing_unlikely_to_likely_end: z.number().int().min(-365).max(365),
  post_risky_from_full_start: z.number().int().min(-365).max(365),
  post_risky_to_full_end: z.number().int().min(-365).max(365),
  post_unlikely_from_likely_start: z.number().int().min(-365).max(365),
  post_unlikely_to_likely_end: z.number().int().min(-365).max(365),
});
export type AvailabilityPrefs = z.infer<typeof AvailabilityPrefsSchema>;

export const DEFAULT_AVAILABILITY_PREFS: Readonly<AvailabilityPrefs> = Object.freeze({
  testing_risky_from_full_start: 0,
  testing_risky_to_full_end: 0,
  testing_unlikely_from_likely_start: 0,
  testing_unlikely_to_likely_end: 0,
  post_risky_from_full_start: 0,
  post_risky_to_full_end: 0,
  post_unlikely_from_likely_start: 0,
  post_unlikely_to_likely_end: 0,
});
export function getDefaultAvailabilityPrefs(): Readonly<AvailabilityPrefs> {
  return DEFAULT_AVAILABILITY_PREFS;
}

/* helpers */
function toDate(d: Date | string | undefined | null): Date | null {
  if (!d) return null;
  const v = d instanceof Date ? d : new Date(d);
  return Number.isFinite(v.getTime()) ? v : null;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function mkRange(a: Date, b: Date): Range { return { start: a, end: b }; }
function byKey(stages: ReadonlyArray<StageWindows>, k: StageKey) { return stages.find(s => s.key === k); }

const LABELS = Object.freeze({
  risky: "Availability Risky",
  unlikely: "Availability Unlikely",
} as const);

/**
 * Derive availability bands from stage windows plus offset prefs.
 */
export function computeAvailabilityBands(
  stages: ReadonlyArray<StageWindows>,
  prefs: Readonly<Partial<AvailabilityPrefs>> = {}
): AvailabilityBand[] {
  const P = { ...DEFAULT_AVAILABILITY_PREFS, ...AvailabilityPrefsSchema.partial().parse(prefs) };

  const HT = byKey(stages, "hormoneTesting");
  const BR = byKey(stages, "breeding");
  const WH = byKey(stages, "whelping");
  const PC = byKey(stages, "puppyCare");
  const GHN = byKey(stages, "goHomeNormal");
  const GHE = byKey(stages, "goHomeExtended");

  const out: AvailabilityBand[] = [];

  // Testing → Breeding (risky)
  const testingFullStart = toDate(HT?.full.start);
  const breedingFullEnd = toDate(BR?.full.end);
  if (testingFullStart && breedingFullEnd) {
    const a = addDays(testingFullStart, P.testing_risky_from_full_start);
    const b = addDays(breedingFullEnd, P.testing_risky_to_full_end);
    if (a <= b) out.push({ kind: "risky", label: LABELS.risky, range: mkRange(a, b) });
  }

  // Testing → Breeding (unlikely)
  const testingLikelyStart = toDate(HT?.likely?.start) ?? testingFullStart;
  const breedingLikelyEnd = toDate(BR?.likely?.end) ?? breedingFullEnd;
  if (testingLikelyStart && breedingLikelyEnd) {
    const a = addDays(testingLikelyStart, P.testing_unlikely_from_likely_start);
    const b = addDays(breedingLikelyEnd, P.testing_unlikely_to_likely_end);
    if (a <= b) out.push({ kind: "unlikely", label: LABELS.unlikely, range: mkRange(a, b) });
  }

  // Post-whelp → placement end (risky)
  const whelpFullStart = toDate(WH?.full.start);
  const placementEnd = toDate(GHE?.full.end) ?? toDate(GHN?.full.end);
  if (whelpFullStart && placementEnd) {
    const a = addDays(whelpFullStart, P.post_risky_from_full_start);
    const b = addDays(placementEnd, P.post_risky_to_full_end);
    if (a <= b) out.push({ kind: "risky", label: LABELS.risky, range: mkRange(a, b) });
  }

  // Puppy care → placement start (unlikely)
  const puppyLikelyStart = toDate(PC?.likely?.start) ?? toDate(PC?.full.start);
  const placementLikelyStart = toDate(GHN?.likely?.start) ?? toDate(GHN?.full.start);
  if (puppyLikelyStart && placementLikelyStart) {
    const a = addDays(puppyLikelyStart, P.post_unlikely_from_likely_start);
    const b = addDays(placementLikelyStart, P.post_unlikely_to_likely_end);
    if (a <= b) out.push({ kind: "unlikely", label: LABELS.unlikely, range: mkRange(a, b) });
  }

  return out.sort((x, y) => x.range.start.getTime() - y.range.start.getTime());
}
