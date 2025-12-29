# Finance MVP: Consolidated Recommendations

**Date:** 2025-12-28
**Branch:** dev
**Scope:** Frontend-only recon (backend schema inferred)

---

## Executive Summary

**Finance MVP readiness assessed across six infrastructure areas:**
1. Invoice/expense numbering
2. Attachment/receipt linking
3. Client portal identity
4. Export mechanisms
5. Webhook/idempotency
6. OAuth connectors (QuickBooks)

**Critical path decisions locked. MVP 1.0 blockers identified. Phase boundaries defined.**

---

## Decisions to Lock Now

### 1. Invoice and Expense Numbering

**Decision:**
- Format: `INV-{YYYY}-{NNNN}` for invoices, `EXP-{YYYY}-{NNNN}` for expenses.
- Generation: API-only, via Sequence model (tenant-scoped, per-year counters).
- Uniqueness: `@@unique([tenantId, number])` constraint on both models.

**Rationale:**
- Human-readable, audit-friendly.
- Prevents duplicate numbering (database-enforced).
- Annual reset aligns with accounting periods.

**MVP Impact:** **Blocker**
- Invoice creation fails without unique identifiers.
- Manual entry risks collisions.

**Action:**
```prisma
model Sequence {
  id       Int    @id @default(autoincrement())
  tenantId Int
  entity   String // "invoice" | "expense"
  year     Int
  lastNum  Int
  @@unique([tenantId, entity, year])
}

model Invoice {
  // ...
  @@unique([tenantId, number])
}
```

**Owner:** Backend team
**Timeline:** MVP 1.0

---

### 2. Attachment Reuse for Receipts

**Decision:**
- Reuse existing `Attachment` model.
- Add direct FKs: `Attachment.expenseId`, `invoiceId`, `paymentId`.
- Reuse upload pipeline (S3/blob storage).

**Rationale:**
- Model already exists (Offspring, Breeding proven).
- Avoids schema fragmentation.
- Shared UI component (`AttachmentsSection`).

**MVP Impact:** **Medium**
- Expense model incomplete without receipt capability.
- Can defer if MVP allows null `receiptUrl`.

**Action:**
```prisma
model Attachment {
  // ... existing fields
  expenseId   Int?
  invoiceId   Int?
  paymentId   Int?
  // Keep existing FKs: offspringId, planId, etc.
}
```

**Owner:** Backend team
**Timeline:** MVP 1.0 (if expenses included), else Phase 1.1

---

### 3. Client Portal Model

**Decision (MVP 1.0):**
- Add `User.role` (enum: "admin", "member", "client").
- Add `User.partyId` (nullable, links to Party for clients).
- Backend middleware enforces: `WHERE clientPartyId = user.partyId` for role=client.

**Decision (Phase 2.0):**
- Migrate to dedicated `PortalUser` model.
- Add `AccessGrant` for fine-grained resource access.

**Rationale:**
- MVP 1.0: Reuse auth infrastructure, minimal schema changes.
- Phase 2.0: Clean separation, supports magic links.

**MVP Impact:** **High**
- Client access is core value prop.
- Without party-scoping, data breach risk (clients see all invoices).

**Action (MVP 1.0):**
```prisma
model User {
  // ...
  role      String // "admin", "member", "client"
  partyId   Int?   // Client users only
}
```

**Middleware (pseudo):**
```typescript
if (user.role === 'client') {
  query.where.clientPartyId = user.partyId;
}
```

**Owner:** Backend team (schema + middleware), Frontend team (role-based nav)
**Timeline:** MVP 1.0 if client access required, else defer to Phase 1.1

---

### 4. Export Mechanism

**Decision (MVP 1.0):**
- Client-side CSV exports using `packages/ui/src/utils/csvExport.ts`.
- No server-side streaming.
- No PDF generation.

**Decision (Phase 1.1):**
- Add server-side CSV streaming for datasets >500 rows.
- Add PDF invoice generation (Puppeteer + HTML template).

**Rationale:**
- MVP datasets small (<1000 invoices/year).
- Existing utility sufficient.
- Avoids new infrastructure.

**MVP Impact:** **Low**
- Client-side exports acceptable for MVP.
- Becomes bottleneck if tenant has >500 invoices.

