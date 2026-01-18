# Future Species: Camelids and Beyond

## Overview

This document addresses preparation for additional species on the platform, with particular focus on camelids (alpacas, llamas) which are partially implemented, and considerations for future species additions.

## Current Camelid Support

### Alpaca (ALPACA)

**Status:** Fully configured in `speciesTerminology.ts` and `reproEngine/defaults.ts`

**Current Configuration:**

```typescript
// speciesTerminology.ts
ALPACA: {
  offspring: { singular: "cria", plural: "crias" },
  birth: { process: "birthing", verb: "birthed" },
  group: { singular: "birth record", plural: "birth records" },
  parents: { female: "dam", male: "sire" },

  anchorMode: {
    options: [{ type: "BREEDING_DATE", ... }],
    recommended: "BREEDING_DATE",
    defaultAnchor: "BREEDING_DATE",
    isInducedOvulator: true,
    testingAvailable: false,
    supportsUpgrade: false
  },

  weaning: {
    weaningType: "DISTINCT_EVENT",
    required: false,
    estimatedDurationWeeks: 26,  // 5-6 months
    guidanceText: "Crias are typically weaned at 5-6 months."
  },

  features: {
    useCollars: false,
    emphasizeCounts: false,
    showGroupConcept: false,
    usesLitterWaitlist: false
  }
}

// reproEngine/defaults.ts
ALPACA: {
  cycleLenDays: 14,              // Receptivity window (not true cycle)
  ovulationOffsetDays: 0,        // Induced - breeding IS ovulation
  gestationDays: 345,            // ~11.5 months
  offspringCareDurationWeeks: 26, // Weaning at 5-6 months
  placementStartWeeksDefault: 28,
  placementExtendedWeeks: 12,
  juvenileFirstCycleLikelyDays: 365,
  postpartumLikelyDays: 21       // Can be bred back quickly
}
```

### Llama (LLAMA)

**Status:** Fully configured, nearly identical to alpaca

```typescript
LLAMA: {
  // Same structure as ALPACA with:
  gestationDays: 350,            // Slightly longer (~11.7 months)
  // Otherwise identical configuration
}
```

## Camelid-Specific Considerations

### Induced Ovulation

Camelids are induced ovulators, like cats and rabbits. Key implications:

1. **No Heat Cycle:** No traditional estrus cycle to track
2. **Breeding = Ovulation:** The breeding act triggers ovulation within 24-48 hours
3. **Receptivity Windows:** Females have receptivity periods but no predictable cycle
4. **High Confidence:** Breeding date provides HIGH confidence anchor

**UI Implications:**
- Skip cycle tracking entirely
- BREEDING_DATE is the only anchor mode
- Timeline starts from breeding, not cycle start

### Long Gestation

At 345-350 days (~11.5 months), camelids have among the longest gestations:

| Species | Gestation |
|---------|-----------|
| Alpaca | 345 days |
| Llama | 350 days |
| Horse | 340 days |
| Cattle | 283 days |
| Dog/Cat | 63 days |

**UI Implications:**
- Year-long countdown display
- Multiple milestone checkpoints
- Consider pregnancy progress percentage

### Single Offspring (Cria)

Camelids almost always have single births:
- Twins are rare (<1%)
- Triplets essentially unheard of

**UI Implications:**
- Default to single-offspring workflow
- Skip PLACEMENT_STARTED phase (see placement phase analysis)
- No litter management needed

### Herd Dynamics

Crias remain with the herd longer than typical livestock:
- Weaning at 5-6 months
- Stay with herd post-weaning
- Socialization important

**UI Implications:**
- Emphasize herd integration
- Placement timing less critical than for dogs/cats
- No separation urgency

## Recommended Camelid UI Adaptations

### Phase Structure

```
Current (8 phases):
PLANNING → COMMITTED → BRED → BIRTHED → WEANED →
  PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE

Proposed for Camelids (7 phases):
PLANNING → COMMITTED → BRED → BIRTHED → WEANED →
  PLACEMENT → COMPLETE
```

