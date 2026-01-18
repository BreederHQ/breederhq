# Cycle Info Tab Integration

## Overview

The Cycle Info Tab in the Animals module provides reproductive cycle tracking for female animals. This data feeds into the breeding module for more accurate timeline predictions.

**Location:** `apps/animals/src/components/CycleAnalysis/`

## Components

### CycleAnalysis Directory

| Component | Purpose |
|-----------|---------|
| `CycleLengthInsight.tsx` | Displays cycle length classification (Short/Average/Long Cycler) |
| `OvulationSummary.tsx` | Shows ovulation pattern analysis with spectrum indicator |
| `OvulationPatternAnalysis.tsx` | Bar chart visualization of ovulation timing patterns |
| `NextCycleProjectionCard.tsx` | Displays projected heat start and ovulation window |
| `CycleHistoryEntry.tsx` | Individual cycle records with ovulation data |
| `ConfidenceBadge.tsx` | Confidence level indicators (HIGH/MEDIUM/LOW) |
| `OvulationPatternBadge.tsx` | Badge showing ovulation classification |
| `VarianceBadge.tsx` | Shows variance from species average |
| `CycleAlertBadge.tsx` | Alert indicators for cycle status |
| `NextCycleHero.tsx` | Hero card for next cycle projection |
| `CollapsibleCycleHistory.tsx` | Collapsible timeline of cycle history |
| `CollapsibleOverride.tsx` | Cycle length override controls |

## Data Model

### Cycle History Entry

```typescript
type CycleHistoryEntry = {
  id: number;
  cycleStart: string;           // Heat start date (ISO format)
  ovulation: string | null;      // Confirmed ovulation date
  ovulationMethod: string | null; // How ovulation was determined
  offsetDays: number | null;     // Days from heat start to ovulation
  variance: number | null;       // Difference from expected offset
  confidence: "HIGH" | "MEDIUM" | "LOW";
  source: "HORMONE_TEST" | "BIRTH_CALCULATED" | "ESTIMATED";
  breedingPlanId: number | null; // Link to breeding plan
  birthDate: string | null;      // If cycle resulted in birth
  notes: string | null;
};
```

### Pattern Analysis Output

```typescript
type OvulationPattern = {
  averageOffsetDay: number;      // e.g., 10.33
  standardDeviation: number;     // e.g., 0.58
  classification: "EARLY_OVULATOR" | "AVERAGE" | "LATE_OVULATOR" | "INSUFFICIENT_DATA";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  cyclesAnalyzed: number;
};
```

## Integration Points

### Data Flow: Breeding Plan → Cycle History

```
BreedingPlan (BIRTHED status)
    │
    │ ovulationConfirmed, ovulationConfirmedMethod
    │ birthDateActual
    │
    ▼
CycleAnalysisService
    │
    │ Extracts cycle data from breeding plans
    │ Calculates offset: ovulation - cycleStart
    │
    ▼
ReproductiveCycle (Animal record)
    │
    │ Stores aggregated cycle history
    │
    ▼
Cycle Info Tab (UI)
```

### Data Flow: Cycle History → Breeding Plan

```
Cycle Info Tab
    │
    │ Shows learned pattern
    │ Displays next cycle projection
    │
    ▼
User Creates New Breeding Plan
    │
    │ System pre-populates with learned data:
    │ - Expected cycle start (from projection)
    │ - Suggested ovulation window (from pattern)
    │
    ▼
BreedingPlan
    │
    │ More accurate initial estimates
    │
    ▼
Better Timeline Predictions
```

## Ovulation Data Sources

### Source: HORMONE_TEST

Highest confidence. Recorded when:
- Progesterone testing confirms ovulation
- LH test detects surge
- Ultrasound confirms follicle release

```typescript
{
  source: "HORMONE_TEST",
  confidence: "HIGH",
  ovulationMethod: "PROGESTERONE_TEST" | "LH_TEST" | "ULTRASOUND" | etc.
}
```

### Source: BIRTH_CALCULATED

Medium confidence. Calculated by:
```
ovulation = birthDate - gestationDays
```

Example for dog:
```
Birth: 2026-03-15
Gestation: 63 days
Calculated Ovulation: 2026-01-11
```

```typescript
{
  source: "BIRTH_CALCULATED",
  confidence: "MEDIUM",
  ovulationMethod: "CALCULATED"
}
```

### Source: ESTIMATED

Low confidence. User-provided estimate without testing.

