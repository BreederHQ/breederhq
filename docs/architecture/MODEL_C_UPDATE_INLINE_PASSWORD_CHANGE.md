# Model C Update: Inline Password Change Flow

## Overview
This update implements an inline forced password-change flow on the Sign in screen and fixes bullet alignment issues in the Admin UI.

## Changes Implemented

### 1. Backend: Enhanced Change-Password Endpoint Security

**File**: `breederhq-api/src/routes/auth.ts`

**Endpoint**: `POST /api/v1/auth/change-password`

**Updated Request Signature**:
```typescript
{
  token: string,              // Change-password token from login
  tempPassword: string,       // NEW: User's current temporary password
  newPassword: string         // The new password to set
}
```

**New Behavior**:
- Now REQUIRES the temporary password to be provided
- Verifies `tempPassword` matches current password hash before allowing change
- Returns 401 `temp_password_incorrect` if temp password is wrong
- Prevents token-only password changes (added security layer)

**Error Responses**:
- `400` `token_temp_and_new_password_required` - Missing required fields
- `400` `password_too_short` - New password < 8 characters
- `401` `temp_password_incorrect` - Temporary password is wrong
- `400` `invalid_or_expired_token` - Token expired or invalid
- `400` `invalid_token_type` - Not a change-password token

### 2. Frontend: Inline Password Change UI

**File**: `breederhq/apps/platform/src/pages/LoginPage.tsx`

**New Features**:

#### A. Must-Change Password Detection
- Detects 403 response with `must_change_password` error from login
- Extracts `changePasswordToken` from response
- Switches UI mode to `mustChangeMode = true`
- Clears entered password for security

#### B. Dual-Mode UI
Two form states in same component:

**Normal Login Mode** (`!mustChangeMode`):
- Email input
- Password input
- "Sign in" button

**Must-Change Mode** (`mustChangeMode`):
- Shows account email (read-only)
- Temporary Password input (required)
- New Password input (min 8 chars, required)
- Confirm New Password input (required)
- "Set password and sign in" button
- "← Back to sign in" link to reset state

#### C. Client-Side Validation
Before submitting change-password request:
- Validates temporary password is not empty
- Ensures new password is at least 8 characters
- Confirms new password matches confirmation
- Provides clear inline error messages

#### D. Security Measures
- ✅ No plaintext passwords in logs
- ✅ Never stores passwords in localStorage or query params
- ✅ Clears sensitive fields on unmount (useEffect cleanup)
- ✅ Clears password fields after successful change
- ✅ Auto-login after successful password change

#### E. Auto-Login Flow
After successful password change:
1. Clear sensitive data from state
2. Show success notice
3. Automatically call `/auth/login` with email + new password
4. Redirect to app on success

#### F. Error Handling
Specific error messages for:
- Temporary password missing
- New password too short
- Passwords don't match
- Incorrect temporary password
- Expired token
- Generic failure

### 3. Admin UI: Bullet Alignment Fix

**File**: `breederhq/apps/admin/src/App-Admin.tsx`

**Fixed Locations**:
1. Tenant creation success panel (line 957)
2. Owner password reset success panel (line 180)

**Fix Applied**:
```tsx
<ul className="list-disc list-inside pl-2 space-y-1 text-secondary">
```

Added `pl-2` (padding-left: 0.5rem / 8px) to shift bullet markers inside the bordered box.

**Classes Breakdown**:
- `list-disc` - Disc-style bullets
- `list-inside` - Bullets render inside content flow
- `pl-2` - **NEW**: Left padding to contain bullets within border
- `space-y-1` - Vertical spacing between items
- `text-secondary` - Muted text color

### 4. Tests: Enhanced Coverage

**File**: `breederhq-api/src/routes/auth.test.ts`

**Updated Tests**:

1. **"Change password endpoint clears mustChangePassword"**
   - Now sets known temp password before test
   - Passes `tempPassword` in request
   - Verifies password change clears `mustChangePassword`

2. **NEW: "Change password rejects incorrect temp password"**
   - Sets known temp password
   - Attempts change with wrong temp password
   - Expects 401 `temp_password_incorrect`
   - Verifies `mustChangePassword` remains true

**Test Coverage Now Includes**:
- ✅ Temp password validation
- ✅ Incorrect temp password rejection
- ✅ Token expiration
- ✅ Password change success
- ✅ Must-change flag clearing
- ✅ Auto-login after change (implicit via integration)

## User Flow Example

### Scenario: New tenant owner first login

1. **Admin creates tenant** (existing flow):
   - Admin generates temp password: `X7k#mP2nQ9vR5wT`
   - Admin shares password with owner via secure channel

2. **Owner visits login page**:
   - Enters email: `john@acme.com`
   - Enters temp password: `X7k#mP2nQ9vR5wT`
   - Clicks "Sign in"

3. **Backend returns must-change**:
   ```json
   {
     "error": "must_change_password",
     "message": "You must change your password before logging in",
     "changePasswordToken": "eyJhbGc..."
   }
   ```

4. **UI switches to must-change mode**:
   - Shows "Set your new password" heading
   - Account field shows: `john@acme.com`
   - Three password fields appear:
     - Temporary Password
     - New Password
     - Confirm New Password

5. **Owner sets new password**:
   - Enters temp: `X7k#mP2nQ9vR5wT`
   - Enters new: `MySecurePass123!`
   - Confirms: `MySecurePass123!`
   - Clicks "Set password and sign in"

6. **Frontend validation**:
   - Checks temp password not empty ✓
   - Checks new password >= 8 chars ✓
   - Checks new === confirm ✓

7. **Backend validates and updates**:
   - Verifies change token valid ✓
   - Verifies temp password correct ✓
   - Hashes new password
   - Sets `mustChangePassword = false`
   - Sets `lastPasswordChangeAt = now()`

