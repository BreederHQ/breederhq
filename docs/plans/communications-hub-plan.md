# Communications Hub Implementation Plan

## Executive Summary

Transform the Marketing module's messaging infrastructure into a centralized **Communications Hub** that aggregates all email and DM communications across all contacts, providing a powerful inbox-style management experience.

---

## Current State Analysis

### What Already Exists

#### Frontend (Marketing Module)
- **MessagesPage.tsx** - Full DM interface with:
  - Thread list with unread badges
  - Conversation view with message bubbles
  - New conversation creation
  - Contact actions (portal invite, block user, add to waitlist)
  - Read/unread tracking (marks read when thread opened)
  - `archived` field exists in data model but **no UI exposed**

#### Frontend (Contacts Module)
- **MessagesTab** - Per-contact DM view (subset of marketing MessagesPage)
- **ActivityTab** - Unified timeline showing `email_sent`, `email_received`, `message_sent`, `message_received`
- **EmailComposer** - Modal for composing emails with template picker
- **QuickDMComposer** - Quick DM modal from header

#### Backend (API)
- **MessageThread** schema with:
  - `archived` (Boolean) - EXISTS but unused in UI
  - `unreadCount` calculation
  - `lastMessageAt` for sorting
  - Response time tracking
- **EmailSendLog** - Email audit trail with:
  - `status` (queued, sent, failed)
  - Template references
  - Category (transactional, marketing)
- **No existing support for:**
  - Message flagging/starring
  - Message drafts
  - Per-message tags
  - Email aggregation into inbox view

---

## Proposed Architecture

### Communications Hub = Unified Inbox

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMUNICATIONS HUB (Marketing Module)                          │
├─────────────────────────────────────────────────────────────────┤
│  Tabs: [All] [Emails] [Messages] [Drafts] [Archived]            │
├─────────────────────────────────────────────────────────────────┤
│  Filters: □ Unread  □ Flagged  □ Has Attachment                 │
│  Search: [_______________________]  Sort: [Newest ▼]            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ☐ ★ John Smith                           Email    2h ago   ││
│  │      Re: Puppy inquiry - Thanks for reaching out...         ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ ☐ ★ Sarah Johnson                        DM       Yesterday││
│  │      Hi! I wanted to follow up on the waitlist...           ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ ☐   Mike Williams                        Email    3d ago   ││
│  │      [DRAFT] Contract for upcoming litter                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Archive] [Flag] [Delete] [Mark Read] [Mark Unread]            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Backend Schema Updates

#### 1.1 Add Flagging to MessageThread
```prisma
model MessageThread {
  // ... existing fields
  flagged     Boolean   @default(false)
  flaggedAt   DateTime?
}
```

#### 1.2 Add Flagging/Archive to EmailSendLog (for outbound emails)
```prisma
model EmailSendLog {
  // ... existing fields
  archived    Boolean   @default(false)
  archivedAt  DateTime?
  flagged     Boolean   @default(false)
  flaggedAt   DateTime?
  isRead      Boolean   @default(true)  // outbound always "read"
}
```

#### 1.3 Create PartyEmail Model (unified email view)
```prisma
model PartyEmail {
  id            Int       @id @default(autoincrement())
  tenantId      Int
  partyId       Int       // Contact this email is associated with
  direction     String    // "inbound" | "outbound"

  // Core fields
  subject       String
  bodyPreview   String?   // First ~200 chars
  bodyText      String?   @db.Text
  bodyHtml      String?   @db.Text
  fromAddress   String
  toAddresses   String[]

  // Status tracking
  status        String    @default("sent")  // queued, sent, delivered, opened, bounced, failed
  isRead        Boolean   @default(false)

  // Hub management
  archived      Boolean   @default(false)
  archivedAt    DateTime?
  flagged       Boolean   @default(false)
  flaggedAt     DateTime?

  // Timestamps
  sentAt        DateTime?
  openedAt      DateTime?
  createdAt     DateTime  @default(now())

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  party         Party     @relation(fields: [partyId], references: [id])

  @@index([tenantId])
  @@index([tenantId, partyId])
  @@index([tenantId, archived])
  @@index([tenantId, flagged])
  @@index([tenantId, isRead])
  @@index([tenantId, direction])
  @@index([createdAt])
}
```

