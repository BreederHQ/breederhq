# Waitlist Payment-Gated Approval

## Overview

This feature enables breeders to require deposit payment before waitlist entries are approved. When a marketplace user pays their deposit invoice, the breeder is notified and must finalize the approval manually - choosing whether to create the applicant as a Contact (individual) or Organization (business) in their CRM.

## User Flow

### Breeder Side (Platform)

1. Breeder views a pending waitlist entry in the waitlist management drawer
2. Clicks "Generate Deposit Invoice" button
3. Enters amount (pre-filled from program settings if configured) and due date
4. Invoice is created and optionally emailed to the applicant
5. Entry shows payment status badge in both Pending and Approved tabs
6. When payment is received:
   - Entry status changes to `DEPOSIT_PAID`
   - Breeder receives email notification with "Action Required"
   - Email includes link to waitlist dashboard
7. **Breeder finalizes approval manually:**
   - Reviews the applicant details
   - Decides whether to create as Contact (individual) or Organization (business)
   - Approves entry → moves to Approved tab with proper CRM record

### Marketplace User Side (Portal)

1. User logs into marketplace portal
2. Goes to Inquiries → Waitlist Requests tab
3. Sees their pending request with deposit status:
   - "Awaiting Payment" (amber badge) - invoice issued, not yet paid
   - "Partial (X%)" (amber badge) - partial payment received
   - "Overdue" (red badge) - past due date
   - "Paid" (green badge) - fully paid
