# Marketplace Homepage - UX Questions for Team Review

**Date**: 2026-01-13
**Context**: During the UI/UX audit, fundamental questions arose about the homepage's purpose and information architecture that require product/design team input.

---

## Screenshot Reference

See: `docs/marketplace/audit/screenshots/marketplace-public/01-homepage-unauthenticated.png`

---

## Questions Requiring Team Input

### 1. Information Architecture Inconsistency

**Current State**: The Services section gets special treatment with:
- Category quick-links (Training, Stud Services, Transport, Grooming)
- Featured service listings below

**Question**: Why does Services get this treatment but Animals and Breeders do not?

**Options**:
- A) Give Animals and Breeders the same category-tab + featured-listings treatment
- B) Remove the special Services section and make all three equal
- C) This is intentional because Services needs more discovery help (explain rationale)

---

### 2. "Are you a breeder?" CTA Purpose

**Current State**: Links to `/me/programs` (internal marketplace management)

**Questions**:
1. Who is this card targeting?
   - Existing BreederHQ platform customers who want to list on marketplace?
   - New prospects who should learn about the full platform first?

2. Should this link to:
   - A) `breederhq.com` marketing site (to convert prospects to paying breeders)?
   - B) `/me/programs` as it does now (assumes user is already a customer)?
   - C) Different destinations based on auth state (marketing for anon, management for breeders)?

**Current behavior**: Always goes to `/me/programs` regardless of user state.

---

### 3. "Why BreederHQ?" Trust Section

**Current State**: Large hero card with three value props:
- "Verified Breeders"
- "Secure Messaging"
- "Reviewed Programs"

**Questions**:
1. What is the purpose of this section?
   - Build trust with buyers?
   - Differentiate from competitors?
   - Marketing for the platform?

2. Is this the right placement? (Currently between Featured Listings and Featured Breeders)

3. "Reviewed Programs" claims reviews exist - but the reviews system is not implemented. Should we:
   - A) Remove this claim until reviews are built?
   - B) Keep it as aspirational?
   - C) Reword to something we can deliver now?

---

### 4. Missing CategorySection

**Current State**: There's a `CategorySection` component defined in the code (lines 383-431 of HomePage.tsx) that shows species tiles (Dogs, Cats, Horses, Rabbits, Other Animals) but **it's not being rendered on the page**.

**Question**: Was this intentionally removed or accidentally omitted?

**Options**:
- A) Re-enable it for species-based browsing
- B) It was intentionally removed (explain why)
- C) The "Popular searches" pills are sufficient

---

### 5. Page Order / Content Hierarchy

**Current Order**:
1. Hero (Animals. Breeders. Services. + Search + 3 category cards)
2. Featured Listings (animals/offspring)
3. Why BreederHQ? (trust section)
4. Featured Breeders
5. Services (with category tabs + featured)
6. CTAs (Are you a breeder? / Offer services?)

**Questions**:
1. Is this the right order for buyer conversion?
2. Should the trust section come earlier or later?
3. Should Featured Breeders come before Services?
4. Where should species browsing fit (if re-enabled)?

---

### 6. "Offer animal services?" CTA

**Current State**: Links to `/provider` (ProviderDashboardPage)

**Questions**:
1. Who is this targeting?
   - Independent service providers (trainers, groomers, transporters)?
   - Breeders who also offer services?

2. Is `/provider` the right destination?

3. Should this also link to marketing material explaining the service provider program?

---

### 7. Authenticated vs. Unauthenticated Experience

**Question**: Should the homepage be different for:
- Anonymous visitors (buyers)
- Authenticated buyers
- Authenticated breeders

**Current State**: Same page for everyone.

**Considerations**:
- Breeders might want to see their own listings/stats
- Buyers might want personalized recommendations
- Anonymous users need trust-building content

---

## Recommendations (Pending Team Input)

Until these questions are answered, I've documented them rather than making changes. The homepage architecture affects:
- Conversion funnel (breeder acquisition)
- Buyer experience (finding animals/breeders)
- Brand positioning (what BreederHQ Marketplace is)

---

## How to Respond

Please add responses to each numbered question above, then we can update the implementation to match the intended design.

**Team members to review**:
- [ ] Product Owner
- [ ] UX Designer
- [ ] Marketing (for breeder acquisition CTAs)

---

*Generated during UI/UX Audit - 2026-01-13*
