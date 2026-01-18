# Engineer Prompt: Complete Ovulation Anchor System Implementation

## Situation

You've successfully implemented the **backend infrastructure** for the Ovulation Anchor Breeding System (Phases 0-5). Great work! However, the feature **cannot be deployed to production** yet because:

1. ❌ **Zero automated test coverage** - No validation that it works
2. ❌ **UI components missing** - Users can't access the new features
3. ❌ **Foaling milestone priority logic not integrated** - Will break for horses

**Current Status:** Backend ready, frontend incomplete, tests missing
**Your Mission:** Complete the implementation so it's production-ready

---

## What You Already Built (Phases 0-5) ✅

### Phase 0: Species Terminology ✅
- **File:** `packages/ui/src/utils/speciesTerminology.ts`
- Extended with cycle, ovulation, anchorMode, weaning properties
- 18 helper functions for species-aware UI text

### Phase 1: Database Schema ✅
- **Files:** `breederhq-api/prisma/schema.prisma` + migration
- 5 new enums, 14 new fields on BreedingPlan
- Migration backfilled all existing plans

### Phase 2: Calculation Engine ✅
- **Files:** `packages/ui/src/utils/reproEngine/`
- `buildTimelineFromOvulation()` function
- `buildTimelineFromAnchor()` universal entry point
- `detectAnchorFromPlan()` auto-detection

### Phase 3: API Endpoints ✅
- **File:** `breederhq-api/src/routes/breeding.ts`
- `POST /breeding/plans/:id/lock` - unified lock endpoint
- `POST /breeding/plans/:id/upgrade-to-ovulation` - progressive enhancement
- `validateImmutability()` middleware

### Phase 4: UI Adapters ✅ (Partial)
- **Files:** `apps/breeding/src/adapters/planWindows.ts`, `deriveBreedingStatus.ts`
- Backend adapters ready
- **UI components NOT built** ❌

### Phase 5: Data Migration ✅
- All existing plans backfilled

**See full details:** [15-implementation-summary.md](./15-implementation-summary.md)

---

## What You Need to Build Now

### Priority 1: Automated Testing (CRITICAL) 🔴

**Why:** Without tests, you have no proof the implementation works. This is your safety net.

**Time Estimate:** 12-18 hours total

#### Task 1.1: Set Up Test Infrastructure (2-3 hours)

**Create directory structure:**
```
tests/e2e/breeding/
├── config/
│   └── hogwarts-config.ts
├── fixtures/
│   ├── breeding-fixtures.ts
│   ├── anchor-test-data.ts
│   └── database-helpers.ts
├── helpers/
│   ├── breeding-helpers.ts
│   ├── anchor-helpers.ts
│   └── validation-helpers.ts
└── specs/
    ├── phase-1-lock-cycle-start.spec.ts
    ├── phase-2-lock-ovulation.spec.ts
    ├── phase-3-upgrade-anchor.spec.ts
    ├── phase-4-immutability.spec.ts
    └── phase-5-migration.spec.ts
```

**1. Create Hogwarts config:**

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

export async function getHogwartsConfig(): Promise<HogwartsConfig> {
  const user = await prisma.user.findUnique({
    where: { email: 'hagrid.dev@hogwarts.local' },
    include: { tenant: true }
  });

  if (!user || !user.tenant) {
    throw new Error('Hogwarts tenant not found. Ensure hagrid.dev@hogwarts.local exists in database.');
  }

  return {
    tenantId: user.tenant.id,
    userId: user.id,
    email: 'hagrid.dev@hogwarts.local',
    password: 'Hogwarts123!',
  };
}

let cachedConfig: HogwartsConfig | null = null;

