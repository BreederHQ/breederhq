# Anchor Mode System

## Overview

The anchor mode system determines how breeding plan timelines are calculated. Different species have different reproductive biology, and the anchor mode adapts to provide the most accurate predictions possible.

## Three Anchor Modes

### 1. CYCLE_START (Default for Cyclic Ovulators)

**Description:** Uses the observed heat/estrus start date as the anchor point. Ovulation is calculated by adding the species-specific offset.

**Calculation:**
```
Cycle Start (observed)
    │
    │ + ovulationOffsetDays (species-specific)
    ▼
Calculated Ovulation
    │
    │ + gestationDays
    ▼
Expected Birth
```

**Accuracy:** ±2-5 days (MEDIUM confidence)

**Species:**
| Species | Ovulation Offset | Confidence |
|---------|------------------|------------|
| DOG | +12 days | MEDIUM |
| HORSE | +5 days | MEDIUM |
| GOAT | +2 days | MEDIUM |
| SHEEP | +2 days | MEDIUM |
| PIG | +2 days | MEDIUM |
| CATTLE | +1 day | MEDIUM |

**UI Label:** "Heat Start" (dogs), "Cycle Start" (others)

---

### 2. OVULATION (Upgrade Path for Tested Species)

**Description:** Uses hormone-confirmed ovulation date. This is the most accurate anchor, eliminating the uncertainty of ovulation offset calculation.

**Calculation:**
```
Ovulation Date (confirmed via testing)
    │
    │ + gestationDays (direct)
    ▼
Expected Birth (±1-2 days accuracy)
```

**Accuracy:** ±1-2 days (HIGH confidence)

**Confirmation Methods:**
| Method | Code | Description |
|--------|------|-------------|
| Progesterone Test | `PROGESTERONE_TEST` | Blood test for progesterone levels |
| LH Test | `LH_TEST` | LH surge detection |
| Ultrasound | `ULTRASOUND` | Follicle monitoring |
| Vaginal Cytology | `VAGINAL_CYTOLOGY` | Cell examination |
| Palpation | `PALPATION` | Manual examination |
| At-Home Test | `AT_HOME_TEST` | Consumer ovulation kits |
| Veterinary Exam | `VETERINARY_EXAM` | General vet confirmation |

**Species with Testing Infrastructure:**
| Species | Common Methods | Recommendation |
|---------|---------------|----------------|
| DOG | Progesterone, LH | **RECOMMENDED** - significantly improves accuracy |
| HORSE | Ultrasound, Palpation | **RECOMMENDED** - standard veterinary practice |
| GOAT | None available | Not supported |
| SHEEP | None available | Not supported |
| CATTLE | None available | Not supported |

---

### 3. BREEDING_DATE (Induced Ovulators)

**Description:** For species that ovulate in response to breeding, the breeding date IS effectively the ovulation date.

**Calculation:**
```
Breeding Date = Ovulation Date (induced)
    │
    │ + gestationDays
    ▼
Expected Birth
```

**Accuracy:** HIGH (±1-2 days) - no uncertainty about ovulation timing

**Species:**
| Species | Ovulation Trigger | Notes |
|---------|-------------------|-------|
| CAT | Breeding induced | Ovulation within 24-48 hours of breeding |
| RABBIT | Breeding induced | Ovulation within hours of breeding |
| ALPACA | Breeding induced | Ovulation within 24-48 hours |
| LLAMA | Breeding induced | Ovulation within 24-48 hours |

**UI Label:** "Breeding Date" (no cycle concept)

## Species Configuration

### Per-Species Anchor Options

```typescript
// From speciesTerminology.ts

anchorMode: {
  options: [
    {
      type: "CYCLE_START",
      label: "Heat start",
      description: "Track from first day of heat",
      accuracy: "±3-5 days",
      recommended: false
    },
    {
      type: "OVULATION",
      label: "Ovulation date",
      description: "Track from confirmed ovulation",
      accuracy: "±1-2 days",
      recommended: true
    }
  ],
  recommended: "OVULATION",
  defaultAnchor: "CYCLE_START",      // Start here
  testingAvailable: true,
  testingCommon: false,              // Not all breeders test
  supportsUpgrade: true,             // Can upgrade mid-plan
  upgradeFrom: "CYCLE_START",
  upgradeTo: "OVULATION",
  isInducedOvulator: false
}
```

