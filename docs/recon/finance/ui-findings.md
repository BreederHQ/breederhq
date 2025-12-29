# Finance UI Findings

## Source of Truth
Frontend apps in `apps/*` directories. Tab patterns from `@bhq/ui` component library.

## What Exists

### Finance Tab Implementation Status

| Object | App | Detail View File | Has Tabs? | Has Finance Tab? | Tab Status |
|--------|-----|------------------|-----------|------------------|------------|
| Contact/Party | contacts | `apps/contacts/src/PartyDetailsView.tsx:675` | YES | **YES** | Placeholder ("Coming Soon") |
| Organization | organizations | `apps/organizations/src/App-Organizations.tsx:345` | YES | **YES** | Placeholder ("Coming Soon") |
| Animal | animals | `apps/animals/src/App-Animals.tsx:4345-4356` | YES | **NO** | Missing |
| OffspringGroup | offspring | `apps/offspring/src/App-Offspring.tsx:5040-5047` | YES | **NO** | Missing |
| Offspring (individual) | offspring | Same file, separate drawer | YES | **NO** | Missing |
| BreedingPlan | breeding | `apps/breeding/src/App-Breeding.tsx:64-69` | YES | **NO** | Missing |

### Tab Component Pattern

**Component:** `DetailsScaffold` from `@bhq/ui/components/Drawer/DetailsScaffold.tsx`

**Underlying:** `Tabs` component from `@bhq/ui/components/Tabs/Tabs.tsx`

**Usage pattern:**
```tsx
<DetailsScaffold
  title="Contact Details"
  tabs={[
    { key: "overview", label: "Overview" },
    { key: "animals", label: "Animals" },
    { key: "documents", label: "Documents" },
    { key: "finances", label: "Finances" },
    { key: "audit", label: "Audit" }
  ]}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  actions={<>...</>}
>
  {activeTab === "overview" && <OverviewSection />}
  {activeTab === "finances" && <FinancesSection />}
  {/* etc. */}
</DetailsScaffold>
```

**Tab variants:**
- `"underline-orange"` (default) — Orange underline indicator
- `"pills"` — Pill-style tabs

**Tab features:**
- Keyboard navigation (arrow keys)
- Disabled tab support
- Active state styling
- Responsive sizing (`xs`, `sm`, `md`)

### Existing Finance Tab Content (Placeholder)

**Contact/Party Finance Tab** (`PartyDetailsView.tsx:675`):
```tsx
{activeTab === "finances" && (
  <div className="space-y-3">
    <SectionCard title="Finances">
      <div className="text-sm text-secondary">Coming Soon</div>
    </SectionCard>
  </div>
)}
```

**Organization Finance Tab** (`App-Organizations.tsx:345`):
```tsx
{activeTab === "finances" && (
  <div className="space-y-3">
    <SectionCard title="Finances">
      <div className="text-sm text-secondary">Coming Soon</div>
    </SectionCard>
  </div>
)}
```

**Status:** Stub implementations exist. No data, no API calls, no UI components.

### Finance Module (Standalone App)

**File:** `apps/finance/src/App-Finance.tsx`

**Status:** Fully implemented Finance module with:
- Invoice list view (table)
- Invoice detail drawer
- Create/edit invoice modal
- Payment recording UI
- Mock data (no backend integration)

**Key components:**

#### Invoice List Table
- **Columns:** Invoice #, Contact/Organization, Related To, Status, Issue Date, Due Date, Total, Balance
- **Features:**
  - Column visibility toggle
  - Multi-column sort
  - Search/filter
  - Row selection
  - Pagination (25/50/100 rows per page)
  - CSV export
- **Data:** `MOCK_INVOICES` array (3 sample records)

#### Invoice Detail Drawer
- **Sections:**
  - Invoice metadata (number, status, dates)
  - Client info (Party name, type)
  - Context (Related To: Offspring Group, Offspring, Animal, BreedingPlan, or Other)
  - Line items (simple total, no itemization in MVP)
  - Payment history (table)
  - Notes
- **Actions:**
  - Edit invoice
  - Record payment
  - Void invoice

#### Invoice Create/Edit Modal
- **Fields:**
  - Invoice number (text)
  - Status (dropdown: Draft, Sent, Partial, Paid, Void, Refunded)
  - Party Type (Contact/Organization radio)
  - Party Name (text input — should be autocomplete in real impl)
  - Context Type (dropdown: Offspring Group, Offspring, Waitlist Entry, Animal, Other)
  - Context Label (text — manual entry, should be autocomplete)
  - Issue Date (date picker)
  - Due Date (date picker, optional)
  - Total (number input, currency)
  - Balance (number input, currency)
  - Currency (text, default USD)
  - Notes (textarea)