#### 1.4 Create Draft Model
```prisma
model Draft {
  id            Int       @id @default(autoincrement())
  tenantId      Int
  partyId       Int?      // Optional - can be a draft without recipient yet
  channel       String    // "email" | "dm"

  // Email-specific
  subject       String?
  toAddresses   String[]

  // Content
  bodyText      String    @db.Text
  bodyHtml      String?   @db.Text

  // Metadata
  templateId    Int?
  metadata      Json?

  // Timestamps
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdByUserId Int?

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  party         Party?    @relation(fields: [partyId], references: [id])
  template      Template? @relation(fields: [templateId], references: [id])

  @@index([tenantId])
  @@index([tenantId, partyId])
  @@index([tenantId, channel])
  @@index([updatedAt])
}
```

---

### Phase 2: Backend API Endpoints

#### 2.1 Communications Hub Aggregation Endpoint
```
GET /api/v1/communications/inbox
```

**Query Parameters:**
- `channel` - "all" | "email" | "dm"
- `status` - "all" | "unread" | "flagged" | "archived" | "draft"
- `partyId` - Filter by specific contact
- `search` - Full-text search
- `sort` - "newest" | "oldest" | "unread_first"
- `limit` / `offset` - Pagination

**Response:**
```typescript
{
  items: CommunicationItem[],
  total: number,
  unreadCount: number,
  flaggedCount: number
}

interface CommunicationItem {
  id: string;              // "email:123" or "thread:456" or "draft:789"
  type: "email" | "dm" | "draft";
  partyId: number;
  partyName: string;
  subject?: string;
  preview: string;         // First ~100 chars
  isRead: boolean;
  flagged: boolean;
  archived: boolean;
  channel: "email" | "dm";
  direction?: "inbound" | "outbound";
  createdAt: string;
  updatedAt: string;
}
```

#### 2.2 Bulk Actions Endpoint
```
POST /api/v1/communications/bulk
```

**Request Body:**
```typescript
{
  ids: string[];           // ["email:123", "thread:456"]
  action: "archive" | "unarchive" | "flag" | "unflag" | "markRead" | "markUnread" | "delete"
}
```

#### 2.3 Draft CRUD Endpoints
```
GET    /api/v1/drafts
POST   /api/v1/drafts
GET    /api/v1/drafts/:id
PUT    /api/v1/drafts/:id
DELETE /api/v1/drafts/:id
POST   /api/v1/drafts/:id/send   // Convert draft to sent message/email
```

#### 2.4 Update Existing Endpoints

**MessageThread updates:**
- Add `PATCH /messages/threads/:id` for flag/archive
- Update list endpoint to support archive/flag filters

**EmailSendLog updates:**
- Add endpoints for flag/archive operations

---

### Phase 3: Frontend - Communications Hub Page

#### 3.1 New File Structure
```
apps/marketing/src/
├── pages/
│   ├── CommunicationsHubPage.tsx    # Main hub page
│   └── MessagesPage.tsx             # Keep for backward compat (redirect?)
├── components/
│   ├── communications/
│   │   ├── InboxList.tsx            # Message/email list
│   │   ├── InboxItem.tsx            # Single row item
│   │   ├── InboxFilters.tsx         # Filter bar
│   │   ├── InboxBulkActions.tsx     # Bulk action toolbar
│   │   ├── ConversationPane.tsx     # Right panel for viewing
│   │   ├── ComposePane.tsx          # Right panel for composing
│   │   └── DraftIndicator.tsx       # Draft auto-save indicator
```

#### 3.2 Key Features

**Inbox List:**
- Unified view of emails + DMs
- Checkbox selection for bulk actions
- Flag star toggle (inline)
- Unread indicator (bold text + dot)
- Channel icon (email vs DM)
- Contact name with link to contact drawer
- Preview text (truncated)
- Relative timestamp

