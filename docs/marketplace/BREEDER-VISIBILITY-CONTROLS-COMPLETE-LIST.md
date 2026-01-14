# Breeder Marketplace Visibility Controls - Complete List

> **Purpose:** Comprehensive list of all visibility toggles and controls that breeders have over their marketplace listings, including both direct marketplace controls and deep-linked data from other modules.

**Last Updated:** 2026-01-13
**Status:** DEFINITIVE REFERENCE

---

## Control Architecture Overview

Breeders control marketplace visibility through a **two-layer system**:

1. **Source Module Privacy Controls** - Data visibility set in originating modules (Animals, Breeding, etc.)
2. **Marketplace Visibility Controls** - Marketplace-specific toggles in `/marketplace-manage/*` routes

**Both layers must permit visibility for data to appear publicly.**

---

## Section 1: My Storefront Controls

**Route:** `/marketplace-manage/storefront`

### 1.1 Identity & Branding

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Business Name** | Display Only | Visible | Tenant Settings | Cannot hide (required) |
| **Logo** | Toggle | Visible | Marketplace Profile | Can hide logo |
| **Banner Image** | Toggle | Visible | Marketplace Profile | Can hide banner |
| **Bio / About** | Toggle + Edit | Visible | Marketplace Profile | Can hide entire section |
| **Year Established** | Toggle + Edit | Visible | Marketplace Profile | Can hide |
| **Languages Spoken** | Toggle + Edit | Visible | Marketplace Profile | Can hide, multi-select |

### 1.2 Location Controls

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Location Display Mode** | Radio Select | City, State | Tenant Address | 3 options below |
| └─ Full City, State | Option | Selected | Tenant Address | "Portland, OR" |
| └─ ZIP Code Only | Option | - | Tenant Address | "97201" |
| └─ Hidden | Option | - | - | No location shown |
| **Search Participation** | Toggle | ON | Marketplace Profile | Appear in geo-location searches |
| **Street Address** | N/A | NEVER | Tenant Address | Never shown publicly |

**Important:** Street address is architecturally blocked from public display. Only city/state or ZIP can be shown.

### 1.3 Contact & Links

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Contact Email** | Toggle | Visible | Tenant (system email) | Can hide email |
| **Contact Phone** | Toggle + Edit | Visible | Marketplace Profile | Can hide phone |
| **Website URL** | Toggle + Edit | Visible | Marketplace Profile | Can hide website |
| **Instagram Handle** | Toggle + Edit | Visible | Marketplace Profile | Can hide Instagram |
| **Facebook Page** | Toggle + Edit | Visible | Marketplace Profile | Can hide Facebook |
| **Business Hours** | Toggle | Visible | Marketing Module | Can hide hours |

### 1.4 Breeds

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Listed Breeds** | Per-Breed Toggle | All Visible | Animal Roster | Auto-populated from animals |
| └─ Per Breed Visibility | Toggle per breed | Visible | Computed | Hide specific breeds |

**Data Source:** Automatically aggregated from all breeds associated with breeder's animals. Breeder can hide breeds they're not ready to market.

### 1.5 Standards & Credentials

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Registrations Section** | Section Toggle | Visible | Marketplace Profile | Hide entire section |
| └─ Individual Registration | Per-Item Toggle | Visible | Marketplace Profile | Multi-select + custom |
| **Health Practices Section** | Section Toggle | Visible | Marketplace Profile | Hide entire section |
| └─ Individual Practice | Per-Item Toggle | Visible | Marketplace Profile | Multi-select + custom |
| **Breeding Practices Section** | Section Toggle | Visible | Marketplace Profile | Hide entire section |
| └─ Individual Practice | Per-Item Toggle | Visible | Marketplace Profile | Multi-select + custom |
| **Care Practices Section** | Section Toggle | Visible | Marketplace Profile | Hide entire section |
| └─ Individual Practice | Per-Item Toggle | Visible | Marketplace Profile | Multi-select + custom |

**Input Model:** Suggestions from curated lists + custom entries + free-form notes per section.

### 1.6 Placement Policies

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Application Required** | Toggle + Checkbox | Visible | Marketplace Profile | Show policy badge |
| **Interview Required** | Toggle + Checkbox | Visible | Marketplace Profile | Show policy badge |
| **Contract Required** | Toggle + Checkbox | Visible | Marketplace Profile | Show policy badge |
| **Return Policy** | Toggle + Checkbox | Visible | Marketplace Profile | Show policy badge |
| **Lifetime Support** | Toggle + Checkbox | Visible | Marketplace Profile | Show policy badge |
| **Policy Notes** | Toggle + Edit | Visible | Marketplace Profile | Free-form text |

