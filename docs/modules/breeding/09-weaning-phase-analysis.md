# Weaning Phase Analysis

## Executive Summary

Weaning is a mandatory phase in the breeding plan lifecycle, but its **importance varies significantly by species**. Currently, weaning is treated as a required status checkpoint for ALL species, but the biological and practical reality differs:

| Category | Species | Recommendation |
|----------|---------|----------------|
| **Critical Milestone** | HORSE | Required date, distinct event |
| **Important but Optional** | CATTLE, ALPACA, LLAMA | Optional date, distinct event |
| **Gradual Process** | DOG, CAT, GOAT, SHEEP, RABBIT, PIG | Optional date, gradual transition |
| **Not Applicable** | CHICKEN | Different lifecycle model |

## Current Implementation

### Status Flow

```
BIRTHED → WEANED → PLACEMENT_STARTED
            │
            └── Requires weanedDateActual to advance
```

### Data Model

```typescript
// BreedingPlan
weanedDateActual: DateTime?      // When weaning completed
expectedWeaned: DateTime?        // Calculated from birth + offspringCareDurationWeeks

// OffspringGroup
weanedAt: DateTime?              // Group-level weaning date
```

### Species Configuration

```typescript
// speciesTerminology.ts
weaning: {
  weaningType: "DISTINCT_EVENT" | "GRADUAL_PROCESS",
  required: boolean,             // Is date recording required?
  estimatedDurationWeeks: number,
  guidanceText: string,
  statusLabel: string,
  actualDateLabel: string,
}
```

## Species-by-Species Analysis

### HORSE - Critical Milestone

**Biological Reality:**
- Foals are weaned at 4-6 months (20 weeks)
- Weaning is a traumatic, distinct event
- Separation causes stress (risk of ulcers, behavioral issues)
- Veterinary monitoring often required

**Current Config:**
```typescript
weaningType: "DISTINCT_EVENT",
required: true,
estimatedDurationWeeks: 20,
guidanceText: "Weaning is a critical milestone for horses (4-6 months).
              Veterinarians recommend documenting weaning date for health
              monitoring (ulcers, stress, nutrition)."
```

**Recommendation:** ✅ **Keep as required.** Horses are the only species where weaning date is genuinely important for health tracking.

---

### CATTLE - Important but Optional

**Biological Reality:**
- Calves weaned at 6-8 months (24-32 weeks)
- Distinct event but less traumatic than horses
- Nutritional transition is primary concern

**Current Config:**
```typescript
weaningType: "DISTINCT_EVENT",
required: false,
estimatedDurationWeeks: 24,
guidanceText: "Calves are typically weaned at 6-8 months.
              Recording weaning date is optional."
```

**Recommendation:** ✅ **Keep as optional distinct event.** Breeders who want to track it can, but not required for workflow.

---

### ALPACA / LLAMA - Important but Optional

**Biological Reality:**
- Crias weaned at 5-6 months (26 weeks)
- Distinct event
- Social dynamics matter (kept with herd)

**Current Config:**
```typescript
weaningType: "DISTINCT_EVENT",
required: false,
estimatedDurationWeeks: 26,
guidanceText: "Crias are typically weaned at 5-6 months.
              Recording weaning date is optional."
```

**Recommendation:** ✅ **Keep as optional distinct event.** Good model for camelids.

---

### DOG - Gradual Process

**Biological Reality:**
- Weaning is a 3-4 week gradual process (weeks 3-8)
- No single "weaning date" - it's a transition
- Puppies benefit from staying with dam 10-12 weeks for behavioral development
- AKC recommends 8 weeks minimum before placement

**Current Config:**
```typescript
weaningType: "GRADUAL_PROCESS",
required: false,
estimatedDurationWeeks: 6,
guidanceText: "Weaning is a gradual 3-4 week process (weeks 3-8).
              Puppies benefit from staying with mother 10-12 weeks
              for behavioral development. Recording weaning date is optional."
```

**Analysis:**
- Forcing a specific "weaning date" doesn't match reality
- Most breeders think in terms of "age at placement" not "weaning date"
- Current optional approach is appropriate

**Recommendation:** 🔄 **Consider alternative UI.** Instead of "Weaning Date", show a "Weaning Period" indicator (weeks 3-6) as informational, not a milestone to record.

---

### CAT - Gradual Process

**Biological Reality:**
- Kittens wean gradually over 4-8 weeks
- No single weaning date
- Emphasis on socialization (12-16 weeks recommended before placement)

**Current Config:**
```typescript
weaningType: "GRADUAL_PROCESS",
required: false,
estimatedDurationWeeks: 8,
guidanceText: "Kittens wean gradually over 4-8 weeks.
              Recording weaning date is optional."
```

**Recommendation:** 🔄 **Same as dogs.** Consider informational weaning period rather than milestone.

---

### GOAT - Gradual with Critical Minimum

**Biological Reality:**
- Kids wean over 6-8 weeks
- **Research shows weaning before 70 days causes "weaning shock"**
- Most important: don't wean too early

**Current Config:**
```typescript
weaningType: "GRADUAL_PROCESS",
required: false,
estimatedDurationWeeks: 9,
guidanceText: "Kids wean gradually over 6-8 weeks.
              Recording weaning date is optional."
```

