# Marketplace Verification Packages

> **Purpose:** Define the tiered verification system for breeders and service providers that provides trust badges displayed on storefronts, programs, listings, and service pages.

**Last Updated:** 2026-01-13
**Status:** SPECIFICATION

---

## Overview

BreederHQ offers tiered verification systems for two distinct user types:

1. **Breeders** - Subscribers who list animals, programs, and offspring on the marketplace
2. **Service Providers** - Anyone (free or paid) who lists services on the marketplace

Both user types can earn trust badges through automated verification and optional paid manual verification packages. These badges help buyers identify trustworthy sellers.

### Key Differences

| Aspect | Breeders | Service Providers |
|--------|----------|-------------------|
| **Baseline** | Paying subscriber | Free account (Year 1) |
| **Payment on file** | Yes (subscription) | Only if using Stripe Connect |
| **Minimum to list** | Subscription + Phone verified | Email + 2FA enabled |
| **Identity verification** | Via Stripe (subscription) or Stripe Identity | Via Stripe Connect or paid ($10) |

### Core Principles

1. **No self-attestation** - Users cannot claim badges without verification
2. **Automated where possible** - Identity, phone, and platform badges are fully automated
3. **Paid manual verification** - Premium verification packages require staff review (intern)
4. **Badges display everywhere** - Earned badges appear on storefronts, programs, listings, and service pages

---

---

# Part 1: Breeder Verification

---

## Breeder Verification Tiers

### Tier 0: Subscriber (Baseline)

**Automatic for all breeders with active subscription.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| Active subscription | Stripe subscription status | Required to be a breeder at all |
| Payment method on file | Stripe payment method | Part of subscription |
| Email verified | Email confirmation link | Required for account creation |

**Badges Earned:** None (baseline requirements)

**Marketplace Access:** None - cannot list on marketplace

---

### Tier 1: Marketplace Enabled

**Required to list anything on the marketplace.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| All Tier 0 requirements | See above | - |
| Phone verified | SMS OTP | Real phone number on file |
| Marketplace ToS accepted | ToS acceptance record | Legal agreement |

**Badges Earned:**
- **Phone Verified** - Displayed as checkmark

**Marketplace Access:** Full access to list animals, programs, services

**Cost:** Free (included with subscription)

---

### Tier 2: Identity Verified

**Optional verification that proves the breeder is a real person.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| All Tier 1 requirements | See above | - |
| Government ID verified | Stripe Identity | ID document + selfie match |

**Badges Earned:**
- **Identity Verified** - Prominent trust badge

**Marketplace Benefits:**
- "Identity Verified" badge on all listings
- Higher placement in search results
- Buyer trust signal

**Cost:** Free (Stripe Identity ~$1.50/verification absorbed by platform OR passed to breeder)

---

### Tier 3: BreederHQ Verified

**Paid verification package with manual staff review.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| All Tier 2 requirements | See above | - |
| Registry membership confirmed | Staff lookup | See verification checklist |
| Health testing confirmed | Staff lookup | OFA/PennHIP/etc. database check |

**Badges Earned:**
- **BreederHQ Verified** - Premium trust badge

**Marketplace Benefits:**
- Premium "BreederHQ Verified" badge
- Priority placement in search results
- Featured in "Verified Breeders" section
- Enhanced profile highlighting

**Cost:** $149 one-time + $49/year renewal

---

### Tier 4: BreederHQ Accredited

**Comprehensive verification for professional breeders.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| All Tier 3 requirements | See above | - |
| Veterinary reference confirmed | Staff phone/email verification | Vet confirms relationship |
| License verified (if applicable) | Staff lookup | USDA/State license check |
| Business registration verified | Staff lookup | LLC/Corp/DBA confirmation |

**Badges Earned:**
- **BreederHQ Accredited** - Top-tier trust badge

**Marketplace Benefits:**
- All Tier 3 benefits
- "Accredited Breeder" premium badge
- Top placement in search results
- Featured on homepage/category pages
- Exclusive "Accredited Breeders" directory listing
- Priority support

**Cost:** $249 one-time + $99/year renewal

---

## Breeder Badge Display Locations

### Where Badges Appear

| Location | Badges Displayed |
|----------|------------------|
| **Breeder Storefront** | All earned badges in header/profile section |
| **Breeding Program Pages** | Inherited from breeder + program-specific |
| **Animal Listings** | Inherited from breeder |
| **Offspring Group Listings** | Inherited from breeder |
| **Service Listings** | Inherited from breeder |
| **Search Results Cards** | Badge icons on breeder/listing cards |
| **Marketplace Browse Pages** | Filter by verification tier |

### Badge Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  Sunny Paws Goldens                                         │
│                                                              │
│  ✓ Identity Verified    ★ BreederHQ Accredited              │
│  ✓ Phone Verified       ⚡ Quick Responder                   │
│                         🏆 Top Rated                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Breeder Platform-Earned Badges (Automatic)

In addition to verification tiers, breeders can earn badges through platform behavior:

| Badge | Criteria | Auto-Calculated |
|-------|----------|-----------------|
| **Quick Responder** | Average response time < 24 hours | Yes |
| **Established Breeder** | Account active 12+ months | Yes |
| **Top Rated** | Average review rating 4.5+ stars | Yes |
| **Trusted Breeder** | 5+ successful placements, no complaints | Yes |
| **Active Seller** | 3+ active listings | Yes |

These badges are earned automatically and cannot be purchased or manually assigned.

---

---

# Part 2: Service Provider Verification

---

## Service Provider Context

Service providers are a distinct user type from breeders:

- **No subscription required** - Free to list services (Year 1 promotion)
- **No payment method on file** - Unless they opt into Stripe Connect for invoicing
- **Wide range of services** - From casual (pet sitting) to professional (veterinary clinics)
- **Different trust signals** - Certifications, licenses, insurance matter more than registry memberships

### The Spam/Scam Challenge

