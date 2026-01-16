# Marketplace Dual-Entry Architecture Specification

**Version**: 1.0
**Date**: 2026-01-12
**Status**: Implementation Ready
**Relates To**: marketplace-ui-ux-design-specification.md

---

## Overview

The BreederHQ Marketplace has two distinct entry points that share the same core UI components but differ in layout, navigation, and authentication handling. This specification defines how the design system adapts to each context.

---

## 1. Dual-Layout Architecture

### 1.1 Entry Point Comparison

| Aspect | Standalone Marketplace | Embedded in Platform |
|--------|------------------------|----------------------|
| **Domain** | marketplace.breederhq.com | app.breederhq.com/marketplace |
| **Router** | BrowserRouter | MemoryRouter |
| **Layout Wrapper** | MarketplaceLayout | Platform NavShell |
| **Header** | Marketplace header (64px) | Platform header |
| **Footer** | Full marketplace footer | None (platform handles) |
| **URL Control** | Full control | Platform syncs URL |
| **Auth** | MarketplaceGate | Platform session |
| **Users** | Non-subscribers, public browsers | Platform subscribers |
| **Mobile Nav** | BottomTabBar | Platform mobile nav |

### 1.2 Layout Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SHARED COMPONENT LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AnimalCard, ServiceCard, ProgramCard, FilterPanel,         │   │
│  │  SearchBar, Modal, Toast, Forms, etc.                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────┬───────────────────────────────────┤
│     STANDALONE LAYOUT           │      EMBEDDED LAYOUT              │
│  ┌───────────────────────────┐  │  ┌─────────────────────────────┐ │
│  │ MarketplaceLayout         │  │  │ Platform NavShell           │ │
│  │  ├─ MarketplaceHeader     │  │  │  ├─ PlatformHeader          │ │
│  │  ├─ MarketplaceNav        │  │  │  ├─ PlatformSidebar         │ │
│  │  ├─ [Page Content]        │  │  │  ├─ MarketplaceEmbedded     │ │
│  │  └─ MarketplaceFooter     │  │  │  │   └─ [Page Content]      │ │
│  └───────────────────────────┘  │  │  └─ (No footer)             │ │
│                                 │  └─────────────────────────────┘ │
└─────────────────────────────────┴───────────────────────────────────┘
```

### 1.3 MarketplaceLayout (Standalone)

**Purpose**: Full-page wrapper for standalone marketplace app

**Anatomy**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (64px, sticky)                                               │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [Logo]  Home  Animals  Breeders  Services  |  [🔍] [🔔] [Avatar]│ │
│ └─────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                         PAGE CONTENT                                │
│                      (max-width: 1200px)                            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                              │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ About | Help | Trust & Safety | Terms | Privacy | © 2026       │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Props**:
```typescript
interface MarketplaceLayoutProps {
  children: ReactNode;
  showFooter?: boolean;      // Default: true
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';  // Default: 'lg' (1200px)
  headerVariant?: 'solid' | 'transparent';  // Default: 'solid'
}
```

### 1.4 MarketplaceEmbedded (Platform Integration)

**Purpose**: Wrapper for marketplace content when embedded in Platform

**Anatomy**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ PLATFORM HEADER (controlled by Platform)                            │
├───────────────┬─────────────────────────────────────────────────────┤
│ PLATFORM      │ MARKETPLACE CONTENT                                 │
│ SIDEBAR       │ ┌─────────────────────────────────────────────────┐ │
│               │ │ Marketplace sub-navigation (if needed)          │ │
│ • Dashboard   │ ├─────────────────────────────────────────────────┤ │
│ • Animals     │ │                                                 │ │
│ • Breeding    │ │              PAGE CONTENT                       │ │
│ • Contacts    │ │                                                 │ │
│ • Finance     │ │                                                 │ │
│ ────────────  │ │                                                 │ │
│ • Marketplace │ │                                                 │ │
│   (active)    │ │                                                 │ │
│               │ └─────────────────────────────────────────────────┘ │
└───────────────┴─────────────────────────────────────────────────────┘
```

**Behavior**:
- No header (Platform provides)
- No footer (Platform provides)
- Content fills available space
- MemoryRouter syncs with Platform URL
- Dispatches `bhq:module` event on mount

**Props**:
```typescript
interface MarketplaceEmbeddedProps {
  initialPath?: string;  // Synced from Platform URL
}
```

