# Cycle Info Tab - Backend Service

## Service Location

`breederhq-api/src/services/cycle-analysis-service.ts`

## Main Export

```typescript
function calculateCycleAnalysis(
  animalId: number,
  tenantId: number
): Promise<CycleAnalysisResult>
```

## Processing Pipeline

### Step 1: Fetch Animal & Data

```typescript
// Get animal with species and override
const animal = await prisma.animal.findFirst({
  where: { id: animalId, tenantId },
  select: { species: true, femaleCycleLenOverrideDays: true }
});

// Get all reproductive cycles
const cycles = await prisma.reproductiveCycle.findMany({
  where: { animalId, tenantId },
  orderBy: { cycleStartObserved: 'asc' }
});

// Get breeding plans with ovulation data
const breedingPlans = await prisma.breedingPlan.findMany({
  where: { femaleId: animalId, tenantId },
  select: {
    id: true,
    ovulationDate: true,
    ovulationMethod: true,
    birthDate: true,
    // ... other fields
  }
});
```

### Step 2: Enrich Cycle Data

For each cycle, determine ovulation with confidence hierarchy:

| Priority | Condition | Confidence | Source |
|----------|-----------|------------|--------|
| 1 | Hormone-tested ovulation date | HIGH | HORMONE_TEST |
| 2 | Back-calculated from birth | MEDIUM | BIRTH_CALCULATED |
| 3 | Estimated from species average | LOW | ESTIMATED |

**Matching Logic:**
- Breeding plans matched to cycles within +/-3 days of cycleStartObserved
- Back-calculation: `ovulationDate = birthDate - gestationDays`

**Calculations per cycle:**
```typescript
offsetDays = ovulationDate - cycleStartDate  // Days from heat start
variance = offsetDays - speciesDefault       // Deviation from average
```

### Step 3: Calculate Ovulation Pattern

**Requirements:**
- Minimum 2 HIGH or MEDIUM confidence cycles

**Statistics:**
```typescript
avgOffsetDays = mean(offsetDays)  // Average ovulation day
stdDeviation = stdev(offsetDays)  // Consistency measure
minOffset = min(offsetDays)
maxOffset = max(offsetDays)
```

**Classification:**
| Condition | Classification |
|-----------|----------------|
| avgOffset <= (speciesDefault - 2) | Early Ovulator |
| avgOffset >= (speciesDefault + 2) | Late Ovulator |
| Between those thresholds | Average |
| <2 confirmed cycles | Insufficient Data |

**Pattern Confidence:**
| Condition | Confidence |
|-----------|------------|
| 3+ cycles AND stdev <= 1.5 | HIGH |
| 2 cycles AND stdev <= 1.5 | MEDIUM |
| Otherwise | LOW |

### Step 4: Calculate Cycle Length

**Priority Order:**

1. **OVERRIDE:** If `femaleCycleLenOverrideDays` exists
   ```typescript
   cycleLengthDays = animal.femaleCycleLenOverrideDays;
   source = "OVERRIDE";
   ```

2. **HISTORY:** Calculate from consecutive cycle intervals
   ```typescript
   intervals = cycles.map((c, i) => {
     if (i === 0) return null;
     return daysBetween(cycles[i-1].cycleStart, c.cycleStart);
   }).filter(valid);

   // Guard: only keep intervals 0-400 days
   validIntervals = intervals.filter(d => d > 0 && d < 400);

   cycleLengthDays = median(validIntervals);
   source = "HISTORY";
   ```

3. **BIOLOGY:** Fall back to species default
   ```typescript
   cycleLengthDays = SPECIES_DEFAULTS[species].cycleLenDays;
   source = "BIOLOGY";
   ```

### Step 5: Project Next Cycle

```typescript
// Base projection
projectedHeatStart = lastCycleStart + cycleLengthDays;

// Ovulation window
const avgOffset = ovulationPattern.avgOffsetDays ?? speciesDefault;
const range = ovulationPattern.stdDeviation ?? 2;

projectedOvulationWindow = {
  earliest: projectedHeatStart + (avgOffset - range),
  latest: projectedHeatStart + (avgOffset + range),
  mostLikely: projectedHeatStart + avgOffset
};

// Testing recommendation
recommendedTestingStart = projectedHeatStart + (avgOffset - 4);
```

