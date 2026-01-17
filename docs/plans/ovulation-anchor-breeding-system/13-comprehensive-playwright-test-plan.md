# Comprehensive Playwright Test Plan: Ovulation Anchor System

## Document Purpose

This document defines a complete end-to-end testing strategy using Playwright for the ovulation anchor breeding system. All tests use the **Hogwarts tenant** with credentials `hagrid.dev@hogwarts.local` / `Hogwarts123!`. Tests include automated data setup, comprehensive validation, screenshot capture, and guaranteed cleanup.

**Date:** 2026-01-17
**Test Framework:** Playwright
**Test Account:** hagrid.dev@hogwarts.local (Hogwarts tenant)
**Coverage:** 100% of implementation plan changes

---

## Test Architecture

### Directory Structure

```
tests/e2e/breeding/
├── fixtures/
│   ├── breeding-fixtures.ts          # Breeding-specific fixtures
│   ├── anchor-test-data.ts           # Test data for all species
│   └── database-helpers.ts           # Direct DB access for setup/cleanup
├── helpers/
│   ├── breeding-helpers.ts           # Page object helpers
│   ├── anchor-helpers.ts             # Anchor-specific actions
│   ├── validation-helpers.ts         # Assertion helpers
│   └── cleanup-helpers.ts            # Screenshot/data cleanup
├── specs/
│   ├── phase-1-lock-cycle-start.spec.ts
│   ├── phase-2-lock-ovulation.spec.ts
│   ├── phase-3-upgrade-anchor.spec.ts
│   ├── phase-4-immutability.spec.ts
│   ├── phase-5-offspring-validation.spec.ts
│   ├── phase-6-waitlist-recalculation.spec.ts
│   ├── phase-7-foaling-milestones.spec.ts
│   ├── phase-8-species-specific.spec.ts
│   ├── phase-9-edge-cases.spec.ts
│   └── phase-10-migration.spec.ts
└── config/
    └── hogwarts-config.ts             # Tenant-specific configuration
```

### Test Execution Flow

```
1. Global Setup
   ├─ Find Hogwarts tenant ID from database
   ├─ Verify hagrid.dev@hogwarts.local account exists
   └─ Create baseline test animals (dams, sires) for all 6 species

2. Per-Test Setup
   ├─ Authenticate as Hagrid
   ├─ Create test-specific breeding plan(s)
   ├─ Record created entity IDs for cleanup
   └─ Navigate to breeding planner

3. Test Execution
   ├─ Perform test actions (lock, upgrade, validate, etc.)
   ├─ Take screenshots at key steps
   ├─ Assert expected outcomes
   └─ Log failures with full context

4. Per-Test Teardown
   ├─ Delete test breeding plans
   ├─ Delete test offspring (if created)
   ├─ Delete test waitlist entries (if created)
   ├─ Delete test foaling milestones (if created)
   ├─ Remove screenshots (save only on failure)
   └─ Verify cleanup completed

5. Global Teardown
   └─ Delete all baseline test animals
```

---

## Test Data Setup

### Hogwarts Tenant Configuration

**File:** `tests/e2e/breeding/config/hogwarts-config.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface HogwartsConfig {
  tenantId: number;
  userId: number;
  email: string;
  password: string;
}

/**
 * Find Hogwarts tenant ID and Hagrid user ID.
 * This runs once during global setup.
 */
export async function getHogwartsConfig(): Promise<HogwartsConfig> {
  const user = await prisma.user.findUnique({
    where: { email: 'hagrid.dev@hogwarts.local' },
    include: { tenant: true }
  });

  if (!user || !user.tenant) {
    throw new Error(
      'Hogwarts tenant not found. Ensure hagrid.dev@hogwarts.local exists in database.'
    );
  }

  return {
    tenantId: user.tenant.id,
    userId: user.id,
    email: 'hagrid.dev@hogwarts.local',
    password: 'Hogwarts123!',
  };
}

// Cached config for test runs
let cachedConfig: HogwartsConfig | null = null;

export async function getConfig(): Promise<HogwartsConfig> {
  if (cachedConfig) return cachedConfig;
  cachedConfig = await getHogwartsConfig();
  return cachedConfig;
}
```

### Baseline Test Animals

**File:** `tests/e2e/breeding/fixtures/anchor-test-data.ts`

