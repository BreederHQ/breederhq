# BreederHQ Marketplace: Single Database Implementation Plan

**Decision Date**: 2026-01-12
**Architecture**: Single PostgreSQL Database with Schema Isolation
**Status**: Production Implementation Plan
**Estimated Timeline**: 6 weeks to production readiness

---

## Executive Summary

This document provides the complete implementation plan for deploying BreederHQ Marketplace functionality using a **single PostgreSQL database with schema-level isolation** instead of separate databases.

### Decision Rationale

**Single database with schemas is SUPERIOR to dual-database approach because:**

1. **Data Integrity**: Foreign keys enforce referential integrity (no orphaned records)
2. **Transactional Consistency**: Full ACID compliance across all operations
3. **Operational Simplicity**: One backup, one connection, one deployment
4. **Performance**: No cross-database query overhead
5. **Cost Efficiency**: Single database instance
6. **Sufficient Scale**: PostgreSQL handles 100M+ rows per table with proper indexing

**Scale Validation**:
- Current: ~5K tenants, ~50K contacts
- Target: 50K breeders, 500K marketplace users, 5M transactions/year
- PostgreSQL capacity: Easily handles 10x this scale with proper indexing

**When to Reconsider**: Only split databases if you reach:
- 10M+ transactions/year
- Need for specialized replication strategies
- Dedicated DBA team managing separate workloads
- Geographic distribution requiring separate data centers

---

## Table of Contents

