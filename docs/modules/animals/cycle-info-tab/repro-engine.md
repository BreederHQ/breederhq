# Cycle Info Tab - Reproductive Engine Utilities

## Location

`packages/ui/src/utils/reproEngine/`

## File Index

| File | Purpose |
|------|---------|
| `projectUpcomingCycles.ts` | Projects future cycle starts |
| `effectiveCycleLen.ts` | Calculates actual cycle length |
| `normalize.ts` | Date validation and normalization |
| `defaults.ts` | Species-specific biology defaults |
| `types.ts` | TypeScript type definitions |

---

## projectUpcomingCycles.ts

### Main Function

```typescript
function projectUpcomingCycleStarts(
  summary: ReproSummary,
  opts?: ProjectUpcomingCyclesOpts
): ProjectUpcomingCyclesResult
```

### Input: ReproSummary

```typescript
interface ReproSummary {
  animalId: string;
  species: SpeciesCode;
  cycleStartsAsc: ISODate[];      // Sorted cycle dates
  dob: ISODate | null;            // Date of birth
  today: ISODate;                 // Current date
  femaleCycleLenOverrideDays?: number | null;
}
```

### Options

```typescript
interface ProjectUpcomingCyclesOpts {
  horizonMonths?: number;  // Default: 36
  maxCount?: number;       // Default: 12
}
```

### Algorithm

1. **Calculate effective cycle length** via `computeEffectiveCycleLenDays()`

2. **Determine seed (starting point):**

   | Priority | Condition | Seed Calculation |
   |----------|-----------|------------------|
   | 1 | Has cycle history | Last cycle + effective length |
   | 2 | Has DOB, no history | DOB + juvenileFirstCycleLikelyDays |
   | 3 | Fallback | Today + species cycle length |

3. **Apply postpartum gate:**
   - If recent birth recorded, don't project before postpartum minimum

4. **Generate projections:**
   - Loop from seed date, adding cycle length each iteration
   - Stop at maxCount (12) or horizon (36 months)
   - Never project dates before today

### Output

```typescript
interface ProjectUpcomingCyclesResult {
  projected: ProjectedCycleStart[];
  effective: EffectiveCycleLenResult;
}

interface ProjectedCycleStart {
  date: ISODate;
  source: "HISTORY" | "JUVENILE" | "BIOLOGY";
  confidence: "HIGH" | "MEDIUM" | "LOW";
}
```

---

## effectiveCycleLen.ts

### Main Function

```typescript
function computeEffectiveCycleLenDays(
  species: SpeciesCode,
  cycleStartsAsc: ISODate[],
  femaleCycleLenOverrideDays?: number | null
): EffectiveCycleLenResult
```

### Algorithm

1. **Calculate historical gaps:**
   ```typescript
   // Get last 3 gaps between consecutive cycles
   gaps = [];
   for (i = 1; i < cycleStartsAsc.length; i++) {
     gap = daysBetween(cycleStartsAsc[i-1], cycleStartsAsc[i]);
     if (gap > 0 && gap < 400) gaps.push(gap);
   }
   gaps = gaps.slice(-3); // Last 3 only
   ```

2. **Priority order:**

   | Priority | Condition | Result |
   |----------|-----------|--------|
   | 1 | Override exists | Use override, check for conflict |
   | 2 | History exists | Weighted blend of history + biology |
   | 3 | Fallback | Species biology default |

3. **History blending weights:**

   | # of Gaps | History Weight | Biology Weight |
   |-----------|----------------|----------------|
   | 3+ | 100% | 0% |
   | 2 | 67% | 33% |
   | 1 | 50% | 50% |

4. **Conflict detection:**
   - If override differs >20% from observed history average
   - Sets `warningConflict: true`

### Output

```typescript
interface EffectiveCycleLenResult {
  effectiveCycleLenDays: number;
  source: "OVERRIDE" | "HISTORY" | "BIOLOGY";
  warningConflict: boolean;
  observedGaps?: number[];
}
```

---

## normalize.ts

### asISODateOnly

```typescript
function asISODateOnly(v: any): ISODate | null
```

- Validates string is YYYY-MM-DD format
- Returns null if invalid
- Handles Date objects by converting to ISO string

### normalizeCycleStartsAsc

```typescript
function normalizeCycleStartsAsc(input: any): ISODate[]
```

- Converts array elements to date-only format
- Removes invalid entries
- Sorts ascending
- Removes duplicates

**Example:**
```typescript
normalizeCycleStartsAsc([
  "2024-03-15",
  "2024-01-10",
  "invalid",
  "2024-03-15",  // duplicate
  "2023-09-20"
]);
// Returns: ["2023-09-20", "2024-01-10", "2024-03-15"]
```

---

## defaults.ts

### getSpeciesDefaults

```typescript
function getSpeciesDefaults(species: SpeciesCode): SpeciesReproDefaults
```

Returns comprehensive defaults for a species:

