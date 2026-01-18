# Cycle Info Tab - Multi-Species Support Plan

## Goal

Enable breeders of each species to confidently open the Cycle Info tab and see exactly what they need for their species—and nothing irrelevant.

---

## Species Categories

### Category A: Spontaneous Ovulators, Long Cycle (DOG)

**Characteristics:**
- Ovulation occurs naturally ~12 days after heat start
- Long cycle length (~180 days / 6 months)
- Predictable ovulation timing
- Progesterone testing standard practice

**Current Support:** ✅ Full support (primary design target)

**No Changes Needed**

---

### Category B: Spontaneous Ovulators, Short Cycle (HORSE, GOAT, SHEEP, PIG, CATTLE)

**Characteristics:**
- Ovulation occurs naturally, 1-5 days after heat start
- Short cycle length (17-21 days)
- Predictable ovulation timing
- Some are seasonal breeders

**Current Support:** ⚠️ Partial - logic works but UI not optimized

**Changes Needed:**

| Item | Priority | Description |
|------|----------|-------------|
| Seasonality awareness | HIGH | Add seasonal breeding indicators for HORSE, GOAT, SHEEP |
| Cycle frequency display | MEDIUM | Adjust UI language from "every ~6 months" to "every ~21 days" |
| Ovulation day labels | LOW | Adjust default day labels (Day 1-5 vs Day 10-14) |

---

### Category C: Induced Ovulators (CAT, RABBIT, ALPACA, LLAMA, FERRET, CAMEL)

**Characteristics:**
- Ovulation triggered by mating, not natural cycle
- Short cycle length (14-21 days)
- No predictable ovulation day
- Focus on heat tracking, not ovulation prediction

**Current Support:** ✅ Fully handled - entire Cycle Info tab is hidden

**Implementation:**
The tab visibility logic in `App-Animals.tsx` (lines 9059-9078) already excludes induced ovulators:

```typescript
const INDUCED_OVULATORS = ["CAT", "RABBIT", "FERRET", "CAMEL", "LLAMA", "ALPACA"];
const species = (String(r.species || "DOG").toUpperCase());
const isSpontaneousOvulator = !INDUCED_OVULATORS.includes(species);
if ((r.sex || "").toLowerCase().startsWith("f") && isSpontaneousOvulator) {
  tabs.push({ key: "cycle", label: "Cycle Info", ... });
}
```

**No Changes Needed** - The entire Cycle Info tab is hidden for induced ovulators.

---

## Implementation Plan

### ~~Phase 1: Species Detection & Conditional Rendering~~ ✅ COMPLETE

Already implemented - induced ovulators have the entire Cycle Info tab hidden.

---

### ~~Phase 2: Induced Ovulator Components~~ ✅ NOT NEEDED

Since the entire tab is hidden for induced ovulators, no special guidance component is needed.

---

### Phase 1: Seasonality Awareness

**Files to Modify:**
- `apps/animals/src/App-Animals.tsx` (CycleTab)
- `packages/ui/src/utils/reproEngine/defaults.ts`

**New Component:**
- `SeasonalityIndicator.tsx`

**Tasks:**

1. **Add seasonality configuration**
   ```typescript
   const SEASONAL_CONFIG = {
     HORSE: {
       breedingSeason: { start: 3, end: 9 }, // March-September (N. Hemisphere)
       label: "Spring/Summer Breeder",
       outOfSeasonNote: "Mares typically don't cycle in winter months"
     },
     GOAT: {
       breedingSeason: { start: 8, end: 1 }, // August-January
       label: "Fall Breeder (Short-Day)",
       outOfSeasonNote: "Does cycle when daylight hours decrease"
     },
     SHEEP: {
       breedingSeason: { start: 8, end: 12 }, // August-December
       label: "Fall Breeder (Short-Day)",
       outOfSeasonNote: "Ewes cycle in fall/early winter"
     }
   };
   ```

2. **Add SeasonalityIndicator component**
   ```typescript
   function SeasonalityIndicator({ species, currentDate }: Props) {
     const config = SEASONAL_CONFIG[species];
     if (!config) return null;

     const isInSeason = checkIfInSeason(currentDate, config.breedingSeason);

     return (
       <div className={cn(
         "rounded-lg p-3",
         isInSeason ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
       )}>
         <div className="font-medium">{config.label}</div>
         {!isInSeason && <div className="text-sm">{config.outOfSeasonNote}</div>}
       </div>
     );
   }
   ```

3. **Integrate into CycleTab**
   ```typescript
   {isSeasonalBreeder(animal.species) && (
     <SeasonalityIndicator
       species={animal.species}
       currentDate={new Date()}
     />
   )}
   ```

