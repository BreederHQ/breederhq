# Marketing Site Review - Gaps & Misalignments

**Review Date:** January 2026
**Reviewed Against:** BreederHQ platform codebase (13 apps, 5 packages)
**Marketing Site:** breederhq-www repository

---

## Critical Issues (Fixed)

### 1. ~~"Pro Plan" vs "Professional Plan" Inconsistency~~
- **Location:** breeding-intelligence.astro FAQ
- **Issue:** FAQ referenced "Pro plan" but pricing page shows "Professional"
- **Status:** ✅ Fixed - Changed to "Professional plan"

### 2. ~~"AI-Powered" Overclaims~~
- **Locations:** index.astro (features section, "What Makes Different" section)
- **Issue:** Marketing claimed "AI-powered" for genetics tools that use standard Punnett square mathematics and Monte Carlo simulation, not actual AI/ML
- **Status:** ✅ Fixed - Changed to "Data-driven" and "Genetics-Powered"

---

## Significant Gaps

### Features Missing from Prominent Marketing

| Feature | Platform Location | Current Coverage | Recommendation |
|---------|------------------|------------------|----------------|
| **Financial Dashboard** | apps/finance/src/ | None | Create dedicated workflow page |
| **Expense Tracking (12 categories)** | packages/api/src/resources/expenses.ts | FAQ only | Add to visible features section |
| **Communications Hub** | apps/contacts/src/components/Communications/ | None | Create workflow page or add to client-portal |
| **Email/SMS Templates** | packages/api/src/resources/message-templates.ts | None | Document in communications workflow |
| **Waitlist Management** | apps/waitlist/src/ | Brief mention | Expand coverage |
| **Task Management System** | packages/api/src/resources/tasks.ts | None | Add to business tools section |
| **Document Management** | apps/platform/src/components/documents/ | Minimal | Expand coverage |
| **E-Signature System** | Uses Dropbox Sign API | Brief mention | Highlight as key differentiator |

### Client Portal Undersold

The Client Portal is a major differentiator but marketing barely covers it:

**What exists in code:**
- Full dashboard with action items
- Payment processing via Stripe
- E-signature for contracts/agreements
- Photo galleries and updates
- Document access
- Communication history
- Litter progress tracking

**What marketing says:**
- "24/7 access to updates" (one line)

**Recommendation:** Create dedicated Client Portal workflow page showcasing the full buyer experience.

### Marketplace Features Undersold

**What exists in code:**
- Breeder profiles with verification badges
- Animal/litter listings
- Breeding program pages
- Search and filtering
- Inquiry system
- Service provider listings (vets, trainers, groomers, photographers)

**What marketing emphasizes:**
- General marketplace concept
- "Two-sided marketplace" positioning

**Recommendation:** Add visual tour of marketplace features, buyer journey, breeder benefits.

---

## Messaging Misalignments

### 1. Genetics Tools Complexity

**Problem:** Marketing makes genetics tools sound simple ("predict offspring outcomes") but the actual system is sophisticated:
- Monte Carlo simulation with configurable iterations
- Multi-locus trait tracking
- Lethal gene combination detection
- COI calculation with pedigree depth options
- Breed-specific profiles with pre-configured loci

**Recommendation:** Add "How It Works" section explaining the science without overwhelming users.

### 2. Species Support

**Problem:** Marketing focuses heavily on dogs with cats secondary. Platform supports:
- Dogs ✓ (well covered)
- Cats ✓ (has dedicated page)
- Horses (mentioned but minimal)
- Goats (mentioned but minimal)
- Rabbits (mentioned but minimal)
- Sheep (mentioned but minimal)

**Recommendation:** Either create species-specific pages for all supported species or clarify which are "coming soon."

### 3. Business Tools Positioning

**Problem:** Marketing positions BreederHQ primarily as breeding/genetics software. The platform has substantial business management features that compete with general small business tools:
- Invoicing with line items
- Expense tracking (12 categories)
- Financial reporting
- Contact CRM
- Task management
- Document storage

**Recommendation:** Consider "Business Management" as a primary workflow alongside Breeding Intelligence.

---

## Content Gaps by Page

### index.astro (Homepage)

| Section | Gap |
|---------|-----|
| Features Grid | Missing: Financial tools, Communications Hub, Task Management |
| "What Makes Different" | Could add: Integrated payments, E-signatures, Multi-species |
| Hidden SEO Content | Good coverage but not visible to users |

### workflows/breeding-intelligence.astro

| Section | Gap |
|---------|-----|
| Feature List | Missing: Breed profiles library, What's Missing Analysis |
| How It Works | Could explain Monte Carlo simulation simply |
| Use Cases | Could add real scenarios |

### workflows/client-portal.astro

| Section | Gap |
|---------|-----|
| Overall | Page is thin - needs expansion |
| Features | Missing: Payment processing details, E-signature flow, Document access |
| Screenshots/Visuals | None shown |

### workflows/marketplace.astro

| Section | Gap |
|---------|-----|
| Service Providers | Minimal coverage of vet/trainer/groomer listings |
| Verification | Could explain badge system better |
| Buyer Journey | Not shown |

---

## Recommended New Pages

### High Priority

1. **Financial Management Workflow** (`/workflows/financial-management`)
   - Expense tracking with 12 categories
   - Invoicing and payments
   - Financial reporting
   - Tax preparation features

2. **Client Portal Tour** (`/workflows/client-portal-tour`)
   - Visual walkthrough of buyer experience
   - Payment and e-signature flows
   - Communication features

3. **Communications Hub** (`/workflows/communications`)
   - Unified inbox concept
   - Email/SMS templates
   - Automated notifications
   - Inquiry management

### Medium Priority

4. **Horse Breeders** (`/horses`)
   - Species-specific features
   - Equine health testing
   - Registration integrations

5. **Service Providers** (`/service-providers`)
   - How vets/trainers/groomers can list
   - Benefits of marketplace presence
   - Verification process

6. **How Our Genetics Tools Work** (`/genetics-explained`)
   - Non-technical explanation
   - Punnett squares basics
   - Monte Carlo simulation simplified
   - COI calculation explained

---

## Quick Wins

These can be added without new pages:

1. **Add expense tracking to visible features section** on homepage (currently FAQ-only)
2. **Add "Integrated Payments" to differentiators** - Stripe integration is significant
3. **Mention task management** in business tools
4. **Add e-signature to client portal description** - major convenience feature
5. **List all 12 expense categories** somewhere visible (currently only in hidden FAQ)

---

## Competitive Positioning Gaps

### vs. Spreadsheets
- ✅ Well covered

### vs. GoodDog/PuppyFind (Listing Sites)
- ✅ Good differentiation on verification
- ❌ Could emphasize "your data creates your listing" more

### vs. Legacy Breeding Software
- ❌ Missing direct comparisons
- ❌ Missing migration/import story

### vs. General Business Software
- ❌ Not addressed - could position as "all-in-one"

---

## Action Items Summary

### Immediate (Pre-Launch)
- [x] Fix "Pro plan" → "Professional plan"
- [x] Fix "AI-powered" → "Data-driven/Genetics-Powered"
- [ ] Add expense tracking to visible features
- [ ] Expand client portal page content

### Short-Term (Post-Launch)
- [ ] Create Financial Management workflow page
- [ ] Create Communications Hub workflow page
- [ ] Add species-specific pages for horses, goats, etc.

### Medium-Term
- [ ] Add visual tours/screenshots throughout
- [ ] Create "How It Works" content for genetics
- [ ] Develop competitive comparison content

---

*This document should be updated as marketing site changes are made.*
