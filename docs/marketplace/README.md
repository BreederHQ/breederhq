# Marketplace Module Documentation

This folder contains documentation for the BreederHQ Marketplace module.

## Current Implementation Status

**See [Implementation Status](./implementation-status.md) for detailed breakdown of what's working vs demo data.**

Quick summary:
| Feature | Status |
|---------|--------|
| Breeders browse (`/breeders`) | Real API |
| Breeding Programs management (`/me/programs`) | Real API |
| Breeder Services management (`/me/services`) | Real API |
| Service Provider Portal (`/provider`) | Real API |
| Services browse (`/services`) | Demo data only |
| Litter listings on Animals page | Demo data only |
| Featured homepage section | Demo data only |

## Overview

The Marketplace is a public-facing module at `marketplace.breederhq.com` that allows:
- **Buyers** to browse breeders, breeding programs, animals, and services
- **Breeders** to list their programs, offspring, and services
- **Service Providers** (non-breeders) to offer pet-related services

## Documentation Index

| Document | Description |
|----------|-------------|
| [Implementation Status](./implementation-status.md) | What's working, what's demo, what's missing |
| [Breeding Programs](./breeding-programs.md) | BreedingProgram entity, API, and management UI |
| [Animal Listings](./animal-listings.md) | Animal listing intents, display logic, and browsing |
| [Breeder Services](./breeder-services.md) | Service listings for breeders (stud, training, etc.) |
| [Service Provider Portal](./service-provider-portal.md) | Portal for non-breeder service providers |
| [Origin Tracking](./origin-tracking.md) | Conversion attribution and analytics |
| [API Reference](./api-reference.md) | Complete API endpoint documentation |

## Architecture

```
marketplace.breederhq.com
├── / (HomePage - featured content)
├── /animals (AnimalsIndexPage - browse animals)
├── /breeders (BreedersIndexPage - browse breeders)
├── /breeders/:slug (BreederPage - breeder profile)
├── /breeding-programs (BreedingProgramsIndexPage - browse programs)
├── /services (ServicesPage - browse services)
├── /inquiries (InquiriesPage - buyer's sent inquiries)
├── /updates (UpdatesPage - buyer's followed listings)
├── /me/listing (MyListingPage - breeder's marketplace preview)
├── /me/programs (ProgramsSettingsPage - manage breeding programs)
├── /me/services (ServicesSettingsPage - manage breeder services)
├── /provider (ProviderDashboardPage - service provider portal)
└── /programs/:slug (ProgramPage - program detail)
```

## Key Concepts

### User Types

1. **Buyers** - Browse and inquire about animals/services
2. **Breeders** - List programs, offspring, and services (have a Tenant)
3. **Service Providers** - Non-breeder businesses offering pet services

### Listing Types

All listings use the `MarketplaceListing` table with different `listingType` values:

| Type | Owner | Description |
|------|-------|-------------|
| `OFFSPRING_GROUP` | Breeder (Tenant) | Group of puppies/kittens from a breeding |
| `STUD_SERVICE` | Breeder (Tenant) | Stud service offering |
| `TRAINING` | Either | Training services |
| `VETERINARY` | Service Provider | Veterinary services |
| `PHOTOGRAPHY` | Service Provider | Pet photography |
| `GROOMING` | Either | Grooming services |
| `TRANSPORT` | Either | Pet transport services |
| `BOARDING` | Either | Boarding/kenneling |
| `PRODUCT` | Service Provider | Pet products |
| `OTHER_SERVICE` | Either | Miscellaneous services |

### Conversion Actions

All user actions are tracked with origin context for attribution:

- **Inquire** - Send message about specific listing
- **Join Waitlist** - Express interest in a program
- **Message Breeder** - Direct message to breeder
- **Request Info** - Contact service provider

## Related Documentation

- [Marketplace MVP Implementation Plan](../marketplace-mvp-implementation-plan.md) - Original planning document
- [Portal Stripe Checkout](../portal-stripe-checkout-backend.md) - Stripe integration patterns
