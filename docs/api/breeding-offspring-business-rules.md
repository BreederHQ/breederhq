# Breeding Plan & Offspring Group Business Rules

## Overview

This document defines the business logic rules that protect breeding plans and offspring groups from entering inconsistent states. These rules ensure data integrity throughout the breeding lifecycle and prevent scenarios that could lead to orphaned data, broken genealogy, temporal inconsistencies, or compromised genetic/lineage records.

## Core Principles

### Data Immutability Philosophy

1. **Birth is a Lock Point**: Once `birthDateActual` is recorded, it represents a real-world biological event. All upstream breeding history becomes immutable.

2. **Lineage is Sacred**: Parent-offspring relationships (damId, sireId) are critical for:
   - Coefficient of Inbreeding (COI) calculations
   - Genetic health screening
   - Pedigree generation
   - Breed registry compliance
   - Legal/regulatory requirements

3. **Business Data Creates Permanence**: Once an offspring has real business interactions (buyers, contracts, payments, health records), it becomes a permanent record.

---

## Breeding Plan Status Lifecycle

### Valid Statuses (in progression order)

```
PLANNING → COMMITTED → CYCLE_EXPECTED → HORMONE_TESTING → BRED → PREGNANT → BIRTHED → WEANED → PLACEMENT → COMPLETE
                                                                                                            ↓
                                                                                                        CANCELED
```

### Actual Date Fields

| Status | Required Actual Date |
|--------|---------------------|
| BRED | `cycleStartDateActual` |
| BIRTHED | `breedDateActual` |
| WEANED | `birthDateActual` |
| PLACEMENT | `weanedDateActual` |
| COMPLETE | `placementCompletedDateActual` |

---

## Business Rules

### Rule 1: Birth Date Actual is a LOCK POINT

**Endpoints Affected:**
- `PATCH /breeding/plans/:id`

**Rule:** Once `birthDateActual` is recorded, ALL upstream dates become immutable. They cannot be cleared or modified.

**Upstream dates (locked by birth):**
- `cycleStartDateActual`
- `hormoneTestingStartDateActual`
- `breedDateActual`

**Rationale:** Birth is a real-world biological event that validates the entire upstream breeding history. Once a litter is born, the cycle start, hormone testing, and breeding dates are historical facts that cannot change. This protects:
- Lineage integrity for genetics/COI calculations
- Breed registry compliance
- Legal/regulatory audit trails
- Reproductive health analytics

**Error Response:**
```json
{
  "error": "upstream_dates_locked_by_birth",
  "detail": "Cannot clear cycleStartDateActual because the actual birth date has been recorded. Once birth occurs, the breeding history is locked to preserve data integrity for lineage and genetics tracking."
}
```

**Implementation:**
- File: `breederhq-api/src/routes/breeding.ts`
- Lines: 1075-1114

---

### Rule 2: Cannot Add Offspring Without Birth Date

**Endpoints Affected:**
- `POST /offspring/:id/animals`
- `POST /offspring/individuals`

**Rule:** An offspring cannot be added to an offspring group if the linked breeding plan does not have `birthDateActual` recorded.

**Rationale:** Offspring must have a verified birth date before they can be registered. This ensures all offspring have accurate birth records tied to an actual breeding event.

**Error Response:**
```json
{
  "error": "birth_date_not_recorded",
  "detail": "Cannot add offspring until the birth date has been recorded on the linked breeding plan."
}
```

**Implementation:**
- File: `breederhq-api/src/routes/offspring.ts`
- Lines: 1799-1805 (individuals), 2381-2387 (animals)

---

### Rule 3: Cannot Clear Birth Date With Offspring

**Endpoint Affected:**
- `PATCH /breeding/plans/:id`

**Rule:** The `birthDateActual` field cannot be cleared (set to null) if the linked offspring group contains any offspring records.

**Rationale:** Once offspring have been recorded under a birth date, that date becomes a permanent part of their record. Clearing it would orphan the offspring records and break their temporal context.

