# Offspring & Litters Domain

## Mermaid ERD

```mermaid
erDiagram
    OffspringGroup {
        int id PK
        int tenantId FK
        int planId FK_UK
        enum linkState
        enum linkReason
        enum species
        int damId FK
        int sireId FK
        string name
        datetime expectedBirthOn
        datetime actualBirthOn
        int countBorn
        int countLive
        int countStillborn
        int countMale
        int countFemale
        int countWeaned
        int countPlaced
        datetime weanedAt
        datetime placementStartAt
        datetime placementCompletedAt
        boolean published
        string coverImageUrl
        string themeName
        string listingSlug
        string listingTitle
        string listingDescription
        int marketplaceDefaultPriceCents
        string notes
        json data
        json placementSchedulingPolicy
        datetime createdAt
        datetime updatedAt
        datetime archivedAt
    }

    Offspring {
        int id PK
        int tenantId FK
        int groupId FK
        string name
        enum species
        string breed
        enum sex
        datetime bornAt
        datetime diedAt
        enum status
        enum lifeState
        enum placementState
        enum keeperIntent
        enum financialState
        enum paperworkState
        int damId FK
        int sireId FK
        string collarColorId
        string collarColorName
        string collarColorHex
        datetime collarAssignedAt
        boolean collarLocked
        int buyerPartyId FK
        int priceCents
        int depositCents
        string contractId
        datetime contractSignedAt
        datetime paidInFullAt
        datetime pickupAt
        datetime placedAt
        boolean marketplaceListed
        int marketplacePriceCents
        int promotedAnimalId FK
        string notes
        json data
        datetime createdAt
        datetime updatedAt
    }

    OffspringEvent {
        int id PK
        int tenantId FK
        int offspringId FK
        string type
        datetime occurredAt
        string field
        json before
        json after
        string notes
        string recordedByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    OffspringGroupEvent {
        int id PK
        int tenantId FK
        int offspringGroupId FK
        string type
        datetime occurredAt
        string field
        json before
        json after
        string notes
        string recordedByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    OffspringGroupBuyer {
        int id PK
        int tenantId FK
        int groupId FK
        int buyerPartyId FK
        int waitlistEntryId FK
        int placementRank
        datetime createdAt
        datetime updatedAt
    }

    Litter {
        int id PK
        int tenantId FK
        int planId FK_UK
        string identifier
        datetime birthedStartAt
        datetime birthedEndAt
        int countBorn
        int countLive
        int countStillborn
        int countMale
        int countFemale
        int countWeaned
        int countPlaced
        datetime weanedAt
        datetime placementStartAt
        datetime placementCompletedAt
        string statusOverride
        string statusOverrideReason
        boolean published
        string coverImageUrl
        string themeName
        string notes
        json data
        datetime createdAt
        datetime updatedAt
    }

    LitterEvent {
        int id PK
        int tenantId FK
        int litterId FK
        string type
        datetime occurredAt
        string field
        json before
        json after
        string notes
        string recordedByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    WaitlistEntry {
        int id PK
        int tenantId FK
        int planId FK
        int litterId FK
        int offspringGroupId FK
        int clientPartyId FK
        enum speciesPref
        json breedPrefs
        int sirePrefId FK
        int damPrefId FK
        enum status
        int priority
        string depositInvoiceId
        string balanceInvoiceId
        datetime depositPaidAt
        int depositRequiredCents
        int depositPaidCents
        int balanceDueCents
        int animalId FK
        int offspringId FK
        int skipCount
        datetime lastSkipAt
        string notes
        datetime createdAt
        datetime updatedAt
    }

    OffspringGroup ||--o{ Offspring : "contains"
    OffspringGroup ||--o{ OffspringGroupEvent : "has events"
    OffspringGroup ||--o{ OffspringGroupBuyer : "has buyers"
    OffspringGroup ||--o{ WaitlistEntry : "has waitlist"
    OffspringGroup }o--|| BreedingPlan : "from plan"
    OffspringGroup }o--|| Animal : "dam"
    OffspringGroup }o--|| Animal : "sire"

    Offspring ||--o{ OffspringEvent : "has events"
    Offspring }o--|| Animal : "dam"
    Offspring }o--|| Animal : "sire"
    Offspring }o--|| Animal : "promoted to"
    Offspring }o--|| Party : "buyer"
    Offspring ||--o{ WaitlistEntry : "allocated"

    Litter ||--o{ LitterEvent : "has events"
    Litter ||--o{ WaitlistEntry : "has waitlist"
    Litter ||--o{ Animal : "contains (legacy)"
    Litter }o--|| BreedingPlan : "from plan"

    WaitlistEntry }o--|| Party : "client"
    WaitlistEntry }o--|| Animal : "sire pref"
    WaitlistEntry }o--|| Animal : "dam pref"
    WaitlistEntry }o--|| Animal : "allocated animal"

    OffspringGroupBuyer }o--|| Party : "buyer"
    OffspringGroupBuyer }o--|| WaitlistEntry : "from waitlist"
```

## DBML

