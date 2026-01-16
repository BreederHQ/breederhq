# BreederHQ: 2-Week MVP Implementation Plan
## Solo Founder + AI Assistance

**Created**: 2026-01-12
**Target Launch**: End of January 2026
**Team**: 1 Backend Engineer + Claude AI
**Environment**: Dev/Prototype (0 active tenants)
**Initial Scale**: 10 service providers, 10 marketplace users
**Budget**: Minimal (startup phase)

---

## Executive Summary

This plan strips down the comprehensive 8-week enterprise plan to a realistic 2-week MVP scope suitable for a solo founder using AI assistance. It focuses on **getting marketplace and client portal functional** with minimal viable security, accepting some technical debt with an explicit post-launch hardening plan.

### Key Principle: Ship Fast, Harden Later

Given you're in prototype stage with zero active tenants, we can:
- Use simplified authentication/authorization initially
- Defer complex RLS policies until post-launch
- Skip some performance optimizations (not needed for 20 users)
- Implement basic audit logging vs comprehensive
- Accept some technical debt with clear remediation timeline

### What We're Building

1. **Marketplace functionality** for service providers and consumers
2. **Client portal** for breeders' customers
3. **Manual payment tracking** for marketplace transactions (Stripe optional)
4. **Critical schema fixes** only (security, data integrity)
5. **Minimum viable API changes** to support above

---

## Critical Scope Decisions

### IN SCOPE (2 Weeks)

**Week 1: Database & Core Infrastructure**
- Essential schema changes (security, data types, marketplace tables)
- Basic marketplace tables (users, listings, transactions)
- Contact-to-marketplace-user linking
- Manual payment tracking support
- Critical security fixes (tenant isolation, soft deletes)

**Week 2: APIs & Portal Functionality**
- Marketplace listing CRUD APIs
- Transaction recording APIs (manual payments)
- Client portal authentication
- Basic authorization middleware
- Minimal frontend integration points

### OUT OF SCOPE (Post-Launch)

Deferred to 2-4 weeks post-launch:
- Advanced RLS policies (use app-level auth for MVP)
- Comprehensive audit logging (basic logging only)
- Performance optimizations (not needed for 20 users)
- Stripe webhook idempotency (if using Stripe at all)
- Table partitioning
- Complex composite indexes (add based on actual slow queries)
- Full dual payment mode support (start with manual tracking only)

---

## Payment Architecture Clarification

Based on your feedback, here's the simplified approach:

### For Marketplace Service Providers (marketplace.breederhq.com)
- **Option 1**: Handle payments privately (Venmo/PayPal/etc) - platform doesn't track
- **Option 2**: Record transaction manually in platform for bookkeeping
- **Option 3** (future): Use Stripe pass-through - they pay Stripe fees

### For Breeder Tenants (app.breederhq.com)
- **Existing**: Can create invoices for their breeding business
- **New**: Can record marketplace service transactions manually
- **Key Insight**: No need to link Invoice to marketplace consumer unless using Stripe

### Simplified Schema Approach
Instead of dual invoices, we'll use a simple transaction recording table:

```sql
-- Marketplace transaction log (manual tracking)
CREATE TABLE marketplace.transactions (
  id SERIAL PRIMARY KEY,

  -- Who's involved
  provider_tenant_id INTEGER NOT NULL,  -- The breeder/service provider
  client_party_id INTEGER,              -- Optional: if client is in their contacts
  client_description TEXT,              -- Fallback: "Jane Doe - puppy training"

  -- What happened
  service_description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- When & status
  transaction_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',  -- completed, pending, cancelled
  payment_method VARCHAR(50),              -- cash, venmo, paypal, stripe, etc

  -- Optional Stripe reference (if they used Stripe)
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_provider ON marketplace.transactions(provider_tenant_id, transaction_date DESC);
CREATE INDEX idx_transactions_client ON marketplace.transactions(client_party_id) WHERE client_party_id IS NOT NULL;
```

**Key Benefits**:
- No complex dual-invoice synchronization
- Breeders can track marketplace earnings separate from breeding business
- Optional link to existing Contact/Party if client is already in their system
- Stripe is truly optional - just another payment method
- Simple to query for financial reporting

---

## Week 1: Database & Core Infrastructure

### Day 1-2: Critical Schema Changes (MUST HAVE)

**Priority**: Security & Data Integrity

#### Changes to Existing Tenant Schema

```sql
-- 1. Add marketplace user linking to contacts (tenant isolation fix)
ALTER TABLE contacts ADD COLUMN marketplace_user_id INTEGER;

-- Compound index prevents cross-tenant leakage
CREATE UNIQUE INDEX idx_contacts_marketplace_user_tenant
  ON contacts(marketplace_user_id, tenant_id)
  WHERE marketplace_user_id IS NOT NULL;

-- 2. Fix data types (prevent overflow)
ALTER TABLE invoices ALTER COLUMN amount_cents TYPE BIGINT;
ALTER TABLE invoices ALTER COLUMN balance_cents TYPE BIGINT;
ALTER TABLE invoices ALTER COLUMN deposit_cents TYPE BIGINT;

-- 3. Add soft delete support (prevent orphaned references)
ALTER TABLE invoices ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_invoices_deleted ON invoices(deleted_at) WHERE deleted_at IS NULL;

ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMP;
CREATE INDEX idx_contacts_deleted ON contacts(deleted_at) WHERE deleted_at IS NULL;

-- 4. Add marketplace transaction tracking field to invoices (optional linkage)
ALTER TABLE invoices ADD COLUMN marketplace_transaction_id INTEGER;
ALTER TABLE invoices ADD COLUMN is_marketplace_invoice BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_invoices_marketplace
  ON invoices(tenant_id, is_marketplace_invoice)
  WHERE is_marketplace_invoice = TRUE;
```