export async function getConfig(): Promise<HogwartsConfig> {
  if (cachedConfig) return cachedConfig;
  cachedConfig = await getHogwartsConfig();
  return cachedConfig;
}
```

**2. Create breeding fixtures:**

**File:** `tests/e2e/breeding/fixtures/breeding-fixtures.ts`

```typescript
import { test as base, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { getConfig } from '../config/hogwarts-config';

const prisma = new PrismaClient();

interface BreedingTestFixtures {
  authenticatedPage: Page;
  hogwartsConfig: Awaited<ReturnType<typeof getConfig>>;
  testPlanIds: number[];
}

export const test = base.extend<BreedingTestFixtures>({
  hogwartsConfig: async ({}, use) => {
    const config = await getConfig();
    await use(config);
  },

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

    console.log(`[Auth] Logged in as ${hogwartsConfig.email}`);

    await use(page);

    await page.close();
  },
});

export { expect } from '@playwright/test';
```

**3. Create database helpers:**

**File:** `tests/e2e/breeding/fixtures/database-helpers.ts`

```typescript
import { PrismaClient, Species, ReproAnchorMode } from '@prisma/client';

const prisma = new PrismaClient();

export async function createBreedingPlan(params: {
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
}): Promise<number> {
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

export async function getBreedingPlan(planId: number) {
  return await prisma.breedingPlan.findUnique({
    where: { id: planId },
    include: { dam: true, sire: true }
  });
}

export async function createTestAnimal(params: {
  tenantId: number;
  name: string;
  species: Species;
  sex: 'MALE' | 'FEMALE';
}): Promise<number> {
  const animal = await prisma.animal.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      species: params.species,
      sex: params.sex,
      microchipId: `TEST-${params.species}-${params.sex}-${Date.now()}`,
      dateOfBirth: new Date('2020-01-01'),
      isActive: true,
    }
  });

  console.log(`[DB] Created test animal ${animal.id}: ${animal.name}`);
  return animal.id;
}
```

#### Task 1.2: Implement Core Tests (10-15 hours)

**Reference document:** [13-comprehensive-playwright-test-plan.md](./13-comprehensive-playwright-test-plan.md)

**Start with Phase 1: Lock Cycle Start (18 tests)**

**File:** `tests/e2e/breeding/specs/phase-1-lock-cycle-start.spec.ts`

```typescript
import { test, expect } from '../fixtures/breeding-fixtures';
import { createBreedingPlan, createTestAnimal, getBreedingPlan } from '../fixtures/database-helpers';

