# BreederHQ S3 Storage Architecture & Implementation Strategy

## Executive Summary

This document outlines a comprehensive S3 storage architecture for BreederHQ, designed to support two distinct owner types (marketplace providers and tenant subscribers) with **dynamic visibility controls** that determine who can access files at any given time.

**Key Insight**: Files don't have a fixed "access tier" - they have an **owner** and a **visibility setting** that can change. The S3 key structure reflects ownership, while the API/database layer enforces dynamic access control.

**Related Documentation:**
- [AWS S3 Setup Guide](./aws-s3-setup-guide.md) - Infrastructure setup instructions
- [AWS Setup Scripts](./aws-setup-scripts/README.md) - Automated setup tools
- [Media Upload API](../api/media-upload-api.md) - API endpoint documentation

**Implementation Status:**
- [x] Architecture design (this document)
- [x] AWS DEV environment setup (breederhq-assets-dev bucket)
- [x] API implementation (src/routes/media.ts, src/services/media-storage.ts)
- [ ] CloudFront CDN (deferred for dev, needed for staging/prod)
- [ ] Frontend integration

---

## 1. Understanding the Two Owner Types

### 1.1 Marketplace Service Providers (Non-Subscribers)

**Who they are:**
- Users who access only `marketplace.breederhq.com`
- NOT BreederHQ subscribers (no tenant)
- Offer animal-related services (grooming, training, vet services, photography, etc.)

**What they upload:**
- Service listing photos
- Profile/business logo and banner
- Credential documents (certifications, licenses)
- Service-related videos (optional)

**Data model:**
```
MarketplaceUser (id: Int)
  └── MarketplaceProvider (id: Int, userId: Int)
        └── MarketplaceServiceListing (id: Int, providerId: Int)
              └── images[], coverImageUrl, etc.
```

**Visibility:**
- `DRAFT` - Only the provider can see (listing not published)
- `PUBLISHED` - Publicly visible on marketplace

### 1.2 BreederHQ Subscribers (Tenants)

**Who they are:**
- Subscribers who manage their breeding business at `app.breederhq.com`
- Have a tenant context (organizational container)
- MAY also have a linked MarketplaceProvider for marketplace listings

**What they upload:**
- Animal photos, health docs, genetic reports, pedigrees
- Offspring/litter photos and contracts
- Contract templates and signed agreements
- Invoices, receipts, expense documentation
- Profile/branding assets

**Data model:**
```
Tenant (id: Int, slug: String)
  └── Animal (id: Int, tenantId: Int)
        └── Document (id: Int, tenantId: Int, animalId: Int, visibility: DocVisibility)
  └── OffspringGroup (id: Int, tenantId: Int)
        └── Document, Attachment
  └── Invoice, Contract, etc.
```

**Visibility (DocVisibility enum):**
- `PRIVATE` - Only tenant staff can access
- `BUYERS` - Tenant staff + buyers of offspring from this animal
- `PUBLIC` - Anyone (exposed on marketplace if linked to listing)

**Additional access grants:**
- `AnimalShare` - Specific other tenants granted VIEW or BREED_PLAN access
- `PortalAccess` - Buyers with portal access to view their purchase details
- `LineageInfoRequest` - Approved pedigree/genetics access requests

---

## 2. The Access Control Model

### 2.1 Ownership vs Access

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        KEY PRINCIPLE                                         │
│                                                                             │
│  S3 KEY STRUCTURE = OWNERSHIP (who owns the file)                           │
│  DATABASE/API     = ACCESS CONTROL (who can see it right now)               │
│                                                                             │
│  Files stay in the same S3 location forever.                                │
│  Visibility changes are purely database/API level.                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Access Decision Flow

