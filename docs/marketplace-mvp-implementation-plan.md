# Marketplace MVP Implementation Plan

> Generated from brainstorming session on 2026-01-11

## Executive Summary

This document outlines the implementation plan for enhancing the BreederHQ Marketplace to MVP level. The core architectural change is promoting `BreedingProgram` from a JSON blob in TenantSettings to a first-class database entity, enabling proper linkage between breeding plans, offspring groups, and marketplace listings.

---

## Implementation Status

> Updated: 2026-01-11

| Phase | Feature | Status | Documentation |
|-------|---------|--------|---------------|
| 1.1 | BreedingProgram table | COMPLETE | [breeding-programs.md](./marketplace/breeding-programs.md) |
| 1.2 | BreedingPlan.programId | COMPLETE | [breeding-programs.md](./marketplace/breeding-programs.md) |
| 1.3 | AnimalListingIntent enum | COMPLETE | [animal-listings.md](./marketplace/animal-listings.md) |
| 1.4 | Data migration | COMPLETE | - |
| 1.5 | BreedingProgram API | COMPLETE | [api-reference.md](./marketplace/api-reference.md) |
| 2.x | Breeding Plan form updates | COMPLETE | - |
| 3.x | Program management UI | COMPLETE | [breeding-programs.md](./marketplace/breeding-programs.md) |
| 4.x | Consumer marketplace UI | COMPLETE | - |
| 5.x | Breeder services | COMPLETE | [breeder-services.md](./marketplace/breeder-services.md) |
| 6.x | Service provider portal | COMPLETE | [service-provider-portal.md](./marketplace/service-provider-portal.md) |
| 7.x | Origin tracking | COMPLETE | [origin-tracking.md](./marketplace/origin-tracking.md) |

### Detailed Documentation

See the [marketplace documentation folder](./marketplace/README.md) for comprehensive docs:

- [README.md](./marketplace/README.md) - Overview and architecture
- [breeding-programs.md](./marketplace/breeding-programs.md) - BreedingProgram entity
- [animal-listings.md](./marketplace/animal-listings.md) - Animal listing intents
- [breeder-services.md](./marketplace/breeder-services.md) - Breeder service listings
- [service-provider-portal.md](./marketplace/service-provider-portal.md) - Non-breeder service providers
- [origin-tracking.md](./marketplace/origin-tracking.md) - Conversion attribution
- [api-reference.md](./marketplace/api-reference.md) - Complete API docs

---

## Decision Log

### Navigation & Discovery
| Decision | Answer |
|----------|--------|
| Primary browsing model | Programs are first-class browsable entities (not buried in breeder profiles) |
| Dual entry points | Browse Programs AND Browse Breeders both supported |
| Breeder business page | Hub showing all programs, animals, services |

### Data Model
| Decision | Answer |
|----------|--------|
| BreedingProgram | Promote from JSON to database table |
| BreedingPlan.programId | Required field (manual selection, no auto-inference) |
| Program creation | Inline creation in Breeding Plan form if none exist |
| Orphan plans | Explicit choice, soft warning about marketplace limitations |
| Duplicate breed warning | Soft warning, not hard block |
| ServiceListing | Use existing `MarketplaceListing` table (single table for all services) |

### Offspring/Animals Display
| Decision | Answer |
|----------|--------|
| Offspring Group naming | `{Breeder Name} - {Breed} - {Birth Month/Year}` |
| Animals page logic | Orphan = individual card; Group with 1 = individual card; Group with 2+ = group card |
| Within Program page | All offspring groups shown regardless of count |

### Conversion Actions
| Decision | Answer |
|----------|--------|
| Breeder | "Message Breeder" (DM) |
| Program | "Inquire", "Join Waitlist", "Make Reservation" |
| Offspring Group | "Inquire about this offspring" |
| Stud Service | "Inquire" only (MVP) |
| Services | "Message Provider" (DM only for MVP) |
| All actions | MUST track origin listing context |