### 1.5 Layout Detection Hook

```typescript
interface UseLayoutContext {
  isEmbedded: boolean;           // true if in Platform
  isStandalone: boolean;         // true if standalone
  canControlUrl: boolean;        // true if BrowserRouter
  headerHeight: number;          // 64 (standalone) or Platform's
  hasFooter: boolean;            // true if standalone
  maxContentWidth: number;       // varies by context
}

// Usage
const { isEmbedded, headerHeight } = useLayoutContext();
```

---

## 2. Navigation Differences by Entry Point

### 2.1 Standalone Navigation Structure

#### Desktop Header Navigation
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]                                                              │
│                                                                     │
│ PRIMARY NAV (left)                                                  │
│ ├─ Home                                                             │
│ ├─ Animals ▾ (dropdown: By Category, Recently Added, Near Me)      │
│ ├─ Breeders ▾ (dropdown: All Programs, Top Rated, By Breed)        │
│ └─ Services ▾ (dropdown: By Category, Near Me, Featured)           │
│                                                                     │
│ ACTIONS (right)                                                     │
│ ├─ [🔍] Search                                                      │
│ ├─ [🔔] Notifications (badge count)                                │
│ └─ [Avatar ▾] Account Menu                                         │
│     ├─ My Inquiries                                                │
│     ├─ Saved Items                                                 │
│     ├─ My Waitlists                                                │
│     ├─ ────────────                                                │
│     ├─ Seller Dashboard (if seller)                                │
│     │   ├─ My Programs                                             │
│     │   ├─ My Services                                             │
│     │   └─ Provider Portal                                         │
│     ├─ ────────────                                                │
│     ├─ Settings                                                    │
│     └─ Sign Out                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

#### Mobile Bottom Tab Bar (Standalone)
```
┌─────────────────────────────────────────────────────────────────────┐
│  [🏠]       [🔍]       [💬]       [♡]       [👤]                   │
│  Home      Browse    Messages   Saved    Account                    │
└─────────────────────────────────────────────────────────────────────┘
```

**Tab Definitions**:
| Tab | Icon | Label | Route | Badge |
|-----|------|-------|-------|-------|
| Home | 🏠 | Home | `/` | - |
| Browse | 🔍 | Browse | `/animals` | - |
| Messages | 💬 | Messages | `/inquiries` | Unread count |
| Saved | ♡ | Saved | `/saved` | - |
| Account | 👤 | Account | `/account` | - |

### 2.2 Embedded Navigation Structure

When embedded in Platform, marketplace navigation is **contextual** within the Platform's nav structure.

#### Platform Sidebar (Marketplace Section)
```
┌─────────────────────┐
│ PLATFORM SIDEBAR    │
│                     │
│ Dashboard           │
│ Animals             │
│ Breeding            │
│ Contacts            │
│ Finance             │
│ Marketing           │
│ ─────────────────── │
│ ▼ Marketplace       │  ← Expanded section
│   • Browse          │
│   • My Listings     │
│   • My Programs     │
│   • My Services     │
│   • Inquiries       │
│ ─────────────────── │
│ Settings            │
└─────────────────────┘
```

#### Marketplace Sub-Navigation (Embedded)
When on marketplace routes, show contextual sub-nav within content area:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Marketplace                                                         │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ [Browse] [My Listings] [My Programs] [My Services] [Inquiries] │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ [Page Content Below]                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Navigation State by User Role

| User Type | Standalone Nav | Embedded Nav |
|-----------|---------------|--------------|
| **Anonymous** | Home, Browse, Login/Register | N/A (must be logged in) |
| **Buyer Only** | + Inquiries, Saved, Waitlists | + Browse, Inquiries |
| **Seller (Breeder)** | + My Programs, My Listings | + My Programs, My Listings |
| **Service Provider** | + My Services, Provider Portal | + My Services |
| **Seller + Provider** | All seller + provider items | All items |

### 2.4 Route Mapping

