# Service Provider Portal

Documentation for the non-breeder service provider portal, allowing pet service businesses to list their services on the BreederHQ Marketplace.

## Overview

The Service Provider Portal allows non-breeder businesses (trainers, vets, photographers, etc.) to:
- Create a business profile
- List their services on the marketplace
- Manage billing via Stripe
- Track views and inquiries

## User Flow

1. **Sign Up** - Create BreederHQ account (standard auth)
2. **Onboarding** - Create ServiceProviderProfile with business details
3. **Create Listings** - Add service listings (limited by plan)
4. **Publish** - Make listings visible on marketplace
5. **Upgrade** - Purchase premium plan for more listings

## Data Model

### ServiceProviderProfile

```prisma
model ServiceProviderProfile {
  id          Int      @id @default(autoincrement())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Business details
  businessName String
  email        String
  phone        String?
  website      String?

  // Location
  city         String?
  state        String?
  country      String   @default("US")

  // Subscription
  plan         ListingTier @default(FREE)  // FREE, PREMIUM, BUSINESS

  // Stripe references
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique

  // Relations
  listings     MarketplaceListing[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### Plan Limits

| Plan | Max Listings | Price |
|------|--------------|-------|
| FREE | 1 | $0/mo |
| PREMIUM | 5 | TBD |
| BUSINESS | 20 | TBD |

### Service Types

```typescript
const PROVIDER_SERVICE_TYPES: ListingType[] = [
  "TRAINING",
  "VETERINARY",
  "PHOTOGRAPHY",
  "GROOMING",
  "TRANSPORT",
  "BOARDING",
  "PRODUCT",
  "OTHER_SERVICE",
];
```

## API Endpoints

**Base Path:** `/api/v1/provider`

### Profile Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/provider/profile` | Get current user's profile |
| POST | `/provider/profile` | Create profile (onboarding) |
| PUT | `/provider/profile` | Update profile |

### Listings Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/provider/listings` | List all listings |
| POST | `/provider/listings` | Create listing |
| PUT | `/provider/listings/:id` | Update listing |
| POST | `/provider/listings/:id/publish` | Publish listing |
| POST | `/provider/listings/:id/unpublish` | Pause listing |
| DELETE | `/provider/listings/:id` | Delete listing |

### Dashboard & Billing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/provider/dashboard` | Get stats and limits |
| POST | `/provider/billing/checkout` | Create Stripe checkout session |
| POST | `/provider/billing/portal` | Create Stripe billing portal session |

## Backend Implementation

**File:** `breederhq-api/src/routes/service-provider.ts`

Key features:
- User-scoped (uses `req.userId`, not tenant)
- Plan-based listing limits
- Stripe integration for billing
- Auto-generates slugs with `svc-` prefix

### Listing Limit Enforcement

```typescript
// Check listing limits based on plan
const activeListings = await prisma.marketplaceListing.count({
  where: {
    serviceProviderId: profile.id,
    status: { in: ["DRAFT", "ACTIVE"] },
  },
});

const maxListings = profile.plan === "FREE" ? 1 : profile.plan === "PREMIUM" ? 5 : 20;
if (activeListings >= maxListings) {
  return reply.code(403).send({
    error: "listing_limit_reached",
    limit: maxListings,
    plan: profile.plan,
  });
}
```

## Frontend Implementation

### Portal Dashboard

**File:** `apps/marketplace/src/provider/pages/ProviderDashboardPage.tsx`

Features:
- **Onboarding Flow** - First-time profile creation
- **Dashboard View** - Stats cards (listings, views, inquiries)
- **Listings View** - CRUD management with publish/pause/delete
- **Settings View** - Profile information display
- **Billing** - Upgrade prompts and Stripe portal access

### Route

```tsx
<Route path="/provider" element={<ProviderDashboardPage />} />
<Route path="/provider/*" element={<ProviderDashboardPage />} />
```

## API Client Functions

**File:** `apps/marketplace/src/api/client.ts`

```typescript
// Profile
getServiceProviderProfile(): Promise<ServiceProviderProfile | null>
createServiceProviderProfile(input: ServiceProviderProfileInput): Promise<ServiceProviderProfile>
updateServiceProviderProfile(input: Partial<ServiceProviderProfileInput>): Promise<ServiceProviderProfile>

// Dashboard
getServiceProviderDashboard(): Promise<ProviderDashboard>

// Listings
getServiceProviderListings(params?: { status?: string }): Promise<ProviderListingsResponse>
createServiceProviderListing(input: ProviderListingCreateInput): Promise<ProviderListingItem>
updateServiceProviderListing(listingId: number, input: Partial<ProviderListingCreateInput>): Promise<ProviderListingItem>
publishServiceProviderListing(listingId: number): Promise<{ id: number; status: string; publishedAt: string }>
unpublishServiceProviderListing(listingId: number): Promise<{ id: number; status: string }>
deleteServiceProviderListing(listingId: number): Promise<void>

// Billing
createProviderCheckout(plan: "PREMIUM" | "BUSINESS", successUrl: string, cancelUrl: string): Promise<{ checkoutUrl: string }>
createProviderBillingPortal(returnUrl: string): Promise<{ portalUrl: string }>
```

## Stripe Integration

### Checkout Flow

1. User clicks "Upgrade" on dashboard
2. Frontend calls `createProviderCheckout()` with plan and URLs
3. Backend creates Stripe checkout session
4. User redirected to Stripe checkout
5. On success, webhook updates profile plan

### Environment Variables

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_PROVIDER_PREMIUM_PRICE_ID=price_...
STRIPE_PROVIDER_BUSINESS_PRICE_ID=price_...
```

### Webhook Handling

Note: Stripe webhook handler needs to be implemented to:
- Update `plan` on successful subscription
- Update `stripeSubscriptionId` on subscription creation
- Handle subscription cancellation/downgrade

## Dashboard Response

```typescript
interface ProviderDashboard {
  profile: {
    id: number;
    businessName: string;
    plan: "FREE" | "PREMIUM" | "BUSINESS";
    hasStripeSubscription: boolean;
  };
  stats: {
    totalListings: number;
    activeListings: number;
    draftListings: number;
    totalViews: number;
    totalInquiries: number;
  };
  limits: {
    maxListings: number;
    currentListings: number;
  };
}
```

## vs Breeder Services

| Feature | Service Provider | Breeder Services |
|---------|------------------|------------------|
| Account Type | ServiceProviderProfile | Tenant |
| Listing Limit | Plan-based (1/5/20) | Unlimited |
| Billing | Separate Stripe sub | Part of breeder sub |
| Service Types | Broader range | Breeder-focused |
| Profile | Own business profile | Part of breeder profile |

## Future Enhancements

- [ ] Stripe webhook handling for plan updates
- [ ] Booking/availability calendar
- [ ] Reviews and ratings
- [ ] Service-specific search filters
- [ ] Featured/promoted listings

## Related

- [Breeder Services](./breeder-services.md) - Services by breeders
- [API Reference](./api-reference.md) - Full API docs