**Filter Bar:**
- Channel tabs: All | Emails | Messages | Drafts | Archived
- Quick filters: Unread only, Flagged only
- Search box with debounce
- Sort dropdown

**Bulk Action Toolbar:**
- Appears when items selected
- Actions: Archive, Flag/Unflag, Mark Read/Unread, Delete
- Select all / Deselect all

**Conversation/Detail Pane:**
- Full conversation thread (for DMs)
- Full email view (for emails)
- Reply/compose inline
- Thread actions (archive, flag, delete)

**Draft Auto-Save:**
- Save draft after 2s of inactivity
- Show "Draft saved" indicator
- List drafts in Drafts tab

---

### Phase 4: Frontend - Contact View Integration

#### 4.1 Update Contacts Module
The per-contact view should show a filtered subset of the Communications Hub data.

**Changes to PartyDetailsView:**
- MessagesTab already exists - enhance with flag/archive
- Add "Emails" tab or integrate into MessagesTab
- Show draft count badge

**Changes to MessagesTab:**
- Add flag/archive actions per thread
- Show archived threads in separate section or filter
- Link to "View in Communications Hub" for full context

---

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Email Send    │────▶│  EmailSendLog   │────▶│                 │
│   (outbound)    │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     │                 │
                                                │  Communications │
┌─────────────────┐     ┌─────────────────┐     │      Hub        │
│  Email Receive  │────▶│   PartyEmail    │────▶│   Aggregation   │
│   (inbound)     │     │   (inbound)     │     │     Query       │
└─────────────────┘     └─────────────────┘     │                 │
                                                │                 │
┌─────────────────┐     ┌─────────────────┐     │                 │
│   DM Thread     │────▶│  MessageThread  │────▶│                 │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Unified UI    │
                                                │   Inbox View    │
                                                └─────────────────┘
```

---

## Migration Strategy

1. **Schema First:** Add new fields to existing models (non-breaking)
2. **API Layer:** Add new endpoints alongside existing ones
3. **Frontend:** Build new CommunicationsHubPage
4. **Integrate:** Update navigation to point to new hub
5. **Deprecate:** Eventually redirect MessagesPage to hub

---

## Questions to Resolve

1. **Inbound Emails:** How do we receive inbound emails?
   - Webhook from email provider?
   - Need to store in PartyEmail model

2. **Email Threading:** Should emails be grouped into threads like DMs?
   - By subject line (Re: prefix)?
   - By In-Reply-To header?

3. **Delete vs Archive:** Hard delete or soft delete?
   - Recommend: Archive by default, hard delete only for drafts

4. **Tags:** Should we support tags on messages/emails?
   - Could use existing Tag system (polymorphic)
   - Or simple string array field

5. **Notifications:** How should new messages trigger notifications?
   - In-app notification bell?
   - Email notification for inbound DMs?

---

## Estimated Effort

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Backend Schema Updates | Small |
| 2 | Backend API Endpoints | Medium |
| 3 | Frontend Communications Hub | Large |
| 4 | Contact View Integration | Medium |
| **Total** | | **Large feature** |

---

## Success Metrics

- All emails and DMs visible in one unified view
- Bulk operations work smoothly
- Flag/archive state persists correctly
- Search returns relevant results
- Per-contact filtering works
- Drafts save and restore correctly
- No performance regression on large message volumes

---

## Appendix: Existing Code References

### Frontend Files
- `apps/marketing/src/pages/MessagesPage.tsx` (1,254 lines)
- `apps/contacts/src/components/MessagesTab.tsx`
- `apps/contacts/src/components/ActivityTab.tsx`
- `apps/contacts/src/components/EmailComposer.tsx`

### Backend Files
- `breederhq-api/prisma/schema.prisma` (MessageThread, Message, EmailSendLog, Template)
- `breederhq-api/src/routes/messages.ts`
- `breederhq-api/src/routes/marketplace-messages.ts`
- `breederhq-api/src/routes/templates.ts`
- `breederhq-api/src/services/email-service.ts`

### API Types
- `packages/api/src/resources/messages.ts`
- `packages/api/src/resources/party-crm.ts`
