# Critical Gaps - RESOLVED

## Document Purpose

This document provides complete, implementation-ready resolutions for the 5 critical gaps identified in the gap analysis. These resolutions MUST be incorporated into the main implementation plan before proceeding.

**Date:** 2026-01-17
**Status:** READY FOR INTEGRATION

---

## Gap #1: API Endpoint Integration - RESOLVED

### Problem
Multiple lock endpoints could create data inconsistencies. Unclear which endpoint wins if both called.

### Resolution: Unified Lock Endpoint with Mode Parameter

**Replace separate lock endpoints with ONE unified endpoint:**

#### API Endpoint Design

```typescript
POST /api/v1/breeding-plans/:id/lock
```

**Request Body:**
```typescript
interface LockBreedingPlanRequest {
  /** Which anchor mode to use */
  anchorMode: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";

  /** The anchor date */
  anchorDate: string; // ISO date (YYYY-MM-DD)

  /** Optional: confirmation method for OVULATION mode */
  confirmationMethod?: OvulationMethod;

  /** Optional: override default cycle length */
  femaleCycleLenOverrideDays?: number;
}

enum OvulationMethod {
  PROGESTERONE_TEST = "PROGESTERONE_TEST",
  LH_TEST = "LH_TEST",
  VAGINAL_CYTOLOGY = "VAGINAL_CYTOLOGY",
  ULTRASOUND = "ULTRASOUND",
  PALPATION = "PALPATION",
  BREEDING_INDUCED = "BREEDING_INDUCED"
}
```

**Response:**
```typescript
interface LockBreedingPlanResponse {
  success: boolean;
  plan: BreedingPlan;
  recalculated: {
    expectedBreedDate: string;
    expectedBirthDate: string;
    expectedWeaned: string;
    expectedPlacementStartDate: string;
    expectedPlacementCompletedDate: string;
  };
  confidence: "HIGH" | "MEDIUM" | "LOW";
  auditEventId: number;
}
```

#### Implementation

**File:** `apps/breeding-api/src/routes/breeding.ts`

