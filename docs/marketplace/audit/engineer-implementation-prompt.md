# BreederHQ Marketplace Remediation Implementation Prompt

> **Context**: You are implementing fixes based on a comprehensive UI/UX audit conducted by 11 senior experts. This prompt contains specific, prioritized fixes that must be implemented exactly as specified.

**Date**: 2026-01-13
**Version**: 2.0 (Updated based on visual audit evidence)
**Audit Reference**: `docs/marketplace/audit/marketplace-remediation-action-plan.md`
**Screenshots**: `docs/marketplace/audit/screenshots/marketplace-public/`

---

## Audit Summary

The visual audit revealed that the marketplace implementation is **substantially complete and well-built**:

**What's Working Well:**
- Brand identity IS present - BreederHQ logo visible in header
- Brand colors ARE applied - orange accents throughout
- Animals | Breeders | Services navigation IS prominent on homepage
- Species filters are CORRECT (Dogs, Cats, Horses, Rabbits, Goats, Sheep - NO birds)
- Mobile BottomTabBar IS implemented
- Dual-entry architecture follows specification

**What Needs Fixing:**
- Services API returns 401 error
- Some protected pages (Inquiries) redirect unexpectedly
- Geo-location filtering needs backend wiring verification

---

## Your Mission

Implement all **Phase 1 Critical Fixes** listed below. These are primarily API integration issues, not design/styling problems.

---

## Phase 1: Critical Fixes (Required Before Launch)

### Fix 1: Resolve Services API 401 Error

**Priority**: #1 - SHOWSTOPPER
**Severity**: CRITICAL

**Issue**: The `/services` page shows a red error banner: "Request failed with status 401". This completely breaks the services marketplace.

**Evidence**: Screenshot `09-browse-services.png` shows the error banner above the service category tabs.

**Root Cause Investigation**:

1. Check `apps/marketplace/src/api/client.ts` for the `getPublicServices()` function
2. Verify the endpoint being called
3. Check if CSRF token is being sent
4. Check if `credentials: 'include'` is set
5. Verify the backend endpoint doesn't incorrectly require authentication

**Files to Investigate**:
```
apps/marketplace/src/api/client.ts
apps/marketplace/src/marketplace/pages/ServicesPage.tsx
```

**Likely Fixes**:

Option A: Frontend CSRF issue
```typescript
// In api/client.ts - verify CSRF token handling
const xsrf = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)?.[1];
const headers = {
  'Content-Type': 'application/json',
  ...(xsrf ? { 'x-csrf-token': decodeURIComponent(xsrf) } : {}),
};
```

Option B: Backend auth middleware issue
```typescript
// In backend - public services endpoint should NOT require auth
// Check if middleware is incorrectly applied
router.get('/api/v1/marketplace/public/services', /* no auth middleware */ handler);
```

Option C: Credentials not included
```typescript
// In fetch call
const response = await fetch(url, {
  credentials: 'include', // Must be set for cookie-based auth
  headers,
});
```

**Acceptance Criteria**:
- [ ] Services page loads without 401 error
- [ ] Service listings display (or graceful empty state if none exist)
- [ ] Service category tabs work correctly
- [ ] No error banners visible

---

### Fix 2: Verify Inquiries/Saved Pages Auth Flow

**Priority**: #2 - USER EXPERIENCE
**Severity**: HIGH

**Issue**: The Inquiries page (`/inquiries`) shows a login gate even for authenticated users. Screenshot shows login page instead of inquiries content.

**Evidence**: Screenshot `11-inquiries-page.png` shows login page

**Investigation Steps**:

1. Verify user authentication state is being passed correctly
2. Check if MarketplaceGate is incorrectly redirecting
3. Verify the route has correct auth guards

**Files to Investigate**:
```
apps/marketplace/src/marketplace/pages/InquiriesPage.tsx
apps/marketplace/src/routes/MarketplaceRoutes.tsx
apps/marketplace/src/gate/MarketplaceGate.tsx
```

**Potential Issues**:
1. Auth state not being read correctly from context
2. Route guard too aggressive
3. Cookie/session not being passed correctly

