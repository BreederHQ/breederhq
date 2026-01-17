# UI/UX Specification: Species-Aware Breeding Plan Drawer

## Document Purpose

This document provides **concrete visual and behavioral specifications** for how the breeding plan drawer will look and function across all 6 species, ensuring that every breeder feels "they built this for ME!"

**Critical Requirements:**
- ✅ ONE drawer component for ALL species (not separate UIs)
- ✅ Same structure, species-specific labels and features
- ✅ NO species ostracized or forced into wrong paradigm
- ✅ Strategic architecture that scales beautifully
- ✅ Clear user experience across all species and anchor modes

---

## Table of Contents

1. [Species-Aware Architecture Overview](#species-aware-architecture-overview)
2. [Visual Mockups by Species](#visual-mockups-by-species)
3. [Phase Chart Variations](#phase-chart-variations)
4. [Date Tab Layouts](#date-tab-layouts)
5. [Anchor Mode Selector UI](#anchor-mode-selector-ui)
6. [User Flows by Species](#user-flows-by-species)
7. [Implementation Architecture](#implementation-architecture)

---

## Species-Aware Architecture Overview

### The Core Pattern: Same Structure, Different Presentation

```
┌─────────────────────────────────────────────────────────────┐
│              BREEDING PLAN DRAWER (ONE COMPONENT)           │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │   Species Terminology Layer                        │    │
│  │   - Fetches species-specific labels                │    │
│  │   - Determines available features                  │    │
│  │   - Sets validation rules                          │    │
│  └───────────────────────────────────────────────────┘    │
│                          ↓                                  │
│  ┌───────────────────────────────────────────────────┐    │
│  │   Conditional Rendering Logic                      │    │
│  │   - Show/hide anchor mode options                  │    │
│  │   - Show/hide testing fields                       │    │
│  │   - Show/hide species-specific tabs                │    │
│  └───────────────────────────────────────────────────┘    │
│                          ↓                                  │
│  ┌───────────────────────────────────────────────────┐    │
│  │   Universal Tab Structure                          │    │
│  │   - Overview (all species, different fields)       │    │
│  │   - Dates (all species, different anchors)         │    │
│  │   - Offspring (all species, different terms)       │    │
│  │   - Deposits, Finances, Audit (universal)          │    │
│  │   + Species-specific tabs (conditional)            │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Species Classification by Reproductive Pattern

| Species | Pattern | Cycle Observable? | Testing Available? | Recommended Anchor |
|---------|---------|-------------------|--------------------|--------------------|
| **DOG** | Spontaneous ovulator | ✅ Yes (heat signs) | ✅ Yes (progesterone) | Cycle Start → Upgrade to Ovulation |
| **HORSE** | Spontaneous ovulator | ✅ Yes (heat signs) | ✅ Yes (ultrasound) | Cycle Start → Upgrade to Ovulation |
| **CAT** | **Induced ovulator** | ❌ No distinct cycle | ❌ No standard test | **BREEDING DATE** (not cycle start) |
| **RABBIT** | **Induced ovulator** | ❌ No distinct cycle | ❌ No standard test | **BREEDING DATE** (not cycle start) |
| **GOAT** | Spontaneous ovulator | ✅ Yes (heat signs) | ⚠️ Not practical | Cycle Start ONLY |
| **SHEEP** | Spontaneous ovulator | ✅ Yes (heat signs) | ⚠️ Not practical | Cycle Start ONLY |

**Key Insight:** There are actually **THREE user experiences**, not six separate UIs:

1. **"Testable" Species (DOG, HORSE)**: Cycle start with ovulation upgrade option
2. **"Breeding-First" Species (CAT, RABBIT)**: Breeding date as primary anchor (no misleading "cycle start")
3. **"Observation-Only" Species (GOAT, SHEEP)**: Cycle start only (no testing option shown)

---

## Visual Mockups by Species

### 1. DOG BREEDER EXPERIENCE

#### Overview Tab - Initial State (No Anchor Locked)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Bella × Max                          [Status] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Lock Plan to Start Tracking                                │
│                                                                 │
│  Choose how you want to track this breeding cycle:             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ○ Lock from Heat Start Date (Medium Accuracy)          │  │
│  │     Best for: Getting started quickly                    │  │
│  │     Accuracy: ±2-3 days for whelping prediction         │  │
│  │                                                          │  │
│  │     Heat Start Date: [__________] 📅                    │  │
│  │                                                          │  │
│  │     💡 You can upgrade to ovulation-based tracking      │  │
│  │        later after progesterone testing                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ○ Lock from Ovulation Date (High Accuracy) ⭐          │  │
│  │     Best for: Maximum accuracy (recommended)             │  │
│  │     Accuracy: ±1 day for whelping prediction            │  │
│  │                                                          │  │
│  │     Ovulation Date: [__________] 📅                     │  │
│  │     Confirmed by: [Progesterone Test ▼]                 │  │
│  │                                                          │  │
│  │     ℹ️ Requires progesterone testing (4-7 tests,        │  │
│  │        typically $400-840 per breeding)                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Cancel]                            [Lock & Calculate Dates]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Overview Tab - After Locking from Heat Start

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Bella × Max                    Status: LOCKED │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Plan Locked - Heat Start Anchor                            │
│                                                                 │
│  Anchor Date: March 15, 2026 (Heat Start)                      │
│  Confidence: MEDIUM (±2-3 days)                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ⬆️ UPGRADE TO OVULATION ANCHOR                          │  │
│  │                                                          │  │
│  │  Did you get progesterone testing? Upgrade for better   │  │
│  │  accuracy and learn your female's unique pattern.       │  │
│  │                                                          │  │
│  │  Benefits:                                               │  │
│  │  • ±1 day whelping prediction (vs current ±2-3 days)   │  │
│  │  • Track individual variance (early/late ovulator)      │  │
│  │  • Better predictions for next cycle                     │  │
│  │                                                          │  │
│  │  [Enter Ovulation Date & Test Results]                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Key Dates (Expected):                                         │
│  • Progesterone Testing Start: March 20 (day 5-6)             │
│  • Expected Ovulation: March 27 (day 12)                      │
│  • Optimal Breeding Window: March 27-29                       │
│  • Expected Whelping: May 29, 2026                            │
│                                                                 │
│  Timeline Progress:                                            │
│  [🔵════════════════════════════════○──────] 63%              │
│   Heat Start ────→ Now ────→ Expected Whelping                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Overview Tab - After Upgrading to Ovulation Anchor

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Bella × Max                    Status: LOCKED │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Plan Locked - Ovulation Anchor ⭐                          │
│                                                                 │
│  Primary Anchor: March 27, 2026 (Ovulation - Progesterone)     │
│  Confidence: HIGH (±1 day)                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  📊 ANCHOR RECONCILIATION                                │  │
│  │                                                          │  │
│  │  Heat Start (observed):    March 15, 2026               │  │
│  │  Ovulation (confirmed):    March 27, 2026               │  │
│  │  Offset: 12 days                                         │  │
│  │                                                          │  │
│  │  Pattern Insight:                                        │  │
│  │  ✅ Bella ovulates on-time with breed average (12 days) │  │
│  │     Next cycle prediction: High confidence               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Key Dates (Recalculated from Ovulation):                     │
│  • Optimal Breeding Window: March 27-29 ✅ COMPLETED           │
│  • Expected Whelping: May 29, 2026 (63 days from ovulation)   │
│  • Weaning Window: July 24-31 (8 weeks, optional)             │
│  • Placement Readiness: Aug 7-14 (10 weeks minimum)           │
│                                                                 │
│  Timeline Progress:                                            │
│  [🔵════════════════════════════════○──────] 63%              │
│   Ovulation ────→ Now ────→ Expected Whelping                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. HORSE BREEDER EXPERIENCE

#### Overview Tab - Initial State (Species-Specific Terminology)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Misty × Thunder                      [Status] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Lock Plan to Start Tracking                                │
│                                                                 │
│  Choose how you want to track this breeding cycle:             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ○ Lock from Cycle Start Date (Medium Accuracy)         │  │
│  │     Best for: Natural cover breeding                     │  │
│  │     Accuracy: ±5-7 days for foaling prediction          │  │
│  │                                                          │  │
│  │     Cycle Start Date: [__________] 📅                   │  │
│  │                                                          │  │
│  │     💡 You can upgrade to ovulation-based tracking      │  │
│  │        later after ultrasound confirmation               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  ○ Lock from Ovulation Date (High Accuracy) ⭐          │  │
│  │     Best for: AI breeding, maximum accuracy              │  │
│  │     Accuracy: ±3 days for foaling prediction            │  │
│  │                                                          │  │
│  │     Ovulation Date: [__________] 📅                     │  │
│  │     Confirmed by: [Ultrasound ▼]                        │  │
│  │                                                          │  │
│  │     ℹ️ Requires veterinary ultrasound monitoring        │  │
│  │        (typically 3-5 exams during heat)                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Cancel]                            [Lock & Calculate Dates]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Overview Tab - After Locking from Ovulation (Horse-Specific Features)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Misty × Thunder                 Status: LOCKED │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Plan Locked - Ovulation Anchor ⭐                          │
│                                                                 │
│  Primary Anchor: April 10, 2026 (Ovulation - Ultrasound)       │
│  Confidence: HIGH (±3 days)                                    │
│                                                                 │
│  Key Dates (Calculated from Ovulation):                        │
│  • Breeding Date: April 10, 2026 ✅ COMPLETED                  │
│  • Expected Foaling: March 16, 2027 (340 days)                │
│  • Weaning (REQUIRED): Aug 16-Sep 16, 2027 (5-6 months) ⚠️    │
│  • Placement Readiness: Sep 16, 2027+                          │
│                                                                 │
│  ⚠️ WEANING MILESTONE REQUIRED FOR HORSES                      │
│  Weaning is a critical health milestone for foals. You must    │
│  record the actual weaning date to track health monitoring.    │
│                                                                 │
│  Timeline Progress:                                            │
│  [🔵═══○────────────────────────────────────] 21%              │
│   Ovulation ────→ Now ────→ Expected Foaling                   │
│                                                                 │
│  🐴 Foaling Checklist: 8 milestones generated                  │
│     Next milestone: 45-day pregnancy check (May 25)            │
│     [View Foaling Checklist Tab →]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Note:** Horses have an additional tab called "Foaling Checklist" that auto-generates 8 veterinary milestones (15d, 45d, 90d, 300d, 320d, 330d, 340d, 350d) from the ovulation/breeding anchor. This tab does NOT appear for other species.

---

### 3. CAT BREEDER EXPERIENCE

#### Overview Tab - Initial State (BREEDING-FIRST Paradigm)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Luna × Shadow                        [Status] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Lock Plan to Start Tracking                                │
│                                                                 │
│  ℹ️ ABOUT CAT BREEDING CYCLES                                  │
│  Cats are "induced ovulators" - ovulation is triggered by      │
│  breeding itself. There is no distinct heat cycle to track,    │
│  so we use the breeding date as the primary anchor.            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🔒 Lock from Breeding Date (Standard for Cats)          │  │
│  │                                                          │  │
│  │     Breeding Date: [__________] 📅                      │  │
│  │                                                          │  │
│  │     Expected Kittening: Auto-calculated (63 days)       │  │
│  │     Accuracy: ±2-3 days                                  │  │
│  │                                                          │  │
│  │     💡 No progesterone testing needed for cats -        │  │
│  │        breeding itself triggers ovulation                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Cancel]                            [Lock & Calculate Dates]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CRITICAL DIFFERENCE:** No "cycle start" option shown at all. Cats don't have observable heat cycles that breeders track the way dogs do. The UI reflects the biological reality - breeding IS the anchor.

#### Overview Tab - After Locking from Breeding Date

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Luna × Shadow                   Status: LOCKED │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Plan Locked - Breeding Date Anchor                         │
│                                                                 │
│  Anchor Date: March 20, 2026 (Breeding)                        │
│  Confidence: MEDIUM (±2-3 days)                                │
│                                                                 │
│  Key Dates (Calculated from Breeding):                         │
│  • Breeding Date: March 20, 2026 ✅ COMPLETED                  │
│  • Expected Kittening: May 22, 2026 (63 days)                 │
│  • Weaning Window: July 17-24 (8 weeks, optional)             │
│  • Placement Readiness: July 31-Aug 7 (10 weeks minimum)      │
│                                                                 │
│  Timeline Progress:                                            │
│  [🔵════════════════════════════════○──────] 63%              │
│   Breeding ────→ Now ────→ Expected Kittening                  │
│                                                                 │
│  ℹ️ Recording weaning date is optional for cats. Focus on     │
│     tracking placement readiness (10+ weeks recommended).      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**No "upgrade to ovulation" button** - there's nothing to upgrade to. The breeding date IS the most accurate anchor for induced ovulators.

---

### 4. RABBIT BREEDER EXPERIENCE

#### Overview Tab - Initial State (Same Pattern as Cats)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Clover × Cotton                      [Status] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Lock Plan to Start Tracking                                │
│                                                                 │
│  ℹ️ ABOUT RABBIT BREEDING CYCLES                               │
│  Rabbits are "induced ovulators" - ovulation is triggered by   │
│  breeding itself. There is no distinct heat cycle to track,    │
│  so we use the breeding date as the primary anchor.            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🔒 Lock from Breeding Date (Standard for Rabbits)       │  │
│  │                                                          │  │
│  │     Breeding Date: [__________] 📅                      │  │
│  │                                                          │  │
│  │     Expected Kindling: Auto-calculated (31 days)        │  │
│  │     Accuracy: ±1 day                                     │  │
│  │                                                          │  │
│  │     💡 No hormone testing needed for rabbits -          │  │
│  │        breeding itself triggers ovulation                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Cancel]                            [Lock & Calculate Dates]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Pattern Consistency:** Exact same UX as cats, but with rabbit-specific terminology ("Kindling" not "Kittening", 31 days not 63 days gestation).

---

### 5. GOAT BREEDER EXPERIENCE

#### Overview Tab - Initial State (OBSERVATION-ONLY Pattern)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Daisy × Buck                         [Status] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Lock Plan to Start Tracking                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🔒 Lock from Cycle Start Date                           │  │
│  │                                                          │  │
│  │     Cycle Start Date: [__________] 📅                   │  │
│  │                                                          │  │
│  │     Expected Kidding: Auto-calculated (150 days)        │  │
│  │     Accuracy: ±3-5 days                                  │  │
│  │                                                          │  │
│  │     ℹ️ Most goat breeders track from observed heat      │  │
│  │        signs. Ovulation testing is not commonly used.    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Cancel]                            [Lock & Calculate Dates]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CRITICAL DIFFERENCE:** Only ONE option shown (cycle start). No ovulation option because ultrasound/progesterone testing is not standard practice for goats. Clean, simple, appropriate for the species.

---

### 6. SHEEP BREEDER EXPERIENCE

#### Overview Tab - Initial State (Same as Goats)

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 Breeding Plan: Molly × Ram                          [Status] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 Lock Plan to Start Tracking                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  🔒 Lock from Cycle Start Date                           │  │
│  │                                                          │  │
│  │     Cycle Start Date: [__________] 📅                   │  │
│  │                                                          │  │
│  │     Expected Lambing: Auto-calculated (147 days)        │  │
│  │     Accuracy: ±3-5 days                                  │  │
│  │                                                          │  │
│  │     ℹ️ Most sheep breeders track from observed heat     │  │
│  │        signs. Ovulation testing is not commonly used.    │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Cancel]                            [Lock & Calculate Dates]  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Pattern Consistency:** Exact same UX as goats, with sheep-specific terminology ("Lambing" not "Kidding", 147 days not 150 days gestation).

---

## Phase Chart Variations

### Universal 8-Phase Progression (All Species)

```
PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
```

**Species-Specific Phase Chart Rendering:**

#### DOG/CAT/RABBIT (Weaning Optional)

```
┌───────────────────────────────────────────────────────────────┐
│  Phase Progress: BRED                                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ Planning      (Plan created)                              │
│  ✅ Committed     (Heat start locked: March 15)               │
│  ✅ Bred          (Breeding completed: March 27)              │
│  ⏳ Birthed       (Expected: May 29)                          │
│  ○  Weaned        (Optional - may skip)                       │
│  ○  Placement     (Expected: Aug 7-14)                        │
│  ○  Complete      (All puppies placed)                        │
│                                                               │
│  💡 You can skip weaning and go straight to placement if     │
│     you prefer to track by age readiness instead.             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

#### HORSE (Weaning Required)

```
┌───────────────────────────────────────────────────────────────┐
│  Phase Progress: BRED                                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ Planning      (Plan created)                              │
│  ✅ Committed     (Ovulation locked: April 10)                │
│  ✅ Bred          (Breeding completed: April 10)              │
│  ⏳ Birthed       (Expected: March 16, 2027)                  │
│  ⚠️ Weaned        (REQUIRED - 5-6 months after birth)         │
│  ○  Placement     (Expected: Sep 16, 2027+)                   │
│  ○  Complete      (Foal placed)                               │
│                                                               │
│  ⚠️ Recording weaning date is REQUIRED for horses due to     │
│     veterinary health monitoring requirements.                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Visual Difference:**
- Optional phases: Gray circle `○` with light text
- Required phases: Same styling as other required phases
- Warning icon `⚠️` for HORSE weaning requirement

---

## Date Tab Layouts

### Universal Tab Structure

```
┌───────────────────────────────────────────────────────────────┐
│  📅 DATES TAB                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  SECTION 1: Expected Dates (Calculated from Anchor)          │
│  SECTION 2: Recalculated Dates (After Actual Dates Entered)  │
│  SECTION 3: Actual Dates (User-Entered)                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### DOG - Dates Tab (Cycle Start Anchor)

```
┌───────────────────────────────────────────────────────────────┐
│  📅 DATES TAB                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  🔒 Plan Anchor: Heat Start (March 15, 2026) - MEDIUM CONF.  │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  EXPECTED DATES (Calculated from Heat Start)                 │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  🔵 Progesterone Testing Start:  March 20 (day 5-6)          │
│  🔵 Expected Ovulation:           March 27 (±2 days)         │
│  🔵 Optimal Breeding Window:      March 27-29                │
│  🔵 Expected Whelping:            May 29 (±2-3 days)         │
│  🔵 Weaning Window (optional):    July 24-31                 │
│  🔵 Placement Readiness:          Aug 7-14 (10 weeks min)    │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  ACTUAL DATES (Record as they occur)                         │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  Heat Start Date:            March 15, 2026 ✅ (LOCKED)      │
│  Ovulation Date:             [__________] 📅                 │
│    └─ Confirmed by:          [Progesterone Test ▼]           │
│  Breeding Date(s):           [__________] 📅 [+ Add More]    │
│  Whelping Date:              [__________] 📅                 │
│  Weaning Date (optional):    [__________] 📅                 │
│                                                               │
│  ⬆️ [Upgrade to Ovulation Anchor] (after entering ovulation) │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### DOG - Dates Tab (After Upgrading to Ovulation Anchor)

```
┌───────────────────────────────────────────────────────────────┐
│  📅 DATES TAB                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  🔒 Plan Anchor: Ovulation (March 27, 2026) - HIGH CONF. ⭐  │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  📊 ANCHOR RECONCILIATION                                     │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  Heat Start (observed):        March 15, 2026                │
│  Ovulation (confirmed):        March 27, 2026                │
│  Offset: 12 days               ✅ On-time (breed avg: 12d)   │
│                                                               │
│  Pattern Insight: Bella ovulates on schedule. Next cycle     │
│  prediction will have HIGH confidence.                        │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  EXPECTED DATES (Recalculated from Ovulation)                │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  🟢 Optimal Breeding Window:      March 27-29 ✅ DONE        │
│  🟢 Expected Whelping:            May 29 (±1 day) ⬆️ IMPROVED│
│  🟢 Weaning Window (optional):    July 24-31                 │
│  🟢 Placement Readiness:          Aug 7-14 (10 weeks min)    │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  ACTUAL DATES (Record as they occur)                         │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  Heat Start Date:            March 15, 2026 ✅               │
│  Ovulation Date:             March 27, 2026 ✅ (LOCKED)      │
│    └─ Confirmed by:          Progesterone Test               │
│  Breeding Date(s):           March 28, 2026 ✅               │
│  Whelping Date:              [__________] 📅                 │
│  Weaning Date (optional):    [__________] 📅                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Visual Changes After Upgrade:**
- Confidence badge changes: MEDIUM → HIGH ⭐
- New "Anchor Reconciliation" section appears
- Expected dates show 🟢 green indicators (vs 🔵 blue)
- Accuracy improvements highlighted (±2-3 days → ±1 day) with ⬆️ arrow
- Pattern learning insights displayed

### HORSE - Dates Tab (Ovulation Anchor)

```
┌───────────────────────────────────────────────────────────────┐
│  📅 DATES TAB                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  🔒 Plan Anchor: Ovulation (April 10, 2026) - HIGH CONF. ⭐  │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  EXPECTED DATES (Calculated from Ovulation)                  │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  🟢 Breeding Date:                April 10, 2026 ✅          │
│  🟢 Expected Foaling:             March 16, 2027 (±3 days)   │
│  🟢 Weaning Window (REQUIRED):    Aug 16 - Sep 16, 2027      │
│  🟢 Placement Readiness:          Sep 16, 2027+              │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  ACTUAL DATES (Record as they occur)                         │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  Cycle Start Date:           [__________] 📅 (optional)      │
│  Ovulation Date:             April 10, 2026 ✅ (LOCKED)      │
│    └─ Confirmed by:          Ultrasound                      │
│  Breeding Date:              April 10, 2026 ✅               │
│  Foaling Date:               [__________] 📅                 │
│  Weaning Date:               [__________] 📅 ⚠️ REQUIRED     │
│                                                               │
│  ℹ️ Weaning date is REQUIRED for horses due to health       │
│     monitoring requirements. See Foaling Checklist tab.      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Horse-Specific Differences:**
- "Whelping" → "Foaling" terminology
- Weaning marked as REQUIRED with ⚠️ icon
- 340-day gestation (not 63 days)
- Optional cycle start field (can be entered after the fact for records)
- Link to Foaling Checklist tab

### CAT - Dates Tab (Breeding Date Anchor)

```
┌───────────────────────────────────────────────────────────────┐
│  📅 DATES TAB                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  🔒 Plan Anchor: Breeding Date (March 20, 2026) - MEDIUM CONF│
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  EXPECTED DATES (Calculated from Breeding)                   │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  🔵 Expected Kittening:           May 22, 2026 (±2-3 days)   │
│  🔵 Weaning Window (optional):    July 17-24 (8 weeks)       │
│  🔵 Placement Readiness:          July 31 - Aug 7 (10 weeks) │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  ACTUAL DATES (Record as they occur)                         │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  Breeding Date:              March 20, 2026 ✅ (LOCKED)      │
│  Kittening Date:             [__________] 📅                 │
│  Weaning Date (optional):    [__________] 📅                 │
│                                                               │
│  ℹ️ Cats are induced ovulators - no cycle start or          │
│     ovulation tracking needed. Breeding date is the anchor.  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Cat-Specific Differences:**
- NO "Cycle Start Date" field (not applicable)
- NO "Ovulation Date" field (induced ovulator)
- NO "Upgrade to Ovulation" button
- "Whelping/Foaling" → "Kittening" terminology
- Educational note explains why simpler approach is correct

### RABBIT - Dates Tab (Breeding Date Anchor)

```
┌───────────────────────────────────────────────────────────────┐
│  📅 DATES TAB                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  🔒 Plan Anchor: Breeding Date (March 25, 2026) - MEDIUM CONF│
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  EXPECTED DATES (Calculated from Breeding)                   │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  🔵 Expected Kindling:            April 25, 2026 (±1 day)    │
│  🔵 Weaning Window (optional):    June 6-13 (6 weeks)        │
│  🔵 Placement Readiness:          June 20-27 (8 weeks)       │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  ACTUAL DATES (Record as they occur)                         │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  Breeding Date:              March 25, 2026 ✅ (LOCKED)      │
│  Kindling Date:              [__________] 📅                 │
│  Weaning Date (optional):    [__________] 📅                 │
│                                                               │
│  ℹ️ Rabbits are induced ovulators - no cycle start or       │
│     ovulation tracking needed. Breeding date is the anchor.  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Rabbit-Specific Differences:**
- Same pattern as cats (breeding-first)
- "Kittening" → "Kindling" terminology
- 31-day gestation (not 63 days)
- Earlier weaning/placement (6-8 weeks vs 8-10 weeks)

### GOAT - Dates Tab (Cycle Start Only)

```
┌───────────────────────────────────────────────────────────────┐
│  📅 DATES TAB                                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  🔒 Plan Anchor: Cycle Start (March 5, 2026) - MEDIUM CONF.  │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  EXPECTED DATES (Calculated from Cycle Start)                │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  🔵 Expected Breeding Window:     March 6-8                  │
│  🔵 Expected Kidding:             Aug 2, 2026 (±3-5 days)    │
│  🔵 Weaning Window (optional):    Oct 2-16 (8-10 weeks)      │
│  🔵 Placement Readiness:          Oct 16, 2026+              │
│                                                               │
│  ────────────────────────────────────────────────────────    │
│  ACTUAL DATES (Record as they occur)                         │
│  ────────────────────────────────────────────────────────    │
│                                                               │
│  Cycle Start Date:           March 5, 2026 ✅ (LOCKED)       │
│  Breeding Date(s):           [__________] 📅 [+ Add More]    │
│  Kidding Date:               [__________] 📅                 │
│  Weaning Date (optional):    [__________] 📅                 │
│                                                               │
│  ℹ️ Most goat breeders track from observed heat. Ovulation  │
│     testing is not commonly used for this species.           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Goat-Specific Differences:**
- NO "Ovulation Date" field (not standard practice)
- NO "Upgrade to Ovulation" button
- "Whelping/Foaling" → "Kidding" terminology
- 150-day gestation
- Educational note explains species-specific practice

---

## Anchor Mode Selector UI

### Component: AnchorModeSelector.tsx

**Rendered Conditionally Based on Species:**

```typescript
function AnchorModeSelector({ species, onSelectAnchor }) {
  const terminology = getSpeciesTerminology(species)

  // Determine which anchor options to show
  const availableAnchors = terminology.anchorMode.options

  return (
    <div className="anchor-mode-selector">
      <h3>🔒 Lock Plan to Start Tracking</h3>

      {/* Educational note for induced ovulators */}
      {terminology.anchorMode.isInducedOvulator && (
        <Alert variant="info">
          <strong>About {terminology.species} Breeding Cycles</strong>
          <p>
            {terminology.species} are "induced ovulators" - ovulation is
            triggered by breeding itself. There is no distinct heat cycle
            to track, so we use the breeding date as the primary anchor.
          </p>
        </Alert>
      )}

      {/* Show available anchor options */}
      {availableAnchors.map(anchor => (
        <AnchorOption
          key={anchor.type}
          type={anchor.type}
          label={anchor.label}
          description={anchor.description}
          accuracy={anchor.accuracy}
          recommended={anchor.recommended}
          onSelect={() => onSelectAnchor(anchor.type)}
        />
      ))}
    </div>
  )
}
```

### Species Terminology Extension (Extended Interface)

```typescript
interface SpeciesAnchorModeConfig {
  // Which anchor options are available for this species?
  options: Array<{
    type: 'CYCLE_START' | 'OVULATION' | 'BREEDING_DATE'
    label: string                // e.g., "Heat Start Date" for dogs
    description: string          // User-facing explanation
    accuracy: string             // e.g., "±2-3 days"
    recommended: boolean         // Show ⭐ badge
    requiresConfirmation: boolean // e.g., progesterone test required
    confirmationMethods?: string[] // e.g., ["Progesterone Test", "Ultrasound"]
  }>

  // Default/recommended anchor for new plans
  defaultAnchor: 'CYCLE_START' | 'OVULATION' | 'BREEDING_DATE'

  // Can users upgrade from one anchor to another?
  supportsUpgrade: boolean
  upgradeFrom?: 'CYCLE_START'
  upgradeTo?: 'OVULATION'

  // Is this an induced ovulator? (affects UI messaging)
  isInducedOvulator: boolean

  // Is ovulation testing available/practical?
  testingAvailable: boolean
  testingType?: 'progesterone' | 'ultrasound' | 'none'
}
```

### Example Configurations:

```typescript
const SPECIES_ANCHOR_CONFIG: Record<Species, SpeciesAnchorModeConfig> = {
  DOG: {
    options: [
      {
        type: 'CYCLE_START',
        label: 'Heat Start Date',
        description: 'Best for: Getting started quickly',
        accuracy: '±2-3 days',
        recommended: false,
        requiresConfirmation: false
      },
      {
        type: 'OVULATION',
        label: 'Ovulation Date',
        description: 'Best for: Maximum accuracy (recommended)',
        accuracy: '±1 day',
        recommended: true,
        requiresConfirmation: true,
        confirmationMethods: ['Progesterone Test', 'LH Test', 'Vaginal Cytology']
      }
    ],
    defaultAnchor: 'CYCLE_START',
    supportsUpgrade: true,
    upgradeFrom: 'CYCLE_START',
    upgradeTo: 'OVULATION',
    isInducedOvulator: false,
    testingAvailable: true,
    testingType: 'progesterone'
  },

  HORSE: {
    options: [
      {
        type: 'CYCLE_START',
        label: 'Cycle Start Date',
        description: 'Best for: Natural cover breeding',
        accuracy: '±5-7 days',
        recommended: false,
        requiresConfirmation: false
      },
      {
        type: 'OVULATION',
        label: 'Ovulation Date',
        description: 'Best for: AI breeding, maximum accuracy',
        accuracy: '±3 days',
        recommended: true,
        requiresConfirmation: true,
        confirmationMethods: ['Ultrasound', 'Palpation']
      }
    ],
    defaultAnchor: 'CYCLE_START',
    supportsUpgrade: true,
    upgradeFrom: 'CYCLE_START',
    upgradeTo: 'OVULATION',
    isInducedOvulator: false,
    testingAvailable: true,
    testingType: 'ultrasound'
  },

  CAT: {
    options: [
      {
        type: 'BREEDING_DATE',
        label: 'Breeding Date',
        description: 'Standard for cats (induced ovulators)',
        accuracy: '±2-3 days',
        recommended: true,
        requiresConfirmation: false
      }
    ],
    defaultAnchor: 'BREEDING_DATE',
    supportsUpgrade: false,
    isInducedOvulator: true,
    testingAvailable: false,
    testingType: 'none'
  },

  RABBIT: {
    options: [
      {
        type: 'BREEDING_DATE',
        label: 'Breeding Date',
        description: 'Standard for rabbits (induced ovulators)',
        accuracy: '±1 day',
        recommended: true,
        requiresConfirmation: false
      }
    ],
    defaultAnchor: 'BREEDING_DATE',
    supportsUpgrade: false,
    isInducedOvulator: true,
    testingAvailable: false,
    testingType: 'none'
  },

  GOAT: {
    options: [
      {
        type: 'CYCLE_START',
        label: 'Cycle Start Date',
        description: 'Standard for goats',
        accuracy: '±3-5 days',
        recommended: true,
        requiresConfirmation: false
      }
    ],
    defaultAnchor: 'CYCLE_START',
    supportsUpgrade: false,
    isInducedOvulator: false,
    testingAvailable: false,
    testingType: 'none'
  },

  SHEEP: {
    options: [
      {
        type: 'CYCLE_START',
        label: 'Cycle Start Date',
        description: 'Standard for sheep',
        accuracy: '±3-5 days',
        recommended: true,
        requiresConfirmation: false
      }
    ],
    defaultAnchor: 'CYCLE_START',
    supportsUpgrade: false,
    isInducedOvulator: false,
    testingAvailable: false,
    testingType: 'none'
  }
}
```

---

## User Flows by Species

### Flow 1: DOG BREEDER (Progressive Enhancement Path)

```
Step 1: Create Breeding Plan
  ↓
Step 2: Species selected: DOG
  ↓
Step 3: Anchor Mode Selector appears
  ├─ Option A: Heat Start Date (Medium Accuracy)
  └─ Option B: Ovulation Date (High Accuracy) ⭐
  ↓
USER CHOOSES: Heat Start Date (easier to start)
  ↓
Step 4: Enter heat start date → March 15, 2026
  ↓
Step 5: Click "Lock & Calculate Dates"
  ↓
Step 6: Plan locked - Status: COMMITTED
  ├─ Anchor: Heat Start (MEDIUM confidence)
  ├─ Expected ovulation: March 27
  ├─ Expected whelping: May 29 (±2-3 days)
  └─ "Upgrade to Ovulation Anchor" button appears
  ↓
[DAYS/WEEKS PASS - Breeder gets progesterone testing]
  ↓
Step 7: Breeder returns to plan
  ↓
Step 8: Clicks "Upgrade to Ovulation Anchor" button
  ↓
Step 9: Modal appears:
  ├─ Enter ovulation date: [March 27]
  ├─ Confirmed by: [Progesterone Test ▼]
  ├─ Preview: "Whelping prediction improves to ±1 day"
  └─ [Cancel] [Upgrade Plan]
  ↓
Step 10: Click "Upgrade Plan"
  ↓
Step 11: Plan recalculated
  ├─ Anchor: Ovulation (HIGH confidence) ⭐
  ├─ Reconciliation shown: Heat start + 12 days = On-time
  ├─ Expected whelping: May 29 (±1 day) ⬆️ IMPROVED
  └─ Pattern insight: "Bella ovulates on schedule"
  ↓
Step 12: All future views show ovulation as primary anchor
  ├─ Gantt chart recalculated
  ├─ Calendar updated with higher confidence
  └─ Next cycle prediction improved
```

**User Experience:**
- ✅ Low barrier to entry (can start with just heat observation)
- ✅ Educational (learns value of progesterone testing)
- ✅ Non-destructive upgrade (keeps original heat start date)
- ✅ Clear improvement messaging (±2-3 days → ±1 day)
- ✅ Pattern learning (builds confidence for future cycles)

---

### Flow 2: HORSE BREEDER (Direct to Ovulation)

```
Step 1: Create Breeding Plan
  ↓
Step 2: Species selected: HORSE
  ↓
Step 3: Anchor Mode Selector appears
  ├─ Option A: Cycle Start Date (Medium Accuracy)
  └─ Option B: Ovulation Date (High Accuracy) ⭐
  ↓
USER CHOOSES: Ovulation Date (AI breeding, already doing ultrasound)
  ↓
Step 4: Enter ovulation details
  ├─ Ovulation date: April 10, 2026
  └─ Confirmed by: Ultrasound
  ↓
Step 5: Click "Lock & Calculate Dates"
  ↓
Step 6: Plan locked - Status: COMMITTED
  ├─ Anchor: Ovulation (HIGH confidence) ⭐
  ├─ Expected foaling: March 16, 2027 (±3 days)
  ├─ Weaning required: Aug 16 - Sep 16, 2027 ⚠️
  └─ Foaling Checklist auto-generated (8 milestones)
  ↓
Step 7: Breeder navigates to "Foaling Checklist" tab
  ↓
Step 8: Sees 8 veterinary milestones:
  ├─ 15-day pregnancy check: April 25 ✅ COMPLETED
  ├─ 45-day ultrasound: May 25 ⏳ UPCOMING
  ├─ 90-day assessment: July 9
  ├─ 300-day prep: Feb 4, 2027
  ├─ 320-day final check: Feb 24, 2027
  ├─ 330-day foaling watch: March 6, 2027
  ├─ 340-day expected foaling: March 16, 2027
  └─ 350-day late foaling: March 26, 2027
  ↓
Step 9: All milestones calculated from OVULATION anchor
  ├─ If anchor changes (e.g., actual foaling), milestones recalculate
  └─ Post-birth milestones use birth as anchor (weaning, placement)
```

**User Experience:**
- ✅ Professional workflow (AI breeders already doing ultrasound)
- ✅ Horse-specific features appear automatically (Foaling Checklist)
- ✅ Weaning requirement enforced (can't skip to placement)
- ✅ Milestones align with veterinary best practices

---

### Flow 3: CAT BREEDER (Breeding-First Paradigm)

```
Step 1: Create Breeding Plan
  ↓
Step 2: Species selected: CAT
  ↓
Step 3: Anchor Mode Selector appears
  ├─ Educational note: "Cats are induced ovulators"
  └─ ONLY Option: Breeding Date (Standard for Cats)
  ↓
Step 4: Enter breeding date: March 20, 2026
  ↓
Step 5: Click "Lock & Calculate Dates"
  ↓
Step 6: Plan locked - Status: COMMITTED (no BRED status needed)
  ├─ Anchor: Breeding Date (MEDIUM confidence)
  ├─ Expected kittening: May 22, 2026 (±2-3 days)
  ├─ Weaning (optional): July 17-24
  └─ Placement readiness: July 31 - Aug 7
  ↓
Step 7: Breeder views Dates tab
  ├─ NO "Cycle Start" field shown
  ├─ NO "Ovulation" field shown
  ├─ NO "Upgrade" button shown
  └─ Clean, simple breeding-first workflow
  ↓
Step 8: After kittening, enter actual birth date
  ↓
Step 9: Plan recalculated from BIRTH (anchor priority switch)
  ├─ Weaning recalculated from birth
  ├─ Placement recalculated from birth
  └─ Timeline shows birth as primary anchor for post-birth phases
```

**User Experience:**
- ✅ No confusing "cycle start" terminology (doesn't apply to cats)
- ✅ No misleading "upgrade to ovulation" option (not applicable)
- ✅ Clean, simple workflow matches biological reality
- ✅ Educational note explains WHY it's different
- ✅ Cat breeder thinks "they built this for ME!" ✨

---

### Flow 4: RABBIT BREEDER (Same as Cats, Different Timeline)

```
[Identical flow to cats, with these differences:]

Step 3: Educational note: "Rabbits are induced ovulators"
Step 6: Expected kindling: April 20, 2026 (31 days, not 63)
        Weaning (optional): June 1-8 (6 weeks)
        Placement readiness: June 15-22 (8 weeks)
```

**User Experience:**
- ✅ Same breeding-first paradigm as cats
- ✅ Rabbit-specific terminology ("Kindling" not "Kittening")
- ✅ Shorter timeline (31-day gestation)
- ✅ Rabbit breeder thinks "they built this for ME!" ✨

---

### Flow 5: GOAT BREEDER (Observation-Only)

```
Step 1: Create Breeding Plan
  ↓
Step 2: Species selected: GOAT
  ↓
Step 3: Anchor Mode Selector appears
  ├─ Educational note: "Most goat breeders track from observed heat"
  └─ ONLY Option: Cycle Start Date
  ↓
Step 4: Enter cycle start date: March 5, 2026
  ↓
Step 5: Click "Lock & Calculate Dates"
  ↓
Step 6: Plan locked - Status: COMMITTED
  ├─ Anchor: Cycle Start (MEDIUM confidence)
  ├─ Expected kidding: Aug 2, 2026 (±3-5 days)
  ├─ Weaning (optional): Oct 2-16
  └─ Placement readiness: Oct 16+
  ↓
Step 7: Breeder views Dates tab
  ├─ NO "Ovulation" field shown
  ├─ NO "Upgrade" button shown
  ├─ Clean, straightforward cycle-start workflow
  └─ Matches common goat breeding practice
```

**User Experience:**
- ✅ No confusing ovulation testing options (not standard practice)
- ✅ Simple, appropriate for agricultural context
- ✅ Goat breeder thinks "this is exactly what I need" ✨

---

## Implementation Architecture

### Key Components

```typescript
// 1. Species Terminology Extension
packages/ui/src/utils/speciesTerminology.ts
  ├─ Extended interface: SpeciesAnchorModeConfig
  ├─ Anchor mode configurations per species
  └─ Helper functions: getAvailableAnchors(), supportsOvulationUpgrade()

// 2. Breeding Plan Drawer (Modified, NOT Replaced)
apps/breeding/src/App-Breeding.tsx (lines 6740-10420)
  ├─ Import species terminology
  ├─ Conditional rendering based on terminology.anchorMode
  ├─ Anchor mode selector (new component)
  ├─ Upgrade to ovulation button (conditional)
  └─ Reconciliation display (when hybrid data exists)

// 3. New Reusable Components
apps/breeding/src/components/breeding-plan/
  ├─ AnchorModeSelector.tsx (new)
  ├─ AnchorReconciliationCard.tsx (new)
  ├─ UpgradeToOvulationButton.tsx (new)
  └─ SpeciesAwareDateFields.tsx (new)

// 4. ReproEngine Updates
packages/ui/src/utils/reproEngine/
  ├─ buildTimelineFromOvulation.ts (new function)
  ├─ detectAnchorFromPlan.ts (updated priority logic)
  ├─ calculateVariance.ts (new - ovulation offset tracking)
  └─ defaults.ts (updated with anchor mode configs)

// 5. Status Derivation Updates
apps/breeding/src/pages/planner/deriveBreedingStatus.ts
  ├─ Accept ovulation as alternative to cycle start for COMMITTED
  ├─ Species-aware weaning requirement logic
  └─ Hybrid anchor priority logic

// 6. Database Schema
apps/breeding/prisma/schema.prisma
  ├─ Add: reproAnchorMode (CYCLE_START | OVULATION | BREEDING_DATE)
  ├─ Add: cycleStartObserved, cycleStartConfidence
  ├─ Add: ovulationConfirmed, ovulationConfirmedMethod
  ├─ Add: primaryAnchor (system-determined)
  └─ Add: expectedOvulationOffset, actualOvulationOffset, varianceFromExpected
```

### Conditional Rendering Logic

```typescript
function BreedingPlanDrawer({ plan }) {
  const terminology = getSpeciesTerminology(plan.species)
  const anchorConfig = terminology.anchorMode

  // Determine which sections to show
  const showOvulationField = anchorConfig.testingAvailable
  const showUpgradeButton = (
    anchorConfig.supportsUpgrade &&
    plan.primaryAnchor === 'CYCLE_START' &&
    !plan.ovulationConfirmed
  )
  const showReconciliation = (
    plan.cycleStartObserved &&
    plan.ovulationConfirmed
  )
  const showFoalingChecklist = plan.species === 'HORSE'
  const requireWeaning = terminology.weaning.required

  return (
    <Drawer>
      <Tabs>
        {/* Overview Tab - ALL SPECIES */}
        <Tab label="Overview">
          {showReconciliation && (
            <AnchorReconciliationCard plan={plan} />
          )}

          <KeyDatesSection plan={plan} terminology={terminology} />

          {showUpgradeButton && (
            <UpgradeToOvulationButton plan={plan} />
          )}
        </Tab>

        {/* Dates Tab - ALL SPECIES */}
        <Tab label="Dates">
          <ExpectedDatesSection plan={plan} />

          {showReconciliation && (
            <ReconciliationSection plan={plan} />
          )}

          <ActualDatesSection>
            {/* Cycle start field (conditional) */}
            {!anchorConfig.isInducedOvulator && (
              <DateField
                label={terminology.cycle.anchorDateLabel}
                value={plan.cycleStartObserved}
                locked={plan.primaryAnchor === 'CYCLE_START'}
              />
            )}

            {/* Ovulation field (conditional) */}
            {showOvulationField && (
              <OvulationDateField
                value={plan.ovulationConfirmed}
                method={plan.ovulationConfirmedMethod}
                methods={anchorConfig.options.find(o => o.type === 'OVULATION')?.confirmationMethods}
                locked={plan.primaryAnchor === 'OVULATION'}
              />
            )}

            {/* Breeding date field - ALL SPECIES */}
            <DateField
              label={terminology.cycle.breedingDateLabel}
              value={plan.breedDateActual}
              allowMultiple={true}
            />

            {/* Birth date field - ALL SPECIES */}
            <DateField
              label={terminology.birth.actualDateLabel}
              value={plan.actualBirthDate}
            />

            {/* Weaning date field (conditional requirement) */}
            <DateField
              label={terminology.weaning.actualDateLabel}
              value={plan.weanedDateActual}
              optional={!requireWeaning}
              required={requireWeaning}
            />
          </ActualDatesSection>
        </Tab>

        {/* Offspring Tab - ALL SPECIES */}
        <Tab label={terminology.offspring.pluralCapitalized}>
          <OffspringList plan={plan} />
        </Tab>

        {/* Horse-specific tab (conditional) */}
        {showFoalingChecklist && (
          <Tab label="Foaling Checklist">
            <FoalingMilestoneChecklist plan={plan} />
          </Tab>
        )}

        {/* Universal tabs */}
        <Tab label="Deposits">...</Tab>
        <Tab label="Finances">...</Tab>
        <Tab label="Audit">...</Tab>
      </Tabs>
    </Drawer>
  )
}
```

### Phase Chart Logic

```typescript
function PhaseChart({ plan }) {
  const terminology = getSpeciesTerminology(plan.species)
  const phases = deriveBreedingStatus(plan)

  const isWeaningOptional = !terminology.weaning.required

  return (
    <div className="phase-chart">
      {PHASES.map(phase => {
        // Special handling for WEANED phase
        if (phase === 'WEANED') {
          return (
            <PhaseIndicator
              key={phase}
              label={terminology.weaning.statusLabel}
              status={phases.current === phase ? 'active' : 'pending'}
              optional={isWeaningOptional}
              icon={isWeaningOptional ? '○' : '●'}
              tooltip={
                isWeaningOptional
                  ? 'Optional - you can skip to placement'
                  : 'Required for this species'
              }
            />
          )
        }

        return (
          <PhaseIndicator
            key={phase}
            label={getPhaseLabel(phase, terminology)}
            status={phases.current === phase ? 'active' : 'pending'}
          />
        )
      })}
    </div>
  )
}
```

---

## Summary: How This Achieves "Built for ME!"

### DOG BREEDER:
- ✅ Sees "Heat Start Date" not generic "Cycle Start"
- ✅ Gets educational guidance on progesterone testing timing
- ✅ Can start simple, upgrade later
- ✅ Learns individual female's pattern
- ✅ "Whelping" terminology throughout
- ✅ Weaning optional (not forced milestone)
- **Reaction:** "This understands how I breed dogs!" 🐕

### HORSE BREEDER:
- ✅ Sees "Cycle Start" or "Ovulation" options
- ✅ Ultrasound confirmation method (not just progesterone)
- ✅ "Foaling" terminology throughout
- ✅ Foaling Checklist tab auto-generates
- ✅ Weaning REQUIRED (enforced, not optional)
- ✅ 340-day gestation (not 63 days)
- **Reaction:** "This is built for professional horse breeding!" 🐴

### CAT BREEDER:
- ✅ NO confusing "Cycle Start" option
- ✅ Breeding Date as primary anchor (biologically correct)
- ✅ Educational explanation of induced ovulation
- ✅ "Kittening" terminology throughout
- ✅ No unnecessary testing options
- ✅ Clean, simple workflow
- **Reaction:** "Finally, software that understands cat breeding!" 🐱

### RABBIT BREEDER:
- ✅ Same breeding-first paradigm as cats
- ✅ "Kindling" terminology throughout
- ✅ 31-day gestation (not 63)
- ✅ 6-8 week timeline (not 8-10)
- ✅ No unnecessary complexity
- **Reaction:** "This is exactly what rabbit breeders need!" 🐰

### GOAT BREEDER:
- ✅ Simple cycle-start workflow
- ✅ No confusing ovulation testing options
- ✅ "Kidding" terminology throughout
- ✅ Agricultural-appropriate approach
- ✅ 150-day gestation
- **Reaction:** "Straightforward and practical for goats!" 🐐

### SHEEP BREEDER:
- ✅ Same as goats, with "Lambing" terminology
- ✅ 147-day gestation
- ✅ Agricultural-appropriate workflow
- **Reaction:** "Perfect for sheep breeding!" 🐑

---

## Technical Implementation Strategy

### Phase 0: Species Terminology Extension (Week 1)
```typescript
// Extend speciesTerminology.ts
interface SpeciesTerminology {
  // ... existing fields ...

  // NEW: Anchor mode configuration
  anchorMode: {
    options: AnchorOption[]
    defaultAnchor: AnchorType
    supportsUpgrade: boolean
    isInducedOvulator: boolean
    testingAvailable: boolean
    testingType: 'progesterone' | 'ultrasound' | 'none'
  }

  // NEW: Cycle terminology
  cycle: {
    anchorDateLabel: string      // "Heat Start Date" for dogs
    breedingDateLabel: string    // "Breeding Date(s)"
    cycleStartHelp: string       // Species-specific help text
  }

  // NEW: Ovulation terminology
  ovulation: {
    dateLabel: string            // "Ovulation Date"
    confirmationMethods: string[] // ["Progesterone Test", "Ultrasound"]
    testingGuidance: string      // "Start testing day 5-6 after heat signs"
  }

  // NEW: Weaning configuration
  weaning: {
    required: boolean            // true for horses, false for others
    statusLabel: string          // "Weaned"
    actualDateLabel: string      // "Weaning Date"
    estimatedDuration: number    // Weeks after birth
    weaningType: 'DISTINCT_EVENT' | 'GRADUAL_PROCESS'
  }
}
```

### Phase 1: Database Schema (Week 1)
```prisma
model BreedingPlan {
  // ... existing fields ...

  // Anchor mode system
  reproAnchorMode          ReproAnchorMode @default(CYCLE_START)

  // Cycle start tracking
  cycleStartObserved       DateTime?
  cycleStartSource         DataSource?
  cycleStartConfidence     ConfidenceLevel?

  // Ovulation tracking
  ovulationConfirmed       DateTime?
  ovulationConfirmedMethod OvulationMethod?
  ovulationConfidence      ConfidenceLevel?

  // System-determined primary anchor
  primaryAnchor            AnchorType @default(CYCLE_START)

  // Variance tracking (machine learning)
  expectedOvulationOffset  Int?  // Species default (e.g., 12 for dogs)
  actualOvulationOffset    Int?  // ovulation - cycleStart
  varianceFromExpected     Int?  // actual - expected
}

enum ReproAnchorMode {
  CYCLE_START
  OVULATION
  BREEDING_DATE
}

enum AnchorType {
  CYCLE_START
  OVULATION
  BIRTH
  LOCKED_CYCLE  // Legacy fallback
}

enum OvulationMethod {
  PROGESTERONE_TEST
  LH_TEST
  VAGINAL_CYTOLOGY
  ULTRASOUND
  PALPATION
  BREEDING_INDUCED  // For cats/rabbits
}

enum ConfidenceLevel {
  HIGH    // ±1-2 days
  MEDIUM  // ±2-5 days
  LOW     // ±5+ days
}
```

### Phase 2: Calculation Engine (Week 2)
```typescript
// New function: buildTimelineFromOvulation()
export function buildTimelineFromOvulation(
  ovulationDate: Date,
  species: Species
): Timeline {
  const config = getSpeciesTerminology(species)
  const gestationDays = getGestationDays(species)

  return {
    ovulation: ovulationDate,
    breedingWindow: {
      start: addDays(ovulationDate, -1),
      end: addDays(ovulationDate, 1)
    },
    expectedBirth: addDays(ovulationDate, gestationDays),
    expectedWeaning: config.weaning.required
      ? addWeeks(addDays(ovulationDate, gestationDays), config.weaning.estimatedDuration)
      : null,
    confidence: 'HIGH'
  }
}

// Updated function: detectAnchorFromPlan()
export function detectAnchorFromPlan(plan: BreedingPlan): AnchorType {
  // Priority 1: Actual birth (highest confidence)
  if (plan.actualBirthDate) {
    return 'BIRTH'
  }

  // Priority 2: Confirmed ovulation (high confidence)
  if (plan.ovulationConfirmed && plan.reproAnchorMode === 'OVULATION') {
    return 'OVULATION'
  }

  // Priority 3: Observed cycle start (medium confidence)
  if (plan.cycleStartObserved && plan.reproAnchorMode === 'CYCLE_START') {
    return 'CYCLE_START'
  }

  // Priority 4: Breeding date (for induced ovulators)
  if (plan.breedDateActual && plan.reproAnchorMode === 'BREEDING_DATE') {
    return 'OVULATION'  // Breeding = ovulation for induced ovulators
  }

  // Fallback: Legacy locked cycle
  return 'LOCKED_CYCLE'
}
```

### Phase 3: UI Components (Week 3-4)

**ONE Drawer Component, Conditional Rendering:**

```typescript
// apps/breeding/src/App-Breeding.tsx (modify existing drawer, lines 6740-10420)

function BreedingPlanDrawerContent({ plan }) {
  const terminology = getSpeciesTerminology(plan.species)

  // Feature flags based on species
  const features = {
    showOvulationField: terminology.anchorMode.testingAvailable,
    showCycleStartField: !terminology.anchorMode.isInducedOvulator,
    showUpgradeButton: (
      terminology.anchorMode.supportsUpgrade &&
      plan.primaryAnchor === 'CYCLE_START' &&
      !plan.ovulationConfirmed
    ),
    showReconciliation: (
      plan.cycleStartObserved &&
      plan.ovulationConfirmed
    ),
    requireWeaning: terminology.weaning.required,
    showFoalingChecklist: plan.species === 'HORSE'
  }

  return (
    <DrawerLayout>
      {/* Species-aware content */}
      <OverviewTab plan={plan} terminology={terminology} features={features} />
      <DatesTab plan={plan} terminology={terminology} features={features} />
      <OffspringTab plan={plan} terminology={terminology} />

      {/* Conditional horse-specific tab */}
      {features.showFoalingChecklist && (
        <FoalingChecklistTab plan={plan} />
      )}

      {/* Universal tabs */}
      <DepositsTab plan={plan} />
      <FinancesTab plan={plan} />
      <AuditTab plan={plan} />
    </DrawerLayout>
  )
}
```

### Phase 4: Testing (Week 5)

**18 Test Scenarios: 6 Species × 3 Anchor Modes**

```typescript
describe('Species-Aware Breeding Plan Drawer', () => {
  // DOG TESTS
  test('DOG: Shows cycle start and ovulation options', () => {})
  test('DOG: Allows upgrade from cycle start to ovulation', () => {})
  test('DOG: Shows reconciliation after upgrade', () => {})

  // HORSE TESTS
  test('HORSE: Shows cycle start and ovulation options', () => {})
  test('HORSE: Generates foaling checklist from ovulation anchor', () => {})
  test('HORSE: Enforces weaning requirement', () => {})

  // CAT TESTS
  test('CAT: Shows ONLY breeding date option', () => {})
  test('CAT: Hides cycle start and ovulation fields', () => {})
  test('CAT: Does not show upgrade button', () => {})

  // RABBIT TESTS
  test('RABBIT: Shows ONLY breeding date option', () => {})
  test('RABBIT: Uses 31-day gestation', () => {})
  test('RABBIT: Shows correct kindling terminology', () => {})

  // GOAT TESTS
  test('GOAT: Shows ONLY cycle start option', () => {})
  test('GOAT: Hides ovulation field', () => {})
  test('GOAT: Uses 150-day gestation', () => {})

  // SHEEP TESTS
  test('SHEEP: Shows ONLY cycle start option', () => {})
  test('SHEEP: Hides ovulation field', () => {})
  test('SHEEP: Uses 147-day gestation', () => {})
})
```

---

## Conclusion

**This specification demonstrates:**

✅ **ONE drawer component** for ALL species (not 6 separate UIs)

✅ **THREE user experiences** based on reproductive biology:
   - Testable species (DOG, HORSE): Progressive enhancement path
   - Breeding-first species (CAT, RABBIT): Breeding date primary
   - Observation-only species (GOAT, SHEEP): Cycle start only

✅ **Species-aware presentation** via terminology normalization:
   - Same structure, different labels
   - Conditional field visibility
   - Conditional tab rendering

✅ **NO species ostracized**:
   - Dogs: Heat start terminology, progesterone guidance
   - Horses: Foaling checklist, ultrasound, weaning required
   - Cats/Rabbits: Breeding-first (no misleading cycle start)
   - Goats/Sheep: Simple cycle-start (no unnecessary testing options)

✅ **Every breeder thinks "they built this for ME!"**:
   - Biologically accurate for each species
   - Matches real-world breeding workflows
   - Educational guidance appropriate to species
   - No confusing options that don't apply

✅ **Strategic architecture** that scales:
   - Terminology-driven rendering
   - Feature flags from species metadata
   - Reusable components
   - Backward compatible

---

**Next Step:** User review and sign-off on this UI/UX specification before proceeding with implementation.

**Document Version:** 1.0
**Date:** 2026-01-17
**Author:** Claude (Anthropic)
**Purpose:** Comprehensive UI/UX specification showing exactly how ONE breeding plan drawer works across ALL 6 species
