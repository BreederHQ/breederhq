// apps/breeding/src/adapters/planToGantt.ts
import { breedingMath } from "@bhq/ui";
import type { Species } from "@bhq/ui/src/utils/breedingMath";

export type BreedingPlanLike = {
  id: string;
  species: Species;                          // "Dog" | "Cat" | "Horse"
  earliestHeatStart: Date | string | null;
  latestHeatStart: Date | string | null;
  ovulationDate?: Date | string | null;
  name?: string;
};

export function windowsFromPlan(plan: BreedingPlanLike) {
  if (!plan.earliestHeatStart || !plan.latestHeatStart) {
    return null;
  }
  return breedingMath.fromPlan({
    species: plan.species,
    earliestHeatStart: plan.earliestHeatStart,
    latestHeatStart: plan.latestHeatStart,
    ovulationDate: plan.ovulationDate ?? null,
  });
}

/** Visual config + order (matches your mock’s row labels) */
export function defaultStageVisuals() {
  return [
    { key: "preBreeding",   label: "Pre-breeding Heat", baseColor: "hsl(var(--brand-cyan, 186 100% 40%))" },
    { key: "hormoneTesting",label: "Hormone Testing",   baseColor: "hsl(var(--brand-orange, 36 100% 50%))" },
    { key: "breeding",      label: "Breeding",          baseColor: "hsl(var(--brand-green, 140 70% 45%))" },
    { key: "whelping",      label: "Whelping",          baseColor: "hsl(var(--brand-pink, 345 80% 55%))" },
    { key: "puppyCare",     label: "Puppy Care",        baseColor: "hsl(var(--brand-purple, 270 90% 60%))", hatchLikely: true },
    { key: "goHomeNormal",  label: "Go Home, Normal",   baseColor: "hsl(var(--brand-gray, 220 10% 60%))" },
    { key: "goHomeExtended",label: "Go Home, Extended", baseColor: "hsl(var(--brand-gray, 220 10% 60%))" },
  ];
}
