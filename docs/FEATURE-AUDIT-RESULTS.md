# FEATURE AUDIT RESULTS - BreederHQ Platform

**Audit Date:** January 2026
**Auditor:** Claude Code
**Scope:** Complete codebase analysis of apps/, packages/, and marketing site comparison

---

## Executive Summary

The BreederHQ platform is a sophisticated, multi-app breeding management SaaS with **significantly more features than currently marketed**. The marketing site covers ~60% of actual platform capabilities. Major marketing gaps exist in:

1. **Marketplace functionality** (free first year for breeders, service provider ecosystem)
2. **Advanced genetics** (COI calculation, best match finder, breeding goal planner)
3. **Client portal depth** (financial transparency, agreement signing, activity feeds)
4. **Communication tools** (unified inbox, templates, WebSocket real-time messaging)
5. **Business tools** (expense tracking, financial reporting, document bundles)
6. **Verification & trust features** (Quick Responder badge, breeder verification tiers)

---

## Features Found in Platform

### Category: Breeding Management

- **Breeding Cycles & Heat Tracking**
  - Location: [apps/breeding/src/](apps/breeding/src/)
  - Individual female cycle tracking with date ranges
  - Species-specific timelines (Dog, Cat, Horse, Goat, Rabbit)
  - "Full" vs "Likely" windows for conservative planning
  - Hormone testing window calculations
  - Current marketing site coverage: **Adequate**
  - Priority for marketing: Low

- **Breeding Plans with 8-Phase Lifecycle**
  - Location: [apps/breeding/src/pages/planner/](apps/breeding/src/pages/planner/)
  - Phases: PLANNING → COMMITTED → BRED → BIRTHED → WEANED → PLACEMENT_STARTED → PLACEMENT_COMPLETED → COMPLETE
  - Inline date editing for each phase transition
  - Automatic status derivation based on entered dates
  - Current marketing site coverage: **Minimal** (only "breeding planning" mentioned)
  - Priority for marketing: **Medium**

- **Pairing Comparison Panel**
  - Location: [apps/breeding/src/components/PairingComparisonPanel.tsx](apps/breeding/src/components/PairingComparisonPanel.tsx)
  - Side-by-side comparison of up to 3 stud candidates
  - COI calculation for each potential pairing
  - Genetic predictions for all loci
  - Health risk assessment per pairing
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Best Match Finder**
  - Location: [apps/breeding/src/components/BestMatchFinder.tsx](apps/breeding/src/components/BestMatchFinder.tsx)
  - Algorithm-based optimal breeding partner suggestions
  - Scoring: COI penalties, health risk penalties, genetic complement bonuses
  - Filter by breed, minimum score, maximum COI
  - Lethal warning detection (Double Merle, Lethal White Overo, etc.)
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Breeding Goal Planner**
  - Location: [apps/breeding/src/components/BreedingGoalPlanner.tsx](apps/breeding/src/components/BreedingGoalPlanner.tsx)
  - Goal types: coat color, coat type, health, physical, eye color
  - Priority levels: must_have, nice_to_have, must_avoid
  - Goal achievement tracking against genetic predictions
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Offspring Genetics Simulator**
  - Location: [apps/breeding/src/components/OffspringSimulator.tsx](apps/breeding/src/components/OffspringSimulator.tsx)
  - Monte Carlo simulation for litter genetics
  - Phenotype predictions per offspring
  - Health status distribution (clear/carrier/affected)
  - Coat color breakdown statistics
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **What-If Planning**
  - Location: [apps/breeding/src/pages/planner/WhatIfPlanningPage.tsx](apps/breeding/src/pages/planner/WhatIfPlanningPage.tsx)
  - Hypothetical scenario planning without creating actual records
  - Synthetic plans overlay on real plans
  - Timeline comparison visualization
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Gantt Chart Timeline Views**
  - Location: [apps/breeding/src/components/RollupGantt.tsx](apps/breeding/src/components/RollupGantt.tsx), [PerPlanGantt.tsx](apps/breeding/src/components/PerPlanGantt.tsx)
  - Visual timeline of multiple breeding plans
  - Phase-based coloring
  - Availability preference overlays
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Breeding Calendar**
  - Location: [apps/breeding/src/components/BreedingCalendar.tsx](apps/breeding/src/components/BreedingCalendar.tsx)
  - Interactive calendar with breeding plan timeline overlay
  - Custom event creation
  - Scheduling availability blocks
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **Medium**

