# BreederHQ Platform Infrastructure Modernization
## Master Implementation Plan

**Date**: 2026-01-12
**Objective**: Prepare infrastructure for Marketplace and Client Portal launch
**Status**: Implementation Roadmap
**Timeline**: 8 weeks (2 months)
**Priority**: BLOCKING - Must complete before marketplace/portal launch

---

## Executive Summary

This plan addresses all foundational infrastructure work required before marketplace and client portal can launch. Work is organized into four phases with clear dependencies:

1. **Database Schema Modernization** (2.5 weeks) - Foundation for everything
2. **Security & Performance Fixes** (2 weeks) - Critical infrastructure hardening
3. **Backend/Middleware API Updates** (2 weeks) - API layer modernization
4. **Frontend Alignment** (1.5 weeks) - UI/UX updates to support new infrastructure

**Total Timeline**: 8 weeks (assumes 2 engineers working in parallel where possible)

**Blocking Dependencies**:
- Marketplace CANNOT launch until Phase 1-3 complete
- Client Portal CANNOT launch until Phase 1-3 complete
- Phase 4 can proceed in parallel with marketplace/portal development after Phase 3

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Phase 1: Database Schema Modernization](#phase-1-database-schema-modernization)
3. [Phase 2: Security & Performance Hardening](#phase-2-security--performance-hardening)
4. [Phase 3: Backend API Modernization](#phase-3-backend-api-modernization)
5. [Phase 4: Frontend Alignment](#phase-4-frontend-alignment)
6. [Testing & Validation Strategy](#testing--validation-strategy)
7. [Rollback Procedures](#rollback-procedures)
8. [Success Criteria](#success-criteria)
9. [Resource Requirements](#resource-requirements)
10. [Risk Management](#risk-management)

---

## 1. Current State Assessment

### Critical Issues Identified

From the architectural review, these issues are BLOCKING marketplace/portal launch:

#### Database Issues
- ❌ Missing indexes causing slow queries (>200ms for common operations)
- ❌ No Row-Level Security (RLS) policies - tenant data leakage risk
- ❌ Data types insufficient for scale (INT instead of BIGINT for high-volume tables)
- ❌ Missing foreign key constraints allowing orphaned records
- ❌ No soft delete support (hard deletes break referential integrity)
- ❌ Invoice versioning missing (concurrent updates cause data loss)
- ❌ Payment mode can change during invoice creation (race condition)

#### Security Issues
- ⚠️ Contact.marketplaceUserId allows cross-tenant data leakage
- ⚠️ No authorization audit logging
- ⚠️ Webhook signature verification missing
- ⚠️ No idempotency for write operations

#### Performance Issues
- ⚠️ N+1 query patterns in invoice/payment APIs
- ⚠️ No pagination on list endpoints
- ⚠️ Missing composite indexes on common query patterns
- ⚠️ No caching strategy

#### API Issues
- ⚠️ Non-RESTful endpoints (POST for updates instead of PATCH)
- ⚠️ Inconsistent error handling
- ⚠️ No API versioning
- ⚠️ Missing optimistic locking on updates

### What This Blocks

**Cannot launch Marketplace until fixed**:
- Tenant data leakage risk (security audit would fail)
- Invoice creation race conditions (payment failures)
- Performance issues at scale (>100 concurrent users)
- No audit trail (compliance issues)

**Cannot launch Client Portal until fixed**:
- Tenant isolation issues (portal clients could see other tenants' data)
- Invoice/payment APIs not production-ready
- No authorization framework for cross-tenant access

---

## Phase 1: Database Schema Modernization

**Duration**: 2.5 weeks (12 business days)
**Team**: 1 backend engineer + 1 DevOps engineer
**Blocking**: YES - Nothing else can proceed until complete
**Downtime**: None (all migrations zero-downtime)

### Overview

Modernize database schema to support marketplace, fix critical data integrity issues, and prepare for scale.

### Work Breakdown

#### Week 1: Core Schema Fixes (Days 1-5)

**Day 1-2: Create Marketplace Schema**

```sql
-- Task 1.1: Create marketplace schema and core tables
CREATE SCHEMA IF NOT EXISTS marketplace;

-- Task 1.2: Create marketplace.users
CREATE TABLE marketplace.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  -- ... (see single-database-implementation-plan.md for complete DDL)
);

-- Task 1.3: Create marketplace.providers
CREATE TABLE marketplace.providers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES marketplace.users(id),
  tenant_id INTEGER REFERENCES tenant.tenants(id),
  -- ... (see implementation plan)
);

-- Task 1.4: Create marketplace.service_listings
-- Task 1.5: Create marketplace.transactions
-- Task 1.6: Create marketplace.invoices
-- Task 1.7: Create marketplace.messages & message_threads
```

**Validation**:
```bash
# Run after schema creation
npm run test:schema -- --grep "marketplace schema"
# Should create all tables successfully
# Should enforce all foreign keys
# Should prevent orphaned records
```

**Deliverable**: Marketplace schema created, all tables verified

---

**Day 3-4: Update Tenant Schema**

```sql
-- Task 1.8: Add marketplace fields to tenants
ALTER TABLE tenant.tenants ADD COLUMN marketplace_payment_mode VARCHAR(50) DEFAULT 'stripe';
ALTER TABLE tenant.tenants ADD COLUMN stripe_connect_account_id VARCHAR(255);
ALTER TABLE tenant.tenants ADD CONSTRAINT chk_marketplace_payment_mode
  CHECK (marketplace_payment_mode IN ('stripe', 'manual', 'disabled'));

-- Task 1.9: Add marketplace fields to contacts
ALTER TABLE tenant.contacts ADD COLUMN marketplace_user_id INTEGER;
ALTER TABLE tenant.contacts ADD CONSTRAINT fk_marketplace_user
  FOREIGN KEY (marketplace_user_id) REFERENCES marketplace.users(id) ON DELETE SET NULL;

-- Task 1.10: Add marketplace fields to invoices
ALTER TABLE tenant.invoices ADD COLUMN is_marketplace_invoice BOOLEAN DEFAULT FALSE;
ALTER TABLE tenant.invoices ADD COLUMN marketplace_transaction_id INTEGER;
ALTER TABLE tenant.invoices ADD COLUMN payment_mode_snapshot VARCHAR(50);
ALTER TABLE tenant.invoices ADD COLUMN payment_mode_locked_at TIMESTAMP;
ALTER TABLE tenant.invoices ADD COLUMN buyer_marked_paid_at TIMESTAMP;
ALTER TABLE tenant.invoices ADD COLUMN buyer_payment_receipt_url VARCHAR(500);
ALTER TABLE tenant.invoices ADD COLUMN provider_confirmed_at TIMESTAMP;
ALTER TABLE tenant.invoices ADD COLUMN refunded_cents BIGINT DEFAULT 0;
ALTER TABLE tenant.invoices ADD COLUMN reconciliation_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE tenant.invoices ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE tenant.invoices ADD COLUMN deleted_at TIMESTAMP;

-- Task 1.11: Fix data types for scale
ALTER TABLE tenant.invoices ALTER COLUMN amount_cents TYPE BIGINT;
ALTER TABLE tenant.invoices ALTER COLUMN balance_cents TYPE BIGINT;
ALTER TABLE tenant.payments ALTER COLUMN amount_cents TYPE BIGINT;
```

**Validation**:
```bash
npm run test:schema -- --grep "tenant schema updates"
# Should add all columns successfully
# Should enforce foreign keys to marketplace
# Should use BIGINT for currency
```

**Deliverable**: Tenant schema updated, validated, no data loss

---

**Day 5: Create Shared Audit Schema**

```sql
-- Task 1.12: Create public audit tables
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  -- ... (see implementation plan)
);

CREATE TABLE IF NOT EXISTS public.invoice_audit_log (
  id SERIAL PRIMARY KEY,
  invoice_schema VARCHAR(20) NOT NULL,
  invoice_id BIGINT NOT NULL,
  changed_by_user_id VARCHAR(50),
  -- ... (see implementation plan)
);

CREATE TABLE IF NOT EXISTS public.authorization_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  resource_schema VARCHAR(50),
  -- ... (see implementation plan)
);
```

**Validation**:
```bash
npm run test:schema -- --grep "audit tables"
```

**Deliverable**: Audit infrastructure in place

---

#### Week 2: Indexes and Performance (Days 6-10)

**Day 6-7: Create Critical Indexes**

```sql
-- Task 1.13: Marketplace indexes (create CONCURRENTLY to avoid locks)
CREATE INDEX CONCURRENTLY idx_users_email ON marketplace.users(email);
CREATE INDEX CONCURRENTLY idx_providers_user ON marketplace.providers(user_id);
CREATE INDEX CONCURRENTLY idx_providers_tenant ON marketplace.providers(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_listings_category_status ON marketplace.service_listings(category, status);
CREATE INDEX CONCURRENTLY idx_transactions_client ON marketplace.transactions(client_id, status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_transactions_provider ON marketplace.transactions(provider_id, status, created_at DESC);

-- Task 1.14: Tenant indexes (critical missing indexes)
CREATE INDEX CONCURRENTLY idx_contacts_marketplace_user_tenant
  ON tenant.contacts(marketplace_user_id, tenant_id)
  WHERE marketplace_user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_invoices_marketplace_transaction
  ON tenant.invoices(tenant_id, marketplace_transaction_id)
  WHERE marketplace_transaction_id IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_invoices_tenant_status_created
  ON tenant.invoices(tenant_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_payments_invoice_date
  ON tenant.payments(invoice_id, received_at DESC);

-- Task 1.15: Audit table indexes
CREATE INDEX CONCURRENTLY idx_webhook_events_event_id ON public.stripe_webhook_events(event_id, status);
CREATE INDEX CONCURRENTLY idx_invoice_audit_invoice ON public.invoice_audit_log(invoice_schema, invoice_id, changed_at DESC);
```

**Validation**:
```bash
# Check all indexes created and valid
npm run db:validate-indexes

# Run query performance tests
npm run test:performance -- --grep "index performance"
# Should show >90% reduction in query time for common operations
```

**Deliverable**: All indexes created, query performance validated

---

**Day 8-9: Row-Level Security (RLS) Policies**

```sql
-- Task 1.16: Enable RLS on tenant tables
ALTER TABLE tenant.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant.breeding_plans ENABLE ROW LEVEL SECURITY;
-- ... enable for all tenant tables

-- Task 1.17: Create tenant isolation policies
CREATE POLICY tenant_isolation_policy ON tenant.contacts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation_policy ON tenant.invoices
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::int);

CREATE POLICY tenant_isolation_policy ON tenant.payments
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::int);

-- ... create policies for all tenant tables

-- Task 1.18: Create bypass role for system operations
CREATE ROLE system_admin;
GRANT ALL ON ALL TABLES IN SCHEMA tenant TO system_admin;
ALTER TABLE tenant.contacts FORCE ROW LEVEL SECURITY; -- Enforce RLS even for superuser
```

**Validation**:
```bash
npm run test:security -- --grep "row level security"
# Should block cross-tenant queries
# Should allow same-tenant queries
# Should allow system_admin bypass
```

**Deliverable**: RLS enabled, tenant isolation verified

---

**Day 10: Data Type Fixes and Constraints**

```sql
-- Task 1.19: Fix remaining data types
ALTER TABLE marketplace.transactions ALTER COLUMN id TYPE BIGSERIAL;
ALTER TABLE marketplace.messages ALTER COLUMN id TYPE BIGSERIAL;

-- Task 1.20: Add missing constraints
ALTER TABLE tenant.invoices ADD CONSTRAINT chk_balance_not_negative
  CHECK (balance_cents >= 0);

ALTER TABLE tenant.invoices ADD CONSTRAINT chk_refund_not_exceed_amount
  CHECK (refunded_cents <= amount_cents);

ALTER TABLE marketplace.invoices ADD CONSTRAINT chk_balance_not_negative
  CHECK (balance_cents >= 0);
```

**Validation**:
```bash
npm run test:schema -- --grep "data types and constraints"
```

**Deliverable**: All data types correct, constraints enforced

---

#### Week 2.5: Prisma Schema Update (Days 11-12)

**Day 11-12: Update Prisma Schema**

```typescript
// Task 1.21: Update prisma/schema.prisma to match new database schema

// Add marketplace models
model MarketplaceUser {
  id                Int       @id @default(autoincrement())
  email             String    @unique
  emailVerified     Boolean   @default(false)
  // ... (complete model definitions)

  @@map("users")
  @@schema("marketplace")
}

model MarketplaceProvider {
  id              Int      @id @default(autoincrement())
  userId          Int      @map("user_id")
  tenantId        Int?     @map("tenant_id")
  // ... (complete model)

  user            MarketplaceUser @relation(fields: [userId], references: [id])
  tenant          Tenant?         @relation(fields: [tenantId], references: [id])

  @@map("providers")
  @@schema("marketplace")
}

// Update tenant models with new fields
model Contact {
  id                          Int       @id @default(autoincrement())
  tenantId                    Int       @map("tenant_id")
  marketplaceUserId           Int?      @map("marketplace_user_id")
  marketplaceFirstTransactionAt DateTime? @map("marketplace_first_transaction_at")
  // ... (add all new fields)

  marketplaceUser             MarketplaceUser? @relation(fields: [marketplaceUserId], references: [id])

  @@unique([marketplaceUserId, tenantId])
  @@map("contacts")
  @@schema("tenant")
}

// Task 1.22: Generate Prisma client
// npm run prisma:generate

// Task 1.23: Validate Prisma client against database
// npm run prisma:validate
```

**Validation**:
```bash
# Generate client
npm run prisma:generate

# Validate schema matches database
npm run prisma:validate

# Test Prisma client can query all tables
npm run test:prisma-client
```

**Deliverable**: Prisma schema updated, client generated and validated

---

### Phase 1 Deliverables

✅ Marketplace schema created (7 tables, all foreign keys)
✅ Tenant schema updated (3 tables, 15+ new columns)
✅ Shared audit schema created (3 tables)
✅ 20+ critical indexes created (CONCURRENTLY)
✅ Row-Level Security enabled and tested
✅ Data types fixed for scale (BIGINT)
✅ Prisma schema updated and client generated

### Phase 1 Exit Criteria

- [ ] All schema migrations run successfully in staging
- [ ] All indexes created without errors
- [ ] RLS policies prevent cross-tenant queries (tested)
- [ ] Prisma client generated without errors
- [ ] Schema validation tests pass (100%)
- [ ] No production data lost or corrupted
- [ ] Rollback procedure tested successfully

**Gate**: Cannot proceed to Phase 2 until all exit criteria met

---

## Phase 2: Security & Performance Hardening

**Duration**: 2 weeks (10 business days)
**Team**: 1 backend engineer + 1 security engineer
**Blocking**: YES - Required for production launch
**Downtime**: None

### Overview

Fix critical security vulnerabilities, implement performance optimizations, add monitoring and audit capabilities.

### Work Breakdown

#### Week 3: Security Fixes (Days 13-17)

**Day 13: Authorization Framework**

```typescript
// Task 2.1: Implement RLS context middleware
// src/middleware/tenant-context.ts

export async function setTenantContext(tenantId: number) {
  await prisma.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantId}`;
}

export async function tenantContextMiddleware(req, res, next) {
  const tenantId = extractTenantId(req); // From JWT or header

  if (tenantId) {
    await setTenantContext(tenantId);
  }

  next();
}

// Task 2.2: Implement marketplace user authorization
// src/middleware/marketplace-auth.ts

export async function authorizeMarketplaceUserTenantAccess(
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
    await logAuthorizationFailure(user, tenantId, action, 'no_contact');
    throw new ForbiddenError('Not authorized for this tenant');
  }

  // Set RLS context
  await setTenantContext(tenantId);

  // Log successful authorization
  await logAuthorizationSuccess(user, tenantId, action);

  return contact;
}

// Task 2.3: Add to all tenant routes
app.use('/api/v1/tenants/:tenantId/*', tenantContextMiddleware);
```

**Validation**:
```bash
npm run test:security -- --grep "authorization"
# Should block unauthorized cross-tenant access
# Should allow authorized access
# Should log all decisions
```

**Deliverable**: Authorization framework with RLS integration

---

**Day 14: Audit Logging**

```typescript
// Task 2.4: Implement authorization audit logging
// src/services/audit-service.ts

export async function logAuthorizationDecision(data: {
  userId: string;
  userType: 'marketplace_user' | 'tenant_staff';
  resourceSchema: string;
  resourceType: string;
  resourceId: string;
  action: string;
  allowed: boolean;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.authorizationAudit.create({
    data: {
      userId: data.userId,
      userType: data.userType,
      resourceSchema: data.resourceSchema,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      action: data.action,
      allowed: data.allowed,
      reason: data.reason,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      requestedAt: new Date()
    }
  });
}

// Task 2.5: Implement invoice audit logging
export async function logInvoiceStateChange(data: {
  invoiceSchema: 'tenant' | 'marketplace';
  invoiceId: number;
  tenantId?: number;
  changedByUserId: string;
  oldStatus: string;
  newStatus: string;
  action: string;
  metadata?: any;
}) {
  await prisma.invoiceAuditLog.create({
    data: {
      invoiceSchema: data.invoiceSchema,
      invoiceId: data.invoiceId,
      tenantId: data.tenantId,
      changedByUserId: data.changedByUserId,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      action: data.action,
      metadata: data.metadata,
      changedAt: new Date()
    }
  });
}

// Task 2.6: Add audit logging to all invoice state changes
// Update invoice update handlers to call logInvoiceStateChange
```

**Validation**:
```bash
npm run test:audit -- --grep "audit logging"
# Should log all authorization decisions
# Should log all invoice state changes
```

**Deliverable**: Complete audit logging system

---

**Day 15: Webhook Security**

```typescript
// Task 2.7: Implement Stripe webhook signature verification
// src/routes/webhooks/stripe.ts

import { stripe } from '../../services/stripe-service.js';

export async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', { err });
    return res.status(400).send({ error: 'Invalid signature' });
  }

  // Task 2.8: Implement webhook idempotency
  const existingEvent = await prisma.stripeWebhookEvent.findFirst({
    where: {
      eventId: event.id,
      status: 'success' // Only skip if previously succeeded
    }
  });

  if (existingEvent) {
    logger.info('Webhook already processed', { eventId: event.id });
    return res.status(200).send({ received: true });
  }

  // Task 2.9: Process webhook
  try {
    await processStripeWebhookEvent(event);

    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'success',
        processedAt: new Date()
      }
    });

    return res.status(200).send({ received: true });
  } catch (err) {
    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        status: 'failed',
        attempts: 1,
        errorMessage: err.message
      }
    });

    // Throw error so Stripe retries
    throw err;
  }
}

// Task 2.10: Implement webhook retry background job
export async function retryFailedWebhooks() {
  const failed = await prisma.stripeWebhookEvent.findMany({
    where: {
      status: 'failed',
      attempts: { lt: 5 },
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }
  });

  for (const webhookEvent of failed) {
    try {
      const event = await stripe.events.retrieve(webhookEvent.eventId);
      await processStripeWebhookEvent(event);

      await prisma.stripeWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: 'success', processedAt: new Date() }
      });
    } catch (err) {
      await prisma.stripeWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: { attempts: webhookEvent.attempts + 1 }
      });
    }
  }
}
```

**Validation**:
```bash
npm run test:webhooks -- --grep "stripe security"
# Should reject invalid signatures
# Should handle idempotency correctly
# Should retry failed webhooks
```

**Deliverable**: Secure webhook handling with retry

---

**Day 16-17: Idempotency for Write Operations**

```typescript
// Task 2.11: Implement idempotency middleware
// src/middleware/idempotency.ts

