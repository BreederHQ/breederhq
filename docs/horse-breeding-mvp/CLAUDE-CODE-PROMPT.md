# Claude Code Prompt: Implement Horse Breeding MVP

**Copy and paste this prompt to start a new Claude Code session for implementation work**

---

## 🎯 The Prompt

```
I need you to help me implement the Horse Breeding MVP for BreederHQ based on comprehensive engineering specifications that have already been created.

## Context

We've completed a full analysis and created detailed engineering specifications for launching BreederHQ as a competitive horse breeding management platform. All specs are located in:

📁 /docs/horse-breeding-mvp/

The documentation includes:
- Current state inventory (what exists today)
- Competitive gap analysis (vs HorseTelex, Stable Secretary, etc.)
- Complete engineering specifications for all features
- 20-week implementation roadmap
- Database schemas, API specs, frontend components, business logic

## Your Role

You are a senior full-stack engineer implementing these specifications. You should:

1. **Start by reading the Quick Start Guide** to understand the codebase
2. **Follow the implementation roadmap** sprint-by-sprint
3. **Implement features according to detailed specs** (exact schemas, APIs, components)
4. **Write production-quality code** with proper error handling, testing, documentation
5. **Ask clarifying questions** if specs are ambiguous (but they shouldn't be - they're very detailed)

## Where to Start

### Step 1: Read These Files First (in order)
1. `/docs/horse-breeding-mvp/QUICK-START-GUIDE.md` - How to get started
2. `/docs/horse-breeding-mvp/00-EXECUTIVE-SUMMARY.md` - Context and goals
3. `/docs/horse-breeding-mvp/01-CURRENT-STATE-INVENTORY.md` - What exists today
4. `/docs/horse-breeding-mvp/08-IMPLEMENTATION-ROADMAP.md` - Sprint plan

### Step 2: Set Up Development Environment (Sprint 0)
- Verify Node.js, PostgreSQL, Git are installed
- Clone/navigate to repo (already in workspace)
- Install dependencies (API + frontend)
- Set up database (migrations, seed data)
- Run tests to ensure baseline works
- Set up CI/CD pipeline (GitHub Actions)
- Set up error monitoring (Sentry or similar)

### Step 3: Start Sprint 1 - Notification System (THE PRIORITY)
Read and implement: `/docs/horse-breeding-mvp/03-NOTIFICATION-SYSTEM-SPEC.md`

This is **SHOWSTOPPER #1** - most critical feature.

Implementation checklist:
1. Add database schema (Notification, NotificationPreference, NotificationDelivery tables)
2. Create notification service (/breederhq-api/src/services/notification-service.ts)
3. Create API routes (/breederhq-api/src/routes/notifications.ts)
4. Set up email delivery (SendGrid or similar)
5. Create background jobs (daily/hourly scans for upcoming events)
6. Create frontend components (notification bell, dropdown, preferences page)
7. Write tests (unit, integration, E2E)
8. Deploy to staging and test

## Important Guidelines

### Code Quality Standards
- Write TypeScript (strict mode)
- Follow existing code patterns in the codebase
- Add JSDoc comments for public APIs
- Write unit tests for business logic (>80% coverage)
- Write integration tests for API endpoints
- Write E2E tests for critical user flows
- Handle errors gracefully (never expose internal errors to users)
- Log appropriately (info, warn, error levels)

### Database Changes
- All schema changes go in `/breederhq-api/prisma/schema.prisma`
- Create migrations with `npx prisma migrate dev`
- Never delete columns in production (mark as deprecated instead)
- Always provide default values for new non-nullable columns
- Index foreign keys and frequently queried fields

### API Design
- Follow REST conventions (GET, POST, PUT, PATCH, DELETE)
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Validate all inputs (use Zod or similar)
- Return consistent error format: `{ error: { code, message, details } }`
- Always require authentication (except public marketplace)
- Check tenant isolation (users can't access other tenants' data)

### Frontend Components
- Use existing component library/patterns
- Make components responsive (mobile, tablet, desktop)
- Ensure accessibility (WCAG 2.1 AA minimum)
- Use semantic HTML
- Add proper ARIA labels
- Support keyboard navigation
- Test on multiple browsers (Chrome, Safari, Firefox)

### Testing Requirements
- Unit tests: Business logic, utilities, pure functions
- Integration tests: API endpoints, database operations
- E2E tests: Critical user flows (login, create breeding plan, send notification)
- Coverage target: 80%+ overall
- Run tests before every commit
- All tests must pass before merging to main

## Current Sprint: Sprint 1 - Notification System

**Timeline:** 1-2 weeks (10-14 days)
**Priority:** CRITICAL (Showstopper #1)
**Spec:** `/docs/horse-breeding-mvp/03-NOTIFICATION-SYSTEM-SPEC.md`

### What to Build

A comprehensive alert/notification system that sends reminders to horse breeders about:
- Vaccination expiring (7 days, 1 day before)
- Pregnancy check due (based on breeding timeline)
- Foaling date approaching (30, 14, 7 days before)
- Heat cycle expected (based on historical data)
- Breeding timeline reminders (hormone testing, breeding window)
- Marketplace inquiries (when buyer contacts breeder)

### Implementation Order

**Day 1-2: Database Schema**
```prisma
// Add to /breederhq-api/prisma/schema.prisma