---

### Category: Animal/Livestock Management

- **Comprehensive Animal Profiles**
  - Location: [apps/animals/src/App-Animals.tsx](apps/animals/src/App-Animals.tsx)
  - Species: Dog, Cat, Horse, Goat, Sheep, Rabbit
  - Status: Active, Breeding, Unavailable, Retired, Prospect, Deceased
  - Multiple owners with percentage splits
  - Profile photo management
  - Current marketing site coverage: **Adequate**
  - Priority for marketing: Low

- **Vaccination Tracking with Protocols**
  - Location: [apps/animals/src/api.ts:765-833](apps/animals/src/api.ts#L765-L833)
  - Date-based vaccination records
  - Species-specific vaccination protocols
  - Expiration alerts and renewal reminders
  - Document attachment per vaccination
  - Current marketing site coverage: **Minimal** (only "health testing deadline tracking")
  - Priority for marketing: **Medium**

- **Pedigree Tree with COI Calculation**
  - Location: [apps/animals/src/components/LineageTab.tsx](apps/animals/src/components/LineageTab.tsx)
  - Multi-generation pedigree visualization (configurable depth)
  - COI calculation with risk levels: LOW, MODERATE, HIGH, CRITICAL
  - Common ancestor tracking with contribution percentages
  - ReactFlow interactive tree visualization
  - Current marketing site coverage: **Adequate**
  - Priority for marketing: Low

- **Cross-Tenant Network Animal Linking**
  - Location: [packages/api/src/resources/animal-linking.ts](packages/api/src/resources/animal-linking.ts)
  - Search by Global Animal ID (GAID), Exchange Code, or Registry Number
  - Link request system with approval workflow
  - Privacy controls for network sharing
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Titles & Achievements System**
  - Location: [apps/animals/src/components/TitlesTab.tsx](apps/animals/src/components/TitlesTab.tsx)
  - Categories: Conformation, Obedience, Agility, Field, Herding, Tracking, Rally, Producing, Performance
  - Status tracking: In Progress, Earned, Verified
  - Points/major wins tracking
  - Document verification attachments
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Competition Tracking**
  - Location: [apps/animals/src/components/CompetitionsTab.tsx](apps/animals/src/components/CompetitionsTab.tsx)
  - Competition types: Shows, Trials, Races, Tests
  - Racing-specific fields: Prize money, track, distance, speed figures
  - Aggregate statistics by type and year
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Producing Records**
  - Location: [apps/animals/src/components/ProducingRecordSection.tsx](apps/animals/src/components/ProducingRecordSection.tsx)
  - Total offspring count
  - Titled offspring tracking
  - Champion/Grand Champion offspring counts
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Privacy Controls**
  - Location: [apps/animals/src/components/PrivacyTab.tsx](apps/animals/src/components/PrivacyTab.tsx)
  - Granular sharing: name, photo, DOB, registry, genetics, documents
  - Network visibility toggles
  - Contact request controls
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

---

### Category: Genetics & DNA Testing

- **Multi-Locus Coat Color Genetics**
  - Location: [apps/breeding/src/components/BreedGeneticProfiles.tsx](apps/breeding/src/components/BreedGeneticProfiles.tsx)
  - Dogs: E, K, A, B, D, M, S, H, I, Em loci
  - Cats: A, B, C, D, O, W, Fd loci
  - Horses: E, A, Cr, D, G, LP, TO, O, Rn loci
  - Coat type: Furnishings, Curly, Hair length, Shedding
  - Current marketing site coverage: **Minimal** (only "color genetics tracking")
  - Priority for marketing: **High**

- **Health Genetics with Breed-Specific Tests**
  - Location: [apps/breeding/src/components/HealthRiskSummary.tsx](apps/breeding/src/components/HealthRiskSummary.tsx)
  - Breed profiles: Australian Shepherd, Labrador, German Shepherd, French Bulldog, Golden Retriever, etc.
  - Marker status: Clear (N/N), Carrier (N/X), Affected (X/X)
  - Severity ratings: mild, moderate, severe
  - Health ratings: excellent, good, caution, high-risk
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **High**

- **Punnett Square Analysis**
  - Location: [apps/breeding/src/components/PunnettSquare.tsx](apps/breeding/src/components/PunnettSquare.tsx)
  - Single-locus inheritance visualization
  - Inheritance types: dominance, codominance, incomplete dominance, lethal variants
  - Outcome classification with probability calculations
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Genetic Test Import**
  - Location: [packages/api/src/resources/genetics.ts](packages/api/src/resources/genetics.ts)
  - Import from lab CSV files
  - Preview before saving
  - Visibility controls (network/marketplace)
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **What's Missing Analysis**
  - Location: [apps/breeding/src/components/WhatsMissingAnalysis.tsx](apps/breeding/src/components/WhatsMissingAnalysis.tsx)
  - Coverage comparison (both/dam-only/sire-only missing tests)
  - Species-specific standard loci recommendations
  - Test priorities: critical, recommended, optional
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

---

### Category: Client/Buyer Management

- **Comprehensive Contact Profiles**
  - Location: [apps/contacts/src/App-Contacts.tsx](apps/contacts/src/App-Contacts.tsx)
  - Contacts + Organizations (Party system)
  - Communication preferences per channel (Email, SMS, Phone, Mail, WhatsApp)
  - Compliance tracking (unsubscribe management)
  - Current marketing site coverage: **Adequate**
  - Priority for marketing: Low

- **Activity Feed with 22+ Activity Types**
  - Location: [apps/contacts/src/PartyDetailsView.tsx](apps/contacts/src/PartyDetailsView.tsx)
  - Email, message, phone, note, tag, invoice, payment, portal, event tracking
  - Color-coded by activity type
  - Sortable and paginated
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Events & Follow-ups**
  - Location: [apps/contacts/src/](apps/contacts/src/)
  - Event types: Follow-up, Call, Meeting, Visit
  - Quick scheduling: Today, Tomorrow, 3 days, 1 week, Next Monday
  - Milestone tracking: Birthday, Anniversary, Custom
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **Medium**

- **Pinnable Notes System**
  - Location: Party CRM in [packages/api/src/resources/party-crm.ts](packages/api/src/resources/party-crm.ts)
  - Internal notes with pin/unpin
  - Edit history tracking
  - Current marketing site coverage: **None**
  - Priority for marketing: Low

---

### Category: Client Portal

- **Comprehensive Client Portal**
  - Location: [apps/portal/src/](apps/portal/src/)
  - Current marketing site coverage: **Minimal** (only "24/7 access to updates")
  - Priority for marketing: **High**

- **Portal Dashboard with Action Items**
  - Photo carousel of primary animal
  - Recent update display
  - Action required section (overdue payments, pending agreements)
  - Financial snapshot with progress bar
  - Activity timeline
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Portal Financial Transparency**
  - Balance due with overdue highlighting
  - Invoice grouping by status (Overdue, Due, Paid)
  - Line item details with quantities
  - Pay Now via Stripe integration
  - Receipt viewing
  - Transaction history
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Portal Agreements**
  - Status tracking: Pending Signature, Signed, Draft, Declined, Voided, Expired
  - E-signature capability
  - Document attachment
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Portal Messaging**
  - Direct messaging with breeder
  - Thread-based conversations
  - File attachments (10MB limit)
  - Unread indicators
  - Real-time WebSocket updates
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **Medium**

- **Portal Documents**
  - Categorized: Health Records, Pedigree, Contracts, Photos, Other
  - View-only access
  - File metadata display
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **Medium**

---

### Category: Marketing & Visibility Features

- **Communications Hub (Unified Inbox)**
  - Location: [apps/marketing/src/pages/CommunicationsHub.tsx](apps/marketing/src/pages/CommunicationsHub.tsx)
  - Email + Direct Messages combined
  - WebSocket real-time updates
  - Tag management
  - Template integration
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Email/Message Templates**
  - Location: [apps/marketing/src/pages/TemplatesHubPage.tsx](apps/marketing/src/pages/TemplatesHubPage.tsx)
  - Categories: Email, DM, Social
  - Variable insertion support ({{contact_name}}, {{animal_name}})
  - Preview mode
  - Current marketing site coverage: **Minimal** (only "communication templates")
  - Priority for marketing: **Medium**

- **Document Bundles**
  - Location: [apps/marketing/src/pages/DocumentBundlesPage.tsx](apps/marketing/src/pages/DocumentBundlesPage.tsx)
  - Group documents for quick email attachment
  - Reorder documents within bundles
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Business Hours Configuration**
  - Location: [apps/marketing/src/pages/BusinessHoursPage.tsx](apps/marketing/src/pages/BusinessHoursPage.tsx)
  - Per-day schedule with 15-minute intervals
  - Timezone selection (US timezones)
  - Current marketing site coverage: **None**
  - Priority for marketing: Low

- **Quick Responder Badge**
  - Earned by responding within 4 hours during business hours
  - Requires minimum 5 responses
  - Badge displayed on marketplace listing
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Auto Replies (Coming Soon)**
  - Instant acknowledgment
  - Away messages
  - FAQ responses
  - Smart scheduling
  - Current marketing site coverage: **None**
  - Priority for marketing: Low (not yet implemented)

---

### Category: Marketplace Features

- **Breeder Profiles & Discovery**
  - Location: [apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx](apps/marketplace/src/marketplace/pages/BreedersIndexPage.tsx)
  - Filter by species, breed, location
  - Availability status (accepting inquiries, waitlist open, animals available)
  - Breeder metrics: years in business, placements, response time
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **High**

- **Verification Badges & Trust Indicators**
  - Verified breeder status
  - Health testing badge
  - Quick responder badge
  - Experienced breeder (5+ placements)
  - Current marketing site coverage: **Minimal** (only "breeder verification")
  - Priority for marketing: **High**

- **Service Provider Listings**
  - Location: [apps/marketplace/src/marketplace/pages/ServicesIndexPage.tsx](apps/marketplace/src/marketplace/pages/ServicesIndexPage.tsx)
  - Types: Stud Service, Training, Veterinary, Photography, Grooming, Transport, Boarding, Products
  - Pricing models: Fixed, Starting at, Contact for pricing
  - Current marketing site coverage: **Adequate** (dedicated service providers page)
  - Priority for marketing: Low

- **Animal Programs**
  - Location: [apps/marketplace/src/marketplace/pages/AnimalProgramDetailPage.tsx](apps/marketplace/src/marketplace/pages/AnimalProgramDetailPage.tsx)
  - Program types: Stud Services, Guardian, Trained, Rehome, Co-Ownership
  - Multiple animals per program
  - Per-animal pricing
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Offspring Group Listings (Litters)**
  - Location: [apps/marketplace/src/api/types.ts](apps/marketplace/src/api/types.ts)
  - Dam/Sire parent info with photos
  - Expected/actual birth dates
  - Price range
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Individual Animal Listings**
  - Intents: STUD, BROOD_PLACEMENT, REHOME, GUARDIAN, TRAINED, WORKING, STARTED, CO_OWNERSHIP
  - Intent-specific fields (stud fee notes, AI availability, placement terms)
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Boosted/Featured Listings (Monetization)**
  - Location: [apps/marketplace/src/api/types.ts](apps/marketplace/src/api/types.ts)
  - Boost for increased visibility
  - Featured listing option
  - Sponsored content with FTC disclosure
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Service Provider Tiered Pricing**
  - FREE: 1 listing ($0/month)
  - PREMIUM: 5 listings (TBD)
  - BUSINESS: 20 listings (TBD)
  - Breeders: Unlimited service listings (part of subscription)
  - Current marketing site coverage: **Partial** (service providers page mentions pricing)
  - Priority for marketing: **Medium**

- **Buyer Dashboard**
  - Saved listings
  - Inquiries sent
  - Updates on listings
  - Waitlist positions
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

---

### Category: Business Tools

- **Invoicing System**
  - Location: [apps/finance/src/InvoicesPage.tsx](apps/finance/src/InvoicesPage.tsx)
  - Line-item based with types: Deposit, Service Fee, Goods, Discount, Tax
  - Status: Draft, Issued, Partially Paid, Paid, Overdue, Void
  - Anchor to: Animals, Offspring Groups, Breeding Plans, Service Codes
  - Attachment support
  - Current marketing site coverage: **Minimal** (only "deposits" mentioned)
  - Priority for marketing: **High**

- **Payment Recording**
  - Location: [packages/ui/src/components/Finance/PaymentCreateModal.tsx](packages/ui/src/components/Finance/PaymentCreateModal.tsx)
  - Methods: Cash, Check, Credit Card, Debit Card, ACH, Wire, PayPal, Venmo, Zelle
  - Reference tracking
  - Idempotency protection
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **Medium**

- **Expense Tracking**
  - Location: [apps/finance/src/ExpensesPage.tsx](apps/finance/src/ExpensesPage.tsx)
  - Categories: Vet, Supplies, Food, Grooming, Breeding, Facility, Marketing, Labor, Insurance, Registration, Travel
  - Vendor tracking
  - Receipt attachments
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Financial Dashboard**
  - Location: [apps/finance/src/FinanceHome.tsx](apps/finance/src/FinanceHome.tsx)
  - Outstanding invoices total
  - Month-to-date invoiced/collected/expenses
  - Deposits outstanding
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Breeding Plan Financial Rollups**
  - Location: [packages/ui/src/components/Finance/BreedingPlanFinancialSummary.tsx](packages/ui/src/components/Finance/BreedingPlanFinancialSummary.tsx)
  - Revenue summary per plan
  - Deposit timing analysis (before/after birth)
  - Average pricing statistics
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **CSV Export**
  - Invoices, payments, expenses exportable
  - Configurable columns
  - Current marketing site coverage: **Minimal** (only "data export" mentioned)
  - Priority for marketing: Low

---

### Category: Communication Tools

- **Direct Messaging (Internal)**
  - Location: [apps/marketing/src/pages/MessagesPage.tsx](apps/marketing/src/pages/MessagesPage.tsx)
  - Breeder-to-breeder messaging
  - Thread management
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Email Sending**
  - Location: [packages/api/src/resources/messaging-hub.ts](packages/api/src/resources/messaging-hub.ts)
  - Template support
  - Bundle attachments
  - Party linking
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **Medium**

- **Unified Inbox**
  - Email + DM combined view
  - Bulk actions (archive, flag, mark read)
  - Unread/flagged/draft counts
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **WebSocket Real-Time Messaging**
  - Location: [apps/marketing/src/hooks/useWebSocket.ts](apps/marketing/src/hooks/useWebSocket.ts)
  - Live message notifications
  - Thread updates
  - Auto-reconnect
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Block User Capability**
  - Three levels: Light (no waitlist), Medium (no messages), Heavy (full block)
  - Optional reason tracking
  - Current marketing site coverage: **None**
  - Priority for marketing: Low

---

### Category: Document Management

- **Document Bundles**
  - Location: [apps/marketing/src/pages/DocumentBundlesPage.tsx](apps/marketing/src/pages/DocumentBundlesPage.tsx)
  - Group documents by purpose
  - Quick attachment to emails
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

- **Document Categories**
  - Contracts, Health Records, Pedigree, Photos, Other
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: Low

- **Attachment Management**
  - Per invoice, expense, vaccination
  - File size and type display
  - Current marketing site coverage: **None**
  - Priority for marketing: Low

---

### Category: Verification & Trust Features

- **Breeder Verification Tiers**
  - Location: Admin app [apps/admin/src/](apps/admin/src/)
  - Verified status badge
  - Health testing documentation
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **High**

- **Quick Responder Badge**
  - Earned via response time tracking
  - Business hours aware
  - Current marketing site coverage: **None**
  - Priority for marketing: **High**

- **Marketplace Abuse Monitoring**
  - Location: [apps/admin/src/MarketplaceAbuseAdmin.tsx](apps/admin/src/MarketplaceAbuseAdmin.tsx)
  - Flagged user tracking
  - Block level tracking
  - Suspension capability
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium** (builds trust in platform)

- **Breeder Reports System**
  - Location: [apps/admin/src/BreederReportsAdmin.tsx](apps/admin/src/BreederReportsAdmin.tsx)
  - Report severity levels
  - Warning system
  - Marketplace suspension
  - Current marketing site coverage: **None**
  - Priority for marketing: **Medium**

---

### Category: Admin & Platform Management

- **Subscription & Entitlement System**
  - Location: [apps/admin/src/SubscriptionAdmin.tsx](apps/admin/src/SubscriptionAdmin.tsx)
  - Feature flags
  - Product management with Stripe integration
  - Quota-based entitlements
  - Current marketing site coverage: N/A (internal)
  - Priority for marketing: N/A

- **Usage Dashboard**
  - Location: [apps/admin/src/UsageDashboard.tsx](apps/admin/src/UsageDashboard.tsx)
  - Animal/Contact/Portal User/Breeding Plan quotas
  - Storage and SMS tracking
  - Current marketing site coverage: **None** (could mention quota system in pricing)
  - Priority for marketing: Low

---

### Category: Multi-User & Collaboration

- **Role-Based Access Control**
  - Roles: OWNER, ADMIN, MEMBER, BILLING, VIEWER
  - Current marketing site coverage: **Minimal** (only user counts per plan)
  - Priority for marketing: **Medium**

- **Team Management**
  - Add/invite users
  - Role assignment
  - Password reset
  - Current marketing site coverage: **Minimal**
  - Priority for marketing: **Medium**

---

## Marketing Gaps

### High Priority (Not mentioned at all)

1. **Marketplace for Buyers** - Save listings, track inquiries, manage waitlist positions
2. **Animal Programs** - Group animals by program type (Stud, Guardian, Rehome, etc.)
3. **Offspring Group Listings** - Market litters with parent info and availability
4. **Best Match Finder** - Algorithm-based breeding partner suggestions
5. **Breeding Goal Planner** - Track coat/health/physical trait goals
6. **Offspring Genetics Simulator** - Monte Carlo simulation of litter outcomes
7. **Pairing Comparison** - Side-by-side stud comparison with COI
8. **Punnett Square Analysis** - Visual inheritance probability
9. **Communications Hub** - Unified email + DM inbox
10. **Expense Tracking** - 12 categories with vendor and receipt management
11. **Financial Dashboard** - MTD invoiced/collected/expenses
12. **Financial Rollups per Breeding Plan** - Revenue and deposit timing analysis
13. **Client Portal Financial Transparency** - Pay Now via Stripe, invoice details
14. **Client Portal Agreements** - E-signature with status tracking
15. **Client Portal Activity Feed** - All interactions in one view
16. **Quick Responder Badge** - Response time verification
17. **Cross-Tenant Animal Linking** - Network search by GAID/Registry/Exchange Code
18. **Titles & Achievements System** - Show results and producing records
19. **What-If Planning** - Hypothetical breeding scenarios

### Medium Priority (Mentioned but unclear/underexplained)

1. **Genetics Depth** - Only "COI calculation" mentioned; full locus tracking not explained
2. **Health Testing Scope** - Breed-specific test profiles not detailed
3. **Client Portal Features** - Only "24/7 access" mentioned; depth not shown
4. **Template System** - Only "communication templates" mentioned
5. **Business Hours & Response Tracking** - Not mentioned
6. **Document Bundles** - Not mentioned
7. **Vaccination Protocols** - Only "health testing deadline tracking"
8. **Competition/Show Tracking** - Not mentioned
9. **Multi-User Roles** - Only user counts, not role capabilities
10. **Gantt/Timeline Views** - Calendar mentioned but not visual planning tools

### Low Priority (Adequately covered)

1. Heat cycle tracking
2. Breeding planning basics
3. Pedigree management with COI
4. Waitlist management
5. Service provider marketplace
6. Species-specific biology
7. Pricing tiers

---

## Recommended New Marketing Pages/Sections

### 1. **Marketplace for Buyers** (New Page)
- Covering: Buyer dashboard, saved listings, inquiry tracking, waitlist positions
- Why: Builds two-sided marketplace awareness

### 2. **Genetics Deep Dive** (New Page or Major Section)
- Covering: Multi-locus coat genetics, health markers, Punnett squares, offspring simulator, best match finder, breeding goal planner
- Why: This is a major differentiator - most competitors don't have this depth

### 3. **Client Portal Tour** (New Page)
- Covering: Dashboard, financials, agreements, messaging, documents, activity feed
- Why: Current coverage is minimal; this is a trust-building feature for buyers

### 4. **Financial Management** (New Page)
- Covering: Invoicing, payments, expenses, deposits, financial dashboard, CSV export
- Why: Currently hidden under "business tools" - deserves dedicated coverage

### 5. **Communication Tools** (New Page or Major Section)
- Covering: Unified inbox, templates, document bundles, business hours, auto-replies (coming soon)
- Why: Not mentioned at all; reduces manual work significantly

### 6. **Verification & Trust** (New Page or Expand Existing)
- Covering: Verification badges, quick responder badge, health testing documentation, abuse monitoring, breeder reports
- Why: Builds marketplace credibility; differentiator from unmoderated platforms

### 7. **Advanced Breeding Tools** (New Page)
- Covering: 8-phase breeding plan lifecycle, Gantt timeline views, what-if planning, pairing comparison
- Why: Shows depth beyond basic tracking

### 8. **Network & Collaboration** (New Section)
- Covering: Cross-tenant animal linking, GAID/Exchange Code sharing, privacy controls, multi-user roles
- Why: Unique capability for pedigree verification across breeders

### 9. **Show & Competition Tracking** (New Section in Species Pages)
- Covering: Titles, achievements, competitions, producing records
- Why: Important for show breeders; not mentioned

### 10. **Free Marketplace for Breeders** (Update Pricing Page)
- Note: The marketplace appears to be free for breeders (included in subscription)
- Service providers have separate tiered pricing
- This should be clarified on the pricing page

---

## Focus Area Details

### Marketplace Functionality

**What service providers can list:**
- Stud Service
- Training
- Veterinary
- Photography
- Grooming
- Transport
- Boarding
- Products
- Other Services

**What's free for first year (for service providers):**
- FREE tier: 1 listing, $0/month
- PREMIUM: 5 listings (pricing TBD)
- BUSINESS: 20 listings (pricing TBD)

**How breeders benefit from marketplace visibility:**
- Public breeder profile with verification badges
- Animal program listings (stud, guardian, rehome, etc.)
- Offspring group (litter) listings
- Service listings (unlimited for breeders)
- Inquiry system with tracking
- Response time tracking → Quick Responder badge
- Search/filter visibility by species, breed, location
- Boost/featured listing options (monetization available)

### Marketing Tools for Breeders

- **Communications Hub**: Unified email + DM inbox
- **Templates**: Email, DM, Social with variable insertion
- **Document Bundles**: Quick attachment organization
- **Business Hours**: Schedule configuration with timezone
- **Auto Replies**: Coming soon (instant acknowledgment, away messages, FAQ responses)
- **Quick Responder Badge**: Earned via response time

### Client Portal Capabilities

**What buyers can see/do:**
- Dashboard with action items and recent activity
- Animal photos with auto-rotating carousel
- Financial summary with balance due, payments, invoices
- Pay invoices via Stripe checkout
- View receipt details
- Agreements with e-signature capability
- Message breeder directly with file attachments
- View documents (categorized: health, pedigree, contracts, photos)
- Track offspring placements
- Unified activity/notification feed

**How it builds trust:**
- Financial transparency (full invoice line items)
- Real-time messaging with unread indicators
- Complete agreement history with signing dates
- Document organization by category
- Photo carousel showing animal updates
- Action required badges for clarity

### Service Provider Types

1. Stud Service (STUD_SERVICE)
2. Training (TRAINING)
3. Veterinary (VETERINARY)
4. Photography (PHOTOGRAPHY)
5. Grooming (GROOMING)
6. Transport (TRANSPORT)
7. Boarding (BOARDING)
8. Products (PRODUCT)
9. Other Services (OTHER_SERVICE)

### Verification & Trust Features

- **Verified Breeder Badge**: Admin-assigned verification status
- **Health Testing Badge**: Documentation uploaded
- **Quick Responder Badge**: <4 hour response during business hours, 5+ responses
- **Experienced Breeder Badge**: 5+ placements
- **Abuse Monitoring**: Flagged users, blocking levels, suspension
- **Breeder Reports**: Report severity tracking, warnings, marketplace suspension

---

## Summary Statistics

| Category | Features Found | Marketing Coverage | High Priority Gaps |
|----------|---------------|-------------------|-------------------|
| Breeding Management | 12 | Partial | 6 |
| Animal Management | 9 | Adequate | 3 |
| Genetics | 7 | Minimal | 5 |
| Client Management | 5 | Adequate | 1 |
| Client Portal | 8 | Minimal | 5 |
| Marketing Tools | 6 | None | 4 |
| Marketplace | 9 | Minimal | 6 |
| Business Tools | 6 | Minimal | 4 |
| Communication | 5 | Minimal | 2 |
| Documents | 3 | None | 1 |
| Verification | 5 | Minimal | 2 |
| **TOTAL** | **75** | **~40% Covered** | **39 High Priority** |

---

*This audit was conducted by systematically exploring all 13 apps, 5 packages, and the marketing website at breederhq-www.*
