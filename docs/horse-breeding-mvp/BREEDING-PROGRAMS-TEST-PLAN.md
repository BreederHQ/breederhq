# Breeding Program Enhancements - Testing Handoff

**Date:** 2026-01-14
**Sprint:** Breeding Program Marketplace UI
**Status:** ✅ Implementation Complete - Ready for Testing
**Testing Engineer:** [Assign to QA engineer]

---

## Quick Start for Testing Engineer

### 1. What Was Built

**Backend:**
- ✅ `BreedingProgramInquiry` database model for tracking buyer inquiries
- ✅ Public API endpoints for browsing programs and submitting inquiries
- ✅ UTM tracking and marketing attribution
- ✅ Multi-tenant inquiry isolation

**Frontend:**
- ✅ Public breeding program browse page (`/breeding-programs`)
- ✅ Individual program detail page with 4 tabs (Overview, Gallery, Pricing, Contact)
- ✅ Inquiry submission form with validation
- ✅ Responsive design with dark theme

### 2. Environment Setup

**Backend:**
```bash
cd C:\Users\Aaron\Documents\Projects\breederhq-api
npm run dev
```

**Frontend (Marketplace):**
```bash
cd C:\Users\Aaron\Documents\Projects\breederhq\apps\marketplace
npm run dev
```

**Database:**
- Migration already applied: `20260114170555_add_breeding_program_inquiries`
- No additional setup needed

### 3. Access URLs

- **Browse Programs:** http://localhost:5173/breeding-programs
- **API Docs:** Backend running on http://localhost:4000

---

## Test Scenarios

### Phase 1: Backend API Testing (30-45 min)

#### Test 1: List Public Breeding Programs
**Endpoint:** `GET /api/v1/public/breeding-programs`

**Steps:**
1. Open terminal/Postman
2. Execute: `curl http://localhost:4000/api/v1/public/breeding-programs`
3. Test with filters:
   - `?species=HORSE`
   - `?search=arabian`
   - `?breed=golden`

**Expected Results:**
- Returns JSON array of programs
- Each program has: id, slug, name, description, species, breedText, stats
- Filtering works correctly
- Only `listed: true` programs appear

**SQL to Create Test Data:**
```sql
-- Create test breeding program
INSERT INTO "BreedingProgram" (
  "tenantId", "slug", "name", "description", "species", "breedText",
  "listed", "acceptInquiries", "coverImageUrl",
  "pricingTiers", "whatsIncluded", "typicalWaitTime",
  "createdAt", "updatedAt", "publishedAt"
)
VALUES (
  1, 'test-arabians', 'Champion Arabians Breeding Program',
  'Premier Arabian horse breeding with championship bloodlines',
  'HORSE', 'Arabian',
  true, true, 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=800',
  '[
    {"tier":"Pet Quality","priceRange":"$5,000 - $8,000","description":"Beautiful companion horses"},
    {"tier":"Breeding Quality","priceRange":"$10,000 - $20,000","description":"Show-quality bloodlines"},
    {"tier":"Show Quality","priceRange":"$25,000+","description":"Championship prospects"}
  ]'::jsonb,
  'Health guarantee, current vaccinations, vet check, 30-day health insurance, lifetime breeder support',
  '6-12 months',
  NOW(), NOW(), NOW()
);

-- Add media to program
INSERT INTO "BreedingProgramMedia" (
  "programId", "tenantId", "assetUrl", "caption", "sortOrder", "isPublic",
  "createdAt", "updatedAt"
)
SELECT
  id, "tenantId",
  'https://images.unsplash.com/photo-1551769881-1d05d5d4c00a?w=800',
  'Our breeding facility in Northern California',
  0, true, NOW(), NOW()
FROM "BreedingProgram" WHERE slug = 'test-arabians';
```

**Document:**
- [ ] Response time (should be < 200ms)
- [ ] Number of programs returned
- [ ] Filter accuracy
- [ ] Any errors in console

---

#### Test 2: Get Single Program by Slug
**Endpoint:** `GET /api/v1/public/breeding-programs/:slug`

