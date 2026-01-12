# CRITICAL FIXES - EXECUTE IMMEDIATELY

**Priority**: FIX NOW
**Execution Order**: Run these in sequence

---

## 1. SCHEMA FIXES (30 minutes)

### File: `prisma/migrations/YYYYMMDDHHMMSS_critical_fixes/migration.sql`

```sql
-- ============================================================================
-- CRITICAL FIX #1: Data Type Overflow Prevention
-- ============================================================================
-- Invoice amounts can overflow at $21M with INT
ALTER TABLE "Invoice" ALTER COLUMN "amountCents" TYPE BIGINT;
ALTER TABLE "Invoice" ALTER COLUMN "balanceCents" TYPE BIGINT;
ALTER TABLE "Invoice" ALTER COLUMN "depositCents" TYPE BIGINT USING "depositCents"::BIGINT;

-- ============================================================================
-- CRITICAL FIX #2: Soft Deletes (Prevent Orphaned References)
-- ============================================================================
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

CREATE INDEX "Invoice_deletedAt_idx" ON "Invoice"("deletedAt") WHERE "deletedAt" IS NULL;
CREATE INDEX "Contact_deletedAt_idx" ON "Contact"("deletedAt") WHERE "deletedAt" IS NULL;

-- ============================================================================
-- CRITICAL FIX #3: Contact Tenant Isolation
-- ============================================================================
-- Replace simple index with compound to prevent cross-tenant data leakage
DROP INDEX IF EXISTS "Contact_marketplaceUserId_idx";

CREATE UNIQUE INDEX "Contact_marketplaceUserId_tenantId_key"
  ON "Contact"("marketplaceUserId", "tenantId")
  WHERE "marketplaceUserId" IS NOT NULL;

-- ============================================================================
-- CRITICAL FIX #4: Invoice Query Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS "Invoice_tenantId_status_createdAt_idx"
  ON "Invoice"("tenantId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Invoice_clientPartyId_status_idx"
  ON "Invoice"("clientPartyId", "status")
  WHERE "clientPartyId" IS NOT NULL;
```

**Execute**:
```bash
# Create migration file
mkdir -p prisma/migrations/$(date +%Y%m%d%H%M%S)_critical_fixes
# Copy above SQL into migration.sql

# Apply migration
npx prisma migrate deploy

# Verify
npx prisma db pull
npx prisma generate
```

---

## 2. UPDATE PRISMA SCHEMA (10 minutes)

### File: `prisma/schema.prisma`

**Find the Invoice model and update these fields**:

```prisma
model Invoice {
  // ... existing fields ...

  // FIX: Change Int to BigInt for currency fields
  amountCents   BigInt          // WAS: Int
  balanceCents  BigInt          // WAS: Int
  depositCents  BigInt?         // WAS: Int?

  // ADD: Soft delete support
  deletedAt     DateTime?

  // ... rest of fields ...

  // ADD: Performance indexes
  @@index([tenantId, status, createdAt(sort: Desc)])
  @@index([clientPartyId, status])
  @@index([deletedAt])
}
```

**Find the Contact model and update**:

```prisma
model Contact {
  // ... existing fields ...

  // ADD: Soft delete support
  deletedAt         DateTime?

  // ... rest of fields ...

  // FIX: Compound unique constraint for tenant isolation
  @@unique([marketplaceUserId, tenantId], name: "marketplaceUserId_tenantId_unique")
  @@index([deletedAt])
}
```

**Regenerate Prisma Client**:
```bash
npx prisma generate
```

---

## 3. API FIXES (1 hour)

### A. Fix Invoice Queries - Add Soft Delete Filters

**File**: `src/routes/invoices.ts` (or wherever invoice routes are)

**FIND all queries like**:
```typescript
await prisma.invoice.findMany({ where: { tenantId } })
```

**REPLACE with**:
```typescript
await prisma.invoice.findMany({
  where: {
    tenantId,
    deletedAt: null  // ADD THIS TO EVERY QUERY
  }
})
```

**Create helper function**:
```typescript
// src/utils/query-helpers.ts
export function activeOnly<T extends { deletedAt?: Date | null }>(where: any = {}) {
  return { ...where, deletedAt: null };
}

// Usage:
await prisma.invoice.findMany({
  where: activeOnly({ tenantId, status: 'issued' })
});
```

### B. Fix Invoice Creation - Validate Amounts

**File**: `src/routes/invoices.ts`

**FIND invoice creation endpoint**:
```typescript
router.post('/', async (req, res) => {
  const { amountCents, ... } = req.body;

  // ADD VALIDATION
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    return res.status(400).json({
      error: 'INVALID_AMOUNT',
      message: 'amountCents must be a positive integer'
    });
  }

  if (amountCents > Number.MAX_SAFE_INTEGER) {
    return res.status(400).json({
      error: 'AMOUNT_TOO_LARGE',
      message: 'Amount exceeds maximum safe value'
    });
  }

  // ... create invoice
});
```