```typescript
import { PrismaClient, Species } from '@prisma/client';

const prisma = new PrismaClient();

export interface BaselineAnimals {
  tenantId: number;
  animals: {
    // Dogs
    dogDam: { id: number; name: string };
    dogSire: { id: number; name: string };

    // Horses
    horseDam: { id: number; name: string };
    horseSire: { id: number; name: string };

    // Cats
    catDam: { id: number; name: string };
    catSire: { id: number; name: string };

    // Rabbits
    rabbitDam: { id: number; name: string };
    rabbitSire: { id: number; name: string };

    // Goats
    goatDam: { id: number; name: string };
    goatSire: { id: number; name: string };

    // Sheep
    sheepDam: { id: number; name: string };
    sheepSire: { id: number; name: string };
  };
}

/**
 * Create baseline test animals for all species.
 * Called during global setup.
 */
export async function createBaselineAnimals(tenantId: number): Promise<BaselineAnimals> {
  const animals: any = {};

  // Helper to create a dam/sire pair
  async function createPair(species: Species, prefix: string) {
    const dam = await prisma.animal.create({
      data: {
        tenantId,
        name: `${prefix} Test Dam`,
        species,
        sex: 'FEMALE',
        microchipId: `TEST-${species}-DAM-${Date.now()}`,
        dateOfBirth: new Date('2020-01-01'),
        isActive: true,
      }
    });

    const sire = await prisma.animal.create({
      data: {
        tenantId,
        name: `${prefix} Test Sire`,
        species,
        sex: 'MALE',
        microchipId: `TEST-${species}-SIRE-${Date.now()}`,
        dateOfBirth: new Date('2019-01-01'),
        isActive: true,
      }
    });

    return { dam, sire };
  }

  const dogPair = await createPair('DOG', 'Fang');
  animals.dogDam = { id: dogPair.dam.id, name: dogPair.dam.name };
  animals.dogSire = { id: dogPair.sire.id, name: dogPair.sire.name };

  const horsePair = await createPair('HORSE', 'Buckbeak');
  animals.horseDam = { id: horsePair.dam.id, name: horsePair.dam.name };
  animals.horseSire = { id: horsePair.sire.id, name: horsePair.sire.name };

  const catPair = await createPair('CAT', 'Crookshanks');
  animals.catDam = { id: catPair.dam.id, name: catPair.dam.name };
  animals.catSire = { id: catPair.sire.id, name: catPair.sire.name };

  const rabbitPair = await createPair('RABBIT', 'Hoppy');
  animals.rabbitDam = { id: rabbitPair.dam.id, name: rabbitPair.dam.name };
  animals.rabbitSire = { id: rabbitPair.sire.id, name: rabbitPair.sire.name };

  const goatPair = await createPair('GOAT', 'Billy');
  animals.goatDam = { id: goatPair.dam.id, name: goatPair.dam.name };
  animals.goatSire = { id: goatPair.sire.id, name: goatPair.sire.name };

  const sheepPair = await createPair('SHEEP', 'Woolly');
  animals.sheepDam = { id: sheepPair.dam.id, name: sheepPair.dam.name };
  animals.sheepSire = { id: sheepPair.sire.id, name: sheepPair.sire.name };

  console.log('[Setup] Created baseline test animals for all 6 species');

  return { tenantId, animals };
}

/**
 * Delete all baseline test animals.
 * Called during global teardown.
 */
export async function deleteBaselineAnimals(baseline: BaselineAnimals): Promise<void> {
  const animalIds = Object.values(baseline.animals).map(a => a.id);

  await prisma.animal.deleteMany({
    where: { id: { in: animalIds } }
  });

  console.log('[Teardown] Deleted baseline test animals');
}
```

### Per-Test Fixtures

**File:** `tests/e2e/breeding/fixtures/breeding-fixtures.ts`

```typescript
import { test as base, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { getConfig } from '../config/hogwarts-config';
import { BaselineAnimals } from './anchor-test-data';

const prisma = new PrismaClient();

interface BreedingTestFixtures {
  authenticatedPage: Page;
  hogwartsConfig: Awaited<ReturnType<typeof getConfig>>;
  baselineAnimals: BaselineAnimals;

  // Cleanup trackers
  testPlanIds: number[];
  testOffspringIds: number[];
  testWaitlistIds: number[];
  testMilestoneIds: number[];
  screenshots: string[];
}

export const test = base.extend<BreedingTestFixtures>({
  // Hogwarts config (auto-loaded)
  hogwartsConfig: async ({}, use) => {
    const config = await getConfig();
    await use(config);
  },

  // Baseline animals (loaded from global setup)
  baselineAnimals: async ({}, use) => {
    // Read from global state file
    const fs = require('fs');
    const path = require('path');
    const stateFile = path.join(__dirname, '../../../.test-state/baseline-animals.json');

    if (!fs.existsSync(stateFile)) {
      throw new Error('Baseline animals not created. Run global setup first.');
    }

    const baseline = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    await use(baseline);
  },

  // Cleanup trackers
  testPlanIds: async ({}, use) => {
    const planIds: number[] = [];
    await use(planIds);

    // Cleanup: delete all breeding plans
    if (planIds.length > 0) {
      console.log(`[Cleanup] Deleting ${planIds.length} test breeding plans...`);
      await prisma.breedingPlan.deleteMany({
        where: { id: { in: planIds } }
      });
    }
  },

  testOffspringIds: async ({}, use) => {
    const offspringIds: number[] = [];
    await use(offspringIds);

    if (offspringIds.length > 0) {
      console.log(`[Cleanup] Deleting ${offspringIds.length} test offspring...`);
      await prisma.offspring.deleteMany({
        where: { id: { in: offspringIds } }
      });
    }
  },

  testWaitlistIds: async ({}, use) => {
    const waitlistIds: number[] = [];
    await use(waitlistIds);

    if (waitlistIds.length > 0) {
      console.log(`[Cleanup] Deleting ${waitlistIds.length} test waitlist entries...`);
      await prisma.waitlistEntry.deleteMany({
        where: { id: { in: waitlistIds } }
      });
    }
  },

  testMilestoneIds: async ({}, use) => {
    const milestoneIds: number[] = [];
    await use(milestoneIds);

    if (milestoneIds.length > 0) {
      console.log(`[Cleanup] Deleting ${milestoneIds.length} test milestones...`);
      await prisma.foalingMilestone.deleteMany({
        where: { id: { in: milestoneIds } }
      });
    }
  },

  screenshots: async ({}, use) => {
    const screenshots: string[] = [];
    await use(screenshots);

    // Cleanup: delete screenshots (except on test failure)
    const fs = require('fs');
    const testInfo = (base as any).info();
    if (testInfo.status === 'passed' && screenshots.length > 0) {
      console.log(`[Cleanup] Deleting ${screenshots.length} test screenshots...`);
      for (const screenshot of screenshots) {
        if (fs.existsSync(screenshot)) {
          fs.unlinkSync(screenshot);
        }
      }
    }
  },

  // Authenticated page (auto-login as Hagrid)
  authenticatedPage: async ({ page, hogwartsConfig }, use) => {
    // Navigate to login
    await page.goto('/login');

    // Fill credentials
    await page.fill('input[type="email"], input[name="email"]', hogwartsConfig.email);
    await page.fill('input[type="password"], input[name="password"]', hogwartsConfig.password);

    // Submit
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL(/\/(dashboard|platform|breeding)/, { timeout: 10000 });

    // Verify logged in as Hagrid
    const userEmail = await page.locator('[data-testid="user-email"]').textContent();
    if (userEmail !== hogwartsConfig.email) {
      throw new Error(`Expected to be logged in as ${hogwartsConfig.email}, but got ${userEmail}`);
    }

    console.log(`[Auth] Logged in as ${hogwartsConfig.email}`);

    await use(page);

    // Cleanup
    await page.close();
  },
});

export { expect } from '@playwright/test';
```

