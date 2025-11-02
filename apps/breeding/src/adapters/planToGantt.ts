// apps/breeding/src/adapters/planToGantt.ts
// Single source of truth for converting plans into chart-ready data.

export type ID = number | string;

export type Range = { start: Date; end: Date }; // inclusive end
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

/* ───────── general helpers ───────── */
const iso = (d?: string | null) => (d ? new Date(d) : null);
const clampDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
export const addDays = (dt: Date, days: number) =>
  new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + days);
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function oneDayRange(d: Date): Range {
  const s = clampDay(d);
  return { start: s, end: s };
}

export function monthsBetween(start: Date, end: Date) {
  const m =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  return Math.max(1, m);
}

export function padByOneMonth(r: Range): Range {
  // first day of month prior to start, last day of month after end
  const a = new Date(r.start.getFullYear(), r.start.getMonth() - 1, 1);
  const b = new Date(r.end.getFullYear(), r.end.getMonth() + 2, 0);
  return { start: a, end: b };
}

export function rangeOfWindows(ws: StageWindows[]): Range | null {
  if (!ws.length) return null;
  let s = ws[0].full.start;
  let e = ws[0].full.end;
  for (const w of ws) {
    if (w.full.start < s) s = w.full.start;
    if (w.full.end > e) e = w.full.end;
  }
  return { start: s, end: e };
}

/* ───────── windows builder (expected only) ─────────
   Keep this deterministic and free of UI concerns.
*/
export function windowsFromPlan(p: PlanRow): StageWindows[] {
  const out: StageWindows[] = [];

  const lock = p.lockedCycle ?? {};
  const dCycle = iso(lock.cycleStart);
  const dOv = iso(lock.ovulation);
  const dDue = iso(lock.due) || iso(p.expected_due);
  const dGo = iso(lock.goHome) || iso(p.expected_go_home);

  if (dCycle) out.push({ key: "preBreeding", full: oneDayRange(dCycle) });

  if (dCycle && dOv && !sameDay(dCycle, dOv)) {
    // Represent the expected test completion at ovulation
    out.push({ key: "hormoneTesting", full: oneDayRange(dOv) });
  }

  if (dOv) out.push({ key: "breeding", full: oneDayRange(dOv) });
  if (dDue) out.push({ key: "whelping", full: oneDayRange(dDue) });

  if (dDue && dGo) {
    out.push({
      key: "puppyCare",
      full: { start: clampDay(dDue), end: clampDay(dGo) },
    });
  }

  if (dGo) out.push({ key: "goHomeNormal", full: oneDayRange(dGo) });

  return out;
}

/* ───────── availability bands (placeholder) ─────────
   Keep this simple for now. You can replace with production logic.
*/
export type AvailabilityBand = {
  label: string;
  range: Range;
  kind: "unlikely" | "risky";
};

export function availabilityForPlan(_p: PlanRow): AvailabilityBand[] {
  // Implement your final rules here. Returning empty by default.
  return [];
}

/* ───────── color hash ───────── */
export function colorFromId(id: ID): string {
  const s = String(id);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  const hue = h % 360;
  return `hsl(${hue}deg 70% 45%)`;
}

/* ───────── stage list for the renderer ───────── */
export const GANTT_STAGES = [
  { key: "preBreeding", label: "Pre-breeding Heat", baseColor: "#38bdf8", hatchLikely: true },
  { key: "hormoneTesting", label: "Hormone Testing", baseColor: "#f59e0b", hatchLikely: true },
  { key: "breeding", label: "Breeding", baseColor: "#10b981" },
  { key: "whelping", label: "Whelping", baseColor: "#ef4444" },
  { key: "puppyCare", label: "Puppy Care", baseColor: "#6366f1", hatchLikely: true },
  { key: "goHomeNormal", label: "Go Home", baseColor: "#22c55e" },
] as const;
