# v2 Marketplace Management: Gap Analysis

**Date:** 2026-01-12
**Purpose:** Compare v2 specification requirements against current backend capabilities to identify what exists, what needs building, and what needs enhancement.

---

## Executive Summary

| Component | Backend Status | Frontend Status | Gap Severity | Priority |
|-----------|---------------|-----------------|--------------|----------|
| **Section 1: My Storefront** | ⚠️ Partial (missing some fields) | ❌ NO UI | HIGH | Phase 1 |
| **Section 2: Breeding Programs** | ✅ EXISTS (full CRUD + media) | ⚠️ Basic CRUD only (missing media, plan links) | CRITICAL | Phase 1 |
| **Section 3: Animal Listings** | ✅ EXISTS (full schema + API) | ❌ NO UI | CRITICAL | Phase 1 |
| **Section 4: Offspring Groups** | ✅ EXISTS | ⚠️ Partial (missing pricing controls) | MEDIUM | Phase 1 |
| **Section 5: Service Listings** | ⚠️ EXISTS (basic schema, needs expansion) | ✅ EXISTS (hidden in nav) | MEDIUM | Phase 1 |
| **Section 6: Inquiries/Messaging** | ⚠️ Basic messaging exists | ⚠️ Basic UI exists | MEDIUM | Phase 1 |
| **Section 7: Waitlist** | ✅ EXISTS | ⚠️ Basic UI | LOW | Phase 2 |
| **Section 8: Infrastructure** | ❌ Most features missing | ❌ Not built | HIGH | Phase 1-3 |

**Key Finding:** Backend has significant marketplace infrastructure already built (Programs, Animals, Services schemas + APIs), but frontend is severely lacking. Section 8 infrastructure (payments, bookings, reviews) needs to be built from scratch.

---

## Section 1: My Storefront

### v2 Spec Requirements (from [v2-marketplace-management.md:92-345](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L92))

**Data Sources:**
- Tenant (business name, bio, location, policies, programs)
- Breeder (social links, photos)
- Programs (featured program selection)
- Computed trust badges

**Sections:**
1. Breeder Identity (name, species, breed, photo, bio)
2. Media Gallery (photos, videos, captions)
3. Trust Badges (verification, health testing, experience)
4. Location & Policies (city/state, application required, contract, health guarantee)
5. Featured Programs
6. Contact Info
7. Social Links

### Current Backend Support

**✅ EXISTS:**
- `Tenant` table has: name, bio, city, state
- `Breeder` table has: socialLinks (JSON)
- `BreedingProgram` relation exists

**⚠️ PARTIAL:**
- Tenant missing: photo, tagline, policies structure
- No trust badge computation logic
- No "featured programs" ordering

**❌ MISSING:**
- Media gallery (separate from program media)
- Verification status tracking
- Years experience calculation
- Health testing compliance tracking

### Current UI Status

**❌ NO UI EXISTS** for "My Storefront" management page

**What Exists:**
- Public breeder profile page exists at `/breeders/:slug`
- Shows basic tenant info pulled from database

### Gap Summary

| Feature | Backend | Frontend | Action Needed |
|---------|---------|----------|---------------|
| Business name/bio | ✅ | ❌ | Build UI |
| Media gallery | ❌ | ❌ | Add schema + API + UI |
| Trust badges | ❌ Logic | ❌ | Build badge computation + UI |
| Policies (structured) | ❌ | ❌ | Add schema + UI |
| Featured programs | ⚠️ Partial | ❌ | Add ordering + UI |
| Social links | ✅ | ❌ | Build UI |

**Priority:** HIGH - This is the "landing page" for breeders, critical for trust/credibility

---

## Section 2: Breeding Programs

### v2 Spec Requirements (from [v2-marketplace-management.md:347-627](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L347))

**UX Model:** Preview-first, toggle-to-hide pattern

**Data Elements:**
- Program identity (name, species, breed, description, story)
- Media (cover image, gallery, videos with captions/order)
- Featured parents (from Animals, with health/pedigree/titles pulled from Animal records)
- Raising protocols (inherit from Storefront or override)
- Placement package (inherit from Storefront or override)
- Pricing tiers
- Linked litters (Upcoming, Available, Past - from BreedingPlans)
- Breeder snapshot (from Storefront)

### Current Backend Support

**✅ FULLY EXISTS:**
- `BreedingProgram` table with: slug, name, description, species, breedText
- Pricing tiers (JSON array)
- What's included, typical wait time
- `listed`, `acceptInquiries`, `openWaitlist`, `acceptReservations` toggles
- `publishedAt` timestamp
- `BreedingProgramMedia` relation (image URLs, captions, sort order)
- `breedingPlans[]` relation (connects to litters)

**APIs (from [backend-capabilities.md:38-42](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L38)):**
```
GET    /api/v1/breeding/programs                    # List with _count.breedingPlans
GET    /api/v1/breeding/programs/:id                # Detail with media + recent plans
POST   /api/v1/breeding/programs                    # Create
PUT    /api/v1/breeding/programs/:id                # Update
DELETE /api/v1/breeding/programs/:id                # Delete

GET    /api/v1/breeding/programs/:id/media          # Get media
POST   /api/v1/breeding/programs/:id/media          # Upload
PUT    /api/v1/breeding/programs/:programId/media/:mediaId  # Update caption/order
DELETE /api/v1/breeding/programs/:programId/media/:mediaId
POST   /api/v1/breeding/programs/:id/media/reorder  # Reorder
```

