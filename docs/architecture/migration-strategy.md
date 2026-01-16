# Database Migration Strategy

**Review Date**: 2026-01-12
**Status**: REQUIRED FOR PRODUCTION
**Priority**: CRITICAL

This document outlines the production-safe migration strategy for deploying marketplace database changes with zero downtime.

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Phase 1: Schema Preparation](#phase-1-schema-preparation)
4. [Phase 2: Dual-Write Period](#phase-2-dual-write-period)
5. [Phase 3: Data Migration](#phase-3-data-migration)
6. [Phase 4: Validation](#phase-4-validation)
7. [Phase 5: Cutover](#phase-5-cutover)
8. [Phase 6: Cleanup](#phase-6-cleanup)
9. [Rollback Procedures](#rollback-procedures)
10. [Monitoring and Alerts](#monitoring-and-alerts)

---

## Migration Overview

### Goals

- **Zero downtime**: Application remains available throughout migration
- **Data integrity**: No data loss or corruption
- **Performance**: No degradation during migration
- **Reversibility**: Ability to rollback at any point

### Timeline

**Total Duration**: 3-4 weeks
- Schema preparation: 3 days
- Dual-write deployment: 1 week
- Data migration: 3-5 days
- Validation: 2-3 days
- Cutover: 1 day
- Cleanup: 1-2 weeks (ongoing)

### Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data loss during migration | Low | Critical | Backup before migration, verify after |
| Performance degradation | Medium | High | Load test dual-write, monitor metrics |
| Dual-write sync failures | Medium | High | Implement retry logic, alert on failures |
| Rollback data loss | Low | High | Keep old tables until validation complete |
| Cross-DB reference orphans | Medium | High | Validate referential integrity continuously |

---

## Pre-Migration Checklist

### 1. Backup Strategy

**REQUIRED BEFORE STARTING**:

```bash
# 1. Full database backup
pg_dump -U postgres -d breederhq -F c -f /backup/breederhq_pre_migration_$(date +%Y%m%d_%H%M%S).dump

# 2. Record current WAL position (for point-in-time recovery)
psql -U postgres -d breederhq -t -c "SELECT pg_current_wal_lsn()" > /backup/wal_position_pre_migration.txt

# 3. Verify backup integrity
pg_restore --list /backup/breederhq_pre_migration_*.dump | wc -l
```

### 2. Staging Environment Validation

**REQUIRED**:
- [ ] Migration tested on staging with production-like data
- [ ] Rollback tested on staging
- [ ] Performance benchmarks recorded (baseline queries)
- [ ] Dual-write load tested (1000 req/s sustained)

### 3. Monitoring Setup

**REQUIRED**:
- [ ] Database query performance metrics
- [ ] Replication lag monitoring (if applicable)
- [ ] Application error rate monitoring
- [ ] Disk space alerts (migrations can consume significant temp space)
- [ ] Dual-write failure rate alerts

### 4. Team Readiness

**REQUIRED**:
- [ ] On-call engineer assigned
- [ ] Rollback procedure documented and reviewed
- [ ] Communication plan prepared (stakeholder notifications)
- [ ] Maintenance window scheduled (if needed for final cutover)

---

## Phase 1: Schema Preparation

**Duration**: 3 days
**Downtime**: None
**Reversible**: Yes (simple column drops)

### Step 1.1: Add New Columns (Non-Breaking)

Run these migrations **during business hours** (they're lightweight):

```sql
-- Migration: 001_add_marketplace_fields.sql
BEGIN;

-- Add marketplace payment mode to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketplace_payment_mode VARCHAR(50);

-- Add marketplace user ID to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_user_id INTEGER;

-- Add marketplace transaction tracking
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_first_transaction_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_last_transaction_at TIMESTAMP;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_transaction_count INTEGER DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_total_spent_cents BIGINT DEFAULT 0;

-- Add invoice marketplace flags
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_marketplace_invoice BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS marketplace_transaction_id INTEGER;

COMMIT;
```

**Validation**:
```sql
-- Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('tenants', 'contacts', 'invoices')
  AND column_name LIKE '%marketplace%';
```

### Step 1.2: Add Indexes (CONCURRENTLY)

Run these **outside transaction blocks** to avoid table locks:

```sql
-- Migration: 002_add_marketplace_indexes.sql

-- Contacts marketplace user lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_marketplace_user_tenant
  ON contacts(marketplace_user_id, tenant_id)
  WHERE marketplace_user_id IS NOT NULL;

-- Invoice marketplace transaction lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_marketplace_transaction
  ON invoices(tenant_id, marketplace_transaction_id, status)
  WHERE marketplace_transaction_id IS NOT NULL;

-- Invoice marketplace flag lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_marketplace_flag
  ON invoices(tenant_id, is_marketplace_invoice, status)
  WHERE is_marketplace_invoice = TRUE;
```

**Validation**:
```sql
-- Verify indexes exist and are valid
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE indexname LIKE '%marketplace%'
  AND schemaname = 'public';
```

### Step 1.3: Set Default Values

```sql
-- Migration: 003_set_marketplace_defaults.sql
BEGIN;

-- Set default payment mode for existing tenants
UPDATE tenants
SET marketplace_payment_mode = 'manual'
WHERE marketplace_payment_mode IS NULL;

-- Make marketplace_payment_mode required
ALTER TABLE tenants ALTER COLUMN marketplace_payment_mode SET DEFAULT 'manual';
ALTER TABLE tenants ALTER COLUMN marketplace_payment_mode SET NOT NULL;

-- Add constraint
ALTER TABLE tenants ADD CONSTRAINT chk_marketplace_payment_mode
  CHECK (marketplace_payment_mode IN ('stripe', 'manual', 'disabled'));

COMMIT;
```

**Validation**:
```sql
-- Verify no NULL values
SELECT COUNT(*) FROM tenants WHERE marketplace_payment_mode IS NULL;
-- Should return 0

-- Verify constraint exists
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'chk_marketplace_payment_mode';
```

---

## Phase 2: Dual-Write Period

**Duration**: 1 week minimum
**Downtime**: None
**Purpose**: Run old and new code paths in parallel to ensure correctness

### Step 2.1: Deploy Dual-Write Code

**Feature Flag Configuration**:
```typescript
// config/feature-flags.ts
export const MARKETPLACE_DUAL_WRITE_ENABLED = process.env.MARKETPLACE_DUAL_WRITE === 'true';
export const MARKETPLACE_READ_FROM_NEW = process.env.MARKETPLACE_READ_NEW === 'true';
```

**Dual-Write Implementation Example**:
```typescript
async function createMarketplaceListing(data: CreateListingData) {
  let oldListing, newListing;

  try {
    // Write to old location (existing table)
    oldListing = await prisma.marketplaceListing.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        // ... other fields
      }
    });

    if (MARKETPLACE_DUAL_WRITE_ENABLED) {
      // Write to new location (new schema/table)
      newListing = await marketplacePrisma.serviceListing.create({
        data: {
          providerId: data.providerId,
          title: data.title,
          // ... other fields
        }
      });

      // Log success
      logger.info('Dual-write success', {
        oldId: oldListing.id,
        newId: newListing.id
      });
    }

    // Return old listing (backwards compatible)
    return oldListing;

  } catch (error) {
    // Alert on dual-write failure
    metrics.increment('marketplace.dual_write.failure');
    logger.error('Dual-write failed', { error, data });

    // Don't fail the request - old write succeeded
    return oldListing;
  }
}
```

### Step 2.2: Monitor Dual-Write Health

**Metrics to Track**:
```typescript
// Dual-write success rate
metrics.gauge('marketplace.dual_write.success_rate', successRate);

// Dual-write latency
metrics.histogram('marketplace.dual_write.duration_ms', duration);

// Sync failures
metrics.counter('marketplace.dual_write.sync_failure', 1, { entity: 'listing' });
```

**Alerts**:
- Dual-write success rate < 95%: Warning
- Dual-write success rate < 90%: Critical
- Dual-write latency > 500ms: Warning

### Step 2.3: Sync Historical Data (Background)

Run background job to backfill new tables with historical data:

```typescript
async function syncHistoricalListings() {
  const batchSize = 100;
  let offset = 0;
  let syncedCount = 0;
  let errorCount = 0;

  while (true) {
    // Fetch batch from old table
    const oldListings = await prisma.marketplaceListing.findMany({
      where: { status: 'ACTIVE' },
      take: batchSize,
      skip: offset,
      orderBy: { id: 'asc' }
    });

    if (oldListings.length === 0) break;

    for (const oldListing of oldListings) {
      try {
        // Check if already synced
        const exists = await marketplacePrisma.serviceListing.findFirst({
          where: { legacyListingId: oldListing.id }
        });

        if (!exists) {
          await marketplacePrisma.serviceListing.create({
            data: {
              legacyListingId: oldListing.id,
              providerId: await resolveProviderId(oldListing.tenantId),
              // ... map fields
            }
          });
          syncedCount++;
        }
      } catch (error) {
        logger.error('Sync failed', { listingId: oldListing.id, error });
        errorCount++;
      }
    }

    offset += batchSize;

    // Rate limiting (don't overload DB)
    await sleep(1000);
  }

  logger.info('Historical sync complete', { syncedCount, errorCount });
}
```

**Run Sync Job**:
```bash
# Start background sync
npm run migrate:sync-historical-listings

# Monitor progress
tail -f logs/migration.log | grep "Historical sync"
```

---

## Phase 3: Data Migration

**Duration**: 3-5 days
**Downtime**: None (dual-write keeps data in sync)

### Step 3.1: Verify Data Consistency

Before cutover, verify old and new data match:

```sql
-- Migration: 004_verify_data_consistency.sql

-- Count records in both locations
SELECT 'Old listings' AS source, COUNT(*) AS count
FROM marketplace_listings WHERE status = 'ACTIVE'
UNION ALL
SELECT 'New listings' AS source, COUNT(*) AS count
FROM marketplace.service_listings WHERE status = 'active';

-- Find listings in old but not in new
SELECT ml.id, ml.title
FROM marketplace_listings ml
LEFT JOIN marketplace.service_listings sl ON ml.id = sl.legacy_listing_id
WHERE ml.status = 'ACTIVE'
  AND sl.id IS NULL;

-- Find listings in new but not in old
SELECT sl.id, sl.title
FROM marketplace.service_listings sl
LEFT JOIN marketplace_listings ml ON sl.legacy_listing_id = ml.id
WHERE sl.status = 'active'
  AND ml.id IS NULL;
```

**Expected Result**: Counts should match, no orphaned records

### Step 3.2: Validate Cross-Database References

```sql
-- Verify all marketplace transactions reference valid invoices
SELECT mt.id, mt.tenant_invoice_id
FROM marketplace.transactions mt
LEFT JOIN invoices i ON mt.tenant_invoice_id = i.id
WHERE mt.tenant_invoice_id IS NOT NULL
  AND i.id IS NULL;

-- Should return 0 rows

-- Verify all contacts with marketplace_user_id have corresponding marketplace user
-- (This requires application-level validation if databases are truly separate)
```

---

## Phase 4: Validation

**Duration**: 2-3 days
**Downtime**: None

### Step 4.1: Shadow Reads

Read from both old and new, compare results:

```typescript
async function getListingWithShadowRead(id: number) {
  const [oldListing, newListing] = await Promise.all([
    prisma.marketplaceListing.findUnique({ where: { id } }),
    marketplacePrisma.serviceListing.findFirst({
      where: { legacyListingId: id }
    })
  ]);

  // Compare results
  const fieldsMatch = compareListings(oldListing, newListing);

  if (!fieldsMatch) {
    logger.warn('Shadow read mismatch', {
      oldListing,
      newListing,
      diffs: getDifferences(oldListing, newListing)
    });
    metrics.increment('marketplace.shadow_read.mismatch');
  }

  // Still return old listing (read path not switched yet)
  return oldListing;
}
```

### Step 4.2: Automated Consistency Checks

Run automated job every hour:

```typescript
async function validateConsistency() {
  const checks = [
    validateListingCounts(),
    validateTransactionCounts(),
    validateCrossDbReferences(),
    validateInvoiceStates(),
    validatePaymentModes()
  ];

  const results = await Promise.allSettled(checks);

  for (const [index, result] of results.entries()) {
    if (result.status === 'rejected') {
      logger.error('Consistency check failed', {
        check: checks[index].name,
        error: result.reason
      });
      metrics.increment('marketplace.consistency_check.failed');
    }
  }
}
```

---

## Phase 5: Cutover

**Duration**: 1 day (actual cutover: minutes)
**Downtime**: Optional 5-minute maintenance window for safet y

### Step 5.1: Pre-Cutover Checklist

**REQUIRED**:
- [ ] Dual-write success rate >99% for 48 hours
- [ ] Data consistency validation passed
- [ ] Shadow read mismatches <0.1%
- [ ] Performance benchmarks meet targets
- [ ] Rollback procedure tested in staging
- [ ] Team on standby

### Step 5.2: Read Cutover

**Gradual Rollout** (recommended):

```typescript
// Feature flag: % of traffic to read from new
export const MARKETPLACE_READ_NEW_PERCENTAGE = parseInt(
  process.env.MARKETPLACE_READ_NEW_PCT || '0'
);

async function getListing(id: number) {
  // Gradually increase % reading from new
  const readFromNew = Math.random() * 100 < MARKETPLACE_READ_NEW_PERCENTAGE;

  if (readFromNew && MARKETPLACE_READ_FROM_NEW) {
    return await marketplacePrisma.serviceListing.findFirst({
      where: { legacyListingId: id }
    });
  } else {
    return await prisma.marketplaceListing.findUnique({
      where: { id }
    });
  }
}
```

**Rollout Schedule**:
1. 10% of traffic → Monitor for 4 hours
2. 25% of traffic → Monitor for 4 hours
3. 50% of traffic → Monitor for 8 hours
4. 100% of traffic → Monitor for 24 hours

**Rollback Trigger**: Error rate increase >0.5%

### Step 5.3: Write Cutover

Once reads are stable at 100% new:

```typescript
async function createListing(data: CreateListingData) {
  // Stop writing to old location
  const newListing = await marketplacePrisma.serviceListing.create({
    data: {
      providerId: data.providerId,
      title: data.title,
      // ... other fields
    }
  });

  // Keep old table in sync for safety (optional, 1 week)
  if (MARKETPLACE_KEEP_OLD_SYNC) {
    await prisma.marketplaceListing.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        // ... map back to old schema
      }
    }).catch(err => {
      // Don't fail request if old write fails
      logger.warn('Old table sync failed', { err });
    });
  }

  return newListing;
}
```

---

## Phase 6: Cleanup

**Duration**: 1-2 weeks
**Downtime**: None

### Step 6.1: Remove Dual-Write Code

Wait 1 week after write cutover, then remove dual-write code:

```typescript
// Remove all MARKETPLACE_DUAL_WRITE_ENABLED checks
// Remove old database client initialization
// Remove old table queries
```

### Step 6.2: Archive Old Tables

**Do NOT drop tables immediately!**

```sql
-- Migration: 005_archive_old_tables.sql

-- Rename old tables (keep for 90 days minimum)
ALTER TABLE marketplace_listings RENAME TO marketplace_listings_archived;
ALTER TABLE marketplace_listing_images RENAME TO marketplace_listing_images_archived;

-- Document archive date
COMMENT ON TABLE marketplace_listings_archived IS
  'Archived 2026-02-15. Safe to drop after 2026-05-15.';
```

### Step 6.3: Drop Old Columns (After 90 Days)

```sql
-- Migration: 006_drop_old_columns.sql
-- Run this ONLY after 90 days and verification

BEGIN;

-- Remove archived tables
DROP TABLE IF EXISTS marketplace_listings_archived CASCADE;
DROP TABLE IF EXISTS marketplace_listing_images_archived CASCADE;

-- Remove unused columns
ALTER TABLE invoices DROP COLUMN IF EXISTS legacy_marketplace_id;

COMMIT;
```

---

## Rollback Procedures

### Rollback Scenario 1: During Dual-Write Phase

**Symptoms**: Dual-write failures >5%, data sync issues

**Procedure**:
1. **Immediate**: Set `MARKETPLACE_DUAL_WRITE_ENABLED=false`
2. Deploy code change (5 minutes)
3. Verify old code path working normally
4. Investigate sync failures
5. Fix issues in new code
6. Re-enable dual-write after fixes validated

**Data Impact**: None (old system still authoritative)

---

### Rollback Scenario 2: After Read Cutover (Reads from New)

**Symptoms**: Error rate spike, missing data, performance degradation

**Procedure**:
1. **Immediate**: Set `MARKETPLACE_READ_NEW_PERCENTAGE=0`
2. Deploy config change (2 minutes)
3. Verify error rate returns to baseline
4. Analyze root cause (slow queries? missing indexes? data inconsistency?)
5. Fix issues
6. Re-attempt cutover with 10% traffic

**Data Impact**: None (writes still dual-write or old-only)

---

### Rollback Scenario 3: After Write Cutover (Critical)

**Symptoms**: Data loss, corruption, payment failures

**Procedure** (CRITICAL - REQUIRES DOWNTIME):

1. **Immediate**: Enable maintenance mode (5 minutes)
   ```bash
   curl -X POST https://api.breederhq.com/admin/maintenance/enable
   ```

2. **Revert code**: Deploy previous version
   ```bash
   git revert <migration-commit>
   git push production
   ```

3. **Restore database** (point-in-time):
   ```bash
   # Restore to WAL position before write cutover
   pg_restore -U postgres -d breederhq_temp /backup/breederhq_pre_cutover.dump

   # Apply WAL logs up to cutover point
   pg_basebackup -D /var/lib/postgresql/data -R -X stream
   ```

4. **Sync data forward**:
   - Export new records created after cutover
   - Import into old schema
   - Verify data integrity

5. **Disable maintenance mode**

**Data Impact**: Potential loss of data created during rollback window (minimize with quick response)

**Prevention**: Always maintain point-in-time backup before write cutover

---

## Monitoring and Alerts

### Critical Metrics

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Dual-write success rate | <95% | Warning |
| Dual-write success rate | <90% | Critical |
| Dual-write latency | >500ms p95 | Warning |
| Data consistency check failure | Any | Critical |
| Cross-DB query latency | >200ms p95 | Warning |
| Invoice state transition error | >1% | Critical |
| Payment processing error | >0.5% | Critical |

### Dashboard Requirements

**Migration Health Dashboard**:
- Dual-write success rate (24h rolling)
- Data consistency check results (hourly)
- Shadow read match rate
- Read cutover % and error rate by cohort
- Write cutover status and error rate

**Database Performance Dashboard**:
- Query latency by table (p50, p95, p99)
- Connection pool utilization
- Replication lag (if applicable)
- Disk I/O and space usage
- Index hit rate

---

## Post-Migration Checklist

After migration is complete:

- [ ] All consistency checks passing for 7 days
- [ ] Performance metrics meet or exceed baseline
- [ ] No data loss or corruption reported
- [ ] Old tables archived (not dropped)
- [ ] Dual-write code removed
- [ ] Documentation updated
- [ ] Team debriefed on lessons learned
- [ ] Monitoring alerts tuned based on production behavior

---

## Appendix: SQL Scripts

### Full Migration Script (Production-Safe)

```sql
-- ============================================================================
-- PRODUCTION MIGRATION SCRIPT
-- Run each section separately, verify before proceeding
-- ============================================================================

-- PRE-MIGRATION BACKUP
-- Run this BEFORE starting migration
-- pg_dump -U postgres -d breederhq -F c -f /backup/pre_migration.dump

-- ============================================================================
-- PHASE 1: SCHEMA PREPARATION
-- ============================================================================

-- 1.1: Add columns (in transaction)
BEGIN;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS marketplace_payment_mode VARCHAR(50);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marketplace_user_id INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_marketplace_invoice BOOLEAN DEFAULT FALSE;
COMMIT;

-- 1.2: Add indexes (CONCURRENTLY, outside transaction)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_marketplace_user_tenant
  ON contacts(marketplace_user_id, tenant_id)
  WHERE marketplace_user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_marketplace_transaction
  ON invoices(tenant_id, is_marketplace_invoice, status)
  WHERE is_marketplace_invoice = TRUE;

-- 1.3: Set defaults
BEGIN;
UPDATE tenants SET marketplace_payment_mode = 'manual' WHERE marketplace_payment_mode IS NULL;
ALTER TABLE tenants ALTER COLUMN marketplace_payment_mode SET NOT NULL;
ALTER TABLE tenants ADD CONSTRAINT chk_marketplace_payment_mode
  CHECK (marketplace_payment_mode IN ('stripe', 'manual', 'disabled'));
COMMIT;

-- VERIFICATION
SELECT COUNT(*) FROM tenants WHERE marketplace_payment_mode IS NULL; -- Should be 0

-- ============================================================================
-- PHASE 2-5: Application-Level (Code Deploy)
-- ============================================================================
-- Deploy dual-write code
-- Run background sync job
-- Monitor consistency
-- Cutover reads (gradual)
-- Cutover writes

-- ============================================================================
-- PHASE 6: CLEANUP (90 days after cutover)
-- ============================================================================

BEGIN;
-- Archive old tables
ALTER TABLE marketplace_listings RENAME TO marketplace_listings_archived;
COMMENT ON TABLE marketplace_listings_archived IS 'Archived on cutover date. Safe to drop after 90 days.';
COMMIT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-12
**Status**: Required for Production Deployment

