# Client Profile Portal - Breeder UI Integration Guide

## Overview
This document outlines the remaining frontend work needed to integrate the Client Profile Portal change request system into the breeder-facing contacts app.

## ✅ Completed Work

### Backend
- ✅ Prisma schema with `ContactChangeRequest` and `EmailChangeRequest` models
- ✅ Portal API endpoints for clients (`/portal/profile/*`)
- ✅ Breeder API endpoints in `party-crm.ts`:
  - `GET /parties/:partyId/change-requests`
  - `POST /parties/:partyId/change-requests/:id/approve`
  - `POST /parties/:partyId/change-requests/:id/reject`
  - `GET /dashboard/pending-change-requests`

### Frontend - Portal
- ✅ Complete `PortalProfilePageNew.tsx` with self-service editing and change requests

## 🔄 Remaining Work - Breeder UI

### 1. Add Pending Request Count to Contact Data

**File**: `apps/contacts/src/App-Contacts.tsx`

**Location**: Update the `PartyTableRow` type to include pending change request count:

```typescript
export type PartyTableRow = {
  // ... existing fields ...

  // Profile change requests
  pendingChangeRequestCount?: number;
};
```

**Data Fetching**: The backend needs to be updated to include this count when fetching parties. This would be added to the parties list API endpoint (likely in `party-crm.ts` or similar):

```typescript
// In the API response, include count of pending change requests
const pendingCount = await prisma.contactChangeRequest.count({
  where: {
    contactId: contact.id,
    status: "PENDING"
  }
});
```

### 2. Add Alert Badge to Contact Cards

**File**: `apps/contacts/src/components/ContactCardView.tsx`

**Location**: Add alert badge in the top-right corner of the card (similar to vaccination alerts on animal cards)

**Implementation**:

```typescript
// Add import
import { AlertCircle } from "lucide-react";

// In ContactCard component, after the avatar/name section:
function ContactCard({ row, onClick }: { row: PartyTableRow; onClick?: () => void }) {
  // ... existing code ...

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full text-left bg-surface border border-hairline rounded-lg p-4 pl-5 overflow-hidden transition-all duration-200 cursor-pointer hover:border-[hsl(var(--foreground)/0.2)] hover:bg-[hsl(var(--foreground)/0.03)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/15"
    >
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: accentColor }}
      />

      {/* ADD THIS: Pending change request badge */}
      {row.pendingChangeRequestCount && row.pendingChangeRequestCount > 0 && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-red-500 animate-pulse">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-semibold">{row.pendingChangeRequestCount}</span>
        </div>
      )}

      {/* Top row: Avatar + Name */}
      <div className="flex items-start gap-3">
        {/* ... existing code ... */}
      </div>

      {/* ... rest of card ... */}
    </button>
  );
}
```

### 3. Add Tab Highlighting in Contact Drawer

**File**: `apps/contacts/src/PartyDetailsView.tsx`

**Location**: Find the tab rendering section and add conditional red highlighting for the "Overview" or "Portal" tab when pending changes exist.

**Pattern to follow** (from vaccination tab highlighting):
```typescript
// Red tab highlighting pattern
className={cn(
  "px-3 py-2 text-sm font-medium rounded-t-md",
  hasPendingChanges
    ? "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
    : "border-transparent text-gray-500"
)}
```

**Implementation**:

```typescript
// Add to component props or fetch data
const [pendingChangeRequests, setPendingChangeRequests] = React.useState<any[]>([]);

// Fetch pending change requests when drawer opens
React.useEffect(() => {
  if (row?.partyId) {
    fetch(`/api/v1/parties/${row.partyId}/change-requests`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        const pending = (data.requests || []).filter((r: any) => r.status === "PENDING");
        setPendingChangeRequests(pending);
      })
      .catch(console.error);
  }
}, [row?.partyId]);

const hasPendingChanges = pendingChangeRequests.length > 0;

// In the tabs section:
<button
  onClick={() => setActiveTab("overview")}
  className={cn(
    "px-3 py-2 text-sm font-medium rounded-t-md transition-colors",
    activeTab === "overview"
      ? hasPendingChanges
        ? "border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600"
      : "text-gray-500 hover:text-gray-700"
  )}
>
  Overview
  {hasPendingChanges && (
    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-500 rounded-full animate-pulse">
      {pendingChangeRequests.length}
    </span>
  )}
</button>
```

### 4. Add Change Request Management UI in Drawer

**File**: `apps/contacts/src/PartyDetailsView.tsx`

**Location**: In the "Overview" tab content, add a new section for pending change requests (similar to how Identity section is shown)

**Implementation**:

```typescript
// Add to the Overview tab content:

{hasPendingChanges && (
  <SectionCard
    title="Pending Profile Changes"
    subtitle={`${pendingChangeRequests.length} request${pendingChangeRequests.length !== 1 ? 's' : ''} awaiting your approval`}
  >
    <div className="space-y-4">
      {pendingChangeRequests.map((request: any) => (
        <div
          key={request.id}
          className="flex items-start justify-between gap-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-800/50"
        >
          <div className="flex-1">
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {request.fieldName === "firstName" && "First Name"}
              {request.fieldName === "lastName" && "Last Name"}
              {request.fieldName === "nickname" && "Nickname"}
            </div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="line-through">{request.oldValue || "(not set)"}</span>
              {" → "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {request.newValue}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Requested {new Date(request.requestedAt).toLocaleDateString()}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  await fetch(`/api/v1/parties/${row.partyId}/change-requests/${request.id}/approve`, {
                    method: "POST",
                    credentials: "include"
                  });
                  // Refresh data
                  window.location.reload(); // Or better: refetch data
                } catch (err) {
                  console.error("Failed to approve:", err);
                  alert("Failed to approve request");
                }
              }}
              className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              Approve
            </button>
            <button
              onClick={async () => {
                const reason = prompt("Rejection reason (optional):");
                if (reason === null) return; // Cancelled

                try {
                  await fetch(`/api/v1/parties/${row.partyId}/change-requests/${request.id}/reject`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason })
                  });
                  // Refresh data
                  window.location.reload(); // Or better: refetch data
                } catch (err) {
                  console.error("Failed to reject:", err);
                  alert("Failed to reject request");
                }
              }}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  </SectionCard>
)}
```

### 5. Dashboard Mission Control Integration

**File**: `apps/dashboard/src/pages/DashboardPage.tsx` (or similar)

**Location**: Add a new notification card or todo item for pending change requests

**Implementation**:

```typescript
// Fetch pending change requests count
const [pendingChangeRequestsCount, setPendingChangeRequestsCount] = React.useState(0);

React.useEffect(() => {
  fetch("/api/v1/dashboard/pending-change-requests", {
    credentials: "include"
  })
    .then(res => res.json())
    .then(data => setPendingChangeRequestsCount(data.count || 0))
    .catch(console.error);
}, []);

// Add to the dashboard cards:
{pendingChangeRequestsCount > 0 && (
  <DashboardCard
    title="Profile Change Requests"
    count={pendingChangeRequestsCount}
    description={`${pendingChangeRequestsCount} client${pendingChangeRequestsCount !== 1 ? 's' : ''} requested profile changes`}
    icon={<UserIcon />}
    link="/contacts" // Link to contacts with filter?
    variant="warning"
  />
)}
```

## Visual Design Reference

### Alert Badge (Flashing)
Use Tailwind's `animate-pulse` class for the flashing effect:
```tsx
<div className="text-red-500 animate-pulse">
  <AlertCircle className="w-4 h-4" />
</div>
```

### Tab Highlighting (Red)
```css
border-red-200 dark:border-red-800/50
bg-red-50/50 dark:bg-red-950/20
text-red-700 dark:text-red-400
```

### Status Badge Colors
- **Pending**: Yellow/Amber
- **Approved**: Green
- **Rejected**: Red

## Testing Checklist

- [ ] Contact cards show alert badge when pending changes exist
- [ ] Alert badge animates with pulse effect
- [ ] Badge shows correct count
- [ ] Contact drawer tab highlights in red when pending changes exist
- [ ] Tab badge shows count
- [ ] Pending changes section displays in Overview tab
- [ ] Approve button works and updates contact
- [ ] Reject button prompts for reason and works
- [ ] Dashboard shows pending request count
- [ ] All changes log to PartyActivity audit trail
- [ ] Real-time updates after approve/reject (or page refresh)

## Migration Command

When ready to apply the schema changes:

```bash
cd breederhq-api
npx prisma migrate dev --name add_client_profile_change_requests
```

This will create the `ContactChangeRequest` and `EmailChangeRequest` tables.

## API Endpoints Reference

### For Breeder App

- `GET /api/v1/parties/:partyId/change-requests` - List all change requests for a contact
- `POST /api/v1/parties/:partyId/change-requests/:id/approve` - Approve a request
- `POST /api/v1/parties/:partyId/change-requests/:id/reject` - Reject with optional reason
- `GET /api/v1/dashboard/pending-change-requests` - Get count for dashboard

### For Portal App

- `GET /api/v1/portal/profile` - Get profile + pending changes
- `PATCH /api/v1/portal/profile` - Update self-service fields
- `POST /api/v1/portal/profile/request-name-change` - Request name change
- `DELETE /api/v1/portal/profile/change-requests/:id` - Cancel pending request

## Notes

- The portal profile page is fully functional and ready to test once the migration is applied
- The API endpoints are implemented and ready to use
- The breeder UI enhancements are straightforward additions to existing components
- Consider adding toast notifications for approve/reject actions instead of page refresh
- Consider adding filtering to contacts list to show "Has Pending Changes" filter
