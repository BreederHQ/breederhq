// apps/breeding/src/components/MasterPlanGantt.tsx
import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt/Gantt";
import type { Range, StageWindows } from "@bhq/ui/utils";
import { Button, Input, SectionCard } from "@bhq/ui";

// styling + ids/types only (no data builders from here)
import {
  GANTT_STAGES,
  colorFromId,
  type ID,
  type PlanRow,
  type DamRepro,
  type AvailabilityBand,
} from "../adapters/ganttShared";

// canonical, deterministic plan→windows
import { fromPlan as buildStageWindows } from "@bhq/ui/utils/breedingMath";
import { computeAvailabilityBands } from "@bhq/ui/utils/availability";

/* ───────────────── constants ───────────────── */
const NO_GUTTER: React.CSSProperties = { ["--gantt-right-gutter" as any]: "0px" };
const PX_PER_MONTH = 160;

/* ───────────────── helpers ───────────────── */
const keyOf = (id: ID) => String(id);
const inSet = (s: Set<ID>, id: ID) => {
  const needle = keyOf(id);
  for (const k of s) if (keyOf(k) === needle) return true;
  return false;
};

function monthsBetween(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function toDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
}

/** clamp to ≤1 month before first bar and ≤1 month after last bar */
function clampToOneMonthAroundData(h: Range, rows: StageWindows[]): Range {
  if (!rows.length) return h;
  let min = rows[0].full.start;
  let max = rows[0].full.end;
  for (const r of rows) {
    if (r.full.start < min) min = r.full.start;
    if (r.full.end > max) max = r.full.end;
  }
  const start = new Date(Math.max(addMonths(min, -1).getTime(), h.start.getTime()));
  const end = new Date(Math.min(addMonths(max, 1).getTime(), h.end.getTime()));
  return end > start ? { start, end } : h;
}

/** Normalize incoming plan into the shape the math expects */
function normalizePlan(raw: PlanRow): PlanRow & {
  species: "Dog" | "Cat" | "Horse" | "";
  lockedCycleStart?: Date;
  lockedOvulationDate?: Date;
  lockedDueDate?: Date;
} {
  const p: any = { ...raw };

  // snake_case → camelCase fallbacks
  if (p.locked_cycle_start && !p.lockedCycleStart) p.lockedCycleStart = p.locked_cycle_start;
  if (p.locked_ovulation_date && !p.lockedOvulationDate) p.lockedOvulationDate = p.locked_ovulation_date;
  if (p.locked_due_date && !p.lockedDueDate) p.lockedDueDate = p.locked_due_date;

  // Coerce all ISO strings to Dates
  p.lockedCycleStart = toDate(p.lockedCycleStart);
  p.lockedOvulationDate = toDate(p.lockedOvulationDate);
  p.lockedDueDate = toDate(p.lockedDueDate);
  p.lockedPlacementStartDate = toDate(p.lockedPlacementStartDate);
  p.expectedPlacementStart = toDate(p.expectedPlacementStart);
  p.expectedPlacementCompleted = toDate(p.expectedPlacementCompleted);

  // species default
  if (!p.species) p.species = "Dog";

  return p;
}

/**
 * Safety net: if the math builder returns no rows (version mismatch, etc.),
 * synthesize minimal windows from locked dates using the standing defaults:
 * - ovulation = cycle + 12 (if missing)
 * - birth full = ovulation +63 ±2
 * - puppy-care full = whelp-full-start → whelp-full-end + 8 weeks
 * - placement full = whelp-full-start + 8 weeks → whelp-full-end + 8 weeks
 * We only emit ranges that we can derive deterministically from available locks.
 */
