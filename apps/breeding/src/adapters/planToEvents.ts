// apps/breeding/src/adapters/planToEvents.ts
import { windowsFromPlan } from "./planWindows";

function safeIso(d: any): string | null {
  if (!d) return null;
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export type CalendarStage = {
  key: string;
  label: string;
  full: { start: string; end: string };
  likely: { start: string; end: string };
};

export function planToEvents(plan: any, opts?: { today?: string; horizonMonths?: number }) {
  const species = String(plan?.species ?? "");
  const lockedCycleStart = safeIso(plan?.lockedCycleStart ?? null);

  const windows = windowsFromPlan({
    species,
    dob: plan?.dob ?? plan?.birthDate ?? null,
    lockedCycleStart,
    earliestCycleStart: plan?.earliestCycleStart ?? null,
    latestCycleStart: plan?.latestCycleStart ?? null,
  });

  const stages: CalendarStage[] = [];
  if (windows) {
    stages.push(
      {
        key: "preBreeding",
        label: "Pre-breeding Heat",
        full: { start: windows.pre_breeding_full[0], end: windows.pre_breeding_full[1] },
        likely: { start: windows.pre_breeding_likely[0], end: windows.pre_breeding_likely[1] },
      },
      {
        key: "hormoneTesting",
        label: "Hormone Testing",
        full: { start: windows.hormone_testing_full[0], end: windows.hormone_testing_full[1] },
        likely: { start: windows.hormone_testing_likely[0], end: windows.hormone_testing_likely[1] },
      },
      {
        key: "breeding",
        label: "Breeding",
        full: { start: windows.breeding_full[0], end: windows.breeding_full[1] },
        likely: { start: windows.breeding_likely[0], end: windows.breeding_likely[1] },
      },
      {
        key: "birth",
        label: "Birth",
        full: { start: windows.birth_full[0], end: windows.birth_full[1] },
        likely: { start: windows.birth_likely[0], end: windows.birth_likely[1] },
      },
      {
        key: "postBirthCare",
        label: "Post-birth Care",
        full: { start: windows.post_birth_care_full[0], end: windows.post_birth_care_full[1] },
        likely: { start: windows.post_birth_care_likely[0], end: windows.post_birth_care_likely[1] },
      },
      {
        key: "placement",
        label: "Placement",
        full: { start: windows.placement_normal_full[0], end: windows.placement_normal_full[1] },
        likely: { start: windows.placement_normal_likely[0], end: windows.placement_normal_likely[1] },
      },
      {
        key: "placementExtended",
        label: "Placement, Extended",
        full: { start: windows.placement_extended_full[0], end: windows.placement_extended_full[1] },
        likely: { start: windows.placement_extended_likely[0], end: windows.placement_extended_likely[1] },
      },
    );
  }

  // Keep the return shape compatible with your existing calendar overlay usage.
  const today = (opts?.today ?? safeIso(new Date().toISOString()) ?? "1970-01-01") as string;
  const horizon = opts?.horizonMonths ?? 18;

  return {
    stages,
    availability: [],
    travel: [],
    today,
    horizon,
  };
}

// Backward-compatible wrapper for existing calendar usage
export function eventsForItems(items: any[], opts?: { today?: string; horizonMonths?: number }) {
  return items.map((item) => ({
    id: String(item?.id ?? ""),
    name: String(item?.name ?? "Breeding Plan"),
    ...planToEvents(item, opts),
  }));
}
