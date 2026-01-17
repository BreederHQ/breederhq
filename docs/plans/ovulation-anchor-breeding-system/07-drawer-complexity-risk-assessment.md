# Breeding Plan Drawer - Complexity & Risk Assessment

## Document Purpose

Deep dive analysis of the breeding plan overlay drawer to assess risks of changing anchor date logic. This is **CRITICAL INFRASTRUCTURE** - any breaking changes could cascade through 3,680 lines of highly interconnected date calculation logic.

**Date:** 2026-01-17
**Status:** ⚠️ HIGH RISK - Requires careful implementation strategy

---

## Executive Summary

The breeding plan drawer is NOT a separate component - it's a **3,680-line inline implementation** within `App-Breeding.tsx` (lines 6740-10420). It manages:

- ✅ 6 base tabs (Overview, Dates, Offspring, Deposits, Finances, Audit)
- ✅ 2 horse-specific tabs (Foaling Checklist, Foaling Outcome)
- ✅ 3 date calculation modes (Expected, Recalculated, Actual)
- ✅ 8-phase status progression with validation
- ✅ Automatic anchor switching (cycle → birth)
- ✅ Species-specific milestone generation (horses)
- ✅ Complex cascade delete logic

**Critical Finding:** The system ALREADY has **multiple anchor modes** implemented:
1. **Planning Phase:** Anchor = `lockedCycleStart`
2. **Committed-to-Birth:** Anchor = `cycleStartDateActual` (if entered, else lockedCycleStart)
3. **Post-Birth:** Anchor = `birthDateActual` (pre-birth dates frozen)

**This means our ovulation-first architecture must integrate with existing multi-anchor logic!**

---

## Current Architecture: Multi-Anchor System

### Anchor Priority Chain

```
Priority 1 (Post-Birth):   birthDateActual
Priority 2 (Pre-Birth):    cycleStartDateActual
Priority 3 (Planning):     lockedCycleStart
```

### Recalculation Logic (Existing)

**Function:** `recalculateExpectedDatesFromActual()`

```typescript
// Pathway 1: Birth date exists (highest priority)
if (actualBirthDate) {
  // Only post-birth dates recalculated from birth anchor
  const birthTimeline = reproEngine.buildTimelineFromBirth(actualBirthDate)
  return {
    expectedHormoneTestingStart: null,  // Pre-birth: NOT recalculated
    expectedBreedDate: null,             // Pre-birth: NOT recalculated
    expectedBirthDate: null,             // Pre-birth: NOT recalculated
    expectedWeaned: birthTimeline,       // Post-birth: FROM BIRTH
    expectedPlacementStart: birthTimeline,
    expectedPlacementCompleted: birthTimeline,
  }
}

// Pathway 2: Cycle start exists (medium priority)
if (actualCycleStart) {
  // All dates recalculated from cycle start anchor
  const expectedRaw = computeExpectedForPlan(actualCycleStart)
  return {
    expectedHormoneTestingStart: expectedRaw,  // FROM CYCLE
    expectedBreedDate: expectedRaw,            // FROM CYCLE
    expectedBirthDate: expectedRaw,            // FROM CYCLE
    expectedWeaned: expectedRaw,               // FROM CYCLE
    expectedPlacementStart: expectedRaw,
    expectedPlacementCompleted: expectedRaw,
  }
}

// Pathway 3: Fallback to original expected (from lockedCycleStart)
return originalExpectedDates
```

**KEY INSIGHT:** System already switches anchors! Adding ovulation anchor is an **extension**, not a replacement.

---

## Risk Assessment: Adding Ovulation Anchor

### 🔴 CRITICAL RISK #1: Foaling Milestones Break

**Current Implementation:**
- Milestones calculated from `breedDateActual` (15d, 45d, 90d, 300d, 320d, 330d, 340d, 350d)
- **File:** `FoalingMilestoneChecklist.tsx`
- **Endpoint:** `POST /breeding/plans/:id/milestones`

