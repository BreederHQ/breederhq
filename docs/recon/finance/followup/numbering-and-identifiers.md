# Finance Follow-Up: Numbering and Identifiers

**Recon scope:** Frontend-only codebase. Backend schema inferred from docs and frontend types.

**Goal:** Determine tenant-scoped uniqueness patterns and invoice/expense numbering strategy.

---

## What Exists

### Invoice Number Pattern (Mock Data)

| Artifact | Location | Pattern | Tenant Scoped? | Notes |
|----------|----------|---------|----------------|-------|
| Mock invoice numbers | [apps/finance/src/App-Finance.tsx:296](apps/finance/src/App-Finance.tsx#L296) | `INV-2025-0001` | Unknown | Hardcoded in frontend mock data |
| Invoice number field | [docs/recon/finance/schema-findings.md:17](docs/recon/finance/schema-findings.md#L17) | String, NOT NULL | Unknown | Schema docs show `number` field |
| Unique constraint (proposed) | [docs/recon/finance/gaps-and-recommendations.md:73](docs/recon/finance/gaps-and-recommendations.md#L73) | `@@unique([tenantId, number])` | Yes | Recommended in prior recon |

**Frontend mock data:**
```typescript
// apps/finance/src/App-Finance.tsx
const mockInvoices = [
  { number: "INV-2025-0001", ... },
  { number: "INV-2025-0002", ... },
  { number: "INV-2025-0003", ... }
];
```

**No backend code access** - cannot confirm if auto-generation exists or if field is manually entered.

### Existing Numbering Utilities

| Artifact | Location | Reusable for Finance? | Notes |
|----------|----------|----------------------|-------|
| None found | - | No | No sequence/counter utilities found in frontend or utility packages |
| `padStart` usage | Multiple files | Partially | Used for date formatting (MM, DD), not entity numbering |

**Searched patterns:**
- `sequence|counter|nextNumber|invoiceNumber|numbering` → Only found mock data
- `generate.*Number|format.*Number` → Only `formatCurrency`, `formatPercent`
- `padStart` → Date formatting only ([packages/ui/src/components/DatePicker/DatePicker.tsx:77](packages/ui/src/components/DatePicker/DatePicker.tsx#L77))

### Tenant-Scoped Uniqueness Patterns

**Searched for:**
```
unique.*tenantId|@@unique\(\[tenantId
```

**Found:**
- [docs/recon/finance/gaps-and-recommendations.md:73](docs/recon/finance/gaps-and-recommendations.md#L73): `@@unique([tenantId, number])` (recommended, not confirmed implemented)
- [docs/recon/finance/gaps-and-recommendations.md:280](docs/recon/finance/gaps-and-recommendations.md#L280): Duplicate entry, same recommendation

**No evidence of existing implementation.** Prior recon identified this as a gap.

---

## What is Missing

### Invoice Numbering Generation
- **No backend generation logic found** (no backend access).
- **No frontend client code** for requesting next invoice number.
- **No API endpoint** for `/api/v1/invoices/next-number` or similar.

### Expense Numbering
- **No evidence of expense numbering** in any mock data or docs.
- Expense model not yet implemented ([docs/recon/finance/schema-findings.md](docs/recon/finance/schema-findings.md)).

### Tenant-Scoped Uniqueness Enforcement
- **Constraint not confirmed.** Recommendation exists but implementation status unknown.

---

## Decision / Recommendation

### Invoice Number Format
- **Lock format:** `INV-{YYYY}-{NNNN}` (e.g., `INV-2025-0001`).
- **Rationale:**
  - Human-readable.
  - Year prefix enables annual reset (common accounting practice).
  - 4-digit zero-padded sequence supports 9,999 invoices/year.

### Expense Number Format
- **Lock format:** `EXP-{YYYY}-{NNNN}` (e.g., `EXP-2025-0001`).
- **Rationale:** Parallel pattern, distinct prefix.

### Generation Location
- **API-only generation.**
- **Never client-side.**
- **Recommended approach:**
  1. Backend sequence table or atomic counter per tenant.
  2. Generation in `POST /api/v1/invoices` transaction.
  3. Return generated number in response.

### Uniqueness Constraint
**Add to schema (backend):**
```prisma
model Invoice {
  // ...
  @@unique([tenantId, number])
}

model Expense {
  // ...
  @@unique([tenantId, number])
}
```

**Rationale:**
- Prevents duplicate numbering within tenant.
- Enforces database-level integrity.
- Tenant isolation critical for multi-tenant SaaS.

### Sequence Strategy Options

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **A) Dedicated sequence table** | Simple, proven pattern | Extra table | ✅ **Use for MVP** |
| **B) MAX(number) + 1 query** | No extra table | Race condition risk without locking | ❌ Avoid |
| **C) DB auto-increment per tenant** | Atomic | Complex partitioning | ❌ Overkill |

**Option A schema:**
```prisma
model Sequence {
  id        Int    @id @default(autoincrement())
  tenantId  Int
  entity    String // "invoice" | "expense"
  year      Int
  lastNum   Int

  @@unique([tenantId, entity, year])
}
```

**Generation logic (pseudo):**
```typescript
// In transaction:
const year = new Date().getFullYear();
const seq = await prisma.sequence.upsert({
  where: { tenantId_entity_year: { tenantId, entity: 'invoice', year } },
  update: { lastNum: { increment: 1 } },
  create: { tenantId, entity: 'invoice', year, lastNum: 1 }
});
const number = `INV-${year}-${String(seq.lastNum).padStart(4, '0')}`;
```

---

## MVP Impact

**Blocker**

**Why:**
- Invoice creation fails without unique, tenant-scoped identifiers.
- Manual entry risks collisions and breaks lookups.
- Number generation must be atomic to prevent duplicates in concurrent scenarios.

**Immediate next steps:**
1. Implement `Sequence` model in backend schema.
2. Add `@@unique([tenantId, number])` to `Invoice`.
3. Add number generation to `POST /invoices` endpoint.
4. Ensure all invoice creation flows (UI, API, future integrations) use backend-generated numbers.

---

**Related:**
- [schema-findings.md](../schema-findings.md) - Invoice model structure
- [gaps-and-recommendations.md](../gaps-and-recommendations.md#L73) - Original unique constraint recommendation
