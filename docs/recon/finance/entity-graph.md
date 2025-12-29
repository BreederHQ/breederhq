# Finance Entity Graph

## Purpose
Document the join paths required for Finance rollups, cross-object Finance tabs, and invoice/expense anchoring.

## Core Entity Models (From Frontend Types)

### Animal
**File:** `packages/api/src/types/animals.ts`

```typescript
interface AnimalDTO {
  id: string;
  name: string;
  sex: "female" | "male";
  breed?: string | null;
  birthdate?: string | null;
  owners?: Array<{
    contact_id: string;
    name: string;
    is_primary_contact?: boolean;
    is_resident?: boolean;
  }>;
  last_cycle_at?: string | null;
  documents?: Array<{ id: string; title: string; url: string }>;
  audit?: Array<{ at: string; action: string; by: string }>;
}
```

**Key field:** `id` (primary key)

**Relations:**
- `Animal.owners[]` → Contact (legacy, via `contact_id`)
- `Animal → BreedingPlan` (as dam or sire)

### BreedingPlan
**File:** `packages/api/src/types/breeding.ts`

```typescript
interface BreedingPlanDTO {
  id: string;
  female_id: string;      // FK → Animal.id (dam)
  male_id?: string | null; // FK → Animal.id (sire)
  lockedCycle?: boolean;
  cycle_start_at?: string | null;
  ovulation_at?: string | null;
  actuals?: {
    bred_on?: string[];
    birth_on?: string | null;
    placement_started_on?: string | null;
  };
  status?: "planned" | "active" | "birthed" | "placement" | "complete" | "canceled";
}
```

**Key fields:**
- `id` (primary key)
- `female_id` → Animal.id (dam)
- `male_id` → Animal.id (sire, optional)

**Relations:**
- `BreedingPlan.female_id → Animal.id`
- `BreedingPlan.male_id → Animal.id`
- `BreedingPlan → OffspringGroup` (one-to-one or one-to-many, depends on litter structure)

### OffspringGroup
**File:** `packages/api/src/types/offspring.ts`

```typescript
interface OffspringGroupDTO {
  id: string;
  plan_id?: string | null; // FK → BreedingPlan.id (nullable for historical groups)
  species: "dog" | "cat" | "horse";
  breed?: string | null;
  litter_name?: string | null;
  birthed_at?: string | null;
  invoices?: Array<{
    id: string;
    contact_id: string;
    assigned_at: string;
    status: "paid" | "unpaid" | "partial" | "refunded";
  }>; // LEGACY — will be replaced by Invoice.offspringGroupId
}
```

**Key fields:**
- `id` (primary key)
- `plan_id` → BreedingPlan.id (nullable)

**Relations:**
- `OffspringGroup.plan_id → BreedingPlan.id`
- `OffspringGroup → Offspring[]` (one-to-many)

**Finance-adjacent:**
- `invoices[]` — legacy embedded array, will be replaced by explicit `Invoice.offspringGroupId` FK

### Offspring
**File:** `packages/api/src/types/offspring.ts`

```typescript
interface OffspringDTO {
  id: string;
  group_id: string;               // FK → OffspringGroup.id
  name?: string | null;
  sex: "M" | "F" | null;
  color?: string | null;
  buyer_contact_id?: string | null; // LEGACY — maps to buyer Party
  price_cents?: number | null;      // Offspring sale price
  paid_cents?: number | null;       // Amount paid
  reserved?: boolean;
  hold_until?: string | null;
}
```

**Key fields:**
- `id` (primary key)
- `group_id` → OffspringGroup.id

**Relations:**
- `Offspring.group_id → OffspringGroup.id`
- `Offspring.buyer_contact_id → Contact.id` (legacy, will map to `buyerPartyId`)

**Finance-adjacent:**
- `price_cents`, `paid_cents` — inline payment tracking, will be replaced by Invoice anchoring

### Party (Contact/Organization)
**File:** `packages/api/src/types/party.ts`

