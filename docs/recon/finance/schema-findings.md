# Finance Schema Findings

## Source of Truth
Backend schema resides in **separate repository** at `breederhq-api/prisma/schema.prisma`. This recon is based on:
- Migration documentation: `breederhq-api/docs/migrations/party/`
- Test plans: `TEST_PLAN_FINANCE.md`
- Validation queries: `VALIDATION_QUERIES_FINANCE.md`
- Frontend mock data: `apps/finance/src/App-Finance.tsx`

## What Exists (Documented Models)

### Invoice Model
| Field | Type | Nullable | Relation Target | Tenant Scoped? | Notes | MVP Fit |
|-------|------|----------|----------------|----------------|-------|---------|
| id | Int (PK) | No | - | No | Auto-increment | Keep |
| tenantId | Int | No | Tenant | Yes | Multi-tenant isolation | Keep |
| number | String | No | - | No | Invoice number (e.g., "INV-2025-0001") | Keep |
| status | Enum | No | - | No | DRAFT, SENT, PARTIAL, PAID, VOID, REFUNDED | Keep |
| issueDate | DateTime | No | - | No | Invoice issue date | Keep |
| dueDate | DateTime | Yes | - | No | Payment due date | Keep |
| amountCents | Int | No | - | No | Total invoice amount in cents | Modify → total |
| balanceCents | Int | No | - | No | Outstanding balance in cents | Modify → balance |
| currency | String | No | - | No | ISO currency code (default: USD) | Keep |
| notes | String | Yes | - | No | Internal/external notes | Keep |
| scope | String | Yes | - | No | Legacy: "offspring", "general" | Delete (use explicit anchors) |
| contactId | Int | Yes | Contact | No | **DEPRECATED** - Legacy anchor | Delete (Phase 5) |
| organizationId | Int | Yes | Organization | No | **DEPRECATED** - Legacy anchor | Delete (Phase 5) |
| clientPartyId | Int | Yes | Party | No | **NEW** - Unified client reference | Keep |
| offspringId | Int | Yes | Offspring | No | **MISSING** - Explicit anchor needed | Add |
| offspringGroupId | Int | Yes | OffspringGroup | No | **MISSING** - Explicit anchor needed | Add |
| animalId | Int | Yes | Animal | No | **MISSING** - Explicit anchor needed | Add |
| breedingPlanId | Int | Yes | BreedingPlan | No | **MISSING** - Explicit anchor needed | Add |
| serviceCode | String | Yes | - | No | **MISSING** - Service type anchor (stud fee, boarding, etc.) | Add |
| createdAt | DateTime | No | - | No | Timestamp | Keep |
| updatedAt | DateTime | No | - | No | Timestamp | Keep |

**Indexes (existing):**
- `Invoice_clientPartyId_idx`
- `Invoice_tenantId_clientPartyId_idx`
- `Invoice_contactId_idx` (legacy, will be removed)
- `Invoice_organizationId_idx` (legacy, will be removed)

**Foreign Keys:**
- `clientPartyId → Party.id ON DELETE SET NULL`
- `contactId → Contact.id` (legacy)
- `organizationId → Organization.id` (legacy)

### Payment Model
**STATUS: NOT DOCUMENTED IN MIGRATION DOCS**

From frontend mock data:
| Field | Type | Nullable | Notes | MVP Fit |
|-------|------|----------|-------|---------|
| id | Int (PK) | No | Auto-increment | Keep |
| invoiceId | Int | No | FK to Invoice | Add |
| tenantId | Int | No | Multi-tenant isolation | Add |
| amount | Decimal/Int | No | Payment amount (cents?) | Add |
| method | String | No | CARD, ACH, CHECK, CASH, WIRE | Add |
| receivedAt | DateTime | No | Payment received timestamp | Add |
| reference | String | Yes | External reference (Stripe ID, check number) | Add |
| notes | String | Yes | Payment notes | Add |
| createdAt | DateTime | No | Timestamp | Add |
| updatedAt | DateTime | No | Timestamp | Add |

**No current schema exists. Must be added.**

### Expense Model
**STATUS: NOT DOCUMENTED**