1. [Database Architecture](#1-database-architecture)
2. [Schema Design](#2-schema-design)
3. [Critical Implementation Requirements](#3-critical-implementation-requirements)
4. [Security & Isolation](#4-security--isolation)
5. [Performance Optimization](#5-performance-optimization)
6. [Migration Strategy](#6-migration-strategy)
7. [API Implementation](#7-api-implementation)
8. [Testing & Validation](#8-testing--validation)
9. [Monitoring & Operations](#9-monitoring--operations)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Database Architecture

### 1.1 Schema Organization

```sql
-- Single PostgreSQL database: breederhq
-- Three logical schemas for separation of concerns

-- Schema 1: TENANT (existing - private tenant data)
-- Contains: tenants, contacts, invoices, payments, animals, breeding_plans, etc.
CREATE SCHEMA IF NOT EXISTS tenant;

-- Schema 2: MARKETPLACE (new - public marketplace data)
-- Contains: marketplace_users, marketplace_providers, service_listings, transactions, messages
CREATE SCHEMA IF NOT EXISTS marketplace;

-- Schema 3: PUBLIC (shared - cross-cutting concerns)
-- Contains: audit logs, webhook events, cross-reference tracking
-- (PUBLIC schema already exists by default)
```

### 1.2 Schema Access Patterns

| Schema | Access Pattern | Isolation Level |
|--------|---------------|-----------------|
| `tenant.*` | Row-level by tenantId | Per-tenant isolation via RLS |
| `marketplace.*` | Public read, authenticated write | User-level permissions |
| `public.*` | Shared audit/logging | Append-only, global visibility |

### 1.3 Cross-Schema Relationships

**Foreign keys work across schemas** (major advantage over dual DB):

```sql
-- Marketplace transaction references tenant invoice
ALTER TABLE marketplace.transactions
  ADD CONSTRAINT fk_tenant_invoice
  FOREIGN KEY (tenant_id, tenant_invoice_id)
  REFERENCES tenant.invoices(tenant_id, id)
  ON DELETE RESTRICT;

-- Marketplace provider references tenant
ALTER TABLE marketplace.providers
  ADD CONSTRAINT fk_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES tenant.tenants(id)
  ON DELETE RESTRICT;

-- Contact references marketplace user
ALTER TABLE tenant.contacts
  ADD CONSTRAINT fk_marketplace_user
  FOREIGN KEY (marketplace_user_id)
  REFERENCES marketplace.users(id)
  ON DELETE SET NULL;
```

**Benefit**: Database enforces referential integrity - no orphaned records possible!

---

## 2. Schema Design

### 2.1 Marketplace Schema Tables

#### Table: `marketplace.users`

**Purpose**: Global marketplace users (buyers, service providers, breeders)

```sql
CREATE TABLE marketplace.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(200),
  avatar_url VARCHAR(500),

  -- User type determines capabilities
  user_type VARCHAR(50) DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'breeder', 'service_provider', 'both')),

  -- Link to tenant if user is a breeder
  tenant_id INTEGER REFERENCES tenant.tenants(id) ON DELETE SET NULL,
  tenant_verified BOOLEAN DEFAULT FALSE,

  -- Stripe customer for marketplace purchases
  stripe_customer_id VARCHAR(255) UNIQUE,

  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),

  -- Notification preferences
  notification_email BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,

  -- Security tracking
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON marketplace.users(email);
CREATE INDEX idx_users_tenant ON marketplace.users(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_users_stripe ON marketplace.users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_type_status ON marketplace.users(user_type, status);
```

---

#### Table: `marketplace.providers`

**Purpose**: Marketplace service providers (breeders OR non-breeder service providers)

```sql
CREATE TABLE marketplace.providers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE CASCADE,

  -- For breeders: link to their tenant (enables tenant invoice usage)
  tenant_id INTEGER REFERENCES tenant.tenants(id) ON DELETE SET NULL,
  is_breeder BOOLEAN DEFAULT FALSE,

  -- Business info
  business_name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  business_type VARCHAR(100), -- 'individual', 'llc', 'corporation'

  -- Contact
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(500),

  -- Location
  street_address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  postal_code VARCHAR(20),
  country VARCHAR(2) DEFAULT 'US',

  -- Marketplace profile
  bio TEXT,
  specialties TEXT[], -- Array of specialties
  years_experience INTEGER,

  -- Stripe Connect (for payouts)
  stripe_connect_account_id VARCHAR(255) UNIQUE,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,

  -- Payment preference (breeders can choose)
  payment_mode VARCHAR(50) DEFAULT 'stripe' CHECK (payment_mode IN ('stripe', 'manual', 'direct')),
  -- 'stripe': Use Stripe invoicing (tracked)
  -- 'manual': Use manual payment with buyer marking + provider confirmation
  -- 'direct': Direct billing outside system (not tracked)

  -- Stats (denormalized for performance)
  total_listings INTEGER DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended', 'banned')),
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_providers_user ON marketplace.providers(user_id);
CREATE INDEX idx_providers_tenant ON marketplace.providers(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_providers_slug ON marketplace.providers(slug);
CREATE INDEX idx_providers_status ON marketplace.providers(status) WHERE status = 'active';
CREATE INDEX idx_providers_location ON marketplace.providers(state, city) WHERE status = 'active';
```

---

#### Table: `marketplace.service_listings`

**Purpose**: Public service listings (training, vet, grooming, etc.)

```sql
CREATE TABLE marketplace.service_listings (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE CASCADE,

  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Service type
  category VARCHAR(100) NOT NULL CHECK (category IN (
    'training', 'veterinary', 'grooming', 'boarding',
    'photography', 'transport', 'breeding', 'other'
  )),

  -- Animal categories this service supports
  animal_categories TEXT[], -- ['dog', 'cat', 'horse']

  -- Pricing
  price_cents INTEGER,
  price_type VARCHAR(50) CHECK (price_type IN ('fixed', 'starting_at', 'hourly', 'daily', 'contact')),

  -- Location (denormalized from provider for search performance)
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(2) DEFAULT 'US',
  serves_remote BOOLEAN DEFAULT FALSE,
  service_radius_miles INTEGER, -- NULL = in-person only at location

  -- Media
  primary_image_url VARCHAR(500),
  -- Additional images in separate table (normalized)

  -- Availability
  available_days TEXT[], -- ['monday', 'tuesday', 'wednesday']
  booking_lead_time_days INTEGER DEFAULT 7,

  -- SEO
  meta_description TEXT,
  meta_keywords TEXT[],

  -- Stats
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'archived')),

  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listings_provider ON marketplace.service_listings(provider_id);
CREATE INDEX idx_listings_category_status ON marketplace.service_listings(category, status) WHERE status = 'active';
CREATE INDEX idx_listings_location ON marketplace.service_listings(state, city, status) WHERE status = 'active';
CREATE INDEX idx_listings_slug ON marketplace.service_listings(slug);
CREATE INDEX idx_listings_published ON marketplace.service_listings(published_at DESC) WHERE status = 'active';

-- Full-text search on title + description
CREATE INDEX idx_listings_search ON marketplace.service_listings
  USING GIN (to_tsvector('english', title || ' ' || description));
```

---

#### Table: `marketplace.service_listing_images`

**Purpose**: Images for service listings (normalized, not JSON)

```sql
CREATE TABLE marketplace.service_listing_images (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES marketplace.service_listings(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listing_images_listing ON marketplace.service_listing_images(listing_id, sort_order);
```

---

#### Table: `marketplace.transactions`

**Purpose**: Marketplace transactions (links buyers, providers, listings, invoices)

```sql
CREATE TABLE marketplace.transactions (
  id BIGSERIAL PRIMARY KEY,

  -- Parties
  client_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE RESTRICT,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE RESTRICT,

  -- What was purchased
  listing_id INTEGER REFERENCES marketplace.service_listings(id) ON DELETE SET NULL,
  service_description TEXT NOT NULL,

  -- Invoice reference (SINGLE invoice, no dual-write complexity!)
  -- For breeders: references tenant.invoices
  -- For service providers: references marketplace.invoices
  invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('tenant', 'marketplace')),
  tenant_id INTEGER, -- NULL if invoice_type = 'marketplace'
  invoice_id INTEGER NOT NULL, -- ID in tenant.invoices OR marketplace.invoices

  -- Foreign key enforcement (conditional based on invoice_type)
  CONSTRAINT fk_tenant_invoice
    FOREIGN KEY (tenant_id, invoice_id)
    REFERENCES tenant.invoices(tenant_id, id)
    ON DELETE RESTRICT
    DEFERRABLE INITIALLY DEFERRED,

  -- Amounts (denormalized for reporting)
  total_cents BIGINT NOT NULL,
  platform_fee_cents BIGINT DEFAULT 0,
  stripe_fee_cents BIGINT DEFAULT 0,
  provider_payout_cents BIGINT NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'pending_invoice' CHECK (status IN (
    'pending_invoice', 'invoiced', 'paid', 'completed',
    'cancelled', 'refunded', 'disputed'
  )),

  -- Timeline
  created_at TIMESTAMP DEFAULT NOW(),
  invoiced_at TIMESTAMP,
  paid_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  -- Notes
  client_notes TEXT,
  provider_notes TEXT,
  cancellation_reason TEXT
);

CREATE INDEX idx_transactions_client ON marketplace.transactions(client_id, status, created_at DESC);
CREATE INDEX idx_transactions_provider ON marketplace.transactions(provider_id, status, created_at DESC);
CREATE INDEX idx_transactions_listing ON marketplace.transactions(listing_id) WHERE listing_id IS NOT NULL;
CREATE INDEX idx_transactions_status ON marketplace.transactions(status, created_at DESC);
CREATE INDEX idx_transactions_invoice ON marketplace.transactions(invoice_type, tenant_id, invoice_id);
```

---

#### Table: `marketplace.invoices`

**Purpose**: Invoices for non-breeder service providers ONLY (breeders use tenant.invoices)

```sql
CREATE TABLE marketplace.invoices (
  id SERIAL PRIMARY KEY,

  -- Links
  transaction_id INTEGER NOT NULL REFERENCES marketplace.transactions(id) ON DELETE RESTRICT,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE RESTRICT,
  client_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE RESTRICT,

  invoice_number VARCHAR(50) UNIQUE NOT NULL,

  -- Amounts
  total_cents BIGINT NOT NULL,
  balance_cents BIGINT NOT NULL,
  refunded_cents BIGINT DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',

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
  buyer_payment_method VARCHAR(50), -- 'venmo', 'zelle', 'cash', etc.
  buyer_payment_reference VARCHAR(255),
  buyer_payment_receipt_url VARCHAR(500),
  provider_confirmed_at TIMESTAMP,
  provider_confirmed_by INTEGER REFERENCES marketplace.users(id),

  -- Timeline
  issued_at TIMESTAMP,
  due_at TIMESTAMP,
  paid_at TIMESTAMP,
  voided_at TIMESTAMP,

  -- Notes
  notes TEXT,
  terms TEXT,

  -- Reconciliation
  reconciliation_status VARCHAR(50) DEFAULT 'synced',

  -- Versioning (optimistic locking)
  version INTEGER DEFAULT 1,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_invoices_transaction ON marketplace.invoices(transaction_id);
CREATE INDEX idx_marketplace_invoices_provider ON marketplace.invoices(provider_id, status, created_at DESC);
CREATE INDEX idx_marketplace_invoices_client ON marketplace.invoices(client_id, status, created_at DESC);
CREATE INDEX idx_marketplace_invoices_stripe ON marketplace.invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_marketplace_invoices_number ON marketplace.invoices(invoice_number);
CREATE INDEX idx_marketplace_invoices_pending_confirm ON marketplace.invoices(status, buyer_marked_paid_at)
  WHERE status = 'pending_confirmation';
```

---

#### Table: `marketplace.invoice_line_items`

**Purpose**: Line items for marketplace invoices (normalized, not JSON)

```sql
CREATE TABLE marketplace.invoice_line_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES marketplace.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL,
  total_cents BIGINT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_items_invoice ON marketplace.invoice_line_items(invoice_id, sort_order);
```

---

#### Table: `marketplace.message_threads`

**Purpose**: Message threads between marketplace users

```sql
CREATE TABLE marketplace.message_threads (
  id SERIAL PRIMARY KEY,

  -- Participants
  client_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES marketplace.providers(id) ON DELETE CASCADE,

  -- Context
  transaction_id INTEGER REFERENCES marketplace.transactions(id) ON DELETE SET NULL,
  listing_id INTEGER REFERENCES marketplace.service_listings(id) ON DELETE SET NULL,

  subject VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),

  -- Last message tracking
  last_message_at TIMESTAMP DEFAULT NOW(),
  last_message_by INTEGER REFERENCES marketplace.users(id),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threads_client ON marketplace.message_threads(client_id, last_message_at DESC);
CREATE INDEX idx_threads_provider ON marketplace.message_threads(provider_id, last_message_at DESC);
CREATE INDEX idx_threads_transaction ON marketplace.message_threads(transaction_id) WHERE transaction_id IS NOT NULL;
```

---

#### Table: `marketplace.messages`

**Purpose**: Individual messages within threads

```sql
CREATE TABLE marketplace.messages (
  id BIGSERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES marketplace.message_threads(id) ON DELETE CASCADE,

  sender_id INTEGER NOT NULL REFERENCES marketplace.users(id) ON DELETE CASCADE,

  message_text TEXT NOT NULL,

  -- Attachments (normalized separately if needed, or simple JSON array)
  attachment_urls TEXT[],

  -- Email notification tracking
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_message_id VARCHAR(255),

  -- Read tracking
  read_at TIMESTAMP,
  read_by INTEGER REFERENCES marketplace.users(id),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON marketplace.messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_sender ON marketplace.messages(sender_id, created_at DESC);

-- Partition messages by date for scalability (10M+ messages/year)
-- ALTER TABLE marketplace.messages ... (see partitioning strategy)
```

---

### 2.2 Tenant Schema Updates

#### Updates to `tenant.tenants`

```sql
-- Add marketplace payment mode preference for breeders
ALTER TABLE tenant.tenants ADD COLUMN IF NOT EXISTS marketplace_payment_mode VARCHAR(50) DEFAULT 'stripe';
ALTER TABLE tenant.tenants ADD CONSTRAINT chk_marketplace_payment_mode
  CHECK (marketplace_payment_mode IN ('stripe', 'manual', 'disabled'));

-- Stripe Connect for marketplace payouts
ALTER TABLE tenant.tenants ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255) UNIQUE;
ALTER TABLE tenant.tenants ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE tenant.tenants ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_tenants_stripe_connect ON tenant.tenants(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;
```

---

#### Updates to `tenant.contacts`

```sql
-- Link contacts to marketplace users
ALTER TABLE tenant.contacts ADD COLUMN IF NOT EXISTS marketplace_user_id INTEGER;

-- Add marketplace transaction tracking (denormalized stats)
ALTER TABLE tenant.contacts ADD COLUMN IF NOT EXISTS marketplace_first_transaction_at TIMESTAMP;
ALTER TABLE tenant.contacts ADD COLUMN IF NOT EXISTS marketplace_last_transaction_at TIMESTAMP;
ALTER TABLE tenant.contacts ADD COLUMN IF NOT EXISTS marketplace_transaction_count INTEGER DEFAULT 0;
ALTER TABLE tenant.contacts ADD COLUMN IF NOT EXISTS marketplace_total_spent_cents BIGINT DEFAULT 0;

-- Foreign key to marketplace.users (works because same DB!)
ALTER TABLE tenant.contacts ADD CONSTRAINT fk_marketplace_user
  FOREIGN KEY (marketplace_user_id)
  REFERENCES marketplace.users(id)
  ON DELETE SET NULL;

-- Compound unique index (prevents same marketplace user in multiple contacts per tenant)
CREATE UNIQUE INDEX idx_contacts_marketplace_user_tenant
  ON tenant.contacts(marketplace_user_id, tenant_id)
  WHERE marketplace_user_id IS NOT NULL;
```

---

#### Updates to `tenant.invoices`

```sql
-- Mark invoices as marketplace-related
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS is_marketplace_invoice BOOLEAN DEFAULT FALSE;
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS marketplace_transaction_id INTEGER;

-- Payment mode snapshot (locked at creation to prevent race conditions)
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS payment_mode_snapshot VARCHAR(50);
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS payment_mode_locked_at TIMESTAMP;

-- Manual payment tracking (buyer marking + provider confirmation)
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS buyer_marked_paid_at TIMESTAMP;
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS buyer_payment_method VARCHAR(50);
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS buyer_payment_reference VARCHAR(255);
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS buyer_payment_receipt_url VARCHAR(500);
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS provider_confirmed_at TIMESTAMP;
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS provider_confirmed_by VARCHAR(50);

-- Partial refunds
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS refunded_cents BIGINT DEFAULT 0;

-- Reconciliation tracking
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS reconciliation_status VARCHAR(50) DEFAULT 'synced';

-- Optimistic locking
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Soft delete support
ALTER TABLE tenant.invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Foreign key to marketplace transaction (works because same DB!)
-- Note: Can't enforce FK if marketplace.transactions references this table
-- (circular dependency). Use application-level integrity checks instead.

CREATE INDEX idx_invoices_marketplace_transaction ON tenant.invoices(tenant_id, marketplace_transaction_id)
  WHERE marketplace_transaction_id IS NOT NULL;

CREATE INDEX idx_invoices_marketplace_flag ON tenant.invoices(tenant_id, is_marketplace_invoice, status)
  WHERE is_marketplace_invoice = TRUE;

CREATE INDEX idx_invoices_deleted ON tenant.invoices(deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX idx_invoices_pending_confirm ON tenant.invoices(status, buyer_marked_paid_at)
  WHERE status = 'pending_confirmation';
```

---

### 2.3 Public Schema (Shared Tables)

#### Table: `public.stripe_webhook_events`

**Purpose**: Track Stripe webhooks for idempotency

```sql
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  attempts INTEGER DEFAULT 1,

  -- Which invoice was affected
  invoice_schema VARCHAR(20), -- 'tenant' or 'marketplace'
  invoice_id BIGINT,
  tenant_id INTEGER, -- NULL if invoice_schema = 'marketplace'

  amount_cents BIGINT,
  result JSONB,
  error_message TEXT,

  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_event_id ON public.stripe_webhook_events(event_id, status);
CREATE INDEX idx_webhook_events_status ON public.stripe_webhook_events(status, created_at);
CREATE INDEX idx_webhook_events_failed ON public.stripe_webhook_events(status, attempts) WHERE status = 'failed';
```

---

#### Table: `public.invoice_audit_log`

**Purpose**: Audit trail for all invoice state changes

```sql
CREATE TABLE IF NOT EXISTS public.invoice_audit_log (
  id SERIAL PRIMARY KEY,

  invoice_schema VARCHAR(20) NOT NULL, -- 'tenant' or 'marketplace'
  invoice_id BIGINT NOT NULL,
  tenant_id INTEGER, -- NULL if invoice_schema = 'marketplace'

  changed_by_user_id VARCHAR(50),
  changed_at TIMESTAMP DEFAULT NOW(),

  old_status VARCHAR(50),
  new_status VARCHAR(50),

  payment_mode VARCHAR(50),
  action VARCHAR(100), -- 'mark_paid', 'confirm_payment', 'void', etc.

  metadata JSONB
);

CREATE INDEX idx_invoice_audit_invoice ON public.invoice_audit_log(invoice_schema, invoice_id, changed_at DESC);
CREATE INDEX idx_invoice_audit_user ON public.invoice_audit_log(changed_by_user_id, changed_at DESC);
CREATE INDEX idx_invoice_audit_action ON public.invoice_audit_log(action, changed_at DESC);
```

---

#### Table: `public.authorization_audit`

**Purpose**: Track authorization decisions (especially cross-schema access)

```sql
CREATE TABLE IF NOT EXISTS public.authorization_audit (
  id SERIAL PRIMARY KEY,

  user_id VARCHAR(50),
  user_type VARCHAR(50), -- 'marketplace_user', 'tenant_staff', etc.

  resource_schema VARCHAR(50),
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),

  action VARCHAR(50),
  allowed BOOLEAN,
  reason TEXT,

  requested_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_auth_audit_user ON public.authorization_audit(user_id, requested_at DESC);
CREATE INDEX idx_auth_audit_denied ON public.authorization_audit(allowed, requested_at DESC) WHERE allowed = FALSE;
CREATE INDEX idx_auth_audit_resource ON public.authorization_audit(resource_schema, resource_type, resource_id);
```

---

## 3. Critical Implementation Requirements

### 3.1 Row-Level Security (RLS) for Tenant Isolation

**CRITICAL**: Even though marketplace and tenant are in same database, tenant data MUST remain isolated.

```sql
-- Enable RLS on tenant tables
ALTER TABLE tenant.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.animals ENABLE ROW LEVEL SECURITY;
-- ... enable for all tenant tables

-- Create RLS policy
CREATE POLICY tenant_isolation_policy ON tenant.contacts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation_policy ON tenant.invoices
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::int);

-- Repeat for all tenant tables
```

**Application must set session variable**:
```typescript
// Before any tenant query
await prisma.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId}`;

// Then queries are automatically filtered
const contacts = await prisma.contact.findMany(); // Only returns current tenant's contacts
```

---

### 3.2 Payment Mode Locking (Prevent Race Conditions)

**CRITICAL**: Lock payment mode at invoice creation to prevent mode switch during transaction.

```typescript
async function createMarketplaceInvoice(
  transaction: Transaction,
  provider: Provider
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Lock provider payment mode
    const lockedProvider = await tx.$queryRaw`
      SELECT id, payment_mode
      FROM marketplace.providers
      WHERE id = ${provider.id}
      FOR UPDATE
    `;

    const paymentMode = lockedProvider[0].payment_mode;

    // 2. Create invoice with locked mode
    const invoice = await tx.invoice.create({
      data: {
        transactionId: transaction.id,
        providerId: provider.id,
        paymentMode: paymentMode,
        paymentModeLockedAt: new Date(),
        // ... other fields
      }
    });

    return invoice;
  });
}
```

---

### 3.3 Simplified Invoice Strategy (No Dual Invoice!)

**Single source of truth per transaction**:

- **Breeders** (have tenant): Use `tenant.invoices`
- **Service Providers** (no tenant): Use `marketplace.invoices`

**Transaction table stores which**:
```typescript
interface Transaction {
  invoiceType: 'tenant' | 'marketplace';
  tenantId: number | null; // NULL if invoiceType = 'marketplace'
  invoiceId: number; // ID in appropriate schema
}

// Resolve invoice
async function getInvoiceForTransaction(tx: Transaction) {
  if (tx.invoiceType === 'tenant') {
    return await prisma.tenant.invoice.findUnique({
      where: {
        tenant_id_id: {
          tenant_id: tx.tenantId!,
          id: tx.invoiceId
        }
      }
    });
  } else {
    return await prisma.marketplace.invoice.findUnique({
      where: { id: tx.invoiceId }
    });
  }
}
```

**No synchronization complexity!**

---

### 3.4 Foreign Key Enforcement

**Advantage of single DB**: Foreign keys work!

```sql
-- Marketplace transaction MUST reference valid tenant invoice (if breeder)
ALTER TABLE marketplace.transactions
  ADD CONSTRAINT fk_tenant_invoice
  FOREIGN KEY (tenant_id, invoice_id)
  REFERENCES tenant.invoices(tenant_id, id)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED; -- Allow creation order flexibility

-- Contact MUST reference valid marketplace user
ALTER TABLE tenant.contacts
  ADD CONSTRAINT fk_marketplace_user
  FOREIGN KEY (marketplace_user_id)
  REFERENCES marketplace.users(id)
  ON DELETE SET NULL;

-- Provider MUST reference valid tenant (if breeder)
ALTER TABLE marketplace.providers
  ADD CONSTRAINT fk_tenant
  FOREIGN KEY (tenant_id)
  REFERENCES tenant.tenants(id)
  ON DELETE RESTRICT;
```

**Result**: Database prevents orphaned records automatically!

---

## 4. Security & Isolation

### 4.1 Authentication Strategy

**Two authentication contexts** (but same database):

1. **Marketplace Users** (`marketplace.users`):
   - Authenticate via marketplace.breederhq.com
   - JWT contains: `{ userId, userType, tenantId (if breeder) }`
   - Access marketplace schema freely
   - Access tenant schema ONLY if linked to tenant AND RLS policy allows

2. **Tenant Staff** (existing `User` model):
   - Authenticate via app.breederhq.com
   - JWT contains: `{ userId, tenantId, role }`
   - Access tenant schema for their tenant
   - Cannot access marketplace schema directly

### 4.2 Authorization Middleware

```typescript
// Set RLS context for tenant queries
async function setTenantContext(tenantId: number) {
  await prisma.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId}`;
}

// Marketplace user accessing tenant data
async function authorizeMarketplaceUserTenantAccess(
  user: MarketplaceUser,
  tenantId: number,
  action: string
) {
  // Check if user has contact in this tenant
  const contact = await prisma.contact.findFirst({
    where: {
      tenantId: tenantId,
      marketplaceUserId: user.id
    }
  });

  if (!contact) {
    throw new ForbiddenError('User not authorized for this tenant');
  }

  // Set RLS context
  await setTenantContext(tenantId);

  // Log authorization decision
  await logAuthorizationDecision({
    userId: user.id,
    resourceSchema: 'tenant',
    resourceType: 'Invoice',
    tenantId: tenantId,
    action: action,
    allowed: true
  });

  return contact;
}
```

### 4.3 SQL Injection Prevention

**All queries use Prisma ORM** (parameterized by default):

```typescript
// SAFE - Prisma parameterizes
const invoices = await prisma.invoice.findMany({
  where: {
    tenantId: tenantId,
    status: 'paid'
  }
});

// UNSAFE - Never do this
const invoices = await prisma.$queryRawUnsafe(
  `SELECT * FROM invoices WHERE tenant_id = ${tenantId}` // SQL INJECTION!
);

// SAFE - Use tagged template
const invoices = await prisma.$queryRaw`
  SELECT * FROM invoices WHERE tenant_id = ${tenantId}
`; // Prisma parameterizes
```

---

## 5. Performance Optimization

### 5.1 Critical Indexes

**Already defined in schema above**, but summary:

**High-volume queries**:
- Transaction list by provider: `idx_transactions_provider(provider_id, status, created_at DESC)`
- Transaction list by client: `idx_transactions_client(client_id, status, created_at DESC)`
- Message pagination: `idx_messages_thread(thread_id, created_at DESC)`
- Invoice lookup by transaction: `idx_marketplace_invoices_transaction(transaction_id)`
- Service search: `idx_listings_category_status(category, status)`
- Full-text search: `idx_listings_search USING GIN (...)`

### 5.2 Query Optimization

**Avoid N+1 queries** with proper JOINs:

```typescript
// BAD - N+1 query
const transactions = await prisma.transaction.findMany();
for (const tx of transactions) {
  const provider = await prisma.provider.findUnique({ where: { id: tx.providerId } }); // N+1!
}

// GOOD - Single query with join
const transactions = await prisma.transaction.findMany({
  include: {
    provider: {
      select: {
        id: true,
        businessName: true,
        city: true,
        state: true
      }
    },
    client: {
      select: {
        id: true,
        displayName: true,
        email: true
      }
    }
  }
});
```

### 5.3 Caching Strategy

**What to cache**:
```typescript
// Provider profiles (rarely change)
await cache.set(
  `provider:${providerId}`,
  providerData,
  { ttl: 600 } // 10 minutes
);

// Service listings (change frequently)
await cache.set(
  `listings:${category}:${state}:${page}`,
  listingsData,
  { ttl: 60 } // 1 minute
);

// User sessions (high read)
await cache.set(
  `session:${sessionId}`,
  sessionData,
  { ttl: 1800 } // 30 minutes
);
```

**NEVER cache**:
- Invoice data (financial data must be fresh)
- Transaction statuses (real-time accuracy required)
- Payment information

### 5.4 Pagination

**Offset pagination** (simple, works for most cases):
```typescript
const listings = await prisma.serviceListing.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

**Cursor pagination** (for high-volume like messages):
```typescript
const messages = await prisma.message.findMany({
  where: {
    threadId: threadId,
    id: { lt: cursorId } // Cursor
  },
  take: 50,
  orderBy: { id: 'desc' }
});
```

---

## 6. Migration Strategy

### 6.1 Migration Phases

**Phase 1: Schema Preparation** (3 days, zero downtime)
1. Create `marketplace` schema
2. Add columns to `tenant.tenants`, `tenant.contacts`, `tenant.invoices`
3. Create indexes (CONCURRENTLY)
4. Enable RLS policies

**Phase 2: Deploy New Code** (1 week)
1. Deploy marketplace API endpoints
2. Deploy marketplace frontend
3. Feature flag: marketplace disabled initially
4. Monitor for issues

**Phase 3: Data Migration** (2 days)
1. Migrate existing marketplace listings to new schema
2. Create marketplace provider records for existing breeders (opt-in)
3. Verify data consistency

**Phase 4: Enable Marketplace** (1 day)
1. Flip feature flag: marketplace enabled
2. Monitor transactions, invoices, payments
3. Gradual rollout: 10% → 25% → 50% → 100%

**Phase 5: Cleanup** (2 weeks)
1. Archive old marketplace tables
2. Remove unused columns
3. Optimize indexes based on production query patterns

**Total: 4-5 weeks**

### 6.2 Zero-Downtime Migration Script

See Section 6 of [migration-strategy.md](./migration-strategy.md) for complete procedures.

Key points:
- Use `CREATE INDEX CONCURRENTLY` (no table locks)
- Add columns with defaults (no table rewrite)
- Deploy code before enforcing constraints
- Use feature flags for gradual rollout
- Keep old tables for 90 days before dropping

---

## 7. API Implementation

### 7.1 Endpoint Structure

**Marketplace Endpoints** (new):
```
POST   /api/v1/marketplace/auth/register
POST   /api/v1/marketplace/auth/login
GET    /api/v1/marketplace/listings
GET    /api/v1/marketplace/listings/:slug
POST   /api/v1/marketplace/transactions
GET    /api/v1/marketplace/transactions/:id
PATCH  /api/v1/marketplace/transactions/:id
GET    /api/v1/marketplace/invoices/:id
PATCH  /api/v1/marketplace/invoices/:id (mark_paid, confirm_payment, void)
POST   /api/v1/marketplace/invoices/:id/receipts
GET    /api/v1/marketplace/messages/threads
POST   /api/v1/marketplace/messages/threads
GET    /api/v1/marketplace/messages/threads/:id/messages
POST   /api/v1/marketplace/messages/threads/:id/messages
```

**Tenant Endpoints** (updated):
```
PATCH  /api/v1/tenants/:tenantId/invoices/:id (support marketplace actions)
GET    /api/v1/tenants/:tenantId/marketplace/settings
PATCH  /api/v1/tenants/:tenantId/marketplace/settings
```

### 7.2 Example: Create Marketplace Transaction

```typescript
// POST /api/v1/marketplace/transactions
async function createMarketplaceTransaction(req, res) {
  const { clientId, providerId, listingId, serviceDescription } = req.body;

  // 1. Verify authentication
  const user = await authenticateMarketplaceUser(req);
  if (user.id !== clientId) {
    throw new ForbiddenError('Cannot create transaction for another user');
  }

  // 2. Get provider
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { tenant: true }
  });

  if (!provider) {
    throw new NotFoundError('Provider not found');
  }

  // 3. Determine invoice type based on provider
  const invoiceType = provider.isBreeder && provider.tenantId
    ? 'tenant'
    : 'marketplace';

  // 4. Create transaction + invoice in atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create transaction
    const transaction = await tx.transaction.create({
      data: {
        clientId,
        providerId,
        listingId,
        serviceDescription,
        invoiceType,
        tenantId: provider.tenantId, // NULL if not breeder
        totalCents: calculateTotal(req.body),
        status: 'pending_invoice'
      }
    });

    // Create invoice based on type
    let invoice;
    if (invoiceType === 'tenant') {
      // Lock tenant payment mode
      await setTenantContext(provider.tenantId!);

      const tenant = await tx.tenant.findUnique({
        where: { id: provider.tenantId! },
        select: { marketplacePaymentMode: true }
      });

      // Create tenant invoice
      invoice = await tx.invoice.create({
        data: {
          tenantId: provider.tenantId!,
          invoiceNumber: await generateInvoiceNumber(tx, provider.tenantId!),
          isMarketplaceInvoice: true,
          marketplaceTransactionId: transaction.id,
          clientPartyId: await resolveClientParty(tx, clientId, provider.tenantId!),
          amountCents: transaction.totalCents,
          balanceCents: transaction.totalCents,
          paymentModeSnapshot: tenant.marketplacePaymentMode,
          paymentModeLockedAt: new Date(),
          status: 'draft'
        }
      });
    } else {
      // Create marketplace invoice
      invoice = await tx.marketplaceInvoice.create({
        data: {
          transactionId: transaction.id,
          providerId,
          clientId,
          invoiceNumber: await generateMarketplaceInvoiceNumber(tx),
          totalCents: transaction.totalCents,
          balanceCents: transaction.totalCents,
          paymentMode: provider.paymentMode,
          paymentModeLockedAt: new Date(),
          status: 'draft'
        }
      });
    }

    // Update transaction with invoice reference
    await tx.transaction.update({
      where: { id: transaction.id },
      data: {
        invoiceId: invoice.id,
        status: 'invoiced',
        invoicedAt: new Date()
      }
    });

    return { transaction, invoice };
  });

  // 5. Send invoice to client (async)
  await sendInvoiceEmail(result.invoice).catch(err => {
    logger.error('Failed to send invoice email', { err });
    // Don't fail request - email is non-critical
  });

  // 6. Return response
  res.status(201).json({
    transaction: result.transaction,
    invoice: formatInvoiceForClient(result.invoice, invoiceType)
  });
}
```

### 7.3 Example: Resolve Invoice (Abstracted)

```typescript
// GET /api/v1/marketplace/transactions/:id/invoice
async function getInvoiceForTransaction(req, res) {
  const { id } = req.params;

  // 1. Get transaction
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(id) },
    include: {
      provider: true,
      client: true
    }
  });

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  // 2. Authorize access
  const user = await authenticateMarketplaceUser(req);
  if (user.id !== transaction.clientId && user.id !== transaction.provider.userId) {
    throw new ForbiddenError('Not authorized to view this invoice');
  }

  // 3. Fetch invoice based on type (single DB makes this easy!)
  let invoice;
  if (transaction.invoiceType === 'tenant') {
    // Query tenant schema
    await setTenantContext(transaction.tenantId!);

    invoice = await prisma.invoice.findUnique({
      where: {
        tenant_id_id: {
          tenant_id: transaction.tenantId!,
          id: transaction.invoiceId
        }
      },
      include: {
        lineItems: true
      }
    });
  } else {
    // Query marketplace schema
    invoice = await prisma.marketplaceInvoice.findUnique({
      where: { id: transaction.invoiceId },
      include: {
        lineItems: true
      }
    });
  }

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // 4. Return formatted invoice (client doesn't need to know which schema)
  res.json({
    invoiceType: transaction.invoiceType,
    invoice: formatInvoiceForClient(invoice, transaction.invoiceType)
  });
}
```

**Client doesn't know about schemas!** API abstracts complexity.

---

## 8. Testing & Validation

### 8.1 Schema Validation Tests

```sql
-- Test: Foreign keys are enforced
BEGIN;

