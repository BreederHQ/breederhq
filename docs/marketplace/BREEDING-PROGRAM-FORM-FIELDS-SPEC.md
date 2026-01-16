# Breeding Program Create/Edit Form - Complete Field Specification

> **For:** Frontend Engineer
> **Purpose:** Complete list of all fields, controls, and data elements required for the Breeding Program create/edit form
> **Current State:** Only 3 fields implemented (Program Name, Description, 3 checkboxes)
> **Target State:** Full v2 specification with all required fields

**Last Updated:** 2026-01-13

---

## Overview

The current Breeding Program form only captures:
- ✅ Program Name
- ✅ Description
- ✅ Accept inquiries (checkbox)
- ✅ Open waitlist (checkbox)
- ✅ Coming soon (checkbox)

**Missing:** Species/Breed selection, Media management, Featured Parents, Raising Protocols, Placement Package, Pricing, and all visibility toggles.

---

## Complete Form Structure

### Section 1: Program Identity (REQUIRED)

| Field Name | Type | Required | Default | Validation | Notes |
|-----------|------|----------|---------|------------|-------|
| **Program Name** | Text Input | ✅ YES | - | Max 100 chars | Currently implemented |
| **Species** | Dropdown | ✅ YES | - | Must match tenant species | Dogs, Cats, Horses, etc. |
| **Breed** | Dropdown/Autocomplete | ✅ YES | - | Must be valid breed for species | Filtered by species selection |
| **Description** | Textarea | ❌ NO | - | Max 500 chars | Short description (currently implemented) |
| **Program Story** | Rich Text Editor | ❌ NO | - | Max 5000 chars | Long-form story (NEW) |

**Species Options** (from tenant enabled species):
- Dogs
- Cats
- Horses
- Cattle
- Pigs
- Sheep
- Goats
- Camelids (Alpacas/Llamas)
- Rabbits
- Poultry
- Other

**Breed Selection:**
- Dropdown filtered by selected species
- Autocomplete search for large breed lists
- "Mixed Breed" option
- "Designer Breed" option (for Dogs - e.g., Goldendoodle)

---

### Section 2: Media Management

#### Cover Image

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Cover Image** | Image Upload | ❌ NO | - | Primary program photo |
| **Cover Image Visibility** | Toggle | - | Visible | Show/hide cover image |

**Cover Image Requirements:**
- Min: 800x600px
- Max: 4MB
- Formats: JPG, PNG, WebP
- Aspect ratio: 16:9 recommended

#### Gallery Images

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Gallery Images** | Multi-Image Upload | ❌ NO | - | Up to 20 images |
| **Per-Image Visibility** | Toggle (per image) | - | Visible | Show/hide individual images |
| **Image Reordering** | Drag-to-Reorder | - | Upload order | Control display order |

**Gallery Image Requirements:**
- Same as cover image
- Display order matters (drag-to-reorder)
- Each image has individual visibility toggle

#### Video Links

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Video URL** | URL Input (repeatable) | ❌ NO | - | YouTube or Vimeo |
| **Video Title** | Text Input | ❌ NO | - | Display title |
| **Per-Video Visibility** | Toggle (per video) | - | Visible | Show/hide individual videos |

**Video Requirements:**
- YouTube or Vimeo embeds only
- Extract thumbnail from embed
- Validate URL format

---

### Section 3: Featured Parents

**UI Pattern:** Multi-select from eligible animals + drag-to-reorder

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Featured Parents** | Animal Multi-Select | ❌ NO | None | Select from roster |
| **Display Order** | Drag-to-Reorder | - | Selection order | Control parent display order |

**Featured Parents Selection:**
- Show animals where:
  - Species matches program species
  - Breed matches program breed (or parents of breed for designer breeds)
  - Animal privacy ≠ Private
  - Animal has public photo
- Display: Photo thumbnail + Name + Sex + Age
- Multi-select (dams and sires)
- Drag to reorder selected parents
- "Manage [Animal Name]'s Public Profile →" link for each selected parent

**Important Note:**
The data that appears for each featured parent (health tests, genetics, pedigree, etc.) is controlled on the **Animal record itself** in the Animals module, NOT in the program form. This form only controls WHICH animals are featured and their display order.

---

