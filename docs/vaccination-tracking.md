# Vaccination Tracking System

## Overview

The vaccination tracking system replaces unreliable boolean checkboxes (like "Vaccinations up to date") with date-based vaccination records that automatically calculate expiration dates and alert users when vaccinations are due or expired.

## Features

- **Date-based tracking**: Records actual vaccination dates instead of yes/no checkboxes
- **Automatic expiration calculation**: Based on vaccine protocol intervals (e.g., rabies = 3 years, DHPP = 1 year)
- **Status indicators**: Current (green), Due Soon (amber, <30 days), Expired (red)
- **Document linking**: Attach vaccination certificates/records to each entry
- **Multi-species support**: Protocols for dogs, cats, horses, goats, and sheep
- **Visual alerts**: Pulsing badges on animal cards when vaccinations need attention
- **Dashboard integration**: Expired/due-soon vaccinations appear in Today's Agenda

## Architecture

### Database Schema

```prisma
model VaccinationRecord {
  id             Int       @id @default(autoincrement())
  tenantId       Int
  tenant         Tenant    @relation(...)
  animalId       Int
  animal         Animal    @relation(...)

  protocolKey    String    @db.VarChar(100)  // "dog.rabies", "dog.dhpp", etc.
  administeredAt DateTime
  expiresAt      DateTime?                    // Calculated or manual override

  veterinarian   String?   @db.VarChar(255)
  clinic         String?   @db.VarChar(255)
  batchLotNumber String?   @db.VarChar(100)
  notes          String?   @db.Text

  documentId     Int?
  document       Document? @relation(...)

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([tenantId, animalId])
  @@index([tenantId, protocolKey])
  @@index([animalId, protocolKey])
  @@index([administeredAt])
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/vaccinations/protocols?species=DOG` | Get available protocols for a species |
| GET | `/api/v1/animals/:animalId/vaccinations` | List vaccination records with status |
| POST | `/api/v1/animals/:animalId/vaccinations` | Create a vaccination record |
| PATCH | `/api/v1/animals/:animalId/vaccinations/:recordId` | Update a vaccination record |
| DELETE | `/api/v1/animals/:animalId/vaccinations/:recordId` | Delete a vaccination record |
| POST | `/api/v1/animals/:animalId/vaccinations/:recordId/document` | Link a document |
| DELETE | `/api/v1/animals/:animalId/vaccinations/:recordId/document` | Unlink a document |

### Response Format

```typescript
// GET /api/v1/animals/:animalId/vaccinations
{
  records: [
    {
      id: 1,
      protocolKey: "dog.rabies",
      administeredAt: "2024-01-15T00:00:00.000Z",
      expiresAt: "2027-01-15T00:00:00.000Z",
      veterinarian: "Dr. Smith",
      clinic: "Happy Paws Vet",
      batchLotNumber: "ABC123",
      documentId: 42,
      document: { id: 42, title: "Rabies Certificate", ... },
      notes: "3-year vaccine",
      status: "current",           // "current" | "due_soon" | "expired"
      statusText: "Current",
      daysRemaining: 730
    }
  ],
  summary: {
    total: 6,        // Total protocols for this species
    current: 3,
    dueSoon: 1,
    expired: 1,
    notRecorded: 1,
    hasIssues: true  // true if expired > 0 or dueSoon > 0
  }
}
```

## Vaccination Protocols

### Dogs (Core)
| Key | Name | Interval |
|-----|------|----------|
| `dog.rabies` | Rabies | 36 months |
| `dog.dhpp` | DHPP (Distemper, Hepatitis, Parvo, Parainfluenza) | 12 months |
| `dog.bordetella` | Bordetella (Kennel Cough) | 12 months |

### Dogs (Non-Core)
| Key | Name | Interval |
|-----|------|----------|
| `dog.leptospirosis` | Leptospirosis | 12 months |
| `dog.lyme` | Lyme Disease | 12 months |
| `dog.canine_influenza` | Canine Influenza | 12 months |

### Cats (Core)
| Key | Name | Interval |
|-----|------|----------|
| `cat.rabies` | Rabies | 36 months |
| `cat.fvrcp` | FVRCP | 36 months |

### Cats (Non-Core)
| Key | Name | Interval |
|-----|------|----------|
| `cat.felv` | FeLV (Feline Leukemia) | 12 months |