Without a subscription paywall, service listings are vulnerable to spam. The verification system must provide enough friction to deter bad actors while remaining accessible to legitimate providers.

---

## Account Security Requirements

### Two-Factor Authentication (2FA) - Required to List

All service providers must enable 2FA before creating listings. Three options are offered:

| Method | Security | Friction | Recommended |
|--------|----------|----------|-------------|
| **Passkey** | Highest | Low (once set up) | Yes - "Recommended" |
| **Authenticator App (TOTP)** | High | Medium | Yes - "Secure alternative" |
| **SMS OTP** | Medium | Low | Fallback only |

**User Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│  Secure Your Account                                         │
│                                                              │
│  To list services, you must enable two-factor authentication │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ★ Passkey (Recommended)                                 │ │
│  │   Use Face ID, Touch ID, or Windows Hello               │ │
│  │   Most secure • No codes to remember • Phishing-proof   │ │
│  │   [Set Up Passkey]                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Authenticator App                                       │ │
│  │   Use Google Authenticator, Authy, 1Password, etc.      │ │
│  │   [Set Up Authenticator]                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ SMS Verification                                        │ │
│  │   Receive codes via text message                        │ │
│  │   [Use SMS Instead]                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Provider Verification Tiers

### Tier 0: Listed (Minimum to Create Listings)

**Required for all service providers to list.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| Email verified | Confirmation link | Standard email verification |
| 2FA enabled | Passkey, TOTP, or SMS | At least one method configured |

**Badges Earned:** None (or subtle "Verified Account" checkmark)

**Marketplace Access:** Can create and publish service listings

**Cost:** Free

---

### Tier 1: Identity Verified

**Proves the provider is a real person with verified identity.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| All Tier 0 requirements | See above | - |
| Government ID verified | Stripe Identity OR Stripe Connect | ID document + selfie match |

**Two Paths to Identity Verification:**

| Path | Method | Cost to Provider |
|------|--------|------------------|
| **A: Stripe Connect** | Onboard to accept payments | Free (Stripe does KYC) |
| **B: Standalone** | Stripe Identity check | $10 one-time |

**Badges Earned:**
- **Identity Verified** - Prominent trust badge
- **Accepts Payments** - (Path A only) Shows payment capability

**Marketplace Benefits:**
- "Identity Verified" badge on all listings
- Higher placement in search results
- Buyer trust signal

**Cost:** Free via Stripe Connect, or $10 standalone

---

### Tier 2: Verified Professional

**Paid verification for providers with professional credentials.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| All Tier 1 requirements | See above | - |
| Professional credentials confirmed | Staff lookup | Certifications, training credentials |

**Badges Earned:**
- **Verified Professional** - Premium trust badge

**What Staff Verifies:**

| Service Type | Credentials to Verify |
|--------------|----------------------|
| **Dog Training** | CPDT-KA, CPDT-KSA, KPA CTP, IAABC certification |
| **Grooming** | NCMG, IPG, or state license |
| **Pet First Aid** | Red Cross, PetTech certification |
| **Behavior** | CAAB, ACVB, IAABC credentials |
| **Transport** | USDA registration (if applicable), IPATA membership |
| **Boarding** | State license, facility inspection records |
| **Photography** | Portfolio review (professional quality check) |

**Marketplace Benefits:**
- Premium "Verified Professional" badge
- Priority placement in search results
- Featured in "Verified Professionals" section
- Credential details displayed on profile

**Cost:** $149 one-time + $49/year renewal

---

### Tier 3: Accredited Provider

**Comprehensive verification for licensed professionals and businesses.**

| Requirement | How Verified | Notes |
|-------------|--------------|-------|
| All Tier 2 requirements | See above | - |
| Professional license verified | Staff lookup | State/national license databases |
| Business registration verified | Staff lookup | LLC/Corp/DBA confirmation |
| Insurance verified | Staff review | Liability insurance documentation |

**Badges Earned:**
- **Accredited Provider** - Top-tier trust badge

**What Staff Verifies:**

| Item | Verification Method |
|------|---------------------|
| **Veterinary License** | State veterinary board database lookup |
| **Vet Tech License** | State credentialing board lookup |
| **Grooming License** | State cosmetology/grooming board (where required) |
| **Boarding License** | State agriculture/animal control database |
| **Business Registration** | State Secretary of State database |
| **Liability Insurance** | Review certificate of insurance (COI) |

**Marketplace Benefits:**
- All Tier 2 benefits
- "Accredited Provider" premium badge
- Top placement in search results
- Featured on homepage/category pages
- Exclusive "Accredited Providers" directory listing
- License/insurance details displayed on profile
- Priority support

**Cost:** $249 one-time + $99/year renewal

---

## Service Provider Badge Display

### Where Badges Appear

| Location | Badges Displayed |
|----------|------------------|
| **Service Provider Profile** | All earned badges in header |
| **Service Listing Pages** | Inherited from provider |
| **Search Results Cards** | Badge icons on service cards |
| **Marketplace Browse Pages** | Filter by verification tier |

### Badge Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  Pawsome Mobile Grooming                                     │
│                                                              │
│  ✓ Identity Verified    ★ Accredited Provider               │
│  💳 Accepts Payments    ⚡ Quick Responder                   │
│                         🏆 Top Rated                         │
│                                                              │
│  Credentials: NCMG Certified Master Groomer                  │
│  License: CA State Grooming License #12345                   │
│  Insurance: $1M Liability Coverage                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Provider Platform-Earned Badges (Automatic)

| Badge | Criteria | Auto-Calculated |
|-------|----------|-----------------|
| **Quick Responder** | Average response time < 24 hours | Yes |
| **Established Provider** | Account active 12+ months | Yes |
| **Top Rated** | Average review rating 4.5+ stars | Yes |
| **Trusted Provider** | 10+ completed bookings, no complaints | Yes |
| **Accepts Payments** | Stripe Connect enabled | Yes |

---

## Service Provider Verification Summary

