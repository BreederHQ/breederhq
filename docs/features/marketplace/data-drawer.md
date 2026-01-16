# Data Drawer Feature

**Status:** ✅ Implemented (2026-01-16)
**Version:** V2 Marketplace
**Affected Apps:** `apps/marketplace`, `breederhq-api`

## Overview

The Data Drawer is a privacy-first customization system that allows breeders to select exactly which animal data appears in their marketplace listings. It provides granular control over data visibility while respecting the animal's privacy settings.

### Key Capabilities

- **Section-level enablement**: Toggle entire data categories (health, genetics, titles, etc.)
- **Item-level selection**: Choose specific tests, titles, media items within each category
- **Three-layer privacy filtering**: Privacy settings → per-item visibility → data drawer config
- **Live preview**: See exactly how data will appear to buyers before publishing
- **Template-agnostic**: Works with all listing types (Stud, Guardian, Trained, etc.)

---

## Architecture

### Privacy Enforcement Model

Data appears in a listing **ONLY IF** all three conditions are met:

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: Animal Privacy Settings                       │
│ ├─ Master toggle (allowCrossTenantMatching)            │
│ ├─ Section toggle (enableHealthSharing, showTitles)    │
│ └─ Per-item visibility (marketplaceVisible, isPublic)  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 2: Per-Item Visibility Flags                     │
│ ├─ AnimalTraitValue.marketplaceVisible (health)        │
│ ├─ AnimalTitle.isPublic (titles)                       │
│ └─ AnimalCompetitionResult.isPublic (competitions)     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ LAYER 3: Data Drawer Config (per listing)              │
│ ├─ Section enabled flag                                │
│ └─ Selected item IDs                                   │
└─────────────────────────────────────────────────────────┘
                         ↓
                  PUBLIC LISTING
```

### Data Structure

**Location:** `DirectAnimalListing.dataDrawerConfig` (JSON field)

```typescript
interface DataDrawerConfig {
  identity?: {
    enabled: boolean;
    showName?: boolean;
    showPhoto?: boolean;
    showDob?: boolean;
  };
  registry?: {
    enabled: boolean;
    registryIds?: number[]; // Specific registry IDs to show
  };
  health?: {
    enabled: boolean;
    traitIds?: number[]; // Specific trait IDs where marketplaceVisible=true
  };
  genetics?: {
    enabled: boolean;
    showBreedComposition?: boolean;
    showHealthGenetics?: boolean;
    showCoatColor?: boolean;
    traitIds?: number[];
  };
  media?: {
    enabled: boolean;
    mediaIds?: number[]; // Specific media IDs to include
  };
  achievements?: {
    enabled: boolean;
    titleIds?: number[];
    competitionIds?: number[];
  };
  lineage?: {
    enabled: boolean;
    showSire?: boolean;
    showDam?: boolean;
  };
  breeding?: {
    enabled: boolean;
    showOffspringCount?: boolean;
  };
  documents?: {
    enabled: boolean;
    documentIds?: number[];
  };
}
```

---

## API Endpoints

### 1. Get Animal Listing Data (Data Drawer Source)

**Endpoint:** `GET /api/v2/marketplace/animals/:id/listing-data`
**Authentication:** Required (tenant member)
**Purpose:** Fetch privacy-filtered animal data for the Data Drawer UI

**Implementation:** [marketplace-v2.ts:895-1321](../../breederhq-api/src/routes/marketplace-v2.ts#L895-L1321)

#### Request

```bash
GET /api/v2/marketplace/animals/123/listing-data
Headers:
  X-Tenant-ID: abc123
  Cookie: bhq_s=...
