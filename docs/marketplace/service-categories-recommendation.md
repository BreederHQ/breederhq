# BreederHQ Service Categories Recommendation

> Expanded service taxonomy based on marketplace research conducted January 2026.
> See [services-research.md](./services-research.md) for full research details.

---

## Executive Summary

BreederHQ has an opportunity to become the **"Thumbtack for the animal world"** - not just pets, but livestock, working dogs, and exotics. Most niche animal services have **no centralized marketplace**, leaving providers and customers to rely on scattered directories, Facebook groups, and word of mouth.

### Key Strategic Decisions

| Decision | Recommendation |
|----------|----------------|
| **Scope** | Species-agnostic (dogs, cats, horses, livestock, exotics) |
| **Provider types** | Breeders + Service Providers + Individuals |
| **Category structure** | Hierarchical (parent → subcategory) |
| **STUD vs STUD_SERVICE** | Keep both, clearly differentiate |

---

## Recommended Category Hierarchy

### Top-Level Categories (12)

```
1. BREEDING_SERVICES      - Stud, AI, whelping, consultation
2. CARE_SERVICES          - Boarding, sitting, day care, drop-in
3. TRAINING              - Obedience, specialty, working dog
4. GROOMING              - Full service, bath, nails, mobile
5. TRANSPORT             - Ground, air, flight nanny
6. HEALTH_VETERINARY     - Vet, vaccines, rehab, wellness
7. LIVESTOCK_SERVICES    - Shearing, farrier, hoof care
8. WORKING_DOG           - Herding, hunting, LGD, protection
9. SERVICE_THERAPY       - Therapy certification, service dog
10. CREATIVE_MEDIA       - Photography, video, marketing
11. PROPERTY_SERVICES    - Waste removal, cleaning
12. PRODUCTS             - Supplies, food, equipment
```

---

## Detailed Category Breakdown

### 1. BREEDING_SERVICES

For breeders offering reproduction-related services.

| Subcategory | Description | Typical Pricing |
|-------------|-------------|-----------------|
| `STUD_SERVICE` | Stud dog/stallion services (general offering) | $500-2,500+ |
| `LIVE_COVER` | Natural breeding on-site | $500-2,500+ |
| `AI_FRESH` | Artificial insemination - fresh semen | $300-800 |
| `AI_CHILLED` | AI with shipped chilled semen | $400-1,000 |
| `AI_FROZEN` | AI with frozen semen | $500-1,500 |
| `SEMEN_COLLECTION` | Semen collection & processing | $150-500 |
| `SEMEN_STORAGE` | Cryopreservation storage | $100-300/year |
| `WHELPING_SUPPORT` | Birth assistance, monitoring | $400-2,800+ |
| `BREEDING_CONSULTATION` | Pedigree analysis, pairing advice | $50-200/session |
| `MENTORSHIP` | New breeder education programs | $500-2,000 |
| `GUARDIAN_PROGRAM` | Guardian home placement/management | Varies |
| `PROGENY_GUARANTEE` | Breeding guarantee programs | Included |

**Metadata fields for STUD_SERVICE**:
```typescript
{
  breedingMethods: ["LIVE_COVER", "AI_FRESH", "AI_CHILLED", "AI_FROZEN"],
  healthTesting: string[],  // ["OFA_HIPS", "OFA_ELBOWS", "GENETIC_PANEL"]
  progenyGuarantee: boolean,
  linkedAnimalIds: number[],  // Link to specific stud animals
  species: string,  // "DOG", "CAT", "HORSE", etc.
  breeds: string[]
}
```

---

### 2. CARE_SERVICES

Standard pet care services (Rover/Wag model).

| Subcategory | Description | Pricing Unit |
|-------------|-------------|--------------|
| `BOARDING` | Overnight at provider's home | Per night |
| `HOUSE_SITTING` | Overnight at owner's home | Per night |
| `DAY_CARE` | Daytime supervision | Per day |
| `DROP_IN` | Quick home visits (30-60 min) | Per visit |
| `DOG_WALKING` | Scheduled walks | Per walk |
| `PET_SITTING` | General pet care | Hourly/daily |
| `EXOTIC_BOARDING` | Birds, reptiles, small mammals | Per night |
| `FARM_SITTING` | Livestock/farm animal care | Per day |

**Duration options**: 20 min, 30 min, 60 min, half-day, full-day, overnight

---

### 3. TRAINING

