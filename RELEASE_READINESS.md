# Release Readiness: Cycle Length Override v1

## Pre-Deployment Checklist

### Code Quality
- [x] Feature implemented according to spec
- [x] All code committed to dev branch
- [x] No console.log/debugger statements in production code
- [x] TypeScript compilation passes (no errors)
- [ ] ESLint passes with no warnings
- [ ] Tests documented (cannot run without framework)

### Database
- [x] Migration file created: `20260101113710_add_cycle_len_override`
- [x] Migration adds `femaleCycleLenOverrideDays INTEGER` column
- [x] Column is nullable (default NULL)
- [x] Migration includes documentation comment
- [ ] Migration tested on staging database
- [ ] Rollback script prepared (ALTER TABLE DROP COLUMN)

### API
- [x] Route handlers implemented (updateAnimal, getAnimal)
- [x] Validation logic (30-730 range, integer check)
- [x] Error responses with correct status codes (400)
- [ ] Server entry point created (BLOCKER - see defects)
- [ ] API tested with curl (pending server)

### Frontend
- [x] ReproEngine precedence logic (Override > History > Biology)
- [x] Conflict detection (>20% threshold)
- [x] Animals UI (input, save, clear, warning)
- [x] Breeding what-if planner integration
- [x] Type definitions updated
- [ ] UI package built and tested
- [ ] Manual verification completed (see FRONTEND_RUNTIME_VERIFICATION.md)

### Documentation
- [x] API endpoints documented in README
- [x] Migration documented
- [x] Runtime verification procedures written
- [x] Test specifications created
- [ ] User-facing documentation (if needed)

## Staging Deployment Steps

### 1. Pre-Deployment
```bash
# Ensure on dev branch
git checkout dev
git pull origin dev

# Verify clean working tree
git status

# Run builds
npm -C ./packages/ui run build
npm -C ./apps/animals run build
npm -C ./apps/breeding run build

# Check for build errors
echo "Build status: $?"
```

### 2. Database Migration (Staging)
```bash
# Connect to staging database
# Set DATABASE_URL to staging connection string

cd breederhq-api

# Dry run (review SQL)
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource prisma/schema.prisma \
  --script

# Apply migration
npm run migrate:deploy

# Verify column exists
psql $DATABASE_URL -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'animals'
    AND column_name = 'femaleCycleLenOverrideDays';
"
```

Expected output:
```
      column_name           | data_type | is_nullable
----------------------------+-----------+-------------
 femaleCycleLenOverrideDays | integer   | YES
```

### 3. Backend Deployment (Staging)

**BLOCKER**: Cannot deploy without server entry point (src/index.ts)

Once blocker resolved:
```bash
cd breederhq-api

# Install dependencies
npm ci

# Generate Prisma client
npm run generate

# Start API server
npm run dev  # or production start script
```

### 4. Frontend Deployment (Staging)

```bash
cd breederhq

# Deploy to staging (command depends on hosting)
# Example for Vercel:
npm run build:platform
vercel deploy --env staging

# Or for static hosting:
npm run build:platform
# Copy dist/ to staging server
```

### 5. Smoke Test (5 minutes)

**On staging environment:**

#### Backend Smoke Test
```bash
# Replace with staging API URL
API_URL="https://api-staging.breederhq.com"

# Test 1: GET animal (should include new field)
curl $API_URL/api/v1/animals/1 | jq '.femaleCycleLenOverrideDays'

# Test 2: PATCH valid value
curl -X PATCH $API_URL/api/v1/animals/1 \
  -H "Content-Type: application/json" \
  -d '{"femaleCycleLenOverrideDays": 150}' \
  | jq '.femaleCycleLenOverrideDays'

# Expected: 150

# Test 3: PATCH invalid value (should fail)
curl -X PATCH $API_URL/api/v1/animals/1 \
  -H "Content-Type: application/json" \
  -d '{"femaleCycleLenOverrideDays": 10}' \
  | jq '.error'

# Expected: "invalid_cycle_len_override"

# Test 4: PATCH to null (clear)
curl -X PATCH $API_URL/api/v1/animals/1 \
  -H "Content-Type: application/json" \
  -d '{"femaleCycleLenOverrideDays": null}' \
  | jq '.femaleCycleLenOverrideDays'

# Expected: null
```