-- Try to create transaction with invalid provider (should fail)
INSERT INTO marketplace.transactions (client_id, provider_id, invoice_type, invoice_id, total_cents, status)
VALUES (1, 999999, 'marketplace', 1, 10000, 'pending_invoice');
-- Expected: FOREIGN KEY constraint violation

ROLLBACK;

-- Test: RLS policies work
BEGIN;

-- Set tenant context
SET LOCAL app.current_tenant_id = 1;

-- Try to query another tenant's contacts (should return 0 rows)
SELECT * FROM tenant.contacts WHERE tenant_id = 2;
-- Expected: 0 rows (RLS blocked access)

ROLLBACK;

-- Test: Unique constraints work
BEGIN;

-- Try to create duplicate marketplace user email
INSERT INTO marketplace.users (email, password_hash) VALUES ('test@example.com', 'hash1');
INSERT INTO marketplace.users (email, password_hash) VALUES ('test@example.com', 'hash2');
-- Expected: UNIQUE constraint violation

ROLLBACK;
```

### 8.2 Integration Tests

```typescript
describe('Marketplace Transaction Flow', () => {
  it('creates transaction and invoice for breeder provider', async () => {
    // Setup: Create breeder provider linked to tenant
    const provider = await createBreederProvider({ tenantId: 1 });
    const client = await createMarketplaceUser();

    // Act: Create transaction
    const result = await POST('/api/v1/marketplace/transactions', {
      clientId: client.id,
      providerId: provider.id,
      serviceDescription: 'Training session',
      totalCents: 50000
    });

    // Assert: Transaction created
    expect(result.transaction.status).toBe('invoiced');
    expect(result.transaction.invoiceType).toBe('tenant');

    // Assert: Invoice created in tenant schema
    const invoice = await prisma.invoice.findUnique({
      where: {
        tenant_id_id: {
          tenant_id: 1,
          id: result.transaction.invoiceId
        }
      }
    });
    expect(invoice).toBeDefined();
    expect(invoice.isMarketplaceInvoice).toBe(true);
  });

  it('creates transaction and invoice for service provider', async () => {
    // Setup: Create service provider (no tenant)
    const provider = await createServiceProvider({ tenantId: null });
    const client = await createMarketplaceUser();

    // Act: Create transaction
    const result = await POST('/api/v1/marketplace/transactions', {
      clientId: client.id,
      providerId: provider.id,
      serviceDescription: 'Photography session',
      totalCents: 30000
    });

    // Assert: Transaction created
    expect(result.transaction.status).toBe('invoiced');
    expect(result.transaction.invoiceType).toBe('marketplace');

    // Assert: Invoice created in marketplace schema
    const invoice = await prisma.marketplaceInvoice.findUnique({
      where: { id: result.transaction.invoiceId }
    });
    expect(invoice).toBeDefined();
  });
});
```

### 8.3 Load Testing

```bash
# Test concurrent invoice creation (1000 req/s)
k6 run --vus 100 --duration 30s load-tests/create-invoices.js