All training services across species and specialties.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `OBEDIENCE_BASIC` | Sit, stay, come, leash manners | $100-300/course |
| `OBEDIENCE_ADVANCED` | Off-leash, distraction proofing | $200-500/course |
| `PUPPY_TRAINING` | Socialization, house training | $150-400/course |
| `BEHAVIOR_MODIFICATION` | Aggression, anxiety, reactivity | $100-200/session |
| `BOARD_AND_TRAIN` | Immersive training programs | $800-2,500/month |
| `GROUP_CLASSES` | Multi-dog class sessions | $100-200/course |
| `PRIVATE_LESSONS` | One-on-one training | $75-150/session |
| `SHOW_HANDLING` | Conformation show prep | $50-100/session |
| `AGILITY_TRAINING` | Agility course training | $100-300/course |
| `TRICK_TRAINING` | Advanced tricks, CGC prep | $100-200/course |
| `HORSE_TRAINING` | Breaking, riding, discipline | $500-1,500/month |

---

### 4. GROOMING

Grooming services for all species.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `FULL_GROOM` | Bath, haircut, nails, ears | $50-150 |
| `BATH_BRUSH` | Bath and brush-out only | $30-60 |
| `NAIL_TRIM` | Nail trimming only | $10-25 |
| `DEMATTING` | Mat removal | $20-50+ |
| `MOBILE_GROOMING` | Grooming at owner's location | $75-200 |
| `HAND_STRIPPING` | Terrier/wire coat stripping | $100-200 |
| `CREATIVE_GROOMING` | Color, styling | $100-300 |
| `CAT_GROOMING` | Cat-specific grooming | $50-100 |
| `EXOTIC_GROOMING` | Rabbits, guinea pigs, birds | $25-75 |
| `HORSE_GROOMING` | Clipping, mane/tail care | $50-150 |

---

### 5. TRANSPORT

Pet and animal transportation services.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `LOCAL_TRANSPORT` | Within metro area | $25-75 |
| `GROUND_TRANSPORT` | Long-distance ground | $0.50-1.60/mile |
| `FLIGHT_NANNY` | In-cabin accompaniment | $300-800+ |
| `AIR_CARGO` | Cargo hold shipping | Varies |
| `VET_TRANSPORT` | To/from vet appointments | $25-50 |
| `AIRPORT_PICKUP` | Airport pickup/delivery | $50-150 |
| `LIVESTOCK_HAULING` | Horses, cattle, livestock | $2-5/mile |
| `SHOW_TRANSPORT` | Show/event transportation | $100-500+ |

**Metadata fields**:
```typescript
{
  transportTypes: ["GROUND", "FLIGHT_NANNY", "AIR_CARGO"],
  maxDistance: number,  // miles
  speciesAccepted: string[],
  crateRequired: boolean,
  insurance: boolean,
  insuranceAmount: number,  // cents
  usdaLicensed: boolean
}
```

---

### 6. HEALTH_VETERINARY

Veterinary and health-related services.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `VETERINARY` | General vet services | Varies |
| `VACCINATION` | Vaccine clinics | $15-50/vaccine |
| `DENTAL` | Dental cleaning, extractions | $200-800 |
| `WELLNESS_EXAM` | Annual checkups | $50-150 |
| `EMERGENCY_VET` | 24/7 emergency care | Varies |
| `REPRODUCTIVE_VET` | Breeding-specific vet care | Varies |
| `MASSAGE_THERAPY` | Canine/equine massage | $50-150/session |
| `HYDROTHERAPY` | Underwater treadmill, swim | $30-75/session |
| `PHYSICAL_REHAB` | Post-surgery rehabilitation | $50-150/session |
| `ACUPUNCTURE` | Alternative therapy | $75-150/session |
| `CHIROPRACTIC` | Spinal adjustment | $50-100/session |
| `LASER_THERAPY` | Cold laser treatment | $30-75/session |

---

### 7. LIVESTOCK_SERVICES

Farm and livestock-specific services.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `SHEEP_SHEARING` | Sheep fleece shearing | $18-30/head |
| `GOAT_SHEARING` | Goat/angora shearing | $25-35/head |
| `ALPACA_SHEARING` | Alpaca/llama shearing | $35-55/head |
| `FARRIER` | Horse hoof trimming & shoeing | $50-200/visit |
| `HOOF_TRIMMING` | Goat/sheep hoof care | $5-15/animal |
| `LIVESTOCK_AI` | Cattle/horse AI services | $50-200/breeding |
| `EMBRYO_TRANSFER` | Embryo collection/transfer | $500-2,000 |
| `LIVESTOCK_HANDLING` | Sorting, loading, processing | Hourly rate |
| `WOOL_PROCESSING` | Fiber cleaning, carding | $10-30/lb |

**Key insight**: Shearers are in SHORT SUPPLY. Book early (Feb 1 for spring).

---

### 8. WORKING_DOG