| Tier | Name | Requirements | Cost | Badge |
|------|------|--------------|------|-------|
| **0** | Listed | Email + 2FA | Free | None |
| **1** | Identity Verified | Tier 0 + Stripe Identity/Connect | Free or $10 | "Identity Verified" |
| **2** | Verified Professional | Tier 1 + Staff verifies credentials | $149 + $49/yr | "Verified Professional" |
| **3** | Accredited Provider | Tier 2 + Staff verifies license/insurance | $249 + $99/yr | "Accredited Provider" |

---

---

# Part 3: Verification Package Details (Shared)

---

## Breeder Verification Package Details

### BreederHQ Verified ($149 + $49/year)

**What's Verified:**

| Item | Verification Method | Staff Time |
|------|---------------------|------------|
| Registry membership | Look up membership number on registry website (AKC, CFA, AMHA, etc.) | 5-10 min |
| Health testing | Look up animal names on OFA database, verify certificates | 10-15 min |

**Supported Registries:**
- **Dogs:** AKC, UKC, CKC, FCI affiliates
- **Cats:** CFA, TICA, ACFA, CCA
- **Horses:** AQHA, APHA, AMHA, AMHR, Jockey Club
- **Goats:** ADGA, AGS, NDGA
- **Sheep:** ASR, NASR, breed-specific registries
- **Rabbits:** ARBA

**Supported Health Testing Databases:**
- OFA (Orthopedic Foundation for Animals)
- PennHIP
- CAER (formerly CERF)
- CHIC (Canine Health Information Center)
- Breed-specific databases

**Renewal:** Annual renewal requires re-verification of active registry membership and current health testing.

---

### BreederHQ Accredited ($249 + $99/year)

**What's Verified:**

| Item | Verification Method | Staff Time |
|------|---------------------|------------|
| All Verified items | See above | 15-25 min |
| Veterinary reference | Contact vet clinic, confirm breeder is client in good standing | 10-15 min |
| Business registration | Look up on state business database | 5-10 min |
| USDA/State license | Look up on USDA APHIS or state database (if applicable) | 5-10 min |

**Veterinary Verification Process:**
1. Breeder provides veterinary clinic name, phone, and contact person
2. Staff calls/emails clinic
3. Staff confirms: "Is [Breeder Name] an active client at your clinic?"
4. Staff does NOT ask for medical records or detailed information
5. Staff records date of verification and clinic contact name

**License Verification (if applicable):**
- USDA licenses: Look up on USDA APHIS Animal Care Search Tool
- State licenses: Varies by state, check state agriculture department database
- Note: Not all breeders require licenses (depends on state and operation size)

**Renewal:** Annual renewal requires re-verification of all items.

---

## Service Provider Verification Package Details

### Verified Professional ($149 + $49/year)

**What's Verified:**

| Item | Verification Method | Staff Time |
|------|---------------------|------------|
| Professional certifications | Look up on issuing organization database/registry | 5-15 min |
| Training credentials | Verify certificate authenticity | 5-10 min |

**Supported Certification Bodies:**

| Category | Certifications |
|----------|---------------|
| **Dog Training** | CCPDT (CPDT-KA, CPDT-KSA), KPA (CTP), IAABC |
| **Behavior** | CAAB, ACVB, IAABC (CDBC, CABC) |
| **Grooming** | NCMG, IPG, ISCC, Nash Academy |
| **Pet First Aid** | American Red Cross, PetTech, Pet Emergency Education |
| **Transport** | IPATA membership, USDA registration |

**Renewal:** Annual renewal requires re-verification that certifications are still active/current.

---

### Accredited Provider ($249 + $99/year)

**What's Verified:**

| Item | Verification Method | Staff Time |
|------|---------------------|------------|
| All Verified Professional items | See above | 10-25 min |
| Professional license | State licensing board database lookup | 5-10 min |
| Business registration | State Secretary of State database | 5-10 min |
| Liability insurance | Review Certificate of Insurance (COI) | 5 min |

**License Verification by Service Type:**

| Service Type | License/Registration |
|--------------|---------------------|
| **Veterinarian** | State Veterinary Medical Board |
| **Vet Technician** | State Veterinary Technician Board |
| **Groomer** | State Cosmetology/Grooming Board (where required) |
| **Boarding Facility** | State Dept of Agriculture / Animal Control |
| **Transport (commercial)** | USDA APHIS registration |

**Insurance Verification:**
- Provider submits Certificate of Insurance (COI)
- Staff confirms: Policy is active, coverage amount, provider name matches
- Minimum recommended: $1M general liability

**Renewal:** Annual renewal requires re-verification of all items, including current COI.

---

## Staff Verification Workflow

### Verification Request Process

```
┌─────────────────────────────────────────────────────────────┐
│  Verification Request Workflow                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User purchases verification package                      │
│     └─ Payment processed via Stripe                          │
│     └─ Request created in admin queue                        │
│                                                              │
│  2. User submits verification information                    │
│     └─ Breeder: Registry numbers, animals for health testing │
│     └─ Service Provider: Certifications, credentials         │
│     └─ Both: Business/License info (Accredited only)         │
│                                                              │
│  3. Staff reviews request (Target: 3-5 business days)        │
│     └─ Follows verification checklist                        │
│     └─ Documents findings                                    │
│     └─ Approves or requests additional info                  │
│                                                              │
│  4. Verification complete                                    │
│     └─ Badge(s) activated on account                         │
│     └─ Email notification sent                               │
│     └─ Renewal date set (1 year from approval)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Admin Verification Dashboard

**Queue View:**
- Pending requests sorted by submission date
- User type (Breeder vs Service Provider)
- Request type (Verified vs Accredited)
- User name and contact info
- Days in queue
- Status (Pending, In Progress, Needs Info, Complete)

**Request Detail View:**
- User-submitted information
- Verification checklist with checkboxes
- Notes field for staff
- Approve / Request Info / Deny actions

---

## Staff Verification Checklists

### Breeder: BreederHQ Verified Checklist

```markdown
## Verification Request: [Breeder Name]
## Package: BreederHQ Verified
## Date: [Date]
## Staff: [Staff Name]

