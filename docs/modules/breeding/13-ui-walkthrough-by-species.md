# UI Walkthrough by Species

> **Version:** 1.1.0 | **Updated:** 2026-01-18

This document describes what breeders will see in the UI when creating and managing breeding plans for each supported species.

---

## Common UI Elements (All Species)

Every breeding plan includes these core UI elements:

| Element | Location | Purpose |
|---------|----------|---------|
| **PlanJourney** | Overview tab (top) | Phase timeline with progress indicators |
| **Parents Section** | Overview tab | Dam/Sire selection with search |
| **Next Milestone Summary** | Overview tab | Shows upcoming milestone with countdown |
| **Cycle Selection** | Overview tab | Lock in expected heat cycle (PLANNING/COMMITTED) |
| **Dates Tab** | Tab navigation | Enter actual dates as you progress |
| **Offspring Tab** | Tab navigation | Manage litter/offspring |
| **Finances Tab** | Tab navigation | Track deposits and payments |

---

## DOG

### Phase Count: 8

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
```

### Special UI Features

#### Ovulation Insight Card
When a dam with cycle history is selected in edit mode, an **OvulationInsightCard** appears after the Parents section:

```
┌─────────────────────────────────────────────────────────────────┐
│ Bella's Ovulation Pattern                    [Early Ovulator]   │
│ Based on 3 cycles                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Typical Ovulation     Confidence                                │
│ Day 10 (±0.6 days)    [HIGH]                                    │
│                                                                 │
│ Why this matters: Using this pattern can improve breeding       │
│ timeline predictions from ±3-5 days to ±1-2 days.               │
│                                                                 │
│ [Use This Pattern for Predictions]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Conditions for display:**
- Species is DOG
- In edit mode
- Dam is selected
- Dam has learned ovulation pattern (not "Insufficient Data")

#### Ovulation Upgrade
Dogs support **ovulation upgrade** - the ability to confirm ovulation via testing:
- Progesterone testing
- LH testing
- Ultrasound

When ovulation is confirmed, the plan can switch from CYCLE_START anchor to OVULATION anchor for more accurate timeline predictions.

### Anchor Mode
- **Default:** CYCLE_START (heat start date)
- **Upgradeable to:** OVULATION (when confirmed via testing)

### Validation Rules
No species-specific validation rules beyond standard biology checks.

---

## CAT

### Phase Count: 8

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
```

### Special UI Features

#### No Ovulation Insight Card
Cats are **induced ovulators** - ovulation is triggered by breeding, not by a natural cycle. Therefore:
- No cycle tracking
- No ovulation pattern learning
- No OvulationInsightCard displayed

### Anchor Mode
- **Fixed:** BREEDING_DATE (date of mating triggers ovulation)

### Validation Rules
No species-specific validation rules beyond standard biology checks.

---

## HORSE

### Phase Count: 7

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT → COMPLETE
```

### Special UI Features

#### Ovulation Insight Card
Same as DOG - when a mare with cycle history is selected:
- Shows learned ovulation pattern
- Classification: Early/Average/Late Ovulator
- Confidence level and sample size

#### Combined Placement Phase
Horses use a **7-phase workflow** with a combined "Placement" phase:
- No separate PLACEMENT_STARTED phase
- Single "Placement" phase covers the entire placement process
- Reason: Typically only one foal to place

**Edge Case:** If a horse has twins, the system automatically switches to the 8-phase workflow.

#### Foaling Checklist Tab
Horse breeding plans include an additional **Foaling Checklist** tab:
- Pre-foaling preparation milestones
- Foaling day checklist
- Post-foaling care milestones
- Alert badges when milestones are overdue

#### Foaling Outcome Tab
Records birth details specific to horses:
- Foaling outcome (live birth, stillbirth, etc.)
- Foal details (sex, color, markings)
- Complications or notes

#### Foaling Alert Badge
The Foaling Checklist tab shows alert badges:
- 🔴 Red dot for overdue milestones
- 🟡 Yellow dot for milestones due soon
- Tab label turns red when overdue items exist

### Anchor Mode
- **Default:** CYCLE_START
- **Upgradeable to:** OVULATION (via ultrasound/palpation)

### Validation Rules
No species-specific validation rules beyond standard biology checks.

---

## GOAT