#### Create Marketplace Schema & Tables

```sql
-- Create separate schema for marketplace data
CREATE SCHEMA IF NOT EXISTS marketplace;

-- Marketplace users (separate from tenant users)
CREATE TABLE marketplace.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url VARCHAR(500),
  user_type VARCHAR(50) DEFAULT 'buyer',  -- buyer, service_provider, both
  status VARCHAR(50) DEFAULT 'active',    -- active, suspended, banned

  -- Optional tenant linkage (if they're also a breeder)
  tenant_id INTEGER,
  tenant_verified BOOLEAN DEFAULT FALSE,

  -- Stripe (optional)
  stripe_customer_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_users_email ON marketplace.users(email);
CREATE INDEX idx_marketplace_users_tenant ON marketplace.users(tenant_id) WHERE tenant_id IS NOT NULL;

-- Service listings
CREATE TABLE marketplace.service_listings (
  id SERIAL PRIMARY KEY,
  provider_user_id INTEGER NOT NULL,  -- References marketplace.users

  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,  -- training, grooming, breeding, boarding, etc

  -- Pricing
  price_cents BIGINT,
  price_type VARCHAR(50),  -- fixed, hourly, daily, per_session, quote
  currency VARCHAR(3) DEFAULT 'USD',

  -- Location
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  service_area_miles INTEGER,

  -- Status
  status VARCHAR(50) DEFAULT 'draft',  -- draft, active, inactive, suspended

  -- Media (simplified - just URLs)
  images JSONB,  -- Array of {url, caption}

  -- Metadata
  tags TEXT[],
  category_metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_listings_provider ON marketplace.service_listings(provider_user_id);
CREATE INDEX idx_listings_active ON marketplace.service_listings(status, category, state)
  WHERE status = 'active';

-- Marketplace transaction log (manual tracking)
CREATE TABLE marketplace.transactions (
  id SERIAL PRIMARY KEY,

  -- Who's involved
  provider_tenant_id INTEGER NOT NULL,  -- The breeder/service provider
  provider_user_id INTEGER,             -- Optional: marketplace user who provided service
  client_party_id INTEGER,              -- Optional: if client is in breeder's contacts
  client_user_id INTEGER,               -- Optional: if client is marketplace user
  client_description TEXT,              -- Fallback: "Jane Doe - puppy training"

  -- What listing (optional)
  service_listing_id INTEGER,

  -- What happened
  service_description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- When & status
  transaction_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',  -- completed, pending, cancelled, refunded
  payment_method VARCHAR(50),              -- cash, venmo, paypal, stripe, check, etc

  -- Optional Stripe reference (future)
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),

  -- Financial tracking
  platform_fee_cents BIGINT DEFAULT 0,
  net_payout_cents BIGINT,

  -- Metadata
  notes TEXT,
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_provider ON marketplace.transactions(provider_tenant_id, transaction_date DESC);
CREATE INDEX idx_transactions_client_party ON marketplace.transactions(client_party_id) WHERE client_party_id IS NOT NULL;
CREATE INDEX idx_transactions_listing ON marketplace.transactions(service_listing_id) WHERE service_listing_id IS NOT NULL;

-- Message threads (simplified)
CREATE TABLE marketplace.message_threads (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,
  buyer_user_id INTEGER NOT NULL,
  seller_user_id INTEGER NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',  -- active, archived, blocked
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_threads_buyer ON marketplace.message_threads(buyer_user_id, last_message_at DESC);
CREATE INDEX idx_threads_seller ON marketplace.message_threads(seller_user_id, last_message_at DESC);

-- Messages (simplified)
CREATE TABLE marketplace.messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER NOT NULL,
  sender_user_id INTEGER NOT NULL,
  message_text TEXT NOT NULL,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON marketplace.messages(thread_id, created_at DESC);
```

**AI Assistance Task**: "Generate Prisma schema models for the above SQL tables"

**Validation**:
```bash
# Test schema creation
psql $DATABASE_URL -f create-marketplace-schema.sql

# Verify tables exist
psql $DATABASE_URL -c "\dt marketplace.*"

# Update Prisma schema and generate client
npx prisma db pull
npx prisma generate
```

---

### Day 3-4: Prisma Schema Updates & Basic Auth

#### Update Prisma Schema

Add to `schema.prisma`:

