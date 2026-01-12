# Portal Redesign - Implementation Instructions

**Priority**: CRITICAL
**Status**: Phase 1 INCOMPLETE — Fix Profile, Add Demo Data, Then Continue
**Review Document**: [docs/portal/design-review-2026-01.md](./design-review-2026-01.md)

---

## Phase 1 Status: ✅ COMPLETE

### What Was Done:
- ✅ Removed scrollable TopNav
- ✅ Simplified Dashboard context strip
- ✅ Removed Financial page view toggle
- ✅ Header navigation simplified
- ✅ **Profile page** - Inline editing working for contact/address, request change for identity fields
- ✅ **Demo data system** - Fully integrated with toggle button in header

---

## Demo Mode

### How to Enable Demo Mode

**Option 1: Toggle Button (Automatic in Development)**
- In development mode, a "Demo" button appears in the header next to "Sign out"
- Click it to toggle demo mode on/off
- When active, button shows green "Demo ON" label

**Option 2: URL Parameter**
- Add `?demo=true` to any portal URL
- Example: `http://localhost:5180?demo=true`
- Remove parameter or click toggle button to disable

### What Demo Mode Provides

When demo mode is active, the portal displays:
- **1 Placement**: Luna (Golden Retriever, Reserved status)
- **5 Invoices**: 1 overdue ($500), 2 due ($1000, $1500), 2 paid ($150, $50)
- **3 Transactions**: 2 payments, 1 refund
- **2 Agreements**: 1 pending signature, 1 signed
- **4 Documents**: Health certificate, pedigree, vaccination record, care instructions
- **3 Message Threads**: 2 with unread messages
- **Financial Summary**: $3000 due, $500 overdue, next payment Jan 20

Demo data is injected at the page level (Dashboard, Financials) and doesn't require API calls.

---

## ~~CRITICAL: Fix Phase 1 Profile Issues FIRST~~ ✅ COMPLETE

### Profile Page - NOT IMPLEMENTED CORRECTLY

**Current State**: Profile page looks identical to before. No visible changes.

**Required Changes**:

#### 1. Name Fields - Request Change Feedback
**Current**: "Request Change" button does nothing visible
**Required**:
- Add tooltip on hover: "Name changes are reviewed by your breeder to maintain accurate records"
- On click: Show inline confirmation banner
```tsx
{showNameChangeConfirmation && (
  <div style={{
    padding: 'var(--portal-space-2)',
    background: 'var(--portal-success-soft)',
    border: '1px solid var(--portal-success)',
    borderRadius: 'var(--portal-radius-md)',
    marginTop: 'var(--portal-space-2)',
    fontSize: 'var(--portal-font-size-sm)',
    color: 'var(--portal-success)',
  }}>
    ✓ Request sent to {breederName}. They'll review your name change request.
  </div>
)}
```

#### 2. Contact Information - Direct Editing
**Current**: "Edit" button that does nothing
**Required**: Replace with inline editing
```tsx
const [isEditingContact, setIsEditingContact] = React.useState(false);
const [phone, setPhone] = React.useState(initialPhone);
const [whatsapp, setWhatsapp] = React.useState(initialWhatsapp);

{isEditingContact ? (
  <div>
    <input
      type="tel"
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      style={{...inputStyles}}
    />
    <input
      type="tel"
      value={whatsapp}
      onChange={(e) => setWhatsapp(e.target.value)}
      style={{...inputStyles}}
    />
    <button onClick={handleSaveContact}>Save</button>
    <button onClick={() => setIsEditingContact(false)}>Cancel</button>
  </div>
) : (
  <div>
    <div>{phone}</div>
    <div>{whatsapp}</div>
    <button onClick={() => setIsEditingContact(true)}>Edit</button>
  </div>
)}
```

#### 3. Address - Direct Editing
**Current**: "Edit" button that does nothing
**Required**: Same inline editing pattern as Contact Information

#### 4. Email - Help Text with Mailto
**Current**: Just shows email address
**Required**:
```tsx
<div>
  <div style={{ fontSize: 'var(--portal-font-size-sm)', color: 'var(--portal-text-secondary)' }}>
    Contact your breeder to change your email address
  </div>
  <a
    href={`mailto:${breederEmail}?subject=Email Change Request`}
    style={{ color: 'var(--portal-accent)', textDecoration: 'underline' }}
  >
    Email {breederName}
  </a>
</div>
```

