# Breeding Program Marketplace UI: Engineering Specification

**Document Version:** 1.0
**Date:** 2026-01-14
**Status:** Ready for Implementation
**Priority:** CRITICAL - Showstopper #2

---

## Executive Summary

BreederHQ has a **100% complete backend** for breeding program marketplace features, but **0% frontend UI**. The BreedingProgram model has:
- `programStory` (rich narrative) ✅ Backend exists
- `pricingTiers` (JSON array) ✅ Backend exists
- `media` (BreedingProgramMedia) ✅ Backend exists
- `openWaitlist`, `acceptInquiries`, `acceptReservations` flags ✅ Backend exists

**BUT NONE OF IT IS DISPLAYED TO USERS.**

**Scope:** Build professional breeding program showcase pages, media gallery, pricing display, waitlist forms, and inquiry forms.

**Timeline:** 3 weeks (2 weeks core features, 1 week polish)
**Investment:** $15-30K
**Success Criteria:** Breeders can professionally showcase programs, buyers can inquire/join waitlists

---

## Problem Statement

### Current State

**Backend (BreedingProgram Model):**
```prisma
model BreedingProgram {
  id                  Int      @id
  tenantId            Int
  slug                String   // URL-friendly
  name                String
  description         String?
  programStory        String?  @db.Text  // ← RICH NARRATIVE, NOT DISPLAYED
  species             Species
  breedText           String?

  // Marketplace settings
  listed              Boolean  @default(false)
  acceptInquiries     Boolean  @default(true)  // ← NOT USED IN UI
  openWaitlist        Boolean  @default(false)  // ← NOT USED IN UI
  acceptReservations  Boolean  @default(false)  // ← NOT USED IN UI
  comingSoon          Boolean  @default(false)

  // Pricing
  pricingTiers        Json?    // ← STRUCTURED TIERS, NOT DISPLAYED
  whatsIncluded       String?  @db.Text
  showWhatsIncluded   Boolean  @default(true)
  typicalWaitTime     String?
  showWaitTime        Boolean  @default(true)

  // Media
  coverImageUrl       String?
  showCoverImage      Boolean  @default(true)
  media               BreedingProgramMedia[]  // ← GALLERY EXISTS, NO UI

  publishedAt         DateTime?
}

model BreedingProgramMedia {
  id        Int     @id
  programId Int
  tenantId  Int
  assetUrl  String  // ← PHOTOS/VIDEOS EXIST, NO GALLERY UI
  caption   String?
  sortOrder Int
  isPublic  Boolean @default(true)
}
```

**API Endpoints (ALREADY EXIST):**
- ✅ `GET /breeding/programs` - List programs
- ✅ `GET /breeding/programs/:id` - Get single program (with media)
- ✅ `POST /breeding/programs` - Create program
- ✅ `PUT /breeding/programs/:id` - Update program
- ✅ `DELETE /breeding/programs/:id` - Delete program
- ✅ `GET /breeding/programs/:id/media` - Get media
- ✅ `POST /breeding/programs/:id/media` - Add media
- ✅ `PUT /breeding/programs/:programId/media/:mediaId` - Update media
- ✅ `DELETE /breeding/programs/:programId/media/:mediaId` - Delete media
- ✅ `POST /breeding/programs/:id/media/reorder` - Reorder media

**Frontend (MISSING EVERYTHING):**
- ❌ No public breeding program pages
- ❌ No programStory display
- ❌ No media gallery viewer
- ❌ No pricing tier display
- ❌ No waitlist signup forms
- ❌ No inquiry/contact forms
- ❌ No breeder profile pages

**Result:** Breeders can't showcase programs professionally. This is a showstopper for horse breeders who need marketplace presence.

---

## User Stories

### Breeder Perspective

**As a breeder, I want to:**
1. Create a professional breeding program page with my story, photos, videos, and pricing
2. Display my program on a public marketplace where buyers can find me
3. Accept inquiries from interested buyers through a contact form
4. Manage a waitlist for upcoming litters
5. Accept deposits/reservations online
6. Showcase past offspring and their success stories
7. Update my program information easily
8. Control what information is public vs private

### Buyer Perspective

**As a buyer, I want to:**
1. Browse breeding programs by breed, location, price
2. View detailed program pages with breeder story, facility photos, and past offspring
3. See pricing tiers (pet, breeding, show quality)
4. Understand what's included (health guarantee, training, vet check, etc.)
5. Join a waitlist for future litters
6. Contact the breeder with questions
7. See breeder reviews/ratings (future)
8. Save favorite programs

