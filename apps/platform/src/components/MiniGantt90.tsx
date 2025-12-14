import * as React from "react";
import BHQGantt, { type BHQGanttStage } from "@bhq/ui/components/Gantt/Gantt";
import type { StageWindows } from "@bhq/ui/utils";

type ID = number | string;

type Props = {
  plans: { id: ID; name: string }[] | undefined | null;
  windows: Record<string, StageWindows[] | undefined> | undefined | null;
};

const STAGES: BHQGanttStage[] = [
  { key: "preBreeding", label: "Pre-breeding" },
  { key: "hormoneTesting", label: "Hormone" },
  { key: "breeding", label: "Breeding" },
  { key: "birth", label: "Birth" },
  { key: "postBirthCare", label: "Post Birth Care" },
  { key: "PlacementNormal", label: "Placement" },
  { key: "PlacementExtended", label: "Placement ext" },
];

function cleanWindows(list: StageWindows[] | undefined | null): StageWindows[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter(w => !!w && !!w.full && !!(w as any).full?.start && !!(w as any).full?.end)
    .map(w => ({
      ...w,
      // normalize to Date objects if strings sneaked in
      full: {
        start: new Date((w as any).full.start),
        end: new Date((w as any).full.end),
      },
      likely: w.likely
        ? { start: new Date((w as any).likely.start), end: new Date((w as any).likely.end) }
        : undefined,
    }));
}

export default function MiniGantt90({ plans, windows }: Props) {
  const safePlans = Array.isArray(plans) ? plans : [];
  const winMap = windows || {};

  const rows = React.useMemo(
    () =>
      safePlans.map(p => {
        const w = cleanWindows(winMap[String(p.id)]);
        return { id: String(p.id), label: p.name, windows: w };
      }),
    [safePlans, winMap]
  );

  // If nothing drawable, render a quiet empty state
  const hasAnyBars = rows.some(r => r.windows.length > 0);

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 90 * 86400000);

  return (
    <div className="p-2">
      <div className="mb-3">
        <div className="text-lg font-semibold">Next 90 days</div>
        <div className="text-xs opacity-70">Today marker fixed, chart scrolls under it</div>
      </div>

      {hasAnyBars ? (
        <BHQGantt
          stages={STAGES}
          rows={rows}
          startDate={start}
          endDate={end}
          pxPerDay={4}
          showTodayLine
          compact
        />
      ) : (
        <div className="text-sm text-secondary border border-hairline rounded-lg p-3">
          No drawable breeding windows yet. Add a plan or lock cycle anchors to populate this view.
        </div>
      )}
    </div>
  );
}
