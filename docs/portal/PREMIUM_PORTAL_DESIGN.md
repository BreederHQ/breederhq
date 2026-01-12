# BreederHQ Client Portal — Premium Design Specification

**Role Context**: Senior Product Design Lead + Principal Front-End Architect
**Product**: BreederHQ Client Portal (Premium Tier - $40k Annual Value Client)
**Date**: 2026-01-12
**Status**: Design Specification v1.0

---

## 1. UX Strategy Summary

### Core Strategic Insight
When a client pays $40,000 annually for breeding program services, they're not buying a dashboard—they're buying **confidence, transparency, and control** over what matters most to them: their animal's wellbeing, their financial investment, and their relationship with the breeder.

The current portal treats the client as a passive recipient of information. The premium portal must position the client as an **informed partner** in a high-stakes, emotionally invested relationship.

### Primary UX Principles

**1. Proactive Transparency Over Reactive Disclosure**
- Don't make clients dig for updates—surface what matters before they ask
- Critical information (upcoming payments, health updates, contract milestones) must be immediately visible
- The portal should answer "What do I need to know right now?" within 3 seconds of landing

**2. Relationship-First, Not Transaction-First**
- This isn't a SaaS dashboard—it's a window into a multi-year breeding relationship
- Every interaction should reinforce trust and partnership
- Communications should feel personal, not automated

**3. Premium Means Effortless, Not Feature-Rich**
- A $40k portal doesn't need more buttons—it needs fewer decisions
- Complexity should be hidden until needed
- The most common tasks (checking on animal, paying invoice, messaging breeder) should take ≤2 clicks

**4. Emotional Intelligence in Information Design**
- Health updates about "their" animal carry emotional weight—treat them accordingly
- Financial transparency builds trust, but presentation matters (avoid sterile tables)
- Agreements and documents are legal necessities, but shouldn't feel bureaucratic

**5. Anticipatory Design Over Configurability**
- The portal should know what the client needs next (e.g., "Deposit due in 7 days")
- Don't ask clients to set up dashboards—intelligently default to what matters
- Personalization happens through behavior, not settings

**6. Mobile-Quality Standards Everywhere**
- Clients check on $40k investments from their phones at 10pm
- Every view must be readable, tappable, and complete on mobile
- No desktop-only functionality

### Success Metrics
- **Time to Critical Info**: Client can answer "How is my animal doing?" in <5 seconds
- **Proactive Clarity**: 80%+ of client questions answered by portal before they message breeder
- **Payment Friction**: Invoice → Payment completed in <60 seconds
- **Trust Signal**: Client checks portal 2-3x/week (engaged, not anxious)

---

## 2. Information Architecture

### Navigation Philosophy
**The portal has ONE primary navigation pattern: A persistent sidebar that acts as a "single source of truth" for where the client is and what they can access.**

No tabs. No mega-menus. No hidden drawers. The sidebar is always visible (collapsed on mobile) and shows 6 core destinations + header actions.

### Primary Navigation Structure

