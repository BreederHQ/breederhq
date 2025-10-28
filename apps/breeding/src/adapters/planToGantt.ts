// apps/breeding/src/adapters/planToGantt.ts
import { breedingMath } from "@bhq/ui";
import type { Species } from "@bhq/ui/src/utils/breedingMath"; 

export type BreedingPlanLike = {
  id: string;
  species: Species;
  earliestHeatStart: Date | string;
  latestHeatStart: Date | string;
  ovulationDate?: Date | string | null;
  name?: string;
};

export function windowsFromPlan(plan: BreedingPlanLike) {
  return breedingMath.fromPlan({
    species: plan.species,
    earliestHeatStart: plan.earliestHeatStart,
    latestHeatStart: plan.latestHeatStart,
    ovulationDate: plan.ovulationDate ?? null,
  });
}

export function defaultStageVisuals() {
  return [
    { key: "preBreeding",   label: breedingMath.DEFAULT_STAGE_LABELS.preBreeding,   baseColor: "hsl(var(--brand-blue))", hatchLikely: true },
    { key: "hormoneTesting",label: breedingMath.DEFAULT_STAGE_LABELS.hormoneTesting, baseColor: "hsl(var(--brand-purple))", hatchLikely: true },
    { key: "breeding",      label: breedingMath.DEFAULT_STAGE_LABELS.breeding,       baseColor: "hsl(var(--brand-green))", hatchLikely: true },
    { key: "whelping",      label: breedingMath.DEFAULT_STAGE_LABELS.whelping,       baseColor: "hsl(var(--brand-orange))", hatchLikely: true },
    { key: "puppyCare",     label: breedingMath.DEFAULT_STAGE_LABELS.puppyCare,      baseColor: "hsl(var(--brand-teal))", hatchLikely: true },
    { key: "goHomeNormal",  label: breedingMath.DEFAULT_STAGE_LABELS.goHomeNormal,   baseColor: "hsl(var(--brand-gray))", hatchLikely: true },
    { key: "goHomeExtended",label: breedingMath.DEFAULT_STAGE_LABELS.goHomeExtended, baseColor: "hsl(var(--brand-gray))" },
  ];
}