test.describe('Phase 1: Lock Cycle Start', () => {
  let damId: number;
  let sireId: number;

  test.beforeAll(async ({ hogwartsConfig }) => {
    // Create test animals once for all tests
    damId = await createTestAnimal({
      tenantId: hogwartsConfig.tenantId,
      name: 'Fang Test Dam',
      species: 'DOG',
      sex: 'FEMALE'
    });

    sireId = await createTestAnimal({
      tenantId: hogwartsConfig.tenantId,
      name: 'Fang Test Sire',
      species: 'DOG',
      sex: 'MALE'
    });
  });

  test('DOG - Lock plan with cycle start anchor', async ({
    authenticatedPage,
    hogwartsConfig,
    testPlanIds
  }) => {
    const page = authenticatedPage;

    // Create test plan via DB
    const planId = await createBreedingPlan({
      tenantId: hogwartsConfig.tenantId,
      userId: hogwartsConfig.userId,
      damId,
      sireId,
      species: 'DOG',
      name: 'Test Plan - Cycle Start Lock'
    });
    testPlanIds.push(planId);

    // Call API endpoint to lock plan
    const response = await page.request.post(
      `/api/v1/breeding/plans/${planId}/lock`,
      {
        data: {
          anchorMode: 'CYCLE_START',
          anchorDate: '2026-03-15',
        }
      }
    );

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Assertions
    expect(result.success).toBe(true);
    expect(result.anchorMode).toBe('CYCLE_START');
    expect(result.confidence).toBe('MEDIUM');
    expect(result.calculatedDates.dueDate).toBeTruthy();

    // Verify in database
    const plan = await getBreedingPlan(planId);
    expect(plan?.reproAnchorMode).toBe('CYCLE_START');
    expect(plan?.cycleStartObserved).toBeTruthy();
    expect(plan?.status).toBe('COMMITTED');
  });

  test('DOG - Verify expected birth date ~75 days from cycle start', async ({
    authenticatedPage,
    hogwartsConfig,
    testPlanIds
  }) => {
    const page = authenticatedPage;

    const planId = await createBreedingPlan({
      tenantId: hogwartsConfig.tenantId,
      userId: hogwartsConfig.userId,
      damId,
      sireId,
      species: 'DOG',
      name: 'Test Plan - Birth Date Calculation'
    });
    testPlanIds.push(planId);

    // Lock with cycle start
    const response = await page.request.post(
      `/api/v1/breeding/plans/${planId}/lock`,
      {
        data: {
          anchorMode: 'CYCLE_START',
          anchorDate: '2026-03-15', // Cycle start
        }
      }
    );

    const result = await response.json();

    // Expected: 2026-03-15 + 12 days (ovulation) + 63 days (gestation) = 2026-05-29
    expect(result.calculatedDates.dueDate).toBe('2026-05-29');
  });

  // Add 16 more tests following the test plan...
});
```

**Implement remaining test phases:**
- `phase-2-lock-ovulation.spec.ts` (12 tests)
- `phase-3-upgrade-anchor.spec.ts` (15 tests)
- `phase-4-immutability.spec.ts` (12 tests)
- `phase-5-migration.spec.ts` (8 tests)

**Success Criteria:**
- ✅ All 65 core tests passing
- ✅ Zero test data leaks (cleanup verified)
- ✅ Can run multiple times without errors

---

### Priority 2: UI Components (HIGH) 🟡

**Why:** Users can't access the new features without UI components.

**Time Estimate:** 11-16 hours total

#### Task 2.1: Add Ovulation Fields to Breeding Drawer (4-6 hours)

**File:** `apps/breeding/src/App-Breeding.tsx`

**Location:** Dates tab section (search for "cycleStartDateActual" to find it)

**Add after cycle start field:**

```typescript
{/* Ovulation Confirmation (show if species supports it) */}
{getSpeciesTerminology(row.species).anchorMode.testingAvailable && (
  <>
    <div className="form-group">
      <label htmlFor="ovulation-date">
        {getSpeciesTerminology(row.species).ovulation.dateLabel}
        <Tooltip content={getSpeciesTerminology(row.species).ovulation.guidanceText}>
          <InfoIcon className="ml-1 h-4 w-4 text-gray-400" />
        </Tooltip>
      </label>
      <input
        id="ovulation-date"
        type="date"
        value={row.ovulationConfirmed ? formatDate(row.ovulationConfirmed) : ''}
        onChange={(e) => handleFieldChange('ovulationConfirmed', e.target.value)}
        disabled={row.status !== 'PLANNING' && row.status !== 'COMMITTED'}
        className="form-input"
      />
    </div>

    {/* Confirmation Method */}
    {row.ovulationConfirmed && (
      <div className="form-group">
        <label htmlFor="ovulation-method">Confirmation Method</label>
        <select
          id="ovulation-method"
          value={row.ovulationConfirmedMethod || ''}
          onChange={(e) => handleFieldChange('ovulationConfirmedMethod', e.target.value)}
          disabled={row.status !== 'PLANNING' && row.status !== 'COMMITTED'}
          className="form-select"
        >
          <option value="">Select method...</option>
          {getSpeciesTerminology(row.species).ovulation.confirmationMethods.map(method => (
            <option key={method} value={method.toUpperCase().replace(/\s+/g, '_')}>
              {method}
            </option>
          ))}
        </select>
      </div>
    )}

    {/* Anchor Mode Display */}
    <div className="mt-4 p-3 bg-gray-50 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">Anchor Mode:</span>
          <span className="ml-2 text-sm text-gray-900">
            {row.reproAnchorMode === 'OVULATION' ? 'Ovulation' :
             row.reproAnchorMode === 'CYCLE_START' ? 'Cycle Start' :
             'Breeding Date'}
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Confidence:</span>
          <Badge variant={
            row.ovulationConfidence === 'HIGH' ? 'success' :
            row.ovulationConfidence === 'MEDIUM' ? 'warning' : 'default'
          }>
            {row.ovulationConfidence || row.cycleStartConfidence || 'MEDIUM'}
          </Badge>
        </div>
      </div>
    </div>
  </>
)}
```

#### Task 2.2: Add "Upgrade to Ovulation" Button (2-3 hours)

**File:** `apps/breeding/src/App-Breeding.tsx`

**Location:** After the lock/unlock buttons section

```typescript
{/* Upgrade to Ovulation Button */}
{row.status === 'COMMITTED' &&
 row.reproAnchorMode === 'CYCLE_START' &&
 getSpeciesTerminology(row.species).anchorMode.supportsUpgrade && (
  <button
    onClick={handleUpgradeToOvulation}
    disabled={!row.ovulationConfirmed || upgrading}
    className="btn btn-primary mt-4"
  >
    {upgrading ? 'Upgrading...' : 'Upgrade to Ovulation Anchor'}
  </button>
)}

