<#
.SYNOPSIS
    Sets up AWS S3 and CloudFront infrastructure for BreederHQ

.DESCRIPTION
    This script creates:
    - S3 bucket with proper configuration
    - IAM user and policy for API server
    - SSL certificate in ACM
    - CloudFront key pair for signed URLs
    - CloudFront distribution

.PARAMETER Environment
    The environment to set up: 'staging' or 'production'

.EXAMPLE
    .\setup-s3-infrastructure.ps1 -Environment staging
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('staging', 'production')]
    [string]$Environment
)

# Configuration
$Region = "us-east-1"
$BucketName = "breederhq-assets-$Environment"
$ApiUserName = "breederhq-api-$Environment"
$PolicyName = "BreederHQ-S3-Access-$Environment"

if ($Environment -eq "production") {
    $CdnDomain = "media.breederhq.com"
} else {
    $CdnDomain = "media-staging.breederhq.com"
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigDir = Join-Path $ScriptDir "config"
$OutputDir = Join-Path $ScriptDir "output"
$KeysDir = Join-Path $OutputDir "keys"

# Create output directories
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $KeysDir | Out-Null

$OutputFile = Join-Path $OutputDir "env-variables-$Environment.txt"
$LogFile = Join-Path $OutputDir "setup-log-$Environment.txt"

# Helper function to log and display
function Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $LogFile -Value $LogMessage
}

function LogError {
    param([string]$Message)
    Log "ERROR: $Message" "Red"
}

function LogSuccess {
    param([string]$Message)
    Log "SUCCESS: $Message" "Green"
}

function LogStep {
    param([string]$Message)
    Log "`n=== $Message ===" "Cyan"
}

# Check AWS CLI is configured
Log "Checking AWS CLI configuration..."
try {
    $CallerIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $AccountId = $CallerIdentity.Account
    Log "AWS Account: $AccountId"
    Log "User ARN: $($CallerIdentity.Arn)"
} catch {
    LogError "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
}

# ============================================================================
# STEP 1: Create S3 Bucket
# ============================================================================
LogStep "Creating S3 Bucket: $BucketName"

# Check if bucket already exists
$BucketExists = aws s3api head-bucket --bucket $BucketName 2>&1
if ($LASTEXITCODE -eq 0) {
    Log "Bucket already exists, skipping creation" "Yellow"
} else {
    # Create bucket (us-east-1 doesn't need LocationConstraint)
    aws s3api create-bucket --bucket $BucketName --region $Region
    if ($LASTEXITCODE -ne 0) {
        LogError "Failed to create bucket"
        exit 1
    }
    LogSuccess "Bucket created"
}

# Block public access
Log "Blocking public access..."
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
LogSuccess "Public access blocked"

# Enable versioning
Log "Enabling versioning..."
aws s3api put-bucket-versioning `
    --bucket $BucketName `
    --versioning-configuration Status=Enabled
LogSuccess "Versioning enabled"

# Enable encryption
Log "Enabling encryption..."
$EncryptionConfig = @{
    Rules = @(
        @{
            ApplyServerSideEncryptionByDefault = @{
                SSEAlgorithm = "AES256"
            }
            BucketKeyEnabled = $true
        }
    )
} | ConvertTo-Json -Depth 10

aws s3api put-bucket-encryption `
    --bucket $BucketName `
    --server-side-encryption-configuration $EncryptionConfig
LogSuccess "Encryption enabled"

# Configure CORS
Log "Configuring CORS..."
$CorsFile = Join-Path $ConfigDir "cors.json"
aws s3api put-bucket-cors --bucket $BucketName --cors-configuration file://$CorsFile
LogSuccess "CORS configured"

# Configure lifecycle
Log "Configuring lifecycle rules..."
$LifecycleFile = Join-Path $ConfigDir "lifecycle.json"
aws s3api put-bucket-lifecycle-configuration `
    --bucket $BucketName `
    --lifecycle-configuration file://$LifecycleFile
LogSuccess "Lifecycle rules configured"

# ============================================================================
# STEP 2: Create IAM User and Policy
# ============================================================================
LogStep "Creating IAM User: $ApiUserName"

