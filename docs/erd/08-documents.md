# Documents & Contracts Domain

## Mermaid ERD

```mermaid
erDiagram
    Document {
        int id PK
        int tenantId FK
        enum scope
        enum kind
        int animalId FK
        int ownershipChangeId FK
        int offspringId FK
        int groupId FK
        int invoiceId FK_UK
        int contractId FK
        string title
        string storageKey
        string externalUrl
        string mimeType
        int bytes
        string sha256
        json data
        enum visibility
        enum status
        int sizeBytes
        string originalFileName
        string storageProvider
        string bucket
        string objectKey
        string url
        datetime createdAt
        datetime updatedAt
    }

    Attachment {
        int id PK
        int tenantId FK
        int planId FK
        int animalId FK
        int litterId FK
        int offspringGroupId FK
        int offspringId FK
        int attachmentPartyId FK
        int invoiceId FK
        int paymentId FK
        int expenseId FK
        string kind
        string storageProvider
        string storageKey
        string filename
        string mime
        int bytes
        string createdByUserId FK
        datetime createdAt
    }

    ContractTemplate {
        int id PK
        int tenantId FK
        string name
        string body
        string storageKey
        string description
        boolean isActive
        json data
        datetime createdAt
        datetime updatedAt
    }

    Contract {
        int id PK
        int tenantId FK
        int templateId FK
        int offspringId FK
        int groupId FK
        int invoiceId FK_UK
        string title
        enum status
        enum provider
        string providerEnvelopeId
        string providerDocId
        datetime issuedAt
        datetime signedAt
        datetime voidedAt
        datetime expiresAt
        json data
        datetime createdAt
        datetime updatedAt
    }

    ContractParty {
        int id PK
        int tenantId FK
        int contractId FK
        string userId FK
        int partyId FK
        string role
        string email
        string name
        boolean signer
        int order
        enum status
        datetime signedAt
        string providerRecipientId
        json data
        datetime createdAt
        datetime updatedAt
    }

    SignatureEvent {
        int id PK
        int tenantId FK
        int contractId FK
        int partyId FK
        enum status
        datetime at
        string ipAddress
        string userAgent
        string message
        json data
    }

    OffspringDocument {
        int id PK
        int tenantId FK
        int offspringId FK
        string name
        string templateId
        enum provider
        enum status
        datetime sentAt
        datetime viewedAt
        datetime completedAt
        int fileId FK
        json metaJson
        datetime createdAt
        datetime updatedAt
    }

    OffspringContract {
        int id PK
        int tenantId FK
        int offspringId FK
        string title
        string version
        enum provider
        enum status
        datetime sentAt
        datetime viewedAt
        datetime signedAt
        int fileId FK
        int buyerPartyId FK
        json metaJson
        datetime createdAt
        datetime updatedAt
    }

    Contract ||--o{ ContractParty : "has parties"
    Contract ||--o{ SignatureEvent : "has events"
    Contract ||--o{ Document : "has documents"
    Contract }o--|| ContractTemplate : "from template"
    Contract }o--|| Offspring : "for offspring"
    Contract }o--|| OffspringGroup : "for group"
    Contract }o--|| Invoice : "for invoice"

    ContractParty ||--o{ SignatureEvent : "has events"
    ContractParty }o--|| User : "is user"
    ContractParty }o--|| Party : "is party"

    Document }o--|| Animal : "for animal"
    Document }o--|| AnimalOwnershipChange : "for change"
    Document }o--|| Offspring : "for offspring"
    Document }o--|| OffspringGroup : "for group"
    Document }o--|| Invoice : "for invoice"
    Document }o--|| Contract : "for contract"

    OffspringDocument }o--|| Offspring : "for"
    OffspringDocument }o--|| Attachment : "file"

    OffspringContract }o--|| Offspring : "for"
    OffspringContract }o--|| Attachment : "file"
    OffspringContract }o--|| Party : "buyer"

    Attachment }o--|| BreedingPlan : "for plan"
    Attachment }o--|| Animal : "for animal"
    Attachment }o--|| Litter : "for litter"
    Attachment }o--|| OffspringGroup : "for group"
    Attachment }o--|| Offspring : "for offspring"
    Attachment }o--|| Party : "for party"
    Attachment }o--|| Invoice : "for invoice"
    Attachment }o--|| Payment : "for payment"
    Attachment }o--|| Expense : "for expense"
    Attachment }o--|| User : "created by"

    Tenant ||--o{ Document : "has"
    Tenant ||--o{ Attachment : "has"
    Tenant ||--o{ ContractTemplate : "has"
    Tenant ||--o{ Contract : "has"
```

## DBML

