# Ovulation Anchor Research - Complete Findings

## Executive Summary

This document contains all research findings related to transitioning from cycle-start-based breeding calculations to ovulation-based calculations. The research was conducted in response to feedback from breeder Rene that ovulation date (from hormone testing) is the veterinary standard for calculating whelping dates, and that the current cycle-start anchor is causing date accuracy issues.

## Table of Contents

1. [Canine Reproductive Science](#canine-reproductive-science)
2. [Multi-Species Considerations](#multi-species-considerations)
3. [System Architecture Analysis](#system-architecture-analysis)
4. [Complete Dependency Map](#complete-dependency-map)
5. [Risk Assessment](#risk-assessment)
6. [References](#references)

---

## 1. Canine Reproductive Science

### 1.1 Ovulation Testing Precision

#### Progesterone Testing

**How It Works:**
- Blood test measuring progesterone hormone levels in ng/mL
- Progesterone rises when LH (Luteinizing Hormone) surge occurs
- LH surge triggers ovulation ~24-48 hours later

**Timeline:**
- **Day 0 (LH Surge)**: Progesterone rises above **2 ng/mL**
- **Day 2 (Ovulation)**: Progesterone reaches **5-8 ng/mL**
- **Day 4-6 (Peak Fertility)**: Eggs mature, optimal breeding window

**Precision Level:**
- Provides a **2-day window**, not a single day
- Requires 3-4 tests over several days to follow the trend
- More valuable to track the rising trend than rely on single value

**Accuracy for Birth Prediction:**
From the date when progesterone indicates ovulation:
- **±1 day**: 67% of whelping dates
- **±2 days**: 90% of whelping dates
- **±3 days**: 100% of whelping dates

**Laboratory Requirements:**
- Must use same lab for all tests (different labs have different reference ranges)
- Must test at same time of day (hormone levels fluctuate)
- Veterinary lab testing is more accurate than home kits

#### LH Testing

**How It Works:**
- Detects the brief LH surge that triggers ovulation
- LH surge lasts only 12-48 hours
- Ovulation occurs 24-48 hours after LH surge peak

**Challenges:**
- Very precise but **difficult to catch** - requires daily blood testing
- If you miss the 12-48 hour window, you miss the surge
- More labor-intensive than progesterone testing

**Why Progesterone is Preferred:**
- Progesterone rise (>2 ng/mL) correlates with LH surge
- Progesterone stays elevated (easier to detect)
- Progesterone testing is more practical for most breeders

#### How Vets Communicate Results

**Numeric Values:**
- Results given in **ng/mL** (US) or **nmol/L** (International)
  - Conversion: multiply nmol/L by 3.18 to get ng/mL

**Interpretation Thresholds:**
- **<2 ng/mL**: Baseline, pre-LH surge
- **~2 ng/mL**: LH surge occurring NOW
- **5-8 ng/mL**: Ovulation happening (use this as ovulation date)
- **10-60+ ng/mL**: Fertile period (exact level doesn't matter after ovulation)

**Breeding Timing Guidance (Varies by Semen Type):**
- **Fresh semen**: Breed when progesterone = 5 ng/mL (day of ovulation)
- **Fresh chilled**: Breed ~48 hours after ovulation
- **Frozen semen**: Breed 60-80 hours after ovulation

---

### 1.2 Gestation Length Variance

#### From Confirmed Ovulation (ACCURATE)

**Scientific Consensus:**
- **63 days ±1-2 days** from confirmed ovulation
- Research studies show: 64-66 days from LH surge, 63 days from ovulation
- Some sources cite 65 days from LH peak, 63 days from ovulation

**Variance Explanation:**
Even with confirmed ovulation, there's still ±1-2 day variance due to:
- Individual biological variation
- Litter size (see below)
- Breed size (minor factor)

#### From Breeding Date (INACCURATE)

**Apparent Gestation Range:**
- **56-70 days** (range of 14 days!)
- **63±7 days** is commonly cited

**Why Such High Variance?**
This variability is NOT due to gestation length, but due to **uncertainty about when ovulation occurred**:
- Sperm can survive 5-7 days in female reproductive tract
- Eggs must mature 2-3 days post-ovulation before fertilization
- Breeding often occurs **before** actual ovulation
- Multiple breeding dates create additional uncertainty

**Key Insight:** The *apparent* 56-70 day range from breeding is actually showing the **timing uncertainty**, not true gestation variance. When measured from confirmed ovulation, gestation is very consistent (63±1-2 days).

#### Factors Affecting Gestation Length

**1. Litter Size (MOST SIGNIFICANT)**
- **Strong negative correlation** (r = -0.73 to -0.96)
- Each additional puppy **beyond average** shortens gestation by ~0.25 days
- Very large litters whelp slightly earlier
- Effect is strongest in litters ≤13 pups (some studies say ≤7 pups)

**Example:**
- Average litter for breed: 6 puppies, typical gestation: 63 days
- Litter of 10 puppies: 63 - (4 × 0.25) = ~62 days
- Litter of 3 puppies: 63 + (3 × 0.25) = ~64 days

**2. Breed Size (MINOR)**
- **Smaller breeds**: 58-63 days
- **Larger breeds**: 63-68 days
- Example research:
  - West Highland White Terriers: 62.8±1.2 days
  - German Shepherds: 60.4±1.7 days

**Important Note:** Breed differences may primarily reflect typical litter size variations among breeds rather than breed being an independent factor.

**3. Age/Parity (NO EFFECT)**
- Most studies found no significant effect of dam's age
- First-time mothers vs experienced mothers: no difference

---

### 1.3 Whelping Date Definition

#### What is "Whelping Date"?

There's **no universal standard**, but practical guidance:

**Labor Timeline:**
- **Stage 1 Labor**: 6-12 hours (up to 24-36 hours)
  - Cervix dilates
  - Dam shows restlessness, nesting, panting
  - **Temperature drop to <100°F** signals labor within 24 hours
- **Stage 2 Labor**: Active delivery
  - 0-30 minutes per puppy typically
  - Interval between puppies: up to 2 hours is normal
- **Total Duration**: 3-6 hours typical (can last up to 20 hours)

#### How Breeders Record It

**Standard Whelping Chart Tracks:**
- Date of birth (each puppy)
- Time of birth (each puppy)
- Birth weight (each puppy)
- Labor start time (temperature drop marker)
- Placenta count (ensure all delivered)

#### Recommended Definition for Software

**"Whelping Date" = Date when first puppy is born**

**Rationale:**
- Verifiable and objective
- Aligns with the 63-day calculation from ovulation
- Breeders already track individual birth times
- Temperature drop is a predictor, not the event itself

**Additional Fields to Consider:**
- `laborStartedAt` - When temperature dropped or contractions began
- `firstPuppyBornAt` - First puppy delivery (use for whelping date)
- `lastPuppyBornAt` - Final puppy delivery
- `placentasDeliveredAt` - All placentas accounted for

#### User's Comment About Temperament

The user mentioned: *"mothers influence when whelping starts depending on temperament - some moms try and cut off the offspring sooner than others"*

**Interpretation:** This appears to be about **weaning/separation timing** (behavioral), NOT about labor initiation timing (physiological). Maternal behavior can influence:
- When weaning begins (some dams wean earlier)
- How long offspring stay with dam
- Placement readiness

This does **NOT** affect the gestation period or whelping date itself. Labor initiation is physiological, not behavioral.

---

### 1.4 Cycle Start Detection Challenges

#### Definition

**Cycle Start = First day of bleeding (proestrus)**

Official veterinary guidance: "Counting should start from the first day of bleeding"

#### Detection Accuracy Problems

**Major Challenges:**
1. **50% of bitches** have unnoticeable bleeding initially
2. "Sometimes there is little bleeding or swelling in the first days of proestrus"
3. "Even the most astute owner may not notice the true onset of proestrus for a few days"
4. Some females have very short proestrus
5. Some females bleed through estrus into diestrus (confusing timeline)

**Result:** Breeders often miss or misidentify true cycle start by **several days**.

#### Proestrus Duration Variability

**High Individual Variation:**
- **Average**: 9 days
- **Range**: 2-22 days (most sources cite 3-17 days)

**Behavioral Signs Are Unreliable:**
- Bitches may stand for breeding as early as **11 days before ovulation**
- OR as late as **8 days after ovulation**
- Standing/flagging behavior does NOT reliably predict ovulation timing

**Implication:** The time from cycle start to ovulation is **NOT consistent** across individuals. This is precisely why progesterone/LH testing became standard veterinary practice.

#### Improved Detection Methods

**1. Vaginal Cytology**
- "Most accurate measure for identifying where a dog is in her heat cycle"
- Microscopic examination of vaginal cells
- Early proestrus: <50% cornification/superficial cells
- Can pinpoint cycle stage with high accuracy

**2. Progesterone Testing**
- "Very accurate means of pinpointing ovulation"
- Requirements:
  - Must use same lab for all tests
  - Must test at same time of day
  - Requires 3-4 tests to track trend
- Home kits are NOT as accurate as veterinary testing

**3. Combined Approach**
- "Most accurate when information from several tests is pooled"
- Vaginal cytology + progesterone + LH testing
- Triangulation provides best results

#### Why This Matters for Software

**Cycle Start is Inherently Imprecise:**
- Even attentive breeders may miss true cycle start by ±3-5 days
- Individual females have different proestrus durations (2-22 days)
- Behavioral signs don't correlate well with ovulation

**Ovulation Date is Precise:**
- When progesterone-tested, ovulation date has ±1-2 day precision
- Directly measurable with hormone testing
- Correlates strongly with whelping date (63±1 days)

**Educational Implication:**
Users need to understand that cycle-start estimates have inherent ±3-5 day variance, while ovulation-based estimates have only ±1-2 day variance.

---

## 2. Multi-Species Considerations

### 2.1 Species Categories

Based on reproductive biology, the 6 supported species fall into 3 categories:

#### Category 1: Spontaneous Ovulators WITH Hormone Testing Infrastructure

**DOG**
- Cycle length: 180 days (6 months)
- Ovulation offset: 12 days from cycle start
- Gestation: 63 days
- Postpartum minimum: 90-120 days
- **Testing available**: Progesterone widely available
- **Breeder practice**: Most use cycle start, some get progesterone testing
- **Veterinary recommendation**: Progesterone testing for accurate timing
- **Risk of anchor change**: MODERATE (many breeders don't have ovulation data)

**HORSE**
- Cycle length: 21 days (seasonal)
- Ovulation offset: 5 days from cycle start
- Gestation: 340 days (~11 months)
- Postpartum minimum: 30-45 days (fastest of all species)
- **Testing available**: Ultrasound very common, LH/progesterone available
- **Breeder practice**: Professional breeders ALREADY use ultrasound-confirmed ovulation
- **Veterinary recommendation**: Ultrasound monitoring standard
- **Risk of anchor change**: LOW (aligns with current practice)
- **Special note**: Seasonal breeder (Feb-June breeding season per AQHA)

#### Category 2: Induced Ovulators (Ovulation = Breeding)

**CAT**
- Cycle length: 21 days (seasonal polyestrous)
- Ovulation offset: 3 days from cycle start (but this is misleading)
- Gestation: 63 days
- Postpartum minimum: 45-90 days
- **Ovulation mechanism**: Induced ovulator - ovulates ~36 hours after breeding/stimulation
- **"Cycle start" meaning**: Receptivity window, not true estrous cycle
- **Breeder practice**: Track breeding date (which = ovulation)
- **Risk of anchor change**: NONE (just clarify terminology - breeding IS ovulation)

**RABBIT**
- Cycle length: 15 days (receptivity model)
- Ovulation offset: 0 days
- Gestation: 31 days
- Postpartum minimum: 14-21 days
- **Ovulation mechanism**: Induced ovulator - ovulates immediately upon breeding
- **Code acknowledgment**: "Rabbits are induced ovulators. These values model receptivity windows, not true estrous cycles."
- **"Cycle start" meaning**: When doe is receptive (not a true cycle)
- **Risk of anchor change**: NONE (already effectively ovulation-anchored)

#### Category 3: Spontaneous Ovulators WITHOUT Testing Infrastructure

**GOAT**
- Cycle length: 21 days
- Ovulation offset: 2 days from cycle start
- Gestation: 150 days (~5 months)
- Postpartum minimum: 45-90 days
- **Testing available**: Rarely used
- **Breeder practice**: Visual signs (heat detection)
- **Risk of anchor change**: HIGH (no ovulation data available)

**SHEEP**
- Cycle length: 17 days (shortest natural cycle)
- Ovulation offset: 2 days from cycle start
- Gestation: 147 days (~5 months)
- Postpartum minimum: 45-60 days
- **Special note**: Seasonal breeder (fall/winter only)
- **Testing available**: Rarely used
- **Breeder practice**: Visual signs
- **Risk of anchor change**: HIGH (no ovulation data available)

### 2.2 Species-Specific Variance in Key Metrics

| Metric | DOG | HORSE | CAT | RABBIT | GOAT | SHEEP |
|--------|-----|-------|-----|--------|------|-------|
| **Cycle Length** | 180d | 21d | 21d | 15d | 21d | 17d |
| **Ovulation Offset** | 12d | 5d | 3d | 0d (induced) | 2d | 2d |
| **Gestation** | 63d | 340d | 63d | 31d | 150d | 147d |
| **Gestation Variance** | ±1-2d | ±50d | ±5d | ±2d | ±5d | ±5d |
| **Postpartum Min** | 90d | 30d | 45d | 14d | 45d | 45d |
| **Weaning** | 6 wks | 20 wks | 8 wks | 6 wks | 9 wks | 8 wks |
| **Placement** | 8 wks | 24 wks | 12 wks | 8 wks | 10 wks | 10 wks |

### 2.3 Species-Specific UI Components

**Horse-Specific:**
- `FoalingMilestoneChecklist.tsx` - Tracks 8 milestones:
  - 15-day pregnancy check
  - 45-day ultrasound
  - 90-day ultrasound
  - 300-day begin monitoring
  - 320-day prepare foaling area
  - 330-day daily checks
  - 340-day due date
  - 350-day overdue vet call
- **Current implementation**: Milestones calculated from **breed date + offset**
- **Implication**: If switching to ovulation anchor, milestones should calculate from **ovulation date + offset**

**Litter-Based Species (Dogs, Cats, Rabbits, Goats, Sheep):**
- Show group/litter concepts
- Emphasize offspring counts
- Use litter-based waitlist systems
- Show collar identification UI (for tracking individuals within litter)

**Individual-Based Species (Horses, Cattle, Alpacas, Llamas):**
- `useCollars: false` - No collar system needed
- `emphasizeCounts: false` - Single offspring focus
- `showGroupConcept: false` - Individual-centric display
- `usesLitterWaitlist: false` - Direct purchase model (not litter waitlist)

### 2.4 Implications for Anchor Date Strategy

**Species Suitability for Ovulation Anchor:**

| Species | Ovulation Anchor Suitable? | Rationale |
|---------|---------------------------|-----------|
| **DOG** | Optional/Recommended | Progesterone testing available but not universal. Hobbyist breeders may not have access. Professional breeders should use ovulation. |
| **HORSE** | **Highly Recommended** | Breeders already using ultrasound-confirmed ovulation in practice. Current system using cycle-start is misaligned with veterinary standard. |
| **CAT** | Terminology Clarification Only | Induced ovulator - breeding date = ovulation date. Just need to clarify UI labels. |
| **RABBIT** | No Change Needed | Induced ovulator - already effectively ovulation-anchored (0-day offset). |
| **GOAT** | **Keep Cycle Start** | No testing infrastructure available. Cycle start is the only practical anchor. |
| **SHEEP** | **Keep Cycle Start** | No testing infrastructure. Seasonal breeding adds complexity. |

**Migration Paths:**

1. **Dogs**: Dual-anchor system
   - Default to cycle start (backward compatible)
   - Allow upgrade to ovulation when progesterone data available
   - Clear confidence indicators (cycle = medium, ovulation = high)

2. **Horses**: Prioritize ovulation
   - Migrate existing plans from cycle-start to ovulation (subtract 5-day offset)
   - Update FoalingMilestoneChecklist to calculate from ovulation
   - Risk: Individual mare variance in ovulation timing

3. **Cats/Rabbits**: Clarify terminology
   - Change UI labels from "Cycle Start" to "Breeding Date" for these species
   - Add tooltip: "Cats/Rabbits ovulate when bred"
   - No calculation changes needed

4. **Goats/Sheep**: No changes
   - Keep cycle-start anchor
   - Document ±3-5 day uncertainty in UI
   - No testing alternative exists

---

## 3. System Architecture Analysis

### 3.1 Calculation Engine Flow

**Current Architecture (Cycle-Start Anchored):**

```
┌─────────────────────────────────────────┐
│ User Input: lockedCycleStart (Day 0)   │
└──────────────────┬──────────────────────┘
                   ↓
┌──────────────────────────────────────────────────┐
│ Species Defaults (defaults.ts)                   │
│ - ovulationOffsetDays (e.g., 12 for dogs)       │
│ - gestationDays (e.g., 63 for dogs)             │
│ - placementStartWeeksDefault (e.g., 8 for dogs) │
└──────────────────┬───────────────────────────────┘
                   ↓
┌────────────────────────────────────────────┐
│ buildTimelineFromSeed(summary, cycleStart) │
│ - Computes ovulationCenter = cycleStart + 12  │
│ - Computes birthCenter = ovulationCenter + 63 │
│ - Computes placement = birthCenter + 56       │
└──────────────────┬─────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│ Returns: PlanStageWindows                    │
│ - pre_breeding (full/likely ranges)          │
│ - hormone_testing (full/likely)              │
│ - breeding (full/likely)                     │
│ - birth (full/likely)                        │
│ - offspring_care, placement_normal, etc.     │
│ - Milestones: cycle_start, ovulation, birth  │
└───────────────────────────────────────────────┘
```

**Data Flow Through System:**

```
Database (BreedingPlan table)
  ↓
  Fields: lockedCycleStart, lockedOvulationDate, lockedDueDate, lockedPlacementStartDate
  ↓
API Route (breeding.ts)
  ↓
  Validates locked quad (all 4 dates required together)
  Enforces immutability rules (birthDateActual locks upstream dates)
  ↓
Frontend API Client
  ↓
Adapters:
  - planToGantt.ts - Normalizes field names to canonical form
  - planWindows.ts - Calls buildTimelineFromSeed() with cycleStart as anchor
  ↓
ReproEngine (packages/ui/utils/reproEngine/)
  - timelineFromSeed.ts - Computes all windows from cycle start anchor
  - buildTimelineFromBirth.ts - Recalculates post-birth from actual birth date
  ↓
UI Components:
  - RollupGantt.tsx - Displays timeline bands for multiple plans
  - PerPlanGantt.tsx - Displays timeline for individual plan
  - BreedingCalendar.tsx - Renders milestone events on calendar
  - PlanJourney.tsx - Phase progression UI
  - FoalingMilestoneChecklist.tsx - Horse milestone tracking
```

### 3.2 Key Chokepoints

**Critical Files That Would Need Updates:**

1. **`timelineFromSeed.ts`** (Core calculation engine)
   - Currently assumes `seedCycleStart` is the heat/cycle start
   - Would need new `buildTimelineFromOvulation()` function that works backward to estimate cycle start and forward to birth
   - All window calculations would need to support both modes

2. **`planWindows.ts`** (Universal adapter)
   - ALL UI components depend on this adapter
   - Would need to detect which anchor mode to use (cycle vs ovulation)
   - Would need to call appropriate timeline builder based on mode

3. **`breeding.ts`** (API route - 2719 lines)
   - Lines 521-568: Lock validation (currently enforces all 4 locked dates together)
   - Lines 1080-1138: Immutability rules (birthDateActual locks upstream dates)
   - Would need new endpoint for locking from ovulation
   - Would need to support both anchor modes in validation

4. **`deriveBreedingStatus.ts`** (Status transitions)
   - Uses presence of dates to determine status
   - Would need to understand both anchor modes
   - COMMITTED status currently requires lockedCycleStart - would need to accept lockedOvulationDate alternative

5. **`FoalingMilestoneChecklist.tsx`** (Horse-specific)
   - Currently calculates milestones from breed date + offset
   - Should calculate from ovulation date + offset for horses
   - Example: 45-day ultrasound should be ovulation + 45, not breed + 45

### 3.3 Calculation Complexity

**Species-Specific Defaults:**

All calculations derive from species-specific constants in `defaults.ts`:

```typescript
const DEFAULTS_BY_SPECIES = {
  DOG: {
    cycleLenDays: 180,
    ovulationOffsetDays: 12,
    gestationDays: 63,
    offspringCareDurationWeeks: 6,
    placementStartWeeksDefault: 8,
    // ... many more fields
  },
  HORSE: {
    cycleLenDays: 21,
    ovulationOffsetDays: 5,
    gestationDays: 340,
    // ...
  },
  // ... CAT, RABBIT, GOAT, SHEEP
};
```

**Window Width Calculations:**

```typescript
// From timelineFromSeed.ts
const ovulationCenter = addDays(heatStart, d.ovulationOffsetDays);
const birthCenter = addDays(ovulationCenter, d.gestationDays);

const birthFull = centerRangeTuple(birthCenter, 2);   // ±2 days full range
const birthLikely = centerRangeTuple(birthCenter, 1); // ±1 day likely range
```

**Species Variation in Window Width:**
- **Dogs**: ±2 days birth window on 63-day gestation = ±3.2%
- **Horses**: ±2 days birth window on 340-day gestation = ±0.6%
- **Rabbits**: ±2 days birth window on 31-day gestation = ±6.5%

This means a ±2 day window has very different practical meaning across species.

**Postpartum Gating:**

```typescript
const postpartumLikely = lastBirthIso
  ? addDays(lastBirthIso, d.postpartumLikelyDays)
  : null;

// Prevents projecting next cycle before postpartum minimum
if (projectedCycleStart < postpartumLikely) {
  projectedCycleStart = postpartumLikely;
}
```

Species-specific postpartum windows create different cycle availability:
- Horses: 30-45 days (can breed on foal heat ~7-14 days)
- Dogs: 90-120 days
- Rabbits: 14-21 days (can breed immediately post-kindling)

---

## 4. Complete Dependency Map

This section documents **EVERY** location in the codebase that reads or uses breeding plan date fields.

### 4.1 Database Fields (Source of Truth)

**File:** `breederhq-api/prisma/schema.prisma`

**Locked Date Fields (4 - IMMUTABLE once set):**
- `lockedCycleStart` - Heat cycle start date
- `lockedOvulationDate` - Ovulation center (currently derived: cycleStart + offsetDays)
- `lockedDueDate` - Expected birth date (currently derived: ovulation + gestationDays)
- `lockedPlacementStartDate` - Expected placement start

**Expected Date Fields (7 - MUTABLE, recalculated):**
- `expectedCycleStart`
- `expectedHormoneTestingStart`
- `expectedBreedDate`
- `expectedBirthDate`
- `expectedWeaned`
- `expectedPlacementStart`
- `expectedPlacementCompleted`

**Actual Date Fields (8 - user-recorded milestones):**
- `cycleStartDateActual`
- `hormoneTestingStartDateActual`
- `breedDateActual`
- `birthDateActual` **← LOCK POINT: makes upstream dates immutable**
- `weanedDateActual`
- `placementStartDateActual`
- `placementCompletedDateActual`
- `completedDateActual`

### 4.2 Frontend Components (Display & Interaction)

**Gantt/Timeline Visualizations:**
- `RollupGantt.tsx` (Lines 27-48, 204-237)
  - Displays timeline bands for cycle→breeding and birth→placement phases
  - Uses `expectedCycleStart`, `expectedBreedDate`, `expectedBirthDate`, `expectedWeaned`, `expectedPlacementStartDate`
  - Fallback: `addDays(expBirth, 56)` for missing placement start
  - Fallback: `addDays(placementStart, 21)` for missing placement completed

- `PerPlanGantt.tsx` (Lines 23-43, 170-191)
  - Same logic as RollupGantt but per-plan display
  - Color-coded by plan with centerline indicators
  - Shows availability bands (risky/unlikely travel zones)

**Timeline Adapters:**
- `planWindows.ts` (Lines 107-153)
  - **CRITICAL ADAPTER** - ALL UI components depend on this
  - Takes: `lockedCycleStart`, `earliestCycleStart`, `latestCycleStart`
  - Calls: `buildTimelineFromSeed()` with cycle start as anchor
  - Returns: `PlanStageWindows` with all phase windows and milestones
  - **Change impact**: HIGH - This is where anchor mode detection would occur

- `planToGantt.ts`
  - Normalizes various field name aliases to canonical names
  - Maps: `expectedDue` → `expectedBirthDate`, `expectedGoHome` → `placementStartDateExpected`
  - **Change impact**: LOW - Just field mapping, no calculations

**Calendar Views:**
- `BreedingCalendar.tsx` (Lines 200, 286-292)
  - Fallback logic: `lockedCycleStart ?? expectedCycleStart ?? cycleStartDateActual`
  - Passes plan to `windowsFromPlan()` adapter
  - Renders milestone events as calendar entries
  - **Change impact**: MEDIUM - Fallback logic works but anchor interpretation changes

**Plan Cards & Lists:**
- `BreedingPlanCardView.tsx` (Line 88)
  - Displays dates in card format
  - No calculations, just formatting
  - **Change impact**: LOW

- `BreedingPlanListView.tsx` (Lines 35-37, 109-125, 138-158)
  - Table display with sortable date columns
  - Shows all locked, expected, and actual dates
  - **Change impact**: LOW - Display only

**Phase Journey:**
- `PlanJourney.tsx` (Lines 37-123)
  - Linear phase progression UI
  - Shows 8 phases with date requirements
  - Allows inline editing of actual dates
  - **Change impact**: NONE - Phase logic independent of anchor

**What-If Planning:**
- `whatIfLogic.ts` (Lines 22-55)
  - Creates synthetic plans with `cycleStartIso`
  - Calls `computeExpected({species, lockedCycleStart})`
  - **Change impact**: MEDIUM - Synthetic plan creation depends on cycle-start calculations

- `WhatIfPlanningPage.tsx` (Lines 55-84)
  - UI for what-if scenarios
  - Creates hypothetical plans with different cycle start dates
  - **Change impact**: MEDIUM - Would need to support ovulation-based what-if scenarios

**Horse-Specific:**
- `FoalingMilestoneChecklist.tsx` (Lines 40, 169, 353-355)
  - Uses: `expectedBirthDate`, `actualBreedDate`, `actualBirthDate`
  - Calculates milestones from: `actualBreedDate + offsetDays`
  - **Change impact**: HIGH - Should calculate from ovulation, not breed date

- `FoalingAlertBadge.tsx`
  - Shows overdue/due-soon milestone counts
  - Tracks milestones relative to expected birth date
  - **Change impact**: LOW

### 4.3 Backend API (Routes & Validation)

**File:** `breeding.ts` (2719 lines)

**Lock Validation (Lines 521-568):**
- Function: `validateAndNormalizeLockPayload()`
- Enforces: All 4 locked dates required together (invariant)
- Error if any of the 4 are missing: `lockedCycleStart`, `lockedOvulationDate`, `lockedDueDate`, `lockedPlacementStartDate`
- **Change impact**: HIGH - Would need to support partial locks based on anchor mode

**Offspring Group Birth Calculation (Lines 49-52):**
```typescript
function expectedBirthFromPlan(plan) {
  if (plan.expectedBirthDate) return plan.expectedBirthDate;
  if (plan.lockedOvulationDate) return addDays(plan.lockedOvulationDate, 63); // Hardcoded DOG
  return null;
}
```
- **Change impact**: MEDIUM - Already uses ovulation! Just needs species-aware gestation

**Immutability Rules (Lines 1080-1138):**
- Once `birthDateActual` is set, ALL upstream dates become immutable:
  - Cannot clear/modify: `cycleStartDateActual`, `hormoneTestingStartDateActual`, `breedDateActual`
- Rationale: Protects lineage integrity, genetics data, breed registry compliance
- **Change impact**: MEDIUM - Need to decide if ovulation date also becomes immutable

**Offspring Protection (Lines 1116-1138):**
- Cannot clear `birthDateActual` if offspring exist in linked group
- Prevents orphaning offspring (lose temporal context)
- **Change impact**: NONE - Independent of anchor mode

**Status Validation:**
- COMMITTED requires `lockedCycleStart`
- BRED requires `breedDateActual`
- BIRTHED requires `birthDateActual`
- **Change impact**: MEDIUM - COMMITTED should accept `lockedOvulationDate` alternative

### 4.4 Calculation Engine (Core Math)

**File:** `timelineFromSeed.ts` (Lines 1-233)

**Main Functions:**
- `buildTimelineFromSeed(summary, seedCycleStart)` - PRIMARY ANCHOR FUNCTION
  - Takes cycle start as Day 0
  - Calculates: ovulation, breeding window, birth, placement
  - Returns: Full timeline with windows and milestones
  - **Change impact**: CRITICAL - Core calculation engine

- `buildTimelineFromBirth(summary, actualBirth)` - Post-birth recalculation
  - Recalculates offspring care and placement from actual birth
  - **Change impact**: LOW - Post-birth logic unchanged

- `expectedMilestonesFromLocked(lockedCycleStart, species, today)` - Legacy compatibility
  - Flattens windows into old shape
  - **Change impact**: MEDIUM - Update if expected behavior changes

**Supporting Files:**
- `defaults.ts` - Species constants
  - **Change impact**: LOW - Just data, no logic

- `effectiveCycleLen.ts` - Cycle length calculation
  - Precedence: Override > History > Biology default
  - **Change impact**: NONE - Independent of anchor

- `projectUpcomingCycles.ts` - Future cycle projections
  - Uses last cycle start + effective cycle length
  - Gated by postpartum minimum
  - **Change impact**: LOW - Works with cycle history regardless of anchor

### 4.5 Status Derivation

**File:** `deriveBreedingStatus.ts` (Lines 114-203)

**Status Chain:**
```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED →
PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
```

**Date Requirements:**
- COMMITTED: requires `lockedCycleStart` + dam/sire/species/name
- BRED: requires `breedDateActual`
- BIRTHED: requires `birthDateActual`
- WEANED: requires `weanedDateActual`
- PLACEMENT_STARTED: requires `placementStartDateActual`
- PLACEMENT_COMPLETED: requires `placementCompletedDateActual`
- COMPLETE: requires `completedDateActual`

**Change Impact:** MEDIUM
- COMMITTED should also accept `lockedOvulationDate` as alternative to `lockedCycleStart`
- Other statuses independent of anchor mode

### 4.6 Offspring Management

**Files:**
- `RecordBirthDatePrompt.tsx` (Lines 16, 24, 32)
  - Checks: `!plan.birthDateActual` to show prompt
  - **Change impact**: NONE

- `OffspringPage.tsx` (Lines 465, 728)
  - Displays expected vs actual breed/birth dates
  - **Change impact**: LOW - Display only

- `App-Offspring.tsx` (Lines 4332, 4339, 4762, 4782, 4786)
  - Cannot add offspring until `birthDateActual` is set
  - Links offspring group birth date to plan
  - **Change impact**: NONE - Independent of anchor

### 4.7 Marketplace & Breeder Components

**Files:**
- `marketplace/src/api/client.ts` (Lines 2722-2729)
  - **Change impact**: NONE - Just API calls

- `marketplace/src/breeder/pages/ManageBreedingProgramsPage.tsx` (Lines 658-1628, 2330-2344)
  - Plan cards showing expected/actual birth dates
  - Sorting by `expectedBirthDate`
  - **Change impact**: LOW - Display and sorting only

### 4.8 E2E Tests

**Files:**
- `offspring-record-birth-date.spec.ts` (Lines 360-635)
  - Hardcoded: `lockedOvulationDate = -58d`, `lockedDueDate = 0d`
  - **Change impact**: HIGH - Test data would need updating

- `breeding-offspring-business-rules.spec.ts` (Lines 485-855)
  - Tests status transitions with date requirements
  - **Change impact**: MEDIUM - May need new test cases for ovulation anchor

### 4.9 Database Queries & Indices

**Indexed Fields:**
- `expectedBirthDate` - For filtering upcoming births
- `expectedCycleStart` - For cycle forecasting
- `expectedHormoneTestingStart`
- `expectedBreedDate`
- `cycleStartDateActual`
- `expectedPlacementStart`
- `expectedPlacementCompleted`
- `placementStartDateActual`
- `placementCompletedDateActual`

**Query Usage:**
- Dashboard aggregations filter by date ranges
- Calendar queries by date windows
- Waitlist matching by placement dates

**Change Impact:** LOW - Indices remain valid, just different anchor interpretation

---

## 5. Risk Assessment

### 5.1 Technical Risks

**HIGH RISK:**
1. **Breaking Timeline Calculations**
   - ALL UI components depend on `windowsFromPlan()` adapter
   - Incorrect anchor detection → wrong dates displayed everywhere
   - Mitigation: Comprehensive unit tests for all species and anchor modes

2. **Data Migration Errors**
   - Converting existing plans from cycle-start to ovulation could introduce errors
   - Individual variance in ovulation timing (especially horses: ±days)
   - Mitigation: Dry-run migration scripts, validation queries, rollback plan

3. **Immutability Rule Violations**
   - Birth date currently locks ALL upstream dates
   - Need to decide: Does ovulation date also become immutable?
   - What if ovulation and cycle start conflict?
   - Mitigation: Clear business rules, validation tests

**MEDIUM RISK:**
1. **Status Derivation Breaks**
   - COMMITTED currently requires `lockedCycleStart`
   - Need to accept `lockedOvulationDate` as alternative
   - Risk: Status regresses unexpectedly for ovulation-anchored plans
   - Mitigation: Update status derivation logic, test all transitions

2. **E2E Test Failures**
   - Tests have hardcoded date offsets (e.g., ovulation = -58 days)
   - All date-based assertions would need updating
   - Mitigation: Parameterize test data by species and anchor mode

3. **Horse Foaling Milestones**
   - Currently calculated from breed date + offset
   - Should calculate from ovulation + offset
   - Risk: Milestones shift by several days, confusing users
   - Mitigation: Clear migration messaging, comparison view

**LOW RISK:**
1. **Display-Only Components**
   - Cards, lists, tables just format dates
   - No calculations, just presentation
   - Mitigation: Minimal testing needed

2. **Cycle Projection**
   - Works with cycle history, independent of anchor
   - Mitigation: Existing tests should pass

### 5.2 User Experience Risks

**HIGH RISK:**
1. **User Confusion**
   - "Why did my due date change?"
   - Two anchor modes may confuse hobbyist breeders
   - Some users may not know which to use
   - Mitigation: Clear onboarding wizard, confidence indicators, educational tooltips

2. **Data Entry Burden**
   - Asking for ovulation data users don't have
   - Professional breeders may have progesterone results from vet but not recorded digitally
   - Mitigation: Make ovulation optional, default to cycle start

**MEDIUM RISK:**
1. **Species-Specific Behavior**
   - Different anchor recommendations per species
   - Cats/rabbits need terminology clarification
   - Horses need different default than dogs
   - Mitigation: Species-aware UI, contextual help

2. **Migration Communication**
   - How to explain why dates changed for existing plans?
   - Especially for horses (ovulation makes more sense, but dates may shift)
   - Mitigation: Preview mode, comparison view, clear changelog

### 5.3 Species-Specific Risks

| Species | Risk Level | Risk Factors | Mitigation |
|---------|-----------|--------------|------------|
| **DOG** | MEDIUM | Many breeders don't have progesterone data; forcing ovulation anchor would alienate hobbyists | Dual-anchor system, default to cycle start, allow opt-in upgrade |
| **HORSE** | MEDIUM | Individual mares vary in ovulation timing (±days from average); data migration may shift dates | Per-mare validation, comparison view, clear messaging |
| **CAT** | LOW | Just terminology clarification (breeding = ovulation) | Update labels, add tooltips |
| **RABBIT** | LOW | Already effectively ovulation-anchored (0-day offset) | No changes needed |
| **GOAT** | LOW | Keep cycle-start anchor (no testing infrastructure) | Document variance, no changes |
| **SHEEP** | LOW | Keep cycle-start anchor (no testing infrastructure) | Document variance, no changes |

### 5.4 Mitigation Strategies

**1. Phased Rollout:**
- Phase 1: Add ovulation anchor support (dogs/horses only)
- Phase 2: Migrate existing horse plans (opt-in)
- Phase 3: Gradual dog breeder education and adoption
- Phase 4: Monitor accuracy improvements, adjust species defaults

**2. Feature Flags:**
- `ENABLE_OVULATION_ANCHOR` - Global toggle
- `SPECIES_OVULATION_SUPPORT` - Per-species enablement
- Allows instant rollback if issues detected

**3. Data Integrity Checks:**
- Validation queries after migration
- Automated checks for date ordering (cycle < ovulation < birth)
- Alert if dates shift >X days from expected

**4. User Education:**
- In-app wizard: "Choose your tracking method"
- Help articles explaining cycle-start vs ovulation
- Video tutorials for each species
- Vet partner materials for professional breeders

**5. Testing Strategy:**
- Unit tests for ALL species with BOTH anchor modes
- Integration tests for anchor mode switching
- E2E tests for complete user workflows
- Load testing for performance impact
- Data migration dry-runs on production data copies

---

## 6. References

### Canine Reproduction Science

**Progesterone Testing:**
- IDEXX Catalyst Progesterone - Simplifying the Canine Reproductive Cycle
- IDEXX Catalyst Progesterone for Canine Ovulation
- The Role of Progesterone Testing in Dog Breeding (Alicia PAC Vet)
- Dog Progesterone Levels Chart (DogChart.com)
- Merck Veterinary Manual - Breeding Management of Bitches

**LH Surge Testing:**
- AKC Canine Health Foundation - Ovulation Timing
- UC Davis - Ovulation Timing in the Dog
- AKC - Ovulation Timing in the Female
- Dog Ovulation Chart (DogChart.com)

**Gestation Length:**
- AKC - The Reproductive Cycle in Dogs
- Cornell - The Normal Whelping Process
- All Pets Vet Hospital - How Long is a Dog Pregnant
- Laguna Labradors - Whelping Calculator

**Factors Affecting Gestation:**
- PMC - Influence of Parity and Litter Size on Gestation Length (PMC2801318)
- PubMed - Influence of Litter Size and Breed on Duration of Gestation (PMID: 11787149)
- PubMed - Variation in Length of Gestation (PMID: 8122353)
- Bellylabs - Dog Gestation Calendar

**Whelping Process:**
- Cornell - The Normal Whelping Process
- EZwhelp - Canine Whelping Timeline
- Idaho Veterinary Hospital - Breeding & Whelping
- PetMD - Whelping: A Guide to Help Your Dog Through Labor

**Record Keeping:**
- EZwhelp - Dog Whelping Charts
- DragonLab - Free Whelping Record Sheets
- BreedingBusiness - Record Keeping Charts for Breeders

**Estrous Cycle:**
- Cornell - Dog Estrous Cycles
- dvm360 - Canine Estrous Cycle and Ovulation
- LSU Theriogenology - The Normal Canine Estrous Cycle
- GoodRx - How Long Are Dogs in Heat
- PMC - Influence of Estrous Stages on Electrocardiography (PMC7085299)

**Breeder Practices:**
- Breedera - Dog Heat Cycle Tracker App
- Whole Dog Journal - Progesterone Test for Dogs
- PupstartsBreeders - Cytology in Dogs
- PupstartsBreeders - Managing Dog Heat Cycles for Breeders
- Purina Pro Club - Recognizing Signs of Dog Heat Cycles

**Veterinary Communication:**
- MSU College of Veterinary Medicine - Assessment of Reproduction
- AKC - 20 Facts About Timing of Ovulation in the Bitch
- Plantation Park Animal Hospital - Ovulation & Progesterone Timing
- K9 Reproduction - Breeding Readiness Progesterone Chart

---

## Appendices

### Appendix A: Glossary

**Proestrus**: First stage of heat cycle when bleeding occurs

**Estrus**: Fertile period when female is receptive to breeding

**Diestrus**: Period after estrus, whether pregnant or not

**Anestrus**: Dormant period between cycles

**LH Surge**: Spike in luteinizing hormone that triggers ovulation

**Progesterone**: Hormone that rises after LH surge, measurable in blood

**Cornification**: Cell changes visible in vaginal cytology

**Induced Ovulator**: Species that only ovulates when bred (cats, rabbits)

**Spontaneous Ovulator**: Species that ovulates on a cycle (dogs, horses, goats, sheep)

**Gestation**: Pregnancy duration from ovulation to birth

**Parturition**: The birth process (whelping, foaling, kindling, etc.)

**Whelping**: Dog birth process

**Foaling**: Horse birth process

**Kindling**: Rabbit birth process

**Queening**: Cat birth process

### Appendix B: Species Terminology Reference

| Species | Female | Male | Offspring (singular) | Offspring (plural) | Birth Term | Gestation |
|---------|--------|------|---------------------|-------------------|------------|-----------|
| DOG | Bitch/Dam | Stud/Sire | Puppy | Puppies/Litter | Whelping | 63 days |
| HORSE | Mare | Stallion | Foal | Foals | Foaling | 340 days |
| CAT | Queen | Tom | Kitten | Kittens/Litter | Queening | 63 days |
| RABBIT | Doe | Buck | Kit | Kits/Litter | Kindling | 31 days |
| GOAT | Doe | Buck | Kid | Kids | Kidding | 150 days |
| SHEEP | Ewe | Ram | Lamb | Lambs | Lambing | 147 days |

### Appendix C: Code File Reference Map

**Core Calculation Engine:**
- `packages/ui/src/utils/reproEngine/timelineFromSeed.ts` - Main timeline builder
- `packages/ui/src/utils/reproEngine/defaults.ts` - Species constants
- `packages/ui/src/utils/reproEngine/effectiveCycleLen.ts` - Cycle length calculation
- `packages/ui/src/utils/reproEngine/projectUpcomingCycles.ts` - Future cycle projections

**Adapters:**
- `apps/breeding/src/adapters/planWindows.ts` - Universal UI adapter (CRITICAL)
- `apps/breeding/src/adapters/planToGantt.ts` - Field normalization

**UI Components:**
- `apps/breeding/src/components/RollupGantt.tsx` - Multi-plan timeline
- `apps/breeding/src/components/PerPlanGantt.tsx` - Single plan timeline
- `apps/breeding/src/components/BreedingCalendar.tsx` - Calendar view
- `apps/breeding/src/components/PlanJourney.tsx` - Phase progression
- `apps/breeding/src/components/FoalingMilestoneChecklist.tsx` - Horse milestones

**API:**
- `breederhq-api/src/routes/breeding.ts` - Main API route (2719 lines)

**Status:**
- `apps/breeding/src/pages/planner/deriveBreedingStatus.ts` - Status derivation

**Database:**
- `breederhq-api/prisma/schema.prisma` - BreedingPlan model (lines 3143-3241)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-17
**Author:** Claude (Anthropic)
**Purpose:** Research findings for ovulation-first breeding cycle implementation
