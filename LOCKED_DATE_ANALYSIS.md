# Locked Date Immutability Analysis

**Date:** 2026-01-01
**Feature:** Cycle Length Override v1
**Concern:** Do override changes affect already-locked breeding plan dates?

## Executive Summary

**STATUS:** ⚠️ **CRITICAL VULNERABILITY FOUND**

The system has a **data integrity issue** where locked breeding dates are **NOT fully immutable** when cycle length override values change. While the backend stores locked dates correctly, the **frontend displays different "expected" dates** that can be recalculated, creating confusion and potential data corruption.

---

## Database Schema

### Locked Date Fields (4 fields - IMMUTABLE in database)
```typescript
lockedCycleStart: DateTime?
lockedOvulationDate: DateTime?
lockedDueDate: DateTime?
lockedPlacementStartDate: DateTime?
```

### Expected Date Fields (7 fields - MUTABLE, can be recalculated)
```typescript
expectedCycleStart: DateTime?
expectedHormoneTestingStart: DateTime?
expectedBreedDate: DateTime?
expectedBirthDate: DateTime?
expectedWeaned: DateTime?
expectedPlacementStartDate: DateTime?  // ⚠️ Overlaps with locked!
expectedPlacementCompleted: DateTime?
```

### Actual Date Fields (8 fields - user-recorded actuals)
```typescript
cycleStartDateActual: DateTime?
hormoneTestingStartDateActual: DateTime?
breedDateActual: DateTime?
birthDateActual: DateTime?
weanedDateActual: DateTime?
placementStartDateActual: DateTime?
placementCompletedDateActual: DateTime?
completedDateActual: DateTime?
```

---

## Critical Findings

### 1. ✅ Backend is Secure
**File:** `c:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\breeding.ts`

The backend **correctly stores locked dates as immutable snapshots**:

```typescript
// Lines 893-901: Allowed update fields
const safeFields = [
  "lockedCycleStart",
  "lockedOvulationDate",
  "lockedDueDate",
  "lockedPlacementStartDate",
  "expectedCycleStart",
  "expectedHormoneTestingStart",
  "expectedBreedDate",
  "expectedBirthDate",
  "expectedPlacementStart",
  "expectedWeaned",
  "expectedPlacementCompleted",
  // ... other fields
];
```

**Backend GET endpoints** (lines 575-651) return raw database values with **NO recalculation**.

### 2. ⚠️ Frontend Has Vulnerabilities
**File:** `c:\Users\Aaron\Documents\Projects\breederhq\apps\breeding\src\App-Breeding.tsx`

#### Issue #1: Expected Dates Use Locked Values Instead of Database Values

**Lines 844-851 in `planToRow` function:**

```typescript
/* Canonical expected timeline (strict, breedingMath-driven) */
expectedCycleStart: (p.expectedCycleStart ?? p.lockedCycleStart) ?? null,
expectedHormoneTestingStart: p.expectedHormoneTestingStart ?? null,
expectedBreedDate: p.lockedOvulationDate ?? null,  // ⚠️ USES LOCKED, NOT EXPECTED!
expectedBirthDate: p.lockedDueDate ?? null,         // ⚠️ USES LOCKED, NOT EXPECTED!
expectedWeaned: p.expectedWeaned ?? null,
expectedPlacementStartDate: p.expectedPlacementStartDate ?? null,
expectedPlacementCompletedDate: (pickPlacementCompletedAny(p) as any) ?? null,
```

**PROBLEM:**
- `expectedBreedDate` displays `lockedOvulationDate` instead of `p.expectedBreedDate`
- `expectedBirthDate` displays `lockedDueDate` instead of `p.expectedBirthDate`
- This creates confusion: are these "expected" (can change) or "locked" (immutable)?

**WHY THIS IS DANGEROUS:**
- If a user changes the override value, they see two sets of dates:
  - "Expected" dates (from locked fields) - appear unchangeable
  - "Locked" dates (from locked fields) - truly locked