| Feature | Standalone Route | Embedded Route | Notes |
|---------|-----------------|----------------|-------|
| Home | `/` | `/marketplace` | Different content |
| Browse Animals | `/animals` | `/marketplace/animals` | Same component |
| Animal Detail | `/animals/:id` | `/marketplace/animals/:id` | Same component |
| Browse Breeders | `/breeders` | `/marketplace/breeders` | Same component |
| Breeder Profile | `/breeders/:slug` | `/marketplace/breeders/:slug` | Same component |
| Browse Services | `/services` | `/marketplace/services` | Same component |
| Service Detail | `/services/:id` | `/marketplace/services/:id` | Same component |
| My Programs | `/me/programs` | `/marketplace/me/programs` | Seller only |
| My Services | `/me/services` | `/marketplace/me/services` | Provider only |
| Inquiries | `/inquiries` | `/marketplace/inquiries` | Auth required |
| Saved | `/saved` | `/marketplace/saved` | Auth required |
| Waitlists | `/waitlists` | `/marketplace/waitlists` | Auth required |
| Settings | `/settings` | Platform settings | Different page |
| Login | `/auth/login` | N/A | Standalone only |
| Register | `/auth/register` | N/A | Standalone only |

---

## 3. Authentication & Entitlement UI States

### 3.1 Auth State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION STATES                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    Login     ┌──────────────┐                        │
│  │ANONYMOUS │ ──────────►  │AUTHENTICATED │                        │
│  └──────────┘              └──────────────┘                        │
│       │                          │                                  │
│       │                          ▼                                  │
│       │                    ┌───────────┐      ┌───────────────┐    │
│       │                    │ ENTITLED? │──Yes─►│ FULL ACCESS   │    │
│       │                    └───────────┘      └───────────────┘    │
│       │                          │ No                               │
│       │                          ▼                                  │
│       │                    ┌───────────────┐                        │
│       │                    │LIMITED ACCESS │                        │
│       │                    └───────────────┘                        │
│       │                                                             │
│       ▼                                                             │
│  ┌────────────────────────────────────────┐                        │
│  │ PUBLIC ACCESS (browse only)            │                        │
│  └────────────────────────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 UI States by Auth Level

#### State: Anonymous (Not Logged In)

**Standalone Behavior**:
- Can browse all public listings, programs, services
- See "Login" / "Sign Up" buttons in header
- Clicking protected actions shows login prompt

**UI Elements**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (Anonymous)                                                  │
│ [Logo]  Home  Animals  Breeders  Services  |  [Login] [Sign Up]    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PROTECTED ACTION PROMPT (Modal)                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                    Sign in to continue                          │ │
│ │                                                                 │ │
│ │  You need to be signed in to:                                   │ │
│ │  • Send inquiries to breeders                                   │ │
│ │  • Save listings to your favorites                              │ │
│ │  • Join waitlists                                               │ │
│ │                                                                 │ │
│ │  [Sign In]  [Create Account]                                    │ │
│ │                                                                 │ │
│ │  [Continue Browsing]                                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Embedded Behavior**: N/A (Platform requires auth)

#### State: Authenticated but NOT Entitled

**Applies to**: Standalone marketplace users who are logged in but don't have marketplace entitlement (edge case - invited but not activated, expired trial, etc.)

**UI Elements**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ ACCESS NOT AVAILABLE (Full Page)                                    │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                    [Lock Icon]                                  │ │
│ │                                                                 │ │
│ │              Marketplace Access Required                        │ │
│ │                                                                 │ │
│ │  Your account doesn't have access to the marketplace.          │ │
│ │                                                                 │ │
│ │  This could be because:                                         │ │
│ │  • Your marketplace access hasn't been activated               │ │
│ │  • Your trial period has ended                                 │ │
│ │  • There's an issue with your subscription                     │ │
│ │                                                                 │ │
│ │  [Contact Support]  [Learn About Marketplace]                   │ │
│ │                                                                 │ │
│ │  [Sign Out]                                                     │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

#### State: Authenticated + Entitled (Buyer Only)

**Capabilities**:
- All public browsing
- Send inquiries
- Save/favorite listings
- Join waitlists
- View inquiry history
- Manage saved items

**UI Elements**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (Buyer)                                                      │
│ [Logo]  Home  Animals  Breeders  Services  |  [🔍] [🔔2] [Avatar▾]│
│                                                                     │
│ Avatar Menu:                                                        │
│ ├─ My Inquiries                                                    │
│ ├─ Saved Items                                                     │
│ ├─ My Waitlists                                                    │
│ ├─ ────────────                                                    │
│ ├─ Settings                                                        │
│ └─ Sign Out                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### State: Authenticated + Entitled + Seller (Breeder)

