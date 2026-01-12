# Marketplace User Journeys - Complete Reference

This document provides exact step-by-step instructions for ALL marketplace-related activities.

---

# PART 1: MARKETPLACE USER (BUYER) ACTIONS

## Browsing & Discovery

### Browse Breeders
**Route:** `/breeders`
1. Click "Breeders" in nav OR click "Browse breeders" card on home
2. See grid of published breeders with: name, location, breed badges
3. Click any breeder card → goes to `/breeders/:tenantSlug`

### Browse Animals
**Route:** `/animals`
1. Click "Animals" in nav OR click "Browse animals" card on home
2. See two types of listings:
   - **Offspring Groups** - groups from breeding plans (tab: "Offspring Groups")
   - **Animal Listings** - individual asset animals for sale (tab: "Program Animals")
3. Use search box to filter by breed, name, or breeder
4. Click any card → goes to listing detail page

### Browse Breeding Programs
**Route:** `/breeding-programs`
1. Click "Breeders" in nav, or go directly to `/breeding-programs`
2. Use search box to filter by name/breed
3. Use species dropdown: All, Dogs, Cats, Horses, Goats, Sheep, Rabbits
4. See programs with badges: "Inquiries Open", "Waitlist Open", active plan count
5. Pagination: Previous/Next buttons at bottom

### Browse Services
**Route:** `/services`
1. Click "Services" in nav OR click "Browse services" card on home
2. Filter by type dropdown: Stud Service, Training, Veterinary, Photography, Grooming, Transport, Boarding, Product, Other
3. See listings with: title, description, provider name, location, price
4. Click card → view service details

---

## Viewing Details

### View Breeder Profile
**Route:** `/breeders/:tenantSlug`
1. From `/breeders`, click any breeder card
2. See full profile:
   - Business name and location
   - "Quick Responder" badge (if applicable)
   - Business hours (expandable dropdown)
   - Bio/about section
   - Social links: Website, Instagram, Facebook
   - Species and breed badges
   - **Standards & Credentials**: registrations, health practices, breeding practices, care practices
   - **Placement Policies**: application required, interview, contract, return policy, ongoing support
   - **Breeding Programs** - list of their programs with status badges
3. Click any program card → opens program details modal

### View Program Details (Modal)
1. From breeder profile, click a program card
2. Modal shows:
   - Program name, species, breed
   - Description
   - **Pricing tiers** (e.g., Pet: $2,000-$2,500, Show: $3,000-$4,000)
   - **What's included**
   - **Typical wait time**
   - Badges: "Accepting Inquiries", "Waitlist Open", "Accept Reservations"
3. Action buttons at bottom (if enabled):
   - **"Message Breeder"** → opens message form
   - **"Join Waitlist"** → opens waitlist request form

### View Offspring Group Listing
**Route:** `/programs/:programSlug/offspring-groups/:listingSlug`
1. From `/animals` (Offspring Groups tab), click a card
2. See listing details:
   - Title, species, breed (from dam/sire)
   - Birth date (expected or actual)
   - Cover image
   - Description
   - **Price** (from default or individual offspring prices)
   - **Parent info**: Dam name/photo, Sire name/photo
   - **Individual offspring** cards showing: name, sex, collar color, status (Available/Reserved/Placed), individual price
3. Message form at bottom to contact breeder

### View Animal Listing (Asset Animal)
**Route:** `/programs/:programSlug/animals/:urlSlug`
1. From `/animals` (Program Animals tab), click a card
2. See listing details:
   - Title/headline
   - Animal name, species, sex, breed, birth date
   - Photo
   - **Intent**: FOR_SALE, STUD_SERVICE, GUARDIAN_HOME, COOWN, FOSTER, RETIRED, TRAINING_PROSPECT
   - **Price**: Fixed, Range (min-max), or "Contact for pricing"
   - Description/summary
   - Location (city, region, country)
   - Registry IDs
   - Visible traits
3. Message form at bottom

---

## Communication

### Send Inquiry Message
**Option A - From Program Modal:**
1. Open program details modal on breeder profile
2. Click "Message Breeder"
3. Type message in text area
4. Click "Send"
5. Redirected to `/inquiries` with new conversation