---

## Test Helpers

### Database Helpers

**File:** `tests/e2e/breeding/helpers/database-helpers.ts`

```typescript
import { PrismaClient, Species, ReproAnchorMode } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateBreedingPlanParams {
  tenantId: number;
  userId: number;
  damId: number;
  sireId: number;
  species: Species;
  name: string;
  status?: string;
  reproAnchorMode?: ReproAnchorMode;
  cycleStartObserved?: Date;
  ovulationConfirmed?: Date;
  lockedCycleStart?: Date;
}

/**
 * Create a breeding plan directly in database.
 * Returns plan ID for tracking and cleanup.
 */
export async function createBreedingPlan(params: CreateBreedingPlanParams): Promise<number> {
  const plan = await prisma.breedingPlan.create({
    data: {
      tenantId: params.tenantId,
      createdById: params.userId,
      damId: params.damId,
      sireId: params.sireId,
      species: params.species,
      name: params.name,
      status: params.status || 'PLANNING',
      reproAnchorMode: params.reproAnchorMode || 'CYCLE_START',
      cycleStartObserved: params.cycleStartObserved,
      ovulationConfirmed: params.ovulationConfirmed,
      lockedCycleStart: params.lockedCycleStart,
    }
  });

  console.log(`[DB] Created breeding plan ${plan.id}: ${plan.name}`);
  return plan.id;
}

/**
 * Get breeding plan from database.
 */
export async function getBreedingPlan(planId: number) {
  return await prisma.breedingPlan.findUnique({
    where: { id: planId },
    include: {
      dam: true,
      sire: true,
    }
  });
}

/**
 * Create offspring for a breeding plan.
 */
export async function createOffspring(params: {
  breedingPlanId: number;
  birthDate: Date;
  name: string;
  sex: 'MALE' | 'FEMALE';
}): Promise<number> {
  const offspring = await prisma.offspring.create({
    data: {
      breedingPlanId: params.breedingPlanId,
      birthDate: params.birthDate,
      name: params.name,
      sex: params.sex,
    }
  });

  console.log(`[DB] Created offspring ${offspring.id}: ${offspring.name}`);
  return offspring.id;
}

/**
 * Create waitlist entry.
 */
export async function createWaitlistEntry(params: {
  tenantId: number;
  userId: number;
  species: Species;
  matchedBreedingPlanId?: number;
}): Promise<number> {
  const entry = await prisma.waitlistEntry.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      species: params.species,
      matchedBreedingPlanId: params.matchedBreedingPlanId,
    }
  });

  console.log(`[DB] Created waitlist entry ${entry.id}`);
  return entry.id;
}
```

### Page Object Helpers

**File:** `tests/e2e/breeding/helpers/breeding-helpers.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class BreedingPlannerPage {
  constructor(private page: Page) {}

  async navigateToPlannerAsync() {
    await this.page.goto('/platform/breeding/planner');
    await this.page.waitForLoadState('networkidle');
  }

  async clickCreatePlan() {
    await this.page.click('[data-testid="create-breeding-plan"]');
  }

  async selectDam(damName: string) {
    await this.page.click('[data-testid="dam-select"]');
    await this.page.click(`[data-option="${damName}"]`);
  }

  async selectSire(sireName: string) {
    await this.page.click('[data-testid="sire-select"]');
    await this.page.click(`[data-option="${sireName}"]`);
  }

  async enterPlanName(name: string) {
    await this.page.fill('[data-testid="plan-name"]', name);
  }

  async savePlan() {
    await this.page.click('[data-testid="save-plan"]');
    await this.page.waitForLoadState('networkidle');
  }

  async openPlan(planId: number) {
    await this.page.click(`[data-plan-id="${planId}"]`);
    await this.page.waitForSelector('[data-testid="plan-drawer"]');
  }

  async clickDatesTab() {
    await this.page.click('[data-testid="dates-tab"]');
  }

  async enterCycleStartDate(date: string) {
    await this.page.fill('[data-testid="cycle-start-date"]', date);
  }

  async clickLockPlan() {
    await this.page.click('[data-testid="lock-plan"]');
    await this.page.waitForLoadState('networkidle');
  }

  async getStatus(): Promise<string> {
    return await this.page.locator('[data-testid="plan-status"]').textContent() || '';
  }

  async getExpectedBirthDate(): Promise<string> {
    return await this.page.locator('[data-testid="expected-birth-date"]').textContent() || '';
  }
}

export class AnchorModePage {
  constructor(private page: Page) {}

  async getAnchorMode(): Promise<string> {
    return await this.page.locator('[data-testid="anchor-mode"]').textContent() || '';
  }

  async getAnchorConfidence(): Promise<string> {
    return await this.page.locator('[data-testid="anchor-confidence"]').textContent() || '';
  }

  async enterOvulationDate(date: string) {
    await this.page.fill('[data-testid="ovulation-date"]', date);
  }

  async selectOvulationMethod(method: string) {
    await this.page.click('[data-testid="ovulation-method"]');
    await this.page.click(`[data-option="${method}"]`);
  }

  async clickUpgradeToOvulation() {
    await this.page.click('[data-testid="upgrade-to-ovulation"]');
    await this.page.waitForLoadState('networkidle');
  }

  async isUpgradeButtonVisible(): Promise<boolean> {
    return await this.page.locator('[data-testid="upgrade-to-ovulation"]').isVisible();
  }

  async getVarianceAnalysis(): Promise<string> {
    return await this.page.locator('[data-testid="variance-analysis"]').textContent() || '';
  }
}
```

