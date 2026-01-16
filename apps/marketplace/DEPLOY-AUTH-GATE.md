# Marketplace Authentication Gate

## Overview
The marketplace has a feature flag to control whether authentication is required for public pages (home, animals, breeders, services).

## Environment Variable
```bash
VITE_MARKETPLACE_REQUIRE_AUTH=true
```

## Usage

### For Pre-Launch Deploys to Main
Set the environment variable to `true` in your deployment environment (Vercel, etc.):
```bash
VITE_MARKETPLACE_REQUIRE_AUTH=true
```

This will:
- Require users to log in before seeing ANY marketplace page (including home page)
- Block unauthenticated users from browsing listings
- Show the login page to anyone who visits the marketplace

### When Ready to Go Live
Remove the environment variable or set it to `false`:
```bash
VITE_MARKETPLACE_REQUIRE_AUTH=false
# OR just remove the variable entirely
```

This will:
- Allow public browsing of marketplace pages
- Let unauthenticated users view home, animals, breeders, services
- Only require login for actions like saving, contacting, or waitlist

## Vercel Deployment

### Set the environment variable in Vercel:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add `VITE_MARKETPLACE_REQUIRE_AUTH` with value `true`
4. Set it for the Production environment
5. Redeploy

### Remove the gate when going live:
1. Go to Vercel project settings
2. Delete the `VITE_MARKETPLACE_REQUIRE_AUTH` environment variable
3. Redeploy

## Local Development
The variable is documented in `apps/marketplace/.env.local` but commented out by default, so local development allows public browsing.

To test the auth gate locally:
```bash
# In apps/marketplace/.env.local
VITE_MARKETPLACE_REQUIRE_AUTH=true
```

Then restart your dev server.

## Implementation Details
- Modified: [apps/marketplace/src/gate/MarketplaceGate.tsx](src/gate/MarketplaceGate.tsx:310-311)
- When `VITE_MARKETPLACE_REQUIRE_AUTH=true`, unauthenticated users are redirected to the login page
- When `false` or unset, public routes work as normal (browsing allowed, actions require login)
- No code changes needed to toggle between modes - just update the environment variable

## Recommendation
- Keep `VITE_MARKETPLACE_REQUIRE_AUTH=true` in production until launch day
- Test the public browsing experience in dev/staging before removing the gate
- When ready to launch, remove the variable and redeploy