```dbml
// Offspring & Litters Domain

Table OffspringGroup {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [unique, ref: - BreedingPlan.id]
  linkState OffspringLinkState [default: 'linked']
  linkReason OffspringLinkReason
  species Species [not null]
  damId int [ref: > Animal.id]
  sireId int [ref: > Animal.id]
  name varchar
  expectedBirthOn timestamp
  actualBirthOn timestamp
  countBorn int
  countLive int
  countStillborn int
  countMale int
  countFemale int
  countWeaned int
  countPlaced int
  weanedAt timestamp
  placementStartAt timestamp
  placementCompletedAt timestamp
  published boolean [default: false]
  coverImageUrl varchar
  themeName varchar
  listingSlug varchar
  listingTitle varchar
  listingDescription text
  marketplaceDefaultPriceCents int
  notes varchar
  data json
  placementSchedulingPolicy json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
  archivedAt timestamp

  indexes {
    (tenantId, listingSlug) [unique]
  }
}

Table Offspring {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  groupId int [not null, ref: > OffspringGroup.id]
  name varchar
  species Species [not null]
  breed varchar
  sex Sex
  bornAt timestamp
  diedAt timestamp
  status OffspringStatus [default: 'NEWBORN']
  lifeState OffspringLifeState [default: 'ALIVE']
  placementState OffspringPlacementState [default: 'UNASSIGNED']
  keeperIntent OffspringKeeperIntent [default: 'AVAILABLE']
  financialState OffspringFinancialState [default: 'NONE']
  paperworkState OffspringPaperworkState [default: 'NONE']
  damId int [ref: > Animal.id]
  sireId int [ref: > Animal.id]
  collarColorId varchar
  collarColorName varchar
  collarColorHex varchar
  collarAssignedAt timestamp
  collarLocked boolean [default: false]
  buyerPartyId int [ref: > Party.id]
  priceCents int
  depositCents int
  contractId varchar
  contractSignedAt timestamp
  paidInFullAt timestamp
  pickupAt timestamp
  placedAt timestamp
  marketplaceListed boolean [default: false]
  marketplacePriceCents int
  promotedAnimalId int [ref: > Animal.id]
  notes varchar
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table OffspringEvent {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  offspringId int [not null, ref: > Offspring.id]
  type varchar [not null]
  occurredAt timestamp [not null]
  field varchar
  before json
  after json
  notes varchar
  recordedByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table OffspringGroupEvent {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  offspringGroupId int [not null, ref: > OffspringGroup.id]
  type varchar [not null]
  occurredAt timestamp [not null]
  field varchar
  before json
  after json
  notes varchar
  recordedByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table OffspringGroupBuyer {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  groupId int [not null, ref: > OffspringGroup.id]
  buyerPartyId int [ref: > Party.id]
  waitlistEntryId int [ref: > WaitlistEntry.id]
  placementRank int
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (groupId, buyerPartyId) [unique]
    (groupId, waitlistEntryId) [unique]
  }
}

Table Litter {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [unique, not null, ref: - BreedingPlan.id]
  identifier varchar
  birthedStartAt timestamp
  birthedEndAt timestamp
  countBorn int
  countLive int
  countStillborn int
  countMale int
  countFemale int
  countWeaned int
  countPlaced int
  weanedAt timestamp
  placementStartAt timestamp
  placementCompletedAt timestamp
  statusOverride varchar
  statusOverrideReason varchar
  published boolean [default: false]
  coverImageUrl varchar
  themeName varchar
  notes varchar
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table LitterEvent {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  litterId int [not null, ref: > Litter.id]
  type varchar [not null]
  occurredAt timestamp [not null]
  field varchar
  before json
  after json
  notes varchar
  recordedByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table WaitlistEntry {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [ref: > BreedingPlan.id]
  litterId int [ref: > Litter.id]
  offspringGroupId int [ref: > OffspringGroup.id]
  clientPartyId int [ref: > Party.id]
  speciesPref Species
  breedPrefs json
  sirePrefId int [ref: > Animal.id]
  damPrefId int [ref: > Animal.id]
  status WaitlistStatus [default: 'INQUIRY']
  priority int
  depositInvoiceId varchar
  balanceInvoiceId varchar
  depositPaidAt timestamp
  depositRequiredCents int
  depositPaidCents int
  balanceDueCents int
  animalId int [ref: > Animal.id]
  offspringId int [ref: > Offspring.id]
  skipCount int
  lastSkipAt timestamp
  notes varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Enum OffspringLinkState {
  linked
  orphan
  pending
}

Enum OffspringLinkReason {
  legacy_import
  rescue
  accidental
  third_party
  cobreeder
  placeholder
  historical
  other
}

Enum OffspringStatus {
  NEWBORN
  ALIVE
  WEANED
  PLACED
  DECEASED
}

Enum OffspringLifeState {
  ALIVE
  DECEASED
}

Enum OffspringPlacementState {
  UNASSIGNED
  OPTION_HOLD
  RESERVED
  PLACED
  RETURNED
  TRANSFERRED
}

Enum OffspringKeeperIntent {
  AVAILABLE
  UNDER_EVALUATION
  WITHHELD
  KEEP
}

Enum OffspringFinancialState {
  NONE
  DEPOSIT_PENDING
  DEPOSIT_PAID
  PAID_IN_FULL
  REFUNDED
  CHARGEBACK
}

Enum OffspringPaperworkState {
  NONE
  SENT
  SIGNED
  COMPLETE
}

Enum WaitlistStatus {
  INQUIRY
  DEPOSIT_DUE
  DEPOSIT_PAID
  READY
  ALLOCATED
  COMPLETED
  CANCELED
}
```
