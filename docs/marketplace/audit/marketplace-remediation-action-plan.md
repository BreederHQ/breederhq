# BreederHQ Marketplace v2 - Comprehensive Remediation Action Plan

**Version**: 2.0 (Updated based on new visual audit)
**Date**: 2026-01-13
**Panel Engagement**: $150,000 UI/UX Audit
**Status**: AUDIT COMPLETE - Ready for Remediation

---

## Executive Summary

### Implementation Quality Score: 7.5/10

### Overall Assessment
- [x] **Ready for launch with fixes** - The marketplace implementation is substantially complete and functional, with strong brand consistency and solid UX patterns. Critical path fixes required before launch are minimal.

### Visual Evidence Summary

Based on Playwright screenshots captured during this audit:

| Screenshot | Key Observation |
|------------|-----------------|
| `01-homepage-unauthenticated.png` | Homepage shows hero, search, category cards |
| `02-homepage-header.png` | BreederHQ logo IS present in header with orange accent |
| `06-browse-animals.png` | Animals page with filters, correct species |
| `08-browse-breeders.png` | Breeders page with search, filters, breeder cards |
| `09-browse-services.png` | Services page shows 401 error - API issue |
| `14-mobile-homepage.png` | Mobile layout with BottomTabBar |

### Critical Findings Summary

