# Engineer Implementation Prompt: Ovulation Anchor Breeding System

## Mission

Implement a species-aware dual anchor mode system for breeding cycle calculations that allows professional breeders to use ovulation-confirmed dates (via hormone testing) for higher accuracy predictions, while maintaining backward compatibility with cycle-start anchoring for all breeders.

**Priority:** HIGH - Core competitive advantage for platform
**Timeline:** Implement in phases 0-7 as specified
**Success Metric:** All 123 Playwright tests pass with zero failures

---

## Context: Why This Matters

Your breeder friend Rene identified that cycle-start anchor dates are inherently imprecise:
- **Current system:** Cycle start → 63±2-3 days to whelping
- **With ovulation testing:** Confirmed ovulation → 63±1 day to whelping
- **Impact:** Professional breeders using progesterone testing get MORE ACCURATE predictions

This is the **"heart and soul"** of the platform's competitive advantage. Every breeder should feel "they built this for ME!"

---

## What You're Building

### Core Feature: Progressive Enhancement

Users start with **cycle start** (always observable), then can **upgrade to ovulation anchor** when hormone test results arrive (day 5-14 of cycle). System intelligently uses the best available anchor while maintaining both dates for validation and machine learning.

### Species-Aware Approach

| Species | Primary Anchor | Testing Available? | Special Behavior |
|---------|---------------|-------------------|------------------|
| **DOG** | Cycle Start → Ovulation upgrade | Yes (progesterone) | Progressive enhancement |
| **HORSE** | Ovulation preferred | Yes (ultrasound) | Foaling milestones from ovulation |
| **CAT** | Breeding Date | N/A (induced ovulator) | Breeding = ovulation |
| **RABBIT** | Breeding Date | N/A (induced ovulator) | 0-day offset, 31-day gestation |
| **GOAT** | Cycle Start only | No | No ovulation option |
| **SHEEP** | Cycle Start only | No | Seasonal breeding notes |

---

## Your Complete Implementation Package

### 📋 Planning Documents (Read These First)

**Location:** `docs/plans/ovulation-anchor-breeding-system/`

1. **[00-implementation-plan.md](./00-implementation-plan.md)** - MASTER PLAN (2,000+ lines)
   - Read this FIRST - complete implementation with exact code
   - All 7 implementation phases with file paths and line numbers
   - Cross-cutting concerns (error handling, performance, audit, rollback, testing)

2. **[12-100-percent-completion-summary.md](./12-100-percent-completion-summary.md)** - Certification of readiness
   - All critical gaps resolved ✅
   - All major weaknesses addressed ✅
   - Implementation readiness checklist

3. **[13-comprehensive-playwright-test-plan.md](./13-comprehensive-playwright-test-plan.md)** - Testing strategy
   - 123 end-to-end tests using Playwright
   - Uses Hogwarts tenant (`hagrid.dev@hogwarts.local` / `Hogwarts123!`)
   - Automatic test data creation and cleanup

### 🎯 Implementation Phases (Do In Order)

#### Phase 0: Species Terminology Extension
- **File:** `packages/ui/src/utils/speciesTerminology.ts`
- **What:** Add 4 new fields to `SpeciesTerminology` interface
- **Why:** All anchor-related UI text becomes species-aware
- **Time:** 2-3 hours
- **Details:** Lines 68+ in implementation plan § 0.1

#### Phase 1: Database Schema Enhancement
- **Files:**
  - `breederhq-api/prisma/schema.prisma` (lines 3166+)
  - `breederhq-api/prisma/migrations/YYYYMMDD_add_anchor_mode.sql`
- **What:** Add 14 new fields + 5 enums to `BreedingPlan` model
- **Key Fields:**
  - `reproAnchorMode` (CYCLE_START | OVULATION | BREEDING_DATE)
  - `cycleStartObserved`, `ovulationConfirmed` (hybrid storage)
  - `actualOvulationOffset`, `varianceFromExpected` (ML tracking)
