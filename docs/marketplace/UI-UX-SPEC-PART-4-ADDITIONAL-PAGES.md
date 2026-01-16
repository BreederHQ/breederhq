# BreederHQ UI/UX Specification - Part 4: Additional Page Specifications

*Continuation of UI-UX-SPEC-PART-3-PAGE-SPECIFICATIONS.md*

---

## Pricing Page Design Specification

**URL:** `/pricing`
**Purpose:** Transparent pricing that converts trial users and answers ROI questions

**Primary Actions:**
- Start Free Trial (primary)
- Contact Sales (for 15+ breeding animals)

**Content Structure:**

```
H1: BreederHQ Pricing

Clear, predictable pricing for professional breeders.
No hidden fees. Cancel anytime.

[Pricing Table - 3 Tiers]

┌─────────────┬─────────────┬─────────────┐
│   STARTER   │   BREEDER   │  PROFESSIONAL│
├─────────────┼─────────────┼─────────────┤
│   $29/mo    │   $59/mo    │   $99/mo    │
│ (or $290/yr)│ (or $590/yr)│ (or $990/yr)│
├─────────────┼─────────────┼─────────────┤
│ 1-5 animals │ 6-15 animals│16-50 animals│
│ 1 user      │ 3 users     │ 10 users    │
│ Heat cycles │ Everything  │ Everything  │
│ Breedings   │    in       │    in       │
│ Pedigrees   │  Starter    │  Breeder    │
│ Clients     │    PLUS:    │    PLUS:    │
│             │ Priority    │ Dedicated   │
│ Marketplace │  support    │  support    │
│ listing     │ Multi-user  │ API access  │
│             │ Co-breeding │ Custom      │
│             │             │ integrations│
├─────────────┼─────────────┼─────────────┤
│[Start Free] │[Start Free] │[Start Free] │
└─────────────┴─────────────┴─────────────┘

**All plans include:**
✅ 14-day free trial (no credit card)
✅ Heat cycle tracking with reminders
✅ Breeding planning & COI calculation
✅ Multi-generation pedigrees
✅ Client & waiting list management
✅ Health testing deadline tracking
✅ Marketplace breeder profile
✅ Mobile access
✅ Data export anytime

**Annual billing saves 17%**
```

### FAQ Section (Pricing-Specific)

```
H2: Pricing Questions

**Q: What counts as an "animal"?**
A: Active breeding animals count toward your limit. Offspring under 2 years don't count.
Retired animals don't count. Only breeding-age animals in your program count.

**Q: What if I exceed my animal limit?**
A: We'll notify you and give you 30 days to upgrade. No surprise charges.

**Q: Can I change plans anytime?**
A: Yes. Upgrade immediately. Downgrade at next billing cycle. Prorated refunds for annual.

**Q: What payment methods do you accept?**
A: Credit card (Visa, MC, Amex, Discover) via Stripe. Purchase orders for annual plans.

**Q: Is there a contract?**
A: No. Month-to-month. Cancel anytime. Export your data first.

**Q: Do you offer discounts?**
A: Annual billing saves 17%. Non-profit/rescue discounts available (contact us).
No "early bird" gimmicks.

**Q: What if I only breed seasonally?**
A: No seasonal billing. You'd need to export data and cancel between seasons.
Most find year-round access worth it for heat cycle predictions and client management.

**Q: What happens to my data if I cancel?**
A: Export everything (CSV) before canceling. We keep it 90 days, then delete.
No data hostage situations.

**Q: Can I get a refund?**
A: 14-day free trial = try before you buy. After that, no refunds on monthly.
Annual plans prorated if you cancel early.
```

### ROI Calculator Section

