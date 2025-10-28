// apps/breeding/src/adapters/planToEvents.ts
import { breedingMath } from "@bhq/ui";

export type BreedingPlanLike = {
  id: string;
  species: breedingMath.Species;
  earliestHeatStart: Date | string;
  latestHeatStart: Date | string;
  ovulationDate?: Date | string | null;
  title?: string;
};

export function planToCalendarEvents(plan: BreedingPlanLike) {
  const wr = breedingMath.fromPlan({
    species: plan.species,
    earliestHeatStart: plan.earliestHeatStart,
    latestHeatStart: plan.latestHeatStart,
    ovulationDate: plan.ovulationDate ?? null,
  });
  return breedingMath.windowsToCalendarEvents(plan.id, breedingMath.DEFAULT_STAGE_LABELS, wr);
}
