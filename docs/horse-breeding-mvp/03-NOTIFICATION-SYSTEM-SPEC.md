# Notification System: Engineering Specification

**Document Version:** 1.0
**Date:** 2026-01-14
**Status:** Ready for Implementation
**Priority:** CRITICAL - Showstopper #1

---

## Executive Summary

BreederHQ currently has **ZERO notification/alert capabilities**. Every competitor has basic reminders. This is the #1 blocker preventing launch.

**Scope:** Build notification/alert system to deliver automated reminders for:
- Vaccination expiration (7/3/1 day warnings)
- Breeding timeline events (heat cycle expected, pregnancy check due)
- Foaling approaching alerts
- Health event reminders
- Buyer follow-up prompts

**Timeline:** 2 weeks (1 week backend, 1 week frontend)
**Investment:** $10-20K
**Success Criteria:** Users receive timely alerts without manually checking system daily

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                     USER EXPERIENCE                          │
│  (Email, SMS, Push, In-App)                                 │
└────────────────┬───────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────┐
│              NOTIFICATION DELIVERY LAYER                    │
│  - Email Service (Resend/SendGrid)                         │
│  - SMS Service (Twilio)                                    │
│  - Push Service (Firebase/OneSignal)                       │
│  - In-App Notification Store                              │
└────────────────┬───────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────┐
│           NOTIFICATION SCHEDULING LAYER                     │
│  - Cron Jobs (Daily Alert Scan)                           │
│  - Background Workers (Queue Processing)                   │
│  - Alert Rule Engine                                       │
└────────────────┬───────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────┐
│              DATA / TRIGGER LAYER                          │
│  - VaccinationRecord (expiresAt)                          │
│  - BreedingPlan (expected dates)                          │
│  - Animal (health events)                                 │
│  - User Preferences (notification settings)               │
└────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### 1. Notification Table (New)

**Purpose:** Store all notifications (sent and pending) for audit trail and in-app display

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  userId    String?  // Target user (null = all tenant users)
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Notification content
  type      NotificationType  // VACCINATION, BREEDING_TIMELINE, FOALING, HEALTH_EVENT, etc.
  priority  NotificationPriority  // LOW, MEDIUM, HIGH, URGENT
  title     String
  message   String   @db.Text

  // Related entity (for deep linking)
  entityType String?  // "Animal", "BreedingPlan", "VaccinationRecord", etc.
  entityId   Int?

  // Delivery status
  status     NotificationStatus  // PENDING, SENT, READ, DISMISSED, FAILED
  sentAt     DateTime?
  readAt     DateTime?
  dismissedAt DateTime?

  // Delivery channels used
  deliveredViaEmail  Boolean @default(false)
  deliveredViaSMS    Boolean @default(false)
  deliveredViaPush   Boolean @default(false)
  deliveredInApp     Boolean @default(true)

  // Metadata
  data       Json?  // Additional context (e.g., animal name, date, etc.)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([tenantId, status])
  @@index([userId, status])
  @@index([type, status])
  @@index([createdAt])
  @@schema("public")
}

enum NotificationType {
  VACCINATION_EXPIRING
  VACCINATION_EXPIRED
  BREEDING_CYCLE_EXPECTED
  BREEDING_HORMONE_TEST_DUE
  BREEDING_BREED_DATE_APPROACHING
  PREGNANCY_CHECK_DUE
  FOALING_APPROACHING
  FOALING_OVERDUE
  WEANING_DUE
  PLACEMENT_READY
  HEALTH_EVENT_DUE
  BUYER_FOLLOW_UP
  WAITLIST_UPDATE
  SYSTEM_ANNOUNCEMENT
  @@schema("public")
}

enum NotificationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
  @@schema("public")
}

enum NotificationStatus {
  PENDING
  SENT
  READ
  DISMISSED
  FAILED
  @@schema("public")
}
```

---

### 2. UserNotificationPreferences Table (New)

**Purpose:** Store user preferences for notification delivery channels and frequency

```prisma
model UserNotificationPreferences {
  id       Int    @id @default(autoincrement())
  userId   String @unique
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenantId Int
  tenant   Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Global toggles
  notificationsEnabled Boolean @default(true)
  emailEnabled         Boolean @default(true)
  smsEnabled           Boolean @default(false)  // SMS requires phone number + opt-in
  pushEnabled          Boolean @default(true)

  // Channel-specific settings
  emailAddress         String?  // Override account email
  phoneNumber          String?  // For SMS
  phoneVerified        Boolean @default(false)

  // Notification type preferences
  vaccinationAlerts    NotificationChannelPreference @default(EMAIL_AND_APP)
  breedingAlerts       NotificationChannelPreference @default(EMAIL_AND_APP)
  foalingAlerts        NotificationChannelPreference @default(ALL)  // High priority
  healthEventAlerts    NotificationChannelPreference @default(EMAIL_AND_APP)
  buyerFollowUpAlerts  NotificationChannelPreference @default(APP_ONLY)

  // Frequency settings
  dailyDigest          Boolean @default(false)  // Group non-urgent into daily email
  digestTime           String  @default("08:00")  // Time for daily digest (HH:MM)
  weekendNotifications Boolean @default(true)

  // Quiet hours
  quietHoursEnabled    Boolean @default(false)
  quietHoursStart      String  @default("22:00")  // HH:MM
  quietHoursEnd        String  @default("08:00")  // HH:MM
  quietHoursTimezone   String  @default("America/New_York")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([tenantId])
  @@schema("public")
}

