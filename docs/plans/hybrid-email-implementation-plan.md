# Hybrid Email Implementation Plan

## Overview

Enable two-way email communication for BreederHQ messaging using a single domain: `mail.breederhq.com`

### Goals
1. **Reply Threading** - When contacts receive email notifications about messages, they can reply directly and it creates a new message in the thread
2. **Tenant Inbound Addresses** - Each breeder gets a unique address (e.g., `sunny-acres@mail.breederhq.com`) that external contacts can email to start new conversations

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     OUTBOUND (All Emails)                        │
├─────────────────────────────────────────────────────────────────┤
│ System emails: noreply@mail.breederhq.com                       │
│ Message notifications: notifications@mail.breederhq.com         │
│   Reply-To: reply+t_{threadId}_{hmac}@mail.breederhq.com        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     INBOUND (Resend Webhook)                     │
├─────────────────────────────────────────────────────────────────┤
│ reply+t_{threadId}_{hmac}@... → Add message to existing thread  │
│ {tenant-slug}@...             → Create new thread for tenant    │
│ Unknown address               → Reject or dead-letter           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Domain Migration

### Resend Setup
1. Add domain `mail.breederhq.com` in Resend dashboard
2. Configure DNS records (Resend will provide exact values):
   ```
   mail.breederhq.com         MX     10   inbound-smtp.resend.com
   mail.breederhq.com         TXT    "v=spf1 include:resend.com ~all"
   resend._domainkey.mail     CNAME  (provided by Resend)
   ```
3. Verify domain in Resend
4. Enable "Receiving" for the domain

### Environment Variables
```bash
# Update in production
RESEND_FROM_EMAIL=noreply@mail.breederhq.com
RESEND_FROM_NAME=BreederHQ

# New variables
RESEND_INBOUND_DOMAIN=mail.breederhq.com
RESEND_WEBHOOK_SECRET=whsec_xxx  # From Resend webhook setup
INBOUND_EMAIL_HMAC_SECRET=xxx    # Generate: openssl rand -hex 32
```

### Code Changes
- Update `src/services/email-service.ts` default FROM address
- Deploy and verify outbound emails still work
- Wait ~1 week for domain reputation before enabling inbound

---

## Phase 1: Reply Threading (Existing Conversations)

### 1.1 Database Changes

```prisma
// Add to schema.prisma

model MessageThread {
  // ... existing fields

  // For correlating inbound emails to threads
  inboundEmailHash  String?   @unique  // HMAC hash for this thread
}

model EmailSendLog {
  // ... existing fields

  replyToAddress    String?   // The reply-to address used
}
```

Migration:
```sql
ALTER TABLE "MessageThread" ADD COLUMN "inboundEmailHash" TEXT UNIQUE;
ALTER TABLE "EmailSendLog" ADD COLUMN "replyToAddress" TEXT;
```

### 1.2 Reply Address Generation

Create `src/services/inbound-email-service.ts`:

```typescript
import crypto from "crypto";

const HMAC_SECRET = process.env.INBOUND_EMAIL_HMAC_SECRET!;
const INBOUND_DOMAIN = process.env.RESEND_INBOUND_DOMAIN || "mail.breederhq.com";

/**
 * Generate a reply-to address for a message thread
 * Format: reply+t_{threadId}_{hmac}@mail.breederhq.com
 */
export function generateReplyToAddress(threadId: number): string {
  const hmac = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(`thread:${threadId}`)
    .digest("hex")
    .substring(0, 12); // First 12 chars is enough

  return `reply+t_${threadId}_${hmac}@${INBOUND_DOMAIN}`;
}

/**
 * Parse and validate a reply-to address
 * Returns threadId if valid, null if invalid/tampered
 */
export function parseReplyToAddress(email: string): { threadId: number } | null {
  const localPart = email.split("@")[0];
  const match = localPart.match(/^reply\+t_(\d+)_([a-f0-9]+)$/);

  if (!match) return null;

  const threadId = parseInt(match[1], 10);
  const providedHmac = match[2];

  // Verify HMAC
  const expectedHmac = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(`thread:${threadId}`)
    .digest("hex")
    .substring(0, 12);

  if (providedHmac !== expectedHmac) {
    console.warn(`[inbound-email] Invalid HMAC for thread ${threadId}`);
    return null;
  }

  return { threadId };
}
```

### 1.3 Update Message Notification Emails

Modify `src/services/portal-provisioning-service.ts` (or wherever notification emails are sent):

