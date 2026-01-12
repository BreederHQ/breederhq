# THE MASTER EXECUTION PLAN
**NO MORE PLANNING. JUST DO THIS.**

**Date**: 2026-01-12
**Status**: EXECUTE IMMEDIATELY
**Execution Method**: Run these commands in order

---

## ⚠️ CRITICAL: READ THIS FIRST

**Current State**: Your system has critical issues that WILL cause data loss, money loss, and security breaches in production.

**What Happens If You Don't Fix This**:
- Invoice amounts overflow at $21M (INT not BIGINT)
- Deleted records leave orphans everywhere
- No tenant isolation = data leaks between breeders
- Manual payments have no fraud protection
- Queries will be slow as hell with real traffic

**Stop building new features. Fix the foundation. Then build marketplace.**

---

## PHASE 1: CRITICAL PRODUCTION FIXES (3-4 HOURS)

### Step 1: Create Migration File (5 minutes)

```bash
cd C:\Users\Aaron\Documents\Projects\breederhq-api

# Create migration
npx prisma migrate dev --name critical_production_fixes --create-only
```

This creates a file at:
`prisma/migrations/YYYYMMDDHHMMSS_critical_production_fixes/migration.sql`

---

### Step 2: Open That Migration File and Paste This SQL

Open: `prisma/migrations/[timestamp]_critical_production_fixes/migration.sql`

Delete everything in it and paste this:

```sql
-- ============================================================================
-- CRITICAL PRODUCTION FIXES - EXECUTE IMMEDIATELY
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- FIX #1: Currency Overflow Prevention (INT → BIGINT)
-- ----------------------------------------------------------------------------
-- WHY: INT maxes at $21M. You'll lose money when invoices exceed this.

ALTER TABLE "Invoice" ALTER COLUMN "amountCents" TYPE BIGINT;
ALTER TABLE "Invoice" ALTER COLUMN "balanceCents" TYPE BIGINT;
ALTER TABLE "Invoice" ALTER COLUMN "depositCents" TYPE BIGINT;

ALTER TABLE "Payment" ALTER COLUMN "amountCents" TYPE BIGINT;

-- ----------------------------------------------------------------------------
-- FIX #2: Soft Deletes (Prevent Orphaned Records)
-- ----------------------------------------------------------------------------
-- WHY: Deleting records breaks references. Soft delete instead.

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "Animal" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Invoice_deletedAt_idx"
  ON "Invoice"("deletedAt")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Contact_deletedAt_idx"
  ON "Contact"("deletedAt")
  WHERE "deletedAt" IS NULL;

-- ----------------------------------------------------------------------------
-- FIX #3: Tenant Isolation for Marketplace
-- ----------------------------------------------------------------------------
-- WHY: Without this, one tenant can see another tenant's data via marketplace queries.

-- Drop simple index, add compound unique
DROP INDEX IF EXISTS "Contact_marketplaceUserId_idx";

CREATE UNIQUE INDEX IF NOT EXISTS "Contact_marketplaceUserId_tenantId_key"
  ON "Contact"("marketplaceUserId", "tenantId")
  WHERE "marketplaceUserId" IS NOT NULL;

-- ----------------------------------------------------------------------------
-- FIX #4: Performance Indexes (Prevent Slow Queries)
-- ----------------------------------------------------------------------------
-- WHY: Without these, queries will timeout at scale.

CREATE INDEX IF NOT EXISTS "Invoice_tenantId_status_createdAt_idx"
  ON "Invoice"("tenantId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Invoice_clientPartyId_status_idx"
  ON "Invoice"("clientPartyId", "status")
  WHERE "clientPartyId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Contact_tenantId_deletedAt_idx"
  ON "Contact"("tenantId", "deletedAt")
  WHERE "deletedAt" IS NULL;

-- ----------------------------------------------------------------------------
-- FIX #5: Marketplace Payment Fields (Prepare for Marketplace)
-- ----------------------------------------------------------------------------
-- WHY: Marketplace needs these fields to track payment modes and manual payments.

-- Tenant payment settings
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "marketplacePaymentMode" VARCHAR(50) DEFAULT 'manual';
ALTER TABLE "Tenant" ADD CONSTRAINT IF NOT EXISTS "Tenant_marketplacePaymentMode_check"
  CHECK ("marketplacePaymentMode" IN ('stripe', 'manual', 'disabled'));

ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeConnectAccountId" VARCHAR(255);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeConnectOnboardingComplete" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeConnectPayoutsEnabled" BOOLEAN DEFAULT FALSE;

-- Contact marketplace tracking
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "marketplaceFirstContactedAt" TIMESTAMP;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "marketplaceTotalTransactions" INTEGER DEFAULT 0;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "marketplaceTotalSpentCents" BIGINT DEFAULT 0;

-- Invoice marketplace fields
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "isMarketplaceInvoice" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "marketplaceTransactionId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentModeSnapshot" VARCHAR(50);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "stripeInvoiceId" VARCHAR(255);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" VARCHAR(255);

-- Manual payment tracking
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "buyerMarkedPaidAt" TIMESTAMP;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "buyerPaymentMethod" VARCHAR(50);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "buyerPaymentReference" VARCHAR(255);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "providerConfirmedAt" TIMESTAMP;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "providerConfirmedBy" INTEGER;

-- Partial refunds
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "refundedCents" BIGINT DEFAULT 0;

-- Indexes for marketplace invoices
CREATE INDEX IF NOT EXISTS "Invoice_marketplace_idx"
  ON "Invoice"("tenantId", "isMarketplaceInvoice", "status")
  WHERE "isMarketplaceInvoice" = TRUE;

CREATE INDEX IF NOT EXISTS "Invoice_stripe_idx"
  ON "Invoice"("stripeInvoiceId")
  WHERE "stripeInvoiceId" IS NOT NULL;

COMMIT;
```

