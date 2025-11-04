// apps/breeding/src/components/MasterPlanGantt.tsx
import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt/Gantt";
import { Button, Input, SectionCard } from "@bhq/ui";

import {
  GANTT_STAGES,
  colorFromId,
  type ID,
  type PlanRow,
  type DamRepro,
  type AvailabilityBand,
} from "../adapters/ganttShared";
const PX_PER_MONTH = 160;

const keyOf = (id: ID) => String(id);
const inSet = (s: Set<ID>, id: ID) => {
  const needle = keyOf(id);
  for (const k of s) if (keyOf(k) === needle) return true;
  return false;
};

function ScrollX({ widthPx, children }: { widthPx: number; children: React.ReactNode }) {
  const min = Math.max(1200, widthPx);
  return (
    <div className="overflow-x-auto overflow-y-visible w-full" role="region" aria-label="Gantt timeline scroll" style={{ scrollbarGutter: "stable both-edges" }}>
      <div style={{ minWidth: min, width: widthPx }}>{children}</div>
    </div>
  );
}

function PlanPicker({
  items,
  selected,
  onChange,
}: {
  items: NormalizedPlan[];
  selected: Set<ID>;
  onChange: (next: Set<ID>) => void;
}) {
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(({ plan }) => `${plan.name} ${plan.status ?? ""}`.toLowerCase().includes(s));
  }, [items, q]);

  const allVisible = filtered.length > 0 && filtered.every(({ plan }) => inSet(selected, plan.id));
  const someVisible = filtered.some(({ plan }) => inSet(selected, plan.id)) && !allVisible;

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
    if (v) filtered.forEach(({ plan }) => next.add(plan.id));
    else {
      const needles = new Set(filtered.map(({ plan }) => keyOf(plan.id)));
      for (const k of Array.from(next)) if (needles.has(keyOf(k))) next.delete(k);
    }
    onChange(next);
  }
  function selectAll() {
    onChange(new Set<ID>(items.map(({ plan }) => plan.id)));
  }
  function clearAll() {
    onChange(new Set<ID>());
  }

  return (
    <div className="rounded-lg border border-hairline p-2 bg-surface" role="group" aria-label="Plan picker">
      <div className="flex items-center gap-2 mb-2">
        <label className="sr-only" htmlFor="plan-filter">Filter plans</label>
        <Input id="plan-filter" value={q} onChange={(e) => setQ(e.currentTarget.value)} placeholder="Filter plans…" className="h-8 w-64" />

        <Button size="sm" variant="outline" onClick={() => selectVisible(true)}>Select visible</Button>
        <Button size="sm" variant="outline" onClick={selectAll}>All</Button>
        <Button size="sm" variant="outline" onClick={clearAll}>Clear all</Button>

        <label className="ml-auto inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={allVisible}
            ref={(el) => { if (el) el.indeterminate = someVisible; }}
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
            {filtered.map(({ plan }) => {
              const checked = inSet(selected, plan.id);
              return (
                <li key={String(plan.id)} className="flex items-center gap-2">
                  <input id={`pick-${plan.id}`} type="checkbox" checked={checked} onChange={(e) => setChecked(plan.id, e.currentTarget.checked)} />
                  <label htmlFor={`pick-${plan.id}`} className="cursor-pointer text-sm flex items-center gap-2">
                    <span aria-hidden className="inline-block h-3 w-3 rounded-sm" style={{ background: colorFromId(plan.id) }} />
                    <span className="truncate max-w-[28ch]">{plan.name}</span>
                    {plan.status ? <span className="text-xs text-secondary">({plan.status})</span> : null}
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

export default function MasterPlanGantt({
  items = [],
  selected = new Set<ID>(),
  onSelectedChange = () => { },
  today = new Date(),
}: {
  items?: NormalizedPlan[]; // pre-normalized plans with windows
  selected?: Set<ID>;
  onSelectedChange?: (next: Set<ID>) => void;
  today?: Date;
}) {
  const shown = React.useMemo(
    () => items.filter(({ plan }) => inSet(selected, plan.id)),
    [items, selected]
  );

  // Horizon: union of expected spans for selected plans, padded by one month total
  const effectiveHorizon = React.useMemo<Range>(() => {
    const spans = shown.map((r) => expectedRangeOfWindows(r.windows));
    return padByOneMonth(unionRange(spans));
  }, [shown]);

  const flatData = React.useMemo<StageWindows[]>(() => {
    const out: StageWindows[] = [];
    for (const r of shown) for (const s of r.windows) out.push(s);
    return out;
  }, [shown]);

  const months = monthsBetween(effectiveHorizon.start, effectiveHorizon.end);
  const widthPx = Math.ceil(months * PX_PER_MONTH);

  return (
    <SectionCard title="Master planner">
      <div className="flex gap-3 flex-wrap items-start mb-3">
        <PlanPicker items={items} selected={selected} onChange={onSelectedChange} />
      </div>

      <ScrollX widthPx={widthPx}>
        <BHQGantt
          stages={GANTT_STAGES}
          data={flatData}
          horizon={effectiveHorizon}
          today={today}
          heightPerRow={26}
          showAvailability={false}
          fitToContent={false}
          className="bhq-gantt--no-aside rounded-lg border border-hairline"
        />
      </ScrollX>

      {(shown.length === 0 || flatData.length === 0) && (
        <div className="text-sm text-secondary px-1 mt-2">
          {shown.length === 0
            ? "No plans selected. Use the picker to choose plans to display."
            : "Selected plans do not have drawable bars yet. Lock a cycle or set placement dates to populate the timeline."}
        </div>
      )}
    </SectionCard>
  );
}
