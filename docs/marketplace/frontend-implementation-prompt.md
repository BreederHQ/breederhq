# Marketplace Frontend Implementation Prompt

**Date**: 2026-01-12
**Purpose**: Comprehensive prompt for implementing the BreederHQ Marketplace frontend
**Target**: Claude Code or frontend developer

---

## Project Context

You are implementing the frontend for BreederHQ's Marketplace - a platform connecting animal buyers with breeders and service providers. The marketplace supports two entry points (standalone and embedded) and three user types (buyers, breeders, and service providers).

### Tech Stack
- **Framework**: React 19.2 with TypeScript
- **Routing**: React Router DOM 6.x
- **Styling**: Tailwind CSS 4.x
- **Build**: Vite 5.x
- **Monorepo**: pnpm workspaces

### Codebase Location
- **App**: `apps/marketplace/`
- **Shared UI**: `packages/ui/`
- **API Client**: `apps/marketplace/src/api/`

---

## Reference Documents

Read these documents in order before implementing:

1. **[marketplace-ui-ux-design-specification.md](marketplace-ui-ux-design-specification.md)** - Core design system, visual direction, accessibility requirements
2. **[page-specifications-complete.md](page-specifications-complete.md)** - All 26 page layouts and states
3. **[component-specifications-complete.md](component-specifications-complete.md)** - All 24 component specifications with props
4. **[dual-entry-architecture-spec.md](dual-entry-architecture-spec.md)** - Standalone vs embedded entry points
5. **[api-to-component-mapping.md](api-to-component-mapping.md)** - API endpoints for each component/page
6. **[marketplace-api-gaps-response.md](marketplace-api-gaps-response.md)** - Complete API documentation

---

## Current State

### Existing Pages (in `apps/marketplace/src/`)
- `HomePage.tsx` - Basic intent router with featured section
- `BreedersIndexPage.tsx` - Browse breeders list
- `BreederPage.tsx` - Breeder profile detail
- `ServicesPage.tsx` - Browse services
- `AnimalsIndexPage.tsx` - Browse animals
- `InquiriesPage.tsx` - Messages/inquiries
- `LoginPage.tsx`, `RegisterPage.tsx` - Auth pages
- `ProgramsSettingsPage.tsx`, `ServicesSettingsPage.tsx` - Seller management

### Existing Components (in `apps/marketplace/src/marketplace/components/`)
- `Breadcrumb.tsx`
- `FiltersBar.tsx`
- `Pager.tsx`
- `ProgramTile.tsx`, `ProgramsGrid.tsx`
- `AnimalListingCard.tsx`

### Shared UI (in `packages/ui/src/components/`)
- `Button`, `Input`, `Select`, `Card`
- `EmptyState`, `Badge`, `Tabs`
- `Dialog`, `Popover`, `Toast`
- `Table` components, `SearchBar`

---

## Implementation Priorities

### Phase 1: Core Browse Experience

#### 1.1 Enhance Browse Breeders Page
**File**: `apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx`

**Requirements**:
- Implement `FilterPanel` component (species, location, breeds)
- Add pagination using `GET /breeders?limit=24&offset=X`
- Add loading skeleton state
- Implement empty state when no results

**API**: `GET /api/v1/marketplace/breeders`

```typescript
// Expected data shape from API
interface BreederSummary {
  tenantSlug: string;
  businessName: string;
  location: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;
}
```

#### 1.2 Enhance Breeder Profile Page
**File**: `apps/marketplace/src/marketplace/pages/BreederPage.tsx`

**Requirements**:
- Display all profile sections from API response
- Implement "Join Waitlist" button (opens modal for programs with `openWaitlist: true`)
- Implement "Contact Breeder" button (uses messaging party endpoint)
- Show business hours, credentials, policies
- Mobile-responsive layout

**API**: `GET /api/v1/marketplace/breeders/:tenantSlug`

#### 1.3 Create Waitlist Join Modal
**File**: `apps/marketplace/src/marketplace/components/WaitlistModal.tsx`

**Requirements**:
- Form fields: name, email, phone (optional), message (optional)
- Program selector if breeder has multiple programs
- Submit to `POST /api/v1/marketplace/waitlist/:tenantSlug`
- Success confirmation with link to "My Waitlist Positions"

---

### Phase 2: Saved & Waitlist Features

#### 2.1 Saved Listings Page
**File**: `apps/marketplace/src/marketplace/pages/SavedListingsPage.tsx`

**Requirements**:
- Grid of `ServiceCard` components
- Unsave action with optimistic update
- Handle unavailable listings (grayed, badge)
- Empty state when no saved items
- Pagination

**API**: `GET /api/v1/marketplace/saved`

#### 2.2 Waitlist Positions Page
**File**: `apps/marketplace/src/marketplace/pages/WaitlistPositionsPage.tsx`