### 1.7 Payment & Delivery

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Payment Methods** | Toggle + Multi-Select | Visible | Marketplace Profile | Credit Card, Check, etc. |
| **Shipping Available** | Toggle + Checkbox | Visible | Marketplace Profile | Show shipping option |
| **Delivery Available** | Toggle + Checkbox | Visible | Marketplace Profile | Show delivery option |
| **Delivery Radius** | Toggle + Input | Visible | Marketplace Profile | Miles from location |
| **Pickup Only** | Toggle + Checkbox | Visible | Marketplace Profile | Show pickup option |

### 1.8 Raising Protocols (Storefront Defaults)

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Protocols Section** | Section Toggle | Visible | Marketplace Profile | Hide entire section |
| **Individual Protocol Tags** | Per-Tag Toggle | Visible | Marketplace Profile | Species-aware suggestions |
| **Protocol Details** | Toggle + Edit | Visible | Marketplace Profile | Free-form description |

**Species-Aware Suggestions:**
- **Dogs:** ENS, ESI, Puppy Culture, Avidog, BAB, Rule of 7s, Volhard Testing, Crate Training, etc.
- **Cats:** Litter Training, Handling, Socialization, Indoor/Outdoor Transition
- **Horses:** Halter Breaking, Leading, Hoof Handling, Trailer Loading, Imprint Training
- **Goats/Sheep:** Bottle-raised, Dam-raised, Disbudding, Hoof Care, Halter Training
- **Camelids:** Halter Training, Shearing Conditioning, Herd Socialization
- **Rabbits:** Handling, Nail Trims, Grooming, Show Posing
- **Poultry:** Brooder Protocols, Handling, Show Conditioning

**Note:** Programs can override these defaults with program-specific protocols.

### 1.9 Placement Package (Storefront Defaults)

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Package Section** | Section Toggle | Visible | Marketplace Profile | Hide entire section |
| **Individual Included Items** | Per-Item Toggle | Visible | Marketplace Profile | Multi-select + custom |
| **Health Guarantee** | Toggle + Edit | Visible | Marketplace Profile | Free-form text |
| **Package Details** | Toggle + Edit | Visible | Marketplace Profile | Additional notes |

**Common Items:** Starter Food, Health Records, Vaccination Records, Deworming Records, Registration Papers, Microchip, Contract, Health Guarantee Documentation, Comfort Item, Training Resources, Lifetime Breeder Support

**Note:** Programs can override these defaults with program-specific packages.

### 1.10 Trust Badges

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Verified Identity** | Computed Badge | Auto | Platform Data | Cannot manually toggle |
| **Health Testing** | Computed Badge | Auto | Platform Data | Cannot manually toggle |
| **5+ Placements** | Computed Badge | Auto | Platform Data | Cannot manually toggle |
| **Quick Responder** | Computed Badge | Auto | Platform Data | Cannot manually toggle |

**Important:** Trust badges are earned based on platform behavior and cannot be manually enabled/disabled. The management UI shows:
- Which badges have been earned (displayed)
- Which badges are locked (criteria shown)

### 1.11 Storefront Publishing Controls

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Publish Storefront** | Action Button | Draft | Make entire storefront live |
| **Unpublish Storefront** | Action Button | - | Remove from marketplace (keeps data) |
| **Save Draft** | Action Button | - | Save without publishing |

---

## Section 2: Breeding Programs Controls

**Route:** `/marketplace-manage/programs`

### 2.1 Program Identity

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Program Name** | Required Field | - | BreedingProgram | Cannot hide (required) |
| **Species** | Required Field | - | BreedingProgram | Cannot hide |
| **Breed** | Toggle + Field | Visible | BreedingProgram | Can hide breed display |
| **Description** | Toggle + Edit | Visible | BreedingProgram | Short description |
| **Program Story** | Toggle + Edit | Visible | BreedingProgram | Long-form story |

### 2.2 Program Media

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Cover Image** | Toggle + Upload | Visible | BreedingProgramMedia | Program cover photo |
| **Gallery Images** | Per-Image Toggle | Visible | BreedingProgramMedia | Hide individual images |
| **Video Links** | Per-Video Toggle | Visible | BreedingProgram | YouTube/Vimeo embeds |

