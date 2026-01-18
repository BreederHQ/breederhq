# Breeding Module Documentation

> Comprehensive documentation for the BreederHQ Breeding Plans system

## Overview

The Breeding Module is the core workflow engine for managing breeding plans from conception through offspring placement. It currently supports **6 active species** in the database, with terminology pre-configured for 5 additional species pending database migration.

## Documentation Index

### Core Architecture

| Document | Description |
|----------|-------------|
| [01-architecture-overview.md](./01-architecture-overview.md) | High-level system architecture, components, and data flow |
| [02-data-models.md](./02-data-models.md) | Database schema, Prisma models, and API types |
| [03-breeding-plan-lifecycle.md](./03-breeding-plan-lifecycle.md) | Complete lifecycle from PLANNING through COMPLETE |

### UI & User Experience

| Document | Description |
|----------|-------------|
| [04-ui-flow-journey.md](./04-ui-flow-journey.md) | PlanJourney component and user interaction patterns |
| [05-gantt-visualization.md](./05-gantt-visualization.md) | Timeline visualization with RollupGantt and PerPlanGantt |

### Species Configuration

| Document | Description |
|----------|-------------|
| [06-species-terminology.md](./06-species-terminology.md) | Species-specific terminology and feature flags |
| [07-anchor-mode-system.md](./07-anchor-mode-system.md) | Ovulation anchoring: CYCLE_START, OVULATION, BREEDING_DATE |
| [08-reproductive-engine.md](./08-reproductive-engine.md) | reproEngine calculations for timelines and projections |

### Phase-Specific Documentation

| Document | Description |
|----------|-------------|
| [09-weaning-phase-analysis.md](./09-weaning-phase-analysis.md) | Weaning viability assessment across species |
| [10-placement-phases.md](./10-placement-phases.md) | Placement Start vs Placement Completed analysis |

### Integration Points

| Document | Description |
|----------|-------------|
| [11-cycle-info-integration.md](./11-cycle-info-integration.md) | Connection to Animals module cycle tracking |
| [12-foaling-system.md](./12-foaling-system.md) | Horse-specific foaling workflow and milestones |

### Future Planning

| Document | Description |
|----------|-------------|
| [90-species-specific-recommendations.md](./90-species-specific-recommendations.md) | Recommendations for species-specific UI/UX improvements |
| [91-future-species-camelids.md](./91-future-species-camelids.md) | Preparation for additional species (camelids, etc.) |

---

## Quick Reference

### Active Species (in Database)

| Species | Anchor Mode | Gestation | Weaning Type | Testing Available |
|---------|-------------|-----------|--------------|-------------------|
| DOG | CYCLE_START → OVULATION | 63 days | Gradual | Yes (Progesterone, LH) |
| CAT | BREEDING_DATE (induced) | 63 days | Gradual | No (induced ovulator) |
| HORSE | CYCLE_START → OVULATION | 340 days | **Distinct (Required)** | Yes (Ultrasound) |
| GOAT | CYCLE_START only | 150 days | Gradual | No |
| SHEEP | CYCLE_START only | 147 days | Gradual | No |
| RABBIT | BREEDING_DATE (induced) | 31 days | Gradual | No (induced ovulator) |

### Prepared Species (Terminology Ready, Pending DB Migration)

| Species | Anchor Mode | Gestation | Notes |
|---------|-------------|-----------|-------|
| PIG | CYCLE_START only | 114 days | Litter species, fast weaning |
| CATTLE | CYCLE_START only | 283 days | Single offspring, long gestation |
| CHICKEN | SET_DATE (incubation) | 21 days | Egg layer - different model |
| ALPACA | BREEDING_DATE (induced) | 345 days | Camelid, induced ovulator |
| LLAMA | BREEDING_DATE (induced) | 350 days | Camelid, induced ovulator |

### Lifecycle Phases (8 Total)

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
                                                                                              ↓
                                                                                         (CANCELED)
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/breeding/src/components/PlanJourney.tsx` | Main plan detail UI (67KB) |
| `apps/breeding/src/components/RollupGantt.tsx` | Multi-plan timeline (35KB) |
| `packages/ui/src/utils/speciesTerminology.ts` | Species configuration |
| `packages/ui/src/utils/reproEngine/` | Timeline calculation engine |
| `breederhq-api/src/routes/breeding.ts` | API routes |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-18 | Initial comprehensive documentation |

