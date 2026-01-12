# Marketplace Management Portal v2

> Design document for a comprehensive breeder-side marketplace management experience.

**Status:** DRAFT
**Last Updated:** 2025-01-11
**Author:** Claude + Aaron

---

## Overview

This document outlines the design for a new, unified Marketplace Management Portal that allows breeders to manage all aspects of their marketplace presence from a single location.

### Design Principles

1. **Greenfield build** - New code, not modifications to existing marketplace pages
2. **Backend-first** - Leverage existing API capabilities (most already exist)
3. **Unified experience** - Single portal for all marketplace management
4. **Progressive disclosure** - Simple by default, advanced when needed

### What This Replaces

- Current "Manage My Listing" page (inadequate)
- Current "Marketplace" tab on animal detail pages (incomplete)
- Scattered settings across platform

### What This Does NOT Touch

- Public-facing marketplace browse pages
- Buyer-side inquiry/messaging flows
- Existing marketplace routes (we build alongside, not replace)

---

## Portal Structure

```
/marketplace-manage (or /me/marketplace)
├── /storefront      - Breeder profile & settings
├── /programs        - Breeding programs
├── /animals         - Individual animal listings (stud, rehome, etc.)
├── /litters         - Offspring group listings
├── /services        - Service listings
├── /inquiries       - Message center
└── /waitlist        - Waitlist management
```

---

## Section 1: My Storefront

**Route:** `/marketplace-manage/storefront`

**Purpose:** Manage the public-facing breeder profile that appears on the marketplace.

**Status:** 🔄 UNDER REVIEW

---

### 1.1 UX Model: Preview-First, Toggle-to-Hide

**Core principle:** Instead of forms where breeders fill in fields and toggle visibility, we show them a **live preview** of their marketplace profile with all available data aggregated. They toggle OFF what they don't want shown.

**How it works:**

1. **Aggregate everything** - Pull all data that could be displayed from across the platform
2. **Render as preview** - Show the page as a buyer would see it
3. **Toggle to hide** - Everything defaults to visible; breeder turns OFF what they don't want
4. **Source-aware** - Each element shows where the data comes from with "Edit →" links
5. **Custom fields always available** - Breeder can add data we didn't think of

**UI Modes:**
- **Preview Mode** (default) - See your profile as buyers will see it
- **Edit Mode** - Detailed field editing with validation

---

### 1.2 Data Sources & Aggregation

The Storefront preview aggregates data from multiple sources:

| Section | Data Source | Edit Location |
|---------|-------------|---------------|
| Business Name | Tenant settings | Account Settings |
| Logo / Banner | Marketplace profile | This page |
| Bio / About | Marketplace profile | This page |
| Location | Tenant address | Account Settings |
| Contact Info | Tenant settings + Marketplace profile | This page / Account |
| Business Hours | Marketing module | Marketing → Business Hours |
| Listed Breeds | Animal roster (breed associations) | Animals module |
| Standards & Credentials | Marketplace profile | This page |
| Placement Policies | Marketplace profile | This page |
| Payment & Delivery | Marketplace profile | This page |
| Raising Protocols | Marketplace profile | This page |
| Placement Package | Marketplace profile | This page |
| Trust Badges | Computed from platform data | (Cannot edit - earned) |

**Key insight:** Some data is entered directly on this page, some is pulled from elsewhere in the platform. The preview shows ALL of it, regardless of source.

---

### 1.3 Available Data Elements

All data that CAN appear on the Storefront, organized by section:

#### Identity & Branding

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Business Name | Tenant | Visible | No (required) |
| Logo | Marketplace Profile | Visible | Yes |
| Banner Image | Marketplace Profile | Visible | Yes |
| Bio / About | Marketplace Profile | Visible | Yes |
| Year Established | Marketplace Profile | Visible | Yes |
| Languages Spoken | Marketplace Profile | Visible | Yes |

#### Location

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| City, State | Tenant Address | Visible | Yes (via display mode) |
| ZIP Only | Tenant Address | Hidden | Yes (via display mode) |
| Full Address | Tenant Address | Hidden | Yes (via display mode) |
| Search Participation | Marketplace Profile | On | Yes |

**Note:** Street address is NEVER displayed publicly. Location Display Mode controls granularity.

#### Contact & Links

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Contact Email | Tenant (system-generated) | Visible | Yes |
| Contact Phone | Marketplace Profile | Visible | Yes |
| Website URL | Marketplace Profile | Visible | Yes |
| Instagram Handle | Marketplace Profile | Visible | Yes |
| Facebook Page | Marketplace Profile | Visible | Yes |
| Business Hours | Marketing Module | Visible | Yes |

#### Breeds

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Listed Breeds | Animal Roster | All visible | Yes (per breed) |

**Source:** Auto-populated from breeds associated with breeder's animals. Breeder can hide breeds not ready for marketplace.

#### Standards & Credentials

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Registrations | Marketplace Profile | Visible | Yes (section + per-item) |
| Health Practices | Marketplace Profile | Visible | Yes (section + per-item) |
| Breeding Practices | Marketplace Profile | Visible | Yes (section + per-item) |
| Care Practices | Marketplace Profile | Visible | Yes (section + per-item) |

**Input:** Multi-select from suggestions + custom entries + free-form notes per section.

#### Placement Policies

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Require Application | Marketplace Profile | Visible | Yes |
| Require Interview | Marketplace Profile | Visible | Yes |
| Require Contract | Marketplace Profile | Visible | Yes |
| Has Return Policy | Marketplace Profile | Visible | Yes |
| Offers Lifetime Support | Marketplace Profile | Visible | Yes |
| Policy Notes | Marketplace Profile | Visible | Yes |

#### Payment & Delivery

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Payment Methods | Marketplace Profile | Visible | Yes |
| Shipping Available | Marketplace Profile | Visible | Yes |
| Delivery Available | Marketplace Profile | Visible | Yes |
| Delivery Radius | Marketplace Profile | Visible | Yes |
| Pickup Only | Marketplace Profile | Visible | Yes |

#### Raising Protocols (Storefront Defaults)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Protocol Tags | Marketplace Profile | Visible | Yes (per tag) |
| Protocol Details | Marketplace Profile | Visible | Yes |

**Input:** Species-aware suggestions + custom entries. Examples by species:

| Species | Suggested Protocols |
|---------|---------------------|
| Dogs | ENS, ESI, Puppy Culture, Avidog, BAB, Rule of 7s, Volhard Testing, Crate Training, Leash Introduction, Sound Desensitization |
| Cats | Litter Training, Handling, Socialization, Indoor/Outdoor Transition |
| Horses | Halter Breaking, Leading, Hoof Handling, Trailer Loading, Imprint Training |
| Goats/Sheep | Bottle-raised, Dam-raised, Disbudding, Hoof Care, Halter Training, Show Conditioning |
| Camelids | Halter Training, Shearing Conditioning, Herd Socialization |
| Rabbits | Handling, Nail Trims, Grooming, Show Posing |
| Poultry | Brooder Protocols, Handling, Show Conditioning |

**Note:** Programs can override these defaults with program-specific protocols.

#### Placement Package (Storefront Defaults)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Included Items | Marketplace Profile | Visible | Yes (per item) |
| Health Guarantee | Marketplace Profile | Visible | Yes |
| Package Details | Marketplace Profile | Visible | Yes |

**Input:** Suggestions + custom entries. Common items: Starter Food, Health Records, Vaccination Records, Deworming Records, Registration Papers, Microchip, Contract, Health Guarantee Documentation, Comfort Item, Training Resources, Lifetime Breeder Support

**Note:** Programs can override these defaults with program-specific packages.

#### Trust Signals & Badges

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Verified Identity | Computed | Visible if earned | No |
| Health Testing | Computed | Visible if earned | No |
| 5+ Placements | Computed | Visible if earned | No |
| Quick Responder | Computed | Visible if earned | No |

**Note:** Badges are computed from platform data. Breeders cannot manually enable them, but the management UI shows which badges they've earned and what criteria they need to meet for locked badges.

---

### 1.4 Preview UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  My Storefront                              [Preview] [Edit] [Save] │
│  ─────────────────────────────────────────────────────────────────  │
│  Status: Published ✓   Last updated: Jan 10, 2025                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ☑ [Logo]  SUNNY ACRES DOODLES              ☑ Est. 2018            │
│            ☑ Portland, OR                   ☑ English, Spanish     │
│                                                                     │
│  ☑ "We are a small family breeder focused on health-tested,        │
│     well-socialized puppies raised in our home..."  [Edit →]       │
│                                                                     │
│  ─── Contact ─────────────────────────────────────────────────────  │
│  ☑ hello@sunnyacres.breederhq.com   ☑ (503) 555-1234              │
│  ☑ sunnyacresdoodles.com            ☑ @sunnyacresdoodles          │
│  ☐ Facebook (hidden)                ☑ Hours: Mon-Fri 9am-5pm      │
│                                                                     │
│  ─── Breeds ──────────────────────────────────────────────────────  │
│  ☑ Goldendoodle   ☑ Labradoodle   ☐ Bernedoodle (hidden)          │
│                                                                     │
│  ─── Standards & Credentials ─────────────────────────────────────  │
│  ☑ Registrations: AKC Breeder of Merit, GANA Blue Ribbon  [Edit →] │
│  ☑ Health Practices: OFA Hips/Elbows, PennHIP, Embark DNA [Edit →] │
│  ☐ Breeding Practices (hidden)                                      │
│  ☑ Care Practices: Home-raised, daily handling            [Edit →] │
│                                                                     │
│  ─── Placement Policies ──────────────────────────────────────────  │
│  ☑ Application Required   ☑ Interview   ☑ Contract                 │
│  ☑ Return Policy          ☑ Lifetime Support               [Edit →]│
│                                                                     │
│  ─── Payment & Delivery ──────────────────────────────────────────  │
│  ☑ Credit Card, Check, Payment Plans                               │
│  ☑ Shipping available   ☑ Delivery within 100mi   ☑ Pickup        │
│                                                                     │
│  ─── Raising Protocols ───────────────────────────────────────────  │
│  ☑ ENS  ☑ Puppy Culture  ☑ Crate Training  ☑ Sound Desensitization│
│  ☑ "All puppies are raised in our home with daily handling,        │
│     exposure to children and other pets..."              [Edit →]  │
│                                                                     │
│  ─── Placement Package ───────────────────────────────────────────  │
│  ☑ Health Records  ☑ Microchip  ☑ Starter Kit  ☑ Comfort Blanket  │
│  ☑ 2-Year Health Guarantee                               [Edit →]  │
│                                                                     │
│  ─── Trust Badges ────────────────────────────────────────────────  │
│  ✓ Verified Identity   ✓ Health Testing   ✓ 5+ Placements          │
│  🔒 Quick Responder (respond to 3 more inquiries within 24hrs)     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- ☑ = Visible on public profile (click to hide)
- ☐ = Hidden from public profile (click to show)
- [Edit →] = Opens detailed editor for that section
- Checkboxes work inline without page reload

---

### 1.5 Actions

| Action | Result |
|--------|--------|
| Save | Save visibility changes and any edits |
| Publish | Make profile live on marketplace (if not already) |
| Unpublish | Remove from marketplace (keeps all data) |
| Preview (External) | Open public profile in new tab as buyer sees it |

---

### 1.6 State Display

Show current profile state clearly:
- **Not Published:** Profile configured but not visible on marketplace
- **Published:** Live on marketplace (show published date)
- **Has Unpublished Changes:** Edits made since last publish

---

### 1.7 Backend APIs

```
GET    /api/v1/marketplace/profile          # Returns aggregated data from all sources
PUT    /api/v1/marketplace/profile/draft    # Save edits + visibility settings
POST   /api/v1/marketplace/profile/publish
POST   /api/v1/marketplace/profile/unpublish
```