### 2.3 Featured Parents

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Feature Parent** | Select + Order | None | Animals (via plans) | Select which parents to showcase |
| **Display Order** | Drag-to-Reorder | - | Program Setting | Control parent order |

**Per-Parent Data (Controlled at Animal Level):**

These elements are pulled from the Animal record if the Animal's privacy settings allow:

| Element | Controlled At | Visibility Rule |
|---------|--------------|----------------|
| Photos | Animal Media | Animal privacy setting |
| Name & Registered Name | Animal Profile | Always shown if parent featured |
| Titles & Achievements | AnimalTitle | Animal privacy setting |
| Health Testing Results | Health Tests | Animal privacy setting |
| Genetic Results | AnimalGeneticResult | `marketplaceVisible` flag on Animal |
| Pedigree (parents, grandparents) | PedigreeNode | Animal privacy setting |
| COI % | Calculated | Animal privacy setting |
| Documents | Animal Documents | Animal privacy setting |

**Key Insight:** The Program page features parents, but what data shows for each parent is controlled on the **Animal record itself** in the Animals module. If a health test is marked private on the Animal, it won't show even if the parent is featured in a Program.

### 2.4 Raising Protocols (Program-Specific)

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Use Storefront Defaults** | Master Toggle | ON | Program Setting | Inherit vs override |
| **Protocol Tags** | Per-Tag Toggle | Inherited | Program OR Storefront | If override: custom tags |
| **Protocol Details** | Toggle + Edit | Inherited | Program OR Storefront | If override: custom text |

**Behavior:**
- **ON:** Shows Storefront protocols (read-only, edit at Storefront)
- **OFF:** Enable program-specific protocol entry (overrides Storefront)

### 2.5 Placement Package (Program-Specific)

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Use Storefront Defaults** | Master Toggle | ON | Program Setting | Inherit vs override |
| **Included Items** | Per-Item Toggle | Inherited | Program OR Storefront | If override: custom items |
| **Health Guarantee** | Toggle + Edit | Inherited | Program OR Storefront | If override: custom text |
| **Package Details** | Toggle + Edit | Inherited | Program OR Storefront | If override: custom text |

**Behavior:** Same as Raising Protocols - inherit or override.

### 2.6 Pricing Display

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Pricing Tiers** | Per-Tier Toggle | Visible | BreedingProgram | Pet/Breeder/Show pricing |
| **What's Included** | Toggle + Edit | Visible | BreedingProgram | Pricing details |
| **Typical Wait Time** | Toggle + Edit | Visible | BreedingProgram | "6-12 months" |

### 2.7 Program Functionality Settings

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Accept Inquiries** | Toggle | ON | BreedingProgram | Enable inquiry button |
| **Open Waitlist** | Toggle | ON | BreedingProgram | Enable waitlist signup |
| **Accept Reservations** | Toggle | ON | BreedingProgram | Enable reservation deposits |
| **Published** | Master Toggle | OFF | BreedingProgram | Program live on marketplace |
| **Listed** | Toggle | ON | BreedingProgram | Appears in browse/search |

### 2.8 Linked Litters Display

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Show Linked Plans** | Toggle | Visible | Computed | Show connected breeding plans |
| **Show Upcoming Litters** | Toggle | Visible | Computed | Show expected/coming soon |
| **Show Available Litters** | Toggle | Visible | Computed | Show currently available |

**Data Source:** Read-only from Breeding Plans linked to this Program. Breeder controls linking in Breeding module.

---

## Section 3: Animal Listings Controls

**Route:** `/marketplace-manage/animals`

### 3.1 Animal Selection & Listing Intent

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Listing Intent** | Dropdown | Not Listed | Animal Record | Controls listing type |
| └─ Not Listed | Option | Selected | - | Not on marketplace |
| └─ Stud Service | Option | - | - | Listed as breeding stud |
| └─ Available | Option | - | - | For sale/adoption |
| └─ Rehome | Option | - | - | Rehoming listing |

**Note:** `SHOWCASE` intent was removed. Use `AVAILABLE` for breeding stock showcase.

### 3.2 Animal Privacy Controls (Source Module)

**Controlled in Animals Module - Affects Marketplace Display:**