### Registry Membership
- [ ] Registry name: ________________
- [ ] Membership/Breeder number: ________________
- [ ] Verified on registry website: [ ] Yes [ ] No
- [ ] Membership active/current: [ ] Yes [ ] No
- [ ] Screenshot saved: [ ] Yes
- Notes: ________________

### Health Testing (per animal submitted)

**Animal 1: [Name]**
- [ ] Registered name: ________________
- [ ] OFA number or equivalent: ________________
- [ ] Verified on OFA/database: [ ] Yes [ ] No
- [ ] Tests found: ________________
- [ ] Results: [ ] Pass [ ] Conditional [ ] Fail
- Notes: ________________

**Animal 2: [Name]**
(Repeat as needed)

### Final Decision
- [ ] APPROVED - All verifications confirmed
- [ ] NEEDS INFO - Missing: ________________
- [ ] DENIED - Reason: ________________

Staff signature: ________________
Date: ________________
```

### Breeder: BreederHQ Accredited Checklist

```markdown
## Verification Request: [Breeder Name]
## Package: BreederHQ Accredited
## Date: [Date]
## Staff: [Staff Name]

### Registry Membership
(Same as Verified checklist)

### Health Testing
(Same as Verified checklist)

### Veterinary Reference
- [ ] Clinic name: ________________
- [ ] Clinic phone: ________________
- [ ] Contact person: ________________
- [ ] Date contacted: ________________
- [ ] Confirmed breeder is active client: [ ] Yes [ ] No
- [ ] Contact method: [ ] Phone [ ] Email
- [ ] Staff person spoken to: ________________
- Notes: ________________

### Business Registration (if applicable)
- [ ] Business name: ________________
- [ ] Business type: [ ] LLC [ ] Corp [ ] DBA [ ] Sole Prop [ ] N/A
- [ ] State registered: ________________
- [ ] Registration number: ________________
- [ ] Verified on state database: [ ] Yes [ ] No [ ] N/A
- [ ] Status: [ ] Active [ ] Inactive [ ] N/A
- Notes: ________________

### USDA/State License (if applicable)
- [ ] License type: [ ] USDA [ ] State [ ] N/A
- [ ] License number: ________________
- [ ] Verified on database: [ ] Yes [ ] No [ ] N/A
- [ ] Status: [ ] Active [ ] Expired [ ] N/A
- Notes: ________________

### Final Decision
- [ ] APPROVED - All verifications confirmed
- [ ] NEEDS INFO - Missing: ________________
- [ ] DENIED - Reason: ________________

Staff signature: ________________
Date: ________________
```

---

### Service Provider: Verified Professional Checklist

```markdown
## Verification Request: [Provider Name]
## Package: Verified Professional
## Date: [Date]
## Staff: [Staff Name]

### Professional Certifications

**Certification 1:**
- [ ] Certification name: ________________
- [ ] Issuing organization: ________________
- [ ] Certification number/ID: ________________
- [ ] Verified on organization website: [ ] Yes [ ] No
- [ ] Certification active/current: [ ] Yes [ ] No
- [ ] Expiration date (if applicable): ________________
- [ ] Screenshot saved: [ ] Yes
- Notes: ________________

**Certification 2:**
(Repeat as needed)

### Final Decision
- [ ] APPROVED - All verifications confirmed
- [ ] NEEDS INFO - Missing: ________________
- [ ] DENIED - Reason: ________________

Staff signature: ________________
Date: ________________
```

---

### Service Provider: Accredited Provider Checklist

```markdown
## Verification Request: [Provider Name]
## Package: Accredited Provider
## Date: [Date]
## Staff: [Staff Name]

### Professional Certifications
(Same as Verified Professional checklist)

### Professional License
- [ ] License type: ________________
- [ ] Licensing board/authority: ________________
- [ ] License number: ________________
- [ ] State issued: ________________
- [ ] Verified on licensing board website: [ ] Yes [ ] No
- [ ] License status: [ ] Active [ ] Inactive [ ] Expired
- [ ] Expiration date: ________________
- [ ] Screenshot saved: [ ] Yes
- Notes: ________________

### Business Registration
- [ ] Business name: ________________
- [ ] Business type: [ ] LLC [ ] Corp [ ] DBA [ ] Sole Prop [ ] N/A
- [ ] State registered: ________________
- [ ] Registration number: ________________
- [ ] Verified on state database: [ ] Yes [ ] No [ ] N/A
- [ ] Status: [ ] Active [ ] Inactive [ ] N/A
- Notes: ________________

### Liability Insurance
- [ ] Insurance company: ________________
- [ ] Policy number: ________________
- [ ] Named insured matches provider: [ ] Yes [ ] No
- [ ] Coverage amount: $________________
- [ ] Policy effective date: ________________
- [ ] Policy expiration date: ________________
- [ ] COI document received: [ ] Yes [ ] No
- Notes: ________________

### Final Decision
- [ ] APPROVED - All verifications confirmed
- [ ] NEEDS INFO - Missing: ________________
- [ ] DENIED - Reason: ________________