**Error Response:**
```json
{
  "error": "cannot_clear_birth_date_with_offspring",
  "detail": "Cannot clear the actual birth date because offspring have already been added to the linked offspring group. Remove all offspring first before clearing this date."
}
```

**Implementation:**
- File: `breederhq-api/src/routes/breeding.ts`
- Lines: 1116-1138

---

### Rule 4: Downstream Date Consistency

**Endpoint Affected:**
- `PATCH /breeding/plans/:id`

**Rule:** Post-birth dates follow a cascade rule - cannot clear an upstream date if downstream dates exist.

**Date Hierarchy (post-birth):**
```
birthDateActual
    → weanedDateActual
        → placementStartDateActual
            → placementCompletedDateActual
```

**Specific Rules:**
- Cannot clear `weanedDateActual` if `placementStartDateActual` is set
- Cannot clear `placementStartDateActual` if `placementCompletedDateActual` is set

**Rationale:** The post-birth lifecycle follows a strict temporal sequence. Weaning must occur before placement can begin.

**Error Response:**
```json
{
  "error": "cannot_clear_date_with_downstream_date",
  "detail": "Cannot clear the actual weaned date because the actual placement start date is recorded. Clear the placement start date first."
}
```

**Implementation:**
- File: `breederhq-api/src/routes/breeding.ts`
- Lines: 1140-1162

---

### Rule 5: Cannot Unlink Offspring Group With Offspring

**Endpoint Affected:**
- `POST /offspring/groups/:groupId/unlink`

**Rule:** An offspring group cannot be unlinked from its breeding plan if the group contains any offspring records.

**Rationale:** Unlinking a group with offspring would orphan those records, breaking the genealogy chain. The offspring would lose their connection to the breeding plan that produced them, destroying lineage data required for COI calculations.

**Error Response:**
```json
{
  "error": "cannot_unlink_group_with_offspring",
  "detail": "Cannot unlink an offspring group from its breeding plan because offspring have already been added. Remove all offspring first before unlinking the group."
}
```

**Implementation:**
- File: `breederhq-api/src/routes/offspring.ts`
- Lines: 196-211

---

### Rule 6: Status Regression Validation

**Endpoint Affected:**
- `PATCH /breeding/plans/:id`

**Rule:** When the breeding plan status is being regressed (moved backwards in the lifecycle), additional validations apply.

#### Sub-rule 6a: Cannot Regress Past BIRTHED With Offspring

If the plan status is being changed from BIRTHED (or later) to a pre-BIRTHED status, the system checks if offspring exist. If offspring exist, the regression is blocked.

**Error Response:**
```json
{
  "error": "cannot_regress_status_with_offspring",
  "detail": "Cannot change status from WEANED to BRED because offspring have already been added. Remove all offspring first before regressing the plan status."
}
```

#### Sub-rule 6b: Cannot Regress While Dates Exist

If regressing to a status that is earlier than a recorded actual date, the regression is blocked.

| Target Status | Blocking Date |
|---------------|---------------|
| Pre-BIRTHED | `birthDateActual` |
| Pre-WEANED | `weanedDateActual` |
| Pre-PLACEMENT | `placementStartDateActual` |
| Pre-COMPLETE | `placementCompletedDateActual` |

**Error Response:**
```json
{
  "error": "cannot_regress_status_with_date",
  "detail": "Cannot change status to BRED while birthDateActual is recorded. Clear the birth date first."
}
```

**Implementation:**
- File: `breederhq-api/src/routes/breeding.ts`
- Lines: 1241-1302

---

### Rule 7: Offspring Deletion Protection (Mistaken Entry Handling)

**Endpoint Affected:**
- `DELETE /offspring/individuals/:id`

**Rule:** Offspring can only be deleted if they are "fresh" - meaning they have no real business data attached. Once any of the following conditions are met, the offspring becomes a permanent record and cannot be deleted.

**Deletion Blockers:**