**Analysis:**
- The critical factor is MINIMUM age at weaning (70+ days)
- Recording exact date less important than ensuring minimum age

**Recommendation:** ⚠️ **Add minimum weaning age validation.** If weaning date entered, validate it's at least 70 days from birth. Display warning if too early.

---

### SHEEP - Gradual Process

**Biological Reality:**
- Lambs wean over 6-8 weeks
- 60 days common for "early weaning" operations
- 8-12 weeks typical for smaller operations

**Current Config:**
```typescript
weaningType: "GRADUAL_PROCESS",
required: false,
estimatedDurationWeeks: 8,
guidanceText: "Lambs wean gradually over 6-8 weeks.
              Recording weaning date is optional."
```

**Recommendation:** ✅ **Keep as optional.**

---

### RABBIT - Gradual with Critical Maximum

**Biological Reality:**
- Kits wean over 4-6 weeks
- **Must be separated by 10 weeks to prevent fighting**
- ARBA recommends 6-8 weeks

**Current Config:**
```typescript
weaningType: "GRADUAL_PROCESS",
required: false,
estimatedDurationWeeks: 6,
guidanceText: "Kits wean gradually over 4-6 weeks.
              Recording weaning date is optional."
```

**Analysis:**
- Critical constraint is MAXIMUM age before separation (10 weeks)
- This is more about placement timing than weaning

**Recommendation:** ⚠️ **Add placement deadline warning.** Display warning if placement not started by week 8-9.

---

### PIG - Short Gradual Process

**Biological Reality:**
- Piglets weaned at 3-4 weeks
- Fastest weaning of all species
- Commercial operations often wean at 21 days

**Current Config:**
```typescript
weaningType: "GRADUAL_PROCESS",
required: false,
estimatedDurationWeeks: 4,
guidanceText: "Piglets are typically weaned at 3-4 weeks.
              Recording weaning date is optional."
```

**Recommendation:** ✅ **Keep as optional.**

---

### CHICKEN - Not Applicable

**Biological Reality:**
- No weaning concept (egg layers)
- Chicks become independent around 6-8 weeks
- More accurately "independence" rather than weaning

**Current Config:**
```typescript
weaningType: "GRADUAL_PROCESS",
required: false,
estimatedDurationWeeks: 6,
guidanceText: "Chicks become independent around 6-8 weeks.
              Recording independence date is optional."
```

**Recommendation:** 🔄 **Rename or skip.** Consider "Independence Date" label, or allow skipping weaning phase entirely.

---

## Recommendations Summary

### Immediate Actions

1. **Keep HORSE weaning as required** - Only species where it's genuinely critical
2. **Keep all others as optional** - Current approach is appropriate

### UI Improvements

| Species | Current | Proposed |
|---------|---------|----------|
| HORSE | Required date | Keep required |
| CATTLE, ALPACA, LLAMA | Optional date | Keep optional |
| DOG, CAT | Optional date | Consider "Weaning Period" indicator |
| GOAT | Optional date | Add minimum age validation (70 days) |
| RABBIT | Optional date | Add placement deadline warning |
| CHICKEN | Optional date | Rename to "Independence Date" |

### Skip Weaning Option

Consider allowing certain species to skip the weaning phase entirely:

```typescript
// speciesTerminology.ts addition
weaning: {
  ...existing,
  canSkip: boolean,              // Can user skip this phase?
  skipCondition?: "BIRTHED",     // What status to advance to on skip?
}
```

**Species that could skip:**
- CHICKEN (no biological weaning)
- Species where user is selling before weaning (rare)

### Phase Consolidation (Long-term)

For species where weaning is a gradual process coinciding with placement preparation, consider:

```
Option A: Current (separate phases)
BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED

Option B: Consolidated for gradual species
BIRTHED → PLACEMENT_PREP (weaning + prep) → PLACEMENT_COMPLETED
```

This would reduce mandatory phases for dogs, cats, etc. where weaning and placement prep overlap significantly.

## Validation Rules

### Current

```typescript
// Cannot clear weaning date if placement started
if (weanedDateActual && placementStartDateActual) {
  throw "Cannot clear weaning date after placement started";
}
```

### Proposed Additions

```typescript
// Minimum weaning age validation (goats)
if (species === 'GOAT' && weanedDateActual) {
  const ageAtWeaning = daysBetween(birthDateActual, weanedDateActual);
  if (ageAtWeaning < 70) {
    warn("Weaning before 70 days may cause weaning shock in goats");
  }
}

// Placement deadline warning (rabbits)
if (species === 'RABBIT' && !placementStartDateActual) {
  const ageInDays = daysBetween(birthDateActual, today);
  if (ageInDays > 56) { // 8 weeks
    warn("Rabbits should be placed before 10 weeks to prevent fighting");
  }
}
```

## Impact on New Species

When adding new species (e.g., additional camelids, exotic species):

1. **Determine weaning type:** Is it a distinct event or gradual process?
2. **Set required flag:** Only mark required if veterinary/health tracking demands it
3. **Document timing:** Typical weaning duration and any minimum/maximum constraints
4. **Consider skip option:** Does weaning make sense for this species?

## Data Migration

No migration needed - current data model supports all recommendations. Changes are UI/validation only.