**Response shape:**
```typescript
{
  // Data from various sources, aggregated
  data: {
    businessName: string,           // from Tenant
    logo: MediaAsset | null,        // from MarketplaceProfile
    bio: string | null,             // from MarketplaceProfile
    location: Address,              // from Tenant
    breeds: Breed[],                // from Animal roster
    credentials: Credentials,       // from MarketplaceProfile
    // ... etc
  },

  // Visibility settings (what's toggled on/off)
  visibility: {
    logo: boolean,
    bio: boolean,
    yearEstablished: boolean,
    // ... per-field visibility
    breeds: { [breedId]: boolean }, // per-breed visibility
    credentials: {
      registrations: boolean,
      healthPractices: boolean,
      // ... per-section
    },
  },

  // Trust badges (computed, cannot be toggled)
  badges: {
    verifiedIdentity: { earned: boolean, criteria: string },
    healthTesting: { earned: boolean, criteria: string },
    // ...
  },

  // Publishing state
  state: 'draft' | 'published' | 'unpublished_changes',
  publishedAt: string | null,
}

---

## Section 2: Breeding Programs

**Route:** `/marketplace-manage/programs`

**Purpose:** Create and manage breeding programs that group related litters and provide program-level marketing.

**Status:** 🔄 UNDER REVIEW

---

### 2.1 UX Model: Preview-First, Toggle-to-Hide

Same pattern as Storefront: Show the Program page as a buyer would see it, with all available data aggregated. Breeder toggles OFF what they don't want shown on THIS program's listing.

**Data sources for a Program page:**
- Program-specific data (name, description, media, pricing) - entered here
- Featured Parents (from Animal records marked public) - selected here, data from Animals
- Raising Protocols (from Program override OR Storefront defaults)
- Placement Package (from Program override OR Storefront defaults)
- Breeder Snapshot (from Storefront - trust badges, location, policies)
- Linked Litters (from Breeding Plans linked to this program)

---

### 2.2 Programs List View

| Column | Notes |
|--------|-------|
| Cover Image | Program cover photo thumbnail |
| Name | Program name |
| Species / Breed | e.g., "Dog - Goldendoodle" |
| Status | Draft / Listed |
| Linked Plans | Count of breeding plans |
| Upcoming | Count of expected litters |
| Actions | Edit, Toggle Listed, Delete |

**Actions:**
- Create New Program
- Filter by species
- Filter by status

---

### 2.3 Data Sources & Aggregation

| Section | Data Source | Edit Location |
|---------|-------------|---------------|
| Program Name | BreedingProgram | This page |
| Species / Breed | BreedingProgram | This page |
| Description | BreedingProgram | This page |
| Program Story | BreedingProgram | This page |
| Media (images, videos) | BreedingProgramMedia | This page |
| Featured Parents | Animal records (public data) | Animals module (visibility), This page (selection) |
| Raising Protocols | Program override OR Storefront defaults | This page (override) or Storefront |
| Placement Package | Program override OR Storefront defaults | This page (override) or Storefront |
| Pricing Tiers | BreedingProgram | This page |
| Wait Time | BreedingProgram | This page |
| Linked Litters | BreedingPlan → OffspringGroup | Breeding module (read-only here) |
| Breeder Snapshot | Storefront (trust badges, location, policies) | Storefront |

---

### 2.4 Available Data Elements

All data that CAN appear on a Program page:

#### Program Identity

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Program Name | BreedingProgram | Visible | No (required) |
| Species | BreedingProgram | Visible | No |
| Breed | BreedingProgram | Visible | Yes |
| Description | BreedingProgram | Visible | Yes |
| Program Story | BreedingProgram | Visible | Yes |

#### Media

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Cover Image | BreedingProgramMedia | Visible | Yes |
| Gallery Images | BreedingProgramMedia | Visible | Yes (per image) |
| Video Links | BreedingProgram | Visible | Yes (per video) |

#### Featured Parents

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Parent Selection | Animals linked via plans | N/A | Select which to feature |
| Display Order | Program setting | N/A | Drag to reorder |

**Per-Parent (auto-pulled from Animal if marked public on the Animal):**

| Element | Source | Visibility Control |
|---------|--------|-------------------|
| Photos | Animal media | Controlled at Animal level |
| Name & Registered Name | Animal profile | Always shown if parent featured |
| Titles & Achievements | AnimalTitle | Controlled at Animal level |
| Health Testing Results | Health tests | Controlled at Animal level |
| Genetic Results | AnimalGeneticResult | `marketplaceVisible` flag on Animal |
| Pedigree (parents, grandparents) | PedigreeNode | Controlled at Animal level |
| COI % | Calculated | Controlled at Animal level |
| Documents | Animal documents | Controlled at Animal level |

**Key insight:** The Program page just features parents. What data shows for each parent is controlled on the Animal record itself - if the breeder marked a health test as public on Luna's record, it shows when Luna is featured. If not, it doesn't.

#### Raising Protocols

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Use Storefront Defaults | Toggle | ON | Yes |
| Protocol Tags | Program OR Storefront | Visible | Yes (per tag) |
| Protocol Details | Program OR Storefront | Visible | Yes |

**Behavior:**
- Default: "Use Storefront Defaults" = ON, shows Storefront protocols
- If breeder turns OFF defaults, they enter program-specific protocols
- Species-aware suggestions + custom entries

#### Placement Package

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Use Storefront Defaults | Toggle | ON | Yes |
| Included Items | Program OR Storefront | Visible | Yes (per item) |
| Health Guarantee | Program OR Storefront | Visible | Yes |
| Package Details | Program OR Storefront | Visible | Yes |

**Behavior:** Same as Raising Protocols - inherit or override.

#### Pricing

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Pricing Tiers | BreedingProgram | Visible | Yes (per tier) |
| What's Included | BreedingProgram | Visible | Yes |
| Typical Wait Time | BreedingProgram | Visible | Yes |

#### Program Settings (Functionality, not display)

| Element | Source | Default | Notes |
|---------|--------|---------|-------|
| Accept Inquiries | BreedingProgram | On | Enables inquiry button |
| Open Waitlist | BreedingProgram | Off | Enables waitlist join |
| Accept Reservations | BreedingProgram | Off | Enables reservation flow |
| Coming Soon | BreedingProgram | Off | "Coming Soon" badge |
| Listed on Marketplace | BreedingProgram | Off | Whether program appears in search |

#### Linked Content (Read-only, auto-populated)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Upcoming Litters | Plans in COMMITTED → PREGNANT | Visible | Yes (section) |
| Available Litters | Plans in BIRTHED → PLACEMENT | Visible | Yes (section) |
| Past Litters | Completed plans | Visible | Yes (section) |

#### Breeder Snapshot (Auto-surfaced from Storefront)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Trust Badges | Computed | Visible | No (always shown) |
| Location | Storefront | Visible | Yes |
| Key Policies | Storefront | Visible | Yes |
| "View Full Profile" | Link | Visible | No (always shown) |

---

### 2.5 Preview UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  Goldendoodle Program                       [Preview] [Edit] [Save] │
│  ─────────────────────────────────────────────────────────────────  │
│  Status: Listed ✓   Last updated: Jan 10, 2025                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ☑ [Cover Image: Luna and Duke with puppies]                       │
│                                                                     │
│  ☑ GOLDENDOODLE PROGRAM                                            │
│    Dog • Goldendoodle                                              │
│                                                                     │
│  ☑ "Our Goldendoodle program focuses on producing healthy,         │
│     low-shedding family companions with excellent temperaments."   │
│                                                      [Edit →]      │
│                                                                     │
│  ☑ PROGRAM STORY                                                   │
│  ☑ "We started breeding Goldendoodles in 2015 after falling in    │
│     love with our first Doodle, Charlie..."          [Edit →]      │
│                                                                     │
│  ─── Media ───────────────────────────────────────────────────────  │
│  ☑ [img1] ☑ [img2] ☑ [img3] ☐ [img4 hidden]        [Manage →]     │
│  ☑ Video: "Meet Our Goldendoodles"                                 │
│                                                                     │
│  ─── Featured Parents ────────────────────────────────────────────  │
│  ☑ LUNA (Dam)                              [Edit Luna's Profile →] │
│    ☑ Photo  ☑ CH Luna's Golden Star        (controlled on Animal)  │
│    ☑ OFA Hips: Good  ☑ OFA Elbows: Normal  (controlled on Animal)  │
│    ☑ Embark: Clear for 200+ conditions     (controlled on Animal)  │
│    ☑ Pedigree: 3 generations               (controlled on Animal)  │
│                                                                     │
│  ☑ DUKE (Sire)                             [Edit Duke's Profile →] │
│    ☑ Photo  ☑ GCH Duke of Portland                                 │
│    ☑ OFA Hips: Excellent  ☑ PennHIP: 0.28                         │
│    ☑ Embark: Clear                                                 │
│                                                                     │
│  ─── Raising Protocols ───────────────────────────────────────────  │
│  ☑ Using Storefront defaults                   [Override →]        │
│  ☑ ENS  ☑ Puppy Culture  ☑ Crate Training  ☑ Sound Desensitization│
│                                                                     │
│  ─── Placement Package ───────────────────────────────────────────  │
│  ☑ Using Storefront defaults                   [Override →]        │
│  ☑ Health Records  ☑ Microchip  ☑ 2-Year Guarantee                │
│                                                                     │
│  ─── Pricing ─────────────────────────────────────────────────────  │
│  ☑ Pet: $2,500 - $3,000                                            │
│  ☑ Breeding Rights: $4,000 - $5,000                                │
│  ☑ Typical Wait: 3-6 months                            [Edit →]    │
│                                                                     │
│  ─── Upcoming Litters ────────────────────────────────────────────  │
│  ☑ Luna × Duke - Expected March 2025                               │
│  ☑ Daisy × Duke - Expected May 2025                                │
│                                                                     │
│  ─── Available Now ───────────────────────────────────────────────  │
│  ☑ Luna × Duke Fall 2024 - 2 puppies available                     │
│                                                                     │
│  ─── Breeder Info (from Storefront) ──────────────────────────────  │
│  ✓ Verified  ✓ Health Testing  ✓ 5+ Placements                     │
│  Portland, OR • Application Required • Contract                     │
│  [View Full Breeder Profile →]                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- ☑ = Visible on public listing (click to hide)
- ☐ = Hidden from public listing (click to show)
- [Edit →] = Opens editor for that section (or links to Animal profile for parent data)
- [Override →] = Switch from Storefront defaults to program-specific values
- Parent visibility is controlled at the Animal level, not here

---

### 2.6 Actions

| Action | Result |
|--------|--------|
| Save | Save visibility changes and any edits |
| List | Make program visible on marketplace (if not already) |
| Unlist | Remove from marketplace (keeps all data) |
| Preview (External) | Open program page in new tab as buyer sees it |
| Delete | Delete program (with confirmation) |

---

### 2.7 Backend APIs

```
GET    /api/v1/breeding/programs                    # List all programs
GET    /api/v1/breeding/programs/:id                # Get program with aggregated data
POST   /api/v1/breeding/programs                    # Create program
PUT    /api/v1/breeding/programs/:id                # Update program + visibility
DELETE /api/v1/breeding/programs/:id                # Delete program

GET    /api/v1/breeding/programs/:id/media          # Get program media
POST   /api/v1/breeding/programs/:id/media          # Upload media
PUT    /api/v1/breeding/programs/:programId/media/:mediaId
DELETE /api/v1/breeding/programs/:programId/media/:mediaId
POST   /api/v1/breeding/programs/:id/media/reorder
```

---

## Section 3: Animal Listings

**Route:** `/marketplace-manage/animals`

**Purpose:** Create marketplace listings for individual animals (stud service, rehoming, guardian placement, etc.)

**Status:** 🔄 UNDER REVIEW

---

### 3.1 UX Model: Preview-First, Toggle-to-Hide

Same pattern as Storefront and Programs: Show the Animal Listing page as a buyer would see it, with all available data aggregated from the Animal record. Breeder toggles OFF what they don't want shown.

**Key difference from Programs:** Animal Listings are for individual animals being offered (stud, rehome, guardian, etc.), NOT for offspring from breeding programs.

**Data sources for an Animal Listing:**
- Animal record (name, photos, breed, sex, age, etc.) - from Animals module
- Public Card Content (headline, summary, description) - from Animal record (reusable marketing copy)
- Health testing results - from Animal record (if marked public)
- Genetic results - from Animal record (if `marketplaceVisible`)
- Titles & achievements - from Animal record (if marked public)
- Pedigree - from Animal record (if marked public)
- Listing-specific data (intent, pricing, location override) - entered here
- Breeder Snapshot - from Storefront

---

### 3.2 Data Location: Animal vs Listing

**Critical distinction:** Some data lives on the Animal record (reusable across any listing type), while other data is listing-specific.

#### Stored on Animal Record (Animals Module → Marketplace Tab)

The "Public Card Content" section stays in the Animals module because it's **reusable marketing copy** that applies regardless of listing intent:

| Field | Purpose | Visibility Toggle |
|-------|---------|-------------------|
| Headline | Short tagline for cards (e.g., "Champion Stud Available") | Yes |
| Title Override | Display name if different from animal name | Yes |
| Primary Photo Override | Featured photo for listings (uses animal photo if blank) | Yes |
| Summary | Short description for listing cards | Yes |
| Description | Full description for listing detail page | Yes |

**Why animal-level?** If Duke is listed as STUD today but later as REHOME, his marketing copy (headline about being a champion, summary of his qualities) is largely the same. Single source of truth, less duplicate work.

**Edit location:** Animals module → Animal detail → Marketplace tab

#### Stored on Listing Record (Marketplace Management)

Listing-specific data that changes based on how the animal is being offered:

| Field | Purpose | Why listing-level |
|-------|---------|-------------------|
| Intent | STUD, REHOME, GUARDIAN, etc. | Different each time |
| Price Model | Fixed, Range, Negotiable, Inquire | Stud fee ≠ rehome fee |
| Price / Range | Dollar amounts | Different per intent |
| Price Notes | Terms, conditions | Intent-specific |
| Location Override | If different from Storefront | May vary by listing |
| URL Slug | SEO-friendly URL | Unique per listing |
| Intent-specific fields | Breeding method, guardian terms, etc. | Unique to intent |

**Edit location:** Marketplace Management → Animal Listings → Edit listing

---

### 3.3 What Moves Where (Migration from Current UI)

The current Animal Marketplace tab has mixed concerns. Here's what stays vs moves:

| Current UI Element | Stays in Animals Module | Moves to Marketplace Management |
|-------------------|------------------------|--------------------------------|
| Public Card Content (Headline, Summary, Description) | ✅ Yes (with visibility toggles) | |
| Listing Intent selector | | ✅ Yes |
| Location and Service Area controls | | ✅ Yes |
| Pricing section | | ✅ Yes |
| Publish/Unpublish controls | | ✅ Yes |

**Result:**
- **Animals Module Marketplace Tab:** Simplified to just Public Card Content with per-field visibility toggles
- **Marketplace Management:** Full listing creation/management with Intent, Location, Pricing using existing UI components

---

### 3.4 Listings List View

| Column | Notes |
|--------|-------|
| Photo | Animal photo thumbnail (or Primary Photo Override) |
| Animal | Name (or Title Override) |
| Headline | From Animal's Public Card Content |
| Intent | Stud, Rehome, Guardian, etc. |
| Species / Breed | e.g., "Dog - German Shepherd" |
| Price | Formatted price or "Contact" |
| Status | Draft / Live / Paused |
| Created | Date |
| Actions | Edit, Toggle Status, Delete |

**Actions:**
- Create New Listing
- Filter by intent
- Filter by status
- Filter by species

---

### 3.5 Create Listing Flow

**Step 1: Select Animal**
- Search/browse from roster
- Show: Name, Photo, Species, Breed, Sex, Age
- Filter: Species, Sex, Status
- Only show animals not already listed (or allow updating existing listing)

**Step 2: Choose Intent**

| Intent | Description | Typical Use |
|--------|-------------|-------------|
| STUD | Available for stud service | Male offered for breeding |
| BROOD_PLACEMENT | Breeding female placement | Female offered for breeding program |
| REHOME | General rehoming | Pet placement, retired breeder |
| GUARDIAN | Guardian home program | Live with family, return for breeding |
| TRAINED | Fully trained animal | Finished dog, obedience trained |
| WORKING | Working animal | Herding, protection, service-ready |
| STARTED | Partially trained | Started but not finished |
| CO_OWNERSHIP | Co-ownership opportunity | Shared ownership arrangement |

**Step 3: Preview & Configure**
→ Goes to preview-first editor (see 3.7)

---

### 3.6 Data Sources & Aggregation

| Section | Data Source | Edit Location |
|---------|-------------|---------------|
| Animal Name | Animal record | Animals module |
| Photos | Animal media (public) | Animals module |
| Species / Breed | Animal record | Animals module |
| Sex / Age | Animal record | Animals module |
| **Public Card Content** | | |
| → Headline | Animal record | Animals module → Marketplace tab |
| → Title Override | Animal record | Animals module → Marketplace tab |
| → Primary Photo Override | Animal record | Animals module → Marketplace tab |
| → Summary | Animal record | Animals module → Marketplace tab |
| → Description | Animal record | Animals module → Marketplace tab |
| Health Testing | Animal health tests (public) | Animals module |
| Genetic Results | AnimalGeneticResult (marketplaceVisible) | Animals module |
| Titles & Achievements | AnimalTitle (public) | Animals module |
| Pedigree | PedigreeNode (public) | Animals module |
| Registry IDs | AnimalRegistryIdentifier | Animals module |
| **Listing-Specific** | | |
| → Intent | AnimalPublicListing | This page |
| → Pricing | AnimalPublicListing | This page |
| → Location Override | AnimalPublicListing | This page |
| → URL Slug | AnimalPublicListing | This page |
| Breeder Snapshot | Storefront | Storefront |

**Key insight:** Most data comes from the Animal record, including Public Card Content (reusable marketing copy). The listing just adds intent, pricing, and location. Visibility of animal data is controlled on the Animal itself.

---

### 3.7 Available Data Elements

All data that CAN appear on an Animal Listing:

#### Animal Identity (from Animal record)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Name | Animal | Visible | No (required) |
| Registered Name | Animal | Visible | Yes |
| Photos | Animal media (public) | Visible | Yes (per photo) |
| Species | Animal | Visible | No |
| Breed | Animal | Visible | Yes |
| Sex | Animal | Visible | No |
| Age / Birth Date | Animal | Visible | Yes |
| Color / Markings | Animal | Visible | Yes |

#### Health & Genetics (from Animal record, visibility controlled there)

| Element | Source | Visibility Control |
|---------|--------|-------------------|
| Health Testing Results | Animal health tests | Controlled at Animal level |
| Genetic Results | AnimalGeneticResult | `marketplaceVisible` flag on Animal |
| Vaccination Status | Animal vaccinations | Controlled at Animal level |

#### Titles & Pedigree (from Animal record, visibility controlled there)

| Element | Source | Visibility Control |
|---------|--------|-------------------|
| Titles & Achievements | AnimalTitle | Controlled at Animal level |
| Pedigree (parents, grandparents) | PedigreeNode | Controlled at Animal level |
| COI % | Calculated | Controlled at Animal level |
| Registry IDs | AnimalRegistryIdentifier | Controlled at Animal level |

#### Documents & Media (from Animal record, visibility controlled there)

| Element | Source | Visibility Control |
|---------|--------|-------------------|
| Public Documents | Animal documents | Controlled at Animal level |
| Videos | Animal media | Controlled at Animal level |

#### Public Card Content (from Animal record, visibility controlled there)

| Element | Source | Visibility Control |
|---------|--------|-------------------|
| Headline | Animal → Marketplace tab | Controlled at Animal level |
| Title Override | Animal → Marketplace tab | Controlled at Animal level |
| Primary Photo Override | Animal → Marketplace tab | Controlled at Animal level |
| Summary | Animal → Marketplace tab | Controlled at Animal level |
| Description | Animal → Marketplace tab | Controlled at Animal level |

**Note:** This content is entered once on the Animal and reused across any listing type. The breeder sets visibility toggles on the Animal, and those settings flow through to all listings for that animal.

#### Listing-Specific (entered on this page)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Intent | AnimalPublicListing | Visible | No (required) |
| URL Slug | AnimalPublicListing | N/A | N/A (for URLs) |

#### Pricing (entered on this page)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Price Model | AnimalPublicListing | Visible | Yes |
| Price / Range | AnimalPublicListing | Visible | Yes |
| Price Notes | AnimalPublicListing | Visible | Yes |

**Price Models:**
- **Fixed** - Single price (e.g., "$500 stud fee")
- **Range** - Min to max (e.g., "$2,000 - $2,500")
- **Negotiable** - Price shown but negotiable
- **Inquire** - "Contact for pricing"

#### Location (override or inherit)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Use Storefront Location | Toggle | ON (default) | Yes |
| City | Override | Visible | Yes |
| State/Region | Override | Visible | Yes |
| Country | Override | Visible | Yes |

#### Breeder Snapshot (auto-surfaced from Storefront)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Trust Badges | Computed | Visible | No (always shown) |
| Breeder Name | Storefront | Visible | No |
| Location | Storefront (or override) | Visible | Yes |
| "View Breeder Profile" | Link | Visible | No (always shown) |

---

### 3.8 Preview UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  Duke - Stud Listing                        [Preview] [Edit] [Save] │
│  ─────────────────────────────────────────────────────────────────  │
│  Status: Live ✓   Last updated: Jan 10, 2025                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ☑ [Photo: Duke standing]  [Photo: Duke head shot]                 │
│                                                                     │
│  ☑ DUKE                                                            │
│  ☑ "GCH Sunny Acres Duke of Portland"      [Edit Animal Profile →] │
│    Golden Retriever • Male • 4 years old                           │
│                                                                     │
│  Intent: STUD SERVICE                                   [Change →] │
│                                                                     │
│  ─── Public Card Content (from Animal) ─────────────────────────── │
│  (Visibility controlled on Duke's Animal Profile)                   │
│  ☑ HEADLINE: "Champion Golden Retriever at stud - OFA Excellent,  │
│     Embark Clear, proven producer"   [Edit Duke's Marketplace Tab →]│
│  ☑ SUMMARY: "Foundation sire with exceptional temperament..."      │
│  ☑ DESCRIPTION: "Duke is our foundation sire with an exceptional  │
│     temperament and structure. He has produced 3 litters..."       │
│                                                                     │
│  ─── Health & Genetics ─────────────────────────────────────────── │
│  (Visibility controlled on Duke's Animal Profile)                   │
│  ☑ OFA Hips: Excellent           [Edit Duke's Health Records →]   │
│  ☑ OFA Elbows: Normal                                              │
│  ☑ OFA Cardiac: Normal                                             │
│  ☑ OFA Eyes: Clear (annual)                                        │
│  ☑ Embark: Clear for 200+ conditions                               │
│  ☑ PRA1/PRA2: Clear                                                │
│                                                                     │
│  ─── Titles ────────────────────────────────────────────────────── │
│  (Visibility controlled on Duke's Animal Profile)                   │
│  ☑ GCH (Grand Champion)                    [Edit Duke's Titles →] │
│  ☑ CGC (Canine Good Citizen)                                       │
│  ☑ TKN (Trick Dog Novice)                                          │
│                                                                     │
│  ─── Pedigree ──────────────────────────────────────────────────── │
│  (Visibility controlled on Duke's Animal Profile)                   │
│  ☑ 3-generation pedigree                   [Edit Duke's Lineage →]│
│  ☑ COI: 3.2%                                                       │
│                                                                     │
│  ─── Pricing (Listing-Specific) ────────────────────────────────── │
│  ☑ Price Model: Fixed Price                          [Edit →]     │
│  ☑ Stud Fee: $1,500                                                │
│  ☑ Notes: "Live cover or fresh chilled. Return breeding guaranteed."│
│                                                                     │
│  ─── Location (Listing-Specific) ───────────────────────────────── │
│  ○ Use Breeder Defaults (Portland, OR)               [Override →] │
│                                                                     │
│  ─── Breeder Info (from Storefront) ─────────────────────────────  │
│  ✓ Verified  ✓ Health Testing  ✓ 5+ Placements                     │
│  Sunny Acres Goldens • Portland, OR                                │
│  [View Breeder Profile →]  [Contact Breeder →]                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- ☑ = Visible on public listing (controlled at source - Animal or Listing)
- ☐ = Hidden from public listing
- [Edit →] = Opens editor for listing-specific fields (on this page)
- [Edit Duke's X →] = Links to Animal profile to edit source data
- [Change →] = Change listing intent (will clear pricing but keep Public Card Content)
- Public Card Content, Health, Titles, Pedigree visibility → controlled on the Animal record
- Pricing, Location → controlled on this listing

---

### 3.9 Intent-Specific Fields

Some intents may have additional fields:

| Intent | Additional Fields |
|--------|-------------------|
| STUD | Breeding method (live cover, fresh chilled, frozen), Return guarantee |
| GUARDIAN | Guardian program terms, Return requirements, Visit frequency |
| CO_OWNERSHIP | Ownership split, Breeding rights, Contract terms |
| TRAINED | Training level, Skills included, Certification |
| WORKING | Working certifications, Proven abilities |

These could be structured fields OR free-form in the description. TBD based on usage patterns.

---

### 3.10 Actions

| Action | Result |
|--------|--------|
| Save Draft | Save as DRAFT (not visible on marketplace) |
| Publish | Set to LIVE (visible on marketplace) |
| Pause | Set to PAUSED (temporarily hidden) |
| Delete | Remove listing entirely |
| Preview (External) | Open listing page in new tab as buyer sees it |

---

### 3.11 Backend APIs

```
# Listing management (breeder side)
GET    /api/v1/animal-listings                    # List all listings for tenant (NEW)
GET    /api/v1/animals/:id/public-listing         # Get listing for specific animal
PUT    /api/v1/animals/:id/public-listing         # Create or update listing (upsert)
PATCH  /api/v1/animals/:id/public-listing/status  # Change status (DRAFT/LIVE/PAUSED)
DELETE /api/v1/animals/:id/public-listing         # Delete listing

