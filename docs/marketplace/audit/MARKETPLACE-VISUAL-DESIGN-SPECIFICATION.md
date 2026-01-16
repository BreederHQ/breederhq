# BreederHQ Marketplace - Visual Design Specification

**Document Type**: Design System & Visual Specification
**Created By**: Design Team
**Date**: 2026-01-13
**Version**: 1.0

---

## Design Vision

BreederHQ Marketplace connects breeders with buyers. The visual design must convey:

1. **Trust** - This is where people find their family's next pet
2. **Warmth** - Pets are emotional, the design should reflect that
3. **Professionalism** - Breeders are running businesses
4. **Clarity** - Easy to browse, easy to connect

---

## Brand Foundation

### Brand Colors

| Name | Hex | HSL | Usage |
|------|-----|-----|-------|
| **Primary Orange** | `#ff7a1a` | `24 94% 55%` | CTAs, brand accent, active states |
| **Deep Background** | `#0a0a0f` | `240 20% 4%` | Page background |
| **Card Surface** | `#141418` | `240 12% 8%` | Card backgrounds |
| **Card Surface Elevated** | `#1c1c22` | `240 10% 12%` | Elevated cards, hover states |
| **Border Subtle** | `#2a2a32` | `240 8% 18%` | Card borders, dividers |
| **Border Default** | `#3a3a44` | `240 6% 24%` | Active borders |
| **Text Primary** | `#ffffff` | `0 0% 100%` | Headings, important text |
| **Text Secondary** | `#a0a0a8` | `240 4% 65%` | Body text |
| **Text Tertiary** | `#6a6a74` | `240 4% 44%` | Placeholder, hints |

### Typography

```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Type Scale */
--text-xs: 0.75rem;     /* 12px - badges, labels */
--text-sm: 0.875rem;    /* 14px - secondary text */
--text-base: 1rem;      /* 16px - body text */
--text-lg: 1.125rem;    /* 18px - card titles */
--text-xl: 1.25rem;     /* 20px - section titles */
--text-2xl: 1.5rem;     /* 24px - page titles */
--text-3xl: 2rem;       /* 32px - hero headlines mobile */
--text-4xl: 2.5rem;     /* 40px - hero headlines tablet */
--text-5xl: 3rem;       /* 48px - hero headlines desktop */
```

### Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## Homepage Design

### Hero Section

**Layout**: Full-width, centered content, max-width 1200px

**Background**: Clean solid `#0a0a0f` - NO gradients, NO color washes

**Headline**:
```
Animals. Breeders. Services.
```
- Font: Bold, 48px desktop / 32px mobile
- Color: White
- Letter-spacing: -0.02em (tight)

