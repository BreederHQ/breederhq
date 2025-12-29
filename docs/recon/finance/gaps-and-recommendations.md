# Finance MVP: Gaps and Recommendations

## Executive Summary

The Finance module requires:
1. **Schema additions:** Payment and Expense models + explicit anchor FKs on Invoice/Expense
2. **Backend work:** Full CRUD API for Invoice/Payment/Expense with tenant enforcement
3. **Frontend work:** Finance tab content for 5 object types + autocomplete components
4. **Migration strategy:** Align with existing Party migration workflow (dev uses `db push`)

**Current Status:**
- Invoice model exists with Party migration (Phase 5 in progress)
- Payment/Expense models DO NOT EXIST
- Frontend Finance app exists (standalone) with mock data only
- Finance tabs exist as placeholders on Contact/Organization, missing on Animal/OffspringGroup/BreedingPlan

**Risk Level:** MEDIUM
- Moderate schema changes (new models, new FKs, new indexes)
- No polymorphism (avoids complex migration)
- Tenant scoping patterns already established
- Party migration foundation in place

## MVP Schema Proposal

### 1. Invoice Model (Enhance Existing)

**Current state:** Exists with `clientPartyId`, legacy fields, no explicit anchors.

**Add these fields:**
```prisma
model Invoice {
  // Existing fields (keep)
  id              Int      @id @default(autoincrement())
  tenantId        Int
  number          String
  status          InvoiceStatus
  issueDate       DateTime
  dueDate         DateTime?
  total           Int      // cents
  balance         Int      // cents
  currency        String   @default("USD")
  notes           String?
  clientPartyId   Int?     // NEW from Party migration
  contactId       Int?     // DEPRECATED - keep for Phase 5
  organizationId  Int?     // DEPRECATED - keep for Phase 5
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // NEW: Explicit anchor FKs (nullable, mutually exclusive in business logic)
  offspringGroupId Int?
  offspringId      Int?
  animalId         Int?
  breedingPlanId   Int?
  serviceCode      String?  // For non-anchored invoices: "stud_fee", "boarding", "training", etc.

  // Relations
  tenant         Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  clientParty    Party?          @relation(fields: [clientPartyId], references: [id], onDelete: SetNull)
  offspringGroup OffspringGroup? @relation(fields: [offspringGroupId], references: [id], onDelete: SetNull)
  offspring      Offspring?      @relation(fields: [offspringId], references: [id], onDelete: SetNull)
  animal         Animal?         @relation(fields: [animalId], references: [id], onDelete: SetNull)
  breedingPlan   BreedingPlan?   @relation(fields: [breedingPlanId], references: [id], onDelete: SetNull)
  payments       Payment[]

  // Indexes (critical for Finance tab queries)
  @@index([tenantId, clientPartyId])
  @@index([tenantId, offspringGroupId])
  @@index([tenantId, offspringId])
  @@index([tenantId, animalId])
  @@index([tenantId, breedingPlanId])
  @@index([tenantId, status])
  @@index([tenantId, issueDate])
  @@unique([tenantId, number]) // Enforce unique invoice numbers per tenant
}

enum InvoiceStatus {
  DRAFT
  SENT
  PARTIAL
  PAID
  VOID
  REFUNDED
}
```

**Why explicit anchors?**
- Direct FK enforcement (no orphaned references)
- Efficient indexed queries (no polymorphic joins)
- Type-safe (Prisma knows field types)
- Mutually exclusive via business logic (API validation)

**serviceCode examples:**
- `"stud_fee"` — Breeding service revenue
- `"boarding"` — Animal boarding service
- `"training"` — Training service
- `"vet_service"` — Veterinary service
- `"general"` — Unanchored invoice

### 2. Payment Model (NEW)

```prisma
model Payment {
  id         Int      @id @default(autoincrement())
  tenantId   Int
  invoiceId  Int
  amount     Int      // cents
  method     PaymentMethod
  receivedAt DateTime
  reference  String?  // Stripe ID, check number, etc.
  notes      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([tenantId, invoiceId])
  @@index([tenantId, receivedAt])
}

enum PaymentMethod {
  CARD
  ACH
  CHECK
  CASH
  WIRE
  OTHER
}
```

