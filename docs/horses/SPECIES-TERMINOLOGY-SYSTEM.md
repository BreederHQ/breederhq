# Species Terminology System (STS) - Implementation Summary

**Date:** January 14, 2026
**Status:** Phase 1 Complete (Foundation)
**Implementation Plan:** [See full plan](C:\Users\Aaron\.claude\plans\reactive-beaming-music.md)

---

## Overview

The Species Terminology System (STS) is a comprehensive terminology normalization layer that provides species-appropriate UI language for ALL 11 supported species in the BreederHQ platform.

**Problem Solved:** The UI was using dog/cat-centric terminology ("whelping", "litter", "puppies") for all species, making it feel wrong for horse breeders, goat breeders, etc.

**Solution:** Data-driven terminology system that automatically adapts UI text based on species.

---

## What It Does

### Terminology Normalization

Converts generic breeding terms into species-specific language:

| Generic Term | DOG | HORSE | RABBIT | GOAT | CATTLE |
|--------------|-----|-------|--------|------|--------|
| Offspring | puppy | foal | kit | kid | calf |
| Birth Process | whelping | foaling | kindling | kidding | calving |
| Group Concept | litter | birth record | litter | kidding | birth record |
| Female Parent | dam | mare | doe | doe | cow |
| Male Parent | sire | stallion | buck | buck | bull |

### Feature Flags

Conditionally shows/hides features based on species characteristics:

| Feature | DOG | HORSE | RABBIT | CATTLE |
|---------|-----|-------|--------|--------|
| Collar System | ✓ Yes | ✗ No | ✓ Yes | ✗ No |
| Emphasize Counts | ✓ Yes | ✗ No | ✓ Yes | ✗ No |
| Group Concept | ✓ Yes | ✗ No | ✓ Yes | ✗ No |
| Litter Waitlist | ✓ Yes | ✗ No | ✓ Yes | ✗ No |

**Logic:**
- **Collars:** Needed for litter species to identify individuals (not needed for horses with 1 foal)
- **Counts:** Emphasized for litters (6 puppies), de-emphasized for singles (1 foal)
- **Group Concept:** Litter-centric vs individual-centric mindset
- **Waitlist:** Pick from litter vs direct purchase model

---

## Supported Species (11 Total)

1. **DOG** - puppy/puppies, whelping, litter, dam/sire
2. **CAT** - kitten/kittens, birthing, litter, dam/sire
3. **HORSE** - foal/foals, foaling, birth record, mare/stallion
4. **RABBIT** - kit/kits, kindling, litter, doe/buck
5. **GOAT** - kid/kids, kidding, kidding, doe/buck
6. **SHEEP** - lamb/lambs, lambing, lambing, ewe/ram
7. **PIG** - piglet/piglets, farrowing, litter, sow/boar
8. **CATTLE** - calf/calves, calving, birth record, cow/bull
9. **CHICKEN** - chick/chicks, hatching, clutch, hen/rooster
10. **ALPACA** - cria/crias (pronounced CREE-ah), birthing, birth record, dam/sire
11. **LLAMA** - cria/crias (pronounced CREE-ah), birthing, birth record, dam/sire

---

## Implementation Details

### Files Created

**Core Utilities:**
- `packages/ui/src/utils/speciesTerminology.ts` (650 lines)
  - Complete terminology mappings for all 11 species
  - Utility functions: `getSpeciesTerminology()`, `getOffspringName()`, etc.
  - Feature flag functions: `speciesUsesCollars()`, `speciesEmphasizesCounts()`, etc.

**React Hook:**
- `packages/ui/src/hooks/useSpeciesTerminology.ts` (130 lines)
  - React hook: `useSpeciesTerminology(species)`
  - Returns terminology object with convenience methods
  - Memoized for performance

**Tests:**
- `packages/ui/src/utils/speciesTerminology.test.ts` (38 tests)
  - ✅ All tests passing
  - Coverage: all species, all utility functions, all feature flags
  - Edge cases: null/undefined/unknown species, case variations