**Option B - From Listing Page:**
1. Go to offspring group or animal listing detail page
2. Scroll to "Message [Breeder Name]" section
3. Type message
4. Click "Send message"
5. Origin tracking captured: source, referrer, UTM params, page path

### View Conversations
**Route:** `/inquiries`
1. Click "Inquiries" in nav
2. "Messages" tab (default) shows conversation list on left
3. Click any conversation → see thread on right
4. Type reply in input box at bottom
5. Click "Send"

### Check for Updates/Notifications
**Route:** `/updates`
1. Check bell icon in header for unread count
2. Click bell OR go to `/updates`
3. See notification list: breeder replies, status changes
4. Click notification → go to that conversation
5. "Mark all as read" button to clear

---

## Waitlist & Deposits

### Join a Waitlist
1. Go to breeder profile (`/breeders/:tenantSlug`)
2. Click program with "Waitlist Open" badge
3. In modal, click "Join Waitlist"
4. Fill form:
   - **Name** (required)
   - **Email** (required)
   - **Phone** (optional)
   - **Message/preferences** (optional)
5. Click "Submit Request"
6. See success message
7. Request appears in `/inquiries` → "Waitlist Requests" tab

### Check Waitlist Request Status
**Route:** `/inquiries` → "Waitlist Requests" tab
1. Go to `/inquiries`
2. Click "Waitlist Requests" tab
3. See requests grouped by status:
   - **PENDING** - "Your request is being reviewed"
   - **APPROVED** - "Congratulations! You've been approved" + deposit info if required
   - **DECLINED** - "Unfortunately, your request was declined" + reason

### Pay a Deposit
1. Go to `/inquiries` → "Waitlist Requests" tab
2. Find APPROVED request with "Deposit Required"
3. See: amount, due date, payment status (Awaiting Payment, Partial, Paid, Overdue)
4. Click "Pay Now"
5. Redirected to Stripe Checkout
6. Enter payment info, complete payment
7. Returned to marketplace
8. Status updates to "Deposit Paid"

---

## Profile & Account

### Update My Profile
**Route:** (via settings modal)
1. Click gear icon in header
2. Settings modal opens
3. Edit: First Name, Last Name, Phone
4. Changes auto-save (or click Save)
5. API: `PATCH /api/v1/marketplace/profile`

### Log Out
1. Click gear icon in header
2. Click "Logout" at bottom
3. Session cleared, page refreshes

---

# PART 2: BREEDER ACTIONS

## Business Profile Management

### View/Edit Draft Profile
**Route:** Portal → Platform Settings → Marketplace
**API:** `GET /api/v1/marketplace/profile`
1. Log into BreederHQ Portal
2. Go to Platform Settings → Marketplace
3. Edit draft fields:
   - **Business name**
   - **Bio/description**
   - **Logo** (asset upload)
   - **Location**: city, state, zip, country
   - **Public location mode**: "full" (city, state, zip), "city_state" (city, state only), "state_only", "hidden"
   - **Website URL**
   - **Instagram handle**
   - **Facebook page**
   - **Business hours** (per day: enabled, open time, close time)
   - **Time zone**
4. API: `PUT /api/v1/marketplace/profile/draft` to save

### Publish Breeder Profile
**API:** `POST /api/v1/marketplace/profile/publish`
1. After editing draft, click "Publish"
2. Validation runs:
   - Business name required
   - At least 1 breed required
3. Street address fields automatically stripped for privacy
4. Tenant slug auto-generated from business name if missing
5. Profile now visible on `/breeders`

### Configure Standards & Credentials
In profile editor, configure:
- **Registrations**: AKC, UKC, CKC, TICA, CFA, etc.
- **Health Practices**: DNA testing, OFA certifications, annual exams, etc.
- **Breeding Practices**: champion lines, genetic diversity, etc.
- **Care Practices**: early socialization, crate training, etc.
- Optional notes for each section

### Configure Placement Policies
In profile editor, toggle:
- Application Required
- Interview Required
- Contract Required
- Has Return Policy
- Offers Ongoing Support
- Optional policy note

