# Production Surface Deployment

BreederHQ uses **three distinct surfaces**, each deployed as a separate Vercel project.
This ensures complete isolation: users on one surface cannot accidentally access routes from another.

## Surface Configuration

| Surface       | Vercel Project      | App Path            | Build Command    | Output Directory | Production URL              |
|---------------|---------------------|---------------------|------------------|------------------|-----------------------------|
| **PLATFORM**  | breederhq-platform  | `apps/platform`     | `npm run build`  | `dist`           | `https://app.breederhq.com` |
| **PORTAL**    | breederhq-portal    | `apps/portal`       | `npm run build`  | `dist`           | `https://portal.breederhq.com` |
| **MARKETPLACE** | breederhq-marketplace | `apps/marketplace` | `npm run build`  | `dist`           | `https://marketplace.breederhq.com` |

## DNS Configuration

| Hostname                      | Type  | Value                                    |
|-------------------------------|-------|------------------------------------------|
| `app.breederhq.com`           | CNAME | `cname.vercel-dns.com`                   |
| `portal.breederhq.com`        | CNAME | `cname.vercel-dns.com`                   |
| `marketplace.breederhq.com`   | CNAME | `cname.vercel-dns.com`                   |

Each project must be configured in Vercel with its respective domain.

## API Backend

All surfaces proxy `/api/v1/*` to the same backend:

```
https://breederhq-api.onrender.com/api/v1/*
```

The backend determines the surface from the `Origin` header and enforces:
- **PLATFORM**: requires STAFF membership
- **PORTAL**: requires CLIENT membership
- **MARKETPLACE**: allows PUBLIC + optional user login

## No Path Mixing Rules

1. **Each surface is a separate Vercel project** - deployed independently
2. **Root vercel.json does NOT contain routing rules** - only a comment directing to per-app configs
3. **Each app has its own `vercel.json`** in `apps/{surface}/vercel.json`
4. **Platform does not import portal/marketplace code** - they share only:
   - `packages/ui` (shared components)
   - `packages/config` (shared configuration)
   - `packages/api` (API client SDK)

## Vercel Project Setup

For each surface, create a Vercel project with:

1. **Root Directory**: `apps/{surface}` (e.g., `apps/platform`)
2. **Framework Preset**: Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install` (from monorepo root)
6. **Domain**: Assign the appropriate subdomain

### Environment Variables (per project)

No surface-specific env vars needed on frontend. All config comes from the backend via `/api/v1/session`.

## Cookie Domain Scoping (SSO)

In production, session cookies are set with:

```
domain=.breederhq.com
secure=true
sameSite=lax
httpOnly=true (session) / false (CSRF)
```

This allows a user to log in once on any surface and remain authenticated across all surfaces.

## CSRF Token Surface Binding

CSRF tokens include the surface prefix: `PLATFORM.xxx`, `PORTAL.xxx`, `MARKETPLACE.xxx`

The backend rejects CSRF tokens that don't match the requesting surface, preventing cross-surface request forgery.

## Verification

After deployment, verify surface isolation:

```bash
# Each surface should only respond with its own routes
curl -I https://app.breederhq.com/
curl -I https://portal.breederhq.com/
curl -I https://marketplace.breederhq.com/

# Cross-surface CSRF should fail (use a PLATFORM token on PORTAL)
curl -X POST https://portal.breederhq.com/api/v1/session/tenant \
  -H "x-csrf-token: PLATFORM.fake123" \
  -H "Cookie: XSRF-TOKEN=PLATFORM.fake123"
# Expected: 403 CSRF_FAILED surface_mismatch
```

## Troubleshooting

### "Mixed surface" errors
If a user sees platform routes on portal, check:
1. DNS is pointing to the correct Vercel project
2. Vercel project root directory is set to `apps/{surface}`
3. No shared routing rules in root `vercel.json`

### Cookie not shared across subdomains
Ensure backend sets `domain=.breederhq.com` (with leading dot) in production.

## Surface Derivation Allowlist

In production (`NODE_ENV=production`), the backend enforces a **strict hostname allowlist**.
Only these exact hostnames are recognized:

| Hostname                   | Surface         |
|----------------------------|-----------------|
| `app.breederhq.com`        | PLATFORM        |
| `portal.breederhq.com`     | PORTAL          |
| `marketplace.breederhq.com`| MARKETPLACE     |

Any request from an unrecognized hostname returns:
```json
{ "error": "SURFACE_ACCESS_DENIED", "surface": "UNKNOWN" }
```

This prevents attackers from using hostnames like `portal.malicious.com` to bypass surface-based access controls.

In development, the backend uses flexible prefix matching (`portal.*`, `marketplace.*`, etc.) to support local testing with `*.breederhq.test` domains and Vercel preview deployments.
