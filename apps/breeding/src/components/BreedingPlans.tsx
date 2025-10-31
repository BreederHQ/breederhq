// apps/breeding/src/components/BreedingPlans.tsx
import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt";
import type { Range, StageWindows, TravelBand } from "@bhq/ui/utils";
import { Card } from "@bhq/ui";

type ID = number | string;

type PlanRow = {
  id: ID;
  name: string;
  species: "Dog" | "Cat" | "Horse" | "";
  lockedCycleStart?: string | null;
  expectedDue?: string | null;
  expectedGoHome?: string | null;
  expectedWeaned?: string | null;
  expectedGoHomeExtendedEnd?: string | null;
};

export default function BreedingPlans(props: {
  plans: PlanRow[];
  onOpenPlan?: (id: ID) => void;
  onQuickAdd?: (id?: ID) => void;
}) {
  const { plans, onOpenPlan } = props;

  // Stage row config and order to match your mock
  const stages = [
    { key: "preBreeding",    label: "Pre-breeding Heat", baseColor: "var(--cyan-400,#22d3ee)", hatchLikely: true },
    { key: "hormoneTesting", label: "Hormone Testing",   baseColor: "var(--amber-400,#fbbf24)", hatchLikely: true },
    { key: "breeding",       label: "Breeding",          baseColor: "var(--green-400,#34d399)", hatchLikely: false },
    { key: "whelping",       label: "Whelped",           baseColor: "var(--rose-400,#fb7185)", hatchLikely: false },
    { key: "puppyCare",      label: "Puppy Care",        baseColor: "var(--violet-400,#a78bfa)", hatchLikely: true },
    { key: "goHomeNormal",   label: "Go Home (Normal)",  baseColor: "var(--zinc-400,#a1a1aa)", hatchLikely: false },
    { key: "goHomeExtended", label: "Go Home (Extended)",baseColor: "var(--zinc-500,#71717a)", hatchLikely: false },
  ] as const;

  // Build a sensible horizon around all visible plans
  const horizon: Range = React.useMemo(() => {
    // Collect all known dates across plans
    const dates: number[] = [];
    for (const p of plans) {
      for (const iso of [
        p.lockedCycleStart,
        p.expectedDue,
        p.expectedGoHome,
        p.expectedWeaned,
        p.expectedGoHomeExtendedEnd,
      ]) {
        if (!iso) continue;
        const t = Date.parse(iso);
        if (Number.isFinite(t)) dates.push(t);
      }
    }

    const now = new Date();
    if (!dates.length) {
      // no data, show a simple 12-month band around today
      const start = new Date(now); start.setMonth(start.getMonth() - 1);
      const end = new Date(now);   end.setMonth(end.getMonth() + 11);
      return { start, end };
    }

    dates.sort((a, b) => a - b);
    const minTs = dates[0];
    const maxTs = dates[dates.length - 1];

    // pad one month on each side, but also clamp to at least 6 months total
    const start = new Date(minTs);
    const end = new Date(maxTs);
    start.setMonth(start.getMonth() - 1);
    end.setMonth(end.getMonth() + 1);

    // ensure at least a 6-month window so the grid does not look cramped
    const sixMonthsLater = new Date(start);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    if (end < sixMonthsLater) end.setTime(sixMonthsLater.getTime());

    return { start, end };
  }, [plans]);

  const today = new Date();

  return (
    <div className="space-y-4">
      {plans.map((p) => {
        // If you have full biology windows, map them here.
        // For now, derive minimal windows from the expected dates on the row.
        const data: StageWindows[] = [];

        const pushRange = (key: string, start?: string | null, end?: string | null) => {
          if (!start || !end) return;
          const s = new Date(start);
          const e = new Date(end);
          if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) return;
          data.push({ key: key as any, full: { start: s, end: e } });
        };

        // Breeding is a dot-like event; render as a 1-day window
        if (p.lockedCycleStart && p.expectedDue) {
          // hormone testing window: from heat start +7 → ovulation (approx). If you have better data, replace.
          const hs = new Date(p.lockedCycleStart);
          const ov = new Date(p.expectedDue); ov.setDate(ov.getDate() - 63); // ovulation ≈ birth - 63
          const htStart = new Date(hs); htStart.setDate(htStart.getDate() + 7);
          pushRange("hormoneTesting", htStart.toISOString(), ov.toISOString());

          // pre-breeding heat: from heat start → ovulation - 1
          const preEnd = new Date(ov); preEnd.setDate(preEnd.getDate() - 1);
          pushRange("preBreeding", hs.toISOString(), preEnd.toISOString());

          // breeding: treat as the ovulation date
          data.push({ key: "breeding" as any, full: { start: ov, end: ov } });

          // whelping: birth expected is p.expectedDue (a dot or 1–2 day window)
          const birth = new Date(p.expectedDue);
          const birthEnd = new Date(birth);
          data.push({ key: "whelping" as any, full: { start: birth, end: birthEnd } });

          // puppy care: birth → birth + 8w
          const puppyStart = new Date(birth);
          const puppyEnd = new Date(birth); puppyEnd.setDate(puppyEnd.getDate() + 56);
          pushRange("puppyCare", puppyStart.toISOString(), puppyEnd.toISOString());
        }

        if (p.expectedGoHome) {
          // go home normal: a 1–2 week band starting at expectedGoHome
          const nStart = new Date(p.expectedGoHome);
          const nEnd = new Date(p.expectedGoHome); nEnd.setDate(nEnd.getDate() + 10);
          pushRange("goHomeNormal", nStart.toISOString(), nEnd.toISOString());
        }

        if (p.expectedGoHomeExtendedEnd && p.expectedGoHome) {
          const exStart = new Date(p.expectedGoHome);
          const exEnd = new Date(p.expectedGoHomeExtendedEnd);
          pushRange("goHomeExtended", exStart.toISOString(), exEnd.toISOString());
        }

        const travel: TravelBand[] = []; // off by default; set showTravel if you want overlays

        return (
          <Card key={p.id} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">{p.name}</div>
              <button
                type="button"
                className="text-xs underline text-secondary hover:text-primary"
                onClick={() => onOpenPlan?.(p.id)}
              >
                Open plan
              </button>
            </div>

            <BHQGantt
              title=""
              stages={stages as any}
              data={data}
              travel={travel}
              horizon={horizon}
              today={today}
              heightPerRow={36}
              showToday
              showTravel={false}
            />
          </Card>
        );
      })}
    </div>
  );
}
