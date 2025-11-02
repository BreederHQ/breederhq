// apps/breeding/src/adapters/planToGantt.ts
// Single source of truth for converting plans into chart-ready data and horizons.

export type ID = number | string;

export type Range = { start: Date; end: Date }; // inclusive end for bars
export type StageKey =
  | "preBreeding"
  | "hormoneTesting"
  | "breeding"
  | "whelping"
  | "puppyCare"
  | "goHomeNormal";

export type StageWindows = { key: StageKey; full: Range; likely?: Range };

export type PlanRow = {
  id: ID;
  name: string;
  status?: string | null;
  species?: "Dog" | "Cat" | "Horse" | string | null;

  // Sources for expected dates
  lockedCycle?: {
    cycleStart?: string | null;
    ovulation?: string | null;
    due?: string | null;
    goHome?: string | null;
  } | null;

  // Optional expected mirrors
  expected_due?: string | null;
  expected_go_home?: string | null;
};

export type NormalizedPlan = {
  plan: PlanRow;
  windows: StageWindows[];
};

/* ───────── date helpers ───────── */
const iso = (d?: string | null) => (d ? new Date(d) : null);
const clampDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
export const addDays = (dt: Date, days: number) =>
  new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + days);

export function oneDayRange(d: Date): Range {
  const s = clampDay(d);
  return { start: s, end: s };
}

export function monthsBetween(start: Date, end: Date): number {
  const s = new Date(start.getFullYear(), start.getMonth(), 1);
  const e = new Date(end.getFullYear(), end.getMonth(), 1);
  const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  return Math.max(1, m);
}

/** Pad a span by one empty calendar month on both ends */
export function padByOneMonth(r: Range): Range {
  const a = new Date(r.start.getFullYear(), r.start.getMonth() - 1, 1);
  const b = new Date(r.end.getFullYear(), r.end.getMonth() + 2, 0);
  return { start: a, end: b };
}

/** Expected span for a set of windows. Prefer likely if present, else full. */
export function expectedRangeOfWindows(ws: StageWindows[]): Range {
  if (!ws.length) {
    const t = clampDay(new Date());
    return { start: t, end: t };
  }
  let min = ws[0].likely?.start ?? ws[0].full.start;
  let max = ws[0].likely?.end ?? ws[0].full.end;
  for (const w of ws) {
    const r = w.likely ?? w.full;
    if (r.start < min) min = r.start;
    if (r.end > max) max = r.end;
  }
  return { start: min, end: max };
}

/** Union of several ranges */
export function unionRange(ranges: Range[]): Range {
  if (!ranges.length) {
    const t = clampDay(new Date());
    return { start: t, end: t };
  }
  let min = ranges[0].start;
  let max = ranges[0].end;
  for (const r of ranges) {
    if (r.start < min) min = r.start;
    if (r.end > max) max = r.end;
  }
  return { start: min, end: max };
}

/* ───────── windows builder (expected only) ───────── */
export function windowsFromPlan(p: PlanRow): StageWindows[] {
  const out: StageWindows[] = [];

  const lock = p.lockedCycle ?? {};
  const dCycle = iso(lock.cycleStart);
  const dOv = iso(lock.ovulation);
  const dDue = iso(lock.due) || iso(p.expected_due);
  const dGo = iso(lock.goHome) || iso(p.expected_go_home);

  if (dCycle) out.push({ key: "preBreeding", full: oneDayRange(dCycle) });

  // Use ovulation as expected testing completion marker and breeding anchor
  if (dCycle && dOv && dOv.getTime() !== dCycle.getTime()) {
    out.push({ key: "hormoneTesting", full: oneDayRange(dOv) });
  }
  if (dOv) out.push({ key: "breeding", full: oneDayRange(dOv) });
  if (dDue) out.push({ key: "whelping", full: oneDayRange(dDue) });

  if (dDue && dGo) {
    out.push({ key: "puppyCare", full: { start: clampDay(dDue), end: clampDay(dGo) } });
  }
  if (dGo) out.push({ key: "goHomeNormal", full: oneDayRange(dGo) });

  return out;
}

/** Build once upstream: map raw plans to normalized windows */
export function normalizePlans(plans: PlanRow[]): NormalizedPlan[] {
  return plans.map((plan) => ({ plan, windows: windowsFromPlan(plan) }));
}

/* ───────── color hash for plan chips ───────── */
export function colorFromId(id: ID): string {
  const s = String(id);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  const hue = h % 360;
  return `hsl(${hue}deg 70% 45%)`;
}

/* ───────── stage list for the renderer ───────── */
export const GANTT_STAGES = [
  { key: "preBreeding",    label: "Pre-breeding Heat", baseColor: "#38bdf8", hatchLikely: true },
  { key: "hormoneTesting", label: "Hormone Testing",   baseColor: "#f59e0b", hatchLikely: true },
  { key: "breeding",       label: "Breeding",          baseColor: "#10b981" },
  { key: "whelping",       label: "Whelping",          baseColor: "#ef4444" },
  { key: "puppyCare",      label: "Puppy Care",        baseColor: "#6366f1", hatchLikely: true },
  { key: "goHomeNormal",   label: "Go Home",           baseColor: "#22c55e" },
] as const;
