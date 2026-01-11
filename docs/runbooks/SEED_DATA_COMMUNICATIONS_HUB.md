# Seed Data: Communications Hub

This document provides requirements for seeding realistic data for the Communications Hub UI, including messages, conversations, and contact metadata that powers the "meta chips" feature.

---

## Overview

The Communications Hub displays enriched contact metadata ("meta chips") on message cards that give breeders instant context about who they're communicating with. This requires:

1. **Contact Meta Data** - Enriched insights per contact (lead status, waitlist position, deposits, etc.)
2. **Messages & Conversations** - Realistic email and DM threads

---

## Part 1: Contact Meta Data

### Data Fields Needed Per Contact (partyId)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `leadStatus` | enum | Contact's sales funnel stage | `"prospect"`, `"lead"`, `"customer"`, `"inactive"` |
| `waitlistPosition` | number \| null | Their position on any active waitlist | `3` |
| `waitlistPlanName` | string \| null | Name of the breeding plan they're waitlisted for | `"Spring 2025 Golden Litter"` |
| `hasActiveDeposit` | boolean | Whether they have a paid deposit on file | `true` |
| `depositPlanName` | string \| null | Which litter/plan the deposit is for | `"Golden Litter #4"` |
| `totalPurchases` | number (cents) | Lifetime value - sum of all paid invoices | `350000` ($3,500) |
| `animalsOwned` | number | Count of animals they've purchased from this breeder | `2` |
| `lastContactedDaysAgo` | number \| null | Days since last communication | `14` |
| `location` | string \| null | City, State formatted | `"Austin, TX"` |

### Seed Scenarios to Create

#### 1. High-Value Customer
- `leadStatus`: `"customer"`
- `totalPurchases`: $5,000+
- `animalsOwned`: 2-3
- `hasActiveDeposit`: true (repeat buyer)
- `location`: populated

#### 2. Active Waitlist Lead
- `leadStatus`: `"lead"`
- `waitlistPosition`: 1-10
- `waitlistPlanName`: linked to an actual breeding plan
- `hasActiveDeposit`: true
- `depositPlanName`: same as waitlist plan

#### 3. Fresh Prospect (New Inquiry)
- `leadStatus`: `"prospect"`
- `waitlistPosition`: null
- `hasActiveDeposit`: false
- `totalPurchases`: 0
- `animalsOwned`: 0
- Should have recent inbound message

#### 4. Waitlisted Without Deposit
- `leadStatus`: `"lead"`
- `waitlistPosition`: 5-15
- `hasActiveDeposit`: false
- Shows they're interested but haven't committed financially

#### 5. Inactive/Past Customer
- `leadStatus`: `"inactive"` or `"customer"`
- `totalPurchases`: > 0
- `animalsOwned`: 1+
- `lastContactedDaysAgo`: 90+

#### 6. VIP Repeat Buyer
- `leadStatus`: `"customer"`
- `totalPurchases`: $10,000+
- `animalsOwned`: 3+
- Multiple deposits over time

---

## Part 2: Messages & Conversations

### Message Types to Seed

| Type | Direction | Table/API | Description |
|------|-----------|-----------|-------------|
| Email - Inbound | `inbound` | `party_email` or `email` | Emails received from contacts |
| Email - Outbound | `outbound` | `party_email` or `email` | Emails sent by breeder |
| DM - Inbound | `inbound` | `message_thread` + `message` | Marketplace DMs from buyers |
| DM - Outbound | `outbound` | `message_thread` + `message` | Breeder replies to DMs |
| Draft | n/a | `draft` | Unsent messages |

### Realistic Conversation Scenarios

#### 1. New Puppy Inquiry (Email - Inbound)
```
From: sarah.johnson@gmail.com
Subject: Inquiry about Golden Retriever puppies
Body: Hi! I found your website and I'm interested in your upcoming Golden Retriever litter.
      Do you have any puppies available? We're a family of 4 with a large backyard. Thanks!
Status: unread
```

#### 2. Breeder Response (Email - Outbound)
```
To: sarah.johnson@gmail.com
Subject: RE: Inquiry about Golden Retriever puppies
Body: Hi Sarah! Thank you for reaching out. Yes, we have 3 puppies still available from our
      Spring litter. I'd love to learn more about your family. Would you be available for
      a phone call this week?
Status: sent
```

#### 3. Waitlist Confirmation (Email - Outbound)
```
To: mike.chen@outlook.com
Subject: Welcome to the Fall 2025 Waitlist!
Body: Hi Mike, Great news - you're now #4 on our Fall 2025 Golden Litter waitlist! I've
      attached our puppy contract for your review. Please let me know if you have any questions.
Status: sent
has_attachment: true
```