```

#### Response

```typescript
{
  animal: {
    id: 123,
    name: "Champion Shadow",
    species: "Canine",
    breed: "German Shepherd",
    sex: "Male",
    birthDate: "2020-03-15",
    photoUrl: "https://..."
  },
  privacySettings: {
    enableHealthSharing: true,
    enableGeneticsSharing: false,
    showTitles: true,
    // ... all privacy flags
  },
  registrations: [
    { id: 1, registryName: "AKC", identifier: "WS12345678" }
  ],
  health: {
    enabled: true, // Privacy setting
    eligibleTraits: [
      {
        id: 456,
        key: "ofa_hips",
        displayName: "OFA Hips",
        value: "Excellent",
        marketplaceVisible: true
      }
    ],
    allTraits: [
      { id: 456, displayName: "OFA Hips", marketplaceVisible: true },
      { id: 457, displayName: "PennHIP", marketplaceVisible: false } // Locked
    ]
  },
  genetics: {
    enabled: false, // Privacy setting - section locked
    data: null
  },
  titles: {
    enabled: true,
    showDetails: true,
    eligibleTitles: [
      {
        id: 789,
        name: "Champion",
        abbreviation: "Ch",
        organization: "AKC",
        dateEarned: "2022-05-10"
      }
    ],
    allTitles: [
      { id: 789, abbreviation: "Ch", isPublic: true },
      { id: 790, abbreviation: "CD", isPublic: false } // Locked
    ]
  },
  // ... media, documents, lineage, breeding
}
```

#### Privacy Filtering Rules

- **Health traits**: Only returns traits where `marketplaceVisible = true`
- **Titles**: Only returns titles where `isPublic = true`
- **Competitions**: Only returns competitions where `isPublic = true`
- **Documents**: Filters out `visibility = "PRIVATE"` documents
- **Locked sections**: Returns `enabled: false` when privacy disables sharing

---

### 2. Public Listing View (Respects Data Drawer)

**Endpoint:** `GET /api/v2/marketplace/listings/:slug`
**Authentication:** None (public)
**Purpose:** Serve published listing with data drawer filtering

**Implementation:** [marketplace-v2.ts:1612-1916](../../breederhq-api/src/routes/marketplace-v2.ts#L1612-L1916)

#### Request

```bash
GET /api/v2/marketplace/listings/champion-shadow-stud-123
```

#### Response

```typescript
{
  listing: {
    id: 100,
    slug: "champion-shadow-stud-123",
    templateType: "STUD_SERVICES",
    headline: "Champion Bloodline German Shepherd Stud",
    description: "...",
    priceModel: "fixed",
    priceCents: 150000,
    publishedAt: "2026-01-15T10:00:00Z",
    viewCount: 42
  },
  breeder: {
    id: 5,
    slug: "elite-shepherds",
    name: "Elite Shepherds Kennel",
    city: "Denver",
    region: "CO"
  },
  animal: {
    id: 123,
    name: "Champion Shadow", // Only if config.identity.showName = true
    breed: "German Shepherd",
    sex: "Male",
    birthDate: "2020-03-15", // Only if config.identity.showDob = true
    photoUrl: "https://..." // Only if config.identity.showPhoto = true
  },
  data: {
    registrations?: [...], // Only if config.registry.enabled + privacy allows
    healthTests?: [...],   // Only if config.health.enabled + privacy allows + trait selected
    genetics?: [...],      // Only if config.genetics.enabled + privacy allows
    titles?: [...],        // Only if config.achievements.enabled + privacy allows + title selected
    competitions?: [...],  // Only if config.achievements.enabled + privacy allows + comp selected
    media?: [...],         // Only if config.media.enabled + privacy allows + media selected
    documents?: [...],     // Only if config.documents.enabled + privacy allows + doc selected
    lineage?: {            // Only if config.lineage.enabled
      sire?: {...},        // Only if config.lineage.showSire = true
      dam?: {...}          // Only if config.lineage.showDam = true
    },
    breeding?: {           // Only if config.breeding.enabled + privacy allows
      offspringCount: 12   // Only if config.breeding.showOffspringCount = true
    }
  }
}
```

#### Filtering Logic

```typescript
// Helper function in endpoint
const isSectionEnabled = (privacyFlag: boolean, configSection: any): boolean => {
  return privacyFlag === true && configSection?.enabled === true;
};

