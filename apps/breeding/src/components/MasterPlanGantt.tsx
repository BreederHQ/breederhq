// apps/breeding/src/components/MasterPlanGantt.tsx
import * as React from "react";
import BHQGantt, { type BHQGanttStage } from "@bhq/ui/components/Gantt/Gantt";
import type { Range, StageWindows } from "@bhq/ui/utils";
import { Button, Input } from "@bhq/ui";

type ID = number | string;

type PlanRow = {
  id: ID;
  name: string;
  status: string;
  species: "Dog" | "Cat" | "Horse" | "";
  damId?: number | null;
  sireId?: number | null;

  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  lockedDueDate?: string | null;

  // Placement fields only
  lockedPlacementStartDate?: string | null;
  expectedPlacementStart?: string | null;
  expectedPlacementCompleted?: string | null;

  // optional projections still used elsewhere
  expectedDue?: string | null;
  expectedWeaned?: string | null;
};

type DamReproEvent = { kind: string; date: string };
type DamRepro = { last_heat: string | null; repro: DamReproEvent[] };

type AvailabilityBand = {
  kind: "risky" | "unlikely";
  range: Range;
  label?: string;
  __variant?: "wrap" | "spike" | "focus" | "lane" | "context";
  __color?: string;
};

function colorFromId(id: ID) {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 70% 52%)`;
}
function toDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return Number.isFinite(dt.getTime()) ? dt : null;
}
function clampToHorizon(r: Range, h: Range): Range {
  const start = r.start < h.start ? h.start : r.start;
  const end = r.end > h.end ? h.end : r.end;
  return { start, end };
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function monthsBetween(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}

/* rows in the chart */
const STAGES: BHQGanttStage[] = [
  { key: "preBreeding", label: "Pre-breeding", baseColor: "#94a3b8", hatchLikely: true },
  { key: "hormoneTesting", label: "Hormone testing", baseColor: "#38bdf8", hatchLikely: true },
  { key: "breeding", label: "Breeding", baseColor: "#f59e0b" },
  { key: "whelping", label: "Whelping", baseColor: "#ef4444" },
  { key: "puppyCare", label: "Puppy care", baseColor: "#22c55e", hatchLikely: true },
  { key: "goHomeNormal", label: "Placement", baseColor: "#a78bfa" },
  { key: "goHomeExtended", label: "Placement (Extended)", baseColor: "#8b5cf6" },
];

function labelForStageKey(k: string) {
  switch (k) {
    case "preBreeding": return "Pre-breeding window";
    case "hormoneTesting": return "Hormone testing window";
    case "breeding": return "Breeding window";
    case "whelping": return "Whelping window";
    case "puppyCare": return "Puppy care window";
    case "goHomeNormal": return "Placement";
    case "goHomeExtended": return "Placement (Extended)";
    default: return k;
  }
}

import {
  fromPlan,
  type Species as MathSpecies,
} from "@bhq/ui/utils/breedingMath";

function toMathSpecies(s: PlanRow["species"]): MathSpecies {
  switch ((s || "").toUpperCase()) {
    case "DOG": case "D": case "DOGS": return "DOG";
    case "CAT": case "C": case "CATS": return "CAT";
    case "HORSE": case "H": case "HORSES": return "HORSE";
    default: return "DOG";
  }
}
function safeDate(x?: string | null) {
  if (!x) return null;
  const d = new Date(x);
  return Number.isFinite(d.getTime()) ? d : null;
}

/** Build StageWindows using species rules, then overlay explicit placement dates. */
function windowsFromPlan(p: PlanRow): StageWindows[] {
  const out: StageWindows[] = [];

  // Biology windows if we have a locked cycle
  if (p.lockedCycleStart) {
    const heat = new Date(p.lockedCycleStart);
    const species = toMathSpecies(p.species);
    const math = fromPlan({
      species,
      earliestHeatStart: heat,
      latestHeatStart: heat,
      ovulationDate: safeDate(p.lockedOvulationDate) ?? undefined,
    });
    for (const s of math.stages) {
      out.push({ key: s.key, full: s.full, likely: s.likely });
    }
  }

  // Placement overlay from new fields
  const placement = safeDate(p.lockedPlacementStartDate) ?? safeDate(p.expectedPlacementStart);
  const placementExt = safeDate(p.expectedPlacementCompleted);

  if (placement) {
    const i = out.findIndex((s) => s.key === "goHomeNormal");
    const node: StageWindows = { key: "goHomeNormal", full: { start: placement, end: placement } };
    if (i >= 0) out[i] = node; else out.push(node);
  }
  if (placement && placementExt && placementExt >= placement) {
    const i = out.findIndex((s) => s.key === "goHomeExtended");
    const node: StageWindows = { key: "goHomeExtended", full: { start: placement, end: placementExt } };
    if (i >= 0) out[i] = node; else out.push(node);
  }

  if (!p.lockedCycleStart && out.length === 0 && placement) {
    out.push({ key: "goHomeNormal", full: { start: placement, end: placement } });
    if (placementExt && placementExt >= placement) {
      out.push({ key: "goHomeExtended", full: { start: placement, end: placementExt } });
    }
  }
  return out;
}

/* availability bands */
function availabilityBands(
  p: PlanRow,
  repro: DamRepro | undefined,
  horizon: Range
): AvailabilityBand[] {
  if (!p.lockedCycleStart) return [];

  const bands: AvailabilityBand[] = [];
  const ovul = toDate(p.lockedOvulationDate);
  const due = toDate(p.lockedDueDate ?? p.expectedDue);
  const placementStart = toDate(p.lockedPlacementStartDate ?? p.expectedPlacementStart);
  const placementEnd = toDate(p.expectedPlacementCompleted);

  const testStart = ovul ? addDays(ovul, -7) : toDate(p.lockedCycleStart);
  const endAnchor = placementEnd ?? placementStart ?? due ?? ovul ?? toDate(p.lockedCycleStart);

  if (testStart && endAnchor && testStart <= endAnchor) {
    bands.push({
      kind: "unlikely",
      range: clampToHorizon({ start: testStart, end: endAnchor }, horizon),
      label: "Availability window",
      __variant: "wrap",
    });
  }
  if (ovul) {
    bands.push({
      kind: "risky",
      range: clampToHorizon({ start: ovul, end: addDays(ovul, 1) }, horizon),
      label: "Breeding focus",
      __variant: "spike",
    });
  }
  if (due) {
    bands.push({
      kind: "risky",
      range: clampToHorizon({ start: addDays(due, -2), end: addDays(due, 2) }, horizon),
      label: "Whelping focus",
      __variant: "focus",
    });
  }
  if (due && placementStart && due <= placementStart) {
    bands.push({
      kind: "unlikely",
      range: clampToHorizon({ start: due, end: placementStart }, horizon),
      label: "Puppy care",
      __variant: "lane",
    });
  }
  if (placementStart && placementEnd && placementStart < placementEnd) {
    bands.push({
      kind: "unlikely",
      range: clampToHorizon({ start: placementStart, end: placementEnd }, horizon),
      label: "Extended placement",
      __variant: "lane",
    });
  }
  if (repro?.last_heat && ovul) {
    const last = toDate(repro.last_heat);
    if (last && last < ovul) {
      bands.push({
        kind: "unlikely",
        range: clampToHorizon({ start: last, end: ovul }, horizon),
        label: "Last heat → ovulation",
        __variant: "context",
      });
    }
  }

  return bands;
}

/* scroll container */
function ScrollX({ widthPx, children }: { widthPx: number; children: React.ReactNode }) {
  const min = Math.max(1200, widthPx);
  return (
    <div className="overflow-x-auto overflow-y-visible w-full" role="region" aria-label="Gantt timeline scroll">
      <div style={{ minWidth: min, width: "100%" }}>{children}</div>
    </div>
  );
}

/* plan picker */
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

  const allChecked = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someChecked = filtered.some((p) => selected.has(p.id)) && !allChecked;

  return (
    <div className="rounded-lg border border-hairline p-2 bg-surface" role="group" aria-label="Plan picker">
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor="plan-filter">Filter plans</label>
        <Input
          id="plan-filter"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          placeholder="Filter plans…"
          className="h-8 w-64"
          aria-label="Filter plans"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const next = new Set(selected);
            if (allChecked) filtered.forEach((p) => next.delete(p.id));
            else filtered.forEach((p) => next.add(p.id));
            onChange(next);
          }}
          aria-pressed={someChecked || allChecked}
          aria-label={allChecked ? "Clear visible plans" : "Select visible plans"}
        >
          {allChecked ? "Clear visible" : "Select visible"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const next = new Set<ID>();
            plans.forEach((p) => next.add(p.id));
            onChange(next);
          }}
          aria-label="Select all plans"
        >
          All
        </Button>
        <Button size="sm" variant="outline" onClick={() => onChange(new Set<ID>())} aria-label="Clear all plans">
          Clear
        </Button>
      </div>

      <div className="mt-2 max-h-56 overflow-auto pr-1" role="list" aria-label="Plans">
        {filtered.map((p) => {
          const checked = selected.has(p.id);
          const checkboxId = `plan-cb-${p.id}`;
          return (
            <label
              key={p.id}
              htmlFor={checkboxId}
              className="flex items-center gap-2 py-1 px-1 rounded hover:bg-white/5 cursor-pointer"
              role="listitem"
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.currentTarget.checked) next.add(p.id);
                  else next.delete(p.id);
                  onChange(next);
                }}
                aria-label={`Toggle plan ${p.name}`}
              />
              <span className="truncate">
                <span className="font-medium">{p.name}</span>
                <span className="text-secondary text-xs ml-2">{p.status}</span>
              </span>
              <span className="ml-auto w-3 h-3 rounded" style={{ background: colorFromId(p.id) }} aria-hidden />
            </label>
          );
        })}
        {filtered.length === 0 && <div className="text-sm text-secondary px-1 py-2">No plans</div>}
      </div>
    </div>
  );
}

/* ───────────────── main ───────────────── */
export default function MasterPlanGantt({
  plans,
  damReproByPlan,
  horizon,
  today = new Date(),
  availabilityOn,
  onAvailabilityToggle,
  selected,
  onSelectedChange,
}: {
  plans: PlanRow[];
  damReproByPlan?: Record<string | number, DamRepro>;
  horizon: Range;
  today?: Date;
  availabilityOn: boolean;
  onAvailabilityToggle: (v: boolean) => void;
  selected: Set<ID>;
  onSelectedChange: (next: Set<ID>) => void;
}) {
  const shown = React.useMemo(() => plans.filter((p) => selected.has(p.id)), [plans, selected]);
  const derivedHorizon = horizon;

  const { stageData, availabilityData } = React.useMemo(() => {
    const stageData: StageWindows[] = [];
    const availabilityData: AvailabilityBand[] = [];

    for (const p of shown) {
      const color = colorFromId(p.id);

      const rows = windowsFromPlan(p);
      for (const r of rows) {
        stageData.push({
          key: r.key as any,
          full: r.full,
          likely: r.likely,
          __tooltip: `${p.name} • ${labelForStageKey(r.key)}`,
        } as any);
      }

      const repro = damReproByPlan?.[p.id as any];
      const bands = availabilityBands(p, repro, derivedHorizon);
      bands.forEach((b) => {
        availabilityData.push({ ...b, __color: color });
      });
    }

    return { stageData, availabilityData };
  }, [shown, damReproByPlan, derivedHorizon]);

  const months = monthsBetween(derivedHorizon.start, derivedHorizon.end);
  const pxPerMonth = 160;
  const widthPx = Math.ceil(months * pxPerMonth);

  return (
    <div className="space-y-3" aria-label="Master Plan Gantt">
      <div className="flex flex-wrap items-center gap-3">
        <PlanPicker plans={plans} selected={selected} onChange={onSelectedChange} />
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={availabilityOn}
              onChange={(e) => onAvailabilityToggle(e.currentTarget.checked)}
              aria-label="Toggle availability wrappers"
            />
            <span className="text-sm">Show availability wrappers</span>
          </label>
        </div>
      </div>

      <ScrollX widthPx={widthPx}>
        <BHQGantt
          title="Master Plan"
          stages={STAGES}
          data={stageData}
          availability={availabilityOn ? availabilityData : []}
          horizon={derivedHorizon}
          today={today}
          heightPerRow={28}
          showAvailability={availabilityOn}
          fitToContent={false}
          className="rounded-lg border border-hairline"
        />
      </ScrollX>
    </div>
  );
}