**Acceptance Criteria**:
- [ ] Authenticated users can access `/inquiries`
- [ ] Authenticated users can access `/saved`
- [ ] Authenticated users can access `/waitlist`
- [ ] Login redirects only for truly unauthenticated users

---

### Fix 3: Wire Up Geo-Location Search

**Priority**: #3 - FEATURE COMPLETION
**Severity**: MEDIUM

**Issue**: The location filter input ("City or ZIP") exists on Animals and Breeders pages, but filtering by location may not be wired to the backend.

**Evidence**:
- Screenshot `06-browse-animals.png` shows "All Locations" dropdown
- Screenshot `08-browse-breeders.png` shows "All Locations" dropdown

**Investigation Steps**:

1. Check `AnimalsIndexPage.tsx` for location filter handling
2. Check `BreedersIndexPage.tsx` for location filter handling
3. Verify API endpoints support location/geo parameters
4. Check `api-to-component-mapping.md` for location filter API spec

**Files to Investigate**:
```
apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx
apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx
apps/marketplace/src/api/client.ts
```

**Current Code Reference** (from AnimalsIndexPage.tsx):
```typescript
// Location filter exists in the UI
<input
  type="text"
  placeholder="City or ZIP"
  value={filters.location}
  onChange={(e) => onFilterChange("location", e.target.value)}
/>
```

**Backend Integration Needed**:
```typescript
// Add location param to API calls
const result = await getPublicOffspringGroups({
  search: filters.search || undefined,
  species: filters.species || undefined,
  location: filters.location || undefined, // Wire this up
  // Or for geo-search:
  // zipCode: filters.location || undefined,
  // radiusMiles: 50,
  limit: ITEMS_PER_PAGE,
  page: currentPage,
});
```

**Acceptance Criteria**:
- [ ] Enter ZIP code in location filter
- [ ] Results filter to show only nearby listings
- [ ] "All Locations" shows unfiltered results
- [ ] Location filtering works on both Animals and Breeders pages

---

### Fix 4: Verify Save/Favorite Functionality

**Priority**: #4 - FEATURE COMPLETION
**Severity**: MEDIUM

**Issue**: Heart icon (save button) appears on animal cards but functionality needs verification.

**Evidence**: Code shows save button implementation in `AnimalCard` component

**Investigation Steps**:

1. Check if save button calls API
2. Verify saved state persists
3. Verify Saved Listings page shows saved items

**Files to Investigate**:
```
apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx (AnimalCard component)
apps/marketplace/src/marketplace/pages/SavedListingsPage.tsx
apps/marketplace/src/api/client.ts
```

**Current Code** (from AnimalsIndexPage.tsx):
```typescript
<button
  type="button"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement save functionality
  }}
  className="..."
  aria-label="Save listing"
>
  <HeartIcon className="w-4 h-4" />
</button>
```

**Implementation Needed**:
```typescript
// Add save/unsave API calls
const handleSave = async (listingId: string) => {
  await fetch('/api/v1/marketplace/saved', {
    method: 'POST',
    body: JSON.stringify({ listingId }),
    credentials: 'include',
  });
  // Update local state
};

const handleUnsave = async (listingId: string) => {
  await fetch(`/api/v1/marketplace/saved/${listingId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  // Update local state
};
```

**Acceptance Criteria**:
- [ ] Clicking heart icon saves listing
- [ ] Heart icon fills/toggles when saved
- [ ] Saved listings appear on `/saved` page
- [ ] Can unsave from both animal card and saved page

---

## Phase 2: High-Priority Fixes (Should Complete Before Launch)

### Fix 5: Test Waitlist Join Flow End-to-End

**Priority**: HIGH

**Issue**: Waitlist join functionality needs end-to-end verification.

**Test Steps**:
1. Navigate to a breeder profile
2. Look for "Join Waitlist" button or similar
3. Submit waitlist request
4. Verify request appears on `/waitlist` page

**API Endpoint** (per documentation):
```
POST /api/v1/marketplace/waitlist/:tenantSlug
```

**Acceptance Criteria**:
- [ ] Users can join breeder waitlists
- [ ] Waitlist entries appear on user's Waitlist page
- [ ] Breeder receives notification of new waitlist request

---

### Fix 6: Test Messaging Flow End-to-End

**Priority**: HIGH

**Issue**: Messaging/contact functionality needs verification.

**Test Steps**:
1. Navigate to a breeder profile
2. Click "Contact Breeder" button
3. Send message
4. Verify message appears in Messages/Inquiries

**Acceptance Criteria**:
- [ ] Users can send messages to breeders
- [ ] Messages appear in Inquiries page
- [ ] Unread count badge updates

---

### Fix 7: Add Skip Navigation Link (WCAG)

**Priority**: MEDIUM

**Issue**: No "Skip to main content" link for keyboard/screen reader users.

**Files to Modify**:
```
apps/marketplace/src/layout/MarketplaceLayout.tsx
```

**Implementation**:
```tsx
// Add at very top of layout, before TopNav
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded"
>
  Skip to main content
