# Marketplace Production Architecture - Best-in-Class Design

**Decision:** Build clean, separate marketplace using new schema fully
**Rationale:** Zero users = opportunity to build it right from the start
**Date:** 2026-01-12

---

## Core Principles

1. **Separation of Concerns**
   - Marketplace users != Breeder users (can link later)
   - Marketplace transactions tracked separately
   - Clean data model for scale

2. **Stripe-Native**
   - Stripe Connect for all providers
   - Stripe Checkout for all payments
   - Webhooks for payment status
   - Automatic payouts

3. **Production-Ready**
   - Soft deletes everywhere
   - Audit trails
   - Proper indexing
   - Status workflows

4. **Scale-Ready**
   - BigInt for money
   - Proper foreign keys
   - Optimized queries
   - Background jobs ready

---

## User Types

### 1. Marketplace Buyers (`marketplace.users`)
- Email/password authentication
- Profile (name, phone, address)
- Stripe customer ID
- Purchase history
- Favorites/saved listings
- Message threads with providers

### 2. Service Providers (`marketplace.providers`)
- Linked to marketplace.users (userId)
- Business profile
- Stripe Connect account
- Service listings
- Revenue tracking
- Rating/reviews

### 3. Breeder-Providers (Hybrid)
- marketplace.provider with tenantId link
- Can list both animals AND services
- Revenue from both systems
- Unified dashboard

---

## Core Entities

### marketplace.users
```prisma
model MarketplaceUser {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  emailVerified    Boolean   @default(false)
  passwordHash     String

  firstName        String?
  lastName         String?
  phone            String?

  // Shipping address
  addressLine1     String?
  addressLine2     String?
  city             String?
  state            String?
  zip              String?
  country          String?   @default("US")

  userType         String    @default("buyer") // "buyer" | "provider" | "both"

  // Link to breeder account (if they're also a breeder)
  tenantId         Int?
  tenantVerified   Boolean   @default(false)

  stripeCustomerId String?   @unique

  // Account status
  status           String    @default("active") // "active" | "suspended" | "deleted"
  suspendedAt      DateTime?
  suspendedReason  String?

  // Email verification
  emailVerifyToken String?   @unique
  emailVerifyExpires DateTime?

  // Password reset
  passwordResetToken String?  @unique
  passwordResetExpires DateTime?

  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  lastLoginAt      DateTime?

  // Soft delete
  deletedAt        DateTime?

  // Relations
  provider         MarketplaceProvider?
  sentMessages     MarketplaceMessage[]
  clientThreads    MarketplaceMessageThread[] @relation("ClientThreads")
  clientTransactions MarketplaceTransaction[] @relation("ClientTransactions")
  clientInvoices   MarketplaceInvoice[] @relation("ClientInvoices")
  reviews          MarketplaceReview[] @relation("ReviewsByClient")
  savedListings    MarketplaceSavedListing[]

  @@index([email])
  @@index([tenantId])
  @@index([stripeCustomerId])
  @@index([deletedAt])
  @@index([status])
  @@map("users")
  @@schema("marketplace")
}
```

