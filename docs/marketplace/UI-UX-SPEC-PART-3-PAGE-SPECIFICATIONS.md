# BreederHQ UI/UX Specification - Part 3: Page-Level Design Specifications

*Continuation of UI-UX-SPEC-PART-2-STRATEGY.md*

---

## Page-Level Design Specifications

### Template: Authority Page Structure (9-Part Format)

All primary, workflow, and comparison pages MUST follow this structure for AI summarization and authority positioning:

1. **What this page is about** - Clear thesis statement
2. **Why users search for this** - Intent acknowledgment
3. **How users usually handle it today** - Current state recognition
4. **Where that approach breaks down** - Pain point validation
5. **What a correct system looks like** - Solution framework
6. **How BreederHQ supports that system** - Product positioning
7. **Who this is for** - Qualification
8. **Who this is NOT for** - Disqualification (builds trust)
9. **Real user questions and answers** - FAQ section

---

## Homepage Design Specification

**Purpose:** Convert first-time visitors (breeders AND service providers) into trial signups

**Primary Actions:**
- Start Free Trial (primary CTA)
- Explore Marketplace (secondary - for service providers)
- View Pricing (tertiary)

**Layout Structure:**

```
┌─────────────────────────────────────────────────┐
│  Navigation                     [Start Free]    │
├─────────────────────────────────────────────────┤
│                                                  │
│  HERO SECTION                                    │
│  H1: Stop Juggling Spreadsheets                 │
│  Subhead: Professional breeding management       │
│  for [species list]. One system for              │
│  cycles, pedigrees, health testing, and clients. │
│                                                  │
│  [Start Free Trial] [Watch 2min Demo]           │
│                                                  │
│  Trust Line: "Used by 1,200+ professional       │
│  breeders across 6 species"                      │
│                                                  │
├─────────────────────────────────────────────────┤
│  PROBLEM RECOGNITION                             │
│  "Does this sound familiar?"                     │
│  - Heat cycle reminder missed ✗                 │
│  - Health test deadline passed ✗                │
│  - Client email buried in inbox ✗               │
│  - Pedigree scattered across files ✗            │
│                                                  │
├─────────────────────────────────────────────────┤
│  SPECIES SELECTOR                                │
│  "Built for your species"                        │
│  [Dog] [Cat] [Horse] [Goat] [Rabbit] [Sheep]   │
│  (Cards with species-specific features)          │
│                                                  │
├─────────────────────────────────────────────────┤
│  CORE WORKFLOWS (4 columns)                     │
│  - Heat Cycle Tracking                           │
│  - Breeding Plans                                │
│  - Pedigree Management                           │
│  - Client Communication                          │
│                                                  │
├─────────────────────────────────────────────────┤
│  MARKETPLACE VALUE PROP                          │
│  "Plus: Get discovered by serious buyers"        │
│  - List animals publicly                         │
│  - Showcase breeding programs                    │
│  - Connect with qualified buyers                 │
│  - Optional: Service providers section           │
│                                                  │
├─────────────────────────────────────────────────┤
│  TRUST SECTION                                   │
│  "Trusted by professional breeders"             │
│  - Testimonials (3 cards with photos)           │
│  - Metrics (1,200 breeders, 15,000 animals...)  │
│  - Verification badge explanation                │
│                                                  │
├─────────────────────────────────────────────────┤
│  FINAL CTA SECTION                               │
│  "Start organizing your breeding operation"      │
│  [Start Free Trial - 14 days, no credit card]   │
│                                                  │
├─────────────────────────────────────────────────┤
│  Footer Navigation                               │
└─────────────────────────────────────────────────┘
```

**Key Components:**
- Hero with dual value prop (management + marketplace)
- Problem recognition (empathy section)
- Species-specific cards (domain expertise)
- Workflow visualization (feature discovery)
- Marketplace preview (service provider value)
- Trust signals (testimonials, metrics, badges)
- Low-friction CTA (free trial, no credit card)

**Content Structure for AI:**
- Clear H1: "Stop Juggling Spreadsheets - Professional Breeding Management Software"
- Explicit conclusion: "BreederHQ replaces spreadsheets, email, and filing cabinets with one system"
- FAQ section at bottom answering: "Who is this for?", "How much does it cost?", "What species do you support?"

**Mobile Adaptations:**
- Stack hero elements vertically
- Species cards become horizontal scrollable row
- Workflow cards stack (1 column)
- Sticky "Start Free Trial" button at bottom
- Collapse long sections with "Learn more" expansion

---

## Species Page (Example: /dogs)

**Purpose:** Own "dog breeding software" intent and convert dog breeders specifically

**Primary Actions:**
- Start Free Trial (primary)
- See Dog-Specific Demo (secondary)
- View Dog Breeding Pricing (tertiary)

**Content Structure (9-Part Authority Format):**

### 1. What This Page Is About

```
H1: Dog Breeding Software for Professional Breeders

This page explains why dog breeding requires specialized software,
how most breeders manage records today, where those systems break down,
and how BreederHQ supports responsible breeding operations.

[TL;DR Box]
BreederHQ is breeding management software designed for dog breeders
managing 3+ breeding animals. It tracks heat cycles, plans breedings,
manages multi-generation pedigrees, and handles client communication.
Best for breeders who've outgrown spreadsheets and need species-specific tools.
```

