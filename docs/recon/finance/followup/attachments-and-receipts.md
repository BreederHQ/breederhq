# Finance Follow-Up: Attachments and Receipts

**Recon scope:** Frontend-only codebase. Backend schema inferred from frontend API clients and usage patterns.

**Goal:** Determine if Attachment model exists, how it's linked to entities, and strategy for Expense receipts.

---

## What Exists

### Attachment Model (Inferred)

**Type definition:** [apps/offspring/src/api.ts:248](apps/offspring/src/api.ts#L248)

```typescript
export type Attachment = {
  id: number;
  name?: string;
  filename?: string;
  url?: string;
  size?: number;
  createdAt?: string;
  [key: string]: any;
};
```

**Usage evidence:**

| Module | Location | Pattern | Tenant Scoped? | Notes |
|--------|----------|---------|----------------|-------|
| Offspring | [apps/offspring/src/api.ts:620](apps/offspring/src/api.ts#L620) | `GET /offspring-groups/{id}/attachments` | Likely | Nested under tenant-scoped entity |
| Offspring | [apps/offspring/src/api.ts:622](apps/offspring/src/api.ts#L622) | `POST /offspring-groups/{id}/attachments` | Likely | Upload endpoint |
| Offspring | [apps/offspring/src/api.ts:697](apps/offspring/src/api.ts#L697) | `GET /offspring/{id}/attachments` | Likely | Per-offspring attachments |
| Offspring | [apps/offspring/src/api.ts:699](apps/offspring/src/api.ts#L699) | `POST /offspring/{id}/attachments` | Likely | Upload endpoint |
| Breeding | [apps/breeding/src/api.ts:351](apps/breeding/src/api.ts#L351) | `createAttachment(planId, body)` | Likely | Breeding plan attachments |
| UI | [apps/offspring/src/App-Offspring.tsx:307](apps/offspring/src/App-Offspring.tsx#L307) | `AttachmentsSection` component | - | Reusable component |

**Linking pattern (inferred):**
- REST endpoints nested under parent entity (e.g., `/offspring/{id}/attachments`).
- Likely polymorphic or entity-specific FK in backend schema.
- No evidence of join tables in frontend types.

### Attachment Upload Flow

**Create body:** [apps/offspring/src/api.ts:243](apps/offspring/src/api.ts#L243)

```typescript
export type CreateOffspringAttachmentBody = {
  title?: string | null;
  description?: string | null;
};
```

**Observations:**
- No `file` or `buffer` field in type → likely multipart/form-data or separate presigned URL flow.
- Minimal metadata (title, description).
- No evidence of S3 presign or blob upload utilities in frontend.

**Searched patterns:**
- `upload|presign|s3|blob` → Found in 15 files, mostly unrelated (package-lock.json, docs).
- No dedicated upload utility found in `packages/ui/src/utils/`.

**Gap:** Upload mechanism unclear without backend access.

---

## What is Missing

### Attachment Schema Details
Cannot confirm without backend schema:
- `tenantId` column (assumed present).
- Polymorphic linking (`attachableId` + `attachableType`) vs entity-specific FKs.
- Storage location (`url` field suggests external storage like S3).

### Receipt-Specific Metadata
For Expense receipts:
- **Receipt date** (may differ from expense date).
- **Vendor name** (OCR future).
- **Receipt total** (validation against expense amount).

**Not present in current Attachment type.**

### Linking Strategy for Finance Entities

**No evidence of:**
- `GET /invoices/{id}/attachments`
- `GET /expenses/{id}/attachments`
- `POST /payments/{id}/attachments`

Finance module may need to implement these endpoints.

---

## Decision / Recommendation

### Reuse Attachment Model

**Verdict:** ✅ Reuse existing `Attachment` model.

**Rationale:**
- Model already exists and is proven (Offspring, Breeding).
- Avoids schema fragmentation.
- Shared UI component (`AttachmentsSection`) can be reused.

### Linking Strategy

**Option A: Direct FK (Simpler for MVP)**
```prisma
model Expense {
  // ...
  attachments Attachment[] // One-to-many
}

model Attachment {
  // ...
  expenseId   Int?
  invoiceId   Int?
  paymentId   Int?
  // Keep existing FKs for Offspring, BreedingPlan, etc.
}
```

**Option B: Polymorphic (More Flexible)**
```prisma
model Attachment {
  // ...
  attachableId   Int
  attachableType String // "Expense", "Invoice", "Payment", "Offspring", etc.
}
```

**Recommendation:** **Option A for MVP.**
- Simpler queries.
- Type-safe foreign keys.
- Polymorphic can be refactored later if attachment usage explodes.

### Receipt Storage

**Reuse existing upload pipeline:**
1. Frontend calls `POST /expenses/{id}/attachments` with multipart/form-data.
2. Backend:
   - Uploads file to S3 (or existing blob storage).
   - Creates `Attachment` record with `url`, `filename`, `size`.
   - Links to `Expense` via `expenseId` FK.
3. Frontend displays via `AttachmentsSection` component.

**No new infrastructure needed** if S3/blob storage already configured for Offspring/Breeding.

### Receipt Metadata (Future)

For post-MVP OCR or advanced receipt matching:
- Add `Attachment.metadata` JSON field.
- Store `{ receiptDate, vendorName, receiptTotal }` for ML enrichment.
- MVP: Store as-is without parsing.

---

## MVP Impact

**Medium**

**Why:**
- Expense model incomplete without receipt attachment capability.
- Reusing existing Attachment model is low-risk (no new infrastructure).
- Critical for audit trail and tax compliance.

**Not a blocker IF:**
- MVP allows creating expenses without receipts (receiptUrl as nullable).
- Attachment linking added in Phase 1.1.

**Immediate next steps:**
1. Confirm `Attachment` model has `expenseId`, `invoiceId`, `paymentId` FKs in backend schema (or add them).
2. Implement `POST /expenses/{id}/attachments` endpoint (clone from Offspring pattern).
3. Add `GET /expenses/{id}/attachments` for retrieval.
4. Reuse `AttachmentsSection` component in Finance app.

---

## Open Questions (Backend-Dependent)

1. **Attachment.tenantId exists?** Assume yes, but verify.
2. **Storage backend:** S3, local filesystem, or blob service?
3. **Presigned URLs:** Does upload use presigned POST or direct multipart?
4. **File size limits:** Frontend validation needed?

---

**Related:**
- [schema-findings.md](../schema-findings.md) - Expense model design
- [gaps-and-recommendations.md](../gaps-and-recommendations.md#L4) - Attachment integration option
