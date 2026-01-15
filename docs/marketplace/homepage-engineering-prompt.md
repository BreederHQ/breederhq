# Homepage Engineering Implementation Prompt

**Date**: January 15, 2026
**Source Specification**: `docs/marketplace/homepage-ux-design-specification.md`
**Target File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`
**Priority**: P0 - Critical

---

## Your Task

You are implementing the BreederHQ Marketplace homepage based on the UI/UX design specification. This homepage must equally welcome THREE distinct audiences within 3 seconds:

1. **Buyers** - Looking for animals or services
2. **Breeders** - Want to list their breeding programs and animals
3. **Service Providers** - Want to list professional services (training, grooming, transport, photography, etc.)

**Critical Requirement**: Service providers must feel just as welcomed as breeders. Neither audience is secondary.

---

## Design Specification Summary

Read the full spec at `docs/marketplace/homepage-ux-design-specification.md`. Key points:

### Homepage Section Order

```
1. HERO SECTION (with 3 pathway cards)
2. TRUST BAR (stats or cold-start messaging)
3. HOW IT WORKS (3-step explainer)
4. FEATURED CONTENT (listings, breeders, services - conditional)
5. TRUST SECTION ("Not a classified ad...")
6. DUAL RECRUITMENT (Provider + Breeder CTAs SIDE BY SIDE)
7. FOOTER
```

### Critical Design Decisions

| Decision | Implementation |
|----------|----------------|
| **Hero cards** | 3 equal pathway cards: Animals, Breeders, Services |
| **Color coding** | Blue = Breeders, Orange = Service Providers, Neutral = Buyers |
| **Recruitment CTAs** | Side-by-side on desktop, stacked (provider first) on mobile |
| **Touch targets** | 48px minimum everywhere |
| **Mobile-first** | Design for 375px first, scale up |

---

## Implementation Requirements

### 1. Hero Section

Build a hero with:

**Headline**: "THE PROFESSIONAL ANIMAL MARKETPLACE"
**Tagline**: "Breeding programs, animals, and services — all in one place."
**Search Bar**: Placeholder "Search breeds, breeders, or services..."

**Three Pathway Cards** (equal size, horizontal on desktop, stacked on mobile):

```tsx
// Card 1: Animals (Neutral)
{
  icon: PawIcon,
  title: "Animals",
  description: "Browse dogs, cats, horses, and more from verified breeders",
  primaryCTA: { label: "Browse Animals", href: "/animals" },
  variant: "neutral"
}

// Card 2: Breeders (Blue accent)
{
  icon: ShieldCheckIcon,
  title: "Breeders",
  description: "Find verified breeding programs with full transparency",
  primaryCTA: { label: "Find Breeders", href: "/breeders" },
  secondaryCTA: { label: "List Your Program", href: "https://breederhq.com", external: true },
  variant: "breeder"
}