enum NotificationChannelPreference {
  ALL           // Email + SMS + Push + In-App
  EMAIL_AND_APP // Email + In-App only
  SMS_AND_APP   // SMS + In-App only
  APP_ONLY      // In-App only
  DISABLED      // No notifications
  @@schema("public")
}
```

---

### 3. NotificationSchedule Table (New)

**Purpose:** Track scheduled future notifications and prevent duplicates

```prisma
model NotificationSchedule {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // What to notify about
  type            NotificationType
  entityType      String   // "VaccinationRecord", "BreedingPlan", etc.
  entityId        Int

  // When to notify
  scheduledFor    DateTime
  triggered       Boolean  @default(false)
  triggeredAt     DateTime?

  // Notification content (pre-computed)
  title           String
  message         String   @db.Text
  priority        NotificationPriority

  // Metadata
  data            Json?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([type, entityType, entityId, scheduledFor])
  @@index([scheduledFor, triggered])
  @@index([tenantId])
  @@schema("public")
}
```

---

## Alert Types & Triggering Logic

### 1. Vaccination Expiration Alerts

**Data Source:** `VaccinationRecord.expiresAt`

**Alert Schedule:**
- **7 days before:** "Vaccination due soon" (LOW priority)
- **3 days before:** "Vaccination due in 3 days" (MEDIUM priority)
- **1 day before:** "Vaccination due tomorrow" (HIGH priority)
- **On expiration date:** "Vaccination expired today" (URGENT priority)
- **7 days after:** "Vaccination overdue" (URGENT priority)

**Triggering SQL:**
```sql
-- Find vaccinations expiring soon (7 day window)
SELECT
  vr.id,
  vr.tenantId,
  vr.animalId,
  vr.protocolKey,
  vr.expiresAt,
  a.name AS animalName,
  EXTRACT(DAY FROM vr.expiresAt - CURRENT_DATE) AS daysUntilExpiration
FROM "VaccinationRecord" vr
JOIN "Animal" a ON a.id = vr.animalId
WHERE vr.expiresAt >= CURRENT_DATE
  AND vr.expiresAt <= CURRENT_DATE + INTERVAL '7 days'
  AND NOT EXISTS (
    SELECT 1 FROM "Notification" n
    WHERE n.type = 'VACCINATION_EXPIRING'
      AND n.entityType = 'VaccinationRecord'
      AND n.entityId = vr.id
      AND n.createdAt > CURRENT_DATE - INTERVAL '1 day'  -- Don't spam
  )
ORDER BY vr.expiresAt ASC;
```

**Notification Content:**
```typescript
// 7 days before
{
  title: "Vaccination Due Soon",
  message: "{animalName}'s {vaccineName} vaccination expires in 7 days (on {expirationDate}). Schedule a vet appointment soon.",
  priority: "LOW",
  type: "VACCINATION_EXPIRING"
}

// 1 day before
{
  title: "Vaccination Due Tomorrow",
  message: "{animalName}'s {vaccineName} vaccination expires tomorrow ({expirationDate}). Contact your vet immediately.",
  priority: "HIGH",
  type: "VACCINATION_EXPIRING"
}

// Expired
{
  title: "Vaccination Expired",
  message: "{animalName}'s {vaccineName} vaccination expired today. This horse may not be eligible for shows/competitions. Schedule a vet visit ASAP.",
  priority: "URGENT",
  type: "VACCINATION_EXPIRED"
}
```

---

### 2. Breeding Timeline Alerts

**Data Source:** `BreedingPlan.expected*` dates

**Alert Schedule:**

| Event | Alert Timing | Priority | Type |
|-------|-------------|----------|------|
| **Heat Cycle Expected** | 3 days before | MEDIUM | BREEDING_CYCLE_EXPECTED |
| **Hormone Testing Start** | 1 day before | HIGH | BREEDING_HORMONE_TEST_DUE |
| **Breed Date** | 2 days before | HIGH | BREEDING_BREED_DATE_APPROACHING |
| **Pregnancy Check** | On expected date | MEDIUM | PREGNANCY_CHECK_DUE |
| **Birth Date** | 14 days before | HIGH | FOALING_APPROACHING |
| **Birth Date** | 7 days before | HIGH | FOALING_APPROACHING |
| **Birth Date** | 3 days before | URGENT | FOALING_APPROACHING |
| **Birth Date** | 1 day before | URGENT | FOALING_APPROACHING |
| **Birth Date** | 7 days after | URGENT | FOALING_OVERDUE |
| **Weaning** | 7 days before | MEDIUM | WEANING_DUE |
| **Placement Start** | 7 days before | MEDIUM | PLACEMENT_READY |

**Triggering SQL:**
```sql
-- Find breeding plans with upcoming events
SELECT
  bp.id,
  bp.tenantId,
  bp.name AS planName,
  bp.status,
  bp.expectedCycleStart,
  bp.expectedHormoneTestingStart,
  bp.expectedBreedDate,
  bp.expectedBirthDate,
  bp.expectedWeaned,
  bp.expectedPlacementStart,
  d.name AS damName,
  s.name AS sireName
