# Ovulation Anchor Breeding System - Implementation Summary

**Implemented**: January 17, 2026
**Status**: Core implementation complete (Phases 0-5)

---

## Overview

The Ovulation Anchor Breeding System enables professional breeders to use hormone-tested ovulation dates for higher accuracy breeding predictions while maintaining backward compatibility with cycle-start anchoring.

### Key Features
- **Dual Anchor Mode**: Support for CYCLE_START, OVULATION, and BREEDING_DATE anchors
- **Species-Aware**: Different behaviors for 11 species (dogs, cats, horses, rabbits, goats, sheep, pigs, cattle, chickens, alpacas, llamas)
- **Progressive Enhancement**: Upgrade from cycle-start to ovulation-confirmed mid-plan
- **Immutability Rules**: Strict validation on date modifications based on plan status
- **Variance Tracking**: ML-ready offset tracking for individual female patterns

---

## Files Modified

### Phase 0: Species Terminology Extension

**File**: `packages/ui/src/utils/speciesTerminology.ts`

Added 4 new property groups to `SpeciesTerminology` interface:

```typescript
cycle: {
  startLabel: string;           // "heat start" | "cycle start" | "breeding"
  startLabelCap: string;
  anchorDateLabel: string;
  cycleExplanation: string;
  cycleStartHelp: string;
  breedingDateLabel: string;
};

ovulation: {
  label: string;
  dateLabel: string;
  confirmationMethod: string;
  guidanceText: string;
  confirmationMethods: string[];
  testingGuidance: string;
};

anchorMode: {
  options: Array<{
    type: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
    label: string;
    description: string;
    accuracy: string;
    recommended: boolean;
    testingAvailable: boolean;
    confirmationMethods?: string[];
  }>;
  recommended: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
  defaultAnchor: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
  testingAvailable: boolean;
  testingCommon: boolean;
  supportsUpgrade: boolean;
  upgradeFrom?: "CYCLE_START";
  upgradeTo?: "OVULATION";
  isInducedOvulator: boolean;
  guidanceText: string;
};

weaning: {
  weaningType: "DISTINCT_EVENT" | "GRADUAL_PROCESS";
  required: boolean;
  estimatedDurationWeeks: number;
  guidanceText: string;
  statusLabel: string;
  actualDateLabel: string;
};
```

**New Helper Functions** (18 total):
- `getCycleLabel(species, capitalize)` - Get cycle start label
- `getOvulationGuidance(species)` - Get ovulation educational text
- `getRecommendedAnchorMode(species)` - Get recommended anchor for species
- `getDefaultAnchorMode(species)` - Get default anchor for new plans
- `isWeaningRequired(species)` - Check if weaning is required
- `getWeaningGuidance(species)` - Get weaning guidance text
- `getAvailableAnchors(species)` - Get available anchor options
- `supportsOvulationUpgrade(species)` - Check if upgrade is supported
- `isInducedOvulator(species)` - Check if induced ovulator
- `getAnchorModeGuidance(species)` - Get anchor mode help text
- `isOvulationTestingAvailable(species)` - Check testing availability
- `isOvulationTestingCommon(species)` - Check if testing is common
- `getOvulationConfirmationMethods(species)` - Get confirmation methods
- `getOvulationTestingGuidance(species)` - Get testing protocol
- `getCycleExplanation(species)` - Get cycle explanation
- `getBreedingDateLabel(species)` - Get breeding date label
- `getAnchorDateLabel(species)` - Get anchor date label
- `getWeaningType(species)` - Get weaning type
- `getEstimatedWeaningWeeks(species)` - Get weaning duration

---

### Phase 1: Database Schema Enhancement

**File**: `breederhq-api/prisma/schema.prisma`

**New Enums**:
```prisma
enum ReproAnchorMode {
  CYCLE_START    // Traditional: heat/cycle observation only
  OVULATION      // Professional: hormone-tested ovulation
  BREEDING_DATE  // For induced ovulators (cats/rabbits)
}

enum AnchorType {
  CYCLE_START
  OVULATION
  BREEDING_DATE
  BIRTH
  LOCKED_CYCLE
}

enum OvulationMethod {
  CALCULATED
  PROGESTERONE_TEST
  LH_TEST
  ULTRASOUND
  VAGINAL_CYTOLOGY
  PALPATION
  AT_HOME_TEST
  VETERINARY_EXAM
  BREEDING_INDUCED
}

enum ConfidenceLevel {
  HIGH
  MEDIUM
  LOW
}

enum DataSource {
  OBSERVED
  DERIVED
  ESTIMATED
}
```

