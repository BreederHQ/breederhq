# Marketplace API-to-Component Mapping

**Version**: 1.0
**Date**: 2026-01-12
**Purpose**: Map UI components and pages to specific API endpoints
**Prerequisites**: [marketplace-api-gaps-response.md](marketplace-api-gaps-response.md)

---

## Quick Reference

| Page/Component | Primary Endpoint(s) | Auth Required |
|----------------|---------------------|---------------|
| Home/Landing | `GET /breeders`, `GET /public/listings` | No |
| Browse Breeders | `GET /breeders` | No |
| Breeder Profile | `GET /breeders/:slug` | No |
| Browse Services | `GET /public/listings` | No |
| Service Detail | `GET /public/listings/:slug` | No |
| Login | `POST /auth/login` | No |
| Register | `POST /auth/register` | No |
| Messages | `GET /messages/threads` | Yes |
| Saved Listings | `GET /saved` | Yes |
| Waitlist Positions | `GET /waitlist/my-requests` | Yes |
| Notifications Badge | `GET /notifications/counts` | Yes |
| TopNav/BottomTabBar | `GET /notifications/counts` | Yes |

---

## 1. Navigation Components

### 1.1 TopNav

**Purpose**: Primary desktop navigation with notification badges

| Data Point | Endpoint | Response Field |
|------------|----------|----------------|
| Unread messages count | `GET /notifications/counts` | `counts.unreadMessages` |
| Total notification count | `GET /notifications/counts` | `counts.total` |
| Current user | `GET /auth/me` | `user` object |
| User avatar | `GET /auth/me` | `user.avatarUrl` |
| Is provider | `GET /auth/me` | `user.userType === 'provider'` |

**Implementation Notes**:
```typescript
// Fetch on mount and periodically (every 60s)
const { data: notifications } = useQuery({
  queryKey: ['notifications', 'counts'],
  queryFn: () => fetch('/api/v1/marketplace/notifications/counts'),
  refetchInterval: 60000,
  enabled: isAuthenticated,
});

const { data: user } = useQuery({
  queryKey: ['auth', 'me'],
  queryFn: () => fetch('/api/v1/marketplace/auth/me'),
  enabled: isAuthenticated,
});
```

**Loading State**: Show skeleton badges, then animate count in
**Error State**: Hide badge (fail silently)

---

### 1.2 BottomTabBar

**Purpose**: Primary mobile navigation with notification badges

| Tab | Badge Source | Endpoint |
|-----|--------------|----------|
| Messages | Unread count | `GET /notifications/counts` → `counts.unreadMessages` |
| Saved | Total saved | `GET /saved` → `pagination.total` |

**Implementation Notes**:
- Badge counts share same query as TopNav
- Saved count from paginated response (or separate count endpoint)
- Max display: "99+"

---

## 2. Authentication Pages

### 2.1 Login Page