| Control Element | Location | Default | Affects Marketplace |
|----------------|----------|---------|---------------------|
| **Animal Privacy Mode** | Animals Module | Private | If Private: never on marketplace |
| **Public Profile Photo** | Animals Module | Hidden | Photo visibility on listings |
| **Show Titles** | Animals Module | Hidden | Titles/achievements display |
| **Show Health Tests** | Animals Module | Hidden | Health testing results display |
| **Show Genetic Results** | Animals Module | Hidden | Genetic test results display |
| **Show Pedigree** | Animals Module | Hidden | Pedigree display (parents/grandparents) |
| **Show Documents** | Animals Module | Hidden | Document attachments display |

**Key Rule:** Animal must be set to "Public" or "Marketplace" privacy mode in Animals module to be eligible for marketplace listing, AND must have a Listing Intent set in marketplace controls.

### 3.3 Animal Listing Fields (Marketplace Module)

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Listing Title** | Edit | Auto | Animal Name | Override display name |
| **Listing Description** | Toggle + Edit | Visible | Marketplace Listing | Custom description |
| **Listing Slug** | Edit | Auto | Animal Name | URL-friendly slug |
| **Cover Image** | Toggle + Select | Visible | Animal Media | Choose cover photo |
| **Price** | Toggle + Edit | Hidden | Marketplace Listing | List price (cents) |
| **Price Display Mode** | Radio | Fixed | Marketplace Listing | Fixed, Range, or "Inquire" |

### 3.4 Stud Service Specific Controls

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Stud Fee** | Toggle + Edit | Visible | Marketplace Listing | Service fee |
| **Fee Structure** | Dropdown | Fixed | Marketplace Listing | Fixed/Stud Fee + Puppy Back |
| **AI Available** | Toggle + Checkbox | Hidden | Marketplace Listing | Artificial insemination |
| **Frozen Semen Available** | Toggle + Checkbox | Hidden | Marketplace Listing | Frozen semen shipping |
| **Live Cover Only** | Toggle + Checkbox | Visible | Marketplace Listing | In-person breeding only |
| **Health Testing** | Auto-Display | Auto | Animal Health Tests | Pulled from Animal if public |
| **Genetic Results** | Auto-Display | Auto | Animal Genetics | Pulled from Animal if public |
| **Pedigree** | Auto-Display | Auto | Animal Pedigree | Pulled from Animal if public |

### 3.5 Animal Publishing Controls

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Publish Listing** | Action Button | Draft | Make animal listing live |
| **Unpublish Listing** | Action Button | - | Remove from marketplace |
| **Published Status** | Display | - | Shows published/draft state |

---

## Section 4: Offspring Group Listings Controls

**Route:** `/marketplace-manage/offspring-groups`

### 4.1 Offspring Group Selection & Linking

**Prerequisite Chain (Automatic):**
1. Breeder creates Breeding Plan in Breeding module
2. Breeder links Breeding Plan to Breeding Program (marketplace)
3. When Plan status → COMMITTED, Offspring Group auto-created
4. Offspring Group inherits Breeding Program link
5. Offspring Group automatically appears in marketplace as "Coming Soon"

**Breeder Controls:**

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Breeding Program Link** | Display Only | Inherited | Via Breeding Plan | Cannot change here |
| **Breeding Plan Link** | Display Only | Inherited | From creation | Cannot change here |

### 4.2 Offspring Group Listing Fields

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Listing Title** | Edit | Auto | OffspringGroup | Override display name |
| **Listing Description** | Toggle + Edit | Visible | OffspringGroup | Custom description |
| **Listing Slug** | Edit | Auto | Auto-generated | URL-friendly slug |
| **Cover Image** | Toggle + Upload | Visible | OffspringGroup | Group cover photo |
| **Default Group Price** | Toggle + Edit | Hidden | OffspringGroup | Price for entire group (cents) |

### 4.3 Individual Offspring Controls

**Per-Offspring Toggles:**

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Marketplace Listed** | Per-Offspring Toggle | OFF | OffspringIndividual | Show this individual offspring |
| **Individual Price** | Edit | Inherits Group | OffspringIndividual | Override group price (cents) |

**Keeper Intent (Auto-Controls Availability):**

| Keeper Intent | Marketplace Behavior | Can Be Listed? |
|---------------|---------------------|----------------|
| **AVAILABLE** | Available for sale | ✅ YES |
| **RESERVED** | Reserved by buyer | ❌ NO (auto-hides) |
| **PLACED** | Already placed | ❌ NO (auto-hides) |
| **KEEPER** | Breeder keeping | ❌ NO (grayed out) |
| **DECEASED** | Unfortunately deceased | ❌ NO (grayed out) |

