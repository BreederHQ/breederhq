# Finance API Findings

## Source of Truth
Backend API resides in **separate repository** at `breederhq-api/src/`. This recon is based on:
- Frontend API client patterns: `packages/api/src/resources/`
- HTTP layer: `packages/api/src/http.ts`
- Migration test plans: `breederhq-api/docs/migrations/party/notes/TEST_PLAN_FINANCE.md`

## What Exists

### API Infrastructure Patterns

#### Base URL Resolution
- **Dev mode:** Vite proxy keeps `/api/*` at same origin
- **Production:** Configurable via `window.__BHQ_API_BASE__`
- **Convention:** All endpoints under `/api/v1/`

#### Authentication & Tenant Scoping
**From:** `packages/api/src/http.ts`

| Mechanism | Implementation | Notes |
|-----------|----------------|-------|
| Session Cookie | `bhq_s` cookie, `credentials: 'include'` | Auto-sent with every request |
| Org Header | `X-Org-Id` header | Injected from `localStorage.BHQ_ORG_ID` or `window.__BHQ_ORG_ID__` |
| 401 Handling | Auto-redirect to `/login` | Session expiry handling |
| Tenant Isolation | Server-side via `tenantId` filter | All Finance queries MUST filter by tenantId |

#### Pagination Pattern
**From:** `packages/api/src/resources/contacts.ts`

**Request:**
```typescript
interface ListParams {
  q?: string;          // Search query
  limit?: number;      // Page size
  offset?: number;     // Pagination offset
  sort?: string;       // Sort field
  filters?: Record<string, string>; // Column filters
}
```

**Response envelope (normalized):**
```typescript
interface ListResponse<T> {
  items: T[];
  total: number;
}
```

**Server may return:**
- Bare array: `[{...}]`
- Envelope: `{ items: [...], total: N }`
- Alternate: `{ results: [...], total: N }`
- Nested: `{ data: { items: [...], total: N } }`

**Client normalizes all patterns into `{ items, total }`.**

#### CRUD Pattern
**From:** Contacts, Animals, Breeding, Offspring resources

| Operation | Method | Endpoint Pattern | Example |
|-----------|--------|------------------|---------|
| List | GET | `/api/v1/{resource}?q=&limit=&offset=` | `/api/v1/contacts?limit=50` |
| Get | GET | `/api/v1/{resource}/{id}` | `/api/v1/contacts/123` |
| Create | POST | `/api/v1/{resource}` | POST `/api/v1/contacts` |
| Update | PATCH | `/api/v1/{resource}/{id}` | PATCH `/api/v1/contacts/123` |
| Delete | DELETE | `/api/v1/{resource}/{id}` | DELETE `/api/v1/contacts/123` |

**Convention:** PATCH for partial updates (not PUT).

### Finance-Specific Endpoints (Documented)

#### From TEST_PLAN_FINANCE.md

**Status: NOT YET IMPLEMENTED** (per migration docs: "Finance write endpoints NOT YET IMPLEMENTED")