```typescript
interface PartyRef {
  partyId: number;
  kind: "CONTACT" | "ORGANIZATION";
  displayName: string;
  contactId?: number | null;       // Legacy backing ID
  organizationId?: number | null;  // Legacy backing ID
}
```

**Key field:** `partyId` (primary key)

**Kind discriminator:** `kind` (CONTACT or ORGANIZATION)

**Relations:**
- `Party → Invoice` (as client: `Invoice.clientPartyId`)
- `Party → Expense` (as vendor: `Expense.vendorPartyId`)
- `Party → OffspringContract` (as buyer: `OffspringContract.buyerPartyId`)

## Finance Entity Graph Paths

### Path 1: BreedingPlan → OffspringGroup → Offspring → Buyer (Party)

**Use case:** Rollup revenue from a breeding plan by tracing all offspring sales.

```
BreedingPlan (id: 1)
  ↓ plan_id
OffspringGroup (id: 10, plan_id: 1)
  ↓ group_id
Offspring (id: 100, group_id: 10, buyer_contact_id: 50)
  ↓ buyer_contact_id → Contact.id → Contact.partyId
Party (partyId: 500, kind: CONTACT, displayName: "Jane Smith")
  ↓ clientPartyId
Invoice (id: 1000, clientPartyId: 500, offspringId: 100, total: 280000, balance: 0)
```

**SQL join path:**
```sql
SELECT
  bp.id AS breeding_plan_id,
  og.id AS offspring_group_id,
  o.id AS offspring_id,
  p.id AS buyer_party_id,
  p.displayName AS buyer_name,
  i.id AS invoice_id,
  i.total AS invoice_total,
  i.balance AS invoice_balance
FROM "BreedingPlan" bp
LEFT JOIN "OffspringGroup" og ON og.plan_id = bp.id
LEFT JOIN "Offspring" o ON o.group_id = og.id
LEFT JOIN "Contact" c ON o.buyer_contact_id = c.id
LEFT JOIN "Party" p ON c.partyId = p.id
LEFT JOIN "Invoice" i ON i.offspringId = o.id
WHERE bp.tenantId = ? AND bp.id = ?;
```

**Simplified (with explicit Invoice anchors):**
```sql
SELECT
  i.id AS invoice_id,
  i.total,
  i.balance,
  i.offspringId,
  o.name AS offspring_name,
  og.litter_name,
  bp.id AS breeding_plan_id
FROM "Invoice" i
LEFT JOIN "Offspring" o ON i.offspringId = o.id
LEFT JOIN "OffspringGroup" og ON i.offspringGroupId = og.id
LEFT JOIN "BreedingPlan" bp ON og.plan_id = bp.id
WHERE i.tenantId = ? AND bp.id = ?;
```

**Why explicit anchors matter:** Direct FK from Invoice → BreedingPlan eliminates need for multi-join traversal.

**Recommended schema addition:**
```prisma
model Invoice {
  breedingPlanId Int? // Direct FK
  @@index([tenantId, breedingPlanId])
}
```

### Path 2: Animal → BreedingPlan (as Dam/Sire)

**Use case:** Show all breeding-related revenue/expenses for a specific animal.

**As Dam (female):**
```
Animal (id: 5, sex: "female")
  ↓ female_id
BreedingPlan (id: 1, female_id: 5)
  ↓ plan_id
OffspringGroup (id: 10, plan_id: 1)
  ↓ offspringGroupId
Invoice (id: 1001, offspringGroupId: 10, total: 250000)
```

**As Sire (male):**
```
Animal (id: 6, sex: "male")
  ↓ male_id
BreedingPlan (id: 1, male_id: 6)
  ↓ plan_id
OffspringGroup (id: 10, plan_id: 1)
  ↓ offspringGroupId
Invoice (id: 1001, offspringGroupId: 10)
```