function fallbackWindowsFromLocks(p: ReturnType<typeof normalizePlan>): StageWindows[] {
  const rows: StageWindows[] = [];

  const cycle = p.lockedCycleStart;
  const ovu = p.lockedOvulationDate ?? (cycle ? addDays(cycle, 12) : undefined);
  const due = p.lockedDueDate ?? (ovu ? addDays(ovu, 63) : undefined);

  // Only build when we have at least cycle (for testing/breeding) or ovulation (for due)
  if (cycle) {
    // Pre-breeding (approx) ends day before testing starts; here we just anchor to cycle window visually
    const preStart = addDays(cycle, -14);
    const preEnd = addDays(cycle, -1);
    rows.push({
      key: "prebreeding",
      label: "Pre-breeding Heat",
      full: { start: preStart, end: preEnd },
      likely: { start: addDays(preStart, 4), end: addDays(preEnd, -4) },
    } as any);

    // Hormone Testing: approx 7–10 days starting ~7 days before ovulation
    const testStart = ovu ? addDays(ovu, -7) : addDays(cycle, 5);
    const testEnd = addDays(testStart, 9);
    rows.push({
      key: "testing",
      label: "Hormone Testing",
      full: { start: testStart, end: testEnd },
      likely: { start: addDays(testStart, 1), end: addDays(testEnd, -1) },
    } as any);

    // Breeding: near ovulation, 0–1 day span
    const breedStart = ovu ?? addDays(cycle, 12);
    const breedEnd = addDays(breedStart, 1);
    rows.push({
      key: "breeding",
      label: "Breeding",
      full: { start: breedStart, end: breedEnd },
      likely: { start: breedStart, end: breedEnd },
    } as any);
  }

  if (due) {
    // birth full: due ±2 days; likely: ±1 day
    const wStart = addDays(due, -2);
    const wEnd = addDays(due, 2);
    rows.push({
      key: "birth",
      label: "birth",
      full: { start: wStart, end: wEnd },
      likely: { start: addDays(due, -1), end: addDays(due, 1) },
    } as any);

    // Puppy Care: whelp full span → +8 weeks
    const pcStart = wStart;
    const pcEnd = addDays(wEnd, 56);
    rows.push({
      key: "puppycare",
      label: "Puppy Care",
      full: { start: pcStart, end: pcEnd },
      likely: { start: pcStart, end: pcEnd },
    } as any);

    // Placement (Normal): 8 weeks after whelp full start (single-day window rendered as minimal span)
    const Placement = addDays(wStart, 56);
    rows.push({
      key: "placement",
      label: "Placement",
      full: { start: Placement, end: addDays(Placement, 1) },
      likely: { start: Placement, end: addDays(Placement, 1) },
    } as any);
  }

  return rows;
}

function ScrollX({ widthPx, children }: { widthPx: number; children: React.ReactNode }) {
  const min = Math.max(1200, widthPx);
  return (
    <div
      className="overflow-x-auto overflow-y-visible w-full"
      role="region"
      aria-label="Gantt timeline scroll"
      style={{ scrollbarGutter: "stable both-edges" }}
    >
      <div style={{ minWidth: min, width: widthPx }}>{children}</div>
    </div>
  );
}