```prisma
// Marketplace schema
model MarketplaceUser {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  emailVerified    Boolean   @default(false)
  passwordHash     String
  firstName        String?
  lastName         String?
  phone            String?
  avatarUrl        String?
  userType         String    @default("buyer")
  status           String    @default("active")

  tenantId         Int?
  tenantVerified   Boolean   @default(false)
  tenant           Tenant?   @relation("MarketplaceTenant", fields: [tenantId], references: [id])

  stripeCustomerId String?

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  listings         ServiceListing[]
  sentMessages     Message[]
  buyerThreads     MessageThread[] @relation("BuyerThreads")
  sellerThreads    MessageThread[] @relation("SellerThreads")
  clientTransactions MarketplaceTransaction[] @relation("ClientTransactions")
  providerTransactions MarketplaceTransaction[] @relation("ProviderTransactions")

  @@map("users")
  @@schema("marketplace")
}

model ServiceListing {
  id                 Int       @id @default(autoincrement())
  providerUserId     Int
  providerUser       MarketplaceUser @relation(fields: [providerUserId], references: [id])

  title              String
  description        String
  category           String

  priceCents         BigInt?
  priceType          String?
  currency           String    @default("USD")

  city               String?
  state              String?
  zipCode            String?
  serviceAreaMiles   Int?

  status             String    @default("draft")
  images             Json?
  tags               String[]
  categoryMetadata   Json?

  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  publishedAt        DateTime?

  threads            MessageThread[]
  transactions       MarketplaceTransaction[]

  @@map("service_listings")
  @@schema("marketplace")
}

model MarketplaceTransaction {
  id                     Int       @id @default(autoincrement())

  providerTenantId       Int
  providerTenant         Tenant    @relation("ProviderTransactions", fields: [providerTenantId], references: [id])
  providerUserId         Int?
  providerUser           MarketplaceUser? @relation("ProviderTransactions", fields: [providerUserId], references: [id])

  clientPartyId          Int?
  clientParty            Party?    @relation("ClientTransactions", fields: [clientPartyId], references: [id])
  clientUserId           Int?
  clientUser             MarketplaceUser? @relation("ClientTransactions", fields: [clientUserId], references: [id])
  clientDescription      String?

  serviceListingId       Int?
  serviceListing         ServiceListing? @relation(fields: [serviceListingId], references: [id])

  serviceDescription     String
  amountCents            BigInt
  currency               String    @default("USD")

  transactionDate        DateTime
  status                 String    @default("completed")
  paymentMethod          String?

  stripeInvoiceId        String?
  stripePaymentIntentId  String?

  platformFeeCents       BigInt    @default(0)
  netPayoutCents         BigInt?

  notes                  String?
  metadata               Json?

  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  @@map("transactions")
  @@schema("marketplace")
}

model MessageThread {
  id              Int       @id @default(autoincrement())
  listingId       Int?
  listing         ServiceListing? @relation(fields: [listingId], references: [id])

  buyerUserId     Int
  buyerUser       MarketplaceUser @relation("BuyerThreads", fields: [buyerUserId], references: [id])
  sellerUserId    Int
  sellerUser      MarketplaceUser @relation("SellerThreads", fields: [sellerUserId], references: [id])

  subject         String?
  status          String    @default("active")
  lastMessageAt   DateTime?
  createdAt       DateTime  @default(now())

  messages        Message[]

  @@map("message_threads")
  @@schema("marketplace")
}

model Message {
  id             Int       @id @default(autoincrement())
  threadId       Int
  thread         MessageThread @relation(fields: [threadId], references: [id])

  senderUserId   Int
  sender         MarketplaceUser @relation(fields: [senderUserId], references: [id])

  messageText    String
  readAt         DateTime?
  createdAt      DateTime  @default(now())

  @@map("messages")
  @@schema("marketplace")
}
```

Also update existing models:

```prisma
model Contact {
  // ... existing fields ...

  marketplaceUserId Int?
  deletedAt         DateTime?

  marketplaceTransactions MarketplaceTransaction[] @relation("ClientTransactions")

  @@unique([marketplaceUserId, tenantId], name: "unique_marketplace_user_tenant")
}

model Invoice {
  // ... existing fields ...

  amountCents              BigInt   // Changed from Int
  balanceCents             BigInt   // Changed from Int
  depositCents             BigInt?  // Changed from Int?

  marketplaceTransactionId Int?
  isMarketplaceInvoice     Boolean  @default(false)
  deletedAt                DateTime?
}

model Tenant {
  // ... existing fields ...

  marketplaceUsers         MarketplaceUser[] @relation("MarketplaceTenant")
  providerTransactions     MarketplaceTransaction[] @relation("ProviderTransactions")
}
```

**AI Assistance Task**: "Review this Prisma schema for correctness, generate migration files"

#### Basic Authentication Setup

Create simple JWT-based auth for marketplace users:

**File**: `src/middleware/marketplace-auth.ts`

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface MarketplaceAuthToken {
  userId: number;
  email: string;
  userType: string;
  tenantId?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: MarketplaceAuthToken): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): MarketplaceAuthToken {
  return jwt.verify(token, JWT_SECRET) as MarketplaceAuthToken;
}

// Middleware for marketplace routes
export async function requireMarketplaceAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Attach user info to request
    req.marketplaceUser = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}

// Optional: Check if user has linked tenant
export async function requireTenantLinked(req: any, res: any, next: any) {
  const userId = req.marketplaceUser?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const user = await prisma.marketplace.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, tenantVerified: true }
  });

  if (!user?.tenantId || !user.tenantVerified) {
    return res.status(403).json({
      error: 'TENANT_NOT_LINKED',
      message: 'You must link and verify your breeder account first'
    });
  }

  req.linkedTenantId = user.tenantId;
  next();
}
```

**File**: `src/routes/marketplace/auth.ts`

```typescript
import express from 'express';
import { prisma } from '../../db';
import { hashPassword, verifyPassword, generateToken } from '../../middleware/marketplace-auth';

const router = express.Router();

// Register new marketplace user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' });
    }

    // Check if email exists
    const existing = await prisma.marketplace.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      return res.status(409).json({ error: 'EMAIL_EXISTS' });
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.marketplace.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        userType: userType || 'buyer'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        tenantId: true
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      tenantId: user.tenantId || undefined
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'REGISTRATION_FAILED' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' });
    }

    // Find user
    const user = await prisma.marketplace.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // Check if suspended/banned
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'ACCOUNT_SUSPENDED' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      tenantId: user.tenantId || undefined
    });

    // Update last login (optional)
    await prisma.marketplace.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        tenantId: user.tenantId
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'LOGIN_FAILED' });
  }
});

