# Frontend Revision Prompt: Marketplace UI Alignment

**Date**: 2026-01-12
**Priority**: Critical
**From**: UI/UX Design Panel
**Context**: Post-implementation audit identified significant deviations from specification

---

## Situation

We've audited the current marketplace implementation against our design specifications. While some pages (Home, Dashboard, Waitlist) are reasonably aligned, others (Breeders, Services, Mobile) have critical gaps. **You must stop adding new features and focus on bringing existing pages into specification compliance.**

---

## Critical Fixes (P0 - Do First)

### 1. Implement BottomTabBar (Mobile Navigation)

**Current State**: No mobile navigation exists
**Specification**: [component-specifications-complete.md](../component-specifications-complete.md) Section 4.2

**Create**: `apps/marketplace/src/layout/BottomTabBar.tsx`

```
┌────────────────────────────────────────────────────┐
│  🏠      🔍       💬        ♡        👤            │
│ Home   Browse  Messages  Saved   Account          │
└────────────────────────────────────────────────────┘
```

**Requirements**:
- Fixed to bottom of viewport on screens < 768px
- Hide TopNav on mobile, show only logo
- Active tab indicator (orange underline or fill)
- Badge counts on Messages and Saved from `GET /notifications/counts`
- 44px minimum height for touch targets
- z-index above content

**Integration**: Wrap in `MarketplaceLayout.tsx`:
```tsx
{isMobile ? <BottomTabBar /> : null}
```

---

### 2. Rebuild Breeders Index Page

**Current State**: Shows single card in list format, no visual appeal
**Specification**: [page-specifications-complete.md](../page-specifications-complete.md) Section 3.13 (Programs List maps to Breeders)

**File**: `apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx`

**Required Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Breeders                                                │
│ Find verified breeders and their programs               │
├─────────────────────────────────────────────────────────┤
│ [🔍 Search breeders...]                                 │
├─────────────────────────────────────────────────────────┤
│ Filters: [All Species ▼] [Location ▼] [Sort: A-Z ▼]    │
├─────────────────────────────────────────────────────────┤
│ 42 breeders                                             │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ProgramCrd│ │ProgramCrd│ │ProgramCrd│ │ProgramCrd│   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│ │ProgramCrd│ │ProgramCrd│ │ProgramCrd│ │ProgramCrd│   │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│              [1] [2] [3] ... [10] [→]                   │
└─────────────────────────────────────────────────────────┘
```

**Use ProgramCard component** (create if doesn't exist):

```tsx
interface ProgramCardProps {
  tenantSlug: string;
  businessName: string;
  location: string | null;
  breeds: Array<{ name: string; species: string | null }>;
  logoAssetId: string | null;
  isVerified?: boolean;
}