**Additional Capabilities**:
- Manage breeding programs
- Create/edit animal listings
- Manage litters/offspring
- View/respond to inquiries
- Manage waitlists

**UI Elements**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (Seller)                                                     │
│ [Logo]  Home  Animals  Breeders  Services  |  [🔍] [🔔5] [Avatar▾]│
│                                                                     │
│ Avatar Menu:                                                        │
│ ├─ My Inquiries                                                    │
│ ├─ Saved Items                                                     │
│ ├─ My Waitlists                                                    │
│ ├─ ────────────                                                    │
│ │ SELLER DASHBOARD                                                 │
│ ├─ My Programs                                                     │
│ ├─ My Listings                                                     │
│ ├─ Manage Waitlist                                                 │
│ ├─ ────────────                                                    │
│ ├─ Settings                                                        │
│ └─ Sign Out                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

#### State: Authenticated + Entitled + Service Provider

**Additional Capabilities**:
- Create/manage service listings
- Provider portal access
- Service inquiries

**UI Elements**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ Avatar Menu (Service Provider):                                     │
│ ├─ My Inquiries                                                    │
│ ├─ Saved Items                                                     │
│ ├─ My Waitlists                                                    │
│ ├─ ────────────                                                    │
│ │ SERVICE PROVIDER                                                 │
│ ├─ My Services                                                     │
│ ├─ Provider Portal                                                 │
│ ├─ ────────────                                                    │
│ ├─ Settings                                                        │
│ └─ Sign Out                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Gate Component Specification

**Purpose**: Protect routes requiring authentication/entitlement

**File**: `MarketplaceGate.tsx`

```typescript
interface GateProps {
  children: ReactNode;
  fallback?: ReactNode;           // Custom loading UI
  requireEntitlement?: boolean;   // Default: true
  redirectTo?: string;            // Default: /auth/login
}

interface GateContext {
  isLoading: boolean;
  isAuthenticated: boolean;
  isEntitled: boolean;
  user: MarketplaceUser | null;
  error: Error | null;
  refetch: () => void;
}
```

**Gate Flow**:
```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Mount Gate                                                       │
│    └─► Show loading skeleton                                        │
│                                                                     │
│ 2. Fetch /api/v1/marketplace/me                                     │
│    ├─► 401 → Redirect to /auth/login?returnTo={current}            │
│    ├─► 403 → Show AccessNotAvailable                               │
│    ├─► 200 + not entitled → Show AccessNotAvailable                │
│    └─► 200 + entitled → Render children with GateContext           │
│                                                                     │
│ 3. On token refresh failure                                         │
│    └─► Clear session, redirect to login                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Protected Action Patterns

| Action | Anonymous | Buyer | Seller | Provider |
|--------|-----------|-------|--------|----------|
| Browse listings | ✓ | ✓ | ✓ | ✓ |
| View listing detail | ✓ | ✓ | ✓ | ✓ |
| Send inquiry | Login prompt | ✓ | ✓ | ✓ |
| Save listing | Login prompt | ✓ | ✓ | ✓ |
| Join waitlist | Login prompt | ✓ | ✓ | ✓ |
| Create listing | Login prompt | Upgrade prompt | ✓ | - |
| Manage programs | Login prompt | Upgrade prompt | ✓ | - |
| Create service | Login prompt | - | - | ✓ |
| Provider portal | Login prompt | - | - | ✓ |

**Upgrade Prompt** (Buyer trying seller action):
```
┌─────────────────────────────────────────────────────────────────────┐
│ UPGRADE PROMPT (Modal)                                              │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                    Become a Seller                              │ │
│ │                                                                 │ │
│ │  To list animals on the marketplace, you need to set up        │ │
│ │  a seller profile.                                              │ │
│ │                                                                 │ │
│ │  As a seller you can:                                           │ │
│ │  • Create and manage breeding programs                         │ │
│ │  • List animals for sale                                        │ │
│ │  • Manage waitlists                                             │ │
│ │  • Receive and respond to inquiries                            │ │
│ │                                                                 │ │
│ │  [Set Up Seller Profile]                                        │ │
│ │                                                                 │ │
│ │  [Maybe Later]                                                  │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Mobile vs Embedded Desktop Behavior

### 4.1 Responsive Breakpoints

| Breakpoint | Width | Standalone | Embedded |
|------------|-------|------------|----------|
| mobile | < 640px | BottomTabBar | Platform mobile nav |
| tablet | 640-1023px | Collapsed header | Platform tablet |
| desktop | 1024-1279px | Full header | Sidebar + content |
| wide | ≥ 1280px | Full header | Sidebar + content |