// Get current user
router.get('/me', requireMarketplaceAuth, async (req, res) => {
  try {
    const user = await prisma.marketplace.user.findUnique({
      where: { id: req.marketplaceUser.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        userType: true,
        status: true,
        tenantId: true,
        tenantVerified: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

export default router;
```

**Validation**:
```bash
# Generate Prisma client
npx prisma generate

# Test auth endpoints
curl -X POST http://localhost:3000/api/marketplace/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","userType":"service_provider"}'

curl -X POST http://localhost:3000/api/marketplace/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

### Day 5: Client Portal Authentication

**Key Decision**: Reuse existing tenant auth system for client portal access

#### Add Client Portal Entitlement to Contacts

```sql
-- Add client portal access flag
ALTER TABLE contacts ADD COLUMN portal_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN portal_password_hash VARCHAR(255);
ALTER TABLE contacts ADD COLUMN portal_last_login TIMESTAMP;

CREATE INDEX idx_contacts_portal ON contacts(tenant_id, portal_enabled) WHERE portal_enabled = TRUE;
```

Update Prisma schema:

```prisma
model Contact {
  // ... existing fields ...

  portalEnabled      Boolean   @default(false)
  portalPasswordHash String?
  portalLastLogin    DateTime?
}
```

#### Client Portal Auth Route

**File**: `src/routes/portal/auth.ts`

```typescript
import express from 'express';
import { prisma } from '../../db';
import { hashPassword, verifyPassword } from '../../middleware/marketplace-auth';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface PortalAuthToken {
  contactId: number;
  tenantId: number;
  email: string;
  partyId: number;
}

// Client portal login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' });
    }

    // Find contact with portal access
    const contact = await prisma.contact.findFirst({
      where: {
        email: email.toLowerCase(),
        portalEnabled: true,
        deletedAt: null
      },
      include: {
        party: true,
        tenant: true
      }
    });

    if (!contact || !contact.portalPasswordHash) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // Verify password
    const valid = await verifyPassword(password, contact.portalPasswordHash);
    if (!valid) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // Generate token
    const token = jwt.sign({
      contactId: contact.id,
      tenantId: contact.tenantId,
      email: contact.email,
      partyId: contact.partyId
    } as PortalAuthToken, JWT_SECRET, { expiresIn: '7d' });

    // Update last login
    await prisma.contact.update({
      where: { id: contact.id },
      data: { portalLastLogin: new Date() }
    });

    res.json({
      contact: {
        id: contact.id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        tenantId: contact.tenantId,
        breederName: contact.tenant.businessName || contact.tenant.name
      },
      token
    });
  } catch (error) {
    console.error('Portal login error:', error);
    res.status(500).json({ error: 'LOGIN_FAILED' });
  }
});

// Middleware to require portal auth
export async function requirePortalAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as PortalAuthToken;

    req.portalContact = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }
}

export default router;
```

**Validation**:
```bash
# Breeder invites client via existing contact management
# Then client sets password and logs in
curl -X POST http://localhost:3000/api/portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"clientpass"}'
```

---

## Week 2: APIs & Portal Functionality

### Day 6-7: Marketplace Listing APIs

**File**: `src/routes/marketplace/listings.ts`

```typescript
import express from 'express';
import { prisma } from '../../db';
import { requireMarketplaceAuth, requireTenantLinked } from '../../middleware/marketplace-auth';

const router = express.Router();

// List all active listings (public)
router.get('/', async (req, res) => {
  try {
    const { category, state, city, page = 1, limit = 20 } = req.query;

    const where: any = { status: 'active' };
    if (category) where.category = category;
    if (state) where.state = state;
    if (city) where.city = city;

    const skip = (Number(page) - 1) * Number(limit);
    const listings = await prisma.marketplace.serviceListing.findMany({
      where,
      include: {
        providerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.marketplace.serviceListing.count({ where });

    res.json({
      listings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('List listings error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await prisma.marketplace.serviceListing.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        providerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            tenantId: true,
            tenant: {
              select: {
                businessName: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'LISTING_NOT_FOUND' });
    }

    res.json({ listing });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// Create listing (requires auth)
router.post('/', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;
    const {
      title,
      description,
      category,
      priceCents,
      priceType,
      city,
      state,
      zipCode,
      serviceAreaMiles,
      images,
      tags
    } = req.body;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'REQUIRED_FIELDS_MISSING' });
    }

    const listing = await prisma.marketplace.serviceListing.create({
      data: {
        providerUserId: userId,
        title,
        description,
        category,
        priceCents: priceCents ? BigInt(priceCents) : null,
        priceType,
        city,
        state,
        zipCode,
        serviceAreaMiles,
        images,
        tags: tags || [],
        status: 'draft'
      }
    });

    res.status(201).json({ listing });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'CREATE_FAILED' });
  }
});

// Update listing
router.patch('/:id', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;
    const listingId = Number(req.params.id);

    // Check ownership
    const existing = await prisma.marketplace.serviceListing.findUnique({
      where: { id: listingId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'LISTING_NOT_FOUND' });
    }

    if (existing.providerUserId !== userId) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    // Update
    const listing = await prisma.marketplace.serviceListing.update({
      where: { id: listingId },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    res.json({ listing });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'UPDATE_FAILED' });
  }
});

// Publish listing
router.post('/:id/publish', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;
    const listingId = Number(req.params.id);

    const existing = await prisma.marketplace.serviceListing.findUnique({
      where: { id: listingId }
    });

    if (!existing || existing.providerUserId !== userId) {
      return res.status(404).json({ error: 'LISTING_NOT_FOUND' });
    }

    const listing = await prisma.marketplace.serviceListing.update({
      where: { id: listingId },
      data: {
        status: 'active',
        publishedAt: new Date()
      }
    });

    res.json({ listing });
  } catch (error) {
    console.error('Publish listing error:', error);
    res.status(500).json({ error: 'PUBLISH_FAILED' });
  }
});

// Delete listing
router.delete('/:id', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;
    const listingId = Number(req.params.id);

    const existing = await prisma.marketplace.serviceListing.findUnique({
      where: { id: listingId }
    });

    if (!existing || existing.providerUserId !== userId) {
      return res.status(404).json({ error: 'LISTING_NOT_FOUND' });
    }

    await prisma.marketplace.serviceListing.delete({
      where: { id: listingId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'DELETE_FAILED' });
  }
});

// Get my listings
router.get('/my/listings', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;

    const listings = await prisma.marketplace.serviceListing.findMany({
      where: { providerUserId: userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ listings });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

export default router;
```

**Validation**:
```bash
# Create listing
curl -X POST http://localhost:3000/api/marketplace/listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Professional Dog Training",
    "description":"20 years experience...",
    "category":"training",
    "priceCents":10000,
    "priceType":"hourly",
    "city":"Austin",
    "state":"TX"
  }'

# List listings
curl http://localhost:3000/api/marketplace/listings?category=training&state=TX
```

---

### Day 8-9: Transaction Recording APIs

**File**: `src/routes/marketplace/transactions.ts`

```typescript
import express from 'express';
import { prisma } from '../../db';
import { requireMarketplaceAuth } from '../../middleware/marketplace-auth';

const router = express.Router();

// Record a marketplace transaction (manual payment tracking)
router.post('/', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;

    // Get user's linked tenant
    const user = await prisma.marketplace.user.findUnique({
      where: { id: userId },
      select: { tenantId: true, tenantVerified: true }
    });

    if (!user?.tenantId || !user.tenantVerified) {
      return res.status(403).json({
        error: 'TENANT_NOT_LINKED',
        message: 'You must link your breeder account to record transactions'
      });
    }

    const {
      serviceDescription,
      amountCents,
      transactionDate,
      paymentMethod,
      clientDescription,
      clientPartyId,
      serviceListingId,
      notes
    } = req.body;

    // Validation
    if (!serviceDescription || !amountCents || !transactionDate) {
      return res.status(400).json({ error: 'REQUIRED_FIELDS_MISSING' });
    }

    // Create transaction record
    const transaction = await prisma.marketplace.transaction.create({
      data: {
        providerTenantId: user.tenantId,
        providerUserId: userId,
        serviceDescription,
        amountCents: BigInt(amountCents),
        transactionDate: new Date(transactionDate),
        paymentMethod: paymentMethod || 'manual',
        clientDescription,
        clientPartyId,
        serviceListingId,
        notes,
        status: 'completed',
        netPayoutCents: BigInt(amountCents) // No platform fee for MVP
      }
    });

    res.status(201).json({ transaction });
  } catch (error) {
    console.error('Record transaction error:', error);
    res.status(500).json({ error: 'RECORD_FAILED' });
  }
});

// List my transactions (as provider)
router.get('/my', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;
    const { page = 1, limit = 20, status } = req.query;

    const user = await prisma.marketplace.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    });

    if (!user?.tenantId) {
      return res.json({ transactions: [], pagination: { total: 0 } });
    }

    const where: any = { providerTenantId: user.tenantId };
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const transactions = await prisma.marketplace.transaction.findMany({
      where,
      include: {
        serviceListing: {
          select: { title: true }
        },
        clientParty: {
          select: {
            contact: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { transactionDate: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.marketplace.transaction.count({ where });

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// Get single transaction
router.get('/:id', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;
    const transactionId = Number(req.params.id);

    const transaction = await prisma.marketplace.transaction.findUnique({
      where: { id: transactionId },
      include: {
        serviceListing: true,
        providerUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        clientParty: {
          select: {
            contact: true
          }
        }
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
    }

    // Check authorization (must be provider)
    if (transaction.providerUserId !== userId) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// Update transaction (e.g., add notes, change status)
router.patch('/:id', requireMarketplaceAuth, async (req, res) => {
  try {
    const userId = req.marketplaceUser.userId;
    const transactionId = Number(req.params.id);

    const existing = await prisma.marketplace.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
    }

    if (existing.providerUserId !== userId) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const transaction = await prisma.marketplace.transaction.update({
      where: { id: transactionId },
      data: {
        ...req.body,
        updatedAt: new Date()
      }
    });

    res.json({ transaction });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'UPDATE_FAILED' });
  }
});

export default router;
```

**Validation**:
```bash
# Record transaction
curl -X POST http://localhost:3000/api/marketplace/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceDescription":"Puppy training - 4 sessions",
    "amountCents":40000,
    "transactionDate":"2026-01-10",
    "paymentMethod":"venmo",
    "clientDescription":"Sarah Johnson",
    "notes":"Paid via Venmo @sarahj"
  }'

# List my transactions
curl http://localhost:3000/api/marketplace/transactions/my?page=1&limit=20 \
  -H "Authorization: Bearer $TOKEN"
```

---

### Day 10-11: Client Portal APIs

**File**: `src/routes/portal/invoices.ts`

```typescript
import express from 'express';
import { prisma } from '../../db';
import { requirePortalAuth } from './auth';

const router = express.Router();

// List client's invoices
router.get('/', requirePortalAuth, async (req, res) => {
  try {
    const { contactId, tenantId } = req.portalContact;
    const { status, page = 1, limit = 20 } = req.query;

    const where: any = {
      tenantId,
      clientPartyId: req.portalContact.partyId,
      deletedAt: null
    };
    if (status) where.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        LineItems: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.invoice.count({ where });

    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('List portal invoices error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// Get single invoice
router.get('/:id', requirePortalAuth, async (req, res) => {
  try {
    const { tenantId, partyId } = req.portalContact;
    const invoiceId = Number(req.params.id);

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
        clientPartyId: partyId,
        deletedAt: null
      },
      include: {
        LineItems: true,
        Payments: true,
        tenant: {
          select: {
            businessName: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });
    }

    res.json({ invoice });
  } catch (error) {
    console.error('Get portal invoice error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

export default router;
```

**File**: `src/routes/portal/animals.ts`

```typescript
import express from 'express';
import { prisma } from '../../db';
import { requirePortalAuth } from './auth';

const router = express.Router();

// List client's animals (that they own or are associated with)
router.get('/', requirePortalAuth, async (req, res) => {
  try {
    const { tenantId, partyId } = req.portalContact;

    // Find animals where client is the owner
    const animals = await prisma.animal.findMany({
      where: {
        tenantId,
        ownerPartyId: partyId,
        deletedAt: null
      },
      include: {
        species: true,
        breed: true,
        color: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ animals });
  } catch (error) {
    console.error('List portal animals error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

// Get single animal
router.get('/:id', requirePortalAuth, async (req, res) => {
  try {
    const { tenantId, partyId } = req.portalContact;
    const animalId = Number(req.params.id);

    const animal = await prisma.animal.findFirst({
      where: {
        id: animalId,
        tenantId,
        ownerPartyId: partyId,
        deletedAt: null
      },
      include: {
        species: true,
        breed: true,
        color: true,
        offspring: {
          where: { deletedAt: null }
        }
      }
    });

    if (!animal) {
      return res.status(404).json({ error: 'ANIMAL_NOT_FOUND' });
    }

    res.json({ animal });
  } catch (error) {
    console.error('Get portal animal error:', error);
    res.status(500).json({ error: 'FETCH_FAILED' });
  }
});

export default router;
```

**Register routes in main app**:

**File**: `src/app.ts` (or wherever routes are registered)

```typescript
import marketplaceAuthRoutes from './routes/marketplace/auth';
import marketplaceListingRoutes from './routes/marketplace/listings';
import marketplaceTransactionRoutes from './routes/marketplace/transactions';
import portalAuthRoutes from './routes/portal/auth';
import portalInvoiceRoutes from './routes/portal/invoices';
import portalAnimalRoutes from './routes/portal/animals';

// Marketplace routes
app.use('/api/marketplace/auth', marketplaceAuthRoutes);
app.use('/api/marketplace/listings', marketplaceListingRoutes);
app.use('/api/marketplace/transactions', marketplaceTransactionRoutes);

// Portal routes
app.use('/api/portal/auth', portalAuthRoutes);
app.use('/api/portal/invoices', portalInvoiceRoutes);
app.use('/api/portal/animals', portalAnimalRoutes);
```

**Validation**:
```bash
# Test portal login
curl -X POST http://localhost:3000/api/portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"clientpass"}'

# Test portal invoice list
curl http://localhost:3000/api/portal/invoices \
  -H "Authorization: Bearer $PORTAL_TOKEN"

# Test portal animals
curl http://localhost:3000/api/portal/animals \
  -H "Authorization: Bearer $PORTAL_TOKEN"
```

---

### Day 12-13: Frontend Integration Points

Create minimal frontend integration files to demonstrate API usage.

**File**: `docs/frontend-integration-guide.md`

```markdown
# Frontend Integration Guide

## Marketplace Frontend (marketplace.breederhq.com)

### Authentication

```typescript
// Register new user
const registerResponse = await fetch('/api/marketplace/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepass',
    firstName: 'John',
    lastName: 'Doe',
    userType: 'service_provider'
  })
});
const { user, token } = await registerResponse.json();
localStorage.setItem('marketplace_token', token);

// Login
const loginResponse = await fetch('/api/marketplace/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepass'
  })
});
const { user, token } = await loginResponse.json();
localStorage.setItem('marketplace_token', token);