FROM "BreedingPlan" bp
LEFT JOIN "Animal" d ON d.id = bp.damId
LEFT JOIN "Animal" s ON s.id = bp.sireId
WHERE bp.archived = false
  AND bp.status NOT IN ('COMPLETE', 'CANCELED')
  AND (
    -- Check each date field
    (bp.expectedCycleStart IS NOT NULL AND bp.expectedCycleStart BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days')
    OR (bp.expectedHormoneTestingStart IS NOT NULL AND bp.expectedHormoneTestingStart BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day')
    OR (bp.expectedBreedDate IS NOT NULL AND bp.expectedBreedDate BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days')
    OR (bp.expectedBirthDate IS NOT NULL AND bp.expectedBirthDate BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '14 days')
    OR (bp.expectedWeaned IS NOT NULL AND bp.expectedWeaned BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')
    OR (bp.expectedPlacementStart IS NOT NULL AND bp.expectedPlacementStart BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days')
  );
```

**Notification Content Examples:**
```typescript
// Heat cycle expected
{
  title: "Heat Cycle Expected Soon",
  message: "{damName} is expected to start her heat cycle in 3 days (on {expectedDate}). Prepare for hormone testing and breeding.",
  priority: "MEDIUM",
  type: "BREEDING_CYCLE_EXPECTED",
  entityType: "BreedingPlan",
  entityId: planId
}

// Foaling approaching (14 days)
{
  title: "Foaling in 2 Weeks",
  message: "{damName} is expected to foal in 14 days (on {expectedDate}). Prepare foaling kit and monitor closely.",
  priority: "HIGH",
  type: "FOALING_APPROACHING",
  entityType: "BreedingPlan",
  entityId: planId
}

// Foaling imminent (1 day)
{
  title: "Foaling Expected Tomorrow",
  message: "{damName} is expected to foal TOMORROW ({expectedDate}). Monitor 24/7. Have vet on call.",
  priority: "URGENT",
  type: "FOALING_APPROACHING",
  entityType: "BreedingPlan",
  entityId: planId
}

// Foaling overdue
{
  title: "Foaling Overdue",
  message: "{damName} is now 7 days past expected foaling date ({expectedDate}). Contact your vet for pregnancy check. Normal gestation: 320-370 days.",
  priority: "URGENT",
  type: "FOALING_OVERDUE",
  entityType: "BreedingPlan",
  entityId: planId
}
```

---

### 3. Health Event Reminders

**Data Source:** User can set custom reminders (e.g., "Check weight monthly", "Farrier every 6 weeks")

**Implementation:** Add `HealthEventReminder` table for recurring reminders

```prisma
model HealthEventReminder {
  id           Int      @id @default(autoincrement())
  tenantId     Int
  animalId     Int
  animal       Animal   @relation(fields: [animalId], references: [id], onDelete: Cascade)

  title        String
  description  String?
  eventType    HealthType

  // Recurrence
  frequency    ReminderFrequency  // ONCE, WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM
  intervalDays Int?               // For CUSTOM frequency

  nextDueDate  DateTime
  lastCompletedAt DateTime?

  active       Boolean  @default(true)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([tenantId])
  @@index([animalId])
  @@index([nextDueDate, active])
  @@schema("public")
}

enum ReminderFrequency {
  ONCE
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
  CUSTOM
  @@schema("public")
}
```

**Notification Content:**
```typescript
{
  title: "Health Event Reminder",
  message: "{animalName}: {reminderTitle} is due on {dueDate}. {description}",
  priority: "MEDIUM",
  type: "HEALTH_EVENT_DUE",
  entityType: "Animal",
  entityId: animalId
}
```

---

### 4. Buyer Follow-Up Alerts

**Data Source:** `WaitlistEntry`, `OffspringGroup` (buyers who inquired but haven't converted)

**Alert Schedule:**
- **3 days after inquiry:** "Follow up with {buyerName} about {litterName}"
- **7 days after viewing:** "Check in with {buyerName} - still interested?"
- **14 days after deposit:** "Confirm {buyerName} is ready for pickup on {placementDate}"

**Implementation:** Requires CRM features (see 06-BUYER-CRM-SPEC.md)

---

## Email Delivery Implementation

### Email Service Provider: Resend (Already Integrated)

**Template System:** Use Resend React Email templates

**Base Template Structure:**
```typescript
// emails/NotificationEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Link,
} from '@react-email/components';

interface NotificationEmailProps {
  tenantName: string;
  notification: {
    title: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    type: string;
    entityType?: string;
    entityId?: number;
  };
  deepLinkUrl?: string;
  unsubscribeUrl: string;
}

export default function NotificationEmail({
  tenantName,
  notification,
  deepLinkUrl,
  unsubscribeUrl,
}: NotificationEmailProps) {
  const priorityColors = {
    LOW: '#6B7280',
    MEDIUM: '#3B82F6',
    HIGH: '#F59E0B',
    URGENT: '#EF4444',
  };

  return (
    <Html>
      <Head />
      <Preview>{notification.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{notification.title}</Heading>

          <Section style={priorityBadge}>
            <Text style={{ color: priorityColors[notification.priority] }}>
              {notification.priority} PRIORITY
            </Text>
          </Section>

          <Text style={text}>{notification.message}</Text>

          {deepLinkUrl && (
            <Button style={button} href={deepLinkUrl}>
              View Details
            </Button>
          )}

          <Section style={footer}>
            <Text style={footerText}>
              Sent by {tenantName} via BreederHQ
            </Text>
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              Notification Preferences
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles omitted for brevity
```

**Sending Emails:**
```typescript
// src/services/notification-delivery.ts
import { Resend } from 'resend';
import { NotificationEmail } from '../emails/NotificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailNotification(
  notification: Notification,
  user: User,
  tenant: Tenant
): Promise<boolean> {
  try {
    const deepLinkUrl = `${process.env.APP_URL}/app/${tenant.id}/notifications/${notification.id}`;
    const unsubscribeUrl = `${process.env.APP_URL}/app/settings/notifications`;

    const { data, error } = await resend.emails.send({
      from: 'BreederHQ Alerts <alerts@breederhq.com>',
      to: user.email,
      subject: `[${notification.priority}] ${notification.title}`,
      react: NotificationEmail({
        tenantName: tenant.name || tenant.slug,
        notification: {
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          type: notification.type,
          entityType: notification.entityType,
          entityId: notification.entityId,
        },
        deepLinkUrl,
        unsubscribeUrl,
      }),
    });

    if (error) {
      console.error('Failed to send email:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Email delivery error:', err);
    return false;
  }
}
```

---

## SMS Delivery Implementation (Phase 2)

### SMS Service Provider: Twilio

**Cost:** ~$0.0075 per SMS (only enable for URGENT notifications or opt-in)

**Implementation:**
```typescript
// src/services/sms-service.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMSNotification(
  notification: Notification,
  phoneNumber: string
): Promise<boolean> {
  try {
    // Only send SMS for URGENT or if user opted in
    if (notification.priority !== 'URGENT') {
      return false; // Skip non-urgent SMS
    }

    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
      body: `[${notification.priority}] ${notification.title}\n\n${notification.message}\n\nView: ${process.env.APP_URL}/app/notifications/${notification.id}`,
    });

    return message.status !== 'failed';
  } catch (err) {
    console.error('SMS delivery error:', err);
    return false;
  }
}

export async function verifyPhoneNumber(
  userId: string,
  phoneNumber: string
): Promise<string> {
  // Send verification code
  const verification = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verifications.create({
      to: phoneNumber,
      channel: 'sms',
    });

  return verification.sid;
}

export async function confirmVerificationCode(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  const check = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SERVICE_SID)
    .verificationChecks.create({
      to: phoneNumber,
      code,
    });

  return check.status === 'approved';
}
```

---

## Cron Job / Background Worker

### Daily Alert Scan Job

**Schedule:** Every day at 6:00 AM (tenant timezone)

**Implementation:**
```typescript
// src/jobs/notification-scan.ts
import { CronJob } from 'cron';
import prisma from '../prisma';
import { sendEmailNotification, sendSMSNotification } from '../services/notification-delivery';

export function startNotificationScanJob() {
  // Run every day at 6:00 AM
  const job = new CronJob('0 6 * * *', async () => {
    console.log('Starting daily notification scan...');

    try {
      // 1. Scan for vaccination expirations
      await scanVaccinationExpirations();

      // 2. Scan for breeding timeline events
      await scanBreedingTimelineEvents();

      // 3. Scan for health event reminders
      await scanHealthEventReminders();

      // 4. Process scheduled notifications
      await processScheduledNotifications();

      console.log('Notification scan complete.');
    } catch (err) {
      console.error('Notification scan failed:', err);
    }
  });

  job.start();
  console.log('Notification scan job started (daily at 6:00 AM)');
}

async function scanVaccinationExpirations() {
  // Find vaccinations expiring in 7, 3, 1 days or overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiringVaccinations = await prisma.vaccinationRecord.findMany({
    where: {
      expiresAt: {
        gte: today,
        lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
      },
    },
    include: {
      animal: {
        select: { id: true, name: true, tenantId: true },
      },
    },
  });

  for (const vr of expiringVaccinations) {
    const daysUntilExpiration = Math.ceil(
      (vr.expiresAt.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
    );

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'LOW';
    if (daysUntilExpiration <= 1) priority = 'HIGH';
    else if (daysUntilExpiration <= 3) priority = 'MEDIUM';

    // Check if notification already sent today
    const existingNotification = await prisma.notification.findFirst({
      where: {
        type: 'VACCINATION_EXPIRING',
        entityType: 'VaccinationRecord',
        entityId: vr.id,
        createdAt: { gte: today },
      },
    });

    if (existingNotification) continue; // Already notified today

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        tenantId: vr.animal.tenantId,
        type: 'VACCINATION_EXPIRING',
        priority,
        title: `Vaccination Due ${daysUntilExpiration === 1 ? 'Tomorrow' : `in ${daysUntilExpiration} Days`}`,
        message: `${vr.animal.name}'s ${vr.protocolKey} vaccination expires on ${vr.expiresAt.toLocaleDateString()}. Schedule a vet appointment soon.`,
        entityType: 'VaccinationRecord',
        entityId: vr.id,
        status: 'PENDING',
        data: {
          animalId: vr.animalId,
          animalName: vr.animal.name,
          vaccineName: vr.protocolKey,
          expirationDate: vr.expiresAt,
          daysUntilExpiration,
        },
      },
    });

    // Queue for delivery
    await queueNotificationDelivery(notification);
  }
}

