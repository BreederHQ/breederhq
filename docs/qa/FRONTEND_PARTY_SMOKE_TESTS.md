# Frontend Party Migration Smoke Tests

## Purpose

Manual smoke testing checklist for Party-first frontend behavior after Phase 3 Party migration. Use this checklist after each deployment to verify Party-native rendering, deep linking, and data flow.

**Test Framework Status:** No automated test infrastructure exists yet. This document provides manual testing procedures to validate critical Party-first flows.

## Prerequisites

- Backend API running with Phase 5 Party-native endpoints
- Frontend dev server running (`npm run dev`)
- Test tenant with sample data (Parties, animals, waitlist entries, offspring)
- Browser dev tools open for network inspection

## Test Environment Setup

### Required Test Data

Create test data in your dev environment:

```sql
-- Create test tenant
INSERT INTO "Tenant" (name, slug) VALUES ('Frontend Test Tenant', 'frontend-test');

-- Create test Parties (CONTACT and ORGANIZATION)
INSERT INTO "Party" ("tenantId", kind, "displayName", email)
VALUES
  (1, 'CONTACT', 'John Smith', 'john@test.com'),
  (1, 'ORGANIZATION', 'Smith Kennels', 'info@smithkennels.com');

-- Create backing Contact and Organization (for legacy deep links if preserved)
INSERT INTO "Contact" ("tenantId", "partyId", display_name, email)
VALUES (1, 1, 'John Smith', 'john@test.com');

INSERT INTO "Organization" ("tenantId", "partyId", name, email)
VALUES (1, 2, 'Smith Kennels', 'info@smithkennels.com');

-- Create test animal
INSERT INTO "Animal" ("tenantId", name, species, sex, status)
VALUES (1, 'Test Dog', 'DOG', 'FEMALE', 'ACTIVE');

-- Create test waitlist entry
INSERT INTO "WaitlistEntry" ("tenantId", "clientPartyId", status)
VALUES (1, 1, 'INQUIRY');
```

## Smoke Test Checklist

### 1. Contacts/Parties List View

**Test:** Party table displays partyId-keyed rows with kind badges

**Steps:**
1. Navigate to Contacts/Parties list (usually Settings -> Contacts or main navigation)
2. Observe table rows

**Expected:**
- [ ] Rows are keyed by `partyId` (check React DevTools or inspect key props)
- [ ] Each row shows `kind` badge (CONTACT or ORGANIZATION)
- [ ] `displayName` is shown (not legacy display_name or name separately)
- [ ] No `contactId` or `organizationId` visible in UI
- [ ] No `partyType` field visible

**Failure indicators:**
- Rows duplicated or missing
- Kind badge shows undefined or wrong type
- Legacy fields (contactId) visible in table
- Console errors about missing partyId

### 2. Party Deep Links

**Test:** Direct navigation to party via partyId URL

**Steps:**
1. Note a Party ID from the list (e.g., 123)
2. Navigate to: `/parties/123` or `/contacts/party/123` (check your routing)
3. Observe party detail drawer/page opens

**Expected:**
- [ ] Party detail opens correctly
- [ ] Displays Party kind (CONTACT or ORGANIZATION)
- [ ] Displays Party displayName
- [ ] URL reflects partyId (not contactId or orgId)

**Failure indicators:**
- 404 or "Not Found" for party deep link
- Drawer opens but shows wrong party
- Console errors about missing partyId resolution

### 3. Legacy Deep Links (If Preserved)

**Test:** Legacy contactId and orgId deep links still resolve

**Note:** Only test if frontend explicitly preserves backward compatibility for legacy URLs.

**Steps:**
1. Navigate to legacy URL: `/contacts/123` (contactId) or `/organizations/456` (orgId)
2. Observe if it redirects or resolves to Party

**Expected (if preserved):**
- [ ] Legacy URL resolves to correct Party
- [ ] URL redirects to `/parties/{partyId}` or functions correctly
- [ ] Party detail shows correct Party data

**If not preserved:**
- [ ] Legacy URLs return 404 or "Not supported" message
- [ ] User is shown migration notice (if applicable)

### 4. Waitlist Entry Creation

**Test:** Create waitlist entry using clientPartyId

**Steps:**
1. Navigate to Waitlist page
2. Click "Add to Waitlist" or equivalent
3. Select a Party (Contact or Organization) from dropdown/search
4. Submit form

**Expected:**
- [ ] Form accepts Party selection (not separate contact/org fields)
- [ ] Network request payload contains `clientPartyId`
- [ ] No `contactId` or `organizationId` in payload
- [ ] Waitlist entry created successfully
- [ ] New entry displays client Party name

**Network validation:**
```json
// POST /api/v1/waitlist payload should contain:
{
  "clientPartyId": 123,
  "status": "INQUIRY",
  ...
}
```

**Failure indicators:**
- Form shows separate contact/organization dropdowns (legacy UI)
- Payload contains contactId or organizationId
- 400 error: "missing clientPartyId"
- Console error about Party resolution

### 5. Waitlist Entry Display

**Test:** Waitlist list shows Party-native data

**Steps:**
1. Navigate to Waitlist page
2. Observe waitlist entries in table/list

**Expected:**
- [ ] Each entry shows client Party displayName
- [ ] No separate contact/organization columns
- [ ] Party kind badge visible (if applicable)
- [ ] Clicking entry shows Party details

