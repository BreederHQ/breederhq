# BreederHQ Platform Database Architecture Review
**Professional Architectural Assessment**

**Review Date**: 2026-01-12
**Reviewed By**: Principal Database Architect
**Engagement Type**: Production Readiness Assessment
**Scope**: Complete platform (Tenant DB + Marketplace DB + Cross-database architecture)

---

## Executive Summary

This document provides a comprehensive architectural review of the proposed BreederHQ Marketplace database schema and its integration with the existing multi-tenant platform. This review covers database strategy, schema design, security, performance, payment architecture, API design, and operational readiness.

**Quick Links**:
- [Executive Assessment](#1-executive-architectural-assessment)
- [Critical Flaws (Showstoppers)](#2-critical-architectural-flaws-showstoppers)
- [Schema Changes Required](#13-specific-schema-changes-required)
- [API Changes Required](#14-specific-api-changes-required)
- [Final Verdict](#15-final-verdict-and-sign-off)

---

## 1. Executive Architectural Assessment

### Database Strategy Decision

**[X] Separate marketplace database is RECOMMENDED**

**Reasoning**:
The proposed dual-database strategy is sound for the stated requirements but presents moderate implementation complexity. The separation provides clean isolation for public marketplace data from private tenant business data, supports independent scaling, and aligns with microservices evolution. However, the cross-database referential integrity challenges and transaction coordination overhead must be carefully managed. A single database with proper schema isolation could achieve similar benefits with less operational complexity, but the dual-database approach is architecturally defensible given the distinct access patterns and scale projections.

---

### Production Readiness Assessment

**Production Readiness Score**: **7/10**

**Architectural Classification**:
- [X] **Requires significant changes before production**

**Critical Risk Assessment**:
- Data integrity risks: **MEDIUM** (cross-database linking without FK enforcement, dual invoice strategy complexity)
- Security risks: **LOW** (tenant isolation patterns are sound, but cross-database authorization needs formalization)
- Performance risks: **MEDIUM** (N+1 query risks in cross-database joins, missing critical indexes)
- Scalability risks: **LOW** (architecture supports horizontal scaling)
- Migration risks: **MEDIUM** (zero-downtime migration strategy incomplete)

**Timeline Impact**:
- If approved with changes: **+8 weeks** (4 weeks critical, 2 weeks high-priority, 2 weeks recommended)
- If redesign required: **Not applicable** (architecture is fundamentally sound)

---

## 2. Critical Architectural Flaws (Showstoppers)

### Flaw #1: Missing Cross-Database Referential Integrity Strategy

**Issue**: Proposed schema stores cross-database IDs (tenantId, userId, invoiceId) without foreign keys and lacks a formal strategy for orphaned record prevention.

**Impact**: **Data corruption** - Deleted tenant invoices could leave marketplace transactions pointing to non-existent records.

**Scenario**:
1. Breeder creates tenant invoice (id=123) for marketplace transaction
2. Marketplace transaction stores `tenantInvoiceId = 123`
3. Breeder voids and deletes invoice from tenant DB
4. Marketplace transaction still references deleted invoice
5. Application queries fail or return corrupted data

**Fix**: Implement **soft-delete pattern** for all cross-database entities:
```sql
-- Tenant Invoice table
ALTER TABLE invoices ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE invoices ADD CONSTRAINT prevent_hard_delete_if_marketplace
  CHECK (deleted_at IS NOT NULL OR is_marketplace_invoice = FALSE);

-- Application-level cascade rule
CREATE TABLE cross_db_references (
  id SERIAL PRIMARY KEY,
  source_db VARCHAR(50),
  source_table VARCHAR(100),
  source_id INTEGER,
  target_db VARCHAR(50),
  target_table VARCHAR(100),
  target_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### Flaw #2: Payment Mode Switching Race Condition

**Issue**: Tenant can switch payment mode (Stripe ↔ Manual) while invoice creation is in progress, causing invoice to be created with wrong payment infrastructure.

**Impact**: **Payment failure** - Invoice created with Stripe but tenant has no Stripe account, or vice versa.

**Scenario**:
1. Transaction begins: Read tenant.marketplacePaymentMode = 'stripe'
2. Admin simultaneously updates tenant payment mode to 'manual'
3. Transaction commits invoice with paymentMode='stripe' + creates Stripe invoice
4. Stripe invoice creation fails (Connect account disabled)
5. Invoice stuck in inconsistent state

**Fix**: Implement **payment mode locking at invoice creation**:
```sql
-- Lock payment mode at transaction level
SELECT marketplace_payment_mode FROM tenants
WHERE id = $1 FOR UPDATE;

-- Store mode snapshot in invoice
ALTER TABLE invoices ADD COLUMN payment_mode_snapshot VARCHAR(50);
ALTER TABLE invoices ADD COLUMN payment_mode_locked_at TIMESTAMP;
```

Application logic must use `payment_mode_snapshot` for all invoice operations, never re-read from tenant.

---

### Flaw #3: Contact.marketplaceUserId Creates Tenant Data Leakage Vector

**Issue**: Adding `marketplaceUserId` to tenant Contact table allows accidental cross-tenant queries if application code uses marketplace user ID for lookups without tenantId filter.

**Impact**: **Security breach** - One tenant could access another tenant's contact records if query forgets tenantId filter.

**Scenario**:
```typescript
// VULNERABLE CODE
const contact = await prisma.contact.findFirst({
  where: { marketplaceUserId: 42 }  // Missing tenantId!
});
// Returns contact from ANY tenant with this marketplace user
```

**Fix**: Enforce **compound unique constraint** and mandatory tenantId filtering:
```sql
-- Replace simple marketplaceUserId field with compound unique
CREATE UNIQUE INDEX idx_contacts_marketplace_user_tenant
  ON contacts(marketplace_user_id, tenant_id)
  WHERE marketplace_user_id IS NOT NULL;

-- Add database-level RLS policy (PostgreSQL)
CREATE POLICY contact_tenant_isolation ON contacts
  USING (tenant_id = current_setting('app.current_tenant_id')::int);
```

Application must **never** query contacts by marketplace_user_id alone.

---

### Flaw #4: Dual Invoice Architecture Overengineering

**Issue**: Proposed design maintains BOTH tenant Invoice + marketplace Invoice for service providers, creating dual source of truth and synchronization complexity.

**Impact**: **Data inconsistency** - Payment status updates must be synced across two invoices, prone to drift.

**Scenario**:
1. Service provider invoice created in marketplace DB
2. Payment marked as paid in marketplace invoice
3. Corresponding transaction updated to 'paid'
4. Application forgets to sync back to tenant invoice (if provider is also breeder)
5. Financial reports show different totals in tenant vs marketplace

**Fix**: **Single invoice strategy** - Use tenant invoice for breeders, marketplace invoice ONLY for non-breeder service providers:
```typescript
interface MarketplaceTransaction {
  // EITHER tenant invoice (if breeder) OR marketplace invoice (if service provider)
  invoiceType: "tenant" | "marketplace";
  invoiceId: number;  // ID in appropriate database
  invoiceDatabase: "tenant" | "marketplace";
}
```

Eliminate dual-write pattern entirely.

---

## 3. Schema Design Evaluation

### Normalization Analysis

**Verdict**: **NEEDS REVISION**

**Issues Identified**:

1. **JSON Column Overuse** - The following should be normalized:
   - `ServiceListing.images` - Should be separate `service_listing_images` table for proper querying
   - `ServiceListing.category_metadata` - Cannot query efficiently, should use EAV pattern or JSONB with GIN index
   - `MarketplaceInvoice.lineItems` - Should be separate `marketplace_invoice_line_items` table to match tenant pattern

2. **Denormalized Caching Without Update Strategy**:
   - `MarketplaceContact` caches `name`, `email`, `phone` from User
   - `MarketplaceProvider` stats (`totalListings`, `totalTransactions`, `totalRevenueCents`) denormalized
   - **Missing**: Trigger/update strategy to keep these in sync

3. **Redundant Contact Tracking**:
   - `Contact.marketplace*` fields duplicate `MarketplaceContact` stats
   - Creates dual-write requirement

**Required Schema Changes**:
```sql
-- 1. Normalize images
CREATE TABLE service_listing_images (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES service_listings(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add JSONB index if keeping category_metadata
CREATE INDEX idx_service_listings_metadata_gin
  ON service_listings USING GIN (category_metadata);

-- 3. Normalize line items
CREATE TABLE marketplace_invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES marketplace_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0
);
```

---

### Cross-Database Strategy

**Verdict**: **ALTERNATIVE RECOMMENDED**

The proposed dual-database approach is workable but introduces unnecessary complexity for the stated scale (50,000 breeders, 500,000 users).

**Alternative**: **Single database with schema-level isolation**:
```sql
-- Public marketplace schema
CREATE SCHEMA marketplace;
-- Private tenant schema (existing)
CREATE SCHEMA tenant;

-- Marketplace tables in marketplace schema
CREATE TABLE marketplace.users (...);
CREATE TABLE marketplace.providers (...);

-- Tenant tables in tenant schema
CREATE TABLE tenant.invoices (...);
CREATE TABLE tenant.contacts (...);
```

**Advantages**:
- Foreign keys work across schemas (unlike cross-database)
- Transactions are ACID-compliant
- Backup/restore coordination simpler
- Query performance better (no cross-database overhead)

**Disadvantages**:
- Harder to split into separate physical databases later
- Requires more careful access control

**Recommendation**: Start with single database + schemas, split databases only if scale demands it.

---

### Index Strategy

**Verdict**: **NEEDS REVISION**

**Missing Critical Indexes**:

```sql
-- Transaction queries will be slow without composite indexes
CREATE INDEX idx_transactions_provider_status_created
  ON marketplace_transactions(provider_id, status, created_at DESC);

CREATE INDEX idx_transactions_client_status_created
  ON marketplace_transactions(client_id, status, created_at DESC);

-- Message pagination needs composite index
CREATE INDEX idx_messages_thread_created
  ON messages(thread_id, created_at DESC) INCLUDE (read_at);

-- Service search needs multi-column index
CREATE INDEX idx_service_listings_active_search
  ON service_listings(status, category, state, city)
  WHERE status = 'active';

-- Marketplace invoice lookups by transaction
CREATE INDEX idx_marketplace_invoices_transaction_status
  ON marketplace_invoices(transaction_id, status);
```

**Over-Indexing Concerns**:
- `ServiceListing` has 5 single-column indexes but likely needs composite indexes instead
- Remove `idx_service_listings_slug` (slug already has unique constraint with index)

---

### Data Type Choices

**Issues**:

1. **Integer Sizes**:
   - `marketplace_transactions.id` - Use BIGINT (500K users × average 10 transactions = 5M+ records)
   - `messages.id` - Use BIGINT (high-volume table)

2. **String Lengths**:
   - `invoice_number VARCHAR(100)` - Excessive, use VARCHAR(50)
   - `stripe_invoice_id VARCHAR(255)` - Stripe IDs are ~30 chars, use VARCHAR(50)

3. **Decimal Precision**:
   - `average_rating DECIMAL(3,2)` - Correct (0.00 to 9.99)
   - Currency cents fields should be BIGINT not INT (overflow at $21M)

**Required Changes**:
```sql
ALTER TABLE marketplace_transactions ALTER COLUMN id TYPE BIGINT;
ALTER TABLE messages ALTER COLUMN id TYPE BIGINT;
ALTER TABLE invoices ALTER COLUMN amount_cents TYPE BIGINT;
ALTER TABLE marketplace_invoices ALTER COLUMN total_cents TYPE BIGINT;
```

---

## 4. Payment Architecture Evaluation

### Invoice Strategy

**Verdict**: **SIMPLIFIED**

The dual invoice system (tenant Invoice + marketplace Invoice) is **unnecessary and risky**.

**Simplified Architecture**:
- **Breeders**: Use ONLY tenant Invoice (existing system)
- **Service Providers**: Use ONLY marketplace Invoice (new system)
- **Transaction**: Links to appropriate invoice via `invoiceType` + `invoiceId`

**Required Changes**:
```sql
ALTER TABLE marketplace_transactions
  DROP COLUMN tenant_invoice_id,
  DROP COLUMN marketplace_invoice_id,
  ADD COLUMN invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('tenant', 'marketplace')),
  ADD COLUMN invoice_id INTEGER NOT NULL;
```

Application resolves invoice by type:
```typescript
if (transaction.invoiceType === 'tenant') {
  invoice = await getTenantInvoice(transaction.providerTenantId, transaction.invoiceId);
} else {
  invoice = await MarketplaceInvoice.findById(transaction.invoiceId);
}
```

---

### Payment Security

**Vulnerabilities Identified**:

1. **Manual Payment Fraud Risk**:
   - Buyer marks invoice paid with fake reference
   - Provider must manually verify (no Stripe proof)
   - **Mitigation**: Require payment receipt attachment upload before marking paid

2. **Payment Confirmation Bypass**:
   - No time limit on pending_confirmation status
   - Buyer could claim payment indefinitely
   - **Mitigation**: Auto-expire pending_confirmation after 7 days, revert to 'sent'

3. **Stripe Webhook Replay Attack**:
   - Proposed idempotency uses webhook event ID
   - Stripe retries same event if handler fails
   - **Vulnerability**: If idempotency check is too strict, legitimate retries fail
   - **Fix**: Check idempotency on invoice+amount, not just event ID

4. **Dual Payment Mode Confusion**:
   - Invoice can be created with payment_mode='stripe' but buyer pays manually
   - No enforcement of payment method matching invoice mode
   - **Mitigation**: Lock payment method at invoice creation, reject mismatched payments

**Required Security Changes**:
```sql
-- Require receipt for manual payments
ALTER TABLE invoices ADD COLUMN buyer_payment_receipt_url VARCHAR(500);
ALTER TABLE invoices ADD CONSTRAINT chk_manual_payment_receipt
  CHECK (
    (payment_mode != 'manual' OR buyer_marked_paid_at IS NULL)
    OR buyer_payment_receipt_url IS NOT NULL
  );

-- Auto-expire pending confirmations
CREATE INDEX idx_invoices_pending_confirmation_age
  ON invoices(status, buyer_marked_paid_at)
  WHERE status = 'pending_confirmation';

-- Add webhook idempotency table
CREATE TABLE stripe_webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT NOW(),
  invoice_id INTEGER,
  amount_cents INTEGER,
  result JSONB
);
```

---

### Financial Data Integrity

**Concerns**:

1. **Money Loss Scenario - Partial Refunds**:
   - Proposed schema has no partial refund support
   - If Stripe issues partial refund, invoice status ambiguous
   - **Fix**: Add `refunded_cents` field to track partial refunds

2. **Money Duplication Scenario - Race Condition**:
   - Webhook and manual confirmation could both mark invoice paid
   - **Fix**: Use database-level locking:
   ```sql
   SELECT * FROM invoices WHERE id = $1 AND status != 'paid' FOR UPDATE;
   ```

3. **Source of Truth Ambiguity**:
   - Proposed: "Stripe is source of truth for online payments"
   - Problem: What if tenant invoice says 'paid' but Stripe says 'unpaid'?
   - **Fix**: Add `reconciliation_status` field to track mismatches

**Required Changes**:
```sql
ALTER TABLE invoices ADD COLUMN refunded_cents BIGINT DEFAULT 0;
ALTER TABLE marketplace_invoices ADD COLUMN refunded_cents BIGINT DEFAULT 0;
ALTER TABLE invoices ADD COLUMN reconciliation_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE marketplace_invoices ADD COLUMN reconciliation_status VARCHAR(50) DEFAULT 'synced';
```

---

## 5. Multi-Tenancy and Security Audit

### Tenant Isolation

**Verdict**: **APPROVED WITH CONCERNS**

**Analysis of Contact.marketplaceUserId**:

The proposed field creates **moderate risk** of tenant data leakage. While not inherently insecure, it requires **perfect application-level enforcement** of tenantId filtering.

**Security Concerns**:

1. **Accidental Leakage via ORM**:
```typescript
// UNSAFE
const contact = await prisma.contact.findFirst({
  where: { marketplaceUserId: userId }  // Oops, forgot tenantId!
});
```

2. **Report/Analytics Risk**:
```sql
-- UNSAFE aggregation
SELECT marketplace_user_id, COUNT(*)
FROM contacts
GROUP BY marketplace_user_id;  -- Exposes cross-tenant activity
```

**Required Mitigations**:

1. **Database-Level Row Security** (PostgreSQL RLS):
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON contacts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::int);
```

2. **Application-Level Middleware**:
```typescript
// Prisma middleware to enforce tenantId
prisma.$use(async (params, next) => {
  if (params.model === 'Contact') {
    if (!params.args.where?.tenantId) {
      throw new Error('tenantId required for Contact queries');
    }
  }
  return next(params);
});
```

3. **Audit Logging**:
```sql
CREATE TABLE cross_tenant_access_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  queried_tenant_id INTEGER,
  actual_tenant_id INTEGER,
  table_name VARCHAR(100),
  query_type VARCHAR(50),
  logged_at TIMESTAMP DEFAULT NOW()
);
```

---

### Cross-Database Authorization

**Gap**: No formal session/token strategy for marketplace users accessing tenant data.

**Scenario**: Marketplace buyer views their invoice:
1. User authenticated in marketplace (marketplace DB session)
2. Request invoice from tenant DB
3. How to verify user has permission to view tenant invoice?

**Required Solution**:
```typescript
// JWT token structure
interface MarketplaceToken {
  userId: number;           // Marketplace user ID
  tenantAccess: Array<{     // List of tenants user can access
    tenantId: number;
    role: 'buyer' | 'seller';
    contactId: number;      // Their contact ID in that tenant
  }>;
  issuedAt: number;
  expiresAt: number;
}

// Authorization middleware
async function verifyTenantAccess(token: MarketplaceToken, tenantId: number) {
  const access = token.tenantAccess.find(a => a.tenantId === tenantId);
  if (!access) throw new UnauthorizedError();
  return access;
}
```

**Service Provider Restrictions**:
- Service providers (non-breeders) should NEVER access tenant databases
- Enforce via:
```typescript
if (user.userType === 'service_provider' && !user.tenantId) {
  // Can only access marketplace DB
  if (requestedDb === 'tenant') throw new ForbiddenError();
}
```

---

### SQL Injection and Query Safety

**Audit Findings**:

The proposed API examples use parameterized queries correctly:
```typescript
await queryTenantDatabase(
  tenantId,
  `SELECT * FROM invoices WHERE id = $1`,  // ✓ Parameterized
  [transaction.tenantInvoiceId]
);
```

**Required Enforcement**:
1. **Ban Raw SQL**: Use ORM (Prisma) exclusively for cross-database queries
2. **Code Review Checklist**: All cross-DB queries must use parameterized format
3. **Static Analysis**: Add ESLint rule to detect string concatenation in queries

---

## 6. API Architecture Evaluation

### RESTful Design

**Issues**:

1. **Non-RESTful Endpoint**:
```
POST /api/v1/invoices/:id/mark-paid  // Should be PATCH
```

2. **Missing Versioning on Some Endpoints**:
- Proposed: `/api/v1/marketplace/invoices` ✓
- Existing: `/invoices` ✗ (no version)

3. **Inconsistent Resource Nesting**:
```
POST /api/v1/marketplace/invoices  // Good
POST /api/v1/invoices/:id/mark-paid  // Inconsistent (should be under marketplace?)
```

**Required Changes**:
```
CHANGE: POST /api/v1/marketplace/invoices/:id/mark-paid
     →  PATCH /api/v1/marketplace/invoices/:id
        Body: { action: "mark_paid", paymentMethod: "..." }

CHANGE: POST /api/v1/invoices/:id/confirm-payment
     →  PATCH /api/v1/invoices/:id
        Body: { action: "confirm_payment" }
```

---

### Error Handling

**Missing Scenarios**:

1. **Concurrent Modification Conflict**:
```typescript
// Two admins update invoice simultaneously
// Last write wins (data loss)
// FIX: Add optimistic locking with version field
ALTER TABLE invoices ADD COLUMN version INTEGER DEFAULT 1;

// API must include version in update:
PATCH /api/v1/invoices/:id
{ version: 5, status: "paid" }

// Reject if version mismatch (409 Conflict)
```

2. **Partial Payment Failure**:
```
POST /api/v1/payments
// Stripe charge succeeds but DB write fails
// Money charged but no payment record!
```

**Required: Idempotent payment creation**:
```typescript
// Use Stripe idempotency key + DB transaction
const idempotencyKey = req.headers['idempotency-key'];
const stripeCharge = await stripe.charges.create({
  amount: amountCents,
  ...
}, { idempotencyKey });

await prisma.$transaction(async (tx) => {
  await tx.payment.create({ ... });
  await recalculateInvoiceBalance(tx, invoiceId);
});
```

3. **Cascade Delete Protection**:
```
DELETE /api/v1/marketplace/providers/:id
// Deletes provider but orphans transactions?
```

**Required: Soft delete**:
```typescript
// Never hard-delete providers with transactions
const txCount = await prisma.transaction.count({
  where: { providerId }
});
if (txCount > 0) {
  throw new Error('Cannot delete provider with existing transactions');
}
// Or use soft delete:
await prisma.provider.update({
  where: { id },
  data: { status: 'deleted', deletedAt: new Date() }
});
```

---

### State Machine Correctness

**Transaction State Machine - Identified Flaw**:

Proposed transitions:
```
pending_invoice → invoiced → paid
                   ↓          ↓
               cancelled   refunded
```

**Problem**: No path from `pending_invoice` to `paid` (direct payment without invoice).

**Fix**:
```
pending_invoice → invoiced → paid
      ↓              ↓          ↓
    paid         cancelled   refunded
      ↓
  disputed
```

**Invoice State Machine - Race Condition**:

```
sent → pending_confirmation → paid
```

**Problem**: Webhook could mark invoice `paid` while provider is confirming manually.

**Fix**: Add mutex:
```typescript
async function markInvoicePaid(invoiceId: number, source: 'webhook' | 'manual') {
  await prisma.$executeRaw`SELECT * FROM invoices WHERE id = ${invoiceId} FOR UPDATE`;

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });

  if (invoice.status === 'paid') {
    return { already_paid: true };  // Idempotent
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: 'paid', paidAt: new Date() }
  });
}
```

---

## 7. Performance and Scalability Analysis

### Query Performance

**N+1 Query Risks Identified**:

1. **Transaction List with Provider Names**:
```typescript
// BAD
const transactions = await prisma.transaction.findMany();
for (const tx of transactions) {
  const provider = await getProviderName(tx.providerId);  // N+1!
}

// GOOD
const transactions = await prisma.transaction.findMany({
  include: { provider: { select: { businessName: true } } }
});
```

2. **Cross-Database Contact Resolution**:
```typescript
// BAD
for (const transaction of transactions) {
  const contact = await getTenantContact(tx.providerTenantId, tx.clientId);  // N+1!
}

// GOOD: Batch fetch
const contactMap = await batchGetTenantContacts(
  transactions.map(tx => ({ tenantId: tx.providerTenantId, userId: tx.clientId }))
);
```

**Pagination Strategy**:
- Proposed: Offset/limit (standard)
- **Problem**: Slow for large offsets (`OFFSET 10000`)
- **Recommendation**: Cursor-based pagination for messages table

```typescript
// Cursor pagination for messages
GET /api/v1/threads/:id/messages?cursor=msg_abc123&limit=50

// Implementation
const messages = await prisma.message.findMany({
  where: {
    threadId,
    id: { lt: cursorId }  // Cursor
  },
  orderBy: { id: 'desc' },
  take: limit
});
```

---

### Scalability Bottlenecks

**Messages Table Growth**:
- Projected: 500K users × 20 messages/user = 10M messages/year
- Growth rate: ~27K messages/day
- Table size: ~5GB/year (with attachments JSON)

**Required: Partitioning**:
```sql
CREATE TABLE messages (
  id BIGINT PRIMARY KEY,
  thread_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE messages_2026 PARTITION OF messages
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE messages_2027 PARTITION OF messages
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

**Transactions Table Growth**:
- Projected: 50K breeders × 100 transactions/year = 5M transactions/year
- Similar partitioning required

**Archival Strategy**:
```sql
-- Archive old messages (>2 years) to cold storage
CREATE TABLE messages_archive (LIKE messages INCLUDING ALL);

-- Monthly job
INSERT INTO messages_archive
SELECT * FROM messages WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM messages WHERE created_at < NOW() - INTERVAL '2 years';
```

---

### Caching Strategy

**What to Cache**:

```typescript
// Provider profiles (rarely change)
CACHE: marketplace_providers (TTL: 10 minutes)
INVALIDATE ON: provider profile update
KEY: `provider:${providerId}`

// Listing search results (change frequently)
CACHE: service_listing_search (TTL: 1 minute)
INVALIDATE ON: listing create/update/delete
KEY: `listings:${category}:${state}:${page}`

// User sessions (high read frequency)
CACHE: user_sessions (TTL: 30 minutes)
INVALIDATE ON: logout, password change
KEY: `session:${sessionId}`

// Invoice data (NEVER CACHE)
REASON: Financial data must always be fresh
```

**Cache Invalidation**:
```typescript
// Example: Provider update invalidates cache
await prisma.provider.update({ where: { id }, data: { businessName } });
await redis.del(`provider:${id}`);
await redis.del(`listings:*`);  // Wildcard delete (listing search includes provider name)
```

---

## 8. Migration Strategy Evaluation

### Phase 1: Tenant DB Updates

**Issues**:

1. **Concurrent Index Creation Missing**:
```sql
-- PROPOSED (LOCKS TABLE)
CREATE INDEX idx_contacts_marketplace_user
  ON contacts(tenant_id, marketplace_user_id)
  WHERE marketplace_user_id IS NOT NULL;

-- PRODUCTION-SAFE (NO LOCK)
CREATE INDEX CONCURRENTLY idx_contacts_marketplace_user
  ON contacts(tenant_id, marketplace_user_id)
  WHERE marketplace_user_id IS NOT NULL;
```

2. **No Rollback Plan**:
- What if migration fails halfway?
- How to revert schema changes?

**Production-Safe Migration**:
```sql
-- Migration: 001_add_marketplace_fields.sql
BEGIN;

-- 1. Add columns with defaults (no rewrite)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketplace_payment_mode VARCHAR(50);
UPDATE tenants SET marketplace_payment_mode = 'manual' WHERE marketplace_payment_mode IS NULL;
ALTER TABLE tenants ALTER COLUMN marketplace_payment_mode SET DEFAULT 'manual';
ALTER TABLE tenants ALTER COLUMN marketplace_payment_mode SET NOT NULL;

-- 2. Add constraint
ALTER TABLE tenants ADD CONSTRAINT chk_marketplace_payment_mode
  CHECK (marketplace_payment_mode IN ('stripe', 'manual', 'disabled'));

COMMIT;

-- 3. Build indexes concurrently (outside transaction)
CREATE INDEX CONCURRENTLY idx_contacts_marketplace_user
  ON contacts(tenant_id, marketplace_user_id)
  WHERE marketplace_user_id IS NOT NULL;
```

---

### Phase 2: Marketplace DB Creation

**Concerns**:

1. **Foreign Key Ordering**:
- Must create parent tables before child tables
- Proposed order is incorrect (MarketplaceTransaction references MarketplaceInvoice which is defined later)

**Correct Order**:
```sql
1. users
2. marketplace_providers (references users)
3. service_listings (references marketplace_providers)
4. marketplace_contacts (references marketplace_providers, users)
5. marketplace_transactions (references marketplace_providers, service_listings, users)
6. marketplace_invoices (references marketplace_transactions, marketplace_providers, users)
7. message_threads (references marketplace_providers, users, marketplace_transactions)
8. messages (references message_threads, users)
```

2. **Seed Data Missing**:
- Need to populate `users` from existing marketplace waitlist
- Need to migrate existing `MarketplaceListing` records

---

### Phase 3: Data Cleanup

**Migration Checklist**:

```sql
-- 1. Backup old marketplace listings
CREATE TABLE marketplace_listings_archive AS
SELECT * FROM marketplace_listings;

-- 2. Migrate active listings to new schema
INSERT INTO marketplace.service_listings (
  provider_id, slug, title, ...
)
SELECT
  mp.id, ml.slug, ml.title, ...
FROM marketplace_listings ml
JOIN marketplace_providers mp ON ml.tenant_id = mp.tenant_id
WHERE ml.status = 'ACTIVE';

-- 3. Verify migration
SELECT COUNT(*) FROM marketplace_listings WHERE status = 'ACTIVE';
SELECT COUNT(*) FROM marketplace.service_listings WHERE status = 'active';
-- Counts should match

-- 4. Drop old table (only if verified)
DROP TABLE marketplace_listings;
```

---

### Zero-Downtime Strategy

**Approach**: **Dual-write with feature flags**

```typescript
// Feature flag system
const USE_NEW_MARKETPLACE_DB = process.env.MARKETPLACE_V2_ENABLED === 'true';

async function createListing(data) {
  if (USE_NEW_MARKETPLACE_DB) {
    // Write to new marketplace DB
    return await marketplacePrisma.serviceListing.create({ data });
  } else {
    // Write to old tenant DB
    return await prisma.marketplaceListing.create({ data });
  }
}

// Migration phases:
// 1. Deploy dual-read code (read from both DBs, merge results)
// 2. Migrate data in background
// 3. Deploy dual-write code (write to both DBs)
// 4. Verify data consistency (compare both DBs)
// 5. Switch reads to new DB only (flip feature flag)
// 6. Stop writes to old DB
// 7. Drop old tables
```

---

## 9. Integration and Webhook Architecture

### Stripe Webhook Handling

**Idempotency Issues**:

Proposed implementation:
```typescript
const processed = await WebhookLog.findOne({
  where: { stripeEventId: event.id }
});
```

**Problem**: Stripe retries failed webhooks with SAME event ID.

**Scenario**:
1. Webhook arrives: `invoice.paid` (event_123)
2. Handler processes, DB transaction fails
3. WebhookLog still created with status='failed'
4. Stripe retries same event (event_123)
5. Handler sees event_123 already exists, returns "already_processed"
6. Stripe stops retrying
7. **Invoice never marked paid!**

**Fix**: Idempotency should only skip on **successful** processing:
```typescript
const processed = await WebhookLog.findOne({
  where: {
    stripeEventId: event.id,
    status: 'success'  // Only skip if previously succeeded
  }
});

if (processed) {
  return { status: 'already_processed' };
}

try {
  await processWebhookEvent(event);
  await WebhookLog.create({
    stripeEventId: event.id,
    status: 'success'
  });
} catch (error) {
  await WebhookLog.create({
    stripeEventId: event.id,
    status: 'failed',
    errorMessage: error.message
  });
  throw error;  // Let Stripe retry
}
```

**Webhook Signature Verification Missing**:
```typescript
// REQUIRED: Verify webhook authenticity
const sig = request.headers['stripe-signature'];
let event;
try {
  event = stripe.webhooks.constructEvent(
    request.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
} catch (err) {
  return reply.code(400).send({ error: 'Invalid signature' });
}
```

**Failed Webhook Recovery**:
```typescript
// Background job to retry failed webhooks
async function retryFailedWebhooks() {
  const failed = await WebhookLog.findMany({
    where: {
      status: 'failed',
      attempts: { lt: 5 },
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }  // Last 24h
    }
  });

  for (const log of failed) {
    try {
      // Fetch event from Stripe API
      const event = await stripe.events.retrieve(log.stripeEventId);
      await processWebhookEvent(event);
      await WebhookLog.update({
        where: { id: log.id },
        data: { status: 'success' }
      });
    } catch (error) {
      await WebhookLog.update({
        where: { id: log.id },
        data: { attempts: log.attempts + 1 }
      });
    }
  }
}
```

---

### Email Integration (Resend)

**Critical Path Concern**:

Proposed code:
```typescript
// Fire and forget email send
sendEmail({ ... }).catch(err => {
  req.log.error({ err }, "Failed to send invoice email");
});
```

**Problem**: If email service is down, **invoices still created but never sent to buyers**.

**Graceful Degradation Strategy**:
```typescript
// 1. Always create invoice first (non-blocking)
const invoice = await prisma.invoice.create({ data });

// 2. Queue email asynchronously (with retry)
await emailQueue.enqueue({
  type: 'invoice_issued',
  invoiceId: invoice.id,
  recipient: contact.email,
  maxRetries: 3
});

// 3. Background worker processes email queue
async function processEmailQueue() {
  const job = await emailQueue.dequeue();
  try {
    await sendEmail(job.data);
    await emailQueue.markComplete(job.id);
  } catch (error) {
    if (job.retries < job.maxRetries) {
      await emailQueue.retry(job.id);
    } else {
      await emailQueue.markFailed(job.id, error);
      // Alert admin
    }
  }
}
```

**Rate Limiting**:
```typescript
// Resend rate limits: 100 emails/second
const rateLimiter = new RateLimiter({
  points: 100,
  duration: 1  // second
});

async function sendEmail(data) {
  await rateLimiter.consume(1);  // Wait if rate limit exceeded
  return await resend.emails.send(data);
}
```

---

### External Service Failures

**Stripe Outage Scenario**:

User tries to create Stripe invoice → Stripe API down → What happens?

**Circuit Breaker Pattern**:
```typescript
const stripeCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,    // Open after 5 failures
  timeout: 30000,         // 30s timeout
  resetTimeout: 60000     // Try again after 60s
});

async function createStripeInvoice(data) {
  try {
    return await stripeCircuitBreaker.fire(async () => {
      return await stripe.invoices.create(data);
    });
  } catch (error) {
    if (stripeCircuitBreaker.isOpen()) {
      // Stripe is down, fallback to manual mode
      req.log.warn('Stripe circuit breaker open, falling back to manual payment mode');
      return await createManualInvoice(data);
    }
    throw error;
  }
}
```

---

## 10. Operational Excellence Requirements

### Monitoring and Observability

**Required Metrics**:

```typescript
// 1. Database query performance
metrics.histogram('db.query.duration', duration, {
  database: 'tenant' | 'marketplace',
  model: 'Invoice' | 'Payment' | 'Transaction',
  operation: 'findMany' | 'create' | 'update'
});

// Alert: p95 query latency > 200ms

// 2. Cross-database query latency
metrics.histogram('db.cross_db.duration', duration, {
  source_db: 'marketplace',
  target_db: 'tenant',
  query_type: 'getInvoice' | 'getContact'
});

// Alert: cross-DB queries > 500ms

// 3. Invoice state transition anomalies
metrics.counter('invoice.state_transition', 1, {
  from: 'sent',
  to: 'paid',
  payment_mode: 'stripe' | 'manual'
});

// Alert: High rate of sent→void transitions (potential fraud)

// 4. Payment webhook failures
metrics.counter('stripe.webhook.result', 1, {
  event_type: 'invoice.paid',
  result: 'success' | 'failure'
});

// Alert: Webhook failure rate > 5%

// 5. Authorization failures
metrics.counter('auth.cross_tenant_blocked', 1, {
  user_id: userId,
  attempted_tenant: tenantId,
  actual_tenant: userTenantId
});

// Alert: Repeated cross-tenant access attempts (security breach)
```

**Required Dashboards**:
1. Marketplace Transaction Health (volume, success rate, avg value)
2. Payment Processing (Stripe vs manual split, failure rates)
3. Invoice State Distribution (draft/sent/pending_confirmation/paid/void)
4. Database Performance (query latency by model, cross-DB overhead)
5. API Error Rates (by endpoint, by status code)

---

### Backup and Recovery

**Requirements**:

- **RPO (Recovery Point Objective)**: 5 minutes (max data loss acceptable)
- **RTO (Recovery Time Objective)**: 15 minutes (max downtime acceptable)

**Strategy**:

1. **Point-in-Time Restore**:
```sql
-- PostgreSQL WAL archiving
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
wal_level = replica

-- Enable PITR on both databases
pg_basebackup -D /backup/base -Ft -z -P
```

2. **Cross-Database Backup Coordination**:
```bash
#!/bin/bash
# Coordinated backup script

# 1. Pause marketplace writes
curl -X POST http://api/admin/maintenance/pause-writes

# 2. Get current LSN from both databases
TENANT_LSN=$(psql -U postgres -d tenant -t -c "SELECT pg_current_wal_lsn()")
MARKETPLACE_LSN=$(psql -U postgres -d marketplace -t -c "SELECT pg_current_wal_lsn()")

# 3. Backup both databases
pg_dump -U postgres -d tenant -F c -f "/backup/tenant_$(date +%Y%m%d_%H%M%S).dump"
pg_dump -U postgres -d marketplace -F c -f "/backup/marketplace_$(date +%Y%m%d_%H%M%S).dump"

# 4. Store LSN coordinates
echo "tenant_lsn=$TENANT_LSN marketplace_lsn=$MARKETPLACE_LSN" > /backup/coordinates_$(date +%Y%m%d_%H%M%S).txt

# 5. Resume writes
curl -X POST http://api/admin/maintenance/resume-writes
```

3. **Disaster Recovery Procedure**:
```
1. Restore tenant DB to latest backup
2. Restore marketplace DB to latest backup
3. Apply WAL logs to restore to consistent point (using saved LSN coordinates)
4. Verify cross-database referential integrity:
   - Check all marketplace_transactions.tenant_invoice_id exist
   - Check all contacts.marketplace_user_id exist
5. Resume application
```

---

### Audit Trail

**Required Logging**:

```sql
-- Audit table for invoice state changes
CREATE TABLE invoice_audit_log (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL,
  invoice_database VARCHAR(20) NOT NULL,  -- 'tenant' or 'marketplace'
  changed_by_user_id VARCHAR(50),
  changed_at TIMESTAMP DEFAULT NOW(),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  payment_mode VARCHAR(50),
  metadata JSONB
);

-- Audit table for payment confirmations
CREATE TABLE payment_confirmation_audit (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL,
  invoice_database VARCHAR(20) NOT NULL,
  marked_paid_by_user_id VARCHAR(50),  -- Buyer who marked paid
  marked_paid_at TIMESTAMP,
  confirmed_by_user_id VARCHAR(50),    -- Provider who confirmed
  confirmed_at TIMESTAMP,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  metadata JSONB
);

-- Audit table for authorization decisions
CREATE TABLE authorization_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  action VARCHAR(50),
  allowed BOOLEAN,
  reason TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Audit table for cross-tenant queries
CREATE TABLE cross_tenant_query_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  source_tenant_id INTEGER,
  target_tenant_id INTEGER,
  query_type VARCHAR(100),
  allowed BOOLEAN,
  reason TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);
```

---

## 11. Alternative Architectural Approaches

### Alternative 1: Single Database with Schema Isolation

**Description**:
Use a single PostgreSQL database with separate schemas for tenant and marketplace data:
```
Database: breederhq
├── Schema: tenant (existing tenant tables)
├── Schema: marketplace (new marketplace tables)
└── Schema: public (shared lookup tables, audit logs)
```

**Differences from Proposed**:
- **Foreign Keys Work**: Can enforce referential integrity across schemas
- **ACID Transactions**: Cross-schema transactions are fully ACID-compliant
- **Simpler Backups**: Single database backup captures entire state
- **Row-Level Security**: PostgreSQL RLS can enforce tenant isolation

**Implementation**:
```sql
-- Create marketplace schema
CREATE SCHEMA marketplace;

-- Move marketplace tables to marketplace schema
CREATE TABLE marketplace.users (...);
CREATE TABLE marketplace.providers (...);
CREATE TABLE marketplace.transactions (...);

-- Enable cross-schema foreign keys
ALTER TABLE marketplace.transactions
  ADD CONSTRAINT fk_provider_tenant
  FOREIGN KEY (provider_tenant_id)
  REFERENCES tenant.tenants(id) ON DELETE RESTRICT;

-- Grant permissions
GRANT USAGE ON SCHEMA marketplace TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA marketplace TO app_user;
```

**Advantages**:
- **Data Integrity**: Foreign keys prevent orphaned records
- **Transactional Consistency**: ACID across all operations
- **Simpler Deployment**: Single database connection string
- **Cost Effective**: One database instance instead of two
- **Query Performance**: No cross-database query overhead

**Disadvantages**:
- **Scaling Limitations**: Cannot scale tenant vs marketplace independently
- **Blast Radius**: Single database outage affects both systems
- **Migration Complexity**: Harder to split into separate DBs later if needed

**Migration Complexity**: **MEDIUM** (schema creation, table moves, FK updates)

**Recommendation**: **ADOPT**

**Reasoning**: For the stated scale (50K breeders, 500K users), a single database is more than sufficient. PostgreSQL can handle 100M+ rows per table with proper indexing. The operational simplicity and data integrity benefits far outweigh the theoretical scaling benefits of separate databases. Only split databases if/when you reach true scale limits (10M+ transactions, dedicated DBA team, need for specialized replication).

---

## 12. Implementation Priorities

### Implementation Roadmap

**Ranked by Priority**:

#### 1. **Critical Schema Fixes** (2 weeks)
- Fix cross-database referential integrity (soft deletes, reference tracking table)
- Simplify dual invoice architecture (single invoice per transaction type)
- Add missing indexes (composite indexes for queries)
- Fix data types (BIGINT for high-volume tables)

**Dependencies**: None
**Testing**: Schema migration rehearsal, cross-DB query tests
**Rollback**: Revert migrations, restore from backup

---

#### 2. **Security Hardening** (2 weeks)
- Implement Row-Level Security (RLS) for Contact.marketplaceUserId
- Add authorization audit logging
- Implement payment mode locking
- Add webhook signature verification

**Dependencies**: Schema fixes complete
**Testing**: Penetration testing, authorization bypass testing
**Rollback**: Disable RLS policies, revert middleware changes

---

#### 3. **API Implementation** (3 weeks)
- Build marketplace invoice endpoints (CRUD)
- Implement payment marking and confirmation workflows
- Add idempotency keys to all write endpoints
- Build cross-database query resolvers

**Dependencies**: Schema and security complete
**Testing**: Integration tests, load tests (1000 req/s), idempotency tests
**Rollback**: Feature flags to disable new endpoints

---

#### 4. **Webhook & Integration** (1 week)
- Implement Stripe webhook handlers (invoice.paid, invoice.payment_failed)
- Add webhook idempotency and retry logic
- Implement email queue with Resend
- Add circuit breakers for external services

**Dependencies**: API implementation complete
**Testing**: Webhook replay tests, failure scenario tests
**Rollback**: Disable webhooks, fallback to polling

---

#### 5. **Monitoring & Observability** (1 week)
- Implement metrics (query latency, state transitions, webhook success)
- Build dashboards (transaction health, payment processing)
- Add audit logging (invoice changes, authorization decisions)
- Set up alerts (webhook failures, authorization anomalies)

**Dependencies**: All core functionality complete
**Testing**: Trigger alerts manually, verify dashboard data
**Rollback**: N/A (monitoring is non-blocking)

---

#### 6. **Migration & Deployment** (2 weeks)
- Implement blue-green deployment with feature flags
- Migrate existing marketplace listings to new schema
- Backfill cross-database reference tables
- Coordinate backup strategy for dual databases

**Dependencies**: All implementation complete, testing passed
**Testing**: Rehearse migration on staging, verify data consistency
**Rollback**: Feature flag to revert to old system, restore from coordinated backup

---

**Total Estimated Timeline**: **11 weeks** (assuming 2 engineers, parallel work where possible)

---

## 13. Specific Schema Changes Required

See separate file: [schema-changes-required.sql](./schema-changes-required.sql)

---

## 14. Specific API Changes Required

See separate file: [api-changes-required.md](./api-changes-required.md)

---

## 15. Final Verdict and Sign-Off

### Production Readiness Decision

**Production Readiness: APPROVED WITH CHANGES**

---

### Required Changes Before Production Deployment

#### Critical (Blocking):
1. Implement cross-database referential integrity strategy (soft deletes, reference tracking)
2. Simplify dual invoice architecture (single invoice per transaction type)
3. Fix payment mode locking race condition
4. Add tenant isolation safeguards for Contact.marketplaceUserId (RLS policies)
5. Normalize JSON columns (images, line items)
6. Fix data types (BIGINT for high-volume tables, currency fields)
7. Add missing composite indexes

#### High Priority (Strong Recommendation):
1. Add webhook idempotency and retry logic
2. Implement optimistic locking for invoice updates
3. Add payment receipt requirement for manual payments
4. Build authorization audit logging
5. Add circuit breakers for external service failures

#### Medium Priority (Recommended):
1. Implement table partitioning for messages table
2. Add monitoring metrics and dashboards
3. Build coordinated backup strategy for dual databases
4. Add cursor-based pagination for high-volume endpoints

---

### Timeline Estimate

**Critical Changes**: 4 weeks (2 engineers, parallel work)
**High Priority**: 2 weeks
**Medium Priority**: 2 weeks

**Total**: **8 weeks to full production readiness**

---

### Final Recommendation

This marketplace database architecture is **fundamentally sound** but requires **significant refinement** before production deployment. The dual-database strategy provides good separation of concerns, but introduces cross-database coordination complexity that must be carefully managed.

**Key Strengths**:
- Clean separation of public marketplace data from private tenant data
- Flexible invoice anchoring supports diverse transaction types
- Payment mode flexibility (Stripe + manual) addresses real-world breeder needs
- Schema supports independent scaling of marketplace vs tenant workloads

**Key Weaknesses**:
- Cross-database referential integrity risks data corruption if not properly managed
- Dual invoice architecture is overengineered and creates synchronization complexity
- Missing critical indexes will cause performance issues at scale
- Security isolation for Contact.marketplaceUserId requires additional safeguards
- Webhook handling lacks proper idempotency and retry logic

**Alternative Recommendation**:
Strongly consider **Single Database with Schema Isolation** (see Section 11, Alternative 1) as a simpler, more robust approach. This eliminates cross-database coordination complexity while maintaining clean separation via PostgreSQL schemas. Only split into separate databases if scale demands it (10M+ transactions/year).

---

### Architect Sign-Off

This architecture has been reviewed for production deployment and is **APPROVED WITH CHANGES**.

The critical changes outlined above must be implemented before production launch. With these changes, the architecture will be production-ready, secure, and scalable to the stated requirements (50K breeders, 500K marketplace users).

---

**Review Completed**: 2026-01-12
**Principal Database Architect**
**Next Steps**:
1. Engineering team to implement critical changes
2. Schedule architecture review meeting to discuss alternative (single DB + schemas)
3. Begin Phase 1 implementation (Critical Schema Fixes)

---

## Appendix: Investigation Summary

### Current System Analysis

Based on reconnaissance of the existing codebase at `C:\Users\Aaron\Documents\Projects\breederhq-api`:

**Existing Database Architecture**:
- Single PostgreSQL database with multi-tenant row-level isolation
- Tenant model does NOT have Stripe fields directly (uses separate BillingAccount model)
- Contact model uses Party pattern for unified entity management
- Invoice model has flexible polymorphic anchoring (scope + multiple FK options)
- Payment model is processor-agnostic (Stripe, Square, manual)
- Existing marketplace infrastructure: MarketplaceListing, MarketplaceUserBlock, BreedingProgram

**Integration Points Identified**:
1. Contact.marketplaceUserId field creates cross-tenant data exposure risk
2. Tenant.stripeConnectAccountId should be added (currently only in BillingAccount)
3. Invoice.isMarketplaceInvoice flag already planned in proposal
4. Existing MarketplaceListing table needs migration to new ServiceListing schema
5. User model uses CUID (string) but marketplace uses INTEGER for user_id (type mismatch)

**Authorization Patterns**:
- JWT-based authentication with User model (global, cross-tenant)
- TenantMembership for tenant-level roles
- UserEntitlement for feature-level access control
- Party model enables fine-grained CRM tracking and marketplace blocklist

**Payment Infrastructure**:
- Stripe integration exists via stripe-service.ts
- Payment creation is idempotent with header-based idempotency keys
- Invoice balance recalculation is transactional
- No webhook idempotency table exists (needs to be added)

---

**End of Review Document**
