# CYCLE INFO Tab Enhancement - Specification

**Date:** 2026-01-17
**Purpose:** Transform the CYCLE INFO tab into an intelligent ovulation tracking and pattern analysis system
**Target Species:** Dogs (initial), extensible to all species with ovulation tracking

---

## Current State Analysis

### What Currently Exists

**Database:**
- `ReproductiveCycle` table with fields:
  - `cycleStart` (DateTime)
  - `ovulation` (DateTime?) - Currently unused
  - `status`, `notes`
- `BreedingPlan` table with ovulation anchor fields:
  - `ovulationConfirmed` (DateTime?)
  - `ovulationConfirmedMethod` (OvulationMethod?)
  - `expectedOvulationOffset` (Int?) - Species default
  - `actualOvulationOffset` (Int?) - Calculated from confirmed ovulation
  - `varianceFromExpected` (Int?) - ML-ready pattern data

**UI (apps/animals/src/App-Animals.tsx):**
- **Cycle Summary section** (lines ~1935-2003):
  - Last Heat Start
  - Cycle Length (days) with override
  - Upcoming Projected Cycle Start dates
- **Cycle Start Dates section** (lines ~2005+):
  - List of historical cycle start dates
  - Date picker to add new cycle starts
  - Edit/delete functionality

### What's Missing

1. **No ovulation data display** - `ReproductiveCycle.ovulation` field exists but is never shown
2. **No pattern analysis** - Variance data from breeding plans isn't surfaced to breeders
3. **No personalized predictions** - System uses species defaults instead of individual female's pattern
4. **No educational guidance** - Breeders don't know when to test or what to look for
5. **No link between breeding history and cycle predictions** - Data exists but isn't connected

---

## Enhanced CYCLE INFO Tab - Design Specification

### Section 1: Cycle Summary (Enhanced)

**Current fields remain, with additions:**

```typescript
{
  lastHeatStart: ISODate | null;           // Existing
  cycleLengthDays: number;                 // Existing
  cycleLengthSource: "BIOLOGY" | "HISTORY" | "OVERRIDE"; // Existing
  upcomingProjectedCycleStarts: ISODate[]; // Existing

  // NEW FIELDS:
  ovulationPattern: {
    confidence: "HIGH" | "MEDIUM" | "LOW" | null;
    avgOffsetDays: number | null;          // Average days from heat start to ovulation
    stdDeviation: number | null;           // How consistent is she?
    sampleSize: number;                    // How many breeding cycles with confirmed ovulation
    label: "Early Ovulator" | "Average" | "Late Ovulator" | "Insufficient Data";
  };

  nextCycleGuidance: {
    projectedHeatStart: ISODate | null;
    projectedOvulationWindow: {
      earliest: ISODate;
      latest: ISODate;
      mostLikely: ISODate;
    } | null;
    recommendedTestingStart: ISODate | null;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  };
}
```

**Visual Layout:**

```
┌─ Cycle Summary ────────────────────────────────────────────────────┐
│                                                                    │
│  Last Heat Start          Cycle Length (days)    Ovulation Pattern│
│  12/15/2025               180 (HISTORY)          Day 14 ± 1       │
│                                                   Late Ovulator    │
│                                                   (3 cycles) 🔬    │
│                                                                    │
│  ┌─ Next Projected Cycle ────────────────────────────────────┐   │
│  │                                                            │   │
│  │  Heat Expected:     June 13, 2026                         │   │
│  │  Ovulation Window:  June 25-29, 2026 (most likely: 27th)  │   │
│  │  Start Testing:     June 21, 2026 (Day 8)                 │   │
│  │  Confidence:        HIGH (based on 3 breeding cycles)     │   │
│  │                                                            │   │
│  │  💡 This dog typically ovulates 2 days later than breed   │   │
│  │     average. Plan progesterone testing accordingly.       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ─────────────────────────────────────────────────────────────    │
│                                                                    │
│  Cycle Length Override                                            │
│  [_______] days  [Save] [Clear]                                   │
│  Override the automatic cycle length calculation.                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Section 2: Cycle History (Redesigned)

**Current:** Simple list of cycle start dates
**New:** Rich timeline with ovulation data and pattern indicators

**Data Structure:**

```typescript
type CycleHistoryEntry = {
  cycleStart: ISODate;
  ovulation?: ISODate | null;              // From ReproductiveCycle or back-calculated from breeding
  ovulationMethod?: OvulationMethod | null; // How was ovulation determined?
  offsetDays?: number | null;              // Days from cycle start to ovulation
  variance?: number | null;                // Difference from expected offset
  breedingPlanId?: number | null;          // Link to breeding plan if this cycle resulted in breeding
  birthDate?: ISODate | null;              // If breeding was successful
  notes?: string | null;
  source: "RECORDED" | "CALCULATED" | "ESTIMATED";
  confidence: "HIGH" | "MEDIUM" | "LOW";
};
```

**Visual Layout:**

```
┌─ Cycle History ────────────────────────────────────────────────────┐
│                                                                    │
│  🔬 = Hormone-tested ovulation  📊 = Back-calculated from birth    │
│  📝 = Estimated from breed average                                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ Dec 15, 2025  →  Dec 29, 2025 🔬                         │     │
│  │ Heat Start       Ovulation (Progesterone Test)           │     │
│  │                  Day 14 | +2 days late | HIGH confidence │     │
│  │ [View Breeding Plan] [Edit] [Delete]                     │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ Jun 18, 2025  →  Jul 2, 2025 📊                          │     │
│  │ Heat Start       Ovulation (Calculated from birth)       │     │
│  │                  Day 14 | +2 days late | MEDIUM confidence│    │
│  │ Birth: Sep 3, 2025 (63 days from ovulation)             │     │
│  │ [View Breeding Plan] [Edit]                              │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ Dec 20, 2024  →  Jan 2, 2025 📝                          │     │
│  │ Heat Start       Ovulation (Estimated)                   │     │
│  │                  Day 13 | Breed average | LOW confidence │     │
│  │ No breeding this cycle                                   │     │
│  │ [Edit] [Delete]                                          │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│  [+ Record New Cycle Start]                                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