```
H2: Is BreederHQ Worth It? Do The Math.

**Scenario: Small breeder with 3 breeding females, 2 litters/year**

Cost of missed deadline:
- OFA hip X-ray outside window: $500 re-test + 6-month delay
- Missed heat cycle = $1,500 lost litter + 6-month wait
- Lost client inquiry in email = $1,500 lost puppy sale

BreederHQ Starter: $29/month = $348/year
ONE avoided mistake pays for 5 years.

**Scenario: Medium breeder with 8 breeding females, 6 litters/year**

Time saved per week:
- No manual pedigree updates: 2 hours
- No searching for client emails: 3 hours
- No manually checking heat cycle calendar: 1 hour
= 6 hours/week saved

6 hours × $50/hour value × 52 weeks = $15,600/year value
BreederHQ Breeder: $59/month = $708/year
ROI: 22:1

**Your time matters. Your breeding program deserves real tools.**
```

**Mobile Adaptations:**
- Pricing table scrolls horizontally (swipe left/right)
- Plan details collapse (tap to expand features)
- ROI calculator becomes interactive (user inputs their numbers)

---

## Service Provider Landing Page

**URL:** `/service-providers`
**Purpose:** Convert veterinarians, trainers, photographers, transporters into marketplace sellers

**Primary Actions:**
- Create Service Listing (primary CTA)
- View Example Listings (secondary)
- See Provider Pricing (tertiary)

**Content Structure (9-Part Format):**

### 1. What This Page Is About

```
H1: Breeder Marketplace for Service Providers

Reach professional breeders actively searching for veterinary,
training, photography, transport, and other pet services.

BreederHQ connects you with serious breeders (not random pet owners)
who need specialized services and have ongoing service needs.

[TL;DR Box]
BreederHQ Marketplace gives service providers (vets, trainers, photographers,
transporters) targeted visibility to 1,200+ professional breeders.
Qualified leads, transparent pricing, verification badges.
$49/month per listing. No commissions.
```

### 2. Why Service Providers Need Breeder-Specific Marketing

```
H2: The Breeder Market Is Different

Professional breeders are not typical pet owners:

**Higher Service Frequency:**
- Breeders need progesterone testing every heat cycle (4-6x per year per female)
- Puppy litters need wellness exams (8-12 puppies per litter)
- Training services for entire litters, not one-off dogs
- Photography for every litter (professional portfolio images)

**Higher Service Value:**
- Breeder clients = recurring revenue (ongoing breeding program)
- Litter services = volume pricing (10 puppies at once vs 1)
- Long-term relationships (breeders don't switch vets casually)

**Different Search Behavior:**
- Breeders ask other breeders for referrals (tight community)
- They search breeder-specific forums and groups
- They want providers who UNDERSTAND breeding (not just pet care)
- They value credentials (theriogenology, breed-specific experience)

**Current Problem:**
Generic advertising (Google Ads, Facebook) reaches random pet owners.
Breeder-specific networks are fragmented (Facebook groups, breed clubs).
No centralized place where breeders search for services.
```

### 3. How Service Providers Market to Breeders Today

```
H2: Current Marketing Approaches

**Approach 1: Word-of-Mouth / Breeder Referrals**
- Works: High trust, qualified leads
- Breaks down: Slow to scale, geographic limits, no control

**Approach 2: Breed Club Advertising**
- Works: Targeted audience
- Breaks down: Expensive ($500-2000/year per club), limited reach, print-based

**Approach 3: Facebook Groups**
- Works: Direct breeder access
- Breaks down: Self-promotion banned in most groups, spammy reputation

**Approach 4: Google Ads / Facebook Ads**
- Works: Scale and reach
- Breaks down: 95% of clicks are pet owners, not breeders. Poor ROI.

**Approach 5: Own Website + SEO**
- Works: Professional presence
- Breaks down: Breeders don't Google "reproductive vet near me" - they ask breeders

**What's Missing:**
A place where breeders actively SEARCH for service providers,
with verification and credibility signals built-in.
```

### 4. Where Generic Marketplaces Fail

