import type { ISODate, ReproTimeline, ReproSummary } from "./types";
import { computeWindows } from "../breedingMath"; // legacy dependency for now
import { getSpeciesDefaults } from "./defaults";

export function buildTimelineFromSeed(summary: ReproSummary, seedCycleStart: ISODate): ReproTimeline {
  const d = getSpeciesDefaults(summary.species);

  const windows = computeWindows({
    species: String(summary.species),
    cycleStart: seedCycleStart,
    cycle_len_days: d.cycleLenDays,
    start_buffer_days: d.startBufferDays,
    ovulation_day_from_heat_start: d.ovulationOffsetDays,
    placement_start_from_birth_weeks: d.placementStartWeeksDefault,
  });

  return {
    projectedCycleStarts: [],
    seedCycleStart,
    windows: {
      pre_breeding: { full: windows.pre_breeding_full, likely: windows.pre_breeding_likely },
      hormone_testing: { full: windows.hormone_testing_full, likely: windows.hormone_testing_likely },
      breeding: { full: windows.breeding_full, likely: windows.breeding_likely },
      birth: { full: windows.birth_full, likely: windows.birth_likely },
      post_birth_care: { full: windows.post_birth_care_full, likely: windows.post_birth_care_likely },
      placement_normal: { full: windows.placement_normal_full, likely: windows.placement_normal_likely },
      placement_extended: { full: windows.placement_extended_full, likely: windows.placement_extended_likely },
    },
    milestones: {
      cycle_start: seedCycleStart,
      ovulation: windows.ovulation,
      breed_expected: windows.breed_expected ?? null,
      birth_expected: windows.birth_expected ?? null,
      placement_start_expected: windows.placement_start_expected ?? null,
      placement_completed_expected: windows.placement_completed_expected ?? null,
      placement_extended_end_expected: windows.placement_extended_end_expected ?? null,
    },
    explain: { species: summary.species, seedType: "HISTORY" },
  };
}