### Horses (Core)
| Key | Name | Interval |
|-----|------|----------|
| `horse.rabies` | Rabies | 12 months |
| `horse.tetanus` | Tetanus | 12 months |
| `horse.ewt` | Eastern/Western Encephalomyelitis + Tetanus | 12 months |
| `horse.west_nile` | West Nile Virus | 12 months |

### Horses (Non-Core)
| Key | Name | Interval |
|-----|------|----------|
| `horse.influenza` | Equine Influenza | 6 months |
| `horse.rhinopneumonitis` | Rhinopneumonitis (EHV) | 6 months |
| `horse.strangles` | Strangles | 12 months |

### Goats
| Key | Name | Interval |
|-----|------|----------|
| `goat.cdt` | CDT (Clostridium + Tetanus) | 12 months |
| `goat.rabies` | Rabies | 12 months |

### Sheep
| Key | Name | Interval |
|-----|------|----------|
| `sheep.cdt` | CDT (Clostridium + Tetanus) | 12 months |

## UI Components

### VaccinationTracker
Main component displayed in the Health tab. Shows all vaccination protocols for the animal's species with their current status.

```tsx
import { VaccinationTracker } from "@bhq/ui/components/VaccinationTracker";

<VaccinationTracker
  animalId={animal.id}
  species={animal.species}
  records={vaccinationRecords}
  protocols={vaccinationProtocols}
  onAddRecord={(input) => api.vaccinations.create(animal.id, input)}
  onUpdateRecord={(id, input) => api.vaccinations.update(animal.id, id, input)}
  onDeleteRecord={(id) => api.vaccinations.delete(animal.id, id)}
  onAlertStateChange={(state) => setVaccinationAlert(state)}
/>
```

### VaccinationAlertBadge
Compact badge for showing vaccination issues on animal cards/rows.

```tsx
import { VaccinationAlertBadge } from "@bhq/ui/components/VaccinationTracker";

<VaccinationAlertBadge
  expiredCount={2}
  dueSoonCount={1}
  size="sm"      // "sm" | "md"
  dotOnly={false} // true for minimal dot indicator
/>
```

### AddVaccinationDialog
Modal dialog for creating/editing vaccination records.

```tsx
import { AddVaccinationDialog } from "@bhq/ui/components/VaccinationTracker";

<AddVaccinationDialog
  open={dialogOpen}
  onOpenChange={setDialogOpen}
  protocols={protocols}
  existingRecord={recordToEdit}  // undefined for new
  onSave={(input) => handleSave(input)}
/>
```

## Status Calculation

Status is calculated based on the difference between the expiration date and today:

```typescript
function calculateStatus(expiresAt: Date): VaccinationStatus {
  const daysRemaining = differenceInDays(expiresAt, new Date());

  if (daysRemaining < 0) return "expired";
  if (daysRemaining < 30) return "due_soon";
  return "current";
}
```

- **Current**: More than 30 days until expiration
- **Due Soon**: Less than 30 days until expiration
- **Expired**: Past expiration date
- **Not Recorded**: No record exists for the protocol

## Files

### Frontend
- `packages/ui/src/components/VaccinationTracker/VaccinationTracker.tsx` - Main tracker component
- `packages/ui/src/components/VaccinationTracker/AddVaccinationDialog.tsx` - Add/edit dialog
- `packages/ui/src/components/VaccinationTracker/VaccinationStatusBadge.tsx` - Status indicators
- `packages/ui/src/components/VaccinationTracker/VaccinationAlertBadge.tsx` - Alert badges
- `packages/ui/src/utils/vaccinationStatus.ts` - Status calculation utilities
- `packages/api/src/types/vaccinations.ts` - TypeScript types
- `packages/api/src/resources/vaccinations.ts` - API client resource

### Backend
- `breederhq-api/src/routes/animal-vaccinations.ts` - API endpoints
- `breederhq-api/prisma/schema.prisma` - VaccinationRecord model

### Integration Points
- `apps/animals/src/App-Animals.tsx` - Health tab integration, animal card alerts
- `apps/animals/src/components/AnimalCardView.tsx` - Card view alert badges
- `breederhq-api/src/routes/dashboard.ts` - Agenda integration

## Future Enhancements

- **Bulk import**: Import historical vaccination records from spreadsheets
- **Marketplace compliance**: Block/warn listings with expired core vaccinations
- **Offspring scheduling**: Auto-create vaccination schedules for puppies/kittens
- **Email reminders**: Notify breeders of upcoming vaccination due dates
- **Veterinarian directory**: Save frequently used vets/clinics for quick selection