**Planned endpoints:**

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/invoices` | GET | List invoices with filters | Not implemented |
| `/api/v1/invoices` | POST | Create invoice | Not implemented |
| `/api/v1/invoices/:id` | GET | Get invoice details | Not implemented |
| `/api/v1/invoices/:id` | PATCH | Update invoice | Not implemented |
| `/api/v1/invoices/:id` | DELETE | Void/delete invoice | Not implemented |
| `/api/v1/offspring-contracts` | POST | Create offspring contract | Not implemented |
| `/api/v1/offspring-contracts/:id` | PATCH | Update contract | Not implemented |

**Expected dual-write behavior (from test plan):**
When Finance endpoints are implemented, they MUST:
1. Write to both legacy fields (`contactId`/`organizationId`) AND new `partyId` fields
2. Use helper service `party-resolver-finance.ts` to resolve Party references
3. Maintain backward compatibility during Party migration Phase 5

### Cross-Object Tab Pattern (Attachments, Notes)

**Pattern used by other modules:**

#### Attachments Tab Query
```
GET /api/v1/attachments?animalId=123&tenantId=1
```

**Expected Finance tab queries:**
```
GET /api/v1/invoices?animalId=123&tenantId=1&includeArchived=false
GET /api/v1/invoices?offspringGroupId=456&tenantId=1
GET /api/v1/invoices?breedingPlanId=789&tenantId=1
GET /api/v1/expenses?animalId=123&tenantId=1
```

**includeArchived convention:**
- Default: `false` (exclude voided/archived records)
- Explicit opt-in: `includeArchived=true`

## What Appears Unused

### Legacy Invoice Endpoints
No Finance-specific endpoints exist in current codebase. Frontend uses mock data only.

**Evidence:**
- Finance app (`apps/finance/src/App-Finance.tsx`) uses `MOCK_INVOICES` array
- No `makeInvoices()` resource function in `packages/api/src/resources/`
- No Finance imports in `packages/api/src/index.ts`

## What is Missing for Finance MVP

### Required API Endpoints

#### 1. Invoice CRUD

**List Invoices**
```
GET /api/v1/invoices?tenantId=1&limit=50&offset=0&q=&includeArchived=false
GET /api/v1/invoices?tenantId=1&clientPartyId=123
GET /api/v1/invoices?tenantId=1&offspringGroupId=456
GET /api/v1/invoices?tenantId=1&offspringId=789
GET /api/v1/invoices?tenantId=1&animalId=101
GET /api/v1/invoices?tenantId=1&breedingPlanId=202
```

**Request params:**
- `tenantId` (REQUIRED, server-side enforced)
- `limit`, `offset` (pagination)
- `q` (search)
- `includeArchived` (default: false)
- Anchor filters: `clientPartyId`, `offspringGroupId`, `offspringId`, `animalId`, `breedingPlanId`
- Status filter: `status=SENT,PARTIAL,PAID`

**Response:**
```typescript
{
  items: InvoiceDTO[],
  total: number
}

