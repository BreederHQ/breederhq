# Cycle Info Tab - Architecture

## System Overview

The Cycle Info tab is a sophisticated reproductive cycle tracking and analysis system spanning frontend components, backend services, and utility libraries. It provides breeders with data-driven insights into individual female's ovulation patterns, cycle lengths, and upcoming breeding windows.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CycleTab (Parent)                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ State: dates, cycleAnalysis, overrideInput, editing             │    │
│  │ Fetches: api.animals.getCycleAnalysis()                         │    │
│  │ Uses: projectUpcomingCycleStarts()                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│         ┌──────────────────────────┼──────────────────────────┐         │
│         ▼                          ▼                          ▼         │
│  ┌─────────────┐         ┌─────────────────┐         ┌──────────────┐   │
│  │ Record Heat │         │ NextCycleHero   │         │ OvulationDot │   │
│  │ (DatePicker)│         │ (Countdown)     │         │ Plot         │   │
│  └─────────────┘         └─────────────────┘         └──────────────┘   │
│                                    │                                     │
│         ┌──────────────────────────┼──────────────────────────┐         │
│         ▼                          ▼                          ▼         │
│  ┌─────────────┐         ┌─────────────────┐         ┌──────────────┐   │
│  │ Cycle       │         │ Ovulation       │         │ Cycle        │   │
│  │ Settings    │         │ Summary         │         │ History      │   │
│  └─────────────┘         └─────────────────┘         └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API Layer                                        │
│  GET /animals/:id/cycle-analysis → CycleAnalysisResult                  │
│  PUT /animals/:id/cycle-start-dates → { dates: string[] }               │
│  PATCH /animals/:id → { femaleCycleLenOverrideDays: number }            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Backend Service                                       │
│  cycle-analysis-service.ts                                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 1. Fetch animal & reproductive cycles                           │    │
│  │ 2. Fetch breeding plans with ovulation data                     │    │
│  │ 3. Enrich cycles with ovulation confidence                      │    │
│  │ 4. Calculate ovulation pattern (avg, stddev, classification)    │    │
│  │ 5. Calculate effective cycle length                             │    │
│  │ 6. Project next cycle with ovulation window                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Database                                         │
│  ┌────────────┐  ┌──────────────────┐  ┌────────────────┐               │
│  │   Animal   │  │ ReproductiveCycle │  │  BreedingPlan  │               │
│  │  - species │  │ - cycleStartObs  │  │ - ovulationDate│               │
│  │  - override│  │ - notes          │  │ - ovMethod     │               │
│  └────────────┘  └──────────────────┘  │ - birthDate    │               │
│                                         └────────────────┘               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
CycleTab
├── Record Heat Action (standalone div)
│   ├── DatePicker
│   └── Record Button
│
├── NextCycleHero
│   └── Countdown display with urgency styling
│
├── SectionCard: "Ovulation Pattern"
│   ├── OvulationDotPlot
│   │   └── Scatter visualization with reference lines
│   └── Classification guidance text
│
└── SectionCard: "Cycle Settings"
    ├── Cycle length override input
    └── Warning banner (if conflict)
```

## State Management

### CycleTab State

| State | Type | Purpose |
|-------|------|---------|
| `dates` | `string[]` | Sorted ISO cycle start dates |
| `cycleAnalysis` | `CycleAnalysisResult \| null` | Full analysis from backend |
| `cycleAnalysisLoading` | `boolean` | Loading indicator |
| `editing` | `Record<string, boolean>` | Which dates are being edited |
| `newDateIso` | `string` | New date being added |
| `overrideInput` | `string` | Cycle length override input |
| `overrideSaving` | `boolean` | Override save in progress |
| `cycleHistoryExpanded` | `boolean` | History section expanded |
| `confirmDeleteIso` | `string \| null` | Date pending deletion |

### Derived Calculations

| Calculation | Source | Purpose |
|-------------|--------|---------|
| `cycleStartsAsc` | `normalizeCycleStartsAsc(dates)` | Cleaned, sorted dates |
| `lastHeatIso` | Last item in `cycleStartsAsc` | Most recent heat |
| `proj` | `projectUpcomingCycleStarts()` | Future cycle projections |
| `learned` | From `proj.effective` | Cycle length with source |
| `projected` | From `proj.projected` | Array of future dates |

## API Integration

### Endpoints Used

1. **GET /animals/:id/cycle-analysis**
   - Returns: `CycleAnalysisResult`
   - Called: On component mount and after date changes

2. **PUT /animals/:id/cycle-start-dates**
   - Body: `{ animalId: number, dates: string[] }`
   - Called: When adding/editing/deleting cycle dates

3. **PATCH /animals/:id**
   - Body: `{ femaleCycleLenOverrideDays: number | null }`
   - Called: When saving/clearing cycle length override

## Utility Libraries

### reproEngine (packages/ui/src/utils/reproEngine/)

| File | Purpose |
|------|---------|
| `projectUpcomingCycles.ts` | Projects future cycle starts |
| `effectiveCycleLen.ts` | Calculates actual cycle length |
| `normalize.ts` | Date validation and normalization |
| `defaults.ts` | Species-specific biology defaults |
| `types.ts` | TypeScript type definitions |

## Security & Validation

- All API calls require tenant assertion
- Animal ownership verified before returning data
- Date validation via `asISODateOnly()` - must be YYYY-MM-DD format
- Cycle intervals guarded to 0-400 day range
- Override values must be positive numbers
