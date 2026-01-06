# Mermaid Diagrams for Confluence

Instructions: For each diagram below, insert a Mermaid macro in Confluence (`/mermaid`) and paste the code.

---

## 1. Master ERD

```
erDiagram
    User ||--o{ TenantMembership : "belongs to"
    User ||--o{ Session : "has"
    User ||--o{ Passkey : "has"

    Tenant ||--o{ TenantMembership : "has members"
    Tenant ||--o{ Organization : "contains"
    Tenant ||--o{ Party : "contains"
    Tenant ||--o{ Animal : "contains"
    Tenant ||--o{ BreedingPlan : "contains"
    Tenant ||--o{ OffspringGroup : "contains"
    Tenant ||--o{ Invoice : "contains"
    Tenant ||--o{ Contract : "contains"
    Tenant ||--o{ Tag : "defines"

    Organization ||--|| Party : "is a"
    Contact ||--o| Party : "is a"

    Party ||--o{ WaitlistEntry : "client"
    Party ||--o{ Invoice : "billed to"
    Party ||--o{ ContractParty : "signs"
    Party ||--o{ AnimalOwner : "owns"
    Party ||--o{ MessageParticipant : "messages"

    Animal ||--o{ AnimalOwner : "owned by"
    Animal ||--o{ BreedingPlan : "dam/sire"
    Animal ||--o{ AnimalTraitValue : "has traits"
    Animal ||--o| AnimalPublicListing : "listed"

    BreedingPlan ||--o| OffspringGroup : "produces"
    BreedingPlan ||--o{ BreedingAttempt : "has attempts"
    BreedingPlan ||--o{ PregnancyCheck : "has checks"

    OffspringGroup ||--o{ Offspring : "contains"
    OffspringGroup ||--o{ WaitlistEntry : "waitlist"

    Offspring ||--o{ Invoice : "billed"
    Offspring ||--o{ Contract : "contracted"
    Offspring ||--o{ HealthEvent : "health logs"
    Offspring }o--o| Animal : "promoted to"

    Invoice ||--o{ InvoiceLineItem : "has lines"
    Invoice ||--o{ Payment : "has payments"
    Invoice ||--o| Contract : "has contract"

    Contract ||--o{ ContractParty : "has signers"
    Contract ||--o{ SignatureEvent : "has events"
```

---

## 2. Users & Authentication

```
erDiagram
    User {
        string id PK
        string email UK
        string firstName
        string lastName
        string passwordHash
        boolean isSuperAdmin
        datetime emailVerifiedAt
        int partyId FK
        int defaultTenantId FK
    }

    Session {
        string id PK
        string userId FK
        datetime expires
        string sessionToken UK
    }

    Passkey {
        string id PK
        string userId FK
        string credentialId UK
        string publicKey
        int counter
    }

    RecoveryCode {
        string id PK
        string userId FK
        string code UK
        boolean used
    }

    VerificationToken {
        string identifier
        string tokenHash UK
        enum purpose
        datetime expires
        string userId FK
    }

    TosAcceptance {
        int id PK
        string userId FK
        string version
        datetime acceptedAt
    }

    UserEntitlement {
        int id PK
        string userId FK
        enum key
        enum status
    }

    User ||--o{ Session : "has"
    User ||--o{ Passkey : "has"
    User ||--o{ RecoveryCode : "has"
    User ||--o{ VerificationToken : "has"
    User ||--o{ TosAcceptance : "accepts"
    User ||--o{ UserEntitlement : "has"
```

---

## 3. Tenants & Organizations

