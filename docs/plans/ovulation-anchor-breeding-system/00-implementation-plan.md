# Ovulation-First Breeding Cycle System - Comprehensive Implementation Plan

## Executive Summary

Transform the breeding calculation system to support **species-aware dual anchor modes**: Cycle Start (for most breeders and species) and Ovulation Date (for professional dog/horse breeders using hormone testing). The system will intelligently use the best available anchor while maintaining backward compatibility across all 6 supported species.

**Key Insights from Research**:
- **Dogs**: Ovulation date (from progesterone testing) gives 63±1 day whelping prediction vs 63±2-3 days from cycle start
- **Horses**: Breeders already use ovulation-based timing (ultrasound confirmed) but system currently uses cycle start
- **Cats/Rabbits**: Induced ovulators - ovulation = breeding date (no cycle-start anchor needed)
- **Goats/Sheep**: Cycle-start anchor is standard, hormone testing infrastructure doesn't exist
- **Current system**: Uses cycle start for ALL species with species-specific offsets

---

## Research Completed ✅

### Task 1: Ovulation Testing Precision ✅

**Findings - Progesterone Testing:**
- Progesterone testing provides a **2-day window**, not a single day
- Day 0: Progesterone rises above 2 ng/mL (correlates with LH surge)
- Day 2: Progesterone reaches 5-8 ng/mL (ovulation occurs ~48 hours after LH surge)
- **Accuracy**: ±1 day (67%), ±2 days (90%), ±3 days (100%)
- Requires 3-4 tests over several days to follow trend
- More practical than catching brief 12-48 hour LH surge

**Findings - LH Testing:**
- LH surge is very precise but difficult to catch (lasts only 12-48 hours)
- Ovulation occurs 24-48 hours after LH surge
- Requires daily blood testing or easily missed

**Findings - How Vets Communicate:**
- Results given in ng/mL with specific thresholds
- <2 ng/mL: Pre-LH surge
- ~2 ng/mL: LH surge occurring
- 5-8 ng/mL: Ovulation happening
- Breeding timing varies by semen type (fresh vs frozen)

**Impact**: Store ovulation as **estimated date with ±1-2 day understood variance**, not as precise point-in-time.

### Task 2: Whelping Date Variance ✅

**Findings - From Ovulation:**
- **63 days ±1-2 days** when calculated from confirmed ovulation (highly reliable)
- Research shows: 64-66 days from LH surge, 63 days from ovulation

**Findings - From Breeding:**
- **56-70 days (63±7 days)** - highly variable because:
  - Sperm can survive many days in female reproductive tract
  - Eggs must mature 2-3 days post-ovulation before fertilization
  - Breeding often occurs before actual ovulation

**Findings - Factors Affecting Variance:**
- **Litter Size** (most significant): Negative correlation (r = -0.73 to -0.96)
  - Each puppy above average shortens gestation by ~0.25 days
  - Very large litters whelp slightly earlier
- **Breed Size**: Smaller breeds 58-63 days, larger breeds 63-68 days
  - But this may reflect typical litter size differences more than breed itself
- **Age/Parity**: Most studies found NO effect

**Findings - User's Comment:**
- "Mothers influence when whelping starts depending on temperament" - this was about **weaning/separation timing**, NOT labor initiation
- Labor duration: 3-6 hours typical (up to 20 hours possible)

**Impact**: Keep whelping date as **single date with ±1-2 day window** understanding. Variance is biological, not behavioral.

### Task 3: Hobbyist Breeder Workflows ✅

**Findings - Cycle Start Detection:**
- Definition: First day of bleeding (proestrus)
- **Major problem**: 50% of bitches have unnoticeable bleeding initially
- Breeders often miss true cycle start by several days
- Some females have very short proestrus, others bleed through into diestrus

**Findings - Proestrus Duration (Highly Variable):**
- Average: 9 days
- Range: 2-22 days (most sources cite 3-17 days)
- **No consistent "12 days from cycle start to ovulation"**
- Behavioral signs (standing for breeding) unreliable: can be 11 days before ovulation or 8 days after

**Findings - Detection Methods:**
1. **Vaginal Cytology**: Most accurate for identifying cycle stage
2. **Progesterone Testing**: Very accurate for pinpointing ovulation (requires same lab, same time of day)
3. **Home Kits**: NOT as accurate as veterinary testing
4. **Combined Approach**: Most accurate when pooling multiple test types

**Impact**: Cycle start is **inherently imprecise** - this is WHY progesterone testing became standard. Hobbyist breeders need education that cycle-start estimates have ±3-5 day variance.

### Task 6: Cycle Tracking Methodology (Ovulation-to-Ovulation vs Cycle-to-Cycle) ✅

**Critical Research Question:** Should cycles be tracked from cycle-start to cycle-start OR ovulation to ovulation?

**Findings - Veterinary Standard:**
- Veterinary literature measures "Inter-Estrus Interval (IEI)" from cycle-start to cycle-start
- Average IEI: 180-210 days (6-7 months)
- Range: 4-24 months depending on individual variation
- When vets say "6-month cycle", they mean first day of heat to first day of next heat

**Findings - Biological Reality:**
- **Ovulation-to-ovulation is MORE CONSISTENT than cycle-start to cycle-start**
- Proestrus duration varies wildly: 3-20 days (average 9 days)
- Same dog can have 10-day proestrus one cycle, 14-day proestrus next cycle
- Ovulation timing is tighter: 24-72 hours after LH surge
- Once ovulation confirmed, it's the more reliable anchor for prediction

**Findings - Research Quote:**
- **"Day counting [from cycle start] cannot be relied on for planning mating because ovulation timing varied between bitches, and cycles within the same bitch, with a range of 3 to 31 days after the onset of vulval bleeding."**
- This confirms cycle-start is inherently unreliable for prediction

**Findings - Best Practice:**
- For breeders doing progesterone testing: Track ovulation-to-ovulation
- Prediction: Last ovulation + 180-210 days = next expected ovulation
- More accurate than: Last cycle start + 180 days, then add ~12 days (which could be 9-18 days)

**Impact**:
- **Display to users:** "Cycle length" (cycle-start to cycle-start) for veterinary consistency
- **Calculate internally:** Next ovulation prediction from ovulation-to-ovulation (more accurate)
- **When progesterone testing used:** Ovulation dates become primary anchor for future cycle prediction
- **Platform education:** Teach Rene that ovulation dates give better predictions than cycle-start dates

### Task 4: Multi-Species Reproductive Patterns ✅

**Critical Finding - Species Fall Into Three Categories:**

**Category 1: Spontaneous Ovulators with Hormone Testing Infrastructure**
- **DOG**: Cycle start → 12 days → Ovulation → 63 days → Birth
  - Progesterone testing widely available
  - Current anchor (cycle start) works but ovulation is more accurate
  - Risk of change: MODERATE (breeders may not have ovulation data)

- **HORSE**: Cycle start → 5 days → Ovulation → 340 days → Birth
  - Ultrasound ovulation confirmation very common in breeding practice
  - Breeders ALREADY use ovulation-based timing
  - Current system using cycle start is WRONG for horses!
  - Risk of change: LOW (aligns with veterinary practice)

**Category 2: Induced Ovulators (Ovulation = Breeding)**
- **CAT**: Breeding → 36 hours → Ovulation → 63 days → Birth
  - Ovulates only when bred/stimulated
  - "Cycle start" doesn't represent true cycle (receptivity window)
  - Ovulation date IS breeding date
  - Risk of change: NONE (just clarify terminology)

- **RABBIT**: Breeding → immediate → Ovulation → 31 days → Birth
  - Ovulates only when bred
  - Code already notes: "receptivity windows, not true estrous cycles"
  - Ovulation offset = 0 days
  - Risk of change: NONE (already effectively ovulation-anchored)

**Category 3: Spontaneous Ovulators WITHOUT Testing Infrastructure**
- **GOAT**: Cycle start → 2 days → Ovulation → 150 days → Birth
  - Hormone testing rarely available
  - Breeders rely on visual signs
  - Risk of change: HIGH (no ovulation data available)

- **SHEEP**: Cycle start → 2 days → Ovulation → 147 days → Birth
  - Seasonal breeder (fall/winter only)
  - Hormone testing rarely available
  - Risk of change: HIGH (no ovulation data available)

**Species-Specific UI Components Affected:**
- `FoalingMilestoneChecklist.tsx` - Horse-specific, uses breed date + offset days
- All Gantt/Calendar views - species-specific terminology (whelping vs foaling vs kindling)
- Waitlist matching - litter-based (dogs/cats/rabbits/goats/sheep) vs individual (horses)

**Implication**: Any anchor date change MUST be **species-aware** with different defaults and migration paths per species.

### Task 5: Complete System Dependency Map ✅

**Mapped ALL 127 locations** where breeding plan date fields are read/used across:
- 15 UI components (Gantt charts, calendars, dashboards, journey, cards)
- 3 adapter layers (planWindows.ts, planToGantt.ts, normalization)
- 6 reproEngine calculation functions
- 1 massive API route file (breeding.ts - 2719 lines)
- 8 E2E test files with hardcoded date offsets
- 6 species-specific default configurations
- Multiple immutability validation rules

**Critical Choke Points Identified:**
1. **`timelineFromSeed.ts`** - Core calculation engine, currently assumes cycle-start anchor
2. **`planWindows.ts`** - Universal adapter, all UI components depend on it
3. **`breeding.ts` (API)** - Lines 1080-1138: birth date immutability rules
4. **`deriveBreedingStatus.ts`** - Status transitions based on date presence
5. **`FoalingMilestoneChecklist.tsx`** - Breed date + offset calculation for horses

**Breaking Points if Anchor Changes:**
- Gantt phase windows (rely on cycle-start seed)
- Calendar event rendering (uses windowsFromPlan adapter)
- What-if scenario calculations (synthetic cycle starts)
- Foaling milestones (currently breed date + X days, should be ovulation + X days?)
- E2E tests (hardcoded day offsets in assertions)
- Offspring birth date linking (expects consistent timeline)
- Waitlist placement matching (expects consistent placement windows)

**Test Coverage Required:**
- All 6 species with different anchor configurations
- Migration paths for existing plans (especially horses with ultrasound data)
- Backward compatibility for plans without ovulation data
- Immutability rules when switching anchors mid-plan
- Dashboard aggregations and filtering by date ranges
- Calendar availability blocking (travel risky/unlikely windows)

---

## Current System Analysis

### How Cycle Locking Works TODAY

**File:** `apps/breeding/src/App-Breeding.tsx` (Lines 7772-7868)

**Current Flow:**
```typescript
async function lockCycle() {
  1. User enters pendingCycle (cycle start date)
  2. Call computeExpectedForPlan({ species, lockedCycleStart: pendingCycle })
  3. reproEngine calculates all expected dates FROM cycle start
  4. Save to database:
     - lockedCycleStart: "2026-03-15"
     - lockedOvulationDate: "2026-03-27" (calculated: cycleStart + 12 days)
     - lockedDueDate: "2026-05-29" (calculated: ovulation + 63 days)
     - expectedCycleStart, expectedBreedDate, expectedBirthDate, etc.
  5. Create CYCLE_LOCKED event in audit log
  6. Plan status advances to COMMITTED
}
```

**Current Data Model:**
```typescript
// Existing fields in BreedingPlan
{
  lockedCycleStart: "2026-03-15",           // User-entered cycle start
  lockedOvulationDate: "2026-03-27",        // Calculated from cycleStart
  lockedDueDate: "2026-05-29",              // Calculated from ovulation
  cycleStartDateActual: null,               // Filled in later
  breedDateActual: null,                    // Filled in later
  birthDateActual: null,                    // Filled in later
  weanedDateActual: null,                   // Filled in later
  status: "COMMITTED"                       // Set when locked
}
```

**Key Insight:** Your system ALREADY stores `lockedOvulationDate` - it's just CALCULATED, not user-entered.

### How Recalculation Works TODAY

**File:** `apps/breeding/src/App-Breeding.tsx` (Lines 7933-8004)

**Current Priority Chain:**
```typescript
function recalculateExpectedDatesFromActual(actualCycleStart, actualBirthDate) {
  // Priority 1: BIRTH (highest)
  if (actualBirthDate) {
    return buildTimelineFromBirth(actualBirthDate)
    // Returns: { expectedWeaned, expectedPlacementStart, expectedPlacementCompleted }
    // Pre-birth dates set to NULL (birth is most accurate anchor)
  }

  // Priority 2: CYCLE START (medium)
  if (actualCycleStart) {
    return computeExpectedForPlan({ lockedCycleStart: actualCycleStart })
    // Returns: ALL expected dates recalculated from cycle start
  }

  // No actual dates available
  return null
}
```

**What We're Adding:** Priority 1.5 - OVULATION (between birth and cycle start)

### How Status Derivation Works TODAY

**File:** `apps/breeding/src/pages/planner/deriveBreedingStatus.ts` (Line 141)

**Current Logic:**
```typescript
const hasCommitPrereqs = hasBasics && p.sireId != null && hasDate(p.lockedCycleStart);

// COMMITTED requires:
// - Basic fields (name, species, damId)
// - Sire selected
// - lockedCycleStart filled in
```

**What We're Adding:** Allow `ovulationConfirmed` as ALTERNATIVE to `lockedCycleStart`

### How Species Terminology Works TODAY

**File:** `packages/ui/src/utils/speciesTerminology.ts`

**Current Pattern:**
```typescript
export function getSpeciesTerminology(species: Species): SpeciesTerminology {
  return {
    offspring: { singular: "puppy", plural: "puppies" },
    birth: { verb: "whelping", noun: "whelp" },
    // etc.
  }
}
```

**What We're Adding:** New fields for `cycle`, `ovulation`, `anchorMode`, `weaning`

---

## Recommended Approach: Progressive Enhancement with Species-Aware Hybrid Mode

Based on comprehensive research, veterinary best practices, and user context:

### Core Architecture Decision: PROGRESSIVE ENHANCEMENT (HYBRID UNDER THE HOOD)

**Why Progressive/Hybrid:**
- ✅ **Matches real-world workflow:** Breeders observe cycle start FIRST, THEN get progesterone tests 5-14 days later
- ✅ **Veterinary best practice:** Testing starts day 5-6 after heat signs, not before cycle observed
- ✅ **Supports Rene's workflow:** She observes heat, then decides to test (reactive approach)
- ✅ **Enables data validation:** Flag impossible dates (ovulation before cycle start)
- ✅ **Machine learning potential:** Track individual female variance across breeding cycles