### 4.2 Standalone Mobile Behavior

```
┌─────────────────────────┐
│ HEADER (Simplified)     │
│ [☰] [Logo]      [🔔][👤]│
├─────────────────────────┤
│                         │
│                         │
│    PAGE CONTENT         │
│    (Full width)         │
│                         │
│                         │
├─────────────────────────┤
│ BOTTOM TAB BAR          │
│ [🏠][🔍][💬][♡][👤]    │
└─────────────────────────┘
```

**Mobile-Specific Behaviors**:
- Hamburger menu replaces horizontal nav
- Bottom tab bar for primary navigation
- Search opens full-screen overlay
- Filters open as bottom sheet
- Cards stack single-column
- Touch targets minimum 44px
- Swipe gestures for common actions

### 4.3 Embedded Desktop Behavior

```
┌─────────────────────────────────────────────────────────────────────┐
│ PLATFORM HEADER (fixed)                                             │
├───────────────┬─────────────────────────────────────────────────────┤
│ PLATFORM      │ MARKETPLACE CONTENT                                 │
│ SIDEBAR       │                                                     │
│ (collapsible) │ ┌─────────────────────────────────────────────────┐ │
│               │ │ Sub-navigation tabs                             │ │
│ 240px width   │ ├─────────────────────────────────────────────────┤ │
│ or 64px       │ │                                                 │ │
│ collapsed     │ │ Content area                                    │ │
│               │ │ (fills remaining space)                         │ │
│               │ │                                                 │ │
│               │ │ Max-width: none (fluid)                         │ │
│               │ │ Padding: 24px                                   │ │
│               │ └─────────────────────────────────────────────────┘ │
└───────────────┴─────────────────────────────────────────────────────┘
```

**Embedded-Specific Behaviors**:
- No marketplace header (Platform provides)
- No bottom tab bar (Platform mobile handles)
- Content is fluid width (no max-width constraint)
- Respects Platform's sidebar collapse state
- URL changes sync to Platform router
- Module announcement on mount/unmount

### 4.4 Embedded Mobile Behavior

```
┌─────────────────────────┐
│ PLATFORM MOBILE HEADER  │
│ [☰] [Logo]      [🔔][👤]│
├─────────────────────────┤
│                         │
│   MARKETPLACE CONTENT   │
│   (Full width)          │
│                         │
│   Sub-nav as horizontal │
│   scroll tabs           │
│                         │
├─────────────────────────┤
│ PLATFORM BOTTOM NAV     │
│ (Platform's tabs)       │
└─────────────────────────┘
```

**Key Differences from Standalone Mobile**:
- No marketplace bottom tab bar
- Platform's mobile nav handles primary navigation
- Marketplace appears as one "section" within Platform
- Back button navigates within Platform context

### 4.5 Responsive Component Adaptations

| Component | Standalone Mobile | Embedded Desktop | Embedded Mobile |
|-----------|-------------------|------------------|-----------------|
| FilterPanel | Bottom sheet | Sidebar (collapsible) | Bottom sheet |
| SearchBar | Full-screen overlay | Inline in header | Full-screen overlay |
| AnimalCard | Single column | 3-4 column grid | Single column |
| Modal | Full-screen | Centered overlay | Full-screen |
| Navigation | BottomTabBar | Platform sidebar | Platform bottom nav |
| Breadcrumb | Hidden (back button) | Full path | Hidden |

### 4.6 Touch vs Mouse Interactions

| Action | Touch (Mobile) | Mouse (Desktop) |
|--------|----------------|-----------------|
| Card hover preview | N/A | Show on hover |
| Save to favorites | Tap heart | Click heart |
| Filter selection | Tap → bottom sheet | Click → sidebar expand |
| Image gallery | Swipe | Click arrows |
| Inquiry list | Swipe to archive/star | Hover actions |
| Drag reorder | Long press + drag | Click + drag |
| Context menu | Long press | Right click |

---

## 5. Backend Requirements Identified

Based on this dual-entry architecture, the following backend capabilities are required:

### 5.1 Authentication Endpoints