```
┌─────────────────────────────────────────────────────┐
│  [Org Avatar] Acme Breeding Co.        [🔔][✉][👤] │ ← Header: Global actions
├─────────────────────────────────────────────────────┤
│                                                     │
│  SIDEBAR (Always Visible)       MAIN CONTENT AREA  │
│  ┌──────────────────┐          ┌─────────────────┐ │
│  │ 🏠 Overview       │          │                 │ │
│  │ 🐾 My Animals     │          │   (Page-level   │ │
│  │ 💰 Financials     │          │    content)     │ │
│  │ 📄 Documents      │          │                 │ │
│  │ ✍️  Agreements     │          │                 │ │
│  │ 💬 Messages       │          │                 │ │
│  └──────────────────┘          └─────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Page Hierarchy

**Tier 1: Primary Destinations** (Sidebar)
1. **Overview** — Landing page, high-level status, next actions
2. **My Animals** — Everything about their animal(s) in the program
3. **Financials** — Invoices, payments, payment plans, spending summary
4. **Documents** — Contracts, certificates, medical records, photos
5. **Agreements** — Active contracts requiring signature or tracking
6. **Messages** — Direct line to breeder, organized by thread

**Tier 2: Header Actions** (Always Accessible)
- **Notifications Bell** (🔔) — Alerts, reminders, status changes (action-required badge)
- **Messages Icon** (✉) — Quick access to unread messages (count badge)
- **Profile Menu** (👤) — Account settings, contact info, sign out

**Tier 3: Contextual Actions** (Appear within pages)
- Pay Invoice (on Financials page)
- Sign Agreement (on Agreements page)
- Upload Document (on Documents page)
- Send Message (on Messages page)
- Edit Profile (on Profile page)

### Content Prioritization Model

**Every page follows the same information hierarchy:**

1. **Critical Status** (Top third of viewport)
   - What needs the client's attention NOW
   - Visual urgency indicators (color, iconography)
   - Primary CTA if action required

2. **Recent Activity** (Middle viewport)
   - What's changed since they last visited
   - Timeline of updates, new documents, messages
   - Contextual secondary actions

3. **Historical Reference** (Below fold, searchable/filterable)
   - Past invoices, old agreements, archived messages
   - Only shown when client explicitly needs to look back

### Mobile Navigation Adaptation

- Sidebar collapses to hamburger menu (top-left)
- Header actions remain visible (notifications, messages, profile)
- Tapping sidebar icon reveals full navigation overlay
- Main content takes full width
- Bottom navigation NOT used (avoids competing mental models)

---

## 3. Page-Level Design Specifications

### 3.1 Overview (Landing Page)

**Purpose**: Answer "What do I need to know right now?" in 3 seconds.

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Welcome back, [Client Name]                    │
│ [Last visited: 2 days ago]                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🐾 Luna (Golden Retriever)                  │ │ ← Animal Status Card
│ │ Placement Status: In Training                │ │   (Primary focus)
│ │ Last Update: 3 days ago                     │ │
│ │                                              │ │
│ │ "Luna is progressing well in obedience      │ │
│ │  training. Next vet check scheduled for..." │ │
│ │                                              │ │
│ │ [View Full Updates] [Message About Luna]    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ⚠️  ACTION REQUIRED                             │ ← Next Actions Section
│ ┌─────────────────────────────────────────────┐ │
│ │ 💰 Deposit Payment Due                       │ │
│ │    $2,500 due in 7 days (Jan 19)            │ │
│ │    [Pay Now] [View Invoice]                 │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 📬 RECENT ACTIVITY                              │ ← Timeline Feed
│ ┌─────────────────────────────────────────────┐ │
│ │ • New message from Sarah (2 days ago)       │ │
│ │ • Training Certificate uploaded (4 days)    │ │
│ │ • Payment received - Thank you! (1 week)    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 📊 FINANCIAL SNAPSHOT                           │ ← Quick Summary
│    Total Paid: $8,500 of $15,000              │
│    Next Payment: $2,500 (Due Jan 19)          │
│    [View Financials →]                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Animal Status Card** (Hero)
   - Large photo of the animal (if available)
   - Current placement status with visual indicator
   - Most recent update from breeder (truncated to 2-3 lines)
   - Timestamp of last update
   - Two CTAs: "View Full Updates" and "Message About [Animal]"
   - Species-specific accent color (dog: blue, cat: purple, horse: brown)

2. **Action Required Section**
   - Only appears if there's something needing client action
   - Orange/red accent for urgency
   - Clear description of what's needed
   - Deadline if applicable
   - Direct CTAs to resolve

3. **Recent Activity Timeline**
   - Chronological feed of last 5-7 events
   - Icons for event type (message, document, payment, update)
   - Relative timestamps ("2 days ago")
   - Clickable to jump to relevant page

4. **Financial Snapshot**
   - Progress bar showing total paid vs. total due
   - Next payment date and amount
   - Link to full Financials page

**Behavior**:
- Auto-refreshes every 60 seconds when tab is active
- New unread items pulse briefly on load
- First-time visitors see onboarding overlay explaining portal structure

---

### 3.2 My Animals

**Purpose**: Comprehensive view of the client's animal(s) in the breeding program.

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ My Animals                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ [If multiple animals: Tabs or cards for each]  │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🐾 Luna                                      │ │ ← Animal Profile Header
│ │ Golden Retriever • Female • Born: Mar 2025  │ │
│ │ Microchip: 123456789012345                  │ │
│ │                                              │ │
│ │ [Large Photo Carousel - 3-5 recent photos]  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ PLACEMENT TIMELINE                              │ ← Key Milestone Tracker
│ ┌─────────────────────────────────────────────┐ │
│ │ ✅ Born (Mar 15, 2025)                       │ │
│ │ ✅ Deposit Paid (Mar 20, 2025)               │ │
│ │ 🔄 In Training (Current - 4 weeks)           │ │
│ │ ⏳ Ready for Pickup (Est. May 2025)          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ HEALTH & TRAINING UPDATES                       │ ← Update Feed
│ ┌─────────────────────────────────────────────┐ │
│ │ Jan 9, 2026 • Vet Check                     │ │
│ │ Luna received her second round of vaccines. │ │
│ │ All vitals normal. Next check in 3 weeks.   │ │
│ │ [📎 Vaccine Record.pdf]                      │ │
│ │                                              │ │
│ │ Jan 5, 2026 • Training Progress             │ │
│ │ Luna is excelling in basic obedience...     │ │
│ │ [📷 3 photos]                                │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ PEDIGREE & LINEAGE                              │ ← Expandable Section
│ [Collapsible tree view of parents/lineage]     │
│                                                 │
│ RELATED DOCUMENTS                               │ ← Quick Links
│ • Birth Certificate                             │
│ • Health Records (3 files)                     │
│ • Training Certifications (1 file)             │
│ [View All Documents →]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Animal Profile Header**
   - Name, species, breed, sex, birth date
   - Microchip ID (if applicable)
   - Photo carousel (swipeable, full-width)
   - "Message Breeder About Luna" CTA

2. **Placement Timeline**
   - Visual progress tracker showing milestones
   - Completed steps (green checkmark)
   - Current phase (blue indicator with duration)
   - Upcoming milestones (gray with estimated date)
   - Example milestones: Born, Deposit Paid, In Training, Vet Cleared, Ready for Pickup, Delivered

3. **Health & Training Update Feed**
   - Reverse chronological updates from breeder
   - Rich content: text, photos, attached documents
   - Filter by type: All, Health, Training, General
   - Each update card shows timestamp, title, content preview, attachments

4. **Pedigree Section** (Collapsible)
   - Visual tree showing parents, grandparents
   - Clickable nodes to see details
   - Only shown if data available

5. **Related Documents Quick Links**
   - Shortcuts to documents tagged to this animal
   - Count badges (e.g., "Health Records (3 files)")
   - Opens Documents page filtered to this animal

**Behavior**:
- Updates marked as "New" until client views them
- Photo carousel auto-advances every 5 seconds
- Timeline animates progress on first load
- If no updates in >14 days, show gentle prompt: "Haven't heard from your breeder lately? Send them a message."

---

### 3.3 Financials

**Purpose**: Complete transparency on payments, outstanding balances, and financial relationship.

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Financials                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ FINANCIAL SUMMARY                               │ ← Top Section
│ ┌─────────────────────────────────────────────┐ │
│ │ Total Program Cost: $15,000                 │ │
│ │ Amount Paid: $8,500                         │ │
│ │ Outstanding Balance: $6,500                 │ │
│ │                                              │ │
│ │ [Progress Bar: 57% paid]                    │ │
│ │                                              │ │
│ │ Next Payment: $2,500 due Jan 19, 2026       │ │
│ │ [Pay Now →]                                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ INVOICES                                        │ ← Invoice List
│ ┌─────────────────────────────────────────────┐ │
│ │ 🔴 #INV-1003 • Deposit Payment              │ │
│ │    $2,500 • Due Jan 19, 2026                │ │
│ │    [Pay Now] [View Details]                 │ │
│ ├─────────────────────────────────────────────┤ │
│ │ ✅ #INV-1002 • Training Fee                 │ │
│ │    $3,000 • Paid Jan 5, 2026                │ │
│ │    [View Receipt]                            │ │
│ ├─────────────────────────────────────────────┤ │
│ │ ✅ #INV-1001 • Initial Deposit              │ │
│ │    $5,500 • Paid Dec 20, 2025               │ │
│ │    [View Receipt]                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ PAYMENT HISTORY                                 │ ← Transaction Log
│ ┌─────────────────────────────────────────────┐ │
│ │ Jan 5, 2026 • Payment Received              │ │
│ │ $3,000 → Invoice #INV-1002                  │ │
│ │ [Visa ending in 4242]                       │ │
│ │                                              │ │
│ │ Dec 20, 2025 • Payment Received             │ │
│ │ $5,500 → Invoice #INV-1001                  │ │
│ │ [Visa ending in 4242]                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ PAYMENT METHODS                                 │ ← Saved Cards
│ • Visa ending in 4242 (Primary)                │
│ [Add New Payment Method]                        │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Financial Summary Card**
   - Large numbers showing total cost, paid, and balance
   - Visual progress bar (e.g., 57% paid)
   - Next payment highlighted with due date
   - Prominent "Pay Now" CTA if balance outstanding

2. **Invoice List**
   - Sorted by status (unpaid first, then recent paid)
   - Visual status indicators:
     - 🔴 Red dot + "Due [Date]" for unpaid
     - ✅ Green checkmark + "Paid [Date]" for paid
   - Invoice number, description, amount
   - Actions: "Pay Now" (unpaid) or "View Receipt" (paid)
   - Clicking invoice expands to show line items

3. **Payment History**
   - Chronological log of all payments
   - Shows date, amount, linked invoice, payment method
   - Each transaction links to invoice and receipt

4. **Payment Methods**
   - Saved credit cards with last 4 digits
   - Primary card indicator
   - "Add New Payment Method" CTA
   - Stripe-powered checkout

**Invoice Detail View** (Modal or Slide-In):
```
┌─────────────────────────────────────────────────┐
│ Invoice #INV-1003                         [✕]   │
├─────────────────────────────────────────────────┤
│ Status: Unpaid                                  │
│ Due Date: January 19, 2026                      │
│                                                 │
│ LINE ITEMS                                      │
│ • Deposit Payment ................... $2,500.00 │
│                                                 │
│ TOTAL: $2,500.00                                │
│                                                 │
│ [Download PDF] [Pay Now →]                      │
└─────────────────────────────────────────────────┘
```

**Behavior**:
- Overdue invoices show countdown: "Overdue by 3 days"
- Clicking "Pay Now" opens Stripe Checkout modal
- After payment, success animation + "Payment received" message
- Email receipt sent automatically
- Transaction appears in Payment History immediately

---

### 3.4 Documents

**Purpose**: Centralized access to all program-related documents with intuitive organization.

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Documents                           [Upload]    │
├─────────────────────────────────────────────────┤
│                                                 │
│ CATEGORIES                                      │ ← Filter/Group Tabs
│ [All] [Health Records] [Certificates]          │
│ [Contracts] [Photos] [Other]                   │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📄 Luna - Vaccine Record (2nd Round)        │ │
│ │ Health Records • Uploaded Jan 9, 2026       │ │
│ │ [View] [Download]                            │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 📄 Training Certificate - Basic Obedience   │ │
│ │ Certificates • Uploaded Jan 5, 2026         │ │
│ │ [View] [Download]                            │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 📄 Birth Certificate - Luna                 │ │
│ │ Certificates • Uploaded Dec 20, 2025        │ │
│ │ [View] [Download]                            │ │
│ ├─────────────────────────────────────────────┤ │
│ │ 📷 Luna Training Photos (5 photos)          │ │
│ │ Photos • Uploaded Jan 5, 2026               │ │
│ │ [View Gallery]                               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [No documents found in this category]           │ ← Empty State
│ Documents will appear here as they're uploaded. │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Category Filter**
   - Tabs or segmented control at top
   - Categories: All, Health Records, Certificates, Contracts, Photos, Other
   - Badge counts on each category (e.g., "Health Records (3)")
   - Default: "All" selected

2. **Document List**
   - Sorted by upload date (newest first)
   - Each row shows:
     - File icon (📄 for PDF, 📷 for images, 📎 for other)
     - Document title
     - Category + upload date
     - Actions: View (opens in new tab or modal), Download
   - Hover reveals file size and uploader name

3. **Upload Button** (Top-right)
   - Opens file picker
   - Supports drag-and-drop
   - Max file size: 10MB
   - Accepted formats: PDF, JPG, PNG, DOC, DOCX
   - After upload, shows success message and adds to list

4. **Photo Gallery View**
   - If document is a photo collection, clicking opens lightbox
   - Swipeable carousel with thumbnails
   - Download all as ZIP option

**Document Viewer** (Modal):
```
┌─────────────────────────────────────────────────┐
│ Luna - Vaccine Record (2nd Round)        [✕]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ [PDF or Image Viewer - Embedded]               │
│                                                 │
│ [Download] [Print]                              │
└─────────────────────────────────────────────────┘
```

**Behavior**:
- New documents pulse briefly with "New" badge
- Search bar filters by document name
- Clicking category tab scrolls to that section (if using single-page layout)
- Upload shows progress bar during upload
- Documents tagged to specific animal show animal name in title

---

### 3.5 Agreements

**Purpose**: Track active contracts, signature status, and legal documentation.

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│ Agreements                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ ACTIVE AGREEMENTS                               │ ← Requires Action
│ ┌─────────────────────────────────────────────┐ │
│ │ ⚠️  Co-Ownership Agreement                   │ │
│ │     Status: Awaiting Your Signature          │ │
│ │     Sent: Jan 10, 2026                       │ │
│ │     [Review & Sign →]                        │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ SIGNED AGREEMENTS                               │ ← Completed
│ ┌─────────────────────────────────────────────┐ │
│ │ ✅ Placement Agreement - Luna                │ │
│ │     Signed: Dec 20, 2025                     │ │
│ │     [View Document]                           │ │
│ ├─────────────────────────────────────────────┤ │
│ │ ✅ Initial Service Agreement                 │ │
│ │     Signed: Dec 15, 2025                     │ │
│ │     [View Document]                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Active Agreements Section**
   - Only shows agreements needing client action
   - Visual urgency indicator (⚠️ orange icon)
   - Status: "Awaiting Your Signature" or "In Review"
   - Sent date
   - Primary CTA: "Review & Sign"

2. **Signed Agreements Section**
   - Shows completed agreements
   - Green checkmark + "Signed [Date]"
   - "View Document" link opens PDF in new tab

3. **Agreement Review Flow** (Modal or Full-Page):
```
┌─────────────────────────────────────────────────┐
│ Co-Ownership Agreement                    [✕]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ [PDF Viewer - Full Agreement Text]             │
│                                                 │
│ ☐ I have read and agree to the terms above     │ ← Checkbox Required
│                                                 │
│ SIGNATURE                                       │
│ [Signature Pad or Type Name Field]             │
│                                                 │
│ [Cancel] [Sign Agreement →]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Behavior**:
- Unsigned agreements show at top with urgency styling
- After signing, success animation + moves to "Signed" section
- Email confirmation sent after signature
- Signed agreements downloadable as PDF with both signatures