---

## Breeding Program Management

### List My Programs
**Route:** `/me/programs` (Marketplace) OR Portal
**API:** `GET /api/v1/breeding/programs`
1. In Marketplace: click "My Programs" in nav
2. See all programs with: name, species, breed, listed status, plan count
3. Icons: view/toggle visibility, edit

### Create Breeding Program
**Route:** `/me/programs`
**API:** `POST /api/v1/breeding/programs`
1. Click "Add Program"
2. Fill form:
   - **Name** (required) - e.g., "Labrador Retriever Program"
   - **Species** (required) - Dog, Cat, Horse, Goat, Sheep, Rabbit
   - **Breed text** - e.g., "Goldendoodle", "F1b Bernedoodle"
   - **Description** - philosophy, what makes it special
3. **Marketplace Settings:**
   - **List on Marketplace** - makes visible to buyers
   - **Accept Inquiries** - enables Message button
   - **Open Waitlist** - enables Join Waitlist button
   - **Accept Reservations** - for deposits on specific offspring
4. **Pricing Information:**
   - Add pricing tiers (e.g., Pet: $2,000-2,500, Show: $3,000-4,000)
   - Each tier: name, price range, description
   - **What's included** - vaccinations, microchip, health guarantee, etc.
   - **Typical wait time** - e.g., "3-6 months"
5. Click "Create Program"

### Edit Breeding Program
**API:** `PUT /api/v1/breeding/programs/:id`
1. Go to `/me/programs`
2. Click edit icon on program
3. Edit any fields
4. Click "Save Changes"
5. If name changes, slug auto-regenerates

### Publish/Unpublish Program
**API:** `PUT /api/v1/breeding/programs/:id` with `listed: true/false`
**To Publish:**
1. Edit program
2. Check "List on Marketplace"
3. Save → `publishedAt` timestamp set
4. Program now visible on `/breeding-programs`

**To Unpublish:**
1. Click visibility icon on program row
2. OR edit and uncheck "List on Marketplace"
3. Program hidden from marketplace

### Delete Breeding Program
**API:** `DELETE /api/v1/breeding/programs/:id`
1. Go to `/me/programs`
2. Click edit icon on program
3. Click "Delete Program" (bottom left)
4. Confirm in dialog
5. **Note:** Cannot delete if breeding plans are linked - must reassign/delete plans first

### Manage Program Media
**API:**
- `GET /api/v1/breeding/programs/:id/media` - list
- `POST /api/v1/breeding/programs/:id/media` - add
- `PUT /api/v1/breeding/programs/:id/media/:mediaId` - update
- `DELETE /api/v1/breeding/programs/:id/media/:mediaId` - delete
- `PUT /api/v1/breeding/programs/:id/media/reorder` - reorder

1. Edit program → Media tab
2. Add images/videos with: assetUrl, mediaType (IMAGE/VIDEO), alt text, caption
3. Drag to reorder
4. Click X to delete

---

## Offspring Group Management

### List Offspring Groups
**API:** `GET /api/v1/offspring`
1. Go to Portal → Breeding → Offspring Groups
2. See all groups with: title, species, birth date, offspring count, published status

### Create Offspring Group
**API:** `POST /api/v1/offspring`
1. Usually auto-created when breeding plan status → COMMITTED
2. OR create manually:
   - Select dam and sire
   - Set expected birth date
   - Link to breeding plan (optional)
   - Link to breeding program (optional)

### Edit Offspring Group Listing Fields
**API:** `PATCH /api/v1/offspring/:id`
1. Edit group
2. Set marketplace fields:
   - **listingTitle** - "What are we selling" heading
   - **listingDescription** - detailed info about this group
   - **listingSlug** - URL-friendly identifier (auto-generated or custom)
   - **marketplaceDefaultPriceCents** - default price for offspring
   - **coverImageUrl** - hero image for listing
3. Save

### Publish Offspring Group
**API:** `PATCH /api/v1/offspring/:id` with `published: true`
1. Edit group
2. Toggle "Published" ON
3. Ensure `listingSlug` is set
4. Group now visible on `/animals` (Offspring Groups tab)
5. Also visible on breeder's program page

