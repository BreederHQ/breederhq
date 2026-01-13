# Marketplace API Gaps Response

**Date**: 2026-01-12
**From**: Backend Team
**Re**: Response to [backend-team-prompt.md](backend-team-prompt.md)

---

## Executive Summary

After reviewing the gap analysis and frontend requirements, we've verified the current backend implementation status. Good news: **most APIs already exist**. The SERVICE marketplace and BREEDER/ANIMAL marketplace are both implemented but were documented separately.

---

## Gap Resolution Summary

| Item | Status | Action Taken |
|------|--------|--------------|
| Breeder/Animal Endpoints | ✅ IMPLEMENTED | Already exists in `marketplace-breeders.ts` |
| Programs Browse | ✅ IMPLEMENTED | Via breeder profile (embedded programs) |
| Waitlist | ✅ IMPLEMENTED | Documented below |
| Saved Items | ✅ IMPLEMENTED | Full CRUD in `marketplace-saved.ts` |
| Notifications | ✅ IMPLEMENTED | Counts endpoint in `marketplace-notifications.ts` |
| Buyer Profile GET | ✅ CLARIFIED | Use `/auth/me` endpoint |

---

## 1. Breeder/Animal Endpoints

**Status**: ✅ IMPLEMENTED - Routes exist in `marketplace-breeders.ts`

### Available Endpoints

```
GET /api/v1/marketplace/breeders                    # List published breeders
GET /api/v1/marketplace/breeders/:tenantSlug        # Breeder profile detail
GET /api/v1/marketplace/breeders/:tenantSlug/messaging  # Get messaging party ID
```

### GET /breeders - List Published Breeders

**Query Parameters:**
- `limit`: Number of items (default: 24, max: 50)
- `offset`: Pagination offset (default: 0)

**Response:**
```json
{
  "items": [
    {
      "tenantSlug": "happy-paws-kennel",
      "businessName": "Happy Paws Kennel",
      "location": "Denver, CO",
      "publicLocationMode": "city_state",
      "city": "Denver",
      "state": "CO",
      "zip": null,
      "breeds": [
        { "name": "Golden Retriever", "species": "dog" },
        { "name": "Labrador Retriever", "species": "dog" }
      ],
      "logoAssetId": "asset_abc123"
    }
  ],
  "total": 42
}
```

### GET /breeders/:tenantSlug - Breeder Profile Detail

**Response:**
```json
{
  "tenantSlug": "happy-paws-kennel",
  "businessName": "Happy Paws Kennel",
  "bio": "Family-owned kennel since 2010...",
  "logoAssetId": "asset_abc123",
  "publicLocationMode": "city_state",
  "location": {
    "city": "Denver",
    "state": "CO",
    "zip": null,
    "country": "US"
  },
  "website": "https://happypawskennel.com",
  "socialLinks": {
    "instagram": "happypawskennel",
    "facebook": "HappyPawsKennelDenver"
  },
  "breeds": [
    { "name": "Golden Retriever", "species": "dog" }
  ],
  "programs": [
    {
      "name": "Golden Retriever Program",
      "description": "Our flagship breeding program...",
      "acceptInquiries": true,
      "openWaitlist": true,
      "comingSoon": false
    }
  ],
  "standardsAndCredentials": {
    "registrations": ["AKC", "OFA"],
    "healthPractices": ["Annual health testing", "Genetic screening"],
    "breedingPractices": ["Limited litters per year"],
    "carePractices": ["Puppies raised in home"],
    "registrationsNote": null,
    "healthNote": null,
    "breedingNote": null,
    "careNote": null
  },
  "placementPolicies": {
    "requireApplication": true,
    "requireInterview": true,
    "requireContract": true,
    "hasReturnPolicy": true,
    "offersSupport": true,
    "note": "Lifetime support included"
  },
  "publishedAt": "2026-01-10T15:30:00Z",
  "businessHours": {
    "monday": { "enabled": true, "open": "09:00", "close": "17:00" },
    "tuesday": { "enabled": true, "open": "09:00", "close": "17:00" },
    "wednesday": { "enabled": true, "open": "09:00", "close": "17:00" },
    "thursday": { "enabled": true, "open": "09:00", "close": "17:00" },
    "friday": { "enabled": true, "open": "09:00", "close": "17:00" },
    "saturday": { "enabled": false, "open": "", "close": "" },
    "sunday": { "enabled": false, "open": "", "close": "" }
  },
  "timeZone": "America/Denver",
  "quickResponderBadge": true
}
```

### GET /breeders/:tenantSlug/messaging - Get Messaging Info

**Requires**: Authentication

