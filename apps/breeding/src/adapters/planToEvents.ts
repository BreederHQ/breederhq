// apps/breeding/src/adapters/planToEvents.ts
import {
  fromPlan,
  windowsToCalendarEvents,
  DEFAULT_STAGE_LABELS,
  type Species,
} from "@bhq/ui/utils/breedingMath";

export type BreedingPlanLike = {
  id: string | number;
  species: Species;
  earliestHeatStart: Date | string;
  latestHeatStart: Date | string;
  ovulationDate?: Date | string | null;
  title?: string;
};

const toIso = (d: Date | string | null | undefined) =>
  d == null ? null : (d instanceof Date ? d : new Date(d)).toISOString();

export function planToCalendarEvents(plan: BreedingPlanLike) {
  const wr = fromPlan({
    species: plan.species,
    earliestHeatStart: toIso(plan.earliestHeatStart)!,
    latestHeatStart: toIso(plan.latestHeatStart)!,
    ovulationDate: toIso(plan.ovulationDate) ?? null,
  });

  return windowsToCalendarEvents(String(plan.id), DEFAULT_STAGE_LABELS, wr, {
    title: plan.title,
  });
}