### Phase Count: 8

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
```

### Special UI Features

#### No Ovulation Insight Card
Goats do not have testing infrastructure for ovulation confirmation:
- No progesterone/LH testing available
- No ovulation pattern learning
- No OvulationInsightCard displayed

#### Weaning Validation Warning
**Critical validation rule:** Minimum 70-day weaning age

If weaning date is entered less than 70 days after birth:

```
⚠️ Warning: WEANING_TOO_EARLY
Weaning at 56 days (8 weeks) is below minimum of 70 days (10 weeks) -
early weaning can cause weaning shock in goat kids
```

**Why this matters:** Research shows goat kids weaned before 10 weeks are at high risk of weaning shock, which can cause health problems or death.

### Anchor Mode
- **Fixed:** CYCLE_START only (no ovulation upgrade available)

### Validation Rules

| Rule | Value | Warning |
|------|-------|---------|
| Minimum weaning age | 70 days (10 weeks) | Prevents weaning shock |

---

## SHEEP

### Phase Count: 8

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
```

### Special UI Features

#### No Ovulation Insight Card
Similar to goats - no testing infrastructure available.

#### Seasonal Breeding
Sheep are seasonal breeders (fall breeding typical), but this is informational only - no specific UI enforcement.

### Anchor Mode
- **Fixed:** CYCLE_START only

### Validation Rules
No species-specific validation rules beyond standard biology checks.

---

## RABBIT

### Phase Count: 8

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
```

### Special UI Features

#### No Ovulation Insight Card
Rabbits are **induced ovulators** (like cats):
- Ovulation triggered by breeding
- No cycle tracking
- No pattern learning

#### Placement Validation Warning
**Critical validation rule:** Maximum 70-day placement age

If placement date is entered more than 70 days after birth:

```
⚠️ Warning: PLACEMENT_TOO_LATE
Placement at 84 days (12 weeks) exceeds maximum of 70 days (10 weeks) -
must place before 10 weeks to prevent fighting/aggression
```

**Why this matters:** Rabbits kept together past 10 weeks begin exhibiting territorial aggression and fighting, which can cause serious injury.

### Anchor Mode
- **Fixed:** BREEDING_DATE (induced ovulator)

### Validation Rules

| Rule | Value | Warning |
|------|-------|---------|
| Maximum placement age | 70 days (10 weeks) | Prevents fighting/aggression |

---

## Quick Reference Table

| Species | Phases | Ovulation Insight | Special Validation | Special Tabs | Anchor Mode |
|---------|--------|-------------------|-------------------|--------------|-------------|
| DOG | 8 | ✅ Yes | — | — | CYCLE_START → OVULATION |
| CAT | 8 | ❌ No | — | — | BREEDING_DATE |
| HORSE | 7 | ✅ Yes | — | Foaling Checklist, Foaling Outcome | CYCLE_START → OVULATION |
| GOAT | 8 | ❌ No | Weaning ≥70 days | — | CYCLE_START |
| SHEEP | 8 | ❌ No | — | — | CYCLE_START |
| RABBIT | 8 | ❌ No | Placement ≤70 days | — | BREEDING_DATE |

---

## Implementation Details

### Phase Display Logic

The system uses `speciesShowsPlacementStartPhase()` to determine phase count:

```typescript
// From speciesTerminology.ts
function speciesShowsPlacementStartPhase(species: string | null | undefined): boolean {
  return speciesShowsGroupConcept(species);
}

// Returns true for: DOG, CAT, RABBIT, GOAT, SHEEP (litter species)
// Returns false for: HORSE, CATTLE, ALPACA, LLAMA (individual-offspring species)
```

### Ovulation Insight Display Logic

```typescript
// From App-Breeding.tsx
{isEdit && speciesSupportsOvulationUpgrade && effective.damId && damHasOvulationPattern && damOvulationPattern && (
  <OvulationInsightCard
    classification={damOvulationPattern.classification}
    avgOffsetDays={damOvulationPattern.avgOffsetDays}
    stdDeviation={damOvulationPattern.stdDeviation}
    confidence={damOvulationPattern.confidence}
    sampleSize={damOvulationPattern.sampleSize}
    damName={effective.damName || undefined}
    onUsePattern={() => { /* ... */ }}
  />
)}
```

### Validation Trigger Points

Validation warnings are shown when entering dates in the Dates tab:

1. **Weaning date entered** → `validateWeaningTiming()` checks against `birthToWeaningMinDays`
2. **Placement date entered** → `validatePlacementMaxTiming()` checks against `birthToPlacementMaxDays`

Warnings are soft (can be overridden) but logged for audit purposes.

---

## Related Documentation

- [06-species-terminology.md](./06-species-terminology.md) - Species configuration flags
- [10-placement-phases.md](./10-placement-phases.md) - Phase consolidation details
- [11-cycle-info-integration.md](./11-cycle-info-integration.md) - Ovulation pattern integration
- [12-foaling-system.md](./12-foaling-system.md) - Horse foaling workflow