```
Request for file arrives
         │
         ▼
┌─────────────────────┐
│ Parse storage key   │
│ Extract owner type  │
│ (provider/tenant)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐     ┌─────────────────────────────────────┐
│ Provider-owned?     │────▶│ Check: Is requester the provider?   │
└─────────────────────┘     │ Check: Is listing published?        │
                            │ If public, return CDN URL           │
                            │ If private, return presigned URL    │
                            └─────────────────────────────────────┘
          │
          │ Tenant-owned
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TENANT FILE ACCESS CHECK                             │
│                                                                             │
│  1. Is requester from the same tenant?                                      │
│     └── YES → Allow (presigned URL)                                         │
│                                                                             │
│  2. Check document visibility setting:                                      │
│     └── PUBLIC → Allow (CDN URL)                                            │
│     └── BUYERS → Check if requester is a buyer (see step 3)                 │
│     └── PRIVATE → Check for explicit grants (see step 4)                    │
│                                                                             │
│  3. Is requester a buyer with access?                                       │
│     └── OffspringGroupBuyer + PortalAccess → Allow (presigned URL)          │
│                                                                             │
│  4. Is there an explicit sharing grant?                                     │
│     └── AnimalShare (ACCEPTED) → Allow (presigned URL)                      │
│     └── LineageInfoRequest (APPROVED) → Allow (presigned URL)               │
│                                                                             │
│  5. None of the above → DENY                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Access Matrix by Surface

| Surface | User Type | Can Access Provider Files | Can Access Tenant Files |
|---------|-----------|---------------------------|-------------------------|
| `marketplace.breederhq.com` | Anonymous | Published listings only | PUBLIC visibility only |
| `marketplace.breederhq.com` | Provider | Own files + published others | PUBLIC visibility only |
| `marketplace.breederhq.com` | Buyer | Published listings only | PUBLIC visibility only |
| `app.breederhq.com` | Tenant Staff | N/A | All own tenant files + shared from others |
| `portal.breederhq.com` | Buyer/Client | N/A | BUYERS/PUBLIC visibility for their purchases |

---

## 3. S3 Key Structure (Ownership-Based)

### 3.1 Two Separate Namespaces

Since providers and tenants are fundamentally different ownership models, we use **separate prefixes**:

```
s3://breederhq-assets-{env}/
│
├── providers/                          # Marketplace service provider files
│   └── {providerId}/
│       ├── profile/
│       │   ├── logo/{uuid}.{ext}
│       │   └── banner/{uuid}.{ext}
│       ├── listings/{listingId}/
│       │   └── {uuid}.{ext}
│       └── credentials/
│           └── {uuid}.{ext}
│
├── tenants/                            # BreederHQ subscriber files
│   └── {tenantId}/
│       ├── animals/{animalId}/
│       │   ├── photos/{uuid}.{ext}
│       │   └── documents/{documentId}/{uuid}.{ext}
│       ├── offspring/{groupId}/
│       │   ├── photos/{uuid}.{ext}
│       │   └── documents/{documentId}/{uuid}.{ext}
│       ├── contracts/{contractId}/
│       │   └── {uuid}.{ext}
│       ├── finance/
│       │   ├── invoices/{invoiceId}/{uuid}.{ext}
│       │   ├── payments/{paymentId}/{uuid}.{ext}
│       │   └── expenses/{expenseId}/{uuid}.{ext}
│       ├── services/{listingId}/       # Marketplace service listings
│       │   └── {uuid}.{ext}
│       ├── credentials/                # Provider credentials/certifications
│       │   └── {uuid}.{ext}
│       └── profile/
│           ├── logo/{uuid}.{ext}
│           └── banner/{uuid}.{ext}
│
└── temp/                               # Temporary uploads (auto-expire)
    └── {ownerType}/{ownerId}/{sessionId}/{uuid}.{ext}
