# Contract Templates

## Overview

BreederHQ provides a template system for e-signatures with:
- **System Templates**: Pre-built templates for common contract types (all tiers)
- **Custom Templates**: User-created templates with full control (Pro tier)

## System Templates

Six pre-built templates are included:

### 1. Animal Sales Agreement
**Category:** `SALES_AGREEMENT`
**Slug:** `animal-sales-agreement`

Standard sales contract covering:
- Purchase price and payment terms
- Animal identification and health information
- Seller warranties and guarantees
- Spay/neuter requirements
- Return and refund policy

### 2. Deposit Agreement
**Category:** `DEPOSIT_AGREEMENT`
**Slug:** `deposit-agreement`

Deposit collection contract covering:
- Deposit amount and purpose
- Refund conditions
- Application to purchase price
- Forfeiture terms

### 3. Co-Ownership Agreement
**Category:** `CO_OWNERSHIP`
**Slug:** `co-ownership-agreement`

Shared ownership terms covering:
- Ownership percentages
- Breeding rights and responsibilities
- Expense sharing
- Decision-making authority
- Buyout provisions

### 4. Guardian Home Agreement
**Category:** `GUARDIAN_HOME`
**Slug:** `guardian-home-agreement`

Guardian placement contract covering:
- Guardian responsibilities
- Breeding program participation
- Health care requirements
- Breeding litter obligations
- Transfer of full ownership timeline

### 5. Stud Service Contract
**Category:** `STUD_SERVICE`
**Slug:** `stud-service-contract`

Breeding service agreement covering:
- Stud fee and payment terms
- Breeding timeline and attempts
- Live puppy guarantee
- Health certifications required
- Pick of litter options

### 6. Health Guarantee
**Category:** `HEALTH_GUARANTEE`
**Slug:** `health-guarantee`

Health warranty document covering:
- Guarantee duration
- Covered conditions
- Veterinary examination requirements
- Replacement vs. refund options
- Exclusions and limitations

---

## Merge Fields

Templates use Mustache-style merge fields: `{{namespace.field}}`

### Breeder Namespace
| Field | Type | Description |
|-------|------|-------------|
| `breeder.name` | string | Business or kennel name |
| `breeder.email` | string | Contact email |
| `breeder.phone` | string | Contact phone |
| `breeder.address` | string | Full address |
| `breeder.city` | string | City |
| `breeder.state` | string | State/Province |
| `breeder.zip` | string | Postal code |
| `breeder.country` | string | Country |
| `breeder.website` | string | Website URL |
| `breeder.license` | string | Breeder license number |

### Buyer Namespace
| Field | Type | Description |
|-------|------|-------------|
| `buyer.name` | string | Full name |
| `buyer.email` | string | Email address |
| `buyer.phone` | string | Phone number |
| `buyer.address` | string | Full address |
| `buyer.city` | string | City |
| `buyer.state` | string | State/Province |
| `buyer.zip` | string | Postal code |

### Animal Namespace
| Field | Type | Description |
|-------|------|-------------|
| `animal.name` | string | Call name |
| `animal.registeredName` | string | Registration name |
| `animal.breed` | string | Breed name |
| `animal.color` | string | Color/markings |
| `animal.sex` | string | Male/Female |
| `animal.dateOfBirth` | date | Birth date |
| `animal.microchip` | string | Microchip number |
| `animal.registration` | string | Registration number |
| `animal.sire` | string | Sire's name |
| `animal.dam` | string | Dam's name |

### Transaction Namespace
| Field | Type | Description |
|-------|------|-------------|
| `transaction.price` | currency | Sale price |
| `transaction.deposit` | currency | Deposit amount |
| `transaction.balance` | currency | Remaining balance |
| `transaction.paymentMethod` | string | Payment method |
| `transaction.paymentDue` | date | Payment due date |

### Contract Namespace
| Field | Type | Description |
|-------|------|-------------|
| `contract.date` | date | Contract date |
| `contract.number` | string | Contract reference number |
| `contract.expiresAt` | date | Expiration date |

---

## Conditional Sections

Templates support conditional rendering:

```html
{{#if animal.microchip}}
<p>Microchip Number: {{animal.microchip}}</p>
{{/if}}

{{#if transaction.deposit}}
<p>A deposit of {{transaction.deposit}} has been received.</p>
{{/if}}
```

### Available Conditionals
- Any merge field can be used as a conditional
- Falsy values (empty string, null, undefined, 0) hide the section
- Truthy values show the section

---

## Template HTML Structure

Templates use semantic HTML with CSS classes for styling:

```html
<div class="contract-document">
  <header class="contract-header">
    <h1 class="contract-title">{{contract.title}}</h1>
    <p class="contract-date">Date: {{contract.date}}</p>
  </header>

  <section class="contract-parties">
    <h2>Parties</h2>
    <div class="party seller">
      <strong>Seller:</strong> {{breeder.name}}
    </div>
    <div class="party buyer">
      <strong>Buyer:</strong> {{buyer.name}}
    </div>
  </section>

  <section class="contract-terms">
    <h2>Terms and Conditions</h2>
    <ol class="terms-list">
      <li>...</li>
    </ol>
  </section>

  <section class="contract-signatures">
    <h2>Signatures</h2>
    <!-- Signature placeholders rendered by signing system -->
  </section>
</div>
```

---

## Custom Template Editor (Pro Tier)

Pro tier users can create custom templates using a rich text editor.

### Editor Features
- Rich text formatting (bold, italic, lists, etc.)
- Merge field insertion via toolbar
- Preview with sample data
- Version history
- Template categories

### Creating a Custom Template

1. Navigate to **Contracts → Templates**
2. Click **Create Template**
3. Enter template name and description
4. Select a category
5. Use the editor to compose your contract
6. Insert merge fields using the toolbar
7. Preview with sample data
8. Save the template

### Template Versioning
- Each save increments the version number
- Existing contracts reference their creation-time version
- Template updates don't affect already-created contracts

---

## Template Rendering

The template renderer (`contract-template-renderer.ts`) performs:

1. **Field Substitution**: Replace `{{field.key}}` with values
2. **Conditional Processing**: Evaluate `{{#if}}...{{/if}}` blocks
3. **HTML Escaping**: Prevent XSS by escaping user content
4. **Formatting**: Apply date/currency formatting

### Rendering Pipeline

```
Template HTML
     ↓
Parse merge fields
     ↓
Resolve field values from context
     ↓
Process conditionals
     ↓
Apply formatting
     ↓
Rendered HTML
     ↓
Store in ContractContent (immutable)
```

---

## Seeding System Templates

System templates are seeded via:

```bash
# Development
npm run db:dev:seed:contracts

# Production
npm run db:prod:seed:contracts
```

The seed script (`prisma/seed/seed-contract-templates.ts`):
- Creates all 6 system templates
- Uses upsert for idempotency
- Sets `tenantId: null` for system templates
- Includes full HTML content with merge fields