**Problem:**
If we add ovulation as anchor and user enters ovulation date but NOT breed date:
- Cannot create foaling milestones (requires breed date)
- OR: Need to calculate breed date from ovulation (reverse)

**Proposed Solution:**

```typescript
// New milestone creation logic:
function createFoalingMilestones(plan) {
  // Priority 1: Use breed date if available
  if (plan.breedDateActual) {
    return calculateMilestonesFromBreedDate(plan.breedDateActual)
  }

  // Priority 2: Use ovulation date (NEW)
  if (plan.ovulationConfirmed) {
    // Breeding typically occurs 2-4 days after ovulation
    // For horses: eggs viable 3-4 days post-ovulation
    // Use ovulation date as proxy for breed date
    return calculateMilestonesFromOvulation(plan.ovulationConfirmed)
  }

  // Priority 3: Use expected breed date from cycle
  if (plan.expectedBreedDate) {
    return calculateMilestonesFromExpectedBreed(plan.expectedBreedDate)
  }

  return null // Cannot create milestones
}
```

**Risk Level:** 🔴 **CRITICAL** - Horses are a key species, milestones cannot break

**Mitigation:**
1. Add ovulation-to-breed-date calculation for horses
2. Show clear UI: "Milestones calculated from ovulation date (breeding typically occurs 2-4 days after)"
3. Allow milestone refresh if breed date later entered (more precise)

---

### 🔴 CRITICAL RISK #2: Anchor Priority Conflicts

**Current Priority Chain:**
```
1. birthDateActual
2. cycleStartDateActual
3. lockedCycleStart
```

**New Priority Chain (Proposed):**
```
1. birthDateActual
2. ovulationConfirmed (NEW - higher accuracy than cycle)
3. cycleStartDateActual
4. lockedCycleStart
```

**Problem:**
If user has BOTH `cycleStartDateActual` AND `ovulationConfirmed`:
- Which one wins?
- Current code assumes cycle start is only pre-birth anchor
- Need to detect and reconcile

**Proposed Solution:**

```typescript
function detectPrimaryAnchor(plan) {
  // Post-birth: Always use birth
  if (plan.birthDateActual) {
    return { type: "BIRTH", date: plan.birthDateActual }
  }

  // Pre-birth: Ovulation > Cycle (if available)
  if (plan.ovulationConfirmed && plan.ovulationConfirmedMethod !== "CALCULATED") {
    return { type: "OVULATION", date: plan.ovulationConfirmed }
  }

  // Pre-birth: Fallback to cycle start
  if (plan.cycleStartDateActual) {
    return { type: "CYCLE_START", date: plan.cycleStartDateActual }
  }

  // Planning: Locked cycle
  if (plan.lockedCycleStart) {
    return { type: "LOCKED_CYCLE", date: plan.lockedCycleStart }
  }

  return null
}

function recalculateExpectedDatesFromActual(plan) {
  const anchor = detectPrimaryAnchor(plan)

  switch (anchor.type) {
    case "BIRTH":
      return reproEngine.buildTimelineFromBirth(anchor.date)

    case "OVULATION":
      return reproEngine.buildTimelineFromOvulation(anchor.date)

    case "CYCLE_START":
      return reproEngine.buildTimelineFromSeed(anchor.date)

    case "LOCKED_CYCLE":
      return computeExpectedForPlan(plan)

    default:
      return null
  }
}
```

**Risk Level:** 🔴 **CRITICAL** - Core calculation engine

**Mitigation:**
1. Add anchor detection logic BEFORE changing recalculation logic
2. Comprehensive unit tests for all anchor combinations
3. Show anchor source in UI: "Dates calculated from ovulation (confirmed via progesterone test)"

---

### 🔴 CRITICAL RISK #3: Status Derivation Regression

**Current Logic:** `deriveBreedingStatus.ts`