### marketplace.providers
```prisma
model MarketplaceProvider {
  id                              Int       @id @default(autoincrement())
  userId                          Int       @unique
  user                            MarketplaceUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  providerType                    String    // "breeder" | "service_provider" | "both"

  // Link to breeder tenant (if provider is a breeder)
  tenantId                        Int?
  tenant                          Tenant?   @relation(fields: [tenantId], references: [id])

  // Business info
  businessName                    String
  businessDescription             String?
  logoUrl                         String?
  coverImageUrl                   String?

  // Contact
  publicEmail                     String?
  publicPhone                     String?
  website                         String?

  // Location
  city                            String?
  state                           String?
  zip                             String?
  country                         String?   @default("US")

  // Stripe Connect for automated payouts
  stripeConnectAccountId          String?   @unique
  stripeConnectOnboardingComplete Boolean   @default(false)
  stripeConnectPayoutsEnabled     Boolean   @default(false)
  stripeConnectDetailsSubmitted   Boolean   @default(false)

  // Payment settings
  paymentMode                     String    @default("stripe_connect") // "stripe_connect" | "manual" | "offline"
  paymentInstructions             String?

  // Business hours (JSON)
  businessHours                   Json?
  timeZone                        String?   @default("America/New_York")

  // Stats (updated by triggers/cron)
  totalListings                   Int       @default(0)
  activeListings                  Int       @default(0)
  totalTransactions               Int       @default(0)
  completedTransactions           Int       @default(0)
  totalRevenueCents               BigInt    @default(0)
  lifetimePayoutCents             BigInt    @default(0)
  averageRating                   Decimal   @default(0.00) @db.Decimal(3,2)
  totalReviews                    Int       @default(0)

  // Badge flags
  verifiedProvider                Boolean   @default(false)
  premiumProvider                 Boolean   @default(false)
  quickResponder                  Boolean   @default(false)

  // Status
  status                          String    @default("pending") // "pending" | "active" | "suspended" | "deleted"
  activatedAt                     DateTime?
  suspendedAt                     DateTime?
  suspendedReason                 String?

  createdAt                       DateTime  @default(now())
  updatedAt                       DateTime  @updatedAt

  // Soft delete
  deletedAt                       DateTime?

  // Relations
  listings                        MarketplaceServiceListing[]
  providerThreads                 MarketplaceMessageThread[] @relation("ProviderThreads")
  providerTransactions            MarketplaceTransaction[] @relation("ProviderTransactions")
  providerInvoices                MarketplaceInvoice[] @relation("ProviderInvoices")
  reviews                         MarketplaceReview[] @relation("ReviewsForProvider")

  @@index([userId])
  @@index([tenantId])
  @@index([stripeConnectAccountId])
  @@index([status, activatedAt])
  @@index([city, state, status])
  @@index([deletedAt])
  @@map("providers")
  @@schema("marketplace")
}
```

### marketplace.service_listings
```prisma
model MarketplaceServiceListing {
  id           Int       @id @default(autoincrement())
  providerId   Int
  provider     MarketplaceProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  slug         String    @unique
  title        String
  description  String?

  category     String    // "grooming" | "training" | "boarding" | "vet" | "transport" | "photography" | "stud_service" | "other"
  subcategory  String?

  // Pricing
  priceCents   BigInt?
  priceType    String?   // "fixed" | "hourly" | "daily" | "custom" | "contact"
  priceText    String?   // "Starting at $50" | "Contact for quote"

  // Images
  images       Json?     // Array of image URLs
  coverImageUrl String?

  // Location
  city         String?
  state        String?
  zip          String?

  // Service details
  duration     String?   // "1 hour" | "2-3 hours" | "Half day" | "Full day"
  availability String?   // "Weekdays" | "Weekends" | "By appointment"

  // SEO
  metaDescription String?
  keywords     String?

  // Stats
  viewCount    Int       @default(0)
  inquiryCount Int       @default(0)
  bookingCount Int       @default(0)

  // Status
  status       String    @default("draft") // "draft" | "active" | "paused" | "archived"
  publishedAt  DateTime?
  pausedAt     DateTime?

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Soft delete
  deletedAt    DateTime?

  // Relations
  transactions MarketplaceTransaction[]
  threads      MarketplaceMessageThread[]
  reviews      MarketplaceReview[]
  savedBy      MarketplaceSavedListing[]

  @@index([providerId, status])
  @@index([category, status, publishedAt(sort: Desc)])
  @@index([state, city, category, status])
  @@index([deletedAt])
  @@index([slug])
  @@map("service_listings")
  @@schema("marketplace")
}
```

