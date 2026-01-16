# Service Provider Portal - Backend Implementation Status

**Date:** January 16, 2026
**Backend Developer:** Working Session

---

## ✅ COMPLETED

### 1. Database Schema Updates
**File:** `breederhq-api/prisma/schema.prisma`

**Added Models:**
- ✅ `MarketplaceServiceTag` - Service tags (marketplace-wide)
- ✅ `MarketplaceServiceTagAssignment` - Junction table for listing-tag assignments
- ✅ `MarketplaceListingReport` - Abuse reporting system
- ✅ `StripeIdentitySession` - Identity verification tracking
- ✅ `AdminActionLog` - Audit trail for admin actions

**Updated Models:**
- ✅ `MarketplaceServiceListing` - Added `customServiceType`, `flagged`, `flaggedAt` fields

**Location:** Lines 7507-7637 in schema.prisma

---

### 2. Service Tags API ✅
**File:** `breederhq-api/src/routes/marketplace-service-tags.ts` (NEW)

**Endpoints Implemented:**
- ✅ `GET /api/v1/marketplace/service-tags` - List and search tags
  - Query params: `q` (search), `suggested` (filter), `limit` (pagination)
  - Sorting: suggested first, then by usage count, then alphabetically
  - Case-insensitive search

- ✅ `POST /api/v1/marketplace/service-tags` - Create new tag
  - Auto-generates URL-safe slug
  - Checks for duplicates (case-insensitive)
  - Validates name length (1-100 chars)
  - Sets initial usage_count = 0, suggested = false

**Features:**
- Rate limiting: 60 req/min (GET), 10 req/min (POST)
- Slug generation: lowercase, hyphens, no special chars
- Duplicate checking by slug
- Error handling with detailed messages

**Registered:** Line 575 in server.ts

---

### 3. S3 Image Upload API ✅
**File:** `breederhq-api/src/routes/marketplace-image-upload.ts` (NEW)

**Endpoints Implemented:**
- ✅ `POST /api/v1/marketplace/images/upload-url` - Generate presigned S3 URL
  - Request: `{ filename, contentType, context }`
  - Response: `{ uploadUrl, cdnUrl, key, expiresIn }`
  - Validates image types (JPEG, PNG, WebP, HEIC)
  - Validates context (service_listing, profile_photo, breeding_animal)
  - Generates unique S3 key: `{context}/{userId}/{uuid}.{ext}`
  - Presigned URL expires in 5 minutes

- ✅ `DELETE /api/v1/marketplace/images/:key` - Delete image from S3
  - Ownership verification (key must contain userId)
  - URL-decodes key parameter

**Features:**
- AWS S3 SDK integration
- UUID-based unique filenames
- Ownership-based access control
- Rate limiting: 20 req/min (upload), 10 req/min (delete)
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`, `CDN_DOMAIN`

**Registered:** Line 576 in server.ts

---

## 🟡 IN PROGRESS / NEEDS UPDATE

### 4. Service Listings API (Needs Updates)
**File:** `breederhq-api/src/routes/marketplace-listings.ts` (EXISTS - 1081 lines)

**What Needs to Be Added:**

#### A. Create/Update Listing Handlers
Need to support new fields:
- `customServiceType` (string, max 50 chars) - Only for category "other"
- `tagIds` (number[]) - Array of tag IDs to assign
- `images` (string[]) - Array of image URLs (existing field, verify it works)

#### B. Tag Assignment Logic
On create/update with `tagIds`:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create/update listing
  const listing = await tx.marketplaceServiceListing.create({...});

  // 2. Delete existing tag assignments
  await tx.marketplaceServiceTagAssignment.deleteMany({
    where: { listingId: listing.id }
  });

  // 3. Create new tag assignments
  if (tagIds && tagIds.length > 0) {
    await tx.marketplaceServiceTagAssignment.createMany({
      data: tagIds.map(tagId => ({
        listingId: listing.id,
        tagId,
      }))
    });

    // 4. Increment usage counts
    await tx.marketplaceServiceTag.updateMany({
      where: { id: { in: tagIds } },
      data: { usageCount: { increment: 1 } }
    });
  }
});
```

#### C. Response DTO Updates
Need to include tags in listing responses:
```typescript
function toListingDTO(listing: any): any {
  return {
    // ... existing fields ...
    customServiceType: listing.customServiceType,
    tags: listing.assignments?.map((a: any) => ({
      id: a.tag.id,
      name: a.tag.name,
      slug: a.tag.slug,
    })) || [],
    images: listing.images || [],
  };
}
```

#### D. Query Modifications
Need to include tags in queries:
```typescript
const listing = await prisma.marketplaceServiceListing.findUnique({
  where: { id },
  include: {
    assignments: {
      include: { tag: true }
    }
  }
});
```

**Validation Rules:**
- Max 5 tags per listing
- customServiceType only allowed when category === "other"
- customServiceType max length: 50 chars
- images array max length: 10 URLs
- All image URLs must be valid HTTPS URLs

---

## ❌ NOT STARTED

