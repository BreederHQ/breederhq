# Media Upload API

This document describes the unified media upload API for BreederHQ, supporting both tenant (subscriber) and provider (marketplace) file uploads.

**Related Documentation:**
- [S3 Architecture Strategy](../infrastructure/s3-architecture-strategy.md) - Full architecture design
- [AWS S3 Setup Guide](../infrastructure/aws-s3-setup-guide.md) - Infrastructure setup

## Overview

The media API provides presigned URL-based uploads directly to S3, with:
- **Ownership-based storage keys**: `tenants/{tenantId}/...` or `providers/{providerId}/...`
- **Database-controlled visibility**: PRIVATE, BUYERS, PUBLIC
- **Document tracking**: Creates Document records for tenant uploads
- **Content validation**: File type and size limits

## Environment Variables

```bash
AWS_ACCESS_KEY_ID=       # IAM user access key
AWS_SECRET_ACCESS_KEY=   # IAM user secret
AWS_REGION=us-east-1     # S3 bucket region
S3_BUCKET=breederhq-assets-dev  # Bucket name
CDN_DOMAIN=              # Optional CloudFront domain (falls back to S3 direct)
```

---

## API Endpoints

### 1. Get Presigned Upload URL

Request a presigned URL for uploading a file directly to S3 from the browser.

```http
POST /api/v1/media/upload-url
Content-Type: application/json

Body:
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "contentLength": 1024000,  // Optional: bytes
  "context": {
    "type": "tenant",
    "tenantId": 123,
    "purpose": "animal",
    "resourceId": "456",      // Optional: animalId, contractId, etc.
    "subPath": "photos"       // Optional: photos, documents, logo, etc.
  },
  "visibility": "PRIVATE"     // Optional: PRIVATE (default), BUYERS, PUBLIC
}

Response 200:
{
  "uploadUrl": "https://breederhq-assets-dev.s3.us-east-1.amazonaws.com/tenants/123/animals/456/photos/abc-uuid.jpg?...",
  "storageKey": "tenants/123/animals/456/photos/abc-uuid.jpg",
  "cdnUrl": "https://breederhq-assets-dev.s3.us-east-1.amazonaws.com/tenants/123/animals/456/photos/abc-uuid.jpg",
  "expiresIn": 900
}

Response 400:
{
  "error": "invalid_content_type",
  "message": "Invalid content type. Allowed: images (JPEG, PNG, WebP, HEIC)"
}

Response 401:
{
  "error": "unauthorized",
  "message": "Tenant authentication required"
}

Response 403:
{
  "error": "forbidden",
  "message": "You can only upload to your own tenant account"
}
```

**Context Types:**

| Type | Required Fields | Purpose Options |
|------|-----------------|-----------------|
| `tenant` | `tenantId` | `animal`, `offspring`, `contract`, `finance`, `services`, `credentials`, `profile` |
| `provider` | `providerId` | `listings`, `credentials`, `profile` |

**Storage Key Patterns:**

```
# Tenant uploads
tenants/{tenantId}/animals/{animalId}/photos/{uuid}.jpg
tenants/{tenantId}/animals/{animalId}/documents/{uuid}.pdf
tenants/{tenantId}/contracts/{contractId}/{uuid}.pdf
tenants/{tenantId}/finance/invoices/{invoiceId}/{uuid}.pdf
tenants/{tenantId}/services/{listingId}/{uuid}.jpg
tenants/{tenantId}/credentials/{uuid}.pdf
tenants/{tenantId}/profile/logo/{uuid}.jpg

# Provider uploads
providers/{providerId}/listings/{listingId}/{uuid}.jpg
providers/{providerId}/credentials/{uuid}.pdf
providers/{providerId}/profile/logo/{uuid}.jpg
providers/{providerId}/profile/banner/{uuid}.jpg
```

**Allowed File Types:**

| Purpose | Allowed Types |
|---------|--------------|
| `animal`, `offspring`, `profile`, `services`, `listings` | image/jpeg, image/png, image/webp, image/heic |
| `contract`, `finance`, `credentials` | image/jpeg, image/png, image/webp + application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document |

**File Size Limits:**
- Images: 10MB max
- Documents: 50MB max

---

### 2. Confirm Upload

After successfully uploading to S3 using the presigned URL, confirm the upload to update the document status.