### Section 4: Raising Protocols

**UI Pattern:** Inherit from Storefront OR Override with program-specific protocols

#### Master Control

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Use Storefront Defaults** | Toggle | - | ON | Inherit vs override |

**When Toggle = ON (Default):**
- Display storefront protocols (read-only)
- Show "Edit Storefront Defaults →" link
- Gray out custom protocol fields

**When Toggle = OFF:**
- Enable custom protocol entry below
- Program-specific protocols override storefront

#### Custom Protocol Entry (Only if toggle = OFF)

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Protocol Tags** | Multi-Select Tags | ❌ NO | - | Species-aware suggestions + custom |
| **Protocol Details** | Textarea | ❌ NO | - | Free-form description |
| **Per-Tag Visibility** | Toggle (per tag) | - | Visible | Show/hide individual protocol tags |

**Species-Aware Protocol Suggestions:**

**Dogs:**
- Early Neurological Stimulation (ENS)
- Early Scent Introduction (ESI)
- Puppy Culture
- Avidog
- Badass Breeder (BAB)
- Rule of 7s
- Volhard Puppy Aptitude Testing
- Crate Training
- Leash Introduction
- Sound Desensitization
- Socialization with Children
- Exposure to Other Pets
- Car Ride Training
- Grooming Desensitization

**Cats:**
- Litter Training
- Handling & Socialization
- Indoor/Outdoor Transition
- Nail Trim Training
- Carrier Training

**Horses:**
- Halter Breaking
- Leading
- Hoof Handling
- Trailer Loading
- Imprint Training (foals)
- Grooming
- Tying
- Clipping Desensitization

**Goats/Sheep:**
- Bottle-raised
- Dam-raised
- Disbudding (goats)
- Hoof Care
- Halter Training
- Show Conditioning
- Lead Training

**Camelids (Alpacas/Llamas):**
- Halter Training
- Shearing Conditioning
- Herd Socialization
- Leading
- Nail Trimming
- Show Training

**Rabbits:**
- Handling
- Nail Trims
- Grooming
- Show Posing
- Cage Training

**Poultry:**
- Brooder Protocols
- Handling
- Show Conditioning
- Coop Training

**Custom Entry:** Breeder can add protocols not in suggestions

---

### Section 5: Placement Package

**UI Pattern:** Same as Raising Protocols - Inherit OR Override

#### Master Control

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Use Storefront Defaults** | Toggle | - | ON | Inherit vs override |

**When Toggle = ON (Default):**
- Display storefront package (read-only)
- Show "Edit Storefront Defaults →" link
- Gray out custom package fields

**When Toggle = OFF:**
- Enable custom package entry below
- Program-specific package overrides storefront

#### Custom Package Entry (Only if toggle = OFF)

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Included Items** | Multi-Select Tags | ❌ NO | - | Suggestions + custom |
| **Health Guarantee** | Textarea | ❌ NO | - | Guarantee details |
| **Package Details** | Textarea | ❌ NO | - | Additional details |
| **Per-Item Visibility** | Toggle (per item) | - | Visible | Show/hide individual items |

**Suggested Included Items:**
- Starter Food (3-7 days supply)
- Health Records
- Vaccination Records
- Deworming Records
- Registration Papers
- Microchip
- Contract
- Health Guarantee Documentation
- Comfort Item (blanket/toy with scent)
- Training Resources
- Breeder Support (email/phone)
- Lifetime Breeder Support
- First Vet Visit (paid/scheduled)
- Pet Insurance Trial
- Food/Care Instructions
- Socialization Log
- Parent Health Certificates
- Pedigree Certificate

**Custom Entry:** Breeder can add items not in suggestions

---

### Section 6: Pricing

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Pet Price (Single)** | Currency Input | ❌ NO | - | Single price OR range |
| **Pet Price Range Min** | Currency Input | ❌ NO | - | If using range |
| **Pet Price Range Max** | Currency Input | ❌ NO | - | If using range |
| **Breeding Rights Price (Single)** | Currency Input | ❌ NO | - | Single price OR range |
| **Breeding Rights Range Min** | Currency Input | ❌ NO | - | If using range |
| **Breeding Rights Range Max** | Currency Input | ❌ NO | - | If using range |
| **Show Quality Price (Single)** | Currency Input | ❌ NO | - | Single price OR range |
| **Show Quality Range Min** | Currency Input | ❌ NO | - | If using range |
| **Show Quality Range Max** | Currency Input | ❌ NO | - | If using range |
| **What's Included** | Textarea | ❌ NO | - | Pricing details/notes |
| **Typical Wait Time** | Text Input | ❌ NO | - | "3-6 months", "1 year", etc. |

