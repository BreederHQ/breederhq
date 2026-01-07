# ✅ Phase 2 Complete: Services & Middleware

## Summary

**Quota enforcement and entitlement checking is now fully functional!** You can now enforce subscription limits on your existing routes.

---

## What Was Built

### 1. ✅ Entitlement Service
**File:** `src/services/subscription/entitlement-service.ts`

**Functions:**
- `checkEntitlement(tenantId, key)` - Check if tenant has access to a feature
- `getTenantEntitlements(tenantId)` - Get all entitlements (includes add-ons)
- `getQuotaLimit(tenantId, quotaKey)` - Get quota limit for a metric
- `grantUserEntitlement(userId, key)` - Grant user-level entitlement
- `revokeUserEntitlement(userId, key)` - Revoke user-level entitlement
- `checkUserEntitlement(userId, key)` - Check user-level entitlement

**Features:**
- ✅ Checks subscription status (TRIAL, ACTIVE, PAST_DUE)
- ✅ Sums add-on quotas (e.g., base 50 + 10 add-on = 60 total)
- ✅ Handles unlimited (null) vs limited quotas
- ✅ Returns reason when access denied

---

### 2. ✅ Usage Tracking Service
**File:** `src/services/subscription/usage-service.ts`

**Functions:**
- `getCurrentUsage(tenantId, metricKey)` - Get current usage count
- `calculateActualUsage(tenantId, metricKey)` - Calculate from database
- `updateUsageSnapshot(tenantId, metricKey)` - Update fast-read snapshot
- `getUsageStatus(tenantId, metricKey)` - Get usage + limit + percentage
- `getAllUsageStatuses(tenantId)` - Get all quotas at once
- `canAddResource(tenantId, metricKey, count)` - Check if can add more
- `refreshAllSnapshots(tenantId)` - Refresh all snapshots
- `getUsageTrend(tenantId, metricKey, startDate, endDate)` - Time-series analytics
- `recordUsage(...)` - Record usage event for analytics

**Features:**
- ✅ Fast reads via UsageSnapshot table
- ✅ Accurate counts from actual database tables
- ✅ Calculates percentage used
- ✅ Ready for time-series analytics

**Supported Metrics:**
- `ANIMAL_COUNT` - Counts from Animal table
- `CONTACT_COUNT` - Counts from Party table (type=CONTACT)
- `PORTAL_USER_COUNT` - Counts from TenantMembership (role=CLIENT)
- `BREEDING_PLAN_COUNT` - Counts from BreedingPlan table
- `MARKETPLACE_LISTING_COUNT` - Counts from MarketplaceListing table
- `STORAGE_BYTES` - TODO: Implement file size tracking
- `SMS_SENT` - TODO: Implement SMS tracking
- `API_CALLS` - TODO: Implement API call tracking

---

### 3. ✅ Quota Enforcement Middleware
**File:** `src/middleware/quota-enforcement.ts`

**Middleware Functions:**

#### `requireEntitlement(key)`
Blocks if tenant lacks entitlement.
```typescript
preHandler: [requireEntitlement('API_ACCESS')]
```

#### `checkQuota(metricKey, countToAdd)`
Blocks if quota would be exceeded.
```typescript
preHandler: [checkQuota('ANIMAL_COUNT')]
```

#### `checkSubscriptionStatus()`
Blocks if subscription expired, warns if past due.
```typescript
preHandler: [checkSubscriptionStatus()]
```

#### `requireSubscriptionAndQuota(metricKey, countToAdd)`
Combo: check subscription + quota.
```typescript
preHandler: [requireSubscriptionAndQuota('ANIMAL_COUNT')]
```

