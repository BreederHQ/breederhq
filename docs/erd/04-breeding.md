# Breeding Domain

## Mermaid ERD

```mermaid
erDiagram
    BreedingPlan {
        int id PK
        int tenantId FK
        int organizationId FK
        string code UK
        string name
        string nickname
        enum species
        string breedText
        int damId FK
        int sireId FK
        string lockedCycleKey
        datetime lockedCycleStart
        datetime lockedOvulationDate
        datetime lockedDueDate
        datetime lockedPlacementStartDate
        datetime expectedCycleStart
        datetime expectedHormoneTestingStart
        datetime expectedBreedDate
        datetime expectedBirthDate
        datetime expectedWeaned
        datetime expectedPlacementStart
        datetime expectedPlacementCompleted
        datetime cycleStartDateActual
        datetime hormoneTestingStartDateActual
        datetime breedDateActual
        datetime birthDateActual
        datetime weanedDateActual
        datetime placementStartDateActual
        datetime placementCompletedDateActual
        datetime completedDateActual
        enum status
        string notes
        datetime committedAt
        string committedByUserId FK
        int depositsCommittedCents
        int depositsPaidCents
        int depositRiskScore
        boolean archived
        datetime createdAt
        datetime updatedAt
    }

    ReproductiveCycle {
        int id PK
        int tenantId FK
        int femaleId FK
        datetime cycleStart
        datetime ovulation
        datetime dueDate
        datetime placementStartDate
        string status
        string notes
        datetime createdAt
        datetime updatedAt
    }

    BreedingPlanShare {
        int id PK
        int planId FK
        int fromTenantId FK
        int toTenantId FK
        enum scope
        enum status
        string message
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
    }

    BreedingPlanEvent {
        int id PK
        int tenantId FK
        int planId FK
        string type
        datetime occurredAt
        string label
        string notes
        json data
        string recordedByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    TestResult {
        int id PK
        int tenantId FK
        int planId FK
        int animalId FK
        string kind
        string method
        string labName
        float valueNumber
        string valueText
        string units
        string referenceRange
        datetime collectedAt
        datetime resultAt
        string notes
        json data
        datetime createdAt
        datetime updatedAt
    }

    BreedingAttempt {
        int id PK
        int tenantId FK
        int planId FK
        enum method
        datetime attemptAt
        datetime windowStart
        datetime windowEnd
        int studOwnerPartyId FK
        int semenBatchId
        boolean success
        string notes
        json data
        datetime createdAt
        datetime updatedAt
    }

    PregnancyCheck {
        int id PK
        int tenantId FK
        int planId FK
        enum method
        boolean result
        datetime checkedAt
        string notes
        json data
        datetime createdAt
        datetime updatedAt
    }

    PlanParty {
        int id PK
        int tenantId FK
        int planId FK
        string role
        int partyId FK
        string notes
    }

    PlanCodeCounter {
        int tenantId PK_FK
        int year PK
        int seq
    }

    BreedingPlan ||--o{ BreedingPlanEvent : "has events"
    BreedingPlan ||--o{ BreedingPlanShare : "shared"
    BreedingPlan ||--o{ TestResult : "has tests"
    BreedingPlan ||--o{ BreedingAttempt : "has attempts"
    BreedingPlan ||--o{ PregnancyCheck : "has checks"
    BreedingPlan ||--o{ PlanParty : "has parties"
    BreedingPlan }o--|| Animal : "dam"
    BreedingPlan }o--|| Animal : "sire"
    BreedingPlan ||--o| Litter : "produces"
    BreedingPlan ||--o| OffspringGroup : "produces"

    Animal ||--o{ ReproductiveCycle : "has cycles"
    Animal ||--o{ TestResult : "has tests"

    Tenant ||--o{ BreedingPlan : "contains"
    Tenant ||--o{ ReproductiveCycle : "contains"
    Tenant ||--o{ PlanCodeCounter : "has counters"

    User ||--o{ BreedingPlanEvent : "records"
    Party ||--o{ BreedingAttempt : "stud owner"
    Party ||--o{ PlanParty : "participates"
```

