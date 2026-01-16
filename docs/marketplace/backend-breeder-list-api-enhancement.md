# Backend Enhancement: Breeder List API Enrichment

## Overview

The current `/api/v1/marketplace/breeders` endpoint returns minimal data that limits the usefulness of the breeders list view. This document specifies additional fields needed to provide a richer, more useful browsing experience.

## Current Response Schema

```typescript
interface BreederSummary {
  tenantSlug: string;
  businessName: string;
  location: string | null;
  publicLocationMode: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;
  isVerified?: boolean;
  verificationLevel?: "basic" | "verified" | "premium";
}
```

## Proposed Enhanced Response Schema

```typescript
interface BreederSummary {
  // === EXISTING FIELDS (keep as-is) ===
  tenantSlug: string;
  businessName: string;
  location: string | null;
  publicLocationMode: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;
  isVerified?: boolean;
  verificationLevel?: "basic" | "verified" | "premium";

  // === NEW FIELDS ===

  // Experience & Trust (HIGH PRIORITY)
  yearsInBusiness: number | null;        // Computed from yearEstablished
  placementCount: number;                // Total successful placements

  // Availability Status (HIGH PRIORITY - most important for buyers!)
  availabilityStatus: {
    acceptingInquiries: boolean;         // Currently accepting new inquiries
    waitlistOpen: boolean;               // Waitlist spots available
    availableNowCount: number;           // Animals/litters available immediately
    upcomingLittersCount: number;        // Expected litters in next 90 days
  };

  // Trust Badges (HIGH PRIORITY)
  badges: {
    quickResponder: boolean;             // Responds within 24 hours on average
    healthTesting: boolean;              // Performs health testing on breeding animals
    experiencedBreeder: boolean;         // 5+ successful placements
  };

  // Response Metrics (MEDIUM PRIORITY)
  averageResponseTimeHours: number | null;  // Average time to first response

  // Review Summary (MEDIUM PRIORITY)
  reviewSummary: {
    hasReviews: boolean;
    averageRating: number | null;        // 1-5 scale
    reviewCount: number;
  } | null;

  // Primary Species (MEDIUM PRIORITY - for quick scanning)
  primarySpecies: string | null;         // Most common species from breeds array
}
```

## Field Specifications

### Experience & Trust

| Field | Source | Computation |
|-------|--------|-------------|
| `yearsInBusiness` | `MarketplaceProfile.yearEstablished` | `currentYear - yearEstablished` |
| `placementCount` | Aggregate count | Count of animals with `status = 'placed'` or `'sold'` |

### Availability Status

| Field | Source | Computation |
|-------|--------|-------------|
| `acceptingInquiries` | `MarketplaceProfile.acceptingInquiries` | Direct boolean |
| `waitlistOpen` | Waitlist settings | Check if any program has open waitlist spots |
| `availableNowCount` | Animal/Offspring tables | Count where `status = 'available'` AND `availableDate <= NOW()` |
| `upcomingLittersCount` | OffspringGroup table | Count where `expectedDate` within 90 days |

### Trust Badges

| Field | Source | Computation |
|-------|--------|-------------|
| `quickResponder` | Inquiry response times | Average response time < 24 hours over last 30 days |
| `healthTesting` | `MarketplaceProfile.healthTestingPractices` | Has documented health testing protocol |
| `experiencedBreeder` | Placement count | `placementCount >= 5` |

### Response Metrics

| Field | Source | Computation |
|-------|--------|-------------|
| `averageResponseTimeHours` | Inquiry timestamps | Average of (first_response_at - created_at) for last 30 days |

### Review Summary

| Field | Source | Computation |
|-------|--------|-------------|
| `hasReviews` | Reviews table | `reviewCount > 0` |
| `averageRating` | Reviews table | `AVG(rating)` |
| `reviewCount` | Reviews table | `COUNT(*)` |

## API Query Parameters

Add support for filtering by new fields:

```
GET /api/v1/marketplace/breeders?
  // Existing
  q=<search>&
  species=<species>&
  breed=<breed>&
  location=<location>&
  sort=<sort>&
  page=<page>&
  pageSize=<pageSize>&

  // New filters
  acceptingInquiries=true&
  waitlistOpen=true&
  hasAvailableNow=true&
  hasUpcomingLitters=true&
  quickResponder=true&
  healthTesting=true&
  experiencedBreeder=true&
  minYearsInBusiness=5&
  hasReviews=true&
  minRating=4
```

## Sort Options

Add new sort options:

| Sort Value | Description |
|------------|-------------|
| `years-desc` | Most experienced first |
| `years-asc` | Newest breeders first |
| `placements-desc` | Most placements first |
| `rating-desc` | Highest rated first |
| `response-asc` | Fastest responders first |
| `available-desc` | Most availability first |

## Performance Considerations

1. **Caching**: Cache computed fields (yearsInBusiness, badges) with 1-hour TTL
2. **Aggregates**: Pre-compute counts in background job, store in `BreederStats` table
3. **Indexes**: Add indexes on:
   - `Animal.tenantId, Animal.status`
   - `OffspringGroup.tenantId, OffspringGroup.expectedDate`
   - `Inquiry.tenantId, Inquiry.createdAt, Inquiry.firstResponseAt`
   - `Review.tenantId, Review.rating`

## Migration Strategy

1. **Phase 1**: Add nullable fields to response, compute on-the-fly
2. **Phase 2**: Create `BreederStats` materialized view or table
3. **Phase 3**: Add background job to refresh stats every 15 minutes
4. **Phase 4**: Add filter query parameters
5. **Phase 5**: Add new sort options

## Frontend Usage

Once implemented, the list view can display:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo] Happy Paws Kennel  ✓Verified  ⚡Quick  🏥Health  ★5+ Placements      │
│        Denver, CO  •  8 years  •  ★ 4.8 (23 reviews)                       │
│        Golden Retriever, Labrador  +2 more                                  │
│        🟢 3 Available Now  •  2 Upcoming Litters  •  Waitlist Open         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Priority

**HIGH** - This enhancement significantly improves the buyer experience by:
1. Helping buyers identify trustworthy breeders quickly
2. Showing availability at a glance (most important buyer concern)
3. Enabling meaningful filtering and sorting
4. Building trust through transparency

## Files to Modify

### Backend
- `server/src/routes/marketplace/breeders.ts` - Add new fields to response
- `server/src/services/marketplace/breederStats.ts` - Create stats computation service
- `server/prisma/schema.prisma` - Add BreederStats model if needed

### Frontend (ready to consume once available)
- `apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx` - Update type, display new fields

## Timeline Estimate

- Phase 1 (basic fields): 1 sprint
- Phase 2-3 (optimized stats): 1 sprint
- Phase 4-5 (filters/sorts): 1 sprint

---

*Document created: 2026-01-13*
*Status: Ready for backend team review*