// Example: Health tests
if (isSectionEnabled(privacy.enableHealthSharing, config.health)) {
  const selectedIds = config.health.traitIds || [];
  response.data.healthTests = animal.AnimalTraitValue
    .filter((t) =>
      t.marketplaceVisible === true && // Layer 2
      (selectedIds.length === 0 || selectedIds.includes(t.id)) // Layer 3
    )
    .map((t) => ({ /* transform */ }));
}
```

---

## Frontend Components

### 1. DataDrawer Component

**Location:** [apps/marketplace/src/breeder/components/DataDrawer.tsx](../../apps/marketplace/src/breeder/components/DataDrawer.tsx)

**Purpose:** Modal UI for selecting which data to include in listing

#### Component Props

```typescript
interface DataDrawerProps {
  open: boolean;
  onClose: () => void;
  animalData: AnimalListingData | null;
  initialConfig?: DataDrawerConfig;
  onSave: (config: DataDrawerConfig) => void;
}
```

#### UI Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Customize Listing Data                           [X]        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐  ┌────────────────────────────────┐ │
│ │ SECTIONS            │  │ SECTION DETAILS                │ │
│ │                     │  │                                │ │
│ │ [✓] Achievements    │  │ Health Testing                 │ │
│ │ [ ] Breeding        │  │ ─────────────────────────────  │ │
│ │ [✓] Health Testing  │  │ [ ] OFA Hips - Excellent       │ │
│ │ [🔒] Genetics       │  │ [✓] OFA Elbows - Normal        │ │
│ │ [✓] Registry        │  │ [✓] CERF - Clear               │ │
│ │                     │  │ [ ] PennHIP - 0.35             │ │
│ │ ─────────────────── │  │                                │ │
│ │ 🔒 = Privacy locked │  │ Note: Only tests marked as     │ │
│ │ Enable in Privacy   │  │ "marketplace visible" appear.  │ │
│ │ tab to unlock       │  │                                │ │
│ │ [Manage Privacy →]  │  │ [Configure Privacy →]          │ │
│ └─────────────────────┘  └────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                               [Cancel]  [Save Configuration] │
└─────────────────────────────────────────────────────────────┘
```

#### Section Configuration

```typescript
const SECTIONS: SectionInfo[] = [
  { key: "achievements", label: "Achievements", icon: "🏆", description: "Titles and competition results" },
  { key: "breeding", label: "Breeding", icon: "🐾", description: "Offspring count" },
  { key: "documents", label: "Documents", icon: "📄", description: "Certificates, health records" },
  { key: "genetics", label: "Genetics", icon: "🧬", description: "DNA test results" },
  { key: "health", label: "Health", icon: "❤️", description: "Health testing and clearances" },
  { key: "identity", label: "Identity", icon: "🔖", description: "Name, photo, birth date" },
  { key: "lineage", label: "Lineage", icon: "🌳", description: "Pedigree information" },
  { key: "media", label: "Media", icon: "📸", description: "Photos and videos" },
  { key: "registry", label: "Registry", icon: "📋", description: "Registration numbers" },
];
```

#### State Management

```typescript
const [config, setConfig] = React.useState<DataDrawerConfig>(initialConfig || {});
const [activeSection, setActiveSection] = React.useState<SectionKey | null>("health");

// Toggle section
const toggleSection = (key: SectionKey) => {
  setConfig((prev) => ({
    ...prev,
    [key]: { ...prev[key], enabled: !prev[key]?.enabled },
  }));
};

// Toggle item within section
const toggleHealthTrait = (id: number) => {
  const current = config.health?.traitIds || [];
  const updated = current.includes(id)
    ? current.filter((tid) => tid !== id)
    : [...current, id];

  setConfig((prev) => ({
    ...prev,
    health: { ...prev.health, enabled: true, traitIds: updated },
  }));
};
```

---

### 2. Integration in Listing Creation Wizard

**Location:** [apps/marketplace/src/breeder/pages/CreateDirectListingWizard.tsx](../../apps/marketplace/src/breeder/pages/CreateDirectListingWizard.tsx)

#### Wizard Flow

```
1. Template Selection
2. Animal Selection
   ↓
   [Customize Data] button → Opens DataDrawer
   ↓
3. Content (headline, description)
4. Pricing
5. Settings
6. Review & Publish
```

#### Implementation

