# Breeding Module Data Models

## Core Database Models (Prisma)

### BreedingPlan

The primary entity for tracking breeding from planning through completion.

```prisma
model BreedingPlan {
  // Identity
  id                            Int       @id @default(autoincrement())
  tenantId                      Int
  organizationId                Int?
  programId                     Int?      // Link to BreedingProgram (marketplace)

  // Basic Info
  code                          String?   // Auto-generated: PLN-{damName}-{commitYmd}-{dueYmd}
  name                          String?
  nickname                      String?
  species                       Species
  breedText                     String?

  // Parents
  damId                         Int?      // Female animal
  sireId                        Int?      // Male animal

  // ============================================================
  // ANCHOR MODE SYSTEM (New ovulation-based tracking)
  // ============================================================
  reproAnchorMode               ReproAnchorMode?  // CYCLE_START | OVULATION | BREEDING_DATE

  // Cycle Start Tracking
  cycleStartObserved            DateTime?         // When breeder observed heat signs
  cycleStartSource              DataSource?       // OBSERVED | DERIVED | ESTIMATED
  cycleStartConfidence          ConfidenceLevel?  // HIGH | MEDIUM | LOW

  // Ovulation Tracking
  ovulationConfirmed            DateTime?         // Hormone-confirmed ovulation
  ovulationConfirmedMethod      OvulationMethod?  // How ovulation was confirmed
  ovulationConfidence           ConfidenceLevel?

  // Primary Anchor (calculated)
  primaryAnchor                 AnchorType?       // Which anchor is driving calculations

  // ============================================================
  // LOCKED DATES (Commitment anchors)
  // ============================================================
  lockedCycleStart              DateTime?
  lockedOvulationDate           DateTime?
  lockedDueDate                 DateTime?
  lockedPlacementStartDate      DateTime?

  // ============================================================
  // EXPECTED DATES (Calculated from anchor + species defaults)
  // ============================================================
  expectedCycleStart            DateTime?
  expectedHormoneTestingStart   DateTime?
  expectedBreedDate             DateTime?
  expectedBirthDate             DateTime?
  expectedWeaned                DateTime?
  expectedPlacementStart        DateTime?
  expectedPlacementCompleted    DateTime?

  // ============================================================
  // ACTUAL DATES (Recorded when events occur)
  // ============================================================
  cycleStartDateActual          DateTime?
  hormoneTestingStartDateActual DateTime?
  breedDateActual               DateTime?
  birthDateActual               DateTime?
  weanedDateActual              DateTime?
  placementStartDateActual      DateTime?
  placementCompletedDateActual  DateTime?
  completedDateActual           DateTime?

  // ============================================================
  // STATUS & LIFECYCLE
  // ============================================================
  status                        BreedingPlanStatus  @default(PLANNING)
  committedAt                   DateTime?
  committedByUserId             Int?

  // Financial
  depositsCommittedCents        Int?
  depositsPaidCents             Int?

  // Soft Delete
  archived                      Boolean   @default(false)
  deletedAt                     DateTime?

  // Timestamps
  createdAt                     DateTime  @default(now())
  updatedAt                     DateTime  @updatedAt

  // ============================================================
  // RELATIONS
  // ============================================================
  tenant                        Tenant    @relation(...)
  organization                  Organization? @relation(...)
  program                       BreedingProgram? @relation(...)
  dam                           Animal?   @relation("Dam", ...)
  sire                          Animal?   @relation("Sire", ...)

  offspringGroup                OffspringGroup?     // 1:1
  events                        BreedingPlanEvent[]
  tests                         TestResult[]
  attempts                      BreedingAttempt[]
  pregnancyChecks               PregnancyCheck[]
  milestones                    BreedingMilestone[]  // Foaling milestones
  foalingOutcome                FoalingOutcome?

  shares                        BreedingPlanShare[]
  parties                       BreedingPlanParty[]
  reservations                  BreedingPlanReservation[]
  attachments                   BreedingPlanAttachment[]
}
```