- **Validation:**
  - Invoice number (min 3 chars)
  - Party Name (min 2 chars)
  - Total (required, numeric)
  - Issue Date (required)

#### Payment Recording Modal
**Status:** Not implemented in current Finance app. Mentioned in schema recon.

**Expected UI:**
- Amount (number input)
- Method (dropdown: Card, ACH, Check, Cash, Wire, Other)
- Received At (datetime picker)
- Reference (text input — Stripe ID, check number)
- Notes (textarea, optional)
- **Auto-update balance** on save

### Expenses Tab (Stub)

**File:** `apps/finance/src/App-Finance.tsx:410-448`

**Tab exists** but shows no content (no mock data, no UI implemented).

**Expected UI (from schema recon):**
- Expense list table
- Expense detail drawer
- Create/edit expense modal
- Receipt upload/attachment
- Category dropdown (Vet, Food, Supplies, Boarding, Training, etc.)
- Vendor Party autocomplete
- Anchor fields (Animal, OffspringGroup, BreedingPlan)

## What Appears Unused

### Legacy Invoice Context Fields

**From Finance app mock data:**
```typescript
contextType: "OFFSPRING_GROUP" | "OFFSPRING" | "WAITLIST_ENTRY" | "ANIMAL" | "OTHER" | null;
contextLabel: string; // Manual text entry
```

**Problem:** Free-text `contextLabel` and string enum `contextType` will be replaced by explicit nullable FKs:
- `offspringGroupId` + `offspringGroupName` (from join)
- `offspringId` + `offspringName`
- `animalId` + `animalName`
- `breedingPlanId` + `breedingPlanName`
- `serviceCode` (string) for "Other" (e.g., "stud_fee", "boarding")

**Recommendation:**
- Keep `contextType` enum for UI display/filtering during migration
- Populate from anchor FKs server-side: `if (offspringGroupId) contextType = "OFFSPRING_GROUP"`
- Eventually remove in favor of explicit anchors

### Party Name Free-Text Input

**Current UI:** Manual text entry for `partyName` in Create/Edit modal.

**Problem:** No validation, no FK enforcement, typos possible.

**Recommendation:** Replace with autocomplete:
```tsx
<PartyAutocomplete
  value={form.clientPartyId}
  onChange={(partyId, partyName) => {
    setForm({ ...form, clientPartyId: partyId, partyName });
  }}
  placeholder="Search contacts or organizations..."
/>
```

**Autocomplete source:**
```
GET /api/v1/parties?q={searchTerm}&tenantId=1&limit=20
```

**Response:**
```typescript
{
  items: [
    { partyId: 123, kind: "CONTACT", displayName: "Jane Smith" },
    { partyId: 456, kind: "ORGANIZATION", displayName: "Blue River Doodles" }
  ]
}
```

## What is Missing for Finance MVP

### Required UI Components

#### 1. Finance Tab Content (Cross-Object Views)

**For each object (Animal, OffspringGroup, BreedingPlan, Party):**

**Section 1: Invoices**
- Table with columns: Invoice #, Status, Issue Date, Due Date, Total, Balance
- Click row → open invoice detail drawer
- Filter by status (Sent, Partial, Paid, Void)
- **Empty state:** "No invoices yet. Create one to start tracking revenue."

**Section 2: Expenses**
- Table with columns: Date, Category, Vendor, Description, Amount
- Click row → open expense detail drawer
- Filter by category
- **Empty state:** "No expenses recorded."

**Section 3: Summary (optional for MVP)**
- Total Revenue (sum of paid invoices)
- Total Expenses
- Net Profit (revenue - expenses)
- **Display as cards** at top of Finance tab

**API calls (on tab activate):**
```typescript
const invoices = await api.invoices.list({
  tenantId,
  animalId,      // OR offspringGroupId, breedingPlanId, clientPartyId
  includeArchived: false
});

const expenses = await api.expenses.list({
  tenantId,
  animalId,
  includeArchived: false
});
```

**Where to add:**

| Object | File | Tab Config Location | Insert After |
|--------|------|---------------------|--------------|
| Animal | `apps/animals/src/App-Animals.tsx` | Line 4345-4356 (dynamic builder) | "Pairing" tab, before "Audit" |
| OffspringGroup | `apps/offspring/src/App-Offspring.tsx` | Line 5040-5047 (inline tabs array) | "Analytics" tab |
| BreedingPlan | `apps/breeding/src/App-Breeding.tsx` | Line 64-69 (`PLAN_TABS` constant) | "Deposits" tab, before "Audit" |
| Contact/Party | `apps/contacts/src/PartyDetailsView.tsx` | Already exists, replace placeholder | — |
| Organization | `apps/organizations/src/App-Organizations.tsx` | Already exists, replace placeholder | — |

#### 2. Payment Recording Modal