Skip PLACEMENT_STARTED since single cria goes home at once.

### Timeline Display

Given the ~12 month gestation:

```
┌─────────────────────────────────────────────────────────────────────┐
│ PREGNANCY TIMELINE                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Bred: Jan 15, 2026                                                  │
│ Due: Dec 26, 2026 (345 days)                                        │
│                                                                     │
│ Progress: ████████████░░░░░░░░░░░░░░░░░░░░ 35%                     │
│           Day 120 of 345                                            │
│                                                                     │
│ Milestones:                                                         │
│ ✓ Day 21: Pregnancy confirmation (ultrasound)                       │
│ ○ Day 60: Second confirmation                                       │
│ ○ Day 300: Begin monitoring                                         │
│ ○ Day 330: Prepare birthing area                                    │
│ ○ Day 345: Due date                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Terminology

| Generic | Camelid-Specific |
|---------|------------------|
| Offspring | Cria |
| Birth | Birthing (not kidding, foaling, etc.) |
| Litter | Birth record |
| Dam/Sire | Dam/Sire (same) |
| Heat/Cycle | Receptivity (or omit) |

### Breeding-Induced Message

```
ℹ️ INDUCED OVULATOR

Alpacas ovulate in response to breeding, not on a regular cycle.
The breeding date is your most accurate anchor for timeline calculations.

