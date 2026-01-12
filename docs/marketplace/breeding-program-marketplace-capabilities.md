# Breeding Program → Marketplace: Real Capabilities Analysis

> A critical assessment of what the backend supports vs what the UI currently exposes for marketplace breeding programs.

---

## The Core Relationship (Currently Broken in UI)

```
BreedingProgram (1) ← → (N) BreedingPlan ← → (1) OffspringGroup → (N) Offspring
       ↓                         ↓                      ↓
   Marketplace              Breeding Core         Listings/Sales
   (public facing)          (internal ops)        (buyer facing)
```

### What the Backend Supports

**BreedingProgram** is designed to be the **marketing/public wrapper** around multiple **BreedingPlans**:

```prisma
model BreedingProgram {
  // Identity
  slug        String    // URL-friendly identifier
  name        String    // "Goldendoodle Program"
  description String?   // Rich program description
  species     Species
  breedText   String?   // "Goldendoodle", "F1b Bernedoodle"

  // Marketplace Settings
  listed             Boolean   // Visible in marketplace
  acceptInquiries    Boolean   // Can receive messages
  openWaitlist       Boolean   // Can join waitlist
  acceptReservations Boolean   // Can place deposits

  // Pricing & Details (RICH DATA!)
  pricingTiers    Json?     // [{tier: "Pet", priceRange: "$2,500", description: "..."}]
  whatsIncluded   String?   // "Health guarantee, microchip, vaccinations..."
  typicalWaitTime String?   // "3-6 months"

  // Media Gallery
  media BreedingProgramMedia[]  // Multiple images with captions & sort order

  // THE KEY RELATION
  breedingPlans BreedingPlan[]  // All breeding plans for this program
}
```

**BreedingPlan** contains the ACTUAL operational data:

```prisma
model BreedingPlan {
  // Links to marketing
  programId Int?
  program   BreedingProgram?

  // THE PARENTS
  damId  Int?
  dam    Animal?  // Dam with photos, breed, health records, pedigree
  sireId Int?
  sire   Animal?  // Sire with photos, breed, health records, pedigree

  // TIMELINE (critical for "coming soon" / "expected" displays)
  expectedCycleStart          DateTime?
  expectedHormoneTestingStart DateTime?
  expectedBreedDate           DateTime?
  expectedBirthDate           DateTime?   // ← KEY for marketplace "Coming Soon"
  expectedWeaned              DateTime?
  expectedPlacementStart      DateTime?
  expectedPlacementCompleted  DateTime?

  // ACTUAL DATES
  cycleStartDateActual          DateTime?
  hormoneTestingStartDateActual DateTime?
  breedDateActual               DateTime?
  birthDateActual               DateTime?
  weanedDateActual              DateTime?
  placementStartDateActual      DateTime?

  // STATUS (determines what's visible)
  status BreedingPlanStatus
  // PLANNING, COMMITTED, CYCLE_EXPECTED, HORMONE_TESTING, BRED, PREGNANT, BIRTHED, WEANED, PLACEMENT, COMPLETE, CANCELED

  // FINANCIAL
  depositsCommittedCents Int?
  depositsPaidCents      Int?
  depositRiskScore       Int?

  // RESULTS
  offspringGroup OffspringGroup?  // The actual litter/foals when born
  Waitlist       WaitlistEntry[]  // People waiting for this plan
}
```

---

## Current UI State: INSUFFICIENT

### What the UI Shows (Screenshot Analysis)

The "Create Program" modal shows:
- Program Name ✓
- Description ✓ (but limited)
- Associated Breeds ✓ (but just text chips)
- Accept Inquiries ✓
- Open Waitlist ✓
- Coming Soon toggle ✓
- List in Marketplace ✓

### What's MISSING from the UI

