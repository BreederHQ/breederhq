# Breeding Module Architecture Overview

## System Architecture

The breeding module is a multi-layered system spanning three main areas:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (apps/breeding/)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  YourBreedingPl- │  │   PlanJourney    │  │    FoalingPage           │  │
│  │  ansPage (Main)  │  │  (Plan Detail)   │  │  (Horse-specific)        │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────┬─────────────┘  │
│           │                      │                         │                │
│  ┌────────▼─────────────────────▼─────────────────────────▼─────────────┐  │
│  │                         Visualization Layer                           │  │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │  │
│  │   │ RollupGantt│  │PerPlanGantt│  │ Breeding   │  │ Genetics Lab   │ │  │
│  │   │  (multi)   │  │  (single)  │  │ Calendar   │  │ (Punnett, COI) │ │  │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌─────────────────────────────────▼────────────────────────────────────┐  │
│  │                          Adapter Layer                                │  │
│  │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │  │
│  │   │   planWindows    │  │    planToGantt   │  │  deriveBreeding- │  │  │
│  │   │  (timeline calc) │  │  (normalization) │  │    Status        │  │  │
│  │   └──────────────────┘  └──────────────────┘  └──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SHARED PACKAGES (packages/)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    packages/ui/src/utils/                               │ │
│  │   ┌──────────────────────┐  ┌──────────────────────────────────────┐  │ │
│  │   │ speciesTerminology   │  │          reproEngine/                 │  │ │
│  │   │ (11 species configs) │  │  ├── defaults.ts (biology)           │  │ │
│  │   │                      │  │  ├── effectiveCycleLen.ts            │  │ │
│  │   │ - Offspring terms    │  │  ├── projectUpcomingCycles.ts        │  │ │
│  │   │ - Birth process      │  │  ├── timelineFromSeed.ts             │  │ │
│  │   │ - Anchor modes       │  │  ├── normalize.ts                    │  │ │
│  │   │ - Weaning config     │  │  └── types.ts                        │  │ │
│  │   │ - Feature flags      │  │                                       │  │ │
│  │   └──────────────────────┘  └──────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    packages/api/src/                                    │ │
│  │   ┌──────────────────────┐  ┌──────────────────────────────────────┐  │ │
│  │   │ types/breeding.ts    │  │ resources/breeding.ts (API client)   │  │ │
│  │   └──────────────────────┘  └──────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (breederhq-api/)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         routes/                                         │ │
│  │   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐│ │
│  │   │   breeding.ts    │  │breeding-programs │  │ breeding-program-    ││ │
│  │   │   (Core CRUD)    │  │      .ts         │  │    rules.ts          ││ │
│  │   └──────────────────┘  └──────────────────┘  └──────────────────────┘│ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         services/                                       │ │
│  │   ┌──────────────────────────┐  ┌─────────────────────────────────┐   │ │
│  │   │ breeding-foaling-service │  │ mare-reproductive-history-service│   │ │
│  │   │ (horse-specific)         │  │ cycle-analysis-service           │   │ │
│  │   └──────────────────────────┘  └─────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    prisma/schema.prisma                                 │ │
│  │   BreedingPlan, OffspringGroup, Offspring, BreedingMilestone,          │ │
│  │   BreedingPlanEvent, TestResult, BreedingAttempt, PregnancyCheck       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

### Main Entry Points

