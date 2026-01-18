# Tenant Management

This document covers the tenant management functionality in the Admin module.

## Overview

Tenant management is the primary function of the Admin module. It allows administrators to:
- View all tenants (super admins) or their own tenant (tenant admins)
- Create new tenants (super admins only)
- Edit tenant details
- View tenant statistics (users, organizations, contacts, animals)
- Delete tenants (super admins only)

## Tenant List View

### Columns

| Column | Description | Default Visible |
|--------|-------------|-----------------|
| Tenant | Business/account name | Yes |
| Email | Primary contact email | Yes |
| Users | Number of users (excluding owner) | Yes |
| Orgs | Number of organizations | Yes |
| Contacts | Total contacts count | Yes |
| Animals | Total animals count | Yes |
| Created | Tenant creation date | No |
| Updated | Last modification date | No |

### Features

- **Search**: Free-text search across all visible columns
- **Filters**: Column-based filtering with date range support
- **Sorting**: Click column headers to sort (Shift+click for multi-column)
- **Column Visibility**: Customize visible columns via the columns popover
- **Selection**: Super admins can select tenants for bulk operations

## Creating a Tenant

Super admins can create new tenants via the "New Tenant" button.

### Required Fields

| Field | Description | Validation |
|-------|-------------|------------|
| Tenant Name | Business name for the account | Required, non-empty |
| Owner Email | Email for the tenant owner | Required, valid email format |
| Owner First Name | First name of the owner | Required, non-empty |

### Optional Fields

| Field | Description | Default |
|-------|-------------|---------|
| Owner Last Name | Last name of the owner | Empty |
| Temporary Password | Manual password entry | Generated if checkbox enabled |
| Send Welcome Email | Email login credentials to owner | Enabled (checked) |

### Password Options

1. **Generate Strong Password** (recommended)
   - System generates a secure random password
   - Password displayed after creation for admin to share
   - Password never shown again after modal closes

2. **Manual Password Entry**
   - Minimum 8 characters required
   - Admin specifies the temporary password
   - Owner must change on first login

### Welcome Email

When enabled, the welcome email includes:
- Greeting with owner's name
- Tenant/business name
- Login URL (defaults to app URL)
- Temporary password (if system-generated)
- Instructions to change password on first login
- Getting started tips

## Editing a Tenant

Click any tenant row to open the detail drawer.

### Overview Tab

Displays and allows editing of:
- Primary email
- User count
- Organization count
- Contact count
- Animal count
- Created/Updated timestamps

### Owner Password Reset

From the Overview tab, admins can generate a new temporary password for the tenant owner:

1. Click "Reset Owner Password"
2. System generates a new temporary password
3. Copy the password (it won't be shown again)
4. Share password with owner securely
5. Owner must change password on next login

## Deleting a Tenant

Super admins can permanently delete a tenant through a multi-step confirmation process.

### Step 1: Initial Warning

Displays:
- Tenant details (name, ID, counts)
- List of data that will be deleted
- Requires acknowledgment to continue

### Step 2: Name Confirmation

- Admin must type the exact tenant name
- Prevents accidental deletion
- Case-sensitive matching

### Step 3: Final Confirmation

- Shows summary of what will be deleted
- Final "DELETE TENANT PERMANENTLY" button
- No recovery possible after this step

### Data Deleted

When a tenant is deleted, the following is permanently removed:
- All animals, health records, and breeding data
- All contacts, organizations, and CRM data
- All contracts, documents, and signatures
- All invoices, payments, and financial records
- All user accounts and memberships
- All marketplace listings and communications

## API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| List tenants | `/api/v1/admin/tenants` | GET |
| Get tenant | `/api/v1/admin/tenants/:id` | GET |
| Create tenant | `/api/v1/admin/tenants/provision` | POST |
| Update tenant | `/api/v1/admin/tenants/:id` | PATCH |
| Delete tenant | `/api/v1/admin/tenants/:id` | DELETE |
| Reset owner password | `/api/v1/admin/tenants/:id/reset-owner-password` | POST |

## Access Control

| Action | Tenant Admin | Super Admin |
|--------|--------------|-------------|
| View own tenant | Yes | Yes |
| View all tenants | No | Yes |
| Create tenant | No | Yes |
| Edit own tenant | Yes | Yes |
| Edit any tenant | No | Yes |
| Delete tenant | No | Yes |

## Source Code

- Component: `apps/admin/src/App-Admin.tsx`
- API client: `apps/admin/src/api.ts` (`adminApi`)
- Backend routes: `breederhq-api/src/routes/tenant.ts`
