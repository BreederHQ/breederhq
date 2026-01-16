# Marketplace Verification & 2FA API Reference

API documentation for the BreederHQ Marketplace verification system, including identity verification, phone verification, paid verification packages, and two-factor authentication.

## Authentication

All endpoints require authentication via marketplace session cookie (`bhq_m_s`).

## Base URL

```
Production: https://api.breederhq.com/api/v1/marketplace
Development: http://localhost:3000/api/v1/marketplace
```

---

## Verification Routes

Base path: `/verification`

### Provider (Breeder) Verification

#### Send Phone Verification Code

```http
POST /verification/providers/phone/send
Content-Type: application/json

{
  "phoneNumber": "+15125551234"
}
```

**Response (200):**
```json
{
  "ok": true,
  "expiresAt": "2026-01-13T12:10:00.000Z"
}
```

**Dev Response:** Includes `dev_code` with the verification code for testing.

**Rate Limit:** 3 requests/minute

---

#### Verify Phone Code

```http
POST /verification/providers/phone/verify
Content-Type: application/json

{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Rate Limit:** 5 requests/minute

---

#### Start Identity Verification (Stripe Identity)

```http
POST /verification/providers/identity/start
```

**Response (200):**
```json
{
  "ok": true,
  "sessionId": "vi_abc123...",
  "clientSecret": "vi_abc123_secret_xyz..."
}
```

Use `clientSecret` with Stripe Identity SDK on the frontend.

---

#### Purchase Verification Package

```http
POST /verification/providers/package/purchase
Content-Type: application/json

{
  "packageType": "VERIFIED",
  "submittedInfo": {
    "businessLicenseNumber": "ABC123",
    "yearsInBusiness": 5,
    "references": ["ref1@example.com", "ref2@example.com"]
  }
}
```

**Package Types:**
| Package | Price | Requirements |
|---------|-------|--------------|
| `VERIFIED` | $149 | Identity verified |
| `ACCREDITED` | $249 | Verified status or identity verified |

**Response (200):**
```json
{
  "ok": true,
  "requestId": 123,
  "status": "PENDING",
  "packageType": "VERIFIED",
  "amountPaidCents": 14900
}
```

---

#### Get Provider Verification Status

```http
GET /verification/providers/status
```

**Response (200):**
```json
{
  "tier": "IDENTITY_VERIFIED",
  "tierAchievedAt": "2026-01-10T00:00:00.000Z",
  "phoneVerified": true,
  "phoneVerifiedAt": "2026-01-08T00:00:00.000Z",
  "identityVerified": true,
  "identityVerifiedAt": "2026-01-10T00:00:00.000Z",
  "verifiedPackage": {
    "active": false,
    "purchasedAt": null,
    "approvedAt": null,
    "expiresAt": null
  },
  "accreditedPackage": {
    "active": false,
    "purchasedAt": null,
    "approvedAt": null,
    "expiresAt": null
  },
  "badges": {
    "quickResponder": true,
    "established": false,
    "topRated": false,
    "trusted": false
  },
  "pendingRequest": {
    "id": 123,
    "packageType": "VERIFIED",
    "status": "IN_REVIEW",
    "createdAt": "2026-01-12T00:00:00.000Z",
    "infoRequestNote": null
  }
}
```

**Verification Tiers (Breeder):**
| Tier | Description |
|------|-------------|
| `SUBSCRIBER` | Active BreederHQ subscription |
| `MARKETPLACE_ENABLED` | Phone verified |
| `IDENTITY_VERIFIED` | Stripe Identity verified |
| `VERIFIED` | BreederHQ Verified package approved |
| `ACCREDITED` | BreederHQ Accredited package approved |

---

#### Provide Requested Info (Provider)

```http
POST /verification/providers/request/:id/info
Content-Type: application/json

