# Data Drawer Quick Reference

> **TL;DR:** The Data Drawer lets breeders choose exactly which animal data appears in their marketplace listings. It respects privacy settings and provides granular control over health tests, titles, media, and more.

---

## Quick Links

| Resource | Location |
|----------|----------|
| Full Documentation | [data-drawer.md](./data-drawer.md) |
| API Endpoint (Data Source) | `GET /api/v2/marketplace/animals/:id/listing-data` |
| API Endpoint (Public View) | `GET /api/v2/marketplace/listings/:slug` |
| Component | [DataDrawer.tsx](../../apps/marketplace/src/breeder/components/DataDrawer.tsx) |
| Public Page | [DirectListingPage.tsx](../../apps/marketplace/src/marketplace/pages/DirectListingPage.tsx) |

---

## Available Data Sections

| Section | Icon | What It Includes | Privacy Gate |
|---------|------|------------------|--------------|
| **Achievements** | 🏆 | Titles, competitions | `showTitles`, `showCompetitions` |
| **Breeding** | 🐾 | Offspring count | `showBreedingHistory` |
| **Documents** | 📄 | Certificates, records | `enableDocumentSharing` |
| **Genetics** | 🧬 | DNA tests, COI | `enableGeneticsSharing` |
| **Health** | ❤️ | Health testing | `enableHealthSharing` |
| **Identity** | 🔖 | Name, photo, DOB | `showName`, `showPhoto`, `showFullDob` |
| **Lineage** | 🌳 | Sire, dam info | Always available |
| **Media** | 📸 | Photos, videos | `enableMediaSharing` |
| **Registry** | 📋 | Registration numbers | `showRegistryFull` |

---

## Three-Layer Privacy Model

```
┌──────────────────────────────────────────┐
│ 1. PRIVACY SETTINGS (Animal-level)      │ ← Master control
│    Example: enableHealthSharing = true   │
└────────────────┬─────────────────────────┘
                 ↓
┌──────────────────────────────────────────┐
│ 2. PER-ITEM FLAGS                        │ ← Item visibility
│    Example: marketplaceVisible = true    │
└────────────────┬─────────────────────────┘
                 ↓
┌──────────────────────────────────────────┐
│ 3. DATA DRAWER CONFIG (Listing-level)   │ ← Breeder selection
│    Example: config.health.traitIds = []  │
└──────────────────────────────────────────┘
                 ↓
           PUBLIC LISTING
```

**Rule:** Data appears only if ALL three layers allow it.

---

## Common Use Cases

### Full Transparency Listing
**Use for:** Stud services, proven breeding dogs

```json
{
  "identity": { "enabled": true, "showName": true, "showPhoto": true, "showDob": true },
  "health": { "enabled": true, "traitIds": [] }, // Empty = all eligible
  "genetics": { "enabled": true },
  "achievements": { "enabled": true, "titleIds": [], "competitionIds": [] },
  "lineage": { "enabled": true, "showSire": true, "showDam": true },
  "breeding": { "enabled": true, "showOffspringCount": true }
}
```

---

### Privacy-Focused Listing
**Use for:** Guardian homes, sensitive placements

```json
{
  "identity": { "enabled": true, "showName": false, "showPhoto": true, "showDob": false },
  "health": { "enabled": true, "traitIds": [101, 102] }, // Only basic clearances
  "achievements": { "enabled": false },
  "breeding": { "enabled": false }
}
```

---

### Performance Dog Listing
**Use for:** Trained dogs, working dogs

```json
{
  "identity": { "enabled": true, "showName": true, "showPhoto": true },
  "achievements": { "enabled": true, "titleIds": [], "competitionIds": [301, 302, 303] },
  "media": { "enabled": true, "mediaIds": [401, 402, 403] }, // Training videos
  "health": { "enabled": false }
}
```

---

## API Quick Start

### Fetch Data for Drawer

```bash
GET /api/v2/marketplace/animals/123/listing-data
Headers:
  X-Tenant-ID: abc123
  Cookie: bhq_s=...

Response:
{
  "animal": { ... },
  "privacySettings": { ... },
  "health": {
    "enabled": true,
    "eligibleTraits": [
      { "id": 456, "displayName": "OFA Hips", "value": "Excellent" }
    ]
  }
}
```

### View Public Listing

```bash
GET /api/v2/marketplace/listings/champion-shadow-stud-123

Response:
{
  "listing": { ... },
  "breeder": { ... },
  "animal": { ... },
  "data": {
    "healthTests": [ ... ],  // Only if config.health.enabled
    "titles": [ ... ],       // Only if config.achievements.enabled
    ...
  }
}
```

---

## Code Snippets

### Open Data Drawer in Wizard

```typescript
import { getAnimalListingData } from "../../api/client";
import { DataDrawer } from "../components/DataDrawer";

const [dataDrawerOpen, setDataDrawerOpen] = useState(false);
const [animalData, setAnimalData] = useState(null);

const openDrawer = async () => {
  const data = await getAnimalListingData(tenantId, animalId);
  setAnimalData(data);
  setDataDrawerOpen(true);
};

<DataDrawer
  open={dataDrawerOpen}
  onClose={() => setDataDrawerOpen(false)}
  animalData={animalData}
  initialConfig={form.dataDrawerConfig}
  onSave={(config) => {
    setForm({ ...form, dataDrawerConfig: config });
    setDataDrawerOpen(false);
  }}
/>
```

