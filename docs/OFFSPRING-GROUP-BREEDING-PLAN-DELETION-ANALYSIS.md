# Offspring Group & Breeding Plan Deletion - Business Rules Analysis

**Date:** January 15, 2026
**Purpose:** Evaluate business logic for offspring group and breeding plan deletion
**Status:** ✅ Analysis Complete

---

## 🎯 Executive Summary

**User Concern:**
> "it appears we have some issues related to the deletion of offspring groups (when allowed) and not also deleting/removing their linked offspring groups."

**Finding:** **No issue exists** - The current implementation already prevents the scenario described:

1. ✅ Offspring groups **CANNOT** be deleted when linked to a breeding plan
2. ✅ Breeding plan deletion **DOES** cascade to linked offspring groups (soft delete)
3. ✅ User **IS** prompted when deleting a breeding plan about cascade behavior
4. ✅ Foreign key constraints prevent orphaned records

**Recommendation:** Current business rules are sound. If a specific issue was encountered, it may be a UX clarity issue rather than a business logic gap.

---

## 📋 Current Business Rules

### Rule 1: Offspring Group Deletion (Hard Delete)

**File:** `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\offspring.ts` (Lines 1629-1726)

**Behavior:** HARD DELETE (permanently removes from database)

**Business Rule:** Can only delete if ALL of the following are false:

```typescript
const blockers = {
  hasLinkedPlan: offspringGroup.linkState === "linked",  // ← BLOCKS deletion if linked
  hasOffspring: offspringGroup._count.offspring > 0,
  hasBuyers: offspringGroup._count.buyers > 0,
  hasInvoices: offspringGroup._count.invoices > 0,
  hasDocuments: offspringGroup._count.documents > 0,
  hasContracts: offspringGroup._count.contracts > 0,
  hasExpenses: offspringGroup._count.expenses > 0,
  hasWaitlist: offspringGroup._count.waitlistEntries > 0,
  hasEvents: offspringGroup._count.events > 0,
  hasAttachments: offspringGroup._count.attachments > 0,
  hasCampaigns: offspringGroup._count.campaigns > 0,
  hasTasks: offspringGroup._count.tasks > 0,
  hasSchedulingBlocks: offspringGroup._count.schedulingBlocks > 0,
  hasTags: offspringGroup._count.tags > 0,
};
```

**Special Blocker for Linked Plans:**

```typescript
// EXPLICIT CHECK: Cannot delete if linked to breeding plan
if (offspringGroup.linkState === "linked") {
  return res.status(409).json({
    error: "OFFSPRING_GROUP_DELETE_BLOCKED_LINKED_PLAN",
    message: "Cannot delete an offspring group that is linked to a breeding plan. Unlink or archive instead.",
  });
}
```

**Key Finding:** Offspring groups **CANNOT** be deleted while linked to a breeding plan. The user must first unlink or archive.

---

### Rule 2: Breeding Plan Deletion (Soft Delete)

**File:** `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\breeding.ts` (Lines 1719-1841)

**Behavior:** SOFT DELETE (sets `deletedAt` timestamp, preserves data)

**Business Rule:** Can only delete if ALL of the following are true:

1. ✅ `breedDateActual` has NOT been set (permanent rule for data integrity)
2. ✅ Linked offspring group has NO offspring records
3. ✅ Linked offspring group has NO buyers/waitlist entries

**Cannot Delete After Breed Date:**

```typescript
if (plan.breedDateActual) {
  return res.status(409).json({
    error: "cannot_delete_bred_plan",
    detail: "Plans cannot be deleted after the Breed Date (Actual) has been entered. This is a permanent business rule to protect breeding data integrity.",
  });
}
```

**Cascade Behavior:**

```typescript
// Soft delete the breeding plan
await tx.breedingPlan.update({
  where: { id },
  data: { deletedAt: now, archived: true },
});

// CASCADE: Soft delete linked offspring groups
await tx.offspringGroup.updateMany({
  where: { planId: id, tenantId, deletedAt: null },
  data: { deletedAt: now },  // ← Automatically sets deletedAt on offspring groups
});
```

