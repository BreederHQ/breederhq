# Species Terminology System - Enforcement & Future Development

**Date:** January 14, 2026
**Purpose:** Ensure ALL future development uses Species Terminology System
**Status:** Recommendations for automated enforcement

---

## 🎯 The Problem

### Current State: Manual & Fragile

**Developers must remember to:**
1. Import the Species Terminology System
2. Use the hook correctly
3. Avoid hardcoded species terms

**Risk:**
- ❌ Developer forgets and hardcodes "puppies"
- ❌ New feature doesn't use terminology system
- ❌ Inconsistent experience across platform

**Example of what can go wrong:**
```tsx
// ❌ Developer might write this (wrong):
<h1>Manage Puppies</h1>

// ✅ Should be this (correct):
const terms = useSpeciesTerminology(species);
<h1>Manage {terms.offspringNameCap(true)}</h1>
```

---

## ✅ Solutions: Automated Enforcement

### Solution 1: ESLint Rule (Recommended) ⭐

**Create custom ESLint rule to prevent hardcoded terms**

#### Status: ✅ **IMPLEMENTED**

**Rule File:** `.eslint/rules/no-hardcoded-species-terms.js` (created)
**Documentation:** `docs/ESLINT-SPECIES-TERMINOLOGY-RULE.md` (complete)

#### Quick Setup

1. **Install plugin:**
```bash
npm install --save-dev eslint-plugin-local-rules
```

2. **Configure ESLint:**
```json
// .eslintrc.json
{
  "plugins": ["local-rules"],
  "rules": {
    "local-rules/no-hardcoded-species-terms": "error"
  }
}
```

3. **Configure plugin:**
```json
// .eslintrc-local-rules.js (create in project root)
module.exports = {
  'no-hardcoded-species-terms': require('./.eslint/rules/no-hardcoded-species-terms'),
};
```

**See full documentation:** `docs/ESLINT-SPECIES-TERMINOLOGY-RULE.md`

#### What It Does

**Catches hardcoded terms:**
```tsx
// ❌ ESLint error: "Avoid hardcoded 'puppies'. Use Species Terminology System"
<h1>Manage Puppies</h1>

// ❌ ESLint error: "Avoid hardcoded 'foal'. Use Species Terminology System"
const title = "Foal Details";

// ✅ No error - using the system correctly
const terms = useSpeciesTerminology(species);
<h1>Manage {terms.offspringNameCap(true)}</h1>
```

**Banned terms include:**
- Offspring: puppy, kitten, foal, kit, kid, lamb, piglet, calf, chick, cria
- Birth: whelping, foaling, kindling, kidding, lambing, farrowing, calving, hatching
- Groups: litter, litters
- Parents: mare, stallion, doe, buck, ewe, ram, sow, boar, hen, rooster

**Exceptions (allowed):**
- Test files (*.test.ts, *.spec.ts)
- The implementation file itself (speciesTerminology.ts)
- Test data files

---

### Solution 2: TypeScript Type Guard

**Create a helper that requires species parameter:**

```typescript
// packages/ui/src/utils/speciesTerminology.ts

/**
 * Type guard to ensure species is provided
 * Use this in components to enforce terminology usage
 */
export function requireSpeciesContext<T>(
  species: string | null | undefined,
  render: (terms: SpeciesTerminology) => T
): T {
  if (!species) {
    throw new Error(
      'Species context required. Component must have access to species. ' +
      'Use Species Terminology System: useSpeciesTerminology(species)'
    );
  }

  const terms = getSpeciesTerminology(species);
  return render(terms);
}
```

**Usage:**
```tsx
function AnimalCard({ animal }) {
  return requireSpeciesContext(animal.species, (terms) => (
    <div>
      <h3>{terms.offspringNameCap()}</h3>
      {/* Forces developer to provide species */}
    </div>
  ));
}
```

---

### Solution 3: Component Templates

**Create standardized components that enforce terminology:**