### Unpublish Offspring Group
1. Edit group
2. Toggle "Published" OFF
3. Group hidden from marketplace

---

## Individual Offspring Management

### Create Individual Offspring
**API:** `POST /api/v1/offspring/individuals`
1. Go to offspring group detail
2. Click "Add Offspring"
3. Fill: name, sex, collar color (name + hex), coat description
4. Set pricing and intent

### Edit Individual Offspring
**API:** `PATCH /api/v1/offspring/individuals/:id`
1. Click on offspring card
2. Edit fields:
   - **name**
   - **sex** (MALE/FEMALE)
   - **collarColorName** / **collarColorHex**
   - **keeperIntent**: AVAILABLE, RESERVED, PLACED, KEEPER, DECEASED
   - **priceCents** - individual price (overrides group default)
   - **marketplaceListed** - show on marketplace
   - **marketplacePriceCents** - marketplace-specific price

### List/Unlist Individual Offspring on Marketplace
**API:** `PATCH /api/v1/offspring/individuals/:id`
1. Edit offspring
2. Toggle **marketplaceListed** ON/OFF
3. Only ALIVE offspring with marketplaceListed=true appear on marketplace
4. Can set individual **marketplacePriceCents** different from group default

### Delete Individual Offspring
**API:** `DELETE /api/v1/offspring/individuals/:id`
1. Click offspring card → Delete
2. Confirm

---

## Animal Public Listings (Asset Animals)

### Create Animal Listing
**API:** `PUT /api/v1/animals/:id/public-listing`
1. Go to Portal → Animals → select animal
2. Click "Create Listing" or "Public Listing" tab
3. Fill listing fields:
   - **intent**: FOR_SALE, STUD_SERVICE, GUARDIAN_HOME, COOWN, FOSTER, RETIRED, TRAINING_PROSPECT
   - **headline** - short attention-grabbing title
   - **summary** - brief description
   - **description** - full details (rich text)
   - **priceCents** - fixed price
   - **priceMinCents** / **priceMaxCents** - price range
   - **priceText** - custom price text (e.g., "Contact for pricing")
   - **priceModel**: FIXED, RANGE, INQUIRE
   - **locationCity** / **locationRegion** / **locationCountry**
4. Save (creates as DRAFT status)

### Edit Animal Listing
**API:** `PUT /api/v1/animals/:id/public-listing`
1. Go to animal → Public Listing tab
2. Edit any fields
3. Save

### Publish Animal Listing
**API:** `PATCH /api/v1/animals/:id/public-listing/status` with `status: "LIVE"`
1. Edit listing
2. Click "Publish" or change status dropdown to LIVE
3. `urlSlug` auto-generated if missing
4. Listing now visible on `/animals` (Program Animals tab)

### Unpublish Animal Listing
**API:** `PATCH /api/v1/animals/:id/public-listing/status` with `status: "PAUSED"` or `"DRAFT"`
1. Change status to PAUSED or DRAFT
2. Listing hidden from marketplace

### Delete Animal Listing
**API:** `DELETE /api/v1/animals/:id/public-listing`
1. Go to animal listing
2. Click "Delete Listing"
3. Confirm
4. Note: Does NOT delete the animal, just the public listing

---

## Service Listings (Breeder Services)

### List My Services
**Route:** `/me/services`
**API:** `GET /api/v1/services`
1. Click "My Services" in Marketplace nav
2. See all service listings with: type, title, location, price, status

### Create Service Listing
**Route:** `/me/services`
**API:** `POST /api/v1/services`
1. Click "Add Service"
2. Fill modal:
   - **Service Type**: STUD_SERVICE, TRAINING, GROOMING, TRANSPORT, BOARDING, OTHER_SERVICE
   - **Title** (required)
   - **Description**
   - **Location**: City, State
   - **Pricing**:
     - **priceType**: "fixed", "starting_at", "contact"
     - **priceCents** (if not contact)
   - **Contact Info**: contactName, contactEmail, contactPhone
   - **Images** (array of URLs)
   - **Video URL**
