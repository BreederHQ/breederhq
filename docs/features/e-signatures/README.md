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
- **Contact Integration**: All contracts automatically link to contacts and appear in their Documents tab

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
3. Select a template from system templates
4. Search for and select an existing contact (required)
5. Enter contract title and review buyer information
6. Send the contract for signature

**Note**: All contracts must be linked to a contact. The 3-step creation wizard ensures proper contact linking.

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
│   │       ├── ContractsListPage.tsx    # 3-step creation wizard
│   │       ├── TemplatesPage.tsx
│   │       └── api.ts
│   ├── contacts/                         # Contacts integration
│   │   └── src/
│   │       ├── PartyDetailsView.tsx      # Documents tab integration
│   │       ├── components/
│   │       │   └── ContractsSection.tsx  # Contracts display component
│   │       └── api.ts                    # Extended with contracts API
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

## Contact Integration

All contracts are automatically linked to contacts through the party system:

### Contract Creation Flow

1. **Step 1: Choose Template** - Select from system or custom templates
2. **Step 2: Select Contact** - Search for existing contact by name or email (required)
3. **Step 3: Contract Details** - Enter title and review buyer information

The buyer party is linked via `partyId`, ensuring contracts appear in the contact's record.

### Documents Tab

Contracts appear in the **Documents tab** when viewing a contact's details:

**Features**:
- Displays all contracts where the contact is a party
- Shows contract status with color-coded badges
- Displays creation date, signed date, and expiration date
- Quick actions: View Details and Download PDF (for signed contracts)
- Automatic real-time updates

**Status Badges**:
- Draft (gray) - Contract not yet sent
- Sent (amber) - Awaiting signature
- Viewed (blue) - Recipient has opened the contract
- Signed (green) - Fully executed
- Declined (red) - Rejected by recipient
- Voided (gray) - Cancelled by sender
- Expired (red) - Past expiration date

**Navigation**: Clicking "View Details" navigates to the contract in the Contracts module.

### API Integration

The Contacts API has been extended to include contracts:

```typescript
// Fetch contracts for a specific contact
const contracts = await api.contracts.contracts.list({ partyId: contactId });

// Get PDF download URL
const pdfUrl = api.contracts.contracts.getPdfUrl(contractId);
```

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