```typescript
// State
const [dataDrawerOpen, setDataDrawerOpen] = React.useState(false);
const [animalListingData, setAnimalListingData] = React.useState<AnimalListingData | null>(null);
const [loadingAnimalData, setLoadingAnimalData] = React.useState(false);

// Form includes dataDrawerConfig
const [form, setForm] = React.useState({
  // ... other fields
  dataDrawerConfig: {} as DataDrawerConfig,
});

// Handler to open drawer
const handleOpenDataDrawer = async () => {
  if (!form.animalId) return;
  setLoadingAnimalData(true);
  try {
    const data = await getAnimalListingData(tenantId, form.animalId);
    setAnimalListingData(data);
    setDataDrawerOpen(true);
  } catch (err) {
    console.error("Failed to load animal data:", err);
    alert("Failed to load animal data. Please try again.");
  } finally {
    setLoadingAnimalData(false);
  }
};

// Render in AnimalStep
<div className="mt-6 pt-6 border-t">
  <div className="bg-portal-card border rounded-lg p-4">
    <h3>Customize Listing Data</h3>
    <p>Select which information about {animal.name} to include</p>
    <Button onClick={handleOpenDataDrawer} disabled={loadingAnimalData}>
      {loadingAnimalData ? "Loading..." : "Customize Data"}
    </Button>
  </div>
</div>

// DataDrawer component
<DataDrawer
  open={dataDrawerOpen}
  onClose={() => setDataDrawerOpen(false)}
  animalData={animalListingData}
  initialConfig={form.dataDrawerConfig}
  onSave={(config) => {
    setForm({ ...form, dataDrawerConfig: config });
    setDataDrawerOpen(false);
  }}
/>
```

---

### 3. Public Listing Display Page

**Location:** [apps/marketplace/src/marketplace/pages/DirectListingPage.tsx](../../apps/marketplace/src/marketplace/pages/DirectListingPage.tsx)

**Route:** `/listings/:slug`

#### Page Structure

```typescript
export function DirectListingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = React.useState<PublicListingResponse | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const result = await getPublicListing(slug);
      setData(result);
    };
    fetchData();
  }, [slug]);

  // Render sections dynamically based on what's in data
  return (
    <div className="direct-listing-page">
      <Header listing={data.listing} breeder={data.breeder} />

      <div className="content">
        <main>
          {data.animal.photoUrl && <HeroImage src={data.animal.photoUrl} />}
          {data.listing.description && <DescriptionSection />}
          <AnimalInfoSection animal={data.animal} />

          {/* Conditional sections based on dataDrawerConfig */}
          {data.data.registrations && <RegistrySection items={data.data.registrations} />}
          {data.data.healthTests && <HealthTestingSection items={data.data.healthTests} />}
          {data.data.genetics && <GeneticsSection items={data.data.genetics} />}
          {data.data.titles && <TitlesSection items={data.data.titles} />}
          {data.data.competitions && <CompetitionsSection items={data.data.competitions} />}
          {data.data.lineage && <LineageSection lineage={data.data.lineage} />}
          {data.data.breeding && <BreedingSection stats={data.data.breeding} />}
          {data.data.media && <MediaGallery items={data.data.media} />}
          {data.data.documents && <DocumentsSection items={data.data.documents} />}
        </main>

        <aside>
          <ContactCard breeder={data.breeder} />
          <LocationCard location={data.listing} />
          <BreederProfileCard breeder={data.breeder} />
        </aside>
      </div>
    </div>
  );
}
```

#### Data Section Components

Each section renders only if data is present:

