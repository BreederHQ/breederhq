# Seed Data: Genetics Lab Testing Guide

This document describes the seed data systems used to populate test environments with animals that exercise all Genetics Lab features.

## Overview

There are **two seed systems** that create animals with genetic data:

| System | Location | Purpose | Tenants |
|--------|----------|---------|---------|
| **Validation Tenants** | `breederhq-api/scripts/seed-validation-tenants/` | Multi-tenant dev/prod testing | Middle Earth, Hogwarts, Westeros, Marvel (dev) / Dune, Star Trek, Ted Lasso, Matrix (prod) |
| **Genetics Test Animals** | `breederhq-api/prisma/seed/seed-genetics-test-animals.ts` | E2E tests & Luke Skywalker tenant | Luke Skywalker's tenant only |

Both systems should follow the same naming conventions and ensure comprehensive Genetics Lab coverage.

---

## Animal Naming Convention

Animals should be named with descriptive suffixes so users can easily identify their genetic significance in Genetics Lab dropdowns.

### Format

```
{ThematicName} ({GeneticsDescriptor})
```

### Descriptor Priority (use the most significant)

1. **Dangerous Pairing Carriers** (highest priority)
   - `(Merle Carrier Female)` - Dogs
   - `(Merle Carrier Male)` - Dogs
   - `(LWO Carrier Mare)` - Horses (Lethal White Overo)
   - `(LWO Carrier Stallion)` - Horses
   - `(Charlie Carrier)` - Rabbits
   - `(Scottish Fold Carrier)` - Cats
   - `(LP Carrier Mare)` - Horses (Appaloosa/Leopard Complex)
   - `(LP Carrier Stallion)` - Horses
   - `(Polled Carrier)` - Goats
   - `(Blood Type B Female)` - Cats

2. **COI/Pedigree Role**
   - `(Foundation Sire)` - Root male in COI tree
   - `(Foundation Dam)` - Root female in COI tree
   - `(Inbred Male)` - Result of close breeding
   - `(Inbred Female)` - Result of close breeding

3. **Incomplete Genetics**
   - `(Incomplete Genetics)` - Missing most genetic data
   - `(Partial Panel)` - Some genetic tests done
   - `(Awaiting Test)` - New animal, no tests yet

4. **Clear/Normal Status**
   - `(Merle Clear Female)` - Non-carrier, safe for any pairing
   - `(Scottish Straight)` - Non-fold carrier cat
   - `(LP Clear Mare)` - Non-LP carrier horse

5. **Breed/Trait Descriptors** (lowest priority)
   - `(Brindle Male)` - Color pattern
   - `(Dilute Female)` - Dilution gene present

---

## Genetics Lab Features & Required Test Data

### 1. Punnett Square Calculator
Requires animals with known genotypes at various loci.

**Test scenarios:**
- Heterozygous x Heterozygous (e.g., Bb x Bb)
- Homozygous x Heterozygous (e.g., BB x Bb)
- Multiple loci combinations

### 2. Offspring Probability Simulator
Uses same data as Punnett Square but shows probability distributions.

### 3. Health Risk Assessment
Requires animals with health-related genetic markers.

**Loci to populate:**
- `DM` - Degenerative Myelopathy
- `PRA` - Progressive Retinal Atrophy
- `VWD` - Von Willebrand Disease
- `MDR1` - Multi-Drug Resistance
- `HCM` - Hypertrophic Cardiomyopathy (cats)

### 4. COI Calculator (Coefficient of Inbreeding)
Requires multi-generational pedigree data.

**Star Wars COI Family Tree (in seed-genetics-test-animals.ts):**
```
                    ┌── Anakin (Foundation Sire)
        ┌── Luke ───┤
        │           └── Padme (Foundation Dam)
Kylo ───┤
        │           ┌── Han
        └── Leia ───┤
                    └── Padme (shared ancestor = COI)
```

### 5. What's Missing Analysis
Requires animals with **incomplete** genetic profiles.

**Test animals needed:**
- Animal with zero genetic data
- Animal with partial panel (some loci tested)
- Animal with complete panel (for comparison)

### 6. Best Match Finder
Requires multiple animals of same species/sex to compare compatibility.

### 7. Dangerous Pairing Warnings
**Critical: All 7 warning types must be testable**

| Warning | Species | Trigger | Required Animals |
|---------|---------|---------|------------------|
| **Double Merle** | Dog | M/m x M/m | 2 Merle carriers |
| **Lethal White Overo** | Horse | O/o x O/o | 2 LWO carriers |
| **Charlie (Lethal)** | Rabbit | En/en x En/en | 2 Charlie carriers |
| **Polled x Polled** | Goat | P/p x P/p | 2 Polled carriers |
| **Double Fold** | Cat | Fd/fd x Fd/fd | 2 Scottish Fold carriers |
| **Double LP** | Horse | LP/lp x LP/lp | 2 Appaloosa LP carriers |
| **Blood Type Incompatibility** | Cat | Type B queen x Type A/AB tom | Blood-typed cats |

---

## Species-Specific Seed Data

