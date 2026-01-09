import * as React from "react";
import BHQGantt, { type BHQGanttStage } from "@bhq/ui/components/Gantt/Gantt";

type ID = number | string;

// Local type definition for StageWindows (not exported from @bhq/ui/utils)
type StageWindows = {
  full?: { start: Date | string; end: Date | string };
  likely?: { start: Date | string; end: Date | string };
  [key: string]: any;
};

type Props = {
  plans: { id: ID; name: string }[] | undefined | null;
  windows: Record<string, StageWindows[] | undefined> | undefined | null;
};

const STAGES: BHQGanttStage[] = [
  { key: "preBreeding", label: "Pre-breeding", baseColor: "#6366f1" },
  { key: "hormoneTesting", label: "Hormone", baseColor: "#8b5cf6" },
  { key: "breeding", label: "Breeding", baseColor: "#ec4899" },
  { key: "birth", label: "Birth", baseColor: "#f97316" },
  { key: "postBirthCare", label: "Post Birth Care", baseColor: "#eab308" },
  { key: "PlacementNormal", label: "Placement", baseColor: "#22c55e" },
  { key: "PlacementExtended", label: "Placement ext", baseColor: "#14b8a6" },
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
          data={rows.map(r => r.windows) as any}
          horizon={{ start, end }}
          today={now}
          showToday
        />
      ) : (
        <div className="text-sm text-secondary border border-hairline rounded-lg p-3">
          No drawable breeding windows yet. Add a plan or lock cycle anchors to populate this view.
        </div>
      )}
    </div>
  );
}
