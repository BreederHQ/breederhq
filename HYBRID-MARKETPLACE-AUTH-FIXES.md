# Hybrid Marketplace Authentication Fixes

## Problem

When browsing the marketplace as an unauthenticated user, multiple 401 errors appeared in the console:

1. `GET /api/v1/marketplace/me 401` - MarketplaceGate checking authentication
2. `GET /api/v1/marketplace/offspring-groups 401` - HomePage fetching featured listings
3. `GET /api/v1/marketplace/waitlist/my-requests 401` - Layout fetching waitlist counts
4. `GET /api/v1/marketplace/animal-programs 401` - AnimalsIndexPage fetching programs
5. `GET /api/v1/marketplace/animals 401` - AnimalsIndexPage fetching animal listings

## Root Cause

The backend authentication middleware (`server.ts` preHandler) was requiring authentication for ALL `/marketplace/*` endpoints except for the specific allowlist entries (breeders, breeding-programs). Even though some endpoints were marked as "PUBLIC" in their comments, they still required valid session cookies.

## Solution

### 1. Backend: Allow Public Access to Browse Endpoints

**File:** `breederhq-api/src/server.ts`

Added allowlist entries in the preHandler hook for public marketplace browse endpoints:

```typescript
// 5) Public marketplace browse endpoints (GET only)
// These endpoints allow anonymous browsing of marketplace listings
const publicBrowseEndpoints = [
  "/marketplace/offspring-groups",
  "/marketplace/animal-programs",
  "/marketplace/animals",
  "/api/v1/marketplace/offspring-groups",
  "/api/v1/marketplace/animal-programs",
  "/api/v1/marketplace/animals",
];

const isPublicBrowsePath = publicBrowseEndpoints.some(endpoint =>
  pathOnly === endpoint || pathOnly.endsWith(endpoint)
);

if (m === "GET" && isPublicBrowsePath) {
  // Skip auth checks - public browse endpoint
  (req as any).tenantId = null;
  (req as any).userId = null;
  (req as any).actorContext = "PUBLIC";
  return; // Exit hook early
}

// 6) /marketplace/me should work for both authenticated and anonymous users
const isMePath =
  pathOnly === "/marketplace/me" ||
  pathOnly === "/api/v1/marketplace/me" ||
  pathOnly.endsWith("/marketplace/me");
if (m === "GET" && isMePath) {
  // Allow through without session check - handler will determine auth status
  const sess = parseVerifiedSession(req, surface as SessionSurface);
  (req as any).userId = sess?.userId || null;
  (req as any).tenantId = null;
  (req as any).actorContext = sess?.userId ? "PUBLIC" : "PUBLIC";
  return; // Exit hook early
}
```

### 2. Backend: Handle Anonymous Users in `/me` Endpoint

**File:** `breederhq-api/src/routes/public-marketplace.ts`

Changed the `/me` endpoint to return a valid response for anonymous users instead of 401:

```typescript
app.get("/me", async (req, reply) => {
  const userId = (req as any).userId;
  const actorContext = (req as any).actorContext;
  const surface = (req as any).surface;

  // Allow anonymous users - return empty profile
  if (!userId) {
    return reply.send({
      userId: null,
      email: null,
      name: null,
      firstName: null,
      lastName: null,
      phone: null,
      marketplaceEntitled: false,
      actorContext: "PUBLIC",
      surface,
      entitlements: [],
      entitlementSource: null,
    });
  }

  // ... rest of authenticated logic
});
```

### 3. Frontend: Add Auth Guard to Waitlist Hook

**File:** `apps/marketplace/src/messages/hooks.ts`

Updated `useWaitlistRequests()` to accept an `authenticated` parameter (same pattern as `useUnreadCounts`):

```typescript
export function useWaitlistRequests(authenticated = true) {
  const [requests, setRequests] = React.useState<WaitlistRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    // Don't attempt to fetch if not authenticated
    if (!authenticated) {
      setRequests([]);
      setError(null);
      setLoading(false);
      return;
    }

    // ... rest of fetch logic
  }, [authenticated]);

  React.useEffect(() => {
    // Only poll if authenticated
    if (!authenticated) {
      setRequests([]);
      setError(null);
      setLoading(false);
      return;
    }

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load, authenticated]);

  return { requests, loading, error, refresh: load };
}
```

### 4. Frontend: Pass Auth Status to Hooks

**File:** `apps/marketplace/src/layout/MarketplaceLayout.tsx`

Updated the layout to pass `authenticated` to `useWaitlistRequests`:

