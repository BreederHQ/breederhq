# Client Profile Portal - Implementation Plan

## Overview

Add a "Profile" section to the client portal where clients can view and edit their contact information, with a two-tier approach:
- **Self-service fields**: Address, phone numbers, email - client updates directly (logged to audit)
- **Approval-required fields**: First name, last name, nickname - client proposes changes, breeder approves/rejects

## Data Model

### New Model: `ContactChangeRequest`

```prisma
model ContactChangeRequest {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  contactId Int
  contact   Contact  @relation(fields: [contactId], references: [id])

  // What changed
  fieldName     String   // "firstName" | "lastName" | "nickname"
  oldValue      String?  // Previous value (null if was empty)
  newValue      String   // Requested new value

  // Request metadata
  status        ChangeRequestStatus @default(PENDING)
  requestedAt   DateTime @default(now())
  requestedBy   String?  // User ID of client who requested (optional for audit)

  // Resolution
  resolvedAt    DateTime?
  resolvedBy    String?  // User ID of breeder who resolved
  resolutionNote String?  // Optional note from breeder (e.g., rejection reason)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([tenantId, status])
  @@index([contactId])
}

enum ChangeRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED  // Client withdrew request
}
```

### New Model: `EmailChangeRequest` (for email verification flow)

```prisma
model EmailChangeRequest {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  contactId Int
  contact   Contact  @relation(fields: [contactId], references: [id])

  // Email change
  oldEmail      String?
  newEmail      String

  // Verification
  verificationToken String   @unique @default(cuid())
  verifiedAt        DateTime?

  // Status
  status      EmailChangeStatus @default(PENDING_VERIFICATION)
  requestedAt DateTime @default(now())
  expiresAt   DateTime // Token expiry (e.g., 24 hours)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([contactId])
  @@index([verificationToken])
}

enum EmailChangeStatus {
  PENDING_VERIFICATION  // Waiting for email verification
  VERIFIED              // Email verified, change applied
  EXPIRED               // Verification token expired
  CANCELLED             // Client cancelled
}
```

### Updates to Contact Model

Add relation fields:

```prisma
model Contact {
  // ... existing fields ...

  // Change requests
  changeRequests     ContactChangeRequest[]
  emailChangeRequests EmailChangeRequest[]
}
```

### Audit Trail

Use existing `PartyActivity` model with new activity kinds:

```prisma
enum PartyActivityKind {
  // ... existing kinds ...
  PROFILE_UPDATED_BY_CLIENT    // Client self-updated address/phone
  NAME_CHANGE_REQUESTED        // Client requested name change
  NAME_CHANGE_APPROVED         // Breeder approved name change
  NAME_CHANGE_REJECTED         // Breeder rejected name change
  EMAIL_CHANGE_REQUESTED       // Client requested email change
  EMAIL_CHANGE_VERIFIED        // Client verified new email
  EMAIL_CHANGE_EXPIRED         // Email change request expired
}
```

---

## API Endpoints

### Portal API (Client-facing)

#### `GET /portal/profile`
Returns client's current profile info and any pending change requests.

```typescript
Response: {
  profile: {
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
    email: string;
    phoneMobile: string | null;
    phoneLandline: string | null;
    whatsapp: string | null;
    street: string | null;
    street2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
  pendingChanges: {
    id: number;
    fieldName: string;
    newValue: string;
    requestedAt: string;
    status: "PENDING";
  }[];
  pendingEmailChange: {
    newEmail: string;
    requestedAt: string;
    status: "PENDING_VERIFICATION";
  } | null;
}
```

#### `PATCH /portal/profile`
Update self-service fields (address, phones). Creates audit entry.

```typescript
Request: {
  phoneMobile?: string | null;
  phoneLandline?: string | null;
  whatsapp?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

Response: { ok: true; profile: {...} }
```

#### `POST /portal/profile/request-name-change`
Request a name field change (requires approval).

```typescript
Request: {
  fieldName: "firstName" | "lastName" | "nickname";
  newValue: string;
}

Response: { ok: true; request: { id, fieldName, newValue, status, requestedAt } }
```

#### `DELETE /portal/profile/request-name-change/:id`
Cancel a pending name change request.

#### `POST /portal/profile/request-email-change`
Start email change flow - sends verification to new email.

```typescript
Request: {
  newEmail: string;
  currentPassword: string;  // Re-authentication required
}

Response: { ok: true; message: "Verification email sent" }
```

#### `POST /portal/profile/verify-email`
Verify new email with token (from email link).

```typescript
Request: {
  token: string;
}

Response: { ok: true; message: "Email updated successfully" }
```

### Breeder API (Dashboard-facing)

#### `GET /contacts/:id/change-requests`
Get pending change requests for a contact.

#### `POST /contacts/:id/change-requests/:requestId/approve`
Approve a name change request. Updates Contact and creates audit entry.

