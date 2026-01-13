# Marketplace Backend Gap Analysis

**Version**: 1.2
**Date**: 2026-01-12
**Updated**: After full backend codebase review
**Purpose**: Identify gaps between UI/UX design requirements and existing backend capabilities
**Status**: ✅ ALL GAPS RESOLVED - See [marketplace-api-gaps-response.md](marketplace-api-gaps-response.md)

---

## Executive Summary

After analyzing:
1. API routes (`breederhq-api/src/routes`)
2. Prisma schema (`breederhq-api/prisma/schema.prisma`)
3. **NEW**: Official API documentation (`breederhq-api/docs/marketplace-api-v2.md`)

**Key Finding**: Both the SERVICE marketplace and BREEDER marketplace APIs are fully implemented. The breeder-side APIs were in separate route files (`marketplace-breeders.ts`, `marketplace-waitlist.ts`, `marketplace-saved.ts`, `marketplace-notifications.ts`) and needed documentation. See [marketplace-api-gaps-response.md](marketplace-api-gaps-response.md) for full API documentation.

### Overall Assessment

| Category | Status | Notes |
|----------|--------|-------|
| Authentication | ✅ Complete + Documented | Full auth flow in `marketplace-api-v2.md` |
| User Profiles | ✅ Complete + Documented | MarketplaceUser + MarketplaceProvider |
| Service Listings | ✅ Complete + Documented | Full CRUD + publish in `marketplace-api-v2.md` |
| Transactions | ✅ Complete + Documented | Booking, payment, refunds in `marketplace-api-v2.md` |
| Messaging | ✅ Complete + Documented | Thread-based in `marketplace-api-v2.md` |
| Reviews | ✅ Complete + Documented | Full workflow in `marketplace-api-v2.md` |
| **Breeder Browse** | ✅ IMPLEMENTED | `marketplace-breeders.ts` - List + detail + messaging |
| **Programs** | ✅ IMPLEMENTED | Embedded in breeder profile response |
| **Waitlist** | ✅ IMPLEMENTED | `marketplace-waitlist.ts` - Join + my-requests + checkout |
| **Saved Items** | ✅ IMPLEMENTED | `marketplace-saved.ts` - Full CRUD + check |
| **Notifications** | ✅ IMPLEMENTED | `marketplace-notifications.ts` - Counts endpoint |
| **Animal Listings** | ⚠️ Via Tenant | Managed through tenant routes, browse via breeder context |

---

## Detailed Analysis

### 1. Authentication Endpoints

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Location |
|----------|---------------|---------|----------|
| `POST /auth/login` | Login page | ✅ Yes | `marketplace-auth.ts` |
| `POST /auth/register` | Register page | ✅ Yes | `marketplace-auth.ts` |
| `POST /auth/logout` | Account menu | ✅ Yes | `marketplace-auth.ts` |
| `POST /auth/forgot-password` | Password reset | ✅ Yes | `marketplace-auth.ts` |
| `POST /auth/reset-password` | Password reset confirm | ✅ Yes | `marketplace-auth.ts` |
| `POST /auth/verify-email` | Email verification | ✅ Yes | `marketplace-auth.ts` |
| `GET /marketplace/me` | Gate check | ✅ Yes | `marketplace-auth.ts` |

**Status**: ✅ **COMPLETE** - All auth endpoints exist

---

### 2. User Profile & Role Endpoints

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Location |
|----------|---------------|---------|----------|
| `GET /marketplace/me` | Current user + entitlement | ✅ Yes | `marketplace-auth.ts` |
| `GET /marketplace/profile` | Profile settings | ✅ Yes | `marketplace-profile.ts` |
| `PUT /marketplace/profile/draft` | Edit profile | ✅ Yes | `marketplace-profile.ts` |
| `POST /marketplace/profile/publish` | Publish profile | ✅ Yes | `marketplace-profile.ts` |
| `POST /providers/register` | Become provider | ✅ Yes | `marketplace-providers.ts` |

**User Type Flow**:
- `MarketplaceUser.userType` defaults to `"buyer"`
- After `POST /providers/register`, `userType` becomes `"provider"`
- Role determined by: `userType` field + existence of `MarketplaceProvider` record

**Status**: ✅ **COMPLETE** - Role management exists via provider registration

#### Missing/Needed

| Gap | Priority | Notes |
|-----|----------|-------|
| `GET /marketplace/me/roles` | Low | Can derive from existing `/me` response |
| Become Seller (Breeder) | Medium | Different from provider - needs Tenant creation |

**Action Item**: Clarify "become seller" flow for breeders vs service providers.

