# Portal Access & Audit Domain

## Mermaid ERD

```mermaid
erDiagram
    PortalAccess {
        int id PK
        int tenantId FK
        int partyId FK_UK
        enum status
        string userId FK
        string membershipUserId
        datetime invitedAt
        datetime activatedAt
        datetime suspendedAt
        datetime lastLoginAt
        string createdByUserId FK
        string updatedByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    PortalInvite {
        int id PK
        int tenantId FK
        int partyId FK
        string emailNorm
        string userId FK
        enum roleToGrant
        enum statusToGrant
        string tokenHash UK
        datetime expiresAt
        datetime sentAt
        datetime usedAt
        string membershipUserId
        string sentByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    AuditEvent {
        int id PK
        datetime createdAt
        string requestId
        string ip
        string userAgent
        string userId
        enum surface
        enum actorContext
        int tenantId
        string action
        enum outcome
        json detailJson
    }

    Tag {
        int id PK
        int tenantId FK
        string name
        enum module
        string color
        boolean isArchived
        datetime archivedAt
        datetime createdAt
        datetime updatedAt
    }

    TagAssignment {
        int id PK
        int tagId FK
        int taggedPartyId FK
        int animalId FK
        int waitlistEntryId FK
        int offspringGroupId FK
        int offspringId FK
        datetime createdAt
    }

    Task {
        int id PK
        int tenantId FK
        enum scope
        int groupId FK
        int offspringId FK
        string title
        string notes
        datetime dueAt
        enum status
        string assignedToUserId FK
        datetime createdAt
        datetime updatedAt
    }

    HealthEvent {
        int id PK
        int tenantId FK
        int offspringId FK
        enum kind
        datetime occurredAt
        int weightGrams
        string vaccineCode
        string dose
        string vetClinic
        string result
        string notes
        json data
        string recordedByUserId FK
        datetime createdAt
        datetime updatedAt
    }

    PortalAccess }o--|| Tenant : "in tenant"
    PortalAccess ||--|| Party : "for party"
    PortalAccess }o--|| User : "linked user"
    PortalAccess }o--|| User : "created by"
    PortalAccess }o--|| User : "updated by"

    PortalInvite }o--|| Tenant : "in tenant"
    PortalInvite }o--|| Party : "for party"
    PortalInvite }o--|| User : "for user"
    PortalInvite }o--|| User : "sent by"

    Tag ||--o{ TagAssignment : "has"
    TagAssignment }o--|| Party : "tags party"
    TagAssignment }o--|| Animal : "tags animal"
    TagAssignment }o--|| WaitlistEntry : "tags waitlist"
    TagAssignment }o--|| OffspringGroup : "tags group"
    TagAssignment }o--|| Offspring : "tags offspring"

    Task }o--|| OffspringGroup : "for group"
    Task }o--|| Offspring : "for offspring"
    Task }o--|| User : "assigned to"

    HealthEvent }o--|| Offspring : "for"
    HealthEvent }o--|| User : "recorded by"

    Tenant ||--o{ Tag : "has"
    Tenant ||--o{ Task : "has"
    Tenant ||--o{ HealthEvent : "has"
    Tenant ||--o{ PortalAccess : "has"
    Tenant ||--o{ PortalInvite : "has"
```

## DBML

```dbml
// Portal Access & Audit Domain

Table PortalAccess {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  partyId int [unique, not null, ref: - Party.id]
  status PortalAccessStatus [default: 'NO_ACCESS']
  userId varchar [ref: > User.id]
  membershipUserId varchar
  invitedAt timestamp
  activatedAt timestamp
  suspendedAt timestamp
  lastLoginAt timestamp
  createdByUserId varchar [ref: > User.id]
  updatedByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, partyId) [unique]
  }
}

Table PortalInvite {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  partyId int [not null, ref: > Party.id]
  emailNorm varchar [not null]
  userId varchar [ref: > User.id]
  roleToGrant TenantMembershipRole [default: 'CLIENT']
  statusToGrant TenantMembershipStatus [default: 'ACTIVE']
  tokenHash varchar [unique, not null]
  expiresAt timestamp [not null]
  sentAt timestamp [default: `now()`]
  usedAt timestamp
  membershipUserId varchar
  sentByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table AuditEvent {
  id int [pk, increment]
  createdAt timestamp [default: `now()`]
  requestId varchar(64)
  ip varchar(45)
  userAgent text
  userId varchar(64)
  surface AuditSurface [not null]
  actorContext AuditActorContext
  tenantId int
  action varchar(64) [not null]
  outcome AuditOutcome [not null]
  detailJson json
}

Table Tag {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  name varchar [not null]
  module TagModule [not null]
  color varchar
  isArchived boolean [default: false]
  archivedAt timestamp
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, module, name) [unique]
  }
}

Table TagAssignment {
  id int [pk, increment]
  tagId int [not null, ref: > Tag.id]
  taggedPartyId int [ref: > Party.id]
  animalId int [ref: > Animal.id]
  waitlistEntryId int [ref: > WaitlistEntry.id]
  offspringGroupId int [ref: > OffspringGroup.id]
  offspringId int [ref: > Offspring.id]
  createdAt timestamp [default: `now()`]

  indexes {
    (tagId, taggedPartyId) [unique]
    (tagId, animalId) [unique]
    (tagId, waitlistEntryId) [unique]
    (tagId, offspringGroupId) [unique]
    (tagId, offspringId) [unique]
  }
}

Table Task {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  scope TaskScope [not null]
  groupId int [ref: > OffspringGroup.id]
  offspringId int [ref: > Offspring.id]
  title varchar [not null]
  notes varchar
  dueAt timestamp
  status TaskStatus [default: 'open']
  assignedToUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table HealthEvent {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  offspringId int [not null, ref: > Offspring.id]
  kind HealthType [not null]
  occurredAt timestamp [not null]
  weightGrams int
  vaccineCode varchar
  dose varchar
  vetClinic varchar
  result varchar
  notes varchar
  data json
  recordedByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Enum PortalAccessStatus {
  NO_ACCESS
  INVITED
  ACTIVE
  SUSPENDED
}

Enum AuditSurface {
  PLATFORM
  PORTAL
  MARKETPLACE
}

Enum AuditActorContext {
  STAFF
  CLIENT
  PUBLIC
}

Enum AuditOutcome {
  SUCCESS
  FAILURE
}

Enum TagModule {
  CONTACT
  ORGANIZATION
  ANIMAL
  WAITLIST_ENTRY
  OFFSPRING_GROUP
  OFFSPRING
}

Enum TaskScope {
  group
  offspring
}

Enum TaskStatus {
  open
  in_progress
  done
  cancelled
}

Enum HealthType {
  weight
  vaccine
  deworm
  vet_visit
  treatment
  other
}
```