**Primary Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "userType": "buyer"
  },
  "token": "jwt_token_here"
}
```

**Error States**:
| Error Code | Message | UI Action |
|------------|---------|-----------|
| `invalid_credentials` | "Invalid email or password" | Show inline error |
| `account_locked` | "Account locked" | Show reset link |
| `email_not_verified` | "Please verify your email" | Show resend link |

**Form Validation** (Client-side):
```typescript
const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
```

---

### 2.2 Register Page

**Primary Endpoint**: `POST /auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Smith",
  "acceptTerms": true
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "message": "Verification email sent",
  "user": { ... }
}
```

**Validation**:
```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
});
```

---

### 2.3 Password Reset

**Endpoints**:
1. `POST /auth/forgot-password` - Request reset
2. `POST /auth/reset-password` - Complete reset

**Request (Forgot)**:
```json
{ "email": "user@example.com" }
```

**Request (Reset)**:
```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123"
}
```

---

## 3. Browse Pages

### 3.1 Home/Landing Page

**Endpoints Used**:

| Section | Endpoint | Query Params |
|---------|----------|--------------|
| Featured Breeders | `GET /breeders` | `limit=6&offset=0` |
| Featured Services | `GET /public/listings` | `limit=4&status=published` |
| Category Counts | `GET /public/listings/categories` | (if exists) |

**Data Flow**:
```typescript
// Parallel fetch for performance
const [breeders, listings] = await Promise.all([
  fetch('/api/v1/marketplace/breeders?limit=6'),
  fetch('/api/v1/marketplace/public/listings?limit=4'),
]);
```

**Components → API Mapping**:
| Component | Data Source |
|-----------|-------------|
| `AnimalCard` (Featured) | N/A (via breeder programs) |
| `ProgramCard` | `breeders[].programs` |
| `ServiceCard` | `listings[]` |
| `CategoryTile` | Static or `/categories` endpoint |

---

### 3.2 Browse Breeders Page

**Primary Endpoint**: `GET /breeders`

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Items per page (default: 24, max: 50) |
| `offset` | number | Pagination offset |
| `species` | string | Filter by species (future) |
| `state` | string | Filter by state (future) |

**Response**:
```json
{
  "items": [
    {
      "tenantSlug": "happy-paws-kennel",
      "businessName": "Happy Paws Kennel",
      "location": "Denver, CO",
      "breeds": [{ "name": "Golden Retriever", "species": "dog" }],
      "logoAssetId": "asset_abc123"
    }
  ],
  "total": 42
}
```

**Component Mapping**:
| Component | Props from API |
|-----------|---------------|
| `ProgramCard` | `businessName`, `location`, `breeds`, `logoAssetId` |
| `FilterPanel` | Static filters (species, location) |
| `Pagination` | `total`, current `offset`, `limit` |

**Loading State**: 12 skeleton cards in grid
**Empty State**: "No breeders found" with reset filters CTA

---

### 3.3 Breeder Profile Page

**Primary Endpoint**: `GET /breeders/:tenantSlug`

**URL Pattern**: `/breeders/:slug`

**Response Fields → Component Props**:

| Section | API Field | Component |
|---------|-----------|-----------|
| Header | `businessName`, `logoAssetId` | `Avatar`, heading |
| Bio | `bio` | Markdown/text block |
| Location | `location.city`, `location.state` | Location badge |
| Social Links | `socialLinks.instagram`, `socialLinks.facebook` | Social icons |
| Programs | `programs[]` | `ProgramCard` list |
| Credentials | `standardsAndCredentials` | Badge/list display |
| Policies | `placementPolicies` | Checklist display |
| Business Hours | `businessHours` | Hours table |
| Contact | N/A (via messaging) | Contact button |

**Contact Button Flow**:
```typescript
// Step 1: Get messaging party ID
const { partyId } = await fetch(`/api/v1/marketplace/breeders/${slug}/messaging`);

// Step 2: Navigate to messaging with party context
navigate(`/messages/new?partyId=${partyId}`);
```

**Waitlist Join Flow**:
```typescript
// Check if program has openWaitlist: true
if (program.openWaitlist) {
  // Show waitlist form modal
  // On submit: POST /waitlist/:tenantSlug
}
```

---

### 3.4 Browse Services Page

**Primary Endpoint**: `GET /public/listings`

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 24) |
| `category` | string | Filter by category |
| `subcategory` | string | Filter by subcategory |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `minPrice` | number | Min price in cents |
| `maxPrice` | number | Max price in cents |
| `sort` | string | `rating`, `price_asc`, `price_desc`, `newest` |

**Response**:
```json
{
  "ok": true,
  "listings": [...],
  "pagination": {
    "page": 1,
    "limit": 24,
    "total": 156,
    "totalPages": 7
  }
}
```

**Component Mapping**:
| Component | Props |
|-----------|-------|
| `ServiceCard` | `title`, `slug`, `coverImageUrl`, `priceCents`, `priceType`, `category`, `provider` |
| `FilterPanel` | Categories, location, price range |
| `SearchBar` | Query input |
| `Pagination` | Page numbers from response |

---

### 3.5 Service Detail Page

**Primary Endpoint**: `GET /public/listings/:slug`

**URL Pattern**: `/services/:slug`

**Response Fields → UI Sections**:

| Section | API Fields |
|---------|------------|
| Hero Image | `coverImageUrl`, `images[]` |
| Title | `title` |
| Price | `priceCents`, `priceType`, `priceText` |
| Provider | `provider.businessName`, `provider.averageRating` |
| Description | `description` |
| Location | `city`, `state`, `serviceArea` |
| Category | `category`, `subcategory` |
| Contact | Via messaging flow |

**Save Button**:
```typescript
// Check saved status
const { saved } = await fetch(`/api/v1/marketplace/saved/check/${listingId}`);

