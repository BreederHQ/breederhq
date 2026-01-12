# Tags/Labels Recon Report
**Date:** 2026-01-02
**Repos:** BreederHQ monorepo + breederhq-api
**Branch:** dev (both repos)
**Objective:** Deep reconnaissance on Tags/Labels implementation across all modules

---

## A) Executive Summary

1. **Full Tag system exists and is operational** - Database models (Tag, TagAssignment), API endpoints, service layer, and multi-entity support are production-ready.

2. **UI is sparse and inconsistent** - Animals and Contacts modules have basic tag input (comma-separated strings), but no rich tag management UI exists. TagsPopover component is built but unused.

3. **Settings placeholder exists** - Platform app has a "Tag Manager" tab in SettingsPanel (line 673), but it's a non-functional placeholder with only a description and dummy input.

4. **Party migration complete** - TagAssignment successfully migrated from separate contactId/organizationId columns to unified taggedPartyId (Step 6B), with backward-compatible API layer.

5. **Multi-module scope exists** - TagModule enum supports 6 entity types: CONTACT, ORGANIZATION, ANIMAL, WAITLIST_ENTRY, OFFSPRING_GROUP, OFFSPRING. Tags are scoped per tenant per module.

6. **Naming is consistent: "Tag" everywhere** - Zero occurrences of "Label" in code. All references use "tag/tags/Tag/TagAssignment."

7. **No manager UI exists for creating/editing tag definitions** - Users cannot create, rename, color, or delete tags through the UI. Only API supports CRUD operations.

8. **Assignment patterns differ by module** - Animals module has working tag assignment via comma-separated input; Contacts has API calls defined but limited UI; other modules (Waitlist, Offspring) have schema support but no UI.

9. **No visual design system for tags** - No chips, badges, or colored pills. Tags display as plain comma-separated text.

10. **Gap: No Labels Manager** - The intended "Labels Manager in SettingsPage grouped by Module" does not exist beyond the placeholder tab.

---

## B) Current UI Surfaces (by module)

### Platform Module (`apps/platform`)
**File:** `apps/platform/src/pages/SettingsPanel.tsx`
- **Line 501:** Navigation tab definition: `{ key: "tags", label: "Tag Manager" }`
- **Line 519:** Dirty state tracking for tags tab: `tags: false`
- **Line 673:** Conditional render: `{active === "tags" && <TagsTab dirty={dirtyMap.tags} onDirty={(v) => markDirty("tags", v)} />}`
- **Lines 2191-2202:** TagsTab component (PLACEHOLDER)
  - Title: "Tag Manager"
  - Description: "Add, rename, and delete tags used across the platform (placeholder)."
  - Input for "New tag" + "Add tag" button
  - No actual API integration
  - Only marks form as dirty on interaction

**API Reference:**
- **Line (api.ts):** `tags: { list: (type: "contact" = "contact") => request(${root}/tags + qs({ type }), { method: "GET" }) }`
- Currently only fetches tags, no mutation endpoints wired

---

### Animals Module (`apps/animals`)
**File:** `apps/animals/src/App-Animals.tsx`

**Table Integration:**
- **Line 137:** Column definition: `{ key: "tags", label: "Tags", default: true }`
- **Line 209:** Data mapping: `tags: Array.isArray(d.tags) ? d.tags : []`
- **Line 4888:** Cell render: `(row.tags || []).join(", ") || "—"`
- **Lines 4083-4085:** Filter logic: `.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()))`
- **Line 4060:** Search integration: spreads tags into search index

**Detail View (Notes & Tags Section):**
- **Line 4884:** Section title: `<SectionCard title="Notes & Tags">`
- **Line 4888 (view mode):** Displays: `{(tags || []).join(", ") || "—"}`
- **Lines 4890-4901 (edit mode):** Input field syncs tags as comma-separated string

**Create Form:**
- **Line 5067:** State: `const [tagsStr, setTagsStr] = React.useState("")`
- **Line 5081:** Reset handler clears tagsStr
- **Lines 5119-5122:** Payload creation: `tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean)`
- **Lines 5613-5623:** Input UI with placeholder "tag1, tag2"

