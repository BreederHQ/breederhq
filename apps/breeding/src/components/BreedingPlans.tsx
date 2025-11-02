import * as React from "react";
import BHQGantt from "@bhq/ui/components/Gantt";
import type { Range, StageWindows } from "@bhq/ui/utils";
import { Card } from "@bhq/ui";

type ID = number | string;

type SpeciesUi = "Dog" | "Cat" | "Horse" | "";

type PlanRow = {
  id: ID;
  name: string;
  species: SpeciesUi | "";
  lockedCycleStart?: string | null;

  // Canonical expected keys
  expectedBirthDate?: string | null;          // canonical for due/birth
  expectedPlacementStart?: string | null;
  expectedWeaned?: string | null;
  expectedPlacementCompleted?: string | null;
};

export default function BreedingPlans(props: {
  plans: PlanRow[];
  onOpenPlan?: (id: ID) => void;
  onQuickAdd?: (id?: ID) => void;
}) {
  const { plans, onOpenPlan } = props;

  // Stage row config and order
  const stages = [
    { key: "preBreeding",          label: "Pre-breeding Heat",  baseColor: "var(--cyan-400,#22d3ee)",  hatchLikely: true },
    { key: "hormoneTesting",       label: "Hormone Testing",    baseColor: "var(--amber-400,#fbbf24)", hatchLikely: true },
    { key: "breeding",             label: "Breeding",           baseColor: "var(--green-400,#34d399)", hatchLikely: false },
    { key: "birth",                label: "Birth",              baseColor: "var(--rose-400,#fb7185)",  hatchLikely: false },
    { key: "puppyCare",            label: "Puppy Care",         baseColor: "var(--violet-400,#a78bfa)",hatchLikely: true },
    { key: "placement",            label: "Placement",          baseColor: "var(--zinc-400,#a1a1aa)",  hatchLikely: false },
    { key: "placementExtended",    label: "Placement (Extended)", baseColor: "var(--zinc-500,#71717a)", hatchLikely: false },
  ] as const;

  // Build a sensible horizon around all visible plans
  const horizon: Range = React.useMemo(() => {
    const dates: number[] = [];
    for (const p of plans) {
      // Canonical with legacy fallback
      const birthIso = p.expectedBirthDate ?? p.expectedDue ?? null;
      const placementStart = p.expectedPlacementStart ?? null;
      const placementCompleted = p.expectedPlacementCompleted ?? null;

      for (const iso of [
        p.lockedCycleStart ?? null,
        birthIso,
        placementStart,
        p.expectedWeaned ?? null,
        placementCompleted,
      ]) {
        if (!iso) continue;
        const t = Date.parse(iso);
        if (Number.isFinite(t)) dates.push(t);
      }
    }

    const now = new Date();
    if (!dates.length) {
      const start = new Date(now); start.setMonth(start.getMonth() - 1);
      const end = new Date(now);   end.setMonth(end.getMonth() + 11);
      return { start, end };
    }

    dates.sort((a, b) => a - b);
    const minTs = dates[0];
    const maxTs = dates[dates.length - 1];

    const start = new Date(minTs);
    const end = new Date(maxTs);
    start.setMonth(start.getMonth() - 1);
    end.setMonth(end.getMonth() + 1);

    const sixMonthsLater = new Date(start);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    if (end < sixMonthsLater) end.setTime(sixMonthsLater.getTime());

    return { start, end };
  }, [plans]);

  const today = new Date();

  return (
    <div className="space-y-4">
      {plans.map((p) => {
        const data: StageWindows[] = [];

        const pushRange = (key: string, start?: string | null, end?: string | null) => {
          if (!start || !end) return;
          const s = new Date(start);
          const e = new Date(end);
          if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime())) return;
          data.push({ key: key as any, full: { start: s, end: e } });
        };

        // Canonical with legacy fallback for birth date
        const birthIso = p.expectedBirthDate ?? p.expectedDue ?? null;
        const placementStart = p.expectedPlacementStart ?? null;
        const placementCompleted = p.expectedPlacementCompleted ?? null;

        // Derive minimal windows from expected fields when biology windows aren't provided
        if (p.lockedCycleStart && birthIso) {
          const heatStart = new Date(p.lockedCycleStart);
          const birth = new Date(birthIso);

          // estimate ovulation ≈ birth - 63
          const ov = new Date(birth); ov.setDate(ov.getDate() - 63);

          // Hormone Testing: heat +7 → ovulation
          const htStart = new Date(heatStart); htStart.setDate(htStart.getDate() + 7);
          pushRange("hormoneTesting", htStart.toISOString(), ov.toISOString());

          // Pre-breeding: heat start → ovulation - 1
          const preEnd = new Date(ov); preEnd.setDate(preEnd.getDate() - 1);
          pushRange("preBreeding", heatStart.toISOString(), preEnd.toISOString());

          // Breeding: treat ovulation as a 1-day window
          data.push({ key: "breeding" as any, full: { start: ov, end: ov } });

          // Birth: dot at birth
          const birthEnd = new Date(birth);
          data.push({ key: "birth" as any, full: { start: birth, end: birthEnd } });

          // Puppy Care: birth → birth + 8w
          const puppyStart = new Date(birth);
          const puppyEnd = new Date(birth); puppyEnd.setDate(puppyEnd.getDate() + 56);
          pushRange("puppyCare", puppyStart.toISOString(), puppyEnd.toISOString());
        }

        if (placementStart) {
          // Placement (Normal): 10-day band starting at expected start
          const nStart = new Date(placementStart);
          const nEnd = new Date(placementStart); nEnd.setDate(nEnd.getDate() + 10);
          pushRange("placement", nStart.toISOString(), nEnd.toISOString());
        }

        if (placementCompleted && placementStart) {
          const exStart = new Date(placementStart);
          const exEnd = new Date(placementCompleted);
          pushRange("placementExtended", exStart.toISOString(), exEnd.toISOString());
        }

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