// Get current user
const meResponse = await fetch('/api/marketplace/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('marketplace_token')}`
  }
});
const { user } = await meResponse.json();
```

### Service Listings

```typescript
// List all listings (public)
const listingsResponse = await fetch('/api/marketplace/listings?category=training&state=TX');
const { listings, pagination } = await listingsResponse.json();

// Create listing (authenticated)
const createResponse = await fetch('/api/marketplace/listings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Professional Dog Training',
    description: '20 years experience...',
    category: 'training',
    priceCents: 10000,
    priceType: 'hourly',
    city: 'Austin',
    state: 'TX'
  })
});
const { listing } = await createResponse.json();

// Publish listing
await fetch(`/api/marketplace/listings/${listing.id}/publish`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Transaction Recording

```typescript
// Record manual payment
const txResponse = await fetch('/api/marketplace/transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    serviceDescription: 'Puppy training - 4 sessions',
    amountCents: 40000,
    transactionDate: '2026-01-10',
    paymentMethod: 'venmo',
    clientDescription: 'Sarah Johnson',
    notes: 'Paid via Venmo @sarahj'
  })
});

// List my transactions
const myTxResponse = await fetch('/api/marketplace/transactions/my?page=1', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { transactions, pagination } = await myTxResponse.json();
```

## Client Portal Frontend (portal.breederhq.com)

### Authentication

```typescript
// Client login
const portalLoginResponse = await fetch('/api/portal/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'client@example.com',
    password: 'clientpass'
  })
});
const { contact, token } = await portalLoginResponse.json();
localStorage.setItem('portal_token', token);
```

### View Invoices

```typescript
// List my invoices
const invoicesResponse = await fetch('/api/portal/invoices', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { invoices } = await invoicesResponse.json();

// View invoice details
const invoiceResponse = await fetch(`/api/portal/invoices/${invoiceId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { invoice } = await invoiceResponse.json();
```

### View Animals

```typescript
// List my animals
const animalsResponse = await fetch('/api/portal/animals', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { animals } = await animalsResponse.json();
```

## Error Handling

All API responses use consistent error format:

```typescript
{
  "error": "ERROR_CODE",
  "message": "Human-readable message"
}
```

Common error codes:
- `UNAUTHORIZED` (401): Missing or invalid token
- `FORBIDDEN` (403): Valid token but insufficient permissions
- `NOT_FOUND` (404): Resource doesn't exist
- `VALIDATION_ERROR` (400): Invalid input
- `SERVER_ERROR` (500): Internal server error
```

---

### Day 14: Testing & Documentation

**Create API test suite**:

**File**: `tests/marketplace-api.test.ts`

```typescript
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db';

describe('Marketplace API', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Clean test data
    await prisma.marketplace.transaction.deleteMany({});
    await prisma.marketplace.serviceListing.deleteMany({});
    await prisma.marketplace.user.deleteMany({ where: { email: 'test@example.com' } });
  });

  describe('Auth', () => {
    it('should register new user', async () => {
      const res = await request(app)
        .post('/api/marketplace/auth/register')
        .send({
          email: 'test@example.com',
          password: 'testpass123',
          firstName: 'Test',
          lastName: 'User',
          userType: 'service_provider'
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('id');
      expect(res.body).toHaveProperty('token');

      authToken = res.body.token;
      userId = res.body.user.id;
    });

    it('should login existing user', async () => {
      const res = await request(app)
        .post('/api/marketplace/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/marketplace/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpass'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Listings', () => {
    let listingId: number;

    it('should create listing', async () => {
      const res = await request(app)
        .post('/api/marketplace/listings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Training Service',
          description: 'Test description',
          category: 'training',
          priceCents: 10000,
          priceType: 'hourly',
          city: 'Test City',
          state: 'TX'
        });

      expect(res.status).toBe(201);
      expect(res.body.listing).toHaveProperty('id');
      listingId = res.body.listing.id;
    });

    it('should list active listings', async () => {
      const res = await request(app).get('/api/marketplace/listings');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('listings');
    });

    it('should get single listing', async () => {
      const res = await request(app).get(`/api/marketplace/listings/${listingId}`);
      expect(res.status).toBe(200);
      expect(res.body.listing.id).toBe(listingId);
    });

    it('should update own listing', async () => {
      const res = await request(app)
        .patch(`/api/marketplace/listings/${listingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.listing.title).toBe('Updated Title');
    });
  });
});
```

Run tests:
```bash
npm test
```

---

## Post-Launch Hardening Plan (Weeks 3-4)

Once marketplace and portal are live with 10-20 users, implement these enhancements:

### Week 3: Security Hardening

1. **Row-Level Security (RLS)**
   - Implement PostgreSQL RLS policies
   - Add `SET LOCAL app.current_tenant_id` to all queries
   - Test cross-tenant isolation

2. **Comprehensive Audit Logging**
   - Create `authorization_audit` table
   - Log all permission checks
   - Create admin dashboard to view denied access attempts

3. **Rate Limiting**
   - Add rate limiting middleware (express-rate-limit)
   - Protect auth endpoints from brute force
   - Protect API endpoints from abuse

4. **Input Validation**
   - Add Zod schemas for all API inputs
   - Sanitize all text inputs
   - Validate file uploads

### Week 4: Performance & Reliability

1. **Monitoring**
   - Set up basic logging (Winston/Pino)
   - Add error tracking (Sentry)
   - Monitor slow queries

2. **Performance Optimization**
   - Add composite indexes based on slow query log
   - Implement basic caching (Redis if needed)
   - Optimize N+1 queries

3. **Payment Integration**
   - Implement Stripe webhook handling
   - Add webhook idempotency
   - Add Stripe invoice creation for marketplace transactions

4. **Testing**
   - Expand API test coverage to 80%
   - Add integration tests
   - Load testing with 100 concurrent users

---

## Environment Setup Checklist

### Required Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/breederhq?schema=public"

# Auth
JWT_SECRET="generate-a-strong-random-secret-here"

# Stripe (optional for MVP)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
NODE_ENV="development"
PORT=3000

# Frontend URLs
MARKETPLACE_URL="http://localhost:3001"
PORTAL_URL="http://localhost:3002"
APP_URL="http://localhost:3000"
```

