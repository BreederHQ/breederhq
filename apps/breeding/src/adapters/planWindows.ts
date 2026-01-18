// apps/breeding/src/adapters/planWindows.ts
import type { ISODate, ReproSummary } from "@bhq/ui/utils/reproEngine/types";
import { asISODateOnly } from "@bhq/ui/utils/reproEngine/normalize";
import {
  buildTimelineFromSeed,
  buildTimelineFromOvulation,
  buildTimelineFromAnchor,
  detectAnchorFromPlan,
} from "@bhq/ui/utils/reproEngine/timelineFromSeed";

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
  ovulation_confirmed: ISODate | null; // NEW: Confirmed ovulation from hormone testing
  birth_expected: ISODate | null;
  placement_start_expected: ISODate | null;
  placement_completed_expected: ISODate | null;
  placement_extended_end_expected: ISODate | null;

  // NEW: Anchor mode metadata
  anchor_mode: "CYCLE_START" | "OVULATION" | "BREEDING_DATE" | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
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

    // Preserve anchor mode metadata from first window (range planning uses earliest/latest)
    anchor_mode: a.anchor_mode,
    confidence: a.confidence,
  };
}

function toPlanStageWindows(tl: ReturnType<typeof buildTimelineFromSeed>): PlanStageWindows {
  const w = tl.windows || {};
  const m = tl.milestones || {};
  const explain = (tl as any).explain || {};

  return {
    pre_breeding_full: (w as any).pre_breeding?.full || ["", ""],
    hormone_testing_full: (w as any).hormone_testing?.full || ["", ""],
    breeding_full: (w as any).breeding?.full || ["", ""],
    birth_full: (w as any).birth?.full || ["", ""],
    post_birth_care_full: (w as any).offspring_care?.full || ["", ""],
    placement_normal_full: (w as any).placement_normal?.full || ["", ""],
    placement_extended_full: (w as any).placement_extended?.full || ["", ""],

    pre_breeding_likely: (w as any).pre_breeding?.likely || ["", ""],
    hormone_testing_likely: (w as any).hormone_testing?.likely || ["", ""],
    breeding_likely: (w as any).breeding?.likely || ["", ""],
    birth_likely: (w as any).birth?.likely || ["", ""],
    post_birth_care_likely: (w as any).offspring_care?.likely || ["", ""],
    placement_normal_likely: (w as any).placement_normal?.likely || ["", ""],
    placement_extended_likely: (w as any).placement_extended?.likely || ["", ""],

    cycle_start: (m as any).cycle_start || (m as any).cycle_start_estimated || "",
    ovulation: (m as any).ovulation_center || (m as any).ovulation_confirmed || "",
    ovulation_confirmed: (m as any).ovulation_confirmed || (tl as any).seedOvulationDate || null,
    birth_expected: ((m as any).birth_expected || (w as any).birth?.full?.[0]) ?? null,
    placement_start_expected: (w as any).placement_normal?.full?.[0] ?? null,
    placement_completed_expected: (w as any).placement_normal?.full?.[1] ?? null,
    placement_extended_end_expected: (w as any).placement_extended?.full?.[1] ?? null,

    // Anchor mode metadata from timeline explain
    anchor_mode: explain.anchorMode || null,
    confidence: explain.confidence || null,
  };
}

// This is the adapter entrypoint used by Breeding calendar, Gantt, dashboard, etc.
// It is reproEngine-only at the adapter layer.
export function windowsFromPlan(plan: {
  species?: string | null;
  dob?: string | null;

  // Anchor mode system fields
  reproAnchorMode?: string | null;
  ovulationConfirmed?: string | null;
  ovulationConfirmedMethod?: string | null;

  // Legacy locked fields
  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;

  // Optional actual birth date (highest priority anchor)
  birthDateActual?: string | null;

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

  // NEW: Use anchor detection from reproEngine
  // Priority: birth actual > ovulation confirmed > cycle start
  const anchor = detectAnchorFromPlan({
    reproAnchorMode: plan.reproAnchorMode,
    lockedOvulationDate: plan.lockedOvulationDate,
    lockedCycleStart: plan.lockedCycleStart,
    ovulationConfirmed: plan.ovulationConfirmed,
    ovulationConfirmedMethod: plan.ovulationConfirmedMethod,
    birthDateActual: plan.birthDateActual,
  });

  if (anchor) {
    const tl = buildTimelineFromAnchor(summary, anchor);
    return toPlanStageWindows(tl);
  }

  // Fallback: Legacy lockedCycleStart handling (backward compatibility)
  const locked = asISODateOnly(plan.lockedCycleStart ?? null);
  if (locked) {
    const tl = buildTimelineFromSeed(summary, locked as ISODate);
    return toPlanStageWindows(tl);
  }

  // Range planning support (earliestCycleStart / latestCycleStart)
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
