# Species Terminology System

## Overview

The Species Terminology System (STS) provides consistent, species-appropriate language throughout the breeding module. Rather than hardcoding species-specific logic, the system uses a configuration-driven approach.

**Location:** `packages/ui/src/utils/speciesTerminology.ts`

## Supported Species

| Species Code | Common Name | Status |
|--------------|-------------|--------|
| `DOG` | Dog | Full support |
| `CAT` | Cat | Full support |
| `HORSE` | Horse | Full support + Foaling system |
| `GOAT` | Goat | Full support |
| `SHEEP` | Sheep | Full support |
| `RABBIT` | Rabbit | Full support |
| `PIG` | Pig | Full support |
| `CATTLE` | Cattle | Full support |
| `CHICKEN` | Chicken | Full support (egg layer model) |
| `ALPACA` | Alpaca | Full support (induced ovulator) |
| `LLAMA` | Llama | Full support (induced ovulator) |

## Terminology Dimensions

### Offspring Terms

| Species | Singular | Plural | Example Usage |
|---------|----------|--------|---------------|
| DOG | puppy | puppies | "1 puppy born" |
| CAT | kitten | kittens | "5 kittens in litter" |
| HORSE | foal | foals | "Foal is nursing" |
| GOAT | kid | kids | "3 kids expected" |
| SHEEP | lamb | lambs | "Lambs are healthy" |
| RABBIT | kit | kits | "Kit count: 8" |
| PIG | piglet | piglets | "Piglets weaned" |
| CATTLE | calf | calves | "Calf placed" |
| CHICKEN | chick | chicks | "Chicks hatched" |
| ALPACA | cria | crias | "Cria due date" |
| LLAMA | cria | crias | "Cria born" |

### Birth Process Terms

| Species | Process | Past Tense | Date Label |
|---------|---------|------------|------------|
| DOG | whelping | whelped | "Whelping Date" |
| CAT | kitting | kitted | "Kitting Date" |
| HORSE | foaling | foaled | "Foaling Date" |
| GOAT | kidding | kidded | "Kidding Date" |
| SHEEP | lambing | lambed | "Lambing Date" |
| RABBIT | kindling | kindled | "Kindling Date" |
| PIG | farrowing | farrowed | "Farrowing Date" |
| CATTLE | calving | calved | "Calving Date" |
| CHICKEN | hatching | hatched | "Hatch Date" |
| ALPACA | birthing | birthed | "Birth Date" |
| LLAMA | birthing | birthed | "Birth Date" |

### Group/Litter Terms

| Species | Singular | Plural | In Care Label |
|---------|----------|--------|---------------|
| DOG | litter | litters | "Litter in Care" |
| CAT | litter | litters | "Litter in Care" |
| HORSE | birth record | birth records | "Foal in Care" |
| GOAT | kidding | kiddings | "Kidding in Care" |
| SHEEP | lambing | lambings | "Lambing in Care" |
| RABBIT | litter | litters | "Litter in Care" |
| PIG | litter | litters | "Litter in Care" |
| CATTLE | birth record | birth records | "Calf in Care" |
| CHICKEN | clutch | clutches | "Clutch in Care" |
| ALPACA | birth record | birth records | "Cria in Care" |
| LLAMA | birth record | birth records | "Cria in Care" |

### Parent Terms

| Species | Female | Male |
|---------|--------|------|
| DOG | dam | sire |
| CAT | dam | sire |
| HORSE | mare | stallion |
| GOAT | doe | buck |
| SHEEP | ewe | ram |
| RABBIT | doe | buck |
| PIG | sow | boar |
| CATTLE | cow | bull |
| CHICKEN | hen | rooster |
| ALPACA | dam | sire |
| LLAMA | dam | sire |

### Care Stage Labels

| Species | Stage Name | In Care Label |
|---------|------------|---------------|
| DOG | Puppy Care | "Puppies in Care" |
| CAT | Kitten Care | "Kittens in Care" |
| HORSE | Foal Care | "Foals in Care" |
| GOAT | Kid Care | "Kids in Care" |
| SHEEP | Lamb Care | "Lambs in Care" |
| RABBIT | Kit Care | "Kits in Care" |
| PIG | Piglet Care | "Piglets in Care" |
| CATTLE | Calf Care | "Calves in Care" |
| CHICKEN | Chick Care | "Chicks in Care" |
| ALPACA | Cria Care | "Crias in Care" |
| LLAMA | Cria Care | "Crias in Care" |

## Feature Flags

Each species has feature flags that control UI behavior:

