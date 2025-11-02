import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt/Gantt";
import type { Range } from "@bhq/ui/utils";
import { Button, Input, SectionCard } from "@bhq/ui";

// styling + ids/types only (no data builders from here)
import {
  GANTT_STAGES,
  windowsFromPlan,
  rangeOfWindows,
  padByOneMonth,
  monthsBetween,
  type PlanRow,
  type StageWindows,
} from "../adapters/planToGantt";

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
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
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
  onSelectedChange = () => { },
  availabilityOn = false,
  onAvailabilityToggle = () => { },
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
  // Variant toggles, persisted locally
  const [phaseOn, setPhaseOn] = React.useState<boolean>(() => {
    try { return localStorage.getItem("BHQ_BREEDING_SHOW_GANTT_PHASE") !== "0"; } catch { return true; }
  });
  const [anchorOn, setAnchorOn] = React.useState<boolean>(() => {
    try { return localStorage.getItem("BHQ_BREEDING_SHOW_GANTT_ANCHOR") === "1"; } catch { return false; }
  });

  const shown = React.useMemo(() => plans.filter((p) => inSet(selected, p.id)), [plans, selected]);

  const { stageData, availabilityData } = React.useMemo(() => {
    const stage: StageWindows[] = [];
    const avail: AvailabilityBand[] = [];

    for (const raw of shown) {
      // Delegate all normalization and math to the shared adapter
      const rows = windowsFromPlan(raw) as StageWindows[];

      if (!rows?.length) {
        console.warn("[MasterPlanGantt] No rows for plan:", { id: raw?.id, name: raw?.name });
        continue;
      }

      for (const r of rows) stage.push({ ...r, __tooltip: `${raw.name}` } as any);

      try {
        const color = colorFromId(raw.id);
        const bands = computeAvailabilityBands(rows) as any[];
        bands.forEach((b) => {
          const variant = b.variant || b.shape || (b.anchor ? "anchor" : "phase");
          avail.push({ ...b, variant, __color: color } as any);
        });
      } catch {
        /* ignore */
      }
    }

    return { stageData: stage, availabilityData: avail };
  }, [shown]);

  const shownAvailability = React.useMemo(() => {
    return availabilityOn
      ? (availabilityData as any[]).filter(
        (b: any) => (phaseOn && b.variant === "phase") || (anchorOn && b.variant === "anchor")
      )
      : [];
  }, [availabilityData, availabilityOn, phaseOn, anchorOn]);

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
          availability={shownAvailability as any}
          horizon={effectiveHorizon}
          today={today}
          heightPerRow={26}
          showAvailability={phaseOn || anchorOn}
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
        <div className="ml-auto flex items-center gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={phaseOn}
              onChange={(e) => {
                const v = e.currentTarget.checked;
                setPhaseOn(v);
                try { localStorage.setItem("BHQ_BREEDING_SHOW_GANTT_PHASE", v ? "1" : "0"); } catch { }
              }}
            />
            <span className="text-sm">Phase-wide</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={anchorOn}
              onChange={(e) => {
                const v = e.currentTarget.checked;
                setAnchorOn(v);
                try { localStorage.setItem("BHQ_BREEDING_SHOW_GANTT_ANCHOR", v ? "1" : "0"); } catch { }
              }}
            />
            <span className="text-sm">Anchor</span>
          </label>
        </div>
      </div>
    </SectionCard>
  );
}