**User Prompt (Frontend):**

```typescript
// File: apps/breeding/src/App-Breeding.tsx (Lines 5249-5270)
const confirmed = window.confirm(
  `Are you sure you want to delete this breeding plan?\n\n` +
  `This will soft delete the plan and any linked Offspring Group.\n\n` +  // ← User IS informed
  `Note: You can restore soft-deleted plans later if needed.`
);
```

**Key Finding:** Breeding plan deletion **DOES** cascade to offspring groups, and the user **IS** prompted about this behavior.

---

## 🔗 Database Relationships

**File:** `C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma`

```prisma
model OffspringGroup {
  id        Int      @id @default(autoincrement())
  planId    Int?     // Nullable foreign key
  plan      BreedingPlan? @relation(fields: [planId], references: [id], onDelete: SetNull)
  deletedAt DateTime?
  linkState String?  // "linked" | "unlinked" | null
  // ... other fields
}

model BreedingPlan {
  id              Int      @id @default(autoincrement())
  deletedAt       DateTime?
  archived        Boolean  @default(false)
  offspringGroups OffspringGroup[]
  // ... other fields
}
```

**Foreign Key Behavior:** `onDelete: SetNull`

- When a breeding plan is HARD deleted (directly in DB), the `planId` in offspring groups is set to NULL
- This prevents orphaned foreign keys and database integrity violations
- However, the application uses SOFT delete for breeding plans, so this is a safety net

**Key Finding:** Foreign key constraints prevent orphaned records.

---

## 📊 Deletion Flow Analysis

### Scenario 1: User Tries to Delete Offspring Group (While Linked)

```
User clicks "Delete Offspring Group"
    ↓
API: DELETE /api/v1/offspring/:id
    ↓
Check: linkState === "linked"?
    ↓ YES
❌ Return 409 error: "OFFSPRING_GROUP_DELETE_BLOCKED_LINKED_PLAN"
    ↓
Frontend: Show error message
    ↓
Result: DELETION BLOCKED ✅ (prevents the issue user mentioned)
```

### Scenario 2: User Deletes Breeding Plan (With Linked Offspring Group)

```
User clicks "Delete Breeding Plan"
    ↓
Frontend: Show confirmation prompt
"This will soft delete the plan and any linked Offspring Group"
    ↓
User confirms
    ↓
API: POST /api/v1/breeding/plans/:id/delete
    ↓
Check: breedDateActual set?
    ↓ NO (allowed to delete)
Check: Linked offspring group has offspring/buyers?
    ↓ NO (allowed to delete)
Start transaction:
    1. Set breedingPlan.deletedAt = now
    2. Set offspringGroup.deletedAt = now (CASCADE) ✅
    3. Update animal breeding status
    4. Decrement dam/sire usage quota
    ↓
Result: Both soft deleted, can be restored ✅
```

### Scenario 3: User Deletes Breeding Plan (Cannot Delete)

```
User clicks "Delete Breeding Plan"
    ↓
API: Check breedDateActual
    ↓ breedDateActual IS SET
❌ Return 409 error: "cannot_delete_bred_plan"
    ↓
OR
    ↓
Linked offspring group has offspring/buyers
❌ Return 409 error: "cannot_delete_plan_with_data"
    ↓
Result: DELETION BLOCKED ✅ (protects business data)
```

---

## ✅ Validation of Business Rules

### ✅ Offspring Group Deletion Rules (CORRECT)

1. **Cannot delete if linked to breeding plan** - ✅ Enforced
2. **Cannot delete if has offspring records** - ✅ Enforced
3. **Cannot delete if has buyers/waitlist** - ✅ Enforced
4. **Cannot delete if has invoices/contracts** - ✅ Enforced
5. **Cannot delete if has financial data** - ✅ Enforced
6. **Can only delete "empty" offspring groups** - ✅ Enforced

**Rationale:** Hard delete is safe because it only applies to truly unused records.

---

### ✅ Breeding Plan Deletion Rules (CORRECT)