---

## Page Architecture

### 1. Public Breeding Program Page

**Route:** `/marketplace/programs/:slug` (public, no auth required)

**URL Examples:**
- `/marketplace/programs/champion-arabians`
- `/marketplace/programs/quarter-horse-performance`
- `/marketplace/programs/friesian-breeding-program`

**Components:**
1. **Hero Section** - Cover image, program name, breed, location
2. **Navigation Tabs** - Overview, Gallery, Pricing, Litters, Contact
3. **Overview Tab** - Program story, breeder info, what's included
4. **Gallery Tab** - Photos/videos of facility, horses, past offspring
5. **Pricing Tab** - Pricing tiers (pet, breeding, show)
6. **Litters Tab** - Available and upcoming litters
7. **Contact Tab** - Inquiry form, waitlist signup

---

### 2. Marketplace Index Page

**Route:** `/marketplace/programs` (public)

**Components:**
1. **Search Bar** - Search by breed, location, keywords
2. **Filters Sidebar** - Species, breed, price range, availability
3. **Sort Options** - Newest, popular, price, distance
4. **Program Cards Grid** - Card for each program with preview
5. **Pagination** - Load more / page numbers

---

### 3. Breeder Dashboard (Manage Programs)

**Route:** `/app/breeding/programs` (authenticated)

**Components:**
1. **Programs List** - All breeder's programs
2. **Create New Program Button**
3. **Program Stats** - Views, inquiries, waitlist count
4. **Quick Actions** - Edit, publish/unpublish, delete

---

### 4. Program Editor

**Route:** `/app/breeding/programs/:id/edit` (authenticated)

**Components:**
1. **Basic Info Form** - Name, breed, description
2. **Program Story Editor** - Rich text editor for narrative
3. **Media Manager** - Upload/organize photos/videos, reorder gallery
4. **Pricing Editor** - Add/edit pricing tiers
5. **Settings** - Listed, accept inquiries, open waitlist, reservations
6. **Preview Button** - See public page preview

---

## Database Schema (Already Complete)

### Existing Tables (No Changes Needed)

```prisma
// ✅ ALREADY EXISTS - NO MIGRATION REQUIRED
model BreedingProgram {
  // All fields already exist (see above)
}

model BreedingProgramMedia {
  // All fields already exist (see above)
}
```

### New Table: Program Inquiries

**Purpose:** Track buyer inquiries submitted through contact forms

```prisma
model ProgramInquiry {
  id          Int      @id @default(autoincrement())
  programId   Int
  program     BreedingProgram @relation(fields: [programId], references: [id], onDelete: Cascade)
  tenantId    Int      // Breeder's tenant
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Buyer information
  buyerName   String
  buyerEmail  String
  buyerPhone  String?

  // Inquiry details
  subject     String
  message     String   @db.Text

  // What they're interested in
  interestedIn String?  // "Next litter", "Specific horse", "General info"
  priceRange   String?  // "Under $5K", "$5K-$10K", "$10K+"
  timeline     String?  // "Immediate", "Next 3 months", "6+ months", "Just researching"

  // Internal tracking
  status      InquiryStatus  @default(NEW)
  assignedToUserId String?
  assignedToUser   User?  @relation(fields: [assignedToUserId], references: [id], onDelete: SetNull)

  // Communication
  responded   Boolean  @default(false)
  respondedAt DateTime?
  notes       String?  @db.Text

  // Marketing tracking
  source      String?  // "Marketplace", "Google", "Facebook", "Referral"
  utmSource   String?
  utmMedium   String?
  utmCampaign String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([programId, status])
  @@index([tenantId, status])
  @@index([buyerEmail])
  @@index([createdAt])
  @@schema("public")
}

enum InquiryStatus {
  NEW
  CONTACTED
  QUALIFIED
  SCHEDULED_VISIT
  CONVERTED
  NOT_INTERESTED
  SPAM
  @@schema("public")
}
```

### New Table: Waitlist Entries (Enhance Existing)

**NOTE:** WaitlistEntry table already exists, may need enhancements

