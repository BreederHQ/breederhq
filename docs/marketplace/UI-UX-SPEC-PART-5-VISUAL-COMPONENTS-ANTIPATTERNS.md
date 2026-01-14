# BreederHQ UI/UX Specification - Part 5: Visual Design, Components & Anti-Patterns

*Continuation of UI-UX-SPEC-PART-4-ADDITIONAL-PAGES.md*

---

## Visual Design Direction

### Typography Strategy

**Objective:** Readable for humans at a glance, scannable for AI crawlers

**Heading Hierarchy:**

```
H1: 36px (mobile: 28px) - Bold - Page title only (one per page)
    Used for: Primary page intent ("Dog Breeding Software")
    Line-height: 1.2
    Max-width: 60ch (characters)

H2: 28px (mobile: 24px) - Semi-bold - Major sections
    Used for: 9-part structure sections ("How Breeders Handle It Today")
    Line-height: 1.3
    Max-width: 65ch

H3: 22px (mobile: 20px) - Semi-bold - Subsections
    Used for: Sub-topics within major sections
    Line-height: 1.4
    Max-width: 70ch

H4: 18px (mobile: 16px) - Semi-bold - Component headers
    Used for: FAQ questions, card titles, form section labels
    Line-height: 1.5

Body: 16px (mobile: 16px) - Regular - All body text
    Line-height: 1.6 (optimal readability)
    Max-width: 70ch (prevents eye strain from long lines)

Small: 14px - Regular - Metadata, captions
    Line-height: 1.5
```

**Font Families:**

```
Primary (Headings & UI):
- System font stack for performance:
  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif

Body Text:
- Same system stack (consistency + performance > custom fonts)

Monospace (code examples, data fields):
- "SF Mono", Monaco, "Cascadia Code", "Courier New", monospace
```

**Rationale:**
- System fonts load instantly (no FOUT/FOIT flash)
- Native to each OS (feels familiar, not "web-ish")
- Excellent readability optimized by Apple/Microsoft/Google
- AI crawlers parse cleanly (semantic HTML, not custom fonts)

### Spacing Rhythm

**8px Grid System:**

```
Micro:    4px   (icon padding, fine adjustments)
Small:    8px   (component inner spacing)
Default:  16px  (between related elements)
Medium:   24px  (between components)
Large:    32px  (between sections within page)
XLarge:   48px  (between major page sections)
XXLarge:  64px  (section dividers, hero spacing)
```

**Application:**

```
Card Component:
- Padding: 24px (medium)
- Gap between cards: 16px (default)
- Margin bottom: 32px (large) when last in section

Section Spacing:
- Section padding top/bottom: 48px (XLarge)
- Major hero section: 64px (XXLarge) top/bottom
- Between H2 sections: 48px (XLarge)
- Between paragraphs: 16px (default)
```

**Why 8px base:**
- Divisible by 2, 4, 8 (easy scaling for responsive)
- Aligns with iOS/Android grid systems
- Small enough for precision, large enough for consistency

### Color Usage Rules

**Brand Colors (Preserve from current site):**

```
Primary Brand:
- Exact values TBD (extract from current site CSS)
- Used for: Primary CTAs, active navigation, focus states
- Ensure: WCAG AA contrast (4.5:1 minimum) against white

Secondary/Accent:
- Species-specific accents (optional differentiation):
  - Dogs: Warm amber
  - Cats: Cool teal
  - Horses: Rich brown
  - Goats: Sage green
  - Rabbits: Soft lavender
  - Sheep: Neutral gray-blue

Neutral Scale:
- Black: #000000 (headings, high-emphasis text)
- Gray-900: #1a1a1a (body text)
- Gray-700: #4a4a4a (secondary text)
- Gray-500: #6b6b6b (placeholder text, disabled states)
- Gray-300: #d1d1d1 (borders, dividers)
- Gray-100: #f5f5f5 (subtle backgrounds)
- White: #ffffff (page background, card backgrounds)

Semantic Colors:
- Success: #10b981 (verification badges, positive states)
- Warning: #f59e0b (important notices, caution)
- Error: #ef4444 (form validation, destructive actions)
- Info: #3b82f6 (informational messages, tooltips)
```

