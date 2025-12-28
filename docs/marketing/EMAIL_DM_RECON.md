# Marketing Module MVP: Email & DM Recon Report

**Date**: 2025-12-28
**Branch**: dev
**Scope**: Outbound Email (Resend) and Direct Messaging (DM) foundations

---

## 1. What Exists Today

### A. Schema (breederhq-api/prisma/schema.prisma)
- **Campaign** model exists (lines 2356-2393)
  - Tracks marketing campaigns: channel, budget, UTM params, offspring group linkage
  - Enum `CampaignChannel` includes: email, social, ads, marketplace, website, other
  - Currently **no usage in codebase**

- **PartyCommPreference** model exists (lines 676-691)
  - Tracks per-party, per-channel comm preferences and compliance status
  - Enum `CommChannel`: EMAIL, SMS, PHONE, MAIL, WHATSAPP
  - Enum `PreferenceLevel`: ALLOW, NOT_PREFERRED, NEVER
  - Enum `ComplianceStatus`: SUBSCRIBED, UNSUBSCRIBED
  - **Active usage**: comm-prefs-service.ts enforces these

- **PartyCommPreferenceEvent** audit log exists (lines 693-709)
  - Tracks changes to preferences over time

- **NO** models for:
  - EmailSendLog
  - Message/MessageThread/MessageParticipant
  - Email templates
  - Notification queue

### B. Environment/Config
- **breederhq-api/.env**: No RESEND_API_KEY or email vars present
- **breederhq/.env**: Only API URLs (VITE_API_BASE_URL, etc.)
- **No Resend configuration** found anywhere

### C. API Routes (breederhq-api/src/routes)
- **invoices.ts**: Contains references to "send invoice email" in comments but **no implementation**
  - Line 4: imports finance services, no email service
  - Search for "invoice email" returns this file but no actual send logic