// Toggle save
if (saved) {
  await fetch(`/api/v1/marketplace/saved/${listingId}`, { method: 'DELETE' });
} else {
  await fetch('/api/v1/marketplace/saved', {
    method: 'POST',
    body: JSON.stringify({ listingId }),
  });
}
```

---

## 4. User Dashboard Pages

### 4.1 Buyer Dashboard

**Endpoints Used**:

| Section | Endpoint |
|---------|----------|
| Overview stats | `GET /notifications/counts` |
| Recent messages | `GET /messages/threads?limit=3` |
| Saved listings | `GET /saved?limit=4` |
| Waitlist positions | `GET /waitlist/my-requests` |

**Data Aggregation**:
```typescript
const [notifications, messages, saved, waitlist] = await Promise.all([
  fetch('/api/v1/marketplace/notifications/counts'),
  fetch('/api/v1/marketplace/messages/threads?limit=3'),
  fetch('/api/v1/marketplace/saved?limit=4'),
  fetch('/api/v1/marketplace/waitlist/my-requests'),
]);
```

---

### 4.2 Saved Listings Page

**Primary Endpoint**: `GET /saved`

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response**:
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
        "slug": "professional-training",
        "title": "Professional Dog Training",
        "coverImageUrl": "...",
        "priceCents": "7500",
        "priceType": "starting_at",
        "status": "published",
        "isAvailable": true,
        "provider": { ... }
      }
    }
  ],
  "pagination": { ... }
}
```

**Component Mapping**:
| Component | Data |
|-----------|------|
| `ServiceCard` | `item.listing.*` |
| `EmptyState` | When `items.length === 0` |

**Unsave Action**:
```typescript
const handleUnsave = async (listingId: number) => {
  await fetch(`/api/v1/marketplace/saved/${listingId}`, { method: 'DELETE' });
  // Optimistically remove from list or refetch
};
```

**Unavailable Listing Handling**:
- If `listing.isAvailable === false`, show muted card with "No longer available" badge
- Still allow unsave action

---

### 4.3 Waitlist Positions Page

**Primary Endpoint**: `GET /waitlist/my-requests`

