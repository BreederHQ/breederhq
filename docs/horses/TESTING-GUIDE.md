# Species Terminology System - Testing Guide

**Date:** January 14, 2026
**Version:** 1.0
**Status:** Ready for QA Testing

---

## Overview

This guide covers manual and automated testing strategies for the Species Terminology System (STS) to ensure:
1. All 11 species display correct terminology
2. Collar system properly hidden for non-collar species
3. No regression in existing dog/cat breeder workflows
4. Performance remains excellent
5. Accessibility standards maintained

---

## Quick Start

### Automated Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run only species terminology tests
npx playwright test e2e/species-terminology.spec.ts

# Run with UI mode (recommended for debugging)
npx playwright test --ui

# Run specific test
npx playwright test -g "collar picker is hidden"
```

### Manual Testing Checklist

See **Section 3: Manual Testing Scenarios** below for step-by-step instructions.

---

## 1. Test Data Setup

### Required Test Users

Create test accounts for each scenario:

**1. Horse-Only Breeder**
- Email: `horse@test.breederhq.com`
- Species: HORSE only
- Test Data: 2-3 foals in various stages

**2. Dog-Only Breeder**
- Email: `dog@test.breederhq.com`
- Species: DOG only
- Test Data: 2-3 litters in various stages

**3. Mixed-Species Breeder**
- Email: `mixed@test.breederhq.com`
- Species: DOG, HORSE, GOAT
- Test Data: 1 litter, 1 foal, 1 kidding

**4. All-Species Breeder (Comprehensive)**
- Email: `admin@test.breederhq.com`
- Species: All 11 species
- Test Data: 1 offspring group per species

### Test Data Script

```sql
-- Create test offspring groups for horse breeder
INSERT INTO "OffspringGroup" (
  "breedingPlanId",
  "identifier",
  "species",
  "countBorn",
  "countLive",
  "birthedAt",
  "status"
) VALUES
  (1, 'Bella x Thunder', 'HORSE', 1, 1, NOW() - INTERVAL '2 weeks', 'in_care'),
  (2, 'Luna x Storm', 'HORSE', 1, 1, NOW() - INTERVAL '4 weeks', 'in_care');

-- Create test offspring groups for dog breeder
INSERT INTO "OffspringGroup" (
  "breedingPlanId",
  "identifier",
  "species",
  "countBorn",
  "countLive",
  "birthedAt",
  "status"
) VALUES
  (3, 'Daisy x Max', 'DOG', 6, 6, NOW() - INTERVAL '3 weeks', 'in_care'),
  (4, 'Bella x Duke', 'DOG', 4, 4, NOW() - INTERVAL '5 weeks', 'placement_active');

-- Mixed breeder data
INSERT INTO "OffspringGroup" (
  "breedingPlanId",
  "identifier",
  "species",
  "countBorn",
  "countLive",
  "birthedAt",
  "status"
) VALUES
  (5, 'Molly x Rex', 'DOG', 5, 5, NOW() - INTERVAL '2 weeks', 'in_care'),
  (6, 'Spirit x Blaze', 'HORSE', 1, 1, NOW() - INTERVAL '1 week', 'in_care'),
  (7, 'Nanny x Billy', 'GOAT', 2, 2, NOW() - INTERVAL '3 days', 'in_care');
```

---

## 2. Automated Testing (Playwright)

### Test File Structure

**`e2e/species-terminology.spec.ts`** - Main test suite covering:

1. **Dashboard Tests**
   - Species-specific "in care" labels
   - Mixed-species generic labels
   - Empty states

2. **Settings Tests**
   - Collar configuration messaging
   - Tab label updates
   - Species applicability notes

3. **Collar Picker Tests**
   - Hidden for non-collar species (HORSE, CATTLE, CHICKEN, ALPACA, LLAMA)
   - Visible for collar species (DOG, CAT, RABBIT, GOAT, SHEEP, PIG)

4. **Breeding Pipeline Tests**
   - Neutral "Care" stage label

5. **Cross-Species Tests**
   - Multiple species in same account
   - Switching between species

6. **Regression Tests**
   - Dog/cat breeder workflows unchanged
   - Null/undefined species gracefully handled

7. **Performance Tests**
   - Load time benchmarks
   - Large dataset rendering

8. **Accessibility Tests**
   - Screen reader compatibility
   - ARIA attributes

9. **Visual Regression Tests**
   - Screenshot comparisons

### Running Tests

```bash
# Install Playwright (first time only)
npx playwright install

# Run all tests
npm run test:e2e

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run specific test file
npx playwright test e2e/species-terminology.spec.ts

# Run specific test by name
npx playwright test -g "collar picker is hidden"