**Implementation Strategy:**
1. Store BOTH `cycleStartObserved` and `ovulationConfirmed` when available
2. System auto-detects best anchor based on data quality
3. User-facing: "Upgrade to Ovulation Anchor" button (progressive)
4. Backend: Hybrid fields enable validation and learning

### Species-Specific Approach

**For DOGS** (Primary Focus - Rene's Use Case):
1. **Default to Cycle Start** (observed heat signs - always available)
2. **Progressive upgrade path**: When progesterone test results come in (day 5-14 of cycle)
3. **Hybrid storage**: Keep both cycle start observation AND ovulation confirmation
4. **Validation**: Flag if ovulation doesn't align with expected timing (cycle + 12±2 days)
5. **Learning**: Track variance for each female across multiple breeding cycles
6. **UI shows**: "Cycle-Anchored (Medium Confidence)" → "Ovulation-Anchored (High Confidence)" after upgrade
7. **Education**: Platform teaches proper progesterone testing timing (day 5-6, not reactive guessing)

**For HORSES** (Veterinary Practice Already Ovulation-Based):
1. **Prioritize Ovulation anchor** when ultrasound data exists (very common for horse breeders)
2. **Terminology via speciesTerminology.ts**: "Foaling" not "Whelping"
3. **Update FoalingMilestoneChecklist**: Calculate from ovulation, not breed date
4. **Migration**: Existing plans with ultrasound data can be upgraded
5. **Weaning**: REQUIRED field (critical 4-6 month milestone for horses per veterinary research)

**For CATS/RABBITS** (Induced Ovulators):
1. **Terminology**: "Breeding Date" instead of "Cycle Start" (extend speciesTerminology.ts)
2. **No traditional cycle**: Ovulation = breeding event (0-day offset for rabbits)
3. **UI labels**: Make clear these species don't have heat cycles like dogs
4. **Anchor mode**: Default to BREEDING_DATE (which is effectively ovulation)

**For GOATS/SHEEP** (No Testing Infrastructure):
1. **Keep Cycle Start anchor**: No alternative data available
2. **No changes needed**: Current system appropriate for these species
3. **Document variance**: Make ±3-5 day uncertainty visible to users

### Weaning Date Handling (Based on Research)

**Research Findings:**
- ❌ NO breed registry (AKC, AQHA, UKC, CFA, TICA, ARBA) requires weaning date
- 🐴 HORSES: Weaning is CRITICAL milestone (vets recommend documenting, 4-6 month distinct event)
- 🐕 DOGS: Weaning is GRADUAL process (3-4 weeks, not distinct milestone, placement readiness more important)

**Implementation:**
- Keep `weanedDateActual` field (backward compatibility)
- **Species-specific requirement:**
  - HORSE: Weaning REQUIRED for status transition BIRTHED → WEANED → PLACEMENT_STARTED
  - DOG/CAT/RABBIT/GOAT/SHEEP: Weaning OPTIONAL, can skip BIRTHED → PLACEMENT_STARTED
- Platform encourages Rene to track important milestones (horses) without overwhelming her (dogs)

### Species Terminology Integration

**Leverage existing speciesTerminology.ts:**
- Extend with `cycle`, `ovulation`, and `anchorMode` fields
- DOG: "heat start" vs HORSE: "cycle start" vs CAT/RABBIT: "breeding date"
- All anchor-related UI text becomes species-aware
- Fix hardcoded "foaling" references in breeding app tabs

### Universal Principles

1. **Species-aware defaults**: Different anchor recommendations per species
2. **Backward compatibility**: All existing plans continue working unchanged
3. **Clear confidence levels**: HIGH (hormone-tested), MEDIUM (observed cycle), LOW (estimated)
4. **Progressive adoption**: Start with cycle start, upgrade when tests available
5. **Data preservation**: Never lose original dates, store both for validation/learning
6. **Platform education**: Teach Rene proper testing timing (day 5-6 after heat signs)

---

## Phase 0: Species Terminology Extension (Foundation)

### 0.1 Extend speciesTerminology.ts

**File**: `packages/ui/src/utils/speciesTerminology.ts`

**Add to SpeciesTerminology interface** (after line 68):

```typescript
export interface SpeciesTerminology {
  // ... existing fields: offspring, birth, group, parents, care, features ...

  /** NEW: Reproductive cycle terminology for anchor mode */
  cycle: {
    /** Cycle start label (e.g., "heat start" for dogs, "cycle start" for horses, "breeding" for cats) */
    startLabel: string;
    startLabelCap: string;
    /** What to call the anchor date in UI */
    anchorDateLabel: string;
    /** Explanation text for this species' cycle characteristics */
    cycleExplanation?: string;
    /** Species-specific guidance for cycle start observation */
    cycleStartHelp: string;
    /** Breeding date label (may differ from cycle anchor) */
    breedingDateLabel: string;
  };

  /** NEW: Ovulation terminology and confirmation methods */
  ovulation: {
    label: string; // Usually "ovulation" for all species
    dateLabel: string; // "Ovulation date"
    /** Standard confirmation method for this species */
    confirmationMethod: string; // "progesterone test" for dogs, "ultrasound" for horses
    /** Educational guidance about ovulation for this species */
    guidanceText: string;
    /** Available confirmation methods for this species */
    confirmationMethods: string[];
    /** When to start testing (species-specific) */
    testingGuidance: string;
  };

  /** NEW: Anchor mode recommendations and metadata */
  anchorMode: {
    /** Available anchor options for this species */
    options: Array<{
      type: 'CYCLE_START' | 'OVULATION' | 'BREEDING_DATE';
      label: string;                // "Heat Start Date" for dogs
      description: string;          // User-facing help text
      accuracy: string;             // "±2-3 days"
      recommended: boolean;         // Show ⭐ badge
      testingAvailable: boolean;    // Can user confirm this anchor?
      confirmationMethods?: string[]; // ["Progesterone Test", "Ultrasound"]
    }>;
    /** Recommended primary anchor for this species */
    recommended: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
    /** Default/recommended anchor for new plans */
    defaultAnchor: 'CYCLE_START' | 'OVULATION' | 'BREEDING_DATE';
    /** Whether ovulation testing is commonly available */
    testingAvailable: boolean;
    /** Whether testing is standard practice (available vs common) */
    testingCommon: boolean;
    /** Can users upgrade from one anchor to another? */
    supportsUpgrade: boolean;
    upgradeFrom?: 'CYCLE_START';
    upgradeTo?: 'OVULATION';
    /** Is this an induced ovulator? (affects UI messaging) */
    isInducedOvulator: boolean;
    /** Help text shown when breeder chooses anchor mode */
    guidanceText: string;
  };

  /** NEW: Weaning importance metadata */
  weaning: {
    /** Is weaning a distinct event or gradual process? */
    type: "DISTINCT_EVENT" | "GRADUAL_PROCESS";
    weaningType: 'DISTINCT_EVENT' | 'GRADUAL_PROCESS';
    /** Should weaning date be required for this species? */
    requiredForStatus: boolean;
    required: boolean;
    /** Typical weaning age in weeks */
    typicalWeeks: number;
    estimatedDurationWeeks: number;
    /** Veterinary guidance about weaning */
    guidanceText: string;
    /** Status label for weaning milestone */
    statusLabel: string;
    /** Actual date field label */
    actualDateLabel: string;
  };
}
```

**Example implementation for DOG:**

```typescript
DOG: {
  // ... existing fields (offspring, birth, group, parents, care, features) ...

  cycle: {
    startLabel: "heat start",
    startLabelCap: "Heat Start",
    anchorDateLabel: "Heat start date",
    cycleExplanation: "First day of visible bleeding (proestrus). Note: 50% of bitches have minimal bleeding initially.",
    cycleStartHelp: 'Record the first day you observe heat signs (swelling, discharge, behavioral changes)',
    breedingDateLabel: 'Breeding Date(s)',
  },

  ovulation: {
    label: "ovulation",
    dateLabel: "Ovulation date",
    confirmationMethod: "progesterone blood test",
    guidanceText: "Ovulation occurs 12±2 days after heat start. Progesterone testing provides ±1 day accuracy. Testing should begin day 5-6 after heat signs appear.",
    confirmationMethods: ['Progesterone Test', 'LH Test', 'Vaginal Cytology'],
    testingGuidance: 'Start progesterone testing on day 5-6 after heat signs appear. Test every 2-3 days until levels reach 5.0-6.0 ng/mL.',
  },

  anchorMode: {
    options: [
      {
        type: 'CYCLE_START',
        label: 'Heat Start Date',
        description: 'Best for: Getting started quickly',
        accuracy: '±2-3 days',
        recommended: false,
        testingAvailable: false,
      },
      {
        type: 'OVULATION',
        label: 'Ovulation Date',
        description: 'Best for: Maximum accuracy (recommended)',
        accuracy: '±1 day',
        recommended: true,
        testingAvailable: true,
        confirmationMethods: ['Progesterone Test', 'LH Test', 'Vaginal Cytology']
      }
    ],
    recommended: "OVULATION",
    defaultAnchor: 'CYCLE_START',
    testingAvailable: true,
    testingCommon: false, // Available but not all hobbyists use it
    supportsUpgrade: true,
    upgradeFrom: 'CYCLE_START',
    upgradeTo: 'OVULATION',
    isInducedOvulator: false,
    guidanceText: "For best accuracy, use progesterone testing to confirm ovulation. Birth is 63 days from ovulation (±1 day) vs 75 days from heat start (±2-3 days).",
  },

  weaning: {
    type: "GRADUAL_PROCESS",
    weaningType: 'GRADUAL_PROCESS',
    requiredForStatus: false,
    required: false,
    typicalWeeks: 6,
    estimatedDurationWeeks: 8,
    guidanceText: "Weaning is a gradual 3-4 week process (weeks 3-8). Puppies benefit from staying with mother 10-12 weeks for behavioral development. Recording weaning date is optional.",
    statusLabel: 'Weaned',
    actualDateLabel: 'Weaning Completed',
  },
},
```

**Example implementation for HORSE:**

```typescript
HORSE: {
  // ... existing fields ...

  cycle: {
    startLabel: "cycle start",
    startLabelCap: "Cycle Start",
    anchorDateLabel: "Cycle start date",
    cycleExplanation: "First day of estrus behavior. Mares have 21-day cycles on average.",
    cycleStartHelp: 'Record the first day of estrus/heat',
    breedingDateLabel: 'Breeding Date',
  },

  ovulation: {
    label: "ovulation",
    dateLabel: "Ovulation date",
    confirmationMethod: "veterinary ultrasound",
    guidanceText: "Ovulation occurs 5±2 days after cycle start (highly variable). Ultrasound confirmation is standard practice for horse breeders. Foaling is 340±10 days from ovulation.",
    confirmationMethods: ['Ultrasound', 'Palpation'],
    testingGuidance: 'Veterinary ultrasound monitoring typically requires 3-5 exams during heat to confirm ovulation.',
  },

  anchorMode: {
    options: [
      {
        type: 'CYCLE_START',
        label: 'Cycle Start Date',
        description: 'Best for: Natural cover breeding',
        accuracy: '±5-7 days',
        recommended: false,
        testingAvailable: false
      },
      {
        type: 'OVULATION',
        label: 'Ovulation Date',
        description: 'Best for: AI breeding, maximum accuracy',
        accuracy: '±3 days',
        recommended: true,
        testingAvailable: true,
        confirmationMethods: ['Ultrasound', 'Palpation']
      }
    ],
    recommended: "OVULATION",
    defaultAnchor: 'CYCLE_START',
    testingAvailable: true,
    testingCommon: true, // Standard practice for horse breeders
    supportsUpgrade: true,
    upgradeFrom: 'CYCLE_START',
    upgradeTo: 'OVULATION',
    isInducedOvulator: false,
    guidanceText: "Most horse breeders use ultrasound to confirm ovulation. This is the veterinary standard for accurate foaling date prediction.",
  },

  weaning: {
    type: "DISTINCT_EVENT",
    weaningType: 'DISTINCT_EVENT',
    requiredForStatus: true,
    required: true,
    typicalWeeks: 20, // 4-6 months
    estimatedDurationWeeks: 20,
    guidanceText: "Weaning is a critical milestone for horses (4-6 months). Veterinarians recommend documenting weaning date for health monitoring (ulcers, stress, nutrition).",
    statusLabel: 'Weaned',
    actualDateLabel: 'Weaning Date',
  },
},
```

**Example implementation for CAT (Induced Ovulator):**

```typescript
CAT: {
  // ... existing fields ...

  cycle: {
    startLabel: "breeding",
    startLabelCap: "Breeding",
    anchorDateLabel: "Breeding date",
    cycleExplanation: "Cats are induced ovulators - they ovulate when bred. There is no traditional heat cycle.",
    cycleStartHelp: 'Cats are induced ovulators - breeding triggers ovulation within 24-48 hours',
    breedingDateLabel: 'Breeding Date',
  },

  ovulation: {
    label: "ovulation",
    dateLabel: "Ovulation Date (Auto-calculated)",
    confirmationMethod: "occurs automatically when bred",
    guidanceText: "Cats ovulate within 24 hours of breeding. Breeding date IS the ovulation anchor. Birth occurs 63±2 days later.",
    confirmationMethods: [],
    testingGuidance: 'No testing needed - breeding itself triggers ovulation',
  },

  anchorMode: {
    options: [
      {
        type: 'BREEDING_DATE',
        label: 'Breeding Date',
        description: 'Standard for cats (induced ovulators)',
        accuracy: '±2-3 days',
        recommended: true,
        testingAvailable: false
      }
    ],
    recommended: "BREEDING_DATE",
    defaultAnchor: 'BREEDING_DATE',
    testingAvailable: false,
    testingCommon: false,
    supportsUpgrade: false,
    isInducedOvulator: true,
    guidanceText: "Cats ovulate when bred. Enter breeding date as the anchor - this is when ovulation occurs.",
  },

  weaning: {
    type: "GRADUAL_PROCESS",
    weaningType: 'GRADUAL_PROCESS',
    requiredForStatus: false,
    required: false,
    typicalWeeks: 8,
    estimatedDurationWeeks: 8,
    guidanceText: "Kittens wean gradually over 4-8 weeks. Recording weaning date is optional.",
    statusLabel: 'Weaned',
    actualDateLabel: 'Weaning Completed (Optional)',
  },
},
```

**Example implementation for RABBIT:**

```typescript
RABBIT: {
  // Similar to CAT (induced ovulator)
  anchorMode: {
    options: [
      {
        type: 'BREEDING_DATE',
        label: 'Breeding Date',
        description: 'Standard for rabbits (induced ovulators)',
        accuracy: '±1 day',
        recommended: true,
        testingAvailable: false
      }
    ],
    defaultAnchor: 'BREEDING_DATE',
    supportsUpgrade: false,
    isInducedOvulator: true
  },
  // ... similar to CAT
},
```

**Example implementation for GOAT:**

```typescript
GOAT: {
  // ... existing fields ...

  anchorMode: {
    options: [
      {
        type: 'CYCLE_START',
        label: 'Cycle Start Date',
        description: 'Standard for goats',
        accuracy: '±3-5 days',
        recommended: true,
        testingAvailable: false
      }
    ],
    defaultAnchor: 'CYCLE_START',
    supportsUpgrade: false,
    isInducedOvulator: false
  },

  cycle: {
    anchorDateLabel: 'Cycle Start Date',
    breedingDateLabel: 'Breeding Date(s)',
    cycleStartHelp: 'Record when heat signs are first observed'
  },

  ovulation: {
    dateLabel: 'Ovulation Date',
    confirmationMethods: [],
    testingGuidance: 'Ovulation testing not commonly used for goats'
  },

  weaning: {
    required: false,
    statusLabel: 'Weaned',
    actualDateLabel: 'Weaning Date (Optional)',
    estimatedDurationWeeks: 8,
    weaningType: 'GRADUAL_PROCESS'
  }
},
```

**Add helper functions:**

```typescript
export function getCycleLabel(species: string | null | undefined, capitalize: boolean = false): string {
  const terms = getSpeciesTerminology(species);
  return capitalize ? terms.cycle.startLabelCap : terms.cycle.startLabel;
}

export function getOvulationGuidance(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.ovulation.guidanceText;
}

export function getRecommendedAnchorMode(species: string | null | undefined): "CYCLE_START" | "OVULATION" | "BREEDING_DATE" {
  const terms = getSpeciesTerminology(species);
  return terms.anchorMode.recommended;
}

export function isWeaningRequired(species: string | null | undefined): boolean {
  const terms = getSpeciesTerminology(species);
  return terms.weaning.requiredForStatus;
}

export function getWeaningGuidance(species: string | null | undefined): string {
  const terms = getSpeciesTerminology(species);
  return terms.weaning.guidanceText;
}

export function getAvailableAnchors(species: Species) {
  const terminology = getSpeciesTerminology(species);
  return terminology.anchorMode.options;
}

export function supportsOvulationUpgrade(species: Species): boolean {
  const terminology = getSpeciesTerminology(species);
  return terminology.anchorMode.supportsUpgrade;
}

export function isInducedOvulator(species: Species): boolean {
  const terminology = getSpeciesTerminology(species);
  return terminology.anchorMode.isInducedOvulator;
}
```

### 0.2 Fix Hardcoded Species Terms

**Audit breeding app for hardcoded terms:**

**File**: `apps/breeding/src/App-Breeding.tsx`

**Lines 118-119 (Tab labels):**
```typescript
// BEFORE (hardcoded):
{ key: "foaling-checklist", label: "Foaling Checklist" },
{ key: "foaling-outcome", label: "Foaling Outcome" },

// AFTER (species-aware):
{
  key: "birth-checklist",
  label: `${getBirthProcess(selectedPlan?.species, true)} Checklist`
}, // "Foaling Checklist" for horses, "Whelping Checklist" for dogs
{
  key: "birth-outcome",
  label: `${getBirthProcess(selectedPlan?.species, true)} Outcome`
},
```

**Run ESLint rule** to find other violations:
```bash
npm run lint -- --rule @bhq/no-hardcoded-species-terms
```

---

## Phase 1: Database Schema Enhancement

### 1.1 Add Anchor Mode Fields to BreedingPlan

**File**: `breederhq-api/prisma/schema.prisma`

**Add to BreedingPlan model** (around line 3166):

```prisma
model BreedingPlan {
  // ... existing fields ...

  // EXISTING LOCKED DATES (keep for backward compatibility)
  lockedCycleStart         DateTime?
  lockedOvulationDate      DateTime?
  lockedDueDate            DateTime?
  lockedPlacementStartDate DateTime?

  // NEW: Hybrid anchor system (stores BOTH when available)
  reproAnchorMode          ReproAnchorMode @default(CYCLE_START)

  // Cycle start tracking (observed or derived)
  cycleStartObserved       DateTime?       // When breeder observed heat signs
  cycleStartSource         DataSource?     // How cycle start was determined
  cycleStartConfidence     ConfidenceLevel?

  // Ovulation tracking (confirmed or calculated)
  ovulationConfirmed       DateTime?       // When ovulation was hormone-confirmed
  ovulationConfirmedMethod OvulationMethod?
  ovulationTestResultId    Int?
  ovulationTestResult      TestResult?     @relation(name: "OvulationAnchor", fields: [ovulationTestResultId], references: [id], onDelete: SetNull)
  ovulationConfidence      ConfidenceLevel?

  // System determines primary anchor based on data quality
  primaryAnchor            AnchorType      @default(CYCLE_START)

  // Variance tracking (for machine learning)
  expectedOvulationOffset  Int?            // Species default offset (e.g., 12 days for dogs)
  actualOvulationOffset    Int?            // Calculated: ovulationConfirmed - cycleStartObserved
  varianceFromExpected     Int?            // actualOffset - expectedOffset (e.g., +2 = 2 days late)

  // General metadata
  dateConfidenceLevel      ConfidenceLevel? @default(MEDIUM)
  dateSourceNotes          String?

  // ... rest of existing fields ...
}

enum ReproAnchorMode {
  CYCLE_START     // Traditional: heat/cycle observation only
  OVULATION       // Professional: hormone-tested ovulation only
  BREEDING_DATE   // For induced ovulators (cats/rabbits)
}

enum AnchorType {
  CYCLE_START     // Primary calculation from cycle start
  OVULATION       // Primary calculation from ovulation
  BREEDING_DATE   // For induced ovulators (cats/rabbits)
  BIRTH          // Post-birth timeline
  LOCKED_CYCLE   // Legacy fallback
}

enum DataSource {
  OBSERVED        // Breeder directly observed (cycle start, breeding date)
  DERIVED         // Calculated from another date (cycle start derived from ovulation)
  ESTIMATED       // User's best guess (low confidence)
}

enum OvulationMethod {
  CALCULATED          // Derived from cycle start + species offset
  PROGESTERONE_TEST   // Blood progesterone testing (day 5-14 of cycle)
  LH_TEST             // Luteinizing hormone test
  ULTRASOUND          // Veterinary ultrasound (common for horses)
  VAGINAL_CYTOLOGY    // Microscopic cell analysis
  PALPATION           // Physical exam for horses
  AT_HOME_TEST        // Consumer ovulation test kit
  VETERINARY_EXAM     // Physical examination by vet
  BREEDING_INDUCED    // For cats/rabbits
}

enum ConfidenceLevel {
  HIGH      // Hormone-tested ovulation (±1-2 days)
  MEDIUM    // Observed cycle start (±2-5 days)
  LOW       // Estimated/guessed dates (±5+ days)
}
```

### 1.2 Add Reverse Relation to TestResult

**Add to TestResult model**:

```prisma
model TestResult {
  // ... existing fields ...

  // NEW: Track which plans use this test for ovulation anchor
  anchoredPlans BreedingPlan[] @relation("OvulationAnchor")

  // NEW: Helper field to indicate ovulation timing
  indicatesOvulationDate DateTime?  // When test indicates ovulation occurred
}
```

### 1.3 Migration Script

**File**: `breederhq-api/prisma/migrations/YYYYMMDD_add_anchor_mode.sql`

```sql
-- Add new enum types
CREATE TYPE "ReproAnchorMode" AS ENUM ('CYCLE_START', 'OVULATION', 'BREEDING_DATE');
CREATE TYPE "AnchorType" AS ENUM ('CYCLE_START', 'OVULATION', 'BIRTH', 'LOCKED_CYCLE', 'BREEDING_DATE');
CREATE TYPE "OvulationMethod" AS ENUM ('CALCULATED', 'PROGESTERONE_TEST', 'LH_TEST', 'ULTRASOUND', 'VAGINAL_CYTOLOGY', 'PALPATION', 'BREEDING_INDUCED', 'AT_HOME_TEST', 'VETERINARY_EXAM');
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "DataSource" AS ENUM ('OBSERVED', 'DERIVED', 'ESTIMATED');

-- Add new columns to BreedingPlan
ALTER TABLE "BreedingPlan"
  ADD COLUMN "reproAnchorMode" "ReproAnchorMode" DEFAULT 'CYCLE_START',
  ADD COLUMN "cycleStartObserved" TIMESTAMP(3),
  ADD COLUMN "cycleStartSource" "DataSource",
  ADD COLUMN "cycleStartConfidence" "ConfidenceLevel",
  ADD COLUMN "ovulationConfirmed" TIMESTAMP(3),
  ADD COLUMN "ovulationConfirmedMethod" "OvulationMethod",
  ADD COLUMN "ovulationTestResultId" INTEGER,
  ADD COLUMN "ovulationConfidence" "ConfidenceLevel",
  ADD COLUMN "primaryAnchor" TEXT DEFAULT 'CYCLE_START',
  ADD COLUMN "expectedOvulationOffset" INTEGER,
  ADD COLUMN "actualOvulationOffset" INTEGER,
  ADD COLUMN "varianceFromExpected" INTEGER,
  ADD COLUMN "dateConfidenceLevel" "ConfidenceLevel" DEFAULT 'MEDIUM',
  ADD COLUMN "dateSourceNotes" TEXT;

-- Add new column to TestResult
ALTER TABLE "TestResult"
  ADD COLUMN "indicatesOvulationDate" TIMESTAMP(3);

-- Add foreign key constraint
ALTER TABLE "BreedingPlan"
  ADD CONSTRAINT "BreedingPlan_ovulationTestResultId_fkey"
  FOREIGN KEY ("ovulationTestResultId")
  REFERENCES "TestResult"("id")
  ON DELETE SET NULL;

-- Backfill existing data: all existing plans use CYCLE_START mode
-- Plans with lockedOvulationDate but no hormone test are still CALCULATED
UPDATE "BreedingPlan"
SET
  "cycleStartObserved" = "lockedCycleStart",
  "reproAnchorMode" = 'CYCLE_START',
  "primaryAnchor" = 'CYCLE_START',
  "cycleStartConfidence" = 'MEDIUM',
  "ovulationConfirmedMethod" = 'CALCULATED',
  "dateConfidenceLevel" = 'MEDIUM'
WHERE "lockedCycleStart" IS NOT NULL;

-- For induced ovulators (CAT, RABBIT), set to BREEDING_DATE mode if breedDateActual exists
UPDATE "BreedingPlan"
SET "reproAnchorMode" = 'BREEDING_DATE'
WHERE "species" IN ('CAT', 'RABBIT') AND "breedDateActual" IS NOT NULL;
```

### 1.4 Immutability Rules Matrix ✅ CRITICAL GAP #3 RESOLVED

**Purpose**: Define clear rules for what can/cannot change after plan is locked, preventing data corruption.

**Immutability Matrix by Breeding Phase:**

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

**Implementation Location**: Phase 3 (API validation middleware)

---

## Phase 2: Calculation Engine Enhancement (ReproEngine)

### 2.1 Create Ovulation-Centric Timeline Builder

**File**: `packages/ui/src/utils/reproEngine/timelineFromSeed.ts`

**Add new function** (after line 140):

```typescript
/**
 * Build breeding timeline from confirmed ovulation date as primary anchor.
 *
 * This is the veterinary-preferred method when ovulation is hormone-tested.
 * Works BACKWARD to estimate cycle start, and FORWARD to calculate birth.
 * More accurate than cycle-start based timeline (±1 day vs ±2-3 days).
 *
 * @param summary - Reproductive summary for the animal
 * @param confirmedOvulation - Hormone-tested or ultrasound-confirmed ovulation date
 * @returns Complete timeline with tighter birth window (±1 day instead of ±2)
 */
export function buildTimelineFromOvulation(
  summary: ReproSummary,
  confirmedOvulation: ISODate
): ReproTimeline {
  const ovulationDate = assertIsoDate(confirmedOvulation, "confirmedOvulation");
  const species = summary.species;
  const d = getSpeciesDefaults(species);

  // BACKWARD CALCULATION: Derive estimated cycle start
  // Note: This is an ESTIMATE - individual females may vary ±2 days
  const estimatedCycleStart = addDays(ovulationDate, -d.ovulationOffsetDays);

  // FORWARD CALCULATION: Birth from confirmed ovulation (highly reliable)
  const birthExpected = addDays(ovulationDate, d.gestationDays);

  // Breeding window: ovulation ±1 day
  const breedingFull = makeRangeTuple(
    addDays(ovulationDate, -1),
    addDays(ovulationDate, 2)
  );
  const breedingLikely = makeRangeTuple(
    ovulationDate,
    addDays(ovulationDate, 1)
  );

  // Birth: gestation days from ovulation (HIGH confidence)
  // With confirmed ovulation, birth window is tighter (±1 day vs ±2)
  const birthCenter = addDays(ovulationDate, d.gestationDays);
  const birthFull: RangeTuple = makeRangeTuple(
    addDays(birthExpected, -1),
    addDays(birthExpected, 1)
  );
  const birthLikely: RangeTuple = [birthExpected, birthExpected] as RangeTuple;

  // Pre-breeding windows (work backward from ovulation)
  const preBreedingFull: RangeTuple = makeRangeTuple(
    addDays(estimatedCycleStart, -d.startBufferDays),
    addDays(ovulationDate, -1)
  );
  const preBreedingLikely = centerRangeTuple(estimatedCycleStart, 5);

  // Hormone testing window (leading up to ovulation)
  const hormoneFull: RangeTuple = makeRangeTuple(
    addDays(estimatedCycleStart, 7),
    ovulationDate
  );
  const hormoneLikely: RangeTuple = makeRangeTuple(
    addDays(preBreedingLikely[1], 1),
    addDays(preBreedingLikely[1], 7)
  );

  // Post-birth windows (same logic as cycle-based)
  const offspringCareWeeks = d.offspringCareDurationWeeks;
  const offspringCareFull: RangeTuple = makeRangeTuple(
    birthFull[0],
    addDays(birthFull[1], offspringCareWeeks * 7)
  );
  const offspringCareLikely: RangeTuple = makeRangeTuple(
    birthLikely[0],
    addDays(birthLikely[0], offspringCareWeeks * 7)
  );

  const placementWeeks = d.placementStartWeeksDefault;
  const placementNormalFull: RangeTuple = makeRangeTuple(
    addDays(birthFull[0], placementWeeks * 7),
    addDays(birthFull[1], placementWeeks * 7)
  );
  const placementNormalLikelyCenter = addDays(birthLikely[0], placementWeeks * 7);
  const placementNormalLikely = centerRangeTuple(placementNormalLikelyCenter, 1);

  const placementExtendedFull: RangeTuple = makeRangeTuple(
    placementNormalFull[1],
    addDays(placementNormalFull[1], d.placementExtendedWeeks * 7)
  );

  // Travel availability bands
  const travelRisky1: RangeTuple = makeRangeTuple(hormoneFull[0], breedingFull[1]);
  const travelRisky2: RangeTuple = makeRangeTuple(birthFull[0], placementExtendedFull[1]);
  const travelUnlikely1: RangeTuple = makeRangeTuple(hormoneLikely[0], breedingLikely[1]);
  const travelUnlikely2: RangeTuple = makeRangeTuple(
    offspringCareLikely[0],
    placementNormalLikely[1]
  );

  return {
    projectedCycleStarts: [],
    seedCycleStart: estimatedCycleStart,  // DERIVED, not observed
    seedOvulationDate: ovulationDate,     // PRIMARY ANCHOR
    windows: {
      pre_breeding: { full: preBreedingFull, likely: preBreedingLikely },
      hormone_testing: { full: hormoneFull, likely: hormoneLikely },
      breeding: { full: breedingFull, likely: breedingLikely },
      birth: { full: birthFull, likely: birthLikely },
      offspring_care: { full: offspringCareFull, likely: offspringCareLikely },
      placement_normal: { full: placementNormalFull, likely: placementNormalLikely },
      placement_extended: { full: placementExtendedFull, likely: placementExtendedFull },
      availability_travel_risky_1: { full: travelRisky1, likely: travelRisky1 },
      availability_travel_risky_2: { full: travelRisky2, likely: travelRisky2 },
      availability_travel_unlikely_1: { full: travelUnlikely1, likely: travelUnlikely1 },
      availability_travel_unlikely_2: { full: travelUnlikely2, likely: travelUnlikely2 },
    },
    milestones: {
      cycle_start_estimated: estimatedCycleStart,
      heat_start_estimated: estimatedCycleStart,
      ovulation_confirmed: ovulationDate,  // PRIMARY ANCHOR
      breeding_optimal: ovulationDate,
      birth_expected: birthCenter,
    },
    explain: {
      species,
      seedType: "OVULATION_CONFIRMED",
      anchorDate: ovulationDate,
      anchorMode: "OVULATION" as ReproAnchorMode,
      derivedCycleStart: estimatedCycleStart,
      confidence: "HIGH"
    },
  };
}
```

### 2.2 Mode-Aware Timeline Builder

**Add universal builder function**:

```typescript
/**
 * Build timeline using appropriate method based on anchor mode.
 * This is the new universal entry point for all timeline calculations.
 */
export function buildTimelineFromAnchor(
  summary: ReproSummary,
  anchor: {
    mode: "CYCLE_START" | "OVULATION";
    date: ISODate;
  }
): ReproTimeline {
  switch (anchor.mode) {
    case "OVULATION":
      return buildTimelineFromOvulation(summary, anchor.date);
    case "CYCLE_START":
    default:
      return buildTimelineFromSeed(summary, anchor.date);
  }
}

/**
 * Detect which anchor to use from plan data.
 * Priority: Ovulation (if hormone-tested) > Cycle Start > null
 */
export function detectAnchorFromPlan(plan: {
  reproAnchorMode?: string | null;
  lockedOvulationDate?: string | null;
  lockedCycleStart?: string | null;
  ovulationConfirmedMethod?: string | null;
  birthDateActual?: string | null;
}): { mode: "CYCLE_START" | "OVULATION"; date: ISODate } | null {

  // If actual birth recorded, use that for post-birth timeline
  if (plan.birthDateActual) {
    // TODO: buildTimelineFromBirth already exists
    return null;  // Handled separately
  }

  // Priority 1: Explicit anchor mode set
  if (plan.reproAnchorMode === "OVULATION" && plan.lockedOvulationDate) {
    return {
      mode: "OVULATION",
      date: assertIsoDate(plan.lockedOvulationDate, "lockedOvulationDate"),
    };
  }

  // Priority 2: Auto-detect from data quality
  // If ovulation is hormone-confirmed, use it even if mode is CYCLE_START
  if (
    plan.lockedOvulationDate &&
    plan.ovulationConfirmedMethod &&
    plan.ovulationConfirmedMethod !== "CALCULATED"
  ) {
    return {
      mode: "OVULATION",
      date: assertIsoDate(plan.lockedOvulationDate, "lockedOvulationDate"),
    };
  }

  // Priority 3: Fall back to cycle start (traditional)
  if (plan.lockedCycleStart) {
    return {
      mode: "CYCLE_START",
      date: assertIsoDate(plan.lockedCycleStart, "lockedCycleStart"),
    };
  }

  return null;  // No anchor available
}
```

### 2.3 Update computeExpectedForPlan to Accept Ovulation

**File:** `apps/breeding/src/App-Breeding.tsx` (around line 200-300)

```typescript
// EXISTING function - MODIFY to accept optional ovulation parameter
function computeExpectedForPlan(opts: {
  species: SpeciesWire;
  lockedCycleStart?: string | null;
  ovulationConfirmed?: string | null;  // NEW parameter
  femaleCycleLenOverrideDays?: number | null;
}) {
  const { species, lockedCycleStart, ovulationConfirmed, femaleCycleLenOverrideDays } = opts;

  // NEW: Priority 1 - Use ovulation if available (highest confidence)
  if (ovulationConfirmed && String(ovulationConfirmed).trim()) {
    const ovulationISO = asISODateOnly(ovulationConfirmed);
    if (ovulationISO) {
      return reproEngine.buildTimelineFromOvulation(
        {
          animalId: "plan",
          species: normalizeSpeciesWire(species),
          cycleStartsAsc: [],
          today: asISODateOnly(new Date()) ?? new Date().toISOString().slice(0, 10),
        },
        ovulationISO as any
      );
    }
  }

  // EXISTING: Priority 2 - Use cycle start (medium confidence)
  if (lockedCycleStart && String(lockedCycleStart).trim()) {
    const cycleISO = asISODateOnly(lockedCycleStart);
    if (cycleISO) {
      return reproEngine.buildTimelineFromSeed(
        {
          animalId: "plan",
          species: normalizeSpeciesWire(species),
          cycleStartsAsc: [],
          today: asISODateOnly(new Date()) ?? new Date().toISOString().slice(0, 10),
        },
        cycleISO as any
      );
    }
  }

  return null;
}
```

### 2.4 Milestone Anchor Priority Helper ✅ CRITICAL GAP #2 RESOLVED

**Purpose**: Fix foaling milestone generation to work with ovulation-anchored plans.

**File**: `apps/breeding/src/App-Breeding.tsx`

**Add new helper function** (around line 6980, before foaling milestone handlers):

```typescript
/**
 * Get the best available anchor date for milestone generation.
 * Priority: ovulation > breeding > expected breeding > locked ovulation
 *
 * For horses, ovulation is most accurate. Falls back to breeding if no ovulation data.
 *
 * ✅ RESOLVES CRITICAL GAP #2: Foaling milestones now work with ovulation-anchored plans
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

**Update milestone creation handler** (line ~6990):

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

**Update delete handler to use same priority** (line ~7034):

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

### 2.5 Update Type Definitions

**File**: `packages/ui/src/utils/reproEngine/types.ts`

```typescript
export type ReproAnchorMode = "CYCLE_START" | "OVULATION";

export type OvulationMethod =
  | "CALCULATED"
  | "PROGESTERONE_TEST"
  | "LH_TEST"
  | "ULTRASOUND"
  | "VAGINAL_CYTOLOGY"
  | "PALPATION"
  | "BREEDING_INDUCED"
  | "AT_HOME_TEST"
  | "VETERINARY_EXAM";

export interface ReproTimeline {
  projectedCycleStarts: ISODate[];
  seedCycleStart: ISODate;
  seedOvulationDate?: ISODate;  // NEW: when ovulation is anchor
  windows: Record<string, Window>;
  milestones: Record<string, ISODate>;
  explain: {
    species: SpeciesCode;
    seedType: "HISTORY" | "ACTUAL_BIRTH" | "OVULATION_CONFIRMED";
    anchorDate?: ISODate;
    anchorMode?: ReproAnchorMode;
    derivedCycleStart?: ISODate;  // When calculated from ovulation
    confidence?: "HIGH" | "MEDIUM" | "LOW";
  };
}
```

---

## Phase 3: API Endpoint Updates

### 3.1 New Endpoint: Lock from Ovulation

**File**: `breederhq-api/src/routes/breeding.ts`

**Add new endpoint** (around line 1200):

```typescript
// POST /breeding/plans/:id/lock-from-ovulation
// Lock breeding plan using confirmed ovulation date as anchor
app.post<{
  Params: { id: string };
  Body: {
    ovulationDate: string;
    method: string;  // OvulationMethod
    testResultId?: number;
    notes?: string;
  };
}>("/breeding/plans/:id/lock-from-ovulation", async (req, reply) => {
  try {
    const { id } = req.params;
    const { ovulationDate, method, testResultId, notes } = req.body;
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user?.id;

    // Validate plan exists and user has access
    const plan = await getPlanInTenant(Number(id), tenantId);

    // Validate ovulation date format
    const ovulation = toDateOrNull(ovulationDate);
    if (!ovulation) {
      return reply.code(400).send({
        error: "invalid_ovulation_date",
        detail: "ovulationDate must be in YYYY-MM-DD format"
      });
    }

    // Validate method
    const validMethods = ["PROGESTERONE_TEST", "LH_TEST", "ULTRASOUND", "VAGINAL_CYTOLOGY", "PALPATION", "BREEDING_INDUCED", "AT_HOME_TEST", "VETERINARY_EXAM"];
    if (!validMethods.includes(method)) {
      return reply.code(400).send({
        error: "invalid_method",
        detail: `method must be one of: ${validMethods.join(", ")}`
      });
    }

    // If testResultId provided, verify it exists and belongs to tenant
    if (testResultId) {
      const testResult = await prisma.testResult.findFirst({
        where: { id: testResultId, tenantId }
      });
      if (!testResult) {
        return reply.code(400).send({
          error: "test_result_not_found",
          detail: "Specified test result not found or doesn't belong to this tenant"
        });
      }
    }

    // Calculate all dates from ovulation using reproEngine
    const { getSpeciesDefaults } = await import("@bhq/ui/utils/reproEngine/defaults");
    const defaults = getSpeciesDefaults(plan.species as SpeciesCode);

    // Derive cycle start (work backward)
    const cycleStart = new Date(ovulation);
    cycleStart.setUTCDate(cycleStart.getUTCDate() - defaults.ovulationOffsetDays);

    // Calculate birth (work forward from ovulation)
    const dueDate = new Date(ovulation);
    dueDate.setUTCDate(dueDate.getUTCDate() + defaults.gestationDays);

    // Calculate placement dates
    const weanedDate = new Date(dueDate);
    weanedDate.setUTCDate(weanedDate.getUTCDate() + (defaults.offspringCareDurationWeeks * 7));

    const placementStart = new Date(dueDate);
    placementStart.setUTCDate(placementStart.getUTCDate() + (defaults.placementStartWeeksDefault * 7));

    const placementCompleted = new Date(placementStart);
    placementCompleted.setUTCDate(placementCompleted.getUTCDate() + (defaults.placementExtendedWeeks * 7));

    // Update plan with ovulation-anchored dates
    const updated = await prisma.breedingPlan.update({
      where: { id: Number(id) },
      data: {
        // New anchor system fields
        reproAnchorMode: "OVULATION",
        ovulationConfirmed: ovulation,
        ovulationConfirmedMethod: method as any,
        ovulationTestResultId: testResultId,
        ovulationConfidence: "HIGH",
        primaryAnchor: "OVULATION",
        dateConfidenceLevel: "HIGH",  // Hormone-tested = high confidence
        dateSourceNotes: notes,

        // Locked quad (maintain backward compatibility)
        lockedCycleStart: cycleStart,
        lockedOvulationDate: ovulation,
        lockedDueDate: dueDate,
        lockedPlacementStartDate: placementStart,

        // Expected dates (auto-recalculate if overrides exist)
        expectedCycleStart: cycleStart,
        expectedBreedDate: ovulation,
        expectedBirthDate: dueDate,
        expectedWeaned: weanedDate,
        expectedPlacementStartDate: placementStart,
        expectedPlacementCompleted: placementCompleted,
      },
    });

    // Create audit event
    await prisma.breedingPlanEvent.create({
      data: {
        tenantId,
        planId: updated.id,
        type: "OVULATION_LOCKED",
        occurredAt: new Date(),
        label: "Cycle locked from hormone-confirmed ovulation",
        recordedByUserId: userId,
        data: {
          anchorMode: "OVULATION",
          method,
          ovulationDate: ovulation.toISOString().slice(0, 10),
          testResultId,
          calculatedDueDate: dueDate.toISOString().slice(0, 10),
        },
      },
    });

    reply.send(updated);
  } catch (err) {
    const { status, payload } = errorReply(err);
    reply.status(status).send(payload);
  }
});
```

### 3.2 Enhance Existing Lock Endpoint

**Update validateAndNormalizeLockPayload** (around line 521):

```typescript
function validateAndNormalizeLockPayload(body: any, existingPlan?: any) {
  // NEW: Support anchor mode in payload
  const anchorMode = body.reproAnchorMode || existingPlan?.reproAnchorMode || "CYCLE_START";

  const provided = {
    start: body.hasOwnProperty("lockedCycleStart") ? toDateOrNull(body.lockedCycleStart) : undefined,
    ov: body.hasOwnProperty("lockedOvulationDate") ? toDateOrNull(body.lockedOvulationDate) : undefined,
    due: body.hasOwnProperty("lockedDueDate") ? toDateOrNull(body.lockedDueDate) : undefined,
    placement: body.hasOwnProperty("lockedPlacementStartDate") ? toDateOrNull(body.lockedPlacementStartDate) : undefined,
  };

  const touched = [provided.start, provided.ov, provided.due, provided.placement].some(v => v !== undefined);

  if (!touched) {
    // Unlock all
    return {
      touched: true as const,
      lockedCycleKey: null,
      lockedCycleStart: null,
      lockedOvulationDate: null,
      lockedDueDate: null,
      lockedPlacementStartDate: null,
    };
  }

  // NEW: Anchor-specific validation
  if (anchorMode === "OVULATION") {
    // When ovulation is anchor, it's REQUIRED
    if (!provided.ov) {
      throw Object.assign(
        new Error("When reproAnchorMode=OVULATION, lockedOvulationDate is required"),
        { statusCode: 400 }
      );
    }
    // Other fields can be auto-calculated if missing
  } else {
    // CYCLE_START mode: require cycle start
    if (!provided.start) {
      throw Object.assign(
        new Error("When reproAnchorMode=CYCLE_START, lockedCycleStart is required"),
        { statusCode: 400 }
      );
    }
  }

  // Existing "all or nothing" validation for full quad
  const missing: string[] = [];
  if (!provided.start) missing.push("lockedCycleStart");
  if (!provided.ov) missing.push("lockedOvulationDate");
  if (!provided.due) missing.push("lockedDueDate");
  if (!provided.placement) missing.push("lockedPlacementStartDate");

  if (missing.length > 0) {
    throw Object.assign(
      new Error(`Lock invariant violated. Missing: ${missing.join(", ")}`),
      { statusCode: 400 }
    );
  }

  return {
    touched: true as const,
    lockedCycleStart: provided.start!,
    lockedOvulationDate: provided.ov!,
    lockedDueDate: provided.due!,
    lockedPlacementStartDate: provided.placement!,
  };
}
```

### 3.3 Update Status Derivation

**File:** `apps/breeding/src/pages/planner/deriveBreedingStatus.ts`

**Update COMMITTED Prerequisites (Line 141):**

```typescript
// OLD:
const hasCommitPrereqs = hasBasics && p.sireId != null && hasDate(p.lockedCycleStart);

// NEW: Accept EITHER lockedCycleStart OR ovulationConfirmed
const hasCommitPrereqs = hasBasics && p.sireId != null && (
  hasDate(p.lockedCycleStart) || hasDate(p.ovulationConfirmed)
);
```

**Update Type Signature (Line 114):**

```typescript
// Add new field to function parameter
export function deriveBreedingStatus(p: {
  name?: string | null;
  species?: string | null;
  damId?: number | null;
  sireId?: number | null;
  lockedCycleStart?: string | null;
  ovulationConfirmed?: string | null;  // NEW
  cycleStartDateActual?: string | null;
  breedDateActual?: string | null;
  birthDateActual?: string | null;
  weanedDateActual?: string | null;
  placementStartDateActual?: string | null;
  placementCompletedDateActual?: string | null;
  completedDateActual?: string | null;
  status?: string | null;
}): Status
```

### 3.4 Unified Lock Endpoint ✅ CRITICAL GAP #1 RESOLVED

**Purpose**: Replace separate lock endpoints with ONE unified endpoint to prevent data inconsistencies.

**File**: `breederhq-api/src/routes/breeding.ts`

**Add unified lock endpoint** (replaces separate cycle/ovulation lock methods):

```typescript
// POST /api/v1/breeding-plans/:id/lock
// Unified endpoint for locking plans with any anchor mode
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
  const updatePayload = {
    reproAnchorMode: anchorMode,
    primaryAnchor: anchorMode,
    status: "COMMITTED",

    // Expected dates
    expectedBreedDate: expectedDates.breedDate,
    expectedBirthDate: expectedDates.birthDate,
    expectedWeaned: expectedDates.weanedDate,
    expectedPlacementStartDate: expectedDates.placementStart,
    expectedPlacementCompletedDate: expectedDates.placementCompleted,

    // Set anchor-specific fields
    ...(anchorMode === "CYCLE_START" && {
      cycleStartObserved: anchorDate,
      cycleStartConfidence: confidence,
      lockedCycleStart: anchorDate, // Backward compatibility
      lockedOvulationDate: expectedDates.breedDate,
      lockedDueDate: expectedDates.birthDate,
    }),

    ...(anchorMode === "OVULATION" && {
      ovulationConfirmed: anchorDate,
      ovulationConfirmedMethod: confirmationMethod,
      ovulationConfidence: confidence,
      lockedOvulationDate: anchorDate,
      lockedDueDate: expectedDates.birthDate,
    }),

    ...(anchorMode === "BREEDING_DATE" && {
      breedDateActual: anchorDate,
      ovulationConfirmed: anchorDate, // Same as breeding for induced ovulators
      ovulationConfirmedMethod: "BREEDING_INDUCED",
      lockedOvulationDate: anchorDate,
      lockedDueDate: expectedDates.birthDate,
    }),
  };

  // Persist
  const updatedPlan = await updatePlan(id, updatePayload);

  // Audit event
  const auditEvent = await createEvent(id, {
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
    auditEventId: auditEvent.id
  });
});
```

**Add upgrade endpoint** (cycle → ovulation):

```typescript
// POST /api/v1/breeding-plans/:id/upgrade-to-ovulation
// Progressive enhancement: upgrade from CYCLE_START to OVULATION
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

  // Validation: Ovulation must be AFTER cycle start
  if (plan.cycleStartObserved) {
    const cycleDate = new Date(plan.cycleStartObserved);
    const ovulationDateParsed = new Date(ovulationDate);

    if (ovulationDateParsed <= cycleDate) {
      return res.status(400).json({
        error: "Invalid ovulation date",
        detail: "Ovulation date must be after cycle start date."
      });
    }
  }

  // Recalculate from ovulation
  const ovulationTimeline = reproEngine.buildTimelineFromOvulation(
    { animalId: plan.damId, species: plan.species, cycleStartsAsc: [], today: new Date().toISOString().slice(0, 10) },
    ovulationDate
  );

  const expectedDates = normalizeExpectedMilestones(ovulationTimeline, ovulationDate);

  // Calculate variance
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
  const updatedPlan = await updatePlan(id, {
    reproAnchorMode: "OVULATION",
    primaryAnchor: "OVULATION",
    ovulationConfirmed: ovulationDate,
    ovulationConfirmedMethod: confirmationMethod,
    ovulationConfidence: "HIGH",

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
  });

  // Check if placement window shifted significantly
  const oldPlacementDate = new Date(plan.expectedPlacementStartDate);
  const newPlacementDate = new Date(expectedDates.placementStart);
  const placementShift = Math.abs(Math.floor((newPlacementDate.getTime() - oldPlacementDate.getTime()) / (1000 * 60 * 60 * 24)));

  // Recalculate waitlist if window shifted >3 days (see Gap #5 resolution below)
  let waitlistRecalculation = null;
  if (placementShift > 3) {
    waitlistRecalculation = await recalculateWaitlistMatches(id);
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
    confidence: "HIGH",
    waitlist: waitlistRecalculation
  });
});
```

### 3.5 Immutability Validation Middleware ✅ CRITICAL GAP #3 RESOLVED

**Purpose**: Enforce immutability rules defined in Phase 1.4.

**File**: `breederhq-api/src/routes/breeding.ts`

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

### 3.6 Offspring Validation ✅ CRITICAL GAP #4 RESOLVED

**Purpose**: Validate offspring birth dates with anchor-aware tolerance.

**File**: `breederhq-api/src/routes/offspring.ts`

**Add validation function:**

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
    offspringGroupId: plan.offspringGroupId,
    parentAnchorMode: plan.reproAnchorMode, // Track anchor used
    parentConfidence: plan.ovulationConfidence || plan.cycleStartConfidence
  });

  return res.json({ success: true, offspring });
});
```

