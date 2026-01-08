# ✅ Phase 1 Complete: Database Foundation for Subscription System

## Summary

The database foundation for BreederHQ's subscription/billing system is **complete and seeded**!

---

## What Was Accomplished

### 1. ✅ Schema Design & Migration

**13 New Models Added:**
- `Product` - Subscription plans and add-ons
- `ProductEntitlement` - Links products to feature/quota entitlements
- `Subscription` - Tenant subscriptions with trial/billing tracking
- `SubscriptionAddOn` - Add-ons attached to subscriptions
- `UsageRecord` - Time-series usage tracking
- `UsageSnapshot` - Current usage vs limits (fast reads)
- `PaymentMethod` - Stripe payment methods
- `ReferralCode` - Referral codes for affiliates
- `Referral` - Tracks referral relationships and rewards
- `MarketplaceListing` - Listings for marketplace
- `ServiceProviderProfile` - Non-breeder service providers
- `SystemConfig` - System-wide configuration
- `BillingAccount` (enhanced) - Added Stripe fields, billing address

**8 New Enums:**
- `ProductType`, `BillingInterval`, `SubscriptionStatus`
- `UsageMetricKey`, `AnimalCategory`, `ListingType`, `ListingStatus`, `ListingTier`

**Expanded EntitlementKey:**
- 24 entitlement keys (was 1, now 24)
- Surface access: PLATFORM_ACCESS, PORTAL_ACCESS
- Features: BREEDING_PLANS, FINANCIAL_SUITE, API_ACCESS, etc.
- Quotas: ANIMAL_QUOTA, CONTACT_QUOTA, MARKETPLACE_LISTING_QUOTA, etc.

**Migration:** `add_subscription_billing_system` ✅ Applied

---

### 2. ✅ Seed Data

**9 Products Created:**

**Subscription Plans:**
1. **BreederHQ Pro (Monthly)** - $39/month
   - 50 animals, 500 contacts, 25 portal users
   - 1 marketplace listing, 100GB storage
   - 10 entitlements

2. **BreederHQ Pro (Yearly)** - $390/year (save $78)
   - Same as monthly
   - 10 entitlements

3. **BreederHQ Enterprise (Monthly)** - $99/month
   - Unlimited animals, contacts, portal users, listings
   - 500GB storage, API access, advanced features
   - 14 entitlements

4. **BreederHQ Enterprise (Yearly)** - $990/year (save $198)
   - Same as monthly
   - 14 entitlements

**Add-ons:**
5. **+10 Animal Slots** - $5/month
6. **+1 Marketplace Listing** - $10/month
7. **+10 Portal Users** - $5/month
8. **+25GB Storage** - $10/month
9. **Priority Support** - $25/month

**Total:** 52 entitlements configured across all products

**Seed Script:** `npm run db:dev:seed:products` ✅ Working

---

## Database Status

### Tables in Production:
✅ All 13 new tables created
✅ All indexes created
✅ All foreign keys established
✅ Seed data populated

### Query Examples:

```sql
-- View all products
SELECT * FROM "Product" ORDER BY "sortOrder";

-- View Pro plan entitlements
SELECT p.name, pe."entitlementKey", pe."limitValue"
FROM "Product" p
JOIN "ProductEntitlement" pe ON p.id = pe."productId"
WHERE p.name LIKE '%Pro (Monthly)%';

-- Check animal quota for Pro plan
SELECT "entitlementKey", "limitValue"
FROM "ProductEntitlement" pe
JOIN "Product" p ON pe."productId" = p.id
WHERE p.name = 'BreederHQ Pro (Monthly)'
  AND pe."entitlementKey" = 'ANIMAL_QUOTA';
```

---

## Configuration Flexibility

The schema supports multiple business models **without code changes**:

✅ **Configurable Quotas** - Change limits in `ProductEntitlement.limitValue`
✅ **Trial Periods** - Tracked in `Subscription.trialStart/trialEnd`
✅ **Marketplace Fees** - Support both listing fees AND commission
✅ **Referral System** - Ready for Stripe coupons
✅ **Add-ons** - Stackable on base subscriptions
✅ **Usage Tracking** - Time-series + snapshot tables

---

## What's Next: Phase 2 - Services & Middleware

Now that the database is ready, we can build:

### 1. **Stripe Integration** (Week 1)
- [ ] Install Stripe SDK
- [ ] Create Stripe service wrapper
- [ ] Implement webhook handlers
- [ ] Set up Stripe products/prices (sync with DB)

### 2. **Entitlement Service** (Week 1)
- [ ] `checkEntitlement(tenantId, key)` - Check if tenant has access
- [ ] `getQuotaLimit(tenantId, metric)` - Get current limit
- [ ] `grantEntitlement(tenantId, key)` - Grant access
- [ ] `revokeEntitlement(tenantId, key)` - Revoke access