| Feature | Backend Support | Current UI | Gap |
|---------|----------------|------------|-----|
| **Pricing Tiers** | ✅ Full JSON array | ⚠️ In settings only | Not shown on marketplace card |
| **What's Included** | ✅ Text field | ⚠️ In settings only | Not shown on marketplace card |
| **Typical Wait Time** | ✅ Text field | ⚠️ In settings only | Not shown on marketplace card |
| **Program Media Gallery** | ✅ Full support w/ captions | ❌ NOT IMPLEMENTED | Major gap |
| **Linked Breeding Plans** | ✅ Full relation | ❌ NOT SHOWN | Critical gap |
| **Upcoming Litters** | ✅ Via expectedBirthDate | ❌ NOT SHOWN | Critical gap |
| **Available Offspring** | ✅ Via OffspringGroup | ⚠️ Separate page | Not connected |
| **Dam/Sire Info** | ✅ Full Animal data | ❌ NOT SHOWN | Major gap |
| **Health Testing of Parents** | ✅ AnimalTraitValue | ❌ NOT SHOWN | Major gap |
| **Active Plans Count** | ✅ _count.breedingPlans | ⚠️ Shows count only | No details |

---

## What the Marketplace Public API Already Returns

The backend already aggregates rich data. From `public-marketplace.ts`:

### GET /programs/:slug/breeding-programs

Returns:
```typescript
{
  id: number;
  slug: string;
  name: string;
  description: string | null;
  species: string;
  breedText: string | null;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  acceptReservations: boolean;
  pricingTiers: Array<{tier, priceRange, description}>;
  whatsIncluded: string | null;
  typicalWaitTime: string | null;
  publishedAt: Date | null;
  activePlansCount: number;  // ← COUNT of active breeding plans
}
```

### What's NOT Yet Exposed (But Could Be)

1. **Upcoming Litters/Foals** - BreedingPlans with status in COMMITTED..PREGNANT and expectedBirthDate
2. **Active Litters** - BreedingPlans in BIRTHED/WEANED/PLACEMENT with offspring available
3. **Dam/Sire Gallery** - Animals linked to breeding plans with photos
4. **Health Testing Summary** - Aggregated from AnimalTraitValue
5. **Waitlist Position/Count** - WaitlistEntry counts
6. **Past Litter History** - Completed plans with outcomes

---

## The Real Enhancement Path

### Phase 1: Fix the Program → Plan Connection in UI

**Backend changes needed: MINIMAL**

The data is there. The API just needs a few enhancements:

```typescript
// New endpoint or enhance existing
GET /api/v1/public/marketplace/breeding-programs/:id/upcoming
Returns: [
  {
    planName: string;
    expectedBirthDate: Date;
    dam: { name, photoUrl, breed };
    sire: { name, photoUrl, breed };
    status: "expecting" | "born" | "available";
    availableCount?: number;
    waitlistCount?: number;
  }
]
```

**Frontend changes:**

1. **Program Card Enhancement**
   - Show "X upcoming litters" badge
   - Show pricing range from tiers
   - Show typical wait time

2. **Program Detail Page**
   - Upcoming litters timeline
   - Dam/Sire gallery with health badges
   - Pricing tier breakdown
   - What's included section
   - Join waitlist CTA with position indicator

### Phase 2: Connect Offspring Groups to Programs

Currently offspring groups are surfaced independently. They should roll up:

```
BreedingProgram
├── Upcoming (plans in COMMITTED → PREGNANT)
│   └── "Luna × Duke - Expected March 2025"
├── Available Now (plans in BIRTHED → PLACEMENT)
│   └── "Bella × Max Litter - 3 available"
└── Past Litters (plans COMPLETE)
    └── "2024 Litters - 12 placed"
```

### Phase 3: Rich Program Profiles

Add missing UI for data that ALREADY EXISTS in backend:

| Data | Backend Location | Needed UI |
|------|------------------|-----------|
| Program media | BreedingProgramMedia | Photo carousel |
| Pricing tiers | BreedingProgram.pricingTiers | Pricing table |
| What's included | BreedingProgram.whatsIncluded | Bulleted list |
| Wait time | BreedingProgram.typicalWaitTime | Badge/callout |
| Parent health | AnimalTraitValue | Health badges |
| Parent photos | Animal.photoUrl | Gallery |
| Waitlist count | WaitlistEntry.count | "X people waiting" |

---

## Current API Coverage Assessment

