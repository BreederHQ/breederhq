# Marketplace API Reference

Complete API documentation for the BreederHQ Marketplace module.

## Authentication

All marketplace endpoints require authentication via session cookie (`bhq_s`). Most endpoints also require CSRF token (`X-CSRF-Token` header).

## Base URL

```
Production: https://api.breederhq.com/api/v1
Development: http://localhost:3000/api/v1
```

---

## Breeding Programs API

### List Programs (Breeder Management)

```http
GET /breeding/programs
X-Tenant-Id: {tenantId}
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "slug": "goldendoodle-program",
      "name": "Goldendoodle Program",
      "species": "DOG",
      "breedText": "F1B Goldendoodle",
      "listed": true,
      "acceptInquiries": true,
      "openWaitlist": true,
      "acceptReservations": false,
      "createdAt": "2026-01-11T00:00:00.000Z",
      "_count": { "breedingPlans": 5 }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 25
}
```

### Get Program (Breeder Management)

```http
GET /breeding/programs/{id}
X-Tenant-Id: {tenantId}
```

### Create Program

```http
POST /breeding/programs
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
Content-Type: application/json

{
  "name": "Goldendoodle Program",
  "species": "DOG",
  "breedText": "F1B Goldendoodle",
  "description": "Our family-raised Goldendoodles...",
  "listed": false,
  "acceptInquiries": true,
  "openWaitlist": false,
  "pricingTiers": [
    { "tier": "Pet", "priceRange": "$2,500 - $3,000" },
    { "tier": "Breeding", "priceRange": "$4,000+" }
  ]
}
```

### Update Program

```http
PUT /breeding/programs/{id}
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
Content-Type: application/json

{
  "listed": true,
  "openWaitlist": true
}
```

### Delete Program

```http
DELETE /breeding/programs/{id}
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
```

### Browse Programs (Public)

```http
GET /marketplace/breeding-programs?species=DOG&page=1&limit=20
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search name/breed |
| species | string | Filter by species |
| breed | string | Filter by breed text |
| page | number | Page number |
| limit | number | Items per page |

---

## Breeder Services API

### List Services

```http
GET /services?status=ACTIVE&type=TRAINING
X-Tenant-Id: {tenantId}
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "listingType": "TRAINING",
      "title": "Puppy Training Classes",
      "description": "6-week obedience course...",
      "city": "Austin",
      "state": "TX",
      "country": "US",
      "priceCents": 29900,
      "priceType": "fixed",
      "status": "ACTIVE",
      "slug": "puppy-training-classes-1",
      "createdAt": "2026-01-11T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Create Service

```http
POST /services
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
Content-Type: application/json

{
  "listingType": "TRAINING",
  "title": "Puppy Training Classes",
  "description": "6-week obedience course...",
  "city": "Austin",
  "state": "TX",
  "priceCents": 29900,
  "priceType": "fixed"
}
```

### Update Service

```http
PUT /services/{id}
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
Content-Type: application/json

{
  "priceCents": 34900,
  "description": "Updated description..."
}
```

### Publish Service

```http
POST /services/{id}/publish
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
```

### Unpublish Service

```http
POST /services/{id}/unpublish
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
```

### Delete Service

```http
DELETE /services/{id}
X-Tenant-Id: {tenantId}
X-CSRF-Token: {token}
```

---

## Service Provider API

### Get Profile

```http
GET /provider/profile
```

**Response (200):**
```json
{
  "id": 1,
  "businessName": "Austin Dog Training",
  "email": "contact@austindogtraining.com",
  "phone": "512-555-0123",
  "website": "https://austindogtraining.com",
  "city": "Austin",
  "state": "TX",
  "country": "US",
  "plan": "FREE",
  "stripeCustomerId": null,
  "stripeSubscriptionId": null,
  "createdAt": "2026-01-11T00:00:00.000Z",
  "updatedAt": "2026-01-11T00:00:00.000Z",
  "listingsCount": 1,
  "activeListingsCount": 0
}
```

**Response (404):** Profile not found (user needs to complete onboarding)

### Create Profile

```http
POST /provider/profile
X-CSRF-Token: {token}
Content-Type: application/json

{
  "businessName": "Austin Dog Training",
  "email": "contact@austindogtraining.com",
  "phone": "512-555-0123",
  "website": "https://austindogtraining.com",
  "city": "Austin",
  "state": "TX"
}
```

### Update Profile

```http
PUT /provider/profile
X-CSRF-Token: {token}
Content-Type: application/json

{
  "phone": "512-555-9999",
  "website": "https://new-website.com"
}
```

### Get Dashboard

```http
GET /provider/dashboard
```

**Response:**
```json
{
  "profile": {
    "id": 1,
    "businessName": "Austin Dog Training",
    "plan": "FREE",
    "hasStripeSubscription": false
  },
  "stats": {
    "totalListings": 1,
    "activeListings": 0,
    "draftListings": 1,
    "totalViews": 0,
    "totalInquiries": 0
  },
  "limits": {
    "maxListings": 1,
    "currentListings": 1
  }
}
```