- **parties.ts, contacts.ts, organizations.ts**: Use comm-prefs-service.ts but only for validation
- **NO routes** for:
  - /marketing/email/*
  - /marketing/messages/*
  - /comms/*
  - Email send endpoint

### D. Services (breederhq-api/src/services)
- **comm-prefs-service.ts**: Validates party comm preferences
  - Enforces NEVER preference blocking
  - No email sending logic, only validation
- **finance/invoice-numbering.js**: Server-side invoice numbering (Sequence model)
- **finance/idempotency.js**: Idempotency key validation
- **NO email service** found

### E. Frontend (breederhq)
- **apps/marketing/src/App-Marketing.tsx**: Placeholder "Coming Soon" UI
  - Shows roadmap with "Email and SMS" in Phase 2 (line 279)
  - No functional pages, just marketing copy
- **apps/finance**: Invoice and expense UIs exist, no email dispatch UI
- **apps/contacts**: Party management, no messaging UI
- **NO UI** for:
  - Email compose/send
  - Message threads/DM inbox

---

## 2. What is Deployed vs Dead Code

### Deployed (in use)
- **Campaign model**: Schema present, **not used** (zero references in routes)
- **PartyCommPreference**: **Active**, enforced by comm-prefs-service.ts
- **Finance module**: Invoices, payments, expenses fully functional
- **Marketing app**: Deployed as placeholder UI only

### Dead/Unused
- Campaign model (exists but no writes/reads)
- Phase 2 roadmap items (email/SMS) are **not implemented**

---

## 3. Gaps and Risks

### Critical Gaps
1. **No email infrastructure**:
   - No Resend integration
   - No EmailSendLog model for audit
   - No email templates or service layer
   - No env vars for RESEND_API_KEY

2. **No DM infrastructure**:
   - No Message/Thread/Participant models
   - No API routes for messaging
   - No UI for inbox/threads/compose

3. **Finance invoice email**:
   - Schema has Invoice model with `issuedAt`, `paidAt`, `status`
   - Frontend can mark invoice as "issued" but **no email dispatch**
   - Risk: Users expect email on "Send Invoice" action

4. **Tenant scoping**:
   - All models are tenant-scoped ✅
   - New email/DM models must follow this pattern

5. **Compliance**:
   - PartyCommPreference exists but **not enforced** for email sends (no sends yet)
   - Must validate EMAIL preference before dispatch

### Duplication Risks
- Campaign model exists but overlaps with planned email tracking
- Should consolidate: Campaign can link to EmailSendLog for email campaigns

---

## 4. Recommended Path

### Option A: Greenfield Implementation (CHOSEN)
Since **zero email/DM code exists**, implement cleanly from scratch:
- Single shared email service wrapping Resend
- Single EmailSendLog model for all outbound email audit
- Single DM schema (MessageThread, MessageParticipant, Message)
- Party-scoped, tenant-scoped, immutable message log

### Option B: Defer DM, Email Only
- Implement email first, DM later
- **Rejected**: Task requires both

---

## 5. Implementation Checklist

### Phase 2A: Email Foundations (Resend)

#### Schema Changes (breederhq-api/prisma/schema.prisma)
- [ ] Add EmailSendLog model:
  - id (Int @id @default(autoincrement()))
  - tenantId (Int, indexed)
  - to (String, email recipient)
  - from (String, sender)
  - subject (String)
  - templateKey (String?, e.g., "invoice_issued")
  - provider (String, default "resend")
  - providerMessageId (String?)
  - status (Enum: queued, sent, failed)
  - error (Json?)
  - metadata (Json?, for invoiceId, etc.)
  - createdAt (DateTime)

#### Environment (breederhq-api/.env)
- [ ] RESEND_API_KEY=<API key>
- [ ] RESEND_FROM_EMAIL=noreply@breederhq.com (or tenant subdomain)
- [ ] RESEND_FROM_NAME=BreederHQ

#### Service Layer (breederhq-api/src/services/email-service.ts)
- [ ] Install: npm install resend
- [ ] Wrap Resend client
- [ ] sendEmail({ tenantId, to, subject, html, text?, templateKey?, metadata? })
  - Validate PartyCommPreference (EMAIL channel)
  - If NEVER, reject with error
  - Call Resend API
  - Log to EmailSendLog
  - Return { providerMessageId }

#### API Route (breederhq-api/src/routes/marketing.ts or /email.ts)
- [ ] POST /api/v1/marketing/email/send
  - Tenant auth required
  - Body: { to, subject, html?, text?, templateKey?, metadata? }
  - Call email-service.sendEmail
  - Return { ok: true, messageId }

#### Templates (breederhq-api/src/services/email-templates.ts)
- [ ] Simple string template or handlebars
- [ ] Invoice template:
  - Input: { invoiceNumber, amountCents, dueAt, clientName, tenantName }
  - Output: HTML + text versions

#### Finance Integration (breederhq-api/src/routes/invoices.ts)
- [ ] On invoice "issue" action (status -> issued), dispatch email
- [ ] Call email-service with "invoice_issued" template
- [ ] Link emailId to Invoice.notes or Invoice.data.emailLogId

#### Frontend SDK (packages/api/src/resources/marketing.ts)
- [ ] Add makeMarketing(http) resource
- [ ] email.send({ to, subject, html, text, templateKey, metadata })

#### Frontend UI (apps/finance)
- [ ] Invoice detail page: "Send Invoice" button
- [ ] On click, call api.marketing.email.send with invoice template
- [ ] Show toast: "Invoice email sent to {client}"

---

### Phase 2B: DM Foundations

#### Schema Changes (breederhq-api/prisma/schema.prisma)
- [ ] Add MessageThread model:
  - id (Int @id @default(autoincrement()))
  - tenantId (Int, indexed)
  - subject (String?)
  - archived (Boolean @default(false))
  - createdAt, updatedAt

- [ ] Add MessageParticipant model:
  - id (Int @id @default(autoincrement()))
  - threadId (Int)
  - partyId (Int, indexed)
  - role (Enum: sender, recipient, cc, bcc? - or just owner/participant)
  - unreadCount (Int @default(0))
  - @@unique([threadId, partyId])

- [ ] Add Message model:
  - id (Int @id @default(autoincrement()))
  - threadId (Int, indexed)
  - senderPartyId (Int)
  - body (String @db.Text)
  - createdAt (DateTime)
  - **Immutable**: no updatedAt, no edits

#### API Routes (breederhq-api/src/routes/messages.ts)
- [ ] POST /api/v1/messages/threads
  - Body: { recipientPartyId, subject?, initialMessage }
  - Create thread + 2 participants + first message
  - Return { threadId, ... }

- [ ] GET /api/v1/messages/threads
  - List threads where user's party is participant
  - Order by last message desc
  - Return: [{ threadId, subject, lastMessage, unreadCount, participants }]

- [ ] GET /api/v1/messages/threads/:id
  - Enforce: current user must be participant
  - Return thread + messages + participants

- [ ] POST /api/v1/messages/threads/:id/messages
  - Body: { body }
  - Create message, update thread.updatedAt, increment unreadCount for others
  - Return { messageId, ... }

#### Frontend SDK (packages/api/src/resources/messages.ts)
- [ ] Add makeMessages(http)
- [ ] threads.list()
- [ ] threads.get(id)
- [ ] threads.create({ recipientPartyId, subject, initialMessage })
- [ ] threads.sendMessage(threadId, { body })

#### Frontend UI (apps/marketing or new apps/messages)
- [ ] Inbox page: /marketing/messages
  - Thread list: subject, last message preview, unread badge
  - Empty state: "No messages yet"
- [ ] Thread detail: /marketing/messages/:id
  - Message list (oldest first or newest first)
  - Compose box at bottom
  - Send button
- [ ] Compose modal: "New Message"
  - Party selector (dropdown or autocomplete)
  - Subject (optional)
  - Body (textarea)
  - Send button

---

### Phase 3: DB Workflow
- [ ] Run: cd ../breederhq-api && npx prisma db push
- [ ] Verify schema changes applied
- [ ] Run: npx prisma generate
- [ ] Restart API server

### Phase 4: Manual Testing
- [ ] Email send:
  - Call POST /api/v1/marketing/email/send with test recipient
  - Verify EmailSendLog row created
  - Verify Resend dashboard shows sent email
  - Verify recipient receives email
- [ ] Finance invoice email:
  - Create invoice, mark as issued
  - Verify email sent to clientParty.email
  - Check EmailSendLog for invoiceId in metadata
- [ ] DM:
  - Create thread from breeder party to client party
  - Send message
  - Verify thread appears in inbox
  - Reply from client party (simulate)
  - Verify both parties see messages

---

## 6. Files to Create

### API (breederhq-api)
- src/services/email-service.ts
- src/services/email-templates.ts
- src/routes/marketing.ts (or email.ts)
- src/routes/messages.ts

### Frontend SDK (breederhq/packages/api)
- src/resources/marketing.ts
- src/resources/messages.ts
- src/types/marketing.ts
- src/types/messages.ts

### Frontend UI (breederhq)
- apps/marketing/src/pages/MessagesInboxPage.tsx
- apps/marketing/src/pages/MessageThreadPage.tsx
- apps/marketing/src/components/MessageList.tsx
- apps/marketing/src/components/MessageCompose.tsx

---

## 7. Risk Mitigation

1. **Resend API key security**: Store in .env, never commit
2. **Spam risk**: Validate PartyCommPreference before every send
3. **Tenant isolation**: All queries must filter by tenantId
4. **Message immutability**: No DELETE or UPDATE on Message model
5. **Email deliverability**: Use verified domain, monitor Resend logs
6. **Invoice email failure**: Log error to EmailSendLog, show toast to user

---

## 8. Success Criteria

- [ ] EmailSendLog model in schema, db push applied
- [ ] Resend API key in .env, email-service.ts working
- [ ] POST /marketing/email/send endpoint returns 200 with valid input
- [ ] Finance invoice "Send" action dispatches email via shared service
- [ ] Email appears in Resend dashboard and recipient inbox
- [ ] MessageThread, MessageParticipant, Message models in schema
- [ ] POST /messages/threads creates thread + participants + message
- [ ] GET /messages/threads returns tenant-scoped threads
- [ ] Breeder UI shows inbox, thread detail, compose works
- [ ] No duplicate email services, no dead code
- [ ] Clean git status on dev, committed and pushed

---

## 9. Implementation Path Summary

**Chosen**: Greenfield implementation, no existing code to consolidate.

**Rationale**:
- Zero Resend integration exists
- Zero DM infrastructure exists
- Campaign model exists but unused (will link to EmailSendLog later)
- PartyCommPreference exists and active (will enforce in email-service)
- Clean slate allows single, consistent implementation

**Next Steps**: Proceed to Phase 2 implementation.