**API Integration (`apps/animals/src/api.ts`):**
- **tags.list(id):** `GET /animals/${id}/tags`
- **tags.add(id, tagId):** `POST /animals/${id}/tags` with body `{ tagId }`
- **tags.remove(id, tagId):** `DELETE /animals/${id}/tags/${tagId}`

---

### Contacts Module (`apps/contacts`)
**File:** `apps/contacts/src/App-Contacts.tsx`

**Table Integration:**
- **Line 119:** Column: `{ key: "tags", label: "Tags", default: true, center: true }`
- **Line 198:** Data: `tags: Array.isArray(p.tags) ? p.tags.filter(Boolean) : []`
- **Lines 1488-1490:** Filter: `.some(t => t.toLowerCase().includes(tagFilter.toLowerCase()))`
- **Line 1454:** Search: spreads tags into searchable fields

**Create Form:**
- **Line 1779:** State: `const [tagsStr, setTagsStr] = React.useState("")`
- **Line 1802:** Reset: `setTagsStr("")`
- **Line 1854:** Payload: `tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean)`

**File:** `apps/contacts/src/App-Contacts-Party.tsx`
- **Line 107:** Column: `{ key: "tags", label: "Tags", default: true }`
- **Line 238:** Data: `tags: Array.isArray(c.tags) ? c.tags.filter(Boolean) : []`
- **Lines 381, 534:** Filter and search integration

**File:** `apps/contacts/src/PartyDetailsView.tsx`
- **Line 45:** Type: `tags: string[]` in PartyTableRow
- **No render:** Type defined but not displayed in UI

**File:** `apps/contacts/src/CreateOverlays.tsx`
- **Line 37:** Type: `tags: string[]`
- **Line 369:** State: `const [tagsStr, setTagsStr] = React.useState("")`
- **Line 392:** Reset: `setTagsStr("")`
- **Line 444:** Payload: `tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean)`
- **No render:** State managed but input not rendered in form

---

### Offspring Module (`apps/offspring`)
**File:** `apps/offspring/src/App-Offspring.tsx`

**Offspring Groups:**
- **Lines 591-592:** Type: `tags?: string[] | null`
- **Line 867:** Data: `tags: Array.isArray((d as any).tags) ? (d as any).tags : null`
- **Lines 1046-1052:** Table column:
  - Title: "Tags"
  - Render: `r.tags && r.tags.length > 0 ? r.tags.join(", ") : "-"`

**Match Tags (Internal System):**
- **Lines 2789, 2801-2827:** Matching algorithm generates matchTags array
- **Tags include:** "Breed", "Dam", "Sire" based on candidate criteria
- **Line 4182-4183:** Display: `cand.matchTags.join(", ")`
- **Note:** These are computed match indicators, not user-managed tags

---

### Waitlist Module
**No UI surfaces found** - Schema supports WAITLIST_ENTRY tags but no UI implementation.

---

### Portal, Marketplace, Marketing Modules
**No tag surfaces found** in these modules.

---

## C) Current Shared Components

### TagsPopover Component
**File:** `packages/ui/src/components/TagsPopover/TagsPopover.tsx` (lines 1-188)
**Status:** Built but **UNUSED** across all apps

**Features:**
- Searchable dropdown popover
- Checkbox-style multi-select UI
- Controlled component (parent owns state)
- Fixed positioning with scroll/resize tracking
- Filters tags by search query
- Props: `tags: string[]`, `selected: string[]`, `onToggle: (name: string) => void`
- Visual: Orange brand color for checked state, hairline borders

**Exports:**
- `packages/ui/src/components/TagsPopover/index.ts:1` - Re-export
- `packages/ui/src/components/index.ts:39` - Barrel export

**Usage:** **ZERO** - No imports found in any app module

---

### FilterChips Component
**File:** `packages/ui/src/components/Filters/FilterChips.tsx` (lines 1-52)
**Purpose:** Display active filters as removable chips
**Usage:** Used in table filter UIs; tags appear as filterable fields

---

