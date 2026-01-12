# Marketplace Completion Plan - Full UI/UX

This document outlines ALL changes needed to complete the marketplace for both breeders and buyers.

---

## PART 1: BREEDER EXPERIENCE

### 1.1 Platform → Marketplace Navigation

**Current State:** Breeders access marketplace via `/marketplace` in platform sidebar, but there's no quick access to management pages.

**Changes Needed:**

| Location | Change |
|----------|--------|
| Platform Dashboard | Add "Marketplace" card with quick links to: My Profile, My Programs, Inquiries |
| Platform Sidebar | Ensure "Marketplace" nav item is prominent |
| MarketplaceLayout header | Add clear "Manage" dropdown for breeders with links to /me/listing, /me/programs, /me/services |

**Files to modify:**
- `apps/platform/src/pages/Dashboard.tsx` - Add marketplace quick actions card
- `apps/marketplace/src/layout/MarketplaceLayout.tsx` - Improve breeder management nav

### 1.2 Breeder Profile Management (`/me/listing`)

**Current State:** ManageListingPage exists with profile editing.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Business info editing | ✅ Working | None |
| Logo upload | ✅ Working | None |
| Location settings | ✅ Working | None |
| Social links | ✅ Working | None |
| Publish/Unpublish | ✅ Working | None |
| Preview before publish | ⚠️ Unclear | Add "Preview" button that opens public profile view |

**Files:** `apps/marketplace/src/management/pages/ManageListingPage.tsx`

### 1.3 Breeding Programs Management (`/me/programs`)

**Current State:** ProgramsSettingsPage has full CRUD.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Create/Edit/Delete programs | ✅ Working | None |
| Toggle marketplace visibility | ✅ Working | None |
| Pricing tiers | ✅ Working | None |
| Inquiries/Waitlist/Reservations toggles | ✅ Working | None |
| Link to offspring groups | ❌ Missing | Add "Manage Litters" link per program |

**Files:** `apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx`

### 1.4 Offspring Group / Litter Management (NEW)

**Current State:** Offspring groups exist in the offspring module but NO UI to publish them as marketplace listings.

**Changes Needed:**

Create new page: `/me/programs/:programId/litters`

| Feature | Implementation |
|---------|----------------|
| List offspring groups for a program | Fetch from breeding module API |
| Create marketplace listing from offspring group | POST to MarketplaceListing with type OFFSPRING_GROUP |
| Set group pricing | Price range (min/max) |
| Set availability count | Number available |
| Toggle listing visibility | Draft/Published |
| Link to individual offspring | Show offspring in group with status |

**New Files:**
- `apps/marketplace/src/management/pages/LittersSettingsPage.tsx`
- `apps/marketplace/src/management/components/LitterCard.tsx`
- `apps/marketplace/src/management/components/LitterForm.tsx`

**API Needed:**
- `GET /api/v1/breeding/programs/:programId/offspring-groups` - List offspring groups
- `POST /api/v1/marketplace/listings` - Create listing from offspring group
- `PUT /api/v1/marketplace/listings/:id` - Update listing

### 1.5 Breeder Services Management (`/me/services`)

**Current State:** ServicesSettingsPage has full CRUD. ✅ Working.

**No changes needed.**

### 1.6 Inquiry Management (`/inquiries`)

**Current State:** InquiriesPage shows conversations and waitlist. Uses demo mode.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| View conversations | ⚠️ Demo-backed | Wire to real messaging API |
| Reply to inquiries | ⚠️ Demo-backed | Wire to real messaging API |
| View waitlist requests | ⚠️ Demo-backed | Wire to real waitlist API |
| Approve/Decline waitlist | ❌ Missing | Add approve/decline actions |
| Send deposit invoice | ❌ Missing | Add "Request Deposit" action |

**Files:**
- `apps/marketplace/src/marketplace/pages/InquiriesPage.tsx`
- `apps/marketplace/src/messages/adapter.ts` - Remove demo mode

### 1.7 Breeder Dashboard (NEW)

**Current State:** No dashboard showing marketplace performance.

**Changes Needed:**

Create new page: `/me/dashboard` or enhance `/me/listing`

| Metric | Source |
|--------|--------|
| Profile views | Track via API |
| Total inquiries | Count from MessageThread |
| Pending waitlist requests | Count from WaitlistEntry |
| Active listings | Count from MarketplaceListing |

**New Files:**
- `apps/marketplace/src/management/pages/BreederDashboardPage.tsx`
- Or add stats section to existing ManageListingPage