No heat/cycle tracking is needed - simply record when breeding occurs.
```

## Future Species Framework

### Adding a New Species

When adding a new species, ensure these are configured:

#### 1. Terminology (`speciesTerminology.ts`)

```typescript
NEW_SPECIES: {
  offspring: { singular, plural, singularCap, pluralCap },
  birth: { process, processCap, verb, verbCap, dateLabel },
  group: { singular, plural, singularCap, pluralCap, inCare },
  parents: { female, male, femaleCap, maleCap },
  care: { stage, inCareLabel },

  cycle: {
    startLabel,
    startLabelCap,
    anchorDateLabel,
    cycleExplanation,
    cycleStartHelp,
    breedingDateLabel
  },

  ovulation: {
    label,
    dateLabel,
    confirmationMethod,
    guidanceText,
    testingGuidance,
    confirmationMethods: []
  },

  anchorMode: {
    options: [...],
    recommended,
    defaultAnchor,
    testingAvailable,
    testingCommon,
    supportsUpgrade,
    upgradeFrom,
    upgradeTo,
    isInducedOvulator
  },

  weaning: {
    weaningType,
    required,
    estimatedDurationWeeks,
    guidanceText,
    statusLabel,
    actualDateLabel
  },

  features: {
    useCollars,
    emphasizeCounts,
    showGroupConcept,
    usesLitterWaitlist
  }
}
```

#### 2. Biological Defaults (`reproEngine/defaults.ts`)

```typescript
NEW_SPECIES: {
  cycleLenDays: number,
  ovulationOffsetDays: number,
  startBufferDays: number,
  gestationDays: number,
  offspringCareDurationWeeks: number,
  placementStartWeeksDefault: number,
  placementExtendedWeeks: number,
  juvenileFirstCycleMinDays: number,
  juvenileFirstCycleLikelyDays: number,
  juvenileFirstCycleMaxDays: number,
  postpartumMinDays: number,
  postpartumLikelyDays: number,
  postpartumMaxDays: number
}
```

#### 3. Database Enum

Add to `Species` enum in Prisma schema:

```prisma
enum Species {
  DOG
  CAT
  HORSE
  GOAT
  SHEEP
  RABBIT
  PIG
  CATTLE
  CHICKEN
  ALPACA
  LLAMA
  NEW_SPECIES  // Add here
}
```

#### 4. Validation Rules (if species-specific)

Add to `dateValidation/defaults.ts` if special validation needed.

### Potential Future Species

| Species | Ovulation Type | Offspring | Gestation | Notes |
|---------|----------------|-----------|-----------|-------|
| **Donkey** | Cyclic | Single | 360-375 days | Similar to horse |
| **Mule** | N/A | N/A | N/A | Sterile (breeding not applicable) |
| **Guinea Pig** | Cyclic | Litter (1-8) | 59-72 days | Fast breeding cycle |
| **Ferret** | Induced | Litter (1-18) | 42 days | Induced ovulator |
| **Chinchilla** | Cyclic | Litter (1-6) | 111 days | Long gestation for rodent |
| **Hedgehog** | Cyclic | Litter (3-5) | 35 days | Short gestation |
| **Miniature Pig** | Cyclic | Litter (3-12) | 114 days | Same as standard pig |
| **Peacock** | Egg layer | Clutch | 28-30 days | Different model |
| **Duck** | Egg layer | Clutch | 28 days | Different model |
| **Goose** | Egg layer | Clutch | 28-35 days | Different model |

### Species Categories

For UI/workflow purposes, species fall into categories:

| Category | Species | Workflow Characteristics |
|----------|---------|-------------------------|
| **Cyclic, Litter** | Dog, Goat, Sheep, Pig | Cycle tracking, litter management, waitlist |
| **Cyclic, Individual** | Horse, Cattle | Cycle tracking, single offspring, simplified placement |
| **Induced, Litter** | Cat, Rabbit, Ferret | No cycle, litter management |
| **Induced, Individual** | Alpaca, Llama | No cycle, single offspring, simplified all around |
| **Egg Layer** | Chicken, Duck, Goose | Different model entirely |

## Implementation Checklist for New Species

### Pre-Implementation Research

- [ ] Determine ovulation type (cyclic vs induced)
- [ ] Research typical offspring count
- [ ] Determine gestation period
- [ ] Research weaning practices
- [ ] Determine if testing infrastructure exists
- [ ] Identify species-specific milestones
- [ ] Research typical placement age
- [ ] Identify any critical constraints (min/max ages, etc.)

### Configuration

- [ ] Add to `speciesTerminology.ts` with all required fields
- [ ] Add to `reproEngine/defaults.ts` with biological data
- [ ] Add to Species enum in Prisma schema
- [ ] Run migration to add enum value
- [ ] Add any species-specific validation rules

### Testing

- [ ] Create breeding plan for new species
- [ ] Verify terminology throughout UI
- [ ] Test timeline calculations
- [ ] Verify milestone generation (if applicable)
- [ ] Test full lifecycle through COMPLETE

### Documentation

- [ ] Update this document with new species
- [ ] Add species to README species table
- [ ] Document any unique behaviors

## Camelid-Specific Milestones

Consider adding camelid-specific pregnancy milestones:

```typescript
enum CamelidMilestoneType {
  PREGNANCY_CHECK_21D,           // Day 21 ultrasound confirmation
  PREGNANCY_CHECK_60D,           // Day 60 second confirmation
  BEGIN_MONITORING_300D,         // Day 300 start monitoring
  PREPARE_BIRTHING_AREA_330D,    // Day 330 prepare area
  DUE_DATE_345D,                 // Day 345 (alpaca) or 350 (llama)
  OVERDUE_CHECK_365D,            // Day 365 vet consultation
}
```

This mirrors the foaling milestone system for horses but with camelid-appropriate timing.

## Summary

**Current State:**
- Alpaca and Llama are fully configured in the terminology and defaults
- They work through the existing breeding plan workflow
- No special UI adaptations exist beyond terminology

**Recommended Next Steps:**
1. Simplify placement phases for camelids (skip PLACEMENT_STARTED)
2. Add camelid-specific pregnancy milestones
3. Emphasize the induced ovulator nature in UI
4. Add year-long gestation progress display
5. Test full lifecycle with real camelid breeding scenarios

**For Future Species:**
- Follow the established pattern in terminology and defaults
- Categorize by ovulation type and offspring count
- Use feature flags for workflow adaptations
- Document unique constraints and milestones

