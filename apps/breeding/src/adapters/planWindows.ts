// apps/breeding/src/adapters/planWindows.ts
import {
  fromPlan as biologyFromPlan,
  type Species,
  type StageWindows,
  type WindowsResult,
} from "@bhq/ui/utils/breedingMath";
import type { StageWindows } from "@bhq/ui/utils/breedingMath";

/**
 * Lightweight adapter for producing StageWindows for a simple “plan-like” slice.
 * Prefer using adapters/ganttShared.windowsFromPlan for full app PlanRow handling.
 */
export type BreedingPlanLike = {
  id: string;
  species: Species; // "DOG" | "CAT" | "HORSE"
  earliestHeatStart: Date | string | null;
  latestHeatStart: Date | string | null;
  ovulationDate?: Date | string | null;
  name?: string;
};

const toIso = (d: Date | string | null | undefined) =>
  d == null ? null : (d instanceof Date ? d : new Date(d)).toISOString();

/** Return full WindowsResult from a minimal plan slice */
export function windowsResultFromPlan(plan: BreedingPlanLike): WindowsResult | null {
  if (!plan.earliestHeatStart || !plan.latestHeatStart) return null;
  return biologyFromPlan({
    species: plan.species,
    earliestHeatStart: toIso(plan.earliestHeatStart)!,
    latestHeatStart: toIso(plan.latestHeatStart)!,
    ovulationDate: toIso(plan.ovulationDate) ?? null,
  });
}

/** Return just the stage windows from a minimal plan slice */
export function windowsFromPlan(plan: BreedingPlanLike): StageWindows[] {
  const wr = windowsResultFromPlan(plan);
  return wr ? wr.stages : [];
}

/** Visual config and order (canonical stage keys, Placement naming) */
export function defaultStageVisuals() {
  return [
    { key: "preBreeding",       label: "Pre-breeding Heat",   baseColor: "hsl(var(--brand-cyan, 186 100% 40%))",  hatchLikely: true },
    { key: "hormoneTesting",    label: "Hormone Testing",     baseColor: "hsl(var(--brand-orange, 36 100% 50%))",  hatchLikely: true },
    { key: "breeding",          label: "Breeding",            baseColor: "hsl(var(--brand-green, 140 70% 45%))" },
    { key: "birth",             label: "Birth",               baseColor: "hsl(var(--brand-pink, 345 80% 55%))" },
    { key: "puppyCare",         label: "Puppy Care",          baseColor: "hsl(var(--brand-purple, 270 90% 60%))" },
    { key: "PlacementNormal",   label: "Placement",           baseColor: "hsl(var(--brand-gray, 220 10% 60%))" },
    { key: "PlacementExtended", label: "Placement (Extended)",baseColor: "hsl(var(--brand-gray, 220 10% 60%))" },
  ] as const;
}
