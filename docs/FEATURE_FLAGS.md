# Feature Flags

This document lists feature flags used in the breederhq frontend monorepo.

## BHQ_FEATURE_ANIMAL_MARKETPLACE

**Purpose:** Gates the Marketplace tab in Animal details (Animals module).

**Default state:** OFF (disabled)

**Enablement methods:**
- Environment variable: `VITE_FEATURE_ANIMAL_MARKETPLACE=true`
- localStorage: `localStorage.setItem("BHQ_FEATURE_ANIMAL_MARKETPLACE", "true")`

**Notes:**
- URL param enablement is intentionally not supported (security/support risk)
- When enabled via localStorage, an "Internal Feature" badge is shown to prevent screenshot confusion
- Feature allows breeders to create marketplace listings for individual program animals (stud, brood placement, rehome, showcase)

**Rollout plan:**
- Internal testing via localStorage
- Controlled environments via env variable
- Production rollout: remove flag and enable unconditionally
