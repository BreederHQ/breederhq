# Breeding Plan Lifecycle

## Overview

A breeding plan progresses through 8 distinct phases from initial conception through offspring placement. Each phase has specific requirements and unlocks subsequent actions.

## Phase Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BREEDING PLAN LIFECYCLE                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  ┌─────────┐   ┌──────────┐   ┌──────┐   ┌─────────┐   ┌────────┐   ┌───────────┐   ┌──────────────┐   ┌──────────┐
  │PLANNING │──▶│COMMITTED │──▶│ BRED │──▶│ BIRTHED │──▶│ WEANED │──▶│PLACEMENT  │──▶│ PLACEMENT    │──▶│ COMPLETE │
  │         │   │          │   │      │   │         │   │        │   │ STARTED   │   │ COMPLETED    │   │          │
  └─────────┘   └──────────┘   └──────┘   └─────────┘   └────────┘   └───────────┘   └──────────────┘   └──────────┘
       │                                                                                                      │
       │                                                                                                      │
       └──────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                  CANCELED (from any phase)
```

## Phase Details

### Phase 1: PLANNING

**Purpose:** Initial setup and pairing selection.

**State:**
- Plan created but not committed
- Dam and sire can still be changed
- No offspring group created yet

**Requirements to Exit:**
| Requirement | Description |
|-------------|-------------|
| Plan Name | User-provided name for the breeding |
| Species | Must be set (DOG, CAT, HORSE, etc.) |
| Dam | Female animal must be selected |
| Sire | Male animal must be selected |
| Breed | Breed text must be provided |
| Locked Cycle | Cycle start date must be locked |

**Actions Available:**
- Edit all plan fields
- Change dam/sire selection
- Use Genetics Lab (Punnett, COI, health risks)
- Delete plan entirely
- Lock cycle/ovulation date (triggers commit)

**UI Guidance:**
> "Set up your breeding plan by selecting the dam, sire, and locking in your estimated dates."

---

### Phase 2: COMMITTED

**Purpose:** Plan is locked and breeding is imminent.

**State:**
- All four locked dates set (cycle, ovulation, due, placement)
- Offspring group created
- Dam and sire cannot be changed
- Animal breeding status updated to "BREEDING"

**Trigger:** `POST /breeding/plans/:id/commit` or `POST /breeding/plans/:id/lock`

**Requirements to Exit:**
| Requirement | Description |
|-------------|-------------|
| Actual Cycle Start | Record when cycle actually started |

**Actions Available:**
- Record actual cycle start
- Track hormone testing (optional)
- Record breeding attempts
- Upgrade to ovulation anchor (if testing done)
- Uncommit (if no offspring/buyers attached)

**UI Guidance:**
> "Your plan is committed. Wait for the cycle to begin and record the actual start date when observed."

**Special States (Backend):**
- `CYCLE_EXPECTED` - Waiting for cycle
- `HORMONE_TESTING` - In testing window

---

### Phase 3: BRED

**Purpose:** Breeding has occurred, waiting for birth.

**State:**
- Actual breed date recorded
- Gestation period begins
- For horses: foaling milestones auto-generated

**Trigger:** Recording `breedDateActual`

**Requirements to Exit:**
| Requirement | Description |
|-------------|-------------|
| Actual Birth Date | Record when birth occurs |

**Actions Available:**
- Record pregnancy checks
- Complete foaling milestones (horses)
- Track gestation progress
- View countdown to expected birth

**UI Guidance:**
> "Breeding complete! Monitor the pregnancy and record the birth date when offspring arrive."

**Foaling Milestones (Horses):**
- Day 15: Pregnancy check
- Day 45: First ultrasound
- Day 90: Second ultrasound
- Day 300: Begin monitoring
- Day 320: Prepare foaling area
- Day 330: Daily checks
- Day 340: Due date
- Day 350: Overdue vet call

---

### Phase 4: BIRTHED

**Purpose:** Birth has occurred, offspring in early care.

**State:**
- Birth date recorded
- Offspring records can be created
- Foaling outcome recorded (horses)

**Trigger:** Recording `birthDateActual`

**Requirements to Exit:**
| Requirement | Description |
|-------------|-------------|
| Actual Weaned Date | Record when weaning is complete |

**Actions Available:**
- Record individual offspring (sex, color, health)
- Track early health status
- Record foaling outcome details (horses)
- Monitor nursing status
- Navigate to Offspring page for detailed management

**UI Guidance:**
> "Congratulations on the new arrivals! Record offspring details and monitor their early development."

**Horse-Specific:**
- Record mare condition
- Track placenta passage
- Monitor foal health status
- Track standing/nursing times

---

### Phase 5: WEANED

**Purpose:** Offspring weaned from mother, preparing for placement.

**State:**
- Weaning date recorded
- Offspring ready for placement preparation

**Trigger:** Recording `weanedDateActual`

**Requirements to Exit:**
| Requirement | Description |
|-------------|-------------|
| Actual Placement Start | Record when placement begins |

**Actions Available:**
- Assign offspring to buyers
- Process waitlist entries
- Complete health checks
- Prepare contracts

**UI Guidance:**
> "Weaning complete! Offspring are ready to begin the placement process. Visit the Offspring page to manage buyer assignments."

**Species Notes:**
| Species | Weaning Importance |
|---------|-------------------|
| HORSE | **REQUIRED** - Critical milestone, 4-6 months |
| CATTLE | Optional - 6-8 months typical |
| DOG | Optional - Gradual 3-4 week process |
| CAT | Optional - Gradual 4-8 week process |
| GOAT | Optional - Research shows <70 days causes shock |
| RABBIT | Optional - Must complete before 10 weeks |

---

### Phase 6: PLACEMENT_STARTED

**Purpose:** Offspring are being placed with new families.

**State:**
- Placement process has begun
- Some offspring may already be placed
- Active buyer coordination

**Trigger:** Recording `placementStartDateActual`

**Requirements to Exit:**
| Requirement | Description |
|-------------|-------------|
| Actual Placement Completed | Record when all offspring placed |

**Actions Available:**
- Track individual offspring placement
- Process payments
- Complete contracts
- Manage returns/transfers

**UI Guidance:**
> "Placement underway! Track each offspring's journey to their new home."

---

### Phase 7: PLACEMENT_COMPLETED

**Purpose:** All offspring have been placed.

**State:**
- All offspring placed or accounted for
- Financial transactions complete
- Ready to close out plan

**Trigger:** Recording `placementCompletedDateActual`

**Requirements to Exit:**
| Requirement | Description |
|-------------|-------------|
| Plan Completed Date | Final closeout confirmation |

**Actions Available:**
- Final review of offspring records
- Complete any remaining paperwork
- Generate final reports
- Archive plan

**UI Guidance:**
> "All offspring placed! Complete any remaining administrative tasks to close out this breeding."

**Celebration:** UI displays confetti animation when placement is completed.

---

### Phase 8: COMPLETE

**Purpose:** Plan officially closed out.

**State:**
- All dates recorded
- Plan is complete
- Historical record preserved

**Trigger:** Recording `completedDateActual`

**Pre-Completion Checklist:**
- [ ] Health records entered for each offspring
- [ ] Client contracts signed
- [ ] Invoices completed
- [ ] Media uploaded

**Actions Available:**
- View historical data
- Generate reports
- Archive/unarchive

**UI Guidance:**
> "This breeding plan is complete. Great work!"

---

## Status Transitions

### Frontend Status Mapping

```typescript
// Frontend uses simplified status set
type FrontendStatus =
  | "PLANNING"
  | "COMMITTED"
  | "BRED"
  | "BIRTHED"
  | "WEANED"
  | "PLACEMENT_STARTED"
  | "PLACEMENT_COMPLETED"
  | "COMPLETE"
  | "CANCELED";