### 3.7 Waitlist Recalculation ✅ CRITICAL GAP #5 RESOLVED

**Purpose**: Automatically recalculate waitlist matches when placement windows shift.

**File**: `breederhq-api/src/routes/waitlist.ts`

**Add recalculation function:**

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

---

## Phase 4: UI/UX Updates

### 4.1 Update Plan Adapter

**File**: `apps/breeding/src/adapters/planWindows.ts`

**Update windowsFromPlan** (around line 107):

```typescript
export function windowsFromPlan(plan: {
  species?: string | null;
  dob?: string | null;
  reproAnchorMode?: string | null;
  lockedCycleStart?: string | null;
  lockedOvulationDate?: string | null;
  ovulationConfirmedMethod?: string | null;
  birthDateActual?: string | null;
  // ... other fields
}): PlanStageWindows | null {
  const species = (plan.species ?? "").toString().trim();
  if (!species) return null;

  const summary: ReproSummary = {
    animalId: "plan",
    species: species as SpeciesCode,
    dob: asISODateOnly(plan.dob ?? null),
    today: todayISO(),
    cycleStartsAsc: [],
  };

  // NEW: Use anchor detection logic
  const anchor = detectAnchorFromPlan(plan);

  if (anchor) {
    const timeline = buildTimelineFromAnchor(summary, anchor);
    return toPlanStageWindows(timeline);
  }

  // Fallback: range planning (existing logic)
  // ... existing code for earliestCycleStart / latestCycleStart ...
}
```