### Configuration by Species

| Species | Default | Recommended | Upgrade Path | Induced |
|---------|---------|-------------|--------------|---------|
| DOG | CYCLE_START | OVULATION | Yes | No |
| CAT | BREEDING_DATE | BREEDING_DATE | No | **Yes** |
| HORSE | CYCLE_START | OVULATION | Yes | No |
| RABBIT | BREEDING_DATE | BREEDING_DATE | No | **Yes** |
| GOAT | CYCLE_START | CYCLE_START | No | No |
| SHEEP | CYCLE_START | CYCLE_START | No | No |
| PIG | CYCLE_START | CYCLE_START | No | No |
| CATTLE | CYCLE_START | CYCLE_START | No | No |
| ALPACA | BREEDING_DATE | BREEDING_DATE | No | **Yes** |
| LLAMA | BREEDING_DATE | BREEDING_DATE | No | **Yes** |

## Upgrade Flow (CYCLE_START → OVULATION)

### When to Upgrade

1. Plan is in COMMITTED status
2. Breeding not yet recorded (before BRED status)
3. Hormone testing confirms ovulation date
4. Species supports testing

### API Endpoint

```
POST /breeding/plans/:id/upgrade-to-ovulation

Body:
{
  ovulationDate: "2026-02-15",
  confirmationMethod: "PROGESTERONE_TEST",
  testResultId?: 123,  // Optional link to test record
  notes?: "Progesterone at 5.2 ng/ml"
}
```

### What Happens on Upgrade

1. **Anchor Mode Update:**
   ```
   reproAnchorMode: CYCLE_START → OVULATION
   ovulationConfirmed: {ovulationDate}
   ovulationConfirmedMethod: {method}
   ovulationConfidence: HIGH
   ```

2. **Variance Tracking (ML learning):**
   ```typescript
   actualOvulationOffset = ovulationDate - cycleStartObserved
   expectedOvulationOffset = speciesDefaults.ovulationOffsetDays
   variance = actualOvulationOffset - expectedOvulationOffset

   // Example: Dog
   // Expected: Day 12
   // Actual: Day 10
   // Variance: -2 (early ovulator)
   ```

3. **Timeline Recalculation:**
   - All expected dates recalculated from new anchor
   - Birth window narrows (higher confidence)
   - `placementShift` calculated (days moved)

4. **Event Created:**
   ```
   ANCHOR_UPGRADED {
     from: "CYCLE_START",
     to: "OVULATION",
     ovulationDate: "2026-02-15",
     method: "PROGESTERONE_TEST",
     variance: -2,
     placementShift: -2
   }
   ```

### Upgrade Response

```json
{
  "success": true,
  "analysis": {
    "previousAnchor": "CYCLE_START",
    "newAnchor": "OVULATION",
    "ovulationDate": "2026-02-15",
    "actualOvulationOffset": 10,
    "expectedOvulationOffset": 12,
    "variance": -2,
    "classification": "EARLY_OVULATOR",
    "newExpectedBirthDate": "2026-04-19",
    "placementShift": -2,
    "confidenceUpgrade": "MEDIUM → HIGH"
  }
}
```

## Cycle Info Tab Integration

The Animals module's Cycle Info tab learns from breeding history:

### Pattern Learning

```
Breeding Plan 1: Ovulation Day 10 (confirmed)
Breeding Plan 2: Ovulation Day 11 (confirmed)
Breeding Plan 3: Ovulation Day 10 (confirmed)
                        │
                        ▼
Average Offset: Day 10.33
Std Deviation: ±0.58 days
Classification: "Early Ovulator"
```

### Next Cycle Projection

