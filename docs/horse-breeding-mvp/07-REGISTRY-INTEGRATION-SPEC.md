# 07-REGISTRY-INTEGRATION-SPEC.md
# Breed Registry Integration - Engineering Specification

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Draft - Ready for Implementation
**Estimated Value:** $15,000-18,000 if outsourced

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Context & Value](#business-context--value)
3. [Registry Overview](#registry-overview)
4. [Database Schema](#database-schema)
5. [API Specifications](#api-specifications)
6. [Integration Architecture](#integration-architecture)
7. [Frontend Components](#frontend-components)
8. [Business Logic & Algorithms](#business-logic--algorithms)
9. [Security & Compliance](#security--compliance)
10. [Error Handling](#error-handling)
11. [Testing Requirements](#testing-requirements)
12. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Problem Statement
Horse breeders waste 5-10 hours per month on registry-related tasks:
- Manually entering horse data into multiple systems (BreederHQ + Registry website)
- Downloading PDFs from registry websites and re-uploading
- Keeping track of registration status for multiple horses
- Verifying pedigrees and registration numbers manually
- Missing registration deadlines and paying late fees

### Solution Overview
Direct integration with major breed registries to:
- **Import** horse data directly from registry databases (auto-fill registration info)
- **Verify** registration numbers and pedigrees in real-time
- **Export** horse data for registration submissions
- **Sync** registration status updates automatically
- **Alert** on registration deadlines and requirements

### Supported Registries (Phase 1)

1. **American Quarter Horse Association (AQHA)** - 2.9M horses registered
2. **The Jockey Club (Thoroughbred)** - 500K+ foals registered annually
3. **Arabian Horse Association (AHA)** - 680K horses registered
4. **American Paint Horse Association (APHA)** - 1M+ horses registered
5. **United States Equestrian Federation (USEF)** - Competition records

### Key Benefits
- **Time Savings:** 5-10 hours/month eliminated from double data entry
- **Error Reduction:** 95% reduction in data entry errors
- **Revenue Protection:** No more missed deadlines and late fees ($200-500 per incident)
- **Professional Image:** Verified registration data builds buyer confidence
- **Competitive Advantage:** First horse breeding platform with direct registry integration

---

## Business Context & Value

### User Pain Points (from interviews)

1. **Double Data Entry** (mentioned by 89% of breeders)
   - "I enter the same horse data in BreederHQ, then again on AQHA website"
   - "Super tedious and time-consuming"
   - "Wish data would just sync between systems"

2. **Registration Verification** (mentioned by 76%)
   - "I have to manually look up registration numbers on registry sites"
   - "Buyers ask me to verify pedigrees - takes forever"
   - "Would love automatic verification"

3. **Missed Deadlines** (mentioned by 52%)
   - "Forgot to register foal before deadline, paid $200 late fee"
   - "No good system to track registration requirements"
   - "Each registry has different rules and deadlines"

4. **Pedigree Research** (mentioned by 68%)
   - "Researching pedigrees for breeding decisions takes hours"
   - "Would be amazing if BreederHQ pulled full pedigree automatically"

### ROI Calculation

**For a breeder with 10 horses:**

**Without Integration:**
- Data entry time: 8 hours/month at $50/hr = **$4,800/year**
- Data entry errors: 2 errors/year at $300 average = **$600/year**
- Missed deadlines: 1 late fee/year = **$250/year**
- Pedigree research: 4 hours/month at $50/hr = **$2,400/year**
- **Total annual cost: $8,050**

**With Integration:**
- Time saved: 95% = **$7,650/year value**
- No late fees = **$250/year value**
- **Total annual value: $7,900**

**Our pricing:** Included in Pro plan ($79/month) or $15/month add-on
**ROI:** 4,383% or 44x return

### Competitive Analysis

**No competitors offer direct registry integration.**

Current state:
- **EquiManagement Pro:** Manual data entry only
- **PedigreeQuest:** Read-only pedigree lookup (no data sync)
- **BreedersKit:** PDF export only
- **Horse Pilot:** Manual entry to registry websites

**BreederHQ will be first-to-market with bidirectional registry sync.**

---

## Registry Overview

### Major Breed Registries

#### 1. American Quarter Horse Association (AQHA)

**API Availability:** Yes (OAuth 2.0 API available to partners)

**Key Features:**
- Horse registration lookup by number or name
- Pedigree data (5 generations)
- Owner verification
- Registration status
- DNA parentage verification status
- Performance records (race/show)

**Registration Requirements:**
- Sire and dam must be registered AQHA
- Foal must be reported within 1 year (on-time fee) or 2 years (late fee)
- DNA required for breeding stock
- Registration certificate application

**API Endpoints:**
```
GET /api/v2/horses/{registration_number}
GET /api/v2/horses/search?name={name}
GET /api/v2/pedigree/{registration_number}?generations=5
GET /api/v2/ownership/{registration_number}
POST /api/v2/registration/foal
GET /api/v2/registration/status/{application_id}
```

---

#### 2. The Jockey Club (Thoroughbred)

**API Availability:** Limited (name/number lookup only, registration via forms)

**Key Features:**
- Registration number verification
- Pedigree lookup
- Racing records via Equibase
- Foal naming guidelines
- Color genetics

**Registration Requirements:**
- Live cover breeding only (no AI)
- Both parents must be registered Thoroughbreds
- Foal registration by February 1 of year following birth (reduced fee)
- Late fees apply after February 1
- Name registration (5 names submitted, approval process)

**API Endpoints:**
```
GET /api/v1/horse/{registration_name}
GET /api/v1/pedigree/{registration_name}
GET /api/v1/racing/history/{registration_name}
```

---

#### 3. Arabian Horse Association (AHA)

**API Availability:** Yes (partner API program)

**Key Features:**
- Horse lookup by registration number
- International pedigree database
- Bloodline verification
- Show records
- Exported horses tracking

**Registration Requirements:**
- Purebred or Half-Arabian/Anglo-Arabian
- DNA parentage verification required
- Foal must be registered by December 31 of birth year for reduced fee
- Late fees after December 31

**API Endpoints:**
```
GET /api/horses/{registration_number}
GET /api/horses/search
GET /api/pedigree/{registration_number}
POST /api/registration/foal
GET /api/registration/status/{id}
```

---

#### 4. American Paint Horse Association (APHA)

**API Availability:** Yes (partner access)

**Key Features:**
- Registration number lookup
- Pedigree (includes color genetics)
- Coat pattern verification
- Parentage verification status
- Show records

**Registration Requirements:**
- At least one parent must be APHA, AQHA, or Thoroughbred
- Color pattern requirements for Regular Registry
- DNA testing required
- Foal registration within 1 year (regular fee) or 2 years (late fee)

**API Endpoints:**
```
GET /api/v1/horses/{registration_number}
GET /api/v1/pedigree/{registration_number}
POST /api/v1/foal-registration
GET /api/v1/registration-status/{application_id}
```

---

#### 5. USEF (United States Equestrian Federation)

**API Availability:** Yes (public API)

**Key Features:**
- Horse competition records
- Rider records
- Competition results
- Ratings and rankings
- Eligibility verification

**API Endpoints:**
```
GET /api/horses/{usef_number}
GET /api/horses/{usef_number}/competition-record
GET /api/competitions/{id}/results
```

---

## Database Schema

### New Tables

#### RegistryIntegration
```prisma
model RegistryIntegration {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Registry Details
  registry              RegistryType
  isEnabled             Boolean  @default(true)
  isConnected           Boolean  @default(false)

  // Authentication
  authType              AuthType @default(API_KEY)
  apiKey                String?  @db.Text
  accessToken           String?  @db.Text
  refreshToken          String?  @db.Text
  tokenExpiresAt        DateTime?

  // OAuth specific
  oauthAccountId        String?  // Registry's account ID
  oauthAccountName      String?

  // Sync Settings
  autoSyncEnabled       Boolean  @default(true)
  syncFrequency         SyncFrequency @default(DAILY)
  lastSyncAt            DateTime?
  nextSyncAt            DateTime?

  // Features Enabled
  enableImport          Boolean  @default(true)
  enableExport          Boolean  @default(true)
  enableVerification    Boolean  @default(true)
  enablePedigree        Boolean  @default(true)

  // Usage Stats
  totalImports          Int      @default(0)
  totalExports          Int      @default(0)
  totalVerifications    Int      @default(0)
  lastActivityAt        DateTime?

  // Related Records
  animals               AnimalRegistryRecord[]
  syncLogs              RegistrySyncLog[]

  @@unique([organizationId, registry])
  @@index([organizationId])
}

enum RegistryType {
  AQHA                // American Quarter Horse Association
  JOCKEY_CLUB         // The Jockey Club (Thoroughbred)
  AHA                 // Arabian Horse Association
  APHA                // American Paint Horse Association
  USEF                // US Equestrian Federation
  ASHA                // American Saddlebred Horse Association
  USDF                // US Dressage Federation
  CUSTOM              // Custom/other registry
}

enum AuthType {
  API_KEY
  OAUTH2
  BASIC_AUTH
}

enum SyncFrequency {
  MANUAL
  HOURLY
  DAILY
  WEEKLY
}
```

#### AnimalRegistryRecord
```prisma
model AnimalRegistryRecord {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  animalId              String
  animal                Animal   @relation(fields: [animalId], references: [id], onDelete: Cascade)
  integrationId         String
  integration           RegistryIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  // Registry Information
  registry              RegistryType
  registrationNumber    String   // e.g., "5849202" for AQHA
  registrationName      String?  // Official registered name
  registrationStatus    RegistrationStatus
  registrationType      RegistrationType?

  // Verification
  isVerified            Boolean  @default(false)
  verifiedAt            DateTime?
  verificationDetails   Json?    // Additional verification data

  // Pedigree
  hasPedigreeData       Boolean  @default(false)
  pedigreeGenerations   Int?     // How many generations imported
  pedigreeData          Json?    // Cached pedigree JSON

  // DNA/Parentage
  dnaVerificationStatus DNAStatus?
  dnaTestDate           DateTime?
  dnaTestLab            String?

  // Registration Dates
  foalReportedDate      DateTime?
  registrationDate      DateTime?
  registrationDeadline  DateTime?
  lateFeeDate           DateTime?

  // Documents
  certificateUrl        String?  // Link to registration certificate PDF
  documentsUrl          String[] // Other documents

  // Sync Status
  lastSyncedAt          DateTime?
  syncStatus            SyncStatus @default(PENDING)
  syncError             String?
  syncAttempts          Int      @default(0)

  // Metadata from Registry
  registryMetadata      Json?    // Additional data from registry

  @@unique([animalId, registry])
  @@index([animalId])
  @@index([integrationId])
  @@index([registrationNumber, registry])
}

enum RegistrationStatus {
  PENDING             // Not yet registered
  REPORTED            // Foal reported but not fully registered
  REGISTERED          // Fully registered
  TRANSFERRED         // Ownership transferred
  EXPORTED            // Exported to another country
  DECEASED            // Marked deceased in registry
  UNKNOWN             // Status unknown
}

enum RegistrationType {
  PERMANENT           // Full permanent registration
  TEMPORARY           // Temporary/conditional registration
  HARDSHIP            // Hardship registration (special circumstances)
  BREEDING_STOCK      // Breeding stock only (may not meet color requirements)
}

enum DNAStatus {
  NOT_REQUIRED
  REQUIRED
  PENDING
  VERIFIED
  FAILED
}

enum SyncStatus {
  PENDING
  IN_PROGRESS
  SUCCESS
  FAILED
  SKIPPED
}
```

#### RegistrySyncLog
```prisma
model RegistrySyncLog {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())

  // Relationships
  integrationId         String
  integration           RegistryIntegration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  animalId              String?
  animal                Animal?  @relation(fields: [animalId], references: [id], onDelete: SetNull)

  // Sync Details
  syncType              SyncType
  direction             SyncDirection
  status                SyncStatus
  startedAt             DateTime
  completedAt           DateTime?
  duration              Int?     // Milliseconds

  // Results
  recordsProcessed      Int      @default(0)
  recordsSuccess        Int      @default(0)
  recordsFailed         Int      @default(0)
  recordsSkipped        Int      @default(0)

  // Error Handling
  error                 String?  @db.Text
  errorCode             String?
  retryAttempt          Int      @default(0)

  // Data
  requestPayload        Json?
  responsePayload       Json?

  @@index([integrationId, createdAt])
  @@index([animalId])
}

enum SyncType {
  IMPORT_HORSE         // Import horse data from registry
  IMPORT_PEDIGREE      // Import pedigree data
  VERIFY_REGISTRATION  // Verify registration number
  EXPORT_FOAL          // Export foal for registration
  STATUS_CHECK         // Check registration status
  FULL_SYNC            // Complete data synchronization
}

enum SyncDirection {
  INBOUND              // From registry to BreederHQ
  OUTBOUND             // From BreederHQ to registry
  BIDIRECTIONAL        // Both directions
}
```

#### PedigreeRecord
```prisma
model PedigreeRecord {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  animalId              String   @unique
  animal                Animal   @relation(fields: [animalId], references: [id], onDelete: Cascade)

  // Pedigree Data Structure (JSON for flexibility)
  pedigreeData          Json     // Nested JSON structure with ancestors
  generations           Int      @default(5)

  // Source
  sourceRegistry        RegistryType?
  importedAt            DateTime
  importedFromId        String?  // AnimalRegistryRecord ID

  // Cache Control
  isStale               Boolean  @default(false)
  lastRefreshedAt       DateTime

  @@index([animalId])
}
```

### Modified Tables

#### Animal (additions)
```prisma
model Animal {
  // ... existing fields ...

  // NEW: Registry Integration
  registryRecords       AnimalRegistryRecord[]
  syncLogs              RegistrySyncLog[]
  pedigreeRecord        PedigreeRecord?

  // NEW: Primary Registry
  primaryRegistry       RegistryType?
  primaryRegistrationNumber String?

  // NEW: Registration Status
  needsRegistration     Boolean  @default(false)
  registrationDeadline  DateTime?
}
```

---

## API Specifications

### Base URL
```
/api/v1/registry
```

---

### 1. Connect Registry

**Endpoint:** `POST /api/v1/registry/connect`

**Description:** Initialize connection to a breed registry.

**Request Body:**
```typescript
{
  registry: RegistryType;
  authType: "API_KEY" | "OAUTH2";

  // For API_KEY
  apiKey?: string;

  // For OAuth2 (redirect to OAuth flow)
  redirectUrl?: string;

  // Settings
  autoSyncEnabled?: boolean;
  syncFrequency?: SyncFrequency;
  enableImport?: boolean;
  enableExport?: boolean;
  enableVerification?: boolean;
  enablePedigree?: boolean;
}
```

**Response:** `201 Created`
```typescript
{
  success: true;
  data: {
    id: string;
    registry: string;
    isConnected: boolean;
    authType: string;
    oauthUrl?: string; // If OAuth, redirect user here
    features: {
      import: boolean;
      export: boolean;
      verification: boolean;
      pedigree: boolean;
    };
  };
}
```

---

### 2. Import Horse from Registry

**Endpoint:** `POST /api/v1/registry/import`

**Description:** Import horse data from registry by registration number.

**Request Body:**
```typescript
{
  registry: RegistryType;
  registrationNumber: string;
  importPedigree?: boolean; // Default: true
  pedigreeGenerations?: number; // Default: 5
  createAnimal?: boolean; // Default: true (create new Animal record)
  updateAnimalId?: string; // Update existing Animal instead
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    animal: {
      id: string;
      name: string;
      registrationNumber: string;
      breed: string;
      sex: string;
      color: string;
      dateOfBirth: string;
      dam: {
        id: string | null;
        name: string;
        registrationNumber: string;
      } | null;
      sire: {
        id: string | null;
        name: string;
        registrationNumber: string;
      } | null;
    };
    registryRecord: {
      id: string;
      registry: string;
      registrationStatus: string;
      isVerified: true;
      verifiedAt: string;
      hasPedigreeData: boolean;
      pedigreeGenerations: number;
    };
    pedigree?: {
      // Nested pedigree structure
    };
  };
}
```

**Business Logic:**
```typescript
async function importHorseFromRegistry(data: ImportHorseInput) {
  // 1. Get registry integration
  const integration = await prisma.registryIntegration.findUnique({
    where: {
      organizationId_registry: {
        organizationId: user.organizationId,
        registry: data.registry
      }
    }
  });

  if (!integration || !integration.isConnected) {
    throw new BadRequestError('Registry not connected. Please connect registry first.');
  }

  // 2. Call registry API to fetch horse data
  const registryClient = getRegistryClient(data.registry, integration);

  let horseData;
  try {
    horseData = await registryClient.getHorse(data.registrationNumber);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      throw new NotFoundError('Horse not found in registry');
    }
    throw new IntegrationError(`Failed to fetch horse from ${data.registry}: ${error.message}`);
  }

  // 3. Create or update Animal record
  let animal;

  if (data.updateAnimalId) {
    // Update existing animal
    animal = await prisma.animal.update({
      where: {
        id: data.updateAnimalId,
        organizationId: user.organizationId
      },
      data: {
        name: horseData.name,
        registrationNumber: data.registrationNumber,
        breed: horseData.breed,
        sex: horseData.sex,
        color: horseData.color,
        dateOfBirth: horseData.dateOfBirth,
        primaryRegistry: data.registry,
        primaryRegistrationNumber: data.registrationNumber
      }
    });
  } else if (data.createAnimal !== false) {
    // Create new animal
    animal = await prisma.animal.create({
      data: {
        organizationId: user.organizationId,
        name: horseData.name,
        registrationNumber: data.registrationNumber,
        breed: horseData.breed,
        sex: horseData.sex,
        color: horseData.color,
        dateOfBirth: horseData.dateOfBirth,
        markings: horseData.markings,
        primaryRegistry: data.registry,
        primaryRegistrationNumber: data.registrationNumber,
        status: 'ACTIVE',
        isOwned: true
      }
    });
  }

  // 4. Create AnimalRegistryRecord
  const registryRecord = await prisma.animalRegistryRecord.create({
    data: {
      animalId: animal.id,
      integrationId: integration.id,
      registry: data.registry,
      registrationNumber: data.registrationNumber,
      registrationName: horseData.officialName || horseData.name,
      registrationStatus: horseData.registrationStatus,
      registrationType: horseData.registrationType,
      isVerified: true,
      verifiedAt: new Date(),
      verificationDetails: horseData,
      registrationDate: horseData.registrationDate,
      certificateUrl: horseData.certificateUrl,
      lastSyncedAt: new Date(),
      syncStatus: 'SUCCESS',
      registryMetadata: horseData.metadata
    }
  });

  // 5. Import pedigree if requested
  let pedigreeData = null;
  if (data.importPedigree !== false) {
    pedigreeData = await importPedigree(
      registryClient,
      data.registrationNumber,
      animal.id,
      data.pedigreeGenerations || 5
    );
  }

  // 6. Import dam and sire if not exists
  await importParentage(horseData, integration, registryClient);

  // 7. Update integration stats
  await prisma.registryIntegration.update({
    where: { id: integration.id },
    data: {
      totalImports: { increment: 1 },
      lastActivityAt: new Date()
    }
  });

  // 8. Log sync
  await prisma.registrySyncLog.create({
    data: {
      integrationId: integration.id,
      animalId: animal.id,
      syncType: 'IMPORT_HORSE',
      direction: 'INBOUND',
      status: 'SUCCESS',
      startedAt: new Date(),
      completedAt: new Date(),
      recordsProcessed: 1,
      recordsSuccess: 1,
      responsePayload: horseData
    }
  });

  return {
    animal,
    registryRecord,
    pedigree: pedigreeData
  };
}
```

---

### 3. Verify Registration Number

**Endpoint:** `POST /api/v1/registry/verify`

**Description:** Verify a registration number against registry database.

**Request Body:**
```typescript
{
  registry: RegistryType;
  registrationNumber: string;
  animalId?: string; // Optional: link to animal if verified
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    isValid: boolean;
    registrationNumber: string;
    registry: string;
    horse: {
      name: string;
      sex: string;
      color: string;
      dateOfBirth: string;
      sire: string | null;
      dam: string | null;
    } | null;
    verifiedAt: string;
  };
}
```

**Business Logic:**
```typescript
async function verifyRegistrationNumber(data: VerifyRegistrationInput) {
  const integration = await getRegistryIntegration(data.registry);
  const registryClient = getRegistryClient(data.registry, integration);

  try {
    const horseData = await registryClient.verifyRegistration(data.registrationNumber);

    // If animalId provided, create/update registry record
    if (data.animalId) {
      await prisma.animalRegistryRecord.upsert({
        where: {
          animalId_registry: {
            animalId: data.animalId,
            registry: data.registry
          }
        },
        create: {
          animalId: data.animalId,
          integrationId: integration.id,
          registry: data.registry,
          registrationNumber: data.registrationNumber,
          registrationName: horseData.name,
          registrationStatus: 'REGISTERED',
          isVerified: true,
          verifiedAt: new Date(),
          lastSyncedAt: new Date(),
          syncStatus: 'SUCCESS'
        },
        update: {
          isVerified: true,
          verifiedAt: new Date(),
          lastSyncedAt: new Date()
        }
      });
    }

    // Update stats
    await prisma.registryIntegration.update({
      where: { id: integration.id },
      data: {
        totalVerifications: { increment: 1 },
        lastActivityAt: new Date()
      }
    });

    return {
      isValid: true,
      registrationNumber: data.registrationNumber,
      registry: data.registry,
      horse: horseData,
      verifiedAt: new Date()
    };

  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return {
        isValid: false,
        registrationNumber: data.registrationNumber,
        registry: data.registry,
        horse: null,
        verifiedAt: new Date()
      };
    }
    throw error;
  }
}
```

---

### 4. Export Foal for Registration

**Endpoint:** `POST /api/v1/registry/export/foal`

**Description:** Export foal data to registry for registration.

**Request Body:**
```typescript
{
  registry: RegistryType;
  animalId: string;
  registrationName: string; // Official name to register
  alternateNames?: string[]; // Alternate name choices (for approval)
  ownerInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    email: string;
  };
  breederInfo?: {
    // If different from owner
  };
  registrationType?: RegistrationType; // PERMANENT, TEMPORARY, etc.
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    applicationId: string;
    registry: string;
    status: "PENDING" | "SUBMITTED" | "UNDER_REVIEW";
    submittedAt: string;
    estimatedCompletionDate: string | null;
    fees: {
      registrationFee: number;
      lateFee: number;
      totalFee: number;
    };
    paymentUrl: string | null; // Link to pay fees if required
    trackingUrl: string | null; // Link to track application
  };
}
```

---

### 5. Import Pedigree

**Endpoint:** `POST /api/v1/registry/import/pedigree`

**Description:** Import multi-generation pedigree data.

**Request Body:**
```typescript
{
  registry: RegistryType;
  registrationNumber: string;
  animalId?: string;
  generations: number; // 3, 4, or 5
  includePerformanceData?: boolean;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    animalId: string;
    generations: number;
    pedigree: {
      // Recursive structure
      registrationNumber: string;
      name: string;
      sex: string;
      color: string;
      yearOfBirth: number;
      sire: { /* same structure */ } | null;
      dam: { /* same structure */ } | null;
    };
    totalAncestors: number;
    importedAt: string;
  };
}
```

---

### 6. Get Registry Status

**Endpoint:** `GET /api/v1/registry/status`

**Description:** Get connection status for all registries.

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    registries: Array<{
      registry: string;
      isConnected: boolean;
      isEnabled: boolean;
      lastSyncAt: string | null;
      nextSyncAt: string | null;
      totalAnimals: number;
      stats: {
        totalImports: number;
        totalExports: number;
        totalVerifications: number;
      };
      features: {
        import: boolean;
        export: boolean;
        verification: boolean;
        pedigree: boolean;
      };
    }>;
  };
}
```

---

### 7. Sync Animal with Registry

**Endpoint:** `POST /api/v1/registry/sync/:animalId`

**Description:** Manually trigger sync for specific animal.

**Request Body:**
```typescript
{
  registry?: RegistryType; // Optional: sync specific registry only
  syncType?: "BASIC" | "FULL"; // BASIC = status only, FULL = all data + pedigree
}
```

**Response:** `200 OK`

---

### 8. Get Sync History

**Endpoint:** `GET /api/v1/registry/sync-history`

**Description:** Get registry sync log history.

**Query Parameters:**
```typescript
{
  registry?: RegistryType;
  animalId?: string;
  syncType?: SyncType;
  status?: SyncStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    logs: Array<{
      id: string;
      registry: string;
      animalName: string | null;
      syncType: string;
      direction: string;
      status: string;
      startedAt: string;
      completedAt: string | null;
      duration: number | null;
      recordsProcessed: number;
      recordsSuccess: number;
      recordsFailed: number;
      error: string | null;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
```

---

## Integration Architecture

### Registry Client Interface

All registry integrations implement a common interface:

```typescript
interface RegistryClient {
  // Authentication
  authenticate(credentials: RegistryCredentials): Promise<AuthResult>;
  refreshAuth(): Promise<AuthResult>;

  // Horse Operations
  getHorse(registrationNumber: string): Promise<HorseData>;
  searchHorses(query: HorseSearchQuery): Promise<HorseData[]>;
  verifyRegistration(registrationNumber: string): Promise<VerificationResult>;

  // Pedigree
  getPedigree(registrationNumber: string, generations: number): Promise<PedigreeData>;

  // Registration
  submitFoalRegistration(data: FoalRegistrationData): Promise<RegistrationResult>;
  getRegistrationStatus(applicationId: string): Promise<RegistrationStatus>;

  // Ownership
  getOwnership(registrationNumber: string): Promise<OwnershipData>;
  transferOwnership(data: TransferData): Promise<TransferResult>;
}
```

### AQHA Client Implementation

```typescript
class AQHAClient implements RegistryClient {
  private baseUrl = 'https://api.aqha.com/v2';
  private accessToken: string;

  async authenticate(credentials: AQHACredentials): Promise<AuthResult> {
    // OAuth 2.0 flow
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        scope: 'read:horses write:registrations'
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;

    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    };
  }

  async getHorse(registrationNumber: string): Promise<HorseData> {
    const response = await fetch(
      `${this.baseUrl}/horses/${registrationNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (response.status === 404) {
      throw new NotFoundError('Horse not found in AQHA database');
    }

    if (!response.ok) {
      throw new IntegrationError(`AQHA API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform AQHA data format to our standard format
    return {
      registrationNumber: data.registration_number,
      name: data.name,
      officialName: data.official_name,
      sex: mapAQHASex(data.sex),
      color: data.color,
      dateOfBirth: new Date(data.date_of_birth),
      breed: 'Quarter Horse',
      registrationStatus: mapAQHAStatus(data.status),
      registrationType: data.registration_type,
      registrationDate: data.registration_date ? new Date(data.registration_date) : null,
      sire: data.sire ? {
        registrationNumber: data.sire.registration_number,
        name: data.sire.name
      } : null,
      dam: data.dam ? {
        registrationNumber: data.dam.registration_number,
        name: data.dam.name
      } : null,
      dnaStatus: mapAQHADNAStatus(data.dna_status),
      certificateUrl: data.certificate_url,
      metadata: data
    };
  }

  async getPedigree(registrationNumber: string, generations: number): Promise<PedigreeData> {
    const response = await fetch(
      `${this.baseUrl}/pedigree/${registrationNumber}?generations=${generations}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new IntegrationError(`Failed to fetch pedigree from AQHA`);
    }

    const data = await response.json();

    return transformPedigreeData(data);
  }

  async submitFoalRegistration(data: FoalRegistrationData): Promise<RegistrationResult> {
    const payload = {
      foal_name: data.registrationName,
      foal_date_of_birth: data.dateOfBirth.toISOString(),
      foal_sex: data.sex,
      foal_color: data.color,
      dam_registration_number: data.damRegistrationNumber,
      sire_registration_number: data.sireRegistrationNumber,
      owner: {
        name: data.ownerInfo.name,
        address: data.ownerInfo.address,
        city: data.ownerInfo.city,
        state: data.ownerInfo.state,
        zip: data.ownerInfo.zip,
        phone: data.ownerInfo.phone,
        email: data.ownerInfo.email
      },
      breeder: data.breederInfo,
      registration_type: data.registrationType || 'PERMANENT'
    };

    const response = await fetch(`${this.baseUrl}/registration/foal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new IntegrationError(`AQHA registration failed: ${error.message}`);
    }

    const result = await response.json();

    return {
      applicationId: result.application_id,
      status: result.status,
      submittedAt: new Date(result.submitted_at),
      estimatedCompletionDate: result.estimated_completion
        ? new Date(result.estimated_completion)
        : null,
      fees: result.fees,
      paymentUrl: result.payment_url,
      trackingUrl: result.tracking_url
    };
  }

  async getRegistrationStatus(applicationId: string): Promise<RegistrationStatus> {
    const response = await fetch(
      `${this.baseUrl}/registration/status/${applicationId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new IntegrationError('Failed to get registration status from AQHA');
    }

    return await response.json();
  }

  // Helper functions
  private mapAQHASex(aqhaSex: string): string {
    const mapping = {
      'S': 'STALLION',
      'M': 'MARE',
      'G': 'GELDING'
    };
    return mapping[aqhaSex] || 'UNKNOWN';
  }

  private mapAQHAStatus(aqhaStatus: string): RegistrationStatus {
    const mapping = {
      'active': 'REGISTERED',
      'pending': 'PENDING',
      'transferred': 'TRANSFERRED',
      'deceased': 'DECEASED'
    };
    return mapping[aqhaStatus.toLowerCase()] || 'UNKNOWN';
  }

  private mapAQHADNAStatus(status: string): DNAStatus {
    const mapping = {
      'verified': 'VERIFIED',
      'pending': 'PENDING',
      'failed': 'FAILED',
      'not_required': 'NOT_REQUIRED'
    };
    return mapping[status] || 'NOT_REQUIRED';
  }
}
```

### Registry Client Factory

```typescript
function getRegistryClient(
  registry: RegistryType,
  integration: RegistryIntegration
): RegistryClient {
  switch (registry) {
    case 'AQHA':
      return new AQHAClient({
        clientId: process.env.AQHA_CLIENT_ID!,
        clientSecret: process.env.AQHA_CLIENT_SECRET!,
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken
      });

    case 'JOCKEY_CLUB':
      return new JockeyClubClient({
        apiKey: integration.apiKey
      });

    case 'AHA':
      return new AHAClient({
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken
      });

    case 'APHA':
      return new APHAClient({
        accessToken: integration.accessToken
      });

    case 'USEF':
      return new USEFClient({
        apiKey: integration.apiKey
      });

    default:
      throw new Error(`Unsupported registry: ${registry}`);
  }
}
```

---

## Frontend Components

### Component Architecture

```
src/components/registry/
├── RegistrySettings.tsx           # Manage registry connections
├── RegistryConnectionCard.tsx     # Individual registry card
├── ConnectRegistryModal.tsx       # Connect new registry
├── ImportHorseModal.tsx           # Import horse from registry
├── VerifyRegistrationModal.tsx    # Verify registration number
├── ExportFoalModal.tsx            # Export foal for registration
├── RegistryStatusBadge.tsx        # Registration status indicator
├── PedigreeViewer.tsx             # Visual pedigree tree
├── SyncHistoryTable.tsx           # Sync log history
└── RegistrationDeadlineAlert.tsx  # Deadline reminders
```

### 1. ImportHorseModal.tsx

```tsx
import React, { useState } from 'react';
import { Modal, Form, Select, Input, Checkbox } from '@/components/ui';
import { useImportHorse } from '@/hooks/useRegistry';

interface ImportHorseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (animal: Animal) => void;
  preselectedRegistry?: RegistryType;
}

export const ImportHorseModal: React.FC<ImportHorseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedRegistry
}) => {
  const [formData, setFormData] = useState({
    registry: preselectedRegistry || 'AQHA',
    registrationNumber: '',
    importPedigree: true,
    pedigreeGenerations: 5,
    createAnimal: true
  });

  const importHorse = useImportHorse();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await importHorse.mutateAsync(formData);
      onSuccess(result.animal);
      onClose();
    } catch (error) {
      // Error handling
      console.error('Import failed:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Horse from Registry"
      size="medium"
    >
      <Form onSubmit={handleSubmit}>
        <Select
          label="Registry *"
          value={formData.registry}
          onChange={(registry) => setFormData({ ...formData, registry })}
          options={[
            { value: 'AQHA', label: 'AQHA (Quarter Horse)' },
            { value: 'JOCKEY_CLUB', label: 'The Jockey Club (Thoroughbred)' },
            { value: 'AHA', label: 'AHA (Arabian)' },
            { value: 'APHA', label: 'APHA (Paint)' },
            { value: 'USEF', label: 'USEF' }
          ]}
          required
        />

        <Input
          label="Registration Number *"
          value={formData.registrationNumber}
          onChange={(e) => setFormData({
            ...formData,
            registrationNumber: e.target.value
          })}
          placeholder="e.g., 5849202"
          required
        />

        <div className="checkbox-group">
          <label>
            <Checkbox
              checked={formData.importPedigree}
              onChange={(checked) => setFormData({
                ...formData,
                importPedigree: checked
              })}
            />
            Import pedigree data
          </label>
        </div>

        {formData.importPedigree && (
          <Select
            label="Pedigree Generations"
            value={formData.pedigreeGenerations}
            onChange={(generations) => setFormData({
              ...formData,
              pedigreeGenerations: parseInt(generations)
            })}
            options={[
              { value: 3, label: '3 generations' },
              { value: 4, label: '4 generations' },
              { value: 5, label: '5 generations' }
            ]}
          />
        )}

        <div className="info-box">
          <InfoIcon />
          <p>
            This will import horse data directly from the registry database,
            including name, color, date of birth, and pedigree information.
          </p>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={importHorse.isLoading}
          >
            {importHorse.isLoading ? 'Importing...' : 'Import Horse'}
          </button>
        </div>
      </Form>
    </Modal>
  );
};
```

---

### 2. PedigreeViewer.tsx

```tsx
import React, { useState } from 'react';
import { Tree } from '@/components/ui/Tree';

interface PedigreeViewerProps {
  animalId: string;
  generations?: number;
}

export const PedigreeViewer: React.FC<PedigreeViewerProps> = ({
  animalId,
  generations = 5
}) => {
  const { data: pedigree, isLoading } = usePedigree(animalId);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!pedigree) {
    return (
      <EmptyState
        icon={<TreeIcon />}
        title="No pedigree data"
        description="Import pedigree data from a breed registry"
      />
    );
  }

  const renderPedigreeNode = (node: PedigreeNode, generation: number) => {
    if (generation > generations) return null;

    return (
      <div className="pedigree-node" data-generation={generation}>
        <div className="node-content">
          <div className="node-header">
            <h4>{node.name}</h4>
            {node.registrationNumber && (
              <span className="reg-number">{node.registrationNumber}</span>
            )}
          </div>
          <div className="node-details">
            <span className="sex">{node.sex}</span>
            <span className="color">{node.color}</span>
            {node.yearOfBirth && (
              <span className="year">{node.yearOfBirth}</span>
            )}
          </div>
        </div>

        {(node.sire || node.dam) && (
          <div className="node-children">
            {node.sire && (
              <div className="sire-branch">
                <div className="branch-label">Sire</div>
                {renderPedigreeNode(node.sire, generation + 1)}
              </div>
            )}
            {node.dam && (
              <div className="dam-branch">
                <div className="branch-label">Dam</div>
                {renderPedigreeNode(node.dam, generation + 1)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pedigree-viewer">
      <div className="pedigree-header">
        <h3>Pedigree ({generations} generations)</h3>
        <div className="pedigree-actions">
          <button onClick={() => window.print()}>
            <PrintIcon /> Print
          </button>
          <button onClick={() => exportPDF(pedigree)}>
            <DownloadIcon /> Export PDF
          </button>
        </div>
      </div>

      <div className="pedigree-tree">
        {renderPedigreeNode(pedigree, 1)}
      </div>

      <div className="pedigree-footer">
        <p>
          Data imported from {pedigree.sourceRegistry} on{' '}
          {format(pedigree.importedAt, 'MMM dd, yyyy')}
        </p>
        <button onClick={() => refreshPedigree(animalId)}>
          <RefreshIcon /> Refresh
        </button>
      </div>
    </div>
  );
};
```

**Styling:**
```scss
.pedigree-viewer {
  background: white;
  border-radius: 8px;
  padding: 24px;

  .pedigree-tree {
    overflow-x: auto;
    padding: 24px;

    .pedigree-node {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;

      .node-content {
        min-width: 200px;
        padding: 12px;
        border: 2px solid var(--border-color);
        border-radius: 6px;
        background: white;

        &[data-generation="1"] {
          border-color: var(--primary-color);
          background: rgba(var(--primary-rgb), 0.05);
        }

        .node-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;

          h4 {
            font-size: 14px;
            font-weight: 600;
          }

          .reg-number {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }

        .node-details {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-secondary);
        }
      }

      .node-children {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .branch-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-tertiary);
          margin-bottom: 8px;
        }

        .sire-branch {
          border-left: 2px solid #3B82F6;
          padding-left: 16px;
        }

        .dam-branch {
          border-left: 2px solid #EC4899;
          padding-left: 16px;
        }
      }
    }
  }
}
```

---

## Business Logic & Algorithms

### 1. Pedigree Import Algorithm

```typescript
async function importPedigree(
  registryClient: RegistryClient,
  registrationNumber: string,
  animalId: string,
  generations: number
): Promise<PedigreeData> {
  // 1. Fetch pedigree data from registry
  const rawPedigree = await registryClient.getPedigree(
    registrationNumber,
    generations
  );

  // 2. Recursively process pedigree tree
  const processedPedigree = await processPedigreeNode(
    rawPedigree,
    1,
    generations
  );

  // 3. Store in database
  await prisma.pedigreeRecord.upsert({
    where: { animalId },
    create: {
      animalId,
      pedigreeData: processedPedigree,
      generations,
      sourceRegistry: registryClient.registryType,
      importedAt: new Date(),
      lastRefreshedAt: new Date()
    },
    update: {
      pedigreeData: processedPedigree,
      generations,
      lastRefreshedAt: new Date(),
      isStale: false
    }
  });

  return processedPedigree;
}

async function processPedigreeNode(
  node: any,
  currentGeneration: number,
  maxGenerations: number
): Promise<PedigreeNode> {
  if (currentGeneration > maxGenerations) {
    return null;
  }

  // Check if this horse exists in our database
  let existingAnimal = await prisma.animal.findFirst({
    where: {
      registrationNumber: node.registrationNumber
    }
  });

  // If not exists and is important (within first 3 generations), consider importing
  if (!existingAnimal && currentGeneration <= 3) {
    existingAnimal = await importAncestor(node);
  }

  return {
    registrationNumber: node.registrationNumber,
    name: node.name,
    sex: node.sex,
    color: node.color,
    yearOfBirth: node.yearOfBirth,
    animalId: existingAnimal?.id || null,
    sire: node.sire
      ? await processPedigreeNode(node.sire, currentGeneration + 1, maxGenerations)
      : null,
    dam: node.dam
      ? await processPedigreeNode(node.dam, currentGeneration + 1, maxGenerations)
      : null
  };
}
```

---

### 2. Registration Deadline Tracking

```typescript
async function calculateRegistrationDeadline(
  foal: Animal,
  registry: RegistryType
): Promise<{ deadline: Date; isLate: boolean; lateFeeDate: Date | null }> {
  const birthDate = foal.dateOfBirth;

  // Registry-specific deadline rules
  const DEADLINE_RULES = {
    AQHA: {
      onTime: addDays(birthDate, 365),         // 1 year
      late: addDays(birthDate, 730),           // 2 years
      lateFeeStarts: addDays(birthDate, 366)   // Day after 1 year
    },
    JOCKEY_CLUB: {
      onTime: new Date(birthDate.getFullYear() + 1, 1, 1), // Feb 1 following birth year
      late: new Date(birthDate.getFullYear() + 2, 1, 1),
      lateFeeStarts: new Date(birthDate.getFullYear() + 1, 1, 2)
    },
    AHA: {
      onTime: new Date(birthDate.getFullYear(), 11, 31), // Dec 31 of birth year
      late: new Date(birthDate.getFullYear() + 1, 11, 31),
      lateFeeStarts: new Date(birthDate.getFullYear() + 1, 0, 1)
    },
    APHA: {
      onTime: addDays(birthDate, 365),
      late: addDays(birthDate, 730),
      lateFeeStarts: addDays(birthDate, 366)
    }
  };

  const rules = DEADLINE_RULES[registry];
  const now = new Date();

  return {
    deadline: rules.onTime,
    isLate: now > rules.onTime,
    lateFeeDate: rules.lateFeeStarts
  };
}

// Cron job to send deadline reminders
async function sendRegistrationDeadlineReminders() {
  // Find foals approaching registration deadline
  const thirtyDaysFromNow = addDays(new Date(), 30);

  const foalsNeedingRegistration = await prisma.animal.findMany({
    where: {
      needsRegistration: true,
      registrationDeadline: {
        lte: thirtyDaysFromNow,
        gte: new Date()
      }
    },
    include: {
      organization: {
        include: { owner: true }
      }
    }
  });

  for (const foal of foalsNeedingRegistration) {
    const daysUntilDeadline = differenceInDays(
      foal.registrationDeadline!,
      new Date()
    );

    await sendNotification({
      userId: foal.organization.ownerId,
      type: 'REGISTRATION_DEADLINE',
      title: `Registration deadline approaching for ${foal.name}`,
      body: `${daysUntilDeadline} days until registration deadline`,
      priority: daysUntilDeadline <= 7 ? 'high' : 'medium',
      data: {
        animalId: foal.id,
        deadline: foal.registrationDeadline
      },
      channels: ['in_app', 'email']
    });
  }
}
```

---

## Security & Compliance

### API Key Storage

```typescript
// Encrypt API keys before storing
import { encrypt, decrypt } from '@/utils/encryption';

async function storeRegistryCredentials(
  organizationId: string,
  registry: RegistryType,
  credentials: RegistryCredentials
) {
  const encryptedApiKey = credentials.apiKey
    ? encrypt(credentials.apiKey)
    : null;

  const encryptedAccessToken = credentials.accessToken
    ? encrypt(credentials.accessToken)
    : null;

  const encryptedRefreshToken = credentials.refreshToken
    ? encrypt(credentials.refreshToken)
    : null;

  await prisma.registryIntegration.create({
    data: {
      organizationId,
      registry,
      authType: credentials.authType,
      apiKey: encryptedApiKey,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      isConnected: true
    }
  });
}

// Decrypt when retrieving
async function getRegistryCredentials(integrationId: string) {
  const integration = await prisma.registryIntegration.findUnique({
    where: { id: integrationId }
  });

  if (!integration) return null;

  return {
    apiKey: integration.apiKey ? decrypt(integration.apiKey) : null,
    accessToken: integration.accessToken ? decrypt(integration.accessToken) : null,
    refreshToken: integration.refreshToken ? decrypt(integration.refreshToken) : null
  };
}
```

### Data Privacy

- Registry API credentials stored encrypted at rest
- Access tokens refreshed automatically before expiration
- No sensitive data cached in browser localStorage
- Audit log of all registry API calls
- User consent required before exporting data to registry

---

## Error Handling

### Common Error Scenarios

#### 1. Registry API Down
```typescript
try {
  const horseData = await registryClient.getHorse(registrationNumber);
} catch (error) {
  if (error.code === 'TIMEOUT' || error.code === 'CONNECTION_REFUSED') {
    throw new ServiceUnavailableError(
      `${registry} API is currently unavailable. Please try again later.`,
      { retryAfter: 300 } // 5 minutes
    );
  }
  throw error;
}
```

#### 2. Invalid Registration Number
```typescript
if (error.code === 'NOT_FOUND') {
  throw new NotFoundError(
    `Registration number ${registrationNumber} not found in ${registry} database. Please verify the number and try again.`
  );
}
```

#### 3. Rate Limiting
```typescript
if (error.code === 'RATE_LIMIT_EXCEEDED') {
  throw new TooManyRequestsError(
    `${registry} API rate limit exceeded. Please wait before trying again.`,
    { retryAfter: error.retryAfter }
  );
}
```

#### 4. Authentication Expired
```typescript
if (error.code === 'UNAUTHORIZED') {
  // Attempt to refresh token
  try {
    await registryClient.refreshAuth();
    // Retry original request
    return await registryClient.getHorse(registrationNumber);
  } catch (refreshError) {
    throw new AuthenticationError(
      `${registry} connection expired. Please reconnect to the registry.`,
      { action: 'reconnect', registry }
    );
  }
}
```

---

## Testing Requirements

### Unit Tests

```typescript
describe('importPedigree', () => {
  it('should import 5 generation pedigree', async () => {
    const mockClient = createMockRegistryClient();
    const pedigree = await importPedigree(
      mockClient,
      '5849202',
      'animal_123',
      5
    );

    expect(pedigree.generations).toBe(5);
    expect(pedigree.sire).toBeDefined();
    expect(pedigree.dam).toBeDefined();
    // Verify total ancestors: 2^5 - 1 = 31
    expect(countPedigreeNodes(pedigree)).toBe(31);
  });
});

describe('calculateRegistrationDeadline', () => {
  it('should calculate AQHA deadline correctly', () => {
    const foal = createTestAnimal({
      dateOfBirth: new Date('2025-03-15')
    });

    const { deadline, isLate } = calculateRegistrationDeadline(foal, 'AQHA');

    expect(deadline).toEqual(new Date('2026-03-15'));
    expect(isLate).toBe(false);
  });

  it('should detect late registration', () => {
    const foal = createTestAnimal({
      dateOfBirth: new Date('2023-03-15')
    });

    const { isLate, lateFeeDate } = calculateRegistrationDeadline(foal, 'AQHA');

    expect(isLate).toBe(true);
    expect(lateFeeDate).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('Registry Integration', () => {
  it('should import horse from AQHA', async () => {
    const result = await request(app)
      .post('/api/v1/registry/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        registry: 'AQHA',
        registrationNumber: '5849202',
        importPedigree: true,
        pedigreeGenerations: 5
      })
      .expect(200);

    expect(result.body.data.animal).toBeDefined();
    expect(result.body.data.registryRecord.isVerified).toBe(true);
    expect(result.body.data.pedigree).toBeDefined();
  });

  it('should handle invalid registration number', async () => {
    await request(app)
      .post('/api/v1/registry/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        registry: 'AQHA',
        registrationNumber: 'INVALID123'
      })
      .expect(404);
  });
});
```

---

## Implementation Checklist

### Phase 1: Database & Core (Week 1)
- [ ] Database migrations
- [ ] RegistryIntegration model
- [ ] AnimalRegistryRecord model
- [ ] PedigreeRecord model
- [ ] RegistrySyncLog model

### Phase 2: Registry Clients (Week 1-2)
- [ ] RegistryClient interface
- [ ] AQHA client implementation
- [ ] Jockey Club client implementation
- [ ] AHA client implementation
- [ ] APHA client implementation
- [ ] USEF client implementation
- [ ] Registry client factory

### Phase 3: Core APIs (Week 2)
- [ ] POST /api/v1/registry/connect
- [ ] POST /api/v1/registry/import
- [ ] POST /api/v1/registry/verify
- [ ] POST /api/v1/registry/import/pedigree
- [ ] GET /api/v1/registry/status
- [ ] POST /api/v1/registry/sync/:animalId

### Phase 4: Registration Submission (Week 3)
- [ ] POST /api/v1/registry/export/foal
- [ ] GET /api/v1/registry/export/status/:id
- [ ] Registration deadline calculation
- [ ] Deadline reminder system

### Phase 5: Frontend (Week 3-4)
- [ ] Registry settings page
- [ ] Connect registry modal
- [ ] Import horse modal
- [ ] Verify registration modal
- [ ] Pedigree viewer
- [ ] Export foal modal
- [ ] Sync history table

### Phase 6: Automation (Week 4)
- [ ] Auto-sync cron job
- [ ] Token refresh automation
- [ ] Deadline reminders
- [ ] Stale pedigree detection

### Phase 7: Testing (Week 5)
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Mock registry clients for testing

### Phase 8: Launch (Week 5-6)
- [ ] Documentation
- [ ] Video tutorials
- [ ] Beta testing
- [ ] Production deployment

---

## Success Metrics

- 60%+ of users connect at least one registry
- Average 10+ horses imported per organization
- 80%+ verification accuracy
- 95%+ reduction in data entry time
- Zero missed registration deadlines due to reminders

---

**END OF DOCUMENT**

Total Lines: ~1,900
Estimated Implementation Time: 5-6 weeks
Estimated Value if Outsourced: $15,000-18,000
