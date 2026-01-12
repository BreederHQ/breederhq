# Marketplace Production Build - Next Steps

**Status:** Phase 1 & 2 Complete ✅ | Phase 3 Ready to Start ⏳
**Decision:** Build best-in-class marketplace using new schema
**Zero Users:** Perfect opportunity to build it right

---

## ✅ What's Complete

### Phase 1: Database Foundation (DONE)
- BigInt for currency (prevents overflow)
- Soft deletes on Invoice, Contact, Animal
- Marketplace fields on existing tables
- Query helpers (`activeOnly()`)
- All queries updated
- Indexes optimized

### Phase 2: Marketplace Schema (DONE)
- Created `marketplace` schema in PostgreSQL
- 7 core tables created:
  - `marketplace.users`
  - `marketplace.providers`
  - `marketplace.service_listings`
  - `marketplace.transactions`
  - `marketplace.invoices`
  - `marketplace.message_threads`
  - `marketplace.messages`
- Multi-schema architecture working
- Cross-schema foreign keys validated
- All tests passing (14/14)

---

## ⏳ Phase 3: API & Features (NEXT)

### Step 1: Schema Enhancements (2-3 hours)
**File:** [`DRAFT_marketplace_production_enhancements.sql`](../../breederhq-api/prisma/migrations/DRAFT_marketplace_production_enhancements.sql)

Add production-ready fields:
- Address fields on users
- Email verification tokens
- Password reset tokens
- Provider business details (logo, website, hours)
- Provider badges (verified, premium, quick responder)
- Listing images, SEO fields, stats
- Transaction pricing breakdown, tax, cancellations
- Invoice payment confirmation fields
- Reviews & ratings table
- Saved listings (favorites) table

**Action:** Review SQL file, run as Prisma migration

### Step 2: Build Authentication (4-6 hours)

**Files to Create:**
- `src/routes/marketplace-auth.ts`
- `src/services/marketplace-auth-service.ts`
- `src/utils/marketplace-session.ts`

**Endpoints:**
```typescript
POST /api/v1/marketplace/auth/register
POST /api/v1/marketplace/auth/login
POST /api/v1/marketplace/auth/logout
POST /api/v1/marketplace/auth/verify-email
POST /api/v1/marketplace/auth/forgot-password
POST /api/v1/marketplace/auth/reset-password
GET  /api/v1/marketplace/auth/me
```

**Features:**
- bcrypt password hashing
- JWT or session-based auth
- Email verification flow
- Password reset flow
- Rate limiting
- CSRF protection

### Step 3: Provider Registration (3-4 hours)

**Files to Create:**
- `src/routes/marketplace-providers.ts`
- `src/services/stripe-connect-service.ts`

**Endpoints:**
```typescript
POST  /api/v1/marketplace/providers/register
GET   /api/v1/marketplace/providers/me
PATCH /api/v1/marketplace/providers/me
GET   /api/v1/marketplace/providers/:id
POST  /api/v1/marketplace/providers/me/stripe-connect
GET   /api/v1/marketplace/providers/me/dashboard
```

**Features:**
- Convert user to provider
- Stripe Connect onboarding
- Business profile management
- Revenue dashboard
- Statistics & analytics

### Step 4: Service Listings (4-6 hours)

**Files to Create:**
- `src/routes/marketplace-listings.ts`
- `src/services/listing-service.ts`

**Endpoints:**
```typescript
POST   /api/v1/marketplace/listings
GET    /api/v1/marketplace/listings (browse/search)
GET    /api/v1/marketplace/listings/:slug
PATCH  /api/v1/marketplace/listings/:id
DELETE /api/v1/marketplace/listings/:id
POST   /api/v1/marketplace/listings/:id/publish
POST   /api/v1/marketplace/listings/:id/pause
```

**Features:**
- CRUD operations
- Image upload (S3/Cloudflare)
- Slug generation
- Search & filtering
- Category browsing
- SEO optimization

### Step 5: Transactions & Payments (6-8 hours)

**Files to Create:**
- `src/routes/marketplace-transactions.ts`
- `src/routes/marketplace-invoices.ts`
- `src/routes/marketplace-webhooks.ts`
- `src/services/marketplace-payment-service.ts`

**Endpoints:**
```typescript
POST /api/v1/marketplace/transactions (book service)
GET  /api/v1/marketplace/transactions
GET  /api/v1/marketplace/transactions/:id
POST /api/v1/marketplace/transactions/:id/cancel
POST /api/v1/marketplace/transactions/:id/complete

GET  /api/v1/marketplace/invoices/:id
POST /api/v1/marketplace/invoices/:id/pay (Stripe Checkout)
POST /api/v1/marketplace/webhooks/stripe
```

**Features:**
- Create transactions
- Generate invoices
- Stripe Checkout integration
- Webhook handling (payment success/failure)
- Refund processing
- Platform fee calculation
- Provider payout tracking

### Step 6: Messaging (3-4 hours)

**Files to Create:**
- `src/routes/marketplace-messages.ts`

**Endpoints:**
```typescript
GET  /api/v1/marketplace/messages/threads
GET  /api/v1/marketplace/messages/threads/:id
POST /api/v1/marketplace/messages/threads
POST /api/v1/marketplace/messages/threads/:id/messages
```