```typescript
features: {
  useCollars: boolean,          // Show collar identification UI
  emphasizeCounts: boolean,     // Highlight litter size counts
  showGroupConcept: boolean,    // Show "litters" concept
  usesLitterWaitlist: boolean,  // Buyers pick from litter
}
```

### Flag Values by Species

| Species | useCollars | emphasizeCounts | showGroupConcept | usesLitterWaitlist |
|---------|------------|-----------------|------------------|-------------------|
| DOG | ✓ | ✓ | ✓ | ✓ |
| CAT | ✓ | ✓ | ✓ | ✓ |
| HORSE | ✗ | ✗ | ✗ | ✗ |
| GOAT | ✓ | ✓ | ✓ | ✓ |
| SHEEP | ✓ | ✓ | ✓ | ✓ |
| RABBIT | ✓ | ✓ | ✓ | ✓ |
| PIG | ✓ | ✓ | ✓ | ✓ |
| CATTLE | ✗ | ✗ | ✗ | ✗ |
| CHICKEN | ✗ | ✓ | ✓ | ✗ |
| ALPACA | ✗ | ✗ | ✗ | ✗ |
| LLAMA | ✗ | ✗ | ✗ | ✗ |

### Flag Impact on UI

**useCollars:**
- `true`: Show collar color picker for offspring identification
- `false`: Hide collar-related UI elements

**emphasizeCounts:**
- `true`: Prominent display of countBorn, countLive, countWeaned
- `false`: Minimal count display

**showGroupConcept:**
- `true`: Use "litter" terminology, show litter-based views
- `false`: Use "birth record" terminology, individual focus

**usesLitterWaitlist:**
- `true`: Buyers join waitlist, pick from litter when available
- `false`: Direct buyer-to-offspring assignment

## Cycle & Ovulation Configuration

### Cycle Terminology

| Species | Cycle Start Label | Explanation |
|---------|-------------------|-------------|
| DOG | "heat start" | First day of bleeding/proestrus |
| CAT | "breeding" | No traditional heat cycle |
| HORSE | "cycle start" | First day of estrus behavior |
| RABBIT | "breeding" | No traditional heat cycle |
| GOAT | "cycle start" | First heat signs observed |
| SHEEP | "cycle start" | First heat signs observed |
| PIG | "cycle start" | First standing heat |
| CATTLE | "cycle start" | First standing heat |
| CHICKEN | "set date" | Incubation start |
| ALPACA | "breeding" | No traditional heat cycle |
| LLAMA | "breeding" | No traditional heat cycle |

### Anchor Mode Configuration

```typescript
anchorMode: {
  options: [
    {
      type: "CYCLE_START" | "OVULATION" | "BREEDING_DATE",
      label: string,
      description: string,
      accuracy: string,        // e.g., "±1-2 days"
      recommended: boolean
    }
  ],
  recommended: AnchorType,     // Best option for this species
  defaultAnchor: AnchorType,   // Starting anchor mode
  testingAvailable: boolean,   // Is ovulation testing available?
  testingCommon: boolean,      // Is testing commonly done?
  supportsUpgrade: boolean,    // Can upgrade from CYCLE_START to OVULATION?
  upgradeFrom?: AnchorType,
  upgradeTo?: AnchorType,
  isInducedOvulator: boolean   // Does breeding trigger ovulation?
}
```

### Anchor Mode by Species

| Species | Default | Recommended | Upgrade Path | Induced |
|---------|---------|-------------|--------------|---------|
| DOG | CYCLE_START | OVULATION | ✓ | ✗ |
| CAT | BREEDING_DATE | BREEDING_DATE | ✗ | ✓ |
| HORSE | CYCLE_START | OVULATION | ✓ | ✗ |
| RABBIT | BREEDING_DATE | BREEDING_DATE | ✗ | ✓ |
| GOAT | CYCLE_START | CYCLE_START | ✗ | ✗ |
| SHEEP | CYCLE_START | CYCLE_START | ✗ | ✗ |
| PIG | CYCLE_START | CYCLE_START | ✗ | ✗ |
| CATTLE | CYCLE_START | CYCLE_START | ✗ | ✗ |
| ALPACA | BREEDING_DATE | BREEDING_DATE | ✗ | ✓ |
| LLAMA | BREEDING_DATE | BREEDING_DATE | ✗ | ✓ |

### Ovulation Confirmation Methods