```prisma
// ✅ ALREADY EXISTS - May need additional fields
model WaitlistEntry {
  id            Int      @id @default(autoincrement())
  tenantId      Int
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  programId     Int?
  program       BreedingProgram?  @relation(fields: [programId], references: [id], onDelete: SetNull)

  planId        Int?
  plan          BreedingPlan?  @relation(fields: [planId], references: [id], onDelete: SetNull)

  // Contact info
  contactName   String
  contactEmail  String
  contactPhone  String?

  // Interest details
  preferredSex  Sex?
  colorPreference String?
  notes         String?  @db.Text

  // Status
  status        WaitlistStatus
  priority      Int?     // Higher = top of list

  // Deposit
  depositAmountCents Int?
  depositPaidAt DateTime?

  // Position tracking
  position      Int?     // Position in waitlist
  addedAt       DateTime @default(now())

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([programId, status])
  @@index([tenantId])
  @@schema("public")
}
```

---

## API Endpoints (New)

### 1. Public Program Endpoints

#### Get Public Program by Slug
**Endpoint:** `GET /api/public/programs/:slug`

**Response:**
```typescript
{
  id: 123,
  slug: "champion-arabians",
  name: "Champion Arabians Breeding Program",
  description: "Premier Arabian horse breeding in California",
  programStory: "<p>For over 20 years, we've been dedicated to breeding champion Arabian horses...</p>",
  species: "HORSE",
  breedText: "Arabian",
  coverImageUrl: "https://...",
  showCoverImage: true,

  listed: true,
  acceptInquiries: true,
  openWaitlist: true,
  acceptReservations: false,
  comingSoon: false,

  pricingTiers: [
    {
      tier: "Pet Quality",
      priceRange: "$5,000 - $8,000",
      description: "Beautiful companion horses, not for breeding"
    },
    {
      tier: "Breeding Quality",
      priceRange: "$10,000 - $20,000",
      description: "Show-quality bloodlines, breeding rights included"
    },
    {
      tier: "Show Quality",
      priceRange: "$25,000+",
      description: "Top-tier show prospects with championship bloodlines"
    }
  ],

  whatsIncluded: "All horses come with health guarantee, current vaccinations, vet check, 30-day health insurance, and lifetime breeder support.",
  showWhatsIncluded: true,

  typicalWaitTime: "6-12 months",
  showWaitTime: true,

  media: [
    {
      id: 1,
      assetUrl: "https://...",
      caption: "Our breeding facility in Northern California",
      sortOrder: 0,
      isPublic: true
    },
    {
      id: 2,
      assetUrl: "https://...",
      caption: "2024 National Champion - sired by our stallion",
      sortOrder: 1,
      isPublic: true
    }
  ],

  breeder: {
    name: "Jane Smith",
    location: "Northern California",
    yearsExperience: 20,
    profileImageUrl: "https://..."
  },

  stats: {
    activeBreedingPlans: 3,
    upcomingLitters: 2,
    availableLitters: 1,
    totalAvailable: 4
  },

  publishedAt: "2025-01-01T00:00:00Z",
  createdAt: "2024-01-01T00:00:00Z"
}
```

---

#### List Public Programs (Marketplace)
**Endpoint:** `GET /api/public/programs`

**Query Parameters:**
- `species` - Filter by species (HORSE, DOG, CAT, etc.)
- `breed` - Filter by breed text (substring match)
- `search` - Search query (name, description, breed)
- `priceMin` - Min price (parsed from pricingTiers)
- `priceMax` - Max price
- `listed` - Only listed programs (default: true)
- `hasAvailable` - Only programs with available offspring
- `sort` - Sort by (newest, popular, price, name)
- `page` - Page number
- `limit` - Results per page

**Response:**
```typescript
{
  items: [
    {
      id: 123,
      slug: "champion-arabians",
      name: "Champion Arabians Breeding Program",
      description: "Premier Arabian horse breeding in California",
      species: "HORSE",
      breedText: "Arabian",
      coverImageUrl: "https://...",
      pricingTiers: [...],
      breeder: {
        name: "Jane Smith",
        location: "Northern California"
      },
      stats: {
        upcomingLitters: 2,
        availableLitters: 1,
        totalAvailable: 4
      },
      publishedAt: "2025-01-01T00:00:00Z"
    }
  ],
  total: 45,
  page: 1,
  limit: 25
}
```

---

#### Submit Inquiry
**Endpoint:** `POST /api/public/programs/:slug/inquiries`

