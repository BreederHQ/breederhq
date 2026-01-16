# BreederHQ Genetics System - Complete Documentation

This is the comprehensive guide to BreederHQ's genetics system, covering all features from genetic testing imports to breeding analysis tools.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Genetic Markers Registry](#genetic-markers-registry)
- [Animal Genetics Profile](#animal-genetics-profile)
- [Lab Import System](#lab-import-system)
- [Genetics Lab (Breeding Analysis)](#genetics-lab-breeding-analysis)
- [Breed-Specific Profiles](#breed-specific-profiles)
- [Admin Features](#admin-features)
- [Network & Marketplace Sharing](#network--marketplace-sharing)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Related Documentation](#related-documentation)

---

## Overview

BreederHQ's genetics system provides comprehensive genetic data management for breeders, including:

- **Import genetic test results** from labs like Embark, Wisdom Panel, UC Davis VGL
- **Track health clearances** with Clear/Carrier/Affected status
- **Analyze breeding pairings** with Punnett squares, health risk assessment, and COI calculations
- **Share genetics data** with network breeders and on marketplace listings
- **Admin management** of the genetic markers registry

### Supported Species

| Species | Health Tests | Coat Genetics | Breeding Analysis |
|---------|-------------|---------------|-------------------|
| Dogs    | Full support| Full support  | Full support      |
| Cats    | Full support| Full support  | Full support      |
| Horses  | Full support| Full support  | Full support      |
| Goats   | Basic       | Basic         | Dangerous pairings|
| Rabbits | Basic       | Basic         | Dangerous pairings|

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GENETICS SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────────────────┐   │
│  │ Lab Import  │────▶│ Genetic Markers │────▶│ Animal Genetic Results  │   │
│  │ (Embark,etc)│     │   Registry      │     │   (Per Animal)          │   │
│  └─────────────┘     └─────────────────┘     └─────────────────────────┘   │
│         │                    │                          │                   │
│         ▼                    ▼                          ▼                   │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────────────────┐   │
│  │ Extended    │     │ Admin Pending   │     │ Genetics Tab (Animals)  │   │
│  │ Data (COI,  │     │ Review Queue    │     │ - Health Clearances     │   │
│  │ MHC, etc.)  │     │                 │     │ - Coat Color            │   │
│  └─────────────┘     └─────────────────┘     │ - Traits                │   │
│         │                                     └─────────────────────────┘   │
│         ▼                                               │                   │
│  ┌─────────────────────────────────────────────────────┴───────────────┐   │
│  │                      GENETICS LAB (Breeding Module)                  │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌────────────────┐  │   │
│  │  │ Punnett    │  │ Health Risk │  │   COI    │  │ Best Match     │  │   │
│  │  │ Square     │  │ Assessment  │  │Calculator│  │ Finder         │  │   │
│  │  └────────────┘  └─────────────┘  └──────────┘  └────────────────┘  │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │              Dangerous Pairing Warnings                         ││   │
│  │  │  Double Merle | Lethal White | Scottish Fold | Charlie | etc.   ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    VISIBILITY / SHARING                              │   │
│  │     Network Sharing  ◀──────────────▶  Marketplace Display          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Types** | `packages/api/src/types/genetics.ts` | TypeScript interfaces for all genetics data |
| **API Resource** | `packages/api/src/resources/genetics.ts` | API client for genetics endpoints |
| **Import Dialog** | `packages/ui/src/components/GeneticsImport/` | UI for importing lab results |
| **Display Components** | `packages/ui/src/components/GeneticsDisplay/` | Public-facing genetics display |
| **Admin Tab** | `apps/platform/src/components/GeneticsAdminTab.tsx` | Admin marker management |
| **Breed Profiles** | `apps/breeding/src/components/BreedGeneticProfiles.tsx` | Breed-specific testing recommendations |
| **Lab Parsers** | `breederhq-api/src/lib/genetics-import/` | Backend CSV/TSV parsing |

---

## Genetic Markers Registry

The genetic markers registry is the master database of all known genetic markers (loci, tests, traits).

### Marker Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `health` | Disease and health condition tests | DM, PRA, vWD, MDR1, HCM |
| `coat_color` | Color-determining loci | E (Extension), K (Dominant Black), A (Agouti), B (Brown), D (Dilute) |
| `coat_type` | Texture and length genes | L (Long Coat), Cu (Curly), F (Furnishings), IC (Improper Coat) |
| `physical_traits` | Body structure genes | IGF1 (Body Size), BT (Bobtail), Dewclaws |
| `eye_color` | Eye color determining genes | Blue Eyes, ALX4 |
| `other` | Miscellaneous markers | Various breed-specific markers |

### Marker Data Structure

```typescript
interface GeneticMarker {
  id: number;
  species: "DOG" | "CAT" | "HORSE" | "OTHER";
  category: GeneticMarkerCategory;

  // Identifiers
  code: string;              // Short code: "DM", "A", "EFS"
  commonName: string;        // "Degenerative Myelopathy", "Agouti"
  scientificName?: string;   // Scientific/gene name if different
  gene?: string;             // Gene name: "SOD1", "ASIP"
  aliases?: string[];        // Alternative names

  // Display
  description: string;       // Plain English explanation
  isCommon: boolean;         // Show in default UI

  // Filtering
  breedSpecific?: string[];  // Breed-specific markers (null = universal)

  // Input type
  inputType: "allele_pair" | "status" | "genotype" | "percentage" | "text";
  allowedValues?: string[];  // For status type: ["Clear", "Carrier", "Affected"]

  // Admin
  pendingReview: boolean;    // Flagged for admin review
  source: string;            // "seed", "embark_import", etc.
}
```

### How Markers Are Added

1. **Seed Data** - Core markers are seeded during initial setup
2. **Lab Imports** - Unrecognized markers from imports are flagged for review
3. **Admin Approval** - Admins can approve, reject, or merge pending markers

---

## Animal Genetics Profile

Each animal can have a complete genetic profile containing test results and extended data.

### Profile Components

```typescript
interface AnimalGeneticProfile {
  animalId: number;

  // Test metadata
  testProvider?: string;     // "Embark", "UC Davis VGL", etc.
  testDate?: string;
  testId?: string;

  // Breed composition (from DNA test)
  breedComposition: BreedCompositionEntry[];

  // Individual test results
  results: AnimalGeneticResult[];

  // Summary counts by category
  summary: {
    total: number;
    byCategory: Record<GeneticMarkerCategory, number>;
  };

  // Extended data (from Embark and other advanced tests)
  coi?: COIData;                    // Coefficient of Inbreeding
  mhcDiversity?: MHCDiversity;       // Immune system diversity
  lineage?: GeneticLineage;          // Maternal/paternal haplotypes
  predictedAdultWeight?: { value: number; unit: "lbs" | "kg" };
  lifeStage?: string;                // Life stage at test time
}
```

### Genetic Result Statuses

For health markers, results are stored with a status:

| Status | Meaning | UI Color |
|--------|---------|----------|
| `clear` | No copies of mutation | Green |
| `carrier` | One copy (usually unaffected) | Yellow |
| `affected` | Two copies (at risk) | Red |
| `at_risk` | Elevated risk (complex inheritance) | Orange |
| `not_tested` | No result available | Gray |

### Genotype Storage

For trait markers, genotypes are stored as allele pairs:

```typescript
interface AnimalGeneticResult {
  markerId: number;

  // Allele-based storage
  allele1?: string;          // "E", "N", "ky"
  allele2?: string;          // "e", "DM", "ky"
  genotype?: string;         // Combined: "E/e", "N/DM"

  // Status-based storage (health markers)
  status?: GeneticResultStatus;

  // Raw value from lab
  rawValue?: string;

  // Sharing controls
  networkVisible: boolean;
  marketplaceVisible: boolean;
}
```

---

## Lab Import System

BreederHQ can import genetic test results from multiple lab providers.

### Supported Providers

| Provider | Status | Formats | Extended Data |
|----------|--------|---------|---------------|
| **Embark** | Full Support | CSV, TSV | COI, MHC, Lineage, Weight, Breed % |
| Wisdom Panel | Coming Soon | PDF | - |
| UC Davis VGL | Coming Soon | PDF | - |
| Animal Genetics | Coming Soon | PDF | - |
| Paw Print | Coming Soon | PDF | - |

### Import Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            IMPORT FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. User uploads file         2. Parser extracts data                       │
│   ┌─────────────────┐          ┌─────────────────────────┐                  │
│   │  CSV/TSV File   │─────────▶│  Provider-Specific      │                  │
│   │  from Lab       │          │  Parser (embark-parser) │                  │
│   └─────────────────┘          └─────────────────────────┘                  │
│                                          │                                   │
│   3. Preview shown to user               ▼                                   │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Preview Results                                                      │  │
│   │  ├─ Breed Composition (visual bars)                                   │  │
│   │  ├─ COI with risk level                                               │  │
│   │  ├─ MHC Diversity                                                     │  │
│   │  ├─ Lineage Haplotypes                                                │  │
│   │  ├─ Predicted Weight                                                  │  │
│   │  └─ Genetic Markers by category                                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                          │                                   │
│   4. User chooses import strategy        ▼                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Import Strategy                                                     │   │
│   │  ○ Replace existing data - Overwrites current genetics               │   │
│   │  ○ Merge with existing - Adds new, keeps existing                    │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                          │                                   │
│   5. Data saved to database              ▼                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Database                                                            │   │
│   │  ├─ AnimalGenetics table (extended data)                             │   │
│   │  ├─ AnimalGeneticResult table (individual markers)                   │   │
│   │  └─ GeneticMarker table (new markers flagged for review)             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Embark CSV Format

Embark exports use a 3-column format:

```csv
"category","name","value"
"ID","Swab code","# 31001811412617"
"ID","Name","Coralie"
"ID","Sex","Female"
"Breed Name","Name","Bernedoodle"
"Breed mix","Bernese Mountain Dog","50.0%"
"Breed mix","Poodle (Standard)","50.0%"
"Genetic Stats","Life Stage","Mature adult"
"Genetic Stats","Predicted Adult Weight","57.41 lbs"
"Lineage","MT Haplotype","A228_MT"
"Health","MDR1 Drug Sensitivity (ABCB1)","clear"
"Health","Coefficient Of Inbreeding","0.00178111"
"Health","MHC Class II - DLA DRB1","2"
"Trait","E Locus (MC1R)","Ee"
```

See [Embark Import Guide](./EMBARK-IMPORT-GUIDE.md) for detailed instructions.

---

## Genetics Lab (Breeding Analysis)

The Genetics Lab in the Breeding module provides tools for analyzing potential pairings.

### Features

#### 1. Punnett Square Calculator

Predicts offspring genotypes from parent alleles.

**Example: E Locus (Extension)**
```
Parent 1: Ee    Parent 2: Ee

        E       e
    ┌───────┬───────┐
E   │  EE   │  Ee   │
    │  25%  │  25%  │
    ├───────┼───────┤
e   │  Ee   │  ee   │
    │  25%  │  25%  │
    └───────┴───────┘

Result: 25% EE, 50% Ee, 25% ee
```

#### 2. Health Risk Assessment

Calculates risk of producing affected offspring.

| Pairing | Risk Level | Outcome |
|---------|------------|---------|
| Clear × Clear | None | 100% Clear |
| Clear × Carrier | Low | 50% Clear, 50% Carrier |
| Carrier × Carrier | Moderate | 25% Clear, 50% Carrier, 25% Affected |
| Carrier × Affected | High | 50% Carrier, 50% Affected |
| Affected × Affected | Critical | 100% Affected |

#### 3. COI Calculator

Calculates Coefficient of Inbreeding from:
- Pedigree data (calculated)
- Imported Embark data (genetic)

**COI Risk Levels:**

| COI % | Risk Level | Interpretation |
|-------|------------|----------------|
| < 5% | Excellent | Very low inbreeding |
| 5-10% | Good | Acceptable range |
| 10-15% | Moderate | Consider outcrossing |
| 15-25% | High | Elevated health risks |
| > 25% | Critical | Significant inbreeding depression risk |

#### 4. Best Match Finder

Ranks potential mates based on:
- Health compatibility
- Genetic diversity (COI)
- Trait complementarity
- Missing test coverage

#### 5. Dangerous Pairing Warnings

Automatic warnings for risky breeding combinations:

| Warning | Species | Trigger | Risk |
|---------|---------|---------|------|
| **Double Merle** | Dog | M/m × M/m | 25% deaf/blind puppies |
| **Lethal White Overo** | Horse | O/o × O/o | 25% fatal white foals |
| **Double Scottish Fold** | Cat | Fd/fd × Fd/fd | 25% severe osteochondrodysplasia |
| **Charlie (Lethal)** | Rabbit | En/en × En/en | 25% megacolon/early death |
| **Polled × Polled** | Goat | P/p × P/p | Intersex offspring risk |
| **Double LP** | Horse | LP/lp × LP/lp | Night blindness risk |
| **Blood Type Incompatibility** | Cat | Type B × Type A | Neonatal isoerythrolysis |

---

## Breed-Specific Profiles

BreederHQ includes built-in breed profiles with recommended tests and standards.

### Available Profiles

**Dogs:**
- Australian Shepherd
- Labrador Retriever
- German Shepherd
- French Bulldog
- Golden Retriever
- Poodle
- Border Collie
- Cavalier King Charles Spaniel

**Horses:**
- American Quarter Horse
- Arabian
- Paint Horse

**Cats:**
- Maine Coon
- Scottish Fold
- Bengal

### Profile Data

Each breed profile includes:

```typescript
interface BreedProfile {
  breed: string;
  species: "DOG" | "CAT" | "HORSE";
  aliases?: string[];

  // Recommended health tests
  healthTests: HealthTestRecommendation[];

  // Breed standard colors/patterns
  coatStandards?: CoatStandard[];

  // Breeding notes and warnings
  geneticNotes?: string[];

  // External resources
  resources?: { name: string; url: string }[];
}
```

### Health Test Recommendations

Tests are categorized by importance:

| Importance | Meaning | UI Display |
|------------|---------|------------|
| `required` | Essential for responsible breeding | Red alert |
| `recommended` | Strongly advised | Yellow notice |
| `optional` | Nice to have | Gray text |

---

## Admin Features

Platform administrators can manage the genetic markers registry.

### Admin Tab Location

**Platform Settings > Genetics Admin Tab**

### Admin Capabilities

1. **View Pending Markers** - Markers from imports needing review
2. **Approve Markers** - Add to registry with category/species assignment
3. **Reject Markers** - Remove incorrect or duplicate entries
4. **Merge Markers** - Combine duplicate markers into existing ones

### Marker Review Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MARKER REVIEW WORKFLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. Import encounters unknown marker                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Lab CSV: "Trait","New Mystery Gene (XYZ)","Aa"                     │   │
│   │           ↓                                                         │   │
│   │  Not found in registry → Create pending marker                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   2. Admin reviews in Genetics Admin Tab                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Pending: "New Mystery Gene"                                        │   │
│   │  Code: XYZ | Category: other | Source: embark_import                │   │
│   │                                                                     │   │
│   │  Actions: [Approve] [Merge] [Reject]                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   3a. APPROVE - Add to registry                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Edit fields:                                                       │   │
│   │  - Code: XYZ                                                        │   │
│   │  - Common Name: Mystery Gene                                        │   │
│   │  - Category: coat_color ▼                                           │   │
│   │  - Species: DOG ▼                                                   │   │
│   │  - Description: Affects coat pattern                                │   │
│   │  - Gene: XYZ1                                                       │   │
│   │  - [x] Show in default UI                                           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   3b. MERGE - Link to existing marker                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  This is actually the same as "Agouti" marker                       │   │
│   │  → Merge into existing "A" marker                                   │   │
│   │  → Animal results relinked                                          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   3c. REJECT - Delete from queue                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  Invalid/garbage data → Remove                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Network & Marketplace Sharing

Genetic results can be shared with network breeders and on marketplace listings.

### Visibility Controls

Each genetic result has two visibility flags:

| Flag | Purpose | Where Shown |
|------|---------|-------------|
| `networkVisible` | Share with trusted network breeders | Network animal views |
| `marketplaceVisible` | Show on public marketplace listings | Marketplace animal cards |

### Setting Visibility

```typescript
// Update single result
api.genetics.animals.updateVisibility(animalId, resultId, {
  networkVisible: true,
  marketplaceVisible: false
});

// Bulk update
api.genetics.animals.bulkUpdateVisibility(animalId, resultIds, {
  networkVisible: true,
  marketplaceVisible: true
});
```

### Display Components

**GeneticsDisplay** - Full genetics display with categories
```tsx
<GeneticsDisplay
  results={results}
  mode="full"           // "full" | "compact"
  highlightHealth={true}
  showCategories={true}
/>
```

**GeneticsSummary** - Compact summary badge
```tsx
<GeneticsSummary results={results} showCounts={true} />
```

**GeneticsBadge** - Mini badge for cards
```tsx
<GeneticsBadge results={results} />
```

---

## Database Schema

### Tables

#### AnimalGenetics (Extended Profile Data)

```prisma
model AnimalGenetics {
  id                     Int       @id @default(autoincrement())
  animalId               Int       @unique
  animal                 Animal    @relation(fields: [animalId], references: [id])

  // Test metadata
  testProvider           String?   @db.VarChar(100)
  testDate               DateTime?
  testId                 String?   @db.VarChar(100)

  // Trait data (JSON arrays of results)
  coatColorData          Json?     @db.JsonB
  healthData             Json?     @db.JsonB
  coatTypeData           Json?     @db.JsonB
  physicalTraitsData     Json?     @db.JsonB
  eyeColorData           Json?     @db.JsonB
  otherTraitsData        Json?     @db.JsonB

  // Extended Embark data
  breedComposition       Json?     @db.JsonB  // BreedCompositionEntry[]
  coi                    Json?     @db.JsonB  // COIData
  mhcDiversity           Json?     @db.JsonB  // MHCDiversity
  lineage                Json?     @db.JsonB  // GeneticLineage
  predictedAdultWeight   Json?     @db.JsonB  // { value, unit }
  lifeStage              String?   @db.VarChar(100)

  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

#### GeneticMarker (Master Registry)

```prisma
model GeneticMarker {
  id              Int       @id @default(autoincrement())
  species         String    @db.VarChar(50)
  category        String    @db.VarChar(50)

  code            String    @db.VarChar(50)
  commonName      String    @db.VarChar(255)
  scientificName  String?   @db.VarChar(255)
  gene            String?   @db.VarChar(100)
  aliases         String[]

  description     String    @db.Text
  breedSpecific   String[]
  isCommon        Boolean   @default(false)

  inputType       String    @db.VarChar(50)
  allowedValues   String[]

  pendingReview   Boolean   @default(false)
  source          String    @db.VarChar(100)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  results         AnimalGeneticResult[]
}
```

#### AnimalGeneticResult (Individual Results)

```prisma
model AnimalGeneticResult {
  id          Int       @id @default(autoincrement())
  animalId    Int
  markerId    Int

  allele1     String?   @db.VarChar(50)
  allele2     String?   @db.VarChar(50)
  status      String?   @db.VarChar(50)
  rawValue    String?   @db.VarChar(255)
  genotype    String?   @db.VarChar(100)

  testProvider String?  @db.VarChar(100)
  testDate    DateTime?
  documentId  Int?

  networkVisible      Boolean @default(false)
  marketplaceVisible  Boolean @default(false)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  animal      Animal    @relation(fields: [animalId], references: [id])
  marker      GeneticMarker @relation(fields: [markerId], references: [id])
}
```

---

## API Reference

### Markers API

```typescript
// List markers with filtering
api.genetics.markers.list({
  species: "DOG",
  category: "health",
  search: "mdr1",
  isCommon: true,
  limit: 50,
  offset: 0
});

// Get single marker
api.genetics.markers.get(markerId);

// Search markers
api.genetics.markers.search("degenerative", "DOG");

// Get common markers for species
api.genetics.markers.getCommon("DOG");

// Get breed-specific markers
api.genetics.markers.getBreedSpecific("DOG", ["Australian Shepherd"]);

// Admin: Get pending review
api.genetics.markers.getPendingReview({ limit: 100 });

// Admin: Approve marker
api.genetics.markers.approve(markerId, { category: "health" });

// Admin: Reject marker
api.genetics.markers.reject(markerId);

// Admin: Merge markers
api.genetics.markers.merge(pendingId, targetId);
```

### Animal Genetics API

```typescript
// Get full profile
api.genetics.animals.getProfile(animalId);

// Get results only
api.genetics.animals.getResults(animalId);

// Add single result
api.genetics.animals.addResult(animalId, {
  markerId: 123,
  allele1: "E",
  allele2: "e",
  testProvider: "Embark"
});

// Add multiple results
api.genetics.animals.addResults(animalId, [
  { markerId: 1, allele1: "E", allele2: "e" },
  { markerId: 2, status: "clear" }
]);

// Update result
api.genetics.animals.updateResult(animalId, resultId, {
  status: "carrier"
});

// Delete result
api.genetics.animals.deleteResult(animalId, resultId);

// Import from lab
api.genetics.animals.import(animalId, "embark", fileContent, "replace");

// Preview import (without saving)
api.genetics.animals.previewImport(animalId, "embark", fileContent);

// Update visibility
api.genetics.animals.updateVisibility(animalId, resultId, {
  networkVisible: true,
  marketplaceVisible: true
});

// Bulk update visibility
api.genetics.animals.bulkUpdateVisibility(animalId, [1, 2, 3], {
  networkVisible: true
});
```

---

## Related Documentation

- [Embark Import Guide](./EMBARK-IMPORT-GUIDE.md) - Detailed Embark CSV import instructions
- [Seed Data: Genetics Lab Testing](../runbooks/SEED_DATA_GENETICS_LAB.md) - Test data for genetics features

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 2.0 | Extended Embark import (COI, MHC, lineage, weight), comprehensive documentation |
| 2025-xx-xx | 1.0 | Initial genetics system with health and trait tracking |