---

## PART 2: BUYER EXPERIENCE

### 2.1 Homepage (`/`)

**Current State:** Shows intent cards + demo-only featured section.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Intent cards (Animals, Breeders, Services) | ✅ Working | None |
| Featured section | ❌ Demo only | Option A: Remove entirely / Option B: Wire to real featured API |
| "Manage My Listing" button for breeders | ✅ Working | None |

**Recommendation:** Remove featured section for MVP, add back later with real data.

**Files:** `apps/marketplace/src/marketplace/pages/HomePage.tsx`

### 2.2 Breeders Browse (`/breeders`)

**Current State:** BreedersIndexPage fetches from real API. ✅ Working.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| List published breeders | ✅ Working | None |
| Search/filter | ⚠️ Basic | Add species/breed filter |
| Breeder avatars | ⚠️ Initials only | Wire to asset URLs when available |
| Pagination | ⚠️ Unclear | Verify pagination works |

**Files:** `apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx`

### 2.3 Breeder Profile (`/breeders/:slug`)

**Current State:** BreederPage shows full profile with programs.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Profile info display | ✅ Working | None |
| Programs list | ✅ Working | None |
| "Message Breeder" button | ❌ Demo only | Always show, wire to real API |
| "Join Waitlist" modal | ✅ Working | None |
| Standards/credentials | ✅ Working | None |

**Files:** `apps/marketplace/src/marketplace/pages/BreederPage.tsx`

### 2.4 Program Detail (`/programs/:slug`)

**Current State:** ProgramPage shows program with litters section.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Program info | ✅ Working | None |
| Pricing tiers | ✅ Working | None |
| Available Litters section | ⚠️ Uses hook | Verify real API integration |
| "Message Breeder" button | ❌ Demo only | Always show |

**Files:** `apps/marketplace/src/marketplace/pages/ProgramPage.tsx`

### 2.5 Litter/Offspring Group Detail (`/programs/:slug/offspring-groups/:listingSlug`)

**Current State:** ListingPage shows litter with offspring and inquiry form.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Litter info display | ⚠️ Demo-backed | Wire to real API |
| Offspring list | ⚠️ Demo-backed | Wire to real API |
| Inquiry form | ⚠️ Demo-backed | Wire to real API |
| Price display | ⚠️ Demo-backed | Wire to real API |

**Files:** `apps/marketplace/src/marketplace/pages/ListingPage.tsx`

### 2.6 Animals Browse (`/animals`)

**Current State:** Mixed - real API for animal listings, demo for litters.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Program Animal listings | ✅ Real API | None |
| Litter/offspring group listings | ❌ Demo only | Wire to real offspring groups API |
| Boosted items | ❌ Demo only | Remove or wire to real featured API |
| Search/filter | ✅ Working | None |
| View tabs (All/Animals/Litters) | ✅ Working | None |

**Files:** `apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx`

### 2.7 Services Browse (`/services`)

**Current State:** 100% demo-backed, shows "coming soon" in real mode.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| List published services | ❌ No API | Create browse endpoint + wire UI |
| Filter by type | ❌ Demo only | Wire to real filter |
| Service cards | ✅ UI exists | Wire to real data |
| Boosted items | ❌ Demo only | Remove for MVP |

**Files:** `apps/marketplace/src/marketplace/pages/ServicesPage.tsx`

**API Needed:** `GET /api/v1/marketplace/services` - Browse published services

### 2.8 Buyer Conversations (`/inquiries`)

**Current State:** Full UI exists but demo-backed.

**Changes Needed:**

| Feature | Status | Change |
|---------|--------|--------|
| Conversation list | ⚠️ Demo-backed | Wire to real messaging API |
| Thread view | ⚠️ Demo-backed | Wire to real messaging API |
| Send message | ⚠️ Demo-backed | Wire to real messaging API |
| Waitlist tab | ⚠️ Demo-backed | Wire to real waitlist API |
| Pay deposit button | ✅ Stripe ready | Verify works |

**Files:**
- `apps/marketplace/src/marketplace/pages/InquiriesPage.tsx`
- `apps/marketplace/src/messages/adapter.ts`

### 2.9 Updates/Notifications (`/updates`)

**Current State:** 100% demo-backed.

**Changes Needed:**

| Option | Description |
|--------|-------------|
| Option A | Remove page entirely for MVP |
| Option B | Show empty state "No updates yet" without demo option |
| Option C | Wire to real notifications API if it exists |

**Recommendation:** Option B - Show empty state, remove demo toggle.