### List Provider Listings

```http
GET /provider/listings?status=ACTIVE
```

### Create Provider Listing

```http
POST /provider/listings
X-CSRF-Token: {token}
Content-Type: application/json

{
  "listingType": "TRAINING",
  "title": "Private Dog Training",
  "description": "One-on-one training sessions...",
  "city": "Austin",
  "state": "TX",
  "priceCents": 15000,
  "priceType": "starting_at"
}
```

**Error Response (403 - Limit Reached):**
```json
{
  "error": "listing_limit_reached",
  "limit": 1,
  "plan": "FREE"
}
```

### Update Provider Listing

```http
PUT /provider/listings/{id}
X-CSRF-Token: {token}
Content-Type: application/json

{
  "title": "Updated Title",
  "priceCents": 17500
}
```

### Publish Provider Listing

```http
POST /provider/listings/{id}/publish
X-CSRF-Token: {token}
```

### Unpublish Provider Listing

```http
POST /provider/listings/{id}/unpublish
X-CSRF-Token: {token}
```

### Delete Provider Listing

```http
DELETE /provider/listings/{id}
X-CSRF-Token: {token}
```

### Create Checkout Session

```http
POST /provider/billing/checkout
X-CSRF-Token: {token}
Content-Type: application/json

{
  "plan": "PREMIUM",
  "successUrl": "https://marketplace.breederhq.com/provider?upgrade=success",
  "cancelUrl": "https://marketplace.breederhq.com/provider?upgrade=cancelled"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/..."
}
```

### Create Billing Portal Session

```http
POST /provider/billing/portal
X-CSRF-Token: {token}
Content-Type: application/json

{
  "returnUrl": "https://marketplace.breederhq.com/provider"
}
```

**Response:**
```json
{
  "portalUrl": "https://billing.stripe.com/p/session/..."
}
```

---

## Marketplace Inquiries API

### Submit Inquiry

```http
POST /marketplace/inquiries
X-CSRF-Token: {token}
Content-Type: application/json

{
  "breederTenantId": 123,
  "subject": "Inquiry about Goldendoodle puppies",
  "message": "Hi, I'm interested in...",
  "listingId": 456,
  "listingType": "OFFSPRING_GROUP",
  "origin": {
    "source": "google",
    "referrer": "https://google.com/search?q=goldendoodle+puppies",
    "utmSource": null,
    "utmMedium": null,
    "utmCampaign": null,
    "pagePath": "/programs/goldendoodle-program",
    "programSlug": "goldendoodle-program"
  }
}
```

**Response:**
```json
{
  "threadId": 789,
  "success": true
}
```

---

## Waitlist API

### Join Waitlist

```http
POST /marketplace/waitlist
X-CSRF-Token: {token}
Content-Type: application/json

{
  "programId": 123,
  "notes": "Looking for a female puppy",
  "origin": {
    "source": "direct",
    "pagePath": "/programs/goldendoodle-program",
    "programSlug": "goldendoodle-program"
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Not authenticated |
| `forbidden` | 403 | Not authorized for resource |
| `not_found` | 404 | Resource not found |
| `invalid_id` | 400 | Invalid ID parameter |
| `missing_required_fields` | 400 | Required fields not provided |
| `invalid_listing_type` | 400 | Invalid listing type value |
| `listing_limit_reached` | 403 | Plan listing limit exceeded |
| `profile_not_found` | 404 | Service provider profile doesn't exist |
| `profile_already_exists` | 409 | Profile already created for user |

---

## TypeScript Types

```typescript
// Listing Types
type ListingType =
  | "OFFSPRING_GROUP"
  | "STUD_SERVICE"
  | "TRAINING"
  | "VETERINARY"
  | "PHOTOGRAPHY"
  | "GROOMING"
  | "TRANSPORT"
  | "BOARDING"
  | "PRODUCT"
  | "OTHER_SERVICE";

// Listing Status
type ListingStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "SOLD" | "EXPIRED";

// Plan Tiers
type ListingTier = "FREE" | "PREMIUM" | "BUSINESS";

// Animal Intents
type AnimalListingIntent =
  | "STUD"
  | "BROOD_PLACEMENT"
  | "REHOME"
  | "GUARDIAN"
  | "TRAINED"
  | "WORKING"
  | "STARTED"
  | "CO_OWNERSHIP";

// Price Types
type PriceType = "fixed" | "starting_at" | "contact";
```

## Rate Limiting

Currently, marketplace endpoints are not rate-limited. Future implementation will add:
- 100 requests/minute for authenticated users
- Stricter limits on inquiry submission

## Related

- [Breeding Programs](./breeding-programs.md)
- [Breeder Services](./breeder-services.md)
- [Service Provider Portal](./service-provider-portal.md)
- [Origin Tracking](./origin-tracking.md)
