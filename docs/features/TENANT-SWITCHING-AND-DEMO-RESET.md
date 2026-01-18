# Tenant Switching & Demo Tenant Reset Feature

> **Created**: January 2026
> **Purpose**: Enable multi-tenant switching via UI and provide resettable demo tenants for training/demos

---

## Overview

This document covers two related features:

1. **Tenant Switcher** - Account menu dropdown allowing users with multiple tenant memberships to switch between organizations without logging out
2. **Demo Tenant Reset** - Special demo tenants that super admins can reset to a known state for training and demos

---

## Part 1: Tenant Switcher

### User Experience

Users see an "Account" dropdown button in the navigation header. When clicked:

- Shows current tenant with a checkmark
- Shows "Switch to" section with other accessible tenants (only if user has multiple memberships)
- Shows Settings link (if applicable)
- Shows Sign Out option
- Shows "Reset Demo Tenant" option (only for super admins on demo tenants)

### Components Modified

#### 1. AccountMenu Component (NEW)

**Location**: `packages/ui/src/components/AccountMenu/AccountMenu.tsx`

Props interface:
```typescript
export interface AccountMenuProps {
  currentTenant?: { id: number; name: string; slug: string } | null;
  memberships?: TenantMembership[];
  onTenantSwitch?: (tenantId: number) => void;
  onSettingsClick?: () => void;
  onLogout: () => void;
  isSuperAdmin?: boolean;
  isDemoTenant?: boolean;
  onDemoReset?: () => void;
}

export interface TenantMembership {
  tenantId: number;
  tenantName: string;
  tenantSlug: string;
  role: string | null;
}
```

Features:
- Dropdown menu with click-outside-to-close
- Escape key closes menu
- Current tenant highlighted with checkmark
- Role displayed under each tenant name
- Demo reset with confirmation dialog

#### 2. NavShell Updates

**Location**: `packages/ui/src/layouts/NavShell.tsx`

Changes:
- Removed separate logout button and org name button
- Added AccountMenu component
- New props passed through for tenant context

New props added to NavShellProps:
```typescript
currentTenant?: { id: number; name: string; slug: string } | null;
memberships?: TenantMembership[];
onTenantSwitch?: (tenantId: number) => void;
isSuperAdmin?: boolean;
isDemoTenant?: boolean;
onDemoReset?: () => void;
```

#### 3. Session Endpoint Enhancements

**Location**: `breederhq-api/src/routes/session.ts`

Enhanced `GET /session` response now includes:
- `tenant.isDemoTenant` - boolean flag
- `tenant.demoResetType` - 'fresh' or 'lived-in'
- `memberships[].tenantName` - tenant name for display
- `memberships[].tenantSlug` - tenant slug

#### 4. App-Platform Integration

**Location**: `apps/platform/src/App-Platform.tsx`

Changes:
- Added `TenantMembership` type
- Updated `AuthState` to include `tenant` and `memberships`
- Added `handleTenantSwitch()` function that calls `POST /session/tenant`
- Added `handleDemoReset()` function that calls `POST /tenants/:id/reset`
- Passes all tenant data to NavShell

### API Endpoint

**Existing**: `POST /session/tenant`

Request body:
```json
{
  "tenantId": 123,
  "saveDefault": false
}
```

Response:
```json
{
  "ok": true,
  "tenant": { "id": 123 },
  "savedAsDefault": false
}
```

Requires CSRF token in `x-csrf-token` header.

---

## Part 2: Demo Tenant Reset

### Schema Changes

**Location**: `breederhq-api/prisma/schema.prisma`

Added to Tenant model:
```prisma
model Tenant {
  // ... existing fields ...
  isDemoTenant  Boolean @default(false)
  demoResetType String? // 'fresh' | 'lived-in'
}
```

Run migration:
```bash
cd breederhq-api
npx prisma migrate dev --name add_demo_tenant_fields
```

### Reset Endpoint

**Location**: `breederhq-api/src/routes/tenant.ts`

**Endpoint**: `POST /tenants/:id/reset`

Requirements:
- User must be super admin
- Tenant must have `isDemoTenant = true`

What it does:
1. Validates permissions
2. Deletes all tenant data in FK-safe order (inside transaction):
   - BreedingPlanWindow
   - BreedingProgram
   - BreedingPlan
   - HeatCycle
   - OffspringAssignment
   - OffspringGroup
   - Offspring
   - Animal
   - Litter
   - BreedingEvent
   - FoalingChecklist
   - Contract (many relationships)
   - Invoice/Payment/etc.
   - Document
   - Contact
   - Party
   - Tag
3. Calls seed script to repopulate based on `demoResetType`
4. Returns success response

Response:
```json
{
  "ok": true,
  "message": "Demo tenant reset complete",
  "type": "fresh"
}
```

### Demo Seed Script

**Location**: `breederhq-api/scripts/demo-tenant/seed-demo-tenant.ts`

Usage:
```bash
# Seed fresh demo tenant:
npx tsx scripts/demo-tenant/seed-demo-tenant.ts --tenant=demo-fresh --type=fresh

# Seed lived-in demo tenant:
npx tsx scripts/demo-tenant/seed-demo-tenant.ts --tenant=demo-lived-in --type=lived-in
```

What it does:
1. Creates or updates tenant with `isDemoTenant=true`
2. Creates demo user if not exists
3. Seeds data based on type:
   - **fresh**: Minimal data (just user/tenant) - simulates new subscriber experience
   - **lived-in**: Sample contacts, animals, and tags - simulates established breeder

Script is idempotent - safe to run multiple times.

### Demo Tenants

| Slug | Name | Type | Description |
|------|------|------|-------------|
| `demo-fresh` | Demo - Fresh Start | fresh | Pristine state like a new subscriber |
| `demo-lived-in` | Demo - Established Breeder | lived-in | 2-3 years of realistic breeding data |