---

## Species Configuration

```typescript
const SPECIES_DEFAULTS: Record<string, SpeciesConfig> = {
  DOG: {
    ovulationOffsetDays: 12,
    gestationDays: 63,
    cycleLenDays: 180,
    isInducedOvulator: false
  },
  CAT: {
    ovulationOffsetDays: 0,
    gestationDays: 63,
    cycleLenDays: 21,
    isInducedOvulator: true  // INDUCED OVULATOR
  },
  HORSE: {
    ovulationOffsetDays: 5,
    gestationDays: 340,
    cycleLenDays: 21,
    isInducedOvulator: false
  },
  GOAT: {
    ovulationOffsetDays: 2,
    gestationDays: 150,
    cycleLenDays: 21,
    isInducedOvulator: false
  },
  RABBIT: {
    ovulationOffsetDays: 0,
    gestationDays: 31,
    cycleLenDays: 15,
    isInducedOvulator: true  // INDUCED OVULATOR
  },
  SHEEP: {
    ovulationOffsetDays: 2,
    gestationDays: 147,
    cycleLenDays: 17,
    isInducedOvulator: false
  },
  PIG: {
    ovulationOffsetDays: 2,
    gestationDays: 114,
    cycleLenDays: 21,
    isInducedOvulator: false
  },
  CATTLE: {
    ovulationOffsetDays: 1,
    gestationDays: 283,
    cycleLenDays: 21,
    isInducedOvulator: false
  },
  ALPACA: {
    ovulationOffsetDays: 0,
    gestationDays: 345,
    cycleLenDays: 14,
    isInducedOvulator: true  // INDUCED OVULATOR
  },
  LLAMA: {
    ovulationOffsetDays: 0,
    gestationDays: 350,
    cycleLenDays: 14,
    isInducedOvulator: true  // INDUCED OVULATOR
  }
};
```

---

## Guidance Text Generation

```typescript
function generateGuidance(
  classification: OvulationClassification,
  avgOffset: number,
  speciesDefault: number
): string
```

**Output Examples:**

| Classification | Guidance |
|----------------|----------|
| Insufficient Data | "Record more breeding cycles with confirmed ovulation to unlock personalized predictions." |
| Early Ovulator | "This female typically ovulates on Day {N}, which is {X} days earlier than the breed average. Start progesterone testing on Day {M} to catch the rise." |
| Late Ovulator | "This female typically ovulates on Day {N}, which is {X} days later than the breed average. Start progesterone testing on Day {M} - don't rush into breeding too early." |
| Average | "This female follows the breed average ovulation pattern (Day {N}). Start progesterone testing on Day {M} and continue daily until confirmed." |

---

## API Endpoint

**Route:** `GET /animals/:id/cycle-analysis`

**Location:** `breederhq-api/src/routes/animals.ts`

**Implementation:**
```typescript
router.get('/:id/cycle-analysis', async (req, res) => {
  const { id } = req.params;
  const animalId = parseInt(id, 10);

  if (isNaN(animalId)) {
    return res.status(400).json({ error: 'Invalid animal ID' });
  }

  const tenantId = req.tenant.id;

  // Verify animal exists and belongs to tenant
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, tenantId }
  });

  if (!animal) {
    return res.status(404).json({ error: 'Animal not found' });
  }

  const analysis = await calculateCycleAnalysis(animalId, tenantId);
  return res.json(analysis);
});
```

---

## Date Handling

All dates are processed with explicit UTC handling:

```typescript
// Convert to UTC-safe date-only format
function toUTCDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Parse ISO date string safely
function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
```

---

## Error Handling

| Error | Status | Response |
|-------|--------|----------|
| Invalid animal ID | 400 | `{ error: 'Invalid animal ID' }` |
| Animal not found | 404 | `{ error: 'Animal not found' }` |
| Database error | 500 | Re-thrown |

---

## Response Type

```typescript
interface CycleAnalysisResult {
  animalId: number;
  species: string;
  cycleHistory: CycleHistoryEntry[];
  ovulationPattern: OvulationPattern;
  nextCycleProjection: NextCycleProjection | null;
  cycleLengthDays: number;
  cycleLengthSource: "OVERRIDE" | "HISTORY" | "BIOLOGY";
}
```