**Status**: ✅ COMPLETE - Profile page has inline editing for contact/address, request change workflow for identity fields

---

## ~~CRITICAL: Add Demo Data System~~ ✅ COMPLETE

**Status**: Demo data system fully implemented and integrated.

### Demo Data Files Created

**Files Created**:
- ✅ `apps/portal/src/demo/portalDemoData.ts` - Data generator with all demo entities
- ✅ `apps/portal/src/demo/DemoDataContext.tsx` - React context for demo state (optional, not currently used)

**Integration Points**:
- ✅ `apps/portal/src/components/PortalLayout.tsx` - Demo toggle button in header
- ✅ `apps/portal/src/pages/PortalDashboardPage.tsx` - Demo data injection
- ✅ `apps/portal/src/pages/PortalFinancialsPage.tsx` - Demo data injection

**What To Generate**:

```tsx
export interface DemoDataConfig {
  includeMessages: boolean;
  includeInvoices: boolean;
  includeAgreements: boolean;
  includeDocuments: boolean;
  includeOffspring: boolean;
  includeTasks: boolean;
  includeNotifications: boolean;
}

export function generateDemoData(config: DemoDataConfig = { /* all true */ }) {
  return {
    placements: generateDemoPlacement(),
    invoices: config.includeInvoices ? generateDemoInvoices() : [],
    agreements: config.includeAgreements ? generateDemoAgreements() : [],
    documents: config.includeDocuments ? generateDemoDocuments() : [],
    threads: config.includeMessages ? generateDemoThreads() : [],
    transactions: config.includeInvoices ? generateDemoTransactions() : [],
  };
}
```

### Demo Data Specifications

#### 1. Demo Placement
```tsx
function generateDemoPlacement() {
  return {
    id: 1,
    offspring: {
      name: 'Luna',
      species: 'dog',
      breed: 'Golden Retriever',
    },
    placementStatus: 'reserved',
    species: 'dog',
    breed: 'Golden Retriever',
    paidInFullAt: null,
    pickupAt: null,
  };
}
```

#### 2. Demo Invoices (5 total)
```tsx
function generateDemoInvoices(): Invoice[] {
  return [
    // 1 overdue invoice
    {
      id: 1,
      invoiceNumber: 'INV-001',
      description: 'Initial Deposit - Luna',
      total: 500,
      amountPaid: 0,
      amountDue: 500,
      status: 'overdue',
      issuedAt: '2025-12-01',
      dueAt: '2025-12-15',
      relatedOffspringName: 'Luna',
      lineItems: [
        { description: 'Deposit', quantity: 1, unitPrice: 500, total: 500 }
      ],
    },
    // 2 due invoices
    {
      id: 2,
      invoiceNumber: 'INV-002',
      description: 'Second Payment - Luna',
      total: 1000,
      amountPaid: 0,
      amountDue: 1000,
      status: 'due',
      issuedAt: '2026-01-01',
      dueAt: '2026-01-20',
      relatedOffspringName: 'Luna',
      lineItems: [
        { description: 'Payment 2 of 3', quantity: 1, unitPrice: 1000, total: 1000 }
      ],
    },
    {
      id: 3,
      invoiceNumber: 'INV-003',
      description: 'Final Payment - Luna',
      total: 1500,
      amountPaid: 0,
      amountDue: 1500,
      status: 'due',
      issuedAt: '2026-01-05',
      dueAt: '2026-02-01',
      relatedOffspringName: 'Luna',
      lineItems: [
        { description: 'Final Payment', quantity: 1, unitPrice: 1500, total: 1500 }
      ],
    },
    // 2 paid invoices
    {
      id: 4,
      invoiceNumber: 'INV-004',
      description: 'Veterinary Exam - Luna',
      total: 150,
      amountPaid: 150,
      amountDue: 0,
      status: 'paid',
      issuedAt: '2025-11-15',
      dueAt: '2025-11-30',
      paidAt: '2025-11-28',
      relatedOffspringName: 'Luna',
      lineItems: [
        { description: 'Vet exam and health certificate', quantity: 1, unitPrice: 150, total: 150 }
      ],
    },
    {
      id: 5,
      invoiceNumber: 'INV-005',
      description: 'Microchip Registration',
      total: 50,
      amountPaid: 50,
      amountDue: 0,
      status: 'paid',
      issuedAt: '2025-11-20',
      dueAt: '2025-12-05',
      paidAt: '2025-12-03',
      lineItems: [
        { description: 'Microchip and registration', quantity: 1, unitPrice: 50, total: 50 }
      ],
    },
  ];
}
```

