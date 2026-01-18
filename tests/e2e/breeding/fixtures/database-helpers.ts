// tests/e2e/breeding/fixtures/database-helpers.ts
// Database helpers for creating test data via API

import { APIRequestContext } from '@playwright/test';
import { HogwartsConfig, ANCHOR_MODES, PLAN_STATUSES } from '../config/hogwarts-config';

export interface CreateBreedingPlanParams {
  name: string;
  species: string;
  damId: number;
  sireId: number;
  status?: string;
  reproAnchorMode?: string;
  cycleStartObserved?: string;
  ovulationConfirmed?: string;
  ovulationConfirmedMethod?: string;
  lockedCycleStart?: string;
  breedDateActual?: string;
  birthDateActual?: string;
  notes?: string;
}

export interface CreateAnimalParams {
  name: string;
  species: string;
  sex: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  breed?: string;
}

export interface LockPlanParams {
  anchorMode: 'CYCLE_START' | 'OVULATION' | 'BREEDING_DATE';
  anchorDate: string;
  confirmationMethod?: string;
  testResultId?: number;
  notes?: string;
}

export interface UpgradeToOvulationParams {
  ovulationDate: string;
  confirmationMethod: string;
  testResultId?: number;
  notes?: string;
}

/**
 * Create a breeding plan via API
 */
export async function createBreedingPlan(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  params: CreateBreedingPlanParams
): Promise<{ id: number; [key: string]: any }> {
  const response = await apiContext.post(
    `${config.apiBaseUrl}/api/v1/breeding/plans`,
    {
      data: {
        name: params.name,
        species: params.species,
        damId: params.damId,
        sireId: params.sireId,
        status: params.status || PLAN_STATUSES.PLANNING,
        reproAnchorMode: params.reproAnchorMode || ANCHOR_MODES.CYCLE_START,
        cycleStartObserved: params.cycleStartObserved,
        ovulationConfirmed: params.ovulationConfirmed,
        ovulationConfirmedMethod: params.ovulationConfirmedMethod,
        lockedCycleStart: params.lockedCycleStart,
        breedDateActual: params.breedDateActual,
        birthDateActual: params.birthDateActual,
        notes: params.notes,
      },
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to create breeding plan: ${response.status()} ${text}`);
  }

  const plan = await response.json();
  console.log(`[DB] Created breeding plan ${plan.id}: ${params.name}`);
  return plan;
}

/**
 * Get a breeding plan by ID via API
 */
export async function getBreedingPlan(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  planId: number
): Promise<any> {
  const response = await apiContext.get(
    `${config.apiBaseUrl}/api/v1/breeding/plans/${planId}`
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to get breeding plan: ${response.status()} ${text}`);
  }

  return response.json();
}

/**
 * Update a breeding plan via API
 */
export async function updateBreedingPlan(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  planId: number,
  updates: Partial<CreateBreedingPlanParams>
): Promise<any> {
  const response = await apiContext.patch(
    `${config.apiBaseUrl}/api/v1/breeding/plans/${planId}`,
    {
      data: updates,
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to update breeding plan: ${response.status()} ${text}`);
  }

  return response.json();
}

/**
 * Lock a breeding plan with anchor mode via API
 */
export async function lockBreedingPlan(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  planId: number,
  params: LockPlanParams
): Promise<any> {
  const response = await apiContext.post(
    `${config.apiBaseUrl}/api/v1/breeding/plans/${planId}/lock`,
    {
      data: {
        anchorMode: params.anchorMode,
        anchorDate: params.anchorDate,
        confirmationMethod: params.confirmationMethod,
        testResultId: params.testResultId,
        notes: params.notes,
      },
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to lock breeding plan: ${response.status()} ${text}`);
  }

  return response.json();
}

/**
 * Upgrade a breeding plan from CYCLE_START to OVULATION anchor via API
 */
export async function upgradeToOvulation(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  planId: number,
  params: UpgradeToOvulationParams
): Promise<any> {
  const response = await apiContext.post(
    `${config.apiBaseUrl}/api/v1/breeding/plans/${planId}/upgrade-to-ovulation`,
    {
      data: {
        ovulationDate: params.ovulationDate,
        confirmationMethod: params.confirmationMethod,
        testResultId: params.testResultId,
        notes: params.notes,
      },
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to upgrade to ovulation: ${response.status()} ${text}`);
  }

  return response.json();
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
        microchipId: `TEST-${params.species}-${params.sex}-${Date.now()}`,
        isActive: true,
      },
    }
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to create animal: ${response.status()} ${text}`);
  }

  const animal = await response.json();
  console.log(`[DB] Created test animal ${animal.id}: ${params.name} (${params.species} ${params.sex})`);
  return animal;
}

/**
 * Get animals for a tenant via API (for finding existing test animals)
 */
export async function getAnimals(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  filters?: { species?: string; sex?: string }
): Promise<any[]> {
  let url = `${config.apiBaseUrl}/api/v1/animals`;
  const params = new URLSearchParams();
  if (filters?.species) params.append('species', filters.species);
  if (filters?.sex) params.append('sex', filters.sex);
  if (params.toString()) url += `?${params.toString()}`;

  console.log(`[DB] Fetching animals from: ${url}`);
  const response = await apiContext.get(url);

  if (!response.ok()) {
    const text = await response.text();
    console.error(`[DB] Failed to get animals: ${response.status()} ${text}`);
    throw new Error(`Failed to get animals: ${response.status()} ${text}`);
  }

  const result = await response.json();
  // Handle both array response and paginated response (items, data, or animals)
  const animals = Array.isArray(result) ? result : (result.items || result.data || result.animals || []);
  console.log(`[DB] Found ${animals.length} animals for species=${filters?.species || 'all'}`);
  return animals;
}

/**
 * Delete a breeding plan via API
 */
export async function deleteBreedingPlan(
  apiContext: APIRequestContext,
  config: HogwartsConfig,
  planId: number
): Promise<void> {
  const response = await apiContext.delete(
    `${config.apiBaseUrl}/api/v1/breeding/plans/${planId}`
  );

  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Failed to delete breeding plan: ${response.status()} ${text}`);
  }

  console.log(`[DB] Deleted breeding plan ${planId}`);
}

/**
 * Helper to add days to a date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Get today's date as ISO string
 */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Get a date N days from today
 */
export function daysFromToday(days: number): string {
  return addDays(todayISO(), days);
}
