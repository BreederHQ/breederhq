# ESLint Rule: No Hardcoded Species Terms

**File:** `.eslint/rules/no-hardcoded-species-terms.js`
**Rule Name:** `no-hardcoded-species-terms`
**Type:** Problem (Error)
**Category:** Best Practices
**Status:** ✅ Implemented

---

## 🎯 Purpose

Automatically detect and prevent hardcoded species-specific terminology in UI code. This rule ensures all developers use the **Species Terminology System (STS)** instead of hardcoding terms like "puppy", "foal", "litter", etc.

---

## 📋 What It Does

### Detects Hardcoded Terms

The rule scans all string literals and template literals for hardcoded species terminology and reports violations with helpful error messages.

**Banned Terms (42 total):**

#### Offspring Terms (20)
- `puppy`, `puppies` (dogs)
- `kitten`, `kittens` (cats)
- `foal`, `foals` (horses)
- `kit`, `kits` (rabbits)
- `kid`, `kids` (goats)
- `lamb`, `lambs` (sheep)
- `piglet`, `piglets` (pigs)
- `calf`, `calves` (cattle)
- `chick`, `chicks` (chickens)
- `cria`, `crias` (alpacas/llamas)

#### Birth Process Terms (16)
- `whelping`, `whelped` (dogs)
- `foaling`, `foaled` (horses)
- `kindling`, `kindled` (rabbits)
- `kidding`, `kidded` (goats)
- `lambing`, `lambed` (sheep)
- `farrowing`, `farrowed` (pigs)
- `calving`, `calved` (cattle)
- `hatching`, `hatched` (chickens)

#### Group Terms (2)
- `litter`, `litters`

#### Parent Terms (10)
- `mare`, `stallion` (horses)
- `doe`, `buck` (rabbits/goats)
- `ewe`, `ram` (sheep)
- `sow`, `boar` (pigs)
- `hen`, `rooster` (chickens)

---

## 🚫 Examples of Violations

### ❌ Hardcoded String Literals

```tsx
// ❌ ESLint error
function AnimalCard() {
  return <span>View litters →</span>;
}

// ❌ ESLint error
const message = "Next litter available soon";

// ❌ ESLint error
const title = "Foal Details";
```

**Error Message:**
```
Avoid hardcoded "litter". Use Species Terminology System: import { useSpeciesTerminology } from "@bhq/ui"
```

### ❌ Hardcoded Template Literals

```tsx
// ❌ ESLint error
const label = `Upcoming ${count} puppies`;

// ❌ ESLint error
const heading = `${name}'s foals`;
```

---

## ✅ Correct Usage

### Use Species Terminology System

```tsx
// ✅ Correct - uses STS
import { useSpeciesTerminology } from "@bhq/ui";

function AnimalCard({ species }) {
  const terms = useSpeciesTerminology(species);
  return <span>View {terms.group.plural} →</span>;
}

// ✅ Correct - uses STS
function ProgramStats({ species, count }) {
  const terms = useSpeciesTerminology(species);
  const label = `Upcoming ${count} ${terms.offspring.plural}`;
  return <div>{label}</div>;
}

// ✅ Correct - uses STS
function OffspringTitle({ species, name }) {
  const terms = useSpeciesTerminology(species);
  const heading = `${name}'s ${terms.offspring.plural}`;
  return <h1>{heading}</h1>;
}
```

---

## ⚙️ Implementation Details

### Rule Structure

```javascript
module.exports = {
  meta: {
    type: 'problem',              // Severity: error
    docs: {
      description: 'Disallow hardcoded species-specific terminology',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,                // No auto-fix available
    schema: [],                   // No configuration options
    messages: {
      hardcodedTerm: 'Avoid hardcoded "{{term}}". Use Species Terminology System...',
    },
  },

  create(context) {
    const BANNED_TERMS = ['puppy', 'puppies', 'foal', 'foals', ...];
    const pattern = new RegExp(`\\b(${BANNED_TERMS.join('|')})\\b`, 'i');

    return {
      // Check string literals
      Literal(node) {
        if (typeof node.value === 'string') {
          const match = node.value.match(pattern);
          if (match) {
            context.report({ node, messageId: 'hardcodedTerm', data: { term: match[0] } });
          }
        }
      },

      // Check template literals
      TemplateLiteral(node) {
        node.quasis.forEach((quasi) => {
          const match = quasi.value.raw.match(pattern);
          if (match) {
            context.report({ node: quasi, messageId: 'hardcodedTerm', data: { term: match[0] } });
          }
        });
      },
    };
  },
};
```

### How It Works

1. **Pattern Matching:** Creates a regex pattern from all banned terms with word boundaries (`\b`)
2. **Case-Insensitive:** Matches "puppy", "Puppy", "PUPPY", etc.
3. **Literal Scanning:** Checks all string literals in the code
4. **Template Scanning:** Checks all template literal static portions
5. **Reporting:** Reports each violation with the detected term in the error message

---

## 🔧 Installation & Configuration

### Step 1: Install ESLint Plugin for Local Rules

```bash
npm install --save-dev eslint-plugin-local-rules
```

### Step 2: Configure ESLint

**Option A: Using `.eslintrc.json`**

```json
{
  "plugins": ["local-rules"],
  "rules": {
    "local-rules/no-hardcoded-species-terms": "error"
  }
}
```

**Option B: Using `.eslintrc.js`**

```javascript
module.exports = {
  plugins: ['local-rules'],
  rules: {
    'local-rules/no-hardcoded-species-terms': 'error',
  },
};
```

### Step 3: Configure Local Rules Plugin

Create **`.eslintrc-local-rules.js`** in project root:

```javascript
module.exports = {
  'no-hardcoded-species-terms': require('./.eslint/rules/no-hardcoded-species-terms'),
};
```

**OR** add to **`package.json`**:

```json
{
  "eslint-plugin-local-rules": {
    "rules": {
      "no-hardcoded-species-terms": ".eslint/rules/no-hardcoded-species-terms.js"
    }
  }
}
```

### Step 4: Verify Installation

```bash
npm run lint

# Should show errors for any hardcoded terms
```

---

## 🎯 When the Rule Triggers

### Files Checked
- ✅ All `.ts` and `.tsx` files in `apps/*/src`
- ✅ All `.ts` and `.tsx` files in `packages/*/src`

### Files Excluded (Recommended)
- ❌ Test files (`*.test.ts`, `*.spec.ts`)
- ❌ Test data files (`test-data.ts`, `fixtures/*`)
- ❌ The implementation file itself (`speciesTerminology.ts`)
- ❌ Node modules (`node_modules/*`)

**Configure exclusions in `.eslintignore`:**
```
**/*.test.ts
**/*.spec.ts
**/test-data.ts
**/fixtures/**
packages/ui/src/utils/speciesTerminology.ts
```

---

## 💡 Examples in Real Code

### Before (Violations)

```tsx
// apps/marketplace/src/marketplace/components/ProgramTile.tsx
export function ProgramTile({ slug, name }: Props) {
  return (
    <div>
      <span>View litters →</span>  {/* ❌ ESLint error */}
    </div>
  );
}
```

### After (Fixed)

```tsx
// apps/marketplace/src/marketplace/components/ProgramTile.tsx
import { useSpeciesTerminology } from "@bhq/ui";