</a>

// Add id to main content area
<main id="main-content" className="...">
  {children}
</main>
```

**Acceptance Criteria**:
- [ ] Skip link is first focusable element
- [ ] Pressing Tab makes skip link visible
- [ ] Activating skip link jumps to main content

---

### Fix 8: Improve Focus Indicators

**Priority**: LOW

**Issue**: Focus indicators may not be visible enough on all interactive elements.

**Files to Modify**:
```
apps/marketplace/tailwind.config.js (or global CSS)
```

**Implementation**:
```css
/* Add visible focus ring */
:focus-visible {
  outline: 2px solid hsl(var(--brand-orange));
  outline-offset: 2px;
}
```

**Acceptance Criteria**:
- [ ] All interactive elements have visible focus ring
- [ ] Focus ring uses brand orange color
- [ ] Keyboard navigation is easy to track visually

---

## Phase 3: Medium-Priority Fixes (Post-Launch)

### Fix 9: Add Comprehensive Image Alt Text

Audit all images and ensure descriptive alt text is provided.

### Fix 10: Implement Buyer Dashboard Content

Create dashboard overview with stats, recent activity, and quick actions.

### Fix 11: Add Help Center Content

Create FAQ and support information page at `/help`.

---

## Testing Requirements

### Manual Testing Checklist

**Services Page**:
- [ ] Navigate to `/services`
- [ ] Page loads without 401 error
- [ ] Service category tabs work
- [ ] Service cards display (if services exist)

**Protected Pages** (must be logged in):
- [ ] `/inquiries` shows user's inquiries
- [ ] `/saved` shows saved listings
- [ ] `/waitlist` shows waitlist positions

**Location Filtering**:
- [ ] Enter ZIP code in location filter on Animals page
- [ ] Results update based on location
- [ ] Clear filter shows all results

**Save Functionality**:
- [ ] Click heart on animal card
- [ ] Heart icon changes state
- [ ] Item appears on Saved page

**Accessibility**:
- [ ] Tab through page - all elements focusable
- [ ] Skip link works
- [ ] Screen reader announces content correctly

---

### Playwright E2E Tests to Add

```typescript
// e2e/marketplace-services-api.spec.ts
import { test, expect } from 'playwright/test';

test.describe('Services Page', () => {
  test('services page loads without 401 error', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/services');

    // Should NOT see error banner
    const errorBanner = page.locator('text=Request failed with status 401');
    await expect(errorBanner).not.toBeVisible();

    // Should see services content or empty state
    const pageTitle = page.locator('h1:has-text("Services")');
    await expect(pageTitle).toBeVisible();
  });
});

// e2e/marketplace-protected-pages.spec.ts
test.describe('Protected Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('https://marketplace.breederhq.test/auth/login');
    await page.fill('input[type="email"]', 'marketplace-access@bhq.local');
    await page.fill('input[type="password"]', 'Marketplace2026!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  });

  test('inquiries page accessible when logged in', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/inquiries');

    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/login/);

    // Should see inquiries content
    const pageTitle = page.locator('h1:has-text("Inquiries"), h1:has-text("Messages")');
    await expect(pageTitle).toBeVisible();
  });

  test('saved listings page accessible', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/saved');
    await expect(page).not.toHaveURL(/login/);
  });
});