```

### Backend to Frontend Mapping

| Backend Status | Frontend Status |
|----------------|-----------------|
| PLANNING | PLANNING |
| COMMITTED | COMMITTED |
| CYCLE_EXPECTED | COMMITTED |
| HORMONE_TESTING | COMMITTED |
| BRED | BRED |
| PREGNANT | BRED |
| BIRTHED | BIRTHED |
| WEANED | WEANED |
| PLACEMENT | PLACEMENT_STARTED or PLACEMENT_COMPLETED* |
| COMPLETE | COMPLETE |
| CANCELED | CANCELED |

*Differentiated by presence of `placementStartDateActual`

### Status Derivation Logic

```typescript
// deriveBreedingStatus.ts
function deriveStatus(plan: BreedingPlan): Status {
  // Check for explicit status validity
  if (plan.status === 'CANCELED') return 'CANCELED';

  // Derive from recorded dates (highest recorded wins)
  if (plan.completedDateActual) return 'COMPLETE';
  if (plan.placementCompletedDateActual) return 'PLACEMENT_COMPLETED';
  if (plan.placementStartDateActual) return 'PLACEMENT_STARTED';
  if (plan.weanedDateActual) return 'WEANED';
  if (plan.birthDateActual) return 'BIRTHED';
  if (plan.breedDateActual) return 'BRED';
  if (plan.committedAt) return 'COMMITTED';
  return 'PLANNING';
}
```

## Date Immutability Rules

### Date Hierarchy

```
cycleStartDateActual
        │
        │ locked by
        ▼
   breedDateActual
        │
        │ locked by
        ▼
   birthDateActual ◄─── STRICTLY IMMUTABLE once recorded
        │
        │ locked by
        ▼
   weanedDateActual
        │
        │ locked by
        ▼