---

### 3.6 Messages

**Purpose**: Direct communication channel with breeder, organized by conversation threads.

**Layout Structure** (Two-Column):
```
┌─────────────────────────────────────────────────┐
│ Messages                            [New]       │
├─────────────────────────────────────────────────┤
│ THREAD LIST         │  CONVERSATION             │
│                     │                           │
│ ┌─────────────────┐ │ ┌───────────────────────┐ │
│ │ 🔵 Sarah Miller  │ │ │ Sarah Miller          │ │
│ │ Re: Luna's      │ │ │                       │ │
│ │ training...     │ │ │ [Message Bubbles]     │ │
│ │ 2 days ago      │ │ │                       │ │
│ ├─────────────────┤ │ │                       │ │
│ │ Payment         │ │ │                       │ │
│ │ Confirmation    │ │ │                       │ │
│ │ 1 week ago      │ │ │                       │ │
│ ├─────────────────┤ │ │                       │ │
│ │ Initial Inquiry │ │ │                       │ │
│ │ 3 weeks ago     │ │ │                       │ │
│ └─────────────────┘ │ └───────────────────────┘ │
│                     │                           │
│                     │ [Type message...] [Send]  │
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Thread List** (Left Column - 300px)
   - Shows all message threads sorted by most recent
   - Each thread shows:
     - Participant name (breeder or admin)
     - Subject line or message preview (truncated)
     - Timestamp of last message
     - Unread indicator (blue dot) if new messages
   - Clicking thread opens conversation on right

2. **Conversation View** (Right Column - Remaining Width)
   - Header shows participant name
   - Message bubbles:
     - Breeder messages: Left-aligned, gray background
     - Client messages: Right-aligned, blue background
   - Timestamps on each message
   - Attachments shown as clickable cards below message
   - Read receipts: "Seen [timestamp]" below last message

3. **Message Composer** (Bottom of Conversation)
   - Text input field
   - "Attach File" button (📎 icon)
   - "Send" button (always visible, disabled if empty)
   - Supports Enter to send, Shift+Enter for new line

4. **New Message Button** (Top-right)
   - Opens modal to start new thread
   - Recipient: Auto-filled with breeder
   - Subject field
   - Message body
   - File attachment option

**Mobile Adaptation**:
- Thread list is full-width by default
- Tapping thread opens conversation (replaces thread list)
- Back button returns to thread list

**Behavior**:
- New messages appear instantly via WebSocket
- Typing indicator: "Sarah is typing..."
- Mark as read when thread is opened
- Notifications in header update unread count
- File uploads show progress bar

---

## 4. Visual Design Direction

### Color System

**Core Palette**:
- **Background**: `#08090a` (Near black, premium feel)
- **Elevated Surfaces**: `#0f1113` (Subtle lift for cards)
- **Borders**: `#1a1c1e` (Subtle separation)
- **Text Primary**: `#f8f9fa` (Near white, high contrast)
- **Text Secondary**: `#9ca3af` (Muted gray for metadata)
- **Text Tertiary**: `#6b7280` (Lighter gray for inactive states)

