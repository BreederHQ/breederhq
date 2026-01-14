# BreederHQ Marketing Website - Frontend Engineering Implementation Prompt

**Purpose:** Engineering-ready prompt for implementing the BreederHQ marketing website redesign (breederhq-www)
**Target:** Frontend engineer implementing https://breederhq-www.vercel.app/
**Date:** January 14, 2026

---

## Your Mission

Implement the BreederHQ marketing website (NOT the marketplace app) that:
1. **Positions BreederHQ as THE canonical authority** for breeding software (AI citation-ready)
2. **Converts both breeders AND service providers** into trial signups
3. **Meets WCAG 2.1 Level AA accessibility** standards
4. **Performs excellently on mobile** (40-60% of traffic)
5. **Supports AI summarization** through semantic HTML and content structure

**Current Site:** https://breederhq-www.vercel.app/
**Your Goal:** Fix existing pages + add missing critical pages

---

## Critical Context: What You're Building

This is the **MARKETING WEBSITE** (public-facing), NOT the marketplace (apps/marketplace).
- Current location: Likely separate codebase or `breederhq-www` directory
- Tech stack: Confirm (Next.js? Static HTML? React?)
- Purpose: Drive trial signups for breeder software + service provider marketplace

---

## Specification Documents (READ THESE FIRST)

Read IN ORDER before starting:

1. **[COMPREHENSIVE-UI-UX-DESIGN-SPECIFICATION.md](./COMPREHENSIVE-UI-UX-DESIGN-SPECIFICATION.md)**
   - Executive Summary
   - Existing Site Analysis (current state findings)
   - Design Challenge & Priorities

2. **[UI-UX-SPEC-PART-2-STRATEGY.md](./UI-UX-SPEC-PART-2-STRATEGY.md)**
   - UX Strategy (user mental models)
   - Information Architecture (navigation structure)
   - Canonical Page Map (exact URLs required)
   - Internal Linking Strategy (SEO critical)

3. **[UI-UX-SPEC-PART-3-PAGE-SPECIFICATIONS.md](./UI-UX-SPEC-PART-3-PAGE-SPECIFICATIONS.md)**
   - Homepage Design Specification
   - Species Page Specification (/dogs - FULL 9-part structure example)
   - **9-Part Authority Structure** (NON-NEGOTIABLE for all pages)

4. **[UI-UX-SPEC-PART-4-ADDITIONAL-PAGES.md](./UI-UX-SPEC-PART-4-ADDITIONAL-PAGES.md)**
   - Pricing Page Specification (CURRENTLY 404 - P0 FIX)
   - Service Provider Landing Page (NEW - High Value)
   - Workflow Page Example (/workflows/heat-tracking)

5. **[UI-UX-SPEC-PART-5-VISUAL-COMPONENTS-ANTIPATTERNS.md](./UI-UX-SPEC-PART-5-VISUAL-COMPONENTS-ANTIPATTERNS.md)**
   - Visual Design Direction (typography, spacing, colors)
   - Component Specifications (buttons, cards, forms, TL;DR boxes)
   - Accessibility Requirements (WCAG 2.1 AA)
   - Mobile & Responsive Strategy

