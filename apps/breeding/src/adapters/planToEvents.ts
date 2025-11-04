// apps/breeding/src/adapters/planToEvents.ts
import {
  windowsToCalendarEvents,
  type StageLabels,
  type CalendarEvent,
  type StageWindows,
  type Species,
  type WindowsResult,
} from "@bhq/ui/utils/breedingMath";

// NOTE: planToGantt re-exports windowsFromPlan for compatibility
import { windowsFromPlan } from "../adapters/planToGantt";

/* ───────────────── types ───────────────── */
export type BreedingPlanLike = {
  id: string | number;
  species: Species;                          // "DOG" | "CAT" | "HORSE"
  earliestHeatStart: Date | string | null;
  latestHeatStart: Date | string | null;
  ovulationDate?: Date | string | null;
  name?: string | null;
};

const toIso = (d: Date | string | null | undefined) =>
  d == null ? null : (d instanceof Date ? d : new Date(d)).toISOString();

/* ───────────────── windows helpers ───────────────── */

export function windowsForEvents(plan: BreedingPlanLike): StageWindows[] {
  if (!plan.earliestHeatStart || !plan.latestHeatStart) return [];
  return windowsFromPlan({
    species: plan.species,
    earliestHeatStart: toIso(plan.earliestHeatStart)!,
    latestHeatStart: toIso(plan.latestHeatStart)!,
    ovulationDate: toIso(plan.ovulationDate) ?? null,
  });
}

function toWindowsResult(stages: StageWindows[]): WindowsResult {
  // Minimal shape for calendar event generation; availability not required
  const today = new Date();
  // derive a simple horizon from first/last stage full spans
  const valid = stages
    .flatMap((s) => (s?.full?.start && s?.full?.end ? [s] : []))
    .sort((a, b) => a.full.start.getTime() - b.full.start.getTime());

  const horizon =
    valid.length > 0
      ? { start: valid[0].full.start, end: valid[valid.length - 1].full.end }
      : { start: today, end: today };

  return { stages, availability: [], travel: [], today, horizon };
}

/* ───────────────── event builders ───────────────── */

export function eventsFromPlan(
  plan: BreedingPlanLike,
  labels: StageLabels
): CalendarEvent[] {
  const stages = windowsForEvents(plan);
  if (!stages.length) return [];
  return windowsToCalendarEvents(String(plan.id), labels, toWindowsResult(stages));
}

/** ← This is what your BreedingCalendar.tsx imports */
export function eventsForItems(
  items: BreedingPlanLike[],
  labels: StageLabels
): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  for (const p of items) {
    const ev = eventsFromPlan(p, labels);
    if (ev.length) out.push(...ev);
  }
  return out;
}
