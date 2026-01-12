# Marketplace: Existing APIs vs New Schema Analysis

**Date:** 2026-01-12
**Status:** Analysis Complete ✅

## Executive Summary

The existing BreederHQ system has **extensive marketplace functionality already built** using the `public` schema (TenantSettings, Party, MessageThread, WaitlistEntry, etc.). The new `marketplace` schema adds dedicated tables for a **buyer-centric marketplace** with separate user accounts, providers, service listings, transactions, and invoices.

**Key Finding:** These are **complementary systems** that need integration, not replacement:
- **Existing**: Breeder-side marketplace (breeder profiles, listings, messaging, waitlists)
- **New Schema**: Buyer-side marketplace (buyer accounts, transactions, invoices, service providers)

---

## Existing Marketplace APIs (Using Public Schema)

### 1. **Breeder Profiles** ([marketplace-breeders.ts](../../breederhq-api/src/routes/marketplace-breeders.ts))
- `GET /api/v1/marketplace/breeders` - List published breeders
- `GET /api/v1/marketplace/breeders/:tenantSlug` - Breeder profile
- `GET /api/v1/marketplace/breeders/:tenantSlug/messaging` - Get messaging info

**Data Storage:** `TenantSetting` (namespace: `marketplace-profile`)
**Features:**
- Published/draft profiles
- Business name, bio, logo
- Location (city/state, privacy modes)
- Breeds, programs, credentials
- Standards & placement policies
- Business hours, quick responder badge

### 2. **Profile Management** ([marketplace-profile.ts](../../breederhq-api/src/routes/marketplace-profile.ts))
- `GET /api/v1/marketplace/profile` - Read profile (draft + published)
- `PUT /api/v1/marketplace/profile/draft` - Save draft
- `POST /api/v1/marketplace/profile/publish` - Publish profile
- `POST /api/v1/marketplace/profile/unpublish` - Unpublish

**Data Storage:** `TenantSetting` (JSON data field)
**Features:**
- Draft/publish workflow
- Address privacy (strips street fields)
- Auto-generates tenant slugs
- Validation rules

### 3. **Messaging** ([marketplace-messages.ts](../../breederhq-api/src/routes/marketplace-messages.ts))
- `GET /api/v1/messages/threads` - List threads
- `GET /api/v1/messages/threads/:id` - Thread details
- `POST /api/v1/messages/threads` - Create thread
- `POST /api/v1/messages/threads/:id/messages` - Send message