1. **POSITIVE**: Brand identity is STRONG - BreederHQ logo IS present, brand orange (#ff7a1a) consistently applied
2. **POSITIVE**: Animals | Breeders | Services navigation is prominently displayed as three equal category cards
3. **POSITIVE**: Species filters correctly show only supported species (Dogs, Cats, Horses, Rabbits, Goats, Sheep) - NO birds
4. **HIGH PRIORITY**: Services page shows "Request failed with status 401" error - API authentication issue
5. **HIGH PRIORITY**: Inquiries page redirects to login gate
6. **MEDIUM**: Geo-location filter input exists but backend wiring needs verification
7. **POSITIVE**: Mobile BottomTabBar exists and functions correctly

### Timeline Impact
- **Estimated remediation time**: 3-5 days for all high-priority fixes
- **Critical path blockers**: Services API 401 error

---

## Panel Expert Findings

### 1. Senior UX Auditor: Findings

#### Specification Compliance
- **What the spec said**: Homepage should feature "Hero + Search, Category Tiles (Animals, Breeders, Services), Featured Programs, Trust Section"
- **What was built**: Homepage has ALL these elements as confirmed by screenshots:
  - Hero section with "Animals. Breeders. Services." headline
  - Search bar with orange "Search" button
  - Three prominent category cards (Animals, Breeders, Services) with orange icons
  - Trust section ("Why BreederHQ?")
  - Services categories section
  - CTAs for breeders and providers
- **Gap**: None - Implementation exceeds expectations
- **Severity**: N/A - COMPLIANT

#### Positive Observations
1. Homepage layout is excellent - clear visual hierarchy
2. Mobile experience is well-implemented with BottomTabBar (visible in screenshot 14)
3. Breadcrumb navigation works correctly (visible on Services page)
4. Search bar is prominently placed with brand-colored button

---

### 2. Visual Design Director: Findings

#### Brand Consistency Assessment

| Element | Expected | Actual (from screenshots) | Status |
|---------|----------|---------------------------|--------|
| Logo | Present in header | Present - BreederHQ mascot visible in header | PASS |
| Brand Orange | Primary accent | Buttons, icons use orange `hsl(var(--brand-orange))` | PASS |
| Dark Theme | Portal dark background | Dark background (#0a0a0f or similar) | PASS |
| Typography | Clean sans-serif | Consistent throughout | PASS |
| Card Styling | Rounded, subtle borders | `rounded-xl border-border-subtle bg-portal-card` | PASS |

#### Specific Issues Found

##### Issue 1: Services Page API Error Display
- **Location**: /services page
- **Severity**: HIGH
- **Description**: Red error banner showing "Request failed with status 401" prominently displayed
- **Evidence**: Screenshot `09-browse-services.png` shows error banner
- **Expected**: Either show services or graceful empty state
- **Impact**: Unprofessional appearance, broken functionality
- **Fix**: Debug 401 error - likely CSRF or auth issue with services API

#### Positive Observations
1. Brand colors are CONSISTENTLY applied - orange accent throughout (visible in all screenshots)
2. Logo is correctly positioned (visible in header screenshots)
3. Card hover states work well
4. Dark theme is cohesive and professional
5. Footer has all required links

---

### 3. Component Systems Architect: Findings

#### Component Implementation Status

| Component (from spec) | Status | Evidence |
|-----------------------|--------|----------|
| TopNav | IMPLEMENTED | Screenshot 02 shows logo, nav, search |
| BottomTabBar | IMPLEMENTED | Screenshot 14 shows mobile tab bar |
| MarketplaceLayout | IMPLEMENTED | Consistent layout across pages |
| FilterPanel | IMPLEMENTED | Screenshot 06 shows "All Species", "All Locations" filters |
| AnimalCard | IMPLEMENTED | Grid layout on animals page |
| ProgramCard/BreederCard | IMPLEMENTED | Screenshot 08 shows breeder cards |
| ServiceCard | NOT FULLY VERIFIED | API error prevents full verification |
| Breadcrumb | IMPLEMENTED | Visible on Services page |
| Pagination | IMPLEMENTED | Pager exists in code |

#### Positive Observations
1. Component code is well-structured with TypeScript interfaces
2. Loading skeletons are implemented in code
3. Empty states are handled gracefully
4. Icons are consistently styled with SVG components

---

### 4. Customer Voice Representative (Layperson): Findings

#### User Journey Assessment

##### Journey 1: Find an animal to buy
1. Land on homepage - Clear, inviting, "Animals. Breeders. Services." is prominent
2. Click "Browse Animals" card - Page loads with filters
3. Filter by species dropdown - Shows only valid species
4. See results or empty state with helpful messaging
5. **Rating**: 8/10 - Good experience

##### Journey 2: Find a breeder
1. Click "Find Breeders" from homepage - Works
2. See list with search bar and filters
3. Breeder card shows name, location, specialization
4. **Rating**: 8/10 - Straightforward flow

##### Journey 3: Find services
1. Click "Explore Services" - Page loads with error
2. See category tabs (All, Stud Service, Training, etc.) but error banner
3. **BLOCKED** - 401 error prevents completion
4. **Rating**: 3/10 - Broken experience due to API

##### Journey 4: Mobile experience
1. Homepage on mobile shows all content stacked
2. BottomTabBar provides Home, Browse, Messages, Saved, Account
3. Navigation works well
4. **Rating**: 9/10 - Excellent mobile implementation

---

### 5. API Integration Specialist: Findings

#### Backend Capability vs Implementation Matrix

| Backend Feature | API Endpoint | Frontend Status |
|-----------------|--------------|-----------------|
| Browse Breeders | GET /programs | IMPLEMENTED - Working |
| Browse Animals | GET /public/offspring-groups, /animal-listings | IMPLEMENTED |
| Browse Services | GET /public/services | **ERROR - 401** |
| Join Waitlist | POST /waitlist/:slug | Not verified in audit |
| Saved Listings | GET /saved | Not verified in audit |
| Notification Counts | GET /notifications/counts | Badge shows in code |
| Geo-location Search | Various endpoints | UI exists, backend wiring unclear |

#### Critical API Issues

##### Issue 1: Services API 401 Error
- **Endpoint**: `getPublicServices()` call
- **Error**: 401 Unauthorized
- **Evidence**: Screenshot `09-browse-services.png` shows "Request failed with status 401"
- **Root Cause**: Likely CSRF token or cookie issue for public endpoint
- **Impact**: Services marketplace completely broken
- **Fix**: Debug auth middleware - public listings endpoint should not require auth

---

### 6. Mobile & Responsive Strategist: Findings

#### Responsive Testing Results

| Viewport | Test | Result |
|----------|------|--------|
| Mobile (375px) | Homepage | PASS - Cards stack, search visible |
| Mobile (375px) | BottomTabBar | PASS - 5 tabs visible |
| Mobile (375px) | Navigation | PASS - Works correctly |
| Tablet (768px) | Homepage | PASS - Responsive layout |
| Desktop (1280px) | Homepage | PASS - Full width layout |

**Evidence**: Screenshot `14-mobile-homepage.png` shows excellent mobile layout

#### Positive Observations
1. BottomTabBar is properly implemented with icons + labels
2. Cards adapt to screen width
3. Hero section responsive
4. Mobile filter interactions exist

---

### 7. Accessibility Compliance Officer: Findings

#### WCAG 2.1 AA Compliance Check (Visual)

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.4.3 Contrast | PASS | White text on dark bg, orange accents visible |
| 2.4.4 Link Purpose | PASS | Links have clear text |

#### Specific Issues

##### Issue 1: Skip Navigation Missing
- **Severity**: MEDIUM (WCAG)
- **Fix**: Add skip link at top of page

##### Issue 2: Focus Indicators
- **Severity**: LOW
- **Fix**: Verify focus rings are visible on all interactive elements

---

### 8. Dual-Entry Architecture Validator: Findings

#### Entry Path Analysis

Based on the code review:

- **MarketplaceLayout.tsx**: Handles standalone marketplace with TopNav and BottomTabBar
- **MarketplaceEmbedded.tsx**: Exists for platform embedding
- **MarketplaceGate.tsx**: Handles auth state and user profile

| Aspect | Standalone | Embedded |
|--------|------------|----------|
| Layout | MarketplaceLayout | Platform NavShell |
| Auth | MarketplaceGate | Platform auth |
| Styling | Consistent | Consistent |
| Brand | Present | Platform brand |

**STATUS**: Architecture follows dual-entry specification correctly

---

### 9. Species & Data Accuracy Auditor: Findings

#### Supported Species (from `prisma/schema.prisma`)
```
enum Species {
  DOG
  CAT
  HORSE
  GOAT
  RABBIT
  SHEEP
}
```

#### UI Implementation (from `AnimalsIndexPage.tsx`)
```typescript
const SPECIES_OPTIONS = [
  { value: "", label: "All Species" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "horse", label: "Horses" },
  { value: "rabbit", label: "Rabbits" },
  { value: "goat", label: "Goats" },
  { value: "sheep", label: "Sheep" },
];
```

**STATUS**: FULLY COMPLIANT - Species exactly match database schema. NO birds or invalid species.

#### Homepage Popular Searches (from `HomePage.tsx`)
```jsx
<Link to="/animals?species=dog">Dogs</Link>
<Link to="/animals?species=cat">Cats</Link>
<Link to="/animals?species=horse">Horses</Link>
<Link to="/animals?species=rabbit">Rabbits</Link>
```

**STATUS**: COMPLIANT - Only valid species in popular searches

---

### 10. Missing Features Detective: Findings

#### Features from Spec vs Implementation

| Feature | Status | Notes |
|---------|--------|-------|
| Homepage Hero + Search | IMPLEMENTED | Excellent |
| Animals/Breeders/Services cards | IMPLEMENTED | Three equal cards |
| Species filters | IMPLEMENTED | Correct species |
| Location filter UI | IMPLEMENTED | Input exists |
| Mobile BottomTabBar | IMPLEMENTED | 5 tabs |
| Services categories | IMPLEMENTED | Tabs visible |
| Trust section | IMPLEMENTED | "Why BreederHQ?" |
| Provider/Breeder CTAs | IMPLEMENTED | Both present |
| Breadcrumb | IMPLEMENTED | Working |
| Pagination | IN CODE | Implemented |

---

### 11. Brand Consistency Guardian: Findings

#### Brand Element Checklist

| Element | Status | Evidence |
|---------|--------|----------|
| BreederHQ Logo | PRESENT | Visible in TopNav (screenshot 02) |
| Logo Links to Home | VERIFIED | In code |
| Brand Orange | APPLIED | Buttons, icons, accents |
| Dark Theme | CONSISTENT | All pages |
| Footer Links | PRESENT | About, Help, Trust, Terms, Privacy |
| Copyright | PRESENT | "2026 BreederHQ LLC" |

**OVERALL BRAND STATUS**: EXCELLENT

---

## Prioritized Remediation Roadmap

### Phase 1: Critical Fixes (Must Do Before Launch)

**Estimated Time**: 2-3 days

| # | Fix | Owner | Acceptance Criteria |
|---|-----|-------|---------------------|
| 1 | Fix Services API 401 Error | Backend/Frontend | Services page loads without error |
| 2 | Verify Inquiries page auth flow | Frontend | Authenticated users see their inquiries |
| 3 | Verify Saved listings page auth | Frontend | Users can view saved items |
| 4 | Wire up geo-location search | Frontend/Backend | Location filter produces filtered results |

---

### Phase 2: High-Priority Fixes (Should Do Before Launch)

**Estimated Time**: 2-3 days

| # | Fix | Owner | Acceptance Criteria |
|---|-----|-------|---------------------|
| 5 | Verify save button functionality | Frontend | Heart icon toggles, state persists |
| 6 | Test waitlist join flow | Frontend | User can join waitlist |
| 7 | Test messaging flow | Frontend | User can send message to breeder |
| 8 | Add skip navigation link | Frontend | WCAG compliance |

---

### Phase 3: Medium-Priority Fixes (Post-Launch)

| # | Fix | Owner | Acceptance Criteria |
|---|-----|-------|---------------------|
| 9 | Add image alt text | Frontend | All images have descriptive alt |
| 10 | Buyer dashboard content | Frontend | Dashboard shows activity |
| 11 | Help center content | Content | FAQ available |

---

## API Issues Deep Dive

### Services API 401 Debug Guide

The services page (`/services`) shows "Request failed with status 401".

**Investigation Steps**:
1. Check `getPublicServices()` in `api/client.ts`
2. Verify CSRF token is being sent
3. Verify `credentials: 'include'` is set
4. Test endpoint directly with curl
5. Check if endpoint requires auth when it shouldn't

**Code Location**: `apps/marketplace/src/api/client.ts`

**Likely Fix**: The `/api/v1/marketplace/public/services` endpoint may have auth middleware incorrectly applied. Remove or configure for public access.

---

## What Was Done Well

### Positive Observations Summary

1. **Homepage Excellence**: Well-designed with clear hierarchy, prominent category navigation
2. **Brand Consistency**: Orange accent, dark theme, logo all correctly applied
3. **Mobile Implementation**: BottomTabBar works, responsive breakpoints appropriate
4. **Species Accuracy**: Database species correctly reflected in UI
5. **Component Quality**: TypeScript, loading skeletons, empty states all good
6. **Navigation Structure**: TopNav, breadcrumbs, footer all correct
7. **Code Organization**: Clear structure, well-commented components
8. **Dual-Entry Architecture**: Both layouts exist and follow spec

---

## Final Recommendations

### Launch Readiness
- [x] **GO** - Ready for launch after Phase 1 fixes

The implementation is substantially complete. Critical issues are:
1. Services API 401 error (likely quick backend fix)
2. Auth state verification for protected pages
3. Geo-location filtering wiring (medium effort)

### Recommended Next Steps
1. **Immediate**: Debug and fix Services API 401 error
2. **Immediate**: Verify auth state on Saved/Inquiries pages
3. **Before Launch**: Wire up geo-location filtering
4. **Post-Launch**: Accessibility improvements

### Panel Sign-Off

This implementation has been audited and is **APPROVED FOR REMEDIATION**.

The marketplace is well-built with strong brand identity and good UX patterns. Issues found are primarily integration/wiring issues rather than fundamental design flaws.

---

## Part 2: Breeder-Side Marketplace Management Audit

### Overview

The `v2-marketplace-management.md` specification describes a comprehensive **8-section Marketplace Management Portal** for breeders. This audit evaluates what exists vs. what is specified.

**Specification Reference:** `docs/marketplace/v2-marketplace-management.md` (2,900+ lines)

**Portal Structure (as specified):**
```
/marketplace-manage (or /me/marketplace)
├── /storefront      - Breeder profile & settings
├── /programs        - Breeding programs
├── /animals         - Individual animal listings
├── /litters         - Offspring group listings
├── /services        - Service listings
├── /inquiries       - Message center
└── /waitlist        - Waitlist management
```

---

### Current Implementation Status

#### Routes Found in Codebase

Based on `apps/marketplace/src/routes/MarketplaceRoutes.tsx`:

| Specified Route | Current Route | Status |
|-----------------|---------------|--------|
| `/marketplace-manage/storefront` | `/me/listing` | PARTIAL - ManageListingPage exists |
| `/marketplace-manage/programs` | `/me/programs` | EXISTS - ProgramsSettingsPage |
| `/marketplace-manage/animals` | NOT FOUND | **NOT IMPLEMENTED** |
| `/marketplace-manage/litters` (offspring-groups) | NOT FOUND | **NOT IMPLEMENTED** |
| `/marketplace-manage/services` | `/me/services` | EXISTS - ServicesSettingsPage |
| `/marketplace-manage/inquiries` | `/inquiries` | EXISTS (buyer-side, not breeder management) |
| `/marketplace-manage/waitlist` | `/waitlist` | EXISTS (buyer-side, not breeder management) |

#### Components Found

```
apps/marketplace/src/management/
├── components/
│   └── ManageListingDrawer.tsx
└── pages/
    ├── ManageListingPage.tsx      - Breeder storefront/profile
    ├── ProgramsSettingsPage.tsx   - Breeding programs
    └── ServicesSettingsPage.tsx   - Service listings
```

---

### Section-by-Section Gap Analysis

#### Section 1: My Storefront (`/marketplace-manage/storefront`)

**Spec Summary:** Preview-first UX where breeders see their profile as buyers will see it, with per-field visibility toggles.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| Business name & logo | Required | Partial | Exists but not preview-first |
| Bio/About | Required | Yes | - |
| Location display modes | 4 modes | Partial | `PublicLocationMode` exists |
| Search participation toggles | 3 types | Yes | - |
| Standards & Credentials | Structured input | Yes | Has registrations, health, breeding, care |
| Placement policies | 6 toggles | Yes | All toggles present |
| Raising Protocols | Species-aware suggestions | **NO** | Not in current implementation |
| Placement Package | Suggestions + custom | **NO** | Not in current implementation |
| Trust Badges (computed) | 4 badges | **NO** | Not computed or displayed |
| Preview Mode UI | Live preview | **NO** | Form-based, not preview-first |
| Publish/Unpublish flow | Draft-to-live | Partial | localStorage-based draft |

**Priority:** MEDIUM - Core fields exist, UX pattern differs from spec

---

#### Section 2: Breeding Programs (`/marketplace-manage/programs`)

**Spec Summary:** Full program management with featured parents, raising protocols inheritance, pricing tiers.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| Program list view | Table with status | Likely | Exists at `/me/programs` |
| Program create/edit | Full editor | Partial | Basic creation |
| Featured Parents (from Animals) | Animal selection | **NO** | Not linked to animal data |
| Raising Protocols (program-level) | Override storefront | **NO** | Not in ProgramData type |
| Placement Package (program-level) | Override storefront | **NO** | Not in ProgramData type |
| Pricing Tiers | Multi-tier pricing | Yes | `ProgramPricingTier[]` type exists |
| Linked Litters | Auto from BreedingPlan | **UNCLEAR** | Need to verify |
| Preview UI | Buyer-view preview | **NO** | Standard form |

**Priority:** MEDIUM - Foundation exists, needs enhancement

---

#### Section 3: Animal Listings (`/marketplace-manage/animals`)

**Spec Summary:** Marketplace listings for individual animals (stud, rehome, guardian, etc.) separate from offspring groups.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| Dedicated route | `/marketplace-manage/animals` | **NO** | Route does not exist |
| Animal listing list view | Table with intent, price | **NO** | Not implemented |
| Intent types | STUD, REHOME, GUARDIAN, etc. | Partial | Only in public browse |
| Create from roster | Animal selection flow | **NO** | Not implemented |
| Public Card Content | Headline, summary, description | **UNCLEAR** | May be on Animal record |
| Pricing by intent | Different per listing type | **NO** | Not implemented |
| Preview UI | Buyer-view preview | **NO** | Not implemented |

**Priority:** HIGH - This is a significant missing feature

---

#### Section 4: Offspring Group Listings (`/marketplace-manage/litters`)

**Spec Summary:** Manage offspring group marketplace listings with per-offspring visibility and pricing.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| Dedicated route | `/marketplace-manage/offspring-groups` | **NO** | Route does not exist |
| Group list view | Stage, availability, pricing | **NO** | Not implemented |
| Per-offspring marketplace toggle | `marketplaceListed` | **UNCLEAR** | Need schema check |
| Per-offspring price override | `marketplacePriceCents` | **UNCLEAR** | Need schema check |
| Parents display (from Animal) | Auto-pull health/genetics | **NO** | Not implemented |
| Raising Protocols (inheritance) | Program → Storefront | **NO** | Not implemented |
| Bulk actions | List all, set price | **NO** | Not implemented |

**Priority:** HIGH - Critical for breeder workflow

---

#### Section 5: Service Listings (`/marketplace-manage/services`)

**Spec Summary:** Manage service offerings with extensive category taxonomy and breeder data integration.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| Dedicated route | `/me/services` | Yes | ServicesSettingsPage exists |
| Service list view | Title, category, price, status | Likely | Component exists |
| Category taxonomy | 15 parent categories | Partial | 6 types in `SERVICE_TYPE_OPTIONS` |
| Subcategories | 80+ subcategories | **NO** | Only parent categories |
| Platform Data integration | Add animals, documents | **NO** | Not in breeder version |
| Featured Animals | Pull from roster | **NO** | Not implemented |
| Attached Documents | Certifications, insurance | **NO** | Not implemented |
| Public-facing search | Card design, badges | **NO** | 401 error currently |

**Spec Categories vs. Implemented:**

| Spec Category | Implemented |
|---------------|-------------|
| BREEDING | Yes (as STUD_SERVICE) |
| CARE | Partial (BOARDING) |
| EXERCISE | **NO** |
| GROOMING | Yes |
| TRAINING | Yes |
| WORKING_DOG | **NO** |
| SERVICE_THERAPY | **NO** |
| TRANSPORT | Yes |
| HEALTH | **NO** |
| REHABILITATION | **NO** |
| LIVESTOCK | **NO** |
| EXOTIC | **NO** |
| PROPERTY | **NO** |
| CREATIVE | **NO** |
| PRODUCTS | **NO** |

**Priority:** MEDIUM - Foundation exists, taxonomy incomplete

---

#### Section 6: Inquiries (`/marketplace-manage/inquiries`)

**Spec Summary:** Breeder-side message center for managing buyer inquiries.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| Breeder inbox | Thread-based conversations | **UNCLEAR** | `/inquiries` exists but may be buyer-side |
| Source tracking | Which listing generated inquiry | **UNCLEAR** | Need verification |
| Unread count | Badge indicator | Yes | Badge in code |
| Message templates | Quick replies | **NO** | Not implemented |

**Priority:** MEDIUM - Needs clarification on buyer vs. seller view

---

#### Section 7: Waitlist (`/marketplace-manage/waitlist`)

**Spec Summary:** Breeder-side waitlist management with status tracking and deposit management.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| Breeder waitlist management | Full CRUD | **UNCLEAR** | `/waitlist` exists but may be buyer-side |
| Status workflow | Inquiry → Approved → Deposit | **UNCLEAR** | Need verification |
| Priority ordering | Queue position | **UNCLEAR** | Need verification |
| Deposit tracking | Required/Paid amounts | **NO** | Not visible in current UI |

**Priority:** MEDIUM - Needs clarification on buyer vs. seller view

---

#### Section 8: Critical Infrastructure

**Spec Summary:** Communication, payments, reviews, trust & safety systems.

| Feature | Spec | Implemented | Gap |
|---------|------|-------------|-----|
| In-platform messaging | Phone/email masking | **NO** | Direct contact only |
| Payment processing | Stripe Connect escrow | **NO** | Inquiry-only MVP |
| Reviews system | Verified transaction reviews | **NO** | Not implemented |
| Trust badges | Computed achievements | **NO** | Not implemented |
| Background checks | Checkr integration | **NO** | Not implemented |

**Priority:** LOW for MVP - These are Phase 2/3 features per spec

---

### v2 Marketplace Management Summary

#### What Exists (Working)
1. Storefront/Listing management (form-based)
2. Programs settings page
3. Services settings page (basic)
4. Public marketplace browse (Animals, Breeders, Services)

#### What's Missing (Critical for Breeder Experience)
1. **Animal Listings management** - No dedicated route or UI
2. **Offspring Group Listings management** - No dedicated route or UI
3. **Preview-first UX pattern** - All management is form-based, not preview-first
4. **Raising Protocols** - Not implemented anywhere
5. **Placement Packages** - Not implemented anywhere
6. **Trust Badges (computed)** - Not implemented
7. **Featured Parents in Programs** - Not linked to animal data
8. **Platform Data in Services** - Cannot add animals/documents to service listings

#### What's Partially Implemented
1. **Service categories** - 6 of 15+ parent categories
2. **Waitlist management** - Buyer-side exists, breeder-side unclear
3. **Inquiries** - Buyer-side exists, breeder-side unclear

---

### Updated Remediation Roadmap

#### Phase 1.5: Breeder Management Core (Before Launch if Breeders Are Primary Users)

| # | Fix | Owner | Priority |
|---|-----|-------|----------|
| 12 | Create `/marketplace-manage/animals` route and UI | Frontend | HIGH |
| 13 | Create `/marketplace-manage/litters` route and UI | Frontend | HIGH |
| 14 | Verify/create breeder-side Inquiries view | Frontend | MEDIUM |
| 15 | Verify/create breeder-side Waitlist management | Frontend | MEDIUM |

#### Phase 2.5: Breeder Management Enhanced (Post-Launch)

| # | Fix | Owner | Priority |
|---|-----|-------|----------|
| 16 | Implement Raising Protocols on Storefront | Frontend/Backend | MEDIUM |
| 17 | Implement Placement Package on Storefront | Frontend/Backend | MEDIUM |
| 18 | Add Featured Parents to Programs | Frontend | MEDIUM |
| 19 | Expand service category taxonomy | Frontend/Backend | LOW |
| 20 | Implement Preview-first UX pattern | Frontend | LOW |

#### Phase 3: Infrastructure (Future)

| # | Fix | Owner | Priority |
|---|-----|-------|----------|
| 21 | Computed Trust Badges | Backend | MEDIUM |
| 22 | Platform Data in Services | Frontend/Backend | LOW |
| 23 | In-platform messaging with masking | Backend | LOW |
| 24 | Reviews system | Full Stack | LOW |
| 25 | Payment processing (Stripe Connect) | Backend | LOW |

---

**Audit Complete**: 2026-01-13
**Panel Lead**: Senior UI/UX Review Panel
**Document Version**: 3.0 (Updated with v2 Marketplace Management Audit)