**Pricing Display Options:**
- Single fixed price: "$2,500"
- Range: "$2,000 - $3,000"
- Empty = "Contact for pricing"

**Per-Tier Visibility Toggles:**
- Show/hide Pet pricing
- Show/hide Breeding Rights pricing
- Show/hide Show Quality pricing
- Show/hide What's Included
- Show/hide Wait Time

**Validation:**
- If range: min < max
- Prices must be positive integers (stored as cents)
- Currency symbol based on tenant currency setting

---

### Section 7: Program Settings (Functionality Toggles)

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Accept Inquiries** | Checkbox | - | ON | Enable inquiry button | ✅ Currently implemented |
| **Open Waitlist** | Checkbox | - | OFF | Enable waitlist signup | ✅ Currently implemented |
| **Accept Reservations** | Checkbox | - | OFF | Enable reservation deposits |
| **Coming Soon** | Checkbox | - | OFF | Show "Coming Soon" badge | ✅ Currently implemented |
| **Listed on Marketplace** | Checkbox | - | OFF | Appear in browse/search |

**Notes:**
- Accept Inquiries = Show "Contact Breeder" button on program page
- Open Waitlist = Show "Join Waitlist" button on program page
- Accept Reservations = Allow paid deposits for waitlist (requires Stripe)
- Coming Soon = Display "Coming Soon" badge (no available litters yet)
- Listed on Marketplace = Appear in public browse/search results

---

### Section 8: Publishing Controls

| Field Name | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| **Published** | Toggle/Button | - | OFF | Program visible on marketplace |
| **Publishing Status Display** | Read-only | - | Draft | Shows: Draft, Published, Unpublished |
| **Published Date** | Read-only | - | - | When first published |
| **Last Updated** | Read-only | - | Auto | Last edit timestamp |

**Publishing States:**
- **Draft:** Not visible on marketplace (default for new programs)
- **Published:** Visible on marketplace
- **Unpublished:** Was published, now hidden (keeps data)

**Actions:**
- **Publish** (if Draft or Unpublished) - Make live on marketplace
- **Unpublish** (if Published) - Hide from marketplace (keeps data)
- **Save Draft** (any state) - Save changes without publishing

---

## Complete Form Layout Mockup