---

### Check if Section is Enabled (Backend)

```typescript
const isSectionEnabled = (
  privacyFlag: boolean | null | undefined,
  configSection: any
): boolean => {
  return privacyFlag === true && configSection?.enabled === true;
};

// Usage
if (isSectionEnabled(privacy.enableHealthSharing, config.health)) {
  const selectedIds = config.health.traitIds || [];
  response.data.healthTests = animal.AnimalTraitValue
    .filter((t) =>
      t.marketplaceVisible === true &&
      (selectedIds.length === 0 || selectedIds.includes(t.id))
    )
    .map(transformTrait);
}
```

---

### Render Section Conditionally (Frontend)

```typescript
{data.data.healthTests && data.data.healthTests.length > 0 && (
  <section className="content-section">
    <h2>Health Testing</h2>
    <div className="data-list">
      {data.data.healthTests.map((test) => (
        <div key={test.id} className="data-item">
          <span className="label">{test.displayName}</span>
          <span className="value">{test.value}</span>
        </div>
      ))}
    </div>
  </section>
)}
```

---

## Troubleshooting Checklist

### ❌ No items in Data Drawer?
- [ ] Privacy settings enabled? (e.g., `enableHealthSharing = true`)
- [ ] Per-item flags enabled? (e.g., `marketplaceVisible = true`)
- [ ] Animal has actual data? (traits, titles, etc.)

### ❌ Section shows lock icon?
- [ ] Check animal's Privacy Settings tab
- [ ] Enable the relevant toggle
- [ ] Refresh Data Drawer

### ❌ Data not showing on public page?
- [ ] Section enabled in Data Drawer?
- [ ] Items selected in Data Drawer?
- [ ] Listing is ACTIVE and listed=true?
- [ ] Privacy hasn't been disabled after publishing?

---

## Database Fields Reference

```sql
-- Where config is stored
SELECT dataDrawerConfig FROM "DirectAnimalListing" WHERE id = 123;

-- Animal privacy settings
SELECT * FROM "AnimalPrivacySettings" WHERE animalId = 456;

-- Per-item visibility (health)
SELECT id, marketplaceVisible FROM "AnimalTraitValue" WHERE animalId = 456;

-- Per-item visibility (titles)
SELECT id, isPublic FROM "AnimalTitle" WHERE animalId = 456;
```

---

## Testing Snippets

### Test Privacy Filtering

```typescript
// Create animal with mixed visibility
await prisma.animalTraitValue.createMany({
  data: [
    { animalId: 1, traitDefinitionId: 1, value: "Excellent", marketplaceVisible: true },
    { animalId: 1, traitDefinitionId: 2, value: "Good", marketplaceVisible: false },
  ]
});

// Fetch listing data
const data = await getAnimalListingData(tenantId, 1);

// Assert: Only marketplaceVisible=true traits returned
expect(data.health.eligibleTraits).toHaveLength(1);
expect(data.health.eligibleTraits[0].value).toBe("Excellent");
```

---

### Test Public Endpoint Filtering

```typescript
// Create listing with partial selection
await prisma.directAnimalListing.create({
  data: {
    animalId: 1,
    slug: "test-listing",
    status: "ACTIVE",
    listed: true,
    dataDrawerConfig: {
      health: {
        enabled: true,
        traitIds: [101], // Only one trait selected
      }
    }
  }
});

// Fetch public listing
const listing = await getPublicListing("test-listing");

// Assert: Only selected trait appears
expect(listing.data.healthTests).toHaveLength(1);
expect(listing.data.healthTests[0].id).toBe(101);
```

---

## Migration Notes

### Adding Data Drawer to Existing Listings

Existing listings (pre-Data Drawer) have `dataDrawerConfig = {}`.

**Behavior:**
- Empty config = no data sections appear (safe default)
- Breeders must explicitly open drawer and select data
- No automatic migration needed

**To enable data for existing listings:**
1. Edit listing
2. Click "Customize Data"
3. Select desired sections/items
4. Save

---

## Performance Tips

1. **Limit query depth**: Public endpoint limits competitions (50), media (50), documents (50)
2. **Index lookups**: Listings queried by `slug` (indexed)
3. **Async view counts**: View count updates don't block response
4. **Client-side filtering**: Data Drawer filters eligibility in UI for responsive UX

---

## Related Privacy Settings

| Setting | Default | Impact if Disabled |
|---------|---------|-------------------|
| `allowCrossTenantMatching` | `true` | Animal won't appear in marketplace |
| `enableHealthSharing` | `false` | Health section locked in drawer |
| `enableGeneticsSharing` | `false` | Genetics section locked in drawer |
| `enableMediaSharing` | `false` | Media section locked in drawer |
| `enableDocumentSharing` | `false` | Documents section locked in drawer |
| `showTitles` | `true` | Titles locked in drawer |
| `showCompetitions` | `false` | Competitions locked in drawer |
| `showBreedingHistory` | `false` | Breeding section locked in drawer |

---

**Full Documentation:** [data-drawer.md](./data-drawer.md)
**Last Updated:** 2026-01-16
