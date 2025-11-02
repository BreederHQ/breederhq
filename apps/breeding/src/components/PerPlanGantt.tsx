// apps/breeding/src/components/PerPlanGantt.tsx
import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt/Gantt";
import type { Range, StageWindows } from "@bhq/ui/utils";
import {
  GANTT_STAGES,
  windowsFromPlan,
  rangeOfWindows,
  padByOneMonth,
  monthsBetween,
  type PlanRow,
} from "../adapters/planToGantt";

const LEFT_LABEL_W = 160;
const PX_PER_MONTH = 160;

function addMonths(d: Date, m: number) {
  const dt = new Date(d);
  dt.setMonth(dt.getMonth() + m);
  return dt;
}

type Props = {
  /** Pass the raw Prisma BreedingPlan as received from your API */
  plan: any;
  today?: Date;
  showAvailability?: boolean;
  title?: string;
  horizon?: Range; // optional override
};

export default function PerPlanGantt({
  plan: rawPlan,
  today = new Date(),
  showAvailability = true,
  title,
  horizon: horizonOverride,
}: Props) {
  // 1) Normalize Prisma → canonical PlanRow
  const plan: PlanRow = React.useMemo(() => toPlanRow(rawPlan), [rawPlan]);

  // 2) Build deterministic stage rows
  const stageData = React.useMemo<StageWindows[]>(() => windowsFromPlan(plan), [plan]);

  // 3) Horizon per plan, padded 1 month each side, with a safe fallback
  const fallbackHorizon = React.useMemo<Range>(() => {
    const now = new Date();
    return { start: addMonths(now, -3), end: addMonths(now, 9) };
  }, []);
  const horizon = React.useMemo<Range>(() => {
    const base = horizonOverride ?? fallbackHorizon;
    return tightenHorizonForData(base, stageData, 1, 1);
  }, [horizonOverride, fallbackHorizon, stageData]);

  // 4) Availability
  const availability = React.useMemo(() => {
    return showAvailability ? availabilityForPlan(plan, stageData, horizon) : [];
  }, [plan, stageData, showAvailability, horizon]);

  // 5) Width
  const months = monthsBetween(horizon.start, horizon.end);
  const contentW = Math.ceil(months * PX_PER_MONTH);
  const plotW = LEFT_LABEL_W + contentW;

  // 6) Tiny debug banner, helps verify unique data per plan
  const banner = `rows=${stageData.length}  horizon=${horizon.start.toISOString().slice(0, 10)}→${horizon.end
    .toISOString()
    .slice(0, 10)}  cycle=${plan.lockedCycleStart?.toISOString?.().slice(0, 10) ?? "—"}  ovul=${plan.lockedOvulationDate
      ?.toISOString?.()
      .slice(0, 10) ?? "—"}  due=${plan.lockedDueDate?.toISOString?.().slice(0, 10) ?? plan.expectedBirthDate
        ?.toISOString?.()
        .slice(0, 10) ?? "—"}`;

  return (
    <div>
      <div className="overflow-x-auto overflow-y-visible w-full" role="region" aria-label="Gantt timeline scroll" style={{ scrollbarGutter: "stable both-edges" }}>
        <div style={{ minWidth: Math.max(LEFT_LABEL_W + 600, plotW), width: plotW }}>
          <BHQGantt
            title={title ?? plan.name ?? "Plan"}
            stages={GANTT_STAGES}
            data={stageData}
            availability={availability as any}
            horizon={horizon}
            today={today}
            heightPerRow={28}
            showAvailability={showAvailability}
            fitToContent={true}
            rightGutter={0}
            className="rounded-lg border border-hairline bhq-gantt--freeze-left"
            style={{ ["--gantt-left-sticky" as any]: `${LEFT_LABEL_W}px` }}
          />
        </div>
      </div>

      <div className="text-xs text-secondary px-2 py-1">{banner}</div>
    </div>
  );
}