Staff signature: ________________
Date: ________________
```

---

## Verification Lookup Resources

### Registry Websites

| Registry | Lookup URL | Notes |
|----------|-----------|-------|
| AKC | https://www.akc.org/breeder-search/ | Search by breeder name |
| UKC | https://www.ukcdogs.com/ | Contact required |
| CFA | https://cfa.org/find-a-breeder/ | Cattery search |
| TICA | https://tica.org/breeder-listing | Breeder directory |
| AQHA | https://www.aqha.com/ | Member lookup |
| ADGA | https://adga.org/ | Member search |
| ARBA | https://arba.net/ | Rabbitry search |

### Health Testing Databases

| Database | Lookup URL | Notes |
|----------|-----------|-------|
| OFA | https://ofa.org/advanced-search/ | Search by dog name or number |
| PennHIP | https://antechimagingservices.com/pennhip/ | Requires registration |
| CAER | https://www.ofa.org/diseases/eye-certification | Part of OFA |
| CHIC | https://www.ofa.org/chic-programs | Breed-specific requirements |

### License Lookup

| Type | Lookup URL | Notes |
|------|-----------|-------|
| USDA | https://acis.aphis.edc.usda.gov/ords/f?p=116 | APHIS Animal Care Search |
| State | Varies by state | Check state dept of agriculture |

### Business Registration

| State | Lookup URL |
|-------|-----------|
| California | https://bizfileonline.sos.ca.gov/search/business |
| Texas | https://mycpa.cpa.state.tx.us/coa/ |
| Florida | https://search.sunbiz.org/ |
| (Add more as needed) | |

### Service Provider Certification Bodies

| Organization | Lookup URL | Certifications |
|--------------|-----------|----------------|
| CCPDT | https://www.ccpdt.org/dog-owners/certified-dog-trainer-directory/ | CPDT-KA, CPDT-KSA |
| KPA | https://www.karenpryoracademy.com/find-a-trainer | KPA CTP |
| IAABC | https://m.iaabc.org/consultants/ | CDBC, CABC |
| NCMG | https://nationaldoggroomers.com/find-a-groomer | Certified Master Groomer |
| IPATA | https://www.ipata.org/pet-shippers-directory | IPATA Member |

### Professional License Boards

| License Type | Where to Look |
|--------------|---------------|
| Veterinarian | State Veterinary Medical Board (varies by state) |
| Vet Technician | State Veterinary Technician Board |
| Groomer | State Cosmetology Board (where required) |
| Boarding Facility | State Dept of Agriculture / Local Animal Control |

**Example State Vet Board Lookups:**
| State | Lookup URL |
|-------|-----------|
| California | https://www.vmb.ca.gov/consumers/license_verification.shtml |
| Texas | https://www.veterinary.texas.gov/lic_verification.php |
| Florida | https://mqa-internet.doh.state.fl.us/MQASearchServices/Home |
| (Add more as needed) | |

---

## Data Model

### New Tables/Fields Required

```prisma
// Verification fields on MarketplaceUser (for Service Providers)
model MarketplaceUser {
  // ... existing fields ...

  // 2FA Methods
  passkeyCredentialId       String?
  passkeyPublicKey          String?
  passkeyCreatedAt          DateTime?
  totpSecret                String?
  totpVerifiedAt            DateTime?
  smsPhoneNumber            String?
  smsVerifiedAt             DateTime?

  // Identity verification (for non-Stripe Connect users)
  identityVerifiedAt        DateTime?
  identityVerificationId    String?  // Stripe Identity session ID

  // Verification tier (for service providers)
  serviceProviderTier       ServiceProviderTier @default(LISTED)
}

enum ServiceProviderTier {
  LISTED              // Tier 0 - email + 2FA
  IDENTITY_VERIFIED   // Tier 1 - ID verified
  VERIFIED_PROFESSIONAL // Tier 2 - paid package
  ACCREDITED_PROVIDER // Tier 3 - paid package
}

// Verification fields on MarketplaceProvider (for Breeders - extends existing)
model MarketplaceProvider {
  // ... existing fields ...

  // Verification tier
  verificationTier          BreederVerificationTier @default(SUBSCRIBER)

  // Automated verifications
  phoneNumber               String?
  phoneVerifiedAt           DateTime?
  identityVerifiedAt        DateTime?
  identityVerificationId    String?  // Stripe Identity session ID

  // Paid verification packages
  verifiedPackagePurchasedAt    DateTime?
  verifiedPackageExpiresAt      DateTime?
  verifiedPackageApprovedAt     DateTime?
  verifiedPackageApprovedBy     Int?

  accreditedPackagePurchasedAt  DateTime?
  accreditedPackageExpiresAt    DateTime?
  accreditedPackageApprovedAt   DateTime?
  accreditedPackageApprovedBy   Int?

  // Platform-earned badges
  quickResponderBadge       Boolean @default(false)
  establishedBadge          Boolean @default(false)
  topRatedBadge             Boolean @default(false)
  trustedBadge              Boolean @default(false)
}

enum BreederVerificationTier {
  SUBSCRIBER          // Tier 0 - baseline
  MARKETPLACE_ENABLED // Tier 1 - phone verified
  IDENTITY_VERIFIED   // Tier 2 - ID verified
  VERIFIED            // Tier 3 - paid package (BreederHQ Verified)
  ACCREDITED          // Tier 4 - paid package (BreederHQ Accredited)
}

// Unified verification requests queue (for both Breeders and Service Providers)
model VerificationRequest {
  id                    Int      @id @default(autoincrement())

  // Who is being verified
  userType              VerificationUserType  // BREEDER or SERVICE_PROVIDER
  userId                Int?                  // MarketplaceUser ID (for service providers)
  providerId            Int?                  // MarketplaceProvider ID (for breeders)

  // Request details
  packageType           VerificationPackageType
  status                VerificationRequestStatus @default(PENDING)

  // Breeder-specific info
  registryName          String?
  registryMemberId      String?
  animalsToVerify       Json?    // Array of animal names/numbers
  vetClinicName         String?
  vetClinicPhone        String?
  vetClinicContact      String?

  // Service Provider-specific info
  certifications        Json?    // Array of certification details
  professionalLicenseType    String?
  professionalLicenseNumber  String?
  professionalLicenseState   String?
  insuranceCompany      String?
  insurancePolicyNumber String?
  insuranceCoverageAmount Int?
  insuranceExpiresAt    DateTime?

  // Shared info
  businessName          String?
  businessType          String?
  businessState         String?
  businessRegNumber     String?

  // Staff review
  reviewNotes           String?
  reviewChecklist       Json?    // Stores completed checklist
  reviewedAt            DateTime?
  reviewedBy            Int?

  // Payment
  paymentIntentId       String?
  amountPaidCents       Int?

  // Timestamps
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@schema("marketplace")
}

