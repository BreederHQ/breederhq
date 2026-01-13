# Supplemental Fix: Homepage Primary Navigation Architecture

**Priority**: CRITICAL
**Add to Phase 1 Fixes**

---

## Problem 1: Wrong Hero Headline

**Current (WRONG):**
```
Find Your Perfect Companion
Connect with verified breeders, browse available animals, and discover trusted services.
```

**Why it's wrong:**
- "Find Your Perfect Companion" implies this is just a pet adoption site
- Completely ignores that users can browse Breeders and Services directly
- A service provider or someone looking for pet transport would think they're in the wrong place
- The subtitle mentions all three offerings but the headline only speaks to one

**Required Fix:**
The headline must reflect the three marketplace offerings equally.

**Better options:**
```
Option 1:
Animals. Breeders. Services.
The trusted marketplace for responsible pet ownership

Option 2:
The Marketplace for Responsible Pet Ownership
Browse animals, connect with breeders, find professional services

Option 3:
Find Animals, Breeders & Services
Connect with verified sources for all your pet needs
```

---

## Problem 2: Wrong Category Structure

The current homepage "Browse by Category" section shows species (Dogs, Cats, Horses, Rabbits, Other Animals) as top-level categories. This misrepresents the marketplace structure.

The marketplace has **three primary offerings**:
1. **Animals** - Available animals for sale/adoption
2. **Breeders** - Breeding programs to connect with
3. **Services** - Training, transport, grooming, etc.

Species are **filters within Animals**, not categories equivalent to Breeders or Services.

---

## Required Change

### Current Structure (Wrong)
```
Browse by Category
[Dogs] [Cats] [Horses] [Rabbits] [Other Animals]
         ↓
    (all species links go to /animals?species=X)
```

### Required Structure
```
Browse the Marketplace

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│     ANIMALS      │  │     BREEDERS     │  │     SERVICES     │
│                  │  │                  │  │                  │
│  Find puppies,   │  │  Connect with    │  │  Training,       │
│  kittens, horses │  │  verified        │  │  transport,      │
│  & more          │  │  breeding        │  │  grooming        │
│                  │  │  programs        │  │  & more          │
│                  │  │                  │  │                  │
│  [Browse →]      │  │  [Find →]        │  │  [Explore →]     │
└──────────────────┘  └──────────────────┘  └──────────────────┘

Popular Searches: [Dogs] [Cats] [Horses] [All Breeders]
```

---

## Implementation

### 1. Add Primary Category Cards

Create three prominent, equal-sized cards in the hero/above-fold area:

```tsx
const MARKETPLACE_CATEGORIES = [
  {
    title: "Animals",
    subtitle: "Find puppies, kittens, horses & more",
    href: "/animals",
    icon: PawPrintIcon, // or appropriate icon
    cta: "Browse Animals"
  },
  {
    title: "Breeders",
    subtitle: "Connect with verified breeding programs",
    href: "/breeders",
    icon: ShieldCheckIcon,
    cta: "Find Breeders"
  },
  {
    title: "Services",
    subtitle: "Training, transport, grooming & more",
    href: "/services",
    icon: BriefcaseIcon,
    cta: "Explore Services"
  }
];
```

### 2. Demote Species to Secondary Navigation

Keep species shortcuts but relabel and reposition:

- **Move below** the primary category cards
- **Relabel** from "Browse by Category" to "Popular Searches" or "Quick Links"
- These are shortcuts to `/animals?species=DOG`, not categories

### 3. Styling

- Primary cards: Large, prominent, orange CTA buttons
- Secondary species links: Smaller, pill-style or text links
- Visual hierarchy must make clear that Animals/Breeders/Services are primary

---

## Acceptance Criteria

- [ ] Homepage shows 3 equal-prominence cards: Animals | Breeders | Services
- [ ] Cards are above the fold and visually dominant
- [ ] Each card links to `/animals`, `/breeders`, `/services`
- [ ] Species links are secondary (smaller, below, labeled as "Popular" not "Categories")
- [ ] Users immediately understand they can browse Animals, Breeders, OR Services
- [ ] Orange brand color used on primary CTA buttons

---

## Files to Modify

- `apps/marketplace/src/marketplace/pages/HomePage.tsx`

---

## Reference

Per the marketplace purpose: "Connect with verified breeders, browse available animals, and discover trusted services."

All three (breeders, animals, services) are equal top-level offerings - not species.
