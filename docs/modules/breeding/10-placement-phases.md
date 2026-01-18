# Placement Phases Analysis

## Overview

The breeding plan lifecycle includes two distinct placement phases:
1. **PLACEMENT_STARTED** - When offspring begin going to new homes
2. **PLACEMENT_COMPLETED** - When all offspring have been placed

This document analyzes the value of these separate phases across species and provides recommendations.

## Current Implementation

### Status Flow

```
WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
             │                        │
             │                        └── All offspring placed
             └── First offspring leaves
```

### Data Model

```typescript
// BreedingPlan
placementStartDateActual: DateTime?      // When first placement occurs
placementCompletedDateActual: DateTime?  // When all placements complete
expectedPlacementStart: DateTime?        // Calculated from birth + placementStartWeeksDefault
expectedPlacementCompleted: DateTime?    // Calculated from placement start + extended weeks

// OffspringGroup
placementStartAt: DateTime?
placementCompletedAt: DateTime?
placementSchedulingPolicy: Json?         // Fair distribution rules
```

### Species Timing Defaults

| Species | Placement Start | Extended Window | Total Window |
|---------|-----------------|-----------------|--------------|
| DOG | 8 weeks | +4 weeks | 8-12 weeks |
| CAT | 12 weeks | +4 weeks | 12-16 weeks |
| HORSE | 24 weeks (6 mo) | +26 weeks | 6-12 months |
| GOAT | 10 weeks | +4 weeks | 10-14 weeks |
| SHEEP | 10 weeks | +4 weeks | 10-14 weeks |
| RABBIT | 8 weeks | +2 weeks | 8-10 weeks |
| PIG | 6 weeks | +2 weeks | 6-8 weeks |
| CATTLE | N/A | N/A | Individual sales |
| ALPACA | N/A | N/A | Individual sales |
| LLAMA | N/A | N/A | Individual sales |

## Species Analysis

### Litter Species (Multiple Offspring)

**DOG, CAT, RABBIT, GOAT, SHEEP, PIG**

**Characteristics:**
- Multiple offspring per breeding (litters)
- Buyers select from litter
- Placements staggered over time
- Wait list management important

**Value of Separate Phases:**

| Aspect | PLACEMENT_STARTED | PLACEMENT_COMPLETED |
|--------|-------------------|---------------------|
| Business Value | Know when first pickup scheduled | Know when all business concluded |
| Workflow | Triggers placement coordination | Triggers plan closeout |
| Financial | Deposits converted to full payment | Final accounting |
| Practical | Partial litter management | Archive-ready state |

**Analysis:**
For litter species, having two phases makes sense because:
1. Placements genuinely occur over time (weeks)
2. Managing partial litters is a real workflow
3. Financial tracking differs (deposit → payment per offspring)
4. User needs to know "all done" vs "in progress"

**Recommendation:** ✅ **Keep both phases for litter species.**

---

### Single/Few Offspring Species (Individual Births)

**HORSE, CATTLE, ALPACA, LLAMA**

**Characteristics:**
- Typically 1 offspring per breeding
- Less common: twins (horses), occasional multiples (cattle)
- Single buyer typically
- "Placement" is single event

**Value of Separate Phases:**

For single offspring:
- PLACEMENT_STARTED = PLACEMENT_COMPLETED (same event)
- Having two steps feels redundant
- User clicks through two phases for same action

**Analysis:**
When there's only one offspring:
1. "Started" and "Completed" are the same moment
2. Extra UI steps without added value
3. Feels like busywork

**Recommendation:** 🔄 **Consider consolidating for single-offspring species.**

---

## Proposed Changes

### Option 1: Species-Aware Phase Display

Show different phases based on species offspring pattern:

```typescript
// speciesTerminology.ts
placement: {
  model: "LITTER" | "INDIVIDUAL",
  showStartPhase: boolean,         // Show PLACEMENT_STARTED?
  showCompletedPhase: boolean,     // Show PLACEMENT_COMPLETED?
  defaultToSinglePhase: boolean,   // Combine into one step?
}

// Configuration
DOG:    { model: "LITTER", showStartPhase: true, showCompletedPhase: true }
HORSE:  { model: "INDIVIDUAL", showStartPhase: false, showCompletedPhase: true }
```

**Result:**
- Litter species: 8 phases (current)
- Individual species: 7 phases (skip PLACEMENT_STARTED)

---

### Option 2: Dynamic Phase Based on Count

Adapt phases based on actual offspring count:

```typescript
// Determine phases dynamically
function getPlacementPhases(offspringCount: number) {
  if (offspringCount <= 1) {
    // Single offspring: one phase
    return ['PLACEMENT'];
  } else {
    // Multiple offspring: two phases
    return ['PLACEMENT_STARTED', 'PLACEMENT_COMPLETED'];
  }
}
```

**Pros:**
- Handles edge cases (horse twins)
- Adapts to actual breeding outcome

**Cons:**
- More complex logic
- Phase structure changes mid-plan

---

### Option 3: Optional Start Phase

Make PLACEMENT_STARTED optional, auto-advance when:
- Single offspring AND placement recorded
- User explicitly skips

```typescript
// Auto-advance logic
if (offspringCount === 1 && placementRecorded) {
  // Auto-set placementStartDateActual = placementCompletedDateActual
  advanceTo('PLACEMENT_COMPLETED');
}
```

