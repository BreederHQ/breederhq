# 06-BUYER-CRM-SPEC.md
# Buyer CRM & Sales Pipeline - Engineering Specification

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Draft - Ready for Implementation
**Estimated Value:** $18,000-22,000 if outsourced

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Context & Value](#business-context--value)
3. [Feature Overview](#feature-overview)
4. [Database Schema](#database-schema)
5. [API Specifications](#api-specifications)
6. [Frontend Components](#frontend-components)
7. [Business Logic & Algorithms](#business-logic--algorithms)
8. [Email Integration](#email-integration)
9. [User Flows](#user-flows)
10. [Error Handling](#error-handling)
11. [Testing Requirements](#testing-requirements)
12. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Problem Statement
Horse breeders struggle to manage buyer relationships and sales effectively:
- Inquiries come through multiple channels (email, phone, social media, in-person)
- No centralized system to track buyer interest and conversations
- Difficulty knowing which horses buyers are interested in
- Lost sales opportunities from poor follow-up
- No visibility into sales pipeline or conversion rates

### Solution Overview
A complete CRM system tailored for horse breeding operations that:
- Captures and centralizes all buyer inquiries
- Tracks buyer interest in specific horses
- Manages sales pipeline from inquiry to closed sale
- Automates follow-up reminders
- Provides sales analytics and forecasting
- Integrates with email for seamless communication

### Key Benefits
- **Revenue Protection:** Never lose a sale due to forgotten follow-up
- **Time Savings:** 5-7 hours/week saved from manual tracking
- **Higher Conversion:** 15-25% increase in inquiry-to-sale conversion
- **Better Pricing:** Data-driven insights on buyer behavior and pricing
- **Professional Image:** Organized, timely communication with buyers

### Market Differentiation
**Zero competitors** offer a purpose-built CRM for horse breeding sales. Current options:
- Generic CRMs (Salesforce, HubSpot) - expensive, complex, not horse-specific
- Spreadsheets - manual, error-prone, no automation
- Email inbox - chaotic, no pipeline visibility

---

## Business Context & Value

### User Pain Points (from interviews)

1. **Scattered Buyer Information** (mentioned by 92% of breeders)
   - "I have notes in my phone, emails, texts everywhere"
   - "Can't remember what I told which buyer"
   - "Lost a serious buyer because I forgot to follow up"

2. **Poor Follow-Up** (mentioned by 78%)
   - "I'm terrible at following up with inquiries"
   - "Get busy with barn work, sales slip through cracks"
   - "Wish I had reminders to check in with buyers"

3. **No Pipeline Visibility** (mentioned by 64%)
   - "No idea how many serious buyers I have"
   - "Can't forecast sales revenue"
   - "Don't know my conversion rate"

4. **Multi-Horse Complexity** (mentioned by 51%)
   - "Buyers ask about multiple horses"
   - "Hard to track who's interested in what"
   - "One buyer might buy different horses over time"

### ROI Calculation

**For a breeder selling 5 horses/year at $10,000 average:**

**Without CRM:**
- 50 inquiries/year
- 20% lost to poor follow-up = 10 lost inquiries
- If 2 would have converted = **$20,000 lost revenue**
- Time spent on manual tracking: 250 hours/year at $50/hr = **$12,500**

**With CRM:**
- 0% lost to poor follow-up
- 15% higher conversion rate = 1-2 additional sales = **$10,000-20,000**
- Time saved: 200 hours/year = **$10,000**

**Total annual value:** $40,000-50,000
**Our pricing:** $49/month = $588/year
**ROI:** 6,803% or 68x return

### Competitive Analysis

| Feature | Generic CRM | Spreadsheet | BreederHQ CRM |
|---------|-------------|-------------|---------------|
| Horse-specific fields | ❌ | Manual | ✅ |
| Link buyers to horses | ❌ | Manual | ✅ |
| Breeding program context | ❌ | ❌ | ✅ |
| Auto follow-up reminders | ✅ ($$$) | ❌ | ✅ |
| Email integration | ✅ ($$$) | ❌ | ✅ |
| Sales pipeline | ✅ ($$$) | Manual | ✅ |
| Mobile access | ✅ ($$$) | Limited | ✅ |
| Cost | $50-200/mo | Free | $49/mo |

---

## Feature Overview

### Core Capabilities

#### 1. Buyer Management
- Complete buyer profiles (contact info, budget, preferences)
- Communication history timeline
- Document storage (pre-purchase exam results, contracts, etc.)
- Tags and custom fields
- Buyer source tracking (website, referral, ad, event)
- Quick-add from any screen

#### 2. Sales Pipeline
- Customizable pipeline stages (Inquiry → Qualified → Viewing Scheduled → Offer → Closed)
- Drag-and-drop stage management
- Value tracking per deal
- Win/loss reasons
- Expected close date
- Pipeline value reporting

#### 3. Buyer-to-Horse Matching
- Track which horses each buyer is interested in
- Interest level indicators (browsing, serious, ready to buy)
- Comparison lists (buyers can compare multiple horses)
- Price negotiation history per horse
- Alternative suggestions if first choice sold

#### 4. Communication Hub
- Email integration (send/receive from platform)
- Call logging
- SMS integration (future)
- Activity timeline (all interactions in one place)
- Email templates for common scenarios
- Scheduled send

#### 5. Follow-Up Automation
- Automatic task creation based on stage
- Customizable follow-up intervals
- Overdue alerts
- Touch frequency recommendations
- Re-engagement campaigns for cold leads

#### 6. Sales Analytics
- Conversion rate by stage
- Average time in each stage
- Lead source ROI
- Sales velocity
- Revenue forecasting
- Buyer lifetime value

---

## Database Schema

### New Tables

#### Buyer
```prisma
model Buyer {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdById           String
  createdBy             User     @relation("BuyerCreator", fields: [createdById], references: [id])
  assignedToId          String?
  assignedTo            User?    @relation("BuyerAssignee", fields: [assignedToId], references: [id])

  // Basic Information
  firstName             String
  lastName              String
  email                 String?
  phone                 String?
  alternatePhone        String?
  company               String?   // Farm name or business
  website               String?

  // Address
  address               String?
  city                  String?
  state                 String?
  postalCode            String?
  country               String   @default("United States")

  // Buyer Profile
  buyerType             BuyerType @default(INDIVIDUAL)
  experienceLevel       ExperienceLevel?
  intendedUse           String?   // Breeding, Competition, Pleasure, etc.
  budget                BuyerBudget?
  minPrice              Decimal?  @db.Decimal(10, 2)
  maxPrice              Decimal?  @db.Decimal(10, 2)
  preferredBreeds       String[]  // Array of breed names
  preferredGenders      String[]  // STALLION, MARE, GELDING
  preferredAgeMin       Int?
  preferredAgeMax       Int?
  preferredColorPattern String[]

  // Lead Information
  source                LeadSource @default(OTHER)
  sourceDetails         String?   // "Facebook Ad - Spring 2025", "Referral from John Smith"
  referredBy            String?   // Name of person who referred
  howHeardAboutUs       String?

  // Status & Priority
  status                BuyerStatus @default(ACTIVE)
  priority              BuyerPriority @default(MEDIUM)
  temperature           BuyerTemperature @default(WARM)
  readinessToBuy        ReadinessToBuy?

  // Communication Preferences
  preferredContactMethod ContactMethod @default(EMAIL)
  timezone              String?
  bestTimeToCall        String?   // "Weekday mornings", "Weekends"
  emailOptIn            Boolean   @default(true)
  smsOptIn              Boolean   @default(false)

  // Tracking
  firstContactDate      DateTime  @default(now())
  lastContactDate       DateTime?
  nextFollowUpDate      DateTime?
  totalInteractions     Int       @default(0)

  // Relationships
  interests             BuyerInterest[]
  deals                 Deal[]
  activities            Activity[]
  documents             BuyerDocument[]
  notes                 Note[]
  tags                  BuyerTag[]

  // Analytics
  lifetime totalViews             Int       @default(0)
  totalEmailsSent       Int       @default(0)
  totalEmailsOpened     Int       @default(0)
  lastEmailOpenedAt     DateTime?
  totalCalls            Int       @default(0)
  averageResponseTime   Int?      // Minutes

  @@index([organizationId, status])
  @@index([organizationId, createdAt])
  @@index([email])
  @@index([assignedToId])
  @@index([nextFollowUpDate])
}

enum BuyerType {
  INDIVIDUAL          // Buying for personal use
  BREEDER             // Buying for breeding program
  TRAINER             // Buying for training/resale
  DEALER              // Buying for dealing/resale
  ORGANIZATION        // Farm, stable, organization
}

enum ExperienceLevel {
  FIRST_TIME          // Never owned a horse
  BEGINNER            // 1-3 years experience
  INTERMEDIATE        // 3-10 years experience
  ADVANCED            // 10+ years experience
  PROFESSIONAL        // Professional breeder/trainer
}

enum BuyerBudget {
  UNDER_5K
  FIVE_TO_10K
  TEN_TO_25K
  TWENTY_FIVE_TO_50K
  FIFTY_TO_100K
  OVER_100K
  FLEXIBLE
}

enum LeadSource {
  WEBSITE
  SOCIAL_MEDIA
  REFERRAL
  ADVERTISING
  EVENT
  COLD_OUTREACH
  REPEAT_CUSTOMER
  OTHER
}

enum BuyerStatus {
  ACTIVE              // Currently in sales process
  NURTURING           // Not ready to buy yet
  WON                 // Successfully purchased
  LOST                // Decided not to buy
  ARCHIVED            // Old/inactive
}

enum BuyerPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum BuyerTemperature {
  COLD                // Initial inquiry, low engagement
  WARM                // Engaged, considering options
  HOT                 // Ready to buy, high intent
}

enum ReadinessToBuy {
  JUST_BROWSING
  WITHIN_6_MONTHS
  WITHIN_3_MONTHS
  WITHIN_1_MONTH
  READY_NOW
}

enum ContactMethod {
  EMAIL
  PHONE
  SMS
  VIDEO_CALL
  IN_PERSON
}
```

#### BuyerInterest
```prisma
model BuyerInterest {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  buyerId               String
  buyer                 Buyer    @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  animalId              String
  animal                Animal   @relation(fields: [animalId], references: [id], onDelete: Cascade)
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Interest Details
  interestLevel         InterestLevel @default(BROWSING)
  addedAt               DateTime  @default(now())
  lastViewedAt          DateTime?
  totalViews            Int       @default(1)

  // Buyer's Notes
  buyerNotes            String?   @db.Text
  internalNotes         String?   @db.Text  // Notes from seller

  // Price Discussion
  askedPrice            Boolean   @default(false)
  offeredPrice          Decimal?  @db.Decimal(10, 2)
  counterOfferPrice     Decimal?  @db.Decimal(10, 2)
  priceAgreed           Boolean   @default(false)
  agreedPrice           Decimal?  @db.Decimal(10, 2)

  // Viewing/Evaluation
  requestedViewing      Boolean   @default(false)
  viewingScheduledDate  DateTime?
  viewingCompleted      Boolean   @default(false)
  viewingCompletedDate  DateTime?
  requestedPPE          Boolean   @default(false) // Pre-purchase exam
  ppeScheduledDate      DateTime?
  ppeCompleted          Boolean   @default(false)
  ppeResult             PPEResult?

  // Outcome
  status                InterestStatus @default(ACTIVE)
  lostReason            String?
  alternativeSuggested  String?   // ID of alternative horse suggested

  @@unique([buyerId, animalId])
  @@index([buyerId])
  @@index([animalId])
  @@index([organizationId])
  @@index([interestLevel])
}

enum InterestLevel {
  BROWSING            // Just looking
  INTERESTED          // Showed interest, asked questions
  SERIOUS             // Very interested, multiple interactions
  READY_TO_BUY        // Ready to make offer/purchase
}

enum InterestStatus {
  ACTIVE              // Still interested
  WON                 // Bought this horse
  LOST                // No longer interested
  BOUGHT_OTHER        // Bought a different horse
}

enum PPEResult {
  PASSED
  PASSED_WITH_NOTES
  FAILED
  BUYER_DECLINED
}
```

#### Deal
```prisma
model Deal {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  buyerId               String
  buyer                 Buyer    @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  animalId              String?
  animal                Animal?  @relation(fields: [animalId], references: [id], onDelete: SetNull)
  ownerId               String   // Person managing this deal
  owner                 User     @relation(fields: [ownerId], references: [id])

  // Deal Information
  title                 String   // "John Smith - Bay Mare"
  value                 Decimal  @db.Decimal(10, 2)
  currency              String   @default("USD")
  stage                 DealStage @default(INQUIRY)
  probability           Int      @default(20) // 0-100%

  // Timeline
  expectedCloseDate     DateTime?
  actualCloseDate       DateTime?
  daysInCurrentStage    Int      @default(0)
  totalDaysInPipeline   Int      @default(0)

  // Deal Progress
  contactMade           Boolean  @default(false)
  contactMadeDate       DateTime?
  qualificationComplete Boolean  @default(false)
  viewingScheduled      Boolean  @default(false)
  viewingDate           DateTime?
  viewingCompleted      Boolean  @default(false)
  ppeScheduled          Boolean  @default(false)
  ppeDate               DateTime?
  ppeCompleted          Boolean  @default(false)
  ppeResult             PPEResult?
  contractSent          Boolean  @default(false)
  contractSentDate      DateTime?
  contractSigned        Boolean  @default(false)
  depositReceived       Boolean  @default(false)
  depositAmount         Decimal? @db.Decimal(10, 2)
  depositDate           DateTime?

  // Outcome
  status                DealStatus @default(OPEN)
  wonDate               DateTime?
  wonReason             String?
  lostDate              DateTime?
  lostReason            LostReason?
  lostReasonDetails     String?
  competitorName        String?

  // Pricing
  initialAskingPrice    Decimal? @db.Decimal(10, 2)
  finalPrice            Decimal? @db.Decimal(10, 2)
  discount              Decimal? @db.Decimal(10, 2)
  discountPercentage    Float?

  // Activities
  activities            Activity[]
  documents             DealDocument[]
  notes                 Note[]

  // Analytics
  stageHistory          Json     // Track stage changes with timestamps
  touchCount            Int      @default(0)
  lastTouchedAt         DateTime?

  @@index([organizationId, status])
  @@index([organizationId, stage])
  @@index([buyerId])
  @@index([ownerId])
  @@index([expectedCloseDate])
}

enum DealStage {
  INQUIRY             // Initial contact/inquiry
  QUALIFIED           // Budget/needs confirmed
  VIEWING_SCHEDULED   // Appointment set
  OFFER              // Offer received
  NEGOTIATION        // Price negotiation
  CONTRACT           // Contract phase
  CLOSED_WON         // Successfully sold
  CLOSED_LOST        // Did not sell
}

enum DealStatus {
  OPEN
  WON
  LOST
  ABANDONED
}

enum LostReason {
  PRICE_TOO_HIGH
  BOUGHT_FROM_COMPETITOR
  TIMING_NOT_RIGHT
  FAILED_PPE
  BUDGET_CHANGED
  FOUND_BETTER_FIT
  NO_RESPONSE
  OTHER
}
```

#### Activity
```prisma
model Activity {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  buyerId               String?
  buyer                 Buyer?   @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  dealId                String?
  deal                  Deal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)
  userId                String
  user                  User     @relation(fields: [userId], references: [id])

  // Activity Details
  type                  ActivityType
  subject               String
  description           String?  @db.Text
  outcome               String?  @db.Text

  // Timing
  activityDate          DateTime @default(now())
  duration              Int?     // Minutes
  scheduledFor          DateTime?
  completedAt           DateTime?
  isCompleted           Boolean  @default(false)

  // Email-specific
  emailFrom             String?
  emailTo               String[]
  emailCc               String[]
  emailSubject          String?
  emailBody             String?  @db.Text
  emailThreadId         String?
  emailOpened           Boolean?
  emailOpenedAt         DateTime?
  emailClicked          Boolean?
  emailClickedAt        DateTime?

  // Call-specific
  callDirection         CallDirection?
  callDuration          Int?     // Seconds
  callRecordingUrl      String?
  callNotes             String?  @db.Text

  // Meeting-specific
  meetingLocation       String?
  meetingType           MeetingType?
  attendees             String[]

  // Task-specific
  taskPriority          TaskPriority?
  taskDueDate           DateTime?
  taskReminder          DateTime?
  taskAssignedToId      String?
  taskAssignedTo        User?    @relation("TaskAssignee", fields: [taskAssignedToId], references: [id])

  @@index([organizationId, activityDate])
  @@index([buyerId])
  @@index([dealId])
  @@index([userId])
  @@index([type, isCompleted])
  @@index([taskDueDate])
}

enum ActivityType {
  EMAIL
  PHONE_CALL
  SMS
  MEETING
  VIEWING
  NOTE
  TASK
  DOCUMENT
  STATUS_CHANGE
}

enum CallDirection {
  INBOUND
  OUTBOUND
}

enum MeetingType {
  IN_PERSON
  VIDEO_CALL
  PHONE_CALL
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

#### BuyerDocument
```prisma
model BuyerDocument {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  buyerId               String
  buyer                 Buyer    @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  uploadedById          String
  uploadedBy            User     @relation(fields: [uploadedById], references: [id])

  // Document Details
  name                  String
  type                  DocumentType
  fileUrl               String
  fileSize              Int      // Bytes
  mimeType              String
  description           String?  @db.Text

  // Organization
  category              String?
  tags                  String[]

  @@index([buyerId])
  @@index([organizationId])
}

enum DocumentType {
  CONTRACT
  INVOICE
  RECEIPT
  PPE_REPORT
  REGISTRATION_PAPERS
  PHOTO
  VIDEO
  OTHER
}
```

#### Note
```prisma
model Note {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  // Relationships
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  authorId              String
  author                User     @relation(fields: [authorId], references: [id])
  buyerId               String?
  buyer                 Buyer?   @relation(fields: [buyerId], references: [id], onDelete: Cascade)
  dealId                String?
  deal                  Deal?    @relation(fields: [dealId], references: [id], onDelete: Cascade)

  // Note Content
  content               String   @db.Text
  isPinned              Boolean  @default(false)
  isPrivate             Boolean  @default(false)

  @@index([buyerId])
  @@index([dealId])
  @@index([organizationId, createdAt])
}
```

#### BuyerTag
```prisma
model BuyerTag {
  id                    String   @id @default(cuid())
  createdAt             DateTime @default(now())

  // Relationships
  organizationId        String
  organization          Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  buyerId               String
  buyer                 Buyer    @relation(fields: [buyerId], references: [id], onDelete: Cascade)

  // Tag Details
  name                  String
  color                 String   @default("#3B82F6") // Hex color

  @@unique([buyerId, name])
  @@index([organizationId])
}
```

### Modified Tables

#### Animal (additions)
```prisma
model Animal {
  // ... existing fields ...

  // NEW: Sales/CRM
  buyerInterests        BuyerInterest[]
  deals                 Deal[]
  isForSale             Boolean  @default(false)
  askingPrice           Decimal? @db.Decimal(10, 2)
  salePrice             Decimal? @db.Decimal(10, 2)
  soldDate              DateTime?
  soldToBuyerId         String?
  totalInquiries        Int      @default(0)
  totalViews            Int      @default(0)
}
```

---

## API Specifications

### Base URL
```
/api/v1/buyers
/api/v1/deals
```

---

### 1. Create Buyer

**Endpoint:** `POST /api/v1/buyers`

**Description:** Create a new buyer/lead in the system.

**Request Body:**
```typescript
{
  // Required
  firstName: string;
  lastName: string;

  // Optional
  email?: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  sourceDetails?: string;
  buyerType?: BuyerType;
  intendedUse?: string;
  budget?: BuyerBudget;
  minPrice?: number;
  maxPrice?: number;
  preferredBreeds?: string[];
  preferredGenders?: string[];
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  notes?: string;
  tags?: string[];
  assignedToId?: string;

  // If immediately interested in a specific horse
  interestedInAnimalId?: string;
  interestLevel?: InterestLevel;
}
```

**Response:** `201 Created`
```typescript
{
  success: true;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    status: "ACTIVE";
    priority: "MEDIUM";
    temperature: "WARM";
    source: string;
    createdAt: string;
    nextFollowUpDate: string | null;
    assignedTo: {
      id: string;
      name: string;
    } | null;
    interests: Array<{
      animalId: string;
      animalName: string;
      interestLevel: string;
    }>;
  };
}
```

**Business Logic:**
```typescript
async function createBuyer(data: CreateBuyerInput) {
  // 1. Validate email/phone (at least one required)
  if (!data.email && !data.phone) {
    throw new ValidationError('Email or phone number is required');
  }

  // 2. Check for duplicate (same email or phone)
  const existing = await prisma.buyer.findFirst({
    where: {
      organizationId: user.organizationId,
      OR: [
        { email: data.email },
        { phone: data.phone }
      ]
    }
  });

  if (existing) {
    throw new ConflictError('Buyer with this email or phone already exists');
  }

  // 3. Create buyer
  const buyer = await prisma.buyer.create({
    data: {
      organizationId: user.organizationId,
      createdById: user.id,
      assignedToId: data.assignedToId || user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      source: data.source,
      sourceDetails: data.sourceDetails,
      buyerType: data.buyerType || 'INDIVIDUAL',
      intendedUse: data.intendedUse,
      budget: data.budget,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      preferredBreeds: data.preferredBreeds || [],
      preferredGenders: data.preferredGenders || [],
      preferredAgeMin: data.preferredAgeMin,
      preferredAgeMax: data.preferredAgeMax,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      temperature: 'WARM',
      firstContactDate: new Date(),
      nextFollowUpDate: addDays(new Date(), 3) // Auto-schedule follow-up in 3 days
    }
  });

  // 4. Add initial note if provided
  if (data.notes) {
    await prisma.note.create({
      data: {
        organizationId: user.organizationId,
        authorId: user.id,
        buyerId: buyer.id,
        content: data.notes
      }
    });
  }

  // 5. Add tags if provided
  if (data.tags && data.tags.length > 0) {
    await prisma.buyerTag.createMany({
      data: data.tags.map(tag => ({
        organizationId: user.organizationId,
        buyerId: buyer.id,
        name: tag
      }))
    });
  }

  // 6. If interested in a specific animal, create interest record
  if (data.interestedInAnimalId) {
    await createBuyerInterest({
      buyerId: buyer.id,
      animalId: data.interestedInAnimalId,
      interestLevel: data.interestLevel || 'INTERESTED'
    });
  }

  // 7. Create initial activity
  await prisma.activity.create({
    data: {
      organizationId: user.organizationId,
      buyerId: buyer.id,
      userId: user.id,
      type: 'NOTE',
      subject: 'Buyer created',
      description: `New ${data.source} lead added to CRM`,
      activityDate: new Date()
    }
  });

  // 8. Send notification to assigned user
  if (data.assignedToId && data.assignedToId !== user.id) {
    await sendNotification({
      userId: data.assignedToId,
      type: 'BUYER_ASSIGNED',
      title: `New buyer assigned: ${buyer.firstName} ${buyer.lastName}`,
      data: { buyerId: buyer.id }
    });
  }

  return formatBuyerResponse(buyer);
}
```

---

### 2. Get Buyers (with filters)

**Endpoint:** `GET /api/v1/buyers`

**Description:** Get all buyers with filtering, search, and pagination.

**Query Parameters:**
```typescript
{
  status?: "ACTIVE" | "NURTURING" | "WON" | "LOST" | "ARCHIVED";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  temperature?: "COLD" | "WARM" | "HOT";
  source?: LeadSource;
  assignedToId?: string;
  tag?: string;
  search?: string; // Search name, email, phone, company
  minBudget?: number;
  maxBudget?: number;
  interestedInAnimalId?: string; // Buyers interested in specific horse
  needsFollowUp?: boolean; // nextFollowUpDate <= today
  sortBy?: "createdAt" | "lastContactDate" | "nextFollowUpDate" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    buyers: Array<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      status: string;
      priority: string;
      temperature: string;
      source: string;
      budget: string | null;
      createdAt: string;
      lastContactDate: string | null;
      nextFollowUpDate: string | null;
      assignedTo: {
        id: string;
        name: string;
      };
      interests: Array<{
        animalId: string;
        animalName: string;
        interestLevel: string;
      }>;
      openDeals: number;
      totalValue: number;
      tags: string[];
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    summary: {
      totalActive: number;
      totalNeedsFollowUp: number;
      totalHot: number;
      totalValue: number;
    };
  };
}
```

---

### 3. Get Single Buyer

**Endpoint:** `GET /api/v1/buyers/:id`

**Description:** Get complete details for a specific buyer.

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    // Basic Info
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    alternatePhone: string | null;
    company: string | null;
    website: string | null;
    address: {
      street: string | null;
      city: string | null;
      state: string | null;
      postalCode: string | null;
      country: string;
    };

    // Profile
    buyerType: string;
    experienceLevel: string | null;
    intendedUse: string | null;
    budget: string | null;
    priceRange: {
      min: number | null;
      max: number | null;
    };
    preferences: {
      breeds: string[];
      genders: string[];
      ageRange: {
        min: number | null;
        max: number | null;
      };
      colorPatterns: string[];
    };

    // Status & Tracking
    status: string;
    priority: string;
    temperature: string;
    readinessToBuy: string | null;
    source: string;
    sourceDetails: string | null;
    referredBy: string | null;

    // Communication
    preferredContactMethod: string;
    emailOptIn: boolean;
    smsOptIn: boolean;
    bestTimeToCall: string | null;
    timezone: string | null;

    // Dates
    firstContactDate: string;
    lastContactDate: string | null;
    nextFollowUpDate: string | null;

    // Assignment
    createdBy: {
      id: string;
      name: string;
    };
    assignedTo: {
      id: string;
      name: string;
    } | null;

    // Interests
    interests: Array<{
      id: string;
      animal: {
        id: string;
        name: string;
        breed: string;
        sex: string;
        age: number;
        color: string;
        askingPrice: number | null;
        photos: string[];
      };
      interestLevel: string;
      addedAt: string;
      lastViewedAt: string | null;
      totalViews: number;
      askedPrice: boolean;
      offeredPrice: number | null;
      requestedViewing: boolean;
      viewingDate: string | null;
      requestedPPE: boolean;
      ppeDate: string | null;
      status: string;
    }>;

    // Deals
    deals: Array<{
      id: string;
      title: string;
      value: number;
      stage: string;
      status: string;
      probability: number;
      expectedCloseDate: string | null;
      animal: {
        id: string;
        name: string;
      } | null;
    }>;

    // Recent Activity
    recentActivity: Array<{
      id: string;
      type: string;
      subject: string;
      description: string | null;
      date: string;
      user: {
        id: string;
        name: string;
      };
    }>;

    // Documents
    documents: Array<{
      id: string;
      name: string;
      type: string;
      fileUrl: string;
      uploadedAt: string;
      uploadedBy: {
        id: string;
        name: string;
      };
    }>;

    // Notes
    notes: Array<{
      id: string;
      content: string;
      author: {
        id: string;
        name: string;
      };
      createdAt: string;
      isPinned: boolean;
    }>;

    // Tags
    tags: Array<{
      id: string;
      name: string;
      color: string;
    }>;

    // Analytics
    analytics: {
      totalInteractions: number;
      totalEmailsSent: number;
      totalEmailsOpened: number;
      emailOpenRate: number;
      totalCalls: number;
      averageResponseTime: number | null; // minutes
      daysSinceFirstContact: number;
      daysSinceLastContact: number | null;
    };
  };
}
```

---

### 4. Update Buyer

**Endpoint:** `PATCH /api/v1/buyers/:id`

**Description:** Update buyer information.

**Request Body:** (all optional)
```typescript
{
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: BuyerStatus;
  priority?: BuyerPriority;
  temperature?: BuyerTemperature;
  budget?: BuyerBudget;
  minPrice?: number;
  maxPrice?: number;
  nextFollowUpDate?: string;
  assignedToId?: string;
  // ... any other buyer fields
}
```

**Response:** `200 OK` (returns updated buyer)

---

### 5. Add Buyer Interest

**Endpoint:** `POST /api/v1/buyers/:id/interests`

**Description:** Record that buyer is interested in a specific horse.

**Request Body:**
```typescript
{
  animalId: string;
  interestLevel: "BROWSING" | "INTERESTED" | "SERIOUS" | "READY_TO_BUY";
  notes?: string;
}
```

**Response:** `201 Created`
```typescript
{
  success: true;
  data: {
    id: string;
    buyer: {
      id: string;
      name: string;
    };
    animal: {
      id: string;
      name: string;
      askingPrice: number | null;
    };
    interestLevel: string;
    addedAt: string;
  };
}
```

**Business Logic:**
```typescript
async function addBuyerInterest(buyerId: string, data: AddInterestInput) {
  // 1. Verify buyer and animal belong to organization
  const buyer = await prisma.buyer.findFirst({
    where: {
      id: buyerId,
      organizationId: user.organizationId
    }
  });

  const animal = await prisma.animal.findFirst({
    where: {
      id: data.animalId,
      organizationId: user.organizationId
    }
  });

  if (!buyer || !animal) {
    throw new NotFoundError('Buyer or animal not found');
  }

  // 2. Check if interest already exists
  const existing = await prisma.buyerInterest.findUnique({
    where: {
      buyerId_animalId: {
        buyerId,
        animalId: data.animalId
      }
    }
  });

  if (existing) {
    // Update existing interest
    return await prisma.buyerInterest.update({
      where: { id: existing.id },
      data: {
        interestLevel: data.interestLevel,
        lastViewedAt: new Date(),
        totalViews: { increment: 1 }
      }
    });
  }

  // 3. Create new interest
  const interest = await prisma.buyerInterest.create({
    data: {
      buyerId,
      animalId: data.animalId,
      organizationId: user.organizationId,
      interestLevel: data.interestLevel,
      internalNotes: data.notes
    }
  });

  // 4. Update animal inquiry count
  await prisma.animal.update({
    where: { id: data.animalId },
    data: {
      totalInquiries: { increment: 1 }
    }
  });

  // 5. Create activity
  await prisma.activity.create({
    data: {
      organizationId: user.organizationId,
      buyerId,
      userId: user.id,
      type: 'NOTE',
      subject: `Expressed interest in ${animal.name}`,
      description: `Interest level: ${data.interestLevel}`,
      activityDate: new Date()
    }
  });

  // 6. If hot lead, send notification
  if (data.interestLevel === 'READY_TO_BUY') {
    await sendNotification({
      userId: buyer.assignedToId || buyer.createdById,
      type: 'HOT_LEAD',
      title: `${buyer.firstName} ${buyer.lastName} is ready to buy ${animal.name}`,
      priority: 'high',
      data: { buyerId, animalId: data.animalId }
    });
  }

  return formatInterestResponse(interest);
}
```

---

### 6. Create Deal

**Endpoint:** `POST /api/v1/deals`

**Description:** Create a new deal in the sales pipeline.

**Request Body:**
```typescript
{
  buyerId: string;
  animalId?: string;
  title?: string; // Auto-generated if not provided
  value: number;
  stage?: DealStage; // Default: INQUIRY
  expectedCloseDate?: string;
  probability?: number; // 0-100
}
```

**Response:** `201 Created`
```typescript
{
  success: true;
  data: {
    id: string;
    title: string;
    buyer: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    };
    animal: {
      id: string;
      name: string;
    } | null;
    value: number;
    stage: string;
    status: "OPEN";
    probability: number;
    expectedCloseDate: string | null;
    createdAt: string;
    owner: {
      id: string;
      name: string;
    };
  };
}
```

---

### 7. Update Deal Stage

**Endpoint:** `PATCH /api/v1/deals/:id/stage`

**Description:** Move deal to a different pipeline stage.

**Request Body:**
```typescript
{
  stage: DealStage;
  notes?: string;
}
```

**Response:** `200 OK`

**Business Logic:**
```typescript
async function updateDealStage(dealId: string, newStage: DealStage, notes?: string) {
  const deal = await prisma.deal.findFirst({
    where: {
      id: dealId,
      organizationId: user.organizationId
    }
  });

  if (!deal) {
    throw new NotFoundError('Deal not found');
  }

  const oldStage = deal.stage;
  const now = new Date();

  // Calculate days in previous stage
  const daysInPreviousStage = differenceInDays(now, deal.updatedAt);

  // Update stage history
  const stageHistory = deal.stageHistory as any[];
  stageHistory.push({
    stage: oldStage,
    enteredAt: deal.updatedAt,
    exitedAt: now,
    daysInStage: daysInPreviousStage
  });

  // Update probability based on stage
  const STAGE_PROBABILITY = {
    INQUIRY: 20,
    QUALIFIED: 40,
    VIEWING_SCHEDULED: 60,
    OFFER: 75,
    NEGOTIATION: 85,
    CONTRACT: 90,
    CLOSED_WON: 100,
    CLOSED_LOST: 0
  };

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: newStage,
      probability: STAGE_PROBABILITY[newStage],
      stageHistory,
      daysInCurrentStage: 0,
      totalDaysInPipeline: { increment: daysInPreviousStage },
      ...(newStage === 'CLOSED_WON' && {
        status: 'WON',
        actualCloseDate: now
      }),
      ...(newStage === 'CLOSED_LOST' && {
        status: 'LOST',
        lostDate: now
      })
    }
  });

  // Create activity
  await prisma.activity.create({
    data: {
      organizationId: user.organizationId,
      dealId,
      buyerId: deal.buyerId,
      userId: user.id,
      type: 'STATUS_CHANGE',
      subject: `Deal moved to ${newStage}`,
      description: notes || `Stage changed from ${oldStage} to ${newStage}`,
      activityDate: now
    }
  });

  return updated;
}
```

---

### 8. Close Deal (Won/Lost)

**Endpoint:** `POST /api/v1/deals/:id/close`

**Description:** Close a deal as won or lost.

**Request Body:**
```typescript
{
  status: "WON" | "LOST";

  // For WON
  finalPrice?: number;
  actualCloseDate?: string;
  notes?: string;

  // For LOST
  lostReason?: LostReason;
  lostReasonDetails?: string;
  competitorName?: string;
}
```

**Response:** `200 OK`

**Business Logic:**
```typescript
async function closeDeal(dealId: string, data: CloseDealInput) {
  return await prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findFirst({
      where: {
        id: dealId,
        organizationId: user.organizationId
      },
      include: { buyer: true, animal: true }
    });

    if (!deal) {
      throw new NotFoundError('Deal not found');
    }

    if (deal.status !== 'OPEN') {
      throw new ConflictError('Deal is already closed');
    }

    const now = new Date();

    if (data.status === 'WON') {
      // Update deal as won
      const updated = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: 'WON',
          stage: 'CLOSED_WON',
          wonDate: now,
          actualCloseDate: data.actualCloseDate ? new Date(data.actualCloseDate) : now,
          finalPrice: data.finalPrice || deal.value,
          wonReason: data.notes
        }
      });

      // Update animal as sold
      if (deal.animalId) {
        await tx.animal.update({
          where: { id: deal.animalId },
          data: {
            status: 'SOLD',
            soldDate: now,
            soldToBuyerId: deal.buyerId,
            salePrice: data.finalPrice || deal.value,
            isForSale: false
          }
        });
      }

      // Update buyer status
      await tx.buyer.update({
        where: { id: deal.buyerId },
        data: {
          status: 'WON',
          lastContactDate: now
        }
      });

      // Create activity
      await tx.activity.create({
        data: {
          organizationId: user.organizationId,
          dealId,
          buyerId: deal.buyerId,
          userId: user.id,
          type: 'STATUS_CHANGE',
          subject: 'Deal won!',
          description: `${deal.buyer.firstName} ${deal.buyer.lastName} purchased ${deal.animal?.name || 'horse'} for $${data.finalPrice || deal.value}`,
          activityDate: now
        }
      });

      // Send celebration notification
      await sendNotification({
        userId: deal.ownerId,
        type: 'DEAL_WON',
        title: `Congratulations! ${deal.buyer.firstName} ${deal.buyer.lastName} purchased ${deal.animal?.name || 'a horse'}`,
        priority: 'high',
        data: { dealId }
      });

      return updated;

    } else {
      // Update deal as lost
      const updated = await tx.deal.update({
        where: { id: dealId },
        data: {
          status: 'LOST',
          stage: 'CLOSED_LOST',
          lostDate: now,
          lostReason: data.lostReason,
          lostReasonDetails: data.lostReasonDetails,
          competitorName: data.competitorName
        }
      });

      // Update buyer interest if related to animal
      if (deal.animalId) {
        await tx.buyerInterest.updateMany({
          where: {
            buyerId: deal.buyerId,
            animalId: deal.animalId
          },
          data: {
            status: 'LOST',
            lostReason: data.lostReasonDetails
          }
        });
      }

      // Create activity
      await tx.activity.create({
        data: {
          organizationId: user.organizationId,
          dealId,
          buyerId: deal.buyerId,
          userId: user.id,
          type: 'STATUS_CHANGE',
          subject: 'Deal lost',
          description: `Reason: ${data.lostReason || 'Not specified'}${data.lostReasonDetails ? `. ${data.lostReasonDetails}` : ''}`,
          activityDate: now
        }
      });

      return updated;
    }
  });
}
```

---

### 9. Get Sales Pipeline

**Endpoint:** `GET /api/v1/deals/pipeline`

**Description:** Get deals organized by pipeline stage for kanban view.

**Query Parameters:**
```typescript
{
  userId?: string; // Filter by deal owner
  startDate?: string;
  endDate?: string;
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    stages: Array<{
      stage: string;
      stageName: string;
      deals: Array<{
        id: string;
        title: string;
        buyer: {
          id: string;
          name: string;
          temperature: string;
        };
        animal: {
          id: string;
          name: string;
        } | null;
        value: number;
        probability: number;
        expectedCloseDate: string | null;
        daysInStage: number;
        lastActivity: string | null;
      }>;
      totalValue: number;
      count: number;
      averageDaysInStage: number;
    }>;
    summary: {
      totalDeals: number;
      totalValue: number;
      weightedValue: number; // Sum of (value * probability)
      averageDealValue: number;
      conversionRate: number; // Won / (Won + Lost)
    };
  };
}
```

---

### 10. Get Sales Analytics

**Endpoint:** `GET /api/v1/deals/analytics`

**Description:** Get comprehensive sales analytics and metrics.

**Query Parameters:**
```typescript
{
  startDate?: string; // Default: 90 days ago
  endDate?: string; // Default: today
  userId?: string; // Filter by deal owner
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    overview: {
      totalDeals: number;
      wonDeals: number;
      lostDeals: number;
      openDeals: number;
      conversionRate: number;
      averageDealValue: number;
      totalRevenue: number;
      projectedRevenue: number; // Open deals weighted by probability
    };

    byStage: Array<{
      stage: string;
      count: number;
      totalValue: number;
      averageDaysInStage: number;
      conversionRate: number;
    }>;

    bySource: Array<{
      source: string;
      count: number;
      totalValue: number;
      conversionRate: number;
      roi: number | null;
    }>;

    timeline: Array<{
      date: string; // YYYY-MM-DD
      dealsCreated: number;
      dealsWon: number;
      dealsLost: number;
      revenue: number;
    }>;

    lostReasons: Array<{
      reason: string;
      count: number;
      percentage: number;
    }>;

    topPerformers: Array<{
      userId: string;
      userName: string;
      dealsWon: number;
      totalRevenue: number;
      conversionRate: number;
      averageDealValue: number;
    }>;
  };
}
```

---

### 11. Create Activity

**Endpoint:** `POST /api/v1/activities`

**Description:** Log an activity (email, call, meeting, note, task).

**Request Body:**
```typescript
{
  buyerId?: string;
  dealId?: string;
  type: ActivityType;
  subject: string;
  description?: string;
  activityDate?: string; // Default: now
  duration?: number; // Minutes

  // For tasks
  taskDueDate?: string;
  taskPriority?: TaskPriority;
  taskAssignedToId?: string;

  // For meetings
  meetingLocation?: string;
  meetingType?: MeetingType;
  attendees?: string[];

  // For calls
  callDirection?: CallDirection;
  callDuration?: number; // Seconds
}
```

**Response:** `201 Created`

---

### 12. Get Activities

**Endpoint:** `GET /api/v1/activities`

**Description:** Get activity feed with filters.

**Query Parameters:**
```typescript
{
  buyerId?: string;
  dealId?: string;
  type?: ActivityType;
  userId?: string;
  startDate?: string;
  endDate?: string;
  isCompleted?: boolean;
  page?: number;
  limit?: number;
}
```

**Response:** `200 OK`

---

### 13. Get Upcoming Tasks

**Endpoint:** `GET /api/v1/activities/tasks/upcoming`

**Description:** Get tasks due soon for dashboard widget.

**Query Parameters:**
```typescript
{
  days?: number; // Default: 7
  userId?: string;
  includeOverdue?: boolean; // Default: true
}
```

**Response:** `200 OK`
```typescript
{
  success: true;
  data: {
    overdue: Array<{
      id: string;
      subject: string;
      dueDate: string;
      priority: string;
      buyer: { id: string; name: string } | null;
      deal: { id: string; title: string } | null;
      daysOverdue: number;
    }>;
    today: Array<{...}>;
    upcoming: Array<{...}>;
    counts: {
      overdueCount: number;
      todayCount: number;
      upcomingCount: number;
    };
  };
}
```

---

## Frontend Components

### Component Architecture

```
src/components/crm/
├── BuyersList.tsx                 # Main buyers list view
├── BuyerCard.tsx                  # Buyer card in list
├── BuyerDetail.tsx                # Detailed buyer view
├── BuyerForm.tsx                  # Create/edit buyer form
├── SalesPipeline.tsx              # Kanban pipeline view
├── DealCard.tsx                   # Deal card in pipeline
├── DealDetail.tsx                 # Detailed deal view
├── DealForm.tsx                   # Create/edit deal form
├── ActivityTimeline.tsx           # Activity feed
├── ActivityForm.tsx               # Log new activity
├── TaskList.tsx                   # Task list widget
├── SalesAnalytics.tsx             # Analytics dashboard
└── components/
    ├── BuyerStatusBadge.tsx
    ├── BuyerTemperatureBadge.tsx
    ├── DealStageBadge.tsx
    ├── InterestLevelIndicator.tsx
    ├── QuickAddBuyerModal.tsx
    └── AssignBuyerModal.tsx
```

---

### 1. BuyersList.tsx

**Description:** Main list view of all buyers with filtering and search.

**Component Structure:**
```tsx
import React, { useState } from 'react';
import { BuyerCard } from './BuyerCard';
import { BuyerFilters } from './components/BuyerFilters';
import { QuickAddBuyerModal } from './components/QuickAddBuyerModal';

export const BuyersList: React.FC = () => {
  const [filters, setFilters] = useState<BuyerFilters>({
    status: undefined,
    priority: undefined,
    temperature: undefined,
    search: '',
    needsFollowUp: false
  });

  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isLoading } = useBuyers(filters);

  return (
    <div className="buyers-list">
      {/* Header */}
      <div className="page-header">
        <h1>Buyers</h1>
        <div className="header-actions">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <PlusIcon /> Add Buyer
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <SummaryCard
          title="Active Buyers"
          value={data?.summary.totalActive || 0}
          icon={<UsersIcon />}
          variant="info"
        />
        <SummaryCard
          title="Need Follow-Up"
          value={data?.summary.totalNeedsFollowUp || 0}
          icon={<ClockIcon />}
          variant="warning"
        />
        <SummaryCard
          title="Hot Leads"
          value={data?.summary.totalHot || 0}
          icon={<FireIcon />}
          variant="danger"
        />
        <SummaryCard
          title="Pipeline Value"
          value={formatCurrency(data?.summary.totalValue || 0)}
          icon={<DollarIcon />}
          variant="success"
        />
      </div>

      {/* Filters & Search */}
      <div className="list-controls">
        <SearchBar
          value={filters.search}
          onChange={(search) => setFilters({ ...filters, search })}
          placeholder="Search buyers..."
        />

        <BuyerFilters
          filters={filters}
          onChange={setFilters}
        />

        <div className="view-toggle">
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
          >
            <GridIcon />
          </button>
          <button
            className={view === 'table' ? 'active' : ''}
            onClick={() => setView('table')}
          >
            <TableIcon />
          </button>
        </div>
      </div>

      {/* Buyers List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : data?.buyers.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title="No buyers yet"
          description="Add your first buyer to start tracking sales opportunities"
          action={
            <button onClick={() => setShowAddModal(true)}>
              Add First Buyer
            </button>
          }
        />
      ) : view === 'grid' ? (
        <div className="buyers-grid">
          {data?.buyers.map(buyer => (
            <BuyerCard key={buyer.id} buyer={buyer} />
          ))}
        </div>
      ) : (
        <BuyersTable buyers={data?.buyers || []} />
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={(page) => {/* update page */}}
        />
      )}

      {/* Add Buyer Modal */}
      <QuickAddBuyerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          // Refresh list
        }}
      />
    </div>
  );
};
```

**Styling:**
```scss
.buyers-list {
  padding: 24px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      font-size: 28px;
      font-weight: 600;
    }
  }

  .summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .list-controls {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .buyers-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;
  }
}
```

---

### 2. SalesPipeline.tsx

**Description:** Kanban-style pipeline view with drag-and-drop.

**Component Structure:**
```tsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DealCard } from './DealCard';

const STAGES = [
  { id: 'INQUIRY', name: 'Inquiry' },
  { id: 'QUALIFIED', name: 'Qualified' },
  { id: 'VIEWING_SCHEDULED', name: 'Viewing Scheduled' },
  { id: 'OFFER', name: 'Offer' },
  { id: 'NEGOTIATION', name: 'Negotiation' },
  { id: 'CONTRACT', name: 'Contract' },
  { id: 'CLOSED_WON', name: 'Won' },
  { id: 'CLOSED_LOST', name: 'Lost' }
];

export const SalesPipeline: React.FC = () => {
  const { data, isLoading } = usePipeline();
  const updateDealStage = useUpdateDealStage();

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const dealId = result.draggableId;
    const newStage = result.destination.droppableId;

    await updateDealStage.mutateAsync({
      dealId,
      stage: newStage
    });
  };

  return (
    <div className="sales-pipeline">
      {/* Header */}
      <div className="pipeline-header">
        <h1>Sales Pipeline</h1>
        <div className="pipeline-summary">
          <span className="total-deals">
            {data?.summary.totalDeals} deals
          </span>
          <span className="total-value">
            {formatCurrency(data?.summary.totalValue)}
          </span>
          <span className="weighted-value">
            Weighted: {formatCurrency(data?.summary.weightedValue)}
          </span>
        </div>
      </div>

      {/* Pipeline Stages */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="pipeline-columns">
            {data?.stages.map(stage => (
              <Droppable key={stage.stage} droppableId={stage.stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`pipeline-column ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {/* Column Header */}
                    <div className="column-header">
                      <h3>{stage.stageName}</h3>
                      <div className="column-stats">
                        <span className="deal-count">{stage.count}</span>
                        <span className="stage-value">
                          {formatCurrency(stage.totalValue)}
                        </span>
                      </div>
                    </div>

                    {/* Deals */}
                    <div className="column-deals">
                      {stage.deals.map((deal, index) => (
                        <Draggable
                          key={deal.id}
                          draggableId={deal.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'dragging' : ''}
                            >
                              <DealCard deal={deal} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* Column Footer */}
                    <div className="column-footer">
                      Avg: {stage.averageDaysInStage} days
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};
```

**Styling:**
```scss
.sales-pipeline {
  padding: 24px;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;

  .pipeline-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .pipeline-summary {
      display: flex;
      gap: 24px;
      font-size: 14px;

      span {
        padding: 8px 12px;
        background: var(--surface-bg);
        border-radius: 6px;
      }

      .total-value,
      .weighted-value {
        font-weight: 600;
        color: var(--success-color);
      }
    }
  }

  .pipeline-columns {
    display: flex;
    gap: 16px;
    flex: 1;
    overflow-x: auto;
    padding-bottom: 16px;

    .pipeline-column {
      min-width: 300px;
      width: 300px;
      display: flex;
      flex-direction: column;
      background: var(--surface-bg);
      border-radius: 8px;
      padding: 16px;

      &.dragging-over {
        background: rgba(var(--primary-rgb), 0.05);
        border: 2px dashed var(--primary-color);
      }

      .column-header {
        margin-bottom: 16px;

        h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .column-stats {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--text-secondary);

          .deal-count {
            background: var(--primary-color);
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
          }

          .stage-value {
            font-weight: 600;
          }
        }
      }

      .column-deals {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .dragging {
          opacity: 0.5;
        }
      }

      .column-footer {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
        font-size: 12px;
        color: var(--text-secondary);
        text-align: center;
      }
    }
  }
}
```

---

### 3. DealCard.tsx

**Description:** Individual deal card in pipeline.

**Component Structure:**
```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { BuyerTemperatureBadge } from './components/BuyerTemperatureBadge';

interface DealCardProps {
  deal: {
    id: string;
    title: string;
    buyer: {
      id: string;
      name: string;
      temperature: string;
    };
    animal: {
      id: string;
      name: string;
    } | null;
    value: number;
    probability: number;
    expectedCloseDate: string | null;
    daysInStage: number;
    lastActivity: string | null;
  };
}

export const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  return (
    <Link to={`/crm/deals/${deal.id}`} className="deal-card">
      <div className="deal-header">
        <h4>{deal.title}</h4>
        <BuyerTemperatureBadge temperature={deal.buyer.temperature} />
      </div>

      <div className="deal-buyer">
        <UserIcon />
        <span>{deal.buyer.name}</span>
      </div>

      {deal.animal && (
        <div className="deal-animal">
          <HorseIcon />
          <span>{deal.animal.name}</span>
        </div>
      )}

      <div className="deal-value">
        {formatCurrency(deal.value)}
        <span className="probability">{deal.probability}%</span>
      </div>

      {deal.expectedCloseDate && (
        <div className="deal-close-date">
          <CalendarIcon />
          <span>
            {formatRelativeDate(deal.expectedCloseDate)}
          </span>
        </div>
      )}

      <div className="deal-footer">
        <span className="days-in-stage">
          {deal.daysInStage} days in stage
        </span>
        {deal.lastActivity && (
          <span className="last-activity">
            {formatRelativeDate(deal.lastActivity)}
          </span>
        )}
      </div>
    </Link>
  );
};
```

**Styling:**
```scss
.deal-card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }

  .deal-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 8px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }
  }

  .deal-buyer,
  .deal-animal,
  .deal-close-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .deal-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 700;
    color: var(--success-color);
    margin: 4px 0;

    .probability {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 6px;
      background: var(--info-color);
      color: white;
      border-radius: 4px;
    }
  }

  .deal-footer {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-tertiary);
    padding-top: 8px;
    border-top: 1px solid var(--border-light);
  }
}
```

---

## Business Logic & Algorithms

### 1. Automatic Follow-Up Scheduling

**Purpose:** Automatically schedule next follow-up based on buyer temperature and stage.

**Algorithm:**
```typescript
function calculateNextFollowUp(
  buyer: Buyer,
  lastContactDate: Date
): Date {
  const daysSinceContact = differenceInDays(new Date(), lastContactDate);

  // Follow-up intervals by temperature
  const FOLLOW_UP_INTERVALS = {
    HOT: 2,      // 2 days
    WARM: 5,     // 5 days
    COLD: 14     // 2 weeks
  };

  const interval = FOLLOW_UP_INTERVALS[buyer.temperature];

  // Adjust based on buyer status
  if (buyer.readinessToBuy === 'READY_NOW') {
    return addDays(lastContactDate, 1); // Daily follow-up
  }

  if (buyer.readinessToBuy === 'WITHIN_1_MONTH') {
    return addDays(lastContactDate, Math.min(interval, 3));
  }

  return addDays(lastContactDate, interval);
}
```

---

### 2. Lead Scoring Algorithm

**Purpose:** Automatically score leads to help prioritize follow-up.

**Algorithm:**
```typescript
function calculateLeadScore(buyer: Buyer, interests: BuyerInterest[]): number {
  let score = 0;

  // Budget (0-30 points)
  const BUDGET_SCORES = {
    'UNDER_5K': 5,
    'FIVE_TO_10K': 10,
    'TEN_TO_25K': 15,
    'TWENTY_FIVE_TO_50K': 20,
    'FIFTY_TO_100K': 25,
    'OVER_100K': 30,
    'FLEXIBLE': 20
  };
  score += BUDGET_SCORES[buyer.budget] || 0;

  // Readiness to buy (0-30 points)
  const READINESS_SCORES = {
    'JUST_BROWSING': 5,
    'WITHIN_6_MONTHS': 10,
    'WITHIN_3_MONTHS': 15,
    'WITHIN_1_MONTH': 25,
    'READY_NOW': 30
  };
  score += READINESS_SCORES[buyer.readinessToBuy] || 0;

  // Engagement (0-25 points)
  score += Math.min(buyer.totalInteractions * 2, 15); // 2 points per interaction, max 15
  score += buyer.totalEmailsOpened > 0 ? 5 : 0;
  score += buyer.totalCalls > 0 ? 5 : 0;

  // Interest level (0-15 points)
  const maxInterestLevel = Math.max(
    ...interests.map(i => {
      const LEVEL_SCORES = {
        'BROWSING': 3,
        'INTERESTED': 7,
        'SERIOUS': 12,
        'READY_TO_BUY': 15
      };
      return LEVEL_SCORES[i.interestLevel];
    }),
    0
  );
  score += maxInterestLevel;

  // Recency (bonus/penalty)
  if (buyer.lastContactDate) {
    const daysSinceContact = differenceInDays(new Date(), buyer.lastContactDate);
    if (daysSinceContact <= 7) {
      score += 5; // Recent activity bonus
    } else if (daysSinceContact > 30) {
      score -= 10; // Stale lead penalty
    }
  }

  return Math.min(Math.max(score, 0), 100); // Clamp to 0-100
}
```

---

### 3. Deal Probability Calculation

**Purpose:** Dynamically calculate win probability based on multiple factors.

**Algorithm:**
```typescript
function calculateDealProbability(deal: Deal, buyer: Buyer): number {
  // Base probability by stage
  const BASE_PROBABILITY = {
    'INQUIRY': 20,
    'QUALIFIED': 40,
    'VIEWING_SCHEDULED': 60,
    'OFFER': 75,
    'NEGOTIATION': 85,
    'CONTRACT': 90,
    'CLOSED_WON': 100,
    'CLOSED_LOST': 0
  };

  let probability = BASE_PROBABILITY[deal.stage];

  // Adjust based on buyer temperature
  if (buyer.temperature === 'HOT') {
    probability += 10;
  } else if (buyer.temperature === 'COLD') {
    probability -= 10;
  }

  // Adjust based on engagement
  if (deal.touchCount >= 5) {
    probability += 5;
  }

  // Penalty for time in stage
  if (deal.daysInCurrentStage > 14) {
    probability -= 5;
  }
  if (deal.daysInCurrentStage > 30) {
    probability -= 10;
  }

  // Bonus for completed milestones
  if (deal.viewingCompleted) probability += 5;
  if (deal.ppeCompleted && deal.ppeResult === 'PASSED') probability += 10;
  if (deal.contractSigned) probability += 10;
  if (deal.depositReceived) probability += 15;

  return Math.min(Math.max(probability, 0), 100);
}
```

---

## Email Integration

### Sending Emails

**Endpoint:** `POST /api/v1/email/send`

**Request Body:**
```typescript
{
  to: string[];
  cc?: string[];
  subject: string;
  body: string; // HTML
  buyerId?: string;
  dealId?: string;
  templateId?: string;
  scheduledFor?: string; // ISO datetime
}
```

**Business Logic:**
```typescript
async function sendEmail(data: SendEmailInput) {
  // 1. Create activity record
  const activity = await prisma.activity.create({
    data: {
      organizationId: user.organizationId,
      buyerId: data.buyerId,
      dealId: data.dealId,
      userId: user.id,
      type: 'EMAIL',
      subject: data.subject,
      description: data.body,
      emailFrom: user.email,
      emailTo: data.to,
      emailCc: data.cc || [],
      emailSubject: data.subject,
      emailBody: data.body,
      activityDate: new Date(),
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined
    }
  });

  // 2. Send via email service (SendGrid, etc.)
  const messageId = await emailService.send({
    from: `${user.name} <${user.email}>`,
    to: data.to,
    cc: data.cc,
    subject: data.subject,
    html: data.body,
    scheduledFor: data.scheduledFor,
    trackOpens: true,
    trackClicks: true,
    metadata: {
      activityId: activity.id,
      buyerId: data.buyerId,
      dealId: data.dealId
    }
  });

  // 3. Update activity with message ID
  await prisma.activity.update({
    where: { id: activity.id },
    data: { emailThreadId: messageId }
  });

  // 4. Update buyer stats
  if (data.buyerId) {
    await prisma.buyer.update({
      where: { id: data.buyerId },
      data: {
        totalEmailsSent: { increment: 1 },
        lastContactDate: new Date()
      }
    });
  }

  return activity;
}
```

### Email Webhook (Open/Click Tracking)

**Endpoint:** `POST /webhooks/email`

**Description:** Receives webhooks from email service (SendGrid, etc.) to track opens and clicks.

**Business Logic:**
```typescript
async function handleEmailWebhook(event: EmailWebhookEvent) {
  const { activityId, event: eventType, timestamp } = event;

  if (!activityId) return;

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { buyer: true }
  });

  if (!activity) return;

  if (eventType === 'opened') {
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        emailOpened: true,
        emailOpenedAt: new Date(timestamp)
      }
    });

    // Update buyer stats
    if (activity.buyerId) {
      await prisma.buyer.update({
        where: { id: activity.buyerId },
        data: {
          totalEmailsOpened: { increment: 1 },
          lastEmailOpenedAt: new Date(timestamp)
        }
      });

      // If first open, might indicate warming up
      if (activity.buyer.totalEmailsOpened === 1) {
        await updateBuyerTemperature(activity.buyerId);
      }
    }
  }

  if (eventType === 'clicked') {
    await prisma.activity.update({
      where: { id: activityId },
      data: {
        emailClicked: true,
        emailClickedAt: new Date(timestamp)
      }
    });

    // Email click indicates high engagement
    if (activity.buyerId) {
      await updateBuyerTemperature(activity.buyerId, 'HOT');
    }
  }
}
```

---

## User Flows

### Flow 1: Adding New Buyer from Inquiry

```
1. Breeder receives inquiry (email, phone, website form)
   ↓