### marketplace.transactions
```prisma
model MarketplaceTransaction {
  id                   BigInt    @id @default(autoincrement())

  clientId             Int
  client               MarketplaceUser @relation("ClientTransactions", fields: [clientId], references: [id], onDelete: Restrict)

  providerId           Int
  provider             MarketplaceProvider @relation("ProviderTransactions", fields: [providerId], references: [id], onDelete: Restrict)

  listingId            Int?
  listing              MarketplaceServiceListing? @relation(fields: [listingId], references: [id], onDelete: SetNull)

  // Transaction details
  serviceDescription   String
  serviceNotes         String?   // Client-provided notes

  // Pricing breakdown
  servicePriceCents    BigInt    // Provider's price
  platformFeeCents     BigInt    // Platform commission
  stripeFeesCents      BigInt    @default(0) // Stripe processing fees
  totalCents           BigInt    // Total charged to client
  providerPayoutCents  BigInt    // Net to provider

  // Tax (if applicable)
  taxCents             BigInt    @default(0)
  taxRate              Decimal?  @db.Decimal(5,4)

  // Invoice link
  invoiceId            Int?      @unique
  invoice              MarketplaceInvoice?

  // Status workflow
  status               String    @default("pending")
  // "pending" → "invoiced" → "paid" → "in_progress" → "completed" | "cancelled" | "refunded"

  // Timestamps
  createdAt            DateTime  @default(now())
  invoicedAt           DateTime?
  paidAt               DateTime?
  startedAt            DateTime?
  completedAt          DateTime?
  cancelledAt          DateTime?
  refundedAt           DateTime?

  // Cancellation/refund
  cancellationReason   String?
  cancelledBy          String?   // "client" | "provider" | "admin"
  refundAmountCents    BigInt    @default(0)
  refundReason         String?

  // Relations
  messages             MarketplaceMessageThread[]
  review               MarketplaceReview?

  @@index([clientId, status, createdAt(sort: Desc)])
  @@index([providerId, status, createdAt(sort: Desc)])
  @@index([listingId, status])
  @@index([invoiceId])
  @@index([status, paidAt])
  @@map("transactions")
  @@schema("marketplace")
}
```

### marketplace.invoices
```prisma
model MarketplaceInvoice {
  id                     Int       @id @default(autoincrement())

  transactionId          BigInt    @unique
  transaction            MarketplaceTransaction @relation(fields: [transactionId], references: [id], onDelete: Restrict)

  providerId             Int
  provider               MarketplaceProvider @relation("ProviderInvoices", fields: [providerId], references: [id], onDelete: Restrict)

  clientId               Int
  client                 MarketplaceUser @relation("ClientInvoices", fields: [clientId], references: [id], onDelete: Restrict)

  invoiceNumber          String    @unique

  // Amounts
  subtotalCents          BigInt
  taxCents               BigInt    @default(0)
  totalCents             BigInt
  paidCents              BigInt    @default(0)
  balanceCents           BigInt
  refundedCents          BigInt    @default(0)

  // Status
  status                 String    @default("draft")
  // "draft" → "sent" → "viewed" → "paid" → "refunded" | "void"

  // Payment
  paymentMethod          String    @default("stripe") // "stripe" | "manual" | "offline"
  stripeInvoiceId        String?   @unique
  stripePaymentIntentId  String?   @unique
  stripeChargeId         String?

  // Manual payment confirmation
  manualPaymentMarkedAt  DateTime?
  manualPaymentMethod    String?   // "cash" | "check" | "bank_transfer" | "other"
  manualPaymentReference String?
  manualPaymentConfirmedBy Int?    // Admin user ID

  // Dates
  issuedAt               DateTime?
  sentAt                 DateTime?
  viewedAt               DateTime?
  dueAt                  DateTime?
  paidAt                 DateTime?
  refundedAt             DateTime?
  voidedAt               DateTime?

  // Notes
  notes                  String?
  internalNotes          String?   // Not visible to client

  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  @@index([transactionId])
  @@index([providerId, status, createdAt(sort: Desc)])
  @@index([clientId, status, createdAt(sort: Desc)])
  @@index([stripeInvoiceId])
  @@index([stripePaymentIntentId])
  @@index([status, dueAt])
  @@map("invoices")
  @@schema("marketplace")
}
```

### Additional Models