// e2e/marketplace-location-filter.spec.ts
test.describe('Location Filtering', () => {
  test('can filter animals by location', async ({ page }) => {
    await page.goto('https://marketplace.breederhq.test/animals');

    // Find location dropdown/input
    const locationFilter = page.locator('text=All Locations').first();
    await locationFilter.click();

    // Enter a ZIP code
    const locationInput = page.locator('input[placeholder*="ZIP"], input[placeholder*="City"]');
    await locationInput.fill('90210');

    // Submit/apply filter
    await page.keyboard.press('Enter');

    // Verify URL updated with location param
    await expect(page).toHaveURL(/location=90210/);
  });
});
```

---

## File Location Reference

| Fix | File Location |
|-----|---------------|
| Services 401 error | `apps/marketplace/src/api/client.ts`, `apps/marketplace/src/marketplace/pages/ServicesPage.tsx` |
| Auth flow issues | `apps/marketplace/src/gate/MarketplaceGate.tsx`, `apps/marketplace/src/routes/MarketplaceRoutes.tsx` |
| Location filter | `apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx`, `apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx` |
| Save functionality | `apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx` (AnimalCard) |
| Skip navigation | `apps/marketplace/src/layout/MarketplaceLayout.tsx` |
| Focus styles | `apps/marketplace/tailwind.config.js` or `apps/marketplace/src/index.css` |

---

## API Reference

Based on `docs/marketplace/api-to-component-mapping.md` and `docs/marketplace/marketplace-api-gaps-response.md`:

| Feature | Endpoint | Notes |
|---------|----------|-------|
| Public Services | `GET /api/v1/marketplace/public/services` | Should not require auth |
| Save Listing | `POST /api/v1/marketplace/saved` | Requires auth |
| Unsave Listing | `DELETE /api/v1/marketplace/saved/:id` | Requires auth |
| Get Saved | `GET /api/v1/marketplace/saved` | Requires auth |
| Join Waitlist | `POST /api/v1/marketplace/waitlist/:slug` | Requires auth |
| My Waitlist | `GET /api/v1/marketplace/waitlist/my-requests` | Requires auth |
| Location Search | Various endpoints support `city`, `state`, `zipCode` params | Check backend docs |

---

## Acceptance Criteria for Completion

### Phase 1 is complete when:
- [ ] Services page loads without 401 error
- [ ] Protected pages (Inquiries, Saved, Waitlist) work for authenticated users
- [ ] Location filtering produces filtered results
- [ ] Save button functionality works
- [ ] All Playwright tests pass
- [ ] Manual testing checklist passes 100%

### Sign-off required from:
- [ ] Technical lead (code review)
- [ ] QA (testing verification)

---

## Questions or Clarifications

If any requirement is unclear:

1. **Check the audit document**: `docs/marketplace/audit/marketplace-remediation-action-plan.md`
2. **Check screenshots**: `docs/marketplace/audit/screenshots/marketplace-public/`
3. **Check API documentation**: `docs/marketplace/api-to-component-mapping.md`
4. **Test the breeder portal**: `app.breederhq.test` for reference implementation

---

## Summary: Priority Order

1. **Fix Services API 401 error** (immediate - showstopper)
2. **Verify protected pages auth flow** (immediate)
3. **Wire up geo-location search** (before launch)
4. **Verify save functionality** (before launch)
5. **Test waitlist flow** (before launch)
6. **Test messaging flow** (before launch)
7. **Add accessibility improvements** (WCAG compliance)

**KEY INSIGHT**: The marketplace is well-built with correct brand identity and UX. The issues are primarily API integration problems, not design or styling issues. Focus on getting the data flowing correctly.

---

## Part 2: Breeder-Side Marketplace Management Implementation

> **Context**: The v2-marketplace-management.md specification describes a comprehensive 8-section Marketplace Management Portal. This section covers implementation of missing features.

**Specification Reference**: `docs/marketplace/v2-marketplace-management.md`

---

### Current State Summary

**What Exists:**
- `/me/listing` - Storefront management (ManageListingPage.tsx)
- `/me/programs` - Programs settings (ProgramsSettingsPage.tsx)
- `/me/services` - Services settings (ServicesSettingsPage.tsx)

**What's Missing:**
- `/marketplace-manage/animals` - Individual animal listings management
- `/marketplace-manage/litters` - Offspring group listings management
- Breeder-side inquiries and waitlist management views

---

### Phase 1.5: Breeder Management Core

#### Fix 12: Create Animal Listings Management Page

**Priority**: HIGH
**Route**: `/me/animals` or `/marketplace-manage/animals`

**Purpose**: Allow breeders to create marketplace listings for individual animals (stud service, rehoming, guardian placement).

**Files to Create:**
```
apps/marketplace/src/management/pages/AnimalListingsPage.tsx
```

**Reference**: `v2-marketplace-management.md` Section 3

**Data Model (from spec):**
```typescript
type AnimalListingIntent =
  | "STUD"
  | "BROOD_PLACEMENT"
  | "REHOME"
  | "GUARDIAN"
  | "TRAINED"
  | "WORKING"
  | "STARTED"
  | "CO_OWNERSHIP";

