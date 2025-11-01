import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt/Gantt";
import type { Range, StageWindows } from "@bhq/ui/utils";
import {
  GANTT_STAGES,
  windowsFromPlan,
  monthsBetween,
  type AvailabilityBand,
  type PlanRow,
  type DamRepro,
} from "../adapters/ganttShared";
import { computeAvailabilityBands } from "@bhq/ui/utils/availability";

const LEFT_LABEL_W = 160;
const PX_PER_MONTH = 160;

/* tight horizon utilities */
function clamp(v: Date, min: Date, max: Date) {
  return new Date(Math.min(Math.max(+v, +min), +max));
}
function addMonths(d: Date, m: number) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + m);
  return dt;
}
function computeTightHorizon(stageData: StageWindows[], fallback: Range, padLeadMonths = 1, padTailMonths = 1): Range {
  if (!stageData.length) return fallback;
  let min = new Date(8640000000000000); // max
  let max = new Date(-8640000000000000); // min
  for (const row of stageData) {
    const s = new Date(row.full.start);
    const e = new Date(row.full.end);
    if (!Number.isNaN(+s)) min = s < min ? s : min;
    if (!Number.isNaN(+e)) max = e > max ? e : max;
  }
  if (+max < +min) return fallback;
  const lead = addMonths(min, -padLeadMonths);
  const tail = addMonths(max, padTailMonths);
  return {
    start: clamp(lead, new Date(fallback.start), new Date(fallback.end)),
    end: clamp(tail, new Date(fallback.start), new Date(fallback.end)),
  };
}

function ScrollX({ widthPx, children }: { widthPx: number; children: React.ReactNode }) {
  const min = Math.max(LEFT_LABEL_W + 600, widthPx);
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

type Props = {
  plan: PlanRow;
  damRepro?: DamRepro;
  /** Optional override. If not provided, horizon is computed from plan windows with 1 month padding */
  horizon?: Range;
  today?: Date;
  showAvailability?: boolean;
  title?: string;
};

export default function PerPlanGantt({
  plan,
  horizon: horizonProp,
  today = new Date(),
  showAvailability = true,
  title = plan?.name || "Plan",
}: Props) {
  // rules: deterministic windows come from the adapter
  const stageData = React.useMemo<StageWindows[]>(() => windowsFromPlan(plan), [plan]);

  // if parent gave a horizon, respect it. otherwise compute a tight one
  const fallbackHorizon = React.useMemo<Range>(() => {
    // reasonable wide default if adapter returned nothing
    const now = new Date();
    return { start: addMonths(now, -3), end: addMonths(now, 9) };
  }, []);
  const horizon = React.useMemo<Range>(() => {
    const base = horizonProp ?? fallbackHorizon;
    return computeTightHorizon(stageData, base, 1, 1);
  }, [horizonProp, fallbackHorizon, stageData]);

  // availability wrappers based on stage windows
  const availability = React.useMemo<AvailabilityBand[]>(() => {
    if (!showAvailability) return [];
    try {
      return computeAvailabilityBands(stageData, horizon) as unknown as AvailabilityBand[];
    } catch {
      return [];
    }
  }, [stageData, showAvailability, horizon]);

  const months = monthsBetween(horizon.start, horizon.end);
  const contentW = Math.ceil(months * PX_PER_MONTH);
  const plotW = LEFT_LABEL_W + contentW;

  return (
    <ScrollX widthPx={plotW}>
      <BHQGantt
        title={title}
        stages={GANTT_STAGES}
        data={stageData}
        availability={availability}
        horizon={horizon}
        today={today}
        heightPerRow={28}
        showAvailability={showAvailability}
        fitToContent={true}
        rightGutter={0}
        className="rounded-lg border border-hairline bhq-gantt--freeze-left"
        style={{ ["--gantt-left-sticky" as any]: `${LEFT_LABEL_W}px` }}
      />
    </ScrollX>
  );
}