### Section 3: Ovulation Pattern Insights (New)

**Purpose:** Visualize the female's individual ovulation pattern to help breeders make informed testing decisions

**Data Visualization:**

```
┌─ Ovulation Pattern Analysis ──────────────────────────────────────┐
│                                                                    │
│  Pattern Chart (3 confirmed cycles)                               │
│                                                                    │
│  Cycle Start → Ovulation (Days)                                   │
│  ═══════════════════════════════════════════════                  │
│                                                                    │
│  Dec 2025  ████████████████ 14 days (+2)  🔬 Progesterone        │
│  Jun 2025  ████████████████ 14 days (+2)  📊 Birth calc          │
│  Dec 2024  ███████████████  13 days (+1)  📝 Estimated            │
│                                                                    │
│  Breed Avg ██████████████   12 days                               │
│                                                                    │
│  ├─────────┼─────────┼─────────┼─────────┼─────────┤             │
│  Day 8     Day 10    Day 12    Day 14    Day 16                   │
│                                                                    │
│  ┌─ Pattern Summary ─────────────────────────────────────┐        │
│  │                                                        │        │
│  │  ✓ Consistent Pattern Detected                        │        │
│  │  • This dog ovulates on Day 14 (±1 day)               │        │
│  │  • 2 days later than breed average (Day 12)           │        │
│  │  • Classified as: Late Ovulator                       │        │
│  │                                                        │        │
│  │  💡 Recommendation:                                    │        │
│  │  Start progesterone testing on Day 10-11 to catch     │        │
│  │  the rising levels. Test daily Days 12-15.            │        │
│  │                                                        │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Pattern Classification Logic:**

```typescript
function classifyOvulationPattern(
  avgOffset: number,
  speciesDefault: number,
  stdDev: number,
  sampleSize: number
): {
  label: "Early Ovulator" | "Average" | "Late Ovulator" | "Insufficient Data";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  guidance: string;
} {
  if (sampleSize < 2) {
    return {
      label: "Insufficient Data",
      confidence: "LOW",
      guidance: "Need at least 2 confirmed ovulation cycles to detect pattern"
    };
  }

  const variance = avgOffset - speciesDefault;
  const isConsistent = stdDev <= 1.5;

  let label: "Early Ovulator" | "Average" | "Late Ovulator";
  if (variance <= -2) label = "Early Ovulator";
  else if (variance >= 2) label = "Late Ovulator";
  else label = "Average";

  const confidence =
    sampleSize >= 3 && isConsistent ? "HIGH" :
    sampleSize >= 2 && isConsistent ? "MEDIUM" : "LOW";

  return { label, confidence, guidance: generateGuidance(label, avgOffset, speciesDefault) };
}
```

---

### Section 4: Educational Tooltips & Guidance

**Tooltip on "Ovulation Pattern":**
```
🔬 Ovulation Pattern

Each female has her own timing. Some ovulate early (Day 10-11),
some late (Day 14-16). Knowing YOUR dog's pattern lets you:

• Time progesterone testing precisely
• Reduce testing costs (fewer unnecessary tests)
• Improve breeding success rates
• Predict due dates more accurately (±1 day vs ±3 days)

How to build this data:
1. Record heat start dates on this tab
2. During breeding, confirm ovulation via progesterone testing
3. System learns her pattern after 2-3 confirmed cycles
```

**Tooltip on Confidence Levels:**
```
Confidence Levels

HIGH: 3+ hormone-tested ovulations, consistent pattern (±1 day)
MEDIUM: 2 hormone-tested OR back-calculated from births
LOW: Single data point or breed average estimate