```

### 3.2 Key Structure Rationale

| Component | Purpose |
|-----------|---------|
| `providers/` vs `tenants/` | Clear ownership namespace separation |
| `{providerId}` or `{tenantId}` | Owner isolation, quota tracking, cascade deletion |
| `{resourceType}/` | Organize by logical entity |
| `{resourceId}/` | Link to database record, enable bulk operations |
| `{uuid}.{ext}` | Unique filename, prevents collisions |

### 3.3 Why Not a "Public" Prefix?

You might expect a `/public/` prefix for publicly-visible files. We **intentionally avoid this** because:

1. **Visibility is dynamic** - A file can go from PRIVATE → PUBLIC → PRIVATE
2. **No file moves** - Moving files in S3 on visibility change is expensive and error-prone
3. **CloudFront handles it** - We can serve public files via CDN without a special prefix
4. **Database is source of truth** - The `visibility` column tells us how to serve the file

---

## 4. Serving Files: CDN vs Presigned URLs

### 4.1 Decision Logic

```
When serving a file:
│
├── Is the document visibility = PUBLIC?
│   └── YES → Return CDN URL (public, cached)
│       Format: https://media.breederhq.com/{storageKey}
│
├── Is the document visibility = BUYERS or PRIVATE?
│   └── After access validation passes:
│       └── Return presigned URL (time-limited, not cached)
│           Format: https://s3.amazonaws.com/bucket/key?signature...
│
└── No access?
    └── Return 403 Forbidden
```

### 4.2 CloudFront Configuration

**Single distribution with signed URLs for non-public content:**

```yaml
CloudFrontDistribution:
  Origins:
    - Id: S3Origin
      DomainName: breederhq-assets-{env}.s3.amazonaws.com
      OriginAccessControl: # OAC (replaces OAI)
        SigningBehavior: always
        SigningProtocol: sigv4

  # Default: Require signed URLs
  DefaultCacheBehavior:
    ViewerProtocolPolicy: redirect-to-https
    TrustedKeyGroups: [!Ref SigningKeyGroup]  # CloudFront signed URLs
    CachePolicyId: CachingDisabled