### Breeding Programs API (`/api/v1/breeding/programs`)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| List programs | GET | ✅ | Includes _count.breedingPlans |
| Get program | GET | ✅ | Includes media + recent plans |
| Create program | POST | ✅ | Full field support |
| Update program | PUT | ✅ | Full field support |
| Delete program | DELETE | ✅ | Blocks if plans linked |
| List media | GET | ✅ | With sort order |
| Add media | POST | ✅ | With caption |
| Update media | PUT | ✅ | |
| Delete media | DELETE | ✅ | |
| Reorder media | POST | ✅ | Bulk reorder |

### Missing API Endpoints

1. **GET /breeding/programs/:id/upcoming-litters**
   - Plans in COMMITTED-PREGNANT with expected dates
   - Include dam/sire summary
   - Include waitlist count

2. **GET /breeding/programs/:id/available-now**
   - Plans in BIRTHED-PLACEMENT
   - Include offspring group with availability
   - Include offspring details

3. **GET /breeding/programs/:id/parent-gallery**
   - Unique dams/sires from all plans
   - Include photos, health status
   - Include offspring count

4. **Public endpoint enhancement**
   - `/api/v1/public/marketplace/breeding-programs/:id` needs richer data

---

## Summary: Backend vs UI Gap Analysis

### Backend: COMPREHENSIVE (8/10)

The Prisma schema and existing routes support:
- ✅ Rich program profiles with media
- ✅ Program → Plan → OffspringGroup relationships
- ✅ Parent (dam/sire) data with health records
- ✅ Timeline data (expected dates, actual dates)
- ✅ Pricing tiers, what's included, wait times
- ✅ Waitlist management
- ⚠️ Missing: aggregated "upcoming" endpoints
- ⚠️ Missing: public parent health summary

### UI: SEVERELY LIMITED (3/10)

Current implementation shows:
- ❌ No program → plan connection visible
- ❌ No upcoming litters display
- ❌ No dam/sire gallery
- ❌ No pricing tiers on cards/detail
- ❌ No what's included display
- ❌ No wait time display
- ❌ No program media gallery
- ⚠️ Basic CRUD only in settings page
- ⚠️ Marketplace browse shows minimal data

### Priority Fixes

1. **HIGH**: Add "Upcoming Litters" to program detail page
2. **HIGH**: Show dam/sire with photos on program page
3. **HIGH**: Display pricing tiers on marketplace
4. **MEDIUM**: Add program media gallery UI
5. **MEDIUM**: Connect offspring groups to program view
6. **LOW**: Add past litter history

---

## Appendix: Full Schema References

### BreedingPlanStatus Enum
```prisma
enum BreedingPlanStatus {
  PLANNING          // Initial planning
  COMMITTED         // Confirmed, breeding scheduled
  CYCLE_EXPECTED    // Waiting for heat/cycle
  HORMONE_TESTING   // Active hormone monitoring
  BRED              // Breeding completed
  PREGNANT          // Confirmed pregnant
  BIRTHED           // Birth occurred
  WEANED            // Weaning complete
  PLACEMENT         // Go-home phase
  COMPLETE          // All placed
  CANCELED          // Canceled
}
```

### Relevant Animal Fields
```prisma
model Animal {
  name      String
  species   Species
  sex       Sex
  breed     String?
  birthDate DateTime?
  photoUrl  String?

  // Health & Genetics
  AnimalTraitValue AnimalTraitValue[]  // Health testing results

  // Breeding relationships
  breedingPlansAsDam  BreedingPlan[]
  breedingPlansAsSire BreedingPlan[]

  // Pedigree
  damId  Int?
  dam    Animal?
  sireId Int?
  sire   Animal?
  coiPercent Float?  // Coefficient of inbreeding
}
```

### WaitlistEntry Fields
```prisma
model WaitlistEntry {
  planId           Int?              // Can be for specific plan
  offspringGroupId Int?              // Or specific litter
  clientPartyId    Int?              // Who's waiting

  status           WaitlistStatus    // INQUIRY, APPROVED, DEPOSIT_PENDING, etc.
  priority         Int?
  depositRequiredCents Int?
  depositPaidCents     Int?

  // Preferences
  speciesPref Species?
  breedPrefs  Json?
  sirePrefId  Int?
  damPrefId   Int?
}
```
