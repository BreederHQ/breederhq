# Finance Track A/B/C Implementation Status

## Completed ✅

### Backend (breederhq-api) - 3 commits pushed to `dev`

**Commit 1: feat(finance): add scoped payments export and attachment endpoints**
- ✅ POST `/api/v1/finance/payments/export` - Scoped payments export endpoint
  - Accepts same filters as GET `/api/v1/invoices` (q, status, outstandingOnly, dates, anchors, clientPartyId)
  - Returns payments for matching invoices with receipt counts
  - Caps at 10k results with clear error message
  - Fully tenant-scoped and validated

- ✅ Attachment endpoints for `/expenses/:id/attachments`:
  - POST - Create receipt attachment
  - GET - List receipt attachments
  - DELETE - Delete receipt attachment

- ✅ Attachment endpoints for `/invoices/:id/attachments`:
  - POST - Create invoice attachment
  - GET - List invoice attachments
  - DELETE - Delete invoice attachment

- ✅ Attachment endpoints for `/payments/:id/attachments`:
  - POST - Create receipt attachment
  - GET - List receipt attachments
  - DELETE - Delete receipt attachment

**Commit 2: chore(finance): add idempotent invoice category backfill script**
- ✅ Dev-only script at `scripts/backfill-invoice-categories.ts`
- ✅ Backfills Invoice.category based on line item kinds
- ✅ Falls back to serviceCode heuristic (contains "deposit")
- ✅ Idempotent and safe to re-run
- ✅ Run with: `npx tsx scripts/backfill-invoice-categories.ts`

### Frontend (breederhq) - 1 commit pushed to `dev`

**Commit: feat(finance): wire summary endpoint and scoped payments export**
- ✅ Added `finance.summary()` SDK method
- ✅ Added `finance.payments.export(filters)` SDK method
- ✅ Added attachment SDK methods for expenses, invoices, and payments:
  - `api.finance.expenses.attachments.{list,create,delete}`
  - `api.finance.invoices.attachments.{list,create,delete}`
  - `api.finance.payments.attachments.{list,create,delete}`
- ✅ Wired FinanceHome to use GET `/api/v1/finance/summary`
  - Now shows server-calculated MTD (month-to-date) values
  - Outstanding, Invoiced MTD, Collected MTD, Expenses MTD
- ✅ Updated FinanceTab payments export to use scoped endpoint
  - Export now respects invoice filters on `/finance/invoices` page
- ✅ Fixed @bhq/api package.json exports for module resolution

### Validation
- ✅ Backend: Clean working tree on `dev` branch
- ✅ Frontend: Clean working tree on `dev` branch
- ✅ Frontend build passes successfully
- ✅ All commits pushed to origin/dev

---

## Remaining Work (UI Components) ⚠️

The following UI components still need to be implemented. The backend endpoints and SDK methods are ready.

### 1. Line Items UI

**InvoiceCreateModal** (`packages/ui/src/components/Finance/InvoiceCreateModal.tsx`)
- [ ] Add line item editor section
- [ ] Allow add/remove line items
- [ ] Fields: kind (dropdown), description, qty, unitCents, discountCents, taxRate
- [ ] Auto-calculate totalCents from line items
- [ ] If no line items provided, create single default OTHER line item with invoice total

**InvoiceDetailDrawer** (`packages/ui/src/components/Finance/InvoiceDetailDrawer.tsx`)
- [ ] Display line items table
- [ ] Show: kind, description, qty, unit price, discount, tax, total
- [ ] Fetch line items from invoice (need to add include to GET /invoices/:id)

### 2. Attachment UIs

**ExpenseModal** (`packages/ui/src/components/Finance/ExpenseModal.tsx`)
- [ ] Add "Receipts" section (similar to offspring AttachmentsSection pattern)
- [ ] List existing receipts with delete button
- [ ] Upload button to add new receipt
- [ ] Use `api.finance.expenses.attachments.{list,create,delete}`
- [ ] Show file name, size, upload date
- [ ] Confirm before delete

**InvoiceDetailDrawer** (`packages/ui/src/components/Finance/InvoiceDetailDrawer.tsx`)
- [ ] Add "Attachments" section in drawer
- [ ] Tab or sections for: Invoice attachments | Payment receipts
- [ ] List invoice attachments with upload/delete
- [ ] List all payment receipts for this invoice (read-only or with delete if appropriate)
- [ ] Use `api.finance.invoices.attachments.*` and `api.finance.payments.attachments.list`

**PaymentCreateModal** (`packages/ui/src/components/Finance/PaymentCreateModal.tsx`)
- [ ] Add "Receipt" section (optional upload)
- [ ] Allow attaching receipt after creating payment
- [ ] Or: add receipt upload to the payment row action menu
- [ ] Use `api.finance.payments.attachments.{create,delete}`

### 3. Backend Enhancement (if needed for line items)

**GET /invoices/:id** (`breederhq-api/src/routes/invoices.ts`)
- [ ] Add `LineItems` to the include if not already present
- [ ] Return line items in invoice DTO

---

## Implementation Pattern Reference

### Attachment Upload Pattern (from offspring)
```typescript
// POST /expenses/:id/attachments
const body = {
  kind: "RECEIPT",
  storageProvider: "local", // or "s3", etc.
  storageKey: "path/to/file",
  filename: "receipt.pdf",
  mime: "application/pdf",
  bytes: 12345
};
```

Client uploads file to storage first, then sends metadata to create attachment record.

### Line Items Pattern
```typescript
// Example line item structure
{
  kind: "SERVICE_FEE" | "DEPOSIT" | "GOODS" | "DISCOUNT" | "TAX" | "OTHER",
  description: "Stud Fee",
  qty: 1,
  unitCents: 50000,
  discountCents: 0,
  taxRate: 0.0,
  totalCents: 50000
}
```

Invoice.category should be auto-set based on line items:
- All DEPOSIT → DEPOSIT
- All SERVICE_FEE → SERVICE
- All GOODS → GOODS
- Mix → MIXED
- Fallback → OTHER

---

## Testing Checklist

### Manual Testing (once UI complete)
- [ ] Create invoice with 2 line items, verify total and category
- [ ] Add payment to invoice, attach receipt, verify visible in drawer
- [ ] Add expense, attach receipt, verify visible in modal
- [ ] Apply invoice filters on /finance/invoices, export payments
- [ ] Verify only matching payments are exported
- [ ] Finance Home tiles show correct server-calculated values

### Build Validation
- [ ] Run `npm run build` in breederhq repo
- [ ] No TypeScript errors
- [ ] No runtime errors in console

---

## Notes

- Backend endpoints follow existing offspring attachment pattern
- All endpoints are tenant-scoped with proper validation
- Export endpoint has 10k row limit with clear error message
- Summary endpoint calculates MTD (month-to-date) on server
- Backfill script is safe and idempotent
- Line items should control invoice category going forward
- Old invoices can be backfilled with script

---

## Commit Messages Used

**Backend Repo:**
1. `feat(finance): add scoped payments export and attachment endpoints`
2. `chore(finance): add idempotent invoice category backfill script`

**Frontend Repo:**
1. `feat(finance): wire summary endpoint and scoped payments export`

All commits include Claude Code attribution per requirements.