# Public browse (buyer side) - already exists
GET    /programs/:slug/animals                    # Animals listed under a program
GET    /programs/:slug/animals/:urlSlug           # Individual animal listing
```

**Note:** The `GET /api/v1/animal-listings` endpoint is new - needed to show all listings for a breeder across all their animals.

---

## Section 4: Offspring Group Listings

**Route:** `/marketplace-manage/offspring-groups`

**Purpose:** Manage offspring group marketplace listings and individual offspring visibility/pricing.

**Status:** 🔄 UNDER REVIEW

---

### 4.1 UX Model: Preview-First, Toggle-to-Hide

Same pattern as other sections: Show the Offspring Group listing page as a buyer would see it, with all available data aggregated. Breeder toggles OFF what they don't want shown.

**Key difference from Animal Listings:** Offspring Groups are created automatically when a BreedingPlan is committed. The breeder manages **what's visible** and **pricing**, not whether the group exists.

**Data sources for an Offspring Group Listing:**
- OffspringGroup record (title, description, dates, cover image) - from Breeding module
- Dam & Sire data (photos, health, genetics, pedigree) - from Animal records (if marked public)
- Individual Offspring (name, sex, color, availability) - from Offspring records
- Raising Protocols (from linked Program OR Storefront defaults)
- Placement Package (from linked Program OR Storefront defaults)
- Pricing (group default + per-offspring overrides) - entered here
- Breeder Snapshot - from Storefront

---

### 4.2 Data Location: What Comes From Where

| Data | Source | Edit Location |
|------|--------|---------------|
| Group Title | OffspringGroup | Breeding module (or this page) |
| Group Description | OffspringGroup | Breeding module (or this page) |
| Cover Image | OffspringGroup | This page |
| URL Slug | OffspringGroup | This page |
| Expected Birth | BreedingPlan | Breeding module (read-only here) |
| Actual Birth | OffspringGroup | Breeding module (read-only here) |
| Dam | BreedingPlan → Animal | Animals module (visibility) |
| Sire | BreedingPlan → Animal | Animals module (visibility) |
| Offspring list | Offspring records | Breeding/Offspring module |
| Default Price | OffspringGroup | This page |
| Per-offspring Price | Offspring | This page |
| Per-offspring Listed | Offspring | This page |
| Raising Protocols | Program OR Storefront | Program or Storefront |
| Placement Package | Program OR Storefront | Program or Storefront |
| Breeder Snapshot | Storefront | Storefront |

---

### 4.3 Offspring Groups List View

| Column | Notes |
|--------|-------|
| Cover | Group cover image thumbnail |
| Title | Group name or listing title |
| Parents | Dam × Sire |
| Program | Linked breeding program |
| Stage | Expected / Born / Weaning / Placement / Complete |
| Birth Date | Expected or actual |
| Available | X of Y available for placement |
| Listed | Yes/No |
| Actions | Edit, Toggle Listed |

**Filters:**
- Stage (expecting, born, weaning, placement, complete)
- Listed (yes/no)
- Program

**Actions:**
- Create New Offspring Group (for unlinked groups - see note below)
- Edit selected group
- Toggle Listed status

**Note on Create:** Offspring Groups are typically created automatically when a BreedingPlan is committed. However, the "Create Offspring Group" action is available for special cases like managing offspring inherited from outside your breeding program. These "unlinked" groups are not tied to a BreedingPlan.

---

### 4.4 Available Data Elements

All data that CAN appear on an Offspring Group listing:

#### Group Identity

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Title | OffspringGroup | Visible | No (required) |
| Description | OffspringGroup | Visible | Yes |
| Cover Image | OffspringGroup | Visible | Yes |
| URL Slug | OffspringGroup | N/A | N/A (for URLs) |

#### Parents (from Animal records, visibility controlled there)

| Element | Source | Visibility Control |
|---------|--------|-------------------|
| Dam Name & Photo | Animal | Controlled at Animal level |
| Dam Health Testing | Animal health tests | Controlled at Animal level |
| Dam Genetics | AnimalGeneticResult | Controlled at Animal level |
| Dam Titles | AnimalTitle | Controlled at Animal level |
| Dam Pedigree | PedigreeNode | Controlled at Animal level |
| Sire Name & Photo | Animal | Controlled at Animal level |
| Sire Health Testing | Animal health tests | Controlled at Animal level |
| Sire Genetics | AnimalGeneticResult | Controlled at Animal level |
| Sire Titles | AnimalTitle | Controlled at Animal level |
| Sire Pedigree | PedigreeNode | Controlled at Animal level |

**Key insight:** Parent data visibility is controlled on the Animal records, not here. If Luna's health testing is marked public, it shows. If not, it doesn't.

#### Timeline (read-only, from Breeding module)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Expected Birth | BreedingPlan | Visible | Yes |
| Actual Birth | OffspringGroup | Visible | Yes |
| Expected Weaning | Computed | Visible | Yes |
| Expected Placement | BreedingPlan | Visible | Yes |

#### Individual Offspring

| Element | Source | Visibility Control |
|---------|--------|-------------------|
| Name | Offspring | Always shown if listed |
| Sex | Offspring | Always shown if listed |
| Collar/Identifier | Offspring | Toggleable |
| Color/Markings | Offspring | Toggleable |
| Photos | Offspring media | Controlled per offspring |
| Placement State | Offspring | Always shown (Available/Reserved/Placed) |

**Per-offspring marketplace controls (editable here):**

| Field | Source | Notes |
|-------|--------|-------|
| Listed on Marketplace | Offspring.marketplaceListed | Toggle per offspring - allows breeder to hide individual offspring from the listing (e.g., keeping one for their own program) |
| Price Override | Offspring.marketplacePriceCents | Blank = use group default |

#### Pricing (entered here)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Default Price | OffspringGroup | Visible | Yes |
| Per-offspring Price | Offspring | Visible | Yes |
| Pricing Notes | OffspringGroup | Visible | Yes |

#### Raising Protocols (defaults from Program or Storefront, can override)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Source | Program → Storefront → Group Override | N/A | N/A |
| Protocol Tags | Inherited OR Override | Visible | Yes (per tag) |
| Protocol Details | Inherited OR Override | Visible | Yes |

**Note:** Inheritance chain: Storefront defaults → Program override → Offspring Group override. Breeder can override at each level for special cases (e.g., a group raised with different protocols than the standard program).

#### Placement Package (defaults from Program or Storefront, can override)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Source | Program → Storefront → Group Override | N/A | N/A |
| Included Items | Inherited OR Override | Visible | Yes (per item) |
| Health Guarantee | Inherited OR Override | Visible | Yes |
| Package Details | Inherited OR Override | Visible | Yes |

**Note:** Same inheritance chain as Protocols: Storefront defaults → Program override → Offspring Group override.

#### Breeder Snapshot (auto-surfaced from Storefront)

| Element | Source | Default Visibility | Toggleable |
|---------|--------|-------------------|------------|
| Trust Badges | Computed | Visible | No (always shown) |
| Location | Storefront | Visible | Yes |
| Key Policies | Storefront | Visible | Yes |
| "View Breeder Profile" | Link | Visible | No (always shown) |

---

### 4.5 Offspring Group Editor

#### Listing Details Section

| Field | Type | Notes |
|-------|------|-------|
| Title | text | Public title (defaults from OffspringGroup) |
| Description | rich text | Public description |
| URL Slug | text | For SEO-friendly URLs |
| Cover Image | image | Hero image for listing |
| Default Price | currency | Base price for offspring |
| Pricing Notes | text | Terms, conditions, what's included |
| Listed on Marketplace | toggle | Master toggle for whole group |

#### Parents Display (Read-only preview, edit via Animal links)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ─── Parents ───────────────────────────────────────────────────── │
│  (Visibility controlled on Animal Profiles)                         │
│                                                                     │
│  DAM: Luna                                [Edit Luna's Profile →]   │
│  ☑ Photo                                                           │
│  ☑ OFA Hips: Good  ☑ OFA Elbows: Normal  (from Animal)            │
│  ☑ Embark: Clear                          (from Animal)            │
│  ☑ Pedigree: 3 generations                (from Animal)            │
│                                                                     │
│  SIRE: Duke                               [Edit Duke's Profile →]   │
│  ☑ Photo                                                           │
│  ☑ OFA Hips: Excellent  ☑ PennHIP: 0.28  (from Animal)            │
│  ☑ Embark: Clear                          (from Animal)            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Offspring Management Section

Table of all offspring in group:

| Column | Editable Here | Notes |
|--------|---------------|-------|
| Photo | No | From Offspring record |
| Name | No | From Offspring record |
| Sex | No | Male/Female icon |
| Collar/ID | No | Color swatch or identifier |
| Color | No | From Offspring record |
| Placement State | No | UNASSIGNED/OPTION_HOLD/RESERVED/PLACED |
| Keeper Intent | No | Shows if WITHHELD/KEEP (grayed out) |
| **Listed** | **Yes** | Toggle per offspring |
| **Price** | **Yes** | Override (blank = use default) |

**Row states:**
- **Available & Listed** - Normal row, editable
- **Available & Unlisted** - Grayed listing toggle
- **Reserved/Placed** - Read-only, shows status badge
- **Withheld/Keep** - Grayed out, shows keeper badge, cannot list

**Bulk Actions:**
- List all available (excludes Withheld/Keep/Reserved/Placed)
- Unlist all
- Set price for selected

#### Timeline Section (Read-only)

| Date | Source | Notes |
|------|--------|-------|
| Expected Birth | BreedingPlan | Shows if not yet born |
| Actual Birth | OffspringGroup | Shows when recorded |
| Expected Weaning | Computed | Based on species defaults |
| Expected Placement | BreedingPlan | Target placement date |

---

### 4.6 Preview UI Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  Luna × Duke Fall 2024                      [Preview] [Edit] [Save] │
│  ─────────────────────────────────────────────────────────────────  │
│  Status: Listed ✓   Stage: Placement                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ☑ [Cover Image: Puppies at 6 weeks]                               │
│                                                                     │
│  ☑ LUNA × DUKE FALL 2024                                           │
│    Goldendoodle Program                                            │
│                                                                     │
│  ☑ "Our Fall 2024 Goldendoodles are here! 5 beautiful puppies     │
│     ready for their forever homes in January."         [Edit →]    │
│                                                                     │
│  ─── Parents (from Animal Profiles) ────────────────────────────── │
│  (Visibility controlled on Animal Profiles)                         │
│                                                                     │
│  ☑ LUNA (Dam)                              [Edit Luna's Profile →] │
│    ☑ Photo  ☑ OFA Good  ☑ Embark Clear  ☑ Pedigree                │
│                                                                     │
│  ☑ DUKE (Sire)                             [Edit Duke's Profile →] │
│    ☑ Photo  ☑ OFA Excellent  ☑ Embark Clear                       │
│                                                                     │
│  ─── Timeline ──────────────────────────────────────────────────── │
│  ☑ Born: October 15, 2024                                          │
│  ☑ Weaning: December 10, 2024                                      │
│  ☑ Placement begins: January 5, 2025                               │
│                                                                     │
│  ─── Available Offspring ───────────────────────────────────────── │
│  ☑ Default Price: $3,000                              [Edit →]     │
│                                                                     │
│  | Name    | Sex | Color  | Status    | Listed | Price   |         │
│  |---------|-----|--------|-----------|--------|---------|         │
│  | Maple   | F   | Cream  | Available | ☑      | $3,000  |         │
│  | Oak     | M   | Apricot| Available | ☑      | $2,800  |         │
│  | Willow  | F   | Cream  | Reserved  | —      | —       |         │
│  | Birch   | M   | Red    | Available | ☑      | $3,000  |         │
│  | Aspen   | F   | Cream  | KEEP      | —      | —       |         │
│                                                                     │
│  [List All Available] [Unlist All] [Set Price for Selected]        │
│                                                                     │
│  ─── Raising Protocols (from Program) ──────────────────────────── │
│  ☑ From: Goldendoodle Program              [View Program →]        │
│  ☑ ENS  ☑ Puppy Culture  ☑ Crate Training                         │
│                                                                     │
│  ─── Placement Package (from Program) ──────────────────────────── │
│  ☑ From: Goldendoodle Program              [View Program →]        │
│  ☑ Health Records  ☑ Microchip  ☑ 2-Year Guarantee                │
│                                                                     │
│  ─── Breeder Info (from Storefront) ─────────────────────────────  │
│  ✓ Verified  ✓ Health Testing  ✓ 5+ Placements                     │
│  Sunny Acres Goldens • Portland, OR                                │
│  [View Breeder Profile →]  [Contact Breeder →]                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Interaction:**
- ☑ = Visible on public listing
- ☐ = Hidden from public listing
- [Edit →] = Opens editor for group-level fields
- [Edit X's Profile →] = Links to Animal profile for parent data
- [View Program →] = Links to linked Program
- Parent visibility controlled at Animal level
- Protocols/Package inherited from Program (can override at group level)
- Individual offspring Listed/Price editable inline

---

### 4.7 Actions

| Action | Result |
|--------|--------|
| Save | Save visibility changes and offspring marketplace settings |
| List | Make group visible on marketplace (if not already) |
| Unlist | Remove from marketplace (keeps all data) |
| Preview (External) | Open listing page in new tab as buyer sees it |

**Note:** No "Delete" action for Offspring Groups or individual offspring. Breeders can **hide from listing** (unlist) but cannot delete groups or remove offspring from groups - that would create data integrity issues with the Breeding module records.

---

### 4.8 Backend APIs

```
# Group listing management
GET    /api/v1/offspring-groups                    # List all groups for tenant (with marketplace fields)
GET    /api/v1/offspring-groups/:id                # Get group with aggregated data
PATCH  /api/v1/offspring-groups/:id                # Update listing fields (title, description, cover, default price, listed)

