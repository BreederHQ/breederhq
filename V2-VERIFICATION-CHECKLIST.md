# Animal Listings V2 - Verification Checklist

## ✅ Backend Verification (Completed by Claude)

### V2 Routes File
- ✅ File exists: `breederhq-api/src/routes/marketplace-v2.ts`
- ✅ All 13 endpoints implemented:
  - **Direct Listings (5 endpoints):**
    - GET `/direct-listings` - List all listings
    - GET `/direct-listings/:id` - Get single listing
    - POST `/direct-listings` - Create/update listing
    - PATCH `/direct-listings/:id/status` - Update status
    - DELETE `/direct-listings/:id` - Delete listing
  - **Animal Programs (8 endpoints):**
    - GET `/animal-programs` - List all programs
    - GET `/animal-programs/:id` - Get single program
    - POST `/animal-programs` - Create/update program
    - PATCH `/animal-programs/:id/publish` - Update published status
    - DELETE `/animal-programs/:id` - Delete program
    - POST `/animal-programs/:id/participants` - Add animals to program
    - DELETE `/animal-programs/:programId/participants/:participantId` - Remove animal from program

### Route Registration
- ✅ V2 routes imported in `server.ts` (line 520)
- ✅ V2 routes registered at `/api/v2/marketplace` prefix (lines 891-933)
- ✅ Authentication middleware configured (tenant-scoped, same as V1)
- ✅ Session validation implemented
- ✅ Tenant membership verification implemented
- ✅ Duplicate V1 routes removed from `breeder-marketplace.ts` (868 lines removed)

### API Server
- ✅ Server running on port 6001 (PID 54292)
- ✅ V2 endpoint responds (returns 401 without auth as expected)

## ✅ Frontend Verification (Completed by Claude)

### API Client Functions
- ✅ All 13 V2 functions added to `client.ts` (lines 3112-3741):
  - Direct Listings: `getDirectListings`, `getDirectListing`, `saveDirectListing`, `updateDirectListingStatus`, `deleteDirectListing`
  - Animal Programs: `getAnimalPrograms`, `getAnimalProgram`, `saveAnimalProgram`, `updateAnimalProgramPublished`, `deleteAnimalProgram`, `addAnimalsToProgram`, `removeAnimalFromProgram`
  - Tenant Animals: `getTenantAnimals` (for animal selector)
- ✅ All functions use correct `/api/v2/marketplace/*` endpoints
- ✅ All functions include `credentials: "include"` for session
- ✅ All functions send `X-Tenant-ID` header

### Pages Created
- ✅ `AnimalProgramsPage.tsx` (318 lines) - Programs list with stats, filters, cards
- ✅ `CreateProgramWizard.tsx` (749 lines) - 7-step guided wizard
- ✅ `ProgramDetailPage.tsx` (554 lines) - 5-tab editing interface
- ✅ `ManageAnimalsPage.tsx` (modified) - Added proper animal selector

### Routing
- ✅ All pages imported in `MarketplaceEmbedded.tsx`
- ✅ Routes configured:
  - `/manage/animal-programs` → AnimalProgramsPage
  - `/manage/animal-programs/new` → CreateProgramWizard
  - `/manage/animal-programs/:programId` → ProgramDetailPage

### Page Integration
- ✅ ManageAnimalsPage uses `getDirectListings` (V2)
- ✅ AnimalProgramsPage uses `getAnimalPrograms` (V2)
- ✅ Both pages properly fetch data on mount

---

## 🔍 Manual Testing Required (User)

### Prerequisites
1. Start the API server: `cd breederhq-api && npm start`
2. Start the frontend: `cd breederhq && npm start`
3. Log in to your breeder account
4. Ensure you have at least 2-3 animals in your account for testing

### Test 1: Direct Listings Management
**Page:** Navigate to `/manage/animals`

#### Test 1.1: View Direct Listings
- [ ] Page loads without errors
- [ ] Stats cards display (Total, Active, Draft, Paused)
- [ ] Any existing listings display as cards
- [ ] Empty state shows if no listings exist