| Blocker | Condition | Reason |
|---------|-----------|--------|
| `hasBuyer` | `buyerPartyId` is set | Buyer relationship creates legal/business record |
| `isPlaced` | `placementState = PLACED` or `placedAt` set | Placement is a permanent life event |
| `hasFinancialState` | `financialState` is not NONE | Financial transactions are audit records |
| `hasPayments` | `paidInFullAt` or `depositCents` set | Payments create legal obligations |
| `hasContract` | `contractId` or `contractSignedAt` set | Contracts are legal documents |
| `isPromoted` | `promotedAnimalId` is set | Promoted to full animal record |
| `isDeceased` | `lifeState = DECEASED` or `diedAt` set | Death is permanent historical record |
| `hasHealthEvents` | Health event records exist | Medical history is permanent |
| `hasDocuments` | Document records exist | Documentation is audit trail |
| `hasInvoices` | Invoice records exist | Financial records are permanent |

**Use Case:** A user accidentally creates an offspring (wrong sex, typo in name, duplicate entry) and needs to remove it immediately. This is allowed as long as no business actions have been taken on the offspring.

**Error Response:**
```json
{
  "error": "offspring_delete_blocked",
  "detail": "Cannot delete this offspring because it has associated business data. Offspring with buyers, contracts, payments, health records, or placement history are permanent records for lineage and regulatory compliance.",
  "blockers": {
    "hasBuyer": true,
    "hasContract": true
  }
}
```

**Implementation:**
- File: `breederhq-api/src/routes/offspring.ts`
- Lines: 2352-2438

---

### Rule 8: Lineage Immutability (Parent References)

**Principle:** Once an offspring or animal has established parent references (damId, sireId), these relationships should be treated as immutable in production scenarios.

**Current State:** The system allows parent references to be modified via `PUT /animals/:id/parents`. This endpoint should be restricted to:
- Initial setup (setting parents for the first time)
- Data correction by administrators (with audit logging)
- NEVER for routine updates

**Why This Matters:**
- **COI Calculations:** Changing parents invalidates all COI calculations for descendants
- **Pedigrees:** Printed/exported pedigrees become incorrect
- **Breed Registries:** May violate registry rules
- **Legal:** Buyer contracts often reference lineage

**Recommended Future Enhancement:**
- Add audit logging for all parent changes
- Require admin role for parent modifications on established animals
- Consider soft-lock after animal has descendants

---

## Summary Table

| Scenario | Behavior | Error Code |
|----------|----------|------------|
| Modify/clear upstream dates after birth | **Blocked** | `upstream_dates_locked_by_birth` |
| Add offspring without `birthDateActual` | **Blocked** | `birth_date_not_recorded` |
| Clear `birthDateActual` with offspring | **Blocked** | `cannot_clear_birth_date_with_offspring` |
| Clear `weanedDateActual` while `placementStartDateActual` set | **Blocked** | `cannot_clear_date_with_downstream_date` |
| Clear `placementStartDateActual` while `placementCompletedDateActual` set | **Blocked** | `cannot_clear_date_with_downstream_date` |
| Unlink offspring group with offspring | **Blocked** | `cannot_unlink_group_with_offspring` |
| Regress status past BIRTHED with offspring | **Blocked** | `cannot_regress_status_with_offspring` |
| Regress status while corresponding dates set | **Blocked** | `cannot_regress_status_with_date` |
| Delete fresh offspring (no business data) | **Allowed** | - |
| Delete offspring with business data | **Blocked** | `offspring_delete_blocked` |

---

