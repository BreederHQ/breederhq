// apps/breeding/src/adapters/planWindows.ts
import type { ISODate, ReproSummary } from "@bhq/ui/utils/reproEngine/types";
import { asISODateOnly } from "@bhq/ui/utils/reproEngine/normalize";
import { buildTimelineFromSeed } from "@bhq/ui/utils/reproEngine/timelineFromSeed";

export type StageRange = [ISODate, ISODate];

export type PlanStageWindows = {
  pre_breeding_full: StageRange;
  hormone_testing_full: StageRange;
  breeding_full: StageRange;
  birth_full: StageRange;
  post_birth_care_full: StageRange;
  placement_normal_full: StageRange;
  placement_extended_full: StageRange;

  pre_breeding_likely: StageRange;
  hormone_testing_likely: StageRange;
  breeding_likely: StageRange;
  birth_likely: StageRange;
  post_birth_care_likely: StageRange;
  placement_normal_likely: StageRange;
  placement_extended_likely: StageRange;

  // milestones commonly consumed by other adapters
  cycle_start: ISODate;
  ovulation: ISODate;
  birth_expected: ISODate | null;
  placement_start_expected: ISODate | null;
  placement_completed_expected: ISODate | null;
  placement_extended_end_expected: ISODate | null;
};

function todayISO(): ISODate {
  const dt = new Date();
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}` as ISODate;
}

function minIso(a: ISODate, b: ISODate): ISODate {
  return a <= b ? a : b;
}

function maxIso(a: ISODate, b: ISODate): ISODate {
  return a >= b ? a : b;
}

// Merge two windows outputs into a single "full" envelope.
// Likely is merged the same way to keep behavior deterministic for unlock scenarios.
function mergeWindows(a: PlanStageWindows, b: PlanStageWindows): PlanStageWindows {
  const mergeRange = (ra: StageRange, rb: StageRange): StageRange => [minIso(ra[0], rb[0]), maxIso(ra[1], rb[1])];

  return {
    ...a,
    pre_breeding_full: mergeRange(a.pre_breeding_full, b.pre_breeding_full),
    hormone_testing_full: mergeRange(a.hormone_testing_full, b.hormone_testing_full),
    breeding_full: mergeRange(a.breeding_full, b.breeding_full),
    birth_full: mergeRange(a.birth_full, b.birth_full),
    post_birth_care_full: mergeRange(a.post_birth_care_full, b.post_birth_care_full),
    placement_normal_full: mergeRange(a.placement_normal_full, b.placement_normal_full),
    placement_extended_full: mergeRange(a.placement_extended_full, b.placement_extended_full),

    pre_breeding_likely: mergeRange(a.pre_breeding_likely, b.pre_breeding_likely),
    hormone_testing_likely: mergeRange(a.hormone_testing_likely, b.hormone_testing_likely),
    breeding_likely: mergeRange(a.breeding_likely, b.breeding_likely),
    birth_likely: mergeRange(a.birth_likely, b.birth_likely),
    post_birth_care_likely: mergeRange(a.post_birth_care_likely, b.post_birth_care_likely),
    placement_normal_likely: mergeRange(a.placement_normal_likely, b.placement_normal_likely),
    placement_extended_likely: mergeRange(a.placement_extended_likely, b.placement_extended_likely),
  };
}

function toPlanStageWindows(tl: ReturnType<typeof buildTimelineFromSeed>): PlanStageWindows {
  const w = tl.windows || {};
  const m = tl.milestones || {};

  return {
    pre_breeding_full: (w as any).pre_breeding?.full || ["", ""],
    hormone_testing_full: (w as any).hormone_testing?.full || ["", ""],
    breeding_full: (w as any).breeding?.full || ["", ""],
    birth_full: (w as any).whelping?.full || ["", ""],  // reproEngine uses "whelping" not "birth"
    post_birth_care_full: (w as any).puppy_care?.full || ["", ""],  // reproEngine uses "puppy_care" not "post_birth_care"
    placement_normal_full: (w as any).go_home_normal?.full || ["", ""],  // reproEngine uses "go_home_normal" not "placement_normal"
    placement_extended_full: (w as any).go_home_extended?.full || ["", ""],  // reproEngine uses "go_home_extended" not "placement_extended"

    pre_breeding_likely: (w as any).pre_breeding?.likely || ["", ""],
    hormone_testing_likely: (w as any).hormone_testing?.likely || ["", ""],
    breeding_likely: (w as any).breeding?.likely || ["", ""],
    birth_likely: (w as any).whelping?.likely || ["", ""],  // reproEngine uses "whelping" not "birth"
    post_birth_care_likely: (w as any).puppy_care?.likely || ["", ""],  // reproEngine uses "puppy_care" not "post_birth_care"
    placement_normal_likely: (w as any).go_home_normal?.likely || ["", ""],  // reproEngine uses "go_home_normal" not "placement_normal"
    placement_extended_likely: (w as any).go_home_extended?.likely || ["", ""],  // reproEngine uses "go_home_extended" not "placement_extended"

    cycle_start: (m as any).cycle_start || "",
    ovulation: (m as any).ovulation_center || "",  // reproEngine uses "ovulation_center"
    birth_expected: (m as any).birth_expected ?? null,
    placement_start_expected: (m as any).placement_start_expected ?? null,
    placement_completed_expected: (m as any).placement_completed_expected ?? null,
    placement_extended_end_expected: (m as any).placement_extended_end_expected ?? null,
  };
}

// This is the adapter entrypoint used by Breeding calendar, Gantt, dashboard, etc.
// It is reproEngine-only at the adapter layer.
export function windowsFromPlan(plan: {
  species?: string | null;
  dob?: string | null;

  lockedCycleStart?: string | null;

  // Optional "range planning" fields, if present in your plan model.
  earliestCycleStart?: string | null;
  latestCycleStart?: string | null;
}): PlanStageWindows | null {
  const species = (plan.species ?? "").toString().trim();
  if (!species) return null;

  const summary: ReproSummary = {
    animalId: "plan",  // Placeholder ID for plan-based calculations
    species: species as any,
    dob: asISODateOnly(plan.dob ?? null),
    today: todayISO(),
    cycleStartsAsc: [],
  };

  const locked = asISODateOnly(plan.lockedCycleStart ?? null);
  if (locked) {
    const tl = buildTimelineFromSeed(summary, locked as ISODate);
    return toPlanStageWindows(tl);
  }

  const earliest = asISODateOnly((plan as any).earliestCycleStart ?? null);
  const latest = asISODateOnly((plan as any).latestCycleStart ?? null);

  if (earliest && latest) {
    const a = toPlanStageWindows(buildTimelineFromSeed(summary, earliest as ISODate));
    const b = toPlanStageWindows(buildTimelineFromSeed(summary, latest as ISODate));
    return mergeWindows(a, b);
  }

  if (earliest) {
    return toPlanStageWindows(buildTimelineFromSeed(summary, earliest as ISODate));
  }

  if (latest) {
    return toPlanStageWindows(buildTimelineFromSeed(summary, latest as ISODate));
  }

  // No seed. Adapter refuses to fabricate.
  return null;
}