**New Fields on BreedingPlan**:
```prisma
// Anchor Mode Selection
reproAnchorMode          ReproAnchorMode @default(CYCLE_START)
primaryAnchor            AnchorType      @default(CYCLE_START)

// Cycle Start Data
cycleStartObserved       DateTime?
cycleStartSource         DataSource?
cycleStartConfidence     ConfidenceLevel?

// Ovulation Confirmation
ovulationConfirmed       DateTime?
ovulationConfirmedMethod OvulationMethod?
ovulationTestResultId    Int?
ovulationTestResult      TestResult?     @relation("OvulationAnchor", ...)
ovulationConfidence      ConfidenceLevel?

// Variance Tracking (for ML)
expectedOvulationOffset  Int?
actualOvulationOffset    Int?
varianceFromExpected     Int?

// Metadata
dateConfidenceLevel      ConfidenceLevel? @default(MEDIUM)
dateSourceNotes          String?
```

**Migration File**: `breederhq-api/prisma/migrations/20260117180923_add_anchor_mode_system/migration.sql`

Includes data backfill:
- Existing plans with `lockedCycleStart` → `CYCLE_START` mode
- CAT/RABBIT plans with `breedDateActual` → `BREEDING_DATE` mode

---

### Phase 2: Calculation Engine Enhancement

**File**: `packages/ui/src/utils/reproEngine/types.ts`

**New Types**:
```typescript
export type ReproAnchorMode = "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
export type AnchorType = "CYCLE_START" | "OVULATION" | "BREEDING_DATE" | "BIRTH" | "LOCKED_CYCLE";
export type OvulationMethod = "CALCULATED" | "PROGESTERONE_TEST" | "LH_TEST" | ...;
export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";
export type DataSource = "OBSERVED" | "DERIVED" | "ESTIMATED";

export type AnchorConfig = {
  mode: ReproAnchorMode;
  date: ISODate;
  method?: OvulationMethod;
  confidence?: ConfidenceLevel;
};
```

**File**: `packages/ui/src/utils/reproEngine/timelineFromSeed.ts`

**New Functions**:

```typescript
/**
 * Build timeline from confirmed ovulation (±1 day accuracy)
 * Works BACKWARD to estimate cycle start, FORWARD to calculate birth
 */
export function buildTimelineFromOvulation(
  summary: ReproSummary,
  confirmedOvulation: ISODate
): ReproTimeline;

/**
 * Universal entry point - routes to correct builder based on anchor mode
 */
export function buildTimelineFromAnchor(
  summary: ReproSummary,
  anchor: AnchorConfig
): ReproTimeline;

/**
 * Auto-detect best anchor from plan data
 * Priority: Birth > Ovulation (hormone-tested) > Cycle Start
 */
export function detectAnchorFromPlan(plan: {
  reproAnchorMode?: string | null;
  lockedOvulationDate?: string | null;
  lockedCycleStart?: string | null;
  ovulationConfirmed?: string | null;
  ovulationConfirmedMethod?: string | null;
  birthDateActual?: string | null;
}): AnchorConfig | null;
```

---

### Phase 3: API Endpoint Updates

**File**: `breederhq-api/src/routes/breeding.ts`

#### New Endpoint: `POST /breeding/plans/:id/lock`

Unified lock endpoint for all anchor modes.

**Request Body**:
```json
{
  "anchorMode": "CYCLE_START" | "OVULATION" | "BREEDING_DATE",
  "anchorDate": "2026-01-15",
  "confirmationMethod": "PROGESTERONE_TEST",  // Required for OVULATION
  "testResultId": 123,                         // Optional
  "notes": "Day 12 progesterone 6.2 ng/mL"
}
```

**Response**:
```json
{
  "success": true,
  "plan": { ... },
  "anchorMode": "OVULATION",
  "anchorDate": "2026-01-15",
  "confidence": "HIGH",
  "calculatedDates": {
    "cycleStart": "2026-01-03",
    "ovulation": "2026-01-15",
    "dueDate": "2026-03-19",
    "weanedDate": "2026-05-14",
    "placementStart": "2026-05-14",
    "placementCompleted": "2026-06-11"
  }
}
```

#### New Endpoint: `POST /breeding/plans/:id/upgrade-to-ovulation`

Progressive enhancement from CYCLE_START to OVULATION anchor.

**Request Body**:
```json
{
  "ovulationDate": "2026-01-15",
  "confirmationMethod": "PROGESTERONE_TEST",
  "testResultId": 123,
  "notes": "Confirmed via progesterone testing"
}
```

**Response**:
```json
{
  "success": true,
  "plan": { ... },
  "upgrade": {
    "from": "CYCLE_START",
    "to": "OVULATION"
  },
  "variance": {
    "actualOffset": 14,
    "expectedOffset": 12,
    "variance": 2,
    "analysis": "late"
  },
  "placementShift": 2,
  "calculatedDates": { ... }
}
```