**Key Rule:** Only offspring with `keeperIntent = AVAILABLE` AND `marketplaceListed = true` AND `status = ALIVE` appear on marketplace.

### 4.4 Dam & Sire Display (Deep-Linked)

**Auto-Pulled from Animal Records:**

| Element | Controlled At | Visibility Rule |
|---------|--------------|----------------|
| Dam Photos | Dam Animal Record | Dam's privacy settings |
| Sire Photos | Sire Animal Record | Sire's privacy settings |
| Dam Health Tests | Dam Animal Record | Dam's privacy settings |
| Sire Health Tests | Sire Animal Record | Sire's privacy settings |
| Dam Genetics | Dam Animal Record | Dam's privacy settings |
| Sire Genetics | Sire Animal Record | Sire's privacy settings |
| Dam Pedigree | Dam Animal Record | Dam's privacy settings |
| Sire Pedigree | Sire Animal Record | Sire's privacy settings |

**Breeder Control:** Set visibility at the **Animal level** in Animals module. Cannot override per-litter.

### 4.5 Raising Protocols (Inherited from Program)

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Protocols Display** | Auto-Display | Inherited | Via Breeding Program | No override at offspring level |

**Inheritance Chain:**
- Offspring Group → Breeding Program → Program Protocols OR Storefront Protocols

Breeder cannot override protocols at the offspring group level. Edit at Program or Storefront level.

### 4.6 Placement Package (Inherited from Program)

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Package Display** | Auto-Display | Inherited | Via Breeding Program | No override at offspring level |

**Inheritance Chain:**
- Offspring Group → Breeding Program → Program Package OR Storefront Package

Breeder cannot override package at the offspring group level. Edit at Program or Storefront level.

### 4.7 Offspring Group Publishing Controls

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Published** | Master Toggle | OFF | Make offspring group live |
| **Published Status** | Display | Auto | Shows "Coming Soon" vs "Available" |

**Status Logic:**
- **Draft:** Not published
- **Coming Soon:** Published but `actualBirthDate` is null or future
- **Available:** Published and `actualBirthDate` is past, with available offspring

---

## Section 5: Service Listings Controls

**Route:** `/marketplace-manage/services`

### 5.1 Service Type Selection

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Service Type** | Dropdown | - | ServiceListing | Required field |
| └─ Stud Service | Option | - | - | Animal breeding services |
| └─ Training | Option | - | - | Obedience, agility, etc. |
| └─ Grooming | Option | - | - | Bathing, clipping, styling |
| └─ Transport | Option | - | - | Animal transportation |
| └─ Boarding | Option | - | - | Temporary housing |
| └─ Other Service | Option | - | - | Custom service type |

### 5.2 Service Categories (16 Top-Level + 80+ Subcategories)

**Top-Level Categories:**

| Category | Subcategory Control | Default |
|----------|-------------------|---------|
| **Training & Behavior** | Multi-Select | None |
| **Grooming & Styling** | Multi-Select | None |
| **Health & Wellness** | Multi-Select | None |
| **Boarding & Daycare** | Multi-Select | None |
| **Transport & Travel** | Multi-Select | None |
| **Breeding Services** | Multi-Select | None |
| **Photography & Media** | Multi-Select | None |
| **Events & Competitions** | Multi-Select | None |
| **Consultation Services** | Multi-Select | None |
| **Retail & Products** | Multi-Select | None |
| **Facility Services** | Multi-Select | None |
| **Emergency & Support** | Multi-Select | None |
| **Administrative Services** | Multi-Select | None |
| **Specialty Services** | Multi-Select | None |
| **Education & Classes** | Multi-Select | None |
| **Other Services** | Multi-Select | None |

**Per-Subcategory Toggle:** Breeder selects specific subcategories within each main category (e.g., "Puppy Training", "Adult Obedience" under Training).

### 5.3 Service Listing Fields

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Service Title** | Required Field | - | ServiceListing | Service name |
| **Service Description** | Toggle + Edit | Visible | ServiceListing | Full description |
| **Short Description** | Toggle + Edit | Visible | ServiceListing | Card preview text |
| **Cover Image** | Toggle + Upload | Visible | ServiceMedia | Service photo |
| **Gallery Images** | Per-Image Toggle | Visible | ServiceMedia | Additional photos |