/* ───────────────── Plan Picker ───────────────── */
function PlanPicker({
  plans,
  selected,
  onChange,
}: {
  plans: PlanRow[];
  selected: Set<ID>;
  onChange: (next: Set<ID>) => void;
}) {
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return plans;
    return plans.filter((p) => `${p.name} ${p.status}`.toLowerCase().includes(s));
  }, [plans, q]);

  const allVisible = filtered.length > 0 && filtered.every((p) => inSet(selected, p.id));
  const someVisible = filtered.some((p) => inSet(selected, p.id)) && !allVisible;

  function setChecked(id: ID, checked: boolean) {
    const next = new Set<ID>(selected);
    if (checked) next.add(id);
    else {
      const needle = keyOf(id);
      for (const k of Array.from(next)) if (keyOf(k) === needle) next.delete(k);
    }
    onChange(next);
  }
  function selectVisible(v: boolean) {
    const next = new Set<ID>(selected);
    if (v) filtered.forEach((p) => next.add(p.id));
    else {
      const needles = new Set(filtered.map((p) => keyOf(p.id)));
      for (const k of Array.from(next)) if (needles.has(keyOf(k))) next.delete(k);
    }
    onChange(next);
  }
  function selectAll() {
    onChange(new Set<ID>(plans.map((p) => p.id)));
  }
  function clearAll() {
    onChange(new Set<ID>());
  }

  return (
    <div className="rounded-lg border border-hairline p-2 bg-surface" role="group" aria-label="Plan picker">
      <div className="flex items-center gap-2 mb-2">
        <label className="sr-only" htmlFor="plan-filter">Filter plans</label>
        <Input
          id="plan-filter"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          placeholder="Filter plans…"
          className="h-8 w-64"
        />
        <Button size="sm" variant="outline" onClick={() => selectVisible(true)}>Select visible</Button>
        <Button size="sm" variant="outline" onClick={selectAll}>All</Button>
        <Button size="sm" variant="outline" onClick={clearAll}>Clear all</Button>

        <label className="ml-auto inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allVisible}
            ref={(el) => {
              if (el) el.indeterminate = someVisible;
            }}
            onChange={(e) => selectVisible(e.currentTarget.checked)}
          />
          <span className="text-sm">Toggle visible</span>
        </label>
      </div>

      <div className="max-h-44 overflow-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-sm text-secondary px-1 py-2">No plans match your filter.</div>
        ) : (
          <ul className="space-y-1">
            {filtered.map((p) => {
              const checked = inSet(selected, p.id);
              return (
                <li key={String(p.id)} className="flex items-center gap-2">
                  <input
                    id={`pick-${p.id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setChecked(p.id, e.currentTarget.checked)}
                  />
                  <label htmlFor={`pick-${p.id}`} className="cursor-pointer text-sm flex items-center gap-2">
                    <span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: colorFromId(p.id) }} />
                    <span className="truncate max-w-[28ch]">{p.name}</span>
                    <span className="text-xs text-secondary">({p.status || "—"})</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ───────────────── Main ───────────────── */
export default function MasterPlanGantt({
  plans = [],
  selected = new Set<ID>(),
  onSelectedChange = () => {},
  availabilityOn = false,
  onAvailabilityToggle = () => {},
  damReproByPlan = {},
  horizon,
  today = new Date(),
}: {
  plans?: PlanRow[];
  damReproByPlan?: Record<string | number, DamRepro>;
  horizon: Range;
  today?: Date;
  availabilityOn?: boolean;
  onAvailabilityToggle?: (v: boolean) => void;
  selected?: Set<ID>;
  onSelectedChange?: (next: Set<ID>) => void;
}) {
  const shown = React.useMemo(() => plans.filter((p) => inSet(selected, p.id)), [plans, selected]);

  const { stageData, availabilityData } = React.useMemo(() => {
    const stage: StageWindows[] = [];
    const avail: AvailabilityBand[] = [];

    for (const raw of shown) {
      const plan = normalizePlan(raw);

      // try canonical builder first
      let tmp: any;
      try {
        tmp = buildStageWindows(plan);
      } catch (e) {
        console.warn("[MasterPlanGantt] fromPlan threw", { id: plan?.id, e });
        tmp = undefined;
      }

      // normalize possible return shapes
      let rows: StageWindows[] =
        Array.isArray(tmp) ? tmp : Array.isArray(tmp?.windows) ? tmp.windows : [];

      // if still empty and we have a locked cycle, synthesize conservative windows
      if ((!rows || rows.length === 0) && plan.lockedCycleStart) {
        rows = fallbackWindowsFromLocks(plan);
      }

      if (!rows || rows.length === 0) {
        console.warn("[MasterPlanGantt] No rows for plan:", {
          id: plan?.id,
          name: plan?.name,
          species: plan?.species,
          lockedCycleStart: plan.lockedCycleStart,
          lockedOvulationDate: plan.lockedOvulationDate,
          lockedDueDate: plan.lockedDueDate,
        });
      } else {
        for (const r of rows) stage.push({ ...r, __tooltip: `${plan.name}` } as any);
        try {
          const color = colorFromId(plan.id);
          const bands = computeAvailabilityBands(rows, horizon);
          bands.forEach((b: any) => avail.push({ ...b, __color: color }));
        } catch {
          /* ignore */
        }
      }
    }

    return { stageData: stage, availabilityData: avail };
  }, [shown, horizon]);

  const effectiveHorizon = React.useMemo(
    () => (stageData.length ? clampToOneMonthAroundData(horizon, stageData) : horizon),
    [horizon, stageData]
  );

  const months = monthsBetween(effectiveHorizon.start, effectiveHorizon.end);
  const widthPx = Math.ceil(months * PX_PER_MONTH);

  return (
    <SectionCard title="Planner view" className="space-y-3">
      <ScrollX widthPx={widthPx}>
        <BHQGantt
          title={undefined}
          stages={GANTT_STAGES}
          data={stageData}
          availability={availabilityOn ? (availabilityData as any) : []}
          horizon={effectiveHorizon}
          today={today}
          heightPerRow={26}
          showAvailability={availabilityOn}
          fitToContent={false}
          style={NO_GUTTER}
          className="bhq-gantt--no-aside rounded-lg border border-hairline"
        />
      </ScrollX>

      {(shown.length === 0 || stageData.length === 0) && (
        <div className="text-sm text-secondary px-1">
          {shown.length === 0
            ? "No plans selected. Use the picker to choose plans to display."
            : "Selected plans do not have drawable bars yet. Lock a cycle or set placement dates to populate the timeline."}
        </div>
      )}

      <div className="flex gap-3 flex-wrap items-start">
        <PlanPicker plans={plans as any} selected={selected} onChange={onSelectedChange} />
        <div className="ml-auto flex items-center gap-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={availabilityOn}
              onChange={(e) => onAvailabilityToggle(e.currentTarget.checked)}
            />
            <span className="text-sm">Show availability wrappers</span>
          </label>
        </div>
      </div>
    </SectionCard>
  );
}