{/* Variance Analysis Display */}
{row.reproAnchorMode === 'OVULATION' &&
 row.actualOvulationOffset !== null &&
 row.expectedOvulationOffset !== null && (
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
    <h4 className="text-sm font-medium text-blue-900">Variance Analysis</h4>
    <p className="text-sm text-blue-700 mt-1">
      Ovulation occurred {Math.abs(row.varianceFromExpected || 0)} days{' '}
      {(row.varianceFromExpected || 0) > 0 ? 'later' :
       (row.varianceFromExpected || 0) < 0 ? 'earlier' : 'on-time'}{' '}
      than expected (Day {row.actualOvulationOffset} vs expected Day {row.expectedOvulationOffset})
    </p>
  </div>
)}
```

**Add handler function:**

```typescript
const [upgrading, setUpgrading] = React.useState(false);

const handleUpgradeToOvulation = React.useCallback(async () => {
  if (!api || !row.id || !row.ovulationConfirmed) return;

  setUpgrading(true);

  try {
    const response = await api.post(`/breeding/plans/${row.id}/upgrade-to-ovulation`, {
      ovulationDate: formatDateISO(row.ovulationConfirmed),
      confirmationMethod: row.ovulationConfirmedMethod || 'PROGESTERONE_TEST',
    });

    if (response.success) {
      // Update local state
      setRow({ ...row, ...response.plan });

      // Show success message
      toast.success(`Plan upgraded to ovulation anchor. ${
        response.placementShift > 3 ? 'Waitlist entries were recalculated.' : ''
      }`);

      // Refresh plan list
      await refreshPlans();
    }
  } catch (err: any) {
    console.error('[Breeding] Failed to upgrade anchor:', err);
    toast.error(err?.message || 'Failed to upgrade to ovulation anchor');
  } finally {
    setUpgrading(false);
  }
}, [api, row, refreshPlans]);
```

#### Task 2.3: Implement Foaling Milestone Priority Logic (2-3 hours)

**File:** `apps/breeding/src/App-Breeding.tsx`

**Location:** Add helper function around line 6980 (before foaling milestone handlers)

```typescript
/**
 * Get the best available anchor date for milestone generation.
 * Priority: ovulation > breeding > expected breeding > locked ovulation
 *
 * ✅ RESOLVES CRITICAL GAP #2: Foaling milestones now work with ovulation-anchored plans
 */
