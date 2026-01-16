# BreederHQ Marketplace: Backend Capabilities vs UI Reality

> A comprehensive, honest assessment of what the backend supports vs what the UI currently exposes.

---

## Executive Summary: The Gap is HUGE

| Area | Backend | UI | Gap Severity |
|------|---------|-----|--------------|
| **Breeding Programs** | Rich: media, pricing tiers, plans link | Basic CRUD only | CRITICAL |
| **Service Listings** | Full CRUD + publish/unpublish | ✅ EXISTS but hidden | MEDIUM |
| **Animal Listings (Stud/Rehome/etc)** | Full schema exists | ❌ NO UI EXISTS | CRITICAL |
| **Offspring Groups → Program** | Full linkage | Not connected | HIGH |
| **Dam/Sire showcase** | Full animal data | Not displayed | HIGH |
| **Health/Genetics display** | AnimalTraitValue system | Not surfaced | HIGH |
| **Waitlist management (buyer side)** | Full support | Basic only | MEDIUM |

---

## Part 1: Breeding Programs

### What the Backend Has

**BreedingProgram Model:**
```
- slug, name, description, species, breedText
- listed, acceptInquiries, openWaitlist, acceptReservations
- pricingTiers (JSON array)
- whatsIncluded (text)
- typicalWaitTime (text)
- publishedAt
- media[] (BreedingProgramMedia with captions, sort order)
- breedingPlans[] (THE KEY RELATION to actual litters)
```

**API Endpoints (FULLY FUNCTIONAL):**
- `GET /api/v1/breeding/programs` - List with `_count.breedingPlans`
- `GET /api/v1/breeding/programs/:id` - Detail with media + recent plans
- `POST/PUT/DELETE` - Full CRUD
- `GET/POST/PUT/DELETE /breeding/programs/:id/media` - Media gallery management
- `POST /breeding/programs/:id/media/reorder` - Reorder images

### What the UI Shows

**Current UI ([ProgramsSettingsPage.tsx](apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx)):**
- Program Name ✓
- Species ✓
- Breed text ✓
- Description ✓
- Listed toggle ✓
- Accept Inquiries ✓
- Open Waitlist ✓
- Accept Reservations ✓
- Pricing Tiers editor ✓
- What's Included ✓
- Typical Wait Time ✓

**MISSING from UI:**
- ❌ Program Media Gallery (backend supports it, no UI)
- ❌ Connected Breeding Plans display
- ❌ "Coming Soon" litters (plans in COMMITTED → PREGNANT)
- ❌ "Available Now" (plans in BIRTHED → PLACEMENT)
- ❌ Dam/Sire showcase with photos
- ❌ Health testing summary for parents

### Critical Issue: The Program → Plan Disconnect

The `BreedingProgram` model has a `breedingPlans` relation, but:
1. The UI shows "X breeding plans linked" as a count only
2. No way to see WHICH plans are linked
3. No way to see upcoming litters tied to the program
4. The marketplace browse doesn't show this connection

**What buyers should see but don't:**
- "3 litters expected in 2025"
- "Luna × Duke - Expected March 2025"
- Meet the parents with photos and health badges

---

## Part 2: Service Listings

### What the Backend Has

**MarketplaceListing Model (used for services):**
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

**API Endpoints (FULLY FUNCTIONAL):**
- `GET /api/v1/services` - List breeder's services
- `GET /api/v1/services/:id` - Detail
- `POST /api/v1/services` - Create
- `PUT /api/v1/services/:id` - Update
- `POST /api/v1/services/:id/publish` - Publish
- `POST /api/v1/services/:id/unpublish` - Unpublish
- `DELETE /api/v1/services/:id` - Delete

### What the UI Has

**Good news: [ServicesSettingsPage.tsx](apps/marketplace/src/management/pages/ServicesSettingsPage.tsx) EXISTS and is functional!**

- Full CRUD ✓
- Service type selection ✓
- Title, description ✓
- Location (city, state) ✓
- Pricing (fixed, starting_at, contact) ✓
- Contact info ✓
- Publish/unpublish ✓

**Route: `/me/services`** - This is accessible!

### What's Missing

- ❌ Image upload for service listings
- ❌ Video URL field in form
- ❌ No navigation link to "My Services" in main nav (HIDDEN FEATURE!)

---

## Part 3: Animal Listings (STUD/REHOME/GUARDIAN/etc)

### What the Backend Has

**AnimalPublicListing Model (FULL SCHEMA EXISTS):**
```prisma
model AnimalPublicListing {
  animalId    Int    @unique
  animal      Animal  // Full animal data

  urlSlug     String? @unique
  intent      AnimalListingIntent?  // STUD, BROOD_PLACEMENT, REHOME, GUARDIAN, etc.
  status      AnimalListingStatus   // DRAFT, LIVE, PAUSED

  headline    String?  // Short tagline
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

**Breeder CRUD API (FULLY FUNCTIONAL) - in [animals.ts:1524-1758](C:/Users/Aaron/Documents/Projects/breederhq-api/src/routes/animals.ts#L1524):**
- `GET /api/v1/animals/:id/public-listing` - Get listing for an animal
- `PUT /api/v1/animals/:id/public-listing` - Create or update listing (upsert)
- `PATCH /api/v1/animals/:id/public-listing/status` - Change status (DRAFT → LIVE → PAUSED)
- `DELETE /api/v1/animals/:id/public-listing` - Delete listing

**Public marketplace browse endpoints:**
- `GET /programs/:slug/animals` - List program's animal listings
- `GET /programs/:slug/animals/:urlSlug` - Animal listing detail

### What the UI Has

**❌ NOTHING FOR BREEDERS TO CREATE ANIMAL LISTINGS**

The backend has **COMPLETE CRUD support**, but there is NO UI anywhere that allows a breeder to:
- Create a stud listing for their male
- List a retired female as "rehome"
- Offer a guardian home placement
- Create any other AnimalPublicListing

**The marketplace browse ([AnimalsIndexPage.tsx](apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx)) shows animal listings, but there's no way to CREATE them!**

### What Needs to be Built (Backend is READY!)

A new page at `/me/animals` or within animal detail page:
- Select animal from roster (or add from animal detail view)
- Choose listing intent (Stud, Rehome, Guardian, etc.)
- Add headline, summary, description
- Set pricing model (fixed, range, negotiable, inquire) and amounts
- Set URL slug for SEO
- Override location if different from business
- Publish/unpublish controls

**The API is already there waiting - just needs UI!**

---

## Part 4: Offspring Groups & Litters

### Backend Support

**OffspringGroup** is automatically created when a BreedingPlan is committed:
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
- marketplaceListed (boolean)
- marketplacePriceCents (override)
- placementState: UNASSIGNED, OPTION_HOLD, RESERVED, PLACED
- keeperIntent: AVAILABLE, UNDER_EVALUATION, WITHHELD, KEEP
- lifeState: ALIVE, DECEASED
```

