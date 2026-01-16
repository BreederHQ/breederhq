# E-Signatures Architecture

## System Design

### Overview

The e-signatures system follows a multi-step workflow:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Template       │ -> │  Contract        │ -> │  Signing        │
│  Selection      │    │  Creation        │    │  (Portal)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                        │
                              v                        v
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Content         │    │  PDF            │
                       │  Rendering       │    │  Generation     │
                       └──────────────────┘    └─────────────────┘
```

### Data Flow

1. **Template Selection**: Breeder selects a system or custom template
2. **Contract Creation**: Contract record created with parties and merge data
3. **Content Rendering**: Template rendered with merge fields, stored as immutable `ContractContent`
4. **Sending**: Email sent to signers with portal link
5. **Signing**: Buyer views document, captures signature, consents
6. **Completion**: All parties signed → status = `signed`, PDF generated

## Database Schema

### Contract Model

```prisma
model Contract {
  id              Int              @id @default(autoincrement())
  tenantId        Int
  title           String
  status          ContractStatus   @default(draft)
  templateId      Int?
  offspringId     Int?
  animalId        Int?
  waitlistEntryId Int?
  invoiceId       Int?
  expiresAt       DateTime?
  signedAt        DateTime?
  data            Json?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  tenant          Tenant           @relation(...)
  template        ContractTemplate? @relation(...)
  parties         ContractParty[]
  events          SignatureEvent[]
  content         ContractContent?
  offspring       Offspring?       @relation(...)
  animal          Animal?          @relation(...)
  waitlistEntry   WaitlistEntry?   @relation(...)
  invoice         Invoice?         @relation(...)
}
```

### ContractParty Model

```prisma
model ContractParty {
  id            Int              @id @default(autoincrement())
  contractId    Int
  partyId       Int?             // Optional link to Party table
  role          ContractRole
  name          String
  email         String
  signer        Boolean          @default(true)
  status        SignatureStatus  @default(pending)
  signedAt      DateTime?
  signatureData Json?            // Stores signature type, image data
  order         Int              @default(1)

  contract      Contract         @relation(...)
  party         Party?           @relation(...)
  events        SignatureEvent[]
}
```

### ContractTemplate Model

```prisma
model ContractTemplate {
  id                  Int                       @id @default(autoincrement())
  tenantId            Int?                      // null for system templates
  slug                String                    @unique
  name                String
  description         String?
  type                ContractTemplateType      @default(CUSTOM)
  category            ContractTemplateCategory
  bodyHtml            String?                   @db.Text
  bodyJson            Json?                     // TipTap JSON format
  version             Int                       @default(1)
  mergeFields         String[]                  // Array of field keys used
  conditionalSections Json?
  isActive            Boolean                   @default(true)
  createdByUserId     String?
  createdAt           DateTime                  @default(now())
  updatedAt           DateTime                  @updatedAt

  tenant              Tenant?                   @relation(...)
  contracts           Contract[]
}
```

### ContractContent Model (Immutable Snapshot)

```prisma
model ContractContent {
  id              Int      @id @default(autoincrement())
  contractId      Int      @unique
  renderedHtml    String   @db.Text
  renderedPdfKey  String?  // Storage key for generated PDF
  mergeData       Json     // Values used for rendering
  templateVersion Int
  createdAt       DateTime @default(now())

  contract        Contract @relation(...)
}
```

### SignatureEvent Model (Audit Trail)

```prisma
model SignatureEvent {
  id         Int             @id @default(autoincrement())
  tenantId   Int
  contractId Int
  partyId    Int?            // ContractParty.id
  status     SignatureStatus
  at         DateTime        @default(now())
  ipAddress  String?
  userAgent  String?
  message    String?
  data       Json?           // Additional event data

  tenant     Tenant          @relation(...)
  contract   Contract        @relation(...)
  party      ContractParty?  @relation(...)
}
```

## Enums

```prisma
enum ContractStatus {
  draft
  sent
  viewed
  signed
  declined
  voided
  expired
}

enum SignatureStatus {
  pending
  viewed
  signed
  declined
  voided
  expired
}

enum ContractRole {
  SELLER
  BUYER
  GUARANTOR
  WITNESS
  CO_OWNER
}

enum ContractTemplateType {
  SYSTEM
  CUSTOM
}

enum ContractTemplateCategory {
  SALES_AGREEMENT
  DEPOSIT_AGREEMENT
  CO_OWNERSHIP
  GUARDIAN_HOME
  STUD_SERVICE
  HEALTH_GUARANTEE
  CUSTOM
}
```

## Service Architecture

### Contract Service (`contract-service.ts`)

Core operations:
- `createContract()` - Create from template with parties
- `buildRenderContext()` - Build merge field context from entities
- `renderAndStoreContractContent()` - Render and store immutable snapshot
- `sendContract()` - Send to parties, update status
- `signContract()` - Process signature submission
- `declineContract()` / `voidContract()` - Contract actions
- `checkAllPartiesSigned()` - Check completion

### Template Renderer (`contract-template-renderer.ts`)

- `renderContractTemplate()` - Mustache-style field substitution
- `processConditionals()` - `{{#if field}}...{{/if}}` processing
- `validateContractTemplate()` - Validate template content
- `previewContractTemplate()` - Preview with sample data

### Signature Event Service (`signature-event-service.ts`)

- `logSignatureEvent()` - Core audit logging
- `logContractCreated/Sent/Viewed/Signed/Declined/Voided/Expired()`
- `getContractEvents()` - Retrieve audit trail

### Contract Scanner (`contract-scanner.ts`)

Cron integration:
- `scanContractExpirations()` - Find contracts needing reminders
- `processExpiredContracts()` - Update expired contracts
- `runContractScan()` - Main entry point for cron job

### PDF Generator (`pdf-generator/`)

- `generateContractPdf()` - Generate signed PDF
- `embedSignatureImage()` - Embed drawn signatures
- `createAuditFooter()` - Certificate of completion

## Security Considerations

### Audit Trail
Every action is logged with:
- Timestamp
- IP address (handles proxies, Cloudflare)
- User agent
- Party identification

### Immutability
Once rendered, `ContractContent.renderedHtml` is never modified. Any changes require creating a new contract.

### Signature Integrity
- Drawn signatures are hashed (SHA-256) before storage
- Hash is included in audit trail for verification

### Access Control
- Platform routes require authenticated tenant user
- Portal routes require authenticated portal user with matching party email
- Entitlement checking for E_SIGNATURES feature