1. **Cannot delete after breed date actual set** - ✅ Enforced (permanent rule)
2. **Cannot delete if offspring group has data** - ✅ Enforced
3. **Soft delete (not hard delete)** - ✅ Implemented
4. **Cascades to offspring groups** - ✅ Implemented
5. **User is prompted about cascade** - ✅ Implemented
6. **Can be restored later** - ✅ Supported (soft delete)

**Rationale:** Soft delete preserves breeding history for reporting and restore capabilities.

---

## 🔍 Gap Analysis

### User's Stated Concern

> "it appears we have some issues related to the deletion of offspring groups (when allowed) and not also deleting/removing their linked offspring groups."

### Analysis of Concern

**Interpretation 1:** "When deleting an offspring group, the linked breeding plan is not also deleted"

- **Not an issue:** Offspring groups cannot be deleted while linked. User must unlink first.
- **By design:** Breeding plan is the "parent" entity, should not auto-delete when offspring group is removed.

**Interpretation 2:** "When deleting a breeding plan, the linked offspring group is not also deleted"

- **Not an issue:** Breeding plan deletion DOES cascade soft delete to offspring groups.
- **User IS prompted:** Frontend shows explicit message about cascade behavior.

**Interpretation 3:** "The business rules are unclear or inconsistent"

- **Partially valid:** The rules ARE complex (soft delete vs hard delete, many blockers).
- **Recommendation:** Improve UX messaging to clarify when deletion is/isn't allowed.

---

## 🚨 Potential Issues (If User Encountered Specific Problem)

### Possibility 1: Unlinked Offspring Groups

**Scenario:** Offspring group was manually unlinked (`linkState = "unlinked"`), then breeding plan deleted, leaving "orphaned" offspring group with `planId` still set but `linkState = "unlinked"`.

**Impact:** Offspring group would still reference deleted breeding plan, but would not be cascade-deleted.

**Check:** Does the breeding plan deletion cascade logic check `linkState`?

```typescript
// Current cascade logic (Line 1831)
await tx.offspringGroup.updateMany({
  where: { planId: id, tenantId, deletedAt: null },  // ← Only checks planId, not linkState
  data: { deletedAt: now },
});
```

**Finding:** Cascade logic uses `planId`, not `linkState`. This means:
- ✅ ALL offspring groups with `planId = <deleted plan>` are cascade-deleted
- ✅ Even if `linkState = "unlinked"`, they still get soft deleted
- ✅ This is CORRECT behavior (foreign key relationship is what matters)

---

### Possibility 2: Hard Delete vs Soft Delete Confusion

**Scenario:** User expects "delete" to mean "completely remove" but breeding plans use soft delete.

**Impact:** Records still exist in database with `deletedAt` set, may appear "not deleted" in some views.

**Recommendation:**
- Clarify in UI that deletion is "soft" (can be restored)
- Add "permanently delete" option for admins (hard delete) if needed
- Filter out soft-deleted records in all queries unless explicitly showing "deleted" items

---

### Possibility 3: Frontend Display Issue

**Scenario:** Deleted offspring groups still showing in some frontend views.

**Impact:** User sees "deleted" offspring groups, thinks deletion didn't work.

**Check:** Do all frontend queries filter `deletedAt IS NULL`?

**Recommendation:** Audit all Prisma queries to ensure:
```typescript
// Always filter soft-deleted records
where: {
  tenantId,
  deletedAt: null,  // ← Must be explicit in every query
}
```

---

## 📝 Recommendations

### 1. UX Improvements (HIGH PRIORITY)

**Current Issue:** User may not understand when/why deletion is blocked.

**Recommendation:** Improve error messages and pre-delete warnings:

```typescript
// Before attempting delete, check blockers and show specific message
if (offspringGroup.linkState === "linked") {
  showWarning(
    "Cannot Delete Linked Offspring Group",
    "This offspring group is currently linked to a breeding plan. " +
    "You must first unlink it from the breeding plan before deletion. " +
    "Alternatively, you can delete the breeding plan, which will also delete this offspring group."
  );
}
```

---

### 2. Add Unlink Option to UI (MEDIUM PRIORITY)

**Current Issue:** User must manually change `linkState` to delete offspring group.