```dbml
// Documents & Contracts Domain

Table Document {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  scope DocumentScope [not null]
  kind DocumentKind [default: 'generic']
  animalId int [ref: > Animal.id]
  ownershipChangeId int [ref: > AnimalOwnershipChange.id]
  offspringId int [ref: > Offspring.id]
  groupId int [ref: > OffspringGroup.id]
  invoiceId int [unique, ref: - Invoice.id]
  contractId int [ref: > Contract.id]
  title varchar [not null]
  storageKey varchar
  externalUrl varchar
  mimeType varchar
  bytes int
  sha256 varchar
  data json
  visibility DocVisibility [default: 'PRIVATE']
  status DocStatus [default: 'PLACEHOLDER']
  sizeBytes int
  originalFileName varchar
  storageProvider varchar
  bucket varchar
  objectKey varchar
  url varchar
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table Attachment {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  planId int [ref: > BreedingPlan.id]
  animalId int [ref: > Animal.id]
  litterId int [ref: > Litter.id]
  offspringGroupId int [ref: > OffspringGroup.id]
  offspringId int [ref: > Offspring.id]
  attachmentPartyId int [ref: > Party.id]
  invoiceId int [ref: > Invoice.id]
  paymentId int [ref: > Payment.id]
  expenseId int [ref: > Expense.id]
  kind varchar [not null]
  storageProvider varchar [not null]
  storageKey varchar [not null]
  filename varchar [not null]
  mime varchar [not null]
  bytes int [not null]
  createdByUserId varchar [ref: > User.id]
  createdAt timestamp [default: `now()`]
}

Table ContractTemplate {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  name varchar [not null]
  body varchar
  storageKey varchar
  description varchar
  isActive boolean [default: true]
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table Contract {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  templateId int [ref: > ContractTemplate.id]
  offspringId int [ref: > Offspring.id]
  groupId int [ref: > OffspringGroup.id]
  invoiceId int [unique, ref: - Invoice.id]
  title varchar [not null]
  status ContractStatus [default: 'draft']
  provider SignatureProvider [default: 'internal']
  providerEnvelopeId varchar
  providerDocId varchar
  issuedAt timestamp
  signedAt timestamp
  voidedAt timestamp
  expiresAt timestamp
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table ContractParty {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  contractId int [not null, ref: > Contract.id]
  userId varchar [ref: > User.id]
  partyId int [ref: > Party.id]
  role varchar
  email varchar
  name varchar
  signer boolean [default: true]
  order int
  status SignatureStatus [default: 'pending']
  signedAt timestamp
  providerRecipientId varchar
  data json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table SignatureEvent {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  contractId int [not null, ref: > Contract.id]
  partyId int [ref: > ContractParty.id]
  status SignatureStatus [not null]
  at timestamp [default: `now()`]
  ipAddress varchar
  userAgent varchar
  message varchar
  data json
}

Table OffspringDocument {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  offspringId int [not null, ref: > Offspring.id]
  name varchar [not null]
  templateId varchar
  provider EsignProvider
  status EsignStatus [default: 'DRAFT']
  sentAt timestamp
  viewedAt timestamp
  completedAt timestamp
  fileId int [ref: > Attachment.id]
  metaJson json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Table OffspringContract {
  id int [pk, increment]
  tenantId int [not null, ref: > Tenant.id]
  offspringId int [not null, ref: > Offspring.id]
  title varchar [not null]
  version varchar
  provider EsignProvider
  status EsignStatus [default: 'DRAFT']
  sentAt timestamp
  viewedAt timestamp
  signedAt timestamp
  fileId int [ref: > Attachment.id]
  buyerPartyId int [ref: > Party.id]
  metaJson json
  createdAt timestamp [default: `now()`]
  updatedAt timestamp
}

Enum DocumentScope {
  group
  offspring
  invoice
  contract
  animal
}

Enum DocumentKind {
  generic
  health_certificate
  registration
  contract_pdf
  invoice_pdf
  photo
  other
  bill_of_sale
  syndication_agreement
  lease_agreement
  insurance_policy
  vet_certificate
}

Enum DocVisibility {
  PRIVATE
  BUYERS
  PUBLIC
}

Enum DocStatus {
  PLACEHOLDER
  UPLOADING
  READY
  FAILED
}

Enum ContractStatus {
  draft
  sent
  viewed
  signed
  declined
  voided
  expired
}

Enum SignatureProvider {
  internal
  docusign
  hellosign
  adobe
  other
}

Enum SignatureStatus {
  pending
  viewed
  signed
  declined
  voided
  expired
}

Enum EsignProvider {
  DOCUSIGN
  HELLOSIGN
  ADOBE
  OTHER
}

Enum EsignStatus {
  DRAFT
  SENT
  VIEWED
  SIGNED
  DECLINED
  EXPIRED
  VOIDED
}
```
