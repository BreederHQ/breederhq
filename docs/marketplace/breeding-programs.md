# Breeding Programs

Breeding Programs are first-class entities that represent a breeder's specific breeding line (e.g., "Goldendoodle Program", "Maine Coon Program").

## Overview

Programs are the primary organizational unit for marketplace listings. Each program:
- Belongs to a single tenant (breeder)
- Has multiple breeding plans attached
- Can be listed on the marketplace for discovery
- Controls visibility, waitlist, and reservation settings

## Data Model

### BreedingProgram Table

```prisma
model BreedingProgram {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Identity
  slug      String   // URL-friendly, unique per tenant
  name      String   // "Goldendoodle Program"
  description String? @db.Text
  species   String   // "DOG", "CAT", etc.
  breedText String?  // Free-text breed description

  // Marketplace Settings
  listed              Boolean @default(false)  // Show on marketplace
  acceptInquiries     Boolean @default(true)   // Allow inquiry button
  openWaitlist        Boolean @default(false)  // Show waitlist button
  acceptReservations  Boolean @default(false)  // Allow deposits

  // Pricing Info (JSON for flexibility)
  pricingTiers    Json?   // Array of { tier, priceRange, description }
  whatsIncluded   String? @db.Text
  typicalWaitTime String?

  // Relations
  breedingPlans  BreedingPlan[]
  media          BreedingProgramMedia[]

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  publishedAt DateTime?

  @@unique([tenantId, slug])
  @@index([tenantId])
  @@index([listed])
}
```

### BreedingProgramMedia Table

```prisma
model BreedingProgramMedia {
  id        Int      @id @default(autoincrement())
  programId Int
  program   BreedingProgram @relation(fields: [programId], references: [id], onDelete: Cascade)

  type      String   // "IMAGE", "VIDEO"
  url       String
  caption   String?
  sortOrder Int      @default(0)
  isPrimary Boolean  @default(false)

  createdAt DateTime @default(now())

  @@index([programId])
}
```

### BreedingPlan.programId

Breeding plans now have an optional `programId` field linking them to a program:

```prisma
model BreedingPlan {
  // ... existing fields ...
  programId Int?
  program   BreedingProgram? @relation(fields: [programId], references: [id], onDelete: SetNull)
}
```

## API Endpoints

### Breeder Management (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/breeding/programs` | List all programs for tenant |
| GET | `/api/v1/breeding/programs/:id` | Get single program |
| POST | `/api/v1/breeding/programs` | Create program |
| PUT | `/api/v1/breeding/programs/:id` | Update program |
| DELETE | `/api/v1/breeding/programs/:id` | Delete program |
| POST | `/api/v1/breeding/programs/:id/publish` | Publish to marketplace |
| POST | `/api/v1/breeding/programs/:id/unpublish` | Remove from marketplace |

### Public Browsing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/marketplace/breeding-programs` | Browse all listed programs |
| GET | `/api/v1/marketplace/breeding-programs/:slug` | Get program detail |
| GET | `/api/v1/marketplace/breeders/:slug/programs` | Programs for specific breeder |

## Frontend Components

### Management UI

**Location:** `apps/marketplace/src/management/pages/ProgramsSettingsPage.tsx`

Features:
- List all programs with status badges
- Create/edit program modal
- Publish/unpublish toggle
- Delete with confirmation
- Inline program creation from breeding plan form

### Consumer UI

**Location:** `apps/marketplace/src/marketplace/pages/`

- `BreedingProgramsIndexPage.tsx` - Browse all programs
- `ProgramPage.tsx` - Single program detail with offspring groups

## Routes

```tsx
// Management routes
<Route path="/me/programs" element={<ProgramsSettingsPage />} />

// Consumer routes
<Route path="/breeding-programs" element={<BreedingProgramsIndexPage />} />
<Route path="/programs/:programSlug" element={<ProgramPage />} />
```

## Usage Examples

### Creating a Program

```typescript
import { createBreederProgram } from "../api/client";

const program = await createBreederProgram(tenantId, {
  name: "Goldendoodle Program",
  species: "DOG",
  breedText: "F1B Goldendoodle",
  description: "Our family-raised Goldendoodles...",
  listed: false, // Start as draft
  acceptInquiries: true,
  openWaitlist: true,
});
```

### Publishing a Program

```typescript
import { updateBreederProgram } from "../api/client";

await updateBreederProgram(tenantId, programId, {
  listed: true,
});
```

## Migration Notes

Programs were previously stored as JSON in `TenantSettings.programs`. A migration script exists to convert existing data:

```sql
-- See: prisma/migrations/20260111_breeding_programs_migration.sql
```

## Related

- [Animal Listings](./animal-listings.md) - How animals are displayed
- [Origin Tracking](./origin-tracking.md) - Attribution for inquiries