**Steps:**
1. Execute: `curl http://localhost:4000/api/v1/public/breeding-programs/test-arabians`
2. Verify response includes:
   - Full program details
   - Media array (with isPublic: true only)
   - Pricing tiers as JSON
   - Breeder information
   - Stats (activeBreedingPlans, upcomingLitters, availableLitters, totalAvailable)

**Expected Results:**
- ✅ 200 status code
- ✅ Complete program data
- ✅ Media sorted by sortOrder
- ✅ Only public media visible
- ❌ 404 if slug doesn't exist

**Document:**
- [ ] Response completeness
- [ ] Data accuracy
- [ ] Any missing fields

---

#### Test 3: Submit Inquiry (Valid Data)
**Endpoint:** `POST /api/v1/public/breeding-programs/:slug/inquiries`

**Steps:**
1. Submit inquiry with curl:
```bash
curl -X POST http://localhost:4000/api/v1/public/breeding-programs/test-arabians/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "buyerName": "John Doe",
    "buyerEmail": "john@example.com",
    "buyerPhone": "+1 (555) 123-4567",
    "subject": "Interested in upcoming Arabian litters",
    "message": "I am looking for a breeding-quality Arabian mare. Do you have any expected foals in the next 6 months?",
    "interestedIn": "Next litter",
    "priceRange": "$10K-$20K",
    "timeline": "Next 3 months",
    "source": "Marketplace",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "horse-breeding-2026"
  }'
```

2. Verify inquiry in database:
```sql
SELECT * FROM "BreedingProgramInquiry"
WHERE "programId" = (SELECT id FROM "BreedingProgram" WHERE slug = 'test-arabians')
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Expected Results:**
- ✅ 200 status with inquiry ID
- ✅ Success message: "Thank you for your inquiry! We'll respond within 24 hours."
- ✅ Inquiry saved in database with status = 'NEW'
- ✅ All fields correctly stored (including UTM params)
- ✅ Timestamps populated (createdAt, updatedAt)

**Document:**
- [ ] Inquiry ID returned
- [ ] Database record created
- [ ] All fields accurate
- [ ] UTM tracking works

---

#### Test 4: Submit Inquiry (Invalid Data)
**Endpoint:** `POST /api/v1/public/breeding-programs/:slug/inquiries`

**Test Cases:**

**A. Missing required fields:**
```bash
# Missing buyerName
curl -X POST http://localhost:4000/api/v1/public/breeding-programs/test-arabians/inquiries \
  -H "Content-Type: application/json" \
  -d '{"buyerEmail":"john@example.com","subject":"Test","message":"Test"}'
```
Expected: 400 error with "buyer_name_required"

**B. Invalid email:**
```bash
curl -X POST http://localhost:4000/api/v1/public/breeding-programs/test-arabians/inquiries \
  -H "Content-Type: application/json" \
  -d '{"buyerName":"John","buyerEmail":"invalid","subject":"Test","message":"Test"}'
```
Expected: 400 error with "valid_buyer_email_required"

**C. Program not accepting inquiries:**
```sql
-- Disable inquiries
UPDATE "BreedingProgram" SET "acceptInquiries" = false WHERE slug = 'test-arabians';
```
Then submit inquiry - should get 404 error.

**Document:**
- [ ] Validation errors return correct codes
- [ ] Error messages are clear
- [ ] No data saved when validation fails

---

#### Test 5: Multi-Tenant Isolation
**Endpoint:** `GET /api/v1/public/breeding-programs`

**Steps:**
1. Create programs for two different tenants:
```sql
-- Tenant 1 program
INSERT INTO "BreedingProgram" ("tenantId", "slug", "name", "species", "listed", "createdAt", "updatedAt")
VALUES (1, 'tenant1-program', 'Tenant 1 Program', 'HORSE', true, NOW(), NOW());