# Individual offspring marketplace fields
PATCH  /api/v1/offspring/:id                       # Update marketplaceListed, marketplacePriceCents
POST   /api/v1/offspring-groups/:id/offspring/bulk # Bulk update offspring marketplace fields
```

**Note:** The `/api/v1/offspring-groups` endpoint may need enhancement to include:
- Marketplace listing status
- Available count
- Linked program info
- Aggregated parent data (for preview)

---

## Section 5: Service Listings

**Route:** `/marketplace-manage/services`

**Purpose:** Manage service offerings from two provider types: Breeders (who can leverage platform data) and independent Service Providers (form-based entry).

**Status:** 🔄 UNDER REVIEW

---

### 5.1 Two Provider Types, Two UX Patterns

Service listings support two distinct user types with different capabilities:

| Provider Type | Description | Platform Data Access | UX Model |
|---------------|-------------|---------------------|----------|
| **Breeder** | Registered breeding program on BreederHQ | Full access - can pull animals, health records, documents, media | "Add from Platform" + form |
| **Service Provider** | Independent business (groomer, trainer, vet, etc.) | None - marketplace account only | Form-based entry |

**Key insight:** Breeders have a wealth of data in the platform. A breeder offering herding training with their border collies should be able to "add" those dogs to their service listing with one click, pulling in photos, health records, and certifications. Service Providers start from scratch.

---

### 5.2 Service Category Taxonomy (Hierarchical)

Two-level taxonomy with parent categories and subcategories. Designed to capture mainstream pet services AND niche/specialty animal services identified in the research.

#### Parent Categories

| Category | Description | Breeder-Focused | Species Focus |
|----------|-------------|-----------------|---------------|
| **BREEDING** | Stud services, whelping support, consultation, mentorship, guardian programs | Yes | All |
| **CARE** | Boarding, sitting, day care, drop-in visits | Mixed | Dogs, Cats, Small |
| **EXERCISE** | Walking, running, group walks | No | Dogs |
| **GROOMING** | Full service, bath, nails, mobile grooming | No | Dogs, Cats |
| **TRAINING** | Obedience, puppy, behavior, sport, show/conformation | Mixed | Dogs primarily |
| **WORKING_DOG** | Herding, hunting/gun dog, LGD, protection, detection | Yes | Dogs |
| **SERVICE_THERAPY** | Service dog, therapy dog, ESA, CGC testing | Mixed | Dogs |
| **TRANSPORT** | Local, long-distance, flight nanny | Mixed | All |
| **HEALTH** | Veterinary services, vaccination clinics, wellness exams | No | All |
| **REHABILITATION** | Massage, hydrotherapy, physical therapy, acupuncture | No | Dogs, Horses |
| **LIVESTOCK** | Shearing, farrier, AI services, livestock handling | Mixed | Horses, Sheep, Goats, Cattle |
| **EXOTIC** | Boarding, grooming, and care for exotic/small animals | No | Birds, Reptiles, Small mammals |
| **PROPERTY** | Pet waste removal, yard cleaning, kennel maintenance | No | N/A |
| **CREATIVE** | Photography, video, social media content, marketing | No | All |
| **PRODUCTS** | Food, supplies, equipment, breeding supplies | Mixed | All |
| **OTHER** | Catch-all for services not fitting other categories | Mixed | All |

#### Subcategories by Parent

**BREEDING:**
- `STUD_SERVICE` - Male available for breeding
- `WHELPING_SUPPORT` - Assistance with birthing/raising litters
- `BREEDING_CONSULTATION` - Expert breeding advice
- `MENTORSHIP` - New breeder guidance programs
- `GUARDIAN_PROGRAM` - Guardian home placement program
- `AI_SERVICE` - Artificial insemination services (semen collection, processing, insemination)
- `SEMEN_STORAGE` - Semen freezing, storage, and shipping

**CARE:**
- `BOARDING` - Overnight care at provider's facility
- `PET_SITTING` - In-home care at pet owner's home
- `DAY_CARE` - Daytime care/socialization
- `DROP_IN` - Quick home visits

**EXERCISE:**
- `DOG_WALKING` - Individual walks
- `GROUP_WALKS` - Pack walks/socialization
- `RUNNING` - Jogging/running with dogs

**GROOMING:**
- `FULL_GROOMING` - Complete grooming service
- `BATH_BRUSH` - Basic bathing and brushing
- `NAIL_TRIM` - Nail trimming only
- `MOBILE_GROOMING` - Grooming at client's location
- `SHOW_GROOMING` - Competition/show preparation grooming

**TRAINING:**
- `OBEDIENCE` - Basic to advanced obedience
- `PUPPY_TRAINING` - Puppy-specific training
- `BEHAVIOR_MODIFICATION` - Problem behavior correction
- `SHOW_TRAINING` - Conformation/show ring prep
- `SPORT_TRAINING` - Agility, rally, nose work, dock diving
- `BOARD_TRAIN` - Board and train programs

**WORKING_DOG:** *(New - from research)*
- `HERDING_TRAINING` - Herding instinct tests, lessons, stock dog development
- `HERDING_INSTINCT_TEST` - Initial instinct evaluation
- `GUN_DOG_TRAINING` - Bird dog, retriever, pointer training, field trial prep
- `LGD_TRAINING` - Livestock Guardian Dog training and placement
- `PROTECTION_TRAINING` - Personal/property protection training
- `DETECTION_TRAINING` - Scent work, nose work, detection training

**SERVICE_THERAPY:** *(New - from research)*
- `SERVICE_DOG_TRAINING` - Task training, public access training
- `THERAPY_DOG_CERTIFICATION` - Therapy dog prep and certification
- `ESA_LETTERS` - Emotional Support Animal documentation
- `CGC_TESTING` - AKC Canine Good Citizen evaluation
- `TRICK_DOG_TESTING` - AKC Trick Dog title evaluation

**TRANSPORT:**
- `LOCAL_TRANSPORT` - Within metro area
- `LONG_DISTANCE` - Cross-state/country ground transport
- `FLIGHT_NANNY` - In-cabin escort on flights
- `VET_TRANSPORT` - To/from vet appointments

**HEALTH:**
- `VETERINARY` - Full veterinary services
- `VACCINATION_CLINIC` - Vaccination services
- `DENTAL` - Pet dental services
- `WELLNESS_EXAM` - Health checkups
- `EMERGENCY` - Emergency veterinary care
- `REPRODUCTIVE_VET` - Reproductive veterinary services

**REHABILITATION:** *(New - from research)*
- `MASSAGE_THERAPY` - Therapeutic massage, trigger point therapy
- `HYDROTHERAPY` - Underwater treadmill, swim therapy
- `PHYSICAL_THERAPY` - Physical rehabilitation post-surgery/injury
- `ACUPUNCTURE` - Veterinary acupuncture
- `CHIROPRACTIC` - Animal chiropractic services
- `LASER_THERAPY` - Cold laser/therapeutic laser treatment

**LIVESTOCK:** *(New - from research)*
- `SHEARING` - Sheep, goat, alpaca, llama fiber shearing
- `HOOF_TRIMMING` - Hoof care for goats, sheep, alpacas
- `FARRIER` - Horse hoof care, trimming, shoeing
- `LIVESTOCK_AI` - Artificial insemination for cattle, horses, sheep, goats
- `LIVESTOCK_HANDLING` - Livestock handling training and clinics

**EXOTIC:** *(New - from research)*
- `EXOTIC_BOARDING` - Boarding for birds, reptiles, small mammals
- `EXOTIC_GROOMING` - Grooming for rabbits, guinea pigs, etc.
- `AVIAN_SERVICES` - Bird-specific care, wing clipping, beak trimming
- `REPTILE_SERVICES` - Reptile husbandry, habitat setup
- `SMALL_MAMMAL_CARE` - Rabbit, guinea pig, chinchilla, ferret care

**PROPERTY:**
- `WASTE_REMOVAL` - Pet waste cleanup
- `YARD_DEODORIZING` - Odor treatment
- `KENNEL_CLEANING` - Facility cleaning services

**CREATIVE:** *(Expanded from MEDIA)*
- `PHOTOGRAPHY` - Professional pet/animal photography
- `VIDEO` - Video production
- `SOCIAL_CONTENT` - Social media content creation
- `MARKETING` - Breeder marketing, branding services

**PRODUCTS:**
- `FOOD_NUTRITION` - Food and supplements
- `SUPPLIES` - General pet supplies
- `BREEDING_SUPPLIES` - Whelping boxes, scales, etc.

---

### 5.2.1 Category-Specific Insights (from Research)

**Key market gaps identified:**

| Category | Opportunity | Notes |
|----------|------------|-------|
| **Working Dog** | No centralized marketplace exists | Herding trainers, gun dog trainers scattered across individual websites |
| **Livestock** | Shearers in SHORT SUPPLY | Book early (Feb 1 for spring shearing) - geographic scarcity |
| **LGD** | Specialized placement needed | LGDs must be raised on working farms - critical for success |
| **Exotic** | Underserved market | Birds, reptiles, small mammals have few dedicated service providers |
| **Rehabilitation** | Growing demand | Post-surgery rehab, senior pet wellness, athletic conditioning |

**Species-agnostic consideration:** Unlike dog-focused platforms (Rover, Wag), BreederHQ should support:
- Dogs (all types including working breeds)
- Cats
- Horses (farrier, equine rehab, AI services)
- Livestock (sheep, goats, alpacas, llamas, cattle)
- Exotics (birds, reptiles, small mammals)

**Seasonal demand patterns:**
- Shearing: Spring peak (book by Feb 1)
- Breeding/stud services: Species-specific breeding seasons
- Transport: Holiday peaks
- Training: New Year resolutions spike

---

### 5.3 STUD Animal Listing vs STUD_SERVICE Service Listing

**Clarification:** Both exist and serve different purposes.

| Aspect | Animal Listing (Intent: STUD) | Service Listing (STUD_SERVICE) |
|--------|------------------------------|-------------------------------|
| **Focus** | Specific animal | General service offering |
| **Data** | Full animal profile, health, pedigree | Service terms, breeding methods, pricing tiers |
| **Use Case** | "Champion Duke is available at stud" | "We offer stud services from our males" |
| **Link** | Can link TO service listing | Can link TO specific stud animals |
| **Best For** | Showcasing individual stud's qualities | Marketing overall stud program |

**Recommended usage:**
1. Create STUD_SERVICE listing describing your stud program
2. Create Animal Listing (STUD intent) for each specific male
3. Link them together - service listing references available studs

---

### 5.4 Services List View

| Column | Notes |
|--------|-------|
| Image | Service hero image thumbnail |
| Title | Service name |
| Category | Parent category badge |
| Subcategory | Specific service type |
| Price | Formatted price or "Contact" |
| Location | City, State |
| Status | Draft / Active / Paused |
| Views | View count |
| Inquiries | Inquiry count |
| Actions | Edit, Toggle Status, Delete |

**Filters:**
- Category (parent)
- Subcategory
- Status (draft/active/paused)

**Actions:**
- Create New Service
- Filter controls
- Sort by: newest, most views, most inquiries

---

### 5.5 Create Service Flow

**Step 1: Select Category**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Create Service Listing                                              │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Select a category for your service:                                │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │    BREEDING     │  │      CARE       │  │    EXERCISE     │     │
│  │  Stud, whelping │  │ Boarding, sitting│  │ Walking, running│     │
│  │   mentorship    │  │    day care     │  │   group walks   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │    GROOMING     │  │    TRAINING     │  │    TRANSPORT    │     │
│  │ Full, bath, nails│  │ Obedience, puppy│  │ Local, distance │     │
│  │     mobile      │  │ behavior, sport │  │  flight nanny   │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │     HEALTH      │  │    PROPERTY     │  │      MEDIA      │     │
│  │  Vet, vaccines  │  │ Waste removal   │  │  Photography    │     │
│  │    dental       │  │   cleaning      │  │     video       │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐                          │
│  │    PRODUCTS     │  │      OTHER      │                          │
│  │ Food, supplies  │  │ Something else  │                          │
│  └─────────────────┘  └─────────────────┘                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Step 2: Select Subcategory**

After selecting parent category, show relevant subcategories:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Back                                          TRAINING           │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  What type of training service?                                     │
│                                                                     │
│  ○ Basic Obedience                                                  │
│    Sit, stay, come, heel, leash manners                            │
│                                                                     │
│  ○ Puppy Training                                                   │
│    Socialization, house training, basic commands                    │
│                                                                     │
│  ○ Behavior Modification                                            │
│    Aggression, anxiety, reactivity, problem behaviors              │
│                                                                     │
│  ○ Show / Conformation Training                                     │
│    Ring preparation, stacking, gaiting                             │
│                                                                     │
│  ○ Sport / Performance Training                                     │
│    Agility, rally, herding, nose work, dock diving                 │
│                                                                     │
│  ○ Service Dog Training                                             │
│    Service, therapy, emotional support animal training             │
│                                                                     │
│                                              [Continue →]           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Step 3: Service Editor** → Proceeds to full editor (see 5.6)

---

### 5.6 Service Editor (Breeder Version)

Breeders see an enhanced editor with "Add from Platform" capability.

#### Core Sections

| Section | Purpose |
|---------|---------|
| **Basic Info** | Title, description, category |
| **Pricing** | Price model, amounts, notes |
| **Location & Service Area** | Where service is offered |
| **Media** | Images, videos |
| **Contact** | How to reach provider |
| **Platform Data** (Breeder only) | Animals, documents, health records |
| **Availability** | Schedule, lead time |

#### Basic Info Section

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | text | Yes | Service name (e.g., "Professional Herding Training") |
| Tagline | text | No | Short hook for cards (e.g., "Learn from working dogs") |
| Description | rich text | Yes | Full description of service |
| Category | display | Read-only | Set in Step 1 |
| Subcategory | display | Read-only | Set in Step 2 |
| URL Slug | text | Auto | SEO-friendly URL |

#### Pricing Section

| Field | Type | Notes |
|-------|------|-------|
| Price Model | select | Fixed, Starting At, Hourly, Per Session, Contact |
| Price | currency | Required unless "Contact" |
| Price Range | min/max | If "Starting At" or range needed |
| Price Unit | text | "per session", "per hour", "per night", etc. |
| Pricing Notes | text | Terms, what's included, packages |

**Price Models:**
- **Fixed** - Single price (e.g., "$150")
- **Starting At** - Minimum price (e.g., "Starting at $150")
- **Hourly** - Per hour rate (e.g., "$75/hour")
- **Per Session** - Per session rate (e.g., "$100/session")
- **Contact** - "Contact for pricing"

#### Location & Service Area Section

| Field | Type | Notes |
|-------|------|-------|
| Use Storefront Location | toggle | Default ON for breeders |
| City | text | Override if different |
| State/Region | text | Override if different |
| Country | text | Override if different |
| Service Area | select | On-site, Mobile, Remote, Nationwide |
| Service Radius | number | If mobile (e.g., "Within 25 miles") |

#### Media Section

| Field | Type | Notes |
|-------|------|-------|
| Cover Image | image | Hero image for listing |
| Gallery | multi-image | Additional photos |
| Video URL | url | YouTube/Vimeo link |
| Video Title | text | Display name for video |

#### Contact Section

| Field | Type | Notes |
|-------|------|-------|
| Use Storefront Contact | toggle | Default ON for breeders |
| Contact Name | text | Override if different |
| Contact Email | email | Override if different |
| Contact Phone | phone | Override if different |
| Preferred Contact | select | Email, Phone, Either |
| Response Time | select | "Usually responds within X" |

#### Platform Data Section (BREEDER ONLY)

This is the key differentiator for breeders. They can pull in data from across the platform.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ─── Platform Data ─────────────────────────────────────────────── │
│  Enhance your listing with data from your BreederHQ account        │
│                                                                     │
│  [+ Add from Platform ▼]                                            │
│  ┌─────────────────────────────────────────────────────────────────┐
│  │  🐕 Animals (select animals to feature)                          │
│  │  📄 Documents (certifications, licenses, insurance)              │
│  │  🏥 Health Records (vaccinations, clearances)                    │
│  │  📷 Media Library (photos, videos from your account)             │
│  │  🏆 Credentials (from your Storefront)                           │
│  └─────────────────────────────────────────────────────────────────┘
│                                                                     │
│  ─── Featured Animals ────────────────────────────────────────────  │
│  (Animals that participate in this service)                         │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ 🐕 Duke - Border Collie                    [Remove]    │        │
│  │    ☑ Photo  ☑ Health Records  ☑ Titles               │        │
│  │    ☑ "10+ years herding experience"                   │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ 🐕 Luna - Australian Shepherd              [Remove]    │        │
│  │    ☑ Photo  ☑ Health Records  ☑ Titles               │        │
│  │    ☑ "ASCA Champion, AKC Herding Excellent"           │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                     │
│  [+ Add Animal]                                                     │
│                                                                     │
│  ─── Attached Documents ──────────────────────────────────────────  │
│                                                                     │
│  📄 Professional Dog Trainer Certification (CPDT-KA)    [Remove]   │
│  📄 Liability Insurance Certificate                      [Remove]   │
│                                                                     │
│  [+ Add Document]                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**"Add Animal" Flow:**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Add Animal to Service                                   [X Close]  │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Search: [________________]                                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ☐  [Photo] Duke - Border Collie - Male - 8 years            │  │
│  │ ☐  [Photo] Luna - Australian Shepherd - Female - 5 years    │  │
│  │ ☐  [Photo] Max - German Shepherd - Male - 3 years           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Selected: 2 animals                                                │
│                                                                     │
│  What to include for each animal:                                   │
│  ☑ Photos (public photos from animal profile)                      │
│  ☑ Health Records (public health data)                             │
│  ☑ Titles & Achievements                                           │
│  ☐ Pedigree                                                        │
│                                                                     │
│                                       [Cancel]  [Add Selected →]   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**What data can be pulled:**

| Data Type | Source | Visibility Control |
|-----------|--------|-------------------|
| Animals | Animal roster | Respects Animal's public visibility settings |
| Animal Photos | Animal media | Only public photos |
| Animal Health | Animal health tests | Only if marked public on Animal |
| Animal Titles | AnimalTitle | Only if marked public on Animal |
| Documents | Tenant documents | Provider selects which to include |
| Credentials | Storefront credentials | Can pull from Storefront |
| Media | Media library | Provider selects specific items |

#### Availability Section (Optional)

| Field | Type | Notes |
|-------|------|-------|
| Available Days | multi-select | Mon, Tue, Wed, etc. |
| Hours | text | "9am - 5pm" or "By appointment" |
| Lead Time | select | "Same day", "24 hours", "1 week", etc. |
| Seasonal | toggle | If service is seasonal |
| Season Notes | text | "Available spring through fall" |

---

### 5.7 Service Editor (Service Provider Version)

Non-breeder Service Providers see a simpler form without "Platform Data" section.

Same sections as Breeder version EXCEPT:
- No "Platform Data" section
- No "Use Storefront Location/Contact" toggles (they enter everything)
- Location and Contact are required

**Key difference:** Service Providers cannot pull in animals, documents, or other platform data. They enter everything manually.

---

### 5.8 Category-Specific Fields (Metadata)

Some categories have additional structured fields stored in `metadata` JSON:

#### BREEDING > STUD_SERVICE

| Field | Type | Notes |
|-------|------|-------|
| Breeding Methods | multi-select | Live cover, AI fresh, AI chilled, AI frozen |
| Progeny Guarantee | toggle | Return breeding if no conception |
| Health Testing Required | text | Requirements for females |
| Linked Stud Animals | animal[] | Reference to Animal Listings |

#### TRANSPORT

| Field | Type | Notes |
|-------|------|-------|
| Transport Types | multi-select | Ground, Flight nanny |
| Max Distance | number | Miles willing to travel |
| Species Accepted | multi-select | Dogs, Cats, Horses, etc. |
| Crate Required | toggle | Must provide crate |
| Insurance Included | toggle | Transport insurance |
| Insurance Amount | currency | Coverage amount |

#### TRAINING

| Field | Type | Notes |
|-------|------|-------|
| Training Types | multi-select | Private, Group, Board & train |
| Session Duration | number | Minutes per session |
| Certifications | text | CPDT-KA, AKC CGC Evaluator, etc. |
| Species/Breeds | multi-select | Specializations |
| Age Groups | multi-select | Puppy, Adult, Senior |

#### BOARDING / CARE

| Field | Type | Notes |
|-------|------|-------|
| Pet Types Accepted | multi-select | Dogs, Cats, etc. |
| Max Pets | number | Capacity |
| Fenced Yard | toggle | Has fenced outdoor area |
| Home Environment | multi-select | Kids, Other dogs, Cats, etc. |
| Medications Administered | toggle | Can give meds |
| Special Needs | toggle | Accepts special needs pets |

#### WORKING_DOG (New)

| Field | Type | Notes |
|-------|------|-------|
| Training Level | multi-select | Instinct test, Beginner, Intermediate, Advanced, Competition |
| Stock Available | multi-select | Sheep, Cattle, Ducks, Goats (for herding) |
| Game Birds | toggle | Uses game birds (for gun dog) |
| Board & Train | toggle | Offers monthly programs |
| Program Duration | text | "4 weeks", "3 months", etc. |
| Certifications | multi-select | AKC Hunt Tests, NAVHDA, ASCA, Field Trials, Master Hunter |
| Breeds Specialized | multi-select | Border Collie, Lab, German Shepherd, etc. |

#### SERVICE_THERAPY (New)

| Field | Type | Notes |
|-------|------|-------|
| Service Type | multi-select | Service dog, Therapy dog, ESA |
| ADA Compliant | toggle | Trained to ADA standards |
| Certification Org | multi-select | Alliance of Therapy Dogs, Pet Partners, etc. |
| Task Training | multi-select | Mobility, Psychiatric, Medical alert, etc. |
| Public Access | toggle | Public access training included |

#### REHABILITATION (New)

| Field | Type | Notes |
|-------|------|-------|
| Species | multi-select | Dogs, Cats, Horses |
| Conditions Treated | multi-select | Post-surgery, Arthritis, Weight loss, Athletic conditioning |
| Equipment | multi-select | Underwater treadmill, Pool, Laser, TENS, etc. |
| Certifications | text | CCRP, CVMRT, CCRT, etc. |
| Vet Referral Required | toggle | Requires veterinary referral |

#### LIVESTOCK (New)

| Field | Type | Notes |
|-------|------|-------|
| Species | multi-select | Sheep, Goats, Alpacas, Llamas, Horses, Cattle |
| Services | multi-select | Shearing, Hoof trim, Shoeing, AI, etc. |
| Farm Call Fee | currency | Minimum trip charge |
| Min Head Count | number | Minimum animals per visit |
| Seasonal Availability | text | "February - May", etc. |
| Advance Booking | text | "Book by Feb 1 for spring" |

#### EXOTIC (New)

| Field | Type | Notes |
|-------|------|-------|
| Species Accepted | multi-select | Birds, Reptiles, Rabbits, Guinea pigs, Chinchillas, Ferrets, Hedgehogs |
| Special Equipment | multi-select | Heated tanks, UVB lighting, Flight cages, etc. |
| Medication Administration | toggle | Can administer medications |
| Special Diet | toggle | Can prepare special diets |
| Isolation Available | toggle | Can isolate if needed |

#### CREATIVE (New)

| Field | Type | Notes |
|-------|------|-------|
| Shoot Types | multi-select | Studio, On-location, Action/Sport, Fine art |
| Species | multi-select | Dogs, Cats, Horses, Farm animals, Exotics |
| Deliverables | multi-select | Digital files, Prints, Albums, Video |
| Use Rights | text | Personal, Commercial, Breeder marketing |
| Session Duration | text | "1 hour", "Half day", etc. |

---

### 5.9 Preview UI (Breeder Service Listing)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Professional Herding Training               [Preview] [Edit] [Save] │
│  ─────────────────────────────────────────────────────────────────  │
│  Status: Active ✓   Category: Training > Sport                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ☑ [Cover Image: Dogs herding sheep]                               │
│                                                                     │
│  ☑ PROFESSIONAL HERDING TRAINING                                   │
│  ☑ "Learn from working dogs with decades of experience"            │
│    Training > Sport/Performance                                     │
│                                                                     │
│  ☑ "We offer comprehensive herding training from beginner          │
│     instinct tests through advanced trial preparation.              │
│     Our team of champion herding dogs..."               [Edit →]   │
│                                                                     │
│  ─── Pricing ───────────────────────────────────────────────────── │
│  ☑ Starting at $100/session                                        │
│  ☑ "Private lessons, group clinics, and intensive programs        │
│     available. Contact for package pricing."            [Edit →]   │
│                                                                     │
│  ─── Featured Animals (from Platform) ──────────────────────────── │
│  (Data pulled from your Animal profiles)                            │
│                                                                     │
│  ☑ DUKE - Border Collie                      [Edit Duke's Profile →]│
│    ☑ Photo                                    (from Animal)        │
│    ☑ ASCA Champion, AKC Herding Excellent     (from Animal)        │
│    ☑ Health Clearances: OFA Good, CAER Clear  (from Animal)        │
│    ☑ "Duke has over 10 years of herding experience and has         │
│       trained 100+ dogs from beginner to trial-ready."             │
│                                                                     │
│  ☑ LUNA - Australian Shepherd                [Edit Luna's Profile →]│
│    ☑ Photo                                    (from Animal)        │
│    ☑ AKC Herding Champion                     (from Animal)        │
│    ☑ Health Clearances: OFA Excellent         (from Animal)        │
│                                                                     │
│  ─── Certifications & Documents (from Platform) ───────────────── │
│  ☑ 📄 ASCA Certified Judge                                         │
│  ☑ 📄 Liability Insurance ($1M coverage)                           │
│                                                                     │
│  ─── Location & Service Area ───────────────────────────────────── │
│  ☑ Denver, CO (from Storefront)                                    │
│  ☑ Service Area: On-site training at our facility                  │
│  ☑ Also available: Travel to client locations within 50 miles     │
│                                                                     │
│  ─── Contact ───────────────────────────────────────────────────── │
│  ☑ Sarah Johnson (from Storefront)                                 │
│  ☑ training@sunnyacresfarm.com                                     │
│  ☑ (303) 555-1234                                                  │
│  ☑ Usually responds within 24 hours                                │
│                                                                     │
│  ─── Availability ──────────────────────────────────────────────── │
│  ☑ Tue, Wed, Thu, Sat                                              │
│  ☑ 8am - 4pm                                                       │
│  ☑ Book at least 1 week in advance                                 │
│                                                                     │
│  ─── Provider Info (from Storefront) ───────────────────────────── │
│  ✓ Verified  ✓ 10+ Years Experience                                │
│  Sunny Acres Farm • Denver, CO                                     │
│  [View Full Profile →]                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 5.10 Actions

| Action | Result |
|--------|--------|
| Save Draft | Save as DRAFT (not visible on marketplace) |
| Publish | Set to ACTIVE (visible on marketplace) |
| Pause | Set to PAUSED (temporarily hidden) |
| Delete | Remove listing entirely |
| Preview (External) | Open listing page in new tab as buyer sees it |

---

### 5.11 Backend APIs

```
# Service listing management
GET    /api/v1/services                    # List all services for provider
GET    /api/v1/services/:id                # Get service with all data
POST   /api/v1/services                    # Create service
PUT    /api/v1/services/:id                # Update service
PATCH  /api/v1/services/:id/status         # Change status (DRAFT/ACTIVE/PAUSED)
DELETE /api/v1/services/:id                # Delete service