3. Click "Create Service"
4. Created in DRAFT status

### Edit Service Listing
**API:** `PUT /api/v1/services/:id`
1. Go to `/me/services`
2. Click edit icon on service
3. Edit fields in modal
4. Click "Save Changes"

### Publish Service Listing
**API:** `PUT /api/v1/services/:id` with `status: "ACTIVE"`
1. Edit service
2. Change status to ACTIVE (or click Publish button)
3. `slug` auto-generated
4. Service now visible on `/services`

### Unpublish Service Listing
**API:** `PUT /api/v1/services/:id` with `status: "DRAFT"` or `"PAUSED"`
1. Click visibility icon OR edit and change status
2. Service hidden from marketplace

### Delete Service Listing
**API:** `DELETE /api/v1/services/:id`
1. Click delete icon on service
2. Confirm deletion

---

## Communication & Inquiries

### View Incoming Inquiries
**Route:** Portal → Communications Hub
1. Log into Portal
2. Go to Communications (Communications Hub)
3. Smart folders:
   - **Inbox** - unread messages
   - **Sent** - outgoing messages
   - **Flagged** - starred messages
   - **Drafts** - unsent messages
   - **Archived** - completed conversations
   - **Email** - email channel messages
   - **Direct Messages** - DM channel messages
   - **Templates** - manage templates

### Respond to Inquiry
1. Click message thread in inbox
2. Read inquiry on right panel
3. Type reply in input box
4. Click "Send"

### Use Templates
1. Click template icon next to compose box
2. Select template from list
3. Template text inserted
4. Edit as needed
5. Send

### Flag/Archive Conversations
**Flag:**
1. Select thread
2. Click star icon
3. Appears in "Flagged" folder

**Archive:**
1. Select thread
2. Click archive icon (or press "e")
3. Moves to "Archived" folder

### View Contact Insights
1. Select message thread
2. Look at right sidebar panel
3. See:
   - Contact name, email, phone, location
   - Lead status (prospect/lead/customer/inactive)
   - Waitlist position and program
   - Active deposit status
   - Purchase history (total value)
   - Animals owned count
   - Last contacted date
   - Custom tags

---

## Waitlist Management

### View Waitlist Requests
**Route:** Portal → Waitlist Management
1. Go to Portal → Waitlist (or via Communications Hub)
2. See pending requests for each program

### Approve Waitlist Request
1. Find pending request
2. Click "Approve"
3. Optionally create deposit invoice:
   - Set amount (e.g., $500)
   - Set due date
4. Buyer notified with "Pay Now" option

### Decline Waitlist Request
1. Find pending request
2. Click "Decline"
3. Optionally enter reason (shown to buyer)
4. Buyer notified with explanation

### Create Deposit Invoice
**API:** `POST /api/v1/invoices`
1. When approving, check "Require Deposit"
2. Set amount and due date
3. Invoice created and linked to waitlist entry
4. Buyer sees "Pay Now" in their Inquiries

---

# PART 3: SERVICE PROVIDER ACTIONS

## Onboarding

### Create Provider Profile
**Route:** `/provider`
**API:** `POST /api/v1/marketplace/provider/profile`
1. Go to `/provider`
2. If no profile, see onboarding form
3. Fill:
   - **Business Name** (required)
   - **Email** (required)
   - **Phone** (optional)
   - **Website** (optional)
   - **City** (optional)
   - **State** (optional)
   - **Country** (default: US)
4. Click "Create Profile"
5. Profile created on FREE plan (1 listing)

---

## Dashboard

### View Dashboard
**Route:** `/provider` → Dashboard tab
**API:** `GET /api/v1/marketplace/provider/dashboard`
1. Go to `/provider`
2. See stats:
   - Total Listings
   - Active Listings
   - Total Views
   - Total Inquiries
3. See plan limits: current/max listings
4. Quick Actions: Add Listing, Manage Listings
5. Upgrade prompt if on FREE plan

---

## Listing Management

### List My Provider Listings
**Route:** `/provider` → Listings tab
**API:** `GET /api/v1/marketplace/provider/listings`
1. Click Listings tab
2. See all listings with: type badge, title, location, views, inquiries, status

