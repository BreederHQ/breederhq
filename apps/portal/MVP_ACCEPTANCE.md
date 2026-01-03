# Client Portal MVP Acceptance Checklist

## Summary

The Client Portal provides authenticated access for breeders' clients to view their placements, agreements, documents, and communicate with the breeder.

## What Works

### Authentication & Security
- [x] Login page with BreederHQ branding and "Client Portal" subtitle
- [x] Forgot password flow
- [x] Account activation flow (`/activate?token=...`)
- [x] Logout functionality
- [x] AuthGate enforces CLIENT role on protected routes
- [x] Blocked page for unauthorized access
- [x] Security headers (X-Frame-Options, X-Content-Type-Options, X-Robots-Tag)
- [x] robots.txt blocks search engine indexing
- [x] Demo mode hard-disabled in production builds

### Navigation & Layout
- [x] Header with org identity (clickable to dashboard)
- [x] Horizontal nav: Tasks, Messages, Agreements, Documents, Financials, Offspring, Profile
- [x] Notification bell icon with unread indicator
- [x] Sign out button always visible
- [x] Footer with BreederHQ branding
- [x] Build stamp (dev only)

### Pages

| Page | Route | Demo Mode | Real API | Notes |
|------|-------|-----------|----------|-------|
| Dashboard | `/` | Yes | Partial | Personalized greeting, task/notification summary |
| Tasks | `/tasks` | Yes | Yes | Fetches from portal tasks API |
| Messages | `/messages` | Yes | Yes | Thread list with sender names |
| Message Thread | `/messages/:id` | Yes | Yes | Full conversation view |
| Agreements | `/agreements` | Yes | Yes | Agreement list with status |
| Agreement Detail | `/agreements/:id` | Yes | Yes | Full agreement view |
| Documents | `/documents` | Yes | Yes | Document list, download TBD |
| Financials | `/financials` | Yes | No | Invoices, payments, summary |
| Offspring | `/offspring` | Yes | Yes | Placement list with status |
| Offspring Detail | `/offspring/:id` | Yes | Yes | Animal detail with photos |
| Profile | `/profile` | Yes | Partial | Contact information |
| Schedule | `/schedule/:id` | Yes | Yes | Client scheduling |
| Schedule Discovery | `/schedule/group/:id` | Yes | Yes | Available appointments |
| Notifications | `/notifications` | Yes | Yes | Notification center |

### Developer Tools
- [x] Debug page (`/debug`) - shows mock data status
- [x] Diagnostics page (`/__diagnostics?enable=1`) - gated, shows session/endpoints

## What Doesn't Work (Known Limitations)

### Backend Integration
- [ ] Document download - endpoint exists but returns 501 until storage configured
- [ ] Financials - fully mock-driven, no real API integration
- [ ] Profile editing - read-only display, no PATCH endpoint wired
- [ ] Message sending - UI exists but send may not persist

### UI/UX
- [ ] Some pages use older design system (PageScaffold) vs newer (PortalHero/PortalCard)
- [ ] No loading skeletons on some pages (shows blank during fetch)

## Manual Test Steps

### 1. Login Flow
1. Navigate to `/login`
2. Verify BreederHQ logo and "Client Portal" branding
3. Enter invalid credentials - verify error message
4. Enter valid CLIENT credentials - verify redirect to dashboard

### 2. Demo Mode (Development Only)
1. Add `?mock=1` to any URL
2. Verify demo data appears
3. Navigate between pages - verify mock persists
4. Add `?mock=0` - verify demo mode disabled

### 3. Dashboard
1. Verify personalized greeting ("Welcome, [Name]")
2. Verify financial summary strip (if in demo mode)
3. Verify recent tasks, upcoming items

### 4. Navigation
1. Click each nav item - verify correct page loads
2. Click org identity - verify returns to dashboard
3. Click bell icon - verify notifications page
4. Click Sign out - verify logout and redirect to login

### 5. Protected Routes
1. Clear session/cookies
2. Navigate to `/tasks` - verify redirect to `/login`
3. Login as non-CLIENT role - verify redirect to `/blocked`

### 6. Security
1. Open DevTools > Network
2. Verify no session tokens in console
3. Verify no PII logged
4. Check response headers for X-Frame-Options, X-Content-Type-Options

## Environment Configuration

```env
# Required for production
VITE_API_BASE_URL=https://your-api.com

# Optional - enable demo mode in production (not recommended)
# VITE_ALLOW_DEMO_MODE=1
```

## Known Issues

1. **Vite chunk warnings** - mockFlag.ts and mockData.ts show "dynamic import will not move module" warnings. Cosmetic only, no impact on functionality.

2. **PageNew naming convention** - Some pages have `*PageNew.tsx` suffix from incremental migration. Old versions removed but naming not consolidated.

3. **Mixed design systems** - PortalCard/PortalHero vs PageScaffold/SectionCard used across pages. Consistent within each page but not unified globally.

## Acceptance Criteria

- [ ] All protected routes require authentication
- [ ] Demo mode disabled in production unless explicitly enabled
- [ ] No console.log noise in production
- [ ] Build passes with no errors
- [ ] Core flows work: login, view placements, view agreements

---

Last updated: 2026-01-02
