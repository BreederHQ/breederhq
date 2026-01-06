# Animals Domain

## Mermaid ERD

```mermaid
erDiagram
    Animal {
        int id PK
        int tenantId FK
        int organizationId FK
        string name
        enum species
        enum sex
        enum status
        enum intendedUse
        int declaredValueCents
        string declaredValueCurrency
        datetime valuationDate
        enum valuationSource
        boolean forSale
        boolean inSyndication
        boolean isLeased
        datetime birthDate
        string microchip
        string notes
        string breed
        string photoUrl
        int canonicalBreedId FK
        int customBreedId FK
        int femaleCycleLenOverrideDays
        int litterId FK
        int offspringGroupId FK
        int buyerPartyId FK
        int priceCents
        int depositCents
        boolean archived
        datetime createdAt
        datetime updatedAt
    }

    AnimalOwner {
        int id PK
        int animalId FK
        int partyId FK
        int percent
        boolean isPrimary
        datetime createdAt
        datetime updatedAt
    }

    AnimalOwnershipChange {
        int id PK
        int tenantId FK
        int animalId FK
        enum kind
        datetime effectiveDate
        datetime occurredAt
        int valueCents
        string currency
        json fromOwners
        json toOwners
        json fromOwnerParties
        json toOwnerParties
        string notes
        datetime createdAt
        datetime updatedAt
    }

    Breed {
        int id PK
        string name UK
        string slug UK
        enum species
        datetime createdAt
        datetime updatedAt
    }

    AnimalBreed {
        int id PK
        int animalId FK
        int breedId FK
        float percentage
        datetime createdAt
        datetime updatedAt
    }

    CustomBreed {
        int id PK
        int tenantId FK
        int createdByOrganizationId FK
        enum species
        string name
        json composition
        datetime createdAt
        datetime updatedAt
    }

    TenantProgramBreed {
        int id PK
        int tenantId FK
        enum species
        int breedId FK
        int customBreedId FK
        boolean isPrimary
        datetime createdAt
        datetime updatedAt
    }

    Registry {
        int id PK
        string name
        string code UK
        string url
        string country
        enum species
        datetime createdAt
        datetime updatedAt
    }

    AnimalRegistryIdentifier {
        int id PK
        int animalId FK
        int registryId FK
        string identifier
        string registrarOfRecord
        datetime issuedAt
        datetime createdAt
        datetime updatedAt
    }

    BreedRegistryLink {
        int breedId PK_FK
        int registryId PK_FK
        string statusText
        string registryRef
        string url
        boolean primary
        int since
        string notes
        string proofUrl
    }

    AnimalShare {
        int id PK
        int animalId FK
        int fromTenantId FK
        int toTenantId FK
        enum scope
        enum status
        string message
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    AnimalPublicListing {
        int id PK
        int animalId FK_UK
        int tenantId FK
        string urlSlug UK
        enum intent
        enum status
        string headline
        string title
        string summary
        string description
        boolean isListed
        string visibility
        datetime publishedAt
        datetime pausedAt
        string locationCity
        string locationRegion
        string locationCountry
        string priceModel
        int priceCents
        json detailsJson
        datetime createdAt
        datetime updatedAt
    }

    TraitDefinition {
        int id PK
        int tenantId FK
        enum species
        string key
        string displayName
        string category
        enum valueType
        json enumValues
        boolean requiresDocument
        boolean marketplaceVisibleDefault
        int sortOrder
        datetime createdAt
        datetime updatedAt
    }

    AnimalTraitValue {
        int id PK
        int tenantId FK
        int animalId FK
        int traitDefinitionId FK
        boolean valueBoolean
        float valueNumber
        string valueText
        datetime valueDate
        json valueJson
        enum status
        datetime performedAt
        enum source
        boolean verified
        datetime verifiedAt
        boolean marketplaceVisible
        string notes
        datetime createdAt
        datetime updatedAt
    }

    AnimalTraitValueDocument {
        int id PK
        int tenantId FK
        int animalId FK
        int animalTraitValueId FK
        int documentId FK
        datetime createdAt
    }

    Animal ||--o{ AnimalOwner : "owned by"
    Animal ||--o{ AnimalOwnershipChange : "has changes"
    Animal ||--o{ AnimalBreed : "has breeds"
    Animal ||--o{ AnimalRegistryIdentifier : "registered with"
    Animal ||--o{ AnimalShare : "shared"
    Animal ||--o| AnimalPublicListing : "has listing"
    Animal ||--o{ AnimalTraitValue : "has traits"
    Animal }o--|| Breed : "canonical breed"
    Animal }o--|| CustomBreed : "custom breed"

    AnimalBreed }o--|| Breed : "references"
    AnimalRegistryIdentifier }o--|| Registry : "references"
    BreedRegistryLink }o--|| Breed : "links"
    BreedRegistryLink }o--|| Registry : "links"

    AnimalTraitValue }o--|| TraitDefinition : "defines"
    AnimalTraitValue ||--o{ AnimalTraitValueDocument : "has docs"

    Tenant ||--o{ Animal : "contains"
    Tenant ||--o{ CustomBreed : "defines"
    Tenant ||--o{ TenantProgramBreed : "breeds"
    Party ||--o{ AnimalOwner : "owns"
```

