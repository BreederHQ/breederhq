# Quick Start Guide for Engineers

**Start here if you're building the Horse Breeding MVP**

---

## 🚀 I'm an engineer, what do I do first?

### Step 1: Understand What Exists (30 minutes)
Read: **[01-CURRENT-STATE-INVENTORY.md](./01-CURRENT-STATE-INVENTORY.md)**

**Key Takeaways:**
- ✅ Backend is 95% complete (excellent data models)
- ⚠️ Frontend has gaps (marketplace UI ~10% complete)
- ❌ No notification system (critical blocker)

**Files to explore:**
- `/breederhq-api/prisma/schema.prisma` - All database models
- `/breederhq-api/src/routes/animals.ts` - Animal CRUD operations
- `/breederhq-api/src/services/lineage-service.ts` - COI calculation
- `/breederhq/apps/animals/src/App-Animals.tsx` - Frontend animal management

---

### Step 2: Review Sprint Plan (15 minutes)
Read: **[08-IMPLEMENTATION-ROADMAP.md](./08-IMPLEMENTATION-ROADMAP.md)**

**Your 20-week journey:**
1. **Sprint 0** (Weeks 1-2): Dev environment setup
2. **Sprint 1** (Weeks 3-4): Notification system ← START HERE
3. **Sprint 2** (Weeks 5-6): Marketplace UI
4. **Sprint 3** (Weeks 7-8): Foaling automation
5. **Sprints 4-8**: Additional features
6. **Sprint 9** (Weeks 19-20): Private beta
7. **Sprint 10** (Week 21): Public launch

---

### Step 3: Set Up Dev Environment (Sprint 0)

#### Prerequisites
- Node.js 18+ (LTS)
- PostgreSQL 14+
- Git
- VS Code (or your preferred IDE)

#### Clone and Install
```bash
cd c:/Users/Aaron/Documents/Projects/breederhq
git checkout -b feature/horse-breeding-mvp

# Install API dependencies
cd breederhq-api
npm install

# Install frontend dependencies
cd ../breederhq
npm install

# Set up database
cd breederhq-api
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx prisma migrate dev

# Seed database (if seed script exists)
npm run seed
```

#### Verify Setup
```bash
# Start API server
cd breederhq-api
npm run dev
# Should start on http://localhost:3000

# Start frontend (separate terminal)
cd breederhq
npm run dev
# Should start on http://localhost:5173 (or similar)

# Run tests
npm test
```

---

## 📋 Sprint 1: Notification System (YOUR FIRST TASK)

**Timeline:** 1-2 weeks
**Spec:** [03-NOTIFICATION-SYSTEM-SPEC.md](./03-NOTIFICATION-SYSTEM-SPEC.md)

### What You're Building
An alert/notification system that sends email/SMS reminders to breeders:
- Vaccination expiring soon
- Pregnancy check due
- Foaling date approaching
- Heat cycle expected
- Marketplace inquiries

### Implementation Checklist

#### Day 1-2: Database Schema
- [ ] Add `Notification` table to schema
- [ ] Add `NotificationPreference` table
- [ ] Add `NotificationDelivery` table
- [ ] Run `prisma migrate dev`

**File to edit:** `/breederhq-api/prisma/schema.prisma`

**Schema to add:** (See 03-NOTIFICATION-SYSTEM-SPEC.md, Section 3.1)

```prisma
model Notification {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String?
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
}

enum NotificationType {
  vaccination_expiring
  breeding_timeline_reminder
  pregnancy_check_due
  foaling_approaching
  heat_cycle_expected
  marketplace_inquiry
  // ... see spec for all 12 types
}
```

#### Day 3-4: Notification Service
- [ ] Create notification service (`/breederhq-api/src/services/notification-service.ts`)
- [ ] Implement notification creation logic
- [ ] Implement notification scheduling logic
- [ ] Add email delivery (SendGrid or similar)
- [ ] Add SMS delivery (Twilio - optional for MVP)

**File to create:** `/breederhq-api/src/services/notification-service.ts`

**Key functions to implement:**
```typescript
class NotificationService {
  // Create notification
  async createNotification(data: CreateNotificationInput): Promise<Notification>

  // Schedule notification
  async scheduleNotification(notificationId: number, scheduledFor: Date): Promise<void>

  // Send notification
  async sendNotification(notificationId: number): Promise<void>

  // Mark as read
  async markAsRead(notificationId: number): Promise<void>

  // Get user notifications
  async getUserNotifications(userId: string, filters?: NotificationFilters): Promise<Notification[]>
}
```

#### Day 5-6: API Endpoints
- [ ] Create notification routes (`/breederhq-api/src/routes/notifications.ts`)
- [ ] Implement 10 endpoints (see spec)

**File to create:** `/breederhq-api/src/routes/notifications.ts`