### FiltersRow Component
**File:** `packages/ui/src/components/Filters/FiltersRow.tsx`
**Purpose:** Generic filter row for tables
**Integration:** Provides input mechanisms for tag filtering

---

## D) Database Findings

### Schema Inventory (from `breederhq-api/prisma/schema.prisma`)

#### TagModule Enum (Lines 97-104)
```prisma
enum TagModule {
  CONTACT
  ORGANIZATION
  ANIMAL
  WAITLIST_ENTRY      // Added 2025-11-04
  OFFSPRING_GROUP     // Added 2025-11-11
  OFFSPRING           // Added 2025-11-11
}
```

#### Tag Model (Lines 1141-1154)
```prisma
model Tag {
  id          Int             @id @default(autoincrement())
  tenantId    Int
  tenant      Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name        String
  module      TagModule
  color       String?
  assignments TagAssignment[]
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@unique([tenantId, module, name])
  @@index([tenantId, module])
}
```

**Key Constraints:**
- **Unique per tenant per module:** `@@unique([tenantId, module, name])`
- **Tenant isolation:** Foreign key to Tenant with CASCADE delete
- **Optional color:** String field for UI theming (not used in UI)

#### TagAssignment Model (Lines 1156-1190)
```prisma
model TagAssignment {
  id    Int @id @default(autoincrement())
  tagId Int
  tag   Tag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  // Party-only storage for Contact/Organization tags (Step 6B)
  taggedPartyId Int?
  taggedParty   Party? @relation("TagAssignmentTaggedParty", ...)

  animalId Int?
  animal   Animal? @relation(...)

  waitlistEntryId Int?
  waitlistEntry   WaitlistEntry? @relation(...)

  offspringGroupId Int?
  offspringGroup   OffspringGroup? @relation(...)

  offspringId Int?
  offspring   Offspring? @relation(...)

  createdAt DateTime @default(now())

  @@unique([tagId, taggedPartyId])
  @@unique([tagId, animalId])
  @@unique([tagId, waitlistEntryId])
  @@unique([tagId, offspringGroupId])
  @@unique([tagId, offspringId])
  @@index([taggedPartyId])
  @@index([animalId])
  @@index([waitlistEntryId])
  @@index([offspringGroupId])
  @@index([offspringId])
  @@index([tagId, taggedPartyId])
}
```

**Key Patterns:**
- **Polymorphic storage:** One assignment row points to exactly one entity via nullable FKs
- **Unique constraints:** Prevent duplicate tag assignments per entity
- **Party unification:** Contact and Organization tags use `taggedPartyId` (Party pattern)
- **Cascade behavior:** Deleting Tag cascades to assignments; deleting entity cascades assignment (except Party uses SET NULL)

---

### Migrations Inventory

#### Phase 1: Initial Schema (v1 archived)
- **`20251014074658_baseline`** - Created TagModule enum (CONTACT, ORGANIZATION, ANIMAL)
- **`20251014075000_baseline_completion`** - Created Tag and TagAssignment tables with indexes

#### Phase 2: Enum Expansions (v1 archived)
- **`20251104112239_add_offspring_fields`** - Added WAITLIST_ENTRY to TagModule
- **`20251111142528_add_new_offspring_fields_enhanced`** - Added OFFSPRING_GROUP
- **`20251111152148_add_new_offspring_fields_more_again`** - Added OFFSPRING

#### Phase 3: Party Migration (v1 archived)
- **`20251224122510_party_step5_tags_party`** - Step 5: Added taggedPartyId column (additive)
  - Comment: "Party Migration Step 5: Tags Domain - Add partyId-based foreign keys to TagAssignment table - This is an additive schema change; legacy columns remain unchanged"

- **`20251225064400_step6_tags_party_only`** - Step 6B: Party-only storage
  - Comment: "Step 6B: TagAssignment Party-only migration - Makes TagAssignment use Party exclusively for Contact/Organization tags - Removes legacy contactId and organizationId columns"
  - **Dropped:** contactId, organizationId columns and their indexes/constraints
  - **Kept:** taggedPartyId as the sole Party reference

#### Phase 4: Schema Consolidation (current)
- **`20251230112400_init`** - Complete consolidated baseline with all current definitions