### Demo User Credentials

```
Email:    demo@breederhq.com
Password: DemoPassword123!
```

This user:
- Is a super admin (can access all features)
- Is member of all demo tenants
- Has demo tenants set as default

---

## UI Behavior

### When to Show Tenant Switcher
- Only when user has 2+ tenant memberships
- Shows all accessible tenants except current one in "Switch to" section

### When to Show Reset Demo Button
- Only when `isDemoTenant === true` AND `isSuperAdmin === true`
- Shows in AccountMenu dropdown
- Requires confirmation before executing

### Reset Flow
1. User clicks "Reset Demo Tenant" in account menu
2. Confirmation dialog appears with warning
3. User confirms
4. API call to `POST /tenants/:id/reset`
5. User is logged out
6. User redirected to login page
7. User logs back in to fresh/reset tenant

---

## Files Reference

### New Files
- `packages/ui/src/components/AccountMenu/AccountMenu.tsx`
- `packages/ui/src/components/AccountMenu/index.ts`
- `breederhq-api/scripts/demo-tenant/seed-demo-tenant.ts`

### Modified Files
- `packages/ui/src/layouts/NavShell.tsx`
- `breederhq-api/src/routes/session.ts`
- `breederhq-api/src/routes/tenant.ts`
- `breederhq-api/prisma/schema.prisma`
- `apps/platform/src/App-Platform.tsx`

---

## Testing Checklist

### Tenant Switcher
- [ ] User with single tenant sees no "Switch to" section
- [ ] User with multiple tenants sees all accessible tenants
- [ ] Clicking different tenant calls POST /session/tenant
- [ ] Page reloads with new tenant context after switch
- [ ] Current tenant shows checkmark
- [ ] Menu closes on click outside
- [ ] Menu closes on Escape key

### Demo Reset
- [ ] Reset button only visible on demo tenants
- [ ] Reset button only visible for super admins
- [ ] Confirmation dialog appears before reset
- [ ] Cancel returns to menu without resetting
- [ ] Confirm triggers API call
- [ ] User is logged out after reset
- [ ] Data is cleared after reset
- [ ] Correct seed data applied based on demoResetType
- [ ] Can log back in after reset

---

## Troubleshooting

### "forbidden" error on tenant switch
- User is not a member of the target tenant
- User is not a super admin

### Reset button not showing
- Tenant is not marked as `isDemoTenant`
- User is not a super admin

### Seed script errors
- Check field names match Prisma schema (e.g., `first_name` not `firstName` for Contact)
- Check required fields are provided (e.g., `display_name` for Contact)
- Check enum values are valid (e.g., `Species.DOG` not string `'dog'`)

---

## Part 3: Super Admin Management

### Overview

Super admins have global access across all tenants. This feature allows managing super admin users from the Admin panel UI.

### Key Behaviors

1. **When a new super admin is created**: They are automatically added to ALL existing tenants as ADMIN members
2. **When a new tenant is created**: ALL super admins are automatically added to it as ADMIN members
3. **Sync Tenants**: Manually add a super admin to any tenants they may be missing from
4. **Revoking super admin status**: Does NOT remove their existing tenant memberships (they keep access to tenants they were already members of)

### API Endpoints

**Location**: `breederhq-api/src/routes/tenant.ts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/super-admins` | List all super admin users |
| POST | `/admin/super-admins` | Create a new super admin user |
| POST | `/admin/super-admins/:userId/grant` | Grant super admin to existing user |
| POST | `/admin/super-admins/:userId/revoke` | Revoke super admin status |
| POST | `/admin/super-admins/:userId/sync-tenants` | Add user to all missing tenants |

All endpoints require super admin authentication (unscoped - no X-Tenant-Id header).

### Create Super Admin Request

```json
POST /admin/super-admins
{
  "email": "admin@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "verify": true,
  "generateTempPassword": true
}
```

Response:
```json
{
  "ok": true,
  "user": {
    "id": "clxx...",
    "email": "admin@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "name": "Jane Smith",
    "verified": true,
    "createdAt": "2026-01-17T...",
    "tenantCount": 26
  },
  "tempPassword": "abc123...",
  "tenantsAdded": 26
}
```

### UI Location

**File**: `apps/admin/src/SuperAdminsAdmin.tsx`

Accessible via the Admin panel's "Super Admins" tab (only visible to super admins).

Features:
- List all super admin users with email, name, tenant count
- Create new super admin with generated or manual password
- Sync Tenants button to add missing tenant memberships
- Revoke button to remove super admin status (with confirmation)

### Protection Rules

1. Cannot revoke your own super admin status
2. Cannot revoke the last super admin (system requires at least one)
3. Revoking keeps existing tenant memberships (user can still access those tenants)

### Files Reference

#### New Files
- `apps/admin/src/SuperAdminsAdmin.tsx`

#### Modified Files
- `breederhq-api/src/routes/tenant.ts` - Added super admin management endpoints + auto-add on tenant provision
- `apps/admin/src/App-Admin.tsx` - Added Super Admins tab
- `apps/admin/src/api.ts` - Added `superAdminApi` methods

### Testing Checklist

#### Super Admin Management
- [ ] Super Admins tab only visible to super admins
- [ ] List shows all super admins with correct data
- [ ] Can create new super admin with generated password
- [ ] New super admin is added to all existing tenants
- [ ] Sync Tenants adds missing memberships
- [ ] Revoke removes super admin flag but keeps memberships
- [ ] Cannot revoke yourself
- [ ] Cannot revoke last super admin

#### Auto-Add on Tenant Creation
- [ ] When creating a new tenant, all super admins are added as members
- [ ] Super admins appear in the new tenant's users list