type AnimalListing = {
  id: number;
  animalId: number;
  intent: AnimalListingIntent;

  // Pricing
  priceModel: "fixed" | "range" | "negotiable" | "inquire";
  priceCents?: number;
  priceMinCents?: number;
  priceMaxCents?: number;
  priceNotes?: string;

  // Location override
  useStorefrontLocation: boolean;
  city?: string;
  state?: string;

  // URL
  urlSlug: string;

  // Status
  status: "draft" | "live" | "paused";
};
```

**UI Requirements:**

1. **List View** - Table showing:
   - Animal photo, name
   - Intent (badge)
   - Species/Breed
   - Price
   - Status (Draft/Live/Paused)
   - Actions (Edit, Toggle Status, Delete)

2. **Create Flow:**
   - Step 1: Select animal from roster
   - Step 2: Choose intent type
   - Step 3: Configure pricing and details

3. **Edit View** - Preview-first pattern:
   - Show listing as buyer would see it
   - Per-section visibility toggles
   - Inline editing

**Backend APIs Needed:**
```
GET    /api/v1/animal-listings              # List all for tenant
GET    /api/v1/animals/:id/public-listing   # Get listing for animal
PUT    /api/v1/animals/:id/public-listing   # Upsert listing
PATCH  /api/v1/animals/:id/public-listing/status
DELETE /api/v1/animals/:id/public-listing
```

**Route Registration:**
```typescript
// In MarketplaceRoutes.tsx
import { AnimalListingsPage } from "../management/pages/AnimalListingsPage";

<Route path="/me/animals" element={<AnimalListingsPage />} />
```

**Acceptance Criteria:**
- [ ] Breeder can see list of their animal listings
- [ ] Breeder can create new listing from animal roster
- [ ] Breeder can select intent (STUD, REHOME, etc.)
- [ ] Breeder can set pricing
- [ ] Breeder can publish/unpublish listings

---

#### Fix 13: Create Offspring Group Listings Management Page

**Priority**: HIGH
**Route**: `/me/litters` or `/marketplace-manage/litters`

**Purpose**: Allow breeders to manage offspring group marketplace visibility and per-offspring pricing.

**Files to Create:**
```
apps/marketplace/src/management/pages/OffspringGroupListingsPage.tsx
```

**Reference**: `v2-marketplace-management.md` Section 4

**UI Requirements:**

1. **List View** - Table showing:
   - Cover image
   - Group title
   - Parents (Dam × Sire)
   - Program link
   - Stage (Expected/Born/Weaning/Placement/Complete)
   - Available count (X of Y)
   - Listed status
   - Actions

2. **Edit View:**
   - Group-level settings (title, description, cover, default price)
   - Per-offspring table:
     - Name, Sex, Collar/ID, Color
     - Placement state (read-only)
     - Listed toggle (editable)
     - Price override (editable)
   - Parents preview (data from Animal records)
   - Protocols/Package preview (inherited from Program/Storefront)

**Per-Offspring Marketplace Fields:**
```typescript
type OffspringMarketplaceFields = {
  marketplaceListed: boolean;
  marketplacePriceCents?: number;  // null = use group default
};
```

**Backend APIs Needed:**
```
GET   /api/v1/offspring-groups              # List all with marketplace fields
GET   /api/v1/offspring-groups/:id          # Get with aggregated data
PATCH /api/v1/offspring-groups/:id          # Update listing fields
PATCH /api/v1/offspring/:id                 # Update per-offspring marketplace fields
POST  /api/v1/offspring-groups/:id/offspring/bulk  # Bulk update
```

**Route Registration:**
```typescript
// In MarketplaceRoutes.tsx
import { OffspringGroupListingsPage } from "../management/pages/OffspringGroupListingsPage";