**Features:**
- Thread creation
- Message sending
- Read receipts
- Unread counts
- Real-time ready (webhook/SSE hooks)

### Step 7: Reviews (2-3 hours)

**Files to Create:**
- `src/routes/marketplace-reviews.ts`

**Endpoints:**
```typescript
POST /api/v1/marketplace/reviews
GET  /api/v1/marketplace/listings/:slug/reviews
GET  /api/v1/marketplace/providers/:id/reviews
POST /api/v1/marketplace/reviews/:id/response (provider response)
POST /api/v1/marketplace/reviews/:id/flag
```

**Features:**
- Leave reviews after completed transactions
- 1-5 star ratings
- Provider responses
- Review moderation
- Average rating calculation

### Step 8: Saved Listings (1-2 hours)

**Endpoints:**
```typescript
POST   /api/v1/marketplace/saved-listings/:listingId
DELETE /api/v1/marketplace/saved-listings/:listingId
GET    /api/v1/marketplace/saved-listings (my favorites)
```

---

## Testing Strategy

### Unit Tests
- Authentication flows
- Payment calculations
- Rating averages
- Search/filter logic

### Integration Tests
- Full transaction flow (browse → book → pay → complete → review)
- Provider onboarding flow
- Messaging flow
- Refund flow

### E2E Tests
- User registration → browse → book → pay
- Provider registration → create listing → receive booking
- Webhook processing

---

## Timeline Estimate

**Realistic Timeline (Full-time):**
- Schema enhancements: 2-3 hours
- Authentication: 4-6 hours
- Provider system: 3-4 hours
- Listings: 4-6 hours
- Transactions/Payments: 6-8 hours
- Messaging: 3-4 hours
- Reviews: 2-3 hours
- Testing: 4-6 hours

**Total: 28-40 hours (3.5-5 days full-time)**

**Aggressive Timeline:** 2-3 days (cutting corners, minimal testing)
**Conservative Timeline:** 1-2 weeks (thorough testing, polish)

---

## Priority Order

**Must Have (MVP):**
1. ✅ Authentication (register/login)
2. ✅ Provider registration
3. ✅ Service listings (create/browse)
4. ✅ Basic transactions
5. ✅ Stripe payment
6. ✅ Messaging

**Should Have:**
7. Reviews & ratings
8. Saved listings
9. Provider dashboard
10. Search & filters

**Nice to Have:**
11. Email notifications
12. SMS notifications
13. Push notifications
14. Advanced analytics
15. Admin dashboard

---

## File Structure

```
breederhq-api/src/
├── routes/
│   ├── marketplace-auth.ts          (NEW)
│   ├── marketplace-providers.ts     (NEW)
│   ├── marketplace-listings.ts      (NEW)
│   ├── marketplace-transactions.ts  (NEW)
│   ├── marketplace-invoices.ts      (NEW)
│   ├── marketplace-messages-v2.ts   (NEW - replaces old)
│   ├── marketplace-reviews.ts       (NEW)
│   └── marketplace-webhooks.ts      (NEW)
├── services/
│   ├── marketplace-auth-service.ts  (NEW)
│   ├── marketplace-payment-service.ts (NEW)
│   ├── stripe-connect-service.ts    (NEW)
│   └── listing-service.ts           (NEW)
├── utils/
│   ├── marketplace-session.ts       (NEW)
│   └── slug-generator.ts            (NEW)
└── middleware/
    └── marketplace-auth.ts           (NEW)
```

---

## Database Migrations Needed

1. ✅ **Phase 1:** `critical_production_fixes` (DONE)
2. ✅ **Phase 2:** `create_marketplace_schema` (DONE)
3. ⏳ **Phase 3:** `marketplace_production_enhancements` (READY TO RUN)

---

## Configuration Needed

**Environment Variables:**
```env
# Marketplace
MARKETPLACE_JWT_SECRET=...
MARKETPLACE_SESSION_SECRET=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_CONNECT_CLIENT_ID=...

# Email
RESEND_API_KEY=...
MARKETPLACE_FROM_EMAIL=...

# URLs
MARKETPLACE_URL=https://marketplace.breederhq.com
APP_URL=https://app.breederhq.com
```

---

## Current Status Summary

✅ **Database:** Production-ready schema deployed
✅ **Architecture:** Clean separation, proper indexing
✅ **Testing:** Automated tests passing

⏳ **APIs:** Not started
⏳ **Auth:** Not started
⏳ **Payments:** Not started

**We're ready to build!** The foundation is solid, schema is clean, tests are passing. Time to build the APIs.

---

## Decision Points

Before starting Phase 3, confirm:

1. **Authentication Method:** JWT tokens or session cookies?
2. **Email Provider:** Resend (existing) or SendGrid?
3. **File Storage:** S3, Cloudflare R2, or local?
4. **Rate Limiting:** Redis or in-memory?
5. **Real-time:** WebSockets, SSE, or polling?

---

## Recommended Next Command

```bash
# Apply schema enhancements
cd breederhq-api
npm run db:dev:migrate
# Name: marketplace_production_enhancements

# Then start building APIs
# Start with: marketplace-auth.ts
```

---

**Status:** Ready to execute Phase 3
**Risk:** LOW (zero users, can iterate)
**Confidence:** HIGH (solid foundation)