#### Test 1.2: Create New Direct Listing
- [ ] Click "Add Animal Listing" button
- [ ] Drawer opens on the right side
- [ ] Click on "Select Animal" field
- [ ] Animal selector dropdown opens
- [ ] Search for an animal (type in search box)
- [ ] Click an animal card to select it
- [ ] Selected animal displays with photo, breed, sex
- [ ] Choose a template (STUD_SERVICES, REHOME, etc.)
- [ ] Fill in required fields (headline, summary)
- [ ] Set a price or price range
- [ ] Click "Save"
- [ ] Drawer closes
- [ ] New listing appears in the list

#### Test 1.3: Edit Direct Listing
- [ ] Click "Edit" on an existing listing card
- [ ] Drawer opens with pre-filled data
- [ ] Modify headline or description
- [ ] Click "Save"
- [ ] Changes persist and show in card

#### Test 1.4: Change Listing Status
- [ ] Click status dropdown on a listing card
- [ ] Change status (DRAFT → ACTIVE, ACTIVE → PAUSED, etc.)
- [ ] Status updates immediately
- [ ] Stats cards update to reflect new status

#### Test 1.5: Delete Direct Listing
- [ ] Click "Delete" on a listing card
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Listing removed from list
- [ ] Stats cards update

### Test 2: Animal Programs Management
**Page:** Navigate to `/manage/animal-programs`

#### Test 2.1: View Animal Programs
- [ ] Page loads without errors
- [ ] Stats cards display (Total Programs, Published, Draft, Total Participants)
- [ ] Any existing programs display as cards
- [ ] Empty state shows if no programs exist

#### Test 2.2: Create New Program (7-Step Wizard)
- [ ] Click "Create Program" button
- [ ] Wizard opens

**Step 1: Choose Template**
- [ ] 6 template cards display (STUD_SERVICES, GUARDIAN, TRAINED, REHOME, CO_OWNERSHIP, CUSTOM)
- [ ] Click a template (e.g., GUARDIAN)
- [ ] Template description shows
- [ ] "Next" button becomes enabled
- [ ] Click "Next"

**Step 2: Basic Info**
- [ ] Name and slug fields show
- [ ] Enter program name
- [ ] Slug auto-generates from name
- [ ] "Next" button enabled when name filled
- [ ] Click "Next"

**Step 3: Content**
- [ ] Headline, description fields show
- [ ] Character counters display
- [ ] Enter headline and description
- [ ] Click "Next"

**Step 4: Pricing**
- [ ] Price model selector shows (Fixed, Range, Inquire)
- [ ] Select "Fixed Price"
- [ ] Price input appears
- [ ] Enter price
- [ ] Click "Next"

**Step 5: Add Animals**
- [ ] Animal selector shows
- [ ] Search and select 2-3 animals
- [ ] Selected animals display as cards
- [ ] Click "Next"

**Step 6: Settings**
- [ ] Featured toggle shows
- [ ] Published toggle shows
- [ ] Set "Published" to true
- [ ] Click "Next"

**Step 7: Review**
- [ ] All entered data displays in summary
- [ ] Template, name, pricing, animals list shown
- [ ] Click "Create Program"
- [ ] Wizard closes
- [ ] Success message shows
- [ ] Redirected to programs list
- [ ] New program appears in list

#### Test 2.3: View Program Details
- [ ] Click on a program card
- [ ] Program detail page opens
- [ ] 5 tabs display (Overview, Content, Pricing, Participants, Settings)
- [ ] Overview tab shows stats and description
- [ ] Each tab displays correct content

#### Test 2.4: Edit Program
- [ ] On program detail page, click "Edit Mode" toggle
- [ ] Fields become editable
- [ ] Navigate to "Content" tab
- [ ] Edit description
- [ ] Navigate to "Pricing" tab
- [ ] Change price
- [ ] Click "Save Changes"
- [ ] Edit mode toggles off
- [ ] Changes persist
- [ ] Refresh page - changes still there

