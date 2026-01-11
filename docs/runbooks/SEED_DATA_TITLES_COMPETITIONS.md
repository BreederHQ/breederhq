# Seed Data: Titles & Competitions

This document describes the seed data systems used to populate test environments with realistic title and competition records that exercise all Titles & Competitions features.

## Overview

The goal is to simulate what a **long-running, active breeder's tenant** would look like with years of competition history, earned titles, and producing records.

| System | Location | Purpose |
|--------|----------|---------|
| **Title Definitions** | `breederhq-api/prisma/seed/seed-title-definitions.ts` | Global title catalog (AKC, AQHA, TICA, etc.) |
| **Animal Titles** | `breederhq-api/prisma/seed/seed-animal-titles.ts` | Per-animal title records |
| **Competition Entries** | `breederhq-api/prisma/seed/seed-animal-competitions.ts` | Show/trial/race history |

---

## Data Models

### TitleDefinition

```typescript
interface TitleDefinition {
  species: "DOG" | "CAT" | "HORSE" | "GOAT" | "SHEEP" | "RABBIT";
  abbreviation: string;      // "CH", "GCH", "CD"
  fullName: string;          // "Champion", "Grand Champion"
  category: TitleCategory;
  organization?: string;     // "AKC", "AQHA", "TICA"
  prefixTitle: boolean;      // Shows before animal name
  suffixTitle: boolean;      // Shows after animal name
  displayOrder: number;
  isProducingTitle?: boolean;
  parentTitleId?: number;    // Hierarchy (GCH requires CH)
}

type TitleCategory =
  | "CONFORMATION" | "OBEDIENCE" | "AGILITY" | "FIELD" | "HERDING"
  | "TRACKING" | "RALLY" | "PRODUCING" | "BREED_SPECIFIC" | "PERFORMANCE" | "OTHER";
```

### AnimalTitle

```typescript
interface AnimalTitle {
  animalId: number;
  titleDefinitionId: number;
  dateEarned: string;            // ISO date
  status: "IN_PROGRESS" | "EARNED" | "VERIFIED";
  pointsEarned?: number;
  majorWins?: number;
  eventName?: string;
  eventLocation?: string;
  handlerName?: string;
  verified: boolean;
  verifiedBy?: string;           // "AKC Registry"
  registryRef?: string;          // Reference number
  notes?: string;
}
```

### CompetitionEntry

```typescript
interface CompetitionEntry {
  animalId: number;
  eventName: string;
  eventDate: string;
  location?: string;
  organization?: string;
  competitionType: CompetitionType;
  className?: string;            // "Open Dogs", "Excellent B Standard"
  placement?: number;            // 1, 2, 3, 4
  placementLabel?: string;       // "Best of Breed", "Winners Dog"
  pointsEarned?: number;
  isMajorWin: boolean;           // 3+ points in dogs
  qualifyingScore: boolean;      // "Q" for performance events
  score?: number;                // Obedience score or agility time
  scoreMax?: number;
  judgeName?: string;
  notes?: string;
  // Racing-specific (horses)
  prizeMoneyCents?: number;
  trackName?: string;
  trackSurface?: string;
  raceGrade?: string;
  finishTime?: string;
  speedFigure?: number;
  handlerName?: string;
  trainerName?: string;
}

type CompetitionType =
  | "CONFORMATION_SHOW" | "OBEDIENCE_TRIAL" | "AGILITY_TRIAL" | "FIELD_TRIAL"
  | "HERDING_TRIAL" | "TRACKING_TEST" | "RALLY_TRIAL" | "RACE"
  | "PERFORMANCE_TEST" | "BREED_SPECIALTY" | "OTHER";
```

---

## Part 1: Title Definitions

Create global title definitions for each species/organization combination.

### Dogs (AKC/UKC)