### 5. Service Detail API
**File:** NEW - Needs to be created or added to existing listings file

**Endpoint Needed:**
```
GET /api/v1/marketplace/services/:slugOrId
```

**Implementation:**
- Support both slug and numeric ID routing
- Return public view with provider contact info
- Increment view count (async, non-blocking)
- Include populated tags array
- Include provider info (email, phone, website)

**Response Example:**
```json
{
  "id": 42,
  "slug": "equine-massage-therapy-austin-tx",
  "title": "Equine Massage Therapy",
  "customServiceType": "Equine Massage Therapy",
  "tags": [
    { "id": 1, "name": "Horse Care", "slug": "horse-care" }
  ],
  "images": ["https://cdn..."],
  "provider": {
    "type": "service_provider",
    "id": 123,
    "name": "Sarah's Equine Services",
    "email": "sarah@example.com",
    "phone": "+1234567890",
    "website": "https://example.com"
  }
}
```

---

### 6. Abuse Reporting API
**File:** NEW - `breederhq-api/src/routes/marketplace-abuse-reports.ts`

**Endpoint Needed:**
```
POST /api/v1/marketplace/listings/report
```

**Implementation:**
- Validate reason enum (FRAUD, SPAM, INAPPROPRIATE, MISLEADING, PROHIBITED, COPYRIGHT, OTHER)
- Validate description (20-1000 chars)
- Rate limiting: 5 reports per user per hour
- Auto-flag logic: Set `flagged = true` on listing if 3+ reports in 24 hours
- Send admin notification (email/Slack webhook)
- Create record in `MarketplaceListingReport` table

**Request:**
```json
{
  "listingId": 42,
  "reason": "FRAUD",
  "description": "This listing is promoting a scam service with fake credentials"
}
```

**Response:**
```json
{
  "ok": true,
  "reportId": 123
}
```

---

### 7. Identity Verification API
**File:** NEW - `breederhq-api/src/routes/marketplace-identity-verification.ts`

**Endpoints Needed:**
```
POST /api/v1/marketplace/identity/verify
POST /api/webhooks/stripe/identity
```

**Implementation:**

#### A. Start Verification
- Check 2FA is enabled (prerequisite)
- Check if verification already in progress (return existing session)
- Check if already verified (return error)
- Create Stripe Identity Verification Session
- Store session in `StripeIdentitySession` table
- Return client secret to frontend

#### B. Webhook Handler
- Verify Stripe webhook signature
- Handle events:
  - `identity.verification_session.verified` - Update user status, upgrade tier
  - `identity.verification_session.requires_input` - Mark as needs attention
  - `identity.verification_session.canceled` - Mark as canceled
- Update `StripeIdentitySession` status
- Update `MarketplaceProvider` identity fields
- Send success notification email

**Environment Variables Needed:**
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_IDENTITY_WEBHOOK_SECRET`

---

### 8. Admin Moderation Queue API
**File:** NEW - `breederhq-api/src/routes/marketplace-admin-moderation.ts`

**Endpoints Needed:**
```
GET /api/v1/marketplace/admin/listing-reports
PUT /api/v1/marketplace/admin/listing-reports/:reportId
```

**Implementation:**

#### A. Get Listing Reports
- Require admin role authorization
- Query params: `status`, `limit`, `offset`
- Join with listings and users tables
- Mask reporter email for privacy (`u***@example.com`)
- Return paginated results

#### B. Update Report Status
- Require admin role authorization
- Validate status enum (PENDING, REVIEWED, ACTIONED, DISMISSED)
- Require review notes (not empty, max 2000 chars)
- Update report record
- Log action in `AdminActionLog` table

**Admin Authorization:**
```typescript
// Check if user has admin role
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { role: true }
});

