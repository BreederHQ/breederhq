# AWS S3 Infrastructure Setup Guide for BreederHQ

This guide walks you through setting up the complete AWS infrastructure for BreederHQ's file storage system.

## Prerequisites

- AWS Account with admin access
- AWS CLI installed and configured (`aws configure`)
- A registered domain (breederhq.com) with access to DNS settings
- SSL certificate for media.breederhq.com (we'll create one in ACM)

---

## Step 1: Create the S3 Bucket

### 1.1 Create the bucket

```bash
# Set your environment (production or staging)
ENV="production"
BUCKET_NAME="breederhq-assets-${ENV}"
REGION="us-east-1"

# Create the bucket
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $REGION
```

> **Note**: For regions other than us-east-1, add: `--create-bucket-configuration LocationConstraint=$REGION`

### 1.2 Block all public access

```bash
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

### 1.3 Enable versioning

```bash
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled
```

### 1.4 Enable server-side encryption

```bash
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        },
        "BucketKeyEnabled": true
      }
    ]
  }'
```

### 1.5 Configure CORS

Create a file `cors-config.json`:

```json
{
  "CORSRules": [
    {
      "ID": "BreederHQUploadCORS",
      "AllowedOrigins": [
        "https://app.breederhq.com",
        "https://portal.breederhq.com",
        "https://marketplace.breederhq.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
      ],
      "AllowedMethods": ["GET", "PUT", "HEAD"],
      "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply the CORS configuration:

```bash
aws s3api put-bucket-cors \
  --bucket $BUCKET_NAME \
  --cors-configuration file://cors-config.json
```

### 1.6 Configure lifecycle rules

Create a file `lifecycle-config.json`:

```json
{
  "Rules": [
    {
      "ID": "TempCleanup",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 1
      }
    },
    {
      "ID": "DeleteOldVersions",
      "Status": "Enabled",
      "Filter": {},
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 30
      }
    },
    {
      "ID": "CleanupDeleteMarkers",
      "Status": "Enabled",
      "Filter": {},
      "Expiration": {
        "ExpiredObjectDeleteMarker": true
      }
    },
    {
      "ID": "AbortIncompleteUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

Apply the lifecycle configuration:

```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket $BUCKET_NAME \
  --lifecycle-configuration file://lifecycle-config.json
```

---

## Step 2: Create IAM User for API Server

### 2.1 Create the IAM policy

Create a file `api-server-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ObjectOperations",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::breederhq-assets-production/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::breederhq-assets-production",
      "Condition": {
        "StringLike": {
          "s3:prefix": [
            "providers/*",
            "tenants/*",
            "temp/*"
          ]
        }
      }
    }
  ]
}
```

Create the policy:

```bash
aws iam create-policy \
  --policy-name BreederHQ-S3-Access \
  --policy-document file://api-server-policy.json
```

Save the returned Policy ARN (e.g., `arn:aws:iam::123456789012:policy/BreederHQ-S3-Access`)

### 2.2 Create the IAM user

```bash
aws iam create-user --user-name breederhq-api-server
```

### 2.3 Attach the policy to the user

```bash
POLICY_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:policy/BreederHQ-S3-Access"

aws iam attach-user-policy \
  --user-name breederhq-api-server \
  --policy-arn $POLICY_ARN
```

### 2.4 Create access keys

```bash
aws iam create-access-key --user-name breederhq-api-server
```

**IMPORTANT**: Save the `AccessKeyId` and `SecretAccessKey` securely. You'll need these for your API server environment variables.

---

## Step 3: Request SSL Certificate in ACM

### 3.1 Request the certificate

```bash
# Must be in us-east-1 for CloudFront
aws acm request-certificate \
  --domain-name media.breederhq.com \
  --validation-method DNS \
  --region us-east-1
```

Save the returned `CertificateArn`.

### 3.2 Get the DNS validation records

```bash
CERT_ARN="arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/YOUR_CERT_ID"

aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

### 3.3 Add DNS record for validation

Add the CNAME record to your DNS provider:
- **Name**: `_xxxxxx.media.breederhq.com` (from the output above)
- **Type**: CNAME
- **Value**: `_yyyyyy.acm-validations.aws.` (from the output above)

### 3.4 Wait for validation

```bash
aws acm wait certificate-validated \
  --certificate-arn $CERT_ARN \
  --region us-east-1
```

This may take 5-30 minutes.

---

## Step 4: Create CloudFront Key Pair for Signed URLs

### 4.1 Generate RSA key pair

