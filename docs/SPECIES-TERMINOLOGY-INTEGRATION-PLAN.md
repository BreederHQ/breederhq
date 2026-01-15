# Species Terminology System - Integration Plan
**Date:** January 14, 2026
**Task:** Apply STS to all modules that need it

---

## 🎯 Current Status

### ✅ Already Integrated (Phase 2)
- **platform** (2 uses)
  - OffspringGroupCards.tsx
  - BreedingPipeline.tsx
- **offspring** (1 use)
  - CollarPicker.tsx

### ❌ Not Integrated (Needs Work)
- **marketplace** - Public-facing breeder/buyer pages
- **animals** - Animal management
- **breeding** - Breeding management
- **bloodlines** - Bloodline tracking
- **portal** - Client portal

### ⚠️ Probably Not Needed
- **admin** - Admin tools (generic)
- **contacts** - Contact management (generic)
- **finance** - Financial management (generic)
- **marketing** - Marketing pages (generic)
- **waitlist** - Waitlist management (generic)

---

## 📋 Integration Plan

### Priority 1: Marketplace (HIGH) - ✅ **COMPLETE**

**Why:** Public-facing, visible to all users

**Status:** Integrated on January 14, 2026

**Files Updated:**

1. ✅ **apps/marketplace/src/marketplace/components/ProgramTile.tsx**
   - Replaced "View litters →" with species-aware terminology
   - Added species prop, integrated useSpeciesTerminology hook

2. ✅ **apps/marketplace/src/marketplace/pages/AnimalsIndexPage.tsx**
   - Updated AnimalCard and AnimalListRow badges with species-aware labels
   - Fixed empty state message

3. ✅ **apps/marketplace/src/marketplace/pages/BreedingProgramPage.tsx**
   - Updated program stats with species-aware labels ("Upcoming Litters" → "Upcoming {terms.group.pluralCap}")
   - Updated contact form dropdown options

**Files Checked (No Updates Needed):**
- `AnimalProgramTile.tsx` - No hardcoded terms found
- `ManageAnimalsPage.tsx` - No hardcoded terms found (management UI)
- `AnimalProgramsPage.tsx` - No hardcoded terms found

**See:** `docs/MARKETPLACE-STS-INTEGRATION-REPORT.md` for complete details

---

### Priority 2: Animals Module (MEDIUM) - 2-3 hours

**Why:** Core animal management functionality

**Files to Update:**
- Animal listing pages
- Animal detail pages
- Animal forms/editors

---

### Priority 3: Breeding Module (MEDIUM) - 2-3 hours

**Why:** Core breeding functionality

**Files to Update:**
- Breeding plan pages
- Breeding attempt pages
- Offspring tracking

---

### Priority 4: Portal (LOW) - 1-2 hours

**Why:** Client-facing portal, good to have

**Files to Update:**
- Client dashboard
- Client animal views

---

## 🚀 Implementation Approach

### Step-by-Step Process

For each file:

1. **Read the file** - Understand current implementation
2. **Identify hardcoded terms** - Find "litter", "puppy", "whelping", etc.
3. **Add import** - `import { useSpeciesTerminology } from '@bhq/ui'`
4. **Add species prop** - If not already available
5. **Use hook** - `const terms = useSpeciesTerminology(species)`
6. **Replace hardcoded text** - Use `terms.offspringName()`, etc.
7. **Test** - Verify with multiple species

---

## 📝 Template for Updates

### Before (Hardcoded):
```tsx
export function ProgramTile({ slug, name, location, photoUrl }: Props) {
  return (
    <div>
      <span>View litters →</span>  {/* ❌ Hardcoded */}
    </div>
  );
}
```

### After (Species-Aware):
```tsx
import { useSpeciesTerminology } from '@bhq/ui';

export function ProgramTile({
  slug,
  name,
  location,
  photoUrl,
  species  // ← Add species prop
}: Props) {
  const terms = useSpeciesTerminology(species);  // ← Use hook

  return (
    <div>
      <span>View {terms.group.plural} →</span>  {/* ✅ Species-aware */}
    </div>
  );
}
```

---

## ⏱️ Time Estimates

| Module | Priority | Files | Effort | Total |
|--------|----------|-------|--------|-------|
| marketplace | HIGH | 6-8 | 30-45 min each | 4-6 hours |
| animals | MEDIUM | 4-6 | 20-30 min each | 2-3 hours |
| breeding | MEDIUM | 4-6 | 20-30 min each | 2-3 hours |
| portal | LOW | 2-3 | 20-30 min each | 1-2 hours |
| **TOTAL** | - | **16-23** | - | **9-14 hours** |

---

## ✅ Success Criteria

- [ ] No hardcoded species terms in marketplace
- [ ] All public-facing pages use species terminology
- [ ] Horse breeders see "foals" not "puppies"
- [ ] Dog breeders see "litters" not generic terms
- [ ] ESLint passes with no warnings
- [ ] Manual testing with 3+ species confirms accuracy

---

**Status:** Ready to implement
**Next Step:** Start with marketplace module