| Abbrev | Full Name | Category | Prefix/Suffix | Org |
|--------|-----------|----------|---------------|-----|
| CH | Champion | CONFORMATION | Prefix | AKC |
| GCH | Grand Champion | CONFORMATION | Prefix | AKC |
| GCHB | Grand Champion Bronze | CONFORMATION | Prefix | AKC |
| GCHS | Grand Champion Silver | CONFORMATION | Prefix | AKC |
| GCHG | Grand Champion Gold | CONFORMATION | Prefix | AKC |
| GCHP | Grand Champion Platinum | CONFORMATION | Prefix | AKC |
| CD | Companion Dog | OBEDIENCE | Suffix | AKC |
| CDX | Companion Dog Excellent | OBEDIENCE | Suffix | AKC |
| UD | Utility Dog | OBEDIENCE | Suffix | AKC |
| OTCH | Obedience Trial Champion | OBEDIENCE | Prefix | AKC |
| NA | Novice Agility | AGILITY | Suffix | AKC |
| OA | Open Agility | AGILITY | Suffix | AKC |
| AX | Agility Excellent | AGILITY | Suffix | AKC |
| MX | Master Agility Excellent | AGILITY | Suffix | AKC |
| MACH | Master Agility Champion | AGILITY | Prefix | AKC |
| RN | Rally Novice | RALLY | Suffix | AKC |
| RA | Rally Advanced | RALLY | Suffix | AKC |
| RE | Rally Excellent | RALLY | Suffix | AKC |
| RAE | Rally Advanced Excellent | RALLY | Suffix | AKC |
| RACH | Rally Champion | RALLY | Prefix | AKC |
| JH | Junior Hunter | FIELD | Suffix | AKC |
| SH | Senior Hunter | FIELD | Suffix | AKC |
| MH | Master Hunter | FIELD | Suffix | AKC |
| AFC | Amateur Field Champion | FIELD | Prefix | AKC |
| FC | Field Champion | FIELD | Prefix | AKC |
| HT | Herding Tested | HERDING | Suffix | AKC |
| PT | Pre-Trial Tested | HERDING | Suffix | AKC |
| HS | Herding Started | HERDING | Suffix | AKC |
| HI | Herding Intermediate | HERDING | Suffix | AKC |
| HX | Herding Excellent | HERDING | Suffix | AKC |
| HC | Herding Champion | HERDING | Prefix | AKC |
| TD | Tracking Dog | TRACKING | Suffix | AKC |
| TDX | Tracking Dog Excellent | TRACKING | Suffix | AKC |
| CT | Champion Tracker | TRACKING | Prefix | AKC |
| ROM | Register of Merit | PRODUCING | Suffix | Breed Club |
| ROMX | Register of Merit Excellent | PRODUCING | Suffix | Breed Club |

### Horses (AQHA/APHA/USDF)

| Abbrev | Full Name | Category | Prefix/Suffix | Org |
|--------|-----------|----------|---------------|-----|
| AQHA CH | AQHA Champion | CONFORMATION | Prefix | AQHA |
| AQHA SP CH | AQHA Supreme Champion | CONFORMATION | Prefix | AQHA |
| WC | World Champion | CONFORMATION | Prefix | AQHA |
| RC | Reserve Champion | CONFORMATION | Prefix | AQHA |
| ROM | Register of Merit | PERFORMANCE | Suffix | AQHA |
| SI | Speed Index | PERFORMANCE | Suffix | AQHA Racing |
| AAA | Triple-A Racing | PERFORMANCE | Suffix | AQHA Racing |
| Bronze | Training Level Bronze | PERFORMANCE | Suffix | USDF |
| Silver | Training Level Silver | PERFORMANCE | Suffix | USDF |
| Gold | Training Level Gold | PERFORMANCE | Suffix | USDF |

### Cats (TICA/CFA)

| Abbrev | Full Name | Category | Prefix/Suffix | Org |
|--------|-----------|----------|---------------|-----|
| CH | Champion | CONFORMATION | Prefix | TICA |
| GC | Grand Champion | CONFORMATION | Prefix | TICA |
| DGC | Double Grand Champion | CONFORMATION | Prefix | TICA |
| TGC | Triple Grand Champion | CONFORMATION | Prefix | TICA |
| QGC | Quadruple Grand Champion | CONFORMATION | Prefix | TICA |
| SGC | Supreme Grand Champion | CONFORMATION | Prefix | TICA |
| RW | Regional Winner | CONFORMATION | Suffix | TICA |
| DM | Distinguished Merit | PRODUCING | Suffix | TICA |

---

## Part 2: Animal Title Seeding Patterns

### Show Dog Champion Track

```
Year 1: Work toward CH (15 points, 2 majors required)
Year 2: Earn CH, start working toward GCH
Year 3+: Progress through GCH levels (Bronze → Silver → Gold → Platinum)
```

### Performance Dog Multi-Venue Pattern