#### 3. Demo Transactions (3 total)
```tsx
function generateDemoTransactions(): Transaction[] {
  return [
    {
      id: 1,
      date: '2025-11-28',
      description: 'Payment for INV-004 (Veterinary Exam)',
      amount: 150,
      type: 'payment',
      status: 'completed',
      paymentMethod: 'card',
      invoiceNumber: 'INV-004',
    },
    {
      id: 2,
      date: '2025-12-03',
      description: 'Payment for INV-005 (Microchip Registration)',
      amount: 50,
      type: 'payment',
      status: 'completed',
      paymentMethod: 'card',
      invoiceNumber: 'INV-005',
    },
    {
      id: 3,
      date: '2025-10-15',
      description: 'Initial consultation refund',
      amount: 25,
      type: 'refund',
      status: 'completed',
      paymentMethod: 'card',
    },
  ];
}
```

#### 4. Demo Agreements (2 total)
```tsx
function generateDemoAgreements() {
  return [
    // 1 pending signature
    {
      id: 1,
      title: 'Puppy Purchase Agreement',
      description: 'Standard purchase agreement for Luna',
      status: 'sent',
      sentAt: '2025-12-10',
    },
    // 1 signed
    {
      id: 2,
      title: 'Health Guarantee',
      description: 'Two-year health guarantee',
      status: 'signed',
      sentAt: '2025-11-20',
      signedAt: '2025-11-22',
    },
  ];
}
```

#### 5. Demo Documents (4 total)
```tsx
function generateDemoDocuments() {
  return [
    {
      id: 1,
      name: 'Luna - Health Certificate.pdf',
      type: 'pdf',
      size: 245000,
      uploadedAt: '2025-11-28',
      category: 'health',
    },
    {
      id: 2,
      name: 'Luna - Pedigree.pdf',
      type: 'pdf',
      size: 180000,
      uploadedAt: '2025-11-25',
      category: 'pedigree',
    },
    {
      id: 3,
      name: 'Luna - Vaccination Record.pdf',
      type: 'pdf',
      size: 120000,
      uploadedAt: '2025-12-01',
      category: 'health',
    },
    {
      id: 4,
      name: 'Care Instructions.pdf',
      type: 'pdf',
      size: 95000,
      uploadedAt: '2025-11-15',
      category: 'general',
    },
  ];
}
```

#### 6. Demo Message Threads (3 total)
```tsx
function generateDemoThreads() {
  return [
    {
      id: 1,
      subject: 'Pickup arrangements',
      participants: ['You', 'Breeder'],
      lastMessageAt: '2026-01-10T14:30:00Z',
      lastMessagePreview: 'I can meet you at 2pm on Saturday. Does that work?',
      unreadCount: 2,
      messages: [
        {
          id: 1,
          senderId: 'breeder',
          senderName: 'Breeder',
          content: 'Hi! Luna is ready for pickup. When would work for you?',
          sentAt: '2026-01-09T10:00:00Z',
          read: true,
        },
        {
          id: 2,
          senderId: 'you',
          senderName: 'You',
          content: 'How about this Saturday around 2pm?',
          sentAt: '2026-01-09T14:00:00Z',
          read: true,
        },
        {
          id: 3,
          senderId: 'breeder',
          senderName: 'Breeder',
          content: 'I can meet you at 2pm on Saturday. Does that work?',
          sentAt: '2026-01-10T14:30:00Z',
          read: false,
        },
      ],
    },
    {
      id: 2,
      subject: 'Payment question',
      participants: ['You', 'Breeder'],
      lastMessageAt: '2026-01-08T16:00:00Z',
      lastMessagePreview: 'No problem! Let me know when you\'re ready.',
      unreadCount: 0,
      messages: [
        {
          id: 4,
          senderId: 'you',
          senderName: 'You',
          content: 'Can I split the final payment into two installments?',
          sentAt: '2026-01-08T12:00:00Z',
          read: true,
        },
        {
          id: 5,
          senderId: 'breeder',
          senderName: 'Breeder',
          content: 'No problem! Let me know when you\'re ready.',
          sentAt: '2026-01-08T16:00:00Z',
          read: true,
        },
      ],
    },
    {
      id: 3,
      subject: 'Welcome!',
      participants: ['You', 'Breeder'],
      lastMessageAt: '2025-11-15T09:00:00Z',
      lastMessagePreview: 'Welcome to your client portal! Feel free to reach out with any questions.',
      unreadCount: 0,
      messages: [
        {
          id: 6,
          senderId: 'breeder',
          senderName: 'Breeder',
          content: 'Welcome to your client portal! Feel free to reach out with any questions.',
          sentAt: '2025-11-15T09:00:00Z',
          read: true,
        },
      ],
    },
  ];
}
```