**Endpoints to implement:**
```typescript
// GET /api/notifications - List user notifications
// GET /api/notifications/:id - Get single notification
// POST /api/notifications - Create notification (admin/system)
// PATCH /api/notifications/:id/read - Mark as read
// PATCH /api/notifications/:id/unread - Mark as unread
// DELETE /api/notifications/:id - Delete notification
// GET /api/notifications/preferences - Get user preferences
// PUT /api/notifications/preferences - Update preferences
// POST /api/notifications/test - Send test notification
// GET /api/notifications/stats - Get notification stats
```

#### Day 7-8: Background Jobs
- [ ] Set up job queue (Bull, BullMQ, or similar)
- [ ] Create daily notification scan job
- [ ] Create vaccination expiry checker
- [ ] Create breeding timeline checker
- [ ] Create foaling date checker
- [ ] Create heat cycle predictor

**File to create:** `/breederhq-api/src/jobs/notification-jobs.ts`

**Jobs to implement:**
```typescript
// Daily scan (runs every day at 6am)
async function scanForUpcomingEvents() {
  // Check vaccination expiring in 7 days, 1 day
  // Check pregnancy checks due
  // Check foaling dates approaching (30, 14, 7 days)
  // Check expected heat cycles
  // Create notifications
}

// Hourly scan (runs every hour)
async function scanForImminentEvents() {
  // Check foaling dates within 24 hours
  // Check breeding appointments today
}
```

#### Day 9-10: Frontend Components
- [ ] Create notification center component
- [ ] Create notification bell icon (with badge)
- [ ] Create notification dropdown
- [ ] Create notification preferences page
- [ ] Add to portal navigation

**Files to create:**
- `/breederhq/apps/portal/src/components/NotificationCenter.tsx`
- `/breederhq/apps/portal/src/components/NotificationBell.tsx`
- `/breederhq/apps/portal/src/components/NotificationDropdown.tsx`
- `/breederhq/apps/portal/src/pages/NotificationPreferencesPage.tsx`

#### Day 11-12: Testing
- [ ] Unit tests (service layer)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (frontend interactions)
- [ ] Test email/SMS delivery (sandbox mode)

**Target coverage:** 80%+

#### Day 13-14: QA & Deploy
- [ ] Manual QA testing (all alert types)
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production (behind feature flag)

---

## 📋 Sprint 2: Marketplace UI (NEXT TASK)

**Timeline:** 2-3 weeks
**Spec:** [04-BREEDING-PROGRAM-MARKETPLACE-SPEC.md](./04-BREEDING-PROGRAM-MARKETPLACE-SPEC.md)

### What You're Building
Public-facing breeding program showcase pages:
- Breeder profile pages
- Breeding program detail pages (programStory, media gallery, pricing)
- Marketplace index page (search, filter, browse)
- Waitlist signup forms
- Inquiry contact forms

### Implementation Checklist

#### Week 1: Public Program Page
- [ ] Create public program page route (`/marketplace/:breederSlug/:programSlug`)
- [ ] Hero section with cover image
- [ ] Program story (rich text rendering)
- [ ] Media gallery (photos/videos with lightbox)
- [ ] Pricing tier display
- [ ] "Join Waitlist" button + form
- [ ] "Contact Breeder" button + form
- [ ] SEO optimization (meta tags, Open Graph)

**Files to create:**
- `/breederhq-www/src/pages/BreedingProgramPublicPage.tsx`
- `/breederhq-www/src/components/BreedingProgramHero.tsx`
- `/breederhq-www/src/components/MediaGallery.tsx`
- `/breederhq-www/src/components/PricingTierDisplay.tsx`
- `/breederhq-www/src/components/WaitlistForm.tsx`

#### Week 2: Marketplace Index
- [ ] Create marketplace index page (`/marketplace/breeding-programs`)
- [ ] Program cards (grid layout)
- [ ] Search by name/breed
- [ ] Filter by species, breed, price range
- [ ] Sort by newest, price, popularity
- [ ] Pagination

**Files to create:**
- `/breederhq-www/src/pages/BreedingProgramsIndexPage.tsx`
- `/breederhq-www/src/components/BreedingProgramCard.tsx`
- `/breederhq-www/src/components/MarketplaceFilters.tsx`

#### Week 3: Responsive & Polish
- [ ] Mobile optimization (responsive design)
- [ ] Touch target sizing (44px minimum)
- [ ] Performance optimization (lazy loading images)
- [ ] Accessibility review (WCAG 2.1 AA)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

---

## 📚 Reference: Key Files in Codebase

### Backend (API)
```
/breederhq-api/
├── prisma/
│   └── schema.prisma                    # Database schema (ALL MODELS HERE)
├── src/
│   ├── routes/
│   │   ├── animals.ts                   # Animal CRUD operations
│   │   ├── animal-vaccinations.ts       # Vaccination tracking
│   │   ├── breeding-plans.ts            # Breeding plan management
│   │   ├── breeding-programs.ts         # Breeding program CRUD
│   │   └── marketplace-*.ts             # Marketplace routes
│   └── services/
│       ├── lineage-service.ts           # COI calculation, pedigree
│       └── email-service.ts             # Email sending (if exists)
```