From Finance app tab stub (Expenses tab exists but no mock data):
| Field | Type | Nullable | Notes | MVP Fit |
|-------|------|----------|-------|---------|
| id | Int (PK) | No | Auto-increment | Add |
| tenantId | Int | No | Multi-tenant isolation | Add |
| date | DateTime | No | Expense date | Add |
| amount | Decimal/Int | No | Expense amount in cents | Add |
| currency | String | No | ISO currency code | Add |
| category | String | Yes | Expense category (vet, food, supplies, etc.) | Add |
| vendorPartyId | Int | Yes | FK to Party (vendor) | Add |
| description | String | Yes | Expense description | Add |
| receipt | String | Yes | Receipt file path or attachment ID | Add (or use Attachment relation) |
| animalId | Int | Yes | Related animal | Add |
| offspringGroupId | Int | Yes | Related offspring group | Add |
| breedingPlanId | Int | Yes | Related breeding plan | Add |
| createdAt | DateTime | No | Timestamp | Add |
| updatedAt | DateTime | No | Timestamp | Add |

**No current schema exists. Must be added.**

### OffspringContract Model
| Field | Type | Nullable | Relation Target | Tenant Scoped? | Notes | MVP Fit |
|-------|------|----------|----------------|----------------|-------|---------|
| id | Int (PK) | No | - | No | Auto-increment | Keep |
| tenantId | Int | No | Tenant | Yes | Multi-tenant isolation | Keep |
| offspringId | Int | No | Offspring | Yes | Contract subject | Keep |
| title | String | No | - | No | Contract title | Keep |
| status | Enum | No | - | No | DRAFT, ACTIVE, COMPLETE, VOID | Keep |
| buyerContactId | Int | Yes | Contact | No | **DEPRECATED** - Legacy buyer | Delete (Phase 5) |
| buyerOrganizationId | Int | Yes | Organization | No | **DEPRECATED** - Legacy buyer | Delete (Phase 5) |
| buyerPartyId | Int | Yes | Party | No | **NEW** - Unified buyer reference | Keep |
| signedAt | DateTime | Yes | - | No | Contract signature timestamp | Keep |
| createdAt | DateTime | No | - | No | Timestamp | Keep |
| updatedAt | DateTime | No | - | No | Timestamp | Keep |

**Indexes (existing):**
- `OffspringContract_buyerPartyId_idx`
- `OffspringContract_tenantId_buyerPartyId_idx`

**Foreign Keys:**
- `buyerPartyId → Party.id ON DELETE SET NULL`
- `offspringId → Offspring.id`

### ContractParty Model
| Field | Type | Nullable | Relation Target | Tenant Scoped? | Notes | MVP Fit |
|-------|------|----------|----------------|----------------|-------|---------|
| id | Int (PK) | No | - | No | Auto-increment | Keep |
| tenantId | Int | No | Tenant | Yes | Multi-tenant isolation | Keep |
| contractId | Int | No | OffspringContract | No | Parent contract | Keep |
| role | String | No | - | No | Signer role | Keep |
| contactId | Int | Yes | Contact | No | **DEPRECATED** - Legacy | Delete (Phase 5) |
| organizationId | Int | Yes | Organization | No | **DEPRECATED** - Legacy | Delete (Phase 5) |
| userId | String | Yes | User | No | **DEPRECATED** - Legacy | Delete (Phase 5) |
| partyId | Int | Yes | Party | No | **NEW** - Unified party reference | Keep |
| signedAt | DateTime | Yes | - | No | Signature timestamp | Keep |

**Indexes (existing):**
- `ContractParty_partyId_idx`
- `ContractParty_tenantId_partyId_idx`

**Foreign Keys:**
- `partyId → Party.id ON DELETE SET NULL`
- `contractId → OffspringContract.id`

## What Appears Unused

### Invoice.scope
- Legacy enum field: "offspring", "general"
- Being replaced by explicit nullable anchor FKs
- **Recommendation:** Delete after migration

### Legacy Dual Anchors (Phase 5 Cleanup)
All of these will be removed once Party migration is complete:
- `Invoice.contactId` + `Invoice.organizationId`
- `OffspringContract.buyerContactId` + `OffspringContract.buyerOrganizationId`
- `ContractParty.contactId` + `ContractParty.organizationId` + `ContractParty.userId`

## What is Missing for Finance MVP

### Critical Schema Additions

#### 1. Payment Model (REQUIRED)
Full model schema needed. Relation: `Payment.invoiceId → Invoice.id`.