```

**Two access patterns:**

1. **PUBLIC files** - API returns unsigned CDN URL, CloudFront serves from cache
2. **PRIVATE/BUYERS files** - API returns CloudFront signed URL with expiry

### 4.3 Why CloudFront Signed URLs (not S3 presigned)?

| Feature | S3 Presigned | CloudFront Signed |
|---------|--------------|-------------------|
| CDN caching | No | Yes (for public) |
| URL length | Long (~500 chars) | Shorter |
| Bandwidth cost | Higher (direct S3) | Lower (CDN edge) |
| Geographic latency | Higher | Lower (edge locations) |
| Key rotation | Complex | Easier with key groups |

**Recommendation**: Use CloudFront signed URLs for all file access.

---

## 5. Provider-to-Subscriber Conversion & File Migration

### 5.1 Scenario

A standalone marketplace service provider (using only `marketplace.breederhq.com`) decides to become a BreederHQ subscriber. Their existing:
- MarketplaceUser account
- MarketplaceProvider profile
- MarketplaceServiceListing entries
- Uploaded files in `providers/{providerId}/...`

...need to migrate cleanly into their new tenant namespace.

### 5.2 Why Migrate (Not Link)

**Problem with leaving files in two places:**
- Support complexity: "Where are my photos?" → could be either namespace
- Quota tracking requires summing across namespaces
- Cascade deletes need to check both places
- Access control logic becomes more complex

**Solution: Migrate files on conversion**
- All files move to `tenants/{newTenantId}/...`
- Single namespace per subscriber going forward
- Clean, predictable file locations

### 5.3 Migration Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PROVIDER → SUBSCRIBER CONVERSION                          │
│                                                                             │
│  Step 1: Create Tenant                                                       │
│  ────────────────────                                                        │
│  - Create new Tenant record                                                 │
│  - Link: MarketplaceProvider.tenantId = tenant.id                           │
│  - Create TenantMembership for the user                                     │
│                                                                             │
│  Step 2: Queue File Migration Job                                            │
│  ─────────────────────────────────                                           │
│  - List all files in providers/{providerId}/                                │
│  - For each file:                                                           │
│    a. Copy to tenants/{tenantId}/{same-subpath}                             │
│    b. Update Media record: providerId → tenantId, new storageKey            │
│    c. Keep old file temporarily (for rollback)                              │
│                                                                             │
│  Step 3: Update References                                                   │
│  ─────────────────────────                                                   │
│  - MarketplaceServiceListing.coverImageUrl → new CDN path                   │
│  - MarketplaceServiceListing.images[] → new CDN paths                       │
│  - MarketplaceProvider.logoUrl, coverImageUrl → new CDN paths               │
│                                                                             │
│  Step 4: Cleanup (After Grace Period)                                        │
│  ─────────────────────────────────────                                       │
│  - Delete old files from providers/{providerId}/                            │
│  - Remove provider namespace if empty                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Key Path Mappings

| Before (Provider) | After (Tenant) |
|-------------------|----------------|
| `providers/{pId}/profile/logo/{uuid}.jpg` | `tenants/{tId}/profile/logo/{uuid}.jpg` |
| `providers/{pId}/profile/banner/{uuid}.jpg` | `tenants/{tId}/profile/banner/{uuid}.jpg` |
| `providers/{pId}/listings/{listingId}/{uuid}.jpg` | `tenants/{tId}/services/{listingId}/{uuid}.jpg` |
| `providers/{pId}/credentials/{uuid}.pdf` | `tenants/{tId}/credentials/{uuid}.pdf` |

### 5.5 Migration Job Implementation

```typescript
interface MigrationJob {
  providerId: number;
  tenantId: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  filesTotal: number;
  filesMigrated: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

async function migrateProviderToTenant(providerId: number, tenantId: number): Promise<void> {
  // 1. List all files in provider namespace
  const providerPrefix = `providers/${providerId}/`;
  const files = await listS3Objects(providerPrefix);

  // 2. Copy each file to tenant namespace
  for (const file of files) {
    const oldKey = file.Key;
    const newKey = oldKey.replace(`providers/${providerId}/`, `tenants/${tenantId}/`);

    // Special case: "listings" → "services" for clarity in tenant context
    newKey = newKey.replace('/listings/', '/services/');

    await copyS3Object(oldKey, newKey);

    // 3. Update Media record
    await prisma.media.update({
      where: { storageKey: oldKey },
      data: {
        storageKey: newKey,
        providerId: null,
        tenantId: tenantId,
      }
    });
  }

  // 4. Update listing/provider URL references
  await updateProviderMediaReferences(providerId, tenantId);

  // 5. Mark migration complete (cleanup happens later via scheduled job)
  await markMigrationComplete(providerId, tenantId);
}

async function cleanupOldProviderFiles(providerId: number): Promise<void> {
  // Called by scheduled job after grace period (e.g., 7 days)
  const prefix = `providers/${providerId}/`;
  await deleteS3ObjectsByPrefix(prefix);
}
```

### 5.6 Rollback Strategy

If migration fails partway through:
1. Original files still exist in `providers/{providerId}/`
2. Media records with `providerId` still point to old locations
3. Can resume migration from where it left off
4. Or revert any partially-updated records

Grace period before cleanup ensures:
- CDN caches can expire naturally
- Any cached URLs in client apps still work temporarily
- Time to verify migration success before permanent deletion

---

## 6. Database Schema Considerations

### 6.1 Current State

The `Document` model already has:
- `storageKey` - S3 key
- `visibility` - DocVisibility enum (PRIVATE, BUYERS, PUBLIC)
- `status` - DocStatus enum (PLACEHOLDER, UPLOADING, READY, FAILED)
- `tenantId` - Owner tenant

The `MarketplaceServiceListing` has:
- `coverImageUrl` - Direct URL (needs migration to storageKey pattern)
- `images[]` - Array of URLs (needs migration)

### 6.2 Recommended Additions

**Add a unified Media tracking table:**

```prisma
// Unified media tracking across providers and tenants
model Media {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Ownership (exactly one should be set)
  providerId Int?                 // For marketplace providers
  provider   MarketplaceProvider? @relation(fields: [providerId], references: [id])
  tenantId   Int?                 // For BreederHQ tenants
  tenant     Tenant?              @relation(fields: [tenantId], references: [id])

  // Storage reference
  storageKey      String  @unique
  storageProvider String  @default("s3")
  bucket          String?

  // File metadata
  filename String
  mimeType String
  sizeBytes Int

  // Visibility (for tenant files)
  visibility DocVisibility @default(PRIVATE)

  // Context
  resourceType String  // "listing", "animal", "offspring", "contract", etc.
  resourceId   String  // ID of linked resource

  // Lifecycle
  status      MediaStatus @default(UPLOADING)
  uploadedBy  String      // User ID who uploaded
  confirmedAt DateTime?
  deletedAt   DateTime?   // Soft delete

  @@index([providerId])
  @@index([tenantId])
  @@index([storageKey])
  @@index([resourceType, resourceId])
}

enum MediaStatus {
  UPLOADING   // Presigned URL issued
  READY       // Upload confirmed
  PROCESSING  // Optional: transcoding
  FAILED      // Upload failed
  DELETED     // Soft deleted
}
```

### 6.3 Visibility Extension

Consider extending `DocVisibility` to support marketplace explicitly:

```prisma
enum DocVisibility {
  PRIVATE     // Owner only
  BUYERS      // Owner + offspring buyers (tenant context)
  SHARED      // Owner + explicit share grants (AnimalShare, etc.)
  PUBLIC      // Anyone (marketplace listings, public profiles)
}
```

Or keep it simple and let `PUBLIC` cover marketplace visibility.

---

## 7. API Implementation

### 7.1 Unified Upload Endpoint

**Route: `POST /api/v1/media/upload-url`**

```typescript
interface UploadUrlRequest {
  filename: string;
  contentType: string;
  contentLength: number;

