# Admin Module Documentation

The Admin module provides platform-wide administration capabilities for BreederHQ. It is accessible via the `/admin` route in the platform application.

## Access Levels

The Admin module has two distinct access levels:

1. **Tenant Admins** - Can manage their own tenant's users, billing, and settings
2. **Super Admins** - Have platform-wide access to all tenants and additional administrative functions

## Module Sections

### For All Admins

| Section | Description | Documentation |
|---------|-------------|---------------|
| Tenants | View and manage tenant details | [Tenant Management](./tenant-management.md) |
| Users | Manage users within a tenant | [User Management](./user-management.md) |
| Billing | View and edit billing information | [Billing Management](./billing-management.md) |
| Usage Dashboard | Monitor quota usage and limits | [Usage Dashboard](./usage-dashboard.md) |

### Super Admin Only

| Section | Description | Documentation |
|---------|-------------|---------------|
| Super Admins | Manage global administrators | [Super Admins](./super-admins.md) |
| Marketplace Abuse | Review flagged marketplace users | [Marketplace Moderation](./marketplace-moderation.md) |
| Breeder Reports | Handle reports against breeders | [Breeder Reports](./breeder-reports.md) |
| Subscriptions | Manage features, products, and entitlements | [Subscriptions & Features](./subscriptions-features.md) |

## Navigation Structure

Super admins see a tab bar at the top of the admin module with the following sections:

- **Tenants** - Default view, lists all tenants
- **Super Admins** - Manage super admin users
- **Marketplace Abuse** - Review flagged/suspended marketplace users
- **Breeder Reports** - Handle reports against breeders
- **Usage Dashboard** - View usage metrics across the platform
- **Subscriptions** - Manage features, entitlements, products, and subscriptions

## Key Features

### Tenant Provisioning

Super admins can provision new tenants through the "New Tenant" button. This process:
1. Creates the tenant record
2. Creates the owner user account
3. Generates a temporary password (or uses a provided one)
4. Optionally sends a welcome email with login credentials
5. Sets up default billing configuration

### Welcome Email

When provisioning a tenant, admins can opt to send a welcome email that includes:
- Login URL
- Owner email address
- Temporary password (if generated)
- Getting started instructions

### Password Reset

For existing tenants, admins can reset the owner's password from the tenant detail view:
1. Navigate to the tenant
2. Go to the Overview tab
3. Use the "Owner Password Reset" section
4. A temporary password is generated that the owner must change on next login

## Technical Details

### Source Files

- Main component: `apps/admin/src/App-Admin.tsx`
- Sub-components:
  - `apps/admin/src/SuperAdminsAdmin.tsx`
  - `apps/admin/src/MarketplaceAbuseAdmin.tsx`
  - `apps/admin/src/BreederReportsAdmin.tsx`
  - `apps/admin/src/UsageDashboard.tsx`
  - `apps/admin/src/SubscriptionAdmin.tsx`

### API Layer

The admin module uses a dedicated API client defined in `apps/admin/src/api.ts` which provides:

- `adminApi` - Core tenant and user management
- `superAdminApi` - Super admin operations
- `breederReportsApi` - Breeder report handling
- `usageApi` - Usage metrics retrieval
- `adminSubscriptionApi` - Subscription management
- `adminFeatureApi` - Feature flag management

### Session & Authentication

The admin module requires:
- An authenticated session cookie (`bhq_s_app`)
- Tenant context via `X-Tenant-Id` header (resolved from session)
- Super admin status is determined by `user.isSuperAdmin` flag

## Related Documentation

- [ERD: Users & Auth](../erd/01-users-auth.md)
- [ERD: Tenants & Orgs](../erd/02-tenants-orgs.md)