### 2. Why Dog Breeders Search for Software

```
H2: Why Dog Breeders Need Specialized Software

Dog breeding has unique requirements that generic software misses:

- **Heat cycle windows matter**: 12-hour windows determine breeding success
- **Progesterone testing timing**: Multiple tests needed to pinpoint ovulation
- **Gestation period**: 63 days from LH surge (not just breeding date)
- **Health testing deadlines**: OFA/PennHIP at 24 months, genetic panels before breeding
- **Socialization windows**: 3-12 weeks is critical for puppy development
- **Multi-generation tracking**: COI calculation requires 5+ generation pedigrees

Generic farm software or spreadsheets don't understand these timelines.
```

### 3. How Dog Breeders Handle It Today

```
H2: How Most Dog Breeders Manage Records

**Small operations (1-2 breeding dogs):**
- Spreadsheets for heat cycles and pedigrees
- Paper folders for health tests
- Email for client communication
- Memory for upcoming deadlines

**This works until:** Second female, overlapping heat cycles, or first repeat breeding inquiry

**Medium operations (3-10 breeding dogs):**
- Multiple spreadsheets (heat tracking, pedigrees, waiting lists)
- Folder system for documentation
- Gmail labels for client threads
- Calendar reminders for deadlines

**This works until:** Missed deadline costs $500+ OFA re-test, or client email slips through

**Large operations (10+ breeding dogs):**
- Custom spreadsheet systems with macros
- Database attempts that never finish
- Dedicated email account for inquiries
- Physical filing cabinets for documentation

**This works until:** Breeder realizes they're spending more time managing systems than dogs
```

### 4. Where Spreadsheet Systems Break Down

```
H2: The Spreadsheet Complexity Wall

Around 3-5 breeding dogs, spreadsheet systems hit predictable failure points:

**Problem 1: No Proactive Reminders**
- Spreadsheets don't remind you when Day 5 progesterone test is due
- You remember 3 days late, test window is closed, breeding cycle missed
- Cost: $500-2,000 in lost breeding + 6 months wait for next cycle

**Problem 2: Relationship Tracking**
- COI calculation requires tracing 5+ generation pedigrees manually
- Spreadsheet formulas break when adding new ancestors
- Error risk: Accidental line-breeding or missing inbreeding concerns

**Problem 3: Client Communication Chaos**
- Inquiry emails scattered across inbox
- No tracking of who you quoted, who's waiting, who paid deposit
- Result: Double-bookings, missed follow-ups, unprofessional experience

**Problem 4: Mobile Access**
- Vet asks "When was her last heat?" while you're at appointment
- Spreadsheet is on home computer
- You guess, potentially mess up breeding timing recommendation

**Problem 5: Collaboration**
- Co-breeder or partner needs access
- Email spreadsheet → version conflicts
- Google Sheets → overwrites each other's edits
```

### 5. What a Correct System Looks Like

```
H2: What Dog Breeding Software Should Do

A correct system understands dog breeding biology and workflows:

**Cycle Management:**
- Track heat start dates automatically
- Calculate expected next heat (species-specific cycle length)
- Remind for progesterone testing windows
- Track LH surge and project whelping date (63 days from surge, not breeding)

**Health Testing Calendar:**
- Know breed-specific requirements (OFA hips at 24mo, cardiac annually, etc.)
- Remind 30 days before test windows open
- Store test results with pedigree linkage
- Flag animals missing required tests before breeding

**Pedigree Intelligence:**
- Build multi-generation pedigrees from parent links (not manual entry)
- Calculate COI automatically
- Flag potential relationship issues
- Link health test results to ancestors (hereditary pattern tracking)

**Client Lifecycle:**
- Inquiry → quote → waiting list → deposit → puppy selection → lifetime updates
- Email integration (track threads)
- Waiting list management by breed/program
- Contract and documentation storage per client

**Mobile + Collaboration:**
- Access heat cycle data at vet appointments
- Co-breeder sees live updates
- Works offline (spotty barn wifi)
```

### 6. How BreederHQ Supports Dog Breeders

```
H2: How BreederHQ Works for Dog Breeding

**Heat Cycle Tracking:**
- Log heat start date → system calculates expected ovulation window
- Reminds for progesterone testing (Day 5, 7, 9 typical pattern)
- Tracks LH surge → projects whelping date 63 days out
- Mobile notifications when female likely entering heat

**Breeding Plans:**
- Link male + female → system checks for relationship conflicts
- Calculates projected COI for offspring
- Flags missing health tests before breeding
- Tracks breeding dates, AI timing, shipped semen logistics

**Whelping & Litter Management:**
- Countdown to whelping date (63 days from LH surge)
- Puppy records (birth weight, weekly weights, individual notes)
- Socialization window tracking (3-12 weeks)
- Buyer matching (link puppies to waiting list clients)

**Pedigree System:**
- Auto-build pedigrees from parent relationships (no manual re-entry)
- 5+ generation view with health test results inline
- COI calculation for any potential pairing
- Export to AKC/UKC registration formats

**Client Management:**
- Inquiry tracking with breed/program interest
- Waiting list by program/gender preferences
- Deposit tracking and contract storage
- Lifetime updates (where's this dog now, health issues, titles earned)

**Marketplace Presence:**
- Public breeder profile with verification badge
- List current/upcoming litters
- Showcase breeding program philosophy
- Manage inquiries from serious buyers
```