### Create Provider Listing
**API:** `POST /api/v1/marketplace/provider/listings`
1. Click "+ Add Listing"
2. Fill modal:
   - **Service Type**: TRAINING, VETERINARY, PHOTOGRAPHY, GROOMING, TRANSPORT, BOARDING, PRODUCT, OTHER_SERVICE
   - **Title** (required)
   - **Description**
   - **City** / **State**
   - **Pricing**:
     - priceType: "contact", "fixed", "starting_at"
     - priceCents (if not contact)
3. Click "Create Listing"
4. Created in DRAFT status

### Publish Provider Listing
**API:** `POST /api/v1/marketplace/provider/listings/:id/publish`
1. Find listing with "draft" badge
2. Click "Publish"
3. Status → ACTIVE
4. Listing visible on `/services`

### Pause Provider Listing
**API:** `POST /api/v1/marketplace/provider/listings/:id/unpublish`
1. Find listing with "active" badge
2. Click "Pause"
3. Status → PAUSED
4. Hidden from marketplace

### Edit Provider Listing
**API:** `PUT /api/v1/marketplace/provider/listings/:id`
1. Click "Edit" on listing
2. Edit fields in modal
3. Click "Save Changes"

### Delete Provider Listing
**API:** `DELETE /api/v1/marketplace/provider/listings/:id`
1. Click "Delete" on listing
2. Click "Confirm"
3. Permanently deleted

---

## Billing & Upgrade

### Upgrade Plan
**API:** `POST /api/v1/marketplace/provider/checkout`
1. Go to `/provider` Dashboard
2. See upgrade section (if on FREE)
3. Options:
   - **Premium**: Up to 5 listings
   - **Business**: Up to 20 listings
4. Click "Upgrade to Premium" or "Upgrade to Business"
5. Redirected to Stripe Checkout
6. Complete payment
7. Returned to `/provider` with upgraded plan

### Manage Billing
**API:** `POST /api/v1/marketplace/provider/billing-portal`
1. Click "Manage Billing" in header
2. Redirected to Stripe Customer Portal
3. Can: update payment method, view invoices, cancel subscription

### View Provider Settings
**Route:** `/provider` → Settings tab
1. Click Settings tab
2. View profile info (read-only):
   - Business name, email, phone, website, location, plan

---

# PART 4: API ENDPOINT REFERENCE

## Public Marketplace Endpoints (Buyer)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/marketplace/me` | Current user info and entitlement status |
| PATCH | `/api/v1/marketplace/profile` | Update user profile (name, phone) |
| GET | `/api/v1/marketplace/programs` | Browse all programs (search, filter) |
| GET | `/api/v1/marketplace/programs/:slug` | Get program profile |
| GET | `/api/v1/marketplace/programs/:slug/offspring-groups` | List offspring groups for program |
| GET | `/api/v1/marketplace/programs/:slug/offspring-groups/:listing` | Offspring group detail |
| GET | `/api/v1/marketplace/programs/:slug/animals` | List animal listings for program |
| GET | `/api/v1/marketplace/programs/:slug/animals/:slug` | Animal listing detail |
| GET | `/api/v1/marketplace/programs/:slug/breeding-programs` | List breeding programs for breeder |
| GET | `/api/v1/marketplace/breeding-programs` | Browse all breeding programs |
| GET | `/api/v1/marketplace/offspring-groups` | Browse all offspring groups |
| GET | `/api/v1/marketplace/services` | Browse all services |
| GET | `/api/v1/marketplace/breeders` | List published breeders |
| GET | `/api/v1/marketplace/breeders/:slug` | Get breeder profile |
| POST | `/api/v1/marketplace/inquiries` | Send inquiry message |

## Breeder Profile Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/marketplace/profile` | Get draft + published profile |
| PUT | `/api/v1/marketplace/profile/draft` | Save draft profile |
| POST | `/api/v1/marketplace/profile/publish` | Publish profile |

