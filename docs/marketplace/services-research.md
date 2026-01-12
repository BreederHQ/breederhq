# Breeder & Pet Services Marketplace Research

> Research conducted January 2026 to inform UI/UX design and backend data structures for BreederHQ services marketplace.

---

## Executive Summary

This research examines how breeders advertise services across multiple platforms and how general pet service marketplaces operate. The findings will shape:
- Service category taxonomy
- Listing data structures
- Provider types and tiers
- Pricing models
- UI/UX patterns

**Key Insight**: The market has two distinct service ecosystems that BreederHQ can unify:
1. **Breeder-centric services** (stud services, mentorship, whelping support, guardian programs)
2. **General pet services** (grooming, training, transport, boarding, pet waste removal, etc.)

---

## Part 1: Platform Research

### 1.1 AKC Marketplace

**Source**: [AKC Marketplace](https://marketplace.akc.org), [AKC Breeder Programs](https://www.akc.org/breeder-programs/)

**Key Findings**:
- **No stud service listings currently** - AKC Marketplace does NOT offer listing of male dogs available for stud (considering as future enhancement)
- Focus is on **litter listings only** - only breeders can list their registered litters
- Workaround: Stud owners use marketplace to locate breeders and contact them directly
- **Pricing tiers**:
  - Annual Plan: $119/year (best for 3+ litters/year) - unlimited advertising
  - Monthly Plan: $12/month (1-2 litters/year)
  - Breeder of Merit: 90 days FREE advertising
- **Breeder profile features**: Custom URL, description, location, contact info, photos/videos of kennel and dogs

**Implications for BreederHQ**:
- Gap in market for dedicated stud service listings
- Tiered pricing model works well for breeders
- Verification/certification badges add trust (Breeder of Merit concept)

---

### 1.2 Good Dog

**Source**: [Good Dog](https://www.gooddog.com/), [Good Breeder Center](https://www.gooddog.com/good-breeder-center)

**Key Findings**:
- **Screening-first model** - breeders must pass health testing verification
- **Quality tiers**: Good/Great/Excellent based on health testing compliance
- **Fee structure**: 6.5% on all payments through platform (payment protection guarantee)
- **Mobile app for breeders** with:
  - Messaging with buyers
  - Puppy listing management
  - Photo/video sharing
  - Application management
  - Buyer-to-puppy matching
  - Secure payments
  - "Good Dog Updates" - breeder social feed for puppy updates
- **No dedicated stud service listings** - focus is puppy sales

**Implications for BreederHQ**:
- Social feed feature for breeders is popular
- Built-in payment processing is expected
- Screening/verification adds perceived value
- Mobile-first is important for breeders

---

### 1.3 PuppyFind / Puppies.com

**Source**: [PuppyFind](https://sidehusl.com/puppyfind/), [Puppies.com](https://puppyfinder.com)

**Key Findings**:
- **Bulletin board model** - platform doesn't get involved in transactions
- **Membership pricing**:
  - Free: 3-day listing
  - 30-day: $29.99 (up to 20 puppies)
  - 90-day: $79.99 (up to 20 puppies)
  - Premiere: $199.99/year ($19.99/month)
- **Minimal vetting** - mix of reputable and questionable breeders
- Limited services beyond puppy listings

**Implications for BreederHQ**:
- Low barrier to entry increases volume but decreases trust
- Tiered access by listing count is common model
- Differentiation opportunity through quality verification

---

### 1.4 Horse Breeding Platforms (Stallion Services Model)

**Sources**: [StallionsNow](https://www.stallionsnow.com/), [eHorses](https://www.ehorses.com/), [AQHA QStallions](https://www.aqha.com/-/qstallions-aqhas-premier-quarter-horse-stallion-directory), [AMHA Stallion Directory](https://www.amha.org/stallion-directory)

**Key Findings**:
- **Dedicated stud directories** are common in horse breeding
- **StallionsNow.com**: Free to list and advertise stallions
- **eHorses**: Full marketplace for breeding horses + stud fee claims
- **AQHA QStallions.com** features:
  - 10-generation pedigrees
  - Progeny lists
  - Performance data and earnings
  - Weekly updates on stallion offspring
  - Tools like "Nick My Mare" to evaluate cross performance
- **AMHA Stallion Directory**: Profiles, stud fees, pedigrees, accomplishments, owner info

**Breeding Methods Supported**:
- Live cover breedings
- Artificial insemination (AI)
- Fresh cooled semen shipping
- Frozen semen (including overseas)

**Stud Fee Range Examples**: $750 - $2,500+ depending on pedigree/performance

**Implications for BreederHQ**:
- Rich pedigree/genetics data is valuable differentiator
- Multiple breeding method options should be captured
- Performance/accomplishment data builds trust
- Horse model is more sophisticated for stud services than dog platforms

---

### 1.5 BreedYourDog

**Source**: [BreedYourDog](https://www.breedyourdog.com/us)

**Key Findings**:
- **Largest/fastest-growing dog breeding website** (self-described)
- **Low monthly fee** model - keeps listings accessible over time
- **Sophisticated search** for stud dogs, bitches, and puppies
- Users can request new breed options if not listed
- Quick customer service response
- Global user base

**Implications for BreederHQ**:
- Affordable pricing is key to breeder adoption
- Comprehensive breed database matters
- Search/filter functionality is critical

---

### 1.6 Rover

**Source**: [Rover](https://www.rover.com/), [Rover Business Model](https://whitelabelfox.com/rovers-business-model/), [Rover FAQ](https://www.rover.com/faq/)

**Key Findings**:
- **150,000+ Pet Caregivers** across 5,300+ cities
- **10M+ pet care services** provided
- **Service categories**:
  - Pet Boarding (at sitter's home)
  - House Sitting (at pet owner's home)
  - Dog Walking
  - Drop-In Visits
  - Doggy Day Care
  - Dog Training
- **Dynamic pricing** - providers set own rates, higher during holidays
- **Extensive vetting** - background checks required (two tiers):
  - **Blue badge**: Basic background check
  - **Gold badge**: Enhanced background check
- **Features**: On-demand + scheduled bookings, reviews, payment processing

**User Journey (from FAQ)**:
1. Search by address/zip code
2. Explore sitter profiles (experience, ratings, reviews)
3. **Meet & Greet recommended** - in-person meeting before booking
4. Complete booking and payment through platform
5. Message sitter before, during, or after booking
6. Photo updates during stay

**Trust & Safety Features**:
- Background checks on all providers
- Reservation protection on every booking
- 24/7 support
- Rover Guarantee
- Block and report feature
- Verified reviews from other pet parents
- **Star Sitter status** - recognizes responsive, reliable providers
- **Trial days** - book a short stay as practice run before longer commitment

**Multi-Service Providers**:
- Many sitters offer multiple services (walking + boarding + day care)
- Users can book same provider for different service types
- "Services" tab on provider profiles shows all offerings

**Pet Types**: Dogs and cats primarily (some sitters list experience with birds, bunnies, lizards, fish)

**Implications for BreederHQ**:
- **Meet & Greet concept** is key for high-trust services - consider for stud services, mentorship
- **Two-tier verification badges** add credibility (basic vs enhanced)
- **Star Sitter / featured provider status** rewards reliability
- **Trial bookings** reduce commitment anxiety
- Multi-service providers are common and should be supported
- In-app messaging before/during/after is expected
- Photo updates during service create transparency

---

### 1.7 Wag!

**Source**: [Wag!](https://wagwalking.com/), [Wag App Review](https://www.petcareins.com/blog/boost-your-bookings-a-detailed-wag-app-review-for-pet-pros), [Wag Help Center](https://support.wagwalking.com/)

**Complete Service List**:
| Service | Description | Duration Options |
|---------|-------------|------------------|
| **Dog Walking** | On-demand or scheduled walks with GPS tracking | 20, 30, 60 minutes |
| **Drop-In Visits** | Quick home visits for potty breaks, feeding | 20, 30 minutes |
| **Pet Sitting** | Overnight care in pet owner's home | Per night |
| **Boarding** | Overnight care in caregiver's home | Per night |
| **Training** | One-on-one in-person training sessions | Per session |
| **Vet Chat** | 24/7 chat with licensed pet experts | Subscription |

**Provider Economics**:
- **Commission**: Wag takes **40%** of every booking (vs Rover's 20%)
- **Background check**: $49.95 one-time fee (non-refundable)
- **Payment**: Twice weekly (Wed/Fri), or Instant Pay for $1.99 fee
- **Wag! Pro**: $149 upgrade for priority placement, more bidding freedom

**Example Provider Earnings** (after 40% Wag fee):
| Walk Duration | Customer Pays | Provider Receives |
|---------------|---------------|-------------------|
| 20 minutes | $15 | $9 |
| 30 minutes | $22 | $13 |
| 60 minutes | $33 | $20 |

**Customer Subscription - Wag! Premium**:
- $5.99/month or $59.99/year
- Zero service fees on all bookings
- Free Vet Chat access
- VIP customer support
- Average savings $5+ per service

**Coverage & Trust**:
- All caregivers background checked
- Up to $25,000 coverage per booking (pet + property)
- Available in 4,600+ cities across all 50 US states

**Implications for BreederHQ**:
- Higher commission = higher provider churn risk
- Premium subscription model for frequent users
- 24/7 expert chat is valuable add-on service
- GPS tracking for walks is expected feature

---

### 1.8 Thumbtack

**Source**: [Thumbtack](https://www.thumbtack.com/), [Thumbtack Business Breakdown](https://research.contrary.com/company/thumbtack)

**Pet Service Categories** (from screenshot):
```
Pet Care Providers near [Location]
├── Pet Sitting
├── Dog Walking
├── House Sitting
├── Pet Boarding
├── Dog Daycare
├── Cat Grooming
└── [Show all services ▼]
```

**Provider Card UI Pattern** (from Thumbtack screenshot):
```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐                                                       │
│  │          │  Kathy Penka                              $20/visit   │
│  │  PHOTO   │  Exceptional 5.0 ⭐⭐⭐⭐⭐ (19)           Starting price │
│  │          │  Pet Sitting, Pet Boarding                            │
│  └──────────┘                                                       │
│              ┌─────────────┐                                        │
│              │ ⚡ In high demand │                                   │
│              └─────────────┘                                        │
│              🏆 26 hires on Thumbtack                               │
│              📍 Serves Olathe, KS                                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Angela P. says, "Not only was Kathy very **responsive** and   │ │
│  │ professional but she got me the **project** on time..."       │ │
│  │ [See more]                                                    │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                              [View profile] (blue) │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Card Elements (Thumbtack Pattern)**:

| Element | Example | Purpose |
|---------|---------|---------|
| **Rating label** | "Exceptional 5.0" / "Great 4.8" | Qualitative descriptor + number |
| **Star rating** | ⭐⭐⭐⭐⭐ (19) | Visual + review count |
| **Services list** | "Pet Sitting, Pet Boarding" | Multi-service display |
| **Demand badge** | "⚡ In high demand" | Social proof / urgency |
| **Value badge** | "$ Great value" | Price positioning |
| **Hires count** | "26 hires on Thumbtack" | Platform-specific social proof |
| **Location** | "Serves Olathe, KS" | Service area |
| **Response time** | "Responds in about 2 hours" | Responsiveness indicator |
| **Starting price** | "$20/visit" or "$38/day" | Clear pricing with unit |
| **Review excerpt** | With **bold keywords** highlighted | Authentic voice + keyword emphasis |

**Badge Types Observed**:
- **⚡ In high demand** - Purple/blue badge for popular providers
- **$ Great value** - Green badge for competitive pricing
- "Exceptional" / "Great" - Rating tier labels

**Multi-Service Providers**:
- BarkU: K9 Academy shows: "Pet Sitting, Dog Walking, Pet Boarding, Dog Training"
- One provider can list multiple service types
- Services displayed as comma-separated list

**Pricing Display Variations**:
- "$20/visit - Starting price"
- "$35/visit - Starting price"
- "$38/day - Estimated price"
- "$105 - Starting price"

**Platform Stats**:
- 300K+ active service providers
- 1,100+ service categories
- Free to join for providers

---

### 1.12 Niche & Specialty Animal Services

Beyond mainstream pet services, there's a wide world of specialty animal services that BreederHQ should consider supporting.

#### Working Dog Training

**Herding Dog Training**:
- **Services**: Instinct tests, beginner lessons, advanced competition training, stock dog development
- **Breeds**: Border Collies, Australian Shepherds, Australian Cattle Dogs, German Shepherds
- **Pricing**: $120-200/lesson, monthly training programs $800-950/month + game birds
- **Key insight**: Most offered through individual farms/ranches, no centralized marketplace exists
- **Sources**: [Draxen Farms](http://www.draxenfarms.net/), [Shannon Wolfe Herding](https://www.shannonwolfeherding.com/)

**Hunting/Gun Dog Training**:
- **Services**: Bird dog training, retriever training, pointer training, field trial prep
- **Breeds**: Labs, Golden Retrievers, Pointers, Setters, Spaniels
- **Pricing**: $800-950/month for board & train programs
- **Certifications**: AKC Hunt Tests, NAVHDA, Field Trials, Master Hunter titles
- **Sources**: [Goosebuster Retrievers](https://goosebusters.biz/), [George Hickox](https://www.georgehickox.com/)

**Livestock Guardian Dog (LGD) Training & Placement**:
- **Services**: LGD training, puppy placement, adult dog rehoming, mentoring support
- **Breeds**: Great Pyrenees, Anatolian Shepherds, Maremmas, Kangals, Akbash
- **Key insight**: LGDs MUST be raised on working farms - critical for success
- **Maturity**: Takes 2 years for LGD to become reliable guardian
- **Sources**: [Providence Farm LGD Rescue](https://www.providencefarmnc.com/about-5-1)

#### Service & Therapy Dog Training

**Therapy Dog Programs**:
- **Services**: Therapy dog certification, hospital/school visitation prep, temperament testing
- **Organizations**: Alliance of Therapy Dogs, Pet Partners, Canine Therapy Corps
- **Key difference**: Therapy dogs visit others; service dogs assist their owner
- **Training**: Cannot be done entirely online - requires real-world socialization
- **Sources**: [Alliance of Therapy Dogs](https://www.therapydogs.com/), [Dog Training Elite](https://dogtrainingelite.com/)

**Service Dog Training**:
- **Services**: Task training, public access training, owner-trained programs
- **Legal**: Protected under ADA (Americans with Disabilities Act)
- **Pricing**: Professional programs can cost $15,000-50,000; owner-trained much less
- **Sources**: [The Dog Alliance](https://thedogalliance.org/), [Pawsitive Teams](https://pawsteams.org/)

#### Livestock & Farm Services

**Sheep/Goat/Alpaca Shearing**:
- **Services**: Fiber animal shearing, hoof trimming, fleece skirting
- **Animals**: Sheep, goats, alpacas, llamas, angora rabbits
- **Pricing examples**:
  - Sheep: $18-30/head
  - Alpacas: $35-45/head
  - Llamas: $45-55/head
  - Farm call fee: ~$100
- **Key insight**: Shearers in SHORT SUPPLY - book early (Feb 1 for spring shearing)
- **Directories**: [Light Livestock Equipment Shearer Referral](https://www.lightlivestockequipment.com/shearing-services/)
- **Sources**: [Appalachian Custom Shearing](https://www.appalachianshearing.com/), [Shroeder Shearing](https://www.shroedershearing.com/)

**Farrier Services (Horse Hoof Care)**:
- **Services**: Trimming, shoeing, corrective shoeing, therapeutic shoeing
- **Frequency**: Every 6-8 weeks typically
- **Directories**:
  - [American Farrier's Association](https://americanfarriers.org/search/)
  - [LocalHorse Farrier Directory](https://www.localhorse.com/directory/all/farriers/)
- **Key insight**: Critical for horse soundness - highly specialized skill

**Artificial Insemination (AI) Services**:
- **Species**: Cattle, horses, dogs, sheep, goats, swine
- **Services**: Semen collection, processing, freezing, storage, shipping, insemination
- **Suppliers**: [Agtech Inc](https://store.agtechinc.com/), [Reproduction Provisions](https://reproductionprovisions.com/)
- **Dog AI**: Requires veterinary expertise - not DIY friendly

#### Exotic & Small Animal Services

**Exotic Pet Boarding & Grooming**:
- **Animals**: Birds, reptiles, rabbits, guinea pigs, chinchillas, ferrets, hedgehogs
- **Special requirements**:
  - Reptiles need heated tanks, UVB lighting
  - Rabbits may need RHD vaccine
  - Birds need stimulation/interaction
- **Pricing**: $30-40/night for birds, $35/night for small mammals
- **Sources**: [Jen's Exotic Pet Services](https://jepscolorado.com/), [Bird Girl Pet Services](https://www.birdgirlpetservices.com/)

#### Rehabilitation & Wellness

**Animal Massage & Bodywork**:
- **Services**: Therapeutic massage, trigger point therapy, myofascial release
- **Species**: Dogs, horses, cats
- **Benefits**: Reduces pain, improves mobility, muscle recovery, reduces anxiety
- **Certifications**: CCRP, CVMRT, CCRT
- **Organization**: [IAAMB/ACWT](https://iaamb.org/)

**Hydrotherapy**:
- **Services**: Underwater treadmill, swim therapy, pool exercises
- **Applications**: Post-surgery rehab, arthritis, weight loss, athletic conditioning
- **Key benefit**: Buoyancy reduces joint stress while building muscle

**Equine & Canine Rehabilitation**:
- **Services**: Physical therapy, laser therapy, TENS, ultrasound, acupuncture
- **Training**: University of Tennessee, Canine Rehabilitation Institute, Chi Institute

#### Creative & Media Services

**Animal Photography**:
- **Specialties**:
  - Pet portraits (dogs, cats)
  - Equine photography (horses, riders)
  - Farm/livestock photography (cows, goats, sheep)
  - Exotic animals (birds, reptiles)
- **Session types**: Studio, on-location, action/sport, fine art black background
- **Uses**: Personal portraits, breeder marketing, show/sale photos, memorial
- **Sources**: [Ride the Sky Equine](https://ridetheskyequine.com/), [Greg Murray Photography](https://www.gmurrayphoto.com/)

#### Implications for BreederHQ

**Service Category Expansion**:
The research reveals we need categories far beyond typical "pet services":

```
WORKING DOG SERVICES
├── Herding Training & Instinct Testing
├── Hunting/Gun Dog Training
├── LGD Training & Placement
├── Protection Dog Training
└── Detection/Scent Work Training

SERVICE & THERAPY
├── Therapy Dog Certification
├── Service Dog Training
├── Emotional Support Animal Letters
└── CGC/Trick Dog Testing

LIVESTOCK SERVICES
├── Shearing (sheep, goats, alpacas, llamas)
├── Hoof Trimming
├── Farrier Services
├── AI/Reproduction Services
└── Livestock Handling Training

EXOTIC & SMALL ANIMAL
├── Exotic Boarding
├── Exotic Grooming
├── Avian Services
├── Reptile Services
└── Small Mammal Care

REHABILITATION & WELLNESS
├── Animal Massage Therapy
├── Hydrotherapy
├── Physical Rehabilitation
├── Acupuncture/Alternative Medicine
└── Chiropractic

CREATIVE SERVICES
├── Animal Photography
├── Videography
├── Social Media Content
└── Marketing/Branding
```

**Key Insights**:
1. **No centralized marketplaces** for many niche services - opportunity!
2. **Geographic scarcity** - shearers, farriers, specialized trainers are HARD to find
3. **Certification/credentialing** varies widely by specialty
4. **Species-agnostic** approach needed - dogs, cats, horses, livestock, exotics
5. **Seasonal demand** - shearing, breeding services peak at specific times

**Listing Detail Page UI** (from Thumbtack screenshot):

```
┌─────────────────────────────────────────┬──────────────────────────┐
│                                         │  $20/visit               │
│  Reviews                                │  Starting price          │
│  ────────────────────────────────────   │  [View details]          │
│  Customers rated this pro highly for    │                          │
│  **responsiveness**, **professionalism**│  Select a service        │
│  and **work quality**.                  │  [Pet Sitting      ▼]    │
│                                         │                          │
│  Exceptional 5.0  5★ ████████████ 100%  │  Zip code                │
│  ⭐⭐⭐⭐⭐         4★ ░░░░░░░░░░░░   0%  │  [66061           ]      │
│  19 reviews        3★ ░░░░░░░░░░░░   0%  │                          │
│                    2★ ░░░░░░░░░░░░   0%  │  Length of sitting       │
│                    1★ ░░░░░░░░░░░░   0%  │  [Select answer   ▼]    │
│                                         │                          │
│  Your trust means everything to us.     │  Frequency of sitting    │
│  [Learn about our review guidelines]    │  [Select answer   ▼]    │
│                                         │                          │
│  [🔍 Search reviews    ] [Most relevant▼]│  Requested services      │
│                                         │  [Select answer(s) ▼]   │
│  Read reviews that mention:             │                          │
│  ┌─────┐ ┌──────┐ ┌─────┐ ┌───────┐    │  [Request estimate]      │
│  │dog•11│ │care•7│ │pet•6│ │babies•3│    │  It's free, with no      │
│  └─────┘ └──────┘ └─────┘ └───────┘    │  obligation to book      │
│  ┌─────┐ ┌────────┐ ┌─────────┐        │                          │
│  │fur•3│ │sitting•3│ │updates•2│        │  ⓣ Thumbtack Guarantee   │
│  └─────┘ └────────┘ └─────────┘        │  If you hire this pro,   │
│  ┌──────────┐ ┌─────────┐               │  you're covered by a     │
│  │pictures•2│ │animals•1│               │  money-back guarantee.   │
│  └──────────┘ └─────────┘               │  [Learn more]            │
│                                         │                          │
└─────────────────────────────────────────┴──────────────────────────┘
```

**Review Card Pattern** (detailed):
```
┌─────────────────────────────────────────────────────────────────────┐
│  👤 Staci H.                                        Aug 16, 2021   │
│  ⭐⭐⭐⭐⭐ • ✓ Hired on Thumbtack                                    │
│                                                                     │
│  Kathy was very trustworthy with my home and animals!! I           │
│  appreciated her sending me a list of her schedule as well as      │
│  **updates** and **pictures** regularly during my trip!! She was   │
│  very conscious of my animals needs and meeting those for me!      │
│  Her **care** was a comfort and I plan to use her service again!   │
│                                                                     │
│  Details: Dog • 2 pets • Giving food and water • Taking pet        │
│  outside • Providing companionship • Providing exercise • Short    │
│  visit (30 minutes) • Once a day • My home, venue, etc.            │
│                                                                     │
│  Pet Sitting                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Review UI Elements**:

| Element | Purpose | BreederHQ Equivalent |
|---------|---------|---------------------|
| **Keyword filter chips** | "dog•11", "care•7" - filter reviews by topic | Filter by "health testing", "communication", "puppies" |
| **Rating breakdown bar** | Visual 5-4-3-2-1 star distribution | Show rating distribution |
| **"Hired on Thumbtack"** | Verified purchase indicator | "Verified Client" badge |
| **Service details line** | Structured data about the job | "Stud Service • Golden Retriever • AI Fresh" |
| **Service type label** | "Pet Sitting" at bottom | Service category tag |
| **Bold keywords** | Highlights key terms in review text | Auto-highlight relevant terms |

**Booking Sidebar Elements**:
- Starting price prominently displayed
- Service type dropdown
- Location input (zip code)
- Service-specific questions (length, frequency)
- Multi-select for requested services
- **"Request estimate"** CTA (low commitment)
- "Free, with no obligation to book" reassurance
- **Guarantee badge** - money-back protection

**Implications for BreederHQ**:
- "In high demand" badge creates urgency
- "Great value" badge helps price-conscious buyers
- "Hires on platform" builds marketplace-specific trust
- Response time sets expectations
- Bold keywords in reviews highlight value props
- Multiple pricing units (per visit, per day, flat fee)
- **Keyword filter chips** help users find relevant reviews quickly
- **Service details in reviews** provide context (pet type, service length, etc.)
- **"Request estimate"** is lower friction than "Book now"
- **Guarantee badge** builds trust for new users

---

### 1.9 Pet Transport Services

**Sources**: [CitizenShipper](https://citizenshipper.com/pet-transportation), [Happy Tails Travel](https://www.happytailstravel.com/)

**Key Findings**:
- **CitizenShipper**: Nation's largest pet ground transport marketplace
  - $1,000 Pet Protection Plan on every journey
  - Direct driver communication
  - Customer chooses driver (unique feature)
- **Transport types**:
  - Ground transport (door-to-door, 24/7 private care)
  - Flight nanny services (in-cabin with pet)
  - Air cargo (not recommended for puppies)
- **Pricing**: $0.50-$1.60 per mile typical, puppies cost extra
- **Regulations**: Pets must be 8+ weeks old, various health cert requirements

**Implications for BreederHQ**:
- Transport is a key breeder need
- Multiple transport method options
- Insurance/protection is expected
- Regulatory compliance is complex

---

### 1.10 Local Pet Services (Poop Scooping, Mobile Grooming)

**Sources**: [DoodyCalls](https://www.doodycalls.com/), [Pet Butler](https://www.petbutler.com/), [Poop Genie](https://poopgenie.com/)

**Key Findings**:
- **Pet waste removal services** are a real business category
- **Service models**:
  - One-time cleanups
  - Weekly service
  - Twice-weekly service
  - Commercial/HOA services
  - Waste station installation
  - Yard deodorizing
- **Starting prices**: As low as $25/visit
- **Subscription model** common (Poop Genie)
- Many also offer pet sitting, dog walking as add-ons

**Implications for BreederHQ**:
- Don't underestimate "small" service categories
- Subscription/recurring service model
- Bundled services (waste removal + sitting + walking)

---

### 1.11 Pet Insurance Partner Programs

**Sources**: [Trupanion Breeder Program](https://www.trupanion.com/breeder), [AKC Pet Insurance](https://www.akcpetinsurance.com/), [Petted Affiliates](https://www.petted.com/affiliates/)

Pet insurance partnerships represent a significant opportunity for BreederHQ to add value for breeders and generate affiliate revenue.

**Trupanion Breeder Support Program**:
- **Free to join** - no cost to breeders
- **Go Home Day Offer** - puppies/kittens go home with 30-day free trial
- **Waived waiting periods** - coverage starts immediately upon activation
- **No upfront payment** - buyers only pay if they continue after 30 days
- **Dedicated Relationship Manager** for each breeder
- **Reporting** - see how many buyers activate, types of claims filed
- **Exclusive Facebook group** for breeder community
- Cannot compensate breeders directly due to insurance regulations

**AKC Pet Insurance Programs**:
- **30-day accident/illness coverage** included with AKC registration
- **10% discount** for puppies from Breeder of Merit or Bred with H.E.A.R.T programs
- **5% multi-pet discount** for breeders enrolling multiple puppies
- **Breeding coverage add-on** - covers pregnancy complications, emergency c-sections, eclampsia

**Pet Insurance Affiliate Commission Rates**:

| Provider | Commission | Cookie Duration | Notes |
|----------|------------|-----------------|-------|
| **The Swiftest** | $125 per conversion | 30 days | Highest payout, 1-5% conversion rate |
| **Trupanion** | $1 quote + $35 lead | - | Via Impact platform |
| **PetAssure** | Up to $30 per plan | - | Discount plan, not insurance |
| **Petplan** | $25 per purchase | 30 days | Covers cats, dogs, rabbits, horses |
| **Pin Paws** | $25 per plan | 30 days | 90% reimbursement, no breed restrictions |
| **Embrace** | $5 per lead | - | Lower barrier, good for volume |
| **Pets Best** | Varies | 90 days | Long cookie duration |

**Platform Partnerships** (how competitors do it):
- **Wag!** partners with Petted (white-label comparison engine)
- **Rover** partners with Fetch Pet Insurance
- Both integrate insurance offerings seamlessly into their platforms

**White-Label Options**:
- **Petted** - largest US pet insurance comparison service
- **Pet Insurer** - comparison widget for websites
- Both handle licensing/compliance, provide API integration

**Implications for BreederHQ**:
- Offer Trupanion-style "Go Home Day" program for breeders
- Integrate pet insurance comparison into puppy purchase flow
- Affiliate revenue opportunity ($25-125 per conversion)
- Adds value for buyers (immediate coverage)
- Differentiator vs other breeder platforms
- Could include in breeder subscription tiers

---

## Part 2: Breeder-Specific Services Taxonomy

### 2.1 Stud/Breeding Services

| Service | Description | Typical Pricing |
|---------|-------------|-----------------|
| Live Cover | Natural breeding on-site | $500-$2,500+ |
| AI - Fresh | Artificial insemination with fresh semen | $300-$800 |
| AI - Chilled | Shipped chilled semen | $400-$1,000 |
| AI - Frozen | Frozen semen (can ship internationally) | $500-$1,500 |
| Progeny Guarantee | Replacement breeding if no conception | Varies |
| Genetic Testing | DNA/health testing before breeding | $150-$500 |

### 2.2 Whelping & Breeding Support Services

**Sources**: [Carmel Bliss Whelping Program](https://carmelblissgoldenretrievers.com/whelping-program/), [WhelpWise](https://www.veterinaryperinatalspecialties.com/)

| Service | Description | Typical Pricing |
|---------|-------------|-----------------|
| Full Whelping Program | Boarding + birth assistance + 8 weeks puppy care | $2,800+ |
| Whelping Boarding | Board pregnant female 2 days before due date | $1,500-$2,500 |
| Telehealth Whelping Support | Video chat during whelping (3-day window) | $400+ |
| Home Whelping Visit | Vet comes to home with portable equipment | $500-$1,000 |
| Neonatal Monitoring | Monitoring for pre-term labor, compromised neonates | Varies |
| Tube Feeding Support | Care for puppies that need tube feeding | Hourly rate |

### 2.3 Mentorship & Consultation Services

**Sources**: [Spun Gold Breeder Consulting](https://spungoldgoldenretrievers.com/breeder-consulting), [TLC by the Lake Mentorship](https://www.tlcbythelake.com/breeder-mentorship), [Badass Breeder](https://www.badassbreeder.com/)

| Service | Description | Typical Pricing |
|---------|-------------|-----------------|
| One-on-One Consultation | 30-min phone/video call for breeding advice | $50-$150 |
| Mentorship Program | Multi-week structured program for new breeders | $500-$2,000 |
| Monthly Membership | Ongoing access to classes, community, resources | $25-$100/month |
| In-Home Consultation | Mentor visits breeder's facility | $200-$500 |
| Online Courses | Self-paced breeding education | $100-$500 |
| Puppy Culture Training | Specific protocols for puppy development | $200-$400 |

### 2.4 Guardian Home / Co-Ownership Programs

**Sources**: [Doodles of Oz Guardian FAQ](https://www.doodlesofoz.com/what-is-a-guardian-home), [Sun Valley Guardianship](https://www.sunvalleygoldendoodles.com/guardianshipfaq)

| Service | Description | Notes |
|---------|-------------|-------|
| Guardian Home Placement | Dog lives with family, returns for breeding | Reduced/free purchase price |
| Co-Ownership Agreement | Shared ownership for breeding rights | Legal contract required |
| Guardian Application | Screening process for guardian families | Multi-step vetting |

### 2.5 Additional Breeder Products/Services

| Category | Examples |
|----------|----------|
| **Supplies** | Whelping boxes, puppy pens, scales, collars |
| **Health Products** | Supplements, deworming, vitamins |
| **Educational Materials** | Books, guides, puppy go-home packets |
| **Software/Tools** | Breeding management software, pedigree databases |
| **Photography** | Professional puppy photos, video |
| **Microchipping** | Chip implantation service |
| **DNA Testing Kits** | Pedigree analysis, health screening |

---

## Part 3: General Pet Services Taxonomy

### 3.1 Recommended Service Categories

Based on research, here's a comprehensive taxonomy:

```
PET SERVICES
├── Care & Sitting
│   ├── Pet Sitting (in-home)
│   ├── Boarding (at provider's home)
│   ├── Drop-In Visits
│   ├── Day Care
│   └── Overnight Care
│
├── Exercise & Walking
│   ├── Dog Walking
│   ├── Group Walks
│   └── Running/Jogging with Dog
│
├── Grooming
│   ├── Full Grooming Service
│   ├── Bath & Brush
│   ├── Nail Trimming
│   ├── Mobile Grooming
│   └── Self-Serve Pet Wash
│
├── Training
│   ├── Basic Obedience
│   ├── Puppy Training
│   ├── Behavior Modification
│   ├── Service Dog Training
│   ├── Show/Conformation Training
│   └── Sport/Agility Training
│
├── Transport
│   ├── Ground Transport (local)
│   ├── Long-Distance Transport
│   ├── Flight Nanny
│   ├── Airport Pickup/Delivery
│   └── Vet Appointment Transport
│
├── Health & Veterinary
│   ├── Veterinary Services
│   ├── Vaccination Clinics
│   ├── Dental Services
│   ├── Wellness Exams
│   └── Emergency Care
│
├── Property Services
│   ├── Pet Waste Removal
│   ├── Yard Deodorizing
│   ├── Pet Waste Station Installation
│   └── Kennel/Facility Cleaning
│
├── Photography & Media
│   ├── Pet Photography
│   ├── Puppy/Kitten Photos
│   ├── Video Production
│   └── Social Media Content
│
├── Products & Supplies
│   ├── Food & Nutrition
│   ├── Accessories & Gear
│   ├── Health Supplements
│   └── Whelping/Breeding Supplies
│
└── Specialty Services
    ├── Pet Massage/Therapy
    ├── Hydrotherapy
    ├── Acupuncture
    ├── Hospice Care
    └── Memorial Services
```

---

## Part 4: STUD vs STUD_SERVICE Clarification

### Current BreederHQ Implementation

The codebase currently has:

1. **Animal Listing Intent: `STUD`**
   - Location: `apps/marketplace/src/api/types.ts`
   - Purpose: Individual animal listings where a specific animal is available as a stud
   - Example: "Champion Duke is available for stud"

2. **Service Listing Type: `STUD_SERVICE`**
   - Location: `apps/marketplace/src/api/client.ts`
   - Purpose: Service offering where breeder provides stud services (may not specify which animal)
   - Example: "We offer stud services from our champion males"

### Recommendation: Keep Both, Clearly Differentiate

| Aspect | Animal Listing (STUD) | Service Listing (STUD_SERVICE) |
|--------|----------------------|-------------------------------|
| **Focus** | Specific animal | General service offering |
| **Data** | Animal profile, health tests, pedigree | Service terms, pricing, availability |
| **Use Case** | "I want THIS dog as stud" | "I offer stud services" |
| **Pricing** | Per animal | Per service package |
| **Availability** | Animal's breeding availability | Breeder's service availability |

### UI/UX Implications

- **Animal Page**: Show STUD badge, link to inquiry
- **Services Page**: Show STUD_SERVICE listings with breeder info
- **Cross-linking**: STUD_SERVICE can link to available stud animals
- **Search**: Allow filtering by either/both

---

## Part 5: Proposed Service Category Structure

### Option A: Unified Flat Categories (Simple)

All services in one taxonomy regardless of provider type:

```typescript
type ServiceCategory =
  // Breeder Services
  | "STUD_SERVICE"
  | "WHELPING_SUPPORT"
  | "BREEDING_CONSULTATION"
  | "MENTORSHIP"
  | "GUARDIAN_PROGRAM"

  // Care Services
  | "BOARDING"
  | "PET_SITTING"
  | "DAY_CARE"
  | "DROP_IN"

  // Exercise
  | "DOG_WALKING"

  // Grooming
  | "GROOMING"
  | "MOBILE_GROOMING"

  // Training
  | "TRAINING"
  | "BEHAVIOR_MODIFICATION"
  | "SHOW_TRAINING"

  // Transport
  | "TRANSPORT"
  | "FLIGHT_NANNY"

  // Health
  | "VETERINARY"
  | "VACCINATION"

  // Property
  | "WASTE_REMOVAL"

  // Media
  | "PHOTOGRAPHY"
  | "VIDEO"

  // Products
  | "PRODUCT"

  // Other
  | "OTHER_SERVICE";
```

### Option B: Hierarchical Categories (Recommended)

Two-level taxonomy with parent categories and subcategories:

```typescript
type ServiceParentCategory =
  | "BREEDING"      // Stud, whelping, consultation, mentorship, guardian
  | "CARE"          // Boarding, sitting, day care, drop-in
  | "EXERCISE"      // Walking, running, group walks
  | "GROOMING"      // Full service, bath, nails, mobile
  | "TRAINING"      // Obedience, puppy, behavior, sport
  | "TRANSPORT"     // Local, long-distance, flight nanny
  | "HEALTH"        // Vet, vaccines, dental, emergency
  | "PROPERTY"      // Waste removal, cleaning, deodorizing
  | "MEDIA"         // Photography, video, social content
  | "PRODUCTS"      // Food, supplies, equipment
  | "OTHER";        // Catch-all

// Then subcategories within each parent
interface ServiceCategory {
  parent: ServiceParentCategory;
  slug: string;
  label: string;
  description: string;
  breeder_only?: boolean;  // Some categories only for breeders
}
```

### Option C: Provider-Based Separation (Current Implementation)

Maintain separate types based on who provides the service:

```typescript
// What breeders can offer
type BreederServiceType =
  | "STUD_SERVICE"
  | "WHELPING_SUPPORT"
  | "BREEDING_CONSULTATION"
  | "MENTORSHIP"
  | "GUARDIAN_PROGRAM"
  | "TRAINING"
  | "GROOMING"
  | "TRANSPORT"
  | "BOARDING"
  | "OTHER_SERVICE";

// What independent service providers can offer
type ProviderServiceType =
  | "TRAINING"
  | "VETERINARY"
  | "PHOTOGRAPHY"
  | "GROOMING"
  | "TRANSPORT"
  | "BOARDING"
  | "WASTE_REMOVAL"
  | "PRODUCT"
  | "OTHER_SERVICE";
```

### Recommendation

**Go with Option B (Hierarchical)** with the following benefits:
1. Easier to browse/filter in UI
2. Can add subcategories without schema changes
3. Parent category for grouping in navigation
4. Flexible for both breeders and service providers
5. Supports future expansion

---

## Part 6: Provider Types & Tiers

### Provider Types

```typescript
type ProviderType =
  | "BREEDER"           // Registered breeding program
  | "SERVICE_PROVIDER"  // Independent service business
  | "INDIVIDUAL";       // Joey's backyard services

interface ServiceProvider {
  type: ProviderType;

  // For BREEDER
  programId?: number;
  programSlug?: string;

  // For SERVICE_PROVIDER / INDIVIDUAL
  businessName: string;
  email: string;
  phone?: string;
  website?: string;

  // Location
  city?: string;
  state?: string;
  country: string;

  // Verification
  verified: boolean;
  verifiedAt?: Date;

  // Subscription
  plan: "FREE" | "BASIC" | "PREMIUM" | "BUSINESS";
}
```

### Subscription Tiers (Service Providers)

| Tier | Price | Listings | Features |
|------|-------|----------|----------|
| **FREE** | $0/month | 1 | Basic listing, limited visibility |
| **BASIC** | $9/month | 3 | Enhanced visibility, analytics |
| **PREMIUM** | $29/month | 10 | Featured placement, priority support |
| **BUSINESS** | $79/month | Unlimited | All features, verified badge, API access |

### Breeder Service Listings

Breeders already pay for their breeding program subscription, so service listings could be:
- **Included**: X services included with program subscription
- **Add-on**: Additional fee for service listings
- **Separate**: Pay per service listing

---

## Part 7: Listing Data Model

### Recommended Schema

```typescript
interface ServiceListing {
  id: number;

  // Provider
  providerId: number;
  providerType: "breeder" | "service_provider";

  // Category
  parentCategory: ServiceParentCategory;
  category: string;  // Subcategory slug

  // Content
  title: string;
  description: string;

  // Media
  images: string[];
  videoUrl?: string;

  // Location
  city?: string;
  state?: string;
  country: string;
  serviceArea?: string;  // "Within 25 miles", "Nationwide", etc.

  // Pricing
  priceType: "FIXED" | "STARTING_AT" | "HOURLY" | "CONTACT" | "FREE";
  priceCents?: number;
  priceDescription?: string;  // "Starting at $50/session"

  // Availability
  availability?: {
    days: string[];
    hours?: string;
    leadTime?: string;
  };

  // Contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContact?: "EMAIL" | "PHONE" | "MESSAGE";

  // Status
  status: "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "EXPIRED";

  // SEO
  slug: string;

  // Metadata (flexible for category-specific fields)
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
}
```

### Category-Specific Metadata Examples

**STUD_SERVICE metadata**:
```typescript
{
  breedingMethods: ["LIVE_COVER", "AI_FRESH", "AI_FROZEN"],
  healthTesting: ["OFA_HIPS", "OFA_ELBOWS", "GENETIC_PANEL"],
  progenyGuarantee: true,
  linkedAnimalIds: [123, 456]  // Link to stud animal listings
}
```

**TRAINING metadata**:
```typescript
{
  trainingTypes: ["OBEDIENCE", "PUPPY", "BEHAVIOR"],
  certifications: ["CPDT-KA", "AKC CGC Evaluator"],
  sessionDuration: 60,
  groupClasses: true,
  privateAvailable: true
}
```

**TRANSPORT metadata**:
```typescript
{
  transportTypes: ["GROUND", "FLIGHT_NANNY"],
  maxDistance: 500,
  speciesAccepted: ["DOG", "CAT"],
  crate_required: true,
  insurance: true,
  insuranceAmount: 100000
}
```

---

## Part 8: UI/UX Recommendations

### 8.1 Provider Card Design (Based on Rover)

Rover's provider card design is highly effective. Here's an analysis:

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐                                        from       │
│  │      │  Mo G.                                 $30        │
│  │ PHOTO│  ┌────────────┐                        per night  │
│  │      │  │ Star Sitter│ (yellow badge)                    │
│  └──────┘  └────────────┘                                   │
│  ✓ (green checkmark = verified)                             │
│                                                             │
│  ⭐ 5.0 • 632 reviews                                       │
│  🔄 255 repeat clients                                      │
│  📅 15 years of experience                                  │
│  📍 Olathe, KS, 66062                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Our puppy had so much fun at Mo's! Mo was great    │   │
│  │ in sharing photos and videos and keeping me         │   │
│  │ informed on how things were going. Great and        │   │
│  │ attentive care!"                                    │   │
│  │                                                     │   │
│  │ 👤 Shari W.                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key Card Elements (Rover Pattern)**:

| Element | Purpose | BreederHQ Equivalent |
|---------|---------|---------------------|
| **Profile photo** | Personal connection, trust | Provider/breeder photo |
| **Name** | Identity | Provider name or business name |
| **Star Sitter badge** | Recognition for excellence | "Top Breeder" / "Verified Pro" badge |
| **Green checkmark** | Verification indicator | Background check / verified |
| **Star rating + review count** | Social proof | ⭐ 4.9 • 127 reviews |
| **Repeat clients count** | Loyalty indicator | "85 repeat clients" |
| **Years of experience** | Expertise signal | "12 years breeding experience" |
| **Location** | Proximity | City, State, ZIP |
| **"from $X per night"** | Pricing clarity | "from $500" or "Contact for pricing" |
| **Featured review quote** | Authentic testimonial | Recent review excerpt |
| **Reviewer name** | Review authenticity | Reviewer first name + last initial |

**Visual Hierarchy (Top to Bottom)**:
1. Photo + Name + Badge (identity)
2. Verification checkmark (trust)
3. Rating + Reviews (social proof)
4. Repeat clients (loyalty)
5. Experience (expertise)
6. Location (relevance)
7. Featured review (authentic voice)

### 8.2 Card Variations by Service Type

**For Breeder Services (Stud, Mentorship, Whelping)**:
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐                                        from       │
│  │      │  Sunny Acres Goldens                   $750       │
│  │ LOGO │  ┌────────────┐ ┌──────────────┐      stud fee   │
│  │      │  │ Top Breeder│ │ Health Tested│                  │
│  └──────┘  └────────────┘ └──────────────┘                  │
│                                                             │
│  ⭐ 4.9 • 45 reviews                                        │
│  🏆 OFA Excellent, CAER Clear, Genetic Panel               │
│  🐕 Golden Retriever                                        │
│  📍 Denver, CO                                              │
│                                                             │
│  Services: Stud Service • Mentorship • Whelping Support    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Working with Sarah on my first litter was          │   │
│  │ invaluable. Her mentorship program is worth         │   │
│  │ every penny!"                                       │   │
│  │                                                     │   │
│  │ 👤 Jessica M. (mentee)                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**For General Pet Services (Grooming, Training, Transport)**:
```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────┐                                        from       │
│  │      │  Pawfect Grooming                      $65        │
│  │ PHOTO│  ┌─────────────┐                       per visit  │
│  │      │  │ Verified Pro│                                  │
│  └──────┘  └─────────────┘                                  │
│                                                             │
│  ⭐ 4.8 • 312 reviews                                       │
│  🔄 89 repeat clients                                       │
│  📅 8 years of experience                                   │
│  📍 Austin, TX (Mobile - travels to you)                   │
│                                                             │
│  Services: Full Groom • Bath & Brush • Nail Trim           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ "Best mobile groomer in Austin! My anxious pup      │   │
│  │ actually enjoys grooming now."                      │   │
│  │                                                     │   │
│  │ 👤 Marcus T.                                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Badge System

**Trust Badges (Verification)**:
| Badge | Criteria | Visual |
|-------|----------|--------|
| **Verified** | Basic identity verification | ✓ Green checkmark |
| **Background Checked** | Passed background check | 🛡️ Blue shield |
| **ID Verified** | Government ID confirmed | ✓✓ Double check |

**Recognition Badges (Achievement)**:
| Badge | Criteria | Visual |
|-------|----------|--------|
| **Star Sitter** (Rover) | High ratings + responsive + reliable | ⭐ Yellow badge |
| **Top Breeder** | Excellent reviews, health testing compliance | 🏆 Gold badge |
| **Verified Pro** | Licensed/certified professional | ✅ Blue badge |
| **Super Host** | 50+ bookings, 4.9+ rating | 🌟 Purple badge |

**Specialty Badges (Breeder-Specific)**:
| Badge | Criteria | Visual |
|-------|----------|--------|
| **Health Tested** | All recommended health tests complete | ❤️ Red heart |
| **OFA Certified** | OFA database verified | 🦴 Bone icon |
| **AKC Breeder of Merit** | AKC program participation | 🎖️ Medal |
| **Mentor** | Offers mentorship services | 🎓 Graduation cap |

### 8.4 Key Metrics to Display

**Universal Metrics**:
- ⭐ **Rating** (1-5 stars, one decimal)
- 📝 **Review count** ("127 reviews")
- 🔄 **Repeat clients** ("45 repeat clients")
- 📅 **Experience** ("12 years of experience")
- 📍 **Location** (City, State, ZIP)

**Breeder-Specific Metrics**:
- 🐕 **Breed(s)** ("Golden Retriever, Labrador")
- 🏆 **Health certifications** ("OFA Excellent, CAER Clear")
- 🐾 **Litters produced** ("32 litters raised")
- 👨‍👩‍👧 **Puppies placed** ("180+ puppies placed")

**Service Provider Metrics**:
- 🎓 **Certifications** ("CPDT-KA Certified")
- 📦 **Jobs completed** ("500+ grooming sessions")
- 🚗 **Service area** ("Within 25 miles" or "Mobile")

### 8.5 Browse/Search Experience

**Search Flow**:
```
[Location Input] [Service Type ▼] [Search Button]
     ↓
┌────────────────────────────────────────────────────────────┐
│  Filters: [Price ▼] [Rating ▼] [Distance ▼] [More ▼]      │
│                                                            │
│  Showing 47 results for "Dog Training" near Austin, TX     │
│  Sort by: [Recommended ▼]                                  │
└────────────────────────────────────────────────────────────┘
     ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Card 1    │ │   Card 2    │ │   Card 3    │ │   Card 4    │
│  ⭐ Star    │ │             │ │             │ │             │
│   Sitter    │ │             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
     ↓
         [ View more sitters ] (pagination button)
```

**Filter Options**:

| Filter | Options |
|--------|---------|
| **Service Type** | Boarding, Walking, Training, Grooming, Stud Service, Mentorship, etc. |
| **Price Range** | Free, Under $25, $25-50, $50-100, $100-250, $250+ |
| **Rating** | 4.5+, 4.0+, 3.5+, Any |
| **Distance** | 5 mi, 10 mi, 25 mi, 50 mi, Any |
| **Provider Type** | Breeders, Service Providers, All |
| **Availability** | Available now, This week, This month |
| **Verification** | Verified only, Background checked |
| **Species** | Dogs, Cats, Birds, Rabbits, Horses, etc. |

**Sort Options**:
- Recommended (algorithm: rating + reviews + response time + distance)
- Highest Rated
- Most Reviews
- Lowest Price
- Closest

### 8.6 Listing Detail Page

**Header Section**:
```
┌─────────────────────────────────────────────────────────────────┐
│ [Image Gallery - 5 photos with thumbnails]                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Mo G.  ⭐ Star Sitter  ✓ Background Checked                   │
│                                                                 │
│  ⭐ 5.0 (632 reviews) • 255 repeat clients                     │
│  📍 Olathe, KS, 66062 • 15 years of experience                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  from $30/night                    [Contact Mo] [Book]   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Tabs/Sections**:
1. **About** - Provider description, care style, home environment
2. **Services** - All services offered with pricing
3. **Reviews** - Full review list with filtering
4. **Photos** - Gallery of past clients/work
5. **Availability** - Calendar view
6. **Policies** - Cancellation, requirements, etc.

### 8.7 Review Display Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  ⭐⭐⭐⭐⭐  "Exceptional care!"                              │
│                                                             │
│  Our puppy had so much fun at Mo's! Mo was great in        │
│  sharing photos and videos and keeping me informed on      │
│  how things were going. Great and attentive care!          │
│                                                             │
│  👤 Shari W. • Boarding • October 2025                     │
│  🐕 Max (Golden Retriever, 6 months)                       │
└─────────────────────────────────────────────────────────────┘
```

**Review Elements**:
- Star rating (1-5)
- Review title/headline (optional)
- Review text
- Reviewer name (first + last initial)
- Service type booked
- Date of service
- Pet info (name, breed, age) - optional

### 8.8 Mobile Considerations

**Card Adaptations for Mobile**:
- Stack cards vertically (1 per row)
- Prioritize: Photo, Name, Rating, Price, Location
- Collapse review quote behind "See review" tap
- Swipeable image gallery
- Sticky "Contact" button at bottom

**Touch Targets**:
- Minimum 44x44px for buttons
- Clear tap states
- Easy filter access via bottom sheet

**Compact Card Display (Mobile)**:
```
┌─────────────────────────────────────────────────────────────┐
│  ┌────────┐                                                 │
│  │        │  Pawfect Grooming          from $65/visit      │
│  │  PHOTO │  ⭐ 4.8 (312)  ✓ Verified                       │
│  │        │  📍 Austin, TX                                  │
│  └────────┘  Full Groom • Bath & Brush • Nail Trim         │
│                                                [View →]     │
└─────────────────────────────────────────────────────────────┘
```

**Mobile Navigation**:
- Bottom tab bar: Home, Search, Messages, Profile
- Filter access via floating action button or bottom sheet
- Pull-to-refresh on listings
- Infinite scroll with skeleton loading

**Mobile-Specific Features**:
- GPS-based "Near Me" search
- Click-to-call phone numbers
- Native map integration for directions
- Push notifications for inquiries
- Photo upload from camera roll

### 8.9 Provider Dashboard

**Dashboard Sections for Service Providers**:

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Overview                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Active Listings: 5    Views This Month: 1,247              │
│  Pending Inquiries: 3  Response Rate: 94%                   │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ 📝      │ │ 💬      │ │ 📈      │ │ ⚙️      │           │
│  │Listings │ │Messages │ │Analytics│ │Settings │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  Recent Inquiries                          [View all →]     │
│  ─────────────────────────────────────────────────────────  │
│  👤 Sarah M. - Stud Service inquiry         2 hours ago    │
│  👤 Mike R. - Training question             Yesterday      │
│  👤 Lisa K. - Booking request               2 days ago     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Dashboard Features**:
1. **Listings Management**
   - View all listings (draft, active, paused, expired)
   - Quick edit/duplicate/pause actions
   - Bulk status updates
   - Featured listing upgrades

2. **Inquiry/Message Center**
   - Unified inbox for all inquiries
   - Quick reply templates
   - Read/unread status
   - Inquiry-to-booking conversion tracking

3. **Analytics Dashboard**
   - Views per listing over time
   - Click-through rates
   - Inquiry volume trends
   - Top-performing services
   - Geographic reach (where viewers are located)

4. **Subscription & Billing**
   - Current plan status
   - Upgrade/downgrade options
   - Billing history
   - Payment method management

5. **Profile & Settings**
   - Business information
   - Service areas
   - Availability calendar
   - Notification preferences
   - Verification status

### 8.10 Accessibility Considerations

**WCAG 2.1 AA Compliance**:
- Color contrast ratio 4.5:1 minimum for text
- Focus indicators for keyboard navigation
- Alt text for all images
- ARIA labels for interactive elements
- Screen reader compatible card layouts

**Inclusive Design**:
- Clear, readable fonts (16px minimum body text)
- Icon + text labels (not icons alone)
- Error messages with specific guidance
- Skip-to-content links
- Reduced motion options

---

## Part 9: Competitive Differentiation Opportunities

### Gaps in Current Market

1. **AKC has no stud service listings** - major opportunity
2. **No unified breeder + pet services platform** - we can be both
3. **Limited verification on many platforms** - trust opportunity
4. **Poor mobile experience on legacy platforms** - UX opportunity
5. **No integrated pedigree/health data with services** - breeder-specific value

### Unique Value Propositions

1. **Breeder-to-Breeder Services**: Mentorship, consultation, whelping support
2. **Integrated Pedigree Data**: Show health testing, lineage with stud listings
3. **Guardian Home Marketplace**: First to support this formally
4. **Species-Agnostic**: Dogs, cats, horses, rabbits, goats, etc.
5. **Quality Verification**: Screen providers, display badges
6. **Affordable Entry**: Free tier for small providers

---

## Part 10: Critical Implementation Topics

### 10.1 Payment & Transaction Processing

**Payment Flow Options**:

| Model | Description | Pros | Cons | Best For |
|-------|-------------|------|------|----------|
| **Direct Payment** | Client pays provider directly (offline) | No platform liability, simple | No transaction record, trust issues | High-ticket B2B services (stud fees, mentorship) |
| **Platform-Mediated** | Platform processes payment, takes commission | Transaction record, trust, revenue | PCI compliance, chargeback risk | Standard marketplace services |
| **Escrow/Hold** | Hold funds until service complete | Protection for both parties | Complex, regulatory requirements | High-value or risky transactions |
| **Inquiry-Only** | No payment on platform | Zero liability, simple | No revenue share | Initial launch, niche services |

**Recommended Approach**:
- **Phase 1**: Inquiry-only (no payment processing)
- **Phase 2**: Platform-mediated with Stripe Connect for standard services
- **Phase 3**: Optional escrow for high-value services ($1,000+)

**Payment Features Needed**:
```typescript
interface PaymentConfig {
  // Methods
  acceptedMethods: ("CARD" | "ACH" | "PAYPAL" | "OFFLINE")[];

  // Commission
  platformFee: number; // Percentage (e.g., 15%)
  flatFee: number;     // Cents (e.g., 100 = $1.00)

  // Payout
  payoutSchedule: "INSTANT" | "DAILY" | "WEEKLY" | "MONTHLY";
  minimumPayout: number; // Cents

  // Refunds
  refundPolicy: "FULL" | "PARTIAL" | "NONE" | "CUSTOM";
  refundWindow: number; // Days

  // Tax
  collect1099: boolean;
  threshold1099: number; // $600 in US
}
```

**Commission Structure**:
- Standard services: 15-20% (competitive with Rover 20%, lower than Wag 40%)
- Breeder services: 10-15% (lower due to high transaction values)
- Flat fee: $0.99-1.99 per transaction (cover processing costs)
- Free listings: 0% commission, but limited features

**Tax Considerations**:
- Issue 1099-K to service providers earning $600+ annually
- Collect W-9 forms during onboarding
- Integrate with Stripe Tax or TaxJar for automatic calculation
- Provide year-end tax summaries for providers

---

### 10.2 Booking & Scheduling System

**Booking Models**:

```typescript
type BookingModel =
  | "INSTANT_BOOKING"    // Auto-confirm (like Airbnb/Rover)
  | "REQUEST_TO_BOOK"    // Provider approves (default)
  | "INQUIRY_ONLY"       // No booking, just messaging
  | "HYBRID";            // Provider chooses per listing

interface BookingConfig {
  model: BookingModel;

  // Availability
  calendar: {
    timezone: string;
    workingHours: { day: string; start: string; end: string }[];
    blockedDates: Date[];
    leadTime: number; // Hours advance notice required
    maxAdvance: number; // Days max booking in advance
  };

  // Cancellation
  cancellationPolicy: "FLEXIBLE" | "MODERATE" | "STRICT" | "CUSTOM";
  cancellationWindow: number; // Hours before service

  // No-show
  noShowFee: number; // Percentage charged for no-show

  // Rescheduling
  allowReschedule: boolean;
  rescheduleFee: number; // Cents
  rescheduleWindow: number; // Hours before service
}
```

**Cancellation Policies** (inspired by Airbnb):

| Policy | Full Refund Window | Partial Refund | Provider Compensation |
|--------|-------------------|----------------|----------------------|
| **Flexible** | Up to 24 hours before | 50% if <24 hours | 50% of booking |
| **Moderate** | Up to 5 days before | 50% if 2-5 days, 0% if <2 days | 50-100% of booking |
| **Strict** | Up to 7 days before | 0% if <7 days | 100% of booking |
| **Non-refundable** | No refunds | N/A | 100% upfront |

**Calendar Integration**:
- Two-way sync with Google Calendar, Outlook, iCal
- Automatically block booked times
- Show availability in client's local timezone
- Recurring availability templates (e.g., "Every Tuesday 2-6pm")

**Waitlist Feature**:
```typescript
interface Waitlist {
  listingId: number;
  clientId: number;
  desiredDates: Date[];
  notifyWhen: "ANY_OPENING" | "SPECIFIC_DATES";
  expiresAt: Date;
}
```

---

### 10.3 Insurance & Liability

**Platform Liability Limitations**:
```
BreederHQ acts as a marketplace connecting service providers
with clients. We are not responsible for:
- Quality of services rendered
- Injuries to animals or persons during service
- Loss or theft of property
- Breach of contract between parties
- Misrepresentation by providers
```

**Provider Insurance Requirements**:

| Service Category | Required Coverage | Minimum Amount |
|-----------------|-------------------|----------------|
| **Training** | General liability | $1M per occurrence |
| **Boarding** | General liability + animal bailee | $2M aggregate |
| **Transport** | Commercial auto + cargo | $1M per incident |
| **Veterinary** | Professional liability (malpractice) | $2M aggregate |
| **Grooming** | General liability | $1M per occurrence |
| **Breeding Services** | General liability (optional) | $1M recommended |

**Insurance Verification Process**:
1. Provider uploads Certificate of Insurance (COI)
2. System OCR extracts key info (coverage type, amount, expiry)
3. Manual review by admin
4. Badge displayed: "🛡️ Insured - $2M"
5. Auto-reminder 30 days before expiry
6. Auto-pause listing if expired

**Insurance Partnership Opportunity**:
- Partner with pet business insurance provider (e.g., Business Insurers of the Carolinas, XINSURANCE)
- Offer discounted group rate for BreederHQ providers
- Streamlined verification if purchased through partnership
- Revenue share on policies sold

**Incident Reporting**:
```typescript
interface Incident {
  id: number;
  bookingId: number;
  reportedBy: "CLIENT" | "PROVIDER";
  incidentType: "INJURY" | "ILLNESS" | "PROPERTY_DAMAGE" | "DEATH" | "OTHER";
  severity: "MINOR" | "MODERATE" | "SEVERE" | "CRITICAL";
  description: string;
  photos: string[];
  veterinaryReport?: string;
  resolution: "PENDING" | "RESOLVED" | "ESCALATED" | "LEGAL";
  createdAt: Date;
}
```

---

### 10.4 Trust & Safety

**Background Check Program**:

| Level | Checks Included | Cost | Frequency | Who Pays |
|-------|----------------|------|-----------|----------|
| **Basic** | Identity verification, SSN validation | $10 | Once | Provider or platform |
| **Standard** | Basic + criminal records (7 years) | $25-35 | Annually | Provider |
| **Premium** | Standard + sex offender registry + credit check | $50-75 | Annually | Provider |

**Background Check Partners**:
- Checkr (used by Rover, Uber)
- GoodHire
- Sterling

**Identity Verification**:
- Government ID upload + selfie match
- Address verification (utility bill)
- Phone number verification (SMS code)
- Email verification
- Social media linkage (optional, but increases trust)

**Business License Verification**:
- Required for professional services (vet, grooming salons, boarding facilities)
- Upload business license document
- Verify with state/county database (API if available)
- Display "Licensed Business" badge

**Certification Verification**:
- Trainer certifications (CPDT-KA, KPA-CTP, IACP)
- Contact issuing organization to verify cert number
- Display cert badge with issue date
- Auto-reminder when certification expires

**Fraud Detection Signals**:
- Same photo used across multiple listings
- Stock photos (reverse image search)
- Phone number associated with multiple accounts
- Suspicious pricing (too low or too high)
- Copy-pasted descriptions from other listings
- Rapid listing creation (>5 in 24 hours)
- Unusual payment requests (ask for cash/Venmo)

**Prohibited Services**:
- Illegal breeding (banned breeds in certain jurisdictions)
- Ear cropping/tail docking in states where illegal
- Unlicensed veterinary services
- Fighting animal training
- Sale of live animals (use Animal Listings instead)
- Debarking
- Inhumane training methods (shock collars in jurisdictions where banned)

**Reporting & Moderation**:
```typescript
interface Report {
  reportType: "LISTING" | "USER" | "MESSAGE" | "REVIEW";
  targetId: number;
  reason: "FRAUD" | "HARASSMENT" | "UNSAFE" | "INAPPROPRIATE" | "SPAM" | "OTHER";
  description: string;
  evidence: string[]; // Photo URLs, screenshots
  reporterId: number;
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED";
}
```

**Ban/Suspension Policy**:
- Minor violation (late response, unclear listing): Warning
- Moderate violation (missed appointment, minor misrepresentation): 7-day suspension
- Serious violation (harassment, fake credentials): 30-day suspension
- Severe violation (fraud, animal abuse, safety threat): Permanent ban
- Three strikes in 12 months: Automatic permanent ban

---

### 10.5 Communication & Messaging

**In-Platform Messaging Requirements**:

```typescript
interface Message {
  id: number;
  threadId: number;
  senderId: number;
  recipientId: number;
  content: string;
  attachments: string[]; // Photo URLs
  sentAt: Date;
  readAt?: Date;
  bookingId?: number; // Link to booking if applicable
}

interface Thread {
  id: number;
  listingId: number;
  clientId: number;
  providerId: number;
  subject: string;
  status: "ACTIVE" | "ARCHIVED" | "SPAM" | "BLOCKED";
  lastMessageAt: Date;
  unreadCount: { client: number; provider: number };
}
```

**Privacy Protection**:
- Phone numbers masked until booking confirmed: "Contact after booking"
- Email addresses hidden (use platform messaging)
- No links allowed in messages (prevent off-platform payment requests)
- Automatic detection of phone/email attempts: "Please keep communication on platform"

**Quick Reply Templates**:
```typescript
interface QuickReply {
  id: number;
  providerId: number;
  title: string;
  content: string;
  category: "AVAILABILITY" | "PRICING" | "SERVICES" | "POLICIES" | "OTHER";
}

// Example templates:
const templates = [
  {
    title: "Check Availability",
    content: "Thanks for your inquiry! I'd be happy to help. What dates were you considering?"
  },
  {
    title: "Pricing Info",
    content: "My standard rate is $X per session. I offer a 10% discount for packages of 5+ sessions."
  }
];
```

**Translation** (Future Feature):
- Auto-detect language in message
- Offer "Translate to English" button
- Use Google Translate API or DeepL
- Show original + translated side-by-side
- Charge premium for translation feature or include in higher tiers

**Notification Preferences**:
```typescript
interface NotificationSettings {
  // Channels
  email: boolean;
  sms: boolean;
  push: boolean;

  // Events
  newMessage: { email: boolean; sms: boolean; push: boolean };
  bookingRequest: { email: boolean; sms: boolean; push: boolean };
  bookingConfirmed: { email: boolean; sms: boolean; push: boolean };
  reviewReceived: { email: boolean; sms: boolean; push: boolean };
  paymentReceived: { email: boolean; sms: boolean; push: boolean };

  // Frequency
  digestMode: "REALTIME" | "HOURLY" | "DAILY" | "WEEKLY";
  quietHours: { start: string; end: string }; // "22:00" to "08:00"
}
```

**Response Time Tracking**:
```typescript
interface ResponseMetrics {
  providerId: number;
  avgResponseTime: number; // Minutes
  responseRate: number; // Percentage (0-100)
  responseRateLast30Days: number;

  // Badges
  badges: ("VERY_RESPONSIVE" | "USUALLY_RESPONDS" | "SLOW_RESPONSE")[];
}

// Display on listing:
// ⚡ "Usually responds within 2 hours"
// ⏰ "Typically responds within 24 hours"
// 📭 "Response time varies"
```

**Spam Prevention**:
- Rate limit: 10 messages per hour per user
- Require email verification before first message
- Auto-flag messages with suspicious patterns (URLs, phone numbers)
- Report spam button
- Auto-ban after 3 spam reports

---

### 10.6 Reviews & Reputation Management

**Review Schema**:

```typescript
interface Review {
  id: number;
  bookingId: number;
  listingId: number;
  reviewerId: number;
  providerId: number;

  // Ratings (1-5 stars)
  overallRating: number;
  subcategoryRatings?: {
    communication: number;
    quality: number;
    value: number;
    professionalism: number;
    cleanliness?: number; // For boarding
    punctuality?: number; // For transport
  };

  // Content
  title?: string;
  content: string;
  photos: string[];

  // Metadata
  serviceType: string;
  animalInfo?: {
    species: string;
    breed: string;
    age: number;
  };

  // Response
  providerResponse?: {
    content: string;
    respondedAt: Date;
  };

  // Moderation
  status: "PENDING" | "PUBLISHED" | "FLAGGED" | "REMOVED";
  moderationNotes?: string;

  // Engagement
  helpfulCount: number;
  reportCount: number;

  // Timestamps
  createdAt: Date;
  publishedAt?: Date;
  editedAt?: Date;
}
```

**Review Eligibility**:
- ✅ Client must have completed booking with provider
- ✅ Review window: 14 days after service completion
- ✅ One review per booking (can edit within 48 hours)
- ❌ Cannot review without booking
- ❌ Cannot review own services
- ❌ Cannot delete review (only edit within window or request removal if violates policy)

**Review Moderation Policy**:

**Allowed Reviews**:
- Honest opinions about service quality
- Factual descriptions of experience
- Constructive criticism
- Complaints about specific issues

**Prohibited Reviews** (will be removed):
- Personal attacks, name-calling, profanity
- Threats or harassment
- Discriminatory language (race, religion, disability)
- Extortion ("change policy or I'll leave bad review")
- Spam or promotional content
- Reviews about non-service issues (pricing dispute, personal conflict)
- Reviews from competitors posing as clients
- Fake reviews (verified through booking mismatch)

**Review Response**:
- Providers can respond ONCE to each review
- Response shown directly below review
- No back-and-forth arguing allowed
- Response character limit: 500 characters
- Providers should:
  - Thank reviewer
  - Address specific concerns
  - Explain what was learned/improved
  - Invite offline resolution for serious issues

**Review Incentives**:
- Prompt email 3 days after service: "How was your experience?"
- Optional: $5 credit for leaving review with photo
- Gamification: "You're 2 reviews away from 'Trusted Reviewer' badge"

**Rating Display**:
```
⭐⭐⭐⭐⭐ 4.9 out of 5 (127 reviews)

Rating breakdown:
5 stars: ████████████████████████████░░ 98 (77%)
4 stars: ███████░░░░░░░░░░░░░░░░░░░░░░  21 (17%)
3 stars: ██░░░░░░░░░░░░░░░░░░░░░░░░░░░   5 (4%)
2 stars: █░░░░░░░░░░░░░░░░░░░░░░░░░░░░   2 (2%)
1 star:  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   1 (1%)

Most mentioned: Professional (45), Great communication (38),
                On time (32), High quality (28)
```

**Review Photo Requirements**:
- Encourage before/after photos
- Max 5 photos per review
- Max 5MB per photo
- Auto-compress and optimize
- Display photo grid on listing
- Badge for listings with 10+ photo reviews: "📸 Highly Documented"

---

### 10.7 Search & Discovery Optimization

**Search Ranking Algorithm**:

```typescript
interface SearchRankingFactors {
  // Relevance (40%)
  keywordMatch: number;           // 15%
  categoryMatch: number;          // 10%
  locationProximity: number;      // 10%
  speciesMatch: number;           // 5%

  // Quality (30%)
  overallRating: number;          // 10%
  reviewCount: number;            // 10%
  reviewRecency: number;          // 5%
  photoQuality: number;           // 5%

  // Engagement (20%)
  responseRate: number;           // 10%
  avgResponseTime: number;        // 5%
  bookingConversionRate: number;  // 5%

  // Trust (10%)
  verificationLevel: number;      // 5%
  accountAge: number;             // 3%
  completionRate: number;         // 2%

  // Modifiers
  promotedListing: boolean;       // +50% boost if true
  newProvider: boolean;           // +20% boost first 30 days
  featuredBadge: boolean;         // +30% boost
}
```

**Promoted Listings** (Paid Placement):
- Pay-per-click model: $0.50-2.00 per click
- OR fixed fee: $50-200/month for category
- Appear in top 3 results with "Promoted" badge
- Separate from organic results
- Budget cap and daily spend limit

**Featured Badges** (Paid Enhancement):
- "⭐ Featured Provider" badge
- Cost: $29-99/month depending on tier
- 30% boost in search ranking
- Highlighted card design (border color)
- Appear in "Featured Providers" carousel

**SEO Optimization**:

```html
<!-- Schema.org LocalBusiness markup -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Pawfect Grooming",
  "description": "Professional mobile dog grooming...",
  "image": "https://breederhq.com/images/...",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Austin",
    "addressRegion": "TX",
    "postalCode": "78701"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "312"
  },
  "priceRange": "$$",
  "telephone": "+1-512-555-0123"
}
</script>
```

**Email Marketing**:
- Weekly digest: "New services in Austin, TX"
- Personalized: Based on past searches and bookings
- Segmentation: Dog owners, cat owners, horse owners, etc.
- Re-engagement: "We miss you! Check out these new groomers"
- Seasonal: "Book holiday boarding now"

**Push Notifications** (Mobile App):
- Location-based: "You're 2 miles from a 5-star groomer"
- Time-based: "Tuesday special: 20% off training"
- Behavioral: "You viewed this listing 3 times. Book now?"
- Social proof: "5 people booked this provider this week"

---

### 10.8 Provider Success & Growth Tools

**Onboarding Checklist**:

```typescript
interface OnboardingChecklist {
  providerId: number;
  steps: {
    profilePhoto: { completed: boolean; score: number };      // 15 points
    businessInfo: { completed: boolean; score: number };      // 10 points
    firstListing: { completed: boolean; score: number };      // 20 points
    listingPhotos: { completed: boolean; score: number };     // 15 points (5+ photos)
    detailedDescription: { completed: boolean; score: number }; // 10 points (200+ words)
    pricingSet: { completed: boolean; score: number };        // 10 points
    availabilitySet: { completed: boolean; score: number };   // 10 points
    verifyIdentity: { completed: boolean; score: number };    // 10 points
  };
  totalScore: number; // Out of 100
  completionRate: number; // Percentage
}

// Profile completion impacts search ranking
// <50%: -50% ranking penalty
// 50-75%: -25% ranking penalty
// 75-90%: No penalty
// 90-100%: +10% ranking boost
```

**Profile Optimization Tips** (Dynamic):
- "Add 3 more photos to increase views by 2x"
- "Providers with 200+ word descriptions get 40% more inquiries"
- "Set your response time goal to <2 hours for a boost"
- "Verify your identity to increase trust by 60%"
- "Complete your profile to 100% to unlock featured placement"

**Competitor Insights** (Aggregate, Anonymous):
```typescript
interface CompetitorInsights {
  category: string;
  location: string;

  // Benchmarks
  avgPrice: { min: number; median: number; max: number };
  avgRating: number;
  avgResponseTime: number; // Minutes
  avgReviewCount: number;

  // Your stats
  yourPrice: number;
  yourRating: number;
  yourResponseTime: number;
  yourReviewCount: number;

  // Recommendations
  recommendations: string[];
  // e.g., "Your price is 20% above median. Consider lowering to $X"
  // e.g., "Your response time is excellent - 50% faster than competitors"
}
```

**Seasonal Promotion Tools**:
```typescript
interface Promotion {
  id: number;
  providerId: number;
  listingId?: number; // Null = applies to all listings

  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_ADDON";
  discountValue: number;

  // Targeting
  newClientsOnly: boolean;
  repeatClientsOnly: boolean;
  minBookingValue?: number;

  // Timing
  validFrom: Date;
  validUntil: Date;
  bookingWindow?: { start: Date; end: Date }; // When service must occur

  // Limits
  maxRedemptions?: number;
  maxPerClient?: number;

  // Display
  badgeText: string; // e.g., "20% OFF" or "HOLIDAY SPECIAL"
}
```

**Referral Program**:
- Provider refers another provider → $50 credit when referee earns first $500
- Provider refers client → $10 credit per booking (up to 5)
- Client refers another client → $25 credit for both parties
- Tiered rewards: Refer 10 providers = "Super Connector" badge + $500 bonus

**Educational Content Hub**:
- Blog: "How to price your dog training services"
- Video tutorials: "Creating a compelling listing"
- Webinars: "Growing your pet business with BreederHQ"
- Case studies: "How Sarah grew from 0 to 100 bookings in 6 months"
- Templates: Professional service agreements, intake forms

**Community Forum** (Future):
- Provider-only forum
- Topics: Pricing advice, dealing with difficult clients, business growth
- Moderated by BreederHQ staff
- Reputation system: Helpful contributors get "Community Expert" badge
- Private groups: Dog trainers, groomers, breeders, etc.

---

### 10.9 Legal & Compliance

**Terms of Service** (Key Provisions):

```markdown
## Provider Terms

1. **Eligibility**: 18+ years old, legal right to provide services
2. **Accuracy**: All information must be truthful and accurate
3. **Insurance**: Maintain appropriate insurance for your services
4. **Compliance**: Follow all local, state, federal laws
5. **Safety**: Prioritize animal welfare and client safety
6. **Payment**: Accept commission structure (15-20%)
7. **Reviews**: Cannot manipulate or incentivize positive reviews
8. **Intellectual Property**: Grant BreederHQ license to use photos/content
9. **Termination**: We may suspend/terminate for policy violations
10. **Indemnification**: Hold BreederHQ harmless for your actions

## Client Terms

1. **Booking Contract**: Booking creates contract between you and provider
2. **Platform Role**: BreederHQ is marketplace, not service provider
3. **Payment**: Authorize payment processing via Stripe
4. **Cancellation**: Subject to provider's cancellation policy
5. **Reviews**: Must be truthful, based on actual experience
6. **Disputes**: Resolve with provider; BreederHQ may assist but not liable
```

**Privacy Policy** (GDPR/CCPA Compliance):

Key sections:
- **Data collected**: Name, email, phone, location, payment info, photos, messages
- **Use of data**: Facilitate transactions, improve service, marketing (opt-in)
- **Data sharing**: With providers (booking info), payment processor (Stripe), analytics (Google)
- **Data retention**: Active accounts indefinitely; deleted accounts purged after 90 days
- **User rights**: Access, download, delete your data
- **Cookies**: Essential, functional, analytics, advertising (opt-out)
- **International**: EU users' data stored in EU (GDPR), CA users have CCPA rights

**Cookie Consent**:
```typescript
interface CookieConsent {
  essential: boolean; // Always true, cannot disable
  functional: boolean; // Remember preferences
  analytics: boolean; // Google Analytics, Mixpanel
  advertising: boolean; // Facebook Pixel, Google Ads
}
```

**Age Restrictions**:
- Providers: 18+ years old (verify DOB during registration)
- Clients: 18+ to book services (or parent/guardian consent)
- Exception: Minors can participate with guardian account

**Geographic Restrictions**:
- Some services illegal in certain states (e.g., ear cropping banned in some states)
- Block listing creation for banned services by location
- Display warning: "This service is not available in your state"

**Animal Welfare Compliance**:
- Providers must follow Animal Welfare Act (AWA) if applicable
- No inhumane training methods
- No illegal breeding practices
- Report suspected abuse to authorities
- Partnership with animal welfare organizations

**USDA Licensing**:
- Required for commercial breeders (4+ breeding females)
- Required for interstate pet transport businesses
- Verify license number with APHIS database
- Display "USDA Licensed" badge

**Interstate Transport Regulations** (APHIS):
- Health certificates required for interstate animal transport
- Rabies vaccination required
- Age restrictions (puppies/kittens must be 8+ weeks)
- Acclimation certificates for air transport

---

### 10.10 Data & Analytics (Provider Dashboard)

**Key Performance Indicators**:

```typescript
interface ProviderAnalytics {
  // Traffic
  views: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    percentChange: number;
    viewsPerListing: { listingId: number; views: number }[];
  };

  // Engagement
  inquiries: {
    total: number;
    thisMonth: number;
    conversionRate: number; // Inquiries → bookings
    avgTimeToFirstResponse: number; // Minutes
  };

  // Bookings
  bookings: {
    total: number;
    thisMonth: number;
    completedRate: number; // Completed / total
    cancelledByProvider: number;
    cancelledByClient: number;
    repeatClientRate: number; // Percentage
  };

  // Revenue
  revenue: {
    totalEarned: number; // All time
    thisMonth: number;
    lastMonth: number;
    projectedNextMonth: number; // Based on current rate
    avgBookingValue: number;
    topServices: { listingId: number; revenue: number }[];
  };

  // Reputation
  reputation: {
    overallRating: number;
    totalReviews: number;
    thisMonth: number;
    ratingTrend: { date: Date; rating: number }[];
    sentimentScore: number; // AI-analyzed sentiment (0-100)
  };

  // Geography
  clientLocations: {
    city: string;
    state: string;
    count: number;
    revenue: number;
  }[];

  // Time patterns
  peakInquiryTimes: {
    dayOfWeek: string;
    hour: number;
    count: number;
  }[];
}
```

**Conversion Funnel Tracking**:
```
Views → Profile Click → Inquiry → Booking → Completion → Review

Example:
1,247 views
  ↓ 8.5% CTR
  106 profile clicks
    ↓ 28% inquiry rate
    30 inquiries
      ↓ 43% booking rate
      13 bookings
        ↓ 92% completion rate
        12 completed
          ↓ 67% review rate
          8 reviews
```

**A/B Testing Tools** (Future Feature):
- Test different listing titles
- Test different pricing strategies
- Test different main photos
- Show performance comparison
- Auto-select winner after statistical significance

**Seasonal Trend Analysis**:
```typescript
interface SeasonalTrends {
  service: string;
  trends: {
    month: string;
    bookings: number;
    avgPrice: number;
    occupancyRate: number; // For boarding
  }[];
  insights: string[];
  // e.g., "Boarding bookings increase 45% in December"
  // e.g., "Training demand peaks in January (New Year's resolutions)"
}
```

**Client Demographics** (Aggregate):
- New vs repeat clients
- Avg client lifetime value
- Most common species/breeds
- Geographic distribution
- Booking frequency

**Competitive Positioning**:
```
Your Performance vs. Market Average (Austin Dog Training):

Views per month:      89 | Market: 67  (+33%) ⬆️
Inquiry rate:      12.4% | Market: 8.2% (+51%) ⬆️
Response time:   1.2 hrs | Market: 4.5 hrs (73% faster) ⬆️
Booking rate:     28.5% | Market: 18.1% (+57%) ⬆️
Avg price:          $75 | Market: $68 (+10%) ⬆️
Rating:            4.9★ | Market: 4.3★ (+14%) ⬆️
```

---

### 10.11 Multi-Species Considerations

**Species-Specific Requirements**:

| Species | Special Considerations | Regulatory | Insurance Notes |
|---------|----------------------|------------|-----------------|
| **Dogs** | Breed restrictions (insurance), rabies vaccination | Local ordinances vary | Some breeds excluded from coverage |
| **Cats** | Indoor/outdoor, FIV/FeLV status | Fewer restrictions | Generally lower risk |
| **Horses** | Coggins test, health certificate for transport | USDA for interstate | High value, specialized coverage |
| **Livestock** (cattle, pigs, goats, sheep) | USDA premises ID, movement permits | Interstate commerce regulations | Requires livestock-specific policy |
| **Poultry** | NPIP certification (for breeding birds) | State regulations on backyard flocks | Often excluded from standard policies |
| **Rabbits** | Less regulated, but breeding standards exist | Minimal | Low risk |
| **Exotics** (reptiles, birds) | CITES for endangered species, permits | Varies widely by species and state | Often excluded or very expensive |

**Species-Specific Service Categories**:

```typescript
interface SpeciesServiceMapping {
  species: string;
  applicableCategories: string[];
}

const mappings: SpeciesServiceMapping[] = [
  {
    species: "DOG",
    applicableCategories: [
      "BREEDING_SERVICES", "CARE_SERVICES", "TRAINING",
      "GROOMING", "TRANSPORT", "HEALTH_VETERINARY",
      "WORKING_DOG", "SERVICE_THERAPY", "CREATIVE_MEDIA",
      "PROPERTY_SERVICES", "PRODUCTS"
    ]
  },
  {
    species: "HORSE",
    applicableCategories: [
      "BREEDING_SERVICES", "CARE_SERVICES", "TRAINING",
      "GROOMING", "TRANSPORT", "HEALTH_VETERINARY",
      "LIVESTOCK_SERVICES", "CREATIVE_MEDIA", "PROPERTY_SERVICES", "PRODUCTS"
    ]
  },
  {
    species: "CATTLE",
    applicableCategories: [
      "BREEDING_SERVICES", "HEALTH_VETERINARY",
      "LIVESTOCK_SERVICES", "TRANSPORT", "PRODUCTS"
    ]
  },
  // ... etc
];
```

**Health Certificate Requirements** (Transport):
- **Dogs/Cats**: Rabies vaccine + health cert within 10 days (interstate)
- **Horses**: Coggins test (EIA) + health cert within 30 days
- **Livestock**: Brucellosis test, tuberculosis test (varies by species)
- **Poultry**: NPIP certification or health cert within 30 days

**Species Expertise Badges**:
- "🐕 Canine Specialist" - 50+ dog bookings, 4.8+ rating
- "🐴 Equine Expert" - 20+ horse bookings, specialized equine training
- "🐑 Livestock Pro" - USDA licensed, 10+ livestock service bookings
- "🐱 Feline Specialist" - Cat-specific certification or 50+ cat bookings
- "🦎 Exotic Animal Expert" - Specialized exotic vet or care provider

---

### 10.12 Breeder-Specific Features

**Link Services to Breeding Program**:

```typescript
interface BreederServiceListing extends ServiceListing {
  programId: number;
  programSlug: string;

  // Show on program page
  displayOnProgramPage: boolean;

  // Link to specific animals
  linkedAnimals?: {
    animalId: number;
    animalName: string;
    role: "STUD" | "DAM" | "GUARDIAN";
  }[];

  // Breeder-specific fields
  yearsBreeding?: number;
  totalLittersProduced?: number;
  breedClubMemberships?: string[];
}
```

**Puppy Buyer Perks**:
- Discount codes auto-generated for puppy buyers
- "Buy a puppy from Sunny Acres Goldens, get 20% off training"
- Tracked via purchase history
- Increases puppy value proposition
- Encourages buyers to stay in ecosystem

**Co-Breeder Services**:
- Whelping support for co-breeder arrangements
- Mentorship for newer breeders
- Stud services with co-ownership options
- Joint guardian home programs

**Breed Club Integration**:
- Verify AKC Breed Club membership
- Display club logo/badge
- "AKC Breeder of Merit" badge
- Link to club resources

**Health Testing Display** (Stud Services):

```typescript
interface StudServiceMetadata {
  // Health Testing
  healthTests: {
    testType: string; // "OFA_HIPS", "OFA_ELBOWS", "CAER", "CARDIAC"
    result: string;   // "EXCELLENT", "GOOD", "FAIR", "CLEAR"
    date: Date;
    registryId: string; // OFA number
    documentUrl?: string;
  }[];

  // Pedigree
  pedigreeUrl?: string;
  titlesEarned?: string[]; // "CH", "GCH", "MACH"

  // Breeding
  breedingMethods: ("LIVE_COVER" | "AI_FRESH" | "AI_CHILLED" | "AI_FROZEN")[];
  studFee: number;
  progenyGuarantee: boolean;
  contractUrl?: string;
}
```

**Integration with Animal Listings**:
- STUD_SERVICE (service listing) can link to STUD (animal listing)
- Show animal's photos, pedigree, health testing on service listing
- "See [Max's full profile](animal-listing-url)"
- Allow inquiries from either listing (linked)

---

### 10.13 Internationalization

**Multi-Language Support**:

```typescript
interface LocalizationConfig {
  defaultLocale: "en-US";
  supportedLocales: [
    "en-US", "en-GB", "en-CA", "en-AU",  // English variants
    "es-ES", "es-MX",                     // Spanish
    "fr-FR", "fr-CA",                     // French
    "de-DE",                              // German
    "pt-BR",                              // Portuguese (Brazil)
    "nl-NL"                               // Dutch
  ];

  // User preference
  userLocale: string;
  autoDetect: boolean; // Detect from browser

  // Content translation
  translateListings: boolean; // Machine-translate listings
  professionalTranslation: boolean; // Offer human translation (premium)
}
```

**Currency Support**:
```typescript
interface CurrencyConfig {
  baseCurrency: "USD";
  supportedCurrencies: ["USD", "CAD", "GBP", "EUR", "AUD", "MXN"];

  // Display
  showInUserCurrency: boolean;
  conversionRate: Record<string, number>; // Updated daily

  // Payment
  acceptMultiCurrency: boolean; // Stripe supports 135+ currencies
  settlementCurrency: string; // Currency provider receives
}

// Display: "$75 USD (≈ €69 EUR)"
```

**International Services**:

**Cross-Border Transport**:
- Require international health certificates
- CITES permits for endangered species
- Customs declarations
- Additional fees/insurance

**International Stud Services**:
- Chilled/frozen semen shipping
- International shipping costs ($200-500+)
- Import permits for semen (varies by country)
- Customs clearance assistance

**Time Zone Handling**:
```typescript
// Store all times in UTC
// Display in user's local timezone
// Availability: "9:00 AM - 5:00 PM PST" → convert to user TZ

interface TimeZoneConfig {
  providerTimezone: string; // "America/Los_Angeles"
  userTimezone: string;     // "America/New_York"

  // Display
  showBothTimezones: boolean; // "2:00 PM EST (11:00 AM PST)"
}
```

**Distance Units**:
- US: Miles, pounds, Fahrenheit
- International: Kilometers, kilograms, Celsius
- Auto-convert based on locale
- "Within 25 miles" → "Within 40 km"

**Date/Time Formats**:
- US: MM/DD/YYYY, 12-hour clock
- EU: DD/MM/YYYY, 24-hour clock
- ISO 8601 for API responses

**Phone Number Formats**:
- Support international phone numbers
- Use libphonenumber for validation
- Display with country code: "+1 (512) 555-0123"

---

### 10.14 Mobile App Features

**Offline Mode**:
```typescript
// Cache key data for offline viewing
interface OfflineCache {
  listings: ServiceListing[]; // Last 20 viewed
  messages: Message[]; // Last 100 messages
  bookings: Booking[]; // Upcoming + recent
  profile: ProviderProfile;

  // Sync when online
  pendingActions: {
    type: "MESSAGE" | "BOOKING" | "REVIEW";
    data: any;
    timestamp: Date;
  }[];
}
```

**GPS-Based Features**:
- "Near Me" search with current location
- Push notification when near highly-rated provider
- Distance shown in real-time as user moves
- "Get Directions" opens Maps app

**Camera Integration**:
- Take photos directly in app when creating listing
- Photo upload from camera roll
- Before/after photos for reviews
- Document scanner for certificates/licenses

**Barcode Scanning** (Future):
- Scan business card QR code to view profile
- Scan vaccination records (if QR code present)
- Scan pet microchip (with reader attachment)

**Voice Search**:
- "Hey Siri, find dog trainers near me on BreederHQ"
- Voice-to-text for messages
- Accessibility feature for visually impaired

**Apple/Google Pay**:
- One-tap checkout for bookings
- Stored payment methods
- Faster conversion than entering card details

**Native Share Sheet**:
- Share listing to Messages, WhatsApp, Facebook
- "Check out this awesome groomer!"
- Referral tracking via shared links

**Push Notification Categories**:
```typescript
interface PushNotificationTypes {
  // Transactional
  newMessage: { title: string; body: string; threadId: number };
  bookingRequest: { title: string; body: string; bookingId: number };
  bookingConfirmed: { title: string; body: string; bookingId: number };
  paymentReceived: { title: string; body: string; amount: number };

  // Marketing
  newServiceNearby: { title: string; body: string; listingId: number };
  priceDropAlert: { title: string; body: string; listingId: number };
  providerBackInStock: { title: string; body: string; providerId: number };

  // Engagement
  reviewReminder: { title: string; body: string; bookingId: number };
  incompleteProfile: { title: string; body: string };
  inactiveAccount: { title: string; body: string };
}
```

**Widget Support** (iOS/Android Home Screen):
- "Upcoming Bookings" widget
- "Unread Messages" count widget
- "Quick Search" widget with location

---

### 10.15 Advanced Features (Future)

**AI-Powered Matching**:
- Recommend providers based on user preferences, past bookings, reviews they've left
- "Providers you might like" based on collaborative filtering
- Smart search: "friendly trainer for reactive dog" → understand nuance

**Dynamic Pricing Suggestions**:
- ML model suggests optimal pricing based on:
  - Market rates in area
  - Provider's rating/experience
  - Demand (seasonal, day of week)
  - Competitor pricing
- "Increase your price by $10 - you're underpriced for your rating"

**Automated Review Summaries**:
- AI-generated summary of 100+ reviews
- "Clients love: Communication (mentioned 87 times), Professionalism (72), Quality (68)"
- Sentiment analysis: "98% positive sentiment"

**Predictive Analytics**:
- "Based on current trends, you'll earn $2,400 this month"
- "Your busiest day is likely to be Saturday"
- "You're likely to get 5-7 inquiries this week"

**Smart Scheduling**:
- AI suggests optimal availability times based on inquiry patterns
- "Most clients inquire for Tuesday afternoons - open more slots then"

**Fraud Detection (ML)**:
- Detect fake reviews using NLP
- Identify suspicious provider behavior patterns
- Flag stolen photos using image recognition

**Virtual Consultations**:
- Built-in video calling for remote consultations
- Trainer can offer virtual sessions
- Vet can do tele-health consultations
- Integrate with Zoom or Twilio Video

**Subscription Services**:
- Recurring bookings (e.g., weekly dog walking)
- Auto-charge client's card each week
- Discounted rate for subscriptions
- Easy pause/cancel

**Marketplace Insurance**:
- Optional insurance purchased per booking
- Covers vet bills if pet injured during service
- $25-50 per booking, covers up to $5,000
- Partner with pet insurance company

**Loyalty Programs**:
- Points for each booking: 1 point per $1 spent
- Redeem points for discounts: 100 points = $5 off
- VIP status after 10 bookings: priority support, exclusive deals
- Gamification: badges, levels, leaderboards

---

## Part 11: Implementation Phasing (Revised)

### Phase 1: Foundation (Months 1-2)
**Must-Have for MVP Launch**:
- [ ] Finalize service category taxonomy
- [ ] Database schema: hierarchical categories + metadata field
- [ ] Service listing CRUD API
- [ ] Basic listing creation UI (title, description, price, photos)
- [ ] Public browse/search page (simple filtering)
- [ ] Inquiry-only messaging (no booking/payment)
- [ ] Terms of service + privacy policy
- [ ] Basic provider profiles

**Success Metric**: 20 providers create listings, 100 inquiries sent

---

### Phase 2: Trust & Discovery (Months 3-4)
**Build Trust & Increase Engagement**:
- [ ] Identity verification (ID upload + selfie)
- [ ] Business license upload/verification
- [ ] Reviews and ratings (post-service only)
- [ ] Provider response time tracking
- [ ] Enhanced search (rating filter, distance, price range)
- [ ] Listing detail pages with full info
- [ ] Photo galleries (5+ photos per listing)
- [ ] Email notifications (new message, inquiry received)

**Success Metric**: 50 providers, 500 inquiries, 50 reviews posted

---

### Phase 3: Transactions (Months 5-6)
**Enable Payments & Bookings**:
- [ ] Stripe Connect integration
- [ ] Platform-mediated payments (15-20% commission)
- [ ] Basic booking system (request-to-book model)
- [ ] Cancellation policies (flexible, moderate, strict)
- [ ] Payout system (weekly payouts to providers)
- [ ] Receipt/invoice generation
- [ ] Tax tracking (1099-K threshold monitoring)

**Success Metric**: $10,000 GMV (gross marketplace value), 100 paid bookings

---

### Phase 4: Growth Tools (Months 7-8)
**Help Providers Succeed**:
- [ ] Provider analytics dashboard (views, inquiries, conversion rate)
- [ ] Profile optimization tips
- [ ] Quick reply message templates
- [ ] Subscription tiers (Free, Basic, Premium, Business)
- [ ] Featured listings (paid promotion)
- [ ] Seasonal promotions/discounts
- [ ] Referral program (provider → provider, client → client)

**Success Metric**: $50,000 GMV, 30% of providers on paid tier

---

### Phase 5: Advanced Features (Months 9-12)
**Differentiation & Scaling**:
- [ ] Background check integration (Checkr)
- [ ] Insurance verification system
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Instant booking option
- [ ] In-app video consultations
- [ ] Multi-language support (Spanish, French)
- [ ] Mobile app (iOS + Android)
- [ ] SEO optimization (schema.org markup)
- [ ] Email marketing campaigns

**Success Metric**: $250,000 GMV, 500+ providers, 50,000+ users

---

### Phase 6: Enterprise & Partnerships (Year 2+)
**Scale & Monetization**:
- [ ] White-label solution for breed clubs
- [ ] API for third-party integrations
- [ ] Insurance partnership (discounted policies)
- [ ] Enterprise accounts (vet clinics, grooming chains)
- [ ] Franchise/multi-location support
- [ ] Advanced analytics & ML recommendations
- [ ] Subscription services (recurring bookings)
- [ ] Marketplace insurance (per-booking coverage)

**Success Metric**: $1M+ GMV, 2,000+ providers, profitability

---

## Sources

### Breeder Platforms
- [AKC Marketplace](https://marketplace.akc.org)
- [AKC Breeder Programs](https://www.akc.org/breeder-programs/)
- [Good Dog](https://www.gooddog.com/)
- [Good Breeder Center](https://www.gooddog.com/good-breeder-center)
- [PuppyFind/Puppies.com](https://puppyfinder.com)
- [BreedYourDog](https://www.breedyourdog.com/us)

### Horse Breeding Platforms
- [StallionsNow](https://www.stallionsnow.com/)
- [eHorses](https://www.ehorses.com/)
- [AQHA QStallions](https://www.aqha.com/-/qstallions-aqhas-premier-quarter-horse-stallion-directory)
- [AMHA Stallion Directory](https://www.amha.org/stallion-directory)

### Pet Service Platforms
- [Rover](https://www.rover.com/)
- [Wag!](https://wagwalking.com/)
- [Thumbtack](https://www.thumbtack.com/)
- [CitizenShipper](https://citizenshipper.com/pet-transportation)

### Specialty Services
- [Cat Breeder Sensei](https://catbreedersensei.com/)
- [The Livestock Conservancy](https://livestockconservancy.org/)
- [DoodyCalls](https://www.doodycalls.com/)
- [Pet Butler](https://www.petbutler.com/)

### Breeder Services
- [Carmel Bliss Whelping Program](https://carmelblissgoldenretrievers.com/whelping-program/)
- [Spun Gold Breeder Consulting](https://spungoldgoldenretrievers.com/breeder-consulting)
- [TLC by the Lake Mentorship](https://www.tlcbythelake.com/breeder-mentorship)
- [Badass Breeder](https://www.badassbreeder.com/)
- [Happy Tails Travel](https://www.happytailstravel.com/)

### Guardian Programs
- [Doodles of Oz Guardian FAQ](https://www.doodlesofoz.com/what-is-a-guardian-home)
- [Sun Valley Guardianship](https://www.sunvalleygoldendoodles.com/guardianshipfaq)

### Marketplace Platform Research
- [Sharetribe Service Marketplace](https://www.sharetribe.com/service-marketplace/)
- [Thumbtack Business Breakdown](https://research.contrary.com/company/thumbtack)
- [Rover Business Model](https://whitelabelfox.com/rovers-business-model/)