### 4.2 Update recalculateExpectedDatesFromActual to Support Ovulation

**File:** `apps/breeding/src/App-Breeding.tsx` (Lines 7933-8004)

**MODIFY function to include ovulation priority:**

```typescript
function recalculateExpectedDatesFromActual(
  actualCycleStart: string | null | undefined,
  actualBirthDate: string | null | undefined,
  actualOvulation: string | null | undefined  // NEW parameter
) {
  // Priority 1: BIRTH (highest)
  if (actualBirthDate && String(actualBirthDate).trim()) {
    const normalizedBirthDate = asISODateOnly(actualBirthDate);
    if (!normalizedBirthDate) return null;

    const birthTimeline = (reproEngine as any).buildTimelineFromBirth?.({
      animalId: "",
      species: row.species,
      cycleStartsAsc: [],
      today: new Date().toISOString().slice(0, 10),
    }, normalizedBirthDate);

    if (birthTimeline) {
      return {
        expectedHormoneTestingStart: null,
        expectedBreedDate: null,
        expectedBirthDate: null,
        expectedWeaned: birthTimeline.windows?.offspring_care?.likely?.[1] ?? null,
        expectedPlacementStartDate: birthTimeline.windows?.placement_normal?.likely?.[0] ?? null,
        expectedPlacementCompletedDate: birthTimeline.windows?.placement_extended?.full?.[1] ?? null,
      };
    }
  }

  // Priority 2: OVULATION (high) - NEW
  if (actualOvulation && String(actualOvulation).trim()) {
    const normalizedOvulation = asISODateOnly(actualOvulation);
    if (!normalizedOvulation) return null;

    const ovulationTimeline = (reproEngine as any).buildTimelineFromOvulation?.({
      animalId: "",
      species: row.species,
      cycleStartsAsc: [],
      today: new Date().toISOString().slice(0, 10),
    }, normalizedOvulation);

    if (ovulationTimeline) {
      return {
        // Pre-ovulation dates NOT recalculated
        expectedHormoneTestingStart: null,
        // Post-ovulation dates FROM ovulation
        expectedBreedDate: normalizedOvulation,
        expectedBirthDate: ovulationTimeline.windows?.birth?.likely?.[0] ?? null,
        expectedWeaned: ovulationTimeline.windows?.offspring_care?.likely?.[1] ?? null,
        expectedPlacementStartDate: ovulationTimeline.windows?.placement_normal?.likely?.[0] ?? null,
        expectedPlacementCompletedDate: ovulationTimeline.windows?.placement_extended?.full?.[1] ?? null,
      };
    }
  }

  // Priority 3: CYCLE START (medium) - EXISTING
  if (actualCycleStart && String(actualCycleStart).trim()) {
    // ... existing code ...
  }

  return null;
}
```

