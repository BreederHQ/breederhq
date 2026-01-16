# Portal Stripe Checkout - Backend Implementation Guide

This document specifies the backend endpoints needed to support invoice payments in the client portal via Stripe Checkout.

## Overview

Portal users (clients) need to be able to pay invoices assigned to them by breeders. The flow is:
1. Client views invoice in portal
2. Client clicks "Pay Now" button
3. Frontend calls `POST /api/v1/portal/invoices/{id}/checkout`
4. Backend creates Stripe Checkout session and returns URL
5. Client is redirected to Stripe Checkout
6. After payment, Stripe sends webhook to `/api/v1/billing/webhooks/stripe`
7. Backend processes webhook, updates invoice status, creates payment record

## Endpoints Required

### 1. POST `/api/v1/portal/invoices/{id}/checkout`

Creates a Stripe Checkout session for paying an invoice.

**Authentication:** Portal session cookie (`bhq_s_portal`)

**Authorization:**
- User must be authenticated portal user
- Invoice's `clientPartyId` must match the portal user's `partyId`
- Invoice status must be `ISSUED`, `PARTIALLY_PAID`, or `OVERDUE` (not `PAID`, `VOID`, `DRAFT`)

**Request:**
```
POST /api/v1/portal/invoices/123/checkout
Cookie: bhq_s_portal=xxx
```

**Response (Success - 200):**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_xxx...",
  "sessionId": "cs_xxx..."
}
```

**Response (Errors):**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Invoice doesn't belong to this user
- `404 Not Found` - Invoice not found
- `400 Bad Request` - Invoice already paid or voided

**Implementation Notes:**

```typescript
// Pseudocode for endpoint handler
async function createPortalInvoiceCheckout(req, res) {
  const { id: invoiceId } = req.params;
  const portalUser = req.portalUser; // From auth middleware

  // 1. Fetch invoice with tenant context
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: portalUser.tenantId,
    },
    include: {
      lineItems: true,
      clientParty: true,
    },
  });

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  // 2. Authorization: verify ownership
  if (invoice.clientPartyId !== portalUser.partyId) {
    return res.status(403).json({ error: "Access denied" });
  }

  // 3. Validate invoice can be paid
  if (invoice.status === "PAID" || invoice.status === "VOID") {
    return res.status(400).json({
      error: `Invoice cannot be paid (status: ${invoice.status})`
    });
  }

  // 4. Calculate amount due (in cents)
  const amountDue = invoice.balanceCents || (invoice.totalCents - invoice.paidCents);
  if (amountDue <= 0) {
    return res.status(400).json({ error: "Invoice has no balance due" });
  }

  // 5. Get tenant's Stripe configuration
  const tenant = await prisma.tenant.findUnique({
    where: { id: portalUser.tenantId },
    include: { billing: true },
  });

  // 6. Build success/cancel URLs
  const portalBaseUrl = getPortalBaseUrl(tenant); // e.g., https://portal.breederhq.com/t/tatooine
  const successUrl = `${portalBaseUrl}/financials?success=true`;
  const cancelUrl = `${portalBaseUrl}/financials?canceled=true`;

  // 7. Build line items for Stripe
  const lineItems = invoice.lineItems.map(item => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.description || `Invoice #${invoice.invoiceNumber}`,
      },
      unit_amount: Math.abs(item.unitCents), // Stripe expects positive cents
    },
    quantity: item.qty,
  }));

  // If no line items, create single line item for total
  if (lineItems.length === 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: `Invoice #${invoice.invoiceNumber}`,
        },
        unit_amount: amountDue,
      },
      quantity: 1,
    });
  }

  // 8. Create Stripe Checkout session
  const stripeParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: portalUser.email,
    metadata: {
      type: "portal_invoice_payment",
      invoiceId: String(invoice.id),
      tenantId: String(portalUser.tenantId),
      clientPartyId: String(portalUser.partyId),
      invoiceNumber: invoice.invoiceNumber,
    },
  };

  // 9. If tenant has Stripe Connect, route payment to their account
  if (tenant.billing?.stripeConnectAccountId) {
    stripeParams.payment_intent_data = {
      application_fee_amount: calculatePlatformFee(amountDue), // e.g., 2.9% + $0.30
      transfer_data: {
        destination: tenant.billing.stripeConnectAccountId,
      },
    };
  }

  const session = await stripe.checkout.sessions.create(stripeParams);

  return res.json({
    checkoutUrl: session.url,
    sessionId: session.id,
  });
}
```

### 2. POST `/api/v1/billing/webhooks/stripe`

Handles Stripe webhook events. Add handling for portal invoice payments.

**New Event Type to Handle:** `checkout.session.completed`

**Implementation Notes:**

```typescript
// Add to existing webhook handler
async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, // Must be raw body, not parsed JSON
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Idempotency check
  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: event.id },
  });

  if (existingKey?.status === "succeeded") {
    console.log(`Already processed event ${event.id}`);
    return res.json({ received: true });
  }

  // Create processing lock
  await prisma.idempotencyKey.upsert({
    where: { key: event.id },
    create: {
      key: event.id,
      resourceType: "webhook",
      status: "processing",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    update: { status: "processing" },
  });

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      // ... other event types ...
    }

    // Mark as succeeded
    await prisma.idempotencyKey.update({
      where: { key: event.id },
      data: { status: "succeeded" },
    });

    return res.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook ${event.id}:`, err);

    await prisma.idempotencyKey.update({
      where: { key: event.id },
      data: { status: "failed" },
    });

    return res.status(500).json({ error: "Processing failed" });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};

  // Only process portal invoice payments
  if (metadata.type !== "portal_invoice_payment") {
    return;
  }

  const invoiceId = parseInt(metadata.invoiceId, 10);
  const tenantId = parseInt(metadata.tenantId, 10);
  const clientPartyId = parseInt(metadata.clientPartyId, 10);

  if (!invoiceId || !tenantId) {
    console.error("Missing required metadata in checkout session:", session.id);
    return;
  }

  // Get payment amount from session
  const amountPaid = session.amount_total || 0; // In cents

  // Fetch invoice
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId: tenantId,
    },
  });

  if (!invoice) {
    console.error(`Invoice ${invoiceId} not found for tenant ${tenantId}`);
    return;
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      tenantId: tenantId,
      invoiceId: invoiceId,
      amountCents: amountPaid,
      receivedAt: new Date(),
      methodType: "CREDIT_CARD",
      referenceNumber: session.payment_intent as string,
      notes: `Stripe Checkout: ${session.id}`,
    },
  });

  // Update invoice
  const newPaidCents = invoice.paidCents + amountPaid;
  const newBalanceCents = invoice.totalCents - newPaidCents;
  const newStatus = newBalanceCents <= 0 ? "PAID" : "PARTIALLY_PAID";

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidCents: newPaidCents,
      balanceCents: newBalanceCents,
      status: newStatus,
    },
  });

  // If invoice is linked to a placement/waitlist entry, update its status too
  if (invoice.waitlistEntryId) {
    await prisma.waitlistEntry.update({
      where: { id: invoice.waitlistEntryId },
      data: {
        depositPaidAt: newStatus === "PAID" ? new Date() : undefined,
      },
    });
  }

  // Send notification to breeder
  await sendBreederPaymentNotification({
    tenantId,
    invoiceId,
    invoiceNumber: invoice.invoiceNumber,
    amountPaid,
    clientPartyId,
  });

  console.log(`Processed payment for invoice ${invoiceId}: $${amountPaid / 100}`);
}
```

