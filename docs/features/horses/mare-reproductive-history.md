# Mare Reproductive History

**Status:** Implemented
**Version:** 1.0.0
**Date:** January 2026
**Feature Type:** Horse-specific reproductive tracking

## Overview

The Mare Reproductive History feature automatically aggregates and maintains lifetime reproductive history for mares (female horses) based on completed breeding plans and foaling outcomes. This provides breeders with critical historical context when planning future breedings, identifying high-risk mares, and understanding reproductive patterns.

### Automatic Operation (Zero Manual Intervention)

This system is designed to be **completely automatic** with no user intervention required:

1. **Auto-updates on Save:** When a foaling outcome is saved, the mare's history automatically recalculates
2. **Auto-generates on View:** When a user opens the Breeding History tab for the first time, history automatically generates from existing data
3. **Self-healing:** If an update fails during outcome save, the system automatically regenerates history when the tab is viewed
4. **No Manual Buttons:** Users never see or need to click "refresh" or "recalculate"

**Design Philosophy:** Users should never have to think about data synchronization. The system handles everything automatically behind the scenes.

## Business Value

### For Breeders
- **Risk Assessment**: Identify mares with complications history before planning breeding
- **Pattern Recognition**: Track foal heat cycle timing to optimize rebreeding windows
- **Historical Context**: Quick access to lifetime foaling statistics without manual review
- **Breeding Decisions**: Data-driven insights for stallion selection and breeding timing

### For Operations
- **Automatic Maintenance**: History updates automatically when foaling outcomes are recorded
- **No Manual Entry**: Zero additional data entry burden
- **Data Integrity**: Single source of truth aggregated from breeding records

## Architecture

### Database Layer

#### MareReproductiveHistory Table
**Location:** `breederhq-api/prisma/schema.prisma:3462-3510`