### Demo Mode Toggle

**Add to App**: `apps/portal/src/App-Portal.tsx`

```tsx
// Add demo mode detection
const isDemoMode = window.location.search.includes('demo=true');

// Wrap data fetching with demo data fallback
if (isDemoMode) {
  // Use demo data instead of API
  const demoData = generateDemoData();
  // Inject into context or state
}
```

**OR Create Demo Button in Header** (Dev mode only):
```tsx
{process.env.NODE_ENV === 'development' && (
  <button onClick={() => {
    window.location.href = window.location.pathname + '?demo=true';
  }}>
    Load Demo Data
  </button>
)}
```

**Access Demo Mode**: Navigate to `http://localhost:3000?demo=true`

---

## Phase 2: High-Priority Improvements

### 1. Create Complete Activity Page

**Current**: Navigation exists but page doesn't merge tasks/notifications properly

**File**: `apps/portal/src/pages/PortalActivityPage.tsx` — CREATE OR FIX

**Requirements**:
- Merge tasks from `usePortalTasks()` and notifications from `usePortalNotifications()`
- Deduplicate by ID
- Group into: Overdue (red) → Action Required (orange) → Updates (neutral) → Completed (collapsed)
- Use same card layout as existing TasksPage

**Data Structure**:
```tsx
interface ActivityItem {
  id: string;
  type: 'invoice' | 'agreement' | 'offspring' | 'message' | 'document';
  urgency: 'overdue' | 'action_required' | 'update' | 'completed';
  title: string;
  subtitle: string;
  statusLabel: string;
  statusVariant: 'error' | 'action' | 'neutral' | 'success';
  href: string;
  timestamp?: string;
}

function mergeAndDeduplicateActivities(tasks: TaskCard[], notifications: Notification[]): ActivityItem[] {
  const activityMap = new Map<string, ActivityItem>();

  // Add all tasks
  tasks.forEach(task => {
    activityMap.set(task.id, {
      id: task.id,
      type: task.type,
      urgency: task.status === 'overdue' ? 'overdue' : task.urgency,
      title: task.title,
      subtitle: task.subtitle,
      statusLabel: task.status === 'overdue' ? 'Overdue' : 'Action Required',
      statusVariant: task.status === 'overdue' ? 'error' : 'action',
      href: task.href,
    });
  });

  // Add notifications that aren't duplicates
  notifications.forEach(notif => {
    if (!activityMap.has(notif.id)) {
      activityMap.set(notif.id, {
        id: notif.id,
        type: notif.type,
        urgency: 'update',
        title: notif.title,
        subtitle: notif.message,
        statusLabel: 'New',
        statusVariant: 'neutral',
        href: notif.href || '#',
        timestamp: notif.createdAt,
      });
    }
  });

  return Array.from(activityMap.values());
}
```

**Spec Reference**: Review doc line ~730

---

### 2. Replace Emoji Icons with SVG Components

**Files to Create**:
- `apps/portal/src/icons/InvoiceIcon.tsx`
- `apps/portal/src/icons/AgreementIcon.tsx`
- `apps/portal/src/icons/AppointmentIcon.tsx`
- `apps/portal/src/icons/DocumentIcon.tsx`
- `apps/portal/src/icons/DogIcon.tsx`
- `apps/portal/src/icons/CatIcon.tsx`
- `apps/portal/src/icons/HorseIcon.tsx`
- `apps/portal/src/icons/RabbitIcon.tsx`
- `apps/portal/src/icons/SheepIcon.tsx`