```bash
# Create a directory for keys
mkdir -p ~/.breederhq-keys

# Generate private key
openssl genrsa -out ~/.breederhq-keys/cloudfront-private-key.pem 2048

# Extract public key
openssl rsa -pubout -in ~/.breederhq-keys/cloudfront-private-key.pem \
  -out ~/.breederhq-keys/cloudfront-public-key.pem
```

### 4.2 Create the public key in CloudFront

```bash
# Read the public key
PUBLIC_KEY=$(cat ~/.breederhq-keys/cloudfront-public-key.pem)

# Create the public key in CloudFront
aws cloudfront create-public-key \
  --public-key-config "{
    \"CallerReference\": \"breederhq-$(date +%s)\",
    \"Name\": \"BreederHQ-Signing-Key\",
    \"EncodedKey\": \"$PUBLIC_KEY\"
  }"
```

Save the returned `Id` (this is your `PUBLIC_KEY_ID`).

### 4.3 Create a key group

```bash
PUBLIC_KEY_ID="K1234567890ABC"  # From previous step

aws cloudfront create-key-group \
  --key-group-config "{
    \"Name\": \"BreederHQ-Signing-KeyGroup\",
    \"Items\": [\"$PUBLIC_KEY_ID\"]
  }"
```

Save the returned `Id` (this is your `KEY_GROUP_ID`).

---

## Step 5: Create CloudFront Distribution

### 5.1 Create Origin Access Control (OAC)

```bash
aws cloudfront create-origin-access-control \
  --origin-access-control-config "{
    \"Name\": \"BreederHQ-S3-OAC\",
    \"Description\": \"OAC for BreederHQ S3 bucket\",
    \"SigningProtocol\": \"sigv4\",
    \"SigningBehavior\": \"always\",
    \"OriginAccessControlOriginType\": \"s3\"
  }"
```

Save the returned `Id` (this is your `OAC_ID`).

### 5.2 Create the CloudFront distribution

Create a file `cloudfront-distribution.json`:

```json
{
  "CallerReference": "breederhq-media-TIMESTAMP",
  "Comment": "BreederHQ Media CDN",
  "Enabled": true,
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-breederhq-assets",
        "DomainName": "breederhq-assets-production.s3.us-east-1.amazonaws.com",
        "OriginAccessControlId": "YOUR_OAC_ID",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-breederhq-assets",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "Compress": true,
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "TrustedKeyGroups": {
      "Enabled": true,
      "Quantity": 1,
      "Items": ["YOUR_KEY_GROUP_ID"]
    }
  },
  "Aliases": {
    "Quantity": 1,
    "Items": ["media.breederhq.com"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "YOUR_CERTIFICATE_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "PriceClass": "PriceClass_100",
  "HttpVersion": "http2and3"
}
```

Replace the placeholders:
- `TIMESTAMP` → current timestamp
- `YOUR_OAC_ID` → OAC ID from step 5.1
- `YOUR_KEY_GROUP_ID` → Key Group ID from step 4.3
- `YOUR_CERTIFICATE_ARN` → Certificate ARN from step 3.1

Create the distribution:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-distribution.json
```

Save the returned:
- `Id` (Distribution ID)
- `DomainName` (e.g., `d1234567890abc.cloudfront.net`)

### 5.3 Update S3 bucket policy for CloudFront OAC

Create a file `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::breederhq-assets-production/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

Replace `YOUR_ACCOUNT_ID` and `YOUR_DISTRIBUTION_ID`.

Apply the bucket policy:

```bash
aws s3api put-bucket-policy \
  --bucket breederhq-assets-production \
  --policy file://bucket-policy.json
```

---

## Step 6: Configure DNS

Add a CNAME record to your DNS provider:

| Type | Name | Value |
|------|------|-------|
| CNAME | media | d1234567890abc.cloudfront.net |

(Use your actual CloudFront distribution domain name)

---

## Step 7: Update IAM Policy for CloudFront Invalidations

If you need to invalidate cached files when visibility changes from PUBLIC to PRIVATE, update the IAM policy:

```bash
# Get current policy version
aws iam get-policy --policy-arn $POLICY_ARN

# Create new policy version with CloudFront permissions
cat > api-server-policy-v2.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ObjectOperations",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::breederhq-assets-production/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::breederhq-assets-production",
      "Condition": {
        "StringLike": {
          "s3:prefix": [
            "providers/*",
            "tenants/*",
            "temp/*"
          ]
        }
      }
    },
    {
      "Sid": "CloudFrontInvalidation",
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
EOF

aws iam create-policy-version \
  --policy-arn $POLICY_ARN \
  --policy-document file://api-server-policy-v2.json \
  --set-as-default
```

---

