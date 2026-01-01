
# BreederHQ Monorepo Starter

This is a minimal npm workspaces monorepo with three apps and three packages.

Party migration docs: [Frontend UI merge](docs/migrations/party-ui-merge/README.md) (API migration docs are in the separate breederhq-api repository).

## Structure
- `apps/contacts` Vite + React + TS app
- `apps/animals` Vite + React + TS app
- `apps/breeding` Vite + React + TS app
- `packages/ui` Shared React UI components
- `packages/mock` Shared mock data
- `packages/config` Shared config (ESLint, Prettier)

## Quick start
1. In the repo root:
   ```sh
   npm install
   ```
2. Run any app:
   ```sh
   npm run dev:contacts
   npm run dev:animals
   npm run dev:breeding
   ```
3. Build:
   ```sh
   npm run build
   ```

## Notes
- Uses npm workspaces. You can switch to pnpm or yarn later.
- UI package is wired with TypeScript path aliases `@bhq/ui` and `@bhq/mock`.