async function scanBreedingTimelineEvents() {
  // Similar logic for breeding plans
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingPlans = await prisma.breedingPlan.findMany({
    where: {
      archived: false,
      status: {
        notIn: ['COMPLETE', 'CANCELED'],
      },
      OR: [
        {
          expectedCycleStart: {
            gte: today,
            lte: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
          },
        },
        {
          expectedBirthDate: {
            gte: today,
            lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
          },
        },
        // ... other date checks
      ],
    },
    include: {
      dam: { select: { name: true } },
      sire: { select: { name: true } },
    },
  });

  for (const plan of upcomingPlans) {
    // Check each date field and create appropriate notifications
    // (Implementation details omitted for brevity)
  }
}

async function queueNotificationDelivery(notification: Notification) {
  // Get tenant users and their preferences
  const users = await prisma.user.findMany({
    where: {
      tenantMemberships: {
        some: {
          tenantId: notification.tenantId,
          status: 'ACTIVE',
        },
      },
    },
    include: {
      notificationPreferences: true,
    },
  });

  for (const user of users) {
    const prefs = user.notificationPreferences;
    if (!prefs?.notificationsEnabled) continue;

    // Determine which channels to use based on notification type and user preferences
    const shouldSendEmail = prefs.emailEnabled && shouldSendViaChannel(notification.type, prefs, 'email');
    const shouldSendSMS = prefs.smsEnabled && prefs.phoneVerified && shouldSendViaChannel(notification.type, prefs, 'sms');

    // Send via email
    if (shouldSendEmail) {
      const sent = await sendEmailNotification(notification, user, tenant);
      if (sent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { deliveredViaEmail: true, sentAt: new Date(), status: 'SENT' },
        });
      }
    }

    // Send via SMS (urgent only)
    if (shouldSendSMS && notification.priority === 'URGENT') {
      const sent = await sendSMSNotification(notification, prefs.phoneNumber);
      if (sent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { deliveredViaSMS: true },
        });
      }
    }
  }
}