---

### 3. Notification Endpoints

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Notes |
|----------|---------------|---------|-------|
| `GET /notifications` | Notification list | ❌ No | No model exists |
| `GET /notifications/unread-count` | Badge count | ⚠️ Partial | Only message counts |
| `PATCH /notifications/:id/read` | Mark read | ❌ No | - |
| `POST /notifications/mark-all-read` | Clear all | ❌ No | - |

**What Exists**:
- `GET /messages/counts` - Returns unread message counts (for badge)
- No general notification system for:
  - New inquiry received
  - Waitlist status changed
  - Review received
  - Transaction status changed

**Status**: ❌ **GAP** - No notification system

#### Recommendation

**Option A (Quick)**: Derive notifications from existing data
- Unread messages → Message notifications
- Pending reviews → Review notifications
- Recent transactions → Transaction notifications
- Build "virtual" notification list from multiple sources

**Option B (Full)**: Create dedicated notification model
```prisma
model MarketplaceNotification {
  id          Int      @id @default(autoincrement())
  userId      Int      // FK to MarketplaceUser
  type        String   // "message", "inquiry", "review", "transaction", "waitlist"
  title       String
  body        String?
  resourceId  String?  // ID of related resource
  resourceUrl String?  // Deep link URL
  readAt      DateTime?
  createdAt   DateTime @default(now())

  user MarketplaceUser @relation(fields: [userId], references: [id])

  @@index([userId, readAt])
  @@schema("marketplace")
}
```

**Priority**: Medium - UI can work with message counts initially

---

### 4. Saved Items / Favorites Endpoints

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Notes |
|----------|---------------|---------|-------|
| `GET /marketplace/saved` | Saved listings page | ⚠️ Likely | Model exists, API not verified |
| `POST /marketplace/saved` | Save listing | ⚠️ Likely | Model exists |
| `DELETE /marketplace/saved/:id` | Unsave listing | ⚠️ Likely | Model exists |

**Schema Exists**:
```prisma
model MarketplaceSavedListing {
  id        Int      @id @default(autoincrement())
  userId    Int
  listingId Int
  savedAt   DateTime @default(now())

  @@unique([userId, listingId])
  @@schema("marketplace")
}
```

**Status**: ⚠️ **VERIFY** - Model exists, need to confirm API routes

**Action Item**: Check if saved items API exists in a route file I didn't see, or needs to be created.

---

### 5. Animal Listings (Breeder Listings)

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Notes |
|----------|---------------|---------|-------|
| `GET /public/animals` | Browse animals | ⚠️ Partial | Likely via tenant routes |
| `GET /public/animals/:id` | Animal detail | ⚠️ Partial | Via `AnimalPublicListing` |
| `GET /me/animals` | My listings (seller) | ⚠️ Partial | Via tenant routes |
| `POST /me/animals` | Create listing | ⚠️ Partial | Schema exists |
| `PATCH /me/animals/:id` | Edit listing | ⚠️ Partial | Schema exists |
| `POST /me/animals/:id/publish` | Publish listing | ❓ Unknown | Need to verify |

**Schemas That Exist**:
- `Animal` model with `forSale`, `inSyndication` flags
- `AnimalPublicListing` model for public marketplace profiles
- `MarketplaceListing` model (legacy/hybrid)

**Status**: ⚠️ **PARTIAL** - Schema ready, API routes may need marketplace-specific versions

**Gap Analysis**:
- Service listings have full CRUD via `marketplace-listings.ts`
- Animal listings may use different route structure (tenant-based vs marketplace-based)
- Need unified browse experience for buyers

**Action Item**:
1. Verify animal listing routes in tenant routes
2. Consider marketplace-specific animal browse endpoint

---

### 6. Programs (Breeding Programs)

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Notes |
|----------|---------------|---------|-------|
| `GET /public/programs` | Browse programs | ⚠️ Check | May exist |
| `GET /public/programs/:slug` | Program detail | ✅ Yes | Via breeder routes |
| `GET /me/programs` | My programs (seller) | ⚠️ Check | Via tenant routes |
| `POST /me/programs` | Create program | ⚠️ Check | Via tenant routes |
| `PATCH /me/programs/:id` | Edit program | ⚠️ Check | Via tenant routes |
| `POST /me/programs/:id/media` | Upload media | ⚠️ Check | May exist |

**Schema Exists**:
```prisma
model BreedingProgram {
  // ... core fields
  listed            Boolean   @default(false)
  acceptInquiries   Boolean   @default(true)
  openWaitlist      Boolean   @default(false)
  pricingTiers      Json?
  publishedAt       DateTime?
}
```