-- Tenant 2 program
INSERT INTO "BreedingProgram" ("tenantId", "slug", "name", "species", "listed", "createdAt", "updatedAt")
VALUES (2, 'tenant2-program', 'Tenant 2 Program', 'HORSE', true, NOW(), NOW());
```

2. Submit inquiry to tenant1-program
3. Verify inquiry has correct tenantId in database:
```sql
SELECT "tenantId", "programId", "buyerName"
FROM "BreedingProgramInquiry"
WHERE "programId" = (SELECT id FROM "BreedingProgram" WHERE slug = 'tenant1-program');
```

**Expected Results:**
- ✅ Inquiry associated with correct tenant
- ✅ Both programs visible in public list
- ✅ No cross-tenant data leakage

**Document:**
- [ ] Tenant isolation working
- [ ] No data leakage

---

### Phase 2: Frontend Testing (45-60 min)

#### Test 6: Browse Programs Page
**URL:** http://localhost:5173/breeding-programs

**Steps:**
1. Navigate to breeding programs index
2. Verify page displays:
   - Page title "Breeding Programs"
   - Search input
   - Species filter dropdown
   - Program cards in grid layout
3. Test search:
   - Type "arabian" in search box
   - Verify results update
4. Test species filter:
   - Select "Horse" from dropdown
   - Verify only horse programs show
5. Click on a program card
   - Should navigate to detail page

**Expected Results:**
- ✅ Page loads without errors
- ✅ Programs display in cards
- ✅ Search/filter work in real-time
- ✅ Loading skeletons appear during fetch
- ✅ Empty state shows if no programs
- ✅ Error state shows if API fails

**Visual Checklist:**
- [ ] Dark theme styling
- [ ] Responsive grid (1/2/3 columns)
- [ ] Card hover effects
- [ ] Stats display correctly
- [ ] Breeder name visible

**Document (with screenshots):**
- [ ] Page appearance
- [ ] Search functionality
- [ ] Filter functionality
- [ ] Any UI bugs

---

#### Test 7: Program Detail Page - Overview Tab
**URL:** http://localhost:5173/breeding-programs/test-arabians

**Steps:**
1. Navigate to program detail page
2. Verify hero section:
   - Cover image displays (if showCoverImage = true)
   - Program name prominent
   - Breed and species visible
   - Breeder name shown
3. Verify tab navigation:
   - 4 tabs visible (Overview, Gallery, Pricing, Contact)
   - Overview tab active by default
4. Check overview content:
   - Description displays
   - Program story (if present)
   - Stats sidebar (Active Plans, Upcoming Litters, Available Now)
   - Quick info (Wait time)

**Expected Results:**
- ✅ Hero with cover image or fallback
- ✅ Tab navigation functional
- ✅ All content sections render
- ✅ Stats accurate
- ✅ Sidebar sticky on scroll

**Document (with screenshots):**
- [ ] Hero appearance
- [ ] Overview layout
- [ ] Stats accuracy
- [ ] Any visual issues

---

#### Test 8: Program Detail Page - Gallery Tab
**URL:** http://localhost:5173/breeding-programs/test-arabians (Gallery tab)

**Steps:**
1. Click "Gallery" tab
2. Verify:
   - Media grid displays (2-3 columns)
   - All images load
   - Captions show on hover
3. Click an image:
   - Lightbox opens
   - Image displays full-size
   - Click outside to close

**Expected Results:**
- ✅ Grid layout responsive
- ✅ Images load correctly
- ✅ Hover effects work
- ✅ Lightbox functional
- ✅ Empty state if no media

**Document (with screenshots):**
- [ ] Gallery grid
- [ ] Lightbox modal
- [ ] Image quality
- [ ] Any loading issues

---

#### Test 9: Program Detail Page - Pricing Tab
**URL:** http://localhost:5173/breeding-programs/test-arabians (Pricing tab)

**Steps:**
1. Click "Pricing" tab
2. Verify pricing tiers display:
   - 3 cards (Pet Quality, Breeding Quality, Show Quality)
   - Price ranges visible
   - Descriptions readable
3. Check "What's Included" section
4. Check "Typical Wait Time" section

**Expected Results:**
- ✅ Pricing cards in grid
- ✅ All tiers display
- ✅ Price ranges formatted
- ✅ What's included text readable
- ✅ Wait time visible

**Document (with screenshots):**
- [ ] Pricing card layout
- [ ] Text readability
- [ ] Any missing data

---

#### Test 10: Program Detail Page - Contact Form
**URL:** http://localhost:5173/breeding-programs/test-arabians (Contact tab)

**Steps:**
1. Click "Contact" tab
2. Fill out form:
   - Your Name: "Test User"
   - Email: "test@example.com"
   - Phone: "+1 555-123-4567" (optional)
   - Subject: (pre-filled, can edit)
   - Message: "I am interested in your Arabian program"
   - Interested In: "Next litter"
   - Price Range: "$10K-$20K"
   - Timeline: "Next 3 months"
3. Click "Send Inquiry"
4. Verify:
   - Form submits
   - Success message appears
   - Form clears
   - Redirects to overview after 3 seconds

**Expected Results:**
- ✅ Form validation works (required fields)
- ✅ Submit button disabled while submitting
- ✅ Success message displays
- ✅ Form clears after success
- ✅ Inquiry saved to database

**Verification:**
```sql
SELECT * FROM "BreedingProgramInquiry"
WHERE "buyerEmail" = 'test@example.com'
ORDER BY "createdAt" DESC
LIMIT 1;
```

**Document (with screenshots):**
- [ ] Form layout
- [ ] Validation errors
- [ ] Success state
- [ ] Database record

---

#### Test 11: Contact Form Validation
**URL:** http://localhost:5173/breeding-programs/test-arabians (Contact tab)

**Test Cases:**

**A. Submit empty form:**
- Click "Send Inquiry" without filling fields
- Expected: Browser validation prevents submit

**B. Invalid email:**
- Fill form with email "invalid"
- Expected: Browser validation shows error

**C. Missing required fields:**
- Fill only name, leave email blank
- Expected: Cannot submit

**D. Network error handling:**
1. Stop backend server
2. Submit form
3. Expected: Error message displays

**Document:**
- [ ] All validation working
- [ ] Error messages clear
- [ ] Form doesn't break

---

#### Test 12: Mobile Responsiveness
**URL:** http://localhost:5173/breeding-programs

**Steps:**
1. Open Chrome DevTools
2. Toggle device toolbar (mobile view)
3. Test on:
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)
4. Navigate through:
   - Browse page
   - Program detail page
   - All tabs
   - Contact form

**Expected Results:**
- ✅ Grid collapses to single column on mobile
- ✅ Hero image scales correctly
- ✅ Tabs scroll horizontally on mobile
- ✅ Form fields stack vertically
- ✅ Text readable at all sizes
- ✅ No horizontal scroll

**Document (with screenshots):**
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout
- [ ] Any responsive issues

---

### Phase 3: Edge Cases & Error Handling (30 min)

#### Test 13: Program Not Found
**Steps:**
1. Navigate to: http://localhost:5173/breeding-programs/nonexistent-slug
2. Verify error state displays
3. "View All Programs" button works

**Expected:**
- ✅ Error message shows
- ✅ No blank page
- ✅ Navigation works

---

#### Test 14: Program Not Accepting Inquiries
**Steps:**
1. Disable inquiries:
```sql
UPDATE "BreedingProgram"
SET "acceptInquiries" = false
WHERE slug = 'test-arabians';
```
2. Navigate to program page
3. Verify "Contact" tab is hidden or disabled
4. Attempt to submit inquiry via API directly
5. Should get 404 error

**Expected:**
- ✅ Contact tab hidden
- ✅ API rejects inquiry
- ✅ Clear error message

---

#### Test 15: Network Failure Handling
**Steps:**
1. Open program page with DevTools
2. Go to Network tab → Set to "Offline"
3. Try to load program
4. Verify error state
5. Go back online
6. Retry should work

**Expected:**
- ✅ Error message displays
- ✅ Retry mechanism available
- ✅ No crash or blank page

---

#### Test 16: XSS Prevention
**Steps:**
1. Create program with malicious content:
```sql
INSERT INTO "BreedingProgram" (
  "tenantId", "slug", "name", "description", "species",
  "listed", "createdAt", "updatedAt"
)
VALUES (
  1, 'xss-test', 'Test <script>alert("XSS")</script>',
  'Description with <img src=x onerror=alert("XSS")>',
  'HORSE', true, NOW(), NOW()
);
```
2. Navigate to program page
3. Verify:
   - No alert() executes
   - Script tags rendered as text
   - Images don't execute

**Expected:**
- ✅ XSS prevented
- ✅ Content sanitized
- ✅ No JavaScript execution

---

### Phase 4: Performance Testing (15 min)

#### Test 17: Page Load Performance
**Tools:** Chrome DevTools → Performance

**Steps:**
1. Open Performance tab
2. Record page load for:
   - Browse programs page
   - Program detail page
3. Measure:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)

**Targets:**
- FCP: < 1.5s
- LCP: < 2.5s
- TTI: < 3.5s

**Document:**
- [ ] FCP time
- [ ] LCP time
- [ ] TTI time
- [ ] Any bottlenecks

---

#### Test 18: API Response Times
**Steps:**
1. Use browser DevTools → Network tab
2. Measure API response times:
   - GET /api/v1/public/breeding-programs
   - GET /api/v1/public/breeding-programs/:slug
   - POST /api/v1/public/breeding-programs/:slug/inquiries

**Targets:**
- List programs: < 200ms
- Get program: < 150ms
- Submit inquiry: < 300ms

**Document:**
- [ ] List API time
- [ ] Detail API time
- [ ] Submit API time
- [ ] Any slow queries

---

## Test Report Template

Create: `BREEDING-PROGRAMS-TEST-REPORT.md`

```markdown
# Breeding Program Enhancements - Test Report