```typescript
// Example: Health Testing Section
function HealthTestingSection({ items }: { items: HealthTest[] }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="content-section">
      <h2>Health Testing</h2>
      <div className="data-list">
        {items.map((test) => (
          <div key={test.id} className="data-item">
            <span className="label">{test.displayName}</span>
            <span className="value">{test.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## Usage Guide

### For Breeders: Creating a Listing with Data Drawer

1. **Navigate to Create Listing**
   - Go to `/manage/individual-animals`
   - Click "Create New Listing"

2. **Select Template & Animal**
   - Choose listing type (Stud, Guardian, etc.)
   - Select the animal

3. **Customize Data (Optional)**
   - After selecting animal, click **"Customize Data"** button
   - Data Drawer opens with all available data sections

4. **Select Data to Include**
   - **Locked sections** (🔒): Privacy settings prevent sharing
     - Click "Manage Privacy" to enable in animal's Privacy tab
   - **Available sections**: Toggle on/off at section level
   - **Item selection**: Expand section to choose specific items
     - Health: Select individual test results
     - Titles: Choose which titles to display
     - Media: Pick photos/videos to include

5. **Preview & Save**
   - Right panel shows live preview of data
   - Click "Save Configuration"
   - Configuration stored in `dataDrawerConfig`

6. **Complete & Publish Listing**
   - Continue through wizard (content, pricing, settings)
   - Review final listing
   - Publish (status = ACTIVE, listed = true)

### For Breeders: Editing Existing Listing Data

1. **Access Listing Management**
   - Go to `/manage/individual-animals`
   - Click on existing listing card

2. **Edit Drawer Opens**
   - Shows current listing details
   - Click "Customize Data" button in edit drawer

3. **Modify Data Selection**
   - Data Drawer opens with current config pre-selected
   - Change section toggles or item selections
   - Save changes

4. **Save & Republish**
   - Changes apply immediately to published listing
   - No need to unpublish/republish

---

## Privacy Settings Reference

### Animal Privacy Settings

Located in: `Animal Privacy` tab for each animal

| Setting | Affects | Data Drawer Impact |
|---------|---------|-------------------|
| `allowCrossTenantMatching` | Master toggle | If false, animal won't appear in marketplace |
| `showName` | Animal identity | Controls if name can be shown |
| `showPhoto` | Animal identity | Controls if photo can be shown |
| `showFullDob` | Animal identity | Controls if full birth date shown |
| `showRegistryFull` | Registry section | Locks/unlocks registry data |
| `enableHealthSharing` | Health section | Locks/unlocks health testing data |
| `enableGeneticsSharing` | Genetics section | Locks/unlocks genetic test data |
| `enableMediaSharing` | Media section | Locks/unlocks photos/videos |
| `enableDocumentSharing` | Documents section | Locks/unlocks document uploads |
| `showTitles` | Achievements section | Locks/unlocks titles |
| `showTitleDetails` | Achievements section | Controls detail level for titles |
| `showCompetitions` | Achievements section | Locks/unlocks competition results |
| `showCompetitionDetails` | Achievements section | Controls detail level for comps |
| `showBreedingHistory` | Breeding section | Locks/unlocks offspring count |

### Per-Item Visibility Flags

| Item Type | Field | Location | Purpose |
|-----------|-------|----------|---------|
| Health Trait | `marketplaceVisible` | `AnimalTraitValue` | Show/hide specific test in marketplace |
| Title | `isPublic` | `AnimalTitle` | Show/hide specific title |
| Competition | `isPublic` | `AnimalCompetitionResult` | Show/hide specific competition |
| Document | `visibility` | `AnimalDocument` | PRIVATE/INTERNAL/PUBLIC visibility |

---

## Examples

### Example 1: Stud Listing with Full Pedigree

**Breeder wants to show:**
- Name, photo, DOB
- All health clearances
- Championship titles
- Full 3-generation pedigree

**Privacy Settings:**
```json
{
  "showName": true,
  "showPhoto": true,
  "showFullDob": true,
  "enableHealthSharing": true,
  "showTitles": true,
  "showTitleDetails": true
}
```

**Data Drawer Config:**
```json
{
  "identity": {
    "enabled": true,
    "showName": true,
    "showPhoto": true,
    "showDob": true
  },
  "health": {
    "enabled": true,
    "traitIds": [101, 102, 103, 104] // All health tests
  },
  "achievements": {
    "enabled": true,
    "titleIds": [201, 202], // Ch, GCh
    "competitionIds": []
  },
  "lineage": {
    "enabled": true,
    "showSire": true,
    "showDam": true
  }
}
```

**Result:** Public listing shows complete health, titles, and lineage

---

### Example 2: Guardian Home - Privacy Focused

**Breeder wants to show:**
- Photo only (no name/DOB for security)
- Basic health clearances
- No titles or competitions
- No breeding history

**Privacy Settings:**
```json
{
  "showName": false,
  "showPhoto": true,
  "showFullDob": false,
  "enableHealthSharing": true,
  "showTitles": false
}
```

**Data Drawer Config:**
```json
{
  "identity": {
    "enabled": true,
    "showName": false,
    "showPhoto": true,
    "showDob": false
  },
  "health": {
    "enabled": true,
    "traitIds": [101, 102] // Only OFA hips/elbows
  },
  "achievements": {
    "enabled": false
  },
  "breeding": {
    "enabled": false
  }
}
```

**Result:** Minimal public listing with anonymous animal + basic health

---

### Example 3: Trained Dog - Performance Focus

**Breeder wants to show:**
- Name, photo
- Competition results (but not titles)
- Training videos
- No health or genetic data

**Privacy Settings:**
```json
{
  "showName": true,
  "showPhoto": true,
  "showCompetitions": true,
  "showCompetitionDetails": true,
  "enableMediaSharing": true,
  "enableHealthSharing": false
}
```

**Data Drawer Config:**
```json
{
  "identity": {
    "enabled": true,
    "showName": true,
    "showPhoto": true
  },
  "achievements": {
    "enabled": true,
    "titleIds": [],
    "competitionIds": [301, 302, 303] // Select competitions
  },
  "media": {
    "enabled": true,
    "mediaIds": [401, 402, 403] // Training videos
  }
}
```

**Result:** Performance-focused listing with videos and competition history

---

## Technical Details

### Database Schema

```prisma
model DirectAnimalListing {
  id       Int    @id @default(autoincrement())
  tenantId Int
  animalId Int

  // ... other listing fields

  // Data Drawer Configuration (which data points to show)
  dataDrawerConfig Json @db.JsonB // { identity: {...}, media: {...}, ... }

  // Template-specific content
  listingContent Json? @db.JsonB

  // ... rest of model
}