💡 Tip: Even one progesterone-confirmed ovulation is valuable!
The more cycles you test, the more accurate predictions become.
```

---

## Backend Implementation Requirements

### API Endpoints (New)

#### 1. GET `/animals/:id/cycle-analysis`

**Purpose:** Calculate ovulation pattern metrics from breeding history

**Response:**
```typescript
{
  animalId: number;
  species: string;

  cycleHistory: Array<{
    cycleStart: ISODate;
    ovulation?: ISODate;
    ovulationMethod?: OvulationMethod;
    offsetDays?: number;
    variance?: number;
    confidence: "HIGH" | "MEDIUM" | "LOW";
    source: "HORMONE_TEST" | "BIRTH_CALCULATED" | "ESTIMATED";
    breedingPlanId?: number;
    birthDate?: ISODate;
  }>;

  ovulationPattern: {
    sampleSize: number;
    confirmedCycles: number;          // Cycles with HIGH confidence ovulation
    avgOffsetDays: number | null;
    stdDeviation: number | null;
    minOffset: number | null;
    maxOffset: number | null;
    classification: "Early Ovulator" | "Average" | "Late Ovulator" | "Insufficient Data";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    guidance: string;
  };

  nextCycleProjection: {
    projectedHeatStart: ISODate | null;
    projectedOvulationWindow: {
      earliest: ISODate;
      latest: ISODate;
      mostLikely: ISODate;
    } | null;
    recommendedTestingStart: ISODate | null;
    confidence: "HIGH" | "MEDIUM" | "LOW";
  };
}
```

**Calculation Logic:**

```typescript
async function calculateCycleAnalysis(animalId: number) {
  // 1. Get all ReproductiveCycle records for this female
  const cycles = await db.reproductiveCycle.findMany({
    where: { femaleId: animalId },
    orderBy: { cycleStart: 'asc' }
  });

  // 2. Get all BreedingPlans for this female (to extract ovulation data)
  const breedingPlans = await db.breedingPlan.findMany({
    where: { damId: animalId },
    include: { dam: true }
  });

  // 3. Merge data: ReproductiveCycle + BreedingPlan ovulation data
  const enrichedCycles = cycles.map(cycle => {
    // Find breeding plan that matches this cycle start (within ±3 days)
    const matchingPlan = breedingPlans.find(plan => {
      if (!plan.cycleStartObserved) return false;
      const daysDiff = Math.abs(daysBetween(plan.cycleStartObserved, cycle.cycleStart));
      return daysDiff <= 3;
    });

    let ovulation = cycle.ovulation;
    let ovulationMethod = null;
    let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
    let source: "HORMONE_TEST" | "BIRTH_CALCULATED" | "ESTIMATED" = "ESTIMATED";

    if (matchingPlan?.ovulationConfirmed) {
      // High confidence: Hormone-tested ovulation
      ovulation = matchingPlan.ovulationConfirmed;
      ovulationMethod = matchingPlan.ovulationConfirmedMethod;
      confidence = "HIGH";
      source = "HORMONE_TEST";
    } else if (matchingPlan?.birthDateActual && matchingPlan?.cycleStartObserved) {
      // Medium confidence: Back-calculate from birth (birth - 63 days for dogs)
      const gestationDays = getGestationDaysForSpecies(matchingPlan.dam.species);
      ovulation = subtractDays(matchingPlan.birthDateActual, gestationDays);
      confidence = "MEDIUM";
      source = "BIRTH_CALCULATED";
    } else if (cycle.cycleStart) {
      // Low confidence: Estimate based on breed average
      const speciesDefaults = getSpeciesDefaults(species);
      ovulation = addDays(cycle.cycleStart, speciesDefaults.ovulationOffsetDays);
      confidence = "LOW";
      source = "ESTIMATED";
    }

    const offsetDays = ovulation ? daysBetween(cycle.cycleStart, ovulation) : null;
    const variance = offsetDays ? offsetDays - getSpeciesDefaults(species).ovulationOffsetDays : null;

    return {
      cycleStart: cycle.cycleStart,
      ovulation,
      ovulationMethod,
      offsetDays,
      variance,
      confidence,
      source,
      breedingPlanId: matchingPlan?.id,
      birthDate: matchingPlan?.birthDateActual
    };
  });

  // 4. Calculate pattern metrics (use only HIGH/MEDIUM confidence cycles)
  const reliableCycles = enrichedCycles.filter(c =>
    c.confidence === "HIGH" || c.confidence === "MEDIUM"
  );

  if (reliableCycles.length < 2) {
    return {
      ovulationPattern: {
        sampleSize: enrichedCycles.length,
        confirmedCycles: reliableCycles.length,
        avgOffsetDays: null,
        stdDeviation: null,
        classification: "Insufficient Data",
        confidence: "LOW",
        guidance: "Need at least 2 breeding cycles with confirmed or calculated ovulation to detect pattern."
      },
      cycleHistory: enrichedCycles,
      nextCycleProjection: null
    };
  }

  const offsets = reliableCycles.map(c => c.offsetDays!).filter(Boolean);
  const avgOffsetDays = mean(offsets);
  const stdDeviation = standardDeviation(offsets);

  const pattern = classifyOvulationPattern(
    avgOffsetDays,
    getSpeciesDefaults(species).ovulationOffsetDays,
    stdDeviation,
    reliableCycles.length
  );

  // 5. Project next cycle
  const lastCycleStart = cycles[cycles.length - 1]?.cycleStart;
  const cycleLengthDays = getCycleLengthForAnimal(animalId); // From existing logic

  const projection = lastCycleStart ? {
    projectedHeatStart: addDays(lastCycleStart, cycleLengthDays),
    projectedOvulationWindow: {
      earliest: addDays(lastCycleStart, cycleLengthDays + avgOffsetDays - Math.ceil(stdDeviation)),
      latest: addDays(lastCycleStart, cycleLengthDays + avgOffsetDays + Math.ceil(stdDeviation)),
      mostLikely: addDays(lastCycleStart, cycleLengthDays + avgOffsetDays)
    },
    recommendedTestingStart: addDays(lastCycleStart, cycleLengthDays + avgOffsetDays - 4),
    confidence: pattern.confidence
  } : null;

  return {
    animalId,
    species: cycles[0]?.female.species,
    cycleHistory: enrichedCycles,
    ovulationPattern: {
      sampleSize: enrichedCycles.length,
      confirmedCycles: reliableCycles.length,
      avgOffsetDays,
      stdDeviation,
      minOffset: Math.min(...offsets),
      maxOffset: Math.max(...offsets),
      classification: pattern.label,
      confidence: pattern.confidence,
      guidance: pattern.guidance
    },
    nextCycleProjection: projection
  };
}
```

#### 2. POST `/animals/:id/reproductive-cycles/:cycleId/link-breeding-plan`

**Purpose:** Manually link a cycle to a breeding plan (for data cleanup)

**Request:**
```json
{
  "breedingPlanId": 123
}
```

**Response:**
```json
{
  "success": true,
  "cycle": { ... },
  "recalculatedOvulation": "2025-06-29"
}
```

---

## Frontend Implementation Plan

### Phase 1: Enhanced Cycle Summary (4-6 hours)

**Files to modify:**
- `apps/animals/src/App-Animals.tsx` (Cycle Summary section)

**Tasks:**
1. Add API call to fetch cycle analysis: `GET /animals/:id/cycle-analysis`
2. Display ovulation pattern badge in Cycle Summary
3. Add "Next Projected Cycle" card with ovulation window
4. Add educational tooltips

**Component structure:**
```typescript
function EnhancedCycleSummary({ animalId, species }) {
  const { data: analysis, isLoading } = useQuery(
    ['cycle-analysis', animalId],
    () => api.getCycleAnalysis(animalId)
  );

  return (
    <SectionCard title="Cycle Summary">
      {/* Existing fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-secondary">Last Heat Start</div>
          <div>{pretty(analysis?.cycleHistory[0]?.cycleStart)}</div>
        </div>

        {/* NEW: Ovulation Pattern */}
        <div>
          <div className="text-xs text-secondary flex items-center gap-1">
            Ovulation Pattern
            <Tooltip content={OVULATION_PATTERN_TOOLTIP}>
              <InfoIcon className="w-3 h-3" />
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {analysis?.ovulationPattern.avgOffsetDays && (
              <span>Day {analysis.ovulationPattern.avgOffsetDays} ± {Math.round(analysis.ovulationPattern.stdDeviation)}</span>
            )}
            <OvulationPatternBadge
              classification={analysis?.ovulationPattern.classification}
              confidence={analysis?.ovulationPattern.confidence}
              sampleSize={analysis?.ovulationPattern.confirmedCycles}
            />
          </div>
        </div>
      </div>

      {/* NEW: Next Cycle Projection Card */}
      {analysis?.nextCycleProjection && (
        <NextCycleProjectionCard projection={analysis.nextCycleProjection} />
      )}
    </SectionCard>
  );
}
```

---

### Phase 2: Rich Cycle History (6-8 hours)

**Files to modify:**
- `apps/animals/src/App-Animals.tsx` (Cycle Start Dates section)

**Tasks:**
1. Replace simple date list with rich timeline entries
2. Show ovulation data for each cycle
3. Add confidence badges and source indicators
4. Link to breeding plans
5. Visual differentiation (🔬 hormone-tested, 📊 calculated, 📝 estimated)

**Component structure:**
```typescript
function CycleHistoryEntry({ cycle }) {
  const confidenceBadge = {
    HIGH: { icon: "🔬", label: "Hormone-tested", color: "green" },
    MEDIUM: { icon: "📊", label: "Back-calculated", color: "blue" },
    LOW: { icon: "📝", label: "Estimated", color: "gray" }
  }[cycle.confidence];

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Cycle Start */}
          <div>
            <div className="text-xs text-secondary">Heat Start</div>
            <div className="font-medium">{pretty(cycle.cycleStart)}</div>
          </div>

          {/* Arrow */}
          <div className="text-secondary">→</div>

          {/* Ovulation */}
          <div>
            <div className="text-xs text-secondary flex items-center gap-1">
              Ovulation {confidenceBadge.icon}
              <span className={`badge badge-${confidenceBadge.color}`}>
                {confidenceBadge.label}
              </span>
            </div>
            <div className="font-medium">
              {pretty(cycle.ovulation)}
              {cycle.ovulationMethod && (
                <span className="text-xs text-secondary ml-2">
                  ({formatOvulationMethod(cycle.ovulationMethod)})
                </span>
              )}
            </div>
          </div>

          {/* Offset & Variance */}
          {cycle.offsetDays && (
            <div>
              <div className="text-xs text-secondary">Pattern</div>
              <div className="flex items-center gap-2">
                <span>Day {cycle.offsetDays}</span>
                {cycle.variance !== null && (
                  <VarianceBadge variance={cycle.variance} />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {cycle.breedingPlanId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateToPlan(cycle.breedingPlanId)}
            >
              View Breeding Plan
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => editCycle(cycle)}>
            Edit
          </Button>
        </div>
      </div>

      {/* Birth info if available */}
      {cycle.birthDate && (
        <div className="mt-2 pt-2 border-t text-sm text-secondary">
          Birth: {pretty(cycle.birthDate)} ({daysBetween(cycle.ovulation, cycle.birthDate)} days from ovulation)
        </div>
      )}
    </div>
  );
}
```

---

### Phase 3: Ovulation Pattern Insights (8-10 hours)

**Files to create:**
- `apps/animals/src/components/OvulationPatternAnalysis.tsx`

**Tasks:**
1. Build horizontal bar chart showing offset patterns
2. Display pattern classification and guidance
3. Add educational content about testing protocols
4. Show confidence indicators

**Component structure:**
```typescript
function OvulationPatternAnalysis({ analysis }) {
  const { ovulationPattern, cycleHistory } = analysis;

  // Filter to only cycles with ovulation data
  const cyclesWithOvulation = cycleHistory.filter(c => c.offsetDays !== null);

  if (cyclesWithOvulation.length < 2) {
    return (
      <SectionCard title="Ovulation Pattern Analysis">
        <div className="text-center py-8 text-secondary">
          <div className="text-lg mb-2">📊 Building Your Pattern</div>
          <p>
            Record at least 2 breeding cycles with confirmed ovulation
            (via progesterone testing) to unlock pattern insights.
          </p>
          <Button className="mt-4" onClick={() => openEducationDialog()}>
            Learn About Ovulation Tracking
          </Button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Ovulation Pattern Analysis">
      {/* Pattern Chart */}
      <div className="mb-6">
        <div className="text-sm font-medium mb-3">
          Cycle Start → Ovulation (Days)
        </div>
        <OvulationOffsetChart
          cycles={cyclesWithOvulation}
          avgOffset={ovulationPattern.avgOffsetDays}
          speciesDefault={getSpeciesDefaults(analysis.species).ovulationOffsetDays}
        />
      </div>

      {/* Pattern Summary */}
      <div className="border rounded-lg p-4 bg-blue-50">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium">Consistent Pattern Detected</span>
          <ConfidenceBadge confidence={ovulationPattern.confidence} />
        </div>

        <ul className="space-y-2 text-sm">
          <li>• This dog ovulates on Day {ovulationPattern.avgOffsetDays} (±{Math.round(ovulationPattern.stdDeviation)} day)</li>
          <li>
            • {Math.abs(ovulationPattern.avgOffsetDays - getSpeciesDefaults(analysis.species).ovulationOffsetDays)} days
            {ovulationPattern.avgOffsetDays > getSpeciesDefaults(analysis.species).ovulationOffsetDays ? " later" : " earlier"} than breed average
          </li>
          <li>• Classified as: <strong>{ovulationPattern.classification}</strong></li>
        </ul>

        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <div className="text-sm font-medium mb-1">💡 Recommendation:</div>
          <p className="text-sm text-secondary">{ovulationPattern.guidance}</p>
        </div>
      </div>
    </SectionCard>
  );
}
```

---

## Database Schema Changes

### Option 1: Use Existing Fields (Recommended for MVP)

No schema changes needed! We can:
1. Use `ReproductiveCycle.ovulation` to store confirmed ovulation dates
2. Use `ReproductiveCycle.notes` to store ovulation method
3. Calculate pattern metrics on-the-fly from `BreedingPlan` variance data

**Pros:**
- Faster implementation
- No migration needed
- Works with existing data

**Cons:**
- Less structured data
- Ovulation method stored as text in notes

### Option 2: Enhance ReproductiveCycle Model (Future Enhancement)

```prisma
model ReproductiveCycle {
  id       Int    @id @default(autoincrement())
  tenantId Int
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  femaleId Int
  female   Animal @relation(fields: [femaleId], references: [id], onDelete: Cascade)

  cycleStart DateTime

  // ENHANCED FIELDS:
  ovulation                DateTime?       // When ovulation occurred
  ovulationMethod          OvulationMethod? // How was it determined
  ovulationConfidence      ConfidenceLevel? // Data quality
  ovulationSource          DataSource?      // OBSERVED, DERIVED, ESTIMATED

  linkedBreedingPlanId     Int?            // Link to breeding plan
  linkedBreedingPlan       BreedingPlan?   @relation(fields: [linkedBreedingPlanId], references: [id], onDelete: SetNull)

  offsetDays               Int?            // Calculated: days from cycleStart to ovulation
  varianceFromExpected     Int?            // Difference from species default

  dueDate            DateTime?
  placementStartDate DateTime?

  status String?
  notes  String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([femaleId])
  @@index([cycleStart])
  @@index([ovulation])              // NEW
  @@index([linkedBreedingPlanId])   // NEW
  @@schema("public")
}
```

**Migration to populate existing cycles:**

```sql
-- Back-calculate ovulation from breeding plans
UPDATE "ReproductiveCycle" rc
SET
  ovulation = bp."ovulationConfirmed",
  ovulationMethod = bp."ovulationConfirmedMethod",
  ovulationConfidence = 'HIGH',
  ovulationSource = 'OBSERVED',
  linkedBreedingPlanId = bp.id,
  offsetDays = EXTRACT(DAY FROM (bp."ovulationConfirmed" - rc."cycleStart")),
  varianceFromExpected = bp."varianceFromExpected"
FROM "BreedingPlan" bp
WHERE bp."damId" = rc."femaleId"
  AND bp."ovulationConfirmed" IS NOT NULL
  AND ABS(EXTRACT(DAY FROM (bp."cycleStartObserved" - rc."cycleStart"))) <= 3;

-- Back-calculate ovulation from births (where no hormone test exists)
UPDATE "ReproductiveCycle" rc
SET
  ovulation = bp."birthDateActual" - INTERVAL '63 days',  -- Dogs: 63 days gestation
  ovulationMethod = 'CALCULATED',
  ovulationConfidence = 'MEDIUM',
  ovulationSource = 'DERIVED',
  linkedBreedingPlanId = bp.id,
  offsetDays = EXTRACT(DAY FROM ((bp."birthDateActual" - INTERVAL '63 days') - rc."cycleStart"))
FROM "BreedingPlan" bp
WHERE bp."damId" = rc."femaleId"
  AND bp."birthDateActual" IS NOT NULL
  AND bp."ovulationConfirmed" IS NULL
  AND rc.ovulation IS NULL
  AND ABS(EXTRACT(DAY FROM (bp."cycleStartObserved" - rc."cycleStart"))) <= 3;
```

---

## Testing Strategy

### Unit Tests

**Backend (`breederhq-api/src/services/cycle-analysis.test.ts`):**

```typescript
describe('calculateCycleAnalysis', () => {
  it('should classify as "Insufficient Data" with 0 cycles', async () => {
    const result = await calculateCycleAnalysis(femaleWithNoCycles.id);
    expect(result.ovulationPattern.classification).toBe('Insufficient Data');
  });

  it('should calculate pattern from 3 hormone-tested cycles', async () => {
    // Female with Day 14, Day 14, Day 15 ovulations
    const result = await calculateCycleAnalysis(femaleWithConsistentPattern.id);
    expect(result.ovulationPattern.avgOffsetDays).toBe(14.33);
    expect(result.ovulationPattern.classification).toBe('Late Ovulator');
    expect(result.ovulationPattern.confidence).toBe('HIGH');
  });

  it('should use HIGH confidence for hormone tests, MEDIUM for birth calcs', async () => {
    const result = await calculateCycleAnalysis(femaleWithMixedData.id);
    const highConfCycles = result.cycleHistory.filter(c => c.confidence === 'HIGH');
    const medConfCycles = result.cycleHistory.filter(c => c.confidence === 'MEDIUM');
    expect(highConfCycles.length).toBe(1); // 1 progesterone test
    expect(medConfCycles.length).toBe(2); // 2 back-calculated
  });

  it('should project next cycle ovulation window', async () => {
    const result = await calculateCycleAnalysis(femaleWithPattern.id);
    expect(result.nextCycleProjection.projectedOvulationWindow).toMatchObject({
      earliest: expect.any(String),
      latest: expect.any(String),
      mostLikely: expect.any(String)
    });
  });
});
```

### E2E Tests (Playwright)

**File:** `tests/e2e/animals/cycle-info-ovulation-tracking.spec.ts`

```typescript
test.describe('CYCLE INFO - Ovulation Tracking', () => {
  test('should display ovulation pattern for female with 3+ confirmed cycles', async ({ page }) => {
    // Navigate to female with known pattern
    await page.goto('/animals/456'); // Concord Dawn Dam
    await page.click('text=CYCLE INFO');

    // Verify pattern badge shows
    await expect(page.locator('text=Late Ovulator')).toBeVisible();
    await expect(page.locator('text=Day 14 ± 1')).toBeVisible();
    await expect(page.locator('text=(3 cycles)')).toBeVisible();

    // Verify next cycle projection
    await expect(page.locator('text=Ovulation Window:')).toBeVisible();
    await expect(page.locator('text=Start Testing:')).toBeVisible();
  });

  test('should show cycle history with ovulation data', async ({ page }) => {
    await page.goto('/animals/456');
    await page.click('text=CYCLE INFO');

    // First cycle (hormone-tested)
    const firstCycle = page.locator('[data-test-id="cycle-0"]');
    await expect(firstCycle.locator('text=🔬')).toBeVisible();
    await expect(firstCycle.locator('text=Progesterone Test')).toBeVisible();
    await expect(firstCycle.locator('text=+2 days late')).toBeVisible();

    // Second cycle (back-calculated)
    const secondCycle = page.locator('[data-test-id="cycle-1"]');
    await expect(secondCycle.locator('text=📊')).toBeVisible();
    await expect(secondCycle.locator('text=Calculated from birth')).toBeVisible();
  });

  test('should show "Insufficient Data" message when < 2 cycles', async ({ page }) => {
    await page.goto('/animals/789'); // Young female with 0 cycles
    await page.click('text=CYCLE INFO');

    await expect(page.locator('text=Building Your Pattern')).toBeVisible();
    await expect(page.locator('text=Record at least 2 breeding cycles')).toBeVisible();
  });
});
```

---

## Implementation Checklist

### Backend Tasks

- [ ] Create `GET /animals/:id/cycle-analysis` endpoint
- [ ] Implement `calculateCycleAnalysis()` service function
- [ ] Add ovulation back-calculation logic (birth - gestation days)
- [ ] Implement pattern classification algorithm
- [ ] Write unit tests for cycle analysis service
- [ ] Add API integration tests

### Frontend Tasks

#### Phase 1: Enhanced Cycle Summary
- [ ] Fetch cycle analysis data from API
- [ ] Add ovulation pattern badge to Cycle Summary
- [ ] Create "Next Projected Cycle" card component
- [ ] Add educational tooltips
- [ ] Handle loading/error states

#### Phase 2: Rich Cycle History
- [ ] Replace simple date list with timeline entries
- [ ] Add confidence badges (🔬📊📝)
- [ ] Show ovulation method and variance
- [ ] Link to breeding plans
- [ ] Add edit/delete functionality for cycles

#### Phase 3: Pattern Insights
- [ ] Create `OvulationPatternAnalysis` component
- [ ] Build horizontal bar chart for offset visualization
- [ ] Display pattern classification and guidance
- [ ] Add "Insufficient Data" empty state
- [ ] Create educational dialog

### Testing Tasks

- [ ] Write backend unit tests (cycle analysis service)
- [ ] Write E2E tests for pattern display
- [ ] Test with various data states (0 cycles, 1 cycle, 3+ cycles)
- [ ] Test with mixed confidence levels
- [ ] Verify educational content displays correctly

### Documentation Tasks

- [ ] Update user guide with ovulation tracking workflow
- [ ] Create breeder education content (why track ovulation?)
- [ ] Document testing protocols by species
- [ ] Add troubleshooting guide (pattern not showing, etc.)

---

## Species-Specific Considerations

### Dogs (Initial Implementation)
- **Default ovulation offset:** Day 12 from heat start
- **Gestation:** 63 days from ovulation
- **Testing method:** Progesterone, LH
- **Pattern variance:** Typically ±2-3 days

### Horses (Phase 2)
- **Default ovulation offset:** Day 5-6 from heat start
- **Gestation:** 340 days from ovulation
- **Testing method:** Ultrasound, palpation
- **Pattern variance:** Typically ±1-2 days (more predictable than dogs)

### Cats/Rabbits (Induced Ovulators)
- **No cycle start tracking** - ovulation = breeding date
- **Pattern analysis:** N/A (they don't have patterns)
- **UI behavior:** Hide ovulation pattern section entirely

---

## Educational Content Strategy

### In-App Tooltips

**"Why Track Ovulation?"**
```
🎯 Benefits of Ovulation Tracking

1. Accuracy: Predict due dates within ±1 day (vs ±3-5 days)
2. Cost Savings: Fewer progesterone tests once pattern is known
3. Breeding Success: Time matings precisely when fertile
4. Pattern Learning: System gets smarter with each cycle

Your dog's pattern is unique. Some ovulate early (Day 10),
some late (Day 16). Knowing HER pattern = better outcomes.
```

**"How to Build Pattern Data"**
```
📊 Building Your Pattern

Step 1: Record heat start on CYCLE INFO tab
Step 2: During breeding, confirm ovulation via progesterone test
Step 3: System learns after 2-3 confirmed cycles

Even ONE confirmed ovulation is valuable! The system will
use it to improve predictions immediately.

💡 Pro Tip: Test at least one cycle per female to unlock
personalized predictions.
```

### Educational Dialog (Modal)

Triggered by "Learn About Ovulation Tracking" button when insufficient data:

```
┌─ Understanding Ovulation Tracking ──────────────────────────────┐
│                                                                  │
│  Why This Matters                                                │
│  ───────────────                                                 │
│  Traditional breeding relies on "heat start + 12 days" but      │
│  every dog is different. Some ovulate Day 10, others Day 16.    │
│                                                                  │
│  By confirming ovulation via progesterone testing, you:          │
│  • Know YOUR dog's unique pattern                               │
│  • Predict due dates within ±1 day                              │
│  • Reduce testing costs over time                               │
│  • Improve breeding success rates                               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  How It Works                                                    │
│  ────────────                                                    │
│                                                                  │
│  1. Record Heat Start                                            │
│     When you see swelling, bleeding, behavior changes           │
│                                                                  │
│  2. Start Testing (Days 8-12 recommended)                        │
│     Progesterone rises 24-48 hours before ovulation             │
│                                                                  │
│  3. Confirm Ovulation                                            │
│     When progesterone reaches 5-10 ng/mL                        │
│                                                                  │
│  4. System Learns                                                │
│     After 2-3 cycles, personalized predictions unlock           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Getting Started                                                 │
│  ───────────────                                                 │
│  Start with just ONE cycle:                                      │
│  • Record heat start on CYCLE INFO tab                          │
│  • During breeding, have vet confirm ovulation                  │
│  • Enter ovulation date in breeding plan                        │
│                                                                  │
│  That's it! Even one data point improves predictions.           │
│                                                                  │
│  [Close] [View Testing Guide]                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### User Engagement
- % of breeders using ovulation tracking (target: 30% within 6 months)
- Avg cycles recorded per active breeder (target: 3+)
- % of breeding plans with confirmed ovulation (target: 20%)

### Data Quality
- % of females with HIGH confidence ovulation pattern (target: 15%)
- Avg pattern sample size for tracked females (target: 2.5 cycles)

### Accuracy Improvements
- Due date prediction accuracy (±1 day vs ±3 days)
- Reduction in "unexpected early/late births" reports

---

## Future Enhancements (Post-MVP)

### Phase 4: Testing Reminders
- Email/SMS reminders: "Concord Dawn Dam: Start progesterone testing in 2 days"
- Calendar integration
- Testing protocol checklist

### Phase 5: Progesterone Chart Integration
- Upload progesterone test results
- Visual chart showing rise to ovulation
- Link test results to ovulation confirmation

### Phase 6: Multi-Female Pattern Comparison
- Breeder-level dashboard: "Your females ovulate Day 11-15"
- Identify outliers
- Breeding program insights

### Phase 7: AI Pattern Detection
- Detect "late ovulator" trend automatically
- Alert: "Consider earlier testing for this female"
- Suggest optimal testing schedule

---

## Technical Debt & Considerations

### Performance
- Cycle analysis calculations on-demand may be slow for females with 20+ cycles
- Consider caching pattern metrics in database (refresh on breeding plan changes)
- Add pagination to cycle history if > 10 cycles

### Data Migration
- Existing systems may have cycles in notes/comments
- Provide import tool for historical ovulation data
- Allow manual ovulation date entry for old cycles

### Mobile Responsiveness
- Pattern chart needs mobile-friendly design
- Consider vertical bar chart on small screens
- Collapsible sections for small viewports

---

## Appendix: Helper Functions

### Species Defaults

```typescript
const SPECIES_OVULATION_DEFAULTS = {
  DOG: {
    ovulationOffsetDays: 12,
    gestationDaysFromOvulation: 63,
    cycleWindow: { min: 8, max: 16 }
  },
  HORSE: {
    ovulationOffsetDays: 5,
    gestationDaysFromOvulation: 340,
    cycleWindow: { min: 3, max: 7 }
  },
  CAT: {
    ovulationOffsetDays: 0, // Induced ovulator
    gestationDaysFromOvulation: 65,
    cycleWindow: null
  },
  // ... other species
};

function getSpeciesDefaults(species: string) {
  return SPECIES_OVULATION_DEFAULTS[species] || SPECIES_OVULATION_DEFAULTS.DOG;
}
```

### Pattern Guidance Generator

```typescript
function generateGuidance(
  classification: string,
  avgOffset: number,
  speciesDefault: number
): string {
  const variance = avgOffset - speciesDefault;

  if (classification === "Early Ovulator") {
    return `Start progesterone testing on Day ${avgOffset - 4} to catch the rising levels. This dog ovulates ${Math.abs(variance)} days earlier than breed average, so early testing is critical.`;
  }

  if (classification === "Late Ovulator") {
    return `Start progesterone testing on Day ${avgOffset - 4} to catch the rising levels. This dog ovulates ${variance} days later than breed average, so don't rush into breeding too early.`;
  }

  return `This dog follows the breed average ovulation pattern. Start testing on Day ${speciesDefault - 2} and continue daily until confirmed.`;
}
```

---

**End of Specification**

**Estimated Total Implementation Time:** 18-24 hours
**Priority:** HIGH (Core feature for accuracy improvements)
**Dependencies:** Ovulation Anchor System (Phases 0-5) already complete
**Risk Level:** LOW (builds on existing infrastructure)
