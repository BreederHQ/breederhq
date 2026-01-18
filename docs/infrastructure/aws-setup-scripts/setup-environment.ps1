<#
.SYNOPSIS
    Sets up AWS S3 infrastructure for BreederHQ (DEV, STAGING, or PROD)

.DESCRIPTION
    This script creates:
    - S3 bucket with proper configuration (encryption, CORS, lifecycle)
    - IAM user and policy for API server access
    - (Optional) SSL certificate and CloudFront distribution

.PARAMETER Environment
    The environment to set up: 'dev', 'staging', or 'prod'

.PARAMETER SkipCloudFront
    Skip CloudFront setup (useful for dev environment)

.EXAMPLE
    .\setup-environment.ps1 -Environment dev -SkipCloudFront
    .\setup-environment.ps1 -Environment staging
    .\setup-environment.ps1 -Environment prod
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('sandbox', 'dev', 'staging', 'prod')]
    [string]$Environment,

    [switch]$SkipCloudFront
)

# ============================================================================
# Configuration
# ============================================================================
$Region = "us-east-1"
$BucketName = "breederhq-assets-$Environment"
$ApiUserName = "breederhq-api-$Environment"
$PolicyName = "breederhq-api-$Environment-s3-access"

# CDN domain per environment
$CdnDomains = @{
    sandbox = "media-sandbox.breederhq.com"
    dev     = "media-dev.breederhq.com"
    staging = "media-staging.breederhq.com"
    prod    = "media.breederhq.com"
}
$CdnDomain = $CdnDomains[$Environment]

# Script paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConfigDir = Join-Path $ScriptDir "config"
$OutputDir = Join-Path $ScriptDir "output"
$KeysDir = Join-Path $OutputDir "keys"

# Create output directories
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $KeysDir | Out-Null

$OutputFile = Join-Path $OutputDir "env-$Environment.txt"
$LogFile = Join-Path $OutputDir "setup-$Environment.log"

# ============================================================================
# Helper Functions
# ============================================================================
function Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host $Message -ForegroundColor $Color
    Add-Content -Path $LogFile -Value "[$Timestamp] $Message"
}

function LogError { param([string]$Message) Log "ERROR: $Message" "Red" }
function LogSuccess { param([string]$Message) Log "SUCCESS: $Message" "Green" }
function LogStep { param([string]$Message) Log "`n=== $Message ===" "Cyan" }
function LogWarning { param([string]$Message) Log "WARNING: $Message" "Yellow" }

function Test-Command {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

function Write-JsonFile {
    param([string]$Path, [hashtable]$Content)
    $Content | ConvertTo-Json -Depth 20 | Out-File -FilePath $Path -Encoding utf8
}

# ============================================================================
# Pre-flight Checks
# ============================================================================
Clear-Host
Log "======================================================"
Log "  BreederHQ AWS Infrastructure Setup"
Log "  Environment: $($Environment.ToUpper())"
Log "======================================================"

# Check AWS CLI
Log "`nChecking prerequisites..."
if (-not (Test-Command "aws")) {
    LogError "AWS CLI is not installed. Please install it first."
    Log "  Install: winget install Amazon.AWSCLI" "Yellow"
    exit 1
}

# Check AWS credentials
try {
    $CallerIdentity = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
    $AccountId = $CallerIdentity.Account
    Log "AWS Account: $AccountId"
    Log "User: $($CallerIdentity.Arn)"
} catch {
    LogError "AWS CLI is not configured. Run 'aws configure' first."
    exit 1
}

# ============================================================================
# STEP 1: S3 Bucket
# ============================================================================
LogStep "Step 1: S3 Bucket ($BucketName)"

# Check if bucket exists
$BucketExists = $false
try {
    aws s3api head-bucket --bucket $BucketName 2>$null
    if ($LASTEXITCODE -eq 0) {
        $BucketExists = $true
        LogWarning "Bucket already exists"
    }
} catch {}

if (-not $BucketExists) {
    Log "Creating bucket..."
    aws s3api create-bucket --bucket $BucketName --region $Region
    if ($LASTEXITCODE -ne 0) {
        LogError "Failed to create bucket"
        exit 1
    }
    LogSuccess "Bucket created"
}

# Block public access
Log "Configuring public access block..."
aws s3api put-public-access-block `
    --bucket $BucketName `
    --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
if ($LASTEXITCODE -eq 0) { LogSuccess "Public access blocked" } else { LogError "Failed to block public access" }

# Versioning
Log "Enabling versioning..."
aws s3api put-bucket-versioning --bucket $BucketName --versioning-configuration Status=Enabled
if ($LASTEXITCODE -eq 0) { LogSuccess "Versioning enabled" } else { LogError "Failed to enable versioning" }

# Encryption (using file-based config to avoid PowerShell JSON issues)
Log "Enabling encryption..."
$EncryptionFile = Join-Path $ConfigDir "encryption.json"
aws s3api put-bucket-encryption --bucket $BucketName --server-side-encryption-configuration "file://$EncryptionFile"
if ($LASTEXITCODE -eq 0) { LogSuccess "Encryption enabled" } else { LogError "Failed to enable encryption" }

# CORS
Log "Configuring CORS..."
$CorsFile = Join-Path $ConfigDir "cors.json"
aws s3api put-bucket-cors --bucket $BucketName --cors-configuration "file://$CorsFile"
if ($LASTEXITCODE -eq 0) { LogSuccess "CORS configured" } else { LogError "Failed to configure CORS" }

# Lifecycle
Log "Configuring lifecycle rules..."
$LifecycleFile = Join-Path $ConfigDir "lifecycle.json"
aws s3api put-bucket-lifecycle-configuration --bucket $BucketName --lifecycle-configuration "file://$LifecycleFile"
if ($LASTEXITCODE -eq 0) { LogSuccess "Lifecycle configured" } else { LogError "Failed to configure lifecycle" }

# ============================================================================
# STEP 2: IAM User & Policy
# ============================================================================
LogStep "Step 2: IAM User ($ApiUserName)"

# Check if user exists
$UserExists = $false
aws iam get-user --user-name $ApiUserName 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    $UserExists = $true
    LogWarning "User already exists"
}