function getMilestoneAnchorDate(plan: PlanRow): Date | null {
  // Priority 1: Confirmed ovulation (highest accuracy)
  if (plan.ovulationConfirmed && String(plan.ovulationConfirmed).trim()) {
    return new Date(plan.ovulationConfirmed);
  }

  // Priority 2: Actual breeding date
  if (plan.breedDateActual && String(plan.breedDateActual).trim()) {
    return new Date(plan.breedDateActual);
  }

  // Priority 3: Expected breeding (from locked cycle/ovulation)
  if (plan.expectedBreedDate && String(plan.expectedBreedDate).trim()) {
    return new Date(plan.expectedBreedDate);
  }

  // Priority 4: Locked ovulation date (legacy support)
  if (plan.lockedOvulationDate && String(plan.lockedOvulationDate).trim()) {
    return new Date(plan.lockedOvulationDate);
  }

  return null;
}
```

**Update milestone creation handler** (line ~6990):

```typescript
const handleCreateMilestones = React.useCallback(async () => {
  if (!api || !row.id) return;

  // Validate: need an anchor date
  const anchorDate = getMilestoneAnchorDate(row);
  if (!anchorDate) {
    void confirmModal({
      title: "Cannot Create Milestones",
      message: "Milestones require a locked cycle, confirmed ovulation, or breeding date. Please lock your plan first.",
      confirmText: "OK"
    });
    return;
  }

  setFoalingLoading(true);
  try {
    await api.foaling.createMilestones(Number(row.id));
    const data = await api.foaling.getTimeline(Number(row.id));
    setFoalingTimeline(data);
  } catch (err: any) {
    console.error("[Breeding] Failed to create milestones:", err);
    setFoalingError(err?.message || "Failed to create milestones");
  } finally {
    setFoalingLoading(false);
  }
}, [api, row.id, row]);
```

#### Task 2.4: Species-Specific Field Visibility (3-4 hours)

**File:** `apps/breeding/src/App-Breeding.tsx`

**Add conditional rendering logic:**

```typescript
// Get species configuration
const speciesConfig = getSpeciesTerminology(row.species);
const isInducedOvulator = speciesConfig.anchorMode.isInducedOvulator;
const supportsOvulation = speciesConfig.anchorMode.testingAvailable;

// In the Dates tab render:

{/* Cycle Start - HIDE for induced ovulators (cats, rabbits, alpacas, llamas) */}
{!isInducedOvulator && (
  <div className="form-group">
    <label htmlFor="cycle-start">
      {speciesConfig.cycle.startLabelCap}
      <Tooltip content={speciesConfig.cycle.cycleStartHelp}>
        <InfoIcon className="ml-1 h-4 w-4 text-gray-400" />
      </Tooltip>
    </label>
    <input
      id="cycle-start"
      type="date"
      value={row.cycleStartObserved ? formatDate(row.cycleStartObserved) : ''}
      onChange={(e) => handleFieldChange('cycleStartObserved', e.target.value)}
      className="form-input"
    />
    {speciesConfig.cycle.cycleExplanation && (
      <p className="text-sm text-gray-500 mt-1">{speciesConfig.cycle.cycleExplanation}</p>
    )}
  </div>
)}

{/* Breeding Date - SHOW for induced ovulators instead of cycle start */}
{isInducedOvulator && (
  <div className="form-group">
    <label htmlFor="breeding-date">
      {speciesConfig.cycle.breedingDateLabel}
      <Tooltip content="Breeding triggers ovulation for this species">
        <InfoIcon className="ml-1 h-4 w-4 text-gray-400" />
      </Tooltip>
    </label>
    <input
      id="breeding-date"
      type="date"
      value={row.breedDateActual ? formatDate(row.breedDateActual) : ''}
      onChange={(e) => handleFieldChange('breedDateActual', e.target.value)}
      className="form-input"
    />
    <p className="text-sm text-gray-500 mt-1">
      {speciesConfig.species === 'CAT' && 'Cats ovulate 24-36 hours after breeding'}
      {speciesConfig.species === 'RABBIT' && 'Rabbits ovulate immediately when bred'}
      {(speciesConfig.species === 'ALPACA' || speciesConfig.species === 'LLAMA') &&
       'Camelids are induced ovulators - breeding triggers ovulation'}
    </p>
  </div>
)}