```typescript
interface SpeciesReproDefaults {
  // Cycle timing
  cycleLenDays: number;
  ovulationOffsetDays: number;
  startBufferDays: number;

  // Gestation
  gestationDays: number;

  // Offspring
  offspringCareDurationWeeks: number;
  placementStartWeeksDefault: number;
  placementExtendedWeeks: number;

  // Juvenile first cycle
  juvenileFirstCycleMinDays: number;
  juvenileFirstCycleLikelyDays: number;
  juvenileFirstCycleMaxDays: number;

  // Postpartum
  postpartumMinDays: number;
  postpartumLikelyDays: number;
  postpartumMaxDays: number;
}
```

### Species Values

| Species | Cycle | Ovulation | Gestation | First Cycle | Postpartum |
|---------|-------|-----------|-----------|-------------|------------|
| DOG | 180 | 12 | 63 | 270 | 120 |
| CAT | 21 | 3 | 63 | 210 | 90 |
| HORSE | 21 | 5 | 340 | 450 | 45 |
| GOAT | 21 | 2 | 150 | 210 | 90 |
| RABBIT | 15 | 0* | 31 | 150 | 21 |
| SHEEP | 17 | 2 | 147 | 270 | 60 |

*Induced ovulator - ovulation offset not applicable

---

## types.ts

### Core Types

```typescript
type ISODate = string;  // YYYY-MM-DD format

type SpeciesCode =
  | "DOG" | "CAT" | "HORSE" | "GOAT"
  | "RABBIT" | "SHEEP" | "PIG" | "CATTLE"
  | "ALPACA" | "LLAMA";

type OvulationMethod =
  | "PROGESTERONE_TEST"
  | "LH_TEST"
  | "ULTRASOUND"
  | "VAGINAL_CYTOLOGY"
  | "PALPATION"
  | "AT_HOME_TEST"
  | "VETERINARY_EXAM"
  | "BREEDING_INDUCED"
  | "CALCULATED"
  | "ESTIMATED";

type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

type DataSource = "OBSERVED" | "DERIVED" | "ESTIMATED";

type ReproAnchorMode =
  | "CYCLE_START"      // Anchored to heat start date
  | "OVULATION"        // Anchored to ovulation date
  | "BREEDING_DATE";   // Anchored to breeding date
```

### Input/Output Types

```typescript
interface ReproSummary {
  animalId: string;
  species: SpeciesCode;
  cycleStartsAsc: ISODate[];
  dob: ISODate | null;
  today: ISODate;
  femaleCycleLenOverrideDays?: number | null;
}

interface CycleLenInputs {
  species: SpeciesCode;
  cycleStartsAsc: ISODate[];
  femaleCycleLenOverrideDays?: number | null;
}

interface EffectiveCycleLenResult {
  effectiveCycleLenDays: number;
  source: "OVERRIDE" | "HISTORY" | "BIOLOGY";
  warningConflict: boolean;
  observedGaps?: number[];
}

interface ProjectedCycleStart {
  date: ISODate;
  source: "HISTORY" | "JUVENILE" | "BIOLOGY";
  confidence: ConfidenceLevel;
}

interface ProjectUpcomingCyclesResult {
  projected: ProjectedCycleStart[];
  effective: EffectiveCycleLenResult;
}
```

---

## Usage Examples

### Project Upcoming Cycles

```typescript
import { projectUpcomingCycleStarts } from '@bhq/ui/utils/reproEngine/projectUpcomingCycles';

const result = projectUpcomingCycleStarts({
  animalId: "123",
  species: "DOG",
  cycleStartsAsc: ["2024-01-15", "2024-07-10"],
  dob: "2022-05-01",
  today: "2024-12-01",
  femaleCycleLenOverrideDays: null
});

// result.projected = [
//   { date: "2025-01-07", source: "HISTORY", confidence: "MEDIUM" },
//   { date: "2025-07-06", source: "HISTORY", confidence: "MEDIUM" },
//   ...
// ]
// result.effective = {
//   effectiveCycleLenDays: 177,
//   source: "HISTORY",
//   warningConflict: false
// }
```

### Normalize Cycle Dates

```typescript
import { normalizeCycleStartsAsc } from '@bhq/ui/utils/reproEngine/normalize';

const cleaned = normalizeCycleStartsAsc([
  "2024-03-15T12:00:00Z",  // Will be converted to date-only
  "invalid",               // Will be removed
  "2024-01-10"
]);
// Returns: ["2024-01-10", "2024-03-15"]
```

### Get Species Defaults

```typescript
import { getSpeciesDefaults } from '@bhq/ui/utils/reproEngine/defaults';

const dogDefaults = getSpeciesDefaults("DOG");
// {
//   cycleLenDays: 180,
//   ovulationOffsetDays: 12,
//   gestationDays: 63,
//   juvenileFirstCycleLikelyDays: 270,
//   postpartumLikelyDays: 120,
//   ...
// }
```
