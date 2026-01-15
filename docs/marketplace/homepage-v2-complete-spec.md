# BreederHQ Marketplace Homepage v2 - Complete Implementation Specification

**Version**: 2.0
**Date**: 2026-01-15
**Status**: Ready for Implementation
**URL**: marketplace.breederhq.com

---

## Executive Summary

This specification defines a conversion-optimized homepage for BreederHQ Marketplace that serves three distinct audiences:

1. **Buyers** - People looking for animals, breeders, or services
2. **Breeders** - Should be convinced to subscribe to BreederHQ (breederhq.com) to list their program
3. **Service Providers** - Local professionals (trainers, groomers, transporters, photographers, etc.) who should list their services

**Design Principles**:
- Mobile-first responsive design
- Orange brand accent color (no debates)
- SEO-optimized semantic HTML
- Conversion-focused with clear CTAs for each audience
- Professional but warm tone (not corporate, not cutesy)

---

## Table of Contents

1. [SEO Meta Content](#1-seo-meta-content)
2. [Page Structure Overview](#2-page-structure-overview)
3. [Section 1: Hero](#3-section-1-hero)
4. [Section 2: How It Works](#4-section-2-how-it-works)
5. [Section 3: Trust Bar](#5-section-3-trust-bar)
6. [Section 4: For Buyers - Why BreederHQ](#6-section-4-for-buyers---why-breederhq)
7. [Section 5: For Service Providers](#7-section-5-for-service-providers)
8. [Section 6: For Breeders](#8-section-6-for-breeders)
9. [Section 7: Footer CTA](#9-section-7-footer-cta)
10. [Component Breakdown](#10-component-breakdown)
11. [Responsive Behavior](#11-responsive-behavior)
12. [Empty States](#12-empty-states)
13. [Implementation Notes](#13-implementation-notes)

---

## 1. SEO Meta Content

### Page Title
```
Find Trusted Breeders, Animals & Pet Services | BreederHQ Marketplace
```

### Meta Description
```
Connect with verified breeders, browse animals from established breeding programs, and find professional pet services. BreederHQ is where responsible breeders and quality service providers meet serious buyers.
```

### Open Graph Tags
```html
<meta property="og:title" content="BreederHQ Marketplace - Trusted Breeders, Animals & Services" />
<meta property="og:description" content="Connect with verified breeders, browse animals from established breeding programs, and find professional pet services." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://marketplace.breederhq.com" />
<meta property="og:image" content="https://marketplace.breederhq.com/og-image.png" />
```

### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BreederHQ Marketplace",
  "url": "https://marketplace.breederhq.com",
  "description": "Connect with verified breeders, browse animals from established breeding programs, and find professional pet services.",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://marketplace.breederhq.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Canonical URL
```html
<link rel="canonical" href="https://marketplace.breederhq.com" />
```

---

## 2. Page Structure Overview

```
+------------------------------------------------------------------+
|                         HEADER / NAV                              |
+------------------------------------------------------------------+
|                                                                   |
|                    SECTION 1: HERO                                |
|     Headline + Subheadline + Search Bar + 3 Pathway Cards         |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|                 SECTION 2: HOW IT WORKS                           |
|              3-step visual explainer for buyers                   |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|                  SECTION 3: TRUST BAR                             |
|           Stats or "new marketplace" messaging                    |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|           SECTION 4: FOR BUYERS - WHY BREEDERHQ                   |
|        Value proposition cards explaining the difference          |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|             SECTION 5: FOR SERVICE PROVIDERS                      |
|    Dedicated recruitment section for trainers, groomers, etc.     |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|               SECTION 6: FOR BREEDERS                             |
|         Recruitment section driving to breederhq.com              |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|               SECTION 7: FOOTER CTA                               |
|              Final conversion push with both CTAs                 |
|                                                                   |
+------------------------------------------------------------------+
|                           FOOTER                                  |
+------------------------------------------------------------------+
```

---

## 3. Section 1: Hero

### Purpose
First impression. Must communicate what BreederHQ is, enable immediate search, and provide clear pathways for all three audience types.

### Layout (Desktop)
```
+------------------------------------------------------------------+
|                                                                   |
|              Where breeders, buyers, and                          |
|            professionals come together.                           |
|                                                                   |
|    Find your next companion from verified breeding programs,      |
|    or connect with professional animal services.                  |
|                                                                   |
|    +----------------------------------------------------------+  |
|    |  [Search icon] Search animals, breeders, or services...  |  |
|    +----------------------------------------------------------+  |
|                                                                   |
|    +----------------+  +----------------+  +----------------+     |
|    |                |  |                |  |                |     |
|    |   ANIMALS      |  |   BREEDERS     |  |   SERVICES     |     |
|    |                |  |                |  |                |     |
|    |  Browse        |  |  Find verified |  |  Training,     |     |
|    |  available     |  |  breeding      |  |  grooming,     |     |
|    |  animals       |  |  programs      |  |  transport     |     |
|    |                |  |                |  |  & more        |     |
|    +----------------+  +----------------+  +----------------+     |
|                                                                   |
+------------------------------------------------------------------+
```

### Copy

**H1 Headline**:
```
Where breeders, buyers, and professionals come together.
```

**Subheadline** (paragraph):
```
Find your next companion from verified breeding programs, or connect with professional animal services.
```

**Search Placeholder**:
```
Search animals, breeders, or services...
```

### Pathway Cards

#### Card 1: Animals
- **Icon**: Paw icon (filled, orange accent)
- **Title**: `Animals`
- **Description**: `Browse available animals from established breeding programs`
- **Link**: `/animals`
- **CTA Text**: `Browse Animals`

#### Card 2: Breeders
- **Icon**: Shield check icon (orange accent)
- **Title**: `Breeders`
- **Description**: `Find verified breeders managing complete programs`
- **Link**: `/breeders`
- **CTA Text**: `Find Breeders`

#### Card 3: Services
- **Icon**: Wrench/tools icon (orange accent)
- **Title**: `Services`
- **Description**: `Training, grooming, transport, photography, and more`
- **Link**: `/services`
- **CTA Text**: `Explore Services`

### Responsive Behavior

**Desktop (1024px+)**:
- All three cards in a row
- Search bar at 60% width, centered
- Generous padding (py-16 px-8)

**Tablet (768px-1023px)**:
- Cards in 3-column grid (narrower)
- Search bar at 80% width

**Mobile (<768px)**:
- Cards stack vertically (1 column)
- Search bar at 100% width
- Reduced padding (py-8 px-4)
- Cards become horizontal (icon left, text right)

### Technical Notes
- H1 tag on main headline (only one H1 per page)
- Search input with `aria-label="Search marketplace"`
- Cards are `<article>` elements with semantic headings (H2)
- Use `loading="eager"` for any above-fold images

---

## 4. Section 2: How It Works

### Purpose
Explain the BreederHQ difference to first-time visitors. Differentiate from classified ad sites like Craigslist or Facebook Marketplace.

### Layout
```
+------------------------------------------------------------------+
|                                                                   |
|                    How BreederHQ Works                            |
|                                                                   |
|   +----------------+  +----------------+  +----------------+      |
|   |      [1]       |  |      [2]       |  |      [3]       |      |
|   |                |  |                |  |                |      |
|   |    Browse      |  |    Verify      |  |    Connect     |      |
|   |   Programs     |  |  Credentials   |  |   Directly     |      |
|   |                |  |                |  |                |      |
|   |  Search by     |  |  Review health |  |  Message       |      |
|   |  breed,        |  |  testing,      |  |  breeders,     |      |
|   |  species, or   |  |  breeding      |  |  ask           |      |
|   |  location.     |  |  history,      |  |  questions,    |      |
|   |  See complete  |  |  and program   |  |  schedule      |      |
|   |  breeding      |  |  details       |  |  visits.       |      |
|   |  programs.     |  |  before you    |  |                |      |
|   |                |  |  reach out.    |  |                |      |
|   +----------------+  +----------------+  +----------------+      |
|                                                                   |
+------------------------------------------------------------------+
```

### Copy

**Section Heading (H2)**:
```
How BreederHQ Works
```

#### Step 1
- **Number**: `1`
- **Title (H3)**: `Browse Programs`
- **Description**: `Search by breed, species, or location. See complete breeding programs, not just individual listings.`
- **Icon**: Search/magnifying glass

#### Step 2
- **Number**: `2`
- **Title (H3)**: `Verify Credentials`
- **Description**: `Review health testing, breeding history, and program details before you reach out.`
- **Icon**: Shield with checkmark

#### Step 3
- **Number**: `3`
- **Title (H3)**: `Connect Directly`
- **Description**: `Message breeders and service providers. Ask questions, request info, schedule visits.`
- **Icon**: Message/chat bubble

### Responsive Behavior

**Desktop**: 3 columns side by side
**Tablet**: 3 columns (condensed)
**Mobile**: Vertical stack with horizontal step cards (number left, content right)

### Technical Notes
- Use `<section>` with `aria-labelledby` pointing to the H2
- Step numbers in orange accent circles
- Consider subtle connecting line between steps on desktop

---

## 5. Section 3: Trust Bar

### Purpose
Social proof. Show marketplace activity to build confidence. Handle cold-start gracefully.

### Layout
```
+------------------------------------------------------------------+
|                                                                   |
|     [X]+            [X]+              [X]+                        |
|   Verified        Animals           Buyer                         |
|   Breeders        Listed           Reviews                        |
|                                                                   |
+------------------------------------------------------------------+
```

### Copy

#### With Stats (when data exists)
| Metric | Label |
|--------|-------|
| `{count}+` | `Verified Breeders` |
| `{count}+` | `Animals Listed` |
| `{count}+` | `Buyer Reviews` |

#### Cold Start (no stats)
Single line of text:
```
New marketplace. Verified breeders joining daily.
```

Alternative options (pick one based on timing):
- `Early access. Quality breeders, carefully vetted.`
- `Growing daily. Join the community of verified breeders.`

### Responsive Behavior

**Desktop/Tablet**: Horizontal row of 3 stats
**Mobile**: Horizontal row (condensed) or single cold-start message

### Technical Notes
- Use CSS Grid for even spacing
- Stats should animate/count up on scroll into view (optional enhancement)
- Background: subtle gradient or light border to separate from adjacent sections

---

## 6. Section 4: For Buyers - Why BreederHQ

### Purpose
Explain to buyers why BreederHQ is different from classified ads. Build trust. Convert browsers into action-takers.

### Layout
```
+------------------------------------------------------------------+
|                                                                   |
|         Not a classified ad. A breeding program.                  |
|                                                                   |
|   BreederHQ breeders use our platform to manage their entire      |
|   operation - animals, health records, pedigrees, litters.        |
|   What you see is their real program, not a one-off listing.      |
|                                                                   |
|   +---------------------------+  +---------------------------+    |
|   |                           |  |                           |    |
|   |  FULL PROGRAM VISIBILITY  |  |  DIRECT CONNECTION        |    |
|   |                           |  |                           |    |
|   |  See their animals,       |  |  Message breeders         |    |
|   |  breeding history,        |  |  directly. Ask            |    |
|   |  health testing, and      |  |  questions, request       |    |
|   |  past litters - not       |  |  more information,        |    |
|   |  just one photo.          |  |  schedule a visit.        |    |
|   |                           |  |                           |    |
|   +---------------------------+  +---------------------------+    |
|                                                                   |
|   +---------------------------+  +---------------------------+    |
|   |                           |  |                           |    |
|   |  VERIFIED HEALTH TESTING  |  |  ESTABLISHED PROGRAMS     |    |
|   |                           |  |                           |    |
|   |  OFA, PennHIP, genetic    |  |  Breeders actively        |    |
|   |  screening - see actual   |  |  managing their animals,  |    |
|   |  results, not just        |  |  tracking health, and     |    |
|   |  claims.                  |  |  planning litters.        |    |
|   |                           |  |                           |    |
|   +---------------------------+  +---------------------------+    |
|                                                                   |
+------------------------------------------------------------------+
```

### Copy

**Section Heading (H2)**:
```
Not a classified ad. A breeding program.
```

**Section Description**:
```
BreederHQ breeders use our platform to manage their entire operation - animals, health records, pedigrees, litters. What you see is their real program, not a one-off listing.
```

#### Value Prop 1: Full Program Visibility
- **Icon**: Eye/view icon
- **Title (H3)**: `Full Program Visibility`
- **Description**: `See their animals, breeding history, health testing, and past litters - not just one photo and a phone number.`

#### Value Prop 2: Direct Connection
- **Icon**: Message/chat icon
- **Title (H3)**: `Direct Connection`
- **Description**: `Message breeders directly. Ask questions, request more information, schedule a visit.`

#### Value Prop 3: Verified Health Testing
- **Icon**: Medical/health icon
- **Title (H3)**: `Verified Health Testing`
- **Description**: `OFA, PennHIP, genetic screening - see actual test results, not just claims.`

#### Value Prop 4: Established Programs
- **Icon**: Building/program icon
- **Title (H3)**: `Established Programs`
- **Description**: `Breeders actively managing their animals, tracking health records, and planning litters on our platform.`

### Responsive Behavior

**Desktop**: 2x2 grid of value prop cards
**Tablet**: 2x2 grid (condensed)
**Mobile**: Single column stack

### Technical Notes
- Cards have subtle orange left border or top accent
- Background: slightly different shade to create visual separation
- Consider testimonial/quote from a buyer (future enhancement)

---

## 7. Section 5: For Service Providers

### Purpose
**PRIMARY CONVERSION GOAL**: Recruit service providers. This section must convince Joey the dog trainer next door to list his services on BreederHQ instead of (or in addition to) Facebook.

### The Service Provider's Question
*"Why should I list here instead of just posting on Facebook or Nextdoor?"*

### The Answer (Our Value Proposition)

1. **Targeted audience** - Breeders and serious pet owners who value quality and will pay for expertise
2. **No platform fees** - Unlike Rover (20%) or Wag (40%), we don't take a cut of your bookings
3. **Professional credibility** - Build your reputation with reviews, credentials, and a professional profile
4. **Less noise** - Your listing won't get buried in a feed of random posts

### Layout
```
+------------------------------------------------------------------+
|                                                                   |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |        Grow your business with the breeding community        | |
|  |                                                              | |
|  |  Trainers, groomers, transporters, photographers, vets -     | |
|  |  list your services and connect with clients who value       | |
|  |  professional animal care.                                   | |
|  |                                                              | |
|  |  +--------+ +--------+ +--------+ +--------+ +--------+      | |
|  |  |Training| |Grooming| |Transport| |Photo  | |Boarding|      | |
|  |  +--------+ +--------+ +--------+ +--------+ +--------+      | |
|  |  +--------+ +--------+ +--------+                            | |
|  |  |  Vet   | |Shearing| | +8 more |                           | |
|  |  +--------+ +--------+ +--------+                            | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  +----------------------------+  +----------------------------+   |
|  |                            |  |                            |   |
|  |  WHY LIST ON BREEDERHQ?    |  |  KEEP 100% OF YOUR FEES    |   |
|  |                            |  |                            |   |
|  |  [Checkmark] Reach         |  |  Unlike Rover or Wag,      |   |
|  |  clients who value         |  |  we don't take a           |   |
|  |  quality over price        |  |  percentage of your        |   |
|  |                            |  |  bookings. You keep        |   |
|  |  [Checkmark] Build your    |  |  everything you earn.      |   |
|  |  professional profile      |  |                            |   |
|  |  and reputation            |  |       Rover: 20% fee       |   |
|  |                            |  |       Wag: 40% fee         |   |
|  |  [Checkmark] Connect       |  |       BreederHQ: $0        |   |
|  |  directly with clients     |  |                            |   |
|  |  - no middleman            |  |                            |   |
|  |                            |  |                            |   |
|  +----------------------------+  +----------------------------+   |
|                                                                   |
|          +----------------------------------------+               |
|          |     List Your Services - It's Free     |               |
|          +----------------------------------------+               |
|                                                                   |
+------------------------------------------------------------------+
```

### Copy

**Section Heading (H2)**:
```
Grow your business with the breeding community
```

**Section Description**:
```
Trainers, groomers, transporters, photographers, vets - list your services and connect with clients who value professional animal care.
```

### Service Category Pills
Display these categories as clickable pills/badges:

| Category | Icon |
|----------|------|
| Training | Graduation cap |
| Grooming | Scissors |
| Transport | Truck |
| Photography | Camera |
| Boarding | Home/house |
| Veterinary | Heart/medical |
| Shearing | (for livestock) |
| `+8 more` | (subtle, links to full list) |

### Why List - Checklist

**Card Title**: `Why list on BreederHQ?`

| Checkmark | Text |
|-----------|------|
| Check | `Reach clients who value quality over price` |
| Check | `Build your professional profile and reputation` |
| Check | `Connect directly with clients - no middleman` |
| Check | `Collect verified reviews from real clients` |
| Check | `Showcase credentials, certifications, and experience` |

### Fee Comparison Card

**Card Title**: `Keep 100% of your fees`

**Card Description**:
```
Unlike Rover or Wag, we don't take a percentage of your bookings. You keep everything you earn.
```

**Fee Comparison Table**:
| Platform | Fee |
|----------|-----|
| Rover | 20% per booking |
| Wag | 40% per booking |
| **BreederHQ** | **$0** |

**Fine Print** (small text):
```
Direct contact with clients. Set your own rates. No commissions.
```

### Primary CTA

**Button Text**: `List Your Services - It's Free`
**Button Style**: Orange background, white text, full-width on mobile
**Link**: `/provider` or `/services/list`

### Secondary Text (below button)
```
Takes about 5 minutes. No credit card required.
```

### Responsive Behavior

**Desktop**:
- Two-column layout (checklist left, fee comparison right)
- Category pills in 2 rows
- CTA button centered, medium width

**Mobile**:
- Single column stack
- Category pills wrap naturally (2-3 per row)
- CTA button full-width
- Fee comparison card with clear visual hierarchy

### Technical Notes
- Section has orange-tinted background (subtle gradient from orange/5 to transparent)
- Orange left border on section or cards
- Fee comparison should have visual emphasis (maybe larger numbers, or strikethrough on competitor fees)
- Service category pills are interactive (link to `/services?category=X`)

---

## 8. Section 6: For Breeders

### Purpose
Convince breeders to subscribe to BreederHQ (breederhq.com) to list their breeding program on the marketplace. This is NOT a free listing - they need to become BreederHQ customers.

### The Breeder's Question
*"I already post on Facebook groups and AKC Marketplace. Why should I pay for another platform?"*

### The Answer (Our Value Proposition)

1. **Integrated management** - You already use BreederHQ to manage your program. Marketplace is an extension.
2. **Professional presentation** - Your program page shows everything: animals, health records, pedigrees, litters
3. **Qualified buyers** - Buyers on BreederHQ are researching, not impulse shopping
4. **Differentiation** - Stand out from puppy mills and backyard breeders

### Layout
```
+------------------------------------------------------------------+
|                                                                   |
|  +--------------------------------------------------------------+ |
|  |                                                              | |
|  |        Your breeding program deserves better than            | |
|  |        a classified ad.                                      | |
|  |                                                              | |
|  |  BreederHQ breeders don't just list animals - they manage    | |
|  |  complete breeding programs. Health records, pedigrees,      | |
|  |  litter planning, buyer communication - all in one place.    | |
|  |  The marketplace shows buyers what makes you different.      | |
|  |                                                              | |
|  +--------------------------------------------------------------+ |
|                                                                   |
|  +----------------------------+  +----------------------------+   |
|  |                            |  |                            |   |
|  |  WHAT BUYERS SEE           |  |  WHAT YOU GET              |   |
|  |                            |  |                            |   |
|  |  - Your complete program   |  |  - Breeding management     |   |
|  |  - All your animals        |  |    software                |   |
|  |  - Health test results     |  |  - Health record tracking  |   |
|  |  - Pedigree information    |  |  - Pedigree database       |   |
|  |  - Past & planned litters  |  |  - Litter management       |   |
|  |  - Reviews from buyers     |  |  - Buyer inquiries in one  |   |
|  |                            |  |    place                   |   |
|  |                            |  |  - Marketplace exposure    |   |
|  |                            |  |                            |   |
|  +----------------------------+  +----------------------------+   |
|                                                                   |
|          +----------------------------------------+               |
|          |     Start Your Free Trial              |               |
|          +----------------------------------------+               |
|                    Already a subscriber? Enable marketplace       |
|                                                                   |
+------------------------------------------------------------------+
```

### Copy

**Section Heading (H2)**:
```
Your breeding program deserves better than a classified ad.
```

**Section Description**:
```
BreederHQ breeders don't just list animals - they manage complete breeding programs. Health records, pedigrees, litter planning, buyer communication - all in one place. The marketplace shows buyers what makes you different.
```

### Two-Column Comparison

#### Column 1: What Buyers See

**Title**: `What buyers see`

| Item |
|------|
| Your complete breeding program |
| All your animals with photos and details |
| Health test results and certifications |
| Pedigree information and lineage |
| Past litters and planned breedings |
| Reviews from previous buyers |

#### Column 2: What You Get

**Title**: `What you get`

| Item |
|------|
| Complete breeding management software |
| Health record tracking and reminders |
| Pedigree database and COI calculator |
| Litter management and puppy tracking |
| Buyer inquiries in one place |
| Marketplace exposure to qualified buyers |

### Primary CTA

**Button Text**: `Start Your Free Trial`
**Button Style**: Blue background (brand blue for BreederHQ), white text
**Link**: `https://breederhq.com/signup` (external, new tab)

### Secondary Link

**Text**: `Already a subscriber? Enable marketplace in your dashboard.`
**Link**: `https://breederhq.com/dashboard/marketplace` (external)

### Responsive Behavior

**Desktop**: Two columns side by side
**Mobile**: Stack vertically, "What buyers see" first

### Technical Notes
- Use `rel="noopener noreferrer"` for external links
- Consider different visual treatment (blue accent instead of orange) to differentiate from service provider section
- Track clicks on CTA for conversion analytics

---

## 9. Section 7: Footer CTA

### Purpose
Final conversion push. Catch visitors who scrolled the entire page and need one more nudge.

### Layout
```
+------------------------------------------------------------------+
|                                                                   |
|              Ready to join BreederHQ Marketplace?                 |
|                                                                   |
|    +-------------------------+  +-------------------------+       |
|    |                         |  |                         |       |
|    |   I'm a Breeder         |  |   I Offer Services      |       |
|    |   List my breeding      |  |   List my professional  |       |
|    |   program               |  |   services              |       |
|    |                         |  |                         |       |
|    +-------------------------+  +-------------------------+       |
|                                                                   |
+------------------------------------------------------------------+
```

### Copy

**Section Heading (H2)**:
```
Ready to join BreederHQ Marketplace?
```

### Two CTA Cards

#### Card 1: For Breeders
- **Title**: `I'm a Breeder`
- **Description**: `List my breeding program and reach qualified buyers`
- **Button Text**: `Get Started`
- **Button Link**: `https://breederhq.com/signup`
- **Style**: Blue accent (BreederHQ brand)

#### Card 2: For Service Providers
- **Title**: `I Offer Services`
- **Description**: `List my professional services - it's free`
- **Button Text**: `List Services`
- **Button Link**: `/provider`
- **Style**: Orange accent (marketplace brand)

### Responsive Behavior

**Desktop**: Two cards side by side
**Mobile**: Stack vertically

---

## 10. Component Breakdown

### New Components to Create

| Component | File Path | Purpose |
|-----------|-----------|---------|
| `HeroSection` | `components/HeroSection.tsx` | Hero with headline, search, pathway cards |
| `HowItWorks` | `components/HowItWorks.tsx` | 3-step explainer (may already exist) |
| `TrustBar` | `components/TrustBar.tsx` | Stats or cold-start message (may already exist) |
| `BuyerValueProps` | `components/BuyerValueProps.tsx` | "Not a classified ad" section |
| `ServiceProviderCTA` | `components/ServiceProviderCTA.tsx` | Service provider recruitment |
| `BreederCTA` | `components/BreederCTA.tsx` | Breeder recruitment |
| `FooterCTA` | `components/FooterCTA.tsx` | Final dual-CTA section |

### Existing Components to Update

| Component | Changes Needed |
|-----------|----------------|
| `HomePage.tsx` | Compose new sections in correct order |

### Shared Components

| Component | Usage |
|-----------|-------|
| `Button` | Primary and secondary CTAs |
| `Card` | Value prop cards, CTA cards |
| `Badge` | Service category pills |
| `Icon` | Various section icons |

---

## 11. Responsive Behavior

### Breakpoints

| Breakpoint | Name | Behavior |
|------------|------|----------|
| < 640px | Mobile | Single column, stacked layouts |
| 640px - 768px | Small tablet | 2-column where appropriate |
| 768px - 1024px | Tablet | 2-3 columns, condensed |
| 1024px+ | Desktop | Full layouts, generous spacing |

### Section-by-Section Mobile Behavior

| Section | Mobile Layout |
|---------|---------------|
| Hero | Stacked: headline, search (full-width), vertical pathway cards |
| How It Works | Vertical steps with horizontal cards (number left, text right) |
| Trust Bar | Single row (condensed) or single message |
| Buyer Value Props | Single column stack |
| Service Provider CTA | Single column, full-width CTA button |
| Breeder CTA | Single column, full-width CTA button |
| Footer CTA | Stacked cards |

### Typography Scaling

| Element | Mobile | Desktop |
|---------|--------|---------|
| H1 (Hero) | 28px / 2rem | 48px / 3rem |
| H2 (Section) | 24px / 1.5rem | 36px / 2.25rem |
| H3 (Card title) | 18px / 1.125rem | 20px / 1.25rem |
| Body | 16px / 1rem | 16px / 1rem |
| Small | 14px / 0.875rem | 14px / 0.875rem |

### Touch Targets

- All buttons: minimum 44px height
- All interactive elements: minimum 44x44px touch target
- Card links: entire card is clickable

---

## 12. Empty States

### When No Animals Listed

**Location**: Would appear in a "Recent Animals" section (if added)

**Title**: `New animals coming soon`
**Description**: `Breeders are setting up their programs. Check back soon or explore our verified breeders.`
**Primary CTA**: `Browse Breeders` (link to `/breeders`)
**Secondary CTA**: `Get Notified` (email signup)

### When No Breeders Listed

**Location**: Would appear in a "Featured Breeders" section (if added)

**Title**: `Breeders are joining`
**Description**: `Our marketplace is growing. Be among the first to connect with verified breeding programs.`
**Primary CTA**: `Get Notified` (email signup)
**Secondary CTA**: `Join as a Breeder` (link to breederhq.com)

### When No Services Listed

**Location**: Would appear in a "Featured Services" section (if added)

**Title**: `Services launching soon`
**Description**: `Professional animal services are being added. Interested in offering your services?`
**Primary CTA**: `List Your Services` (link to `/provider`)
**Secondary CTA**: `Get Notified` (email signup)

---

## 13. Implementation Notes

### Color Variables

```css
:root {
  --brand-orange: 24 95% 53%;  /* HSL for orange */
  --brand-blue: 217 91% 60%;   /* HSL for BreederHQ blue */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;   /* zinc-400 */
  --text-tertiary: #71717a;    /* zinc-500 */
  --bg-primary: #09090b;       /* zinc-950 */
  --bg-secondary: #18181b;     /* zinc-900 */
  --bg-tertiary: #27272a;      /* zinc-800 */
  --border: #3f3f46;           /* zinc-700 */
}
```

### Orange Usage Guidelines

Use orange (`--brand-orange`) for:
- Primary CTAs for marketplace actions
- Service provider section accents
- Icon accents in hero cards
- Hover states on secondary buttons
- Active/selected states

Use blue (`--brand-blue`) for:
- Breeder-specific CTAs (linking to breederhq.com)
- BreederHQ-branded elements

### Accessibility Checklist

- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus states visible on all interactive elements
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader testing completed
- [ ] Form inputs have associated labels
- [ ] Error states are announced to screen readers

### Performance Targets

- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

### Analytics Events to Track

| Event | Trigger |
|-------|---------|
| `hero_search` | User submits search |
| `hero_card_click` | User clicks pathway card |
| `how_it_works_view` | Section scrolls into view |
| `service_provider_cta_click` | User clicks "List Your Services" |
| `breeder_cta_click` | User clicks "Start Your Free Trial" |
| `footer_cta_click` | User clicks either footer CTA |
| `category_pill_click` | User clicks service category pill |

### SEO Checklist

- [ ] Single H1 tag (hero headline)
- [ ] Logical heading hierarchy (H1 > H2 > H3)
- [ ] Meta description under 160 characters
- [ ] Open Graph tags present
- [ ] Structured data (JSON-LD) valid
- [ ] Canonical URL set
- [ ] All links have descriptive text (no "click here")
- [ ] Images have alt text
- [ ] Page loads without JavaScript for core content

---

## Appendix A: Full Copy Reference

### All Headlines

| Section | Headline |
|---------|----------|
| Hero H1 | Where breeders, buyers, and professionals come together. |
| How It Works H2 | How BreederHQ Works |
| Buyer Value Props H2 | Not a classified ad. A breeding program. |
| Service Provider H2 | Grow your business with the breeding community |
| Breeder H2 | Your breeding program deserves better than a classified ad. |
| Footer CTA H2 | Ready to join BreederHQ Marketplace? |

### All CTAs

| Location | CTA Text | Link |
|----------|----------|------|
| Hero - Animals card | Browse Animals | /animals |
| Hero - Breeders card | Find Breeders | /breeders |
| Hero - Services card | Explore Services | /services |
| Service Provider section | List Your Services - It's Free | /provider |
| Breeder section | Start Your Free Trial | https://breederhq.com/signup |
| Footer - Breeder card | Get Started | https://breederhq.com/signup |
| Footer - Service card | List Services | /provider |

### All Descriptions

| Section | Description |
|---------|-------------|
| Hero subheadline | Find your next companion from verified breeding programs, or connect with professional animal services. |
| How It Works - Step 1 | Search by breed, species, or location. See complete breeding programs, not just individual listings. |
| How It Works - Step 2 | Review health testing, breeding history, and program details before you reach out. |
| How It Works - Step 3 | Message breeders and service providers. Ask questions, request info, schedule visits. |
| Buyer Value Props intro | BreederHQ breeders use our platform to manage their entire operation - animals, health records, pedigrees, litters. What you see is their real program, not a one-off listing. |
| Service Provider intro | Trainers, groomers, transporters, photographers, vets - list your services and connect with clients who value professional animal care. |
| Breeder intro | BreederHQ breeders don't just list animals - they manage complete breeding programs. Health records, pedigrees, litter planning, buyer communication - all in one place. The marketplace shows buyers what makes you different. |

---

## Appendix B: Service Provider Value Props - Expanded

### Why Joey the Dog Trainer Should List

**The Problem Joey Has Today**:
1. Posts on Facebook groups, gets buried in hours
2. Relies on word-of-mouth, slow to scale
3. Competes with unqualified "trainers" on Nextdoor
4. If he uses Rover/Wag, loses 20-40% of every booking

**What BreederHQ Offers Joey**:
1. **Targeted audience**: Breeders and serious pet owners who will pay for quality training
2. **No fees**: Unlike Rover (20%) or Wag (40%), we don't take a cut
3. **Professional profile**: Reviews, credentials, certifications all in one place
4. **Direct contact**: Clients message him directly, no platform in the middle
5. **Niche positioning**: Listed alongside breeding services, not competing with dog walkers

**The Real Selling Point**:
Joey charges $150/session. On Wag, he'd keep $90. On BreederHQ, he keeps $150.
Over 100 sessions/year, that's $6,000 more in his pocket.

### Service Categories to Highlight (Priority Order)

| Priority | Category | Why |
|----------|----------|-----|
| 1 | Training | High value, clear need for breeders/buyers |
| 2 | Grooming | Universal need, frequent service |
| 3 | Transport | Critical for breeder-buyer transactions |
| 4 | Photography | Breeders need this for listings |
| 5 | Boarding | Universal need |
| 6 | Veterinary | Trust/health focus aligns with platform |
| 7 | Shearing/Farrier | Livestock breeders, underserved market |
| 8 | Working Dog Training | Niche, high-value, no good marketplace exists |

---

## Appendix C: Competitor Comparison

### Fee Structure Comparison

| Platform | Provider Fee | What Provider Keeps on $100 |
|----------|-------------|---------------------------|
| Rover | 20% | $80 |
| Wag | 40% | $60 |
| Thumbtack | Per-lead fee | Varies |
| Facebook | Free | $100 (but no infrastructure) |
| **BreederHQ** | **$0** | **$100** |

### Feature Comparison

| Feature | Rover | Wag | Thumbtack | BreederHQ |
|---------|-------|-----|-----------|-----------|
| No platform fee | No | No | Partial | **Yes** |
| Direct client contact | No | No | Yes | **Yes** |
| Reviews/ratings | Yes | Yes | Yes | **Yes** |
| Professional profiles | Basic | Basic | Yes | **Yes** |
| Breeder-specific audience | No | No | No | **Yes** |
| Supports all animal types | No | No | Partial | **Yes** |

---

*End of Specification*

**Next Steps**:
1. Engineering review for component architecture
2. Design review for visual polish
3. Copy review for tone/voice
4. Implementation sprint
5. A/B testing on CTAs