### C. Fix Contact Queries - Add Tenant Isolation

**File**: `src/routes/contacts.ts`

**CRITICAL**: Every contact query MUST include tenantId

**FIND**:
```typescript
await prisma.contact.findUnique({ where: { id: contactId } })
```

**REPLACE**:
```typescript
await prisma.contact.findFirst({
  where: {
    id: contactId,
    tenantId: req.user.tenantId,  // MUST INCLUDE
    deletedAt: null
  }
})
```

**Add middleware to set tenant context**:
```typescript
// src/middleware/tenant-context.ts
export function requireTenant(req: any, res: any, next: any) {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({
      error: 'NO_TENANT',
      message: 'User not associated with a tenant'
    });
  }

  req.tenantId = tenantId;
  next();
}

// Apply to all tenant routes
router.use('/api/tenants/:tenantId/*', requireTenant);
```

---

## 4. MIDDLEWARE FIXES (30 minutes)

### A. Add Request Logging

**File**: `src/middleware/logging.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      tenantId: (req as any).tenantId,
      userId: (req as any).user?.id
    });
  });

  next();
}
```

### B. Add Error Handler

**File**: `src/middleware/error-handler.ts`

```typescript
export function errorHandler(err: any, req: any, res: any, next: any) {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'DUPLICATE_RECORD',
      message: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Record not found'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: err.message
    });
  }

  // Default 500
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'production'
      ? 'An error occurred'
      : err.message
  });
}

// Register in app.ts
app.use(errorHandler);
```

### C. Add Tenant Isolation Middleware

**File**: `src/middleware/tenant-isolation.ts`

```typescript
export async function enforceTenantIsolation(req: any, res: any, next: any) {
  // Get tenant from route params or user
  const routeTenantId = parseInt(req.params.tenantId);
  const userTenantId = req.user?.tenantId;

  // If route specifies tenant, ensure user has access
  if (routeTenantId && routeTenantId !== userTenantId) {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied to this tenant'
    });
  }

  // Set tenant context for queries
  req.tenantId = userTenantId || routeTenantId;
  next();
}
```

---

## 5. VERIFICATION TESTS (15 minutes)

### Test Data Type Fix

```typescript
// Test large invoice amounts
const testInvoice = await prisma.invoice.create({
  data: {
    tenantId: 1,
    amountCents: 999999999999, // $10 billion - should not overflow
    balanceCents: 999999999999,
    status: 'draft',
    invoiceNumber: 'TEST-001'
  }
});

console.log('BigInt test passed:', testInvoice.amountCents);
```

### Test Soft Delete

```typescript
// Delete invoice
await prisma.invoice.update({
  where: { id: 1 },
  data: { deletedAt: new Date() }
});

// Should not find it
const found = await prisma.invoice.findFirst({
  where: { id: 1, deletedAt: null }
});

console.log('Soft delete test passed:', found === null);
```

### Test Tenant Isolation

```typescript
// Try to query contact from different tenant
const contact = await prisma.contact.findFirst({
  where: {
    id: 1,
    tenantId: 999, // Wrong tenant
    deletedAt: null
  }
});

console.log('Tenant isolation test passed:', contact === null);
```

---

## 6. DEPLOYMENT CHECKLIST

- [ ] Database migration applied successfully
- [ ] Prisma client regenerated
- [ ] All invoice queries updated with `deletedAt: null`
- [ ] All contact queries updated with tenant isolation
- [ ] Middleware added: logging, error handling, tenant isolation
- [ ] Tests passing
- [ ] Environment variables configured
- [ ] Backup of database taken before deploy
- [ ] Deploy to staging
- [ ] Smoke test staging
- [ ] Deploy to production

---

## WHAT WE'RE NOT FIXING YET (Do Later)

❌ **Deferred** (not blocking):
- Advanced RLS policies
- Comprehensive audit logging
- Payment mode locking
- Webhook idempotency
- Performance optimizations beyond basic indexes
- Table partitioning
- Complex authorization rules

These can wait. Focus on the critical fixes above.

---

## EXECUTION TIME

**Total**: ~2.5 hours
- Schema fixes: 30 min
- Prisma updates: 10 min
- API fixes: 60 min
- Middleware: 30 min
- Testing: 15 min
- Deploy: 15 min

---

## NEED HELP?

If you hit any errors:

1. **Migration fails**: Send me the error message
2. **Prisma generate fails**: Check for syntax errors in schema.prisma
3. **API breaks**: Check that all queries include `deletedAt: null`
4. **Tests fail**: Verify test database is clean

**Start with #1 (Schema Fixes). Execute the SQL migration now.**
