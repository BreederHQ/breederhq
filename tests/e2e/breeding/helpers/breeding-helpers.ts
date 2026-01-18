// tests/e2e/breeding/helpers/breeding-helpers.ts
// Helper functions for breeding e2e tests

import { Page, expect } from '@playwright/test';
import { HogwartsConfig } from '../config/hogwarts-config';

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Navigate to breeding planner page
 */
export async function navigateToBreedingPlanner(
  page: Page,
  config: HogwartsConfig
): Promise<void> {
  await page.goto(`${config.frontendUrl}/breeding`);
  await waitForPageReady(page);

  // Wait for breeding planner to load
  await page.waitForSelector('[data-testid="breeding-planner"], .breeding-planner, h1:has-text("Breeding")', {
    timeout: 10000,
  });
}

/**
 * Open breeding plan drawer for a specific plan
 */
export async function openPlanDrawer(page: Page, planId: number): Promise<void> {
  // Click on the plan row
  await page.click(`[data-plan-id="${planId}"], tr:has([data-plan-id="${planId}"])`);

  // Wait for drawer to open
  await page.waitForSelector('[data-testid="plan-drawer"], [role="dialog"], .drawer', {
    state: 'visible',
    timeout: 5000,
  });
}

/**
 * Navigate to Dates tab in plan drawer
 */
export async function navigateToDatesTab(page: Page): Promise<void> {
  const datesTab = page.locator('button, [role="tab"]').filter({ hasText: /dates/i }).first();
  await datesTab.click();
  await page.waitForTimeout(300); // Wait for tab content to load
}

/**
 * Fill cycle start date in drawer
 */
export async function fillCycleStartDate(page: Page, date: string): Promise<void> {
  const cycleStartInput = page.locator('input[name*="cycleStart"], input[id*="cycle-start"], input[type="date"]')
    .filter({ has: page.locator('..').locator(':has-text("Heat Start"), :has-text("Cycle Start")') })
    .first();

  // Fallback to generic date input near cycle start label
  const input = await cycleStartInput.count() > 0
    ? cycleStartInput
    : page.locator('label:has-text("Heat Start"), label:has-text("Cycle Start")')
        .locator('..').locator('input[type="date"]').first();

  await input.fill(date);
}

/**
 * Fill ovulation date in drawer
 */
export async function fillOvulationDate(page: Page, date: string): Promise<void> {
  const ovulationInput = page.locator('input[name*="ovulation"], input[id*="ovulation"]')
    .filter({ hasNot: page.locator('[disabled]') })
    .first();

  await ovulationInput.fill(date);
}

/**
 * Select ovulation confirmation method
 */
export async function selectConfirmationMethod(page: Page, method: string): Promise<void> {
  const methodSelect = page.locator('select[name*="method"], select[id*="method"]').first();
  await methodSelect.selectOption({ value: method });
}

/**
 * Click lock plan button
 */
export async function clickLockPlan(page: Page): Promise<void> {
  const lockButton = page.locator('button').filter({ hasText: /lock|commit/i }).first();
  await lockButton.click();
}

/**
 * Click upgrade to ovulation button
 */
export async function clickUpgradeToOvulation(page: Page): Promise<void> {
  const upgradeButton = page.locator('button').filter({ hasText: /upgrade.*ovulation/i }).first();
  await upgradeButton.click();
}

/**
 * Verify anchor mode badge displays correctly
 */
export async function verifyAnchorModeBadge(
  page: Page,
  expectedMode: 'CYCLE_START' | 'OVULATION' | 'BREEDING_DATE'
): Promise<void> {
  const modeLabels = {
    CYCLE_START: /cycle.*start|heat.*start/i,
    OVULATION: /ovulation/i,
    BREEDING_DATE: /breeding.*date/i,
  };

  const badge = page.locator('[data-testid="anchor-mode"], .anchor-mode-badge')
    .filter({ hasText: modeLabels[expectedMode] });

  await expect(badge).toBeVisible({ timeout: 5000 });
}

/**
 * Verify confidence level badge
 */
export async function verifyConfidenceBadge(
  page: Page,
  expectedLevel: 'HIGH' | 'MEDIUM' | 'LOW'
): Promise<void> {
  const badge = page.locator('[data-testid="confidence-badge"], .confidence-badge')
    .filter({ hasText: new RegExp(expectedLevel, 'i') });

  await expect(badge).toBeVisible({ timeout: 5000 });
}

/**
 * Verify expected due date is displayed
 */
export async function verifyExpectedDueDate(page: Page, expectedDate: string): Promise<void> {
  // Format date for display (may vary based on locale)
  const dateObj = new Date(expectedDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const dueDateElement = page.locator('[data-testid="due-date"], .due-date, :has-text("Due Date")')
    .locator(`..`)
    .filter({ hasText: new RegExp(formattedDate.replace(/\s+/g, '\\s*'), 'i') });

  // Also check for ISO format
  const isoElement = page.locator(`text="${expectedDate}"`);

  const visible = await dueDateElement.count() > 0 || await isoElement.count() > 0;
  expect(visible).toBeTruthy();
}

/**
 * Verify variance analysis display after upgrade
 */
export async function verifyVarianceAnalysis(
  page: Page,
  expectedVariance: number,
  expectedAnalysis: 'on-time' | 'early' | 'late'
): Promise<void> {
  const varianceSection = page.locator('[data-testid="variance-analysis"], .variance-analysis');
  await expect(varianceSection).toBeVisible({ timeout: 5000 });

  // Check variance value
  const varianceText = await varianceSection.textContent();
  expect(varianceText).toContain(String(Math.abs(expectedVariance)));

  // Check analysis text
  expect(varianceText?.toLowerCase()).toContain(expectedAnalysis);
}

/**
 * Check if ovulation fields are visible (species-dependent)
 */
export async function areOvulationFieldsVisible(page: Page): Promise<boolean> {
  const ovulationField = page.locator('input[name*="ovulation"], label:has-text("Ovulation")').first();
  return await ovulationField.isVisible().catch(() => false);
}

/**
 * Check if cycle start field is visible (hidden for induced ovulators)
 */
export async function isCycleStartFieldVisible(page: Page): Promise<boolean> {
  const cycleStartField = page.locator('input[name*="cycleStart"], label:has-text("Heat Start"), label:has-text("Cycle Start")').first();
  return await cycleStartField.isVisible().catch(() => false);
}

/**
 * Check if upgrade button is visible
 */
export async function isUpgradeButtonVisible(page: Page): Promise<boolean> {
  const upgradeButton = page.locator('button').filter({ hasText: /upgrade.*ovulation/i }).first();
  return await upgradeButton.isVisible().catch(() => false);
}

/**
 * Get current plan status from UI
 */
export async function getCurrentPlanStatus(page: Page): Promise<string> {
  const statusBadge = page.locator('[data-testid="plan-status"], .plan-status, .status-badge').first();
  const text = await statusBadge.textContent();
  return text?.trim().toUpperCase() || '';
}

/**
 * Verify immutability error is shown
 */
export async function verifyImmutabilityError(page: Page, field: string): Promise<void> {
  const errorMessage = page.locator('[role="alert"], .error-message, .toast-error')
    .filter({ hasText: new RegExp(`${field}.*immutable|cannot.*change.*${field}|locked`, 'i') });

  await expect(errorMessage).toBeVisible({ timeout: 5000 });
}

/**
 * Close any open drawer/modal
 */
export async function closeDrawer(page: Page): Promise<void> {
  // Try escape key first
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // If still visible, try close button
  const closeButton = page.locator('[data-testid="close-drawer"], [aria-label="Close"], button:has-text("Close")').first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}