**Known Routes**:
- `GET /breeders/:tenantSlug` - Public breeder profile (includes programs)
- Programs likely managed via tenant routes, not marketplace routes

**Status**: ⚠️ **PARTIAL** - Need to map tenant program routes to marketplace UI

---

### 7. Service Listings

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Location |
|----------|---------------|---------|----------|
| `GET /public/listings` | Browse services | ✅ Yes | `marketplace-listings.ts` |
| `GET /public/listings/:slug` | Service detail | ✅ Yes | `marketplace-listings.ts` |
| `GET /listings` | My services (provider) | ✅ Yes | `marketplace-listings.ts` |
| `POST /listings` | Create service | ✅ Yes | `marketplace-listings.ts` |
| `PUT /listings/:id` | Edit service | ✅ Yes | `marketplace-listings.ts` |
| `POST /listings/:id/publish` | Publish | ✅ Yes | `marketplace-listings.ts` |
| `POST /listings/:id/unpublish` | Unpublish | ✅ Yes | `marketplace-listings.ts` |
| `DELETE /listings/:id` | Delete | ✅ Yes | `marketplace-listings.ts` |

**Status**: ✅ **COMPLETE** - Full service listing management

---

### 8. Inquiries

#### Required by UI Design | Backend Status

The UI design has an "Inquiry Inbox" - but inquiries are not a dedicated model.

**How Inquiries Work Currently**:
1. Buyer initiates contact → `MarketplaceMessageThread` created
2. If booking service → `MarketplaceTransaction` created
3. For breeders → `WaitlistEntry` with status `INQUIRY`

| Endpoint | UI Requirement | Exists? | Notes |
|----------|---------------|---------|-------|
| `GET /inquiries` | List inquiries | ⚠️ Via messages | Use message threads |
| `GET /inquiries/:id` | Inquiry detail | ⚠️ Via messages | Thread detail |
| `POST /inquiries` | Send inquiry | ⚠️ Via messages | Create thread |
| `PATCH /inquiries/:id` | Respond | ⚠️ Via messages | Send message |

**For Breeders (Waitlist-based)**:
| Endpoint | UI Requirement | Exists? | Notes |
|----------|---------------|---------|-------|
| `POST /waitlist/:tenantSlug` | Submit waitlist request | ✅ Yes | `marketplace-waitlist.ts` |
| `GET /waitlist/my-requests` | My waitlist positions | ✅ Yes | `marketplace-waitlist.ts` |

**Status**: ⚠️ **MAPPED DIFFERENTLY** - Use messaging for services, waitlist for breeders

**UI Adaptation Needed**:
- "Inquiry Inbox" should aggregate:
  - Message threads (service inquiries)
  - Waitlist entries (breeder inquiries)
- Or rename to "Messages" for services and "Waitlist Requests" for breeders

---

### 9. Waitlist

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Location |
|----------|---------------|---------|----------|
| `POST /waitlist/:tenantSlug` | Join waitlist | ✅ Yes | `marketplace-waitlist.ts` |
| `GET /waitlist/my-requests` | My positions | ✅ Yes | `marketplace-waitlist.ts` |
| `POST /invoices/:id/checkout` | Pay deposit | ✅ Yes | `marketplace-waitlist.ts` |

**For Breeders (Waitlist Management)**:
- Waitlist management endpoints likely in tenant routes
- `WaitlistEntry` model has full status workflow

**Status**: ✅ **COMPLETE** for buyer side

---

### 10. Messaging

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Location |
|----------|---------------|---------|----------|
| `GET /messages/threads` | Thread list | ✅ Yes | `marketplace-messages.ts` |
| `GET /messages/threads/:id` | Thread detail | ✅ Yes | `marketplace-messages.ts` |
| `POST /messages/threads` | New thread | ✅ Yes | `marketplace-messages.ts` |
| `POST /messages/threads/:id/messages` | Send message | ✅ Yes | `marketplace-messages.ts` |
| `POST /messages/threads/:id/mark-read` | Mark read | ✅ Yes | `marketplace-messages.ts` |
| `GET /messages/counts` | Unread count | ✅ Yes | `marketplace-messages.ts` |

**Status**: ✅ **COMPLETE**

---

### 11. Reviews

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Location |
|----------|---------------|---------|----------|
| `POST /transactions/:id/review` | Submit review | ✅ Yes | `marketplace-reviews.ts` |
| `POST /reviews/:id/respond` | Provider response | ✅ Yes | `marketplace-reviews.ts` |
| `GET /providers/:id/reviews` | Provider reviews | ✅ Yes | `marketplace-reviews.ts` |
| `GET /reviews/my-reviews` | My reviews | ✅ Yes | `marketplace-reviews.ts` |
| `GET /reviews/pending` | Pending reviews | ✅ Yes | `marketplace-reviews.ts` |