6. **[UI-UX-SPEC-PART-6-ANTIPATTERNS-HANDOFF.md](./UI-UX-SPEC-PART-6-ANTIPATTERNS-HANDOFF.md)**
   - Anti-Patterns to Avoid (critical - don't skip)
   - Engineer Handoff Notes
   - Implementation Priorities (P0, P1, P2)
   - Pre-Launch Validation Checklist

---

## Implementation Priorities (What to Do First)

### P0 - Must Launch (BLOCKING CONVERSIONS)

1. **Fix Pricing Page (Currently 404)** - CRITICAL
   - URL: `/pricing`
   - Reference: Part 4, Pricing Page Specification
   - 3-tier pricing table, transparent, ROI calculator section
   - FAQ specific to pricing questions

2. **Create Service Provider Landing Page** - NEW PAGE (High Value)
   - URL: `/service-providers`
   - Reference: Part 4, Service Provider Page Specification
   - Full 9-part authority structure
   - $49/month pricing transparency
   - "Create Service Listing" CTA

3. **Implement 9-Part Authority Structure on Existing Species Pages**
   - `/dogs`, `/cats`, `/horses` (currently exist but incomplete)
   - Reference: Part 3, Species Page Specification (full /dogs example)
   - **Required 9 sections:**
     1. What this page is about (with TL;DR box)
     2. Why users search for this
     3. How users handle it today
     4. Where that breaks down
     5. What correct system looks like
     6. How BreederHQ supports it
     7. Who this is for
     8. Who this is NOT for
     9. Real user questions (FAQ section)

4. **Add TL;DR Boxes to All Authority Pages**
   - Every species, workflow, comparison page needs TL;DR box at top
   - Reference: Part 5, TL;DR Box Component Specification
   - Sticky on mobile, collapsible
   - AI summarization depends on this

5. **Implement Breadcrumb Navigation**
   - Every page except homepage
   - Reference: Part 5, Breadcrumb Component Specification
   - SEO + UX critical
   - Format: `Home > For Breeders > Dog Breeding`

6. **Add Internal Linking Strategy**
   - Every page must link to:
     - One primary page (category authority)
     - One workflow page (process authority)
     - One comparison page (decision authority)
   - Reference: Part 2, Internal Linking Strategy
   - Example implementation in Part 3 (species page)

7. **Ensure Mobile Responsiveness**
   - All touch targets ≥ 44px
   - Text ≥ 16px on mobile (prevents iOS zoom)
   - Sticky mobile CTA (bottom "Start Free Trial" button)
   - Reference: Part 5, Mobile & Responsive Strategy

---

### P1 - High Value (AUTHORITY POSITIONING)

8. **Create Workflow Pages** (NEW)
   - `/workflows` (hub page)
   - `/workflows/heat-tracking`
   - `/workflows/breeding-plans`
   - `/workflows/whelping`
   - `/workflows/pedigrees`
   - `/workflows/client-management`
   - `/workflows/health-testing`
   - Reference: Part 4, Workflow Page Example

9. **Create Comparison Pages** (NEW)
   - `/compare` (hub page)
   - `/compare/best-dog-breeding-software`
   - `/compare/best-cat-breeding-software`
   - `/compare/software-vs-spreadsheets`
   - Reference: Part 2, Canonical Page Map

10. **Add Trust Signals to Homepage**
    - Testimonials (real breeder photos, names, locations)
    - Metrics ("Used by 1,200+ breeders")
    - Verification badge explanation
    - Reference: Part 3, Homepage Design Specification

11. **Create Buyer Education Page** (NEW)
    - `/buyers/evaluate-breeders`
    - `/buyers/red-flags`
    - `/buyers/health-tests`
    - Education-focused, not promotional
    - Reference: Part 2, Canonical Page Map

12. **Implement FAQ Accordions**
    - Collapsible on mobile
    - `<dl>` semantic HTML (Q&A pairs)
    - Reference: Part 5, Component Specifications

---

### P2 - Polish (CONVERSION OPTIMIZATION)

13. **Add Species Visual Identity** (Optional)
    - Species-specific color accents (dogs: amber, cats: teal, horses: brown)
    - Reference: Part 5, Color Usage Rules

14. **Create ROI Calculator** (Pricing Page)
    - Interactive widget
    - User inputs: # breeding animals, litters/year
    - Outputs: ROI calculation vs missed deadlines
    - Reference: Part 4, Pricing Page Specification

15. **Add Marketplace Preview Section** (Homepage)
    - Show buyers what marketplace looks like
    - "Find Breeders" / "Find Services" preview
    - Reference: Part 3, Homepage Design Specification

16. **Implement Skeleton Loading States**
    - All pages with async data
    - Gray placeholders matching content structure
    - Reference: Part 5, Component Styling Philosophy

17. **Add Schema.org Structured Data**
    - SoftwareApplication (product pages)
    - FAQPage (FAQ sections)
    - BreadcrumbList (navigation)
    - AggregateRating (testimonials, if present)
    - Reference: Part 6, Pre-Launch Validation Checklist

---

## Technical Requirements

### Canonical URLs (MUST Match Exactly)

```
Primary Pages:
/ (homepage)
/dogs
/cats
/horses
/goats
/rabbits
/sheep
/service-providers
/pricing

Workflow Pages (NEW):
/workflows
/workflows/heat-tracking
/workflows/breeding-plans
/workflows/whelping
/workflows/pedigrees
/workflows/client-management
/workflows/health-testing

Comparison Pages (NEW):
/compare
/compare/best-dog-breeding-software
/compare/best-cat-breeding-software
/compare/software-vs-spreadsheets

Buyer Pages (NEW):
/buyers
/buyers/evaluate-breeders
/buyers/red-flags
/buyers/health-tests

Support Pages:
/help
/about
/contact
/success-stories
```

**301 Redirects Required:**
```
/dog-breeding → /dogs
/dog-breeder-software → /dogs
/cat-breeding → /cats
/equine-breeding → /horses
```

---

### Semantic HTML5 (REQUIRED for SEO + Accessibility)

Every page MUST use this structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title | BreederHQ</title>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to content</a>

  <header>
    <nav aria-label="Primary navigation">
      <!-- Navigation -->
    </nav>
  </header>

  <main id="main-content">
    <article> <!-- For content pages -->
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol>
          <li><a href="/">Home</a></li>
          <li>›</li>
          <li aria-current="page">Current Page</li>
        </ol>
      </nav>

      <h1>Page Title</h1>

      <aside class="tldr-box" role="complementary" aria-label="Page summary">
        <h2>TL;DR</h2>
        <p>Summary...</p>
      </aside>

      <section>
        <h2>Section Title</h2>
        <!-- Content -->
      </section>

      <!-- More sections (9-part structure) -->

      <section>
        <h2>Frequently Asked Questions</h2>
        <dl>
          <dt>Question?</dt>
          <dd>Answer.</dd>
        </dl>
      </section>

      <aside class="related-resources">
        <h2>Related Resources</h2>
        <ul>
          <li><a href="/workflows/heat-tracking">Heat Tracking Workflow</a></li>
          <li><a href="/compare/software-vs-spreadsheets">Compare to Spreadsheets</a></li>
          <li><a href="/buyers/evaluate-breeders">Buyer's Guide</a></li>
        </ul>
      </aside>
    </article>
  </main>

  <footer>
    <nav aria-label="Footer navigation">
      <!-- Footer -->
    </nav>
  </footer>
</body>
</html>
```

**Why This Matters:**
- Screen readers navigate by landmarks
- AI crawlers understand hierarchy
- Google uses semantic structure for rich snippets

---

### Visual Design Tokens

Extract from existing site and document:

```css
/* Typography */
--font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

/* Heading Sizes */
--font-size-h1: 36px; /* Mobile: 28px */
--font-size-h2: 28px; /* Mobile: 24px */
--font-size-h3: 22px; /* Mobile: 20px */
--font-size-body: 16px;
--line-height-body: 1.6;

/* Spacing (8px grid) */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;

/* Colors (extract from current site) */
--brand-color: /* Primary CTA color */
--brand-color-dark: /* Hover state */
--brand-color-light: /* Focus state */

--gray-900: #1a1a1a; /* Body text */
--gray-700: #4a4a4a; /* Secondary text */
--gray-500: #6b6b6b; /* Placeholder text */
--gray-300: #d1d1d1; /* Borders */
--gray-100: #f5f5f5; /* Subtle backgrounds */

--success-color: #10b981; /* Verification badges */
--error-color: #ef4444; /* Form errors */
--warning-color: #f59e0b;
--info-color: #3b82f6;

/* Breakpoints */
--breakpoint-mobile: 767px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-large: 1440px;
```

---

### Component Implementations

#### Button Component

```html
<!-- Primary Button -->
<button class="btn btn-primary">Start Free Trial</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Watch Demo</button>

<!-- Tertiary Button (link style) -->
<a href="/workflows" class="btn-link">Learn more →</a>
```

```css
.btn {
  display: inline-block;
  padding: 12px 24px;
  min-height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background-color 200ms ease;
  text-decoration: none;
}

.btn:focus {
  outline: 2px solid var(--brand-color);
  outline-offset: 2px;
}

.btn-primary {
  background: var(--brand-color);
  color: white;
}

.btn-primary:hover {
  background: var(--brand-color-dark);
}

.btn-secondary {
  background: transparent;
  color: var(--brand-color);
  border: 2px solid var(--brand-color);
}

.btn-secondary:hover {
  background: var(--brand-color-light);
}

.btn-link {
  color: var(--brand-color);
  font-weight: 600;
  text-decoration: none;
}

.btn-link:hover {
  text-decoration: underline;
}
```

#### TL;DR Box Component

```html
<aside class="tldr-box" role="complementary" aria-label="Page summary">
  <h2 class="tldr-title">TL;DR</h2>
  <p class="tldr-content">
    BreederHQ is breeding management software for professional breeders
    with 3+ breeding animals. It replaces spreadsheets, email, and filing
    cabinets with one system for heat cycles, pedigrees, and clients.
  </p>
</aside>
```

```css
.tldr-box {
  background: var(--gray-100);
  border-left: 4px solid var(--brand-color);
  padding: 24px;
  margin: 32px 0;
  border-radius: 4px;
}

.tldr-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.tldr-content {
  font-size: 16px;
  line-height: 1.6;
  color: var(--gray-700);
}

/* Mobile: sticky */
@media (max-width: 767px) {
  .tldr-box {
    position: sticky;
    top: 16px;
    z-index: 10;
  }
}
```

#### Form Input Component

```html
<div class="form-field">
  <label for="email" class="form-label">
    Email Address <span class="form-required">*</span>
  </label>
  <input
    type="email"
    id="email"
    class="form-input"
    placeholder="you@example.com"
    required
    aria-required="true"
    aria-describedby="email-error"
  />
  <span class="form-error" id="email-error" role="alert" hidden>
    Please enter a valid email.
  </span>
</div>
```

```css
.form-field {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.form-required {
  color: var(--error-color);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  min-height: 48px;
  font-size: 16px;
  border: 1px solid var(--gray-300);
  border-radius: 4px;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand-color);
  box-shadow: 0 0 0 2px var(--brand-color-light);
}

.form-input[aria-invalid="true"] {
  border-color: var(--error-color);
}

.form-error {
  display: block;
  font-size: 14px;
  color: var(--error-color);
  margin-top: 6px;
}
```

---

## Pre-Launch Validation Checklist

### Content Validation
- [ ] Every authority page has 9-part structure
- [ ] Every page has TL;DR box
- [ ] Every page has FAQ section (minimum 5 questions)
- [ ] Every page has "Related Resources" section (3+ internal links)
- [ ] No marketing buzzwords without substantiation
- [ ] Consistent terminology across pages
- [ ] Explicit conclusions stated clearly

### Visual Design Validation
- [ ] Typography follows spec (H1 36px, H2 28px, body 16px on desktop)
- [ ] Spacing follows 8px grid (16px, 24px, 32px, 48px, 64px)
- [ ] Color contrast passes WCAG AA (4.5:1 minimum)
- [ ] All images have descriptive alt text
- [ ] No stock photos (real breeder photos or no photos)

### Mobile Validation
- [ ] All touch targets ≥ 44px height
- [ ] Text ≥ 16px on mobile
- [ ] No horizontal scrolling
- [ ] Sticky mobile CTA present
- [ ] Forms single-column on mobile
- [ ] Tested on iPhone SE and Android

### Accessibility Validation
- [ ] Keyboard navigation works (Tab through every page)
- [ ] Focus indicators visible
- [ ] Skip-to-content link present
- [ ] Screen reader test (VoiceOver or NVDA)
- [ ] Semantic HTML5 landmarks
- [ ] Form labels visible (not placeholder-as-label)
- [ ] WAVE tool: zero violations

### SEO Validation
- [ ] Semantic HTML5 on all pages
- [ ] Breadcrumb navigation (except homepage)
- [ ] Schema.org JSON-LD (SoftwareApplication, FAQPage, BreadcrumbList)
- [ ] Internal linking (3+ contextual links per page)
- [ ] Canonical URLs (no duplicates)
- [ ] 301 redirects for old URLs
- [ ] Sitemap submitted to Google Search Console

### Performance Validation
- [ ] Lighthouse: 90+ Performance, 100 Accessibility, 100 SEO
- [ ] Images optimized (WebP, lazy loading)
- [ ] CSS minified
- [ ] System fonts used (no custom font downloads)

---

## Anti-Patterns to Avoid (CRITICAL)

Reference Part 6 for full list. Key ones:

### ❌ Feature-First Navigation
**DON'T:** "Features > Records > Reports"
**DO:** "For Breeders > Dog Breeding"

### ❌ Marketing Buzzwords
**DON'T:** "Innovative", "Streamlined", "Powerful" without proof
**DO:** "Track heat cycles for 3+ breeding females with automatic reminders"

### ❌ Hiding Pricing
**DON'T:** "Contact us for pricing"
**DO:** Transparent pricing page with clear tiers

### ❌ Placeholder-as-Label
**DON'T:** `<input placeholder="Email" />`
**DO:** `<label>Email</label><input placeholder="you@example.com" />`

### ❌ Removing Focus Outline
**DON'T:** `*:focus { outline: none; }`
**DO:** `*:focus { outline: 2px solid var(--brand-color); }`

---

## Questions for You Before Starting

1. **Tech Stack Confirmation:**
   - What framework is the marketing site built in? (Next.js? Static HTML? Astro?)
   - Where is the codebase located? (Separate repo? Monorepo `apps/www`?)
   - Is this replacing https://breederhq-www.vercel.app/ or new domain?

2. **Existing Codebase:**
   - Can you extract current brand color (hex value)?
   - What's the current component library (if any)?
   - CSS approach (Tailwind? CSS Modules? Vanilla CSS?)

3. **Content:**
   - Do you have real breeder testimonials with photos?
   - Do you have breeder count metrics ("1,200+ breeders" - is this accurate)?
   - Do you have species-specific workflow screenshots?

4. **Analytics:**
   - How are we tracking conversions (trial signups)?
   - What analytics platform (Google Analytics, Plausible)?

---

## Success Criteria

Your implementation is successful when:

1. ✅ **Pricing page fixed** (no more 404)
2. ✅ **All P0 pages live** (Homepage, Pricing, /dogs, /service-providers)
3. ✅ **9-part structure implemented** on all species pages
4. ✅ **TL;DR boxes present** on all authority pages
5. ✅ **Breadcrumb navigation** on all pages except homepage
6. ✅ **Internal linking strategy** implemented (3+ links per page)
7. ✅ **Mobile responsive** (44px touch targets, 16px text, sticky CTA)
8. ✅ **WCAG 2.1 AA compliant** (WAVE tool zero violations)
9. ✅ **Lighthouse scores:** 90+ Performance, 100 Accessibility, 100 SEO
10. ✅ **Semantic HTML5** on all pages

---

## When You're Stuck

**If specification is ambiguous:**
- Check related sections (often clarified elsewhere)
- Look at anti-patterns (tells you what NOT to do)
- Default to simpler solution
- Ask before guessing

**If design looks "off":**
- Check spacing (8px grid)
- Check typography sizes (H1 36px, H2 28px, body 16px)
- Check color contrast (WebAIM tool)
- Compare to existing site patterns

**If accessibility fails:**
- Run WAVE tool
- Test keyboard navigation (Tab key)
- Test screen reader (VoiceOver/NVDA)
- Check semantic HTML

**If mobile looks broken:**
- Test on iPhone SE (smallest modern screen)
- Check touch targets (44px minimum)
- Check text size (16px minimum)
- Check for horizontal scrolling

---

## Final Notes

**Priorities:**

1. **Content structure > Visual polish** - 9-part structure is non-negotiable
2. **Accessibility > Aesthetics** - WCAG AA is non-negotiable
3. **Mobile = Desktop** - Both first-class experiences
4. **Performance matters** - Fast load = better conversions
5. **Semantic HTML = SEO** - Structure benefits AI crawling

**You've got this.** The specification is detailed to eliminate guesswork. Implement systematically, validate at each phase, ask when stuck.

---

## Document References

1. [COMPREHENSIVE-UI-UX-DESIGN-SPECIFICATION.md](./COMPREHENSIVE-UI-UX-DESIGN-SPECIFICATION.md)
2. [UI-UX-SPEC-PART-2-STRATEGY.md](./UI-UX-SPEC-PART-2-STRATEGY.md)
3. [UI-UX-SPEC-PART-3-PAGE-SPECIFICATIONS.md](./UI-UX-SPEC-PART-3-PAGE-SPECIFICATIONS.md)
4. [UI-UX-SPEC-PART-4-ADDITIONAL-PAGES.md](./UI-UX-SPEC-PART-4-ADDITIONAL-PAGES.md)
5. [UI-UX-SPEC-PART-5-VISUAL-COMPONENTS-ANTIPATTERNS.md](./UI-UX-SPEC-PART-5-VISUAL-COMPONENTS-ANTIPATTERNS.md)
6. [UI-UX-SPEC-PART-6-ANTIPATTERNS-HANDOFF.md](./UI-UX-SPEC-PART-6-ANTIPATTERNS-HANDOFF.md)

---

*Ready to implement. Start with P0 priorities.*