**Validation rules (API layer):**
- `amount > 0`
- `receivedAt <= now()` (cannot record future payments)
- `sum(payments.amount) <= invoice.total` (prevent overpayment)

**Side effects (on create/update/delete):**
- Recalculate `Invoice.balance = total - sum(payments.amount)`
- Update `Invoice.status`:
  - `PARTIAL` if `0 < balance < total`
  - `PAID` if `balance = 0`
  - `SENT` if `balance = total` (no payments)

### 3. Expense Model (NEW)

```prisma
model Expense {
  id               Int      @id @default(autoincrement())
  tenantId         Int
  date             DateTime
  amount           Int      // cents
  currency         String   @default("USD")
  category         String?  // "vet", "food", "supplies", "boarding", "training", etc.
  vendorPartyId    Int?
  description      String?
  receiptUrl       String?  // File storage URL OR use Attachment relation
  notes            String?

  // Explicit anchor FKs (nullable, mutually exclusive)
  animalId         Int?
  offspringGroupId Int?
  breedingPlanId   Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant         Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  vendorParty    Party?          @relation(fields: [vendorPartyId], references: [id], onDelete: SetNull)
  animal         Animal?         @relation(fields: [animalId], references: [id], onDelete: SetNull)
  offspringGroup OffspringGroup? @relation(fields: [offspringGroupId], references: [id], onDelete: SetNull)
  breedingPlan   BreedingPlan?   @relation(fields: [breedingPlanId], references: [id], onDelete: SetNull)

  @@index([tenantId, vendorPartyId])
  @@index([tenantId, animalId])
  @@index([tenantId, offspringGroupId])
  @@index([tenantId, breedingPlanId])
  @@index([tenantId, category])
  @@index([tenantId, date])
}
```

**Category enum (optional, or keep as String):**
```prisma
enum ExpenseCategory {
  VET
  FOOD
  SUPPLIES
  BOARDING
  TRAINING
  GROOMING
  BREEDING_SERVICE
  MARKETING
  INSURANCE
  FACILITY
  OTHER
}
```

**Recommendation:** Use String for flexibility. Categories vary by tenant/species.

### 4. Attachment Integration (Optional)

**Current system:** Attachment model likely exists for documents.

**Option A:** Reuse Attachment for Expense receipts
```prisma
model Expense {
  attachments Attachment[] // Many-to-many or one-to-many
}
```

**Option B:** Simple `receiptUrl` field
```prisma
model Expense {
  receiptUrl String? // Direct file storage URL (S3, Cloudinary, etc.)
}
```

**Recommendation:** Use Option B for MVP (simpler). Add Attachment relation in Phase 2 for multiple receipts.

### 5. InvoiceLineItem Model (DEFER to Phase 2)

**Rationale:** MVP can use single `total` field. Itemization is nice-to-have, not MVP-critical.

**Phase 2 schema:**
```prisma
model InvoiceLineItem {
  id          Int     @id @default(autoincrement())
  tenantId    Int
  invoiceId   Int
  description String
  quantity    Decimal @default(1)
  unitPrice   Int     // cents
  lineTotal   Int     // cents (calculated: quantity * unitPrice)
  sortOrder   Int     @default(0)

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([tenantId, invoiceId])
}
```

**When to add:** When users request itemized invoices (deposits + balance, multiple line items).

## Required Indexes

### Composite Indexes (Tenant + Anchor)
**Critical for Finance tab queries:**
```prisma
// Invoice
@@index([tenantId, clientPartyId])
@@index([tenantId, offspringGroupId])
@@index([tenantId, offspringId])
@@index([tenantId, animalId])
@@index([tenantId, breedingPlanId])
@@index([tenantId, status])
@@index([tenantId, issueDate])

// Payment
@@index([tenantId, invoiceId])
@@index([tenantId, receivedAt])

// Expense
@@index([tenantId, vendorPartyId])
@@index([tenantId, animalId])
@@index([tenantId, offspringGroupId])
@@index([tenantId, breedingPlanId])
@@index([tenantId, category])
@@index([tenantId, date])
```