## Breeding Program Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/breeding/programs` | List my programs |
| GET | `/api/v1/breeding/programs/:id` | Get program |
| POST | `/api/v1/breeding/programs` | Create program |
| PUT | `/api/v1/breeding/programs/:id` | Update program |
| DELETE | `/api/v1/breeding/programs/:id` | Delete program |
| GET | `/api/v1/breeding/programs/:id/media` | List program media |
| POST | `/api/v1/breeding/programs/:id/media` | Add media |
| PUT | `/api/v1/breeding/programs/:id/media/:mid` | Update media |
| DELETE | `/api/v1/breeding/programs/:id/media/:mid` | Delete media |
| PUT | `/api/v1/breeding/programs/:id/media/reorder` | Reorder media |

## Offspring Group Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/offspring` | List offspring groups |
| GET | `/api/v1/offspring/:id` | Get offspring group |
| POST | `/api/v1/offspring` | Create offspring group |
| PATCH | `/api/v1/offspring/:id` | Update offspring group |
| DELETE | `/api/v1/offspring/:id` | Delete offspring group |
| POST | `/api/v1/offspring/:id/archive` | Archive group |
| POST | `/api/v1/offspring/:id/restore` | Restore group |

## Individual Offspring Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/offspring/individuals` | List all individual offspring |
| GET | `/api/v1/offspring/individuals/:id` | Get individual |
| POST | `/api/v1/offspring/individuals` | Create individual |
| PATCH | `/api/v1/offspring/individuals/:id` | Update individual |
| DELETE | `/api/v1/offspring/individuals/:id` | Delete individual |

## Animal Public Listing Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/animals/:id/public-listing` | Get animal listing |
| PUT | `/api/v1/animals/:id/public-listing` | Create/update listing |
| PATCH | `/api/v1/animals/:id/public-listing/status` | Change status |
| DELETE | `/api/v1/animals/:id/public-listing` | Delete listing |

## Breeder Service Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/services` | List my services |
| GET | `/api/v1/services/:id` | Get service |
| POST | `/api/v1/services` | Create service |
| PUT | `/api/v1/services/:id` | Update service |
| DELETE | `/api/v1/services/:id` | Delete service |

## Service Provider Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/marketplace/provider/profile` | Get provider profile |
| POST | `/api/v1/marketplace/provider/profile` | Create provider profile |
| GET | `/api/v1/marketplace/provider/dashboard` | Get dashboard stats |
| GET | `/api/v1/marketplace/provider/listings` | List provider listings |
| POST | `/api/v1/marketplace/provider/listings` | Create listing |
| PUT | `/api/v1/marketplace/provider/listings/:id` | Update listing |
| DELETE | `/api/v1/marketplace/provider/listings/:id` | Delete listing |
| POST | `/api/v1/marketplace/provider/listings/:id/publish` | Publish listing |
| POST | `/api/v1/marketplace/provider/listings/:id/unpublish` | Unpublish listing |
| POST | `/api/v1/marketplace/provider/checkout` | Create Stripe checkout |
| POST | `/api/v1/marketplace/provider/billing-portal` | Open billing portal |

## Waitlist Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/marketplace/waitlist` | Submit waitlist request |
| GET | `/api/v1/marketplace/waitlist-requests` | Get user's requests |
| POST | `/api/v1/marketplace/invoices/:id/checkout` | Pay deposit |

---

# PART 5: URL ROUTING REFERENCE

## Marketplace App Routes
| URL | Description |
|-----|-------------|
| `/` | Home page (intent router) |
| `/animals` | Browse animals |
| `/breeders` | Browse breeders |
| `/breeders/:tenantSlug` | Breeder profile |
| `/breeding-programs` | Browse breeding programs |
| `/services` | Browse services |
| `/programs/:programSlug` | Program detail (breeder profile view) |
| `/programs/:programSlug/offspring-groups/:listingSlug` | Offspring group detail |
| `/programs/:programSlug/animals/:urlSlug` | Animal listing detail |
| `/inquiries` | Messages and waitlist requests |
| `/updates` | Notifications |
| `/me/programs` | Manage my breeding programs |
| `/me/services` | Manage my service listings |
| `/me/listing` | Preview my breeder listing |
| `/provider` | Service provider dashboard |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/terms` | Terms of service |