**Request Body:**
```typescript
{
  buyerName: "John Doe",
  buyerEmail: "john@example.com",
  buyerPhone: "+1234567890",
  subject: "Interested in upcoming Arabian litters",
  message: "Hi, I'm looking for a breeding-quality Arabian mare. Do you have any expected foals in the next 6 months?",
  interestedIn: "Next litter",
  priceRange: "$10K-$20K",
  timeline: "Next 3 months",
  source: "Marketplace",
  utmSource: "google",
  utmMedium: "cpc",
  utmCampaign: "horse-breeding-2026"
}
```

**Response:**
```typescript
{
  id: 456,
  status: "NEW",
  message: "Thank you for your inquiry! We'll respond within 24 hours.",
  createdAt: "2026-01-14T10:30:00Z"
}
```

---

#### Join Waitlist
**Endpoint:** `POST /api/public/programs/:slug/waitlist`

**Request Body:**
```typescript
{
  contactName: "John Doe",
  contactEmail: "john@example.com",
  contactPhone: "+1234567890",
  preferredSex: "FEMALE",
  colorPreference: "Bay or Black",
  notes: "Looking for a breeding-quality mare, flexible on timing"
}
```

**Response:**
```typescript
{
  id: 789,
  position: 5,
  status: "INQUIRY",
  message: "You've been added to the waitlist! You're #5 in line.",
  createdAt: "2026-01-14T10:30:00Z"
}
```

---

### 2. Breeder Management Endpoints

#### Get Program Analytics
**Endpoint:** `GET /api/breeding/programs/:id/analytics`

**Response:**
```typescript
{
  programId: 123,
  views: {
    total: 1250,
    last7Days: 85,
    last30Days: 320
  },
  inquiries: {
    total: 45,
    new: 5,
    contacted: 10,
    qualified: 15,
    converted: 8,
    conversionRate: 0.178
  },
  waitlist: {
    total: 12,
    active: 10,
    depositPaid: 3
  },
  traffic: {
    sources: [
      { source: "Google", visits: 450 },
      { source: "Facebook", visits: 320 },
      { source: "Direct", visits: 280 },
      { source: "Referral", visits: 200 }
    ]
  }
}
```

---

#### Get Inquiries for Program
**Endpoint:** `GET /api/breeding/programs/:id/inquiries`

**Query Parameters:**
- `status` - Filter by status (NEW, CONTACTED, etc.)
- `page`, `limit` - Pagination

**Response:**
```typescript
{
  items: [
    {
      id: 456,
      buyerName: "John Doe",
      buyerEmail: "john@example.com",
      buyerPhone: "+1234567890",
      subject: "Interested in upcoming Arabian litters",
      message: "Hi, I'm looking for...",
      interestedIn: "Next litter",
      priceRange: "$10K-$20K",
      timeline: "Next 3 months",
      status: "NEW",
      responded: false,
      source: "Marketplace",
      createdAt: "2026-01-14T10:30:00Z"
    }
  ],
  total: 45,
  page: 1,
  limit: 25
}
```

---

#### Update Inquiry Status
**Endpoint:** `PUT /api/breeding/programs/:programId/inquiries/:inquiryId`

**Request Body:**
```typescript
{
  status: "CONTACTED",
  responded: true,
  notes: "Called buyer, scheduled farm visit for next Saturday"
}
```

---

#### Get Waitlist for Program
**Endpoint:** `GET /api/breeding/programs/:id/waitlist`

**Response:**
```typescript
{
  items: [
    {
      id: 789,
      contactName: "John Doe",
      contactEmail: "john@example.com",
      contactPhone: "+1234567890",
      preferredSex: "FEMALE",
      colorPreference: "Bay or Black",
      notes: "Looking for breeding-quality mare",
      status: "INQUIRY",
      position: 5,
      priority: null,
      depositAmountCents: null,
      depositPaidAt: null,
      addedAt: "2026-01-14T10:30:00Z"
    }
  ],
  total: 12
}
```

---

#### Reorder Waitlist
**Endpoint:** `POST /api/breeding/programs/:id/waitlist/reorder`

**Request Body:**
```typescript
{
  order: [789, 456, 123, 234, 345]  // Array of waitlist entry IDs in desired order
}
```

---

## Frontend Components

### 1. Public Program Page

**Component:** `PublicProgramPage.tsx`

**Route:** `/marketplace/programs/:slug`

**Features:**
- Fetch program data by slug
- Display hero section with cover image
- Tab navigation (Overview, Gallery, Pricing, Litters, Contact)
- Responsive design (mobile-friendly)
- SEO optimization (meta tags, structured data)