**Why composite indexes?**
- Every Finance query filters by `tenantId` first (multi-tenant isolation)
- Second field enables efficient range scans (dates, status, anchor IDs)
- PostgreSQL can use partial index for `WHERE tenantId = X AND animalId = Y`

### Unique Constraints
```prisma
// Invoice number must be unique per tenant
@@unique([tenantId, number])
```

**Why unique invoice numbers?**
- Accounting requirement (invoice numbers are legal identifiers)
- Prevents duplicate numbering
- Enables invoice lookup by number: `GET /api/v1/invoices?number=INV-2025-0001`

## Guardrails and Business Rules

### 1. Tenant Enforcement (CRITICAL)

**Every Finance endpoint MUST:**
```typescript
// Middleware
app.use('/api/v1/invoices', requireTenant);
app.use('/api/v1/payments', requireTenant);
app.use('/api/v1/expenses', requireTenant);

// Every query
await prisma.invoice.findMany({
  where: { tenantId, ...filters }
});
```

**No exceptions.** Tenant leakage = critical security breach.

### 2. Soft Delete vs Void

**Recommendation:** Use `status = VOID` for invoices (soft delete). Preserve records for audit.

**Delete behavior:**
```typescript
// NEVER hard-delete
await prisma.invoice.delete({ where: { id } }); // ❌

// Instead, void
await prisma.invoice.update({
  where: { id, tenantId },
  data: { status: 'VOID' }
}); // ✅
```

**UI:** Voided invoices hidden by default (`includeArchived=false`). Show with toggle.

