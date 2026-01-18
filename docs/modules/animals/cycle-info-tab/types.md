# Cycle Info Tab - TypeScript Types

## API Response Types

### CycleAnalysisResult

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

### CycleHistoryEntry

```typescript
interface CycleHistoryEntry {
  id: number;
  cycleStartObserved: string;        // ISO date YYYY-MM-DD
  ovulationDate: string | null;       // ISO date if available
  ovulationMethod: OvulationMethod | null;
  ovulationConfidence: ConfidenceLevel;
  ovulationSource: DataSource;
  offsetDays: number | null;          // Days from cycle start to ovulation
  variance: number | null;            // Deviation from species average
  linkedBreedingPlanId: number | null;
  birthDate: string | null;           // If pregnancy resulted
  notes: string | null;
}
```

### OvulationPattern

```typescript
interface OvulationPattern {
  classification: OvulationClassification;
  avgOffsetDays: number | null;
  stdDeviation: number | null;
  minOffset: number | null;
  maxOffset: number | null;
  sampleSize: number;
  confidence: ConfidenceLevel;
  guidanceText: string;
}

type OvulationClassification =
  | "Early Ovulator"
  | "Average"
  | "Late Ovulator"
  | "Insufficient Data";
```

### NextCycleProjection

```typescript
interface NextCycleProjection {
  projectedHeatStart: string;         // ISO date
  projectedOvulationWindow: {
    earliest: string;
    latest: string;
    mostLikely: string;
  };
  recommendedTestingStart: string;
  daysUntilHeat: number;
  daysUntilTesting: number;
  confidence: ConfidenceLevel;
}
```

---

## ReproEngine Types

### Core Types

```typescript
// ISO date string in YYYY-MM-DD format
type ISODate = string;

// Supported species codes
type SpeciesCode =
  | "DOG"
  | "CAT"
  | "HORSE"
  | "GOAT"
  | "RABBIT"
  | "SHEEP"
  | "PIG"
  | "CATTLE"
  | "ALPACA"
  | "LLAMA";

// How ovulation was determined
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

// Data quality indicator
type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

// How the data was obtained
type DataSource = "OBSERVED" | "DERIVED" | "ESTIMATED";

// What date anchors the breeding plan
type ReproAnchorMode =
  | "CYCLE_START"      // Anchored to heat start date
  | "OVULATION"        // Anchored to ovulation date
  | "BREEDING_DATE";   // Anchored to breeding date
```

### Input Types

```typescript
interface ReproSummary {
  animalId: string;
  species: SpeciesCode;
  cycleStartsAsc: ISODate[];           // Sorted cycle dates
  dob: ISODate | null;                  // Date of birth
  today: ISODate;                       // Current date
  femaleCycleLenOverrideDays?: number | null;
}

interface CycleLenInputs {
  species: SpeciesCode;
  cycleStartsAsc: ISODate[];
  femaleCycleLenOverrideDays?: number | null;
}

interface ProjectUpcomingCyclesOpts {
  horizonMonths?: number;   // Default: 36
  maxCount?: number;        // Default: 12
}
```

### Output Types

```typescript
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

## Species Configuration Types

### Backend SpeciesConfig

```typescript
interface SpeciesConfig {
  ovulationOffsetDays: number;
  gestationDays: number;
  cycleLenDays: number;
  isInducedOvulator: boolean;
}
```

### ReproEngine SpeciesReproDefaults

```typescript
interface SpeciesReproDefaults {
  // Cycle timing
  cycleLenDays: number;
  ovulationOffsetDays: number;
  startBufferDays: number;

  // Gestation
  gestationDays: number;

  // Offspring care
  offspringCareDurationWeeks: number;
  placementStartWeeksDefault: number;
  placementExtendedWeeks: number;

  // Juvenile first cycle timing
  juvenileFirstCycleMinDays: number;
  juvenileFirstCycleLikelyDays: number;
  juvenileFirstCycleMaxDays: number;

  // Postpartum return to cycle
  postpartumMinDays: number;
  postpartumLikelyDays: number;
  postpartumMaxDays: number;
}
```

---

## Component Prop Types

### CycleTab Props

```typescript
interface CycleTabProps {
  animal: AnimalRow;
  api: any;
  onSaved: (dates: string[]) => void;
  onOverrideSaved?: (overrideValue: number | null) => void;
}
```

### NextCycleHero Props

```typescript
interface NextCycleHeroProps {
  projection: NextCycleProjection;
  ovulationPattern?: OvulationPattern;
  species?: string;
}
```

### OvulationDotPlot Props

```typescript
interface OvulationDotPlotProps {
  cycles: CycleHistoryEntry[];
  avgOffset: number | null;
  speciesDefault: number;
  species: string;
  showAllOption?: boolean;
}
```

### OvulationSummary Props

```typescript
interface OvulationSummaryProps {
  ovulationPattern: OvulationPattern;
  cycleHistory: CycleHistoryEntry[];
  speciesDefault: number;
  species: string;
}
```

### CollapsibleCycleHistory Props

```typescript
interface CollapsibleCycleHistoryProps {
  cycles: CycleHistoryEntry[];
  editingCycleId?: number | null;
  onEditCycle?: (cycleId: number) => void;
  onEditComplete?: (cycleId: number, newDateIso: string) => void;
  onEditCancel?: () => void;
  onDeleteCycle?: (cycleId: number) => void;
  centered?: boolean;
}
```

### CycleAlerts Props

```typescript
interface CycleAlertsProps {
  projection: NextCycleProjection;
  ovulationPattern: OvulationPattern;
  hasActiveBreedingPlan?: boolean;
  onStartBreedingPlan?: () => void;
  onDismissAlert?: (alertId: string) => void;
}
```

### Badge Component Props

```typescript
interface OvulationPatternBadgeProps {
  classification: OvulationClassification;
  confidence: ConfidenceLevel;
  sampleSize: number;
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  source?: DataSource;
  showIcon?: boolean;
}

interface VarianceBadgeProps {
  variance: number;
}

interface CycleAlertBadgeProps {
  daysUntilExpected: number;
  size?: "sm" | "md";
  dotOnly?: boolean;
}
```

---

## Database Schema Types

### Animal (relevant fields)

```typescript
interface Animal {
  id: number;
  tenantId: number;
  species: string;
  sex: "M" | "F";
  femaleCycleLenOverrideDays: number | null;
  cycleStartDates: string[];  // JSON array of ISO dates
  dob: Date | null;
  // ... other fields
}
```

### ReproductiveCycle

```typescript
interface ReproductiveCycle {
  id: number;
  animalId: number;
  tenantId: number;
  cycleStartObserved: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### BreedingPlan (relevant fields)

```typescript
interface BreedingPlan {
  id: number;
  femaleId: number;
  tenantId: number;
  ovulationDate: Date | null;
  ovulationMethod: string | null;
  birthDate: Date | null;
  // ... other fields
}
```

---

## Type Guards and Utilities

### Type Guards

```typescript
function isValidSpeciesCode(code: string): code is SpeciesCode {
  return [
    "DOG", "CAT", "HORSE", "GOAT", "RABBIT",
    "SHEEP", "PIG", "CATTLE", "ALPACA", "LLAMA"
  ].includes(code);
}

function isInducedOvulator(species: SpeciesCode): boolean {
  return ["CAT", "RABBIT", "ALPACA", "LLAMA"].includes(species);
}

function isSeasonalBreeder(species: SpeciesCode): boolean {
  return ["HORSE", "GOAT", "SHEEP"].includes(species);
}
```

### Date Utilities

```typescript
function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function daysBetween(date1: ISODate, date2: ISODate): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
```