```
erDiagram
    Tenant {
        int id PK
        string name
        string slug UK
        string primaryEmail
        enum operationType
    }

    TenantMembership {
        string userId PK_FK
        int tenantId PK_FK
        enum role
        enum membershipRole
        enum membershipStatus
        int partyId FK
    }

    BillingAccount {
        int id PK
        int tenantId FK_UK
        string provider
        string customerId
        string subscriptionId
    }

    Organization {
        int id PK
        int tenantId FK
        int partyId FK_UK
        string name
        string programSlug
        boolean isPublicProgram
    }

    Party {
        int id PK
        int tenantId FK
        enum type
        string name
        string email
        string phoneE164
        boolean archived
    }

    Contact {
        int id PK
        int tenantId FK
        int partyId FK_UK
        string display_name
        string email
        string phoneE164
    }

    Tenant ||--o{ TenantMembership : "has members"
    Tenant ||--o| BillingAccount : "has billing"
    Tenant ||--o{ Organization : "contains"
    Tenant ||--o{ Party : "contains"
    Tenant ||--o{ Contact : "contains"

    Organization ||--|| Party : "is a"
    Organization ||--o{ Contact : "has contacts"
    Contact ||--o| Party : "is a"

    User ||--o{ TenantMembership : "belongs to"
```

---

## 4. Animals

```
erDiagram
    Animal {
        int id PK
        int tenantId FK
        int organizationId FK
        string name
        enum species
        enum sex
        enum status
        datetime birthDate
        string microchip
        int canonicalBreedId FK
        int customBreedId FK
        int buyerPartyId FK
    }

    AnimalOwner {
        int id PK
        int animalId FK
        int partyId FK
        int percent
        boolean isPrimary
    }

    Breed {
        int id PK
        string name UK
        string slug UK
        enum species
    }

    AnimalBreed {
        int id PK
        int animalId FK
        int breedId FK
        float percentage
    }

    Registry {
        int id PK
        string name
        string code UK
        enum species
    }

    AnimalRegistryIdentifier {
        int id PK
        int animalId FK
        int registryId FK
        string identifier
    }

    AnimalShare {
        int id PK
        int animalId FK
        int fromTenantId FK
        int toTenantId FK
        enum scope
        enum status
    }

    AnimalPublicListing {
        int id PK
        int animalId FK_UK
        int tenantId FK
        string urlSlug UK
        enum intent
        enum status
    }

    Animal ||--o{ AnimalOwner : "owned by"
    Animal ||--o{ AnimalBreed : "has breeds"
    Animal ||--o{ AnimalRegistryIdentifier : "registered with"
    Animal ||--o{ AnimalShare : "shared"
    Animal ||--o| AnimalPublicListing : "has listing"
    Animal }o--|| Breed : "canonical breed"
    AnimalBreed }o--|| Breed : "references"
    AnimalRegistryIdentifier }o--|| Registry : "references"
    Party ||--o{ AnimalOwner : "owns"
```

---

## 5. Traits System

```
erDiagram
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
        enum source
        boolean verified
        boolean marketplaceVisible
    }

    AnimalTraitValueDocument {
        int id PK
        int animalTraitValueId FK
        int documentId FK
    }

    TraitDefinition ||--o{ AnimalTraitValue : "defines"
    Animal ||--o{ AnimalTraitValue : "has traits"
    AnimalTraitValue ||--o{ AnimalTraitValueDocument : "has docs"
    Document ||--o{ AnimalTraitValueDocument : "linked"
```

---

## 6. Breeding

```
erDiagram
    BreedingPlan {
        int id PK
        int tenantId FK
        string code UK
        string name
        enum species
        int damId FK
        int sireId FK
        datetime expectedCycleStart
        datetime expectedBirthDate
        datetime expectedWeaned
        enum status
        datetime committedAt
    }

    ReproductiveCycle {
        int id PK
        int tenantId FK
        int femaleId FK
        datetime cycleStart
        datetime ovulation
        datetime dueDate
    }

    BreedingAttempt {
        int id PK
        int planId FK
        enum method
        datetime attemptAt
        int studOwnerPartyId FK
        boolean success
    }

    PregnancyCheck {
        int id PK
        int planId FK
        enum method
        boolean result
        datetime checkedAt
    }

    TestResult {
        int id PK
        int planId FK
        int animalId FK
        string kind
        float valueNumber
        datetime collectedAt
    }

    PlanParty {
        int id PK
        int planId FK
        int partyId FK
        string role
    }

    BreedingPlan ||--o{ BreedingAttempt : "has attempts"
    BreedingPlan ||--o{ PregnancyCheck : "has checks"
    BreedingPlan ||--o{ TestResult : "has tests"
    BreedingPlan ||--o{ PlanParty : "has parties"
    BreedingPlan }o--|| Animal : "dam"
    BreedingPlan }o--|| Animal : "sire"
    BreedingPlan ||--o| OffspringGroup : "produces"
    Animal ||--o{ ReproductiveCycle : "has cycles"
```