**Status**: ✅ **COMPLETE**

---

### 12. Transactions & Bookings

#### Required by UI Design | Backend Status

| Endpoint | UI Requirement | Exists? | Location |
|----------|---------------|---------|----------|
| `POST /transactions` | Book service | ✅ Yes | `marketplace-transactions.ts` |
| `GET /transactions` | My bookings | ✅ Yes | `marketplace-transactions.ts` |
| `GET /transactions/:id` | Booking detail | ✅ Yes | `marketplace-transactions.ts` |
| `POST /transactions/:id/checkout` | Pay | ✅ Yes | `marketplace-transactions.ts` |
| `POST /transactions/:id/cancel` | Cancel | ✅ Yes | `marketplace-transactions.ts` |

**Status**: ✅ **COMPLETE**

---

## Gap Summary

### Critical Gaps (Block MVP)

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| None | - | Backend substantially ready |

### Medium Priority Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| Notifications | Badge counts limited to messages | Build virtual notification aggregator |
| Animal Browse API | May need marketplace-specific endpoint | Verify existing routes or create new |
| Saved Items API | Model exists, routes unverified | Verify or implement |

### Low Priority / Clarifications

| Item | Notes |
|------|-------|
| Become Seller flow | Different from provider - needs tenant creation |
| Inquiry unification | Decide: combined inbox or separate (messages vs waitlist) |
| Program management | Verify routes for marketplace context |

---

## Backend Endpoints by UI Page

### Browse Animals Page
```
GET  /public/marketplace/animals          # ❓ Verify/Create
GET  /public/marketplace/animals/:id      # ❓ Verify/Create
```

### Browse Services Page
```
GET  /marketplace/public/listings         # ✅ Exists
GET  /marketplace/public/listings/:slug   # ✅ Exists
```

### Browse Breeders Page
```
GET  /marketplace/breeders                # ✅ Exists
GET  /marketplace/breeders/:slug          # ✅ Exists
```

### Animal Detail Page
```
GET  /public/marketplace/animals/:id      # ❓ Verify/Create
POST /marketplace/waitlist/:tenantSlug    # ✅ Exists (for waitlist)
```

### Service Detail Page
```
GET  /marketplace/public/listings/:slug   # ✅ Exists
POST /marketplace/transactions            # ✅ Exists (book)
POST /marketplace/messages/threads        # ✅ Exists (inquire)
```

### My Services (Provider)
```
GET    /marketplace/listings              # ✅ Exists
POST   /marketplace/listings              # ✅ Exists
PUT    /marketplace/listings/:id          # ✅ Exists
POST   /marketplace/listings/:id/publish  # ✅ Exists
DELETE /marketplace/listings/:id          # ✅ Exists
```

### Inquiry Inbox / Messages
```
GET  /marketplace/messages/threads        # ✅ Exists
GET  /marketplace/messages/threads/:id    # ✅ Exists
POST /marketplace/messages/threads/:id/messages  # ✅ Exists
GET  /marketplace/messages/counts         # ✅ Exists
```

### Waitlist Positions (Buyer)
```
GET  /marketplace/waitlist/my-requests    # ✅ Exists
POST /marketplace/invoices/:id/checkout   # ✅ Exists
```

### Saved Items
```
GET    /marketplace/saved                 # ❓ Verify/Create
POST   /marketplace/saved                 # ❓ Verify/Create
DELETE /marketplace/saved/:id             # ❓ Verify/Create
```

### Settings
```
GET  /marketplace/profile                 # ✅ Exists
PUT  /marketplace/profile/draft           # ✅ Exists
POST /marketplace/profile/publish         # ✅ Exists
```

---

## Recommended Actions Before Implementation

1. **Verify** saved items API routes exist
2. **Verify** animal browse/detail routes for marketplace context
3. **Decide** on notification strategy (virtual aggregator vs dedicated model)
4. **Clarify** "become seller" flow for breeders (separate from provider registration)
5. **Map** program management routes to marketplace UI context

---

## API-to-Component Mapping Ready

Once the above gaps are addressed or confirmed, proceed to create the API-to-Component mapping document that will:
- Map each UI component to specific API endpoints
- Define request/response shapes
- Document loading/error states
- Specify authentication requirements per endpoint

---

*Document Version 1.0*
*Generated: 2026-01-12*
