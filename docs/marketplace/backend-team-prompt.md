# Backend Team: Marketplace API Gap Verification

**Date**: 2026-01-12
**Priority**: High - Blocking Frontend Implementation
**Estimated Time**: 2-4 hours

---

## Context

We've completed the UI/UX design specification for the marketplace and analyzed the existing backend APIs. After reviewing `breederhq-api/docs/marketplace-api-v2.md`, the **SERVICE marketplace is well-documented**, but the **BREEDER/ANIMAL marketplace** appears to have separate, undocumented endpoints.

**Reference Documents**:
- `breederhq-api/docs/marketplace-api-v2.md` - Service marketplace (comprehensive)
- `docs/marketplace/backend-gap-analysis.md` - Our analysis
- `docs/marketplace/marketplace-ui-ux-design-specification.md` - UI requirements

---

## What's Well-Documented (No Action Needed)

The `marketplace-api-v2.md` covers:

| Feature | Status |
|---------|--------|
| Authentication (login, register, password reset) | ✅ Documented |
| Service Listings (CRUD, publish, browse) | ✅ Documented |
| Provider Registration & Management | ✅ Documented |
| Transactions (booking, payment, refunds) | ✅ Documented |
| Messaging (threads, messages, counts) | ✅ Documented |
| Reviews (submit, respond, moderate) | ✅ Documented |
| Admin Dashboard | ✅ Documented |

---

## Gaps Requiring Documentation or Confirmation

### 1. Breeder/Animal Marketplace Endpoints

The UI design includes pages for browsing animals and breeders, but `marketplace-api-v2.md` only covers service listings.

**Questions**:
- Are there separate endpoints for animal/breeder browsing?
- Are these documented elsewhere?
- Should they be added to `marketplace-api-v2.md`?

**Expected Endpoints** (based on route exploration):
```
GET /api/v1/marketplace/breeders                    # List published breeders
GET /api/v1/marketplace/breeders/:tenantSlug        # Breeder profile detail
GET /api/v1/marketplace/breeders/:tenantSlug/messaging  # Breeder contact info
```

**For Animal Listings** (if they exist):
```
GET /api/v1/marketplace/public/animals              # Browse animals
GET /api/v1/marketplace/public/animals/:id          # Animal detail
```

**Action**: Please document these endpoints or confirm they don't exist yet.

---

### 2. Breeding Program Endpoints

**Questions**:
- How do buyers browse breeding programs?
- Is this via the breeder profile or separate endpoints?

**Expected Endpoints**:
```
GET /api/v1/marketplace/public/programs             # Browse all listed programs
GET /api/v1/marketplace/public/programs/:slug       # Program detail
```

---

### 3. Waitlist Endpoints

**Questions**:
- Waitlist routes exist in the codebase (`marketplace-waitlist.ts`) but aren't in the API docs.
- Should these be documented?

**Known Endpoints** (from code):
```
POST /api/v1/marketplace/waitlist/:tenantSlug       # Join waitlist
GET  /api/v1/marketplace/waitlist/my-requests       # My waitlist positions
POST /api/v1/marketplace/invoices/:id/checkout      # Pay deposit
```

**Action**: Add waitlist section to `marketplace-api-v2.md`

---

### 4. Saved Items / Favorites API

**Current State**: Not documented in `marketplace-api-v2.md`. The `MarketplaceSavedListing` model exists in the schema.

**Questions**:
- Do saved items routes exist?
- If not, should they be implemented?

**Required Endpoints**:
```
GET    /api/v1/marketplace/saved                    # List saved listings
POST   /api/v1/marketplace/saved                    # Save a listing
DELETE /api/v1/marketplace/saved/:listingId         # Unsave a listing
```

**Expected Response** (GET /saved):
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
        "title": "Professional Dog Training",
        "slug": "professional-dog-training",
        "coverImageUrl": "...",
        "priceCents": "7500",
        "priceType": "starting_at",
        "category": "training",
        "provider": {
          "id": 1,
          "businessName": "...",
          "averageRating": "4.80"
        }
      }
    }
  ],
  "pagination": {...}
}
```

---

### 5. Notification System

**Current State**: Only message counts are available (`GET /messages/counts`).

**Questions**:
- Is a broader notification system planned?
- Should we build with just message counts for MVP?

**UI Needs Notifications For**:
- New message received
- Waitlist status changed
- New review received
- Transaction status changed
- Listing approved/rejected (providers)

**Minimum Viable Option**:
```
GET /api/v1/marketplace/notifications/counts
```
Response:
```json
{
  "ok": true,
  "counts": {
    "unreadMessages": 3,
    "pendingReviews": 1,
    "waitlistUpdates": 2,
    "total": 6
  }
}
```

**Recommendation**: Option A (virtual aggregator) is sufficient for MVP.

---

### 6. Buyer Profile Endpoint

**Current State**: `PUT /profile` exists but `GET /profile` isn't documented for buyers.

**Questions**:
- How does a buyer retrieve their own profile?
- Is this via `GET /auth/me`?

---

## Summary Table

| Item | In API Docs? | Action Needed |
|------|--------------|---------------|
| Service Listings | ✅ Yes | None |
| Provider Management | ✅ Yes | None |
| Transactions | ✅ Yes | None |
| Messaging | ✅ Yes | None |
| Reviews | ✅ Yes | None |
| **Breeder/Animal Browse** | ❌ No | Document or confirm doesn't exist |
| **Programs Browse** | ❌ No | Document or confirm doesn't exist |
| **Waitlist** | ❌ No | Document existing routes |
| **Saved Items** | ❌ No | Implement or document |
| **Notifications** | ⚠️ Partial | Implement counts endpoint |
| **Buyer Profile GET** | ⚠️ Unclear | Clarify |

---

## Response Format

Please respond with:

```markdown
## Breeder/Animal Endpoints
- Status: [Exist at X / Do not exist / Will implement]
- Documentation: [Will add to marketplace-api-v2.md / Separate doc]

## Programs Browse
- Status: [How it works / Doesn't exist]

## Waitlist
- Will document: [Yes/No]
- ETA: [Date]

## Saved Items
- Status: [Exists / Will implement by DATE / Not planned]

## Notifications
- Decision: [Counts endpoint / Full system / Defer]

## Buyer Profile
- GET endpoint: [Use /auth/me / Separate endpoint]
```

---

## Timeline

Frontend implementation is ready to begin. These clarifications will:
1. Complete the API-to-Component mapping
2. Unblock frontend development
3. Ensure we don't build UI for non-existent APIs

**Requested Response By**: [DATE]

---

*Generated from marketplace UI/UX design specification analysis*
*Updated after reviewing marketplace-api-v2.md*