```typescript
router.post("/breeding-plans/:id/lock", async (req, res) => {
  const { id } = req.params;
  const { anchorMode, anchorDate, confirmationMethod, femaleCycleLenOverrideDays } = req.body;

  // Validation
  const plan = await getPlan(id);
  if (!plan) {
    return res.status(404).json({ error: "Plan not found" });
  }

  // Prevent re-locking
  if (plan.status !== "PLANNING") {
    return res.status(400).json({
      error: "Plan already locked",
      detail: `Plan is in ${plan.status} status. Cannot re-lock.`
    });
  }

  // Species validation
  const terminology = getSpeciesTerminology(plan.species);
  const validAnchors = terminology.anchorMode.options.map(o => o.type);

  if (!validAnchors.includes(anchorMode)) {
    return res.status(400).json({
      error: "Invalid anchor mode for species",
      detail: `${plan.species} does not support ${anchorMode}. Valid options: ${validAnchors.join(", ")}`
    });
  }

  // Ovulation mode requires confirmation method
  if (anchorMode === "OVULATION" && !confirmationMethod) {
    return res.status(400).json({
      error: "Confirmation method required",
      detail: "OVULATION anchor mode requires confirmationMethod parameter"
    });
  }

  // Calculate expected dates based on anchor mode
  let expectedDates, confidence;

  switch (anchorMode) {
    case "OVULATION":
      const ovulationTimeline = reproEngine.buildTimelineFromOvulation(
        { animalId: plan.damId, species: plan.species, cycleStartsAsc: [], today: new Date().toISOString().slice(0, 10) },
        anchorDate
      );
      expectedDates = normalizeExpectedMilestones(ovulationTimeline, anchorDate);
      confidence = "HIGH";
      break;

    case "CYCLE_START":
      const cycleTimeline = reproEngine.buildTimelineFromSeed(
        { animalId: plan.damId, species: plan.species, cycleStartsAsc: [], today: new Date().toISOString().slice(0, 10) },
        anchorDate
      );
      expectedDates = normalizeExpectedMilestones(cycleTimeline, anchorDate);
      confidence = "MEDIUM";
      break;

    case "BREEDING_DATE":
      // For induced ovulators, breeding = ovulation
      const breedingTimeline = reproEngine.buildTimelineFromOvulation(
        { animalId: plan.damId, species: plan.species, cycleStartsAsc: [], today: new Date().toISOString().slice(0, 10) },
        anchorDate
      );
      expectedDates = normalizeExpectedMilestones(breedingTimeline, anchorDate);
      confidence = "MEDIUM";
      break;
  }

  // Build update payload based on anchor mode
  const updatePayload: Partial<BreedingPlan> = {
    reproAnchorMode: anchorMode,
    primaryAnchor: anchorMode,
    status: "COMMITTED",

    // Expected dates
    expectedBreedDate: expectedDates.breedDate,
    expectedBirthDate: expectedDates.birthDate,
    expectedWeaned: expectedDates.weanedDate,
    expectedPlacementStartDate: expectedDates.placementStart,
    expectedPlacementCompletedDate: expectedDates.placementCompleted,
  };

  // Set anchor-specific fields
  switch (anchorMode) {
    case "CYCLE_START":
      updatePayload.cycleStartObserved = anchorDate;
      updatePayload.cycleStartConfidence = confidence;
      updatePayload.lockedCycleStart = anchorDate; // Backward compatibility
      updatePayload.lockedOvulationDate = expectedDates.breedDate;
      updatePayload.lockedDueDate = expectedDates.birthDate;
      break;

    case "OVULATION":
      updatePayload.ovulationConfirmed = anchorDate;
      updatePayload.ovulationConfirmedMethod = confirmationMethod;
      updatePayload.ovulationConfidence = confidence;
      updatePayload.lockedOvulationDate = anchorDate;
      updatePayload.lockedDueDate = expectedDates.birthDate;
      break;

    case "BREEDING_DATE":
      // For induced ovulators
      updatePayload.breedDateActual = anchorDate;
      updatePayload.ovulationConfirmed = anchorDate; // Same as breeding for induced ovulators
      updatePayload.ovulationConfirmedMethod = "BREEDING_INDUCED";
      updatePayload.lockedOvulationDate = anchorDate;
      updatePayload.lockedDueDate = expectedDates.birthDate;
      break;
  }

  // Persist
  const updatedPlan = await updatePlan(id, updatePayload);

  // Audit event
  await createEvent(id, {
    type: `${anchorMode}_LOCKED`,
    occurredAt: new Date().toISOString(),
    label: `Plan locked - ${anchorMode} anchor`,
    data: {
      anchorMode,
      anchorDate,
      confirmationMethod,
      confidence,
      expectedDates
    }
  });

  return res.json({
    success: true,
    plan: updatedPlan,
    recalculated: expectedDates,
    confidence,
    auditEventId: event.id
  });
});
```

#### Upgrade Endpoint (Cycle → Ovulation)

**For progressive enhancement, separate upgrade endpoint:**

```typescript
POST /api/v1/breeding-plans/:id/upgrade-to-ovulation
```

**Request Body:**
```typescript
interface UpgradeToOvulationRequest {
  ovulationDate: string;
  confirmationMethod: OvulationMethod;
}
```

