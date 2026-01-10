import type { SpeciesCode } from "./types";

export type SpeciesReproDefaults = {
  cycleLenDays: number;
  ovulationOffsetDays: number;
  startBufferDays: number;

  gestationDays: number;

  // Offspring care / weaning duration (weeks from birth until weaning complete).
  // This is when the dam finishes nursing and offspring are independent.
  offspringCareDurationWeeks: number;

  // Placement rules. Use weeks to stay consistent with existing UI logic.
  // placementStartWeeksDefault: when offspring can go to new homes (must be >= offspringCareDurationWeeks)
  placementStartWeeksDefault: number;
  placementExtendedWeeks: number;

  // Juvenile first-cycle expectations, DOB based.
  juvenileFirstCycleMinDays: number;
  juvenileFirstCycleLikelyDays: number;
  juvenileFirstCycleMaxDays: number;

  // Postpartum return-to-cycle expectations.
  postpartumMinDays: number;
  postpartumLikelyDays: number;
  postpartumMaxDays: number;
};

const DEFAULTS_BY_SPECIES: Record<string, SpeciesReproDefaults> = {

  // DOG: AKC and veterinary standards
  // - Gestation: 58-68 days, typically 63
  // - Weaning: begins week 3-4, puppies fully on solid food by week 6 (AKC)
  // - Placement: week 8 minimum (state laws), optimal 8-10 weeks (AKC)
  // Sources: https://www.akc.org/expert-advice/dog-breeding/closing-milk-bar-puppy-weaning-process/
  DOG: {
    cycleLenDays: 180,
    ovulationOffsetDays: 12,
    startBufferDays: 14,
    gestationDays: 63,
    offspringCareDurationWeeks: 6,    // Weaning complete at 6 weeks (AKC: puppies exclusively on puppy food)
    placementStartWeeksDefault: 8,    // Placement at 8 weeks (AKC recommended minimum)
    placementExtendedWeeks: 4,        // Extended window through 12 weeks
    juvenileFirstCycleMinDays: 180,
    juvenileFirstCycleLikelyDays: 270,
    juvenileFirstCycleMaxDays: 420,
    postpartumMinDays: 90,
    postpartumLikelyDays: 120,
    postpartumMaxDays: 210,
  },

  // CAT: TICA/CFA and veterinary standards
  // - Gestation: 58-70 days, typically 63
  // - Weaning: begins week 4-5, complete by week 8
  // - Placement: 12-16 weeks preferred for socialization (many breeders)
  // Sources: https://www.catster.com/cat-health-care/weaning-kittens-how-and-when/
  CAT: {
    cycleLenDays: 21,
    ovulationOffsetDays: 3,
    startBufferDays: 7,
    gestationDays: 63,
    offspringCareDurationWeeks: 8,    // Weaning complete at 8 weeks
    placementStartWeeksDefault: 12,   // Placement at 12 weeks (socialization critical for cats)
    placementExtendedWeeks: 4,        // Extended window through 16 weeks
    juvenileFirstCycleMinDays: 150,   // 5 months
    juvenileFirstCycleLikelyDays: 210, // 7 months
    juvenileFirstCycleMaxDays: 300,   // 10 months
    postpartumMinDays: 45,
    postpartumLikelyDays: 90,
    postpartumMaxDays: 180,
  },

  // HORSE: AQHA and veterinary standards
  // - Gestation: 320-370 days, typically 340 (~11 months)
  // - Weaning: 4-6 months (16-26 weeks), standard is 4-5 months
  // - Placement: after weaning, varies widely
  // Sources: https://www.aqha.com/-/foal-growth-strive-for-balance, https://extension.okstate.edu/fact-sheets/weaning-and-management-of-weanling-horses.html
  HORSE: {
    cycleLenDays: 21,
    ovulationOffsetDays: 5,
    startBufferDays: 7,
    gestationDays: 340,
    offspringCareDurationWeeks: 20,   // Weaning at 5 months (typical 4-6 month range)
    placementStartWeeksDefault: 24,   // Placement at 6 months (after weaning adjustment period)
    placementExtendedWeeks: 26,       // Extended through 12 months
    juvenileFirstCycleMinDays: 365,
    juvenileFirstCycleLikelyDays: 450,
    juvenileFirstCycleMaxDays: 540,
    postpartumMinDays: 30,
    postpartumLikelyDays: 45,
    postpartumMaxDays: 120,
  },

  // GOAT: ADGA and veterinary standards
  // - Gestation: 145-157 days, typically 150 (~5 months)
  // - Weaning: 8-10 weeks optimal (research shows <70 days causes weaning shock)
  // - Placement: after weaning complete
  // Sources: https://u.osu.edu/sheep/2022/03/01/weaning-management-for-goat-kids/, https://extension.psu.edu/courses/meat-goat/basic-production/general-overview/weaning-time
  GOAT: {
    cycleLenDays: 21,
    ovulationOffsetDays: 2,
    startBufferDays: 7,
    gestationDays: 150,
    offspringCareDurationWeeks: 9,    // Weaning complete at 9 weeks (~63 days, research-backed minimum)
    placementStartWeeksDefault: 10,   // Placement at 10 weeks (after weaning adjustment)
    placementExtendedWeeks: 4,        // Extended window through 14 weeks
    juvenileFirstCycleMinDays: 150,
    juvenileFirstCycleLikelyDays: 210,
    juvenileFirstCycleMaxDays: 300,
    postpartumMinDays: 45,
    postpartumLikelyDays: 90,
    postpartumMaxDays: 150,
  },

  // RABBIT: ARBA and veterinary standards
  // - Gestation: 28-35 days, typically 31 (~4.5 weeks)
  // - Weaning: 6-8 weeks standard (ARBA), minimum 6 weeks
  // - Placement: 8 weeks, must be before 10 weeks to prevent fighting
  // Sources: https://arba.net/arba-recommendations-for-the-care-of-rabbits-and-cavies/
  // NOTE: Rabbits are induced ovulators. These values model receptivity windows,
  // not true estrous cycles.
  RABBIT: {
    cycleLenDays: 15,
    ovulationOffsetDays: 0,
    startBufferDays: 3,
    gestationDays: 31,
    offspringCareDurationWeeks: 6,    // Weaning complete at 6 weeks (ARBA standard)
    placementStartWeeksDefault: 8,    // Placement at 8 weeks (ARBA: before 10 weeks to prevent fighting)
    placementExtendedWeeks: 2,        // Extended window through 10 weeks (must wean before fighting)
    juvenileFirstCycleMinDays: 120,
    juvenileFirstCycleLikelyDays: 150,
    juvenileFirstCycleMaxDays: 180,
    postpartumMinDays: 14,
    postpartumLikelyDays: 21,
    postpartumMaxDays: 60,
  },

  // SHEEP: Veterinary and extension standards
  // - Gestation: 142-155 days, typically 147 (~5 months)
  // - Weaning: 8-12 weeks typical, 60 days most common for early weaning
  // - Placement: after weaning complete
  // Sources: https://extension.psu.edu/weaning-practices-limit-stress-to-ewes-and-lambs, https://u.osu.edu/sheep/2020/02/04/weaning-primer/
  // NOTE: Sheep are seasonal breeders (fall/winter breeding season).
  SHEEP: {
    cycleLenDays: 17,
    ovulationOffsetDays: 2,
    startBufferDays: 7,
    gestationDays: 147,
    offspringCareDurationWeeks: 8,    // Weaning complete at 8 weeks (60 days common)
    placementStartWeeksDefault: 10,   // Placement at 10 weeks (after weaning adjustment)
    placementExtendedWeeks: 4,        // Extended window through 14 weeks
    juvenileFirstCycleMinDays: 180,   // 6 months
    juvenileFirstCycleLikelyDays: 270, // 9 months
    juvenileFirstCycleMaxDays: 365,   // 12 months
    postpartumMinDays: 45,
    postpartumLikelyDays: 60,
    postpartumMaxDays: 120,
  },

};

export function getSpeciesDefaults(species: SpeciesCode): SpeciesReproDefaults {
  const d = DEFAULTS_BY_SPECIES[String(species)];
  if (d) return d;
  return DEFAULTS_BY_SPECIES.DOG;
}

// Optional: allow runtime extension for new species later without refactors.
export function registerSpeciesDefaults(species: SpeciesCode, defaults: SpeciesReproDefaults): void {
  DEFAULTS_BY_SPECIES[String(species)] = defaults;
}