if (user?.role !== 'ADMIN') {
  return reply.status(403).send({
    error: 'forbidden',
    message: 'Admin access required'
  });
}
```

---

## 📋 TESTING CHECKLIST

### Service Tags API
- [x] GET tags without filters returns all tags
- [x] GET tags with search query filters by name
- [x] GET tags with suggested=true filters correctly
- [x] POST creates tag with valid name
- [x] POST rejects duplicate tag (case-insensitive)
- [x] POST validates name length
- [x] Slug generation works correctly
- [ ] Rate limiting enforced

### S3 Image Upload API
- [x] POST generates valid presigned URL
- [x] POST validates content type
- [x] POST validates context
- [x] POST generates unique S3 keys
- [x] DELETE requires authentication
- [x] DELETE verifies ownership
- [ ] Rate limiting enforced
- [ ] S3 bucket CORS configured
- [ ] CDN domain configured

### Service Listings API (Pending Updates)
- [ ] Create listing with tagIds assigns tags
- [ ] Create listing increments tag usage counts
- [ ] Update listing with tagIds updates assignments
- [ ] Update listing decrements removed tag counts
- [ ] customServiceType only allowed for category "other"
- [ ] Validates max 5 tags per listing
- [ ] Validates max 10 images per listing
- [ ] Response includes populated tags array
- [ ] Response includes images array

### Service Detail API (Not Started)
- [ ] GET by slug returns listing
- [ ] GET by ID returns listing
- [ ] GET returns provider contact info
- [ ] GET increments view count (async)
- [ ] GET includes populated tags
- [ ] GET handles not found gracefully

### Abuse Reporting API (Not Started)
- [ ] POST creates report with valid data
- [ ] POST validates reason enum
- [ ] POST validates description length
- [ ] POST enforces rate limit (5/hour)
- [ ] Auto-flag triggers at 3 reports in 24h
- [ ] Admin notification sent
- [ ] Handles not found listing

### Identity Verification API (Not Started)
- [ ] POST requires 2FA enabled
- [ ] POST returns existing session if pending
- [ ] POST creates Stripe session
- [ ] POST stores session in database
- [ ] Webhook verifies signature
- [ ] Webhook updates user status on verified
- [ ] Webhook upgrades tier correctly
- [ ] Webhook sends email notification

### Admin Moderation API (Not Started)
- [ ] GET requires admin role
- [ ] GET returns paginated reports
- [ ] GET masks reporter emails
- [ ] GET filters by status work
- [ ] PUT requires admin role
- [ ] PUT validates status enum
- [ ] PUT requires review notes
- [ ] PUT logs admin action
- [ ] PUT returns 404 for invalid report ID

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

Add to `.env`:

```bash
# AWS S3 (for image uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=breederhq-assets
CDN_DOMAIN=cdn.breederhq.com

# Stripe Identity (for verification)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_...

# Marketplace URL (for Stripe redirect)
MARKETPLACE_URL=https://marketplace.breederhq.com
```

---

## 📝 DATABASE MIGRATIONS NEEDED

**Note:** You mentioned you handle all database migrations.

**Migration Name:** `add_service_provider_portal_tables`

**Models to Create:**
1. `marketplace.service_tags`
2. `marketplace.service_tag_assignments`
3. `marketplace.listing_reports`
4. `marketplace.stripe_identity_sessions`
5. `marketplace.admin_action_logs`

**Columns to Add:**
- `marketplace.service_listings.custom_service_type` (VARCHAR(50))
- `marketplace.service_listings.flagged` (BOOLEAN DEFAULT false)
- `marketplace.service_listings.flagged_at` (TIMESTAMP)

**Indexes to Create:**
- `service_tags(suggested)`
- `service_tags(usage_count DESC)`
- `service_tags(name)`
- `listing_reports(status)`
- `listing_reports(created_at DESC)`
- `stripe_identity_sessions(user_id)`
- `stripe_identity_sessions(status)`
- `admin_action_logs(created_at DESC)`

---

## 🚀 DEPLOYMENT STEPS

1. **Database Migration**
   - Run migration to create new tables and columns
   - Verify schema changes applied successfully

2. **Environment Variables**
   - Add AWS credentials and S3 bucket info
   - Add Stripe Identity credentials
   - Configure CDN domain

3. **S3 Bucket Setup**
   - Create bucket if not exists
   - Configure bucket policy (public read)
   - Configure CORS for browser uploads

4. **Stripe Identity Setup**
   - Configure webhook endpoint
   - Subscribe to verification events
   - Copy webhook signing secret

5. **Deploy Backend**
   - Deploy updated API with new routes
   - Verify routes registered correctly
   - Test authentication middleware

6. **Testing**
   - Run integration tests
   - Test S3 upload flow end-to-end
   - Test Stripe Identity flow
   - Test admin moderation queue

---

## 📞 NEXT STEPS

### Immediate (Phase 1)
1. ✅ Complete database migration
2. ⏳ Update Service Listings API for tags/images
3. ⏳ Implement Service Detail API
4. ⏳ Test S3 upload flow

### Short-term (Phase 2)
5. ⏳ Implement Abuse Reporting API
6. ⏳ Implement Admin Moderation Queue API
7. ⏳ Configure S3 bucket and CORS

### Long-term (Phase 3)
8. ⏳ Implement Identity Verification API
9. ⏳ Configure Stripe webhooks
10. ⏳ End-to-end testing

---

## 📚 DOCUMENTATION REFERENCES

- **API Implementation Specs:** `breederhq-api/docs/SERVICE_PROVIDER_API_IMPLEMENTATION.md`
- **Admin Moderation Specs:** `breederhq-api/docs/ADMIN_MODERATION_API.md`
- **Frontend Complete:** `breederhq/docs/features/SERVICE_PROVIDER_PORTAL_COMPLETE.md`
- **Prisma Schema:** `breederhq-api/prisma/schema.prisma` (Lines 7507-7637)
- **Server Routes:** `breederhq-api/src/server.ts` (Lines 575-576)

---

**Status Summary:**
- ✅ 2 of 7 APIs completed (Service Tags, S3 Upload)
- 🟡 1 of 7 APIs needs updates (Service Listings)
- ❌ 4 of 7 APIs not started (Service Detail, Abuse Reports, Identity Verification, Admin Moderation)

**Estimated Remaining Work:** 6-8 hours for a senior backend developer

---

*Last Updated: January 16, 2026*