**Accent Colors** (Species-Aware):
- **Dog**: `hsl(220, 90%, 56%)` (Bright blue)
- **Cat**: `hsl(270, 75%, 60%)` (Purple)
- **Horse**: `hsl(30, 60%, 50%)` (Warm brown)
- **Default**: `hsl(220, 90%, 56%)` (Blue fallback)

**Semantic Colors**:
- **Success**: `#10b981` (Green - payments, completed actions)
- **Warning**: `hsl(25, 95%, 53%)` (Orange - action required, overdue)
- **Error**: `#ef4444` (Red - critical errors, failed payments)
- **Info**: `#3b82f6` (Blue - informational messages)

### Typography

**Font Family**:
- Primary: `Inter, -apple-system, system-ui, sans-serif`
- Monospace (for invoice numbers, IDs): `'Monaco', 'Courier New', monospace`

**Type Scale**:
- **Display**: 32px / 2rem, weight 600 (Page titles)
- **Heading 1**: 24px / 1.5rem, weight 600 (Section headers)
- **Heading 2**: 20px / 1.25rem, weight 600 (Card titles)
- **Body Large**: 16px / 1rem, weight 400 (Primary content)
- **Body**: 14px / 0.875rem, weight 400 (Default text)
- **Small**: 12px / 0.75rem, weight 400 (Metadata, timestamps)
- **Tiny**: 10px / 0.625rem, weight 500 (Badges, counts)

**Line Height**:
- Headings: 1.2
- Body: 1.5
- Small: 1.4

### Spacing System

**Base Unit**: 4px

**Scale**:
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-10`: 40px
- `--space-12`: 48px
- `--space-16`: 64px

**Application**:
- Card padding: `--space-6` (24px)
- Section gaps: `--space-8` (32px)
- Form field spacing: `--space-4` (16px)
- Icon-text gaps: `--space-2` (8px)

### Border Radius

- **Small**: 6px (Buttons, badges)
- **Medium**: 12px (Cards, modals)
- **Large**: 16px (Image containers)
- **Full**: 9999px (Pills, avatars)

### Elevation (Shadows)

**Level 1** (Cards):
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
```

**Level 2** (Modals, dropdowns):
```css
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
```

