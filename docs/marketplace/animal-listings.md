# Animal Listings

Documentation for how animals are displayed and categorized on the marketplace.

## V2 Features

### Data Drawer (NEW - 2026-01-16)

The **Data Drawer** allows breeders to customize which animal data appears in their marketplace listings with granular control over health tests, titles, media, and more.

**Key Features:**
- Section-level and item-level data selection
- Privacy-first architecture with three-layer filtering
- Live preview of how data will appear to buyers
- Works with all listing template types

**Documentation:**
- [Complete Guide](../features/marketplace/data-drawer.md)
- [Quick Reference](../features/marketplace/data-drawer-quick-reference.md)

**API Endpoints:**
- `GET /api/v2/marketplace/animals/:id/listing-data` - Fetch eligible data
- `GET /api/v2/marketplace/listings/:slug` - Public listing view

---

## Animal Listing Intents

Each animal can have a listing intent that determines how it appears on the marketplace and what actions buyers can take.

### Intent Types

| Intent | Description | Use Case |
|--------|-------------|----------|
| `STUD` | Available for breeding | Stud dogs, breeding males |
| `BROOD_PLACEMENT` | Breeding female available | Retiring breeding females |
| `REHOME` | Needs new home | Rehoming situations |
| `GUARDIAN` | Guardian home placement | Guardian program animals |
| `TRAINED` | Fully trained animal | Service dogs, trained adults |
| `WORKING` | Working animal available | Working line dogs |
| `STARTED` | Partially trained | Started dogs for finishing |
| `CO_OWNERSHIP` | Co-ownership opportunity | Shared ownership arrangements |

### Intent Configuration

```typescript
// apps/marketplace/src/api/types.ts
export type AnimalListingIntent =
  | "STUD"
  | "BROOD_PLACEMENT"
  | "REHOME"
  | "GUARDIAN"
  | "TRAINED"
  | "WORKING"
  | "STARTED"
  | "CO_OWNERSHIP";
```

### Display Labels and Colors

```typescript
// apps/marketplace/src/marketplace/components/AnimalListingCard.tsx
const INTENT_LABELS: Record<AnimalListingIntent, string> = {
  STUD: "Stud",
  BROOD_PLACEMENT: "Brood Placement",
  REHOME: "Rehome",
  GUARDIAN: "Guardian Home",
  TRAINED: "Trained",
  WORKING: "Working",
  STARTED: "Started",
  CO_OWNERSHIP: "Co-Ownership",
};

const INTENT_BADGE_CLASSES: Record<AnimalListingIntent, string> = {
  STUD: "bg-blue-100 text-blue-800",
  BROOD_PLACEMENT: "bg-purple-100 text-purple-800",
  REHOME: "bg-amber-100 text-amber-800",
  GUARDIAN: "bg-green-100 text-green-800",
  TRAINED: "bg-indigo-100 text-indigo-800",
  WORKING: "bg-slate-100 text-slate-800",
  STARTED: "bg-cyan-100 text-cyan-800",
  CO_OWNERSHIP: "bg-pink-100 text-pink-800",
};
```

## Display Logic

### Animals Index Page

The animals browse page shows individual animals and offspring groups:

1. **Orphan Animals** (no offspring group) → Individual card
2. **Offspring Group with 1 animal** → Individual card
3. **Offspring Group with 2+ animals** → Group card

### Within Program Page

All offspring groups are shown regardless of animal count.

## Intent-Specific Details

Each intent can have custom details stored in `detailsJson`:

### STUD Intent Details
```typescript
{
  studFee?: number;
  studFeeType?: "fixed" | "pick_of_litter" | "negotiable";
  availableForAI?: boolean;
  healthTesting?: string[];
}
```

### GUARDIAN Intent Details
```typescript
{
  guardianTerms?: string;
  requiredLitters?: number;
  locationRequirements?: string;
  visitFrequency?: string;
}
```

### TRAINED Intent Details
```typescript
{
  trainingType?: string[];  // "obedience", "service", "therapy", etc.
  certifications?: string[];
  trainingHours?: number;
}
```

### CO_OWNERSHIP Intent Details
```typescript
{
  ownershipSplit?: string;  // "50/50", "breeder retains breeding rights"
  financialTerms?: string;
  breedingRights?: boolean;
}
```

## API Response

```typescript
interface PublicAnimalListingDTO {
  id: number;
  name: string;
  species: string;
  breed?: string;
  sex?: "MALE" | "FEMALE";
  dateOfBirth?: string;
  listingIntent: AnimalListingIntent;
  detailsJson?: Record<string, unknown>;
  images?: string[];
  breeder: {
    slug: string;
    name: string;
  };
  program?: {
    id: number;
    slug: string;
    name: string;
  };
}
```

## Frontend Routes

```tsx
<Route path="/animals" element={<AnimalsIndexPage />} />
```

## Migration from SHOWCASE

The `SHOWCASE` intent was removed. Animals previously using SHOWCASE should be:
- Converted to appropriate intent based on purpose
- Or removed from marketplace listings if not for sale/placement

## Related

- [Breeding Programs](./breeding-programs.md) - Program organization
- [API Reference](./api-reference.md) - Full API documentation