## DBML

```dbml
// Breeding Domain

Table BreedingPlan {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  organizationId int [ref: > Organization.id]
  code varchar
  name varchar [not null]
  nickname varchar
  species Species [not null]
  breedText varchar
  damId int [ref: > Animal.id]
  sireId int [ref: > Animal.id]
  lockedCycleKey varchar
  lockedCycleStart timestamp
  lockedOvulationDate timestamp
  lockedDueDate timestamp
  lockedPlacementStartDate timestamp
  expectedCycleStart timestamp
  expectedHormoneTestingStart timestamp
  expectedBreedDate timestamp
  expectedBirthDate timestamp
  expectedWeaned timestamp
  expectedPlacementStart timestamp
  expectedPlacementCompleted timestamp
  cycleStartDateActual timestamp
  hormoneTestingStartDateActual timestamp
  breedDateActual timestamp
  birthDateActual timestamp
  weanedDateActual timestamp
  placementStartDateActual timestamp
  placementCompletedDateActual timestamp
  completedDateActual timestamp
  status BreedingPlanStatus [default: 'PLANNING']
  notes varchar
  committedAt timestamp
  committedByUserId varchar [ref: > User.id]
  depositsCommittedCents int
  depositsPaidCents int
  depositRiskScore int
  archived boolean [default: false]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, code) [unique]
  }
}

Table ReproductiveCycle {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  femaleId int [not null, ref: > Animal.id]
  cycleStart timestamp [not null]
  ovulation timestamp
  dueDate timestamp
  placementStartDate timestamp
  status varchar
  notes varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table BreedingPlanShare {
  id int [pk, increment]
  planId int [not null, ref: > BreedingPlan.id]
  fromTenantId int [not null, ref: > Tenant.id]
  toTenantId int [not null, ref: > Tenant.id]
  scope ShareScope [default: 'BREED_PLAN']
  status ShareStatus [default: 'PENDING']
  message varchar
  expiresAt timestamp
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (planId, toTenantId) [unique]
  }
}

Table BreedingPlanEvent {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [not null, ref: > BreedingPlan.id]
  type varchar [not null]
  occurredAt timestamp [not null]
  label varchar
  notes varchar
  data json
  recordedByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table TestResult {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [ref: > BreedingPlan.id]
  animalId int [ref: > Animal.id]
  kind varchar [not null]
  method varchar
  labName varchar
  valueNumber float
  valueText varchar
  units varchar
  referenceRange varchar
  collectedAt timestamp [not null]
  resultAt timestamp
  notes varchar
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table BreedingAttempt {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [not null, ref: > BreedingPlan.id]
  method BreedingMethod [not null]
  attemptAt timestamp
  windowStart timestamp
  windowEnd timestamp
  studOwnerPartyId int [ref: > Party.id]
  semenBatchId int
  success boolean
  notes varchar
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table PregnancyCheck {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [not null, ref: > BreedingPlan.id]
  method PregnancyCheckMethod [not null]
  result boolean [not null]
  checkedAt timestamp [not null]
  notes varchar
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table PlanParty {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [not null, ref: > BreedingPlan.id]
  role varchar [not null]
  partyId int [ref: > Party.id]
  notes varchar
}

Table PlanCodeCounter {
  tenantId int [not null, ref: > Tenant.id]
  year int [not null]
  seq int [default: 0]

  indexes {
    (tenantId, year) [pk]
  }
}

Enum BreedingPlanStatus {
  PLANNING
  COMMITTED
  CYCLE_EXPECTED
  HORMONE_TESTING
  BRED
  PREGNANT
  BIRTHED
  WEANED
  PLACEMENT
  COMPLETE
  CANCELED
}

Enum BreedingMethod {
  NATURAL
  AI_TCI
  AI_SI
  AI_FROZEN
}

Enum PregnancyCheckMethod {
  PALPATION
  ULTRASOUND
  RELAXIN_TEST
  XRAY
  OTHER
}
```
