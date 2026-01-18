// tests/e2e/breeding/config/hogwarts-config.ts
// Configuration for Hogwarts tenant used in breeding tests

export interface HogwartsConfig {
  tenantId: number;
  userId: number;
  email: string;
  password: string;
  apiBaseUrl: string;
  frontendUrl: string;
}

// Hogwarts tenant configuration
// Note: These IDs are from the seeded dev database
// If running against a fresh database, run the seed script first
export const HOGWARTS_CONFIG: HogwartsConfig = {
  tenantId: 87, // Hogwarts tenant ID (from dev seed)
  userId: 1, // Hagrid's user ID (from dev seed)
  email: process.env.TEST_BREEDER_EMAIL || 'hagrid.dev@hogwarts.local',
  password: process.env.TEST_BREEDER_PASSWORD || 'Hogwarts123!',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:6001',
  frontendUrl: process.env.BASE_URL || 'http://localhost:6170',
};

/**
 * Get Hogwarts config for tests
 */
export function getHogwartsConfig(): HogwartsConfig {
  return HOGWARTS_CONFIG;
}

/**
 * Species codes for testing
 */
export const TEST_SPECIES = {
  DOG: 'DOG',
  CAT: 'CAT',
  HORSE: 'HORSE',
  RABBIT: 'RABBIT',
  GOAT: 'GOAT',
} as const;

/**
 * Anchor mode values
 */
export const ANCHOR_MODES = {
  CYCLE_START: 'CYCLE_START',
  OVULATION: 'OVULATION',
  BREEDING_DATE: 'BREEDING_DATE',
} as const;

/**
 * Ovulation methods for testing
 */
export const OVULATION_METHODS = {
  PROGESTERONE_TEST: 'PROGESTERONE_TEST',
  LH_TEST: 'LH_TEST',
  ULTRASOUND: 'ULTRASOUND',
  VAGINAL_CYTOLOGY: 'VAGINAL_CYTOLOGY',
  BREEDING_INDUCED: 'BREEDING_INDUCED',
} as const;

/**
 * Confidence levels
 */
export const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;

/**
 * Plan statuses for testing
 */
export const PLAN_STATUSES = {
  PLANNING: 'PLANNING',
  COMMITTED: 'COMMITTED',
  BRED: 'BRED',
  BIRTHED: 'BIRTHED',
  WEANED: 'WEANED',
  PLACEMENT: 'PLACEMENT',
  COMPLETE: 'COMPLETE',
  CANCELED: 'CANCELED',
} as const;