**Level 3** (Notifications, toasts):
```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
```

### Iconography

**Style**: Feather Icons (outline style, 2px stroke)
**Sizes**:
- Small: 16px (Inline with text)
- Medium: 20px (Buttons, nav items)
- Large: 24px (Hero sections)

**Color**: Inherits from parent text color

### Animation & Motion

**Timing Functions**:
- **Ease-out**: Entering elements (`cubic-bezier(0, 0, 0.2, 1)`)
- **Ease-in**: Exiting elements (`cubic-bezier(0.4, 0, 1, 1)`)
- **Ease-in-out**: Interactive elements (`cubic-bezier(0.4, 0, 0.2, 1)`)

**Durations**:
- **Fast**: 150ms (Hover states, button presses)
- **Normal**: 250ms (Page transitions, modal open/close)
- **Slow**: 400ms (Complex animations, toasts)

**Transitions**:
- All interactive elements have `transition: all 0.15s ease-out`
- Avoid animating layout properties (use transform/opacity)

**Microinteractions**:
- Buttons: Scale down to 0.98 on press
- Cards: Lift (translateY -2px) on hover
- New items: Pulse opacity 3 times on appear
- Success actions: Green checkmark animation (scale + fade in)

---

## 5. Interaction and State Design

### Button System

**Primary Button** (Main CTAs):
```css
background: var(--accent-color);
color: white;
padding: 12px 24px;
border-radius: 6px;
font-weight: 600;
transition: transform 0.15s;

:hover {
  transform: scale(1.02);
  opacity: 0.9;
}

:active {
  transform: scale(0.98);
}

:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Secondary Button** (Alternative actions):
```css
background: transparent;
color: var(--text-primary);
border: 1px solid var(--border);
padding: 12px 24px;
border-radius: 6px;
font-weight: 500;

:hover {
  background: var(--bg-elevated);
  border-color: var(--text-secondary);
}
```

**Ghost Button** (Tertiary actions):
```css
background: transparent;
color: var(--text-secondary);
padding: 8px 16px;
font-weight: 500;

:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}
```

### Form Fields

**Text Input**:
```css
background: var(--bg-elevated);
border: 1px solid var(--border);
border-radius: 6px;
padding: 12px 16px;
color: var(--text-primary);
font-size: 14px;

:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}

:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Labels**:
```css
font-size: 12px;
font-weight: 500;
color: var(--text-secondary);
margin-bottom: 6px;
text-transform: uppercase;
letter-spacing: 0.5px;
```

### Card Components

**Standard Card**:
```css
background: var(--bg-elevated);
border: 1px solid var(--border);
border-radius: 12px;
padding: 24px;
transition: transform 0.15s, box-shadow 0.15s;

:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
```

**Clickable Card** (Links to detail view):
```css
cursor: pointer;
/* Same as standard card with hover effect */
```

### Loading States

**Skeleton Screens**:
- Use animated gradient backgrounds for loading content
- Match shape/size of actual content
- Animate left-to-right shimmer effect

**Spinners**:
- Use only for actions (button clicks, form submissions)
- Small circular spinner replaces button text
- Color matches button style

**Progressive Loading**:
- Show critical content first (animal status, next actions)
- Load secondary content (history, documents) asynchronously
- Use skeleton placeholders for below-fold content

### Empty States

**No Data Available**:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│            [Icon - 48px, gray]                  │
│                                                 │
│       No [documents/messages/etc] yet           │
│                                                 │
│   [Description of what will appear here]        │
│                                                 │
│            [Optional CTA button]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Error State**:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [Icon - 48px, red]                      │
│                                                 │
│     Something went wrong                        │
│                                                 │
│   [Brief error message if safe to show]         │
│                                                 │
│         [Try Again] [Contact Support]           │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Notifications & Toasts

**Toast Notification** (Bottom-right):
```css
position: fixed;
bottom: 24px;
right: 24px;
background: var(--bg-elevated);
border: 1px solid var(--border);
border-radius: 12px;
padding: 16px 20px;
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
animation: slideInRight 0.25s ease-out;
```

**Types**:
- Success: Green left border, checkmark icon
- Error: Red left border, X icon
- Info: Blue left border, info icon

**Behavior**:
- Auto-dismiss after 5 seconds
- Hover pauses timer
- Click to dismiss immediately
- Stack multiple toasts vertically

### Badge Components

**Count Badge** (Notifications, unread):
```css
min-width: 20px;
height: 20px;
padding: 0 6px;
background: var(--accent-color);
border-radius: 10px;
font-size: 11px;
font-weight: 600;
color: white;
display: flex;
align-items: center;
justify-content: center;
```

**Status Badge** (Urgency indicators):
- **Action Required**: Orange background, white text
- **Overdue**: Red background, white text
- **Completed**: Green background, white text
- **In Progress**: Blue background, white text

### Modal Dialogs

**Standard Modal**:
```css
position: fixed;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
background: var(--bg-elevated);
border: 1px solid var(--border);
border-radius: 12px;
padding: 32px;
max-width: 600px;
width: 90%;
max-height: 90vh;
overflow-y: auto;
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
animation: scaleIn 0.25s ease-out;
```

**Backdrop**:
```css
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
background: rgba(0, 0, 0, 0.7);
backdrop-filter: blur(4px);
animation: fadeIn 0.25s ease-out;
```

**Behavior**:
- Click backdrop to close (unless critical action)
- ESC key closes modal
- Focus trap within modal
- Scroll locked on body when modal open

### Responsive Breakpoints

**Mobile**: `< 768px`
- Sidebar collapses to hamburger menu
- Two-column layouts become single column
- Card padding reduced to 16px
- Font sizes scale down by 1-2px

**Tablet**: `768px - 1024px`
- Sidebar remains visible but narrower (200px)
- Some two-column layouts remain
- Comfortable touch targets (44px minimum)

**Desktop**: `> 1024px`
- Full sidebar (240px)
- Two-column layouts where appropriate
- Hover states fully utilized

### Keyboard Navigation

**Tab Order**:
- Follows visual hierarchy top-to-bottom, left-to-right
- Skip link at top: "Skip to main content"
- Focus indicators highly visible (2px blue outline)

