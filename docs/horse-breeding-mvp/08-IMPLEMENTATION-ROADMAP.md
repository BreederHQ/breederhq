# 08-IMPLEMENTATION-ROADMAP.md
# 20-Week Implementation Roadmap - Sprint-by-Sprint Plan

**Document Version:** 1.0
**Last Updated:** 2026-01-14
**Status:** Draft - Ready for Execution

---

## Executive Summary

This document provides a detailed, sprint-by-sprint implementation plan for building the complete horse breeding MVP over 20 weeks (5 months).

### Team Structure
- **1 Senior Full-Stack Engineer** (primary developer)
- **1 Part-Time Designer** (15 hours/week for UI/UX)
- **1 Product Manager** (you - Aaron) (10-15 hours/week for direction/testing)

### Total Timeline: 20 Weeks
- **Sprints:** 10 two-week sprints
- **Start Date:** Week of January 20, 2026
- **Beta Launch:** Week of May 26, 2026 (Week 19)
- **Public Launch:** Week of June 9, 2026 (Week 21)

### Total Estimated Cost
- **Engineering:** $80,000-100,000 (20 weeks @ $4,000-5,000/week)
- **Design:** $9,000-12,000 (60 hours total @ $150/hour)
- **Total:** $89,000-112,000

**Value if Outsourced:** $180,000-220,000
**Savings:** $80,000-108,000 (48-56%)

---

## Table of Contents