## Step 8: Set Environment Variables

Add these to your API server environment (`.env` or secrets manager):

```bash
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...         # From step 2.4
AWS_SECRET_ACCESS_KEY=...          # From step 2.4

# S3 Configuration
S3_BUCKET_NAME=breederhq-assets-production

# CloudFront Configuration
CDN_DOMAIN=media.breederhq.com
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
CLOUDFRONT_KEY_PAIR_ID=K1234567890ABC   # Public key ID from step 4.2
CLOUDFRONT_PRIVATE_KEY_PATH=/path/to/cloudfront-private-key.pem
# OR embed the key directly (escape newlines):
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE..."
```

---

## Step 9: Verify the Setup

### 9.1 Test S3 upload

```bash
# Create a test file
echo "test" > test.txt

# Upload to temp folder
aws s3 cp test.txt s3://breederhq-assets-production/temp/test.txt

# Verify it exists
aws s3 ls s3://breederhq-assets-production/temp/

# Clean up
aws s3 rm s3://breederhq-assets-production/temp/test.txt
rm test.txt
```

### 9.2 Test CloudFront (after DNS propagates)

```bash
# This should fail (requires signed URL)
curl -I https://media.breederhq.com/temp/test.txt
# Expected: 403 Forbidden
```

### 9.3 Test presigned URL generation

Create a test script `test-presign.js`:

```javascript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });

const command = new PutObjectCommand({
  Bucket: "breederhq-assets-production",
  Key: "temp/test-upload.txt",
  ContentType: "text/plain",
});

const url = await getSignedUrl(s3, command, { expiresIn: 300 });
console.log("Presigned URL:", url);
```

Run it:
```bash
node test-presign.js
```

---

## Summary: What You've Created

| Resource | Name/ID | Purpose |
|----------|---------|---------|
| S3 Bucket | `breederhq-assets-production` | File storage |
| IAM User | `breederhq-api-server` | API server credentials |
| IAM Policy | `BreederHQ-S3-Access` | S3 + CloudFront permissions |
| ACM Certificate | `media.breederhq.com` | SSL for CDN |
| CloudFront Public Key | `K...` | For signing URLs |
| CloudFront Key Group | `...` | Groups signing keys |
| CloudFront OAC | `...` | S3 origin access |
| CloudFront Distribution | `E...` | CDN distribution |
| DNS CNAME | `media.breederhq.com` | Points to CloudFront |

---

## Environment Variables Checklist

Copy this to your `.env.example`:

```bash
# ============================================================================
# AWS S3 & CloudFront Configuration
# ============================================================================

# AWS Credentials (use IAM role in production if possible)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# S3 Bucket
S3_BUCKET_NAME=breederhq-assets-production

# CloudFront CDN
CDN_DOMAIN=media.breederhq.com
CLOUDFRONT_DISTRIBUTION_ID=

# CloudFront Signed URLs
CLOUDFRONT_KEY_PAIR_ID=
CLOUDFRONT_PRIVATE_KEY_PATH=
# OR
CLOUDFRONT_PRIVATE_KEY=
```

---

## Cost Estimates

| Service | Usage (MVP) | Est. Monthly Cost |
|---------|-------------|-------------------|
| S3 Storage | 50 GB | $1.15 |
| S3 Requests | 100K | $0.50 |
| CloudFront Transfer | 200 GB | $17.00 |
| CloudFront Requests | 500K | $0.50 |
| ACM Certificate | 1 | Free |
| **Total** | | **~$19/month** |

---

## Next Steps

1. **Implement the API endpoints** - See [s3-architecture-strategy.md](./s3-architecture-strategy.md) for the API design
2. **Add the Media table migration** - Prisma schema changes
3. **Create upload components** - Frontend integration
4. **Test the full flow** - Upload → CDN → Access validation

---

## Troubleshooting

### "Access Denied" on CloudFront

1. Check the bucket policy includes your CloudFront distribution ARN
2. Verify OAC is correctly attached to the distribution
3. Wait a few minutes for policy propagation

### CORS errors on upload

1. Verify CORS configuration on the bucket
2. Check that your origin (localhost or domain) is in the allowed origins
3. Ensure the request includes correct headers

### Signed URL not working

1. Verify the private key matches the public key in CloudFront
2. Check the key group is attached to the distribution's cache behavior
3. Ensure `TrustedKeyGroups` is enabled (not legacy `TrustedSigners`)

### DNS not resolving

1. Wait for DNS propagation (can take up to 48 hours, usually much faster)
2. Check the CNAME record is correctly pointing to CloudFront domain
3. Use `dig media.breederhq.com` to debug