```
Obedience: CD → CDX → UD (each requires 3 qualifying scores)
Agility: NA/OA → AX/MX → MACH (requires double-Q runs + speed points)
Rally: RN → RA → RE → RAE (concurrent with obedience)
```

### Sample Title Assignment

```typescript
// For a 5-year-old Australian Shepherd
const titles = [
  {
    titleDefinitionId: /* CH */,
    dateEarned: "2022-03-15",
    status: "VERIFIED",
    pointsEarned: 16,
    majorWins: 3,
    eventName: "Santa Barbara Kennel Club",
    eventLocation: "Santa Barbara, CA",
    handlerName: "Sarah Mitchell",
    verified: true,
    verifiedBy: "AKC Registry",
    registryRef: "AKC-CH-2022-45892"
  },
  {
    titleDefinitionId: /* GCH */,
    dateEarned: "2023-01-22",
    status: "VERIFIED",
    pointsEarned: 28,
    majorWins: 5,
    eventName: "Palm Springs Kennel Club",
    eventLocation: "Palm Springs, CA",
    handlerName: "Sarah Mitchell",
    verified: true,
    verifiedBy: "AKC Registry"
  },
  {
    titleDefinitionId: /* CD */,
    dateEarned: "2021-09-10",
    status: "EARNED",
    notes: "195/200 average across 3 legs"
  },
  {
    titleDefinitionId: /* RA */,
    status: "IN_PROGRESS",
    pointsEarned: 2,
    notes: "Needs 1 more qualifying leg"
  }
];
```

---

## Part 3: Competition Entry Patterns

### Show Weekend (Conformation)

```
Friday: Entry, may not place
Saturday: Winners Dog/Bitch → points (1-5 based on entries)
Sunday: Best of Winners → additional points
Monday: Best of Breed → Grand Championship points
```

### Performance Trial (Agility/Obedience)

```
Trial Weekend:
- Multiple runs per day (Standard + JWW for agility)
- Scores recorded for each run
- Q (qualifying) or NQ for each
- Double-Q = both runs qualify same day
```

### Sample Competition Entries

```typescript
const competitions = [
  // Puppy class - first year
  {
    eventDate: "2021-02-20",
    eventName: "Ventura County Dog Fanciers",
    location: "Ventura, CA",
    organization: "AKC",
    competitionType: "CONFORMATION_SHOW",
    className: "Puppy 6-9 Months Dogs",
    placement: 1,
    placementLabel: "Best Puppy",
    pointsEarned: 0,
    isMajorWin: false,
    judgeName: "Mr. Robert Cole"
  },

  // First major win
  {
    eventDate: "2021-06-12",
    eventName: "Del Valle Dog Club of Livermore",
    location: "Pleasanton, CA",
    organization: "AKC",
    competitionType: "CONFORMATION_SHOW",
    className: "Open Dogs",
    placement: 1,
    placementLabel: "Winners Dog",
    pointsEarned: 3,
    isMajorWin: true,
    judgeName: "Mrs. Patricia Trotter"
  },

  // Obedience trial with score
  {
    eventDate: "2021-09-10",
    eventName: "Sacramento Valley Dog Fanciers",
    location: "Sacramento, CA",
    organization: "AKC",
    competitionType: "OBEDIENCE_TRIAL",
    className: "Novice B",
    placement: 2,
    score: 195.5,
    scoreMax: 200,
    qualifyingScore: true,
    judgeName: "Ms. Linda Harvey"
  },

  // Championship-finishing show
  {
    eventDate: "2022-03-14",
    eventName: "Santa Barbara Kennel Club",
    location: "Santa Barbara, CA",
    organization: "AKC",
    competitionType: "CONFORMATION_SHOW",
    className: "Open Dogs",
    placement: 1,
    placementLabel: "Winners Dog",
    pointsEarned: 4,
    isMajorWin: true,
    judgeName: "Dr. Carmen Battaglia",
    notes: "Finished Championship!"
  },

  // Agility double-Q weekend
  {
    eventDate: "2022-07-16",
    eventName: "Bay Team Agility Club",
    location: "San Jose, CA",
    organization: "AKC",
    competitionType: "AGILITY_TRIAL",
    className: "Novice Standard",
    score: 42.58,
    qualifyingScore: true,
    notes: "Clean run, under SCT"
  },
  {
    eventDate: "2022-07-16",
    eventName: "Bay Team Agility Club",
    location: "San Jose, CA",
    organization: "AKC",
    competitionType: "AGILITY_TRIAL",
    className: "Novice JWW",
    score: 35.21,
    qualifyingScore: true,
    notes: "Double Q weekend!"
  }
];
```