{
  "additionalInfo": {
    "clarification": "Here is the additional documentation...",
    "documentUrls": ["https://..."]
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "request": {
    "id": 123,
    "status": "PENDING"
  }
}
```

---

### Marketplace User (Service Provider) Verification

#### Start Identity Verification

```http
POST /verification/users/identity/start
```

**Prerequisites:** 2FA must be enabled.

**Response (200):**
```json
{
  "ok": true,
  "sessionId": "vi_abc123...",
  "clientSecret": "vi_abc123_secret_xyz..."
}
```

---

#### Purchase Verification Package

```http
POST /verification/users/package/purchase
Content-Type: application/json

{
  "packageType": "VERIFIED",
  "submittedInfo": {
    "businessLicenseNumber": "XYZ789",
    "certifications": ["Certified Dog Trainer", "AKC CGC Evaluator"]
  }
}
```

**Package Types:**
| Package | Price | Requirements |
|---------|-------|--------------|
| `VERIFIED` | $99 | 2FA + Identity verified |
| `ACCREDITED` | $199 | Verified status or identity verified |

**Response (200):**
```json
{
  "ok": true,
  "requestId": 456,
  "status": "PENDING",
  "packageType": "VERIFIED",
  "amountPaidCents": 9900
}
```

---

#### Get User Verification Status

```http
GET /verification/users/status
```

**Response (200):**
```json
{
  "tier": "LISTED",
  "tierAchievedAt": "2026-01-05T00:00:00.000Z",
  "phoneVerified": true,
  "phoneVerifiedAt": "2026-01-05T00:00:00.000Z",
  "identityVerified": false,
  "identityVerifiedAt": null,
  "verifiedPackage": {
    "active": false,
    "purchasedAt": null,
    "approvedAt": null,
    "expiresAt": null
  },
  "accreditedPackage": {
    "active": false,
    "purchasedAt": null,
    "approvedAt": null,
    "expiresAt": null
  },
  "badges": {
    "quickResponder": false,
    "established": false,
    "topRated": false,
    "trusted": false,
    "acceptsPayments": false
  },
  "pendingRequest": null
}
```

**Verification Tiers (Service Provider):**
| Tier | Description |
|------|-------------|
| `LISTED` | 2FA enabled |
| `IDENTITY_VERIFIED` | Stripe Identity verified |
| `VERIFIED_PROFESSIONAL` | Verified Professional package approved |
| `ACCREDITED_PROVIDER` | Accredited Provider package approved |

---

#### Provide Requested Info (User)

```http
POST /verification/users/request/:id/info
Content-Type: application/json

{
  "additionalInfo": {
    "clarification": "Additional documentation attached...",
    "documentUrls": ["https://..."]
  }
}
```

---

## Two-Factor Authentication (2FA) Routes

Base path: `/2fa`

### Get 2FA Status

```http
GET /2fa/status
```

**Response (200):**
```json
{
  "enabled": true,
  "method": "TOTP",
  "enabledAt": "2026-01-05T00:00:00.000Z",
  "availableMethods": {
    "passkey": false,
    "totp": true,
    "sms": false
  }
}
```

---

### TOTP (Authenticator App)

#### Setup TOTP

```http
POST /2fa/totp/setup
```

**Response (200):**
```json
{
  "ok": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauthUrl": "otpauth://totp/BreederHQ:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=BreederHQ"
}
```

Use `otpauthUrl` to generate a QR code for the user to scan.

---

#### Verify TOTP and Enable 2FA

```http
POST /2fa/totp/verify
Content-Type: application/json

{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "method": "TOTP"
}
```

**Rate Limit:** 5 requests/minute

---

#### TOTP Login Challenge

```http
POST /2fa/totp/challenge
Content-Type: application/json

{
  "userId": 123,
  "code": "123456"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Rate Limit:** 5 requests/minute

---

### SMS Verification

#### Send SMS Code

```http
POST /2fa/sms/send
Content-Type: application/json

{
  "phoneNumber": "+15125551234"
}
```

**Response (200):**
```json
{
  "ok": true,
  "expiresAt": "2026-01-13T12:10:00.000Z"
}
```

**Rate Limit:** 3 requests/minute

---

#### Verify SMS and Enable 2FA

```http
POST /2fa/sms/verify
Content-Type: application/json

{
  "code": "123456"
}
```

**Response (200):**
```json
{
  "ok": true,
  "method": "SMS"
}
```

**Rate Limit:** 5 requests/minute

---

#### SMS Login Challenge

```http
POST /2fa/sms/challenge
Content-Type: application/json

{
  "userId": 123,
  "action": "send"
}
```

**Response (200 - send):**
```json
{
  "ok": true,
  "expiresAt": "2026-01-13T12:10:00.000Z"
}
```

```http
POST /2fa/sms/challenge
Content-Type: application/json

{
  "userId": 123,
  "action": "verify",
  "code": "123456"
}
```

**Response (200 - verify):**
```json
{
  "ok": true
}
```

**Rate Limit:** 3 requests/minute

---

### Passkey (WebAuthn)

#### Start Passkey Registration

```http
POST /2fa/passkey/register/start
```

**Response (200):**
```json
{
  "ok": true,
  "options": {
    "challenge": "base64url-encoded-challenge",
    "rp": {
      "name": "BreederHQ",
      "id": "breederhq.com"
    },
    "user": {
      "id": "base64url-encoded-user-id",
      "name": "user@example.com",
      "displayName": "John Doe"
    },
    "pubKeyCredParams": [
      { "alg": -7, "type": "public-key" },
      { "alg": -257, "type": "public-key" }
    ],
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "userVerification": "preferred",
      "residentKey": "preferred"
    },
    "timeout": 60000,
    "attestation": "none"
  }
}
```

---

#### Complete Passkey Registration

```http
POST /2fa/passkey/register/finish
Content-Type: application/json

{
  "credential": {
    "id": "credential-id",
    "rawId": "base64url-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64url-encoded-client-data",
      "attestationObject": "base64url-encoded-attestation"
    },
    "type": "public-key"
  }
}
```

**Response (200):**
```json
{
  "ok": true,
  "method": "PASSKEY"
}
```

---

#### Start Passkey Authentication

```http
POST /2fa/passkey/auth/start
Content-Type: application/json

{
  "userId": 123
}
```

**Response (200):**
```json
{
  "ok": true,
  "options": {
    "challenge": "base64url-encoded-challenge",
    "rpId": "breederhq.com",
    "allowCredentials": [
      {
        "id": "credential-id",
        "type": "public-key",
        "transports": ["internal"]
      }
    ],
    "userVerification": "preferred",
    "timeout": 60000
  }
}
```

**Rate Limit:** 10 requests/minute

---

#### Complete Passkey Authentication

```http
POST /2fa/passkey/auth/finish
Content-Type: application/json

{
  "userId": 123,
  "credential": {
    "id": "credential-id",
    "rawId": "base64url-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64url-encoded-client-data",
      "authenticatorData": "base64url-encoded-authenticator-data",
      "signature": "base64url-encoded-signature"
    },
    "type": "public-key"
  }
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Rate Limit:** 5 requests/minute

---

### Disable 2FA

```http
POST /2fa/disable
Content-Type: application/json

{
  "password": "user-password"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

---

## Admin Verification Queue Routes

Base path: `/admin`

All admin endpoints require `userType: "admin"`.

### List Verification Requests

```http
GET /admin/verification-requests?status=PENDING&userType=BREEDER&page=1&limit=25
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | `PENDING`, `IN_REVIEW`, `NEEDS_INFO`, `APPROVED`, `DENIED` |
| userType | string | `BREEDER`, `SERVICE_PROVIDER` |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 25, max: 100) |

**Response (200):**
```json
{
  "ok": true,
  "requests": [
    {
      "id": 123,
      "userType": "BREEDER",
      "packageType": "VERIFIED",
      "requestedTier": "VERIFIED",
      "status": "PENDING",
      "amountPaidCents": 14900,
      "createdAt": "2026-01-12T00:00:00.000Z",
      "reviewedAt": null,
      "infoRequestedAt": null,
      "provider": {
        "id": 456,
        "businessName": "Golden Paws Breeding",
        "publicEmail": "contact@goldenpaws.com",
        "user": {
          "email": "owner@goldenpaws.com",
          "firstName": "Jane",
          "lastName": "Smith"
        }
      },
      "marketplaceUser": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### Get Verification Request Details

```http
GET /admin/verification-requests/:id
```

**Response (200):**
```json
{
  "ok": true,
  "request": {
    "id": 123,
    "userType": "BREEDER",
    "packageType": "VERIFIED",
    "requestedTier": "VERIFIED",
    "status": "IN_REVIEW",
    "submittedInfo": {
      "businessLicenseNumber": "ABC123",
      "yearsInBusiness": 5,
      "references": ["ref1@example.com", "ref2@example.com"]
    },
    "amountPaidCents": 14900,
    "paymentIntentId": "pi_abc123",
    "createdAt": "2026-01-12T00:00:00.000Z",
    "reviewedAt": "2026-01-13T10:00:00.000Z",
    "reviewedBy": 1,
    "reviewNotes": null,
    "infoRequestedAt": null,
    "infoRequestNote": null,
    "infoProvidedAt": null,
    "provider": {
      "id": 456,
      "businessName": "Golden Paws Breeding",
      "publicEmail": "contact@goldenpaws.com",
      "publicPhone": "+15125551234",
      "verificationTier": "IDENTITY_VERIFIED",
      "user": {
        "email": "owner@goldenpaws.com",
        "firstName": "Jane",
        "lastName": "Smith"
      }
    },
    "marketplaceUser": null
  }
}
```

---

### Start Review

```http
POST /admin/verification-requests/:id/start-review
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Review started."
}
```

**Rate Limit:** 30 requests/minute

---

### Approve Request

```http
POST /admin/verification-requests/:id/approve
Content-Type: application/json

{
  "notes": "All documentation verified. Business license confirmed."
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Verification approved successfully."
}
```

**Rate Limit:** 30 requests/minute

---

### Deny Request

```http
POST /admin/verification-requests/:id/deny
Content-Type: application/json

{
  "notes": "Unable to verify business license. Document appears to be expired."
}
```

**Note:** `notes` is required for denials.

**Response (200):**
```json
{
  "ok": true,
  "message": "Verification denied."
}
```

**Rate Limit:** 30 requests/minute

---

### Request More Information

```http
POST /admin/verification-requests/:id/request-info
Content-Type: application/json

{
  "note": "Please provide a copy of your current business license. The one submitted appears to be expired."
}
```

**Response (200):**
```json
{
  "ok": true,
  "message": "Information requested from user."
}
```

**Rate Limit:** 30 requests/minute

---

### Get Verification Statistics

```http
GET /admin/verification-stats
```

**Response (200):**
```json
{
  "ok": true,
  "stats": {
    "queue": {
      "pending": 5,
      "inReview": 2,
      "needsInfo": 1
    },
    "completed": {
      "approved": 45,
      "denied": 3
    },
    "pendingByType": {
      "breeder": 3,
      "serviceProvider": 2
    }
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": "error_code",
  "message": "Human-readable message"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Not authenticated |
| `forbidden` | 403 | Not authorized for resource |
| `provider_not_found` | 404 | Provider profile not found |
| `user_not_found` | 404 | User not found |
| `request_not_found` | 404 | Verification request not found |
| `already_verified` | 400 | Identity already verified |
| `2fa_required` | 400 | 2FA must be enabled first |
| `identity_verification_required` | 400 | Identity verification required |
| `verified_required` | 400 | Verified status required |
| `invalid_package_type` | 400 | Invalid package type |
| `invalid_or_expired_code` | 400 | Verification code invalid or expired |
| `code_required` | 400 | Verification code required |
| `phone_number_required` | 400 | Phone number required |
| `invalid_phone_number` | 400 | Invalid phone number format |
| `totp_not_setup` | 400 | TOTP not set up |
| `invalid_code` | 400 | Invalid TOTP code |
| `passkey_not_enabled` | 400 | Passkey not enabled |
| `challenge_expired` | 400 | Challenge has expired |
| `invalid_credential` | 401 | Invalid passkey credential |
| `password_required` | 400 | Password required to disable 2FA |
| `notes_required` | 400 | Notes required (for denials) |
| `note_required` | 400 | Note required (for info requests) |
| `additional_info_required` | 400 | Additional info required |

---

## TypeScript Types

```typescript
// Verification Tiers
type BreederVerificationTier =
  | "SUBSCRIBER"
  | "MARKETPLACE_ENABLED"
  | "IDENTITY_VERIFIED"
  | "VERIFIED"
  | "ACCREDITED";

type ServiceProviderVerificationTier =
  | "LISTED"
  | "IDENTITY_VERIFIED"
  | "VERIFIED_PROFESSIONAL"
  | "ACCREDITED_PROVIDER";

// Verification Request Status
type VerificationRequestStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "NEEDS_INFO"
  | "APPROVED"
  | "DENIED";

// 2FA Methods
type TwoFactorMethod = "PASSKEY" | "TOTP" | "SMS";

// Package Types
type VerificationPackageType = "VERIFIED" | "ACCREDITED";

// User Types
type VerificationUserType = "BREEDER" | "SERVICE_PROVIDER";
```

---

## Related Documentation

- [Marketplace Verification Packages](./MARKETPLACE-VERIFICATION-PACKAGES.md) - Full verification system documentation
- [API Reference](./api-reference.md) - General marketplace API docs
- [Service Provider Portal](./service-provider-portal.md) - Service provider documentation
