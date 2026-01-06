# Optimized Mermaid Diagrams for Confluence

These diagrams include full detail but are optimized to render in Confluence's Mermaid plugin.

---

## 1. Master ERD

```
erDiagram
    User ||--o{ TenantMembership : belongs
    User ||--o{ Session : has
    Tenant ||--o{ TenantMembership : members
    Tenant ||--o{ Organization : contains
    Tenant ||--o{ Party : contains
    Tenant ||--o{ Animal : contains
    Tenant ||--o{ BreedingPlan : contains
    Tenant ||--o{ OffspringGroup : contains
    Tenant ||--o{ Invoice : contains
    Tenant ||--o{ Tag : defines
    Organization ||--|| Party : is
    Contact ||--o| Party : is
    Party ||--o{ WaitlistEntry : client
    Party ||--o{ Invoice : billed
    Party ||--o{ ContractParty : signs
    Party ||--o{ AnimalOwner : owns
    Animal ||--o{ AnimalOwner : ownedBy
    Animal ||--o{ BreedingPlan : damOrSire
    Animal ||--o| AnimalPublicListing : listed
    BreedingPlan ||--o| OffspringGroup : produces
    BreedingPlan ||--o{ BreedingAttempt : attempts
    OffspringGroup ||--o{ Offspring : contains
    OffspringGroup ||--o{ WaitlistEntry : waitlist
    Offspring ||--o{ Invoice : billed
    Offspring ||--o{ Contract : contracted
    Offspring }o--o| Animal : promotedTo
    Invoice ||--o{ InvoiceLineItem : lines
    Invoice ||--o{ Payment : payments
    Contract ||--o{ ContractParty : signers
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
        string purpose
        datetime expires
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
        string key
        string status
    }
    User ||--o{ Session : has
    User ||--o{ Passkey : has
    User ||--o{ RecoveryCode : has
    User ||--o{ VerificationToken : has
    User ||--o{ TosAcceptance : accepts
    User ||--o{ UserEntitlement : has
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
        string operationType
    }
    TenantMembership {
        string oderId PK
        int tenantId PK
        string role
        string membershipRole
        string membershipStatus
    }
    BillingAccount {
        int id PK
        int tenantId FK
        string provider
        string customerId
        string subscriptionId
    }
    Organization {
        int id PK
        int tenantId FK
        int partyId FK
        string name
        string programSlug
        boolean isPublicProgram
    }
    Party {
        int id PK
        int tenantId FK
        string type
        string name
        string email
        string phoneE164
    }
    Contact {
        int id PK
        int tenantId FK
        int partyId FK
        string display_name
        string email
    }
    Tenant ||--o{ TenantMembership : members
    Tenant ||--o| BillingAccount : billing
    Tenant ||--o{ Organization : contains
    Tenant ||--o{ Party : contains
    Tenant ||--o{ Contact : contains
    Organization ||--|| Party : is
    Organization ||--o{ Contact : has
    Contact ||--o| Party : is
    User ||--o{ TenantMembership : belongs
```

---

## 4. Animals

```
erDiagram
    Animal {
        int id PK
        int tenantId FK
        string name
        string species
        string sex
        string status
        datetime birthDate
        string microchip
        int canonicalBreedId FK
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
        string species
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
        string species
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
        string scope
        string status
    }
    AnimalPublicListing {
        int id PK
        int animalId FK
        string urlSlug UK
        string intent
        string status
    }
    Animal ||--o{ AnimalOwner : ownedBy
    Animal ||--o{ AnimalBreed : breeds
    Animal ||--o{ AnimalRegistryIdentifier : registered
    Animal ||--o{ AnimalShare : shared
    Animal ||--o| AnimalPublicListing : listing
    Animal }o--|| Breed : canonicalBreed
    AnimalBreed }o--|| Breed : is
    AnimalRegistryIdentifier }o--|| Registry : at
    Party ||--o{ AnimalOwner : owns
```

---

## 5. Traits System

```
erDiagram
    TraitDefinition {
        int id PK
        int tenantId FK
        string species
        string key
        string displayName
        string category
        string valueType
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
        string status
        string source
        boolean verified
    }
    AnimalTraitValueDocument {
        int id PK
        int animalTraitValueId FK
        int documentId FK
    }
    TraitDefinition ||--o{ AnimalTraitValue : defines
    Animal ||--o{ AnimalTraitValue : has
    AnimalTraitValue ||--o{ AnimalTraitValueDocument : docs
    Document ||--o{ AnimalTraitValueDocument : linked
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
        string species
        int damId FK
        int sireId FK
        datetime expectedBirthDate
        string status
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
        string method
        datetime attemptAt
        int studOwnerPartyId FK
        boolean success
    }
    PregnancyCheck {
        int id PK
        int planId FK
        string method
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
    BreedingPlan ||--o{ BreedingAttempt : attempts
    BreedingPlan ||--o{ PregnancyCheck : checks
    BreedingPlan ||--o{ TestResult : tests
    BreedingPlan ||--o{ PlanParty : parties
    BreedingPlan }o--|| Animal : dam
    BreedingPlan }o--|| Animal : sire
    BreedingPlan ||--o| OffspringGroup : produces
    Animal ||--o{ ReproductiveCycle : cycles
```

---

