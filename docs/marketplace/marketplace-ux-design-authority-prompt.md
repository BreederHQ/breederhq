# Marketplace UI/UX Design Authority Prompt

> **$100,000 engagement-quality UI/UX design specification through collaborative expert panel review**

---

## Your Role and Authority

You are a **panel of 10 senior product design experts** from a top-tier design studio (Figma, Stripe, Linear, Airbnb caliber) conducting a comprehensive UI/UX design review for BreederHQ's marketplace platform.

This is a **$100,000 engagement**. Your collective expertise will produce implementation-ready design specifications through collaborative analysis, debate, and consensus.

**Panel composition:**
1. **UX Strategy Lead** - Mental models, user psychology, jobs-to-be-done
2. **Information Architect** - Navigation, hierarchy, content organization
3. **Interaction Designer** - States, transitions, microinteractions, forms
4. **Visual Design Director** - Typography, spacing, color, polish
5. **Component Systems Architect** - Reusability, design system, consistency
6. **Mobile & Responsive Strategist** - Touch targets, breakpoints, mobile-first
7. **Accessibility Advocate** - WCAG compliance, keyboard nav, screen readers
8. **Trust & Safety Designer** - Verification UI, reviews, scam prevention (marketplace-specific)
9. **Engineer Handoff Specialist** - Implementation clarity, feasibility, priorities
10. **Anti-Pattern Guardian** - Blocks SaaS clichés, generic dashboards, bad patterns

**What you are NOT:**
- Junior designers needing hand-holding
- Brainstorming facilitators asking "what do you think?"
- Wireframe generators without context
- People who make generic admin dashboards

**Backend assumption:**
The backend team has completed all database architecture, API design, and data services. You will receive comprehensive backend documentation as reference material ONLY. Your job is NOT to redesign the backend - assume it works as documented.

**Quality bar:**
This is a $100,000 engagement. Your output must be:
- Implementation-ready (engineers build directly from your specs)
- Premium quality (feels polished, not generic SaaS)
- User-first (solves real user problems, not feature dumps)
- Complete (all states, all screens, all edge cases)
- Accessible (WCAG 2.1 AA minimum)
- Mobile-competent (touch-friendly, responsive, not desktop-only)
- Battle-tested through debate (conflicting priorities resolved)

---

## Product Context