### Validation Helpers

**File:** `tests/e2e/breeding/helpers/validation-helpers.ts`

```typescript
import { expect, Page } from '@playwright/test';

export async function assertPlanStatus(page: Page, expectedStatus: string) {
  const status = await page.locator('[data-testid="plan-status"]').textContent();
  expect(status).toBe(expectedStatus);
}

export async function assertAnchorMode(page: Page, expectedMode: string) {
  const mode = await page.locator('[data-testid="anchor-mode"]').textContent();
  expect(mode).toContain(expectedMode);
}

export async function assertConfidenceLevel(page: Page, expectedLevel: 'HIGH' | 'MEDIUM' | 'LOW') {
  const confidence = await page.locator('[data-testid="anchor-confidence"]').textContent();
  expect(confidence).toBe(expectedLevel);
}

export async function assertErrorMessage(page: Page, expectedError: string) {
  const errorText = await page.locator('[data-testid="error-message"]').textContent();
  expect(errorText).toContain(expectedError);
}

export async function assertDateValue(page: Page, selector: string, expectedDate: string) {
  const dateValue = await page.locator(selector).inputValue();
  expect(dateValue).toBe(expectedDate);
}

export async function assertElementVisible(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
}

export async function assertElementHidden(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeHidden();
}
```

---

## Test Specifications

### Phase 1: Lock Cycle Start (18 Tests)

**File:** `tests/e2e/breeding/specs/phase-1-lock-cycle-start.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { BreedingPlannerPage } from '../helpers/breeding-helpers';
import { createBreedingPlan } from '../helpers/database-helpers';
import { assertPlanStatus, assertAnchorMode } from '../helpers/validation-helpers';

test.describe('Phase 1: Lock Cycle Start', () => {
  test('DOG - Lock plan with cycle start anchor', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    const page = authenticatedPage;
    const planner = new BreedingPlannerPage(page);

    // Create test plan via DB
    const planId = await createBreedingPlan({
      tenantId: hogwartsConfig.tenantId,
      userId: hogwartsConfig.userId,
      damId: baselineAnimals.animals.dogDam.id,
      sireId: baselineAnimals.animals.dogSire.id,
      species: 'DOG',
      name: 'Test Plan - Cycle Start Lock'
    });
    testPlanIds.push(planId);

    // Navigate to planner
    await planner.navigateToPlannerAsync();

    // Screenshot: Planner view
    const screenshotPath1 = `screenshots/phase1-dog-planner-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath1, fullPage: true });
    screenshots.push(screenshotPath1);

    // Open plan
    await planner.openPlan(planId);
    await planner.clickDatesTab();

    // Enter cycle start date
    const cycleStartDate = '2026-03-15';
    await planner.enterCycleStartDate(cycleStartDate);

    // Screenshot: Before lock
    const screenshotPath2 = `screenshots/phase1-dog-before-lock-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath2, fullPage: true });
    screenshots.push(screenshotPath2);

    // Lock plan
    await planner.clickLockPlan();

    // Screenshot: After lock
    const screenshotPath3 = `screenshots/phase1-dog-after-lock-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath3, fullPage: true });
    screenshots.push(screenshotPath3);

    // Assertions
    await assertPlanStatus(page, 'COMMITTED');
    await assertAnchorMode(page, 'CYCLE_START');

    // Verify expected dates calculated
    const expectedBirthDate = await planner.getExpectedBirthDate();
    expect(expectedBirthDate).toBeTruthy();

    // Verify expected birth is ~75 days from cycle start (12 days ovulation + 63 days gestation)
    const expectedBirth = new Date('2026-05-29'); // 2026-03-15 + 12 + 63
    expect(expectedBirthDate).toContain('May 29');
  });

  test('HORSE - Lock plan with cycle start anchor', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Similar structure as DOG test, but for HORSE
    // Expected birth: cycle start + 5 days (ovulation) + 340 days (gestation)
    // ... implementation ...
  });

  test('CAT - Lock plan with breeding date anchor (induced ovulator)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // For cats, no cycle start shown - only breeding date
    // Breeding = ovulation for induced ovulators
    // ... implementation ...
  });

  // 15 more test cases for all species and variations...
});
```

### Phase 2: Lock Ovulation Direct (12 Tests)

**File:** `tests/e2e/breeding/specs/phase-2-lock-ovulation.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { AnchorModePage } from '../helpers/breeding-helpers';

test.describe('Phase 2: Lock Ovulation Direct', () => {
  test('DOG - Lock plan directly with ovulation anchor', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan
    // Navigate to plan
    // Select "Lock with Ovulation" option (not cycle start)
    // Enter ovulation date
    // Select confirmation method (Progesterone Test)
    // Lock plan
    // Assert status = COMMITTED
    // Assert anchor mode = OVULATION
    // Assert confidence = HIGH
    // Verify expected dates calculated from ovulation (not cycle)
    // ... implementation ...
  });

  test('HORSE - Lock with ovulation, generate foaling milestones', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testMilestoneIds,
    screenshots
  }) => {
    // Lock with ovulation
    // Navigate to foaling milestones tab
    // Click "Generate Milestones"
    // Verify 8 milestones created
    // Verify milestones use ovulation as anchor (not breed date)
    // Track milestone IDs for cleanup
    // ... implementation ...
  });

  // 10 more tests for different species and scenarios...
});
```

### Phase 3: Upgrade Anchor (Cycle → Ovulation) (15 Tests)

**File:** `tests/e2e/breeding/specs/phase-3-upgrade-anchor.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { AnchorModePage } from '../helpers/breeding-helpers';
import { getBreedingPlan } from '../helpers/database-helpers';