### 4.3 Update lockCycle to Support Ovulation Locking

**File:** `apps/breeding/src/App-Breeding.tsx` (Line 7772+)

**CREATE NEW function: lockFromOvulation():**

```typescript
async function lockFromOvulation(ovulationDate: string, confirmationMethod: OvulationMethod) {
  if (isArchived) return;
  if (!ovulationDate || !String(ovulationDate).trim()) return;
  if (!api) return;

  const expectedRaw = computeExpectedForPlan({
    species: row.species as any,
    ovulationConfirmed: ovulationDate,
    femaleCycleLenOverrideDays: liveOverride,
  });

  const expected = normalizeExpectedMilestones(expectedRaw, ovulationDate);

  const payload = {
    // New fields
    reproAnchorMode: "OVULATION",
    ovulationConfirmed: ovulationDate,
    ovulationConfirmedMethod: confirmationMethod,
    ovulationConfidence: "HIGH",
    primaryAnchor: "OVULATION",

    // Locked dates (calculated from ovulation)
    lockedOvulationDate: ovulationDate,
    lockedDueDate: expected.birthDate,
    lockedPlacementStartDate: expected.placementStart,

    // Expected dates
    expectedBreedDate: ovulationDate,  // Breeding = ovulation for optimal timing
    expectedBirthDate: expected.birthDate,
    expectedWeaned: expected.weanedDate,
    expectedPlacementStartDate: expected.placementStart,
    expectedPlacementCompletedDate: expected.placementCompleted,
  };

  try {
    await api.updatePlan(Number(row.id), payload as any);

    await api.createEvent(Number(row.id), {
      type: "OVULATION_LOCKED",
      occurredAt: new Date().toISOString(),
      label: "Ovulation anchor locked",
      data: {
        ovulation: ovulationDate,
        confirmationMethod,
        confidence: "HIGH",
        due: expected.birthDate,
        placementStart: expected.placementStart,
      },
    });

    // Refresh and clear draft (same as lockCycle)
    const fresh = await api.getPlan(Number(row.id), "parents,org,program");
    onPlanUpdated?.(row.id, fresh);

    const freshAsRow = planToRow(fresh || { ...row, ...payload });
    const newSnapshot = buildPlanSnapshot(freshAsRow);
    setPersistedSnapshot(newSnapshot);
    persistedSnapshotRef.current = newSnapshot;

    draftRef.current = {};
    setDraftTick((t) => t + 1);
    setDraft({});
    setPendingSave(false);
    pendingSaveRef.current = false;
  } catch (e: any) {
    console.error("[Breeding] lockFromOvulation failed", e);
    // Handle error
  }
}
```

### 4.4 Add Ovulation Date Field to Dates Tab

**File:** `apps/breeding/src/App-Breeding.tsx` (Around line 8500-8700)