### Waitlist vs Reservation
| Decision | Answer |
|----------|--------|
| Waitlist | Interest, no payment |
| Reservation | Deposit for specific offspring group |
| Toggle | Per-program setting for auto-accept reservations vs manual waitlist |

### Animal Listing Intents
| Decision | Answer |
|----------|--------|
| Remove | SHOWCASE |
| Keep | STUD, GUARDIAN, BROOD_PLACEMENT, REHOME |
| Add | TRAINED, WORKING, STARTED, CO_OWNERSHIP |

### Services
| Decision | Answer |
|----------|--------|
| Breeders offering services | YES - appears in Services section AND on their business page |
| Service Provider MVP scope | FULL - Profile, listings, messaging, Stripe invoicing, booking/availability |
| Non-breeder service providers | Own account type via marketplace.breederhq.com |

### Visibility/Privacy Rules
| Entity | Default | Toggle Location | Rule |
|--------|---------|-----------------|------|
| Breeding Program | Not listed | Program settings in Marketplace module | Manual publish |
| Offspring Group | "Coming soon" when plan ready | Program settings in Marketplace module | Auto-show, can hide |
| Individual Offspring | Visible | Program settings in Marketplace module | Auto-show, can hide |
| Dam/Sire on Program listing | Per animal privacy settings | Animals module Privacy tab | Respects existing privacy toggles |
| Breeder Services | Draft | Marketplace module | Manual publish |

---

## Data Model Changes

### New: BreedingProgram Table

```prisma
model BreedingProgram {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Identity
  slug      String   // URL-friendly identifier, unique per tenant
  name      String   // "Goldendoodle Program"
  description String? @db.Text
  species   Species
  breedText String?  // "Goldendoodle", "Bernedoodle (F1b)", etc.

  // Marketplace Settings
  listed              Boolean @default(false)
  acceptInquiries     Boolean @default(true)
  openWaitlist        Boolean @default(false)
  acceptReservations  Boolean @default(false) // Auto-accept deposits vs manual

  // Pricing & Details
  pricingTiers    Json?    // [{tier: "Pet", priceRange: "$2,500", description: "..."}]
  whatsIncluded   String?  @db.Text // What comes with each animal
  typicalWaitTime String?  // "3-6 months"

  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?

  // Relations
  breedingPlans BreedingPlan[]
  media         BreedingProgramMedia[]

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([listed])
  @@index([species])
}

model BreedingProgramMedia {
  id        Int              @id @default(autoincrement())
  programId Int
  program   BreedingProgram  @relation(fields: [programId], references: [id], onDelete: Cascade)
  tenantId  Int
  tenant    Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  assetUrl  String
  caption   String?
  sortOrder Int     @default(0)
  isPublic  Boolean @default(true) // Visibility toggle

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([programId])
  @@index([tenantId])
}
```

### Modified: BreedingPlan

```prisma
model BreedingPlan {
  // ... existing fields ...

  // NEW: Program linkage
  programId Int?
  program   BreedingProgram? @relation(fields: [programId], references: [id], onDelete: SetNull)

  @@index([programId])
}
```

### Modified: AnimalListingIntent Enum

```prisma
enum AnimalListingIntent {
  STUD              // Stud services
  GUARDIAN          // Guardian placement program (renamed from GUARDIAN_PLACEMENT)
  BROOD_PLACEMENT   // Breeding female placement/co-ownership
  REHOME            // Rehoming (any reason)
  TRAINED           // Fully trained dogs for sale
  WORKING           // Working dogs (herding, service, detection, etc.)
  STARTED           // Started/partially trained dogs
  CO_OWNERSHIP      // Seeking co-owner arrangements
  // SHOWCASE - REMOVED
}
```

---

## Phase 1: Data Model Foundation

### 1.1 Create BreedingProgram Table
- [ ] Add `BreedingProgram` model to schema.prisma
- [ ] Add `BreedingProgramMedia` model to schema.prisma
- [ ] Create migration

### 1.2 Add programId to BreedingPlan
- [ ] Add `programId` field to `BreedingPlan` model
- [ ] Add foreign key relationship
- [ ] Add index on programId
- [ ] Create migration

