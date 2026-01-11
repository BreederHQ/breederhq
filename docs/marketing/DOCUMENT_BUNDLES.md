# Document Bundles Feature

**Date**: 2025-01-10
**Status**: Implemented
**Module**: Marketing
**Related**: Email Composer, Communications Hub

---

## Overview

Document Bundles allow breeders to create named collections of documents that can be attached to emails. This enables standardized document delivery for common scenarios like "Go Home Packets" or "Health Records" that need to be sent to clients.

### Use Cases

1. **Go Home Document Bundle** - Registration papers, health certificates, care instructions, contract
2. **Health Records Bundle** - Vaccination records, vet visit summaries, genetic testing results
3. **Breeding Program Bundle** - Pedigree documents, health clearances, breeding rights information
4. **Purchase Packet Bundle** - Contract, payment terms, pickup instructions, care guide

---

## Architecture

### Database Schema

Two new tables support the document bundles feature:

```sql
-- Document Bundle - named collection of documents
DocumentBundle {
  id            int PK
  tenantId      int FK -> Tenant
  name          varchar NOT NULL      -- e.g., "Go Home Document Bundle"
  description   varchar               -- Optional description
  status        BundleStatus          -- 'active' | 'archived'
  createdAt     timestamp
  updatedAt     timestamp
}

-- Join table linking bundles to documents
DocumentBundleItem {
  id            int PK
  bundleId      int FK -> DocumentBundle
  documentId    int FK -> Document
  sortOrder     int NOT NULL DEFAULT 0
  addedAt       timestamp
}

Enum BundleStatus {
  active
  archived
}
```

### Entity Relationships

```
Tenant ||--o{ DocumentBundle : "has"
DocumentBundle ||--o{ DocumentBundleItem : "contains"
DocumentBundleItem }o--|| Document : "references"
```

---

## API Specification

### Resource: `/api/v1/document-bundles`

#### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/document-bundles` | List all bundles |
| GET | `/document-bundles/:id` | Get bundle with documents |
| POST | `/document-bundles` | Create new bundle |
| PATCH | `/document-bundles/:id` | Update bundle metadata |
| DELETE | `/document-bundles/:id` | Delete bundle |
| POST | `/document-bundles/:id/documents` | Add documents to bundle |
| DELETE | `/document-bundles/:id/documents/:docId` | Remove document from bundle |
| PUT | `/document-bundles/:id/documents/order` | Reorder documents |

#### Types

```typescript
// Bundle DTO returned from API
interface DocumentBundle {
  id: number;
  tenantId: number;
  name: string;
  description: string | null;
  status: "active" | "archived";
  documentCount: number;
  documents?: BundleDocumentDTO[];  // Included in detail view
  createdAt: string;
  updatedAt: string;
}

// Document within a bundle
interface BundleDocumentDTO {
  id: number;           // BundleItem ID
  documentId: number;
  name: string;
  mimeType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
}

// Create bundle input
interface CreateBundleInput {
  name: string;
  description?: string;
  documentIds?: number[];
}

// Update bundle input
interface UpdateBundleInput {
  name?: string;
  description?: string;
  status?: "active" | "archived";
}

// List parameters
interface BundleListParams {
  status?: "active" | "archived";
  q?: string;           // Search query
  limit?: number;
  offset?: number;
}
```

---

## Frontend Components

### Marketing Module

| Component | Location | Purpose |
|-----------|----------|---------|
| DocumentBundlesPage | `apps/marketing/src/pages/DocumentBundlesPage.tsx` | Main CRUD page for managing bundles |
| BundleCreateEditModal | `apps/marketing/src/components/BundleCreateEditModal.tsx` | Modal for creating/editing bundle name & description |
| BundleDocumentPicker | `apps/marketing/src/components/BundleDocumentPicker.tsx` | Component for adding documents to a bundle |

### Contacts Module (Email Integration)

| Component | Location | Purpose |
|-----------|----------|---------|
| BundlePicker | `apps/contacts/src/components/BundlePicker.tsx` | Modal for selecting bundle to attach to email |
| EmailComposer | `apps/contacts/src/components/EmailComposer.tsx` | Updated to support bundle attachments |

### Navigation

- **Route**: `/marketing/document-bundles`
- **Entry Point**: Marketing Home Page > "Message Setup and Automation" section > "Document Bundles" tile

---

## Integration with Email System

### EmailComposer Changes

