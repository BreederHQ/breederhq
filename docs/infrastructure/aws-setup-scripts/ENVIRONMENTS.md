# BreederHQ AWS Environments

This document describes the AWS environments for BreederHQ.

## Environment Overview

| Environment | S3 Bucket | IAM User | CDN Domain | Purpose |
|-------------|-----------|----------|------------|---------|
| **SANDBOX** | `breederhq-assets-sandbox` | `breederhq-api-sandbox` | N/A | Prototyping, throwaway testing |
| **DEV** | `breederhq-assets-dev` | `breederhq-api-dev` | `media-dev.breederhq.com` | Clean development environment |
| **STAGING** | `breederhq-assets-staging` | `breederhq-api-staging` | `media-staging.breederhq.com` | Pre-production testing |
| **PROD** | `breederhq-assets-prod` | `breederhq-api-prod` | `media.breederhq.com` | Production |

---

## Quick Setup Commands

### SANDBOX Environment (Prototyping)
```powershell
.\setup-environment.ps1 -Environment sandbox -SkipCloudFront
```

### DEV Environment (No CloudFront)
```powershell
.\setup-environment.ps1 -Environment dev -SkipCloudFront
```

### STAGING Environment (With CloudFront)
```powershell
.\setup-environment.ps1 -Environment staging
```

### PROD Environment (With CloudFront)
```powershell
.\setup-environment.ps1 -Environment prod
```

---

## Environment Details

### SANDBOX

**Purpose:** Prototyping and throwaway testing

**Features:**
- S3 bucket with full configuration
- IAM user for API access
- **No CloudFront** - uses direct S3 presigned URLs
- Can be wiped/recreated without concern

**When to use:**
- Rapid prototyping of new features
- Testing upload flows
- Throwaway experiments

**API .env file:** Currently used in `.env.dev` for prototyping

---

### DEV

**Purpose:** Local development and prototyping

**Features:**
- S3 bucket with full configuration
- IAM user for API access
- **No CloudFront** - uses direct S3 presigned URLs
- Lower cost, simpler setup

**When to use:**
- Running API locally (`npm run dev`)
- Testing upload functionality
- Rapid iteration

**API .env file:** `.env.dev`

---

### STAGING

**Purpose:** Pre-production testing, QA

**Features:**
- Full S3 + CloudFront setup
- SSL certificate on `media-staging.breederhq.com`
- Mirrors production configuration
- Safe for testing with real-world traffic patterns

**When to use:**
- Testing before production deployments
- Performance testing
- Client demos

**API .env file:** `.env.staging`

---

### PROD

**Purpose:** Production traffic

**Features:**
- Full S3 + CloudFront setup
- SSL certificate on `media.breederhq.com`
- Maximum caching and performance
- CloudFront signed URLs for security

**When to use:**
- Live customer traffic

**API .env file:** `.env.prod`

---

## Current Status

| Environment | S3 Bucket | IAM User | CloudFront | Status |
|-------------|:---------:|:--------:|:----------:|--------|
| SANDBOX | ✅ | ✅ | ➖ (skipped) | **In use** (prototyping) |
| DEV | ✅ | ✅ | ➖ (skipped) | Ready (reserved for clean dev) |
| STAGING | ⬜ | ⬜ | ⬜ | Not started |
| PROD | ⬜ | ⬜ | ⬜ | Not started |

Legend: ✅ Complete | ⬜ Not started | ➖ Not applicable | 🔄 In progress

---

## File Structure

```
aws-setup-scripts/
├── README.md                    # Quick start guide
├── ENVIRONMENTS.md              # This file
├── setup-environment.ps1        # Main setup script
├── config/
│   ├── cors.json               # S3 CORS rules
│   ├── lifecycle.json          # S3 lifecycle rules
│   ├── encryption.json         # S3 encryption config
│   └── api-policy-{env}.json   # Generated IAM policies
└── output/
    ├── env-dev.txt             # DEV environment variables
    ├── env-staging.txt         # STAGING environment variables
    ├── env-prod.txt            # PROD environment variables
    ├── setup-{env}.log         # Setup logs
    └── keys/                   # CloudFront signing keys (gitignored)
```

---

## IAM Permissions

Each environment has a dedicated IAM user with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPresignedUrlGeneration",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::breederhq-assets-{env}/*"
    },
    {
      "Sid": "AllowListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::breederhq-assets-{env}"
    }
  ]
}
```

---

## DNS Records Required

### DEV
None required (uses S3 direct URLs)

### STAGING
| Type | Name | Value |
|------|------|-------|
| CNAME | `_acme-challenge.media-staging` | *(from ACM certificate)* |
| CNAME | `media-staging` | `{distribution-id}.cloudfront.net` |

### PROD
| Type | Name | Value |
|------|------|-------|
| CNAME | `_acme-challenge.media` | *(from ACM certificate)* |
| CNAME | `media` | `{distribution-id}.cloudfront.net` |

---

## Related Documentation

- [S3 Architecture Strategy](../s3-architecture-strategy.md)
- [AWS S3 Setup Guide](../aws-s3-setup-guide.md)
- [Media Upload API](../../api/media-upload-api.md)
