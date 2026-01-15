# Service Provider Recruitment Section - Implementation Spec

**Date**: 2026-01-15
**Priority**: P1 - Critical for marketplace growth
**Problem**: Homepage does nothing to encourage service providers to list their services

---

## The Problem

Current homepage:
1. Hero "Services" card says "Explore Services" — buyer language, not provider language
2. CTA section has generic "List Services" button buried at bottom
3. No explanation of what types of services are wanted
4. No value proposition for service providers
5. TrustSection mentions services only for buyers ("Services for breeders and buyers")

A dog trainer, farrier, animal photographer, or transport company visiting the homepage has **zero reason** to think "I should list here."

---

## The Solution

Add a dedicated **Service Provider Recruitment Section** that:
1. Shows the breadth of service categories (16+ categories)
2. Explains the value proposition for providers
3. Makes the "List Services" CTA prominent and compelling
4. Addresses different provider types (breeders who offer services vs. standalone providers)

---

## Implementation

### Option A: Replace Current Services Section in TrustSection

The current TrustSection has two cards:
1. "Not a classified ad. A breeding program." (for breeders)
2. "Services for breeders and buyers." (for service BUYERS)

**Problem**: Card 2 speaks to buyers, not providers.

**Solution**: Change Card 2 to speak to BOTH buyers AND providers, or split into two sections.

---

### Option B: Add New Dedicated Provider Section (Recommended)

Add a new `ServiceProviderCTA` component between `TrustSection` and `CTASection`.

**Create file**: `apps/marketplace/src/marketplace/components/ServiceProviderCTA.tsx`

```tsx
// apps/marketplace/src/marketplace/components/ServiceProviderCTA.tsx
// Recruitment section for service providers - shows categories and value prop

import * as React from "react";
import { Link } from "react-router-dom";

// Service category icons
function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 9a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100 6 3 3 0 000-6z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M16 16V3H1v13h15zm0 0h6v-6l-3-3h-3v9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HeartPulseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 12h4l3 9 4-18 3 9h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M22 10l-10-5-10 5 10 5 10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SERVICE_CATEGORIES = [
  { icon: GraduationCapIcon, label: "Training" },
  { icon: ScissorsIcon, label: "Grooming" },
  { icon: TruckIcon, label: "Transport" },
  { icon: HomeIcon, label: "Boarding" },
  { icon: CameraIcon, label: "Photography" },
  { icon: HeartPulseIcon, label: "Veterinary" },
];

export function ServiceProviderCTA() {
  return (
    <section className="rounded-2xl border border-[hsl(var(--brand-orange))]/30 bg-gradient-to-br from-[hsl(var(--brand-orange))]/5 to-transparent p-8 md:p-10">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Value proposition */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Offer your services to the breeding community
          </h2>
          <p className="text-text-secondary mb-6 leading-relaxed">
            Trainers, groomers, transporters, photographers, vets — breeders and buyers need your expertise. List your services and connect with clients who understand the value of professional animal care.
          </p>

          {/* Service category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SERVICE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <span
                  key={cat.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-text-secondary"
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </span>
              );
            })}
            <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-text-tertiary">
              +10 more
            </span>
          </div>

          <Link
            to="/provider"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors"
          >
            List Your Services
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {/* Right: Why list here */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
              <span className="text-[hsl(var(--brand-orange))] font-bold">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Reach the right clients</h3>
              <p className="text-sm text-text-tertiary">
                Connect with serious breeders and pet owners who value quality over price.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
              <span className="text-[hsl(var(--brand-orange))] font-bold">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">No platform fees</h3>
              <p className="text-sm text-text-tertiary">
                Direct contact with clients. No commissions, no middleman fees on bookings.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[hsl(var(--brand-orange))]/10 flex items-center justify-center">
              <span className="text-[hsl(var(--brand-orange))] font-bold">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Build your reputation</h3>
              <p className="text-sm text-text-tertiary">
                Collect reviews, showcase your credentials, and stand out in your specialty.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ServiceProviderCTA;
```

