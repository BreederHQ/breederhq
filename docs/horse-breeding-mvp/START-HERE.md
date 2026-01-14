# 🚀 START HERE: Quick Launch Prompt for Claude Code

**Copy and paste this into a new Claude Code session to begin implementation**

---

## The Prompt (Copy Everything Below)

```
I need your help implementing the Horse Breeding MVP for BreederHQ.

## Context
We have comprehensive engineering specifications in /docs/horse-breeding-mvp/ for building a competitive horse breeding management platform. We need to implement these features starting with Sprint 1: Notification System.

## CRITICAL FIRST STEP: Reconnaissance

Before implementing anything, you MUST explore the existing codebase at:
- C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma (database)
- C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\ (API routes)
- C:\Users\Aaron\Documents\Projects\breederhq-api\src\services\ (services)
- C:\Users\Aaron\Documents\Projects\breederhq-api\package.json (dependencies)

## Your Tasks (In Order)

### 1. Read Documentation
- /docs/horse-breeding-mvp/QUICK-START-GUIDE.md - How to get started
- /docs/horse-breeding-mvp/CLAUDE-CODE-PROMPT.md - Full instructions
- /docs/horse-breeding-mvp/03-NOTIFICATION-SYSTEM-SPEC.md - Sprint 1 spec

### 2. Conduct Reconnaissance (MANDATORY)

Explore and report on:

#### Database Schema (schema.prisma)
- Total models count
- Horse-specific models (Animal, BreedingPlan, PregnancyCheck, etc.)
- Notification models (do ANY exist already?)
- Enums (Species, NotificationType, etc.)
- Multi-tenancy pattern (tenantId?)
- Key relationships and indexes

#### API Routes (src/routes/)
- All route files
- Notification/email routes (do they exist?)
- Authentication pattern (JWT? middleware?)
- Validation approach (Zod? Joi?)
- Error handling pattern
- Tenant isolation enforcement

#### Services (src/services/)
- All service files
- email-service.ts exists? (what library?)
- notification-service.ts exists?
- Job queue infrastructure? (Bull? BullMQ?)
- Business logic patterns

#### Dependencies (package.json)
- Email library: SendGrid? Nodemailer? Resend?
- SMS library: Twilio?
- Job queue: Bull? BullMQ? Agenda?
- Validation: Zod? Joi?
- Testing: Jest? Vitest?
- Prisma version

### 3. Provide Reconnaissance Report

After exploring, provide:

**WHAT EXISTS:**
- Database: [models relevant to notifications]
- Routes: [notification/email routes or NONE]
- Services: [email/notification services or NONE]
- Dependencies: [relevant libraries or NONE]

**WHAT NEEDS BUILDING:**
- [Gap analysis: Spec requirements vs. reality]

**IMPLEMENTATION STRATEGY:**
- Should we extend existing infrastructure or build fresh?
- Any conflicts with existing patterns?
- Any opportunities to reuse code?

**ADJUSTED PLAN:**
- Day 1-2: [schema work, adjusted for what exists]
- Day 3-4: [service work, adjusted for what exists]
- Day 5-6: [API routes, adjusted for what exists]
- Day 7-8: [background jobs, adjusted for what exists]
- Day 9-10: [frontend, adjusted for what exists]

**QUESTIONS:**
- [Any decisions needed before proceeding]

### 4. Wait for Approval

DO NOT implement anything until I review your reconnaissance report and approve the plan.

### 5. Start Implementation

Once approved, begin with Day 1-2: Database Schema according to adjusted plan.

---

## Success Criteria

Your reconnaissance is complete when you've answered:
- ✅ Do notification models already exist in schema.prisma?
- ✅ Do notification routes already exist in src/routes/?
- ✅ Does email-service.ts exist? What library?
- ✅ Does background job infrastructure exist? What library?
- ✅ What patterns must I follow from existing code?
- ✅ What can be reused vs. built fresh?

## Important

- Read the full prompt in CLAUDE-CODE-PROMPT.md for detailed instructions
- Follow existing code patterns (authentication, validation, error handling)
- Write production-quality code with tests
- Never skip reconnaissance - understanding what exists is CRITICAL

Let's start with reconnaissance!
```

---

## What Happens Next

Claude Code will:

1. ✅ Read the Quick Start Guide and main prompt
2. ✅ Explore schema.prisma (all ~6000 lines if needed)
3. ✅ Explore src/routes/ (all route files)
4. ✅ Explore src/services/ (all services)
5. ✅ Check package.json dependencies
6. ✅ Provide comprehensive reconnaissance report
7. ⏸️ Wait for your approval
8. 🚀 Start implementing with adjusted plan

---

## If You Want Even More Specific First Step

Use this ultra-specific prompt:

```
Read /docs/horse-breeding-mvp/CLAUDE-CODE-PROMPT.md for full instructions.

Then conduct Phase 1 of reconnaissance:

Explore C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma and tell me:

1. How many models exist total?
2. Is there a Notification model already?
3. Is there a NotificationPreference model already?
4. Is there a NotificationDelivery model already?
5. What enums exist? (especially NotificationType if it exists)
6. What horse-specific models exist? (Animal, BreedingPlan, etc.)
7. How is multi-tenancy handled? (tenantId on every model?)

After answering these, I'll ask you to continue with Phase 2-5.
```

---

## Quick Reference

**Main Documentation:**
- [README.md](./README.md) - Overview of all docs
- [QUICK-START-GUIDE.md](./QUICK-START-GUIDE.md) - For engineers
- [CLAUDE-CODE-PROMPT.md](./CLAUDE-CODE-PROMPT.md) - Full implementation prompt

**Specs:**
- [03-NOTIFICATION-SYSTEM-SPEC.md](./03-NOTIFICATION-SYSTEM-SPEC.md) - Sprint 1 (start here)
- [04-BREEDING-PROGRAM-MARKETPLACE-SPEC.md](./04-BREEDING-PROGRAM-MARKETPLACE-SPEC.md) - Sprint 2
- [08-IMPLEMENTATION-ROADMAP.md](./08-IMPLEMENTATION-ROADMAP.md) - Full 20-week plan

**Key Locations:**
- Database: `C:\Users\Aaron\Documents\Projects\breederhq-api\prisma\schema.prisma`
- API Routes: `C:\Users\Aaron\Documents\Projects\breederhq-api\src\routes\`
- Services: `C:\Users\Aaron\Documents\Projects\breederhq-api\src\services\`
- Frontend: `C:\Users\Aaron\Documents\Projects\breederhq\apps\portal\`

---

**Copy the prompt above and start a new Claude Code session! 🚀**