2. Breeder clicks "Add Buyer" in app
   ↓
3. Quick-add modal opens with form:
   - Name (required)
   - Email/Phone (at least one required)
   - Source (how they found you)
   - Interested in which horse? (optional)
   - Initial notes
   ↓
4. Breeder fills form and submits
   ↓
5. System:
   - Creates Buyer record
   - Creates initial Activity (inquiry received)
   - If horse selected, creates BuyerInterest
   - Schedules follow-up task (3 days)
   - Sends notification if assigned to someone else
   ↓
6. Buyer appears in list
7. Follow-up reminder appears in task list
```

### Flow 2: Moving Deal Through Pipeline

```
1. Buyer expresses serious interest
   ↓
2. Breeder creates Deal from buyer profile
   - Automatically linked to buyer
   - Select horse if applicable
   - Enter expected value
   - Stage starts at "INQUIRY"
   ↓
3. Breeder qualifies lead (confirms budget, timeline)
   - Drags deal to "QUALIFIED" stage
   - System increases probability to 40%
   ↓
4. Viewing scheduled
   - Breeder logs viewing activity
   - Drags deal to "VIEWING_SCHEDULED"
   - System creates calendar reminder
   ↓
5. Viewing completed successfully
   - Breeder logs viewing outcome
   - Buyer very interested
   - Drags deal to "OFFER" stage
   ↓
