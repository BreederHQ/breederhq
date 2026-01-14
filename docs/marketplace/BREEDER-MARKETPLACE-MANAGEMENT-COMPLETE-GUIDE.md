# Breeder Marketplace Management: Complete Engineering Guide

> **Purpose**: This is the definitive A→Z reference for engineers implementing breeder marketplace management functionality. It covers EVERYTHING a breeder can create, manage, and control for their public marketplace presence.

**Last Updated**: 2026-01-13
**Status**: AUTHORITATIVE REFERENCE

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Data Flow & Hierarchy](#data-flow--hierarchy)
3. [Section 1: Breeder Storefront Profile](#section-1-breeder-storefront-profile)
4. [Section 2: Breeding Programs](#section-2-breeding-programs)
5. [Section 3: Animal Listings](#section-3-animal-listings)
6. [Section 4: Offspring Group Listings](#section-4-offspring-group-listings)
7. [Section 5: Service Listings](#section-5-service-listings)
8. [Section 6: Inquiry Management](#section-6-inquiry-management)
9. [Section 7: Waitlist Management](#section-7-waitlist-management)
10. [Cross-Module Data Linking](#cross-module-data-linking)
11. [Navigation & Entry Points](#navigation--entry-points)
12. [API Integration Reference](#api-integration-reference)
13. [State Management & Data Sync](#state-management--data-sync)
14. [Permission & Visibility Controls](#permission--visibility-controls)

---

## Overview & Architecture

### The Two Marketplaces

**1. Public Marketplace** (`marketplace.breederhq.test`)
- Public-facing browse and search
- Accessible to anyone (logged in or not)
- Buyers discover breeders, animals, services
- Read-only for non-breeders

**2. Breeder Management Interface** (`app.breederhq.test` with breeder-only controls)
- Only visible to logged-in breeders with active subscriptions
- Create, edit, publish, unpublish marketplace listings
- Centralized control panel for all marketplace activity
- **Routes**: All under `/marketplace-manage/*` or `/me/marketplace/*`

### Key Architectural Principles

1. **Centralized Management**: Breeders manage ALL marketplace settings from one location
2. **Hierarchical Data**: Offspring Groups → Breeding Plans → Breeding Programs → Storefront
3. **Privacy Controls**: Data has TWO visibility layers:
   - **Source Module Privacy** (e.g., Animal marked public/private in Animals module)
   - **Marketplace Visibility** (e.g., Animal listing published/unpublished in marketplace)
4. **Preview-First UX**: Show breeders what buyers will see, toggle OFF what they don't want
5. **Cross-Database Linking**: Tenant DB data (animals, breeding plans) links to Marketplace DB (public listings)

---

## Data Flow & Hierarchy

### The Complete Data Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ TENANT DATABASE (Private Breeder Data)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Tenant Settings                                             │
│  ├── Business Name                                           │
│  ├── Address (City, State, Zip - NEVER street)              │
│  └── System Email                                            │
│                                                              │
│  Animals (Breeding Stock)                                    │
│  ├── Animal Record                                           │
│  │   ├── Name, Species, Breed, Sex, DOB                     │
│  │   ├── Photos, Health Records, Pedigree                   │
│  │   ├── Privacy Settings (public/private per field)        │
│  │   └── Public Listing (optional marketplace listing)      │
│  │       ├── Intent (FOR_SALE, STUD_SERVICE, etc.)          │
│  │       ├── Headline, Description, Price                   │
│  │       └── Status (DRAFT, LIVE, PAUSED)                   │
│                                                              │
│  Breeding Plans                                              │
│  ├── Plan Record                                             │
│  │   ├── Dam + Sire (links to Animals)                      │
│  │   ├── Expected Birth Date                                │
│  │   ├── Status (PLANNED, CONFIRMED, COMMITTED)             │
│  │   └── Linked to Breeding Program (marketplace)           │
│                                                              │
│  Offspring Groups (Litters)                                  │
│  ├── Offspring Group                                         │
│  │   ├── Linked to Breeding Plan                            │
│  │   ├── Linked to Breeding Program                         │
│  │   ├── Birth Date (expected or actual)                    │
│  │   ├── Marketplace Fields:                                │
│  │   │   ├── listingTitle                                   │
│  │   │   ├── listingDescription                             │
│  │   │   ├── listingSlug (URL)                              │
│  │   │   ├── coverImageUrl                                  │
│  │   │   ├── marketplaceDefaultPriceCents                   │
│  │   │   └── published (true/false)                         │
│  │   └── Individual Offspring                               │
│  │       ├── name, sex, collarColor                         │
│  │       ├── keeperIntent (AVAILABLE, RESERVED, PLACED, KEEPER) │
│  │       ├── marketplaceListed (true/false)                 │
│  │       └── marketplacePriceCents (overrides default)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Links via tenantId + IDs
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ MARKETPLACE DATABASE (Public Data)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Marketplace Profile (Storefront)                           │
│  ├── tenantId (links back to tenant)                        │
│  ├── tenantSlug (URL identifier)                            │
│  ├── Draft Fields (editable, not public)                    │
│  │   ├── businessName, bio, logoUrl, bannerUrl              │
│  │   ├── contactPhone, website, instagram, facebook         │
│  │   ├── locationCity, locationState, locationZip           │
│  │   ├── publicLocationMode (full, city_state, state, hidden)│
│  │   ├── businessHours (per day: enabled, open, close)      │
│  │   ├── timeZone                                            │
│  │   ├── Standards & Credentials (registrations, practices) │
│  │   └── Placement Policies (application, interview, etc.)  │
│  └── Published Fields (public snapshot)                     │
│      └── (Same structure as draft, frozen on publish)       │
│                                                              │
│  Breeding Programs (Public Breed-Specific Listings)         │
│  ├── tenantId, programId (links to tenant BreedingProgram)  │
│  ├── name, species, breedText, description                  │
│  ├── slug (URL identifier)                                  │
│  ├── Marketplace Settings:                                  │
│  │   ├── listed (visible on marketplace)                    │
│  │   ├── acceptInquiries (enable Message button)            │
│  │   ├── openWaitlist (enable Join Waitlist)                │
│  │   └── acceptReservations (deposits on offspring)         │
│  ├── Pricing Tiers (e.g., Pet: $2000-2500, Show: $3000-4000)│
│  ├── whatsIncluded (vaccinations, microchip, guarantee)     │
│  ├── typicalWaitTime                                        │
│  ├── Media (images/videos with order)                       │
│  └── publishedAt (timestamp when made public)               │
│                                                              │
│  Service Listings (Breeder-Offered Services)                │
│  ├── tenantId (links to breeder)                            │
│  ├── serviceType (STUD_SERVICE, TRAINING, BOARDING, etc.)   │
│  ├── title, description, slug                               │
│  ├── locationCity, locationState                            │
│  ├── Pricing:                                               │
│  │   ├── priceType (fixed, starting_at, contact)            │
│  │   └── priceCents (if not contact)                        │
│  ├── contactName, contactEmail, contactPhone                │
│  ├── images[], videoUrl                                     │
│  └── status (DRAFT, ACTIVE, PAUSED)                         │
│                                                              │
│  Message Threads (Inquiries)                                │
│  ├── tenantId (breeder)                                     │
│  ├── marketplaceUserId (buyer)                              │
│  ├── listingId + listingType (context)                      │
│  ├── origin (source, referrer, UTM params)                  │
│  └── messages[] (thread history)                            │
│                                                              │
│  Waitlist Entries                                           │
│  ├── tenantId (breeder)                                     │
│  ├── programId (breeding program)                           │
│  ├── marketplaceUserId (buyer)                              │
│  ├── status (PENDING, APPROVED, DECLINED)                   │
│  ├── depositRequired (true/false)                           │
│  └── depositInvoiceId (if deposit required)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Critical Data Flow Patterns

**Pattern 1: Offspring Group Auto-Listing**
```
1. Breeder creates Breeding Plan in Breeding module (tenant DB)
2. Breeder links Breeding Plan to Breeding Program (marketplace DB)
3. When Plan status → COMMITTED, Offspring Group auto-created (tenant DB)
4. Since Plan is linked to Program, Offspring Group inherits that link
5. Offspring Group automatically appears in marketplace as "Coming Soon"
6. Breeder goes to Marketplace Management → Offspring Groups
7. Breeder sets pricing, visibility per offspring, cover image
8. Breeder clicks "Publish" → visible on public marketplace
```

**Pattern 2: Animal Public Listing**
```
1. Breeder has Animal in Animals module (tenant DB)
2. Animal has privacy settings controlling field visibility
3. Breeder goes to Animal → "Public Listing" tab
4. Creates listing: intent, headline, description, price
5. Listing saved as DRAFT status (tenant DB)
6. Breeder clicks "Publish" → status LIVE
7. Backend creates/updates MarketplaceListing record (marketplace DB)
8. Public marketplace queries marketplace DB, joins with tenant DB for animal details
9. Only public fields from Animal are exposed (respects privacy settings)
```

**Pattern 3: Service Listing (Breeder-Offered)**
```
1. Breeder goes to Marketplace Management → Services
2. Clicks "Add Service"
3. Fills form: type, title, description, location, price
4. Saved as DRAFT in marketplace DB (linked to tenantId)
5. Breeder clicks "Publish" → status ACTIVE
6. Public marketplace shows service on /services browse page
```

---

## Section 1: Breeder Storefront Profile

### What It Is
The Storefront is the breeder's public-facing business profile on the marketplace. Think of it as their "About Us" page that buyers see at `/breeders/:tenantSlug`.

### Where Breeders Manage It
- **Primary Location**: Portal → Platform Settings → Marketplace
- **Alternative**: Marketplace Management → Storefront (if v2 interface is built)

### Data Sources & Aggregation

The Storefront **aggregates data from multiple sources**:

| Data Element | Source | Where Edited | Marketplace Control |
|--------------|--------|--------------|---------------------|
| Business Name | Tenant settings | Account Settings | Required, cannot hide |
| Logo | Marketplace profile | Marketplace settings | Optional, can hide |
| Banner Image | Marketplace profile | Marketplace settings | Optional, can hide |
| Bio/About | Marketplace profile | Marketplace settings | Optional, can hide |
| City, State | Tenant address | Account Settings | Visibility mode: full/city_state/state/hidden |
| ZIP Code | Tenant address | Account Settings | Visibility mode: full/hidden |
| **Street Address** | Tenant address | Account Settings | **NEVER shown publicly** |
| Contact Email | System-generated | Auto (noreply mailbox) | Optional, can hide |
| Contact Phone | Marketplace profile | Marketplace settings | Optional, can hide |
| Website | Marketplace profile | Marketplace settings | Optional, can hide |
| Instagram | Marketplace profile | Marketplace settings | Optional, can hide |
| Facebook | Marketplace profile | Marketplace settings | Optional, can hide |
| Business Hours | Marketing module | Marketing → Business Hours | Optional, can hide |
| Time Zone | Marketplace profile | Marketplace settings | Used for hours display |
| Breeds | Animal roster | Animals module | Auto-populated, can hide per breed |
| Year Established | Marketplace profile | Marketplace settings | Optional, can hide |
| Languages Spoken | Marketplace profile | Marketplace settings | Optional, can hide |

### Standards & Credentials

Breeders can configure these to build trust:

**Registrations** (checkboxes):
- AKC (American Kennel Club)
- UKC (United Kennel Club)
- CKC (Canadian Kennel Club)
- TICA (The International Cat Association)
- CFA (Cat Fanciers' Association)
- USDA Licensed
- State Licensed
- Custom (text field)

**Health Testing Practices** (checkboxes):
- DNA Testing
- OFA Hip Certification
- OFA Elbow Certification
- OFA Heart Certification
- PennHIP
- Annual Vet Exams
- Brucellosis Testing
- Custom (text field)

**Breeding Practices** (checkboxes):
- Champion Bloodlines
- Genetic Diversity Focus
- Health-First Breeding
- Temperament Testing
- Working Titles
- Show Titles
- Custom (text field)

**Care Practices** (checkboxes):
- Early Socialization (ENS, Puppy Culture)
- Crate Training
- Potty Training Started
- Vet-Checked Before Placement
- Microchipped
- Age-Appropriate Vaccinations
- Custom (text field)

Each section can have optional notes (text field) for additional details.

### Placement Policies

Breeders toggle these on/off:

- **Application Required**: Buyers must fill out application
- **Interview Required**: Phone/video interview before approval
- **Contract Required**: Signed contract for placement
- **Has Return Policy**: Breeder accepts returns under certain conditions
- **Offers Ongoing Support**: Lifetime support for puppy/kitten

Optional "Policy Notes" text field for details.

### Draft vs Published State

**Draft Mode**:
- All fields editable
- Changes save to `draft` object in database
- NOT visible to public

**Publish Action**:
```
POST /api/v1/marketplace/profile/publish
```
- Validation runs:
  - Business name required
  - At least 1 breed required (from animal roster)
- `draft` object copied to `published` object
- Street address stripped (privacy)
- `tenantSlug` auto-generated if missing (from business name)
- Profile visible at `/breeders/:tenantSlug`

### Public Location Privacy Modes

Breeders choose granularity:

| Mode | What Buyers See | Example |
|------|----------------|---------|
| `full` | City, State, ZIP | Portland, OR 97201 |
| `city_state` | City, State only | Portland, OR |
| `state_only` | State only | Oregon |
| `hidden` | Not shown | (Location hidden) |

**CRITICAL**: Street address is NEVER shown, regardless of mode.

### Trust Badges (Auto-Computed)

These badges appear automatically based on platform data:

- **Verified**: Email + phone verified
- **Health Testing**: Has uploaded health test results for breeding animals
- **5+ Placements**: Has completed 5+ successful placements tracked in system
- **Quick Responder**: Responds to inquiries within 24 hours (tracked metric)

Breeders **cannot edit these** - they're earned through platform behavior.

### Preview-First UX Model

**How it works**:
1. Breeder opens Storefront editor
2. See live preview of their profile as buyers see it
3. All available data is shown with checkboxes/toggles
4. Default: everything visible
5. Breeder toggles OFF what they don't want shown
6. Each element shows "Edit →" link to jump to source module (e.g., "Edit Business Hours →" links to Marketing module)

### API Endpoints

```
GET  /api/v1/marketplace/profile
  → Returns: { draft: {...}, published: {...} }
  → For breeder to view/edit their profile

PUT  /api/v1/marketplace/profile/draft
  → Body: { businessName, bio, logoUrl, ...all editable fields }
  → Saves to draft (not public)

POST /api/v1/marketplace/profile/publish
  → Copies draft → published
  → Validates requirements
  → Generates slug if missing
  → Returns published profile

GET  /api/v1/marketplace/breeders
  → Public endpoint
  → Returns all published breeder profiles
  → Supports filters: species, breed, location

GET  /api/v1/marketplace/breeders/:slug
  → Public endpoint
  → Returns single breeder profile (published data only)
```

### UI/UX Requirements for Engineers

**Storefront Editor Page** (`/marketplace-manage/storefront`):

**Layout**: Two-column
- **Left**: Live preview (as buyers see it)
- **Right**: Edit controls (toggles, text fields)

**Sections** (collapsible accordions):
1. **Identity & Branding**
   - Business Name (read-only, links to Account Settings)
   - Logo (upload)
   - Banner (upload)
   - Bio (rich text editor)
   - Year Established (number input)
   - Languages (multiselect)

2. **Location & Contact**
   - Location Display Mode (radio buttons: full/city_state/state/hidden)
   - Current address shown (read-only, links to Account Settings)
   - Contact Phone (input)
   - Website (URL input)
   - Instagram (input @handle)
   - Facebook (URL input)
   - Business Hours (link to Marketing module OR embed editor)

3. **Breeds** (Auto-populated)
   - Detected breeds from animal roster
   - Each breed has toggle (show/hide)
   - Badge count: "Showing 3 of 5 breeds"

4. **Standards & Credentials**
   - Registrations (checkboxes)
   - Health Testing (checkboxes)
   - Breeding Practices (checkboxes)
   - Care Practices (checkboxes)
   - Notes for each section (textarea)

5. **Placement Policies**
   - Toggle each policy on/off
   - Policy Notes (textarea)

**Actions**:
- Save Draft (PUT /draft)
- Publish (POST /publish) - disabled if validation fails
- Preview (external) - opens `/breeders/:slug` in new tab

**Validation Indicators**:
- Show red badge if requirements not met:
  - "Business name required"
  - "At least 1 breed required"

---

## Section 2: Breeding Programs

### What They Are
Breeding Programs are breed-specific public listings that represent a breeder's program for a particular breed. They're marketing pages with pricing, policies, and associated breeding plans/litters.

Example: "Sunny Acres Goldendoodles" might have:
- Goldendoodle Program
- Labrador Retriever Program
- Bernedoodle Program

### Where Breeders Manage Them
- **Primary**: Marketplace Management → Programs (`/marketplace-manage/programs` or `/me/programs`)
- **Alternative**: Portal → Breeding → Programs (if integrated)

### Data Structure

**Breeding Program Record**:

```typescript
{
  id: number,
  tenantId: number,

  // Identity
  name: string,                    // "Goldendoodle Program"
  species: Species,                // DOG, CAT, HORSE, GOAT, SHEEP, RABBIT
  breedText: string,               // "F1b Goldendoodle"
  description: string,             // Rich text: program philosophy
  slug: string,                    // URL: "goldendoodle-program"

  // Marketplace Settings
  listed: boolean,                 // Visible on marketplace
  acceptInquiries: boolean,        // Enable "Message Breeder" button
  openWaitlist: boolean,           // Enable "Join Waitlist" button
  acceptReservations: boolean,     // Enable deposits on offspring

  // Pricing
  pricingTiers: [
    {
      name: "Pet",                 // Tier name
      priceMin: 200000,            // $2,000 in cents
      priceMax: 250000,            // $2,500 in cents
      description: "Family companion" // What's included
    },
    {
      name: "Show",
      priceMin: 300000,
      priceMax: 400000,
      description: "Show potential with champion lineage"
    }
  ],
  whatsIncluded: string,           // "Vaccinations, microchip, health guarantee, lifetime support"
  typicalWaitTime: string,         // "3-6 months"

  // Media
  media: [
    {
      id: number,
      assetUrl: string,
      mediaType: "IMAGE" | "VIDEO",
      altText: string,
      caption: string,
      displayOrder: number
    }
  ],

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date | null         // Set when listed = true
}
```

### Hierarchical Linking

**Critical**: Breeding Programs link to Breeding Plans (from tenant DB):

```
Breeding Program (marketplace DB)
  ├── programId (primary key)
  │
  └── Breeding Plans (tenant DB, where breedingProgramId = programId)
      ├── Breeding Plan 1: Luna × Duke Fall 2024
      │   └── Offspring Group 1: 5 puppies
      │       ├── Maple (F, Available, $3000)
      │       ├── Oak (M, Available, $2800)
      │       ├── Willow (F, Reserved)
      │       ├── Birch (M, Available, $3000)
      │       └── Aspen (F, KEEPER - not listed)
      │
      └── Breeding Plan 2: Luna × Max Spring 2025
          └── Offspring Group 2: Expected March 2025
```

When a breeder creates or edits a Breeding Plan in the Breeding module, they can **link it to a Breeding Program**. This establishes the hierarchy.

### Breed Matching

**CRITICAL RULE**: When linking a Breeding Plan to a Program:
- Only Programs where `species` and `breedText` match the plan's Dam/Sire are shown
- Example: If Dam is "Dog - Goldendoodle" and Sire is "Dog - Goldendoodle", only Goldendoodle Programs appear in dropdown

This prevents mismatched data (e.g., linking a Labrador litter to a Goldendoodle program).

### Create Program Flow

**UI: Marketplace Management → Programs → "Add Program"**

**Form Fields**:

1. **Basic Info** (required):
   - Name (text): "Goldendoodle Program"
   - Species (dropdown): Dog, Cat, Horse, Goat, Sheep, Rabbit
   - Breed Text (text): "F1b Goldendoodle" or "Labrador Retriever"
   - Description (rich text): Program philosophy, what makes it special

2. **Marketplace Settings** (toggles):
   - List on Marketplace (makes visible at `/breeding-programs`)
   - Accept Inquiries (enables "Message Breeder" button for buyers)
   - Open Waitlist (enables "Join Waitlist" button)
   - Accept Reservations (enables deposits on specific offspring)

3. **Pricing Information**:
   - Add Pricing Tiers (repeatable):
     - Tier Name (text): "Pet", "Show", "Breeding", etc.
     - Price Range (currency): Min and Max in dollars
     - Description (textarea): What's included in this tier
   - What's Included (textarea): Overall package (vaccines, microchip, guarantee, etc.)
   - Typical Wait Time (text): "3-6 months", "1 year", etc.

4. **Media** (optional):
   - Upload images/videos
   - Each has: URL, type (IMAGE/VIDEO), alt text, caption
   - Drag to reorder

**API**:
```
POST /api/v1/breeding/programs
Body: { name, species, breedText, description, listed, acceptInquiries, openWaitlist, acceptReservations, pricingTiers[], whatsIncluded, typicalWaitTime }
Response: { id, slug, ...rest of program }
```

**Slug Generation**:
- Auto-generated from `name` if not provided
- Example: "Goldendoodle Program" → "goldendoodle-program"
- Must be unique per tenant

### Edit Program Flow

**UI: Marketplace Management → Programs → Edit icon on program row**

Same form as Create, all fields editable.

**API**:
```
PUT /api/v1/breeding/programs/:id
Body: { ...any changed fields }
```

**Slug Regeneration**:
- If `name` changes, `slug` is regenerated
- Old slug becomes invalid, new slug is used in URLs
- **WARNING**: This breaks existing links if program was publicly shared

### Publish/Unpublish Program

**Publish**:
```
PUT /api/v1/breeding/programs/:id
Body: { listed: true }
```
- Sets `publishedAt` timestamp
- Program appears at `/breeding-programs`
- Searchable by species, breed
- Visible on breeder's profile at `/breeders/:slug`

**Unpublish**:
```
PUT /api/v1/breeding/programs/:id
Body: { listed: false }
```
- `publishedAt` remains (historical record)
- Hidden from marketplace
- Still accessible to breeder for editing

**UI Toggle**:
- Eye icon on program row (quick toggle)
- OR checkbox in edit form: "List on Marketplace"

### Delete Program

**Constraint**: Cannot delete if Breeding Plans are linked to it.

**API**:
```
DELETE /api/v1/breeding/programs/:id
Response: 200 OK or 409 Conflict (if plans linked)
```

**UI Flow**:
1. Edit program → "Delete Program" button (bottom left, red)
2. Confirm dialog: "Are you sure? This cannot be undone."
3. If plans linked: Error message: "Cannot delete. Reassign or delete linked breeding plans first."

### Media Management

**Upload**:
```
POST /api/v1/breeding/programs/:id/media
Body: { assetUrl, mediaType, altText, caption }
Response: { id, displayOrder, ...rest }
```

**Reorder**:
```
PUT /api/v1/breeding/programs/:id/media/reorder
Body: { mediaIds: [3, 1, 5, 2, 4] }  // New order
```

**Delete**:
```
DELETE /api/v1/breeding/programs/:id/media/:mediaId
```

**UI**:
- Drag-and-drop reorder
- Each media card has "X" delete button
- Alt text and caption editable inline

### Public Display

**Breeder Profile Page** (`/breeders/:tenantSlug`):
- Shows all published programs for this breeder
- Each program displayed as card:
  - Name, species, breed badges
  - Status badges: "Accepting Inquiries", "Waitlist Open", "Accept Reservations"
  - Active breeding plan count: "3 active plans"
  - Click → opens Program Details modal

**Program Details Modal**:
- Full program info:
  - Description
  - Pricing tiers table
  - What's included
  - Typical wait time
  - Media gallery
- Action buttons (if enabled):
  - "Message Breeder" (if acceptInquiries = true)
  - "Join Waitlist" (if openWaitlist = true)

**Browse Programs Page** (`/breeding-programs`):
- Grid of all published programs across all breeders
- Filters:
  - Species dropdown
  - Search by name/breed
  - Location (future: geo-search)
- Each card shows: name, breeder name, location, badges
- Click → opens modal OR goes to program detail page

### Engineers: Key Implementation Notes

1. **Species Enum**: Use exact enum values from database schema:
   - `DOG`, `CAT`, `HORSE`, `GOAT`, `SHEEP`, `RABBIT`
   - Do NOT hardcode species lists in frontend

2. **Breed Matching**: When showing programs for Breeding Plan linking:
   ```typescript
   // Only show programs where:
   program.species === plan.species &&
   program.breedText matches Dam/Sire breed
   ```

3. **Slug Uniqueness**: Enforce at API level (tenant-scoped)

4. **Media Order**: Always respect `displayOrder` field when displaying

5. **Trust Badges**: These are computed, not stored:
   - "Accepting Inquiries" if `acceptInquiries = true`
   - "Waitlist Open" if `openWaitlist = true`
   - "Accept Reservations" if `acceptReservations = true`
   - Active plan count: query `BreedingPlan WHERE breedingProgramId = programId AND status != 'ARCHIVED'`

---

## Section 3: Animal Listings

### What They Are
Animal Listings are individual animal profiles made public on the marketplace. These are for specific animals (not litters/groups) that breeders want to advertise for:
- For Sale (pet or breeding stock)
- Stud Service
- Guardian Home placement
- Co-Ownership
- Fostering
- Retirement home
- Training Prospect

### Where Breeders Manage Them
- **Primary**: Portal → Animals → [Select Animal] → "Public Listing" tab
- **Alternative**: Marketplace Management → Animals (if v2 interface lists all)

### Data Structure

**Animal Record** (Tenant DB):
```typescript
{
  id: number,
  tenantId: number,

  // Core Identity
  name: string,
  species: Species,
  breed: string,
  sex: "MALE" | "FEMALE",
  dateOfBirth: Date,

  // Privacy Settings (control field visibility)
  privacy: {
    namePublic: boolean,
    photoPublic: boolean,
    healthRecordsPublic: boolean,
    pedigreePublic: boolean,
    geneticsPublic: boolean,
    // ... per field
  },

  // Photos, Health, Pedigree (if public)
  photos: [...],
  healthRecords: [...],
  pedigree: {...},
  genetics: {...},

  // Public Listing (marketplace fields)
  publicListing: {
    // Listing Identity
    headline: string,              // "Champion Bloodline Golden Retriever Stud"
    summary: string,               // Brief hook (1-2 sentences)
    description: string,           // Full rich text description
    urlSlug: string,               // "luna-golden-retriever"

    // Intent
    intent: Intent,                // FOR_SALE, STUD_SERVICE, GUARDIAN_HOME, COOWN, FOSTER, RETIRED, TRAINING_PROSPECT

    // Pricing
    priceModel: PriceModel,        // FIXED, RANGE, INQUIRE
    priceCents: number | null,     // If FIXED
    priceMinCents: number | null,  // If RANGE
    priceMaxCents: number | null,  // If RANGE
    priceText: string | null,      // If INQUIRE: "Contact for pricing"

    // Location (can differ from breeder's main location)
    locationCity: string,
    locationRegion: string,        // State/Province
    locationCountry: string,

    // Registry IDs (if public)
    registryIds: [
      { registry: "AKC", idNumber: "SS12345" },
      { registry: "UKC", idNumber: "..." }
    ],

    // Visible Traits (if marked public on animal)
    visibleTraits: {
      color: string,
      weight: number,
      height: number,
      // ... any traits marked public
    },

    // Status
    status: ListingStatus,         // DRAFT, LIVE, PAUSED, SOLD

    // Timestamps
    createdAt: Date,
    updatedAt: Date,
    publishedAt: Date | null
  }
}
```

### Intent Enum Values

| Intent | Description | Typical Use Case |
|--------|-------------|------------------|
| `FOR_SALE` | Animal for sale (pet or breeding) | Selling adult dog, retired breeding animal |
| `STUD_SERVICE` | Male available for breeding | Advertising stud services |
| `GUARDIAN_HOME` | Breeder retains breeding rights | Placing breeding-quality animal with family, breeder retains breeding rights |
| `COOWN` | Co-ownership arrangement | Shared ownership between breeder and buyer |
| `FOSTER` | Temporary foster home needed | Temporary placement, animal returns to breeder |
| `RETIRED` | Retired breeding animal for adoption | Placing retired breeding animal in pet home |
| `TRAINING_PROSPECT` | Animal available for training programs | Sport dog, service dog prospect |

### Price Models

| Model | How It Works | Example |
|-------|--------------|---------|
| `FIXED` | Single price | $2,500 |
| `RANGE` | Min-max range | $2,000 - $3,500 |
| `INQUIRE` | Contact for pricing | "Stud fee negotiable based on dam" |

### Privacy Layers (CRITICAL)

Animal data has **two privacy layers**:

**Layer 1: Animal Privacy Settings** (set in Animals module)
- Controls which fields from the Animal record can be exposed publicly
- Examples:
  - `namePublic: false` → Name not shown even if listing is public
  - `healthRecordsPublic: true` → Health records CAN be shown if listing is public
  - `pedigreePublic: false` → Pedigree hidden

**Layer 2: Listing Status** (set in Public Listing)
- Controls whether the listing is visible on marketplace at all
- `DRAFT` → Not public (breeder working on it)
- `LIVE` → Public, visible at `/programs/:programSlug/animals/:urlSlug`
- `PAUSED` → Hidden temporarily (e.g., animal is on hold)
- `SOLD` → Archived, no longer available

**Both must be true** for data to appear:
```typescript
// Example: Health records only shown if:
animal.privacy.healthRecordsPublic === true &&
animal.publicListing.status === "LIVE"
```

### Create Animal Listing Flow

**Starting Point**: Portal → Animals → [Select Animal] → "Public Listing" tab

**If no listing exists**: Show "Create Listing" button

**Form**:

1. **Listing Identity**:
   - Headline (text): Attention-grabbing title
   - Summary (textarea): 1-2 sentence hook
   - Description (rich text): Full details about the animal

2. **Intent** (radio buttons):
   - For Sale
   - Stud Service
   - Guardian Home
   - Co-Ownership
   - Foster
   - Retired
   - Training Prospect

3. **Pricing**:
   - Price Model (radio):
     - Fixed Price → show single price input
     - Price Range → show min/max inputs
     - Contact for Pricing → show custom text input
   - Currency inputs (dollars, converted to cents)

4. **Location**:
   - City (text)
   - State/Region (text or dropdown)
   - Country (dropdown, default US)
   - NOTE: This can differ from breeder's main location (e.g., animal is with a guardian family)

5. **Registry IDs** (optional, repeatable):
   - Registry (dropdown: AKC, UKC, CKC, etc.)
   - ID Number (text)

**API**:
```
PUT /api/v1/animals/:id/public-listing
Body: { headline, summary, description, intent, priceModel, priceCents, priceMinCents, priceMaxCents, priceText, locationCity, locationRegion, locationCountry, registryIds[] }
Response: { ...listing object with status: "DRAFT" }
```

**Slug Generation**:
- Auto-generated from animal name + breed
- Example: Animal "Luna" breed "Golden Retriever" → `luna-golden-retriever`
- If duplicate, append number: `luna-golden-retriever-2`

### Edit Animal Listing

Same form, all fields editable.

**API**:
```
PUT /api/v1/animals/:id/public-listing
Body: { ...any changed fields }
```

### Publish Animal Listing

**From DRAFT → LIVE**:

**Validation**:
- Animal must exist and not be deceased
- Required fields: headline, intent, location
- If price model = FIXED, priceCents required
- If price model = RANGE, priceMinCents and priceMaxCents required
- `urlSlug` must be unique (tenant-scoped)

**API**:
```
PATCH /api/v1/animals/:id/public-listing/status
Body: { status: "LIVE" }
```

- Sets `publishedAt` timestamp
- Listing appears on `/animals` browse page (Program Animals tab)
- Also appears on breeder's profile at `/breeders/:slug`

**UI**:
- "Publish" button in listing editor
- OR status dropdown: DRAFT → LIVE

### Unpublish / Pause Listing

**LIVE → PAUSED**:
```
PATCH /api/v1/animals/:id/public-listing/status
Body: { status: "PAUSED" }
```
- Hidden from marketplace
- Breeder can reactivate later

**Mark as Sold**:
```
PATCH /api/v1/animals/:id/public-listing/status
Body: { status: "SOLD" }
```
- Archived, no longer editable
- Historical record only

### Delete Animal Listing

**API**:
```
DELETE /api/v1/animals/:id/public-listing
```

**CRITICAL**: This deletes the **public listing only**, NOT the animal record itself.
- Animal remains in Animals module (tenant DB)
- Public listing removed from marketplace
- Can recreate listing later

### Public Display

**Animals Browse Page** (`/animals`):
- Two tabs:
  - "Program Animals" (these individual animal listings)
  - "Offspring Groups" (litters from breeding plans)
- Each animal card shows:
  - Photo (if public)
  - Name (if public)
  - Species, breed, age
  - Intent badge ("For Sale", "Stud Service", etc.)
  - Price or "Contact for pricing"
  - Location (city, state)
  - Breeder name (links to breeder profile)
- Click → goes to listing detail page

**Animal Listing Detail Page** (`/programs/:programSlug/animals/:urlSlug`):

**Why the URL includes programSlug?**
- Animal listings are associated with breeder's program
- URL structure: `/programs/goldendoodle-program/animals/luna-golden-retriever`
- If animal isn't linked to a specific program, use breeder slug: `/breeders/sunny-acres/animals/luna`

**Page Layout**:
- **Hero Section**:
  - Photos (if public) - carousel if multiple
  - Headline
  - Intent badge
  - Price (if not "Inquire")

- **About This Animal**:
  - Name, species, sex, breed, age (DOB)
  - Summary
  - Full description (rich text)

- **Details** (if public per privacy settings):
  - Registry IDs (if any)
  - Health Records (if public)
  - Pedigree (if public)
  - Genetics (if public)
  - Visible traits (color, weight, height)

- **Location**:
  - City, State, Country

- **Breeder Info**:
  - Breeder name (link to profile)
  - Quick Responder badge (if applicable)
  - "View Full Profile" button

- **Contact Form**:
  - "Message [Breeder Name] About [Animal Name]"
  - Textarea for message
  - Submit → creates inquiry thread with context

### Engineers: Key Implementation Notes

1. **Privacy Enforcement**: Always check animal privacy settings before displaying fields:
   ```typescript
   // Example
   if (animal.privacy.healthRecordsPublic && listing.status === "LIVE") {
     // Show health records
   }
   ```

2. **Intent Display**: Use consistent badges/colors for each intent type across UI

3. **Price Display Logic**:
   ```typescript
   function displayPrice(listing) {
     if (listing.priceModel === "FIXED") {
       return `$${(listing.priceCents / 100).toFixed(2)}`;
     } else if (listing.priceModel === "RANGE") {
       return `$${listing.priceMinCents / 100} - $${listing.priceMaxCents / 100}`;
     } else {
       return listing.priceText || "Contact for pricing";
     }
   }
   ```

4. **Slug Uniqueness**: Enforce tenant-scoped uniqueness at API level

5. **Status Transitions**: Enforce valid state transitions:
   - DRAFT → LIVE (publish)
   - LIVE → PAUSED (pause)
   - PAUSED → LIVE (reactivate)
   - LIVE → SOLD (mark sold)
   - SOLD is terminal (cannot change back)

6. **Deleted Animals**: If animal is deleted from Animals module, public listing should be auto-deleted (cascade)

---

## Section 4: Offspring Group Listings

### What They Are
Offspring Groups (also called "litters") are groups of offspring from a specific breeding (Dam × Sire). These are automatically created when a Breeding Plan is committed, and breeders can publish them to marketplace as group listings.

**Key Difference from Animal Listings**:
- Animal Listings = individual animals (stud services, adults for sale)
- Offspring Groups = litters of puppies/kittens (groups from planned breedings)

### Hierarchical Data Flow (CRITICAL)

This is the **most complex** part of the marketplace. Understand this hierarchy:

```
1. Breeder creates Breeding Program (marketplace DB)
   └── Name: "Goldendoodle Program"
       Species: DOG
       Breed: "Goldendoodle"

2. Breeder creates Breeding Plan (tenant DB)
   └── Dam: Luna (Animal ID 123)
       Sire: Duke (Animal ID 456)
       Expected Birth: October 15, 2024
       Status: PLANNED

3. Breeder links Breeding Plan to Breeding Program
   └── breedingProgramId = programId (from step 1)

4. Breeder commits Breeding Plan (status → COMMITTED)
   └── System auto-creates Offspring Group (tenant DB)
       ├── breedingPlanId = planId (from step 2)
       ├── breedingProgramId = programId (inherited from plan)
       ├── damId = 123
       ├── sireId = 456
       ├── expectedBirthDate = October 15, 2024
       └── Marketplace Fields (all NULL/defaults initially):
           ├── listingTitle: NULL
           ├── listingDescription: NULL
           ├── listingSlug: NULL
           ├── coverImageUrl: NULL
           ├── marketplaceDefaultPriceCents: NULL
           └── published: false

5. Since breedingProgramId is set, Offspring Group appears in marketplace as "Coming Soon"
   └── Visible on program page, but with minimal data
       "Upcoming litter: Luna × Duke, expected October 2024"

6. Breeder goes to Marketplace Management → Offspring Groups
   └── Finds this Offspring Group in list
       Clicks "Edit"

7. Breeder fills marketplace fields:
   └── listingTitle: "Luna × Duke Fall 2024"
       listingDescription: "Beautiful Goldendoodles ready January 2025"
       coverImageUrl: [uploads cover photo]
       marketplaceDefaultPriceCents: 300000 ($3,000)

8. Breeder adds individual offspring:
   └── POST /api/v1/offspring/individuals
       For each puppy:
       ├── name: "Maple"
       ├── sex: FEMALE
       ├── collarColorName: "Cream"
       ├── collarColorHex: "#FFFDD0"
       ├── keeperIntent: AVAILABLE (not keeping for breeding)
       ├── marketplaceListed: true (show on marketplace)
       └── marketplacePriceCents: NULL (use group default)

9. Breeder publishes Offspring Group:
   └── PATCH /api/v1/offspring/:id
       Body: { published: true }
   └── Now visible at:
       `/programs/goldendoodle-program/offspring-groups/luna-duke-fall-2024`
```

### Data Structure

**Offspring Group Record** (Tenant DB):

```typescript
{
  id: number,
  tenantId: number,

  // Breeding Context
  breedingPlanId: number | null,     // Links to BreedingPlan
  breedingProgramId: number | null,  // Links to BreedingProgram (marketplace)
  damId: number,                     // Animal ID (mother)
  sireId: number,                    // Animal ID (father)

  // Dates
  expectedBirthDate: Date | null,
  actualBirthDate: Date | null,

  // Marketplace Listing Fields
  listingTitle: string | null,       // "Luna × Duke Fall 2024"
  listingDescription: string | null, // Rich text
  listingSlug: string | null,        // "luna-duke-fall-2024"
  coverImageUrl: string | null,      // Hero image URL
  marketplaceDefaultPriceCents: number | null,  // Default price for offspring
  published: boolean,                // Visible on marketplace

  // Individual Offspring (related records)
  offspring: [
    {
      id: number,
      offspringGroupId: number,

      // Identity
      name: string,                  // "Maple"
      sex: "MALE" | "FEMALE",
      collarColorName: string,       // "Cream", "Red", "Blue"
      collarColorHex: string,        // "#FFFDD0"
      coatDescription: string | null,

      // Photos
      photos: [...],                 // Array of photo URLs

      // Status
      keeperIntent: KeeperIntent,    // AVAILABLE, RESERVED, PLACED, KEEPER, DECEASED

      // Marketplace Fields
      marketplaceListed: boolean,    // Show this offspring on marketplace
      marketplacePriceCents: number | null,  // Override group default (if NULL, use group default)

      // Timestamps
      createdAt: Date,
      updatedAt: Date
    }
  ],

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Keeper Intent Enum

| Value | Meaning | Marketplace Behavior |
|-------|---------|---------------------|
| `AVAILABLE` | Available for sale | Can be listed |
| `RESERVED` | Reserved by buyer (deposit paid) | Cannot be listed (auto-hides) |
| `PLACED` | Already placed with buyer | Cannot be listed (auto-hides) |
| `KEEPER` | Breeder keeping for own program | Cannot be listed (grayed out) |
| `DECEASED` | Unfortunately deceased | Cannot be listed (grayed out) |

### Where Breeders Manage Offspring Groups

**Primary**: Marketplace Management → Offspring Groups (`/marketplace-manage/offspring-groups`)

**List View** shows all offspring groups with columns:
- Cover (thumbnail)
- Title (or auto-generated: "Dam × Sire")
- Parents (Dam × Sire names)
- Program (linked breeding program)
- Stage (Expecting / Born / Weaning / Placement / Complete)
- Birth Date (expected or actual)
- Available (X of Y available for placement)
- Listed (Yes/No badge)
- Actions (Edit, Toggle Listed)

**Filters**:
- Stage dropdown (expecting, born, weaning, placement, complete)
- Listed dropdown (yes, no, all)
- Program dropdown (filter by breeding program)

### Create Offspring Group (Manual)

**Typically auto-created** when Breeding Plan is committed, but manual creation is available for special cases (e.g., managing offspring inherited from another breeder).

**API**:
```
POST /api/v1/offspring
Body: { damId, sireId, expectedBirthDate, breedingPlanId?, breedingProgramId? }
Response: { id, ...offspring group }
```

### Edit Offspring Group Listing Fields

**UI**: Click "Edit" on offspring group row

**Form Sections**:

1. **Listing Details**:
   - Title (text): Defaults to "Dam × Sire [Season] [Year]" but can customize
   - Description (rich text): Detailed info about this litter
   - URL Slug (text): Auto-generated, can customize
   - Cover Image (upload): Hero image for listing
   - Default Price (currency): Base price for offspring ($)
   - Pricing Notes (textarea): Terms, what's included

2. **Parents Display** (read-only preview):
   - Shows Dam info with "Edit Luna's Profile →" link
   - Shows Sire info with "Edit Duke's Profile →" link
   - **Visibility controlled at Animal level** (not here)
   - If animal marked private, data doesn't show

3. **Timeline** (read-only):
   - Expected Birth Date (from breeding plan)
   - Actual Birth Date (set when born)
   - Expected Weaning (computed, e.g., +8 weeks from birth)
   - Expected Placement (from breeding plan)

4. **Offspring Management** (table):

   | Photo | Name | Sex | Collar | Color | Placement State | Keeper Intent | Listed | Price |
   |-------|------|-----|--------|-------|-----------------|---------------|--------|-------|
   | 🐕 | Maple | F | Cream | Cream | Available | - | ☑ | $3,000 |
   | 🐕 | Oak | M | Apricot | Apricot | Available | - | ☑ | $2,800 |
   | 🐕 | Willow | F | White | Cream | Reserved | - | — | — |
   | 🐕 | Birch | M | Red | Red | Available | - | ☑ | $3,000 |
   | 🐕 | Aspen | F | Cream | Cream | KEEP | KEEPER | — | — |

   **Editable Columns**:
   - **Listed**: Toggle checkbox per offspring
   - **Price**: Input field (if blank, uses group default)

   **Row States**:
   - Normal: AVAILABLE and Listed = editable
   - Grayed: RESERVED/PLACED/KEEPER/DECEASED = cannot list

   **Bulk Actions**:
   - "List all available" - sets marketplaceListed = true for all AVAILABLE offspring
   - "Unlist all" - sets marketplaceListed = false for all
   - "Set price for selected" - bulk update price for checked rows

5. **Raising Protocols** (inherited from Program or Storefront):
   - Display: "From: Goldendoodle Program" [View Program →]
   - Shows protocol tags: ENS, Puppy Culture, Crate Training, etc.
   - **Can override at group level** for special cases
   - Toggle visibility per tag

6. **Placement Package** (inherited from Program or Storefront):
   - Display: "From: Goldendoodle Program"
   - Shows included items: Health Records, Microchip, 2-Year Guarantee
   - **Can override at group level**
   - Toggle visibility per item

**API**:
```
PATCH /api/v1/offspring/:id
Body: { listingTitle, listingDescription, listingSlug, coverImageUrl, marketplaceDefaultPriceCents }
```

### Add/Edit Individual Offspring

**From Offspring Group Editor**:

**Add Offspring**: "Add Offspring" button

**Form**:
- Name (text): Required
- Sex (radio): Male / Female
- Collar Color Name (text): "Cream", "Red", "Blue"
- Collar Color Hex (color picker): Visual color
- Coat Description (textarea): Optional details
- Photos (upload multiple)

**API**:
```
POST /api/v1/offspring/individuals
Body: { offspringGroupId, name, sex, collarColorName, collarColorHex, coatDescription, photos[] }
```

**Edit Offspring**: Click on offspring card/row

Same form, all fields editable, plus:
- Keeper Intent (dropdown): AVAILABLE, RESERVED, PLACED, KEEPER, DECEASED
- Marketplace Listed (toggle)
- Marketplace Price (currency input, optional)

**API**:
```
PATCH /api/v1/offspring/individuals/:id
Body: { name, sex, collarColorName, collarColorHex, keeperIntent, marketplaceListed, marketplacePriceCents }
```

### Publish Offspring Group

**From DRAFT → Published**:

**Validation**:
- `listingSlug` must be set (auto-generated if missing)
- At least 1 offspring must have `marketplaceListed = true`
- Group must be linked to Breeding Program (breedingProgramId)

**API**:
```
PATCH /api/v1/offspring/:id
Body: { published: true }
```

- Group visible at `/programs/:programSlug/offspring-groups/:listingSlug`
- Also visible on Animals browse page (Offspring Groups tab)
- Visible on breeder's program page

**UI**:
- "Publish" button in editor
- OR "Toggle Listed" icon on group row (quick action)

### Unpublish Offspring Group

**API**:
```
PATCH /api/v1/offspring/:id
Body: { published: false }
```

- Hidden from marketplace
- Breeder can still edit
- Data preserved

### Public Display

**Animals Browse Page** (`/animals` → "Offspring Groups" tab):
- Grid of published offspring groups
- Each card shows:
  - Cover image
  - Title ("Luna × Duke Fall 2024")
  - Species, breed (from parents)
  - Birth date (expected or actual)
  - Available count ("3 of 5 available")
  - Price range or default price
  - Breeder name (link to profile)
- Click → goes to listing detail page

**Offspring Group Listing Detail Page** (`/programs/:programSlug/offspring-groups/:listingSlug`):

**Layout**:

- **Hero**:
  - Cover image
  - Title
  - Species, breed badges
  - Birth date
  - Price (default or range if overrides exist)

- **Description**:
  - Full rich text description

- **Parent Info** (if public):
  - Dam section:
    - Name, photo (if public)
    - Health Testing: OFA Hips: Good, OFA Elbows: Normal (if public)
    - Genetics: Embark: Clear (if public)
    - Pedigree: 3 generations (if public)
  - Sire section:
    - Same structure as Dam

- **Timeline**:
  - Born: October 15, 2024 (or "Expected: October 15, 2024")
  - Weaning: December 10, 2024
  - Placement begins: January 5, 2025

- **Available Offspring**:
  - Grid/list of offspring with marketplaceListed = true
  - Each shows:
    - Photo
    - Name
    - Sex icon (♂/♀)
    - Collar color (visual swatch)
    - Coat description
    - Status ("Available" or "Reserved")
    - Price (individual or default)
    - "Inquire" button → opens message form with offspring context

- **Raising Protocols** (if visible):
  - Protocol tags: ENS, Puppy Culture, Crate Training
  - Details (if provided)

- **Placement Package** (if visible):
  - Included items: Health Records, Microchip, 2-Year Guarantee
  - Details (if provided)

- **Breeder Info**:
  - Trust badges (Verified, Health Testing, etc.)
  - Breeder name, location
  - "View Breeder Profile" button
  - "Contact Breeder" button

- **Contact Form**:
  - "Message [Breeder Name] About [Offspring Name]"
  - Textarea
  - Submit → creates inquiry with context (listingType: "offspring_group", listingId: groupId)

### Engineers: Key Implementation Notes

1. **Hierarchical Linking**: Always respect the hierarchy:
   ```
   OffspringGroup.breedingProgramId → BreedingProgram
   OffspringGroup.breedingPlanId → BreedingPlan
   OffspringGroup.damId → Animal
   OffspringGroup.sireId → Animal
   ```

2. **Parent Data Privacy**: Check Animal privacy settings before displaying Dam/Sire info:
   ```typescript
   if (dam.privacy.healthRecordsPublic) {
     // Show dam's health records
   }
   ```

3. **Available Count Logic**:
   ```typescript
   const availableCount = offspring.filter(o =>
     o.keeperIntent === "AVAILABLE" &&
     o.marketplaceListed === true
   ).length;

   const totalCount = offspring.filter(o =>
     o.keeperIntent !== "DECEASED"
   ).length;

   // Display: "3 of 5 available"
   ```

4. **Price Display**:
   ```typescript
   function getOffspringPrice(individual, group) {
     return individual.marketplacePriceCents || group.marketplaceDefaultPriceCents;
   }
   ```

5. **Keeper Intent Behavior**:
   - RESERVED/PLACED should auto-hide from marketplace (marketplaceListed = false)
   - KEEPER should be grayed out, checkbox disabled
   - DECEASED should be grayed out, hidden from public view

6. **Slug Generation**:
   ```typescript
   // Auto-generate from parents + season + year
   const slug = `${dam.name}-${sire.name}-${season}-${year}`.toLowerCase().replace(/\s+/g, '-');
   // Example: "luna-duke-fall-2024"
   ```

7. **Birth Date Display Logic**:
   ```typescript
   if (group.actualBirthDate) {
     return `Born: ${formatDate(group.actualBirthDate)}`;
   } else if (group.expectedBirthDate) {
     return `Expected: ${formatDate(group.expectedBirthDate)}`;
   }
   ```

---

## Section 5: Service Listings

### What They Are
Service Listings are breeder-offered services beyond selling animals. Examples:
- Stud Service (offering male for breeding)
- Training (puppy training, behavior modification, sport dog training)
- Boarding (dog boarding, cat boarding)
- Grooming
- Transport (animal transport, flight nanny)
- Other Services (consultations, mentoring, photography, etc.)

**NOTE**: These are **breeder** service listings. There's a separate system for non-breeder Service Providers (see Section dedicated to that if needed).

### Where Breeders Manage Them

**Primary**: Marketplace Management → Services (`/marketplace-manage/services` or `/me/services`)

**List View** shows all service listings with columns:
- Type (badge: STUD_SERVICE, TRAINING, etc.)
- Title
- Location (city, state)
- Price (or "Contact for pricing")
- Status (DRAFT, ACTIVE, PAUSED)
- Actions (Edit, Toggle Status, Delete)

### Data Structure

**Service Listing Record** (Marketplace DB):

```typescript
{
  id: number,
  tenantId: number,               // Links to breeder tenant

  // Service Type
  serviceType: ServiceType,       // STUD_SERVICE, TRAINING, GROOMING, TRANSPORT, BOARDING, OTHER_SERVICE

  // Identity
  title: string,                  // "Professional Herding Dog Training"
  description: string,            // Rich text: full service description
  slug: string,                   // "professional-herding-dog-training"

  // Location
  locationCity: string,
  locationState: string,

  // Pricing
  priceType: PriceType,           // "fixed", "starting_at", "contact"
  priceCents: number | null,      // If not "contact"

  // Contact
  contactName: string | null,     // Optional: specific person for this service
  contactEmail: string | null,    // Optional: service-specific email
  contactPhone: string | null,    // Optional: service-specific phone

  // Media
  images: string[],               // Array of image URLs
  videoUrl: string | null,        // Optional video

  // Status
  status: ServiceStatus,          // DRAFT, ACTIVE, PAUSED

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date | null
}
```

### Service Type Enum

| Value | Description | Example Use Case |
|-------|-------------|------------------|
| `STUD_SERVICE` | Male available for breeding | "Champion bloodline Golden Retriever stud" |
| `TRAINING` | Dog/animal training services | "Puppy obedience training", "Sport dog training" |
| `GROOMING` | Grooming services | "Full-service grooming", "Show prep grooming" |
| `TRANSPORT` | Animal transport | "Safe animal transport within 500 miles" |
| `BOARDING` | Boarding services | "Dog boarding in home environment" |
| `OTHER_SERVICE` | Any other service | "Breeding consultation", "Photography", "Mentoring" |

### Price Type Enum

| Value | Display | Example |
|-------|---------|---------|
| `fixed` | "$500" | Exact price |
| `starting_at` | "Starting at $500" | Minimum price, varies based on specifics |
| `contact` | "Contact for pricing" | Price negotiable or varies widely |

### Create Service Listing Flow

**UI**: Marketplace Management → Services → "Add Service"

**Form Modal**:

1. **Service Type** (required):
   - Dropdown or radio buttons: Stud Service, Training, Grooming, Transport, Boarding, Other

2. **Basic Info**:
   - Title (text, required): "Professional Herding Dog Training"
   - Description (rich text): Full details about the service

3. **Location**:
   - City (text)
   - State (text or dropdown)

4. **Pricing**:
   - Price Type (radio):
     - Fixed Price → show single price input
     - Starting At → show minimum price input
     - Contact for Pricing → no price input
   - Price (currency input, if not "contact")

5. **Contact Info** (optional):
   - Contact Name: Specific person for this service (defaults to breeder)
   - Contact Email: Service-specific email (defaults to breeder email)
   - Contact Phone: Service-specific phone (defaults to breeder phone)

6. **Media** (optional):
   - Upload Images: Multiple allowed
   - Video URL: YouTube or Vimeo link

**API**:
```
POST /api/v1/services
Body: { serviceType, title, description, locationCity, locationState, priceType, priceCents, contactName, contactEmail, contactPhone, images[], videoUrl }
Response: { id, slug, status: "DRAFT", ...rest }
```

**Slug Generation**:
```typescript
// Auto-generated from title
const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
// Example: "Professional Herding Dog Training" → "professional-herding-dog-training"
```

### Edit Service Listing

**UI**: Click "Edit" on service row

Same form, all fields editable.

**API**:
```
PUT /api/v1/services/:id
Body: { ...any changed fields }
```

### Publish Service Listing

**From DRAFT → ACTIVE**:

**Validation**:
- Title required
- serviceType required
- Location required (city + state)
- If priceType != "contact", priceCents required

**API**:
```
PUT /api/v1/services/:id
Body: { status: "ACTIVE" }
```

- Sets `publishedAt` timestamp
- Listing visible on `/services` browse page
- Visible on breeder's profile at `/breeders/:slug`

**UI**:
- "Publish" button in editor
- OR click status badge on row (quick toggle)

### Unpublish / Pause Service

**ACTIVE → PAUSED**:
```
PUT /api/v1/services/:id
Body: { status: "PAUSED" }
```

- Hidden from marketplace
- Can reactivate later

### Delete Service Listing

**API**:
```
DELETE /api/v1/services/:id
```

**Confirm dialog**: "Are you sure? This cannot be undone."

**Effect**: Permanently deleted from database.

### Public Display

**Services Browse Page** (`/services`):

**Filters**:
- Service Type dropdown: All, Stud Service, Training, Grooming, Transport, Boarding, Other
- Location search: City, state, or ZIP (future: geo-radius)
- Price range: Min-max sliders

**Each service card shows**:
- Type badge ("Stud Service", "Training", etc.)
- Title
- Description snippet (truncated)
- Image (first from images array)
- Provider name (breeder name)
- Location (city, state)
- Price or "Contact for pricing"
- "View Details" button

**Click** → goes to service detail page

**Service Detail Page** (`/services/:slug`):

**Layout**:

- **Hero**:
  - Images (carousel if multiple)
  - Video (if provided)
  - Title
  - Type badge
  - Price or "Contact for pricing"

- **Description**:
  - Full rich text description

- **Details**:
  - Service Type
  - Location (city, state)

- **Provider Info**:
  - Breeder name (link to profile)
  - Trust badges (Verified, Quick Responder, etc.)
  - "View Provider Profile" button

- **Contact Section**:
  - Contact Name (if provided, else breeder name)
  - Contact Email (if provided, else hidden - use form)
  - Contact Phone (if provided)
  - **OR** "Message Provider" button → opens message form with service context

- **Contact Form**:
  - "Inquire About [Service Title]"
  - Textarea
  - Submit → creates inquiry (listingType: "service", listingId: serviceId)

### Engineers: Key Implementation Notes

1. **Service Type Display**: Use consistent badges/colors:
   ```typescript
   const serviceTypeBadges = {
     STUD_SERVICE: { label: "Stud Service", color: "blue" },
     TRAINING: { label: "Training", color: "green" },
     GROOMING: { label: "Grooming", color: "purple" },
     TRANSPORT: { label: "Transport", color: "orange" },
     BOARDING: { label: "Boarding", color: "teal" },
     OTHER_SERVICE: { label: "Other", color: "gray" }
   };
   ```

2. **Price Display**:
   ```typescript
   function displayServicePrice(service) {
     if (service.priceType === "fixed") {
       return `$${(service.priceCents / 100).toFixed(2)}`;
     } else if (service.priceType === "starting_at") {
       return `Starting at $${(service.priceCents / 100).toFixed(2)}`;
     } else {
       return "Contact for pricing";
     }
   }
   ```

3. **Contact Info Fallback**:
   ```typescript
   const contactName = service.contactName || breederProfile.businessName;
   const contactEmail = service.contactEmail || breederProfile.contactEmail;
   const contactPhone = service.contactPhone || breederProfile.contactPhone;
   ```

4. **Images**: If no images provided, use placeholder or breeder logo

5. **Video Embed**: Support YouTube and Vimeo:
   ```typescript
   function getVideoEmbedUrl(videoUrl) {
     if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
       // Extract video ID and return embed URL
     } else if (videoUrl.includes('vimeo.com')) {
       // Extract video ID and return embed URL
     }
   }
   ```

6. **Slug Uniqueness**: Enforce tenant-scoped uniqueness at API level

---

## Section 6: Inquiry Management

### What It Is
Inquiry Management is the message center where breeders receive and respond to buyer inquiries from the marketplace. All inquiries are linked to specific listings (offspring group, animal, service, or program).

### Where Breeders Manage Inquiries

**Primary**: Portal → Communications Hub

**Alternative**: Marketplace Management → Inquiries (if v2 interface is built)

### Data Structure

**Message Thread Record** (Marketplace DB):

```typescript
{
  id: number,

  // Parties
  tenantId: number,               // Breeder
  marketplaceUserId: number,      // Buyer

  // Context (what listing is this about?)
  listingId: number,
  listingType: ListingType,       // "service" | "animal" | "offspring_group" | "program"

  // Origin Tracking
  origin: {
    source: string,               // "marketplace", "direct_link", "google", etc.
    referrer: string | null,      // Full referrer URL
    utmSource: string | null,
    utmMedium: string | null,
    utmCampaign: string | null,
    utmTerm: string | null,
    utmContent: string | null,
    pagePath: string              // Where inquiry was sent from
  },

  // Status
  status: ThreadStatus,           // "open", "archived", "blocked"

  // Messages (related records)
  messages: [
    {
      id: number,
      threadId: number,

      // Sender
      senderId: number,           // Either tenantId or marketplaceUserId
      senderType: "breeder" | "buyer",

      // Content
      subject: string | null,     // Only on first message
      message: string,            // Message body (plain text or light markdown)

      // Metadata
      read: boolean,              // Read by recipient

      // Timestamps
      createdAt: Date,
      readAt: Date | null
    }
  ],

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Listing Type Enum

| Value | Meaning | Example |
|-------|---------|---------|
| `offspring_group` | Inquiry about litter/offspring group | "I'm interested in Maple from Luna × Duke litter" |
| `animal` | Inquiry about individual animal listing | "Is Luna available for stud service?" |
| `service` | Inquiry about service listing | "Do you offer puppy training?" |
| `program` | General inquiry about breeding program | "Can you tell me more about your Goldendoodle program?" |

### How Inquiries Are Created

**Buyer Action** (on marketplace.breederhq.test):

1. Buyer browses marketplace, finds listing
2. Clicks "Message Breeder" or "Inquire" button
3. Message form appears:
   - To: [Breeder Name]
   - About: [Listing Title]
   - Subject: (optional, pre-filled: "Inquiry about [Listing Title]")
   - Message: (textarea, required)
4. Buyer submits form

**API**:
```
POST /api/v1/marketplace/inquiries
Body: {
  listingId: 123,
  listingType: "offspring_group",
  subject: "Inquiry about Luna × Duke Fall 2024",
  message: "Hi, I'm interested in Maple. Is she still available?",
  origin: {
    source: "marketplace",
    referrer: "https://google.com/search?q=goldendoodle+puppies",
    utmSource: "google",
    utmCampaign: "spring_2024",
    pagePath: "/programs/goldendoodle-program/offspring-groups/luna-duke-fall-2024"
  }
}
Response: { threadId, ...thread object }
```

**What Happens**:
- If thread exists for this buyer + breeder + listing, append to existing thread
- If no thread exists, create new thread
- Email notification sent to breeder (if enabled)
- Buyer redirected to `/inquiries` to see their message

### Breeder Inquiry Management UI

**Portal → Communications Hub**:

**Layout**: Three-pane

**Left Pane**: Smart Folders
- Inbox (unread messages)
- Sent (outgoing messages)
- Flagged (starred conversations)
- Drafts (unsent messages)
- Archived (completed conversations)
- Email (email channel messages)
- Direct Messages (DM channel messages)
- Templates (manage canned responses)

**Middle Pane**: Conversation List
- Each thread shows:
  - Buyer name (or "Anonymous Buyer" if not logged in)
  - Subject / Listing context ("Re: Luna × Duke Fall 2024")
  - Last message preview
  - Timestamp
  - Unread badge (if unread)
  - Listing type icon (puppy, animal, service, program)

**Right Pane**: Conversation View
- **Top**: Thread header
  - Buyer name
  - Listing context (link to listing)
  - Actions: Flag, Archive, Block

- **Middle**: Message history (chronological)
  - Each message shows:
    - Sender name (Buyer or Breeder)
    - Timestamp
    - Message body

- **Bottom**: Reply box
  - Textarea for reply
  - Template button (insert canned response)
  - Send button

- **Sidebar** (collapsible): Contact Insights
  - Contact info (name, email, phone, location)
  - Lead status (prospect, lead, customer, inactive)
  - Waitlist position (if on waitlist)
  - Active deposit (if has deposit)
  - Purchase history (total value)
  - Animals owned (count)
  - Last contacted date
  - Custom tags

### Responding to Inquiries

**Breeder Action**:

1. Select thread from middle pane
2. Read message in right pane
3. Type reply in text box at bottom
4. Optionally insert template:
   - Click template icon
   - Select template from list
   - Template text inserted, edit as needed
5. Click "Send"

**API**:
```
POST /api/v1/marketplace/threads/:threadId/messages
Body: { message: "Hi! Yes, Maple is still available. She's a sweet girl..." }
Response: { messageId, ...message object }
```

**What Happens**:
- Message appended to thread
- Email notification sent to buyer (if enabled)
- Thread moves to top of conversation list (sorted by most recent)
- Breeder's "Last Contacted" metric updated

### Flagging / Archiving / Blocking

**Flag** (star):
```
POST /api/v1/marketplace/threads/:threadId/flag
```
- Thread appears in "Flagged" folder
- Visual star indicator
- Use for important conversations

**Archive**:
```
POST /api/v1/marketplace/threads/:threadId/archive
```
- Thread moves to "Archived" folder
- Hidden from Inbox
- Can be unarchived later

**Block**:
```
POST /api/v1/marketplace/threads/:threadId/block
```
- Thread status → "blocked"
- Future messages from this buyer to this breeder are auto-hidden
- Use for spam or abusive buyers

### Templates (Canned Responses)

**Manage Templates**: Communications Hub → Templates

**Common Templates**:
- "Thanks for your inquiry! We'd love to chat..."
- "Maple is still available. Here's what you need to know..."
- "We require an application before reserving. You can apply at..."
- "Unfortunately, all puppies from this litter are reserved."

**Template Structure**:
```typescript
{
  id: number,
  tenantId: number,
  name: string,                 // "Initial Inquiry Response"
  content: string,              // Template text (supports {{variables}})
  category: string | null,      // "Inquiry", "Waitlist", "Deposit", etc.
  createdAt: Date
}
```

**API**:
```
GET    /api/v1/marketplace/templates          # List templates
POST   /api/v1/marketplace/templates          # Create template
PUT    /api/v1/marketplace/templates/:id      # Update template
DELETE /api/v1/marketplace/templates/:id      # Delete template
```

### Contact Insights (Sidebar)

When viewing a thread, the sidebar shows:

**Contact Info**:
- Full name
- Email
- Phone
- Location (city, state)
- "Edit Contact" link → opens Contact detail page

**Lead Status**:
- Prospect (never purchased)
- Lead (inquired, no purchase yet)
- Customer (has purchased)
- Inactive (no activity in 6+ months)

**Waitlist Position**:
- "On waitlist for Goldendoodle Program (#3 in line)"
- Link to waitlist entry

**Active Deposit**:
- "Deposit paid: $500 for Luna × Duke litter"
- Link to invoice/deposit

**Purchase History**:
- Total value of purchases: "$3,500"
- Count of animals purchased: "2 puppies"

**Animals Owned** (if tracked):
- "Owns: Maple (Goldendoodle, purchased 2024-01-15)"

**Last Contacted**:
- "Last message: 2024-01-10"

**Custom Tags**:
- Add/remove tags: "VIP", "Repeat Buyer", "High Priority"

### Engineers: Key Implementation Notes

1. **Thread Grouping**: Group messages by (tenantId, marketplaceUserId, listingId, listingType) to keep conversations together

2. **Unread Count**:
   ```typescript
   const unreadCount = threads.filter(t =>
     t.messages.some(m => m.senderType === "buyer" && !m.read)
   ).length;
   ```

3. **Origin Tracking**: Capture on every inquiry:
   - document.referrer (browser API)
   - UTM params from URL
   - Current page path
   - Source ("marketplace", "direct_link", "google")

4. **Real-time Updates**: Use WebSocket or polling for new message notifications

5. **Email Notifications**: Trigger email to breeder when new inquiry arrives (configurable in settings)

6. **Template Variables**: Support {{buyer_name}}, {{listing_title}}, {{breeder_name}} in templates

7. **Listing Context Display**:
   ```typescript
   function getListingContext(thread) {
     const type = thread.listingType;
     const listing = fetchListing(thread.listingId, type);
     return {
       icon: getIconForType(type),
       label: `Re: ${listing.title}`,
       url: getListingUrl(listing, type)
     };
   }
   ```

---

## Section 7: Waitlist Management

### What It Is
Waitlist Management allows breeders to accept and manage waitlist requests from buyers who want to reserve a spot for future offspring. Breeders can approve/decline requests and optionally require deposits.

### Where Breeders Manage It

**Primary**: Portal → Waitlist Management

**Alternative**: Marketplace Management → Waitlist (if v2 interface is built)

### Data Structure

**Waitlist Entry Record** (Marketplace DB):

```typescript
{
  id: number,

  // Parties
  tenantId: number,               // Breeder
  marketplaceUserId: number,      // Buyer

  // Program
  breedingProgramId: number,      // Which program is buyer on waitlist for

  // Request Details
  requestMessage: string,         // Buyer's message when joining
  preferences: string | null,     // Buyer's preferences (sex, color, etc.)

  // Status
  status: WaitlistStatus,         // PENDING, APPROVED, DECLINED

  // Approval/Decline
  approvedAt: Date | null,
  declinedAt: Date | null,
  declineReason: string | null,   // Reason shown to buyer if declined

  // Deposit (if required)
  depositRequired: boolean,
  depositAmountCents: number | null,
  depositDueDate: Date | null,
  depositInvoiceId: number | null,  // Links to Invoice record
  depositStatus: DepositStatus,     // "awaiting_payment", "partial", "paid", "overdue"

  // Position (order in waitlist)
  position: number,               // 1, 2, 3... (1 = first in line)

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Waitlist Status Enum

| Value | Meaning | Buyer Experience |
|-------|---------|-----------------|
| `PENDING` | Request under review | "Your request is being reviewed by the breeder" |
| `APPROVED` | Approved, on waitlist | "Congratulations! You've been approved" + deposit info if required |
| `DECLINED` | Request declined | "Unfortunately, your request was declined" + reason |

### Deposit Status Enum

| Value | Meaning |
|-------|---------|
| `awaiting_payment` | Deposit invoice created, not paid |
| `partial` | Partial payment received |
| `paid` | Deposit fully paid |
| `overdue` | Deposit due date passed, not paid |

### How Buyers Join Waitlist

**Buyer Action** (on marketplace.breederhq.test):

1. Go to breeder profile (`/breeders/:slug`)
2. Click on breeding program with "Waitlist Open" badge
3. Program details modal opens
4. Click "Join Waitlist" button
5. Waitlist request form appears:
   - Name (required, pre-filled if logged in)
   - Email (required, pre-filled if logged in)
   - Phone (optional)
   - Message/Preferences (optional): "Looking for a female, prefer cream color"
6. Submit form

**API**:
```
POST /api/v1/marketplace/waitlist
Body: {
  breedingProgramId: 5,
  requestMessage: "I'm looking for a family companion for my kids.",
  preferences: "Female, cream or apricot color preferred"
}
Response: { waitlistEntryId, status: "PENDING", ...entry }
```

**What Happens**:
- Waitlist entry created with status PENDING
- Email notification sent to breeder
- Buyer redirected to `/inquiries` → "Waitlist Requests" tab
- Entry shown as "Pending review"

### Breeder Waitlist Management UI

**Portal → Waitlist Management**:

**View**: Table grouped by breeding program

**Each Program Section**:
- Program name header
- Pending requests count badge
- Table of waitlist entries:

  | Position | Name | Email | Phone | Requested | Status | Deposit | Actions |
  |----------|------|-------|-------|-----------|--------|---------|---------|
  | 1 | Sarah Johnson | sarah@... | 555-1234 | 2024-01-15 | APPROVED | Paid | View, Move |
  | 2 | Mike Davis | mike@... | 555-5678 | 2024-01-16 | APPROVED | Awaiting | View, Move |
  | 3 | Lisa Chen | lisa@... | - | 2024-01-17 | PENDING | - | Approve, Decline |

**Filters**:
- Status dropdown (All, Pending, Approved, Declined)
- Program dropdown
- Search by name/email

### Approve Waitlist Request

**Breeder Action**:

1. Find pending request in table
2. Click "Approve" button
3. Approval dialog opens:
   - **Require Deposit?** (toggle)
   - If yes:
     - Deposit Amount ($): 500
     - Due Date: (date picker)
4. Click "Confirm Approval"

**API**:
```
POST /api/v1/marketplace/waitlist/:id/approve
Body: {
  depositRequired: true,
  depositAmountCents: 50000,
  depositDueDate: "2024-02-01"
}
Response: { ...updated entry with status: "APPROVED", depositInvoiceId: 789 }
```

**What Happens**:
- Entry status → APPROVED
- `approvedAt` timestamp set
- Position assigned (next available number)
- If deposit required:
  - Invoice created in marketplace DB
  - Invoice linked to waitlist entry
  - Email sent to buyer with "Pay Now" link
- Buyer sees in `/inquiries` → "Waitlist Requests":
  - "Congratulations! You've been approved for [Program Name]"
  - If deposit required: "Deposit of $500 due by Feb 1, 2024" + "Pay Now" button

### Decline Waitlist Request

**Breeder Action**:

1. Find pending request
2. Click "Decline" button
3. Decline dialog opens:
   - **Reason** (optional textarea): "Unfortunately, we're not accepting new waitlist members at this time."
4. Click "Confirm Decline"

**API**:
```
POST /api/v1/marketplace/waitlist/:id/decline
Body: {
  declineReason: "Unfortunately, we're not accepting new waitlist members at this time."
}
Response: { ...updated entry with status: "DECLINED" }
```

**What Happens**:
- Entry status → DECLINED
- `declinedAt` timestamp set
- Email sent to buyer
- Buyer sees in `/inquiries` → "Waitlist Requests":
  - "Unfortunately, your request was declined"
  - Reason shown (if provided)

### Create Deposit Invoice

**If Approved with Deposit**:

**Invoice Record** (Marketplace DB):

```typescript
{
  id: number,
  tenantId: number,               // Breeder
  marketplaceUserId: number,      // Buyer

  // Invoice Details
  invoiceType: "deposit",
  amountCents: number,            // 50000 ($500)
  dueDate: Date,

  // Payment
  stripeInvoiceId: string | null, // Stripe Invoice ID (if Stripe payment)
  paymentStatus: PaymentStatus,   // "pending", "paid", "overdue"
  paidAt: Date | null,

  // Context
  waitlistEntryId: number,        // Links back to waitlist entry

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Buyer Payment Flow**:

1. Buyer goes to `/inquiries` → "Waitlist Requests" tab
2. Sees approved request with "Deposit Required"
3. Clicks "Pay Now" button
4. Redirected to Stripe Checkout
5. Completes payment
6. Redirected back to marketplace
7. Deposit status updates to "Paid"

**API** (for checkout):
```
POST /api/v1/marketplace/invoices/:invoiceId/checkout
Response: { checkoutUrl: "https://checkout.stripe.com/..." }
```

**Webhook** (Stripe payment success):
```
POST /webhooks/stripe
Body: { event: "invoice.payment_succeeded", invoiceId: "in_..." }
```
- Updates invoice: paymentStatus → "paid", paidAt → now
- Updates waitlist entry: depositStatus → "paid"
- Email confirmation sent to buyer and breeder

### Reorder Waitlist (Change Position)

**Breeder Action**:

1. In waitlist table, drag row to new position
2. OR click "Move" button, enter new position number

**API**:
```
PUT /api/v1/marketplace/waitlist/:id/position
Body: { position: 2 }
Response: { ...updated entry }
```

**What Happens**:
- Entry position updated
- Other entries' positions adjusted (e.g., if moved to #2, old #2 becomes #3)
- Buyer notified of position change (email)

### Buyer Waitlist View

**Buyer UI** (`/inquiries` → "Waitlist Requests" tab):

**List of Requests** grouped by status:

**PENDING**:
```
┌─────────────────────────────────────────────────────────┐
│ Goldendoodle Program                                     │
│ Status: Pending Review                                   │
│ Requested: Jan 15, 2024                                  │
│ Your request is being reviewed by the breeder.           │
└─────────────────────────────────────────────────────────┘
```

**APPROVED** (no deposit):
```
┌─────────────────────────────────────────────────────────┐
│ Goldendoodle Program                                     │
│ Status: Approved ✓                                       │
│ Position: #3 in waitlist                                 │
│ Congratulations! You've been approved.                   │
│ The breeder will contact you when a litter is ready.     │
└─────────────────────────────────────────────────────────┘
```

**APPROVED** (deposit required, awaiting payment):
```
┌─────────────────────────────────────────────────────────┐
│ Goldendoodle Program                                     │
│ Status: Approved ✓ - Deposit Required                   │
│ Position: #2 in waitlist                                 │
│ Amount: $500                                              │
│ Due: Feb 1, 2024                                          │
│ Status: Awaiting Payment ⚠                               │
│ [Pay Now] button                                          │
└─────────────────────────────────────────────────────────┘
```

**APPROVED** (deposit paid):
```
┌─────────────────────────────────────────────────────────┐
│ Goldendoodle Program                                     │
│ Status: Approved ✓ - Deposit Paid                       │
│ Position: #1 in waitlist                                 │
│ Deposit: $500 (Paid Jan 20, 2024) ✓                     │
│ You're next in line! The breeder will reach out soon.    │
└─────────────────────────────────────────────────────────┘
```

**DECLINED**:
```
┌─────────────────────────────────────────────────────────┐
│ Goldendoodle Program                                     │
│ Status: Declined                                          │
│ Unfortunately, your request was declined.                │
│ Reason: We're not accepting new waitlist members at      │
│         this time. Please check back in a few months.    │
└─────────────────────────────────────────────────────────┘
```

### Engineers: Key Implementation Notes

1. **Position Management**: Ensure positions are unique and sequential per program:
   ```typescript
   // When approving, assign next position
   const maxPosition = getMaxPosition(breedingProgramId);
   entry.position = maxPosition + 1;
   ```

2. **Deposit Status Calculation**:
   ```typescript
   function calculateDepositStatus(invoice, dueDate) {
     if (invoice.paymentStatus === "paid") return "paid";
     if (isPast(dueDate)) return "overdue";
     if (invoice.paymentStatus === "partial") return "partial";
     return "awaiting_payment";
   }
   ```

3. **Email Notifications**:
   - Breeder: New waitlist request
   - Buyer: Approved (with deposit details if required)
   - Buyer: Declined (with reason)
   - Buyer: Position changed
   - Buyer: Deposit reminder (24 hours before due date)
   - Both: Deposit paid confirmation

4. **Stripe Integration**:
   - Create Stripe Invoice for deposit
   - Generate Stripe Checkout URL for "Pay Now"
   - Handle webhook for payment success

5. **Waitlist Badge on Program**:
   ```typescript
   // Show "Waitlist Open" badge if:
   program.openWaitlist === true
   ```

6. **Waitlist Count Display** (on program card):
   ```typescript
   const waitlistCount = getApprovedWaitlistCount(programId);
   // Display: "3 on waitlist"
   ```

---

## Cross-Module Data Linking

### Understanding Cross-Database Relationships

BreederHQ uses a **dual-database architecture**:

1. **Tenant Database** (PostgreSQL, multi-tenant):
   - Private breeder data
   - Animals, Breeding Plans, Offspring Groups
   - Each tenant has isolated data

2. **Marketplace Database** (PostgreSQL, single-tenant):
   - Public marketplace data
   - Breeding Programs, Marketplace Profiles, Service Listings
   - Inquiries, Waitlist Entries, Invoices

**Critical**: These databases are **separate** with **no foreign key constraints** between them. Linking is done via stored IDs.

### Linking Patterns

**Pattern 1: Animal → Public Listing**

```
Tenant DB:
  Animal (id: 123, tenantId: 5, name: "Luna", species: DOG, breed: "Golden Retriever")
    └── publicListing: {
          intent: "STUD_SERVICE",
          headline: "Champion Bloodline Golden Retriever Stud",
          status: "LIVE"
        }

Marketplace DB:
  (No separate record - listing data stored on Animal record in tenant DB)

Public Display Query:
  1. Query tenant DB: WHERE Animal.publicListing.status = "LIVE"
  2. Return Animal data + publicListing fields
  3. Respect Animal.privacy settings
```

**Pattern 2: Breeding Program ← Breeding Plan ← Offspring Group**

```
Marketplace DB:
  BreedingProgram (id: 10, tenantId: 5, name: "Goldendoodle Program", species: DOG, breedText: "Goldendoodle")

Tenant DB:
  BreedingPlan (id: 50, tenantId: 5, breedingProgramId: 10, damId: 123, sireId: 456, status: "COMMITTED")
    └── Linked to BreedingProgram via breedingProgramId

  OffspringGroup (id: 75, tenantId: 5, breedingPlanId: 50, breedingProgramId: 10, published: true)
    └── Inherits breedingProgramId from BreedingPlan
    └── Individual Offspring (multiple records, each with offspringGroupId: 75)

Public Display Query:
  1. Query tenant DB: WHERE OffspringGroup.breedingProgramId = 10 AND published = true
  2. For each OffspringGroup, query Individual Offspring WHERE offspringGroupId = 75
  3. Join with Animals (Dam/Sire) WHERE id IN (damId, sireId)
  4. Respect Animal.privacy settings for parent data
  5. Return aggregated data for public display
```

**Pattern 3: Service Listing**

```
Marketplace DB:
  ServiceListing (id: 20, tenantId: 5, serviceType: "TRAINING", title: "Puppy Training", status: "ACTIVE")

Public Display Query:
  1. Query marketplace DB: WHERE ServiceListing.status = "ACTIVE"
  2. Join with MarketplaceProfile WHERE tenantId = 5
  3. Return service listing + breeder info
```

**Pattern 4: Inquiry Thread**

```
Marketplace DB:
  MessageThread (id: 100, tenantId: 5, marketplaceUserId: 200, listingId: 75, listingType: "offspring_group")
    └── Messages (multiple records, each with threadId: 100)

Context Resolution:
  1. Query marketplace DB: WHERE MessageThread.tenantId = 5
  2. For each thread, resolve listing context:
     - If listingType = "offspring_group": Query tenant DB WHERE OffspringGroup.id = listingId
     - If listingType = "animal": Query tenant DB WHERE Animal.id = listingId
     - If listingType = "service": Query marketplace DB WHERE ServiceListing.id = listingId
     - If listingType = "program": Query marketplace DB WHERE BreedingProgram.id = listingId
  3. Display thread with listing context (title, image, link)
```

### Data Sync & Consistency

**Challenge**: No foreign keys means no cascade deletes. Must handle manually.

**Scenarios**:

**Scenario 1: Breeder deletes Animal**
```
1. Animal deleted from tenant DB
2. If Animal.publicListing exists:
   - Should we auto-delete listing? YES
   - Soft delete: Set Animal.deleted = true, hide from marketplace
   - Hard delete: Remove Animal record entirely
3. If inquiries exist about this animal:
   - Keep inquiry threads (historical record)
   - Show listing as "[Listing no longer available]"
```

**Scenario 2: Breeder deletes Breeding Program**
```
1. Check if Breeding Plans linked (WHERE breedingProgramId = programId)
2. If yes: BLOCK delete, show error "Unlink breeding plans first"
3. If no: Delete BreedingProgram from marketplace DB
4. If inquiries exist about this program:
   - Keep inquiry threads
   - Show program as "[Program no longer available]"
```

**Scenario 3: Breeder unpublishes Offspring Group**
```
1. OffspringGroup.published → false (tenant DB)
2. No cascade needed
3. If inquiries exist about this group:
   - Keep threads, still accessible to breeder and buyer
   - Public link shows "Listing no longer available"
```

### Engineers: Critical Implementation Notes

1. **No Foreign Keys**: You **cannot** use SQL foreign keys across databases. Use stored IDs and application-level validation.

2. **Join Strategy**: Use application-level joins (fetch from DB1, then fetch from DB2) or use connection pooling to both DBs and JOIN in application code.

3. **Data Privacy**: ALWAYS check privacy settings before exposing tenant data:
   ```typescript
   if (animal.privacy.namePublic && animal.publicListing.status === "LIVE") {
     // Show name
   }
   ```

4. **Orphaned Record Detection**: Periodically check for orphaned records:
   ```sql
   -- Find offspring groups linked to non-existent programs
   SELECT * FROM OffspringGroup
   WHERE breedingProgramId IS NOT NULL
   AND breedingProgramId NOT IN (SELECT id FROM marketplace.BreedingProgram);
   ```

5. **Cascade Deletes**: Implement manually:
   ```typescript
   // When deleting Animal
   if (animal.publicListing) {
     // Hide from marketplace
     animal.publicListing.status = "PAUSED";
     // Or fully delete listing data
   }
   ```

6. **Context Resolution**: When displaying inquiry threads, resolve context:
   ```typescript
   async function resolveListingContext(thread) {
     const { listingId, listingType } = thread;

     switch (listingType) {
       case "offspring_group":
         return await tenantDB.query("SELECT * FROM OffspringGroup WHERE id = ?", [listingId]);
       case "animal":
         return await tenantDB.query("SELECT * FROM Animal WHERE id = ?", [listingId]);
       case "service":
         return await marketplaceDB.query("SELECT * FROM ServiceListing WHERE id = ?", [listingId]);
       case "program":
         return await marketplaceDB.query("SELECT * FROM BreedingProgram WHERE id = ?", [listingId]);
     }
   }
   ```

---

## Navigation & Entry Points

### Breeder Entry Point (app.breederhq.test)

**CRITICAL**: Breeders access marketplace management ONLY through `app.breederhq.test` (their authenticated portal).

**Navigation Structure**:

**Top-Level Nav** (main app navigation):
- Dashboard
- Animals
- Breeding
- Contacts
- Communications
- Marketing
- **Marketplace** ← NEW
- Financials
- Documents
- Settings

**When Breeder Clicks "Marketplace"**:

**Option A**: Sub-navigation sidebar appears (preferred):
```
Marketplace
├── Overview (dashboard: stats, recent inquiries)
├── My Storefront (profile settings)
├── Breeding Programs (list/manage programs)
├── Animal Listings (list/manage animal listings)
├── Offspring Groups (list/manage offspring group listings)
├── Services (list/manage service listings)
├── Inquiries (message center)
└── Waitlist (waitlist management)
```

**Option B**: Dropdown menu with direct links to sections

**Option C**: Single dashboard page with cards linking to each section

**Recommended**: **Option A** (sidebar) for best UX - keeps user in context.

### URL Structure

**Breeder-Side** (management interface):
```
app.breederhq.test/marketplace-manage/storefront
app.breederhq.test/marketplace-manage/programs
app.breederhq.test/marketplace-manage/programs/:id/edit
app.breederhq.test/marketplace-manage/animals
app.breederhq.test/marketplace-manage/offspring-groups
app.breederhq.test/marketplace-manage/offspring-groups/:id/edit
app.breederhq.test/marketplace-manage/services
app.breederhq.test/marketplace-manage/services/:id/edit
app.breederhq.test/marketplace-manage/inquiries
app.breederhq.test/marketplace-manage/waitlist
```

**Alternative** (shorter URLs):
```
app.breederhq.test/me/marketplace
app.breederhq.test/me/marketplace/programs
app.breederhq.test/me/marketplace/animals
... etc
```

**Public-Side** (marketplace browse):
```
marketplace.breederhq.test/
marketplace.breederhq.test/animals
marketplace.breederhq.test/breeders
marketplace.breederhq.test/breeders/:tenantSlug
marketplace.breederhq.test/breeding-programs
marketplace.breederhq.test/services
marketplace.breederhq.test/programs/:programSlug/offspring-groups/:listingSlug
marketplace.breederhq.test/programs/:programSlug/animals/:urlSlug
marketplace.breederhq.test/services/:slug
marketplace.breederhq.test/inquiries
marketplace.breederhq.test/updates
```

### Permissions & Access Control

**Who Can Access Marketplace Management**:
- Breeders with **active BreederHQ subscriptions** (paying customers)
- Subscription tier determines features (e.g., Premium can list 10 animals, Business can list unlimited)

**Non-Breeders**:
- Can browse public marketplace (`marketplace.breederhq.test`)
- Can send inquiries
- Can join waitlists
- CANNOT access breeder management interface

**Checking Permissions** (backend):
```typescript
function canAccessMarketplaceManagement(user) {
  return user.role === "BREEDER" && user.subscriptionStatus === "ACTIVE";
}

function canPublishListing(user, listingType) {
  const limits = getSubscriptionLimits(user.subscriptionTier);

  if (listingType === "animal") {
    const currentCount = getPublishedAnimalCount(user.tenantId);
    return currentCount < limits.maxAnimals;
  }

  // Similar checks for other listing types
}
```

### Engineers: Navigation Implementation Notes

1. **Conditional Rendering**: Only show "Marketplace" nav item if user has access:
   ```tsx
   {canAccessMarketplace && (
     <NavItem to="/marketplace-manage">Marketplace</NavItem>
   )}
   ```

2. **Route Protection**: Protect all `/marketplace-manage/*` routes:
   ```typescript
   <ProtectedRoute
     path="/marketplace-manage/*"
     requiredRole="BREEDER"
     requiredSubscription="ACTIVE"
   />
   ```

3. **Subscription Limits**: Check limits before allowing create/publish actions:
   ```typescript
   if (publishedAnimalCount >= subscriptionLimits.maxAnimals) {
     showError("You've reached your plan limit. Upgrade to publish more listings.");
     showUpgradePrompt();
     return;
   }
   ```

4. **Active Sidebar State**: Highlight current section in sidebar based on route

5. **Breadcrumbs**: Show breadcrumb trail:
   ```
   Marketplace > Offspring Groups > Edit Luna × Duke Fall 2024
   ```

---

## API Integration Reference

### Complete API Endpoint List

**Breeder Profile**:
```
GET    /api/v1/marketplace/profile                    # Get draft + published profile
PUT    /api/v1/marketplace/profile/draft              # Save draft
POST   /api/v1/marketplace/profile/publish            # Publish profile
```

**Breeding Programs**:
```
GET    /api/v1/breeding/programs                      # List my programs
GET    /api/v1/breeding/programs/:id                  # Get program details
POST   /api/v1/breeding/programs                      # Create program
PUT    /api/v1/breeding/programs/:id                  # Update program
DELETE /api/v1/breeding/programs/:id                  # Delete program
GET    /api/v1/breeding/programs/:id/media            # List media
POST   /api/v1/breeding/programs/:id/media            # Add media
PUT    /api/v1/breeding/programs/:id/media/:mediaId   # Update media
DELETE /api/v1/breeding/programs/:id/media/:mediaId   # Delete media
PUT    /api/v1/breeding/programs/:id/media/reorder    # Reorder media
```

**Offspring Groups**:
```
GET    /api/v1/offspring                              # List all offspring groups
GET    /api/v1/offspring/:id                          # Get offspring group
POST   /api/v1/offspring                              # Create offspring group (manual)
PATCH  /api/v1/offspring/:id                          # Update offspring group
DELETE /api/v1/offspring/:id                          # Delete offspring group
POST   /api/v1/offspring/:id/archive                  # Archive group
POST   /api/v1/offspring/:id/restore                  # Restore group
```

**Individual Offspring**:
```
GET    /api/v1/offspring/individuals                  # List all individual offspring
GET    /api/v1/offspring/individuals/:id              # Get individual
POST   /api/v1/offspring/individuals                  # Create individual
PATCH  /api/v1/offspring/individuals/:id              # Update individual
DELETE /api/v1/offspring/individuals/:id              # Delete individual
POST   /api/v1/offspring/individuals/:id/bulk         # Bulk update (for marketplace fields)
```

**Animal Public Listings**:
```
GET    /api/v1/animals/:id/public-listing             # Get animal listing
PUT    /api/v1/animals/:id/public-listing             # Create/update listing
PATCH  /api/v1/animals/:id/public-listing/status      # Change status (DRAFT/LIVE/PAUSED/SOLD)
DELETE /api/v1/animals/:id/public-listing             # Delete listing
```

**Service Listings**:
```
GET    /api/v1/services                               # List my services
GET    /api/v1/services/:id                           # Get service
POST   /api/v1/services                               # Create service
PUT    /api/v1/services/:id                           # Update service
DELETE /api/v1/services/:id                           # Delete service
```

**Inquiries & Messages**:
```
GET    /api/v1/marketplace/threads                    # List message threads
GET    /api/v1/marketplace/threads/:id                # Get thread with messages
POST   /api/v1/marketplace/threads/:id/messages       # Send message
POST   /api/v1/marketplace/threads/:id/flag           # Flag thread
POST   /api/v1/marketplace/threads/:id/archive        # Archive thread
POST   /api/v1/marketplace/threads/:id/block          # Block thread
GET    /api/v1/marketplace/templates                  # List canned response templates
POST   /api/v1/marketplace/templates                  # Create template
PUT    /api/v1/marketplace/templates/:id              # Update template
DELETE /api/v1/marketplace/templates/:id              # Delete template
```

**Waitlist**:
```
GET    /api/v1/marketplace/waitlist                   # List waitlist entries for my programs
GET    /api/v1/marketplace/waitlist/:id               # Get waitlist entry details
POST   /api/v1/marketplace/waitlist/:id/approve       # Approve request
POST   /api/v1/marketplace/waitlist/:id/decline       # Decline request
PUT    /api/v1/marketplace/waitlist/:id/position      # Change position
```

**Invoices & Deposits**:
```
GET    /api/v1/marketplace/invoices                   # List invoices
GET    /api/v1/marketplace/invoices/:id               # Get invoice
POST   /api/v1/marketplace/invoices                   # Create invoice (for deposit)
POST   /api/v1/marketplace/invoices/:id/checkout      # Generate Stripe checkout URL
```

**Public Browse Endpoints** (used by marketplace.breederhq.test):
```
GET    /api/v1/marketplace/breeders                   # List published breeders
GET    /api/v1/marketplace/breeders/:slug             # Get breeder profile
GET    /api/v1/marketplace/breeding-programs          # List published programs
GET    /api/v1/marketplace/programs/:slug             # Get program details
GET    /api/v1/marketplace/programs/:slug/offspring-groups  # List offspring groups for program
GET    /api/v1/marketplace/programs/:slug/offspring-groups/:listing  # Get offspring group listing
GET    /api/v1/marketplace/programs/:slug/animals     # List animal listings for program
GET    /api/v1/marketplace/programs/:slug/animals/:slug  # Get animal listing
GET    /api/v1/marketplace/offspring-groups           # Browse all offspring groups
GET    /api/v1/marketplace/services                   # Browse all services
POST   /api/v1/marketplace/inquiries                  # Send inquiry (from buyer)
```

### Request/Response Examples

**Create Breeding Program**:
```typescript
POST /api/v1/breeding/programs
Headers: { Authorization: "Bearer {token}" }
Body: {
  name: "Goldendoodle Program",
  species: "DOG",
  breedText: "F1b Goldendoodle",
  description: "Our Goldendoodle program focuses on health, temperament, and low-shedding coats.",
  listed: true,
  acceptInquiries: true,
  openWaitlist: true,
  acceptReservations: false,
  pricingTiers: [
    {
      name: "Pet",
      priceMin: 200000,
      priceMax: 250000,
      description: "Family companion with limited registration"
    },
    {
      name: "Show",
      priceMin: 300000,
      priceMax: 400000,
      description: "Show potential with full registration"
    }
  ],
  whatsIncluded: "Age-appropriate vaccinations, microchip, 2-year health guarantee, lifetime support",
  typicalWaitTime: "3-6 months"
}

Response: 201 Created
{
  id: 10,
  tenantId: 5,
  slug: "goldendoodle-program",
  ...all fields from request,
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  publishedAt: "2024-01-15T10:30:00Z"
}
```

**Publish Offspring Group**:
```typescript
PATCH /api/v1/offspring/75
Headers: { Authorization: "Bearer {token}" }
Body: {
  published: true,
  listingTitle: "Luna × Duke Fall 2024",
  listingDescription: "Beautiful F1b Goldendoodles ready for their forever homes in January 2025.",
  listingSlug: "luna-duke-fall-2024",
  coverImageUrl: "https://storage.example.com/images/litter-cover.jpg",
  marketplaceDefaultPriceCents: 300000
}

Response: 200 OK
{
  id: 75,
  tenantId: 5,
  breedingPlanId: 50,
  breedingProgramId: 10,
  damId: 123,
  sireId: 456,
  published: true,
  listingTitle: "Luna × Duke Fall 2024",
  listingSlug: "luna-duke-fall-2024",
  ...all fields,
  offspring: [
    {
      id: 1001,
      name: "Maple",
      sex: "FEMALE",
      collarColorName: "Cream",
      collarColorHex: "#FFFDD0",
      keeperIntent: "AVAILABLE",
      marketplaceListed: true,
      marketplacePriceCents: null  // Uses group default
    },
    ...more offspring
  ],
  createdAt: "2024-10-01T08:00:00Z",
  updatedAt: "2024-01-15T11:00:00Z"
}
```

**Approve Waitlist Request with Deposit**:
```typescript
POST /api/v1/marketplace/waitlist/200/approve
Headers: { Authorization: "Bearer {token}" }
Body: {
  depositRequired: true,
  depositAmountCents: 50000,
  depositDueDate: "2024-02-01"
}

Response: 200 OK
{
  id: 200,
  tenantId: 5,
  marketplaceUserId: 300,
  breedingProgramId: 10,
  status: "APPROVED",
  approvedAt: "2024-01-15T12:00:00Z",
  depositRequired: true,
  depositAmountCents: 50000,
  depositDueDate: "2024-02-01",
  depositInvoiceId: 789,
  depositStatus: "awaiting_payment",
  position: 3,
  ...rest of fields
}
```

---

## State Management & Data Sync

### Client-Side State Management

**Recommended Architecture**: Use React Context or Redux for managing marketplace state.

**Key State Slices**:

1. **Breeder Profile State**:
   ```typescript
   {
     draft: { ...profile fields },
     published: { ...profile fields },
     isLoading: boolean,
     error: string | null
   }
   ```

2. **Breeding Programs State**:
   ```typescript
   {
     programs: BreedingProgram[],
     selectedProgram: BreedingProgram | null,
     isLoading: boolean,
     error: string | null
   }
   ```

3. **Offspring Groups State**:
   ```typescript
   {
     groups: OffspringGroup[],
     selectedGroup: OffspringGroup | null,
     individuals: IndividualOffspring[],
     isLoading: boolean,
     error: string | null
   }
   ```

4. **Services State**:
   ```typescript
   {
     services: ServiceListing[],
     selectedService: ServiceListing | null,
     isLoading: boolean,
     error: string | null
   }
   ```

5. **Inquiries State**:
   ```typescript
   {
     threads: MessageThread[],
     selectedThread: MessageThread | null,
     unreadCount: number,
     isLoading: boolean,
     error: string | null
   }
   ```

6. **Waitlist State**:
   ```typescript
   {
     entries: WaitlistEntry[],
     selectedEntry: WaitlistEntry | null,
     isLoading: boolean,
     error: string | null
   }
   ```

### Real-Time Updates

**Challenge**: Buyers send inquiries while breeder is viewing inbox. How to notify?

**Options**:

**Option A: WebSocket (Recommended)**:
```typescript
// Connect to WebSocket on app load
const ws = new WebSocket("wss://api.breederhq.com/marketplace/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "NEW_INQUIRY") {
    // Update inquiries state
    dispatch({ type: "ADD_INQUIRY", payload: data.thread });
    // Show toast notification
    showNotification("New inquiry from " + data.thread.buyerName);
  }
};
```

**Option B: Polling**:
```typescript
// Poll for new inquiries every 30 seconds
setInterval(() => {
  fetchUnreadInquiries().then(threads => {
    dispatch({ type: "UPDATE_INQUIRIES", payload: threads });
  });
}, 30000);
```

**Option C: Server-Sent Events (SSE)**:
```typescript
const eventSource = new EventSource("/api/v1/marketplace/events");
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle updates
};
```

**Recommended**: **WebSocket** for best real-time experience.

### Optimistic Updates

**Pattern**: Update UI immediately, rollback if API fails.

**Example: Toggle Offspring Listed**:
```typescript
function toggleOffspringListed(offspringId, currentValue) {
  // 1. Optimistic update
  dispatch({
    type: "UPDATE_OFFSPRING",
    payload: { id: offspringId, marketplaceListed: !currentValue }
  });

  // 2. API call
  api.updateOffspring(offspringId, { marketplaceListed: !currentValue })
    .then(response => {
      // 3. Confirm with server response
      dispatch({ type: "UPDATE_OFFSPRING_SUCCESS", payload: response });
    })
    .catch(error => {
      // 4. Rollback on error
      dispatch({
        type: "UPDATE_OFFSPRING_ROLLBACK",
        payload: { id: offspringId, marketplaceListed: currentValue }
      });
      showError("Failed to update. Please try again.");
    });
}
```

### Data Refresh Strategies

**When to Refresh**:

1. **On Page Load**: Fetch fresh data
2. **After Mutation**: Refetch affected data
3. **On Focus**: Refetch when user returns to tab
4. **Periodic**: Refresh stale data every N minutes

**Example with React Query**:
```typescript
const { data: programs, isLoading } = useQuery(
  ["programs"],
  fetchPrograms,
  {
    staleTime: 5 * 60 * 1000,  // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 60 * 1000  // 10 minutes
  }
);
```

---

## Permission & Visibility Controls

### Subscription-Based Limits

**Example Subscription Tiers**:

| Tier | Max Animal Listings | Max Services | Max Programs | Waitlist | Deposits |
|------|-------------------|--------------|--------------|----------|----------|
| Starter | 3 | 1 | 2 | ✓ | ✗ |
| Pro | 10 | 3 | 5 | ✓ | ✓ |
| Business | Unlimited | Unlimited | Unlimited | ✓ | ✓ |

**Enforcing Limits**:

```typescript
function canPublishAnimalListing(tenantId) {
  const tier = getSubscriptionTier(tenantId);
  const limits = TIER_LIMITS[tier];
  const currentCount = getPublishedAnimalCount(tenantId);

  if (limits.maxAnimals === "unlimited") return true;
  return currentCount < limits.maxAnimals;
}
```

**UI Behavior**:
- Show limit badge: "3 of 10 listings used"
- Disable "Publish" button if limit reached
- Show upgrade prompt when limit hit

### Privacy Controls

**Animal-Level Privacy** (from Animals module):

```typescript
animalPrivacy: {
  namePublic: boolean,
  photoPublic: boolean,
  healthRecordsPublic: boolean,
  pedigreePublic: boolean,
  geneticsPublic: boolean,
  registryPublic: boolean
}
```

**Enforcement in Public Display**:
```typescript
function renderAnimalListing(animal) {
  return {
    name: animal.privacy.namePublic ? animal.name : "Available",
    photo: animal.privacy.photoPublic ? animal.photo : placeholderImage,
    healthRecords: animal.privacy.healthRecordsPublic ? animal.healthRecords : null,
    // etc.
  };
}
```

### Role-Based Access Control

**Roles**:
- `BREEDER`: Can manage own marketplace listings
- `BUYER`: Can browse and inquire
- `SERVICE_PROVIDER`: Can manage own service listings (separate from breeders)
- `ADMIN`: Platform admin, can view all

**Route Protection**:
```typescript
<ProtectedRoute
  path="/marketplace-manage/*"
  allowedRoles={["BREEDER"]}
  requiredSubscription="ACTIVE"
/>
```

---

## Final Notes for Engineers

### Critical Reminders

1. **Dual Database**: Always remember you're working across TWO databases with NO foreign keys between them

2. **Privacy First**: Always check privacy settings before displaying animal/breeder data

3. **Hierarchical Data**: Respect the hierarchy: OffspringGroup → BreedingPlan → BreedingProgram

4. **Subscription Limits**: Enforce tier limits at API level AND UI level

5. **Slug Uniqueness**: Enforce tenant-scoped uniqueness for all slugs

6. **Real-Time Updates**: Implement WebSocket or polling for inquiries

7. **Optimistic Updates**: Use for better UX, with rollback on error

8. **State Management**: Use React Context/Redux for managing complex state

9. **Error Handling**: Always handle API errors gracefully with user-friendly messages

10. **Accessibility**: Ensure WCAG 2.1 AA compliance throughout

### Testing Checklist

**Unit Tests**:
- [ ] Privacy enforcement logic
- [ ] Subscription limit checks
- [ ] Slug generation uniqueness
- [ ] Price display logic (fixed, range, contact)
- [ ] Keeper intent filtering (AVAILABLE vs KEEPER)

**Integration Tests**:
- [ ] Create breeding program → link breeding plan → create offspring group → publish
- [ ] Create animal listing → publish → unpublish → delete
- [ ] Create service listing → publish → receive inquiry → respond
- [ ] Approve waitlist request → create deposit → buyer pays → status updates

**E2E Tests** (with Playwright):
- [ ] Breeder creates breeding program
- [ ] Breeder publishes offspring group
- [ ] Buyer browses marketplace, finds listing
- [ ] Buyer sends inquiry
- [ ] Breeder receives and responds to inquiry
- [ ] Buyer joins waitlist
- [ ] Breeder approves with deposit
- [ ] Buyer pays deposit

### Performance Considerations

**Optimize Queries**:
- Use pagination for lists (programs, offspring groups, services)
- Lazy load media (images, videos)
- Cache frequently accessed data (breeder profiles)
- Use indexes on queried fields (tenantId, status, published, slug)

**Example Pagination**:
```typescript
GET /api/v1/breeding/programs?page=1&limit=20
Response: {
  programs: [...20 programs],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8
  }
}
```

---

## Conclusion

This guide provides the **complete A→Z picture** of breeder marketplace management for BreederHQ. It covers:

✅ All 7 marketplace management sections
✅ Hierarchical data flow and cross-database linking
✅ Complete API reference
✅ State management strategies
✅ Privacy and permission controls
✅ Navigation and entry points
✅ Real-world implementation examples

**Engineers**: Use this as your **single source of truth** when building the breeder marketplace management interface. Refer back to specific sections as needed during implementation.

**Questions?** If anything is unclear or you need more detail on a specific topic, ask for clarification before implementing.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-13
**Maintained By**: BreederHQ Engineering Team