**Payments/Expenses:** Allow hard delete (they're transactional, not legal records).

### 3. Immutable Invoice Numbers (Future)

**MVP:** Allow editing invoice number (simple implementation).

**Phase 2:** Once invoice is sent (`status != DRAFT`), number becomes immutable.

```typescript
// Validation in PATCH endpoint
if (invoice.status !== 'DRAFT' && input.number && input.number !== invoice.number) {
  throw new Error('Cannot change invoice number after sending');
}
```

### 4. Partial Payments and Balance Integrity

**Rules:**
- `sum(payments.amount) <= invoice.total` (no overpayment)
- `invoice.balance = invoice.total - sum(payments.amount)` (always consistent)
- Auto-update `invoice.status` based on balance:
  - `SENT` → `PARTIAL` on first payment
  - `PARTIAL` → `PAID` when balance reaches 0

**Implementation:** Trigger or service function called on Payment create/update/delete.

```typescript
async function recalculateInvoiceBalance(invoiceId: number, tenantId: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId },
    include: { payments: true }
  });

  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const newBalance = invoice.total - totalPaid;

  let newStatus = invoice.status;
  if (newBalance === invoice.total) newStatus = 'SENT';
  else if (newBalance > 0) newStatus = 'PARTIAL';
  else if (newBalance === 0) newStatus = 'PAID';

  await prisma.invoice.update({
    where: { id: invoiceId, tenantId },
    data: { balance: newBalance, status: newStatus }
  });
}
```

### 5. Mutually Exclusive Anchors (Business Logic)

**Rule:** An invoice can have ONE anchor (offspringGroupId OR offspringId OR animalId OR breedingPlanId OR serviceCode).

**Validation (API layer):**
```typescript
function validateInvoiceAnchors(input: CreateInvoiceInput) {
  const anchors = [
    input.offspringGroupId,
    input.offspringId,
    input.animalId,
    input.breedingPlanId,
    input.serviceCode
  ].filter(Boolean);

  if (anchors.length > 1) {
    throw new Error('Invoice can have only one anchor');
  }
}
```

**Database:** No constraint enforced (all nullable). Business logic ensures exclusivity.

### 6. Currency Handling

**MVP:** All amounts stored as **cents** (Int). Display layer converts to dollars.

```typescript
// Backend
data: { total: 250000 } // $2,500.00

// Frontend
formatCurrency(invoice.total, invoice.currency); // "$2,500.00"
```

**Why cents?**
- Avoids floating-point precision errors
- Standard accounting practice
- PostgreSQL `INTEGER` is efficient

**Phase 2:** Multi-currency support (exchange rates, conversion). MVP assumes USD.

### 7. Date Handling

**All dates stored as ISO 8601 strings or DateTime:**
- `issueDate`: Date only (no time)
- `dueDate`: Date only
- `receivedAt` (Payment): DateTime (timestamp)
- `date` (Expense): Date only

**Timezone:** Store UTC, display in tenant's local timezone.

## Migration Strategy

### Alignment with Existing Workflow

**Current dev workflow (from Party migration docs):**
1. Update `schema.prisma`
2. Run `npx prisma db push` (no migration files in dev)
3. For production: Generate migration SQL, test, apply

**Finance MVP workflow:**
1. Add Payment/Expense models to `schema.prisma`
2. Add explicit anchors to Invoice model
3. Run `npx prisma db push` in dev
4. Backfill existing invoices (if any) to populate anchors (optional)
5. For production: Generate migration, test, apply

### Schema Evolution Steps

**Step 1: Add Payment Model**
```prisma
// schema.prisma
model Payment { ... }
```

```bash
npx prisma db push
```

**Step 2: Add Expense Model**
```prisma
model Expense { ... }
```

```bash
npx prisma db push
```

**Step 3: Add Invoice Explicit Anchors**
```prisma
model Invoice {
  // Add
  offspringGroupId Int?
  offspringId      Int?
  animalId         Int?
  breedingPlanId   Int?
  serviceCode      String?
}
```

```bash
npx prisma db push
npx prisma generate
```

**Step 4: Add Indexes**
```prisma
// In Invoice model
@@index([tenantId, offspringGroupId])
@@index([tenantId, offspringId])
@@index([tenantId, animalId])
@@index([tenantId, breedingPlanId])
```

```bash
npx prisma db push
```

**Step 5: Backfill Anchors (if needed)**
If existing invoices have `scope` field data, migrate:

```sql
-- Example: Backfill offspringId from legacy scope logic
UPDATE "Invoice"
SET "offspringId" = (metadata->>'offspringId')::int
WHERE scope = 'offspring' AND metadata->>'offspringId' IS NOT NULL;
```

**Step 6: Production Migration**
```bash
npx prisma migrate dev --name finance_mvp_schema
```

Review `migration.sql`, test on staging, apply to production.

### Rollback Plan

**If issues arise:**
1. All new columns are nullable → no data loss
2. Drop new indexes: `DROP INDEX IF EXISTS ...`
3. Drop Payment/Expense tables: `DROP TABLE "Payment"; DROP TABLE "Expense";`
4. Remove anchor FKs from Invoice
5. Restore from backup if needed

**Recommendation:** Test schema changes on staging database first.

## Implementation Prerequisites

### Backend

1. **Schema changes** (above)
2. **API endpoints:**
   - Invoice CRUD (`/api/v1/invoices`)
   - Payment CRUD (`/api/v1/payments`)
   - Expense CRUD (`/api/v1/expenses`)
3. **Services:**
   - `InvoiceService.recalculateBalance()`
   - `PartyResolverService.resolveInvoicePartyId()` (exists)
4. **Middleware:**
   - `requireTenant()` — enforce tenant scoping
   - `validateInvoiceAnchors()` — ensure mutually exclusive anchors
5. **Tests:**
   - Invoice CRUD with tenant isolation
   - Payment creation updates invoice balance
   - Expense creation with anchor filters
   - Finance tab queries (by animalId, offspringGroupId, etc.)

### Frontend

1. **API client resources:**
   - `packages/api/src/resources/invoices.ts`
   - `packages/api/src/resources/payments.ts`
   - `packages/api/src/resources/expenses.ts`
2. **Shared components:**
   - `FinanceTabContent.tsx` — reusable Finance tab
   - `PaymentFormModal.tsx` — record payment
   - `ExpenseFormModal.tsx` — create expense
   - `PartyAutocomplete.tsx` — search contacts/organizations
   - `AnimalAutocomplete.tsx`, `OffspringGroupAutocomplete.tsx`, `BreedingPlanAutocomplete.tsx`
3. **Finance tab integration:**
   - Animal detail view (add Finance tab)
   - OffspringGroup detail view (add Finance tab)
   - BreedingPlan detail view (add Finance tab)
   - Contact/Organization detail view (replace placeholder)
4. **Currency formatting:**
   - Extract to `packages/ui/src/utils/currency.ts`

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Invoice anchor conflicts (multiple FKs set) | Data integrity | LOW | API validation enforces mutual exclusivity |
| Payment overpayment | Financial accuracy | MEDIUM | Validate `sum(payments) <= invoice.total` |
| Tenant data leakage | Security CRITICAL | LOW | Middleware + Prisma middleware enforce tenantId filter |
| Invoice number collisions | User confusion | MEDIUM | Add unique constraint `[tenantId, number]` |
| Balance recalculation bugs | Financial accuracy | MEDIUM | Comprehensive tests + transactional updates |
| Schema migration failures | Downtime | LOW | Test on staging first, rollback plan ready |
| Missing indexes → slow Finance tabs | Performance | HIGH | Create all composite indexes before launch |

## MVP Feature Scope (In/Out)

### IN SCOPE (MVP)
- ✅ Invoice CRUD with explicit anchors
- ✅ Payment recording with balance updates
- ✅ Expense tracking with anchors
- ✅ Finance tab on Animal/OffspringGroup/BreedingPlan/Party
- ✅ Invoice status workflow (DRAFT → SENT → PARTIAL → PAID)
- ✅ Simple total (no line items)
- ✅ Party autocomplete
- ✅ Anchor autocomplete (Animal, OffspringGroup, BreedingPlan)
- ✅ Tenant enforcement

### OUT OF SCOPE (Phase 2+)
- ❌ Line items (itemized invoices)
- ❌ Multi-currency (MVP assumes USD)
- ❌ Recurring invoices
- ❌ Invoice templates/branding
- ❌ Email/PDF generation
- ❌ Tax calculation (sales tax, VAT)
- ❌ Stripe/payment gateway integration (manual payments only)
- ❌ Expense categories with budgeting
- ❌ Financial reports (P&L, cash flow)
- ❌ Invoice numbering automation (manual entry in MVP)

## Recommended Development Order

1. **Schema + migrations** (1-2 days)
   - Add Payment model
   - Add Expense model
   - Add Invoice explicit anchors
   - Add indexes
   - Test schema on dev database

2. **Backend API** (3-5 days)
   - Invoice CRUD endpoints
   - Payment CRUD endpoints + balance recalculation
   - Expense CRUD endpoints
   - Tenant enforcement middleware
   - API integration tests

3. **Frontend API clients** (1 day)
   - `invoices.ts` resource
   - `payments.ts` resource
   - `expenses.ts` resource
   - Export from `packages/api`

4. **Shared UI components** (2-3 days)
   - `PartyAutocomplete.tsx`
   - `AsyncAutocomplete.tsx` (generic)
   - `FinanceTabContent.tsx`
   - `PaymentFormModal.tsx`
   - `ExpenseFormModal.tsx`

5. **Finance tab integration** (2-3 days)
   - Animal Finance tab
   - OffspringGroup Finance tab
   - BreedingPlan Finance tab
   - Contact/Organization Finance tab (replace placeholder)

6. **Testing + polish** (2-3 days)
   - End-to-end Finance tab workflows
   - Payment recording UX
   - Expense creation UX
   - Autocomplete search performance
   - Mobile responsiveness

**Total estimate:** 11-17 days (2-3 weeks) for MVP.

## Success Metrics

**MVP launch criteria:**
- [ ] Invoice CRUD endpoints functional with tenant isolation
- [ ] Payment recording updates invoice balance correctly
- [ ] Expense tracking functional with anchor filters
- [ ] Finance tab loads on all 5 object types
- [ ] Party autocomplete works with debounced search
- [ ] All Finance tab queries use indexed fields (no slow queries)
- [ ] No tenant data leakage (security audit)
- [ ] Frontend integration tests pass
- [ ] Backend API tests pass (unit + integration)

**Phase 2 readiness:**
- [ ] Line items schema designed
- [ ] Multi-currency strategy defined
- [ ] Invoice PDF generation POC complete
- [ ] Payment gateway integration POC complete