```http
POST /api/v1/media/confirm
Content-Type: application/json

Body:
{
  "storageKey": "tenants/123/animals/456/photos/abc-uuid.jpg"
}

Response 200:
{
  "ok": true,
  "storageKey": "tenants/123/animals/456/photos/abc-uuid.jpg",
  "status": "READY"
}

Response 404:
{
  "error": "file_not_found",
  "message": "File not found in storage. Upload may have failed."
}

Response 403:
{
  "error": "forbidden",
  "message": "You do not have permission to confirm this upload"
}
```

**Implementation Notes:**
- Verifies the file exists in S3 via HEAD request
- Updates Document record status from `UPLOADING` to `READY`
- Ownership is validated before confirmation

---

### 3. Get Access URL

Get a URL to view/download a file. Returns either a public CDN URL or a time-limited presigned URL based on visibility.

```http
GET /api/v1/media/access/{storageKey}

Response 200 (PUBLIC file):
{
  "url": "https://breederhq-assets-dev.s3.us-east-1.amazonaws.com/tenants/123/animals/456/photos/abc-uuid.jpg",
  "visibility": "PUBLIC",
  "expiresIn": null
}

Response 200 (PRIVATE file):
{
  "url": "https://breederhq-assets-dev.s3.us-east-1.amazonaws.com/tenants/123/animals/456/photos/abc-uuid.jpg?X-Amz-...",
  "visibility": "PRIVATE",
  "expiresIn": 3600
}

Response 403:
{
  "error": "forbidden",
  "message": "You do not have permission to access this file"
}
```

**Access Rules:**
- **PUBLIC** files: Accessible by anyone
- **PRIVATE** files: Only accessible by same tenant
- **BUYERS** files: Accessible by tenant + buyers with portal access (TODO)
- Provider files: Accessible by the provider or if listing is published

---

### 4. Change Visibility

Update the visibility setting of a file. Only the owner can change visibility.

```http
PATCH /api/v1/media/{storageKey}/visibility
Content-Type: application/json

Body:
{
  "visibility": "PUBLIC"
}

Response 200:
{
  "ok": true,
  "storageKey": "tenants/123/animals/456/photos/abc-uuid.jpg",
  "visibility": "PUBLIC"
}

Response 400:
{
  "error": "invalid_visibility",
  "message": "Visibility must be PRIVATE, BUYERS, or PUBLIC"
}

Response 403:
{
  "error": "forbidden",
  "message": "You can only change visibility of your own files"
}

Response 404:
{
  "error": "not_found",
  "message": "Document not found"
}
```

**Important:** Changing visibility does NOT move the file in S3. The file stays in the same location; only the database visibility setting changes.

---

### 5. Delete File

Delete a file from S3 and mark the document as deleted.

```http
DELETE /api/v1/media/{storageKey}

Response 200:
{
  "ok": true
}

Response 403:
{
  "error": "forbidden",
  "message": "You do not have permission to delete this file"
}
```

**Implementation Notes:**
- Validates ownership from storage key pattern
- Deletes file from S3
- Updates Document status if record exists

---

## Frontend Integration

### Upload Flow

```typescript
// 1. Request presigned URL
const uploadResponse = await fetch('/api/v1/media/upload-url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    filename: file.name,
    contentType: file.type,
    contentLength: file.size,
    context: {
      type: 'tenant',
      tenantId: currentTenantId,
      purpose: 'animal',
      resourceId: animalId,
      subPath: 'photos'
    },
    visibility: 'PRIVATE'
  })
});

const { uploadUrl, storageKey, cdnUrl } = await uploadResponse.json();

// 2. Upload directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': file.type
  }
});

// 3. Confirm upload
await fetch('/api/v1/media/confirm', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ storageKey })
});

// 4. Use cdnUrl to display the image
// For PRIVATE files, use /api/v1/media/access/{storageKey} to get a fresh signed URL
```

### Display Flow (Private Files)

```typescript
// For private files, get a fresh signed URL before displaying
const accessResponse = await fetch(`/api/v1/media/access/${encodeURIComponent(storageKey)}`);
const { url } = await accessResponse.json();

// Use url in <img src={url} /> - expires in 1 hour
```

---

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| `POST /upload-url` | 30 requests/minute |
| `POST /confirm` | 30 requests/minute |
| `GET /access/:key` | 100 requests/minute |
| `PATCH /:key/visibility` | 20 requests/minute |
| `DELETE /:key` | 20 requests/minute |

---

## Source Files

- API Routes: `breederhq-api/src/routes/media.ts`
- S3 Client: `breederhq-api/src/services/s3-client.ts`
- Storage Service: `breederhq-api/src/services/media-storage.ts`
