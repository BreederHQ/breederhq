# BreederHQ Documentation Structure

**Date:** January 14, 2026
**Purpose:** Explain how documentation is organized

---

## 🎯 Current Structure (January 2026)

```
breederhq/
├── docs/
│   ├── horses/                        # Horse breeding implementation docs
│   │   │
│   │   ├── Platform-Wide Features (should be moved eventually):
│   │   │   ├── SPECIES-TERMINOLOGY-SYSTEM.md      # ← ALL 11 species
│   │   │   ├── ARCHITECTURE-DIAGRAM.md            # ← Platform architecture
│   │   │   ├── TESTING-GUIDE.md                   # ← Platform testing
│   │   │   └── TESTING-IMPLEMENTATION-SUMMARY.md  # ← Test infrastructure
│   │   │
│   │   └── Horse-Specific Features:
│   │       ├── README.md                          # Entry point
│   │       ├── HORSE-LAUNCH-READINESS-REPORT.md   # Horse launch assessment
│   │       ├── BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md  # DB analysis
│   │       ├── PHASE-2-IMPLEMENTATION-SUMMARY.md  # Implementation details
│   │       ├── COMPLETE-IMPLEMENTATION-STATUS.md  # Overall status
│   │       ├── DEPLOYMENT-CHECKLIST.md            # Deployment steps
│   │       └── FINAL-DELIVERY-SUMMARY.md          # Executive summary
│   │
│   ├── marketplace/                   # Marketplace features
│   ├── api/                           # API documentation
│   └── guides/                        # General guides
│
└── e2e/
    ├── README.md                      # E2E testing setup
    ├── species-terminology.spec.ts    # ← Platform-wide tests
    └── helpers/
        └── test-data.ts               # Test helpers
```

---

## 📝 Why Some Docs Are in `horses/`

### Historical Context

The **Species Terminology System** was created as part of the **horse breeding launch project**. That's why all documentation currently lives in `docs/horses/`.

However, the system itself is **platform-wide** and supports:
- DOG
- CAT
- HORSE ← (Horse was the trigger, not the scope)
- RABBIT
- GOAT
- SHEEP
- PIG
- CATTLE
- CHICKEN
- ALPACA
- LLAMA

---

## ✅ Correct Conceptual Organization

### What Should Be Platform-Wide

These documents describe **platform-wide features** that apply to ALL species:

| Document | Current Location | Scope | Should Be |
|----------|-----------------|-------|-----------|
| **SPECIES-TERMINOLOGY-SYSTEM.md** | `docs/horses/` | **All 11 species** | `docs/platform/species-terminology/` |
| **ARCHITECTURE-DIAGRAM.md** | `docs/horses/` | **Platform architecture** | `docs/platform/species-terminology/` |
| **TESTING-GUIDE.md** | `docs/horses/` | **All species testing** | `docs/platform/species-terminology/` |
| **TESTING-IMPLEMENTATION-SUMMARY.md** | `docs/horses/` | **Platform testing** | `docs/platform/species-terminology/` |

### What Is Actually Horse-Specific

These documents are **specific to horse breeding launch**:

| Document | Current Location | Scope | Correctly Placed |
|----------|-----------------|-------|------------------|
| **HORSE-LAUNCH-READINESS-REPORT.md** | `docs/horses/` | Horse launch | ✅ Yes |
| **BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md** | `docs/horses/` | Horse DB analysis | ✅ Yes |
| **PHASE-2-IMPLEMENTATION-SUMMARY.md** | `docs/horses/` | Implementation | ⚠️ Mixed (some platform, some horse) |
| **DEPLOYMENT-CHECKLIST.md** | `docs/horses/` | Deployment | ⚠️ Could be platform-wide |
| **FINAL-DELIVERY-SUMMARY.md** | `docs/horses/` | Project summary | ⚠️ Mixed |
| **COMPLETE-IMPLEMENTATION-STATUS.md** | `docs/horses/` | Status | ⚠️ Mixed |

---

## 🎯 Recommended Future Structure

```
breederhq/
├── docs/
│   │
│   ├── platform/                      # ← Platform-wide features
│   │   │
│   │   ├── species-terminology/       # ← Species system (all 11 species)
│   │   │   ├── README.md              # "This system supports all species"
│   │   │   ├── API-REFERENCE.md       # How to use the hook
│   │   │   ├── ARCHITECTURE.md        # System design
│   │   │   ├── TESTING.md             # Testing procedures
│   │   │   ├── ALL-SPECIES.md         # Coverage matrix for all 11
│   │   │   └── IMPLEMENTATION.md      # Technical implementation
│   │   │
│   │   ├── breeding-system/           # Core breeding features
│   │   ├── offspring-module/          # Offspring tracking
│   │   └── marketplace/               # Marketplace features
│   │
│   └── features/                      # ← Feature launches
│       │
│       ├── horses/                    # ← Horse breeding launch
│       │   ├── README.md              # "Horse launch used Species Terminology System"
│       │   ├── LAUNCH-READINESS.md    # Horse launch readiness
│       │   ├── DATABASE-ANALYSIS.md   # Horse DB compatibility
│       │   ├── DEPLOYMENT.md          # Horse launch deployment
│       │   └── PROJECT-SUMMARY.md     # Horse project summary
│       │
│       ├── goats/                     # Future: Goat-specific features
│       └── marketplace-v2/            # Future: Marketplace updates
│
└── e2e/
    └── species-terminology.spec.ts    # Platform-wide tests
```