---

## 7. Offspring & Litters

```
erDiagram
    OffspringGroup {
        int id PK
        int tenantId FK
        int planId FK_UK
        enum species
        int damId FK
        int sireId FK
        string name
        datetime actualBirthOn
        int countBorn
        int countLive
        int countWeaned
        int countPlaced
        boolean published
        string listingSlug
    }

    Offspring {
        int id PK
        int groupId FK
        string name
        enum species
        enum sex
        datetime bornAt
        enum status
        enum lifeState
        enum placementState
        enum keeperIntent
        enum financialState
        enum paperworkState
        int buyerPartyId FK
        int priceCents
        int promotedAnimalId FK
    }

    WaitlistEntry {
        int id PK
        int tenantId FK
        int planId FK
        int offspringGroupId FK
        int clientPartyId FK
        enum status
        int priority
        int depositPaidCents
        int offspringId FK
    }

    OffspringGroupBuyer {
        int id PK
        int groupId FK
        int buyerPartyId FK
        int waitlistEntryId FK
        int placementRank
    }

    OffspringGroup ||--o{ Offspring : "contains"
    OffspringGroup ||--o{ WaitlistEntry : "has waitlist"
    OffspringGroup ||--o{ OffspringGroupBuyer : "has buyers"
    OffspringGroup }o--|| BreedingPlan : "from plan"

    Offspring }o--|| Party : "buyer"
    Offspring }o--o| Animal : "promoted to"
    Offspring ||--o{ WaitlistEntry : "allocated"

    WaitlistEntry }o--|| Party : "client"
```

---

## 8. Finance

```
erDiagram
    Invoice {
        int id PK
        int tenantId FK
        enum scope
        int groupId FK
        int offspringId FK
        int clientPartyId FK
        string invoiceNumber UK
        int amountCents
        int balanceCents
        enum status
        enum category
        datetime dueAt
        datetime paidAt
    }

    InvoiceLineItem {
        int id PK
        int invoiceId FK
        enum kind
        string description
        int qty
        int unitCents
        int totalCents
    }

    Payment {
        int id PK
        int invoiceId FK
        enum status
        int amountCents
        datetime receivedAt
        string methodType
        string processor
    }

    Expense {
        int id PK
        int tenantId FK
        int amountCents
        datetime incurredAt
        enum category
        int vendorPartyId FK
        int breedingPlanId FK
        int offspringGroupId FK
        int animalId FK
    }

    Invoice ||--o{ InvoiceLineItem : "has lines"
    Invoice ||--o{ Payment : "has payments"
    Invoice }o--|| Party : "client"
    Invoice }o--|| OffspringGroup : "for group"
    Invoice }o--|| Offspring : "for offspring"

    Expense }o--|| Party : "vendor"
    Expense }o--|| BreedingPlan : "for plan"
    Expense }o--|| OffspringGroup : "for group"
```

---

## 9. Documents & Contracts

```
erDiagram
    Document {
        int id PK
        int tenantId FK
        enum scope
        enum kind
        int animalId FK
        int offspringId FK
        int groupId FK
        int invoiceId FK
        int contractId FK
        string title
        string storageKey
        enum visibility
        enum status
    }

    ContractTemplate {
        int id PK
        int tenantId FK
        string name
        string body
        boolean isActive
    }

    Contract {
        int id PK
        int tenantId FK
        int templateId FK
        int offspringId FK
        int groupId FK
        int invoiceId FK
        string title
        enum status
        enum provider
        datetime signedAt
    }

    ContractParty {
        int id PK
        int contractId FK
        int partyId FK
        string role
        boolean signer
        enum status
        datetime signedAt
    }

    SignatureEvent {
        int id PK
        int contractId FK
        int partyId FK
        enum status
        datetime at
        string ipAddress
    }

    Attachment {
        int id PK
        int tenantId FK
        int planId FK
        int animalId FK
        int offspringId FK
        int invoiceId FK
        string kind
        string storageKey
        string filename
        string mime
        int bytes
    }

    Contract }o--|| ContractTemplate : "from"
    Contract ||--o{ ContractParty : "has parties"
    Contract ||--o{ SignatureEvent : "has events"
    Contract ||--o{ Document : "has documents"
    ContractParty ||--o{ SignatureEvent : "has events"
```