### Dependencies to Install

```bash
# Core
npm install express prisma @prisma/client
npm install --save-dev typescript @types/express @types/node

# Auth
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs

# Validation
npm install zod

# Testing
npm install --save-dev jest ts-jest supertest @types/jest @types/supertest

# Utilities
npm install dotenv
```

---

## Migration Execution Plan

### Step 1: Backup Current Database

```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Verify backup
psql $DATABASE_URL < backup-$(date +%Y%m%d).sql --dry-run
```

### Step 2: Run Schema Migrations

```bash
# Create marketplace schema
psql $DATABASE_URL -f scripts/001-create-marketplace-schema.sql

# Create marketplace tables
psql $DATABASE_URL -f scripts/002-create-marketplace-tables.sql

# Update existing tables
psql $DATABASE_URL -f scripts/003-update-tenant-tables.sql

# Verify
psql $DATABASE_URL -c "\dt marketplace.*"
psql $DATABASE_URL -c "\d+ contacts"
psql $DATABASE_URL -c "\d+ invoices"
```

### Step 3: Update Prisma Schema

```bash
# Pull latest schema from database
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Verify
npm run build
```

### Step 4: Deploy API Changes

```bash
# Run tests
npm test

# Build
npm run build

# Deploy to Vercel
vercel deploy
```

