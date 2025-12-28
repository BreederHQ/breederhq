# Finance MVP Follow-Up Recon

**Date:** 2025-12-28
**Branch:** dev
**Scope:** Frontend-only codebase recon (no backend schema access)
**Goal:** Targeted follow-up for Finance MVP readiness in infrastructure and integration areas.

---

## Documents

| File | Topic | MVP Impact |
|------|-------|------------|
| [numbering-and-identifiers.md](numbering-and-identifiers.md) | Invoice/expense number generation, tenant-scoped uniqueness | **Blocker** |
| [attachments-and-receipts.md](attachments-and-receipts.md) | Attachment model reuse, receipt linking strategy | **Medium** |
| [portal-identity-and-authz.md](portal-identity-and-authz.md) | Client portal user model, party-scoped access | **High** |
| [exports-and-file-delivery.md](exports-and-file-delivery.md) | CSV/PDF exports, streaming, background jobs | **Low** |
| [webhooks-and-idempotency.md](webhooks-and-idempotency.md) | Payment provider webhooks, duplicate prevention | **Low (MVP 1.0), High (Phase 1.1)** |
| [oauth-connectors-qbo.md](oauth-connectors-qbo.md) | QuickBooks Online OAuth, token storage, sync state | **Low (MVP 1.0), High (Phase 2.0)** |
| [recommendations.md](recommendations.md) | Consolidated decisions and action items | **All** |

---

## Recon Constraints

**No backend access:**
- Schema inferred from frontend types and prior recon docs.
- Backend patterns inferred from API client structure.
- Cannot confirm implementation status of recommended features.

**What was searched:**
- Patterns: numbering, sequences, attachments, uploads, auth, tokens, webhooks, idempotency, OAuth, exports, CSV, queues.
- Locations: `apps/`, `packages/`, `docs/`.
- Tools: `ripgrep`, file reads.

---

## Key Findings Summary

### 1. Numbering and Identifiers
- **Status:** Pattern exists (`INV-2025-0001`), generation logic missing.
- **Gap:** No Sequence model, no unique constraint confirmed.
- **Decision:** Lock format, API-only generation, sequence table.
- **Impact:** **Blocker** - invoice creation fails without unique numbering.

### 2. Attachments and Receipts
- **Status:** Attachment model exists (Offspring, Breeding use it).
- **Gap:** No Finance entity linking (expenseId, invoiceId FKs).
- **Decision:** Reuse Attachment model, direct FK linking.
- **Impact:** **Medium** - critical for expense receipts, can defer if MVP allows null.

### 3. Portal Identity and Authorization
- **Status:** Session auth exists, no portal/guest user model.
- **Gap:** No party-scoped access, no client portal.
- **Decision:** Add User.role + partyId for MVP, defer PortalUser to Phase 2.
- **Impact:** **High** - required for client invoice access, data breach risk without scoping.

### 4. Exports and File Delivery
- **Status:** Client-side CSV utility exists (`packages/ui/src/utils/csvExport.ts`).
- **Gap:** No server-side exports, no PDF generation, no background jobs.
- **Decision:** Client-side CSV for MVP, defer streaming/PDF to Phase 1.1.
- **Impact:** **Low** - acceptable for small datasets, revisit if >500 rows.

### 5. Webhooks and Idempotency
- **Status:** None detected.
- **Gap:** No webhook endpoints, no idempotency table.
- **Decision:** Defer to Phase 1.1 (Stripe integration). Add IdempotencyKey model pre-integration.
- **Impact:** **Low (MVP)** - manual payment entry only. **High (Phase 1.1)** - critical for webhook safety.

### 6. OAuth Connectors and QBO
- **Status:** None detected.
- **Gap:** No OAuth flow, no token storage, no sync models.
- **Decision:** Defer to Phase 2.0. Build custom connector (not integration platform).
- **Impact:** **Low (MVP)** - manual accounting viable. **High (Phase 2.0)** - major value prop.

---

## Immediate Action Items

**Blockers (must address for MVP 1.0):**
1. Implement invoice/expense numbering (Sequence model, generation logic).
2. Add `@@unique([tenantId, number])` constraint to Invoice/Expense.

**High Priority (address before client portal launch):**
3. Add `User.role` and `User.partyId` to schema.
4. Implement party-scoped query middleware for role=client.

**Medium Priority (address before expense receipts):**
5. Add `Attachment.expenseId`, `invoiceId`, `paymentId` FKs.
6. Implement `POST /expenses/{id}/attachments` endpoint.

**Defer to Phase 1.1:**
7. Idempotency model and webhook endpoints (Stripe).
8. Server-side CSV streaming.

**Defer to Phase 2.0:**
9. QuickBooks OAuth connector.
10. Sync state tracking.

---

## Related Documents

- [../schema-findings.md](../schema-findings.md) - Base schema recon
- [../gaps-and-recommendations.md](../gaps-and-recommendations.md) - Initial gap analysis
- [../api-findings.md](../api-findings.md) - API endpoint inventory
- [../ui-findings.md](../ui-findings.md) - Frontend component analysis

---

## Methodology

**Search patterns used:**
```bash
# Numbering
rg "sequence|counter|nextNumber|invoiceNumber|INV-|EXP-"
rg "unique.*tenantId|@@unique\\(\\[tenantId"
rg "generate.*Number|format.*Number|padStart"

# Attachments
rg "model Attachment|Attachment.*\\{"
rg "attachmentId|attachments|upload|presign|s3|blob"

# Auth
rg "invite|invitation|magic.*link|token|public.*link|portal|guest"
rg "auth|middleware|requireAuth|tenant|partyId"

# Exports
rg "csv|export|download|report|xlsx|Content-Disposition"
rg "stream|pipeline|createReadStream|buffer|Blob"
rg "queue|job|worker|bull|bee|agenda|cron"

# Webhooks
rg "webhook|signature|stripe|square|intents|event\\.type"
rg "idempotency|Idempotency|dedupe|requestId"

# OAuth
rg "oauth|refresh_token|access_token|client_secret|realm|quickbooks"
rg "encrypt|kms|secret|vault|token"
```

**Files read:**
- apps/platform/src/api.ts (auth, tenant scoping)
- apps/platform/src/pages/LoginPage.tsx (login flow)
- apps/offspring/src/api.ts (Attachment type)
- packages/ui/src/utils/csvExport.ts (export utility)
- docs/recon/finance/*.md (prior findings)

---

**Branch confirmed:** dev
**Tree status:** Clean (except docs/recon/)