```typescript
import { generateReplyToAddress } from "./inbound-email-service.js";

export async function sendNewMessageNotification(
  threadId: number,
  recipientEmail: string,
  senderName: string,
  messagePreview: string,
  tenantId: number
) {
  const replyTo = generateReplyToAddress(threadId);

  await sendEmail({
    tenantId,
    to: recipientEmail,
    subject: `New message from ${senderName}`,
    html: `
      <p>${senderName} sent you a message:</p>
      <blockquote>${messagePreview}</blockquote>
      <p><strong>Reply directly to this email</strong> or view in your portal.</p>
    `,
    replyTo,  // <-- NEW
    category: "transactional",
    templateKey: "new_message_notification",
  });
}
```

### 1.4 Update Email Service

Modify `src/services/email-service.ts`:

```typescript
export interface SendEmailParams {
  // ... existing
  replyTo?: string;  // <-- NEW
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { replyTo, ...rest } = params;

  // ... existing logic

  const { data, error } = await resendClient.emails.send({
    from: FROM,
    to: actualRecipient,
    subject: actualSubject,
    html: html || text || "",
    text,
    reply_to: replyTo,  // <-- NEW: Resend's param name
  });

  // Log the reply-to address
  await prisma.emailSendLog.create({
    data: {
      // ... existing fields
      replyToAddress: replyTo,  // <-- NEW
    },
  });
}
```

### 1.5 Inbound Webhook Endpoint

Create `src/routes/webhooks/resend-inbound.ts`:

```typescript
import { Router } from "express";
import { Resend } from "resend";
import prisma from "../../prisma.js";
import { parseReplyToAddress, parseTenantInboundAddress } from "../../services/inbound-email-service.js";

const router = Router();
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET!;

// POST /api/v1/webhooks/resend/inbound
router.post("/inbound", async (req, res) => {
  // Verify webhook signature
  const signature = req.headers["resend-signature"] as string;
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const isValid = resend.webhooks.verify(req.body, signature, WEBHOOK_SECRET);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Signature verification failed" });
  }

  const event = req.body;

  if (event.type !== "email.received") {
    return res.status(200).json({ ignored: true });
  }

  const { from, to, subject, text, html } = event.data;
  const toAddress = Array.isArray(to) ? to[0] : to;

  // Try to parse as reply-to-thread address
  const threadInfo = parseReplyToAddress(toAddress);
  if (threadInfo) {
    await handleThreadReply(threadInfo.threadId, from, text || html, subject);
    return res.status(200).json({ ok: true, type: "thread_reply" });
  }

  // Try to parse as tenant inbound address
  const tenantInfo = parseTenantInboundAddress(toAddress);
  if (tenantInfo) {
    await handleNewInboundThread(tenantInfo.slug, from, text || html, subject);
    return res.status(200).json({ ok: true, type: "new_thread" });
  }

  // Unknown address - log and ignore
  console.warn(`[inbound-email] Unknown recipient: ${toAddress}`);
  return res.status(200).json({ ok: true, type: "unknown_ignored" });
});

async function handleThreadReply(
  threadId: number,
  fromEmail: string,
  body: string,
  subject: string
) {
  // Find the thread
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: { participants: { include: { party: true } } },
  });

  if (!thread) {
    console.warn(`[inbound-email] Thread not found: ${threadId}`);
    return;
  }

  // Find or create the sender party
  let senderParty = await prisma.party.findFirst({
    where: {
      tenantId: thread.tenantId,
      email: { equals: fromEmail, mode: "insensitive" },
    },
  });

  if (!senderParty) {
    // Create a new contact for this sender
    senderParty = await prisma.party.create({
      data: {
        tenantId: thread.tenantId,
        email: fromEmail,
        name: fromEmail.split("@")[0], // Basic name from email
        type: "CONTACT",
      },
    });

    // Add as participant
    await prisma.messageParticipant.create({
      data: {
        threadId,
        partyId: senderParty.id,
      },
    });
  }

  // Verify sender is a participant (or add them)
  const isParticipant = thread.participants.some(p => p.partyId === senderParty!.id);
  if (!isParticipant) {
    await prisma.messageParticipant.create({
      data: {
        threadId,
        partyId: senderParty.id,
      },
    });
  }

  // Strip email reply cruft (quoted text, signatures)
  const cleanBody = stripEmailReplyContent(body);

  // Create the message
  const message = await prisma.message.create({
    data: {
      threadId,
      senderPartyId: senderParty.id,
      body: cleanBody,
      isAutomated: false,
    },
  });

  // Update thread timestamp
  await prisma.messageThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  // Notify other participants
  // ... (trigger notification emails to other participants)

  console.log(`[inbound-email] Created message ${message.id} in thread ${threadId} from ${fromEmail}`);
}

/**
 * Strip common email reply patterns (quoted text, signatures)
 */
function stripEmailReplyContent(body: string): string {
  // Remove everything after common reply markers
  const markers = [
    /^On .+ wrote:$/m,                    // "On Mon, Jan 1, 2025, X wrote:"
    /^-{2,}\s*Original Message\s*-{2,}/mi, // "-- Original Message --"
    /^_{2,}/m,                             // "___" signature separator
    /^>{1,}/m,                             // "> quoted text" (only at start of line)
    /\n\n--\s*\n/,                         // "-- \n" signature marker
  ];

  let cleaned = body;
  for (const marker of markers) {
    const match = cleaned.match(marker);
    if (match && match.index !== undefined) {
      cleaned = cleaned.substring(0, match.index);
    }
  }

  return cleaned.trim();
}

export default router;
```