# Test marketplace search (2000 req/s)
k6 run --vus 200 --duration 60s load-tests/search-listings.js

# Test message sending (500 req/s)
k6 run --vus 50 --duration 30s load-tests/send-messages.js
```

**Performance targets**:
- p95 latency < 200ms
- p99 latency < 500ms
- Error rate < 0.1%
- Database CPU < 70%

---

## 9. Monitoring & Operations

### 9.1 Key Metrics

```typescript
// Query performance by schema
metrics.histogram('db.query.duration', duration, {
  schema: 'tenant' | 'marketplace' | 'public',
  model: 'Invoice' | 'Transaction' | 'Message',
  operation: 'findMany' | 'create' | 'update'
});

// Invoice state transitions
metrics.counter('invoice.state_transition', 1, {
  schema: 'tenant' | 'marketplace',
  from: 'sent',
  to: 'paid',
  paymentMode: 'stripe' | 'manual'
});

// Authorization failures (security monitoring)
metrics.counter('auth.failure', 1, {
  reason: 'rls_blocked' | 'no_contact' | 'invalid_tenant',
  schema: 'tenant',
  userId: userId
});

// Stripe webhook processing
metrics.counter('stripe.webhook.result', 1, {
  eventType: 'invoice.paid',
  result: 'success' | 'failure'
});
```

### 9.2 Dashboards

**Database Performance Dashboard**:
- Query latency by schema (p50, p95, p99)
- Query latency by model
- Connection pool utilization
- Index hit rate
- Table sizes
- Disk I/O

**Marketplace Health Dashboard**:
- Transaction volume (created, paid, completed)
- Invoice status distribution (draft, sent, paid)
- Payment mode split (Stripe vs manual)
- Payment confirmation latency (buyer mark → provider confirm)
- Search performance (listing queries)
- Message delivery rate

**Security Dashboard**:
- RLS policy blocks per hour
- Failed authorization attempts
- Cross-schema query patterns
- Suspicious activity alerts

### 9.3 Alerts

| Alert | Threshold | Severity |
|-------|-----------|----------|
| Query latency p95 > 200ms | Any schema | Warning |
| Query latency p99 > 500ms | Any schema | Critical |
| RLS policy blocks spike | >100/hour | Warning |
| Authorization failures | >50/hour | Critical |
| Invoice stuck in pending_confirmation | >7 days | Warning |
| Stripe webhook failures | >5% | Critical |
| Database connection pool exhausted | >90% | Critical |

### 9.4 Backup Strategy

**Daily backups**:
```bash
# Full database backup (includes all schemas)
pg_dump -U postgres -d breederhq -F c -f /backup/breederhq_$(date +%Y%m%d).dump

