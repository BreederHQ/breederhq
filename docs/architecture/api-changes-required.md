# API Changes Required for Production Deployment

**Review Date**: 2026-01-12
**Status**: REQUIRED FOR PRODUCTION
**Priority**: HIGH

This document specifies all API endpoint changes required before production deployment of marketplace functionality.

---

## Table of Contents

1. [RESTful Endpoint Corrections](#1-restful-endpoint-corrections)
2. [Versioning Standardization](#2-versioning-standardization)
3. [Idempotency Requirements](#3-idempotency-requirements)
4. [Optimistic Locking](#4-optimistic-locking)
5. [Pagination Standards](#5-pagination-standards)
6. [Error Response Format](#6-error-response-format)
7. [New Endpoints Required](#7-new-endpoints-required)
8. [State Transition APIs](#8-state-transition-apis)

---

## 1. RESTful Endpoint Corrections

### Issue: Non-RESTful Verbs

Several proposed endpoints use POST for state updates instead of PATCH.

### Changes Required

#### Change #1: Mark Invoice Paid

**CURRENT** (Proposed):
```
POST /api/v1/marketplace/invoices/:id/mark-paid
```

**REQUIRED**:
```
PATCH /api/v1/marketplace/invoices/:id
```

**REQUEST SCHEMA**:
```json
{
  "action": "mark_paid",
  "paymentMethod": "venmo" | "zelle" | "cash" | "check" | "wire" | "other",
  "paymentReference": "string (optional)",
  "paymentReceiptUrl": "string (REQUIRED for manual payments)"
}
```

**RESPONSE SCHEMA**:
```json
{
  "id": 123,
  "status": "pending_confirmation",
  "buyerMarkedPaidAt": "2026-01-12T10:30:00Z",
  "buyerPaymentMethod": "venmo",
  "buyerPaymentReference": "@johndoe",
  "buyerPaymentReceiptUrl": "https://storage.example.com/receipts/abc123.jpg"
}
```

**ERROR CODES**:
- `400`: Missing paymentReceiptUrl for manual payment mode
- `404`: Invoice not found
- `409`: Invoice already paid or voided
- `403`: User not authorized to mark this invoice paid

**REASON**: Marking an invoice as paid is a state update (PATCH), not resource creation (POST).

---

#### Change #2: Confirm Payment

**CURRENT** (Proposed):
```
POST /api/v1/invoices/:id/confirm-payment
```

**REQUIRED**:
```
PATCH /api/v1/tenants/:tenantId/invoices/:id
```

**REQUEST SCHEMA**:
```json
{
  "action": "confirm_payment",
  "notes": "string (optional)"
}
```

**RESPONSE SCHEMA**:
```json
{
  "id": 123,
  "status": "paid",
  "paidAt": "2026-01-12T11:00:00Z",
  "providerConfirmedAt": "2026-01-12T11:00:00Z",
  "providerConfirmedBy": 456
}
```

**ERROR CODES**:
- `404`: Invoice not found
- `409`: Invoice not in pending_confirmation state
- `403`: User not authorized to confirm payment for this invoice
- `422`: Invoice payment mode does not support confirmation workflow

**REASON**: Payment confirmation is a state update (PATCH), not resource creation (POST).

---

## 2. Versioning Standardization

### Issue: Inconsistent API Versioning

Some endpoints lack version prefix, creating inconsistency.

### Required Changes

**CURRENT**:
```
POST /invoices
GET /invoices
POST /payments
```

**REQUIRED**:
```
POST /api/v1/tenants/:tenantId/invoices
GET /api/v1/tenants/:tenantId/invoices
POST /api/v1/tenants/:tenantId/payments
```

**REASON**: Consistent versioning enables future API evolution without breaking changes.

---

## 3. Idempotency Requirements

### Requirement: All Write Operations Must Support Idempotency

**APPLIES TO**: All POST, PATCH, DELETE endpoints

**REQUIRED HEADER**:
```
Idempotency-Key: <uuid>
```

**EXAMPLE**:
```http
POST /api/v1/marketplace/invoices
Headers:
  Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
  Content-Type: application/json

Body:
{
  "transactionId": 123,
  "lineItems": [...]
}
```

### Behavior Specification

1. **First Request** (idempotency key new):
   - Process request normally
   - Cache response with idempotency key + request hash
   - Return response with `201 Created`

2. **Duplicate Request** (same key, same request hash):
   - Return cached response
   - Return `200 OK` (NOT 201)
   - Include header: `X-Idempotent-Replay: true`

3. **Conflict** (same key, different request hash):
   - Return `409 Conflict`
   - Response body:
   ```json
   {
     "error": {
       "code": "IDEMPOTENCY_CONFLICT",
       "message": "Idempotency key already used with different request",
       "details": {
         "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
         "originalRequestHash": "abc123...",
         "currentRequestHash": "def456..."
       }
     }
   }
   ```

### Implementation Note

Idempotency cache should:
- Store for 24 hours
- Include request body hash (SHA-256)
- Be database-backed (not in-memory) for reliability

---

## 4. Optimistic Locking

### Requirement: Prevent Concurrent Modification Conflicts

**APPLIES TO**: All UPDATE operations (PATCH endpoints)

### Schema Addition

All updatable entities must have `version` field:
```sql
ALTER TABLE invoices ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE marketplace_invoices ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE marketplace_transactions ADD COLUMN version INTEGER DEFAULT 1;
```

### API Specification

**REQUEST MUST INCLUDE**:
```json
{
  "version": 5,
  "status": "paid",
  ...
}
```

**RESPONSE INCLUDES INCREMENTED VERSION**:
```json
{
  "id": 123,
  "version": 6,
  "status": "paid",
  ...
}
```

**ERROR ON VERSION MISMATCH**:
```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "Resource has been modified by another request",
    "details": {
      "providedVersion": 5,
      "currentVersion": 7,
      "resourceType": "Invoice",
      "resourceId": 123
    }
  }
}
```

**STATUS CODE**: `409 Conflict`

---

## 5. Pagination Standards

### Requirement: Consistent Pagination Across All List Endpoints

**QUERY PARAMETERS** (all list endpoints):
```
page: number (default: 1, min: 1)
limit: number (default: 50, min: 1, max: 200)
sortBy: string (field name, validated against allowed fields)
sortDir: "asc" | "desc" (default: "desc")
```

**RESPONSE SCHEMA**:
```json
{
  "items": [ ... ],
  "pagination": {
    "total": 1234,
    "page": 2,
    "limit": 50,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Cursor-Based Pagination (High-Volume Endpoints)

For messages, transactions, and other high-volume endpoints:

**QUERY PARAMETERS**:
```
cursor: string (opaque cursor token)
limit: number (default: 50, max: 200)
```

**RESPONSE SCHEMA**:
```json
{
  "items": [ ... ],
  "pagination": {
    "nextCursor": "eyJpZCI6MTIzLCJ0cyI6MTY0...",
    "hasMore": true
  }
}
```

**EXAMPLE**:
```
GET /api/v1/threads/:id/messages?cursor=eyJpZCI6MTIzLCJ0cyI6MTY0...&limit=50
```

---

## 6. Error Response Format

### Requirement: Standardized Error Responses

**ALL ERROR RESPONSES** must follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "value",
      "additionalContext": "..."
    },
    "timestamp": "2026-01-12T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Code Taxonomy

| HTTP Status | Error Code | When to Use |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request data |
| 400 | `MISSING_REQUIRED_FIELD` | Required field not provided |
| 400 | `INVALID_FIELD_VALUE` | Field value out of range/format |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Authenticated but not authorized |
| 404 | `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| 409 | `CONFLICT` | Resource state conflict |
| 409 | `IDEMPOTENCY_CONFLICT` | Idempotency key reused with different request |
| 409 | `VERSION_CONFLICT` | Optimistic locking version mismatch |
| 422 | `BUSINESS_RULE_VIOLATION` | Request violates business logic |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `SERVICE_UNAVAILABLE` | External service down |

### Example Error Responses

**Validation Error**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "paymentMethod": "Must be one of: venmo, zelle, cash, check"
      }
    },
    "timestamp": "2026-01-12T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

**Authorization Error**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User does not have permission to access this resource",
    "details": {
      "userId": "user_123",
      "resourceType": "Invoice",
      "resourceId": 456,
      "requiredPermission": "invoice:confirm_payment"
    },
    "timestamp": "2026-01-12T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## 7. New Endpoints Required

### Endpoint #1: Cross-Database Invoice Resolver

**PURPOSE**: Resolve invoice regardless of database (tenant vs marketplace)

**ENDPOINT**:
```
GET /api/v1/marketplace/transactions/:id/invoice
```

**AUTHENTICATION**: Required (marketplace user JWT)

**AUTHORIZATION**: User must be transaction participant (buyer or seller)

**RESPONSE SCHEMA**:
```json
{
  "invoiceType": "tenant" | "marketplace",
  "invoiceDatabase": "tenant" | "marketplace",
  "invoice": {
    "id": 123,
    "invoiceNumber": "INV-2026-0001",
    "totalCents": 50000,
    "balanceCents": 0,
    "status": "paid",
    "paymentMode": "stripe",
    "dueDate": "2026-02-01T00:00:00Z",
    "paidAt": "2026-01-15T10:30:00Z",
    "lineItems": [
      {
        "description": "Training service",
        "quantity": 1,
        "unitPriceCents": 50000,
        "totalCents": 50000
      }
    ]
  }
}
```

**ERROR CODES**:
- `404`: Transaction not found
- `404`: Invoice not found (transaction has no linked invoice)
- `403`: User not authorized to view this invoice

**IMPLEMENTATION NOTE**: This endpoint abstracts away the dual-database complexity from clients.

---

### Endpoint #2: Payment Receipt Upload

**PURPOSE**: Upload payment receipt before marking invoice paid

**ENDPOINT**:
```
POST /api/v1/marketplace/invoices/:id/payment-receipts
```

**AUTHENTICATION**: Required (marketplace user JWT)

**AUTHORIZATION**: User must be invoice payer

**REQUEST**: `multipart/form-data`
```
file: <binary> (image or PDF, max 10MB)
```

**RESPONSE SCHEMA**:
```json
{
  "receiptUrl": "https://storage.example.com/receipts/abc123.jpg",
  "uploadedAt": "2026-01-12T10:30:00Z",
  "fileSize": 1048576,
  "mimeType": "image/jpeg"
}
```

**ERROR CODES**:
- `400`: File too large (max 10MB)
- `400`: Invalid file type (must be image/jpeg, image/png, or application/pdf)
- `404`: Invoice not found
- `403`: User not authorized to upload receipt for this invoice
- `413`: Payload too large

**IMPLEMENTATION NOTE**: Use S3 or similar for storage. Generate signed URLs with expiration.

---

### Endpoint #3: Batch Contact Resolver

**PURPOSE**: Resolve multiple marketplace users to tenant contacts in single request

**ENDPOINT**:
```
POST /api/v1/tenants/:tenantId/contacts/resolve-marketplace-users
```

**AUTHENTICATION**: Required (tenant staff JWT)

**REQUEST SCHEMA**:
```json
{
  "marketplaceUserIds": [123, 456, 789]
}
```

**RESPONSE SCHEMA**:
```json
{
  "contacts": {
    "123": {
      "id": 10,
      "name": "John Doe",
      "email": "john@example.com",
      "marketplaceUserId": 123
    },
    "456": {
      "id": 11,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "marketplaceUserId": 456
    },
    "789": null
  }
}
```

**ERROR CODES**:
- `400`: Invalid marketplaceUserIds (must be array of integers)
- `400`: Too many IDs (max 100 per request)
- `403`: User not authorized for this tenant

**IMPLEMENTATION NOTE**: Prevents N+1 query issues when resolving contacts for multiple transactions.

---

## 8. State Transition APIs

### Transaction State Transitions

**ENDPOINT**:
```
PATCH /api/v1/marketplace/transactions/:id
```

**ALLOWED ACTIONS** (via `action` field):

#### Action: `cancel`
**FROM STATES**: `pending_invoice`, `invoiced`
**TO STATE**: `cancelled`

**REQUEST**:
```json
{
  "version": 5,
  "action": "cancel",
  "reason": "Client changed their mind"
}
```

**BUSINESS RULES**:
- Can only cancel before payment
- Must refund if already paid
- Notifies both parties

---

#### Action: `mark_disputed`
**FROM STATES**: `paid`, `refunded`
**TO STATE**: `disputed`

**REQUEST**:
```json
{
  "version": 5,
  "action": "mark_disputed",
  "disputeReason": "Service not provided as described",
  "disputeEvidence": "https://storage.example.com/evidence/..."
}
```

**BUSINESS RULES**:
- Creates support ticket
- Freezes funds if possible
- Notifies platform admins

---

### Invoice State Transitions

**ENDPOINT**:
```
PATCH /api/v1/tenants/:tenantId/invoices/:id
PATCH /api/v1/marketplace/invoices/:id
```

**ALLOWED ACTIONS**:

#### Action: `send`
**FROM STATES**: `draft`
**TO STATE**: `sent`

**REQUEST**:
```json
{
  "version": 3,
  "action": "send",
  "sendEmail": true
}
```

**BUSINESS RULES**:
- Sets `issuedAt` to current timestamp
- Sends email notification if `sendEmail` is true
- Cannot be reverted (must void instead)

---

#### Action: `void`
**FROM STATES**: `draft`, `sent`, `pending_confirmation`
**TO STATE**: `void`

**REQUEST**:
```json
{
  "version": 3,
  "action": "void",
  "reason": "Duplicate invoice created"
}
```

**BUSINESS RULES**:
- Cannot void paid invoices
- Sets `voidedAt` to current timestamp
- Updates linked transaction to `cancelled`

---

#### Action: `mark_paid` (Manual Mode Only)
**FROM STATES**: `sent`
**TO STATE**: `pending_confirmation`

**REQUEST**:
```json
{
  "version": 3,
  "action": "mark_paid",
  "paymentMethod": "venmo",
  "paymentReference": "@johndoe",
  "paymentReceiptUrl": "https://storage.example.com/receipts/..."
}
```

**BUSINESS RULES**:
- Requires payment receipt upload first
- Notifies provider to confirm
- Auto-expires after 7 days if not confirmed

---

#### Action: `confirm_payment` (Manual Mode Only)
**FROM STATES**: `pending_confirmation`
**TO STATE**: `paid`

**REQUEST**:
```json
{
  "version": 3,
  "action": "confirm_payment",
  "notes": "Payment received via Venmo"
}
```

**BUSINESS RULES**:
- Only provider can confirm
- Sets `paidAt` to current timestamp
- Updates linked transaction to `paid`
- Triggers payout if Stripe Connect

---

#### Action: `dispute_payment` (Manual Mode Only)
**FROM STATES**: `pending_confirmation`
**TO STATE**: `sent`

**REQUEST**:
```json
{
  "version": 3,
  "action": "dispute_payment",
  "reason": "Payment not received"
}
```

**BUSINESS RULES**:
- Reverts to `sent` status
- Clears buyer payment marking
- Notifies buyer of dispute
- Creates support ticket for manual resolution

---

## Implementation Checklist

- [ ] Update all POST endpoints for state changes to PATCH
- [ ] Add API versioning to all unversioned endpoints
- [ ] Implement idempotency middleware for all write operations
- [ ] Add `version` field to all updatable entities
- [ ] Implement optimistic locking checks in all PATCH handlers
- [ ] Standardize pagination across all list endpoints
- [ ] Implement cursor-based pagination for high-volume endpoints
- [ ] Standardize error response format across all endpoints
- [ ] Build cross-database invoice resolver endpoint
- [ ] Build payment receipt upload endpoint
- [ ] Build batch contact resolver endpoint
- [ ] Implement state transition action handlers
- [ ] Add request validation middleware
- [ ] Add authorization middleware for cross-database access
- [ ] Update API documentation (OpenAPI/Swagger)
- [ ] Write integration tests for all new endpoints
- [ ] Load test high-volume endpoints (1000 req/s)
- [ ] Test idempotency under concurrent load
- [ ] Test optimistic locking race conditions

---

## Migration Notes

### Breaking Changes

The following changes are **breaking** and require client updates:

1. POST → PATCH for state transitions
2. Response format changes (pagination structure)
3. Error response format standardization
4. Idempotency header requirement

### Migration Strategy

**Phase 1**: Deploy with backward compatibility
- Support both old and new formats
- Log deprecation warnings
- Set sunset date (90 days)

**Phase 2**: Deprecation period
- Return `Deprecation` header on old endpoints
- Send email notifications to API consumers
- Provide migration guides

**Phase 3**: Breaking change
- Remove old endpoint support
- Return `410 Gone` for deprecated endpoints

---

**Document Version**: 1.0
**Last Updated**: 2026-01-12
**Review Status**: Required for Production
