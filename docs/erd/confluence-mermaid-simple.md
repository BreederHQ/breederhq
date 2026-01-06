# Simplified Mermaid Diagrams for Confluence

These are simplified versions that should work better with Confluence's Mermaid plugin.

---

## 1. Master ERD (Simplified)

```
erDiagram
    User ||--o{ TenantMembership : has
    Tenant ||--o{ TenantMembership : has
    Tenant ||--o{ Organization : contains
    Tenant ||--o{ Animal : contains
    Tenant ||--o{ BreedingPlan : contains
    Organization ||--|| Party : is
    Contact ||--|| Party : is
    Party ||--o{ Invoice : billed
    Party ||--o{ WaitlistEntry : client
    Animal ||--o{ BreedingPlan : parent
    BreedingPlan ||--o| OffspringGroup : produces
    OffspringGroup ||--o{ Offspring : contains
    Offspring ||--o{ Invoice : has
```

---

## 2. Users & Auth (Simplified)

```
erDiagram
    User ||--o{ Session : has
    User ||--o{ Passkey : has
    User ||--o{ RecoveryCode : has
    User ||--o{ TosAcceptance : accepts
    User ||--o{ UserEntitlement : has
```

---

## 3. Tenants & Orgs (Simplified)

```
erDiagram
    Tenant ||--o{ TenantMembership : has
    Tenant ||--o| BillingAccount : has
    Tenant ||--o{ Organization : contains
    Tenant ||--o{ Party : contains
    Organization ||--|| Party : is
    Organization ||--o{ Contact : has
    Contact ||--o| Party : is
    User ||--o{ TenantMembership : belongs
```

---

## 4. Animals (Simplified)

```
erDiagram
    Animal ||--o{ AnimalOwner : owned
    Animal ||--o{ AnimalBreed : has
    Animal ||--o{ AnimalRegistryIdentifier : registered
    Animal ||--o| AnimalPublicListing : listed
    AnimalOwner }o--|| Party : owner
    AnimalBreed }o--|| Breed : references
    AnimalRegistryIdentifier }o--|| Registry : references
```

---

## 5. Traits (Simplified)

```
erDiagram
    TraitDefinition ||--o{ AnimalTraitValue : defines
    Animal ||--o{ AnimalTraitValue : has
    AnimalTraitValue ||--o{ AnimalTraitValueDocument : docs
```

---

## 6. Breeding (Simplified)

```
erDiagram
    BreedingPlan ||--o{ BreedingAttempt : has
    BreedingPlan ||--o{ PregnancyCheck : has
    BreedingPlan ||--o{ TestResult : has
    BreedingPlan ||--o| OffspringGroup : produces
    BreedingPlan }o--|| Animal : dam
    BreedingPlan }o--|| Animal : sire
    Animal ||--o{ ReproductiveCycle : cycles
```

---

## 7. Offspring (Simplified)

```
erDiagram
    OffspringGroup ||--o{ Offspring : contains
    OffspringGroup ||--o{ WaitlistEntry : waitlist
    OffspringGroup }o--|| BreedingPlan : from
    Offspring }o--|| Party : buyer
    Offspring }o--o| Animal : promoted
    WaitlistEntry }o--|| Party : client
```

---

## 8. Finance (Simplified)

```
erDiagram
    Invoice ||--o{ InvoiceLineItem : lines
    Invoice ||--o{ Payment : payments
    Invoice }o--|| Party : client
    Invoice }o--|| OffspringGroup : group
    Invoice }o--|| Offspring : offspring
    Expense }o--|| Party : vendor
```

---

## 9. Documents (Simplified)

```
erDiagram
    Contract }o--|| ContractTemplate : from
    Contract ||--o{ ContractParty : parties
    Contract ||--o{ SignatureEvent : events
    Contract ||--o{ Document : docs
    ContractParty }o--|| Party : is
```

---

## 10. Scheduling (Simplified)

```
erDiagram
    SchedulingEventTemplate ||--o{ SchedulingAvailabilityBlock : blocks
    SchedulingAvailabilityBlock ||--o{ SchedulingSlot : slots
    SchedulingSlot ||--o{ SchedulingBooking : bookings
    SchedulingBooking }o--|| Party : bookedBy
```

---

## 11. Messaging (Simplified)

```
erDiagram
    MessageThread ||--o{ MessageParticipant : participants
    MessageThread ||--o{ Message : messages
    MessageParticipant }o--|| Party : is
    Message }o--|| Party : sender
    Template ||--o{ AutoReplyRule : rules
```

---

## 12. Portal & Tags (Simplified)

```
erDiagram
    PortalAccess ||--|| Party : for
    PortalAccess }o--|| User : linked
    PortalInvite }o--|| Party : for
    Tag ||--o{ TagAssignment : has
    TagAssignment }o--|| Party : tags
    TagAssignment }o--|| Animal : tags
    TagAssignment }o--|| Offspring : tags
```

---

## ULTRA SIMPLE TEST

If none of the above work, try this minimal test first:

```
erDiagram
    User ||--o{ Session : has
    User ||--o{ Passkey : has
```
