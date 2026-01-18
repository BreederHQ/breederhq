# Marketplace Abuse Moderation

This document covers the Marketplace Abuse moderation functionality, accessible only to super admins.

## Overview

The Marketplace Abuse section allows super admins to:
- Review flagged marketplace users (buyers)
- View user block history from breeders
- Suspend/unsuspend abusive users
- Configure abuse detection thresholds

## Concept: User Blocks

Breeders can block marketplace users (buyers) at three severity levels:

| Level | Description | Typical Use |
|-------|-------------|-------------|
| LIGHT | Minor issue | Excessive messages, minor rudeness |
| MEDIUM | Moderate concern | Repeated no-shows, harassment |
| HEAVY | Serious violation | Fraud attempts, severe harassment |

When a user accumulates enough blocks across different breeders, they become flagged for admin review.

## Flagged Users Tab

### Columns

| Column | Description |
|--------|-------------|
| User | Name of the marketplace user |
| Email | User's email address |
| Active Blocks | Currently active blocks (not lifted) |
| Total Blocks | Lifetime blocks received |
| L/M/H | Breakdown by severity (Light/Medium/Heavy) |
| Approvals/Rejections | Waitlist approval vs rejection ratio |
| Status | Normal, Flagged, or Suspended |
| Flagged | Date user was flagged |

### Filters

- **Flagged only**: Show only users currently flagged for review
- **Suspended only**: Show only suspended users
- **Search**: Filter by name or email

### Status Badges

| Status | Badge Color | Description |
|--------|-------------|-------------|
| Normal | Green | No current flags |
| Flagged | Yellow | Pending admin review |
| Suspended | Red | Marketplace access revoked |

## User Detail Modal

Click any user row to open the detail modal.

### Status Banners

Colored banners appear at top showing:
- **Suspended**: Red banner with suspension date and reason
- **Flagged**: Yellow banner with flag date and reason

### Statistics Section

Grid showing:
- Active Blocks (current)
- Total Blocks (lifetime)
- Approvals (waitlist applications approved)
- Rejections (waitlist applications rejected)
- Light/Medium/Heavy block breakdown

### Block History Table

| Column | Description |
|--------|-------------|
| Breeder | Tenant/business that issued block |
| Level | LIGHT, MEDIUM, or HEAVY badge |
| Reason | Breeder's stated reason for block |
| Blocked | Date block was issued |
| Lifted | Date block was removed (or "Active") |

## Admin Actions

### Suspend User

To suspend a marketplace user:

1. Open user detail modal
2. Click "Suspend User" button
3. Enter suspension reason (required)
4. Click "Confirm Suspend"

**Effect**: User loses marketplace access but retains their account.

### Unsuspend User

To restore a suspended user:

1. Open user detail modal
2. Click "Unsuspend User" button
3. Confirmation applied immediately

### Clear Flag

For flagged (not suspended) users:

1. Open user detail modal
2. Click "Clear Flag" button
3. User returns to Normal status

Use when admin determines flags were unwarranted.

## Settings Tab

Configure abuse detection thresholds.

### Flag Threshold

- **Default**: 3 active blocks
- **Effect**: Users auto-flagged when reaching this many active blocks
- Users can adjust between 1-100

### Auto-Suspend

Optional automatic suspension:

- **Enable Auto-Suspend**: Toggle on/off
- **Auto-Suspend Threshold**: Must be greater than flag threshold
- **Effect**: Users automatically suspended when reaching this threshold

### Important Note

Auto-suspend is powerful and should be used carefully:
- Recommended to start with higher thresholds
- Review flagged users before enabling auto-suspend
- Consider the impact on legitimate users with disputes

## API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| List flagged users | `/api/v1/admin/marketplace/flagged-users` | GET |
| Get user detail | `/api/v1/admin/marketplace/users/:id` | GET |
| Suspend user | `/api/v1/admin/marketplace/users/:id/suspend` | POST |
| Unsuspend user | `/api/v1/admin/marketplace/users/:id/unsuspend` | POST |
| Clear flag | `/api/v1/admin/marketplace/users/:id/clear-flag` | POST |
| Get settings | `/api/v1/admin/marketplace/abuse-settings` | GET |
| Update settings | `/api/v1/admin/marketplace/abuse-settings` | PATCH |

### Settings Request Body

```json
{
  "flagThreshold": 3,
  "autoSuspendThreshold": 5,
  "enableAutoSuspend": false
}
```

## Workflow: Handling Flagged Users

1. **Review**: Open user detail, examine block history
2. **Context**: Consider block reasons, severity levels, patterns
3. **Decision**:
   - **Clear Flag**: User seems legitimate, blocks were unfair
   - **Warning**: Contact user about behavior (out of system)
   - **Suspend**: Pattern of abuse across multiple breeders
4. **Document**: Suspension reason is stored for reference

## Key Metrics

When reviewing a user, consider:

- **Spread**: Blocks from many breeders vs. one breeder (dispute vs. pattern)
- **Severity**: More HEAVY blocks = more serious
- **Ratio**: Rejections vs. approvals (rejected often = problematic)
- **Recency**: Old blocks may no longer be relevant
- **Lifted Blocks**: Many lifted blocks may indicate resolved issues

## Access Control

This section is **super admin only**. Regular tenant admins:
- Can block users on their own tenant
- Cannot view platform-wide abuse data
- Cannot suspend users across the platform

## Source Code

- Component: `apps/admin/src/MarketplaceAbuseAdmin.tsx`
- API client: `apps/admin/src/api.ts` (`adminApi` marketplace methods)
- Types: `MarketplaceFlaggedUserDTO`, `MarketplaceUserDetailDTO`, `MarketplaceAbuseSettingsDTO`
