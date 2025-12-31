# Client Portal (v1 Skeleton)

The Client Portal provides a dedicated view for clients/customers to interact with breeders. This is the v1 skeleton with routes and UI placeholders in place, but no backend wiring yet.

## What Exists in v1

- **Dashboard** (`/portal`) - Overview page with empty section cards for tasks, messages, billing, agreements, documents, offspring, waitlist, and appointments
- **Messages** (`/portal/messages`) - Uses the shared MessagesPage from @bhq/marketing (real API integration)
- **Tasks** (`/portal/tasks`) - Empty placeholder page
- **Billing** (`/portal/billing`) - Empty placeholder page
- **Agreements** (`/portal/agreements`) - Empty placeholder page
- **Documents** (`/portal/documents`) - Empty placeholder page
- **Offspring** (`/portal/offspring`) - Empty placeholder page
- **Waitlist** (`/portal/waitlist`) - Empty placeholder page
- **Profile** (`/portal/profile`) - Empty placeholder page

## What Is Intentionally Empty

All data arrays in `mock.ts` are empty and all counts are zero. This is intentional for the v1 skeleton:

- No fake/mock data ships to production
- UI shows "empty state" placeholders
- Feature flags exist but are not enforced yet

## How to Enable Locally

The portal is gated behind an environment flag. To enable:

```bash
# In apps/platform/.env.local (create if needed)
VITE_PORTAL_ENABLED=true
```

Then restart the dev server. The "Client Portal" nav item will appear in the sidebar.

## What Will Be Wired Next

These pages need backend API endpoints and real data integration:

1. **Tasks** - Client task assignments from breeders
2. **Billing** - Invoices, payment history, payment methods
3. **Agreements** - Contracts, health guarantees, terms
4. **Documents** - Uploaded files shared between breeder and client
5. **Offspring** - Reserved/purchased animals for this client
6. **Waitlist** - Position(s) on breeder waitlists

## File Structure

```
apps/portal/
  src/
    App-Portal.tsx      # Main router component
    mock.ts             # Types and empty data arrays
    pages/
      PortalDashboard.tsx
      PortalTasksPage.tsx
      PortalBillingPage.tsx
      PortalAgreementsPage.tsx
      PortalDocumentsPage.tsx
      PortalOffspringPage.tsx
      PortalWaitlistPage.tsx
      PortalProfilePage.tsx
  package.json
  tsconfig.json
  vite.config.ts
```

## Development

Portal is consumed by the platform app via alias. For standalone dev:

```bash
cd apps/portal
pnpm dev
```

Note: Standalone dev requires the API server running at localhost:6001.