**Data Storage:** `MessageThread`, `Message`, `MessageParticipant`, `Party`
**Features:**
- Per-tenant Party creation for marketplace users
- Cross-tenant messaging (user has Party in each breeder's tenant)
- Read/unread tracking
- Auto-reuse existing threads

### 4. **Waitlist** ([marketplace-waitlist.ts](../../breederhq-api/src/routes/marketplace-waitlist.ts))
- `POST /api/v1/marketplace/waitlist/:tenantSlug` - Join waitlist
- `GET /api/v1/marketplace/waitlist/my-requests` - My requests
- `POST /api/v1/marketplace/invoices/:id/checkout` - Stripe checkout

**Data Storage:** `WaitlistEntry`, `Contact`, `Party`, `Invoice`
**Features:**
- Creates Contact in breeder's tenant
- Links to marketplace user via `externalProvider: "marketplace"`
- Deposit invoices
- Stripe Connect integration
- Origin tracking (UTM params)

### 5. **Public Marketplace** ([public-marketplace.ts](../../breederhq-api/src/routes/public-marketplace.ts))
- `GET /api/v1/marketplace/me` - Current user info
- `PATCH /api/v1/marketplace/profile` - Update user profile
- `GET /api/v1/marketplace/programs` - Browse programs
- `GET /api/v1/marketplace/programs/:slug` - Program details
- `GET /api/v1/marketplace/programs/:slug/offspring-groups` - Listings
- `GET /api/v1/marketplace/programs/:slug/animals` - Animal listings
- `POST /api/v1/marketplace/inquiries` - Create inquiry
- `GET /api/v1/marketplace/services` - Browse services
- `GET /api/v1/marketplace/offspring-groups` - Browse all offspring
- `GET /api/v1/marketplace/breeding-programs` - Browse breeding programs

**Data Storage:** `Organization`, `OffspringGroup`, `Offspring`, `Animal`, `AnimalPublicListing`, `BreedingProgram`, `MarketplaceListing`
**Features:**
- Entitlement-gated (MARKETPLACE_ACCESS)
- Breeder discovery
- Listing browsing
- Inquiry creation
- Search/filter by species, breed, location

### 6. **Supporting Services**
- `marketplace-block.js` - Block management
- `marketplace-flag.js` - User suspension
- `marketplace-assets.ts` - Asset management
- `marketplace-report-breeder.ts` - Reporting

---

## New Marketplace Schema (marketplace.*)

### Tables Created
1. **`marketplace.users`** - Buyer accounts (email, password, phone, Stripe customer)
2. **`marketplace.providers`** - Service providers (business name, payment mode, Stripe Connect)
3. **`marketplace.service_listings`** - Service listings (title, category, pricing, location)
4. **`marketplace.transactions`** - Transactions (client → provider, invoice link)
5. **`marketplace.invoices`** - Marketplace invoices (separate from breeder invoices)
6. **`marketplace.message_threads`** - Message threads (client ↔ provider)
7. **`marketplace.messages`** - Messages in threads

### Key Relationships
- `marketplace.users.tenantId` → `public.Tenant.id` (for breeders who are also buyers)
- `marketplace.providers.tenantId` → `public.Tenant.id` (links providers to breeder accounts)
- `marketplace.transactions.providerTenantId` → `public.Tenant.id` (cross-schema FK)

---

## Gap Analysis: What's Missing

### ✅ Already Implemented (Using Public Schema)
1. Breeder profile publishing ✅
2. Breeder discovery/browsing ✅
3. Messaging (buyer → breeder) ✅
4. Waitlist requests ✅
5. Deposit invoices ✅
6. Stripe checkout for deposits ✅
7. Inquiry system ✅
8. Listing management (offspring, animals) ✅
9. User authentication (uses existing User table) ✅
10. Blocking/suspension ✅

### ❌ NOT Implemented (Needs New Schema)
1. **Marketplace buyer accounts** (separate from breeder User accounts)
   - Currently uses existing `User` table with MARKETPLACE_ACCESS entitlement
   - New schema wants separate `marketplace.users` with email/password

2. **Service providers** (non-breeder service providers)
   - Grooming, training, vet services, etc.
   - `marketplace.providers` table unused

3. **Service listings** (from service providers)
   - `marketplace.service_listings` table unused

4. **Transaction tracking** (buyer purchases)
   - `marketplace.transactions` table unused
   - Currently just uses Invoice in public schema

5. **Marketplace invoices** (separate invoice system)
   - `marketplace.invoices` table unused
   - Currently uses `public.Invoice` with `isMarketplaceInvoice: true`

6. **Marketplace-specific messaging** (separate from breeder messaging)
   - `marketplace.message_threads` and `marketplace.messages` unused
   - Currently uses `public.MessageThread` and `public.Message`

---

## Current Architecture

### Breeder-Side (Existing)
```
User (with MARKETPLACE_ACCESS)
  ↓
Party (created per-tenant)
  ↓
MessageThread → Breeder's Organization.partyId
WaitlistEntry → Breeder's Tenant
Contact → Breeder's Tenant
Invoice (isMarketplaceInvoice: true)
```

### Buyer-Side (New Schema - Not Integrated)
```
marketplace.users (separate account)
  ↓
marketplace.transactions
  ↓
marketplace.invoices
  ↓
marketplace.message_threads
```

---

## Integration Strategy Recommendations

### Option 1: **Unified User System** (Recommended)
Keep using the existing `User` table for all marketplace participants, link to marketplace schema:

```sql
-- Add FK from marketplace tables to public.User
ALTER TABLE marketplace.providers ADD COLUMN userId TEXT REFERENCES public."User"(id);
ALTER TABLE marketplace.transactions ADD COLUMN clientUserId TEXT REFERENCES public."User"(id);
```

**Pros:**
- Single login for all users
- Existing auth works
- Simpler user management

**Cons:**
- Less separation between breeder/buyer systems
- Marketplace users need User accounts

### Option 2: **Dual User System**
Keep `marketplace.users` separate, use for buyers who aren't breeders:

```
Breeder who buys → public.User (linked to marketplace.users via email match)
Pure buyer → marketplace.users only
Service provider → marketplace.providers + optional public.User
```

**Pros:**
- Clean separation
- Marketplace can scale independently

**Cons:**
- Duplicate user management
- Complex account linking
- Two auth systems

### Option 3: **Migrate to Marketplace Schema** (Not Recommended)
Move all marketplace functionality to use new schema.

**Pros:**
- Clean slate
- Matches original architectural plan

**Cons:**
- **Massive refactor** - 6+ files, 1500+ lines of existing code
- Break existing marketplace.breederhq.com portal
- Lose all historical data migration complexities

---

## Recommended Next Steps

### Phase 3A: Analysis & Planning (COMPLETE ✅)
1. ✅ Document existing marketplace APIs
2. ✅ Identify overlaps with new schema
3. ✅ Recommend integration approach

### Phase 3B: Integration (TODO)
1. **Decision Required:** Choose Option 1 (Unified) or Option 2 (Dual)

2. **If Option 1 (Unified User System):**
   - Add userId FK to marketplace.providers
   - Add clientUserId FK to marketplace.transactions
   - Create migration to link existing marketplace users
   - Update marketplace.invoices to reference public.Invoice
   - Deprecate marketplace.users table (or repurpose as buyer profile extensions)

3. **If Option 2 (Dual User System):**
   - Build marketplace.users authentication (register/login)
   - Create account linking logic (email match)
   - Build APIs for service providers (non-breeders)
   - Implement marketplace-specific transaction/invoice flow
   - Keep existing breeder marketplace unchanged

### Phase 3C: New Features (TODO)
Once integration strategy is chosen:

1. **Service Provider Features** (uses new schema)
   - Provider registration
   - Service listing CRUD
   - Provider invoicing

2. **Transaction Tracking** (uses new schema)
   - Track all marketplace purchases
   - Revenue reporting
   - Commission calculation

3. **Unified Buyer Dashboard**
   - Show both breeder waitlists AND service bookings
   - Unified messaging inbox
   - Purchase history

---

## Files Modified in Phase 1 & 2

### Database
- ✅ `prisma/schema.prisma` - Added marketplace schema, multiSchema support
- ✅ Migration: `20260112173325` - Phase 1 critical fixes
- ✅ Migration: `20260112180105` - Phase 2 marketplace schema

### Code
- ✅ `src/utils/query-helpers.ts` - Soft delete helpers
- ✅ `src/routes/invoices.ts` - Updated queries with activeOnly()
- ✅ `src/routes/contacts.ts` - Updated queries with activeOnly()
- ✅ `src/routes/animals.ts` - Updated queries with activeOnly()

### Tests
- ✅ `scripts/test-database-changes.ts` - Automated validation (14 tests passing)

---

## Questions for Decision

1. **User Account Strategy:** Unified (Option 1) or Dual (Option 2)?

2. **Marketplace Invoice Strategy:**
   - Keep using `public.Invoice` with `isMarketplaceInvoice: true`?
   - OR migrate to `marketplace.invoices`?

3. **Service Providers:**
   - Are non-breeder service providers a priority?
   - OR just use existing breeder marketplace?

4. **Timeline:**
   - Integration work needed ASAP?
   - OR can we keep existing marketplace running unchanged?

5. **Data Migration:**
   - Any existing marketplace.breederhq.com production data?
   - Need to preserve historical transactions?

---

## Conclusion

The good news: **The existing marketplace is feature-rich and production-ready.** The new schema adds capability for buyer accounts and service providers, but **most core marketplace functionality already exists**.

**Recommendation:** Choose Option 1 (Unified User System) and integrate incrementally:
1. Keep existing breeder marketplace unchanged
2. Add service provider features using new schema
3. Link everything via existing User table
4. Use marketplace.transactions for tracking/reporting
5. Keep using public.Invoice (proven, integrated with Stripe)

This minimizes risk, preserves existing functionality, and allows incremental rollout of new features.