**Network validation:**
```json
// GET /api/v1/waitlist response should contain:
{
  "items": [
    {
      "id": 1,
      "clientPartyId": 123,
      // No contactId, organizationId, or derived legacy fields
      ...
    }
  ]
}
```

### 6. Offspring Buyer Assignment

**Test:** Assign offspring buyer using buyerPartyId

**Steps:**
1. Navigate to Offspring list
2. Select an offspring
3. Assign buyer (Party selection)
4. Submit

**Expected:**
- [ ] Buyer selection is Party dropdown (not separate contact/org)
- [ ] Network request payload contains `buyerPartyId`
- [ ] No `buyerContactId` or `buyerOrganizationId` in payload
- [ ] Offspring shows buyer Party displayName after assignment

**Network validation:**
```json
// PATCH /api/v1/offspring/{id} payload:
{
  "buyerPartyId": 456,
  ...
}
```

### 7. Animal Owner Assignment

**Test:** Assign animal owner using partyId

**Steps:**
1. Navigate to Animals list
2. Select an animal
3. Assign owner (Party selection)
4. Submit

**Expected:**
- [ ] Owner selection is Party dropdown
- [ ] Network request payload contains `partyId`
- [ ] No `contactId`, `organizationId`, or `partyType` in payload
- [ ] Animal shows owner Party displayName

**Network validation:**
```json
// POST /api/v1/animals/{id}/owners payload:
{
  "partyId": 789,
  "currentOwner": true,
  ...
}
```

### 8. Breeding Attempt Stud Owner

**Test:** Create breeding attempt with studOwnerPartyId

**Steps:**
1. Navigate to Breeding Plans
2. Create or edit breeding attempt
3. Select stud owner (Party selection)
4. Submit

**Expected:**
- [ ] Stud owner selection is Party dropdown
- [ ] Network request payload contains `studOwnerPartyId`
- [ ] No `studOwnerContactId` in payload
- [ ] Breeding attempt displays stud owner Party displayName

**Network validation:**
```json
// POST /api/v1/breeding/{planId}/attempts payload:
{
  "studOwnerPartyId": 321,
  ...
}
```

### 9. Console Error Check

**Test:** No Party-related errors in browser console

**Steps:**
1. Perform all above tests
2. Monitor browser console throughout

**Expected:**
- [ ] No errors about missing partyId
- [ ] No errors about undefined kind or displayName
- [ ] No warnings about deprecated contactId/organizationId
- [ ] No 400/500 errors from Party endpoints

**Failure indicators:**
- Console errors: "Cannot read property 'kind' of undefined"
- Console errors: "partyId is required"
- Network errors: 400 "missing clientPartyId"

### 10. Network Payload Validation

**Test:** All Party-touched API calls use Party-native fields

**Steps:**
1. Open Network tab in dev tools
2. Perform creates/updates for waitlist, offspring, animals, breeding
3. Inspect request payloads and responses

**Expected:**
- [ ] All requests use partyId-based fields (clientPartyId, buyerPartyId, studOwnerPartyId, partyId)
- [ ] No requests contain contactId, organizationId, or partyType for Party surfaces
- [ ] All responses contain Party-native objects with kind and displayName
- [ ] No responses contain legacy derived fields (contact.display_name, organization.name separately)

## Regression Prevention

After any frontend deployment, run subset of critical tests:

**Minimum:**
1. Contacts list displays kind badges
2. Waitlist creation uses clientPartyId
3. Console has no Party errors
4. Network payloads are Party-native

**Full regression:**
Run entire checklist above

## Automated Test Recommendations (Future)

When test infrastructure is added, prioritize:

1. **Component tests:**
   - PartySelect dropdown component
   - PartyDisplay component (kind badge + displayName)
   - Waitlist form validation (clientPartyId required)

2. **Integration tests:**
   - Create waitlist entry -> verify partyId in request
   - Assign offspring buyer -> verify buyerPartyId in request
   - Assign animal owner -> verify partyId in request

3. **E2E tests:**
   - Full waitlist creation flow
   - Full offspring buyer assignment flow
   - Party deep link navigation

**Recommended tools:**
- Vitest for component tests
- Playwright or Cypress for E2E tests
- Mock Service Worker (MSW) for API mocking

## Troubleshooting

### Party displayName shows "undefined"

**Cause:** API response missing displayName or frontend expecting legacy field

**Fix:** Check network response has `displayName` field, update component to read `party.displayName` not `contact.display_name`

### Form rejects Party selection

**Cause:** Form validation expecting contactId/organizationId

**Fix:** Update form schema to expect clientPartyId/buyerPartyId/partyId

### Deep links 404

**Cause:** Routing not configured for /parties/:partyId

**Fix:** Add/update route handler for Party deep links

### Network 400 "missing clientPartyId"

**Cause:** Frontend sending legacy fields or no Party field

**Fix:** Update form submission to send clientPartyId from selected Party

## Related Documentation

- Backend: [Post-Migration Validation Runbook](../../breederhq-api/docs/runbooks/POST_MIGRATION_VALIDATION.md)
- Backend: [API Contract Tests](../../breederhq-api/tests/party-api-contracts.test.ts)
- Phase 3 commit: `e264602` (Frontend Party migration)