### Integration into HomePage

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx`

**Add import**:
```tsx
import { ServiceProviderCTA } from "../components/ServiceProviderCTA";
```

**Update return statement** (around line 1326):
```tsx
return (
  <div className="space-y-8 pb-0">
    {/* Hero with search and primary category cards (Animals, Breeders, Services) */}
    <HeroSection />

    {/* How It Works - 3-step explainer for first-time visitors */}
    <HowItWorks />

    {/* Trust bar - marketplace stats or cold start messaging */}
    <TrustBar stats={marketplaceStats || undefined} loading={statsLoading} />

    {/* Trust section - why buy here vs elsewhere (for BUYERS) */}
    <TrustSection />

    {/* Service Provider CTA - recruitment for service providers (NEW) */}
    <ServiceProviderCTA />

    {/* Supplier CTA - breeder recruitment */}
    <CTASection />
  </div>
);
```

---

## Alternative: Update Existing CTA Section

If adding a new section feels like too much, update the existing `CTASection` to better differentiate breeders vs service providers.

**Current CTASection** (lines 908-941):
- Single headline: "Join the BreederHQ Marketplace"
- Single description for both audiences
- Two buttons: "List as Breeder" / "List Services"

**Problem**: Service providers get no specific value proposition.

**Updated CTASection**:

```tsx
function CTASection() {
  return (
    <section className="space-y-6">
      {/* Breeders CTA */}
      <div className="rounded-2xl border border-[hsl(var(--brand-blue))]/30 bg-[hsl(var(--brand-blue))]/5 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-white mb-2">
              Are you a breeder?
            </h2>
            <p className="text-text-secondary">
              List your breeding program and animals. Reach qualified buyers who value transparency and responsible breeding.
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
      </div>

      {/* Service Providers CTA */}
      <div className="rounded-2xl border border-[hsl(var(--brand-orange))]/30 bg-[hsl(var(--brand-orange))]/5 p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-bold text-white mb-2">
              Offer professional services?
            </h2>
            <p className="text-text-secondary">
              Trainers, groomers, transporters, photographers, vets — list your services and connect with the breeding community.
            </p>
          </div>
          <Link
            to="/provider"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand-orange))] text-white font-medium hover:bg-[hsl(var(--brand-orange))]/90 transition-colors whitespace-nowrap"
          >
            List Your Services
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
```

---

## Service Categories to Highlight

Based on services-research.md, these are the 16 main categories:

**Core Pet Services**:
1. Training (obedience, specialty, behavioral)
2. Grooming
3. Boarding & Day Care
4. Pet Sitting
5. Dog Walking

**Breeder-Specific Services**:
6. Stud Services
7. Whelping/Breeding Assistance
8. Mentorship & Consultation
9. Guardian Programs

**Professional Services**:
10. Transport & Shipping
11. Photography & Videography
12. Veterinary & Health Testing
13. Rehabilitation & Therapy

**Specialty Services**:
14. Working Dog Training (herding, hunting, protection)
15. Livestock Services (shearing, farrier, AI)
16. Exotic Animal Care

**For the homepage**, show 6-8 of the most relatable categories with "+X more" badge.

---

## Copywriter Brief Addition

Add this to the copywriter brief:

### Service Provider Recruitment Section

**Context**: We need copy that speaks directly to service providers — trainers, groomers, transporters, photographers, vets, etc. — explaining why they should list on BreederHQ.

**Current gap**: Homepage only speaks to buyers and breeders. Service providers have no reason to join.

**Provide**:

1. **Section Headline** (5-10 words)
   - Current: "Offer your services to the breeding community"
   - Alternatives needed

2. **Section Description** (20-30 words)
   - Current: "Trainers, groomers, transporters, photographers, vets — breeders and buyers need your expertise. List your services and connect with clients who understand the value of professional animal care."
   - Should speak directly to providers, not about them

3. **Three Value Props** (title + description each)
   - Current:
     1. "Reach the right clients" / "Connect with serious breeders and pet owners who value quality over price."
     2. "No platform fees" / "Direct contact with clients. No commissions, no middleman fees on bookings."
     3. "Build your reputation" / "Collect reviews, showcase your credentials, and stand out in your specialty."
   - Are these the right selling points? Alternatives?

4. **CTA Button Text**
   - Current: "List Your Services"
   - Alternatives?

**Key differentiator**: Unlike Rover/Wag (40% commission), BreederHQ charges no transaction fees — providers keep 100% of what they charge.

---

## Implementation Priority

1. **P1**: Add ServiceProviderCTA component
2. **P1**: Update CTASection to differentiate breeders vs providers
3. **P2**: Add service category browsing to hero Services card
4. **P3**: Add testimonials from service providers

---

## Acceptance Criteria

- [ ] Homepage has dedicated section speaking to service providers
- [ ] Service categories are visible (at least 6 shown)
- [ ] Value proposition is clear (reach clients, no fees, build reputation)
- [ ] CTA links to /provider registration flow
- [ ] Section is visually distinct from breeder recruitment
- [ ] Mobile responsive (stacks properly)