```
apps/breeding/src/
├── main.tsx                          # Application entry
├── App-Breeding.tsx                  # Main app component
├── api.ts                            # API client (987 lines)
├── FoalingPage.tsx                   # Horse-specific foaling view
│
├── pages/
│   └── planner/
│       ├── YourBreedingPlansPage.tsx # Main planner page
│       ├── RollupWithPhaseToggles.tsx# Rollup view with filters
│       ├── PhaseGroupedPerPlan.tsx   # Per-plan grouped view
│       ├── deriveBreedingStatus.ts   # Status derivation logic
│       ├── whatIfLogic.ts            # What-if scenario logic
│       └── usePlanToggles.ts         # Phase toggle hook
│
├── adapters/
│   ├── planWindows.ts                # Plan → Phase windows
│   └── planToGantt.ts                # Gantt normalization
│
└── components/                        # 28+ UI components
    ├── PlanJourney.tsx               # Plan detail view (67KB)
    ├── RollupGantt.tsx               # Multi-plan timeline (35KB)
    ├── PerPlanGantt.tsx              # Single-plan timeline (24KB)
    ├── BreedingCalendar.tsx          # Calendar view (19KB)
    │
    ├── # Genetics Lab
    ├── PunnettSquare.tsx             # Genetic predictions
    ├── OffspringSimulator.tsx        # Genetic simulation (35KB)
    ├── CoatColorPreview.tsx          # Coat genetics (33KB)
    ├── HealthRiskSummary.tsx         # Health analysis (47KB)
    ├── BestMatchFinder.tsx           # Pairing recommendations
    │
    ├── # Foaling (Horse-specific)
    ├── FoalingMilestoneChecklist.tsx # Milestone tracking (21KB)
    ├── FoalingOutcomeTab.tsx         # Outcome recording (16KB)
    ├── FoalingTimeline.tsx           # Timeline view (12KB)
    ├── FoalingAnalytics.tsx          # Statistics (14KB)
    ├── PostFoalingHeatTracker.tsx    # Heat tracking (17KB)
    └── RecordFoalingModal.tsx        # Foaling recording (16KB)
```

## Data Flow

### Plan Creation Flow

```
User Input (UI)
    │
    ▼
PlanJourney.tsx ──────────────────────────┐
    │                                      │
    │ (validate)                           │
    ▼                                      ▼
api.ts ───────────────────────► POST /breeding/plans
    │                                      │
    │                                      ▼
    │                           breeding.ts (route)
    │                                      │
    │                                      ▼
    │                           BreedingPlan.create (Prisma)
    │                                      │
    │                                      ▼
    │                           ensureOffspringGroup()
    │                                      │
    │                                      ▼
    │                           syncAnimalBreedingStatus()
    │                                      │
    ◄──────────────────────────────────────┘
    │
    ▼
Update UI State
```

### Timeline Calculation Flow

```
BreedingPlan data
    │
    ▼
planWindows.ts
    │
    │ detectAnchor()
    │ - Priority: birthActual > ovulationConfirmed > cycleStart
    ▼
reproEngine/timelineFromSeed.ts
    │
    │ getSpeciesDefaults(species)
    │ - cycleLenDays, ovulationOffsetDays, gestationDays, etc.
    ▼
Calculate Phase Windows
    │
    │ For each phase:
    │ - pre_breeding_full/likely
    │ - hormone_testing_full/likely
    │ - breeding_full/likely
    │ - birth_full/likely
    │ - post_birth_care_full/likely
    │ - placement_normal_full/likely
    │ - placement_extended_full/likely
    ▼
PlanStageWindows object
    │
    ▼
RollupGantt / PerPlanGantt
    │
    │ normalizeBands() for risky/unlikely edges
    ▼
SVG Visualization
```

## Key Design Patterns

### 1. Metadata-Driven Species Configuration

Rather than conditional logic per species, the system uses configuration objects:

```typescript
// speciesTerminology.ts provides species-specific:
- Offspring terminology (puppy vs foal vs kit)
- Birth process names (whelping vs foaling vs kindling)
- Parent terminology (dam/sire vs mare/stallion)
- Anchor mode options and recommendations
- Weaning configuration (required vs optional, distinct vs gradual)
- Feature flags (useCollars, showGroupConcept, etc.)

// reproEngine/defaults.ts provides species-specific biology:
- Cycle length, ovulation offset, gestation days
- Weaning duration, placement windows
- Juvenile first cycle prediction
- Postpartum return timing
```

