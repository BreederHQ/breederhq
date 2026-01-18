// tests/e2e/breeding/fixtures/anchor-test-data.ts
// Test data for anchor mode system tests

import { TEST_SPECIES, ANCHOR_MODES, OVULATION_METHODS, CONFIDENCE_LEVELS } from '../config/hogwarts-config';

/**
 * Species-specific expected dates based on reproEngine defaults
 * These are the expected gestation/offset values per species
 */
export const SPECIES_DEFAULTS = {
  DOG: {
    ovulationOffsetDays: 12,
    gestationDays: 63,
    expectedBirthFromCycleStart: 75, // 12 + 63
    expectedBirthFromOvulation: 63,
    offspringCareDurationWeeks: 8,
    placementStartWeeksDefault: 8,
  },
  CAT: {
    ovulationOffsetDays: 0, // Induced ovulator - breeds immediately
    gestationDays: 63,
    expectedBirthFromBreeding: 63,
    offspringCareDurationWeeks: 8,
    placementStartWeeksDefault: 8,
  },
  HORSE: {
    ovulationOffsetDays: 5,
    gestationDays: 340,
    expectedBirthFromCycleStart: 345, // 5 + 340
    expectedBirthFromOvulation: 340,
    offspringCareDurationWeeks: 20,
    placementStartWeeksDefault: 26,
  },
  RABBIT: {
    ovulationOffsetDays: 0, // Induced ovulator
    gestationDays: 31,
    expectedBirthFromBreeding: 31,
    offspringCareDurationWeeks: 6,
    placementStartWeeksDefault: 6,
  },
  GOAT: {
    ovulationOffsetDays: 2,
    gestationDays: 150,
    expectedBirthFromCycleStart: 152, // 2 + 150
    expectedBirthFromOvulation: 150,
    offspringCareDurationWeeks: 8,
    placementStartWeeksDefault: 8,
  },
} as const;

/**
 * Species behavior configuration for tests
 */
export const SPECIES_BEHAVIOR = {
  DOG: {
    supportsUpgrade: true,
    isInducedOvulator: false,
    testingAvailable: true,
    defaultAnchor: ANCHOR_MODES.CYCLE_START,
    recommendedAnchor: ANCHOR_MODES.OVULATION,
    availableAnchors: [ANCHOR_MODES.CYCLE_START, ANCHOR_MODES.OVULATION],
    confirmationMethods: [OVULATION_METHODS.PROGESTERONE_TEST, OVULATION_METHODS.LH_TEST, OVULATION_METHODS.VAGINAL_CYTOLOGY],
  },
  CAT: {
    supportsUpgrade: false,
    isInducedOvulator: true,
    testingAvailable: false,
    defaultAnchor: ANCHOR_MODES.BREEDING_DATE,
    recommendedAnchor: ANCHOR_MODES.BREEDING_DATE,
    availableAnchors: [ANCHOR_MODES.BREEDING_DATE],
    confirmationMethods: [],
  },
  HORSE: {
    supportsUpgrade: true,
    isInducedOvulator: false,
    testingAvailable: true,
    defaultAnchor: ANCHOR_MODES.CYCLE_START,
    recommendedAnchor: ANCHOR_MODES.OVULATION,
    availableAnchors: [ANCHOR_MODES.CYCLE_START, ANCHOR_MODES.OVULATION],
    confirmationMethods: [OVULATION_METHODS.ULTRASOUND],
  },
  RABBIT: {
    supportsUpgrade: false,
    isInducedOvulator: true,
    testingAvailable: false,
    defaultAnchor: ANCHOR_MODES.BREEDING_DATE,
    recommendedAnchor: ANCHOR_MODES.BREEDING_DATE,
    availableAnchors: [ANCHOR_MODES.BREEDING_DATE],
    confirmationMethods: [],
  },
  GOAT: {
    supportsUpgrade: false,
    isInducedOvulator: false,
    testingAvailable: false,
    defaultAnchor: ANCHOR_MODES.CYCLE_START,
    recommendedAnchor: ANCHOR_MODES.CYCLE_START,
    availableAnchors: [ANCHOR_MODES.CYCLE_START],
    confirmationMethods: [],
  },
} as const;

/**
 * Test scenarios for lock endpoint
 */
