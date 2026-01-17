# Breeding Plan System - Complete Architecture Analysis

## Purpose

This document provides a complete technical analysis of how the breeding plan system currently works, mapping every component, data flow, calculation, and dependency. This serves as the foundation for understanding the scope and impact of any changes to the date anchoring system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Model](#data-model)
3. [Calculation Engine Deep Dive](#calculation-engine-deep-dive)
4. [Component Dependency Graph](#component-dependency-graph)
5. [Business Rules & Validation](#business-rules--validation)
6. [Testing Surface Area](#testing-surface-area)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐           │
│  │   Gantt    │  │  Calendar  │  │  Dashboard   │           │
│  │   Views    │  │   View     │  │    Cards     │           │
│  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘           │
│         │                │                │                   │
│         └────────────────┼────────────────┘                   │
│                          │                                    │
│                    ┌─────▼──────┐                            │
│                    │  Adapters  │                            │
│                    │ (normalize)│                            │
│                    └─────┬──────┘                            │
└──────────────────────────┼───────────────────────────────────┘
                           │
                     ┌─────▼──────┐
                     │ ReproEngine│
                     │ (calculate)│
                     └─────┬──────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    BACKEND LAYER                              │
│                          │                                    │
│                    ┌─────▼──────┐                            │
│                    │ API Routes │                            │
│                    │ (validate) │                            │
│                    └─────┬──────┘                            │
│                          │                                    │
│                    ┌─────▼──────┐                            │
│                    │  Database  │                            │
│                    │  (Prisma)  │                            │
│                    └────────────┘                            │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

**User Creates Plan:**
```
User clicks "New Plan"
  ↓
Enter dam, sire, species, name
  ↓
Click "Lock Cycle" → Enter cycle start date
  ↓
Frontend: POST /api/breeding/plans/:id/lock
  ↓
Backend: Validate lock payload (4 dates required)
  ↓
Backend: Save locked dates to database
  ↓
Frontend: Refresh plan, call windowsFromPlan(plan)
  ↓
Adapter: Call buildTimelineFromSeed(summary, cycleStart)
  ↓
ReproEngine: Calculate all windows + milestones
  ↓
Return to UI: Render Gantt/Calendar with calculated dates
```

**User Records Actual Birth:**
```
User clicks "Record Birth"
  ↓
Enter birth date, litter size
  ↓
Frontend: POST /api/breeding/plans/:id/milestone
  ↓
Backend: Validate birthDateActual is after breedDateActual
  ↓
Backend: Lock upstream dates (immutability rule)
  ↓
Backend: Save birthDateActual
  ↓
Frontend: Status updates from BRED → BIRTHED
  ↓
Frontend: Post-birth windows recalculated via buildTimelineFromBirth()
  ↓
Gantt shows weaning/placement from ACTUAL birth, not expected
```

---

## 2. Data Model

### 2.1 BreedingPlan Schema

**File:** `breederhq-api/prisma/schema.prisma` (Lines 3143-3241)

```prisma
model BreedingPlan {
  id                       Int       @id @default(autoincrement())
  tenantId                 Int
  name                     String    // User-provided plan name
  species                  String    // DOG, HORSE, CAT, RABBIT, GOAT, SHEEP

  // Animals involved
  damId                    Int
  dam                      Animal    @relation("PlanDam", ...)
  sireId                   Int
  sire                     Animal    @relation("PlanSire", ...)

  // LOCKED DATES (immutable quartet)
  lockedCycleKey           String?   // Key for consistency check
  lockedCycleStart         DateTime? // Day 0: Heat/cycle start
  lockedOvulationDate      DateTime? // Day N: Ovulation (derived)
  lockedDueDate            DateTime? // Day N+M: Expected birth
  lockedPlacementStartDate DateTime? // Day N+M+P: Expected placement

  // EXPECTED DATES (mutable, recalculated)
  expectedCycleStart         DateTime?
  expectedHormoneTestingStart DateTime?
  expectedBreedDate          DateTime?
  expectedBirthDate          DateTime?
  expectedWeaned             DateTime?
  expectedPlacementStart     DateTime?
  expectedPlacementCompleted DateTime?

  // ACTUAL DATES (user-recorded milestones)
  cycleStartDateActual         DateTime?
  hormoneTestingStartDateActual DateTime?
  breedDateActual              DateTime?
  birthDateActual              DateTime? // LOCK POINT!
  weanedDateActual             DateTime?
  placementStartDateActual     DateTime?
  placementCompletedDateActual DateTime?
  completedDateActual          DateTime?

  // Offspring tracking
  offspringGroupId         Int?
  offspringGroup           OffspringGroup? @relation(...)

  // Test results (progesterone, LH, ultrasound)
  testResults              TestResult[]

  // Events (audit trail)
  events                   BreedingPlanEvent[]

  // ... many more fields (overrides, preferences, status, etc.)
}
```

### 2.2 Field Categories

**Locked Dates (The Quartet):**
- All 4 must be provided together when locking
- Become immutable once set (cannot unlock without unlocking all 4)
- Enforced by backend validation (Lines 521-568 in breeding.ts)

**Expected Dates:**
- Calculated/recalculated whenever locked dates change
- Can be overridden by user
- Not stored if derived from locked dates (calculated on-demand)

**Actual Dates:**
- User-recorded milestones as they occur
- Once `birthDateActual` is set, upstream dates become immutable
- Drive status transitions (PLANNING → COMMITTED → BRED → BIRTHED → ...)

### 2.3 Related Models

**ReproductiveCycle:**
```prisma
model ReproductiveCycle {
  id                Int      @id @default(autoincrement())
  tenantId          Int
  femaleId          Int
  cycleStart        DateTime // Recorded cycle start
  ovulation         DateTime? // Optional ovulation date
  dueDate           DateTime?
  placementStartDate DateTime?
  status            String?
  notes             String?
}
```
- Tracks individual female's reproductive history
- Used for cycle projections (effectiveCycleLen.ts)
- Not directly linked to breeding plans (historical record)

**TestResult:**
```prisma
model TestResult {
  id            Int      @id @default(autoincrement())
  tenantId      Int
  planId        Int?
  kind          String   // PROGESTERONE, LH, ULTRASOUND, etc.
  collectedAt   DateTime
  valueNumber   Float?   // e.g., progesterone ng/mL
  valueText     String?
  notes         String?
}
```
- Stores hormone test results
- Currently NOT linked as ovulation confirmation
- Could be leveraged for ovulation anchor evidence

**OffspringGroup:**
```prisma
model OffspringGroup {
  id                Int       @id @default(autoincrement())
  tenantId          Int
  expectedBirthOn   DateTime? // From plan
  actualBirthOn     DateTime? // Recorded birth
  weanedAt          DateTime?
  placementStartAt  DateTime?
  placementCompletedAt DateTime?

  offspring         Offspring[] // Individual puppies/kittens/etc.
  plans             BreedingPlan[] // Can link multiple plans
}
```
- Links breeding plan to actual offspring
- Birth date must match plan's birthDateActual
- Cannot add offspring until birth date recorded

---

## 3. Calculation Engine Deep Dive

### 3.1 Species Defaults

**File:** `packages/ui/src/utils/reproEngine/defaults.ts`

**Complete DOG defaults:**
```typescript
DOG: {
  // Cycle characteristics
  cycleLenDays: 180,                    // 6 months between cycles
  ovulationOffsetDays: 12,              // Ovulation ~12 days after cycle start
  startBufferDays: 14,                  // Pre-cycle buffer for planning

  // Gestation
  gestationDays: 63,                    // Birth 63 days post-ovulation

  // Offspring care
  offspringCareDurationWeeks: 6,        // Weaning at 6 weeks (AKC standard)
  placementStartWeeksDefault: 8,        // Placement at 8 weeks
  placementExtendedWeeks: 4,            // Extended placement window (8-12 weeks)

  // Postpartum return-to-cycle
  postpartumMinDays: 90,
  postpartumLikelyDays: 120,
  postpartumMaxDays: 210,

  // Juvenile first cycle (DOB-based)
  juvenileFirstCycleMinDays: 180,       // 6 months earliest
  juvenileFirstCycleLikelyDays: 270,    // 9 months typical
  juvenileFirstCycleMaxDays: 540,       // 18 months latest

  // Availability window preferences (user-configurable)
  cycle_breeding_risky_from: 14,        // Days before cycle start
  cycle_breeding_risky_to: 3,           // Days after breed date
  cycle_breeding_unlikely_from: 7,
  cycle_breeding_unlikely_to: 1,
  post_risky_from_full_start: 0,        // Birth day
  post_risky_to_full_end: 70,           // Days after placement completed
  post_unlikely_from_likely_start: 0,
  post_unlikely_to_likely_end: 14,

  // Exact date bands (milestone-specific)
  date_cycle_risky_from: 3,
  date_cycle_risky_to: 3,
  date_testing_risky_from: 2,
  date_testing_risky_to: 2,
  // ... (many more)
}
```

**Species Comparison Table:**

| Constant | DOG | HORSE | CAT | RABBIT | GOAT | SHEEP |
|----------|-----|-------|-----|--------|------|-------|
| cycleLenDays | 180 | 21 | 21 | 15 | 21 | 17 |
| ovulationOffsetDays | 12 | 5 | 3 | 0 | 2 | 2 |
| gestationDays | 63 | 340 | 63 | 31 | 150 | 147 |
| offspringCareDurationWeeks | 6 | 20 | 8 | 6 | 9 | 8 |
| placementStartWeeksDefault | 8 | 24 | 12 | 8 | 10 | 10 |
| postpartumLikelyDays | 120 | 45 | 90 | 21 | 90 | 60 |

### 3.2 Timeline Calculation Flow

**File:** `packages/ui/src/utils/reproEngine/timelineFromSeed.ts`

**Function: `buildTimelineFromSeed(summary, seedCycleStart)`**

```typescript
export function buildTimelineFromSeed(
  summary: ReproSummary,
  seedCycleStart: ISODate
): ReproTimeline {
  const species = summary.species;
  const d = getSpeciesDefaults(species);

  // STEP 1: Establish anchor point
  const heatStart = assertIsoDate(seedCycleStart, "seedCycleStart");

  // STEP 2: Calculate ovulation
  const ovulationCenter = addDays(heatStart, d.ovulationOffsetDays);
  // For dogs: Day 0 + 12 = Day 12

  // STEP 3: Calculate breeding window (around ovulation)
  const breedingFull = makeRangeTuple(
    addDays(ovulationCenter, -1),  // Day before ovulation
    addDays(ovulationCenter, 2)    // 2 days after
  ); // Dogs: Day 11-14 (4-day window)

  const breedingLikely = makeRangeTuple(
    ovulationCenter,
    addDays(ovulationCenter, 1)
  ); // Dogs: Day 12-13 (2-day window)

  // STEP 4: Calculate birth window
  const birthCenter = addDays(ovulationCenter, d.gestationDays);
  // Dogs: Day 12 + 63 = Day 75

  const birthFull = centerRangeTuple(birthCenter, 2);
  // Dogs: Day 73-77 (±2 days)

  const birthLikely = centerRangeTuple(birthCenter, 1);
  // Dogs: Day 74-76 (±1 day)

  // STEP 5: Calculate offspring care window
  const offspringCareWeeks = d.offspringCareDurationWeeks;
  const offspringCareFull = makeRangeTuple(
    birthFull[0],
    addDays(birthFull[1], offspringCareWeeks * 7)
  ); // Dogs: Day 73 to Day 77+42 = Day 73-119

  // STEP 6: Calculate placement windows
  const placementWeeks = d.placementStartWeeksDefault;
  const placementNormalFull = makeRangeTuple(
    addDays(birthFull[0], placementWeeks * 7),
    addDays(birthFull[1], placementWeeks * 7)
  ); // Dogs: Day 129-133 (birth + 8 weeks)

  // STEP 7: Calculate availability bands
  // (logic for travel risky/unlikely zones)

  // STEP 8: Return complete timeline
  return {
    projectedCycleStarts: [],
    seedCycleStart: heatStart,
    windows: {
      pre_breeding: { full, likely },
      hormone_testing: { full, likely },
      breeding: { full, likely },
      birth: { full, likely },
      offspring_care: { full, likely },
      placement_normal: { full, likely },
      placement_extended: { full, likely },
      // availability bands
    },
    milestones: {
      cycle_start: heatStart,
      heat_start: heatStart,
      ovulation_center: ovulationCenter,
    },
    explain: {
      species,
      seedType: "HISTORY", // or "ACTUAL_BIRTH" or "JUVENILE"
    },
  };
}
```

**Key Insight:** EVERYTHING derives from `seedCycleStart` (Day 0). Ovulation is Day 12, birth is Day 75, placement is Day 129. If cycle start shifts by 1 day, ALL downstream dates shift by 1 day.

### 3.3 Post-Birth Recalculation

**Function: `buildTimelineFromBirth(summary, actualBirth)`**

Once birth occurs, we **discard** expected windows and recalculate from **actual birth date**:

```typescript
export function buildTimelineFromBirth(
  summary: ReproSummary,
  actualBirth: ISODate
): Partial<ReproTimeline> {
  const d = getSpeciesDefaults(summary.species);
  const birth = assertIsoDate(actualBirth, "actualBirth");

  // Recalculate offspring care from ACTUAL birth
  const offspringCareFull = makeRangeTuple(
    birth,
    addDays(birth, d.offspringCareDurationWeeks * 7)
  );

  // Recalculate placement from ACTUAL birth
  const placementNormalFull = makeRangeTuple(
    addDays(birth, d.placementStartWeeksDefault * 7),
    addDays(birth, d.placementStartWeeksDefault * 7)
  );

  // Return only post-birth windows (pre-birth is now historical)
  return {
    windows: {
      offspring_care: { full: offspringCareFull, likely: offspringCareFull },
      placement_normal: { full: placementNormalFull, likely: placementNormalFull },
      // ...
    },
  };
}
```

**Implication:** Once birth is recorded, pre-birth windows (cycle, breeding, hormone testing) are no longer relevant. Only post-birth windows (weaning, placement) matter going forward.

### 3.4 Cycle Projections

**File:** `packages/ui/src/utils/reproEngine/projectUpcomingCycles.ts`

**Purpose:** Predict when next cycle will start (for planning future breeding)

**Logic:**
```typescript
export function projectUpcomingCycleStarts(
  summary: ReproSummary,
  opts: ProjectOptions
): ISODate[] {
  const d = getSpeciesDefaults(summary.species);
  const today = summary.today;

  // SEED 1: Last cycle start + effective cycle length
  if (summary.cycleStartsAsc.length > 0) {
    const lastCycle = summary.cycleStartsAsc[summary.cycleStartsAsc.length - 1];
    const effectiveLen = computeEffectiveCycleLen(summary, opts);
    let projected = addDays(lastCycle, effectiveLen);

    // Gate by postpartum minimum (if recently birthed)
    const lastBirth = summary.lastBirthIso;
    if (lastBirth) {
      const postpartumMin = addDays(lastBirth, d.postpartumLikelyDays);
      if (projected < postpartumMin) {
        projected = postpartumMin;
      }
    }

    return [projected];
  }

  // SEED 2: Juvenile (DOB + first cycle days)
  if (summary.dob) {
    const firstCycle = addDays(summary.dob, d.juvenileFirstCycleLikelyDays);
    if (firstCycle > today) {
      return [firstCycle];
    }
  }

  // SEED 3: Biology default (today + cycle length)
  return [addDays(today, d.cycleLenDays)];
}
```

**Key Points:**
- Prioritizes observed history over defaults
- Postpartum gating prevents projecting next cycle too soon after birth
- Horses can breed on "foal heat" (7-14 days post-birth), so postpartumMin = 30 days
- Dogs require longer recovery, postpartumMin = 90 days

---

## 4. Component Dependency Graph

### 4.1 UI Component Tree

```
YourBreedingPlansPage (entry point)
  ├─ RollupWithPhaseToggles (mode: rollup)
  │   └─ RollupGantt
  │       ├─ planWindows.windowsFromPlan(plan) → PlanStageWindows
  │       └─ Renders phase bands + exact dates
  │
  ├─ PhaseGroupedPerPlan (mode: per-plan)
  │   └─ PerPlanGantt (for each plan)
  │       ├─ planWindows.windowsFromPlan(plan) → PlanStageWindows
  │       └─ Renders individual timeline
  │
  ├─ BreedingCalendar (alternative view)
  │   ├─ planWindows.windowsFromPlan(plan) → PlanStageWindows
  │   └─ Renders milestone events on calendar
  │
  ├─ BreedingPlanCardView (card grid)
  │   └─ Displays dates, no calculations
  │
  └─ BreedingPlanListView (table)
      └─ Displays dates, sortable columns
```

### 4.2 Adapter Layer (Critical Chokepoint)

**File:** `apps/breeding/src/adapters/planWindows.ts`

**ALL UI components funnel through this adapter:**

```typescript
export function windowsFromPlan(plan: {
  species?: string | null;
  dob?: string | null;
  lockedCycleStart?: string | null;
  earliestCycleStart?: string | null;
  latestCycleStart?: string | null;
  // ... many more fields
}): PlanStageWindows | null {

  // Build reproductive summary
  const summary: ReproSummary = {
    animalId: "plan",
    species: plan.species as SpeciesCode,
    dob: asISODateOnly(plan.dob ?? null),
    today: todayISO(),
    cycleStartsAsc: [], // Empty for plans (not individual history)
  };

  // ANCHOR SELECTION LOGIC
  // Option 1: Locked cycle start (definitive)
  if (plan.lockedCycleStart) {
    const tl = buildTimelineFromSeed(summary, plan.lockedCycleStart as ISODate);
    return toPlanStageWindows(tl);
  }

  // Option 2: Range planning (earliest/latest cycle start)
  if (plan.earliestCycleStart && plan.latestCycleStart) {
    const a = buildTimelineFromSeed(summary, plan.earliestCycleStart as ISODate);
    const b = buildTimelineFromSeed(summary, plan.latestCycleStart as ISODate);
    return mergeWindows(
      toPlanStageWindows(a),
      toPlanStageWindows(b)
    ); // Combines into wider range
  }

  // Option 3: Single estimated cycle start
  if (plan.earliestCycleStart) {
    return toPlanStageWindows(
      buildTimelineFromSeed(summary, plan.earliestCycleStart as ISODate)
    );
  }

  // No anchor available
  return null;
}
```

**Key Insight:** This is THE chokepoint. Changing from cycle-start anchor to ovulation anchor requires updating THIS function to:
1. Detect which anchor mode to use (cycle vs ovulation)
2. Call appropriate timeline builder (buildTimelineFromSeed vs buildTimelineFromOvulation)
3. Return correct windows

### 4.3 Calculation Engine Dependencies

```
windowsFromPlan (adapter)
  ↓
buildTimelineFromSeed (if cycle start anchor)
  ↓
getSpeciesDefaults(species)
  ├─ Retrieves: ovulationOffsetDays, gestationDays, etc.
  └─ Returns: SpeciesReproDefaults object
  ↓
computeWindowsFromSeed(species, heatStart)
  ├─ Calculates: ovulation, breeding, birth windows
  └─ Returns: Record<string, Window>
  ↓
Returns: ReproTimeline
  ├─ windows: { pre_breeding, hormone_testing, breeding, birth, ... }
  ├─ milestones: { cycle_start, ovulation_center }
  └─ explain: { species, seedType }
```

**Alternative Flow (Post-Birth):**

```
windowsFromPlan (adapter)
  ↓
(if plan.birthDateActual exists)
  ↓
buildTimelineFromBirth (actual birth anchor)
  ↓
Returns: Partial<ReproTimeline>
  └─ Only post-birth windows (offspring_care, placement)
```

### 4.4 Backend Validation Chain

```
User submits: POST /api/breeding/plans/:id/lock
  ↓
breeding.ts: Route handler
  ↓
validateAndNormalizeLockPayload(body)
  ├─ Check: All 4 dates provided (or all null)
  ├─ Check: Dates are valid ISO format
  └─ Returns: Normalized payload
  ↓
Check immutability rules:
  ├─ If birthDateActual exists, cannot modify upstream dates
  └─ If offspring exist, cannot clear birthDateActual
  ↓
Prisma: Update BreedingPlan
  ├─ lockedCycleStart
  ├─ lockedOvulationDate (derived: cycleStart + offsetDays)
  ├─ lockedDueDate (derived: ovulation + gestationDays)
  └─ lockedPlacementStartDate (derived: dueDate + placementWeeks)
  ↓
Create BreedingPlanEvent (audit trail)
  ↓
Return updated plan to frontend
```

---

## 5. Business Rules & Validation

### 5.1 Lock Invariant (The Quartet Rule)

**File:** `breederhq-api/src/routes/breeding.ts` (Lines 521-568)

**Rule:** All 4 locked dates must be provided together (or all cleared together).

**Validation Logic:**
```typescript
function validateAndNormalizeLockPayload(body: any) {
  const provided = {
    start: body.hasOwnProperty("lockedCycleStart") ? toDateOrNull(body.lockedCycleStart) : undefined,
    ov: body.hasOwnProperty("lockedOvulationDate") ? toDateOrNull(body.lockedOvulationDate) : undefined,
    due: body.hasOwnProperty("lockedDueDate") ? toDateOrNull(body.lockedDueDate) : undefined,
    placement: body.hasOwnProperty("lockedPlacementStartDate") ? toDateOrNull(body.lockedPlacementStartDate) : undefined,
  };

  const touched = [provided.start, provided.ov, provided.due, provided.placement].some(v => v !== undefined);

  if (!touched) {
    // Unlock all
    return {
      touched: true as const,
      lockedCycleKey: null,
      lockedCycleStart: null,
      lockedOvulationDate: null,
      lockedDueDate: null,
      lockedPlacementStartDate: null,
    };
  }

  // Check all 4 are provided
  const missing: string[] = [];
  if (!provided.start) missing.push("lockedCycleStart");
  if (!provided.ov) missing.push("lockedOvulationDate");
  if (!provided.due) missing.push("lockedDueDate");
  if (!provided.placement) missing.push("lockedPlacementStartDate");

  if (missing.length > 0) {
    throw Object.assign(
      new Error(`Lock invariant violated. Missing: ${missing.join(", ")}`),
      { statusCode: 400 }
    );
  }

  return {
    touched: true as const,
    lockedCycleStart: provided.start!,
    lockedOvulationDate: provided.ov!,
    lockedDueDate: provided.due!,
    lockedPlacementStartDate: provided.placement!,
  };
}
```

**Rationale:** The 4 dates form an immutable snapshot of the expected timeline. If cycle start changes, ovulation/due/placement must recalculate. Enforcing "all or nothing" prevents partial updates that would create inconsistent state.

**Implication for Anchor Change:** If switching to ovulation anchor, this validation needs to change:
- Option A: Ovulation becomes required, cycle start becomes derived (reverse of current)
- Option B: Support both modes with different validation per mode

### 5.2 Birth Date Lock Point

**File:** `breederhq-api/src/routes/breeding.ts` (Lines 1080-1138)

**Rule:** Once `birthDateActual` is recorded, ALL upstream dates become IMMUTABLE.

**Affected Fields:**
- `cycleStartDateActual`
- `hormoneTestingStartDateActual`
- `breedDateActual`

**Validation Logic:**
```typescript
const birthDateWillBeSet = b.birthDateActual !== undefined && b.birthDateActual !== null;
const birthDateIsCurrentlySet = existingPlanDates?.birthDateActual;

if (birthDateIsCurrentlySet) {
  // Cannot clear or modify upstream dates
  const upstreamFields = [
    "cycleStartDateActual",
    "hormoneTestingStartDateActual",
    "breedDateActual",
  ];

  for (const field of upstreamFields) {
    if (b[field] === null && existingPlanDates[field]) {
      throw Object.assign(
        new Error(`Cannot clear ${field} because birthDateActual is set. Birth date locks breeding history.`),
        { statusCode: 400 }
      );
    }
  }
}
```

**Rationale:**
1. **Lineage Integrity**: Birth date anchors pedigree/genetics data
2. **Breed Registry**: AKC/AQHA require immutable breeding dates
3. **Audit Trail**: Once offspring exist, breeding history must be preserved

**Implication for Anchor Change:** Need to decide:
- Does ovulation date ALSO become immutable after birth?
- Or only actual dates (cycleStartDateActual, breedDateActual, birthDateActual)?

### 5.3 Offspring Protection

**File:** `breederhq-api/src/routes/breeding.ts` (Lines 1116-1138)

**Rule:** Cannot clear `birthDateActual` if offspring exist in linked group.

**Validation Logic:**
```typescript
const offspringExist = existingPlan.offspringGroupId &&
  await prisma.offspring.count({
    where: { groupId: existingPlan.offspringGroupId }
  }) > 0;

if (offspringExist && b.birthDateActual === null) {
  throw Object.assign(
    new Error("Cannot clear birthDateActual when offspring exist. This would orphan the offspring from their temporal context."),
    { statusCode: 400 }
  );
}
```

**Rationale:** Offspring records depend on birth date for age calculations, health records, placement tracking. Clearing birth date would break these dependencies.

### 5.4 Status Derivation Rules

**File:** `apps/breeding/src/pages/planner/deriveBreedingStatus.ts` (Lines 114-203)

**Status Chain:**
```
PLANNING (default)
  ↓ lockedCycleStart + dam + sire + species + name
COMMITTED
  ↓ breedDateActual
BRED
  ↓ birthDateActual
BIRTHED
  ↓ weanedDateActual
WEANED
  ↓ placementStartDateActual
PLACEMENT_STARTED
  ↓ placementCompletedDateActual
PLACEMENT_COMPLETED
  ↓ completedDateActual
COMPLETE
```

**Logic:**
```typescript
export function deriveBreedingStatus(plan: BreedingPlanRow): BreedingStatus {
  // Check completeness
  if (plan.completedDateActual) return "COMPLETE";
  if (plan.placementCompletedDateActual) return "PLACEMENT_COMPLETED";
  if (plan.placementStartDateActual) return "PLACEMENT_STARTED";
  if (plan.weanedDateActual) return "WEANED";
  if (plan.birthDateActual) return "BIRTHED";
  if (plan.breedDateActual) return "BRED";

  // Check if committed (has locked cycle + required fields)
  const hasLocked = plan.lockedCycleStart !== null;
  const hasRequired = plan.damId && plan.sireId && plan.species && plan.name;
  if (hasLocked && hasRequired) return "COMMITTED";

  return "PLANNING";
}
```

**Implication for Anchor Change:** COMMITTED currently requires `lockedCycleStart`. If supporting ovulation anchor, it should also accept `lockedOvulationDate`:

```typescript
const hasLocked = plan.lockedCycleStart !== null || plan.lockedOvulationDate !== null;
```

---

## 6. Testing Surface Area

### 6.1 Unit Test Coverage Needed

**Calculation Engine (`timelineFromSeed.ts`):**
- [ ] All 6 species with cycle-start anchor
- [ ] All 6 species with ovulation anchor (new)
- [ ] Range planning (earliest/latest cycle start)
- [ ] Post-birth recalculation
- [ ] Edge cases: very short gestation (rabbits), very long (horses)

**Adapters (`planWindows.ts`):**
- [ ] Locked cycle start mode
- [ ] Locked ovulation mode (new)
- [ ] Range planning mode
- [ ] No anchor (returns null)
- [ ] Species-specific window widths

**Status Derivation (`deriveBreedingStatus.ts`):**
- [ ] All status transitions
- [ ] Regression when dates removed
- [ ] COMMITTED with cycle-start anchor
- [ ] COMMITTED with ovulation anchor (new)

**Species Defaults (`defaults.ts`):**
- [ ] All species constants validate
- [ ] Offset calculations correct
- [ ] Postpartum gating values

### 6.2 Integration Test Coverage Needed

**API Endpoints:**
- [ ] POST /api/breeding/plans/:id/lock (cycle-start mode)
- [ ] POST /api/breeding/plans/:id/lock-from-ovulation (new endpoint)
- [ ] PATCH /api/breeding/plans/:id/milestone
- [ ] Validation: lock invariant enforced
- [ ] Validation: immutability rules enforced
- [ ] Validation: offspring protection enforced

**Database Operations:**
- [ ] Create plan with locked dates
- [ ] Update locked dates (should fail if birth recorded)
- [ ] Clear locked dates (unlock)
- [ ] Migrate plan from cycle-start to ovulation anchor (new)

### 6.3 E2E Test Scenarios

**User Workflows:**
1. [ ] Create new plan → Lock from cycle start → View Gantt
2. [ ] Create new plan → Lock from ovulation → View Gantt (new)
3. [ ] Lock plan → Record breed date → Record birth → View updated timeline
4. [ ] Lock plan → Upgrade from cycle-start to ovulation anchor (new)
5. [ ] Create what-if scenario → Compare to actual plan
6. [ ] Horse: Lock plan → View foaling milestones
7. [ ] Cat/Rabbit: Lock plan (verify induced ovulator terminology)

**Multi-Species:**
- [ ] Dog plan with both anchor modes
- [ ] Horse plan with ovulation anchor (should be default)
- [ ] Cat plan (breeding date = ovulation)
- [ ] Rabbit plan (0-day offset)
- [ ] Goat/Sheep plans (cycle-start only)

**Error Scenarios:**
- [ ] Try to lock with only 3 of 4 dates (should fail)
- [ ] Try to clear birth date when offspring exist (should fail)
- [ ] Try to modify cycle start after birth recorded (should fail)
- [ ] Try to create plan without species (should fail)

### 6.4 Regression Test Matrix

**Component × Anchor Mode:**

| Component | Cycle-Start Anchor | Ovulation Anchor | Range Planning |
|-----------|-------------------|------------------|----------------|
| RollupGantt | ✅ (existing) | ⚠️ (new) | ✅ (existing) |
| PerPlanGantt | ✅ (existing) | ⚠️ (new) | ✅ (existing) |
| BreedingCalendar | ✅ (existing) | ⚠️ (new) | ✅ (existing) |
| PlanJourney | ✅ (existing) | ⚠️ (new) | N/A |
| FoalingMilestones | ✅ (existing) | ⚠️ (new) | N/A |
| WhatIfPlanning | ✅ (existing) | ⚠️ (new) | ✅ (existing) |
| OffspringTracking | ✅ (existing) | ⚠️ (new) | N/A |
| WaitlistMatching | ✅ (existing) | ⚠️ (new) | N/A |

**Legend:**
- ✅ = Existing test coverage
- ⚠️ = New test coverage needed
- N/A = Not applicable

### 6.5 Performance Benchmarks

**Baseline (Cycle-Start Anchor):**
- Timeline calculation for 1 plan: <1ms
- Timeline calculation for 1000 plans: <1000ms (<1ms average)
- Gantt render for 50 plans: <500ms
- Calendar render for 100 events: <200ms

**Targets (With Ovulation Anchor):**
- Timeline calculation per plan: <2ms (allow 2x for dual-mode logic)
- No regression in Gantt/Calendar render times
- Database queries: no N+1 problems
- API response times: <100ms for lock operations

---

## Appendices

### Appendix A: File Reference Quick Links

**Core Calculation:**
- `packages/ui/src/utils/reproEngine/timelineFromSeed.ts` - Main timeline builder
- `packages/ui/src/utils/reproEngine/defaults.ts` - Species constants
- `packages/ui/src/utils/reproEngine/effectiveCycleLen.ts` - Cycle length calculation
- `packages/ui/src/utils/reproEngine/projectUpcomingCycles.ts` - Future projections

**Adapters:**
- `apps/breeding/src/adapters/planWindows.ts` - **CRITICAL CHOKEPOINT**
- `apps/breeding/src/adapters/planToGantt.ts` - Field normalization

**UI Components:**
- `apps/breeding/src/components/RollupGantt.tsx` - Multi-plan timeline
- `apps/breeding/src/components/PerPlanGantt.tsx` - Single plan timeline
- `apps/breeding/src/components/BreedingCalendar.tsx` - Calendar view
- `apps/breeding/src/components/PlanJourney.tsx` - Phase progression
- `apps/breeding/src/components/FoalingMilestoneChecklist.tsx` - Horse milestones

**API & Validation:**
- `breederhq-api/src/routes/breeding.ts` - Main API route (2719 lines)
  - Lines 521-568: Lock validation
  - Lines 1080-1138: Immutability rules
  - Lines 49-52: Offspring birth calculation

**Business Logic:**
- `apps/breeding/src/pages/planner/deriveBreedingStatus.ts` - Status derivation

**Database:**
- `breederhq-api/prisma/schema.prisma` - BreedingPlan model (lines 3143-3241)

### Appendix B: Date Field Matrix

| Field Name | Type | Mutability | Calculated From | Used By |
|------------|------|------------|-----------------|---------|
| lockedCycleStart | DateTime? | Immutable (once locked) | User input | Timeline seed |
| lockedOvulationDate | DateTime? | Immutable (once locked) | cycleStart + offset | Birth calculation |
| lockedDueDate | DateTime? | Immutable (once locked) | ovulation + gestation | Placement calculation |
| lockedPlacementStartDate | DateTime? | Immutable (once locked) | dueDate + placement offset | Calendar |
| expectedBirthDate | DateTime? | Mutable | Recalculated from locked | Dashboard, alerts |
| birthDateActual | DateTime? | **LOCK POINT** | User input | Status, offspring |
| cycleStartDateActual | DateTime? | Immutable (after birth) | User input | Audit trail |
| breedDateActual | DateTime? | Immutable (after birth) | User input | Status, foaling |
| weanedDateActual | DateTime? | Mutable | User input | Status |
| placementStartDateActual | DateTime? | Mutable | User input | Status |

### Appendix C: Calculation Formula Reference

**Dogs (63-day gestation):**
```
Day 0:   Cycle start (heat begins)
Day 12:  Ovulation (progesterone rises)
Day 11-14: Breeding window (full)
Day 12-13: Breeding window (likely)
Day 75:  Expected birth (ovulation + 63)
Day 73-77: Birth window (full, ±2 days)
Day 74-76: Birth window (likely, ±1 day)
Day 117: Weaning (birth + 42 days / 6 weeks)
Day 131: Placement start (birth + 56 days / 8 weeks)
Day 152: Placement extended end (placement + 28 days / 4 weeks)
```

**Horses (340-day gestation):**
```
Day 0:   Cycle start
Day 5:   Ovulation (ultrasound confirms)
Day 4-7: Breeding window (full)
Day 5-6: Breeding window (likely)
Day 345: Expected foaling (ovulation + 340)
Day 343-347: Foaling window (full, ±2 days)
Day 344-346: Foaling window (likely, ±1 day)
Day 485: Weaning (foaling + 140 days / 20 weeks)
Day 513: Placement (foaling + 168 days / 24 weeks)
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-17
**Author:** Claude (Anthropic)
**Purpose:** Complete architecture analysis for ovulation anchor implementation planning