### 2. Anchor Mode System

Plans are anchored to a known date for timeline calculation:

```
CYCLE_START (default for most species)
    │
    │ +ovulationOffsetDays
    ▼
OVULATION (upgrade path for dogs/horses with testing)
    │
    │ +gestationDays
    ▼
Expected Birth Date
    │
    │ +offspringCareDurationWeeks
    ▼
Expected Weaning Date
    │
    │ +placementStartWeeksDefault
    ▼
Expected Placement Start
```

### 3. Phase Prerequisite Validation

Status transitions require specific prerequisites:

```typescript
// deriveBreedingStatus.ts logic
const prerequisites = {
  PLANNING: [],
  COMMITTED: ['name', 'species', 'dam', 'sire', 'breed', 'lockedCycle'],
  BRED: ['cycleStartDateActual'],
  BIRTHED: ['breedDateActual'],
  WEANED: ['birthDateActual'],
  PLACEMENT_STARTED: ['weanedDateActual'],
  PLACEMENT_COMPLETED: ['placementStartDateActual'],
  COMPLETE: ['placementCompletedDateActual']
};
```

### 4. Event Sourcing for Audit Trail

All plan changes are tracked via events:

```typescript
model BreedingPlanEvent {
  id, tenantId, breedingPlanId
  type: "PLAN_CREATED" | "PLAN_COMMITTED" | "ANCHOR_LOCKED" |
        "ANCHOR_UPGRADED" | "STATUS_CHANGED" | "DATE_RECORDED" | ...
  field?: string
  before, after: JSON
  notes?: string
  actorId
  occurredAt
}
```

### 5. Offspring Group Lifecycle

1:1 relationship with breeding plan, created at commit:

```
BreedingPlan (COMMITTED)
    │
    │ ensureOffspringGroup()
    ▼
OffspringGroup (linked state)
    │
    │ At birth recording
    ▼
Offspring[] (individual records)
    │
    │ Per-offspring tracking
    ▼
- lifeState (ALIVE/DECEASED)
- placementState (UNASSIGNED → RESERVED → PLACED)
- keeperIntent (AVAILABLE/WITHHELD/KEEP)
- financialState (deposits, payments)
- paperworkState (contracts)
```

## Integration Points

### Animals Module Integration

```
Animal (Female)
    │
    │ ReproductiveCycle records
    │ - cycleStart, ovulation, confidence
    ▼
CycleInfo Tab (apps/animals)
    │
    │ Pattern learning from history
    ▼
Next Cycle Projection
    │
    │ Feed into breeding plan
    ▼
BreedingPlan.lockedCycleStart
```

### Finance Module Integration

```
BreedingPlan
    │
    │ depositsCommittedCents, depositsPaidCents
    ▼
OffspringGroup
    │
    │ marketplaceDefaultPriceCents
    ▼
Offspring
    │
    │ financialState per offspring
    ▼
Invoice/Payment records (finance module)
```

### Marketplace Integration

```
BreedingProgram (marketplace listing)
    │
    │ Contains multiple plans
    ▼
BreedingPlan[]
    │
    ▼
WaitlistEntry[] (buyer reservations)
    │
    ▼
OffspringGroupBuyer[] (assignments)
```

## Performance Considerations

1. **Gantt Rendering**: Uses SVG with optimized re-renders; plans limited to visible viewport
2. **Timeline Calculations**: Cached in adapter layer; only recalculated on data change
3. **Species Config**: Static configuration loaded once at app initialization
4. **Offspring Groups**: Lazy-loaded only when viewing plan details
5. **Event History**: Paginated with limit defaults

## Security Model

- All routes protected by tenant isolation (`tenantId` on every query)
- Organization-level access control for multi-org tenants
- Audit trail via events tracks all actor changes
- Dam/sire assignments validate species match and sex