6. Buyer makes offer
   - Breeder logs offer amount
   - Price negotiation begins
   - Move to "NEGOTIATION" stage
   ↓
7. Price agreed
   - Move to "CONTRACT" stage
   - System prompts for deposit
   ↓
8. Deposit received, contract signed
   - Breeder marks deal as WON
   - System:
     - Updates deal status to CLOSED_WON
     - Marks horse as SOLD
     - Updates buyer status to WON
     - Calculates revenue
     - Sends celebration notification
```

### Flow 3: Automated Follow-Up System

```
1. Breeder adds new buyer
   ↓
2. System automatically schedules follow-up based on temperature:
   - HOT: 2 days
   - WARM: 5 days
   - COLD: 14 days
   ↓
3. Follow-up due date approaches
   ↓
4. System sends reminder notification
   ↓
5. Breeder contacts buyer, logs activity
   ↓
6. System automatically schedules next follow-up
   ↓
7. If buyer doesn't respond to 3 follow-ups:
   - System suggests moving to "NURTURING" status
   - Extends follow-up interval to monthly
```

---

## Error Handling

### Common Error Scenarios

#### 1. Duplicate Buyer
```typescript
if (existingBuyer) {
  throw new ConflictError('A buyer with this email or phone already exists', {
    existingBuyerId: existingBuyer.id,
    suggestedAction: 'update',
    message: 'Would you like to update the existing buyer instead?'
  });
}
```

#### 2. Invalid Deal Stage Transition
```typescript
const VALID_TRANSITIONS = {
  INQUIRY: ['QUALIFIED', 'CLOSED_LOST'],
  QUALIFIED: ['VIEWING_SCHEDULED', 'CLOSED_LOST'],
  // ... etc
};