**Files:** `apps/marketplace/src/marketplace/pages/UpdatesPage.tsx`

---

## PART 3: BACKEND API ADDITIONS

### 3.1 Public Services Browse

**File:** `breederhq-api/src/routes/public-marketplace.ts`

```
GET /api/v1/marketplace/services
Query: type, search, city, state, page, limit
Returns: Published MarketplaceListing where listingType is service type
```

### 3.2 Public Offspring Groups Browse

**File:** `breederhq-api/src/routes/public-marketplace.ts`

```
GET /api/v1/marketplace/offspring-groups
Query: species, breed, search, page, limit
Returns: Published offspring group listings with breeder attribution
```

### 3.3 Breeder Offspring Groups (for management)

**File:** `breederhq-api/src/routes/breeding-programs.ts` or new file

```
GET /api/v1/breeding/programs/:programId/offspring-groups
Returns: Offspring groups for a program (for breeder to create listings from)
```

---

## PART 4: DEMO MODE REMOVAL

### Files to Modify (Remove demo imports/checks)

1. `layout/MarketplaceLayout.tsx` - Remove demo toggle
2. `marketplace/pages/HomePage.tsx` - Remove demo featured
3. `marketplace/pages/ServicesPage.tsx` - Wire to real API
4. `marketplace/pages/AnimalsIndexPage.tsx` - Wire litters to real API
5. `marketplace/pages/ListingPage.tsx` - Wire to real API
6. `marketplace/pages/ProgramPage.tsx` - Enable messaging button
7. `marketplace/pages/InquiriesPage.tsx` - Wire to real messaging
8. `marketplace/pages/UpdatesPage.tsx` - Show empty state
9. `marketplace/hooks/useProgramsQuery.ts` - Remove demo branch
10. `marketplace/hooks/useProgramListingsQuery.ts` - Remove demo branch
11. `marketplace/hooks/useProgramQuery.ts` - Remove demo branch
12. `messages/adapter.ts` - Always use server adapter

### Files to Delete

- `demo/demoMode.ts`
- `demo/mockData.ts`
- `demo/inquiryOutbox.ts`

---

## PART 5: IMPLEMENTATION ORDER

### Phase 1: Backend APIs
1. Add `GET /marketplace/services` endpoint
2. Add `GET /marketplace/offspring-groups` endpoint
3. Verify messaging backend is working

### Phase 2: Breeder Management UI
1. Add litter management page (`/me/programs/:id/litters`)
2. Add breeder dashboard stats
3. Wire inquiry management to real API
4. Add waitlist approve/decline actions

### Phase 3: Buyer Browse Pages
1. Wire ServicesPage to real API
2. Wire AnimalsIndexPage litters to real API
3. Wire ListingPage to real API
4. Enable messaging buttons everywhere

### Phase 4: Demo Removal
1. Remove demo mode from each file
2. Delete demo files
3. Test all flows with real (empty) data

### Phase 5: Polish
1. Add loading states
2. Add empty states
3. Add error handling
4. Test end-to-end flows

---

## SUMMARY: What's Being Built

### For Breeders:
- ✅ Profile management (exists)
- ✅ Programs management (exists)
- ✅ Services management (exists)
- 🆕 Litter/offspring group listing management
- 🆕 Dashboard with stats
- 🔧 Inquiry management (wire to real API)
- 🔧 Waitlist management with approve/decline

### For Buyers:
- ✅ Browse breeders (exists, working)
- 🔧 Browse services (wire to real API)
- 🔧 Browse animals/litters (wire litters to real API)
- 🔧 View litter details (wire to real API)
- 🔧 Send inquiries (wire to real API)
- ✅ Join waitlist (exists)
- 🔧 View conversations (wire to real API)
- ❌ Notifications (defer or empty state)

### Backend:
- 🆕 Public services browse endpoint
- 🆕 Public offspring groups browse endpoint
- 🔧 Verify messaging endpoints work

---

## QUESTIONS BEFORE IMPLEMENTATION

1. **Litter Management:** Should litters be created FROM the offspring module (platform) and then "published" to marketplace? Or should marketplace have its own litter creation?

2. **Messaging Backend:** Is the messaging backend (`/marketplace/messages/*`) fully functional? Or does it need work?

3. **Notifications:** Should we implement real notifications or just show empty state for MVP?

4. **Featured/Boosted:** Remove entirely or defer to future?

5. **Waitlist Management:** Where should breeders approve/decline waitlist requests - in marketplace or in platform CRM?