// Card 3: Services (Orange accent)
{
  icon: BriefcaseIcon,
  title: "Services",
  description: "Training, grooming, transport, photography & more",
  primaryCTA: { label: "Find Services", href: "/services" },
  secondaryCTA: { label: "List Yours", href: "/provider" },
  variant: "provider"
}
```

**Card Styling by Variant:**
```tsx
const variantStyles = {
  neutral: "border-border-subtle bg-portal-card",
  breeder: "border-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/5",
  provider: "border-[hsl(var(--brand-orange))]/30 bg-[hsl(var(--brand-orange))]/5"
};
```

---

### 2. Trust Bar

**Component**: `TrustBar.tsx` (may already exist at `apps/marketplace/src/marketplace/components/TrustBar.tsx`)

**Behavior:**
- If stats available: Show "150+ Verified Breeders · 2,400+ Animals Listed · 340+ Reviews"
- If cold start (no stats): Show "New marketplace — Verified breeders and providers joining daily"
- Loading state: Show skeleton

**API**: Call `getMarketplaceStats()` or aggregate from existing endpoints.

---

### 3. How It Works Section

**Component**: `HowItWorks.tsx` (may already exist)

Three steps in horizontal layout (desktop) or vertical (mobile):

```tsx
const steps = [
  {
    number: 1,
    icon: SearchIcon,
    title: "Browse Programs",
    description: "Search by breed, location, or species. See full breeding programs, not just one-off listings."
  },
  {
    number: 2,
    icon: ShieldCheckIcon,
    title: "Verify Credentials",
    description: "Review health testing, breeding history, and program details before you reach out."
  },
  {
    number: 3,
    icon: MessageCircleIcon,
    title: "Connect Directly",
    description: "Message breeders through the platform. Ask questions, request info, schedule visits."
  }
];
```

---

### 4. Featured Content (Conditional)

Three sub-sections, each showing 4 cards or EmptyState:

1. **Recent Listings** - `getPublicOffspringGroups({ limit: 4 })`
2. **Breeders** - `getPrograms({ limit: 4 })`
3. **Services** - `getPublicServices({ limit: 4 })`

**EmptyState variants:**
- `listings`: "New animals coming soon" + dual CTAs
- `breeders`: "Breeders are joining" + dual CTAs
- `services`: "Services launching soon" + dual CTAs

**Important**: EmptyState must have DUAL CTAs - one for buyers, one for listers.

---

### 5. Trust Section

Single section with headline and 3 supporting points:

**Headline**: "NOT A CLASSIFIED AD. A BREEDING PROGRAM."
**Description**: "BreederHQ breeders use our platform to manage their entire program — animals, health records, pedigrees, litters. What you see here is their real operation, not a one-off listing."

**Three points:**
1. Full Program Visibility - "See their animals, breeding history, health testing, and past litters."
2. Direct Connection - "Message breeders directly. Ask questions, request more info."
3. Established Programs - "Breeders actively managing their animals and breeding plans."

---

### 6. Dual Recruitment Section (CRITICAL)

**THIS IS THE MOST IMPORTANT SECTION FOR SERVICE PROVIDER RECRUITMENT**

Two cards SIDE BY SIDE on desktop, stacked on mobile (provider first):

```tsx
<section className="grid md:grid-cols-2 gap-6">
  {/* Service Provider Card - FIRST on mobile */}
  <div className="rounded-2xl border border-[hsl(var(--brand-orange))]/30 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-transparent p-8">
    <h2>OFFER YOUR SERVICES TO THE BREEDING COMMUNITY</h2>
    <p>Trainers, groomers, transporters, photographers, vets — breeders and buyers need your expertise.</p>

    {/* Category pills */}
    <div className="flex flex-wrap gap-2">
      {["Training", "Grooming", "Transport", "Boarding", "Photography", "Veterinary"].map(cat => (
        <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
          {cat}
        </span>
      ))}
      <span className="text-text-tertiary">+10 more</span>
    </div>

    {/* Value props */}
    <ul>
      <li>✓ No platform fees</li>
      <li>✓ Direct client contact</li>
      <li>✓ Build your reputation</li>
    </ul>

    <Link to="/provider" className="bg-[hsl(var(--brand-orange))] text-white px-6 py-3 rounded-lg">
      List Your Services →
    </Link>
  </div>

  {/* Breeder Card - SECOND on mobile */}
  <div className="rounded-2xl border border-[hsl(var(--brand-blue))]/30 bg-gradient-to-br from-[hsl(var(--brand-blue))]/5 to-transparent p-8">
    <h2>ALREADY A BREEDERHQ BREEDER?</h2>
    <p>Showcase your breeding program and animals to qualified buyers actively searching for what you offer.</p>

    {/* Value props */}
    <ul>
      <li>✓ Connected to your existing BreederHQ account</li>
      <li>✓ Full program visibility</li>
      <li>✓ Direct buyer inquiries</li>
    </ul>

    <a href="https://breederhq.com" className="bg-[hsl(var(--brand-blue))] text-white px-6 py-3 rounded-lg">
      List as Breeder →
    </a>
  </div>