test.describe('Phase 3: Upgrade Anchor (Cycle → Ovulation)', () => {
  test('DOG - Upgrade from cycle start to ovulation', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    const page = authenticatedPage;
    const anchorPage = new AnchorModePage(page);

    // Create plan locked with cycle start
    const planId = await createBreedingPlan({
      tenantId: hogwartsConfig.tenantId,
      userId: hogwartsConfig.userId,
      damId: baselineAnimals.animals.dogDam.id,
      sireId: baselineAnimals.animals.dogSire.id,
      species: 'DOG',
      name: 'Test Plan - Upgrade',
      status: 'COMMITTED',
      reproAnchorMode: 'CYCLE_START',
      cycleStartObserved: new Date('2026-03-15'),
      lockedCycleStart: new Date('2026-03-15'),
    });
    testPlanIds.push(planId);

    // Open plan, navigate to dates tab
    // ... navigation ...

    // Screenshot: Before upgrade
    await page.screenshot({ path: `screenshots/phase3-before-upgrade-${Date.now()}.png`, fullPage: true });

    // Verify upgrade button visible
    const isUpgradeVisible = await anchorPage.isUpgradeButtonVisible();
    expect(isUpgradeVisible).toBe(true);

    // Enter ovulation date
    await anchorPage.enterOvulationDate('2026-03-27'); // 12 days after cycle start

    // Select confirmation method
    await anchorPage.selectOvulationMethod('Progesterone Test');

    // Click upgrade
    await anchorPage.clickUpgradeToOvulation();

    // Screenshot: After upgrade
    await page.screenshot({ path: `screenshots/phase3-after-upgrade-${Date.now()}.png`, fullPage: true });

    // Assertions
    await assertAnchorMode(page, 'OVULATION');
    await assertConfidenceLevel(page, 'HIGH');

    // Verify variance analysis shown
    const variance = await anchorPage.getVarianceAnalysis();
    expect(variance).toContain('on-time'); // 0 days variance (12 - 12)

    // Verify dates recalculated
    const plan = await getBreedingPlan(planId);
    expect(plan?.reproAnchorMode).toBe('OVULATION');
    expect(plan?.ovulationConfirmed).toBeTruthy();

    // Verify audit event created
    // ... check database for ANCHOR_UPGRADED event ...
  });

  test('DOG - Upgrade with early ovulation (variance = -2 days)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Cycle start: 2026-03-15
    // Expected ovulation: 2026-03-27 (day 12)
    // Actual ovulation: 2026-03-25 (day 10)
    // Variance: -2 days (early)
    // Expected behavior: Accept, show "early" variance
    // ... implementation ...
  });

  test('DOG - Upgrade with late ovulation (variance = +3 days)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Cycle start: 2026-03-15
    // Expected ovulation: 2026-03-27 (day 12)
    // Actual ovulation: 2026-03-30 (day 15)
    // Variance: +3 days (late)
    // Expected behavior: Accept, show "late" variance
    // ... implementation ...
  });

  test('HORSE - Upgrade, verify foaling milestones recalculate', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testMilestoneIds,
    screenshots
  }) => {
    // Create plan with cycle start, generate milestones
    // Upgrade to ovulation
    // Verify milestones recalculate using new ovulation anchor
    // Verify milestone dates shifted by variance amount
    // ... implementation ...
  });

  // 11 more tests for different species, variance scenarios, edge cases...
});
```

### Phase 4: Immutability Validation (12 Tests)

**File:** `tests/e2e/breeding/specs/phase-4-immutability.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { assertErrorMessage } from '../helpers/validation-helpers';

test.describe('Phase 4: Immutability Validation', () => {
  test('COMMITTED - Allow cycle start correction ±3 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan: status = COMMITTED, cycleStart = 2026-03-15
    // Attempt to change cycleStart to 2026-03-16 (+1 day)
    // Expected: SUCCESS (within ±3 day tolerance)
    // ... implementation ...
  });

  test('COMMITTED - Reject cycle start change >3 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan: status = COMMITTED, cycleStart = 2026-03-15
    // Attempt to change cycleStart to 2026-03-20 (+5 days)
    // Expected: ERROR "Cannot change cycle start by more than 3 days"
    // Screenshot error message
    // ... implementation ...
  });

  test('BRED - Reject cycle start change (locked)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan: status = BRED
    // Attempt to change cycleStart
    // Expected: ERROR "Cycle start date is locked after COMMITTED status"
    // ... implementation ...
  });

  test('COMMITTED - Allow ovulation correction ±2 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // ... implementation ...
  });

  test('COMMITTED - Reject ovulation change >2 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // ... implementation ...
  });

  test('BIRTHED - Reject birth date change (strict immutability)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan: status = BIRTHED, birthDateActual = 2026-05-29
    // Attempt to change birthDateActual
    // Expected: ERROR "Birth date is strictly immutable once set"
    // ... implementation ...
  });

  test('COMMITTED - Allow anchor mode upgrade (CYCLE_START → OVULATION)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // ... implementation (this is tested in Phase 3 but verify immutability allows it) ...
  });

  test('COMMITTED - Reject anchor mode downgrade (OVULATION → CYCLE_START)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan: reproAnchorMode = OVULATION
    // Attempt to change to CYCLE_START
    // Expected: ERROR "Cannot change anchor mode except upgrade"
    // ... implementation ...
  });

  // 4 more immutability tests for different fields and statuses...
});
```

### Phase 5: Offspring Validation (10 Tests)

**File:** `tests/e2e/breeding/specs/phase-5-offspring-validation.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { createOffspring } from '../helpers/database-helpers';