<Route path="/me/litters" element={<OffspringGroupListingsPage />} />
```

**Acceptance Criteria:**
- [ ] Breeder can see list of their offspring groups
- [ ] Breeder can set group-level listing details
- [ ] Breeder can toggle individual offspring listing visibility
- [ ] Breeder can set per-offspring price overrides
- [ ] Breeder can bulk list/unlist available offspring

---

#### Fix 14: Verify Breeder-Side Inquiries View

**Priority**: MEDIUM

**Investigation**: The `/inquiries` route exists but may only show buyer-side view.

**Questions to Answer:**
1. Does InquiriesPage show messages TO the breeder or FROM the breeder?
2. Is there a role-based switch?
3. Does it need separate routes for buyer vs seller?

**Files to Investigate:**
```
apps/marketplace/src/marketplace/pages/InquiriesPage.tsx
```

**If Breeder View Missing, Create:**
```
apps/marketplace/src/management/pages/BreederInquiriesPage.tsx
```

**Spec Requirements:**
- Thread-based conversations
- Source tracking (which listing)
- Unread count
- Quick actions (Mark as read, Block user)

---

#### Fix 15: Verify Breeder-Side Waitlist Management

**Priority**: MEDIUM

**Investigation**: The `/waitlist` route exists but shows "My Waitlist Positions" (buyer view).

**Questions to Answer:**
1. Is there a breeder-side waitlist management view?
2. Does the backend support breeder waitlist CRUD?

**Files to Investigate:**
```
apps/marketplace/src/marketplace/pages/WaitlistPositionsPage.tsx
```

**If Breeder View Missing, Create:**
```
apps/marketplace/src/management/pages/BreederWaitlistPage.tsx
```

**Spec Requirements:**
- List of waitlist entries for breeder's programs
- Status workflow (Inquiry → Approved → Deposit Pending → Confirmed)
- Priority ordering (queue position)
- Deposit tracking (required/paid amounts)

**Backend APIs Needed:**
```
GET   /api/v1/waitlist                # Breeder: all entries for their programs
GET   /api/v1/waitlist/:id            # Single entry detail
PATCH /api/v1/waitlist/:id            # Update status, priority
DELETE /api/v1/waitlist/:id           # Remove entry
```

---

### Phase 2.5: Breeder Management Enhanced

#### Fix 16: Implement Raising Protocols

**Priority**: MEDIUM
**Location**: Storefront (default) + Program (override) + Offspring Group (override)

**Spec Reference**: `v2-marketplace-management.md` Section 1.3, 2.4

**Data Model:**
```typescript
type RaisingProtocol = {
  tags: string[];        // e.g., ["ENS", "Puppy Culture", "Crate Training"]
  details?: string;      // Free-form text about protocols
};
```

**Species-Aware Suggestions:**
| Species | Suggested Protocols |
|---------|---------------------|
| Dogs | ENS, ESI, Puppy Culture, Avidog, BAB, Rule of 7s, Volhard Testing, Crate Training, Sound Desensitization |
| Cats | Litter Training, Handling, Socialization |
| Horses | Halter Breaking, Leading, Hoof Handling, Imprint Training |
| Goats/Sheep | Bottle-raised, Dam-raised, Disbudding, Halter Training |
| Rabbits | Handling, Nail Trims, Grooming, Show Posing |

**Inheritance Chain:**
1. Storefront sets defaults
2. Program can override
3. Offspring Group can override Program

---

#### Fix 17: Implement Placement Package

**Priority**: MEDIUM
**Location**: Storefront (default) + Program (override) + Offspring Group (override)

**Data Model:**
```typescript
type PlacementPackage = {
  includedItems: string[];  // e.g., ["Starter Food", "Health Records", "Microchip"]
  healthGuarantee?: string; // e.g., "2-Year Health Guarantee"
  details?: string;         // Additional info
};
```

**Common Included Items:**
- Starter Food
- Health Records
- Vaccination Records
- Deworming Records
- Registration Papers
- Microchip
- Contract
- Health Guarantee Documentation
- Comfort Item
- Training Resources
- Lifetime Breeder Support

---

#### Fix 18: Add Featured Parents to Programs

**Priority**: MEDIUM
**Location**: ProgramsSettingsPage.tsx

**Current**: Programs have basic info but no featured parent animals.

**Spec**: Programs should allow selecting animals to feature, with auto-pulled data.

**Implementation:**
```typescript
type ProgramData = {
  // ... existing fields ...
  featuredParents: {
    animalId: number;
    displayOrder: number;
    // Data auto-pulled from Animal record
  }[];
};
```

---

#### Fix 19: Expand Service Category Taxonomy

**Priority**: LOW

**Current Categories:**
- STUD_SERVICE
- TRAINING
- GROOMING
- TRANSPORT
- BOARDING
- OTHER_SERVICE

**Spec Categories (15 parent + 80+ subcategories):**
- BREEDING (with subcategories: STUD_SERVICE, WHELPING_SUPPORT, MENTORSHIP, etc.)
- CARE
- EXERCISE
- GROOMING
- TRAINING
- WORKING_DOG
- SERVICE_THERAPY
- TRANSPORT
- HEALTH
- REHABILITATION
- LIVESTOCK
- EXOTIC
- PROPERTY
- CREATIVE
- PRODUCTS

**Full taxonomy in**: `v2-marketplace-management.md` Section 5.2

---

### Navigation Updates Needed

Add seller management links to appropriate navigation:

**BottomTabBar (mobile) or Sidebar:**
```
Seller Dashboard
├── My Storefront (/me/listing)
├── Programs (/me/programs)
├── Animals (/me/animals)      ← NEW
├── Litters (/me/litters)      ← NEW
├── Services (/me/services)
├── Inquiries (/me/inquiries)  ← May need separation
└── Waitlist (/me/waitlist)    ← May need separation
```

---

### Testing Requirements for Phase 1.5

```typescript
// e2e/marketplace-breeder-management.spec.ts