Save the file.

---

### Step 3: Apply the Migration

```bash
# Still in breederhq-api directory
npx prisma migrate deploy
```

**This executes the SQL against your database.**

---

### Step 4: Update Prisma Schema

Open: `prisma/schema.prisma`

Find the **Invoice** model and update it:

```prisma
model Invoice {
  id          Int       @id @default(autoincrement())
  tenantId    Int

  // CHANGED: Int → BigInt for currency
  amountCents   BigInt
  balanceCents  BigInt
  depositCents  BigInt?

  // ADDED: Soft delete
  deletedAt     DateTime?

  // ADDED: Marketplace fields
  isMarketplaceInvoice      Boolean   @default(false)
  marketplaceTransactionId  Int?
  paymentModeSnapshot       String?
  stripeInvoiceId           String?
  stripePaymentIntentId     String?

  // ADDED: Manual payment tracking
  buyerMarkedPaidAt         DateTime?
  buyerPaymentMethod        String?
  buyerPaymentReference     String?
  providerConfirmedAt       DateTime?
  providerConfirmedBy       Int?

  // ADDED: Partial refunds
  refundedCents             BigInt    @default(0)

  // ... keep ALL existing fields ...
  invoiceNumber String
  status        String
  clientPartyId Int?
  // ... etc (don't remove anything!)

  // ... keep ALL existing relations ...
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  // ... etc

  // UPDATED: Indexes
  @@index([tenantId, status, createdAt(sort: Desc)])
  @@index([clientPartyId, status])
  @@index([deletedAt])
  @@index([tenantId, isMarketplaceInvoice, status])
  @@index([stripeInvoiceId])
}
```

Find the **Contact** model and update it:

```prisma
model Contact {
  id                              Int       @id @default(autoincrement())
  tenantId                        Int

  // ADDED: Soft delete
  deletedAt                       DateTime?

  // ADDED: Marketplace tracking
  marketplaceFirstContactedAt     DateTime?
  marketplaceTotalTransactions    Int       @default(0)
  marketplaceTotalSpentCents      BigInt    @default(0)

  // ... keep ALL existing fields ...
  name          String
  email         String?
  marketplaceUserId Int?
  // ... etc

  // ... keep ALL existing relations ...
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  // ... etc

  // UPDATED: Indexes with compound unique
  @@unique([marketplaceUserId, tenantId], name: "marketplaceUserId_tenantId_unique")
  @@index([deletedAt])
  @@index([tenantId, deletedAt])
}
```