```prisma
model MareReproductiveHistory {
  id       Int    @id @default(autoincrement())
  tenantId Int
  mareId   Int    @unique  // 1:1 relationship with Animal

  // Lifetime Statistics
  totalFoalings                Int @default(0)
  totalLiveFoals               Int @default(0)
  totalComplicatedFoalings     Int @default(0)
  totalVeterinaryInterventions Int @default(0)
  totalRetainedPlacentas       Int @default(0)

  // Last Foaling Information
  lastFoalingDate          DateTime?
  lastFoalingComplications Boolean?
  lastMareCondition        String?
  lastPlacentaPassed       Boolean?
  lastPlacentaMinutes      Int?

  // Post-Foaling Heat Patterns (averages)
  avgPostFoalingHeatDays Float?
  minPostFoalingHeatDays Int?
  maxPostFoalingHeatDays Int?

  // Breeding Readiness Tracking
  lastPostFoalingHeatDate DateTime?
  lastReadyForRebreeding  Boolean?
  lastRebredDate          DateTime?

  // Risk Assessment
  riskScore   Int      @default(0)  // 0-100 scale
  riskFactors String[]  // Array of identified risk factors

  // Metadata
  lastUpdatedFromPlanId    Int?
  lastUpdatedFromBreedYear Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Migration:** `breederhq-api/prisma/migrations/20260117000000_add_mare_reproductive_history/migration.sql`

### Service Layer

**Location:** `breederhq-api/src/services/mare-reproductive-history-service.ts`

#### Core Functions

##### `updateMareReproductiveHistory(mareId, tenantId, breedingPlanId)`
Automatically aggregates all foaling outcomes for a mare and updates or creates the history record.

**Algorithm:**
1. Fetch all completed breeding plans for the mare with foaling outcomes
2. Calculate aggregate statistics:
   - Total foalings count
   - Total live foals (from offspring records)
   - Complication rate (hadComplications)
   - Veterinary intervention count (veterinarianCalled)
   - Retained placenta count (placentaPassed === false or > 180 minutes)
3. Calculate post-foaling heat cycle patterns:
   - Average days between birth and foal heat
   - Min/max range across all foalings
4. Calculate risk score (0-100):
   - Complication rate × 40 points
   - Retained placenta rate × 30 points
   - Veterinary intervention rate × 30 points
5. Identify risk factors:
   - "High complication rate" (>30%)
   - "History of retained placenta"
   - "Frequent veterinary interventions" (>50% of foalings)

##### `getMareReproductiveHistory(mareId, tenantId)`
Retrieves the aggregate history summary for a mare.

##### `getMareDetailedFoalingHistory(mareId, tenantId)`
Returns a list of all individual foaling events with outcomes, including:
- Breeding plan details (code, dates, sire)
- Foal count and survival
- Outcome details (complications, mare condition, placenta status)

##### `recalculateMareHistory(mareId, tenantId)`
Forces recalculation of history from scratch. Useful for:
- Backfilling data for existing mares
- Correcting data after manual updates
- One-time maintenance operations

### API Endpoints

**Location:** `breederhq-api/src/routes/breeding.ts:2636-2688`

```
GET  /breeding/mares/:mareId/reproductive-history
GET  /breeding/mares/:mareId/foaling-history
POST /breeding/mares/:mareId/reproductive-history/recalculate
```

#### GET /breeding/mares/:mareId/reproductive-history
Returns aggregate reproductive history for a mare.

**Authorization:** Tenant-scoped (requires tenantId match)

**Response:**
```json
{
  "id": 123,
  "mareId": 456,
  "totalFoalings": 5,
  "totalLiveFoals": 5,
  "totalComplicatedFoalings": 1,
  "totalVeterinaryInterventions": 2,
  "totalRetainedPlacentas": 0,
  "lastFoalingDate": "2025-04-20T00:00:00.000Z",
  "lastFoalingComplications": false,
  "lastMareCondition": "EXCELLENT",
  "lastPlacentaPassed": true,
  "lastPlacentaMinutes": 45,
  "avgPostFoalingHeatDays": 9.2,
  "minPostFoalingHeatDays": 8,
  "maxPostFoalingHeatDays": 11,
  "lastPostFoalingHeatDate": "2025-04-29T00:00:00.000Z",
  "lastReadyForRebreeding": true,
  "lastRebredDate": "2025-05-15T00:00:00.000Z",
  "riskScore": 15,
  "riskFactors": [],
  "lastUpdatedFromBreedYear": 2025
}
```

**Error Responses:**
- `404` - No history found for this mare (no completed foalings)

#### GET /breeding/mares/:mareId/foaling-history
Returns detailed list of all foaling events.

**Response:**
```json
[
  {
    "breedingPlanId": 789,
    "breedingPlanCode": "PLN-MARE-2025",
    "breedDate": "2024-07-15T00:00:00.000Z",
    "birthDate": "2025-04-20T00:00:00.000Z",
    "sire": { "id": 101, "name": "Champion Stallion" },
    "foalCount": 1,
    "liveFoalCount": 1,
    "outcome": {
      "hadComplications": false,
      "veterinarianCalled": true,
      "mareCondition": "EXCELLENT",
      "placentaPassed": true,
      "placentaPassedMinutes": 45,
      "postFoalingHeatDate": "2025-04-29T00:00:00.000Z",
      "readyForRebreeding": true,
      "rebredDate": "2025-05-15T00:00:00.000Z"
    }
  }
]
```

#### POST /breeding/mares/:mareId/reproductive-history/recalculate
Triggers recalculation of mare history from all breeding plans.

**Response:** Same as GET reproductive-history

**Use Cases:**
- Backfilling history for mares with pre-existing foaling records
- Correcting data after manual database updates
- One-time maintenance operations

### Automatic Updates

**Location:** `breederhq-api/src/services/breeding-foaling-service.ts:269-277`

The mare reproductive history is automatically updated whenever a foaling outcome is saved:

```typescript
export async function addFoalingOutcome(params) {
  // ... create/update foaling outcome ...

  // Update mare reproductive history if this is a horse breeding with a dam
  if (plan.species === "HORSE" && plan.damId) {
    try {
      await updateMareReproductiveHistory(plan.damId, tenantId, breedingPlanId);
    } catch (err) {
      console.error("[Foaling] Failed to update mare reproductive history:", err);
      // Don't fail the outcome save if history update fails
    }
  }

  return outcome;
}
```

**Key Design Decisions:**
- **Non-blocking:** History update failures don't prevent outcome save
- **Automatic Updates:** History recalculates on every outcome save
- **Auto-generation on View:** If no history exists when viewing the tab, automatically generates from existing data
- **Idempotent:** Can be run multiple times safely
- **No Manual Intervention:** Users never need to click "refresh" or "recalculate"

## User Interface

### Mare Reproductive History Tab

**Location:** `apps/animals/src/components/MareReproductiveHistoryTab.tsx`

The reproductive history is displayed in a new "Breeding History" tab on the mare's Animal drawer. The tab only appears for female horses.

#### Tab Visibility
```typescript
// Tab appears only for mares
if (species === "HORSE" && sex === "FEMALE") {
  tabs.push({ key: "mare-history", label: "Breeding History" });
}
```

#### Sections

##### 1. Summary Header
- Total lifetime foalings count
- Last update source (breeding year)

##### 2. Lifetime Statistics
Grid displaying:
- **Total Foalings**: Count of completed breedings
- **Live Foals**: Surviving foals
- **Complication Rate**: Percentage of foalings with complications
- **Survival Rate**: Percentage of foals born alive

##### 3. Risk Assessment
- **Risk Score**: 0-100 scale with color coding
  - 0: Green (no risk)
  - 1-29: Light green (low risk)
  - 30-49: Amber (moderate risk)
  - 50-69: Orange (elevated risk)
  - 70-100: Red (high risk)
- **Risk Factors**: List of identified issues
  - High complication rate
  - History of retained placenta
  - Frequent veterinary interventions

##### 4. Last Foaling Information
Details from most recent foaling:
- Foaling date
- Mare post-foaling condition
- Complications (yes/no)
- Placenta passed status and timing

##### 5. Foal Heat Cycle Patterns
Statistics for breeding planning:
- **Average Days**: Mean time from birth to foal heat
- **Min Days**: Earliest foal heat observed
- **Max Days**: Latest foal heat observed
- Comparison to typical range (7-12 days)

##### 6. Detailed History (Expandable)
Click "Show Details" to view:
- List of all foaling events
- Breeding plan codes
- Breed and birth dates
- Sire names
- Foal counts (live vs total)
- Outcome summaries with icons

#### Empty States

**No History Yet:**
```
🐴 No foaling history recorded yet for [Mare Name].
Reproductive history will be automatically generated after
the first foaling outcome is recorded.
```

**Not a Mare:**
```
💗 Reproductive history tracking is only available for
female horses (mares).
```

### Integration with Animals App

**Location:** `apps/animals/src/App-Animals.tsx:8171-8173` (tab list)
**Location:** `apps/animals/src/App-Animals.tsx:8804-8814` (tab content)

**API Client:** `apps/animals/src/api.ts:1394-1426`

```typescript
const mareReproductiveHistory = {
  async get(mareId: string | number): Promise<any>,
  async getDetailedHistory(mareId: string | number): Promise<any[]>,
  async recalculate(mareId: string | number): Promise<any>
};
```

## Data Flow

### New Foaling Outcome Flow

```
1. User saves foaling outcome in Breeding app
   ↓