enum VerificationUserType {
  BREEDER
  SERVICE_PROVIDER
}

enum VerificationPackageType {
  VERIFIED    // $149 + $49/year (BreederHQ Verified or Verified Professional)
  ACCREDITED  // $249 + $99/year (BreederHQ Accredited or Accredited Provider)
}

enum VerificationRequestStatus {
  PENDING
  IN_REVIEW
  NEEDS_INFO
  APPROVED
  DENIED
}
```

---

## Pricing Summary

### Breeder Pricing

| Package | One-Time Fee | Annual Renewal | What's Included |
|---------|--------------|----------------|-----------------|
| **Marketplace Enabled** | Free | Free | Phone verification |
| **Identity Verified** | Free* | Free | Stripe Identity check |
| **BreederHQ Verified** | $149 | $49 | Registry + Health testing verification |
| **BreederHQ Accredited** | $249 | $99 | All above + Vet + Business + License |

*Stripe Identity cost (~$1.50) absorbed by platform or passed to breeder.

### Service Provider Pricing

| Package | One-Time Fee | Annual Renewal | What's Included |
|---------|--------------|----------------|-----------------|
| **Listed** | Free | Free | Email + 2FA |
| **Identity Verified** | Free or $10 | Free | Stripe Connect (free) or Stripe Identity ($10) |
| **Verified Professional** | $149 | $49 | Professional certifications verification |
| **Accredited Provider** | $249 | $99 | All above + License + Business + Insurance |

---

## Renewal Process

### Automated Reminders

- **60 days before expiration:** Email reminder with renewal link
- **30 days before expiration:** Second email reminder
- **7 days before expiration:** Final reminder, badge shows "Expiring Soon"
- **Expiration day:** Badge removed, user notified

### Breeder Renewal Verification

Staff re-verifies:
- Registry membership still active
- Health testing still current (within last 2 years)
- Vet reference still valid (for Accredited)
- Business/License still active (for Accredited)

### Service Provider Renewal Verification

Staff re-verifies:
- Professional certifications still active/current
- Professional license still valid (for Accredited)
- Business registration still active (for Accredited)
- Insurance policy still in effect with valid COI (for Accredited)

Renewal is faster than initial verification since baseline info is on file.

---

## FAQ

### For Breeders

**Q: Why do I need phone verification to list on the marketplace?**
A: Phone verification helps us maintain a trusted marketplace by ensuring all sellers have a verified contact method. It prevents spam and fake listings.

**Q: What if my verification is denied?**
A: We'll tell you exactly why and what you can do to fix it. Common issues include expired registry memberships or health tests not appearing in the database yet. You can resubmit once the issue is resolved.

**Q: Do I lose my badge if I cancel my subscription?**
A: Yes. Verification badges require an active BreederHQ subscription. If you resubscribe, you'll need to re-verify.

**Q: Can I upgrade from Verified to Accredited?**
A: Yes. You'll pay the difference ($100) plus complete the additional verifications. Your existing verifications carry over.

### For Service Providers

**Q: Why do I need 2FA to list services?**
A: Two-factor authentication helps us maintain a trusted marketplace by ensuring all service providers have secure accounts. It prevents spam and fake listings.

**Q: What 2FA method should I choose?**
A: We recommend Passkeys (Face ID, Touch ID, Windows Hello) - they're the most secure and easiest to use. Authenticator apps are also a great choice. SMS is available as a fallback.

**Q: How do I get Identity Verified for free?**
A: Connect your Stripe account to accept payments through the platform. Stripe verifies your identity as part of their onboarding process, and you'll automatically receive the Identity Verified badge.

**Q: What if I don't want to connect Stripe?**
A: You can pay $10 for standalone identity verification through Stripe Identity. This is a one-time fee.

**Q: What credentials count for Verified Professional?**
A: We verify certifications from recognized industry bodies (CCPDT, KPA, IAABC for trainers; NCMG, IPG for groomers; etc.). Contact us if you're unsure about your specific certification.

### For Staff

**Q: What if I can't find the breeder in a registry database?**
A: Ask the breeder for additional info (registered kennel name, alternate spellings, etc.). If still not found, mark as "Needs Info" and request documentation.

**Q: What if the vet clinic won't confirm the relationship?**
A: Some clinics have privacy policies. Ask the breeder to have their vet proactively contact us, or accept a letter on clinic letterhead.

**Q: What if I can't verify a service provider's certification?**
A: Check the issuing organization's website for a directory or verification tool. If no public lookup exists, ask the provider for a copy of their certificate and verify it appears legitimate (official letterhead, certificate number, etc.).

**Q: How do I verify insurance?**
A: Review the Certificate of Insurance (COI) the provider submits. Confirm: (1) Policy is current, (2) Named insured matches the provider, (3) Coverage amount meets minimums. You don't need to call the insurance company.

**Q: How long should verification take?**
A: Target 3-5 business days. Most verifications take 30-45 minutes of actual work time.

---

## Implementation Phases

### Phase 1: Breeder Foundation
- [ ] Add verification tier field to MarketplaceProvider
- [ ] Implement phone verification (SMS OTP)
- [ ] Gate breeder marketplace listing on Tier 1 (phone verified)
- [ ] Display verification badges on breeder storefront

### Phase 2: Service Provider Foundation
- [ ] Implement 2FA options (Passkey, TOTP, SMS)
- [ ] Gate service listing creation on 2FA enabled
- [ ] Display verification badges on service listings

### Phase 3: Identity Verification
- [ ] Integrate Stripe Identity
- [ ] Implement identity verification flow for both user types
- [ ] Implement Stripe Connect as identity verification path for service providers
- [ ] Add Identity Verified badge display

### Phase 4: Paid Packages
- [ ] Create unified verification request table
- [ ] Build verification purchase flow (both user types)
- [ ] Build admin verification queue/dashboard
- [ ] Implement badge activation on approval

### Phase 5: Renewals & Maintenance
- [ ] Implement expiration tracking
- [ ] Build renewal reminder system
- [ ] Build renewal purchase flow
- [ ] Implement badge expiration logic

---

## Current Schema Gap Analysis

> **Analysis Date:** 2026-01-13
> **Schema Location:** `breederhq-api/prisma/schema.prisma`

### What Already Exists

| Feature | Model | Status |
|---------|-------|--------|
| Basic phone field | MarketplaceProvider, MarketplaceUser | Exists (no verification logic) |
| Quick Responder badge | MarketplaceProvider, Tenant | Exists |
| Verified/Premium badges | MarketplaceProvider | Exists (boolean flags only) |
| Stripe Connect | MarketplaceProvider | Fully implemented |
| Passkey support | User (main platform) | Exists (not marketplace users) |
| Breeder reporting/flagging | BreederReport, BreederReportFlag | Exists |
| Admin moderation routes | Various | Exists |

### What's Missing

| Feature | Gap | Priority |
|---------|-----|----------|
| **Phone verification** | No OTP token, expiration, verified status fields | High |
| **Verification tiers** | No enum or tier field on MarketplaceProvider or MarketplaceUser | High |
| **Stripe Identity** | No session ID, verification status, or timestamp fields | High |
| **Paid package tracking** | No purchase date, approval date, expiration fields | Medium |
| **2FA for marketplace users** | No TOTP secret, passkey credentials, or SMS verification | High |
| **Verification request queue** | No model for staff to review/approve paid packages | Medium |
| **Additional badges** | Missing: established, top rated, trusted | Low |

### Architectural Notes

1. **Dual badge tracking conflict** - `Tenant` has `quickResponderBadge` and `MarketplaceProvider` has `quickResponder`. Need to decide source of truth or implement sync logic.

2. **Passkey model exists but for main User only** - Need marketplace-specific passkey fields or new model for `MarketplaceUser`.

3. **Stripe Connect provides identity verification** - For service providers who enable payments, identity verification comes "for free" via Stripe's KYC process.

---

## Required Schema Changes

### New Enums

```prisma
enum BreederVerificationTier {
  SUBSCRIBER            // Tier 0 - has active subscription
  MARKETPLACE_ENABLED   // Tier 1 - phone verified
  IDENTITY_VERIFIED     // Tier 2 - Stripe Identity verified
  VERIFIED              // Tier 3 - paid package (BreederHQ Verified)
  ACCREDITED            // Tier 4 - paid package (BreederHQ Accredited)
}