model AnimalPrivacySettings {
  id                       Int     @id @default(autoincrement())
  animalId                 Int     @unique
  allowCrossTenantMatching Boolean @default(true)
  showName                 Boolean @default(true)
  showPhoto                Boolean @default(true)
  showFullDob              Boolean @default(false)
  showRegistryFull         Boolean @default(false)
  enableHealthSharing      Boolean @default(false)
  enableGeneticsSharing    Boolean @default(false)
  enableDocumentSharing    Boolean @default(false)
  enableMediaSharing       Boolean @default(false)
  showTitles               Boolean @default(true)
  showTitleDetails         Boolean @default(false)
  showCompetitions         Boolean @default(false)
  showCompetitionDetails   Boolean @default(false)
  showBreedingHistory      Boolean @default(false)
  // ... more fields
}

model AnimalTraitValue {
  id                  Int     @id @default(autoincrement())
  animalId            Int
  traitDefinitionId   Int
  marketplaceVisible  Boolean @default(false) // Per-item marketplace visibility
  networkVisible      Boolean @default(false) // Per-item network visibility
  // ... value fields
}
```

### Performance Considerations

1. **Listing Load**
   - Public endpoint includes large Prisma query with multiple relations
   - Indexed by `slug` for fast lookup
   - View count update is async (non-blocking)

2. **Data Drawer Load**
   - Fetches all animal relations (health, titles, media, etc.)
   - Filters client-side for privacy
   - Cache-friendly (animal data changes infrequently)

3. **Optimizations**
   - Query limits on competitions (50), media (50), documents (50)
   - Only fetches marketplaceVisible traits for health
   - Only fetches isPublic titles/competitions

---

## Testing Guide

### Manual Test Scenarios

#### Test 1: Privacy Filtering
1. Create animal with health tests
2. Set `marketplaceVisible = false` on one test
3. Open Data Drawer
4. **Expected:** Test with `marketplaceVisible = false` should not appear in selectable items

#### Test 2: Section Locking
1. Create animal
2. Set `enableHealthSharing = false` in privacy
3. Create listing, open Data Drawer
4. **Expected:** Health section shows 🔒 icon, cannot be enabled

#### Test 3: Item Selection Persistence
1. Create listing with Data Drawer config
2. Save listing as draft
3. Close browser, reopen
4. Edit listing, open Data Drawer
5. **Expected:** Previously selected items are pre-checked

#### Test 4: Public Display Filtering
1. Create listing with partial health tests selected
2. Publish listing
3. View public listing page (logged out)
4. **Expected:** Only selected health tests appear, not all available tests

#### Test 5: Privacy Change Impact
1. Create listing with health tests visible
2. Publish listing
3. Change `enableHealthSharing = false` in animal privacy
4. View public listing
5. **Expected:** Health section no longer appears (privacy takes precedence)

### Automated Test Coverage

**API Tests** (recommended):
```typescript
describe("GET /animals/:id/listing-data", () => {
  it("should filter traits by marketplaceVisible flag");
  it("should filter titles by isPublic flag");
  it("should return empty arrays when privacy disabled");
  it("should return 404 for non-existent animal");
});