```typescript
// Insert this code in the Dates Tab section

// Species-aware field visibility
const terminology = getSpeciesTerminology(row.species as Species);
const showOvulationField = terminology.anchorMode.options.some(opt => opt.type === 'OVULATION');
const showCycleStartField = !terminology.anchorMode.isInducedOvulator;

// Inside the Actual Dates section render:
{showCycleStartField && (
  <DateField
    label={terminology.cycle.anchorDateLabel}
    value={effective.cycleStartDateActual}
    onChange={(val) => {
      setDraftLive({ cycleStartDateActual: val });
      warnIfSequenceBroken("cycleStartDateActual", val);
    }}
    disabled={!canEditCycleStartActual}
    clearable={canEditCycleStartActual}
    onClear={() => clearActualDateAndSubsequent("cycleStartDateActual")}
  />
)}

{showOvulationField && (
  <>
    <DateField
      label={terminology.ovulation.dateLabel}
      value={effective.ovulationConfirmed}
      onChange={(val) => {
        setDraftLive({ ovulationConfirmed: val });
      }}
      disabled={!canEditDates}
      helpText={terminology.ovulation.testingGuidance}
    />

    {effective.ovulationConfirmed && (
      <SelectField
        label="Confirmed By"
        value={effective.ovulationConfirmedMethod}
        options={terminology.ovulation.confirmationMethods.map(method => ({
          value: method.toUpperCase().replace(/ /g, '_'),
          label: method
        }))}
        onChange={(val) => setDraftLive({ ovulationConfirmedMethod: val })}
        disabled={!canEditDates}
      />
    )}
  </>
)}
```

### 4.5 Add "Upgrade to Ovulation" Button

**File:** `apps/breeding/src/App-Breeding.tsx` (Around line 8800-9000)

```typescript
// Insert in Overview tab

const showUpgradeButton = (
  terminology.anchorMode.supportsUpgrade &&
  effective.cycleStartObserved &&
  !effective.ovulationConfirmed &&
  !isReadOnly
);

{showUpgradeButton && (
  <Card className="mt-4 border-blue-200 bg-blue-50">
    <CardHeader>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        Upgrade to Ovulation Anchor
      </h3>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-secondary mb-4">
        Did you get progesterone testing? Upgrade for better accuracy and learn your female's unique pattern.
      </p>

      <div className="space-y-2">
        <strong>Benefits:</strong>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>±1 day whelping prediction (vs current ±2-3 days)</li>
          <li>Track individual variance (early/late ovulator)</li>
          <li>Better predictions for next cycle</li>
        </ul>
      </div>

      <button
        onClick={() => {
          // Open modal to enter ovulation date and method
          showOvulationUpgradeModal();
        }}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Enter Ovulation Date & Test Results
      </button>
    </CardContent>
  </Card>
)}
```

### 4.6 Add Reconciliation Card

**File:** `apps/breeding/src/App-Breeding.tsx`

```typescript
// Insert when BOTH cycleStartObserved AND ovulationConfirmed exist

const showReconciliation = (
  effective.cycleStartObserved &&
  effective.ovulationConfirmed
);

{showReconciliation && (
  <ReconciliationCard
    cycleStart={effective.cycleStartObserved}
    ovulation={effective.ovulationConfirmed}
    species={row.species}
    expectedOffset={effective.expectedOvulationOffset}
    actualOffset={effective.actualOvulationOffset}
    variance={effective.varianceFromExpected}
  />
)}

// Create new component:
function ReconciliationCard({ cycleStart, ovulation, species, expectedOffset, actualOffset, variance }) {
  const terminology = getSpeciesTerminology(species);
  const defaults = getSpeciesDefaults(species);

  const cycleDate = new Date(cycleStart);
  const ovulationDate = new Date(ovulation);
  const offsetDays = Math.floor((ovulationDate.getTime() - cycleDate.getTime()) / (1000 * 60 * 60 * 24));

  const isOnTime = Math.abs(offsetDays - defaults.ovulationOffsetDays) <= 1;
  const isLate = offsetDays > defaults.ovulationOffsetDays + 1;
  const isEarly = offsetDays < defaults.ovulationOffsetDays - 1;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <h3 className="text-lg font-semibold">Anchor Reconciliation</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-secondary">Cycle Start (observed)</div>
            <div className="font-semibold">{format(cycleDate, 'MMM d, yyyy')}</div>
          </div>
          <div>
            <div className="text-sm text-secondary">Ovulation (confirmed)</div>
            <div className="font-semibold">{format(ovulationDate, 'MMM d, yyyy')}</div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="text-sm text-secondary">Offset: {offsetDays} days</div>
          <div className="text-sm">
            {isOnTime && (
              <span className="text-green-700">
                On-time with breed average ({defaults.ovulationOffsetDays} days)
              </span>
            )}
            {isLate && (
              <span className="text-amber-700">
                Late ovulator (+{offsetDays - defaults.ovulationOffsetDays} days vs breed average)
              </span>
            )}
            {isEarly && (
              <span className="text-blue-700">
                Early ovulator (-{defaults.ovulationOffsetDays - offsetDays} days vs breed average)
              </span>
            )}
          </div>

          <p className="text-sm text-secondary mt-2">
            Pattern Insight: This female's ovulation timing will be used to improve predictions for future cycles.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 5: Data Migration & Backfill

### 5.1 Backfill Script for Existing Plans

**New File**: `breederhq-api/scripts/backfill-anchor-mode.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfillAnchorMode() {
  console.log("Starting anchor mode backfill...");

  // Count total plans
  const totalPlans = await prisma.breedingPlan.count();
  console.log(`Found ${totalPlans} breeding plans`);

  // Backfill all plans with default values
  const updated = await prisma.breedingPlan.updateMany({
    where: {
      reproAnchorMode: null,
    },
    data: {
      reproAnchorMode: "CYCLE_START",
      ovulationConfirmedMethod: "CALCULATED",
      dateConfidenceLevel: "MEDIUM",
    },
  });

  console.log(`Updated ${updated.count} plans with default anchor mode`);

  // Identify plans that might have hormone-tested ovulation
  // (This is a guess based on existing data - adjust logic as needed)
  const plansWithPotentialHormoneTests = await prisma.breedingPlan.findMany({
    where: {
      lockedOvulationDate: { not: null },
      TestResult: {
        some: {
          kind: { in: ["PROGESTERONE", "LH"] },
        },
      },
    },
    include: {
      TestResult: {
        where: {
          kind: { in: ["PROGESTERONE", "LH"] },
        },
        orderBy: { collectedAt: "desc" },
        take: 1,
      },
    },
  });

  console.log(`Found ${plansWithPotentialHormoneTests.length} plans with potential hormone tests`);

  // Upgrade these to OVULATION mode
  for (const plan of plansWithPotentialHormoneTests) {
    const test = plan.TestResult[0];

    await prisma.breedingPlan.update({
      where: { id: plan.id },
      data: {
        reproAnchorMode: "OVULATION",
        ovulationConfirmedMethod: test.kind === "PROGESTERONE" ? "PROGESTERONE_TEST" : "LH_TEST",
        ovulationTestResultId: test.id,
        dateConfidenceLevel: "HIGH",
      },
    });
  }

  console.log(`Upgraded ${plansWithPotentialHormoneTests.length} plans to OVULATION mode`);
  console.log("Backfill complete!");
}

backfillAnchorMode()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
```

**Run backfill**:
```bash
cd breederhq-api
npx tsx scripts/backfill-anchor-mode.ts
```

---

## Phase 6: User Education & Documentation

### 6.1 In-App Onboarding Wizard

**For new users or first breeding plan**:

```typescript
function BreedingSetupWizard() {
  return (
    <WizardDialog title="Breeding Plan Setup">
      <WizardStep title="Choose Your Tracking Method">
        <div className="space-y-4">
          <h3 className="font-semibold">How do you track your female's breeding cycle?</h3>

          <OptionCard
            icon="🎯"
            title="Hormone Testing (Recommended)"
            description="I use progesterone or LH testing to confirm ovulation date"
            badge="Most Accurate"
            onClick={() => setMode("OVULATION")}
          />

          <OptionCard
            icon="📅"
            title="Heat Observation"
            description="I observe heat cycle signs (bleeding, swelling, behavior)"
            onClick={() => setMode("CYCLE_START")}
          />

          <OptionCard
            icon="❓"
            title="Not Sure"
            description="Learn about both methods"
            onClick={() => setShowEducation(true)}
          />
        </div>
      </WizardStep>

      {/* Follow-up steps based on choice */}
    </WizardDialog>
  );
}
```

### 6.2 Help Documentation

**Create help article**: "Understanding Cycle-Based vs Ovulation-Based Breeding Plans"

**Key points**:
1. **What is ovulation date?** The day when the egg is released (detectable via hormone testing)
2. **Why is it more accurate?** Birth is 63 days from ovulation (±1 day), vs 75 days from cycle start (±2-3 days)
3. **Do I need hormone testing?** No - cycle start tracking works fine, but ovulation is more precise
4. **Can I upgrade later?** Yes - you can start with cycle tracking and upgrade when you get hormone test results

### 6.3 Veterinarian Partnership Materials

**Create vet-facing PDF**: "Working with BreederHQ - Ovulation Testing Guide"

**Include**:
- How to enter test results in platform
- Benefits of linking test data to breeding plans
- Sample workflow: Test → Record → Plan locks automatically

---

## Phase 7: Educational Workflow Guidance (Proactive Breeding Management)

**Context:** User goal is to help Rene "do better" at record-keeping. Platform should educate and guide, not just passively record.

### 7.1 Cycle Prediction Dashboard

**Component**: `BreedingCyclePredictionDashboard.tsx`

**Purpose**: Proactive cycle prediction based on ovulation-to-ovulation tracking

(Full implementation shown in detailed code from 09-detailed-implementation-plan.md)

### 7.2 Guided Testing Workflow

**Component**: `ProgesteroneTestingWorkflow.tsx`

**Purpose**: Step-by-step guidance for proper testing timing

(Full implementation shown in detailed code from 09-detailed-implementation-plan.md)

### 7.3 Educational Notifications & Reminders

**Feature**: Proactive alerts based on cycle prediction

(Full implementation shown in detailed code from 09-detailed-implementation-plan.md)

### 7.4 Cycle History & Pattern Visualization

**Component**: `CycleHistoryChart.tsx`

**Purpose**: Visual display of ovulation patterns over time

### 7.5 Success Metrics for Educational Features

**Track:**
- % of users who use cycle prediction dashboard
- % of users who record heat start within expected window
- % of users who start testing on day 5-6 (vs earlier/later)
- Accuracy of next-cycle predictions (predicted vs actual heat start ±N days)
- % of users who upgrade from cycle-start to ovulation-anchored plans after using testing workflow

**Goal**: Help Rene transition from reactive ("test whenever I think she's in heat") to proactive ("I know to watch for heat around March 15 and start testing March 20")

---

## Edge Cases & Validation

### Edge Case 1: Ovulation Before Cycle Start

**Scenario:** User enters ovulation date that's BEFORE cycle start date

**Validation:**
```typescript
// In setDraftLive or validation function
if (effective.cycleStartObserved && effective.ovulationConfirmed) {
  const cycleDate = new Date(effective.cycleStartObserved);
  const ovulationDate = new Date(effective.ovulationConfirmed);

  if (ovulationDate < cycleDate) {
    void confirmModal({
      title: "Invalid Date Sequence",
      message: "Ovulation date cannot be before cycle start date. Ovulation typically occurs 7-14 days after heat signs begin.",
      confirmText: "OK",
      tone: "danger"
    });

    // Revert the change
    setDraftLive({ ovulationConfirmed: null });
    return;
  }
}
```

### Edge Case 2: Ovulation More Than 30 Days After Cycle Start

**Scenario:** Offset seems biologically impossible

**Validation:**
```typescript
const offsetDays = Math.floor((ovulationDate.getTime() - cycleDate.getTime()) / (1000 * 60 * 60 * 24));

if (offsetDays > 30) {
  const confirmed = await confirmModal({
    title: "Unusual Ovulation Timing",
    message: `This ovulation date is ${offsetDays} days after cycle start, which is unusual for ${species}. Typical range is 7-18 days. Please double-check your dates.`,
    confirmText: "Keep This Date",
    cancelText: "Re-enter Date",
    tone: "warning"
  });

  if (!confirmed) {
    setDraftLive({ ovulationConfirmed: null });
    return;
  }
}
```

### Edge Case 3: Upgrading From Cycle to Ovulation

**Scenario:** User has cycle-locked plan, now wants to add ovulation

**Flow:**
1. User clicks "Upgrade to Ovulation Anchor"
2. Modal opens with ovulation date field + confirmation method dropdown
3. User enters ovulation date (e.g., March 27)
4. System validates: ovulation must be AFTER cycle start (March 15)
5. System calculates offset: 12 days
6. System compares to species default: 12 days (on-time)
7. Save to database
8. Recalculate all expected dates FROM ovulation (more accurate)
9. Show reconciliation card

### Edge Case 4: Induced Ovulator (Cat/Rabbit) Entering Cycle Start

**Scenario:** Cat breeder tries to enter cycle start date

**Prevention:**
```typescript
// Don't show cycle start field for induced ovulators
const terminology = getSpeciesTerminology(row.species);