Find the **Payment** model and update it:

```prisma
model Payment {
  id          Int       @id @default(autoincrement())

  // CHANGED: Int → BigInt
  amountCents BigInt

  // ... keep ALL existing fields ...

  // ... keep ALL existing relations ...

  // ADDED: Index
  @@index([invoiceId, status])
}
```

Find the **Tenant** model and update it:

```prisma
model Tenant {
  id    Int    @id @default(autoincrement())
  name  String

  // ADDED: Marketplace payment settings
  marketplacePaymentMode            String    @default("manual")
  stripeConnectAccountId            String?   @unique
  stripeConnectOnboardingComplete   Boolean   @default(false)
  stripeConnectPayoutsEnabled       Boolean   @default(false)

  // ... keep ALL existing fields ...

  // ... keep ALL existing relations ...
}
```

**IMPORTANT**: Only ADD these fields. Don't remove anything existing!

---

### Step 5: Regenerate Prisma Client

```bash
npx prisma generate
```

---

### Step 6: Create Query Helper Utility

Create file: `src/utils/query-helpers.ts`

```typescript
/**
 * Query helper utilities for soft deletes and common filters
 */

/**
 * Filters out soft-deleted records
 * Use this everywhere you query Invoice, Contact, or Animal
 *
 * @example
 * const invoices = await prisma.invoice.findMany({
 *   where: activeOnly({ tenantId, status: 'paid' })
 * });
 */
export function activeOnly<T extends Record<string, any>>(where: T = {} as T) {
  return { ...where, deletedAt: null };
}

/**
 * Soft delete a record (sets deletedAt timestamp)
 *
 * @example
 * await prisma.invoice.update({
 *   where: { id },
 *   data: softDelete()
 * });
 */
export function softDelete() {
  return { deletedAt: new Date() };
}

/**
 * Restore a soft-deleted record
 *
 * @example
 * await prisma.invoice.update({
 *   where: { id },
 *   data: restore()
 * });
 */
export function restore() {
  return { deletedAt: null };
}
```

---

### Step 7: Update Your Invoice/Contact Queries

**Find all queries in your codebase**:

```bash
# Search for invoice queries
grep -r "prisma.invoice.find" src/

# Search for contact queries
grep -r "prisma.contact.find" src/
```

**Update EVERY query to use `activeOnly()`**:

**BEFORE (BAD)**:
```typescript
const invoices = await prisma.invoice.findMany({
  where: { tenantId }
});
```

**AFTER (GOOD)**:
```typescript
import { activeOnly } from '@/utils/query-helpers';

const invoices = await prisma.invoice.findMany({
  where: activeOnly({ tenantId })
});
```

**More examples**:
```typescript
// Find one
const invoice = await prisma.invoice.findUnique({
  where: activeOnly({ id })
});

// Find with filters
const paidInvoices = await prisma.invoice.findMany({
  where: activeOnly({ tenantId, status: 'paid' })
});

// Count
const count = await prisma.invoice.count({
  where: activeOnly({ tenantId })
});

// Update (when deleting)
import { softDelete } from '@/utils/query-helpers';

await prisma.invoice.update({
  where: { id },
  data: softDelete()
});
```

**CRITICAL**: Do this for:
- All `prisma.invoice.*` queries
- All `prisma.contact.*` queries
- All `prisma.animal.*` queries (if you added deletedAt)

This will take 1-2 hours depending on how many queries you have.

---

### Step 8: Test Your Changes

```bash
# Build to catch TypeScript errors
npm run build

# If you have tests, run them
npm test

# Start dev server
npm run dev
```

**Manual testing checklist**:
- [ ] Create an invoice → verify it works
- [ ] List invoices → verify soft-deleted ones don't appear
- [ ] Delete an invoice → verify it sets deletedAt instead of hard deleting
- [ ] Check database → verify amountCents is BIGINT
- [ ] Create a contact → verify marketplace fields exist

---

### Step 9: Commit and Deploy

```bash
git add .
git commit -m "fix: apply critical production fixes (BigInt, soft deletes, tenant isolation, marketplace prep)"
git push
```

Then deploy to your hosting provider (Vercel/Railway/etc).

---