### 5.4 Pricing & Availability

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Pricing Model** | Dropdown | Fixed | ServiceListing | Fixed/Range/Inquire |
| **Base Price** | Toggle + Edit | Visible | ServiceListing | Starting price (cents) |
| **Price Range Min** | Edit | - | ServiceListing | If Range selected |
| **Price Range Max** | Edit | - | ServiceListing | If Range selected |
| **Per-Unit Pricing** | Toggle + Edit | Visible | ServiceListing | "Per hour", "Per session" |
| **Service Duration** | Toggle + Edit | Visible | ServiceListing | Expected duration |

### 5.5 Location & Service Area

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Use Storefront Location** | Toggle | ON | ServiceListing | Inherit breeder location |
| **Custom Service Location** | Edit | - | ServiceListing | If toggle OFF: custom location |
| **Service Area Radius** | Toggle + Edit | Visible | ServiceListing | Miles from location |
| **Mobile Service** | Toggle + Checkbox | Hidden | ServiceListing | Travel to client |
| **Facility-Based** | Toggle + Checkbox | Visible | ServiceListing | Client comes to you |

### 5.6 Contact & Booking

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Use Storefront Contact** | Toggle | ON | ServiceListing | Inherit breeder contact |
| **Custom Service Contact** | Edit | - | ServiceListing | If toggle OFF: custom contact |
| **Booking URL** | Toggle + Edit | Hidden | ServiceListing | External booking link |
| **Accept Inquiries** | Toggle | ON | ServiceListing | Enable inquiry button |

### 5.7 Credentials & Requirements

| Control Element | Type | Default | Source | Notes |
|----------------|------|---------|--------|-------|
| **Certifications** | Per-Item Toggle | Visible | ServiceListing | Multi-select + custom |
| **Licenses** | Per-Item Toggle | Visible | ServiceListing | Multi-select + custom |
| **Insurance** | Toggle + Edit | Visible | ServiceListing | Insurance info |
| **Requirements** | Toggle + Edit | Visible | ServiceListing | Client requirements |

### 5.8 Service Publishing Controls

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Published** | Master Toggle | OFF | Make service listing live |
| **Listed** | Toggle | ON | Appear in browse/search |
| **Published Status** | Display | - | Shows published/draft state |

---

## Section 6: Inquiry Management Controls

**Route:** `/marketplace-manage/inquiries`

### 6.1 Inquiry Visibility & Status

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Filter by Status** | Dropdown | All | New/Active/Archived |
| **Filter by Listing Type** | Dropdown | All | Program/Animal/Service |
| **Mark as Read** | Action | - | Mark inquiry read |
| **Mark as Unread** | Action | - | Mark inquiry unread |
| **Archive Inquiry** | Action | - | Remove from active list |

### 6.2 Message Thread Controls

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Reply to Inquiry** | Action | - | Send message response |
| **Attach File** | Action | - | Attach document/photo |
| **Internal Notes** | Edit | Hidden | Private breeder notes |

**No Visibility Toggles:** Once inquiry is received, breeder cannot hide it from themselves. They can archive it.

---

## Section 7: Waitlist Management Controls

**Route:** `/marketplace-manage/waitlist`

### 7.1 Waitlist Entry Controls

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Filter by Program** | Dropdown | All | Filter by breeding program |
| **Filter by Status** | Dropdown | All | Active/Approved/Declined/Placed |
| **Approve Entry** | Action | - | Approve waitlist signup |
| **Decline Entry** | Action | - | Decline waitlist signup |
| **Mark as Placed** | Action | - | Match made, remove from waitlist |

### 7.2 Deposit Management

| Control Element | Type | Default | Notes |
|----------------|------|---------|-------|
| **Require Deposit** | Toggle | OFF | Per breeding program setting |
| **Deposit Amount** | Edit | - | Required deposit (cents) |
| **Refundable** | Checkbox | OFF | Refund policy |

**No Visibility Toggles:** Waitlist is internal tool. Breeder cannot hide waitlist from themselves.

---

## Cross-Module Data Linking Summary

### Data That Flows FROM Other Modules TO Marketplace

**Source: Animals Module → Marketplace**

| Data Element | Control Location | Marketplace Usage |
|-------------|------------------|-------------------|
| Animal Photos | Animals Module (privacy) | Featured Parents, Animal Listings, Dam/Sire Display |
| Health Tests | Animals Module (privacy) | Featured Parents, Stud Services, Dam/Sire Display |
| Genetic Results | Animals Module (`marketplaceVisible` flag) | Featured Parents, Stud Services, Dam/Sire Display |
| Pedigree | Animals Module (privacy) | Featured Parents, Stud Services, Dam/Sire Display |
| Titles & Achievements | Animals Module (privacy) | Featured Parents, Animal Listings |
| Documents | Animals Module (privacy) | Featured Parents (health certs, etc.) |