**Code Structure:**
```typescript
// pages/PublicProgramPage.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProgramHero } from '../components/ProgramHero';
import { ProgramNav } from '../components/ProgramNav';
import { ProgramOverview } from '../components/ProgramOverview';
import { ProgramGallery } from '../components/ProgramGallery';
import { ProgramPricing } from '../components/ProgramPricing';
import { ProgramLitters } from '../components/ProgramLitters';
import { ProgramContact } from '../components/ProgramContact';

export function PublicProgramPage() {
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: program, isLoading } = useQuery({
    queryKey: ['public-program', slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/programs/${slug}`);
      if (!res.ok) throw new Error('Program not found');
      return res.json();
    },
  });

  if (isLoading) return <ProgramPageSkeleton />;
  if (!program) return <ProgramNotFound />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <ProgramHero program={program} />

      {/* Tab Navigation */}
      <ProgramNav
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={['overview', 'gallery', 'pricing', 'litters', 'contact']}
      />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <ProgramOverview program={program} />}
        {activeTab === 'gallery' && <ProgramGallery media={program.media} />}
        {activeTab === 'pricing' && <ProgramPricing pricing={program.pricingTiers} whatsIncluded={program.whatsIncluded} />}
        {activeTab === 'litters' && <ProgramLitters programId={program.id} />}
        {activeTab === 'contact' && <ProgramContact program={program} />}
      </div>

      {/* SEO */}
      <Helmet>
        <title>{program.name} | BreederHQ</title>
        <meta name="description" content={program.description} />
        <meta property="og:title" content={program.name} />
        <meta property="og:description" content={program.description} />
        <meta property="og:image" content={program.coverImageUrl} />
      </Helmet>
    </div>
  );
}
```

---

### 2. Program Hero Section

**Component:** `ProgramHero.tsx`

**Features:**
- Full-width cover image
- Program name, breed, location overlay
- CTA buttons (Contact, Join Waitlist)
- Breadcrumb navigation

```typescript
// components/ProgramHero.tsx
interface ProgramHeroProps {
  program: {
    name: string;
    breedText: string;
    coverImageUrl: string;
    showCoverImage: boolean;
    breeder: {
      name: string;
      location: string;
    };
    acceptInquiries: boolean;
    openWaitlist: boolean;
  };
}

