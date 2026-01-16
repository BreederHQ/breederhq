# Current State Inventory: What We Have for Horse Breeders

**Document Version:** 1.0
**Date:** 2026-01-14
**Purpose:** Comprehensive audit of all horse-specific features currently implemented in BreederHQ

---

## Overview

This document provides an exhaustive inventory of horse breeding capabilities currently in the BreederHQ platform. This is based on a thorough codebase exploration conducted on 2026-01-14.

**Summary:** BreederHQ has **excellent foundational data models** and core breeding operations tracking. The backend is sophisticated and competitive. The frontend and automation layers need significant work.

---

## 1. DATABASE MODELS & SCHEMAS

### Status: ✅ HORSES FULLY SUPPORTED AT DATA MODEL LEVEL

#### Core Species Support
**File:** `/breederhq-api/prisma/schema.prisma` (lines 40-47)

```prisma
enum Species {
  DOG
  CAT
  HORSE
  GOAT
  RABBIT
  SHEEP
}
```

**Assessment:** Horses are a first-class species in the system. All animal operations support horses.

---

### Horse-Specific Asset Metadata

**File:** `/breederhq-api/prisma/schema.prisma` - Animal model (lines 1902-2069)

```prisma
model Animal {
  // ... standard fields ...

  // Horse-specific financial asset tracking
  intendedUse           HorseIntendedUse?      // BREEDING, SHOW, RACING
  declaredValueCents    Int?                   // Asset valuation in cents
  declaredValueCurrency String?                // Currency code (e.g., USD, EUR)
  valuationDate         DateTime?              // When valuation was last done
  valuationSource       HorseValuationSource?  // PRIVATE_SALE, AUCTION, APPRAISAL, INSURANCE, OTHER

  // Horse ownership states
  forSale               Boolean @default(false)
  inSyndication         Boolean @default(false)  // Multiple owners
  isLeased              Boolean @default(false)
}
```

**Supporting Enums:**

```prisma
enum HorseIntendedUse {
  BREEDING
  SHOW
  RACING
}

enum HorseValuationSource {
  PRIVATE_SALE
  AUCTION
  APPRAISAL
  INSURANCE
  OTHER
}

enum OwnershipChangeKind {
  SALE
  SYNDICATION
  TRANSFER
  LEASE
  DEATH
  OTHER
}
```

**What This Enables:**
- ✅ Track horses as financial assets with declared values
- ✅ Record valuation source and date (important for insurance, taxes)
- ✅ Differentiate between breeding stock, show horses, and racing prospects
- ✅ Flag horses for sale, in syndication, or leased
- ✅ Track ownership changes with specific types (sale vs syndication vs lease)

**What's Missing:**
- ❌ No formal syndication management (just a boolean flag)
- ❌ No lease terms tracking (start date, end date, lease amount)
- ❌ No insurance policy tracking
- ❌ No automatic valuation updates based on offspring performance

---

## 2. BREEDING CYCLE TRACKING

### Status: ✅ FULLY IMPLEMENTED - SPECIES AGNOSTIC (WORKS FOR HORSES)

#### ReproductiveCycle Model

**File:** `/breederhq-api/prisma/schema.prisma` (lines 2881-2904)