**Action (MVP 1.0):**
- Add "Export CSV" button to Invoice/Expense lists.
- Call `exportToCsv({ columns, rows, filename })`.

**Owner:** Frontend team
**Timeline:** MVP 1.0

---

### 5. Webhook and Idempotency Strategy

**Decision (MVP 1.0):**
- Manual payment entry only.
- No webhook endpoints.
- Optional: Add client-side idempotency (`Idempotency-Key` header) for `POST /payments`.

**Decision (Phase 1.1):**
- Implement `IdempotencyKey` model.
- Add `POST /api/v1/webhooks/stripe` with signature verification.
- Add `POST /api/v1/webhooks/square`.

**Rationale:**
- MVP 1.0: No payment provider integration, no webhook dependency.
- Phase 1.1: Idempotency critical for webhook safety (prevents double-crediting).

**MVP Impact:** **Low (MVP 1.0), High (Phase 1.1)**

**Action (Phase 1.1):**
```prisma
model IdempotencyKey {
  id           Int      @id @default(autoincrement())
  tenantId     Int
  key          String   // Event ID or client UUID
  resourceType String
  resourceId   Int?
  status       String   // "processing", "succeeded", "failed"
  response     Json?
  createdAt    DateTime @default(now())
  expiresAt    DateTime
  @@unique([tenantId, key])
}
```

**Owner:** Backend team
**Timeline:** Phase 1.1 (before Stripe integration)

---

### 6. OAuth Connector Strategy (QuickBooks)

**Decision (MVP 1.0):**
- No QuickBooks integration.
- Manual accounting export via CSV.

**Decision (Phase 2.0):**
- Build custom OAuth connector (not integration platform).
- Add `AccountingConnection` model (encrypted token storage).
- Add `SyncMapping` model (track synced entities).
- One-way push: BreederHQ → QuickBooks.

**Rationale:**
- MVP 1.0: QBO integration complex, not blocker for early adopters.
- Phase 2.0: Custom connector gives control, supports tenant customization.

**MVP Impact:** **Low (MVP 1.0), High (Phase 2.0)**

**Action (Phase 2.0):**
```prisma
model AccountingConnection {
  id              Int       @id @default(autoincrement())
  tenantId        Int
  provider        String    // "quickbooks_online"
  accessToken     String    // ENCRYPTED
  refreshToken    String    // ENCRYPTED
  tokenExpiresAt  DateTime
  realmId         String?
  status          String
  @@unique([tenantId, provider])
}

model SyncMapping {
  id           Int      @id @default(autoincrement())
  tenantId     Int
  provider     String
  entityType   String   // "Invoice", "Expense"
  entityId     Int
  remoteId     String
  lastSyncedAt DateTime
  syncStatus   String
  @@unique([tenantId, provider, entityType, entityId])
}
```

**Owner:** Backend team
**Timeline:** Phase 2.0

---

## MVP Impact Matrix

| Decision | MVP 1.0 Impact | Owner | Timeline |
|----------|---------------|-------|----------|
| Invoice/expense numbering | **Blocker** | Backend | MVP 1.0 |
| Unique constraint `[tenantId, number]` | **Blocker** | Backend | MVP 1.0 |
| Attachment reuse (expenseId FK) | **Medium** | Backend | MVP 1.0 or 1.1 |
| Client portal (User.role + partyId) | **High** | Backend + Frontend | MVP 1.0 or 1.1 |
| Party-scoped middleware | **High** | Backend | MVP 1.0 or 1.1 |
| Client-side CSV export | **Low** | Frontend | MVP 1.0 |
| Idempotency model | **Low (MVP), High (1.1)** | Backend | Phase 1.1 |
| Webhook endpoints | **Low (MVP), High (1.1)** | Backend | Phase 1.1 |
| QuickBooks OAuth | **Low (MVP), High (2.0)** | Backend | Phase 2.0 |

---

## Phase Boundaries

### MVP 1.0 (Core Finance)
**Goal:** Internal invoice/expense tracking for tenant users.

**Must have:**
- Invoice CRUD with auto-numbering.
- Expense CRUD.
- Payment tracking (manual entry).
- Tenant-scoped data isolation.

**Defer:**
- Client portal access.
- Payment provider integration.
- PDF invoices.
- QuickBooks sync.

### Phase 1.1 (Client Portal + Payments)
**Goal:** External client access and automated payment matching.