**Subheadline**:
```
Where breeders and buyers connect
```
- Font: Regular, 18px
- Color: Text Secondary (#a0a0a8)
- Max-width: 400px centered

**Search Bar**:
- Full width up to 600px
- Height: 56px
- Background: Card Surface (#141418)
- Border: 1px solid Border Subtle (#2a2a32)
- Border Radius: 12px
- Search icon: Left side, Text Tertiary
- "Search" button: Inside right, Primary Orange background, white text
- Placeholder: "Search breeds, breeders, or services..."

### Primary Category Cards

**Layout**: 3-column grid, equal spacing

**Card Design**:
- Background: Card Surface (#141418)
- Border: 1px solid Border Subtle (#2a2a32)
- Border Radius: 16px
- Padding: 32px
- Text Align: Center

**Card Hover**:
- Background: Card Surface Elevated (#1c1c22)
- Border: 1px solid Primary Orange (30% opacity)
- Transform: translateY(-4px)
- Box Shadow: 0 20px 40px rgba(0,0,0,0.3)

**Icon Container**:
- Size: 64px x 64px
- Background: Primary Orange (10% opacity)
- Border Radius: 16px
- Icon Size: 32px
- Icon Color: Primary Orange

**Card Title**:
- Font: Bold, 20px
- Color: White
- Margin-top: 20px

**Card Description**:
- Font: Regular, 14px
- Color: Text Tertiary
- Margin-top: 8px
- Max 2 lines

**CTA Button**:
- Background: Primary Orange
- Color: White
- Font: Medium, 14px
- Padding: 12px 24px
- Border Radius: 8px
- Margin-top: 24px

### Popular Searches (Secondary Nav)

**Layout**: Horizontal flex, centered, wrapping

**Label**: "Popular:" - Text Tertiary, 14px

**Pills**:
- Background: Card Surface
- Border: 1px solid Border Subtle
- Padding: 6px 16px
- Border Radius: 999px (full)
- Font: Medium, 14px
- Color: Text Secondary

**Pill Hover**:
- Border Color: Border Default
- Color: White

---

## Featured Sections

### Section Header

**Layout**: Flex, justify-between

**Title**:
- Font: Bold, 20px
- Color: White

**"View all" Link**:
- Font: Medium, 14px
- Color: Text Secondary
- Hover: White
- With chevron icon

### Animal/Listing Cards

**Layout**: 4-column grid desktop, 2-column mobile

**Card Design**:
- Background: Card Surface
- Border: 1px solid Border Subtle
- Border Radius: 12px
- Overflow: hidden

**Image Area**:
- Aspect Ratio: 4:3
- Object-fit: cover
- Background: Card Surface Elevated (placeholder)

**Content Area**:
- Padding: 16px

**Title**:
- Font: Semibold, 15px
- Color: White
- Line clamp: 1

**Subtitle** (breeder name, location):
- Font: Regular, 13px
- Color: Text Tertiary
- Line clamp: 1

**Price**:
- Font: Medium, 14px
- Color: Primary Orange

### Breeder Cards

**Layout**: 4-column grid desktop, 2-column mobile

**Card Design**:
- Background: Card Surface
- Border: 1px solid Border Subtle
- Border Radius: 12px
- Padding: 20px

**Avatar**:
- Size: 56px x 56px
- Border Radius: 50%
- Background: Primary Orange (10% opacity)
- Initial: Bold, 20px, Primary Orange

**Name**:
- Font: Semibold, 15px
- Color: White
- Margin-top: 16px

**Details** (species, location):
- Font: Regular, 13px
- Color: Text Tertiary
- Margin-top: 4px

### Service Cards

**Layout**: 3-column grid desktop

**Card Design**:
- Same as Animal Cards
- With service type badge

**Service Type Badge**:
- Position: Top-left of image
- Background: rgba(0,0,0,0.7)
- Backdrop-blur: 8px
- Padding: 4px 12px
- Border Radius: 6px
- Font: Medium, 12px
- Color: White

---

## Trust Section

**Layout**: Full-width card, centered content

**Background**: Card Surface - NO gradients

**Heading**:
```
Why BreederHQ?
```
- Font: Bold, 24px
- Color: White

**Subheading**:
```
Verified breeders. Direct connections. Real reviews.
```
- Font: Regular, 16px
- Color: Text Secondary

**Features Grid**: 3-column, centered

**Feature Item**:
- Icon Container: 56px, Primary Orange 10% bg, 16px radius
- Icon: 24px, Primary Orange
- Title: Semibold, 16px, White
- Description: Regular, 14px, Text Tertiary

---

## Navigation

### Top Navigation

**Height**: 64px
**Background**: Deep Background with subtle border-bottom

**Logo**:
- BreederHQ mascot image
- Height: 40px
- Left aligned

**Nav Links**:
- Font: Medium, 14px
- Color: Text Secondary
- Active: White with orange underline
- Spacing: 32px between items

**Right Actions**:
- Search icon button
- User avatar/dropdown

### Mobile Bottom Tab Bar

**Height**: 64px (+ safe area)
**Background**: Card Surface with top border

**Tab Items**:
- Icon: 24px
- Label: 12px
- Inactive: Text Tertiary
- Active: Primary Orange

---

## States & Feedback

### Loading States

**Skeleton**:
- Background: Card Surface Elevated
- Animation: Subtle pulse (not shimmer)
- Border Radius: Match content

**Empty States**:
- Centered illustration/icon
- Heading: "No results found"
- Subtext: Helpful suggestion
- Optional CTA

### Hover Effects

**Cards**:
- Translate Y: -4px
- Shadow: 0 20px 40px rgba(0,0,0,0.3)
- Border: Orange accent (30% opacity)
- Transition: 200ms ease-out

**Buttons**:
- Primary: Darken 10%
- Secondary: Lighten border

**Links**:
- Color: White
- No underline

---

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 480px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Grid Adjustments

| Section | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Category Cards | 1 col | 3 col | 3 col |
| Animal Cards | 2 col | 3 col | 4 col |
| Breeder Cards | 2 col | 3 col | 4 col |
| Service Cards | 1 col | 2 col | 3 col |

---

## DO NOT DO

1. **NO copper/brown gradients** - They look cheap
2. **NO "responsible pet ownership"** - Corporate garbage
3. **NO grey on grey on grey** - Create contrast
4. **NO empty skeleton sections** - Hide them if no data
5. **NO DEV badges** - Production only
6. **NO placeholder images** - Use actual photos or hide
7. **NO excessive loading states** - Fast perceived performance
8. **NO preachy copy** - Direct, benefit-focused

---

## MUST DO

1. **USE the orange accent** - On buttons, icons, active states
2. **CREATE visual hierarchy** - Clear levels of importance
3. **SHOW real content** - Actual animals, breeders, services
4. **PROVIDE warmth** - This is about pets and families
5. **MAINTAIN consistency** - Same patterns throughout
6. **ENSURE accessibility** - 4.5:1 contrast minimum
7. **FEEL premium** - This is a $100K site

---

## Implementation Notes

### CSS Variables (index.css)

```css
:root {
  /* Brand */
  --brand-orange: 24 94% 55%;

  /* Surfaces */
  --page-bg: 240 20% 4%;
  --card-bg: 240 12% 8%;
  --card-bg-elevated: 240 10% 12%;

  /* Borders */
  --border-subtle: 240 8% 18%;
  --border-default: 240 6% 24%;

  /* Text */
  --text-primary: 0 0% 100%;
  --text-secondary: 240 4% 65%;
  --text-tertiary: 240 4% 44%;
}
```

### Tailwind Config Additions

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-orange': 'hsl(var(--brand-orange))',
        'page-bg': 'hsl(var(--page-bg))',
        'card-bg': 'hsl(var(--card-bg))',
        'card-bg-elevated': 'hsl(var(--card-bg-elevated))',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
};
```

---

## Sign-Off

This design specification represents the visual direction for BreederHQ Marketplace. Implementation should follow these guidelines exactly. Any deviations require design team approval.

**Next Steps**:
1. Review and approve this specification
2. Create Figma mockups based on these specs
3. Build component library following this system
4. Implement pages with consistent styling

---

*Design Team - BreederHQ*
*January 2026*