```
┌─────────────────────────────────────────────────────────────────────┐
│  CREATE BREEDING PROGRAM                              [Cancel] [Save]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PROGRAM IDENTITY                                                   │
│  ───────────────────────────────────────────────────────────────   │
│  Program Name *                                                     │
│  [Tattooine Woomp Rats                                         ]   │
│                                                                     │
│  Species *                 Breed *                                  │
│  [Dogs ▼            ]     [Rat Terrier ▼                      ]   │
│                                                                     │
│  Description                                                        │
│  [Best little buggers you'll find!                             ]   │
│  [                                                               ]   │
│  500 characters remaining                                           │
│                                                                     │
│  Program Story (optional)                                           │
│  [Rich text editor with formatting toolbar]                        │
│  [Tell buyers about your program, breeding philosophy,         ]   │
│  [what makes your animals special...                           ]   │
│  5000 characters remaining                                          │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  MEDIA                                                              │
│  ───────────────────────────────────────────────────────────────   │
│  Cover Image                                                        │
│  [Upload Image]  or drag & drop                                    │
│  ☑ Show cover image on public listing                              │
│                                                                     │
│  Gallery Images (0/20)                                              │
│  [Upload Images]  or drag & drop                                   │
│  [Preview thumbnails with drag handles and visibility toggles]     │
│                                                                     │
│  Video Links                                                        │
│  [+ Add Video]                                                      │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  FEATURED PARENTS                                                   │
│  ───────────────────────────────────────────────────────────────   │
│  [Select Animals to Feature ▼]                                     │
│                                                                     │
│  Selected (0):                                                      │
│  [Drag to reorder]                                                  │
│  [Animal cards with reorder handles appear here]                   │
│                                                                     │
│  Note: Health tests, genetics, and other data shown for each       │
│  parent is controlled on their individual Animal profile.          │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  RAISING PROTOCOLS                                                  │
│  ───────────────────────────────────────────────────────────────   │
│  ☑ Use Storefront defaults          [Edit Storefront Defaults →]  │
│                                                                     │
│  [ If toggled OFF, show custom protocol entry fields ]             │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  PLACEMENT PACKAGE                                                  │
│  ───────────────────────────────────────────────────────────────   │
│  ☑ Use Storefront defaults          [Edit Storefront Defaults →]  │
│                                                                     │
│  [ If toggled OFF, show custom package entry fields ]              │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  PRICING                                                            │
│  ───────────────────────────────────────────────────────────────   │
│  Pet Pricing                                                        │
│  ○ Single Price   ● Price Range   ○ Contact for Pricing            │
│  Min: [$2,000    ]  Max: [$3,000    ]                             │
│  ☑ Show pet pricing on public listing                              │
│                                                                     │
│  Breeding Rights Pricing                                            │
│  ○ Single Price   ● Price Range   ○ Contact for Pricing            │
│  Min: [$4,000    ]  Max: [$5,000    ]                             │
│  ☑ Show breeding rights pricing                                    │
│                                                                     │
│  Show Quality Pricing                                               │
│  ○ Single Price   ○ Price Range   ● Contact for Pricing            │
│  ☐ Show show quality pricing                                       │
│                                                                     │
│  What's Included                                                    │
│  [Health guarantee, microchip, starter kit, lifetime support  ]   │
│  ☑ Show "what's included" section                                  │
│                                                                     │
│  Typical Wait Time                                                  │
│  [3-6 months                                                   ]   │
│  ☑ Show wait time                                                  │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  PROGRAM SETTINGS                                                   │
│  ───────────────────────────────────────────────────────────────   │
│  ☑ Accept inquiries         (Buyers can contact you)               │
│  ☐ Open waitlist             (Buyers can join waitlist)            │
│  ☐ Accept reservations       (Enable paid deposits - requires Stripe)│
│  ☑ Coming soon               (Show "Coming Soon" badge)            │
│  ☐ Listed on marketplace     (Appears in browse/search)            │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  [Cancel]  [Save Draft]  [Save & Publish]                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Form Sections Summary

| Section | Fields Count | Currently Implemented | Missing |
|---------|-------------|----------------------|---------|
| **Program Identity** | 5 | 2 (Name, Description) | 3 (Species, Breed, Story) |
| **Media** | 8 | 0 | 8 (Cover, Gallery, Videos) |
| **Featured Parents** | 2 | 0 | 2 (Selection, Ordering) |
| **Raising Protocols** | 4 | 0 | 4 (Toggle, Tags, Details, Visibility) |
| **Placement Package** | 5 | 0 | 5 (Toggle, Items, Guarantee, Details, Visibility) |
| **Pricing** | 13 | 0 | 13 (All pricing fields) |
| **Program Settings** | 5 | 3 (Inquiries, Waitlist, Coming Soon) | 2 (Reservations, Listed) |
| **Publishing** | 4 | 0 | 4 (Publish controls, status display) |
| **TOTAL** | **46** | **5** | **41** |

---

## Data Model / API Schema

### BreedingProgram Table Fields

```typescript
interface BreedingProgram {
  // EXISTING (Currently captured)
  id: number;
  tenantId: number;
  name: string;                           // ✅ Currently captured
  description: string | null;             // ✅ Currently captured
  acceptInquiries: boolean;               // ✅ Currently captured
  openWaitlist: boolean;                  // ✅ Currently captured
  comingSoon: boolean;                    // ✅ Currently captured

  // MISSING (Need to add to form)
  speciesId: number;                      // ❌ MISSING
  breedId: number;                        // ❌ MISSING
  programStory: string | null;            // ❌ MISSING (long-form story)
  coverImageUrl: string | null;           // ❌ MISSING