export function ProgramHero({ program }: ProgramHeroProps) {
  const showImage = program.showCoverImage && program.coverImageUrl;

  return (
    <div className="relative h-96 bg-gray-800">
      {/* Cover Image */}
      {showImage && (
        <img
          src={program.coverImageUrl}
          alt={program.name}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
      )}

      {/* Overlay Content */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
        <div className="max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-12">
          {/* Breadcrumb */}
          <nav className="text-white/80 text-sm mb-4">
            <Link to="/marketplace" className="hover:text-white">Marketplace</Link>
            <span className="mx-2">/</span>
            <Link to="/marketplace/programs" className="hover:text-white">Programs</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{program.name}</span>
          </nav>

          {/* Program Info */}
          <h1 className="text-4xl font-bold text-white mb-2">
            {program.name}
          </h1>
          <p className="text-xl text-white/90 mb-4">
            {program.breedText} • {program.breeder.location}
          </p>

          {/* Breeder */}
          <p className="text-white/80 mb-6">
            By {program.breeder.name}
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4">
            {program.acceptInquiries && (
              <button
                onClick={() => {
                  // Scroll to contact tab
                  setActiveTab('contact');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Contact Breeder
              </button>
            )}

            {program.openWaitlist && (
              <button
                onClick={() => {
                  // Open waitlist modal
                  setShowWaitlistModal(true);
                }}
                className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Join Waitlist
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 3. Program Overview Tab

**Component:** `ProgramOverview.tsx`

**Features:**
- Display programStory (rich text)
- Show breeder info
- Display "What's Included"
- Show typical wait time
- Quick stats (active plans, available litters)

```typescript
// components/ProgramOverview.tsx
interface ProgramOverviewProps {
  program: {
    programStory: string;
    whatsIncluded: string;
    showWhatsIncluded: boolean;
    typicalWaitTime: string;
    showWaitTime: boolean;
    breeder: {
      name: string;
      location: string;
      yearsExperience: number;
      profileImageUrl: string;
    };
    stats: {
      activeBreedingPlans: number;
      upcomingLitters: number;
      availableLitters: number;
      totalAvailable: number;
    };
  };
}

export function ProgramOverview({ program }: ProgramOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Program Story */}
        {program.programStory && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Story</h2>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: program.programStory }}
            />
          </section>
        )}

        {/* What's Included */}
        {program.showWhatsIncluded && program.whatsIncluded && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">What's Included</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-800">{program.whatsIncluded}</p>
            </div>
          </section>
        )}

        {/* Typical Wait Time */}
        {program.showWaitTime && program.typicalWaitTime && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Typical Wait Time</h2>
            <p className="text-lg text-gray-700">{program.typicalWaitTime}</p>
          </section>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        {/* Breeder Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">About the Breeder</h3>

          {program.breeder.profileImageUrl && (
            <img
              src={program.breeder.profileImageUrl}
              alt={program.breeder.name}
              className="w-24 h-24 rounded-full mx-auto mb-4"
            />
          )}

          <p className="font-semibold text-center mb-2">{program.breeder.name}</p>
          <p className="text-gray-600 text-center mb-2">{program.breeder.location}</p>
          <p className="text-gray-600 text-center mb-4">
            {program.breeder.yearsExperience} years experience
          </p>

          <button className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition">
            View Profile
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Program Stats</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Breeding Plans</span>
              <span className="font-semibold">{program.stats.activeBreedingPlans}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Upcoming Litters</span>
              <span className="font-semibold">{program.stats.upcomingLitters}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Now</span>
              <span className="font-semibold text-green-600">{program.stats.totalAvailable}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 4. Media Gallery

**Component:** `ProgramGallery.tsx`

**Features:**
- Grid layout for photos/videos
- Lightbox viewer on click
- Captions display
- Video player support
- Responsive masonry grid

```typescript
// components/ProgramGallery.tsx
import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Video from 'yet-another-react-lightbox/plugins/video';

interface ProgramGalleryProps {
  media: Array<{
    id: number;
    assetUrl: string;
    caption: string | null;
    sortOrder: number;
  }>;
}

export function ProgramGallery({ media }: ProgramGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i);
  };

  const slides = media.map((item) => ({
    src: item.assetUrl,
    type: isVideo(item.assetUrl) ? 'video' : 'image',
    title: item.caption || undefined,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Gallery</h2>

      {/* Masonry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item, index) => (
          <div
            key={item.id}
            className="relative cursor-pointer group overflow-hidden rounded-lg"
            onClick={() => setLightboxIndex(index)}
          >
            {isVideo(item.assetUrl) ? (
              <video
                src={item.assetUrl}
                className="w-full h-64 object-cover"
                muted
              />
            ) : (
              <img
                src={item.assetUrl}
                alt={item.caption || ''}
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}

            {/* Caption Overlay */}
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm">{item.caption}</p>
              </div>
            )}

            {/* Video Icon */}
            {isVideo(item.assetUrl) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                  <PlayIcon className="w-8 h-8 text-gray-800" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Video]}
      />
    </div>
  );
}
```

---

### 5. Pricing Tiers Display

**Component:** `ProgramPricing.tsx`

**Features:**
- Display pricing tiers (pet, breeding, show)
- Price range per tier
- Tier descriptions
- What's included section
- Contact button per tier

```typescript
// components/ProgramPricing.tsx
interface ProgramPricingProps {
  pricing: Array<{
    tier: string;
    priceRange: string;
    description: string;
  }>;
  whatsIncluded: string;
}

export function ProgramPricing({ pricing, whatsIncluded }: ProgramPricingProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pricing</h2>

      {/* Pricing Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {pricing.map((tier, index) => (
          <div
            key={index}
            className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition"
          >
            <h3 className="text-xl font-bold mb-2">{tier.tier}</h3>
            <p className="text-3xl font-bold text-blue-600 mb-4">{tier.priceRange}</p>
            <p className="text-gray-600 mb-6">{tier.description}</p>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Inquire About {tier.tier}
            </button>
          </div>
        ))}
      </div>

      {/* What's Included */}
      {whatsIncluded && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">What's Included</h3>
          <p className="text-gray-700">{whatsIncluded}</p>
        </div>
      )}
    </div>
  );
}
```

---

### 6. Contact Form

**Component:** `ProgramContact.tsx`

**Features:**
- Inquiry form (name, email, phone, message)
- Additional fields (interested in, price range, timeline)
- Form validation
- Success/error messages
- Anti-spam (honeypot, rate limiting)

```typescript
// components/ProgramContact.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const inquirySchema = z.object({
  buyerName: z.string().min(2, 'Name is required'),
  buyerEmail: z.string().email('Valid email is required'),
  buyerPhone: z.string().optional(),
  subject: z.string().min(5, 'Subject is required'),
  message: z.string().min(20, 'Please provide more details (at least 20 characters)'),
  interestedIn: z.string().optional(),
  priceRange: z.string().optional(),
  timeline: z.string().optional(),
});