**Response:**
```json
{
  "tenantId": 123,
  "tenantSlug": "happy-paws-kennel",
  "businessName": "Happy Paws Kennel",
  "partyId": 456,
  "partyName": "Happy Paws Kennel"
}
```

---

## 2. Programs Browse

**Status**: ✅ IMPLEMENTED - Programs are embedded in breeder profiles

### How It Works

Programs are returned as part of the breeder profile response (see `programs` array above). This design choice was intentional:

1. **Discovery Path**: Users browse breeders → view breeder profile → see programs
2. **Context**: Programs make more sense when viewed with breeder info (credentials, policies)
3. **Performance**: Single API call gets breeder + programs together

### If Separate Program Browse Is Needed

The current architecture supports adding standalone program endpoints if needed:

```
GET /api/v1/marketplace/public/programs              # Would aggregate all listed programs
GET /api/v1/marketplace/public/programs/:programId   # Program detail with breeder context
```

**Recommendation**: Start with embedded approach. Add standalone if user research shows need.

---

## 3. Waitlist Endpoints

**Status**: ✅ IMPLEMENTED - Full implementation in `marketplace-waitlist.ts`

### Available Endpoints

```
POST /api/v1/marketplace/waitlist/:tenantSlug       # Join waitlist
GET  /api/v1/marketplace/waitlist/my-requests       # My waitlist positions
POST /api/v1/marketplace/invoices/:id/checkout      # Pay deposit invoice
```

### POST /waitlist/:tenantSlug - Join Waitlist

**Requires**: Authentication

**Request Body:**
```json
{
  "programName": "Golden Retriever Program",
  "message": "We're interested in a female puppy...",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+15551234567",
  "origin": {
    "source": "direct",
    "pagePath": "/breeders/happy-paws-kennel",
    "programSlug": "golden-retriever-program"
  }
}
```

**Response:**
```json
{
  "success": true,
  "entryId": 789
}
```

### GET /waitlist/my-requests - My Waitlist Positions

**Requires**: Authentication

**Response:**
```json
{
  "requests": [
    {
      "id": 789,
      "status": "pending",
      "statusDetail": "INQUIRY",
      "breederName": "Happy Paws Kennel",
      "breederSlug": "happy-paws-kennel",
      "programName": "Golden Retriever Program",
      "submittedAt": "2026-01-12T10:00:00Z",
      "approvedAt": null,
      "rejectedAt": null,
      "rejectedReason": null,
      "invoice": null
    },
    {
      "id": 456,
      "status": "approved",
      "statusDetail": "DEPOSIT_DUE",
      "breederName": "Mountain View Dogs",
      "breederSlug": "mountain-view-dogs",
      "programName": "Labrador Program",
      "submittedAt": "2026-01-05T14:00:00Z",
      "approvedAt": "2026-01-08T09:00:00Z",
      "rejectedAt": null,
      "rejectedReason": null,
      "invoice": {
        "id": 123,
        "status": "pending",
        "totalCents": 50000,
        "paidCents": 0,
        "balanceCents": 50000,
        "dueAt": "2026-01-15T00:00:00Z"
      }
    }
  ]
}
```

### POST /invoices/:id/checkout - Pay Deposit

**Requires**: Authentication

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

## 4. Saved Items / Favorites API

**Status**: ✅ IMPLEMENTED - Full CRUD in `marketplace-saved.ts`

### Available Endpoints

```
GET    /api/v1/marketplace/saved                    # List saved listings
POST   /api/v1/marketplace/saved                    # Save a listing
DELETE /api/v1/marketplace/saved/:listingId         # Unsave a listing
GET    /api/v1/marketplace/saved/check/:listingId   # Check if saved (bonus)
```

### GET /saved - List Saved Listings

**Requires**: Authentication

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 25, max: 100)

**Response:**
```json
{
  "ok": true,
  "items": [
    {
      "id": 1,
      "listingId": 123,
      "savedAt": "2026-01-12T10:00:00Z",
      "listing": {
        "id": 123,
        "slug": "professional-dog-training",
        "title": "Professional Dog Training",
        "description": "Experienced trainer offering obedience...",
        "category": "training",
        "subcategory": "obedience",
        "priceCents": "7500",
        "priceType": "starting_at",
        "priceText": null,
        "coverImageUrl": "https://...",
        "city": "Denver",
        "state": "CO",
        "status": "published",
        "isAvailable": true,
        "provider": {
          "id": 1,
          "businessName": "Elite Dog Training",
          "averageRating": "4.80",
          "totalReviews": 24,
          "verifiedProvider": true
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 3,
    "totalPages": 1
  }
}
```

### POST /saved - Save a Listing

**Requires**: Authentication

**Request Body:**
```json
{
  "listingId": 123
}
```