- The UI shows IDENTICAL values for both, making it unclear which is which
- Users cannot see what dates WOULD be if they unlocked and re-locked

#### Issue #2: Missing Locked Fields for Weaned and Placement Completed

**Database schema lacks:**
- `lockedWeanedDate` (does not exist)
- `lockedPlacementCompletedDate` (does not exist)

**Current behavior:**
- `expectedWeaned` and `expectedPlacementCompleted` are stored in database
- These values are SET when locking (lines 3863-3865)
- But they can potentially be OVERWRITTEN on subsequent updates
- No "locked" snapshot exists to preserve original calculated values

#### Issue #3: What-If Planner Recalculates Using Current Override

**Lines 1636-1640:**

```typescript
const expectedDates = computeExpectedForPlan({
  species: speciesUi,
  lockedCycleStart: r.cycleStartIso,
  femaleCycleLenOverrideDays: r.femaleCycleLenOverrideDays,  // ⚠️ Uses CURRENT override
});
```

**PROBLEM:**
- What-If planner correctly uses current override for preview
- But this makes it hard to see: "what were the ORIGINAL locked dates vs what WOULD they be now?"

---

## Detailed Code Flow Analysis

### When Locking a Cycle (lines 3838-3912)

```typescript
async function lockCycle() {
  // Step 1: Compute expected dates using CURRENT override value
  const expectedRaw = computeExpectedForPlan({
    species: row.species as any,
    lockedCycleStart: pendingCycle,
    femaleCycleLenOverrideDays: liveOverride,  // ⚠️ Uses CURRENT override
  });

  // Step 2: Normalize dates
  const expected = normalizeExpectedMilestones(expectedRaw, pendingCycle);

  // Step 3: Build payload with BOTH locked AND expected
  const payload = {
    // Locked fields (immutable snapshot)
    lockedCycleStart: expected.cycleStart,
    lockedOvulationDate: expected.breedDate,
    lockedDueDate: expected.birthDate,
    lockedPlacementStartDate: expected.placementStart,

    // Expected fields (mutable, can be updated)
    expectedCycleStart: expected.cycleStart,
    expectedBreedDate: expected.breedDate,
    expectedBirthDate: expected.birthDate,
    expectedWeaned: expected.weanedDate,           // ⚠️ No locked equivalent
    expectedPlacementStartDate: expected.placementStart,
    expectedPlacementCompletedDate: expected.placementCompleted,  // ⚠️ No locked equivalent
  };

  // Step 4: Persist to backend
  await api.updatePlan(Number(row.id), payload as any);
}
```

**RESULT:**
- Both `locked*` and `expected*` fields are set to SAME values at lock time
- But `expected*` fields can be updated later
- No protection prevents `expectedWeaned` and `expectedPlacementCompleted` from being overwritten

### When Displaying Dates (lines 844-851)

```typescript
/* Canonical expected timeline */
expectedBreedDate: p.lockedOvulationDate ?? null,  // Shows locked, not expected
expectedBirthDate: p.lockedDueDate ?? null,        // Shows locked, not expected
expectedWeaned: p.expectedWeaned ?? null,          // Shows expected (no locked equivalent)
```

**RESULT:**
- UI shows "expected" but displays "locked" for breed and birth dates
- User cannot distinguish between locked (immutable) and expected (recalculable)

---

## Scenarios & Risks

### Scenario 1: Breeder Locks Cycle, Then Changes Override

**Steps:**
1. Female dog has default 63-day cycle
2. Breeder locks cycle on 2026-01-15
   - `lockedDueDate` = 2026-03-19 (stored in DB)
   - `expectedBirthDate` = 2026-03-19 (stored in DB)
3. Breeder later sets override to 70 days
4. Breeder views the breeding plan

**EXPECTED BEHAVIOR (ideal):**
- "Locked Due Date": 2026-03-19 (original, immutable)
- "Expected Birth Date": 2026-03-26 (recalculated with new override)
- Clear distinction: locked = committed, expected = projected