### 1.3 Update AnimalListingIntent Enum
- [ ] Remove SHOWCASE
- [ ] Add TRAINED, WORKING, STARTED, CO_OWNERSHIP
- [ ] Create migration
- [ ] Update any code referencing SHOWCASE

### 1.4 Migration Script for Existing Data
- [ ] Extract programs from TenantSetting JSON → BreedingProgram rows
- [ ] Generate slugs for each program
- [ ] Existing BreedingPlans remain with programId = null (orphaned)
- [ ] Preserve all existing program data (pricing, description, etc.)

### 1.5 API Updates
- [ ] Create CRUD endpoints for BreedingProgram
  - `GET /api/v1/breeding/programs` - List tenant's programs
  - `POST /api/v1/breeding/programs` - Create program
  - `GET /api/v1/breeding/programs/:id` - Get program
  - `PUT /api/v1/breeding/programs/:id` - Update program
  - `DELETE /api/v1/breeding/programs/:id` - Delete program
- [ ] Update `POST /api/v1/breeding/plans` to accept programId
- [ ] Create media endpoints for program photos

---

## Phase 2: Breeding Plan Form Update

### 2.1 Add Program Selector

**Location:** `apps/breeding/src/App-Breeding.tsx` (New Breeding Plan modal)

**Changes:**
- [ ] Add state for program selection: `programId`, `programOptions`
- [ ] Fetch programs on modal open
- [ ] Add Program dropdown as FIRST field in form
- [ ] Options: existing programs + "Create New Program" + "No Program (Orphan)"
- [ ] Update `canCreate` validation to require program selection (or explicit orphan)

**UI Mockup:**
```
┌─────────────────────────────────────────────────┐
│ New Breeding Plan                           ✕   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Program *                                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Select a program...                       ▼ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Plan Name *                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ Luna × TBD, Fall 2026                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ... rest of existing fields ...                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2.2 Inline Program Creation Modal

**Trigger:** User selects "Create New Program" from dropdown

**UI Mockup:**
```
┌─────────────────────────────────────────────────┐
│ Quick Program Setup                         ✕   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Program Name *                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Goldendoodle Program                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Breed *                                         │
│ ┌─────────────────────────────────────────────┐ │
│ │ Goldendoodle                              ▼ │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Description (optional)                          │
│ ┌─────────────────────────────────────────────┐ │
│ │                                             │ │
│ │                                             │ │
│ └─────────────────────────────────────────────┘ │
│ You can add more details later in Marketplace   │
│ Settings.                                       │
│                                                 │
│              [Cancel]  [Create & Select]        │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- [ ] Create `CreateProgramDialog` component
- [ ] Minimal fields: name (required), breed (required), description (optional)
- [ ] On submit: create program via API, auto-select in plan form
- [ ] Soft warning for duplicate breed name

### 2.3 Orphan Warning

When user selects "No Program (Orphan)":
- [ ] Show inline warning message
- [ ] Text: "Plans without a program won't appear in your marketplace program listings. You can assign a program later if needed."

### 2.4 Update API Call

- [ ] Modify `doCreatePlan` to include `programId` in payload
- [ ] Backend validation: programId must belong to same tenant (or be null)

---

## Phase 3: Marketplace Module - Breeding Program Management

### 3.1 Breeding Program Settings Page

**Location:** New page in `apps/platform/src/` or `apps/marketing/src/`

**Route:** `/settings/marketplace/programs/:programId` or similar

**Sections:**

#### Program Details
- [ ] Program name (editable)
- [ ] Description (rich text or textarea)
- [ ] Breed display
- [ ] Species display

#### Marketplace Visibility
- [ ] Listed toggle (publish/unpublish)
- [ ] Published date display

#### Availability Options
- [ ] Accept Inquiries toggle
- [ ] Open Waitlist toggle
- [ ] Accept Reservations toggle (auto-accept deposits)

#### Pricing & Details
- [ ] Pricing tiers editor (add/edit/remove tiers)
- [ ] What's Included textarea
- [ ] Typical Wait Time input