```tsx
// packages/ui/src/components/SpeciesAwareText.tsx

import { useSpeciesTerminology } from '../hooks/useSpeciesTerminology';

type SpeciesAwareTextProps = {
  species: string;
  type: 'offspring' | 'birth' | 'group' | 'parentFemale' | 'parentMale';
  plural?: boolean;
  capitalize?: boolean;
  children?: never; // Prevent children - text is generated
};

/**
 * Component that automatically displays species-appropriate terminology
 * Prevents hardcoding by generating text from species
 */
export function SpeciesAwareText({
  species,
  type,
  plural = false,
  capitalize = false
}: SpeciesAwareTextProps) {
  const terms = useSpeciesTerminology(species);

  let text: string;

  switch (type) {
    case 'offspring':
      text = plural
        ? (capitalize ? terms.offspring.pluralCap : terms.offspring.plural)
        : (capitalize ? terms.offspring.singularCap : terms.offspring.singular);
      break;
    case 'birth':
      text = capitalize ? terms.birth.processCap : terms.birth.process;
      break;
    case 'group':
      text = plural
        ? (capitalize ? terms.group.pluralCap : terms.group.plural)
        : (capitalize ? terms.group.singularCap : terms.group.singular);
      break;
    case 'parentFemale':
      text = capitalize ? terms.parents.femaleCap : terms.parents.female;
      break;
    case 'parentMale':
      text = capitalize ? terms.parents.maleCap : terms.parents.male;
      break;
  }

  return <>{text}</>;
}
```

**Usage:**
```tsx
// ❌ Can't hardcode - component generates text
<h1>Manage <SpeciesAwareText species={species} type="offspring" plural capitalize /></h1>
// Renders: "Manage Foals" for horses, "Manage Puppies" for dogs
```

---

### Solution 4: Documentation & Onboarding

**Developer onboarding checklist:**

```markdown
# New Developer Onboarding - Species Terminology

## ✅ Checklist for All Developers

Before writing any UI code that displays species-related terms:

- [ ] Read: docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md
- [ ] Understand: Platform supports 11 species
- [ ] Never hardcode: puppy, foal, kitten, etc.
- [ ] Always use: `useSpeciesTerminology(species)` hook
- [ ] Check ESLint: No warnings about hardcoded terms
- [ ] Test with: Multiple species (dog, horse, goat)

## ❌ Never Do This

```tsx
<h1>Manage Puppies</h1>  // Hardcoded!
const title = "Foal Details";  // Hardcoded!
```

## ✅ Always Do This

```tsx
const terms = useSpeciesTerminology(species);
<h1>Manage {terms.offspringNameCap(true)}</h1>
const title = `${terms.offspringNameCap()} Details`;
```
```

**Add to:**
- README.md
- CONTRIBUTING.md
- Developer onboarding docs
- Pull request template

---

### Solution 5: CI/CD Pipeline Check

**Add to GitHub Actions / CI pipeline:**

```yaml
# .github/workflows/terminology-check.yml
name: Species Terminology Check

on: [pull_request]

jobs:
  terminology-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint (Species Terminology)
        run: npm run lint
        # This will fail if hardcoded terms are found

      - name: Check for hardcoded terms (backup)
        run: |
          # Grep for common hardcoded terms
          if grep -r "puppy\|puppies\|foal\|foals\|litter" apps/*/src --include="*.tsx" --include="*.ts" --exclude-dir=node_modules --exclude="*.test.*" --exclude="*.spec.*"; then
            echo "❌ Found hardcoded species terminology!"
            echo "Use Species Terminology System instead."
            exit 1
          fi
          echo "✅ No hardcoded terminology found"
```

**Result:** Pull requests with hardcoded terms **cannot merge**.

---

### Solution 6: Pull Request Template

**Add reminder to PR template:**

```markdown
# Pull Request Template

## Description
[Describe your changes]

## Species Terminology Checklist

If your PR adds UI that displays species-related terms:

- [ ] I used `useSpeciesTerminology` hook (not hardcoded terms)
- [ ] I tested with multiple species (dog, horse, etc.)
- [ ] ESLint passes with no terminology warnings
- [ ] No hardcoded "puppy", "foal", "litter", etc.

**N/A:** [ ] This PR doesn't involve species terminology
```

---

## 📋 Implementation Roadmap

### Phase 1: Prevent New Issues (Immediate)

**Priority: HIGH**

1. **Add ESLint rule** (30 min)
   - [x] Create rule file (done)
   - [ ] Install eslint-plugin-local-rules
   - [ ] Configure in .eslintrc.json
   - [ ] Test on existing code