**⚠️ PARTIAL:**
- Featured parents: `Animal` relation exists, but no explicit "featured" flag or ordering
- Raising protocols: No structured field (just free text in "what's included"?)
- Placement package: Same - no structured field

**❌ MISSING:**
- "Inherit from Storefront" toggle for protocols/package
- Program story (separate from description)
- Video support (schema supports, but not in media API?)

### Current UI Status (from [backend-capabilities.md:44-66](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L44))

**✅ EXISTS:** [ProgramsSettingsPage.tsx](apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx)
- Name, species, breed, description ✓
- Pricing tiers editor ✓
- What's Included, Typical Wait Time ✓
- Toggles: Listed, Accept Inquiries, Open Waitlist, Accept Reservations ✓

**❌ MISSING from UI:**
- Media gallery management (API exists!)
- Connected breeding plans display (shows count, not details)
- "Upcoming litters" view (plans in COMMITTED → PREGNANT)
- "Available now" view (plans in BIRTHED → PLACEMENT)
- Dam/Sire showcase
- Health testing display for parents
- Raising protocols structured editor
- Placement package structured editor
- Preview-first, toggle-to-hide pattern (v2 spec requirement)

### Gap Summary

| Feature | Backend | Frontend | Action Needed |
|---------|---------|----------|---------------|
| Basic program CRUD | ✅ | ✅ | Already done |
| Media gallery | ✅ API exists | ❌ | **Build UI** |
| Linked litters display | ✅ Relation exists | ❌ Count only | **Build UI** to show plan details |
| Featured parents | ⚠️ Need ordering | ❌ | Add `featuredOrder` field + UI |
| Raising protocols (structured) | ❌ | ❌ | Add schema + UI |
| Placement package (structured) | ❌ | ❌ | Add schema + UI |
| "Inherit from Storefront" | ❌ | ❌ | Add fields + UI |
| Preview-first UX pattern | N/A | ❌ | **Redesign UI** |

**Priority:** CRITICAL - Programs are core marketplace feature, missing key display elements

---

## Section 3: Animal Listings

### v2 Spec Requirements (from [v2-marketplace-management.md:630-1356](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L630))

**UX Model:** Preview-first, toggle-to-hide pattern

**Key Requirements:**
- Separate "Public Card Content" (stored on Animal record, reusable) from "Listing-specific data" (intent, pricing, location override)
- Public Card Content on Animal: headline, title override, primary photo override, summary, description
- Listing data: intent (STUD, REHOME, GUARDIAN, etc.), price model, pricing, location override, URL slug
- Full animal data pulled in: photos, health tests, genetic results, titles, pedigree, documents

### Current Backend Support (from [backend-capabilities.md:131-212](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L131))

**✅ FULLY EXISTS:** `AnimalPublicListing` schema
```prisma
model AnimalPublicListing {
  animalId    Int    @unique
  animal      Animal

  urlSlug     String? @unique
  intent      AnimalListingIntent?  // STUD, BROOD_PLACEMENT, REHOME, GUARDIAN, etc.
  status      AnimalListingStatus   // DRAFT, LIVE, PAUSED

  headline    String?
  title       String?
  summary     String?
  description String?

  // Location override
  locationCity    String?
  locationRegion  String?
  locationCountry String?

  // Pricing
  priceModel    String?  // fixed, range, negotiable, inquire
  priceCents    Int?
  priceMinCents Int?
  priceMaxCents Int?
  priceText     String?

  detailsJson   Json?    // Intent-specific details

  publishedAt   DateTime?
  pausedAt      DateTime?
}

enum AnimalListingIntent {
  STUD
  BROOD_PLACEMENT
  REHOME
  GUARDIAN
  TRAINED
  WORKING
  STARTED
  CO_OWNERSHIP
}
```

**APIs (from [backend-capabilities.md:178-186](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L178)):**
```
GET    /api/v1/animals/:id/public-listing         # Get listing for animal
PUT    /api/v1/animals/:id/public-listing         # Create or update (upsert)
PATCH  /api/v1/animals/:id/public-listing/status  # Change status (DRAFT → LIVE → PAUSED)
DELETE /api/v1/animals/:id/public-listing         # Delete

# Public browse
GET    /programs/:slug/animals          # List program's animal listings
GET    /programs/:slug/animals/:urlSlug # Animal listing detail
```

**⚠️ DISCREPANCY with v2 Spec:**
- v2 spec separates "Public Card Content" (on Animal record) from "Listing data" (on AnimalPublicListing)
- Current schema puts headline/title/summary/description on AnimalPublicListing
- **Design decision needed:** Move these to Animal? Or keep on listing?
  - **Recommendation:** Keep on AnimalPublicListing for now (simpler), revisit if breeders complain about duplication

### Current UI Status (from [backend-capabilities.md:188-211](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L188))

**❌ NOTHING FOR BREEDERS TO CREATE ANIMAL LISTINGS**