**Icon Specs**: 24x24px, 2px stroke, round linecap/linejoin, currentColor

**Example**:
```tsx
export function InvoiceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
```

**Files to Update**:
- Find all `💳 📝 📅 🐕 📄` emojis and replace with SVG components
- Check: TasksPage, ActivityPage, FinancialsPage

**Spec Reference**: Review doc line ~640, ~1150

---

### 3. Update Empty State Copy

**Files**:
- `apps/portal/src/pages/PortalActivityPage.tsx`
- `apps/portal/src/pages/PortalFinancialsPage.tsx`
- `apps/portal/src/pages/PortalDocumentsPageNew.tsx`
- `apps/portal/src/pages/PortalAgreementsPageNew.tsx`

**Changes**:
```tsx
// Activity: "You're all caught up!" → "No action needed right now. We'll notify you when something requires your attention."
// Financials: "No invoices yet" → "Your breeder will send invoices as your journey progresses."
// Documents: "No documents yet" → "Your breeder will share documents here when available."
// Agreements: "No agreements yet" → "Agreements from your breeder will appear here when they're ready."
```

**Spec Reference**: Review doc line ~630, ~920

---

### 4. Create Account Hub

**File**: `apps/portal/src/pages/PortalAccountPage.tsx` — CREATE

**Tab Navigation**:
```tsx
type AccountTab = 'financials' | 'documents' | 'agreements' | 'profile' | 'offspring';

// URL: /account/financials, /account/profile, etc.
// Each tab embeds existing page content without hero
```

**Routing Updates**:
- `/account` → PortalAccountPage (default: financials)
- `/profile` → `/account/profile` (redirect)
- `/documents` → `/account/documents` (redirect)
- `/agreements` → `/account/agreements` (redirect)
- `/financials` → `/account/financials` (redirect)
- `/offspring` → `/account/offspring` (redirect)

**Dashboard Quick Links**: Update to point to `/account/:tab`

**Spec Reference**: Review doc line ~800

---

### 5. Remove Status Badge Pulsing/Glowing

**Find and Remove**:
```css
box-shadow: 0 0 6px var(--portal-error); /* REMOVE */
animation: pulse 2s infinite; /* REMOVE */
```

**Files**: Search codebase for "box-shadow.*glow" and "animation.*pulse"

**Spec Reference**: Review doc line ~920

---

## Phase 3: Optimizations

### 1. React Query Data Caching
### 2. Add Memoization
### 3. Reduce Session Polling (30s → 2min)
### 4. List Virtualization (if >50 items)

See full Phase 3 specs in review doc line ~1070+

---

## Complete Checklist

### Phase 1 ✅ COMPLETE
- [x] **Profile page inline editing for contact/address**
- [x] **Profile page name change confirmation feedback**
- [x] **Profile page email mailto link**
- [x] **Demo data system created and working**
- [x] **Demo toggle button in header**
- [x] **Demo data integrated into Dashboard**
- [x] **Demo data integrated into Financials**

### Phase 2
- [ ] Complete Activity page with merged data
- [ ] Replace all emoji icons with SVGs
- [ ] Update all empty state copy
- [ ] Create Account Hub with tabs
- [ ] Remove status badge animations

### Phase 3
- [ ] Install React Query
- [ ] Add memoization
- [ ] Reduce session polling
- [ ] Add virtualization for long lists

---

## Testing with Demo Data

After implementing demo data system:

1. Load portal with `?demo=true`
2. Verify all pages show populated data:
   - [ ] Dashboard shows Luna placement card
   - [ ] Activity shows overdue/action required items
   - [ ] Financials shows 1 overdue, 2 due, 2 paid invoices
   - [ ] Documents shows 4 files
   - [ ] Agreements shows 1 pending, 1 signed
   - [ ] Messages shows 3 threads, 2 unread
   - [ ] Header badges show correct counts
3. Navigate through all flows
4. Verify visual design matches specs

---

**Fix Profile page and add demo data first. Then continue to Phase 2 & 3.**
