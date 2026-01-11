# Breeder Services

Documentation for service listings offered by breeders (as opposed to standalone service providers).

## Overview

Breeders can offer services in addition to their breeding programs. These services:
- Are tied to their tenant account
- Appear on their breeder profile page
- Are also discoverable in the marketplace Services section
- Use the `MarketplaceListing` table with service-type `listingType` values

## Service Types for Breeders

| Type | Description |
|------|-------------|
| `STUD_SERVICE` | Stud services for breeding |
| `TRAINING` | Dog/pet training |
| `GROOMING` | Grooming services |
| `TRANSPORT` | Pet transport |
| `BOARDING` | Boarding/kenneling |
| `OTHER_SERVICE` | Miscellaneous services |

## API Endpoints

**Base Path:** `/api/v1/services`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/services` | List breeder's services |
| GET | `/services/:id` | Get single service |
| POST | `/services` | Create service listing |
| PUT | `/services/:id` | Update service |
| POST | `/services/:id/publish` | Publish service |
| POST | `/services/:id/unpublish` | Unpublish (pause) service |
| DELETE | `/services/:id` | Delete service |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `DRAFT`, `ACTIVE`, `PAUSED` |
| `type` | string | Filter by service type |

### Request/Response Types

```typescript
interface ServiceListingInput {
  listingType: BreederServiceType;
  title: string;
  description?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  state?: string;
  priceCents?: number;
  priceType?: "fixed" | "starting_at" | "contact";
  images?: string[];
  videoUrl?: string;
  metadata?: Record<string, unknown>;
}

interface ServiceListingResponse {
  id: number;
  listingType: string;
  title: string;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  priceCents: number | null;
  priceType: string | null;
  images: string[] | null;
  videoUrl: string | null;
  status: string;
  slug: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

## Backend Implementation

**File:** `breederhq-api/src/routes/breeder-services.ts`

Key features:
- Tenant-scoped (requires `X-Tenant-Id` header)
- Auto-generates URL slugs
- Validates service types
- Supports draft → publish workflow

```typescript
// Service types available to breeders
const BREEDER_SERVICE_TYPES: ListingType[] = [
  "STUD_SERVICE",
  "TRAINING",
  "GROOMING",
  "TRANSPORT",
  "BOARDING",
  "OTHER_SERVICE",
];
```

## Frontend Implementation

### Management Page

**File:** `apps/marketplace/src/management/pages/ServicesSettingsPage.tsx`

Features:
- List all services with status badges
- Create/edit modal with form validation
- Publish/unpublish toggle
- Delete with confirmation
- Pricing configuration (fixed, starting at, contact)

### Route

```tsx
<Route path="/me/services" element={<ServicesSettingsPage />} />
```

## API Client Functions

**File:** `apps/marketplace/src/api/client.ts`

```typescript
// Get all services
getBreederServices(tenantId: string, params?: { status?: string; type?: string })

// Get single service
getBreederService(tenantId: string, serviceId: number)

// Create service
createBreederService(tenantId: string, input: ServiceListingCreateInput)

// Update service
updateBreederService(tenantId: string, serviceId: number, input: Partial<ServiceListingCreateInput>)

// Publish service
publishBreederService(tenantId: string, serviceId: number)

// Unpublish service
unpublishBreederService(tenantId: string, serviceId: number)

// Delete service
deleteBreederService(tenantId: string, serviceId: number)
```

## Workflow

1. **Create** - Service starts in `DRAFT` status
2. **Edit** - Update details while in draft
3. **Publish** - Set status to `ACTIVE`, visible on marketplace
4. **Pause** - Set status to `PAUSED`, hidden but not deleted
5. **Delete** - Permanently remove

## Visibility

| Status | On Breeder Profile | In Services Browse | In Search |
|--------|-------------------|-------------------|-----------|
| DRAFT | Hidden | Hidden | Hidden |
| ACTIVE | Visible | Visible | Visible |
| PAUSED | Hidden | Hidden | Hidden |

## vs Service Provider Portal

| Feature | Breeder Services | Service Provider |
|---------|------------------|------------------|
| Account Type | Tenant (breeder) | ServiceProviderProfile |
| Listing Limit | Unlimited | Plan-based (1/5/20) |
| Billing | Part of breeder subscription | Separate Stripe subscription |
| Service Types | Breeder-focused | Broader range |

## Related

- [Service Provider Portal](./service-provider-portal.md) - Non-breeder services
- [API Reference](./api-reference.md) - Full API docs