The backend has **COMPLETE CRUD support**, but there is NO UI anywhere:
- No page at `/me/animals`
- No "Create Listing" button on animal detail pages
- No way to select intent (Stud, Rehome, Guardian, etc.)
- No way to publish/unpublish

**✅ Public browse EXISTS:**
- [AnimalsIndexPage.tsx](apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx) shows animal listings
- But no way to CREATE them!

### Gap Summary

| Feature | Backend | Frontend | Action Needed |
|---------|---------|----------|---------------|
| Animal listing CRUD | ✅ Full API | ❌ | **Build entire UI** at `/me/animals` |
| Intent selection | ✅ Enum exists | ❌ | Build intent picker |
| Pricing models | ✅ Schema | ❌ | Build pricing form |
| Location override | ✅ Schema | ❌ | Build location form |
| URL slug | ✅ Schema | ❌ | Build slug editor |
| Publish/unpublish | ✅ API | ❌ | Build status controls |
| Preview-first pattern | N/A | ❌ | Design + build |

**Priority:** CRITICAL - Stud listings are a major marketplace feature, currently impossible to create

**Implementation Note:** Backend is 100% ready. This is purely a frontend build.

---

## Section 4: Offspring Group Listings

### v2 Spec Requirements (from [v2-marketplace-management.md:1099-1356](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L1099))

**UX Model:** Preview-first, toggle-to-hide pattern

**Key Requirements:**
- Manage offspring group (litter) marketplace listing
- Control which individual offspring are listed (toggle per puppy/kitten)
- Set pricing per offspring (override group default)
- Preview what buyers see before publishing

### Current Backend Support (from [backend-capabilities.md:215-247](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L215))

**✅ FULLY EXISTS:** `OffspringGroup` auto-created when BreedingPlan committed
```
- planId (links to BreedingPlan)
- damId, sireId
- expectedBirthOn, actualBirthOn
- listingSlug, listingTitle, listingDescription
- marketplaceDefaultPriceCents
- coverImageUrl
- published
```

**Individual Offspring:**
```
- marketplaceListed (boolean)        ← Controls visibility
- marketplacePriceCents (override)    ← Per-offspring pricing
- placementState: UNASSIGNED, OPTION_HOLD, RESERVED, PLACED
- keeperIntent: AVAILABLE, UNDER_EVALUATION, WITHHELD, KEEP
- lifeState: ALIVE, DECEASED
```

### Current UI Status (from [backend-capabilities.md:239-246](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L239))

**✅ PUBLIC BROWSE EXISTS:**
- `/programs/:slug/offspring-groups` - Lists litters
- Individual offspring shown on detail page

**❌ MISSING from UI:**
- No way to set `marketplaceListed` per offspring (toggle which puppies are visible)
- No way to override `marketplacePriceCents` per offspring
- No connection shown to parent BreedingProgram in browse
- No "upcoming litters" view per program
- No preview-first management UI

### Gap Summary

| Feature | Backend | Frontend | Action Needed |
|---------|---------|----------|---------------|
| Offspring group display | ✅ | ✅ | Already done |
| Toggle offspring visibility | ✅ Schema field exists | ❌ | **Build UI** for `marketplaceListed` |
| Per-offspring pricing | ✅ Schema field exists | ❌ | **Build UI** for `marketplacePriceCents` |
| Link to breeding program | ✅ Relation exists | ❌ | Display program link |
| Preview-first pattern | N/A | ❌ | Design + build |

**Priority:** MEDIUM - Works for basic use, but missing fine-grained controls

---

## Section 5: Service Listings

### v2 Spec Requirements (from [v2-marketplace-management.md:1358-2530](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L1358))

**Major Requirements:**
- Two provider types: Breeder (can pull platform data) vs Service Provider (form-based)
- Hierarchical category taxonomy (16 parent categories, 80+ subcategories)
- BREEDING > STUD_SERVICE, WHELPING_SUPPORT, MENTORSHIP, etc.
- WORKING_DOG > HERDING_TRAINING, GUN_DOG_TRAINING, LGD_TRAINING, etc.
- LIVESTOCK, EXOTIC, REHABILITATION categories (new)
- "Add from Platform" capability for breeders (link animals, documents, health records)
- Category-specific metadata fields (JSON)
- Provider subscription tiers (free initially, paid Phase 2)
- Public-facing UI patterns (cards, badges, search, browse)

### Current Backend Support (from [backend-capabilities.md:84-126](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L84))

**✅ EXISTS:** `MarketplaceListing` model (used for services)
```
- slug, title, description
- listingType: STUD_SERVICE, TRAINING, GROOMING, TRANSPORT, BOARDING, OTHER_SERVICE
- contactName, contactEmail, contactPhone
- city, state, country
- priceCents, priceType (fixed, starting_at, contact)
- images (JSON array), videoUrl
- status: DRAFT, ACTIVE, PAUSED
- publishedAt
```

**APIs (from [backend-capabilities.md:98-105](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L98)):**
```
GET    /api/v1/services      # List breeder's services
GET    /api/v1/services/:id  # Detail
POST   /api/v1/services      # Create
PUT    /api/v1/services/:id  # Update
POST   /api/v1/services/:id/publish
POST   /api/v1/services/:id/unpublish
DELETE /api/v1/services/:id
```