model Notification {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String?
  user            User?    @relation(fields: [userId], references: [id], onDelete: Cascade)

  type            NotificationType
  title           String
  message         String
  linkUrl         String?

  priority        NotificationPriority @default(MEDIUM)
  read            Boolean  @default(false)
  readAt          DateTime?

  scheduledFor    DateTime?
  sentAt          DateTime?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tenantId, userId])
  @@index([type])
  @@index([scheduledFor])
}

enum NotificationType {
  vaccination_expiring
  vaccination_overdue
  breeding_timeline_reminder
  pregnancy_check_due
  pregnancy_check_overdue
  foaling_approaching
  foaling_overdue
  heat_cycle_expected
  health_event_reminder
  marketplace_inquiry
  marketplace_waitlist_signup
  system_announcement
}

enum NotificationPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model NotificationPreference {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  type            NotificationType
  enabled         Boolean  @default(true)
  emailEnabled    Boolean  @default(true)
  smsEnabled      Boolean  @default(false)
  pushEnabled     Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, type])
  @@index([tenantId, userId])
}

model NotificationDelivery {
  id              Int      @id @default(autoincrement())
  notificationId  Int
  notification    Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  channel         NotificationChannel
  recipient       String   // email address, phone number, etc.
  status          DeliveryStatus
  sentAt          DateTime?
  deliveredAt     DateTime?
  failedAt        DateTime?
  errorMessage    String?

  createdAt       DateTime @default(now())

  @@index([notificationId])
  @@index([status])
}