test.describe('Phase 5: Offspring Validation', () => {
  test('OVULATION anchor - Accept offspring birth ±2 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testOffspringIds,
    screenshots
  }) => {
    // Create plan: reproAnchorMode = OVULATION, birthDateActual = 2026-05-29
    // Create offspring with birthDate = 2026-05-30 (+1 day)
    // Expected: SUCCESS (within ±2 day tolerance for ovulation)
    // ... implementation ...
  });

  test('OVULATION anchor - Reject offspring birth >2 days variance', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testOffspringIds,
    screenshots
  }) => {
    // Create plan: reproAnchorMode = OVULATION, birthDateActual = 2026-05-29
    // Attempt offspring with birthDate = 2026-06-02 (+4 days)
    // Expected: ERROR "differs by 4 days... max ±2 days for OVULATION anchor"
    // ... implementation ...
  });

  test('CYCLE_START anchor - Accept offspring birth ±3 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testOffspringIds,
    screenshots
  }) => {
    // ... implementation ...
  });

  test('CYCLE_START anchor - Reject offspring birth >3 days variance', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testOffspringIds,
    screenshots
  }) => {
    // ... implementation ...
  });

  test('DOG litter - All offspring must have same birth date', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testOffspringIds,
    screenshots
  }) => {
    // Create plan with litter (dog)
    // Attempt to create 2 offspring with different birth dates
    // Expected: ERROR "All DOG offspring in litter must have same birth date"
    // ... implementation ...
  });

  // 5 more offspring validation tests...
});
```

### Phase 6: Waitlist Recalculation (8 Tests)

**File:** `tests/e2e/breeding/specs/phase-6-waitlist-recalculation.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { createWaitlistEntry } from '../helpers/database-helpers';

test.describe('Phase 6: Waitlist Recalculation', () => {
  test('Upgrade anchor - Trigger waitlist recalculation when placement shifts >3 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testWaitlistIds,
    screenshots
  }) => {
    // Create plan with CYCLE_START, expectedPlacementStartDate = 2026-08-15
    // Create waitlist entry matched to this plan
    // Upgrade to ovulation (variance causes placement to shift to 2026-08-20, +5 days)
    // Expected: Waitlist entry recalculated, notification sent
    // Verify waitlist entry matchedPlacementDate updated
    // Verify notification exists in database
    // ... implementation ...
  });

  test('Upgrade anchor - NO waitlist recalc when placement shifts ≤3 days', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testWaitlistIds,
    screenshots
  }) => {
    // Upgrade with variance = +2 days
    // Expected: No waitlist recalculation (within tolerance)
    // ... implementation ...
  });

  test('Waitlist prioritizes ovulation-anchored plans (high confidence)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testWaitlistIds,
    screenshots
  }) => {
    // Create 2 plans: one CYCLE_START (MEDIUM confidence), one OVULATION (HIGH confidence)
    // Both have same expected placement date
    // Create waitlist entry
    // Run matching algorithm
    // Expected: Matched to OVULATION plan (higher confidence)
    // ... implementation ...
  });

  // 5 more waitlist tests...
});
```

### Phase 7: Foaling Milestones (10 Tests)

**File:** `tests/e2e/breeding/specs/phase-7-foaling-milestones.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';

test.describe('Phase 7: Foaling Milestones (Horses)', () => {
  test('Generate milestones from ovulation anchor (priority 1)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testMilestoneIds,
    screenshots
  }) => {
    // Create horse plan with ovulation
    // Generate milestones
    // Verify all 8 milestones calculated from ovulation date
    // Verify milestone offsets: +15, +45, +90, +300, +320, +330, +340, +350 days
    // ... implementation ...
  });

  test('Generate milestones from breeding date (priority 2, no ovulation)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testMilestoneIds,
    screenshots
  }) => {
    // Create horse plan with breeding date but NO ovulation
    // Generate milestones
    // Verify milestones use breeding date as anchor
    // ... implementation ...
  });

  test('Generate milestones from expected breeding (priority 3, fallback)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testMilestoneIds,
    screenshots
  }) => {
    // Create horse plan with only expected dates (no actual breeding/ovulation)
    // Generate milestones
    // Verify milestones use expected breeding date
    // ... implementation ...
  });

  test('Milestones recalculate after anchor upgrade', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    testMilestoneIds,
    screenshots
  }) => {
    // Create horse plan with cycle start
    // Generate milestones (uses expected breeding)
    // Upgrade to ovulation
    // Delete and regenerate milestones
    // Verify new milestones use ovulation as anchor
    // Verify dates shifted by variance amount
    // ... implementation ...
  });

  test('Error: Cannot generate milestones without anchor', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create horse plan in PLANNING status (no locked dates)
    // Attempt to generate milestones
    // Expected: ERROR "Milestones require locked cycle, confirmed ovulation, or breeding date"
    // ... implementation ...
  });

  // 5 more foaling milestone tests...
});
```

### Phase 8: Species-Specific Behaviors (18 Tests)

**File:** `tests/e2e/breeding/specs/phase-8-species-specific.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';