---

## 10. Scheduling

```
erDiagram
    SchedulingEventTemplate {
        int id PK
        int tenantId FK
        string name
        string eventType
        enum status
        int defaultDurationMinutes
        int defaultCapacity
        boolean canCancel
        boolean canReschedule
    }

    SchedulingAvailabilityBlock {
        int id PK
        int tenantId FK
        int templateId FK
        int offspringGroupId FK
        datetime startAt
        datetime endAt
        string timezone
        enum status
    }

    SchedulingSlot {
        int id PK
        int blockId FK
        datetime startsAt
        datetime endsAt
        int capacity
        int bookedCount
        enum status
        enum mode
    }

    SchedulingBooking {
        int id PK
        int slotId FK
        int partyId FK
        enum status
        datetime bookedAt
        datetime cancelledAt
        int rescheduledFromId FK
    }

    SchedulingEventTemplate ||--o{ SchedulingAvailabilityBlock : "has blocks"
    SchedulingAvailabilityBlock ||--o{ SchedulingSlot : "contains slots"
    SchedulingSlot ||--o{ SchedulingBooking : "has bookings"
    SchedulingBooking }o--|| Party : "booked by"
```

---

## 11. Marketing & Messaging

```
erDiagram
    MessageThread {
        int id PK
        int tenantId FK
        string subject
        boolean archived
        string inquiryType
        datetime lastMessageAt
    }

    MessageParticipant {
        int id PK
        int threadId FK
        int partyId FK
        datetime lastReadAt
    }

    Message {
        int id PK
        int threadId FK
        int senderPartyId FK
        string body
        boolean isAutomated
    }

    Template {
        int id PK
        int tenantId FK
        string name
        enum channel
        enum category
        enum status
    }

    AutoReplyRule {
        int id PK
        int tenantId FK
        enum channel
        boolean enabled
        int templateId FK
        enum triggerType
        int cooldownMinutes
    }

    Campaign {
        int id PK
        int tenantId FK
        int offspringGroupId FK
        string name
        enum channel
        int budgetCents
        int spendCents
        int conversions
    }

    MessageThread ||--o{ MessageParticipant : "has participants"
    MessageThread ||--o{ Message : "contains"
    MessageParticipant }o--|| Party : "is party"
    Message }o--|| Party : "sent by"

    Template ||--o{ AutoReplyRule : "used by"
    Campaign }o--|| OffspringGroup : "for group"
```

---

## 12. Portal Access & Audit

```
erDiagram
    PortalAccess {
        int id PK
        int tenantId FK
        int partyId FK_UK
        enum status
        string userId FK
        datetime activatedAt
        datetime lastLoginAt
    }

    PortalInvite {
        int id PK
        int tenantId FK
        int partyId FK
        string emailNorm
        string tokenHash UK
        datetime expiresAt
        datetime usedAt
    }

    AuditEvent {
        int id PK
        datetime createdAt
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
    }

    TagAssignment {
        int id PK
        int tagId FK
        int taggedPartyId FK
        int animalId FK
        int offspringId FK
    }

    PortalAccess ||--|| Party : "for party"
    PortalAccess }o--|| User : "linked user"

    PortalInvite }o--|| Party : "for party"

    Tag ||--o{ TagAssignment : "has"
    TagAssignment }o--|| Party : "tags"
    TagAssignment }o--|| Animal : "tags"
    TagAssignment }o--|| Offspring : "tags"
```