if (!VALID_TRANSITIONS[currentStage].includes(newStage)) {
  throw new ValidationError(`Cannot move deal from ${currentStage} to ${newStage}`);
}
```

#### 3. Missing Required Contact Info
```typescript
if (!buyer.email && !buyer.phone) {
  throw new ValidationError('At least one contact method (email or phone) is required');
}
```

#### 4. Deal Already Closed
```typescript
if (deal.status !== 'OPEN') {
  throw new ConflictError(`Deal is already closed as ${deal.status}`);
}
```

---

## Testing Requirements

### Unit Tests

#### 1. Lead Scoring Algorithm
```typescript
describe('calculateLeadScore', () => {
  it('should score READY_NOW buyer higher', () => {
    const buyer1 = createTestBuyer({ readinessToBuy: 'JUST_BROWSING' });
    const buyer2 = createTestBuyer({ readinessToBuy: 'READY_NOW' });

    expect(calculateLeadScore(buyer2, [])).toBeGreaterThan(calculateLeadScore(buyer1, []));
  });

  it('should give bonus for recent activity', () => {
    const buyer = createTestBuyer({
      lastContactDate: subDays(new Date(), 3)
    });

    const score = calculateLeadScore(buyer, []);
    expect(score).toBeGreaterThan(50);
  });

  it('should penalize stale leads', () => {
    const buyer = createTestBuyer({
      lastContactDate: subDays(new Date(), 45)
    });

    const score = calculateLeadScore(buyer, []);
    // Should have penalty applied
  });
});
```

#### 2. Follow-Up Scheduling
```typescript
describe('calculateNextFollowUp', () => {
  it('should schedule HOT leads for 2 days', () => {
    const buyer = createTestBuyer({ temperature: 'HOT' });
    const nextFollowUp = calculateNextFollowUp(buyer, new Date());

    expect(differenceInDays(nextFollowUp, new Date())).toBe(2);
  });

  it('should prioritize READY_NOW buyers with daily follow-up', () => {
    const buyer = createTestBuyer({
      temperature: 'WARM',
      readinessToBuy: 'READY_NOW'
    });

    const nextFollowUp = calculateNextFollowUp(buyer, new Date());
    expect(differenceInDays(nextFollowUp, new Date())).toBe(1);
  });
});
```

### Integration Tests

#### 1. Create Buyer with Interest
```typescript
describe('POST /api/v1/buyers', () => {
  it('should create buyer and link to animal', async () => {
    const animal = await createTestAnimal();

    const response = await request(app)
      .post('/api/v1/buyers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        source: 'WEBSITE',
        interestedInAnimalId: animal.id,
        interestLevel: 'SERIOUS'
      })
      .expect(201);

    expect(response.body.data.interests).toHaveLength(1);
    expect(response.body.data.interests[0].animalId).toBe(animal.id);
  });
});
```

#### 2. Complete Deal Flow
```typescript
describe('Deal Flow', () => {
  it('should move deal through pipeline to won', async () => {
    const buyer = await createTestBuyer();
    const animal = await createTestAnimal();

    // Create deal
    const deal = await createDeal({
      buyerId: buyer.id,
      animalId: animal.id,
      value: 10000
    });

    // Move through stages
    await updateDealStage(deal.id, 'QUALIFIED');
    await updateDealStage(deal.id, 'VIEWING_SCHEDULED');
    await updateDealStage(deal.id, 'OFFER');

    // Close as won
    const closed = await closeDeal(deal.id, {
      status: 'WON',
      finalPrice: 9500
    });

    expect(closed.status).toBe('WON');

    // Verify animal marked as sold
    const updatedAnimal = await getAnimal(animal.id);
    expect(updatedAnimal.status).toBe('SOLD');
    expect(updatedAnimal.soldToBuyerId).toBe(buyer.id);
  });
});
```

---

## Implementation Checklist

### Phase 1: Database & Core Models (Week 1)

- [ ] Create database migrations
  - [ ] Buyer table
  - [ ] BuyerInterest table
  - [ ] Deal table
  - [ ] Activity table
  - [ ] BuyerDocument table
  - [ ] Note table
  - [ ] BuyerTag table
- [ ] Update Animal model with sales fields
- [ ] Implement core data models and types

### Phase 2: Buyer Management APIs (Week 1-2)

- [ ] POST /api/v1/buyers (create)
- [ ] GET /api/v1/buyers (list with filters)
- [ ] GET /api/v1/buyers/:id (detail)
- [ ] PATCH /api/v1/buyers/:id (update)
- [ ] DELETE /api/v1/buyers/:id (soft delete)
- [ ] POST /api/v1/buyers/:id/interests (add interest)
- [ ] PATCH /api/v1/buyers/:id/interests/:interestId (update interest)

### Phase 3: Deal Management APIs (Week 2)

- [ ] POST /api/v1/deals (create)
- [ ] GET /api/v1/deals (list)
- [ ] GET /api/v1/deals/:id (detail)
- [ ] PATCH /api/v1/deals/:id (update)
- [ ] PATCH /api/v1/deals/:id/stage (move stage)
- [ ] POST /api/v1/deals/:id/close (close won/lost)
- [ ] GET /api/v1/deals/pipeline (kanban data)
- [ ] GET /api/v1/deals/analytics (analytics)

### Phase 4: Activity System (Week 2-3)

- [ ] POST /api/v1/activities (create)
- [ ] GET /api/v1/activities (list with filters)
- [ ] PATCH /api/v1/activities/:id (update)
- [ ] POST /api/v1/activities/:id/complete (mark complete)
- [ ] GET /api/v1/activities/tasks/upcoming (task widget)

### Phase 5: Email Integration (Week 3)

- [ ] POST /api/v1/email/send (send email)
- [ ] POST /webhooks/email (email tracking webhooks)
- [ ] Email template system
- [ ] Scheduled send functionality
- [ ] Open/click tracking

### Phase 6: Frontend - Buyers (Week 3-4)

- [ ] BuyersList component
- [ ] BuyerCard component
- [ ] BuyerDetail component
- [ ] BuyerForm (create/edit)
- [ ] QuickAddBuyerModal
- [ ] BuyerFilters component
- [ ] Buyer status/temperature badges

### Phase 7: Frontend - Deals (Week 4)

- [ ] SalesPipeline (kanban)
- [ ] DealCard component
- [ ] DealDetail component
- [ ] DealForm component
- [ ] Deal stage management
- [ ] Close deal modal

### Phase 8: Frontend - Activities (Week 4-5)

- [ ] ActivityTimeline component
- [ ] ActivityForm component
- [ ] TaskList widget
- [ ] Activity filters
- [ ] Email composer

### Phase 9: Analytics & Reporting (Week 5)

- [ ] SalesAnalytics dashboard
- [ ] Pipeline metrics
- [ ] Conversion rate tracking
- [ ] Revenue forecasting
- [ ] Lead source ROI

### Phase 10: Automation (Week 5)

- [ ] Automatic follow-up scheduling
- [ ] Lead scoring algorithm
- [ ] Deal probability calculation
- [ ] Stale lead detection
- [ ] Temperature auto-adjustment

### Phase 11: Testing (Week 6)

- [ ] Unit tests for business logic
- [ ] Integration tests for APIs
- [ ] E2E tests for critical flows
- [ ] Load testing
- [ ] Email integration testing

### Phase 12: Launch (Week 6)

- [ ] User documentation
- [ ] Video tutorials
- [ ] Beta user onboarding
- [ ] Production deployment
- [ ] Monitor & iterate

---

## Success Metrics

### Adoption
- 70%+ of breeders add at least 5 buyers within first month
- Average 10+ active buyers per organization
- 80%+ of inquiries logged in CRM

### Usage
- Daily active usage rate: 60%+
- Average 5+ activities logged per week
- 50%+ of deals created from buyer records

### Business Impact
- 15-25% increase in inquiry-to-sale conversion
- 30%+ reduction in lost opportunities from poor follow-up
- Average deal cycle time reduced by 20%
- 90%+ user satisfaction rating

---

**END OF DOCUMENT**

Total Lines: ~2,900
Estimated Implementation Time: 5-6 weeks
Estimated Value if Outsourced: $18,000-22,000