if (terminology.anchorMode.isInducedOvulator) {
  // Hide "Cycle Start" field entirely
  // Only show "Breeding Date" field
}
```

### Edge Case 5: Legacy Plans Without New Fields

**Scenario:** Existing plan created before migration

**Backfill Logic:**
```typescript
// In migration or on first load
if (plan.lockedCycleStart && !plan.cycleStartObserved) {
  plan.cycleStartObserved = plan.lockedCycleStart;
  plan.reproAnchorMode = "CYCLE_START";
  plan.primaryAnchor = "CYCLE_START";
  plan.cycleStartConfidence = "MEDIUM";
}
```

---

## Cross-Cutting Concerns: Error Handling, Performance, Audit, Rollback & Testing

### Error Handling Strategy ✅ MAJOR WEAKNESS #6 RESOLVED

**Purpose**: Define comprehensive error handling patterns for all anchor-related operations.

#### Error Handling Patterns

**1. Optimistic vs Pessimistic Updates:**

```typescript
// Optimistic Update (UI responsiveness)
function handleUpgradeToOvulation(ovulationDate: string, method: OvulationMethod) {
  // Immediately update UI with expected state
  setLocalPlan({
    ...plan,
    reproAnchorMode: "OVULATION",
    ovulationConfirmed: ovulationDate,
    ovulationConfidence: "HIGH"
  });

  // Show loading indicator
  setUpgrading(true);

  // Call API
  api.breedingPlans.upgradeToOvulation(plan.id, { ovulationDate, method })
    .then((result) => {
      // API success - update with actual server response
      setLocalPlan(result.plan);
      showSuccessToast("Plan upgraded to ovulation anchor");
    })
    .catch((error) => {
      // API failure - rollback UI to previous state
      setLocalPlan(previousPlan);
      showErrorToast(`Upgrade failed: ${error.message}`);

      // Log error for debugging
      console.error("[Breeding] Anchor upgrade failed:", error);
    })
    .finally(() => {
      setUpgrading(false);
    });
}
```

**2. Partial Failure Handling (Batch Operations):**

```typescript
// Migration with partial failure tolerance
async function migrateAnchorModes(tenantId: number) {
  const plans = await getPlansForMigration(tenantId);
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const plan of plans) {
    try {
      await migrateSinglePlan(plan);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        planId: plan.id,
        error: error.message,
        stack: error.stack
      });

      // Log but continue processing other plans
      console.error(`[Migration] Failed to migrate plan ${plan.id}:`, error);
    }
  }

  // Log migration summary
  await createMigrationEvent({
    type: "ANCHOR_MODE_MIGRATION",
    tenantId,
    totalPlans: plans.length,
    successCount: results.success,
    failedCount: results.failed,
    errors: results.errors
  });

  return results;
}
```

**3. Validation Error Messages (User-Friendly):**

```typescript
// Clear, actionable error messages
const ERROR_MESSAGES = {
  OVULATION_BEFORE_CYCLE: {
    title: "Invalid Ovulation Date",
    message: "Ovulation date must be after the cycle start date. Most dogs ovulate 10-14 days after heat begins.",
    suggestion: "Check your dates and try again. If you're certain, contact support."
  },

  ANCHOR_MODE_LOCKED: {
    title: "Cannot Change Anchor",
    message: "This plan's anchor mode cannot be changed after breeding has occurred.",
    suggestion: "Create a new plan if you need to use a different anchor mode."
  },

  PROGESTERONE_TEST_REQUIRED: {
    title: "Confirmation Method Required",
    message: "Ovulation anchor requires a confirmation method (progesterone test, ultrasound, etc.).",
    suggestion: "Select how ovulation was confirmed from the dropdown."
  }
};
```

**4. API Error Retry Logic:**

```typescript
// Exponential backoff for transient failures
async function upgradeWithRetry(planId: number, data: UpgradeRequest, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await api.post(`/breeding-plans/${planId}/upgrade-to-ovulation`, data);
    } catch (error) {
      lastError = error;

      // Only retry on transient errors (500, 502, 503, 504, network errors)
      if (error.status >= 400 && error.status < 500) {
        throw error; // Client error, don't retry
      }

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

### Performance Requirements ✅ MAJOR WEAKNESS #7 RESOLVED

**Purpose**: Define performance benchmarks and optimization strategies.

#### Performance Benchmarks

| Operation | Target | Max Acceptable | Measurement Method |
|-----------|--------|----------------|-------------------|
| Single plan anchor upgrade | <500ms | <2s | P95 response time |
| Expected dates recalculation | <100ms | <500ms | Function execution time |
| Waitlist recalculation (per plan) | <1s | <3s | Database query + notifications |
| Foaling milestone generation | <200ms | <1s | API endpoint response |
| Batch migration (100 plans) | <60s | <180s | Background job duration |
| Dashboard anchor mode stats | <200ms | <500ms | Cached query response |

#### Optimization Strategies

**1. Database Query Optimization:**

```sql
-- Add indexes for anchor mode queries
CREATE INDEX idx_breeding_plan_anchor_mode ON "BreedingPlan"("reproAnchorMode", "status");
CREATE INDEX idx_breeding_plan_ovulation_confirmed ON "BreedingPlan"("ovulationConfirmed") WHERE "ovulationConfirmed" IS NOT NULL;
CREATE INDEX idx_waitlist_matched_plan ON "WaitlistEntry"("matchedBreedingPlanId") WHERE "matchedBreedingPlanId" IS NOT NULL;

-- Prevent N+1 queries in waitlist recalculation
SELECT we.*, u.email, u.firstName, u.lastName
FROM "WaitlistEntry" we
JOIN "User" u ON we.userId = u.id
WHERE we.matchedBreedingPlanId = $1;
```

**2. Caching Strategy:**

```typescript
// Cache anchor mode statistics for dashboard
const ANCHOR_STATS_CACHE_TTL = 3600; // 1 hour

async function getAnchorModeStats(tenantId: number) {
  const cacheKey = `anchor_stats:${tenantId}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Calculate stats
  const stats = await prisma.breedingPlan.groupBy({
    by: ['reproAnchorMode'],
    where: { tenantId, deletedAt: null },
    _count: { id: true }
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, ANCHOR_STATS_CACHE_TTL, JSON.stringify(stats));

  return stats;
}

// Invalidate cache on anchor upgrade
async function upgradeToOvulation(planId: number, data: UpgradeRequest) {
  const plan = await getPlan(planId);

  // ... upgrade logic ...

  // Invalidate stats cache
  await redis.del(`anchor_stats:${plan.tenantId}`);
}
```

**3. Background Jobs for Heavy Operations:**

```typescript
// Use background queue for batch operations
async function migrateAllPlansToAnchorMode(tenantId: number) {
  // Queue background job instead of blocking
  await queue.add('anchor-migration', {
    tenantId,
    priority: 'low'
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute
    }
  });

  return {
    message: "Migration queued. You'll receive an email when complete.",
    estimatedTime: "5-10 minutes"
  };
}

// Worker processes jobs in background
queue.process('anchor-migration', async (job) => {
  const { tenantId } = job.data;

  // Process migration
  const result = await migrateAnchorModes(tenantId);

  // Notify user via email
  await sendEmail({
    to: getTenantOwnerEmail(tenantId),
    subject: "Anchor Mode Migration Complete",
    body: `Migration completed: ${result.success} successful, ${result.failed} failed.`
  });

  return result;
});
```

### Comprehensive Audit Trail ✅ MAJOR WEAKNESS #8 RESOLVED

**Purpose**: Track all anchor-related changes for debugging, compliance, and user transparency.

#### Audit Event Types

```typescript
enum AuditEventType {
  // Anchor mode events
  CYCLE_START_LOCKED = "CYCLE_START_LOCKED",
  OVULATION_LOCKED = "OVULATION_LOCKED",
  BREEDING_DATE_LOCKED = "BREEDING_DATE_LOCKED",
  ANCHOR_UPGRADED = "ANCHOR_UPGRADED",

  // Date corrections
  CYCLE_START_CORRECTED = "CYCLE_START_CORRECTED",
  OVULATION_CORRECTED = "OVULATION_CORRECTED",
  BREEDING_DATE_CORRECTED = "BREEDING_DATE_CORRECTED",

  // Recalculations
  EXPECTED_DATES_RECALCULATED = "EXPECTED_DATES_RECALCULATED",
  MILESTONES_RECALCULATED = "MILESTONES_RECALCULATED",
  WAITLIST_RECALCULATED = "WAITLIST_RECALCULATED",

  // Migration
  ANCHOR_MODE_MIGRATION = "ANCHOR_MODE_MIGRATION"
}
```

#### Audit Event Schema

```typescript
interface AuditEvent {
  id: number;
  type: AuditEventType;
  planId: number;
  userId: number | null; // null for system events
  timestamp: string; // ISO datetime

  // Who made the change
  actor: {
    type: "USER" | "SYSTEM" | "MIGRATION_SCRIPT";
    userId?: number;
    email?: string;
    ipAddress?: string;
  };

  // What changed
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  // Context at time of change
  context: {
    planStatus: string; // PLANNING, COMMITTED, BRED, etc.
    previousAnchorMode?: string;
    newAnchorMode?: string;
    reason?: string; // "user_entered_test_results", "data_correction", "system_upgrade"
  };

  // Affected downstream data
  cascadeEffects?: {
    expectedDatesChanged: string[]; // ["expectedBirthDate", "expectedWeaned"]
    waitlistEntriesAffected?: number;
    milestonesRecalculated?: boolean;
  };

  // Metadata
  metadata?: Record<string, any>;
}
```

#### Example Audit Events

```typescript
// Anchor upgrade event
await createAuditEvent({
  type: "ANCHOR_UPGRADED",
  planId: 123,
  userId: 456,
  timestamp: "2026-03-20T14:30:00Z",
  actor: {
    type: "USER",
    userId: 456,
    email: "rene@example.com",
    ipAddress: "192.168.1.1"
  },
  changes: [
    { field: "reproAnchorMode", oldValue: "CYCLE_START", newValue: "OVULATION" },
    { field: "ovulationConfirmed", oldValue: null, newValue: "2026-03-27" },
    { field: "ovulationConfidenceLevel", oldValue: null, newValue: "HIGH" }
  ],
  context: {
    planStatus: "COMMITTED",
    previousAnchorMode: "CYCLE_START",
    newAnchorMode: "OVULATION",
    reason: "user_entered_test_results"
  },
  cascadeEffects: {
    expectedDatesChanged: ["expectedBirthDate", "expectedWeaned", "expectedPlacementStartDate"],
    waitlistEntriesAffected: 3,
    milestonesRecalculated: false
  },
  metadata: {
    confirmationMethod: "PROGESTERONE_TEST",
    cycleStartDate: "2026-03-15",
    actualOvulationOffset: 12,
    expectedOvulationOffset: 12,
    variance: 0
  }
});
```

### Rollback Plan & Feature Flags ✅ MAJOR WEAKNESS #9 RESOLVED

**Purpose**: Enable safe rollout and quick rollback if issues arise.

#### Feature Flag Strategy

```typescript
// Feature flags for gradual rollout
const FEATURE_FLAGS = {
  // Master killswitch
  ovulation_anchor_enabled: true,

  // Species-specific rollout (can disable per species if issues found)
  ovulation_anchor_dogs: true,
  ovulation_anchor_horses: true,
  ovulation_anchor_cats: false,  // Induced ovulators - different logic
  ovulation_anchor_rabbits: false,
  ovulation_anchor_goats: false,  // No testing infrastructure
  ovulation_anchor_sheep: false,

  // Feature sub-components (can disable specific features)
  ovulation_anchor_auto_upgrade: false, // Manual upgrade only initially
  ovulation_anchor_ui_reconciliation: true,
  ovulation_anchor_waitlist_recalc: true,
  ovulation_anchor_milestone_priority: true,

  // Advanced features (enable after stabilization)
  ovulation_anchor_variance_tracking: false,
  ovulation_anchor_cycle_prediction: false
};

// Usage in code
async function lockPlan(planId: number, data: LockRequest) {
  // Check master flag
  if (!featureFlags.ovulation_anchor_enabled) {
    // Fall back to cycle-start only
    if (data.anchorMode === "OVULATION") {
      throw new Error("Ovulation anchor temporarily disabled. Please use cycle start.");
    }
  }

  // Check species-specific flag
  const plan = await getPlan(planId);
  const speciesFlag = `ovulation_anchor_${plan.species.toLowerCase()}`;

  if (data.anchorMode === "OVULATION" && !featureFlags[speciesFlag]) {
    throw new Error(`Ovulation anchor not available for ${plan.species} at this time.`);
  }

  // Proceed with locking...
}
```

#### Rollback Procedures

**Scenario 1: Disable ovulation anchor globally**

```typescript
// Emergency rollback procedure
async function rollbackOvulationAnchor() {
  // 1. Disable feature flag
  await featureFlags.set('ovulation_anchor_enabled', false);

  // 2. Revert UI to hide ovulation options
  // (controlled by feature flag, automatic)

  // 3. Existing plans remain in ovulation mode (don't break data)
  // New plans use cycle-start only

  // 4. Monitor error rates
  await monitoring.alert("Ovulation anchor rolled back", {
    severity: "WARNING",
    reason: "Emergency rollback initiated"
  });
}
```

**Scenario 2: Database migration rollback**

```sql
-- Rollback migration (if needed within 24 hours of deploy)
-- NOTE: Only safe if no plans have been upgraded to OVULATION mode

BEGIN;

-- Remove new columns
ALTER TABLE "BreedingPlan"
  DROP COLUMN IF EXISTS "reproAnchorMode",
  DROP COLUMN IF EXISTS "cycleStartObserved",
  DROP COLUMN IF EXISTS "cycleStartSource",
  DROP COLUMN IF EXISTS "cycleStartConfidence",
  DROP COLUMN IF EXISTS "ovulationConfirmed",
  DROP COLUMN IF EXISTS "ovulationConfirmedMethod",
  DROP COLUMN IF EXISTS "ovulationTestResultId",
  DROP COLUMN IF EXISTS "ovulationConfidence",
  DROP COLUMN IF EXISTS "primaryAnchor",
  DROP COLUMN IF EXISTS "expectedOvulationOffset",
  DROP COLUMN IF EXISTS "actualOvulationOffset",
  DROP COLUMN IF EXISTS "varianceFromExpected",
  DROP COLUMN IF EXISTS "dateConfidenceLevel",
  DROP COLUMN IF EXISTS "dateSourceNotes";

ALTER TABLE "TestResult"
  DROP COLUMN IF EXISTS "indicatesOvulationDate";

-- Drop new enums
DROP TYPE IF EXISTS "ReproAnchorMode";
DROP TYPE IF EXISTS "AnchorType";
DROP TYPE IF EXISTS "OvulationMethod";
DROP TYPE IF EXISTS "ConfidenceLevel";
DROP TYPE IF EXISTS "DataSource";