**Verification:** Current schema.prisma **MATCHES** migration state exactly.

---

## E) API Findings

### Endpoint Table

| Method | Path | File | Notes |
|--------|------|------|-------|
| **GET** | `/tags` | `src/routes/tags.ts:49` | List tags with module filter, search (q), pagination |
| **POST** | `/tags` | `src/routes/tags.ts:151` | Create tag (name, module, color?) |
| **GET** | `/tags/:id` | `src/routes/tags.ts:182` | Get single tag by ID |
| **PATCH** | `/tags/:id` | `src/routes/tags.ts:202` | Update tag (name, color); module is immutable |
| **DELETE** | `/tags/:id` | `src/routes/tags.ts:241` | Delete tag (cascades to assignments) |
| **POST** | `/tags/:id/assign` | `src/routes/tags.ts:261` | Assign tag to entity (contactId/organizationId/animalId) |
| **POST** | `/tags/:id/unassign` | `src/routes/tags.ts:335` | Unassign tag from entity |
| **GET** | `/contacts/:id/tags` | `src/routes/tags.ts:87` | List tags for contact (Party-based) |
| **GET** | `/organizations/:id/tags` | `src/routes/tags.ts:119` | List tags for organization (Party-based) |
| **GET** | `/animals/:id/tags` | `src/routes/animals.ts` | List tags for animal |
| **POST** | `/animals/:id/tags` | `src/routes/animals.ts` | Assign tag to animal (body: { tagId }) |
| **DELETE** | `/animals/:id/tags/:tagId` | `src/routes/animals.ts` | Remove tag from animal |

**Auth:** All routes require `tenantId` from request context (middleware)

**Error Handling:**
- **P2002 (Unique violation):** Returns 409 Conflict
- **P2025 (Not found):** Returns 404
- **Module mismatch:** 400 if tag.module doesn't match entity type
- **Tenant isolation:** 403 if entity doesn't belong to tenant

---

### Type Definitions

**File:** `src/routes/tags.ts`
- **Lines 6:** `type Module = "CONTACT" | "ORGANIZATION" | "ANIMAL"`
- **Lines 34-43:** `tagDTO(t)` - Maps Tag model to API response:
  ```ts
  {
    id: number,
    name: string,
    module: Module,
    color: string | null,
    createdAt: Date,
    updatedAt: Date
  }
  ```

**Service Layer:** `src/services/tag-service.ts`
- **Lines 10-16:** `resolvePartyIdFromContact(contactId: number): Promise<number | null>`
- **Lines 18-24:** `resolvePartyIdFromOrganization(organizationId: number): Promise<number | null>`
- **Lines 32-68:** `createTagAssignment(params)` - Party-aware assignment creation
  - Accepts legacy contactId/organizationId inputs
  - Resolves to taggedPartyId internally
  - Maintains API backward compatibility
- **Lines 75-113:** `getTagsForContact(contactId, tenantId)` - Party-only reads
- **Lines 120-157:** `getTagsForOrganization(organizationId, tenantId)` - Party-only reads

**Test Coverage:** `tests/tag-service.test.ts` (86 references to "tag")

---

## F) Observed Patterns Worth Reusing

### 1. Settings Panel Tab Pattern (`apps/platform/src/pages/SettingsPanel.tsx`)

**Navigation Structure:**
- **Lines 465-514:** Tab array with `{ key, label }` objects
- **Line 519:** Dirty state map per tab: `Record<Tab, boolean>`
- **Line 673:** Conditional rendering: `{active === "tags" && <TagsTab ... />}`

**Dirty State Tracking:**
- **markDirty(tab, isDirty):** Function to update dirty map
- **trySwitch(next):** Prevents tab switch if current tab is dirty (shows pulsing banner)
- **onDirtyChange callback:** Propagates dirty state to parent

**Tab Component Signature:**
```tsx
function SomeTab({
  dirty: boolean,
  onDirty: (v: boolean) => void
}) { ... }
```

**Reusable for Labels Manager:** Yes - use this exact pattern for a real TagsTab implementation.

---