The EmailComposer component now accepts an optional `documentBundles` resource in its API prop:

```typescript
interface EmailComposerProps {
  api: {
    partyCrm: { emails: { send: (input: SendEmailInput) => Promise<PartyEmail> } };
    templates?: TemplatesResource;
    documentBundles?: DocumentBundlesResource;  // NEW
  };
  // ... other props
}
```

### SendEmailInput Extension

The email send input now supports a `bundleId` field:

```typescript
interface SendEmailInput {
  partyId: number;
  to: string;
  subject: string;
  body?: string;
  bodyHtml?: string;
  bodyText?: string;
  templateKey?: string;
  category?: "transactional" | "marketing";
  metadata?: Record<string, any>;
  bundleId?: number;  // NEW - Optional document bundle to attach
}
```

### User Flow

1. User opens EmailComposer from Contacts module
2. Clicks "Attach Bundle" button in footer
3. BundlePicker modal opens showing available bundles
4. User selects a bundle and previews its documents
5. Clicks "Attach Bundle" to confirm
6. Selected bundle appears in composer with document count
7. Bundle can be changed or removed before sending
8. On send, `bundleId` is included in the request payload

---

## File Locations

### API Package (`packages/api/`)

```
packages/api/src/
├── types/
│   └── document-bundles.ts       # Type definitions
├── resources/
│   └── document-bundles.ts       # API resource methods
└── index.ts                       # Exports (updated)
```

### Marketing App (`apps/marketing/`)

```
apps/marketing/src/
├── App-Marketing.tsx              # Route registration (updated)
├── pages/
│   ├── MarketingHomePage.tsx      # Navigation tile (updated)
│   └── DocumentBundlesPage.tsx    # Main page (new)
└── components/
    ├── BundleCreateEditModal.tsx  # Create/edit modal (new)
    └── BundleDocumentPicker.tsx   # Document picker (new)
```

### Contacts App (`apps/contacts/`)

```
apps/contacts/src/
└── components/
    ├── EmailComposer.tsx          # Bundle attachment support (updated)
    └── BundlePicker.tsx           # Bundle selection modal (new)
```

### Documentation (`docs/`)

```
docs/
├── erd/
│   └── 08-documents.md            # ERD updated with bundle schemas
└── marketing/
    └── DOCUMENT_BUNDLES.md        # This document
```

---

## Backend Implementation Notes

The frontend is complete. Backend implementation requires:

1. **Database Migration**: Create `DocumentBundle` and `DocumentBundleItem` tables
2. **API Routes**: Implement CRUD endpoints at `/api/v1/document-bundles`
3. **Email Service**: When processing `bundleId` in email send:
   - Fetch bundle and its documents
   - Attach documents to outgoing email
   - Log bundle reference in email audit trail

### Suggested API Route Structure

```typescript
// routes/document-bundles.ts
router.get("/", listBundles);
router.get("/:id", getBundle);
router.post("/", createBundle);
router.patch("/:id", updateBundle);
router.delete("/:id", deleteBundle);
router.post("/:id/documents", addDocuments);
router.delete("/:id/documents/:documentId", removeDocument);
router.put("/:id/documents/order", reorderDocuments);
```

---

## Testing Checklist

### Manual Testing

- [ ] Navigate to Marketing > Document Bundles
- [ ] Create a new bundle with name "Go Home Document Bundle"
- [ ] Edit bundle name and description
- [ ] Delete a bundle (with confirmation)
- [ ] Open EmailComposer from Contacts
- [ ] Click "Attach Bundle" button
- [ ] Select a bundle from the picker
- [ ] Verify bundle shows in composer with document count
- [ ] Change to a different bundle
- [ ] Remove bundle from composer
- [ ] Send email with bundle attached (verify `bundleId` in request)

### Build Verification

- [ ] `pnpm build` passes for `packages/api`
- [ ] `pnpm build` passes for `apps/marketing`
- [ ] `pnpm build` passes for `apps/contacts`
- [ ] No TypeScript errors in affected packages

---

## Future Enhancements

1. **Document Management UI**: Full UI for adding/removing/reordering documents within bundles
2. **Bundle Templates**: Pre-configured bundle templates by use case
3. **Bundle Analytics**: Track which bundles are used most frequently
4. **Bundle Versioning**: Track changes to bundle contents over time
5. **Portal Integration**: Allow buyers to view bundle documents in their portal
6. **Bulk Email**: Attach bundles to bulk email campaigns
