# User Management

This document covers user management within the Admin module's tenant detail view.

## Overview

The Users tab within a tenant detail view allows administrators to:
- View all users in the tenant
- Add/invite new users
- Modify user roles
- Verify user email addresses
- Reset user passwords
- Archive (remove) users

## User Roles

BreederHQ uses a role-based access control system with the following roles:

| Role | Description | Capabilities |
|------|-------------|--------------|
| OWNER | Tenant owner, one per tenant | Full access, billing management, cannot be changed |
| ADMIN | Administrator | Full access except billing, can manage other users |
| MEMBER | Standard user | Standard access to all features |
| BILLING | Billing manager | Limited access, can manage billing and invoices |
| VIEWER | Read-only access | Can view data but cannot make changes |

### Role Hierarchy

```
OWNER > ADMIN > MEMBER > BILLING > VIEWER
```

Note: The OWNER role is automatically assigned during tenant provisioning and cannot be changed or removed. Owners are excluded from the user list display since they're shown in the tenant overview.

## User List

### Columns

| Column | Description |
|--------|-------------|
| Email | User's email address with super admin badge if applicable |
| Name | Full name (first + last or display name) |
| Role | Current role with dropdown for editing |
| Verified | Email verification status |
| Created | Account creation date |
| Actions | Verify, Reset Password, Archive buttons |

### Filtering

- **Show Archived**: Toggle to include/exclude archived users

## Adding Users

### Required Fields

| Field | Validation |
|-------|------------|
| First Name | Required |
| Last Name | Required |
| Email | Required, valid email format |

### Process

1. Fill in first name, last name, and email
2. Select desired role from dropdown (defaults to MEMBER)
3. Click "Add" button
4. User is created with unverified email status
5. User receives email invitation to set password

## Editing User Roles

When in Edit mode:

1. Click "Edit" button in the tenant detail scaffold
2. Use the role dropdown next to each user
3. Select the new role
4. Changes are tracked as "dirty"
5. Click "Save" to apply all role changes
6. Cancel to discard changes

## User Actions

### Verify Email

For users with unverified emails:
- Click "Verify" button
- Admin manually confirms the email is valid
- User can now log in without email verification flow

### Reset Password

1. Click "Reset PW" button
2. Expansion panel appears with password input
3. Enter new password meeting complexity requirements:
   - Minimum 12 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character
4. Click "Save" to apply new password
5. User must use new password immediately

### Archive User

1. Click the trash/archive icon
2. Confirmation dialog appears
3. Confirm to archive the user
4. Archived users:
   - Cannot log in
   - Are hidden from default list
   - Can be restored (if functionality implemented)
   - Retain historical data references

## Super Admin Badge

Users who are super admins display an orange "Super Admin" badge next to their email. This indicates:
- User has platform-wide access
- User was auto-added to this tenant
- User's membership cannot be removed while they're a super admin

## API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| List users | `/api/v1/admin/tenants/:id/users` | GET |
| Add user | `/api/v1/admin/tenants/:id/users` | POST |
| Update role | `/api/v1/admin/tenants/:id/users/:userId/role` | PATCH |
| Verify email | `/api/v1/admin/tenants/:id/users/:userId/verify` | POST |
| Set password | `/api/v1/admin/tenants/:id/users/:userId/password` | POST |
| Archive user | `/api/v1/admin/tenants/:id/users/:userId` | DELETE |

## Access Control

| Action | Tenant Admin | Super Admin |
|--------|--------------|-------------|
| View users | Own tenant only | Any tenant |
| Add users | Own tenant | Any tenant |
| Modify roles | Own tenant, except OWNER | Any tenant, except OWNER |
| Verify email | Own tenant | Any tenant |
| Reset password | Own tenant | Any tenant |
| Archive user | Own tenant, not self | Any tenant, not self |

## Dirty State Tracking

The Users tab implements dirty state tracking:
- Role changes are tracked in a local map
- "Unsaved changes" warning appears when navigating away
- Confirmation dialog prevents accidental data loss
- Parent scaffold's Save button triggers role updates

## Source Code

- Component: `apps/admin/src/App-Admin.tsx` (`UsersTab`, `UserRow`)
- API client: `apps/admin/src/api.ts`
- Backend routes: `breederhq-api/src/routes/tenant.ts` (user-related endpoints)