## ✅ PHASE 1 COMPLETE

**What you just fixed**:
- ✅ Currency overflow (INT → BIGINT)
- ✅ Orphaned records (soft deletes)
- ✅ Tenant isolation (compound unique index)
- ✅ Slow queries (performance indexes)
- ✅ Marketplace foundation (payment mode fields)

**Time to execute**: 3-4 hours (mostly updating queries)

**YOU CAN NOW SAFELY BUILD MARKETPLACE**

---

## PHASE 2: MARKETPLACE SCHEMA (1-2 DAYS)

### Step 1: Create Marketplace Schema Migration

```bash
cd C:\Users\Aaron\Documents\Projects\breederhq-api

npx prisma migrate dev --name create_marketplace_schema --create-only
```

Open: `prisma/migrations/[timestamp]_create_marketplace_schema/migration.sql`

Paste this:

```sql
-- ============================================================================
-- MARKETPLACE SCHEMA CREATION
-- ============================================================================

BEGIN;

-- Create marketplace schema (logical separation from tenant data)
CREATE SCHEMA IF NOT EXISTS marketplace;

-- ============================================================================
-- TABLE: marketplace.users (Marketplace Accounts)
-- ============================================================================

CREATE TABLE marketplace.users (
  id SERIAL PRIMARY KEY,

  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),

  -- User type
  user_type VARCHAR(50) DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'breeder', 'service_provider')),

  -- Link to tenant (if breeder)
  tenant_id INTEGER,
  tenant_verified BOOLEAN DEFAULT FALSE,

  -- Stripe
  stripe_customer_id VARCHAR(255) UNIQUE,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_users_email ON marketplace.users(email);
CREATE INDEX idx_marketplace_users_tenant ON marketplace.users(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_marketplace_users_stripe ON marketplace.users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ============================================================================
-- TABLE: marketplace.providers (Service Provider Profiles)
-- ============================================================================

CREATE TABLE marketplace.providers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE CASCADE,

  -- Provider type
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('breeder', 'service_provider')),

  -- Tenant link (if breeder)
  tenant_id INTEGER,

  -- Business info
  business_name VARCHAR(255) NOT NULL,
  business_description TEXT,
  city VARCHAR(100),
  state VARCHAR(100),

  -- Stripe Connect
  stripe_connect_account_id VARCHAR(255) UNIQUE,
  stripe_connect_onboarding_complete BOOLEAN DEFAULT FALSE,
  stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE,

  -- Payment mode
  payment_mode VARCHAR(50) DEFAULT 'manual' CHECK (payment_mode IN ('stripe', 'manual', 'direct')),
  payment_instructions TEXT,

  -- Stats
  total_listings INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended')),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_marketplace_providers_user ON marketplace.providers(user_id);
CREATE INDEX idx_marketplace_providers_tenant ON marketplace.providers(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_marketplace_providers_stripe ON marketplace.providers(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;

-- ============================================================================
-- TABLE: marketplace.service_listings (Service Listings)
-- ============================================================================

CREATE TABLE marketplace.service_listings (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE CASCADE,

  -- Basic info
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,

  -- Pricing
  price_cents BIGINT,
  price_type VARCHAR(50) CHECK (price_type IN ('fixed', 'starting_at', 'hourly', 'daily', 'contact')),

  -- Location
  city VARCHAR(100),
  state VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),

  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_listings_provider ON marketplace.service_listings(provider_id);
CREATE INDEX idx_marketplace_listings_category ON marketplace.service_listings(category, status) WHERE status = 'active';
CREATE INDEX idx_marketplace_listings_location ON marketplace.service_listings(state, city, status) WHERE status = 'active';

-- ============================================================================
-- TABLE: marketplace.transactions (Marketplace Transactions)
-- ============================================================================

CREATE TABLE marketplace.transactions (
  id BIGSERIAL PRIMARY KEY,

  -- Parties
  client_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE RESTRICT,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE RESTRICT,

  -- Listing
  listing_id INTEGER REFERENCES marketplace.service_listings(id) ON DELETE SET NULL,
  service_description TEXT NOT NULL,

  -- Invoice reference (SINGLE invoice approach)
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('tenant', 'marketplace')),
  tenant_id INTEGER, -- NULL if invoice_type = 'marketplace'
  invoice_id INTEGER NOT NULL, -- ID in tenant Invoice OR marketplace.invoices

  -- Amounts
  total_cents BIGINT NOT NULL,
  platform_fee_cents BIGINT DEFAULT 0,
  provider_payout_cents BIGINT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending_invoice' CHECK (status IN (
    'pending_invoice', 'invoiced', 'paid', 'completed', 'cancelled', 'refunded', 'disputed'
  )),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  invoiced_at TIMESTAMP,
  paid_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_marketplace_transactions_client ON marketplace.transactions(client_id, status, created_at DESC);
CREATE INDEX idx_marketplace_transactions_provider ON marketplace.transactions(provider_id, status, created_at DESC);
CREATE INDEX idx_marketplace_transactions_listing ON marketplace.transactions(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX idx_marketplace_transactions_invoice ON marketplace.transactions(invoice_type, tenant_id, invoice_id);

-- ============================================================================
-- TABLE: marketplace.invoices (Service Provider Invoices Only)
-- ============================================================================

CREATE TABLE marketplace.invoices (
  id SERIAL PRIMARY KEY,

  transaction_id BIGINT NOT NULL REFERENCES marketplace.transactions(id) ON DELETE RESTRICT,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE RESTRICT,
  client_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE RESTRICT,

  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  total_cents BIGINT NOT NULL,
  balance_cents BIGINT NOT NULL,
  refunded_cents BIGINT DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'pending_confirmation', 'paid', 'void', 'refunded'
  )),

  -- Payment mode (locked at creation)
  payment_mode VARCHAR(50) NOT NULL CHECK (payment_mode IN ('stripe', 'manual')),
  payment_mode_locked_at TIMESTAMP DEFAULT NOW(),

  -- Stripe
  stripe_invoice_id VARCHAR(50) UNIQUE,
  stripe_payment_intent_id VARCHAR(50),

  -- Manual payment tracking
  buyer_marked_paid_at TIMESTAMP,
  buyer_payment_method VARCHAR(50),
  buyer_payment_reference VARCHAR(255),
  provider_confirmed_at TIMESTAMP,
  provider_confirmed_by INTEGER REFERENCES marketplace.users(id),

  -- Timestamps
  issued_at TIMESTAMP,
  due_at TIMESTAMP,
  paid_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_invoices_transaction ON marketplace.invoices(transaction_id);
CREATE INDEX idx_marketplace_invoices_provider ON marketplace.invoices(provider_id, status, created_at DESC);
CREATE INDEX idx_marketplace_invoices_client ON marketplace.invoices(client_id, status, created_at DESC);
CREATE INDEX idx_marketplace_invoices_stripe ON marketplace.invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- ============================================================================
-- TABLE: marketplace.message_threads (Messaging)
-- ============================================================================

CREATE TABLE marketplace.message_threads (
  id SERIAL PRIMARY KEY,

  client_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES marketplace.service_listings(id) ON DELETE SET NULL,
  transaction_id BIGINT REFERENCES marketplace.transactions(id) ON DELETE SET NULL,

  subject VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),

  last_message_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_threads_client ON marketplace.message_threads(client_id, last_message_at DESC);
CREATE INDEX idx_marketplace_threads_provider ON marketplace.message_threads(provider_id, last_message_at DESC);

-- ============================================================================
-- TABLE: marketplace.messages (Individual Messages)
-- ============================================================================

CREATE TABLE marketplace.messages (
  id BIGSERIAL PRIMARY KEY,

  thread_id INTEGER NOT NULL REFERENCES marketplace.message_threads(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE CASCADE,

  message_text TEXT NOT NULL,
  read_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_messages_thread ON marketplace.messages(thread_id, created_at DESC);

COMMIT;
```