```
H2: Why Craigslist / Facebook Marketplace Don't Work

**Problem 1: Wrong Audience**
- Pet owners, not professional breeders
- One-time transactions, not ongoing relationships

**Problem 2: No Credibility System**
- Anyone can post anything
- No verification of credentials
- Breeders can't trust providers

**Problem 3: No Breeder-Specific Categories**
- "Dog training" doesn't distinguish puppy socialization vs obedience vs show handling
- "Veterinary" doesn't distinguish general practice vs theriogenology
- Breeders need nuance

**Problem 4: Search Is Broken**
- Can't filter by species-specific experience
- Can't filter by breeder-friendly (payment plans, volume pricing, etc.)
- No way to find "repro vet who understands brachycephalic breeds"
```

### 5. What a Breeder Marketplace Should Provide

```
H2: Requirements for Service Provider Success

**Qualified Audience:**
- Professional breeders (not random pet owners)
- Active breeding programs (ongoing service needs)
- Species/breed-specific filtering

**Credibility System:**
- Verification badges (licensed, insured, breed club member)
- Portfolio showcase (photos, case studies, testimonials)
- Breeder reviews (verified clients only)

**Lead Quality:**
- Inquiry forms capture breeder needs (species, breed, service type, timeline)
- Lead routing (automatic inquiry management)
- Response tracking (measure your conversion rate)

**Transparent Pricing:**
- No commissions (flat monthly fee)
- No hidden fees (listing fee = full cost)
- No "featured" upsells (organic ranking by relevance + reviews)

**Control:**
- Edit listings anytime
- Pause listings when at capacity
- Track inquiry volume and conversion
```

### 6. How BreederHQ Marketplace Works

```
H2: How Service Providers Use BreederHQ

**Step 1: Create Service Listing**
- Service type (veterinary, training, photography, transport, etc.)
- Species/breeds you serve
- Service description (what makes you breeder-friendly)
- Pricing (transparent rates, volume discounts)
- Geographic coverage (local, regional, national)
- Portfolio (photos, case studies, testimonials)
- Credentials (certifications, breed club memberships)

**Step 2: Get Verified (Optional but Recommended)**
- Upload license/insurance documentation
- Verification badge added to listing
- Higher trust = more inquiries

**Step 3: Receive Qualified Inquiries**
- Breeders search marketplace by service type + species + location
- They see your listing with verification badge
- They submit inquiry with specific needs
- You receive email notification + dashboard alert

**Step 4: Respond and Convert**
- Reply to inquiry through platform (tracked)
- Schedule consultation or service
- Build ongoing breeder relationship

**Step 5: Build Reputation**
- Breeders leave reviews after service
- Positive reviews = higher listing rank
- Repeat clients = ongoing revenue
```

### 7. Who BreederHQ Marketplace Is For

```
H2: Service Providers We Serve

✅ **Reproductive Veterinarians**
- Progesterone testing, AI services, C-sections
- Breeders need you frequently (multiple cycles per year)
- Geographic reach important (breeders travel for good repro vets)

✅ **Trainers with Breeder Programs**
- Puppy socialization, temperament testing, show handling
- Volume pricing for litters
- Breed-specific expertise (working dogs, sport dogs, show dogs)

✅ **Pet Photographers (Breeder-Focused)**
- Litter photos, pedigree portraits, show photography
- Breeders need professional images for marketing
- Ongoing relationship (every litter needs photos)

✅ **Pet Transport Services**
- Puppy delivery to buyers (ground or flight nanny)
- Breeding transport (take female to stud, bring her back)
- Breeders need reliable, insured transport regularly

✅ **Other Breeder Services**
- Grooming (breed-specific, show prep)
- Boarding (whelping suites, co-breeder boarding)
- Products (whelping supplies, puppy kits, etc.)
```

### 8. Who BreederHQ Marketplace Is NOT For