### 2. Table Column & Filter Pattern

**Column Definition (`apps/animals/src/App-Animals.tsx:137`):**
```ts
{
  key: "tags",
  label: "Tags",
  default: true,    // Visible by default
  center: true      // Optional alignment
}
```

**Data Mapping:**
```ts
tags: Array.isArray(d.tags) ? d.tags : []
```

**Cell Render:**
```ts
(row.tags || []).join(", ") || "—"
```

**Filter Logic:**
```ts
rows.filter(row =>
  (row.tags || []).some(t =>
    t.toLowerCase().includes(filter.toLowerCase())
  )
)
```

**Reusable for Labels Manager:** Use this for displaying tags in a table of tag definitions.

---

### 3. Comma-Separated Input Pattern

**State Management:**
```ts
const [tagsStr, setTagsStr] = React.useState("")
```

**Input UI:**
```tsx
<input
  placeholder="tag1, tag2"
  value={tagsStr}
  onChange={e => setTagsStr(e.target.value)}
/>
```

**Payload Conversion:**
```ts
tags: tagsStr.split(",").map(s => s.trim()).filter(Boolean)
```

**Limitation:** This is a primitive UX. Should be replaced with TagsPopover or a proper tag input component with chips.

---

### 4. API Request Pattern (`apps/platform/src/api.ts`)

**Tenant-Aware Request:**
```ts
async function request(url, options) {
  const tenantId = await ensureTenantId(baseUrl);
  const headers = {
    "x-tenant-id": String(tenantId),
    "content-type": "application/json"
  };
  return fetch(url, { ...options, headers });
}
```

**Resource Pattern:**
```ts
tags: {
  list: (module: "CONTACT") =>
    request(`${root}/tags${qs({ module })}`, { method: "GET" }),
  create: (body) =>
    request(`${root}/tags`, { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    request(`${root}/tags/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id) =>
    request(`${root}/tags/${id}`, { method: "DELETE" }),
}
```

**Reusable for Labels Manager:** Yes - add full CRUD methods to platform API.

---

### 5. Settings Tab Content Layout Pattern

**From DateValidationSettingsTab and other tabs:**
```tsx
<Card className="p-4 space-y-3">
  <h4 className="font-medium">Section Title</h4>
  <p className="text-sm text-secondary">Description text</p>

  <div className="space-y-4">
    {/* Content sections */}
  </div>

  <div className="flex gap-2 justify-end pt-3 border-t border-hairline">
    <Button onClick={handleSave}>Save</Button>
  </div>