**ACTUAL BEHAVIOR (current):**
- "Locked Due Date": 2026-03-19 (correct)
- "Expected Birth Date": 2026-03-19 (WRONG - shows locked, not recalculated)
- UI shows same date for both, creating confusion

**RISK:** Breeder doesn't realize their override change affects future projections, leading to mis-scheduled events.

### Scenario 2: Breeder Changes Override Multiple Times

**Steps:**
1. Lock cycle with default 63 days → birth date = 2026-03-19
2. Change override to 70 days
3. View What-If planner
4. Change override back to 63 days
5. View What-If planner again

**CURRENT BEHAVIOR:**
- What-If planner correctly updates projections with each override change ✅
- Locked dates remain unchanged in database ✅
- But main breeding plan UI still shows locked dates in "expected" fields ⚠️

**RISK:** Low - What-If planner works correctly, but main UI is confusing.

### Scenario 3: Weaned/Placement Dates May Be Lost

**Steps:**
1. Lock cycle → `expectedWeaned` = 2026-05-15
2. Some backend process updates the plan (e.g., status change, note added)
3. If update payload includes `expectedWeaned: null`, it could overwrite

**CURRENT SAFEGUARD:**
```typescript
// Lines 947-950: Backend logic
if (!b.hasOwnProperty("expectedBirthDate"))
  data.expectedBirthDate = lockNorm.lockedDueDate;
if (!b.hasOwnProperty("expectedPlacementStart"))
  data.expectedPlacementStart = lockNorm.lockedPlacementStartDate;
```

**PROBLEM:**
- No safeguard for `expectedWeaned` or `expectedPlacementCompleted`
- These can be overwritten if update payload includes them

**RISK:** Medium - Accidental data loss if expected dates are overwritten.

---

## Recommendations

### Priority 1: Fix Frontend Display Logic

**Change lines 844-851 to prioritize database expected values:**

```typescript
/* Canonical expected timeline */
expectedCycleStart: (p.expectedCycleStart ?? p.lockedCycleStart) ?? null,  // ✅ Already correct
expectedHormoneTestingStart: p.expectedHormoneTestingStart ?? null,         // ✅ Already correct
expectedBreedDate: (p.expectedBreedDate ?? p.lockedOvulationDate) ?? null, // ⚠️ FIX: Check expected first
expectedBirthDate: (p.expectedBirthDate ?? p.lockedDueDate) ?? null,       // ⚠️ FIX: Check expected first
expectedWeaned: p.expectedWeaned ?? null,                                   // ✅ Already correct
expectedPlacementStartDate: p.expectedPlacementStartDate ?? null,           // ✅ Already correct
expectedPlacementCompletedDate: (pickPlacementCompletedAny(p) as any) ?? null,  // ✅ Already correct
```

**WHY:**
- This allows "expected" dates to be recalculated and updated when override changes
- "Locked" dates remain immutable snapshots
- Clear distinction between committed (locked) vs projected (expected)

### Priority 2: Add Backend Safeguards for Weaned/Placement Dates

**Update backend logic (lines 947-950) to protect all expected dates:**

```typescript
if (lockNorm.lockedDueDate === null && lockNorm.lockedPlacementStartDate === null) {
  data.expectedBirthDate = null;
  data.expectedPlacementStart = null;
  data.expectedWeaned = null;  // ✅ Already protected
  data.expectedPlacementCompleted = null;  // ✅ Already protected
} else {
  if (!b.hasOwnProperty("expectedBirthDate"))
    data.expectedBirthDate = lockNorm.lockedDueDate;
  if (!b.hasOwnProperty("expectedPlacementStart"))
    data.expectedPlacementStart = lockNorm.lockedPlacementStartDate;
  if (!b.hasOwnProperty("expectedWeaned"))  // ⚠️ ADD THIS
    data.expectedWeaned = /* preserve existing value or recalculate from locked */;
  if (!b.hasOwnProperty("expectedPlacementCompleted"))  // ⚠️ ADD THIS
    data.expectedPlacementCompleted = /* preserve existing value or recalculate from locked */;
}
```