  // Pricing fields
  petPriceMin: number | null;             // ❌ MISSING (cents)
  petPriceMax: number | null;             // ❌ MISSING (cents)
  breedingRightsPriceMin: number | null;  // ❌ MISSING (cents)
  breedingRightsPriceMax: number | null;  // ❌ MISSING (cents)
  showQualityPriceMin: number | null;     // ❌ MISSING (cents)
  showQualityPriceMax: number | null;     // ❌ MISSING (cents)
  pricingNotes: string | null;            // ❌ MISSING ("What's Included")
  typicalWaitTime: string | null;         // ❌ MISSING

  // Raising Protocols
  useStorefrontProtocols: boolean;        // ❌ MISSING (default true)
  protocolTags: string[] | null;          // ❌ MISSING (JSON array)
  protocolDetails: string | null;         // ❌ MISSING

  // Placement Package
  useStorefrontPackage: boolean;          // ❌ MISSING (default true)
  packageItems: string[] | null;          // ❌ MISSING (JSON array)
  healthGuarantee: string | null;         // ❌ MISSING
  packageDetails: string | null;          // ❌ MISSING

  // Publishing & Visibility
  acceptReservations: boolean;            // ❌ MISSING
  listed: boolean;                        // ❌ MISSING
  published: boolean;                     // ❌ MISSING
  publishedAt: Date | null;               // ❌ MISSING

