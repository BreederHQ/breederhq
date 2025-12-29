# Finance Follow-Up: Exports and File Delivery

**Recon scope:** Frontend-only codebase. Backend patterns inferred from API client structure.

**Goal:** Identify CSV/report utilities, file delivery mechanisms, and background job patterns.

---

## What Exists

### CSV Export Utility

**Location:** [packages/ui/src/utils/csvExport.ts](packages/ui/src/utils/csvExport.ts)

**Functionality:**
- Client-side CSV generation from array data.
- Escapes special characters (commas, quotes, newlines).
- Downloads via `Blob` + `URL.createObjectURL`.
- Supports custom formatters.

**API:**
```typescript
export function exportToCsv<T>(options: {
  columns: CsvColumn<T>[];
  rows: T[];
  filename: string;
  formatValue?: (value: any, key: string, row: T) => string;
}): void;
```

**Usage (inferred):**
- Frontend-driven exports (no backend involvement).
- All data fetched first, then exported.
- Synchronous, in-memory processing.

**Limitations:**
- Cannot handle large datasets (frontend memory limit).
- No streaming.
- No server-side generation (e.g., PDF invoices).

### File Delivery Patterns

**Searched:** `download|Content-Disposition|stream|pipeline|createReadStream|buffer|Blob`

**Found:**

| Pattern | Location | Notes |
|---------|----------|-------|
| Blob download | [packages/ui/src/utils/csvExport.ts](packages/ui/src/utils/csvExport.ts) | Client-side blob creation |
| No server streaming | - | No `Content-Disposition` headers in API client |
| No presigned URLs | - | Except for Attachment storage (inferred) |

**Observations:**
- All exports are client-side.
- No backend endpoints for reports (e.g., `/api/v1/reports/invoices.csv`).

### Background Job Infrastructure

**Searched:** `queue|job|worker|bull|bee|agenda|cron`

**Found:**
- **None.** No task queue libraries in package-lock.json.
- No worker processes in frontend code.

**Conclusion:** No background job system detected.

---

## What is Missing

### Server-Side Export Endpoints
- `GET /api/v1/invoices/export.csv?year=2025`
- `GET /api/v1/expenses/export.csv?category=vet`
- Streaming responses for large datasets.

### PDF Invoice Generation
- No evidence of PDF library (e.g., `pdfkit`, `puppeteer`).
- No invoice templates.
- No `GET /invoices/{id}/download.pdf`.

### Background Export Jobs
For large reports:
- Enqueue export job.
- Store result as Attachment.
- Notify user when ready.

**Not implemented.**

### Report Storage
- No evidence of storing generated reports (e.g., monthly P&L, tax summaries).

---

## Decision / Recommendation

### MVP Export Strategy

**Approach:** **Synchronous, client-side CSV exports for small datasets.**

**Rationale:**
- Reuse existing `exportToCsv` utility.
- No new backend infrastructure.
- Sufficient for MVP (small tenant datasets: <1000 invoices/year).

**Implementation:**
1. Frontend fetches filtered invoice/expense list via API.
2. Frontend calls `exportToCsv({ columns, rows, filename: "invoices-2025" })`.
3. Browser downloads CSV.

**Trade-offs:**
- ❌ Fails for large datasets (10k+ invoices).
- ❌ No server-side validation or audit trail.
- ✅ Fast to implement.
- ✅ No new dependencies.

### When to Use Server-Side Exports

**Trigger threshold:** >500 rows or PDF generation.

**Option A: Synchronous Streaming (Phase 1.1)**
```typescript
// Backend (Fastify/Express)
app.get('/api/v1/invoices/export.csv', async (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');

  const stream = createInvoiceCsvStream(req.query); // Generator or stream
  stream.pipe(res);
});
```

**Option B: Background Job + Attachment (Phase 2)**
```typescript
// 1. Enqueue
POST /api/v1/reports/invoices/async → { jobId: 123 }

// 2. Poll or webhook
GET /api/v1/jobs/123 → { status: "complete", attachmentId: 456 }

// 3. Download
GET /api/v1/attachments/456/download
```

**Recommendation:** **Option A for Phase 1.1** (streaming CSV), **Option B for complex PDF reports.**

### PDF Invoice Generation (Post-MVP)

**Recommended stack:**
- **Backend:** `pdfkit` or `puppeteer` (headless Chrome).
- **Template:** HTML → PDF via Puppeteer + invoice template.
- **Storage:** Generate on-demand or cache in Attachment.

**Endpoint:**
```typescript
GET /api/v1/invoices/{id}/pdf
→ Content-Type: application/pdf
→ Content-Disposition: attachment; filename="INV-2025-0001.pdf"
```

**Not needed for MVP** unless clients require PDF invoices for email.

---

## File Storage Strategy

### Approach 1: Direct Response (MVP)
- Generate CSV/PDF in-memory.
- Stream directly to HTTP response.
- No persistent storage.

**Pros:**
- Simple, no storage costs.

**Cons:**
- Must regenerate every time.
- No audit trail.

### Approach 2: Attachment-Backed Downloads (Recommended)
- Generate report.
- Save to S3 as Attachment.
- Return Attachment ID + presigned URL.

**Pros:**
- Persistent (audit, compliance).
- Faster subsequent access.
- Can email link to client.

**Cons:**
- Storage costs.
- Stale data if source changes.

**Recommendation:** **Approach 1 for MVP**, **Approach 2 for recurring reports (e.g., monthly statements).**

---

## Background Job Readiness

**Current state:** None.

**If adding background jobs:**

| Library | Pros | Cons | Recommendation |
|---------|------|------|----------------|
| **Bull** (Redis) | Robust, retries, UI | Redis dependency | ✅ Use if Redis already present |
| **BullMQ** | Bull v2, modern | Redis dependency | ✅ Preferred over Bull |
| **Bee-Queue** | Simpler | Less features | ❌ Too minimal |
| **node-cron** | Scheduled tasks | Not a queue | ⚠️ For scheduled exports only |

**MVP verdict:** **Not needed.** Add only if export volume demands async processing.

---

## MVP Impact

**Low**

**Why:**
- Client-side CSV exports are sufficient for MVP.
- Tenants will have small datasets initially.
- No compliance requirement for PDF invoices yet.

**Becomes Medium/High IF:**
- Client portal requires emailed PDF invoices.
- Tenant requests tax year exports (may be 500+ invoices).
- Export endpoint is needed for QuickBooks sync (future).

**Immediate next steps:**
1. Add "Export CSV" button to Invoice list (Finance app).
2. Use `exportToCsv` utility with Invoice columns.
3. Same for Expense list.
4. Monitor usage; add streaming endpoint if export times >10s.

---

## Open Questions

1. **PDF requirement for MVP?** Ask product owner.
2. **Email invoices to clients?** If yes, PDF + SMTP needed.
3. **QuickBooks export format?** QBO uses IIF or QBX, not CSV.

---

**Related:**
- [gaps-and-recommendations.md](../gaps-and-recommendations.md#L596) - Mentions invoice numbering automation (not export-specific)
- Existing utility: [packages/ui/src/utils/csvExport.ts](packages/ui/src/utils/csvExport.ts)