**Keyboard Shortcuts**:
- `Cmd/Ctrl + K`: Focus search/command palette
- `Esc`: Close modal, clear focus
- `Enter`: Activate focused button/link
- `/`: Focus message input (on Messages page)

---

## 6. Anti-Patterns and Explicit Do-Not-Dos

### ❌ DO NOT: Generic SaaS Dashboard Patterns

**Why**: This isn't a productivity tool or analytics dashboard. Clients aren't "power users" optimizing workflows—they're emotionally invested pet/animal owners checking on their investment.

**Specifically Avoid**:
- Filterable data tables with 10+ columns
- Configurable dashboard widgets
- "Settings" pages with dozens of toggles
- Export to CSV buttons (unless specifically needed)
- Keyboard shortcuts advertised in UI

**Instead**: Keep it simple, visual, and narrative-driven. Show photos, timelines, and clear next steps.

---

### ❌ DO NOT: Hide Critical Information Behind Clicks

**Why**: Premium experience means transparency by default. Don't make clients hunt for status updates or payment info.

**Specifically Avoid**:
- Collapsing sections that should always be visible (financial summary, animal status)
- "View More" links for critical content (health updates)
- Pagination on short lists (<20 items)
- Tooltips for essential information

**Instead**: Show everything relevant on first load. Use progressive disclosure only for truly secondary details.

---

### ❌ DO NOT: Use Overly Formal or Legalistic Language

**Why**: This is a personal relationship, not a corporate transaction. Tone should be warm, clear, and human.

**Specifically Avoid**:
- "Your account status is..." → Just say "You're all set!"
- "Payment remittance required by..." → "Payment due [date]"
- "View associated documentation" → "See documents"
- "Initiate communication thread" → "Send message"

**Instead**: Write like a friendly, professional human. Use contractions. Be conversational.

---

### ❌ DO NOT: Notification Overload

**Why**: Every notification dilutes the importance of others. Clients should trust that badges/alerts are genuinely urgent.

**Specifically Avoid**:
- Notifying about every message (they can see the unread count)
- Alerts for non-actionable updates ("Your profile was viewed")
- Promotional notifications ("Check out our new services!")
- Multiple channels for same alert (email + push + in-app)

**Instead**: Only notify for action-required items (unsigned agreement, overdue payment, critical health update).

---

### ❌ DO NOT: Desktop-First, Mobile-Second Thinking

**Why**: Clients check on their animals at all hours, often from their phones. Mobile isn't an afterthought.

**Specifically Avoid**:
- Horizontal scrolling tables on mobile
- Touch targets smaller than 44px
- Hover-only interactions (no mobile equivalent)
- Text smaller than 14px on mobile
- Desktop-optimized images (huge file sizes)

**Instead**: Design mobile-first, enhance for desktop. Test every interaction on real devices.

---

### ❌ DO NOT: Assume Clients Understand Breeding Industry Jargon

**Why**: Many clients are first-time buyers. Terms like "whelping", "dam/sire", "pedigree points" aren't universal.

**Specifically Avoid**:
- Unexplained acronyms (AKC, OFA, CERF)
- Industry-specific status labels without context
- Assuming knowledge of breeding timelines
- Technical veterinary terminology

**Instead**: Use plain language or provide brief tooltips explaining terms. "Dam (mother)" instead of just "Dam".

---

### ❌ DO NOT: Generic Stock Photos or Placeholder Icons

**Why**: This is about THEIR animal. Every opportunity to show their pet reinforces emotional connection.

**Specifically Avoid**:
- Placeholder animal silhouettes
- Generic breed photos when actual photos exist
- Icon-only cards where a photo would work
- Same header image across all clients

**Instead**: Use real photos of their animal wherever possible. If none available, use species-specific illustrations (not generic pets).

---

### ❌ DO NOT: Bury Customer Support or Breeder Contact

**Why**: When clients have questions, they want immediate access to help. Hidden contact = friction = frustration.

**Specifically Avoid**:
- "Contact Us" buried in footer
- Multi-step support forms
- "FAQ" as primary help option
- Email-only support

**Instead**: "Message Breeder" button on every page. Direct line to human support.

---

### ❌ DO NOT: Ignore Loading States or Errors

**Why**: Premium experience means handling edge cases gracefully. Clients shouldn't wonder "did that work?"