## DBML

```dbml
// Animals Domain

Table Animal {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  organizationId int [ref: > Organization.id]
  name varchar [not null]
  species Species [not null]
  sex Sex [not null]
  status AnimalStatus [default: 'ACTIVE']
  intendedUse HorseIntendedUse
  declaredValueCents int
  declaredValueCurrency varchar(3)
  valuationDate timestamp
  valuationSource HorseValuationSource
  forSale boolean [default: false]
  inSyndication boolean [default: false]
  isLeased boolean [default: false]
  birthDate timestamp
  microchip varchar
  notes varchar
  breed varchar
  photoUrl text
  canonicalBreedId int [ref: > Breed.id]
  customBreedId int [ref: > CustomBreed.id]
  femaleCycleLenOverrideDays int
  litterId int [ref: > Litter.id]
  offspringGroupId int [ref: > OffspringGroup.id]
  buyerPartyId int [ref: > Party.id]
  priceCents int
  depositCents int
  saleInvoiceId varchar
  contractId varchar
  contractSignedAt timestamp
  paidInFullAt timestamp
  healthCertAt timestamp
  microchipAppliedAt timestamp
  pickupAt timestamp
  placedAt timestamp
  archived boolean [default: false]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, microchip) [unique]
  }
}

Table AnimalOwner {
  id int [pk, increment]
  animalId int [not null, ref: > Animal.id]
  partyId int [not null, ref: > Party.id]
  percent int [not null]
  isPrimary boolean [default: false]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (animalId, partyId) [unique]
  }
}

Table AnimalOwnershipChange {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  animalId int [not null, ref: > Animal.id]
  kind OwnershipChangeKind [not null]
  effectiveDate timestamp
  occurredAt timestamp [default: `now()`]
  valueCents int
  currency varchar(3)
  fromOwners json [not null]
  toOwners json [not null]
  fromOwnerParties json
  toOwnerParties json
  notes varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table Breed {
  id int [pk, increment]
  name varchar [unique, not null]
  slug varchar [unique, not null]
  species Species [not null]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table AnimalBreed {
  id int [pk, increment]
  animalId int [not null, ref: > Animal.id]
  breedId int [not null, ref: > Breed.id]
  percentage float [default: 100]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (animalId, breedId) [unique]
  }
}

Table CustomBreed {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  createdByOrganizationId int [ref: > Organization.id]
  species Species [not null]
  name varchar [not null]
  composition json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, species, name) [unique]
  }
}

Table TenantProgramBreed {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  species Species [not null]
  breedId int [ref: > Breed.id]
  customBreedId int [ref: > CustomBreed.id]
  isPrimary boolean [default: false]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, breedId) [unique]
    (tenantId, customBreedId) [unique]
  }
}

Table Registry {
  id int [pk, increment]
  name varchar [not null]
  code varchar [unique]
  url varchar
  country varchar
  species Species
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table AnimalRegistryIdentifier {
  id int [pk, increment]
  animalId int [not null, ref: > Animal.id]
  registryId int [not null, ref: > Registry.id]
  identifier varchar [not null]
  registrarOfRecord varchar
  issuedAt timestamp
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (registryId, identifier) [unique]
  }
}

Table BreedRegistryLink {
  breedId int [not null, ref: > Breed.id]
  registryId int [not null, ref: > Registry.id]
  statusText varchar
  registryRef varchar
  url varchar
  primary boolean
  since int
  notes varchar
  proofUrl varchar

  indexes {
    (breedId, registryId) [pk]
  }
}

Table AnimalShare {
  id int [pk, increment]
  animalId int [not null, ref: > Animal.id]
  fromTenantId int [not null, ref: > Tenant.id]
  toTenantId int [not null, ref: > Tenant.id]
  scope ShareScope [default: 'VIEW']
  status ShareStatus [default: 'PENDING']
  message varchar
  expiresAt timestamp
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (animalId, toTenantId) [unique]
  }
}

Table AnimalPublicListing {
  id int [pk, increment]
  animalId int [unique, not null, ref: - Animal.id]
  tenantId int [not null, ref: > Tenant.id]
  urlSlug varchar [unique]
  intent AnimalListingIntent
  status AnimalListingStatus [default: 'DRAFT']
  headline varchar(120)
  title varchar
  summary text
  description text
  isListed boolean [default: false]
  visibility varchar
  publishedAt timestamp
  pausedAt timestamp
  locationCity varchar(100)
  locationRegion varchar(100)
  locationCountry varchar(2)
  priceModel varchar(32)
  priceCents int
  priceMinCents int
  priceMaxCents int
  priceText varchar(100)
  detailsJson jsonb
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table TraitDefinition {
  id int [pk, increment]
  tenantId int [ref: > Tenant.id]
  species Species [not null]
  key varchar [not null]
  displayName varchar [not null]
  category varchar [not null]
  valueType TraitValueType [not null]
  enumValues json
  requiresDocument boolean [default: false]
  marketplaceVisibleDefault boolean [default: false]
  sortOrder int
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (species, key, tenantId) [unique]
  }
}

Table AnimalTraitValue {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  animalId int [not null, ref: > Animal.id]
  traitDefinitionId int [not null, ref: > TraitDefinition.id]
  valueBoolean boolean
  valueNumber float
  valueText varchar
  valueDate timestamp
  valueJson json
  status TraitStatus
  performedAt timestamp
  source TraitSource
  verified boolean [default: false]
  verifiedAt timestamp
  marketplaceVisible boolean
  notes varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, animalId, traitDefinitionId) [unique]
  }
}

Table AnimalTraitValueDocument {
  id int [pk, increment]
  tenantId int [not null]
  animalId int [not null]
  animalTraitValueId int [not null, ref: > AnimalTraitValue.id]
  documentId int [not null, ref: > Document.id]
  createdAt timestamp [default: `now()`]

  indexes {
    (tenantId, animalTraitValueId, documentId) [unique]
  }
}

Enum Species {
  DOG
  CAT
  HORSE
  GOAT
  RABBIT
  SHEEP
}

Enum Sex {
  FEMALE
  MALE
}

Enum AnimalStatus {
  ACTIVE
  BREEDING
  UNAVAILABLE
  RETIRED
  DECEASED
  PROSPECT
}

Enum HorseIntendedUse {
  BREEDING
  SHOW
  RACING
}

Enum HorseValuationSource {
  PRIVATE_SALE
  AUCTION
  APPRAISAL
  INSURANCE
  OTHER
}

Enum OwnershipChangeKind {
  SALE
  SYNDICATION
  TRANSFER
  LEASE
  DEATH
  OTHER
}

Enum ShareScope {
  VIEW
  BREED_PLAN
}

Enum ShareStatus {
  PENDING
  ACCEPTED
  REVOKED
  EXPIRED
}

Enum AnimalListingIntent {
  STUD
  BROOD_PLACEMENT
  REHOME
  SHOWCASE
}

Enum AnimalListingStatus {
  DRAFT
  LIVE
  PAUSED
}

Enum TraitValueType {
  BOOLEAN
  ENUM
  NUMBER
  DATE
  TEXT
  JSON
}

Enum TraitStatus {
  NOT_PROVIDED
  PROVIDED
  PENDING
  PASS
  FAIL
}

Enum TraitSource {
  SELF_REPORTED
  VET
  LAB
  REGISTRY
}
```