- **Immutability Matrix:** § 1.4 (defines what can change when)
- **Time:** 4-5 hours (including migration testing)
- **Details:** Implementation plan § 1.1-1.4

#### Phase 2: Calculation Engine Enhancement
- **File:** `packages/ui/src/utils/reproEngine/timelineFromSeed.ts`
- **What:** Add `buildTimelineFromOvulation()` function (line 140+)
- **What:** Add `getMilestoneAnchorDate()` helper in `apps/breeding/src/App-Breeding.tsx` (line 6980)
- **Why:** Milestones use priority logic: ovulation > breeding > expected
- **Time:** 4-5 hours
- **Details:** Implementation plan § 2.1-2.5

#### Phase 3: API Endpoint Updates
- **File:** `breederhq-api/src/routes/breeding.ts`
- **What:** Add 5 new endpoints/middleware:
  1. **Unified lock endpoint** (§ 3.4): `POST /breeding-plans/:id/lock`
  2. **Upgrade endpoint** (§ 3.4): `POST /breeding-plans/:id/upgrade-to-ovulation`
  3. **Immutability validation** (§ 3.5): `validateImmutability()` middleware
  4. **Offspring validation** (§ 3.6): `validateOffspringBirthDate()`
  5. **Waitlist recalculation** (§ 3.7): `recalculateWaitlistMatches()`
- **Time:** 8-10 hours (most complex phase)
- **Details:** Implementation plan § 3.1-3.7

#### Phase 4: UI/UX Updates
- **Files:**
  - `apps/breeding/src/App-Breeding.tsx` (breeding plan drawer)
  - `apps/breeding/src/adapters/planWindows.ts`
  - `apps/breeding/src/pages/planner/deriveBreedingStatus.ts` (line 141)
- **What:**
  - Add ovulation date field to Dates tab
  - Add "Upgrade to Ovulation" button (conditional visibility)
  - Update status derivation to accept ovulation OR cycle start
  - Update milestone handlers to use priority logic
- **Time:** 6-8 hours
- **Details:** Implementation plan § 4.1-4.7

#### Phase 5: Data Migration & Backfill
- **File:** Create migration script
- **What:** Backfill existing plans with `cycleStartObserved = lockedCycleStart`
- **Safety:** Idempotent (can run multiple times)
- **Time:** 2-3 hours
- **Details:** Implementation plan § 5.1-5.3

#### Phase 6: User Education & Documentation
- **What:** In-app guidance, tooltips, educational content
- **Time:** 3-4 hours
- **Details:** Implementation plan § 6.1-6.3

#### Phase 7: Educational Workflow Guidance
- **What:** Proactive breeding management features
- **Time:** 4-5 hours
- **Details:** Implementation plan § 7.1-7.3

---

## Critical Implementation Details

### 1. Immutability Rules (CRITICAL - Don't Break These!)

From implementation plan § 1.4:

| Field | PLANNING | COMMITTED | BRED | BIRTHED | WEANED+ |
|-------|----------|-----------|------|---------|---------|
| `reproAnchorMode` | ✅ Any | ⚠️ Upgrade only | ❌ Locked | ❌ Locked | ❌ Locked |
| `cycleStartObserved` | ✅ Any | ⚠️ ±3 days | ❌ Locked | ❌ Locked | ❌ Locked |
| `ovulationConfirmed` | ✅ Any | ⚠️ ±2 days | ❌ Locked | ❌ Locked | ❌ Locked |
| `breedDateActual` | N/A | ✅ Any | ⚠️ ±2 days | ❌ Locked | ❌ Locked |
| `birthDateActual` | N/A | N/A | ✅ Any | ❌ STRICT | ❌ STRICT |

**Validation middleware:** See § 3.5 for complete `validateImmutability()` code

### 2. Milestone Anchor Priority (CRITICAL for Horses!)

From implementation plan § 2.4:

```typescript
function getMilestoneAnchorDate(plan: PlanRow): Date | null {
  // Priority 1: Confirmed ovulation (highest accuracy)
  if (plan.ovulationConfirmed) return new Date(plan.ovulationConfirmed);

  // Priority 2: Actual breeding date
  if (plan.breedDateActual) return new Date(plan.breedDateActual);

  // Priority 3: Expected breeding
  if (plan.expectedBreedDate) return new Date(plan.expectedBreedDate);

  // Priority 4: Locked ovulation (legacy)
  if (plan.lockedOvulationDate) return new Date(plan.lockedOvulationDate);

  return null;
}
```

**Where to add:** `apps/breeding/src/App-Breeding.tsx` line ~6980
**What it fixes:** Foaling milestones broken for ovulation-anchored plans (Critical Gap #2)

### 3. Unified Lock Endpoint (CRITICAL - Prevents Data Inconsistencies!)

From implementation plan § 3.4:

**ONE endpoint replaces all lock methods:**

```typescript
POST /api/v1/breeding-plans/:id/lock
{
  "anchorMode": "CYCLE_START" | "OVULATION" | "BREEDING_DATE",
  "anchorDate": "2026-03-27",
  "confirmationMethod": "PROGESTERONE_TEST", // required for OVULATION
  "femaleCycleLenOverrideDays": 180 // optional
}
```

**Why this matters:** Prevents race conditions where both cycle and ovulation endpoints could be called on same plan.

### 4. Species-Specific UI Visibility

From implementation plan § 0.1:

- **DOG/HORSE:** Show ovulation upgrade option
- **CAT/RABBIT:** NO cycle start field (induced ovulators) - show "Breeding Date" instead
- **GOAT/SHEEP:** NO ovulation option (testing not available)

Use `getSpeciesTerminology(species).anchorMode.options` to determine what to show.

### 5. Offspring Validation Tolerances

From implementation plan § 3.6:

```typescript
const maxVariance = {
  OVULATION: 2,      // ±2 days (high confidence)
  CYCLE_START: 3,    // ±3 days (medium confidence)
  BREEDING_DATE: 3,  // ±3 days (medium confidence)
}[anchorMode];
```

**Why:** Ovulation-anchored plans have tighter birth predictions, so stricter validation.

### 6. Waitlist Recalculation Trigger

From implementation plan § 3.7:

**Trigger recalculation when placement window shifts >3 days:**

```typescript
const placementShift = Math.abs(
  (newPlacementDate.getTime() - oldPlacementDate.getTime()) / (1000 * 60 * 60 * 24)
);

if (placementShift > 3) {
  await recalculateWaitlistMatches(planId);
  // Sends customer notifications
  // Logs audit event
}
```

---

## Testing Requirements

### Playwright Test Suite

**Location:** `tests/e2e/breeding/specs/`

**Total Tests:** 123 comprehensive scenarios
**Test Account:** `hagrid.dev@hogwarts.local` / `Hogwarts123!`

**Run tests:**
```bash
# Full suite
npm run test:e2e:breeding

# Debug mode (see browser actions)
HEADLESS=false SLOW_MO=500 npm run test:e2e:breeding

# Specific phase
npm run test:e2e:breeding -- phase-3-upgrade-anchor
```

**Test Phases:**
1. Lock cycle start (18 tests)
2. Lock ovulation direct (12 tests)
3. Upgrade anchor (15 tests)
4. Immutability (12 tests)
5. Offspring validation (10 tests)
6. Waitlist recalculation (8 tests)
7. Foaling milestones (10 tests)
8. Species-specific (18 tests)
9. Edge cases (12 tests)
10. Migration (8 tests)

**ALL TESTS MUST PASS** before marking phase complete.

### Manual Testing Checklist

After Playwright tests pass, manually verify:

- [ ] Dog plan: Lock with cycle start, upgrade to ovulation
- [ ] Horse plan: Lock with ovulation, generate foaling milestones
- [ ] Cat plan: No cycle start shown, only breeding date
- [ ] Goat plan: No ovulation option shown
- [ ] Error messages user-friendly (not technical jargon)
- [ ] All dates recalculate correctly on upgrade
- [ ] Waitlist notifications sent when placement shifts
- [ ] Audit trail shows all anchor changes
- [ ] Screenshots on test failures contain useful debugging info

---

## Error Handling Patterns

From implementation plan "Cross-Cutting Concerns":

### 1. Optimistic UI Updates
```typescript
// Update UI immediately, rollback on API failure
setLocalPlan({ ...plan, reproAnchorMode: "OVULATION" });

api.upgradeToOvulation(planId, data)
  .then((result) => setLocalPlan(result.plan))
  .catch((error) => {
    setLocalPlan(previousPlan); // Rollback
    showErrorToast(error.message);
  });
```

### 2. User-Friendly Error Messages
```typescript
const ERROR_MESSAGES = {
  OVULATION_BEFORE_CYCLE: {
    title: "Invalid Ovulation Date",
    message: "Ovulation date must be after the cycle start date. Most dogs ovulate 10-14 days after heat begins.",
    suggestion: "Check your dates and try again. If you're certain, contact support."
  },
  // More in implementation plan...
};
```

### 3. Retry Logic for Transient Failures
```typescript
// Exponential backoff for 500-level errors
async function upgradeWithRetry(planId, data, maxRetries = 3) {
  // Implementation in plan...
}
```

---

## Performance Requirements

From implementation plan "Cross-Cutting Concerns":

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Single plan anchor upgrade | <500ms | <2s |
| Expected dates recalculation | <100ms | <500ms |
| Waitlist recalculation (per plan) | <1s | <3s |
| Foaling milestone generation | <200ms | <1s |
| Batch migration (100 plans) | <60s | <180s |

**How to achieve:**
- Database indexes on `reproAnchorMode`, `ovulationConfirmed` (§ Performance Optimization)
- Redis caching for anchor mode stats (1-hour TTL)
- Background jobs for batch operations (use queue)

---

## Feature Flags & Rollback

From implementation plan "Cross-Cutting Concerns":

### Feature Flags

```typescript
const FEATURE_FLAGS = {
  ovulation_anchor_enabled: true,           // Master killswitch
  ovulation_anchor_dogs: true,              // Species-specific
  ovulation_anchor_horses: true,
  ovulation_anchor_cats: false,             // Not ready yet
  ovulation_anchor_waitlist_recalc: true,   // Sub-feature
};
```

### Rollback Procedures

**Scenario 1: Emergency disable**
```bash
# Set feature flag
FEATURE_FLAGS.ovulation_anchor_enabled = false

# Existing ovulation plans remain, new plans use cycle-start only
```

**Scenario 2: Database rollback**
```sql
-- Only safe within 24 hours if no plans upgraded to OVULATION
-- See migration script for full rollback
```

**Scenario 3: Species-specific rollback**
```typescript
// Disable just horses if foaling milestones have issues
FEATURE_FLAGS.ovulation_anchor_horses = false
```

---

## Audit Trail Requirements

From implementation plan "Cross-Cutting Concerns":

**Every anchor change must create audit event:**

```typescript
await createAuditEvent({
  type: "ANCHOR_UPGRADED",
  planId: 123,
  userId: 456,
  timestamp: "2026-03-20T14:30:00Z",
  actor: { type: "USER", userId: 456, email: "rene@example.com" },
  changes: [
    { field: "reproAnchorMode", oldValue: "CYCLE_START", newValue: "OVULATION" },
    { field: "ovulationConfirmed", oldValue: null, newValue: "2026-03-27" }
  ],
  context: {
    planStatus: "COMMITTED",
    previousAnchorMode: "CYCLE_START",
    newAnchorMode: "OVULATION",
    reason: "user_entered_test_results"
  },
  cascadeEffects: {
    expectedDatesChanged: ["expectedBirthDate", "expectedWeaned"],
    waitlistEntriesAffected: 3,
    milestonesRecalculated: false
  }
});
```

**Event Types to Create:**
- `CYCLE_START_LOCKED`
- `OVULATION_LOCKED`
- `ANCHOR_UPGRADED`
- `OVULATION_CORRECTED`
- `WAITLIST_RECALCULATED`
- `MILESTONES_RECALCULATED`

---

## Common Pitfalls to Avoid

### ❌ DON'T:
1. **Break backward compatibility** - All existing plans must continue working
2. **Skip species validation** - Goats/sheep can't use ovulation anchor
3. **Forget cleanup in tests** - Must delete ALL test data (plans, offspring, waitlist, milestones)
4. **Use separate lock endpoints** - ONE unified endpoint prevents inconsistencies
5. **Hardcode "foaling" terminology** - Use `speciesTerminology.ts` for all labels
6. **Allow birth date changes** - Strictly immutable once set
7. **Skip audit events** - Every anchor change must be logged
8. **Guess at variance tolerance** - Use exact values: ±2 ovulation, ±3 cycle
9. **Ignore waitlist shifts >3 days** - Must recalculate and notify customers
10. **Cache anchor stats forever** - 1-hour TTL max

### ✅ DO:
1. **Read implementation plan first** - All answers are there
2. **Run Playwright tests frequently** - Catch regressions early
3. **Use database helpers in tests** - Guaranteed cleanup
4. **Screenshot on errors** - Helps debugging
5. **Test all 6 species** - Each has different behavior
6. **Verify immutability rules** - Critical for data integrity
7. **Check audit trail** - Every change should create event
8. **Test upgrade path** - Cycle → Ovulation most common flow
9. **Validate error messages** - Must be user-friendly
10. **Ask questions early** - Implementation plan is your friend

---

## File Modification Checklist

**Before you start coding, ensure you have:**

- [ ] Read [00-implementation-plan.md](./00-implementation-plan.md) sections for your phase
- [ ] Read [12-100-percent-completion-summary.md](./12-100-percent-completion-summary.md)
- [ ] Set up Playwright test environment with Hogwarts credentials
- [ ] Created feature branch: `feature/ovulation-anchor-system`
- [ ] Database backup created (in case rollback needed)

**Files You'll Modify:**

**Phase 0:**
- [ ] `packages/ui/src/utils/speciesTerminology.ts` (extend interface)

**Phase 1:**
- [ ] `breederhq-api/prisma/schema.prisma` (add fields + enums)
- [ ] Create migration SQL file

**Phase 2:**
- [ ] `packages/ui/src/utils/reproEngine/timelineFromSeed.ts` (add function)
- [ ] `packages/ui/src/utils/reproEngine/types.ts` (update types)
- [ ] `apps/breeding/src/App-Breeding.tsx` (add helper function)

**Phase 3:**
- [ ] `breederhq-api/src/routes/breeding.ts` (5 new endpoints/middleware)
- [ ] `breederhq-api/src/routes/waitlist.ts` (recalculation function)
- [ ] `breederhq-api/src/routes/offspring.ts` (validation function)
- [ ] `breederhq-api/src/routes/foaling.ts` (milestone generation update)

**Phase 4:**
- [ ] `apps/breeding/src/App-Breeding.tsx` (UI components)
- [ ] `apps/breeding/src/adapters/planWindows.ts` (adapter logic)
- [ ] `apps/breeding/src/pages/planner/deriveBreedingStatus.ts` (line 141)

**Phase 5:**
- [ ] Create migration script

**Testing:**
- [ ] `tests/e2e/breeding/specs/*.spec.ts` (10 test files)
- [ ] `tests/e2e/breeding/fixtures/*.ts` (fixtures)
- [ ] `tests/e2e/breeding/helpers/*.ts` (helpers)

---

## Definition of Done

**Phase is complete when:**

1. ✅ All code changes implemented per specification
2. ✅ All relevant Playwright tests passing (123 total)
3. ✅ Manual testing checklist verified
4. ✅ No console errors in browser
5. ✅ No database query errors in logs
6. ✅ All test data cleaned up (0 orphaned records)
7. ✅ Performance benchmarks met
8. ✅ Audit events created for all changes
9. ✅ Error messages user-friendly
10. ✅ Code reviewed by senior engineer
11. ✅ Documentation updated (if needed)
12. ✅ Feature flag strategy implemented

**Entire project is complete when:**

- ✅ All 7 phases complete
- ✅ All 123 Playwright tests passing
- ✅ Manual testing on all 6 species verified
- ✅ Performance requirements met
- ✅ Rollback procedures tested
- ✅ User acceptance testing passed (test with real breeder)

---

## Getting Help

**If you get stuck:**

1. **Check implementation plan** - Section references in this document point to exact code
2. **Review gap resolutions** - [11-critical-gaps-resolved.md](./11-critical-gaps-resolved.md) has detailed solutions
3. **Read test plan** - [13-comprehensive-playwright-test-plan.md](./13-comprehensive-playwright-test-plan.md) shows expected behavior
4. **Run tests in debug mode** - `HEADLESS=false SLOW_MO=1000 npm run test:e2e:breeding`
5. **Check database state** - Use Prisma Studio to verify data changes
6. **Review audit trail** - Check what events were created
7. **Ask specific questions** - Reference implementation plan section numbers

**Questions to ask:**

- ✅ "Implementation plan § 3.4 says to use unified endpoint, but should I also keep legacy endpoints for backward compatibility?"
- ✅ "Test phase-4-immutability.spec.ts is failing on line 87 - the error message doesn't match. Should I update the test or the code?"
- ❌ "How do I implement the ovulation anchor system?" (Too broad - read the plan first)

---

## Success Metrics

**How you'll know it's working:**

1. **Rene (your breeder friend) can:**
   - Create a dog breeding plan with cycle start
   - Enter progesterone test results 10 days later
   - Upgrade to ovulation anchor with one click
   - See variance analysis (on-time/early/late)
   - Get more accurate whelping date prediction

2. **Horse breeders can:**
   - Lock plan with ultrasound-confirmed ovulation
   - Generate 8 foaling milestones from ovulation (not breeding)
   - See HIGH confidence badge

3. **Cat/rabbit breeders:**
   - Never see confusing "cycle start" field
   - Only enter breeding date
   - UI explains "breeding triggers ovulation"

4. **All breeders:**
   - See species-appropriate terminology
   - Get clear, actionable error messages
   - Can't accidentally corrupt data (immutability enforced)
   - See audit trail of all changes

5. **Platform:**
   - All 123 tests passing
   - No data leaks from tests
   - Performance targets met
   - Feature flags enable safe rollback

---

## Final Checklist Before You Start

- [ ] I have read [00-implementation-plan.md](./00-implementation-plan.md) executive summary
- [ ] I understand the 7 implementation phases
- [ ] I know the 6 species have different behaviors
- [ ] I've reviewed the immutability matrix (§ 1.4)
- [ ] I've reviewed the critical gap resolutions
- [ ] I have access to Hogwarts test account (`hagrid.dev@hogwarts.local`)
- [ ] I can run Playwright tests locally
- [ ] I understand the rollback strategy
- [ ] I know where to find help (implementation plan section references)
- [ ] I'm ready to build something amazing! 🚀

---

**Document Version:** 1.0
**Created:** 2026-01-17
**Implementation Plan:** 100% Complete ✅
**Test Plan:** 123 tests ready ✅
**Status:** READY TO BUILD

**Go build this and make every breeder feel like "they built this for ME!"**

Good luck! 🎉