#### New: Immutability Validation

```typescript
class ImmutabilityError extends Error {
  constructor(public field: string, message: string);
}

function validateImmutability(existingPlan: any, updates: any): void;
```

**Immutability Rules**:
| Field | PLANNING | COMMITTED | BRED | BIRTHED+ |
|-------|----------|-----------|------|----------|
| reproAnchorMode | Mutable | Upgrade only | Locked | Locked |
| cycleStartObserved | Mutable | ±3 days | Locked | Locked |
| ovulationConfirmed | Mutable | ±2 days | Locked | Locked |
| breedDateActual | Mutable | Mutable | ±2 days | Locked |
| birthDateActual | Mutable | Mutable | Mutable | **STRICT** |
| weanedDateActual | Mutable | Mutable | Mutable | ±7 days |

---

### Phase 4: UI/UX Updates

**File**: `apps/breeding/src/adapters/planWindows.ts`

Updated `windowsFromPlan` to accept anchor mode fields:
```typescript
export function windowsFromPlan(plan: {
  species?: string | null;
  dob?: string | null;
  reproAnchorMode?: string | null;
  ovulationConfirmed?: string | null;
  ovulationConfirmedMethod?: string | null;
  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  birthDateActual?: string | null;
  earliestCycleStart?: string | null;
  latestCycleStart?: string | null;
}): PlanStageWindows | null;
```

Extended `PlanStageWindows` type:
```typescript
export type PlanStageWindows = {
  // ... existing fields ...

  // NEW: Anchor mode metadata
  ovulation_confirmed: ISODate | null;
  anchor_mode: "CYCLE_START" | "OVULATION" | "BREEDING_DATE" | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
};
```

**File**: `apps/breeding/src/pages/planner/deriveBreedingStatus.ts`

Updated to accept `ovulationConfirmed` as alternative to `lockedCycleStart`:
```typescript
export function deriveBreedingStatus(p: {
  // ... existing fields ...
  ovulationConfirmed?: string | null;  // NEW
}): Status;
```

---

### Phase 5: Data Migration

Handled in Phase 1 migration SQL:
- All existing plans with `lockedCycleStart` → `reproAnchorMode = 'CYCLE_START'`
- CAT/RABBIT plans with `breedDateActual` → `reproAnchorMode = 'BREEDING_DATE'`

---

## Species Behavior Matrix

| Species | Default Anchor | Supports Upgrade | Induced Ovulator | Testing Available |
|---------|---------------|------------------|------------------|-------------------|
| DOG | CYCLE_START | ✅ Yes | ❌ No | ✅ Yes (Progesterone) |
| CAT | BREEDING_DATE | ❌ No | ✅ Yes | ❌ No |
| HORSE | CYCLE_START | ✅ Yes | ❌ No | ✅ Yes (Ultrasound) |
| RABBIT | BREEDING_DATE | ❌ No | ✅ Yes | ❌ No |
| GOAT | CYCLE_START | ❌ No | ❌ No | ❌ No |
| SHEEP | CYCLE_START | ❌ No | ❌ No | ❌ No |
| PIG | CYCLE_START | ❌ No | ❌ No | ❌ No |
| CATTLE | CYCLE_START | ❌ No | ❌ No | ❌ No |
| CHICKEN | CYCLE_START | ❌ No | ❌ No | ❌ No |
| ALPACA | BREEDING_DATE | ❌ No | ✅ Yes | ❌ No |
| LLAMA | BREEDING_DATE | ❌ No | ✅ Yes | ❌ No |

---

## Accuracy Improvements

| Anchor Mode | Birth Window | Confidence |
|-------------|--------------|------------|
| CYCLE_START | ±2-3 days | MEDIUM |
| OVULATION | ±1 day | HIGH |
| BREEDING_DATE | ±2-3 days | MEDIUM |

---

## Future Work (Phases 6-7)

### Phase 6: User Education
- Anchor mode selection UI in breeding drawer
- Educational tooltips explaining each mode
- "Upgrade to Ovulation" prompt card

### Phase 7: Educational Workflow Guidance
- ReconciliationCard showing variance analysis
- Pattern insights ("late ovulator", "early ovulator")
- Testing reminders based on species

---

## Testing

No breeding-specific Playwright tests exist. The implementation was verified via:
- TypeScript compilation (no errors in modified files)
- Pre-existing contract tests (unrelated to this feature)

Recommended test coverage:
1. API endpoint tests for `/lock` and `/upgrade-to-ovulation`
2. Timeline calculation tests for all anchor modes
3. Immutability validation tests
4. Species-specific behavior tests
