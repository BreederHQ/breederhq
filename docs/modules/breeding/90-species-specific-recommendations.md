# Species-Specific UI/UX Recommendations

## Overview

This document outlines recommendations for tailoring the breeding plan UI/flow to each species, ensuring the user experience is indicative and supportive of the species being managed.

## Current State

The breeding plan UI is **largely uniform across all species**. Species-specific behavior is driven by:
1. Terminology (from `speciesTerminology.ts`)
2. Timing defaults (from `reproEngine/defaults.ts`)
3. Feature flags (useCollars, showGroupConcept, etc.)

However, the **phase structure and workflow** are identical for all species.

## Recommended Species-Specific Adaptations

### Dogs (DOG)

**Current Experience:** Generic 8-phase workflow

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | CYCLE_START default | Prominent "Upgrade to Ovulation" prompt |
| Cycle Tracking | Basic date entry | Add cycle length learning integration |
| Weaning Phase | Discrete date | Informational "Weaning Period" (weeks 3-6) |
| Placement | 8-12 weeks | AKC compliance indicator |

**UI Enhancements:**
1. **Heat Tracking Widget:** Show cycle prediction from animal's history
2. **Progesterone Testing Prompt:** When in COMMITTED, suggest testing
3. **AKC Compliance Badge:** Show when placement meets 8-week minimum
4. **Litter Management Dashboard:** Prominent offspring tracking

**Anchor Mode Guidance:**
```
"Most accurate breeding predictions require progesterone testing.
 Without testing, predictions are ±3-5 days.
 With testing, predictions improve to ±1-2 days.
 [Learn more about progesterone testing]"
```

---

### Cats (CAT)

**Current Experience:** Generic workflow with BREEDING_DATE anchor

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | BREEDING_DATE (correct) | Emphasize as automatic |
| Cycle Concept | Hidden but present | Fully remove cycle terminology |
| Weaning Phase | Discrete date | Informational period |
| Placement | 12-16 weeks | Emphasize socialization period |

**UI Enhancements:**
1. **No Cycle Tracking:** Remove any cycle-related UI elements
2. **Breeding = Ovulation Message:** Clear explanation that breeding triggers ovulation
3. **Socialization Countdown:** Prominent display of weeks until optimal placement (12+)
4. **Queen Recovery Tracking:** Post-birth care focus

**Terminology:**
- Remove: "Heat start", "Cycle start"
- Use: "Breeding date", "Mating date"

---

### Horses (HORSE)

**Current Experience:** Full workflow with foaling milestones

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | CYCLE_START default | Strong OVULATION recommendation |
| Foaling | Milestones exist | Make more prominent |
| Weaning Phase | Required date | Keep as critical milestone |
| Placement | Long window (6-12 mo) | Consider simplifying to single phase |

**UI Enhancements:**
1. **Foaling-Centric Dashboard:** Foaling milestones as primary view during pregnancy
2. **Veterinary Integration Prompts:** Reminder for ultrasound scheduling
3. **Weaning Stress Guidance:** Education about weaning best practices
4. **Single Foal Optimization:** Skip PLACEMENT_STARTED for typical single births

**Foaling Milestones (Prominent):**
```
┌─────────────────────────────────────────────┐
│ FOALING MILESTONES                          │
├─────────────────────────────────────────────┤
│ ✓ Day 15: Pregnancy Check                   │
│ ✓ Day 45: First Ultrasound                  │
│ ○ Day 90: Second Ultrasound (Due: Mar 15)   │
│ ○ Day 300: Begin Monitoring                 │
│ ○ Day 320: Prepare Foaling Area             │
│ ○ Day 330: Daily Checks                     │
│ ○ Day 340: Due Date                         │
└─────────────────────────────────────────────┘
```

---

### Goats (GOAT)

**Current Experience:** Generic workflow

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | CYCLE_START only | Keep (no testing available) |
| Seasonal Breeding | Not addressed | Add seasonal awareness |
| Weaning Phase | Optional | Add 70-day minimum validation |
| Multiple Kids | Basic litter view | Emphasize count tracking |

**UI Enhancements:**
1. **Seasonal Breeding Indicator:** Flag if breeding planned outside typical fall season
2. **Weaning Age Validation:** Warning if weaning before 70 days
3. **Kid Count Focus:** Prominent display of born/live/weaned counts
4. **Disbudding Reminder:** Species-specific care milestone

**Validation Rule:**
```typescript
if (species === 'GOAT' && weanedDateActual) {
  const ageAtWeaning = daysBetween(birthDateActual, weanedDateActual);
  if (ageAtWeaning < 70) {
    showWarning("Weaning kids before 70 days may cause weaning shock.
                Research recommends minimum 10 weeks.");
  }
}
```

---

### Rabbits (RABBIT)

**Current Experience:** Generic workflow with BREEDING_DATE anchor

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | BREEDING_DATE (correct) | Emphasize induced ovulation |
| Fast Turnaround | Not emphasized | Highlight 31-day gestation |
| Weaning Phase | Optional | Standard |
| Placement Deadline | Not enforced | Add 10-week warning |

**UI Enhancements:**
1. **Quick Turnaround UI:** Emphasize fast gestation (31 days)
2. **Breeding-Induced Message:** Explain automatic ovulation
3. **Placement Deadline Warning:** Alert at week 8-9 about separation needs
4. **Litter Size Focus:** Rabbits have large litters (6-12)

**Critical Warning:**
```
⚠️ PLACEMENT DEADLINE
Rabbits must be separated by 10 weeks to prevent fighting.
Current litter age: 9 weeks, 2 days
Time remaining: 5 days

[Start Placements Now]
```