**Color Application Guidelines:**

1. **Text Contrast:**
   - Body text: Gray-900 on White (21:1 contrast - excellent)
   - Secondary text: Gray-700 on White (7:1 contrast - good)
   - Ensure ALL text meets WCAG AA (4.5:1 minimum)

2. **Button Contrast:**
   - Primary CTA: Brand color background + White text (check 4.5:1)
   - Secondary CTA: Outlined (brand color border + brand color text)
   - Tertiary CTA: Text-only (brand color text, underline on hover)

3. **Focus States (Accessibility):**
   - 2px solid brand color outline
   - 2px offset (border-offset or outline-offset)
   - Visible on keyboard navigation (never remove focus rings)

4. **Verification Badges:**
   - Success green background (#10b981)
   - White checkmark icon
   - Small text label ("Verified") in white

### Component Styling Philosophy

**Goals:**
1. **Clarity** - Purpose obvious at a glance
2. **Consistency** - Reusable patterns reduce cognitive load
3. **Scannability** - Visual hierarchy supports quick reading
4. **Trust** - Professional polish without over-design
5. **Performance** - Minimal CSS, no excessive animations

**Principles:**

1. **Whitespace Is Design**
   - Don't fill every pixel
   - Generous padding in cards (24px minimum)
   - Section breathing room (48px between)

2. **Borders Over Shadows**
   - Subtle 1px borders (Gray-300) for component definition
   - Avoid heavy drop-shadows (feels dated, not professional)
   - Exception: Modals can have subtle shadow (0 4px 20px rgba(0,0,0,0.1))

3. **Rounded Corners (Subtle)**
   - Cards: 8px border-radius
   - Buttons: 6px border-radius
   - Inputs: 4px border-radius
   - Never >12px (overly playful)

4. **Hover States (Subtle)**
   - Buttons: Darken by 10% on hover
   - Links: Underline on hover
   - Cards: Lift by 2px + subtle shadow (not dramatic)

5. **Loading States**
   - Skeleton screens (gray placeholders) for content
   - Spinner for actions (button submissions)
   - Never block entire page unless critical error

### What Makes This Feel Premium

**Premium Design Signals:**

1. ✅ **Typography** - Clean hierarchy, generous line-height, max-width on text
2. ✅ **Spacing** - Consistent rhythm, not cramped
3. ✅ **Microinteractions** - Smooth transitions (200-300ms ease), not jarring
4. ✅ **Real Content** - Actual breeder photos, not stock images
5. ✅ **Semantic Colors** - Used purposefully, not decoratively
6. ✅ **Fast Load** - System fonts, optimized images, minimal JS
7. ✅ **Mobile Polish** - Touch-friendly targets (44px minimum), thumb-zone CTAs
8. ✅ **Accessibility** - Keyboard nav, focus indicators, screen reader support

**What DOESN'T Make It Premium (Avoid):**

1. ❌ Heavy animations (parallax, scroll-jacking)
2. ❌ Gradient backgrounds everywhere
3. ❌ Overly rounded corners (>12px)
4. ❌ Excessive shadows (3D effects)
5. ❌ Custom fonts (performance cost, FOUT)
6. ❌ Video backgrounds (distraction + performance)
7. ❌ Gamification (badges, points, streaks - not appropriate for professional tools)

---

## Component Specifications

### Reusable Component Library

#### 1. Button Component

**Variants:**

```
Primary Button:
- Background: Brand color
- Text: White
- Padding: 12px 24px (comfortable touch target)
- Border-radius: 6px
- Font-size: 16px
- Font-weight: 600 (semi-bold)
- Min-height: 44px (mobile touch target)
- Hover: Darken background 10%
- Active: Darken 15% + slight scale (0.98)
- Disabled: Gray-300 background + Gray-500 text (no hover)
- Focus: 2px brand color outline

Usage: Primary CTA ("Start Free Trial", "Create Listing")

Secondary Button:
- Background: Transparent
- Text: Brand color
- Border: 2px solid brand color
- Padding: 10px 22px (adjust for border)
- Other styles: Same as primary
- Hover: Background = brand color 10% opacity

Usage: Secondary CTA ("Watch Demo", "Learn More")

Tertiary Button (Text Link Style):
- Background: None
- Text: Brand color
- Underline: On hover only
- Padding: 0 (inline with text)
- Font-weight: 600

Usage: "View all species", "See comparison"
```

**Accessibility:**
- Semantic `<button>` element (not `<div>` with onclick)
- Aria-label if icon-only
- Focus indicator always visible
- Keyboard navigable (Enter/Space to activate)

#### 2. Card Component

**Structure:**

```html
<article class="card">
  <img src="..." alt="..." class="card-image" />
  <div class="card-content">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">Description text...</p>
    <a href="..." class="card-link">Learn more →</a>
  </div>
</article>
```

**Styles:**

```css
.card {
  background: white;
  border: 1px solid gray-300;
  border-radius: 8px;
  padding: 24px;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.card-image {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: black;
}

.card-description {
  font-size: 16px;
  line-height: 1.6;
  color: gray-700;
  margin-bottom: 16px;
}

.card-link {
  color: brand-color;
  font-weight: 600;
  text-decoration: none;
}

.card-link:hover {
  text-decoration: underline;
}
```

**Responsive:**
- Mobile: Stack 1 column
- Tablet: 2 columns (gap: 16px)
- Desktop: 3 columns (gap: 24px)

**Usage:**
- Species cards on homepage
- Workflow feature cards
- Service listing cards
- Testimonial cards

#### 3. Verification Badge Component

**Structure:**

```html
<span class="badge badge-verified">
  <svg class="badge-icon">...</svg>
  <span class="badge-text">Verified</span>
</span>
```

**Styles:**

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px; /* pill shape */
  font-size: 14px;
  font-weight: 600;
}

