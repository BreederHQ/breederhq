# E-Signatures API Reference

## Platform API (Breeder)

All platform routes require authentication and tenant context.

### Contracts

#### List Contracts
```
GET /api/v1/contracts
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status: draft, sent, viewed, signed, declined, voided, expired |
| partyId | number | Filter by party (buyer) ID |
| search | string | Search by title or party name |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |

**Response:**
```json
{
  "contracts": [
    {
      "id": 1,
      "title": "Puppy Sales Agreement - Max",
      "status": "sent",
      "expiresAt": "2025-02-15T00:00:00.000Z",
      "signedAt": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "parties": [
        { "id": 1, "role": "SELLER", "name": "Happy Paws Breeding", "status": "signed" },
        { "id": 2, "role": "BUYER", "name": "John Smith", "status": "pending" }
      ]
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

---

#### Get Contract Detail
```
GET /api/v1/contracts/:id
```

**Response:**
```json
{
  "id": 1,
  "tenantId": 1,
  "title": "Puppy Sales Agreement - Max",
  "status": "sent",
  "templateId": 1,
  "offspringId": 123,
  "animalId": null,
  "waitlistEntryId": null,
  "invoiceId": 456,
  "expiresAt": "2025-02-15T00:00:00.000Z",
  "signedAt": null,
  "data": { "customTerms": "..." },
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z",
  "template": {
    "id": 1,
    "name": "Puppy Sales Agreement",
    "category": "SALES_AGREEMENT"
  },
  "parties": [...],
  "content": {
    "renderedHtml": "<div>...</div>",
    "templateVersion": 1
  }
}
```

---

#### Create Contract
```
POST /api/v1/contracts
```

**Request Body:**
```json
{
  "templateId": 1,
  "title": "Puppy Sales Agreement - Max",
  "parties": [
    {
      "partyId": 123,
      "role": "BUYER",
      "name": "John Smith",
      "email": "john@example.com",
      "signer": true
    }
  ],
  "offspringId": 456,
  "invoiceId": 789,
  "expiresAt": "2025-02-15T00:00:00.000Z",
  "data": {
    "customTerms": "Additional terms here..."
  }
}
```

**Response:** Created contract object (status 201)

---

#### Update Draft Contract
```
PATCH /api/v1/contracts/:id
```

Only allowed for contracts with `status: draft`.

**Request Body:**
```json
{
  "title": "Updated Title",
  "expiresAt": "2025-02-20T00:00:00.000Z",
  "data": { "customTerms": "..." }
}
```

---

#### Send Contract
```
POST /api/v1/contracts/:id/send
```

Sends the contract to all signing parties via email. Updates status to `sent`.

**Request Body:**
```json
{
  "message": "Optional personal message to include in the email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract sent to 1 recipient(s)"
}
```

---

#### Void Contract
```
POST /api/v1/contracts/:id/void
```

Voids an active contract. Only allowed for contracts in `draft`, `sent`, or `viewed` status.

**Request Body:**
```json
{
  "reason": "Buyer requested cancellation"
}
```

---

#### Send Reminder
```
POST /api/v1/contracts/:id/remind
```

Sends a reminder email to parties who haven't signed yet.

**Response:**
```json
{
  "success": true,
  "remindedParties": ["john@example.com"]
}
```

---

#### Download PDF
```
GET /api/v1/contracts/:id/pdf
```

Downloads the signed PDF. Only available for contracts with `status: signed`.

**Response:** Binary PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Contract-{id}.pdf"`

---

#### Get Audit Trail
```
GET /api/v1/contracts/:id/events
```

**Response:**
```json
{
  "events": [
    {
      "id": 1,
      "status": "signed",
      "at": "2025-01-16T14:30:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "message": "Contract signed by John Smith",
      "party": { "id": 2, "name": "John Smith", "role": "BUYER" }
    },
    {
      "id": 2,
      "status": "viewed",
      "at": "2025-01-16T14:25:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "message": "Contract viewed by John Smith",
      "party": { "id": 2, "name": "John Smith", "role": "BUYER" }
    }
  ]
}
```

---

### Contract Templates

#### List Templates
```
GET /api/v1/contract-templates
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| type | string | Filter by type: SYSTEM, CUSTOM |
| category | string | Filter by category (see enum values) |
| isActive | boolean | Filter by active status |

**Response:**
```json
{
  "templates": [
    {
      "id": 1,
      "slug": "animal-sales-agreement",
      "name": "Animal Sales Agreement",
      "description": "Standard sales agreement for animal purchases",
      "type": "SYSTEM",
      "category": "SALES_AGREEMENT",
      "version": 1,
      "mergeFields": ["breeder.name", "buyer.name", "animal.name", ...],
      "isActive": true
    }
  ]
}
```

---

#### Get Template Detail
```
GET /api/v1/contract-templates/:id
```

**Response:** Full template object including `bodyHtml` and `bodyJson`.

---

#### Create Custom Template (Pro Only)
```
POST /api/v1/contract-templates
```

**Request Body:**
```json
{
  "name": "My Custom Agreement",
  "description": "Custom terms for special cases",
  "category": "CUSTOM",
  "bodyHtml": "<h1>Agreement</h1><p>{{buyer.name}} agrees to...</p>",
  "bodyJson": { "type": "doc", "content": [...] },
  "mergeFields": ["buyer.name", "breeder.name"]
}
```

**Response:** Created template (status 201)

**Errors:**
- 403: `E_SIGNATURES_CUSTOM_TEMPLATES` entitlement required

---

#### Update Custom Template
```
PATCH /api/v1/contract-templates/:id
```

Only allowed for custom templates owned by the tenant.

---

#### Delete Custom Template
```
DELETE /api/v1/contract-templates/:id
```

Soft deletes by setting `isActive: false`.

---

#### Preview Template
```
POST /api/v1/contract-templates/:id/preview
```

Renders template with sample data for preview.

**Request Body:**
```json
{
  "sampleData": {
    "buyer": { "name": "Sample Buyer" },
    "animal": { "name": "Sample Animal" }
  }
}
```

**Response:**
```json
{
  "html": "<h1>Agreement</h1><p>Sample Buyer agrees to...</p>"
}
```

---

#### Get Available Merge Fields
```
GET /api/v1/contract-templates/merge-fields
```

**Response:**
```json
{
  "fields": [
    {
      "namespace": "breeder",
      "fields": [
        { "key": "breeder.name", "label": "Breeder Name", "type": "string" },
        { "key": "breeder.email", "label": "Breeder Email", "type": "string" },
        { "key": "breeder.phone", "label": "Breeder Phone", "type": "string" }
      ]
    },
    {
      "namespace": "buyer",
      "fields": [
        { "key": "buyer.name", "label": "Buyer Name", "type": "string" },
        { "key": "buyer.email", "label": "Buyer Email", "type": "string" }
      ]
    },
    {
      "namespace": "animal",
      "fields": [
        { "key": "animal.name", "label": "Animal Name", "type": "string" },
        { "key": "animal.breed", "label": "Animal Breed", "type": "string" },
        { "key": "animal.dateOfBirth", "label": "Date of Birth", "type": "date" }
      ]
    }
  ]
}
```

---

## Portal API (Buyer)

All portal routes require portal authentication (buyer session).

### Get Contract for Signing
```
GET /api/v1/portal/contracts/:id/signing
```

**Response:**
```json
{
  "id": 1,
  "title": "Puppy Sales Agreement - Max",
  "status": "sent",
  "expiresAt": "2025-02-15T00:00:00.000Z",
  "parties": [
    { "id": 1, "role": "SELLER", "name": "Happy Paws", "signer": true, "status": "signed" },
    { "id": 2, "role": "BUYER", "name": "John Smith", "signer": true, "status": "pending" }
  ],
  "signatureOptions": {
    "allowTyped": true,
    "allowDrawn": true,
    "allowUploaded": false
  }
}
```

---

### Get Rendered Document
```
GET /api/v1/portal/contracts/:id/document
```

Logs a `viewed` event in the audit trail.

**Response:**
```json
{
  "html": "<div class=\"contract-document\">...</div>"
}
```

---

### Sign Contract
```
POST /api/v1/portal/contracts/:id/sign
```

**Request Body:**
```json
{
  "signatureType": "typed",
  "signatureData": {
    "typedName": "John Smith"
  },
  "consent": true
}
```

Or for drawn signature:
```json
{
  "signatureType": "drawn",
  "signatureData": {
    "drawnImageBase64": "data:image/png;base64,..."
  },
  "consent": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract signed successfully",
  "contractStatus": "signed"
}
```

---

### Decline Contract
```
POST /api/v1/portal/contracts/:id/decline
```

**Request Body:**
```json
{
  "reason": "Terms are not acceptable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contract declined"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| CONTRACT_NOT_FOUND | 404 | Contract does not exist |
| TEMPLATE_NOT_FOUND | 404 | Template does not exist |
| UNAUTHORIZED | 401 | Not authenticated |
| FORBIDDEN | 403 | Not authorized for this action |
| INVALID_STATUS | 400 | Action not allowed in current status |
| ENTITLEMENT_REQUIRED | 403 | Feature requires higher tier |
| VALIDATION_ERROR | 400 | Request body validation failed |
| CONTRACT_EXPIRED | 400 | Contract has expired |
| ALREADY_SIGNED | 400 | Party has already signed |

---

## Status Transitions

### Contract Status
```
draft → sent → viewed → signed
                     ↘ declined
       ↘ voided (from draft, sent, or viewed)
       ↘ expired (automatic)
```

### Signature Status (per party)
```
pending → viewed → signed
               ↘ declined
```