{/* Ovulation Fields - HIDE for species without testing (goats, sheep, pigs, cattle, chickens) */}
{supportsOvulation && (
  // ... ovulation fields from Task 2.1 ...
)}

{/* Educational note for species without ovulation testing */}
{!supportsOvulation && !isInducedOvulator && (
  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
    <p className="text-sm text-yellow-800">
      ℹ️ Ovulation testing is not commonly available for {row.species.toLowerCase()}s.
      Cycle start dates will be used for breeding timeline calculations.
    </p>
  </div>
)}
```

---

### Priority 3: Backend Foaling Milestone Update (MEDIUM) 🟡

**Why:** Backend API needs to use priority logic too.

**Time Estimate:** 2-3 hours

#### Task 3.1: Update Foaling Milestone Generation API

**File:** `breederhq-api/src/routes/foaling.ts`

**Find the milestone generation endpoint and update:**

```typescript
router.post("/breeding-plans/:id/foaling/milestones", async (req, res) => {
  const { id } = req.params;
  const plan = await getPlan(id);

  if (!plan) {
    return res.status(404).json({ error: "Plan not found" });
  }

  if (plan.species !== "HORSE") {
    return res.status(400).json({
      error: "Invalid species",
      detail: "Foaling milestones are only available for horses"
    });
  }

  // Get anchor date using priority logic
  let anchorDate: Date | null = null;
  let anchorType: string;

  // Priority 1: Confirmed ovulation (highest accuracy)
  if (plan.ovulationConfirmed) {
    anchorDate = new Date(plan.ovulationConfirmed);
    anchorType = "ovulation";
  }
  // Priority 2: Actual breeding date
  else if (plan.breedDateActual) {
    anchorDate = new Date(plan.breedDateActual);
    anchorType = "breeding";
  }
  // Priority 3: Expected breeding
  else if (plan.expectedBreedDate) {
    anchorDate = new Date(plan.expectedBreedDate);
    anchorType = "expected_breeding";
  }
  // Priority 4: Locked ovulation (legacy)
  else if (plan.lockedOvulationDate) {
    anchorDate = new Date(plan.lockedOvulationDate);
    anchorType = "locked_ovulation";
  }

  if (!anchorDate) {
    return res.status(400).json({
      error: "No anchor date available",
      detail: "Cannot create milestones without a locked cycle, confirmed ovulation, or breeding date."
    });
  }

  // Generate milestones from anchor
  const milestoneOffsets = [15, 45, 90, 300, 320, 330, 340, 350]; // Days from anchor
  const milestones: any[] = [];

  for (const offset of milestoneOffsets) {
    const milestoneDate = new Date(anchorDate);
    milestoneDate.setDate(milestoneDate.getDate() + offset);

    milestones.push({
      breedingPlanId: plan.id,
      offsetDays: offset,
      expectedDate: milestoneDate.toISOString().slice(0, 10),
      label: getMilestoneLabel(offset),
      description: getMilestoneDescription(offset),
      completed: false,
      anchorType, // Track which anchor was used
      anchorDate: anchorDate.toISOString().slice(0, 10)
    });
  }

  // Delete existing milestones first
  await prisma.foalingMilestone.deleteMany({
    where: { breedingPlanId: plan.id }
  });

  // Save new milestones
  await prisma.foalingMilestone.createMany({ data: milestones });

  // Audit event
  await createEvent(plan.id, {
    type: "FOALING_MILESTONES_CREATED",
    occurredAt: new Date().toISOString(),
    label: "Foaling milestones generated",
    data: {
      anchorType,
      anchorDate: anchorDate.toISOString().slice(0, 10),
      milestoneCount: milestones.length
    }
  });

  return res.json({ success: true, milestones });
});
```

---

### Priority 4: Remaining Tests (OPTIONAL) 🟢

**Time Estimate:** 8-11 hours

Only implement these if you want 100% test coverage:

- Phase 6: Offspring validation (10 tests)
- Phase 7: Waitlist recalculation (8 tests)
- Phase 8: Foaling milestones (10 tests)
- Phase 9: Species-specific UI (18 tests)
- Phase 10: Edge cases (12 tests)

**Reference:** [13-comprehensive-playwright-test-plan.md](./13-comprehensive-playwright-test-plan.md) sections for each phase

---

## Testing Your Work

### Run Automated Tests

```bash
# Run all breeding tests
npm run test:e2e:breeding