| Endpoint | Purpose | Exists? |
|----------|---------|---------|
| `GET /api/v1/marketplace/me` | Get current user + entitlement | ✓ Yes |
| `POST /api/v1/auth/login` | Authenticate user | ✓ Yes |
| `POST /api/v1/auth/register` | Create new account | ✓ Yes |
| `POST /api/v1/auth/logout` | End session | ✓ Yes |
| `POST /api/v1/auth/refresh` | Refresh token | ✓ Yes |
| `POST /api/v1/auth/forgot-password` | Request reset | ? Check |
| `POST /api/v1/auth/reset-password` | Complete reset | ? Check |

### 5.2 User Profile/Role Endpoints

| Endpoint | Purpose | Exists? |
|----------|---------|---------|
| `GET /api/v1/marketplace/me/profile` | Get full profile | ? Check |
| `PATCH /api/v1/marketplace/me/profile` | Update profile | ? Check |
| `GET /api/v1/marketplace/me/roles` | Get user roles (buyer/seller/provider) | ? Check |
| `POST /api/v1/marketplace/me/become-seller` | Upgrade to seller | ? Check |
| `POST /api/v1/marketplace/me/become-provider` | Register as provider | ? Check |

### 5.3 Notification Endpoints

| Endpoint | Purpose | Exists? |
|----------|---------|---------|
| `GET /api/v1/marketplace/notifications` | Get notifications | ? Check |
| `GET /api/v1/marketplace/notifications/unread-count` | Badge counts | ? Check |
| `PATCH /api/v1/marketplace/notifications/:id/read` | Mark read | ? Check |
| `POST /api/v1/marketplace/notifications/mark-all-read` | Clear all | ? Check |

### 5.4 Saved Items Endpoints

| Endpoint | Purpose | Exists? |
|----------|---------|---------|
| `GET /api/v1/marketplace/saved` | Get saved items | ? Check |
| `POST /api/v1/marketplace/saved` | Save item | ? Check |
| `DELETE /api/v1/marketplace/saved/:id` | Unsave item | ? Check |

### 5.5 Questions for Backend Team

1. **Password Reset**: Do the forgot/reset password endpoints exist?
2. **User Roles**: How is seller vs provider vs buyer role determined? Is there an explicit role field or derived from having programs/services?
3. **Become Seller Flow**: Is there an API to upgrade a buyer to seller status?
4. **Notifications**: Is there a notification system implemented?
5. **Saved Items**: Is there a favorites/saved items API?
6. **Session Management**: How does Platform session differ from standalone marketplace session?

---

## 6. Implementation Notes

### 6.1 Shared Component Guidelines

Components should be **context-agnostic** where possible:

```typescript
// Good - uses context hook
const MyComponent = () => {
  const { isEmbedded } = useLayoutContext();
  return (
    <div className={isEmbedded ? 'p-0' : 'p-6'}>
      {/* content */}
    </div>
  );
};

// Better - let layout handle spacing
const MyComponent = () => {
  return (
    <div>
      {/* content - layout wrapper handles spacing */}
    </div>
  );
};
```

### 6.2 Route Definition Pattern

```typescript
// Shared route definitions
const marketplaceRoutes = [
  { path: 'animals', element: <AnimalsPage /> },
  { path: 'animals/:id', element: <AnimalDetailPage /> },
  // ...
];

// Standalone - uses BrowserRouter
<BrowserRouter>
  <Routes>
    {marketplaceRoutes.map(route => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
  </Routes>
</BrowserRouter>

// Embedded - uses MemoryRouter with base path
<MemoryRouter initialEntries={[initialPath]}>
  <Routes>
    {marketplaceRoutes.map(route => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
  </Routes>
</MemoryRouter>
```

### 6.3 URL Sync Pattern (Embedded)

```typescript
// In MarketplaceEmbedded
useEffect(() => {
  // Sync MemoryRouter location to Platform URL
  const handlePlatformNav = (e: PopStateEvent) => {
    const platformPath = window.location.pathname.replace('/marketplace', '');
    navigate(platformPath);
  };

  window.addEventListener('popstate', handlePlatformNav);
  return () => window.removeEventListener('popstate', handlePlatformNav);
}, [navigate]);

// When navigating within marketplace
const handleNavigation = (path: string) => {
  navigate(path); // MemoryRouter
  window.history.pushState({}, '', `/marketplace${path}`); // Platform URL
};
```

---

*Document Version 1.0*
*Generated: 2026-01-12*
*Status: Implementation Ready*