### 3. **Quota Enforcement Middleware** (Week 1)
- [ ] `requireEntitlement(key)` - Block if missing entitlement
- [ ] `checkQuota(metric)` - Block if over quota
- [ ] `checkSubscriptionStatus()` - Warn/block if expired
- [ ] Usage tracking interceptors

### 4. **Subscription Management Service** (Week 2)
- [ ] `createSubscription(tenantId, productId)` - Start subscription
- [ ] `updateSubscription(subscriptionId, newProductId)` - Upgrade/downgrade
- [ ] `cancelSubscription(subscriptionId)` - Cancel
- [ ] `reactivateSubscription(subscriptionId)` - Reactivate

### 5. **API Routes** (Week 2)
- [ ] `/api/v1/billing/products` - List available products
- [ ] `/api/v1/billing/subscriptions` - Manage subscription
- [ ] `/api/v1/billing/payment-methods` - Manage cards
- [ ] `/api/v1/billing/invoices` - Invoice history
- [ ] `/api/v1/entitlements` - Check entitlements
- [ ] `/api/v1/usage` - Current usage

### 6. **Frontend UI** (Week 3)
- [ ] Pricing page
- [ ] Billing settings panel
- [ ] Payment method management
- [ ] Usage dashboard
- [ ] Upgrade/downgrade flow

---

## Files Created

### Schema & Migration:
1. `prisma/schema.prisma` - ✅ Updated with 13 models + 8 enums
2. `prisma/migrations/XXXXXX_add_subscription_billing_system/` - ✅ Applied

### Seed Data:
3. `prisma/seed/seed-subscription-products.ts` - ✅ Working
4. `package.json` - ✅ Added `db:dev:seed:products` script

### Documentation:
5. `SUBSCRIPTION_SCHEMA_CHANGES.md` - Schema change documentation
6. `SCHEMA_MIGRATION_READY.md` - Migration guide
7. `BreederHQ-Subscription-Tiers.confluence.md` - Business tier definitions
8. `SUBSCRIPTION_PHASE_1_COMPLETE.md` - This file

---

## Key Decisions Made

### Pricing Model:
- ✅ **Trial-only** (no free tier forever)
- ✅ **14-day trial** → Auto-convert to paid
- ✅ **Hard quota limits** enforced
- ✅ **No commission** on marketplace (listing fees instead)
- ✅ **Variable listing fees** by animal category
- ✅ **Unlimited staff** for both tiers

### Quotas (Configurable):
- Pro: 50 animals, 500 contacts, 25 portal users, 1 listing, 100GB
- Enterprise: Unlimited (null in database)
- Add-ons: Stackable on Pro tier

### Storage:
- Using Cloudflare R2 (recommended)
- Pro: 100GB ($1.50/month cost)
- Enterprise: 500GB ($7.50/month cost)
- 96%+ margin on storage

---

## Environment Setup Needed (Before Stripe Integration)

Add to `.env.dev`:
```bash
# Stripe Keys (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Subscription Config
TRIAL_DURATION_DAYS=14
PRO_ANIMAL_LIMIT=50
ENTERPRISE_ANIMAL_LIMIT=999999

# Marketplace
MARKETPLACE_COMMISSION_ENABLED=false
MARKETPLACE_LISTING_FEES_ENABLED=true
```

---

## Testing the Database

### Verify Products:
```bash
npm run db:studio
```

Navigate to `Product` table and verify:
- 4 subscription products (Pro/Enterprise, Monthly/Yearly)
- 5 add-on products
- All have correct pricing
- All have entitlements linked

### Verify Entitlements:
Check `ProductEntitlement` table:
- Pro plans should have 10 entitlements each
- Enterprise plans should have 14 entitlements each
- Add-ons should have 0-1 entitlements each

### Run Seed Again (Idempotent):
```bash
npm run db:dev:seed:products
```

Should update existing products, not create duplicates.

---

## Next Action Items

**Ready to start Phase 2?**

Pick one:

**Option A: Stripe Integration First**
- Set up Stripe account
- Create products in Stripe dashboard
- Build service layer for Stripe API
- Implement webhooks

**Option B: Middleware First**
- Build quota enforcement
- Add entitlement checks to existing routes
- Test quota limits
- Then add Stripe later

**Option C: Both in Parallel**
- Stripe integration (background)
- Middleware + services (blocking current features)

**My Recommendation:** Option B - Build enforcement middleware first so you can test quota limits immediately, then add Stripe billing when ready to charge.

---

**Status:** ✅ Phase 1 Complete - Ready for Phase 2
**Blocking Issues:** None
**Next Step:** Choose Phase 2 approach above

