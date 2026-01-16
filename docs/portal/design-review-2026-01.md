# BreederHQ Client Portal — Design Arbitration Panel Review
**Date**: January 12, 2026
**Reviewers**: Four-role senior design, engineering, and product panel
**Scope**: portal.breederhq.com (breeder's client/customer portal)

---

## Executive Summary

**Overall Assessment**: The BreederHQ client portal exhibits **strong visual design** and **solid engineering fundamentals**, but suffers from **navigation complexity** and **feature duplication** that create unnecessary cognitive load. The product feels **enterprise-grade in visual polish** but **admin-panel in interaction design**.

**Unanimous Verdict**: Simplification is the highest priority. The portal tries to show everything at once, resulting in a busy interface that obscures primary user flows.

**Status**: Execution-ready design specifications approved by all four roles.

---

## Independent Role Assessments

### Role 1: Senior Product Design Lead

#### Overall Impression
This portal exhibits strong foundational UX discipline with species-aware design, calm visual hierarchy, and operational clarity. However, several areas introduce unnecessary cognitive load and reveal internal system complexity.

#### Strengths
- **Species-aware design system** with accent colors creates appropriate emotional connection
- **Calm, operational aesthetic** avoids generic SaaS patterns
- **Task aggregation** from multiple sources into unified views is sophisticated
- **Empty states and loading states** are well-crafted and reassuring
- **Hero sections** with status indicators provide excellent context at a glance
- **Navigation badge counts** communicate urgency without noise

#### Critical Issues

**1. Navigation Overload (HeaderBar)**
- The header contains: OrgIdentity, 7-item horizontal nav (scrollable), Messages icon, Notifications bell, Sign out button
- This is 10+ interactive elements competing for attention
- The scrollable TopNav is a **red flag** — if navigation doesn't fit, the IA is wrong
- Users shouldn't need to scroll horizontally to discover core features
- **Recommendation**: Consolidate navigation. Financials, Documents, Agreements, Offspring are all transactional contexts — they could be unified under "Account" or shown contextually based on active placement.

**2. Dashboard Context Strip Complexity**
- The "ContextStrip" component shows: Name, Species/Breed, Status badge, "Next Action" text, and CTA button
- "Next Action" is system-derived logic exposed to the user ("Payment due in 3 days", "Ready to schedule go-home")
- This is **internal state leaking into UI**
- Users don't think in "next actions" — they think "What do I need to do?"
- **Recommendation**: Simplify to: Animal name/status + single primary CTA. Let the Tasks page handle action details.

**3. Dual Task/Notification Systems**
- Tasks page aggregates "action required" items
- Notifications page shows "recent updates"
- Dashboard shows both task counts AND notification counts
- These systems overlap significantly (e.g., overdue invoice appears as both task and notification)
- **Recommendation**: Unify into single "Updates" or "Activity" concept. Separate only if there's a clear behavioral difference (actionable vs. informational).

**4. Financial Page View Toggle**
- "Overview" vs. "All Invoices" toggle feels like feature bloat
- Overview shows: active invoices + recent transactions
- All Invoices shows: all invoices grouped by status
- **This is solving a problem that doesn't exist** — just show invoices grouped logically by default
- **Recommendation**: Remove toggle. Show overdue/due invoices prominently, with a collapsible "Paid" section.

**5. Profile Page**
- Shows: Identity (editable with "Request Change"), Email (contact breeder to change), Contact info, Address
- This is **administrative UI masquerading as user-facing design**
- "Request Change" buttons suggest bureaucratic approval process
- Users should be able to edit their own contact info directly
- **Recommendation**: If breeders need approval for name changes, explain why. Otherwise, allow direct editing.

#### Information Architecture Concerns
- **Offspring page exists separately from Dashboard/Tasks** — why? If a user has one primary placement, offspring details should be integrated into the main flow, not siloed.
- **Documents and Agreements are separate** — to users, these are all "files from my breeder"
- **Messages are both in TopNav AND have a dedicated icon** — redundant

#### Mental Model Gaps
- The portal assumes users understand the breeder's internal workflow (placements, agreements, offspring status)
- Terms like "placement status" and "reserved" vs. "active" vs. "placed" are vendor-centric, not customer-centric
- **Recommendation**: Use plain language. "Your puppy" instead of "placement." "Adoption complete" instead of "placed."

#### Final Verdict
This is a **B+ product** with A-level visual design but C-level information architecture. The UI is polished, but the structure reveals too much internal complexity. Simplification is critical.

---

### Role 2: Principal Front End Architect

#### Overall Assessment
This is a well-engineered React application with thoughtful component architecture, consistent patterns, and solid state management. However, several design decisions create unnecessary complexity and future maintenance risk.

#### Strengths
- **Component composition** is clean (PortalCard variants, PageScaffold, reusable StatusBadge)
- **Design tokens in CSS** centralize theming and avoid magic values
- **Tenant context pattern** cleanly handles multi-tenancy without prop drilling
- **Task/notification aggregation** is well-abstracted into reusable hooks
- **Loading/error states** are consistent across all pages
- **Custom routing** works well for this simple app (no need for React Router bloat)

#### Architectural Concerns

**1. Inline Styles Everywhere**
- Every component uses inline `style={{...}}` objects instead of CSS classes
- This is **acceptable for a small app**, but becomes unmaintainable at scale
- Benefits: Co-location, dynamic styling
- Costs: No CSS caching, bundle size bloat, difficult global refactoring
- **Recommendation**: Acceptable for now, but if this grows, migrate to CSS Modules or styled-components.

**2. Data Fetching Fragmentation**
- Each page independently fetches data (placements, financials, invoices, threads)
- Dashboard, Tasks, and Financials all fetch `/portal/placements` separately
- **No shared cache layer** — same data fetched multiple times
- **Recommendation**: Introduce React Query or SWR for caching and deduplication. Or, fetch placement data once in PortalLayout and pass down via context.

**3. Task Aggregation Logic is Brittle**
- `taskSources.ts` manually aggregates data from multiple endpoints
- Each source has its own error handling and capability gating
- Adding a new task source requires touching multiple files
- **Recommendation**: This works for 5 sources, but won't scale to 10+. Consider a plugin architecture where each task source is self-contained.

**4. Modal State Management**
- `PaymentSuccessModal` and `ReceiptModal` are managed with local `useState` in `PortalFinancialsPage`
- URL params (`?success=true`) trigger banner state
- **This is fine for now**, but mixing URL state with component state is fragile
- **Recommendation**: If modals become more complex, centralize modal state (e.g., modal context provider or URL-based modal routing).

**5. Navigation Pattern**
- Uses `window.history.pushState` + `PopStateEvent` dispatch to trigger re-renders
- This works but feels hacky
- No browser history stack management (back button might break in edge cases)
- **Recommendation**: This is acceptable for a simple app. If navigation becomes more complex, introduce a real router.

**6. Type Safety Gaps**
- Many API responses are typed as `any` (e.g., `placements: any[]`)
- This is **dangerous** — runtime errors are likely if API shape changes
- **Recommendation**: Generate TypeScript types from API schema (e.g., OpenAPI codegen).

#### Performance Observations
- **Parallel data fetching** with `Promise.all` is excellent
- **No memoization** on expensive computations (e.g., task filtering/sorting)
- **No virtualization** for long lists (if a user has 100+ invoices, page will be slow)
- **Recommendation**: Add `useMemo` for derived data. Consider virtual scrolling if lists exceed ~50 items.

#### Component Reusability
- **PortalCard, Button, StatusBadge** are well-abstracted
- **TaskRow, InvoiceRow, TransactionRow** follow consistent patterns
- **Hero components** are overloaded (PortalHero has 8+ props)
- **Recommendation**: Simplify Hero API. Too many props = hard to maintain.

#### Security Observations
- **Tenant context from URL** is validated on backend (good)
- **CSRF tokens** included in mutations (good)
- **Session re-checking** every 30 seconds (good, but aggressive)
- **No XSS risks** detected (React escapes by default)
- **Recommendation**: 30-second session polling is excessive. Use 2-5 minutes or WebSocket-based session invalidation.

#### Final Verdict
This is **production-ready code** with minor refactor risks. Data fetching and state management could be improved, but current patterns are acceptable for this scope. Main concern: **inline styles will become a bottleneck if this scales.**

---

### Role 3: Product Owner and Business Strategist

#### Brand and Positioning Assessment
BreederHQ is positioned as a **premium, purpose-built platform** for professional breeders. The portal is the customer-facing touchpoint — it must reinforce trust, professionalism, and calm confidence.

#### Strengths
- **Dark premium theme** differentiates from generic SaaS dashboards
- **Species-aware design** shows thoughtfulness and domain expertise
- **"Powered by BreederHQ" footer** reinforces brand without being obtrusive
- **Calm, operational tone** avoids anxiety-inducing urgency patterns
- **No ads, no upsells, no distractions** — this feels like a private client portal, not a SaaS product

#### Weaknesses Threatening Brand Perception

**1. Amateur Navigation Patterns**
- **Scrollable horizontal navigation** is a mobile-web anti-pattern seen in low-budget apps
- Users expect either: (a) a sidebar, (b) a hamburger menu, or (c) a focused top nav with <5 items
- Horizontal scroll suggests "we couldn't decide what to prioritize, so we just added everything"
- **Verdict**: This weakens the premium positioning.

**2. "Request Change" Bureaucracy**
- Profile page requires users to "Request Change" for their own name
- This feels like **government paperwork**, not a premium service
- If name verification is required for legal reasons, explain it ("We verify identity for breeding records")
- **Verdict**: Unexplained friction damages trust.

**3. Overdue Invoice Styling**
- Overdue invoices have **pulsing red badges with glowing shadows**
- While urgency is appropriate, the execution feels **aggressive and anxiety-inducing**
- Premium brands create urgency through clarity, not alarm bells
- **Recommendation**: Use red accent without pulsing/glowing effects.

**4. Empty States Are Too Generic**
- "You're all caught up!" with a green checkmark is SaaS cliché
- "No invoices yet" is functionally correct but emotionally flat
- **Recommendation**: Reinforce the relationship. "Your breeder will send invoices as your journey progresses" feels more personal.

**5. Species Icons (Emojis)**
- Task icons use emojis (💳, 📝, 📅, 🐕)
- Emojis are **inconsistent across platforms** (iOS, Android, Windows render differently)
- This is acceptable for MVPs but **not premium UX**
- **Recommendation**: Replace with custom SVG icons for brand consistency.

#### Competitive Differentiation
- **Good Puppy** (competitor) uses generic SaaS templates with bright colors and gamification
- **BreederHQ's calm, dark theme** is a clear differentiator
- However, **navigation complexity and bureaucratic patterns** undermine this advantage

#### Commercial Risk Assessment
- **High trust requirement** — users are making $1,000+ purchases through this portal
- **Payment flow is solid** (Stripe integration, clear invoice details, receipt modal)
- **But**: Confusing navigation and administrative friction increase perceived risk
- **Verdict**: UX debt could lead to support burden ("Where do I find X?") and cart abandonment

#### Final Verdict
This portal **looks premium** but **feels enterprise** in the wrong ways. Simplify navigation, remove bureaucratic friction, and refine urgency patterns. The brand promise is strong — the execution needs tightening.

---

### Role 4: Skeptical External Reviewer

#### First Impression (30-Second Test)
I land on the dashboard. I see:
- A horizontal nav bar with 7+ items
- A context strip showing an animal's name, species, breed, status, "next action," and a CTA
- Four "Needs Attention" cards (Tasks, Messages, Notifications, Payment Due)
- Four text links at the bottom (Documents, Agreements, Profile, Offspring)

**Reaction**: "This is busy. What should I do first?"

The portal is trying to show me everything at once. There's no clear hierarchy. The "next action" text is vague ("Ready to schedule go-home" — what does that mean?).

#### Red Flags

**1. Horizontal Scrolling Navigation**
I scroll right on the top nav and discover "Offspring" — **why is this hidden?**
If offspring management is a core feature, it shouldn't be off-screen.
**Verdict**: This will confuse users.

**2. Dual Task/Notification Badges**
The header shows a badge on "Tasks" (3) and a dot on the bell icon (notifications).
I click Tasks — I see 3 action items.
I click Notifications — I see 2 updates.
**What's the difference?** Both seem like "things I need to know about."
**Verdict**: Confusing. Pick one pattern.

**3. "All Caught Up" Feels Dismissive**
I have no tasks. The page shows a green checkmark and "You're all caught up!"
But I'm expecting a puppy. Shouldn't I see updates on the puppy's progress?
**Verdict**: Empty states should reinforce value, not dismiss me.

**4. Profile "Request Change" Buttons**
I want to update my phone number. I see an "Edit" button. Great!
But for my name, I see "Request Change." I click it… nothing happens.
**Verdict**: Frustrating. If I can't change it, tell me why. If I can, let me.

**5. Financial Page View Toggle**
I'm looking at invoices. I see an "Overview" / "All Invoices" toggle.
I click "All Invoices." I see… the same invoices, just with a "Paid" section added.
**Verdict**: Pointless feature. Just show me everything by default.

**6. Messages vs. Messaging Icon**
There's a "Messages" link in the nav AND a messages icon in the header.
**Verdict**: Redundant. Pick one.

#### Trust Assessment
- **Payment flow feels secure** (Stripe branding, clear invoice details)
- **But**: Navigation confusion makes me doubt the platform's maturity
- **Empty states** feel like placeholders, not real product

#### Comparative Benchmark
- **Stripe Dashboard**: Minimal nav (4 items), clear hierarchy, no horizontal scroll
- **Notion**: Dense UI but intuitive navigation model (sidebar + breadcrumbs)
- **BreederHQ Portal**: Trying to do both and succeeding at neither

#### Would I Trust This with $5,000?
Maybe. The payment flow works. But the confusing navigation makes me feel like this is a beta product, not a premium service.

#### Final Verdict
This portal **works** but doesn't **delight**. It feels like an admin panel dressed up with gradients. Simplify navigation, remove redundant features, and make empty states feel like progress, not absence.

---

## Arbitration: Conflicts and Resolution

### Conflict 1: Navigation Complexity
- **Design Lead**: "7-item scrollable nav is cognitive overload"
- **Architect**: "Custom routing works, but navigation is fragile"
- **Business**: "Scrollable nav damages premium positioning"
- **External Reviewer**: "I didn't discover Offspring until I scrolled right"

**Resolution**: **UNANIMOUS AGREEMENT** — Navigation must be simplified.

**Decision**:
- **Reduce top-level nav to 4 items**: Dashboard, Activity (replaces Tasks + Notifications), Messages, Account (replaces Profile + Documents + Agreements + Financials + Offspring)
- **Use contextual navigation** within Account page (e.g., tabs for Financials, Documents, Profile)
- **Remove Messages from both TopNav AND icon** — unify into single icon in header

---

### Conflict 2: Task vs. Notification Duplication
- **Design Lead**: "These systems overlap — unify them"
- **Architect**: "Aggregation logic already exists, but adding confusion"
- **Business**: "Users won't understand the difference"
- **External Reviewer**: "I clicked both and saw similar content"

**Resolution**: **UNANIMOUS AGREEMENT** — Unify into single "Activity" concept.

**Decision**:
- **Replace Tasks + Notifications with "Activity" page**
- **Group by type**: Action Required (invoices, agreements), Updates (messages, status changes), Completed
- **Single badge in header** showing total action-required count

---

### Conflict 3: Dashboard Context Strip
- **Design Lead**: "Next Action text is internal complexity leaking"
- **Architect**: "Logic is fine, but UX is confusing"
- **Business**: "Users don't think in 'next actions'"
- **External Reviewer**: "'Ready to schedule go-home' — what does that mean?"

**Resolution**: **MAJORITY AGREEMENT** (3/4) — Simplify context strip.

**Decision**:
- **Remove "Next Action" text entirely**
- **Show**: Animal name, species/breed, status badge, single primary CTA
- **If multiple actions exist**, CTA should say "View Details" (leads to Activity page)
- **If one urgent action exists**, CTA should be specific ("Pay Invoice", "Sign Agreement")

---

### Conflict 4: Financial Page View Toggle
- **Design Lead**: "Pointless feature solving non-existent problem"
- **Architect**: "Adds complexity without value"
- **Business**: "Feels like feature bloat"
- **External Reviewer**: "Clicked toggle, saw minimal difference"

**Resolution**: **UNANIMOUS AGREEMENT** — Remove toggle.

**Decision**:
- **Show all invoices grouped by status** (Overdue, Due, Paid)
- **Collapse "Paid" section by default** if overdue/due invoices exist
- **Remove "Overview" vs. "All Invoices" concept entirely**

---

### Conflict 5: Profile "Request Change" Pattern
- **Design Lead**: "Bureaucratic friction damages trust"
- **Architect**: "Technically fine, but UX is unclear"
- **Business**: "Feels like government paperwork"
- **External Reviewer**: "Clicked 'Request Change', nothing happened"

**Resolution**: **UNANIMOUS AGREEMENT** — Remove or explain friction.

**Decision**:
- **If name changes require approval**, show inline explanation: "Name changes are reviewed by your breeder to maintain accurate records."
- **Provide feedback when "Request Change" is clicked** (e.g., "Request sent to [Breeder Name]")
- **Allow direct editing of phone, WhatsApp, and address** without approval

---

### Conflict 6: Empty States Tone
- **Design Lead**: "Too generic, lacks personality"
- **Business**: "Doesn't reinforce relationship with breeder"
- **External Reviewer**: "Feels dismissive"

**Resolution**: **MAJORITY AGREEMENT** (3/4 — Architect neutral) — Revise empty state copy.

**Decision**:
- **Replace "You're all caught up!"** with "No action needed right now. We'll notify you when something requires your attention."
- **Replace "No invoices yet"** with "Your breeder will send invoices as your journey progresses."
- **Add context to empty states** (e.g., "Your breeder will share documents here when available")

---

### Conflict 7: Emoji Icons vs. Custom SVGs
- **Business**: "Emojis are inconsistent across platforms, not premium"
- **Design Lead**: "Emojis are acceptable for MVP but should be replaced"
- **Architect**: "No technical blocker, just replace"
- **External Reviewer**: "Didn't notice, not a deal-breaker"

**Resolution**: **MAJORITY AGREEMENT** (3/4) — Replace emojis with SVGs.

**Decision**:
- **Replace emoji task icons** (💳, 📝, 📅, 🐕) with custom SVG icons
- **Use species-specific SVG silhouettes** (dog, cat, horse) instead of emojis
- **Maintain color coding** (species accent colors)

---

## Unified Direction: Execution-Ready Design

### 1. Navigation Architecture

#### Header (Fixed Top Bar)
```
[OrgLogo + Name] [Messages Icon] [Activity Icon] [Sign Out]
```

- **OrgLogo + Name**: Clickable, navigates to Dashboard
- **Messages Icon**: Speech bubble icon with unread badge
- **Activity Icon**: Bell icon with action-required badge (orange for action, none if clear)
- **Sign Out**: Button on far right

#### No Top Navigation Bar
- **Remove scrollable TopNav entirely**
- **Navigation happens via**: Dashboard cards, header icons, and contextual links

---

### 2. Dashboard Redesign

#### Layout
```
[Welcome, {FirstName}]

[Primary Placement Card]
  - Animal Name, Species/Breed
  - Status Badge (Reserved, Active, etc.)
  - Single Primary CTA (Pay Invoice, View Details, Sign Agreement, etc.)

[Activity Summary] (only if counts > 0)
  - Action Required: {count}
  - New Messages: {count}
  - [View All Activity →]

[Quick Links]
  - Financials | Documents | Agreements | Profile
```

#### Primary Placement Card
- **Simplified**: No "next action" text
- **CTA logic**: Most urgent action (Overdue > Agreement > Payment > Schedule > View Details)
- **Species accent**: Left border colored by species

---

### 3. Activity Page (Replaces Tasks + Notifications)

#### Layout
```
[Activity]
  Subtitle: What needs your attention

[Filters: All | Action Required | Updates | Completed]

[Grouped Cards]
  - Overdue (red accent, priority sort)
  - Action Required (orange accent)
  - Updates (neutral)
  - Completed (collapsed by default if other sections exist)
```

#### Card Structure
- **Icon**: SVG (not emoji)
- **Title**: "Invoice #INV-001", "Agreement: Puppy Purchase Contract"
- **Subtitle**: Description
- **Status Badge**: Due, Overdue, Complete, New, etc.
- **Action Link**: → (right arrow for navigation)

---

### 4. Messages Page (No Changes)
- Current design is solid
- **Remove Messages from dashboard** (only in header icon)

---

### 5. Account Hub (New Page)

#### Layout
```
[Account]

[Tab Navigation]
  - Financials | Documents | Agreements | Profile | Offspring

[Tab Content]
  (Shows selected tab content)
```

#### Financials Tab
- **Remove view toggle**
- **Show**: Summary hero + Grouped invoices (Overdue, Due, Paid)
- **Paid section collapsed by default** if other sections exist

#### Profile Tab
- **Editable fields**: Phone, WhatsApp, Address (save button)
- **Request-approval fields**: Name (with explanation tooltip)
- **Email**: Contact breeder to change (with mailto: link)

---

### 6. Visual & Interaction Standards

#### Status Badges
- **No pulsing animations** (even for overdue)
- **Use color + dot** for urgency (red dot = overdue, orange = due, green = complete)
- **Consistent size**: 6px dot, uppercase label, rounded pill

#### Icons
- **Replace all emojis with SVG icons**
- **Consistent style**: 2px stroke, rounded corners, 24px size
- **Species icons**: Simple silhouettes (dog, cat, horse profiles)

#### Empty States
- **Warm, reassuring tone**: "Your breeder will share X when available"
- **No generic checkmarks** — use contextual messaging

#### Loading States
- **Skeleton screens** (current pattern is good)
- **No spinners** — use pulsing gray blocks

---

### 7. Responsive Behavior

#### Mobile (<768px)
- **Header**: OrgLogo, Messages icon, Activity icon, Hamburger (opens Account menu)
- **Dashboard**: Single column, cards stack
- **Activity**: Single column list

#### Tablet (768px - 1024px)
- **Header**: Same as desktop
- **Dashboard**: Two-column grid for Activity Summary

#### Desktop (>1024px)
- **Current layout works** with updated navigation

---

### 8. Implementation Priority

#### Phase 1: Critical (Blocking Launch)
1. Remove scrollable TopNav
2. Simplify Dashboard context strip (remove "next action" text)
3. Unify Tasks + Notifications into Activity page
4. Remove Financial page view toggle
5. Fix Profile "Request Change" feedback

#### Phase 2: High (Post-Launch, Pre-Scale)
1. Create Account Hub with tabs
2. Replace emoji icons with SVGs
3. Revise empty state copy
4. Add data fetching cache layer (React Query)

#### Phase 3: Optimization (As Needed)
1. Migrate inline styles to CSS Modules
2. Add list virtualization for 100+ items
3. Reduce session polling from 30s to 2min

---

## Final Consensus Statement

**Unanimous Agreement**:
- This portal has **strong visual design** and **solid engineering**
- However, **navigation complexity** and **feature duplication** create unnecessary friction
- The product feels **enterprise-grade in visual polish** but **admin-panel in interaction design**
- Simplification is the highest priority

**Action Items**:
1. **Reduce top-level navigation to 4 concepts**: Dashboard, Activity, Messages, Account
2. **Unify Tasks and Notifications** into single Activity page
3. **Simplify Dashboard** by removing "next action" text
4. **Remove Financial view toggle** and Profile request-change friction
5. **Replace emojis with SVG icons**
6. **Revise empty state copy** to reinforce breeder relationship

**Success Criteria**:
- New users can complete primary actions (pay invoice, sign agreement, message breeder) **within 30 seconds**
- Zero horizontal scrolling required to access core features
- Navigation model is **explainable in one sentence**: "Dashboard for overview, Activity for actions, Messages for communication, Account for settings"

**This is execution-ready design. The panel unanimously approves these changes for immediate implementation.**

---

## Component Specification Details

### Navigation Header Component

**File**: `apps/portal/src/components/PortalLayout.tsx`

**Current Structure**:
```tsx
<HeaderBar>
  <OrgIdentity />
  <TopNav items={7} /> // REMOVE
  <MessagesIcon />
  <NotificationsIcon />
  <SignOutButton />
</HeaderBar>
```

**New Structure**:
```tsx
<HeaderBar>
  <OrgIdentity onClick={navigateHome} />
  <Spacer /> // flex: 1
  <MessagesIcon badge={unreadCount} />
  <ActivityIcon badge={actionRequiredCount} />
  <SignOutButton />
</HeaderBar>
```

**Behavior**:
- **OrgIdentity**: Clicking navigates to `/` (dashboard)
- **MessagesIcon**: Clicking navigates to `/messages`
- **ActivityIcon**: Clicking navigates to `/activity` (new page)
- **SignOutButton**: Current behavior preserved

---

### Dashboard Primary Placement Card

**File**: `apps/portal/src/pages/PortalDashboardPage.tsx`

**Current ContextStrip Props**:
```tsx
interface ContextStripProps {
  name: string;
  species: string | null;
  breed: string | null;
  status: PlacementStatus;
  nextAction: string; // REMOVE
  ctaLabel: string;
  ctaPath: string;
  onNavigate: (path: string) => void;
}
```

**New PlacementCard Props**:
```tsx
interface PlacementCardProps {
  name: string;
  species: string | null;
  breed: string | null;
  status: PlacementStatus;
  ctaLabel: string;
  ctaPath: string;
  onNavigate: (path: string) => void;
}
```

**Visual Changes**:
- Remove center "Next Action" text section
- Layout: `[Name/Species/Status] [CTA Button]` (two-column, responsive)

**CTA Logic** (Priority Order):
1. If `overdueAmount > 0`: "Pay Invoice" → `/financials`
2. If `pendingAgreements > 0`: "Sign Agreement" → `/agreements`
3. If `totalDue > 0`: "Pay Invoice" → `/financials`
4. If `paidInFullAt && !pickupAt`: "Schedule Pickup" → `/activity`
5. Else: "View Details" → `/offspring`

---

### Activity Page (New)

**File**: `apps/portal/src/pages/PortalActivityPage.tsx` (create new)

**Data Source**:
- Reuse existing `usePortalTasks()` hook
- Reuse existing `usePortalNotifications()` hook
- Merge and deduplicate by composite ID

**Activity Item Structure**:
```tsx
interface ActivityItem {
  id: string; // composite ID
  type: 'invoice' | 'agreement' | 'offspring' | 'message' | 'document';
  urgency: 'overdue' | 'action_required' | 'update' | 'completed';
  icon: ReactNode; // SVG icon
  title: string;
  subtitle: string;
  statusLabel: string;
  statusVariant: 'error' | 'action' | 'neutral' | 'success';
  href: string;
  timestamp?: string;
}
```

**Grouping Logic**:
```tsx
const overdue = items.filter(i => i.urgency === 'overdue');
const actionRequired = items.filter(i => i.urgency === 'action_required');
const updates = items.filter(i => i.urgency === 'update');
const completed = items.filter(i => i.urgency === 'completed');
```

**Section Rendering**:
- **Overdue**: Always expanded, sorted by due date (oldest first)
- **Action Required**: Always expanded, sorted by urgency score
- **Updates**: Always expanded, sorted by timestamp (newest first)
- **Completed**: Collapsed by default if other sections exist

---

### Account Hub (New)

**File**: `apps/portal/src/pages/PortalAccountPage.tsx` (create new)

**Tab Structure**:
```tsx
type AccountTab = 'financials' | 'documents' | 'agreements' | 'profile' | 'offspring';

const tabs = [
  { key: 'financials', label: 'Financials' },
  { key: 'documents', label: 'Documents' },
  { key: 'agreements', label: 'Agreements' },
  { key: 'profile', label: 'Profile' },
  { key: 'offspring', label: 'Offspring' },
];
```

**Routing**:
- `/account` → defaults to `financials` tab
- `/account/financials` → Financials tab
- `/account/profile` → Profile tab
- etc.

**Tab Content**:
- **Financials**: Embed existing `PortalFinancialsPage` (remove hero, keep content)
- **Documents**: Embed existing `PortalDocumentsPage`
- **Agreements**: Embed existing `PortalAgreementsPage`
- **Profile**: Embed existing `PortalProfilePage` with edits
- **Offspring**: Embed existing `PortalOffspringPage`

---

### Profile Tab Edits

**File**: `apps/portal/src/pages/PortalProfilePageNew.tsx`

**Editable Without Approval**:
- Mobile phone
- WhatsApp
- Address (all fields)

**Editable With Approval**:
- First name, Last name, Nickname
- Show tooltip: "Name changes are reviewed by your breeder to maintain accurate records"
- On click: Show inline confirmation "Request sent to [Breeder Name]"

**Read-Only**:
- Email
- Show text: "Contact your breeder to change your email address"
- Provide `mailto:` link to breeder's email

---

### Empty State Copy Updates

**Tasks/Activity Empty**:
```
Current: "You're all caught up!"
New: "No action needed right now. We'll notify you when something requires your attention."
```

**Financials Empty**:
```
Current: "No invoices yet"
New: "Your breeder will send invoices as your journey progresses."
```

**Documents Empty**:
```
Current: "No documents yet"
New: "Your breeder will share documents here when available."
```

**Agreements Empty**:
```
Current: "No agreements yet"
New: "Agreements from your breeder will appear here when they're ready."
```

---

### Status Badge Specifications

**Remove Pulsing/Glowing**:
```css
/* REMOVE these styles */
box-shadow: 0 0 6px var(--portal-error); /* glowing effect */
animation: pulse 2s infinite; /* pulsing effect */
```

**Standard Badge Structure**:
```tsx
<StatusBadge variant="error"> // red dot, no glow
  <Dot color="var(--portal-error)" />
  <Label>Overdue</Label>
</StatusBadge>
```

**Dot Specifications**:
- Size: 6px diameter
- No box-shadow
- Solid color fill (no gradients)

---

### Icon Specifications

**Replace Emojis**:
- Current: 💳 📝 📅 🐕 📄
- New: Custom SVG icons

**SVG Style Guide**:
- Stroke width: 2px
- Corner radius: 2px (rounded)
- Size: 24x24px canvas
- Format: Inline SVG components (not external files)

**Icon Set**:
```tsx
<InvoiceIcon />    // Credit card outline
<AgreementIcon />  // Document with signature line
<AppointmentIcon /> // Calendar with clock
<DocumentIcon />   // File outline
<OffspringIcon />  // Species-specific silhouette (dog/cat/horse)
```

**Species Icons**:
- Dog: Side profile silhouette
- Cat: Side profile silhouette
- Horse: Side profile silhouette
- Rabbit: Side profile silhouette
- Sheep: Side profile silhouette

---

### Financials Page Changes

**File**: `apps/portal/src/pages/PortalFinancialsPage.tsx`

**Remove**:
```tsx
// DELETE this component
function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) { ... }

// DELETE this state
const [viewMode, setViewMode] = React.useState<ViewMode>("overview");
```

**New Render Logic**:
```tsx
// Always show all invoices grouped by status
<InvoicesList
  invoices={invoices}
  onSelectInvoice={handleSelectInvoice}
  onPayInvoice={handlePayInvoice}
/>

// Paid section collapsed by default if other sections exist
<TaskGroup
  title="Paid"
  tasks={paidInvoices}
  collapsible
  defaultCollapsed={overdueInvoices.length > 0 || dueInvoices.length > 0}
/>
```

---

## Technical Implementation Notes

### Data Fetching Optimization

**Problem**: Multiple pages fetch `/portal/placements` independently

**Solution Options**:

**Option A**: Fetch in PortalLayout, pass via context
```tsx
// apps/portal/src/components/PortalLayout.tsx
const [primaryPlacement, setPrimaryPlacement] = React.useState(null);

React.useEffect(() => {
  // Fetch placements once
  portalFetch('/portal/placements').then(data => {
    setPrimaryPlacement(data.placements[0]);
  });
}, []);

return (
  <PlacementContext.Provider value={primaryPlacement}>
    {children}
  </PlacementContext.Provider>
);
```

**Option B**: Introduce React Query
```tsx
// apps/portal/src/hooks/usePlacements.ts
import { useQuery } from '@tanstack/react-query';

export function usePlacements() {
  return useQuery({
    queryKey: ['placements'],
    queryFn: () => portalFetch('/portal/placements'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

**Recommendation**: Option B (React Query) for future scalability

---

### Routing Refactor

**Current Pattern**:
```tsx
window.history.pushState({}, "", path);
window.dispatchEvent(new PopStateEvent("popstate"));
```

**Issues**:
- No type safety
- Manual event dispatching
- Back button edge cases

**Future Consideration**:
- If routing becomes complex, introduce React Router or TanStack Router
- Current pattern is acceptable for MVP

---

### Type Safety Improvements

**Generate TypeScript Types from API**:

```bash
# Install OpenAPI TypeScript Generator
npm install --save-dev openapi-typescript

# Generate types from API schema
npx openapi-typescript http://localhost:3000/api/openapi.json -o src/types/api.ts
```

**Usage**:
```tsx
import type { paths } from './types/api';

type PlacementsResponse = paths['/portal/placements']['get']['responses']['200']['content']['application/json'];

const [placements, setPlacements] = React.useState<PlacementsResponse['placements']>([]);
```

---

## Testing Checklist

### Pre-Launch Testing (Phase 1)

#### Navigation
- [ ] Dashboard loads without horizontal scroll
- [ ] Activity icon badge shows correct count
- [ ] Messages icon badge shows correct count
- [ ] Sign out button works
- [ ] Back button works after navigation

#### Dashboard
- [ ] Primary placement card shows correct CTA
- [ ] Activity summary only shows when counts > 0
- [ ] Quick links navigate correctly
- [ ] Empty state shows when no placement exists

#### Activity Page
- [ ] Overdue section shows highest priority items first
- [ ] Action Required section groups correctly
- [ ] Updates section shows recent changes
- [ ] Completed section is collapsed by default (when other sections exist)
- [ ] Clicking activity item navigates to correct detail page

#### Financials
- [ ] View toggle is removed
- [ ] Paid section is collapsed by default (when overdue/due exist)
- [ ] Overdue invoices show red styling (no pulsing)
- [ ] Pay Now button initiates Stripe checkout
- [ ] Receipt modal shows for paid invoices

#### Profile
- [ ] Phone/WhatsApp/Address are directly editable
- [ ] Name fields show "Request Change" with tooltip
- [ ] Email shows "Contact breeder" message
- [ ] Save button works for editable fields

---

## Design Assets Required

### SVG Icons
- [ ] Invoice icon (credit card outline)
- [ ] Agreement icon (document with signature)
- [ ] Appointment icon (calendar with clock)
- [ ] Document icon (file outline)
- [ ] Dog silhouette (side profile)
- [ ] Cat silhouette (side profile)
- [ ] Horse silhouette (side profile)
- [ ] Rabbit silhouette (side profile)
- [ ] Sheep silhouette (side profile)

**Format**: React components with inline SVG
**Style**: 2px stroke, 24x24px canvas, rounded corners

---

## Metrics to Track Post-Launch

### User Behavior
- **Navigation clarity**: Time to first action (target: <30 seconds)
- **Feature discovery**: % of users accessing Account hub
- **Activity engagement**: % of users clicking Activity badge
- **Task completion**: % of users completing primary CTA on dashboard

### Technical Performance
- **Data fetching**: Duplicate API calls eliminated
- **Page load time**: <2 seconds for dashboard
- **Error rates**: <1% for navigation interactions

### Support Impact
- **Navigation questions**: "Where is X?" support tickets
- **Profile friction**: "How do I change Y?" support tickets
- **Payment completion**: Stripe checkout abandonment rate

---

## Appendix A: Current Component Inventory

### Layout Components
- `PortalLayout.tsx` — Main wrapper with header/footer
- `HeaderBar.tsx` — Fixed top navigation bar
- `TopNav.tsx` — Horizontal scrollable nav (TO BE REMOVED)
- `Footer.tsx` — Footer with branding
- `PageContainer.tsx` — Max-width content wrapper
- `PageScaffold.tsx` — Page header with title/subtitle

### Design System
- `PortalCard.tsx` — Card variants (elevated, flat, interactive, hero)
- `Button.tsx` — Button variants (primary, secondary, ghost)
- `StatusBadge.tsx` — Status indicators with dots
- `SubjectHeader.tsx` — Species-aware context strip
- `PortalHero.tsx` — Page hero section

### Pages
- `PortalDashboardPage.tsx` — Dashboard
- `PortalTasksPageNew.tsx` — Tasks (TO BE MERGED INTO ACTIVITY)
- `PortalNotificationsPageNew.tsx` — Notifications (TO BE MERGED INTO ACTIVITY)
- `PortalMessagesPage.tsx` — Messages
- `PortalFinancialsPage.tsx` — Financials
- `PortalDocumentsPageNew.tsx` — Documents
- `PortalAgreementsPageNew.tsx` — Agreements
- `PortalProfilePageNew.tsx` — Profile
- `PortalOffspringPage.tsx` — Offspring

### Data Hooks
- `usePortalContext.ts` — Session parsing
- `useTenantContext.ts` — Tenant context
- `usePortalTasks.ts` — Task aggregation
- `usePortalNotifications.ts` — Notification aggregation
- `useUnreadMessageCount.ts` — Message counts

---

## Appendix B: File Changes Required

### Phase 1: Critical Changes

#### New Files
- `apps/portal/src/pages/PortalActivityPage.tsx` (new)
- `apps/portal/src/hooks/usePortalActivity.ts` (new, merges tasks + notifications)

#### Modified Files
- `apps/portal/src/components/PortalLayout.tsx`
  - Remove `<TopNav />` component
  - Simplify header to: OrgIdentity, Messages, Activity, SignOut
  - Update badge logic (single Activity badge)

- `apps/portal/src/pages/PortalDashboardPage.tsx`
  - Remove `nextAction` prop from ContextStrip
  - Simplify CTA logic
  - Update Activity Summary to show single count

- `apps/portal/src/pages/PortalFinancialsPage.tsx`
  - Remove `ViewToggle` component
  - Remove `viewMode` state
  - Always show all invoices grouped by status

- `apps/portal/src/pages/PortalProfilePageNew.tsx`
  - Add inline editing for phone/WhatsApp/address
  - Add tooltip for name fields
  - Add confirmation message for "Request Change"

#### Deleted Files
- `apps/portal/src/pages/PortalTasksPageNew.tsx` (merged into Activity)
- `apps/portal/src/pages/PortalNotificationsPageNew.tsx` (merged into Activity)
- `apps/portal/src/design/TopNav.tsx` (removed)

---

### Phase 2: High-Priority Changes

#### New Files
- `apps/portal/src/pages/PortalAccountPage.tsx` (new hub)
- `apps/portal/src/icons/*.tsx` (SVG icon components)

#### Modified Files
- All pages: Replace emoji icons with SVG components
- All empty states: Update copy per specifications
- All status badges: Remove pulsing/glowing CSS

---

## Appendix C: Migration Path

### For Existing Users

**URL Redirects**:
```
/tasks → /activity (301 redirect)
/notifications → /activity (301 redirect)
/profile → /account/profile (301 redirect)
/documents → /account/documents (301 redirect)
/agreements → /account/agreements (301 redirect)
/financials → /account/financials (301 redirect)
/offspring → /account/offspring (301 redirect)
```

**Session Migration**:
- No session data changes required
- URL bookmarks will auto-redirect
- Browser back button will work via redirect chain

---

## Sign-Off

**Panel Consensus**: Unanimous approval
**Ready for Implementation**: Yes
**Blocking Issues**: None
**Next Steps**: Proceed to Phase 1 implementation

---

**Document Version**: 1.0
**Last Updated**: January 12, 2026
**Review Panel**: Design Lead, Front-End Architect, Product Owner, External Reviewer