type InquiryForm = z.infer<typeof inquirySchema>;

interface ProgramContactProps {
  program: {
    id: number;
    slug: string;
    name: string;
    acceptInquiries: boolean;
    openWaitlist: boolean;
  };
}

export function ProgramContact({ program }: ProgramContactProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
  });

  const submitInquiry = useMutation({
    mutationFn: async (data: InquiryForm) => {
      const res = await fetch(`/api/public/programs/${program.slug}/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: 'Marketplace',
        }),
      });
      if (!res.ok) throw new Error('Failed to submit inquiry');
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      reset();
    },
  });

  if (!program.acceptInquiries) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">
          This breeder is not currently accepting inquiries. Please check back later or join the waitlist.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-green-900 mb-2">Thank You!</h3>
        <p className="text-green-800">
          Your inquiry has been sent to {program.name}. They'll respond within 24-48 hours.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-green-700 underline"
        >
          Send Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Contact {program.name}</h2>

      <form onSubmit={handleSubmit((data) => submitInquiry.mutate(data))} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Name *</label>
          <input
            {...register('buyerName')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
          {errors.buyerName && (
            <p className="text-red-600 text-sm mt-1">{errors.buyerName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email Address *</label>
          <input
            {...register('buyerEmail')}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="john@example.com"
          />
          {errors.buyerEmail && (
            <p className="text-red-600 text-sm mt-1">{errors.buyerEmail.message}</p>
          )}
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number (Optional)</label>
          <input
            {...register('buyerPhone')}
            type="tel"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+1 (234) 567-8900"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-2">Subject *</label>
          <input
            {...register('subject')}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Interested in upcoming litters"
          />
          {errors.subject && (
            <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>
          )}
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-2">Message *</label>
          <textarea
            {...register('message')}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us what you're looking for..."
          />
          {errors.message && (
            <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
          )}
        </div>

        {/* Additional Info (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Interested In</label>
            <select
              {...register('interestedIn')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="Next litter">Next Litter</option>
              <option value="Specific horse">Specific Horse</option>
              <option value="General info">General Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <select
              {...register('priceRange')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="Under $5K">Under $5K</option>
              <option value="$5K-$10K">$5K-$10K</option>
              <option value="$10K-$20K">$10K-$20K</option>
              <option value="$20K+">$20K+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Timeline</label>
            <select
              {...register('timeline')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="Immediate">Immediate</option>
              <option value="Next 3 months">Next 3 Months</option>
              <option value="6+ months">6+ Months</option>
              <option value="Just researching">Just Researching</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitInquiry.isPending}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {submitInquiry.isPending ? 'Sending...' : 'Send Inquiry'}
        </button>

        {/* Error */}
        {submitInquiry.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Failed to send inquiry. Please try again or contact us directly.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
- [ ] Pricing tier display logic
- [ ] Form validation (inquiry form, waitlist form)
- [ ] Media gallery filtering (photos vs videos)
- [ ] Inquiry status updates

### Integration Tests
- [ ] Submit inquiry → verify database record
- [ ] Join waitlist → verify position assignment
- [ ] Reorder waitlist → verify new positions
- [ ] Program analytics calculation

### E2E Tests
- [ ] Browse marketplace → view program → submit inquiry
- [ ] Browse marketplace → view program → join waitlist
- [ ] Breeder dashboard → manage inquiries → respond
- [ ] Breeder dashboard → manage waitlist → reorder entries
- [ ] Mobile responsive testing

---

## Implementation Checklist

### Week 1: Core Public Pages (5 days)

**Day 1: Public API Endpoints**
- [ ] GET /api/public/programs/:slug
- [ ] GET /api/public/programs (marketplace index)
- [ ] POST /api/public/programs/:slug/inquiries
- [ ] POST /api/public/programs/:slug/waitlist

**Day 2: Public Program Page**
- [ ] PublicProgramPage route
- [ ] ProgramHero component
- [ ] ProgramNav component (tabs)
- [ ] ProgramOverview component

**Day 3: Media Gallery**
- [ ] ProgramGallery component
- [ ] Lightbox integration
- [ ] Video player support
- [ ] Responsive masonry grid

**Day 4: Pricing & Contact**
- [ ] ProgramPricing component
- [ ] ProgramContact component (inquiry form)
- [ ] Form validation
- [ ] Success/error handling

**Day 5: Marketplace Index**
- [ ] MarketplaceIndexPage route
- [ ] Program cards grid
- [ ] Search/filter UI
- [ ] Pagination

---

### Week 2: Breeder Management (5 days)

**Day 6: Inquiry Management API**
- [ ] GET /api/breeding/programs/:id/inquiries
- [ ] PUT /api/breeding/programs/:programId/inquiries/:inquiryId
- [ ] GET /api/breeding/programs/:id/analytics

**Day 7: Inquiry Management UI**
- [ ] InquiriesPage route
- [ ] Inquiry list component
- [ ] Inquiry detail modal
- [ ] Status update UI

**Day 8: Waitlist Management API**
- [ ] GET /api/breeding/programs/:id/waitlist
- [ ] POST /api/breeding/programs/:id/waitlist/reorder
- [ ] PUT /api/breeding/programs/:programId/waitlist/:entryId

**Day 9: Waitlist Management UI**
- [ ] WaitlistPage route
- [ ] Waitlist list component
- [ ] Drag-and-drop reordering
- [ ] Waitlist entry detail modal

**Day 10: Analytics Dashboard**
- [ ] ProgramAnalyticsPage route
- [ ] Views chart component
- [ ] Inquiries funnel chart
- [ ] Traffic sources chart

---

### Week 3: Polish & Testing (5 days)

**Day 11: Program Editor Enhancements**
- [ ] Rich text editor for programStory (TipTap/Quill)
- [ ] Media upload improvements
- [ ] Pricing tier editor

**Day 12: SEO & Performance**
- [ ] Meta tags for all public pages
- [ ] Structured data (JSON-LD)
- [ ] Image optimization
- [ ] Lazy loading

**Day 13: Mobile Optimization**
- [ ] Responsive design testing
- [ ] Touch-friendly UI
- [ ] Mobile gallery improvements

**Day 14: Testing**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Bug fixes

**Day 15: Documentation & Deploy**
- [ ] Update documentation
- [ ] Create demo programs
- [ ] Deploy to staging
- [ ] QA testing

---

## Success Criteria

### Functional Requirements
- ✅ Breeders can create breeding program pages with story, photos, pricing
- ✅ Public program pages display all information correctly
- ✅ Media gallery displays photos/videos with lightbox
- ✅ Pricing tiers display clearly
- ✅ Buyers can submit inquiries via contact form
- ✅ Buyers can join waitlist
- ✅ Breeders can manage inquiries (view, respond, update status)
- ✅ Breeders can manage waitlist (view, reorder entries)
- ✅ Marketplace index shows all listed programs
- ✅ Search/filter works correctly

### Non-Functional Requirements
- ✅ Public pages load in < 1 second
- ✅ Mobile-responsive (works on phones/tablets)
- ✅ SEO optimized (meta tags, structured data)
- ✅ Accessible (WCAG 2.1 AA compliance)
- ✅ Inquiry form has anti-spam protection

### User Experience
- ✅ Breeders can showcase programs professionally
- ✅ Buyers can easily find and contact breeders
- ✅ Forms are easy to fill out (clear labels, validation)
- ✅ Gallery is visually appealing
- ✅ Mobile experience is smooth

---

## Post-Launch Enhancements (Phase 2)

### Advanced Features (Months 3-4)
- **Breeder reviews/ratings:** Buyers can leave reviews
- **Saved searches:** Buyers can save favorite programs
- **Featured listings:** Premium placement for breeders
- **Email campaigns:** Automated follow-ups to inquiries
- **SMS notifications:** Notify buyers when new litters available

### Analytics Improvements (Months 5-6)
- **Conversion tracking:** Track inquiry → sale conversion
- **A/B testing:** Test different program page layouts
- **Heatmaps:** See where buyers click/scroll
- **Traffic attribution:** Understand where buyers come from

---

**Document Status:** Ready for implementation - 3 week sprint to fix Showstopper #2
