# Embark DNA Import Guide

> **Part of the [BreederHQ Genetics System](./GENETICS-SYSTEM.md)**

This document covers importing Embark DNA test results into BreederHQ. For the complete genetics system documentation, see the main [Genetics System Guide](./GENETICS-SYSTEM.md).

## Overview

BreederHQ's Embark import goes beyond what Embark displays on their own website, extracting **all** available data from their export files and presenting it in a breeder-friendly format integrated with our breeding tools.

## What Gets Imported

### Genetic Markers (200+)

| Category | Examples | Used In |
|----------|----------|---------|
| **Health Tests** | MDR1, DM, PRA, vWD, EIC, DCM, HUU, CEA, etc. | Health clearances, Breeding Lab risk analysis |
| **Coat Color** | E, K, A, B, D, M, S, H, Em loci | Color predictions, Punnett squares |
| **Coat Type** | Furnishings (F), Coat Length (L), Curly (Cu), Shedding | Trait predictions |
| **Physical Traits** | Body Size (IGF1), Bobtail (BT), Dewclaws | Physical predictions |
| **Eye Color** | Blue Eyes, ALX4 | Eye color predictions |

### Extended Data (Unique to BreederHQ)

| Data | Description | Where Displayed |
|------|-------------|-----------------|
| **Breed Composition** | DNA-based breed percentages | Animal Profile, Genetics Tab |
| **COI (Coefficient of Inbreeding)** | Genetic diversity measure with risk level | Genetics Tab, Breeding Pairing |
| **MHC Diversity** | DLA-DRB1 and DQA1/DQB1 allele counts | Genetics Tab |
| **Lineage Haplotypes** | Maternal (MT) and Paternal (Y) lineage | Genetics Tab |
| **Predicted Adult Weight** | DNA-based weight prediction | Genetics Tab |
| **Life Stage** | Dog's life stage at time of testing | Genetics Tab |

## How to Export from Embark

### Step-by-Step Instructions

1. Log into your Embark account at **embarkvet.com**
2. Navigate to your dog's results page
3. Scroll down to **"Print or Download Results"**
4. Click **"Raw Data"**
5. Scroll past the TPED/TFAM section to **"Machine-readable results file"**
6. Click **"Download as CSV"** or **"Download as TSV"**

### Important Notes

- **DO download**: The CSV or TSV file (Machine-readable results)
- **DON'T download**: The "Raw DNA" zip file (TPED/TFAM) - this contains uninterpreted genetic markers for research use only

The CSV/TSV file contains all interpreted results. The TPED/TFAM files contain 216,000+ raw SNP markers that require specialized bioinformatics software to interpret.

## Import Process in BreederHQ

### 1. Access the Import Dialog

- Open an animal's profile
- Go to the **Genetics** tab
- Click **"Import from Lab"** button

### 2. Select Provider

- Choose **Embark** from the provider list
- You'll see a summary of what will be imported

### 3. Upload File

- Drag and drop or browse to select your CSV/TSV file
- Click **"Preview Import"**

### 4. Review Preview

The preview shows:
- **Breed Composition** - Visual percentage bars
- **COI** - Percentage with risk level (Excellent/Good/Moderate/High/Critical)
- **Predicted Weight** - In lbs or kg
- **MHC Diversity** - Allele counts
- **Lineage** - Maternal and paternal haplotypes
- **Genetic Markers** - Grouped by category with counts

### 5. Choose Import Strategy

- **Replace existing data** - Overwrites current genetics data
- **Merge with existing data** - Adds new data, keeps existing entries

### 6. Complete Import

Click "Import" to save all data to the animal's profile.

## Data Display Locations

### Animal Profile - Genetics Tab

#### Genetic Diversity Section
```
┌─────────────────────────────────────────────────────────────┐
│ 🧬 Genetic Diversity                                        │
├────────────────────────────┬────────────────────────────────┤
│ Inbreeding Coefficient     │ Immune Diversity (MHC Class II)│
│ ────────────────────────── │ ────────────────────────────── │
│ 0.18%                      │ DLA-DRB1: 2 alleles            │
│ ████░░░░░░░░░░░░░░░░ Excellent │ DLA-DQA1/DQB1: 2 alleles   │
│ via embark                 │                                │
└────────────────────────────┴────────────────────────────────┘
```