**Exports:**
- Added to `packages/ui/src/utils/index.ts`
- Added to `packages/ui/src/hooks/index.ts`
- Available via `@bhq/ui` package

---

## Usage Examples

### Basic Hook Usage

```tsx
import { useSpeciesTerminology } from '@bhq/ui';

function OffspringCard({ offspringGroup }) {
  const terms = useSpeciesTerminology(offspringGroup.species);

  return (
    <div>
      <h3>{terms.group.inCare}</h3>
      {/* Shows "Litters in Care" for dogs, "Foals in Care" for horses */}

      <p>{terms.birthProcess(true)} date: {offspringGroup.birthDate}</p>
      {/* Shows "Whelping date" for dogs, "Foaling date" for horses */}

      <p>{terms.offspringNameCap()} available: {offspringGroup.countAvailable}</p>
      {/* Shows "Puppies available" for dogs, "Foals available" for horses */}

      {terms.features.useCollars && <CollarPicker />}
      {/* Only shows collar picker for dogs/cats/rabbits, hidden for horses */}
    </div>
  );
}
```

### Utility Function Usage

```tsx
import { getOffspringName, getBirthProcess, speciesUsesCollars } from '@bhq/ui';

// Get offspring name
const offspringName = getOffspringName('HORSE', false); // "foal"
const offspringPlural = getOffspringName('DOG', true);   // "puppies"

// Get birth process
const birthProcess = getBirthProcess('HORSE', true); // "Foaling"
const birthVerb = getBirthVerb('DOG', false);        // "whelped"

// Check feature flags
const showCollars = speciesUsesCollars('HORSE');  // false
const showCounts = speciesEmphasizesCounts('DOG'); // true
```

### Parent Terminology

```tsx
function BreedingPlanCard({ plan }) {
  const terms = useSpeciesTerminology(plan.species);

  return (
    <div>
      <h2>{terms.parentName(true, true)}: {plan.dam?.name}</h2>
      {/* Shows "Dam: Bella" for dogs, "Mare: Bella" for horses */}

      <h2>{terms.parentName(false, true)}: {plan.sire?.name}</h2>
      {/* Shows "Sire: Max" for dogs, "Stallion: Thunder" for horses */}
    </div>
  );
}
```

---

## Phase 1 Completion Status

### ✅ Completed

1. **Core Utilities Created**
   - All 11 species terminology mappings complete
   - All utility functions implemented
   - All feature flags implemented

2. **React Hook Created**
   - `useSpeciesTerminology()` hook with convenience methods
   - Memoized for performance
   - Type-safe with full TypeScript support

3. **Exports Added**
   - Available in `@bhq/ui` package
   - Properly exported from utils and hooks

4. **Unit Tests Written**
   - 38 tests, all passing
   - Coverage: all species, all functions, all edge cases
   - Test execution time: 10ms

5. **Build Verification**
   - Package builds successfully (ESM + CJS)
   - No breaking changes to existing code
   - Backward compatible with existing `geneticsSimpleMode.ts`

### 📊 Test Results

```
✓ src/utils/speciesTerminology.test.ts (38 tests) 10ms

 Test Files  1 passed (1)
      Tests  38 passed (38)
   Duration  458ms
```

### 🔄 Backward Compatibility

The existing `apps/breeding/src/utils/geneticsSimpleMode.ts` `getOffspringName()` function remains unchanged and continues to work. Our new system is additive and does not break existing functionality.

---

## Next Steps (Phase 2)

### High-Impact Component Updates

Now that the foundation is in place, the next phase is to update UI components to use the new terminology system:

**Priority Order:**

1. **OffspringGroupCards.tsx** (`apps/platform/src/components/dashboard/`)
   - Replace "Offspring in Care" with `terms.group.inCare`
   - Hide collar references when `!terms.features.useCollars`

2. **BreedingPipeline.tsx** (`apps/platform/src/components/dashboard/`)
   - Replace "Offspring Care" stage with `terms.care.stage`

