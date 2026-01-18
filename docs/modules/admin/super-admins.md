# Super Admin Management

This document covers the Super Admin management functionality, accessible only to existing super admins.

## Overview

Super admins are global administrators with platform-wide access. The Super Admins section allows:
- Viewing all super admin users
- Creating new super admins
- Syncing super admins to tenants
- Revoking super admin status

## What is a Super Admin?

A super admin is a special user type that:
- Has access to ALL tenants across the platform
- Is automatically added as an ADMIN to every tenant
- Can access super admin-only features in the Admin module
- Has the `isSuperAdmin: true` flag on their user record

## Super Admin List

### Columns

| Column | Description |
|--------|-------------|
| Email | User's email with "Super Admin" badge |
| Name | Full name |
| Verified | Email verification status |
| Tenants | Count of tenants user belongs to |
| Created | Account creation date |
| Actions | Sync Tenants, Revoke buttons |

## Creating a Super Admin

Click the "New Super Admin" button to open the creation modal.

### Required Fields

| Field | Description | Validation |
|-------|-------------|------------|
| Email | Super admin's email | Required, valid email format |
| First Name | First name | Required, non-empty |

### Optional Fields

| Field | Description | Default |
|-------|-------------|---------|
| Last Name | Last name | Empty |
| Temporary Password | Manual password | Generated if checkbox enabled |

### Creation Process

1. User record is created with `isSuperAdmin: true`
2. Email is auto-verified (`verify: true`)
3. User is added to ALL existing tenants as ADMIN role
4. Temporary password is generated (or provided)
5. Modal displays password for admin to copy
6. Password is never shown again

### After Creation

The new super admin:
- Can immediately log in
- Must change temporary password on first login
- Has ADMIN access to all existing tenants
- Will be auto-added to any new tenants created

## Sync Tenants

The "Sync Tenants" action ensures a super admin is a member of all tenants.

### When to Use

- After restoring super admin status
- If tenant memberships became inconsistent
- After manual database changes

### Process

1. Click "Sync Tenants" for the super admin
2. System checks all tenants
3. Adds user as ADMIN to any missing tenants
4. Dialog shows how many tenants were added

### Result Messages

- "Added {email} to {count} tenants." - User was missing from some tenants
- "{email} is already a member of all {count} tenants." - No action needed

## Revoking Super Admin Status

The "Revoke" action removes super admin privileges.

### Confirmation

A confirmation dialog explains:
- User will lose super admin status
- User keeps existing tenant memberships
- User won't be auto-added to new tenants

### What Happens

1. `isSuperAdmin` flag is set to `false`
2. User retains all current tenant memberships
3. User continues with their existing role in each tenant
4. User loses access to super admin-only features

### Restrictions

You cannot revoke:
- Your own super admin status
- The last remaining super admin

## Automatic Behaviors

### New Super Admin Created

When a new super admin is created:
1. System iterates all existing tenants
2. User is added as ADMIN to each tenant
3. Tenant membership count is updated

### New Tenant Created

When any tenant is provisioned:
1. System queries all users with `isSuperAdmin: true`
2. Each super admin is added as ADMIN to the new tenant
3. Super admins can immediately access the new tenant

## API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| List super admins | `/api/v1/admin/super-admins` | GET |
| Create super admin | `/api/v1/admin/super-admins` | POST |
| Sync tenants | `/api/v1/admin/super-admins/:id/sync` | POST |
| Revoke status | `/api/v1/admin/super-admins/:id` | DELETE |

### Create Request Body

```json
{
  "email": "admin@breederhq.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "verify": true,
  "generateTempPassword": true
}
```

### Create Response

```json
{
  "user": {
    "id": "...",
    "email": "admin@breederhq.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "isSuperAdmin": true,
    "tenantCount": 42
  },
  "tempPassword": "GeneratedPassword123!"
}
```

## Security Considerations

1. **Limited Access**: Only existing super admins can create/manage super admins
2. **No Self-Revoke**: Prevents accidental lockout
3. **Last Admin Protection**: At least one super admin must exist
4. **Audit Trail**: All super admin actions should be logged
5. **Password Security**: Temporary passwords must be changed on first login

## Information Panel

The UI includes an "About Super Admins" panel explaining key behaviors:
- New super admins are added to ALL existing tenants
- New tenants get ALL super admins automatically
- Use "Sync Tenants" to fix missing memberships
- Revoking status preserves existing memberships
- Cannot revoke your own status or the last super admin

## Source Code

- Component: `apps/admin/src/SuperAdminsAdmin.tsx`
- API client: `apps/admin/src/api.ts` (`superAdminApi`)
- Backend routes: `breederhq-api/src/routes/admin.ts` (super admin endpoints)