### Dogs (Most Complete)
```typescript
// Merle carriers for Double Merle warning
{ name: "Shadow (Merle Carrier Male)", sex: "MALE", genetics: [locus("M", "M", "m")] }
{ name: "Luna (Merle Carrier Female)", sex: "FEMALE", genetics: [locus("M", "M", "m")] }

// Incomplete genetics for "What's Missing"
{ name: "Mystery Mutt (Incomplete Genetics)", genetics: [] }
{ name: "Rescue Rover (Partial Panel)", genetics: [locus("E", "E", "e")] }
```

### Horses
```typescript
// LWO carriers for Lethal White warning
{ name: "Spirit (LWO Carrier Stallion)", sex: "MALE", genetics: [locus("O", "O", "o")] }
{ name: "Storm (LWO Carrier Mare)", sex: "FEMALE", genetics: [locus("O", "O", "o")] }

// LP carriers for Double LP warning
{ name: "Spots Galore (LP Carrier Mare)", sex: "FEMALE", genetics: [locus("LP", "LP", "lp")] }
{ name: "Appaloosa King (LP Carrier Stallion)", sex: "MALE", genetics: [locus("LP", "LP", "lp")] }
```

### Cats
```typescript
// Scottish Fold carriers for Double Fold warning
{ name: "Nessie (Scottish Fold Carrier)", sex: "FEMALE", genetics: [locus("Fd", "Fd", "fd")] }
{ name: "Haggis (Scottish Fold Male)", sex: "MALE", genetics: [locus("Fd", "Fd", "fd")] }

// Blood type for incompatibility warning
{ name: "Duchess (Blood Type B Female)", sex: "FEMALE", genetics: [locus("BLOODTYPE", "b", "b")] }
{ name: "Duke (Blood Type A Male)", sex: "MALE", genetics: [locus("BLOODTYPE", "A", "b")] }
```

### Rabbits
```typescript
// Charlie carriers for lethal warning
{ name: "Patches (Charlie Carrier)", sex: "MALE", genetics: [locus("En", "En", "en")] }
{ name: "Spot (Charlie Carrier)", sex: "FEMALE", genetics: [locus("En", "En", "en")] }
```

### Goats
```typescript
// Polled carriers for Polled x Polled warning
{ name: "Billy (Polled Carrier)", sex: "MALE", genetics: [locus("P", "P", "p")] }
{ name: "Nanny (Polled Carrier)", sex: "FEMALE", genetics: [locus("P", "P", "p")] }
```

---

## Helper Functions

Both seed files use these helper functions for consistency:

```typescript
// Standard genetic locus
function locus(name: string, allele1: string, allele2: string) {
  return { locusName: name, allele1, allele2 };
}

// Health-related locus with status
function healthLocus(name: string, status: "CLEAR" | "CARRIER" | "AFFECTED") {
  const alleles = {
    CLEAR: ["N", "N"],
    CARRIER: ["N", "m"],
    AFFECTED: ["m", "m"],
  };
  return { locusName: name, allele1: alleles[status][0], allele2: alleles[status][1] };
}
```

---

## Quick Reference: Minimum Viable Test Set

For each tenant, ensure at minimum:

| Species | Count | Must Include |
|---------|-------|--------------|
| Dog | 6+ | 2 Merle carriers, 1 incomplete genetics, 1 full panel |
| Cat | 4+ | 2 Fold carriers, 1 Type B female, 1 Type A male |
| Horse | 6+ | 2 LWO carriers, 2 LP carriers |
| Rabbit | 4+ | 2 Charlie carriers |
| Goat | 4+ | 2 Polled carriers |

**Total minimum: 24 animals per tenant with genetics**

---

## Running the Seed Scripts

### Validation Tenants (dev/prod environments)
```bash
cd breederhq-api
npx ts-node scripts/seed-validation-tenants/seed-validation-tenants.ts
```

### Genetics Test Animals (E2E/Luke's tenant)
```bash
cd breederhq-api
npx prisma db seed
# or specifically:
npx ts-node prisma/seed/seed-genetics-test-animals.ts
```

---

## Verification Checklist

After seeding, verify in the Genetics Lab UI:

- [ ] Punnett Square shows predictions for heterozygous pairings
- [ ] Health Risk Assessment displays carrier warnings
- [ ] COI Calculator shows non-zero COI for inbred animals
- [ ] What's Missing identifies gaps in incomplete animals
- [ ] Double Merle warning appears for Merle x Merle (dogs)
- [ ] Lethal White warning appears for LWO x LWO (horses)
- [ ] Charlie warning appears for En x En (rabbits)
- [ ] Polled x Polled warning appears (goats)
- [ ] Double Fold warning appears for Fd x Fd (cats)
- [ ] Double LP warning appears for LP x LP (horses)
- [ ] Blood Type warning appears for Type B x Type A (cats)

---

## Related Files

- [seed-data-config.ts](../../breederhq-api/scripts/seed-validation-tenants/seed-data-config.ts) - Animal definitions
- [seed-validation-tenants.ts](../../breederhq-api/scripts/seed-validation-tenants/seed-validation-tenants.ts) - Orchestrator
- [seed-genetics-test-animals.ts](../../breederhq-api/prisma/seed/seed-genetics-test-animals.ts) - E2E test animals