```typescript
{
  source: "ESTIMATED",
  confidence: "LOW",
  ovulationMethod: "ESTIMATED"
}
```

## Pattern Learning

### Minimum Data Requirements

- **Pattern Analysis:** Requires 2+ cycles with confirmed ovulation
- **High Confidence Pattern:** Requires 3+ cycles with HORMONE_TEST source

### Classification Thresholds

| Classification | Offset vs Average | Description |
|----------------|-------------------|-------------|
| EARLY_OVULATOR | < -2 days | Ovulates earlier than species average |
| AVERAGE | -2 to +2 days | Normal ovulation timing |
| LATE_OVULATOR | > +2 days | Ovulates later than species average |

### Example Pattern Learning

```
Dog: Species average ovulation = Day 12

Cycle 1: Ovulation Day 10 (offset -2)
Cycle 2: Ovulation Day 11 (offset -1)
Cycle 3: Ovulation Day 10 (offset -2)

Average Offset: Day 10.33
Classification: EARLY_OVULATOR
Standard Deviation: ±0.58 days
Confidence: HIGH (3 cycles, hormone-tested)
```

## ReproEngine Integration

### Effective Cycle Length Calculation

```typescript
// effectiveCycleLen.ts
function computeEffectiveCycleLenDays(input: CycleLenInputs): EffectiveCycleLenResult {
  // Priority 1: User override
  if (input.override) {
    return { days: input.override, source: "OVERRIDE" };
  }

  // Priority 2: Weighted blend of history + biology
  if (input.historyGaps.length > 0) {
    const historyAvg = average(input.historyGaps);
    const weight = getHistoryWeight(input.historyGaps.length);
    const blended = (historyAvg * weight) + (input.biologyDefault * (1 - weight));
    return { days: blended, source: "HISTORY" };
  }

  // Priority 3: Species default
  return { days: input.biologyDefault, source: "BIOLOGY" };
}

// Weighting by history depth
function getHistoryWeight(gapCount: number): number {
  if (gapCount >= 3) return 1.0;    // 100% history
  if (gapCount === 2) return 0.67;  // 67% history, 33% biology
  if (gapCount === 1) return 0.50;  // 50% history, 50% biology
  return 0;                          // 100% biology
}
```

### Next Cycle Projection

```typescript
// projectUpcomingCycles.ts
function projectUpcomingCycleStarts(summary: ReproSummary): ProjectedCycleStart[] {
  // Determine seed date
  const seed = selectSeed(summary);

  // Get effective cycle length
  const effectiveCycle = computeEffectiveCycleLenDays(summary);

  // Project future cycles
  const projections = [];
  let nextDate = addDays(seed, effectiveCycle.days);

  while (nextDate < horizon && projections.length < 12) {
    projections.push({
      date: nextDate,
      confidence: effectiveCycle.source === "HISTORY" ? "HIGH" : "MEDIUM"
    });
    nextDate = addDays(nextDate, effectiveCycle.days);
  }

  return projections;
}

function selectSeed(summary: ReproSummary): ISODate {
  // Priority 1: Last cycle + effective length
  if (summary.lastCycleStart) {
    return summary.lastCycleStart;
  }

  // Priority 2: DOB + juvenile first cycle
  if (summary.dateOfBirth) {
    return addDays(summary.dateOfBirth, summary.juvenileFirstCycleLikelyDays);
  }

  // Priority 3: Today
  return today();
}
```

## UI Display

### Cycle Length Insight

```
┌─────────────────────────────────────────────────────────────────┐
│ CYCLE LENGTH                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 178 days                                    [Short Cycler]      │
│ Source: Observed from 3 cycles                                  │
│                                                                 │
│ Species Average: 180 days                                       │
│ Variance: -2 days                                               │
│                                                                 │
│ ℹ️ Short cyclers have more frequent heat periods.               │
│    Monitor closely for upcoming cycles.                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ovulation Pattern Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ OVULATION PATTERN                          [Early Ovulator]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Average Ovulation: Day 10 (±0.6 days)                          │
│ Species Average: Day 12                                         │
│                                                                 │
│ Pattern Spectrum:                                               │
│ Early ◄═══════█═══░░░░░░░░░░░░░░░░░░░░░░░► Late               │
│        Day 8        Day 12        Day 16                        │
│                                                                 │
│ Based on 3 cycles with hormone confirmation                     │
│                                                                 │
│ Cycles:                                                         │
│ • Jan 2025: Day 10 (🔬 Progesterone)                           │
│ • Jul 2024: Day 11 (🔬 Progesterone)                           │
│ • Jan 2024: Day 10 (📊 Birth calculated)                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Next Cycle Projection

```
┌─────────────────────────────────────────────────────────────────┐
│ NEXT CYCLE PROJECTION                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Expected Heat Start: ~July 12, 2026                            │
│                                                                 │
│ Ovulation Window:                                               │
│ ├─ Earliest: July 20 (Day 8)                                   │
│ ├─ Likely: July 22 (Day 10)                                    │
│ └─ Latest: July 24 (Day 12)                                    │
│                                                                 │
│ Recommended Testing Start: July 18                              │
│                                                                 │
│ Confidence: HIGH (based on 3 observed cycles)                   │
│                                                                 │
│ [Plan Breeding for This Cycle]                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Breeding Plan Pre-Population