</Card>
```

**Reusable for Labels Manager:** Yes - wrap tag manager UI in Card with this structure.

---

## G) Gap Analysis

### What EXISTS and WORKS
✅ **Database schema** - Tag and TagAssignment models fully defined with multi-entity support
✅ **API endpoints** - Complete CRUD for tags, assign/unassign operations
✅ **Service layer** - Party-aware tag service with backward compatibility
✅ **Tenant scoping** - Tags isolated per tenant per module
✅ **Migration history** - Clean evolution from v1 to Party-based storage
✅ **Animals module integration** - Basic tag input/display/filter working
✅ **Contacts module partial** - API wired, limited UI
✅ **Settings tab placeholder** - Navigation exists, ready for real implementation

### What EXISTS but CONFLICTS
⚠️ **Comma-separated input UX** - Primitive string input pattern conflicts with structured tag management
⚠️ **TagsPopover unused** - Built component exists but never integrated
⚠️ **Inconsistent UI patterns** - Animals shows tags in detail view; Contacts doesn't
⚠️ **No visual design** - Tags render as plain text; color field exists in DB but unused

### What is MISSING
❌ **Labels Manager UI** - No interface to create, edit, delete, or color tag definitions
❌ **Module grouping in settings** - Placeholder doesn't group tags by module
❌ **Tag assignment UI** - No rich UI for assigning existing tags (only comma-separated strings)
❌ **Tag chips/badges** - No visual components for displaying tags as colored pills
❌ **Bulk operations** - No UI for batch assigning/removing tags
❌ **Tag usage stats** - No UI showing how many entities use each tag
❌ **Contacts tag display** - PartyDetailsView has type but doesn't render tags
❌ **Waitlist tag UI** - Schema supports it; no UI exists
❌ **Offspring tag UI** - Schema supports it; minimal display-only UI
❌ **Tag autocomplete** - No typeahead when entering tags
❌ **Module-specific tag filtering** - Can't filter Animals page by Animal tags only

### Risks and Unknowns
🔶 **API module filter scope** - `/tags?module=ANIMAL` returns all Animal tags; unclear if UI needs per-page filtering
🔶 **Color field usage** - DB has color; no UI or API validation for hex codes
🔶 **Module immutability** - API prevents changing tag.module after creation; UI must respect this
🔶 **Assignment validation** - API enforces module matching; UI must prevent mismatched assignments
🔶 **Empty tag names** - API trims names and rejects empty; UI must validate
🔶 **Case sensitivity** - DB unique constraint is case-sensitive; UI search is case-insensitive
🔶 **Pagination** - `/tags` API supports pagination; unknown if needed in UI for typical tenant tag counts

### Migration/Cleanup Needed
🧹 **None** - Party migration complete; no legacy columns remain; schema is clean

---

## H) Recommended Naming Decision

**Use: TAG / TAGS**

**Evidence:**
1. **Database:** `Tag`, `TagAssignment`, `TagModule` enum
2. **API routes:** `/tags`, `/tags/:id/assign`
3. **Service:** `tag-service.ts`, `createTagAssignment()`
4. **UI components:** `TagsPopover.tsx`, `TagsTab`
5. **Code references:** 100% of occurrences use "tag" terminology
6. **Zero occurrences** of "Label" in codebase

**Search verification:**
```bash
# Monorepo
rg -i "label[s]?" apps/ packages/ -t ts -t js
# Result: Only HTML <label> elements and unrelated "label" props

# API repo
rg -i "label[s]?" src/ -t ts
# Result: Only form field labels, no data model references
```

**Recommendation:** Continue using **"Tag"** for consistency. Renaming to "Label" would require:
- 2 Prisma models renamed (breaking migration)
- API routes changed (breaking API consumers)
- Service files renamed
- 50+ UI references updated
- Test suites updated

**Cost/benefit:** High cost, zero benefit. "Tag" is the established term.

---

## Appendix: Search Commands Executed

### Monorepo Searches
```bash
cd "c:\Users\Aaron\Documents\Projects\breederhq"

# Count tag references
rg -i -t ts -t js -c "tag[s]?|label[s]?" | head -100

# Find TagsPopover usage
rg "from.*TagsPopover|import.*TagsPopover" -t ts -t js

# Find tag API calls
rg "\/tags|\/api.*tag" apps/ packages/ -t ts -t js

# Find Settings files
rg "Settings" apps/platform/src/ -t ts -t js -l
find apps/ -name "*Settings*.tsx"

# Find tag references in specific files
rg "tag" apps/animals/src/App-Animals.tsx -i -C 2
rg "tag" apps/contacts/src/PartyDetailsView.tsx -i -C 2
```

### API Repo Searches
```bash
cd "c:\Users\Aaron\Documents\Projects\breederhq-api"

# Count tag references
rg -i --type ts --type js -c "tag[s]?|label[s]?"

# Find Tag models in Prisma
rg "model Tag" prisma/schema.prisma -A 20
rg "enum TagModule" prisma/schema.prisma -A 15

# Find tag migrations
rg "CreateTable.*Tag|CreateEnum.*Tag" prisma/migrations/ --no-heading

# Find tag routes
rg "\/animals.*\/tags" src/routes/animals.ts -A 5 -B 5
```

### Files Read
- `breederhq-api/src/routes/tags.ts` (full)
- `breederhq-api/src/services/tag-service.ts` (full)
- `breederhq/packages/ui/src/components/TagsPopover/TagsPopover.tsx` (full)
- `breederhq/apps/platform/src/pages/SettingsPanel.tsx` (partial: TagsTab component)
- `breederhq/apps/animals/src/api.ts` (partial: tags endpoints)

---

**End of Recon Report**