**Requirements**:
- List of `InquiryCard` components showing status
- Status badges: Pending, Approved, Deposit Due, Rejected
- "Pay Deposit" button triggers `POST /invoices/:id/checkout`
- Link to breeder profile

**API**: `GET /api/v1/marketplace/waitlist/my-requests`

#### 2.3 Save Button Integration
Add save/unsave functionality to `ServiceCard`:
- Check saved status: `GET /saved/check/:listingId`
- Save: `POST /saved` with `{ listingId }`
- Unsave: `DELETE /saved/:listingId`
- Optimistic UI update

---

### Phase 3: Navigation & Layout

#### 3.1 TopNav Component
**File**: `apps/marketplace/src/layout/TopNav.tsx`

**Requirements**:
- Logo linking to home
- Navigation: Browse dropdown, Messages, Saved
- Notification badge from `GET /notifications/counts`
- User avatar dropdown (Account, Settings, Logout)
- Responsive: collapses to hamburger on mobile

#### 3.2 BottomTabBar Component (Mobile)
**File**: `apps/marketplace/src/layout/BottomTabBar.tsx`

**Requirements**:
- Fixed bottom navigation for mobile (<768px)
- Tabs: Home, Browse, Messages, Saved, Account
- Active state indicator
- Badge counts for Messages and Saved

#### 3.3 Update MarketplaceLayout
**File**: `apps/marketplace/src/layout/MarketplaceLayout.tsx`

**Requirements**:
- Include TopNav for desktop
- Include BottomTabBar for mobile
- Handle standalone vs embedded entry points
- Notification polling every 60 seconds

---

### Phase 4: Service Marketplace

#### 4.1 Enhance Services Browse Page
**File**: `apps/marketplace/src/marketplace/pages/ServicesPage.tsx`

**Requirements**:
- Filter by category, subcategory, location, price range
- Sort options: rating, price, newest
- Grid of `ServiceCard` components
- Pagination

**API**: `GET /api/v1/marketplace/public/listings`

#### 4.2 Create Service Detail Page
**File**: `apps/marketplace/src/marketplace/pages/ServiceDetailPage.tsx`

**Requirements**:
- Image gallery (hero + thumbnails)
- Title, price, description
- Provider info with rating
- Location and service area
- Contact button (creates message thread)
- Save button

**API**: `GET /api/v1/marketplace/public/listings/:slug`

---

### Phase 5: Buyer Dashboard

#### 5.1 Buyer Dashboard Page
**File**: `apps/marketplace/src/buyer/pages/BuyerDashboardPage.tsx`

**Requirements**:
- Overview stats (unread messages, pending waitlist, saved count)
- Recent messages preview (3 items)
- Recent saved listings (4 items)
- Waitlist status summary
- Quick actions

**APIs**:
- `GET /notifications/counts`
- `GET /messages/threads?limit=3`
- `GET /saved?limit=4`
- `GET /waitlist/my-requests`

---

## Component Specifications

### ServiceCard
**Props**:
```typescript
interface ServiceCardProps {
  id: number;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  priceCents: string | null;
  priceType: 'fixed' | 'starting_at' | 'hourly' | 'contact';
  category: string;
  city: string | null;
  state: string | null;
  provider: {
    id: number;
    businessName: string;
    averageRating: string;
    totalReviews: number;
    verifiedProvider: boolean;
  };
  isSaved?: boolean;
  onSaveToggle?: () => void;
  onClick?: () => void;
}
```

### ProgramCard (for Breeders)
**Props**:
```typescript
interface ProgramCardProps {
  tenantSlug: string;
  businessName: string;
  location: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;
  programCount?: number;
  onClick?: () => void;
}
```

### InquiryCard (Waitlist Entry)
**Props**:
```typescript
interface InquiryCardProps {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  statusDetail: string;
  breederName: string | null;
  breederSlug: string | null;
  programName: string | null;
  submittedAt: string;
  invoice?: {
    id: number;
    status: string;
    totalCents: number;
    balanceCents: number;
    dueAt: string;
  } | null;
  onPayDeposit?: (invoiceId: number) => void;
}
```

---

## API Client Setup