test.describe('Breeder Animal Listings', () => {
  test.beforeEach(async ({ page }) => {
    // Login as breeder
  });

  test('can view animal listings', async ({ page }) => {
    await page.goto('/me/animals');
    // Assert page loads
  });

  test('can create animal listing', async ({ page }) => {
    await page.goto('/me/animals');
    await page.click('text=Create Listing');
    // Select animal
    // Choose intent
    // Set pricing
    // Publish
  });
});

test.describe('Breeder Offspring Groups', () => {
  test('can view offspring groups', async ({ page }) => {
    await page.goto('/me/litters');
  });

  test('can set per-offspring pricing', async ({ page }) => {
    await page.goto('/me/litters');
    // Click into a group
    // Edit offspring price
    // Save
  });
});
```

---

### Summary: Implementation Priority

| Phase | Fix # | Feature | Effort |
|-------|-------|---------|--------|
| 1.5 | 12 | Animal Listings Page | 3-5 days |
| 1.5 | 13 | Offspring Group Listings Page | 3-5 days |
| 1.5 | 14 | Breeder Inquiries View | 1-2 days |
| 1.5 | 15 | Breeder Waitlist View | 1-2 days |
| 2.5 | 16 | Raising Protocols | 2-3 days |
| 2.5 | 17 | Placement Package | 1-2 days |
| 2.5 | 18 | Featured Parents | 2-3 days |
| 2.5 | 19 | Service Taxonomy | 1 day |

**Total Phase 1.5**: 8-14 days
**Total Phase 2.5**: 6-9 days

---

*Document Version 3.0*
*Generated: 2026-01-13*
*Based on: Visual Playwright Audit Evidence + v2-marketplace-management.md Specification*
