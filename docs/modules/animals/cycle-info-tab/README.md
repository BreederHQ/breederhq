# Cycle Info Tab Documentation

This folder contains comprehensive documentation for the Cycle Info tab feature in the Animals module.

## Contents

1. **[architecture.md](./architecture.md)** - System architecture, data flow, and component relationships
2. **[components.md](./components.md)** - Detailed documentation of all frontend components
3. **[backend-service.md](./backend-service.md)** - Backend cycle analysis service documentation
4. **[species-config.md](./species-config.md)** - Species-specific configuration and biology defaults
5. **[repro-engine.md](./repro-engine.md)** - Reproductive engine utilities documentation
6. **[types.md](./types.md)** - TypeScript type definitions
7. **[species-support-plan.md](./species-support-plan.md)** - Plan for multi-species support

## Quick Overview

The Cycle Info tab provides breeders with:
- Heat cycle tracking and history
- Ovulation pattern analysis
- Next cycle predictions with testing recommendations
- Species-specific guidance

## Key Files

| File | Location | Purpose |
|------|----------|---------|
| CycleTab | `apps/animals/src/App-Animals.tsx` | Main tab component |
| CycleAnalysis/* | `apps/animals/src/components/CycleAnalysis/` | UI components |
| cycle-analysis-service.ts | `breederhq-api/src/services/` | Backend analysis |
| reproEngine/* | `packages/ui/src/utils/reproEngine/` | Calculation utilities |