enum NotificationChannel {
  EMAIL
  SMS
  PUSH
  IN_APP
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}
```

Run: `npx prisma migrate dev --name add-notification-system`

**Day 3-4: Notification Service**

Create: `/breederhq-api/src/services/notification-service.ts`

See full implementation in `/docs/horse-breeding-mvp/03-NOTIFICATION-SYSTEM-SPEC.md` Section 4.1

Key functions:
- `createNotification()` - Create notification
- `scheduleNotification()` - Schedule for future delivery
- `sendNotification()` - Send via email/SMS/push
- `markAsRead()` - Mark notification as read
- `getUserNotifications()` - Get user's notifications with filters

**Day 5-6: API Routes**

Create: `/breederhq-api/src/routes/notifications.ts`

Endpoints (see spec Section 5 for full details):
- `GET /api/notifications` - List notifications
- `GET /api/notifications/:id` - Get single notification
- `POST /api/notifications` - Create notification (admin only)
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences
- `POST /api/notifications/test` - Send test notification
- `GET /api/notifications/stats` - Get stats

**Day 7-8: Background Jobs**

Create: `/breederhq-api/src/jobs/notification-jobs.ts`

Jobs to implement:
1. Daily scan (6am): Check vaccinations, foaling dates, pregnancy checks
2. Hourly scan: Check imminent events (foaling within 24 hours)

See spec Section 6 for full logic.

**Day 9-10: Frontend Components**

Create:
- `/breederhq/apps/portal/src/components/NotificationBell.tsx` - Bell icon with badge
- `/breederhq/apps/portal/src/components/NotificationDropdown.tsx` - Dropdown list
- `/breederhq/apps/portal/src/components/NotificationCenter.tsx` - Full notification center
- `/breederhq/apps/portal/src/pages/NotificationPreferencesPage.tsx` - Settings page

See spec Section 7 for component specs.

**Day 11-12: Testing**
- Write unit tests (notification service)
- Write integration tests (API endpoints)
- Write E2E tests (user receives notification)
- Achieve 80%+ coverage

**Day 13-14: QA & Deploy**
- Manual QA (test all notification types)
- Deploy to staging
- Smoke test
- Deploy to production (feature flag)

## What I Need From You

### For Each Feature You Implement:

1. **Read the spec thoroughly** before writing any code
2. **Ask questions** if anything is unclear (but specs should be very detailed)
3. **Write the code** following the implementation checklist
4. **Show me the code** for review before committing
5. **Write tests** (don't skip this!)
6. **Update documentation** if you deviate from spec (with good reason)
7. **Create PR** with clear description of what was implemented

### Progress Updates

After each major milestone (completing a day's work), provide:
- ✅ What was completed
- 🔄 What's in progress
- ⏸️ What's blocked
- 🐛 Any issues encountered
- ❓ Any questions/clarifications needed

## Important Constraints

### DO:
✅ Follow the specs exactly (they're very detailed)
✅ Write production-quality code (this will go to real users)
✅ Test thoroughly (unit, integration, E2E)
✅ Handle errors gracefully
✅ Make code readable (clear variable names, comments where needed)
✅ Follow existing patterns in codebase
✅ Ask questions if specs are ambiguous

### DON'T:
❌ Skip testing ("I'll add tests later")
❌ Ignore error handling
❌ Hardcode values (use config/env vars)
❌ Expose sensitive data in logs
❌ Break tenant isolation (security critical!)
❌ Deviate from specs without discussing first
❌ Leave TODOs or commented-out code

## Files You'll Be Working With

### Backend Files:
- `/breederhq-api/prisma/schema.prisma` - Database schema
- `/breederhq-api/src/services/notification-service.ts` - Notification business logic
- `/breederhq-api/src/routes/notifications.ts` - API endpoints
- `/breederhq-api/src/jobs/notification-jobs.ts` - Background jobs
- `/breederhq-api/src/services/email-service.ts` - Email sending (if exists)

### Frontend Files:
- `/breederhq/apps/portal/src/components/NotificationBell.tsx`
- `/breederhq/apps/portal/src/components/NotificationDropdown.tsx`
- `/breederhq/apps/portal/src/components/NotificationCenter.tsx`
- `/breederhq/apps/portal/src/pages/NotificationPreferencesPage.tsx`

### Test Files:
- `/breederhq-api/src/services/__tests__/notification-service.test.ts`
- `/breederhq-api/src/routes/__tests__/notifications.test.ts`
- `/breederhq/apps/portal/src/components/__tests__/NotificationBell.test.tsx`

## Success Criteria for Sprint 1

Sprint 1 is complete when:
- ✅ All database migrations run successfully
- ✅ Notification service has all required functions
- ✅ All API endpoints implemented and tested
- ✅ Email delivery works (SendGrid or similar)
- ✅ Background jobs run on schedule
- ✅ Frontend components render correctly
- ✅ Notification bell shows unread count
- ✅ Users can mark notifications as read
- ✅ Users can update preferences
- ✅ All tests pass (>80% coverage)
- ✅ Deployed to staging and smoke tested
- ✅ No critical bugs

## After Sprint 1

Once Sprint 1 is complete, we'll move to:

**Sprint 2: Marketplace UI** (Showstopper #2)
- Spec: `/docs/horse-breeding-mvp/04-BREEDING-PROGRAM-MARKETPLACE-SPEC.md`
- Timeline: 2-3 weeks
- Build public breeding program showcase pages

Then continue through Sprint 3-8 following `/docs/horse-breeding-mvp/08-IMPLEMENTATION-ROADMAP.md`

## Getting Help

If you need clarification:
1. **Check the spec first** - All details are in `/docs/horse-breeding-mvp/03-NOTIFICATION-SYSTEM-SPEC.md`
2. **Check existing code** - Look for similar patterns (e.g., email sending, background jobs)
3. **Ask me** - I can clarify requirements or make decisions if specs are ambiguous

## Let's Start!

### CRITICAL FIRST STEP: Codebase Reconnaissance

**BEFORE implementing anything, you MUST conduct a thorough reconnaissance of the existing codebase.**

The API backend is located at: `C:\Users\Aaron\Documents\Projects\breederhq-api\`

#### Phase 1: Database Schema Analysis

**Explore:** `C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma`

**What to find:**
1. **All existing models** - List every model in the schema
2. **Horse-specific models** - Animal, BreedingPlan, BreedingProgram, ReproductiveCycle, PregnancyCheck, BreedingAttempt, etc.
3. **Notification-related models** - Check if ANY notification infrastructure already exists
4. **User/Auth models** - User, Tenant, Party, etc.
5. **Relationships** - How models connect to each other
6. **Enums** - Species, BreedingPlanStatus, NotificationType (if exists), etc.
7. **Indexes** - What's already indexed for performance
8. **Timestamps** - createdAt, updatedAt patterns

**Deliverable:** Provide a comprehensive summary:
```
EXISTING DATABASE MODELS:
- Total models: [X]
- Horse-related models: [list]
- User/auth models: [list]
- Notification models: [NONE or list what exists]
- Key enums: [list]
- Notable relationships: [summary]
```

#### Phase 2: API Routes Analysis

**Explore:** `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\`

**What to find:**
1. **All route files** - List every file in /routes directory
2. **Authentication patterns** - How are routes protected?
3. **Validation patterns** - Zod? Joi? Custom validators?
4. **Error handling patterns** - How are errors returned?
5. **Response formats** - Consistent structure?
6. **Tenant isolation** - How is multi-tenancy enforced?
7. **Pagination** - How is it implemented?
8. **Existing notification/email routes** - Do they exist?

**Key files to examine:**
- `animals.ts` - Animal CRUD patterns
- `breeding-plans.ts` - Breeding plan management (if exists)
- `breeding-programs.ts` - Breeding program management (if exists)
- `animal-vaccinations.ts` - Vaccination tracking
- `notifications.ts` or `emails.ts` - Check if these exist!
- `auth.ts` or `users.ts` - Authentication patterns

**Deliverable:** Provide a comprehensive summary:
```
EXISTING API ROUTES:
- Total route files: [X]
- Horse-related routes: [list]
- Authentication method: [JWT, session, etc.]
- Validation library: [Zod, Joi, etc.]
- Error handling: [pattern description]
- Notification/email routes: [NONE or list what exists]
- Notable patterns to follow: [summary]
```

#### Phase 3: Services Analysis

**Explore:** `C:\Users\Aaron\Documents\Projects\breederhq-api\src\services\`

**What to find:**
1. **All service files** - List every service
2. **Business logic patterns** - How is logic separated from routes?
3. **Email service** - Does email-service.ts exist? What library? (SendGrid, Nodemailer, etc.)
4. **Notification service** - Does notification-service.ts exist?
5. **Job/queue service** - Background job infrastructure?
6. **Lineage service** - COI calculation (mentioned in docs)

**Deliverable:** Provide a comprehensive summary:
```
EXISTING SERVICES:
- Total services: [X]
- Email service: [EXISTS with SendGrid/Nodemailer/etc. or NONE]
- Notification service: [EXISTS or NONE]
- Background jobs: [Bull/BullMQ/etc. or NONE]
- Notable services: [list]
```

#### Phase 4: Dependencies Analysis

**Explore:** `C:\Users\Aaron\Documents\Projects\breederhq-api\package.json`

**What to find:**
1. **Existing notification/email libraries** - SendGrid? Nodemailer? Twilio?
2. **Job queue libraries** - Bull? BullMQ? Agenda?
3. **Validation libraries** - Zod? Joi? express-validator?
4. **Testing libraries** - Jest? Vitest? Supertest?
5. **Database client** - Prisma version, other clients?

**Deliverable:** Provide a comprehensive summary:
```
KEY DEPENDENCIES:
- Email: [library and version or NONE]
- SMS: [library and version or NONE]
- Job queue: [library and version or NONE]
- Validation: [library and version]
- Testing: [libraries and versions]
- Prisma: [version]
- Notable others: [list]
```

#### Phase 5: Configuration Analysis

**Explore:** `C:\Users\Aaron\Documents\Projects\breederhq-api\.env.example` or config files

**What to find:**
1. **Email config** - SMTP settings? API keys?
2. **Database config** - Connection string format
3. **Redis/queue config** - If background jobs exist
4. **External service configs** - What's already integrated?

---

### After Reconnaissance: Implementation Decision

**ONLY AFTER completing the reconnaissance above**, provide:

1. **What Already Exists for Notifications:**
   - ✅ Models: [list or NONE]
   - ✅ Routes: [list or NONE]
   - ✅ Services: [list or NONE]
   - ✅ Email delivery: [library or NONE]
   - ✅ Background jobs: [infrastructure or NONE]

2. **What Needs to Be Built:**
   - Based on spec vs. what exists
   - Estimated effort (does existing infrastructure reduce scope?)

3. **Implementation Plan Adjustments:**
   - If email service exists: Skip Day 3 setup, integrate with existing
   - If notification models exist: Review and extend vs. create new
   - If job queue exists: Add new jobs to existing queue
   - If nothing exists: Follow spec exactly

4. **Recommended Approach:**
   - Should we extend existing infrastructure or build fresh?
   - Any conflicts with existing patterns?
   - Any opportunities to reuse existing code?

---

### Your First Tasks (In Order):

1. ✅ **Read Quick Start Guide:** `/docs/horse-breeding-mvp/QUICK-START-GUIDE.md`
2. ✅ **Conduct Reconnaissance:** Complete all 5 phases above
3. ✅ **Read Notification Spec:** `/docs/horse-breeding-mvp/03-NOTIFICATION-SYSTEM-SPEC.md`
4. ✅ **Compare Spec to Reality:** What exists vs. what spec requires
5. ✅ **Present Implementation Plan:** Adjusted based on findings
6. ⏸️ **Wait for Approval:** Before making any code changes
7. 🚀 **Start Implementation:** Beginning with database schema

---

### Example First Response Format:

```
# RECONNAISSANCE REPORT