**Recommendation:** Add "Unlink from Breeding Plan" button in offspring group UI:

```typescript
async function unlinkFromBreedingPlan(offspringGroupId: number) {
  await api.patch(`/api/v1/offspring/${offspringGroupId}`, {
    linkState: "unlinked",
  });
  // Now user can delete offspring group if needed
}
```

---

### 3. Add "Delete with Offspring Group" Option (LOW PRIORITY)

**Current Issue:** User may want to delete breeding plan AND permanently remove offspring group in one action.

**Recommendation:** Add optional `deleteOffspringGroup` parameter:

```typescript
// API: POST /api/v1/breeding/plans/:id/delete
{
  deleteOffspringGroup: true  // Optional: hard delete offspring group after soft deleting plan
}
```

**Implementation:**
```typescript
if (req.body.deleteOffspringGroup && linkedGroup && Object.values(blockers).every(b => !b)) {
  // After soft deleting plan, hard delete offspring group
  await tx.offspringGroup.delete({ where: { id: linkedGroup.id } });
}
```

---

### 4. Audit All Soft Delete Queries (HIGH PRIORITY)

**Current Issue:** May be missing `deletedAt: null` filter in some queries.

**Recommendation:** Add global Prisma middleware to automatically filter soft-deleted records:

```typescript
// prisma/middleware.ts
prisma.$use(async (params, next) => {
  // Auto-filter soft-deleted records on all findMany/findFirst queries
  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }
  return next(params);
});
```

---

### 5. Add Restore Functionality (MEDIUM PRIORITY)

**Current Issue:** Soft-deleted breeding plans can be restored, but no UI for it.

**Recommendation:** Add "Restore Deleted Plans" view:

```typescript
// API: POST /api/v1/breeding/plans/:id/restore
await prisma.breedingPlan.update({
  where: { id },
  data: { deletedAt: null, archived: false },
});

// Also restore linked offspring groups
await prisma.offspringGroup.updateMany({
  where: { planId: id },
  data: { deletedAt: null },
});
```

---

## 🎯 Summary of Findings

### ✅ What Works Correctly

1. Offspring groups **CANNOT** be deleted when linked to breeding plan
2. Breeding plan deletion **CASCADES** to offspring groups (soft delete)
3. User **IS PROMPTED** about cascade behavior
4. Foreign key constraints prevent orphaned records
5. Soft delete preserves data for restore/reporting
6. Hard delete only allowed for truly unused offspring groups

### ⚠️ Potential Improvements

1. **UX Clarity:** Error messages could be more helpful
2. **Unlink UI:** No obvious way to unlink offspring group from breeding plan
3. **Restore UI:** No way to restore soft-deleted records
4. **Query Consistency:** May need audit of `deletedAt` filters across all queries

### ❌ No Critical Issues Found

The business logic is sound and already prevents the scenario described in the user's concern.

---

## 🔄 Next Steps

1. **Clarify with User:** Ask for specific scenario where issue occurred
   - What were they trying to delete?
   - What happened vs. what they expected?
   - Were they getting an error message?

2. **If No Specific Issue:** Focus on UX improvements
   - Improve error messaging
   - Add unlink button to offspring group UI
   - Add restore functionality for soft-deleted records

3. **If Frontend Display Issue:** Audit queries
   - Verify all `findMany`/`findFirst` filter `deletedAt: null`
   - Add Prisma middleware for automatic filtering
   - Test all views to ensure deleted records don't appear

---

## 📚 Related Files

**Backend (API):**
- `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\offspring.ts` (Lines 1629-1726) - Offspring group deletion
- `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\breeding.ts` (Lines 1719-1841) - Breeding plan deletion
- `C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma` - Database schema

**Frontend:**
- `apps\breeding\src\App-Breeding.tsx` (Lines 5249-5270) - Delete plan handler

**Documentation:**
- This document - Business rules analysis

---

**Status:** ✅ Analysis Complete
**Conclusion:** No business logic gap found. Current implementation prevents the stated concern. Recommend UX improvements for clarity.

**Date:** January 15, 2026
**Analyst:** Claude Code (Sonnet 4.5)