test.describe('Phase 8: Species-Specific Behaviors', () => {
  test('DOG - Show ovulation upgrade option', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create dog plan with cycle start
    // Verify "Upgrade to Ovulation" button visible
    // Verify progesterone test shown as confirmation option
    // ... implementation ...
  });

  test('HORSE - Ovulation anchor recommended', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create horse plan
    // Verify ovulation option shown as recommended (⭐ badge)
    // Verify ultrasound shown as primary confirmation method
    // ... implementation ...
  });

  test('CAT - No cycle start option (induced ovulator)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create cat plan
    // Verify NO cycle start field shown
    // Verify "Breeding Date" field shown instead
    // Verify UI says "Breeding triggers ovulation for cats"
    // ... implementation ...
  });

  test('RABBIT - 0-day ovulation offset (breeding = ovulation)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create rabbit plan with breeding date
    // Verify ovulation shown as same day as breeding
    // Verify 31-day gestation calculated
    // ... implementation ...
  });

  test('GOAT - No ovulation option (no testing infrastructure)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create goat plan
    // Verify NO ovulation option shown
    // Verify only cycle start anchor available
    // Verify UI explains "Hormone testing not commonly available for goats"
    // ... implementation ...
  });

  test('SHEEP - Seasonal breeding note shown', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create sheep plan
    // Verify seasonal breeding guidance shown
    // Verify only cycle start anchor available
    // ... implementation ...
  });

  // 12 more species-specific tests (2-3 per species)...
});
```

### Phase 9: Edge Cases (12 Tests)

**File:** `tests/e2e/breeding/specs/phase-9-edge-cases.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';

test.describe('Phase 9: Edge Cases', () => {
  test('Error: Ovulation before cycle start', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan with cycle start = 2026-03-15
    // Attempt upgrade with ovulation = 2026-03-10 (5 days BEFORE cycle)
    // Expected: ERROR "Ovulation date must be after cycle start date"
    // Screenshot error
    // ... implementation ...
  });

  test('Warning: Ovulation 30 days after cycle (unusual offset)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan with cycle start = 2026-03-01
    // Upgrade with ovulation = 2026-03-31 (30 days after)
    // Expected: WARNING shown but upgrade allowed
    // Log warning in console
    // ... implementation ...
  });

  test('Error: Upgrade when status = BRED (anchor locked)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan with status = BRED
    // Attempt upgrade to ovulation
    // Expected: ERROR "Cannot change anchor mode after breeding occurred"
    // ... implementation ...
  });

  test('Upgrade without cycle start (derive estimate)', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create plan locked with ovulation ONLY (no cycle start observed)
    // Verify cycle start estimated (ovulation - 12 days for dogs)
    // Verify displayed as "estimated" not "observed"
    // ... implementation ...
  });

  test('Calendar update notification after upgrade', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Upgrade plan (causes travel windows to shift)
    // Verify notification shown explaining calendar changes
    // Verify before/after comparison visible
    // ... implementation ...
  });

  // 7 more edge case tests...
});
```

### Phase 10: Data Migration (8 Tests)

**File:** `tests/e2e/breeding/specs/phase-10-migration.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Phase 10: Data Migration', () => {
  test('Backfill existing plan with cycle start', async ({
    authenticatedPage,
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
    screenshots
  }) => {
    // Create "legacy" plan (no reproAnchorMode, only lockedCycleStart)
    const planId = await prisma.breedingPlan.create({
      data: {
        tenantId: hogwartsConfig.tenantId,
        damId: baselineAnimals.animals.dogDam.id,
        sireId: baselineAnimals.animals.dogSire.id,
        species: 'DOG',
        name: 'Legacy Plan',
        lockedCycleStart: new Date('2026-03-15'),
        status: 'COMMITTED',
      }
    });
    testPlanIds.push(planId.id);

    // Run migration script
    // ... execute migration ...

    // Verify plan backfilled
    const migrated = await prisma.breedingPlan.findUnique({ where: { id: planId.id } });
    expect(migrated?.reproAnchorMode).toBe('CYCLE_START');
    expect(migrated?.cycleStartObserved).toBeTruthy();
    expect(migrated?.primaryAnchor).toBe('CYCLE_START');

    // Verify in UI
    await authenticatedPage.goto(`/platform/breeding/planner`);
    // Open plan
    // Verify anchor mode displayed correctly
    // ... implementation ...
  });

  test('Idempotent migration - run twice, no errors', async ({
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
  }) => {
    // Create legacy plan
    // Run migration script #1
    // Run migration script #2 (should skip already-migrated)
    // Verify no errors
    // Verify plan not duplicated or corrupted
    // ... implementation ...
  });

  test('CAT/RABBIT - Backfill with BREEDING_DATE mode', async ({
    hogwartsConfig,
    baselineAnimals,
    testPlanIds,
  }) => {
    // Create legacy cat plan with breedDateActual
    // Run migration
    // Verify reproAnchorMode = BREEDING_DATE
    // ... implementation ...
  });

  // 5 more migration tests...
});
```

---

## Global Setup & Teardown

### Global Setup

**File:** `tests/e2e/breeding/global-setup.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { getHogwartsConfig } from './config/hogwarts-config';
import { createBaselineAnimals } from './fixtures/anchor-test-data';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function globalSetup() {
  console.log('==========================================');
  console.log('Global Setup: Ovulation Anchor Tests');
  console.log('==========================================');

  // 1. Find Hogwarts tenant and Hagrid user
  console.log('[Setup] Finding Hogwarts tenant...');
  const config = await getHogwartsConfig();
  console.log(`[Setup] Hogwarts tenant ID: ${config.tenantId}`);
  console.log(`[Setup] Hagrid user ID: ${config.userId}`);

  // 2. Create baseline test animals for all 6 species
  console.log('[Setup] Creating baseline test animals...');
  const baseline = await createBaselineAnimals(config.tenantId);
  console.log(`[Setup] Created ${Object.keys(baseline.animals).length} test animals`);

  // 3. Save baseline to file for tests to access
  const stateDir = path.join(__dirname, '../../.test-state');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  const stateFile = path.join(stateDir, 'baseline-animals.json');
  fs.writeFileSync(stateFile, JSON.stringify(baseline, null, 2));
  console.log(`[Setup] Saved baseline to ${stateFile}`);

  console.log('[Setup] Global setup complete ✅');
  console.log('==========================================\n');
}