### Key Enums

```prisma
enum BreedingPlanStatus {
  PLANNING              // Initial setup, can still change dam/sire
  COMMITTED             // Locked in, breeding imminent
  CYCLE_EXPECTED        // Waiting for cycle to begin
  HORMONE_TESTING       // In hormone testing window
  BRED                  // Breeding completed
  PREGNANT              // Pregnancy confirmed
  BIRTHED               // Birth occurred
  WEANED                // Offspring weaned
  PLACEMENT             // In placement phase
  COMPLETE              // Plan fully completed
  CANCELED              // Abandoned plan
}

enum ReproAnchorMode {
  CYCLE_START           // Traditional heat observation
  OVULATION             // Hormone-tested ovulation date
  BREEDING_DATE         // For induced ovulators (cats, rabbits, camelids)
}

enum AnchorType {
  CYCLE_START
  OVULATION
  BREEDING_DATE
  BIRTH                 // Back-calculated from birth
  LOCKED_CYCLE          // Legacy locked cycle start
}

enum OvulationMethod {
  CALCULATED            // Derived from other data
  PROGESTERONE_TEST     // Blood progesterone testing
  LH_TEST               // LH surge detection
  ULTRASOUND            // Follicle monitoring
  VAGINAL_CYTOLOGY      // Cell examination
  PALPATION             // Manual examination
  AT_HOME_TEST          // Consumer ovulation kits
  VETERINARY_EXAM       // General vet confirmation
  BREEDING_INDUCED      // For induced ovulators
}

enum ConfidenceLevel {
  HIGH                  // Hormone-tested (±1-2 days accuracy)
  MEDIUM                // Observed cycle start (±2-5 days)
  LOW                   // Estimated/guessed (±5+ days)
}

enum DataSource {
  OBSERVED              // Directly observed by breeder
  DERIVED               // Calculated from other data
  ESTIMATED             // Best guess
}

enum BreedingMethod {
  NATURAL
  AI_TCI                // Transcervical insemination
  AI_SI                 // Surgical insemination
  AI_FROZEN             // Frozen semen AI
}
```

### OffspringGroup

Groups offspring from a breeding plan (1:1 relationship).

```prisma
model OffspringGroup {
  id                            Int       @id
  tenantId                      Int
  planId                        Int?      @unique  // 1:1 with BreedingPlan
  linkState                     OffspringLinkState  // linked | orphan | pending

  // Inherited from plan
  species                       Species
  damId                         Int?
  sireId                        Int?
  name                          String?

  // Counts
  countBorn                     Int?
  countLive                     Int?
  countStillborn                Int?
  countMale                     Int?
  countFemale                   Int?
  countWeaned                   Int?
  countPlaced                   Int?

  // Timeline
  expectedBirthOn               DateTime?
  actualBirthOn                 DateTime?
  weanedAt                      DateTime?
  placementStartAt              DateTime?
  placementCompletedAt          DateTime?

  // Marketplace
  listingSlug                   String?
  listingTitle                  String?
  listingDescription            String?
  marketplaceDefaultPriceCents  Int?

  // Placement Scheduling
  placementSchedulingPolicy     Json?     // Fair distribution rules

  // Relations
  Offspring                     Offspring[]
  WaitlistEntry                 WaitlistEntry[]
  OffspringGroupBuyer           OffspringGroupBuyer[]
  OffspringGroupEvent           OffspringGroupEvent[]
}

enum OffspringLinkState {
  linked                        // Connected to breeding plan
  orphan                        // No plan connection
  pending                       // Awaiting link confirmation
}
```

### Offspring

Individual offspring records with multi-dimensional state tracking.