#### Frontend Smoke Test
1. Open Animals app in staging
2. Navigate to a female animal
3. Go to Cycle Info tab
4. Enter override value `120`
5. Click Save
6. Verify:
   - Next heat date updates
   - Page refresh persists value
7. Enter conflicting override (>20% from history)
8. Verify yellow warning appears
9. Clear override
10. Verify warning disappears
11. Open Breeding app
12. Select same female in what-if planner
13. Verify projected cycles use override interval

**Pass Criteria**: All 13 steps complete without errors

## Production Deployment Steps

### 1. Merge to Main
```bash
# From dev branch with all tests passing
git checkout main
git pull origin main
git merge dev --no-ff -m "feat: Cycle Length Override v1"
git push origin main
```

### 2. Database Migration (Production)

**CRITICAL**: Run during maintenance window or low-traffic period

```bash
# Set DATABASE_URL to production
export DATABASE_URL="postgresql://..."

cd breederhq-api

# BACKUP FIRST
pg_dump $DATABASE_URL > backup_pre_cycle_override_$(date +%Y%m%d_%H%M%S).sql

# Apply migration
npm run migrate:deploy

# Verify
psql $DATABASE_URL -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'animals'
    AND column_name = 'femaleCycleLenOverrideDays';
"

# Sanity check: all existing animals should have NULL override
psql $DATABASE_URL -c "
  SELECT COUNT(*) as total,
         COUNT(\"femaleCycleLenOverrideDays\") as with_override
  FROM animals;
"

# Expected: with_override = 0 (all NULL initially)
```

### 3. Deploy Application Code

```bash
# Deploy backend
cd breederhq-api
# [Your deployment process]

# Deploy frontend
cd breederhq
npm run build
# [Your deployment process]
```

### 4. Production Smoke Test (2 minutes)

```bash
# Test API is responding
curl https://api.breederhq.com/api/v1/animals/1 | jq '.femaleCycleLenOverrideDays'

# Expected: null (no overrides set yet)
```

**Manual UI Check**:
1. Open production Animals app
2. Navigate to any female animal
3. Verify Cycle Info tab loads
4. Verify override input field visible
5. Do NOT save any values yet
6. Close tab

### 5. Post-Deployment Monitoring (First 24 hours)

#### Metrics to Watch
- **API Error Rate**: Should remain stable
  - Watch for 400 errors on PATCH /animals/:id
  - Any spike indicates validation issues
- **Database Performance**: Column addition should have no impact
  - Monitor query times on `animals` table
  - Watch for table lock issues (should be none)
- **Frontend Error Rate**: Should remain stable
  - Watch for TypeScript errors in browser console
  - Monitor reproEngine calculation errors

#### Logs to Monitor
```bash
# Backend logs (adjust for your logging system)
tail -f /var/log/breederhq-api/error.log | grep -i "cycle"

# Watch for:
# - "invalid_cycle_len_override" errors (expected when users try invalid values)
# - Unexpected 500 errors (NOT expected)
# - Prisma query failures (NOT expected)
```

#### Database Queries
```sql
-- Check adoption rate (how many users set overrides)
SELECT COUNT(*) as animals_with_override
FROM animals
WHERE "femaleCycleLenOverrideDays" IS NOT NULL;

-- Check value distribution
SELECT "femaleCycleLenOverrideDays", COUNT(*) as count
FROM animals
WHERE "femaleCycleLenOverrideDays" IS NOT NULL
GROUP BY "femaleCycleLenOverrideDays"
ORDER BY count DESC
LIMIT 10;

-- Check for invalid values (should be impossible due to validation)
SELECT id, "femaleCycleLenOverrideDays"
FROM animals
WHERE "femaleCycleLenOverrideDays" IS NOT NULL
  AND ("femaleCycleLenOverrideDays" < 30 OR "femaleCycleLenOverrideDays" > 730);

-- Expected: 0 rows
```

## Rollback Plan

### If Critical Bug Found Within 1 Hour of Deployment