Apply it:

```bash
npx prisma migrate deploy
```

---

### Step 2: Add Marketplace Models to Prisma Schema

Add to the END of `prisma/schema.prisma`:

```prisma
// ============================================================================
// MARKETPLACE MODELS (in marketplace schema)
// ============================================================================

model MarketplaceUser {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  emailVerified    Boolean   @default(false) @map("email_verified")
  passwordHash     String    @map("password_hash")

  firstName        String?   @map("first_name")
  lastName         String?   @map("last_name")
  phone            String?

  userType         String    @default("buyer") @map("user_type")

  tenantId         Int?      @map("tenant_id")
  tenantVerified   Boolean   @default(false) @map("tenant_verified")

  stripeCustomerId String?   @unique @map("stripe_customer_id")
  status           String    @default("active")

  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  // Relations
  provider         MarketplaceProvider?
  sentMessages     MarketplaceMessage[]
  clientThreads    MarketplaceMessageThread[] @relation("ClientThreads")
  clientTransactions MarketplaceTransaction[] @relation("ClientTransactions")
  clientInvoices   MarketplaceInvoice[] @relation("ClientInvoices")

  @@index([email])
  @@index([tenantId])
  @@index([stripeCustomerId])
  @@map("users")
  @@schema("marketplace")
}

model MarketplaceProvider {
  id                              Int       @id @default(autoincrement())
  userId                          Int       @unique @map("user_id")
  user                            MarketplaceUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  providerType                    String    @map("provider_type")
  tenantId                        Int?      @map("tenant_id")

  businessName                    String    @map("business_name")
  businessDescription             String?   @map("business_description")
  city                            String?
  state                           String?

  stripeConnectAccountId          String?   @unique @map("stripe_connect_account_id")
  stripeConnectOnboardingComplete Boolean   @default(false) @map("stripe_connect_onboarding_complete")
  stripeConnectPayoutsEnabled     Boolean   @default(false) @map("stripe_connect_payouts_enabled")

  paymentMode                     String    @default("manual") @map("payment_mode")
  paymentInstructions             String?   @map("payment_instructions")

  totalListings                   Int       @default(0) @map("total_listings")
  totalTransactions               Int       @default(0) @map("total_transactions")
  totalRevenueCents               BigInt    @default(0) @map("total_revenue_cents")
  averageRating                   Decimal   @default(0.00) @map("average_rating") @db.Decimal(3,2)

  status                          String    @default("active")

  createdAt                       DateTime  @default(now()) @map("created_at")
  updatedAt                       DateTime  @updatedAt @map("updated_at")

  // Relations
  listings                        MarketplaceServiceListing[]
  providerThreads                 MarketplaceMessageThread[] @relation("ProviderThreads")
  providerTransactions            MarketplaceTransaction[] @relation("ProviderTransactions")
  providerInvoices                MarketplaceInvoice[] @relation("ProviderInvoices")

  @@index([userId])
  @@index([tenantId])
  @@index([stripeConnectAccountId])
  @@map("providers")
  @@schema("marketplace")
}

model MarketplaceServiceListing {
  id           Int       @id @default(autoincrement())
  providerId   Int       @map("provider_id")
  provider     MarketplaceProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  slug         String    @unique
  title        String
  description  String?
  category     String

  priceCents   BigInt?   @map("price_cents")
  priceType    String?   @map("price_type")

  city         String?
  state        String?

  status       String    @default("draft")

  publishedAt  DateTime? @map("published_at")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  // Relations
  transactions MarketplaceTransaction[]
  threads      MarketplaceMessageThread[]

  @@index([providerId])
  @@index([category, status])
  @@index([state, city, status])
  @@map("service_listings")
  @@schema("marketplace")
}

model MarketplaceTransaction {
  id                   BigInt    @id @default(autoincrement())

  clientId             Int       @map("client_id")
  client               MarketplaceUser @relation("ClientTransactions", fields: [clientId], references: [id], onDelete: Restrict)

  providerId           Int       @map("provider_id")
  provider             MarketplaceProvider @relation("ProviderTransactions", fields: [providerId], references: [id], onDelete: Restrict)

  listingId            Int?      @map("listing_id")
  listing              MarketplaceServiceListing? @relation(fields: [listingId], references: [id], onDelete: SetNull)

  serviceDescription   String    @map("service_description")

  invoiceType          String    @map("invoice_type")
  tenantId             Int?      @map("tenant_id")
  invoiceId            Int       @map("invoice_id")

  totalCents           BigInt    @map("total_cents")
  platformFeeCents     BigInt    @default(0) @map("platform_fee_cents")
  providerPayoutCents  BigInt?   @map("provider_payout_cents")

  status               String    @default("pending_invoice")

  createdAt            DateTime  @default(now()) @map("created_at")
  invoicedAt           DateTime? @map("invoiced_at")
  paidAt               DateTime? @map("paid_at")
  completedAt          DateTime? @map("completed_at")

  // Relations
  marketplaceInvoice   MarketplaceInvoice?
  threads              MarketplaceMessageThread[]

  @@index([clientId, status, createdAt(sort: Desc)])
  @@index([providerId, status, createdAt(sort: Desc)])
  @@index([listingId])
  @@index([invoiceType, tenantId, invoiceId])
  @@map("transactions")
  @@schema("marketplace")
}

model MarketplaceInvoice {
  id                     Int       @id @default(autoincrement())

  transactionId          BigInt    @unique @map("transaction_id")
  transaction            MarketplaceTransaction @relation(fields: [transactionId], references: [id], onDelete: Restrict)

  providerId             Int       @map("provider_id")
  provider               MarketplaceProvider @relation("ProviderInvoices", fields: [providerId], references: [id], onDelete: Restrict)

  clientId               Int       @map("client_id")
  client                 MarketplaceUser @relation("ClientInvoices", fields: [clientId], references: [id], onDelete: Restrict)

  invoiceNumber          String    @unique @map("invoice_number")
  totalCents             BigInt    @map("total_cents")
  balanceCents           BigInt    @map("balance_cents")
  refundedCents          BigInt    @default(0) @map("refunded_cents")

  status                 String    @default("draft")

  paymentMode            String    @map("payment_mode")
  paymentModeLockedAt    DateTime  @default(now()) @map("payment_mode_locked_at")

  stripeInvoiceId        String?   @unique @map("stripe_invoice_id")
  stripePaymentIntentId  String?   @map("stripe_payment_intent_id")

  buyerMarkedPaidAt      DateTime? @map("buyer_marked_paid_at")
  buyerPaymentMethod     String?   @map("buyer_payment_method")
  buyerPaymentReference  String?   @map("buyer_payment_reference")
  providerConfirmedAt    DateTime? @map("provider_confirmed_at")
  providerConfirmedById  Int?      @map("provider_confirmed_by")

  issuedAt               DateTime? @map("issued_at")
  dueAt                  DateTime? @map("due_at")
  paidAt                 DateTime? @map("paid_at")

  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt @map("updated_at")

  @@index([transactionId])
  @@index([providerId, status, createdAt(sort: Desc)])
  @@index([clientId, status, createdAt(sort: Desc)])
  @@index([stripeInvoiceId])
  @@map("invoices")
  @@schema("marketplace")
}

model MarketplaceMessageThread {
  id              Int       @id @default(autoincrement())

  clientId        Int       @map("client_id")
  client          MarketplaceUser @relation("ClientThreads", fields: [clientId], references: [id], onDelete: Cascade)

  providerId      Int       @map("provider_id")
  provider        MarketplaceProvider @relation("ProviderThreads", fields: [providerId], references: [id], onDelete: Cascade)

  listingId       Int?      @map("listing_id")
  listing         MarketplaceServiceListing? @relation(fields: [listingId], references: [id], onDelete: SetNull)

  transactionId   BigInt?   @map("transaction_id")
  transaction     MarketplaceTransaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  subject         String?
  status          String    @default("active")

  lastMessageAt   DateTime  @default(now()) @map("last_message_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  // Relations
  messages        MarketplaceMessage[]

  @@index([clientId, lastMessageAt(sort: Desc)])
  @@index([providerId, lastMessageAt(sort: Desc)])
  @@map("message_threads")
  @@schema("marketplace")
}

model MarketplaceMessage {
  id           BigInt    @id @default(autoincrement())

  threadId     Int       @map("thread_id")
  thread       MarketplaceMessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)

  senderId     Int       @map("sender_id")
  sender       MarketplaceUser @relation(fields: [senderId], references: [id], onDelete: Cascade)

  messageText  String    @map("message_text")
  readAt       DateTime? @map("read_at")

  createdAt    DateTime  @default(now()) @map("created_at")

  @@index([threadId, createdAt(sort: Desc)])
  @@map("messages")
  @@schema("marketplace")
}
```