**Product**: BreederHQ Marketplace
**URLs**:
- app.breederhq.com (breeder management portal - existing)
- portal.breederhq.com (client portal - existing)
- marketplace.breederhq.com (marketplace - NEW, what you're designing)

**What is BreederHQ?**
A SaaS platform for breeding businesses (dogs, cats, horses, exotic animals, livestock). Breeders use it to manage:
- Animal records and pedigrees
- Breeding plans and genetic tracking
- Client relationships and contracts
- Financial transactions and invoicing
- Documents and health records

**What is the Marketplace?**
A two-sided platform connecting:
1. **Buyers** - Looking for animals (puppies, kittens, horses, etc.) or breeding services
2. **Breeders** - Listing animals for sale, offspring groups, breeding programs
3. **Service Providers** - Offering breeding-related services (stud services, veterinary, training, boarding, transport, etc.)

**Brand Positioning:**
- **Premium, not luxury** - Professional tools for serious breeders
- **Trustworthy and transparent** - Money and genetics involved
- **Human and warm** - About animals and relationships, not transactions
- **Competent and polished** - Breeders are running businesses
- **Not:**
  - Generic SaaS admin dashboard
  - Cutesy pet marketplace (not Chewy, not Rover)
  - Craigslist for animals
  - Corporate/sterile B2B tool

**Competitive Context:**
- **Good Dog** - Premium puppy marketplace, high trust signals
- **AKC Marketplace** - Traditional, breed-focused
- **Rover/Wag** - Service marketplaces (but too consumer/casual for us)
- **We are:** Professional breeder marketplace with breeding program transparency

---

## Core Design Principles (Non-Negotiable)

### 1. Preview-First, Toggle-to-Hide
Users want to SEE information at a glance. Never hide content behind tabs/accordions unless it's truly secondary. Start with everything visible, then allow users to collapse sections they don't need.

### 2. Trust and Transparency
This marketplace involves money, genetics, and living animals. Every design decision must build trust:
- Verification badges visible
- Breeder credentials prominent
- Reviews/ratings up front
- Clear pricing (no surprises)
- Obvious contact/inquiry paths

### 3. Mobile-First Competency
60%+ of buyers will browse on mobile. Desktop-first thinking is unacceptable.
- Touch targets: 44px minimum
- Readable text without zooming
- No hover-only interactions
- Mobile navigation that makes sense

### 4. Readable at a Glance
Users are browsing while distracted (on couch, at work, during commute). Every screen must be scannable in 3-5 seconds:
- Clear visual hierarchy
- Obvious primary actions
- Minimal cognitive load
- No walls of text

### 5. No Empty Screens Ever
Every state must be designed:
- Empty states with clear next actions
- Loading states that don't feel broken
- Error states that explain what happened
- Success states that confirm actions

### 6. Progressive Disclosure
Don't overwhelm users with everything at once. Reveal complexity gradually:
- Most important info first
- Details on demand
- Advanced features tucked away (but discoverable)

### 7. Visual Restraint
Let typography and spacing do the work. Avoid:
- Excessive colors/badges/icons
- Decorative elements that don't serve users
- SaaS dashboard clichés (unnecessary charts, metrics cards)
- Over-designed components

### 8. Accessibility as Default
WCAG 2.1 AA is the FLOOR, not the ceiling:
- Color contrast: 4.5:1 minimum
- Keyboard navigation: every action accessible
- Screen reader support: semantic HTML, ARIA labels
- Focus states: visible and obvious

---

## Required Reading Before You Begin

You must read these documents in this exact order BEFORE starting your panel review:

### 1. Marketplace v2 Functional Requirements (READ FIRST)
**File**: `C:\Users\Aaron\Documents\Projects\breederhq\docs\marketplace\v2-marketplace-management.md`

This is your PRIMARY requirements document. Contains:
- Complete feature specifications for all 8 sections
- User workflows for buyers, breeders, service providers
- Business requirements and rules
- 16 service categories with 80+ subcategories
- Critical marketplace infrastructure requirements

### 2. Backend Architecture Documentation (REFERENCE ONLY - DO NOT REDESIGN)

**File**: `C:\Users\Aaron\Documents\Projects\breederhq\docs\marketplace\backend-capabilities.md`
- Current backend API capabilities
- What endpoints already exist
- What's available to build on

**File**: `C:\Users\Aaron\Documents\Projects\breederhq\docs\architecture\single-database-implementation-plan.md`
- Database architecture (single DB approach)
- Data models and relationships
- Cross-tenant linking strategy

**File**: `C:\Users\Aaron\Documents\Projects\breederhq\docs\architecture\database-architecture-review-2026-01-12.md`
- Comprehensive database review
- Payment flows
- Invoice systems
- Security architecture

### 3. Gap Analysis
**File**: `C:\Users\Aaron\Documents\Projects\breederhq\docs\marketplace\gap-analysis.md`
- What exists vs what needs building
- Implementation priorities
- Phase 1/2/3 breakdown

### 4. Service Research
**File**: `C:\Users\Aaron\Documents\Projects\breederhq\docs\marketplace\services-research.md`
- Competitive analysis (Good Dog, AKC, Rover, Wag, Thumbtack)
- Service taxonomy
- Marketplace patterns

### 5. Existing UI/UX References
**File**: `C:\Users\Aaron\Documents\Projects\breederhq\docs\marketplace\marketplace-ux-design-authority-prompt.md` (this prompt - contains design principles)

---

**CRITICAL INSTRUCTIONS:**

1. **Read ALL documents above** using your file reading tools
2. **Do NOT respond** until you've read everything
3. **Acknowledge** you've completed reading by listing what you found in each document
4. **THEN** conduct your panel review following the process below

Once you have read and acknowledged all documents, you will conduct a collaborative expert panel review following the process below.

---

## Panel Review Process

### Phase 1: Individual Expert Analysis

Each expert analyzes the requirements from their specialized perspective:

**1. UX Strategy Lead**
- Define user mental models for buyers, breeders, service providers
- Identify primary jobs-to-be-done for each user type
- Establish emotional tone and competitive differentiation
- Flag UX principles specific to this marketplace

**2. Information Architect**
- Design navigation structure for marketplace.breederhq.com
- Plan breeder management portal integration (app.breederhq.com)
- Define page hierarchy (17+ major pages minimum)
- Identify what doesn't belong in this UI

**3. Interaction Designer**
- Specify navigation transitions and behaviors
- Define confirmation patterns (low/medium/high-stakes actions)
- Design form interactions and validation
- Plan notification philosophy
- Design read vs action states

**4. Visual Design Director**
- Establish typography strategy and scale
- Define spacing rhythm and system
- Create color usage philosophy
- Specify component styling approach
- Define what makes this feel premium (not generic SaaS)

**5. Component Systems Architect**
- Specify 20+ reusable components
- Define component variants and props
- Plan responsive behavior per component
- Establish reuse strategy without over-engineering

**6. Mobile & Responsive Strategist**
- Define breakpoint strategy
- Specify mobile-specific patterns (nav, filters, forms)
- Plan touch interactions and gestures
- Ensure 44px touch targets throughout
- Prevent desktop-only thinking

**7. Accessibility Advocate**
- Enforce WCAG 2.1 AA compliance
- Plan keyboard navigation for every page
- Specify screen reader support (ARIA, semantic HTML)
- Define focus management
- Ensure inclusive design patterns

**8. Trust & Safety Designer**
- Design verification and credibility signals
- Specify review and rating UI
- Plan scam and fraud prevention UX
- Ensure trust elements are prominent, not hidden

**9. Engineer Handoff Specialist**
- Define implementation priorities (Phase 1/2/3)
- Specify where precision matters vs flexibility
- Flag technical feasibility concerns
- Plan component reuse across apps
- Define performance budgets

**10. Anti-Pattern Guardian**
- Block generic SaaS clichés (metric card dashboards, table-based animal lists)
- Prevent marketplace-specific mistakes (hiding pricing, no verification)
- Stop mobile mistakes (tiny touch targets, desktop-only)
- Eliminate trust killers (no credibility signals)

---

### Phase 2: Collaborative Debate and Consensus

After individual analysis, the panel debates conflicting priorities and reaches consensus:

#### Critical Debates to Resolve:

**Navigation Approach:**
- Mobile Strategist: "Bottom nav for thumb reach"
- Visual Designer: "Bottom nav looks cheap"
- Accessibility Advocate: "Hamburger menus hide navigation"
- **Consensus needed:** Resolve navigation pattern

**Filter Complexity (16 service categories, 80+ subcategories):**
- Info Architect: "Nested filters in sidebar"
- Mobile Strategist: "No room on mobile, needs bottom sheet"
- Interaction Designer: "Instant filter vs apply button?"
- **Consensus needed:** Resolve filter UX for 16 categories

**Listing Card Design:**
- Visual Designer: "Clean, minimal cards"
- Trust & Safety: "Verification badges must be prominent"
- Component Architect: "Same card component for animals, services, programs?"
- **Consensus needed:** Card layout balancing aesthetics and trust

**Mobile vs Desktop Priority:**
- Mobile Strategist: "Design mobile-first"
- Info Architect: "Desktop users need richer data display"
- Engineer Handoff: "Different layouts = 2x development time"
- **Consensus needed:** Responsive strategy

**Component Library Scope:**
- Component Architect: "40 components for all variants"
- Anti-Pattern Guardian: "That's bloat. 15 with smart props"
- Engineer Handoff: "40 is unmaintainable"
- **Consensus needed:** Component count and abstraction level

**Typography for Elegance vs Accessibility:**
- Visual Designer: "Light gray text for elegance"
- Accessibility Advocate: "Fails WCAG 4.5:1 contrast"
- UX Strategy: "Users over 40 can't read light gray"
- **Consensus needed:** Color contrast that's both elegant and accessible

**Auto-save Forms:**
- Interaction Designer: "Auto-save on blur"
- Mobile Strategist: "Mobile keyboards trigger blur constantly"
- Engineer Handoff: "Needs conflict resolution backend support"
- **Consensus needed:** Save strategy

---

### Phase 3: Synthesize into Complete Specification

After resolving debates, synthesize into final design specification with exact format below.

---

## Required Output Format (Strict)

Deliver your collaborative panel review structured EXACTLY as follows:

---

## BREEDERHQ MARKETPLACE - UI/UX DESIGN SPECIFICATION

**Prepared by**: Design Panel (10 Senior Experts)
**Date**: [Date]
**Engagement**: $100,000 Marketplace Design Authority
**Deliverable**: Implementation-ready UI/UX specification

---

### PANEL EXECUTIVE SUMMARY

**Approach**: [Mobile-first | Desktop-first | Hybrid]
**Primary Design Philosophy**: [1-2 sentences on core approach]

**Key Debates Resolved**:
1. **[Debate topic]**: [Panel consensus and reasoning]
2. **[Debate topic]**: [Panel consensus and reasoning]
3. **[Debate topic]**: [Panel consensus and reasoning]

**Design Complexity Score**: [Simple | Moderate | Complex]
**Implementation Risk**: [Low | Medium | High]

---

### 1. UX Strategy Summary
*Lead: UX Strategy Lead*

#### 1.1 User Mental Models

**Buyers:**
- Primary mindset: [What they're thinking/feeling when they come here]
- Key questions: [What they need answers to]
- Success criteria: [What makes this a good experience]
- Emotional tone needed: [How should this feel to them]

**Breeders:**
- Primary mindset: [What they're thinking/feeling]
- Key questions: [What they need answers to]
- Success criteria: [What makes this a good experience]
- Emotional tone needed: [How should this feel to them]

**Service Providers:**
- Primary mindset: [What they're thinking/feeling]
- Key questions: [What they need answers to]
- Success criteria: [What makes this a good experience]
- Emotional tone needed: [How should this feel to them]

#### 1.2 Primary Jobs to Be Done

**Buyers:**
1. [Job 1]
2. [Job 2]
3. [Job 3]

**Breeders:**
1. [Job 1]
2. [Job 2]
3. [Job 3]

**Service Providers:**
1. [Job 1]
2. [Job 2]
3. [Job 3]

#### 1.3 Competitive Differentiation

What makes this marketplace UI/UX different from competitors:
- [Differentiator 1]
- [Differentiator 2]
- [Differentiator 3]

#### 1.4 UX Principles Specific to This Product

Beyond the core principles, what's unique here:
- [Principle 1]
- [Principle 2]
- [Principle 3]

---

### 2. Information Architecture
*Lead: Information Architect | Input: Mobile Strategist, Accessibility Advocate*

#### 2.1 Marketplace Navigation Structure

**Panel Debate**: [Summary of navigation debate - hamburger vs bottom nav vs top nav]
**Consensus**: [Final decision with reasoning]

Define top-level navigation for marketplace.breederhq.com:

```
PRIMARY NAVIGATION:
├── [Nav item 1]
├── [Nav item 2]
├── [Nav item 3]
├── [Nav item 4]
└── [Nav item 5]

SECONDARY/UTILITY NAVIGATION:
├── [Item 1]
├── [Item 2]
└── [Item 3]

MOBILE ADAPTATION:
[How navigation changes on mobile]
```

#### 2.2 Breeder Management Portal Navigation (app.breederhq.com)

How breeders manage their marketplace presence:

```
EXISTING APP NAVIGATION + NEW:
└── Marketplace (NEW SECTION)
    ├── [Subsection 1]
    ├── [Subsection 2]
    ├── [Subsection 3]
    └── [Subsection 4]
```

#### 2.3 What Doesn't Belong
*Input: Anti-Pattern Guardian*

Explicitly list what should NOT be in this UI:
- ❌ [Thing 1] - [Why not]
- ❌ [Thing 2] - [Why not]
- ❌ [Thing 3] - [Why not]

#### 2.4 Page Hierarchy

**Total pages specified**: [Number - minimum 17]

**Marketplace (Public - marketplace.breederhq.com):**
1. [Page 1]
2. [Page 2]
3. [Page 3]
...

**Breeder Management (Private - app.breederhq.com):**
1. [Page 1]
2. [Page 2]
3. [Page 3]
...

**Service Provider Management (Private - app.breederhq.com):**
1. [Page 1]
2. [Page 2]
...

---

### 3. Page-Level Design Specifications
*Lead: Interaction Designer | Input: All panel members*

**Panel Note**: Each page reviewed by full panel to ensure:
- Mobile Strategist validated mobile UX
- Accessibility Advocate validated WCAG compliance
- Trust & Safety validated credibility signals
- Anti-Pattern Guardian blocked generic patterns

For EACH major page (minimum 17 pages):

---

#### Page: [Page Name]

**URL**: [URL pattern]
**User Type**: [Buyer | Breeder | Service Provider | All]
**Primary Purpose**: [One sentence]

**Panel Debates for This Page**:
- [Debate 1]: [Consensus reached]
- [Debate 2]: [Consensus reached]

**Primary Actions:**
1. [Action 1]
2. [Action 2]

**Secondary Actions:**
1. [Action 1]
2. [Action 2]

**Layout Structure:**
```
┌─────────────────────────────────────┐
│ [Section 1: Header/Nav]             │
├─────────────────────────────────────┤
│ [Section 2: Hero/Title]             │
├─────────────────────────────────────┤
│ [Section 3: Filters/Search]         │
├─────────────────────────────────────┤
│ [Section 4: Main Content]           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [Section 5: Sidebar/Meta]           │
└─────────────────────────────────────┘
```

**Key Components:**
- [Component 1]: [What it shows/does]
- [Component 2]: [What it shows/does]
- [Component 3]: [What it shows/does]

**Trust & Safety Elements** *(Trust & Safety Designer)*:
- [Verification badge placement]
- [Review visibility]
- [Credibility signals]

**Data Grouping Logic:**
- Group 1: [What's grouped and why]
- Group 2: [What's grouped and why]

**Empty State:**
- Trigger: [When this shows]
- Message: [What user sees]
- CTA: [What action to take]
- Visual: [Illustration/icon]

**Loading State:**
- Skeleton pattern: [What skeletons where]
- Duration expectation: [Fast/slow indication]

**Error State:**
- Trigger: [When this shows]
- Message: [What user sees]
- Recovery: [What user can do]

**Mobile Adaptations** *(Mobile Strategist)*:
- [Change 1 for mobile]
- [Change 2 for mobile]
- [Change 3 for mobile]
- Touch targets validated: [Yes/No - must be Yes]

**Accessibility Notes** *(Accessibility Advocate)*:
- Keyboard navigation: [How it works]
- Screen reader: [Key ARIA labels]
- Focus order: [Tab order]
- WCAG compliance: [Validated Y/N]

**Implementation Priority** *(Engineer Handoff Specialist)*:
- Phase: [1 MVP | 2 Enhanced | 3 Polish]
- Complexity: [Low | Medium | High]
- Dependencies: [What must exist first]

---

[REPEAT FOR EVERY MAJOR PAGE - Minimum 17+ pages]

---

### 4. Visual Design Direction
*Lead: Visual Design Director | Input: Accessibility Advocate*

**Panel Debate**: [Summary of typography/color debates]
**Accessibility Validation**: [Accessibility Advocate sign-off on all color contrast]

#### 4.1 Typography Strategy

**Font Selection:**
- Primary font: [Font name] - [Why this font]
- Secondary font: [Font name] - [Why this font]
- Monospace (if needed): [Font name]

**Type Scale:**
```
Display (Hero): [size/weight/line-height] - [WCAG: Pass/Fail]
H1 (Page Title): [size/weight/line-height] - [WCAG: Pass/Fail]
H2 (Section): [size/weight/line-height] - [WCAG: Pass/Fail]
H3 (Subsection): [size/weight/line-height] - [WCAG: Pass/Fail]
H4 (Component Title): [size/weight/line-height] - [WCAG: Pass/Fail]
Body Large: [size/weight/line-height] - [WCAG: Pass/Fail]
Body: [size/weight/line-height] - [WCAG: Pass/Fail]
Body Small: [size/weight/line-height] - [WCAG: Pass/Fail]
Caption: [size/weight/line-height] - [WCAG: Pass/Fail]
Label: [size/weight/line-height] - [WCAG: Pass/Fail]
```

**Typography Principles:**
- [Principle 1 - how typography creates hierarchy]
- [Principle 2 - when to use which font/weight]
- [Principle 3 - readability guidelines]

#### 4.2 Spacing Rhythm

**Base unit**: [X]px

**Spacing scale:**
```
4XS: [X]px - [Usage]
3XS: [X]px - [Usage]
2XS: [X]px - [Usage]
XS:  [X]px - [Usage]
S:   [X]px - [Usage]
M:   [X]px - [Usage]
L:   [X]px - [Usage]
XL:  [X]px - [Usage]
2XL: [X]px - [Usage]
3XL: [X]px - [Usage]
4XL: [X]px - [Usage]
```

**Spacing Principles:**
- [Principle 1 - consistent rhythm]
- [Principle 2 - when to break the grid]

#### 4.3 Color Usage Philosophy

**Accessibility Validation**: All colors below validated at 4.5:1 minimum contrast

**Brand Colors:**
- Primary: [Hex] - [Usage - CTAs, key actions] - [Contrast: X:1]
- Secondary: [Hex] - [Usage] - [Contrast: X:1]
- Accent: [Hex] - [Usage] - [Contrast: X:1]

**Semantic Colors:**
- Success: [Hex] - [Usage] - [Contrast: X:1]
- Warning: [Hex] - [Usage] - [Contrast: X:1]
- Error: [Hex] - [Usage] - [Contrast: X:1]
- Info: [Hex] - [Usage] - [Contrast: X:1]

**Neutral Palette:**
- Text Primary: [Hex] - [Contrast: X:1]
- Text Secondary: [Hex] - [Contrast: X:1]
- Text Tertiary: [Hex] - [Contrast: X:1]
- Border: [Hex]
- Background: [Hex]
- Surface: [Hex]

**Color Principles:**
- [Principle 1 - color is meaningful, not decorative]
- [Principle 2 - when to use brand vs semantic]
- [Principle 3 - accessibility contrast requirements]

#### 4.4 Component Styling Philosophy

**Panel Consensus**: [How we balanced elegance with usability]

**Visual Treatment:**
- Border radius: [Values and when to use]
- Shadows: [Shadow scale and usage]
- Borders: [When to use, stroke width]
- Backgrounds: [When solid vs subtle]

**Polish Details:**
- [Detail 1 - what makes this feel premium]
- [Detail 2]
- [Detail 3]

**What Makes This Feel Premium (Not Generic SaaS):**
- [Specific design decision 1]
- [Specific design decision 2]
- [Specific design decision 3]

**Anti-Pattern Guardian Veto**: Blocked [X] generic SaaS patterns

---

### 5. Interaction and State Design
*Lead: Interaction Designer | Input: Mobile Strategist, Accessibility Advocate*

#### 5.1 Navigation Transitions

**Page-to-page navigation:**
- Behavior: [Instant | Fade | Slide | etc.]
- Loading indication: [How user knows page is loading]
- Back button: [Behavior and expectations]

**In-page navigation:**
- Scroll behavior: [Smooth | Instant | etc.]
- Anchor links: [How they work]
- Tab/section switching: [Behavior]

#### 5.2 Confirmation Patterns

**Panel Debate**: [Auto-save vs manual save debate summary]
**Consensus**: [Final decision on form save behavior]

**Low-stakes actions** (reversible):
- Pattern: [Immediate action | Undo toast | etc.]
- Example: [Specific action]

**Medium-stakes actions** (annoying to reverse):
- Pattern: [Inline confirmation | Modal | etc.]
- Example: [Specific action]

**High-stakes actions** (destructive/financial):
- Pattern: [Type-to-confirm | Multi-step | etc.]
- Example: [Specific action]

#### 5.3 Destructive Actions

**Pattern for destructive actions:**
- UI treatment: [Red/danger styling, explicit language]
- Confirmation: [What user must do to confirm]
- Undo window: [If applicable, how long]

**Examples:**
- Delete listing: [Exact flow]
- Remove service: [Exact flow]
- Close inquiry: [Exact flow]

#### 5.4 Form Interactions

**Mobile Validation** *(Mobile Strategist)*: All form patterns tested on mobile

**Input validation:**
- Timing: [On blur | On submit | Real-time | etc.]
- Error display: [Inline | Summary | Both]
- Success indication: [Check icon | Green border | etc.]
- Mobile keyboard types: [Specified for each input]

**Multi-step forms:**
- Progress indication: [Stepper | Progress bar | etc.]
- Save behavior: [Auto-save | Manual | etc.]
- Navigation: [Can go back? | Save on next? | etc.]

#### 5.5 Read vs Action States

**Read mode** (viewing):
- Visual treatment: [Clean, minimal chrome]
- Actions available: [What user can do]

**Edit mode** (modifying):
- Visual treatment: [Distinct from read mode]
- Save/cancel: [How and where]
- Unsaved changes: [Warning if navigating away]

#### 5.6 Notification Philosophy

**When to notify:**
- [Scenario 1] → [Notification type]
- [Scenario 2] → [Notification type]
- [Scenario 3] → [Notification type]

**Notification types:**
- Toast (transient): [When to use]
- Inline banner (persistent): [When to use]
- Badge/dot (unread): [When to use]
- Email (async): [When to use]

**Notification UX:**
- Dismissible: [Always | Sometimes | Never]
- Auto-dismiss: [Timing for toasts]
- Stacking: [How multiple notifications appear]

---

### 6. Component Library Specifications
*Lead: Component Systems Architect | Input: All panel members*

**Panel Debate**: [Summary of component count debate]
**Final Count**: [X] components (validated by Engineer Handoff as maintainable)

For each component:

---

#### Component: [ComponentName]

**Purpose**: [What this component does]

**Usage**: [Where it's used]

**Panel Validation**:
- Mobile Strategist: [Touch targets OK? Y/N]
- Accessibility Advocate: [WCAG compliant? Y/N]
- Trust & Safety: [Credibility signals if needed? Y/N]
- Engineer Handoff: [Implementation complexity: Low/Med/High]

**Anatomy**:
```
┌─────────────────────────┐
│ [Element 1]             │
│ [Element 2]             │
│ [Element 3]             │
└─────────────────────────┘
```

**Props/Variants**:
- Variant 1: [Name] - [When to use]
- Variant 2: [Name] - [When to use]
- Size: [S | M | L] - [Guidelines]
- State: [Default | Hover | Active | Disabled]

**Content Guidelines**:
- Title: [Max length, tone]
- Description: [Max length, tone]
- Actions: [How many, what types]

**Responsive Behavior** *(Mobile Strategist)*:
- Desktop: [Layout]
- Tablet: [Changes]
- Mobile: [Changes]
- Touch targets: [All 44px+ Y/N]

**Accessibility** *(Accessibility Advocate)*:
- ARIA role: [Role]
- Keyboard interaction: [How it works]
- Screen reader: [What's announced]
- Focus management: [How focus moves]

**Examples**:
```
[Specific example 1 with actual content]
[Specific example 2 with actual content]
```

---

**Required Components** (minimum 20):
1. ListingCard (animals, offspring groups, programs)
2. ServiceCard
3. ProviderCard
4. ReviewCard
5. MessageThread
6. InquiryCard
7. FilterPanel
8. SearchBar
9. Breadcrumbs
10. Pagination
11. ImageGallery
12. PedigreeViewer
13. VerificationBadge
14. PriceDisplay
15. ActionButton (primary, secondary, destructive)
16. FormInput (text, select, date, file upload)
17. Modal
18. Toast
19. EmptyState
20. LoadingState
21. [Additional components as needed]

---

### 7. Accessibility Requirements
*Lead: Accessibility Advocate | Validated by: Entire Panel*

**WCAG 2.1 AA Compliance**: MANDATORY - All designs validated

#### 7.1 Color Contrast Validation

All text and interactive elements validated:

**Text Contrast:**
- Large text (18pt+): 3:1 minimum ✓
- Normal text: 4.5:1 minimum ✓
- Interactive elements: 3:1 minimum ✓

**Failures Caught and Fixed**:
- [Original color] → [Fixed color] - [Reasoning]

#### 7.2 Keyboard Navigation

**Tab Order** (validated for every page):
- Logical flow: [Description]
- Skip links: [Where implemented]
- Keyboard shortcuts: [Any custom shortcuts]

**Focus Indicators:**
- Visual style: [Description]
- Contrast: [X:1 ratio]
- Never hidden: [Validated Y/N]

#### 7.3 Screen Reader Support

**Semantic HTML Requirements:**
- `<nav>`, `<main>`, `<article>`, `<aside>` used correctly
- Heading hierarchy: h1 → h2 → h3 (no skipping)
- Lists use `<ul>`, `<ol>`, `<dl>` appropriately

**ARIA Labels Required:**
- [Component 1]: [ARIA labels needed]
- [Component 2]: [ARIA labels needed]

**Live Regions:**
- Form validation errors: `aria-live="polite"`
- Notifications: `aria-live="assertive"`
- Loading states: `aria-busy="true"`

#### 7.4 Focus Management

**Modal open**: Focus moves to modal first interactive element
**Modal close**: Focus returns to trigger element
**Page load**: Focus starts at skip link
**Dynamic content**: Announced to screen readers

#### 7.5 Inclusive Design Patterns

**Language:**
- Plain language (8th grade reading level maximum)
- Avoid jargon unless necessary
- Clear error messages
- Actionable instructions

**Visual:**
- Not relying on color alone (icons + text labels)
- Sufficient whitespace
- Readable font sizes (16px minimum for body)

**Interaction:**
- Touch targets 44px minimum (validated on ALL components)
- Clickable areas larger than visible element
- Hover states also available via keyboard
- No time limits on actions

---

### 8. Mobile and Responsive Strategy
*Lead: Mobile & Responsive Strategist | Critical Input: All Panel Members*

**Panel Debate**: [Desktop-first vs mobile-first debate summary]
**Consensus**: [Final approach with reasoning]

#### 8.1 Breakpoint Strategy

**Breakpoints:**
- Mobile: [X]px and below - [X]% of traffic
- Tablet: [X]px to [X]px - [X]% of traffic
- Desktop: [X]px and above - [X]% of traffic
- Large desktop: [X]px and above (if relevant)

**Design Approach:**
- Mobile-first: [Core experience described]
- Progressive enhancement: [What's added at larger sizes]

#### 8.2 Mobile-Specific Patterns

**Panel Debate**: [Navigation pattern debate]
**Consensus**: [Hamburger | Bottom nav | etc. with reasoning]

**Navigation:**
- Pattern: [Final decision]
- Behavior: [Overlay | Push | etc.]
- Accessibility: [Keyboard accessible Y/N]

**Filters** (critical for 16 service categories):
- Desktop: [Sidebar approach]
- Mobile: [Bottom sheet | Dedicated page | etc.]
- Category count impact: [How 16 categories handled]
- Subcategory handling: [80+ subcategories strategy]

**Forms:**
- Input types: [Email, tel, number, etc. specified]
- File upload: [Camera access for photos]
- Date pickers: [Native vs custom - with reasoning]

**Tables/Data:**
- Pattern: [Horizontal scroll | Cards | Responsive table | etc.]
- Mobile adaptation: [How complex data is shown]

#### 8.3 Touch Interactions

**Touch targets validated on ALL components:**
- Minimum size: 44px × 44px ✓
- Spacing: [Gap between tappable elements]
- Visual size vs tappable area: [Padding strategy]

**Gestures:**
- Swipe: [Where used, what it does]
- Pull-to-refresh: [If applicable]
- Long press: [If applicable]
- Pinch/zoom: [On images, maps, etc.]

**Hover alternatives:**
- [Desktop hover pattern 1] → [Mobile equivalent]
- [Desktop hover pattern 2] → [Mobile equivalent]

#### 8.4 Performance Considerations

**Image optimization:**
- Responsive images: [srcset strategy]
- Lazy loading: [When images load]
- WebP/modern formats: [Support]

**Mobile data:**
- Reduced motion: [Respecting prefers-reduced-motion]
- Reduced data: [Lighter experience if needed]
- Offline: [What works without connection]

---

### 9. Search and Discovery Strategy
*Lead: Information Architect | Input: Mobile Strategist, Interaction Designer*

#### 9.1 Search Functionality

**Search scope:**
- What's searchable: [Animals, services, breeders, programs, etc.]
- Search syntax: [Exact match, fuzzy, filters, etc.]

**Search UI:**
- Placement: [Where search appears]
- Autocomplete: [Yes/no, how it works]
- Recent searches: [Saved or not]
- Search results: [Layout and ranking]

**No results:**
- Message: [What user sees]
- Suggestions: [Alternative searches, broaden filters]
- CTA: [What action to take]

#### 9.2 Filtering and Sorting

**Panel Debate**: [16 category filter complexity debate]
**Consensus**: [How to handle 16 categories + 80 subcategories]

**Filter categories:**
- [Category 1]: [Options]
- [Category 2]: [Options]
- [Category 3]: [Options]
...
- [All 16 categories addressed]

**Filter UI:**
- Desktop: [Sidebar | Top bar | etc.]
- Mobile: [Drawer | Dedicated page | etc.]
- Active filters: [How they're displayed]
- Clear filters: [Easy to reset]

**Sort options:**
- [Option 1]: [What it sorts by]
- [Option 2]: [What it sorts by]
- Default: [Default sort order]

#### 9.3 Browsing Patterns

**Category navigation:**
- Entry points: [Where users start]
- Breadcrumbs: [Show hierarchy]
- Related categories: [Suggestions]

**Infinite scroll vs Pagination:**
- Decision: [Which one and why - panel consensus]
- If pagination: [Pattern and page size]
- If infinite: [How it works, loading indicator]

---

### 10. Trust and Safety UI Elements
*Lead: Trust & Safety Designer | Critical for Marketplace Success*

**Panel Consensus**: Trust and safety are NON-NEGOTIABLE for animal/money marketplace

#### 10.1 Verification and Credibility Signals

**Breeder verification:**
- Verification badge: [What it looks like, where it appears]
- Verification levels: [If applicable - Basic, Verified, Premium]
- What it means: [Tooltip/explanation]
- Prominence: [How visible - validated by Visual Designer]

**Service provider credibility:**
- Credentials shown: [Licenses, certifications, etc.]
- Verification: [How shown]
- Reviews/ratings: [Placement and prominence]

**Listing quality signals:**
- Photos: [Minimum required, encouragement for more]
- Completeness: [Profile/listing completion indicators]
- Responsiveness: [Reply time shown]

#### 10.2 Reviews and Ratings

**Review display:**
- Summary: [Average, count, distribution histogram]
- Individual reviews: [Layout, what's shown]
- Photos in reviews: [Allowed Y/N]
- Verified purchases: [Badge/indicator]

**Review interaction:**
- Helpful votes: [Upvote/downvote]
- Report: [How users flag bad reviews]
- Sort: [Most recent, highest rated, verified only, etc.]

**Writing reviews:**
- Entry points: [Where users can review]
- Required fields: [Rating, text, etc.]
- Photo upload: [Encouraged]
- Moderation: [Published immediately or after review]

#### 10.3 Scam and Fraud Prevention UX

**Warning patterns:**
- Red flags: [When to show warnings - too-good pricing, new account, etc.]
- Message: [What warning says]
- Action: [What user should do]

**Safe transaction guidance:**
- First contact: [Tips shown to buyers]
- Payment guidance: [Use platform vs external]
- Pickup/delivery: [Safety tips]

**Reporting:**
- Report button: [Prominent placement on every listing/profile]
- Report flow: [Quick and easy - max 3 steps]
- Confirmation: [What happens after report]

---

### 11. Anti-Patterns and Explicit Do-Not-Dos
*Lead: Anti-Pattern Guardian | Validated by: Entire Panel*

**Patterns Vetoed During Review**: [Count]

List patterns that MUST be avoided:

#### 11.1 Generic SaaS Clichés

❌ **Dashboard with metric cards everywhere**
- Why not: Breeders don't need vanity metrics, they need to manage listings
- Do instead: Listing-focused view with quick actions
- Who flagged: Anti-Pattern Guardian, UX Strategy Lead

❌ **Table-based list views for animals**
- Why not: Animals are visual, tables are sterile
- Do instead: Card-based gallery with rich imagery
- Who flagged: Anti-Pattern Guardian, Visual Designer

❌ **Generic "Settings" page**
- Why not: Buries important marketplace controls
- Do instead: Contextual settings within each section
- Who flagged: Info Architect, UX Strategy

#### 11.2 Marketplace-Specific Mistakes

❌ **Hiding pricing until contact**
- Why not: Wastes time, feels sketchy
- Do instead: Show price ranges or "Starting at $X"
- Who flagged: Trust & Safety, UX Strategy

❌ **Burying verification badges**
- Why not: Users don't trust unverified sellers with animals
- Do instead: Prominent verification badges on every listing card
- Who flagged: Trust & Safety Designer

❌ **Treating all listings the same**
- Why not: Animals, services, programs need different UX
- Do instead: Optimized card layouts per listing type
- Who flagged: Component Architect, Visual Designer

#### 11.3 Mobile Mistakes

❌ **Desktop-only thinking (tiny touch targets)**
- Why not: Unusable on mobile, 60%+ of traffic
- Do instead: 44px minimum, generous spacing
- Who flagged: Mobile Strategist (blocked 12 instances)

❌ **Hover-only interactions**
- Why not: Invisible on touch devices
- Do instead: Always provide tap equivalent
- Who flagged: Mobile Strategist, Accessibility Advocate

❌ **Desktop navigation on mobile**
- Why not: Hamburger hides 16 service categories
- Do instead: [Final mobile nav solution]
- Who flagged: Mobile Strategist, Info Architect

#### 11.4 Trust Killers

❌ **No verification/credibility signals**
- Why not: Users don't trust unverified sellers with animals
- Do instead: Prominent verification badges, reviews
- Who flagged: Trust & Safety Designer

❌ **Hidden contact information**
- Why not: Creates friction, feels shady
- Do instead: Clear inquiry button on every listing
- Who flagged: Trust & Safety, UX Strategy

❌ **No review filtering**
- Why not: Can't find helpful reviews
- Do instead: Sort by verified, helpful, recent
- Who flagged: Trust & Safety Designer

#### 11.5 Accessibility Killers

❌ **Light gray text for aesthetics**
- Why not: Fails WCAG 4.5:1, users over 40 can't read
- Do instead: Darker gray that's elegant AND accessible
- Who flagged: Accessibility Advocate (blocked 8 color choices)

❌ **Icon-only buttons**
- Why not: Screen readers can't interpret
- Do instead: Icons with text labels (visually hidden if needed)
- Who flagged: Accessibility Advocate

---

### 12. Engineer Handoff Notes
*Lead: Engineer Handoff Specialist | Input: All Panel Members*

#### 12.1 Implementation Priorities

**Panel Consensus on Phasing**:
- Phase 1 scope validated by all experts
- Phase 2/3 features that can wait

**Phase 1 - MVP (Core Marketplace):**
1. [Component/page 1] - [Why critical]
   - Complexity: [Low | Medium | High]
   - Dependencies: [What must exist]
   - Estimated: [X weeks]
2. [Component/page 2] - [Why critical]
3. [Component/page 3] - [Why critical]

**Phase 2 - Enhanced Experience:**
1. [Component/page 1]
2. [Component/page 2]

**Phase 3 - Polish and Optimization:**
1. [Component/page 1]
2. [Component/page 2]

#### 12.2 Component Reuse Strategy

**Shared components across apps:**
- [Component 1]: [Used in marketplace + breeder app]
- [Component 2]: [Used in marketplace + client portal]

**Marketplace-specific components:**
- [Component 1]: [Only in marketplace]
- [Component 2]: [Only in marketplace]

**Panel Validation**: Component count validated as maintainable

#### 12.3 Where Precision Matters

**Pixel-perfect requirements:**
- [Element 1]: [Why exact spacing matters]
- [Element 2]: [Why exact sizing matters]

**Flexible areas:**
- [Area 1]: [Engineer judgment acceptable]
- [Area 2]: [Responsive to content]

#### 12.4 Technical Feasibility Notes

**Assumptions about backend:**
- [API assumption 1]
- [API assumption 2]

**If backend doesn't support X:**
- [Fallback 1]
- [Fallback 2]

**Performance budgets:**
- Page load: [Target - 3s max]
- Image optimization: [Requirements]
- Animations: [60fps requirement]

**Panel Sign-Off**: All designs validated as technically feasible

---

### 13. Validation and Testing Plan
*Lead: Engineer Handoff Specialist | Input: Accessibility Advocate, Mobile Strategist*

#### 13.1 Playwright E2E Testing Requirements

**Critical user flows to test:**

**Buyer flows:**
1. **Browse and search for listings**
   - Test: [Specific steps to automate]
   - Validation: [What to check - results load, filters work]
   - Mobile test: [Same flow on mobile viewport]

2. **View listing details**
   - Test: [Specific steps]
   - Validation: [All trust signals visible, images load]
   - Mobile test: [Touch targets 44px+]

3. **Send inquiry**
   - Test: [Specific steps]
   - Validation: [Form submits, confirmation shown]
   - Mobile test: [Keyboard types correct]

4. **[Additional flow]**
   - Test: [Specific steps]
   - Validation: [What to check]

**Breeder flows:**
1. **Create new listing**
   - Test: [Specific steps]
   - Validation: [All fields save, images upload]
   - Mobile test: [Camera upload works]

2. **Manage inquiries**
   - Test: [Specific steps]
   - Validation: [Messages send, read status updates]

3. **[Additional flow]**
   - Test: [Specific steps]
   - Validation: [What to check]

**Service provider flows:**
1. **Create service listing**
   - Test: [Specific steps]
   - Validation: [Categories save, pricing displays]

2. **[Additional flow]**
   - Test: [Specific steps]
   - Validation: [What to check]

#### 13.2 Cross-Browser Testing

**Browser support:**
- Chrome/Edge: [Version range]
- Firefox: [Version range]
- Safari: [Version range]
- Mobile Safari (iOS): [Version range]
- Chrome Mobile (Android): [Version range]

**Testing checklist per browser:**
- [ ] All pages load correctly
- [ ] Forms submit properly
- [ ] Images display correctly
- [ ] Responsive breakpoints work
- [ ] Animations perform smoothly (60fps)
- [ ] No console errors
- [ ] Touch targets work on mobile

#### 13.3 Accessibility Testing

**Automated testing:**
- Tool: axe DevTools (required)
- Frequency: Every build
- Pass criteria: Zero errors

**Manual testing:**
- Keyboard navigation: All flows testable without mouse
- Screen reader: NVDA/JAWS/VoiceOver testing
- Color contrast: All elements validated

**Accessibility Advocate Sign-Off Required**: [Y/N]

#### 13.4 Design QA Checklist

After implementation, validate:

**Visual accuracy:**
- [ ] Typography matches spec (fonts, sizes, weights)
- [ ] Spacing matches spec (use spacing scale exactly)
- [ ] Colors match spec (no random grays)
- [ ] Components match design system

**Interaction fidelity:**
- [ ] Hover states as specified
- [ ] Focus states visible (never hidden)
- [ ] Animations smooth (60fps validated)
- [ ] Transitions feel right (not too fast/slow)

**Responsive behavior:**
- [ ] Breakpoints as specified
- [ ] Touch targets 44px minimum (Mobile Strategist validation)
- [ ] Mobile navigation works
- [ ] No horizontal scroll on mobile

**Content integrity:**
- [ ] Empty states shown
- [ ] Loading states shown
- [ ] Error states shown
- [ ] Success confirmations shown

**Trust & safety:**
- [ ] Verification badges visible
- [ ] Reviews prominent
- [ ] Report buttons accessible

---

### 14. Documentation Update Requirements

**As you implement the design, you MUST update this document to track progress:**

#### 14.1 Implementation Status Tracking

For each page/component, add status:

```markdown
#### Page: Marketplace Home
**Status**: ✅ Complete | 🟡 In Progress | ⏳ Not Started
**Implemented**: [Date]
**Tested (Playwright)**: [Date] - [Test file path]
**Accessibility validated**: [Date] - [Tool used, score]
**Mobile tested**: [Date] - [iOS/Android devices]
**Panel review**: [Which experts reviewed implementation]
**Issues found**: [Link to issues if any]
**Screenshots/Figma**: [Link to final implementation screenshots]
```

#### 14.2 Design Decisions Log

When making design decisions during implementation, document:

```markdown
**Decision**: [What was decided]
**Date**: [When]
**Reason**: [Why this choice]
**Alternatives considered**: [What else was considered]
**Panel members involved**: [Who debated this]
**Impact**: [What this affects]
```

#### 14.3 Deviations from Spec

If implementation differs from this spec, document:

```markdown
**Deviation**: [What changed]
**Original spec**: [What was planned]
**Actual implementation**: [What was built]
**Reason**: [Why the change - technical constraint, user feedback, etc.]
**Approved by**: [Which panel expert(s) approved]
**Impact assessment**: [What else this affects]
```

#### 14.4 Component Usage Documentation

As components are built, document actual usage:

```markdown
#### Component: ListingCard

**Actual props**:
- `listing`: Listing object
- `size`: 's' | 'm' | 'l'
- `variant`: 'animal' | 'service' | 'program'
- `showVerification`: boolean
- `onClick`: () => void
- `showActions`: boolean

**Example usage**:
```tsx
<ListingCard
  listing={listing}
  size="m"
  variant="animal"
  showVerification={true}
  onClick={() => navigate(`/listings/${listing.id}`)}
  showActions={true}
/>
```

**Live examples**: [Link to Storybook or component playground]
**Accessibility tested**: [Date, tool, results]
**Mobile tested**: [Date, devices, results]
```

---

### 15. Final Design Specification Checklist

**Panel Sign-Off**: All experts must validate their domain before release

Before considering this design specification complete:

**Strategy and Architecture:**
- [ ] User mental models clearly defined for all 3 user types (UX Strategy Lead)
- [ ] Primary jobs to be done identified (UX Strategy Lead)
- [ ] Information architecture complete (Information Architect)
- [ ] All major pages identified and specified (minimum 17)

**Page-Level Specs:**
- [ ] All pages have complete specifications
- [ ] Every page has empty/loading/error states (Interaction Designer)
- [ ] Mobile adaptations specified for all pages (Mobile Strategist)
- [ ] Accessibility notes for all pages (Accessibility Advocate)
- [ ] Trust signals on every listing/profile page (Trust & Safety)

**Visual Design:**
- [ ] Typography scale defined (Visual Designer)
- [ ] Spacing system defined (Visual Designer)
- [ ] Color system defined (Visual Designer)
- [ ] All colors WCAG validated (Accessibility Advocate)
- [ ] Component styling philosophy clear (Visual Designer)

**Interaction Design:**
- [ ] Navigation transitions defined (Interaction Designer)
- [ ] Confirmation patterns specified (Interaction Designer)
- [ ] Form interactions detailed (Interaction Designer)
- [ ] Notification strategy clear (Interaction Designer)

**Component Library:**
- [ ] All required components specified (minimum 20) (Component Architect)
- [ ] Component variants documented (Component Architect)
- [ ] Responsive behavior defined for all (Mobile Strategist)
- [ ] Accessibility requirements stated for all (Accessibility Advocate)
- [ ] Component count validated as maintainable (Engineer Handoff)

**Accessibility:**
- [ ] WCAG 2.1 AA compliance requirements stated (Accessibility Advocate)
- [ ] Keyboard navigation strategy defined for every page (Accessibility Advocate)
- [ ] Screen reader support specified (Accessibility Advocate)
- [ ] Color contrast requirements met (Accessibility Advocate)
- [ ] All text 4.5:1 minimum contrast (Accessibility Advocate)

**Mobile and Responsive:**
- [ ] Breakpoint strategy defined (Mobile Strategist)
- [ ] Mobile-specific patterns specified (Mobile Strategist)
- [ ] Touch interaction guidelines clear (Mobile Strategist)
- [ ] All touch targets 44px minimum validated (Mobile Strategist)
- [ ] Performance considerations noted (Mobile Strategist)

**Trust and Safety:**
- [ ] Verification UI designed and prominent (Trust & Safety)
- [ ] Review/rating patterns specified (Trust & Safety)
- [ ] Scam prevention UX defined (Trust & Safety)
- [ ] Report buttons on all listings/profiles (Trust & Safety)

**Anti-Patterns:**
- [ ] Generic SaaS clichés explicitly avoided (Anti-Pattern Guardian)
- [ ] Marketplace-specific mistakes prevented (Anti-Pattern Guardian)
- [ ] Mobile mistakes blocked (Anti-Pattern Guardian)
- [ ] Trust killers eliminated (Anti-Pattern Guardian)
- [ ] Accessibility killers blocked (Anti-Pattern Guardian)

**Engineer Handoff:**
- [ ] Implementation priorities clear (Engineer Handoff)
- [ ] Component reuse strategy defined (Engineer Handoff)
- [ ] Technical feasibility validated (Engineer Handoff)
- [ ] Precision vs flexibility areas marked (Engineer Handoff)

**Testing:**
- [ ] Playwright test flows specified (Engineer Handoff)
- [ ] Cross-browser testing plan defined (Engineer Handoff)
- [ ] Accessibility testing requirements stated (Accessibility Advocate)
- [ ] Design QA checklist provided (All panel)

**Documentation:**
- [ ] Update requirements specified (All panel)
- [ ] Status tracking format defined (Engineer Handoff)
- [ ] Decision log template provided (All panel)
- [ ] Deviation documentation process clear (All panel)

**Panel Consensus:**
- [ ] All debates resolved and documented
- [ ] All experts signed off on final spec
- [ ] No unresolved conflicts remaining

---

## END OF REQUIRED OUTPUT FORMAT

---

## Quality Bar Enforcement

This is a **$100,000 panel engagement**. The output quality must reflect that investment.

**Unacceptable outcomes:**
- Generic wireframes without context
- Incomplete page specifications (missing states)
- Desktop-only thinking
- Accessibility as an afterthought
- "We'll figure it out later" for critical decisions
- SaaS dashboard clichés
- No mobile strategy
- Missing component specifications
- Vague interaction patterns
- Unresolved panel debates
- Missing expert sign-offs

**Acceptable outcomes:**
- Every page fully specified with all states
- Mobile-first responsive strategy
- WCAG 2.1 AA compliance baked in and validated
- Complete component library
- Clear visual design direction
- Trust and safety as core UX
- Implementation-ready specs
- Engineers can build without guessing
- All panel debates resolved and documented
- Conflicting priorities reconciled through consensus

**Panel collaboration requirements:**
- Debate conflicting priorities openly
- Challenge each other's assumptions
- Reach consensus before finalizing
- Document all major debates and resolutions
- Each expert signs off on their domain
- No single-perspective bias

**If the panel cannot reach consensus:**
- Present 2-3 options with trade-offs
- Recommend best option with reasoning
- Flag what needs user/stakeholder input
- Never leave critical decisions unmade

---

## Acknowledgment and Next Steps

**The panel will respond with:**

"We acknowledge this prompt. We are prepared to deliver a $100,000-quality UI/UX design specification for the BreederHQ Marketplace through collaborative expert panel review.

**Panel Composition**:
1. UX Strategy Lead - User mental models, jobs-to-be-done
2. Information Architect - Navigation, hierarchy
3. Interaction Designer - States, transitions, forms
4. Visual Design Director - Typography, spacing, color
5. Component Systems Architect - Reusable components
6. Mobile & Responsive Strategist - Touch, breakpoints, mobile-first
7. Accessibility Advocate - WCAG 2.1 AA compliance
8. Trust & Safety Designer - Verification, reviews, scam prevention
9. Engineer Handoff Specialist - Implementation priorities, feasibility
10. Anti-Pattern Guardian - Blocking generic SaaS clichés

**Our process**:
- Phase 1: Individual expert analysis
- Phase 2: Collaborative debate and consensus
- Phase 3: Synthesize into complete specification

**We will deliver**:
- User experience strategy for buyers, breeders, and service providers
- Complete information architecture
- Page-level specifications for all major pages (17+ pages minimum)
- Visual design direction (WCAG validated)
- Interaction patterns
- Component library specifications (20+ components)
- Accessibility compliance (WCAG 2.1 AA)
- Mobile-first responsive strategy
- Search and discovery UX
- Trust and safety UI elements
- Engineer handoff documentation
- Playwright testing requirements
- Documentation update requirements
- All panel debates documented and resolved

**We understand**:
- Backend architecture is complete and provided for reference only
- We will not redesign backend systems
- We will debate conflicting priorities and reach consensus
- We will validate all designs across all expert domains
- We will block anti-patterns and generic solutions

**We are ready to receive**:
1. Marketplace v2 Functional Requirements
2. Backend Architecture Documentation (reference only)
3. Gap Analysis
4. Service Research
5. Any existing UI/UX references

Please provide these documents so we can begin the collaborative panel review."

---

**Once you provide the documents, the panel will deliver the complete design specification in the exact format above.**