```prisma
// Reviews & ratings
model MarketplaceReview {
  id             Int       @id @default(autoincrement())
  transactionId  BigInt    @unique
  transaction    MarketplaceTransaction @relation(fields: [transactionId], references: [id])

  providerId     Int
  provider       MarketplaceProvider @relation("ReviewsForProvider", fields: [providerId], references: [id])

  clientId       Int
  client         MarketplaceUser @relation("ReviewsByClient", fields: [clientId], references: [id])

  listingId      Int?
  listing        MarketplaceServiceListing? @relation(fields: [listingId], references: [id])

  rating         Int       // 1-5
  title          String?
  reviewText     String?

  // Response from provider
  providerResponse String?
  respondedAt    DateTime?

  status         String    @default("published") // "published" | "flagged" | "removed"
  flaggedReason  String?

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([providerId, status, createdAt(sort: Desc)])
  @@index([clientId])
  @@index([listingId, status])
  @@map("reviews")
  @@schema("marketplace")
}

// Saved listings (favorites)
model MarketplaceSavedListing {
  id         Int       @id @default(autoincrement())
  userId     Int
  user       MarketplaceUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  listingId  Int
  listing    MarketplaceServiceListing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  savedAt    DateTime  @default(now())

  @@unique([userId, listingId])
  @@index([userId, savedAt(sort: Desc)])
  @@map("saved_listings")
  @@schema("marketplace")
}
```

---

## API Structure

### Authentication
- `POST /api/v1/marketplace/auth/register` - Register marketplace account
- `POST /api/v1/marketplace/auth/login` - Login
- `POST /api/v1/marketplace/auth/logout` - Logout
- `POST /api/v1/marketplace/auth/verify-email` - Verify email
- `POST /api/v1/marketplace/auth/forgot-password` - Request reset
- `POST /api/v1/marketplace/auth/reset-password` - Reset password
- `GET /api/v1/marketplace/auth/me` - Current user

### Service Providers
- `POST /api/v1/marketplace/providers/register` - Become a provider
- `GET /api/v1/marketplace/providers/me` - My provider profile
- `PATCH /api/v1/marketplace/providers/me` - Update profile
- `GET /api/v1/marketplace/providers/:id` - Public profile
- `POST /api/v1/marketplace/providers/me/stripe-connect` - Start Stripe Connect onboarding
- `GET /api/v1/marketplace/providers/me/dashboard` - Revenue, stats

### Listings
- `POST /api/v1/marketplace/listings` - Create listing
- `GET /api/v1/marketplace/listings` - Browse all listings
- `GET /api/v1/marketplace/listings/:slug` - View listing
- `PATCH /api/v1/marketplace/listings/:id` - Update (provider only)
- `DELETE /api/v1/marketplace/listings/:id` - Delete (soft)
- `POST /api/v1/marketplace/listings/:id/publish` - Publish
- `POST /api/v1/marketplace/listings/:id/pause` - Pause

### Transactions
- `POST /api/v1/marketplace/transactions` - Create transaction (book service)
- `GET /api/v1/marketplace/transactions` - My transactions
- `GET /api/v1/marketplace/transactions/:id` - Transaction details
- `POST /api/v1/marketplace/transactions/:id/cancel` - Cancel
- `POST /api/v1/marketplace/transactions/:id/complete` - Mark complete
- `POST /api/v1/marketplace/transactions/:id/refund` - Request refund

### Invoices & Payments
- `GET /api/v1/marketplace/invoices/:id` - View invoice
- `POST /api/v1/marketplace/invoices/:id/pay` - Create Stripe Checkout session
- `POST /api/v1/marketplace/webhooks/stripe` - Stripe webhook handler

### Messaging
- `GET /api/v1/marketplace/messages/threads` - My threads
- `GET /api/v1/marketplace/messages/threads/:id` - Thread details
- `POST /api/v1/marketplace/messages/threads` - Start thread
- `POST /api/v1/marketplace/messages/threads/:id/messages` - Send message

### Reviews
- `POST /api/v1/marketplace/reviews` - Leave review
- `GET /api/v1/marketplace/listings/:slug/reviews` - Listing reviews
- `GET /api/v1/marketplace/providers/:id/reviews` - Provider reviews

---

## Next Steps

1. ✅ Schema design complete
2. ⏳ Update Prisma schema with production models
3. ⏳ Generate migration
4. ⏳ Build authentication system
5. ⏳ Build provider registration flow
6. ⏳ Build listing management
7. ⏳ Build transaction + payment flow
8. ⏳ Build messaging
9. ⏳ Build reviews
10. ⏳ Test end-to-end

This is a **production-grade marketplace** built from the ground up.