**File:** `apps/finance/src/App-Finance.tsx` (or shared component)

**Trigger:** "Record Payment" button in Invoice detail drawer

**Fields:**
```tsx
<Modal open={paymentModalOpen} onClose={closeModal} title="Record Payment">
  <Input label="Amount" type="number" step="0.01" value={amount} />
  <Select label="Method" value={method}>
    <option value="CARD">Credit/Debit Card</option>
    <option value="ACH">ACH/Bank Transfer</option>
    <option value="CHECK">Check</option>
    <option value="CASH">Cash</option>
    <option value="WIRE">Wire Transfer</option>
    <option value="OTHER">Other</option>
  </Select>
  <DateTimePicker label="Received At" value={receivedAt} />
  <Input label="Reference" placeholder="Stripe ID, check number, etc." />
  <Textarea label="Notes (optional)" />
</Modal>
```

**On save:**
```typescript
await api.payments.create({
  tenantId,
  invoiceId,
  amount: amountCents,
  method,
  receivedAt,
  reference,
  notes
});

// Server auto-updates invoice.balance
// Reload invoice to show updated balance
const updatedInvoice = await api.invoices.get(invoiceId);
setInvoice(updatedInvoice);
```

#### 3. Expense Create/Edit Modal

**File:** `apps/finance/src/App-Finance.tsx` (new modal)

**Fields:**
```tsx
<Input label="Date" type="date" value={date} />
<Input label="Amount" type="number" step="0.01" value={amount} />
<Select label="Category">
  <option value="vet">Veterinary</option>
  <option value="food">Food & Nutrition</option>
  <option value="supplies">Supplies</option>
  <option value="boarding">Boarding</option>
  <option value="training">Training</option>
  <option value="grooming">Grooming</option>
  <option value="breeding">Breeding Services</option>
  <option value="marketing">Marketing</option>
  <option value="other">Other</option>
</Select>
<PartyAutocomplete label="Vendor (optional)" value={vendorPartyId} />
<Textarea label="Description" />
<FileUpload label="Receipt (optional)" accept="image/*,application/pdf" />
<Select label="Related To (optional)">
  <option value="">None</option>
  <option value="animal">Animal</option>
  <option value="offspringGroup">Offspring Group</option>
  <option value="breedingPlan">Breeding Plan</option>
</Select>
{relatedToType === "animal" && <AnimalAutocomplete value={animalId} />}
{relatedToType === "offspringGroup" && <OffspringGroupAutocomplete value={offspringGroupId} />}
{relatedToType === "breedingPlan" && <BreedingPlanAutocomplete value={breedingPlanId} />}
```

**On save:**
```typescript
await api.expenses.create({
  tenantId,
  date,
  amount: amountCents,
  currency: "USD",
  category,
  vendorPartyId,
  description,
  animalId,
  offspringGroupId,
  breedingPlanId
});

// Upload receipt separately if file present
if (receiptFile) {
  const attachment = await api.attachments.upload({
    tenantId,
    file: receiptFile,
    entityType: "EXPENSE",
    entityId: newExpense.id
  });
}
```

#### 4. Invoice Status Badge Component

**Current:** Status shown as text in table.

**Recommendation:** Visual status badges with colors:

```tsx
function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variants = {
    DRAFT: { label: "Draft", color: "gray" },
    SENT: { label: "Sent", color: "blue" },
    PARTIAL: { label: "Partial", color: "orange" },
    PAID: { label: "Paid", color: "green" },
    VOID: { label: "Void", color: "red" },
    REFUNDED: { label: "Refunded", color: "purple" }
  };
  const { label, color } = variants[status];
  return <Badge variant="outline" className={`badge-${color}`}>{label}</Badge>;
}
```

**Use in:** Invoice table, invoice detail drawer, Finance tab lists.

#### 5. Currency Formatting Helper

**Exists in Finance app:** `formatCurrency(amount, currency)`

**Recommendation:** Extract to shared util:
```typescript
// packages/ui/src/utils/currency.ts
export function formatCurrency(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}
```

**Use everywhere:** Invoice totals, balances, payment amounts, expense amounts.

#### 6. Party Display Component

**Current:** `partyName` string displayed as-is.

**Recommendation:** Unified Party display with kind badge:

```tsx
function PartyDisplay({ partyId, kind, displayName }: PartyRef) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="muted" size="xs">{kind === "CONTACT" ? "C" : "O"}</Badge>
      <span className="text-sm">{displayName}</span>
    </div>
  );
}
```

**Use in:** Invoice table, expense table, Finance tab lists.

### Required Autocomplete Components

#### 1. PartyAutocomplete
**For:** Invoice.clientPartyId, Expense.vendorPartyId

**Behavior:**
- Debounced search (300ms)
- Dropdown with Party kind badges
- Keyboard navigation
- Shows recent/frequent parties when empty