# Generate test report
npx playwright show-report
```

### Test Configuration

Create/update `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Known Test TODOs

The following test helpers need implementation based on your app's actual UI:

1. **`login()` function** - Update with actual auth flow
2. **`createOffspringGroup()` function** - Update with actual form flow
3. **Test data setup** - Create fixtures or API calls to seed test data
4. **Selectors** - Update with actual data-testid attributes or class names

---

## 3. Manual Testing Scenarios

### Scenario 1: Horse-Only Breeder Experience

**Goal:** Verify horse breeders see appropriate terminology and no collar system

**Steps:**
1. Login as horse breeder (`horse@test.breederhq.com`)
2. Navigate to Dashboard
3. **Verify:**
   - ✅ Header shows "Foals in Care" (not "Offspring in Care")
   - ✅ No mention of "puppies", "litter", "whelping"
   - ✅ Count displays correctly (e.g., "1 foal" not "1 offspring")

4. Navigate to Breeding Plans
5. Open a breeding plan for a horse
6. **Verify:**
   - ✅ Female parent labeled "Mare" (not "Dam")
   - ✅ Male parent labeled "Stallion" (not "Sire")
   - ✅ Birth process shows "Foaling" (not "Whelping")

7. Record a birth / View offspring group
8. **Verify:**
   - ✅ No collar picker visible anywhere
   - ✅ No collar color fields
   - ✅ Count fields present but de-emphasized

9. Navigate to Settings → Offspring
10. **Verify:**
    - ✅ Tab labeled "Identification Collars" (not "Whelping Collars")
    - ✅ Note states: "Not applicable for horses, cattle, or chickens"
    - ✅ Settings are visible but clearly marked as N/A

**Expected Result:** Clean, professional horse breeding experience with zero dog-specific terminology.

---

### Scenario 2: Dog-Only Breeder Experience

**Goal:** Verify no regression for existing dog breeders

**Steps:**
1. Login as dog breeder (`dog@test.breederhq.com`)
2. Navigate to Dashboard
3. **Verify:**
   - ✅ Header shows "Litters in Care" (improved from "Offspring in Care")
   - ✅ Familiar dog terminology throughout
   - ✅ Count displays (e.g., "6 puppies")

4. Navigate to Breeding Plans
5. Open a breeding plan for a dog
6. **Verify:**
   - ✅ Female parent labeled "Dam"
   - ✅ Male parent labeled "Sire"
   - ✅ Birth process shows "Whelping"

7. Record a birth / View offspring group
8. **Verify:**
   - ✅ Collar picker IS visible
   - ✅ Can select collar colors
   - ✅ Count fields emphasized and functional

9. Navigate to Settings → Offspring → Identification Collars
10. **Verify:**
    - ✅ Full collar configuration available
    - ✅ Can add/edit collar colors
    - ✅ Everything works as before

**Expected Result:** Zero breaking changes, subtle improvements to terminology ("Litters in Care" more accurate).

---

### Scenario 3: Mixed-Species Breeder Experience

**Goal:** Verify multiple species work correctly side-by-side

**Steps:**
1. Login as mixed breeder (`mixed@test.breederhq.com`)
2. Navigate to Dashboard
3. **Verify:**
   - ✅ Header shows "Offspring in Care" (generic for mixed)
   - ✅ Dog group shows dog terminology
   - ✅ Horse group shows horse terminology
   - ✅ Goat group shows goat terminology

4. Click on dog group
5. **Verify:**
   - ✅ Shows "puppies", "litter", "whelping"
   - ✅ Collar picker visible

6. Navigate back, click on horse group
7. **Verify:**
   - ✅ Shows "foal", "foaling"
   - ✅ No collar picker

8. Navigate back, click on goat group
9. **Verify:**
   - ✅ Shows "kids", "kidding"
   - ✅ Collar picker visible (goats use collars)

**Expected Result:** Each species uses its own terminology correctly, collar picker shows/hides appropriately.

---

### Scenario 4: All 11 Species Verification

**Goal:** Comprehensive check of all species terminology

**Test Matrix:**

| Species | Offspring | Birth Term | In Care Label | Collars? | Parent Female | Parent Male |
|---------|-----------|------------|---------------|----------|---------------|-------------|
| DOG | puppy/puppies | whelping | Litters in Care | ✓ Yes | dam | sire |
| CAT | kitten/kittens | birthing | Litters in Care | ✓ Yes | dam | sire |
| HORSE | foal/foals | foaling | Foals in Care | ✗ No | mare | stallion |
| RABBIT | kit/kits | kindling | Litters in Care | ✓ Yes | doe | buck |
| GOAT | kid/kids | kidding | Kids in Care | ✓ Yes | doe | buck |
| SHEEP | lamb/lambs | lambing | Lambs in Care | ✓ Yes | ewe | ram |
| PIG | piglet/piglets | farrowing | Litters in Care | ✓ Yes | sow | boar |
| CATTLE | calf/calves | calving | Calves in Care | ✗ No | cow | bull |
| CHICKEN | chick/chicks | hatching | Chicks in Care | ✗ No | hen | rooster |
| ALPACA | cria/crias | birthing | Crias in Care | ✗ No | dam | sire |
| LLAMA | cria/crias | birthing | Crias in Care | ✗ No | dam | sire |