```
H2: This Marketplace Probably Isn't For You If:

❌ **You're a general practice vet with no breeding focus**
- Breeders need reproductive specialists
- General wellness vets won't see ROI on this marketplace
- Stick to Google My Business for local pet owner traffic

❌ **You're a pet groomer for owners (not show prep)**
- Breeders need breed-specific grooming (show clips, breed standards)
- Owner grooming is a different market
- Better to market on Rover or local ads

❌ **You offer one-time products (not ongoing services)**
- BreederHQ is for service relationships, not e-commerce
- Selling puppy pads? Use Amazon.
- Custom whelping boxes? Etsy or breed club ads.

❌ **You're not willing to learn breeder-specific needs**
- Breeders expect you to understand breeding terminology
- If you treat breeders like random pet owners, reviews will reflect that
- This market rewards specialization
```

### 9. Pricing & ROI

```
H2: Service Provider Pricing

**$49/month per listing**
- Unlimited inquiries
- Verification badge (if eligible)
- Portfolio showcase
- Response tracking dashboard
- No commissions, no hidden fees

**Free 30-day trial** - List your service, see inquiry volume, decide if ROI works.

**ROI Example:**
ONE new breeder client typically worth:
- Repro vet: $500-2000/year (progesterone testing, AI, ultrasounds)
- Trainer: $1000-3000/litter (puppy socialization programs)
- Photographer: $300-800/litter (litter photos, pedigree portraits)
- Transporter: $200-600/delivery (ongoing as breeder sells puppies)

If you get ONE new breeder client from BreederHQ in 6 months,
$49/month investment pays for itself.

**[Create Service Listing - Free 30 Days]**
```

---

## Workflow Page Example: /workflows/heat-tracking

**Purpose:** Own "how to track heat cycles" intent + demonstrate product capability

**Content Structure (Abbreviated 9-Part):**

```
H1: How to Track Heat Cycles for Dog Breeding

**What this page is about:**
This guide explains how professional dog breeders track heat cycles,
why accurate tracking matters for breeding timing, and how specialized
software improves accuracy over spreadsheet methods.

**Why breeders need heat cycle tracking:**
- Female dogs cycle every 6-8 months (breed-dependent)
- Fertile window is 12-24 hours (easy to miss)
- Progesterone testing timing depends on cycle day
- Historical cycle data predicts next heat start

**How breeders track heat cycles today:**
- Calendar with heat start dates (paper or digital)
- Spreadsheet with cycle history and predictions
- Memory (small operations)

**Where manual tracking breaks down:**
- Forgotten to log heat start = lost breeding opportunity
- Miscalculated next heat = missed preparing stud arrangements
- No proactive reminders = reactive scrambling

**What a good heat tracking system does:**
- Logs heat start date
- Calculates expected next heat based on individual cycle length
- Reminds for progesterone testing windows (Day 5, 7, 9 typical)
- Tracks LH surge and projects whelping date (63 days from surge)
- Mobile access (log while traveling, at vet appointments)

**How BreederHQ handles heat cycles:**
[Screenshots + step-by-step walkthrough]
1. Log heat start date (mobile or desktop)
2. System calculates expected ovulation window
3. Reminders sent for progesterone testing
4. Track test results and LH surge
5. System projects whelping date automatically
6. History shows patterns (cycle length trends over time)

**Who benefits most:**
- Breeders with 3+ females (overlapping cycles)
- Breeders using AI/shipped semen (timing is critical)
- Breeders coordinating with stud owners (planning ahead matters)

**Alternative approaches:**
- 1-2 females: Spreadsheet honestly fine
- Casual breeders: Paper calendar sufficient

**Related Resources:**
- [Breeding Planning Workflow](/workflows/breeding-plans)
- [Dog Breeding Software Overview](/dogs)
- [Compare Software vs Spreadsheets](/compare/software-vs-spreadsheets)
```

**Mobile Adaptations:**
- Step-by-step sections collapsible
- Screenshots open in lightbox (tap to enlarge)
- "Quick summary" box sticky at top

---

*Continues in Part 5: Visual Design, Components, Anti-Patterns...*
