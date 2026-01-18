# Billing Management

This document covers the billing management functionality within the Admin module's tenant detail view.

## Overview

The Billing tab within a tenant detail view allows administrators to:
- View current billing configuration
- Edit payment provider details
- Update subscription information
- Track billing history timestamps

## Billing Information

### Fields

| Field | Description | Editable |
|-------|-------------|----------|
| Provider | Payment provider (e.g., "stripe") | Yes |
| Plan | Subscription plan name | Yes |
| Status | Current subscription status | Yes |
| Customer ID | Provider's customer identifier | Yes |
| Subscription ID | Provider's subscription identifier | Yes |
| Current Period End | When the current billing period ends | Yes |
| Created | When billing was first configured | No |
| Updated | Last modification timestamp | No |

### Status Values

Common subscription status values:

| Status | Description |
|--------|-------------|
| active | Subscription is active and paid |
| trialing | In trial period |
| past_due | Payment failed, grace period |
| canceled | Subscription canceled |
| unpaid | Multiple failed payment attempts |

## View Mode

In view mode, the Billing tab displays:
- All billing fields in a read-only grid
- Created/Updated timestamps
- Current values from the database

## Edit Mode

When the parent tenant detail is in edit mode:

### Editable Fields

All billing fields become editable text inputs:
- Provider
- Plan
- Status
- Customer ID
- Subscription ID
- Current Period End (ISO format: `2025-01-31T23:59:59.000Z`)

### Save/Reset Actions

- **Save**: Appears in the section card header, persists changes
- **Reset**: Clears draft changes, reverts to saved values

### Dirty State

The Billing tab tracks dirty state:
- Changes to any field mark the form as dirty
- Warning appears when navigating away with unsaved changes
- Parent scaffold Save button respects billing dirty state

## Stripe Integration

While the Admin UI allows manual editing of billing fields, the typical flow involves:

1. **Stripe Webhooks**: Payment events update billing records automatically
2. **Stripe Customer Portal**: Customers manage their own subscriptions
3. **Admin Override**: Manual editing for corrections or special cases

### Customer ID Format

Stripe customer IDs follow the format: `cus_xxxxxxxxxxxxx`

### Subscription ID Format

Stripe subscription IDs follow the format: `sub_xxxxxxxxxxxxx`

## API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Get billing | `/api/v1/admin/tenants/:id/billing` | GET |
| Update billing | `/api/v1/admin/tenants/:id/billing` | PATCH |

### Update Request Body

```json
{
  "provider": "stripe",
  "customerId": "cus_xxxxx",
  "subscriptionId": "sub_xxxxx",
  "plan": "Pro",
  "status": "active",
  "currentPeriodEnd": "2025-02-28T23:59:59.000Z"
}
```

## Access Control

| Action | Tenant Admin | Super Admin |
|--------|--------------|-------------|
| View billing | Own tenant only | Any tenant |
| Edit billing | Own tenant (BILLING+ role) | Any tenant |

## Integration with Subscriptions

The Billing tab shows provider-level billing data. For feature and entitlement management, see [Subscriptions & Features](./subscriptions-features.md).

Key distinction:
- **Billing Tab**: Payment provider data (Stripe customer/subscription)
- **Subscriptions Admin**: Platform products, entitlements, and features

## Best Practices

1. **Prefer Stripe Portal**: Direct customers to Stripe Customer Portal for self-service
2. **Avoid Manual Edits**: Manual billing edits may cause sync issues with Stripe
3. **Use for Corrections**: Admin billing edit is useful for:
   - Fixing webhook sync issues
   - Applying manual overrides
   - Setting up test/demo accounts
4. **ISO Date Format**: Always use ISO 8601 format for dates

## Source Code

- Component: `apps/admin/src/App-Admin.tsx` (`BillingTab`)
- API client: `apps/admin/src/api.ts` (`adminApi.getBilling`, `adminApi.patchBilling`)
- Backend routes: `breederhq-api/src/routes/tenant.ts` (billing endpoints)
