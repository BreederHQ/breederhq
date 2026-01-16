# Service Provider API Requirements

This document outlines the API endpoints that need to be implemented to support the new Service Provider Portal features.

## Database Schema Updates (COMPLETED)

The following migrations have been completed:
- ✅ `custom_service_type VARCHAR(50)` column added to `marketplace_listings`
- ✅ `marketplace_service_tags` table created
- ✅ `marketplace_service_tag_assignments` junction table created
- ✅ `images JSONB` column added to `marketplace_listings`

## Required API Endpoints

### 1. Service Tags Management

#### Get Service Tags
```http
GET /api/v1/marketplace/service-tags
Query Parameters:
  - q?: string (search query)
  - suggested?: boolean (filter by suggested tags)
  - limit?: number (default: 100)

Response 200:
{
  "items": [
    {
      "id": 1,
      "name": "Obedience Training",
      "slug": "obedience-training",
      "usageCount": 42,
      "suggested": true
    }
  ],
  "total": 15
}
```

**Implementation Notes:**
- Search should be case-insensitive on `name` field
- Sort by: suggested first, then by `usageCount` DESC, then by `name` ASC
- Suggested tags are manually curated (set `suggested = true` in DB)

#### Create Service Tag
```http
POST /api/v1/marketplace/service-tags
Content-Type: application/json

Body:
{
  "name": "Canine Nutrition"
}

Response 200:
{
  "id": 16,
  "name": "Canine Nutrition",
  "slug": "canine-nutrition",
  "usageCount": 0,
  "suggested": false
}

Response 400:
{
  "error": "tag_already_exists",
  "message": "A tag with this name already exists"
}
```

**Implementation Notes:**
- Generate slug from name (lowercase, replace spaces with hyphens, remove special chars)
- Check for duplicate by slug (case-insensitive)
- Auto-trim name and validate length (1-100 chars)
- Set initial `usageCount = 0`, `suggested = false`

---

### 2. Service Listings - Extended Fields

#### Update Existing Listing Endpoints

The following existing endpoints need to support new fields:

**Fields to Add:**
- `customServiceType`: string | null
- `tagIds`: number[] (for creation/update)
- `tags`: ServiceTag[] (in responses)
- `images`: string[] (array of URLs)

**Affected Endpoints:**

```http
POST /api/v1/marketplace/service-provider/listings
PUT /api/v1/marketplace/service-provider/listings/:id
GET /api/v1/marketplace/service-provider/listings
GET /api/v1/marketplace/services (public)
```

**Example Updated Request:**
```json
{
  "listingType": "OTHER_SERVICE",
  "title": "Equine Massage Therapy",
  "description": "Professional therapeutic massage for horses...",
  "customServiceType": "Equine Massage Therapy",
  "tagIds": [1, 5, 12],
  "images": [
    "https://cdn.breederhq.com/services/abc123.jpg",
    "https://cdn.breederhq.com/services/def456.jpg"
  ],
  "city": "Austin",
  "state": "TX",
  "priceCents": 15000,
  "priceType": "starting_at"
}
```

**Example Updated Response:**
```json
{
  "id": 42,
  "listingType": "OTHER_SERVICE",
  "customServiceType": "Equine Massage Therapy",
  "title": "Equine Massage Therapy",
  "description": "Professional therapeutic massage for horses...",
  "tags": [
    { "id": 1, "name": "Horse Care", "slug": "horse-care" },
    { "id": 5, "name": "Wellness", "slug": "wellness" },
    { "id": 12, "name": "Mobile Service", "slug": "mobile-service" }
  ],
  "images": [
    "https://cdn.breederhq.com/services/abc123.jpg",
    "https://cdn.breederhq.com/services/def456.jpg"
  ],
  "city": "Austin",
  "state": "TX",
  "priceCents": 15000,
  "priceType": "starting_at",
  "status": "ACTIVE",
  "viewCount": 0,
  "inquiryCount": 0,
  "createdAt": "2026-01-16T10:00:00.000Z",
  "updatedAt": "2026-01-16T10:00:00.000Z"
}
```

**Implementation Notes:**
- When `tagIds` provided on create/update, update `marketplace_service_tag_assignments`
- Increment `usageCount` for newly assigned tags
- Decrement `usageCount` for removed tags
- Always return populated `tags` array with full tag objects
- Validate `customServiceType` is only set when `listingType === "OTHER_SERVICE"`
- Validate `customServiceType` length (1-50 chars if provided)
- Validate `images` array max length = 10
- Validate all image URLs are valid HTTPS URLs