```prisma
model ReproductiveCycle {
  id                  Int       @id @default(autoincrement())
  tenantId            String
  femaleId            Int       // Link to Animal (dam/mare)
  female              Animal    @relation("ReproductiveCycleFemale", fields: [femaleId], references: [id], onDelete: Cascade)

  cycleStart          DateTime  // When heat/estrous cycle started
  ovulation           DateTime? // When ovulation occurred (important for AI timing)
  dueDate             DateTime? // Expected birth/foaling date
  placementStartDate  DateTime? // When offspring can be placed/sold
  status              String?   // Current cycle status
  notes               String?   // Vet notes, observations

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

**Key Capabilities:**

1. **Heat Cycle Tracking**
   - ✅ Record when mare goes into heat (cycleStart)
   - ✅ Track ovulation timing (critical for AI timing)
   - ✅ Notes field for vet observations

2. **Pregnancy Calculation**
   - ✅ Expected due date (dueDate) - manually set or calculated
   - ✅ Placement readiness date (when foal can be sold/placed)

3. **Status Tracking**
   - ✅ Current cycle status (open, bred, pregnant, foaled, etc.)

**What This Enables:**
- ✅ Track mare heat cycles over time
- ✅ Identify optimal breeding windows
- ✅ Calculate expected foaling dates
- ✅ Historical cycle data for each mare

**What's Missing:**
- ❌ No automatic cycle prediction (based on historical 21-day cycles for mares)
- ❌ No ovulation detection algorithms (based on vet exam data)
- ❌ No automatic 11-month gestation calculation for horses
- ❌ No cycle irregularity flagging
- ❌ No integration with hormone test data

---

## 3. BREEDING PLAN & TIMELINE TRACKING

### Status: ✅ FULLY IMPLEMENTED - COMPREHENSIVE

#### BreedingPlan Model

**File:** `/breederhq-api/prisma/schema.prisma` (lines 2783-2879)

```prisma
model BreedingPlan {
  id                              Int       @id @default(autoincrement())
  tenantId                        String
  programId                       Int?      // Link to BreedingProgram

  // Breeding pair
  femaleId                        Int       // Dam/mare
  maleId                          Int?      // Sire/stallion (can be external)
  externalMaleName                String?   // If using outside stallion

  // Expected timeline (projected dates)
  expectedCycleStart              DateTime?
  expectedHormoneTestingStart     DateTime?
  expectedBreedDate               DateTime?
  expectedBirthDate               DateTime? // Expected foaling date
  expectedWeaned                  DateTime?
  expectedPlacementStart          DateTime?
  expectedPlacementCompleted      DateTime?

  // Actual timeline (what really happened)
  cycleStartDateActual            DateTime?
  hormoneTestingStartDateActual   DateTime?
  breedDateActual                 DateTime? // When mare was actually bred
  birthDateActual                 DateTime? // Actual foaling date
  weanedDateActual                DateTime?
  placementStartDateActual        DateTime?
  placementCompletedDateActual    DateTime?

  // Status tracking
  status                          BreedingPlanStatus

  // Additional metadata
  notes                           String?
  createdAt                       DateTime  @default(now())
  updatedAt                       DateTime  @updatedAt
}
```

**Status Enum:**

```prisma
enum BreedingPlanStatus {
  PLANNING              // Just planning the breeding
  COMMITTED             // Committed to breed this mare
  CYCLE_EXPECTED        // Waiting for heat cycle
  HORMONE_TESTING       // Testing progesterone/LH levels
  BRED                  // Mare has been bred
  PREGNANT              // Pregnancy confirmed
  BIRTHED               // Foal has been born
  WEANED                // Foal has been weaned
  PLACEMENT             // Foal ready for placement/sale
  COMPLETE              // Breeding plan complete
  CANCELED              // Plan canceled
}
```

**Key Capabilities:**

1. **Complete Timeline Tracking**
   - ✅ Expected dates for every stage of breeding cycle
   - ✅ Actual dates for every stage (compare expected vs reality)
   - ✅ 11 distinct stages from planning through placement

2. **Breeding Pair Management**
   - ✅ Link to owned stallions (maleId)
   - ✅ Support for external stallions (externalMaleName)
   - ✅ Complete pedigree tracking

3. **Status Workflow**
   - ✅ Clear status progression through breeding cycle
   - ✅ Differentiates planning vs committed vs actual stages

**What This Enables:**
- ✅ Track entire breeding lifecycle from planning to foal placement
- ✅ Compare expected vs actual timelines (learn from experience)
- ✅ Manage multiple breeding plans simultaneously
- ✅ Historical record of all breedings

**What's Missing:**
- ❌ No automatic timeline calculation (expected dates must be manually set)
- ❌ No status-based reminders (when to test hormones, when to check pregnancy)
- ❌ No automatic status progression (must manually update)
- ❌ No integration with calendar/scheduling
- ❌ No notifications when expected dates approach

---

## 4. PREGNANCY TRACKING & CONFIRMATION

### Status: ✅ FULLY IMPLEMENTED - SOPHISTICATED

#### PregnancyCheck Model

**File:** `/breederhq-api/prisma/schema.prisma` (lines 3026-3046)

```prisma
model PregnancyCheck {
  id          Int                     @id @default(autoincrement())
  tenantId    String
  planId      Int                     // Link to BreedingPlan
  plan        BreedingPlan            @relation(fields: [planId], references: [id], onDelete: Cascade)

  method      PregnancyCheckMethod    // How was pregnancy checked?
  result      Boolean                 // Positive or negative
  checkedAt   DateTime                // When check was performed

  notes       String?                 // Vet notes, observations
  data        Json?                   // Structured data (ultrasound measurements, etc.)

  createdAt   DateTime                @default(now())
  updatedAt   DateTime                @updatedAt
}
```

**Method Enum:**

```prisma
enum PregnancyCheckMethod {
  PALPATION             // Manual rectal palpation (14+ days)
  ULTRASOUND            // Ultrasound imaging (14-60 days most common)
  RELAXIN_TEST          // Blood test for relaxin hormone (uncommon in horses)
  XRAY                  // X-ray imaging (rare, late-stage)
  OTHER
}
```

**Key Capabilities:**

1. **Multiple Check Methods**
   - ✅ Supports all standard pregnancy confirmation methods
   - ✅ Palpation (most common at 14-21 days)
   - ✅ Ultrasound (gold standard at 14-60 days)
   - ✅ Blood tests
   - ✅ X-ray (late-stage)

2. **Structured Data Storage**
   - ✅ JSON field for ultrasound measurements, images, etc.
   - ✅ Notes for vet observations
   - ✅ Timestamp for when check was performed

3. **Timeline Integration**
   - ✅ Linked to BreedingPlan
   - ✅ Multiple checks can be recorded (14 day, 30 day, 60 day checks)

**What This Enables:**
- ✅ Track multiple pregnancy checks over time
- ✅ Record method used and results
- ✅ Store ultrasound data and measurements
- ✅ Historical pregnancy confirmation record

**What's Missing:**
- ❌ No ultrasound image viewer (data field exists, no UI)
- ❌ No automatic check scheduling (should prompt at 14, 30, 60 days)
- ❌ No twin detection flagging (important for horses - twins are high risk)
- ❌ No integration with vet practice management software
- ❌ No pregnancy loss tracking (if check fails after previous positive)

---

## 5. BREEDING ATTEMPT TRACKING

### Status: ✅ FULLY IMPLEMENTED - SUPPORTS ALL BREEDING METHODS

#### BreedingAttempt Model

**File:** `/breederhq-api/prisma/schema.prisma` (lines 2994-3024)

```prisma
model BreedingAttempt {
  id                Int             @id @default(autoincrement())
  tenantId          String
  planId            Int             // Link to BreedingPlan
  plan              BreedingPlan    @relation(fields: [planId], references: [id], onDelete: Cascade)

  method            BreedingMethod  // How was mare bred?
  attemptAt         DateTime?       // When breeding occurred
  windowStart       DateTime?       // Breeding window start
  windowEnd         DateTime?       // Breeding window end

  studOwnerPartyId  Int?            // For stud services (external stallion owner)
  studOwner         Party?          @relation(...)
  semenBatchId      Int?            // For AI (semen batch tracking)

  success           Boolean?        // Did it result in pregnancy?
  notes             String?         // Details about the breeding

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
}
```

**Method Enum:**

```prisma
enum BreedingMethod {
  NATURAL           // Live cover (natural breeding)
  AI_TCI            // Artificial insemination - transcervical (most common)
  AI_SI             // Artificial insemination - surgical implantation (rare)
  AI_FROZEN         // Artificial insemination - frozen semen (common for shipped semen)
}
```

**Key Capabilities:**

1. **Multiple Breeding Methods**
   - ✅ Natural breeding (live cover)
   - ✅ AI with fresh semen (TCI - transcervical insemination)
   - ✅ AI with frozen/shipped semen (FROZEN)
   - ✅ Surgical AI (rare, but supported)

2. **Breeding Window Tracking**
   - ✅ Record optimal breeding window (based on ovulation)
   - ✅ Track when breeding actually occurred
   - ✅ Multiple attempts can be recorded per cycle

3. **Stud Service Management**
   - ✅ Link to stallion owner (for stud fees)
   - ✅ Semen batch tracking (important for frozen semen)
   - ✅ Success tracking (did it result in pregnancy?)

**What This Enables:**
- ✅ Track all breeding attempts per cycle
- ✅ Record breeding method used
- ✅ Manage stud service relationships
- ✅ Analyze success rates by method/stallion
- ✅ Track semen batch usage (important for frozen semen inventory)

**What's Missing:**
- ❌ No stud fee calculation/invoicing automation
- ❌ No semen inventory management (frozen semen doses available)
- ❌ No breeding contract generation
- ❌ No automatic success rate analytics (which stallions/methods work best)
- ❌ No integration with stallion breeding calendars

---

## 6. PEDIGREE & BLOODLINE TRACKING

### Status: ✅ FULLY IMPLEMENTED - COMPETITIVE WITH HORSETELEX

#### Direct Parent References

**File:** `/breederhq-api/prisma/schema.prisma` - Animal model (lines 1902-2069)

```prisma
model Animal {
  // Direct parent references
  damId              Int?
  dam                Animal?  @relation("AnimalDam", fields: [damId], references: [id], onDelete: SetNull)

  sireId             Int?
  sire               Animal?  @relation("AnimalSire", fields: [sireId], references: [id], onDelete: SetNull)

  // Reverse relations (children of this animal)
  childrenAsDam      Animal[] @relation("AnimalDam")
  childrenAsSire     Animal[] @relation("AnimalSire")

  // Inbreeding coefficient tracking
  coiPercent         Float?   // 0.0 to 1.0 (coefficient of inbreeding)
  coiGenerations     Int?     // How many generations were analyzed
  coiCalculatedAt    DateTime?// When COI was last calculated

  // Cross-breeder pedigree sharing
  exchangeCode       String?  // Shareable code for quick linking
}
```

**Key Capabilities:**

1. **Pedigree Tree**
   - ✅ Dam (mother) tracking
   - ✅ Sire (father) tracking
   - ✅ Recursive parent relationships (can traverse unlimited generations)
   - ✅ Children tracking (reverse relations)

2. **Coefficient of Inbreeding (COI)**
   - ✅ Automatic COI calculation
   - ✅ Configurable generation depth
   - ✅ Cached calculation (coiCalculatedAt timestamp)
   - ✅ **This is what HorseTelex charges for** - we have it built in!

3. **Cross-Tenant Pedigree Sharing**
   - ✅ Exchange codes for linking animals across breeders
   - ✅ Shared pedigree verification

---

#### Cross-Tenant Pedigree System

**File:** `/breederhq-api/prisma/schema.prisma` (lines 5534-6059)

```prisma
model AnimalIdentityLink {
  id                      Int                    @id @default(autoincrement())
  tenantId                String
  animalId                Int                    // Local animal in this tenant
  animal                  Animal                 @relation(...)
  globalIdentityId        Int                    // Global cross-tenant identity
  globalIdentity          AnimalGlobalIdentity   @relation(...)

  // Link metadata
  linkType                IdentityLinkType       // CLAIMED, VERIFIED, IMPORTED
  linkedAt                DateTime               @default(now())
  verifiedBy              String?                // Who verified this link
  verifiedAt              DateTime?
}