**SQL (find invoices for animal's breeding plans):**
```sql
-- As dam
SELECT i.*
FROM "Invoice" i
JOIN "OffspringGroup" og ON i.offspringGroupId = og.id
JOIN "BreedingPlan" bp ON og.plan_id = bp.id
WHERE i.tenantId = ? AND bp.female_id = ?;

-- As sire
SELECT i.*
FROM "Invoice" i
JOIN "OffspringGroup" og ON i.offspringGroupId = og.id
JOIN "BreedingPlan" bp ON og.plan_id = bp.id
WHERE i.tenantId = ? AND bp.male_id = ?;

-- Combined (dam or sire)
SELECT i.*
FROM "Invoice" i
JOIN "OffspringGroup" og ON i.offspringGroupId = og.id
JOIN "BreedingPlan" bp ON og.plan_id = bp.id
WHERE i.tenantId = ? AND (bp.female_id = ? OR bp.male_id = ?);
```

**Direct animal expenses:**
```sql
SELECT e.*
FROM "Expense" e
WHERE e.tenantId = ? AND e.animalId = ?;
```

**Recommended:** Add `Invoice.animalId` for direct animal-related invoices (e.g., stud fees, training fees):
```sql
SELECT i.*
FROM "Invoice" i
WHERE i.tenantId = ? AND i.animalId = ?;
```

### Path 3: Party → Invoices/Expenses

**Use case:** Finance tab on Contact/Organization detail view.

**As Client (Invoice):**
```
Party (partyId: 500, kind: CONTACT)
  ↓ clientPartyId
Invoice (id: 1000, clientPartyId: 500, offspringId: 100, total: 280000)
```

**SQL:**
```sql
SELECT i.*
FROM "Invoice" i
WHERE i.tenantId = ? AND i.clientPartyId = ?
ORDER BY i.issueDate DESC;
```

**As Vendor (Expense):**
```
Party (partyId: 600, kind: ORGANIZATION, displayName: "Vet Clinic")
  ↓ vendorPartyId
Expense (id: 2000, vendorPartyId: 600, animalId: 5, amount: 15000)
```

**SQL:**
```sql
SELECT e.*
FROM "Expense" e
WHERE e.tenantId = ? AND e.vendorPartyId = ?
ORDER BY e.date DESC;
```

### Path 4: OffspringGroup → Invoice (Direct)

**Use case:** Finance tab on OffspringGroup detail view.

```
OffspringGroup (id: 10, litter_name: "Litter A")
  ↓ offspringGroupId
Invoice (id: 1001, offspringGroupId: 10, total: 250000)
Invoice (id: 1002, offspringGroupId: 10, total: 280000)
Invoice (id: 1003, offspringGroupId: 10, total: 300000)
```

**SQL:**
```sql
SELECT i.*
FROM "Invoice" i
WHERE i.tenantId = ? AND i.offspringGroupId = ?
ORDER BY i.issueDate DESC;
```

**Expenses:**
```sql
SELECT e.*
FROM "Expense" e
WHERE e.tenantId = ? AND e.offspringGroupId = ?
ORDER BY e.date DESC;
```

### Path 5: Offspring (Individual) → Invoice

**Use case:** Finance tab on individual Offspring detail view (if implemented).

```
Offspring (id: 100, name: "Ruby", buyer_contact_id: 50, price_cents: 280000)
  ↓ offspringId
Invoice (id: 1000, offspringId: 100, total: 280000, balance: 80000)
  ↓ invoiceId
Payment (id: 3001, invoiceId: 1000, amount: 200000, method: "CARD")
```

**SQL:**
```sql
SELECT i.*, p.displayName AS buyer_name
FROM "Invoice" i
LEFT JOIN "Party" p ON i.clientPartyId = p.id
WHERE i.tenantId = ? AND i.offspringId = ?;
```

**Payments:**
```sql
SELECT pm.*
FROM "Payment" pm
JOIN "Invoice" i ON pm.invoiceId = i.id
WHERE i.tenantId = ? AND i.offspringId = ?;
```

## Finance Rollup Queries (Summary Analytics)

### Rollup 1: Total Revenue by BreedingPlan

**Use case:** Dashboard widget showing revenue per breeding plan.

```sql
SELECT
  bp.id,
  bp.female_id,
  bp.male_id,
  SUM(i.total) AS total_revenue,
  SUM(i.balance) AS outstanding_balance,
  COUNT(i.id) AS invoice_count
FROM "BreedingPlan" bp
LEFT JOIN "OffspringGroup" og ON og.plan_id = bp.id
LEFT JOIN "Invoice" i ON i.offspringGroupId = og.id AND i.status IN ('SENT', 'PARTIAL', 'PAID')
WHERE bp.tenantId = ?
GROUP BY bp.id, bp.female_id, bp.male_id;
```

**With explicit breedingPlanId anchor:**
```sql
SELECT
  i.breedingPlanId,
  SUM(i.total) AS total_revenue,
  SUM(i.balance) AS outstanding_balance,
  COUNT(i.id) AS invoice_count
FROM "Invoice" i
WHERE i.tenantId = ? AND i.breedingPlanId IS NOT NULL
GROUP BY i.breedingPlanId;
```

### Rollup 2: Net Profit by Animal

**Use case:** Animal Finance tab summary card.

```sql
-- Revenue (invoices where animal is direct anchor OR via breeding plan)
WITH animal_invoices AS (
  SELECT i.total, i.balance
  FROM "Invoice" i
  WHERE i.tenantId = ? AND i.animalId = ?

  UNION ALL

  SELECT i.total, i.balance
  FROM "Invoice" i
  JOIN "OffspringGroup" og ON i.offspringGroupId = og.id
  JOIN "BreedingPlan" bp ON og.plan_id = bp.id
  WHERE i.tenantId = ? AND (bp.female_id = ? OR bp.male_id = ?)
),
animal_expenses AS (
  SELECT e.amount
  FROM "Expense" e
  WHERE e.tenantId = ? AND e.animalId = ?
)
SELECT
  COALESCE(SUM(ai.total), 0) AS total_revenue,
  COALESCE(SUM(ai.balance), 0) AS outstanding_balance,
  COALESCE(SUM(ae.amount), 0) AS total_expenses,
  COALESCE(SUM(ai.total), 0) - COALESCE(SUM(ae.amount), 0) AS net_profit
FROM animal_invoices ai
CROSS JOIN animal_expenses ae;
```

**Simplified with explicit anchors:**
```sql
SELECT
  (SELECT COALESCE(SUM(total), 0) FROM "Invoice" WHERE tenantId = ? AND animalId = ?) AS revenue,
  (SELECT COALESCE(SUM(amount), 0) FROM "Expense" WHERE tenantId = ? AND animalId = ?) AS expenses,
  revenue - expenses AS net_profit;
```

### Rollup 3: Total Expenses by Category

**Use case:** Expense analytics dashboard.

```sql
SELECT
  e.category,
  COUNT(e.id) AS expense_count,
  SUM(e.amount) AS total_amount
FROM "Expense" e
WHERE e.tenantId = ? AND e.date >= ? AND e.date <= ?
GROUP BY e.category
ORDER BY total_amount DESC;
```

## Index Requirements for Graph Queries

### Invoice Indexes
```prisma
model Invoice {
  @@index([tenantId, clientPartyId])
  @@index([tenantId, offspringGroupId])
  @@index([tenantId, offspringId])
  @@index([tenantId, animalId])
  @@index([tenantId, breedingPlanId])
  @@index([tenantId, status])
  @@index([tenantId, issueDate])
}
```

### Payment Indexes
```prisma
model Payment {
  @@index([tenantId, invoiceId])
  @@index([tenantId, receivedAt])
}
```

### Expense Indexes
```prisma
model Expense {
  @@index([tenantId, vendorPartyId])
  @@index([tenantId, animalId])
  @@index([tenantId, offspringGroupId])
  @@index([tenantId, breedingPlanId])
  @@index([tenantId, category])
  @@index([tenantId, date])
}
```

### OffspringGroup Indexes
```prisma
model OffspringGroup {
  @@index([tenantId, plan_id]) // Already exists for breeding plan rollups
}
```

### Offspring Indexes
```prisma
model Offspring {
  @@index([tenantId, group_id]) // Already exists
  @@index([tenantId, buyer_contact_id]) // Legacy, for migration
}
```

## Critical Design Decision: Explicit Anchors vs Polymorphic

### Polymorphic Approach (NOT RECOMMENDED)
```prisma
model Invoice {
  contextType String? // "OFFSPRING_GROUP", "OFFSPRING", "ANIMAL", "BREEDING_PLAN"
  contextId   Int?    // Polymorphic FK
  @@index([tenantId, contextType, contextId])
}
```

**Problems:**
- No FK enforcement (can reference deleted records)
- No JOIN integrity (must UNION multiple queries)
- Complex query logic (case statements, type checks)
- Index bloat (single composite index less efficient than type-specific indexes)

### Explicit Anchors Approach (RECOMMENDED)
```prisma
model Invoice {
  offspringGroupId Int?
  offspringId      Int?
  animalId         Int?
  breedingPlanId   Int?
  serviceCode      String? // For "OTHER" context

  offspringGroup OffspringGroup? @relation(fields: [offspringGroupId], references: [id], onDelete: SetNull)
  offspring      Offspring?      @relation(fields: [offspringId], references: [id], onDelete: SetNull)
  animal         Animal?         @relation(fields: [animalId], references: [id], onDelete: SetNull)
  breedingPlan   BreedingPlan?   @relation(fields: [breedingPlanId], references: [id], onDelete: SetNull)

  @@index([tenantId, offspringGroupId])
  @@index([tenantId, offspringId])
  @@index([tenantId, animalId])
  @@index([tenantId, breedingPlanId])
}
```

**Benefits:**
- FK enforcement (referential integrity)
- Type-safe JOINs (Prisma/TypeScript knows field types)
- Efficient indexes (one per anchor type)
- Simple queries (no polymorphic logic)
- Nullable = mutually exclusive (one anchor per invoice)

**Trade-off:** More columns. Acceptable cost for data integrity and query performance.

## Entity Graph Summary

| From | To | Via Field | Cardinality | Finance Impact |
|------|----|-----------|-----------|-|
| BreedingPlan | Animal (dam) | `female_id` | many-to-one | Revenue from breeding plan includes dam's lineage |
| BreedingPlan | Animal (sire) | `male_id` | many-to-one | Revenue from breeding plan includes sire's lineage |
| BreedingPlan | OffspringGroup | `plan_id` (reverse) | one-to-many | Revenue rollup via offspring sales |
| OffspringGroup | Offspring | `group_id` (reverse) | one-to-many | Individual puppy/kitten sales |
| Offspring | Party (buyer) | `buyer_contact_id → partyId` | many-to-one | Invoice client reference |
| Invoice | Party (client) | `clientPartyId` | many-to-one | Who owes money |
| Invoice | OffspringGroup | `offspringGroupId` | many-to-one | Litter-level invoice |
| Invoice | Offspring | `offspringId` | many-to-one | Individual offspring sale |
| Invoice | Animal | `animalId` | many-to-one | Animal-specific invoice (stud fee, training) |
| Invoice | BreedingPlan | `breedingPlanId` | many-to-one | Plan-level invoice (deposit, contract) |
| Invoice | Payment | `invoiceId` (reverse) | one-to-many | Payment history |
| Expense | Party (vendor) | `vendorPartyId` | many-to-one | Who was paid |
| Expense | Animal | `animalId` | many-to-one | Vet, food, supplies for animal |
| Expense | OffspringGroup | `offspringGroupId` | many-to-one | Litter care expenses |
| Expense | BreedingPlan | `breedingPlanId` | many-to-one | Breeding service expenses |

## Next Steps for Implementation

1. Add explicit anchor FKs to Invoice model (offspringGroupId, offspringId, animalId, breedingPlanId)
2. Add explicit anchor FKs to Expense model (animalId, offspringGroupId, breedingPlanId)
3. Create composite indexes for all anchor + tenantId combinations
4. Build helper functions to populate contextType enum from anchor FKs (UI display)
5. Test all Finance tab queries against sample data
6. Validate rollup performance with 1000+ invoices/expenses per tenant
