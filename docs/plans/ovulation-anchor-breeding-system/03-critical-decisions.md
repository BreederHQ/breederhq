# Critical Decisions Required - Ovulation Anchor Implementation

## Document Purpose

This document consolidates the critical design decisions that must be made BEFORE proceeding with implementation. Each decision has significant architectural and user experience implications.

---

## Decision 1: Weaning Date - Keep or Remove?

### Background

User clarification: *"They suggested that Whelped/Whelping date isn't overly helpful, is too arbitrary in terms of when it may happen and proposed that we might consider de-emphasising it or potentially removing it entirely."*

**Correction**: User meant **WEANING date**, not whelping/birth date.

### Current Implementation

**Field:** `weanedDateActual` (and `expectedWeaned`)

**Usage:**
- Required for status transition: BIRTHED → WEANED
- Calculated as: birth + offspringCareDurationWeeks × 7
  - Dogs: birth + 42 days (6 weeks)
  - Horses: birth + 140 days (20 weeks)
  - Cats: birth + 56 days (8 weeks)
- Displayed in PlanJourney component as milestone
- Tracked in OffspringGroup model

**Dependencies:**
- Status derivation (deriveBreedingStatus.ts)
- Gantt offspring_care window
- Placement calculations (placement starts AFTER weaning)

### Arguments FOR Keeping Weaning Date

1. **Placement Dependency**: Offspring can't be placed before weaning complete
   - Weaning date gates placement start date
   - Example: Dog must be weaned at 6 weeks before 8-week placement

2. **Breed Registry Requirements**: Some registries require weaning date
   - AKC may require for health records
   - AQHA foal records track weaning

3. **Health Tracking**: Weaning is a significant health milestone
   - Vaccination schedules often keyed to weaning
   - Weight tracking starts at weaning

4. **Waitlist Communication**: Buyers want to know when puppies/foals are weaned
   - "Ready for placement" depends on weaning status
   - Breeder can say "weaned on X date, placement starts Y date"

5. **Audit Trail**: Historical record of offspring development
   - Long-term health analysis
   - Breeding program evaluation (early vs late weaning outcomes)

### Arguments FOR Removing Weaning Date

1. **Arbitrary Timing**: User feedback - "mothers influence when weaning starts depending on temperament"
   - Dam's behavior varies widely
   - Some dams wean early (5 weeks), some late (8 weeks)
   - Hard to pin down exact "weaned" date

2. **Gradual Process**: Weaning isn't a single-day event
   - Starts with introducing solid food (3-4 weeks for dogs)
   - Gradually reduces nursing over 2-3 weeks
   - "Fully weaned" is subjective

3. **Redundant with Placement**: Placement start date is what buyers care about
   - If puppy goes home at 8 weeks, weaning date is implied
   - Placement readiness = weaned + socialization window

4. **Status Inflation**: Adds extra status transition that may not be meaningful
   - BIRTHED → WEANED → PLACEMENT_STARTED feels redundant
   - Could simplify to: BIRTHED → PLACEMENT_STARTED

5. **Data Entry Burden**: One more date for breeders to track
   - May not be recorded accurately
   - Breeders may guess/estimate rather than observe

### Alternative: De-Emphasize Instead of Remove

**Option A: Optional Field**
- Keep `weanedDateActual` but make it optional
- Status transition: BIRTHED → PLACEMENT_STARTED (skip WEANED if no date)
- UI: Show weaning as "optional milestone" not required step

**Option B: Calculated Field Only**
- Remove `weanedDateActual` (no user entry)
- Keep `expectedWeaned` as calculated field (birth + 6 weeks)
- Use expected weaning as internal gate for placement, but don't require recording actual

**Option C: Replace with "Offspring Care Complete"**
- Rename to `offspringCareCompletedDateActual`
- Broader concept: includes weaning + vaccinations + socialization
- Better reflects what breeders actually track

### Research Findings ✅

**Breed Registry Requirements (AKC, AQHA, UKC, CFA, TICA, ARBA):**
- ❌ **NO major breed registry requires weaning date for registration**
- ✅ All registries require **birth date** (whelping/foaling date)
- 📋 Weaning mentioned in educational resources but NOT registration forms
- 🔍 Registry focus: Pedigree information and ownership, not developmental milestones

**Species-Specific Importance:**