**Add:**
- User.role + partyId for client scoping.
- Party-scoped query middleware.
- Stripe/Square webhook integration.
- Idempotency model.
- Server-side CSV streaming (if needed).

### Phase 2.0 (Accounting Integration)
**Goal:** QuickBooks sync for professional breeders.

**Add:**
- AccountingConnection model (encrypted tokens).
- SyncMapping model.
- OAuth flow endpoints.
- Invoice push to QuickBooks.
- Conflict detection.

---

## Open Questions (Cannot Answer from Recon)

### Backend-Dependent
1. **Does Attachment.tenantId exist?** Assume yes, verify in schema.
2. **Attachment storage backend?** S3, filesystem, or blob service?
3. **Current RBAC implementation?** Role-based or permission-based?
4. **Encryption key management?** Env var, KMS, or Vault?

### Product-Dependent
5. **Client portal in MVP 1.0 scope?** Or defer to 1.1?
6. **Payment providers for Phase 1.1?** Stripe only, or also Square/PayPal?
7. **PDF invoices required for MVP?** Or CSV sufficient?
8. **QuickBooks only, or multi-platform?** (Xero, FreshBooks, etc.)

### Technical Decisions
9. **Magic links or full client accounts?** Impacts PortalUser design.
10. **Outbound webhooks?** Will customers integrate with BreederHQ?
11. **Multi-currency support?** Invoice.currency exists, but backend enforcement?

---

## Recommended Next Steps

### Immediate (This Week)
1. **Backend:** Implement Sequence model and number generation.
2. **Backend:** Add `@@unique([tenantId, number])` to Invoice/Expense.
3. **Product:** Decide if client portal in MVP 1.0 scope.
4. **Backend:** If yes to #3, add User.role and partyId.

### Sprint 1 (MVP 1.0)
5. **Frontend:** Add "Export CSV" button to Invoice/Expense lists.
6. **Backend:** Add Attachment FKs (expenseId, invoiceId, paymentId).
7. **Backend:** Implement party-scoped middleware (if client portal in scope).
8. **Frontend:** Reuse AttachmentsSection in Finance app.

### Sprint 2 (Phase 1.1 Prep)
9. **Backend:** Design IdempotencyKey model.
10. **Backend:** Register Stripe app, plan webhook flow.
11. **Product:** Finalize payment provider requirements.

### Sprint 3+ (Phase 2.0 Prep)
12. **Backend:** Register QuickBooks app.
13. **Backend:** Design encryption utilities.
14. **Product:** Define QBO sync scope (push only, or two-way).

---

## Risk Mitigation

### Data Breach Risk (Client Portal)
**Threat:** Client user accesses other clients' invoices.

**Mitigation:**
- Backend MUST enforce `WHERE clientPartyId = user.partyId` for role=client.
- Frontend MUST hide unauthorized data (defense in depth).
- Add integration tests for role-based access.

### Duplicate Payment Risk (Webhooks)
**Threat:** Webhook retry causes duplicate Payment records.

**Mitigation:**
- Implement IdempotencyKey model before webhook integration.
- Use webhook event ID as idempotency key.
- Return cached response for duplicate events.

### Token Leakage Risk (QuickBooks)
**Threat:** OAuth tokens exposed in logs or database dumps.

**Mitigation:**
- MUST encrypt `accessToken` and `refreshToken` at rest.
- MUST NOT log decrypted tokens.
- Use KMS or Vault for encryption key storage (not env var in production).

---

## Success Metrics

### MVP 1.0
- Invoice creation latency <200ms.
- Zero duplicate invoice numbers (unique constraint enforced).
- Zero cross-tenant data leakage (verified via integration tests).

### Phase 1.1
- Webhook processing latency <1s.
- Zero duplicate payments (idempotency working).
- Client portal signup conversion >60%.

### Phase 2.0
- QuickBooks sync success rate >95%.
- Invoice sync latency <10s per batch (100 invoices).
- Token refresh uptime >99.9%.

---

**Related:**
- [README.md](README.md) - Follow-up recon index
- [numbering-and-identifiers.md](numbering-and-identifiers.md) - Numbering details
- [portal-identity-and-authz.md](portal-identity-and-authz.md) - Auth design
- [oauth-connectors-qbo.md](oauth-connectors-qbo.md) - QBO integration plan
