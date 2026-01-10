// packages/ui/src/utils/reproEngine/timelineFromSeed.ts
import { getSpeciesDefaults } from "./defaults";
import type { ISODate, ReproSummary, ReproTimeline, SpeciesCode } from "./types";

type RangeTuple = [ISODate, ISODate];

function assertIsoDate(iso: unknown, label: string): ISODate {
  if (typeof iso !== "string" || iso.length < 10) {
    throw new Error(`[reproEngine][timelineFromSeed] ${label} must be ISODate (YYYY-MM-DD), got: ${String(iso)}`);
  }
  // Basic sanity check, avoids addDays() crashing on split().
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`[reproEngine][timelineFromSeed] ${label} must be ISODate (YYYY-MM-DD), got: ${iso}`);
  }
  return iso as ISODate;
}

function addDays(iso: ISODate, days: number): ISODate {
  const safe = assertIsoDate(iso, "date");
  const [y, m, d] = safe.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}` as ISODate;
}

function makeRangeTuple(start: ISODate, end: ISODate): RangeTuple {
  const s = assertIsoDate(start, "range.start");
  const e = assertIsoDate(end, "range.end");
  return s <= e ? [s, e] : [e, s];
}

function centerRangeTuple(center: ISODate, halfWidthDays: number): RangeTuple {
  const c = assertIsoDate(center, "center");
  return makeRangeTuple(addDays(c, -halfWidthDays), addDays(c, halfWidthDays));
}

type Window = { full: RangeTuple; likely: RangeTuple };

const STAGE_LABELS: Record<string, string> = {
  pre_breeding: "Pre-breeding Heat",
  hormone_testing: "Hormone Testing",
  breeding: "Breeding",
  birth: "Birth",
  offspring_care: "Offspring Care",
  placement_normal: "Placement, Normal",
  placement_extended: "Placement, Extended",
  availability_travel_risky: "Travel Risky",
  availability_travel_unlikely: "Travel Unlikely",
};

/**
 * Seed-driven window model aligned to your current what-if defaults.
 * seedCycleStart is treated as heat start / cycle start.
 */
function computeWindowsFromSeed(species: SpeciesCode, seedCycleStart: ISODate): Record<string, Window> {
  const d = getSpeciesDefaults(species);
  const heatStart = assertIsoDate(seedCycleStart, "seedCycleStart");

  const ovulationCenter = addDays(heatStart, d.ovulationOffsetDays);

  // Pre-breeding
  const preBreedingFull = makeRangeTuple(addDays(heatStart, -d.startBufferDays), addDays(ovulationCenter, -1));
  const preBreedingLikely = centerRangeTuple(heatStart, 5);

  // Hormone testing
  const hormoneFull = makeRangeTuple(addDays(heatStart, 7), ovulationCenter);
  const hormoneLikely = makeRangeTuple(addDays(preBreedingLikely[1], 1), addDays(preBreedingLikely[1], 7));

  // Breeding window
  const breedingFull = makeRangeTuple(addDays(ovulationCenter, -1), addDays(ovulationCenter, 2));
  const breedingLikely = makeRangeTuple(addDays(ovulationCenter, 0), addDays(ovulationCenter, 1));

  // Birth (±2 full, ±1 likely around gestation)
  const birthCenter = addDays(ovulationCenter, d.gestationDays);
  const birthFull = centerRangeTuple(birthCenter, 2);
  const birthLikely = centerRangeTuple(birthCenter, 1);

  // Offspring care: from birth → +8 weeks (UI convention)
  const offspringCareFull: RangeTuple = makeRangeTuple(birthFull[0], addDays(birthFull[1], 8 * 7));
  const offspringCareLikely: RangeTuple = makeRangeTuple(birthLikely[0], addDays(birthLikely[0], 8 * 7));

  // Placement windows (use species defaults)
  const placementWeeks = d.placementStartWeeksDefault;
  const placementNormalFull: RangeTuple = makeRangeTuple(addDays(birthFull[0], placementWeeks * 7), addDays(birthFull[1], placementWeeks * 7));
  const placementNormalLikelyCenter = addDays(birthLikely[0], 8 * 7);
  const placementNormalLikely = centerRangeTuple(placementNormalLikelyCenter, 1);

  const placementExtendedFull: RangeTuple = makeRangeTuple(placementNormalFull[1], addDays(placementNormalFull[1], d.placementExtendedWeeks * 7));

  // Availability / travel bands (two spans)
  const travelRisky1: RangeTuple = makeRangeTuple(hormoneFull[0], breedingFull[1]);
  const travelRisky2: RangeTuple = makeRangeTuple(birthFull[0], placementExtendedFull[1]);

  const travelUnlikely1: RangeTuple = makeRangeTuple(hormoneLikely[0], breedingLikely[1]);
  const travelUnlikely2: RangeTuple = makeRangeTuple(offspringCareLikely[0], placementNormalLikely[1]);

  return {
    pre_breeding: { full: preBreedingFull, likely: preBreedingLikely },
    hormone_testing: { full: hormoneFull, likely: hormoneLikely },
    breeding: { full: breedingFull, likely: breedingLikely },
    birth: { full: birthFull, likely: birthLikely },
    offspring_care: { full: offspringCareFull, likely: offspringCareLikely },
    placement_normal: { full: placementNormalFull, likely: placementNormalLikely },
    // This stage intentionally has no "likely overlay" in your defaults.
    // Keep likely == full to preserve the Window shape, and let UIs choose to hide it.
    placement_extended: { full: placementExtendedFull, likely: placementExtendedFull },

    // Availability (two segments each)
    availability_travel_risky_1: { full: travelRisky1, likely: travelRisky1 },
    availability_travel_risky_2: { full: travelRisky2, likely: travelRisky2 },
    availability_travel_unlikely_1: { full: travelUnlikely1, likely: travelUnlikely1 },
    availability_travel_unlikely_2: { full: travelUnlikely2, likely: travelUnlikely2 },
  };
}

export function buildTimelineFromSeed(summary: ReproSummary, seedCycleStart: ISODate): ReproTimeline {
  const seed = assertIsoDate(seedCycleStart, "seedCycleStart");
  const species = summary.species;

  const windows = computeWindowsFromSeed(species, seed);

  return {
    projectedCycleStarts: [],
    seedCycleStart: seed,
    windows,
    milestones: {
      cycle_start: seed,
      heat_start: seed,
      ovulation_center: addDays(seed, getSpeciesDefaults(species).ovulationOffsetDays),
    },
    explain: {
      species,
      seedType: "HISTORY",
    },
  };
}

/**
 * Build post-birth timeline windows from an actual birth date.
 * This is used to recalculate expected weaning and placement dates when actual birth has occurred.
 * Returns only the post-birth windows (offspring_care, placement_normal, placement_extended).
 */
function computeWindowsFromBirth(species: SpeciesCode, actualBirth: ISODate): Partial<Record<string, Window>> {
  const d = getSpeciesDefaults(species);
  const birthDate = assertIsoDate(actualBirth, "actualBirth");

  // Use single date for birth (no range, since this is actual)
  const birthPoint: RangeTuple = [birthDate, birthDate];

  // Offspring care: from birth → +8 weeks
  const offspringCareFull: RangeTuple = makeRangeTuple(birthDate, addDays(birthDate, 8 * 7));
  const offspringCareLikely: RangeTuple = offspringCareFull; // Same as full when based on actual

  // Placement normal: starts at 8 weeks from birth
  const placementWeeks = d.placementStartWeeksDefault;
  const placementNormalStart = addDays(birthDate, placementWeeks * 7);
  const placementNormalFull: RangeTuple = [placementNormalStart, placementNormalStart];
  const placementNormalLikely: RangeTuple = placementNormalFull;

  // Placement extended: +3 weeks from placement start
  const placementExtendedEnd = addDays(placementNormalStart, d.placementExtendedWeeks * 7);
  const placementExtendedFull: RangeTuple = makeRangeTuple(placementNormalStart, placementExtendedEnd);
  const placementExtendedLikely: RangeTuple = placementExtendedFull;

  return {
    birth: { full: birthPoint, likely: birthPoint },
    offspring_care: { full: offspringCareFull, likely: offspringCareLikely },
    placement_normal: { full: placementNormalFull, likely: placementNormalLikely },
    placement_extended: { full: placementExtendedFull, likely: placementExtendedLikely },
  };
}

/**
 * Build timeline from an actual birth date.
 * Use this when actual birth has occurred to get accurate post-birth expected dates.
 */
export function buildTimelineFromBirth(summary: ReproSummary, actualBirth: ISODate): ReproTimeline {
  const birth = assertIsoDate(actualBirth, "actualBirth");
  const species = summary.species;

  const windows = computeWindowsFromBirth(species, birth);

  return {
    projectedCycleStarts: [],
    seedCycleStart: birth, // Using birth as seed for this timeline
    windows,
    milestones: {
      birth_actual: birth,
    },
    explain: {
      species,
      seedType: "ACTUAL_BIRTH",
    },
  };
}

// Compatibility shim for legacy callers.
// Returns a flat object that merges windows + milestone dates.
export function expectedMilestonesFromLocked(
  lockedCycleStart: string,
  species: SpeciesCode,
  today?: string,
) {
  const seed = assertIsoDate(lockedCycleStart, "lockedCycleStart");
  const t = buildTimelineFromSeed(
    {
      animalId: "locked",
      species,
      cycleStartsAsc: [],
      today: assertIsoDate(today ?? (new Date().toISOString().slice(0, 10) as ISODate), "today"),
    },
    seed,
  );

  // Flatten windows into the historical "<key>_full" / "<key>_likely" shape.
  const flat: Record<string, any> = {};
  Object.entries(t.windows || {}).forEach(([k, v]) => {
    if (v) {
      flat[`${k}_full`] = { start: v.full[0], end: v.full[1] };
      flat[`${k}_likely`] = { start: v.likely[0], end: v.likely[1] };
    }
  });

  return { ...flat, ...(t.milestones || {}) };
}

export const REPRO_ENGINE_STAGE_LABELS = STAGE_LABELS;