**HORSES: WEANING IS A CRITICAL MILESTONE** 🐴
- Distinct event at 4-6 months (not gradual like dogs)
- Veterinary research: "One of the most stressful events in a domestic foal's life"
- Professional horse breeders actively document weaning for:
  - Health monitoring (ulcers, respiratory disease risk)
  - Nutritional management (mare's milk insufficient at 4 months)
  - Growth tracking (height/weight pre- and post-weaning)
  - Vaccination schedules (timed to weaning at 3-6 months)
- Equine vets recommend documenting: weaning date, method, foal health status, complications

**DOGS: WEANING IS A GRADUAL PROCESS** 🐕
- 3-4 week transition period (weeks 3-8), not a single event
- Puppies lose interest in nursing gradually as teeth develop
- Behavioral/social considerations MORE important than weaning date
- Puppies benefit from staying with mother/littermates 10-12 weeks (beyond weaning)
- Veterinarians track: weight, vaccinations, socialization - weaning date itself is "nice to have"

**User Context:**
- Breeder network: Only Rene (not good at recording dates in general)
- Platform purpose: Help encourage better record-keeping practices

### Recommendation Based on Research

**RECOMMENDED: Species-Specific Approach**

| Species | Weaning Field | Status Requirement | Rationale |
|---------|--------------|-------------------|-----------|
| **HORSE** | **REQUIRED** | BIRTHED → WEANED → PLACEMENT_STARTED | Critical milestone, vets recommend documentation, 4-6 month distinct event |
| **DOG** | **OPTIONAL** | BIRTHED → PLACEMENT_STARTED (can skip WEANED) | Gradual process, not registries required, placement readiness more important |
| **CAT** | **OPTIONAL** | BIRTHED → PLACEMENT_STARTED | Similar to dogs, 8-week gradual process |
| **RABBIT** | **OPTIONAL** | BIRTHED → PLACEMENT_STARTED | 6-8 week weaning, not critical milestone |
| **GOAT/SHEEP** | **OPTIONAL** | BIRTHED → PLACEMENT_STARTED | Agricultural context may vary by farm |

**Implementation Details:**
- Keep `weanedDateActual` field for all species (backward compatibility)
- Status transition logic: IF weanedDateActual is set → show WEANED status, ELSE skip to PLACEMENT_STARTED
- UI guidance: "For horses, recording weaning date is strongly recommended. For other species, it's optional."
- Gantt chart: Show `offspring_care` window ending at expected weaning, but don't require date entry
- Platform benefits: Encourages Rene to track important milestones (horses) without overwhelming her with optional ones (dogs)

---

## Decision 2: Dual-Anchor Mode vs Single-Anchor Modes

### Background

User question: *"I also think we need to consider, even if we support both cycle start date entry or ovulation date entry - whether there is still value in allowing a breeder to be in a 'hybrid' mode of using both? Does this buy us anything? Is this useful to breeders who may not be binary 100% of the time?"*

### Current System

**Single Anchor**: `lockedCycleStart` is THE anchor
- Ovulation = cycleStart + 12 days (derived)
- Birth = ovulation + 63 days (derived)
- All other dates cascade from cycle start

### Proposed: Three Possible Modes

#### Option A: Dual-Anchor EXCLUSIVE (Choose One)

**How It Works:**
- Plan can be anchored EITHER by cycle start OR by ovulation
- Cannot have both simultaneously
- UI: Radio button selection: ○ Cycle Start  ○ Ovulation Date

**Example Flow:**
```
Hobbyist breeder:
  1. Create plan
  2. Select anchor: "Cycle Start" (don't have ovulation data)
  3. Enter cycle start date
  4. System calculates everything from cycle start

Professional breeder:
  1. Create plan
  2. Select anchor: "Ovulation Date" (have progesterone test)
  3. Enter ovulation date
  4. System derives cycle start, calculates birth
```

**Pros:**
- Simple mental model: one anchor point
- Clear which date is "source of truth"
- No conflicts between cycle start and ovulation

**Cons:**
- If breeder observes cycle start AND gets progesterone test, must choose which to trust
- Can't leverage both data points
- May force unnecessary choice

#### Option B: Dual-Anchor HYBRID (Both Allowed)

**How It Works:**
- Plan can have BOTH cycle start and ovulation dates
- System detects which is more reliable (ovulation > cycle start)
- Shows confidence indicators for each

**Example Flow:**
```
Breeder who tracks everything:
  1. Create plan
  2. Enter observed cycle start: March 1
  3. Get progesterone test: ovulation March 15
  4. System calculates:
     - Expected ovulation from cycle: March 1 + 12 = March 13
     - Actual ovulation from test: March 15 (2 days later than average)
     - Shows warning: "Ovulation 2 days later than average for this female"
     - Uses ovulation (March 15) as anchor for birth calculation
     - Learns: This female ovulates later than average
```

**Pros:**
- Captures full picture (both observed cycle and confirmed ovulation)
- Can detect individual variance (females who ovulate early/late)
- Machine learning potential: track patterns over time
- Breeder doesn't have to "choose" - system uses best available

**Cons:**
- More complex logic (anchor priority, conflict resolution)
- What if cycle start and ovulation don't align with species defaults?
- UI needs to show reconciliation (why dates differ)
- More database fields, more validation

#### Option C: Progressive Enhancement (Start Simple, Upgrade)

**How It Works:**
- Default: Cycle start anchor (current behavior)
- Upgrade path: Add ovulation data later → recalculates, becomes ovulation-anchored
- Once ovulation set, cycle start becomes derived (grayed out)

**Example Flow:**
```
Breeder workflow:
  1. Create plan, lock cycle start March 1 (don't have ovulation yet)
  2. System shows: "Cycle-Anchored (Medium Confidence)"
  3. Breeder gets progesterone test → ovulation March 15
  4. Click "Upgrade to Ovulation Anchor"
  5. System recalculates:
     - New derived cycle start: March 3 (ovulation - 12 days)
     - Shows warning: "Cycle start adjusted by 2 days based on confirmed ovulation"
     - Birth date unchanged (still 63 days from ovulation)
  6. Status changes to: "Ovulation-Anchored (High Confidence)"
```

**Pros:**
- Smooth upgrade path (start simple, add precision later)
- Doesn't force choice upfront
- Clear before/after comparison
- Backward compatible (existing plans stay cycle-anchored)

**Cons:**
- Date shifts can be confusing ("why did my cycle start change?")
- Requires migration UI (preview, confirm, revert)
- Two different calculation modes in production simultaneously

### Hybrid Mode: Detailed Analysis

**When Would Hybrid Mode Be Valuable?**

1. **Learning Female's Pattern**: If breeding the same female multiple times
   - Plan 1: Cycle start March 1, ovulation March 13 → ovulates 1 day early
   - Plan 2: Cycle start June 1, ovulation June 14 → ovulates 2 days late
   - Plan 3: System learns: This female has variable ovulation (±2 days)
   - Future plans: Wider uncertainty window

2. **Reconciliation / Validation**: Catching data entry errors
   - Breeder enters cycle start March 1
   - Progesterone test shows ovulation February 28 (before cycle start!)
   - System flags: "ERROR: Ovulation can't precede cycle start"
   - Breeder realizes: typo in cycle start date, should be February 18

3. **Partial Data Recovery**: Historical plans without full data
   - Old plan: only has birth date (May 15)
   - Backtrack: ovulation ~April 12 (63 days before)
   - Estimate: cycle start ~March 31 (12 days before ovulation)
   - Mark as "DERIVED" confidence (low)

**When Is Hybrid Mode Overkill?**

1. **Hobbyist Breeders**: Don't have progesterone tests, only cycle observation
   - Hybrid adds complexity with no benefit
   - Cycle start mode is sufficient

2. **Professional Breeders**: Always use progesterone testing
   - Don't need cycle start tracking (derived is fine)
   - Ovulation mode is sufficient

3. **One-Time Breeders**: Not tracking patterns over time
   - No machine learning value
   - Simple mode is better

### System Complexity Comparison

**Single Anchor (Option A):**
```
Database: 1 enum field (anchorMode: CYCLE_START | OVULATION)
Logic: if (mode === OVULATION) { useOvulation() } else { useCycleStart() }
UI: Radio button selection
Migration: Simple backfill (all existing = CYCLE_START)
```

**Hybrid Anchor (Option B):**
```
Database: Multiple fields (cycleStart, cycleStartSource, ovulation, ovulationSource)
Logic: Detect best anchor, reconcile conflicts, show warnings
UI: Two input fields + reconciliation preview + confidence badges
Migration: Complex (need to detect which dates are observed vs derived)
```

**Progressive Enhancement (Option C):**
```
Database: Anchor mode + upgrade tracking (upgradedFrom, upgradedAt)
Logic: Anchor detection + migration flow + before/after comparison
UI: Initial lock + upgrade button + preview dialog + confirmation
Migration: Medium (mark all existing as CYCLE_START, allow opt-in upgrade)
```

### Recommendation Framework

**Choose Option A (Exclusive) If:**
- Users are clearly segmented (hobbyist vs professional)
- Rarely have both data points
- Simplicity is paramount
- Fast implementation needed

**Choose Option B (Hybrid) If:**
- Users frequently have both data points
- Learning patterns is valuable (repeat breeders)
- Advanced users want maximum precision
- Willing to invest in complex UI

**Choose Option C (Progressive) If:**
- Gradual adoption desired
- Don't want to force immediate migration
- Users may get ovulation data AFTER initial plan creation
- Want smooth upgrade path

### Research Findings: Reproductive Vet Best Practices ✅

**Standard Progesterone Testing Protocol (From Theriogenology Specialists):**

1. **When to START testing:**
   - Day 5-6 AFTER first noticing heat signs (vulval swelling/discharge)
   - NOT "whenever breeder thinks bitch might be in cycle" (too reactive)
   - Proactive approach: Track cycle history, prepare in advance

2. **Testing frequency:**
   - First test (Day 5-6): Establish baseline (<1.0 ng/mL)
   - If low (<1.5 ng/mL): Wait 3-5 days for next test
   - Once rising (>1.5 ng/mL): Test every other day (48 hours)
   - Once high (>2.0 ng/mL): Some vets recommend daily testing
   - Typical total: 4-7 tests over 10-14 days

3. **Critical progesterone levels:**
   - <1.0 ng/mL: Baseline (still 5+ days from ovulation)
   - 2.0 ng/mL: LH surge (2 days until ovulation)
   - 5.0-6.0 ng/mL: **Ovulation occurs** (same day or next)
   - 8.0-12.0 ng/mL: Eggs mature (optimal breeding window)

4. **Most accurate method:**
   - Combine progesterone testing WITH vaginal cytology
   - Use same veterinary lab for all tests (consistency critical)

**User's Breeder Friend (Rene) Workflow:**
- Current: "Starts hormone testing after she realizes or thinks the bitch might be in cycle"
- Vet recommendation: Track cycle history → watch for clear signs → test day 5-6 after confirmed heat
- Implication: She likely observes cycle start THEN gets progesterone tests during cycle

**Real-World Breeder Pattern:**
- **OBSERVE CYCLE START FIRST** (bleeding/swelling is first sign)
- **THEN get progesterone tests 5-14 days later** (as hormone rises)
- This means breeders typically HAVE cycle start observation BEFORE getting ovulation confirmation

### Recommendation Based on Research

**RECOMMENDED: Option C - Progressive Enhancement (Hybrid Workflow)**

**Rationale:**
1. ✅ **Matches real-world workflow:** Breeders observe cycle start, THEN get progesterone tests days later
2. ✅ **Smooth upgrade path:** Start with cycle start observation (no vet visit required), upgrade when test results come in
3. ✅ **Enables validation:** System can flag if ovulation date doesn't align with cycle start (data quality check)
4. ✅ **Supports learning:** Track individual female variance across breeding cycles
5. ✅ **Flexible for different breeders:**
   - Hobbyists: Can stay in cycle-start mode (never upgrade)
   - Professionals: Can upgrade to ovulation mode when tests available
   - Mixed practice: Can use both data points for validation

**Implementation:**
- Default anchor: CYCLE_START (backward compatible, matches initial observation)
- Store BOTH dates when available: `cycleStartObserved` + `ovulationConfirmed`
- System determines primary anchor based on confidence:
  - If ovulation confirmed (progesterone test): Use ovulation as anchor
  - If only cycle start observed: Use cycle start as anchor
- Show reconciliation: "Expected ovulation: March 13 (from cycle start) | Actual ovulation: March 15 (confirmed) | Variance: +2 days"
- Enable pattern learning: "This female ovulates 1-2 days later than breed average"

**Hybrid vs Progressive:**
- Call it "Progressive Enhancement" for simplicity, but implement hybrid fields under the hood
- User-facing: "Upgrade to Ovulation Anchor" button when test results available
- Backend: Store both dates, detect best anchor, enable validation and learning

---

## Decision 3: Species-Aware Defaults

### Background

The system already has **excellent species terminology normalization** via `speciesTerminology.ts`:
- Dogs: "whelping", "puppies", "litter"
- Horses: "foaling", "foals", "birth record"
- Cats: "queening" (though code uses "birthing"), "kittens"
- Rabbits: "kindling", "kits"

**However**, reproductive defaults don't currently differentiate anchor mode recommendations.

### Proposed Species-Specific Anchor Recommendations

| Species | Recommended Anchor | Why | Testing Infrastructure |
|---------|-------------------|-----|----------------------|
| DOG | Ovulation (if available) | Progesterone testing widely available, 63-day gestation very reliable | ✅ Progesterone, LH available |
| HORSE | **Ovulation (default)** | Breeders already use ultrasound, veterinary standard | ✅ Ultrasound very common |
| CAT | **Breeding Date** (= ovulation) | Induced ovulator, breeding triggers ovulation | ❌ Testing rare |
| RABBIT | **Breeding Date** (= ovulation) | Induced ovulator, 0-day offset | ❌ No testing |
| GOAT | Cycle Start | No testing infrastructure | ❌ Testing rare |
| SHEEP | Cycle Start | No testing infrastructure | ❌ Testing rare |

### Implementation in reproEngine/defaults.ts

**Add to SpeciesReproDefaults:**
```typescript
export type SpeciesReproDefaults = {
  // ... existing fields ...

  // NEW: Anchor mode guidance
  recommendedAnchor: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
  ovulationTestingAvailable: boolean;
  ovulationTestingCommon: boolean; // Available vs commonly used

  // NEW: Ovulation precision metadata
  ovulationTimingVariability: "LOW" | "MEDIUM" | "HIGH"; // Individual variance
  gestationFromOvulationReliability: "HIGH" | "MEDIUM" | "LOW";

  // NEW: UI guidance text
  anchorGuidanceText?: string;
};
```

**Examples:**
```typescript
DOG: {
  // ... existing fields ...
  recommendedAnchor: "OVULATION",
  ovulationTestingAvailable: true,
  ovulationTestingCommon: false, // Hobbyists don't always test
  ovulationTimingVariability: "MEDIUM", // ±2 days from average
  gestationFromOvulationReliability: "HIGH", // 63±1 days very reliable
  anchorGuidanceText: "For best accuracy, use progesterone testing to confirm ovulation date. Birth is 63 days from ovulation (±1 day).",
},

HORSE: {
  // ... existing fields ...
  recommendedAnchor: "OVULATION",
  ovulationTestingAvailable: true,
  ovulationTestingCommon: true, // Ultrasound is standard
  ovulationTimingVariability: "HIGH", // ±5 days from average
  gestationFromOvulationReliability: "MEDIUM", // 340±50 days variance
  anchorGuidanceText: "Most horse breeders use ultrasound to confirm ovulation. This provides the most accurate foaling date prediction.",
},

CAT: {
  // ... existing fields ...
  recommendedAnchor: "BREEDING_DATE",
  ovulationTestingAvailable: false,
  ovulationTestingCommon: false,
  ovulationTimingVariability: "LOW", // Induced = predictable
  gestationFromOvulationReliability: "HIGH", // 63±2 days
  anchorGuidanceText: "Cats ovulate when bred. Enter breeding date as the anchor for calculating birth date (63 days later).",
},
```

### UI Usage

**Plan creation wizard:**
```tsx
const defaults = getSpeciesDefaults(selectedSpecies);

<SpeciesGuidance>
  {defaults.anchorGuidanceText}
</SpeciesGuidance>

{defaults.recommendedAnchor === "OVULATION" && (
  <RecommendedBadge>
    For {selectedSpecies}, we recommend using ovulation date when available.
  </RecommendedBadge>
)}

<AnchorModeSelector
  species={selectedSpecies}
  defaultMode={defaults.recommendedAnchor}
  showOvulationOption={defaults.ovulationTestingAvailable}
/>
```

### Decision Required

**Question for User:**

1. Should the system automatically default to the recommended anchor for each species?
   - YES → Horses always show "Lock from Ovulation" as primary option
   - NO → Let user choose regardless of species

2. Should we prevent certain anchor modes for certain species?
   - YES → Block ovulation mode for goats/sheep (no testing available)
   - NO → Allow any mode for any species (user knows best)

3. For induced ovulators (cats/rabbits), should we:
   - Rename "Cycle Start" to "Breeding Date" in UI?
   - Add tooltip explaining ovulation happens at breeding?
   - Use different field name in database?

---

## Decision 4: Terminology Normalization Impact

### Current Implementation

**File**: `speciesTerminology.ts` provides excellent normalization:
- `getBirthProcess('DOG')` → "whelping"
- `getBirthProcess('HORSE')` → "foaling"
- `getBirthVerb('RABBIT')` → "kindled"
- Species-specific feature flags (useCollars, emphasizeCounts, etc.)

### Where This IS Working

Based on the codebase analysis, terminology normalization is used in:
- Offspring management components
- Waitlist matching (litter-based vs individual)
- UI labels for parent names (dam/sire vs mare/stallion)
- Collar system (enabled for litter species, disabled for horses/cattle)

### Where This MAY NOT Be Complete

**Potential gaps** (need to verify):
1. **API responses** - Do they use generic terms or species-specific?
2. **Database field names** - Always generic (birthDateActual, weanedDateActual)
3. **Validation messages** - Generic or species-aware?
4. **Email notifications** - "Your litter has been born" vs "Your foal has been foaled"?

### Integration with Anchor Mode

**Question**: Should anchor mode terminology ALSO be species-aware?

**Current (generic):**
- "Cycle Start Date"
- "Ovulation Date"
- "Expected Birth Date"

**Species-specific:**
- DOG: "Heat Start Date" / "Ovulation Date" / "Expected Whelping Date"
- HORSE: "Cycle Start Date" / "Ovulation Date" / "Expected Foaling Date"
- CAT: "Breeding Date" (induced ovulator) / "Expected Queening Date"
- RABBIT: "Breeding Date" / "Expected Kindling Date"

### Recommendation

**Leverage existing speciesTerminology.ts:**

Add anchor-related terms:
```typescript
export interface SpeciesTerminology {
  // ... existing fields ...

  // NEW: Reproductive cycle terminology
  cycle: {
    startLabel: string; // "Heat Start" for dogs, "Cycle Start" for horses
    startLabelCap: string;
    anchorDateLabel: string; // "Cycle start date" vs "Breeding date" (induced)
  };

  ovulation: {
    label: string; // "Ovulation" for all
    dateLabel: string; // "Ovulation date"
    confirmedLabel: string; // "Confirmed ovulation date"
  };

  // birth: { ... } // Already exists!
}
```

**Example:**
```typescript
DOG: {
  cycle: {
    startLabel: "heat start",
    startLabelCap: "Heat Start",
    anchorDateLabel: "Heat start date",
  },
  ovulation: {
    label: "ovulation",
    dateLabel: "Ovulation date",
    confirmedLabel: "Confirmed ovulation date (progesterone test)",
  },
  // ... existing birth terminology
},

CAT: {
  cycle: {
    startLabel: "breeding",
    startLabelCap: "Breeding",
    anchorDateLabel: "Breeding date", // Cats don't have true cycles
  },
  ovulation: {
    label: "ovulation",
    dateLabel: "Ovulation date",
    confirmedLabel: "Ovulation date (occurs when bred)",
  },
},
```

### Action Item

**Verify existing usage** before proceeding:
1. Grep for hardcoded "whelping" / "foaling" strings (should use terminology utility)
2. Check API responses for species-specific terms
3. Ensure all user-facing text uses `getBirthProcess(species)` not hardcoded strings

---

## Summary of Decisions Needed

| Decision | Options | Impact Level | Urgency |
|----------|---------|--------------|---------|
| 1. Weaning Date | Keep / Remove / De-emphasize / Species-specific | MEDIUM | HIGH (affects status chain) |
| 2. Dual-Anchor Mode | Exclusive / Hybrid / Progressive | HIGH | CRITICAL (core architecture) |
| 3. Species Defaults | Auto-recommend / User choice / Block invalid | MEDIUM | MEDIUM |
| 4. Terminology Integration | Extend existing / New system / Hybrid | LOW | LOW |

**Recommended Decision Order:**

1. **Decision 2 first** (Dual-Anchor Mode): This determines architecture
2. **Decision 1 second** (Weaning Date): Affects database schema and status chain
3. **Decision 3 third** (Species Defaults): Built on top of chosen anchor mode
4. **Decision 4 last** (Terminology): Polish, can iterate

---

**Next Steps:**

1. User provides answers to questions in each decision section
2. Create final implementation plan based on decisions
3. Get sign-off before proceeding to code changes

**Document Version:** 1.0
**Last Updated:** 2026-01-17
**Author:** Claude (Anthropic)
**Purpose:** Consolidate critical design decisions before implementation