export function ProgramTile({ slug, name, species }: Props) {
  const terms = useSpeciesTerminology(species);
  return (
    <div>
      <span>View {terms.group.plural} →</span>  {/* ✅ No error */}
    </div>
  );
}
```

---

## 🚀 Benefits

### 1. **Automatic Detection**
- Catches mistakes immediately in IDE (with ESLint extension)
- Red squiggles appear under hardcoded terms
- Prevents code from being committed with violations

### 2. **Helpful Error Messages**
- Shows exactly which term is hardcoded
- Provides clear guidance on how to fix it
- Links to Species Terminology System documentation

### 3. **Consistent Codebase**
- Enforces use of STS across entire platform
- Prevents new hardcoded terms from being introduced
- Ensures all future development is species-aware

### 4. **Developer Education**
- Teaches developers about STS through errors
- Encourages best practices
- Reduces code review burden

---

## 🔍 Integration with CI/CD

### GitHub Actions Example

```yaml
# .github/workflows/lint.yml
name: Lint Code

on: [pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint
        run: npm run lint
        # This will fail if hardcoded terms are found
```

**Result:** Pull requests with hardcoded species terms **cannot merge** until fixed.

---

## 🛠️ Customization

### Add More Terms

```javascript
// .eslint/rules/no-hardcoded-species-terms.js
const BANNED_TERMS = [
  // ... existing terms ...
  'joey', 'joeys',  // Add kangaroo terms
  'calf', 'calves', // Already included, but as example
];
```

### Adjust Severity

Change from `error` to `warn`:

```json
{
  "rules": {
    "local-rules/no-hardcoded-species-terms": "warn"
  }
}
```

### Add Exceptions

Create an override for specific files:

```json
{
  "overrides": [
    {
      "files": ["apps/marketing/**/*.tsx"],
      "rules": {
        "local-rules/no-hardcoded-species-terms": "off"
      }
    }
  ]
}
```

---

## 📊 Current Status

### Implementation
- ✅ Rule file created (`.eslint/rules/no-hardcoded-species-terms.js`)
- ✅ Rule tested and validated
- ⏳ Pending: Install `eslint-plugin-local-rules`
- ⏳ Pending: Configure in `.eslintrc.json`
- ⏳ Pending: Add to CI/CD pipeline

### Next Steps
1. Run `npm install --save-dev eslint-plugin-local-rules`
2. Add configuration to `.eslintrc.json`
3. Create `.eslintrc-local-rules.js` configuration file
4. Add to CI/CD workflow
5. Run `npm run lint` to catch existing violations
6. Fix any violations found

---

## 🎓 Developer Onboarding

### For New Developers

When you see this error:
```
Avoid hardcoded "puppy". Use Species Terminology System: import { useSpeciesTerminology } from "@bhq/ui"
```

**Do this:**

1. **Import the hook:**
   ```tsx
   import { useSpeciesTerminology } from "@bhq/ui";
   ```

2. **Get the species from props/context:**
   ```tsx
   function MyComponent({ species }) {
     const terms = useSpeciesTerminology(species);
   ```

3. **Use the terminology:**
   ```tsx
   return <span>{terms.offspring.plural}</span>;
   ```

**Need help?** See:
- `docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md` - Full API reference
- `docs/SPECIES-TERMINOLOGY-ENFORCEMENT.md` - Enforcement guide
- `packages/ui/src/utils/speciesTerminology.ts` - Implementation

---

## ✅ Success Criteria

### You'll know it's working when:
- [ ] ESLint shows errors for hardcoded terms in IDE
- [ ] `npm run lint` fails with hardcoded terms
- [ ] CI/CD blocks PRs with violations
- [ ] Developers automatically use `useSpeciesTerminology`
- [ ] No new hardcoded terms in codebase

---

## 📞 Support

**Questions?**
- Technical: See `docs/horses/SPECIES-TERMINOLOGY-SYSTEM.md`
- Implementation: See this document
- Help: Ask development team lead

---

**Document Version:** 1.0
**Date:** January 14, 2026
**Status:** Implementation complete, pending activation
**Author:** Claude Code (Sonnet 4.5)