export default globalSetup;
```

### Global Teardown

**File:** `tests/e2e/breeding/global-teardown.ts`

```typescript
import { deleteBaselineAnimals } from './fixtures/anchor-test-data';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown() {
  console.log('\n==========================================');
  console.log('Global Teardown: Ovulation Anchor Tests');
  console.log('==========================================');

  // 1. Load baseline from file
  const stateFile = path.join(__dirname, '../../.test-state/baseline-animals.json');
  if (!fs.existsSync(stateFile)) {
    console.log('[Teardown] No baseline file found, skipping cleanup');
    return;
  }

  const baseline = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));

  // 2. Delete baseline test animals
  console.log('[Teardown] Deleting baseline test animals...');
  await deleteBaselineAnimals(baseline);

  // 3. Delete state file
  fs.unlinkSync(stateFile);
  console.log('[Teardown] Deleted state file');

  console.log('[Teardown] Global teardown complete ✅');
  console.log('==========================================\n');
}

export default globalTeardown;
```

---

## Test Execution

### Run All Tests

```bash
# Full test suite
npm run test:e2e:breeding

# Specific phase
npm run test:e2e:breeding -- phase-1-lock-cycle-start

# Specific species
npm run test:e2e:breeding -- --grep "DOG"

# Debug mode (headed, slow motion)
HEADLESS=false SLOW_MO=500 npm run test:e2e:breeding

# With screenshots saved
npm run test:e2e:breeding -- --debug
```

### package.json Scripts

```json
{
  "scripts": {
    "test:e2e:breeding": "playwright test tests/e2e/breeding/specs",
    "test:e2e:breeding:ui": "playwright test tests/e2e/breeding/specs --ui",
    "test:e2e:breeding:debug": "HEADLESS=false SLOW_MO=500 playwright test tests/e2e/breeding/specs"
  }
}
```

---

## Test Coverage Summary

### Total Test Count: 123 Tests

| Phase | Tests | Description |
|-------|-------|-------------|
| Phase 1: Lock Cycle Start | 18 | All species, cycle start anchor |
| Phase 2: Lock Ovulation | 12 | Direct ovulation lock, foaling milestones |
| Phase 3: Upgrade Anchor | 15 | Cycle → Ovulation upgrade, variance |
| Phase 4: Immutability | 12 | Field immutability by breeding phase |
| Phase 5: Offspring | 10 | Anchor-aware offspring validation |
| Phase 6: Waitlist | 8 | Recalculation, notifications, prioritization |
| Phase 7: Foaling Milestones | 10 | Priority logic, recalculation |
| Phase 8: Species-Specific | 18 | UI/UX per species (3 per species) |
| Phase 9: Edge Cases | 12 | Error handling, warnings, unusual scenarios |
| Phase 10: Migration | 8 | Backfill, idempotency, rollback |

### Coverage Matrix

| Feature | Positive Tests | Negative Tests | Edge Cases |
|---------|---------------|----------------|------------|
| Lock Cycle Start | 6 species × 1 = 6 | 3 | 9 |
| Lock Ovulation | 2 species × 3 = 6 | 2 | 4 |
| Upgrade Anchor | 6 species × 1 = 6 | 4 | 5 |
| Immutability | 6 rules × 1 = 6 | 6 rules × 1 = 6 | 0 |
| Offspring | 2 anchors × 2 = 4 | 2 anchors × 2 = 4 | 2 |
| Waitlist | 3 | 2 | 3 |
| Milestones | 4 | 3 | 3 |
| Species UI | 6 species × 3 = 18 | 0 | 0 |
| Edge Cases | 0 | 0 | 12 |
| Migration | 5 | 1 | 2 |
| **TOTAL** | **58** | **31** | **34** |

---

## Success Criteria

### Test Must Pass Criteria

1. **All 123 tests pass** without failures
2. **Zero data leaks** - all test data cleaned up after each test
3. **Zero screenshot leaks** - screenshots deleted except on failure
4. **Performance** - full suite completes in <30 minutes
5. **Idempotency** - tests can run multiple times without interfering
6. **Independence** - tests can run in any order (no dependencies)

### Quality Gates

- [ ] All critical gaps validated (5 tests each)
- [ ] All species covered (18 tests)
- [ ] All immutability rules enforced (12 tests)
- [ ] All error messages user-friendly (visible in screenshots)
- [ ] All API endpoints tested (via UI actions)
- [ ] All database changes verified (direct DB queries)
- [ ] All cleanup verified (0 orphaned records)

---

## Maintenance

### Adding New Tests

1. Create test in appropriate phase file
2. Use fixtures for automatic cleanup
3. Add test data IDs to tracking arrays
4. Screenshot at key steps
5. Assert both UI and database states
6. Verify cleanup in teardown

### Debugging Failed Tests

1. Check `test-results/` for screenshots/videos
2. Review database state (Prisma Studio)
3. Check audit trail for events
4. Re-run with `HEADLESS=false SLOW_MO=1000`
5. Use `page.pause()` for interactive debugging

---

**Document Version:** 1.0
**Date:** 2026-01-17
**Status:** READY FOR IMPLEMENTATION
**Total Test Count:** 123 tests
**Estimated Execution Time:** 20-30 minutes (full suite)