# Verify backup
pg_restore --list /backup/breederhq_$(date +%Y%m%d).dump | wc -l
```

**Point-in-time recovery**:
```bash
# Enable WAL archiving
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
wal_level = replica
```

**Recovery objectives**:
- RPO: 5 minutes (max data loss)
- RTO: 15 minutes (max downtime)

---

## 10. Implementation Roadmap

### Week 1-2: Schema & Security Foundation

**Tasks**:
- [ ] Create `marketplace` schema
- [ ] Define all marketplace tables with foreign keys
- [ ] Update tenant tables (add marketplace columns)
- [ ] Create public schema audit/webhook tables
- [ ] Enable RLS policies on tenant tables
- [ ] Create all indexes (CONCURRENTLY)
- [ ] Write schema validation tests

**Deliverables**:
- Complete schema DDL scripts
- RLS policies deployed
- Schema validation test suite passing

---

### Week 3-4: API Implementation

**Tasks**:
- [ ] Marketplace authentication endpoints
- [ ] Provider CRUD endpoints
- [ ] Listing CRUD endpoints
- [ ] Transaction creation endpoint
- [ ] Invoice resolution endpoint (abstracts schema complexity)
- [ ] Payment marking/confirmation endpoints
- [ ] Message thread/message endpoints
- [ ] Stripe webhook handlers
- [ ] Authorization middleware with RLS context setting

**Deliverables**:
- Complete API implementation
- OpenAPI/Swagger documentation
- Integration test suite (80%+ coverage)

---

### Week 5: Testing & Performance

**Tasks**:
- [ ] Load testing (1000 req/s sustained)
- [ ] Stress testing (find breaking points)
- [ ] Security testing (RLS bypass attempts, SQL injection)
- [ ] Payment flow testing (all scenarios)
- [ ] Rollback testing (migration reversal)
- [ ] Performance optimization (slow query analysis)
- [ ] Index tuning based on actual query patterns

**Deliverables**:
- Load test results meeting targets
- Security audit report
- Performance optimization recommendations implemented

---

### Week 6: Migration & Deployment

**Tasks**:
- [ ] Staging migration rehearsal
- [ ] Production migration execution (Phase 1-3)
- [ ] Feature flag deployment
- [ ] Gradual rollout (10% → 100%)
- [ ] Monitoring dashboard setup
- [ ] Alert configuration
- [ ] Documentation finalization
- [ ] Team training

**Deliverables**:
- Marketplace live in production
- Monitoring/alerts operational
- Documentation complete
- Team trained on operations

---

## Appendix A: Complete Schema DDL

See separate file: `marketplace-single-db-schema.sql`

---

## Appendix B: Migration Scripts

See separate file: `marketplace-migration-scripts.sql`

---

## Appendix C: API Specifications

See separate file: `marketplace-api-spec.yaml` (OpenAPI format)

---

## Conclusion

This single-database approach with schema isolation provides:

✅ **Data Integrity**: Foreign keys enforce referential integrity
✅ **Simplicity**: One database, one backup, one connection string
✅ **Performance**: No cross-database overhead, optimized joins
✅ **Security**: RLS policies enforce tenant isolation
✅ **ACID Transactions**: Full transactional consistency
✅ **Scalability**: Proven to 100M+ rows with proper indexing
✅ **Cost**: Single database instance, lower operational cost

**Next Steps**:
1. Review this plan with engineering team
2. Approve schema design
3. Begin Week 1 implementation (schema foundation)
4. Schedule weekly progress reviews

---

**Document Version**: 1.0
**Last Updated**: 2026-01-12
**Status**: Ready for Implementation
**Estimated Completion**: 6 weeks from start
