# E-Signatures Feature

Native e-signature system for BreederHQ that allows breeders to create, send, and collect legally-binding signatures on contracts.

## Overview

The e-signatures feature provides:
- **Contract Templates**: 6 pre-built system templates + custom templates (Pro tier)
- **Merge Fields**: Dynamic field substitution with mustache-style `{{field.key}}` syntax
- **Portal Signing**: Buyers sign contracts within the portal
- **Tiered Signature Options**: Typed signatures for all, drawn/uploaded for Pro
- **Audit Trail**: Full IP, timestamp, and user agent logging for legal compliance
- **PDF Generation**: Signed documents with embedded signatures and audit certificate

## Tier Feature Matrix

| Feature | Breeder ($39) | Pro ($99) |
|---------|---------------|-----------|
| System templates (6 types) | ✓ | ✓ |
| Send contracts for e-signature | ✓ | ✓ |
| Typed signature + checkbox | ✓ | ✓ |
| Audit trail (IP, timestamp) | ✓ | ✓ |
| PDF generation | ✓ | ✓ |
| Buyer signs via portal | ✓ | ✓ |
| Custom contract templates | - | ✓ |
| Drawn signature (canvas) | - | ✓ |
| Uploaded signature image | - | ✓ |

## Quick Links

- [Architecture](./architecture.md) - System design and data flow
- [API Reference](./api-reference.md) - Endpoint documentation
- [Templates](./templates.md) - Template system and merge fields
- [Portal Signing](./portal-signing.md) - Buyer signing experience

## Getting Started

### Setup

1. Run database migration:
   ```bash
   npm run db:dev:migrate
   ```

2. Seed system templates:
   ```bash
   npm run db:dev:seed:contracts
   ```

3. Install dependencies (if not already):
   ```bash
   cd breederhq && npm install
   ```

### Creating a Contract

1. Navigate to `/contracts` in the platform
2. Click "New Contract"
3. Select a template
4. Enter buyer details
5. Review and send

### Signing a Contract (Buyer Flow)

1. Buyer receives email with link
2. Logs into portal (or creates account)
3. Reviews document
4. Captures signature (typed or drawn)
5. Confirms consent and signs

## File Structure

```
breederhq-api/
├── prisma/
│   └── seed/
│       └── seed-contract-templates.ts    # System template seeder
├── src/
│   ├── routes/
│   │   ├── contracts.ts                  # Platform contract routes
│   │   ├── contract-templates.ts         # Template management routes
│   │   └── portal-contracts.ts           # Portal signing routes
│   ├── services/
│   │   └── contracts/
│   │       ├── index.ts                  # Barrel export
│   │       ├── types.ts                  # Type definitions
│   │       ├── contract-service.ts       # Core CRUD operations
│   │       ├── contract-template-renderer.ts
│   │       ├── signature-event-service.ts
│   │       ├── contract-scanner.ts       # Cron job integration
│   │       └── pdf-generator/
│   │           ├── contract-pdf-builder.ts
│   │           ├── signature-embedder.ts
│   │           └── audit-footer.ts
│   └── jobs/
│       └── notification-scan.ts          # Cron job (includes contracts)

breederhq/
├── apps/
│   ├── contracts/                        # Platform contracts module
│   │   └── src/
│   │       ├── App-Contracts.tsx
│   │       ├── ContractsHome.tsx
│   │       ├── ContractsListPage.tsx
│   │       ├── TemplatesPage.tsx
│   │       └── api.ts
│   └── portal/
│       └── src/
│           ├── components/
│           │   └── signing/              # Signature capture components
│           │       ├── SignatureCapture.tsx
│           │       ├── TypedSignatureInput.tsx
│           │       ├── DrawnSignatureCanvas.tsx
│           │       └── SigningConsentCheckbox.tsx
│           └── pages/
│               └── PortalContractSigningPage.tsx
```

## Database Schema

Key models:
- `Contract` - Main contract record with status tracking
- `ContractParty` - Parties to the contract (signers)
- `ContractTemplate` - System and custom templates
- `ContractContent` - Immutable rendered contract snapshot
- `SignatureEvent` - Audit trail events

See [architecture.md](./architecture.md) for full schema details.

## Notification Types

Contract-related notification types:
- `contract_sent` - Contract sent to recipient
- `contract_reminder_7d` - 7 days until expiry
- `contract_reminder_3d` - 3 days until expiry
- `contract_reminder_1d` - 1 day until expiry
- `contract_signed` - Contract fully executed
- `contract_declined` - Contract declined by party
- `contract_voided` - Contract voided by sender
- `contract_expired` - Contract expired