**❌ MAJOR GAPS vs v2 Spec:**

| v2 Spec Requirement | Current Backend | Gap |
|---------------------|-----------------|-----|
| **16 parent categories** | 6 types only (STUD_SERVICE, TRAINING, GROOMING, TRANSPORT, BOARDING, OTHER_SERVICE) | **Missing 10+ categories** (WORKING_DOG, LIVESTOCK, EXOTIC, REHABILITATION, etc.) |
| **Hierarchical taxonomy** | Flat `listingType` enum | **Need parent + subcategory structure** |
| **Provider type** (breeder vs service provider) | Only breeders supported | **Need separate service provider accounts** |
| **"Add from Platform"** - Link animals | ❌ No relation | **Need ServiceAnimalLink table** |
| **"Add from Platform"** - Link documents | ❌ No relation | **Need ServiceDocumentLink table** |
| **Category-specific metadata** | ❌ No metadata field | **Need metadata JSON field** |
| **Service area** (onsite, mobile, remote) | ❌ No field | **Need serviceArea enum** |
| **Availability** | ❌ No fields | **Need availableDays, availableHours, etc.** |
| **Use Storefront location** toggle | ❌ No toggle | **Need useStorefrontLocation boolean** |
| **Use Storefront contact** toggle | ❌ No toggle | **Need useStorefrontContact boolean** |

**Schema Updates Needed (from [v2-marketplace-management.md:1932-2019](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L1932)):**
```typescript
interface ServiceListing {
  id: number;

  // Provider (NEW - support both types)
  tenantId?: number;           // If breeder
  serviceProviderId?: number;  // If independent provider (NEW table needed)
  providerType: "breeder" | "service_provider";  // NEW field

  // Category (NEW structure)
  parentCategory: ServiceParentCategory;  // NEW enum (16 categories)
  subcategory: string;                    // NEW field

  // Content (mostly exists)
  title: string;
  tagline?: string;             // NEW
  description: string;
  slug: string;

  // Media (exists)
  coverImageUrl?: string;
  images: string[];
  videoUrl?: string;
  videoTitle?: string;          // NEW

  // Location (NEW fields)
  useStorefrontLocation: boolean;  // NEW
  city?: string;
  state?: string;
  country: string;
  serviceArea: "onsite" | "mobile" | "remote" | "nationwide";  // NEW
  serviceRadius?: number;          // NEW

  // Pricing (mostly exists)
  priceModel: "fixed" | "starting_at" | "hourly" | "per_session" | "contact";
  priceCents?: number;
  priceMinCents?: number;        // NEW
  priceMaxCents?: number;        // NEW
  priceUnit?: string;            // NEW
  pricingNotes?: string;         // NEW

  // Contact (NEW fields)
  useStorefrontContact: boolean;  // NEW
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContact?: "email" | "phone" | "either";  // NEW
  responseTime?: string;         // NEW

  // Availability (ALL NEW)
  availableDays?: string[];
  availableHours?: string;
  leadTime?: string;
  seasonal?: boolean;
  seasonNotes?: string;

  // Category-specific metadata (NEW)
  metadata?: Record<string, unknown>;

  // Linked platform data (ALL NEW - breeder only)
  linkedAnimals?: ServiceAnimalLink[];
  linkedDocuments?: ServiceDocumentLink[];

  // Status
  status: "draft" | "active" | "paused";

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

// NEW tables needed
interface ServiceAnimalLink {
  serviceId: number;
  animalId: number;
  displayOrder: number;
  includePhotos: boolean;
  includeHealth: boolean;
  includeTitles: boolean;
  includePedigree: boolean;
  customNote?: string;
}

interface ServiceDocumentLink {
  serviceId: number;
  documentId: number;
  displayOrder: number;
}
```

### Current UI Status (from [backend-capabilities.md:107-126](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L107))

**✅ GOOD NEWS:** [ServicesSettingsPage.tsx](apps/marketplace/src/management/pages/ServicesSettingsPage.tsx) EXISTS!

**What works:**
- Full CRUD ✓
- Service type selection ✓ (limited to 6 types)
- Title, description ✓
- Location (city, state) ✓
- Pricing (fixed, starting_at, contact) ✓
- Contact info ✓
- Publish/unpublish ✓

**Route:** `/me/services` - Accessible!