---

## Part 4: Producing Records

The Producing Record is calculated dynamically from offspring titles. Ensure some animals have **titled offspring** to demonstrate this feature.

### Example Producing Scenario

```
Dam: "Starlight Promise"
├── 8 total offspring
├── 5 titled offspring:
│   ├── Offspring 1: CH, CD
│   ├── Offspring 2: GCH
│   ├── Offspring 3: CH, MX, MACH
│   ├── Offspring 4: CH (working toward GCH)
│   └── Offspring 5: RN, RA
└── Qualifies for ROM (Register of Merit)
```

---

## Reference Data

### Event Names by Region

**California Dog Shows:**
- Santa Barbara Kennel Club
- Del Valle Dog Club of Livermore
- Sacramento Valley Dog Fanciers
- Golden Gate Kennel Club
- Ventura County Dog Fanciers
- San Fernando Kennel Club
- Wine Country Kennel Club

**Texas Dog Shows:**
- Houston Kennel Club
- Texas Kennel Club (Dallas)
- San Antonio Kennel Club

**National Events:**
- Westminster Kennel Club (New York, NY)
- AKC National Championship (Orlando, FL)
- Eukanuba National Championship
- AKC Agility Invitational (Orlando, FL)

**Horse Shows (AQHA):**
- AQHA World Championship Show (Oklahoma City, OK)
- All American Quarter Horse Congress (Columbus, OH)
- Lucas Oil AQHA World Championship

### Judge Names Pool

```typescript
const JUDGES = [
  "Mr. Robert Cole",
  "Mrs. Patricia Trotter",
  "Dr. Carmen Battaglia",
  "Ms. Linda Harvey",
  "Mr. David Frei",
  "Mrs. Kathy Beliew",
  "Dr. Robert Smith",
  "Mrs. Anne Rogers Clark",
  "Mr. Peter Green",
  "Ms. Dorothy Macdonald"
];
```

### Handler Names Pool

```typescript
const HANDLERS = [
  "Sarah Mitchell",
  "Michael Torres",
  "Jennifer Adams",
  "David Chen",
  "Amanda Rodriguez",
  "Christopher Lee",
  "Michelle Thompson",
  "Robert Garcia"
];
```

---

## Quick Reference: Minimum Viable Test Set

For each tenant, ensure at minimum:

| Species | Titles per Animal | Competition Entries | Must Include |
|---------|-------------------|---------------------|--------------|
| Dog | 3-6 | 40-80 | 1 Champion, 1 Multi-venue, 1 In-Progress |
| Cat | 2-4 | 15-30 | 1 Grand Champion, 1 Regional Winner |
| Horse | 2-4 | 20-40 | 1 Halter, 1 Performance, 1 Racing (if applicable) |

**Date Range:** 2019 to present (2025)

---

## Seed Execution Order

```bash
cd breederhq-api

# 1. Title definitions first
npx ts-node prisma/seed/seed-title-definitions.ts

# 2. Competition entries (history)
npx ts-node prisma/seed/seed-animal-competitions.ts

# 3. Earned titles (reference competitions)
npx ts-node prisma/seed/seed-animal-titles.ts
```

---

## Verification Checklist

After seeding, verify in the Animals UI:

- [ ] Animal names display with title prefixes/suffixes (e.g., "GCH Midnight Star CD RN")
- [ ] Titles Tab shows summary stats (Total, Verified, by Category)
- [ ] Titles grouped by category with correct status badges
- [ ] IN_PROGRESS titles show partial progress
- [ ] VERIFIED titles show registry references
- [ ] Competitions Tab shows stats dashboard
- [ ] Competition entries grouped by year
- [ ] Placement badges display (gold/silver/bronze)
- [ ] MAJOR and Q indicators display correctly
- [ ] Producing Record shows titled offspring counts
- [ ] Privacy settings control cross-tenant visibility

---

## Related Files

- UI: `apps/animals/src/components/TitlesTab.tsx`
- UI: `apps/animals/src/components/CompetitionsTab.tsx`
- Types: `apps/animals/src/api.ts` (lines 6-132)
- Existing: `breederhq-api/prisma/seed/seed-genetics-test-animals.ts`