---

### Sheep (SHEEP)

**Current Experience:** Generic workflow

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | CYCLE_START only | Keep (no testing) |
| Seasonal Breeding | Not addressed | Add fall breeding awareness |
| Weaning Phase | Optional | Standard |
| Lamb Count | Basic | Emphasize twin/triplet tracking |

**UI Enhancements:**
1. **Seasonal Indicator:** Flag spring breedings (outside normal fall)
2. **Twin/Triplet Tracking:** Sheep commonly have multiples
3. **Lambing Date Focus:** 147-day gestation counter

---

### Pigs (PIG)

**Current Experience:** Generic workflow

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | CYCLE_START only | Keep |
| Large Litters | Not emphasized | Prominent litter size tracking |
| Fast Weaning | 3-4 weeks | Emphasize quick turnaround |
| Commercial Focus | Not addressed | Optional commercial mode |

**UI Enhancements:**
1. **Litter Size Emphasis:** Pigs have large litters (8-14)
2. **Quick Weaning Timeline:** 3-4 week weaning prominent
3. **Farrowing Focus:** Use correct terminology
4. **Weight Tracking:** Option for piglet weight monitoring

---

### Cattle (CATTLE)

**Current Experience:** Generic workflow

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | CYCLE_START only | Keep |
| Single Calf | Not optimized | Skip PLACEMENT_STARTED |
| Long Gestation | 283 days | Prominent countdown |
| Weaning | 6-8 months | Distinct but optional |

**UI Enhancements:**
1. **Single Calf Optimization:** Simplified placement phase
2. **Long Gestation Counter:** 9+ month countdown prominent
3. **Calving Terminology:** Use correct terms
4. **Breeding Calendar Integration:** For herd management

---

### Chickens (CHICKEN)

**Current Experience:** Adapted but not optimized

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | SET_DATE (incubation) | Emphasize as different model |
| No Gestation | Uses gestation language | Rename to "Incubation" |
| No Weaning | Listed as optional | Rename to "Independence" |
| Placement | Standard phases | Consider "Flock Assignment" |

**UI Enhancements:**
1. **Incubation-Centric UI:** Completely different from mammal breeding
2. **Hatch Date Focus:** 21-day incubation countdown
3. **Brooder Care Phase:** Instead of "weaning"
4. **Different Terminology Throughout:** Eggs, hatching, chicks, flock

**Renamed Phases:**
```
PLANNING → SET_DATE → INCUBATING → HATCHED → BROODER_CARE → PLACED
```

---

### Alpacas & Llamas (ALPACA, LLAMA)

**Current Experience:** Generic workflow with BREEDING_DATE anchor

**Recommended Adaptations:**

| Aspect | Current | Proposed |
|--------|---------|----------|
| Anchor Mode | BREEDING_DATE (correct) | Emphasize induced ovulation |
| Long Gestation | 345-350 days | Prominent countdown |
| Single Cria | Not optimized | Skip PLACEMENT_STARTED |
| Weaning | 5-6 months distinct | Keep as optional |

**UI Enhancements:**
1. **Induced Ovulator Message:** Explain that breeding triggers ovulation
2. **Year-Long Gestation Counter:** Nearly 12-month countdown
3. **Single Cria Optimization:** Simplified placement
4. **Herd Integration Focus:** Crias stay with herd longer

**Terminology:**
- Offspring: Cria/Crias
- Birth: Birthing (not kidding, not foaling)
- Group: Birth record (not litter)

---

## Implementation Priority

### Tier 1: High Impact, Moderate Effort

1. **Horses:** Foaling milestone prominence + single-offspring phase simplification
2. **Dogs:** Progesterone testing prompts + cycle learning integration
3. **Cats/Rabbits:** Induced ovulator messaging + terminology cleanup

### Tier 2: Medium Impact, Lower Effort

4. **Goats:** Weaning age validation (70-day minimum)
5. **Rabbits:** Placement deadline warning (10-week max)
6. **Cattle/Alpaca/Llama:** Single-offspring phase simplification

### Tier 3: Future Enhancements

7. **Seasonal breeding awareness** (horses, goats, sheep)
8. **Chickens:** Complete terminology overhaul
9. **Pigs:** Commercial mode option

---

## Feature Flag Approach

Instead of conditional code, use feature flags per species:

```typescript
// speciesTerminology.ts additions
workflow: {
  showCyclePhase: boolean,           // Show cycle/heat tracking
  showHormoneTestingPrompt: boolean, // Prompt for ovulation testing
  showFoalingMilestones: boolean,    // Horse-specific milestones
  showWeaningAsRequired: boolean,    // Require weaning date
  showWeaningAsGradual: boolean,     // Show as informational period
  skipPlacementStartPhase: boolean,  // Combine placement phases
  showPlacementDeadline: boolean,    // Warn about placement timing
  placementDeadlineWeeks?: number,   // When to warn
  weaningMinimumDays?: number,       // Minimum weaning age
  showSeasonalBreedingWarning: boolean,
  typicalBreedingSeason?: string,    // "fall" | "spring" | "year-round"
}
```

This allows UI to adapt dynamically without scattered conditionals.

---

## User Research Needed

Before implementing, validate assumptions:

1. **Dog breeders:** How many use progesterone testing? Would prompts help?
2. **Horse breeders:** Is foaling milestone tracking used? Is it prominent enough?
3. **Rabbit breeders:** Is the 10-week deadline well-known? Is a warning valuable?
4. **Goat breeders:** Is 70-day weaning minimum widely practiced?
5. **All breeders:** Is the current 8-phase workflow confusing? Would species-specific phase counts help?