enum ServiceProviderVerificationTier {
  LISTED                  // Tier 0 - email + 2FA
  IDENTITY_VERIFIED       // Tier 1 - Stripe Identity or Stripe Connect
  VERIFIED_PROFESSIONAL   // Tier 2 - paid package
  ACCREDITED_PROVIDER     // Tier 3 - paid package
}

enum VerificationRequestStatus {
  PENDING       // Awaiting staff review
  IN_REVIEW     // Staff actively reviewing
  NEEDS_INFO    // Waiting for user to provide more info
  APPROVED      // Verified, badge activated
  DENIED        // Rejected
}

enum TwoFactorMethod {
  PASSKEY       // WebAuthn/Passkey
  TOTP          // Authenticator app
  SMS           // SMS OTP (fallback)
}
```

### Add to MarketplaceProvider Model

```prisma
model MarketplaceProvider {
  // ... existing fields ...

  // Verification tier
  verificationTier              BreederVerificationTier @default(SUBSCRIBER)
  verificationTierAchievedAt    DateTime?

  // Phone verification
  phoneVerifiedAt               DateTime?
  phoneVerificationToken        String?
  phoneVerificationTokenExpires DateTime?

  // Stripe Identity verification
  stripeIdentitySessionId       String?
  stripeIdentityStatus          String?   // "pending", "verified", "failed"
  identityVerifiedAt            DateTime?

  // Paid verification packages - BreederHQ Verified
  verifiedPackagePurchasedAt    DateTime?
  verifiedPackageApprovedAt     DateTime?
  verifiedPackageApprovedBy     Int?      // Admin user ID
  verifiedPackageExpiresAt      DateTime?

  // Paid verification packages - BreederHQ Accredited
  accreditedPackagePurchasedAt  DateTime?
  accreditedPackageApprovedAt   DateTime?
  accreditedPackageApprovedBy   Int?      // Admin user ID
  accreditedPackageExpiresAt    DateTime?

  // Additional platform-earned badges
  establishedBadge              Boolean @default(false)
  establishedBadgeEarnedAt      DateTime?
  topRatedBadge                 Boolean @default(false)
  topRatedBadgeEarnedAt         DateTime?
  trustedBadge                  Boolean @default(false)
  trustedBadgeEarnedAt          DateTime?
}
```

### Add to MarketplaceUser Model

```prisma
model MarketplaceUser {
  // ... existing fields ...

  // Two-Factor Authentication
  twoFactorEnabled              Boolean @default(false)
  twoFactorMethod               TwoFactorMethod?
  twoFactorEnabledAt            DateTime?

  // TOTP (Authenticator App)
  totpSecret                    String?
  totpVerifiedAt                DateTime?

  // Passkey (WebAuthn) - marketplace-specific
  passkeyCredentialId           String?
  passkeyPublicKey              Bytes?
  passkeyCounter                Int?
  passkeyCreatedAt              DateTime?

  // SMS verification
  smsPhoneNumber                String?
  smsVerifiedAt                 DateTime?
  smsVerificationToken          String?
  smsVerificationTokenExpires   DateTime?

  // Service Provider verification tier
  serviceProviderTier           ServiceProviderVerificationTier?
  serviceProviderTierAchievedAt DateTime?

  // Stripe Identity (for standalone $10 verification)
  stripeIdentitySessionId       String?
  stripeIdentityStatus          String?
  identityVerifiedAt            DateTime?

  // Paid verification packages - Verified Professional
  verifiedProfessionalPurchasedAt DateTime?
  verifiedProfessionalApprovedAt  DateTime?
  verifiedProfessionalApprovedBy  Int?
  verifiedProfessionalExpiresAt   DateTime?

  // Paid verification packages - Accredited Provider
  accreditedProviderPurchasedAt   DateTime?
  accreditedProviderApprovedAt    DateTime?
  accreditedProviderApprovedBy    Int?
  accreditedProviderExpiresAt     DateTime?

  // Platform-earned badges
  quickResponderBadge           Boolean @default(false)
  establishedProviderBadge      Boolean @default(false)
  topRatedBadge                 Boolean @default(false)
  trustedProviderBadge          Boolean @default(false)
  acceptsPaymentsBadge          Boolean @default(false)
}
```

### New Model: VerificationRequest

```prisma
model VerificationRequest {
  id                        Int      @id @default(autoincrement())

  // Who is being verified (polymorphic)
  userType                  String   // "BREEDER" or "SERVICE_PROVIDER"
  providerId                Int?     // MarketplaceProvider ID (for breeders)
  marketplaceUserId         Int?     // MarketplaceUser ID (for service providers)

  // What package was requested
  packageType               String   // "VERIFIED" or "ACCREDITED"
  requestedTier             String   // Full tier name for reference

  // Request status
  status                    VerificationRequestStatus @default(PENDING)

  // User-submitted verification info (flexible JSON)
  // Breeders: registry info, animal names for health testing, vet contact
  // Service Providers: certification details, license info, insurance COI
  submittedInfo             Json?

  // Staff review
  reviewChecklist           Json?    // Completed checklist items
  reviewNotes               String?  // Internal notes
  reviewedAt                DateTime?
  reviewedBy                Int?     // Admin user ID

  // If more info needed
  infoRequestedAt           DateTime?
  infoRequestNote           String?
  infoProvidedAt            DateTime?

  // Payment tracking
  paymentIntentId           String?  // Stripe PaymentIntent ID
  amountPaidCents           Int?

  // Timestamps
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  @@index([status, createdAt(sort: Desc)])
  @@index([userType, status])
  @@index([providerId])
  @@index([marketplaceUserId])

  @@schema("marketplace")
}
```

---

## Required API Routes

### Breeder Verification Routes

```
POST /api/v1/marketplace/providers/verification/phone/send
  → Send SMS OTP to provider's phone