### 3.2 Offspring Group Management

**Within Program Settings page:**

- [ ] Section: "Offspring Groups"
- [ ] List all OffspringGroups linked via BreedingPlan.programId
- [ ] For each group show:
  - Group name / identifier
  - Birth date (expected or actual)
  - Plan status
  - Offspring count
  - Visibility toggle
- [ ] Default visibility: "Coming Soon" when plan status indicates readiness
- [ ] Breeder can toggle off visibility per group

**Query:**
```sql
SELECT og.*
FROM OffspringGroup og
JOIN BreedingPlan bp ON og.planId = bp.id
WHERE bp.programId = :programId
```

### 3.3 Individual Offspring Visibility

**Within each Offspring Group row (expandable):**

- [ ] List individual offspring
- [ ] Per-offspring visibility toggle
- [ ] Default: visible
- [ ] Show: name/collar, sex, status, price

### 3.4 Program Media Tab

**Separate tab within Program Settings:**

- [ ] Photo upload functionality
- [ ] Grid display of uploaded photos
- [ ] Per-photo public/private toggle
- [ ] Drag-to-reorder (sortOrder)
- [ ] Caption editing
- [ ] Delete photo

**Implementation:**
- [ ] Reuse patterns from Animals module media handling
- [ ] Asset upload to existing storage
- [ ] Save to BreedingProgramMedia table

---

## Phase 4: Marketplace Consumer UI

### 4.1 Programs Browsing Page

**Route:** `/programs`

**Features:**
- [ ] Grid/list of published programs
- [ ] Filters: species, breed, location
- [ ] Search by breeder name, breed
- [ ] Card display:
  ```
  ┌─────────────────────────────────────────┐
  │ [Photo]                                 │
  │ Sunny Meadows Goldens                   │
  │ Golden Retriever                        │
  │ Austin, TX                              │
  │                                         │
  │ 🐕 Available Now · Waitlist Open        │
  │ $2,500 - $3,000                         │
  └─────────────────────────────────────────┘
  ```

### 4.2 Program Detail Page

**Route:** `/programs/:slug`

**Sections:**
- [ ] Header: Program name, breeder name (linked), location
- [ ] Photo gallery (from BreedingProgramMedia where isPublic=true)
- [ ] Description
- [ ] Pricing tiers
- [ ] What's Included
- [ ] Typical Wait Time
- [ ] Dam/Sire section (respecting Privacy settings)
- [ ] Available/Upcoming offspring groups
- [ ] Action buttons: Inquire, Join Waitlist, Make Reservation

**Dam/Sire Display Logic:**
```typescript
// Fetch dam/sire from BreedingPlans in this program
// For each animal, check AnimalPrivacySettings
// Only display fields where privacy setting = true
// e.g., showName, showPhoto, enableHealthSharing, showTitles
```

### 4.3 Animals Page Updates

**Route:** `/animals`

**Display Logic:**
```typescript
function getDisplayMode(offspring) {
  if (!offspring.groupId) return 'individual'; // Orphan

  const groupCount = getAvailableCountInGroup(offspring.groupId);
  if (groupCount === 1) return 'individual';
  return 'group';
}
```

**Card Naming:**
- Group cards: `{Breeder Name} - {Breed} - {Birth Month/Year}`
- Individual cards: Animal name or identifier

### 4.4 Breeder Business Page

**Route:** `/breeders/:slug`

**Sections:**
- [ ] Breeder profile info (existing)
- [ ] Programs section: All published programs
- [ ] Services section: All breeder's service listings
- [ ] Animals section: All animal listings (stud, rehome, etc.)

---

## Phase 5: Services for Breeders

### 5.1 Service Creation UI

**Location:** Marketplace module, breeder portal

**Features:**
- [ ] Create service listing form
- [ ] Uses existing MarketplaceListing table with tenantId set
- [ ] Categories: Training, Grooming, Delivery, Boarding, Stud, etc.
- [ ] Fields: title, description, pricing, location, images, availability

### 5.2 Service Management