---

## Success Criteria

By end of Week 2, you should have:

- [x] Marketplace schema created with all tables
- [x] Contact-to-marketplace-user linking implemented
- [x] Basic JWT authentication for marketplace users
- [x] Basic JWT authentication for portal clients
- [x] Service listing CRUD APIs working
- [x] Transaction recording API working
- [x] Portal invoice/animal viewing APIs working
- [x] API documentation complete
- [x] Basic tests passing
- [x] Ready to build frontend integration

**Not required for MVP** (post-launch):
- Advanced RLS policies
- Comprehensive audit logging
- Performance optimizations
- Stripe webhook handling
- Table partitioning
- Complex authorization rules

---

## Risk Mitigation

### Risk: Timeline Slippage

**Mitigation**: If behind schedule, drop these items:
1. Message threads/messaging (can add post-launch)
2. Client portal animal viewing (focus on invoices only)
3. Complex transaction queries (just basic list/create for MVP)

### Risk: Database Migration Issues

**Mitigation**:
- Test all migrations in local dev environment first
- Have rollback SQL scripts ready
- Since 0 active tenants, can drop/recreate DB if needed

### Risk: Auth Security Concerns

**Mitigation**:
- Use strong JWT secrets (generate with `openssl rand -base64 32`)
- Enforce HTTPS in production (Vercel handles this)
- Add rate limiting post-launch if abuse detected

