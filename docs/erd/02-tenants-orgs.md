# Tenants & Organizations Domain

## Mermaid ERD

```mermaid
erDiagram
    Tenant {
        int id PK
        string name
        string slug UK
        string primaryEmail
        enum operationType
        json availabilityPrefs
        datetime createdAt
        datetime updatedAt
    }

    TenantMembership {
        string-int id PK "userId+tenantId"
        string userId FK
        int tenantId FK
        enum role
        enum membershipRole
        enum membershipStatus
        int partyId FK
        datetime createdAt
        datetime updatedAt
    }

    TenantSetting {
        int-string id PK "tenantId+namespace"
        int tenantId FK
        string namespace
        int version
        json data
        string updatedBy
        datetime createdAt
        datetime updatedAt
    }

    BillingAccount {
        int id PK
        int tenantId FK_UK
        string provider
        string customerId
        string subscriptionId
        string plan
        string status
        datetime currentPeriodEnd
        datetime createdAt
        datetime updatedAt
    }

    Organization {
        int id PK
        int tenantId FK
        int partyId FK_UK
        string name
        string email
        string phone
        string website
        string street
        string city
        string state
        string zip
        string country
        boolean archived
        string programSlug
        boolean isPublicProgram
        string programBio
        string publicContactEmail
        datetime createdAt
        datetime updatedAt
    }

    Membership {
        string-int id PK "userId+organizationId"
        string userId FK
        int organizationId FK
        enum role
    }

    Party {
        int id PK
        int tenantId FK
        enum type
        string name
        string email
        string phoneE164
        string whatsappE164
        string street
        string city
        string state
        string postalCode
        string country
        boolean archived
        datetime createdAt
        datetime updatedAt
    }

    Contact {
        int id PK
        int tenantId FK
        int organizationId FK
        int partyId FK_UK
        string display_name
        string first_name
        string last_name
        string nickname
        string email
        string phoneE164
        string whatsappE164
        string street
        string city
        string state
        string zip
        string country
        boolean archived
        datetime createdAt
        datetime updatedAt
    }

    PartyCommPreference {
        int id PK
        int partyId FK
        enum channel
        enum preference
        enum compliance
        datetime complianceSetAt
        string complianceSource
        datetime createdAt
        datetime updatedAt
    }

    PartyCommPreferenceEvent {
        int id PK
        int partyId FK
        enum channel
        enum prevPreference
        enum newPreference
        enum prevCompliance
        enum newCompliance
        int actorPartyId
        string reason
        string source
        datetime createdAt
    }

    Tenant ||--o{ TenantMembership : "has members"
    Tenant ||--o| BillingAccount : "has billing"
    Tenant ||--o{ Organization : "contains"
    Tenant ||--o{ Party : "contains"
    Tenant ||--o{ Contact : "contains"
    Tenant ||--o{ TenantSetting : "has settings"

    Organization ||--|| Party : "is a"
    Organization ||--o{ Membership : "has members"
    Organization ||--o{ Contact : "has contacts"

    Contact ||--o| Party : "is a"

    Party ||--o{ PartyCommPreference : "has prefs"
    Party ||--o{ PartyCommPreferenceEvent : "has events"

    User ||--o{ TenantMembership : "belongs to"
    User ||--o{ Membership : "belongs to"
```

## DBML

```dbml
// Tenants & Organizations Domain

Table Tenant {
  id int [pk, increment]
  name varchar [not null]
  slug varchar [unique]
  primaryEmail varchar
  operationType TenantOperationType [default: 'HOBBY']
  availabilityPrefs json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table TenantMembership {
  userId varchar [not null, ref: > User.id]
  tenantId int [not null, ref: > Tenant.id]
  role TenantRole [default: 'MEMBER']
  membershipRole TenantMembershipRole [default: 'STAFF']
  membershipStatus TenantMembershipStatus [default: 'ACTIVE']
  partyId int [ref: > Party.id]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (userId, tenantId) [pk]
  }
}

Table TenantSetting {
  tenantId int [not null, ref: > Tenant.id]
  namespace varchar [not null]
  version int [default: 1]
  data json [not null]
  updatedBy varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, namespace) [pk]
  }
}

Table BillingAccount {
  id int [pk, increment]
  tenantId int [unique, not null, ref: - Tenant.id]
  provider varchar
  customerId varchar
  subscriptionId varchar
  plan varchar
  status varchar
  currentPeriodEnd timestamp
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table Organization {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  partyId int [unique, not null, ref: - Party.id]
  name varchar [not null]
  email varchar
  phone varchar
  website varchar
  street varchar
  street2 varchar
  city varchar
  state varchar
  zip varchar
  country varchar
  archived boolean [default: false]
  programSlug varchar
  isPublicProgram boolean [default: false]
  programBio text
  publicContactEmail varchar
  externalProvider varchar
  externalId varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, name) [unique]
    (tenantId, programSlug) [unique]
  }
}

Table Membership {
  userId varchar [not null, ref: > User.id]
  organizationId int [not null, ref: > Organization.id]
  role MembershipRole [default: 'MEMBER']

  indexes {
    (userId, organizationId) [pk]
  }
}

Table Party {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  type PartyType [not null]
  name varchar [not null]
  email varchar
  phoneE164 varchar(32)
  whatsappE164 varchar(32)
  street varchar
  street2 varchar
  city varchar
  state varchar
  postalCode varchar
  country char(2)
  archived boolean [default: false]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table Contact {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  organizationId int [ref: > Organization.id]
  partyId int [unique, ref: - Party.id]
  display_name varchar [not null]
  first_name varchar
  last_name varchar
  nickname varchar
  email varchar
  phoneE164 varchar(32)
  whatsappE164 varchar(32)
  street varchar
  street2 varchar
  city varchar
  state varchar
  zip varchar
  country char(2)
  archived boolean [default: false]
  externalProvider varchar
  externalId varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (tenantId, email) [unique]
  }
}

Table PartyCommPreference {
  id int [pk, increment]
  partyId int [not null, ref: > Party.id]
  channel CommChannel [not null]
  preference PreferenceLevel [default: 'ALLOW']
  compliance ComplianceStatus
  complianceSetAt timestamp
  complianceSource varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp

  indexes {
    (partyId, channel) [unique]
  }
}

Table PartyCommPreferenceEvent {
  id int [pk, increment]
  partyId int [not null, ref: > Party.id]
  channel CommChannel [not null]
  prevPreference PreferenceLevel
  newPreference PreferenceLevel
  prevCompliance ComplianceStatus
  newCompliance ComplianceStatus
  actorPartyId int
  reason varchar
  source varchar
  createdAt timestamp [default: `now()`]
}

Enum TenantOperationType {
  HOBBY
  COMMERCIAL
  PERFORMANCE
}

Enum TenantRole {
  OWNER
  ADMIN
  MEMBER
  BILLING
  VIEWER
}

Enum TenantMembershipRole {
  STAFF
  CLIENT
}

Enum TenantMembershipStatus {
  INVITED
  ACTIVE
  SUSPENDED
}

Enum PartyType {
  CONTACT
  ORGANIZATION
}

Enum CommChannel {
  EMAIL
  SMS
  PHONE
  MAIL
  WHATSAPP
}

Enum PreferenceLevel {
  ALLOW
  NOT_PREFERRED
  NEVER
}

Enum ComplianceStatus {
  SUBSCRIBED
  UNSUBSCRIBED
}
```