**Response (201):**
```json
{
  "ok": true,
  "saved": {
    "id": 1,
    "listingId": 123,
    "savedAt": "2026-01-12T10:00:00Z"
  },
  "message": "Listing saved successfully."
}
```

**Error (409 - Already Saved):**
```json
{
  "error": "already_saved",
  "message": "Listing is already saved."
}
```

### DELETE /saved/:listingId - Unsave a Listing

**Requires**: Authentication

**Response:**
```json
{
  "ok": true,
  "message": "Listing removed from saved items."
}
```

### GET /saved/check/:listingId - Check if Saved

**Requires**: Authentication

**Response:**
```json
{
  "ok": true,
  "saved": true
}
```

---

## 5. Notification System

**Status**: ✅ IMPLEMENTED - Counts endpoint in `marketplace-notifications.ts`

### Available Endpoints

```
GET /api/v1/marketplace/notifications/counts
```

### GET /notifications/counts - Aggregated Counts

**Requires**: Authentication

**Response (Buyer):**
```json
{
  "ok": true,
  "counts": {
    "unreadMessages": 3,
    "pendingReviews": 1,
    "total": 4
  }
}
```

**Response (Provider):**
```json
{
  "ok": true,
  "counts": {
    "unreadMessages": 3,
    "pendingReviews": 1,
    "pendingTransactions": 2,
    "newInquiries": 5,
    "total": 11
  }
}
```

### Notification Types Covered

| Type | Source | Description |
|------|--------|-------------|
| `unreadMessages` | Message threads | Threads with unread messages from other party |
| `pendingReviews` | Completed transactions | Transactions without buyer review |
| `pendingTransactions` | Transactions (provider only) | Bookings awaiting provider action |
| `newInquiries` | Message threads (provider only) | New inquiries not yet responded to |

### Future Enhancement (Not Blocking)

Full notification list endpoint could be added later:
```
GET /api/v1/marketplace/notifications          # List individual notifications
PATCH /api/v1/marketplace/notifications/:id/read  # Mark as read
```

**Recommendation**: Current counts endpoint is sufficient for MVP badge display.

---

## 6. Buyer Profile GET Endpoint

**Status**: ✅ CLARIFIED - Use `/auth/me`

### How It Works

Buyer profile data is returned via the existing auth endpoint:

```
GET /api/v1/marketplace/auth/me
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": 123,
    "email": "buyer@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "userType": "buyer",
    "avatarUrl": null,
    "phoneNumber": "+15551234567",
    "createdAt": "2026-01-01T00:00:00Z"
  },
  "provider": null
}
```

For providers, the response includes provider details:
```json
{
  "ok": true,
  "user": { ... },
  "provider": {
    "id": 456,
    "businessName": "Elite Dog Training",
    "verifiedProvider": true,
    "averageRating": "4.80",
    "totalReviews": 24
  }
}
```

---

## Animal Listings Note

**Current Status**: Animals are managed through the tenant (breeder) routes, not marketplace-specific routes.

The UI design includes animal browsing, but animals are currently:
1. Created/managed via tenant animal routes (`/api/v1/animals/...`)
2. Listed for sale via `AnimalPublicListing` model
3. Browsed via program/breeder context

**If Public Animal Browse Is Needed:**

```
GET /api/v1/marketplace/public/animals              # Not implemented
GET /api/v1/marketplace/public/animals/:id          # Not implemented
```

**Recommendation**: Defer standalone animal browse. Current flow is:
1. Browse breeders → View breeder profile → See programs → See available animals

This provides better context and trust signals than anonymous animal listings.

---

## Summary: What's Ready for Frontend

| Feature | Endpoint | Ready? |
|---------|----------|--------|
| Browse Breeders | `GET /breeders` | ✅ |
| Breeder Profile | `GET /breeders/:slug` | ✅ |
| Contact Breeder | `GET /breeders/:slug/messaging` | ✅ |
| Join Waitlist | `POST /waitlist/:slug` | ✅ |
| My Waitlist Positions | `GET /waitlist/my-requests` | ✅ |
| Pay Deposit | `POST /invoices/:id/checkout` | ✅ |
| Save Listing | `POST /saved` | ✅ |
| Unsave Listing | `DELETE /saved/:id` | ✅ |
| List Saved | `GET /saved` | ✅ |
| Check Saved | `GET /saved/check/:id` | ✅ |
| Notification Badge | `GET /notifications/counts` | ✅ |
| Current User | `GET /auth/me` | ✅ |

---

## Documentation Update

All endpoints above will be added to `marketplace-api-v2.md` in a new "Breeder/Animal Marketplace" section.

---

*Response generated: 2026-01-12*
*Backend Team*