#### 4. Deposit Follow-up (Email - Outbound)
```
To: jennifer.martinez@yahoo.com
Subject: Deposit Received - Next Steps
Body: Hi Jennifer, I've received your $500 deposit - thank you! You're now confirmed for a
      puppy from our Summer litter. Expected birth date is June 15th. I'll send weekly
      updates once the puppies arrive!
Status: sent
```

#### 5. Marketplace DM - Initial Inquiry (Inbound)
```
Thread subject: Interested in listing #247
From: Marketplace User "David Wilson"
Body: Hi, I saw your Golden Retriever listing on the marketplace. Is the male puppy with
      the green collar still available?
Status: unread
```

#### 6. Marketplace DM - Breeder Reply (Outbound)
```
Thread subject: Interested in listing #247
Body: Hi David! Yes, he's still available. He's such a sweet boy - very calm temperament.
      Would you like to schedule a video call to meet him?
Status: read
```

#### 7. Marketplace DM - Negotiation Thread (Multi-message)
```
Thread subject: Question about shipping
Message 1 (inbound): Do you ship puppies? I'm in Colorado.
Message 2 (outbound): Yes, we offer flight nanny service for $400. We never cargo ship.
Message 3 (inbound): That sounds great. What's the total cost including the flight nanny?
Message 4 (outbound): The puppy is $2,500 + $400 flight nanny = $2,900 total. I can send
                      you a detailed breakdown.
Status: read
```

#### 8. Health Update Email (Outbound)
```
To: (multiple recipients or specific contact)
Subject: Litter Update - Week 4 Photos!
Body: Hi everyone! The puppies are 4 weeks old and doing amazing. They've started eating
      solid food and their personalities are really showing. See attached photos! Green
      collar boy is the most adventurous...
Status: sent
has_attachment: true
```

#### 9. Contract Follow-up (Email - Outbound)
```
To: amanda.taylor@gmail.com
Subject: Gentle Reminder - Signed Contract Needed
Body: Hi Amanda, Just a friendly reminder that I still need your signed puppy contract
      before we can finalize your spot on the waitlist. Please let me know if you have
      any questions about the terms!
Status: sent
```

#### 10. Past Customer Check-in (Email - Inbound)
```
From: robert.smith@gmail.com (past customer - owns 2 dogs)
Subject: Max is doing great!
Body: Hi! Just wanted to send you an update on Max - he's turning 2 next month and is
      the best dog ever. We're actually thinking about getting him a sibling. Do you
      have any litters planned for next year?
Status: unread
flagged: true
```

#### 11. Problem/Concern Thread (Email - Inbound)
```
From: karen.white@hotmail.com
Subject: Question about Luna's eating
Body: Hi, Luna has been a bit picky with her food lately. She's 4 months old now. Is
      this normal? Should I be concerned?
Status: unread (HIGH PRIORITY - needs response)
```

#### 12. Draft - Unsent Response
```
To: karen.white@hotmail.com
Subject: RE: Question about Luna's eating
Body: Hi Karen, That's actually pretty normal around 4 months as they transition from
      puppy food. I'd recommend...
Status: draft
```

---

## Distribution Recommendations

### Message Distribution by Folder/Status

| Folder/Status | Count | Notes |
|---------------|-------|-------|
| Unread (Inbox) | 3-5 | Mix of new inquiries and follow-ups |
| Read (Inbox) | 10-15 | Recent conversations |
| Sent | 15-20 | Shows breeder is active/responsive |
| Flagged/Starred | 2-4 | Important messages to follow up on |
| Drafts | 1-2 | Work in progress |
| Archived | 5-10 | Old completed conversations |

### Channel Distribution
- **60% Email** - Primary communication channel for breeders
- **40% DMs** - Marketplace inquiries

### Read/Unread Distribution
- **80% Read** - Breeder is on top of their inbox
- **20% Unread** - Some new messages to show activity

### Timestamps Strategy

| Time Period | Message Count | Example |
|-------------|---------------|---------|
| Today | 3-5 | Recent inquiries, ongoing conversations |
| Yesterday | 4-6 | Active threads |
| This Week | 8-10 | Normal activity |
| Last Week | 5-8 | Older but relevant |
| Last Month | 5-10 | Archived/completed |

### Thread Depth Recommendations

| Thread Type | Messages | Description |
|-------------|----------|-------------|
| Single message | 40% | Initial inquiries, one-off updates |
| 2-3 messages | 35% | Quick back-and-forth |
| 4-6 messages | 20% | Active negotiation/planning |
| 7+ messages | 5% | Long-running relationship threads |

---

## Data Relationships

Each seeded message should connect to related entities:

```
Message/Email
  - partyId       -> Contact (REQUIRED for meta chips to work!)
  - breedingPlanId -> (optional) links to specific litter
  - animalId       -> (optional) links to specific animal
  - waitlistEntryId -> (optional) links to waitlist
  - invoiceId      -> (optional) links to deposit/payment
```

**Critical:** Messages MUST have a valid `partyId` linking to a seeded Contact for the meta chips to display!

---

## Sample Contact Names

Use these for realism in seed data:

| Name | Role | Scenario |
|------|------|----------|
| Sarah Johnson | prospect | New inquiry |
| Mike Chen | lead | On waitlist #4 |
| Jennifer Martinez | customer | Paid deposit |
| David Wilson | marketplace user | DM inquiry |
| Amanda Taylor | lead | Needs contract signed |
| Robert Smith | repeat customer | Owns 2 dogs |
| Karen White | customer | Has support question |
| Emily Davis | prospect | Asking about future litters |
| James Thompson | lead | Waitlist #2, no deposit yet |
| Lisa Anderson | customer | VIP ($10k+ lifetime) |

---

## Backend API Requirements

### Option A: Extend existing inbox response (Recommended)

Add a `contactMeta` object to each `CommunicationItem` in `/api/v1/communications/inbox`:

```typescript
interface CommunicationItem {
  // ... existing fields ...
  contactMeta?: {
    leadStatus: string | null;
    waitlistPosition: number | null;
    waitlistPlanName: string | null;
    hasActiveDeposit: boolean;
    depositPlanName: string | null;
    totalPurchases: number; // cents
    animalsOwned: number;
    lastContactedDaysAgo: number | null;
    location: string | null;
  };
}
```

### Option B: Separate enrichment endpoint

`GET /api/v1/contacts/:partyId/insights` - but this would require N+1 calls, so Option A is preferred.

---

## Database Queries for Meta Fields

The meta fields are derived/aggregated from existing tables:

| Meta Field | Source |
|------------|--------|
| `leadStatus` | `party.leadStatus` (may already exist) |
| `waitlistPosition` | `waitlist_entry.position` WHERE `partyId` = X AND `status` = 'active' |
| `waitlistPlanName` | JOIN `breeding_plan.name` via `waitlist_entry.breedingPlanId` |
| `hasActiveDeposit` | `invoice` WHERE `partyId` = X AND `category` = 'DEPOSIT' AND `status` = 'PAID' AND linked to active plan |
| `depositPlanName` | JOIN `breeding_plan.name` via `invoice.breedingPlanId` |
| `totalPurchases` | SUM(`payment.amountCents`) WHERE `partyId` = X |
| `animalsOwned` | COUNT(`animal`) WHERE `ownerPartyId` = X (or via placements) |
| `lastContactedDaysAgo` | DATEDIFF(NOW(), MAX(`communication.createdAt`)) WHERE `partyId` = X |
| `location` | `party.city`, `party.state` concatenated |

---

## Schema Extensions (if needed)

Check if these fields exist on the `Party`/`Contact` table:
- `leadStatus` enum - if not, add it with values: `prospect`, `lead`, `customer`, `inactive`
- `city`, `state` - for location display

The rest should be derivable from existing tables (invoices, waitlist_entries, animals, payments, communications).

---

## Questions to Resolve

1. **Is `leadStatus` already on the Party/Contact model?** If not, what are the valid values?
2. **How do we determine "animalsOwned"?** Via `Animal.ownerPartyId` or via `Placement` records?
3. **Should `lastContactedDaysAgo` include both inbound AND outbound?** Or just track when breeder last replied?
4. **Performance:** Should these aggregations be cached/materialized, or computed on-the-fly?

---

## Frontend Location

The frontend code consuming this data is in:

- **File:** `apps/marketing/src/pages/CommunicationsHub.tsx`
- **Mock function:** `generateSampleMeta()` (lines ~2664-2692) - replace with real API data
- **Type definition:** `UnifiedMessage.meta` interface (lines ~118-129)

---

## Seed Script Checklist

```
[ ] Create 10-15 Contacts with varied leadStatus, locations
[ ] Create 3-5 Breeding Plans (past, current, future)
[ ] Create Waitlist Entries linking contacts to plans
[ ] Create Invoices/Deposits for some contacts
[ ] Create 25-35 Email records (mix of inbound/outbound)
[ ] Create 5-10 Message Threads with 2-4 messages each
[ ] Create 1-2 Draft records
[ ] Ensure timestamps are distributed realistically
[ ] Ensure read/unread/flagged/archived statuses are varied
[ ] Link messages to contacts (partyId) for meta enrichment
```

---

## Related Documentation

- [Communications Hub Plan](../plans/communications-hub-plan.md)
- [Email/DM Recon](../marketing/EMAIL_DM_RECON.md)
- [ERD: Marketing](../erd/07-marketing.md)