**Response**:
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
      "invoice": {
        "id": 123,
        "status": "pending",
        "totalCents": 50000,
        "balanceCents": 50000,
        "dueAt": "2026-01-15T00:00:00Z"
      }
    }
  ]
}
```

**Status Display Mapping**:
| `status` | `statusDetail` | UI Display | Action |
|----------|----------------|------------|--------|
| `pending` | `INQUIRY` | "Pending Review" | View breeder |
| `approved` | `APPROVED` | "Approved" | View breeder |
| `approved` | `DEPOSIT_DUE` | "Deposit Required" | Pay deposit button |
| `approved` | `DEPOSIT_PAID` | "Deposit Paid" | View breeder |
| `rejected` | `REJECTED` | "Not Approved" | View reason |

**Pay Deposit Flow**:
```typescript
const handlePayDeposit = async (invoiceId: number) => {
  const { checkoutUrl } = await fetch(`/api/v1/marketplace/invoices/${invoiceId}/checkout`, {
    method: 'POST',
  });
  window.location.href = checkoutUrl; // Redirect to Stripe
};
```

---

### 4.4 Messages Page

**Primary Endpoint**: `GET /messages/threads`

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Threads per page |
| `status` | string | `active`, `archived` |

**Response**:
```json
{
  "ok": true,
  "threads": [
    {
      "id": 1,
      "subject": "Question about puppies",
      "lastMessage": {
        "content": "Thank you for your interest...",
        "senderId": 456,
        "createdAt": "2026-01-12T10:00:00Z"
      },
      "otherParty": {
        "name": "Happy Paws Kennel",
        "avatarUrl": "..."
      },
      "unreadCount": 2,
      "createdAt": "2026-01-10T14:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

**Thread Detail Endpoint**: `GET /messages/threads/:id`

**Send Message**: `POST /messages/threads/:id/messages`

**Mark Read**: `POST /messages/threads/:id/mark-read`

---

## 5. Forms and Actions

### 5.1 Join Waitlist Form

**Endpoint**: `POST /waitlist/:tenantSlug`

**Request**:
```json
{
  "programName": "Golden Retriever Program",
  "message": "We're interested in a female puppy...",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+15551234567",
  "origin": {
    "source": "direct",
    "pagePath": "/breeders/happy-paws-kennel"
  }
}
```

**Form Fields**:
| Field | Required | Validation |
|-------|----------|------------|
| `programName` | Yes | From program selection |
| `name` | Yes | Non-empty |
| `email` | Yes | Valid email |
| `phone` | No | E.164 format |
| `message` | No | Max 2000 chars |

**Success Response**:
```json
{ "success": true, "entryId": 789 }
```

**UI Flow**:
1. User clicks "Join Waitlist" on program card
2. Modal opens with form (pre-filled from user profile if logged in)
3. On submit, show loading state
4. On success, show confirmation and close modal
5. Optionally redirect to waitlist positions page

---

### 5.2 Save/Unsave Listing

**Endpoints**:
- Save: `POST /saved` with `{ listingId }`
- Unsave: `DELETE /saved/:listingId`
- Check: `GET /saved/check/:listingId`

**Optimistic Update Pattern**:
```typescript
const toggleSave = async (listingId: number, currentlySaved: boolean) => {
  // Optimistic update
  setSaved(!currentlySaved);

  try {
    if (currentlySaved) {
      await fetch(`/api/v1/marketplace/saved/${listingId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/v1/marketplace/saved', {
        method: 'POST',
        body: JSON.stringify({ listingId }),
      });
    }
  } catch (error) {
    // Revert on error
    setSaved(currentlySaved);
    toast.error('Failed to update saved status');
  }
};
```

---

### 5.3 Contact Breeder

**Flow**:
1. Get messaging party: `GET /breeders/:slug/messaging`
2. Create thread: `POST /messages/threads` with `{ partyId, subject, initialMessage }`
3. Navigate to thread: `/messages/:threadId`

**Request (Create Thread)**:
```json
{
  "recipientPartyId": 456,
  "subject": "Question about Golden Retriever Program",
  "initialMessage": "Hi, I'm interested in learning more about..."
}
```

---

## 6. Component-Level API Usage

### 6.1 ServiceCard

**Data Dependencies**:
```typescript
interface ServiceCardProps {
  // From GET /public/listings or GET /saved
  id: number;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  priceCents: string | null;
  priceType: 'fixed' | 'starting_at' | 'hourly' | 'contact';
  category: string;
  provider: {
    id: number;
    businessName: string;
    averageRating: string;
    totalReviews: number;
    verifiedProvider: boolean;
  };

  // Client-side state
  isSaved?: boolean;
  onSaveToggle?: () => void;
}
```

**Computed Values**:
```typescript
const formattedPrice = useMemo(() => {
  if (!priceCents) return 'Contact for pricing';
  const dollars = parseInt(priceCents) / 100;
  switch (priceType) {
    case 'starting_at': return `From $${dollars}`;
    case 'hourly': return `$${dollars}/hr`;
    case 'contact': return 'Contact for pricing';
    default: return `$${dollars}`;
  }
}, [priceCents, priceType]);
```

---

### 6.2 ProgramCard (for Breeders)

**Data Dependencies**:
```typescript
interface ProgramCardProps {
  // From GET /breeders
  tenantSlug: string;
  businessName: string;
  location: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;