---

### 3. Abuse Reporting System

#### Report a Service Listing
```http
POST /api/v1/marketplace/listings/report
Content-Type: application/json

Body:
{
  "listingId": 42,
  "reason": "FRAUD",
  "description": "This listing is promoting a scam service with fake credentials"
}

Response 200:
{
  "ok": true,
  "reportId": 123
}

Response 400:
{
  "error": "invalid_reason",
  "message": "Invalid report reason"
}

Response 404:
{
  "error": "listing_not_found",
  "message": "Service listing not found"
}

Response 429:
{
  "error": "rate_limit_exceeded",
  "message": "Too many reports. Please try again later."
}
```

**Valid Reason Values:**
- `FRAUD` - Fraudulent or scam listing
- `SPAM` - Spam or duplicate content
- `INAPPROPRIATE` - Inappropriate content
- `MISLEADING` - Misleading information
- `PROHIBITED` - Prohibited service
- `COPYRIGHT` - Copyright infringement
- `OTHER` - Other issue

**Implementation Notes:**
- Require authentication (marketplace session)
- Create record in `marketplace_listing_reports` table:
  ```sql
  CREATE TABLE marketplace_listing_reports (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES marketplace_listings(id) ON DELETE CASCADE,
    reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, REVIEWED, ACTIONED, DISMISSED
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- Validate `description` length (20-1000 chars)
- Rate limit: 5 reports per user per hour
- Auto-flag listing if it receives 3+ reports in 24 hours (set `flagged = true` on listing)
- Send notification to admin queue (email/Slack webhook)

#### Admin: Get Listing Reports (Optional - for future admin interface)
```http
GET /api/v1/marketplace/admin/listing-reports
Query Parameters:
  - status?: PENDING | REVIEWED | ACTIONED | DISMISSED
  - limit?: number (default: 25, max: 100)
  - offset?: number (default: 0)

Response 200:
{
  "reports": [
    {
      "id": 123,
      "listingId": 42,
      "listingTitle": "Equine Massage Therapy",
      "reason": "FRAUD",
      "description": "This listing is promoting a scam...",
      "status": "PENDING",
      "reporterEmail": "user@example.com", // masked for privacy
      "createdAt": "2026-01-16T10:00:00.000Z",
      "reviewedAt": null,
      "reviewNotes": null
    }
  ],
  "total": 15,
  "limit": 25,
  "offset": 0
}
```

---

## Frontend Expectations

The frontend is already built and expects these endpoints to:

1. **Service Tags:**
   - `getServiceTags()` calls `GET /api/v1/marketplace/service-tags`
   - `createServiceTag()` calls `POST /api/v1/marketplace/service-tags`
   - See: `apps/marketplace/src/api/client.ts:4600-4680`

2. **Extended Listings:**
   - All service listing create/update calls include new fields
   - All service listing responses should include `tags` array and `images` array
   - See: `apps/marketplace/src/api/client.ts:2800-3200`

3. **Abuse Reports:**
   - `reportServiceListing()` calls `POST /api/v1/marketplace/listings/report`
   - See: `apps/marketplace/src/api/client.ts:5290-5331`

## Testing Checklist

- [ ] Create service tag with valid name
- [ ] Create duplicate tag returns error
- [ ] Search tags by query string
- [ ] Filter tags by suggested=true
- [ ] Create listing with customServiceType (OTHER_SERVICE)
- [ ] Create listing with tagIds
- [ ] Verify usageCount increments when tag assigned
- [ ] Update listing tags (add/remove)
- [ ] Verify usageCount decrements when tag removed
- [ ] Upload service with images array
- [ ] Report listing with valid reason
- [ ] Report listing triggers auto-flag at 3 reports
- [ ] Rate limit enforced on reports
- [ ] Admin can view pending reports

## Priority

**High Priority:**
1. Service Tags endpoints (frontend actively uses)
2. Extended listing fields (frontend already sends these)
3. Abuse reporting (user safety feature)

**Medium Priority:**
4. Admin reports interface (can manage manually in DB initially)

## Notes

- All endpoints require authentication via `bhq_m_s` cookie
- Use existing CSRF token validation
- Service tags are marketplace-wide (NOT tenant-scoped)
- Images stored as JSONB array of URL strings
- Consider adding indexes on:
  - `marketplace_service_tags.slug`
  - `marketplace_service_tags.suggested`
  - `marketplace_listing_reports.status`
  - `marketplace_listing_reports.listing_id`