**Tester:** [Your Name]
**Date:** [Date]
**Duration:** [Hours]
**Environment:** Development (localhost)

---

## Executive Summary

- **Tests Executed:** X/18
- **Tests Passed:** X
- **Tests Failed:** X
- **Critical Issues:** X
- **Minor Issues:** X
- **Overall Status:** ✅ PASS / ⚠️ NEEDS WORK / ❌ FAIL

---

## Test Results

### Phase 1: Backend API (Tests 1-5)
[Results for each test with PASS/FAIL and notes]

### Phase 2: Frontend (Tests 6-12)
[Results for each test with screenshots]

### Phase 3: Edge Cases (Tests 13-16)
[Results with error handling verification]

### Phase 4: Performance (Tests 17-18)
[Results with metrics]

---

## Issues Found

### Critical Issues
1. **[Issue Title]**
   - **Test:** Test #X
   - **Description:** [Details]
   - **Expected:** [What should happen]
   - **Actual:** [What happened]
   - **Steps to Reproduce:**
     1. [Step 1]
     2. [Step 2]
   - **Screenshots:** [Attach]

### Minor Issues
[Same format]

---

## Performance Metrics

- **API Response Times:**
  - List programs: X ms
  - Get program: X ms
  - Submit inquiry: X ms
- **Page Load Times:**
  - Browse page FCP: X ms
  - Detail page LCP: X ms