## Database Schema Updates

If not already present, add IdempotencyKey table:

```prisma
model IdempotencyKey {
  id           Int      @id @default(autoincrement())
  key          String   @unique // Stripe event ID (evt_xxx)
  resourceType String   // "webhook", "Payment", etc.
  resourceId   Int?     // Created resource ID
  status       String   // "processing", "succeeded", "failed"
  response     Json?    // Cached response
  createdAt    DateTime @default(now())
  expiresAt    DateTime // For cleanup

  @@index([key])
  @@index([expiresAt])
}
```

## Environment Variables Required

```env
# Stripe API keys
STRIPE_SECRET_KEY=sk_live_xxx  # or sk_test_xxx for testing
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Portal base URL (for success/cancel redirects)
PORTAL_BASE_URL=https://portal.breederhq.com
```

## Testing

### Local Testing with Stripe CLI

```bash
# Install Stripe CLI and login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/billing/webhooks/stripe

# Trigger test webhook
stripe trigger checkout.session.completed
```

### Test Scenarios

1. **Happy Path:**
   - Create invoice assigned to a party with portal access
   - Login to portal as that user
   - Navigate to financials
   - Click Pay Now on invoice
   - Complete Stripe checkout (use test card 4242 4242 4242 4242)
   - Verify redirect back to portal with success=true
   - Verify invoice status changed to PAID
   - Verify payment record created

2. **Authorization Tests:**
   - Attempt to checkout invoice belonging to different user (should 403)
   - Attempt to checkout already paid invoice (should 400)
   - Attempt to checkout voided invoice (should 400)

3. **Webhook Idempotency:**
   - Send same webhook event twice
   - Verify only one payment record created

## Security Considerations

1. **Always verify webhook signatures** - Never process webhooks without signature verification
2. **Validate invoice ownership** - User can only pay their own invoices
3. **Use idempotency** - Prevent duplicate payments from webhook retries
4. **Log all payment events** - For audit trail and debugging
5. **Don't expose internal IDs** - Use invoice number in Stripe description, not internal ID
