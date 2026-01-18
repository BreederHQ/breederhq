# Cycle Info Tab - Frontend Components

## Component Location

All cycle analysis components are located in:
`apps/animals/src/components/CycleAnalysis/`

## Component Index

| Component | Purpose |
|-----------|---------|
| CycleTab | Main tab coordinator (in App-Animals.tsx) |
| NextCycleHero | Large countdown to next heat |
| OvulationDotPlot | Scatter plot of ovulation timing |
| OvulationPatternAnalysis | Pattern visualization with bar chart |
| OvulationSummary | Comprehensive summary with spectrum |
| CycleHistoryEntry | Individual cycle card |
| CollapsibleCycleHistory | Expandable cycle list |
| CollapsibleOverride | Cycle length override controls |
| CycleLengthInsight | Short/long cycler indicator |
| CycleAlerts | Context-aware notifications |
| NextCycleProjectionCard | Prediction display |
| OvulationPatternBadge | Classification badge |
| ConfidenceBadge | Data quality indicator |
| VarianceBadge | Days from average badge |
| CycleAlertBadge | Heat approaching indicator |

---

## CycleTab (Main Component)

**Location:** `apps/animals/src/App-Animals.tsx` (lines ~1757-2100)

**Props:**
```typescript
{
  animal: AnimalRow;
  api: any;
  onSaved: (dates: string[]) => void;
  onOverrideSaved?: (overrideValue: number | null) => void;
}
```

**Responsibilities:**
- Coordinates all cycle-related functionality
- Manages state for dates, analysis, editing
- Handles API calls for saving/loading
- Renders child components based on data availability

---

## NextCycleHero

**Purpose:** Large visual dashboard showing countdown to next heat and testing window

**Props:**
```typescript
{
  projection: NextCycleProjection;
  ovulationPattern?: OvulationPattern;
  species?: string;
}
```

**Urgency Levels:**
| Condition | Styling |
|-----------|---------|
| Within 7 days | Amber/yellow border (imminent) |
| 7-30 days | Softer warning color (soon) |
| 30+ days | Standard styling (normal) |

**Countdown Display:**
- "Today" / "Tomorrow" / "N days" / "N days ago" (if overdue)

---

## OvulationDotPlot

**Purpose:** Interactive scatter plot showing individual ovulation days with reference lines

**Props:**
```typescript
{
  cycles: CycleHistoryEntry[];
  avgOffset: number | null;
  speciesDefault: number;
  species: string;
  showAllOption?: boolean; // default: shows 6 most recent
}
```

**Visual Elements:**
- **Y-axis:** Individual cycle months (date labels)
- **X-axis:** Days from heat start (0 = first day)
- **Dots:** Individual ovulations with confidence opacity
- **Vertical lines:**
  - Gray dashed: Breed/species average
  - Green solid: Individual average (if 2+ confirmed)

**Dot Styling:**
| Confidence | Fill Opacity |
|------------|--------------|
| HIGH | 100% |
| MEDIUM | 70% |
| LOW | 40% |

| Data Source | Ring Color |
|-------------|------------|
| Hormone-tested | Green |
| From birth | Blue |
| Estimated | Gray |

---

## OvulationPatternAnalysis

**Purpose:** Visualizes historical ovulation data with pattern detection

**Props:**
```typescript
{
  analysis: CycleAnalysisResult;
  onLearnMore?: () => void;
}
```

**Features:**
- OvulationBarChart showing 5 most recent cycles
- Classification display (Early/Average/Late Ovulator)
- Confidence indicators
- Species comparison to average

**Hardcoded Species Defaults:**
```typescript
{ DOG: 12, HORSE: 5, CAT: 0, GOAT: 2, SHEEP: 2, RABBIT: 0, PIG: 2, CATTLE: 1 }
```

---

## OvulationSummary

**Purpose:** Comprehensive summary with spectrum indicator and breeding tips

**Props:**
```typescript
{
  ovulationPattern: OvulationPattern;
  cycleHistory: CycleHistoryEntry[];
  speciesDefault: number;
  species: string;
}
```

**Calculations:**
- **Classification threshold:** +/-1 day from species default
- **Consistency assessment:**
  - Very consistent: stdev <= 1
  - Fairly consistent: stdev 1-2
  - Variable: stdev > 2
- **Spectrum positioning:** Maps avg offset to 0-100 scale

