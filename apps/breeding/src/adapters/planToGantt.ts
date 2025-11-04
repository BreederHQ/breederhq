// apps/breeding/src/adapters/planToGantt.ts
import {
  fromPlan as biologyFromPlan,
  type Species,
  type StageWindows,
  type WindowsResult,
  type Range,
} from "@bhq/ui/utils/breedingMath";

/* ───────────────── types ───────────────── */
export type ID = number | string;

export type BreedingPlanLike = {
  id: ID;
  species: Species; // "DOG" | "CAT" | "HORSE"
  earliestHeatStart: Date | string | null;
  latestHeatStart: Date | string | null;
  ovulationDate?: Date | string | null;
  name?: string | null;
  status?: string | null;
};

export type NormalizedPlan = {
  plan: { id: ID; name: string; status?: string | null };
  windows: StageWindows[]; // always normalized to an array
};

/* ───────────────── visuals ───────────────── */

export const GANTT_STAGES = [
  { key: "preBreeding",       label: "Pre-breeding Heat",   baseColor: "hsl(var(--brand-cyan, 186 100% 40%))",  hatchLikely: true },
  { key: "hormoneTesting",    label: "Hormone Testing",     baseColor: "hsl(var(--brand-orange, 36 100% 50%))",  hatchLikely: true },
  { key: "breeding",          label: "Breeding",            baseColor: "hsl(var(--brand-green, 140 70% 45%))" },
  { key: "birth",             label: "Birth",               baseColor: "hsl(var(--brand-pink, 345 80% 55%))" },
  { key: "puppyCare",         label: "Puppy Care",          baseColor: "hsl(var(--brand-purple, 270 90% 60%))" },
  { key: "PlacementNormal",   label: "Placement",           baseColor: "hsl(var(--brand-gray, 220 10% 60%))" },
  { key: "PlacementExtended", label: "Placement (Extended)",baseColor: "hsl(var(--brand-gray, 220 10% 60%))" },
] as const;

// stable color chip per plan id
export function colorFromId(id: ID) {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 70% 46%)`;
}

/* ───────────────── date helpers ───────────────── */

export function monthsBetween(a: Date, b: Date) {
  const s = a < b ? a : b;
  const e = a < b ? b : a;
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
}

export function padByOneMonth(r: Range): Range {
  const a = new Date(r.start);
  const b = new Date(r.end);
  const s = new Date(a.getFullYear(), a.getMonth() - 1, 1);
  const e = new Date(b.getFullYear(), b.getMonth() + 2, 0); // end of month after b
  return { start: s, end: e };
}

export function unionRange(spans: Array<Range | null | undefined>): Range {
  let min: Date | null = null;
  let max: Date | null = null;
  for (const r of spans) {
    if (!r) continue;
    if (!min || r.start < min) min = r.start;
    if (!max || r.end > max) max = r.end;
  }
  const now = new Date();
  return {
    start: min ?? new Date(now.getFullYear(), now.getMonth(), 1),
    end: max ?? new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

/* ───────────────── normalization ───────────────── */

const toIso = (d: Date | string | null | undefined) =>
  d == null ? null : (d instanceof Date ? d : new Date(d)).toISOString();

function normalizeWindows(input: StageWindows[] | WindowsResult | null | undefined): StageWindows[] {
  if (!input) return [];
  // WindowsResult from biology util
  if (typeof (input as any).stages !== "undefined") {
    const stages = (input as any).stages;
    return Array.isArray(stages) ? stages : [];
  }
  // Already an array
  return Array.isArray(input) ? input : [];
}

/**
 * Safe overall expected range across stage windows. Accepts either a WindowsResult
 * or an array of StageWindows. Never throws.
 */


type AnyWindows =
  | Array<{ full?: Range; likely?: Range }>
  | Record<string, { full?: Range; likely?: Range }>
  | null
  | undefined;

function expectedRangeOfWindows(windows: AnyWindows): Range | null {
  if (!windows) return null;

  // Accept either an array or a map-like object
  const list = Array.isArray(windows) ? windows : Object.values(windows);

  if (!list.length) return null;

  let start: Date | null = null;
  let end: Date | null = null;

  for (const w of list) {
    const full = w?.full;
    if (!full) continue;
    start = !start || full.start < start ? full.start : start;
    end   = !end   || full.end   > end   ? full.end   : end;
  }

  return start && end ? { start, end } : null;
}

/**
 * Lightweight helper: build StageWindows from a basic plan-like slice.
 * Use this if a caller has not already run the biology util.
 */
export function windowsFromPlan(plan: BreedingPlanLike): StageWindows[] {
  if (!plan.earliestHeatStart || !plan.latestHeatStart) return [];
  const wr = biologyFromPlan({
    species: plan.species,
    earliestHeatStart: toIso(plan.earliestHeatStart)!,
    latestHeatStart: toIso(plan.latestHeatStart)!,
    ovulationDate: toIso(plan.ovulationDate) ?? null,
  });
  return normalizeWindows(wr);
}

/**
 * Normalize an arbitrary list of BreedingPlanLike items into NormalizedPlan[]
 * that always carry a windows array.
 */
export function normalizePlanItems(items: BreedingPlanLike[] | Array<BreedingPlanLike & { windows?: StageWindows[] | WindowsResult }>): NormalizedPlan[] {
  return (items || []).map((p) => {
    const name = (p as any).name ?? `Plan ${String(p.id)}`;
    const status = (p as any).status ?? null;
    const maybeWindows = (p as any).windows as StageWindows[] | WindowsResult | undefined;
    const windows = normalizeWindows(maybeWindows) ?? windowsFromPlan(p as BreedingPlanLike);
    return { plan: { id: p.id, name, status }, windows };
  });
}