function shouldSendViaChannel(
  notificationType: NotificationType,
  prefs: UserNotificationPreferences,
  channel: 'email' | 'sms'
): boolean {
  // Map notification types to preference fields
  const typeToPreference: Record<string, keyof UserNotificationPreferences> = {
    VACCINATION_EXPIRING: 'vaccinationAlerts',
    VACCINATION_EXPIRED: 'vaccinationAlerts',
    BREEDING_CYCLE_EXPECTED: 'breedingAlerts',
    FOALING_APPROACHING: 'foalingAlerts',
    HEALTH_EVENT_DUE: 'healthEventAlerts',
    BUYER_FOLLOW_UP: 'buyerFollowUpAlerts',
  };

  const prefField = typeToPreference[notificationType];
  if (!prefField) return true; // Default to sending

  const channelPref = prefs[prefField] as NotificationChannelPreference;

  switch (channelPref) {
    case 'ALL':
      return true;
    case 'EMAIL_AND_APP':
      return channel === 'email';
    case 'SMS_AND_APP':
      return channel === 'sms';
    case 'APP_ONLY':
      return false;
    case 'DISABLED':
      return false;
    default:
      return true;
  }
}
```

---

## API Endpoints

### 1. Get Notifications (In-App)

**Endpoint:** `GET /api/notifications`

**Query Parameters:**
- `status` - Filter by status (PENDING, SENT, READ, DISMISSED)
- `type` - Filter by type
- `priority` - Filter by priority
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 25, max: 100)

**Response:**
```typescript
{
  items: [
    {
      id: 123,
      type: "VACCINATION_EXPIRING",
      priority: "HIGH",
      title: "Vaccination Due Tomorrow",
      message: "Champion's Tetanus vaccination expires tomorrow (2026-01-15). Contact your vet immediately.",
      status: "SENT",
      entityType: "VaccinationRecord",
      entityId: 456,
      data: {
        animalId: 789,
        animalName: "Champion",
        vaccineName: "Tetanus",
        expirationDate: "2026-01-15",
        daysUntilExpiration: 1
      },
      sentAt: "2026-01-14T06:00:00Z",
      readAt: null,
      dismissedAt: null,
      createdAt: "2026-01-14T06:00:00Z"
    }
  ],
  total: 45,
  unreadCount: 12,
  page: 1,
  limit: 25
}
```

---

### 2. Mark Notification as Read

**Endpoint:** `PUT /api/notifications/:id/read`

**Response:**
```typescript
{
  id: 123,
  status: "READ",
  readAt: "2026-01-14T10:30:00Z"
}
```

---

### 3. Dismiss Notification

**Endpoint:** `PUT /api/notifications/:id/dismiss`

**Response:**
```typescript
{
  id: 123,
  status: "DISMISSED",
  dismissedAt: "2026-01-14T10:30:00Z"
}
```

---

### 4. Mark All as Read

**Endpoint:** `POST /api/notifications/mark-all-read`

**Response:**
```typescript
{
  updated: 12
}
```

---

### 5. Get User Notification Preferences

**Endpoint:** `GET /api/notifications/preferences`

**Response:**
```typescript
{
  notificationsEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: true,
  emailAddress: "user@example.com",
  phoneNumber: null,
  phoneVerified: false,
  vaccinationAlerts: "EMAIL_AND_APP",
  breedingAlerts: "EMAIL_AND_APP",
  foalingAlerts: "ALL",
  healthEventAlerts: "EMAIL_AND_APP",
  buyerFollowUpAlerts: "APP_ONLY",
  dailyDigest: false,
  digestTime: "08:00",
  weekendNotifications: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  quietHoursTimezone: "America/New_York"
}
```

---

### 6. Update Notification Preferences

**Endpoint:** `PUT /api/notifications/preferences`

**Request Body:**
```typescript
{
  emailEnabled: true,
  vaccinationAlerts: "ALL",
  foalingAlerts: "EMAIL_AND_APP",
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00"
}
```

**Response:**
```typescript
{
  id: 1,
  notificationsEnabled: true,
  emailEnabled: true,
  // ... updated preferences
}
```

---

### 7. Add/Verify Phone Number for SMS

**Endpoint:** `POST /api/notifications/verify-phone`

**Request Body:**
```typescript
{
  phoneNumber: "+1234567890"
}
```

**Response:**
```typescript
{
  verificationId: "abc123",
  message: "Verification code sent to +1234567890"
}
```

**Endpoint:** `POST /api/notifications/confirm-phone`

**Request Body:**
```typescript
{
  phoneNumber: "+1234567890",
  code: "123456"
}
```

**Response:**
```typescript
{
  verified: true,
  message: "Phone number verified successfully"
}
```

---

## Frontend Components

### 1. Notification Bell Icon (Navbar)

**Component:** `NotificationBell.tsx`

**Features:**
- Display unread count badge
- Open notification dropdown on click
- Real-time updates (WebSocket)

```typescript
// components/NotificationBell.tsx
import { useState, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '../hooks/useWebSocket';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?status=SENT&limit=5');
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Real-time updates via WebSocket
  useWebSocket('notification:new', () => {
    refetch();
  });

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <BellIcon className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={data?.items || []}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

---

### 2. Notification Dropdown

**Component:** `NotificationDropdown.tsx`

**Features:**
- List recent notifications (last 5)
- Mark as read on click
- Link to full notification page

```typescript
// components/NotificationDropdown.tsx
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function NotificationDropdown({ notifications, onClose }) {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: number) => {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <Link
            to="/app/notifications"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={onClose}
          >
            View All
          </Link>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No new notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              to={`/app/notifications/${notification.id}`}
              className="block p-4 border-b border-gray-100 hover:bg-gray-50"
              onClick={() => {
                markAsRead.mutate(notification.id);
                onClose();
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                  {notification.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={async () => {
            await fetch('/api/notifications/mark-all-read', { method: 'POST' });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Mark All as Read
        </button>
      </div>
    </div>
  );
}
```

---

### 3. Notifications Page

**Route:** `/app/notifications`

**Features:**
- Full list of notifications (paginated)
- Filter by type, priority, status
- Search
- Bulk actions (mark all read, dismiss all)

```typescript
// pages/NotificationsPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotificationList } from '../components/NotificationList';
import { NotificationFilters } from '../components/NotificationFilters';

export function NotificationsPage() {
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    page: 1,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.priority !== 'all') params.set('priority', filters.priority);
      params.set('page', filters.page.toString());

      const res = await fetch(`/api/notifications?${params}`);
      return res.json();
    },
  });

  const queryClient = useQueryClient();

  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Mark All as Read
        </button>
      </div>

      <NotificationFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <NotificationList
          notifications={data.items}
          total={data.total}
          page={filters.page}
          onPageChange={(page) => setFilters({ ...filters, page })}
        />
      )}
    </div>
  );
}
```

---

### 4. Notification Preferences Page

**Route:** `/app/settings/notifications`

**Features:**
- Toggle notification channels (email, SMS, push)
- Configure notification types
- Set quiet hours
- Daily digest settings

```typescript
// pages/NotificationPreferencesPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toggle } from '../components/Toggle';
import { Select } from '../components/Select';

export function NotificationPreferencesPage() {
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/preferences');
      return res.json();
    },
  });

  const queryClient = useQueryClient();

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<UserNotificationPreferences>) => {
      const res = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>

      {/* Global toggles */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Notification Channels</h2>

        <div className="space-y-4">
          <Toggle
            label="Email Notifications"
            checked={prefs.emailEnabled}
            onChange={(checked) => updatePreferences.mutate({ emailEnabled: checked })}
          />

          <Toggle
            label="SMS Notifications (Urgent Only)"
            checked={prefs.smsEnabled}
            onChange={(checked) => updatePreferences.mutate({ smsEnabled: checked })}
            description="Requires phone verification"
          />

          <Toggle
            label="Push Notifications"
            checked={prefs.pushEnabled}
            onChange={(checked) => updatePreferences.mutate({ pushEnabled: checked })}
          />
        </div>
      </section>

      {/* Notification type preferences */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Notification Types</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Vaccination Alerts</label>
            <Select
              value={prefs.vaccinationAlerts}
              onChange={(value) => updatePreferences.mutate({ vaccinationAlerts: value })}
              options={[
                { value: 'ALL', label: 'Email + SMS + In-App' },
                { value: 'EMAIL_AND_APP', label: 'Email + In-App' },
                { value: 'APP_ONLY', label: 'In-App Only' },
                { value: 'DISABLED', label: 'Disabled' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Foaling Alerts</label>
            <Select
              value={prefs.foalingAlerts}
              onChange={(value) => updatePreferences.mutate({ foalingAlerts: value })}
              options={[
                { value: 'ALL', label: 'Email + SMS + In-App' },
                { value: 'EMAIL_AND_APP', label: 'Email + In-App' },
                { value: 'APP_ONLY', label: 'In-App Only' },
                { value: 'DISABLED', label: 'Disabled' },
              ]}
            />
          </div>

          {/* More notification type preferences... */}
        </div>
      </section>

      {/* Quiet hours */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Quiet Hours</h2>

        <Toggle
          label="Enable Quiet Hours"
          checked={prefs.quietHoursEnabled}
          onChange={(checked) => updatePreferences.mutate({ quietHoursEnabled: checked })}
          description="Don't send non-urgent notifications during quiet hours"
        />

        {prefs.quietHoursEnabled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Time</label>
              <input
                type="time"
                value={prefs.quietHoursStart}
                onChange={(e) => updatePreferences.mutate({ quietHoursStart: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Time</label>
              <input
                type="time"
                value={prefs.quietHoursEnd}
                onChange={(e) => updatePreferences.mutate({ quietHoursEnd: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        )}
      </section>

      {/* Daily digest */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Daily Digest</h2>

        <Toggle
          label="Enable Daily Digest"
          checked={prefs.dailyDigest}
          onChange={(checked) => updatePreferences.mutate({ dailyDigest: checked })}
          description="Group non-urgent notifications into one daily email"
        />

        {prefs.dailyDigest && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Delivery Time</label>
            <input
              type="time"
              value={prefs.digestTime}
              onChange={(e) => updatePreferences.mutate({ digestTime: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        )}
      </section>
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests

1. **Alert triggering logic**
   - Test vaccination expiration detection (7/3/1 day windows)
   - Test breeding timeline event detection
   - Test duplicate notification prevention

2. **Notification delivery**
   - Test email sending (mock Resend)
   - Test SMS sending (mock Twilio)
   - Test channel preference logic

3. **User preferences**
   - Test preference filtering
   - Test quiet hours enforcement
   - Test daily digest grouping

### Integration Tests

1. **End-to-end notification flow**
   - Create vaccination record with near expiration
   - Run cron job
   - Verify notification created
   - Verify email sent
   - Verify in-app notification visible

2. **Preference management**
   - Update user preferences
   - Trigger notification
   - Verify correct channels used

### Manual Testing Checklist

- [ ] Vaccination expiring in 7 days triggers LOW priority notification
- [ ] Vaccination expiring in 1 day triggers HIGH priority notification
- [ ] Vaccination expired triggers URGENT notification
- [ ] Foaling approaching (14 days) triggers HIGH priority notification
- [ ] Foaling approaching (1 day) triggers URGENT priority notification
- [ ] Email notifications deliver correctly
- [ ] SMS notifications deliver for URGENT priority
- [ ] Notification bell shows unread count
- [ ] Notification dropdown displays recent alerts
- [ ] Marking notification as read updates UI
- [ ] Quiet hours prevent non-urgent notifications
- [ ] Daily digest groups notifications correctly
- [ ] User can disable specific notification types
- [ ] Deep links work (click notification → view entity)

---

## Implementation Checklist

### Week 1: Backend (5 days)

**Day 1: Database Schema**
- [ ] Create Notification table migration
- [ ] Create UserNotificationPreferences table migration
- [ ] Create NotificationSchedule table migration
- [ ] Add enums (NotificationType, NotificationPriority, etc.)
- [ ] Run migrations on dev database
- [ ] Seed default preferences for existing users

**Day 2: Notification Scanning Logic**
- [ ] Implement `scanVaccinationExpirations()`
- [ ] Implement `scanBreedingTimelineEvents()`
- [ ] Implement duplicate prevention logic
- [ ] Write unit tests for scanning logic

**Day 3: Notification Delivery**
- [ ] Implement email service (Resend integration)
- [ ] Create email templates (React Email)
- [ ] Implement SMS service (Twilio integration)
- [ ] Implement channel preference logic
- [ ] Write unit tests for delivery

**Day 4: Cron Job & Scheduler**
- [ ] Set up cron job for daily scans (6 AM)
- [ ] Implement notification queue processing
- [ ] Implement scheduled notification triggers
- [ ] Add error handling and retry logic
- [ ] Write integration tests

**Day 5: API Endpoints**
- [ ] Implement GET /api/notifications
- [ ] Implement PUT /api/notifications/:id/read
- [ ] Implement PUT /api/notifications/:id/dismiss
- [ ] Implement POST /api/notifications/mark-all-read
- [ ] Implement GET /api/notifications/preferences
- [ ] Implement PUT /api/notifications/preferences
- [ ] Implement POST /api/notifications/verify-phone
- [ ] Implement POST /api/notifications/confirm-phone
- [ ] Write API tests

---

### Week 2: Frontend (5 days)

**Day 6: Notification Bell Component**
- [ ] Create NotificationBell component
- [ ] Implement unread count badge
- [ ] Add dropdown UI
- [ ] Integrate with API
- [ ] Add WebSocket real-time updates

**Day 7: Notifications Page**
- [ ] Create NotificationsPage route
- [ ] Implement notification list with pagination
- [ ] Add filters (type, priority, status)
- [ ] Implement mark as read functionality
- [ ] Add bulk actions

**Day 8: Notification Preferences Page**
- [ ] Create NotificationPreferencesPage route
- [ ] Implement channel toggles (email, SMS, push)
- [ ] Implement notification type preferences
- [ ] Add quiet hours configuration
- [ ] Add daily digest settings

**Day 9: Phone Verification Flow**
- [ ] Create phone number input component
- [ ] Implement verification code input
- [ ] Add verification success/error states
- [ ] Test SMS delivery

**Day 10: Testing & Polish**
- [ ] End-to-end testing
- [ ] Fix bugs
- [ ] Polish UI/UX
- [ ] Update documentation
- [ ] Deploy to staging

---

## Success Criteria

### Functional Requirements
- ✅ Users receive vaccination expiration alerts (7/3/1 day warnings)
- ✅ Users receive breeding timeline reminders
- ✅ Users receive foaling approaching alerts
- ✅ Notifications display in-app (bell icon)
- ✅ Notifications deliver via email
- ✅ URGENT notifications deliver via SMS (opt-in)
- ✅ Users can configure notification preferences
- ✅ No duplicate notifications sent
- ✅ Deep links work (notification → entity)

### Non-Functional Requirements
- ✅ Notification scan completes in < 5 minutes
- ✅ Email delivery rate > 98%
- ✅ SMS delivery rate > 95%
- ✅ Notification UI loads in < 500ms
- ✅ No false positives (incorrect alerts)
- ✅ Audit trail for all notifications sent

### User Experience
- ✅ Users can quickly see what needs attention
- ✅ Users can silence non-critical notifications
- ✅ Users can configure per-type preferences
- ✅ Mobile-responsive notification UI

---

## Post-Launch Enhancements (Phase 2)

### Smart Notifications (Months 3-4)
- **Adaptive timing:** Learn when user checks app, send alerts accordingly
- **Consolidation:** Group related alerts ("3 things need attention today")
- **Prioritization:** ML model to rank importance based on user behavior

### Advanced Features (Months 5-6)
- **Push notifications:** Native mobile app push (Firebase/OneSignal)
- **Slack integration:** Send alerts to Slack channels
- **SMS two-way:** User can reply to SMS with commands (e.g., "remind me tomorrow")
- **Voice notifications:** Alexa/Google Home integration for critical alerts

---

**Document Status:** Ready for implementation - 2 week sprint to fix Showstopper #1