**Source: Breeding Module → Marketplace**

| Data Element | Control Location | Marketplace Usage |
|-------------|------------------|-------------------|
| Breeding Plan Link | Breeding Module | Offspring Group creation trigger |
| Offspring Group | Breeding Module | Auto-created when plan committed |
| Dam/Sire IDs | Breeding Module | Deep-link to Animal data |
| Expected Birth Date | Breeding Module | "Coming Soon" display |
| Actual Birth Date | Breeding Module | Status: Coming Soon → Available |

**Source: Tenant Settings → Marketplace**

| Data Element | Control Location | Marketplace Usage |
|-------------|------------------|-------------------|
| Business Name | Tenant Settings | Storefront display |
| Address | Tenant Settings | Location display (city/state) |
| Contact Email | Tenant Settings | System-generated contact |

**Source: Marketing Module → Marketplace**

| Data Element | Control Location | Marketplace Usage |
|-------------|------------------|-------------------|
| Business Hours | Marketing Module | Storefront display |

---

## Permission & Subscription Controls

### Marketplace Access by Subscription Tier

| Feature | Free Tier | Basic | Pro | Enterprise |
|---------|-----------|-------|-----|------------|
| **Create Storefront** | ❌ | ✅ | ✅ | ✅ |
| **Max Breeding Programs** | 0 | 1 | 5 | Unlimited |
| **Max Animal Listings** | 0 | 3 | 10 | Unlimited |
| **Max Offspring Groups** | 0 | 5 | 20 | Unlimited |
| **Max Service Listings** | 0 | 1 | 5 | Unlimited |
| **Geo-Location Search** | ❌ | ✅ | ✅ | ✅ |
| **Accept Inquiries** | ❌ | ✅ | ✅ | ✅ |
| **Waitlist Management** | ❌ | ❌ | ✅ | ✅ |
| **Reservation Deposits** | ❌ | ❌ | ✅ | ✅ |
| **Custom Branding** | ❌ | ❌ | ✅ | ✅ |

**Note:** These limits are enforced at the API level and in the UI (disabled buttons with upgrade prompts).

---

## State Machine Controls

### Listing Status State Machines

**Breeding Program States:**

| State | Can Transition To | Breeder Control |
|-------|-------------------|-----------------|
| **Draft** | Published | Publish button |
| **Published + Not Listed** | Published + Listed | Listed toggle |
| **Published + Listed** | Published + Not Listed, Unpublished | Listed toggle, Unpublish button |
| **Unpublished** | Published | Publish button |

**Animal Listing States:**

| State | Can Transition To | Breeder Control |
|-------|-------------------|-----------------|
| **Not Listed** | Draft | Set Listing Intent |
| **Draft** | Published | Publish button |
| **Published** | Unpublished | Unpublish button |
| **Unpublished** | Published | Publish button |

**Offspring Group States:**

| State | Can Transition To | Breeder Control | Auto-Transition |
|-------|-------------------|-----------------|-----------------|
| **Draft** | Published | Publish button | - |
| **Published + Coming Soon** | Available | - | When actualBirthDate set |
| **Published + Available** | Sold Out | - | When all offspring placed |
| **Published** | Unpublished | Unpublish button | - |

**Service Listing States:**

| State | Can Transition To | Breeder Control |
|-------|-------------------|-----------------|
| **Draft** | Published | Publish button |
| **Published + Not Listed** | Published + Listed | Listed toggle |
| **Published + Listed** | Published + Not Listed, Unpublished | Listed toggle, Unpublish button |
| **Unpublished** | Published | Publish button |

---

## Visibility Control Matrix

### Combined Control Requirements

For data to appear on public marketplace, **ALL of these must be true:**