#### Lineage Section
```
┌─────────────────────────────────────────────────────────────┐
│ 🌳 Lineage / Haplotypes                                     │
├────────────────────────────┬────────────────────────────────┤
│ Maternal (Mitochondrial)   │ Paternal (Y-Chromosome)        │
│ A228_MT                    │ H1a.23                         │
│ Haplogroup: A1e_MT         │ Haplogroup: H1a                │
└────────────────────────────┴────────────────────────────────┘
```

#### Predicted Weight Section
```
┌─────────────────────────────────────────────────────────────┐
│ ⚖️ Predicted Adult Weight                                   │
│ 57.4 lbs                                                    │
│ Life stage at test: Mature adult                            │
└─────────────────────────────────────────────────────────────┘
```

### Breeding Module - Genetics Lab

COI data is automatically used in:
- **Pairing Compatibility** calculations
- **Best Match Finder** recommendations
- **Health Risk Analysis**

## COI Risk Levels

| COI Percentage | Risk Level | Color | Interpretation |
|----------------|------------|-------|----------------|
| < 5% | Excellent | Green | Very low inbreeding |
| 5-10% | Good | Light Green | Acceptable range |
| 10-15% | Moderate | Yellow | Consider outcrossing |
| 15-25% | High | Orange | Elevated health risks |
| > 25% | Critical | Red | Significant inbreeding depression risk |

## MHC Diversity Interpretation

The Major Histocompatibility Complex (MHC) affects immune system diversity:

| Allele Count | Interpretation |
|--------------|----------------|
| 2 alleles | Heterozygous - good diversity |
| 1 allele | Homozygous - reduced diversity |

Higher MHC diversity generally correlates with better immune function and disease resistance.

## Technical Details

### Embark CSV Format

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
"Lineage","MT Haplogroup","A1e_MT"
"Health","MDR1 Drug Sensitivity (ABCB1)","clear"
"Health","Coefficient Of Inbreeding","0.00178111"
"Health","MHC Class II - DLA DRB1","2"
"Trait","E Locus (MC1R)","Ee"
...
```

### Database Schema

The imported data is stored in the `AnimalGenetics` table:

| Field | Type | Description |
|-------|------|-------------|
| `breedComposition` | JSONB | Array of { breed, percentage } |
| `coi` | JSONB | { coefficient, percentage, riskLevel, source } |
| `mhcDiversity` | JSONB | { drb1Alleles, dqa1Dqb1Alleles, diversityScore } |
| `lineage` | JSONB | { mtHaplotype, mtHaplogroup, yHaplotype, yHaplogroup } |
| `predictedAdultWeight` | JSONB | { value, unit } |
| `lifeStage` | VARCHAR(100) | e.g., "Mature adult" |

### API Types

See `packages/api/src/types/genetics.ts` for TypeScript interfaces:
- `COIData`
- `MHCDiversity`
- `GeneticLineage`
- `BreedCompositionEntry`
- `AnimalGeneticProfile`

## Comparison: BreederHQ vs Embark Website

| Feature | Embark Website | BreederHQ |
|---------|---------------|-----------|
| Health results | ✅ | ✅ |
| Trait results | ✅ | ✅ |
| Breed composition | ✅ | ✅ |
| COI display | Number only | ✅ With risk level & visual |
| MHC diversity | Buried in results | ✅ Highlighted |
| Lineage | ✅ | ✅ |
| Breeding pairing analysis | ❌ | ✅ Integrated with Genetics Lab |
| Cross-animal comparison | ❌ | ✅ Best Match Finder |
| Pedigree COI calculation | ❌ | ✅ |
| Network sharing | ❌ | ✅ Share with trusted breeders |

## Admin Features

### Genetic Markers Management

When the import encounters an unrecognized genetic marker:
1. The marker is flagged for **admin review**
2. Admins can **approve**, **reject**, or **merge** the marker
3. Approved markers are added to the master registry

Access: Platform Settings → Genetics Admin Tab

## Troubleshooting

### Common Issues

**"No recognized genetic markers found"**
- Ensure you downloaded the CSV/TSV file, not the TPED/TFAM zip
- Verify the file is from Embark (not another provider)

**Missing breed composition**
- Check if the Embark results include breed data (some tests don't)

**COI shows as "Not recorded"**
- Some older Embark tests may not include COI
- Can be calculated separately using pedigree data

## Related Documentation

- **[Genetics System Guide](./GENETICS-SYSTEM.md)** - Complete genetics system documentation
- [Seed Data: Genetics Lab Testing](../runbooks/SEED_DATA_GENETICS_LAB.md) - Test data for genetics features

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 2.0 | Added COI, MHC, lineage, weight import |
| 2025-xx-xx | 1.0 | Initial health and trait import |