### Frontend (Apps)
```
/breederhq/
├── apps/
│   ├── animals/                         # Animal management app
│   │   └── src/App-Animals.tsx          # Main entry point
│   ├── portal/                          # Breeder portal
│   │   └── src/pages/                   # Portal pages
│   ├── marketplace/                     # Public marketplace
│   │   └── src/marketplace/pages/       # Marketplace pages
│   └── www/                             # Marketing site
│       └── src/pages/                   # Public pages
```

---

## 🔧 Development Tools

### Recommended VS Code Extensions
- Prisma (database schema)
- ESLint (code quality)
- Prettier (code formatting)
- TypeScript Vue Plugin (if using Vue)
- React Developer Tools (if using React)

### Useful Commands
```bash
# Database
npx prisma studio                # Visual database editor
npx prisma migrate dev           # Run migrations
npx prisma generate              # Generate Prisma client

# Testing
npm test                         # Run all tests
npm test -- --coverage           # Run with coverage
npm run test:watch               # Watch mode

# Linting
npm run lint                     # Check for issues
npm run lint:fix                 # Auto-fix issues

# Building
npm run build                    # Production build
npm run preview                  # Preview production build
```

---

## 🐛 Common Issues & Solutions

### Issue: Prisma client out of sync
**Error:** `The Prisma Client is out of sync...`
**Solution:**
```bash
npx prisma generate
```

### Issue: Database migration fails
**Error:** Migration fails due to existing data
**Solution:**
```bash
# Reset database (CAUTION: deletes all data)
npx prisma migrate reset

# Or create migration manually
npx prisma migrate dev --create-only
# Edit migration file
npx prisma migrate dev
```

### Issue: Port already in use
**Error:** `EADDRINUSE: address already in use :::3000`
**Solution:**
```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Issue: TypeScript errors after schema change
**Error:** Type errors in API routes
**Solution:**
```bash
npx prisma generate  # Regenerate types
npm run build        # Rebuild TypeScript
```

---

## 📖 Learning Resources

### Prisma (Database ORM)
- Docs: https://www.prisma.io/docs
- Schema reference: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate

### Email Sending
- SendGrid: https://sendgrid.com/docs
- Nodemailer: https://nodemailer.com/about/

### Job Queues
- Bull: https://github.com/OptimalBits/bull
- BullMQ: https://docs.bullmq.io/

### Testing
- Jest: https://jestjs.io/docs/getting-started
- Playwright: https://playwright.dev/docs/intro

---

## ❓ Questions?

### Technical Questions
1. **Check the spec first:** Each feature spec (03-10) has detailed technical requirements
2. **Check existing code:** Search for similar implementations in codebase
3. **Check Prisma schema:** All data models are in `/breederhq-api/prisma/schema.prisma`

### Product Questions
1. **Check Executive Summary:** [00-EXECUTIVE-SUMMARY.md](./00-EXECUTIVE-SUMMARY.md)
2. **Check Implementation Roadmap:** [08-IMPLEMENTATION-ROADMAP.md](./08-IMPLEMENTATION-ROADMAP.md)

### Process Questions
1. **Follow the roadmap:** [08-IMPLEMENTATION-ROADMAP.md](./08-IMPLEMENTATION-ROADMAP.md) is your sprint-by-sprint guide
2. **Use the checklists:** Each feature spec has an implementation checklist

---

## ✅ Daily Checklist

### Every Morning
- [ ] Pull latest code (`git pull origin dev`)
- [ ] Check for blockers (dependency issues, environment problems)
- [ ] Review today's tasks (refer to sprint plan)
- [ ] Run tests to ensure baseline is working (`npm test`)

### Every Evening
- [ ] Commit your work (`git add . && git commit -m "..."`)
- [ ] Push to branch (`git push origin feature/your-branch`)
- [ ] Update progress (mark checklist items complete)
- [ ] Document any blockers or questions

### Before Each Sprint Review
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code coverage >80%
- [ ] No critical bugs
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Demo prepared (what to show product owner)

---

## 🚀 Ready to Start?

### Your First Week (Sprint 0):
1. **Clone repo and set up environment** (Day 1)
2. **Explore codebase** (Day 2)
   - Read `/breederhq-api/prisma/schema.prisma`
   - Explore `/breederhq-api/src/routes/animals.ts`
   - Run app locally and create test horse
3. **Set up CI/CD pipeline** (Day 3-4)
   - GitHub Actions or similar
   - Run tests on every PR
4. **Set up error monitoring** (Day 4-5)
   - Sentry, Rollbar, or similar
   - Track errors in production
5. **Review Sprint 1 spec** (Day 5)
   - Read [03-NOTIFICATION-SYSTEM-SPEC.md](./03-NOTIFICATION-SYSTEM-SPEC.md) thoroughly
   - Write implementation plan

### Then Dive Into Sprint 1:
Start with notification system - it's the highest priority showstopper.

---

**Let's build this! 🐴**

---

**Document:** Quick Start Guide for Engineers
**Last Updated:** 2026-01-14
**Next Review:** After Sprint 1 completion
