# Usage Dashboard

This document covers the Usage Dashboard functionality for monitoring quota usage and limits.

## Overview

The Usage Dashboard provides a visual overview of:
- Current subscription plan
- Resource usage vs. limits
- Quota warnings for approaching limits
- Usage patterns across different resource types

## Access

- **Tenant Admins**: View their own tenant's usage
- **Super Admins**: Can view any tenant's usage (via context switch)

## Dashboard Components

### Plan Information Card

Displays the current subscription:
- Plan name (e.g., "Pro", "Enterprise")
- Plan tier badge
- Visual indicator of plan level

### Quota Warning Banner

When quotas are approaching or exceeded, a warning banner appears:
- Orange warning icon
- List of specific quota warnings
- Shows which resources need attention

### Core Quotas Section

Primary resource limits tracked:

| Resource | Description | Units |
|----------|-------------|-------|
| Animals | Number of animal records | Count |
| Contacts | Number of contact records | Count |
| Portal Users | Client portal user accounts | Count |
| Breeding Plans | Active breeding plans | Count |

### Additional Resources Section

Secondary resource limits:

| Resource | Description | Units |
|----------|-------------|-------|
| Marketplace Listings | Active marketplace listings | Count |
| Storage | File storage usage | GB |
| SMS Messages | Monthly SMS quota | Messages |

## Usage Progress Bars

Each resource displays a progress bar showing:

### Visual Indicators

| Usage Level | Bar Color | Text Color | Message |
|-------------|-----------|------------|---------|
| Normal (< 90%) | Blue | Blue | "{X}% used" |
| Warning (90-99%) | Orange | Orange | "Approaching limit" |
| Over Limit (≥ 100%) | Red | Red | "Over limit!" |
| Unlimited | Blue | Blue | "No limit - Enterprise plan" |

### Display Format

```
[Resource Name]           [Current] / [Limit]
[====================    ] 75% used
```

For unlimited resources:
```
[Resource Name]           [Current] (Unlimited)
No limit - Enterprise plan
```

## API Response Structure

### Usage Metrics DTO

```typescript
interface UsageMetricsDTO {
  plan: {
    name: string;
    tier: "BASIC" | "PRO" | "ENTERPRISE";
  } | null;

  usage: {
    animals: UsageMetric;
    contacts: UsageMetric;
    portalUsers: UsageMetric;
    breedingPlans: UsageMetric;
    marketplaceListings: UsageMetric;
    storageGB: UsageMetric;
    smsMessages: UsageMetric;
  };

  warnings: string[];
}

interface UsageMetric {
  current: number;
  limit: number | null;  // null = unlimited
  percentUsed: number | null;
  isOverLimit: boolean;
}
```

## Warning Generation

Warnings are generated server-side when:

1. **Approaching Limit** (90%+):
   > "Animals: 90 of 100 (90% used)"

2. **Over Limit**:
   > "Animals: 110 of 100 - Over limit!"

3. **Multiple Warnings**: All warnings listed in banner

## Plan Tier Behavior

### Basic Plan
- Fixed limits on all resources
- No unlimited options
- Upgrade prompt when limits approached

### Pro Plan
- Higher limits than Basic
- Some resources may be unlimited
- Most common paid tier

### Enterprise Plan
- Most or all resources unlimited
- `limit: null` in API response
- "Unlimited" badge displayed

## Help Text

Footer explains:
> "Usage metrics are updated in real-time as you create, modify, or delete resources. Quotas are determined by your subscription plan. To upgrade your plan or purchase add-ons, contact support or visit the billing portal."

## API Endpoint

| Action | Endpoint | Method |
|--------|----------|--------|
| Get usage metrics | `/api/v1/usage/metrics` | GET |

The endpoint automatically resolves tenant context from the session.

## Real-Time Updates

Usage metrics reflect current state:
- Creating an animal increases animal count immediately
- Deleting a contact decreases contact count immediately
- Storage is calculated from actual file sizes
- SMS usage resets monthly

## Integration with Subscriptions

The Usage Dashboard shows the _consumption_ side of subscriptions:
- Quotas come from product entitlements
- Products define limits via `QUOTA` type entitlements
- `null` limit values mean unlimited

For quota configuration, see [Subscriptions & Features](./subscriptions-features.md).

## Common Scenarios

### User Sees "Over Limit"

1. Check which resource is over limit
2. Options:
   - Delete unused resources
   - Upgrade subscription plan
   - Purchase add-on (if available)

### User Approaching Limit

1. Warning appears in dashboard
2. Proactive notification may be sent
3. User should plan for upgrade or cleanup

### Enterprise Shows Unlimited

Expected behavior:
- Progress bar shows current usage only
- "Unlimited" displayed instead of limit
- No warning possible

## Source Code

- Component: `apps/admin/src/UsageDashboard.tsx`
- API client: `apps/admin/src/api.ts` (`usageApi.getUsageMetrics`)
- Types: `UsageMetricsDTO`
- Backend: `breederhq-api/src/routes/usage.ts`