**Future Enhancement:** Hemisphere detection based on breeder location

**Estimated Effort:** 3-4 hours

---

### Phase 2: Species-Specific Language

**Files to Modify:**
- `OvulationSummary.tsx`
- `NextCycleHero.tsx`
- `CycleAlerts.tsx`
- Backend `cycle-analysis-service.ts`

**Tasks:**

1. **Update guidance text generation**
   ```typescript
   function generateGuidance(
     classification: OvulationClassification,
     avgOffset: number,
     speciesDefault: number,
     species: SpeciesCode
   ): string {
     if (isInducedOvulator(species)) {
       return "This species ovulates in response to mating. Focus on tracking heat cycles to know when she's receptive.";
     }

     // Existing spontaneous ovulator logic...
   }
   ```

2. **Adjust cycle length descriptions**
   ```typescript
   const getCycleLengthDescription = (species: string, days: number) => {
     if (isLongCycler(species)) {
       const months = Math.round(days / 30);
       return `every ~${months} months`;
     }
     return `every ~${days} days`;
   };
   ```

**Estimated Effort:** 2-3 hours

---

### Phase 3: Backend Enhancements

**Files to Modify:**
- `breederhq-api/src/services/cycle-analysis-service.ts`

**Tasks:**

1. **Skip ovulation pattern for induced ovulators**
   ```typescript
   if (SPECIES_DEFAULTS[species].isInducedOvulator) {
     return {
       ...result,
       ovulationPattern: {
         classification: "Not Applicable",
         avgOffsetDays: null,
         guidanceText: "This species is an induced ovulator..."
       }
     };
   }
   ```

2. **Add seasonality to response**
   ```typescript
   interface CycleAnalysisResult {
     // existing fields...
     seasonality?: {
       isSeasonalBreeder: boolean;
       currentlyInSeason: boolean;
       seasonLabel: string;
       nextSeasonStart?: string;
     };
   }
   ```

**Estimated Effort:** 2-3 hours

---

## Rollout Strategy

### Stage 1: Non-Breaking Changes
- Add species detection helpers
- Add conditional rendering for induced ovulators
- Hide irrelevant sections

### Stage 2: New Components
- InducedOvulatorGuidance component
- SeasonalityIndicator component
- Species-specific language updates

### Stage 3: Backend Alignment
- Update cycle-analysis-service
- Add seasonality data to API response
- Consolidate species configuration

---

## Testing Matrix

| Species | Tab Visible | Seasonality | Cycle Length | Testing Window |
|---------|-------------|-------------|--------------|----------------|
| DOG | ✅ Yes | ❌ N/A | "~6 months" | ✅ Show |
| CAT | ❌ **Tab Hidden** | - | - | - |
| HORSE | ✅ Yes | ✅ Needed | "~21 days" | ✅ Show |
| GOAT | ✅ Yes | ✅ Needed | "~21 days" | ✅ Show |
| SHEEP | ✅ Yes | ✅ Needed | "~17 days" | ✅ Show |
| RABBIT | ❌ **Tab Hidden** | - | - | - |
| FERRET | ❌ **Tab Hidden** | - | - | - |
| CAMEL | ❌ **Tab Hidden** | - | - | - |
| ALPACA | ❌ **Tab Hidden** | - | - | - |
| LLAMA | ❌ **Tab Hidden** | - | - | - |
| PIG | ✅ Yes | ❌ N/A | "~21 days" | ✅ Show |
| CATTLE | ✅ Yes | ❌ N/A | "~21 days" | ✅ Show |

---

## Success Criteria

1. **Induced ovulators:** ✅ DONE - Entire Cycle Info tab is hidden
2. **Seasonal breeders:** Clear indication of breeding season status (TODO)
3. **All species:** Accurate cycle length display with appropriate units (TODO)
4. **All species:** Species-appropriate guidance text (TODO)
5. **No species:** Shows irrelevant or confusing information

---

## Files Summary

### To Create
- `apps/animals/src/components/CycleAnalysis/SeasonalityIndicator.tsx`

### To Modify
- `apps/animals/src/App-Animals.tsx` (CycleTab - add seasonality)
- `apps/animals/src/components/CycleAnalysis/OvulationSummary.tsx`
- `apps/animals/src/components/CycleAnalysis/NextCycleHero.tsx`
- `breederhq-api/src/services/cycle-analysis-service.ts`
- `packages/ui/src/utils/reproEngine/defaults.ts`

### Already Implemented
- Induced ovulator tab hiding (`App-Animals.tsx` lines 9059-9078)

### Optional Consolidation
- Create `packages/shared/src/species-config.ts` as single source of truth
