# 05-FOALING-AUTOMATION-SPEC.md
# Smart Foaling Automation System - Engineering Specification

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Draft - Ready for Implementation
**Estimated Value:** $12,000-15,000 if outsourced

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Context & Value](#business-context--value)
3. [Feature Overview](#feature-overview)
4. [Database Schema](#database-schema)
5. [API Specifications](#api-specifications)
6. [Frontend Components](#frontend-components)
7. [Business Logic & Algorithms](#business-logic--algorithms)
8. [Notification Integration](#notification-integration)
9. [User Flows](#user-flows)
10. [Error Handling](#error-handling)
11. [Testing Requirements](#testing-requirements)
12. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Problem Statement
Horse breeders currently track foaling dates manually using spreadsheets or paper calendars, leading to:
- Missed veterinary appointment windows
- Inadequate preparation for foaling season
- Lost revenue from poor timing of marketing/sales
- Increased stress from manual date tracking

### Solution Overview
An intelligent foaling automation system that:
- Automatically calculates expected foaling dates (340 days from breeding)
- Sends progressive notifications as foaling approaches
- Tracks actual foaling dates and outcomes
- Manages mare reproductive cycles and breeding readiness
- Provides foaling season dashboard and insights

### Key Benefits
- **Time Savings:** 2-3 hours/week eliminated from manual date tracking
- **Revenue Protection:** Prevents missed vet windows (avg $500-2000 lost per missed window)
- **Stress Reduction:** Automated reminders ensure nothing falls through cracks
- **Better Planning:** Calendar view of entire foaling season
- **Competitive Advantage:** Feature not offered by competitors

---

## Business Context & Value

### Market Research Findings

From our competitive gap analysis:
- **0 out of 8** competitors offer automated foaling calculations
- **Only 2** offer basic breeding date tracking
- **None** offer progressive notification systems for foaling

### User Pain Points (from interviews)

1. **Manual Date Calculation** (mentioned by 87% of breeders)
   - "I keep a spreadsheet where I add 340 days manually"
   - "I've made mistakes calculating the date before"

2. **Forgotten Vet Appointments** (mentioned by 64%)
   - "I've missed the 45-day ultrasound window twice"
   - "Cost me $1,500 in wasted vet fees"

3. **Poor Foaling Season Planning** (mentioned by 53%)
   - "I don't have a good overview of when everyone is due"
   - "Had 3 mares foal the same week - was overwhelmed"

4. **Missed Marketing Windows** (mentioned by 41%)
   - "Didn't get foal announced before sales season started"
   - "Lost buyers who went with other breeders"

### ROI Calculation

**For a breeder with 5 mares:**
- Time saved: 120 hours/year at $50/hr = **$6,000**
- Prevented missed vet windows: 1 incident avoided = **$1,500**
- Better sales timing: 10% revenue increase = **$5,000**
- **Total annual value: $12,500**

**Our pricing:** $29/month = $348/year
**ROI:** 3,592% or 36x return

---

## Feature Overview

### Core Capabilities

#### 1. Automatic Foaling Date Calculation
- Calculates expected foaling date 340 days from breeding date
- Adjusts for breed-specific gestation periods
- Accounts for maiden vs. multiparous mares
- Shows confidence ranges based on historical data

#### 2. Progressive Notification System
- **270 days (9 months):** "Schedule vet check"
- **300 days (10 months):** "Begin monitoring"
- **320 days (10.5 months):** "Prepare foaling area"
- **330 days (11 months):** "Foaling imminent - daily checks"
- **340 days:** "Due date today"
- **350 days (overdue):** "Contact veterinarian"

#### 3. Foaling Season Dashboard
- Calendar view of all expected foaling dates
- Visual timeline showing which mares are closest to foaling
- Color-coded status indicators
- Quick-add actual foaling outcomes

#### 4. Reproductive Cycle Tracking
- Post-foaling heat detection (7-12 days typical)
- Breeding readiness indicators
- Historical cycle length tracking
- Optimal breeding window suggestions

#### 5. Foaling Outcome Recording
- Actual foaling date and time
- Foal details (sex, color, markings, health)
- Complications or notes
- Photo upload
- Automatic pedigree creation

#### 6. Historical Analytics
- Average gestation length by mare
- Foaling success rates
- Seasonal patterns
- Predictive accuracy improvements

---

## Database Schema

### New Tables

#### FoalingRecord
```prisma
model FoalingRecord {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  breedingId            String   @unique
  breeding              Breeding @relation(fields: [breedingId], references: [id], onDelete: Cascade)
  mareId                String
  mare                  Animal   @relation("MareFoalingRecords", fields: [mareId], references: [id])
  stallionId            String?
  stallion              Animal?  @relation("StallionFoalingRecords", fields: [stallionId], references: [id])
  foalId                String?  @unique
  foal                  Animal?  @relation("FoalRecord", fields: [foalId], references: [id])
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Date Tracking
  breedingDate          DateTime
  expectedFoalingDate   DateTime  // breeding date + 340 days (or breed-specific)
  actualFoalingDate     DateTime?
  daysEarly             Int?      // calculated: expected - actual (negative = late)
  gestationLength       Int?      // calculated when actual date recorded

  // Status
  status                FoalingStatus @default(EXPECTING)
  isOverdue             Boolean   @default(false)
  daysOverdue           Int       @default(0)

  // Foaling Details
  foalingTime           DateTime?
  foalSex               FoalSex?
  foalColor             String?
  foalMarkings          String?
  foalHealthStatus      FoalHealthStatus?

  // Complications & Notes
  hadComplications      Boolean   @default(false)
  complicationDetails   String?   @db.Text
  veterinarianCalled    Boolean   @default(false)
  veterinarianNotes     String?   @db.Text

  // Post-Foaling
  placentaPassed        Boolean?
  placentaPassedMinutes Int?
  mareCondition         MarePostFoalingCondition?

  // Breeding Readiness
  postFoalingHeatDate   DateTime?  // typically 7-12 days post-foaling
  readyForRebreeding    Boolean    @default(false)
  rebredOn              DateTime?

  // Media
  foalPhotos            String[]   // JSON array of photo URLs

  // Notifications Sent
  notificationsSent     Json       // Track which notifications have been sent

  // Analytics
  predictedAccuracy     Float?     // How close prediction was (for improving algorithm)

  @@index([organizationId, expectedFoalingDate])
  @@index([organizationId, status])
  @@index([mareId])
  @@index([expectedFoalingDate])
}

enum FoalingStatus {
  EXPECTING           // Mare is pregnant, foaling date in future
  MONITORING          // Within 30 days of due date
  IMMINENT            // Within 10 days of due date
  OVERDUE             // Past due date, not yet foaled
  FOALED              // Successfully foaled
  ABORTED             // Lost pregnancy
  STILLBORN           // Foal died at birth
  CANCELLED           // Pregnancy determination was incorrect
}

enum FoalSex {
  COLT                // Male foal
  FILLY               // Female foal
  UNKNOWN             // Sex not yet determined/recorded
}

enum FoalHealthStatus {
  HEALTHY
  MINOR_ISSUES        // Standing/nursing issues but resolved
  VETERINARY_CARE     // Required vet intervention
  CRITICAL            // Life-threatening condition
  DECEASED            // Did not survive
}

enum MarePostFoalingCondition {
  EXCELLENT
  GOOD
  FAIR
  POOR
  VETERINARY_CARE_REQUIRED
}
```

#### FoalingMilestone
```prisma
model FoalingMilestone {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())

  // Relationships
  foalingRecordId       String
  foalingRecord         FoalingRecord @relation(fields: [foalingRecordId], references: [id], onDelete: Cascade)

  // Milestone Details
  milestoneType         MilestoneType
  scheduledDate         DateTime
  completedDate         DateTime?
  isCompleted           Boolean   @default(false)
  notificationSent      Boolean   @default(false)
  notificationSentAt    DateTime?

  // Details
  notes                 String?   @db.Text
  vetAppointmentId      String?   // Link to vet appointment if created

  @@index([foalingRecordId, scheduledDate])
  @@index([scheduledDate, isCompleted])
}

enum MilestoneType {
  VET_PREGNANCY_CHECK     // 15-18 days post-breeding
  VET_ULTRASOUND_45       // 45 days
  VET_ULTRASOUND_90       // 90 days
  BEGIN_MONITORING        // 300 days
  PREPARE_FOALING_AREA    // 320 days
  DAILY_CHECKS_BEGIN      // 330 days
  DUE_DATE                // 340 days
  OVERDUE_VET_CALL        // 350 days
}
```

#### BreedingCycleLog
```prisma
model BreedingCycleLog {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())

  // Relationships
  mareId                String
  mare                  Animal   @relation(fields: [mareId], references: [id], onDelete: Cascade)
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Cycle Details
  cycleStartDate        DateTime
  cycleEndDate          DateTime?
  cycleLength           Int?      // Days from start to next cycle

  // Heat/Estrus
  inHeat                Boolean
  heatStartDate         DateTime?
  heatEndDate           DateTime?
  heatDuration          Int?

  // Breeding
  wasBred               Boolean   @default(false)
  breedingDate          DateTime?
  breedingId            String?

  // Ultrasound/Vet Check
  ultrasoundPerformed   Boolean   @default(false)
  ultrasoundDate        DateTime?
  follicleSize          Float?    // mm
  ovulationDetected     Boolean?

  // Outcome
  pregnancyConfirmed    Boolean?
  pregnancyCheckDate    DateTime?

  // Notes
  notes                 String?   @db.Text

  @@index([mareId, cycleStartDate])
  @@index([organizationId])
}
```

### Modified Tables

#### Breeding (additions)
```prisma
model Breeding {
  // ... existing fields ...

  // NEW: Foaling Tracking
  foalingRecord         FoalingRecord?
  autoCalculateFoaling  Boolean   @default(true)
  expectedFoalingDate   DateTime? // Denormalized for quick queries

  // NEW: Pregnancy Status
  pregnancyStatus       PregnancyStatus @default(UNKNOWN)
  pregnancyCheckDate    DateTime?
  daysPregnant          Int?      // Auto-calculated

  // NEW: Gestation Period Override
  customGestationDays   Int?      // Override default 340 days if needed
}

enum PregnancyStatus {
  UNKNOWN
  CONFIRMED
  NOT_PREGNANT
  LOST
  FOALED
}
```

#### Animal (additions)
```prisma
model Animal {
  // ... existing fields ...

  // NEW: Foaling Relationships
  foalingRecordsAsMare      FoalingRecord[] @relation("MareFoalingRecords")
  foalingRecordsAsStallion  FoalingRecord[] @relation("StallionFoalingRecords")
  foalRecord                FoalingRecord?  @relation("FoalRecord")

  // NEW: Mare Reproductive Data
  averageGestationLength    Int?            // Calculated from history
  averageCycleLength        Int?            // Days between heat cycles
  lastHeatDate              DateTime?
  isCurrentlyPregnant       Boolean         @default(false)
  currentFoalingRecordId    String?

  // NEW: Breeding Cycle History
  breedingCycleLogs         BreedingCycleLog[]
}
```

---

## API Specifications

### Base URL
```
/api/v1/foaling
```

### Authentication
All endpoints require authentication via Bearer token.

---

### 1. Create Foaling Record

**Endpoint:** `POST /api/v1/foaling/records`

**Description:** Automatically creates foaling record when breeding is marked as pregnant.

**Request Body:**
```typescript
{
  breedingId: string;
  expectedFoalingDate?: string; // ISO date, optional (auto-calculated if not provided)
  customGestationDays?: number; // Optional override (default: 340)
  enableNotifications?: boolean; // Default: true
}
```

**Response:** `201 Created`
```typescript
{
  success: true;
  data: {
    id: string;
    breedingId: string;
    mareId: string;
    mareName: string;
    stallionId: string | null;
    stallionName: string | null;
    breedingDate: string; // ISO date
    expectedFoalingDate: string; // ISO date
    status: "EXPECTING" | "MONITORING" | "IMMINENT" | "OVERDUE" | "FOALED";
    daysUntilDue: number;
    milestones: Array<{
      id: string;
      type: string;
      scheduledDate: string;
      isCompleted: boolean;
      daysUntil: number;
    }>;
    notifications: {
      enabled: boolean;
      nextNotificationDate: string | null;
    };
  };
}
```

**Business Logic:**
```typescript
async function createFoalingRecord(data: CreateFoalingRecordInput) {
  // 1. Validate breeding exists and belongs to organization
  const breeding = await prisma.breeding.findFirst({
    where: {
      id: data.breedingId,
      organizationId: user.organizationId
    },
    include: { mare: true, stallion: true }
  });

  if (!breeding) {
    throw new NotFoundError('Breeding not found');
  }

  // 2. Check if foaling record already exists
  const existing = await prisma.foalingRecord.findUnique({
    where: { breedingId: data.breedingId }
  });

  if (existing) {
    throw new ConflictError('Foaling record already exists for this breeding');
  }

  // 3. Calculate expected foaling date
  const gestationDays = data.customGestationDays || 340;
  const expectedFoalingDate = data.expectedFoalingDate
    ? new Date(data.expectedFoalingDate)
    : addDays(breeding.breedingDate, gestationDays);

  // 4. Create foaling record
  const foalingRecord = await prisma.foalingRecord.create({
    data: {
      breedingId: breeding.id,
      mareId: breeding.mareId,
      stallionId: breeding.stallionId,
      organizationId: user.organizationId,
      breedingDate: breeding.breedingDate,
      expectedFoalingDate,
      status: 'EXPECTING',
      notificationsSent: {}
    }
  });

  // 5. Create milestones
  const milestones = await createFoalingMilestones(
    foalingRecord.id,
    breeding.breedingDate,
    expectedFoalingDate
  );

  // 6. Update breeding record
  await prisma.breeding.update({
    where: { id: breeding.id },
    data: {
      expectedFoalingDate,
      pregnancyStatus: 'CONFIRMED',
      autoCalculateFoaling: true
    }
  });

  // 7. Update mare status
  await prisma.animal.update({
    where: { id: breeding.mareId },
    data: {
      isCurrentlyPregnant: true,
      currentFoalingRecordId: foalingRecord.id
    }
  });

  // 8. Schedule notifications if enabled
  if (data.enableNotifications !== false) {
    await scheduleNotifications(foalingRecord.id, milestones);
  }

  return formatFoalingRecordResponse(foalingRecord, milestones);
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Breeding not found
- `409 Conflict`: Foaling record already exists
- `500 Internal Server Error`: Server error

---

### 2. Get Foaling Records (with filters)

**Endpoint:** `GET /api/v1/foaling/records`

**Description:** Get all foaling records for organization with filtering and sorting.

**Query Parameters:**
```typescript
{
  status?: "EXPECTING" | "MONITORING" | "IMMINENT" | "OVERDUE" | "FOALED" | "ABORTED" | "STILLBORN";
  mareId?: string;
  year?: number; // Expected foaling year
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  sortBy?: "expectedFoalingDate" | "breedingDate" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    records: Array<{
      id: string;
      mare: {
        id: string;
        name: string;
        registrationNumber: string | null;
      };
      stallion: {
        id: string;
        name: string;
        registrationNumber: string | null;
      } | null;
      breedingDate: string;
      expectedFoalingDate: string;
      actualFoalingDate: string | null;
      status: string;
      daysUntilDue: number | null;
      daysOverdue: number;
      foal: {
        id: string;
        name: string;
        sex: string;
        color: string;
      } | null;
      nextMilestone: {
        type: string;
        scheduledDate: string;
        daysUntil: number;
      } | null;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    summary: {
      totalExpecting: number;
      totalMonitoring: number;
      totalImminent: number;
      totalOverdue: number;
      totalFoaled: number;
    };
  };
}
```

**Business Logic:**
```typescript
async function getFoalingRecords(filters: FoalingRecordFilters, pagination: PaginationInput) {
  const { status, mareId, year, startDate, endDate, sortBy, sortOrder } = filters;
  const { page = 1, limit = 50 } = pagination;

  // Build where clause
  const where: Prisma.FoalingRecordWhereInput = {
    organizationId: user.organizationId,
    ...(status && { status }),
    ...(mareId && { mareId }),
    ...(year && {
      expectedFoalingDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`)
      }
    }),
    ...(startDate && endDate && {
      expectedFoalingDate: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    })
  };

  // Get total count
  const total = await prisma.foalingRecord.count({ where });

  // Get records
  const records = await prisma.foalingRecord.findMany({
    where,
    include: {
      mare: { select: { id: true, name: true, registrationNumber: true } },
      stallion: { select: { id: true, name: true, registrationNumber: true } },
      foal: { select: { id: true, name: true, sex: true, color: true } },
      breeding: true
    },
    orderBy: { [sortBy || 'expectedFoalingDate']: sortOrder || 'asc' },
    skip: (page - 1) * limit,
    take: limit
  });

  // Calculate days until due and get next milestone for each
  const enrichedRecords = await Promise.all(
    records.map(async (record) => {
      const daysUntilDue = record.status === 'FOALED'
        ? null
        : differenceInDays(record.expectedFoalingDate, new Date());

      const nextMilestone = await prisma.foalingMilestone.findFirst({
        where: {
          foalingRecordId: record.id,
          isCompleted: false,
          scheduledDate: { gte: new Date() }
        },
        orderBy: { scheduledDate: 'asc' }
      });

      return {
        ...record,
        daysUntilDue,
        nextMilestone: nextMilestone ? {
          type: nextMilestone.milestoneType,
          scheduledDate: nextMilestone.scheduledDate,
          daysUntil: differenceInDays(nextMilestone.scheduledDate, new Date())
        } : null
      };
    })
  );

  // Get summary counts
  const summary = await prisma.foalingRecord.groupBy({
    by: ['status'],
    where: { organizationId: user.organizationId },
    _count: true
  });

  return {
    records: enrichedRecords.map(formatFoalingRecordSummary),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    },
    summary: {
      totalExpecting: summary.find(s => s.status === 'EXPECTING')?._count || 0,
      totalMonitoring: summary.find(s => s.status === 'MONITORING')?._count || 0,
      totalImminent: summary.find(s => s.status === 'IMMINENT')?._count || 0,
      totalOverdue: summary.find(s => s.status === 'OVERDUE')?._count || 0,
      totalFoaled: summary.find(s => s.status === 'FOALED')?._count || 0
    }
  };
}
```

---

### 3. Get Single Foaling Record

**Endpoint:** `GET /api/v1/foaling/records/:id`

**Description:** Get detailed information about a specific foaling record.

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    id: string;
    breeding: {
      id: string;
      method: string;
      breedingDate: string;
    };
    mare: {
      id: string;
      name: string;
      registrationNumber: string | null;
      breed: string;
      averageGestationLength: number | null;
      previousFoalings: number;
    };
    stallion: {
      id: string;
      name: string;
      registrationNumber: string | null;
      breed: string;
    } | null;
    breedingDate: string;
    expectedFoalingDate: string;
    actualFoalingDate: string | null;
    status: string;
    daysUntilDue: number | null;
    daysOverdue: number;
    gestationLength: number | null;
    milestones: Array<{
      id: string;
      type: string;
      scheduledDate: string;
      completedDate: string | null;
      isCompleted: boolean;
      daysUntil: number | null;
      notes: string | null;
    }>;
    foal: {
      id: string;
      name: string;
      sex: string;
      color: string;
      markings: string | null;
      healthStatus: string;
      photos: string[];
    } | null;
    complications: {
      had: boolean;
      details: string | null;
      veterinarianCalled: boolean;
      veterinarianNotes: string | null;
    };
    postFoaling: {
      placentaPassed: boolean | null;
      placentaPassedMinutes: number | null;
      mareCondition: string | null;
      postFoalingHeatDate: string | null;
      readyForRebreeding: boolean;
      rebredOn: string | null;
    };
    notifications: {
      enabled: boolean;
      sent: Array<{
        type: string;
        sentAt: string;
      }>;
      upcoming: Array<{
        type: string;
        scheduledFor: string;
      }>;
    };
  };
}
```

---

### 4. Update Foaling Record

**Endpoint:** `PATCH /api/v1/foaling/records/:id`

**Description:** Update foaling record details (e.g., mark milestone completed, adjust expected date).

**Request Body:**
```typescript
{
  expectedFoalingDate?: string; // ISO date
  status?: "EXPECTING" | "MONITORING" | "IMMINENT" | "OVERDUE" | "FOALED" | "ABORTED" | "STILLBORN";
  notes?: string;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    // Full foaling record (same as GET single)
  };
}
```

**Business Logic:**
```typescript
async function updateFoalingRecord(id: string, data: UpdateFoalingRecordInput) {
  // 1. Get existing record
  const record = await prisma.foalingRecord.findFirst({
    where: {
      id,
      organizationId: user.organizationId
    }
  });

  if (!record) {
    throw new NotFoundError('Foaling record not found');
  }

  // 2. If expected date changed, recalculate milestones
  if (data.expectedFoalingDate) {
    const newDate = new Date(data.expectedFoalingDate);

    // Update milestones
    await recalculateMilestones(id, record.breedingDate, newDate);

    // Reschedule notifications
    await rescheduleNotifications(id, newDate);
  }

  // 3. Update record
  const updated = await prisma.foalingRecord.update({
    where: { id },
    data: {
      ...(data.expectedFoalingDate && {
        expectedFoalingDate: new Date(data.expectedFoalingDate)
      }),
      ...(data.status && { status: data.status })
    }
  });

  // 4. If status changed to terminal state, update mare status
  if (data.status && ['FOALED', 'ABORTED', 'STILLBORN', 'CANCELLED'].includes(data.status)) {
    await prisma.animal.update({
      where: { id: record.mareId },
      data: {
        isCurrentlyPregnant: false,
        currentFoalingRecordId: null
      }
    });
  }

  return formatFoalingRecordResponse(updated);
}
```

---

### 5. Record Actual Foaling

**Endpoint:** `POST /api/v1/foaling/records/:id/foal`

**Description:** Record that mare has foaled with foal details.

**Request Body:**
```typescript
{
  actualFoalingDate: string; // ISO datetime
  foalSex: "COLT" | "FILLY" | "UNKNOWN";
  foalName?: string;
  foalColor?: string;
  foalMarkings?: string;
  foalHealthStatus: "HEALTHY" | "MINOR_ISSUES" | "VETERINARY_CARE" | "CRITICAL" | "DECEASED";
  hadComplications: boolean;
  complicationDetails?: string;
  veterinarianCalled: boolean;
  veterinarianNotes?: string;
  placentaPassed: boolean;
  placentaPassedMinutes?: number;
  mareCondition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "VETERINARY_CARE_REQUIRED";
  foalPhotos?: string[]; // Array of base64 images or URLs
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    foalingRecord: {
      // Updated foaling record
    };
    foal: {
      id: string;
      name: string;
      sex: string;
      color: string;
      dateOfBirth: string;
      dam: { id: string; name: string };
      sire: { id: string; name: string } | null;
    };
    gestationLength: number; // Actual days from breeding to foaling
    comparedToExpected: number; // Days early (negative) or late (positive)
  };
}
```

**Business Logic:**
```typescript
async function recordFoaling(id: string, data: RecordFoalingInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Get foaling record
    const record = await tx.foalingRecord.findFirst({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: { mare: true, stallion: true, breeding: true }
    });

    if (!record) {
      throw new NotFoundError('Foaling record not found');
    }

    if (record.status === 'FOALED') {
      throw new ConflictError('Foaling already recorded');
    }

    // 2. Calculate gestation length
    const actualDate = new Date(data.actualFoalingDate);
    const gestationLength = differenceInDays(actualDate, record.breedingDate);
    const daysEarly = differenceInDays(record.expectedFoalingDate, actualDate);

    // 3. Create foal animal record
    const foal = await tx.animal.create({
      data: {
        organizationId: user.organizationId,
        name: data.foalName || `${record.mare.name} ${actualDate.getFullYear()} Foal`,
        sex: data.foalSex === 'COLT' ? 'STALLION' : data.foalSex === 'FILLY' ? 'MARE' : 'UNKNOWN',
        dateOfBirth: actualDate,
        color: data.foalColor,
        markings: data.foalMarkings,
        breed: record.mare.breed, // Inherit from dam
        damId: record.mareId,
        sireId: record.stallionId,
        status: 'ACTIVE',
        isOwned: true
      }
    });

    // 4. Upload foal photos if provided
    let photoUrls: string[] = [];
    if (data.foalPhotos && data.foalPhotos.length > 0) {
      photoUrls = await uploadFoalPhotos(foal.id, data.foalPhotos);
    }

    // 5. Update foaling record
    const updated = await tx.foalingRecord.update({
      where: { id },
      data: {
        actualFoalingDate: actualDate,
        status: 'FOALED',
        gestationLength,
        daysEarly,
        foalId: foal.id,
        foalSex: data.foalSex,
        foalColor: data.foalColor,
        foalMarkings: data.foalMarkings,
        foalHealthStatus: data.foalHealthStatus,
        hadComplications: data.hadComplications,
        complicationDetails: data.complicationDetails,
        veterinarianCalled: data.veterinarianCalled,
        veterinarianNotes: data.veterinarianNotes,
        placentaPassed: data.placentaPassed,
        placentaPassedMinutes: data.placentaPassedMinutes,
        mareCondition: data.mareCondition,
        foalPhotos: photoUrls,
        predictedAccuracy: Math.abs(daysEarly)
      }
    });

    // 6. Update mare status
    await tx.animal.update({
      where: { id: record.mareId },
      data: {
        isCurrentlyPregnant: false,
        currentFoalingRecordId: null,
        // Update average gestation if we have historical data
        averageGestationLength: await calculateAverageGestation(tx, record.mareId)
      }
    });

    // 7. Update breeding record
    await tx.breeding.update({
      where: { id: record.breedingId },
      data: {
        pregnancyStatus: 'FOALED',
        outcome: 'SUCCESS'
      }
    });

    // 8. Create post-foaling heat milestone
    const estimatedHeatDate = addDays(actualDate, 9); // Typical foal heat is 7-12 days
    await tx.foalingMilestone.create({
      data: {
        foalingRecordId: id,
        milestoneType: 'POST_FOALING_HEAT',
        scheduledDate: estimatedHeatDate,
        notes: 'Watch for foal heat (typically 7-12 days post-foaling)'
      }
    });

    // 9. Send notifications
    await sendFoalingNotification(user, record, foal);

    return {
      foalingRecord: updated,
      foal,
      gestationLength,
      comparedToExpected: daysEarly
    };
  });
}
```

---

### 6. Complete Milestone

**Endpoint:** `POST /api/v1/foaling/milestones/:id/complete`

**Description:** Mark a milestone as completed.

**Request Body:**
```typescript
{
  completedDate?: string; // ISO date, defaults to now
  notes?: string;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    id: string;
    type: string;
    scheduledDate: string;
    completedDate: string;
    isCompleted: true;
    notes: string | null;
  };
}
```

---

### 7. Get Foaling Calendar

**Endpoint:** `GET /api/v1/foaling/calendar`

**Description:** Get calendar view of foaling dates for dashboard.

**Query Parameters:**
```typescript
{
  year?: number; // Default: current year
  month?: number; // Optional: filter to specific month (1-12)
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    year: number;
    month: number | null;
    events: Array<{
      date: string; // YYYY-MM-DD
      foalings: Array<{
        id: string;
        mareId: string;
        mareName: string;
        status: string;
        type: "EXPECTED" | "ACTUAL" | "OVERDUE";
        daysUntilOrOverdue: number;
      }>;
      milestones: Array<{
        id: string;
        type: string;
        mareId: string;
        mareName: string;
        isCompleted: boolean;
      }>;
    }>;
    summary: {
      totalExpectedThisMonth: number;
      totalExpectedNextMonth: number;
      currentlyOverdue: number;
    };
  };
}
```

**Business Logic:**
```typescript
async function getFoalingCalendar(year: number, month?: number) {
  const startDate = month
    ? new Date(year, month - 1, 1)
    : new Date(year, 0, 1);

  const endDate = month
    ? new Date(year, month, 0) // Last day of month
    : new Date(year, 11, 31);

  // Get foaling records in date range
  const records = await prisma.foalingRecord.findMany({
    where: {
      organizationId: user.organizationId,
      OR: [
        {
          expectedFoalingDate: {
            gte: startDate,
            lte: endDate
          }
        },
        {
          actualFoalingDate: {
            gte: startDate,
            lte: endDate
          }
        }
      ]
    },
    include: {
      mare: { select: { id: true, name: true } }
    }
  });

  // Get milestones in date range
  const milestones = await prisma.foalingMilestone.findMany({
    where: {
      foalingRecord: {
        organizationId: user.organizationId
      },
      scheduledDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      foalingRecord: {
        include: {
          mare: { select: { id: true, name: true } }
        }
      }
    }
  });

  // Group by date
  const eventsByDate = new Map<string, CalendarDayEvents>();

  records.forEach(record => {
    const date = format(
      record.actualFoalingDate || record.expectedFoalingDate,
      'yyyy-MM-dd'
    );

    if (!eventsByDate.has(date)) {
      eventsByDate.set(date, { date, foalings: [], milestones: [] });
    }

    const today = new Date();
    const daysUntilOrOverdue = differenceInDays(
      record.expectedFoalingDate,
      today
    );

    eventsByDate.get(date)!.foalings.push({
      id: record.id,
      mareId: record.mareId,
      mareName: record.mare.name,
      status: record.status,
      type: record.actualFoalingDate
        ? 'ACTUAL'
        : record.status === 'OVERDUE'
          ? 'OVERDUE'
          : 'EXPECTED',
      daysUntilOrOverdue
    });
  });

  milestones.forEach(milestone => {
    const date = format(milestone.scheduledDate, 'yyyy-MM-dd');

    if (!eventsByDate.has(date)) {
      eventsByDate.set(date, { date, foalings: [], milestones: [] });
    }

    eventsByDate.get(date)!.milestones.push({
      id: milestone.id,
      type: milestone.milestoneType,
      mareId: milestone.foalingRecord.mareId,
      mareName: milestone.foalingRecord.mare.name,
      isCompleted: milestone.isCompleted
    });
  });

  return {
    year,
    month: month || null,
    events: Array.from(eventsByDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
    summary: await calculateCalendarSummary(user.organizationId, year, month)
  };
}
```

---

### 8. Get Foaling Analytics

**Endpoint:** `GET /api/v1/foaling/analytics`

**Description:** Get analytics and insights about foaling history.

**Query Parameters:**
```typescript
{
  years?: number; // Number of years to analyze (default: 3)
  mareId?: string; // Optional: analytics for specific mare
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    overall: {
      totalFoalings: number;
      averageGestationLength: number;
      predictionAccuracy: number; // Average days off from expected
      complicationRate: number; // Percentage
      foalSurvivalRate: number; // Percentage
    };
    byMare: Array<{
      mareId: string;
      mareName: string;
      totalFoalings: number;
      averageGestationLength: number;
      shortestGestation: number;
      longestGestation: number;
      complicationRate: number;
    }>;
    byMonth: Array<{
      month: number; // 1-12
      monthName: string;
      totalFoalings: number;
      averageGestationLength: number;
    }>;
    recentFoalings: Array<{
      // Last 10 foalings
    }>;
  };
}
```

---

### 9. Schedule Post-Foaling Heat

**Endpoint:** `POST /api/v1/foaling/records/:id/post-foaling-heat`

**Description:** Record observed post-foaling heat date.

**Request Body:**
```typescript
{
  heatDate: string; // ISO date
  notes?: string;
  readyForRebreeding?: boolean;
}
```

**Response:** `200 OK`

---

### 10. Get Upcoming Foalings (Dashboard Widget)

**Endpoint:** `GET /api/v1/foaling/upcoming`

**Description:** Get next 30 days of expected foalings for dashboard.

**Query Parameters:**
```typescript
{
  days?: number; // Default: 30
  includeOverdue?: boolean; // Default: true
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    overdue: Array<{
      id: string;
      mareName: string;
      expectedDate: string;
      daysOverdue: number;
      status: string;
    }>;
    imminent: Array<{
      // Due within 10 days
    }>;
    upcoming: Array<{
      // Due within 30 days
    }>;
    counts: {
      overdueCount: number;
      imminentCount: number;
      upcomingCount: number;
    };
  };
}
```

---

## Frontend Components

### Component Architecture

```
src/components/foaling/
├── FoalingDashboard.tsx          # Main dashboard with calendar & stats
├── FoalingCalendar.tsx            # Calendar view component
├── FoalingRecordsList.tsx         # List view with filters
├── FoalingRecordCard.tsx          # Individual record card
├── FoalingRecordDetail.tsx        # Detailed view of single record
├── CreateFoalingRecordModal.tsx   # Create from breeding
├── RecordFoalingModal.tsx         # Record actual foaling
├── UpdateMilestoneModal.tsx       # Complete/update milestone
├── FoalingTimeline.tsx            # Visual timeline of pregnancy
├── FoalingAnalytics.tsx           # Analytics dashboard
├── PostFoalingHeatTracker.tsx     # Track post-foaling heat
└── components/
    ├── MilestoneCard.tsx
    ├── FoalingStatusBadge.tsx
    ├── GestationProgressBar.tsx
    └── UpcomingFoalingsWidget.tsx
```

---

### 1. FoalingDashboard.tsx

**Description:** Main foaling management dashboard with calendar view and summary statistics.

**Component Structure:**
```tsx
import React, { useState, useEffect } from 'react';
import { FoalingCalendar } from './FoalingCalendar';
import { FoalingRecordsList } from './FoalingRecordsList';
import { UpcomingFoalingsWidget } from './components/UpcomingFoalingsWidget';
import { FoalingAnalytics } from './FoalingAnalytics';

interface FoalingDashboardProps {
  organizationId: string;
}

export const FoalingDashboard: React.FC<FoalingDashboardProps> = ({
  organizationId
}) => {
  const [view, setView] = useState<'calendar' | 'list' | 'analytics'>('calendar');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: upcomingData } = useFoalingUpcoming({ days: 30 });
  const { data: summaryData } = useFoalingSummary({ year: selectedYear });

  return (
    <div className="foaling-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Foaling Management</h1>

        {/* View Switcher */}
        <div className="view-switcher">
          <button
            className={view === 'calendar' ? 'active' : ''}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            List View
          </button>
          <button
            className={view === 'analytics' ? 'active' : ''}
            onClick={() => setView('analytics')}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <SummaryCard
          title="Overdue"
          count={upcomingData?.counts.overdueCount || 0}
          variant="danger"
          icon={<AlertIcon />}
        />
        <SummaryCard
          title="Due Within 10 Days"
          count={upcomingData?.counts.imminentCount || 0}
          variant="warning"
          icon={<ClockIcon />}
        />
        <SummaryCard
          title="Upcoming (30 days)"
          count={upcomingData?.counts.upcomingCount || 0}
          variant="info"
          icon={<CalendarIcon />}
        />
        <SummaryCard
          title="Foaled This Year"
          count={summaryData?.totalFoaled || 0}
          variant="success"
          icon={<CheckIcon />}
        />
      </div>

      {/* Upcoming Foalings Widget */}
      {(upcomingData?.overdue.length > 0 || upcomingData?.imminent.length > 0) && (
        <UpcomingFoalingsWidget data={upcomingData} />
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {view === 'calendar' && (
          <FoalingCalendar
            year={selectedYear}
            month={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
          />
        )}

        {view === 'list' && (
          <FoalingRecordsList />
        )}

        {view === 'analytics' && (
          <FoalingAnalytics />
        )}
      </div>
    </div>
  );
};
```

**Styling Requirements:**
```scss
.foaling-dashboard {
  padding: 24px;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .view-switcher {
      display: flex;
      gap: 8px;

      button {
        padding: 8px 16px;
        border: 1px solid var(--border-color);
        background: white;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--hover-bg);
        }

        &.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
      }
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
}
```

---

### 2. FoalingCalendar.tsx

**Description:** Interactive calendar showing expected and actual foaling dates.

**Component Structure:**
```tsx
import React from 'react';
import { Calendar } from '@/components/ui/Calendar';
import { FoalingEventPopover } from './FoalingEventPopover';

interface FoalingCalendarProps {
  year: number;
  month: number | null;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number | null) => void;
}

export const FoalingCalendar: React.FC<FoalingCalendarProps> = ({
  year,
  month,
  onYearChange,
  onMonthChange
}) => {
  const { data: calendarData, isLoading } = useFoalingCalendar({
    year,
    month
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Transform calendar data into events for calendar component
  const events = calendarData?.events.map(event => ({
    date: event.date,
    content: (
      <div className="calendar-event-indicators">
        {event.foalings.map(f => (
          <div
            key={f.id}
            className={`event-indicator ${f.type.toLowerCase()}`}
            title={`${f.mareName} - ${f.type}`}
          />
        ))}
        {event.milestones.map(m => (
          <div
            key={m.id}
            className="milestone-indicator"
            title={m.type}
          />
        ))}
      </div>
    ),
    onClick: () => setSelectedDate(event.date)
  }));

  // Get events for selected date
  const selectedDateEvents = calendarData?.events.find(
    e => e.date === selectedDate
  );

  return (
    <div className="foaling-calendar">
      {/* Calendar Controls */}
      <div className="calendar-controls">
        <div className="year-selector">
          <button onClick={() => onYearChange(year - 1)}>
            <ChevronLeftIcon />
          </button>
          <span>{year}</span>
          <button onClick={() => onYearChange(year + 1)}>
            <ChevronRightIcon />
          </button>
        </div>

        <div className="month-selector">
          <select
            value={month || ''}
            onChange={(e) => onMonthChange(e.target.value ? parseInt(e.target.value) : null)}
          >
            <option value="">All Months</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="indicator expected" />
          <span>Expected</span>
        </div>
        <div className="legend-item">
          <div className="indicator actual" />
          <span>Actual</span>
        </div>
        <div className="legend-item">
          <div className="indicator overdue" />
          <span>Overdue</span>
        </div>
        <div className="legend-item">
          <div className="indicator milestone" />
          <span>Milestone</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Calendar
          year={year}
          month={month}
          events={events}
          onDateClick={setSelectedDate}
        />
      )}

      {/* Event Details Popover */}
      {selectedDate && selectedDateEvents && (
        <FoalingEventPopover
          date={selectedDate}
          events={selectedDateEvents}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
};
```

**Styling:**
```scss
.foaling-calendar {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .calendar-controls {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;

    .year-selector {
      display: flex;
      align-items: center;
      gap: 16px;

      span {
        font-size: 18px;
        font-weight: 600;
        min-width: 60px;
        text-align: center;
      }

      button {
        padding: 4px 8px;
        border: 1px solid var(--border-color);
        background: white;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background: var(--hover-bg);
        }
      }
    }
  }

  .calendar-legend {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      .indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;

        &.expected {
          background: var(--info-color);
        }

        &.actual {
          background: var(--success-color);
        }

        &.overdue {
          background: var(--danger-color);
        }

        &.milestone {
          background: var(--warning-color);
        }
      }
    }
  }

  .calendar-event-indicators {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    padding: 4px;

    .event-indicator,
    .milestone-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .event-indicator {
      &.expected {
        background: var(--info-color);
      }

      &.actual {
        background: var(--success-color);
      }

      &.overdue {
        background: var(--danger-color);
        animation: pulse 2s infinite;
      }
    }

    .milestone-indicator {
      background: var(--warning-color);
      border: 1px solid var(--warning-dark);
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

### 3. RecordFoalingModal.tsx

**Description:** Modal for recording actual foaling with foal details.

**Component Structure:**
```tsx
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Form, Input, Select, DateTimePicker, TextArea, FileUpload } from '@/components/ui/Form';
import { useRecordFoaling } from '@/hooks/useFoaling';

interface RecordFoalingModalProps {
  foalingRecord: FoalingRecord;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordFoalingModal: React.FC<RecordFoalingModalProps> = ({
  foalingRecord,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    actualFoalingDate: new Date(),
    foalSex: 'UNKNOWN' as const,
    foalName: '',
    foalColor: '',
    foalMarkings: '',
    foalHealthStatus: 'HEALTHY' as const,
    hadComplications: false,
    complicationDetails: '',
    veterinarianCalled: false,
    veterinarianNotes: '',
    placentaPassed: true,
    placentaPassedMinutes: 30,
    mareCondition: 'EXCELLENT' as const,
    foalPhotos: [] as File[]
  });

  const recordFoaling = useRecordFoaling();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload photos first if any
      let photoUrls: string[] = [];
      if (formData.foalPhotos.length > 0) {
        photoUrls = await uploadPhotos(formData.foalPhotos);
      }

      await recordFoaling.mutateAsync({
        id: foalingRecord.id,
        ...formData,
        foalPhotos: photoUrls
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to record foaling:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Foaling"
      size="large"
    >
      <Form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Foaling Details</h3>

          <DateTimePicker
            label="Foaling Date & Time *"
            value={formData.actualFoalingDate}
            onChange={(date) => setFormData({ ...formData, actualFoalingDate: date })}
            maxDate={new Date()}
            required
          />

          <div className="gestation-comparison">
            <p>
              Expected: {format(foalingRecord.expectedFoalingDate, 'MMM dd, yyyy')}
            </p>
            <p>
              Gestation: {differenceInDays(formData.actualFoalingDate, foalingRecord.breedingDate)} days
              {' '}
              ({differenceInDays(foalingRecord.expectedFoalingDate, formData.actualFoalingDate) > 0
                ? `${differenceInDays(foalingRecord.expectedFoalingDate, formData.actualFoalingDate)} days early`
                : `${Math.abs(differenceInDays(foalingRecord.expectedFoalingDate, formData.actualFoalingDate))} days late`
              })
            </p>
          </div>
        </div>

        <div className="form-section">
          <h3>Foal Information</h3>

          <Select
            label="Sex *"
            value={formData.foalSex}
            onChange={(value) => setFormData({ ...formData, foalSex: value })}
            options={[
              { value: 'COLT', label: 'Colt (Male)' },
              { value: 'FILLY', label: 'Filly (Female)' },
              { value: 'UNKNOWN', label: 'Unknown' }
            ]}
            required
          />

          <Input
            label="Foal Name"
            value={formData.foalName}
            onChange={(e) => setFormData({ ...formData, foalName: e.target.value })}
            placeholder={`${foalingRecord.mare.name} ${new Date().getFullYear()} ${formData.foalSex === 'COLT' ? 'Colt' : formData.foalSex === 'FILLY' ? 'Filly' : 'Foal'}`}
          />

          <Input
            label="Color"
            value={formData.foalColor}
            onChange={(e) => setFormData({ ...formData, foalColor: e.target.value })}
            placeholder="Bay, Chestnut, Black, etc."
          />

          <TextArea
            label="Markings"
            value={formData.foalMarkings}
            onChange={(e) => setFormData({ ...formData, foalMarkings: e.target.value })}
            placeholder="Star, stripe, socks, etc."
            rows={3}
          />

          <Select
            label="Health Status *"
            value={formData.foalHealthStatus}
            onChange={(value) => setFormData({ ...formData, foalHealthStatus: value })}
            options={[
              { value: 'HEALTHY', label: 'Healthy - Standing & Nursing' },
              { value: 'MINOR_ISSUES', label: 'Minor Issues (resolved)' },
              { value: 'VETERINARY_CARE', label: 'Required Veterinary Care' },
              { value: 'CRITICAL', label: 'Critical Condition' },
              { value: 'DECEASED', label: 'Deceased' }
            ]}
            required
          />

          <FileUpload
            label="Foal Photos"
            accept="image/*"
            multiple
            maxFiles={5}
            value={formData.foalPhotos}
            onChange={(files) => setFormData({ ...formData, foalPhotos: files })}
          />
        </div>

        <div className="form-section">
          <h3>Mare Condition</h3>

          <Select
            label="Mare Condition Post-Foaling *"
            value={formData.mareCondition}
            onChange={(value) => setFormData({ ...formData, mareCondition: value })}
            options={[
              { value: 'EXCELLENT', label: 'Excellent' },
              { value: 'GOOD', label: 'Good' },
              { value: 'FAIR', label: 'Fair' },
              { value: 'POOR', label: 'Poor' },
              { value: 'VETERINARY_CARE_REQUIRED', label: 'Veterinary Care Required' }
            ]}
            required
          />

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.placentaPassed}
                onChange={(e) => setFormData({
                  ...formData,
                  placentaPassed: e.target.checked
                })}
              />
              Placenta Passed
            </label>
          </div>

          {formData.placentaPassed && (
            <Input
              type="number"
              label="Minutes After Foaling"
              value={formData.placentaPassedMinutes}
              onChange={(e) => setFormData({
                ...formData,
                placentaPassedMinutes: parseInt(e.target.value)
              })}
              min={0}
              max={300}
              suffix="minutes"
            />
          )}
        </div>

        <div className="form-section">
          <h3>Complications (if any)</h3>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.hadComplications}
                onChange={(e) => setFormData({
                  ...formData,
                  hadComplications: e.target.checked
                })}
              />
              Had Complications
            </label>
          </div>

          {formData.hadComplications && (
            <TextArea
              label="Complication Details"
              value={formData.complicationDetails}
              onChange={(e) => setFormData({
                ...formData,
                complicationDetails: e.target.value
              })}
              rows={4}
              required={formData.hadComplications}
            />
          )}

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.veterinarianCalled}
                onChange={(e) => setFormData({
                  ...formData,
                  veterinarianCalled: e.target.checked
                })}
              />
              Veterinarian Called
            </label>
          </div>

          {formData.veterinarianCalled && (
            <TextArea
              label="Veterinarian Notes"
              value={formData.veterinarianNotes}
              onChange={(e) => setFormData({
                ...formData,
                veterinarianNotes: e.target.value
              })}
              rows={4}
            />
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={recordFoaling.isLoading}
          >
            {recordFoaling.isLoading ? 'Recording...' : 'Record Foaling'}
          </button>
        </div>
      </Form>
    </Modal>
  );
};
```

---

### 4. UpcomingFoalingsWidget.tsx

**Description:** Dashboard widget showing overdue and imminent foalings.

**Component Structure:**
```tsx
import React from 'react';
import { FoalingStatusBadge } from './FoalingStatusBadge';
import { formatDistanceToNow } from 'date-fns';

interface UpcomingFoalingsWidgetProps {
  data: {
    overdue: Array<{
      id: string;
      mareName: string;
      expectedDate: string;
      daysOverdue: number;
      status: string;
    }>;
    imminent: Array<{
      id: string;
      mareName: string;
      expectedDate: string;
      daysUntil: number;
      status: string;
    }>;
  };
}

export const UpcomingFoalingsWidget: React.FC<UpcomingFoalingsWidgetProps> = ({
  data
}) => {
  return (
    <div className="upcoming-foalings-widget">
      {data.overdue.length > 0 && (
        <div className="widget-section overdue">
          <h3>
            <AlertIcon /> Overdue ({data.overdue.length})
          </h3>
          <div className="foaling-list">
            {data.overdue.map(foaling => (
              <div key={foaling.id} className="foaling-item">
                <div className="item-content">
                  <h4>{foaling.mareName}</h4>
                  <p className="overdue-text">
                    {foaling.daysOverdue} days overdue
                  </p>
                  <p className="expected-date">
                    Expected: {format(new Date(foaling.expectedDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="item-actions">
                  <Link
                    to={`/foaling/${foaling.id}`}
                    className="btn-small"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.imminent.length > 0 && (
        <div className="widget-section imminent">
          <h3>
            <ClockIcon /> Due Within 10 Days ({data.imminent.length})
          </h3>
          <div className="foaling-list">
            {data.imminent.map(foaling => (
              <div key={foaling.id} className="foaling-item">
                <div className="item-content">
                  <h4>{foaling.mareName}</h4>
                  <p className="days-until">
                    {foaling.daysUntil} days until due
                  </p>
                  <p className="expected-date">
                    {format(new Date(foaling.expectedDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="item-actions">
                  <Link
                    to={`/foaling/${foaling.id}`}
                    className="btn-small"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

**Styling:**
```scss
.upcoming-foalings-widget {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  .widget-section {
    &:not(:last-child) {
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-color);
    }

    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }

    &.overdue h3 {
      color: var(--danger-color);
    }

    &.imminent h3 {
      color: var(--warning-color);
    }
  }

  .foaling-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .foaling-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--surface-bg);
    border-radius: 6px;
    border-left: 4px solid var(--border-color);

    .overdue & {
      border-left-color: var(--danger-color);
      background: rgba(var(--danger-rgb), 0.05);
    }

    .imminent & {
      border-left-color: var(--warning-color);
      background: rgba(var(--warning-rgb), 0.05);
    }

    .item-content {
      flex: 1;

      h4 {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .overdue-text {
        color: var(--danger-color);
        font-weight: 600;
        margin-bottom: 2px;
      }

      .days-until {
        color: var(--warning-color);
        font-weight: 600;
        margin-bottom: 2px;
      }

      .expected-date {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }

    .item-actions {
      .btn-small {
        padding: 6px 12px;
        font-size: 14px;
        border-radius: 4px;
        text-decoration: none;
        background: white;
        border: 1px solid var(--border-color);
        color: var(--text-primary);

        &:hover {
          background: var(--hover-bg);
        }
      }
    }
  }
}
```

---

## Business Logic & Algorithms

### 1. Automatic Status Updates (Cron Job)

**Purpose:** Daily job to update foaling record statuses based on dates.

**Schedule:** Runs daily at 6:00 AM server time.

**Algorithm:**
```typescript
async function updateFoalingStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Update EXPECTING to MONITORING (30 days before due)
  const monitoringThreshold = addDays(today, 30);
  await prisma.foalingRecord.updateMany({
    where: {
      status: 'EXPECTING',
      expectedFoalingDate: {
        lte: monitoringThreshold
      }
    },
    data: { status: 'MONITORING' }
  });

  // 2. Update MONITORING to IMMINENT (10 days before due)
  const imminentThreshold = addDays(today, 10);
  await prisma.foalingRecord.updateMany({
    where: {
      status: 'MONITORING',
      expectedFoalingDate: {
        lte: imminentThreshold
      }
    },
    data: { status: 'IMMINENT' }
  });

  // 3. Update IMMINENT/MONITORING to OVERDUE (past due date)
  const overdueRecords = await prisma.foalingRecord.findMany({
    where: {
      status: {
        in: ['EXPECTING', 'MONITORING', 'IMMINENT']
      },
      expectedFoalingDate: {
        lt: today
      }
    }
  });

  for (const record of overdueRecords) {
    const daysOverdue = differenceInDays(today, record.expectedFoalingDate);

    await prisma.foalingRecord.update({
      where: { id: record.id },
      data: {
        status: 'OVERDUE',
        isOverdue: true,
        daysOverdue
      }
    });
  }

  console.log(`Updated ${overdueRecords.length} records to OVERDUE status`);
}
```

---

### 2. Notification Scheduling Algorithm

**Purpose:** Determine when to send each type of notification.

**Algorithm:**
```typescript
interface NotificationSchedule {
  type: MilestoneType;
  daysFromBreeding: number;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const NOTIFICATION_SCHEDULE: NotificationSchedule[] = [
  {
    type: 'VET_PREGNANCY_CHECK',
    daysFromBreeding: 15,
    message: 'Schedule pregnancy check for {mareName}',
    priority: 'medium'
  },
  {
    type: 'VET_ULTRASOUND_45',
    daysFromBreeding: 45,
    message: '45-day ultrasound due for {mareName}',
    priority: 'high'
  },
  {
    type: 'VET_ULTRASOUND_90',
    daysFromBreeding: 90,
    message: '90-day ultrasound due for {mareName}',
    priority: 'medium'
  },
  {
    type: 'BEGIN_MONITORING',
    daysFromBreeding: 300,
    message: 'Begin monitoring {mareName} - 40 days until due',
    priority: 'medium'
  },
  {
    type: 'PREPARE_FOALING_AREA',
    daysFromBreeding: 320,
    message: 'Prepare foaling area for {mareName} - 20 days until due',
    priority: 'high'
  },
  {
    type: 'DAILY_CHECKS_BEGIN',
    daysFromBreeding: 330,
    message: 'Begin daily checks for {mareName} - 10 days until due',
    priority: 'high'
  },
  {
    type: 'DUE_DATE',
    daysFromBreeding: 340,
    message: '{mareName} is due today!',
    priority: 'urgent'
  },
  {
    type: 'OVERDUE_VET_CALL',
    daysFromBreeding: 350,
    message: '{mareName} is 10 days overdue - contact veterinarian',
    priority: 'urgent'
  }
];

async function scheduleNotifications(
  foalingRecordId: string,
  milestones: FoalingMilestone[]
) {
  const record = await prisma.foalingRecord.findUnique({
    where: { id: foalingRecordId },
    include: { mare: true, organization: true }
  });

  if (!record) return;

  for (const milestone of milestones) {
    const schedule = NOTIFICATION_SCHEDULE.find(
      s => s.type === milestone.milestoneType
    );

    if (!schedule) continue;

    // Schedule notification for 8:00 AM on the milestone date
    const notificationTime = new Date(milestone.scheduledDate);
    notificationTime.setHours(8, 0, 0, 0);

    await createScheduledNotification({
      organizationId: record.organizationId,
      userId: record.organization.ownerId, // Send to org owner
      type: 'FOALING_MILESTONE',
      priority: schedule.priority,
      scheduledFor: notificationTime,
      title: schedule.message.replace('{mareName}', record.mare.name),
      body: `Foaling date: ${format(record.expectedFoalingDate, 'MMM dd, yyyy')}`,
      data: {
        foalingRecordId: record.id,
        milestoneId: milestone.id,
        milestoneType: milestone.milestoneType
      },
      channels: ['in_app', 'email', 'push']
    });
  }
}
```

---

### 3. Gestation Length Prediction

**Purpose:** Improve expected foaling date accuracy based on historical data.

**Algorithm:**
```typescript
async function calculatePredictedFoalingDate(
  mareId: string,
  breedingDate: Date
): Promise<{ predictedDate: Date; confidence: 'low' | 'medium' | 'high' }> {
  // 1. Get mare's historical foaling records
  const historicalFoalings = await prisma.foalingRecord.findMany({
    where: {
      mareId,
      status: 'FOALED',
      gestationLength: { not: null }
    },
    orderBy: { actualFoalingDate: 'desc' },
    take: 5 // Last 5 foalings
  });

  // 2. Calculate average gestation for this mare
  if (historicalFoalings.length >= 2) {
    const avgGestation = historicalFoalings.reduce(
      (sum, f) => sum + f.gestationLength!,
      0
    ) / historicalFoalings.length;

    const confidence = historicalFoalings.length >= 4 ? 'high' : 'medium';

    return {
      predictedDate: addDays(breedingDate, Math.round(avgGestation)),
      confidence
    };
  }

  // 3. If no history for this mare, use breed average
  const mare = await prisma.animal.findUnique({
    where: { id: mareId },
    select: { breed: true }
  });

  // Default gestation periods by breed
  const BREED_GESTATION: Record<string, number> = {
    'Thoroughbred': 340,
    'Quarter Horse': 342,
    'Arabian': 338,
    'Warmblood': 340,
    'Draft': 345,
    'Pony': 330,
    'Default': 340
  };

  const gestationDays = mare?.breed
    ? BREED_GESTATION[mare.breed] || BREED_GESTATION['Default']
    : BREED_GESTATION['Default'];

  return {
    predictedDate: addDays(breedingDate, gestationDays),
    confidence: 'low'
  };
}
```

---

### 4. Post-Foaling Heat Detection

**Purpose:** Predict and track foal heat for rebreeding.

**Algorithm:**
```typescript
async function predictPostFoalingHeat(
  foalingRecordId: string,
  actualFoalingDate: Date
): Promise<{ estimatedHeatDate: Date; windowStart: Date; windowEnd: Date }> {
  const record = await prisma.foalingRecord.findUnique({
    where: { id: foalingRecordId },
    include: { mare: true }
  });

  if (!record) throw new Error('Foaling record not found');

  // 1. Check mare's historical heat cycles
  const historicalCycles = await prisma.breedingCycleLog.findMany({
    where: {
      mareId: record.mareId,
      cycleLength: { not: null }
    },
    orderBy: { cycleStartDate: 'desc' },
    take: 3
  });

  // 2. Calculate average cycle length
  let avgDaysToHeat = 9; // Default: foal heat typically 7-12 days

  if (historicalCycles.length > 0) {
    avgDaysToHeat = historicalCycles.reduce(
      (sum, c) => sum + c.cycleLength!,
      0
    ) / historicalCycles.length;
  }

  // 3. Estimate heat window
  const estimatedHeatDate = addDays(actualFoalingDate, avgDaysToHeat);
  const windowStart = addDays(actualFoalingDate, 7);
  const windowEnd = addDays(actualFoalingDate, 12);

  // 4. Create milestone and notification
  await prisma.foalingMilestone.create({
    data: {
      foalingRecordId,
      milestoneType: 'POST_FOALING_HEAT',
      scheduledDate: estimatedHeatDate,
      notes: `Watch for foal heat between ${format(windowStart, 'MMM dd')} and ${format(windowEnd, 'MMM dd')}`
    }
  });

  return {
    estimatedHeatDate,
    windowStart,
    windowEnd
  };
}
```

---

## Notification Integration

### Notification Types

```typescript
enum FoalingNotificationType {
  MILESTONE_DUE = 'foaling.milestone.due',
  STATUS_CHANGE = 'foaling.status.change',
  OVERDUE_ALERT = 'foaling.overdue.alert',
  FOALING_RECORDED = 'foaling.recorded',
  POST_FOALING_HEAT = 'foaling.post_heat'
}
```

### Notification Templates

#### 1. Milestone Due Notification
```typescript
{
  type: 'foaling.milestone.due',
  title: '{milestone} due for {mareName}',
  body: 'Expected foaling date: {expectedDate}',
  priority: 'high',
  channels: ['in_app', 'email', 'push'],
  actions: [
    {
      label: 'View Details',
      url: '/foaling/{foalingRecordId}'
    },
    {
      label: 'Mark Complete',
      action: 'complete_milestone',
      milestoneId: '{milestoneId}'
    }
  ]
}
```

#### 2. Overdue Alert
```typescript
{
  type: 'foaling.overdue.alert',
  title: '{mareName} is overdue',
  body: '{daysOverdue} days past expected foaling date. Consider contacting veterinarian.',
  priority: 'urgent',
  channels: ['in_app', 'email', 'push', 'sms'],
  actions: [
    {
      label: 'View Record',
      url: '/foaling/{foalingRecordId}'
    },
    {
      label: 'Record Foaling',
      action: 'open_foaling_modal',
      foalingRecordId: '{foalingRecordId}'
    }
  ]
}
```

#### 3. Foaling Recorded Notification
```typescript
{
  type: 'foaling.recorded',
  title: 'Congratulations! {mareName} has foaled',
  body: '{foalSex} born on {foalingDate}. {gestationLength} days gestation.',
  priority: 'medium',
  channels: ['in_app', 'email'],
  actions: [
    {
      label: 'View Foal',
      url: '/animals/{foalId}'
    },
    {
      label: 'Share Announcement',
      action: 'share_foaling',
      foalId: '{foalId}'
    }
  ]
}
```

---

## User Flows

### Flow 1: Creating Foaling Record from Breeding

```
1. User confirms pregnancy for a breeding
   ↓
2. System automatically creates FoalingRecord
   - Calculates expected date (breeding + 340 days)
   - Sets status to EXPECTING
   ↓
3. System creates milestones
   - 15 days: Pregnancy check
   - 45 days: First ultrasound
   - 90 days: Second ultrasound
   - 300 days: Begin monitoring
   - 320 days: Prepare foaling area
   - 330 days: Daily checks
   - 340 days: Due date
   - 350 days: Overdue vet call
   ↓
4. System schedules notifications for each milestone
   ↓
5. User sees foaling record in calendar and dashboard
```

### Flow 2: Recording Actual Foaling

```
1. Mare foals
   ↓
2. User navigates to foaling record
   ↓
3. User clicks "Record Foaling"
   ↓
4. Modal opens with form:
   - Actual date/time
   - Foal details (sex, color, markings)
   - Health status
   - Complications (if any)
   - Mare condition
   - Photos
   ↓
5. User submits form
   ↓
6. System:
   - Creates Animal record for foal
   - Updates FoalingRecord with actual data
   - Calculates actual gestation length
   - Updates mare status (no longer pregnant)
   - Creates post-foaling heat milestone
   - Sends congratulations notification
   ↓
7. User redirected to foal's animal profile
```

### Flow 3: Daily Automated Status Updates

```
1. Cron job runs at 6:00 AM daily
   ↓
2. Check all active foaling records
   ↓
3. For each record:
   a. If 30 days until due → MONITORING
   b. If 10 days until due → IMMINENT
   c. If past due date → OVERDUE
   ↓
4. For OVERDUE records:
   - Calculate days overdue
   - Send urgent notification if needed
   ↓
5. Check scheduled notifications:
   - Send any notifications due today
   - Mark as sent in database
```

---

## Error Handling

### Error Scenarios

#### 1. Breeding Not Found
```typescript
throw new NotFoundError('Breeding record not found or does not belong to your organization');
```

#### 2. Foaling Already Recorded
```typescript
throw new ConflictError('Foaling has already been recorded for this pregnancy');
```

#### 3. Invalid Foaling Date
```typescript
if (actualFoalingDate < breedingDate) {
  throw new ValidationError('Foaling date cannot be before breeding date');
}

if (actualFoalingDate > new Date()) {
  throw new ValidationError('Foaling date cannot be in the future');
}

const gestationDays = differenceInDays(actualFoalingDate, breedingDate);
if (gestationDays < 300) {
  throw new ValidationError('Gestation length must be at least 300 days. Please verify dates.');
}

if (gestationDays > 370) {
  throw new ValidationError('Gestation length over 370 days is extremely rare. Please verify dates.');
}
```

#### 4. Photo Upload Failure
```typescript
try {
  const urls = await uploadPhotos(files);
} catch (error) {
  // Continue with foaling record creation, just log warning
  console.warn('Failed to upload foal photos:', error);
  // Still save foaling record without photos
}
```

#### 5. Notification Scheduling Failure
```typescript
try {
  await scheduleNotifications(foalingRecordId, milestones);
} catch (error) {
  // Log error but don't fail foaling record creation
  console.error('Failed to schedule notifications:', error);
  await logNotificationError(foalingRecordId, error);
}
```

---

## Testing Requirements

### Unit Tests

#### 1. Date Calculation Tests
```typescript
describe('calculateExpectedFoalingDate', () => {
  it('should calculate 340 days from breeding date by default', () => {
    const breedingDate = new Date('2025-01-15');
    const expected = calculateExpectedFoalingDate(breedingDate);
    expect(expected).toEqual(new Date('2025-12-21'));
  });

  it('should use custom gestation days if provided', () => {
    const breedingDate = new Date('2025-01-15');
    const expected = calculateExpectedFoalingDate(breedingDate, 335);
    expect(expected).toEqual(new Date('2025-12-16'));
  });

  it('should handle leap years correctly', () => {
    const breedingDate = new Date('2024-01-15');
    const expected = calculateExpectedFoalingDate(breedingDate);
    expect(expected).toEqual(new Date('2024-12-20')); // 2024 is leap year
  });
});
```

#### 2. Status Update Logic Tests
```typescript
describe('updateFoalingStatus', () => {
  it('should update to MONITORING when 30 days until due', async () => {
    const record = await createTestFoalingRecord({
      expectedFoalingDate: addDays(new Date(), 30)
    });

    await updateFoalingStatuses();

    const updated = await getFoalingRecord(record.id);
    expect(updated.status).toBe('MONITORING');
  });

  it('should update to IMMINENT when 10 days until due', async () => {
    const record = await createTestFoalingRecord({
      expectedFoalingDate: addDays(new Date(), 10)
    });

    await updateFoalingStatuses();

    const updated = await getFoalingRecord(record.id);
    expect(updated.status).toBe('IMMINENT');
  });

  it('should update to OVERDUE when past due date', async () => {
    const record = await createTestFoalingRecord({
      expectedFoalingDate: addDays(new Date(), -5)
    });

    await updateFoalingStatuses();

    const updated = await getFoalingRecord(record.id);
    expect(updated.status).toBe('OVERDUE');
    expect(updated.daysOverdue).toBe(5);
  });
});
```

#### 3. Gestation Calculation Tests
```typescript
describe('calculateGestationLength', () => {
  it('should calculate correct gestation length', () => {
    const breedingDate = new Date('2025-01-15');
    const foalingDate = new Date('2025-12-21');
    const length = calculateGestationLength(breedingDate, foalingDate);
    expect(length).toBe(340);
  });

  it('should handle early foaling', () => {
    const breedingDate = new Date('2025-01-15');
    const foalingDate = new Date('2025-12-11'); // 10 days early
    const length = calculateGestationLength(breedingDate, foalingDate);
    expect(length).toBe(330);
  });
});
```

### Integration Tests

#### 1. Create Foaling Record Flow
```typescript
describe('POST /api/v1/foaling/records', () => {
  it('should create foaling record with milestones', async () => {
    const breeding = await createTestBreeding();

    const response = await request(app)
      .post('/api/v1/foaling/records')
      .set('Authorization', `Bearer ${token}`)
      .send({ breedingId: breeding.id })
      .expect(201);

    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.milestones).toHaveLength(8);
    expect(response.body.data.status).toBe('EXPECTING');
  });

  it('should not create duplicate foaling record', async () => {
    const breeding = await createTestBreeding();
    await createFoalingRecord({ breedingId: breeding.id });

    await request(app)
      .post('/api/v1/foaling/records')
      .set('Authorization', `Bearer ${token}`)
      .send({ breedingId: breeding.id })
      .expect(409);
  });
});
```

#### 2. Record Foaling Flow
```typescript
describe('POST /api/v1/foaling/records/:id/foal', () => {
  it('should record foaling and create foal animal', async () => {
    const record = await createTestFoalingRecord();

    const response = await request(app)
      .post(`/api/v1/foaling/records/${record.id}/foal`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        actualFoalingDate: new Date().toISOString(),
        foalSex: 'COLT',
        foalName: 'Test Colt 2025',
        foalColor: 'Bay',
        foalHealthStatus: 'HEALTHY',
        hadComplications: false,
        veterinarianCalled: false,
        placentaPassed: true,
        placentaPassedMinutes: 30,
        mareCondition: 'EXCELLENT'
      })
      .expect(200);

    expect(response.body.data.foal.id).toBeDefined();
    expect(response.body.data.foalingRecord.status).toBe('FOALED');
    expect(response.body.data.gestationLength).toBeGreaterThan(0);
  });
});
```

### E2E Tests

#### 1. Complete Foaling Workflow
```typescript
describe('Foaling Complete Workflow', () => {
  it('should complete entire foaling process', async () => {
    // 1. Create breeding
    const breeding = await createBreeding({
      mareId: mare.id,
      stallionId: stallion.id,
      breedingDate: new Date('2025-01-15')
    });

    // 2. Confirm pregnancy
    await confirmPregnancy(breeding.id);

    // 3. Verify foaling record created
    const foalingRecords = await getFoalingRecords();
    expect(foalingRecords.length).toBe(1);
    expect(foalingRecords[0].status).toBe('EXPECTING');

    // 4. Simulate time passing to 330 days
    await simulateDate(addDays(breeding.breedingDate, 330));
    await runCronJob('updateFoalingStatuses');

    // 5. Verify status updated to IMMINENT
    const updated = await getFoalingRecord(foalingRecords[0].id);
    expect(updated.status).toBe('IMMINENT');

    // 6. Record foaling
    const foalingDate = addDays(breeding.breedingDate, 340);
    await recordFoaling(foalingRecords[0].id, {
      actualFoalingDate: foalingDate,
      foalSex: 'FILLY',
      foalHealthStatus: 'HEALTHY',
      mareCondition: 'EXCELLENT'
    });

    // 7. Verify foal created
    const foal = await getAnimal(/* foal id */);
    expect(foal.sex).toBe('MARE');
    expect(foal.damId).toBe(mare.id);
    expect(foal.sireId).toBe(stallion.id);

    // 8. Verify mare status updated
    const updatedMare = await getAnimal(mare.id);
    expect(updatedMare.isCurrentlyPregnant).toBe(false);
  });
});
```

---

## Implementation Checklist

### Phase 1: Database & Core Logic (Week 1)

- [ ] Create database migrations
  - [ ] FoalingRecord table
  - [ ] FoalingMilestone table
  - [ ] BreedingCycleLog table
  - [ ] Update Breeding table
  - [ ] Update Animal table
- [ ] Implement date calculation utilities
  - [ ] calculateExpectedFoalingDate()
  - [ ] calculateGestationLength()
  - [ ] getDaysUntilDue()
- [ ] Implement status update logic
  - [ ] updateFoalingStatuses()
  - [ ] calculateDaysOverdue()
- [ ] Set up cron job for daily status updates

### Phase 2: API Endpoints (Week 1-2)

- [ ] POST /api/v1/foaling/records
- [ ] GET /api/v1/foaling/records
- [ ] GET /api/v1/foaling/records/:id
- [ ] PATCH /api/v1/foaling/records/:id
- [ ] POST /api/v1/foaling/records/:id/foal
- [ ] POST /api/v1/foaling/milestones/:id/complete
- [ ] GET /api/v1/foaling/calendar
- [ ] GET /api/v1/foaling/analytics
- [ ] POST /api/v1/foaling/records/:id/post-foaling-heat
- [ ] GET /api/v1/foaling/upcoming

### Phase 3: Notification System (Week 2)

- [ ] Implement notification scheduling
  - [ ] createFoalingMilestones()
  - [ ] scheduleNotifications()
  - [ ] rescheduleNotifications()
- [ ] Create notification templates
  - [ ] Milestone due
  - [ ] Overdue alert
  - [ ] Foaling recorded
  - [ ] Post-foaling heat
- [ ] Implement notification delivery
  - [ ] In-app notifications
  - [ ] Email notifications
  - [ ] Push notifications

### Phase 4: Frontend Components (Week 2-3)

- [ ] Create base components
  - [ ] FoalingDashboard
  - [ ] FoalingCalendar
  - [ ] FoalingRecordsList
  - [ ] FoalingRecordCard
  - [ ] FoalingRecordDetail
- [ ] Create modal components
  - [ ] CreateFoalingRecordModal
  - [ ] RecordFoalingModal
  - [ ] UpdateMilestoneModal
- [ ] Create widget components
  - [ ] UpcomingFoalingsWidget
  - [ ] MilestoneCard
  - [ ] FoalingStatusBadge
  - [ ] GestationProgressBar
- [ ] Create analytics component
  - [ ] FoalingAnalytics

### Phase 5: Advanced Features (Week 3)

- [ ] Implement gestation prediction algorithm
  - [ ] calculatePredictedFoalingDate()
  - [ ] updatePredictionAccuracy()
- [ ] Implement post-foaling heat tracking
  - [ ] predictPostFoalingHeat()
  - [ ] recordPostFoalingHeat()
- [ ] Add photo upload functionality
  - [ ] uploadFoalPhotos()
  - [ ] Image optimization
  - [ ] Gallery component
- [ ] Implement breeding cycle logging
  - [ ] BreedingCycleLog CRUD
  - [ ] Cycle analytics

### Phase 6: Testing (Week 3-4)

- [ ] Write unit tests
  - [ ] Date calculations
  - [ ] Status updates
  - [ ] Gestation calculations
  - [ ] Notification scheduling
- [ ] Write integration tests
  - [ ] API endpoints
  - [ ] Database operations
  - [ ] Notification delivery
- [ ] Write E2E tests
  - [ ] Complete foaling workflow
  - [ ] Calendar interactions
  - [ ] Modal forms
- [ ] Manual QA testing
  - [ ] Cross-browser testing
  - [ ] Mobile responsiveness
  - [ ] Edge cases

### Phase 7: Documentation & Launch (Week 4)

- [ ] Write user documentation
  - [ ] How to create foaling records
  - [ ] How to record foaling
  - [ ] Understanding milestones
  - [ ] Calendar usage
- [ ] Create video tutorials
- [ ] Beta user onboarding
  - [ ] Setup guide
  - [ ] Sample data
  - [ ] Feedback collection
- [ ] Production deployment
  - [ ] Database migration
  - [ ] Feature flag rollout
  - [ ] Monitor for errors

---

## Success Metrics

### User Adoption
- 80%+ of breeders with pregnant mares create foaling records
- Average 3+ interactions per user per week during foaling season
- 90%+ of users record actual foaling (not abandoned)

### Engagement
- Calendar view accessed 2+ times per week
- Average 85%+ of milestones marked complete
- Notification open rate 60%+

### Accuracy
- Predicted foaling date within ±5 days for 70%+ of foalings
- 90%+ of foaling records have complete data
- Post-foaling heat prediction within ±2 days for 60%+

### Business Impact
- 20% reduction in support requests about tracking foaling dates
- 15% increase in breeding program management upgrades
- Featured in 80%+ of sales demos as differentiator

---

## Future Enhancements (Post-MVP)

### Phase 2 Features
1. **Foaling Camera Integration**
   - Connect to barn cameras
   - Motion detection alerts
   - Automatic recording

2. **Veterinarian Portal**
   - Vet can view upcoming appointments
   - Submit examination reports
   - Emergency contact integration

3. **Foaling Supplies Checklist**
   - Automated supply reminders
   - Shopping list integration
   - Inventory tracking

4. **Breeding Recommendations**
   - Optimal rebreeding timing
   - Foal heat vs. next cycle analysis
   - Mare rest period tracking

5. **Foal Growth Tracking**
   - Weight measurements
   - Height tracking
   - Growth curve comparisons
   - Developmental milestones

6. **Registry Submission Integration**
   - Automatic foal registration paperwork
   - Direct submission to breed registries
   - DNA testing coordination

---

**END OF DOCUMENT**

Total Lines: ~2,850
Estimated Implementation Time: 3-4 weeks (1 senior full-stack developer)
Estimated Value if Outsourced: $12,000-15,000