**Specifically Avoid**:
- Buttons with no loading state after click
- Silent failures (action doesn't work, no feedback)
- Generic "Error 500" messages
- Instant page transitions with no loading indicator

**Instead**: Always show feedback (loading spinner, success toast, clear error messages). Assume slow networks.

---

### ❌ DO NOT: Auto-Play or Unexpected Media

**Why**: Respect client's context—they might be in public, in a meeting, or on limited data.

**Specifically Avoid**:
- Auto-playing videos with sound
- Large images/videos loading without consent
- Background music or ambient sounds
- Animated GIFs that loop forever

**Instead**: Static images by default. Play button for videos. Opt-in for heavy media.

---

## 7. Engineer Handoff Notes

### Implementation Priorities

**Phase 1: Core Structure** (Week 1-2)
1. Implement new PortalLayout with persistent sidebar navigation
2. Build Overview (landing) page with action-required logic
3. Set up routing for all 6 primary pages
4. Implement demo mode toggle and data integration across all pages

**Phase 2: Critical Pages** (Week 3-4)
5. My Animals page with timeline and update feed
6. Financials page with Stripe Checkout integration
7. Messages page with WebSocket real-time updates

**Phase 3: Supporting Pages** (Week 5-6)
8. Documents page with upload/download
9. Agreements page with signature flow
10. Activity/Notifications system

**Phase 4: Polish** (Week 7-8)
11. Mobile responsive refinements
12. Loading states and error handling
13. Accessibility audit and fixes
14. Performance optimization

### Technical Decisions

**Component Library**: None. Continue using inline React styles.
- **Rationale**: Existing codebase uses this pattern, avoids external dependencies
- **Tradeoff**: More verbose code, but full control over styling

**State Management**: React Context + Hooks (no Redux)
- **Rationale**: Portal doesn't need complex global state beyond user/tenant context
- **Use Cases**: Tenant context, demo mode toggle, unread message count

**Routing**: Manual routing with `window.history.pushState` and `PopStateEvent`
- **Rationale**: Existing pattern in codebase, avoids React Router dependency
- **Implementation**: Continue existing approach in PortalLayout

**Real-Time Updates**: WebSocket for messages, polling for other data
- **Rationale**: Messages need instant delivery, other data can tolerate 30-60s delay
- **Implementation**: Existing WebSocket connection at `wss://api.breederhq.com/ws`

**API Structure**: RESTful endpoints under `/portal/*` and `/api/v1/messages/*`
- **Rationale**: Existing backend structure, don't require API changes
- **Authentication**: Cookie-based sessions with tenant-scoped endpoints

### Data Fetching Patterns

**Standard Pattern**:
```typescript
const [data, setData] = React.useState<T[]>([]);
const [loading, setLoading] = React.useState(true);
const [error, setError] = React.useState<string | null>(null);

React.useEffect(() => {
  let cancelled = false;

  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch('/portal/endpoint');
      if (!response.ok) throw new Error('Failed to fetch');
      const json = await response.json();
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    } catch (err) {
      if (!cancelled) {
        setError(err.message);
        setLoading(false);
      }
    }
  }

  fetchData();
  return () => { cancelled = true; };
}, []);
```

**Demo Mode Override**:
```typescript
// Inside useEffect, before fetch:
if (isDemoMode()) {
  const demoData = generateDemoData();
  if (!cancelled) {
    setData(demoData.relevantField);
    setLoading(false);
  }
  return;
}
// ... then actual fetch
```

### Key Components to Build

**1. Sidebar Navigation Component**
- Fixed position on desktop, collapsible on mobile
- Active route highlighting
- Badge counts on Messages and Activity

**2. ActionRequiredCard Component**
- Reusable for any urgent action (payment due, signature needed)
- Props: title, description, dueDate, ctaLabel, ctaOnClick
- Orange/red accent styling

**3. AnimalStatusCard Component**
- Hero card showing animal photo, status, recent update
- Props: animal object with photo, name, status, lastUpdate
- Species-aware accent color

**4. Timeline Component**
- Vertical timeline with milestone nodes
- States: completed (green), in-progress (blue), upcoming (gray)
- Props: milestones array with label, date, status

**5. InvoiceCard Component**
- Shows invoice number, amount, status, due date
- Actions: Pay Now (unpaid) or View Receipt (paid)
- Status-based styling (red for unpaid, green for paid)

**6. DocumentCard Component**
- Shows file icon, title, category, upload date
- Actions: View, Download
- Click opens in modal or new tab

**7. MessageThread Component**
- Two-column layout: thread list + conversation view
- WebSocket integration for real-time updates
- File attachment support

**8. Toast Notification System**
- Fixed position bottom-right
- Auto-dismiss after 5s
- Stack multiple toasts
- Types: success, error, info

### CSS Custom Properties (Design Tokens)

```css
:root {
  /* Colors */
  --portal-bg: #08090a;
  --portal-bg-elevated: #0f1113;
  --portal-border: #1a1c1e;
  --portal-border-subtle: rgba(255, 255, 255, 0.05);
  --portal-text-primary: #f8f9fa;
  --portal-text-secondary: #9ca3af;
  --portal-text-tertiary: #6b7280;
  --portal-accent: hsl(220, 90%, 56%); /* Dynamic per species */

  /* Semantic */
  --portal-success: #10b981;
  --portal-warning: hsl(25, 95%, 53%);
  --portal-error: #ef4444;
  --portal-info: #3b82f6;

  /* Spacing */
  --portal-space-1: 4px;
  --portal-space-2: 8px;
  --portal-space-3: 12px;
  --portal-space-4: 16px;
  --portal-space-6: 24px;
  --portal-space-8: 32px;

  /* Border Radius */
  --portal-radius-sm: 6px;
  --portal-radius-md: 12px;
  --portal-radius-lg: 16px;

  /* Typography */
  --portal-font-size-xs: 12px;
  --portal-font-size-sm: 14px;
  --portal-font-size-base: 16px;
  --portal-font-size-lg: 20px;
  --portal-font-size-xl: 24px;

  --portal-font-weight-normal: 400;
  --portal-font-weight-medium: 500;
  --portal-font-weight-semibold: 600;

  /* Transitions */
  --portal-transition: 0.15s ease-out;
}
```

### Accessibility Requirements

**Keyboard Navigation**:
- All interactive elements must be keyboard accessible
- Visible focus indicators (2px blue outline)
- Tab order follows visual hierarchy
- Modal focus trap when open

**Screen Reader Support**:
- Semantic HTML (nav, main, section, article)
- ARIA labels on icon-only buttons
- ARIA live regions for dynamic content (new messages, toasts)
- Alt text on all images

**Color Contrast**:
- Text on background: 4.5:1 minimum (WCAG AA)
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Touch Targets**:
- Minimum 44x44px on mobile
- Adequate spacing between tappable elements (8px minimum)

### Performance Considerations

**Code Splitting**:
- Lazy load pages: `const FinancialsPage = React.lazy(() => import('./pages/FinancialsPage'))`
- Use `<React.Suspense>` with loading fallback

**Image Optimization**:
- Serve WebP with JPG fallback
- Responsive images with srcset
- Lazy load images below fold
- Max width: 1200px (desktop), 800px (mobile)

**Bundle Size**:
- Target: <200KB initial JS bundle (gzipped)
- Avoid large dependencies (moment.js → date-fns, lodash → native methods)

**Caching Strategy**:
- API responses: Cache for 30-60s (stale-while-revalidate)
- Static assets: Long-term cache with versioned filenames
- Service worker for offline support (optional, Phase 4)

### Error Handling Standards

**API Errors**:
```typescript
try {
  const response = await fetch('/portal/endpoint');
  if (!response.ok) {
    // Handle specific status codes
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (response.status === 403) {
      setError('You do not have permission to view this.');
      return;
    }
    throw new Error('Something went wrong. Please try again.');
  }
  const data = await response.json();
  setData(data);
} catch (err) {
  setError(err.message);
  // Optionally log to error tracking service
}
```

**User-Facing Error Messages**:
- Be specific but not technical: "We couldn't load your invoices. Please refresh the page."
- Always provide next step: "Try again" button, "Contact support" link
- Avoid exposing stack traces or API details

**Network Errors**:
```typescript
catch (err) {
  if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
    setError('Connection lost. Check your internet and try again.');
  } else {
    setError('Something went wrong. Please try again.');
  }
}
```

### Testing Strategy

**Unit Tests** (Jest + React Testing Library):
- Test individual components in isolation
- Focus on user interactions (clicking buttons, filling forms)
- Mock API calls with MSW (Mock Service Worker)

**Integration Tests**:
- Test page-level components with real routing
- Test demo mode toggle across pages
- Test WebSocket message delivery

**Manual Testing Checklist**:
- [ ] All pages load demo data correctly when `?demo=true`
- [ ] All pages load real data when demo mode off
- [ ] Mobile responsive on iPhone and Android
- [ ] Keyboard navigation works on all pages
- [ ] Screen reader announces page changes
- [ ] Payment flow completes successfully (Stripe test mode)
- [ ] File upload/download works across file types
- [ ] Real-time messages appear without refresh

### Deployment Considerations

**Environment Variables**:
```bash
VITE_API_BASE_URL=https://api.breederhq.com
VITE_WS_URL=wss://api.breederhq.com/ws
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Build Process**:
```bash
npm run build
# Outputs to /dist
# Deploy to Vercel or Netlify
```

**Demo Mode**:
- Development: Always available
- Staging: Available via `?demo=true`
- Production: Hidden unless `?showDemo=true` (for demos/screenshots)

### Migration Path from Current Portal

**Phase 1: Parallel Development**
- Build new portal under `/portal-v2` route
- Keep existing portal at `/portal`
- Test with small group of clients

**Phase 2: Gradual Rollout**
- Feature flag to toggle between old/new portal per tenant
- Monitor usage, gather feedback
- Fix bugs and refine based on real usage

**Phase 3: Full Migration**
- Default all tenants to new portal
- Redirect `/portal` to `/portal-v2`
- Deprecate old portal code after 2 weeks

### Open Questions for Product Owner

1. **Payment Plans**: Do we need to support installment plans beyond single invoices?
2. **Multi-Animal Clients**: How should UI adapt for clients with 2+ animals in program?
3. **Breeder-Side Features**: Any breeder-specific views needed in this portal (or separate app)?
4. **File Uploads**: Should clients be able to upload documents, or only download breeder-provided files?
5. **Notification Preferences**: Should clients control notification channels (email vs. in-app)?

---

## Appendix: Backend Capabilities Reference

### Available API Endpoints

**Portal Data**:
- `GET /portal/agreements` — List all agreements for tenant
- `POST /portal/agreements/:id/sign` — Sign an agreement
- `GET /portal/documents` — List all documents for tenant
- `POST /portal/documents/upload` — Upload a new document
- `GET /portal/invoices` — List all invoices for tenant
- `POST /portal/invoices/:id/pay` — Initiate Stripe Checkout
- `GET /portal/profile` — Get client profile data
- `PATCH /portal/profile` — Update profile (triggers approval flow)
- `GET /portal/placements` — List animals/offspring in program

**Messages**:
- `GET /api/v1/messages/threads` — List all message threads
- `GET /api/v1/messages/threads/:id` — Get thread with messages
- `POST /api/v1/messages/threads` — Create new thread
- `POST /api/v1/messages/threads/:id/messages` — Send message in thread
- `POST /api/v1/messages/threads/:id/mark-read` — Mark thread as read
- `WebSocket: wss://api.breederhq.com/ws` — Real-time message delivery

### Data Entity Schemas

**Agreement**:
```typescript
{
  id: string;
  name: string;
  status: 'pending' | 'signed' | 'expired';
  effectiveDate: string; // ISO date
  role: string; // e.g., "Co-Owner", "Buyer"
  signedAt: string | null; // ISO datetime
  documentUrl: string | null;
}
```

**Document**:
```typescript
{
  id: string;
  name: string;
  category: 'health_records' | 'certificates' | 'contracts' | 'photos' | 'other';
  fileUrl: string;
  mimeType: string;
  uploadedAt: string; // ISO datetime
  uploadedBy: string; // Name of uploader
  fileSize: number; // bytes
  animalId: string | null; // If tagged to specific animal
}
```

**Placement (Animal)**:
```typescript
{
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'horse' | 'other';
  breed: string;
  sex: 'male' | 'female';
  birthDate: string; // ISO date
  microchipId: string | null;
  placementStatus: 'born' | 'deposit_paid' | 'in_training' | 'ready_for_pickup' | 'delivered';
  depositPaidAt: string | null;
  deliveredAt: string | null;
  photoUrls: string[]; // Array of image URLs
  pedigree: {
    sire: { name: string; id: string; } | null;
    dam: { name: string; id: string; } | null;
  } | null;
}
```

**Invoice**:
```typescript
{
  id: string;
  invoiceNumber: string; // e.g., "INV-1001"
  total: number; // cents
  status: 'unpaid' | 'paid' | 'overdue';
  dueDate: string; // ISO date
  paidAt: string | null; // ISO datetime
  lineItems: Array<{
    description: string;
    amount: number; // cents
  }>;
  stripeCheckoutUrl: string | null; // For unpaid invoices
}
```

**Message Thread**:
```typescript
{
  id: string;
  subject: string;
  participants: Array<{
    id: string;
    name: string;
    role: 'client' | 'breeder';
  }>;
  messages: Array<{
    id: string;
    senderId: string;
    content: string;
    sentAt: string; // ISO datetime
    readAt: string | null;
    attachments: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      mimeType: string;
    }>;
  }>;
  unreadCount: number; // For current user
  lastMessageAt: string; // ISO datetime
}
```

**Profile**:
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  pendingChanges: { /* same structure */ } | null; // If profile edit pending approval
}
```

---

**End of Specification**

This document represents the complete premium portal design vision. All technical decisions, component specifications, and interaction patterns are defined. Engineering can begin implementation immediately using the phased approach outlined in Section 7.

For questions or clarifications during implementation, refer back to the UX Strategy (Section 1) and Anti-Patterns (Section 6) to ensure decisions align with the premium, client-first philosophy.
