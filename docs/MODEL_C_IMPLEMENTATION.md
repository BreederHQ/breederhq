# Model C Implementation Summary

## Overview
This document summarizes the implementation of Model C for tenant creation and password management in the BreederHQ application.

## Model C Definition
Admin creates a Tenant with an initial Owner user, sets a temporary password (manual or generated), and enforces password change on first login.

## Implementation Details

### 1. Database Schema Changes

**File**: `breederhq-api/prisma/schema.prisma`

Added new fields to the `User` model:
- `mustChangePassword` (Boolean, default: false) - Enforces password change on next login
- `passwordSetAt` (DateTime, nullable) - Timestamp when password was set
- `lastPasswordChangeAt` (DateTime, nullable) - Timestamp of last password change

**Migration**: Schema pushed to database via `npx prisma db push`

### 2. Backend API Changes

#### A. Tenant Provisioning Endpoint (Updated)
**File**: `breederhq-api/src/routes/tenant.ts`

**Endpoint**: `POST /tenants/admin-provision`

**New Request Fields**:
```typescript
{
  tenant: { name: string; primaryEmail?: string },
  owner: {
    email: string,
    name?: string,
    verify?: boolean,
    makeDefault?: boolean,
    tempPassword?: string,           // NEW: Manual password
    generateTempPassword?: boolean   // NEW: Auto-generate
  },
  billing?: { ... }
}
```

**New Response Field**:
```typescript
{
  tenant: { ... },
  owner: { ... },
  billing: { ... },
  tempPassword: string  // NEW: Returned only once
}
```

**Key Implementation**:
- Added `generateStrongPassword()` function for secure password generation
- Hashes password with bcrypt (12 rounds)
- Sets `mustChangePassword = true` and `passwordSetAt = now()`
- Returns temp password only in response (not stored plaintext)
- All operations wrapped in transaction

#### B. Admin Password Reset Endpoint (New)
**File**: `breederhq-api/src/routes/tenant.ts`

**Endpoint**: `POST /admin/tenants/:tenantId/owner/reset-password`

**Request**:
```typescript
{
  tempPassword?: string,
  generateTempPassword?: boolean
}
```

**Response**:
```typescript
{
  ok: boolean,
  tempPassword: string
}
```

**Authorization**: Super admin only

**Behavior**:
- Finds the tenant owner (role = "OWNER")
- Generates or uses provided password
- Sets `mustChangePassword = true`
- Returns new password once

#### C. Login Enforcement (Updated)
**File**: `breederhq-api/src/routes/auth.ts`

**Endpoint**: `POST /api/v1/auth/login`

**New Behavior**:
1. Validates credentials normally
2. If `mustChangePassword = true`:
   - Creates a limited-scope change-password token (15 min expiry)
   - Returns 403 with error `must_change_password`
   - Includes `changePasswordToken` in response
   - Does NOT issue normal session cookie

**Response when must-change**:
```typescript
{
  error: "must_change_password",
  message: "You must change your password before logging in",
  changePasswordToken: string
}
```

#### D. Change Password Endpoint (New)
**File**: `breederhq-api/src/routes/auth.ts`

**Endpoint**: `POST /api/v1/auth/change-password`

**Request**:
```typescript
{
  token: string,      // From login response
  newPassword: string // Min 8 chars
}
```

**Behavior**:
- Validates token (purpose: "OTHER", identifier starts with "change-password:")
- Updates password hash
- Sets `mustChangePassword = false`
- Sets `lastPasswordChangeAt = now()`
- Consumes token (single-use)
- Cleans up other change-password tokens for user

**Response**:
```typescript
{
  ok: boolean,
  message: "Password changed successfully. You may now log in."
}
```

### 3. Frontend Admin UI Changes

#### A. Tenant Creation Modal (Updated)
**File**: `breederhq/apps/admin/src/App-Admin.tsx`

**New Form Fields**:
- Owner Name (optional)
- Password Generation Options:
  - Checkbox: "Generate strong password" (default: checked)
  - Manual password input (min 8 chars, shown when unchecked)

**Success Flow**:
After tenant creation, modal shows:
- Owner email (display only)
- Temporary password with Copy button
- Important notes:
  - Owner must change password on first login
  - Password will not be shown again
  - Admin can reset later

**Key Features**:
- Two-step modal (create form → success screen)
- Password shown only once with copy functionality
- Clear visual warnings (amber background for password)
- Modal cannot be dismissed until user clicks "Done"

#### B. Password Reset in Tenant Details (New)
**File**: `breederhq/apps/admin/src/App-Admin.tsx`

**Location**: Tenant details drawer, Overview tab

**New Section**: "Owner Password Reset"

**Features**:
- Button: "Reset Owner Password"
- Generates new temp password automatically
- Shows password once with Copy button
- Same visual treatment as creation flow
- Owner's `mustChangePassword` set to true

#### C. API Client Updates
**File**: `breederhq/apps/admin/src/api.ts`

**Updated Methods**:
```typescript
adminProvisionTenant(body: {
  tenant: { ... },
  owner: {
    email: string,
    name?: string,
    tempPassword?: string,
    generateTempPassword?: boolean,
    ...
  }
})

adminResetOwnerPassword(
  tenantId: number,
  body: { tempPassword?: string; generateTempPassword?: boolean }
)
```

### 4. Tests

**File**: `breederhq-api/src/routes/auth.test.ts`