.badge-verified {
  background: #10b981; /* success green */
  color: white;
}

.badge-icon {
  width: 16px;
  height: 16px;
}
```

**Variants:**
- `.badge-verified` - Green (breeder/service provider verified)
- `.badge-premium` - Gold (premium tier indicator)
- `.badge-featured` - Blue (featured listing)

**Usage:**
- Breeder profile headers
- Service provider listings
- Marketplace search results

#### 4. Form Input Component

**Structure:**

```html
<div class="form-field">
  <label for="input-id" class="form-label">
    Label Text
    <span class="form-required">*</span>
  </label>
  <input
    type="text"
    id="input-id"
    class="form-input"
    placeholder="Placeholder..."
    aria-required="true"
    aria-describedby="input-hint"
  />
  <span class="form-hint" id="input-hint">
    Optional hint text
  </span>
  <span class="form-error" id="input-error" role="alert">
    Error message appears here
  </span>
</div>
```

**Styles:**

```css
.form-field {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: gray-900;
  margin-bottom: 6px;
}

.form-required {
  color: #ef4444; /* error red */
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid gray-300;
  border-radius: 4px;
  transition: border-color 150ms ease;
}

.form-input:focus {
  outline: none;
  border-color: brand-color;
  box-shadow: 0 0 0 2px rgba(brand-color, 0.2);
}

.form-input.error {
  border-color: #ef4444;
}

.form-hint {
  display: block;
  font-size: 14px;
  color: gray-700;
  margin-top: 6px;
}

.form-error {
  display: none;
  font-size: 14px;
  color: #ef4444;
  margin-top: 6px;
}

