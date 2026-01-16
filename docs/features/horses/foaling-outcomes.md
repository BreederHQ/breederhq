# Foaling Outcomes & Mare Reproductive History

**Status:** Implemented
**Version:** 1.0.0
**Date:** January 2026
**Feature Type:** Horse-specific foaling tracking and reproductive history

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works: Complete Flow](#how-it-works-complete-flow)
3. [Recording a Foaling Outcome](#recording-a-foaling-outcome)
4. [Viewing Mare Reproductive History](#viewing-mare-reproductive-history)
5. [Risk Assessment System](#risk-assessment-system)
6. [Use Cases & Scenarios](#use-cases--scenarios)
7. [Data Reference](#data-reference)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Foaling Outcomes system provides comprehensive tracking of foaling events and automatically builds a lifetime reproductive history for each mare. This gives breeders critical insights for planning future breedings, identifying high-risk mares, and making data-driven breeding decisions.

### What It Does

1. **Captures Foaling Details** - Records comprehensive outcome data after each foaling
2. **Automatic History Aggregation** - Builds lifetime statistics automatically
3. **Risk Assessment** - Calculates risk scores based on historical patterns
4. **Pattern Recognition** - Tracks foal heat timing to optimize rebreeding
5. **Professional Records** - Provides impressive data for buyers, vets, and partners

### Key Benefits

- **Zero Extra Work** - History updates automatically when outcomes are saved
- **No Manual Refresh** - Never need to click "recalculate" or "refresh" buttons
- **Auto-generation** - Opens the tab for the first time? History generates automatically
- **Self-healing** - System automatically recovers from any sync issues
- **Historical Context** - See patterns across all breedings at a glance
- **Risk Awareness** - Quickly identify problem mares before breeding
- **Breeding Planning** - Know when to expect foal heat for rebreeding
- **Professional Records** - Data-driven insights for decision making

### How It Stays Up to Date (Automatically)

You don't need to do anything to keep the data current. The system handles it automatically:

1. **When you save a foaling outcome** → History instantly recalculates
2. **When you open the tab for the first time** → History auto-generates from existing data
3. **If something goes wrong** → System auto-fixes the next time you view the tab

**You'll never see or need to click a "refresh" button.** The data is always current.

---

## How It Works: Complete Flow

### 1. Data Capture (What Triggers It)

When a breeder records a foaling outcome in the Breeding app:

1. Go to a breeding plan → **Foaling Outcome tab**
2. Fill in the form:
   - Did placenta pass? How long?
   - Mare condition (Excellent, Good, Fair, etc.)
   - Any complications?
   - Veterinarian called?
   - Foal heat date (when mare came back into heat)
   - Ready for rebreeding?
3. Click **"Save Outcome"**

### 2. Automatic Aggregation (Behind the Scenes)

```
Save Foaling Outcome
        ↓
API: POST /breeding/plans/:id/foaling-outcome
        ↓
breeding-foaling-service.ts: addFoalingOutcome()
        ↓
✓ Saves the FoalingOutcome record
        ↓
Checks: Is this a horse? Does it have a dam (mother)?
        ↓
YES → Calls updateMareReproductiveHistory()
        ↓
Service queries ALL completed breedings for this mare
        ↓
Loops through each one and calculates:
  • Total foalings
  • How many had complications
  • How many times vet was called
  • Placenta issues
  • Foal heat timing patterns (avg/min/max)
        ↓
Calculates Risk Score (0-100):
  • High complication rate? +40 points
  • Placenta problems? +30 points
  • Frequent vet calls? +30 points
        ↓
Saves/updates the MareReproductiveHistory record
```

**Key Point:** This happens automatically every time a foaling outcome is saved. No manual work needed!

### 3. Viewing the History (User Side)

Breeder goes to the **Animals app**:

1. Opens the mare's record (clicks on her in the table)
2. Sees a new tab: **"Breeding History"** (only appears for mares)
3. Clicks the tab

They see:

#### Top Section - Summary
```
🩷 Reproductive History for Painted Lady
5 lifetime foalings • Last updated from 2025 breeding
```

#### Lifetime Statistics
```
Total Foalings: 5        Live Foals: 5
Complication Rate: 20%   Survival Rate: 100%
```

#### Risk Assessment
```
Overall Risk Score: 15/100 ✅ (green = low risk)

Risk Factors:
• None identified - clean foaling history
```

If the score was 75/100 (red), they might see:
```
Risk Factors:
• High complication rate (40% of foalings)
• History of retained placenta
• Frequent veterinary interventions
```

#### Last Foaling Info
```
Foaling Date: Apr 20, 2025
Mare Condition: Excellent
Complications: None
Placenta Passed: Yes (45 min)
```

#### Foal Heat Patterns
```
Average Days: 9.2    Min: 8    Max: 11

Typical foal heat occurs 7-12 days after foaling.
This mare averages 9.2 days.
```

**This helps plan when to rebreed!**

#### Detailed History (Expandable)

Click **"Show Details"** to see every single foaling:

```
┌─────────────────────────────────────┐
│ PLN-PAINTED-2025                    │
│ Bred Feb 18, 2024 • Born Apr 20, 2025│
│ Sire: Champion Stallion             │
│ 1 of 1 live ✅                      │
│ ✓ Mare condition: Excellent         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PLN-PAINTED-2024                    │
│ Bred Mar 5, 2023 • Born May 10, 2024│
│ Sire: Another Stallion              │
│ 1 of 1 live ✅                      │
│ ⚠️ Had complications                │
│ 🩺 Veterinary assistance            │
│ Mare condition: Good                │
└─────────────────────────────────────┘
```

---

## Recording a Foaling Outcome

### Prerequisites

Before you can record a foaling outcome:
- The breeding plan must have an **actual birth date** recorded
- Navigate to: **Breeding app** → Select breeding plan → **Foaling Outcome** tab

### Form Fields

#### Critical Post-Foaling Checks

**Placenta Passed?**
- Yes/No toggle
- If Yes: Enter minutes (should pass within 3 hours / 180 minutes)
- **Clinical Note:** Retained placenta beyond 3 hours is a medical emergency

**Mare Post-Foaling Condition**
- Excellent (green)
- Good (green)
- Fair (amber)
- Poor (orange)
- Veterinary Care Required (red)

#### Complications

**Had Complications?**
- Checkbox to indicate if any issues occurred
- If checked, provide details:
  - Dystocia (difficult birth)
  - Malpresentation
  - Red bag delivery
  - Other complications

#### Veterinary Care

**Veterinarian Called?**
- Checkbox to indicate if vet assistance was needed
- If checked, provide:
  - Veterinarian name
  - Notes about treatment, observations, recommendations

#### Post-Foaling Reproductive Cycle

**Foal Heat Date**
- Date picker for when mare came back into heat
- Typically occurs 7-12 days after foaling
- Used to calculate breeding readiness patterns

**Ready for Rebreeding?**
- Yes/No toggle
- Indicates if mare is in good condition to breed again

**Rebred Date** (if ready for rebreeding)
- Date picker for when mare was rebred
- Tracks successful rebreeding on foal heat

### Saving the Outcome

Click **"Save Outcome"** or **"Update Outcome"** to:
1. Save the foaling outcome data
2. Automatically trigger mare reproductive history update
3. Return to the breeding plan view

---

## Viewing Mare Reproductive History

### Accessing the History

1. Open **Animals app**
2. Click on a mare in the animals list
3. Select the **"Breeding History"** tab

**Note:** This tab only appears for female horses (mares).

**Automatic Generation:** If this is the first time viewing the history and the mare has completed foalings, the system will automatically generate her reproductive history in the background. No manual action needed!

### What You'll See

#### Summary Header

Shows:
- Mare name with heart icon
- Total lifetime foalings count
- Last update source (breeding year)

#### Lifetime Statistics Grid

Four key metrics:
1. **Total Foalings** - Count of completed breedings
2. **Live Foals** - Number of foals born alive
3. **Complication Rate** - Percentage of foalings with complications
4. **Survival Rate** - Percentage of foals that survived

#### Risk Assessment Section

**Risk Score (0-100 scale)**

Color-coded based on score:
- **0:** Green - No risk
- **1-29:** Light green - Low risk
- **30-49:** Amber - Moderate risk
- **50-69:** Orange - Elevated risk
- **70-100:** Red - High risk

**Risk Factors List**

Displays identified issues:
- High complication rate (>30%)
- History of retained placenta
- Frequent veterinary interventions (>50% of foalings)

#### Last Foaling Information

Details from most recent foaling:
- Foaling date
- Mare post-foaling condition
- Complications status
- Placenta passed status and timing

#### Foal Heat Cycle Patterns

Critical for breeding planning:
- **Average Days** - Mean time from birth to foal heat
- **Min Days** - Earliest foal heat observed
- **Max Days** - Latest foal heat observed
- Comparison to typical range (7-12 days)

**Why This Matters:** Knowing a mare's typical foal heat timing helps you plan the optimal rebreeding window.

#### Detailed History Section

Expandable section showing all past foalings:
- Breeding plan code
- Breed and birth dates
- Sire name
- Foal count (live vs total)
- Outcome summary with icons
  - ✅ Excellent/Good condition
  - ⚠️ Complications
  - 🩺 Veterinary assistance
  - 🔴 Poor condition/retained placenta

### Empty States

**No History Yet:**
```
🐴 No foaling history recorded yet for [Mare Name].
Reproductive history will be automatically generated after
the first foaling outcome is recorded.
```

**Not a Mare:**
```
💗 Reproductive history tracking is only available for
female horses (mares).
```

---

## Risk Assessment System

### How Risk Scores Are Calculated

The system uses a weighted scoring algorithm (0-100 scale):

```javascript
let riskScore = 0;

// Complication rate (up to 40 points)
const complicationRate = totalComplicatedFoalings / totalFoalings;
riskScore += complicationRate * 40;

// Retained placenta rate (up to 30 points)
const placentaRate = totalRetainedPlacentas / totalFoalings;
riskScore += placentaRate * 30;

// Veterinary intervention frequency (up to 30 points)
riskScore += Math.min(30, totalVeterinaryInterventions * 5);

riskScore = Math.min(100, Math.round(riskScore));
```

### Risk Factor Identification

#### High Complication Rate
- **Triggered when:** >30% of foalings had complications
- **Indicates:** Mare requires closer monitoring during foaling
- **Action:** Consult vet before next breeding, prepare emergency plan

#### History of Retained Placenta
- **Triggered when:** Any instances of retained placenta (>180 min or didn't pass)
- **Indicates:** Increased risk of infection, potential fertility impact
- **Action:** Have vet on standby for next foaling, prepare antibiotic protocol

#### Frequent Veterinary Interventions
- **Triggered when:** Vet called for >50% of foalings
- **Indicates:** Mare may require specialized care or monitoring
- **Action:** Consider breeding only with vet availability guaranteed

### Risk Score Interpretation

**0-29 (Low Risk) ✅**
- Clean foaling history
- Suitable for standard breeding programs
- Normal monitoring protocols

**30-49 (Moderate Risk) ⚠️**
- Some complications in history
- Extra monitoring recommended
- Have vet contact information ready

**50-69 (Elevated Risk) ⚠️**
- Significant complication history
- Increased monitoring essential
- Vet consultation before breeding recommended

**70-100 (High Risk) 🔴**
- Serious complication history
- Breeding decision requires careful consideration
- Mandatory vet consultation
- Emergency foaling plan required

---

## Use Cases & Scenarios

### Scenario 1: Planning a New Breeding

**Situation:** Breeder is deciding whether to breed "Painted Lady" again

**Steps:**
1. Opens Painted Lady's Breeding History tab
2. Reviews data:
   - Risk Score: 15/100 ✅
   - 5 successful foalings, no complications
   - Foal heat averages 9 days

**Decision:** Safe to breed, expect foal heat ~9 days after foaling

**Action Plan:**
- Schedule breeding for standard timeline
- Plan to check for heat on day 9 post-foaling
- Standard monitoring protocols

---

### Scenario 2: High-Risk Mare Assessment

**Situation:** Breeder is considering breeding "Troubled Mare"

**Steps:**
1. Opens Troubled Mare's Breeding History tab
2. Reviews data:
   - Risk Score: 75/100 ⚠️
   - Risk factors:
     - 3 of 4 foalings had complications
     - Retained placenta twice
     - Vet called 3 times

**Decision:** High-risk breeding - requires extra precautions

**Action Plan:**
- Consult vet before breeding decision
- If proceeding:
  - Have vet on-call for foaling
  - Prepare emergency protocols
  - Consider facility with 24/7 monitoring
  - Budget for potential veterinary costs

---

### Scenario 3: Selling a Mare

**Situation:** Potential buyer asks about breeding history

**Steps:**
1. Opens mare's Breeding History tab
2. Shows buyer the data:
   - Clean record with consistent patterns
   - Professional tracking visible
   - Data-driven insights available

**Outcome:**
- Buyer gains confidence in purchase
- Professional presentation increases perceived value
- Data transparency builds trust

---

### Scenario 4: Optimizing Rebreeding Timing

**Situation:** Breeder wants to maximize breeding efficiency

**Steps:**
1. Reviews mare's foal heat patterns
2. Sees average: 9.2 days, range: 8-11 days
3. Plans monitoring schedule

**Action Plan:**
- Begin checking for heat on day 8
- Peak observation on days 9-10
- Have stallion ready by day 8
- Schedule breeding appointment for day 9-10 window

**Result:** Higher conception rate from optimal timing

---

### Scenario 5: Insurance or Registry Documentation

**Situation:** Need to provide breeding/foaling records for insurance or registry

**Steps:**
1. Access Breeding History tab
2. View detailed history section
3. Export or screenshot data

**Information Available:**
- Complete foaling timeline
- Sire information for each foaling
- Health outcomes and complications
- Veterinary intervention records
- Survival rates

---

## Data Reference

### Where Data Is Stored

Three database tables work together:

#### 1. FoalingOutcome Table
**Purpose:** Detailed outcome for each individual foaling

**Key Fields:**
- `breedingPlanId` - Links to specific breeding
- `hadComplications` - Boolean flag
- `complicationDetails` - Text description
- `veterinarianCalled` - Boolean flag
- `veterinarianName`, `veterinarianNotes`
- `placentaPassed` - Boolean
- `placentaPassedMinutes` - Integer (0-999)
- `mareCondition` - Enum (EXCELLENT, GOOD, FAIR, POOR, VETERINARY_CARE_REQUIRED)
- `postFoalingHeatDate` - Date
- `readyForRebreeding` - Boolean
- `rebredDate` - Date

#### 2. BreedingPlan Table
**Purpose:** Breeding timeline and parent information

**Relevant Fields:**
- `damId` - Mare (mother) reference
- `sireId` - Stallion (father) reference
- `breedDateActual` - When breeding occurred
- `birthDateActual` - When foaling occurred
- `species` - Must be "HORSE" for foaling outcomes

#### 3. MareReproductiveHistory Table
**Purpose:** Aggregated summary (cached statistics)

**All Fields:**
```prisma
model MareReproductiveHistory {
  id       Int    @id
  tenantId Int
  mareId   Int    @unique

  // Lifetime Statistics
  totalFoalings                Int
  totalLiveFoals               Int
  totalComplicatedFoalings     Int
  totalVeterinaryInterventions Int
  totalRetainedPlacentas       Int

  // Last Foaling Information
  lastFoalingDate           DateTime?
  lastFoalingComplications  Boolean?
  lastMareCondition         String?
  lastPlacentaPassed        Boolean?
  lastPlacentaMinutes       Int?

  // Post-Foaling Heat Patterns (averages)
  avgPostFoalingHeatDays Float?
  minPostFoalingHeatDays Int?
  maxPostFoalingHeatDays Int?

  // Breeding Readiness Tracking
  lastPostFoalingHeatDate DateTime?
  lastReadyForRebreeding  Boolean?
  lastRebredDate          DateTime?

  // Risk Assessment
  riskScore   Int      @default(0)  // 0-100
  riskFactors String[]              // Array of issues

  // Metadata
  lastUpdatedFromPlanId    Int?
  lastUpdatedFromBreedYear Int?

  createdAt DateTime
  updatedAt DateTime
}
```

### API Endpoints

#### Save Foaling Outcome
```
POST /api/v1/breeding/plans/:breedingPlanId/foaling-outcome

Body: {
  hadComplications: boolean
  complicationDetails?: string
  veterinarianCalled: boolean
  veterinarianName?: string
  veterinarianNotes?: string
  placentaPassed?: boolean
  placentaPassedMinutes?: number
  mareCondition?: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "VETERINARY_CARE_REQUIRED"
  postFoalingHeatDate?: ISO date string
  readyForRebreeding?: boolean
  rebredDate?: ISO date string
}
```

#### Get Mare Reproductive History
```
GET /api/v1/breeding/mares/:mareId/reproductive-history

Response: {
  id: number
  mareId: number
  totalFoalings: number
  totalLiveFoals: number
  totalComplicatedFoalings: number
  totalVeterinaryInterventions: number
  totalRetainedPlacentas: number
  lastFoalingDate: ISO date string
  riskScore: number (0-100)
  riskFactors: string[]
  avgPostFoalingHeatDays: number
  minPostFoalingHeatDays: number
  maxPostFoalingHeatDays: number
  // ... other fields
}
```

#### Get Detailed Foaling History
```
GET /api/v1/breeding/mares/:mareId/foaling-history

Response: [
  {
    breedingPlanId: number
    breedingPlanCode: string
    breedDate: ISO date string
    birthDate: ISO date string
    sire: { id: number, name: string }
    foalCount: number
    liveFoalCount: number
    outcome: {
      hadComplications: boolean
      veterinarianCalled: boolean
      mareCondition: string
      placentaPassed: boolean
      placentaPassedMinutes: number
      postFoalingHeatDate: ISO date string
      readyForRebreeding: boolean
      rebredDate: ISO date string
    }
  }
]
```

#### Recalculate Mare History (Internal Use)
```
POST /api/v1/breeding/mares/:mareId/reproductive-history/recalculate

Response: Same as GET reproductive-history
```

**Note:** This endpoint is primarily used internally by the system for automatic history generation. It's called automatically when:
- A user views the Breeding History tab for the first time (no history exists yet)
- Admin/debugging purposes
- Backfilling historical data during migrations

**Users do not need to call this endpoint manually** - the system handles it automatically.

---

## Troubleshooting

### History Not Updating After Saving Outcome

**Symptoms:**
- Saved foaling outcome successfully
- Mare's Breeding History tab shows old or no data

**Possible Causes:**

1. **Breeding plan is not for a horse**
   - Check: `plan.species === "HORSE"`
   - History only tracks horse breedings

2. **Breeding plan has no dam (mother) assigned**
   - Check: `plan.damId` exists
   - History requires a mare to be linked

3. **Server error during history update**
   - Check API server logs for: `[Foaling] Failed to update mare reproductive history`
   - The outcome save succeeded, but history update failed (non-blocking)

**Solutions:**
- Verify breeding plan has species="HORSE" and damId set
- Close and reopen the Breeding History tab (will auto-generate on next view)
- The system automatically retries generation when you view the tab

---

### Risk Score Seems Incorrect

**Symptoms:**
- Risk score doesn't match your expectations
- Score seems too high or too low

**Possible Causes:**

1. **Not all foaling outcomes recorded**
   - System only calculates based on recorded data
   - Missing outcomes skew the statistics

2. **Recent updates not reflected**
   - History updates automatically, but may need refresh

3. **Misunderstanding the algorithm**
   - Review the [Risk Assessment System](#risk-assessment-system) section
   - Score is weighted: complications (40), placenta (30), vet calls (30)

**Solutions:**
- Ensure all historical foalings have outcomes recorded
- Close and reopen the Breeding History tab to refresh data
- History automatically recalculates when you save new outcomes
- Review the risk scoring algorithm to verify expected calculation

---

### Breeding History Tab Not Appearing

**Symptoms:**
- Opened animal record
- "Breeding History" tab is missing

**Possible Causes:**

1. **Animal is not a horse**
   - Check: `animal.species === "HORSE"`
   - Tab only appears for horses

2. **Animal is not female**
   - Check: `animal.sex === "FEMALE"`
   - Tab only appears for mares (female horses)

3. **Browser console errors**
   - Check developer console for React errors

**Solutions:**
- Verify animal record shows species: Horse, sex: Female
- Check browser console for errors
- Refresh the page
- Clear browser cache

---

### Foal Heat Pattern Data Missing

**Symptoms:**
- Average/Min/Max foal heat days show as "—" or null
- Pattern section is empty

**Possible Causes:**

1. **No foal heat dates recorded**
   - Foal heat date is optional in outcome form
   - Without dates, patterns can't be calculated

2. **Dates outside reasonable range**
   - System filters for 1-30 days after birth
   - Dates outside this range are excluded

**Solutions:**
- Record `postFoalingHeatDate` in foaling outcomes
- Ensure dates are realistic (7-12 days is typical)
- Recalculate history after adding dates

---

### Empty History for Mare with Known Foalings

**Symptoms:**
- Mare has foaled before
- Breeding History tab shows "No foaling history recorded yet"

**Possible Causes:**

1. **No `birthDateActual` on breeding plans**
   - History only aggregates completed foalings
   - Plans must have actual birth date set

2. **No foaling outcomes recorded**
   - Birth date alone isn't enough
   - Must save foaling outcome to trigger history

3. **Different tenant/organization**
   - History is tenant-scoped
   - Can only see data from your organization

**Solutions:**
- Verify breeding plans have `birthDateActual` set
- Record foaling outcomes for each historical foaling
- Close and reopen the tab - history will auto-generate from existing data

---

## Related Documentation

- [Mare Reproductive History - Technical Documentation](./mare-reproductive-history.md)
- [Foaling Automation Specification](../../horse-breeding-mvp/05-FOALING-AUTOMATION-SPEC.md)
- [Breeding Plans Overview](../../horse-breeding-mvp/04-BREEDING-PROGRAM-MARKETPLACE-SPEC.md)

---

## Support

### Common Questions

**Q: Can I edit a foaling outcome after saving it?**
A: Yes, go back to the breeding plan's Foaling Outcome tab and update the form. Saving again will update the record and recalculate the mare's history.

**Q: What if I need to record outcomes for old foalings?**
A: Navigate to each historical breeding plan and fill out the Foaling Outcome tab. The system will automatically update the mare's history each time you save an outcome.

**Q: How does the system keep history up to date?**
A: History updates automatically in two ways:
1. When you save a foaling outcome, it immediately recalculates the mare's history
2. When you open the Breeding History tab for the first time, it auto-generates from existing data

**Q: Can I export this data?**
A: Currently, you can screenshot or manually copy the data. Export functionality may be added in future updates.

**Q: Does this work for other species?**
A: The Foaling Outcome form works for all species, but the Mare Reproductive History aggregation is horse-specific. Similar features for other species may be added based on demand.

**Q: What happens if I delete a breeding plan?**
A: If you delete a breeding plan with a foaling outcome, the outcome is also deleted (cascade delete). The mare's reproductive history will be automatically recalculated the next time you save an outcome or view her Breeding History tab.

---

**Last Updated:** January 2026
**Maintained By:** Development Team
**Version:** 1.0.0