8. **Auto-login**:
   - Frontend calls `/auth/login` with email + new password
   - Backend issues session cookie
   - Redirects to `/` (app home)

9. **Owner is logged in** ✅

## Breaking Changes

### Backend API Change

**⚠️ BREAKING**: `/auth/change-password` now requires `tempPassword`

**Before**:
```json
{
  "token": "...",
  "newPassword": "..."
}
```

**After**:
```json
{
  "token": "...",
  "tempPassword": "...",  // NEW: Required
  "newPassword": "..."
}
```

**Migration Path**:
- Existing clients MUST update to include `tempPassword`
- Admin-initiated password resets still work (they generate new temp passwords)
- Users in must-change state already have temp password from admin

## Security Improvements

| Improvement | Impact |
|------------|--------|
| Temp password verification | Prevents token-only password changes |
| Client-side validation | Reduces invalid API calls |
| Sensitive data cleanup | Prevents password leaks in memory |
| No storage/logging | Prevents plaintext exposure |
| Confirm password match | Reduces user typos |
| Auto-login after change | Seamless UX, no password re-entry |

## Testing Instructions

### Manual Test: Must-Change Flow

1. **Create tenant with temp password**:
   ```bash
   # As admin
   POST /api/v1/tenants/admin-provision
   {
     "tenant": { "name": "Test Co" },
     "owner": {
       "email": "test@example.com",
       "generateTempPassword": true
     }
   }
   ```
   Copy the `tempPassword` from response.

2. **Try to login**:
   - Go to `/login`
   - Enter email and temp password
   - Click "Sign in"
   - Should see "Set your new password" form ✓

3. **Test validation errors**:
   - Leave temp password empty → "Temporary password is required"
   - Enter temp password, new password < 8 chars → "New password must be at least 8 characters"
   - Enter mismatched confirm → "Passwords do not match"

4. **Test wrong temp password**:
   - Enter wrong temp password
   - Valid new password
   - Submit → "Temporary password is incorrect"

5. **Successful password change**:
   - Enter correct temp password
   - Enter valid new password (8+ chars)
   - Confirm matches
   - Submit → Auto-login and redirect to `/` ✓

6. **Test token expiration**:
   - Wait 16 minutes (tokens expire in 15 min)
   - Try to change password
   - Should see "Your session has expired. Please try logging in again."

### Automated Tests

```bash
cd breederhq-api
npm test src/routes/auth.test.ts
```

Expected output:
```
✓ Admin can create tenant with owner and temp password
✓ User with mustChangePassword cannot login normally
✓ Change password endpoint clears mustChangePassword
✓ Change password rejects incorrect temp password  (NEW)
✓ After password change, user can login normally
✓ Admin can reset owner password
✓ Password change token expires correctly

Test Files  1 passed (1)
     Tests  7 passed (7)
```

## UI Screenshots (Conceptual)

### Before (Login)
```
┌─────────────────────────┐
│  Sign in                │
│                         │
│  Email                  │
│  ┌───────────────────┐  │
│  │ you@example.com   │  │
│  └───────────────────┘  │
│                         │
│  Password               │
│  ┌───────────────────┐  │
│  │ •••••••••••       │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │   Sign in         │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### After (Must-Change)
```
┌─────────────────────────────┐
│  Set your new password      │
│  You must change your       │
│  temporary password.        │
│                             │
│  Account: john@acme.com     │
│                             │
│  Temporary Password         │
│  ┌───────────────────────┐  │
│  │ Enter temp password   │  │
│  └───────────────────────┘  │
│                             │
│  New Password               │
│  ┌───────────────────────┐  │
│  │ At least 8 characters │  │
│  └───────────────────────┘  │
│                             │
│  Confirm New Password       │
│  ┌───────────────────────┐  │
│  │ Re-enter new password │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ Set password & sign in│  │
│  └───────────────────────┘  │
│                             │
│  ← Back to sign in          │
└─────────────────────────────┘
```

## Files Changed

### Backend
- `breederhq-api/src/routes/auth.ts` - Added temp password verification
- `breederhq-api/src/routes/auth.test.ts` - Updated/added tests

### Frontend
- `breederhq/apps/platform/src/pages/LoginPage.tsx` - Inline password change UI
- `breederhq/apps/admin/src/App-Admin.tsx` - Bullet alignment fixes

## Rollout Checklist

- [x] Backend updated to require `tempPassword`
- [x] Frontend updated to provide `tempPassword`
- [x] Bullet alignment fixed in Admin UI
- [x] Tests updated for new flow
- [x] Error messages user-friendly
- [x] Auto-login working after change
- [x] Sensitive data cleared on unmount
- [x] Validation messages clear

## Future Enhancements (Not Implemented)

1. Password strength meter in must-change form
2. Show password toggle for new password fields
3. Password policy checklist (uppercase, numbers, special chars)
4. Session persistence across password change (skip re-login)
5. Email notification after password change
6. Password history to prevent reuse

## Support

For issues:
1. Check browser console for errors
2. Verify backend `/auth/change-password` endpoint accepts `tempPassword`
3. Check that temp password from admin matches what user is entering
4. Verify token hasn't expired (15 min window)
5. Review `MODEL_C_IMPLEMENTATION.md` for full context

## Conclusion

The inline password change flow is now fully implemented with:
- ✅ Enhanced security (temp password verification)
- ✅ Seamless UX (inline form, auto-login)
- ✅ Clear validation (client + server)
- ✅ Proper cleanup (no password leaks)
- ✅ Comprehensive tests
- ✅ Fixed UI alignment issues

All non-negotiables from requirements satisfied.