function ProgramCard({ tenantSlug, businessName, location, breeds, logoAssetId, isVerified }: ProgramCardProps) {
  return (
    <Link to={`/breeders/${tenantSlug}`} className="block group">
      <div className="rounded-xl border border-border-subtle bg-portal-card p-5 h-full transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-14 w-14 rounded-full bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center flex-shrink-0">
            {logoAssetId ? (
              <img src={`/api/assets/${logoAssetId}`} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[hsl(var(--brand-orange))]">
                {businessName[0]}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate group-hover:text-[hsl(var(--brand-orange))] transition-colors">
                {businessName}
              </h3>
              {isVerified && <VerificationBadge />}
            </div>
            {location && (
              <p className="text-sm text-text-tertiary mt-0.5">{location}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {breeds.slice(0, 3).map((breed, i) => (
                <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-secondary">
                  {breed.name}
                </span>
              ))}
              {breeds.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-border-default text-text-tertiary">
                  +{breeds.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

**Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`

---

### 3. Implement VerificationBadge Component

**Current State**: Does not exist
**Specification**: [component-specifications-complete.md](../component-specifications-complete.md) - Specialized Components

**Create**: `apps/marketplace/src/marketplace/components/VerificationBadge.tsx`

```tsx
interface VerificationBadgeProps {
  level?: 'basic' | 'verified' | 'premium';
  size?: 'sm' | 'md';
}

export function VerificationBadge({ level = 'verified', size = 'sm' }: VerificationBadgeProps) {
  const colors = {
    basic: 'bg-gray-500/20 text-gray-400',
    verified: 'bg-green-500/20 text-green-400',
    premium: 'bg-amber-500/20 text-amber-400',
  };

  const icons = {
    basic: null,
    verified: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    premium: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  };

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colors[level]} ${sizeClasses}`}>
      {icons[level]}
      <span className="capitalize">{level}</span>
    </span>
  );
}
```

**Use on**: ProgramCard, ServiceCard, Breeder profile header

---

## High Priority Fixes (P1)

### 4. Fix ServiceCard on Services Page

**Current State**: Text-only cards, no images or ratings
**Location**: `apps/marketplace/src/marketplace/pages/ServicesPage.tsx`

**Required Card Structure**:
```
┌─────────────────────────────────────────┐
│ [Cover Image - 4:3 aspect ratio]        │
│                                         │
├─────────────────────────────────────────┤
│ [Stud Service]           ⭐ 4.8 (24)   │
│                                         │
│ Resistance Dog Program                  │
│ Belgian Malinois trained for Agent...   │
│                                         │
│ Zion Breeding Collective               │
│ Zion, Underground                       │
│                                         │
│ $1,750                  [View provider] │
└─────────────────────────────────────────┘
```

**Changes needed**:
1. Add image placeholder/actual image at top of card
2. Add rating display (stars + count)
3. Move category badge to top-left inside image area or just below
4. Ensure hover state: `-translate-y-0.5 shadow-lg`

---

### 5. Add Breadcrumb Navigation

**Create**: `apps/marketplace/src/marketplace/components/Breadcrumb.tsx` (enhance existing if present)

**Usage**: Add to all interior pages

```tsx
<Breadcrumb items={[
  { label: 'Home', href: '/' },
  { label: 'Breeders', href: '/breeders' },
  { label: breeder.businessName }, // current page, no href
]} />
```

**Styling**:
```tsx
function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-text-tertiary mb-6">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRightIcon className="h-4 w-4" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-white transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
```

---

### 6. Standardize Typography

**All page titles must use**:
```tsx
<h1 className="text-[28px] font-bold text-white tracking-tight mb-2">
  Page Title
</h1>
<p className="text-text-secondary mb-6">
  Page subtitle/description
</p>
```

**Pages to fix**:
- Home: Currently 48px, change to 28px (or keep 48px only for hero)
- Breeders: Currently 24px, change to 28px
- Services: Verify matches
- Animals: Verify matches

---

### 7. Add Filter Panel Controls

**Location**: Animals page filter panel

**Add at bottom of filter panel**:
```tsx
<div className="flex gap-2 mt-6 pt-4 border-t border-border-subtle">
  <button
    onClick={clearFilters}
    className="flex-1 px-4 py-2 text-sm text-text-secondary hover:text-white transition-colors"
  >
    Clear All
  </button>
  <button
    onClick={applyFilters}
    className="flex-1 px-4 py-2 text-sm bg-[hsl(var(--brand-orange))] text-white rounded-lg hover:bg-[hsl(var(--brand-orange))]/90"
  >
    Apply Filters
  </button>
</div>
```

---

## Medium Priority Fixes (P2)

### 8. Add Skeleton Loaders to Browse Pages

**Breeders page**: Show 8 skeleton ProgramCards while loading
**Services page**: Show 6 skeleton ServiceCards while loading

```tsx
function ProgramCardSkeleton() {
  return (
    <div className="rounded-xl border border-border-subtle bg-portal-card p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-border-default" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-border-default rounded w-3/4" />
          <div className="h-3 bg-border-default rounded w-1/2" />
          <div className="flex gap-1.5 mt-2">
            <div className="h-5 w-16 bg-border-default rounded-full" />
            <div className="h-5 w-20 bg-border-default rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 9. Consistent Hover States

**All cards must have**:
```css
transition-all hover:bg-portal-card-hover hover:border-border-default hover:-translate-y-0.5 hover:shadow-lg
```

**Verify on**:
- Home page category tiles ✓ (already has)
- Breeders page cards (needs implementation)
- Services page cards (needs implementation)
- Saved page cards (verify)

---

### 10. Empty State Illustrations

**Replace text-only empty states with visual empty states**:

```tsx
function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-border-default flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-text-tertiary max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
```

---

## Implementation Order

1. **BottomTabBar** - Critical for mobile (1 hour)
2. **VerificationBadge** - Needed for cards (30 min)
3. **ProgramCard** - Needed for Breeders (1 hour)
4. **Breeders page rebuild** - Uses ProgramCard (2 hours)
5. **ServiceCard image/rating** - Services page fix (1 hour)
6. **Breadcrumb** - All pages (1 hour)
7. **Typography standardization** - All pages (30 min)
8. **Skeleton loaders** - Browse pages (1 hour)
9. **Filter panel controls** - Animals page (30 min)
10. **Hover state audit** - All cards (30 min)

---

## Verification Checklist

After completing revisions, verify:

- [ ] BottomTabBar visible on mobile < 768px
- [ ] TopNav hidden on mobile
- [ ] Breeders page shows grid of ProgramCards
- [ ] ProgramCards have avatar, name, location, breeds, verification badge
- [ ] ServiceCards have image area, rating, hover effect
- [ ] Breadcrumbs on: Breeders, Animals, Services, Saved, Waitlist, individual detail pages
- [ ] All page titles are 28px bold
- [ ] All cards have hover translate + shadow effect
- [ ] Skeleton loaders appear while data loads
- [ ] Empty states have icon, title, description, action button

---

## Reference Documents

- [page-specifications-complete.md](../page-specifications-complete.md)
- [component-specifications-complete.md](../component-specifications-complete.md)
- [api-to-component-mapping.md](../api-to-component-mapping.md)
- [design-panel-critique.md](design-panel-critique.md)

---

*Revision prompt generated by UI/UX Design Panel*
*Expected completion: After P0+P1 fixes, mobile will be functional and browse pages will match specification*