Regenerate:

```bash
npx prisma generate
```

---

## ✅ PHASE 2 COMPLETE

**What you just built**:
- ✅ Marketplace schema (logical separation)
- ✅ MarketplaceUser, Provider, Listing tables
- ✅ Transaction & Invoice tables
- ✅ Messaging system
- ✅ All foreign keys and indexes

**Time to execute**: 1-2 hours

**Status**: Ready to build APIs

---

## PHASE 3: BUILD MARKETPLACE APIs (2-4 WEEKS)

This is where you actually code the business logic. The foundation is ready.

### Core API Routes to Build

Create these files in your API:

```
src/routes/marketplace/
├── auth.ts           # POST /api/v1/marketplace/auth/register|login
├── providers.ts      # CRUD for providers
├── listings.ts       # CRUD for service listings
├── transactions.ts   # Create and manage transactions
├── invoices.ts       # Create and manage invoices
└── messages.ts       # Messaging between clients and providers
```

### Example: Create Provider Endpoint

Create `src/routes/marketplace/providers.ts`:

```typescript
import { Router } from 'express';
import { prisma } from '@/lib/prisma';
import { authenticate } from '@/middleware/auth';

const router = Router();

// POST /api/v1/marketplace/providers
router.post('/', authenticate, async (req, res) => {
  const userId = req.user.id; // from auth middleware

  const {
    providerType,
    tenantId,
    businessName,
    businessDescription,
    city,
    state,
    paymentMode,
    paymentInstructions
  } = req.body;

  try {
    // Check if user already has a provider profile
    const existing = await prisma.marketplaceProvider.findUnique({
      where: { userId }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Provider profile already exists'
      });
    }

    // Create provider
    const provider = await prisma.marketplaceProvider.create({
      data: {
        userId,
        providerType,
        tenantId,
        businessName,
        businessDescription,
        city,
        state,
        paymentMode: paymentMode || 'manual',
        paymentInstructions,
        status: 'active'
      }
    });

    return res.status(201).json({ provider });

  } catch (error) {
    console.error('Create provider error:', error);
    return res.status(500).json({
      error: 'Failed to create provider profile'
    });
  }
});

// GET /api/v1/marketplace/providers/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const provider = await prisma.marketplaceProvider.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        listings: {
          where: { status: 'active' },
          take: 10
        }
      }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    return res.json({ provider });

  } catch (error) {
    console.error('Get provider error:', error);
    return res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

export default router;
```

