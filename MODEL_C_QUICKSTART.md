# Model C Quick Start Guide

## Summary of Changes

Model C implements secure tenant provisioning with mandatory password change on first login.

## Quick Setup

### 1. Database Migration
The schema has already been updated and pushed. To verify:
```bash
cd breederhq-api
npx prisma db push
```

### 2. Start the Application
```bash
# Backend
cd breederhq-api
npm run dev

# Frontend Admin
cd ../breederhq/apps/admin
npm run dev
```

## Usage Examples

### Create New Tenant (Admin UI)

1. Open Admin panel
2. Click "New Tenant"
3. Fill in:
   - Tenant name: "Acme Ranch"
   - Owner email: "john@acmeranch.com"
   - Owner name: "John Doe" (optional)
   - Check "Generate strong password" ✓
4. Click "Create tenant"
5. **Copy the temporary password** (shown only once!)
6. Share password with owner via secure channel
7. Click "Done"

### Owner First Login

When owner tries to login with temp password:
1. Backend returns `must_change_password` error
2. Frontend shows change-password form
3. Owner enters new password (min 8 characters)
4. System clears `mustChangePassword` flag
5. Owner can now login normally

### Reset Owner Password (Admin UI)

1. Open tenant details
2. Go to "Overview" tab
3. Scroll to "Owner Password Reset" section
4. Click "Reset Owner Password"
5. **Copy the new temp password**
6. Share with owner
7. Owner follows first-login flow again

## API Examples

### Create Tenant with Auto-Generated Password
```bash
curl -X POST http://localhost:3000/api/v1/tenants/admin-provision \
  -H "Content-Type: application/json" \
  -H "Cookie: bhq_s=<admin-session>" \
  -d '{
    "tenant": {
      "name": "Acme Ranch",
      "primaryEmail": "contact@acmeranch.com"
    },
    "owner": {
      "email": "john@acmeranch.com",
      "name": "John Doe",
      "verify": true,
      "generateTempPassword": true
    }
  }'
```

Response:
```json
{
  "tenant": { "id": 1, "name": "Acme Ranch", ... },
  "owner": { "id": "cuid", "email": "john@acmeranch.com", ... },
  "tempPassword": "X7k#mP2nQ9vR5wT"
}
```

### Create Tenant with Manual Password
```bash
curl -X POST http://localhost:3000/api/v1/tenants/admin-provision \
  -H "Content-Type: application/json" \
  -H "Cookie: bhq_s=<admin-session>" \
  -d '{
    "tenant": { "name": "Acme Ranch" },
    "owner": {
      "email": "john@acmeranch.com",
      "tempPassword": "TempPass123!"
    }
  }'
```

### Owner Login (First Time)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@acmeranch.com",
    "password": "X7k#mP2nQ9vR5wT"
  }'
```

Response (403):
```json
{
  "error": "must_change_password",
  "message": "You must change your password before logging in",
  "changePasswordToken": "eyJhbGc..."
}
```

### Change Password
```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGc...",
    "newPassword": "MySecurePass123!"
  }'
```

Response:
```json
{
  "ok": true,
  "message": "Password changed successfully. You may now log in."
}
```

### Owner Login (After Password Change)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@acmeranch.com",
    "password": "MySecurePass123!"
  }'
```

Response (200):
```json
{
  "ok": true,
  "user": {
    "id": "cuid",
    "email": "john@acmeranch.com",
    "name": "John Doe"
  },
  "tenant": { "id": 1 }
}
```

### Admin Reset Owner Password
```bash
curl -X POST http://localhost:3000/api/v1/admin/tenants/1/owner/reset-password \
  -H "Content-Type: application/json" \
  -H "Cookie: bhq_s=<admin-session>" \
  -d '{
    "generateTempPassword": true
  }'
```

Response:
```json
{
  "ok": true,
  "tempPassword": "N4q$xK8pL2vM6zA"
}
```

## Testing

Run the test suite:
```bash
cd breederhq-api
npm test src/routes/auth.test.ts
```

Expected output:
```
✓ Admin can create tenant with owner and temp password
✓ User with mustChangePassword cannot login normally
✓ Change password endpoint clears mustChangePassword
✓ After password change, user can login normally
✓ Admin can reset owner password
✓ Password change token expires correctly

Test Files  1 passed (1)
     Tests  6 passed (6)
```

## Security Checklist

✅ Passwords are hashed with bcrypt (12 rounds)
✅ Plaintext passwords never logged or stored
✅ Temp passwords shown only once in UI
✅ Change-password tokens expire (15 minutes)
✅ Tokens are single-use (deleted after consumption)
✅ `mustChangePassword` enforced server-side
✅ Admin endpoints require super admin auth
✅ Transactions ensure data consistency

## Troubleshooting

### "Email and password required"
- Ensure both `email` and `password` are provided in login request

### "Invalid credentials"
- Check password is correct
- Verify user exists in database
- Check `passwordHash` is set on user

### "must_change_password"
- This is expected behavior for new/reset accounts
- User must complete change-password flow
- Use the `changePasswordToken` from response

### "Invalid or expired token"
- Change-password tokens expire after 15 minutes
- Request a new password reset if token expired
- Ensure token matches format from login response

### "Unauthorized" (401) on admin endpoints
- Verify user has `isSuperAdmin = true`
- Check session cookie is valid
- Re-login if session expired

### "Forbidden" (403) on admin endpoints
- User is authenticated but not a super admin
- Only super admins can create tenants and reset passwords

## Database Queries for Debugging

### Check user's password status
```sql
SELECT
  id, email, "mustChangePassword",
  "passwordSetAt", "lastPasswordChangeAt",
  "emailVerifiedAt"
FROM "User"
WHERE email = 'john@acmeranch.com';
```

### Find tenant owner
```sql
SELECT u.id, u.email, u."mustChangePassword", tm.role
FROM "User" u
JOIN "TenantMembership" tm ON u.id = tm."userId"
WHERE tm."tenantId" = 1 AND tm.role = 'OWNER';
```

### Check for pending change-password tokens
```sql
SELECT
  identifier, purpose, expires,
  "createdAt"
FROM "VerificationToken"
WHERE purpose = 'OTHER'
  AND identifier LIKE 'change-password:%'
  AND expires > NOW();
```

### Manually set must-change flag
```sql
UPDATE "User"
SET "mustChangePassword" = true
WHERE email = 'john@acmeranch.com';
```

### Manually clear must-change flag (for testing)
```sql
UPDATE "User"
SET "mustChangePassword" = false,
    "lastPasswordChangeAt" = NOW()
WHERE email = 'john@acmeranch.com';
```

## Support

For issues or questions:
1. Check `MODEL_C_IMPLEMENTATION.md` for detailed implementation notes
2. Review test file `breederhq-api/src/routes/auth.test.ts` for examples
3. Check backend logs for error details
4. Verify database schema matches expected structure

## Next Steps

After implementing Model C, consider:
1. Email notifications for password resets
2. Password complexity requirements
3. Password expiry policies
4. Account lockout after failed attempts
5. Comprehensive audit logging