---

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

---

## Sign-Off

- [ ] All tests executed
- [ ] All issues documented
- [ ] Report reviewed
- [ ] Ready for production

**Tested By:** [Name]
**Date:** [Date]
```

---

## Success Criteria

Testing is complete when:

✅ **All 18 tests executed** and documented
✅ **Test report created** with findings
✅ **All critical issues documented** with reproduction steps
✅ **Performance metrics collected** and within targets
✅ **Screenshots captured** for UI issues
✅ **Database queries verified** (inquiries stored correctly)

---

## Key Files Reference

**Backend:**
```
breederhq-api/prisma/schema.prisma (BreedingProgramInquiry model)
breederhq-api/src/routes/public-breeding-programs.ts
breederhq-api/src/server.ts
```

**Frontend:**
```
breederhq/apps/marketplace/src/marketplace/pages/BreedingProgramPage.tsx
breederhq/apps/marketplace/src/marketplace/pages/BreedingProgramsIndexPage.tsx
breederhq/apps/marketplace/src/routes/MarketplaceRoutes.tsx
```

**Database:**
```
Migration: 20260114170555_add_breeding_program_inquiries
```

---

## Troubleshooting

### Backend Not Starting
- Check `npm run dev` logs
- Verify PostgreSQL running
- Check environment variables

### Frontend Not Loading
- Clear browser cache
- Check console for errors
- Verify backend API accessible

### Programs Not Displaying
- Check `listed: true` in database
- Verify API returns data
- Check network tab for errors

### Forms Not Submitting
- Check browser console
- Verify API endpoint accessible
- Check CORS if needed

---

**Ready to start testing! 🚀**

Begin with Phase 1: Backend API Testing and work through systematically.
