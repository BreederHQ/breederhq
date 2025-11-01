// apps/breeding/src/adapters/ganttShared.ts
import { z } from "zod";
import type { Range, StageWindows } from "@bhq/ui/utils";
import { computeAvailabilityBands } from "@bhq/ui/utils/availability";

/* ───────── shared types ───────── */
export type ID = number | string;

export type PlanRow = {
  id: ID;
  name: string;
  status: string;
  species: "Dog" | "Cat" | "Horse" | "";
  damId?: number | null;
  sireId?: number | null;

  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  lockedDueDate?: string | null;

  // Placement fields
  lockedPlacementStartDate?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;

  // legacy projections that may still exist on some data
  expectedDue?: string | null;
  expectedWeaned?: string | null;

  // optional projected next cycle date if not locked
  expectedNextCycleStart?: string | Date | null;
};

export type DamReproEvent = { kind: string; date: string };
export type DamRepro = { last_heat: string | null; repro?: DamReproEvent[] };

export type AvailabilityBand = {
  kind: "risk" | "unlikely";
  range: Range;
  label?: string;
  __color?: string;   // row color echo
  __planId?: string;  // disambiguate ownership
};

/* ───────── visuals/stage list ───────── */
export const GANTT_STAGES = [
  { key: "prebreeding", label: "Pre-breeding Heat", baseColor: "var(--stage-pre)" },
  { key: "testing", label: "Hormone Testing", baseColor: "var(--stage-test)" },
  { key: "breeding", label: "Breeding", baseColor: "var(--stage-breed)" },
  { key: "whelping", label: "Whelping", baseColor: "var(--stage-whelp)" },
  { key: "puppycare", label: "Puppy Care", baseColor: "var(--stage-puppy)" },
  { key: "placement", label: "Placement", baseColor: "var(--stage-place)" },
  { key: "placementx", label: "Placement (Extended)", baseColor: "var(--stage-placex)" },
] as const;

/* ───────── helpers ───────── */
export function colorFromId(id: ID): string {
  // stable hash → HSL
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 50%)`;
}
export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const toDate = (v: string | Date | null | undefined) =>
  v ? (v instanceof Date ? v : new Date(v)) : null;

function collectExtents(rows: StageWindows[]) {
  let earliest: Date | null = null;
  let latest: Date | null = null;
  for (const r of rows) {
    for (const v of Object.values(r as any)) {
      const start = (v as any)?.start;
      const end = (v as any)?.end;
      if (!(start instanceof Date) || !(end instanceof Date)) continue;
      if (!earliest || start < earliest) earliest = start;
      if (!latest || end > latest) latest = end;
    }
  }
  return { earliest, latest };
}

/* ───────── deterministic data rules ───────── */

/**
 * Returns stage rows for a single plan.
 * If the plan has no locked cycle and no real stage ranges, this returns [].
 * All returned rows are cloned and tagged with __planId so they can never bleed across plans.
 *
 * This wrapper exists so all callers use the same rule surface even if the internal math evolves.
 */
export function stageRowsForPlan(plan: PlanRow): StageWindows[] {
  const rows = internalWindowsFromPlan(plan); // calls the real math in one place
  const planId = String(plan.id);
  return rows.map((r) => ({ ...(r as any), __planId: planId, __tooltip: plan.name } as any));
}

/**
 * Returns availability wrappers for a single plan.
 * If there are no stage rows and the plan exposes a projected next cycle start, emit a one-day marker.
 */
export function availabilityForPlan(
  plan: PlanRow,
  rows: StageWindows[],
  horizon: Range
): AvailabilityBand[] {
  const out: AvailabilityBand[] = [];
  const planId = String(plan.id);
  const color = colorFromId(plan.id);

  if (rows.length) {
    try {
      const bands = computeAvailabilityBands(rows, horizon);
      for (const b of bands as any[]) out.push({ ...b, __color: color, __planId: planId });
    } catch {
      // swallow per plan
    }
  } else {
    const projected =
      toDate(plan.expectedNextCycleStart) ??
      toDate((plan as any).expectedCycleStart) ??
      toDate((plan as any).nextCycleStart) ??
      toDate((plan as any).projectedCycleStart);
    if (projected) {
      out.push({
        kind: "unlikely",
        range: { start: projected, end: addDays(projected, 1) },
        label: `${plan.name}: Next cycle start`,
        __color: color,
        __planId: planId,
      });
    }
  }
  return out;
}

/**
 * Tighten horizon to show no more than leadMonths before the earliest plotted thing.
 * If nothing is plotted, returns the baseHorizon unchanged.
 */
export function tightenHorizonForData(
  baseHorizon: Range,
  stageData: StageWindows[],
  availabilityData: AvailabilityBand[],
  leadMonths = 1
): Range {
  let earliest: Date | null = null;
  let latest: Date | null = null;

  const ext = collectExtents(stageData);
  earliest = ext.earliest;
  latest = ext.latest;

  for (const a of availabilityData) {
    if (!earliest || a.range.start < earliest) earliest = a.range.start;
    if (!latest || a.range.end > latest) latest = a.range.end;
  }

  if (!earliest) return baseHorizon;

  const start = new Date(earliest);
  start.setMonth(start.getMonth() - leadMonths);

  const end = latest ? new Date(Math.max(baseHorizon.end.getTime(), latest.getTime())) : baseHorizon.end;
  return {
    start: new Date(Math.max(baseHorizon.start.getTime(), start.getTime())),
    end,
  };
}

/* ───────── internal windows math entrypoint ─────────
   Centralize the call here so there is only one place to alter rules.
   Replace the body with your real windows computation if needed.
*/
function internalWindowsFromPlan(plan: PlanRow): StageWindows[] {
  // If you already have a working windows generator elsewhere, import and call it here.
  // Example:
  //   return biologyWindowsFromPlan(plan);
  //
  // For now, respect only locked signals and placement dates.
  const ov = toDate(plan.lockedOvulationDate);
  const due = toDate(plan.lockedDueDate);
  const cycle = toDate(plan.lockedCycleStart);

  const placementStart = toDate(plan.lockedPlacementStartDate) ?? toDate(plan.expectedPlacementStart);
  const placementEnd = toDate(plan.expectedPlacementCompleted);

  const rows: any[] = [];

  // Minimal conservative rows. Your real math likely fills prebreeding/testing/breeding/whelping/puppycare.
  if (cycle && ov && due) {
    rows.push({
      prebreeding: { start: addDays(cycle, -10), end: addDays(ov, -1) },
      testing: { start: addDays(cycle, -5), end: ov },
      breeding: { start: ov, end: addDays(ov, 1) },
      whelping: { start: addDays(due, -2), end: addDays(due, 2) },
      puppycare: { start: due, end: addDays(due, 56) },
      placement: placementStart && placementEnd ? { start: placementStart, end: placementEnd } : undefined,
      placementx: undefined,
    });
  } else if (placementStart && placementEnd) {
    rows.push({
      placement: { start: placementStart, end: placementEnd },
    });
  }

  return rows as StageWindows[];
}