Specialty training for working breeds.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `HERDING_TRAINING` | Sheep/cattle herding | $120-200/lesson |
| `HERDING_INSTINCT_TEST` | Instinct evaluation | $50-100 |
| `HUNTING_TRAINING` | Bird dog, retriever training | $800-950/month |
| `FIELD_TRIAL_PREP` | Competition preparation | $100-200/session |
| `LGD_TRAINING` | Livestock guardian training | Varies |
| `LGD_PLACEMENT` | Guardian dog placement | Varies |
| `PROTECTION_TRAINING` | Personal protection | $150-300/session |
| `DETECTION_TRAINING` | Scent work, nose work | $100-200/session |
| `SCHUTZHUND` | IPO/Schutzhund sport | $100-200/session |
| `DOCK_DIVING` | Dock diving training | $50-100/session |
| `EARTHDOG` | Earthdog/barn hunt training | $30-75/session |

**Metadata fields**:
```typescript
{
  workingDisciplines: string[],
  stockAvailable: boolean,  // Has livestock for training
  facilityCertifications: string[],
  competitionTitles: string[]  // Trainer credentials
}
```

---

### 9. SERVICE_THERAPY

Service and therapy animal programs.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `THERAPY_DOG_CERT` | Therapy dog certification | $100-300 |
| `THERAPY_TRAINING` | Therapy dog preparation | $200-500 |
| `SERVICE_DOG_TRAINING` | Task training, public access | $15,000-50,000 |
| `OWNER_TRAINED_SUPPORT` | Guidance for owner-trainers | $50-150/session |
| `CGC_TESTING` | Canine Good Citizen testing | $20-50 |
| `TRICK_DOG_TESTING` | AKC Trick Dog titles | $20-50 |
| `TEMPERAMENT_TESTING` | Temperament evaluation | $50-100 |
| `ESA_LETTER` | Emotional support letters | $100-200 |
| `FACILITY_VISITS` | Hospital/school visits | Free-$50/visit |

**Certifications recognized**:
- Alliance of Therapy Dogs (ATD)
- Pet Partners
- Therapy Dogs International (TDI)
- AKC CGC, CGCA, CGCU

---

### 10. CREATIVE_MEDIA

Photography, video, and marketing services.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `PET_PHOTOGRAPHY` | Dog/cat portraits | $150-500/session |
| `EQUINE_PHOTOGRAPHY` | Horse portraits, action | $200-800/session |
| `LIVESTOCK_PHOTOGRAPHY` | Farm/livestock photos | $150-500/session |
| `LITTER_PHOTOGRAPHY` | Puppy/kitten litter photos | $200-400/session |
| `SHOW_PHOTOGRAPHY` | Conformation/event photos | $50-200/photo |
| `VIDEO_PRODUCTION` | Promo videos | $300-2,000 |
| `SOCIAL_MEDIA_CONTENT` | Content creation | $200-1,000/month |
| `WEBSITE_DESIGN` | Breeder website design | $500-5,000 |
| `BRANDING` | Logo, marketing materials | $300-2,000 |

**Session types**: Studio, on-location, action/sport, fine art black background

---

### 11. PROPERTY_SERVICES

Property maintenance services.

| Subcategory | Description | Pricing |
|-------------|-------------|---------|
| `WASTE_REMOVAL` | Poop scooping service | $15-50/visit |
| `YARD_DEODORIZING` | Odor treatment | $50-150 |
| `KENNEL_CLEANING` | Kennel/facility cleaning | $50-200 |
| `WASTE_STATION` | Station installation | $200-500 |
| `PET_STAIN_REMOVAL` | Carpet/floor cleaning | $100-300 |

**Service frequency**: One-time, weekly, bi-weekly, monthly

---

### 12. PRODUCTS

Physical products (optional category).

| Subcategory | Description |
|-------------|-------------|
| `FOOD_NUTRITION` | Dog food, supplements |
| `SUPPLIES_EQUIPMENT` | Crates, leashes, toys |
| `BREEDING_SUPPLIES` | Whelping boxes, puppy pens |
| `HEALTH_SUPPLEMENTS` | Vitamins, joint support |
| `TRAINING_EQUIPMENT` | E-collars, agility equipment |
| `GROOMING_PRODUCTS` | Shampoos, brushes, clippers |

---

## Species Support

The category system should support multiple species:

| Species | Primary Categories |
|---------|-------------------|
| **Dogs** | All categories |
| **Cats** | Care, Grooming, Health, Transport, Creative |
| **Horses** | Breeding, Training, Health, Transport, Farrier, Creative |
| **Livestock** (cattle, goats, sheep) | Breeding, Livestock Services, Transport, Health |
| **Fiber Animals** (alpacas, llamas) | Breeding, Shearing, Transport, Health |
| **Birds** | Care (exotic boarding), Grooming, Health, Transport |
| **Reptiles** | Care (exotic boarding), Health, Transport |
| **Small Mammals** (rabbits, guinea pigs) | Care, Grooming, Health, Transport |
| **Exotics** | Care, Health, Transport |

---

## Provider Types

### Type 1: BREEDER

Registered breeding program on BreederHQ.