2. **Add to CI/CD** (15 min)
   - [ ] Add terminology-check.yml workflow
   - [ ] Require check to pass before merge

3. **Update documentation** (15 min)
   - [ ] Add to CONTRIBUTING.md
   - [ ] Add to README.md
   - [ ] Update PR template

**Total: 1 hour**

### Phase 2: Fix Existing Issues (As Needed)

**Priority: MEDIUM**

4. **Integrate into Marketplace** (4-6 hours)
   - [ ] Add to ManageAnimalsPage.tsx
   - [ ] Add to AnimalProgramsPage.tsx
   - [ ] Add to ProgramDetailPage.tsx
   - [ ] Add to public marketplace pages
   - [ ] Test with all species

5. **Audit all apps** (2 hours)
   - [ ] Search for hardcoded terms
   - [ ] Fix or document exceptions
   - [ ] Verify ESLint catches all

### Phase 3: Developer Experience (Optional)

**Priority: LOW**

6. **Create helper components** (2 hours)
   - [ ] SpeciesAwareText component
   - [ ] SpeciesAwareHeading component
   - [ ] Document usage

7. **Developer training** (1 hour)
   - [ ] Team presentation
   - [ ] Live coding demo
   - [ ] Q&A session

---

## 🎯 Recommended Approach

### Minimum Viable Enforcement

**Do these 3 things (1 hour total):**

1. ✅ Add ESLint rule
2. ✅ Add CI/CD check
3. ✅ Update CONTRIBUTING.md

**Result:** Future PRs with hardcoded terms **will be blocked automatically**.

### Gold Standard

**Add these too (2-3 hours more):**

4. ✅ Integrate into marketplace
5. ✅ Create helper components
6. ✅ Developer training session

**Result:** System is **impossible to bypass** and **easy to use correctly**.

---

## 📊 Enforcement Levels

| Level | What It Does | Effort | Effectiveness |
|-------|--------------|--------|---------------|
| **None** | Hope developers remember | 0 hours | ⚠️ 30% compliance |
| **Documentation** | Write docs, hope they read | 0.5 hours | ⚠️ 50% compliance |
| **ESLint Warning** | Warn but allow merge | 1 hour | 🟡 70% compliance |
| **ESLint Error** | Block build, allow override | 1 hour | ✅ 85% compliance |
| **CI/CD Block** | Cannot merge with violations | 1.5 hours | ✅✅ 95% compliance |
| **Helper Components** | Make correct way easiest way | 3 hours | ✅✅✅ 99% compliance |

**Recommendation:** Implement **CI/CD Block** level (1.5 hours, 95% compliance)

---

## 🚀 Quick Start Guide

### Enable Enforcement Today (30 minutes)

```bash
# 1. Install ESLint plugin
npm install --save-dev eslint-plugin-local-rules

# 2. Add rule to .eslintrc.json
# (Use .eslintrc-species-terminology.json as template)

# 3. Test it works
npm run lint

# 4. See errors for hardcoded terms
# Fix them or add to exceptions

# 5. Commit and push
git add .
git commit -m "Add Species Terminology System enforcement"
git push
```

---

## 💡 Long-Term Vision

### Self-Enforcing System

**Goal:** Make it **easier to do it right** than to do it wrong.

**How:**
1. ESLint catches mistakes immediately (red squiggles in IDE)
2. CI/CD blocks bad code from merging
3. Helper components make correct usage simple
4. Documentation is clear and accessible
5. New developers are trained from day 1

**Result:** Species Terminology System becomes **natural part of development** workflow, not an afterthought.

---

## ✅ Success Criteria

### You'll know enforcement is working when:

- [ ] No hardcoded species terms in new PRs
- [ ] Developers automatically use `useSpeciesTerminology`
- [ ] ESLint catches mistakes before code review
- [ ] CI/CD blocks violations
- [ ] All apps use consistent terminology
- [ ] New team members follow pattern naturally

---

## 📞 Support

### Questions?

- **Technical:** See docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md
- **Implementation:** See this document
- **Help:** Ask development team lead

---

**Document Version:** 1.0
**Date:** January 14, 2026
**Status:** Recommendations for implementation
**Next Step:** Install ESLint rule and CI/CD check (1 hour)