3. **WhelpingCollarsSettingsTab.tsx** (`apps/platform/src/components/`)
   - Conditionally render: `if (!terms.features.useCollars) return null`
   - Update labels to be species-aware

4. **CollarPicker.tsx** (`apps/offspring/src/components/`)
   - Hide for horses: `if (!terms.features.useCollars) return null`

5. **App-Offspring.tsx** (`apps/offspring/src/`)
   - Update page titles
   - Update count labels

---

## API Reference

### `getSpeciesTerminology(species)`

Returns complete terminology object for a species.

**Parameters:**
- `species: string | null | undefined` - Species code (DOG, CAT, HORSE, etc.) - case insensitive

**Returns:** `SpeciesTerminology` object containing:
- `offspring`: { singular, plural, singularCap, pluralCap }
- `birth`: { process, processCap, verb, verbCap, dateLabel }
- `group`: { singular, plural, singularCap, pluralCap, inCare }
- `parents`: { female, male, femaleCap, maleCap }
- `care`: { stage, inCareLabel }
- `features`: { useCollars, emphasizeCounts, showGroupConcept, usesLitterWaitlist }

### `useSpeciesTerminology(species)`

React hook version with convenience methods.

**Parameters:**
- `species: string | null | undefined` - Species code

**Returns:** `UseSpeciesTerminologyReturn` with:
- All fields from `SpeciesTerminology`
- Convenience methods:
  - `offspringName(plural?: boolean)`
  - `offspringNameCap(plural?: boolean)`
  - `birthProcess(capitalize?: boolean)`
  - `birthVerb(capitalize?: boolean)`
  - `groupName(plural?: boolean, capitalize?: boolean)`
  - `parentName(isFemale: boolean, capitalize?: boolean)`

### Utility Functions

- `getOffspringName(species, plural?)` - Get offspring name
- `getOffspringNameCap(species, plural?)` - Get capitalized offspring name
- `getBirthProcess(species, capitalize?)` - Get birth process term
- `getBirthVerb(species, capitalize?)` - Get birth verb (past tense)
- `getGroupName(species, plural?, capitalize?)` - Get group/litter term
- `getParentName(species, isFemale, capitalize?)` - Get parent term

### Feature Flag Functions

- `speciesUsesCollars(species)` - Check if species uses collar system
- `speciesEmphasizesCounts(species)` - Check if species emphasizes count fields
- `speciesShowsGroupConcept(species)` - Check if species emphasizes group concept
- `speciesUsesLitterWaitlist(species)` - Check if species uses litter waitlist

---

## Design Decisions

### 1. Why React Hook + Utility Functions?

- **Hook:** Idiomatic React pattern, memoized for performance, convenient in components
- **Utilities:** Portable, no React dependency, easier to test, usable in non-React contexts

### 2. Why Feature Flags in Terminology Object?

- Single source of truth for species capabilities
- Components don't need separate imports for feature detection
- Centralized species logic

### 3. Why Not Modify Database?

- Database model is already species-agnostic (see [BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md](./BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md))
- Presentation layer problem, not data model problem
- Faster to ship, less risk

### 4. Why Default to DOG?

- Most common species in platform
- Graceful fallback for unknown species
- Matches existing behavior

---

## Success Criteria (Phase 1)

- [x] All 11 species have complete terminology mappings
- [x] React hook created and exported
- [x] Utility functions created and exported
- [x] All unit tests passing (38/38)
- [x] Package builds successfully
- [x] No breaking changes to existing code
- [x] Backward compatible with `geneticsSimpleMode.ts`

---

## Related Documentation

- [Horse Breeding Database Model Compatibility Analysis](./BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md)
- [Implementation Plan (Full)](C:\Users\Aaron\.claude\plans\reactive-beaming-music.md)

---

**Status:** ✅ Phase 1 Complete - Foundation ready for component integration
**Next:** Phase 2 - High-impact component updates
**Estimated Effort for Phase 2:** 8 hours