2. POST /breeding/plans/:id/foaling-outcome
   ↓
3. addFoalingOutcome() creates/updates FoalingOutcome record
   ↓
4. updateMareReproductiveHistory() triggered (async, non-blocking)
   ↓
5. Aggregates all foaling data for the mare
   ↓
6. Calculates statistics, risk score, patterns
   ↓
7. Upserts MareReproductiveHistory record
   ↓
8. User views updated history in Animals app "Breeding History" tab
```

### Automatic Generation Flow (First View)

```
1. User opens Breeding History tab in Animals app
   ↓
2. GET /breeding/mares/:mareId/reproductive-history
   ↓
3. Returns 404 (no history exists yet)
   ↓
4. Frontend automatically calls POST /breeding/mares/:mareId/reproductive-history/recalculate
   ↓
5. recalculateMareHistory() finds latest breeding plan
   ↓
6. Calls updateMareReproductiveHistory()
   ↓
7. Fresh aggregation of all data
   ↓
8. Returns generated history to UI
   ↓
9. User sees complete history (no manual action required)
```

**Key Point:** Users never need to manually trigger recalculation - it happens automatically on first view.

## Risk Scoring Algorithm

### Calculation Formula

```javascript
let riskScore = 0;

// Complication rate (up to 40 points)
const complicationRate = totalComplicatedFoalings / totalFoalings;
riskScore += complicationRate * 40;

// Retained placenta rate (up to 30 points)
const placentaRate = totalRetainedPlacentas / totalFoalings;
riskScore += placentaRate * 30;

// Veterinary intervention frequency (up to 30 points)
riskScore += Math.min(30, totalVeterinaryInterventions * 5);