### Recommended Structure
```typescript
// apps/marketplace/src/api/marketplace-api.ts

const BASE_URL = '/api/v1/marketplace';

export const marketplaceApi = {
  // Breeders
  getBreeders: (params: { limit?: number; offset?: number }) =>
    fetch(`${BASE_URL}/breeders?${new URLSearchParams(params)}`).then(r => r.json()),

  getBreeder: (slug: string) =>
    fetch(`${BASE_URL}/breeders/${slug}`).then(r => r.json()),

  getBreederMessaging: (slug: string) =>
    fetch(`${BASE_URL}/breeders/${slug}/messaging`).then(r => r.json()),

  // Waitlist
  joinWaitlist: (tenantSlug: string, data: WaitlistRequest) =>
    fetch(`${BASE_URL}/waitlist/${tenantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  getMyWaitlistRequests: () =>
    fetch(`${BASE_URL}/waitlist/my-requests`).then(r => r.json()),

  // Saved
  getSavedListings: (params: { page?: number; limit?: number }) =>
    fetch(`${BASE_URL}/saved?${new URLSearchParams(params)}`).then(r => r.json()),

  saveListing: (listingId: number) =>
    fetch(`${BASE_URL}/saved`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    }).then(r => r.json()),

  unsaveListing: (listingId: number) =>
    fetch(`${BASE_URL}/saved/${listingId}`, { method: 'DELETE' }).then(r => r.json()),

  checkSaved: (listingId: number) =>
    fetch(`${BASE_URL}/saved/check/${listingId}`).then(r => r.json()),

  // Notifications
  getNotificationCounts: () =>
    fetch(`${BASE_URL}/notifications/counts`).then(r => r.json()),

  // Service Listings
  getListings: (params: ListingsParams) =>
    fetch(`${BASE_URL}/public/listings?${new URLSearchParams(params)}`).then(r => r.json()),

  getListing: (slug: string) =>
    fetch(`${BASE_URL}/public/listings/${slug}`).then(r => r.json()),

  // Invoices
  createCheckout: (invoiceId: number) =>
    fetch(`${BASE_URL}/invoices/${invoiceId}/checkout`, { method: 'POST' }).then(r => r.json()),
};
```

---

## Styling Guidelines

### Design Tokens (from existing codebase)
```css
/* Use existing CSS variables */
--brand-orange: /* Primary accent */
--portal-card: /* Card background */
--portal-card-hover: /* Card hover state */
--border-subtle: /* Subtle borders */
--border-default: /* Default borders */
--text-tertiary: /* Tertiary text */
--text-secondary: /* Secondary text */
--accent: /* Accent color */
```

### Component Classes (existing patterns)
```tsx
// Card pattern
<div className="rounded-portal border border-border-subtle bg-portal-card p-5 hover:bg-portal-card-hover">

// Button pattern
<button className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90">

// Text hierarchy
<h1 className="text-[28px] font-bold text-white tracking-tight">
<p className="text-sm text-text-tertiary">
```

### Mobile Breakpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

---

## Routes to Add

Update `apps/marketplace/src/routes/MarketplaceRoutes.tsx`:

```tsx
// New routes needed
<Route path="/saved" element={<SavedListingsPage />} />
<Route path="/waitlist" element={<WaitlistPositionsPage />} />
<Route path="/services/:slug" element={<ServiceDetailPage />} />
<Route path="/dashboard" element={<BuyerDashboardPage />} />
```

---

## Testing Checklist

For each implemented page/component, verify:

- [ ] Loading state displays skeleton
- [ ] Empty state displays appropriate message
- [ ] Error state handles API failures gracefully
- [ ] Mobile layout is responsive
- [ ] Keyboard navigation works
- [ ] ARIA labels present for accessibility
- [ ] Links navigate correctly
- [ ] Forms validate before submit
- [ ] Optimistic updates work correctly
- [ ] Auth-required actions redirect to login if not authenticated

---

## Implementation Order

### Priority: Replace marketplace.breederhq.test with new UI

The goal is to replace the existing standalone marketplace site with the new design. Start with the core user-facing pages first.

**Step 1: Layout Shell**
1. `MarketplaceLayout.tsx` - Update with new TopNav design
2. `TopNav.tsx` - Create/update navigation header
3. Mobile: Add `BottomTabBar.tsx` for mobile nav

**Step 2: Home Page Redesign**
4. `HomePage.tsx` - Implement new landing page per [page-specifications-complete.md](page-specifications-complete.md) Section 3.8

**Step 3: Browse Breeders Flow**
5. `BreedersIndexPage.tsx` - Grid with filters, pagination
6. `ProgramCard.tsx` - Breeder card component
7. `BreederPage.tsx` - Full profile page
8. `WaitlistModal.tsx` - Join waitlist form

**Step 4: Browse Services Flow**
9. `ServicesPage.tsx` - Grid with filters
10. `ServiceCard.tsx` - Service listing card
11. `ServiceDetailPage.tsx` - Service detail page

**Step 5: Authenticated Features**
12. `SavedListingsPage.tsx` - Saved items
13. `WaitlistPositionsPage.tsx` - Waitlist status
14. `BuyerDashboardPage.tsx` - Buyer overview

**Step 6: Polish**
15. Notification badge integration
16. Mobile responsive fixes
17. Loading/error states

---

## Notes

- Prefer editing existing files over creating new ones
- Reuse components from `packages/ui` when available
- Follow existing code patterns in the codebase
- All text should be plain (no emojis) unless explicitly in design
- Use optimistic updates for save/unsave actions
- Poll notifications every 60 seconds when authenticated
- Handle both standalone and embedded entry points

---

*Document generated: 2026-01-12*
*Status: Ready for implementation*