## Database Schema Analysis
[Summary of existing models, relationships, what's relevant to notifications]

## API Routes Analysis
[Summary of existing routes, patterns, authentication, error handling]

## Services Analysis
[Summary of existing services, especially email/notification/jobs]

## Dependencies Analysis
[Summary of key libraries, what's available to use]

## Configuration Analysis
[Summary of existing config, what needs to be added]

---

## NOTIFICATION SYSTEM: Exists vs. Spec Comparison

### What Exists:
- Database Models: [✅ or ❌ with details]
- API Routes: [✅ or ❌ with details]
- Email Service: [✅ or ❌ with details]
- Background Jobs: [✅ or ❌ with details]

### What Needs Building:
- [List based on spec requirements minus what exists]

### Implementation Strategy:
- [Extend existing or build fresh, with reasoning]

---

## PROPOSED IMPLEMENTATION PLAN (Adjusted)

### Day 1-2: Database Schema
[Plan adjusted based on what exists]

### Day 3-4: Notification Service
[Plan adjusted based on existing services]

### Day 5-6: API Routes
[Plan adjusted based on existing patterns]

... etc.

---

## QUESTIONS BEFORE PROCEEDING:
1. [Any ambiguities found]
2. [Any conflicts with existing code]
3. [Any decisions needed]

Ready to proceed once approved.
```

---

**Start with reconnaissance - understanding what exists is critical before implementing anything!**

Let's build this! 🚀
```

---

## Additional Context You Can Provide

If Claude Code needs more context, you can also say:

```
Additional context:
- We're at a launch decision point: should we launch with horses or not?
- Analysis shows we have excellent backend (95/100) but critical gaps in notifications and marketplace UI
- Decision: GO with private beta launch after fixing 2 showstoppers
- Timeline: 20 weeks to public launch, $105-129K investment
- Target: Move from Category 2 ("quite a bit built") to Category 3 ("holy shit") in 6 months
- Competitive advantage: No one has foaling automation or buyer CRM
```

---

## If Claude Code Asks "What Should I Build First?"

Direct response:

```
Build the Notification System (Sprint 1) first - it's SHOWSTOPPER #1.

Read this spec: /docs/horse-breeding-mvp/03-NOTIFICATION-SYSTEM-SPEC.md

Start with database schema (Day 1-2):
1. Open /breederhq-api/prisma/schema.prisma
2. Add Notification, NotificationPreference, NotificationDelivery models (see spec Section 3.1)
3. Run `npx prisma migrate dev --name add-notification-system`
4. Verify migration worked

Then move to notification service (Day 3-4) and continue through the checklist.
```

---

## If You Want Claude Code to Explore First (RECOMMENDED)

**Use this prompt to have Claude Code do a complete reconnaissance before implementing:**

```
CRITICAL: Before implementing anything, conduct a thorough reconnaissance of the existing codebase.

The API backend is at: C:\Users\Aaron\Documents\Projects\breederhq-api\

## Phase 1: Database Schema Analysis
Explore: C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma

Tell me:
1. How many models exist total?
2. What horse-specific models exist? (Animal, BreedingPlan, BreedingProgram, PregnancyCheck, ReproductiveCycle, etc.)
3. Are there ANY notification-related models already? (Notification, NotificationPreference, etc.)
4. What enums exist? (Species, NotificationType, BreedingPlanStatus, etc.)
5. How is multi-tenancy handled? (tenantId on all models?)
6. What relationships exist between models?
7. What indexes are already created?

## Phase 2: API Routes Analysis
Explore: C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\

Tell me:
1. What route files exist? (List all files)
2. Do notification.ts or email.ts routes exist?
3. How is authentication handled? (middleware, JWT, session?)
4. How is validation done? (Zod, Joi, express-validator?)
5. How are errors returned? (consistent format?)
6. How is tenant isolation enforced?
7. What patterns should I follow from existing routes?

Key files to examine:
- animals.ts (animal CRUD patterns)
- breeding-plans.ts (if exists)
- breeding-programs.ts (if exists)
- animal-vaccinations.ts (vaccination tracking)
- Any notification/email related routes

## Phase 3: Services Analysis
Explore: C:\Users\Aaron\Documents\Projects\breederhq-api\src\services\

Tell me:
1. What service files exist? (List all)
2. Does email-service.ts exist? What email library? (SendGrid, Nodemailer, etc.)
3. Does notification-service.ts exist already?
4. Is there job/queue infrastructure? (Bull, BullMQ, Agenda, etc.)
5. How is business logic structured?
6. What patterns should I follow?

## Phase 4: Dependencies Analysis
Explore: C:\Users\Aaron\Documents\Projects\breederhq-api\package.json

Tell me:
1. Email libraries: SendGrid? Nodemailer? Resend? (check dependencies)
2. SMS libraries: Twilio? (check dependencies)
3. Job queue: Bull? BullMQ? Agenda? (check dependencies)
4. Validation: Zod? Joi? (check dependencies)
5. Testing: Jest? Vitest? (check devDependencies)
6. What version of Prisma?
7. Any notification-related libraries already installed?

## Phase 5: Configuration Analysis
Explore: C:\Users\Aaron\Documents\Projects\breederhq-api\.env.example (if exists) or src/config/

Tell me:
1. What environment variables are used?
2. Are there email/SMTP settings configured?
3. Are there job queue settings (Redis URL, etc.)?
4. What external services are already integrated?

---

After exploring ALL FIVE PHASES above, provide:

1. **RECONNAISSANCE SUMMARY:** What exists relevant to notification system
2. **GAP ANALYSIS:** Spec requirements vs. what exists
3. **IMPLEMENTATION STRATEGY:** Extend existing or build fresh (with reasoning)
4. **ADJUSTED IMPLEMENTATION PLAN:** Modified based on findings
5. **QUESTIONS:** Any conflicts or decisions needed

DO NOT implement anything until I review your reconnaissance report.
```

---

## Quick Commands for Claude Code

Once implementation starts, you can use these shorthand commands:

```
"Start Sprint 1" - Begin implementing notification system
"Review Day 1-2" - Show me database schema changes before migration
"Run migrations" - Execute prisma migrate dev
"Create notification service" - Implement Day 3-4 work
"Add API routes" - Implement Day 5-6 work
"Build frontend components" - Implement Day 9-10 work
"Write tests" - Add test coverage
"Deploy to staging" - Deployment steps
"Sprint 1 checklist" - Show current progress
"Move to Sprint 2" - Start marketplace UI work
```

---

## Troubleshooting Prompts

If Claude Code gets stuck:

```
"Show me what exists already for notifications"
"What patterns should I follow from existing code?"
"Help me debug this Prisma migration error: [error]"
"Review my implementation of [function/component]"
"What's the best way to test [feature]?"
"How do I set up background jobs in this codebase?"
```

---

**Save this file and use the main prompt to start implementation work with Claude Code!**
