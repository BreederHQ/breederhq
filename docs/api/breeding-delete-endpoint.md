# Breeding Plan Delete Endpoint - Backend Implementation Required

## Overview
The frontend now supports soft deletion of breeding plans with cascade to linked offspring groups. The backend needs to implement the corresponding endpoint.

## Required Endpoint

### `POST /api/v1/breeding/plans/:id/delete`

**Purpose**: Soft delete a breeding plan and cascade the deletion to any linked offspring groups.

**Request**:
- Method: `POST`
- Path: `/api/v1/breeding/plans/:id/delete`
- Headers:
  - `x-tenant-id`: Tenant ID (required)
  - `x-csrf-token`: CSRF token (required for mutations)
- Body: `{}` (empty object, following the pattern of `/archive` and `/restore`)

**Response**:
```json
{
  "ok": true
}
```

Or optionally return the updated plan object:
```json
{
  "id": 23,
  "deletedAt": "2025-12-24T16:35:00.000Z",
  ...other plan fields
}
```

## Implementation Requirements

### 1. Add `deletedAt` Column to Database
The `breeding_plans` table needs a `deletedAt` column:
```sql
ALTER TABLE breeding_plans
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
```

### 2. Soft Delete Logic
When the endpoint is called:

1. Set `deletedAt` to current timestamp on the plan:
   ```sql
   UPDATE breeding_plans
   SET deleted_at = NOW()
   WHERE id = :planId AND tenant_id = :tenantId;
   ```

2. Find and soft delete linked offspring groups:
   ```sql
   UPDATE offspring_groups
   SET deleted_at = NOW()
   WHERE plan_id = :planId AND tenant_id = :tenantId;
   ```

### 3. Filter Deleted Plans
Update the `listPlans` endpoint to exclude soft-deleted plans by default:
```sql
SELECT * FROM breeding_plans
WHERE tenant_id = :tenantId
  AND deleted_at IS NULL  -- Exclude deleted plans
```

Add query parameter support to include deleted plans if needed (for admin views):
```sql
-- If ?includeDeleted=true
SELECT * FROM breeding_plans
WHERE tenant_id = :tenantId
```

### 4. Offspring Group Schema
Ensure the `offspring_groups` table also has a `deleted_at` column:
```sql
ALTER TABLE offspring_groups
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
```

Update offspring group queries to filter out deleted groups by default.

## Frontend Implementation (Already Complete)

The frontend already has:
- ✅ `deletedAt` field in PlanRow type
- ✅ Delete button in plan details drawer
- ✅ Confirmation dialog with offspring warning
- ✅ API call to `POST /breeding/plans/:id/delete`
- ✅ Filters deleted plans from default view
- ✅ Read-only mode for deleted plans
- ✅ Safety gates (no edit, no commit for deleted plans)

## Pattern Reference

Follow the same pattern as the existing archive endpoints:

**Archive** (existing):
```typescript
archivePlan(id: number) {
  return post<{ ok: true }>(`/breeding/plans/${id}/archive`, {});
}
```

**Restore** (existing):
```typescript
restorePlan(id: number) {
  return post<{ ok: true }>(`/breeding/plans/${id}/restore`, {});
}
```

**Delete** (needs implementation):
```typescript
deletePlan(id: number) {
  return post<{ ok: true }>(`/breeding/plans/${id}/delete`, {});
}
```

## Offspring Group Cascade

The delete endpoint MUST cascade to offspring groups because:
1. A deleted breeding plan should not have active offspring records
2. The user is warned in the confirmation dialog: "This will soft delete the plan and any linked Offspring Group"
3. Consistency: if a plan is deleted, its offspring data becomes orphaned

## Restore Functionality (Future)

Consider adding a restore endpoint in the future:
- `POST /breeding/plans/:id/undelete`
- Sets `deletedAt` to NULL
- Optionally restores linked offspring groups

## Testing Checklist

- [ ] Create endpoint `POST /breeding/plans/:id/delete`
- [ ] Add `deleted_at` column to `breeding_plans` table
- [ ] Add `deleted_at` column to `offspring_groups` table
- [ ] Implement soft delete logic (update plan + cascade to groups)
- [ ] Filter deleted plans from `GET /breeding/plans` by default
- [ ] Filter deleted groups from offspring queries by default
- [ ] Test: delete a plan with linked offspring group
- [ ] Test: verify plan and group have `deletedAt` set
- [ ] Test: verify plan/group don't appear in default lists
- [ ] Test: verify frontend correctly hides deleted plans
- [ ] Test: verify frontend shows read-only banner for deleted plans