### 1.6 Register Webhook Route

In `src/routes/index.ts` or main router:

```typescript
import resendInboundRouter from "./webhooks/resend-inbound.js";

// Public webhook (no auth)
app.use("/api/v1/webhooks/resend", resendInboundRouter);
```

---

## Phase 2: Tenant Inbound Addresses (New Conversations)

### 2.1 Database Changes

```prisma
model Tenant {
  // ... existing fields

  inboundEmailSlug  String?   @unique  // e.g., "sunny-acres"
}
```

Migration:
```sql
ALTER TABLE "Tenant" ADD COLUMN "inboundEmailSlug" TEXT UNIQUE;
```

### 2.2 Slug Generation & Validation

Add to `src/services/inbound-email-service.ts`:

```typescript
/**
 * Generate a slug from tenant/business name
 */
export function generateInboundSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")  // Replace non-alphanumeric with dashes
    .replace(/^-|-$/g, "")        // Remove leading/trailing dashes
    .substring(0, 30);            // Max length
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  // Reserved slugs
  const reserved = ["reply", "noreply", "support", "admin", "help", "info", "contact"];
  if (reserved.includes(slug)) return false;

  const existing = await prisma.tenant.findFirst({
    where: { inboundEmailSlug: slug },
  });

  return !existing;
}

/**
 * Parse tenant inbound address
 * Format: {slug}@mail.breederhq.com
 */
export function parseTenantInboundAddress(email: string): { slug: string } | null {
  const [localPart, domain] = email.split("@");

  if (domain !== INBOUND_DOMAIN) return null;
  if (localPart.startsWith("reply+")) return null;  // Not a tenant address
  if (localPart === "noreply") return null;

  return { slug: localPart };
}
```

### 2.3 Handle New Inbound Threads

Add to webhook handler:

```typescript
async function handleNewInboundThread(
  slug: string,
  fromEmail: string,
  body: string,
  subject: string
) {
  // Find tenant by slug
  const tenant = await prisma.tenant.findFirst({
    where: { inboundEmailSlug: slug },
    include: {
      organizations: {
        take: 1,
        include: { party: true },
      },
    },
  });

  if (!tenant) {
    console.warn(`[inbound-email] No tenant found for slug: ${slug}`);
    // Could send auto-reply: "This address is not active"
    return;
  }

  const orgParty = tenant.organizations[0]?.party;
  if (!orgParty) {
    console.warn(`[inbound-email] No org party for tenant: ${tenant.id}`);
    return;
  }

  // Find or create sender as a contact
  let senderParty = await prisma.party.findFirst({
    where: {
      tenantId: tenant.id,
      email: { equals: fromEmail, mode: "insensitive" },
    },
  });

  if (!senderParty) {
    senderParty = await prisma.party.create({
      data: {
        tenantId: tenant.id,
        email: fromEmail,
        name: extractNameFromEmail(fromEmail),
        type: "CONTACT",
      },
    });
  }

  // Create new thread
  const thread = await prisma.messageThread.create({
    data: {
      tenantId: tenant.id,
      subject: subject || "New message",
      lastMessageAt: new Date(),
      firstInboundAt: new Date(),
      participants: {
        create: [
          { partyId: orgParty.id },
          { partyId: senderParty.id },
        ],
      },
    },
  });

  // Create initial message
  await prisma.message.create({
    data: {
      threadId: thread.id,
      senderPartyId: senderParty.id,
      body: stripEmailReplyContent(body),
      isAutomated: false,
    },
  });

  // Notify breeder of new message
  await sendNewMessageNotification(
    thread.id,
    orgParty.email!,
    senderParty.name || fromEmail,
    body.substring(0, 200),
    tenant.id
  );

  console.log(`[inbound-email] Created new thread ${thread.id} for tenant ${tenant.id} from ${fromEmail}`);
}

function extractNameFromEmail(email: string): string {
  const localPart = email.split("@")[0];
  // Convert "john.doe" or "john_doe" to "John Doe"
  return localPart
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
```

### 2.4 Settings UI for Tenant Inbound Address

Add API endpoint `GET/PUT /api/v1/settings/inbound-email`:

```typescript
// GET - return current inbound address
router.get("/inbound-email", requireAuth, async (req, res) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.tenantId },
    select: { inboundEmailSlug: true },
  });

  const slug = tenant?.inboundEmailSlug;
  const address = slug ? `${slug}@${INBOUND_DOMAIN}` : null;

  res.json({
    slug,
    address,
    domain: INBOUND_DOMAIN,
  });
});

// PUT - update slug
router.put("/inbound-email", requireAuth, async (req, res) => {
  const { slug } = req.body;

  // Validate slug format
  if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
    return res.status(400).json({ error: "Invalid slug format" });
  }

  // Check availability
  const available = await isSlugAvailable(slug);
  if (!available) {
    return res.status(409).json({ error: "Slug already taken" });
  }

  await prisma.tenant.update({
    where: { id: req.tenantId },
    data: { inboundEmailSlug: slug },
  });

  res.json({
    slug,
    address: `${slug}@${INBOUND_DOMAIN}`,
  });
});
```

Frontend component shows:
- Current inbound address (or prompt to set one)
- "Share this with your clients so they can email you directly"
- Copy button

---

## Phase 3: Polish & Edge Cases

### 3.1 Auto-Reply for Unrecognized Addresses

When an email arrives at an unknown address:

```typescript
async function sendUnknownAddressReply(toEmail: string, fromEmail: string) {
  await sendEmail({
    tenantId: 0, // System email
    to: fromEmail,
    subject: "Delivery failed: Address not found",
    html: `
      <p>The address <strong>${toEmail}</strong> is not active.</p>
      <p>If you're trying to reach a breeder on BreederHQ,
      please contact them through their website or portal.</p>
    `,
    category: "transactional",
  });
}
```

### 3.2 Spam/Abuse Protection

- Rate limit per sender email (e.g., 10 emails/hour)
- Block known spam domains
- Flag threads from unknown senders for breeder review

### 3.3 Attachment Handling

Resend provides attachment metadata in webhook. For MVP:
- Note in message body: "This email had X attachments (not imported)"
- Future: Download and store in document storage

### 3.4 HTML Email Parsing

For emails with HTML body but no text:
- Use a library like `html-to-text` to extract readable content
- Strip tracking pixels, styles, etc.

---

## Rollout Checklist

### Phase 0: Domain Setup
- [x] Add `mail.breederhq.com` to Resend
- [x] Configure DNS records
- [x] Verify domain in Resend
- [x] Update `RESEND_FROM_EMAIL` env var (in .env files, need to update in Render)
- [ ] Deploy and test outbound emails
- [x] Remove old `breederhq.com` from Resend (after verification)
- [ ] Wait 1 week for reputation

### Phase 1: Reply Threading
- [x] Deploy `inbound-email-service.ts` (src/services/inbound-email-service.ts)
- [x] Update email service with `from` and `replyTo` params
- [x] Update message notification emails to include reply-to address
- [x] Create webhook endpoint (src/routes/webhooks-resend.ts)
- [x] Add CSRF exemption for webhook
- [x] Add raw body parsing for webhook signature verification
- [ ] Create Resend webhook in dashboard (point to /api/v1/webhooks/resend/inbound)
- [ ] Add `RESEND_WEBHOOK_SECRET` to Render env vars
- [ ] Add `INBOUND_EMAIL_HMAC_SECRET` to Render env vars
- [ ] Deploy API
- [ ] Test end-to-end: send message → receive email → reply → message appears

### Phase 2: Tenant Inbound
- [ ] Run database migration for `inboundEmailSlug` on Tenant model
- [ ] Deploy tenant inbound handling (already in webhook handler, just needs DB field)
- [ ] Add settings API endpoints
- [ ] Build settings UI
- [ ] Auto-generate slugs for existing tenants (optional)
- [ ] Test end-to-end: email tenant address → new thread created

### Phase 3: Polish
- [ ] Add rate limiting on inbound webhook
- [ ] Add unknown address auto-reply
- [x] Add attachment notices (implemented in webhook handler)
- [ ] Monitor and tune email parsing

---

## Cost Estimate

Resend pricing (as of 2025):
- $20/month for custom domain with inbound
- Inbound emails: Included in plan
- No per-email cost for receiving

---

## Security Considerations

1. **HMAC Validation** - Reply-to addresses use HMAC to prevent thread ID guessing
2. **Webhook Signature** - All inbound webhooks verified with Resend's signing secret
3. **Rate Limiting** - Prevent spam/abuse from external senders
4. **Email Spoofing** - Consider SPF/DKIM checking on inbound (Resend may handle)
5. **Content Sanitization** - Strip HTML/scripts from inbound email bodies before storing