POST /api/v1/marketplace/providers/verification/phone/verify
  → Verify SMS OTP code, set phoneVerifiedAt

POST /api/v1/marketplace/providers/verification/identity/start
  → Create Stripe Identity session, return client secret

POST /api/v1/marketplace/providers/verification/identity/webhook
  → Handle Stripe Identity webhook, update verification status

POST /api/v1/marketplace/providers/verification/package/purchase
  → Purchase Verified or Accredited package, create VerificationRequest

GET /api/v1/marketplace/providers/verification/status
  → Get current verification tier and badge status
```

### Service Provider 2FA Routes

```
GET /api/v1/marketplace/auth/2fa/status
  → Get current 2FA status and available methods

POST /api/v1/marketplace/auth/2fa/passkey/register/start
  → Start WebAuthn registration, return challenge

POST /api/v1/marketplace/auth/2fa/passkey/register/finish
  → Complete WebAuthn registration, store credential

POST /api/v1/marketplace/auth/2fa/totp/setup
  → Generate TOTP secret, return QR code URI

POST /api/v1/marketplace/auth/2fa/totp/verify
  → Verify TOTP code, enable TOTP 2FA

POST /api/v1/marketplace/auth/2fa/sms/setup
  → Send SMS verification code

POST /api/v1/marketplace/auth/2fa/sms/verify
  → Verify SMS code, enable SMS 2FA

POST /api/v1/marketplace/auth/2fa/disable
  → Disable 2FA (requires current 2FA verification)

POST /api/v1/marketplace/auth/2fa/challenge
  → Verify 2FA code during login
```

### Service Provider Verification Routes

```
POST /api/v1/marketplace/users/verification/identity/start
  → Start Stripe Identity verification ($10 standalone)

POST /api/v1/marketplace/users/verification/identity/webhook
  → Handle Stripe Identity webhook

POST /api/v1/marketplace/users/verification/package/purchase
  → Purchase Verified Professional or Accredited Provider package

GET /api/v1/marketplace/users/verification/status
  → Get current verification tier and badge status
```

### Admin Verification Queue Routes

```
GET /api/v1/marketplace/admin/verification-requests
  → List all verification requests with filters (status, type, date)

GET /api/v1/marketplace/admin/verification-requests/:id
  → Get single request with full details

POST /api/v1/marketplace/admin/verification-requests/:id/start-review
  → Mark request as IN_REVIEW, assign to admin

POST /api/v1/marketplace/admin/verification-requests/:id/request-info
  → Set status to NEEDS_INFO, send email to user

POST /api/v1/marketplace/admin/verification-requests/:id/approve
  → Approve request, activate badge, set expiration

POST /api/v1/marketplace/admin/verification-requests/:id/deny
  → Deny request with reason

GET /api/v1/marketplace/admin/verification-requests/stats
  → Dashboard stats (pending count, avg review time, etc.)
```

---

## Related Documentation

- [BREEDER-VISIBILITY-CONTROLS-COMPLETE-LIST.md](BREEDER-VISIBILITY-CONTROLS-COMPLETE-LIST.md) - Visibility controls
- [BREEDER-MARKETPLACE-MANAGEMENT-COMPLETE-GUIDE.md](BREEDER-MARKETPLACE-MANAGEMENT-COMPLETE-GUIDE.md) - Marketplace management
- [v2-marketplace-management.md](v2-marketplace-management.md) - Detailed specifications

---

## End of Document