---

## 🔍 Finding Documentation

### "I need Species Terminology System docs"

**Current (January 2026):**
```
docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md
docs/horses/ARCHITECTURE-DIAGRAM.md
```

**Future (Recommended):**
```
docs/platform/species-terminology/README.md
docs/platform/species-terminology/API-REFERENCE.md
```

### "I need horse launch docs"

**Current (January 2026):**
```
docs/horses/README.md                  # ← Start here
docs/horses/HORSE-LAUNCH-READINESS-REPORT.md
docs/horses/BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md
```

**Future (Recommended):**
```
docs/features/horses/README.md         # ← Start here
docs/features/horses/LAUNCH-READINESS.md
docs/features/horses/DATABASE-ANALYSIS.md
```

---

## 💡 Key Insight

### The Confusion

**Folder name suggests:** "This is about horses"
**Actual content:** "This is about a platform-wide system that supports 11 species, which happened to be implemented for the horse launch"

### The Relationship

```
Horse Launch Project
└── Required: Species Terminology System
    └── Scope: Platform-wide (all 11 species)
        └── Implementation: Done as part of horse launch
            └── Benefit: All species, not just horses
```

**Analogy:**
- You built a house (horse launch)
- You needed a foundation (Species Terminology System)
- The foundation supports the whole property (platform), not just one house

---

## 📋 Migration Plan (Optional)

If you want to reorganize later:

### Step 1: Create New Structure
```bash
mkdir -p docs/platform/species-terminology
mkdir -p docs/features/horses
```

### Step 2: Move Platform-Wide Docs
```bash
# Species Terminology System (platform-wide)
mv docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md \
   docs/platform/species-terminology/API-REFERENCE.md

mv docs/horses/ARCHITECTURE-DIAGRAM.md \
   docs/platform/species-terminology/ARCHITECTURE.md

mv docs/horses/TESTING-GUIDE.md \
   docs/platform/species-terminology/TESTING.md
```

### Step 3: Move Horse-Specific Docs
```bash
# Horse launch (feature-specific)
mv docs/horses/HORSE-LAUNCH-READINESS-REPORT.md \
   docs/features/horses/LAUNCH-READINESS.md

mv docs/horses/BREEDING-MODEL-COMPATIBILITY-ANALYSIS.md \
   docs/features/horses/DATABASE-ANALYSIS.md
```

### Step 4: Update Cross-References
```bash
# Update all internal links in documents
# Update README.md files
# Update e2e/README.md references
```

### Step 5: Add Redirect Note
```bash
# In docs/horses/README.md
echo "# Moved!
This documentation has been reorganized:
- Platform features → docs/platform/species-terminology/
- Horse launch → docs/features/horses/
See docs/DOCUMENTATION-STRUCTURE.md for details."
```

---

## ⚠️ Current State: Acceptable

### Why It's OK to Leave As-Is For Now

1. **All docs are findable** - Clear README.md guides you
2. **No confusion in practice** - Docs clearly state "11 species"
3. **Low priority** - System works, docs are complete
4. **Future refactor** - Can reorganize anytime

### When to Reorganize

Consider reorganizing when:
- [ ] Adding another species-specific feature (e.g., goat breeding)
- [ ] Adding another platform-wide feature
- [ ] New team members get confused by structure
- [ ] You have 2+ hours for documentation maintenance

---

## 📚 How to Reference Docs

### In Code Comments

```typescript
/**
 * Species Terminology System
 *
 * Platform-wide feature supporting all 11 species.
 *
 * Docs: docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md
 * Note: Despite folder name, this is NOT horse-specific.
 *
 * @see https://github.com/yourorg/breederhq/blob/main/docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md
 */
```

### In READMEs

```markdown
## Species Terminology System

**Location:** `docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md`

**Note:** Despite being in the `horses/` folder, this system is platform-wide
and supports all 11 species. It was implemented as part of the horse breeding
launch but applies to the entire platform.
```

---

## ✅ Summary

### Current Reality
- ✅ All docs are in `docs/horses/`
- ⚠️ Some docs are platform-wide, some are horse-specific
- ✅ All docs clearly state their scope (11 species mentioned)
- ✅ README.md helps with discovery

### Ideal Future
- ✅ Platform-wide docs in `docs/platform/species-terminology/`
- ✅ Horse-specific docs in `docs/features/horses/`
- ✅ Clear separation of concerns
- ✅ Scalable for future features

### Action Required
- **Now:** None - current structure works
- **Future:** Optional reorganization when convenient
- **Always:** Clearly document scope in each file

---

**Current Status:** ✅ Acceptable (works, but could be improved)

**Future Action:** Optional reorganization for clarity

**Priority:** Low (cosmetic improvement, no functional impact)

---

**Document Version:** 1.0
**Date:** January 14, 2026
**Purpose:** Explain current structure and future options
