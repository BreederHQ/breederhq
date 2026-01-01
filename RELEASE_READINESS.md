# Release Readiness: Cycle Length Override v1

## Pre-Deployment Checklist

### Code Quality
- [x] Feature implemented according to spec
- [x] All code committed to dev branch
- [x] No console.log/debugger statements in production code
- [x] TypeScript compilation passes (no errors)
- [ ] ESLint passes with no warnings
- [x] Prisma schema updated with override field
- [x] Migration created

### Database
- [x] Migration file created: `20260101121151_add_female_cycle_len_override`
- [x] Migration adds `femaleCycleLenOverrideDays INTEGER` column
- [x] Column is nullable (default NULL)
- [ ] Migration tested on staging database
- [x] Rollback script prepared (ALTER TABLE DROP COLUMN)

### API (Fastify)
- [x] Route handlers updated (PATCH /animals/:id, GET /animals/:id)
- [x] Validation logic (30-730 range, integer check)
- [x] Error responses with correct status codes (400)
- [x] Server entry point exists (`src/server.ts`)
- [ ] API tested with curl (requires auth setup)

### Frontend
- [x] ReproEngine precedence logic (Override > History > Biology)
- [x] Conflict detection (>20% threshold)
- [x] Animals UI (input, save, clear, warning)
- [x] Breeding what-if planner integration
- [x] Type definitions updated
- [ ] UI package built and tested
- [ ] Manual verification completed (see FRONTEND_RUNTIME_VERIFICATION.md)

### Documentation
- [x] API endpoints documented
- [x] Migration documented
- [x] Runtime verification procedures written
- [ ] User-facing documentation (if needed)

## Staging Deployment Steps

### 1. Pre-Deployment
```bash
# Ensure on dev branch
cd c:/Users/Aaron/Documents/Projects/breederhq
git checkout dev
git pull origin dev

# Verify clean working tree
git status

# Build frontend packages
npm -C ./packages/ui run build
npm -C ./apps/animals run build
npm -C ./apps/breeding run build

# Build backend
cd ../breederhq-api
npm run build
```

### 2. Database Migration (Staging)
```bash
cd c:/Users/Aaron/Documents/Projects/breederhq-api

# Set environment to staging
# Edit .env.prod.migrate with staging DATABASE_URL

# Check migration status
npm run db:prod:status

# Apply migration
npm run db:prod:deploy

# Verify column exists
npm run db:prod:validate:schema
```

Or manually verify:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Animal'
  AND column_name = 'femaleCycleLenOverrideDays';
```

Expected:
```
 femaleCycleLenOverrideDays | integer | YES
```

### 3. Backend Deployment (Staging)

```bash
cd c:/Users/Aaron/Documents/Projects/breederhq-api

# Install dependencies
npm ci

# Generate Prisma client
npm run prisma:gen

# Build TypeScript
npm run build