</section>
```

**Mobile Order**: Use `order-first` on provider card or structure HTML with provider first.

---

## Component Checklist

### New Components to Create

| Component | File Path | Purpose |
|-----------|-----------|---------|
| `HeroPathwayCard` | `components/HeroPathwayCard.tsx` | Pathway card with variant styling |
| `DualRecruitmentSection` | `components/DualRecruitmentSection.tsx` | Side-by-side provider/breeder CTAs |

### Existing Components to Update/Use

| Component | File Path | Status |
|-----------|-----------|--------|
| `TrustBar` | `components/TrustBar.tsx` | May exist - verify |
| `HowItWorks` | `components/HowItWorks.tsx` | May exist - verify |
| `EmptyState` | `components/EmptyState.tsx` | May exist - verify |
| `ServiceProviderCTA` | `components/ServiceProviderCTA.tsx` | May exist - can be integrated into DualRecruitmentSection |

---

## Accessibility Requirements (Non-Negotiable)

1. **All icons**: Add `aria-hidden="true"`
2. **Search input**: Add `aria-label="Search for breeds, breeders, or services"`
3. **TrustBar**: Add `role="region" aria-label="Marketplace statistics"`
4. **Each section**: Use `<section aria-labelledby="section-title-id">`
5. **Touch targets**: Minimum 48px height on all buttons/links
6. **Color contrast**: 4.5:1 minimum (spec validated all colors)
7. **Focus states**: Visible focus ring on all interactive elements

---

## Responsive Breakpoints

```css
/* Mobile-first approach */
/* Base: 0-767px (mobile) */
/* md: 768px+ (tablet) */
/* lg: 1024px+ (desktop) */
```

**Key Responsive Changes:**
- Hero cards: 3-col desktop → stacked mobile
- How It Works: 3-col desktop → stacked mobile
- Featured Content: 4-col desktop → 2-col mobile
- Recruitment: 2-col desktop → stacked mobile (provider first)

---

## File Structure

```
apps/marketplace/src/marketplace/
├── pages/
│   └── HomePage.tsx          # Main homepage component
├── components/
│   ├── HeroPathwayCard.tsx   # NEW: Pathway card component
│   ├── TrustBar.tsx          # Stats bar
│   ├── HowItWorks.tsx        # 3-step explainer
│   ├── EmptyState.tsx        # Empty state for sections
│   ├── ServiceProviderCTA.tsx # Provider recruitment (integrate into Dual)
│   └── DualRecruitmentSection.tsx # NEW: Side-by-side recruitment
```

---

## Testing Checklist

### Functional
- [ ] All CTAs navigate to correct destinations
- [ ] Search form submits correctly
- [ ] API data loads (listings, breeders, services)
- [ ] EmptyState displays when no data
- [ ] TrustBar shows stats OR cold-start message

### Visual
- [ ] Hero cards have correct color coding
- [ ] Recruitment cards are side-by-side on desktop
- [ ] Provider card appears FIRST on mobile
- [ ] Touch targets are 48px minimum
- [ ] Typography matches spec

### Accessibility
- [ ] Tab order is logical
- [ ] Screen reader announces content correctly
- [ ] All icons have aria-hidden
- [ ] Focus states visible
- [ ] Color contrast passes (4.5:1)

### Responsive
- [ ] Mobile (375px): Cards stack, provider first
- [ ] Tablet (768px): Transition layouts
- [ ] Desktop (1024px): Full side-by-side layouts

---

## Success Criteria

The homepage is successful when:

1. **3-Second Test**: A visitor can identify within 3 seconds that this marketplace is for buyers, breeders, AND service providers
2. **Equal Weight**: Service Provider CTA has identical visual prominence to Breeder CTA
3. **Mobile-First**: Homepage is fully functional and beautiful on 375px viewport
4. **Accessible**: Passes automated accessibility audit with 0 critical errors
5. **Conversion-Ready**: Clear paths for all three audiences to take action

---

## Reference Documents

1. **Full Design Spec**: `docs/marketplace/homepage-ux-design-specification.md`
2. **Service Provider Spec**: `docs/marketplace/homepage-service-provider-section-spec.md`
3. **Implementation Spec**: `docs/marketplace/homepage-implementation-spec.md`
4. **Copywriter Brief**: `docs/marketplace/homepage-copywriter-brief.md`

---

## Questions for Clarification

Before implementing, clarify:

1. Does `getMarketplaceStats()` API exist, or should we aggregate from existing endpoints?
2. Should seller dashboard (SellerHomePage) remain as-is, or be updated to match new design?
3. Are there existing components in the codebase that match these specs?

---

## Start Implementation

Begin with:

1. Read existing `HomePage.tsx` to understand current structure
2. Identify which components already exist vs need creation
3. Build Hero section with 3 pathway cards
4. Build Dual Recruitment section (critical for service providers)
5. Integrate remaining sections
6. Test responsive behavior
7. Run accessibility audit

**Total Estimated Effort**: 8-12 hours