.form-input.error ~ .form-error {
  display: block;
}
```

**Accessibility:**
- Labels always visible (not placeholders-as-labels)
- Required indicator (*) for screen readers
- Error messages with role="alert"
- Focus indicators clearly visible
- Min touch target: 44px height on mobile

#### 5. TL;DR Summary Box Component

**Purpose:** Provide AI-summarizable content at top of authority pages

**Structure:**

```html
<aside class="tldr-box" role="complementary" aria-label="Page summary">
  <h2 class="tldr-title">TL;DR</h2>
  <p class="tldr-content">
    Concise 2-3 sentence summary of page content.
    Includes explicit conclusion and who it's for.
  </p>
</aside>
```

**Styles:**

```css
.tldr-box {
  background: gray-100;
  border-left: 4px solid brand-color;
  padding: 24px;
  margin: 32px 0;
  border-radius: 4px;
}

.tldr-title {
  font-size: 18px;
  font-weight: 700;
  color: gray-900;
  margin-bottom: 12px;
}

.tldr-content {
  font-size: 16px;
  line-height: 1.6;
  color: gray-700;
}
```

**Mobile Adaptation:**
- Sticky on scroll (position: sticky; top: 16px)
- Collapsible (click to minimize/expand)
- Max-height: 200px with scroll if content long

**Usage:**
- Top of all species pages
- Top of all workflow pages
- Top of all comparison pages
- Required for SEO/AI authority positioning

#### 6. Breadcrumb Component

**Structure:**

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    <li class="breadcrumb-item">
      <a href="/">Home</a>
    </li>
    <li class="breadcrumb-separator" aria-hidden="true">›</li>
    <li class="breadcrumb-item">
      <a href="/dogs">Dog Breeding</a>
    </li>
    <li class="breadcrumb-separator" aria-hidden="true">›</li>
    <li class="breadcrumb-item" aria-current="page">
      Heat Tracking
    </li>
  </ol>
</nav>
```

**Styles:**

```css
.breadcrumb {
  margin-bottom: 24px;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
}

.breadcrumb-item a {
  color: brand-color;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item[aria-current="page"] {
  color: gray-700;
  font-weight: 600;
}

.breadcrumb-separator {
  color: gray-500;
  user-select: none;
}
```

**SEO Benefits:**
- Semantic HTML5 `<nav>` with aria-label
- Structured data for Google (JSON-LD)
- Helps AI understand page hierarchy
- Improves internal linking

---

## Accessibility Requirements

### WCAG 2.1 Level AA Compliance (Non-Negotiable)

**Color Contrast:**
- ✅ Normal text (16px): 4.5:1 minimum contrast ratio
- ✅ Large text (18px+ or 14px+ bold): 3:1 minimum
- ✅ UI components (buttons, form inputs): 3:1 minimum
- ✅ Test with WebAIM Contrast Checker before launch

**Keyboard Navigation:**
- ✅ All interactive elements reachable with Tab key
- ✅ Logical tab order (matches visual layout)
- ✅ Focus indicators always visible (never `outline: none` without replacement)
- ✅ Skip-to-content link for screen readers
- ✅ Modal dialogs trap focus (Tab stays within modal)

**Screen Reader Support:**
- ✅ Semantic HTML5 elements (`<nav>`, `<main>`, `<article>`, `<aside>`)
- ✅ ARIA labels for icon-only buttons (`aria-label="Close"`)
- ✅ ARIA roles where semantic HTML insufficient (`role="alert"` for errors)
- ✅ ARIA live regions for dynamic content (`aria-live="polite"`)
- ✅ Alt text for all images (descriptive, not "image of...")
- ✅ Form labels always visible (not placeholder-as-label)

**Responsive Text:**
- ✅ Text resizable to 200% without horizontal scroll
- ✅ No fixed pixel widths on text containers
- ✅ Zoom-friendly layout (no broken designs at 200% zoom)

**Mobile Touch Targets:**
- ✅ Minimum 44px × 44px touch targets (WCAG 2.5.5)
- ✅ Adequate spacing between targets (8px minimum)
- ✅ Large enough tap areas for forms and buttons

### How Semantic Structure Benefits AI Crawling

**AI Optimization Through Accessibility:**

1. **Semantic HTML = Clear Structure**
   - `<h1>` through `<h6>` = content hierarchy
   - AI extracts key topics from heading structure
   - Well-structured headings = better summarization