  // Context determines ownership and path
  context:
    | { type: "provider"; providerId: number; purpose: "profile" | "listing" | "credential" }
    | { type: "tenant"; tenantId: number; purpose: "animal" | "offspring" | "contract" | "finance" | "profile" };

  // Resource linkage
  resourceId?: string;  // listingId, animalId, etc.

  // Visibility (tenant files only)
  visibility?: "PRIVATE" | "BUYERS" | "PUBLIC";
}

interface UploadUrlResponse {
  uploadUrl: string;      // Presigned S3 PUT URL
  storageKey: string;     // Key to store in database
  cdnUrl: string;         // URL to use after upload (may be CDN or presigned)
  expiresIn: number;      // Seconds until uploadUrl expires
}
```

**Implementation Logic:**

```typescript
async function createUploadUrl(req: UploadUrlRequest, actor: ActorContext): Promise<UploadUrlResponse> {
  // 1. Validate actor has permission to upload to this context
  if (req.context.type === "provider") {
    // Actor must be the provider or have marketplace admin role
    validateProviderAccess(actor, req.context.providerId);
  } else {
    // Actor must be tenant staff
    validateTenantStaff(actor, req.context.tenantId);
  }

  // 2. Validate content type and size
  validateUpload(req.contentType, req.contentLength, req.context.purpose);

  // 3. Generate storage key based on ownership
  const storageKey = generateStorageKey(req);
  // e.g., "providers/123/listings/456/abc-uuid.jpg"
  // e.g., "tenants/789/animals/101/photos/def-uuid.jpg"

  // 4. Generate presigned URL
  const uploadUrl = await generatePresignedPutUrl(storageKey, req.contentType, req.contentLength);

  // 5. Create Media record with UPLOADING status
  await createMediaRecord({
    storageKey,
    providerId: req.context.type === "provider" ? req.context.providerId : null,
    tenantId: req.context.type === "tenant" ? req.context.tenantId : null,
    filename: req.filename,
    mimeType: req.contentType,
    sizeBytes: req.contentLength,
    resourceType: req.context.purpose,
    resourceId: req.resourceId,
    visibility: req.visibility || "PRIVATE",
    status: "UPLOADING",
    uploadedBy: actor.userId,
  });

  // 6. Generate CDN URL (for after upload)
  const cdnUrl = generateCdnUrl(storageKey, req.visibility);

  return { uploadUrl, storageKey, cdnUrl, expiresIn: 900 };
}
```

### 7.2 File Access Endpoint

**Route: `GET /api/v1/media/access/:storageKey`**

```typescript
async function getFileAccessUrl(storageKey: string, actor: ActorContext): Promise<{ url: string }> {
  // 1. Look up media record
  const media = await findMediaByStorageKey(storageKey);
  if (!media) throw new NotFoundError();

  // 2. Determine access based on ownership and visibility
  const access = await checkFileAccess(media, actor);
  if (!access.allowed) throw new ForbiddenError();

  // 3. Return appropriate URL
  if (media.visibility === "PUBLIC") {
    // Direct CDN URL (no signing needed for public)
    return { url: `https://media.breederhq.com/${storageKey}` };
  } else {
    // CloudFront signed URL with expiry
    const signedUrl = await generateSignedUrl(storageKey, { expiresIn: 3600 });
    return { url: signedUrl };
  }
}

async function checkFileAccess(media: Media, actor: ActorContext): Promise<{ allowed: boolean }> {
  // Provider-owned file
  if (media.providerId) {
    // Owner always has access
    if (actor.providerId === media.providerId) return { allowed: true };

    // Public can access published listings
    if (media.visibility === "PUBLIC") return { allowed: true };

    return { allowed: false };
  }

  // Tenant-owned file
  if (media.tenantId) {
    // Same tenant staff always has access
    if (actor.tenantId === media.tenantId && actor.role === "STAFF") {
      return { allowed: true };
    }

    // PUBLIC visibility = anyone
    if (media.visibility === "PUBLIC") return { allowed: true };

    // BUYERS visibility = check buyer relationship
    if (media.visibility === "BUYERS") {
      const isBuyer = await checkBuyerRelationship(media, actor);
      if (isBuyer) return { allowed: true };
    }

    // Check explicit sharing grants
    const hasGrant = await checkSharingGrants(media, actor);
    if (hasGrant) return { allowed: true };

    return { allowed: false };
  }

  return { allowed: false };
}
```

### 7.3 Visibility Change Endpoint

**Route: `PATCH /api/v1/media/:storageKey/visibility`**

```typescript
interface VisibilityChangeRequest {
  visibility: "PRIVATE" | "BUYERS" | "PUBLIC";
}

async function changeVisibility(
  storageKey: string,
  req: VisibilityChangeRequest,
  actor: ActorContext
): Promise<void> {
  const media = await findMediaByStorageKey(storageKey);

  // Only owner can change visibility
  if (media.tenantId !== actor.tenantId) {
    throw new ForbiddenError();
  }

  // Update visibility in database (file stays in same S3 location)
  await updateMediaVisibility(storageKey, req.visibility);

  // If changing TO public, might want to warm the CDN cache
  if (req.visibility === "PUBLIC") {
    // Optional: trigger cache warming
  }

  // If changing FROM public, might want to invalidate CDN cache
  if (media.visibility === "PUBLIC" && req.visibility !== "PUBLIC") {
    await invalidateCdnCache(storageKey);
  }
}
```

---

## 8. AWS Infrastructure

### 8.1 S3 Bucket Configuration

```yaml
S3Bucket:
  Name: breederhq-assets-${environment}