**Available categories**: Breeding Services, Training (show handling), Creative Media
**Listing model**: Included with breeding program subscription
**Trust signals**: Health testing badges, OFA verification, AKC Breeder of Merit

### Type 2: SERVICE_PROVIDER

Independent service business.

**Available categories**: All except Breeding Services (unless also a breeder)
**Listing model**: Free tier + paid tiers for more listings
**Trust signals**: Background check, certifications, reviews

### Type 3: INDIVIDUAL

Solo service provider (Joey's poop scooping).

**Available categories**: Care, Property Services, basic Training
**Listing model**: Free tier with limits
**Trust signals**: Reviews, ID verification

---

## Subscription Tiers (Service Providers)

| Tier | Price | Listings | Features |
|------|-------|----------|----------|
| **FREE** | $0/month | 1 | Basic listing |
| **STARTER** | $9/month | 3 | Enhanced visibility |
| **PRO** | $29/month | 10 | Featured placement, analytics |
| **BUSINESS** | $79/month | Unlimited | All features, API access, verified badge |

---

## Data Model

### ServiceListing Schema

```typescript
interface ServiceListing {
  id: number;

  // Provider
  providerId: number;
  providerType: "BREEDER" | "SERVICE_PROVIDER" | "INDIVIDUAL";

  // Category (hierarchical)
  parentCategory: ParentCategory;  // e.g., "BREEDING_SERVICES"
  subcategory: string;             // e.g., "STUD_SERVICE"

  // Content
  title: string;
  description: string;

  // Media
  images: string[];
  videoUrl?: string;

  // Location & Service Area
  city?: string;
  state?: string;
  country: string;
  serviceArea?: "LOCAL" | "REGIONAL" | "NATIONAL" | "INTERNATIONAL";
  serviceRadius?: number;  // miles
  travelToClient?: boolean;

  // Pricing
  priceType: "FIXED" | "STARTING_AT" | "HOURLY" | "PER_UNIT" | "CONTACT" | "FREE";
  priceCents?: number;
  priceUnit?: string;  // "per night", "per head", "per session"

  // Species & Breeds
  species: string[];           // ["DOG", "CAT", "HORSE"]
  breeds?: string[];           // ["Golden Retriever", "Labrador"]
  acceptsAllBreeds?: boolean;

  // Availability
  availability?: {
    days: string[];
    hours?: string;
    leadTime?: string;         // "24 hours", "1 week"
    seasonalNotes?: string;    // "Shearing Mar-May only"
  };

  // Contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  preferredContact?: "EMAIL" | "PHONE" | "MESSAGE";

  // Certifications & Credentials
  certifications?: string[];   // ["CPDT-KA", "AKC CGC Evaluator"]
  licenses?: string[];         // ["USDA Licensed"]
  insurance?: boolean;
  insuranceAmount?: number;

  // Status
  status: "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "EXPIRED";

  // SEO
  slug: string;

  // Metadata (category-specific fields)
  metadata?: Record<string, unknown>;

  // Stats (computed)
  rating?: number;
  reviewCount?: number;
  repeatClients?: number;
  hireCount?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}
```

---

## Implementation Priority

### Phase 1: Foundation (MVP)
- [ ] Core pet services: Boarding, Sitting, Walking, Training, Grooming
- [ ] Breeder services: Stud Service, Mentorship, Whelping Support
- [ ] Basic provider profiles and listings
- [ ] Search by location and category

### Phase 2: Expand Categories
- [ ] Transport services
- [ ] Health/Veterinary services
- [ ] Property services (waste removal)
- [ ] Photography/Creative

### Phase 3: Specialty Services
- [ ] Working dog training (herding, hunting, LGD)
- [ ] Service/therapy dog programs
- [ ] Livestock services (shearing, farrier)
- [ ] Exotic pet services

### Phase 4: Advanced Features
- [ ] Reviews and ratings system
- [ ] Badge/certification verification
- [ ] Booking/scheduling integration
- [ ] Payment processing
- [ ] Pet insurance partnerships

---

## Competitive Advantage

| Gap in Market | BreederHQ Opportunity |
|---------------|----------------------|
| AKC has no stud listings | First major platform with stud service marketplace |
| No centralized herding/hunting dog trainer directory | Become the go-to for working dog services |
| Shearers rely on word-of-mouth | Shearer directory with booking |
| Breeder mentorship is informal | Formalized mentorship marketplace |
| Guardian home programs are ad-hoc | Structured guardian matching |
| LGD placement is scattered | LGD-specific marketplace |

---

## Sources

- [Full Research Document](./services-research.md)
- Platform research: Rover, Wag!, Thumbtack, AKC Marketplace, Good Dog
- Specialty research: StallionsNow, Light Livestock Equipment, American Farrier's Association
- Service provider interviews and pricing research

---

*Last updated: January 2026*