# Create policy document
$PolicyDocument = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "S3ObjectOperations"
            Effect = "Allow"
            Action = @(
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            )
            Resource = "arn:aws:s3:::$BucketName/*"
        },
        @{
            Sid = "S3ListBucket"
            Effect = "Allow"
            Action = "s3:ListBucket"
            Resource = "arn:aws:s3:::$BucketName"
            Condition = @{
                StringLike = @{
                    "s3:prefix" = @("providers/*", "tenants/*", "temp/*")
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$PolicyFile = Join-Path $OutputDir "api-policy-$Environment.json"
$PolicyDocument | Out-File -FilePath $PolicyFile -Encoding utf8

# Check if policy exists
$ExistingPolicy = aws iam list-policies --query "Policies[?PolicyName=='$PolicyName'].Arn" --output text 2>&1
if ($ExistingPolicy -and $ExistingPolicy -ne "") {
    $PolicyArn = $ExistingPolicy
    Log "Policy already exists: $PolicyArn" "Yellow"
} else {
    # Create policy
    $PolicyResult = aws iam create-policy `
        --policy-name $PolicyName `
        --policy-document file://$PolicyFile `
        --output json | ConvertFrom-Json
    $PolicyArn = $PolicyResult.Policy.Arn
    LogSuccess "Policy created: $PolicyArn"
}

# Check if user exists
$ExistingUser = aws iam get-user --user-name $ApiUserName 2>&1
if ($LASTEXITCODE -eq 0) {
    Log "User already exists" "Yellow"
} else {
    # Create user
    aws iam create-user --user-name $ApiUserName
    LogSuccess "User created"
}

# Attach policy to user
aws iam attach-user-policy --user-name $ApiUserName --policy-arn $PolicyArn
LogSuccess "Policy attached to user"

# Create access keys (check if already has keys)
$ExistingKeys = aws iam list-access-keys --user-name $ApiUserName --output json | ConvertFrom-Json
if ($ExistingKeys.AccessKeyMetadata.Count -gt 0) {
    Log "User already has access keys. Creating new keys..." "Yellow"
}

$AccessKeyResult = aws iam create-access-key --user-name $ApiUserName --output json | ConvertFrom-Json
$AccessKeyId = $AccessKeyResult.AccessKey.AccessKeyId
$SecretAccessKey = $AccessKeyResult.AccessKey.SecretAccessKey
LogSuccess "Access keys created"

# ============================================================================
# STEP 3: Request SSL Certificate
# ============================================================================
LogStep "Requesting SSL Certificate for: $CdnDomain"

# Check if certificate already exists
$ExistingCerts = aws acm list-certificates --region $Region --query "CertificateSummaryList[?DomainName=='$CdnDomain'].CertificateArn" --output text
if ($ExistingCerts -and $ExistingCerts -ne "") {
    $CertificateArn = $ExistingCerts
    Log "Certificate already exists: $CertificateArn" "Yellow"
} else {
    $CertResult = aws acm request-certificate `
        --domain-name $CdnDomain `
        --validation-method DNS `
        --region $Region `
        --output json | ConvertFrom-Json
    $CertificateArn = $CertResult.CertificateArn
    LogSuccess "Certificate requested: $CertificateArn"
}

# Get validation record
Start-Sleep -Seconds 2  # Wait for certificate to be ready
$CertDetails = aws acm describe-certificate --certificate-arn $CertificateArn --region $Region --output json | ConvertFrom-Json
$ValidationRecord = $CertDetails.Certificate.DomainValidationOptions[0].ResourceRecord

Log "`n!!! ACTION REQUIRED !!!" "Yellow"
Log "Add this DNS record to validate the certificate:" "Yellow"
Log "  Type:  $($ValidationRecord.Type)" "White"
Log "  Name:  $($ValidationRecord.Name)" "White"
Log "  Value: $($ValidationRecord.Value)" "White"
Log "`nPress Enter after you've added the DNS record..." "Yellow"
Read-Host

# Wait for validation
Log "Waiting for certificate validation (this may take a few minutes)..."
aws acm wait certificate-validated --certificate-arn $CertificateArn --region $Region
LogSuccess "Certificate validated!"

# ============================================================================
# STEP 4: Generate CloudFront Signing Key Pair
# ============================================================================
LogStep "Generating CloudFront Signing Key Pair"

$PrivateKeyFile = Join-Path $KeysDir "cloudfront-private-key-$Environment.pem"
$PublicKeyFile = Join-Path $KeysDir "cloudfront-public-key-$Environment.pem"

# Generate key pair using OpenSSL
if (Test-Path $PrivateKeyFile) {
    Log "Key pair already exists" "Yellow"
} else {
    # Check if OpenSSL is available
    $OpenSSL = Get-Command openssl -ErrorAction SilentlyContinue
    if (-not $OpenSSL) {
        LogError "OpenSSL is not installed. Please install OpenSSL or use Git Bash."
        Log "You can install OpenSSL via: winget install ShiningLight.OpenSSL" "Yellow"
        exit 1
    }

    openssl genrsa -out $PrivateKeyFile 2048
    openssl rsa -pubout -in $PrivateKeyFile -out $PublicKeyFile
    LogSuccess "Key pair generated"
}

# Read public key
$PublicKeyContent = Get-Content $PublicKeyFile -Raw

# Create public key in CloudFront
$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$PublicKeyConfig = @{
    CallerReference = "breederhq-$Environment-$Timestamp"
    Name = "BreederHQ-Signing-Key-$Environment"
    EncodedKey = $PublicKeyContent
} | ConvertTo-Json -Compress

$PublicKeyConfigFile = Join-Path $OutputDir "public-key-config-$Environment.json"
$PublicKeyConfig | Out-File -FilePath $PublicKeyConfigFile -Encoding utf8

$PublicKeyResult = aws cloudfront create-public-key --public-key-config file://$PublicKeyConfigFile --output json | ConvertFrom-Json
$CloudFrontPublicKeyId = $PublicKeyResult.PublicKey.Id
LogSuccess "CloudFront public key created: $CloudFrontPublicKeyId"

# Create key group
$KeyGroupConfig = @{
    Name = "BreederHQ-KeyGroup-$Environment"
    Items = @($CloudFrontPublicKeyId)
} | ConvertTo-Json -Compress

$KeyGroupConfigFile = Join-Path $OutputDir "key-group-config-$Environment.json"
$KeyGroupConfig | Out-File -FilePath $KeyGroupConfigFile -Encoding utf8

$KeyGroupResult = aws cloudfront create-key-group --key-group-config file://$KeyGroupConfigFile --output json | ConvertFrom-Json
$KeyGroupId = $KeyGroupResult.KeyGroup.Id
LogSuccess "CloudFront key group created: $KeyGroupId"

# ============================================================================
# STEP 5: Create Origin Access Control
# ============================================================================
LogStep "Creating Origin Access Control"

$OacConfig = @{
    Name = "BreederHQ-S3-OAC-$Environment"
    Description = "OAC for BreederHQ S3 bucket ($Environment)"
    SigningProtocol = "sigv4"
    SigningBehavior = "always"
    OriginAccessControlOriginType = "s3"
} | ConvertTo-Json -Compress

$OacConfigFile = Join-Path $OutputDir "oac-config-$Environment.json"
$OacConfig | Out-File -FilePath $OacConfigFile -Encoding utf8

$OacResult = aws cloudfront create-origin-access-control --origin-access-control-config file://$OacConfigFile --output json | ConvertFrom-Json
$OacId = $OacResult.OriginAccessControl.Id
LogSuccess "Origin Access Control created: $OacId"

# ============================================================================
# STEP 6: Create CloudFront Distribution
# ============================================================================
LogStep "Creating CloudFront Distribution"

$DistributionConfig = @{
    CallerReference = "breederhq-media-$Environment-$Timestamp"
    Comment = "BreederHQ Media CDN ($Environment)"
    Enabled = $true
    Origins = @{
        Quantity = 1
        Items = @(
            @{
                Id = "S3-$BucketName"
                DomainName = "$BucketName.s3.$Region.amazonaws.com"
                OriginAccessControlId = $OacId
                S3OriginConfig = @{
                    OriginAccessIdentity = ""
                }
            }
        )
    }
    DefaultCacheBehavior = @{
        TargetOriginId = "S3-$BucketName"
        ViewerProtocolPolicy = "redirect-to-https"
        AllowedMethods = @{
            Quantity = 2
            Items = @("GET", "HEAD")
            CachedMethods = @{
                Quantity = 2
                Items = @("GET", "HEAD")
            }
        }
        Compress = $true
        CachePolicyId = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # CachingOptimized
        TrustedKeyGroups = @{
            Enabled = $true
            Quantity = 1
            Items = @($KeyGroupId)
        }
    }
    Aliases = @{
        Quantity = 1
        Items = @($CdnDomain)
    }
    ViewerCertificate = @{
        ACMCertificateArn = $CertificateArn
        SSLSupportMethod = "sni-only"
        MinimumProtocolVersion = "TLSv1.2_2021"
    }
    PriceClass = "PriceClass_100"
    HttpVersion = "http2and3"
} | ConvertTo-Json -Depth 20

$DistributionConfigFile = Join-Path $OutputDir "distribution-config-$Environment.json"
$DistributionConfig | Out-File -FilePath $DistributionConfigFile -Encoding utf8

$DistributionResult = aws cloudfront create-distribution --distribution-config file://$DistributionConfigFile --output json | ConvertFrom-Json
$DistributionId = $DistributionResult.Distribution.Id
$DistributionDomain = $DistributionResult.Distribution.DomainName
LogSuccess "CloudFront distribution created: $DistributionId"
Log "Distribution domain: $DistributionDomain"

# ============================================================================
# STEP 7: Update S3 Bucket Policy for CloudFront
# ============================================================================
LogStep "Updating S3 Bucket Policy"

$BucketPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "AllowCloudFrontServicePrincipal"
            Effect = "Allow"
            Principal = @{
                Service = "cloudfront.amazonaws.com"
            }
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$BucketName/*"
            Condition = @{
                StringEquals = @{
                    "AWS:SourceArn" = "arn:aws:cloudfront::${AccountId}:distribution/$DistributionId"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

$BucketPolicyFile = Join-Path $OutputDir "bucket-policy-$Environment.json"
$BucketPolicy | Out-File -FilePath $BucketPolicyFile -Encoding utf8

aws s3api put-bucket-policy --bucket $BucketName --policy file://$BucketPolicyFile
LogSuccess "Bucket policy updated"

# ============================================================================
# STEP 8: Update IAM Policy with CloudFront Invalidation
# ============================================================================
LogStep "Updating IAM Policy with CloudFront permissions"

$UpdatedPolicyDocument = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "S3ObjectOperations"
            Effect = "Allow"
            Action = @(
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            )
            Resource = "arn:aws:s3:::$BucketName/*"
        },
        @{
            Sid = "S3ListBucket"
            Effect = "Allow"
            Action = "s3:ListBucket"
            Resource = "arn:aws:s3:::$BucketName"
            Condition = @{
                StringLike = @{
                    "s3:prefix" = @("providers/*", "tenants/*", "temp/*")
                }
            }
        },
        @{
            Sid = "CloudFrontInvalidation"
            Effect = "Allow"
            Action = "cloudfront:CreateInvalidation"
            Resource = "arn:aws:cloudfront::${AccountId}:distribution/$DistributionId"
        }
    )
} | ConvertTo-Json -Depth 10

$UpdatedPolicyFile = Join-Path $OutputDir "api-policy-updated-$Environment.json"
$UpdatedPolicyDocument | Out-File -FilePath $UpdatedPolicyFile -Encoding utf8

aws iam create-policy-version `
    --policy-arn $PolicyArn `
    --policy-document file://$UpdatedPolicyFile `
    --set-as-default
LogSuccess "IAM policy updated with CloudFront permissions"

# ============================================================================
# OUTPUT: Environment Variables
# ============================================================================
LogStep "Generating Environment Variables"

$EnvContent = @"
# ============================================================================
# AWS S3 & CloudFront Configuration for BreederHQ ($Environment)
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

# AWS Credentials (for API server)
AWS_REGION=$Region
AWS_ACCESS_KEY_ID=$AccessKeyId
AWS_SECRET_ACCESS_KEY=$SecretAccessKey

# S3 Bucket
S3_BUCKET_NAME=$BucketName

# CloudFront CDN
CDN_DOMAIN=$CdnDomain
CLOUDFRONT_DISTRIBUTION_ID=$DistributionId

# CloudFront Signed URLs
CLOUDFRONT_KEY_PAIR_ID=$CloudFrontPublicKeyId
CLOUDFRONT_PRIVATE_KEY_PATH=$PrivateKeyFile

# ============================================================================
# DNS RECORD REQUIRED
# ============================================================================
# Add this CNAME record to your DNS:
#   Name:  $($CdnDomain -replace '\.breederhq\.com$', '')
#   Type:  CNAME
#   Value: $DistributionDomain

# ============================================================================
# IMPORTANT: Keep the private key secure!
# ============================================================================
# Private key location: $PrivateKeyFile
# Copy this file to your server's secrets directory.

"@

$EnvContent | Out-File -FilePath $OutputFile -Encoding utf8

LogSuccess "`nSetup complete!"
Log "`nEnvironment variables saved to: $OutputFile" "Green"
Log "Private key saved to: $PrivateKeyFile" "Green"

Log "`n!!! FINAL ACTION REQUIRED !!!" "Yellow"
Log "Add this DNS CNAME record:" "Yellow"
Log "  Name:  $($CdnDomain -replace '\.breederhq\.com$', '')" "White"
Log "  Type:  CNAME" "White"
Log "  Value: $DistributionDomain" "White"

Log "`nThen add the environment variables from $OutputFile to your API server." "Cyan"