```
Last Cycle Start: 2026-01-15
Effective Cycle Length: 178 days (learned)
                        │
                        ▼
Next Cycle Start: ~2026-07-12
Projected Ovulation: ~2026-07-22 (Day 10 pattern)
Testing Window: 2026-07-20 to 2026-07-24
Confidence: HIGH (3+ cycles with data)
```

### Data Flow

```
BreedingPlan.ovulationConfirmed
        │
        │ Stored with method & confidence
        ▼
ReproductiveCycle (Animal)
        │
        │ Aggregated by CycleAnalysisService
        ▼
Cycle Info Tab
        │
        │ Shows pattern analysis
        ▼
Next Breeding Plan
        │
        │ Uses learned pattern for better defaults
        ▼
More Accurate Timeline
```

## Confidence Levels

### Definition

| Level | Accuracy | Source |
|-------|----------|--------|
| HIGH | ±1-2 days | Hormone-confirmed ovulation, induced ovulators |
| MEDIUM | ±2-5 days | Observed cycle start, calculated ovulation |
| LOW | ±5+ days | Estimated, back-calculated, or guessed |

### Impact on UI

**HIGH Confidence:**
- Narrow timeline bands
- "Likely" and "Full" windows close together
- Due date shown with small range

**MEDIUM Confidence:**
- Moderate timeline bands
- "Risky" edges visible
- Due date shown with moderate range

**LOW Confidence:**
- Wide timeline bands
- Large "Unlikely" bands
- Due date shown with wide range
- Encouragement to add more data

## Best Practices

### For Dogs

1. **Start with CYCLE_START** - Record heat start when first signs observed
2. **Consider progesterone testing** - Especially for valuable breedings
3. **Upgrade when available** - If testing done, upgrade anchor
4. **Learn from history** - After 2-3 cycles, system learns individual patterns

### For Horses

1. **Ultrasound monitoring** - Standard practice for serious breeders
2. **Track follicle development** - Upgrade to OVULATION when confirmed
3. **Document each cycle** - Build accurate pattern data

### For Cats/Rabbits (Induced Ovulators)

1. **Track breeding date accurately** - This IS the anchor
2. **No cycle start needed** - Skip heat tracking
3. **HIGH confidence by default** - Ovulation is predictable

### For Goats/Sheep/Pigs/Cattle

1. **Use CYCLE_START only** - No testing infrastructure
2. **Observe heat signs carefully** - Accuracy depends on observation
3. **Document patterns** - System learns from repeated cycles

## Technical Implementation

### Anchor Detection Priority

```typescript
// planWindows.ts - detectAnchor()

function detectAnchor(plan: BreedingPlan): AnchorType {
  // Priority order (highest to lowest confidence)
  if (plan.birthDateActual) return 'BIRTH';
  if (plan.ovulationConfirmed) return 'OVULATION';
  if (plan.cycleStartObserved) return 'CYCLE_START';
  if (plan.lockedCycleStart) return 'LOCKED_CYCLE';
  return null;
}
```

### Timeline Calculation

```typescript
// timelineFromSeed.ts

function computeWindowsFromSeed(
  seed: ISODate,
  seedType: 'CYCLE_START' | 'OVULATION' | 'BREEDING_DATE',
  species: Species
): PlanStageWindows {
  const defaults = getSpeciesDefaults(species);

  let ovulationDate: ISODate;
  if (seedType === 'CYCLE_START') {
    ovulationDate = addDays(seed, defaults.ovulationOffsetDays);
  } else {
    ovulationDate = seed; // OVULATION or BREEDING_DATE
  }

  const birthDate = addDays(ovulationDate, defaults.gestationDays);
  const weaningDate = addDays(birthDate, defaults.offspringCareDurationWeeks * 7);
  const placementStart = addDays(birthDate, defaults.placementStartWeeksDefault * 7);
  const placementEnd = addDays(placementStart, defaults.placementExtendedWeeks * 7);

  return {
    cycle_start: seedType === 'CYCLE_START' ? seed : calculateBackward(...),
    ovulation: ovulationDate,
    birth_expected: birthDate,
    // ... full and likely windows for each phase
  };
}
```