model AnimalGlobalIdentity {
  id                      Int       @id @default(autoincrement())
  species                 Species

  // Global pedigree (shared across tenants)
  damId                   Int?
  dam                     AnimalGlobalIdentity? @relation("GlobalDam", ...)
  sireId                  Int?
  sire                    AnimalGlobalIdentity? @relation("GlobalSire", ...)

  // Shared pedigree metadata
  name                    String?
  breed                   String?
  registrationNumber      String?   // Breed registry number
  dateOfBirth             DateTime?

  // Privacy settings
  visibilityLevel         VisibilityLevel       // PUBLIC, LINEAGE_ONLY, PRIVATE

  links                   AnimalIdentityLink[]  // Links to tenant animals
}

model AnimalGlobalIdentityLinkRequest {
  id                      Int       @id @default(autoincrement())
  requestorTenantId       String
  requestorAnimalId       Int
  targetGlobalIdentityId  Int

  purpose                 String?   // "pedigree_research", "coi_calculation", "breeding_decision"
  requestedVisibility     VisibilityLevel
  status                  String    // PENDING, APPROVED, REJECTED

  requestedAt             DateTime  @default(now())
  respondedAt             DateTime?
  response                String?   // Reason for approval/rejection
}
```

**Visibility Levels:**

```prisma
enum VisibilityLevel {
  FULL_DETAILS          // Share all data (name, DOB, health, etc.)
  LINEAGE_ONLY          // Share pedigree only (for COI calculation)
  PRIVATE               // No sharing
}
```

**Key Capabilities:**

1. **Cross-Breeder Pedigree Verification**
   - ✅ Link animals across different breeders' accounts
   - ✅ Verify pedigree accuracy collaboratively
   - ✅ Shared global identity for famous stallions/mares

2. **Privacy-Controlled Sharing**
   - ✅ Control what data is shared (full details vs pedigree only)
   - ✅ Request access to another breeder's animal for pedigree research
   - ✅ Approve/reject link requests

3. **COI Calculation Across Tenants**
   - ✅ Calculate inbreeding coefficient even if parents owned by other breeders
   - ✅ Share lineage data for breeding decisions
   - ✅ Build industry-wide pedigree database

**What This Enables:**
- ✅ Breeder A can link their mare to famous stallion owned by Breeder B
- ✅ Calculate COI even when parents aren't in your database
- ✅ Verify pedigree accuracy collaboratively
- ✅ Build network effects (more breeders = better pedigree data)

**What's Missing:**
- ❌ No automatic registry lookup (must manually create global identities)
- ❌ No breed registry integration (AQHA, Jockey Club) to auto-verify
- ❌ No "famous horse" database pre-populated
- ❌ No pedigree visualization UI (family tree display)
- ❌ No lineage search (find all descendants of stallion X)

---

#### Lineage Service (Backend)

**File:** `/breederhq-api/src/services/lineage-service.ts`

**Key Functions:**

1. **COI Calculation Algorithm**
   - ✅ Recursive pedigree traversal
   - ✅ Configurable generation depth (5, 10, 15 generations)
   - ✅ Identifies common ancestors
   - ✅ Calculates inbreeding coefficient (0.0 to 1.0)

2. **Pedigree Tree Generation**
   - ✅ Build family tree data structure
   - ✅ Traverse unlimited generations
   - ✅ Handle missing parent data gracefully

3. **Lineage Analysis**
   - ✅ Find common ancestors between two animals
   - ✅ Calculate relationship degree
   - ✅ Identify line-breeding patterns

**What This Enables:**
- ✅ Automatic inbreeding analysis (crucial for breeding decisions)
- ✅ Compare different breeding pairings
- ✅ Identify line-breeding vs out-crossing strategies
- ✅ **Competitive with HorseTelex virtual mating tools**

**What's Missing:**
- ❌ No UI for visualizing pedigree trees
- ❌ No "virtual mating" comparison tool (compare COI for different pairings)
- ❌ No breed-specific recommendations (some breeds tolerate higher COI)
- ❌ No performance data integration (outcomes from different bloodlines)

---

## 7. HEALTH RECORDS

### Status: ✅ FULLY IMPLEMENTED - COMPETITIVE OR BETTER

#### Vaccination Records

**File:** `/breederhq-api/prisma/schema.prisma` (lines 2484-2511)

```prisma
model VaccinationRecord {
  id                  Int       @id @default(autoincrement())
  tenantId            String
  animalId            Int
  animal              Animal    @relation(...)

  protocolKey         String    // "rabies", "tetanus", "EWT", "influenza", "rhino", etc.
  administeredAt      DateTime  // When vaccine was given
  expiresAt           DateTime? // Calculated or manual override

  veterinarian        String?   // Vet who administered
  clinic              String?   // Clinic name
  batchLotNumber      String?   // Vaccine batch (for recalls)

  notes               String?
  documentId          Int?      // Link to certificate PDF
  document            Document? @relation(...)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

**API Implementation:**
**File:** `/breederhq-api/src/routes/animal-vaccinations.ts` (18KB implementation)

**Key Capabilities:**

1. **Protocol-Based Vaccination Tracking**
   - ✅ Standardized vaccine names (protocolKey)
   - ✅ Common horse vaccines supported:
     - Tetanus
     - Eastern/Western/Venezuelan Encephalomyelitis (EWT)
     - West Nile Virus
     - Rabies
     - Influenza
     - Rhinopneumonitis (Rhino)
     - Strangles
     - Potomac Horse Fever
   - ✅ Expiration date management (annual boosters, 6-month boosters)

2. **Veterinary Documentation**
   - ✅ Record which vet administered
   - ✅ Clinic name
   - ✅ Batch/lot number (important for recalls)
   - ✅ Link to certificate PDF

3. **Expiration Management**
   - ✅ Automatic expiration calculation based on vaccine type
   - ✅ Manual override for custom schedules

**What This Enables:**
- ✅ Track complete vaccination history per horse
- ✅ Know when boosters are due
- ✅ Compliance for shows/competitions (health certificates)
- ✅ Recall tracking (if batch is defective)

**What's Missing:**
- ❌ No automatic reminders when vaccines expire
- ❌ No breed-specific protocol recommendations
- ❌ No integration with vet practice management software
- ❌ No automatic health certificate generation for shows

---

#### Health Events

**File:** `/breederhq-api/prisma/schema.prisma` (lines 4523-4552)

```prisma
model HealthEvent {
  id                  Int         @id @default(autoincrement())
  tenantId            String
  offspringId         Int         // Link to Animal
  offspring           Offspring   @relation(...)

  kind                HealthType  // vaccine, vet_visit, health_certificate, injury, illness, etc.
  occurredAt          DateTime    // When event occurred

  // Health metrics
  weightGrams         Int?        // Weight at this event

  // Vaccination details
  vaccineCode         String?
  dose                String?

  // Veterinary details
  vetClinic           String?
  result              String?     // Test result, diagnosis, etc.

  notes               String?
  recordedByUserId    String?

  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}
```

**Health Types:**

```prisma
enum HealthType {
  vaccine
  vet_visit
  health_certificate
  weight_check
  deworming
  injury
  illness
  surgery
  dental
  farrier
  other
}
```

**Key Capabilities:**

1. **Comprehensive Health Timeline**
   - ✅ All health events in chronological order
   - ✅ Vaccinations
   - ✅ Vet visits
   - ✅ Injuries/illnesses
   - ✅ Surgeries
   - ✅ Dental work
   - ✅ Farrier work (hoof care)

2. **Weight Tracking**
   - ✅ Record weight at each health event
   - ✅ Track growth curves for foals
   - ✅ Monitor weight loss/gain (health indicator)

3. **Veterinary Documentation**
   - ✅ Clinic name
   - ✅ Test results
   - ✅ Diagnosis notes
   - ✅ Who recorded the event

**What This Enables:**
- ✅ Complete health history per horse
- ✅ Identify health patterns (repeated colic, chronic issues)
- ✅ Weight growth tracking for foals
- ✅ Vet visit history

**What's Missing:**
- ❌ No health pattern detection (repeated issues)
- ❌ No automatic health risk scoring
- ❌ No integration with wearable health monitors
- ❌ No medication tracking (prescriptions, dosages)
- ❌ No treatment plan management (multi-day medication schedules)

---

#### Test Results

**File:** `/breederhq-api/prisma/schema.prisma` (lines 2959-2992)

```prisma
model TestResult {
  id                  Int       @id @default(autoincrement())
  tenantId            String
  animalId            Int?      // Link to Animal
  animal              Animal?   @relation(...)
  planId              Int?      // Link to BreedingPlan (for breeding-related tests)
  plan                BreedingPlan? @relation(...)

  kind                String    // "genetic", "blood", "hormone", "disease", etc.
  method              String?   // Test methodology
  labName             String?   // Laboratory that ran test

  // Numeric results
  valueNumber         Float?
  units               String?
  referenceRange      String?   // Normal range for comparison

  // Text results
  valueText           String?   // For non-numeric results (e.g., "positive", "negative")

  // Timing
  collectedAt         DateTime  // When sample was collected
  resultAt            DateTime? // When results came back

  notes               String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

**Key Capabilities:**

1. **Genetic Testing**
   - ✅ Store genetic test results
   - ✅ Link to laboratory
   - ✅ Numeric or text results

2. **Blood Work**
   - ✅ Complete blood count (CBC)
   - ✅ Chemistry panels
   - ✅ Reference ranges for comparison

3. **Hormone Testing**
   - ✅ Progesterone levels (pregnancy detection)
   - ✅ LH surge detection (ovulation timing)
   - ✅ Timeline tracking (collected vs result dates)

4. **Disease Testing**
   - ✅ Coggins test (EIA - required for transport)
   - ✅ Strangles testing
   - ✅ Other disease panels

**What This Enables:**
- ✅ Complete test history per horse
- ✅ Track hormone levels for breeding timing
- ✅ Genetic test results (coat color, diseases)
- ✅ Blood work trends over time

**What's Missing:**
- ❌ No automatic test scheduling (annual Coggins, etc.)
- ❌ No integration with lab results (manual entry required)
- ❌ No test result visualization (charts, trends)
- ❌ No breed-specific health testing recommendations
- ❌ No automatic health certificate generation (for shows/transport)

---

#### Horse-Specific Genetic Markers

**File:** `/breederhq/apps/animals/src/App-Animals.tsx`

```typescript
const horses: GeneticMarkers = [
  // Coat color genes
  {
    locus: "A",
    locusName: "Agouti",
    description: "Black pigment distribution on bay horses"
  },
  {
    locus: "E",
    locusName: "Extension",
    description: "Red vs black pigment production"
  },
  {
    locus: "G",
    locusName: "Gray",
    description: "Progressive graying with age"
  },
  {
    locus: "CR",
    locusName: "Cream",
    description: "Dilutes red pigment (palomino, buckskin)"
  },
  {
    locus: "TO",
    locusName: "Tobiano",
    description: "White spotting pattern"
  },

  // Health/disease genes
  {
    locus: "HYPP",
    locusName: "Hyperkalemic Periodic Paralysis",
    breedSpecific: "Quarter Horse",
    description: "Muscle disorder causing tremors/weakness"
  },
  {
    locus: "GBED",
    locusName: "Glycogen Branching Enzyme Deficiency",
    breedSpecific: "Quarter Horse",
    description: "Fatal metabolic disorder"
  },
  {
    locus: "HERDA",
    locusName: "Hereditary Equine Regional Dermal Asthenia",
    breedSpecific: "Quarter Horse",
    description: "Skin fragility disorder"
  },
  {
    locus: "MH",
    locusName: "Malignant Hyperthermia",
    breedSpecific: "Quarter Horse",
    description: "Life-threatening reaction to anesthesia"
  },
  {
    locus: "PSSM1",
    locusName: "Polysaccharide Storage Myopathy",
    breedSpecific: "Quarter Horse, Draft breeds",
    description: "Muscle disorder affecting energy metabolism"
  },
  {
    locus: "FrDwarf",
    locusName: "Dwarfism (Friesian)",
    breedSpecific: "Friesian",
    description: "Skeletal development disorder"
  },
  {
    locus: "WFFS",
    locusName: "Warmblood Fragile Foal Syndrome",
    breedSpecific: "Warmblood breeds",
    description: "Connective tissue disorder, always fatal"
  },
  // ... more genetic markers
]
```

**What This Enables:**
- ✅ Track coat color genetics
- ✅ Track disease carrier status
- ✅ Breed-specific health markers
- ✅ Breeding decision support (avoid HYPP N/H x N/H crosses)

**What's Missing:**
- ❌ No genetic test lab integration (must manually enter results)
- ❌ No automatic breeding risk warnings (don't breed two WFFS carriers)
- ❌ No coat color prediction calculator
- ❌ No genetic diversity scoring

---

## 8. SALES & MARKETPLACE

### Status: ⚠️ PARTIALLY IMPLEMENTED - MAJOR UI GAP

#### BreedingProgram Model (Marketplace Foundation)

**File:** `/breederhq-api/prisma/schema.prisma` (lines 2709-2755)

```prisma
model BreedingProgram {
  id                      Int       @id @default(autoincrement())
  tenantId                String

  // Identity
  slug                    String    // URL-friendly identifier
  name                    String    // "Thoroughbred Racing Program"
  description             String?   // Short description
  programStory            String?   // Extended narrative (rich text)

  // Categorization
  species                 Species
  breedText               String?   // "Thoroughbred", "Quarter Horse", etc.

  // Marketplace settings
  listed                  Boolean   @default(false)  // Published to marketplace?
  acceptInquiries         Boolean                    // Accept buyer inquiries?
  openWaitlist            Boolean                    // Open for waitlist signups?
  acceptReservations      Boolean                    // Accept deposits?
  comingSoon              Boolean                    // "Coming soon" badge?

  // Pricing (PARTIAL - needs improvement)
  pricingTiers            Json?     // Array of pricing options
  whatsIncluded           String?   // What buyer gets
  typicalWaitTime         String?   // "6-12 months"

  // Media
  coverImageUrl           String?
  showCoverImage          Boolean
  media                   BreedingProgramMedia[]

  // Relationships
  breedingPlans           BreedingPlan[]

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
}

model BreedingProgramMedia {
  id                      Int       @id @default(autoincrement())
  programId               Int
  program                 BreedingProgram @relation(...)

  assetUrl                String    // URL to image/video
  caption                 String?
  sortOrder               Int       // Display order
  isPublic                Boolean   // Show on public page?

  createdAt               DateTime  @default(now())
}
```

**Key Capabilities:**

1. **Program Showcase (Backend)**
   - ✅ Rich program story (why buy from this breeder?)
   - ✅ Media gallery (photos, videos)
   - ✅ Pricing tiers (different quality levels)
   - ✅ What's included (health guarantee, training, etc.)
   - ✅ Waitlist management flags

2. **Marketplace Controls**
   - ✅ Listed flag (publish/unpublish)
   - ✅ Accept inquiries toggle
   - ✅ Waitlist open/closed
   - ✅ Reservations acceptance
   - ✅ "Coming soon" marketing

3. **Media Management**
   - ✅ Multiple photos/videos per program
   - ✅ Caption support
   - ✅ Sort order control
   - ✅ Public/private toggle

**What This Enables (IF UI EXISTED):**
- ✅ Professional breeding program showcase pages
- ✅ Buyer waitlist management
- ✅ Deposit/reservation system
- ✅ Multi-tier pricing (different quality levels)
- ✅ Rich storytelling (why buy from us?)

**What's Missing:**
- 🔴 **NO FRONTEND UI FOR ANY OF THIS** (Backend is ~100%, Frontend is ~10%)
- ❌ No public breeding program pages (programStory not displayed)
- ❌ No media gallery viewer
- ❌ No pricing tier display
- ❌ No waitlist signup form
- ❌ No inquiry/contact form
- ❌ No reservation deposit flow
- ❌ No breeder profile pages

**Reference:** See `/breederhq/docs/marketplace/breeding-program-marketplace-capabilities.md` for full gap analysis

---

#### Offspring Sales Tracking

**File:** `/breederhq-api/prisma/schema.prisma` (lines 3054-3139, 3172-3267)

```prisma
model OffspringGroup {
  id                      Int       @id @default(autoincrement())
  tenantId                String
  planId                  Int
  plan                    BreedingPlan @relation(...)

  // Sales info
  priceCents              Int?      // Sale price in cents
  depositCents            Int?      // Deposit amount
  depositReceivedAt       DateTime?

  buyerPartyId            Int?      // Link to buyer
  buyer                   Party?    @relation(...)

  contractSignedAt        DateTime?
  placedAt                DateTime? // When ownership transferred

  // Marketplace
  marketplaceListed       Boolean   @default(false)

  notes                   String?
}

model Animal {
  // ... (see above for full model)

  // Sales tracking (for individual animals)
  forSale                 Boolean   @default(false)
  priceCents              Int?
  depositCents            Int?
}
```

**Key Capabilities:**

1. **Basic Sales Tracking**
   - ✅ Sale price tracking (in cents for precision)
   - ✅ Deposit tracking
   - ✅ Buyer assignment (link to Party/contact)
   - ✅ Contract signing date
   - ✅ Placement date (when horse delivered)

2. **Marketplace Listing**
   - ✅ Flag for marketplace visibility
   - ✅ Individual animal or group sales

3. **Financial Integration**
   - ✅ Links to invoice/payment system
   - ✅ Deposit and final payment tracking

**What This Enables:**
- ✅ Track which horses sold for how much
- ✅ Record buyer information
- ✅ Contract and placement dates
- ✅ Basic marketplace listings

**What's Missing:**
- ❌ No buyer CRM (deal stages, communications)
- ❌ No inquiry management (interested buyers)
- ❌ No buyer qualification scoring
- ❌ No viewing/vetting coordination
- ❌ No professional horse sales pages (photos, videos, pedigree display)
- ❌ No automated follow-up sequences
- ❌ No post-sale success tracking

---

#### Marketplace Database Architecture

**Status:** Dual-database system (tenant + marketplace)

**Marketplace-Specific Routes:**
- `/breederhq-api/src/routes/breeder-services.ts` - Service listings
- `/breederhq-api/src/routes/marketplace-transactions.ts` - Transaction handling
- `/breederhq-api/src/routes/marketplace-providers.ts` - Provider management

**Key Capabilities:**

1. **Service Marketplace**
   - ✅ Boarding services
   - ✅ Training services
   - ✅ Breeding services
   - ✅ Provider profiles

2. **Transaction Management**
   - ✅ Payment processing
   - ✅ Booking system
   - ✅ Service delivery tracking

**What's Missing:**
- ❌ Horse-specific marketplace UI (designed for services, not horse sales)
- ❌ Horse listing templates (pedigree, photos, videos, health records)
- ❌ Buyer search/filter (by breed, price, age, discipline)
- ❌ Featured listings / promotion system
- ❌ Buyer reviews/ratings

---

## 9. OWNERSHIP & ASSET MANAGEMENT

### Status: ⚠️ PARTIAL - TRACKING EXISTS, MANAGEMENT MISSING

#### Ownership Change Tracking

**File:** `/breederhq-api/prisma/schema.prisma`

```prisma
model AnimalOwnershipChange {
  id                      Int                   @id @default(autoincrement())
  tenantId                String
  animalId                Int
  animal                  Animal                @relation(...)

  kind                    OwnershipChangeKind   // SALE, SYNDICATION, TRANSFER, LEASE, DEATH
  changedAt               DateTime

  previousOwnerPartyId    Int?
  previousOwner           Party?                @relation("PreviousOwner", ...)
  newOwnerPartyId         Int?
  newOwner                Party?                @relation("NewOwner", ...)

  valueCents              Int?                  // Transaction value
  notes                   String?

  createdAt               DateTime              @default(now())
}
```

**Key Capabilities:**

1. **Ownership History**
   - ✅ Complete ownership chain
   - ✅ Sale, syndication, transfer, lease, death tracking
   - ✅ Previous and new owner records
   - ✅ Transaction values

2. **Asset Valuation**
   - ✅ Declared value tracking (Animal.declaredValueCents)
   - ✅ Valuation source (auction, appraisal, insurance)
   - ✅ Valuation date

3. **Ownership States**
   - ✅ For sale flag
   - ✅ In syndication flag
   - ✅ Is leased flag

**What This Enables:**
- ✅ Track complete ownership history
- ✅ Record sale values for tax/accounting
- ✅ Syndication tracking (boolean)
- ✅ Lease tracking (boolean)

**What's Missing:**
- ❌ No syndication management (who owns what percentage?)
- ❌ No syndicate member management
- ❌ No syndicate revenue distribution
- ❌ No lease terms (start date, end date, monthly amount)
- ❌ No lease payment tracking
- ❌ No insurance policy management
- ❌ No automatic ownership transfer workflow

---

## 10. UI COMPONENTS & FRONTEND

### Status: ⚠️ BASIC SPECIES SUPPORT - LIMITED HORSE-SPECIFIC UI

#### Animals App

**File:** `/breederhq/apps/animals/src/App-Animals.tsx`

**What Exists:**
- ✅ Horse placeholder image (HorsePlaceholder)
- ✅ Species label: "HORSE"
- ✅ Horse emoji: 🐴
- ✅ Generic animal CRUD operations (Create, Read, Update, Delete)
- ✅ Horse genetic trait definitions (coat color, health markers)

**What's Missing:**
- ❌ No horse-specific layouts (breeding timeline visualization)
- ❌ No foaling countdown widget
- ❌ No heat cycle calendar view
- ❌ No pedigree tree visualization
- ❌ No breeding plan timeline view

---

#### Portal Components

**File:** `/breederhq/apps/portal/src/icons/HorseIcon.tsx`

**What Exists:**
- ✅ Horse icon component (SVG)

**What's Missing:**
- ❌ No horse-specific dashboard widgets
- ❌ No "What needs attention today" panel
- ❌ No breeding timeline widgets
- ❌ No foaling alerts display

---

#### Marketplace Frontend

**Files:**
- `/breederhq/apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx`
- `/breederhq/apps/marketplace/src/marketplace/pages/BreedingProgramsIndexPage.tsx`

**What Exists:**
- ✅ Animal listings (including horses)
- ✅ Breeding program listings (basic list view)

**What's Missing (CRITICAL GAP):**
- ❌ No breeding program showcase pages (programStory, media gallery, pricing)
- ❌ No horse sales pages (pedigree display, photos, videos, health records)
- ❌ No buyer inquiry forms
- ❌ No waitlist signup
- ❌ No reservation/deposit flow
- ❌ No breeder profile pages

**Reference:** See `/breederhq/docs/marketplace/breeding-program-marketplace-capabilities.md`

---

## 11. BUSINESS LOGIC & CALCULATIONS

### Status: ✅ FOUNDATION COMPLETE - ADVANCED FEATURES MISSING

#### Available Business Logic:

1. **Reproductive Cycle Calculations**
   - ✅ Heat cycle tracking
   - ✅ Ovulation timing
   - ✅ Pregnancy due date management

2. **Breeding Timeline Tracking**
   - ✅ Expected vs actual date tracking (11 stages)
   - ✅ Status progression workflow

3. **Pregnancy Confirmation**
   - ✅ Multiple check methods
   - ✅ Result tracking

4. **COI (Coefficient of Inbreeding) Calculation**
   - ✅ Recursive pedigree traversal
   - ✅ Configurable generation depth
   - ✅ Inbreeding coefficient calculation
   - ✅ **Service:** `/breederhq-api/src/services/lineage-service.ts`

5. **Pedigree Tree Generation**
   - ✅ Family tree data structure
   - ✅ Unlimited generation traversal
   - ✅ Common ancestor identification

6. **Vaccination Protocol Management**
   - ✅ Protocol-based tracking
   - ✅ Expiration date management
   - ✅ **API:** `/breederhq-api/src/routes/animal-vaccinations.ts`

---

#### Missing Business Logic (OPPORTUNITIES):

1. **Foaling Automation** ❌
   - No 11-month gestation calculator (horses have 11-month pregnancies)
   - No foaling date confidence ranges (320-370 days)
   - No foaling readiness scoring (based on gestation, weather, mare history)
   - No foaling kit preparation reminders

2. **Breed Registry Integration** ❌
   - No AQHA (American Quarter Horse Association) API
   - No Jockey Club (Thoroughbred) API
   - No automatic pedigree verification
   - No registration certificate import

3. **Health Risk Scoring** ❌
   - No pattern detection (repeated colic, slow recovery)
   - No high-risk pregnancy alerts (age-based, history-based)
   - No "What needs attention today" algorithm

4. **Performance Tracking** ❌
   - No competition result storage (racing, showing, eventing)
   - No conformation scoring
   - No temperament ratings
   - No soundness tracking
   - No ROI per mare/stallion analytics

5. **Breeding Recommendation Engine** ❌
   - No "best bloodline" suggestions based on outcomes
   - No genetic diversity scoring
   - No breeding risk warnings (disease carrier crosses)

6. **Notification Engine** ❌
   - No alert delivery system (email, SMS, push)
   - No notification scheduling
   - No reminder logic

---

## 12. INTEGRATION POINTS

### Status: ⚠️ FRAMEWORK EXISTS - NO IMPLEMENTATIONS

#### Available Integration Hooks:

1. **Registry Integration**
   - **Model:** `AnimalRegistryIdentifier` - links animals to registries
   - **File:** `/breederhq-api/prisma/schema.prisma` (lines 2134-2149)
   - **Current Registries:** None populated (awaiting API integrations)

2. **Document Management**
   - ✅ VaccinationRecord can link to Document (certificates)
   - ✅ AnimalRegistryIdentifier supports documentation
   - ✅ File storage infrastructure exists

3. **Genetic Testing Labs**
   - **Partial:** Embark integration exists for dogs
   - **Missing:** No horse genetic testing lab integrations (UC Davis, Animal Genetics, etc.)

---

#### Missing Integrations:

1. **Breed Registry APIs** ❌
   - AQHA (American Quarter Horse Association)
   - Jockey Club (Thoroughbreds)
   - APHA (American Paint Horse Association)
   - AQHA (American Quarter Horse Association)
   - Breed-specific registries

2. **Veterinary Software** ❌
   - Coravet
   - Vet-Check
   - eVetPractice
   - (No vet practice management integrations)

3. **Genetic Testing Labs** ❌
   - UC Davis Veterinary Genetics Lab
   - Animal Genetics Inc
   - Etalon Diagnostics
   - (No automated result import)

4. **Insurance Providers** ❌
   - Markel
   - Great American
   - Broadstone
   - (No policy management or valuation sync)

5. **Performance Databases** ❌
   - Equibase (racing)
   - USEF (showing)
   - USEA (eventing)
   - (No competition result import)

---

## SUMMARY: WHAT WE HAVE

### ✅ EXCELLENT (90-100% Complete)

1. **Breeding Cycle Tracking** - Full heat cycle, ovulation, pregnancy tracking
2. **Breeding Timeline Management** - Expected vs actual dates for 11 stages
3. **Pregnancy Confirmation** - Multiple check methods, ultrasound data support
4. **Breeding Attempt Tracking** - All breeding methods (natural, AI-TCI, AI-frozen, etc.)
5. **Pedigree Tracking** - Dam, sire, children, recursive lineage
6. **COI Calculation** - Automatic inbreeding coefficient calculation
7. **Cross-Tenant Pedigree** - Collaborative pedigree verification
8. **Health Records** - Vaccinations, vet visits, test results
9. **Asset Valuation** - Declared value, valuation source, ownership changes
10. **Sales Tracking** - Price, buyer, contract, placement dates

### ⚠️ PARTIAL (40-70% Complete)

1. **Breeding Program Marketplace** - Backend 100%, Frontend ~10%
2. **Horse-Specific UI** - Basic species support, no custom layouts
3. **Genetic Markers** - Defined in code, no lab integrations
4. **Registry Integration** - Model ready, no API connections
5. **Syndication** - Boolean flag only, no formal management
6. **Leasing** - Boolean flag only, no terms tracking

### ❌ MISSING (0-20% Complete)

1. **Notification System** - Zero alerts/reminders
2. **Foaling Automation** - No gestation calculator or foaling alerts
3. **Buyer CRM** - No sales pipeline or inquiry management
4. **Performance Tracking** - No competition results
5. **Health Risk Scoring** - No pattern detection or alerts
6. **Vet Collaboration** - No vet portal or limited access
7. **Registry APIs** - No AQHA, Jockey Club, etc.
8. **Mobile Experience** - Unknown status
9. **"What Needs Attention" Dashboard** - No intelligent prioritization

---

## FILES TO REVIEW FOR IMPLEMENTATION

### Database Schema
- `/breederhq-api/prisma/schema.prisma` - Complete data model

### Backend APIs
- `/breederhq-api/src/routes/animals.ts` - Animal CRUD
- `/breederhq-api/src/routes/animal-vaccinations.ts` - Vaccination tracking
- `/breederhq-api/src/services/lineage-service.ts` - COI calculation

### Frontend
- `/breederhq/apps/animals/src/App-Animals.tsx` - Animal management UI
- `/breederhq/apps/portal/src/` - Portal components
- `/breederhq/apps/marketplace/src/` - Marketplace pages

### Documentation
- `/breederhq/docs/marketplace/breeding-program-marketplace-capabilities.md` - Marketplace gap analysis

---

**Next Steps:** See companion documents for:
- `02-COMPETITIVE-GAP-ANALYSIS.md` - How we compare to competitors
- `03-NOTIFICATION-SYSTEM-SPEC.md` - Engineering specs for alert system
- `04-BREEDING-PROGRAM-MARKETPLACE-SPEC.md` - Engineering specs for marketplace UI
- `05-FOALING-AUTOMATION-SPEC.md` - Engineering specs for foaling features
- `08-IMPLEMENTATION-ROADMAP.md` - Sprint-by-sprint development plan