#### Test 2.5: Manage Participants
- [ ] Navigate to "Participants" tab
- [ ] Existing animals display as cards
- [ ] Click "Add Animals"
- [ ] Animal selector opens
- [ ] Select another animal
- [ ] Click "Add"
- [ ] New animal appears in participants list
- [ ] Click "Remove" on an animal
- [ ] Confirmation dialog appears
- [ ] Confirm removal
- [ ] Animal removed from list

#### Test 2.6: Publish/Unpublish Program
- [ ] Navigate to "Settings" tab
- [ ] Click "Published" toggle
- [ ] Toggle changes state
- [ ] Return to programs list
- [ ] Program status reflects published/draft state
- [ ] Stats cards update

#### Test 2.7: Delete Program
- [ ] On programs list, click "Delete" on a program
- [ ] Confirmation dialog appears
- [ ] Confirm deletion
- [ ] Program removed from list
- [ ] Stats cards update

### Test 3: Integration Tests

#### Test 3.1: Fork Dialog (Direct Listing → Program)
- [ ] On `/manage/animals` page
- [ ] Click "Fork to Program" on a direct listing
- [ ] Dialog explains the two paths
- [ ] Click "Animal Programs" option
- [ ] Redirected to program creation wizard
- [ ] Animal from listing pre-selected

#### Test 3.2: Navigation
- [ ] Click "View Programs" link on ManageAnimalsPage
- [ ] Navigates to `/manage/animal-programs`
- [ ] Click back to `/manage/animals`
- [ ] Navigation works both ways

#### Test 3.3: Filters and Search
**On Direct Listings page:**
- [ ] Filter by status (All, Active, Draft, Paused)
- [ ] List updates to show only matching listings
- [ ] Filter by template type
- [ ] List updates to show only matching templates
- [ ] Search by animal name or headline
- [ ] Results filter in real-time

**On Animal Programs page:**
- [ ] Filter by published status (All, Published, Draft)
- [ ] List updates to show only matching programs
- [ ] Filter by template type
- [ ] List updates to show only matching templates
- [ ] Search by program name
- [ ] Results filter in real-time

### Test 4: Error Handling

#### Test 4.1: Network Errors
- [ ] Open DevTools Network tab
- [ ] Set throttling to "Offline"
- [ ] Try to load `/manage/animals`
- [ ] Error message displays
- [ ] Restore network
- [ ] Retry - data loads

#### Test 4.2: Validation Errors
- [ ] Try to create a direct listing without selecting an animal
- [ ] Validation error shows
- [ ] Try to create a program without a name
- [ ] Validation error shows
- [ ] Try to enter invalid price (negative number)
- [ ] Validation error shows

#### Test 4.3: Authentication
- [ ] Log out
- [ ] Try to access `/manage/animals` directly
- [ ] Redirected to login
- [ ] Log back in
- [ ] Can access pages again

### Test 5: Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Edge
- [ ] Test in Safari (if on Mac)

### Test 6: Performance
- [ ] Create 10+ direct listings
- [ ] Page loads quickly (<2 seconds)
- [ ] Filters respond instantly
- [ ] Create 10+ programs
- [ ] Wizard steps transition smoothly
- [ ] Program detail tabs switch without lag

---

## 🐛 Bug Reporting Template

If you find any issues during testing, please report them with:

```
**Page:** [e.g., /manage/animals]
**Action:** [e.g., Clicked "Add Animal Listing"]
**Expected:** [e.g., Drawer should open]
**Actual:** [e.g., Nothing happened]
**Console Errors:** [Paste any errors from DevTools console]
**Screenshot:** [If applicable]
```

---

## ✅ Sign-Off

Once all tests pass, the Animal Listings V2 implementation is complete and ready for production.

**Tested by:** _______________
**Date:** _______________
**Status:** [ ] All Tests Pass [ ] Issues Found (see bug reports)