placementStartDateActual
        │
        │ locked by
        ▼
placementCompletedDateActual
```

### Immutability by Status

| Status | cycleStartObserved | ovulationConfirmed | breedDateActual |
|--------|-------------------|-------------------|-----------------|
| PLANNING | Flexible | Flexible | Flexible |
| COMMITTED | ±3 days tolerance | ±2 days tolerance | Flexible |
| BRED/PREGNANT | **Locked** | **Locked** | ±2 days tolerance |
| BIRTHED+ | **Locked** | **Locked** | **Locked** |
| CANCELED | **Locked** | **Locked** | **Locked** |

### Business Rules

1. **Cannot clear upstream dates if downstream recorded:**
   - Can't clear `cycleStartDateActual` if `breedDateActual` exists
   - Can't clear `breedDateActual` if `birthDateActual` exists
   - Can't clear `weanedDateActual` if `placementStartDateActual` exists

2. **Birth date is STRICTLY immutable:**
   - Once `birthDateActual` is recorded, it cannot be changed
   - Requires support intervention to correct errors
   - This protects data integrity for offspring records

3. **Status cannot regress if:**
   - Offspring exist in the group
   - Corresponding dates are recorded
   - Financial transactions have occurred

## Commit/Uncommit Flow

### Committing a Plan

```
PLANNING
    │
    │ Validate:
    │ - name, species, dam, sire, breed present
    │ - All four locked dates present
    │   (lockedCycleStart, lockedOvulationDate, lockedDueDate, lockedPlacementStartDate)
    │
    ▼
POST /breeding/plans/:id/commit
    │
    │ Actions:
    │ - Set status = COMMITTED
    │ - Set committedAt, committedByUserId
    │ - Create PLAN_COMMITTED event
    │ - Ensure offspring group exists
    │ - Sync animal breeding status (dam, sire → BREEDING)
    │
    ▼
COMMITTED
```

### Uncommitting a Plan

```
COMMITTED
    │
    │ Validate:
    │ - Status must be exactly COMMITTED
    │ - No offspring in linked group
    │ - No waitlist entries
    │
    ▼
POST /breeding/plans/:id/uncommit
    │
    │ Actions:
    │ - Set status = PLANNING
    │ - Clear committedAt, committedByUserId
    │ - Create PLAN_UNCOMMITTED event
    │ - Delete offspring group (if no blockers)
    │ - Sync animal breeding status (may revert from BREEDING)
    │
    ▼
PLANNING
```

### Uncommit Blockers

| Blocker | Description |
|---------|-------------|
| Linked Offspring | Offspring records exist in group |
| Waitlist Entries | Buyers on waitlist |
| Breeding Recorded | `breedDateActual` is set |
| Financial Activity | Deposits recorded |

## Cancellation

A plan can be canceled from any phase.

**Effects:**
- Status set to CANCELED
- All date fields become immutable
- Plan excluded from active views by default
- Animal breeding status recalculated
- Historical record preserved

**Reversibility:** Cancellation can be reversed if:
- No offspring were recorded
- No financial transactions occurred
- Admin explicitly restores the plan

