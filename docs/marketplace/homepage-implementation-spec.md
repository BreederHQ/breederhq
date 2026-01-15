# Marketplace Homepage Implementation Specification

**Date**: 2026-01-15
**Target File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`
**Priority**: P1 - Critical for marketplace launch

---

## Overview

This document provides exact implementation instructions for fixing identified issues with the marketplace homepage. Each task includes the specific file location, code changes required, and acceptance criteria.

---

## Task 1: Add Trust Bar Component Below Hero

**Priority**: P1
**Estimated Effort**: 2-3 hours
**Dependencies**: API endpoint for aggregate stats (or hardcoded initial values)

### 1.1 Create TrustBar Component

**Create new file**: `apps/marketplace/src/marketplace/components/TrustBar.tsx`

```tsx
// apps/marketplace/src/marketplace/components/TrustBar.tsx
// Trust bar showing aggregate marketplace stats - builds credibility for new visitors

import * as React from "react";

interface TrustBarProps {
  stats?: {
    breederCount: number;
    animalCount: number;
    reviewCount: number;
  };
  loading?: boolean;
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="12" cy="16" rx="4" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="7" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="17" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="10" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="14" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  }
  return `${count}+`;
}

export function TrustBar({ stats, loading }: TrustBarProps) {
  // Default stats for cold-start (update these as real data grows)
  const displayStats = stats || {
    breederCount: 0,
    animalCount: 0,
    reviewCount: 0,
  };

  // Don't show trust bar if all stats are zero (true cold start)
  // Instead show the "Join early" messaging
  const hasStats = displayStats.breederCount > 0 || displayStats.animalCount > 0;

  if (loading) {
    return (
      <div className="flex justify-center gap-8 md:gap-12 py-4 border-y border-border-subtle bg-portal-card/50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-5 h-5 bg-border-default rounded" />
            <div className="h-4 w-24 bg-border-default rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Cold start variant - no stats yet
  if (!hasStats) {
    return (
      <div className="flex justify-center py-4 border-y border-border-subtle bg-portal-card/50">
        <p className="text-sm text-text-secondary">
          <span className="text-[hsl(var(--brand-orange))] font-medium">New marketplace</span>
          {" · "}Verified breeders joining daily
        </p>
      </div>
    );
  }

  // Normal variant with stats
  return (
    <div
      className="flex flex-wrap justify-center gap-6 md:gap-12 py-4 border-y border-border-subtle bg-portal-card/50"
      role="region"
      aria-label="Marketplace statistics"
    >
      {displayStats.breederCount > 0 && (
        <div className="flex items-center gap-2">
          <ShieldIcon className="w-5 h-5 text-green-400" />
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-white">{formatCount(displayStats.breederCount)}</span>
            {" "}Verified Breeders
          </span>
        </div>
      )}

      {displayStats.animalCount > 0 && (
        <div className="flex items-center gap-2">
          <PawIcon className="w-5 h-5 text-[hsl(var(--brand-orange))]" />
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-white">{formatCount(displayStats.animalCount)}</span>
            {" "}Animals Listed
          </span>
        </div>
      )}

      {displayStats.reviewCount > 0 && (
        <div className="flex items-center gap-2">
          <StarIcon className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-text-secondary">
            <span className="font-semibold text-white">{formatCount(displayStats.reviewCount)}</span>
            {" "}Reviews
          </span>
        </div>
      )}
    </div>
  );
}

export default TrustBar;
```

### 1.2 Add API Function for Stats

**File**: `apps/marketplace/src/api/client.ts`

Add this function (or update if similar exists):

```tsx
export async function getMarketplaceStats(): Promise<{
  breederCount: number;
  animalCount: number;
  reviewCount: number;
}> {
  // TODO: Replace with actual API call when endpoint exists
  // For now, aggregate from existing endpoints
  try {
    const [programs, offspring] = await Promise.all([
      getPrograms({ limit: 1 }),
      getPublicOffspringGroups({ limit: 1 }),
    ]);

    return {
      breederCount: programs.total || 0,
      animalCount: offspring.total || 0,
      reviewCount: 0, // Reviews not yet implemented
    };
  } catch {
    return { breederCount: 0, animalCount: 0, reviewCount: 0 };
  }
}
```

### 1.3 Integrate TrustBar into HomePage

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Add import at top** (around line 17):
```tsx
import { TrustBar } from "../components/TrustBar";
import { getMarketplaceStats } from "../../api/client";
```

**Add state and effect in HomePage component** (inside `HomePage` function, before return):
```tsx
const [marketplaceStats, setMarketplaceStats] = React.useState<{
  breederCount: number;
  animalCount: number;
  reviewCount: number;
} | null>(null);
const [statsLoading, setStatsLoading] = React.useState(true);

React.useEffect(() => {
  let dead = false;

  async function fetchStats() {
    try {
      const stats = await getMarketplaceStats();
      if (!dead) setMarketplaceStats(stats);
    } catch (err) {
      console.error("Failed to fetch marketplace stats:", err);
    } finally {
      if (!dead) setStatsLoading(false);
    }
  }

  fetchStats();
  return () => { dead = true; };
}, []);
```

**Update return statement** (around line 1326):
```tsx
return (
  <div className="space-y-8 pb-0">
    <HeroSection />
    <TrustBar stats={marketplaceStats || undefined} loading={statsLoading} />
    <RecentListingsSection />
    <TrustSection />
    <CTASection />
  </div>
);
```

### Acceptance Criteria
- [ ] Trust bar displays below hero section
- [ ] Shows skeleton loader while fetching
- [ ] Shows "New marketplace" message when stats are zero
- [ ] Shows formatted stats when data exists
- [ ] Responsive on mobile (wraps gracefully)

---

## Task 2: Fix Empty State Handling

**Priority**: P1
**Estimated Effort**: 3-4 hours
**Dependencies**: Copy content from copywriter (see separate brief)

### 2.1 Create EmptyState Component

**Create new file**: `apps/marketplace/src/marketplace/components/EmptyState.tsx`

```tsx
// apps/marketplace/src/marketplace/components/EmptyState.tsx
// Reusable empty state component for marketplace sections

import * as React from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  variant: "listings" | "breeders" | "services";
  showCTA?: boolean;
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="12" cy="16" rx="4" ry="3" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="7" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="17" cy="10" rx="2" ry="2.5" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="10" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="14" cy="6" rx="1.5" ry="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const EMPTY_STATE_CONTENT = {
  listings: {
    icon: PawIcon,
    title: "New animals coming soon",
    description: "Breeders are setting up their programs. Check back soon or browse our verified breeders.",
    ctaText: "Browse Breeders",
    ctaHref: "/breeders",
    altCtaText: "List Your Animals",
    altCtaHref: "https://breederhq.com",
    altCtaExternal: true,
  },
  breeders: {
    icon: UsersIcon,
    title: "Breeders are joining",
    description: "Our marketplace is growing. Be among the first to connect with verified breeding programs.",
    ctaText: "Get Notified",
    ctaHref: "#notify", // TODO: Implement notification signup
    altCtaText: "Join as a Breeder",
    altCtaHref: "https://breederhq.com",
    altCtaExternal: true,
  },
  services: {
    icon: BriefcaseIcon,
    title: "Services launching soon",
    description: "Professional animal services are being added. Interested in offering your services?",
    ctaText: "Learn More",
    ctaHref: "/services",
    altCtaText: "Offer Your Services",
    altCtaHref: "/provider",
    altCtaExternal: false,
  },
};

export function EmptyState({ variant, showCTA = true }: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[variant];
  const Icon = content.icon;

  return (
    <div className="text-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-border-default/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{content.title}</h3>
      <p className="text-sm text-text-tertiary max-w-md mx-auto mb-6">
        {content.description}
      </p>
      {showCTA && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={content.ctaHref}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[hsl(var(--brand-blue))] text-white text-sm font-medium hover:bg-[hsl(var(--brand-blue))]/90 transition-colors"
          >
            {content.ctaText}
          </Link>
          {content.altCtaExternal ? (
            <a
              href={content.altCtaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-border-subtle text-text-secondary text-sm font-medium hover:text-white hover:border-border-default transition-colors"
            >
              {content.altCtaText}
            </a>
          ) : (
            <Link
              to={content.altCtaHref}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-border-subtle text-text-secondary text-sm font-medium hover:text-white hover:border-border-default transition-colors"
            >
              {content.altCtaText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
```

### 2.2 Update RecentListingsSection

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Find and replace** the `RecentListingsSection` function (lines 478-551):

```tsx
function RecentListingsSection() {
  const [listings, setListings] = React.useState<FeaturedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;

    async function fetchListings() {
      try {
        const result = await getPublicOffspringGroups({ limit: 4 });
        if (dead) return;

        const items: FeaturedItem[] = (result.items || []).map((l) => ({
          id: String(l.id),
          type: "animal" as const,
          title: l.title || `${l.breed || l.species} Offspring`,
          subtitle: l.breeder?.name || "Breeder",
          href:
            l.breeder?.slug && l.listingSlug
              ? `/programs/${l.breeder.slug}/offspring-groups/${l.listingSlug}`
              : "/animals",
          price: l.priceMinCents ? formatCents(l.priceMinCents) : null,
          imageUrl: l.coverImageUrl,
        }));

        setListings(items);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchListings();
    return () => { dead = true; };
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Recent Listings</h2>
        <Link
          to="/animals"
          className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-border-default" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-border-default rounded w-3/4" />
                <div className="h-3 bg-border-default rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState variant="listings" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {listings.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
```

### 2.3 Update RecentBreedersSection

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Find and replace** the `RecentBreedersSection` function (lines 615-686):

```tsx
function RecentBreedersSection() {
  const [breeders, setBreeders] = React.useState<BreederCardData[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;

    async function fetchBreeders() {
      try {
        const result = await getPrograms({ limit: 4 });
        if (dead) return;

        const items: BreederCardData[] = (result.items || []).map((b, idx) => ({
          id: `${b.slug}-${idx}`,
          name: b.name,
          slug: b.slug,
          species: Array.isArray(b.species) ? b.species : (b.species ? [b.species] : []),
          breed: b.breed || null,
          location: b.location || null,
          imageUrl: b.photoUrl || null,
          isVerified: b.isVerified ?? false, // Use actual API value
        }));

        setBreeders(items);
      } catch (err) {
        console.error("Failed to fetch breeders:", err);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchBreeders();
    return () => { dead = true; };
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Breeders</h2>
        <Link
          to="/breeders"
          className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-portal-card overflow-hidden animate-pulse">
              <div className="h-24 bg-border-default" />
              <div className="p-4 pt-8">
                <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
                <div className="h-3 bg-border-default rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : breeders.length === 0 ? (
        <EmptyState variant="breeders" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {breeders.map((breeder) => (
            <BreederCard key={breeder.id} breeder={breeder} />
          ))}
        </div>
      )}
    </section>
  );
}
```

### 2.4 Update ServicesSection

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Find and replace** the `ServicesSection` function (lines 824-901):

```tsx
function ServicesSection() {
  const [services, setServices] = React.useState<FeaturedItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let dead = false;

    async function fetchServices() {
      try {
        const result = await getPublicServices({ limit: 4 });
        if (dead) return;

        const items: FeaturedItem[] = (result.items || []).map((s) => ({
          id: String(s.id),
          type: "service" as const,
          title: s.title,
          subtitle: s.provider?.name || "Service Provider",
          href: s.provider?.slug ? `/breeders/${s.provider.slug}` : "/services",
          price: s.priceCents ? formatCents(s.priceCents) : null,
        }));

        setServices(items);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    fetchServices();
    return () => { dead = true; };
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Services</h2>
        <Link
          to="/services"
          className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-1"
        >
          View all
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border-subtle bg-portal-card p-5 animate-pulse">
              <div className="h-4 bg-border-default rounded w-3/4 mb-2" />
              <div className="h-3 bg-border-default rounded w-1/2 mb-3" />
              <div className="h-3 bg-border-default rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState variant="services" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((service) => (
            <Link key={service.id} to={service.href} className="block group">
              <div className="rounded-xl border border-border-subtle bg-portal-card p-5 h-full transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
                <h3 className="font-semibold text-white mb-1 line-clamp-1 group-hover:text-[hsl(var(--brand-orange))] transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-text-tertiary line-clamp-1 mb-2">{service.subtitle}</p>
                {service.price && (
                  <p className="text-sm font-medium text-[hsl(var(--brand-orange))]">{service.price}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
```

### 2.5 Add EmptyState Import

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Add import at top** (around line 17):
```tsx
import { EmptyState } from "../components/EmptyState";
```

### Acceptance Criteria
- [ ] Listings section shows empty state when no data
- [ ] Breeders section shows empty state when no data
- [ ] Services section shows empty state when no data
- [ ] Empty states have actionable CTAs
- [ ] Empty states are visually consistent

---

## Task 3: Render Category Section

**Priority**: P2
**Estimated Effort**: 30 minutes
**Dependencies**: None

### 3.1 Update HomePage Return Statement

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Find** the return statement in the `HomePage` component (around line 1326) and **replace**:

```tsx
// OLD:
return (
  <div className="space-y-8 pb-0">
    <HeroSection />
    <RecentListingsSection />
    <TrustSection />
    <CTASection />
  </div>
);

// NEW:
return (
  <div className="space-y-8 pb-0">
    <HeroSection />
    <TrustBar stats={marketplaceStats || undefined} loading={statsLoading} />
    <CategorySection />
    <RecentListingsSection />
    <RecentBreedersSection />
    <TrustSection />
    <ServicesSection />
    <CTASection />
  </div>
);
```

### Acceptance Criteria
- [ ] Category section (Dogs, Cats, Horses, Rabbits, Other) is visible on homepage
- [ ] Breeders section is visible
- [ ] Services section is visible
- [ ] Sections display in logical order

---

## Task 4: Add Accessibility Improvements

**Priority**: P2
**Estimated Effort**: 2 hours
**Dependencies**: None

### 4.1 Fix Search Form Accessibility

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Find** the search input in `HeroSection` (around line 264) and **update**:

```tsx
// OLD:
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search breeds, breeders, or services..."
  className="w-full h-14 pl-12 pr-4 rounded-xl border border-border-subtle bg-portal-card text-white text-base placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:border-[hsl(var(--brand-orange))]"
/>

// NEW:
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search breeds, breeders, or services..."
  aria-label="Search for breeds, breeders, or services"
  autoComplete="off"
  className="w-full h-14 pl-12 pr-4 rounded-xl border border-border-subtle bg-portal-card text-white text-base placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand-orange))]/50 focus:border-[hsl(var(--brand-orange))]"
/>
```

### 4.2 Add aria-hidden to Decorative Icons

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**For ALL icon components** (lines 25-207), add `aria-hidden="true"` to each SVG. Example:

```tsx
// OLD:
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>

// NEW:
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
```

**Apply to these icons**:
- SearchIcon (line 25)
- ShieldCheckIcon (line 39)
- MessageCircleIcon (line 53)
- StarIcon (line 67)
- ArrowRightIcon (line 81)
- ChevronRightIcon (line 95)
- DogIcon (line 110)
- CatIcon (line 127)
- HorseIcon (line 145)
- RabbitIcon (line 160)
- PawIcon (line 179)
- PawFilledIcon (line 192)
- BriefcaseIcon (line 213)

### 4.3 Add Focus Ring Styling

**Ensure all interactive elements have visible focus states.** The current code uses `focus:ring-2` which is good, but verify all buttons have this.

**Check these elements have focus styles**:
- Search button (line 271-274)
- Category card links (lines 291-297, 309-315, 327-333)
- "View all" links
- CTA buttons

### 4.4 Add Skip Link (Optional Enhancement)

**File**: `apps/marketplace/src/App.tsx` or layout component

Add at the very top of the page:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[hsl(var(--brand-blue))] focus:text-white focus:rounded-lg"
>
  Skip to main content
</a>

{/* Then wrap main content with id */}
<main id="main-content">
  {/* ... */}
</main>
```

### Acceptance Criteria
- [ ] Search input has aria-label
- [ ] All decorative icons have aria-hidden="true"
- [ ] All interactive elements have visible focus states
- [ ] Screen reader can navigate the page logically

---

## Task 5: Add "How It Works" Section

**Priority**: P2
**Estimated Effort**: 2-3 hours
**Dependencies**: Copy content from copywriter

### 5.1 Create HowItWorks Component

**Create new file**: `apps/marketplace/src/marketplace/components/HowItWorks.tsx`

```tsx
// apps/marketplace/src/marketplace/components/HowItWorks.tsx
// Three-step explainer for first-time marketplace visitors

import * as React from "react";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STEPS = [
  {
    icon: SearchIcon,
    title: "Browse programs",
    description: "Search by breed, location, or species. See full breeding programs, not just listings.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Review credentials",
    description: "Check health testing, breeding history, and program details before you reach out.",
  },
  {
    icon: MessageCircleIcon,
    title: "Connect directly",
    description: "Message breeders through the platform. Ask questions, request info, schedule visits.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-white text-center mb-8">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="text-center">
              {/* Step number and icon */}
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-[hsl(var(--brand-blue))]/10 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-[hsl(var(--brand-blue))]" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[hsl(var(--brand-orange))] text-white text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
              {/* Content */}
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-text-tertiary max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks;
```

### 5.2 Add HowItWorks to HomePage

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Add import**:
```tsx
import { HowItWorks } from "../components/HowItWorks";
```

**Update return statement** to include HowItWorks:
```tsx
return (
  <div className="space-y-8 pb-0">
    <HeroSection />
    <TrustBar stats={marketplaceStats || undefined} loading={statsLoading} />
    <CategorySection />
    <RecentListingsSection />
    <HowItWorks />
    <RecentBreedersSection />
    <TrustSection />
    <ServicesSection />
    <CTASection />
  </div>
);
```

### Acceptance Criteria
- [ ] How It Works section displays 3 steps
- [ ] Each step has icon, number badge, title, and description
- [ ] Responsive layout (stacked on mobile, 3-column on desktop)
- [ ] Consistent with overall design language

---

## Task 6: Fix Hardcoded isVerified

**Priority**: P2
**Estimated Effort**: 30 minutes
**Dependencies**: API must return isVerified field

### 6.1 Update BreederCard Data Mapping

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Find** the mapping in `RecentBreedersSection` (around line 627-635) and **update**:

```tsx
// OLD:
const items: BreederCardData[] = (result.items || []).map((b, idx) => ({
  id: `${b.slug}-${idx}`,
  name: b.name,
  slug: b.slug,
  species: Array.isArray(b.species) ? b.species : (b.species ? [b.species] : []),
  breed: b.breed || null,
  location: b.location || null,
  imageUrl: b.photoUrl || null,
  isVerified: true, // All breeders on platform are verified  <-- REMOVE THIS
}));

// NEW:
const items: BreederCardData[] = (result.items || []).map((b, idx) => ({
  id: `${b.slug}-${idx}`,
  name: b.name,
  slug: b.slug,
  species: Array.isArray(b.species) ? b.species : (b.species ? [b.species] : []),
  breed: b.breed || null,
  location: b.location || null,
  imageUrl: b.photoUrl || null,
  isVerified: b.isVerified ?? false, // Use actual verification status from API
}));
```

### 6.2 Verify API Returns isVerified

**Check** `apps/marketplace/src/api/types.ts` for the Program type and ensure it includes:

```tsx
interface Program {
  // ... existing fields
  isVerified?: boolean;
}
```

**If not present**, add it and ensure the API endpoint returns this field.

### Acceptance Criteria
- [ ] isVerified value comes from API, not hardcoded
- [ ] Verification badge only shows for actually verified breeders
- [ ] No verification badge shown when isVerified is false or undefined

---

## Task 7: Improve Button Touch Targets

**Priority**: P3
**Estimated Effort**: 1 hour
**Dependencies**: None

### 7.1 Audit Button Sizes

Ensure all buttons meet 44px minimum touch target:

**Hero category card buttons** (lines 291-297):
```tsx
// Current: px-4 py-2.5 (~40px height)
// Update to: px-4 py-3 (~48px height)
className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-[#005dc3] text-sm font-medium text-white hover:bg-[#005dc3]/80 transition-colors mt-auto"
```

**CTA section buttons** (lines 921-936):
```tsx
// Current: px-6 py-3 (~48px) - OK
// These are fine
```

### 7.2 Add Touch Target Helper Class (Optional)

**File**: Add to global CSS or Tailwind config

```css
/* Ensure minimum touch target size */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

### Acceptance Criteria
- [ ] All buttons have minimum 44px height
- [ ] All tappable elements have adequate spacing
- [ ] Mobile usability improved

---

## Task 8: Add Service Provider Recruitment Section

**Priority**: P1 - Critical for marketplace growth
**Estimated Effort**: 2-3 hours
**Dependencies**: Copy content from copywriter

### Problem

The homepage does **nothing** to encourage service providers to list. A trainer, groomer, or transport company visiting the site sees a breeder marketplace with no reason to join.

### Solution

Add a dedicated `ServiceProviderCTA` section that:
1. Shows the breadth of service categories (Training, Grooming, Transport, Photography, etc.)
2. Explains the value proposition (reach right clients, no fees, build reputation)
3. Has a prominent CTA to `/provider`

### Implementation

See separate spec: `docs/marketplace/homepage-service-provider-section-spec.md`

**Summary**:
1. Create `apps/marketplace/src/marketplace/components/ServiceProviderCTA.tsx`
2. Add to HomePage between TrustSection and CTASection
3. Shows 6+ service category badges with "+10 more"
4. Three numbered value props on the right
5. Orange-themed to differentiate from blue breeder section

### Acceptance Criteria
- [ ] Service providers have dedicated recruitment section
- [ ] Service categories are visible (at least 6)
- [ ] Value proposition is clear (reach clients, no fees, build reputation)
- [ ] CTA links to /provider
- [ ] Visually distinct from breeder sections (orange vs blue)
- [ ] Mobile responsive

---

## Task 9: Update CTASection to Differentiate Breeders vs Providers

**Priority**: P2
**Estimated Effort**: 1 hour
**Dependencies**: Task 8 (ServiceProviderCTA)

### Problem

Current CTASection lumps breeders and service providers together with generic messaging.

### Solution

Split into two distinct cards:
1. **Breeder CTA** - Blue themed, speaks to breeders specifically
2. **Service Provider CTA** - Orange themed (or remove if Task 8 handles this)

### Implementation

If ServiceProviderCTA (Task 8) is implemented, update CTASection to be **breeder-only**:

```tsx
function CTASection() {
  return (
    <section className="rounded-2xl border border-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/5 p-8 md:p-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold text-white mb-2">
            Are you a breeder?
          </h2>
          <p className="text-text-secondary">
            Already using BreederHQ to manage your program? Showcase your animals and breeding program to qualified buyers.
          </p>
        </div>
        <a
          href="https://breederhq.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-blue))] text-white font-medium hover:bg-[hsl(var(--brand-blue))]/90 transition-colors whitespace-nowrap"
        >
          Join as a Breeder
          <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
```

### Acceptance Criteria
- [ ] Breeder CTA has specific messaging for breeders
- [ ] No longer lumps breeders and providers together
- [ ] Links to breederhq.com for breeder signup

---

## Implementation Order

1. **Task 8**: Service Provider Recruitment Section (P1) - 2-3 hours **← NEW**
2. **Task 1**: TrustBar Component (P1) - 2-3 hours
3. **Task 2**: Empty State Handling (P1) - 3-4 hours
4. **Task 9**: Update CTASection for Breeders Only (P2) - 1 hour **← NEW**
5. **Task 3**: Render Category Section (P2) - 30 min
6. **Task 4**: Accessibility Improvements (P2) - 2 hours
7. **Task 5**: How It Works Section (P2) - 2-3 hours
8. **Task 6**: Fix Hardcoded isVerified (P2) - 30 min
9. **Task 7**: Button Touch Targets (P3) - 1 hour

**Total Estimated Effort**: 15-20 hours

---

## Testing Checklist

After implementation, verify:

### Functional Testing
- [ ] Homepage loads without errors
- [ ] All sections render correctly
- [ ] Empty states display when no data
- [ ] Links navigate to correct pages
- [ ] Search form submits correctly

### Visual Testing
- [ ] Trust bar displays correctly
- [ ] Category section displays correctly
- [ ] Empty states are visually appealing
- [ ] How It Works section is aligned
- [ ] Responsive on mobile (320px - 768px)
- [ ] Responsive on tablet (768px - 1024px)
- [ ] Responsive on desktop (1024px+)

### Accessibility Testing
- [ ] Run axe DevTools - 0 critical errors
- [ ] Keyboard navigation works (Tab through all interactive elements)
- [ ] Screen reader announces content logically
- [ ] Focus states visible on all interactive elements
- [ ] Color contrast meets WCAG AA (4.5:1)

### Edge Cases
- [ ] Homepage with zero breeders
- [ ] Homepage with zero listings
- [ ] Homepage with zero services
- [ ] Homepage with all data populated
- [ ] API error handling (graceful degradation)

---

## Files Modified Summary

| File | Action | Notes |
|------|--------|-------|
| `apps/marketplace/src/marketplace/components/TrustBar.tsx` | CREATE | New component |
| `apps/marketplace/src/marketplace/components/EmptyState.tsx` | CREATE | New component |
| `apps/marketplace/src/marketplace/components/HowItWorks.tsx` | CREATE | New component |
| `apps/marketplace/src/marketplace/pages/HomePage.tsx` | MODIFY | Multiple updates |
| `apps/marketplace/src/api/client.ts` | MODIFY | Add getMarketplaceStats |
| `apps/marketplace/src/api/types.ts` | MODIFY | Ensure isVerified field |