```prisma
model Offspring {
  id                    Int       @id
  tenantId              Int
  groupId               Int

  // Basic Info
  name                  String?
  species               Species
  breed                 String?
  sex                   Sex?
  bornAt                DateTime?
  diedAt                DateTime?

  // Legacy Status
  status                OffspringStatus  // NEWBORN | ALIVE | WEANED | PLACED | DECEASED

  // ============================================================
  // MULTI-DIMENSIONAL STATE (Orthogonal tracking)
  // ============================================================
  lifeState             OffspringLifeState       // ALIVE | DECEASED
  placementState        OffspringPlacementState  // UNASSIGNED | OPTION_HOLD | RESERVED | PLACED | RETURNED | TRANSFERRED
  keeperIntent          OffspringKeeperIntent    // AVAILABLE | UNDER_EVALUATION | WITHHELD | KEEP
  financialState        OffspringFinancialState  // NONE | DEPOSIT_PENDING | DEPOSIT_PAID | PAID_IN_FULL | REFUNDED | CHARGEBACK
  paperworkState        OffspringPaperworkState  // NONE | SENT | SIGNED | COMPLETE

  // ============================================================
  // FOALING-SPECIFIC HEALTH (Horse)
  // ============================================================
  birthWeight           Decimal?
  healthStatus          FoalHealthStatus?     // HEALTHY | AT_RISK | CRITICAL | DECEASED | UNKNOWN
  healthNotes           String?
  nursingStatus         FoalNursingStatus?    // NURSING_WELL | WEAK | NOT_NURSING | BOTTLE_FED | UNKNOWN
  standingMinutes       Int?                  // Time to stand after birth
  nursingMinutes        Int?                  // Time to first nursing
  requiredVetCare       Boolean?
  vetCareDetails        String?

  // Relations
  group                 OffspringGroup @relation(...)
  animal                Animal?        // Can be promoted to full animal record
}

enum OffspringLifeState {
  ALIVE
  DECEASED
}

enum OffspringPlacementState {
  UNASSIGNED            // No buyer assigned
  OPTION_HOLD           // Buyer has first option
  RESERVED              // Buyer committed, pending pickup
  PLACED                // Gone to new home
  RETURNED              // Returned after placement
  TRANSFERRED           // Moved to different buyer
}

enum OffspringKeeperIntent {
  AVAILABLE             // For sale/placement
  UNDER_EVALUATION      // Deciding whether to keep
  WITHHELD              // Temporarily not available
  KEEP                  // Keeping in program
}

enum OffspringFinancialState {
  NONE
  DEPOSIT_PENDING
  DEPOSIT_PAID
  PAID_IN_FULL
  REFUNDED
  CHARGEBACK
}

enum OffspringPaperworkState {
  NONE
  SENT
  SIGNED
  COMPLETE
}

enum FoalHealthStatus {
  HEALTHY
  AT_RISK
  CRITICAL
  DECEASED
  UNKNOWN
}

enum FoalNursingStatus {
  NURSING_WELL
  WEAK
  NOT_NURSING
  BOTTLE_FED
  UNKNOWN
}
```

### Foaling System Models (Horse-Specific)

```prisma
enum FoalingMilestoneType {
  VET_PREGNANCY_CHECK_15D       // Day 15 pregnancy check
  VET_ULTRASOUND_45D            // Day 45 ultrasound
  VET_ULTRASOUND_90D            // Day 90 ultrasound
  BEGIN_MONITORING_300D         // Day 300 start monitoring
  PREPARE_FOALING_AREA_320D     // Day 320 prepare area
  DAILY_CHECKS_330D             // Day 330 daily checks begin
  DUE_DATE_340D                 // Day 340 due date
  OVERDUE_VET_CALL_350D         // Day 350 vet consultation
}

model BreedingMilestone {
  id                    Int       @id
  tenantId              Int
  breedingPlanId        Int

  milestoneType         FoalingMilestoneType
  scheduledDate         DateTime
  completedDate         DateTime?
  isCompleted           Boolean   @default(false)
  notes                 String?

  plan                  BreedingPlan @relation(...)
}

model FoalingOutcome {
  id                    Int       @id
  tenantId              Int
  breedingPlanId        Int       @unique

  // Complications
  hadComplications      Boolean   @default(false)
  complicationDetails   String?
  veterinarianCalled    Boolean   @default(false)
  veterinarianName      String?
  veterinarianNotes     String?

  // Placenta
  placentaPassed        Boolean?
  placentaPassedMinutes Int?

  // Mare Condition
  mareCondition         MarePostFoalingCondition?

  // Post-Foaling Heat
  postFoalingHeatDate   String?
  postFoalingHeatNotes  String?
  readyForRebreeding    Boolean   @default(false)
  rebredDate            String?

  plan                  BreedingPlan @relation(...)
}

enum MarePostFoalingCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
  VETERINARY_CARE_REQUIRED
}
```