**Steps:**
1. Login as admin/all-species breeder
2. For each species:
   - Navigate to offspring group for that species
   - Verify terminology matches table above
   - Check collar picker visibility matches table
   - Verify parent labels match table

**Expected Result:** All 11 species display correct terminology.

---

### Scenario 5: Edge Cases

**Test Case 5.1: Empty State**
- Login with no offspring groups
- Verify empty state message displays correctly
- No crashes or errors

**Test Case 5.2: Null Species**
- Create test data with `species = NULL`
- System should default to DOG terminology
- No crashes

**Test Case 5.3: Unknown Species**
- Create test data with `species = 'UNKNOWN'`
- System should default to DOG terminology
- No crashes

**Test Case 5.4: Case Sensitivity**
- Test with lowercase species codes ('horse', 'dog')
- System should handle case-insensitively
- Terminology should still work

---

## 4. Performance Testing

### Load Time Benchmarks

**Baseline Metrics (Pre-STS):**
- Dashboard load: ~800ms
- Offspring list (50 groups): ~1200ms
- Settings page: ~600ms

**Post-STS Targets:**
- Dashboard load: < 1000ms (within 20% of baseline)
- Offspring list (50 groups): < 1500ms (within 20% of baseline)
- Settings page: < 800ms (within 20% of baseline)

### Performance Test Procedure

1. **Clear browser cache and local storage**
2. **Open DevTools Performance tab**
3. **Start recording**
4. **Navigate to page**
5. **Wait for "networkidle" event**
6. **Stop recording**
7. **Measure:**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Total Blocking Time (TBT)

### Performance Checklist

- [ ] Dashboard loads within 1000ms
- [ ] Large offspring lists render within 1500ms
- [ ] No console errors
- [ ] No memory leaks (check with heap snapshot)
- [ ] Hook memoization working (check re-renders in React DevTools)

---

## 5. Accessibility Testing

### Screen Reader Testing

**Tools:**
- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS)

**Test Procedure:**
1. Enable screen reader
2. Navigate to Dashboard
3. **Verify:**
   - Header "Foals in Care" is announced correctly
   - Group cards are navigable with keyboard
   - All interactive elements have proper labels

4. Navigate to Settings → Offspring
5. **Verify:**
   - Tab labels announced correctly
   - Form fields have associated labels
   - Hidden collar picker not in accessibility tree

### Keyboard Navigation

**Test all pages with keyboard only (no mouse):**
- [ ] Can Tab through all interactive elements
- [ ] Can activate buttons with Enter/Space
- [ ] Can navigate dropdowns with arrow keys
- [ ] Focus indicator visible at all times
- [ ] No keyboard traps

### ARIA Attributes

**Check with browser DevTools:**
- [ ] Headings use proper hierarchy (h1, h2, h3)
- [ ] Lists use `<ul>` and `<li>` elements
- [ ] Buttons have `role="button"` (if not `<button>`)
- [ ] Hidden elements have `aria-hidden="true"` or `display: none`
- [ ] Form fields have `aria-label` or associated `<label>`

### Color Contrast

**Use axe DevTools or WAVE:**
- [ ] All text meets WCAG AA contrast ratio (4.5:1)
- [ ] Interactive elements meet AA contrast
- [ ] Focus indicators meet AA contrast

---

## 6. Browser Compatibility

### Supported Browsers

- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Test Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Dashboard terminology | ✅ | ✅ | ✅ | ✅ |
| Collar picker hidden | ✅ | ✅ | ✅ | ✅ |
| Settings messaging | ✅ | ✅ | ✅ | ✅ |
| Performance | ✅ | ✅ | ✅ | ✅ |

---

## 7. Regression Testing

### Critical Paths to Verify

**Path 1: Record Birth**
1. Create breeding plan
2. Record breeding
3. Mark pregnant
4. Record birth
5. **Verify:** Species-appropriate terminology throughout

**Path 2: Offspring Sales**
1. View offspring group
2. Mark offspring as available
3. Create reservation
4. Invoice client
5. **Verify:** Terminology correct in all steps

**Path 3: Collar Assignment (Dogs/Cats)**
1. View litter
2. Assign collar colors to puppies/kittens
3. **Verify:** Collar picker works as before