1. [Sprint 0: Planning & Setup (Week 1-2)](#sprint-0-week-1-2)
2. [Sprint 1: Core Breeding Features (Week 3-4)](#sprint-1-week-3-4)
3. [Sprint 2: Notification System (Week 5-6)](#sprint-2-week-5-6)
4. [Sprint 3: Foaling Automation (Week 7-8)](#sprint-3-week-7-8)
5. [Sprint 4: Buyer CRM Phase 1 (Week 9-10)](#sprint-4-week-9-10)
6. [Sprint 5: Buyer CRM Phase 2 (Week 11-12)](#sprint-5-week-11-12)
7. [Sprint 6: Registry Integration Phase 1 (Week 13-14)](#sprint-6-week-13-14)
8. [Sprint 7: Registry Integration Phase 2 (Week 15-16)](#sprint-7-week-15-16)
9. [Sprint 8: Marketplace & Polish (Week 17-18)](#sprint-8-week-17-18)
10. [Sprint 9: Beta Testing & Refinement (Week 19-20)](#sprint-9-week-19-20)
11. [Post-Launch: First 30 Days](#post-launch-first-30-days)

---

## Sprint 0: Planning & Setup
**Duration:** Week 1-2 (January 20 - February 2, 2026)

### Goals
- Set up development environment
- Establish code standards and workflows
- Design system foundation
- Technical architecture decisions

### Engineering Tasks (40 hours)

#### Week 1: Infrastructure Setup
- [ ] **Development Environment** (8 hours)
  - Set up local development with Docker
  - Configure PostgreSQL database
  - Set up Prisma ORM
  - Configure Next.js app structure
  - Set up TailwindCSS
  - Configure TypeScript strict mode

- [ ] **CI/CD Pipeline** (6 hours)
  - GitHub Actions for automated testing
  - Automated database migrations
  - Staging environment setup
  - Production deployment pipeline

- [ ] **Code Quality Tools** (4 hours)
  - ESLint configuration
  - Prettier setup
  - Husky pre-commit hooks
  - TypeScript strict checks

- [ ] **Testing Framework** (4 hours)
  - Jest for unit tests
  - React Testing Library
  - Supertest for API tests
  - Test database setup

#### Week 2: Foundation Code
- [ ] **Authentication System** (10 hours)
  - User registration/login
  - Session management
  - Password reset flow
  - Email verification

- [ ] **Base Data Models** (8 hours)
  - Organization model
  - User model
  - Animal model (core fields only)
  - Base Prisma schema

### Design Tasks (8 hours)

- [ ] **Design System** (4 hours)
  - Color palette
  - Typography scale
  - Component library foundation
  - Icon set selection

- [ ] **Core Layouts** (4 hours)
  - Dashboard layout
  - Sidebar navigation
  - Header/footer
  - Mobile responsive breakpoints

### Deliverables
- ✅ Working development environment
- ✅ Deployment pipeline functional
- ✅ Authentication working
- ✅ Design system v1 complete

---

## Sprint 1: Core Breeding Features
**Duration:** Week 3-4 (February 3 - February 16, 2026)

### Goals
- Implement animal management (CRUD)
- Build breeding records system
- Create basic dashboard

### Engineering Tasks (80 hours)

#### Database & API (30 hours)
- [ ] **Animal Management** (12 hours)
  - Complete Animal model with all fields
  - CRUD API endpoints
  - Photo upload functionality
  - Validation logic

- [ ] **Breeding Records** (12 hours)
  - Breeding model
  - Create/read/update/delete APIs
  - Link to animals (mare/stallion)
  - Breeding method selection

- [ ] **Basic Analytics** (6 hours)
  - Count active animals
  - Count active breedings
  - Success rate calculation
  - Dashboard summary API

#### Frontend Components (40 hours)
- [ ] **Animal Management** (20 hours)
  - Animals list page
  - Animal detail page
  - Add/edit animal form
  - Photo gallery component
  - Animal filters & search

- [ ] **Breeding Management** (15 hours)
  - Breedings list page
  - Breeding detail page
  - Add/edit breeding form
  - Link to animals
  - Breeding status badges

- [ ] **Dashboard** (5 hours)
  - Summary cards
  - Recent activity feed
  - Quick actions

#### Testing (10 hours)
- [ ] Unit tests for business logic
- [ ] API integration tests
- [ ] Frontend component tests

### Design Tasks (6 hours)
- [ ] Animal card designs
- [ ] Breeding form layouts
- [ ] Dashboard wireframes
- [ ] Mobile responsive designs

### Deliverables
- ✅ Full animal CRUD working
- ✅ Full breeding CRUD working
- ✅ Dashboard shows summary data
- ✅ 80% test coverage

### Demo-able Features
- Add horse with photos
- Create breeding record
- View breeding history
- See dashboard stats

---

## Sprint 2: Notification System
**Duration:** Week 5-6 (February 17 - March 2, 2026)

### Goals
- Build comprehensive notification system
- Implement email delivery
- Add push notifications
- Create notification preferences

### Engineering Tasks (75 hours)

#### Backend Infrastructure (35 hours)
- [ ] **Database Models** (8 hours)
  - Notification model
  - NotificationPreference model
  - NotificationSchedule model
  - NotificationTemplate model

- [ ] **Notification Engine** (12 hours)
  - Create notification
  - Delivery queue
  - Multi-channel delivery (in-app, email, push)
  - Scheduled notifications
  - Batch processing

- [ ] **Email Integration** (8 hours)
  - SendGrid/Resend integration
  - Email templates (React Email)
  - Transactional emails
  - Email tracking (opens/clicks)

- [ ] **Push Notifications** (7 hours)
  - Web push setup
  - Service worker
  - Push subscription management

#### API Endpoints (15 hours)
- [ ] GET /api/notifications (list)
- [ ] GET /api/notifications/:id (detail)
- [ ] PATCH /api/notifications/:id/read
- [ ] DELETE /api/notifications/:id
- [ ] GET /api/notifications/preferences
- [ ] PATCH /api/notifications/preferences
- [ ] POST /api/notifications/test (testing)

#### Frontend (20 hours)
- [ ] **Notification Center** (12 hours)
  - Notification bell icon
  - Notification dropdown
  - Full notification list page
  - Mark as read/unread
  - Bulk actions

- [ ] **Notification Preferences** (8 hours)
  - Preferences page
  - Toggle by type
  - Channel selection (email/push/in-app)
  - Frequency settings
  - Quiet hours

#### Testing (5 hours)
- [ ] Notification delivery tests
- [ ] Email template tests
- [ ] Preference update tests

### Design Tasks (4 hours)
- [ ] Notification center UI
- [ ] Email template designs
- [ ] Preferences page mockup

### Deliverables
- ✅ In-app notifications working
- ✅ Email notifications sending
- ✅ Push notifications enabled
- ✅ User can customize preferences

### Demo-able Features
- Receive breeding reminder in-app
- Get email notification
- Customize notification settings
- View notification history

---

## Sprint 3: Foaling Automation
**Duration:** Week 7-8 (March 3 - March 16, 2026)

### Goals
- Automatic foaling date calculation
- Progressive milestone system
- Foaling calendar view
- Foaling outcome recording

### Engineering Tasks (70 hours)

#### Database & Core Logic (25 hours)
- [ ] **Database Models** (8 hours)
  - FoalingRecord model
  - FoalingMilestone model
  - BreedingCycleLog model
  - Update Breeding model

- [ ] **Date Calculation Logic** (8 hours)
  - Calculate expected foaling date (breeding + 340 days)
  - Breed-specific gestation periods
  - Mare-specific adjustments based on history
  - Confidence ranges

- [ ] **Milestone System** (9 hours)
  - Auto-create milestones on pregnancy confirmation
  - Progressive notifications (270, 300, 320, 330, 340, 350 days)
  - Mark milestones complete
  - Overdue detection

#### API Endpoints (18 hours)
- [ ] POST /api/foaling/records (create)
- [ ] GET /api/foaling/records (list with filters)
- [ ] GET /api/foaling/records/:id (detail)
- [ ] PATCH /api/foaling/records/:id (update)
- [ ] POST /api/foaling/records/:id/foal (record actual foaling)
- [ ] POST /api/foaling/milestones/:id/complete
- [ ] GET /api/foaling/calendar (calendar view data)
- [ ] GET /api/foaling/upcoming (dashboard widget)

#### Frontend (22 hours)
- [ ] **Foaling Dashboard** (8 hours)
  - Calendar view
  - Summary cards
  - Upcoming foalings widget
  - Overdue alerts

- [ ] **Foaling Records** (8 hours)
  - List view with filters
  - Foaling record detail
  - Timeline of milestones
  - Status badges

- [ ] **Record Foaling Modal** (6 hours)
  - Actual foaling date/time
  - Foal details form
  - Mare condition
  - Complication tracking
  - Photo upload

#### Testing & Automation (5 hours)
- [ ] Unit tests for date calculations
- [ ] Milestone generation tests
- [ ] Cron job for status updates
- [ ] Notification integration tests

### Design Tasks (5 hours)
- [ ] Foaling calendar design
- [ ] Foaling record detail page
- [ ] Record foaling modal
- [ ] Milestone timeline

### Deliverables
- ✅ Auto-calculated foaling dates
- ✅ Progressive notifications working
- ✅ Foaling calendar functional
- ✅ Can record actual foaling with foal details

### Demo-able Features
- Confirm pregnancy → automatic foaling date calculated
- See foaling calendar with all expected dates
- Receive "foaling imminent" notification
- Record foaling and create foal animal record

---

## Sprint 4: Buyer CRM Phase 1
**Duration:** Week 9-10 (March 17 - March 30, 2026)

### Goals
- Buyer management (CRUD)
- Buyer-to-horse interest tracking
- Activity logging
- Basic sales pipeline

### Engineering Tasks (75 hours)

#### Database Models (15 hours)
- [ ] Buyer model
- [ ] BuyerInterest model
- [ ] Deal model
- [ ] Activity model
- [ ] Note model
- [ ] BuyerTag model

#### API Endpoints (25 hours)
- [ ] **Buyer Management** (12 hours)
  - POST /api/buyers (create)
  - GET /api/buyers (list with filters)
  - GET /api/buyers/:id (detail)
  - PATCH /api/buyers/:id (update)
  - POST /api/buyers/:id/interests (add interest)

- [ ] **Deal Management** (8 hours)
  - POST /api/deals (create)
  - GET /api/deals (list)
  - GET /api/deals/:id (detail)
  - PATCH /api/deals/:id/stage (update stage)
  - POST /api/deals/:id/close (close won/lost)

- [ ] **Activities** (5 hours)
  - POST /api/activities (create)
  - GET /api/activities (list)
  - PATCH /api/activities/:id (update)

#### Frontend Components (30 hours)
- [ ] **Buyers List** (10 hours)
  - List/grid view
  - Filters and search
  - Buyer cards
  - Quick add modal

- [ ] **Buyer Detail** (12 hours)
  - Buyer info display
  - Interest list
  - Activity timeline
  - Notes section
  - Tags

- [ ] **Sales Pipeline** (8 hours)
  - Kanban board layout
  - Deal cards
  - Drag-and-drop (react-beautiful-dnd)
  - Pipeline summary

#### Testing (5 hours)
- [ ] Buyer CRUD tests
- [ ] Interest tracking tests
- [ ] Pipeline stage tests

### Design Tasks (6 hours)
- [ ] Buyer list layout
- [ ] Buyer detail page design
- [ ] Pipeline kanban design
- [ ] Deal card design

### Deliverables
- ✅ Full buyer management
- ✅ Track buyer interest in horses
- ✅ Visual sales pipeline
- ✅ Activity logging

### Demo-able Features
- Add buyer from inquiry
- Link buyer to interested horses
- Move deal through pipeline stages
- Log call/email with buyer

---

## Sprint 5: Buyer CRM Phase 2
**Duration:** Week 11-12 (March 31 - April 13, 2026)

### Goals
- Email integration
- Follow-up automation
- Sales analytics
- Task management

### Engineering Tasks (70 hours)

#### Email Integration (20 hours)
- [ ] Send emails from platform
- [ ] Email templates
- [ ] Email tracking (opens/clicks)
- [ ] Scheduled send
- [ ] Email activity logging

#### Automation (15 hours)
- [ ] Auto-schedule follow-ups
- [ ] Lead scoring algorithm
- [ ] Deal probability calculation
- [ ] Stale lead detection
- [ ] Temperature auto-adjustment

#### Analytics API (12 hours)
- [ ] GET /api/deals/analytics
- [ ] Conversion rate by stage
- [ ] Average deal value
- [ ] Lead source ROI
- [ ] Sales velocity
- [ ] Revenue forecasting

#### Frontend (18 hours)
- [ ] **Email Composer** (8 hours)
  - Rich text editor
  - Template selection
  - Recipient selection
  - Schedule send

- [ ] **Task List** (5 hours)
  - Dashboard widget
  - Task list page
  - Mark complete
  - Overdue alerts

- [ ] **Analytics Dashboard** (5 hours)
  - Pipeline metrics
  - Conversion funnel
  - Charts and graphs
  - Export data

#### Testing (5 hours)
- [ ] Email delivery tests
- [ ] Automation logic tests
- [ ] Analytics calculation tests

### Design Tasks (4 hours)
- [ ] Email composer UI
- [ ] Task list widget
- [ ] Analytics dashboard

### Deliverables
- ✅ Send emails from platform
- ✅ Automatic follow-up scheduling
- ✅ Sales analytics dashboard
- ✅ Task management

### Demo-able Features
- Send email to buyer from platform
- Auto-scheduled follow-up appears in task list
- View sales analytics and conversion rates
- See revenue forecast

---

## Sprint 6: Registry Integration Phase 1
**Duration:** Week 13-14 (April 14 - April 27, 2026)

### Goals
- AQHA integration (primary focus)
- Import horse from registry
- Verify registration numbers
- Pedigree import

### Engineering Tasks (75 hours)

#### Infrastructure (20 hours)
- [ ] **Database Models** (8 hours)
  - RegistryIntegration model
  - AnimalRegistryRecord model
  - PedigreeRecord model
  - RegistrySyncLog model

- [ ] **Registry Client Interface** (12 hours)
  - RegistryClient interface
  - Auth handling (OAuth + API Key)
  - Error handling
  - Rate limiting
  - Retry logic

#### AQHA Client (25 hours)
- [ ] OAuth 2.0 authentication
- [ ] GET horse by registration number
- [ ] Search horses
- [ ] GET pedigree (5 generations)
- [ ] Verify registration
- [ ] Transform AQHA data to our format
- [ ] Handle AQHA-specific errors

#### API Endpoints (15 hours)
- [ ] POST /api/registry/connect
- [ ] POST /api/registry/import
- [ ] POST /api/registry/verify
- [ ] POST /api/registry/import/pedigree
- [ ] GET /api/registry/status
- [ ] POST /api/registry/sync/:animalId

#### Frontend (10 hours)
- [ ] **Registry Settings** (5 hours)
  - Connect registry page
  - OAuth flow UI
  - Connection status

- [ ] **Import Horse Modal** (5 hours)
  - Registry selection
  - Registration number input
  - Import progress
  - Success confirmation

#### Testing (5 hours)
- [ ] Mock AQHA client for tests
- [ ] Import flow tests
- [ ] Verification tests

### Design Tasks (4 hours)
- [ ] Registry settings page
- [ ] Import horse modal
- [ ] Connection status UI

### Deliverables
- ✅ Connect to AQHA
- ✅ Import horse data from AQHA
- ✅ Verify AQHA registration numbers
- ✅ Import 5-generation pedigree

### Demo-able Features
- Connect AQHA account via OAuth
- Import horse by entering AQHA registration number
- Auto-fill all horse data from AQHA
- View imported pedigree tree

---

## Sprint 7: Registry Integration Phase 2
**Duration:** Week 15-16 (April 28 - May 11, 2026)

### Goals
- Add 3 more registries (Jockey Club, AHA, APHA)
- Foal registration export
- Pedigree viewer
- Auto-sync system

### Engineering Tasks (70 hours)

#### Additional Registry Clients (30 hours)
- [ ] **Jockey Club Client** (10 hours)
  - API integration
  - Horse lookup
  - Pedigree import
  - Racing records

- [ ] **AHA Client** (10 hours)
  - API integration
  - Horse import
  - Pedigree import
  - Bloodline verification

- [ ] **APHA Client** (10 hours)
  - API integration
  - Horse import
  - Color pattern verification
  - Pedigree import

#### Foal Registration (15 hours)
- [ ] POST /api/registry/export/foal
- [ ] Registration deadline calculation
- [ ] Fee calculation
- [ ] Track submission status
- [ ] Deadline reminder notifications

#### Auto-Sync (10 hours)
- [ ] Cron job for daily sync
- [ ] Token refresh automation
- [ ] Stale data detection
- [ ] Sync conflict resolution

#### Frontend (10 hours)
- [ ] **Pedigree Viewer** (6 hours)
  - Tree visualization
  - Interactive nodes
  - Print/export PDF

- [ ] **Export Foal Modal** (4 hours)
  - Registry selection
  - Registration form
  - Fee display
  - Submit to registry

#### Testing (5 hours)
- [ ] Multi-registry tests
- [ ] Export flow tests
- [ ] Auto-sync tests

### Design Tasks (4 hours)
- [ ] Pedigree tree design
- [ ] Export foal form
- [ ] Sync status indicators

### Deliverables
- ✅ 4 registries integrated (AQHA, Jockey Club, AHA, APHA)
- ✅ Export foal for registration
- ✅ Beautiful pedigree viewer
- ✅ Auto-sync running daily

### Demo-able Features
- Import horse from any of 4 registries
- View interactive pedigree tree
- Export foal for registration
- Auto-sync keeps data fresh

---

## Sprint 8: Marketplace & Polish
**Duration:** Week 17-18 (May 12 - May 25, 2026)

### Goals
- Public marketplace for selling horses
- Search and filtering
- Messaging system
- UI/UX polish across all features

### Engineering Tasks (60 hours)

#### Marketplace (25 hours)
- [ ] **Database** (5 hours)
  - MarketplaceListing model
  - ListingInquiry model

- [ ] **API** (10 hours)
  - POST /api/marketplace/listings (create)
  - GET /api/marketplace/listings (public search)
  - GET /api/marketplace/listings/:id (detail)
  - PATCH /api/marketplace/listings/:id (update)
  - POST /api/marketplace/listings/:id/inquire

- [ ] **Frontend** (10 hours)
  - Marketplace browse page
  - Horse detail page (public)
  - Create/edit listing form
  - Inquiry form
  - Messaging UI

#### UI/UX Polish (25 hours)
- [ ] **Loading States** (5 hours)
  - Skeleton screens
  - Loading spinners
  - Progress indicators

- [ ] **Error States** (4 hours)
  - Error messages
  - Empty states
  - 404 pages

- [ ] **Responsive Design** (8 hours)
  - Mobile optimization
  - Tablet layouts
  - Touch interactions

- [ ] **Accessibility** (4 hours)
  - Keyboard navigation
  - Screen reader support
  - ARIA labels
  - Color contrast

- [ ] **Performance** (4 hours)
  - Image optimization
  - Code splitting
  - Lazy loading
  - Caching

#### Testing (10 hours)
- [ ] E2E tests for critical flows
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Cross-browser testing

### Design Tasks (8 hours)
- [ ] Marketplace listing cards
- [ ] Horse detail page (public)
- [ ] Mobile responsive designs
- [ ] Final design polish

### Deliverables
- ✅ Public marketplace functional
- ✅ Users can list horses for sale
- ✅ Buyers can inquire
- ✅ All features polished and responsive

### Demo-able Features
- List horse for sale
- Browse public marketplace
- Filter/search horses
- Send inquiry to breeder
- Responsive on mobile

---

## Sprint 9: Beta Testing & Refinement
**Duration:** Week 19-20 (May 26 - June 8, 2026)

### Goals
- Launch private beta to 10-15 users
- Gather feedback
- Fix bugs
- Refine based on real usage

### Beta Program

#### Week 19: Beta Launch
- [ ] **Beta User Recruitment** (complete Week 18)
  - Reach out to 20-30 breeders from interviews
  - Select 10-15 diverse users (sizes, breeds, experience)
  - Send beta invites with onboarding guide

- [ ] **Onboarding** (15 hours)
  - Welcome email sequence
  - Video tutorials (5 x 3min videos)
  - Sample data setup script
  - 1:1 onboarding calls

- [ ] **Monitoring Setup** (8 hours)
  - Error tracking (Sentry)
  - User analytics (PostHog/Mixpanel)
  - Performance monitoring
  - Feedback collection tool

#### Week 20: Iteration
- [ ] **Bug Fixes** (20 hours)
  - Fix critical bugs reported
  - Address usability issues
  - Performance improvements

- [ ] **Feature Refinements** (15 hours)
  - Adjust based on feedback
  - Polish rough edges
  - UX improvements

- [ ] **Documentation** (10 hours)
  - User documentation
  - Video tutorials
  - FAQ
  - Support articles

### Testing Activities

**Daily:**
- Monitor error logs
- Review user analytics
- Respond to user questions

**Weekly:**
- Group feedback session with beta users
- Prioritize improvements
- Deploy fixes

### Success Metrics

**Week 19 Goals:**
- 80% of beta users log in within 48 hours
- 60% complete onboarding tasks
- Average 30+ minutes per session

**Week 20 Goals:**
- 70% of beta users active 3+ days
- <5 critical bugs reported
- 80% positive feedback on core features
- NPS score 40+

### Deliverables
- ✅ 10-15 active beta users
- ✅ All critical bugs fixed
- ✅ Features refined based on feedback
- ✅ Documentation complete
- ✅ Ready for public launch

---

## Post-Launch: First 30 Days
**Duration:** Week 21-24 (June 9 - July 6, 2026)

### Week 21: Public Launch

#### Launch Activities
- [ ] **Marketing** (Aaron)
  - Announcement blog post
  - Social media campaign
  - Email to waitlist
  - Product Hunt launch
  - Horse breeder forum posts

- [ ] **Monitoring** (Engineer - 10 hours)
  - 24/7 error monitoring
  - Performance tracking
  - Support response

- [ ] **Quick Fixes** (Engineer - 30 hours)
  - Fix any critical issues
  - Quick wins from feedback

### Week 22-24: Growth & Iteration

#### Priorities
1. **Stability** - ensure platform is rock solid
2. **Support** - respond quickly to user questions
3. **Quick Wins** - ship small improvements weekly
4. **Feedback Loop** - weekly user interviews

#### Engineering Allocation (30 hours/week)
- Bug fixes: 40%
- Quick improvements: 30%
- New features (small): 20%
- Technical debt: 10%

#### Success Metrics
- 50+ signups in first month
- 30% activation rate (complete onboarding)
- 20% convert to paid
- <0.1% error rate
- <2 second average page load

---

## Resource Allocation Summary

### Total Engineering Hours: 1,200 hours
- Sprint 0: 80 hours
- Sprint 1: 80 hours
- Sprint 2: 75 hours
- Sprint 3: 70 hours
- Sprint 4: 75 hours
- Sprint 5: 70 hours
- Sprint 6: 75 hours
- Sprint 7: 70 hours
- Sprint 8: 60 hours
- Sprint 9: 45 hours (Beta)
- Post-Launch: 120 hours (4 weeks)

**At $80/hour:** $96,000
**At $100/hour:** $120,000

### Total Design Hours: 60 hours
- Sprint 0: 8 hours
- Sprint 1: 6 hours
- Sprint 2: 4 hours
- Sprint 3: 5 hours
- Sprint 4: 6 hours
- Sprint 5: 4 hours
- Sprint 6: 4 hours
- Sprint 7: 4 hours
- Sprint 8: 8 hours
- Sprint 9: 11 hours (videos + docs)

**At $150/hour:** $9,000

### Total Investment: $105,000-129,000

---

## Risk Management

### High Risks

#### 1. Registry API Changes
**Risk:** Registry APIs change or become unavailable
**Mitigation:**
- Build against stable API versions
- Version all API clients
- Fallback to manual entry if API down
- Monitor API health daily

#### 2. Beta User Churn
**Risk:** Beta users stop using during testing
**Mitigation:**
- Select highly engaged users
- Daily check-ins first week
- Immediate bug fixes
- Gamify feedback (rewards for activity)

#### 3. Scope Creep
**Risk:** Features expand beyond MVP
**Mitigation:**
- Strict feature prioritization
- "Not this sprint" backlog
- Weekly sprint reviews
- Focus on must-have, not nice-to-have

### Medium Risks

#### 4. Technical Complexity
**Risk:** Features take longer than estimated
**Mitigation:**
- 20% buffer in time estimates
- Simplify first, optimize later
- De-scope if necessary
- Pair programming for complex features

#### 5. Design Delays
**Risk:** Design becomes bottleneck
**Mitigation:**
- Design 1 sprint ahead
- Use design system components
- Accept "good enough" for beta
- Polish after validation

### Low Risks

#### 6. Infrastructure Issues
**Risk:** Hosting/database problems
**Mitigation:**
- Use proven platforms (Vercel, Supabase/Railway)
- Automated backups
- Monitoring and alerts
- Disaster recovery plan

---

## Success Criteria

### Sprint Success Metrics

Each sprint is considered successful if:
- ✅ 90%+ of planned features completed
- ✅ <3 critical bugs in production
- ✅ Demo to stakeholders is successful
- ✅ Code review completed
- ✅ Tests written (80% coverage)
- ✅ Documentation updated

### Beta Success Criteria

Beta is successful if:
- ✅ 10+ active users
- ✅ 70%+ retention through Week 20
- ✅ <5 critical bugs
- ✅ Positive feedback on core features (4/5 stars average)
- ✅ Users would recommend to others (60%+ "yes")

### Launch Success Criteria

Launch is successful if (first 30 days):
- ✅ 50+ signups
- ✅ 30% activation rate
- ✅ 20% convert to paid
- ✅ 3+ testimonials from power users
- ✅ <0.1% error rate
- ✅ 4+ star reviews

---

## Weekly Cadence

### Monday
- Sprint planning (if start of sprint)
- Review priorities for week
- Unblock any issues

### Wednesday
- Mid-week sync
- Demo progress
- Adjust plan if needed

### Friday
- End-of-week review
- Deploy to staging
- Plan next week

### Every 2 Weeks (Sprint End)
- Sprint demo to stakeholders
- Sprint retrospective
- Sprint planning for next sprint

---

## Key Milestones

| Week | Milestone | Description |
|------|-----------|-------------|
| 2 | Foundation Complete | Dev environment, auth, base models |
| 4 | Core MVP | Animals + breeding management working |
| 6 | Notifications Live | Multi-channel notifications functional |
| 8 | Foaling Automation | Auto-calculated foaling dates and calendar |
| 12 | CRM Complete | Full buyer management and sales pipeline |
| 16 | Registry Integrated | Import from 4+ breed registries |
| 18 | Feature Complete | All MVP features built |
| 19 | Beta Launch | 10-15 users testing |
| 21 | Public Launch | Open to all users |
| 24 | 1 Month Post-Launch | 50+ users, stable platform |

---

## Backlog (Post-MVP)

Features to build after initial launch:

### Phase 2 (Months 6-9)
- Mobile app (React Native)
- Advanced analytics
- Multi-user accounts (team features)
- Integrations (QuickBooks, Xero)
- Advanced marketplace (featured listings, promoted posts)

### Phase 3 (Months 10-12)
- Veterinarian portal
- Feed/supplement tracking
- Health records management
- Training logs
- Show/competition records

### Category 3 "Holy Shit" Features (Month 13+)
- AI breeding recommendations
- Genetic diversity analysis
- Marketplace AI matching
- Foaling live stream integration
- Mobile foaling alarm

---

**END OF DOCUMENT**

Total Lines: ~1,100
This roadmap provides a detailed, actionable plan for building the complete horse breeding MVP over 20 weeks. Each sprint has clear goals, task breakdowns, deliverables, and demo-able features.