**Collapsible Sections:**
1. Ovulation history (filtered to non-estimated)
2. "How this works" educational content

---

## CycleHistoryEntry

**Purpose:** Individual cycle card with details and actions

**Props:**
```typescript
{
  cycle: CycleHistoryEntry;
  onViewBreedingPlan?: (planId: number) => void;
  onEdit?: (cycle) => void;
  onDelete?: (cycleId) => void;
  showActions?: boolean; // default: true
}
```

**Displays:**
- Heat start date with calendar icon
- Ovulation date (if available) with confidence badge
- Ovulation method (e.g., "Progesterone Test")
- Pattern offset (Day N) with variance badge
- Birth date info if applicable

---

## CollapsibleCycleHistory

**Purpose:** Expandable list of recorded heat cycles

**Props:**
```typescript
{
  cycles: CycleHistoryEntry[];
  editingCycleId?: number | null;
  onEditCycle?: (cycleId: number) => void;
  onEditComplete?: (cycleId, newDateIso) => void;
  onEditCancel?: () => void;
  onDeleteCycle?: (cycleId) => void;
  centered?: boolean;
}
```

**Features:**
- Most recent cycle with accent styling
- Inline date editing with DayPicker popover
- Keyboard shortcut: ESC cancels edit

---

## CollapsibleOverride

**Purpose:** Controls for manual cycle length override

**Props:**
```typescript
{
  currentDays: number;
  overrideInput: string;
  onOverrideInputChange: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
  saving: boolean;
  hasOverride: boolean;
  warningConflict?: boolean;
}
```

**Validation:**
- Must be positive number
- Empty input clears override
- Warning shown if override differs >20% from history

---

## CycleLengthInsight

**Purpose:** Highlights unusual cycle lengths

**Props:**
```typescript
{
  cycleLengthDays: number;
  cycleLengthSource: "OVERRIDE" | "HISTORY" | "BIOLOGY";
  species: string;
}
```

**Thresholds:**
| Species Type | Notable Variance |
|--------------|------------------|
| Long cycle (DOG, CAT) | +/-14 days |
| Short cycle (others) | +/-3 days |

**Display:**
- Short cycler: Purple badge
- Long cycler: Amber badge
- Average: No display

---

## CycleAlerts

**Purpose:** Context-aware alerts for breeders

**Props:**
```typescript
{
  projection: NextCycleProjection;
  ovulationPattern: OvulationPattern;
  hasActiveBreedingPlan?: boolean;
  onStartBreedingPlan?: () => void;
  onDismissAlert?: (alertId: string) => void;
}
```

**Alert Types:**
| ID | Type | Condition |
|----|------|-----------|
| `testing-soon` | WARNING | 0-7 days until testing |
| `heat-soon` | INFO | 0-14 days until heat |
| `no-breeding-plan` | ACTION | Heat within 30 days, no active plan |
| `need-more-data` | INFO | <2 confirmed cycles |

---

## Badge Components

### OvulationPatternBadge

**Props:** `{ classification, confidence, sampleSize }`

| Classification | Color |
|----------------|-------|
| Early Ovulator | Green |
| Average | Blue |
| Late Ovulator | Amber |
| Insufficient Data | Neutral |

### ConfidenceBadge

**Props:** `{ confidence, source?, showIcon? }`

| Confidence | Icon | Color | Meaning |
|------------|------|-------|---------|
| HIGH | H | Green | Hormone-tested |
| MEDIUM | C | Blue | Calculated from birth |
| LOW | E | Neutral | Estimated |

### VarianceBadge

**Props:** `{ variance }`

| Variance | Display |
|----------|---------|
| 0 days | "on avg" (blue) |
| +/-1-2 days | Neutral |
| +/-3+ days | Amber |

### CycleAlertBadge

**Props:** `{ daysUntilExpected, size?, dotOnly? }`

| Condition | Color |
|-----------|-------|
| Overdue (<0) | Amber pulsing |
| Within 14 days | Yellow pulsing |
| Beyond 14 days | Hidden |

---

## Helper Function: calculateDaysUntilCycle

```typescript
function calculateDaysUntilCycle(
  cycleStartDates: string[] | null | undefined,
  cycleLengthOverride: number | null | undefined,
  species: string
): number | null
```

**Logic:**
1. Uses override if available, else species default
2. Gets most recent cycle start
3. Calculates next expected date
4. Returns days until (negative if overdue)