### Event Tracking

```prisma
model BreedingPlanEvent {
  id                    Int       @id
  tenantId              Int
  breedingPlanId        Int

  type                  String    // PLAN_CREATED, PLAN_COMMITTED, ANCHOR_LOCKED, etc.
  field                 String?   // Which field changed
  before                Json?     // Previous value
  after                 Json?     // New value
  notes                 String?

  actorId               Int?      // User who made change
  occurredAt            DateTime  @default(now())

  plan                  BreedingPlan @relation(...)
}

model OffspringGroupEvent {
  id                    Int       @id
  tenantId              Int
  offspringGroupId      Int

  type                  String    // LINK, UNLINK, CHANGE, NOTE, STATUS_OVERRIDE, BUYER_MOVE
  field                 String?
  before                Json?
  after                 Json?
  notes                 String?

  actorId               Int?
  occurredAt            DateTime  @default(now())

  group                 OffspringGroup @relation(...)
}
```

## Frontend API Types

### BreedingPlanDTO

```typescript
// packages/api/src/types/breeding.ts

export type BreedingPlanDTO = {
  id: string;
  code?: string;
  name?: string;
  nickname?: string;
  species?: string;
  breedText?: string;

  female_id: string;
  male_id?: string | null;

  // Anchor mode
  reproAnchorMode?: "CYCLE_START" | "OVULATION" | "BREEDING_DATE";
  cycleStartObserved?: string | null;
  ovulationConfirmed?: string | null;
  ovulationConfirmedMethod?: string | null;
  primaryAnchor?: string;

  // Locked dates
  lockedCycle?: boolean;
  cycle_start_at?: string | null;
  ovulation_at?: string | null;
  due_date_at?: string | null;
  placement_start_at?: string | null;

  // Expected dates
  expected?: {
    cycle_start?: string;
    hormone_testing_start?: string;
    breed_date?: string;
    birth_date?: string;
    weaned?: string;
    placement_start?: string;
    placement_completed?: string;
  };

  // Actual dates
  actuals?: {
    cycle_start_on?: string | null;
    hormone_testing_start_on?: string | null;
    bred_on?: string[] | null;        // Can have multiple breeding dates
    birth_on?: string | null;
    weaned_on?: string | null;
    placement_started_on?: string | null;
    placement_completed_on?: string | null;
    completed_on?: string | null;
  };

  status?: BreedingPlanStatusDTO;
  committedAt?: string;

  // Financial
  deposits_committed_cents?: number;
  deposits_paid_cents?: number;

  // Metadata
  created_at?: string;
  updated_at?: string;
  archived?: boolean;
};

export type BreedingPlanStatusDTO =
  | "planned"
  | "active"
  | "birthed"
  | "placement"
  | "complete"
  | "canceled";
```

### UiBreedingPlan (Simplified for Gantt)

```typescript
export type UiBreedingPlan = {
  id: string;
  female_id?: string | null;
  lockedCycle?: boolean | null;
  ovulation_at?: string | null;

  expected?: {
    breeding: { start: string; end: string };
    birth: { start: string; end: string };
    goHome: { start: string; end: string };
  } | null;

  actuals?: {
    bred_on?: string[] | null;
    birth_on?: string | null;
    go_home_on?: string | null;
  } | null;

  status?: string | null;
};
```

