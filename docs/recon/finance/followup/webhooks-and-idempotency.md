# Finance Follow-Up: Webhooks and Idempotency

**Recon scope:** Frontend-only codebase. Backend patterns cannot be confirmed without schema access.

**Goal:** Identify existing webhook infrastructure and idempotency mechanisms for payment provider integrations.

---

## What Exists

### Webhook Infrastructure

**Searched:** `webhook|signature|stripe|square|intents|event\.type`

**Found:**
- **None** in application code.
- Only mentions in finance recon docs ([docs/recon/finance/](../)).

**Observations:**
- No webhook endpoint stubs (e.g., `POST /api/v1/webhooks/stripe`).
- No signature verification utilities.
- No event processing logic.

**Conclusion:** No webhook infrastructure detected.

### Idempotency Patterns

**Searched:** `idempotency|Idempotency|dedupe|requestId`

**Found:**
- **None** in application code.
- Vite config files contain `devDependenciesMeta` (unrelated).

**Observations:**
- No `Idempotency-Key` header handling in API client.
- No database table for tracking processed requests.

**Conclusion:** No idempotency strategy detected.

### CSRF Protection (Related)

**Found:** [apps/platform/src/api.ts](apps/platform/src/api.ts)

```typescript
const xsrf = readCookie("XSRF-TOKEN");
if (xsrf && !headers.has("x-csrf-token")) headers.set("x-csrf-token", xsrf);
```

**Notes:**
- CSRF token for mutations (POST, PUT, DELETE).
- Cookie-based, server-verified.
- **Not the same as idempotency** (CSRF prevents forged requests, not duplicate processing).

---

## What is Missing

### Webhook Endpoints
For payment providers (Stripe, Square, PayPal):
- `POST /api/v1/webhooks/stripe`
- `POST /api/v1/webhooks/square`

**Required components:**
1. Signature verification (HMAC, RSA).
2. Event type routing (`payment_intent.succeeded`, `invoice.payment_failed`).
3. Idempotent processing (avoid double-crediting payments).

### Idempotency Table

**Schema (recommended):**
```prisma
model IdempotencyKey {
  id           Int      @id @default(autoincrement())
  tenantId     Int
  key          String   // Client-provided or webhook event ID
  resourceType String   // "Payment", "Invoice"
  resourceId   Int?     // Created resource ID (null if failed)
  status       String   // "processing", "succeeded", "failed"
  response     Json?    // Cached response for replay
  createdAt    DateTime @default(now())
  expiresAt    DateTime // Auto-cleanup old keys (7-30 days)

  @@unique([tenantId, key])
  @@index([tenantId, expiresAt]) // Cleanup query
}
```

**Usage:**
```typescript
// Webhook handler
const eventId = req.body.id; // Stripe: evt_123, Square: sqhk_456

const existing = await prisma.idempotencyKey.findUnique({
  where: { tenantId_key: { tenantId, key: eventId } }
});

if (existing) {
  if (existing.status === 'succeeded') {
    return res.json(existing.response); // Already processed
  }
  if (existing.status === 'processing') {
    return res.status(409).json({ error: 'Duplicate request in flight' });
  }
  // status === 'failed' → retry
}

// Create "processing" lock
await prisma.idempotencyKey.create({
  data: { tenantId, key: eventId, resourceType: 'Payment', status: 'processing' }
});

// Process event...
const payment = await createPayment(...);

// Mark succeeded
await prisma.idempotencyKey.update({
  where: { tenantId_key: { tenantId, key: eventId } },
  data: { status: 'succeeded', resourceId: payment.id, response: { paymentId: payment.id } }
});
```

### Outbox Pattern (Alternative/Complement)

For reliable event emission (e.g., "invoice paid" → notify client):

```prisma
model Outbox {
  id           Int      @id @default(autoincrement())
  tenantId     Int
  eventType    String   // "invoice.paid", "payment.received"
  aggregateId  Int      // Invoice ID, Payment ID
  payload      Json
  status       String   // "pending", "sent", "failed"
  attempts     Int      @default(0)
  createdAt    DateTime @default(now())
  processedAt  DateTime?

  @@index([tenantId, status])
}
```

**Use case:**
- Transactionally create Payment + Outbox entry.
- Worker polls Outbox, sends webhooks to client systems (if they register endpoints).

**Not needed for MVP** unless offering outbound webhooks to customers.

---

## Decision / Recommendation

### Webhook Readiness (Payment Providers)

**Timeline:**
- **MVP (Phase 1.0):** Manual payment entry only. No webhooks.
- **Phase 1.1:** Stripe/Square integration with webhook support.

**MVP Verdict:** **Not a blocker.** Defer to Phase 1.1.

### Idempotency Strategy

**Recommendation:** **Implement IdempotencyKey table in Phase 1.1** (before webhook integration).

**Why:**
- Prevents duplicate payments if Stripe retries webhook.
- Also useful for client-side retry safety (e.g., double-click on "Record Payment" button).

**Client-side idempotency (bonus):**
```typescript
// Frontend generates UUID for payment creation
const idempotencyKey = crypto.randomUUID();

fetch('/api/v1/payments', {
  method: 'POST',
  headers: { 'Idempotency-Key': idempotencyKey },
  body: JSON.stringify({ invoiceId, amount })
});

// Backend checks key before creating Payment
```

**Recommendation:** Add client-side idempotency for `POST /payments` in MVP (low effort, high safety).

### Webhook Implementation (Phase 1.1)

**Stripe example:**
```typescript
// POST /api/v1/webhooks/stripe
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

const idempotencyKey = event.id; // evt_1234

// Check idempotency table...
// Process event...
// Update Payment status...
```

**Square example:**
```typescript
// POST /api/v1/webhooks/square
const sig = req.headers['x-square-hmacsha256-signature'];
const isValid = verifySquareSignature(req.body, sig, process.env.SQUARE_WEBHOOK_SECRET);

const idempotencyKey = req.body.event_id; // sqhk_1234
// ...
```

---

## MVP Impact

**Low (MVP 1.0), High (Phase 1.1)**

**Why:**
- MVP 1.0: Manual payment entry, no webhook dependency.
- Phase 1.1: Stripe/Square webhooks are critical for automated payment matching.

**Becomes a blocker IF:**
- Payment provider integration is part of MVP 1.0.
- Automated invoice status updates (PAID, PARTIAL) required.

**Immediate next steps (for Phase 1.1):**
1. Add `IdempotencyKey` model to schema.
2. Implement `POST /api/v1/webhooks/stripe` endpoint.
3. Add signature verification middleware.
4. Create event handler for `payment_intent.succeeded` → `createPayment()`.
5. Test with Stripe CLI webhook forwarding.

---

## Open Questions

1. **Which payment providers for MVP?** Stripe, Square, both, or manual only?
2. **Outbound webhooks?** Will customers integrate *with* BreederHQ (e.g., send "invoice paid" events to accounting system)?
3. **Retry policy?** Exponential backoff for failed webhook processing?

---

## Related Patterns

### CSRF vs Idempotency

| Concern | Purpose | Mechanism | When Needed |
|---------|---------|-----------|-------------|
| **CSRF** | Prevent forged requests | Token in cookie + header | All state-changing endpoints |
| **Idempotency** | Prevent duplicate processing | Request ID + result cache | Webhooks, payment endpoints |

**Both should be used** (orthogonal concerns).

---

**Related:**
- [gaps-and-recommendations.md](../gaps-and-recommendations.md) - Payment model design
- [schema-findings.md](../schema-findings.md) - Payment model (not yet implemented)