#### `warnQuotaLimit(metricKey, threshold)`
Adds headers when approaching limit (doesn't block).
```typescript
preHandler: [warnQuotaLimit('ANIMAL_COUNT', 0.8)]
```

**Features:**
- ✅ Returns 403 with clear error messages
- ✅ Includes upgrade URL in error response
- ✅ Adds headers for trial/past-due status
- ✅ Shows current usage in error message

---

## Error Responses

### Quota Exceeded
```json
{
  "error": "QUOTA_EXCEEDED",
  "code": "QUOTA_EXCEEDED",
  "message": "You've reached your limit of 50 animals. Upgrade your plan to add more.",
  "details": {
    "currentUsage": 50,
    "limit": 50,
    "upgradeUrl": "/settings/billing/upgrade"
  }
}
```

### Entitlement Required
```json
{
  "error": "ENTITLEMENT_REQUIRED",
  "code": "ENTITLEMENT_REQUIRED",
  "message": "Your plan does not include access to api access",
  "details": {
    "requiredEntitlement": "API_ACCESS",
    "upgradeUrl": "/settings/billing"
  }
}
```

### Subscription Expired
```json
{
  "error": "SUBSCRIPTION_EXPIRED",
  "code": "SUBSCRIPTION_EXPIRED",
  "message": "Your subscription is expired. Please subscribe to continue.",
  "details": {
    "upgradeUrl": "/settings/billing"
  }
}
```

---

## Usage Example

### Before (No Quota):
```typescript
fastify.post('/api/v1/animals', async (req, reply) => {
  return await prisma.animal.create({...});
});
```

### After (With Quota):
```typescript
import { checkQuota } from '../middleware/quota-enforcement.js';
import { updateUsageSnapshot } from '../services/subscription/usage-service.js';

fastify.post(
  '/api/v1/animals',
  {
    preHandler: [
      requireAuth,
      checkQuota('ANIMAL_COUNT') // ← Enforces 50 animal limit!
    ]
  },
  async (req, reply) => {
    const animal = await prisma.animal.create({...});

    // Update snapshot after creation
    await updateUsageSnapshot(req.tenantId, 'ANIMAL_COUNT');

    return animal;
  }
);
```

**What happens:**
1. User tries to create 51st animal
2. `checkQuota` middleware runs
3. Calls `canAddResource(tenantId, 'ANIMAL_COUNT')`
4. Returns false (50/50 limit)
5. Middleware returns 403 with error message
6. Request never reaches handler

---

## Testing

### 1. Create Test Subscription

```sql
-- Give tenant 1 a Pro subscription
INSERT INTO "Subscription" (
  "tenantId", "productId", "status", "amountCents",
  "currency", "billingInterval", "createdAt", "updatedAt"
)
SELECT
  1, -- Your test tenant ID
  id,
  'ACTIVE',
  3900,
  'USD',
  'MONTHLY',
  NOW(),
  NOW()
FROM "Product"
WHERE name = 'BreederHQ Pro (Monthly)'
LIMIT 1;
```

### 2. Test Quota Enforcement

```typescript
// In your test file or manually via API
import { updateUsageSnapshot } from './services/subscription/usage-service.js';

// Refresh snapshot
await updateUsageSnapshot(1, 'ANIMAL_COUNT');

// Check current usage
const usage = await getCurrentUsage(1, 'ANIMAL_COUNT');
console.log(`Current animals: ${usage}/50`);

// Try to add when at limit
const canAdd = await canAddResource(1, 'ANIMAL_COUNT');
console.log(`Can add: ${canAdd}`); // false if at 50
```

### 3. Test Entitlement Check

```typescript
import { checkEntitlement } from './services/subscription/entitlement-service.js';

// Check if tenant has API access
const result = await checkEntitlement(1, 'API_ACCESS');
console.log(result);
// Pro: { hasAccess: false, limitValue: null, reason: '...' }
// Enterprise: { hasAccess: true, limitValue: null }
```

---

## Integration Checklist

To fully enable quota enforcement, update these routes:

### High Priority (Core Quotas):
- [ ] **Animals**
  - Add `checkQuota('ANIMAL_COUNT')` to POST /animals
  - Add `updateUsageSnapshot` after create/delete

- [ ] **Contacts**
  - Add `checkQuota('CONTACT_COUNT')` to POST /contacts
  - Add `updateUsageSnapshot` after create/delete

- [ ] **Portal Access**
  - Add `checkQuota('PORTAL_USER_COUNT')` to POST /portal-access/:partyId/enable
  - Add `updateUsageSnapshot` after granting/revoking

- [ ] **Marketplace Listings**
  - Add `checkQuota('MARKETPLACE_LISTING_COUNT')` to POST /marketplace-listings
  - Add `updateUsageSnapshot` after create/delete

- [ ] **Breeding Plans**
  - Add `checkQuota('BREEDING_PLAN_COUNT')` to POST /breeding-plans
  - Add `updateUsageSnapshot` after create/delete

### Medium Priority (Feature Gates):
- [ ] **API Routes**
  - Add `requireEntitlement('API_ACCESS')` to all /api/external/* routes

- [ ] **Advanced Reporting**
  - Add `requireEntitlement('ADVANCED_REPORTING')` to reports routes

- [ ] **Multi-Location**
  - Add `requireEntitlement('MULTI_LOCATION')` when creating additional locations

### Low Priority (Future Features):
- [ ] E-Signatures (when implemented)
- [ ] SMS tracking (when implemented)
- [ ] Storage tracking (when file uploads added)

---

## Performance Notes

### Fast Reads
- UsageSnapshot table = single row lookup
- Very fast (microseconds)
- No joins needed

### Writes
- Call `updateUsageSnapshot` after create/delete
- Single upsert operation
- Can be done async (non-blocking)

### Optimization Tips
- Batch snapshot updates if creating multiple resources
- Cache entitlements in memory (future optimization)
- Use `warnQuotaLimit` for non-critical paths

---

## What's Next: Phase 3 - Stripe Integration

Now that quotas work, you can add actual billing:

### Phase 3 Tasks:
1. **Stripe Setup**
   - Install Stripe SDK
   - Create Stripe service wrapper
   - Set up webhook handlers

2. **Subscription Management**
   - Create subscription (start trial)
   - Upgrade/downgrade
   - Cancel/reactivate
   - Payment method management

3. **Billing Routes**
   - `/api/v1/billing/products` - List plans
   - `/api/v1/billing/subscriptions` - Manage subscription
   - `/api/v1/billing/payment-methods` - Manage cards
   - `/api/v1/billing/invoices` - Invoice history

4. **Frontend UI**
   - Pricing page
   - Billing settings panel
   - Payment method form
   - Usage dashboard

---

## Files Created

1. `src/services/subscription/entitlement-service.ts` - ✅
2. `src/services/subscription/usage-service.ts` - ✅
3. `src/middleware/quota-enforcement.ts` - ✅
4. `QUOTA_MIDDLEWARE_USAGE.md` - ✅ Complete usage guide
5. `PHASE_2_COMPLETE_SERVICES_MIDDLEWARE.md` - ✅ This file

---

## Documentation

**Complete usage guide:** `QUOTA_MIDDLEWARE_USAGE.md`

Includes:
- All middleware functions explained
- Integration examples
- Testing instructions
- Frontend integration patterns
- Performance considerations

---

**Status:** ✅ Phase 2 Complete - Services & Middleware Ready
**Next:** Add to existing routes, then build Stripe integration (Phase 3)
**Blocking Issues:** None

You can now enforce quotas on any route! 🎉