## Data Flow Diagram

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    BREEDING PLAN                             │
                    │                                                              │
   PLANNING ──────► │  cycleStartDateActual ──► breedDateActual ──► birthDateActual │
                    │         │                       │                    │        │
                    │         │                       │                    │        │
                    │         └───────────────────────┴────────────────────┘        │
                    │                           │                                   │
                    │                    LOCK POINT                                 │
                    │              (upstream becomes immutable)                     │
                    │                           │                                   │
                    │                           ▼                                   │
                    │  weanedDateActual ──► placementStartDateActual ──► placementCompletedDateActual
                    │                                                              │
                    └─────────────────────────────────────────────────────────────┘
                                               │
                                               │ produces
                                               ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                   OFFSPRING GROUP                            │
                    │                                                              │
                    │  planId (FK) ◄──── Cannot unlink if offspring exist          │
                    │  damId, sireId ◄── Lineage references (immutable)            │
                    │                                                              │
                    └─────────────────────────────────────────────────────────────┘
                                               │
                                               │ contains
                                               ▼
                    ┌─────────────────────────────────────────────────────────────┐
                    │                      OFFSPRING                               │
                    │                                                              │
                    │  Fresh (deletable):     │  Permanent (blocked):              │
                    │  - No buyer             │  - Has buyer                       │
                    │  - No placement         │  - Is placed                       │
                    │  - No payments          │  - Has payments                    │
                    │  - No contracts         │  - Has contract                    │
                    │  - No health records    │  - Has health records              │
                    │  - Not deceased         │  - Is deceased                     │
                    │  - Not promoted         │  - Is promoted to Animal           │
                    │                                                              │
                    └─────────────────────────────────────────────────────────────┘
```

---

## Frontend Behavior

The frontend (breeding app) handles these errors gracefully:

### Reset All Dates Button
- Location: Plan Details Drawer → Dates Tab
- When the backend rejects the reset, a dialog displays the error message
- User must resolve the blocking condition before retrying

### Individual Date Clearing
- The `clearActualDateAndSubsequent` function shows the error to the user
- Draft changes are reverted when the save fails
- User sees a confirmation dialog with the specific error detail

### Implementation Files
- `apps/breeding/src/App-Breeding.tsx`
  - Lines 7005-7021: Individual date clearing error handling
  - Lines 9421-9431: Reset all dates error handling

---

## Testing

Automated Playwright tests validate all business rules:

**Test File:** `e2e/breeding-offspring-business-rules.spec.ts`

**Prerequisites:**
1. API server running on localhost:6001
2. Test users seeded: `cd breederhq-api && npm run db:dev:seed:users`
3. Test tenant needs proper subscription entitlements (BREEDING_PLAN_QUOTA)

**Run Tests:**
```bash
# Run all business rules tests
npx playwright test breeding-offspring-business-rules

# Run with UI mode for debugging
npx playwright test breeding-offspring-business-rules --ui

# Run headed (visible browser)
npx playwright test breeding-offspring-business-rules --headed
```

**Troubleshooting:**
- If tests fail with `QUOTA_EXCEEDED`, the test tenant lacks entitlements. Run subscription seeding in breederhq-api or manually add `BREEDING_PLAN_QUOTA` entitlement to tenant ID 1.
- If tests fail with `invalid_credentials`, run the test user seeding script.

**Test Coverage:**
- Rule 1: Birth Date Lock Point (3 tests)
- Rule 2: Cannot Add Offspring Without Birth Date (2 tests)
- Rule 3: Cannot Clear Birth Date With Offspring (1 test)
- Rule 4: Downstream Date Consistency (2 tests)
- Rule 5: Cannot Unlink Group With Offspring (1 test)
- Rule 6: Status Regression Validation (2 tests)
- Rule 7: Offspring Deletion Protection (4 tests)

---

## Related Documentation

- [Breeding Domain ERD](../erd/04-breeding.md) - Database schema
- [Offspring Domain ERD](../erd/05-offspring.md) - Offspring group schema
- [Breeding Delete Endpoint](./breeding-delete-endpoint.md) - Soft delete behavior

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-14 | Initial documentation of business rules |
| 2026-01-14 | Added Birth Date as Lock Point rule (upstream date immutability) |
| 2026-01-14 | Added Offspring Deletion Protection (fresh vs permanent) |
| 2026-01-14 | Added Lineage Immutability principle |