### Priority 3: Consider Adding Locked Fields for All Dates

**Database migration to add:**
```typescript
lockedWeanedDate: DateTime?
lockedPlacementCompletedDate: DateTime?
```

**PROS:**
- Complete immutable snapshot of all dates at lock time
- Easy to show "original" vs "current" projections
- Prevents accidental data loss

**CONS:**
- Database migration required
- More fields to maintain
- May be overkill if weaned/placement dates aren't critical to lock

### Priority 4: Add UI Indicators

**Show clear distinction in UI:**
```
┌─────────────────────────────────────┐
│ LOCKED (Original, Immutable)        │
├─────────────────────────────────────┤
│ Cycle Start:     2026-01-15  🔒     │
│ Ovulation:       2026-01-28  🔒     │
│ Due Date:        2026-03-19  🔒     │
│ Placement Start: 2026-05-15  🔒     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ EXPECTED (Current Projection)       │
├─────────────────────────────────────┤
│ Cycle Start:     2026-01-15         │
│ Breed Date:      2026-01-28         │
│ Birth Date:      2026-03-26  ⚠️     │  ← Changed due to override
│ Weaned:          2026-05-22  ⚠️     │  ← Changed due to override
│ Placement Start: 2026-05-15         │
│ Placement End:   2026-07-15         │
└─────────────────────────────────────┘
```

---

## Testing Plan

### Test 1: Verify Locked Dates Don't Change
1. Create breeding plan with default biology
2. Lock cycle on specific date
3. Record all locked dates
4. Change `femaleCycleLenOverrideDays` value
5. Reload breeding plan from API
6. **VERIFY:** All `locked*` fields are unchanged
7. **VERIFY:** Backend database values are unchanged

### Test 2: Verify Expected Dates DO Update (after fix)
1. Create breeding plan with default biology
2. Lock cycle on specific date
3. Record all expected dates
4. Change `femaleCycleLenOverrideDays` value
5. Trigger recalculation (unlock + relock, or explicit recalc)
6. **VERIFY:** `expected*` fields update to new projected dates
7. **VERIFY:** `locked*` fields remain unchanged

### Test 3: Verify UI Shows Correct Values
1. Create breeding plan
2. Lock cycle
3. Change override
4. **VERIFY:** "Locked" section shows original dates
5. **VERIFY:** "Expected" section shows recalculated dates (after fix)
6. **VERIFY:** Clear visual distinction between locked and expected

### Test 4: Verify Data Integrity on Updates
1. Create breeding plan
2. Lock cycle with weaned/placement dates
3. Perform various updates (add note, change status, etc.)
4. **VERIFY:** `expectedWeaned` and `expectedPlacementCompleted` not lost
5. **VERIFY:** Only intended fields are updated

---

## Conclusion

**Current State:**
- ✅ Backend correctly stores locked dates as immutable
- ✅ Backend does not recalculate locked dates on retrieval
- ⚠️ Frontend displays locked values in "expected" fields, hiding true expected values
- ⚠️ No locked snapshots for weaned/placement completed dates
- ⚠️ Potential for expected dates to be accidentally overwritten

**Recommendation:**
Implement **Priority 1 fix** immediately to correct the frontend display logic. This is a low-risk change that will:
- Show true expected dates that reflect current override
- Maintain locked dates as immutable reference
- Reduce user confusion

**Timeline:**
- Priority 1 (Frontend fix): **Immediate** - 30 minutes
- Priority 2 (Backend safeguards): **This week** - 1-2 hours
- Priority 3 (New locked fields): **Future consideration** - 4-6 hours including migration
- Priority 4 (UI improvements): **Next sprint** - 2-4 hours

---

**Analysis completed:** 2026-01-01
**Next step:** Implement Priority 1 fix and test