**API:**
```
GET /api/v1/parties?q={term}&tenantId=1&limit=20
```

#### 2. AnimalAutocomplete
**For:** Invoice.animalId, Expense.animalId

**API:**
```
GET /api/v1/animals?q={term}&tenantId=1&limit=20
```

#### 3. OffspringGroupAutocomplete
**For:** Invoice.offspringGroupId, Expense.offspringGroupId

**API:**
```
GET /api/v1/offspring/groups?q={term}&tenantId=1&limit=20
```

#### 4. BreedingPlanAutocomplete
**For:** Invoice.breedingPlanId, Expense.breedingPlanId

**API:**
```
GET /api/v1/breeding/plans?q={term}&tenantId=1&limit=20
```

**Recommendation:** Build generic `AsyncAutocomplete<T>` component:
```tsx
<AsyncAutocomplete
  label="Related Animal"
  fetchOptions={async (q) => {
    const res = await api.animals.list({ q, limit: 20 });
    return res.items.map(a => ({ value: a.id, label: a.name }));
  }}
  value={animalId}
  onChange={setAnimalId}
/>
```

## UI Component Hierarchy (Recommended)

```
apps/
  finance/
    src/
      App-Finance.tsx              [Main module, Invoice/Expense list]
      components/
        InvoiceDetailDrawer.tsx    [Invoice detail view]
        InvoiceFormModal.tsx       [Create/edit invoice]
        PaymentFormModal.tsx       [Record payment]
        ExpenseDetailDrawer.tsx    [Expense detail view]
        ExpenseFormModal.tsx       [Create/edit expense]
        FinanceTabContent.tsx      [Shared Finance tab component]
        InvoiceStatusBadge.tsx     [Status visual]

  animals/
    src/
      App-Animals.tsx              [Add Finance tab]

  offspring/
    src/
      App-Offspring.tsx            [Add Finance tab]

  breeding/
    src/
      App-Breeding.tsx             [Add Finance tab]

  contacts/
    src/
      PartyDetailsView.tsx         [Replace Finance tab placeholder]

  organizations/
    src/
      App-Organizations.tsx        [Replace Finance tab placeholder]

packages/
  ui/
    src/
      components/
        Autocomplete/
          AsyncAutocomplete.tsx    [Generic autocomplete]
          PartyAutocomplete.tsx    [Party-specific]
          AnimalAutocomplete.tsx   [Animal-specific]
          OffspringGroupAutocomplete.tsx
          BreedingPlanAutocomplete.tsx
      utils/
        currency.ts                [Currency formatting]
```

## Recommended Action Summary

| Item | Action | Priority | Notes |
|------|--------|----------|-------|
| FinanceTabContent component | Add | CRITICAL | Reusable Finance tab for all objects |
| PaymentFormModal | Add | CRITICAL | Required for Invoice payment recording |
| ExpenseFormModal | Add | CRITICAL | Required for Expense creation |
| PartyAutocomplete | Add | CRITICAL | Replace free-text Party input |
| Animal/OffspringGroup/BreedingPlan Finance tabs | Add | CRITICAL | Tab skeleton + API integration |
| Contact/Organization Finance tab content | Replace | CRITICAL | Remove "Coming Soon" placeholder |
| AsyncAutocomplete generic component | Add | HIGH | DRY pattern for all autocompletes |
| InvoiceStatusBadge | Add | MEDIUM | Visual improvement |
| PartyDisplay component | Add | MEDIUM | Consistent Party rendering |
| Currency formatting util | Extract | MEDIUM | Already exists, move to shared |
| Expense tab UI (standalone Finance app) | Add | LOW | MVP can defer standalone Expense module |

## Frontend Implementation Checklist

- [ ] Extract `FinanceTabContent` component from Finance app
- [ ] Build `PaymentFormModal` with amount/method/date fields
- [ ] Build `ExpenseFormModal` with category/vendor/receipt fields
- [ ] Build `PartyAutocomplete` with debounced search
- [ ] Build `AnimalAutocomplete`, `OffspringGroupAutocomplete`, `BreedingPlanAutocomplete`
- [ ] Add Finance tab to Animal detail view (after Pairing, before Audit)
- [ ] Add Finance tab to OffspringGroup detail view (after Analytics)
- [ ] Add Finance tab to BreedingPlan detail view (after Deposits, before Audit)
- [ ] Replace Finance tab placeholder in Contact/Party detail view
- [ ] Replace Finance tab placeholder in Organization detail view
- [ ] Integrate Invoice/Expense list API calls in Finance tab content
- [ ] Test Finance tab with real backend data
- [ ] Test Payment recording updates Invoice balance
- [ ] Test Expense creation with receipt upload
- [ ] Test autocomplete search/selection UX