### Repeat this pattern for all endpoints

You'll need to build ~15-20 endpoints total. Each follows a similar pattern:
1. Validate input
2. Check authorization
3. Query/mutate database
4. Return response

This is standard CRUD work that will take 2-4 weeks depending on your velocity.

---

## TIMELINE SUMMARY

| Phase | Tasks | Execution Time |
|-------|-------|---------------|
| **Phase 1** | Critical fixes, schema updates, query refactoring | 3-4 hours |
| **Phase 2** | Marketplace schema, Prisma models | 1-2 hours |
| **Phase 3** | Build 15-20 API endpoints, business logic | 2-4 weeks |
| **Testing** | Integration tests, manual testing | 1 week |
| **Deploy** | Production deployment, monitoring | 1-2 days |

**Total to marketplace launch**: 4-6 weeks

---

## WHAT YOU HAVE NOW

After Phase 1 + Phase 2 (3-5 hours of work):

✅ **Production-ready foundation**:
- Currency overflow fixed (BIGINT)
- Soft deletes implemented
- Tenant isolation secured
- Performance indexes added
- Marketplace schema created
- All models defined in Prisma

✅ **Ready to build**:
- Backend foundation solid
- Database ready
- Can start building API endpoints
- Can build frontend in parallel

---

## NEXT STEPS

1. **Execute Phase 1 today** (3-4 hours)
2. **Execute Phase 2 tomorrow** (1-2 hours)
3. **Start building APIs** (next 2-4 weeks)

**You're now in pure execution mode. The planning is done.**