# Start production server (or deploy to hosting)
npm run start
```

**Server Details**:
- Framework: Fastify 5.x
- Entry point: `dist/server.js` (compiled from `src/server.ts`)
- Port: 3000 (default, configurable via PORT env var)
- Routes: `/api/v1/animals/*`

### 4. Frontend Deployment (Staging)

```bash
cd c:/Users/Aaron/Documents/Projects/breederhq

# Deploy to staging (example for Vercel)
vercel deploy --env staging

# Or build for static hosting
npm run build:platform
# Deploy dist/ to hosting provider
```

### 5. Smoke Test (5 minutes)

**Backend Smoke Test** (requires valid session):

See RUNTIME_VERIFICATION.md in the separate breederhq-api repository for full test procedures.

Quick checklist:
- [ ] GET /api/v1/animals/:id returns `femaleCycleLenOverrideDays: null`
- [ ] PATCH with `{"femaleCycleLenOverrideDays": 150}` returns 200
- [ ] PATCH with `{"femaleCycleLenOverrideDays": 29}` returns 400
- [ ] PATCH with `{"femaleCycleLenOverrideDays": null}` returns 200

**Frontend Smoke Test**:

1. Open Animals app
2. Navigate to female animal
3. Go to Cycle Info tab
4. Verify override input field visible
5. Enter `120`, click Save
6. Refresh page → value persists
7. Clear override → warning disappears

## Production Deployment Steps

### 1. Merge to Main
```bash
cd c:/Users/Aaron/Documents/Projects/breederhq
git checkout main
git pull origin main
git merge dev --no-ff -m "feat: Cycle Length Override v1"
git push origin main
```

### 2. Database Migration (Production)

**CRITICAL**: Run during maintenance window or low-traffic period

```bash
cd c:/Users/Aaron/Documents/Projects/breederhq-api

# BACKUP FIRST
# Use appropriate backup command for your hosting provider

# Set .env.prod.migrate with production DATABASE_URL

# Apply migration
npm run db:prod:deploy

# Verify
npm run db:prod:validate:schema

# Sanity check: all existing animals should have NULL override
```

SQL sanity check:
```sql
SELECT COUNT(*) as total,
       COUNT("femaleCycleLenOverrideDays") as with_override
FROM "Animal";

-- Expected: with_override = 0 (all NULL initially)
```

### 3. Deploy Application Code

Follow your deployment process for:
- Backend API (breederhq-api)
- Frontend apps (platform, animals, breeding)

### 4. Production Smoke Test (2 minutes)

```bash
# Test API is responding
curl https://api.breederhq.com/api/v1/animals/1 \
  -H "Cookie: ..." \
  -H "x-tenant-id: 1"

# Look for femaleCycleLenOverrideDays field in response
```

**Manual UI Check**:
1. Open production Animals app
2. Navigate to female animal
3. Verify Cycle Info tab loads
4. Verify override input visible
5. Do NOT save values yet

### 5. Post-Deployment Monitoring (First 24 hours)

#### Metrics to Watch
- **API Error Rate**: Watch for 400 errors on PATCH /animals/:id
- **Database Performance**: Monitor query times on `Animal` table
- **Frontend Error Rate**: Watch for TypeScript/reproEngine errors

#### Logs to Monitor
```bash
# Backend logs (adjust for your system)
tail -f /var/log/api/error.log | grep -i "cycle\|override"

# Watch for:
# - "invalid_cycle_len_override" (expected when users try invalid values)
# - Unexpected 500 errors (NOT expected)
```

#### Database Queries
```sql
-- Check adoption rate
SELECT COUNT(*) as animals_with_override
FROM "Animal"
WHERE "femaleCycleLenOverrideDays" IS NOT NULL;

-- Check value distribution
SELECT "femaleCycleLenOverrideDays", COUNT(*) as count
FROM "Animal"
WHERE "femaleCycleLenOverrideDays" IS NOT NULL
GROUP BY "femaleCycleLenOverrideDays"
ORDER BY count DESC
LIMIT 10;

-- Check for invalid values (should be impossible)
SELECT id, "femaleCycleLenOverrideDays"
FROM "Animal"
WHERE "femaleCycleLenOverrideDays" IS NOT NULL
  AND ("femaleCycleLenOverrideDays" < 30 OR "femaleCycleLenOverrideDays" > 730);

-- Expected: 0 rows
```

## Rollback Plan

### If Critical Bug Found Within 1 Hour

#### Option A: Revert Code Only
```bash
git revert <commit-hash>
git push origin main
# Redeploy
```

Database column can remain (no harm if unused).

#### Option B: Full Rollback (DESTRUCTIVE)

**Backup override data first**:
```sql
CREATE TABLE "Animal_override_backup" AS
SELECT id, "femaleCycleLenOverrideDays"
FROM "Animal"
WHERE "femaleCycleLenOverrideDays" IS NOT NULL;
```

**Remove column**:
```sql
ALTER TABLE "Animal" DROP COLUMN "femaleCycleLenOverrideDays";
```

**Restore later** (after fix):
```sql
ALTER TABLE "Animal" ADD COLUMN "femaleCycleLenOverrideDays" INTEGER;

UPDATE "Animal" a
SET "femaleCycleLenOverrideDays" = b."femaleCycleLenOverrideDays"
FROM "Animal_override_backup" b
WHERE a.id = b.id;
```

## Success Criteria

### Immediate (Day 1)
- [ ] Zero 500 errors related to cycle override
- [ ] Migration applied successfully
- [ ] API validation works (400 for invalid values)
- [ ] Frontend loads without errors

### Week 1
- [ ] At least 5 users have set overrides
- [ ] No data corruption reports
- [ ] No performance degradation
- [ ] Conflict warnings appear appropriately

### Month 1
- [ ] Feature adoption >10% of active breeding users
- [ ] Zero reports of incorrect cycle projections
- [ ] Positive user feedback

## Known Issues

None currently. Previous documentation incorrectly claimed "server entry point missing" - this was false. The server exists at `src/server.ts` using Fastify.

## Support Checklist

- [ ] Customer support briefed on feature
- [ ] Help documentation updated
- [ ] Support ticket tags created
- [ ] Escalation path defined for calculation errors
- [ ] Sample support responses prepared

## Communication Plan

### Pre-Launch
- [ ] Notify key users/beta testers
- [ ] Update changelog/release notes

### Launch Day
- [ ] Monitor support channels
- [ ] Watch for feedback
- [ ] Be ready to disable if needed

### Post-Launch
- [ ] Collect user feedback
- [ ] Measure adoption metrics
- [ ] Schedule retrospective