if (-not $UserExists) {
    Log "Creating IAM user..."
    aws iam create-user --user-name $ApiUserName
    if ($LASTEXITCODE -ne 0) {
        LogError "Failed to create user"
        exit 1
    }
    LogSuccess "User created"
}

# Create/update policy
Log "Creating IAM policy..."
$PolicyFile = Join-Path $ConfigDir "api-policy-$Environment.json"

# Generate policy file
$PolicyContent = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "AllowPresignedUrlGeneration"
            Effect = "Allow"
            Action = @("s3:PutObject", "s3:GetObject", "s3:DeleteObject")
            Resource = "arn:aws:s3:::$BucketName/*"
        },
        @{
            Sid = "AllowListBucket"
            Effect = "Allow"
            Action = @("s3:ListBucket")
            Resource = "arn:aws:s3:::$BucketName"
        }
    )
}
Write-JsonFile -Path $PolicyFile -Content $PolicyContent

# Check if policy exists
$PolicyArn = $null
$ExistingPolicy = aws iam list-policies --query "Policies[?PolicyName=='$PolicyName'].Arn" --output text 2>$null
if ($ExistingPolicy -and $ExistingPolicy -ne "" -and $ExistingPolicy -ne "None") {
    $PolicyArn = $ExistingPolicy.Trim()
    LogWarning "Policy already exists: $PolicyArn"
} else {
    $PolicyResult = aws iam create-policy --policy-name $PolicyName --policy-document "file://$PolicyFile" --output json | ConvertFrom-Json
    if ($LASTEXITCODE -eq 0) {
        $PolicyArn = $PolicyResult.Policy.Arn
        LogSuccess "Policy created: $PolicyArn"
    } else {
        LogError "Failed to create policy"
        exit 1
    }
}

# Attach policy
Log "Attaching policy to user..."
aws iam attach-user-policy --user-name $ApiUserName --policy-arn $PolicyArn 2>$null
if ($LASTEXITCODE -eq 0) { LogSuccess "Policy attached" } else { LogWarning "Policy may already be attached" }

# Create access keys
Log "Creating access keys..."
$AccessKeyResult = aws iam create-access-key --user-name $ApiUserName --output json 2>$null | ConvertFrom-Json
if ($LASTEXITCODE -eq 0 -and $AccessKeyResult) {
    $AccessKeyId = $AccessKeyResult.AccessKey.AccessKeyId
    $SecretAccessKey = $AccessKeyResult.AccessKey.SecretAccessKey
    LogSuccess "Access keys created"
    Log "  Access Key ID: $AccessKeyId" "Green"
} else {
    LogWarning "Could not create access keys (user may have max keys)"
    $AccessKeyId = "<EXISTING_KEY>"
    $SecretAccessKey = "<EXISTING_SECRET>"
}