**Test Coverage**:
1. ✅ Admin can create tenant with owner and temp password
2. ✅ User with mustChangePassword cannot login normally
3. ✅ Change password endpoint clears mustChangePassword
4. ✅ After password change, user can login normally
5. ✅ Admin can reset owner password
6. ✅ Password change token expires correctly

**Test Framework**: Vitest with Fastify test utilities

## Security Considerations

### ✅ Implemented
- Passwords hashed with bcrypt (12 rounds)
- Temp passwords never logged or stored in plaintext
- Temp password returned only once in API response
- Change-password tokens expire (15 minutes)
- Tokens are single-use (deleted after consumption)
- mustChangePassword enforced at auth layer
- Super admin auth required for admin endpoints

### ✅ Audit Trail
The following events are implicitly audited via database timestamps:
- Tenant created (`tenant.createdAt`)
- User created (`user.createdAt`)
- Password set (`user.passwordSetAt`)
- Password changed (`user.lastPasswordChangeAt`)
- Password updated (`user.passwordUpdatedAt`)

## API Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/tenants/admin-provision` | Super Admin | Create tenant + owner with temp password |
| POST | `/admin/tenants/:id/owner/reset-password` | Super Admin | Reset owner password |
| POST | `/auth/login` | Public | Login (enforces must-change) |
| POST | `/auth/change-password` | Token | Change password (clears must-change) |

## User Flow

### Initial Setup (Admin)
1. Admin opens "New Tenant" modal
2. Fills tenant name, owner email, owner name
3. Either:
   - Checks "Generate strong password" (default), or
   - Unchecks and enters manual password
4. Clicks "Create tenant"
5. System shows temp password with Copy button
6. Admin copies password and shares with owner
7. Admin clicks "Done"

### First Login (Owner)
1. Owner receives temp password from admin
2. Attempts to login at `/login`
3. Backend validates credentials
4. Backend returns 403 with `changePasswordToken`
5. Frontend redirects to change-password page
6. Owner enters new password
7. System validates (min 8 chars)
8. Backend clears `mustChangePassword`
9. Owner can now login normally

### Password Reset (Admin)
1. Admin opens tenant details
2. Navigates to Overview tab
3. Clicks "Reset Owner Password"
4. System generates new temp password
5. Shows password with Copy button
6. Admin shares with owner
7. Owner follows first-login flow again

## Environment Variables

No new environment variables required. Existing variables apply:
- `COOKIE_NAME` - Session cookie name (default: "bhq_s")
- `NODE_ENV` - Environment (production/development)

## Migration Notes

### Existing Users
Users created before this implementation will have:
- `mustChangePassword = false` (default)
- `passwordSetAt = null`
- `lastPasswordChangeAt = null`

They can continue logging in normally.

### Upgrading Existing Tenants
To require password change for existing owners:
```sql
UPDATE "User" SET "mustChangePassword" = true
WHERE id IN (
  SELECT "userId" FROM "TenantMembership"
  WHERE role = 'OWNER'
);
```

## Files Changed

### Backend
- `breederhq-api/prisma/schema.prisma` - Schema updates
- `breederhq-api/src/routes/tenant.ts` - Provision + reset endpoints
- `breederhq-api/src/routes/auth.ts` - Login enforcement + change-password
- `breederhq-api/src/routes/auth.test.ts` - Test coverage (NEW)

### Frontend
- `breederhq/apps/admin/src/api.ts` - API client methods
- `breederhq/apps/admin/src/App-Admin.tsx` - UI for create + reset

## Testing Instructions

### Manual Testing

1. **Create Tenant**:
   ```
   POST /tenants/admin-provision
   {
     "tenant": { "name": "Test Co" },
     "owner": {
       "email": "owner@test.com",
       "generateTempPassword": true
     }
   }
   ```
   ✅ Should return `tempPassword`

2. **Login (should fail)**:
   ```
   POST /auth/login
   { "email": "owner@test.com", "password": "<temp>" }
   ```
   ✅ Should return 403 with `changePasswordToken`

3. **Change Password**:
   ```
   POST /auth/change-password
   {
     "token": "<changePasswordToken>",
     "newPassword": "MyNewPass123!"
   }
   ```
   ✅ Should return success

4. **Login (should succeed)**:
   ```
   POST /auth/login
   { "email": "owner@test.com", "password": "MyNewPass123!" }
   ```
   ✅ Should return session + user data

5. **Reset Password**:
   ```
   POST /admin/tenants/:id/owner/reset-password
   { "generateTempPassword": true }
   ```
   ✅ Should return new `tempPassword`
   ✅ Login with old password should fail
   ✅ Must-change flow required again

### Automated Tests
```bash
cd breederhq-api
npm test src/routes/auth.test.ts
```

## Future Enhancements

### Nice-to-Have (Not Implemented)
1. Password complexity rules (uppercase, special chars, etc.)
2. Password history (prevent reuse)
3. Email notification when password is reset
4. Password expiry (force change every N days)
5. Detailed audit log table (separate from timestamps)
6. Rate limiting on change-password endpoint
7. Account lockout after N failed attempts

## Conclusion

Model C is fully implemented and tested. The system enforces:
- ✅ Admin-created tenants with owner accounts
- ✅ Temporary passwords (manual or generated)
- ✅ Must-change on first login (server-enforced)
- ✅ Admin password reset capability
- ✅ Single transaction for tenant + user + membership creation
- ✅ Passwords never stored in plaintext
- ✅ Temp passwords shown only once with copy UI
- ✅ Comprehensive test coverage

All non-negotiables from the requirements are satisfied.