interface InvoiceDTO {
  id: number;
  number: string;
  status: "DRAFT" | "SENT" | "PARTIAL" | "PAID" | "VOID" | "REFUNDED";
  clientPartyId?: number | null;
  clientPartyKind?: "CONTACT" | "ORGANIZATION" | null;
  clientPartyDisplayName?: string | null;
  offspringGroupId?: number | null;
  offspringGroupName?: string | null;
  offspringId?: number | null;
  offspringName?: string | null;
  animalId?: number | null;
  animalName?: string | null;
  breedingPlanId?: number | null;
  breedingPlanName?: string | null;
  serviceCode?: string | null;
  issueDate: string; // ISO date
  dueDate?: string | null;
  total: number;     // cents
  balance: number;   // cents
  currency: string;
  notes?: string | null;
  payments?: PaymentDTO[]; // nested or separate endpoint
  createdAt: string;
  updatedAt: string;
}
```

**Get Invoice**
```
GET /api/v1/invoices/:id?tenantId=1
```

**Create Invoice**
```
POST /api/v1/invoices
{
  tenantId: number;
  number: string;
  status: "DRAFT" | "SENT";
  clientPartyId?: number | null;
  offspringGroupId?: number | null;
  offspringId?: number | null;
  animalId?: number | null;
  breedingPlanId?: number | null;
  serviceCode?: string | null;
  issueDate: string;
  dueDate?: string | null;
  total: number;     // cents
  balance: number;   // cents (default: total)
  currency: string;  // default: USD
  notes?: string | null;
}
```

**Update Invoice**
```
PATCH /api/v1/invoices/:id
{
  // Same fields as create, all optional
  status?: "DRAFT" | "SENT" | "VOID" | "REFUNDED";
  dueDate?: string | null;
  notes?: string | null;
  // etc.
}
```

**Delete/Void Invoice**
```
DELETE /api/v1/invoices/:id?tenantId=1
// OR
PATCH /api/v1/invoices/:id { status: "VOID" }
```

**Recommendation:** Use PATCH to set `status: VOID` (soft delete). Preserve record for audit.

#### 2. Payment CRUD

**List Payments (by Invoice)**
```
GET /api/v1/payments?invoiceId=123&tenantId=1
// OR nested in invoice response
```

**Create Payment**
```
POST /api/v1/payments
{
  tenantId: number;
  invoiceId: number;
  amount: number;    // cents
  method: "CARD" | "ACH" | "CHECK" | "CASH" | "WIRE" | "OTHER";
  receivedAt: string; // ISO timestamp
  reference?: string | null; // Stripe ID, check number, etc.
  notes?: string | null;
}
```

**Side effect:** Auto-update `Invoice.balance` on Payment creation:
```typescript
await prisma.invoice.update({
  where: { id: invoiceId, tenantId },
  data: { balance: { decrement: paymentAmount } }
});
```

**Update Payment**
```
PATCH /api/v1/payments/:id
{
  amount?: number;
  method?: string;
  receivedAt?: string;
  reference?: string | null;
  notes?: string | null;
}
```

**Side effect:** Recalculate `Invoice.balance` if amount changes.

**Delete Payment**
```
DELETE /api/v1/payments/:id?tenantId=1
```

**Side effect:** Restore `Invoice.balance` by payment amount.

#### 3. Expense CRUD

**List Expenses**
```
GET /api/v1/expenses?tenantId=1&limit=50&offset=0&q=&includeArchived=false
GET /api/v1/expenses?tenantId=1&animalId=123
GET /api/v1/expenses?tenantId=1&offspringGroupId=456
GET /api/v1/expenses?tenantId=1&breedingPlanId=789
GET /api/v1/expenses?tenantId=1&vendorPartyId=101
```

**Response:**
```typescript
interface ExpenseDTO {
  id: number;
  date: string; // ISO date
  amount: number; // cents
  currency: string;
  category?: string | null; // "vet", "food", "supplies", etc.
  vendorPartyId?: number | null;
  vendorPartyDisplayName?: string | null;
  description?: string | null;
  receiptUrl?: string | null; // or attachmentId
  animalId?: number | null;
  animalName?: string | null;
  offspringGroupId?: number | null;
  offspringGroupName?: string | null;
  breedingPlanId?: number | null;
  breedingPlanName?: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**Create Expense**
```
POST /api/v1/expenses
{
  tenantId: number;
  date: string;
  amount: number;
  currency: string; // default: USD
  category?: string | null;
  vendorPartyId?: number | null;
  description?: string | null;
  animalId?: number | null;
  offspringGroupId?: number | null;
  breedingPlanId?: number | null;
  // receiptFile?: File (multipart/form-data) OR
  // receiptAttachmentId?: number (reuse Attachment model)
}
```

**Update Expense**
```
PATCH /api/v1/expenses/:id
{
  // Same fields as create, all optional
}
```

**Delete Expense**
```
DELETE /api/v1/expenses/:id?tenantId=1
```

#### 4. Finance Tab Endpoints (Cross-Object)

**Animal Finance Tab**
```
GET /api/v1/animals/:animalId/finances?tenantId=1
```

**Response:**
```typescript
{
  invoices: InvoiceDTO[];
  expenses: ExpenseDTO[];
  summary: {
    totalRevenue: number; // sum of paid invoice totals
    totalExpenses: number;
    netProfit: number; // revenue - expenses
  }
}
```

**Alternative pattern:** Client makes separate calls:
```
GET /api/v1/invoices?animalId=123&tenantId=1
GET /api/v1/expenses?animalId=123&tenantId=1
```

**Recommendation:** Use separate calls (simpler backend, reuses existing endpoints).

**OffspringGroup Finance Tab**
```
GET /api/v1/invoices?offspringGroupId=456&tenantId=1
GET /api/v1/expenses?offspringGroupId=456&tenantId=1
```

**BreedingPlan Finance Tab**
```
GET /api/v1/invoices?breedingPlanId=789&tenantId=1
GET /api/v1/expenses?breedingPlanId=789&tenantId=1
```

**Party (Contact/Organization) Finance Tab**
```
GET /api/v1/invoices?clientPartyId=101&tenantId=1
GET /api/v1/expenses?vendorPartyId=101&tenantId=1
```

### Required Backend Services

#### 1. Party Resolver Service (EXISTS)
**File:** `breederhq-api/src/services/finance/party-resolver-finance.ts`

**Functions (from test plan):**
```typescript
async function resolveInvoicePartyId(
  prisma: PrismaClient,
  input: { contactId?: number | null; organizationId?: number | null }
): Promise<number | null>

async function resolveOffspringContractPartyId(
  prisma: PrismaClient,
  input: { buyerContactId?: number | null; buyerOrganizationId?: number | null }
): Promise<number | null>

async function resolveContractPartyId(
  prisma: PrismaClient,
  input: { contactId?: number | null; organizationId?: number | null; userId?: string | null }
): Promise<number | null>
```

**Status:** Implemented, ready for use when Finance write endpoints are built.

#### 2. Tenant Enforcement Middleware (REQUIRED)
Every Finance endpoint MUST enforce tenant scoping:

```typescript
// Middleware example
function requireTenant(req, res, next) {
  const tenantId = req.session.tenantId || req.headers['x-tenant-id'];
  if (!tenantId) return res.status(403).json({ error: 'Tenant required' });
  req.tenantId = tenantId;
  next();
}

// All Finance queries MUST include tenantId
await prisma.invoice.findMany({
  where: { tenantId, ...filters }
});
```

#### 3. Invoice Balance Recalculation Service (REQUIRED)
```typescript
async function recalculateInvoiceBalance(
  prisma: PrismaClient,
  invoiceId: number,
  tenantId: number
): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, tenantId },
    include: { payments: true }
  });
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  await prisma.invoice.update({
    where: { id: invoiceId, tenantId },
    data: { balance: invoice.total - totalPaid }
  });
}
```

**Called on:**
- Payment create
- Payment update (amount change)
- Payment delete

### Required Frontend API Resources

**File:** `packages/api/src/resources/invoices.ts` (NEW)
```typescript
export interface InvoicesResource {
  list(params: InvoiceListParams): Promise<ListResponse<InvoiceDTO>>;
  get(id: number): Promise<InvoiceDTO>;
  create(input: CreateInvoiceInput): Promise<InvoiceDTO>;
  update(id: number, input: UpdateInvoiceInput): Promise<InvoiceDTO>;
  void(id: number): Promise<InvoiceDTO>;
}

export function makeInvoices(http: Http): InvoicesResource { ... }
```

**File:** `packages/api/src/resources/payments.ts` (NEW)
**File:** `packages/api/src/resources/expenses.ts` (NEW)

**Export from:** `packages/api/src/index.ts`

### Testing Requirements

#### Integration Tests (Backend)
- Invoice CRUD with tenant isolation
- Payment creation updates invoice balance
- Payment deletion restores balance
- Expense CRUD with anchor filters
- Finance tab queries return correct scoped data

#### Frontend API Tests
- List invoices with pagination
- Filter by anchor (animalId, offspringGroupId, etc.)
- Create invoice with Party reference
- Normalize response envelopes

## Recommended Action Summary

| Item | Action | Priority | Notes |
|------|--------|----------|-------|
| Invoice CRUD endpoints | Add | CRITICAL | Full REST API for Invoice model |
| Payment CRUD endpoints | Add | CRITICAL | With balance recalculation side effects |
| Expense CRUD endpoints | Add | CRITICAL | Full REST API for Expense model |
| Frontend API resources | Add | CRITICAL | `invoices.ts`, `payments.ts`, `expenses.ts` |
| Tenant enforcement middleware | Add | CRITICAL | Protect all Finance endpoints |
| Balance recalculation service | Add | CRITICAL | Maintain Invoice.balance integrity |
| Finance tab query endpoints | Add | HIGH | Anchor-based filters (animalId, offspringGroupId, etc.) |
| Party resolver service integration | Use existing | HIGH | Already implemented for dual-write |
| includeArchived parameter | Add | MEDIUM | Standard pattern for voided records |
| Invoice void endpoint | Add | MEDIUM | Prefer PATCH status=VOID over DELETE |

## Backend Access Gap

**CRITICAL:** This recon is based on frontend API client code and migration docs. Full API audit requires access to:
- `breederhq-api/src/routes/` (endpoint implementations)
- `breederhq-api/src/services/` (business logic)
- `breederhq-api/src/middleware/` (tenant enforcement, auth)

**Next Step:** Obtain read access to backend repo for complete API inventory.