#### `POST /contacts/:id/change-requests/:requestId/reject`
Reject a name change request with optional reason.

```typescript
Request: {
  reason?: string;
}
```

#### `GET /dashboard/pending-changes`
Get count/list of all pending change requests across contacts (for notification badge).

---

## Frontend Components

### Portal - Profile Page (`PortalProfilePage.tsx`)

New page at `/profile` route.

**Sections:**
1. **Identity** (approval-required)
   - First Name, Last Name, Nickname
   - Read-only display with "Request Change" button
   - Shows pending requests with status badge
   - "Cancel Request" option for pending

2. **Email** (verification-required)
   - Current email (read-only)
   - "Change Email" button
   - Re-auth modal -> verification email sent
   - Shows pending verification status

3. **Contact Information** (self-service)
   - Cell Phone, Landline, WhatsApp
   - Editable inline with Save button
   - Changes apply immediately

4. **Address** (self-service)
   - Street, Street 2, City, State, Postal Code, Country
   - Editable inline with Save button
   - Changes apply immediately

### Portal - Navigation

Add "Profile" link to portal navigation (next to Messages, etc.).

### Breeder Dashboard - Notifications

#### Pending Changes Alert Badge

Add to notification icon in header:
- Count of pending `ContactChangeRequest` with `status = PENDING`
- Click navigates to contacts with pending changes

#### Dashboard Todo Card

New card type: "Profile Change Requests"
- Shows count of pending requests
- Links to filtered view

### Contact Card - Alert Badge

Similar to vaccination alert badge:
- Flashing red dot on contact cards with pending change requests
- Uses existing `animate-pulse` pattern

### Contact Drawer - Tab Highlighting

Add "Profile" tab (or highlight existing "Overview" tab):
- Red border/background when pending changes exist
- Pattern: `border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20`

### Contact Drawer - Change Request UI

In Overview tab or new "Profile Changes" section:
- List pending requests with Approve/Reject buttons
- Show old vs new value comparison
- Rejection reason input (optional)

---

## User Flows

### Flow 1: Client Updates Address (Self-Service)

1. Client navigates to Profile page
2. Edits address fields
3. Clicks Save
4. API updates Contact directly
5. `PartyActivity` created with kind `PROFILE_UPDATED_BY_CLIENT`
6. Success toast shown

### Flow 2: Client Requests Name Change

1. Client clicks "Request Change" on First Name
2. Enters new value in modal
3. Submits request
4. `ContactChangeRequest` created with status `PENDING`
5. `PartyActivity` created with kind `NAME_CHANGE_REQUESTED`
6. Breeder notification badge increments
7. Client sees "Pending approval" status

### Flow 3: Breeder Approves Name Change

1. Breeder sees notification badge
2. Opens contact drawer
3. Sees highlighted tab / alert
4. Reviews change request (old -> new)
5. Clicks Approve
6. Contact field updated
7. Request status -> `APPROVED`
8. `PartyActivity` created with kind `NAME_CHANGE_APPROVED`
9. Client sees "Approved" status on next visit

### Flow 4: Client Changes Email

1. Client clicks "Change Email"
2. Re-authentication modal (enter current password)
3. Enters new email address
4. `EmailChangeRequest` created
5. Verification email sent to NEW address
6. Client clicks link in email
7. Token validated
8. Contact email updated
9. Login email updated (if applicable)
10. Old email notified of change
11. `PartyActivity` created

---

## Implementation Order

### Phase 1: Schema & API
1. Add `ContactChangeRequest` model
2. Add `EmailChangeRequest` model
3. Update `PartyActivityKind` enum
4. Create migration
5. Implement portal profile API endpoints
6. Implement breeder change request endpoints

### Phase 2: Portal UI
1. Create `PortalProfilePage.tsx`
2. Add profile route
3. Add navigation link
4. Implement self-service editing
5. Implement name change request flow
6. Implement email change flow (without verification for MVP)

### Phase 3: Breeder UI
1. Add pending changes count to dashboard
2. Add alert badge to contact cards
3. Add tab highlighting in contact drawer
4. Add change request approval UI in drawer

### Phase 4: Email Verification
1. Create email verification template
2. Implement token generation/validation
3. Add re-authentication flow
4. Add notification to old email

---

## Security Considerations

1. **Email Changes**: Require re-authentication to prevent account takeover
2. **Rate Limiting**: Limit change requests per contact (e.g., 5 per day)
3. **Audit Trail**: All changes logged with timestamps and actor IDs
4. **Token Expiry**: Email verification tokens expire after 24 hours
5. **Input Validation**: Sanitize all inputs, validate email format

---

## Questions Resolved

1. **Where do pending requests live?** -> New `ContactChangeRequest` table
2. **Audit trail?** -> `PartyActivity` with new kinds
3. **Clients see pending status?** -> Yes, shown on profile page
4. **Breeder notifications?** -> Yes, badge + todo card
5. **Email verification?** -> Yes, with re-auth required