## 7. Offspring & Litters

```
erDiagram
    OffspringGroup {
        int id PK
        int tenantId FK
        int planId FK
        string species
        int damId FK
        int sireId FK
        string name
        datetime actualBirthOn
        int countBorn
        int countPlaced
        boolean published
        string listingSlug
    }
    Offspring {
        int id PK
        int groupId FK
        string name
        string species
        string sex
        datetime bornAt
        string lifeState
        string placementState
        string keeperIntent
        string financialState
        string paperworkState
        int buyerPartyId FK
        int priceCents
    }
    WaitlistEntry {
        int id PK
        int tenantId FK
        int offspringGroupId FK
        int clientPartyId FK
        string status
        int priority
        int depositPaidCents
        int offspringId FK
    }
    OffspringGroupBuyer {
        int id PK
        int groupId FK
        int buyerPartyId FK
        int placementRank
    }
    OffspringGroup ||--o{ Offspring : contains
    OffspringGroup ||--o{ WaitlistEntry : waitlist
    OffspringGroup ||--o{ OffspringGroupBuyer : buyers
    OffspringGroup }o--|| BreedingPlan : from
    Offspring }o--|| Party : buyer
    Offspring }o--o| Animal : promotedTo
    Offspring ||--o{ WaitlistEntry : allocated
    WaitlistEntry }o--|| Party : client
```

---

## 8. Finance

```
erDiagram
    Invoice {
        int id PK
        int tenantId FK
        string scope
        int groupId FK
        int offspringId FK
        int clientPartyId FK
        string invoiceNumber UK
        int amountCents
        int balanceCents
        string status
        string category
        datetime dueAt
        datetime paidAt
    }
    InvoiceLineItem {
        int id PK
        int invoiceId FK
        string kind
        string description
        int qty
        int unitCents
        int totalCents
    }
    Payment {
        int id PK
        int invoiceId FK
        string status
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
        string category
        int vendorPartyId FK
        int breedingPlanId FK
        int offspringGroupId FK
    }
    Invoice ||--o{ InvoiceLineItem : lines
    Invoice ||--o{ Payment : payments
    Invoice }o--|| Party : client
    Invoice }o--|| OffspringGroup : group
    Invoice }o--|| Offspring : offspring
    Expense }o--|| Party : vendor
    Expense }o--|| BreedingPlan : plan
    Expense }o--|| OffspringGroup : group
```

---

## 9. Documents & Contracts

```
erDiagram
    Document {
        int id PK
        int tenantId FK
        string scope
        string kind
        int animalId FK
        int offspringId FK
        int contractId FK
        string title
        string storageKey
        string visibility
        string status
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
        int invoiceId FK
        string title
        string status
        string provider
        datetime signedAt
    }
    ContractParty {
        int id PK
        int contractId FK
        int partyId FK
        string role
        boolean signer
        string status
        datetime signedAt
    }
    SignatureEvent {
        int id PK
        int contractId FK
        int partyId FK
        string status
        datetime at
        string ipAddress
    }
    Contract }o--|| ContractTemplate : from
    Contract ||--o{ ContractParty : parties
    Contract ||--o{ SignatureEvent : events
    Contract ||--o{ Document : docs
    ContractParty ||--o{ SignatureEvent : events
    ContractParty }o--|| Party : is
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
        string status
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
        string status
    }
    SchedulingSlot {
        int id PK
        int blockId FK
        datetime startsAt
        datetime endsAt
        int capacity
        int bookedCount
        string status
        string mode
    }
    SchedulingBooking {
        int id PK
        int slotId FK
        int partyId FK
        string status
        datetime bookedAt
        datetime cancelledAt
    }
    SchedulingEventTemplate ||--o{ SchedulingAvailabilityBlock : blocks
    SchedulingAvailabilityBlock ||--o{ SchedulingSlot : slots
    SchedulingSlot ||--o{ SchedulingBooking : bookings
    SchedulingBooking }o--|| Party : bookedBy
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
        string channel
        string category
        string status
    }
    AutoReplyRule {
        int id PK
        int tenantId FK
        string channel
        boolean enabled
        int templateId FK
        string triggerType
    }
    Campaign {
        int id PK
        int tenantId FK
        int offspringGroupId FK
        string name
        string channel
        int budgetCents
        int conversions
    }
    MessageThread ||--o{ MessageParticipant : participants
    MessageThread ||--o{ Message : messages
    MessageParticipant }o--|| Party : is
    Message }o--|| Party : sender
    Template ||--o{ AutoReplyRule : rules
    Campaign }o--|| OffspringGroup : for
```

---

## 12. Portal Access & Audit

```
erDiagram
    PortalAccess {
        int id PK
        int tenantId FK
        int partyId FK
        string status
        string oderId FK
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
        string oderId
        string surface
        string actorContext
        int tenantId
        string action
        string outcome
    }
    Tag {
        int id PK
        int tenantId FK
        string name
        string module
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
    PortalAccess ||--|| Party : for
    PortalAccess }o--|| User : linked
    PortalInvite }o--|| Party : for
    Tag ||--o{ TagAssignment : has
    TagAssignment }o--|| Party : tagsParty
    TagAssignment }o--|| Animal : tagsAnimal
    TagAssignment }o--|| Offspring : tagsOffspring
```