### UI Status

- ✓ Offspring groups surface via `/programs/:slug/offspring-groups`
- ✓ Individual offspring shown on listing detail page
- ❌ No connection to parent BreedingProgram in browse
- ❌ No "upcoming litters" view per program
- ❌ No way to set marketplaceListed per offspring in UI
- ❌ No way to override marketplacePriceCents in UI

---

## Part 5: What Routes Exist vs Don't

### Marketplace Routes ([MarketplaceRoutes.tsx](apps/marketplace/src/routes/MarketplaceRoutes.tsx))

| Route | Page | Status |
|-------|------|--------|
| `/` | HomePage | ✅ |
| `/animals` | AnimalsIndexPage | ✅ Browse only |
| `/breeders` | BreedersIndexPage | ✅ |
| `/breeders/:slug` | BreederPage | ✅ |
| `/breeding-programs` | BreedingProgramsIndexPage | ✅ Browse only |
| `/services` | ServicesPage | ✅ Browse only |
| `/inquiries` | InquiriesPage | ✅ |
| `/updates` | UpdatesPage | ✅ |
| `/me/listing` | MyListingPage | ✅ Preview only |
| `/me/programs` | ProgramsSettingsPage | ✅ |
| `/me/services` | ServicesSettingsPage | ✅ **BUT NOT IN NAV!** |
| `/provider` | ProviderDashboardPage | ✅ |
| `/programs/:slug` | ProgramPage | ✅ |
| `/programs/:slug/offspring-groups/:listing` | ListingPage | ✅ |

### Routes That Need to Exist

| Route | Purpose | Backend Ready? |
|-------|---------|----------------|
| `/me/animals` | Manage animal listings | ✅ Schema exists |
| `/me/programs/:id` | Deep edit with media | ✅ API exists |
| `/animals/:slug` | Animal listing detail | ✅ API exists |
| `/breeding-programs/:id` | Breeding program detail | ⚠️ Needs enhancement |

---

## Part 6: Navigation Gap

### Current Navigation (from [MarketplaceLayout.tsx](apps/marketplace/src/layout/MarketplaceLayout.tsx))

**Buyer Links (visible to all):**
- Home
- Animals
- Breeders
- Services
- Inquiries

**Seller Links (when tenant context exists):**
- My Programs → `/me/programs`
- Provider Portal → `/provider`

### Missing Navigation

- ❌ "My Services" link (page exists at `/me/services`, not in nav!)
- ❌ "My Animal Listings" (page doesn't exist)
- ❌ Quick access to create listings

---

## Summary: What to Build

### Immediate (Critical Gaps)

1. **Animal Listings UI** - Allow breeders to create stud/rehome/guardian listings
   - New page at `/me/animals`
   - Integration with existing animal roster
   - All backend support exists

2. **Add "My Services" to navigation** - The page exists, just hidden!

3. **Connect Programs to Plans in UI** - Show upcoming/available litters on program detail

### Short-term (High Impact)

4. **Program Media Gallery UI** - Backend supports full media management

5. **Dam/Sire showcase** - Display parent photos and health info on program pages

6. **Offspring marketplace controls** - Let breeders set `marketplaceListed` and `marketplacePriceCents`

### Medium-term

7. **Health badges** - Surface AnimalTraitValue data on marketplace listings

8. **Better pricing display** - Show pricing tiers, what's included on browse cards

9. **Waitlist enhancements** - Show position, join waitlist for specific programs

---

## Appendix: Full Schema References

### AnimalListingIntent Values
```
STUD              - Available for stud service
BROOD_PLACEMENT   - Breeding animal placement
REHOME            - General rehoming
GUARDIAN          - Guardian home placement
TRAINED           - Fully trained animal
WORKING           - Working animal
STARTED           - Started/partially trained
CO_OWNERSHIP      - Co-ownership opportunity
```

### BreedingPlanStatus Values
```
PLANNING           - Initial planning phase
COMMITTED          - Breeding confirmed
CYCLE_EXPECTED     - Waiting for heat cycle
HORMONE_TESTING    - Active monitoring
BRED               - Breeding completed
PREGNANT           - Confirmed pregnancy
BIRTHED            - Birth occurred
WEANED             - Weaning complete
PLACEMENT          - Go-home phase
COMPLETE           - All placed
CANCELED           - Canceled
```

### Service Types Available to Breeders
```
STUD_SERVICE    - Stud services
TRAINING        - Training services
GROOMING        - Grooming services
TRANSPORT       - Animal transport
BOARDING        - Boarding services
OTHER_SERVICE   - Other services
```
