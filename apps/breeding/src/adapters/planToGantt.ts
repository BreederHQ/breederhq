// apps/breeding/src/adapters/planToGantt.ts
import type { PlanStageWindows } from "./planWindows";
import { windowsFromPlan } from "./planWindows";



function toIso(d: any): string | null {
  if (!d) return null;
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export { windowsFromPlan } from "./planWindows";
export type { PlanStageWindows } from "./planWindows";

export type NormalizedPlan = {
  id: string;
  name: string;
  species: string;

  lockedCycleStart?: string | null;
  ovulationDate?: string | null;

  // expected fields commonly used by UI
  expectedBirthDate?: string | null;
  placementStartDateExpected?: string | null;
  placementCompletedDateExpected?: string | null;

  windows?: PlanStageWindows | null;

  // passthrough flags used elsewhere
  isWhatIf?: boolean;
};

export function normalizePlan(plan: any): NormalizedPlan {
  const id = String(plan?.id ?? "");
  const name = String(plan?.name ?? "Breeding Plan");
  const species = String(plan?.species ?? "");

  const lockedCycleStart = toIso(plan?.lockedCycleStart ?? null);
  const ovulationDate = toIso(plan?.ovulationDate ?? null);

  const expectedBirthDate = toIso(plan?.expectedBirthDate ?? plan?.expectedDue ?? null);

  const placementStartDateExpected =
    toIso(plan?.placementStartDateExpected ?? plan?.expectedPlacementStartDate ?? plan?.expectedGoHome ?? null);

  const placementCompletedDateExpected =
    toIso(plan?.placementCompletedDateExpected ?? plan?.expectedPlacementCompletedDate ?? null);

  const w = windowsFromPlan({
    species,
    dob: plan?.dob ?? plan?.birthDate ?? null,
    lockedCycleStart,
    earliestCycleStart: plan?.earliestCycleStart ?? null,
    latestCycleStart: plan?.latestCycleStart ?? null,
  });

  return {
    id,
    name,
    species,
    lockedCycleStart,
    ovulationDate,
    expectedBirthDate,
    placementStartDateExpected,
    placementCompletedDateExpected,
    windows: w,
    isWhatIf: !!plan?.isWhatIf,
  };
}
// Deterministic color for plan/calendar items.
// Keeps stable color per id across sessions.
export function colorFromId(id: string): string {
  const s = String(id ?? "");
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  // Map hash to a hue. Keep saturation/lightness readable in UI.
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 50%)`;
}
