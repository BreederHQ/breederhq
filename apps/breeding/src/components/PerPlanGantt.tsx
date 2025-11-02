// apps/breeding/src/components/PerPlanGantt.tsx
import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt/Gantt";
import { SectionCard } from "@bhq/ui";

import {
  GANTT_STAGES,
  monthsBetween,
  padByOneMonth,
  expectedRangeOfWindows,
  type Range,
  type StageWindows,
  type NormalizedPlan,
} from "../adapters/planToGantt";

const PX_PER_MONTH = 160;

function ScrollX({ widthPx, children }: { widthPx: number; children: React.ReactNode }) {
  const min = Math.max(1200, widthPx);
  return (
    <div className="overflow-x-auto overflow-y-visible w-full" role="region" aria-label="Gantt timeline scroll" style={{ scrollbarGutter: "stable both-edges" }}>
      <div style={{ minWidth: min, width: widthPx }}>{children}</div>
    </div>
  );
}

export default function PerPlanGantt({
  items,
  today = new Date(),
}: {
  items: NormalizedPlan[]; // pre-normalized plans with windows
  today?: Date;
}) {
  return (
    <div className="space-y-6">
      {items.map(({ plan, windows }) => {
        const data = windows as StageWindows[];
        const horizon = React.useMemo<Range>(() => padByOneMonth(expectedRangeOfWindows(data)), [data]);
        const months = monthsBetween(horizon.start, horizon.end);
        const widthPx = Math.ceil(months * PX_PER_MONTH);

        return (
          <SectionCard key={String(plan.id)} title={plan.name ?? `Plan ${plan.id}`}>
            <ScrollX widthPx={widthPx}>
              <BHQGantt
                stages={GANTT_STAGES}
                data={data}
                horizon={horizon}
                today={today}
                heightPerRow={26}
                showAvailability={false}
                fitToContent={false}
                className="bhq-gantt--no-aside rounded-lg border border-hairline"
              />
            </ScrollX>

            {data.length === 0 && (
              <div className="text-sm text-secondary px-1 mt-2">
                No expected dates for this plan yet. Lock a cycle or set placement dates to populate the timeline.
              </div>
            )}
          </SectionCard>
        );
      })}
    </div>
  );
}