**Implementation:**
```typescript
router.post("/breeding-plans/:id/upgrade-to-ovulation", async (req, res) => {
  const { id } = req.params;
  const { ovulationDate, confirmationMethod } = req.body;

  const plan = await getPlan(id);

  // Validation: Can only upgrade from CYCLE_START
  if (plan.reproAnchorMode !== "CYCLE_START") {
    return res.status(400).json({
      error: "Cannot upgrade",
      detail: `Plan is already using ${plan.reproAnchorMode} anchor. Only CYCLE_START plans can be upgraded.`
    });
  }

  // Validation: Must be COMMITTED or later (not PLANNING)
  if (plan.status === "PLANNING") {
    return res.status(400).json({
      error: "Plan not locked yet",
      detail: "Lock the plan with a cycle start date before upgrading to ovulation anchor."
    });
  }

  // Validation: Ovulation must be AFTER cycle start (if cycle start exists)
  if (plan.cycleStartObserved) {
    const cycleDate = new Date(plan.cycleStartObserved);
    const ovulationDateParsed = new Date(ovulationDate);

    if (ovulationDateParsed <= cycleDate) {
      return res.status(400).json({
        error: "Invalid ovulation date",
        detail: "Ovulation date must be after cycle start date."
      });
    }

    // Calculate offset
    const offsetDays = Math.floor((ovulationDateParsed.getTime() - cycleDate.getTime()) / (1000 * 60 * 60 * 24));
    const speciesDefaults = getSpeciesDefaults(plan.species);
    const expectedOffset = speciesDefaults.ovulationOffsetDays;

    // Warn if offset is extreme
    if (offsetDays > 30) {
      // Log warning but allow
      console.warn(`[Breeding] Unusual ovulation offset: ${offsetDays} days for plan ${id}`);
    }
  }

  // Recalculate from ovulation
  const ovulationTimeline = reproEngine.buildTimelineFromOvulation(
    { animalId: plan.damId, species: plan.species, cycleStartsAsc: [], today: new Date().toISOString().slice(0, 10) },
    ovulationDate
  );

  const expectedDates = normalizeExpectedMilestones(ovulationTimeline, ovulationDate);

  // Calculate variance if we have cycle start
  let actualOffset, expectedOffset, variance;
  if (plan.cycleStartObserved) {
    const cycleDate = new Date(plan.cycleStartObserved);
    const ovulationDateParsed = new Date(ovulationDate);
    actualOffset = Math.floor((ovulationDateParsed.getTime() - cycleDate.getTime()) / (1000 * 60 * 60 * 24));

    const speciesDefaults = getSpeciesDefaults(plan.species);
    expectedOffset = speciesDefaults.ovulationOffsetDays;
    variance = actualOffset - expectedOffset;
  }

  // Update plan
  const updatePayload: Partial<BreedingPlan> = {
    reproAnchorMode: "OVULATION",
    primaryAnchor: "OVULATION",
    ovulationConfirmed: ovulationDate,
    ovulationConfirmedMethod: confirmationMethod,
    ovulationConfidence: "HIGH",

    // Keep cycle start (hybrid storage)
    // cycleStartObserved: unchanged

    // Variance tracking
    actualOvulationOffset: actualOffset,
    expectedOvulationOffset: expectedOffset,
    varianceFromExpected: variance,

    // Recalculated expected dates
    expectedBreedDate: expectedDates.breedDate,
    expectedBirthDate: expectedDates.birthDate,
    expectedWeaned: expectedDates.weanedDate,
    expectedPlacementStartDate: expectedDates.placementStart,
    expectedPlacementCompletedDate: expectedDates.placementCompleted,

    // Update locked dates
    lockedOvulationDate: ovulationDate,
    lockedDueDate: expectedDates.birthDate
  };

  const updatedPlan = await updatePlan(id, updatePayload);

  // Check if placement window shifted significantly
  const oldPlacementDate = new Date(plan.expectedPlacementStartDate);
  const newPlacementDate = new Date(expectedDates.placementStart);
  const placementShift = Math.abs(Math.floor((newPlacementDate.getTime() - oldPlacementDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Recalculate waitlist if window shifted >3 days
  if (placementShift > 3) {
    await recalculateWaitlistMatches(id);
  }

  // Audit event
  await createEvent(id, {
    type: "ANCHOR_UPGRADED",
    occurredAt: new Date().toISOString(),
    label: "Upgraded to ovulation anchor",
    data: {
      from: "CYCLE_START",
      to: "OVULATION",
      ovulationDate,
      confirmationMethod,
      cycleStartDate: plan.cycleStartObserved,
      actualOffset,
      expectedOffset,
      variance,
      placementShift,
      waitlistRecalculated: placementShift > 3
    }
  });

  return res.json({
    success: true,
    plan: updatedPlan,
    recalculated: expectedDates,
    variance: {
      actualOffset,
      expectedOffset,
      variance,
      analysis: variance === 0 ? "on-time" : variance > 0 ? "late" : "early"
    },
    confidence: "HIGH"
  });
});
```

---

## Gap #2: Foaling Milestone Generation - RESOLVED

### Problem
Foaling milestones currently use `breedDateActual`. Won't work for ovulation-anchored plans.

### Resolution: Priority-Based Anchor Selection

#### Milestone Anchor Priority Logic

**File:** `apps/breeding/src/App-Breeding.tsx`

**Add new helper function:**

