# Finance Follow-Up: OAuth Connectors and QuickBooks Online

**Recon scope:** Frontend-only codebase. Backend infrastructure unknown.

**Goal:** Assess readiness for QuickBooks Online integration via OAuth 2.0 token storage and sync primitives.

---

## What Exists

### OAuth Infrastructure

**Searched:** `oauth|refresh_token|access_token|client_secret|client_id|realm|intuit|quickbooks`

**Found:**
- **One mention:** [docs/confluence_structure.md](../../confluence_structure.md) (unrelated, documentation structure).
- **No application code.**

**Conclusion:** No OAuth connector framework detected.

### Token Storage Patterns

**Searched:** `encrypt|kms|secret|vault|token`

**Found (token-related):**

| Artifact | Location | Use Case | Notes |
|----------|----------|----------|-------|
| CSRF token | [apps/platform/src/api.ts](apps/platform/src/api.ts) | Mutation protection | `XSRF-TOKEN` cookie |
| Change password token | [apps/platform/src/pages/LoginPage.tsx:46](apps/platform/src/pages/LoginPage.tsx#L46) | Temp credentials | Short-lived, in-memory |
| Invite token | [apps/platform/src/pages/InviteSignupPage.tsx](apps/platform/src/pages/InviteSignupPage.tsx) | User onboarding | Query param, one-time use |

**No evidence of:**
- Encrypted token storage.
- KMS/vault integration.
- OAuth `refresh_token` persistence.

**Observations:**
- No secrets management beyond environment variables (inferred from `import.meta.env.VITE_*`).

### Tenant Isolation Patterns

**Found:** [apps/platform/src/api.ts](apps/platform/src/api.ts)

```typescript
function resolveScope(): { tenantId?: number; orgId?: number } {
  const tenantId = /* runtime, localStorage, or env */;
  // ...
}

// Every API request:
if (scope.tenantId) headers.set("x-tenant-id", String(scope.tenantId));
```

**Observations:**
- Tenant ID passed in header.
- Backend must enforce tenant scoping in all queries.
- OAuth tokens MUST be tenant-scoped to prevent cross-tenant access.

---

## What is Missing

### OAuth Connection Model

**No schema for:**
- Storing OAuth credentials per tenant.
- Tracking connection status (active, expired, revoked).
- Storing QuickBooks realm ID (company identifier).

**Recommended schema:**
```prisma
model AccountingConnection {
  id              Int       @id @default(autoincrement())
  tenantId        Int
  provider        String    // "quickbooks_online", "xero", "freshbooks"
  status          String    // "active", "expired", "revoked", "error"

  // OAuth tokens (MUST BE ENCRYPTED)
  accessToken     String    // Encrypted
  refreshToken    String    // Encrypted
  tokenExpiresAt  DateTime

  // Provider-specific metadata
  realmId         String?   // QuickBooks company ID
  companyName     String?

  // Sync state
  lastSyncAt      DateTime?
  lastSyncStatus  String?   // "success", "partial", "failed"

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@unique([tenantId, provider])
  @@index([tenantId, status])
}
```

**Critical security requirement:** `accessToken` and `refreshToken` MUST be encrypted at rest.

### Sync State Tracking

**No schema for:**
- Tracking which invoices/expenses have been synced to QuickBooks.
- Detecting conflicts (record modified in both systems).

**Recommended schema:**
```prisma
model SyncMapping {
  id              Int      @id @default(autoincrement())
  tenantId        Int
  provider        String   // "quickbooks_online"

  // Local entity
  entityType      String   // "Invoice", "Expense", "Payment"
  entityId        Int

  // Remote entity
  remoteId        String   // QuickBooks ID
  remoteVersion   String?  // QuickBooks SyncToken (for conflict detection)

  // Sync metadata
  syncDirection   String   // "push", "pull", "bidirectional"
  lastSyncedAt    DateTime
  syncStatus      String   // "synced", "conflict", "error"
  errorMessage    String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([tenantId, provider, entityType, entityId])
  @@unique([tenantId, provider, remoteId])
  @@index([tenantId, syncStatus])
}
```

### OAuth Flow Endpoints

**Missing:**
1. `GET /api/v1/integrations/quickbooks/connect` → Redirect to Intuit OAuth.
2. `GET /api/v1/integrations/quickbooks/callback` → Handle OAuth callback, exchange code for tokens.
3. `POST /api/v1/integrations/quickbooks/disconnect` → Revoke tokens.
4. `GET /api/v1/integrations/quickbooks/status` → Check connection health.

### Token Refresh Logic

**QuickBooks tokens expire after 1 hour.**
- Must refresh using `refresh_token` (valid for 100 days).
- Refresh before expiry or on 401 response.
- Update `AccountingConnection.accessToken` and `tokenExpiresAt`.

**No implementation found.**

### Encryption Utilities

**No evidence of:**
- `encrypt(plaintext, key)` / `decrypt(ciphertext, key)`.
- Key management (env var `ENCRYPTION_KEY`, KMS, or Vault).

**Recommended approach:**
```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32-byte key

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(Buffer.from(encryptedHex, 'hex')) + decipher.final('utf8');
}
```

**Store in DB:** Encrypted string.
**Use at runtime:** Decrypt before API call to QuickBooks.

---

## Decision / Recommendation

### QuickBooks Online Integration Timeline

**Phase 1.0 (MVP):** No QBO integration. Manual entry only.

**Phase 2.0 (QBO Sync):**
1. Implement OAuth connector framework.
2. Add `AccountingConnection` and `SyncMapping` models.
3. Build sync engine (push invoices, pull payments).

**Rationale:**
- QBO integration is complex (OAuth, rate limits, field mapping, conflict resolution).
- Not a blocker for MVP (manual accounting is viable for early adopters).
- Defer to post-MVP to avoid scope creep.

### Connector Strategy

**Option A: Build Custom (Recommended)**

**Pros:**
- Full control over sync logic.
- Tenant-specific customization.

**Cons:**
- Development effort.
- Must handle OAuth, token refresh, error cases.

**Option B: Use Integration Platform (Merge.dev, Paragon, etc.)**

**Pros:**
- Pre-built OAuth flows.
- Unified API for QBO, Xero, FreshBooks.

**Cons:**
- Cost (per-tenant pricing).
- Less control over sync logic.

**Recommendation:** **Option A for MVP** (one provider, custom logic). Consider Option B if supporting 3+ accounting platforms.

### Token Storage

**Non-negotiable:**
- Tokens MUST be encrypted at rest.
- `ENCRYPTION_KEY` MUST be stored securely (env var, KMS, or Vault).
- Tokens MUST be tenant-scoped (no shared credentials).

**Schema constraints:**
```prisma
@@unique([tenantId, provider]) // One connection per tenant per provider
```

### Sync Approach

**One-way push (Phase 2.0):**
- BreederHQ invoices → QuickBooks invoices.
- BreederHQ expenses → QuickBooks bills.
- No pull (QuickBooks is source of truth for GL, not invoices).

**Two-way sync (Phase 2.1+):**
- Pull payments from QuickBooks → BreederHQ.
- Conflict detection via `SyncToken` (QuickBooks versioning).

---

## MVP Impact

**Low (MVP 1.0), High (Phase 2.0)**

**Why:**
- MVP 1.0: No QBO dependency. Manual export acceptable.
- Phase 2.0: QBO sync is major value prop for professional breeders (accountant collaboration).

**Not a blocker** unless:
- MVP requirements explicitly demand QBO integration.
- Target customers refuse to use system without accounting sync.

**Immediate next steps (for Phase 2.0 planning):**
1. Add `AccountingConnection` and `SyncMapping` models to schema.
2. Implement encryption utilities.
3. Register QuickBooks app at [developer.intuit.com](https://developer.intuit.com).
4. Build OAuth flow (`/connect`, `/callback`).
5. Implement invoice push: `POST https://sandbox-quickbooks.api.intuit.com/v3/company/{realmId}/invoice`.
6. Test with QuickBooks Sandbox.

---

## QuickBooks API Notes

### OAuth 2.0 Flow

1. **User clicks "Connect QuickBooks"** → Redirect to:
   ```
   https://appcenter.intuit.com/connect/oauth2
     ?client_id={CLIENT_ID}
     &redirect_uri={CALLBACK_URL}
     &response_type=code
     &scope=com.intuit.quickbooks.accounting
     &state={TENANT_ID}
   ```

2. **User authorizes** → QuickBooks redirects to:
   ```
   {CALLBACK_URL}?code={AUTH_CODE}&state={TENANT_ID}&realmId={COMPANY_ID}
   ```

3. **Backend exchanges code for tokens:**
   ```bash
   curl -X POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer \
     -H "Authorization: Basic {BASE64(CLIENT_ID:CLIENT_SECRET)}" \
     -d "grant_type=authorization_code&code={AUTH_CODE}&redirect_uri={CALLBACK_URL}"
   ```

4. **Response:**
   ```json
   {
     "access_token": "...",
     "refresh_token": "...",
     "expires_in": 3600,
     "x_refresh_token_expires_in": 8726400
   }
   ```

5. **Store encrypted tokens** in `AccountingConnection`.

### Token Refresh

```bash
curl -X POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer \
  -H "Authorization: Basic {BASE64(CLIENT_ID:CLIENT_SECRET)}" \
  -d "grant_type=refresh_token&refresh_token={REFRESH_TOKEN}"
```

**Schedule:** Refresh 5 minutes before expiry.

### Invoice Sync Example

**Create invoice in QuickBooks:**
```json
POST https://quickbooks.api.intuit.com/v3/company/{realmId}/invoice
Authorization: Bearer {ACCESS_TOKEN}

{
  "CustomerRef": { "value": "123" },
  "Line": [
    {
      "Amount": 50.00,
      "DetailType": "SalesItemLineDetail",
      "SalesItemLineDetail": {
        "ItemRef": { "value": "1" }
      },
      "Description": "Stud Fee - INV-2025-0001"
    }
  ]
}
```

**Map:**
- `Invoice.clientPartyId` → QuickBooks Customer (lookup or create).
- `Invoice.number` → QuickBooks DocNumber.
- `Invoice.total` → Sum of Line items.

**Store mapping:**
```sql
INSERT INTO SyncMapping (tenantId, provider, entityType, entityId, remoteId)
VALUES (1, 'quickbooks_online', 'Invoice', 123, 'QB_INVOICE_456');
```

---

## Open Questions

1. **Which accounting platforms?** QBO only, or also Xero, FreshBooks?
2. **Chart of accounts mapping?** How to map invoice line items to QBO accounts?
3. **Customer sync?** Auto-create QuickBooks customers from BreederHQ parties?
4. **Multi-currency?** QuickBooks supports multi-currency, does BreederHQ?

---

**Related:**
- [schema-findings.md](../schema-findings.md) - Invoice/Payment models
- [gaps-and-recommendations.md](../gaps-and-recommendations.md) - Party migration (client mapping)
