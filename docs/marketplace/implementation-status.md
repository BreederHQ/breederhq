# Marketplace Implementation Status

Current state of the marketplace implementation. Updated: 2026-01-11

## Executive Summary

The marketplace has a mix of **working real functionality** and **demo/placeholder UI**. Several pages display mock data by default and require users to manually disable "demo mode" to see (empty) real data.

---

## Page-by-Page Status

### PUBLIC BROWSE PAGES

| Page | Route | Data Source | Status |
|------|-------|-------------|--------|
| HomePage | `/` | **Demo data** | Shows mock featured items. Links to "Preview with demo data" button |
| BreedersIndexPage | `/breeders` | **Real API** | Calls `/api/v1/marketplace/breeders` - WORKING |
| BreederPage | `/breeders/:slug` | Partial | Needs verification |
| AnimalsIndexPage | `/animals` | **Mixed** | Real API for `ProgramAnimalListing`, demo for litters (offspring groups) |
| ServicesPage | `/services` | **Demo only** | Shows "coming soon" unless demo mode enabled |
| BreedingProgramsIndexPage | `/breeding-programs` | Needs verification | |
| ProgramPage | `/programs/:slug` | Needs verification | |
| ListingPage | `/programs/:slug/offspring-groups/:listing` | Needs verification | |

### BUYER PAGES

| Page | Route | Data Source | Status |
|------|-------|-------------|--------|
| InquiriesPage | `/inquiries` | Unknown | Buyer's sent inquiries |
| UpdatesPage | `/updates` | Unknown | Buyer's followed listings |

### SELLER MANAGEMENT PAGES (Breeders)

| Page | Route | Data Source | Status |
|------|-------|-------------|--------|
| ProgramsSettingsPage | `/me/programs` | **Real API** | Calls breeding-programs API - WORKING |
| ServicesSettingsPage | `/me/services` | **Real API** | Calls breeder-services API - WORKING |
| MyListingPage | `/me/listing` | Unknown | Breeder's marketplace preview |

### SERVICE PROVIDER PORTAL

| Page | Route | Data Source | Status |
|------|-------|-------------|--------|
| ProviderDashboardPage | `/provider` | **Real API** | Full CRUD, Stripe integration - WORKING |

---

## API Endpoints Status

### Backend Routes (Exist in breederhq-api)

| Route File | Endpoints | Status |
|------------|-----------|--------|
| `breeding-programs.ts` | `/breeding/programs/*` | Registered |
| `breeder-services.ts` | `/services/*` | Registered |
| `service-provider.ts` | `/provider/*` | Registered |
| `public-marketplace.ts` | `/marketplace/*` | Registered |
| `marketplace-breeders.ts` | `/marketplace/breeders` | Registered |
| `marketplace-waitlist.ts` | `/marketplace/waitlist` | Registered |
| `marketplace-messages.ts` | `/marketplace/messages` | Registered |

### Frontend API Client Functions

All documented API client functions exist in `apps/marketplace/src/api/client.ts`:
- Breeding Programs CRUD
- Breeder Services CRUD
- Service Provider Profile, Listings, Billing
- Animal Listings fetch
- (Inquiry submission, waitlist - need verification)

---

## Critical Gaps

### 1. Services Browse Page Uses Demo Only

**File:** `apps/marketplace/src/marketplace/pages/ServicesPage.tsx`

The Services page shows "Services browse is coming soon" when demo mode is off. It only displays data from `getMockServices()` when demo mode is enabled.

**Impact:** Users cannot browse real service listings from breeders or service providers.

**Fix needed:** Wire up to real API endpoint that aggregates `MarketplaceListing` where `listingType` is a service type.

### 2. Animals Page - Litter Listings Are Demo Only

**File:** `apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx`

- `ProgramAnimalListing` items: Fetched from real API (`getAnimalListings`)
- `OffspringGroup` litters: Demo data only (`getAllMockListings()`)

**Impact:** Real litters (offspring groups with availability) are not shown.

**Fix needed:** Create/wire endpoint to fetch published offspring group listings.

### 3. HomePage Featured Section Uses Demo Data

**File:** `apps/marketplace/src/marketplace/pages/HomePage.tsx`

Featured section shows mock animals, breeders, or services rotated randomly. Real mode shows "Featured listings will appear here once the marketplace is live."

### 4. Missing Public Browse Endpoints

The following browse functionality needs API endpoints:

- Browse services (aggregate `MarketplaceListing` with service types)
- Browse offspring groups / litters (published listings with availability)
- Featured/boosted listings

### 5. Inquiry System Not Verified

The inquiry submission (`/marketplace/inquiries`) may exist but the frontend `InquiriesPage` needs verification of:
- Inquiry list fetch
- Thread display
- Reply functionality

---

## What IS Working

### Breeder Management (Real Data)

1. **ProgramsSettingsPage** (`/me/programs`)
   - Create, read, update, delete breeding programs
   - Toggle marketplace visibility
   - Set inquiries/waitlist/reservations flags
   - Pricing tiers configuration

2. **ServicesSettingsPage** (`/me/services`)
   - Create, read, update, delete service listings
   - Publish/unpublish toggle
   - Pricing configuration

### Service Provider Portal (Real Data)

3. **ProviderDashboardPage** (`/provider`)
   - Onboarding flow (create profile)
   - Dashboard with stats
   - Listings CRUD
   - Publish/unpublish
   - Stripe checkout for upgrades
   - Billing portal access

### Public Browse (Real Data)

4. **BreedersIndexPage** (`/breeders`)
   - Fetches real breeder data from API
   - Shows business name, location, breeds

### Utilities

5. **Origin Tracking** (`utils/origin-tracking.ts`)
   - Captures UTM parameters
   - Tracks referrer source
   - Ready for inclusion in conversion actions

---

## Recommended Next Steps

### Priority 1: Wire Up Real Data to Browse Pages

1. **Services browse** - Create endpoint to aggregate service-type `MarketplaceListing` entries
2. **Litter/offspring browse** - Create endpoint to fetch published offspring groups
3. **Update AnimalsIndexPage and ServicesPage** to use real endpoints

### Priority 2: Remove Demo Mode Dependency

1. Make browse pages show empty states instead of "demo" prompts
2. Remove demo mode toggle from header
3. Keep mock data utilities for development only

### Priority 3: Verify End-to-End Flows

1. Test inquiry submission flow
2. Test waitlist join flow
3. Verify breeder receives inquiries in their inbox

---

## Files Inventory

### Management Pages (Working)
- `apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx` - 659 lines, full CRUD
- `apps/marketplace/src/management/pages/ServicesSettingsPage.tsx` - 616 lines, full CRUD
- `apps/marketplace/src/provider/pages/ProviderDashboardPage.tsx` - 912 lines, complete portal

### Browse Pages (Mixed/Demo)
- `apps/marketplace/src/marketplace/pages/HomePage.tsx` - Demo featured section
- `apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx` - Mixed real/demo
- `apps/marketplace/src/marketplace/pages/ServicesPage.tsx` - Demo only
- `apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx` - Real API

### API Client
- `apps/marketplace/src/api/client.ts` - All API functions exist

### Demo System
- `apps/marketplace/src/demo/demoMode.ts` - Demo mode toggle
- `apps/marketplace/src/demo/mockData.ts` - Mock listings/services

---

## Navigation

Added to `MarketplaceLayout.tsx`:
- "My Programs" -> `/me/programs`
- "My Services" -> `/me/services`
- "Provider Portal" -> `/provider`

These links appear in the header navigation for authenticated users.