  // Visibility toggles (per-field)
  visibility: {                           // ❌ MISSING (JSON object)
    breed: boolean;
    description: boolean;
    programStory: boolean;
    coverImage: boolean;
    petPricing: boolean;
    breedingRightsPricing: boolean;
    showQualityPricing: boolean;
    pricingNotes: boolean;
    waitTime: boolean;
    protocols: boolean;
    package: boolean;
  };

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### Related Tables

#### BreedingProgramMedia (Gallery Images)

```typescript
interface BreedingProgramMedia {
  id: number;
  programId: number;
  mediaType: 'IMAGE' | 'VIDEO';
  url: string;
  title: string | null;
  displayOrder: number;
  visible: boolean;                       // Per-item visibility toggle
  createdAt: Date;
}
```

#### BreedingProgramFeaturedParent (Featured Parents)

```typescript
interface BreedingProgramFeaturedParent {
  id: number;
  programId: number;
  animalId: number;
  displayOrder: number;
  createdAt: Date;
}
```

---

## API Endpoints Required

### Create Program

```
POST /api/v1/breeding/programs

Request Body:
{
  name: string;
  description?: string;
  speciesId: number;
  breedId: number;
  programStory?: string;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  comingSoon: boolean;
  acceptReservations: boolean;
  listed: boolean;
  published: boolean;

  // Pricing
  petPriceMin?: number;
  petPriceMax?: number;
  breedingRightsPriceMin?: number;
  breedingRightsPriceMax?: number;
  showQualityPriceMin?: number;
  showQualityPriceMax?: number;
  pricingNotes?: string;
  typicalWaitTime?: string;

  // Protocols
  useStorefrontProtocols: boolean;
  protocolTags?: string[];
  protocolDetails?: string;

  // Package
  useStorefrontPackage: boolean;
  packageItems?: string[];
  healthGuarantee?: string;
  packageDetails?: string;

  // Visibility
  visibility: {
    breed: boolean;
    description: boolean;
    // ... all visibility flags
  };
}

Response: BreedingProgram
```

### Update Program

```
PUT /api/v1/breeding/programs/:id

Request Body: Same as create

Response: BreedingProgram
```

### Upload Cover Image

```
POST /api/v1/breeding/programs/:id/cover-image

Request: multipart/form-data with image file

Response: { coverImageUrl: string }
```

### Upload Gallery Images

```
POST /api/v1/breeding/programs/:id/media

Request: multipart/form-data with image file(s)

Response: BreedingProgramMedia[]
```

### Update Gallery Image

```
PUT /api/v1/breeding/programs/:programId/media/:mediaId

Request Body:
{
  title?: string;
  displayOrder?: number;
  visible?: boolean;
}

Response: BreedingProgramMedia
```

### Delete Gallery Image

```
DELETE /api/v1/breeding/programs/:programId/media/:mediaId

Response: 204 No Content
```

### Reorder Gallery Images

```
POST /api/v1/breeding/programs/:id/media/reorder

Request Body:
{
  mediaIds: number[];  // Ordered array of media IDs
}

Response: BreedingProgramMedia[]
```

### Manage Featured Parents

```
PUT /api/v1/breeding/programs/:id/featured-parents

Request Body:
{
  animalIds: number[];  // Ordered array of animal IDs
}

Response: BreedingProgramFeaturedParent[]
```

### Publish Program

```
POST /api/v1/breeding/programs/:id/publish

Response: BreedingProgram (with published: true, publishedAt: timestamp)
```

### Unpublish Program

```
POST /api/v1/breeding/programs/:id/unpublish

Response: BreedingProgram (with published: false)
```

---

## Validation Rules

### Required Fields
- Program Name (1-100 characters)
- Species (must be valid species from tenant)
- Breed (must be valid breed for selected species)

### Optional Fields
All other fields are optional

### Pricing Validation
- If using range: min < max
- Prices must be >= 0
- Stored as cents (multiply dollar amount by 100)

### Media Validation
- Cover image: 800x600px minimum, 4MB max, JPG/PNG/WebP
- Gallery images: same as cover, max 20 images
- Video URLs: must be valid YouTube or Vimeo URL

### Featured Parents Validation
- Animal must belong to tenant
- Animal species must match program species
- Animal breed must match or be parent breed of program breed
- Animal privacy must not be "Private"
- Animal must have at least one public photo

---

## UI/UX Notes

### Form Behavior

**Progressive Disclosure:**
- Show required fields first (Identity section)
- Expand optional sections on demand
- "Use Storefront Defaults" toggles hide/show custom entry fields

**Save States:**
- Auto-save draft on field blur (optional, nice-to-have)
- Manual "Save Draft" button (keeps unpublished)
- "Save & Publish" button (publishes immediately)

**Validation:**
- Inline validation on field blur
- Show validation errors before submit
- Highlight missing required fields on submit attempt

**Image Upload:**
- Drag-and-drop support
- Click to browse files
- Show upload progress
- Preview immediately after upload
- Allow reorder via drag-and-drop
- Delete with confirmation

**Featured Parents:**
- Multi-select dropdown with search
- Show animal photo, name, sex, age in dropdown
- Selected animals appear as cards below
- Drag to reorder
- "Manage [Name]'s Profile →" link per animal

### Responsive Behavior

**Desktop (>1024px):**
- Two-column layout where appropriate (Species/Breed side-by-side)
- Gallery images in grid (4 columns)
- Sidebar preview (optional, nice-to-have)

**Tablet (768px-1024px):**
- Single column layout
- Gallery images in grid (3 columns)

**Mobile (<768px):**
- Single column, full width
- Gallery images in grid (2 columns)
- Simplified media upload (no drag-and-drop)

---

## Implementation Priority

### Phase 1: Critical Missing Fields (HIGH PRIORITY)
1. Species selection (REQUIRED)
2. Breed selection (REQUIRED)
3. Publishing controls (publish/unpublish buttons, status display)
4. "Listed on marketplace" checkbox
5. "Accept reservations" checkbox

### Phase 2: Media Management (MEDIUM PRIORITY)
1. Cover image upload
2. Gallery image upload with reorder
3. Video URL entry
4. Per-item visibility toggles

### Phase 3: Enhanced Content (MEDIUM PRIORITY)
1. Program Story (rich text)
2. Featured Parents selection + ordering
3. Pricing fields (all tiers)

### Phase 4: Defaults & Overrides (LOW PRIORITY)
1. Raising Protocols (inherit/override toggle + custom entry)
2. Placement Package (inherit/override toggle + custom entry)
3. Per-field visibility toggles

---

## End of Document

**This specification provides everything the frontend engineer needs to implement the complete Breeding Program create/edit form.**

**Reference Documents:**
- [v2-marketplace-management.md](v2-marketplace-management.md) - Full functional requirements (Section 2)
- [BREEDER-VISIBILITY-CONTROLS-COMPLETE-LIST.md](BREEDER-VISIBILITY-CONTROLS-COMPLETE-LIST.md) - All visibility controls (Section 2)
- [backend-capabilities.md](backend-capabilities.md) - Current API endpoints
- [gap-analysis.md](gap-analysis.md) - Implementation status