**Pros:**
- Backward compatible
- Existing data unaffected
- Flexible for all scenarios

**Cons:**
- Slightly magical behavior

---

## Recommendation

### Short-term: Option 3 (Optional Start Phase)

1. Keep both phases in data model
2. For single-offspring species, auto-advance through PLACEMENT_STARTED
3. UI shows simplified flow for horses/cattle/camelids

**Implementation:**

```typescript
// PlanJourney.tsx - modify phase display
const showPlacementStartPhase = useMemo(() => {
  // Always show for litter species
  if (['DOG', 'CAT', 'RABBIT', 'GOAT', 'SHEEP', 'PIG'].includes(species)) {
    return true;
  }
  // For individual species, only show if multiple offspring
  return (offspringCount ?? 0) > 1;
}, [species, offspringCount]);

// Phase array
const phases = showPlacementStartPhase
  ? ['PLANNING', 'COMMITTED', 'BRED', 'BIRTHED', 'WEANED',
     'PLACEMENT_STARTED', 'PLACEMENT_COMPLETED', 'COMPLETE']
  : ['PLANNING', 'COMMITTED', 'BRED', 'BIRTHED', 'WEANED',
     'PLACEMENT', 'COMPLETE'];  // Combined phase
```

### Long-term: Full Species-Aware Phases

Refactor to support:
1. Per-species phase definitions
2. Phase customization per breeding program
3. User preference for detailed vs simplified flow

## Placement Terminology

### Current Labels

| Field | Label |
|-------|-------|
| placementStartDateActual | "Placement Start Date" |
| placementCompletedDateActual | "Placement Completed Date" |

### Proposed Species-Specific Labels

| Species | Start Label | Completed Label |
|---------|-------------|-----------------|
| DOG | "First Puppy Goes Home" | "All Puppies Placed" |
| CAT | "First Kitten Goes Home" | "All Kittens Placed" |
| HORSE | N/A (skip) | "Foal Goes Home" |
| GOAT | "First Kid Goes Home" | "All Kids Placed" |
| RABBIT | "First Kit Goes Home" | "All Kits Placed" |

### Combined Phase Label (Single Offspring)

For horses, cattle, camelids when single offspring:
- **Label:** "Offspring Placed" or "{Species term} Goes Home"
- **Example:** "Foal Goes Home", "Calf Placed", "Cria Goes Home"

## Business Value Analysis

### Why Two Phases Matter for Litters

**Financial Tracking:**
```
Birth: 6 puppies
       │
       │ Deposits collected ($500 each = $3,000)
       ▼
PLACEMENT_STARTED (Week 8)
       │
       │ Puppy 1: Deposit → Full Payment (+$2,000)
       │ Puppy 2: Deposit → Full Payment (+$2,000)
       ▼
Week 9:
       │ Puppy 3: Deposit → Full Payment (+$2,000)
       │ Puppy 4: Deposit → Full Payment (+$2,000)
       ▼
PLACEMENT_COMPLETED (Week 10)
       │ Puppy 5: Deposit → Full Payment (+$2,000)
       │ Puppy 6: Deposit → Full Payment (+$2,000)
       ▼
Total Revenue: $15,000
```

**Workflow Management:**
- Coordinate pickups over multiple weeks
- Track which buyers have/haven't picked up
- Handle last-minute changes
- Know when litter management is complete

### Why Single Phase Suffices for Individuals

**Typical Horse Scenario:**
```
Birth: 1 foal
       │
       │ Reserved to buyer (deposit $5,000)
       │
       ▼
PLACEMENT (Month 6)
       │ Single pickup event
       │ Final payment ($25,000)
       │
       ▼
COMPLETE
```

No staggered placements = no need for separate start/completed phases.

## Edge Cases

### Horse Twins

Rare (~1% of births), but when it happens:
- System should allow two-phase workflow
- Dynamic detection: if `offspringCount > 1`, show both phases
- User sees: "This foaling had twins - track placements individually"

### Keeper Offspring

When breeder keeps one or more offspring:
- Mark offspring as `keeperIntent: KEEP`
- "Placed" count excludes keepers
- Placement completed when all non-keepers placed

### All Offspring Deceased

Sad scenario but needs handling:
- If all offspring `lifeState: DECEASED`
- Allow advancing through placement phases without dates
- Add note: "No placements - all offspring deceased"

### Return/Transfer After Placement

- Offspring returned after PLACEMENT_COMPLETED
- Don't revert plan status
- Handle in Offspring module (placementState: RETURNED)
- Plan remains COMPLETE

## Implementation Checklist

### Phase 1: UI Simplification

- [ ] Add `showPlacementStartPhase` logic based on species
- [ ] Implement combined "Placement" phase for individual species
- [ ] Update phase count display (7 vs 8)
- [ ] Test with all species

### Phase 2: Auto-Advance Logic

- [ ] Implement auto-advance when single offspring placed
- [ ] Ensure both dates set correctly
- [ ] Update event logging

### Phase 3: Terminology Updates

- [ ] Add species-specific placement labels to speciesTerminology
- [ ] Update UI to use dynamic labels
- [ ] Update guidance text per species

### Phase 4: Edge Case Handling

- [ ] Detect multiple offspring for normally-single species
- [ ] Handle keeper offspring in placement counting
- [ ] Document deceased offspring workflow

