# Website Copy Documentation

**Last Updated**: January 2026
**Status**: Phase 2 Complete - Revised Based on Implementation Analysis

---

## Overview

This folder contains marketing copy for BreederHQ web properties:

1. **breederhq.com** — SaaS marketing site for professional breeders
2. **marketplace.breederhq.com** — Marketplace app landing page (separate site)

The copy was developed based on the feature audit (see `/docs/FEATURE-AUDIT-RESULTS.md`) and marketing brief (see `/docs/MARKETING-COPYWRITER-BRIEF.md`).

---

## Two-Site Architecture

| Site | Audience | Purpose | Tone |
|------|----------|---------|------|
| **breederhq.com** | Professional breeders | SaaS subscription conversion | Professional, premium |
| **marketplace.breederhq.com** | Everyone (buyers, service providers, public) | Search/list animals & services | Accessible, casual |

---

## Documents in This Folder

### breederhq.com Pages (SaaS Marketing Site)

| Document | Purpose | Status |
|----------|---------|--------|
| [BREEDING-INTELLIGENCE-PAGE.md](./BREEDING-INTELLIGENCE-PAGE.md) | Genetics tools (Best Match Finder, Offspring Simulator, etc.) | Draft - Revised with TL;DR |
| [CLIENT-PORTAL-PAGE.md](./CLIENT-PORTAL-PAGE.md) | Client Portal features (payments, e-signatures, etc.) | Draft - Revised with tone adjustments |
| [MARKETPLACE-BREEDERS-PAGE.md](./MARKETPLACE-BREEDERS-PAGE.md) | Marketplace benefit for breeders (list animals, earn badges) | Draft |
| [MARKETPLACE-BUYERS-PAGE.md](./MARKETPLACE-BUYERS-PAGE.md) | Educational content for buyers (how to find a breeder) | Draft |
| [SERVICE-PROVIDERS-PAGE-REVISED.md](./SERVICE-PROVIDERS-PAGE-REVISED.md) | Detailed service provider pitch (FREE first year) | Draft |
| [HOMEPAGE-UPDATES.md](./HOMEPAGE-UPDATES.md) | Recommendations for updating breederhq.com homepage | Recommendations |

### marketplace.breederhq.com (Marketplace App Landing)

| Document | Purpose | Status |
|----------|---------|--------|
| [MARKETPLACE-LANDING-PAGE.md](./MARKETPLACE-LANDING-PAGE.md) | Front door to marketplace app — search animals, find services, list services | Draft - NEW |

### Superseded Documents

| Document | Notes |
|----------|-------|
| [MARKETPLACE-PAGE.md](./MARKETPLACE-PAGE.md) | Original combined page - superseded by split pages |

---

## Key Architecture Decisions

### breederhq.com (SaaS Marketing)
- Full marketing site with nav menus, feature pages, pricing
- Target: Professional breeders considering subscription
- Contains detailed explanations of platform features
- Links TO marketplace.breederhq.com for "see the marketplace" CTAs

### marketplace.breederhq.com (Marketplace App)
- NOT a marketing site — it's the actual app
- Landing page is a simple front door with three paths:
  1. Find an Animal (search breeders)
  2. Find Services (search service providers)
  3. List Your Services (free signup)
- Minimal content — goal is search/action within 5 seconds
- Links back to breederhq.com for "Are you a breeder?" users

---

## Priority Order

1. **Marketplace Landing** — Front door for consumers and service providers
2. **Breeding Intelligence** — Major differentiator for breeders
3. **Client Portal** — Trust builder; justifies subscription cost
4. **Marketplace (Breeders)** — Explains marketplace benefit to subscribers
5. **Service Providers** — Detailed pitch; may launch before breeder marketplace

---

## URLs and Navigation

### breederhq.com

| Page | URL | Navigation |
|------|-----|------------|
| Breeding Intelligence | `/workflows/breeding-intelligence` | Workflows dropdown |
| Client Portal | `/workflows/client-portal` | Workflows dropdown |
| Marketplace (for breeders) | `/marketplace` | Top-level nav item |
| Marketplace (buyer info) | `/marketplace/buyers` | Footer link |
| Service Providers | `/service-providers` | Footer link |

### marketplace.breederhq.com

| Page | URL | Notes |
|------|-----|-------|
| Landing Page | `/` (root) | Front door to app |
| Search results, profiles, etc. | Various | Part of app, not marketing copy |

---

## Branding Decisions

- **"Client Portal"** (not "Buyer Portal") — covers all relationship types
- **Species-agnostic language** — dogs, cats, horses, goats, rabbits, sheep
- **Pricing obfuscated** — no specific amounts until launch
- **Service provider pricing** — FREE first year, then tiered
- **Marketplace tone** — more casual/accessible than SaaS site

---

## Related Documents

- `/docs/FEATURE-AUDIT-RESULTS.md` — Platform feature audit
- `/docs/MARKETING-COPYWRITER-BRIEF.md` — Project brief and requirements
- `/docs/marketing/COPY-IMPLEMENTATION-ANALYSIS.md` — Style compatibility review
- `/docs/marketplace/` — Technical marketplace documentation

---

## Next Steps

1. **Review** — Stakeholder review of all draft copy
2. **Marketplace Landing** — Implement marketplace.breederhq.com landing page
3. **breederhq.com Pages** — Create Astro pages from approved copy
4. **Cross-linking** — Connect the two sites appropriately
5. **Service Provider Launch** — May precede full marketplace launch

---

## Future Pages (Not Yet Drafted)

Lower priority pages that could add value:

- **Communications Hub** — Unified inbox, templates, document bundles
- **Financial Management** — Expense tracking, financial dashboard
- **Verification & Trust** — Deep dive on 4 badge types
