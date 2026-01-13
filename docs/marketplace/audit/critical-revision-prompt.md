# CRITICAL: Marketplace UI Realignment

**Priority**: URGENT - Client Rejected Current Design Direction
**Date**: 2026-01-13
**Status**: Stop all feature work. Address these issues immediately.

---

## Client Feedback Summary

The client has rejected the current design direction. Key complaints:

1. **No brand identity** - Site is "black and white" with no BreederHQ brand presence
2. **Wrong categories** - "Birds" listed when never supported on platform
3. **Hidden primary navigation** - Core intents (Animals/Breeders/Services) buried under dropdown
4. **Missing logo** - Text "BreederHQ" instead of actual logo
5. **Unprofessional icons** - Category card icons are distracting/"emoji-like"

---

## REQUIRED CHANGES

### 1. Navigation Redesign - EXPOSE PRIMARY INTENTS

**Current (Wrong)**:
```
[Logo] [Home] [Browse ▼]                    [Search] [Saved] [Bell] [User]
```

**Required**:
```
[LOGO]  [Animals]  [Breeders]  [Services]   [Search] [Saved] [Bell] [User]
```

**Implementation**:
- Remove "Browse" dropdown entirely
- Add direct nav links: Animals, Breeders, Services
- These should be the 3 primary navigation items
- Active state: orange underline or background
- "Home" link optional (logo click returns home)

**File**: `apps/marketplace/src/layout/TopNav.tsx` or equivalent

---

### 2. Add Actual BreederHQ Logo

**Current**: Text "BreederHQ"
**Required**: Actual logo image from platform assets

**Find the logo**: Check `packages/ui`, `apps/web`, or `public/` for existing logo assets

**Implementation**:
```tsx
<Link to="/">
  <img
    src="/logo.svg" // or wherever the actual logo lives
    alt="BreederHQ"
    className="h-8 w-auto"
  />
</Link>
```

---

### 3. Remove Birds, Use Actual Platform Species

**Current categories**: Dogs, Cats, Horses, Birds, Other Animals
**Problem**: Birds has NEVER been a platform category

**Required**: Query actual species from platform or use known supported species:
- Dogs
- Cats
- Horses
- (Check what else is actually supported)

**Remove**: Birds, generic "Other Animals"

**File**: `apps/marketplace/src/marketplace/pages/HomePage.tsx` - CategorySection

---

### 4. Remove Custom Category Icons

**Current**: Custom SVG icons (DogIcon, CatIcon, HorseIcon, BirdIcon, PawIcon)
**Problem**: Client finds them unprofessional/"emoji-like"

**Options**:
1. **Remove icons entirely** - Just text labels in category tiles
2. **Use simple professional icons** - Lucide, Heroicons, or platform standard
3. **Use species images** - Small photo/illustration of each species

**Recommended**: Option 1 for now - remove the custom SVGs, keep category tiles as text-only

---

### 5. Apply BreederHQ Brand Colors

**Current**: Dark theme with only orange accent
**Problem**: Doesn't feel like BreederHQ

**Required**: Audit the main BreederHQ platform (`apps/web`) for:
- Primary brand colors
- Secondary colors
- How cards/surfaces are styled
- Button styles
- Typography choices

**Apply to marketplace**: The marketplace should feel like an extension of the platform, not a completely separate product.

**Files to check**:
- `apps/web/src/**/*.css` or Tailwind config
- `packages/ui/src/**` for shared component styles
- Any theme/design token files

---

### 6. Home Page Hero Redesign

**Current**:
- Large "Find Your Perfect Companion" headline
- Search bar
- Category tiles below

**Consider**: Does the hero need to be this prominent? Or should the 3 primary intents (Animals/Breeders/Services) be immediately visible without scrolling?

**Alternative Layout**:
```
[TopNav with Animals | Breeders | Services]
──────────────────────────────────────────
┌─────────────────────────────────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │ ANIMALS │  │ BREEDERS│  │ SERVICES│  │
│  │ Browse  │  │ Find    │  │ Training│  │
│  │ puppies │  │ verified│  │ stud,   │  │
│  │ kittens │  │ breeders│  │ more    │  │
│  └─────────┘  └─────────┘  └─────────┘  │
└─────────────────────────────────────────┘
[Search bar - full width]
──────────────────────────────────────────
Featured Breeders | Featured Listings...
```

The 3 primary intents should be **impossible to miss**.

---

## Implementation Order

1. **TopNav** - Add Animals/Breeders/Services as primary nav links
2. **Logo** - Replace text with actual logo
3. **HomePage CategorySection** - Remove birds, remove custom icons
4. **Brand audit** - Check main platform for colors/styles to adopt
5. **Apply brand colors** - Update Tailwind config or CSS variables

---

## Verification Questions for Client

Before proceeding, we need answers:

1. Where is the official BreederHQ logo file located?
2. What species are actually supported on the platform? (We'll query data if possible)
3. Should the marketplace use the exact same theme as the main platform, or a variation?
4. Is the current dark theme acceptable, or should we match the main platform's light/dark mode?

---

## Apology

The design panel failed to do proper discovery. We designed a generic marketplace instead of a BreederHQ marketplace. The specification should have started with:

1. Platform brand audit
2. Existing component library review
3. Actual data review (species, categories, user flows)
4. Client interview on brand requirements

We skipped these steps and delivered a specification that doesn't represent BreederHQ.

---

*Critical revision prompt - Address immediately*