import crypto from 'crypto';

export function hashRequestBody(body: any): string {
  return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

export async function idempotencyMiddleware(req, res, next) {
  // Only for write operations
  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({
      error: 'IDEMPOTENCY_KEY_REQUIRED',
      message: 'Idempotency-Key header is required for write operations'
    });
  }

  const tenantId = extractTenantId(req);
  const requestHash = hashRequestBody(req.body);

  // Check if key already used
  const existing = await prisma.idempotencyKey.findFirst({
    where: {
      key: idempotencyKey,
      tenantId: tenantId
    }
  });

  if (existing) {
    if (existing.requestHash === requestHash) {
      // Same request - return cached response
      logger.info('Idempotent request - returning cached response', {
        idempotencyKey,
        requestHash
      });
      return res.status(200).json(existing.responseData);
    } else {
      // Different request with same key - conflict
      return res.status(409).json({
        error: 'IDEMPOTENCY_CONFLICT',
        message: 'Idempotency key already used with different request'
      });
    }
  }

  // Store in request for use after response
  req.idempotencyKey = idempotencyKey;
  req.idempotencyHash = requestHash;

  next();
}

// Task 2.12: Response interceptor to cache idempotent responses
export async function cacheIdempotentResponse(
  idempotencyKey: string,
  tenantId: number,
  requestHash: string,
  responseData: any
) {
  await prisma.idempotencyKey.create({
    data: {
      key: idempotencyKey,
      tenantId: tenantId,
      requestHash: requestHash,
      responseData: responseData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });
}

// Task 2.13: Add idempotency table
// CREATE TABLE idempotency_keys (
//   id SERIAL PRIMARY KEY,
//   key VARCHAR(255) NOT NULL,
//   tenant_id INTEGER,
//   request_hash VARCHAR(64) NOT NULL,
//   response_data JSONB NOT NULL,
//   created_at TIMESTAMP DEFAULT NOW(),
//   expires_at TIMESTAMP NOT NULL,
//   UNIQUE(key, tenant_id)
// );

// Task 2.14: Add to all write endpoints
app.use('/api/v1/*', idempotencyMiddleware);
```

**Validation**:
```bash
npm run test:idempotency
# Should prevent duplicate invoice creation
# Should detect conflicts
# Should cache responses for 24 hours
```

**Deliverable**: Idempotency for all write operations

---

#### Week 4: Performance Optimization (Days 18-22)

**Day 18: Query Optimization**

```typescript
// Task 2.15: Fix N+1 queries in invoice listing
// BEFORE (N+1):
const invoices = await prisma.invoice.findMany();
for (const invoice of invoices) {
  const party = await prisma.party.findUnique({ where: { id: invoice.clientPartyId } });
}

// AFTER (Single query):
const invoices = await prisma.invoice.findMany({
  include: {
    clientParty: {
      select: {
        id: true,
        name: true,
        email: true
      }
    }
  }
});

// Task 2.16: Add pagination to all list endpoints
export async function listInvoices(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { clientParty: true }
    }),
    prisma.invoice.count()
  ]);

  res.json({
    items: invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
}

// Task 2.17: Optimize contact resolution for marketplace
export async function batchGetTenantContacts(
  tenantContactPairs: Array<{ tenantId: number; marketplaceUserId: number }>
) {
  const contacts = await prisma.contact.findMany({
    where: {
      OR: tenantContactPairs.map(pair => ({
        tenantId: pair.tenantId,
        marketplaceUserId: pair.marketplaceUserId
      }))
    }
  });

  // Return as map for O(1) lookup
  return contacts.reduce((map, contact) => {
    map[`${contact.tenantId}:${contact.marketplaceUserId}`] = contact;
    return map;
  }, {});
}
```

**Validation**:
```bash
npm run test:performance -- --grep "query optimization"
# Should show >90% reduction in query count
# Should show <100ms p95 latency for list endpoints
```

**Deliverable**: All N+1 queries eliminated, pagination added

---

**Day 19: Caching Strategy**

```typescript
// Task 2.18: Implement Redis caching layer
// src/services/cache-service.ts

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cacheProvider(providerId: number, data: any) {
  await redis.set(
    `provider:${providerId}`,
    JSON.stringify(data),
    'EX',
    600 // 10 minutes
  );
}

export async function getCachedProvider(providerId: number) {
  const cached = await redis.get(`provider:${providerId}`);
  return cached ? JSON.parse(cached) : null;
}

export async function invalidateProviderCache(providerId: number) {
  await redis.del(`provider:${providerId}`);
}

// Task 2.19: Implement cache middleware
export async function cacheMiddleware(ttl: number) {
  return async (req, res, next) => {
    const cacheKey = `${req.method}:${req.path}:${JSON.stringify(req.query)}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Intercept response
    const originalJson = res.json;
    res.json = function(data) {
      redis.set(cacheKey, JSON.stringify(data), 'EX', ttl);
      return originalJson.call(this, data);
    };

    next();
  };
}

// Task 2.20: Add caching to high-traffic endpoints
app.get('/api/v1/marketplace/providers/:id',
  cacheMiddleware(600), // 10 minute cache
  getProvider
);

app.get('/api/v1/marketplace/listings',
  cacheMiddleware(60), // 1 minute cache
  listServiceListings
);
```

**Validation**:
```bash
npm run test:caching
# Should cache responses
# Should invalidate on updates
# Should reduce database load by >50%
```

**Deliverable**: Caching layer implemented

---

**Day 20-21: Monitoring & Observability**

```typescript
// Task 2.21: Implement metrics collection
// src/services/metrics-service.ts

import { Counter, Histogram, Gauge } from 'prom-client';

export const queryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['schema', 'model', 'operation']
});

export const invoiceStateTransition = new Counter({
  name: 'invoice_state_transition_total',
  help: 'Invoice state transitions',
  labelNames: ['schema', 'from', 'to', 'payment_mode']
});

export const authorizationFailures = new Counter({
  name: 'authorization_failure_total',
  help: 'Authorization failures',
  labelNames: ['reason', 'schema', 'user_type']
});

export const webhookProcessing = new Counter({
  name: 'stripe_webhook_result_total',
  help: 'Stripe webhook processing results',
  labelNames: ['event_type', 'result']
});

// Task 2.22: Add metrics to Prisma queries
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = (Date.now() - start) / 1000;

  queryDuration.observe({
    schema: params.model?.includes('Marketplace') ? 'marketplace' : 'tenant',
    model: params.model,
    operation: params.action
  }, duration);

  return result;
});

// Task 2.23: Create monitoring dashboards
// - Database query performance
// - Invoice state transitions
// - Authorization failures
// - Webhook processing
// - API error rates
```

**Deliverable**: Complete monitoring infrastructure

---

**Day 22: Performance Testing**

```bash
# Task 2.24: Load testing
k6 run --vus 100 --duration 60s load-tests/create-invoices.js
k6 run --vus 200 --duration 60s load-tests/list-invoices.js
k6 run --vus 50 --duration 30s load-tests/marketplace-search.js

# Task 2.25: Verify performance targets
# p95 latency < 200ms
# p99 latency < 500ms
# Error rate < 0.1%
# Database CPU < 70%
```

**Deliverable**: Performance test results meeting targets

---

### Phase 2 Deliverables

✅ Authorization framework with RLS
✅ Complete audit logging (authorization + invoices)
✅ Secure webhook handling with retry
✅ Idempotency for all write operations
✅ All N+1 queries eliminated
✅ Pagination on all list endpoints
✅ Caching layer (Redis)
✅ Monitoring & metrics (Prometheus)
✅ Performance tests passing

### Phase 2 Exit Criteria

- [ ] Authorization tests pass (100%)
- [ ] Audit logs capture all required events
- [ ] Webhook security verified (invalid signatures rejected)
- [ ] Idempotency tests pass (no duplicate creates)
- [ ] Load tests meet performance targets
- [ ] Cache hit rate >70% for cached endpoints
- [ ] Monitoring dashboards operational
- [ ] No security vulnerabilities in penetration test

**Gate**: Cannot proceed to Phase 3 until all exit criteria met

---

## Phase 3: Backend API Modernization

**Duration**: 2 weeks (10 business days)
**Team**: 2 backend engineers
**Blocking**: YES - Required for marketplace/portal launch
**Downtime**: None (versioned deployment)

### Overview

Modernize API layer with RESTful design, versioning, optimistic locking, and proper error handling.

### Work Breakdown

#### Week 5: API Refactoring (Days 23-27)

**Day 23: API Versioning**

```typescript
// Task 3.1: Add API versioning to all endpoints
// BEFORE:
app.get('/invoices', listInvoices);
app.post('/invoices', createInvoice);

// AFTER:
app.get('/api/v1/tenants/:tenantId/invoices', listInvoices);
app.post('/api/v1/tenants/:tenantId/invoices', createInvoice);

// Task 3.2: Create version migration guide
// Document all endpoint changes for clients
```

**Deliverable**: All endpoints versioned (v1)

---

**Day 24: RESTful Corrections**

```typescript
// Task 3.3: Fix non-RESTful endpoints
// BEFORE (Wrong verb):
app.post('/api/v1/invoices/:id/mark-paid', markInvoicePaid);
app.post('/api/v1/invoices/:id/confirm-payment', confirmPayment);

// AFTER (Correct verb):
app.patch('/api/v1/invoices/:id', updateInvoice);

// updateInvoice handler:
async function updateInvoice(req, res) {
  const { action } = req.body;

  switch (action) {
    case 'mark_paid':
      return await markInvoicePaid(req, res);
    case 'confirm_payment':
      return await confirmPayment(req, res);
    case 'void':
      return await voidInvoice(req, res);
    default:
      return await standardUpdate(req, res);
  }
}

// Task 3.4: Update all affected endpoints
// - Invoice state transitions
// - Transaction updates
// - Provider updates
```

**Deliverable**: All endpoints follow REST conventions

---

**Day 25: Optimistic Locking**

```typescript
// Task 3.5: Add version checks to all updates
async function updateInvoice(req, res) {
  const { id } = req.params;
  const { version, ...updates } = req.body;

  const invoice = await prisma.invoice.findUnique({
    where: { id: parseInt(id) }
  });

  if (!invoice) {
    return res.status(404).json({
      error: 'RESOURCE_NOT_FOUND',
      message: 'Invoice not found'
    });
  }

  if (invoice.version !== version) {
    return res.status(409).json({
      error: 'VERSION_CONFLICT',
      message: 'Invoice has been modified by another request',
      details: {
        providedVersion: version,
        currentVersion: invoice.version
      }
    });
  }

  const updated = await prisma.invoice.update({
    where: { id: parseInt(id) },
    data: {
      ...updates,
      version: { increment: 1 }
    }
  });

  res.json(updated);
}

// Task 3.6: Add version field to all update requests
// Task 3.7: Update API documentation
```

**Deliverable**: Optimistic locking on all updates

---

**Day 26-27: Error Handling Standardization**

```typescript
// Task 3.8: Create standardized error response format
// src/middleware/error-handler.ts

export class ApiError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
  }
}

export function errorHandler(err, req, res, next) {
  const requestId = req.id; // Request ID from middleware

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: {
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: 'Resource already exists',
        details: { field: err.meta?.target },
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  // Unknown error
  logger.error('Unhandled error', { err, requestId });
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId
    }
  });
}

// Task 3.9: Update all error responses to use standard format
// Task 3.10: Document all error codes
```

**Deliverable**: Standardized error handling

---

#### Week 6: New Marketplace APIs (Days 28-32)

**Day 28-29: Marketplace Authentication**

```typescript
// Task 3.11: Implement marketplace user registration
app.post('/api/v1/marketplace/auth/register', async (req, res) => {
  const { email, password, firstName, lastName, userType } = req.body;

  // Validate
  if (!email || !password) {
    throw new ApiError('VALIDATION_ERROR', 'Email and password required', 400);
  }

  // Check if exists
  const existing = await prisma.marketplaceUser.findUnique({
    where: { email }
  });

  if (existing) {
    throw new ApiError('USER_EXISTS', 'Email already registered', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.marketplaceUser.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      userType
    }
  });

  // Generate JWT
  const token = generateMarketplaceJWT(user);

  res.status(201).json({
    user: sanitizeUser(user),
    token
  });
});

// Task 3.12: Implement marketplace user login
// Task 3.13: Implement password reset flow
// Task 3.14: Implement email verification
```

**Deliverable**: Marketplace authentication complete

---

**Day 30: Marketplace Listings API**

```typescript
// Task 3.15: GET /api/v1/marketplace/listings (search)
app.get('/api/v1/marketplace/listings', async (req, res) => {
  const { category, state, city, q, page = 1, limit = 50 } = req.query;

  const where: any = { status: 'active' };

  if (category) where.category = category;
  if (state) where.state = state;
  if (city) where.city = city;
  if (q) {
    // Full-text search
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } }
    ];
  }

  const [listings, total] = await Promise.all([
    prisma.serviceListing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        provider: {
          select: { businessName: true, city: true, state: true, averageRating: true }
        },
        images: { orderBy: { sortOrder: 'asc' } }
      }
    }),
    prisma.serviceListing.count({ where })
  ]);

  res.json({
    items: listings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

// Task 3.16: GET /api/v1/marketplace/listings/:slug (detail)
// Task 3.17: POST /api/v1/marketplace/listings (create)
// Task 3.18: PATCH /api/v1/marketplace/listings/:id (update)
```

**Deliverable**: Marketplace listing APIs

---

**Day 31: Marketplace Transaction API**

```typescript
// Task 3.19: POST /api/v1/marketplace/transactions (create)
app.post('/api/v1/marketplace/transactions', async (req, res) => {
  const user = await authenticateMarketplaceUser(req);
  const { providerId, listingId, serviceDescription } = req.body;

  const provider = await prisma.marketplaceProvider.findUnique({
    where: { id: providerId },
    include: { tenant: true }
  });

  if (!provider) {
    throw new ApiError('PROVIDER_NOT_FOUND', 'Provider not found', 404);
  }

  // Determine invoice type
  const invoiceType = provider.isBreeder && provider.tenantId ? 'tenant' : 'marketplace';

  // Create transaction + invoice atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create transaction
    const transaction = await tx.marketplaceTransaction.create({
      data: {
        clientId: user.id,
        providerId,
        listingId,
        serviceDescription,
        invoiceType,
        tenantId: provider.tenantId,
        totalCents: calculateTotal(req.body),
        status: 'pending_invoice'
      }
    });

    // Create invoice (logic from implementation plan)
    const invoice = await createInvoiceForTransaction(tx, transaction, provider);

    // Update transaction
    await tx.marketplaceTransaction.update({
      where: { id: transaction.id },
      data: {
        invoiceId: invoice.id,
        status: 'invoiced',
        invoicedAt: new Date()
      }
    });

    return { transaction, invoice };
  });

  res.status(201).json(result);
});

// Task 3.20: GET /api/v1/marketplace/transactions (list)
// Task 3.21: GET /api/v1/marketplace/transactions/:id (detail)
// Task 3.22: PATCH /api/v1/marketplace/transactions/:id (update)
```

**Deliverable**: Marketplace transaction APIs

---

**Day 32: Invoice Resolution API**

```typescript
// Task 3.23: GET /api/v1/marketplace/transactions/:id/invoice
// (Abstracts cross-schema complexity)
app.get('/api/v1/marketplace/transactions/:id/invoice', async (req, res) => {
  const user = await authenticateMarketplaceUser(req);
  const { id } = req.params;

  const transaction = await prisma.marketplaceTransaction.findUnique({
    where: { id: parseInt(id) },
    include: { provider: true }
  });

  if (!transaction) {
    throw new ApiError('TRANSACTION_NOT_FOUND', 'Transaction not found', 404);
  }

  // Authorize access
  if (user.id !== transaction.clientId && user.id !== transaction.provider.userId) {
    throw new ApiError('FORBIDDEN', 'Not authorized to view this invoice', 403);
  }

  // Fetch invoice based on type (single DB makes this easy!)
  let invoice;
  if (transaction.invoiceType === 'tenant') {
    await setTenantContext(transaction.tenantId!);
    invoice = await prisma.invoice.findUnique({
      where: {
        tenant_id_id: {
          tenant_id: transaction.tenantId!,
          id: transaction.invoiceId
        }
      },
      include: { lineItems: true }
    });
  } else {
    invoice = await prisma.marketplaceInvoice.findUnique({
      where: { id: transaction.invoiceId },
      include: { lineItems: true }
    });
  }

  res.json({
    invoiceType: transaction.invoiceType,
    invoice: formatInvoiceForClient(invoice, transaction.invoiceType)
  });
});

// Task 3.24: POST /api/v1/marketplace/invoices/:id/receipts (upload)
// Task 3.25: PATCH /api/v1/marketplace/invoices/:id (mark paid, confirm)
```

**Deliverable**: Invoice resolution and payment APIs

---

### Phase 3 Deliverables

✅ All endpoints versioned (v1)
✅ All endpoints follow REST conventions
✅ Optimistic locking on all updates
✅ Standardized error handling
✅ Marketplace authentication APIs
✅ Marketplace listing APIs
✅ Marketplace transaction APIs
✅ Invoice resolution API
✅ Payment receipt upload API

### Phase 3 Exit Criteria

- [ ] API integration tests pass (100%)
- [ ] OpenAPI spec generated and validated
- [ ] All endpoints documented
- [ ] Postman collection created
- [ ] Client migration guide completed
- [ ] Backward compatibility verified (where needed)
- [ ] API load tests pass (<200ms p95)

**Gate**: Cannot proceed to Phase 4 until all exit criteria met

---

## Phase 4: Frontend Alignment

**Duration**: 1.5 weeks (7-8 business days)
**Team**: 1-2 frontend engineers
**Blocking**: NO (can proceed in parallel with marketplace/portal development)
**Downtime**: None

### Overview

Update frontend applications to use new API endpoints, handle new error formats, and support new marketplace features.

### Work Breakdown

#### Week 7-8: Frontend Updates (Days 33-40)

**Day 33-34: API Client Updates**

```typescript
// Task 4.1: Update API client base URL and versioning
// src/lib/api-client.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.breederhq.com';
const API_VERSION = 'v1';

export class ApiClient {
  private baseUrl = `${API_BASE_URL}/api/${API_VERSION}`;

  async request(endpoint: string, options?: RequestInit) {
    const url = `${this.baseUrl}${endpoint}`;

    // Add idempotency key for write operations
    const headers: any = {
      'Content-Type': 'application/json',
      ...options?.headers
    };

    if (['POST', 'PATCH', 'DELETE'].includes(options?.method || 'GET')) {
      headers['Idempotency-Key'] = generateIdempotencyKey();
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.error.code, error.error.message, response.status);
    }

    return response.json();
  }
}

// Task 4.2: Update all API calls to use new endpoints
// BEFORE:
await apiClient.get('/invoices');

// AFTER:
await apiClient.get(`/tenants/${tenantId}/invoices`);

// Task 4.3: Add version field to all update requests
await apiClient.patch(`/tenants/${tenantId}/invoices/${id}`, {
  version: invoice.version, // Include current version
  status: 'paid'
});
```

**Deliverable**: API client updated for v1 endpoints

---

**Day 35-36: Error Handling Updates**

```typescript
// Task 4.4: Update error handling for new format
// src/lib/error-handler.ts

export function handleApiError(error: any) {
  if (error.code === 'VERSION_CONFLICT') {
    // Show user-friendly message about concurrent modification
    toast.error('This record was updated by another user. Please refresh and try again.');
    return;
  }

  if (error.code === 'IDEMPOTENCY_CONFLICT') {
    // This shouldn't happen in normal operation
    toast.error('Duplicate request detected. Please try again.');
    return;
  }

  if (error.code === 'VALIDATION_ERROR') {
    // Show field-level validation errors
    const fields = error.details?.fields || {};
    Object.entries(fields).forEach(([field, message]) => {
      toast.error(`${field}: ${message}`);
    });
    return;
  }

  // Generic error
  toast.error(error.message || 'An unexpected error occurred');
}

// Task 4.5: Update all error handling in components
```

**Deliverable**: Frontend error handling updated

---

**Day 37-38: Pagination Updates**

```typescript
// Task 4.6: Update list components to use pagination
// src/components/InvoiceList.tsx

export function InvoiceList() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchInvoices() {
      const result = await apiClient.get(
        `/tenants/${tenantId}/invoices?page=${page}&limit=50`
      );
      setData(result);
    }
    fetchInvoices();
  }, [page]);

  return (
    <div>
      {data?.items.map(invoice => (
        <InvoiceCard key={invoice.id} invoice={invoice} />
      ))}

      <Pagination
        currentPage={data?.pagination.page}
        totalPages={data?.pagination.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}

// Task 4.7: Add pagination to all list views
// - Invoice list
// - Payment list
// - Contact list
// - Animal list
// - Transaction list (marketplace)
```

**Deliverable**: Pagination on all list views

---

**Day 39: Optimistic Locking UI**

```typescript
// Task 4.8: Add version tracking to forms
// src/components/InvoiceEditForm.tsx

export function InvoiceEditForm({ invoice }: { invoice: Invoice }) {
  const [formData, setFormData] = useState(invoice);

  async function handleSubmit() {
    try {
      await apiClient.patch(`/tenants/${tenantId}/invoices/${invoice.id}`, {
        version: invoice.version, // Include version
        ...formData
      });
      toast.success('Invoice updated successfully');
    } catch (error) {
      if (error.code === 'VERSION_CONFLICT') {
        // Reload fresh data
        const fresh = await apiClient.get(`/tenants/${tenantId}/invoices/${invoice.id}`);
        setFormData(fresh);
        toast.error('This invoice was updated by another user. Your changes were not saved. Please review and try again.');
      } else {
        handleApiError(error);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}

// Task 4.9: Add version conflict handling to all edit forms
```

**Deliverable**: Optimistic locking UI support

---

**Day 40: Marketplace Frontend Scaffolding**

```typescript
// Task 4.10: Create marketplace frontend structure
// apps/marketplace/src/pages/
// - /login
// - /register
// - /listings
// - /listings/[slug]
// - /transactions
// - /transactions/[id]
// - /messages

// Task 4.11: Create marketplace API client
// apps/marketplace/src/lib/marketplace-api.ts

export class MarketplaceApiClient {
  async searchListings(params: SearchParams) {
    return await this.request('/marketplace/listings', {
      method: 'GET',
      params
    });
  }

  async createTransaction(data: CreateTransactionData) {
    return await this.request('/marketplace/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getInvoiceForTransaction(transactionId: number) {
    return await this.request(`/marketplace/transactions/${transactionId}/invoice`, {
      method: 'GET'
    });
  }
}

// Task 4.12: Create basic marketplace UI components
// - ListingCard
// - ListingDetail
// - TransactionCard
// - InvoiceDisplay (abstracted, works for both tenant and marketplace invoices)
```

**Deliverable**: Marketplace frontend scaffolding

---

### Phase 4 Deliverables

✅ API client updated for v1 endpoints
✅ Error handling updated for new format
✅ Pagination on all list views
✅ Optimistic locking UI support
✅ Marketplace frontend scaffolding

### Phase 4 Exit Criteria

- [ ] All API calls use versioned endpoints
- [ ] All error scenarios handled gracefully
- [ ] All list views paginated
- [ ] Version conflict handling tested
- [ ] Marketplace frontend compiles and runs
- [ ] No console errors in development

**Note**: Phase 4 is NOT blocking for marketplace/portal backend launch. Frontend can be completed in parallel with feature development.

---

## Testing & Validation Strategy

### Unit Tests

```bash
# Database layer
npm run test:unit -- src/services/database/**/*.test.ts

# API layer
npm run test:unit -- src/routes/**/*.test.ts

# Business logic
npm run test:unit -- src/services/**/*.test.ts
```

**Coverage Target**: 80%+ for critical paths

### Integration Tests

```bash
# End-to-end flows
npm run test:integration -- tests/integration/invoice-flow.test.ts
npm run test:integration -- tests/integration/marketplace-transaction.test.ts
npm run test:integration -- tests/integration/payment-confirmation.test.ts
```

**Coverage Target**: All critical user journeys

### Security Tests

```bash
# RLS policies
npm run test:security -- tests/security/row-level-security.test.ts

# Authorization
npm run test:security -- tests/security/authorization.test.ts

# SQL injection
npm run test:security -- tests/security/sql-injection.test.ts
```

**Target**: Zero vulnerabilities

### Performance Tests

```bash
# Load testing
k6 run --vus 100 --duration 60s tests/load/create-invoices.js
k6 run --vus 200 --duration 60s tests/load/list-invoices.js
k6 run --vus 50 --duration 30s tests/load/marketplace-search.js

# Stress testing
k6 run --vus 500 --duration 120s tests/stress/full-platform.js
```

**Targets**:
- p95 < 200ms
- p99 < 500ms
- Error rate < 0.1%
- Database CPU < 70%

---

## Rollback Procedures

### Phase 1 Rollback (Database Schema)

```bash
# 1. Stop application
pm2 stop all

# 2. Restore database from backup
pg_restore -U postgres -d breederhq /backup/pre_phase1.dump

# 3. Revert Prisma client
git checkout main -- prisma/schema.prisma
npm run prisma:generate

# 4. Restart application
pm2 start all

# Expected: Application runs on old schema
```

### Phase 2 Rollback (Security & Performance)

```bash
# 1. Deploy previous code version
git revert <phase2-commits>
npm run build
pm2 reload all

# 2. Disable RLS policies (if causing issues)
psql -U postgres -d breederhq -c "ALTER TABLE tenant.contacts DISABLE ROW LEVEL SECURITY;"

# 3. Clear cache
redis-cli FLUSHALL

# Expected: Application runs without new security/performance features
```

### Phase 3 Rollback (API Modernization)

```bash
# 1. Deploy previous API version
git revert <phase3-commits>
npm run build
pm2 reload all

# 2. Update API client to use old endpoints (if frontend already deployed)
# (Frontend backward compatibility should handle this)

# Expected: Old API endpoints work, new endpoints return 404
```

---

## Success Criteria

### Phase 1 Success
- ✅ All schema migrations completed without data loss
- ✅ Foreign keys enforce referential integrity
- ✅ RLS policies prevent cross-tenant access
- ✅ Prisma client generated successfully
- ✅ Query performance improved (>90% faster)

### Phase 2 Success
- ✅ Authorization framework operational
- ✅ Audit logs capture all events
- ✅ Webhooks secure and idempotent
- ✅ Write operations idempotent
- ✅ Caching reduces DB load by >50%
- ✅ Performance tests pass

### Phase 3 Success
- ✅ All APIs versioned and documented
- ✅ RESTful conventions followed
- ✅ Optimistic locking prevents conflicts
- ✅ Error handling standardized
- ✅ Marketplace APIs functional

### Phase 4 Success
- ✅ Frontend uses new API endpoints
- ✅ Error handling graceful
- ✅ Pagination works on all lists
- ✅ Version conflicts handled
- ✅ Marketplace UI scaffolding complete

### Overall Success
- ✅ **ZERO production data loss**
- ✅ **ZERO security vulnerabilities**
- ✅ **Performance targets met** (<200ms p95)
- ✅ **All tests passing** (unit, integration, security, performance)
- ✅ **Documentation complete** (API specs, runbooks, architecture diagrams)
- ✅ **Team trained** on new systems

---

## Resource Requirements

### Team

- **2 Backend Engineers** (Phases 1-3)
- **1 DevOps Engineer** (Phases 1-2, infrastructure)
- **1 Security Engineer** (Phase 2, part-time)
- **1-2 Frontend Engineers** (Phase 4)
- **1 QA Engineer** (All phases, testing)

**Total**: 5-6 people

### Infrastructure

- **Staging Environment** (identical to production)
- **Redis** (caching layer)
- **Monitoring Stack** (Prometheus, Grafana)
- **Load Testing** (k6 or similar)

### Budget Estimate

| Item | Cost |
|------|------|
| Engineer time (8 weeks × 5 people) | $120,000 |
| Infrastructure (staging, Redis, monitoring) | $2,000/month |
| Third-party tools (load testing, security scanning) | $1,000 |
| **Total** | **~$125,000** |

---

## Risk Management

### High Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during migration | Low | Critical | Multiple backups, staging rehearsal, rollback tested |
| Performance degradation | Medium | High | Load testing before production, gradual rollout |
| Security breach post-RLS | Low | Critical | Penetration testing, audit logging, monitoring |
| API breaking changes affect clients | Medium | High | Versioning, backward compatibility, migration guide |
| Timeline slippage | Medium | Medium | Weekly checkpoints, parallel work where possible |

### Medium Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| RLS policies too strict | Medium | Medium | Thorough testing, bypass role for emergencies |
| Cache invalidation issues | Medium | Medium | Conservative TTLs, monitoring, manual invalidation endpoint |
| Prisma client generation fails | Low | Medium | Validate after every schema change |
| Webhook retry storms | Low | Medium | Exponential backoff, rate limiting |

---

## Timeline Summary

```
Week 1-2    Phase 1: Database Schema Modernization
            ├─ Create marketplace schema
            ├─ Update tenant schema
            ├─ Create indexes (CONCURRENTLY)
            ├─ Enable RLS policies
            └─ Update Prisma schema

Week 3-4    Phase 2: Security & Performance Hardening
            ├─ Authorization framework
            ├─ Audit logging
            ├─ Webhook security
            ├─ Idempotency
            ├─ Query optimization
            ├─ Caching layer
            └─ Monitoring

Week 5-6    Phase 3: Backend API Modernization
            ├─ API versioning
            ├─ RESTful corrections
            ├─ Optimistic locking
            ├─ Error handling
            ├─ Marketplace authentication
            ├─ Marketplace listings API
            ├─ Marketplace transactions API
            └─ Invoice resolution API

Week 7-8    Phase 4: Frontend Alignment (can overlap with marketplace dev)
            ├─ API client updates
            ├─ Error handling updates
            ├─ Pagination updates
            ├─ Optimistic locking UI
            └─ Marketplace frontend scaffolding
```

**Total Duration**: 8 weeks for phases 1-3 (blocking)
**Frontend**: Can proceed in parallel with marketplace/portal feature development after Phase 3

---

## Next Steps

### Immediate Actions

1. **Review & Approve Plan** (1 day)
   - Engineering leadership review
   - Security review
   - Budget approval

2. **Prepare Staging Environment** (2 days)
   - Clone production database to staging
   - Set up monitoring
   - Configure Redis

3. **Begin Phase 1** (Day 1)
   - Create feature branch
   - Start schema migrations
   - Daily standup to track progress

### Weekly Checkpoints

Every Friday:
- Review completed tasks
- Demo progress to stakeholders
- Identify blockers
- Adjust timeline if needed

### Go/No-Go Decision Points

- **End of Phase 1**: Schema migrations successful, no data loss → Proceed to Phase 2
- **End of Phase 2**: Security tests pass, performance targets met → Proceed to Phase 3
- **End of Phase 3**: All API tests pass, documentation complete → Approve for production

---

## Conclusion

This infrastructure work is **BLOCKING** for marketplace and client portal launch. The 8-week timeline is aggressive but achievable with the right team and focus.

**Key Success Factors**:
1. Zero-downtime migrations (all CONCURRENTLY)
2. Comprehensive testing at each phase
3. Rollback procedures tested before production
4. Clear go/no-go criteria at each gate
5. Daily communication and issue escalation

**After Completion**:
- ✅ Rock-solid infrastructure foundation
- ✅ Zero security vulnerabilities
- ✅ Performance at scale (1000+ concurrent users)
- ✅ Complete audit trail
- ✅ Modern, maintainable APIs
- ✅ **Ready for marketplace and client portal launch**

---

**Document Version**: 1.0
**Last Updated**: 2026-01-12
**Status**: Ready for Review and Approval
**Next Action**: Engineering leadership review and go/no-go decision