```typescript
// COMMITTED requires lockedCycleStart
if (hasCycleStart && hasCommitPrereqs) return "COMMITTED"

// BRED requires cycleStartDateActual
if (hasCycleStart && hasBreedDate) return "BRED"
```

**Problem:**
If ovulation is the anchor, user might NOT have `cycleStartDateActual`:
- Status might incorrectly regress to PLANNING
- OR: Need to allow ovulation as alternative to cycle start for COMMITTED status

**Proposed Solution:**

```typescript
function deriveBreedingStatus(plan) {
  const hasCommitted = plan.lockedCycleStart || plan.ovulationConfirmed
  const hasCycleStart = plan.cycleStartDateActual || plan.ovulationConfirmed

  // COMMITTED: Locked cycle OR confirmed ovulation
  if (hasCommitted && hasCommitPrereqs) return "COMMITTED"

  // BRED: Cycle start OR ovulation + breed date
  if (hasCycleStart && hasBreedDate) return "BRED"

  // ... rest of logic
}
```

**Risk Level:** 🔴 **CRITICAL** - Status controls UI state and user permissions

**Mitigation:**
1. Update status derivation to accept ovulation as alternative anchor
2. Add tests for all status transitions with ovulation anchor
3. Ensure backward compatibility (existing plans don't regress)

---

### 🟡 MODERATE RISK #4: Date Sequence Validation

**Current Validation:** `warnIfSequenceBroken()`

```typescript
const ACTUAL_FIELD_ORDER = [
  "cycleStartDateActual",
  "hormoneTestingStartDateActual",
  "breedDateActual",
  "birthDateActual",
  "weanedDateActual",
  "placementStartDateActual",
  "placementCompletedDateActual",
  "completedDateActual",
]
```

**Problem:**
If ovulation is entered instead of cycle start:
- Sequence validation assumes cycle start comes first
- Ovulation typically occurs 12 days AFTER cycle start
- But if user only has ovulation, validation might fail

**Proposed Solution:**

```typescript
const ACTUAL_FIELD_ORDER = [
  "cycleStartDateActual",      // Optional if ovulation entered
  "ovulationConfirmed",         // NEW - can substitute for cycle start
  "hormoneTestingStartDateActual",
  "breedDateActual",
  "birthDateActual",
  "weanedDateActual",
  "placementStartDateActual",
  "placementCompletedDateActual",
  "completedDateActual",
]

function warnIfSequenceBroken(field, nextValue) {
  // Special case: If ovulation entered without cycle start
  if (field === "ovulationConfirmed" && !plan.cycleStartDateActual) {
    // Derive expected cycle start for validation purposes
    const estimatedCycleStart = addDays(nextValue, -12)
    // Check if ovulation comes after any later dates
  }

  // ... existing validation logic
}
```

**Risk Level:** 🟡 **MODERATE** - Soft warning only, doesn't block saves

**Mitigation:**
1. Add ovulation to sequence validation
2. Smart validation: If ovulation entered, estimate cycle start for sequence check
3. Clear messaging: "Ovulation date entered without cycle start - this is OK if you used hormone testing"

---

### 🟡 MODERATE RISK #5: Cascade Delete Logic

**Current Logic:** `clearActualDateAndSubsequent()`

```typescript
// Clearing cycle start clears ALL subsequent dates:
// cycle → hormone → breed → birth → weaned → placement → completed
```

**Problem:**
If user enters ovulation then later wants to clear it:
- Should it clear cycle start too? (if they entered both)
- Should it clear breed date? (breed typically happens after ovulation)
- Current cascade might clear too much or too little

**Proposed Solution:**

```typescript
function clearActualDateAndSubsequent(field) {
  if (field === "ovulationConfirmed") {
    // Special handling: Only clear dates AFTER ovulation
    // Don't clear cycle start (it came before)
    const fieldsToClear = [
      "ovulationConfirmed",
      "breedDateActual",
      "birthDateActual",
      // ... subsequent dates
    ]
  } else if (field === "cycleStartDateActual") {
    // Clear cycle start AND ovulation (ovulation comes after)
    const fieldsToClear = [
      "cycleStartDateActual",
      "ovulationConfirmed", // NEW
      "hormoneTestingStartDateActual",
      "breedDateActual",
      // ... subsequent dates
    ]
  }

  // ... existing logic
}
```

**Risk Level:** 🟡 **MODERATE** - Affects user workflow but has confirmation dialog

**Mitigation:**
1. Update cascade logic to include ovulation in sequence
2. Clear confirmation message shows ALL dates that will be cleared
3. For horses: Warn about foaling milestone deletion

---

### 🟡 MODERATE RISK #6: Dates Tab Display Confusion

**Current Display:** 3 sections
1. **Expected Dates** - From locked cycle (always visible)
2. **Recalculated Dates** - From actual dates (visible after COMMITTED)
3. **Actual Dates** - User-entered (editable)

**Problem:**
With ovulation anchor:
- "Expected Dates" might show dates calculated from cycle start
- "Recalculated Dates" might show dates calculated from ovulation
- User confusion: Which dates are "correct"?

**Proposed Solution:**

Add clear labeling and anchor source indicators:

```typescript
<SectionCard title="Expected Dates" badge="From Locked Cycle">
  <div className="text-xs text-gray-500 mb-2">
    Calculated from cycle start: {fmt(lockedCycleStart)}
  </div>
  {/* ... expected dates */}
</SectionCard>

<SectionCard
  title="Recalculated Dates"
  badge={getAnchorBadge(anchor)} // "From Ovulation" or "From Cycle Start" or "From Birth"
>
  <div className="text-xs text-gray-500 mb-2">
    <AnchorIndicator
      mode={anchor.type}
      date={anchor.date}
      confidence={anchor.confidence}
    />
  </div>
  {/* ... recalculated dates */}
</SectionCard>
```

**Risk Level:** 🟡 **MODERATE** - UI clarity, not functionality

**Mitigation:**
1. Add anchor source badges
2. Show which date is being used as anchor
3. Educational tooltip: "Why are there 3 date sections?"

---

### 🟢 LOW RISK #7: Lock/Unlock Cycle Logic

**Current Logic:**
- Lock: Saves `lockedCycleStart` + calculates expected dates
- Unlock: Clears all locked and expected dates (only if status = COMMITTED)

**Impact of Ovulation Anchor:**
- Might need "Lock from Ovulation" button (separate from "Lock Cycle")
- Or: Unified "Lock Breeding Plan" button with anchor mode selector

**Proposed Solution:**

```typescript
// Option A: Two separate buttons
<Button onClick={() => lockFromCycleStart()}>
  Lock from Cycle Start
</Button>
<Button onClick={() => lockFromOvulation()}>
  Lock from Ovulation (Hormone Tested)
</Button>

// Option B: Single button with mode selector
<LockBreedingPlanDialog
  species={plan.species}
  onLock={(anchorMode, anchorDate) => {
    if (anchorMode === "CYCLE_START") {
      lockFromCycleStart(anchorDate)
    } else if (anchorMode === "OVULATION") {
      lockFromOvulation(anchorDate)
    }
  }}
/>
```

**Risk Level:** 🟢 **LOW** - New feature, doesn't break existing functionality

**Mitigation:**
1. Keep existing "Lock Cycle" behavior unchanged
2. Add new "Lock from Ovulation" as optional enhancement
3. Both can coexist without conflicts

---

## Species-Specific UI Requirements

### Current Species-Specific Elements

**HORSE Only:**
1. Foaling Checklist tab
2. Foaling Outcome tab
3. Foaling milestone auto-generation

**ALL Species:**
- Same tab structure (Overview, Dates, Offspring, etc.)
- Same date entry fields
- Same status progression

### Will We Need Species-Specific UIs for Each Species?

**Answer: Probably NOT for anchor date changes**

**Reasoning:**

1. **Existing Pattern:** Terminology normalization (via `speciesTerminology.ts`) handles species differences
   - UI shows "Heat Start" for dogs, "Cycle Start" for horses, "Breeding Date" for cats
   - Same underlying field, different labels

2. **Anchor Mode:** Can use similar pattern
   - UI shows "Lock from Ovulation" for dogs/horses (testing available)
   - UI shows "Lock from Breeding Date" for cats (induced ovulators)
   - UI hides ovulation option for goats/sheep (testing not available)

3. **Conditional Rendering:** Based on species metadata, not separate components

**Proposed Approach:**

```typescript
function BreedingPlanDrawer({ plan }) {
  const terminology = getSpeciesTerminology(plan.species)
  const anchorConfig = terminology.anchorMode

  return (
    <DetailsScaffold>
      <Tab name="overview">
        {/* Cycle Locking Section */}
        <CycleLockingSection>
          {anchorConfig.testingAvailable && (
            <Button onClick={() => lockFromOvulation()}>
              Lock from {terminology.ovulation.dateLabel}
            </Button>
          )}
          <Button onClick={() => lockFromCycleStart()}>
            Lock from {terminology.cycle.anchorDateLabel}
          </Button>
        </CycleLockingSection>

        {/* Phase Journey */}
        <PlanJourney {...props} />
      </Tab>

      <Tab name="dates">
        {/* Dates Tab - Species-aware labels */}
        <DateSection label={terminology.cycle.anchorDateLabel} />
        {anchorConfig.testingAvailable && (
          <DateSection label={terminology.ovulation.dateLabel} />
        )}
      </Tab>

      {/* Horse-specific tabs */}
      {plan.species === "HORSE" && (
        <>
          <Tab name="foaling-checklist">
            <FoalingMilestoneChecklist {...props} />
          </Tab>
          <Tab name="foaling-outcome">
            <FoalingOutcomeTab {...props} />
          </Tab>
        </>
      )}
    </DetailsScaffold>
  )
}
```

**Conclusion:** NO need for completely separate drawer UIs per species. Use conditional rendering + terminology normalization.

---

## Implementation Strategy

### Phase 1: Non-Breaking Foundation (Low Risk)

1. ✅ Add ovulation fields to database schema (nullable, optional)
2. ✅ Extend `speciesTerminology.ts` with anchor mode metadata
3. ✅ Add `buildTimelineFromOvulation()` to reproEngine
4. ✅ Add `detectPrimaryAnchor()` helper function
5. ✅ Add unit tests for new functions

**Risk:** ✅ **NONE** - New fields don't affect existing logic

### Phase 2: Backend API (Medium Risk)

1. ⚠️ Add `POST /breeding/plans/:id/lock-from-ovulation` endpoint
2. ⚠️ Update status derivation to accept ovulation as alternative anchor
3. ⚠️ Update foaling milestone generation to support ovulation anchor
4. ⚠️ Add ovulation to cascade delete logic

**Risk:** ⚠️ **MODERATE** - Backend changes, comprehensive tests required

### Phase 3: Frontend Integration (High Risk)

1. 🔴 Update `recalculateExpectedDatesFromActual()` with anchor detection
2. 🔴 Add ovulation field to Dates tab
3. 🔴 Add "Lock from Ovulation" button to Overview tab
4. 🔴 Update date sequence validation
5. 🔴 Add anchor indicator badges
6. 🔴 Update `clearActualDateAndSubsequent()` logic

**Risk:** 🔴 **HIGH** - Core calculation engine changes

**Mitigation:**
- Feature flag: Enable ovulation anchor per tenant (gradual rollout)
- A/B testing: Half of users get new feature, half stay on old
- Extensive E2E tests for all species x all anchor modes
- Rollback plan if critical bugs found

### Phase 4: Educational Features (Low Risk)

1. ✅ Add cycle prediction dashboard
2. ✅ Add progesterone testing workflow
3. ✅ Add notifications

**Risk:** ✅ **LOW** - New features, don't modify existing logic

---

## Testing Requirements

### Unit Tests

```typescript
describe("Anchor Detection", () => {
  test("prioritizes birth over ovulation over cycle", () => {
    const plan = {
      birthDateActual: "2026-05-15",
      ovulationConfirmed: "2026-03-15",
      cycleStartDateActual: "2026-03-01",
    }
    expect(detectPrimaryAnchor(plan).type).toBe("BIRTH")
  })

  test("prioritizes ovulation over cycle when birth not set", () => {
    const plan = {
      ovulationConfirmed: "2026-03-15",
      cycleStartDateActual: "2026-03-01",
    }
    expect(detectPrimaryAnchor(plan).type).toBe("OVULATION")
  })

  test("falls back to cycle when only cycle set", () => {
    const plan = {
      cycleStartDateActual: "2026-03-01",
    }
    expect(detectPrimaryAnchor(plan).type).toBe("CYCLE_START")
  })
})

describe("Recalculated Dates", () => {
  test("calculates from ovulation anchor for dogs", () => {
    const plan = {
      species: "DOG",
      ovulationConfirmed: "2026-03-15",
      ovulationConfirmedMethod: "PROGESTERONE_TEST",
    }
    const result = recalculateExpectedDatesFromActual(plan)
    expect(result.expectedBirthDate).toBe("2026-05-17") // +63 days
  })

  test("does not recalculate pre-birth from birth anchor", () => {
    const plan = {
      species: "DOG",
      birthDateActual: "2026-05-17",
    }
    const result = recalculateExpectedDatesFromActual(plan)
    expect(result.expectedCycleStart).toBeNull()
    expect(result.expectedBreedDate).toBeNull()
  })
})

describe("Status Derivation", () => {
  test("COMMITTED with ovulation but no cycle start", () => {
    const plan = {
      name: "Test",
      species: "DOG",
      damId: 1,
      sireId: 2,
      ovulationConfirmed: "2026-03-15",
    }
    expect(deriveBreedingStatus(plan)).toBe("COMMITTED")
  })

  test("BRED with ovulation but no cycle start", () => {
    const plan = {
      name: "Test",
      species: "DOG",
      damId: 1,
      sireId: 2,
      ovulationConfirmed: "2026-03-15",
      breedDateActual: "2026-03-17",
    }
    expect(deriveBreedingStatus(plan)).toBe("BRED")
  })
})
```

### Integration Tests

```typescript
describe("Lock from Ovulation API", () => {
  test("creates plan with ovulation anchor", async () => {
    const response = await api.post(`/breeding/plans/${planId}/lock-from-ovulation`, {
      ovulationDate: "2026-03-15",
      method: "PROGESTERONE_TEST",
    })

    expect(response.reproAnchorMode).toBe("OVULATION")
    expect(response.lockedOvulationDate).toBe("2026-03-15")
    expect(response.lockedDueDate).toBe("2026-05-17") // +63 days
  })

  test("creates foaling milestones from ovulation for horses", async () => {
    const horsePlan = await createHorsePlan()
    await api.post(`/breeding/plans/${horsePlan.id}/lock-from-ovulation`, {
      ovulationDate: "2026-04-01",
      method: "ULTRASOUND",
    })

    const milestones = await api.get(`/breeding/plans/${horsePlan.id}/milestones`)
    expect(milestones).toHaveLength(8)
    expect(milestones[0].type).toBe("VET_PREGNANCY_CHECK_15D")
    expect(milestones[0].scheduledDate).toBe("2026-04-16") // ovulation + 15 days
  })
})
```

### E2E Tests

```typescript
test("Dog breeder upgrades from cycle to ovulation anchor", async ({ page }) => {
  // 1. Create plan and lock from cycle start
  await page.goto("/breeding/plans/new")
  await fillPlanDetails({ species: "DOG", name: "Litter A" })
  await page.click("[data-testid='lock-cycle-btn']")
  await page.fill("[data-testid='cycle-start']", "2026-03-01")
  await page.click("[data-testid='confirm-lock']")

  // 2. Verify cycle-anchored status
  await expect(page.locator("[data-testid='anchor-badge']")).toHaveText("Cycle-Anchored")
  await expect(page.locator("[data-testid='expected-birth']")).toHaveText("May 17, 2026")

  // 3. Upgrade to ovulation anchor
  await page.click("[data-testid='lock-from-ovulation-btn']")
  await page.fill("[data-testid='ovulation-date']", "2026-03-15")
  await page.selectOption("[data-testid='method']", "PROGESTERONE_TEST")
  await page.click("[data-testid='submit-ovulation-lock']")

  // 4. Verify ovulation-anchored status
  await expect(page.locator("[data-testid='anchor-badge']")).toHaveText("Ovulation-Anchored")
  await expect(page.locator("[data-testid='expected-birth']")).toHaveText("May 17, 2026") // Same date
  await expect(page.locator("[data-testid='derived-cycle']")).toHaveText("Mar 3, 2026") // Derived
})
```

---

## Rollback Plan

### If Critical Bugs Found in Production

**Immediate Actions:**

1. **Feature Flag Disable:**
   ```sql
   UPDATE tenants SET features = features - 'ovulation_anchor' WHERE id IN (affected_tenant_ids);
   ```

2. **Emergency Patch:**
   ```typescript
   // In recalculateExpectedDatesFromActual()
   // EMERGENCY: Ignore ovulation anchor, always use cycle/birth
   function recalculateExpectedDatesFromActual(plan) {
     if (EMERGENCY_DISABLE_OVULATION_ANCHOR) {
       // Use old logic only
       if (plan.birthDateActual) {
         return reproEngine.buildTimelineFromBirth(plan.birthDateActual)
       }
       if (plan.cycleStartDateActual) {
         return reproEngine.buildTimelineFromSeed(plan.cycleStartDateActual)
       }
     }

     // ... new logic
   }
   ```

3. **Data Audit:**
   - Identify plans using ovulation anchor: `SELECT * FROM BreedingPlan WHERE reproAnchorMode = 'OVULATION'`
   - Check for status regressions
   - Check for missing milestones (horses)
   - Check for incorrect expected dates

4. **Communication:**
   - Email affected users
   - In-app banner: "We've temporarily disabled ovulation anchor mode while we investigate an issue"

---

## Final Recommendations

### DO NOT Proceed Until:

1. ✅ All 🔴 CRITICAL risks have mitigation plans implemented
2. ✅ Comprehensive test suite written (unit + integration + E2E)
3. ✅ Feature flag infrastructure ready for gradual rollout
4. ✅ Rollback plan tested and documented
5. ✅ User documentation and help articles prepared
6. ✅ Support team trained on new features

### Implementation Order:

1. **Week 1:** Non-breaking foundation (database, reproEngine, helpers)
2. **Week 2:** Backend API with extensive tests
3. **Week 3:** Frontend integration with feature flag (beta users only)
4. **Week 4:** Monitor, fix bugs, expand to more users
5. **Week 5:** Educational features (low risk)
6. **Week 6:** Full rollout after validation

### Success Criteria:

- Zero status derivation regressions
- Zero foaling milestone errors for horses
- <5% user confusion (measure support tickets)
- Positive user feedback from beta testers
- All E2E tests passing across 6 species x 3 anchor modes = 18 scenarios

---

**Document Version:** 1.0
**Last Updated:** 2026-01-17
**Risk Level:** ⚠️ HIGH - Requires careful, phased implementation
**Recommendation:** Proceed with caution, feature flag, and extensive testing
