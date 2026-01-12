# Portal Redesign - Implementation Instructions

**Priority**: CRITICAL
**Status**: Ready for Implementation
**Review Document**: [docs/portal/design-review-2026-01.md](./design-review-2026-01.md)

---

## Start Here

A four-role design panel completed a comprehensive review of the portal. Unanimous verdict: strong visuals but navigation is overcomplicated and features are duplicated.

**Full Review**: [`docs/portal/design-review-2026-01.md`](./design-review-2026-01.md) — Read this first. 500+ lines of detailed specifications, component specs, and rationale.

---

## What You're Fixing

**Problems**:
1. Header has 7-item scrollable horizontal nav — users can't find features
2. Tasks page + Notifications page duplicate each other
3. Dashboard "Next Action" text exposes internal complexity
4. Financial page has pointless "Overview/All Invoices" toggle
5. Profile "Request Change" buttons don't give feedback

**Solution**: Simplify navigation to 4 core concepts, unify Tasks+Notifications, remove bloat.

---

## Phase 1: Core Changes

### 1. Remove Scrollable TopNav

**Files**:
- `apps/portal/src/components/PortalLayout.tsx` — MODIFY
- `apps/portal/src/design/TopNav.tsx` — DELETE

**Do This**:
- Remove entire `<TopNav>` component from PortalLayout
- Delete TopNav.tsx file
- Header becomes: `[OrgIdentity] [Spacer] [MessagesIcon] [ActivityIcon] [SignOut]`
- Activity icon replaces notification bell (same badge logic, different semantic meaning)

**Spec Reference**: Review doc line ~650

---

### 2. Create Activity Page (Merge Tasks + Notifications)

**Files**:
- `apps/portal/src/pages/PortalActivityPage.tsx` — CREATE NEW
- `apps/portal/src/pages/PortalTasksPageNew.tsx` — DELETE
- `apps/portal/src/pages/PortalNotificationsPageNew.tsx` — DELETE

**Do This**:
- Create new PortalActivityPage component
- Reuse existing `usePortalTasks()` and `usePortalNotifications()` hooks
- Merge + deduplicate items into unified list
- Group by: Overdue (red) → Action Required (orange) → Updates (neutral) → Completed (collapsed)
- Use same card/row layout as existing Tasks page

**Data Structure**:
```tsx
interface ActivityItem {
  id: string;
  type: 'invoice' | 'agreement' | 'offspring' | 'message' | 'document';
  urgency: 'overdue' | 'action_required' | 'update' | 'completed';
  title: string;
  subtitle: string;
  statusLabel: string;
  statusVariant: 'error' | 'action' | 'neutral' | 'success';
  href: string;
}
```

**Spec Reference**: Review doc line ~730

---

### 3. Simplify Dashboard Context Strip

**Files**:
- `apps/portal/src/pages/PortalDashboardPage.tsx` — MODIFY

**Do This**:
- Find `ContextStrip` component (line ~66)
- Remove `nextAction` prop
- Remove center text section from layout
- Change layout from 3-column to 2-column: `[Name/Species/Status] [CTA Button]`
- Simplify CTA logic: Overdue > Agreement > Payment > Schedule > View Details

**Spec Reference**: Review doc line ~570

---

### 4. Remove Financial Page View Toggle

**Files**:
- `apps/portal/src/pages/PortalFinancialsPage.tsx` — MODIFY

**Do This**:
- Delete `ViewToggle` component (line ~1489)
- Delete `viewMode` state
- Always show all invoices grouped by status: Overdue → Due → Paid
- Make Paid section collapsible, collapsed by default if other sections exist
- Remove all "Overview" vs "All Invoices" concepts

**Spec Reference**: Review doc line ~595

---

### 5. Fix Profile Request Change UX

**Files**:
- `apps/portal/src/pages/PortalProfilePageNew.tsx` — MODIFY

**Do This**:
- Phone/WhatsApp/Address: Make directly editable with save button
- Name fields: Add tooltip "Name changes are reviewed by your breeder to maintain accurate records"
- Name fields: On "Request Change" click, show inline confirmation "Request sent to [Breeder Name]"
- Email: Show text "Contact your breeder to change your email address" with mailto link

**Spec Reference**: Review doc line ~610, line ~895

---

## Routing Changes

**Add**:
- `/activity` → PortalActivityPage

**Redirects**:
- `/tasks` → `/activity` (301)
- `/notifications` → `/activity` (301)

**Update**:
- Header Activity icon → `/activity`
- Dashboard "View All Activity" → `/activity`

---

## Testing Checklist

### Navigation
- [ ] Header has exactly 4 interactive elements
- [ ] No horizontal scrolling
- [ ] Activity badge shows action-required count
- [ ] Messages badge shows unread count

### Dashboard
- [ ] No "next action" text
- [ ] CTA shows correct action
- [ ] Layout is 2-column

### Activity Page
- [ ] Overdue section first (red)
- [ ] Action Required second (orange)
- [ ] Completed collapsed by default
- [ ] Clicking item navigates correctly

### Financials
- [ ] No toggle button
- [ ] All sections visible
- [ ] Paid collapsed by default when overdue/due exist

### Profile
- [ ] Contact fields editable with save button
- [ ] Name fields show tooltip
- [ ] Request Change shows confirmation
- [ ] Email shows help text with link

---

## Rules

**DO**:
- Follow existing inline style patterns
- Reuse existing hooks and components
- Use proper TypeScript types (no `any`)
- Maintain existing error handling
- Show loading/error states

**DON'T** (not in scope):
- Replace emoji icons with SVGs
- Update empty state copy
- Create Account Hub
- Add React Query
- Remove status badge animations
- Refactor to CSS Modules
- Change session polling

---

## Specs Location

Everything is in [`docs/portal/design-review-2026-01.md`](./design-review-2026-01.md):

- **Navigation**: Line ~650
- **Activity Page**: Line ~730
- **Dashboard**: Line ~570
- **Financials**: Line ~595
- **Profile**: Line ~610, ~895
- **Component Details**: Line ~650-920
- **Visual Standards**: Line ~920-970
- **File Changes**: Appendix B

---

## Done Criteria

- All 5 tasks completed
- All testing checklist items pass
- No TypeScript errors
- No console errors
- Works on desktop + mobile
- Empty states work
- Multiple items work (10+ tasks, 20+ invoices)

---

**Read the full review doc. All specifications are there. Go implement.**