When creating a new breeding plan for a female with cycle history:

```typescript
function getBreedingPlanDefaults(animal: Animal): Partial<BreedingPlan> {
  const cycleAnalysis = getCycleAnalysis(animal.id);

  if (!cycleAnalysis) {
    // No history - use species defaults
    return {
      reproAnchorMode: getDefaultAnchorMode(animal.species),
    };
  }

  // Has history - use learned data
  const projection = cycleAnalysis.nextProjection;
  const pattern = cycleAnalysis.ovulationPattern;

  return {
    // Pre-fill expected dates based on learning
    expectedCycleStart: projection?.date,

    // Suggest anchor mode based on testing history
    reproAnchorMode: pattern.confidence === "HIGH"
      ? "OVULATION"    // Has good test data
      : "CYCLE_START", // Limited data

    // Include pattern info for reference
    _metadata: {
      learnedOvulationOffset: pattern.averageOffsetDay,
      learnedCycleLength: cycleAnalysis.effectiveCycleLength,
      patternConfidence: pattern.confidence
    }
  };
}
```

## Species-Specific Behavior

### Dogs (Cyclic Ovulator)

- **Cycle Length:** ~180 days (6 months)
- **Ovulation:** Day 10-14 from heat start
- **Testing:** Progesterone testing available and recommended
- **Learning:** Pattern learning highly valuable

### Cats (Induced Ovulator)

- **No Cycle Tracking:** Ovulation triggered by breeding
- **Cycle Info Tab:** Shows breeding history only
- **Pattern Learning:** Not applicable

### Horses (Cyclic Ovulator)

- **Cycle Length:** ~21 days during breeding season
- **Ovulation:** Day 5-6 from cycle start
- **Testing:** Ultrasound/palpation common
- **Seasonal:** Breeding season affects cycles

### Goats/Sheep (Seasonal Cyclic)

- **Cycle Length:** ~17-21 days
- **Ovulation:** Day 2 from cycle start
- **Testing:** Not available
- **Seasonal:** Fall breeding typical

## Data Storage

### Animal Model

```prisma
model Animal {
  // ... other fields

  // Reproductive tracking
  lastHeatDate       DateTime?
  nextExpectedHeat   DateTime?
  averageCycleLength Int?           // Days, learned from history
  cycleSource        String?        // "OBSERVED" | "DEFAULT"

  // Relations
  reproductiveCycles ReproductiveCycle[]
  breedingPlansAsDam BreedingPlan[] @relation("Dam")
}
```

### ReproductiveCycle Model

```prisma
model ReproductiveCycle {
  id              Int       @id
  animalId        Int
  cycleStart      DateTime
  ovulationDate   DateTime?
  ovulationMethod String?
  breedingPlanId  Int?
  birthDate       DateTime?
  notes           String?
  createdAt       DateTime  @default(now())

  animal          Animal    @relation(...)
  breedingPlan    BreedingPlan? @relation(...)
}
```

## API Endpoints

```
GET /animals/:id/cycle-history
  Returns: CycleHistoryEntry[]

GET /animals/:id/cycle-analysis
  Returns: {
    effectiveCycleLength: EffectiveCycleLenResult,
    ovulationPattern: OvulationPattern,
    nextProjection: ProjectedCycleStart | null,
    history: CycleHistoryEntry[]
  }

POST /animals/:id/cycles
  Body: { cycleStart, ovulationDate?, method?, notes? }
  Returns: CycleHistoryEntry

GET /animals/:id/next-cycle-projection
  Returns: ProjectedCycleStart | null
```