#### 2. Expense Model (REQUIRED)
Full model schema needed. Should support Attachment relation for receipts.

#### 3. InvoiceLineItem Model (OPTIONAL for MVP, RECOMMENDED for Phase 2)
| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| id | Int (PK) | No | Auto-increment |
| invoiceId | Int | No | FK to Invoice |
| tenantId | Int | No | Multi-tenant isolation |
| description | String | No | Line item description |
| quantity | Decimal | No | Quantity |
| unitPrice | Int | No | Unit price in cents |
| lineTotal | Int | No | Calculated: quantity × unitPrice |
| sortOrder | Int | No | Display order |

**Why optional for MVP:** Frontend mock data shows single-total invoices. Line items can be added in Phase 2 for itemized billing.

#### 4. Invoice Explicit Anchors
Add these nullable FKs to Invoice:
- `offspringId → Offspring.id`
- `offspringGroupId → OffspringGroup.id`
- `animalId → Animal.id`
- `breedingPlanId → BreedingPlan.id`
- `serviceCode` (String, nullable) - for service-based invoicing (stud fee, boarding, training)

**Rationale:** Replaces polymorphic `scope` field with explicit typed references. Allows Finance tab queries without joins to Contact/Organization.

#### 5. Expense Explicit Anchors
Same pattern as Invoice:
- `animalId`
- `offspringGroupId`
- `breedingPlanId`

#### 6. Indexes for Finance Tab Queries

**Invoice:**
```prisma
@@index([tenantId, offspringGroupId])
@@index([tenantId, offspringId])
@@index([tenantId, animalId])
@@index([tenantId, breedingPlanId])
@@index([tenantId, clientPartyId])
```

**Payment:**
```prisma
@@index([tenantId, invoiceId])
```

**Expense:**
```prisma
@@index([tenantId, animalId])
@@index([tenantId, offspringGroupId])
@@index([tenantId, breedingPlanId])
@@index([tenantId, vendorPartyId])
```

## Finance-Adjacent Fields on Other Models

### Offspring Model
From frontend types (`packages/api/src/types/offspring.ts`):
- `buyer_contact_id` (legacy, will map to `buyerPartyId`)
- `price_cents` (Int, nullable) - Offspring sale price
- `paid_cents` (Int, nullable) - Amount paid
- `reserved` (Boolean)
- `hold_until` (DateTime, nullable)

**Status:** These fields exist but are NOT linked to Invoice model. Invoice anchoring will replace this pattern.

### OffspringGroup Model
From frontend types:
- `invoices` array (legacy structure)

**Status:** Frontend shows this as an array on the DTO. Backend likely has no direct relation. Will be replaced by `Invoice.offspringGroupId` FK.

## Tenant Scoping

All Finance models MUST be tenant-scoped:
- Every table has `tenantId` column
- Every index includes `tenantId` prefix for efficient tenant isolation
- All queries MUST filter by `tenantId`

**Enforcement pattern (from existing code):**
```typescript
where: { tenantId, id }
```

## Recommended Action Summary

| Model/Field | Action | Priority | Rationale |
|-------------|--------|----------|-----------|
| Payment | Add | CRITICAL | No schema exists, required for Invoice functionality |
| Expense | Add | CRITICAL | No schema exists, required for Finance module |
| Invoice explicit anchors | Add | CRITICAL | Replace polymorphic scope, enable Finance tabs |
| Expense explicit anchors | Add | CRITICAL | Enable Finance tabs on Animal/OffspringGroup/BreedingPlan |
| Invoice/Payment/Expense indexes | Add | HIGH | Enable efficient Finance tab queries |
| InvoiceLineItem | Add | LOW | MVP can use single total, add in Phase 2 |
| Invoice.scope | Delete | MEDIUM | After explicit anchors are migrated |
| Legacy contactId/organizationId | Delete | MEDIUM | After Party Phase 5 cleanup |

## Schema Gaps (Backend Access)

**CRITICAL:** This recon is based on documentation and frontend types. Full schema audit requires access to:
- `breederhq-api/prisma/schema.prisma` (authoritative source)
- Existing migrations in `breederhq-api/prisma/migrations/`
- Current database schema dump

**Next Step:** Obtain read access to backend repo or export current schema.prisma to validate all findings.