| Data Type | Source Module Control | Marketplace Control | Additional Rules |
|-----------|---------------------|-------------------|------------------|
| **Storefront** | - | Storefront Published = true | - |
| **Breeding Program** | - | Program Published = true, Program Listed = true | - |
| **Animal Listing** | Animal Privacy ≠ Private | Listing Intent set, Published = true | - |
| **Animal Featured in Program** | Animal Privacy ≠ Private | Featured in Published Program | - |
| **Animal Health Tests** | Health Test Privacy = Public | Featured in Published Program | - |
| **Animal Genetics** | `marketplaceVisible` = true | Featured in Published Program | - |
| **Offspring Group** | - | Published = true | actualBirthDate must be set for "Available" |
| **Individual Offspring** | Keeper Intent = AVAILABLE, Status = ALIVE | marketplaceListed = true | Parent OffspringGroup Published = true |
| **Service Listing** | - | Published = true, Listed = true | - |

---

## Summary: Complete Control Count

### Total Toggles & Controls Available to Breeders

| Section | Direct Toggles | Inherited Toggles | Action Buttons | Total Controls |
|---------|---------------|------------------|----------------|----------------|
| **Storefront** | 47 | 0 | 4 | 51 |
| **Breeding Programs** | 31 | 15 (from Storefront) | 5 | 51 |
| **Animal Listings** | 18 | 8 (from Animals) | 3 | 29 |
| **Offspring Groups** | 5 | 22 (from Program + Animals) | 2 | 29 |
| **Service Listings** | 32 | 2 (from Storefront) | 3 | 37 |
| **Inquiries** | 2 filters | 0 | 6 | 8 |
| **Waitlist** | 4 | 0 | 4 | 8 |
| **TOTAL** | **139** | **47** | **27** | **213** |

---

## API Endpoints for Visibility Controls

### Storefront

```
GET    /api/v1/marketplace/profile          # Aggregated data + visibility settings
PUT    /api/v1/marketplace/profile/draft    # Save edits + visibility
POST   /api/v1/marketplace/profile/publish
POST   /api/v1/marketplace/profile/unpublish
```

### Breeding Programs

```
GET    /api/v1/marketplace/programs          # List programs
GET    /api/v1/marketplace/programs/:id      # Get program with visibility
PATCH  /api/v1/marketplace/programs/:id      # Update visibility + data
POST   /api/v1/marketplace/programs/:id/publish
POST   /api/v1/marketplace/programs/:id/unpublish
```

### Animal Listings

```
GET    /api/v1/animals                       # List animals with listing intent
PATCH  /api/v1/animals/:id                   # Update listing intent + privacy
PATCH  /api/v1/marketplace/animals/:id       # Update marketplace fields
POST   /api/v1/marketplace/animals/:id/publish
```

### Offspring Groups

```
GET    /api/v1/offspring                     # List offspring groups
PATCH  /api/v1/offspring/:id                 # Update group fields + visibility
PATCH  /api/v1/offspring/individuals/:id     # Update individual visibility + price
POST   /api/v1/offspring/:id/publish
```

### Service Listings

```
GET    /api/v1/marketplace/services          # List services
POST   /api/v1/marketplace/services          # Create service
PATCH  /api/v1/marketplace/services/:id      # Update service + visibility
POST   /api/v1/marketplace/services/:id/publish
DELETE /api/v1/marketplace/services/:id      # Delete service
```

---

## Navigation & Entry Points

### Breeder Entry Path

**URL:** `app.breederhq.test` or `app.breederhq.com`

**Top-Level Nav:**
- Dashboard
- Animals
- Breeding
- Contacts
- Communications
- Marketing
- **Marketplace** ← Primary entry point
- Financials

**Marketplace Sub-Navigation:**
```
/marketplace-manage
├── /storefront          ← Section 1 controls
├── /programs            ← Section 2 controls
├── /animals             ← Section 3 controls
├── /offspring-groups    ← Section 4 controls
├── /services            ← Section 5 controls
├── /inquiries           ← Section 6 controls
└── /waitlist            ← Section 7 controls
```

---

## End of Document

**This document provides the complete, definitive list of all visibility toggles and controls available to breeders for managing their marketplace listings.**

**For implementation details, see:**
- [BREEDER-MARKETPLACE-MANAGEMENT-COMPLETE-GUIDE.md](BREEDER-MARKETPLACE-MANAGEMENT-COMPLETE-GUIDE.md) - Full A→Z engineering guide
- [v2-marketplace-management.md](v2-marketplace-management.md) - Detailed functional specifications
- [user-journeys.md](user-journeys.md) - Step-by-step user workflows

**For API specifications, see:**
- [backend-capabilities.md](backend-capabilities.md) - Current backend API capabilities
- [gap-analysis.md](gap-analysis.md) - Implementation status and gaps
