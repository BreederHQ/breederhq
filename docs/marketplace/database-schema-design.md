# BreederHQ Marketplace: Complete Database Schema Design

> Comprehensive schema design for v2 Marketplace Management Portal
>
> **Status**: Draft for Review
> **Last Updated**: 2026-01-12
> **Version**: 1.0

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Strategy](#database-strategy)
3. [Tenant Database Schema](#tenant-database-schema)
4. [Marketplace Database Schema](#marketplace-database-schema)
5. [Cross-Database Relationships](#cross-database-relationships)
6. [State Machines](#state-machines)
7. [Indexes & Performance](#indexes--performance)
8. [Migration Plan](#migration-plan)
9. [API Endpoints](#api-endpoints)
10. [Webhook Handlers](#webhook-handlers)
11. [Error Handling](#error-handling)

---

## Architecture Overview

### Dual Database Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  app.breederhq.com              marketplace.breederhq.com   │
│  (Breeder Portal)               (Marketplace Portal)        │
│         │                                │                   │
│         │                                │                   │
│         ▼                                ▼                   │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Tenant DB   │◄─────────────┤ Marketplace  │            │
│  │ (PostgreSQL) │   Links via  │      DB      │            │
│  │              │   IDs only   │ (PostgreSQL) │            │
│  └──────────────┘              └──────────────┘            │
│         │                                │                   │
│         └────────────┬───────────────────┘                  │
│                      ▼                                       │
│              ┌──────────────┐                               │
│              │    Stripe    │                               │
│              │     API      │                               │
│              └──────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Separation of Concerns**
   - Tenant DB: Breeder's private business data (contacts, animals, finances)
   - Marketplace DB: Public marketplace data (listings, transactions, messages)

2. **Cross-Database Linking**
   - Store IDs only (tenantId, userId, invoiceId)
   - No foreign key constraints across databases
   - API layer handles data resolution

3. **Payment Flexibility**
   - Support both Stripe and manual payment modes
   - Breeder maintains control over payment workflow
   - Service providers have same flexibility

4. **Single Source of Truth**
   - Stripe is source of truth for online payments
   - Tenant Invoice is source of truth for breeder finances
   - MarketplaceInvoice is source of truth for service provider finances

---

## Database Strategy

### Tenant Database (Existing)

**Purpose**: Breeder's private business management

**Contains**:
- Animals, Breeding Plans, Offspring Groups
- Contacts, Organizations (clients/customers)
- Invoices, Payments, Financial records
- Documents, Health records, Pedigrees

**Updates Needed**:
- Add marketplace linking fields
- Add payment mode settings
- Add marketplace contact tracking

### Marketplace Database (New)

**Purpose**: Public marketplace operations

**Contains**:
- Users (buyers and sellers)
- Marketplace Providers (seller profiles)
- Listings (services, animals, offspring groups)
- Transactions, Messages, Reviews
- Service Provider Invoices

**Key Difference**: No access to tenant private data

---

## Tenant Database Schema

### 1. Tenant (Updated)

```sql
-- Existing table with new fields
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- NEW: Marketplace payment settings
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketplace_payment_mode VARCHAR(50) DEFAULT 'manual';
  -- Values: 'stripe', 'manual', 'disabled'
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketplace_payment_instructions TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_mode_changed_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_mode_changed_by INTEGER;

-- Constraints
ALTER TABLE tenants ADD CONSTRAINT chk_marketplace_payment_mode
  CHECK (marketplace_payment_mode IN ('stripe', 'manual', 'disabled'));
```

**TypeScript Interface**:
```typescript
interface Tenant {
  id: number;
  name: string;
  slug: string;

  // Stripe integration
  stripeConnectAccountId?: string;
  stripeOnboardingComplete: boolean;
  stripeDetailsSubmitted: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;

  // Marketplace payment settings
  marketplacePaymentMode: "stripe" | "manual" | "disabled";
  marketplacePaymentInstructions?: string;

  // Audit trail
  paymentModeChangedAt?: Date;
  paymentModeChangedBy?: number;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2. Contact (Updated)

```sql
-- Existing table with new fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_user_id INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL';
  -- Values: 'MANUAL', 'IMPORT', 'MARKETPLACE', 'WAITLIST'

-- NEW: Marketplace relationship tracking
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_first_contacted_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_total_transactions INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_total_spent_cents INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_last_transaction_at TIMESTAMP;

-- Index for marketplace lookups
CREATE INDEX IF NOT EXISTS idx_contacts_marketplace_user
  ON contacts(tenant_id, marketplace_user_id) WHERE marketplace_user_id IS NOT NULL;

-- Constraints
ALTER TABLE contacts ADD CONSTRAINT chk_contact_source
  CHECK (source IN ('MANUAL', 'IMPORT', 'MARKETPLACE', 'WAITLIST'));
```

**TypeScript Interface**:
```typescript
interface Contact {
  id: number;
  tenantId: number;

  // Basic info
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;

  // Marketplace integration
  marketplaceUserId?: number;  // Links to marketplace User.id
  source: "MANUAL" | "IMPORT" | "MARKETPLACE" | "WAITLIST";

  // Marketplace relationship tracking
  marketplaceFirstContactedAt?: Date;
  marketplaceTotalTransactions: number;
  marketplaceTotalSpentCents: number;
  marketplaceLastTransactionAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 3. Invoice (Updated)

```sql
-- Existing table with new fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_marketplace_invoice BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS marketplace_transaction_id INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'manual';
  -- Values: 'stripe', 'manual', 'external'

-- Stripe integration
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

-- Manual payment tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
  -- Values: 'cash', 'check', 'venmo', 'zelle', 'wire', 'other'
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Buyer payment marking (for manual mode)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_marked_paid_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_payment_method VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_payment_reference VARCHAR(255);

-- Breeder confirmation (for manual mode)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS breeder_confirmed_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS breeder_confirmed_by INTEGER;

-- Update status enum to include pending_confirmation
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_invoice_status;
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_status
  CHECK (status IN ('draft', 'sent', 'pending_confirmation', 'paid', 'void', 'overdue'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_marketplace
  ON invoices(tenant_id, is_marketplace_invoice) WHERE is_marketplace_invoice = TRUE;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe
  ON invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_pending_confirmation
  ON invoices(tenant_id, status) WHERE status = 'pending_confirmation';

-- Constraints
ALTER TABLE invoices ADD CONSTRAINT chk_payment_mode
  CHECK (payment_mode IN ('stripe', 'manual', 'external'));
ALTER TABLE invoices ADD CONSTRAINT chk_payment_method
  CHECK (payment_method IN ('cash', 'check', 'venmo', 'zelle', 'wire', 'other'));
```

**TypeScript Interface**:
```typescript
interface Invoice {
  id: number;
  tenantId: number;
  contactId?: number;
  organizationId?: number;

  invoiceNumber: string;
  totalCents: number;
  status: "draft" | "sent" | "pending_confirmation" | "paid" | "void" | "overdue";

  // Marketplace integration
  isMarketplaceInvoice: boolean;
  marketplaceTransactionId?: number;  // Links to MarketplaceTransaction.id
  paymentMode: "stripe" | "manual" | "external";

  // Stripe integration (only if paymentMode = "stripe")
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;

  // Manual payment tracking (only if paymentMode = "manual")
  paymentMethod?: "cash" | "check" | "venmo" | "zelle" | "wire" | "other";
  paymentNotes?: string;

  // Buyer payment marking
  buyerMarkedPaidAt?: Date;
  buyerPaymentMethod?: string;
  buyerPaymentReference?: string;

  // Breeder confirmation
  breederConfirmedAt?: Date;
  breederConfirmedBy?: number;

  paidAt?: Date;
  dueDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 4. BreedingProgram (Updated)

```sql
-- Existing table with new fields
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS allow_automatic_waitlist_reservations BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS require_application_form BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS require_deposit_to_reserve BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS deposit_amount_cents INTEGER;

-- Marketplace visibility
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS marketplace_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS marketplace_featured_until TIMESTAMP;

-- Index
CREATE INDEX IF NOT EXISTS idx_breeding_programs_marketplace
  ON breeding_programs(tenant_id, listed) WHERE listed = TRUE;
```

**TypeScript Interface**:
```typescript
interface BreedingProgram {
  id: number;
  tenantId: number;

  slug: string;
  name: string;
  description?: string;
  species: string;
  breedText?: string;

  // Visibility
  listed: boolean;
  acceptInquiries: boolean;
  openWaitlist: boolean;
  acceptReservations: boolean;

  // NEW: Marketplace settings
  allowAutomaticWaitlistReservations: boolean;
  requireApplicationForm: boolean;
  requireDepositToReserve: boolean;
  depositAmountCents?: number;

  // Featured listing
  marketplaceFeatured: boolean;
  marketplaceFeaturedUntil?: Date;

  // Pricing
  pricingTiers?: object;  // JSON
  whatsIncluded?: string;
  typicalWaitTime?: string;

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Marketplace Database Schema

### 1. User

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,

  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,

  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verified_at TIMESTAMP,

  password_hash VARCHAR(255) NOT NULL,

  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(200),
  avatar_url VARCHAR(500),

  -- User type
  user_type VARCHAR(50) DEFAULT 'buyer',
    -- Values: 'buyer', 'breeder', 'service_provider', 'both'

  -- Tenant linking (if breeder)
  tenant_id INTEGER,  -- Links to tenant DB (no FK)
  tenant_verified BOOLEAN DEFAULT FALSE,

  -- Stripe
  stripe_customer_id VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'active',
    -- Values: 'active', 'suspended', 'banned'

  -- Preferences
  notification_email BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,

  -- Security
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_user_type CHECK (user_type IN ('buyer', 'breeder', 'service_provider', 'both')),
  CONSTRAINT chk_user_status CHECK (status IN ('active', 'suspended', 'banned'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_users_stripe ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
```

**TypeScript Interface**:
```typescript
interface User {
  id: number;

  // Authentication
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  phone?: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: Date;
  passwordHash: string;

  // Profile
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;

  // User type
  userType: "buyer" | "breeder" | "service_provider" | "both";

  // Tenant linking
  tenantId?: number;
  tenantVerified: boolean;

  // Stripe
  stripeCustomerId?: string;

  // Status
  status: "active" | "suspended" | "banned";

  // Preferences
  notificationEmail: boolean;
  notificationSms: boolean;

  // Security
  lastLoginAt?: Date;
  lastLoginIp?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 2. MarketplaceProvider

```sql
CREATE TABLE marketplace_providers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,

  -- Provider type
  provider_type VARCHAR(50) NOT NULL,
    -- Values: 'breeder', 'service_provider'

  -- Tenant linking (only if breeder)
  tenant_id INTEGER,  -- Links to tenant DB (no FK)

  -- Business info
  business_name VARCHAR(200),
  business_description TEXT,
  business_logo_url VARCHAR(500),

  -- Location
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(3) DEFAULT 'USA',

  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url VARCHAR(500),

  -- Stripe Connect
  stripe_connect_account_id VARCHAR(255),
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  stripe_details_submitted BOOLEAN DEFAULT FALSE,
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,

  -- Payment settings (for service providers)
  payment_mode VARCHAR(50) DEFAULT 'manual',
    -- Values: 'stripe', 'manual'
  payment_instructions TEXT,

  -- Verification
  verification_status VARCHAR(50) DEFAULT 'unverified',
    -- Values: 'unverified', 'email_verified', 'phone_verified', 'identity_verified', 'background_checked'
  verified_at TIMESTAMP,

  -- Stats
  total_listings INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_revenue_cents BIGINT DEFAULT 0,

  -- Ratings
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
    -- Values: 'active', 'paused', 'suspended'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_provider_type CHECK (provider_type IN ('breeder', 'service_provider')),
  CONSTRAINT chk_payment_mode CHECK (payment_mode IN ('stripe', 'manual')),
  CONSTRAINT chk_verification_status CHECK (verification_status IN ('unverified', 'email_verified', 'phone_verified', 'identity_verified', 'background_checked')),
  CONSTRAINT chk_provider_status CHECK (status IN ('active', 'paused', 'suspended'))
);

CREATE UNIQUE INDEX idx_providers_user ON marketplace_providers(user_id);
CREATE INDEX idx_providers_tenant ON marketplace_providers(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_providers_stripe ON marketplace_providers(stripe_connect_account_id) WHERE stripe_connect_account_id IS NOT NULL;
CREATE INDEX idx_providers_status ON marketplace_providers(status);
```

**TypeScript Interface**:
```typescript
interface MarketplaceProvider {
  id: number;
  userId: number;

  // Provider type
  providerType: "breeder" | "service_provider";

  // Tenant linking
  tenantId?: number;

  // Business info
  businessName?: string;
  businessDescription?: string;
  businessLogoUrl?: string;

  // Location
  city?: string;
  state?: string;
  country: string;

  // Contact
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;

  // Stripe Connect
  stripeConnectAccountId?: string;
  stripeOnboardingComplete: boolean;
  stripeDetailsSubmitted: boolean;
  stripeChargesEnabled: boolean;
  stripePayoutsEnabled: boolean;

  // Payment settings
  paymentMode: "stripe" | "manual";
  paymentInstructions?: string;

  // Verification
  verificationStatus: "unverified" | "email_verified" | "phone_verified" | "identity_verified" | "background_checked";
  verifiedAt?: Date;

  // Stats
  totalListings: number;
  totalTransactions: number;
  totalRevenueCents: number;

  // Ratings
  averageRating: number;
  totalReviews: number;

  // Status
  status: "active" | "paused" | "suspended";

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 3. ServiceListing

```sql
CREATE TABLE service_listings (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL,

  -- Basic info
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- Category (hierarchical)
  category VARCHAR(100) NOT NULL,
    -- Parent categories: BREEDING, TRAINING, GROOMING, TRANSPORT, BOARDING,
    -- VETERINARY, PHOTOGRAPHY, WORKING_DOG, SERVICE_THERAPY, REHABILITATION,
    -- LIVESTOCK, EXOTIC, CREATIVE, EVENTS, LEGAL, OTHER
  subcategory VARCHAR(100),

  -- Category-specific metadata (JSON)
  category_metadata JSONB,

  -- Pricing
  price_cents INTEGER,
  price_type VARCHAR(50),
    -- Values: 'fixed', 'starting_at', 'hourly', 'daily', 'per_session', 'contact'
  price_text VARCHAR(200),

  -- Service details
  duration_text VARCHAR(100),  -- "1 hour", "2-3 weeks", etc.
  service_area_text VARCHAR(200),  -- "Austin metro area", "Will travel 50mi", etc.

  -- Location
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(3) DEFAULT 'USA',
  mobile_service BOOLEAN DEFAULT FALSE,
  travel_distance_miles INTEGER,

  -- Contact
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Media
  images JSONB,  -- Array of {url, caption, sortOrder}
  video_url VARCHAR(500),

  -- Availability
  accepts_new_clients BOOLEAN DEFAULT TRUE,
  availability_text VARCHAR(200),

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
    -- Values: 'draft', 'active', 'paused'
  published_at TIMESTAMP,
  paused_at TIMESTAMP,

  -- Stats
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,

  -- SEO
  meta_title VARCHAR(200),
  meta_description VARCHAR(300),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_service_status CHECK (status IN ('draft', 'active', 'paused')),
  CONSTRAINT chk_price_type CHECK (price_type IN ('fixed', 'starting_at', 'hourly', 'daily', 'per_session', 'contact'))
);

CREATE INDEX idx_service_listings_provider ON service_listings(provider_id);
CREATE INDEX idx_service_listings_slug ON service_listings(slug);
CREATE INDEX idx_service_listings_category ON service_listings(category, subcategory);
CREATE INDEX idx_service_listings_status ON service_listings(status);
CREATE INDEX idx_service_listings_location ON service_listings(state, city);
```

**TypeScript Interface**:
```typescript
interface ServiceListing {
  id: number;
  providerId: number;

  // Basic info
  slug: string;
  title: string;
  description?: string;

  // Category
  category: string;
  subcategory?: string;
  categoryMetadata?: object;

  // Pricing
  priceCents?: number;
  priceType: "fixed" | "starting_at" | "hourly" | "daily" | "per_session" | "contact";
  priceText?: string;

  // Service details
  durationText?: string;
  serviceAreaText?: string;

  // Location
  city?: string;
  state?: string;
  country: string;
  mobileService: boolean;
  travelDistanceMiles?: number;

  // Contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Media
  images?: object[];
  videoUrl?: string;

  // Availability
  acceptsNewClients: boolean;
  availabilityText?: string;

  // Status
  status: "draft" | "active" | "paused";
  publishedAt?: Date;
  pausedAt?: Date;

  // Stats
  viewCount: number;
  inquiryCount: number;
  bookingCount: number;

  // SEO
  metaTitle?: string;
  metaDescription?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 4. MarketplaceTransaction

```sql
CREATE TABLE marketplace_transactions (
  id SERIAL PRIMARY KEY,

  -- Parties
  provider_id INTEGER NOT NULL,
  provider_tenant_id INTEGER,  -- Only if breeder
  client_id INTEGER NOT NULL,

  -- Listing
  listing_id INTEGER NOT NULL,
  listing_type VARCHAR(50) NOT NULL,
    -- Values: 'service', 'animal', 'offspring_group'

  -- Payment & Invoice
  payment_mode VARCHAR(50) NOT NULL,
    -- Values: 'stripe', 'manual'

  -- Stripe (if payment_mode = 'stripe')
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),

  -- Tenant invoice (if breeder)
  tenant_invoice_id INTEGER,  -- Links to tenant Invoice.id

  -- Marketplace invoice (if service provider without tenant)
  marketplace_invoice_id INTEGER,  -- Links to MarketplaceInvoice.id

  -- Pricing
  total_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER DEFAULT 0,  -- Ready for future fees
  stripe_fee_cents INTEGER DEFAULT 0,
  provider_payout_cents INTEGER,

  -- Status
  status VARCHAR(50) DEFAULT 'pending_invoice',
    -- Values: 'pending_invoice', 'invoiced', 'paid', 'refunded', 'disputed', 'cancelled'

  -- Timestamps
  invoiced_at TIMESTAMP,
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  -- Notes
  buyer_notes TEXT,
  provider_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_transaction_listing_type CHECK (listing_type IN ('service', 'animal', 'offspring_group')),
  CONSTRAINT chk_transaction_payment_mode CHECK (payment_mode IN ('stripe', 'manual')),
  CONSTRAINT chk_transaction_status CHECK (status IN ('pending_invoice', 'invoiced', 'paid', 'refunded', 'disputed', 'cancelled'))
);

CREATE INDEX idx_transactions_provider ON marketplace_transactions(provider_id);
CREATE INDEX idx_transactions_client ON marketplace_transactions(client_id);
CREATE INDEX idx_transactions_listing ON marketplace_transactions(listing_type, listing_id);
CREATE INDEX idx_transactions_status ON marketplace_transactions(status);
CREATE INDEX idx_transactions_stripe_invoice ON marketplace_transactions(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_transactions_tenant_invoice ON marketplace_transactions(provider_tenant_id, tenant_invoice_id) WHERE tenant_invoice_id IS NOT NULL;
```

**TypeScript Interface**:
```typescript
interface MarketplaceTransaction {
  id: number;

  // Parties
  providerId: number;
  providerTenantId?: number;
  clientId: number;

  // Listing
  listingId: number;
  listingType: "service" | "animal" | "offspring_group";

  // Payment & Invoice
  paymentMode: "stripe" | "manual";

  // Stripe
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;

  // Invoice linking
  tenantInvoiceId?: number;
  marketplaceInvoiceId?: number;

  // Pricing
  totalCents: number;
  platformFeeCents: number;
  stripeFeeCents: number;
  providerPayoutCents?: number;

  // Status
  status: "pending_invoice" | "invoiced" | "paid" | "refunded" | "disputed" | "cancelled";

  // Timestamps
  invoicedAt?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  cancelledAt?: Date;

  // Notes
  buyerNotes?: string;
  providerNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 5. MarketplaceInvoice

```sql
CREATE TABLE marketplace_invoices (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  transaction_id INTEGER NOT NULL,

  -- Invoice details
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  total_cents INTEGER NOT NULL,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',
    -- Values: 'draft', 'sent', 'pending_confirmation', 'paid', 'void'

  -- Payment mode
  payment_mode VARCHAR(50) NOT NULL,
    -- Values: 'stripe', 'manual'

  -- Stripe (if payment_mode = 'stripe')
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),

  -- Manual payment (if payment_mode = 'manual')
  payment_instructions TEXT,

  -- Buyer payment marking
  buyer_marked_paid_at TIMESTAMP,
  buyer_payment_method VARCHAR(50),
  buyer_payment_reference VARCHAR(255),

  -- Provider confirmation
  provider_confirmed_at TIMESTAMP,
  provider_confirmed_by INTEGER,

  -- Dates
  due_date TIMESTAMP,
  paid_at TIMESTAMP,

  -- Line items (JSON)
  line_items JSONB NOT NULL,
    -- [{description, quantity, unitPriceCents, totalCents}]

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_invoice_status CHECK (status IN ('draft', 'sent', 'pending_confirmation', 'paid', 'void')),
  CONSTRAINT chk_invoice_payment_mode CHECK (payment_mode IN ('stripe', 'manual'))
);

CREATE INDEX idx_marketplace_invoices_provider ON marketplace_invoices(provider_id);
CREATE INDEX idx_marketplace_invoices_client ON marketplace_invoices(client_id);
CREATE INDEX idx_marketplace_invoices_transaction ON marketplace_invoices(transaction_id);
CREATE INDEX idx_marketplace_invoices_number ON marketplace_invoices(invoice_number);
CREATE INDEX idx_marketplace_invoices_stripe ON marketplace_invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
CREATE INDEX idx_marketplace_invoices_pending ON marketplace_invoices(status) WHERE status = 'pending_confirmation';
```

**TypeScript Interface**:
```typescript
interface MarketplaceInvoice {
  id: number;
  providerId: number;
  clientId: number;
  transactionId: number;

  // Invoice details
  invoiceNumber: string;
  totalCents: number;

  // Status
  status: "draft" | "sent" | "pending_confirmation" | "paid" | "void";

  // Payment mode
  paymentMode: "stripe" | "manual";

  // Stripe
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;

  // Manual payment
  paymentInstructions?: string;

  // Buyer payment marking
  buyerMarkedPaidAt?: Date;
  buyerPaymentMethod?: string;
  buyerPaymentReference?: string;

  // Provider confirmation
  providerConfirmedAt?: Date;
  providerConfirmedBy?: number;

  // Dates
  dueDate?: Date;
  paidAt?: Date;

  // Line items
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;

  // Notes
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 6. MarketplaceContact

```sql
CREATE TABLE marketplace_contacts (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,

  -- Cached from User for convenience
  name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),

  -- Provider's notes
  notes TEXT,
  tags VARCHAR(255)[],

  -- Relationship stats
  first_contacted_at TIMESTAMP NOT NULL,
  last_message_at TIMESTAMP,
  total_transactions INTEGER DEFAULT 0,
  total_spent_cents BIGINT DEFAULT 0,
  last_transaction_at TIMESTAMP,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
    -- Values: 'active', 'blocked'
  blocked_reason TEXT,
  blocked_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_contact_status CHECK (status IN ('active', 'blocked')),
  CONSTRAINT uq_marketplace_contact UNIQUE (provider_id, user_id)
);

CREATE INDEX idx_marketplace_contacts_provider ON marketplace_contacts(provider_id);
CREATE INDEX idx_marketplace_contacts_user ON marketplace_contacts(user_id);
CREATE INDEX idx_marketplace_contacts_status ON marketplace_contacts(provider_id, status);
```

**TypeScript Interface**:
```typescript
interface MarketplaceContact {
  id: number;
  providerId: number;
  userId: number;

  // Cached from User
  name?: string;
  email?: string;
  phone?: string;

  // Provider's notes
  notes?: string;
  tags?: string[];

  // Relationship stats
  firstContactedAt: Date;
  lastMessageAt?: Date;
  totalTransactions: number;
  totalSpentCents: number;
  lastTransactionAt?: Date;

  // Status
  status: "active" | "blocked";
  blockedReason?: string;
  blockedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 7. MessageThread

```sql
CREATE TABLE message_threads (
  id SERIAL PRIMARY KEY,

  -- Parties
  provider_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,

  -- Context
  listing_id INTEGER NOT NULL,
  listing_type VARCHAR(50) NOT NULL,
    -- Values: 'service', 'animal', 'offspring_group', 'program'

  -- Transaction linkage
  transaction_id INTEGER,

  -- Status
  status VARCHAR(50) DEFAULT 'open',
    -- Values: 'open', 'archived', 'blocked'

  -- Tracking
  last_message_at TIMESTAMP,
  last_message_from VARCHAR(50),  -- 'provider' or 'client'

  -- Unread counts
  provider_unread_count INTEGER DEFAULT 0,
  client_unread_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_thread_listing_type CHECK (listing_type IN ('service', 'animal', 'offspring_group', 'program')),
  CONSTRAINT chk_thread_status CHECK (status IN ('open', 'archived', 'blocked')),
  CONSTRAINT uq_message_thread UNIQUE (provider_id, client_id, listing_id, listing_type)
);

CREATE INDEX idx_message_threads_provider ON message_threads(provider_id, status);
CREATE INDEX idx_message_threads_client ON message_threads(client_id, status);
CREATE INDEX idx_message_threads_transaction ON message_threads(transaction_id) WHERE transaction_id IS NOT NULL;
```

**TypeScript Interface**:
```typescript
interface MessageThread {
  id: number;

  // Parties
  providerId: number;
  clientId: number;

  // Context
  listingId: number;
  listingType: "service" | "animal" | "offspring_group" | "program";

  // Transaction linkage
  transactionId?: number;

  // Status
  status: "open" | "archived" | "blocked";

  // Tracking
  lastMessageAt?: Date;
  lastMessageFrom?: "provider" | "client";

  // Unread counts
  providerUnreadCount: number;
  clientUnreadCount: number;

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 8. Message

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL,

  -- Sender
  sender_id INTEGER NOT NULL,
  sender_type VARCHAR(50) NOT NULL,
    -- Values: 'provider', 'client'

  -- Content
  message_text TEXT NOT NULL,
  attachments JSONB,  -- [{url, fileName, fileSize, mimeType}]

  -- Email integration
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_message_id VARCHAR(255),

  -- Read tracking
  read_at TIMESTAMP,
  read_by INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_message_sender_type CHECK (sender_type IN ('provider', 'client'))
);

CREATE INDEX idx_messages_thread ON messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(thread_id, read_at) WHERE read_at IS NULL;
```

**TypeScript Interface**:
```typescript
interface Message {
  id: number;
  threadId: number;

  // Sender
  senderId: number;
  senderType: "provider" | "client";

  // Content
  messageText: string;
  attachments?: Array<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;

  // Email integration
  sentViaEmail: boolean;
  emailMessageId?: string;

  // Read tracking
  readAt?: Date;
  readBy?: number;

  createdAt: Date;
}
```

---

## Cross-Database Relationships

### Key Linking Strategies

#### 1. Breeder → Marketplace

```typescript
// Get marketplace provider from tenant
async function getMarketplaceProvider(tenantId: number) {
  // Query marketplace DB
  return await MarketplaceProvider.findOne({
    where: { tenantId }
  });
}

// Get marketplace user from tenant user
async function getMarketplaceUser(tenantUserId: number) {
  // Need to link via email or create mapping table
  const tenantUser = await getTenantUser(tenantUserId);
  return await User.findOne({
    where: { email: tenantUser.email }
  });
}
```

#### 2. Marketplace → Tenant

```typescript
// Get tenant invoice for transaction
async function getTenantInvoice(transaction: MarketplaceTransaction) {
  if (!transaction.providerTenantId || !transaction.tenantInvoiceId) {
    return null;
  }

  // Query tenant DB
  return await queryTenantDatabase(
    transaction.providerTenantId,
    `SELECT * FROM invoices WHERE id = $1`,
    [transaction.tenantInvoiceId]
  );
}

// Get tenant contact for marketplace user
async function getTenantContact(tenantId: number, marketplaceUserId: number) {
  return await queryTenantDatabase(
    tenantId,
    `SELECT * FROM contacts WHERE marketplace_user_id = $1`,
    [marketplaceUserId]
  );
}
```

#### 3. Invoice Resolution (Universal)

```typescript
// Get invoice for any transaction (handles both tenant and marketplace invoices)
async function getInvoiceForTransaction(transaction: MarketplaceTransaction) {
  if (transaction.tenantInvoiceId && transaction.providerTenantId) {
    // Breeder invoice - query tenant DB
    return {
      type: 'tenant',
      invoice: await getTenantInvoice(
        transaction.providerTenantId,
        transaction.tenantInvoiceId
      )
    };
  } else if (transaction.marketplaceInvoiceId) {
    // Service provider invoice - query marketplace DB
    return {
      type: 'marketplace',
      invoice: await MarketplaceInvoice.findById(
        transaction.marketplaceInvoiceId
      )
    };
  } else {
    return null;
  }
}
```

---

## State Machines

### 1. Transaction Status Flow

```
pending_invoice → invoiced → paid
                    ↓          ↓
                cancelled   refunded
                            ↓
                         disputed
```

**State Definitions**:
- `pending_invoice`: Transaction created, waiting for provider to invoice
- `invoiced`: Invoice sent to buyer
- `paid`: Payment received and confirmed
- `refunded`: Payment refunded to buyer
- `disputed`: Payment disputed (chargeback, etc.)
- `cancelled`: Transaction cancelled before payment

**Transitions**:
```typescript
const ALLOWED_TRANSITIONS = {
  'pending_invoice': ['invoiced', 'cancelled'],
  'invoiced': ['paid', 'cancelled'],
  'paid': ['refunded'],
  'refunded': ['disputed'],
  'disputed': [], // Terminal state
  'cancelled': []  // Terminal state
};
```

---

### 2. Invoice Status Flow (Tenant & Marketplace)

```
draft → sent → pending_confirmation → paid
         ↓              ↓               ↓
       void          void            void
         ↓
     overdue
```

**State Definitions**:
- `draft`: Invoice created but not sent
- `sent`: Invoice sent to buyer (or buyer notified)
- `pending_confirmation`: Buyer marked paid (manual mode), awaiting provider confirmation
- `paid`: Payment confirmed
- `void`: Invoice cancelled/voided
- `overdue`: Past due date and unpaid

**Transitions (Stripe Mode)**:
```typescript
const STRIPE_TRANSITIONS = {
  'draft': ['sent', 'void'],
  'sent': ['paid', 'overdue', 'void'],
  'paid': [], // Terminal state
  'void': [], // Terminal state
  'overdue': ['paid', 'void']
};
```

**Transitions (Manual Mode)**:
```typescript
const MANUAL_TRANSITIONS = {
  'draft': ['sent', 'void'],
  'sent': ['pending_confirmation', 'overdue', 'void'],
  'pending_confirmation': ['paid', 'sent', 'void'], // Can revert if dispute
  'paid': [], // Terminal state
  'void': [], // Terminal state
  'overdue': ['pending_confirmation', 'void']
};
```

---

### 3. Provider Verification Status

```
unverified → email_verified → phone_verified → identity_verified → background_checked
```

**Each level unlocks features**:
- `unverified`: Can browse only
- `email_verified`: Can create draft listings
- `phone_verified`: Can publish service listings
- `identity_verified`: Can publish animal/offspring listings
- `background_checked`: Badge displayed, higher search ranking

---

## Indexes & Performance

### Critical Indexes

#### Tenant Database

```sql
-- Contact lookups by marketplace user
CREATE INDEX idx_contacts_marketplace_user
  ON contacts(tenant_id, marketplace_user_id)
  WHERE marketplace_user_id IS NOT NULL;

-- Marketplace invoice filtering
CREATE INDEX idx_invoices_marketplace
  ON invoices(tenant_id, is_marketplace_invoice, status)
  WHERE is_marketplace_invoice = TRUE;

-- Pending confirmation invoices
CREATE INDEX idx_invoices_pending_confirmation
  ON invoices(tenant_id, status)
  WHERE status = 'pending_confirmation';

-- Stripe invoice lookups
CREATE INDEX idx_invoices_stripe
  ON invoices(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;
```

#### Marketplace Database

```sql
-- Provider dashboard queries
CREATE INDEX idx_transactions_provider_status
  ON marketplace_transactions(provider_id, status, created_at DESC);

-- Buyer dashboard queries
CREATE INDEX idx_transactions_client_status
  ON marketplace_transactions(client_id, status, created_at DESC);

-- Message thread queries
CREATE INDEX idx_threads_provider_unread
  ON message_threads(provider_id, status, provider_unread_count)
  WHERE provider_unread_count > 0;

CREATE INDEX idx_threads_client_unread
  ON message_threads(client_id, status, client_unread_count)
  WHERE client_unread_count > 0;

-- Service search
CREATE INDEX idx_service_listings_search
  ON service_listings(status, category, state, city)
  WHERE status = 'active';
```

---

## Migration Plan

### Phase 1: Tenant Database Updates

```sql
-- Run on existing tenant database
BEGIN;

-- 1. Update Tenant table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketplace_payment_mode VARCHAR(50) DEFAULT 'manual';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketplace_payment_instructions TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_mode_changed_at TIMESTAMP;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_mode_changed_by INTEGER;

-- 2. Update Contact table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_user_id INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'MANUAL';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_first_contacted_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_total_transactions INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_total_spent_cents INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_last_transaction_at TIMESTAMP;

CREATE INDEX idx_contacts_marketplace_user
  ON contacts(tenant_id, marketplace_user_id)
  WHERE marketplace_user_id IS NOT NULL;

-- 3. Update Invoice table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_marketplace_invoice BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS marketplace_transaction_id INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50) DEFAULT 'manual';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_notes TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_marked_paid_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_payment_method VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_payment_reference VARCHAR(255);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS breeder_confirmed_at TIMESTAMP;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS breeder_confirmed_by INTEGER;

-- Update status constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_invoice_status;
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_status
  CHECK (status IN ('draft', 'sent', 'pending_confirmation', 'paid', 'void', 'overdue'));

CREATE INDEX idx_invoices_marketplace
  ON invoices(tenant_id, is_marketplace_invoice, status)
  WHERE is_marketplace_invoice = TRUE;

CREATE INDEX idx_invoices_stripe
  ON invoices(stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- 4. Update BreedingProgram table
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS allow_automatic_waitlist_reservations BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS require_application_form BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS require_deposit_to_reserve BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS deposit_amount_cents INTEGER;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS marketplace_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE breeding_programs ADD COLUMN IF NOT EXISTS marketplace_featured_until TIMESTAMP;

COMMIT;
```

### Phase 2: Marketplace Database Creation

```sql
-- Create new marketplace database
CREATE DATABASE breederhq_marketplace;

-- Run all CREATE TABLE statements from sections above:
-- - users
-- - marketplace_providers
-- - service_listings
-- - marketplace_transactions
-- - marketplace_invoices
-- - marketplace_contacts
-- - message_threads
-- - messages
```

### Phase 3: Data Cleanup

```sql
-- Archive old marketplace listings (tenant DB)
BEGIN;

-- Option A: Soft delete
UPDATE marketplace_listings SET status = 'archived', archived_at = NOW();

-- Option B: Hard delete (if confirmed no data needed)
DELETE FROM marketplace_listings;

COMMIT;
```

---

## API Endpoints

### Breeder Invoice Creation

**Endpoint**: `POST /api/v1/tenants/:tenantId/invoices`

**Request**:
```typescript
{
  contactId: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  dueDate?: string;
  notes?: string;
}
```

**Flow**:
```typescript
async function createBreederInvoice(req, res) {
  const { tenantId } = req.params;
  const { contactId, lineItems, dueDate, notes } = req.body;

  // 1. Get contact
  const contact = await Contact.findOne({
    where: { tenantId, id: contactId }
  });

  // 2. Create tenant invoice
  const invoice = await Invoice.create({
    tenantId,
    contactId,
    invoiceNumber: await generateInvoiceNumber(tenantId),
    totalCents: calculateTotal(lineItems),
    status: 'draft',
    isMarketplaceInvoice: !!contact.marketplaceUserId,
    paymentMode: 'manual', // Default, will update if Stripe
    dueDate
  });

  // 3. If marketplace contact, check payment mode
  if (contact.marketplaceUserId) {
    const tenant = await Tenant.findById(tenantId);

    if (tenant.marketplacePaymentMode === 'stripe' && tenant.stripeConnectAccountId) {
      // Create Stripe invoice
      const marketplaceUser = await getMarketplaceUser(contact.marketplaceUserId);

      const stripeInvoice = await stripe.invoices.create({
        customer: marketplaceUser.stripeCustomerId,
        account: tenant.stripeConnectAccountId,
        collection_method: 'send_invoice',
        metadata: {
          tenantId,
          tenantInvoiceId: invoice.id,
          marketplaceUserId: contact.marketplaceUserId
        },
        custom_fields: [
          { name: "Invoice Number", value: `MKT-${invoice.invoiceNumber}` }
        ],
        line_items: lineItems.map(item => ({
          amount: item.unitPriceCents * item.quantity,
          description: item.description,
          quantity: item.quantity
        }))
      });

      // Update invoice with Stripe ID
      await invoice.update({
        stripeInvoiceId: stripeInvoice.id,
        paymentMode: 'stripe'
      });

      // Update marketplace transaction
      await MarketplaceTransaction.update({
        where: {
          providerTenantId: tenantId,
          clientId: contact.marketplaceUserId,
          status: 'pending_invoice'
        },
        data: {
          stripeInvoiceId: stripeInvoice.id,
          tenantInvoiceId: invoice.id,
          status: 'invoiced',
          invoicedAt: new Date()
        }
      });
    } else {
      // Manual payment mode
      await invoice.update({
        paymentMode: 'manual'
      });

      // Update marketplace transaction
      await MarketplaceTransaction.update({
        where: {
          providerTenantId: tenantId,
          clientId: contact.marketplaceUserId,
          status: 'pending_invoice'
        },
        data: {
          tenantInvoiceId: invoice.id,
          paymentMode: 'manual',
          status: 'invoiced',
          invoicedAt: new Date()
        }
      });
    }

    // Notify marketplace buyer
    await sendMarketplaceInvoiceNotification(contact.marketplaceUserId, invoice);
  }

  return res.json({ invoice });
}
```

---

### Service Provider Invoice Creation

**Endpoint**: `POST /api/v1/marketplace/invoices`

**Request**:
```typescript
{
  transactionId: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  dueDate?: string;
  notes?: string;
}
```

**Flow**:
```typescript
async function createServiceProviderInvoice(req, res) {
  const { transactionId, lineItems, dueDate, notes } = req.body;
  const providerId = req.user.providerId;

  // 1. Get transaction
  const transaction = await MarketplaceTransaction.findOne({
    where: { id: transactionId, providerId }
  });

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  // 2. Get provider
  const provider = await MarketplaceProvider.findById(providerId);

  // 3. Generate invoice number
  const invoiceNumber = await generateMarketplaceInvoiceNumber(providerId);

  // 4. Create marketplace invoice
  const invoice = await MarketplaceInvoice.create({
    providerId,
    clientId: transaction.clientId,
    transactionId,
    invoiceNumber,
    totalCents: calculateTotal(lineItems),
    status: 'draft',
    paymentMode: provider.paymentMode,
    paymentInstructions: provider.paymentInstructions,
    lineItems,
    dueDate,
    notes
  });

  // 5. If Stripe mode, create Stripe invoice
  if (provider.paymentMode === 'stripe' && provider.stripeConnectAccountId) {
    const client = await User.findById(transaction.clientId);

    const stripeInvoice = await stripe.invoices.create({
      customer: client.stripeCustomerId,
      account: provider.stripeConnectAccountId,
      collection_method: 'send_invoice',
      metadata: {
        marketplaceInvoiceId: invoice.id,
        transactionId
      },
      custom_fields: [
        { name: "Invoice Number", value: invoiceNumber }
      ],
      line_items: lineItems.map(item => ({
        amount: item.unitPriceCents * item.quantity,
        description: item.description,
        quantity: item.quantity
      }))
    });

    await invoice.update({
      stripeInvoiceId: stripeInvoice.id
    });

    await transaction.update({
      stripeInvoiceId: stripeInvoice.id,
      marketplaceInvoiceId: invoice.id,
      status: 'invoiced',
      invoicedAt: new Date()
    });
  } else {
    // Manual mode
    await transaction.update({
      marketplaceInvoiceId: invoice.id,
      paymentMode: 'manual',
      status: 'invoiced',
      invoicedAt: new Date()
    });
  }

  // 6. Notify buyer
  await sendMarketplaceInvoiceNotification(transaction.clientId, invoice);

  return res.json({ invoice });
}
```

---

### Buyer Marks Invoice Paid (Manual Mode)

**Endpoint**: `POST /api/v1/marketplace/invoices/:id/mark-paid`

**Request**:
```typescript
{
  paymentMethod: string;  // "venmo", "zelle", etc.
  paymentReference?: string;
}
```

**Flow**:
```typescript
async function markInvoicePaid(req, res) {
  const { id } = req.params;
  const { paymentMethod, paymentReference } = req.body;
  const userId = req.user.id;

  // 1. Get invoice (could be tenant or marketplace)
  const transaction = await MarketplaceTransaction.findOne({
    where: { clientId: userId }
  });

  if (transaction.tenantInvoiceId) {
    // Tenant invoice
    const invoice = await getTenantInvoice(
      transaction.providerTenantId,
      transaction.tenantInvoiceId
    );

    await updateTenantInvoice(transaction.providerTenantId, invoice.id, {
      buyerMarkedPaidAt: new Date(),
      buyerPaymentMethod: paymentMethod,
      buyerPaymentReference: paymentReference,
      status: 'pending_confirmation'
    });

    // Notify breeder
    await notifyBreederPaymentConfirmationNeeded(
      transaction.providerId,
      invoice.id
    );

  } else if (transaction.marketplaceInvoiceId) {
    // Marketplace invoice
    await MarketplaceInvoice.update({
      where: { id: transaction.marketplaceInvoiceId },
      data: {
        buyerMarkedPaidAt: new Date(),
        buyerPaymentMethod: paymentMethod,
        buyerPaymentReference: paymentReference,
        status: 'pending_confirmation'
      }
    });

    // Notify service provider
    await notifyProviderPaymentConfirmationNeeded(
      transaction.providerId,
      transaction.marketplaceInvoiceId
    );
  }

  return res.json({ success: true });
}
```

---

### Provider Confirms Payment (Manual Mode)

**Endpoint**: `POST /api/v1/invoices/:id/confirm-payment`

**Request**: None

**Flow**:
```typescript
async function confirmPayment(req, res) {
  const { id } = req.params;
  const providerId = req.user.providerId;

  // Determine invoice type
  const invoice = await getInvoiceById(id); // Helper that checks both DBs

  if (invoice.type === 'tenant') {
    // Tenant invoice
    await updateTenantInvoice(invoice.tenantId, invoice.id, {
      status: 'paid',
      paidAt: new Date(),
      breederConfirmedAt: new Date(),
      breederConfirmedBy: req.user.id
    });

    // Update transaction
    await MarketplaceTransaction.update({
      where: { tenantInvoiceId: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date()
      }
    });

  } else {
    // Marketplace invoice
    await MarketplaceInvoice.update({
      where: { id: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        providerConfirmedAt: new Date(),
        providerConfirmedBy: providerId
      }
    });

    // Update transaction
    await MarketplaceTransaction.update({
      where: { marketplaceInvoiceId: invoice.id },
      data: {
        status: 'paid',
        paidAt: new Date()
      }
    });
  }

  // Notify buyer
  await notifyBuyerPaymentConfirmed(invoice.clientId, invoice.id);

  return res.json({ success: true });
}
```

---

## Webhook Handlers

### Stripe Invoice Paid

```typescript
async function handleStripeInvoicePaid(stripeInvoice) {
  const { metadata } = stripeInvoice;

  // Check if tenant invoice or marketplace invoice
  if (metadata.tenantId && metadata.tenantInvoiceId) {
    // Tenant invoice (breeder)
    await updateTenantInvoice(metadata.tenantId, metadata.tenantInvoiceId, {
      status: 'paid',
      paidAt: new Date(),
      stripePaymentIntentId: stripeInvoice.payment_intent
    });

    // Update marketplace transaction
    await MarketplaceTransaction.update({
      where: {
        providerTenantId: metadata.tenantId,
        tenantInvoiceId: metadata.tenantInvoiceId
      },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripePaymentIntentId: stripeInvoice.payment_intent
      }
    });

  } else if (metadata.marketplaceInvoiceId) {
    // Marketplace invoice (service provider)
    await MarketplaceInvoice.update({
      where: { id: metadata.marketplaceInvoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripePaymentIntentId: stripeInvoice.payment_intent
      }
    });

    // Update transaction
    await MarketplaceTransaction.update({
      where: { marketplaceInvoiceId: metadata.marketplaceInvoiceId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        stripePaymentIntentId: stripeInvoice.payment_intent
      }
    });
  }

  // Update contact stats
  await updateContactStats(metadata.marketplaceUserId);

  // Send notifications
  await sendPaymentConfirmationEmails(stripeInvoice);
}
```

### Stripe Invoice Failed

```typescript
async function handleStripeInvoiceFailed(stripeInvoice) {
  // Log error
  console.error('Stripe invoice failed:', stripeInvoice.id);

  // Notify provider
  const { metadata } = stripeInvoice;
  await notifyProviderPaymentFailed(metadata);

  // Optionally revert transaction status
  // (keep as 'invoiced' so provider can retry)
}
```

---

## Error Handling

### Scenario 1: Stripe Invoice Creation Fails

**Problem**: Breeder creates invoice, but Stripe API fails.

**Solution**:
```typescript
try {
  const stripeInvoice = await stripe.invoices.create({...});
  await invoice.update({ stripeInvoiceId: stripeInvoice.id });
} catch (error) {
  // Log error
  console.error('Stripe invoice creation failed:', error);

  // Keep tenant invoice in draft
  // Mark as needs retry
  await invoice.update({
    paymentMode: 'manual', // Fallback to manual
    notes: `Stripe integration failed: ${error.message}. Please create invoice manually or retry.`
  });

  // Notify breeder
  await notifyBreederStripeError(invoice.tenantId, error);

  // Still allow manual payment as fallback
}
```

### Scenario 2: Webhook Delivery Failure

**Problem**: Stripe sends webhook, but our handler fails.

**Solution**:
```typescript
// Stripe will retry webhooks automatically
// Implement idempotency
async function handleWebhook(event) {
  // Check if already processed
  const processed = await WebhookLog.findOne({
    where: { stripeEventId: event.id }
  });

  if (processed) {
    return { status: 'already_processed' };
  }

  // Process event
  try {
    await processWebhookEvent(event);

    // Log success
    await WebhookLog.create({
      stripeEventId: event.id,
      eventType: event.type,
      processedAt: new Date(),
      status: 'success'
    });
  } catch (error) {
    // Log failure
    await WebhookLog.create({
      stripeEventId: event.id,
      eventType: event.type,
      processedAt: new Date(),
      status: 'failed',
      errorMessage: error.message
    });

    throw error; // Let Stripe retry
  }
}
```

### Scenario 3: Payment Mode Switch Mid-Transaction

**Problem**: Breeder switches from manual to Stripe after invoicing buyer.

**Solution**:
```typescript
// Freeze payment mode at invoice creation
interface Invoice {
  paymentMode: "stripe" | "manual";  // Never changes after creation
}

// Tenant setting only affects NEW invoices
interface Tenant {
  marketplacePaymentMode: "stripe" | "manual";  // For new invoices
}

// Existing invoices remain in their original mode
// Buyer sees consistent experience
```

### Scenario 4: Buyer Marks Paid but Provider Disputes

**Problem**: Buyer claims they paid via Venmo, but provider says no payment received.

**Solution**:
```typescript
// Provider can dispute
async function disputePayment(invoiceId, reason) {
  await invoice.update({
    status: 'sent',  // Revert to sent
    buyerMarkedPaidAt: null,
    buyerPaymentMethod: null,
    buyerPaymentReference: null,
    disputeReason: reason,
    disputedAt: new Date()
  });

  // Notify buyer
  await notifyBuyerPaymentDisputed(invoice.clientId, reason);

  // Create support ticket for manual resolution
  await createSupportTicket({
    type: 'payment_dispute',
    invoiceId,
    providerId: invoice.providerId,
    clientId: invoice.clientId,
    reason
  });
}
```

---

## Summary

### What's New

**Tenant Database**:
- Marketplace payment settings on `Tenant`
- Marketplace user linking on `Contact`
- Marketplace invoice tracking on `Invoice`
- Waitlist reservation settings on `BreedingProgram`

**Marketplace Database** (Entirely New):
- User authentication and profiles
- Provider profiles (breeders + service providers)
- Service listings with hierarchical taxonomy
- Transactions linking listings to payments
- Marketplace invoices for service providers
- Marketplace contacts for provider CRM
- Message threads and messages

### Key Features Supported

✅ Dual payment modes (Stripe + manual)
✅ Breeder invoice integration with tenant
✅ Service provider standalone invoicing
✅ Buyer payment marking + provider confirmation
✅ Cross-database transaction tracking
✅ Marketplace contact management
✅ Messaging system
✅ Financial reporting in tenant Finance module

### Migration Checklist

- [ ] Review and approve schema design
- [ ] Run Phase 1 migrations on tenant DB (test environment)
- [ ] Create marketplace database (Phase 2)
- [ ] Archive old marketplace listings (Phase 3)
- [ ] Test cross-database queries
- [ ] Implement API endpoints
- [ ] Set up Stripe webhooks
- [ ] Test invoice flows (Stripe + manual)
- [ ] Deploy to production
- [ ] Monitor for errors

---

**Ready for Implementation!**