  // From breeder detail (programs array)
  programs?: Array<{
    name: string;
    acceptInquiries: boolean;
    openWaitlist: boolean;
  }>;
}
```

---

### 6.3 InquiryCard (Waitlist Entry)

**Data Dependencies**:
```typescript
interface InquiryCardProps {
  // From GET /waitlist/my-requests
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  statusDetail: string;
  breederName: string | null;
  breederSlug: string | null;
  programName: string | null;
  submittedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  invoice: {
    id: number;
    status: string;
    totalCents: number;
    balanceCents: number;
    dueAt: string;
  } | null;
}
```

---

## 7. Error Handling Reference

### Standard Error Response Format

```json
{
  "error": "error_code",
  "message": "Human readable message",
  "details": { ... }
}
```

### Common Error Codes

| Code | HTTP Status | UI Action |
|------|-------------|-----------|
| `unauthorized` | 401 | Redirect to login |
| `forbidden` | 403 | Show "Access denied" message |
| `not_found` | 404 | Show 404 page or "Not found" message |
| `validation_failed` | 400 | Show field errors |
| `rate_limited` | 429 | Show "Please wait" message |
| `internal_error` | 500 | Show generic error, log for debugging |

### Error Handling Pattern

```typescript
const handleApiError = (error: ApiError) => {
  switch (error.code) {
    case 'unauthorized':
      navigate('/login', { state: { returnTo: location.pathname } });
      break;
    case 'not_found':
      navigate('/404');
      break;
    case 'validation_failed':
      setFieldErrors(error.details);
      break;
    default:
      toast.error(error.message || 'Something went wrong');
  }
};
```

---

## 8. Loading States

### Skeleton Components

| Component | Skeleton Pattern |
|-----------|------------------|
| `ServiceCard` | Gray box for image, 2 text lines, badge placeholder |
| `ProgramCard` | Circle avatar, 2 text lines, breed pills |
| `InquiryCard` | Status badge skeleton, 3 text lines |
| `MessageThread` | Avatar circle, 2 text lines |

### Loading State Duration

- Show skeleton immediately on navigation
- Minimum display time: 300ms (prevents flash)
- Timeout after 10s → show error state

---

## 9. Caching Strategy

### Query Key Structure

```typescript
const queryKeys = {
  breeders: {
    list: (params) => ['breeders', 'list', params],
    detail: (slug) => ['breeders', 'detail', slug],
    messaging: (slug) => ['breeders', 'messaging', slug],
  },
  listings: {
    list: (params) => ['listings', 'list', params],
    detail: (slug) => ['listings', 'detail', slug],
  },
  saved: {
    list: (params) => ['saved', 'list', params],
    check: (id) => ['saved', 'check', id],
  },
  waitlist: {
    myRequests: ['waitlist', 'my-requests'],
  },
  notifications: {
    counts: ['notifications', 'counts'],
  },
  messages: {
    threads: (params) => ['messages', 'threads', params],
    thread: (id) => ['messages', 'thread', id],
  },
};
```

### Cache Invalidation

| Action | Invalidate |
|--------|------------|
| Save listing | `saved.list`, `saved.check(id)` |
| Unsave listing | `saved.list`, `saved.check(id)` |
| Join waitlist | `waitlist.myRequests` |
| Send message | `messages.threads`, `notifications.counts` |
| Read message | `messages.thread(id)`, `notifications.counts` |

---

## 10. Real-Time Updates (Optional)

### WebSocket Events (if implemented)

| Event | Data | Action |
|-------|------|--------|
| `new_message` | `{ threadId, message }` | Update thread, increment unread |
| `waitlist_update` | `{ entryId, status }` | Update waitlist entry |
| `listing_unavailable` | `{ listingId }` | Mark saved listing unavailable |

### Polling Fallback

```typescript
// Poll notifications every 60 seconds
useQuery({
  queryKey: queryKeys.notifications.counts,
  refetchInterval: 60000,
});

// Poll active message thread every 10 seconds
useQuery({
  queryKey: queryKeys.messages.thread(activeThreadId),
  refetchInterval: 10000,
  enabled: !!activeThreadId,
});
```

---

*Document Version 1.0*
*Generated: 2026-01-12*
*Status: Implementation Ready*
