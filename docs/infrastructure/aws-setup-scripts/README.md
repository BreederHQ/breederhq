# AWS S3 Infrastructure Setup Scripts

This folder contains everything you need to set up the BreederHQ S3 infrastructure.

## Quick Start

```powershell
# DEV environment (no CloudFront, just S3)
.\setup-environment.ps1 -Environment dev -SkipCloudFront

# STAGING environment (full setup with CloudFront)
.\setup-environment.ps1 -Environment staging

# PROD environment (full setup with CloudFront)
.\setup-environment.ps1 -Environment prod
```

See [ENVIRONMENTS.md](./ENVIRONMENTS.md) for full details on each environment.

---

## Prerequisites

### 1. Install AWS CLI

**Windows (PowerShell as Administrator):**
```powershell
# Using winget (recommended)
winget install Amazon.AWSCLI

# Or download installer
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Verify installation:**
```powershell
aws --version
# Should output: aws-cli/2.x.x ...
```

### 2. Create AWS IAM User for CLI Access

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click **Users** → **Create user**
3. User name: `BreederHQ-YourName` (e.g., `BreederHQ-Aaron`)
4. Click **Next**
5. Select **Attach policies directly**
6. Search and check: `AdministratorAccess` (for initial setup only)
7. Click **Next** → **Create user**
8. Click on the new user → **Security credentials** tab
9. Click **Create access key**
10. Select **Command Line Interface (CLI)**
11. Check the confirmation box, click **Next** → **Create access key**
12. **SAVE** the Access Key ID and Secret Access Key (you won't see the secret again!)

### 3. Configure AWS CLI

```powershell
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: (paste from step 2)
- **AWS Secret Access Key**: (paste from step 2)
- **Default region name**: `us-east-1`
- **Default output format**: `json`

**Verify it works:**
```powershell
aws sts get-caller-identity
```

---

## What the Script Creates

| Resource | DEV | STAGING | PROD |
|----------|:---:|:-------:|:----:|
| S3 Bucket | ✅ | ✅ | ✅ |
| Bucket encryption | ✅ | ✅ | ✅ |
| CORS configuration | ✅ | ✅ | ✅ |
| Lifecycle rules | ✅ | ✅ | ✅ |
| IAM user + policy | ✅ | ✅ | ✅ |
| SSL certificate | ❌ | ✅ | ✅ |
| CloudFront CDN | ❌ | ✅ | ✅ |

---

## Files in This Folder

| File | Purpose |
|------|---------|
| `README.md` | This file |
| `ENVIRONMENTS.md` | Detailed environment documentation |
| `setup-environment.ps1` | Main setup script (use this) |
| `setup-s3-infrastructure.ps1` | Legacy full setup script |
| `config/cors.json` | S3 CORS configuration |
| `config/lifecycle.json` | S3 lifecycle rules |
| `config/encryption.json` | S3 encryption config |
| `output/` | Generated credentials and logs (gitignored) |

---

## After Setup

The script creates `output/env-{environment}.txt` with credentials.

Add these to your `breederhq-api/.env.{environment}`:

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=breederhq-assets-dev

# CloudFront (when configured)
CDN_DOMAIN=media.breederhq.com
```

---

## Current Status

| Environment | Status | Notes |
|-------------|--------|-------|
| **DEV** | ✅ Ready | `breederhq-assets-dev` bucket + `breederhq-api-dev` user |
| **STAGING** | ⬜ Not started | |
| **PROD** | ⬜ Not started | |

---

## Related Documentation

- [ENVIRONMENTS.md](./ENVIRONMENTS.md) - Detailed environment breakdown
- [S3 Architecture Strategy](../s3-architecture-strategy.md) - Full architecture design
- [AWS S3 Setup Guide](../aws-s3-setup-guide.md) - Manual setup instructions
- [Media Upload API](../../api/media-upload-api.md) - API endpoint documentation
