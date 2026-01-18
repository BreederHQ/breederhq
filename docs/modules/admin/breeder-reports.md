# Breeder Reports Management

This document covers the Breeder Reports management functionality, accessible only to super admins.

## Overview

The Breeder Reports section allows super admins to:
- Review reports submitted by marketplace users against breeders
- Issue warnings to breeders
- Suspend breeder marketplace listings
- Configure auto-flagging settings

## Concept: Breeder Reports

Marketplace users can report breeders for various reasons. Unlike user blocks (which are breeder actions), reports are buyer-initiated complaints that require admin review.

### Report Reasons

| Reason | Description |
|--------|-------------|
| SPAM | Excessive unsolicited contact |
| FRAUD | Fraudulent activity or scams |
| HARASSMENT | Abusive or threatening behavior |
| MISREPRESENTATION | False advertising, misleading info |
| OTHER | Other issues not categorized |

### Report Severity

| Severity | Description | Badge Color |
|----------|-------------|-------------|
| LIGHT | Minor concern | Yellow |
| MEDIUM | Moderate issue | Orange |
| HEAVY | Serious violation | Red |

### Report Status

| Status | Description | Badge Color |
|--------|-------------|-------------|
| PENDING | Awaiting review | Blue |
| REVIEWED | Admin has reviewed | Purple |
| DISMISSED | Report deemed invalid | Gray |
| ACTIONED | Admin took action | Green |

## Reported Breeders Tab

### Columns

| Column | Description |
|--------|-------------|
| Business | Breeder's business name |
| Email | Breeder's primary email |
| Total Reports | Lifetime reports received |
| Pending | Reports awaiting review |
| L/M/H | Breakdown by severity |
| Status | Normal, Flagged, Warning Issued, or Suspended |
| Flagged | Date breeder was flagged |

### Filters

- **Flagged only**: Show flagged breeders pending review
- **Warning issued**: Show breeders with active warnings
- **Suspended only**: Show suspended breeders
- **Search**: Filter by business name or email

### Status Progression

```
Normal → Flagged → Warning Issued → Suspended
```

Each status indicates escalating concern and administrative action.

## Breeder Detail Modal

Click any breeder row to open the detail modal.

### Status Banners

| Banner | Color | Shows |
|--------|-------|-------|
| Suspended | Red | Suspension date and reason |
| Warning Issued | Yellow | Warning date and note |
| Flagged | Orange | Flag date and auto-flag reason |

### Statistics Grid

- Total Reports
- Pending (awaiting review)
- By Severity (L/M/H breakdown)
- Current Status badge

### Report History Table

| Column | Description |
|--------|-------------|
| Reporter | Masked user ID (privacy) |
| Reason | SPAM, FRAUD, etc. |
| Severity | LIGHT, MEDIUM, HEAVY |
| Status | PENDING, REVIEWED, etc. |
| Date | When report was submitted |

## Admin Actions

### Clear Flag

For flagged breeders that don't warrant action:

1. Open breeder detail modal
2. Click "Clear Flag" button
3. Breeder returns to Normal status

### Issue Warning

To formally warn a breeder:

1. Open breeder detail modal
2. Click "Issue Warning" button
3. Enter warning note (required)
4. Click "Issue Warning" to confirm

**Effect**:
- Warning is recorded with timestamp
- Breeder may receive notification
- Status changes to "Warning Issued"

### Suspend Marketplace Listing

To suspend a breeder's marketplace presence:

1. Open breeder detail modal
2. Click "Suspend Listing" button
3. Enter suspension reason (required)
4. Click "Suspend Listing" to confirm

**Effect**:
- Breeder's listings hidden from marketplace
- Breeder's account remains active
- Status changes to "Suspended"

### Restore Listing

To unsuspend a breeder:

1. Open suspended breeder's detail modal
2. Click "Restore Listing" button
3. Confirmation applied immediately

## Settings Tab

Configure breeder report handling.

### Flag Threshold

- **Default**: 3 reports
- **Effect**: Breeders auto-flagged when reaching this many reports
- Adjustable between 1-50

### Enable Auto-Flag

- Toggle automatic flagging on/off
- When disabled, breeders must be manually flagged

### Important Note

Unlike marketplace user abuse, breeders are **never automatically suspended**. The information panel explains:

> "Unlike marketplace user abuse, breeders are not automatically suspended. All suspension actions require manual admin review since breeders are paying customers."

This ensures paying customers receive due process before any service disruption.

## API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| List flagged breeders | `/api/v1/admin/breeder-reports/flagged` | GET |
| Get breeder detail | `/api/v1/admin/breeder-reports/:tenantId` | GET |
| Clear flag | `/api/v1/admin/breeder-reports/:tenantId/clear-flag` | POST |
| Issue warning | `/api/v1/admin/breeder-reports/:tenantId/warn` | POST |
| Suspend listing | `/api/v1/admin/breeder-reports/:tenantId/suspend` | POST |
| Unsuspend listing | `/api/v1/admin/breeder-reports/:tenantId/unsuspend` | POST |
| Get settings | `/api/v1/admin/breeder-reports/settings` | GET |
| Update settings | `/api/v1/admin/breeder-reports/settings` | PATCH |

### Warning Request Body

```json
{
  "note": "Multiple reports of delayed responses. Please improve communication."
}
```

### Suspend Request Body

```json
{
  "reason": "Repeated fraud reports from multiple buyers. Account under investigation."
}
```

## Workflow: Handling Reported Breeders

### Standard Process

1. **Review Reports**: Examine each pending report
2. **Assess Severity**: Consider patterns, not just counts
3. **Contact if Needed**: Reach out to breeder for their side
4. **Decision**:
   - **Clear Flag**: Reports seem unfounded
   - **Issue Warning**: First offense, needs correction
   - **Suspend**: Pattern of serious violations

### Escalation Path

1. First significant issue → Warning
2. Continued issues after warning → Second warning or suspension
3. Fraud or severe harassment → Immediate suspension consideration

### Key Considerations

- **Customer Status**: Breeders are paying customers
- **Business Impact**: Suspension affects their livelihood
- **Evidence**: Multiple independent reports carry more weight
- **Pattern**: One-off complaints differ from repeated issues
- **Severity Mix**: Heavy reports need more attention than light

## Comparison: User Blocks vs. Breeder Reports

| Aspect | User Blocks | Breeder Reports |
|--------|-------------|-----------------|
| Initiated by | Breeders | Buyers |
| Target | Marketplace users | Breeders |
| Auto-suspend | Optional | Never |
| Reason | Admin discretion | Required selection |
| Impact | Marketplace access | Listing visibility |

## Access Control

This section is **super admin only**. Breeders (tenant admins):
- Cannot see reports against themselves through this UI
- May receive notifications about warnings
- Are notified of listing suspension

## Privacy

Reporter identities are masked in the admin UI (`reporterUserIdMasked`) to:
- Protect reporter privacy
- Prevent retaliation
- Maintain trust in reporting system

## Source Code

- Component: `apps/admin/src/BreederReportsAdmin.tsx`
- API client: `apps/admin/src/api.ts` (`breederReportsApi`)
- Types: `BreederFlaggedDTO`, `BreederReportDTO`, `BreederReportDetailDTO`, `BreederReportSettingsDTO`
