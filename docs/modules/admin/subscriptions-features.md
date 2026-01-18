# Subscriptions & Features Management

This document covers the comprehensive subscription, product, feature, and entitlement management system in the Admin module.

## Overview

The Subscription Management section provides tools for:
- Managing platform features and their access requirements
- Configuring entitlement keys that control access
- Creating and managing subscription products
- Monitoring tenant subscriptions
- Analyzing feature usage and upgrade opportunities

## Core Concepts

### Hierarchy

```
Features → Entitlement Keys → Products → Subscriptions → Tenants
```

1. **Features**: Individual platform capabilities (e.g., "COI Calculations")
2. **Entitlement Keys**: Access controls that gate features (e.g., "GENETICS_PRO")
3. **Products**: Purchasable SKUs that grant entitlements (e.g., "Pro Plan")
4. **Subscriptions**: Tenant instances of products
5. **Tenants**: End customers using the platform

### Access Flow

When a user tries to access a feature:

1. Code checks feature key (e.g., `GENETICS_COI_CALCULATIONS`)
2. System looks up feature's required entitlement key
3. System checks if tenant's subscription grants that entitlement
4. Access granted or denied based on entitlement presence

## Tab Overview

| Tab | Purpose |
|-----|---------|
| Features | Register and manage platform features |
| Entitlements | View entitlement keys and their mappings |
| Products | Configure subscription products |
| Subscriptions | Monitor tenant subscriptions |
| Analytics | Track feature usage and optimization |

---

## Features Tab

### What Are Features?

Features are individual platform capabilities that can be gated by subscription tier. Each feature:
- Has a unique key (e.g., `GENETICS_COI_CALCULATIONS`)
- Belongs to a module (e.g., GENETICS)
- Maps to an entitlement key
- Can be active or inactive

### Feature Fields

| Field | Description | Required |
|-------|-------------|----------|
| Key | UPPER_SNAKE_CASE identifier | Yes |
| Name | Display name | Yes |
| Description | What the feature does | No |
| Module | Category (GENETICS, MARKETPLACE, etc.) | Yes |
| Entitlement Key | Required access level | Yes |
| UI Hint | Where feature appears in UI | No |
| Active | Whether feature is available | Yes |

### Feature Modules

| Module | Description |
|--------|-------------|
| GENETICS | Genetics Lab features |
| MARKETPLACE | Marketplace features |
| FINANCIAL | Financial Suite features |
| ANIMALS | Animal management features |
| CONTACTS | CRM and contact features |
| BREEDING | Breeding plan features |
| DOCUMENTS | Document management |
| HEALTH | Health record features |
| SCHEDULING | Scheduling features |
| PORTAL | Client portal features |
| REPORTING | Reporting features |
| SETTINGS | Settings features |

### Feature Lifecycle

```
Created → Active → Inactive → Archived
```

- **Active**: Feature available when entitled
- **Inactive**: Feature hidden even if entitled
- **Archived**: Feature removed from active use

### Creating a Feature

1. Click "New Feature" button
2. Enter feature key (UPPER_SNAKE_CASE)
3. Enter display name
4. Select module and entitlement key
5. Optionally add description and UI hint
6. Click "Create Feature"

### Using Features in Code

```typescript
// Check if tenant has access to feature
const hasAccess = await checkFeature('GENETICS_COI_CALCULATIONS', tenantId);
if (!hasAccess) {
  throw new ForbiddenError('Feature requires Pro subscription');
}
```

---

## Entitlements Tab

### What Are Entitlement Keys?

Entitlement keys are the access controls that products grant. They come in two types:

| Type | Description | Example |
|------|-------------|---------|
| BOOLEAN | On/off access | GENETICS_PRO |
| QUOTA | Numeric limit | ANIMAL_QUOTA |

### Boolean Entitlements

Feature access controls:

| Key | Description |
|-----|-------------|
| PLATFORM_ACCESS | Basic platform access |
| MARKETPLACE_ACCESS | Marketplace features |
| PORTAL_ACCESS | Client portal |
| BREEDING_PLANS | Breeding plan features |
| FINANCIAL_SUITE | Financial features |
| DOCUMENT_MANAGEMENT | Document features |
| HEALTH_RECORDS | Health tracking |
| WAITLIST_MANAGEMENT | Waitlist features |
| ADVANCED_REPORTING | Advanced reports |
| API_ACCESS | API access |
| MULTI_LOCATION | Multi-location support |
| E_SIGNATURES | E-signature features |
| DATA_EXPORT | Data export features |
| GENETICS_STANDARD | Standard genetics |
| GENETICS_PRO | Advanced genetics |

### Quota Entitlements

Numeric limits:

| Key | Description |
|-----|-------------|
| ANIMAL_QUOTA | Max animals |
| CONTACT_QUOTA | Max contacts |
| PORTAL_USER_QUOTA | Max portal users |
| BREEDING_PLAN_QUOTA | Max breeding plans |
| MARKETPLACE_LISTING_QUOTA | Max listings |
| STORAGE_QUOTA_GB | Storage in GB |
| SMS_QUOTA | SMS messages |

### Viewing Entitlement Mappings

Click an entitlement row to expand and see:
- Features using this entitlement
- Products granting this entitlement
- Feature and product counts

---

## Products Tab

### What Are Products?

Products are purchasable SKUs that sync with Stripe. Each product:
- Has a price and billing interval
- Grants a set of entitlements
- Can be subscription, add-on, or one-time

### Product Types

| Type | Description |
|------|-------------|
| SUBSCRIPTION | Recurring subscription |
| ADD_ON | Add-on to existing subscription |
| ONE_TIME | One-time purchase |

### Billing Intervals