- [ ] List breeder's services
- [ ] Edit/delete functionality
- [ ] Publish/pause toggle

### 5.3 Display Integration

- [ ] Services appear in `/services` browse
- [ ] Services appear on breeder's business page

---

## Phase 6: Service Provider Portal (Non-Breeder)

### 6.1 Account Creation

**Location:** marketplace.breederhq.com

- [ ] Registration flow for service providers
- [ ] Create ServiceProviderProfile
- [ ] Email verification
- [ ] Profile setup wizard

### 6.2 Service Provider Dashboard

- [ ] Profile management (business name, bio, location, contact)
- [ ] Service listing CRUD
- [ ] Messaging inbox
- [ ] Analytics (views, inquiries)

### 6.3 Stripe Connect Integration

- [ ] Onboarding flow (Connect Express or Standard)
- [ ] Account status display
- [ ] Invoice creation UI
- [ ] Payment history
- [ ] Payout settings

### 6.4 Booking/Availability Calendar

- [ ] Availability management UI
- [ ] Set available days/times
- [ ] Booking request handling
- [ ] Calendar view of bookings

---

## Phase 7: Messaging & Tracking

### 7.1 Origin Tracking

**All conversion actions must capture:**
```typescript
interface InquiryContext {
  listingType: 'breeder' | 'program' | 'offspring_group' | 'animal' | 'service';
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  programId?: string;
  programName?: string;
  breederId: string;
  breederName: string;
  timestamp: string;
}
```

**Implementation:**
- [ ] Update inquiry submission to include context
- [ ] Update waitlist request to include context
- [ ] Update reservation to include context
- [ ] Store context in MessageThread or separate tracking table

### 7.2 Display in Breeder Inbox

- [ ] Show origin context badge on each conversation
- [ ] Filter conversations by origin type
- [ ] Example: "Inquiry about Goldendoodle Program"

### 7.3 Display in Waitlist

- [ ] Show which program/listing the request came from
- [ ] Group waitlist by program

---

## Priority & Sequencing

| Priority | Phase | Description | Dependencies |
|----------|-------|-------------|--------------|
| P0 | 1.1-1.2 | BreedingProgram table + programId on BreedingPlan | None |
| P0 | 1.3 | AnimalListingIntent enum update | None |
| P0 | 1.4 | Data migration | 1.1, 1.2 |
| P0 | 1.5 | API endpoints | 1.1, 1.2 |
| P0 | 2.1-2.4 | Breeding Plan form updates | 1.5 |
| P1 | 3.1-3.4 | Program management UI | 1.5, 2.x |
| P1 | 4.1-4.4 | Consumer marketplace UI | 3.x |
| P1 | 7.1-7.3 | Origin tracking | 4.x |
| P2 | 5.1-5.3 | Breeder services | 1.x |
| P3 | 6.1-6.4 | Service provider portal | 5.x |

---

## File Locations Reference

| Component | Current Location |
|-----------|------------------|
| Breeding Plan Form | `apps/breeding/src/App-Breeding.tsx` (lines 5541-5789) |
| Marketplace Settings | `apps/platform/src/components/MarketplaceSettingsTab.tsx` |
| Animal Privacy Tab | `apps/animals/src/components/PrivacyTab.tsx` |
| Marketplace Consumer App | `apps/marketplace/src/` |
| API Types | `apps/marketplace/src/api/types.ts` |
| Prisma Schema | `breederhq-api/prisma/schema.prisma` |
| Marketplace API Routes | `breederhq-api/src/routes/marketplace-*.ts` |

---

## Open Items / Future Considerations

1. **Program-level analytics** - Views, inquiries, conversion rates per program
2. **SEO optimization** - Meta tags, structured data for program pages
3. **Email notifications** - New inquiry, waitlist request, reservation alerts
4. **Mobile app considerations** - API structure for future mobile app
5. **Bulk operations** - Bulk update offspring visibility, bulk pricing updates
6. **Program templates** - Pre-built program configurations for common scenarios
7. **Reviews/testimonials** - Buyer feedback on programs (post-MVP)