# Service media
POST   /api/v1/services/:id/media          # Upload images
DELETE /api/v1/services/:id/media/:mediaId # Remove image

# Service animals (breeder only)
POST   /api/v1/services/:id/animals        # Link animals to service
DELETE /api/v1/services/:id/animals/:animalId

# Service documents (breeder only)
POST   /api/v1/services/:id/documents      # Link documents to service
DELETE /api/v1/services/:id/documents/:documentId

# Public browse
GET    /api/v1/marketplace/services        # Browse all services
GET    /api/v1/marketplace/services/:slug  # Service detail page
```

---

### 5.12 Schema Updates Needed

```typescript
interface ServiceListing {
  id: number;

  // Provider (breeder tenant OR service provider account)
  tenantId?: number;           // If breeder
  serviceProviderId?: number;  // If independent provider
  providerType: "breeder" | "service_provider";

  // Category
  parentCategory: ServiceParentCategory;
  subcategory: string;

  // Content
  title: string;
  tagline?: string;
  description: string;
  slug: string;

  // Media
  coverImageUrl?: string;
  images: string[];           // JSON array
  videoUrl?: string;
  videoTitle?: string;

  // Location
  useStorefrontLocation: boolean;  // Breeder only
  city?: string;
  state?: string;
  country: string;
  serviceArea: "onsite" | "mobile" | "remote" | "nationwide";
  serviceRadius?: number;

  // Pricing
  priceModel: "fixed" | "starting_at" | "hourly" | "per_session" | "contact";
  priceCents?: number;
  priceMinCents?: number;
  priceMaxCents?: number;
  priceUnit?: string;
  pricingNotes?: string;