| Interval | Frequency |
|----------|-----------|
| MONTHLY | Every month |
| QUARTERLY | Every 3 months |
| YEARLY | Every year |

### Product Fields

| Field | Description |
|-------|-------------|
| Name | Product display name |
| Description | Product description |
| Type | SUBSCRIPTION, ADD_ON, ONE_TIME |
| Price | Price in USD |
| Billing Interval | For subscriptions |
| Features | Marketing bullet points |
| Sort Order | Display order |
| Stripe Product ID | Synced Stripe ID |

### Managing Entitlements

Click "Manage Entitlements" to configure:
- Which entitlement keys the product grants
- Quota values for numeric entitlements
- Leave quota empty for unlimited

### Creating a Product

1. Click "New Product" button
2. Enter name, description, price
3. Select type and interval (if subscription)
4. Add marketing features (bullet points)
5. Click "Create"
6. Use "Manage Entitlements" to configure access

---

## Subscriptions Tab

### What Are Subscriptions?

Subscriptions are tenant instances of products. They track:
- Which product a tenant has
- Subscription status
- Billing period
- Stripe integration

### Subscription Status

| Status | Description | Badge Color |
|--------|-------------|-------------|
| ACTIVE | Paid and current | Green |
| TRIAL | In trial period | Blue |
| PAST_DUE | Payment failed | Orange |
| CANCELED | Subscription canceled | Red |
| EXPIRED | Subscription ended | Gray |

### Subscription List

| Column | Description |
|--------|-------------|
| ID | Subscription ID |
| Tenant | Tenant name and email |
| Plan | Product name |
| Status | Current status |
| Period End | Current period end date |
| Stripe | Stripe subscription ID |

### Subscription Detail Modal

Click a subscription to view:
- Tenant information
- Product details
- Current status
- Billing period
- Stripe IDs
- Entitlements granted
- Status management buttons

### Managing Status

Admins can manually change subscription status:
- Useful for support overrides
- Manual trial extensions
- Handling payment disputes

---

## Analytics Tab

### Overview

Analytics tracks feature usage across the platform:
- Total feature checks
- Denied access attempts
- Orphaned features
- Ungated feature keys

### Summary Cards

| Metric | Description |
|--------|-------------|
| Total Checks | All feature access checks |
| Denied Access | Checks that failed (no entitlement) |
| Orphaned Features | Features never checked |
| Ungated Keys | Keys checked but not registered |

### Most Used Features

Top 10 features by access check count:
- Feature key
- Feature name
- Check count

### Upgrade Opportunities

Features users tried to access but were denied:
- Shows potential upgrade targets
- Includes tenant count
- Helps identify popular blocked features

### Orphaned Features

Features registered but never checked in code:
- May indicate dead code
- Consider archiving
- Review before removing

### Ungated Feature Keys

Feature keys being checked in code but not registered:
- Code references features not in database
- Should be registered for proper tracking
- May indicate missing configuration

---

## API Endpoints

### Features

| Action | Endpoint | Method |
|--------|----------|--------|
| List features | `/api/v1/admin/features` | GET |
| Create feature | `/api/v1/admin/features` | POST |
| Update feature | `/api/v1/admin/features/:id` | PATCH |
| Archive feature | `/api/v1/admin/features/:id/archive` | POST |
| Restore feature | `/api/v1/admin/features/:id/restore` | POST |

### Entitlements

| Action | Endpoint | Method |
|--------|----------|--------|
| List keys | `/api/v1/admin/entitlements` | GET |
| Get key features | `/api/v1/admin/entitlements/:key/features` | GET |

### Products

| Action | Endpoint | Method |
|--------|----------|--------|
| List products | `/api/v1/admin/products` | GET |
| Create product | `/api/v1/admin/products` | POST |
| Update product | `/api/v1/admin/products/:id` | PATCH |
| Add entitlement | `/api/v1/admin/products/:id/entitlements` | POST |
| Update entitlement | `/api/v1/admin/products/:id/entitlements/:key` | PATCH |
| Remove entitlement | `/api/v1/admin/products/:id/entitlements/:key` | DELETE |

### Subscriptions

| Action | Endpoint | Method |
|--------|----------|--------|
| List subscriptions | `/api/v1/admin/subscriptions` | GET |
| Update subscription | `/api/v1/admin/subscriptions/:id` | PATCH |
| Cancel subscription | `/api/v1/admin/subscriptions/:id/cancel` | POST |

### Analytics

| Action | Endpoint | Method |
|--------|----------|--------|
| Get analytics | `/api/v1/admin/features/analytics` | GET |
| Get orphaned | `/api/v1/admin/features/orphaned` | GET |
| Get ungated | `/api/v1/admin/features/ungated` | GET |

---

## Best Practices

### Feature Registration

1. Register features BEFORE deploying code that checks them
2. Use descriptive, namespaced keys (MODULE_ACTION_DETAIL)
3. Map to appropriate entitlement key
4. Add UI hint for documentation

### Product Configuration

1. Start with clear entitlement boundaries
2. Use marketing features for display, not access control
3. Keep sort order consistent
4. Sync with Stripe for payments

### Subscription Management

1. Let Stripe webhooks update status normally
2. Use manual status changes sparingly
3. Document reasons for manual overrides
4. Monitor for sync issues

### Analytics Review

1. Regularly check for orphaned features
2. Register ungated keys
3. Use denied attempts for product decisions
4. Archive unused features

## Source Code

- Component: `apps/admin/src/SubscriptionAdmin.tsx`
- API clients:
  - `apps/admin/src/api.ts` (`adminSubscriptionApi`)
  - `apps/admin/src/api.ts` (`adminFeatureApi`)
- Types: `ProductDTO`, `SubscriptionDTO`, `FeatureDTO`, `EntitlementKeyType`, etc.