**❌ MISSING from UI:**
- Image upload (backend supports `images` JSON array, UI doesn't expose it)
- Video URL field (backend supports, UI doesn't)
- **Not in navigation!** (Feature is hidden)
- Hierarchical category picker (needs redesign for 16 categories)
- "Add from Platform" UI for breeders
- Service area (onsite/mobile/remote)
- Availability editor
- Category-specific metadata fields

### Gap Summary

| Feature | Backend | Frontend | Action Needed |
|---------|---------|----------|---------------|
| Basic service CRUD | ✅ | ✅ | Already done |
| **Hierarchical categories** | ❌ Flat enum | ❌ | **Migrate schema** to parent + subcategory, rebuild UI |
| **Service provider accounts** | ❌ | ❌ | **New table + auth** |
| **Provider type field** | ❌ | ❌ | Add to schema |
| **Link animals** | ❌ No table | ❌ | **Create ServiceAnimalLink table + UI** |
| **Link documents** | ❌ No table | ❌ | **Create ServiceDocumentLink table + UI** |
| **Category metadata** | ❌ No field | ❌ | Add metadata JSON + UI |
| **Service area** | ❌ | ❌ | Add field + UI |
| **Availability** | ❌ | ❌ | Add fields + UI |
| **Location/contact toggles** | ❌ | ❌ | Add fields + UI |
| **Image upload** | ✅ Schema exists | ❌ | **Build UI** |
| **Video URL** | ✅ Schema exists | ❌ | **Build UI** |
| **Add to navigation** | N/A | ❌ | **Add link** to nav |

**Priority:** HIGH - Service marketplace is a major feature, but needs significant schema expansion + UI overhaul

**Implementation Complexity:** HIGH - This is essentially a rebuild, not an enhancement

---

## Section 6: Inquiries (Messaging)

### v2 Spec Requirements (from [v2-marketplace-management.md:2532-2573](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L2532))

**Basic Requirements (Phase 1):**
- Centralized message center for all marketplace inquiries
- Thread-based conversations
- Source tracking (which listing generated inquiry)
- Unread badges
- Archive/block user

**Advanced Requirements (Section 8.1 - Phase 1):**
- Attachment support (images, PDFs)
- Phone/email masking
- Read receipts
- Response time tracking
- Spam prevention

### Current Backend Support

**⚠️ PARTIAL:** Basic messaging exists in current system
- ThreadView component exists ([ThreadView.tsx](apps/marketplace/src/messages/components/ThreadView.tsx))
- Message adapter exists ([adapter.ts](apps/marketplace/src/messages/adapter.ts), [serverAdapter.ts](apps/marketplace/src/messages/serverAdapter.ts))
- Types defined ([types.ts](apps/marketplace/src/messages/types.ts))

**Unknown:**
- API endpoints (not documented in backend-capabilities.md)
- Schema structure
- Attachment support?
- Contact masking?

**Section 8.1 Schema Requirements:**
```typescript
interface MessageThread {
  id: number;
  listingId: number;
  listingType: "service" | "animal" | "offspring_group" | "program";
  clientId: number;
  providerId: number;
  status: "open" | "archived" | "blocked";
  lastMessageAt: Date;
  unreadCount: number;
  bookingId?: number;  // Phase 2
}

interface Message {
  id: number;
  threadId: number;
  senderId: number;
  senderType: "client" | "provider";
  content: string;
  attachments: MessageAttachment[];
  readAt?: Date;
  createdAt: Date;
}

interface MessageAttachment {
  id: number;
  messageId: number;
  fileUrl: string;
  fileType: string;
  fileName: string;
  fileSizeBytes: number;
}
```

### Current UI Status (from [backend-capabilities.md:262-263](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/backend-capabilities.md#L262))

**✅ EXISTS:** [InquiriesPage.tsx](apps/marketplace/src/marketplace/pages/InquiriesPage.tsx)
- Route: `/inquiries`
- Shows message threads

**Unknown:**
- Full feature set
- Does it support attachments?
- Source tracking?
- Archive/block?

### Gap Summary

| Feature | Backend | Frontend | Action Needed |
|---------|---------|----------|---------------|
| Thread-based messaging | ⚠️ Exists? | ✅ | **Verify API capabilities** |
| Source tracking | ⚠️ Unknown | ⚠️ Unknown | **Audit + add if missing** |
| Attachments | ⚠️ Unknown | ⚠️ Unknown | **Audit + add if missing** |
| Phone/email masking | ⚠️ Unknown | ⚠️ Unknown | **Likely missing - add** |
| Read receipts | ⚠️ Unknown | ⚠️ Unknown | **Audit + add if missing** |
| Response time tracking | ❌ | ❌ | **Add** |
| Archive/block | ⚠️ Unknown | ⚠️ Unknown | **Audit + add if missing** |

**Priority:** MEDIUM - Basic messaging exists, needs enhancement

**Action:** Deep dive audit of existing messaging system to identify gaps

---

## Section 7: Waitlist

### v2 Spec Requirements (from [v2-marketplace-management.md:2576-2627](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L2576))

**Requirements:**
- Manage waitlist requests per breeding program/litter
- View contact info, preferences (sex, color, dam/sire prefs)
- Update status (Inquiry, Approved, Deposit Pending, etc.)
- Priority/queue management
- Deposit tracking

### Current Backend Support

**✅ EXISTS:** Waitlist functionality exists
- Backend-capabilities.md mentions waitlist at basic level
- API endpoints likely exist (not documented)

**Unknown:**
- Full schema structure
- Status workflow
- Deposit tracking?
- Priority ordering?

### Current UI Status (from [backend-capabilities.md:265](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L265))

**✅ EXISTS:** Basic waitlist functionality

**From v2 spec - APIs needed:**
```
GET    /api/v1/waitlist
GET    /api/v1/waitlist/:id
PATCH  /api/v1/waitlist/:id
DELETE /api/v1/waitlist/:id
```

**Note in spec:** "Need to verify these endpoints exist for breeder-side management."

### Gap Summary

| Feature | Backend | Frontend | Action Needed |
|---------|---------|----------|---------------|
| Waitlist list view | ⚠️ Likely exists | ⚠️ Basic | **Audit + enhance** |
| Entry detail | ⚠️ Unknown | ⚠️ Unknown | **Audit** |
| Status management | ⚠️ Unknown | ⚠️ Unknown | **Audit** |
| Priority ordering | ⚠️ Unknown | ⚠️ Unknown | **Audit + add if missing** |
| Deposit tracking | ⚠️ Unknown | ⚠️ Unknown | **Audit + add if missing** |

**Priority:** LOW - Not critical for MVP, basic functionality likely exists

**Action:** Audit existing waitlist system

---

## Section 8: Critical Marketplace Infrastructure

This is the largest gap - most of Section 8 needs to be built from scratch.

### 8.1 Communication & Messaging

**Status:** ⚠️ Basic messaging exists, needs significant enhancement (see Section 6 above)

**Priority:** CRITICAL (Phase 1)

---

### 8.2 Payment & Transaction Processing

**Status:** ❌ DOES NOT EXIST

**Requirements:**
- Stripe Connect setup for platform payments
- Escrow/holding funds
- Refund policies
- Invoicing
- 1099 generation
- Booking schema

**Recommendation:** Start with inquiry-only (no payments) for MVP, add payments Phase 2

**Priority:** CRITICAL (Phase 2 - not needed for MVP)

**Complexity:** HIGH - Requires Stripe integration, escrow logic, tax handling

---

### 8.3 Reviews & Reputation

**Status:** ❌ DOES NOT EXIST

**Requirements:**
- Review submission (linked to service transactions)
- Multi-dimensional ratings (Overall, Communication, Quality, Value)
- Review moderation
- Provider responses
- Photo reviews
- Rating aggregation/display

**Schema needed (from [v2-marketplace-management.md:2880-2910](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L2880)):**
```typescript
interface ServiceReview {
  id: number;
  listingId: number;
  providerId: number;
  clientId: number;
  bookingId?: number;

  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  valueRating: number;

  reviewText: string;
  photos: string[];

  providerResponse?: string;
  respondedAt?: Date;

  status: "pending" | "approved" | "flagged" | "removed";
  moderatedBy?: number;
  moderatedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

**Priority:** CRITICAL (Phase 1 - basic reviews without payment integration)

**Complexity:** MEDIUM - Straightforward schema + UI

---

### 8.4 Trust & Safety

**Status:** ❌ MOSTLY DOES NOT EXIST

**Requirements:**
- Identity verification (email, phone, ID upload)
- Background checks (Checkr API integration)
- Business license verification
- Insurance verification
- Prohibited services list
- Reporting & moderation system
- Ban/suspension workflow

**Likely exists:**
- Email verification (standard auth)
- Phone verification (maybe?)

**Needs to be built:**
- ID verification (Persona or Stripe Identity integration)
- Background checks (Checkr)
- Verification badge tracking
- Report queue for moderators
- Incident reporting system

**Schema needed (from [v2-marketplace-management.md:3045-3067](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L3045)):**
```typescript
interface IncidentReport {
  id: number;
  reportedBy: number;
  reportedUserId: number;
  listingId?: number;
  bookingId?: number;

  incidentType: "scam" | "fake_listing" | "inappropriate_content" |
                "animal_welfare" | "unsafe_conditions" | "harassment" | "other";
  description: string;
  evidence: string[];

  status: "pending" | "under_review" | "resolved" | "dismissed";
  moderatorId?: number;
  moderatorNotes?: string;
  actionTaken?: "none" | "warning" | "listing_removed" | "user_suspended" | "user_banned";

  createdAt: Date;
  resolvedAt?: Date;
}
```

**Priority:** CRITICAL (Phase 1 - basic verification + reporting)

**Complexity:** HIGH - Requires third-party integrations (Checkr, Persona/Stripe Identity)

---

### 8.5 Insurance & Liability

**Status:** ❌ DOES NOT EXIST

**Requirements:**
- Platform liability terms (legal docs)
- Provider insurance requirements (per category)
- Certificate of Insurance (COI) upload + verification
- Annual renewal tracking
- Auto-disable listings if insurance expires

**Priority:** HIGH (Phase 2 - not critical for inquiry-only MVP)

**Complexity:** MEDIUM - Document upload + manual verification workflow

---

### 8.6 Booking & Scheduling

**Status:** ❌ DOES NOT EXIST

**Requirements:**
- Availability calendar
- Request to book flow
- Instant booking (Phase 3)
- Calendar sync (Google Calendar, Outlook)
- Cancellation policies
- No-show handling
- Waitlist for popular providers

**Recommendation:** Skip for MVP (inquiry-only), add Phase 2

**Priority:** HIGH (Phase 2)

**Complexity:** HIGH - Requires calendar system, timezone handling, sync integrations

---

### 8.7 Search & Discovery

**Status:** ⚠️ BASIC SEARCH EXISTS

**Current state:**
- Browse pages exist (animals, programs, services)
- Basic filtering likely exists

**Needs enhancement:**
- Search ranking algorithm (rating × reviews × response time / distance)
- Promoted listings (paid placement)
- SEO optimization (Schema.org markup)
- Email digests
- Push notifications
- Retargeting

**Priority:** MEDIUM (Phase 2 - basic browse works for MVP)

**Complexity:** MEDIUM - Algorithm implementation, email infrastructure

---

### 8.8 Provider Success Tools

**Status:** ❌ DOES NOT EXIST

**Requirements:**
- Onboarding checklist
- Profile optimization tips
- Analytics dashboard (views, inquiries, conversion, response time)
- Competitor insights
- Referral program

**Priority:** MEDIUM (Phase 2-3 - nice to have)

**Complexity:** MEDIUM - Analytics tracking + dashboard UI

---

### 8.9 Legal & Compliance

**Status:** ⚠️ LIKELY PARTIAL

**Likely exists:**
- Terms of Service
- Privacy Policy (basic)

**Needs to be reviewed/updated:**
- Service Provider Agreement
- Cancellation & Refund Policy
- Acceptable Use Policy
- DMCA Policy
- GDPR/CCPA compliance (data retention, right to deletion, etc.)
- Animal-specific regulations (USDA, APHIS disclaimers)

**Priority:** CRITICAL (Phase 1 - before launch)

**Complexity:** MEDIUM - Requires attorney review

---

### 8.10 Multi-Species Considerations

**Status:** ⚠️ PARTIAL

**Schema supports:**
- Species field exists on BreedingProgram

**Needs enhancement:**
- Species-specific requirements checklist
- Health certificate reminders (for transport)
- Species expertise badges
- Species filters (likely exist?)

**Priority:** LOW (Phase 2-3)

**Complexity:** LOW - Mostly documentation + UI enhancements

---

### 8.11 Breeder-Specific Features

**Status:** ❌ DOES NOT EXIST

**Requirements:**
- Link service to breeding program
- Puppy buyer perks/discounts
- Health testing display on stud services (pull from Animal health records)
- Co-breeder services

**Priority:** HIGH (Phase 1 - differentiator for breeder services)

**Complexity:** MEDIUM - Requires linking tables + discount logic

---

### 8.12 Internationalization

**Status:** ❌ DOES NOT EXIST

**Requirements:**
- Multi-language support
- Currency conversion
- Timezone handling
- Date/distance format localization

**Priority:** LOW (Phase 3 - U.S. only for MVP)

**Complexity:** HIGH - Full i18n implementation

---

### 8.13 Implementation Roadmap Summary

See [v2-marketplace-management.md:3537-3560](C:/Users/Aaron/Documents/Projects/breederhq/docs/marketplace/v2-marketplace-management.md#L3537) for full roadmap.

---

## Overall Gap Summary by Priority

### CRITICAL (Must Have for MVP Launch)

| Feature | Backend Status | Frontend Status | Complexity | Estimate |
|---------|---------------|-----------------|------------|----------|
| **Section 1: My Storefront UI** | ⚠️ Partial schema | ❌ No UI | Medium | 2 weeks |
| **Section 2: Programs - Media Gallery** | ✅ API exists | ❌ No UI | Low | 1 week |
| **Section 2: Programs - Preview-First UX** | N/A | ❌ Needs redesign | Medium | 2 weeks |
| **Section 3: Animal Listings UI** | ✅ 100% ready | ❌ No UI | Medium | 2-3 weeks |
| **Section 5: Add to Navigation** | N/A | ❌ Hidden | Trivial | 1 hour |
| **Section 8.3: Basic Reviews** | ❌ | ❌ | Medium | 2 weeks |
| **Section 8.4: Trust & Safety (Basic)** | ⚠️ Partial | ❌ | High | 3 weeks |
| **Section 8.9: Legal Docs Review** | ⚠️ Needs update | N/A | Medium | 1 week (attorney) |

**Total MVP Estimate:** ~12-14 weeks (3-3.5 months) for critical features

---

### HIGH PRIORITY (Phase 2 - 6-12 months)

| Feature | Backend Status | Frontend Status | Complexity | Estimate |
|---------|---------------|-----------------|------------|----------|
| **Section 5: Services Schema Overhaul** | ❌ Needs migration | ❌ Needs rebuild | High | 4-6 weeks |
| **Section 5: "Add from Platform"** | ❌ | ❌ | High | 3 weeks |
| **Section 8.2: Payment Processing** | ❌ | ❌ | High | 6-8 weeks |
| **Section 8.5: Insurance Verification** | ❌ | ❌ | Medium | 2 weeks |
| **Section 8.6: Booking System** | ❌ | ❌ | High | 6 weeks |
| **Section 8.7: Search Ranking** | ⚠️ Basic | ⚠️ Basic | Medium | 3 weeks |
| **Section 8.11: Breeder Features** | ❌ | ❌ | Medium | 3 weeks |

**Total Phase 2 Estimate:** ~23-31 weeks (5.5-7.5 months)

---

### MEDIUM PRIORITY (Phase 2-3 - 12-24 months)

| Feature | Backend Status | Frontend Status | Complexity | Estimate |
|---------|---------------|-----------------|------------|----------|
| **Section 4: Offspring Pricing Controls** | ✅ Schema | ❌ No UI | Low | 1 week |
| **Section 6: Messaging Enhancements** | ⚠️ Audit needed | ⚠️ Audit needed | Medium | 2-4 weeks |
| **Section 7: Waitlist Enhancements** | ⚠️ Audit needed | ⚠️ Basic | Low | 1-2 weeks |
| **Section 8.8: Provider Success Tools** | ❌ | ❌ | Medium | 4 weeks |
| **Section 8.10: Multi-Species** | ⚠️ Partial | ⚠️ Partial | Low | 2 weeks |

**Total Phase 2-3 Estimate:** ~10-17 weeks (2.5-4 months)

---

### LOW PRIORITY (Phase 3+ - 24+ months)

| Feature | Backend Status | Frontend Status | Complexity | Estimate |
|---------|---------------|-----------------|------------|----------|
| **Section 8.12: Internationalization** | ❌ | ❌ | High | 8-12 weeks |
| **Section 8.7: Promoted Listings** | ❌ | ❌ | Medium | 3 weeks |
| **Section 8.8: Referral Program** | ❌ | ❌ | Medium | 2 weeks |
| **Section 8.6: Advanced Calendar Sync** | ❌ | ❌ | High | 4 weeks |

**Total Phase 3+ Estimate:** ~17-25 weeks (4-6 months)

---

## Recommended Implementation Sequence

### Phase 1 (MVP) - 3-4 months

**Goal:** Launch functional marketplace with inquiry-only services, no payments

**Sprint 1 (Weeks 1-3): Foundation**
1. Legal docs review & update (attorney) - Week 1
2. Section 1: My Storefront schema updates + UI - Weeks 1-3
3. Section 8.4: Basic trust & safety (email/phone verification, report button) - Weeks 2-3

**Sprint 2 (Weeks 4-6): Programs Enhancement**
4. Section 2: Programs media gallery UI - Week 4
5. Section 2: Programs preview-first redesign - Weeks 5-6

**Sprint 3 (Weeks 7-10): Animal Listings**
6. Section 3: Animal Listings full UI build - Weeks 7-10
7. Section 5: Add "My Services" to navigation - Week 7 (1 hour)

**Sprint 4 (Weeks 11-14): Reviews & Polish**
8. Section 8.3: Basic reviews system - Weeks 11-12
9. Testing, bug fixes, polish - Weeks 13-14

**MVP Launch:** End of Week 14

---

### Phase 2 (Payments & Growth) - 6-12 months

**Goal:** Add payments, booking, enhanced services marketplace

**Sprint 5 (Weeks 15-20): Services Overhaul**
1. Section 5: Services schema migration (hierarchical categories) - Weeks 15-16
2. Section 5: Services UI rebuild - Weeks 17-20

**Sprint 6 (Weeks 21-26): Payments**
3. Section 8.2: Stripe Connect integration - Weeks 21-26
4. Section 8.5: Insurance verification - Weeks 24-26 (parallel)

**Sprint 7 (Weeks 27-32): Booking**
5. Section 8.6: Booking & scheduling system - Weeks 27-32
6. Section 8.11: Breeder-specific features - Weeks 30-32 (parallel)

**Sprint 8 (Weeks 33-36): Search & Discovery**
7. Section 8.7: Search ranking algorithm - Weeks 33-35
8. Section 8.8: Provider analytics dashboard - Week 36

---

### Phase 3 (Scale & International) - 12-24+ months

**Goal:** Advanced features, promoted listings, internationalization

1. Section 8.12: Multi-language + currency support
2. Section 8.7: Promoted listings (revenue)
3. Section 8.8: Referral program
4. Section 8.6: Advanced calendar sync
5. Mobile app development

---

## Next Steps

1. **Review this gap analysis** with the team
2. **Prioritize features** - Confirm Phase 1 scope
3. **Deep dive audits:**
   - Messaging system (Section 6)
   - Waitlist system (Section 7)
   - Search/browse capabilities
4. **Create detailed tickets** for Phase 1 features
5. **Set up project timeline** with milestones
6. **Begin Sprint 1:** Legal review + My Storefront + Trust & Safety basics

---

## Questions for Stakeholders

1. **MVP Scope Confirmation:** Is inquiry-only (no payments) acceptable for MVP launch? Or must we have payments in Phase 1?

2. **Services Migration:** Section 5 requires significant schema changes. Should we:
   - Option A: Migrate existing services to new schema (complex, preserves data)
   - Option B: Deprecate old services, start fresh (simpler, lose existing listings)

3. **Priority Trade-offs:** If timeline is tight, which is more important for MVP:
   - Animal Listings (stud services)?
   - Programs enhancement (media gallery, preview-first)?
   - Reviews system?

4. **Third-Party Integrations:** Do we have budget/approval for:
   - Checkr (background checks) - ~$35/check
   - Stripe Identity or Persona (ID verification) - ~$1-2/verification
   - Twilio (phone masking) - ~$0.01/minute

5. **Legal Resources:** Do we have an attorney engaged for marketplace ToS, Provider Agreement, etc.?

---

**Document Status:** Complete
**Last Updated:** 2026-01-12
**Next Review:** After stakeholder feedback