  // Contact
  useStorefrontContact: boolean;  // Breeder only
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContact?: "email" | "phone" | "either";
  responseTime?: string;

  // Availability
  availableDays?: string[];
  availableHours?: string;
  leadTime?: string;
  seasonal?: boolean;
  seasonNotes?: string;

  // Category-specific metadata
  metadata?: Record<string, unknown>;

  // Linked platform data (breeder only)
  linkedAnimals?: ServiceAnimalLink[];
  linkedDocuments?: ServiceDocumentLink[];

  // Status
  status: "draft" | "active" | "paused";

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

interface ServiceAnimalLink {
  serviceId: number;
  animalId: number;
  displayOrder: number;
  includePhotos: boolean;
  includeHealth: boolean;
  includeTitles: boolean;
  includePedigree: boolean;
  customNote?: string;  // Provider's note about this animal's role
}

interface ServiceDocumentLink {
  serviceId: number;
  documentId: number;
  displayOrder: number;
}
```

---

### 5.13 Navigation Note

**Current issue:** The Services page exists at `/me/services` but is NOT in the navigation.

**Resolution:** Add "My Services" to the marketplace management navigation alongside Programs, Animals, Offspring Groups.

---

### 5.14 Service Provider Subscription Tiers

**Note:** Breeders already pay for breeding program subscriptions, so service listings are included with their plan. Independent Service Providers need a separate subscription model.

#### Initial Launch: Free for All

**Phase 1 (MVP):**
- All service listings are FREE for both breeders and service providers
- No listing limits
- Focus on building provider base and testing market fit

#### Future Subscription Model (Phase 2)

Once the marketplace has traction, introduce tiered pricing for **Service Providers only**:

| Tier | Price | Listings | Features |
|------|-------|----------|----------|
| **FREE** | $0/month | 1 listing | Basic listing, standard visibility, community support |
| **BASIC** | $9/month | 3 listings | Enhanced visibility, basic analytics, email support |
| **PREMIUM** | $29/month | 10 listings | Featured placement, advanced analytics, priority support, badge eligibility |
| **BUSINESS** | $79/month | Unlimited | All features, "Verified Pro" badge, API access, priority listing in search |

**Breeder Service Listings:**
- Included with breeding program subscription
- No additional fees
- All premium features available (featured animals, platform data access, etc.)

**Why free initially?**
- Build critical mass of service providers
- Test market demand across categories
- Gather data on which categories perform well
- Prove value before asking for payment

---

### 5.15 Public-Facing UI Patterns (Browse & Search)

These patterns define how **buyers** discover and interact with service listings on the public marketplace. Based on successful patterns from Rover, Thumbtack, and specialty platforms.

---

#### 5.15.1 Service Provider Card (Search Results)

Inspired by Rover's highly effective card design, optimized for trust signals and quick scanning.

**Standard Card Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐                                        from       │
│  │      │  Provider Name                         $65        │
│  │ PHOTO│  ┌─────────────┐                       per visit  │
│  │      │  │ Verified Pro│                                  │
│  └──────┘  └─────────────┘                                  │
│  ✓ (green checkmark = verified)                             │
│                                                             │
│  ⭐ 4.8 • 127 reviews                                       │
│  🔄 45 repeat clients                                       │
│  📅 8 years of experience                                   │
│  📍 Austin, TX (Mobile service available)                  │
│                                                             │
│  Services: Grooming • Bath & Brush • Nail Trim             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Best groomer in Austin! My anxious dog actually    │   │
│  │ enjoys grooming now. Highly recommend!"             │   │
│  │                                                     │   │
│  │ 👤 Jessica M.                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Breeder Service Card (variant):**

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐                                        from       │
│  │      │  Sunny Acres Goldens                   $750       │
│  │ LOGO │  ┌────────────┐ ┌──────────────┐      stud fee   │
│  │      │  │ Top Breeder│ │ Health Tested│                  │
│  └──────┘  └────────────┘ └──────────────┘                  │
│                                                             │
│  ⭐ 4.9 • 45 reviews                                        │
│  🏆 OFA Excellent, Embark Clear, CAER Normal               │
│  🐕 Golden Retriever • 12 years breeding                    │
│  📍 Denver, CO                                              │
│                                                             │
│  Services: Stud Service • Mentorship • Whelping Support    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Sarah's mentorship program was invaluable for my   │   │
│  │ first litter. Worth every penny!"                   │   │
│  │                                                     │   │
│  │ 👤 Amanda K. (mentee)                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Card Elements Priority:**

| Element | Purpose | Weight |
|---------|---------|--------|
| **Photo/Logo** | Visual identity, trust | Critical |
| **Name** | Provider identification | Critical |
| **Badge(s)** | Trust & recognition signals | High |
| **Verification check** | Security signal | High |
| **Rating + Review count** | Social proof | Critical |
| **Repeat clients** | Loyalty signal | Medium |
| **Experience** | Expertise indicator | Medium |
| **Location + Service area** | Relevance | Critical |
| **Price** | Decision factor | Critical |
| **Service list** | Quick overview | Medium |
| **Featured review** | Authentic voice | High |

---

#### 5.15.2 Badge System

Two-tier badge system: **Verification** (security/trust) and **Recognition** (achievement/quality).

**Verification Badges (Tier 1 - Trust):**

| Badge | Criteria | Visual | Priority |
|-------|----------|--------|----------|
| **Verified** | Basic identity verification | ✓ Green check | Required for all |
| **Background Checked** | Passed background check (for care/boarding) | 🛡️ Shield | High for pet care |
| **Licensed** | Business license verified | 📜 Document | Required for vets/professionals |
| **Insured** | Liability insurance confirmed | 🏥 Insurance | High for transport/boarding |

**Recognition Badges (Tier 2 - Achievement):**

| Badge | Criteria | Visual | Eligibility |
|-------|----------|--------|-------------|
| **Top Breeder** | 4.8+ rating, health testing compliance, 10+ reviews | 🏆 Gold | Breeders only |
| **Verified Pro** | Licensed/certified professional in field | ✅ Blue | Service providers |
| **Star Provider** | 4.9+ rating, 50+ reviews, <2hr response time | ⭐ Yellow | All |
| **Mentor** | Offers mentorship, 5+ years experience, 4.8+ rating | 🎓 Cap | Breeders/trainers |

**Specialty Badges (Breeder-Specific):**

| Badge | Criteria | Visual | Context |
|-------|----------|--------|---------|
| **Health Tested** | All breed-recommended tests complete | ❤️ Heart | Stud services |
| **OFA Certified** | OFA database verified results | 🦴 Bone | Breeding programs |
| **AKC Breeder of Merit** | AKC program participant | 🎖️ Medal | Dog breeders |
| **Working Champion** | Titled in herding/hunt/performance | 🐕 Dog | Working dog services |

**Badge Display Rules:**
- Maximum 2 badges per card (highest priority shown)
- Verification badge always shows if earned
- Recognition badge based on category relevance
- Hover/tap to see all badges

---

#### 5.15.3 Search & Browse Experience

**Search Bar (Homepage / Services Page):**

```
┌─────────────────────────────────────────────────────────────┐
│  Find pet services near you                                 │
│  ┌────────────────────┐ ┌────────────────┐ ┌─────────────┐ │
│  │ What service?      │ │ Location       │ │   Search    │ │
│  │ e.g. Dog Training ▼│ │ City, State, ZIP│ │             │ │
│  └────────────────────┘ └────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Quick Categories (Below Search):**

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Training │ │ Grooming │ │ Boarding │ │  Stud    │ │ Transport│
│    🎓    │ │    ✂️    │ │    🏠    │ │ Services │ │    🚗    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Results Page:**

```
┌─────────────────────────────────────────────────────────────┐
│  Showing 47 results for "Dog Training" near Austin, TX      │
│  ──────────────────────────────────────────────────────────  │
│  Filters: [Price ▼] [Rating ▼] [Distance ▼] [Species ▼]    │
│           [Provider Type ▼] [Availability ▼]                │
│                                                             │
│  Sort by: [Recommended ▼]                                   │
│  ───────────────────────────────────────────────────────────│
│                                                             │
│  [Provider Card 1]                                          │
│  [Provider Card 2]                                          │
│  [Provider Card 3]                                          │
│  [Provider Card 4]                                          │
│                                                             │
│  [ Show More Results ]                                      │
└─────────────────────────────────────────────────────────────┘
```

**Filter Options:**

| Filter | Options | Notes |
|--------|---------|-------|
| **Service Type** | By parent category → subcategory | Hierarchical drill-down |
| **Price Range** | Free, <$25, $25-50, $50-100, $100-250, $250-500, $500+, Contact | Flexible ranges |
| **Rating** | 4.5+, 4.0+, 3.5+, Any | Only show if has reviews |
| **Distance** | 5mi, 10mi, 25mi, 50mi, 100mi, Any | Geolocation-based |
| **Provider Type** | Breeders, Service Providers, All | Distinguish breeder services |
| **Species** | Dogs, Cats, Horses, Livestock, Birds, Exotics | Multi-select |
| **Availability** | Available now, This week, This month, Any | If provider specifies |
| **Verification** | Verified only, Background checked, Licensed | Trust filters |
| **Features** | Has reviews, Repeat clients, Mobile service, Insurance | Value-adds |

**Sort Options:**

| Sort | Algorithm | Use Case |
|------|-----------|----------|
| **Recommended** | Rating × reviews × response time ÷ distance | Default (best overall) |
| **Highest Rated** | Star rating DESC, review count DESC | Quality-focused |
| **Most Reviews** | Review count DESC | Popular providers |
| **Lowest Price** | Price ASC | Budget-conscious |
| **Closest** | Distance ASC | Proximity priority |
| **Newest** | Created date DESC | Discover new providers |

---

#### 5.15.4 Service Detail Page

**Page Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Image Gallery - hero image + thumbnails]                  │
├─────────────────────────────────────────────────────────────┤
│  Provider Name  ⭐ Badge  ✓ Verified                        │
│  ⭐ 4.9 (127 reviews) • 45 repeat clients                   │
│  📍 Austin, TX • Mobile service • 8 years experience        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  from $65/session              [Contact] [Book Now]  │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  [About] [Services & Pricing] [Reviews] [Photos] [FAQ]     │
│  ──────────────────────────────────────────────────────────  │
│                                                             │
│  About This Service:                                        │
│  [Full description text]                                    │
│                                                             │
│  What's Included:                                           │
│  • Benefit 1                                                │
│  • Benefit 2                                                │
│  • Benefit 3                                                │
│                                                             │
│  Service Area: Within 25 miles of Austin, TX               │
│  Availability: Mon-Fri, 9am-5pm                            │
│  Response Time: Usually within 2 hours                      │
└─────────────────────────────────────────────────────────────┘
```

**For Breeder Services with Featured Animals:**

```
│  ─── Featured Animals (from Platform) ────────────────────  │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  🐕 DUKE - Border Collie                           │    │
│  │  ┌──────┐                                          │    │
│  │  │PHOTO │  ⭐ ASCA Champion, AKC Herding Excellent │    │
│  │  └──────┘  ✓ OFA Good, CAER Clear                 │    │
│  │            🏆 10+ years herding experience          │    │
│  │            "Duke has trained 100+ dogs from        │    │
│  │            beginner to trial-ready"                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  🐕 LUNA - Australian Shepherd                     │    │
│  │  ┌──────┐                                          │    │
│  │  │PHOTO │  ⭐ AKC Herding Champion                 │    │
│  │  └──────┘  ✓ OFA Excellent                        │    │
│  └────────────────────────────────────────────────────┘    │
```

**Key Sections:**

| Tab/Section | Content | Purpose |
|-------------|---------|---------|
| **About** | Description, qualifications, philosophy | Provider story |
| **Services & Pricing** | All services with pricing breakdown | Clear expectations |
| **Reviews** | Full review list with photos, filtering | Social proof |
| **Photos/Videos** | Gallery of work, facilities, animals | Visual confidence |
| **FAQ** | Common questions answered | Reduce inquiry friction |
| **Certifications** | Licenses, insurance, credentials | Trust building |

---

#### 5.15.5 Key Metrics Display

**Universal Metrics (All Providers):**

| Metric | Format | Source |
|--------|--------|--------|
| Rating | ⭐ 4.9 (one decimal) | Review aggregate |
| Review count | "127 reviews" | Total reviews |
| Repeat clients | "45 repeat clients" | Booking history |
| Experience | "8 years of experience" | Account age or manual |
| Location | "Austin, TX" | Provider location |
| Response time | "Usually within 2 hours" | Message history avg |

**Breeder-Specific Metrics:**

| Metric | Format | Source |
|--------|--------|--------|
| Breed(s) | "Golden Retriever, Labrador" | BreedingProgram |
| Health certs | "OFA Excellent, CAER Clear" | Animal health tests |
| Litters raised | "32 litters raised" | BreedingPlan count |
| Puppies placed | "180+ puppies placed" | Offspring placement count |
| Years breeding | "12 years breeding" | First litter date |

**Service Provider Metrics:**

| Metric | Format | Source |
|--------|--------|--------|
| Jobs completed | "500+ grooming sessions" | Booking history |
| Certifications | "CPDT-KA Certified" | Verified credentials |
| Service area | "Within 25 miles" | Service radius |
| Insurance | "$1M liability coverage" | Insurance verification |

---

### 5.16 Competitive Differentiation Opportunities

Based on research, BreederHQ has unique opportunities to differentiate from existing platforms:

#### What Competitors Don't Have

| Gap | BreederHQ Advantage | Impact |
|-----|---------------------|--------|
| **No centralized working dog services** | WORKING_DOG category with herding, gun dog, LGD training | New market |
| **No breeder-to-breeder services** | Mentorship, whelping support, stud services with full animal profiles | Unique to platform |
| **No livestock services marketplace** | LIVESTOCK category (shearing, farrier, AI) | Underserved niche |
| **No exotic animal services** | EXOTIC category (birds, reptiles, small mammals) | Market gap |
| **No "add from platform" capability** | Breeders can pull animal data, health records, credentials | Tech advantage |
| **No unified animal services** | One platform for dogs, cats, horses, livestock, exotics | Cross-species |
| **Generic service listings** | Rich listings with featured animals, health data, breeding context | Data depth |

#### Strategic Positioning

**For Breeders:**
- "The only marketplace where your platform data enhances your services"
- Leverage existing animal profiles, health testing, breeding programs
- One account for breeding programs AND service offerings

**For Buyers:**
- "Find specialized services other platforms don't list"
- Working dog trainers, livestock services, exotic care
- Provider verification with breeding program data transparency

**For Service Providers:**
- "Reach animal owners existing platforms miss"
- Livestock owners, exotic pet owners, working dog enthusiasts
- Less competition in niche categories

---

## Section 6: Inquiries

**Route:** `/marketplace-manage/inquiries`

**Purpose:** Centralized message center for all marketplace inquiries.

### 6.1 Conversation List

| Column | Notes |
|--------|-------|
| Contact | Buyer name |
| Subject/Source | Listing title or "General Inquiry" |
| Last Message | Preview + timestamp |
| Unread | Badge if unread |

**Filters:**
- All / Unread
- Source type: Litter, Animal, Program, General

### 6.2 Conversation View

- Thread display (newest at bottom)
- Message input
- Mark as read (auto on view)
- Quick actions: Block user

### 6.3 Origin Info (Collapsed by default)

| Field | Notes |
|-------|-------|
| Source | Direct, UTM, Referrer |
| Page Path | Where they inquired from |
| Listing | Link to listing if applicable |

### Backend APIs

```
GET    /api/v1/marketplace/messages/threads
GET    /api/v1/marketplace/messages/threads/:id
POST   /api/v1/marketplace/messages/threads/:id/messages
```

---

## Section 7: Waitlist

**Route:** `/marketplace-manage/waitlist`

**Purpose:** Manage waitlist requests for breeding programs/litters.

### 7.1 Waitlist List View

| Column | Notes |
|--------|-------|
| Contact | Buyer name |
| Program | Which program they want |
| Status | Inquiry, Approved, Deposit Pending, etc. |
| Preferences | Sex, color prefs |
| Submitted | Date |
| Priority | Queue position |
| Actions | View, Update Status |

**Filters:**
- By program
- By status
- Search by name

### 7.2 Waitlist Entry Detail

| Section | Fields |
|---------|--------|
| Contact Info | Name, email, phone |
| Preferences | Species, breed, sex, dam/sire prefs |
| Status | Dropdown to update |
| Priority | Number input |
| Deposit Required | Currency |
| Deposit Paid | Currency |
| Notes | Internal notes |

**Actions:**
- Update Status
- Change Priority
- Mark Deposit Received
- Archive/Remove

### Backend APIs

```
GET    /api/v1/waitlist
GET    /api/v1/waitlist/:id
PATCH  /api/v1/waitlist/:id
DELETE /api/v1/waitlist/:id
```

**Note:** Need to verify these endpoints exist for breeder-side management.

---

## Section 8: Critical Marketplace Infrastructure

This section covers essential infrastructure requirements for the services marketplace that span beyond individual listing types. These are organized by priority for phased implementation.

---

### 8.1 Communication & Messaging (CRITICAL - Phase 1)

**Purpose:** Keep all service inquiry communication on-platform for safety, record-keeping, and conversion tracking.

#### 8.1.1 In-Platform Messaging Requirements

| Feature | Description | Priority |
|---------|-------------|----------|
| **Thread-based conversations** | Group messages by inquiry/booking | Critical |
| **Phone/email masking** | Hide contact info until booking confirmed | Critical |
| **Attachment support** | Images, PDFs (contracts, health records) | High |
| **Message templates** | Quick replies for common questions | Medium |
| **Read receipts** | Show when messages are read | Medium |
| **Response time tracking** | Measure and display avg response time | High |
| **Notification preferences** | Email, SMS, push settings per user | High |
| **Spam prevention** | Rate limiting, report spam button | Critical |
| **Translation** | Auto-translate for international users | Low (Phase 3) |

#### 8.1.2 Contact Information Reveal Policy

**When to reveal contact info:**
- ✅ After booking confirmed and paid
- ✅ After service provider accepts inquiry
- ✅ Never automatically before initial contact

**How to mask:**
- Provider email: `p-[hashed-id]@breederhq.com` (forwards to real email)
- Provider phone: Use Twilio masked numbers or "Contact via message" only
- Client info: Never shown until provider responds

#### 8.1.3 Messaging Schema

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

  // Linked to booking if created
  bookingId?: number;
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

#### 8.1.4 APIs

```
GET    /api/v1/messages/threads                    # List all threads
GET    /api/v1/messages/threads/:threadId          # Get thread with messages
POST   /api/v1/messages/threads                    # Create new thread (inquiry)
POST   /api/v1/messages/threads/:threadId/messages # Send message
PATCH  /api/v1/messages/threads/:threadId/archive  # Archive thread
POST   /api/v1/messages/threads/:threadId/block    # Block user
POST   /api/v1/messages/attachments                # Upload attachment
```

---

### 8.2 Payment & Transaction Processing (CRITICAL - Phase 1)

**Purpose:** Secure payment processing for service bookings with platform protection.

#### 8.2.1 Payment Flow Options

**Option A: Inquiry-Only (MVP - Phase 1)**
- Services are inquiry-only (no booking/payment on platform)
- Providers handle payment offline
- Platform focuses on lead generation
- **Pros:** Simple, no payment liability, faster MVP
- **Cons:** No transaction tracking, no revenue share, less trust

**Option B: Platform-Mediated Payments (Phase 2)**
- Payments processed through platform (Stripe Connect)
- Platform holds funds in escrow until service complete
- Platform takes commission (e.g., 10-15%)
- **Pros:** Trust, tracking, revenue, dispute resolution
- **Cons:** Complex, payment liability, requires escrow

**Option C: Hybrid (Recommended)**
- **Phase 1 MVP:** Inquiry-only (Option A)
- **Phase 2:** Add optional platform payments for providers who opt-in
- **Phase 3:** Require platform payments for all new providers

**Recommendation:** Start with Option A (inquiry-only), add Option B for select categories in Phase 2.

#### 8.2.2 Payment Infrastructure (Phase 2)

**Stripe Connect Setup:**

| Component | Purpose |
|-----------|---------|
| **Platform account** | BreederHQ main Stripe account |
| **Connected accounts** | Each service provider gets Stripe Express/Custom account |
| **Payment flow** | Client → Platform → Provider (minus commission) |
| **Escrow/holding** | Hold funds until service completed (configurable days) |
| **Payout schedule** | Daily, weekly, or monthly to providers |

**Payment Methods Supported:**
- ✅ Credit/Debit cards (Stripe)
- ✅ ACH bank transfer (Stripe)
- ✅ Apple Pay / Google Pay
- ⏸️ PayPal (Phase 3)
- ⏸️ Wire transfer (manual, for high-value services like horses)

#### 8.2.3 Pricing Models & Transaction Fees

| Payment Type | Platform Fee | Stripe Fee | Provider Receives |
|--------------|--------------|------------|-------------------|
| **Standard service** | 10% | 2.9% + $0.30 | 87.1% - $0.30 |
| **Stud service** | 5% | 2.9% + $0.30 | 92.1% - $0.30 |
| **High-value (>$5k)** | 3% | 2.9% + $0.30 | 94.1% - $0.30 |

**Breeder service listings:**
- Breeders already pay subscription → Lower commission (5% vs 10%)
- Incentive for breeders to use platform payments

#### 8.2.4 Refund & Cancellation Policies

**Cancellation Policies (like Airbnb):**

| Policy | Cancellation Window | Refund Amount |
|--------|---------------------|---------------|
| **Flexible** | Cancel up to 24 hours before | 100% refund |
| **Moderate** | Cancel up to 5 days before | 100% refund; <5 days = 50% |
| **Strict** | Cancel up to 14 days before | 100% refund; <14 days = 50%; <7 days = 0% |
| **No Refunds** | No cancellations | 0% refund (for deposits, contracts) |

**Provider sets policy per service listing.**

**Disputed Charges:**
- Client can dispute within 48 hours after service
- Platform reviews evidence from both parties
- Platform makes final decision on refund
- Stripe chargeback handling (platform absorbs if client wins)

#### 8.2.5 Invoicing & Tax Handling

**Auto-Generated Invoices:**
- PDF invoice sent to client after payment
- Includes: Service details, provider info, dates, payment breakdown, tax (if applicable)
- Provider dashboard shows all invoices

**1099 Generation (U.S. Only):**
- Automatically track provider earnings
- Generate 1099-K forms for providers earning >$600/year
- Send by January 31st
- Integrate with Stripe Tax or TaxJar

**Sales Tax:**
- Services generally not taxed, but varies by state
- Provider responsible for collecting/remitting tax
- Platform can facilitate with Stripe Tax (future)

#### 8.2.6 Booking Schema (Phase 2)

```typescript
interface ServiceBooking {
  id: number;
  listingId: number;
  providerId: number;
  clientId: number;
  threadId?: number;  // Link to message thread