2. **ARIA Labels = Context**
   - `aria-label` provides context for icon buttons
   - AI understands purpose without visual cues
   - Example: `<button aria-label="Start free trial">` vs `<button>Try</button>`

3. **Alt Text = Content Understanding**
   - AI "reads" images through alt text
   - Descriptive alt text improves content comprehension
   - Example: `alt="Dog breeder tracking heat cycle in mobile app"` vs `alt="app screenshot"`

4. **Structured Data = AI Citations**
   - Schema.org markup (JSON-LD) for:
     - SoftwareApplication (product info)
     - FAQPage (Q&A extraction)
     - BreadcrumbList (page hierarchy)
     - AggregateRating (social proof)
   - AI systems prioritize content with structured data

---

## Mobile & Responsive Strategy

### Breakpoint Strategy

```
Mobile:     320px - 767px   (1 column, stacked layout)
Tablet:     768px - 1023px  (2 columns where appropriate)
Desktop:    1024px - 1439px (3 columns, max-width: 1200px)
Large:      1440px+         (3 columns, max-width: 1400px, centered)
```

**Design Mobile-First:**
- Start with mobile layout (simplest)
- Add complexity at larger breakpoints
- Never design desktop-first and shrink down

### Mobile-Specific Patterns

**Navigation:**
- Hamburger menu (≤767px)
- Expandable categories (accordion-style)
- Sticky "Start Free Trial" button at bottom (z-index: 1000)
- Quick access to "Pricing" and "Login" in header

**Content:**
- Collapse long sections with "Read more" button
- Tabbed interfaces for feature comparisons
- Horizontal scrolling for species cards (swipe left/right)
- FAQ accordion (collapsed by default)

**Forms:**
- Full-width inputs (no side-by-side fields on mobile)
- Large touch targets (44px minimum height)
- Input type="tel" for phone, type="email" for email (triggers correct keyboard)
- Floating labels or top labels (not inline)

**Marketplace Filters:**
- Filter panel in slide-out drawer (hamburger icon)
- Sticky "Apply Filters" button at bottom of drawer
- Clear visual indication of active filters (chip badges)
- "Clear all" option

**CTAs:**
- Sticky primary CTA at bottom (doesn't scroll away)
- Full-width buttons on mobile (easier to tap)
- Adequate spacing between stacked buttons (16px minimum)

### Touch Target Sizes

**WCAG 2.5.5 Compliance:**

```
Minimum Touch Target: 44px × 44px

Buttons:         48px height (padding: 12px 24px)
Form inputs:     48px height (padding: 12px 16px)
Checkboxes:      24px × 24px (with 10px padding = 44px target)
Radio buttons:   24px × 24px (with 10px padding = 44px target)
Links in text:   Inherit line-height (1.6) = sufficient
Nav links:       48px height minimum
Icon buttons:    44px × 44px minimum
```

**Spacing Between Targets:**
- 8px minimum between buttons
- 16px between form fields
- 12px between navigation items

### What Adapts vs Hides

**Adapt (Change Layout, Don't Remove):**
- ✅ Navigation: Hamburger on mobile, full menu on desktop
- ✅ Columns: Stack on mobile, side-by-side on desktop
- ✅ Tables: Card-style on mobile, table on desktop
- ✅ Images: Smaller dimensions on mobile, larger on desktop

**Hide (Conditionally Remove for Mobile):**
- ❌ Decorative elements (background patterns, accent images)
- ❌ Secondary CTAs if space is tight (keep primary only)
- ❌ Verbose helper text (show shorter version on mobile)

**NEVER Hide:**
- ⛔ Core content (all 9-part structure sections must be accessible)
- ⛔ Primary CTAs (Start Free Trial must always be visible)
- ⛔ Critical navigation (Home, Pricing, Login)
- ⛔ Form fields (all fields accessible on mobile)

---

*Continues in Part 6: Anti-Patterns & Engineer Handoff...*
