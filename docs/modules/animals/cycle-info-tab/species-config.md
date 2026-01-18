# Cycle Info Tab - Species Configuration

## Overview

The Cycle Info tab uses species-specific biology defaults throughout the system. This document consolidates all species-related configuration.

## Species Categories

### Spontaneous Ovulators
Ovulation occurs naturally during the heat cycle.

| Species | Cycle Length | Ovulation Day | Gestation |
|---------|--------------|---------------|-----------|
| DOG | 180 days | Day 12 | 63 days |
| HORSE | 21 days | Day 5 | 340 days |
| GOAT | 21 days | Day 2 | 150 days |
| SHEEP | 17 days | Day 2 | 147 days |
| PIG | 21 days | Day 2 | 114 days |
| CATTLE | 21 days | Day 1 | 283 days |

### Induced Ovulators
Ovulation is triggered by mating - no predictable ovulation day.

| Species | Cycle Length | Ovulation | Gestation |
|---------|--------------|-----------|-----------|
| CAT | 21 days | Induced | 63 days |
| RABBIT | 15 days | Induced | 31 days |
| ALPACA | 14 days | Induced | 345 days |
| LLAMA | 14 days | Induced | 350 days |

---

## Complete Species Defaults

### Backend Service (cycle-analysis-service.ts)

```typescript
const SPECIES_DEFAULTS = {
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
    isInducedOvulator: true
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
    isInducedOvulator: true
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
    isInducedOvulator: true
  },
  LLAMA: {
    ovulationOffsetDays: 0,
    gestationDays: 350,
    cycleLenDays: 14,
    isInducedOvulator: true
  }
};
```

### ReproEngine Defaults (packages/ui/src/utils/reproEngine/defaults.ts)

```typescript
interface SpeciesReproDefaults {
  cycleLenDays: number;
  ovulationOffsetDays: number;
  startBufferDays: number;
  gestationDays: number;
  offspringCareDurationWeeks: number;
  placementStartWeeksDefault: number;
  placementExtendedWeeks: number;
  juvenileFirstCycleMinDays: number;
  juvenileFirstCycleLikelyDays: number;
  juvenileFirstCycleMaxDays: number;
  postpartumMinDays: number;
  postpartumLikelyDays: number;
  postpartumMaxDays: number;
}
```

---

## Juvenile First Cycle Timing

When a female has no recorded cycles, the system estimates first heat based on age:

| Species | Likely First Cycle | Min | Max |
|---------|-------------------|-----|-----|
| DOG | 270 days (9 months) | 180 | 540 |
| CAT | 210 days (7 months) | 150 | 365 |
| HORSE | 450 days (15 months) | 365 | 730 |
| GOAT | 210 days (7 months) | 150 | 365 |
| RABBIT | 150 days (5 months) | 90 | 240 |
| SHEEP | 270 days (9 months) | 180 | 450 |

---

## Postpartum Return to Cycle

After giving birth, females don't immediately return to cycling:

| Species | Likely Return | Min | Max |
|---------|--------------|-----|-----|
| DOG | 120 days | 90 | 210 |
| CAT | 90 days | 45 | 180 |
| HORSE | 45 days | 30 | 120 |
| GOAT | 90 days | 45 | 150 |
| RABBIT | 21 days | 14 | 60 |
| SHEEP | 60 days | 45 | 120 |

---

## Frontend Component Defaults

### OvulationPatternAnalysis.tsx

```typescript
const SPECIES_OVULATION_DEFAULTS = {
  DOG: 12,
  HORSE: 5,
  CAT: 0,
  GOAT: 2,
  SHEEP: 2,
  RABBIT: 0,
  PIG: 2,
  CATTLE: 1
};
```

### CycleAlertBadge.tsx / calculateDaysUntilCycle()

```typescript
const SPECIES_CYCLE_LENGTHS = {
  DOG: 180,
  CAT: 21,
  HORSE: 21,
  GOAT: 21,
  SHEEP: 17,
  PIG: 21,
  CATTLE: 21,
  RABBIT: 15,
  ALPACA: 14,
  LLAMA: 14
};
```

### CycleLengthInsight.tsx

```typescript
const SPECIES_CYCLE_LENGTHS = {
  DOG: 180,
  CAT: 21,
  HORSE: 21,
  GOAT: 21,
  SHEEP: 17,
  PIG: 21,
  CATTLE: 21,
  RABBIT: 15,
  ALPACA: 14,
  LLAMA: 14
};
```

---

## Species-Specific Thresholds

### Cycle Length Anomaly Detection

| Species Type | Threshold |
|--------------|-----------|
| Long cycle (DOG, CAT) | +/-14 days is notable |
| Short cycle (others) | +/-3 days is notable |

### Ovulation Classification

| Classification | Threshold |
|----------------|-----------|
| Early Ovulator | avgOffset <= (speciesDefault - 2) |
| Late Ovulator | avgOffset >= (speciesDefault + 2) |
| Average | Between those thresholds |

---

## Seasonal Breeders

**Note:** Current implementation does NOT account for seasonality.

### Species with Breeding Seasons:

| Species | Breeding Season | Notes |
|---------|-----------------|-------|
| HORSE | Spring/Summer (Mar-Sep in N. Hemisphere) | Transition periods have irregular cycles |
| GOAT | Fall (Aug-Jan in N. Hemisphere) | Short-day breeders |
| SHEEP | Fall (Aug-Dec in N. Hemisphere) | Short-day breeders |

### Future Enhancement Needed:
- Seasonality awareness for projections
- "Out of season" indicators
- Transition period warnings

---

## Induced Ovulator Handling

**Current Status:** Partially implemented

For induced ovulators (CAT, RABBIT, ALPACA, LLAMA):
- `ovulationOffsetDays` is set to 0
- `isInducedOvulator` flag exists in backend

**Missing Frontend Handling:**
- Ovulation pattern analysis should be hidden
- Different guidance text needed
- Focus should be on heat tracking, not ovulation prediction

---

## Configuration Consolidation Needed

Currently, species defaults are duplicated in:
1. `cycle-analysis-service.ts` (backend)
2. `defaults.ts` (reproEngine)
3. Multiple frontend components

**Recommendation:** Create single source of truth:
```typescript
// packages/shared/src/species-config.ts
export const SPECIES_CONFIG = {
  DOG: { ... },
  CAT: { ... },
  // ...
};
```
