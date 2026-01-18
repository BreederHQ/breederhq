// tests/e2e/animals/cycle-info-tab/cycle-helpers.ts
// Helper functions for cycle info tab tests

import { APIRequestContext, Page } from '@playwright/test';
import { HogwartsConfig } from '../../breeding/config/hogwarts-config';

export interface CreateAnimalParams {
  name: string;
  species: string;
  sex: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  breed?: string;
  femaleCycleLenOverrideDays?: number | null;
}

export interface UpdateAnimalParams {
  femaleCycleLenOverrideDays?: number | null;
}

export interface CycleStartDatesPayload {
  animalId: number | string;
  dates: string[];
}

/**
 * Create a test animal via API
 */
export async function createTestAnimal(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  params: CreateAnimalParams
): Promise<{ id: number; [key: string]: any }> {
  const response = await apiContext.post(
    `${config.apiBaseUrl}/api/v1/animals`,
    {
      data: {
        name: params.name,
        species: params.species,
        sex: params.sex,
        dateOfBirth: params.dateOfBirth || '2020-01-01',
        breed: params.breed,
        microchipId: `CYCLE-TEST-${params.species}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        isActive: true,
        femaleCycleLenOverrideDays: params.femaleCycleLenOverrideDays,
      },
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to create animal: ${response.status()} ${text}`);
  }

  const animal = await response.json();
  console.log(`[CycleHelper] Created test animal ${animal.id}: ${params.name} (${params.species} ${params.sex})`);
  return animal;
}

/**
 * Update an animal via API
 */
export async function updateAnimal(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  animalId: number,
  params: UpdateAnimalParams
): Promise<any> {
  const response = await apiContext.patch(
    `${config.apiBaseUrl}/api/v1/animals/${animalId}`,
    {
      data: params,
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to update animal: ${response.status()} ${text}`);
  }

  return response.json();
}

/**
 * Set cycle start dates for an animal via API
 */
export async function setCycleStartDates(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  payload: CycleStartDatesPayload
): Promise<any> {
  const response = await apiContext.put(
    `${config.apiBaseUrl}/api/v1/animals/${payload.animalId}/cycle-start-dates`,
    {
      data: { dates: payload.dates },
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to set cycle start dates: ${response.status()} ${text}`);
  }

  console.log(`[CycleHelper] Set ${payload.dates.length} cycle start dates for animal ${payload.animalId}`);
  return response.json();
}

/**
 * Get cycle analysis for an animal via API
 */
export async function getCycleAnalysis(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  animalId: number
): Promise<any> {
  const response = await apiContext.get(
    `${config.apiBaseUrl}/api/v1/animals/${animalId}/cycle-analysis`
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to get cycle analysis: ${response.status()} ${text}`);
  }

  return response.json();
}

/**
 * Navigate to an animal's cycle info tab
 */
export async function navigateToCycleTab(
  page: Page,
  frontendUrl: string,
  animalId: number
): Promise<void> {
  await page.goto(`${frontendUrl}/platform/animals/${animalId}`);
  await page.waitForLoadState('networkidle');

  // Click the Cycle Info tab
  const cycleTab = page.locator('button, a, [role="tab"]').filter({ hasText: /cycle\s*info/i });
  await cycleTab.click();
  await page.waitForTimeout(500); // Wait for tab transition
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Add days to a date string
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Generate cycle start dates for a dog with given cycle length
 */
export function generateDogCycleStartDates(
  count: number,
  cycleLengthDays: number = 180
): string[] {
  const today = todayISO();
  const dates: string[] = [];

  // Start from a date in the past
  let currentDate = addDays(today, -(count * cycleLengthDays));

  for (let i = 0; i < count; i++) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, cycleLengthDays);
  }

  return dates;
}

/**
 * Generate cycle start dates for short-cycle species (horse, goat, etc)
 */
export function generateShortCycleStartDates(
  count: number,
  cycleLengthDays: number = 21
): string[] {
  const today = todayISO();
  const dates: string[] = [];

  // Start from a date in the past
  let currentDate = addDays(today, -(count * cycleLengthDays));

  for (let i = 0; i < count; i++) {
    dates.push(currentDate);
    currentDate = addDays(currentDate, cycleLengthDays);
  }

  return dates;
}

/**
 * Species defaults (matching reproEngine)
 */
export const SPECIES_CYCLE_DEFAULTS = {
  DOG: { cycleLenDays: 180, ovulationOffsetDays: 12 },
  CAT: { cycleLenDays: 21, ovulationOffsetDays: 3 },
  HORSE: { cycleLenDays: 21, ovulationOffsetDays: 5 },
  GOAT: { cycleLenDays: 21, ovulationOffsetDays: 2 },
  SHEEP: { cycleLenDays: 17, ovulationOffsetDays: 2 },
  RABBIT: { cycleLenDays: 15, ovulationOffsetDays: 0 },
} as const;