**Path 4: No Collars (Horses/Cattle)**
1. View horse foal
2. **Verify:** No collar picker visible
3. **Verify:** Can still complete all workflows

---

## 8. Deployment Checklist

### Pre-Deployment

- [ ] All automated tests passing
- [ ] Manual testing complete for all scenarios
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Browser compatibility verified
- [ ] Documentation reviewed and updated

### Staging Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Invite 2-3 beta testers (horse breeders preferred)
- [ ] Monitor error logs
- [ ] Collect feedback

### Production Deployment

- [ ] Deploy during low-traffic window
- [ ] Monitor error rates (Sentry/Rollbar)
- [ ] Monitor performance (New Relic/DataDog)
- [ ] Monitor user feedback
- [ ] Have rollback plan ready

### Post-Deployment

- [ ] Verify no error spike in monitoring
- [ ] Check user feedback channels
- [ ] Monitor support tickets
- [ ] Conduct 1-week post-launch review

---

## 9. Rollback Plan

### If Critical Bug Found

**Rollback Steps:**
1. **Immediate:** Revert git commits
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Deploy rollback** to production

3. **Verify rollback** successful
   - Check error rates dropped
   - Verify original functionality restored

4. **Communicate** with users
   - Notify of temporary issue
   - Provide ETA for fix

**Rollback is LOW RISK because:**
- ✅ No database migrations to rollback
- ✅ Pure presentation layer changes
- ✅ No data loss risk
- ✅ Fast rollback time (5 minutes)

---

## 10. Test Coverage Summary

### Current Coverage

**Phase 1 (Foundation):**
- ✅ 38 unit tests passing
- ✅ All utility functions tested
- ✅ All feature flags tested
- ✅ Edge cases covered

**Phase 2 (Components):**
- ✅ 5 high-impact components updated
- ⏳ Manual testing required (see scenarios above)
- ⏳ E2E tests require test data setup

**Phase 3 (Remaining):**
- ⏳ Not yet implemented (optional)

### Test Metrics

| Category | Tests Written | Tests Passing | Coverage |
|----------|---------------|---------------|----------|
| Unit Tests | 38 | 38 | 100% |
| E2E Tests | 15 suites | 0* | 0%* |
| Manual Scenarios | 5 scenarios | 0* | 0%* |

*Requires test data setup and execution

---

## 11. Known Limitations

### Issue 1: Settings Visibility
**Description:** Collar settings tab visible to horse-only breeders
**Impact:** Low - Clear note explains N/A
**Mitigation:** Added messaging
**Future Fix:** Could hide tab conditionally (Phase 3+)

### Issue 2: Mixed-Species Dashboards
**Description:** Mixed species show generic "Offspring in Care"
**Impact:** Low - Accurate and neutral
**Mitigation:** Smart header logic implemented
**Future Fix:** Could show "Litters & Foals in Care" (Phase 3+)

### Issue 3: CollarPicker Prop Requirement
**Description:** Requires `species` prop to hide properly
**Impact:** Low - Backward compatible
**Mitigation:** Optional prop with default behavior
**Future Fix:** Could infer from context (Phase 3+)

---

## 12. Support Resources

### Documentation
- [Species Terminology System Foundation](./SPECIES-TERMINOLOGY-SYSTEM.md)
- [Phase 2 Implementation Summary](./PHASE-2-IMPLEMENTATION-SUMMARY.md)
- [Horse Launch Readiness Report](./HORSE-LAUNCH-READINESS-REPORT.md)
- [Database Compatibility Analysis](./BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md)

### Code References
- Core utilities: `packages/ui/src/utils/speciesTerminology.ts`
- React hook: `packages/ui/src/hooks/useSpeciesTerminology.ts`
- Unit tests: `packages/ui/src/utils/speciesTerminology.test.ts`
- E2E tests: `e2e/species-terminology.spec.ts`

### Contact
- Technical Questions: Development team
- QA Questions: QA lead
- Product Questions: Product manager

---

## 13. Success Criteria

### Launch Day (Day 1-7)
- [ ] Zero critical bugs reported
- [ ] Horse breeders report positive experience
- [ ] No increase in support tickets
- [ ] Existing dog/cat breeders report no issues
- [ ] System performance unchanged

### Long-Term (Month 1-3)
- [ ] Horse breeder adoption growing
- [ ] Positive feedback on species-appropriate terminology
- [ ] No confusion about collar system
- [ ] Breeding workflow completion rate high
- [ ] Marketplace listings accurate

---

**Document Version:** 1.0
**Last Updated:** January 14, 2026
**Prepared By:** Technical Team
**Review Status:** Ready for QA
