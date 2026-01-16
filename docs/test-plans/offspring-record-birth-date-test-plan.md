# Test Plan: Record Birth Date from Offspring Group

## Feature Overview

This feature allows breeders to record the actual birth date directly from the offspring group details page when the linked breeding plan is missing a birth date. Previously, breeders had to navigate away to the breeding plan to record this information.

## Prerequisites

- API server running (`cd breederhq-api && npm run dev`)
- Offspring app running (`cd apps/offspring && npm run dev`)
- Test users seeded (`cd breederhq-api && npm run db:dev:seed:users`)
- Test tenant (ID 4) needs BREEDING_PLAN_QUOTA entitlement

---

## Automated Tests

The e2e test suite is **self-contained** - it creates its own minimal seed data (dam, sire) and cleans up everything after tests complete.

Run the e2e test suite:

```bash
cd breederhq
npx playwright test e2e/offspring-record-birth-date.spec.ts
```

**What the tests do:**
1. `beforeAll`: Creates test dam and sire animals
2. Each test: Creates breeding plans, offspring groups as needed
3. `afterEach`: Cleans up plans created during that test
4. `afterAll`: Deletes the seed dam and sire animals

**Test data prefix:** `E2E_BIRTH_DATE_TEST` - used for all created entities

---

## Manual UI Test Cases

### Test Case 1: Button Hidden When Birth Date Not Recorded

**Preconditions:**
- Offspring group linked to a breeding plan
- Breeding plan has `breedDateActual` set but NO `birthDateActual`

**Steps:**
1. Open the Offspring app
2. Click on an offspring group card to open the details drawer
3. Navigate to the "OFFSPRING" tab

**Expected Results:**
- [ ] The "Add Offspring" button is NOT visible
- [ ] A yellow/amber warning banner appears with the text "Birth Date Required"
- [ ] The banner includes a date picker and "Record Birth" button

---

### Test Case 2: Warning Message When Breed Date Not Set

**Preconditions:**
- Offspring group linked to a breeding plan
- Breeding plan has NO `breedDateActual` AND NO `birthDateActual`

**Steps:**
1. Open the Offspring app
2. Click on an offspring group card to open the details drawer
3. Navigate to the "OFFSPRING" tab

**Expected Results:**
- [ ] The "Add Offspring" button is NOT visible
- [ ] A yellow/amber warning banner appears
- [ ] The banner message indicates breeding date must be recorded first
- [ ] The date picker is NOT shown (disabled state)
- [ ] No "Record Birth" button is visible

---

### Test Case 3: Successfully Record Birth Date

**Preconditions:**
- Offspring group linked to a breeding plan
- Breeding plan has `breedDateActual` set but NO `birthDateActual`

**Steps:**
1. Open the Offspring app
2. Click on an offspring group card to open the details drawer
3. Navigate to the "OFFSPRING" tab
4. Enter a valid birth date in the date picker
5. Click "Record Birth" button

**Expected Results:**
- [ ] Button shows "Recording..." during API call
- [ ] After success, the warning banner disappears
- [ ] The "Add Offspring" button now appears
- [ ] No error messages are shown

**Verification:**
- [ ] Check breeding plan details - status should be "BIRTHED"
- [ ] Check breeding plan details - `birthDateActual` should match entered date
- [ ] Refresh the page - changes should persist

---

### Test Case 4: Add Offspring After Recording Birth Date

**Preconditions:**
- Successfully completed Test Case 3

**Steps:**
1. While still on the OFFSPRING tab after recording birth
2. Click the "Add Offspring" button
3. Fill out the offspring form
4. Submit the form

**Expected Results:**
- [ ] Add Offspring form opens successfully
- [ ] Form submits without errors
- [ ] New offspring appears in the offspring list

---

### Test Case 5: Orphan Group (No Linked Plan)

**Preconditions:**
- Offspring group with NO linked breeding plan (orphan group)

**Steps:**
1. Open the Offspring app
2. Click on an orphan offspring group card
3. Navigate to the "OFFSPRING" tab

**Expected Results:**
- [ ] The "Add Offspring" button IS visible
- [ ] NO warning banner is shown
- [ ] User can add offspring without recording birth date

---

### Test Case 6: Group With Birth Date Already Recorded

**Preconditions:**
- Offspring group linked to a breeding plan
- Breeding plan has `birthDateActual` already set

**Steps:**
1. Open the Offspring app
2. Click on the offspring group card
3. Navigate to the "OFFSPRING" tab

**Expected Results:**
- [ ] The "Add Offspring" button IS visible
- [ ] NO warning banner is shown
- [ ] User can add offspring normally

---

### Test Case 7: Error Handling - API Failure

**Preconditions:**
- Offspring group linked to a breeding plan ready for birth recording
- Simulate API error (e.g., network disconnect or server error)

**Steps:**
1. Open the OFFSPRING tab with the warning banner
2. Enter a birth date
3. Click "Record Birth"
4. (Simulate error condition)

**Expected Results:**
- [ ] Error message appears in red below the form
- [ ] Form remains usable (not stuck in loading state)
- [ ] User can retry after fixing the issue

---

## Edge Cases

### Edge Case 1: Very Old Birth Date
- Enter a birth date from several years ago
- Should succeed (no date validation beyond reasonable limits)

### Edge Case 2: Future Birth Date
- Enter a birth date in the future
- Should fail or show a warning (depending on validation rules)

### Edge Case 3: Rapid Double-Click
- Click "Record Birth" button twice rapidly
- Should not create duplicate requests or errors

### Edge Case 4: Page Refresh During Recording
- Start recording birth date
- Refresh page before completion
- Page should reload in consistent state

---

## API Test Cases (via curl/Postman)

### API Test 1: record-foaling with empty foals array

```bash
curl -X POST http://localhost:6001/api/v1/breeding/plans/{planId}/record-foaling \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: {tenantId}" \
  -H "X-CSRF-Token: {token}" \
  -d '{"actualBirthDate": "2024-01-15", "foals": []}'
```

**Expected:** 201 Created with plan, offspringGroup, offspring[] in response

### API Test 2: record-foaling without breedDateActual

```bash
# First ensure plan has NO breedDateActual
curl -X POST http://localhost:6001/api/v1/breeding/plans/{planId}/record-foaling \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: {tenantId}" \
  -H "X-CSRF-Token: {token}" \
  -d '{"actualBirthDate": "2024-01-15", "foals": []}'
```

**Expected:** 500 Error with message about breedDateActual required

### API Test 3: Offspring group exposes plan fields

```bash
curl http://localhost:6001/api/v1/offspring/{groupId} \
  -H "X-Tenant-Id: {tenantId}"
```

**Expected:** Response includes `plan.status`, `plan.birthDateActual`, `plan.breedDateActual`

---

## Regression Tests

Ensure these existing features still work:

- [ ] Adding offspring to groups with birth date already set
- [ ] Breeding plan status transitions work normally
- [ ] record-foaling with actual foals (non-empty array) still works
- [ ] Offspring group unlinking rules still enforced
- [ ] Date lock rules still enforced on breeding plans

---

## Performance Considerations

- [ ] Recording birth date should complete in < 2 seconds
- [ ] Page refresh after recording should be snappy
- [ ] No memory leaks from repeated open/close of details drawer