export const LOCK_TEST_SCENARIOS = {
  dogCycleStart: {
    species: TEST_SPECIES.DOG,
    anchorMode: ANCHOR_MODES.CYCLE_START,
    anchorDate: '2026-03-15',
    expectedConfidence: CONFIDENCE_LEVELS.MEDIUM,
    expectedDueDate: '2026-05-29', // +75 days from cycle start
    description: 'Dog - Lock with cycle start',
  },
  dogOvulation: {
    species: TEST_SPECIES.DOG,
    anchorMode: ANCHOR_MODES.OVULATION,
    anchorDate: '2026-03-27', // Typical ovulation ~12 days after heat start
    confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    expectedConfidence: CONFIDENCE_LEVELS.HIGH,
    expectedDueDate: '2026-05-29', // +63 days from ovulation
    description: 'Dog - Lock with ovulation (progesterone test)',
  },
  catBreeding: {
    species: TEST_SPECIES.CAT,
    anchorMode: ANCHOR_MODES.BREEDING_DATE,
    anchorDate: '2026-03-15',
    expectedConfidence: CONFIDENCE_LEVELS.MEDIUM,
    expectedDueDate: '2026-05-17', // +63 days from breeding
    description: 'Cat - Lock with breeding date (induced ovulator)',
  },
  horseOvulation: {
    species: TEST_SPECIES.HORSE,
    anchorMode: ANCHOR_MODES.OVULATION,
    anchorDate: '2026-03-20',
    confirmationMethod: OVULATION_METHODS.ULTRASOUND,
    expectedConfidence: CONFIDENCE_LEVELS.HIGH,
    expectedDueDate: '2027-02-23', // +340 days from ovulation
    description: 'Horse - Lock with ovulation (ultrasound)',
  },
  rabbitBreeding: {
    species: TEST_SPECIES.RABBIT,
    anchorMode: ANCHOR_MODES.BREEDING_DATE,
    anchorDate: '2026-03-15',
    expectedConfidence: CONFIDENCE_LEVELS.MEDIUM,
    expectedDueDate: '2026-04-15', // +31 days from breeding
    description: 'Rabbit - Lock with breeding date (induced ovulator)',
  },
  goatCycleStart: {
    species: TEST_SPECIES.GOAT,
    anchorMode: ANCHOR_MODES.CYCLE_START,
    anchorDate: '2026-09-15', // Goats are seasonal (fall)
    expectedConfidence: CONFIDENCE_LEVELS.MEDIUM,
    expectedDueDate: '2027-02-14', // +152 days from cycle start
    description: 'Goat - Lock with cycle start',
  },
} as const;

/**
 * Test scenarios for upgrade endpoint
 */
export const UPGRADE_TEST_SCENARIOS = {
  dogOnTime: {
    species: TEST_SPECIES.DOG,
    initialAnchorDate: '2026-03-15', // Cycle start
    ovulationDate: '2026-03-27', // Day 12 (exactly expected)
    confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    expectedVariance: 0,
    expectedAnalysis: 'on-time',
    description: 'Dog - Upgrade with on-time ovulation',
  },
  dogLate: {
    species: TEST_SPECIES.DOG,
    initialAnchorDate: '2026-03-15', // Cycle start
    ovulationDate: '2026-03-29', // Day 14 (2 days late)
    confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    expectedVariance: 2,
    expectedAnalysis: 'late',
    description: 'Dog - Upgrade with late ovulation (+2 days)',
  },
  dogEarly: {
    species: TEST_SPECIES.DOG,
    initialAnchorDate: '2026-03-15', // Cycle start
    ovulationDate: '2026-03-24', // Day 9 (3 days early)
    confirmationMethod: OVULATION_METHODS.PROGESTERONE_TEST,
    expectedVariance: -3,
    expectedAnalysis: 'early',
    description: 'Dog - Upgrade with early ovulation (-3 days)',
  },
  horseUpgrade: {
    species: TEST_SPECIES.HORSE,
    initialAnchorDate: '2026-03-15', // Cycle start
    ovulationDate: '2026-03-20', // Day 5 (expected)
    confirmationMethod: OVULATION_METHODS.ULTRASOUND,
    expectedVariance: 0,
    expectedAnalysis: 'on-time',
    description: 'Horse - Upgrade with ultrasound confirmation',
  },
} as const;

/**
 * Immutability test scenarios
 */
export const IMMUTABILITY_TEST_SCENARIOS = {
  planningPhase: {
    status: 'PLANNING',
    allowedChanges: ['reproAnchorMode', 'cycleStartObserved', 'ovulationConfirmed', 'breedDateActual', 'birthDateActual'],
    description: 'Planning phase - all fields mutable',
  },
  committedPhase: {
    status: 'COMMITTED',
    allowedChanges: ['cycleStartObserved', 'ovulationConfirmed', 'breedDateActual'], // Limited tolerance
    lockedFields: ['reproAnchorMode'], // Only upgrade allowed
    description: 'Committed phase - anchor locked, dates have tolerance',
  },
  bredPhase: {
    status: 'BRED',
    lockedFields: ['reproAnchorMode', 'cycleStartObserved', 'ovulationConfirmed'],
    allowedChanges: ['breedDateActual', 'birthDateActual'], // Limited tolerance
    description: 'Bred phase - pre-breeding dates locked',
  },
  birthedPhase: {
    status: 'BIRTHED',
    lockedFields: ['reproAnchorMode', 'cycleStartObserved', 'ovulationConfirmed', 'breedDateActual', 'birthDateActual'],
    description: 'Birthed phase - birth date strictly immutable',
  },
} as const;

/**
 * Calculate expected due date from anchor
 */
export function calculateExpectedDueDate(
  species: keyof typeof SPECIES_DEFAULTS,
  anchorMode: string,
  anchorDate: string
): string {
  const defaults = SPECIES_DEFAULTS[species];
  const date = new Date(anchorDate);

  let daysToAdd: number;

  if (anchorMode === ANCHOR_MODES.OVULATION || anchorMode === ANCHOR_MODES.BREEDING_DATE) {
    daysToAdd = defaults.gestationDays;
  } else {
    // CYCLE_START
    daysToAdd = defaults.ovulationOffsetDays + defaults.gestationDays;
  }

  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}