COMMIT;
```

**Scenario 3: Selective species rollback**

```typescript
// Rollback for specific species (e.g., horses having issues)
async function rollbackSpecies(species: SpeciesCode) {
  // 1. Disable feature for species
  await featureFlags.set(`ovulation_anchor_${species.toLowerCase()}`, false);

  // 2. Find all plans using ovulation anchor for this species
  const plans = await prisma.breedingPlan.findMany({
    where: {
      species,
      reproAnchorMode: "OVULATION",
      status: { in: ["PLANNING", "COMMITTED"] } // Only rollback uncommitted plans
    }
  });

  // 3. Revert to cycle-start anchor (if cycle start is available)
  for (const plan of plans) {
    if (plan.cycleStartObserved) {
      await revertToAnchorMode(plan.id, "CYCLE_START");
    } else {
      // Log plans that can't be automatically reverted
      console.warn(`[Rollback] Cannot revert plan ${plan.id}: no cycle start available`);
    }
  }

  // 4. Audit log
  await createAuditEvent({
    type: "SPECIES_ROLLBACK",
    species,
    plansAffected: plans.length,
    reason: "Emergency rollback"
  });
}
```

### Complete Testing Matrix ✅ MAJOR WEAKNESS #10 RESOLVED

**Purpose**: Define comprehensive test coverage across all species and scenarios.

#### Testing Matrix (54 Scenarios)

**Base Scenarios (18):**

| Species | Anchor Mode | Test Case |
|---------|-------------|-----------|
| DOG | CYCLE_START | Lock plan, verify expected dates |
| DOG | CYCLE_START → OVULATION | Lock cycle, upgrade to ovulation, verify recalculation |
| DOG | OVULATION (direct) | Lock with ovulation, verify high confidence |
| HORSE | CYCLE_START | Lock plan, verify foaling milestones |
| HORSE | CYCLE_START → OVULATION | Upgrade to ovulation, verify milestones recalculate |
| HORSE | OVULATION (direct) | Lock with ovulation, verify foaling milestones use ovulation |
| CAT | BREEDING_DATE | Lock with breeding (induced ovulator) |
| CAT | BREEDING_DATE | Verify no cycle start shown in UI |
| CAT | BREEDING_DATE | Verify ovulation = breeding date |
| RABBIT | BREEDING_DATE | Lock with breeding (induced ovulator, 0-day offset) |
| RABBIT | BREEDING_DATE | Verify 31-day gestation |
| RABBIT | BREEDING_DATE | Verify placement windows |
| GOAT | CYCLE_START | Lock plan, verify no ovulation option shown |
| GOAT | CYCLE_START | Verify cycle-based timeline |
| GOAT | CYCLE_START | Verify 150-day gestation |
| SHEEP | CYCLE_START | Lock plan, verify seasonal breeding |
| SHEEP | CYCLE_START | Verify no ovulation option shown |
| SHEEP | CYCLE_START | Verify 147-day gestation |

**Edge Cases (18):**

| Scenario | Test Case | Expected Behavior |
|----------|-----------|-------------------|
| Ovulation before cycle start | Enter ovulation < cycle start | Validation error |
| Ovulation 30 days after cycle | Enter ovulation 30 days after cycle | Warning (unusual offset) |
| Upgrade after breeding occurred | Attempt upgrade when status=BRED | Error: anchor locked |
| Upgrade with no cycle start | Upgrade to ovulation without cycle | Success, derive cycle estimate |
| Ovulation correction (±2 days) | Change ovulation by 1-2 days | Success (within tolerance) |
| Ovulation correction (>2 days) | Change ovulation by 5 days | Error: exceeds tolerance |
| Offspring birth variance (ovulation) | Offspring born ±1 day from expected | Success (within tolerance) |
| Offspring birth variance (cycle) | Offspring born ±3 days from expected | Success (within tolerance) |
| Offspring birth variance (exceeded) | Offspring born ±5 days from expected | Error: exceeds variance |
| Waitlist recalculation trigger | Upgrade shifts placement >3 days | Waitlist recalculated |
| Waitlist no recalculation | Upgrade shifts placement 1 day | No waitlist recalc |
| Foaling milestones (ovulation priority) | Plan has both ovulation & breeding | Milestones use ovulation |
| Foaling milestones (breeding fallback) | Plan has breeding, no ovulation | Milestones use breeding |
| Foaling milestones (expected fallback) | Plan has only expected dates | Milestones use expected |
| Immutability: anchor mode upgrade | CYCLE_START → OVULATION | Allowed |
| Immutability: anchor mode downgrade | OVULATION → CYCLE_START | Error: not allowed |
| Immutability: cycle start after BRED | Change cycle start when status=BRED | Error: locked |
| Immutability: birth date change | Change birth date after set | Error: strictly immutable |

**Migration Scenarios (18):**

| Migration Case | Test Case | Expected Outcome |
|----------------|-----------|------------------|
| Migrate plan with cycle start | Existing plan → backfill | cycleStartObserved = lockedCycleStart |
| Migrate plan without cycle start | Empty plan → backfill | No changes (skip) |
| Migrate CAT/RABBIT | Induced ovulator → backfill | reproAnchorMode = BREEDING_DATE |
| Migrate with test result link | Plan linked to progesterone test | ovulationTestResultId set |
| Migrate horse with breed date | Horse with breedDateActual | Milestones still generate |
| Idempotent migration (run twice) | Run migration twice | Second run skips already-migrated |
| Partial migration failure | 50/100 plans succeed | Continues processing, logs errors |
| Migration with plan being edited | User editing during migration | Lock contention handled gracefully |
| Rollback migration | Revert schema changes | Data preserved, columns removed |
| Species-specific rollback | Rollback horses only | Only horse plans reverted |
| Feature flag disable | Disable ovulation_anchor_enabled | UI hides options, new locks fail |
| Feature flag enable | Enable ovulation_anchor_dogs | UI shows options for dogs |
| Background migration job | Queue 1000 plans | Processes in background, emails result |
| Migration dry-run | Simulate migration | Preview changes, no commits |
| Migration progress tracking | Track 0-100% completion | Can resume if interrupted |
| Migration audit trail | Check events after migration | ANCHOR_MODE_MIGRATION events created |
| Cache invalidation | Migrate plans | Dashboard stats cache cleared |
| Performance benchmark | Migrate 100 plans | Completes in <180s |

#### Test Implementation

**File:** `apps/breeding-api/src/routes/breeding.test.ts`

```typescript
describe('Anchor Mode System', () => {
  describe('Lock Endpoint', () => {
    it('should lock plan with CYCLE_START anchor', async () => {
      // ... test implementation ...
    });

    it('should lock plan with OVULATION anchor', async () => {
      // ... test implementation ...
    });

    it('should reject OVULATION anchor for GOAT species', async () => {
      // ... test implementation ...
    });
  });

  describe('Upgrade Endpoint', () => {
    it('should upgrade CYCLE_START to OVULATION', async () => {
      // ... test implementation ...
    });

    it('should reject downgrade OVULATION to CYCLE_START', async () => {
      // ... test implementation ...
    });

    it('should recalculate waitlist when placement shifts >3 days', async () => {
      // ... test implementation ...
    });
  });

  describe('Immutability Validation', () => {
    it('should allow cycle start correction ±3 days in COMMITTED', async () => {
      // ... test implementation ...
    });

    it('should reject cycle start change in BRED status', async () => {
      // ... test implementation ...
    });

    it('should reject birth date change (strict immutability)', async () => {
      // ... test implementation ...
    });
  });

  // ... 48 more test cases ...
});
```

---

## Testing Strategy

### Unit Tests

**File:** `packages/ui/src/utils/reproEngine/timelineFromSeed.test.ts`

```typescript
describe('buildTimelineFromOvulation', () => {
  it('should calculate birth date 63 days from ovulation for dogs', () => {
    const timeline = buildTimelineFromOvulation(
      { animalId: 'test', species: 'DOG', cycleStartsAsc: [], today: '2026-01-17' },
      '2026-03-27'
    );

    expect(timeline.windows.birth.likely[0]).toBe('2026-05-29');
  });

  it('should have higher confidence than cycle-based timeline', () => {
    const timeline = buildTimelineFromOvulation(
      { animalId: 'test', species: 'DOG', cycleStartsAsc: [], today: '2026-01-17' },
      '2026-03-27'
    );

    expect(timeline.explain.confidence).toBe('HIGH');
  });
});
```

### Integration Tests

**File:** `apps/breeding/src/App-Breeding.test.tsx`

```typescript
describe('Breeding Plan Drawer - Ovulation Anchor', () => {
  it('should show ovulation field for dogs', () => {
    const plan = createTestPlan({ species: 'DOG' });
    const { getByLabelText } = render(<PlanDetailsView row={plan} />);

    expect(getByLabelText('Ovulation Date')).toBeInTheDocument();
  });

  it('should NOT show ovulation field for cats', () => {
    const plan = createTestPlan({ species: 'CAT' });
    const { queryByLabelText } = render(<PlanDetailsView row={plan} />);

    expect(queryByLabelText('Ovulation Date')).not.toBeInTheDocument();
  });

  it('should show upgrade button when cycle locked but no ovulation', () => {
    const plan = createTestPlan({
      species: 'DOG',
      lockedCycleStart: '2026-03-15',
      ovulationConfirmed: null
    });
    const { getByText } = render(<PlanDetailsView row={plan} />);

    expect(getByText(/Upgrade to Ovulation Anchor/i)).toBeInTheDocument();
  });

  it('should NOT show upgrade button when ovulation already confirmed', () => {
    const plan = createTestPlan({
      species: 'DOG',
      lockedCycleStart: '2026-03-15',
      ovulationConfirmed: '2026-03-27'
    });
    const { queryByText } = render(<PlanDetailsView row={plan} />);

    expect(queryByText(/Upgrade to Ovulation Anchor/i)).not.toBeInTheDocument();
  });
});
```

### E2E Test Scenarios

1. **DOG - Cycle Start to Ovulation Upgrade**
   - Create plan, select dog
   - Lock from cycle start: March 15
   - Verify status: COMMITTED
   - Click "Upgrade to Ovulation"
   - Enter ovulation: March 27
   - Select method: Progesterone Test
   - Verify reconciliation card shows offset: 12 days
   - Verify expected dates recalculated
   - Verify confidence: HIGH

2. **HORSE - Direct Ovulation Lock**
   - Create plan, select horse
   - Lock from ovulation: April 10
   - Select method: Ultrasound
   - Verify foaling checklist auto-generates
   - Verify expected foaling: March 16, 2027

3. **CAT - Breeding Date Only**
   - Create plan, select cat
   - Verify NO cycle start field shown
   - Verify NO ovulation field shown
   - Enter breeding date: March 20
   - Verify expected kittening: May 22 (63 days)

4. **GOAT - Cycle Start Only**
   - Create plan, select goat
   - Verify NO ovulation field shown
   - Enter cycle start: March 5
   - Verify expected kidding: Aug 2 (150 days)

5. **Validation - Ovulation Before Cycle**
   - Create dog plan
   - Lock cycle: March 15
   - Try to enter ovulation: March 10
   - Verify error: "Ovulation date cannot be before cycle start date"

6. **Validation - Extreme Offset**
   - Create dog plan
   - Lock cycle: March 15
   - Enter ovulation: April 20 (36 days later)
   - Verify warning: "This ovulation date is 36 days after cycle start, which is unusual"

---

## Implementation Timeline

### Week 1: Foundation
- Phase 0: Extend speciesTerminology.ts with cycle/ovulation/weaning fields
- Database migration (schema changes with hybrid anchor fields)
- Calculation engine updates (`timelineFromOvulation`, `detectAnchorFromPlan`)
- Type definitions

### Week 2: Backend API
- New `/lock-from-ovulation` endpoint
- Update existing lock validation
- Ovulation-to-ovulation cycle prediction logic
- Backfill script

### Week 3: Core UI Components
- `AnchorModeIndicator` component
- `LockFromOvulationDialog` component
- Update plan detail page
- Update plan adapter
- Fix hardcoded species terms in breeding app

### Week 4: Educational Features (Phase 7)
- `BreedingCyclePredictionDashboard` component
- `ProgesteroneTestingWorkflow` component
- Cycle prediction notifications
- `CycleHistoryChart` visualization

### Week 5: Testing & Documentation
- Unit tests for ovulation calculations
- Unit tests for ovulation-to-ovulation cycle prediction
- Integration tests for API endpoints
- E2E tests for educational workflow
- User documentation
- Onboarding wizard

### Week 6: Deployment & Monitoring
- Deploy to staging
- Run backfill script
- Deploy to production
- Monitor user adoption
- Track educational feature usage

---

## Success Metrics

### Technical
- ✅ Zero breaking changes for existing plans
- ✅ Calculation accuracy: Birth within ±1 day for ovulation-anchored plans
- ✅ Backfill completes without errors

### User Adoption
- Track % of new plans using OVULATION mode (target: 40% within 3 months)
- Track % of users who upgrade from CYCLE_START to OVULATION (target: 20% within 6 months)
- Survey user satisfaction with due date accuracy (target: >85% satisfied)

### Business
- Reduced support tickets about "wrong due dates"
- Increased engagement with test result tracking features
- Positive feedback from veterinary partners

---

## Critical Files for Implementation

1. **breederhq-api/prisma/schema.prisma** (lines 3143-3241)
   - Add `reproAnchorMode`, `ovulationConfirmedMethod`, `ovulationTestResultId`, `dateConfidenceLevel` fields to BreedingPlan model
   - Add enums: ReproAnchorMode, OvulationMethod, ConfidenceLevel

2. **breederhq/packages/ui/src/utils/reproEngine/timelineFromSeed.ts** (line 140+)
   - Add `buildTimelineFromOvulation()` function
   - Add `buildTimelineFromAnchor()` universal builder
   - Add `detectAnchorFromPlan()` helper

3. **breederhq-api/src/routes/breeding.ts** (line 1200+)
   - Add POST `/breeding/plans/:id/lock-from-ovulation` endpoint
   - Update `validateAndNormalizeLockPayload()` for anchor mode support (line 521)

4. **breederhq/apps/breeding/src/adapters/planWindows.ts** (line 107)
   - Update `windowsFromPlan()` to use anchor detection logic
   - Call `buildTimelineFromAnchor()` instead of always using cycle start

5. **breederhq/apps/breeding/src/pages/planner/deriveBreedingStatus.ts** (line 141)
   - Update COMMITTED prerequisites to accept EITHER lockedCycleStart OR ovulationConfirmed

6. **breederhq/packages/ui/src/utils/speciesTerminology.ts**
   - Extend SpeciesTerminology interface with cycle, ovulation, anchorMode, weaning fields
   - Implement for all 6 species

7. **breederhq/apps/breeding/src/App-Breeding.tsx**
   - Update `computeExpectedForPlan()` to accept ovulationConfirmed parameter
   - Add `lockFromOvulation()` function (line 7772+)
   - Update `recalculateExpectedDatesFromActual()` to include ovulation priority (line 7933+)
   - Add ovulation date field to Dates tab (line 8500+)
   - Add "Upgrade to Ovulation" button (line 8800+)
   - Add ReconciliationCard component

---

## Document Metadata

**Document Version:** 2.0 (Comprehensive Merge)
**Last Updated:** 2026-01-17
**Author:** Claude (Anthropic)
**Purpose:** Comprehensive implementation plan combining strategic vision with tactical code-level details
**Source Documents:**
- 00-implementation-plan.md (Strategic vision, research, phases)
- 09-detailed-implementation-plan.md (Tactical code, exact line numbers, validation)