### PlanStageWindows (Timeline Adapter Output)

```typescript
// apps/breeding/src/adapters/planWindows.ts

export type PlanStageWindows = {
  // Full uncertainty envelope
  pre_breeding_full: [ISODate, ISODate];
  hormone_testing_full: [ISODate, ISODate];
  breeding_full: [ISODate, ISODate];
  birth_full: [ISODate, ISODate];
  post_birth_care_full: [ISODate, ISODate];
  placement_normal_full: [ISODate, ISODate];
  placement_extended_full: [ISODate, ISODate];

  // Likely windows (optimistic)
  pre_breeding_likely: [ISODate, ISODate];
  hormone_testing_likely: [ISODate, ISODate];
  breeding_likely: [ISODate, ISODate];
  birth_likely: [ISODate, ISODate];
  post_birth_care_likely: [ISODate, ISODate];
  placement_normal_likely: [ISODate, ISODate];
  placement_extended_likely: [ISODate, ISODate];

  // Key milestone dates
  cycle_start: ISODate;
  ovulation: ISODate;
  ovulation_confirmed: ISODate | null;
  birth_expected: ISODate | null;
  placement_start_expected: ISODate | null;
  placement_completed_expected: ISODate | null;
  placement_extended_end_expected: ISODate | null;

  // Anchor mode metadata
  anchor_mode: ReproAnchorMode | null;
  confidence: ConfidenceLevel | null;
};
```

## API Endpoints

### Core CRUD

```
GET    /breeding/plans                    List plans (with filters)
GET    /breeding/plans/:id                Get single plan
POST   /breeding/plans                    Create plan
PATCH  /breeding/plans/:id                Update plan
DELETE /breeding/plans/:id                Soft delete

POST   /breeding/plans/:id/archive        Archive plan
POST   /breeding/plans/:id/restore        Restore archived plan
```

### Lifecycle Operations

```
POST   /breeding/plans/:id/commit         Lock plan, transition to COMMITTED
POST   /breeding/plans/:id/uncommit       Revert to PLANNING (with restrictions)
POST   /breeding/plans/:id/lock           Lock with anchor mode
POST   /breeding/plans/:id/upgrade-to-ovulation  Upgrade CYCLE_START → OVULATION
```

### Tracking & Recording

```
POST   /breeding/plans/:id/tests          Record hormone test
POST   /breeding/plans/:id/attempts       Record breeding attempt
POST   /breeding/plans/:id/pregnancy-checks  Record pregnancy check

GET    /breeding/plans/:id/events         Get event history
POST   /breeding/plans/:id/events         Add event

GET    /breeding/plans/:id/litter         Get offspring group
PUT    /breeding/plans/:id/litter         Update offspring group
```

### Foaling (Horse-specific)

```
GET    /breeding/plans/:id/foaling-timeline  Get foaling timeline
POST   /breeding/plans/:id/milestones        Create milestone
POST   /breeding/plans/:id/milestones/recalculate  Recalculate milestones
PATCH  /breeding/milestones/:id/complete     Mark milestone complete
POST   /breeding/plans/:id/foaling-outcome   Record foaling outcome
```

### Query Parameters

```typescript
type ListPlansParams = {
  status?: string;                    // Filter by status
  damId?: number;                     // Filter by dam
  sireId?: number;                    // Filter by sire
  species?: string;                   // Filter by species
  q?: string;                         // Text search
  page?: number;
  limit?: number;
  archived?: "include" | "only" | "exclude";  // Archive filter
  include?: PlanInclude | string;     // Related data to include
};

type PlanInclude =
  | "litter"
  | "reservations"
  | "events"
  | "tests"
  | "attempts"
  | "pregchecks"
  | "parties"
  | "attachments"
  | "parents"
  | "org"
  | "all";
```