#### Option A: Revert Code Only (if database migration not the issue)
```bash
git revert <commit-hash>
git push origin main
# Redeploy previous version
```

Database column can remain (no harm if unused).

#### Option B: Full Rollback (if database migration causes issues)

**Backend Rollback**:
```bash
# Redeploy previous API version
git checkout <previous-commit>
# Deploy
```

**Database Rollback** (DESTRUCTIVE - loses all override data):
```sql
-- BACKUP FIRST
CREATE TABLE animals_override_backup AS
SELECT id, "femaleCycleLenOverrideDays"
FROM animals
WHERE "femaleCycleLenOverrideDays" IS NOT NULL;

-- Remove column
ALTER TABLE animals DROP COLUMN "femaleCycleLenOverrideDays";
```

**Frontend Rollback**:
```bash
# Redeploy previous UI version
git checkout <previous-commit>
npm run build
# Deploy
```

**Restore After Fix**:
```sql
-- Re-add column
ALTER TABLE animals ADD COLUMN "femaleCycleLenOverrideDays" INTEGER;

-- Restore data
UPDATE animals a
SET "femaleCycleLenOverrideDays" = b."femaleCycleLenOverrideDays"
FROM animals_override_backup b
WHERE a.id = b.id;
```

### If Bug Found After 24 Hours

- **Do NOT rollback** - too risky to lose user data
- Create hotfix branch from main
- Fix bug, test on staging
- Deploy hotfix to production
- Merge hotfix back to dev and main

## Success Criteria

### Immediate (Day 1)
- [ ] Zero 500 errors related to cycle override
- [ ] Migration applied successfully (column exists)
- [ ] API validation works (400 errors for invalid values)
- [ ] Frontend loads without errors

### Week 1
- [ ] At least 5 users have set overrides (proves feature is discoverable)
- [ ] No data corruption reports
- [ ] No performance degradation
- [ ] Conflict warnings appear when appropriate

### Month 1
- [ ] Feature adoption >10% of active breeding users
- [ ] Zero reports of incorrect cycle projections
- [ ] Positive user feedback on accuracy improvement

## Known Limitations

1. **No server entry point**: Backend routes exist but server.ts/index.ts missing
   - Impact: Cannot run API standalone
   - Workaround: Create src/index.ts before staging deployment
   - Tracked in: Defects section

2. **No test framework**: Tests documented but not executable
   - Impact: Cannot run automated regression tests
   - Workaround: Manual verification procedures provided
   - Tracked in: Defects section

3. **No test database**: Cannot test migration in isolation
   - Impact: Higher risk on staging deployment
   - Mitigation: Backup before migrate, manual verification

4. **No UI tests**: Frontend behavior not automatically verified
   - Impact: Manual smoke testing required
   - Mitigation: Detailed click-path procedures provided

## Feature Flags / Kill Switch

**Current Status**: No feature flag implemented

**Recommendation**: Add feature flag for post-launch control:

```typescript
// In Animals app
const CYCLE_OVERRIDE_ENABLED = import.meta.env.VITE_FEATURE_CYCLE_OVERRIDE !== 'false';

// Conditionally render override UI
{CYCLE_OVERRIDE_ENABLED && (
  <div>
    {/* Override input field */}
  </div>
)}
```

**Benefit**: Can disable feature without code deployment if critical bug found.

## Support Checklist

- [ ] Customer support team briefed on new feature
- [ ] Help documentation updated (if exists)
- [ ] Support ticket tags created (e.g., "cycle-override")
- [ ] Escalation path defined for calculation errors
- [ ] Sample support responses prepared:
  - "What is cycle length override?"
  - "Why do I see a warning?"
  - "How do I clear an override?"

## Communication Plan

### Pre-Launch
- [ ] Notify key users/beta testers
- [ ] Update changelog/release notes
- [ ] Prepare blog post or announcement (if applicable)

### Launch Day
- [ ] Monitor support channels for questions
- [ ] Watch social media for feedback
- [ ] Be ready to disable feature if needed

### Post-Launch
- [ ] Collect user feedback
- [ ] Measure adoption metrics
- [ ] Schedule retrospective