# ============================================================================
# STEP 3: CloudFront (Optional)
# ============================================================================
$DistributionId = ""
$DistributionDomain = ""
$CloudFrontPublicKeyId = ""
$CertificateArn = ""

if ($SkipCloudFront) {
    LogStep "Step 3: CloudFront (SKIPPED)"
    Log "CloudFront setup skipped. Using direct S3 presigned URLs." "Yellow"
    Log "You can set up CloudFront later for production." "Yellow"
} else {
    LogStep "Step 3: SSL Certificate ($CdnDomain)"

    # Request certificate
    $ExistingCerts = aws acm list-certificates --region $Region --query "CertificateSummaryList[?DomainName=='$CdnDomain'].CertificateArn" --output text 2>$null
    if ($ExistingCerts -and $ExistingCerts -ne "" -and $ExistingCerts -ne "None") {
        $CertificateArn = $ExistingCerts.Trim()
        LogWarning "Certificate already exists: $CertificateArn"
    } else {
        Log "Requesting SSL certificate..."
        $CertResult = aws acm request-certificate --domain-name $CdnDomain --validation-method DNS --region $Region --output json | ConvertFrom-Json
        if ($LASTEXITCODE -eq 0) {
            $CertificateArn = $CertResult.CertificateArn
            LogSuccess "Certificate requested: $CertificateArn"
        } else {
            LogError "Failed to request certificate"
        }
    }

    # Get validation record
    if ($CertificateArn) {
        Start-Sleep -Seconds 3
        $CertDetails = aws acm describe-certificate --certificate-arn $CertificateArn --region $Region --output json | ConvertFrom-Json
        $ValidationRecord = $CertDetails.Certificate.DomainValidationOptions[0].ResourceRecord

        if ($ValidationRecord) {
            Log "`n!!! ACTION REQUIRED - Add DNS Record !!!" "Yellow"
            Log "  Type:  $($ValidationRecord.Type)" "White"
            Log "  Name:  $($ValidationRecord.Name)" "White"
            Log "  Value: $($ValidationRecord.Value)" "White"
            Log "`nAfter adding the DNS record, the certificate will validate automatically." "Yellow"
            Log "You can run this script again to complete CloudFront setup." "Yellow"
        }

        # Check if already validated
        if ($CertDetails.Certificate.Status -eq "ISSUED") {
            LogSuccess "Certificate is already validated"

            # Continue with CloudFront setup...
            # (This would include key pair generation, OAC, distribution creation)
            # For now, we'll leave this as manual steps
            Log "`nCloudFront distribution setup requires manual steps." "Yellow"
            Log "See: docs/infrastructure/aws-s3-setup-guide.md" "Yellow"
        }
    }
}

# ============================================================================
# STEP 4: Output Environment Variables
# ============================================================================
LogStep "Step 4: Environment Variables"

$EnvContent = @"
# ============================================================================
# BreederHQ AWS Configuration ($($Environment.ToUpper()))
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================================================

# Add these to your .env.$Environment file:

AWS_ACCESS_KEY_ID=$AccessKeyId
AWS_SECRET_ACCESS_KEY=$SecretAccessKey
AWS_REGION=$Region
S3_BUCKET=$BucketName
"@

if (-not $SkipCloudFront -and $DistributionId) {
    $EnvContent += @"

# CloudFront CDN (when configured)
CDN_DOMAIN=$CdnDomain
CLOUDFRONT_DISTRIBUTION_ID=$DistributionId
CLOUDFRONT_KEY_PAIR_ID=$CloudFrontPublicKeyId
"@
}

$EnvContent | Out-File -FilePath $OutputFile -Encoding utf8

Log "`nEnvironment variables saved to:" "Green"
Log "  $OutputFile" "White"

Log "`n======================================================"
Log "  Setup Complete!"
Log "======================================================"

Log "`nNext steps:" "Cyan"
Log "1. Add the credentials to your .env.$Environment file" "White"
if (-not $SkipCloudFront) {
    Log "2. Add DNS validation record for SSL certificate" "White"
    Log "3. After certificate validates, set up CloudFront manually" "White"
}

# Summary table
Log "`n--- Resources Created ---" "Cyan"
Log "S3 Bucket:    $BucketName" "White"
Log "IAM User:     $ApiUserName" "White"
Log "IAM Policy:   $PolicyName" "White"
if ($CertificateArn) {
    Log "Certificate:  $CertificateArn" "White"
}