riskScore = Math.min(100, Math.round(riskScore));
```

### Risk Factor Identification

**High Complication Rate:**
- Triggered when: complicationRate > 0.3 (30%)
- Indicates: Mare requires closer monitoring

**History of Retained Placenta:**
- Triggered when: totalRetainedPlacentas > 0
- Indicates: Increased risk of infection, potential fertility impact

**Frequent Veterinary Interventions:**
- Triggered when: totalVeterinaryInterventions > totalFoalings * 0.5
- Indicates: Mare may require specialized care

## Performance Considerations

### Database Queries
- History updates query all completed breeding plans for the mare
- Includes joins to FoalingOutcome and OffspringGroup with Offspring
- Indexed on `mareId` and `tenantId` for fast lookups

### Caching Strategy
- Data is materialized in MareReproductiveHistory table (denormalized)
- No runtime aggregation needed for display
- Updates are write-heavy but reads are instantaneous

### Scaling
- One history record per mare (1:1 relationship)
- Update operations are async and non-blocking
- Suitable for high-volume breeding operations

## Testing Strategy

### Unit Tests
**Service Layer:**
- Test aggregation logic with various foaling scenarios
- Test risk score calculation edge cases
- Test pattern recognition (foal heat days)

**Test Cases:**
```typescript
describe('updateMareReproductiveHistory', () => {
  it('should calculate correct statistics for single foaling');
  it('should calculate correct statistics for multiple foalings');
  it('should handle foalings with no outcomes');
  it('should correctly identify high complication rate');
  it('should calculate foal heat patterns correctly');
  it('should handle edge case: no live foals');
  it('should handle edge case: retained placenta at 181 minutes');
});
```

### Integration Tests
- Test automatic update trigger from foaling outcome save
- Test API endpoint responses
- Test tenant isolation (mare from different tenant)

### UI Tests
- Tab visibility for mares only
- Empty state displays
- Data refresh on recalculate
- Detailed history expansion

## Migration Strategy

### Initial Rollout

1. **Database Migration:** Run schema migration to create table
2. **Deploy Service Layer:** Release service functions and API endpoints
3. **Deploy UI:** Release Animals app with new tab
4. **Automatic Backfill:** No manual backfill needed! History automatically generates when users open the Breeding History tab for each mare
5. **Monitor:** Track automatic updates on new foaling outcomes

**Why No Manual Backfill?** The system auto-generates history on first view, so users naturally backfill data as they use the feature. This eliminates the need for a one-time migration script.

### Optional Backfill Script (For Admin Use Only)

If you need to pre-generate history for all mares (e.g., for testing or reporting), you can use this script. **However, this is optional** - the system will auto-generate history as users view each mare's tab.

```javascript
// Optional: Pre-generate history for all mares with foaling data
// Note: This is NOT required - system auto-generates on first view
async function backfillAllMareHistory() {
  const mares = await prisma.breedingPlan.findMany({
    where: {
      species: 'HORSE',
      damId: { not: null },
      birthDateActual: { not: null },
    },
    select: { damId: true, tenantId: true },
    distinct: ['damId'],
  });

  console.log(`Pre-generating history for ${mares.length} mares...`);

  for (const { damId, tenantId } of mares) {
    await recalculateMareHistory(damId, tenantId);
  }

  console.log('Done! (But users would have gotten this automatically anyway)');
}
```

## Future Enhancements

### Potential Features

1. **Comparative Analytics**
   - Compare mare's statistics to breed averages
   - Benchmark against facility/region norms

2. **Predictive Insights**
   - Predict foal heat timing based on history
   - Estimate complication risk for next breeding

3. **Alerts and Notifications**
   - Alert when high-risk mare is bred
   - Notify when pattern deviates from norm

4. **Export and Reporting**
   - Generate PDF reports for mare history
   - Export data for veterinary consultations

5. **Genetic Correlation**
   - Link foaling success to genetic markers
   - Track genetic contribution to offspring performance

6. **Extended Tracking**
   - Track offspring outcomes (racing, showing, breeding)
   - Link mare value to offspring success

## Related Documentation

- [Foaling Automation](./foaling-automation.md)
- [Breeding Plans](../horse-breeding-mvp/04-BREEDING-PLANS.md)
- [Foaling Milestones](../horse-breeding-mvp/06-FOALING-MILESTONES.md)
- [Database Schema - FoalingOutcome](../../api/schema/foaling-outcome.md)

## Support and Troubleshooting

### Common Issues

**History not updating after foaling outcome saved:**
- Check console logs for "[Foaling] Failed to update mare reproductive history"
- Verify breeding plan has species = 'HORSE' and damId is set
- If update failed, history will auto-regenerate when user views the Breeding History tab
- No manual intervention needed - system is self-healing

**Risk score seems incorrect:**
- Review risk scoring algorithm above
- Check that all foaling outcomes have been recorded
- Close and reopen the Breeding History tab to refresh data
- System automatically recalculates on each outcome save

**Tab not appearing for mare:**
- Verify animal.species === "HORSE"
- Verify animal.sex === "FEMALE"
- Check browser console for any React errors

### Support Contacts

- **Technical Issues:** Development Team
- **Data Questions:** Product Team
- **User Training:** Customer Success

---

**Last Updated:** January 2026
**Maintained By:** Development Team
**Version:** 1.0.0