---

## Next Steps After Launch

Once marketplace and portal are live:

**Weeks 3-4**: Security & performance hardening (see Post-Launch Plan)

**Weeks 5-6**:
- Stripe integration for marketplace transactions
- Enhanced messaging system
- Admin dashboard for marketplace management

**Weeks 7-8**:
- Advanced search/filtering
- Reviews and ratings
- Email notifications
- Payment reminders

---

## Questions to Answer Before Starting

1. **Deployment Target**: Is Vercel still the deployment platform? Need serverless-compatible code?

2. **Database Permissions**: Do you have access to run `CREATE SCHEMA` on NeonDB? May need to request elevated permissions.

3. **Existing Data**: You mentioned 0 active tenants - can you confirm existing `invoices` and `contacts` tables are safe to alter? Any test data that needs preserving?

4. **Frontend Stack**: What framework for marketplace/portal frontends? (React, Next.js, Vue?) This affects integration approach.

5. **Email Service**: For password resets, portal invitations, etc. - do you have SendGrid/Postmark/etc set up?

---

## Daily Stand-Up Format (Solo Founder)

Use this to track your own progress:

**Each morning, ask yourself**:
1. What did I complete yesterday?
2. What am I working on today?
3. What's blocking me?

**Each evening, record**:
1. What I shipped today
2. What I learned/discovered
3. Tomorrow's priority

**End of Week 1 Checkpoint**:
- Database schema complete? ✓
- Can create marketplace user? ✓
- Can create service listing? ✓
- Can record transaction? ✓

**End of Week 2 Checkpoint**:
- All APIs working? ✓
- Frontend integration tested? ✓
- Documentation complete? ✓
- Ready to build frontend? ✓

---

## AI Assistance Prompts

Use these prompts with Claude AI during implementation:

### For Prisma Schema
"Review this Prisma schema for correctness. Check for: missing indexes, wrong data types, incorrect relations, missing constraints."

### For API Routes
"Generate comprehensive API tests for this Express route using Jest and Supertest."

### For SQL Migrations
"Generate a rollback script for this SQL migration."

### For Documentation
"Generate API documentation in OpenAPI 3.0 format for these routes."

### For Debugging
"This API call is returning error X. Here's the code [paste code]. What's wrong?"

---

## Budget Tracking

**Infrastructure Costs** (Monthly):
- NeonDB: $0 (free tier should suffice for 20 users)
- Vercel: $0 (free tier)
- Domain: ~$12/year

**Development Time** (14 days):
- Your time: ~100 hours total (7-8 hours/day)
- Claude AI credits: ~$20/month

**Total MVP Cost**: ~$20-30

**Post-Launch Costs** (assuming growth):
- Month 2: May need NeonDB paid tier (~$20/month) if exceed free tier
- Month 3: May need Vercel Pro (~$20/month) if exceed free tier
- Stripe fees: 2.9% + $0.30 per transaction (only if using Stripe)

---

## Conclusion

This plan is realistic for a solo founder with AI assistance to ship in 2 weeks. Key success factors:

1. **Ruthless scope management**: Ship MVP, defer everything else
2. **Accept technical debt**: Document it, fix post-launch
3. **Use AI effectively**: Let Claude generate boilerplate, you focus on business logic
4. **Daily progress**: Ship something every day, no matter how small
5. **Stay focused**: Marketplace + Portal only, nothing else

You can do this! The plan is aggressive but achievable with disciplined execution.

**Ready to start? Begin with Day 1: Database schema migration.**