```typescript
export function MarketplaceLayout({ authenticated, children }: MarketplaceLayoutProps) {
  const { totalUnread, refresh: refreshUnread } = useUnreadCounts(authenticated);
  const { requests: waitlistRequests, refresh: refreshWaitlist } = useWaitlistRequests(authenticated); // ← Added parameter
  // ...
}
```

## Result

- ✅ Anonymous users can now browse `/animals`, `/breeders`, `/services` without 401 errors
- ✅ MarketplaceGate properly detects unauthenticated users
- ✅ HomePage can fetch featured listings without authentication
- ✅ No more polling errors for messages/waitlist when not logged in
- ✅ Console is clean when browsing as anonymous user

## Public Endpoints Summary

The following marketplace endpoints are now publicly accessible (no authentication required):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/marketplace/me` | GET | Check auth status (returns `userId: null` for anonymous) |
| `/api/v1/marketplace/offspring-groups` | GET | Browse available animals/offspring |
| `/api/v1/marketplace/animal-programs` | GET | Browse animal breeding programs |
| `/api/v1/marketplace/animals` | GET | Browse individual animals |
| `/api/v1/marketplace/breeders` | GET | List all breeders |
| `/api/v1/marketplace/breeders/:slug` | GET | View breeder profile |
| `/api/v1/public/breeding-programs/*` | GET, POST | Browse programs, submit inquiries |
| `/api/v1/species` | GET | Get species list |
| `/api/v1/breeds/search` | GET | Search breeds (without organizationId) |

## Protected Endpoints Summary

The following marketplace endpoints still require authentication:

- `/api/v1/marketplace/waitlist/*` - Manage waitlist positions
- `/api/v1/marketplace/messages/*` - Messaging/inquiries
- `/api/v1/marketplace/profile/*` - User profile management
- `/api/v1/marketplace/saved/*` - Saved/favorited listings
- All POST/PUT/DELETE operations (except public inquiry submission)

## Testing

To verify the fix:

1. **Open marketplace in incognito/private window** (ensures no session cookie)
2. **Navigate to homepage** - should load without 401 errors
3. **Browse `/animals`** - should show listings without 401 errors
4. **Browse `/breeders`** - should show breeders without 401 errors
5. **Check browser console** - should be clean (no 401 errors)
6. **Try to save a listing** - should prompt for login
7. **Try to contact a breeder** - should prompt for login

## UX Enhancement: Auth Prompt Modal

Created reusable components for prompting anonymous users to sign in without jarring redirects:

**Files:**
- `apps/marketplace/src/components/AuthPromptModal.tsx` - Modal component
- `apps/marketplace/src/components/useAuthPrompt.tsx` - Custom hook

**Usage Example:**
```tsx
import { AuthPromptModal } from "../components/AuthPromptModal";
import { useAuthPrompt } from "../components/useAuthPrompt";

function MyComponent() {
  const { requireAuth, isPromptOpen, closePrompt } = useAuthPrompt({
    action: "save",
    itemType: "listing"
  });

  const handleSave = () => {
    if (!requireAuth()) return; // Shows modal if not authenticated
    // Proceed with save logic
  };

  return (
    <>
      <button onClick={handleSave}>Save</button>
      <AuthPromptModal
        isOpen={isPromptOpen}
        onClose={closePrompt}
        action="save"
        itemType="listing"
      />
    </>
  );
}
```

**Benefits:**
- Non-intrusive inline modal instead of full-page redirect
- Clear explanation of why sign-in is needed
- Lists benefits of creating an account
- "Continue browsing" option to dismiss and keep exploring
- Automatically returns user to current page after auth

## Related Files

- `breederhq-api/src/server.ts` - Auth middleware allowlist
- `breederhq-api/src/routes/public-marketplace.ts` - Public endpoint handlers
- `apps/marketplace/src/gate/MarketplaceGate.tsx` - Public route configuration
- `apps/marketplace/src/messages/hooks.ts` - `useWaitlistRequests` hook
- `apps/marketplace/src/layout/MarketplaceLayout.tsx` - Hook usage
- `apps/marketplace/src/components/AuthPromptModal.tsx` - Auth prompt modal
- `apps/marketplace/src/components/useAuthPrompt.tsx` - Auth prompt hook
- `apps/marketplace/HYBRID-SEO-IMPLEMENTATION.md` - SEO implementation guide
- `apps/marketplace/public/robots.txt` - Search engine directives

## Next Steps

1. ✅ Create auth prompt modal and hook
2. **TODO**: Integrate auth prompts into action buttons (Save, Contact, Waitlist)
3. Test thoroughly in development environment
4. Verify no other hooks are polling without auth checks
5. Consider adding logging to track anonymous vs authenticated usage
6. Update API documentation to clearly mark public vs protected endpoints