describe("GET /listings/:slug", () => {
  it("should apply dataDrawerConfig filtering");
  it("should respect three-layer privacy model");
  it("should return 404 for draft/paused listings");
  it("should increment view count");
});
```

**Component Tests** (recommended):
```typescript
describe("DataDrawer", () => {
  it("should disable locked sections");
  it("should toggle section enabled state");
  it("should toggle item selection");
  it("should call onSave with updated config");
  it("should show privacy locked message for disabled sections");
});
```

---

## Troubleshooting

### Issue: Data Drawer shows no selectable items

**Cause:** Privacy settings are too restrictive

**Solution:**
1. Check `AnimalPrivacySettings` for the animal
2. Enable relevant section toggles (e.g., `enableHealthSharing`)
3. Check per-item flags (`marketplaceVisible`, `isPublic`)
4. Refresh Data Drawer

---

### Issue: Public listing shows no data sections

**Cause:** `dataDrawerConfig` is empty or sections not enabled

**Solution:**
1. Edit listing
2. Open Data Drawer
3. Enable sections and select items
4. Save configuration
5. Republish if needed

---

### Issue: Specific item doesn't appear in public listing

**Check:**
1. ✓ Privacy section toggle enabled? (`enableHealthSharing`, etc.)
2. ✓ Per-item flag enabled? (`marketplaceVisible = true`)
3. ✓ Section enabled in Data Drawer? (`config.health.enabled = true`)
4. ✓ Item selected in Data Drawer? (`config.health.traitIds` includes item ID)

---

## Future Enhancements

### Planned Features

1. **Bulk Selection**
   - "Select All" / "Deselect All" per section
   - Select by category (e.g., all OFA tests)

2. **Data Preview Templates**
   - Pre-configured templates for common scenarios
   - "Full Transparency", "Privacy Focused", "Performance Only"

3. **Conditional Logic**
   - Auto-enable lineage when showing breeding history
   - Suggest related sections based on template type

4. **Analytics Integration**
   - Track which data sections drive most inquiries
   - A/B testing for data visibility impact

5. **Buyer Preferences**
   - Allow buyers to request specific data
   - Breeder can approve/deny requests

---

## Related Documentation

- [Animal Listings](./animal-listings.md) - Overview of listing types and intents
- [Breeding Programs](./breeding-programs.md) - Program-level data sharing
- [API Reference](./api-reference.md) - Complete API documentation
- [Privacy Settings](../../architecture/privacy-model.md) - Animal privacy architecture

---

## Changelog

### 2026-01-16 - Initial Implementation
- ✅ Backend: `/animals/:id/listing-data` endpoint
- ✅ Backend: `/listings/:slug` public endpoint with filtering
- ✅ Frontend: DataDrawer component with section selector
- ✅ Frontend: Integration in CreateDirectListingWizard
- ✅ Frontend: DirectListingPage with dynamic sections
- ✅ Documentation: Complete feature documentation

---

**Maintained by:** Engineering Team
**Last Updated:** 2026-01-16
**Related PRs:** TBD