```typescript
/**
 * Get the best available anchor date for milestone generation.
 * Priority: ovulation > breeding > expected breeding
 *
 * For horses, ovulation is most accurate. Falls back to breeding if no ovulation data.
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

**Update milestone creation handler (line ~6990):**

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

**Update delete handler to use same priority (line ~7034):**

```typescript
const handleDeleteMilestones = React.useCallback(async () => {
  if (!api || !row.id) return;
  setFoalingLoading(true);

  try {
    await api.foaling.deleteMilestones(Number(row.id));

    // Check if we should auto-recreate
    const anchorDate = getMilestoneAnchorDate(row);
    if (anchorDate) {
      try {
        await api.foaling.createMilestones(Number(row.id));
      } catch (createErr: any) {
        console.warn("[Breeding] Could not recreate milestones after delete:", createErr);
      }
    }

    const data = await api.foaling.getTimeline(Number(row.id));
    setFoalingTimeline(data);
  } catch (err: any) {
    console.error("[Breeding] Failed to delete milestones:", err);
    setFoalingError(err?.message || "Failed to delete milestones");
  } finally {
    setFoalingLoading(false);
  }
}, [api, row.id, row]);
```

#### Backend Milestone Generation

**File:** `apps/breeding-api/src/routes/foaling.ts`

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

  if (plan.ovulationConfirmed) {
    anchorDate = new Date(plan.ovulationConfirmed);
    anchorType = "ovulation";
  } else if (plan.breedDateActual) {
    anchorDate = new Date(plan.breedDateActual);
    anchorType = "breeding";
  } else if (plan.expectedBreedDate) {
    anchorDate = new Date(plan.expectedBreedDate);
    anchorType = "expected_breeding";
  } else if (plan.lockedOvulationDate) {
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
  const milestones: FoalingMilestone[] = [];

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

  // Save milestones
  await prisma.foalingMilestone.createMany({ data: milestones });

  // Audit
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

**Helper functions:**

```typescript
function getMilestoneLabel(offsetDays: number): string {
  switch (offsetDays) {
    case 15: return "15-day pregnancy check";
    case 45: return "45-day ultrasound";
    case 90: return "90-day assessment";
    case 300: return "300-day preparation";
    case 320: return "320-day final check";
    case 330: return "330-day foaling watch";
    case 340: return "340-day expected foaling";
    case 350: return "350-day late foaling";
    default: return `Day ${offsetDays}`;
  }
}