### 7. Who BreederHQ Is For

```
H2: BreederHQ Is Built For:

✅ **Professional breeders with 3+ breeding dogs**
- You do 2+ litters per year
- You track multi-generation pedigrees
- You follow breed-specific health testing protocols
- You have a waiting list or client communication workflow

✅ **Show breeders planning line-breeding programs**
- You calculate COI for breeding decisions
- You track titles and accomplishments across generations
- You plan breedings 1-2 years in advance
- You need to reference pedigrees frequently

✅ **Co-breeding operations**
- You collaborate with partners on breeding decisions
- You need shared access to heat cycles and plans
- You split litters and track co-ownership

✅ **Breeders who've outgrown spreadsheets**
- You've missed a deadline that cost money
- You've lost a client email in your inbox
- You've manually updated the same pedigree 3+ times
- You want professional tools for your professional operation
```

### 8. Who BreederHQ Is NOT For

```
H2: BreederHQ Probably Isn't For You If:

❌ **You have 1-2 dogs and breed occasionally**
- A spreadsheet is honestly fine
- BreederHQ would be overkill
- Save your money for health testing

❌ **You're a first-time breeder researching**
- Talk to your mentor first
- Join breed clubs and learn their record systems
- Consider BreederHQ after your second litter

❌ **You need farm/livestock management features**
- We're species-specific (dogs, cats, horses, goats, rabbits, sheep)
- We're NOT for cattle, pigs, poultry, etc.
- Look for farm management software instead

❌ **You want AI to "optimize" breeding decisions**
- BreederHQ provides data, YOU make breeding decisions
- We calculate COI, we don't tell you what COI is "acceptable"
- Responsible breeding requires human judgment, not algorithms

**Our honest recommendation:**
If a simpler system works for your operation, use it.
BreederHQ is worth it when complexity requires real tools.
```

### 9. Real Dog Breeder Questions

```
H2: Frequently Asked Questions

**Q: Does BreederHQ work with AKC/UKC registrations?**
A: Yes. You can export pedigrees in formats compatible with AKC/UKC registration.
BreederHQ doesn't file registrations FOR you, but provides formatted data you need.

**Q: Can I import my existing spreadsheet data?**
A: Yes. We provide CSV import for animals, pedigrees, and heat cycle history.
Support team helps with data migration during onboarding.

**Q: Does it calculate COI (Coefficient of Inbreeding)?**
A: Yes. Automatic COI calculation for any potential pairing based on pedigree depth.

**Q: What if I have multiple breeds?**
A: Fully supported. Tag animals by breed, create breed-specific programs,
track breed-specific health testing requirements.

**Q: Can my co-breeder access the account?**
A: Yes. Multi-user access with permission controls. Decide who can edit vs view.

**Q: Does it work on mobile?**
A: Yes. Mobile-responsive web app works on any phone/tablet browser.
Access heat cycle data at vet appointments, log puppy weights from whelping area.

**Q: How much does it cost?**
A: Free 14-day trial (no credit card required). Paid plans start at $29/month.
[See full pricing](/pricing)

**Q: What if I only need it a few months per year?**
A: We don't offer seasonal billing. You'd need to export data and pause subscription.
Most breeders find year-round tracking worth it (heat cycle predictions, client follow-up).
```

---

**Layout Wireframe for Species Page:**

```
┌─────────────────────────────────────────┐
│  Breadcrumb: Home > For Breeders > Dogs │
├─────────────────────────────────────────┤
│  [Hero Image: Real dog breeder photo]   │
│  H1: Dog Breeding Software              │
│  Subhead: Professional management for   │
│  responsible dog breeders               │
│  [Start Free Trial] [Watch Dog Demo]    │
├─────────────────────────────────────────┤
│  TL;DR Summary Box (highlighted)        │
├─────────────────────────────────────────┤
│  Content: 9-Part Structure Above        │
│  (Each H2 section with visual breaks)   │
├─────────────────────────────────────────┤
│  Related Resources (Internal Links):    │
│  - [Heat Tracking Workflow]             │
│  - [Compare to Spreadsheets]            │
│  - [Buyer's Guide to Finding Breeders]  │
├─────────────────────────────────────────┤
│  Final CTA:                             │
│  "Ready to stop juggling spreadsheets?" │
│  [Start Free Trial]                     │
└─────────────────────────────────────────┘
```

**Mobile Adaptations:**
- TL;DR box sticky on scroll (collapsible)
- Longer text sections have "Read more" expansion
- Example workflows shown as tabbed interface (not all expanded)
- FAQ section accordion-style

---

*Continues in Part 4: Pricing, Service Provider, Workflow Pages...*