  // Service details
  serviceDate: Date;
  serviceEndDate?: Date;
  serviceDuration?: number;  // minutes
  serviceLocation: string;
  serviceNotes?: string;

  // Pricing
  subtotalCents: number;
  platformFeeCents: number;
  stripeFeeCents: number;
  totalCents: number;

  // Payment
  paymentIntentId: string;  // Stripe Payment Intent
  paidAt?: Date;
  payoutScheduledAt?: Date;
  payoutCompletedAt?: Date;

  // Status
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed" | "refunded";
  cancellationReason?: string;
  cancelledBy?: "client" | "provider" | "platform";
  cancelledAt?: Date;

  // Cancellation policy
  cancellationPolicy: "flexible" | "moderate" | "strict" | "no_refunds";

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 8.3 Reviews & Reputation (CRITICAL - Phase 1)

**Purpose:** Build trust through authentic reviews from verified service transactions.

#### 8.3.1 Review Eligibility & Submission

**Who can review:**
- ✅ Clients who booked and completed a service (if payments on-platform)
- ✅ Clients who inquired and provider confirmed service happened (inquiry-only MVP)
- ❌ Anyone without a service transaction

**Review submission flow:**
- **Phase 1 (Inquiry-only):** Provider can mark inquiry as "Service Completed" → triggers review request to client
- **Phase 2 (Payments):** Automatic review request 24 hours after service date

**Review window:**
- Client has 30 days after service to leave review
- After 30 days, option expires

#### 8.3.2 Review Structure

```typescript
interface ServiceReview {
  id: number;
  listingId: number;
  providerId: number;
  clientId: number;
  bookingId?: number;

  // Ratings (1-5 stars)
  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  valueRating: number;

  // Content
  reviewText: string;
  photos: string[];  // Up to 5 photos

  // Response
  providerResponse?: string;
  respondedAt?: Date;

  // Moderation
  status: "pending" | "approved" | "flagged" | "removed";
  moderatedBy?: number;
  moderatedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

#### 8.3.3 Rating Breakdown Display

**Provider listing shows:**
- Overall rating (weighted average of all reviews)
- Total review count
- Rating distribution (5★: 80%, 4★: 15%, 3★: 3%, 2★: 1%, 1★: 1%)
- Subcategory ratings: Communication, Quality, Value

**Example display:**
```
⭐ 4.9 (127 reviews)

Communication  ⭐⭐⭐⭐⭐ 4.9
Quality        ⭐⭐⭐⭐⭐ 5.0
Value          ⭐⭐⭐⭐☆ 4.8

──────────────────────
5★ ████████████ 80%
4★ ███ 15%
3★ █ 3%
2★ 1%
1★ 1%
```

#### 8.3.4 Review Moderation Policy

**Auto-approve if:**
- No profanity
- No email/phone numbers
- No external links
- Length between 20-2000 characters

**Flag for manual review if:**
- Contains contact info
- All caps / excessive punctuation
- Mentions competitor names
- Contains personal attacks
- Suspiciously positive (5★ with generic text)

**Removal grounds:**
- Profanity, hate speech, threats
- Fake review (verified)
- Posted by provider's competitor
- Contains identifying info that violates privacy
- Client admits never used service

**Provider response to reviews:**
- ✅ Allowed for all reviews
- 500 character limit
- One response per review
- Cannot edit after posted (prevents gaming)

#### 8.3.5 Photo Reviews

**Encourage photo reviews:**
- "Show your work" CTA in review flow
- Badge for providers with 10+ photo reviews
- Photo reviews ranked higher in search
- Up to 5 photos per review
- Auto-resize to 1200px max width

---

### 8.4 Trust & Safety (CRITICAL - Phase 1)

**Purpose:** Protect users through verification, safety checks, and clear policies.

#### 8.4.1 Verification Levels

**Tier 1: Basic Verification (Required for all)**
| Check | Method | Who Pays |
|-------|--------|----------|
| Email verification | Email link | Free |
| Phone verification | SMS code | Free |
| Identity verification | ID upload + selfie (Persona/Stripe Identity) | Platform absorbs |

**Tier 2: Professional Verification (Required for licensed professionals)**
| Check | Method | Who Pays |
|-------|--------|----------|
| Business license | Document upload + manual review | Provider |
| Professional certification | Cert upload + verification call | Provider |
| Liability insurance | Certificate of insurance upload | Provider |

**Tier 3: Background Check (Required for care/boarding/home services)**
| Check | Method | Who Pays |
|-------|--------|----------|
| Criminal background check | Checkr API | Provider ($35) |
| Sex offender registry | Automatic via Checkr | Included |
| Driving record | For transport services | Provider ($15) |

**Renewal:**
- Background checks: Every 2 years
- Insurance certificates: Verify annually
- Professional licenses: Verify at renewal date

#### 8.4.2 Prohibited Services

**Not allowed on platform:**
- ❌ Illegal activities (dog fighting, unlicensed vet care)
- ❌ Services involving animal abuse/neglect
- ❌ Unlicensed medical procedures
- ❌ Sale of prescription medications
- ❌ Services that violate local/state laws (e.g., pit bull bans)
- ❌ Services involving endangered species without permits

#### 8.4.3 Reporting & Moderation

**Report button on every listing:**
- Fake listing / scam
- Inappropriate content
- Prohibited service
- Animal welfare concern
- Unsafe conditions

**Review queue for moderators:**
- All reports go to admin dashboard
- Moderator reviews within 24 hours
- Actions: Approve, Flag, Remove listing, Suspend user, Ban permanently

**Three-strike policy:**
- Strike 1: Warning + listing removed
- Strike 2: 30-day suspension
- Strike 3: Permanent ban

**Immediate ban for:**
- Fraud / payment scams
- Verified animal abuse
- Harassment / threats
- Repeated policy violations

#### 8.4.4 Incident Reporting System

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
  evidence: string[];  // URLs to screenshots/photos

  status: "pending" | "under_review" | "resolved" | "dismissed";
  moderatorId?: number;
  moderatorNotes?: string;

  actionTaken?: "none" | "warning" | "listing_removed" | "user_suspended" | "user_banned";

  createdAt: Date;
  resolvedAt?: Date;
}
```

---

### 8.5 Insurance & Liability (HIGH PRIORITY - Phase 2)

**Purpose:** Protect platform, providers, and clients through insurance requirements and clear liability terms.

#### 8.5.1 Platform Liability

**BreederHQ Terms of Service must state:**
- Platform is a marketplace/listing service only
- Platform does not provide services directly
- Platform does not guarantee quality of services
- Platform is not liable for injuries, damages, or losses from services
- Users agree to hold platform harmless

**Platform insurance (BreederHQ needs):**
- General liability insurance ($2M minimum)
- Errors & omissions insurance
- Cyber liability insurance (data breach protection)

#### 8.5.2 Provider Insurance Requirements

**Required for specific categories:**

| Service Category | Insurance Required | Minimum Coverage |
|------------------|-------------------|------------------|
| **Boarding / Care** | General liability | $1M |
| **Transport** | Commercial auto + liability | $1M auto, $500k liability |
| **Training (in-home)** | General liability | $500k |
| **Veterinary** | Professional liability (malpractice) | $1M |
| **Grooming** | General liability | $500k |
| **Working Dog Training** | General liability | $500k |

**Not required for:**
- Stud services (covered by breeding contract)
- Photography / Creative services
- Products

**Insurance verification:**
- Provider uploads Certificate of Insurance (COI)
- Manual review by admin
- Annual renewal required
- Auto-disable listing if insurance expires

#### 8.5.3 Insurance Partnerships (Phase 3)

**Offer insurance through platform:**
- Partner with pet business insurance providers (e.g., Pet Sitters Associates, Business Insurers of the Carolinas)
- Discounted group rates for BreederHQ providers
- Seamless COI upload integration
- Revenue share with insurance partner

---

### 8.6 Booking & Scheduling System (HIGH PRIORITY - Phase 2)

**Purpose:** Enable direct booking with calendar management and scheduling automation.

#### 8.6.1 Booking Flow Options

**Option 1: Inquiry-Only (Phase 1 MVP)**
- All services are inquiry-based
- Client sends message, provider responds
- Booking happens offline
- **Pros:** Simple, no scheduling complexity
- **Cons:** No conversion tracking, manual coordination

**Option 2: Instant Booking (Phase 2)**
- Provider sets availability calendar
- Client can book instantly if slots available
- Auto-confirmation email sent
- **Pros:** High conversion, reduced friction
- **Cons:** Requires calendar system, provider may not want instant

**Option 3: Hybrid - Request to Book (Recommended)**
- Client selects desired date/time
- Provider must approve within 24 hours
- If approved, booking confirmed + payment processed
- **Pros:** Balance of control and convenience
- **Cons:** Slightly lower conversion than instant

**Recommendation:** Phase 1 = Inquiry-only, Phase 2 = Request to Book, Phase 3 = Add Instant Booking option

#### 8.6.2 Calendar Integration

**Availability Management:**
- Provider sets recurring availability (e.g., "Mon-Fri 9am-5pm")
- Provider can block off specific dates (vacation, booked elsewhere)
- Sync with external calendars (Google Calendar, Outlook) via iCal feed
- Buffer time between appointments (e.g., 30 min travel time)

**Calendar sync options:**
- **One-way sync:** BreederHQ → Google Calendar (export bookings)
- **Two-way sync (Phase 3):** Google Calendar ↔ BreederHQ (sync availability)

#### 8.6.3 Cancellation & Rescheduling Policies

**Cancellation policy per service:**
- Provider sets policy: Flexible, Moderate, Strict, No Refunds (see 8.2.4)
- Displayed prominently on listing
- Client must accept policy before booking

**Rescheduling:**
- Client can request reschedule up to X days before (per policy)
- Provider must approve reschedule
- One free reschedule, additional reschedules = $X fee (optional)

**No-show policies:**
- If client doesn't show up and doesn't cancel: Provider keeps full payment
- If provider doesn't show up: Client gets 100% refund + $X credit

#### 8.6.4 Waitlist Functionality (Phase 3)

**For popular providers:**
- If no availability, client can join waitlist
- Auto-notify if slot opens up (cancellation)
- Waitlist priority: First-come-first-served

---

### 8.7 Search & Discovery (Technical) (MEDIUM PRIORITY - Phase 2)

**Purpose:** Optimize search ranking and discoverability to connect clients with relevant services.

#### 8.7.1 Search Ranking Algorithm

**Recommended (default sort) formula:**

```
Score = (Rating × 10) × (ReviewCount ^ 0.3) × ResponseTimeFactor × RecencyBoost / DistanceFactor

Where:
- Rating: 1-5 stars
- ReviewCount: Total reviews (diminishing returns via ^0.3)
- ResponseTimeFactor: 2.0 if <2hr, 1.5 if <6hr, 1.0 if <24hr, 0.5 if >24hr
- RecencyBoost: 1.2 if listing <30 days old
- DistanceFactor: 1.0 if <10mi, 1.5 if 10-25mi, 2.0 if 25-50mi, 3.0 if >50mi
```

**Example:**
- Provider A: 4.8★, 120 reviews, <2hr response, 15mi away
  - Score = (4.8 × 10) × (120 ^ 0.3) × 2.0 × 1.0 / 1.5 = **299**

- Provider B: 5.0★, 12 reviews, <6hr response, 5mi away
  - Score = (5.0 × 10) × (12 ^ 0.3) × 1.5 × 1.0 / 1.0 = **162**

**Provider A ranks higher** (more reviews outweighs slightly lower rating)

#### 8.7.2 Promoted Listings (Phase 3 - Revenue)

**Pay-per-click or subscription model:**
- Providers pay to appear at top of search results
- "Promoted" badge shown
- Rotated fairly (no permanent top spot)
- Cost: $0.50 per click or $50/month subscription

**Featured badge:**
- Pay $20/month for "Featured" badge on listing
- Featured listings ranked slightly higher in search (1.2× boost)

#### 8.7.3 SEO Optimization

**Service listing pages:**
- Schema.org `LocalBusiness` or `Service` markup
- Dynamic meta titles: "[Service] in [City] - [Provider Name] - BreederHQ"
- Meta descriptions: First 160 chars of description + rating
- Open Graph tags for social sharing
- Sitemap.xml with all public service listings

#### 8.7.4 Marketing & Notifications

**Email digests:**
- "New [category] services near you" (weekly)
- "Still looking for [saved search]?" (if no action in 7 days)

**Push notifications (mobile app):**
- "New groomer within 5 miles of you"
- "[Provider] responded to your inquiry"

**Retargeting:**
- Track listings viewed but not inquired
- Show those listings in ads (Facebook, Google Display)

---

### 8.8 Provider Success Tools (MEDIUM PRIORITY - Phase 2-3)

**Purpose:** Help providers optimize listings and grow their business on the platform.

#### 8.8.1 Onboarding Checklist

**New provider sees checklist:**
- ✅ Add profile photo (20% more inquiries)
- ✅ Upload 5+ service photos (30% more inquiries)
- ✅ Write detailed description (200+ words)
- ✅ Set competitive pricing (see average: $X-Y)
- ✅ Verify identity (required for listing)
- ✅ Set up payment info (optional - Phase 2)

**Progress bar:** "Your listing is 60% complete. Finish setup to go live."

#### 8.8.2 Profile Optimization Tips

**Dynamic suggestions:**
- "Add more photos to get 2× more views"
- "Providers who respond within 2 hours get 3× more bookings"
- "Lower your price by $10 to match competitors in your area"

**Competitor insights:**
- "Similar [service] providers in [city] charge $X-Y"
- "You're priced 20% above average - consider lowering"

#### 8.8.3 Analytics Dashboard

**Provider-facing analytics:**

| Metric | Description |
|--------|-------------|
| **Views** | Listing page views |
| **Inquiries** | Messages received |
| **Conversion rate** | Inquiries → bookings |
| **Response time** | Avg time to first response |
| **Booking value** | Total revenue (if payments on-platform) |
| **Peak inquiry times** | "Most inquiries: Tuesdays 2-5pm" |
| **Seasonal trends** | "Bookings up 30% in December" |

**Compare to similar providers:**
- "Your response time: 4 hours (Average: 2 hours)"
- "Your price: $75 (Average: $65)"

#### 8.8.4 Referral Program (Phase 3)

**Provider referral rewards:**
- Refer another provider → Get $50 credit or 1 month free featured listing
- Referred provider must complete 3 bookings

---

### 8.9 Legal & Compliance (CRITICAL - Phase 1)

**Purpose:** Ensure platform operates legally and users understand terms.

#### 8.9.1 Legal Documents Required

| Document | Purpose | Last Updated |
|----------|---------|--------------|
| **Terms of Service** | Platform usage rules for clients & providers | Before launch |
| **Privacy Policy** | Data collection, storage, usage (GDPR, CCPA) | Before launch |
| **Cookie Policy** | Cookie usage + consent banner (GDPR) | Before launch |
| **Service Provider Agreement** | Terms for providers listing services | Before launch |
| **Cancellation & Refund Policy** | Rules for cancellations, refunds (per 8.2.4) | Before launch |
| **Acceptable Use Policy** | Prohibited conduct, content | Before launch |
| **DMCA Policy** | Copyright infringement reporting | Before launch |

**All must be:**
- Reviewed by attorney (specialized in marketplace law)
- Updated annually
- Version-controlled (users agree to specific version)

#### 8.9.2 Privacy & Data Compliance

**GDPR (EU users):**
- Cookie consent banner (required)
- Right to access data (user dashboard export)
- Right to deletion (delete account = anonymize data)
- Data processing agreements with vendors (Stripe, AWS)

**CCPA (California users):**
- "Do Not Sell My Personal Information" link in footer
- Data disclosure upon request
- Opt-out of data sharing with third parties

**Data retention:**
- Active accounts: Indefinite
- Deleted accounts: 30-day soft delete, then anonymize
- Messages: Retain for 7 years (legal disputes)
- Payments: Retain for 7 years (IRS requirement)

#### 8.9.3 Animal-Specific Regulations

**USDA Licensing:**
- Required for breeders selling across state lines
- NOT required for service providers (training, grooming, etc.)
- BreederHQ not responsible for provider compliance

**APHIS Regulations (Interstate Transport):**
- Health certificates required for interstate animal transport
- Provider must ensure compliance
- Platform displays reminder in transport listings

**Species-Specific Laws:**
- Some states ban certain breeds (e.g., pit bulls)
- Some states require permits for exotic animals
- Platform shows state-specific warnings

**Liability disclaimer:**
- "Providers are solely responsible for complying with federal, state, and local laws."

#### 8.9.4 Age & Geographic Restrictions

**Age restrictions:**
- Minimum 18 years old to provide services
- Minors can book services with parent/guardian approval

**Geographic restrictions:**
- U.S. only for Phase 1
- Canada in Phase 2 (different payment/legal requirements)
- International in Phase 3

---

### 8.10 Multi-Species Considerations (MEDIUM PRIORITY)

**Purpose:** Support diverse species beyond dogs with species-appropriate features.

#### 8.10.1 Species-Specific Requirements

| Species | Special Requirements |
|---------|---------------------|
| **Dogs** | Breed restrictions (dangerous breeds in some states) |
| **Cats** | FeLV/FIV testing for boarding |
| **Horses** | Coggins test (equine infectious anemia), health certificates |
| **Livestock** | Brand inspection (cattle), scrapie tags (sheep/goats), USDA transport rules |
| **Birds** | NPIP certification (avian influenza testing), CITES permits (endangered species) |
| **Reptiles** | Permits for venomous species, CITES for protected species |

**Platform approach:**
- Provider indicates species accepted per service
- Species-specific requirements shown as checklist
- Provider responsible for compliance (platform reminder only)

#### 8.10.2 Health Certificate Requirements

**For interstate transport:**
- Certificate of Veterinary Inspection (CVI) required
- Issued within 30 days of transport
- Provider and client both need copy

**Platform feature (Phase 2):**
- Document upload for health certificates
- Auto-reminder 7 days before service: "Have you obtained health certificate?"

#### 8.10.3 Species Expertise Badges

**Display provider specialization:**
- "Dog Specialist" (90%+ services for dogs)
- "Equine Specialist" (90%+ services for horses)
- "Multi-Species Expert" (services across 3+ species groups)

#### 8.10.4 Species Filters

**Browse page filters:**
- Primary species: Dogs, Cats, Horses, Livestock, Birds, Reptiles, Small Mammals, Other
- Multi-select: Find providers who work with multiple species

---

### 8.11 Breeder-Specific Features (HIGH PRIORITY - Phase 1)

**Purpose:** Leverage existing breeding program data to enhance service listings.

#### 8.11.1 Link Service to Breeding Program

**Service listing can link to breeding program:**
- "This service is offered by [Sunny Acres Goldens Breeding Program]"
- Clickable link to program page
- Service listings show on program page sidebar: "Services We Offer"

**Benefits:**
- Cross-promotion (puppy buyers see available services)
- Enhanced credibility (breeding program trust transfers)

#### 8.11.2 Puppy Buyer Perks

**Breeder can offer discounts to puppy buyers:**
- "10% off training for puppies from our program"
- Verified via breeding program → offspring placement link
- Discount code auto-applied if buyer email matches placement record

**Example:**
- Buyer purchases Golden Retriever puppy from Sunny Acres
- Sunny Acres offers training services
- Buyer automatically eligible for "Alumni discount"

#### 8.11.3 Health Testing Display on Stud Services

**STUD_SERVICE listings can pull animal health data:**
- OFA hips/elbows/heart
- Genetic testing (Embark, Paw Print)
- Eye clearances (CERF/CAER)
- All pulled from Animal record → no duplicate entry

**Display on service listing:**
```
──────────────────────────────────────
FEATURED STUD: Duke (Golden Retriever)

Health Testing (verified from platform):
✓ OFA Hips: Excellent
✓ OFA Elbows: Normal
✓ OFA Heart: Normal
✓ Embark: Clear for 200+ conditions
✓ CERF/CAER: Clear (2024)
✓ PennHIP: 0.28/0.32

[View Full Animal Profile →]
──────────────────────────────────────
```

#### 8.11.4 Co-Breeder Services

**Multiple breeders collaborate on service:**
- Example: Two breeders jointly offer "New Breeder Mentorship Program"
- Both listed as providers
- Revenue split configurable

---

### 8.12 Internationalization (LOW PRIORITY - Phase 3)

**Purpose:** Expand platform to international users.

#### 8.12.1 Multi-Language Support

**Supported languages (Phase 3):**
- English (default)
- Spanish (U.S. + Latin America)
- French (Canada)
- German, Dutch (Europe - later)

**Translation approach:**
- UI strings: i18n JSON files
- User-generated content: Auto-translate via Google Translate API (with "See original" toggle)
- Provider can provide translations for their listing (manual)

#### 8.12.2 Currency & Payments

**Multi-currency display:**
- Detect user location → show prices in local currency
- Exchange rates updated daily
- Provider sets price in their currency
- Payments processed in provider's currency (Stripe handles conversion)

**Example:**
- Provider in U.S. lists service at $100 USD
- Canadian buyer sees "~$135 CAD" (converted)
- Payment processes in USD, buyer's bank converts

#### 8.12.3 Time Zones & Date Formats

**Timezone handling:**
- Provider sets timezone for availability
- Client sees availability in their timezone
- Booking confirmation shows both timezones

**Date formats:**
- U.S.: MM/DD/YYYY
- International: DD/MM/YYYY
- Detect based on user location

**Distance units:**
- U.S.: Miles
- International: Kilometers
- Toggle in settings

---

### 8.13 Implementation Roadmap

**Phase 1 (MVP Launch) - Critical Features:**
- ✅ Service listings (Sections 5.1-5.13)
- ✅ In-platform messaging (8.1)
- ✅ Basic reviews (8.3.1-8.3.3)
- ✅ Trust & safety (8.4.1-8.4.3)
- ✅ Legal docs (8.9.1)
- ✅ Inquiry-only (no payments/booking)

**Phase 2 (6-12 months) - Payments & Booking:**
- ✅ Payment processing (8.2)
- ✅ Booking system (8.6)
- ✅ Review moderation (8.3.4)
- ✅ Insurance verification (8.5)
- ✅ Search ranking (8.7.1)
- ✅ Provider analytics (8.8.3)

**Phase 3 (12-24 months) - Growth Features:**
- ✅ Promoted listings (8.7.2)
- ✅ Referral program (8.8.4)
- ✅ Internationalization (8.12)
- ✅ Advanced calendar sync (8.6.2)
- ✅ Insurance partnerships (8.5.3)

---

## Navigation Design

### Primary Nav (Sidebar or Tabs)

```
Marketplace Manager
├── Storefront        [icon: store]
├── Programs          [icon: layers]
├── Animals           [icon: paw]
├── Litters           [icon: users]
├── Services          [icon: briefcase]
├── Inquiries         [icon: message-circle] [unread badge]
└── Waitlist          [icon: list]
```

### Status Indicators

- **Published/Live:** Green dot
- **Draft:** Gray dot
- **Paused:** Yellow dot
- **Unread count:** Red badge on Inquiries

---

## Implementation Phases

### Phase 1: Core Listings (MVP)
- [ ] Portal shell & navigation
- [ ] Animal Listings (full CRUD) - API ready!
- [ ] Service Listings (full CRUD) - API ready!
- [ ] Basic storefront (profile)

### Phase 2: Programs & Litters
- [ ] Breeding Programs with media
- [ ] Litter listings with offspring controls
- [ ] Program → Plan connection display

### Phase 3: Communication
- [ ] Inquiries message center
- [ ] Waitlist management

### Phase 4: Polish
- [ ] Analytics/stats
- [ ] Bulk operations
- [ ] Preview modes

---

## Backend Gaps to Address

| Gap | Priority | Notes |
|-----|----------|-------|
| List all animal listings for tenant | High | Need endpoint or filter |
| Offspring group listing fields CRUD | Medium | May need enhancement |
| Bulk offspring marketplace update | Medium | Convenience feature |
| Waitlist breeder-side management | Medium | Verify endpoints |
| Program upcoming/available aggregation | Low | Can compute client-side initially |

---

## Open Questions

1. **Route structure:** `/marketplace-manage/*` or `/me/marketplace/*` or other?
2. **Standalone app or integrated?** New app in monorepo or add to existing?
3. **Mobile considerations:** Responsive or desktop-first?
4. **Image upload:** Use existing asset upload or new component?

---

## Appendix: Related Files

### Frontend (existing, for reference)
- [ProgramsSettingsPage.tsx](apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx)
- [ServicesSettingsPage.tsx](apps/marketplace/src/management/pages/ServicesSettingsPage.tsx)
- [MarketplaceRoutes.tsx](apps/marketplace/src/routes/MarketplaceRoutes.tsx)

### Backend APIs
- [breeding-programs.ts](breederhq-api/src/routes/breeding-programs.ts) - Program CRUD + media
- [breeder-services.ts](breederhq-api/src/routes/breeder-services.ts) - Service CRUD
- [animals.ts:1524-1758](breederhq-api/src/routes/animals.ts#L1524) - Animal listing CRUD
- [marketplace-profile.ts](breederhq-api/src/routes/marketplace-profile.ts) - Profile management
- [public-marketplace.ts](breederhq-api/src/routes/public-marketplace.ts) - Public browse APIs