4. Clicks "Pay Now" button → redirected to Stripe Checkout
5. Completes payment on Stripe
6. Redirected back to portal with success message
7. Entry shows "Deposit Paid" status (still pending breeder's final approval)
8. Once breeder finalizes, entry moves to "Approved" section

## Technical Architecture

### Contact Requirement for Approved Entries

**All approved waitlist entries must be linked to a Contact in the breeder's CRM.**

This is a fundamental business rule: when someone moves from "pending" to "approved" on a waitlist, they become a customer/prospect that the breeder can manage in their CRM.

#### How Contacts Are Created

1. **Marketplace Submission** - When a user submits a waitlist request from the marketplace, the `findOrCreateContactParty()` function:
   - Checks if a Contact already exists with that email
   - If not, creates a Party (type: CONTACT) and Contact record
   - Links the WaitlistEntry to that Party via `clientPartyId`

2. **Manual Entry** - When a breeder manually creates a waitlist entry:
   - They select an existing Contact, or
   - Create a new Contact inline

3. **Auto-Approval via Payment** - When the Stripe webhook processes a deposit payment:
   - Checks if `clientParty.contact` exists
   - If not (edge case), creates a Contact from the Party info
   - This ensures the invariant is maintained even for entries created outside the normal flow

#### Party → Contact Relationship

```
Party (type: CONTACT)
├── id: number
├── tenantId: number
├── name: string
├── email: string
└── contact: Contact (1:1 relation)
    ├── id: number
    ├── partyId: number → Party.id
    ├── first_name: string
    ├── last_name: string
    ├── display_name: string
    └── email: string
```

The WaitlistEntry links to the Party via `clientPartyId`, and the Party has a Contact record that stores CRM-specific fields.

### Data Model

```
WaitlistEntry
├── depositInvoiceId: Int?     → links to Invoice
├── depositRequiredCents: Int?
├── depositPaidCents: Int?
├── depositPaidAt: DateTime?
└── status: INQUIRY | DEPOSIT_PAID | APPROVED | REJECTED

Status Flow:
  INQUIRY → (invoice generated) → INQUIRY (with invoice)
          → (payment received) → DEPOSIT_PAID
          → (breeder finalizes) → APPROVED

Invoice
├── waitlistEntryId: Int?      → back-link to WaitlistEntry
├── scope: "waitlist"          → new scope type
└── category: "DEPOSIT"
```

### API Endpoints

#### Platform API (breederhq-api)

**POST `/api/v1/waitlist/:id/generate-deposit-invoice`**
- Generates a deposit invoice for a pending waitlist entry
- Body: `{ amountCents?: number, dueAt?: string, sendEmail?: boolean }`
- Response: `{ invoice: InvoiceSummary, emailSent: boolean }`
- Creates Invoice with `waitlistEntryId` anchor
- Links invoice to entry via `depositInvoiceId`
- Optionally sends invoice email to applicant

**POST `/api/v1/waitlist/:id/resend-invoice-email`**
- Resends the deposit invoice email
- Response: `{ success: boolean }`

**GET `/api/v1/waitlist`** (modified)
- Now includes `depositInvoice` relation in response
- Returns invoice summary: id, status, totalCents, paidCents, balanceCents, dueAt
- Supports comma-separated status filter (e.g., `?status=INQUIRY,DEPOSIT_PAID`)

#### Marketplace API

**GET `/api/v1/marketplace/waitlist/my-requests`** (modified)
- Now includes `invoice` object in each request
- Invoice fields: id, status, totalCents, paidCents, balanceCents, dueAt

**POST `/api/v1/marketplace/invoices/:id/checkout`**
- Creates Stripe Checkout session for invoice payment
- Verifies user owns the invoice (email match)
- Returns: `{ checkoutUrl: string }`
- Supports partial payments (shows balance due)
- Routes payment to breeder's Stripe Connect account if configured

### Stripe Integration

#### Checkout Session

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],
  success_url: `${baseUrl}/inquiries?tab=waitlist&payment=success`,
  cancel_url: `${baseUrl}/inquiries?tab=waitlist&payment=canceled`,
  customer_email: user.email,
  metadata: {
    invoiceId: "123",
    tenantId: "456",
    waitlistEntryId: "789",
    type: "deposit_invoice",
  },
});
```

#### Webhook Handler

The `checkout.session.completed` webhook in `/api/v1/billing/webhooks/stripe`:

1. Verifies `metadata.type === "deposit_invoice"`
2. Updates Invoice: paidCents, balanceCents, status → PAID
3. Updates WaitlistEntry:
   - Records depositPaidCents and depositPaidAt
   - Sets status to `DEPOSIT_PAID` (NOT auto-approved)
4. Sends "Action Required" email to breeder:
   - Applicant name and email
   - Payment amount
   - Link to waitlist dashboard
   - Instructions to finalize approval

**Why No Auto-Approval?** The breeder must manually finalize approval because:
- We cannot determine if the payer is an individual or a business from the Stripe payment
- The breeder needs to decide whether to create a **Contact** (individual) or **Organization** (business) in their CRM
- This gives the breeder a chance to review the applicant before committing

**Approval is finalized via:** The existing `/waitlist/:id/approve` endpoint, which the breeder triggers from the UI after reviewing the paid entry.

### Frontend Components

#### Platform (apps/waitlist)

**GenerateInvoiceModal.tsx**
- Amount input with dollar sign prefix
- Due date picker (default: 14 days out)
- "Send email" checkbox
- Shows default amount from program settings

**App-Waitlist.tsx** (PendingWaitlistDrawer)
- Deposit Status section showing PaymentStatusBadge
- Generate Invoice button (if no invoice)
- Resend Email button (if invoice exists but unpaid)

**WaitlistTab.tsx**
- Payment status column in table
- PaymentStatusBadge component

#### Marketplace (apps/marketplace)

**InquiriesPage.tsx**
- WaitlistRequestCard shows deposit section when invoice exists
- PaymentStatusBadge with status colors
- "Pay Now" button triggers checkout

**hooks.ts**
- `WaitlistInvoice` interface
- Extended `WaitlistRequest` with `invoice` field

### Program Settings

**BreedingProgramProfile** (`packages/ui/src/utils/breedingProgram.ts`)

```typescript
placement: {
  depositRequired: boolean;
  depositAmountUSD?: number | null;  // Default amount in dollars
  requireDepositBeforeApproval?: boolean;  // Block manual approval until paid
}
```

## Files Modified

### Backend (breederhq-api)

| File | Changes |
|------|---------|
| `src/routes/waitlist.ts` | Added `generate-deposit-invoice` and `resend-invoice-email` endpoints, added `depositInvoice` includes |
| `src/routes/marketplace-waitlist.ts` | Added `invoices/:id/checkout` endpoint, added invoice data to `my-requests` response |
| `src/routes/billing.ts` | Extended webhook handler for deposit invoice payments with auto-approval |
| `prisma/schema.prisma` | Added `waitlistEntryId` to Invoice, `depositInvoiceId` relation to WaitlistEntry |

### Frontend (breederhq)

| File | Changes |
|------|---------|
| `apps/waitlist/src/api.ts` | Added invoice types and `generateDepositInvoice` method |
| `apps/waitlist/src/components/GenerateInvoiceModal.tsx` | New component |
| `apps/waitlist/src/App-Waitlist.tsx` | Added deposit section to drawer |
| `apps/waitlist/src/pages/WaitlistTab.tsx` | Added payment status column |
| `apps/marketplace/src/messages/hooks.ts` | Added `WaitlistInvoice` interface, extended `WaitlistRequest` |
| `apps/marketplace/src/marketplace/pages/InquiriesPage.tsx` | Added deposit section to WaitlistRequestCard |
| `packages/ui/src/components/Finance/PaymentStatusBadge.tsx` | New reusable component |
| `packages/ui/src/utils/breedingProgram.ts` | Added `requireDepositBeforeApproval` setting |

## Testing Checklist

### Generate Invoice Flow
- [ ] Go to Waitlist → Pending tab
- [ ] Click on a pending entry
- [ ] Click "Generate Deposit Invoice"
- [ ] Verify amount pre-fills from program settings (if configured)
- [ ] Submit and verify invoice is created
- [ ] Verify email is sent to applicant (check logs)
- [ ] Verify entry shows "Awaiting Payment" badge

### Marketplace Payment Flow
- [ ] Log into marketplace as the applicant
- [ ] Go to Inquiries → Waitlist Requests
- [ ] Verify pending request shows deposit section
- [ ] Click "Pay Now"
- [ ] Complete Stripe Checkout
- [ ] Verify redirect back to portal with success
- [ ] Verify entry moved to "Approved" section
- [ ] Verify badge shows "Paid"

### Breeder Notification
- [ ] After payment, verify breeder receives email
- [ ] Email shows applicant name, email, and amount
- [ ] Email says "Action Required" and links to waitlist dashboard
- [ ] Email explains breeder needs to finalize approval

### Finalize Approval Flow
- [ ] Entry shows in Pending tab with "Deposit Paid" status
- [ ] Breeder can click to open entry details
- [ ] Breeder can choose to create as Contact or Organization
- [ ] After approval, entry moves to Approved tab
- [ ] Contact/Organization appears in CRM

### Edge Cases
- [ ] Entry already has invoice → "Generate" button hidden, shows status
- [ ] Partial payment → shows "Partial (X%)" badge
- [ ] Overdue invoice → shows red "Overdue" badge
- [ ] Invoice already paid → "Pay Now" button hidden
- [ ] No email on applicant → checkbox disabled with warning

## Future Enhancements

- Questionnaire builder and assignment to programs/listings
- Auto-approval rules engine (AND/OR logic combining payment + questionnaire)
- Phone screening tracking
- Auto-send invoice when marketplace user joins waitlist
- Configurable auto-approval behavior (some breeders may want manual review even after payment)