  # Block ALL public access - everything goes through CloudFront or presigned
  PublicAccessBlock:
    BlockPublicAcls: true
    BlockPublicPolicy: true
    IgnorePublicAcls: true
    RestrictPublicBuckets: true

  Versioning: Enabled

  Encryption:
    SSEAlgorithm: AES256

  LifecycleRules:
    - Id: TempCleanup
      Prefix: temp/
      Status: Enabled
      Expiration:
        Days: 1

    - Id: DeleteMarkers
      Status: Enabled
      ExpiredObjectDeleteMarker: true

    - Id: OldVersions
      Status: Enabled
      NoncurrentVersionExpiration:
        Days: 30

  CorsConfiguration:
    CorsRules:
      - AllowedOrigins:
          - https://app.breederhq.com
          - https://portal.breederhq.com
          - https://marketplace.breederhq.com
          - http://localhost:*
        AllowedMethods: [GET, PUT, HEAD]
        AllowedHeaders: [Content-Type, Content-Length, x-amz-*]
        ExposeHeaders: [ETag]
        MaxAgeSeconds: 3600
```

### 8.2 CloudFront Distribution

```yaml
CloudFrontDistribution:
  Origins:
    - Id: S3Origin
      DomainName: breederhq-assets-${env}.s3.${region}.amazonaws.com
      OriginAccessControl:
        Enabled: true
        SigningBehavior: always
        SigningProtocol: sigv4
        OriginAccessControlOriginType: s3