# Run specific phase
npm run test:e2e:breeding -- phase-1-lock-cycle-start

# Debug mode (see browser)
HEADLESS=false SLOW_MO=500 npm run test:e2e:breeding
```

### Manual Testing Checklist

**Test 1: Dog - Lock with Cycle Start**
1. Log in as `hagrid.dev@hogwarts.local` / `Hogwarts123!`
2. Go to Breeding Planner
3. Create new plan for a dog
4. Enter cycle start date: 2026-03-15
5. Click "Lock Plan"
6. ✅ Verify status = COMMITTED
7. ✅ Verify expected birth date = 2026-05-29 (75 days from cycle start)
8. ✅ Verify anchor mode badge shows "Cycle Start"
9. ✅ Verify confidence shows "MEDIUM"

**Test 2: Dog - Upgrade to Ovulation**
1. With plan from Test 1 (locked with cycle start)
2. Enter ovulation date: 2026-03-27 (12 days after cycle start)
3. Select confirmation method: "Progesterone Test"
4. Click "Upgrade to Ovulation Anchor"
5. ✅ Verify anchor mode changes to "Ovulation"
6. ✅ Verify confidence changes to "HIGH"
7. ✅ Verify variance analysis shows "on-time" (0 days variance)
8. ✅ Verify expected dates recalculated

**Test 3: Cat - Breeding Date Only**
1. Create new plan for a cat
2. ✅ Verify NO "Cycle Start" field shown
3. ✅ Verify "Breeding Date" field shown instead
4. ✅ Verify educational note: "Cats ovulate 24-36 hours after breeding"
5. Enter breeding date
6. Lock plan
7. ✅ Verify anchor mode = "BREEDING_DATE"

**Test 4: Goat - No Ovulation Option**
1. Create new plan for a goat
2. ✅ Verify "Cycle Start" field shown
3. ✅ Verify NO ovulation fields shown
4. ✅ Verify educational note: "Ovulation testing not commonly available for goats"
5. Lock with cycle start
6. ✅ Verify no "Upgrade to Ovulation" button

**Test 5: Horse - Foaling Milestones from Ovulation**
1. Create new plan for a horse
2. Lock with ovulation date: 2026-03-27
3. Confirmation method: "Ultrasound"
4. Navigate to Foaling Milestones tab
5. Click "Generate Milestones"
6. ✅ Verify 8 milestones created
7. ✅ Verify milestone dates calculated from ovulation (not breeding)
8. ✅ Verify first milestone at ovulation + 15 days = 2026-04-11

**Test 6: Immutability - Birth Date Locked**
1. Create dog plan, lock, breed, record birth
2. Try to change birth date
3. ✅ Verify error: "Birth date is strictly immutable once set"

---

## Definition of Done

### Phase Complete When:

**Priority 1 (Testing):**
- ✅ All 65 core tests passing (Phases 1-5)
- ✅ Tests can run multiple times without errors
- ✅ Zero test data leaks (cleanup verified)
- ✅ Test output saved to `test-results/`

**Priority 2 (UI):**
- ✅ Ovulation fields visible in breeding drawer (species-aware)
- ✅ "Upgrade to Ovulation" button works
- ✅ Foaling milestones use priority logic
- ✅ Species-specific field visibility correct
- ✅ Manual testing checklist verified

**Priority 3 (Backend):**
- ✅ Foaling milestone API uses priority logic
- ✅ API tests passing

---

## Common Pitfalls

### ❌ DON'T:
1. Skip test cleanup - causes data leaks
2. Hardcode species behavior - use `speciesTerminology` functions
3. Show ovulation fields for all species - check `testingAvailable`
4. Show cycle start for cats/rabbits - check `isInducedOvulator`
5. Forget error handling in upgrade handler
6. Skip variance display after upgrade
7. Use old milestone logic (breed date only)

### ✅ DO:
1. Use fixtures for automatic cleanup
2. Call `getSpeciesTerminology(species)` for all UI text
3. Conditional rendering based on species config
4. Test on all species (DOG, CAT, HORSE, GOAT at minimum)
5. Show user-friendly error messages
6. Display variance analysis prominently
7. Use `getMilestoneAnchorDate()` priority logic

---

## Getting Help

**If stuck:**

1. **Check implementation plan:** [00-implementation-plan.md](./00-implementation-plan.md)
2. **Review backend code:** Check what was already built in Phase 3
3. **Check test plan:** [13-comprehensive-playwright-test-plan.md](./13-comprehensive-playwright-test-plan.md)
4. **Review status doc:** [16-current-status-and-next-steps.md](./16-current-status-and-next-steps.md)

**Good questions to ask:**
- "Phase 1 test failing on line 87 - immutability error doesn't match. Update test or code?"
- "Should ovulation fields show for pigs? Implementation plan § 0.1 says no testing available."
- "Upgrade button not visible - where should conditional check go?"

**Bad questions:**
- "How do I implement the whole thing?" (Too broad - follow the task breakdown)
- "What's an anchor mode?" (Read the implementation plan first)

---

## Time Estimates

| Priority | Tasks | Hours |
|----------|-------|-------|
| **Priority 1: Testing** | Set up infrastructure + 65 tests | 12-18h |
| **Priority 2: UI** | Drawer fields + upgrade button + milestones + species visibility | 11-16h |
| **Priority 3: Backend** | Foaling milestone API update | 2-3h |
| **TOTAL (MVP)** | Production-ready minimum | **25-37 hours** |
| **Priority 4: Remaining Tests** | 58 more tests | 8-11h |
| **TOTAL (Complete)** | 100% test coverage | **33-48 hours** |

**Recommendation:** Complete Priorities 1-3 (MVP) first, deploy to staging, then add Priority 4.

---

## Success Metrics

**You'll know it's working when:**

1. ✅ All 65 core tests passing
2. ✅ Rene (breeder) can:
   - Lock dog plan with cycle start
   - Enter progesterone test results
   - Upgrade to ovulation with one click
   - See variance analysis ("on-time" / "early" / "late")
3. ✅ Horse breeders can:
   - Lock with ultrasound-confirmed ovulation
   - Generate foaling milestones from ovulation
   - See HIGH confidence badge
4. ✅ Cat breeders never see confusing "cycle start" field
5. ✅ Goat breeders never see unavailable "ovulation" option
6. ✅ All species show appropriate fields and labels

---

## Final Checklist Before Starting

- [ ] I've read [15-implementation-summary.md](./15-implementation-summary.md) to understand what's done
- [ ] I've read [16-current-status-and-next-steps.md](./16-current-status-and-next-steps.md) to understand priorities
- [ ] I have access to Hogwarts test account (`hagrid.dev@hogwarts.local`)
- [ ] I can create test animals in database
- [ ] I understand the 3 priority levels
- [ ] I know where to find help (implementation plan references)
- [ ] I'm ready to complete this! 🚀

---

**Go complete the implementation and get this production-ready!**

**Estimated time to production:** 25-37 hours (1-2 weeks at comfortable pace)

Good luck! 🎉