| Species | Available Methods |
|---------|-------------------|
| DOG | PROGESTERONE_TEST, LH_TEST, VAGINAL_CYTOLOGY, AT_HOME_TEST, VETERINARY_EXAM |
| HORSE | ULTRASOUND, PALPATION, VETERINARY_EXAM |
| CAT | BREEDING_INDUCED (automatic) |
| RABBIT | BREEDING_INDUCED (automatic) |
| GOAT | None (no infrastructure) |
| SHEEP | None (no infrastructure) |
| PIG | None (no infrastructure) |
| CATTLE | None (no infrastructure) |
| ALPACA | BREEDING_INDUCED (automatic) |
| LLAMA | BREEDING_INDUCED (automatic) |

## Weaning Configuration

```typescript
weaning: {
  weaningType: "DISTINCT_EVENT" | "GRADUAL_PROCESS",
  required: boolean,             // Is date recording required?
  estimatedDurationWeeks: number,
  guidanceText: string,
  statusLabel: string,           // e.g., "Weaning Complete"
  actualDateLabel: string,       // e.g., "Weaned On"
}
```

### Weaning by Species

| Species | Type | Required | Duration | Notes |
|---------|------|----------|----------|-------|
| DOG | Gradual | ✗ | 6 weeks | Weeks 3-8, stay 10-12 weeks |
| CAT | Gradual | ✗ | 8 weeks | Socialization important |
| HORSE | **Distinct** | **✓** | 20 weeks | Critical milestone |
| GOAT | Gradual | ✗ | 9 weeks | Min 70 days recommended |
| SHEEP | Gradual | ✗ | 8 weeks | 60 days for early weaning |
| RABBIT | Gradual | ✗ | 6 weeks | Max 10 weeks for separation |
| PIG | Gradual | ✗ | 4 weeks | Fast commercial timeline |
| CATTLE | Distinct | ✗ | 24 weeks | 6-8 months typical |
| CHICKEN | Gradual | ✗ | 6 weeks | "Independence" more accurate |
| ALPACA | Distinct | ✗ | 26 weeks | 5-6 months |
| LLAMA | Distinct | ✗ | 26 weeks | 5-6 months |

## Usage in Code

### Getting Terminology

```typescript
import { getSpeciesTerminology } from '@breederhq/ui/utils/speciesTerminology';

const terms = getSpeciesTerminology('DOG');

// Access offspring terms
console.log(terms.offspring.singular);     // "puppy"
console.log(terms.offspring.plural);       // "puppies"

// Access birth process
console.log(terms.birth.process);          // "whelping"
console.log(terms.birth.dateLabel);        // "Whelping Date"

// Access parent terms
console.log(terms.parents.female);         // "dam"
console.log(terms.parents.male);           // "sire"

// Check feature flags
if (terms.features.useCollars) {
  // Show collar picker
}
```

### Dynamic Labels

```typescript
function getLabel(species: Species, key: string): string {
  const terms = getSpeciesTerminology(species);

  // Examples of dynamic label generation
  switch (key) {
    case 'birthDateLabel':
      return terms.birth.dateLabel;              // "Whelping Date" for dogs
    case 'offspringCount':
      return `${terms.offspring.pluralCap} Born`; // "Puppies Born"
    case 'parentFemale':
      return terms.parents.femaleCap;            // "Dam" or "Mare"
    default:
      return key;
  }
}
```

### Conditional UI

```typescript
function OffspringPanel({ species, offspring }) {
  const terms = getSpeciesTerminology(species);

  return (
    <div>
      <h2>{terms.group.singularCap} Details</h2>

      {terms.features.emphasizeCounts && (
        <CountDisplay
          born={offspring.countBorn}
          live={offspring.countLive}
          label={terms.offspring.pluralCap}
        />
      )}

      {terms.features.useCollars && (
        <CollarPicker offspring={offspring.items} />
      )}

      {!terms.features.showGroupConcept && (
        <IndividualView offspring={offspring.items[0]} />
      )}
    </div>
  );
}
```

## Adding a New Species

1. **Add to `speciesTerminology.ts`:**

```typescript
NEW_SPECIES: {
  offspring: {
    singular: "baby",
    plural: "babies",
    singularCap: "Baby",
    pluralCap: "Babies"
  },
  birth: {
    process: "birthing",
    processCap: "Birthing",
    verb: "birthed",
    verbCap: "Birthed",
    dateLabel: "Birth Date"
  },
  // ... complete all sections
}
```

2. **Add to `reproEngine/defaults.ts`:**

```typescript
NEW_SPECIES: {
  cycleLenDays: 21,
  ovulationOffsetDays: 2,
  // ... complete all defaults
}
```

3. **Add to Prisma enum:**

```prisma
enum Species {
  // ... existing
  NEW_SPECIES
}
```

4. **Run migration and test.**