  DefaultCacheBehavior:
    ViewerProtocolPolicy: redirect-to-https
    AllowedMethods: [GET, HEAD]
    CachedMethods: [GET, HEAD]

    # For private files: require signed URLs
    TrustedKeyGroups:
      - !Ref CloudFrontKeyGroup

    # Caching policy
    CachePolicyId: !Ref MediaCachePolicy

    # Compress
    Compress: true

  # Custom error pages
  CustomErrorResponses:
    - ErrorCode: 403
      ResponseCode: 403
      ResponsePagePath: /errors/forbidden.html
    - ErrorCode: 404
      ResponseCode: 404
      ResponsePagePath: /errors/not-found.html

  Aliases:
    - media.breederhq.com

  ViewerCertificate:
    AcmCertificateArn: !Ref Certificate
    SslSupportMethod: sni-only
    MinimumProtocolVersion: TLSv1.2_2021

# Cache policy for media files
MediaCachePolicy:
  MinTTL: 1
  MaxTTL: 31536000  # 1 year
  DefaultTTL: 86400  # 1 day
  ParametersInCacheKeyAndForwardedToOrigin:
    EnableAcceptEncodingGzip: true
    EnableAcceptEncodingBrotli: true
    HeadersConfig:
      HeaderBehavior: none
    CookiesConfig:
      CookieBehavior: none
    QueryStringsConfig:
      QueryStringBehavior: none

# Key group for signed URLs
CloudFrontKeyGroup:
  Items:
    - !Ref CloudFrontPublicKey
```

### 8.3 IAM Policy for API Server

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ReadWrite",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::breederhq-assets-${env}/*"
    },
    {
      "Sid": "S3List",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::breederhq-assets-${env}"
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::${account}:distribution/${distributionId}"
    }
  ]
}
```

---

## 9. Implementation Phases

### Phase 1: Infrastructure Setup
1. Create S3 bucket with configuration above
2. Set up CloudFront distribution with OAC
3. Configure CloudFront key pairs for signed URLs
4. Set up DNS for media.breederhq.com
5. Create IAM roles and policies

### Phase 2: API Implementation
1. Create `src/services/media-storage.ts` - Core S3/CloudFront operations
2. Create `src/services/media-access.ts` - Access control logic
3. Create `src/routes/media.ts` - Upload/access endpoints
4. Add `Media` table migration
5. Migrate existing `marketplace-image-upload.ts` to use new service

### Phase 3: Provider Integration
1. Update marketplace listing forms to use new upload flow
2. Update provider profile forms
3. Migrate existing provider images (one-time script)

### Phase 4: Tenant Integration
1. Create upload components for animal photos/documents
2. Add visibility toggles to document management UI
3. Integrate with existing Document/Attachment models
4. Create document viewer with access validation

### Phase 5: Sharing Integration
1. Implement cross-tenant access checks (AnimalShare, etc.)
2. Add portal access for buyers (BUYERS visibility)
3. Test all access patterns across surfaces

---

## 10. Security Considerations

### 10.1 Key Security Properties

| Property | Implementation |
|----------|----------------|
| **Tenant Isolation** | Separate S3 prefixes (`tenants/{tenantId}/`) + DB validation |
| **Provider Isolation** | Separate S3 prefixes (`providers/{providerId}/`) + DB validation |
| **No Direct S3 Access** | Bucket blocks public access; all access via CloudFront or presigned |
| **Time-Limited Access** | Presigned URLs expire (15min upload, 1hr download) |
| **Audit Trail** | Media table tracks all uploads with timestamp and user |
| **Encryption at Rest** | S3 SSE-AES256 |
| **Encryption in Transit** | HTTPS only (CloudFront TLS 1.2+) |

### 10.2 Access Validation Checklist

Every file access request MUST:
1. Authenticate the requester (session cookie validation)
2. Determine owner type from storage key (provider or tenant)
3. Verify requester has relationship to owner OR file is PUBLIC
4. For non-public files, validate specific grant (buyer, share, etc.)
5. Return signed URL with appropriate expiry

---

## 11. Cost Estimation

### Monthly Cost at Various Scales

| Scale | Providers | Tenants | Storage | Bandwidth | Est. Cost |
|-------|-----------|---------|---------|-----------|-----------|
| MVP | 50 | 100 | 50 GB | 200 GB | ~$25/mo |
| Growth | 500 | 1,000 | 500 GB | 2 TB | ~$200/mo |
| Scale | 5,000 | 10,000 | 5 TB | 20 TB | ~$1,800/mo |

**Cost Breakdown (Growth tier):**
- S3 Storage: 500 GB × $0.023 = $11.50
- S3 Requests: ~$5
- CloudFront Transfer: 2 TB × $0.085 = $170
- CloudFront Requests: ~$10
- **Total: ~$200/month**

---

## 12. Quick Reference

### Storage Key Patterns

```
# Standalone marketplace service provider files (non-subscribers only)
providers/{providerId}/profile/logo/{uuid}.jpg
providers/{providerId}/profile/banner/{uuid}.jpg
providers/{providerId}/listings/{listingId}/{uuid}.jpg
providers/{providerId}/credentials/{uuid}.pdf

# BreederHQ tenant/subscriber files (includes ALL marketplace + breeding files)
tenants/{tenantId}/animals/{animalId}/photos/{uuid}.jpg
tenants/{tenantId}/animals/{animalId}/documents/{documentId}/{uuid}.pdf
tenants/{tenantId}/offspring/{groupId}/photos/{uuid}.jpg
tenants/{tenantId}/contracts/{contractId}/{uuid}.pdf
tenants/{tenantId}/finance/invoices/{invoiceId}/{uuid}.pdf
tenants/{tenantId}/services/{listingId}/{uuid}.jpg      # Marketplace service listings
tenants/{tenantId}/credentials/{uuid}.pdf               # Provider credentials
tenants/{tenantId}/profile/logo/{uuid}.jpg

# Temporary uploads
temp/provider/{providerId}/{sessionId}/{uuid}.jpg
temp/tenant/{tenantId}/{sessionId}/{uuid}.jpg
```

### Ownership Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  Standalone Provider (no subscription)                          │
│  └── Files: providers/{providerId}/...                          │
│      └── Service listings, profile, credentials only            │
│                                                                 │
│  BreederHQ Subscriber (tenant)                                  │
│  └── Files: tenants/{tenantId}/...                              │
│      └── Everything: animals, offspring, contracts, finance,   │
│          AND marketplace listings (services, credentials)       │
│                                                                 │
│  On Conversion: Provider → Subscriber                           │
│  └── Files migrate from providers/{pId}/ → tenants/{tId}/       │
│  └── Single namespace per subscriber going forward              │
└─────────────────────────────────────────────────────────────────┘
```

### API Endpoints

```
POST   /api/v1/media/upload-url          # Get presigned upload URL
POST   /api/v1/media/confirm             # Confirm upload completed
GET    /api/v1/media/access/:storageKey  # Get access URL (signed or CDN)
PATCH  /api/v1/media/:storageKey/visibility  # Change visibility
DELETE /api/v1/media/:storageKey         # Delete file
```

### Environment Variables

```bash
AWS_REGION=us-east-1
S3_BUCKET_NAME=breederhq-assets-production
CDN_DOMAIN=media.breederhq.com
CLOUDFRONT_KEY_PAIR_ID=KXXXXXXXXXXXXX
CLOUDFRONT_PRIVATE_KEY_PATH=/secrets/cloudfront-private-key.pem
```

---

*Document Version: 2.0*
*Last Updated: January 2026*
*Author: S3 Architecture Review*
