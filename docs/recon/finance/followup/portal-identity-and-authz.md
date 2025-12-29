# Finance Follow-Up: Portal Identity and Authorization

**Recon scope:** Frontend-only codebase. Backend auth inferred from login flow and API client.

**Goal:** Determine if portal/guest user patterns exist and how to scope client access to their invoices only.

---

## What Exists

### Current Auth Model

**Login flow:** [apps/platform/src/pages/LoginPage.tsx:37](apps/platform/src/pages/LoginPage.tsx#L37)

```typescript
const res = await fetch("/api/v1/auth/login", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
```

**Auth primitives:**

| Artifact | Location | Notes |
|----------|----------|-------|
| Login endpoint | `/api/v1/auth/login` | Session-based (credentials: include) |
| Logout endpoint | [apps/platform/src/api.ts](apps/platform/src/api.ts) | `/api/v1/auth/logout?redirect=...` |
| Me endpoint | [apps/platform/src/api.ts](apps/platform/src/api.ts) | `/api/v1/auth/me` - current user info |
| Password change | [apps/platform/src/pages/LoginPage.tsx:46](apps/platform/src/pages/LoginPage.tsx#L46) | `must_change_password` flow with `changePasswordToken` |
| CSRF protection | [apps/platform/src/api.ts](apps/platform/src/api.ts) | `XSRF-TOKEN` cookie → `x-csrf-token` header |

**Tenant scoping:** [apps/platform/src/api.ts](apps/platform/src/api.ts)

```typescript
function resolveScope(): { tenantId?: number; orgId?: number } {
  // Runtime, localStorage, or env
  const rtTid = Number(window.__BHQ_TENANT_ID__);
  const lsTid = Number(localStorage.getItem("BHQ_TENANT_ID"));
  const envTid = Number(import.meta.env.VITE_DEV_TENANT_ID);
  const tenantId = rtTid || lsTid || envTid || undefined;
  // ...
}

// Every request:
if (scope.tenantId) headers.set("x-tenant-id", String(scope.tenantId));
```

**Observations:**
- Tenant ID passed via header, NOT derived from session.
- User must belong to tenant (authorization likely backend-enforced).
- No evidence of multi-tenant user access in frontend code.

### Invite/Guest Patterns

**Searched:** `invite|invitation|magic.*link|portal|guest|public.*link|token`

**Found:**

| Artifact | Location | Pattern | Notes |
|----------|----------|---------|-------|
| Invite signup page | [apps/platform/src/pages/InviteSignupPage.tsx](apps/platform/src/pages/InviteSignupPage.tsx) | Invite-based registration | Creates new user account |
| Email verification | [apps/platform/src/pages/VerifyPage.tsx](apps/platform/src/pages/VerifyPage.tsx) | Email verification flow | Token-based |
| Change password token | [apps/platform/src/pages/LoginPage.tsx:46](apps/platform/src/pages/LoginPage.tsx#L46) | Temporary credential flow | Forces password reset |

**Invite signup flow (inferred):**
1. Admin sends invite link (not visible in frontend code).
2. User visits `/invite?token=...` → `InviteSignupPage`.
3. User creates full account → becomes tenant member.

**No evidence of:**
- Read-only guest users.
- Public invoice links (e.g., `/invoices/{uuid}/view`).
- Party-scoped access grants (client sees only their invoices).

---

## What is Missing

### Client Portal Identity

**No model found for:**
- **PortalUser** - External user (client) with limited access.
- **AccessGrant** - Permission to view specific resources (invoices).
- **Public/magic links** - Shareable invoice URLs without login.

**Current limitation:**
- Clients must be full tenant users to access data.
- No scoping to "only invoices where `clientPartyId = user.partyId`".

### Party-Scoped Authorization

**Missing enforcement:**
- Backend middleware to filter queries by `clientPartyId`.
- Frontend UI for party-specific views (client portal).

**Example (not implemented):**
```typescript
// Client A should only see:
GET /api/v1/invoices?clientPartyId={partyA}
// Backend must enforce: WHERE tenantId = X AND clientPartyId = {user.partyId}
```

### Invitation Model for Clients

**No evidence of:**
- `POST /api/v1/invoices/{id}/send-client-link`
- Email templates for invoice delivery with access link.

---

## Decision / Recommendation

### Option A: Full User Model (Simpler for MVP)

**Clients are regular users with restricted role.**

**Pros:**
- Reuse existing auth infrastructure.
- No new identity model.

**Cons:**
- Clients clutter tenant user list.
- Risk of privilege escalation if roles not enforced.

**Implementation:**
```prisma
model User {
  // ...
  role      String // "admin", "member", "client"
  partyId   Int?   // Link to Party (for clients)
}
```

**Middleware (backend):**
```typescript
if (user.role === 'client') {
  // Scope all queries to clientPartyId = user.partyId
  query.where.clientPartyId = user.partyId;
}
```

### Option B: Separate PortalUser Model (Better Isolation)

**Dedicated identity for external parties.**

**Schema:**
```prisma
model PortalUser {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  partyId   Int      // Links to Party (buyer/client)
  email     String
  passwordHash String?
  inviteToken  String? @unique
  invitedAt    DateTime?
  activatedAt  DateTime?
  lastLoginAt  DateTime?

  @@unique([tenantId, email])
  @@index([tenantId, partyId])
}

model AccessGrant {
  id            Int      @id @default(autoincrement())
  tenantId      Int
  portalUserId  Int
  resourceType  String   // "Invoice", "Contract"
  resourceId    Int
  expiresAt     DateTime?

  @@unique([portalUserId, resourceType, resourceId])
  @@index([tenantId, portalUserId])
}
```

**Pros:**
- Clean separation from tenant users.
- Explicit access grants (can revoke per-invoice).
- Supports passwordless magic links.

**Cons:**
- New auth flow (separate login endpoint).
- More complex schema.

### Recommendation: **Option A for MVP, Option B for Phase 2**

**MVP (Option A):**
1. Add `User.role = "client"` and `User.partyId`.
2. Backend middleware enforces `clientPartyId` scoping for role=client.
3. Frontend shows limited nav for clients (Finance tab only, filtered invoices).

**Phase 2 (Option B):**
1. Migrate client users to `PortalUser`.
2. Add `AccessGrant` for fine-grained control.
3. Enable magic links: `GET /portal/invoices/{uuid}?token=...`.

---

## Threat Model

### Tenant-Wide Access Risk

**Threat:** Client user accesses other clients' invoices.

**Mitigation (MVP):**
- Backend MUST filter: `WHERE clientPartyId = user.partyId`.
- Frontend MUST NOT display other clients' data (defense in depth).

### Anchor Data Leakage

**Threat:** Invoice anchors (animalId, offspringGroupId) expose tenant's breeding data.

**Mitigation:**
- Remove anchor IDs from client-facing API responses.
- Show only invoice line items, not related entities.

**Example (sanitized response):**
```json
{
  "id": 123,
  "number": "INV-2025-0001",
  "total": 5000,
  "lineItems": [
    { "description": "Stud Fee - Litter 2025-03", "amount": 5000 }
  ]
  // NO animalId, offspringGroupId, etc.
}
```

### Privilege Escalation

**Threat:** Client user changes role to "admin" via API.

**Mitigation:**
- Role changes only via admin endpoints.
- Separate permission check: `requireRole(['admin'])`.

---

## MVP Impact

**High**

**Why:**
- Client access is core value prop ("send invoices to clients").
- Without party-scoped auth, clients see all tenant invoices → **data breach**.
- Must be designed into initial API endpoints (retrofit is risky).

**Not a blocker IF:**
- MVP 1.0 is admin-only (no client access).
- Client portal deferred to MVP 1.1.

**Immediate next steps:**
1. Add `User.role` and `User.partyId` to schema.
2. Implement backend middleware for role-based query scoping.
3. Create `/api/v1/portal/invoices` endpoint (party-scoped, sanitized responses).
4. Design invite flow: `POST /invoices/{id}/send-invite` → email with signup link.

---

## Open Questions

1. **Magic links or full accounts?** If magic links, need token expiry and one-time use logic.
2. **Client can create own user?** Or tenant admin must invite first?
3. **Payment submission via portal?** If yes, need Stripe/Square integration tied to PortalUser.

---

**Related:**
- [schema-findings.md](../schema-findings.md) - Invoice.clientPartyId structure
- [gaps-and-recommendations.md](../gaps-and-recommendations.md) - Party migration context