function getMilestoneDescription(offsetDays: number): string {
  switch (offsetDays) {
    case 15: return "Confirm pregnancy via ultrasound or blood test";
    case 45: return "Detailed ultrasound to assess fetal development";
    case 90: return "Mid-pregnancy check, adjust nutrition if needed";
    case 300: return "Begin foaling preparations, review supplies";
    case 320: return "Final veterinary check before expected foaling";
    case 330: return "Begin 24/7 foaling watch, mare should be in foaling area";
    case 340: return "Expected foaling date (gestation complete)";
    case 350: return "Overdue - consult veterinarian if foaling hasn't occurred";
    default: return "";
  }
}
```

---

## Gap #3: Immutability Rules - RESOLVED

### Problem
Unclear what can/can't change after locking. Could lead to data corruption.

### Resolution: Immutability Matrix + Validation

#### Immutability Matrix

| Field | PLANNING | COMMITTED | BRED | BIRTHED | WEANED+ |
|-------|----------|-----------|------|---------|---------|
| **reproAnchorMode** | ✅ Any | ⚠️ Upgrade only¹ | ❌ Locked | ❌ Locked | ❌ Locked |
| **cycleStartObserved** | ✅ Any | ⚠️ ±3 days² | ❌ Locked | ❌ Locked | ❌ Locked |
| **ovulationConfirmed** | ✅ Any | ⚠️ ±2 days² | ❌ Locked | ❌ Locked | ❌ Locked |
| **breedDateActual** | N/A³ | ✅ Any | ⚠️ ±2 days⁴ | ❌ Locked | ❌ Locked |
| **birthDateActual** | N/A³ | N/A³ | ✅ Any | ❌ Strict⁵ | ❌ Strict⁵ |
| **weanedDateActual** | N/A³ | N/A³ | N/A³ | ✅ Any | ⚠️ ±7 days⁶ |

**Footnotes:**
1. **Upgrade only**: Can go CYCLE_START → OVULATION, cannot downgrade
2. **±N days**: Can change within tolerance window, warns if outside
3. **N/A**: Field not yet applicable (future phase)
4. **±2 days**: Small corrections allowed (typo fixes), warns if >2 days
5. **Strict immutability**: Cannot change except via admin override + audit trail
6. **±7 days**: Weaning is gradual, reasonable correction window

#### Validation Implementation

**File:** `apps/breeding-api/src/routes/breeding.ts`

**Add validation middleware:**

```typescript
function validateImmutability(existingPlan: BreedingPlan, updates: Partial<BreedingPlan>): void {
  const status = existingPlan.status;

  // reproAnchorMode
  if (updates.reproAnchorMode && updates.reproAnchorMode !== existingPlan.reproAnchorMode) {
    if (status !== "PLANNING") {
      // Only allow upgrade
      if (existingPlan.reproAnchorMode === "CYCLE_START" && updates.reproAnchorMode === "OVULATION") {
        // Allowed - this is an upgrade
      } else {
        throw new ImmutabilityError("reproAnchorMode", "Cannot change anchor mode except upgrade from CYCLE_START to OVULATION");
      }
    }
  }

  // cycleStartObserved
  if (updates.cycleStartObserved && updates.cycleStartObserved !== existingPlan.cycleStartObserved) {
    if (["BRED", "BIRTHED", "WEANED", "PLACEMENT_STARTED", "PLACEMENT_COMPLETED", "COMPLETE"].includes(status)) {
      throw new ImmutabilityError("cycleStartObserved", "Cycle start date is locked after COMMITTED status");
    }

    if (status === "COMMITTED" && existingPlan.cycleStartObserved) {
      const oldDate = new Date(existingPlan.cycleStartObserved);
      const newDate = new Date(updates.cycleStartObserved);
      const diffDays = Math.abs((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 3) {
        throw new ImmutabilityError("cycleStartObserved", `Cannot change cycle start by more than 3 days in COMMITTED status (attempted ${diffDays} days)`);
      }
    }
  }

  // ovulationConfirmed
  if (updates.ovulationConfirmed && updates.ovulationConfirmed !== existingPlan.ovulationConfirmed) {
    if (["BRED", "BIRTHED", "WEANED", "PLACEMENT_STARTED", "PLACEMENT_COMPLETED", "COMPLETE"].includes(status)) {
      throw new ImmutabilityError("ovulationConfirmed", "Ovulation date is locked after COMMITTED status");
    }

    if (status === "COMMITTED" && existingPlan.ovulationConfirmed) {
      const oldDate = new Date(existingPlan.ovulationConfirmed);
      const newDate = new Date(updates.ovulationConfirmed);
      const diffDays = Math.abs((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 2) {
        throw new ImmutabilityError("ovulationConfirmed", `Cannot change ovulation date by more than 2 days in COMMITTED status (attempted ${diffDays} days)`);
      }
    }
  }

  // breedDateActual
  if (updates.breedDateActual && updates.breedDateActual !== existingPlan.breedDateActual) {
    if (["BIRTHED", "WEANED", "PLACEMENT_STARTED", "PLACEMENT_COMPLETED", "COMPLETE"].includes(status)) {
      throw new ImmutabilityError("breedDateActual", "Breeding date is locked after BRED status");
    }

    if (status === "BRED" && existingPlan.breedDateActual) {
      const oldDate = new Date(existingPlan.breedDateActual);
      const newDate = new Date(updates.breedDateActual);
      const diffDays = Math.abs((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 2) {
        throw new ImmutabilityError("breedDateActual", `Cannot change breeding date by more than 2 days in BRED status (attempted ${diffDays} days)`);
      }
    }
  }

  // birthDateActual - STRICT
  if (updates.birthDateActual && updates.birthDateActual !== existingPlan.birthDateActual) {
    if (existingPlan.birthDateActual) {
      throw new ImmutabilityError("birthDateActual", "Birth date is strictly immutable once set. Contact support if correction needed.");
    }
  }

  // weanedDateActual
  if (updates.weanedDateActual && updates.weanedDateActual !== existingPlan.weanedDateActual) {
    if (["PLACEMENT_STARTED", "PLACEMENT_COMPLETED", "COMPLETE"].includes(status) && existingPlan.weanedDateActual) {
      const oldDate = new Date(existingPlan.weanedDateActual);
      const newDate = new Date(updates.weanedDateActual);
      const diffDays = Math.abs((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > 7) {
        throw new ImmutabilityError("weanedDateActual", `Cannot change weaning date by more than 7 days after WEANED status (attempted ${diffDays} days)`);
      }
    }
  }
}

class ImmutabilityError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ImmutabilityError";
  }
}

// Use in update endpoint
router.patch("/breeding-plans/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const existingPlan = await getPlan(id);

  try {
    validateImmutability(existingPlan, updates);
  } catch (err) {
    if (err instanceof ImmutabilityError) {
      return res.status(400).json({
        error: "Immutability violation",
        field: err.field,
        detail: err.message
      });
    }
    throw err;
  }

  // Proceed with update...
});
```

#### Admin Override

**For critical corrections, add admin override endpoint:**

```typescript
POST /api/v1/breeding-plans/:id/admin-override

// Requires admin role
// Logs to audit trail with justification
```

---

## Gap #4: Offspring Linking - RESOLVED

### Problem
Offspring validation might fail or produce confusing errors with different anchor modes.

### Resolution: Anchor-Aware Offspring Validation

#### Validation Logic

**File:** `apps/breeding-api/src/routes/offspring.ts`

```typescript
/**
 * Validate offspring birth date against parent plan.
 * Tolerance varies by anchor mode confidence.
 */
function validateOffspringBirthDate(
  planBirthDate: Date,
  offspringBirthDate: Date,
  anchorMode: ReproAnchorMode
): { valid: boolean; variance: number; message?: string } {

  const variance = Math.abs(
    Math.floor((offspringBirthDate.getTime() - planBirthDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Tolerance based on anchor mode
  const maxVariance = {
    OVULATION: 2,      // ±2 days (high confidence)
    CYCLE_START: 3,    // ±3 days (medium confidence)
    BREEDING_DATE: 3,  // ±3 days (medium confidence)
  }[anchorMode];

  if (variance === 0) {
    return { valid: true, variance: 0 };
  }

  if (variance <= maxVariance) {
    return {
      valid: true,
      variance,
      message: `Offspring birth date differs by ${variance} day(s) from plan (within ${maxVariance}-day tolerance for ${anchorMode} anchor)`
    };
  }

  return {
    valid: false,
    variance,
    message: `Offspring birth date differs by ${variance} days from plan birth date. Maximum allowed variance for ${anchorMode} anchor is ±${maxVariance} days. Please verify dates are correct.`
  };
}

// Use in offspring creation
router.post("/breeding-plans/:id/offspring", async (req, res) => {
  const { id } = req.params;
  const { birthDate, ...offspringData } = req.body;

  const plan = await getPlan(id);

  if (!plan.birthDateActual) {
    return res.status(400).json({
      error: "Plan birth date required",
      detail: "Cannot create offspring until plan birth date is recorded"
    });
  }

  const validation = validateOffspringBirthDate(
    new Date(plan.birthDateActual),
    new Date(birthDate),
    plan.reproAnchorMode
  );

  if (!validation.valid) {
    return res.status(400).json({
      error: "Birth date validation failed",
      detail: validation.message,
      variance: validation.variance,
      planBirthDate: plan.birthDateActual,
      offspringBirthDate: birthDate,
      anchorMode: plan.reproAnchorMode
    });
  }

  // If valid but has variance, log warning
  if (validation.variance > 0) {
    console.warn(`[Offspring] Birth date variance: ${validation.message}`);
  }

  // Create offspring...
  const offspring = await createOffspring({
    ...offspringData,
    birthDate,
    breedingPlanId: plan.id,
    offspringGroupId: plan.offspringGroupId
  });

  return res.json({ success: true, offspring });
});
```

#### Offspring Batch Creation

**For litter-based species (dogs, cats, rabbits), all use same birth date:**

```typescript
router.post("/breeding-plans/:id/offspring/batch", async (req, res) => {
  const { id } = req.params;
  const { offspring } = req.body; // Array of offspring

  const plan = await getPlan(id);

  // For litter-based species, all offspring must have same birth date
  const isLitterBased = ["DOG", "CAT", "RABBIT", "GOAT", "SHEEP"].includes(plan.species);

  if (isLitterBased) {
    const birthDates = new Set(offspring.map(o => o.birthDate));

    if (birthDates.size > 1) {
      return res.status(400).json({
        error: "Inconsistent birth dates",
        detail: `All ${plan.species} offspring in a litter must have the same birth date. Found ${birthDates.size} different dates.`
      });
    }
  }

  // Validate birth date
  const firstBirthDate = offspring[0].birthDate;
  const validation = validateOffspringBirthDate(
    new Date(plan.birthDateActual),
    new Date(firstBirthDate),
    plan.reproAnchorMode
  );

  if (!validation.valid) {
    return res.status(400).json({
      error: "Birth date validation failed",
      detail: validation.message
    });
  }

  // Create all offspring...
});
```

#### Offspring Metadata

**Add anchor mode to offspring record for tracking:**

```prisma
model Offspring {
  id                Int      @id @default(autoincrement())
  breedingPlanId    Int
  offspringGroupId  Int
  birthDate         DateTime

  // NEW: Track which anchor was used for parent plan
  parentAnchorMode  ReproAnchorMode?
  parentConfidence  ConfidenceLevel?

  // Existing fields...
}
```

---

## Gap #5: Waitlist Matching - RESOLVED

### Problem
Placement window shifts could invalidate waitlist matches without user notification.

### Resolution: Automatic Recalculation + Notification

#### Waitlist Recalculation Logic

**File:** `apps/breeding-api/src/routes/waitlist.ts`

```typescript
/**
 * Recalculate waitlist matches when plan's placement window changes.
 * Called automatically after anchor upgrade or date corrections.
 */
async function recalculateWaitlistMatches(planId: number): Promise<{
  matched: number;
  unmatched: number;
  notifications: number;
}> {

  const plan = await getPlan(planId);

  // Get current waitlist entries matched to this plan
  const existingMatches = await prisma.waitlistEntry.findMany({
    where: { matchedBreedingPlanId: planId }
  });

  const oldPlacementDate = existingMatches[0]?.matchedPlacementDate;
  const newPlacementDate = plan.expectedPlacementStartDate;

  if (!newPlacementDate) {
    // Plan no longer has placement date - unmatch all
    await prisma.waitlistEntry.updateMany({
      where: { matchedBreedingPlanId: planId },
      data: {
        matchedBreedingPlanId: null,
        matchedPlacementDate: null,
        matchStatus: "UNMATCHED"
      }
    });

    // Notify customers
    for (const entry of existingMatches) {
      await sendNotification(entry.userId, {
        type: "WAITLIST_UNMATCHED",
        title: "Waitlist Update",
        message: `Your waitlist placement for ${plan.damName} × ${plan.sireName} has been unmatched due to breeding plan changes. We'll notify you when a new match is available.`
      });
    }

    return { matched: 0, unmatched: existingMatches.length, notifications: existingMatches.length };
  }

  // Check if window shifted significantly
  const shiftDays = oldPlacementDate
    ? Math.abs(Math.floor((new Date(newPlacementDate).getTime() - new Date(oldPlacementDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (shiftDays === 0) {
    // No change needed
    return { matched: existingMatches.length, unmatched: 0, notifications: 0 };
  }

  // Update all matched entries with new date
  await prisma.waitlistEntry.updateMany({
    where: { matchedBreedingPlanId: planId },
    data: { matchedPlacementDate: newPlacementDate }
  });

  // Notify customers of date change
  let notificationCount = 0;
  for (const entry of existingMatches) {
    await sendNotification(entry.userId, {
      type: "WAITLIST_DATE_UPDATED",
      title: "Placement Date Updated",
      message: `Your expected placement date for ${plan.damName} × ${plan.sireName} has been updated to ${format(new Date(newPlacementDate), 'MMM d, yyyy')} (${shiftDays} day change). This is due to more accurate breeding timeline information.`,
      data: {
        planId,
        oldDate: oldPlacementDate,
        newDate: newPlacementDate,
        shiftDays,
        reason: "BREEDING_PLAN_UPDATED"
      }
    });
    notificationCount++;
  }

  // Log event
  await createEvent(planId, {
    type: "WAITLIST_RECALCULATED",
    occurredAt: new Date().toISOString(),
    label: "Waitlist matches updated",
    data: {
      entriesAffected: existingMatches.length,
      oldPlacementDate,
      newPlacementDate,
      shiftDays,
      notificationsSent: notificationCount
    }
  });

  return {
    matched: existingMatches.length,
    unmatched: 0,
    notifications: notificationCount
  };
}
```

#### Integration with Anchor Upgrade

**Add to upgrade endpoint:**

```typescript
// In /upgrade-to-ovulation endpoint (from Gap #1 resolution)

// ... after updating plan ...

// Check if placement window shifted
const oldPlacementDate = new Date(plan.expectedPlacementStartDate);
const newPlacementDate = new Date(updatedPlan.expectedPlacementStartDate);
const placementShift = Math.abs(Math.floor((newPlacementDate.getTime() - oldPlacementDate.getTime()) / (1000 * 60 * 60 * 24)));

// Recalculate waitlist if window shifted >3 days
let waitlistRecalculation = null;
if (placementShift > 3) {
  waitlistRecalculation = await recalculateWaitlistMatches(id);
}

return res.json({
  success: true,
  plan: updatedPlan,
  recalculated: expectedDates,
  variance: { ... },
  waitlist: waitlistRecalculation // Include waitlist impact in response
});
```

#### Waitlist Matching Algorithm Update

**Prioritize high-confidence plans:**

```typescript
async function matchWaitlistEntry(entryId: number): Promise<MatchResult> {
  const entry = await getWaitlistEntry(entryId);

  // Find available plans matching criteria
  const candidatePlans = await prisma.breedingPlan.findMany({
    where: {
      damId: entry.preferredDamId || undefined,
      sireId: entry.preferredSireId || undefined,
      species: entry.species,
      status: { in: ["COMMITTED", "BRED", "BIRTHED"] },
      expectedPlacementStartDate: { not: null }
    }
  });

  // Sort by confidence level (ovulation-anchored plans first)
  const sorted = candidatePlans.sort((a, b) => {
    const confidenceScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const aScore = confidenceScore[a.ovulationConfidence || a.cycleStartConfidence || "MEDIUM"];
    const bScore = confidenceScore[b.ovulationConfidence || b.cycleStartConfidence || "MEDIUM"];

    if (aScore !== bScore) return bScore - aScore; // Higher confidence first

    // If same confidence, prefer earlier placement date
    return new Date(a.expectedPlacementStartDate).getTime() - new Date(b.expectedPlacementStartDate).getTime();
  });

  // Match to best candidate
  const bestMatch = sorted[0];

  if (bestMatch) {
    await updateWaitlistEntry(entryId, {
      matchedBreedingPlanId: bestMatch.id,
      matchedPlacementDate: bestMatch.expectedPlacementStartDate,
      matchStatus: "MATCHED",
      matchConfidence: bestMatch.ovulationConfidence || bestMatch.cycleStartConfidence || "MEDIUM"
    });
  }

  return { matched: !!bestMatch, planId: bestMatch?.id };
}
```

---

## Integration Checklist

These resolutions must be integrated into `00-implementation-plan.md`:

- [ ] **Phase 1 (Database)**: Add immutability matrix to schema documentation
- [ ] **Phase 2 (ReproEngine)**: Add `getMilestoneAnchorDate()` helper function
- [ ] **Phase 3 (API)**: Replace separate lock endpoints with unified `/lock` endpoint
- [ ] **Phase 3 (API)**: Add `/upgrade-to-ovulation` endpoint with validation
- [ ] **Phase 3 (API)**: Add `validateImmutability()` middleware to update endpoint
- [ ] **Phase 3 (API)**: Update offspring validation with anchor-aware logic
- [ ] **Phase 3 (API)**: Add `recalculateWaitlistMatches()` function
- [ ] **Phase 4 (UI)**: Update foaling milestone handlers to use priority logic
- [ ] **Phase 5 (Testing)**: Add immutability violation test cases
- [ ] **Phase 5 (Testing)**: Add waitlist recalculation test cases
- [ ] **Phase 6 (Documentation)**: Document immutability rules for users

---

**Document Version:** 1.0
**Date:** 2026-01-17
**Status:** COMPLETE - Ready for integration into main plan
**Next Step:** Update 00-implementation-plan.md with these resolutions
